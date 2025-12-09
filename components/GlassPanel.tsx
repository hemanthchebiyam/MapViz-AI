import React, { ReactNode, CSSProperties } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({ children, className = '', style }) => {
  return (
    <div 
      className={`
        relative
        bg-slate-900/60 
        backdrop-blur-xl 
        border border-white/10 
        shadow-xl 
        rounded-2xl 
        overflow-hidden
        ${className}
      `}
      style={style}
    >
      {/* Inner sheen effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};