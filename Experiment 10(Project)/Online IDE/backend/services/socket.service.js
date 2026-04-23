const WebSocket = require("ws");
const jwt = require("jsonwebtoken");
const Docker = require("dockerode");
const cookie = require("cookie");
const { spawnContainer } = require("./docker.service");
const Map = require("../models/map.model");

const docker = new Docker({ socketPath: '/var/run/docker.sock' });
const wss = new WebSocket.Server({ noServer: true });

function handleDockerStream(chunk, clientWs, isResizing) {
    // If we are currently in the middle of a resize command, 
    // we drop the incoming data (which contains the echoed stty command)
    if (isResizing || clientWs.readyState !== WebSocket.OPEN) return;

    let offset = 0;
    while (offset < chunk.length) {
        if (chunk.length >= offset + 8 && chunk[offset] < 3 && chunk[offset + 1] === 0) {
            const size = chunk.readUInt32BE(offset + 4);
            const payload = chunk.slice(offset + 8, offset + 8 + size);
            clientWs.send(payload);
            offset += 8 + size;
        } else {
            clientWs.send(chunk.slice(offset));
            break;
        }
    }
}

exports.handleUpgrade = async (req, socket, head) => {
    try {
        const rawCookies = req.headers.cookie || "";
        const parsedCookies = cookie.parse(rawCookies);
        const token = parsedCookies.token;

        if (!token) {
            socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
            return socket.destroy();
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = payload.userId;
        const mapping = await spawnContainer(userId);

        wss.handleUpgrade(req, socket, head, (clientWs) => {
            connectDirectPTY(clientWs, mapping.containerId, userId);
        });
    } catch (err) {
        console.error("❌ Socket Upgrade Error:", err.message);
       wss.handleUpgrade(req, socket, head, (clientWs) => {
            clientWs.close(4001, "Session Expired");
        });
    }
};

async function connectDirectPTY(clientWs, containerId, userId) {
    let execRef = null;
    let resizeTimer = null;
    // We move this state into an object so it can be updated by reference inside the scope
    const state = { isResizing: false };

    try {
        const container = docker.getContainer(containerId);

        const exec = await container.exec({
            Cmd: ["/bin/bash", "--login"], 
            AttachStdin: true,
            AttachStdout: true,
            AttachStderr: true,
            Tty: true,
            User: "codeuser",
            Env: [
                "TERM=xterm-256color",
                "HOME=/home/codeuser",
                "PS1=\\[\\e[32m\\]\\u@\\h\\[\\e[0m\\]:\\[\\e[34m\\]\\w\\[\\e[0m\\]\\$ "
            ]
        });

        const stream = await exec.start({ stdin: true, hijack: true });
        execRef = exec;

        // Clean start
        stream.write("stty sane && shopt -s checkwinsize && clear\n");

        stream.on("data", (chunk) => {
            // Pass the current state.isResizing to the stream handler
            handleDockerStream(chunk, clientWs, state.isResizing);
        });

        clientWs.on("message", async (data) => {
            try {
                const str = data.toString();
                if (str.includes('"type":"resize"')) {
                    const { cols, rows } = JSON.parse(str);

                    if (execRef && !isNaN(cols) && !isNaN(rows)) {
                        // 1. Enter Resizing State (Blocks outgoing traffic to frontend)
                        state.isResizing = true;
                        // Clear existing timer if user is dragging fast
                        if (resizeTimer) clearTimeout(resizeTimer);
                        
                        
                        // 2. Execute the PTY and Bash resize
                        await execRef.resize({ cols, rows }).catch(() => {});
                        
                        // The space before the command helps prevent some shells from logging it to history
                        const updateCmd = ` stty cols ${cols} rows ${rows} && kill -WINCH $$ 2>/dev/null\n`;
                        stream.write(updateCmd);

                        // 3. Exit Resizing State after a short delay
                        // This delay must be long enough for Bash to execute the stty and echo it back
                        resizeTimer = setTimeout(() => { 
                            state.isResizing = false; 
                            resizeTimer = null;
                        }, 1000); 
                    }
                    return;
                }
            } catch (e) {}

            if (stream.writable) {
                stream.write(data);
            }
        });

        const cleanup = () => {
            if (stream) stream.end();
            if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
        };

        stream.on("end", cleanup);
        clientWs.on("close", cleanup);
    } catch (err) {
        console.error("❌ PTY Bridge Error:", err.message);
    }
}