import React, { useEffect, useRef, useContext } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { UserContext } from '../context/UserContext';
import 'xterm/css/xterm.css';

const TerminalComponent = () => {
  const { logout } = useContext(UserContext);
  const terminalRef = useRef(null);
  const xtermRef = useRef(null);
  const wsRef = useRef(null);
  const fitAddonRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      convertEol: true,
      scrollback: 5000,
      fontSize: 14,
      fontFamily: '"Fira Code", monospace',
      allowProposedApi: true,
      theme: {
        background: '#000000',
        foreground: '#ffffff',
        cursor: '#f97316',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);

    fitAddonRef.current = fitAddon;
    xtermRef.current = term;

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/socket.io/`);
    socket.binaryType = 'arraybuffer';
    wsRef.current = socket;

    // Helper to sync dimensions
    const syncSize = () => {
      if (socket.readyState === WebSocket.OPEN) {
        fitAddon.fit();
        socket.send(JSON.stringify({
          type: 'resize',
          cols: term.cols,
          rows: term.rows
        }));
      }
    };

    socket.onopen = () => {
      // Small timeout to ensure the CSS transition/container is stable
      setTimeout(() => {
        syncSize();
        term.focus();
      }, 150);
    };
    socket.onclose = (event) => {
            console.warn(`Terminal WebSocket closed with code: ${event.code}`);
            
            /**
             * 1006: Abnormal closure (Nginx blocks the upgrade due to auth failure)
             * 4001: Custom Unauthorized code from your Socket Service
             */
            if (event.code === 1006 || event.code === 4001) {
                alert("Session expired or unauthorized. Logging out...");
                logout(); 
            }
        };


    socket.onmessage = (event) => {
      const data = event.data instanceof ArrayBuffer ? new Uint8Array(event.data) : event.data;
      term.write(data);
    };

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) socket.send(data);
    });

    // ResizeObserver ensures that if the user drags the terminal height, we re-fit
    const resizeObserver = new ResizeObserver(() => {
      if (term && fitAddon) {
        // Request animation frame to avoid "ResizeObserver loop limit exceeded"
        requestAnimationFrame(() => {
          syncSize();
        });
      }
    });
    
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
      socket.close();
      term.dispose();
    };
  }, []);

  return (
    <div className="w-full h-full bg-black flex flex-col overflow-hidden">
      <div className="flex-1 relative"> 
        <div
          ref={terminalRef}
          className="absolute inset-0"
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <style>{`
        /* Fix the half-width canvas bug */
        .xterm-screen {
          width: 100% !important;
        }
        .xterm-viewport {
          width: 100% !important;
          overflow-y: auto !important;
        }
        /* Ensure the helper container matches parent */
        .terminal.xterm {
          padding: 10px;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default TerminalComponent;