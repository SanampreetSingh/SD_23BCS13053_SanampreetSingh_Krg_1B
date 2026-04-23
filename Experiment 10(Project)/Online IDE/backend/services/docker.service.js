const Docker = require("dockerode");
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

const Map = require("../models/map.model");
const path = require("path");
const fs = require("fs");

/**
 * Handles spawning a new workspace container or syncing an existing one.
 */

exports.spawnContainer = async (userId) => {
    const containerName = `ide-user-${userId}`;
    let mapping = await Map.findOne({ userId });

   // 1. DOCKER ENGINE CHECK (Handles Zombie Containers)
    const existingContainer = docker.getContainer(containerName);
    try {
        const info = await existingContainer.inspect();
        
        // If container exists in Docker but not in DB, sync it
        if (!mapping) {
            mapping = await Map.create({
                userId,
                containerId: info.Id,
                status: info.State.Running ? "active" : "inactive",
                lastActive: new Date()
            });
        }

        // If it's not running, resume it
        if (!info.State.Running) {
            return await this.resumeContainer(mapping);
        }

        return mapping;
    } catch (err) {
        // If inspect fails, container doesn't exist by name in Docker.
        // If DB has a mapping, it's stale; delete it.
        if (mapping) {
            await Map.deleteOne({ userId });
            mapping = null;
        }
    }

  // 2. VOLUME SETUP
    const volumePath = path.join(process.env.VOLUME_BASE_PATH || "/home/volumes", userId.toString());
    if (!fs.existsSync(volumePath)) {
        fs.mkdirSync(volumePath, { recursive: true });
    }

    // CREATE CONTAINER (No Port Mapping Needed)
try {
        const container = await docker.createContainer({
            Image: "ide-workspace:latest",
            name: containerName,
            Tty: true,
            OpenStdin: true,
            Env: [
                `USER_ID=${userId}`,
                `PUBLIC_URL=/preview/${userId}`,
                "HOST=0.0.0.0",                 // Crucial for internal networking
                "VITE_ALLOW_FULL_RELOAD=1",     // Fixes HMR through proxy
                "NODE_ENV=development",
            ],
            HostConfig: {
                Binds: [`${volumePath}:/home/codeuser/workspace`],
                Memory: 512 * 1024 * 1024,      // 512MB RAM Limit
                NanoCpus: 500000000,            // 0.5 CPU Limit
                NetworkMode: "bridge_net"       // Matches compose.yaml
            },
        });
     
    await container.start();

        return await Map.create({
            userId,
            containerId: container.id,
            volumePath,
            status: "active",
            lastActive: new Date()
        });
    } catch (createErr) {
        // 4. FINAL FAILSAFE: Name Conflict
        if (createErr.statusCode === 409) {
            console.log(`Conflict: Name ${containerName} taken. Force removing...`);
            const conflictContainer = docker.getContainer(containerName);
            await conflictContainer.remove({ force: true });
            return await this.spawnContainer(userId); // Retry creation
        }
        throw createErr;
    }
};

/**
 * Stops a container and updates database status.
 */
exports.stopContainer = async (mapping) => {
    try {
        const container = docker.getContainer(mapping.containerId);
        // We catch and ignore errors if the container is already stopped
        await container.stop().catch(() => { }); 

        return await Map.findByIdAndUpdate(mapping._id, {
            status: "inactive",
            lastActive: new Date()
        }, { new: true });
    } catch (err) {
        console.error("Stop failed:", err);
        throw err;
    }
};

/**
 * Resumes an existing stopped container.
 */
exports.resumeContainer = async (mapping) => {
    try {
        const container = docker.getContainer(mapping.containerId);
        
        await container.start();

        const updated = await Map.findByIdAndUpdate(mapping._id, {
            status: "active",
            lastActive: new Date()
        }, { new: true });

        // Give the container kernel a second to prepare the TTY
        await new Promise((r) => setTimeout(r, 1000));
        return updated;
    } catch (err) {
        // If resume fails (container was deleted manually), wipe stale DB entry and spawn fresh
        console.log("Resume failed, likely container is gone. Spawning new...");
        await Map.deleteOne({ _id: mapping._id });
        return await this.spawnContainer(mapping.userId);
    }
};