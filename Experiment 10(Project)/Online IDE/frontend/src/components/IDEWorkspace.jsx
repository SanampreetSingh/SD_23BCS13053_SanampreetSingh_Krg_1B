import React, { useState, useCallback, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';
import TerminalComponent from './Terminal';
import { LogOut, Terminal as TerminalIcon, Code2, Globe, ExternalLink } from 'lucide-react';

const IDEWorkspace = () => {
  const { user, logout } = useContext(UserContext);
  
  const [terminalHeight, setTerminalHeight] = useState(300);
  const [isResizing, setIsResizing] = useState(false);
  
  // State for the Preview URL Builder
  const [localInput, setLocalInput] = useState('localhost:3000');
  const [previewLink, setPreviewLink] = useState('');

  const startResizing = () => setIsResizing(true);
  const stopResizing = () => setIsResizing(false);

  const resize = useCallback((e) => {
    if (isResizing) {
      const newHeight = window.innerHeight - e.clientY;
      if (newHeight > 100 && newHeight < window.innerHeight * 0.85) {
        setTerminalHeight(newHeight);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    }
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [isResizing, resize]);

  /**
   * Logic to convert localhost:port/path to Nginx Preview URL
   * Example: localhost:5173/dashboard -> /preview/<user_id>/dashboard?port=5173
   */
  const handleConvertPreview = () => {
    try {
      // Remove protocol if user included it (http://)
      let cleanInput = localInput.trim();
      cleanInput = cleanInput.replace(/^https?:\/\//, '');

      if (!cleanInput) {
        cleanInput = "localhost:3000";
      }

      // Split by first slash to separate host:port and path
      const [hostPort, ...pathParts] = cleanInput.split('/');
      const path = pathParts.length > 0 ? `/${pathParts.join('/')}` : '';
      
      // Extract port (default to 3000 if not specified)
      const [host, port] = hostPort.split(':');
      let targetPort = port || (isNaN(host) ? '3000' : host);

      // Construct the Nginx dynamic path
      const generatedUrl = `/preview/${user?.id}${path}?port=${targetPort}`;
      setPreviewLink(generatedUrl);
      
      // Automatically open in new tab
      window.open(generatedUrl, '_blank');
    } catch (error) {
      console.error("Invalid Preview URL format");
    }
  };

  return (
    <div className={`flex flex-col h-screen w-screen bg-[#1e1e1e] text-gray-200 overflow-hidden ${isResizing ? 'cursor-row-resize select-none' : ''}`}>
      
      <header className="h-12 border-b border-[#333333] flex items-center justify-between px-4 bg-[#252526] z-50">
        <div className="flex items-center gap-3">
          <Code2 size={18} className="text-blue-500" />
          <span className="font-bold text-sm tracking-widest text-white">CLOUD_IDE</span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] rounded-full border border-[#333]">
            <img src={user?.picture} alt="profile" className="w-5 h-5 rounded-full" />
            <span className="text-[11px] font-medium">{user?.name}</span>
          </div>
          <button onClick={logout} className="p-2 hover:bg-red-500/10 rounded-md transition-all group">
            <LogOut size={18} className="text-gray-500 group-hover:text-red-400" />
          </button>
        </div>
      </header>

      <main className="flex-1 relative flex flex-col bg-[#1e1e1e]">
        
        {/* NEW: Preview URL Controller Container */}
        <div className="w-full p-2 bg-[#2d2d2d] border-b border-[#333] flex items-center gap-2 shadow-lg">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded border border-[#444] flex-1 max-w-2xl">
            <Globe size={14} className="text-gray-500" />
            <input 
              type="text" 
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              placeholder="localhost:3000/path"
              className="bg-transparent border-none outline-none text-xs text-blue-300 w-full font-mono"
            />
          </div>
          <button 
            onClick={handleConvertPreview}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors"
          >
            <span>PREVIEW</span>
            <ExternalLink size={12} />
          </button>
        </div>

        {/* Editor Placeholder */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
            <div className="flex flex-col items-center opacity-10 pointer-events-none">
              <Code2 size={80} className="mb-4" />
              <p className="font-mono text-sm tracking-[0.2em]">INITIATING WORKSPACE...</p>
            </div>
            
            {isResizing && <div className="absolute inset-0 z-100 bg-transparent" />}
        </div>
      </main>

      <div 
        onMouseDown={startResizing}
        className={`h-1 cursor-row-resize z-50 transition-colors ${
          isResizing ? 'bg-blue-600' : 'bg-[#2d2d2d] hover:bg-blue-500'
        }`}
      />

      <section 
        style={{ height: `${terminalHeight}px` }} 
        className="bg-black flex flex-col w-full relative transition-[height] duration-0"
      >
        <div className="flex items-center px-4 py-2 bg-[#252526] text-[10px] text-gray-400 font-bold uppercase tracking-widest border-b border-[#333] select-none">
          <TerminalIcon size={12} className="mr-2 text-blue-400" /> Terminal
        </div>
        
        <div className="flex-1 w-full bg-black">
          <TerminalComponent parentHeight={terminalHeight} />
        </div>
      </section>
    </div>
  );
};

export default IDEWorkspace;