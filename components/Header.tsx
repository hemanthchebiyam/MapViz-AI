import React from 'react';
import { Settings, Activity, Map as MapIcon } from 'lucide-react';
import { GlassPanel } from './GlassPanel';

export const Header: React.FC = () => {
  return (
    <header className="px-4 pt-4 z-50">
      <GlassPanel className="h-16 flex items-center justify-between px-6">
        
        {/* Logo Area */}
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-primary to-accent p-2 rounded-lg shadow-lg shadow-primary/20">
            <MapIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
              MapViz <span className="text-accent">AI</span>
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-accent font-semibold">Online</span>
            </div>
          </div>
        </div>

        {/* Center - Simple Metrics (Visual Flair) */}
        <div className="hidden md:flex items-center gap-8 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span>SYS_STATUS: NOMINAL</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full w-[60%] bg-accent/50 rounded-full animate-pulse" />
             </div>
             <span>CPU: 12%</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 hover:text-white group">
            <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
          </button>
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary to-purple-600 border border-white/20" />
        </div>

      </GlassPanel>
    </header>
  );
};