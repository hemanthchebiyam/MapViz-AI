import React, { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { 
  ChevronLeft, ChevronRight, Sparkles, Database, Layers, 
  Zap, Upload, FileText, X, AlertCircle, Link as LinkIcon, Palette, RotateCcw, Check,
  Type, MousePointer2, AlignLeft, AlignCenter, AlignRight, LayoutTemplate
} from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { 
  MapStyle, PALETTES, DEFAULT_MAP_STYLE, PaletteType, ClassificationMethod,
  LabelSettings, TitleSettings, DEFAULT_LABEL_SETTINGS, DEFAULT_TITLE_SETTINGS
} from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  mapStyle: MapStyle;
  setMapStyle: (style: MapStyle) => void;
  
  labelSettings: LabelSettings;
  setLabelSettings: (settings: LabelSettings) => void;
  titleSettings: TitleSettings;
  setTitleSettings: (settings: TitleSettings) => void;
  isAddingAnnotation: boolean;
  setIsAddingAnnotation: (isAdding: boolean) => void;
}

type TabType = 'prompt' | 'upload' | 'style' | 'text';

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, toggleSidebar, 
  mapStyle, setMapStyle,
  labelSettings, setLabelSettings,
  titleSettings, setTitleSettings,
  isAddingAnnotation, setIsAddingAnnotation
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('prompt');
  
  // Prompt State
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const maxLength = 500;

  const examples = [
    "GDP by country 2024",
    "Population density in Tokyo",
    "Climate zones in South America",
    "Global internet usage"
  ];

  // -- Event Handlers --

  const handleExampleClick = (text: string) => {
    setPrompt(text);
  };

  // Drag and Drop Logic
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      'application/json', 
      'text/csv', 
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel' // xls
    ];
    const validExtensions = ['.json', '.csv', '.xlsx', '.xls'];
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

    if (validTypes.includes(file.type) || validExtensions.includes(fileExtension)) {
      setUploadedFile(file);
      setUploadError(null);
    } else {
      setUploadError('Unsupported file type. Please use CSV, Excel, or JSON.');
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadedFile(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Style Handlers
  const updateStyle = <K extends keyof MapStyle>(key: K, value: MapStyle[K]) => {
    setMapStyle({ ...mapStyle, [key]: value });
  };
  
  // Text Handlers
  const updateLabelSettings = <K extends keyof LabelSettings>(key: K, value: LabelSettings[K]) => {
    setLabelSettings({ ...labelSettings, [key]: value });
  };

  const updateTitleSettings = <K extends keyof TitleSettings>(key: K, value: TitleSettings[K]) => {
    setTitleSettings({ ...titleSettings, [key]: value });
  };

  return (
    <aside 
      className={`
        relative h-full transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
        ${isCollapsed ? 'w-16' : 'w-full md:w-[40%] max-w-md'}
      `}
    >
      <GlassPanel className="h-full flex flex-col">
        
        {/* Toggle Handle */}
        <button
          onClick={toggleSidebar}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-50 
                     bg-slate-800 border border-slate-700 text-slate-300
                     h-8 w-8 rounded-full flex items-center justify-center
                     hover:bg-accent hover:text-white hover:border-accent
                     transition-all shadow-lg backdrop-blur-sm"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Content Container */}
        <div className={`flex-1 flex flex-col overflow-hidden transition-opacity duration-300 ${isCollapsed ? 'opacity-0 invisible' : 'opacity-100 visible'}`}>
          
          {/* Header */}
          <div className="p-6 pb-2">
            <h2 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 border border-white/5">
                <Database className="w-4 h-4 text-accent" />
              </div>
              Data Studio
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex px-6 border-b border-white/5 space-x-4">
            {(['prompt', 'upload', 'style', 'text'] as TabType[]).map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-medium transition-all relative capitalize ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full" />}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            
            {/* --- TAB 1: NATURAL LANGUAGE --- */}
            {activeTab === 'prompt' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Textarea Container */}
                <div className={`
                  relative rounded-2xl border transition-all duration-300 group
                  ${isFocused 
                    ? 'bg-slate-900/80 border-accent/50 shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-accent/20' 
                    : 'bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-900/60'
                  }
                `}>
                  <textarea 
                    id="map-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value.slice(0, maxLength))}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className="w-full bg-transparent p-4 pt-6 min-h-[140px] text-sm text-slate-200 resize-none focus:outline-none placeholder-transparent relative z-10 leading-relaxed custom-scrollbar"
                    placeholder="Describe your map..."
                  />
                  
                  {/* Floating Label */}
                  <label 
                    htmlFor="map-prompt"
                    className={`
                      absolute left-4 transition-all duration-300 pointer-events-none text-slate-500 z-20
                      ${(isFocused || prompt) 
                        ? 'top-2 text-[10px] text-accent font-bold uppercase tracking-wider' 
                        : 'top-4 text-sm font-normal'
                      }
                    `}
                  >
                    Describe your map...
                  </label>

                  {/* Character Counter */}
                  <div className={`
                    absolute bottom-3 right-3 text-[10px] font-mono transition-colors duration-300
                    ${prompt.length > maxLength * 0.9 ? 'text-red-400' : 'text-slate-600'}
                  `}>
                    {prompt.length}/{maxLength}
                  </div>
                </div>

                {/* Generate Button */}
                <button className="w-full group relative overflow-hidden rounded-xl py-3.5 bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none" />
                  <div className="flex items-center justify-center gap-2 text-white font-semibold tracking-wide">
                      <Zap size={16} className={`transition-transform duration-300 ${prompt ? 'fill-white' : ''} group-hover:scale-110`} />
                      <span>Generate Map</span>
                  </div>
                </button>

                {/* Examples */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-slate-500" />
                    Try these examples
                    <span className="flex-1 h-px bg-white/5" />
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => handleExampleClick(ex)}
                        className="group px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 
                                  hover:bg-slate-800 hover:border-accent/30 hover:shadow-[0_0_10px_rgba(6,182,212,0.1)] 
                                  text-xs text-slate-400 hover:text-accent transition-all duration-200 text-left relative overflow-hidden"
                      >
                        <span className="relative z-10">{ex}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: UPLOAD FILE --- */}
            {activeTab === 'upload' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {!uploadedFile ? (
                  <>
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        relative flex flex-col items-center justify-center h-[180px] rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group
                        ${isDragging 
                          ? 'border-accent bg-accent/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]' 
                          : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-500'
                        }
                        ${uploadError ? 'border-red-500/50 bg-red-500/5' : ''}
                      `}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept=".csv,.json,.xlsx,.xls"
                        onChange={handleFileInput}
                      />
                      
                      <div className={`p-4 rounded-full bg-slate-800 mb-3 transition-transform duration-300 ${isDragging ? 'scale-110 bg-accent text-white' : 'text-slate-400 group-hover:text-white group-hover:bg-slate-700'}`}>
                        <Upload size={24} />
                      </div>
                      
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">
                        Drop your file here or <span className="text-accent underline decoration-dotted underline-offset-4">browse</span>
                      </p>
                      
                      <p className="text-xs text-slate-500 mt-2">
                        Supports CSV, Excel, JSON
                      </p>

                      {uploadError && (
                        <div className="absolute bottom-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-full">
                          <AlertCircle size={12} />
                          {uploadError}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 border border-white/10 flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="h-12 w-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                         <FileText size={24} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-medium text-white truncate">{uploadedFile.name}</h4>
                         <p className="text-xs text-slate-400">{formatFileSize(uploadedFile.size)}</p>
                      </div>

                      <button 
                        onClick={removeFile}
                        className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition-all z-10"
                        title="Remove file"
                      >
                         <X size={18} />
                      </button>
                    </div>

                    <button className="w-full group relative overflow-hidden rounded-xl py-3.5 bg-gradient-to-r from-emerald-600 to-teal-500 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.98] transition-all duration-300">
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out pointer-events-none" />
                      <div className="flex items-center justify-center gap-2 text-white font-semibold tracking-wide">
                          <Sparkles size={16} className="fill-white" />
                          <span>Visualize Data</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 3: STYLE --- */}
            {activeTab === 'style' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-6">
                
                {/* 1. Color Scheme */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Palette size={12} />
                    <span>Color Scheme</span>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(PALETTES) as PaletteType[]).filter(k => k !== 'custom').map((p) => (
                      <button
                        key={p}
                        onClick={() => updateStyle('palette', p)}
                        className={`
                          group relative p-2 rounded-xl border flex items-center gap-3 transition-all
                          ${mapStyle.palette === p 
                            ? 'bg-slate-800 border-accent/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                            : 'bg-slate-900/30 border-white/5 hover:border-white/20 hover:bg-slate-800/50'
                          }
                        `}
                      >
                        {/* Checkmark for active */}
                        {mapStyle.palette === p && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-accent">
                            <Check size={14} />
                          </div>
                        )}

                        <div className="flex h-8 w-32 rounded-lg overflow-hidden border border-white/10">
                          {PALETTES[p].map((color, i) => (
                            <div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />
                          ))}
                        </div>
                        <span className="text-xs font-medium text-slate-300 capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* 2. Classification */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Database size={12} />
                    <span>Classification</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {/* Method */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-semibold">METHOD</label>
                      <div className="relative">
                        <select 
                          value={mapStyle.classificationMethod}
                          onChange={(e) => updateStyle('classificationMethod', e.target.value as ClassificationMethod)}
                          className="w-full appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
                        >
                          <option value="quantile">Quantile (Equal Count)</option>
                          <option value="equal">Equal Interval</option>
                          <option value="natural">Natural Breaks</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <ChevronRight size={12} className="rotate-90" />
                        </div>
                      </div>
                    </div>

                    {/* Classes Count */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                         <label className="text-[10px] text-slate-500 font-semibold">CLASSES</label>
                         <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 rounded">{mapStyle.classesCount}</span>
                      </div>
                      <input 
                        type="range" 
                        min="3" 
                        max="9" 
                        step="1"
                        value={mapStyle.classesCount}
                        onChange={(e) => updateStyle('classesCount', parseInt(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent"
                      />
                      <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                        <span>3</span>
                        <span>9</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-white/5" />

                {/* 3. Map Style */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Layers size={12} />
                    <span>Map Appearance</span>
                  </div>
                  
                  {/* Borders Toggle */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-white/5">
                    <span className="text-xs text-slate-300">Show Borders</span>
                    <button 
                      onClick={() => updateStyle('showBorders', !mapStyle.showBorders)}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${mapStyle.showBorders ? 'bg-accent' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-sm transition-transform duration-300 ${mapStyle.showBorders ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Colors Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-semibold">BORDER COLOR</label>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/30 border border-white/5">
                          <input 
                            type="color" 
                            value={mapStyle.borderColor}
                            onChange={(e) => updateStyle('borderColor', e.target.value)}
                            className="w-6 h-6 rounded bg-transparent border-0 p-0 cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{mapStyle.borderColor}</span>
                        </div>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-semibold">BACKGROUND</label>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900/30 border border-white/5">
                          <input 
                            type="color" 
                            value={mapStyle.backgroundColor}
                            onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                            className="w-6 h-6 rounded bg-transparent border-0 p-0 cursor-pointer"
                          />
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{mapStyle.backgroundColor}</span>
                        </div>
                     </div>
                  </div>

                  {/* Border Width */}
                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                         <label className="text-[10px] text-slate-500 font-semibold">BORDER WIDTH</label>
                         <span className="text-[10px] font-mono text-slate-400">{mapStyle.borderWidth}px</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="3" 
                        step="0.1"
                        value={mapStyle.borderWidth}
                        onChange={(e) => updateStyle('borderWidth', parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                      />
                   </div>
                </div>

                {/* Reset Button */}
                <button 
                  onClick={() => setMapStyle(DEFAULT_MAP_STYLE)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset to Defaults
                </button>

              </div>
            )}

            {/* --- TAB 4: TEXT & ANNOTATIONS --- */}
            {activeTab === 'text' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-6">
                
                {/* 1. Labels */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Type size={12} />
                    <span>Labels</span>
                  </div>

                  {/* Show Labels Toggle */}
                   <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-white/5">
                    <span className="text-xs text-slate-300">Show Country Labels</span>
                    <button 
                      onClick={() => updateLabelSettings('showLabels', !labelSettings.showLabels)}
                      className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${labelSettings.showLabels ? 'bg-accent' : 'bg-slate-700'}`}
                    >
                      <div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-sm transition-transform duration-300 ${labelSettings.showLabels ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {labelSettings.showLabels && (
                    <div className="space-y-3 pl-2 border-l border-white/5 ml-2">
                       {/* Font Size */}
                       <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                             <label className="text-[10px] text-slate-500 font-semibold">SIZE</label>
                             <span className="text-[10px] font-mono text-slate-400">{labelSettings.fontSize}px</span>
                          </div>
                          <input 
                            type="range" 
                            min="8" 
                            max="24" 
                            value={labelSettings.fontSize}
                            onChange={(e) => updateLabelSettings('fontSize', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-slate-400"
                          />
                       </div>
                       
                       {/* Font Family */}
                       <div className="space-y-1.5">
                          <label className="text-[10px] text-slate-500 font-semibold">FONT</label>
                          <div className="relative">
                            <select 
                              value={labelSettings.fontFamily}
                              onChange={(e) => updateLabelSettings('fontFamily', e.target.value)}
                              className="w-full appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-200 focus:outline-none focus:border-accent/50 transition-colors cursor-pointer"
                            >
                              <option value="Inter, sans-serif">Inter (Sans)</option>
                              <option value="'Roboto Mono', monospace">Roboto Mono</option>
                              <option value="'Playfair Display', serif">Playfair Display</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                              <ChevronRight size={12} className="rotate-90" />
                            </div>
                          </div>
                       </div>

                       {/* Toggles */}
                       <div className="flex items-center gap-2">
                         <input 
                            type="checkbox" 
                            id="showOnHover"
                            checked={labelSettings.showOnHover}
                            onChange={(e) => updateLabelSettings('showOnHover', e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800 text-accent focus:ring-accent"
                         />
                         <label htmlFor="showOnHover" className="text-xs text-slate-400">Show only on hover</label>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <input 
                            type="checkbox" 
                            id="smartLabels"
                            checked={labelSettings.smartLabels}
                            onChange={(e) => updateLabelSettings('smartLabels', e.target.checked)}
                            className="rounded border-slate-700 bg-slate-800 text-accent focus:ring-accent"
                         />
                         <label htmlFor="smartLabels" className="text-xs text-slate-400">Smart positioning</label>
                       </div>
                    </div>
                  )}
                </div>

                <div className="h-px bg-white/5" />

                {/* 2. Annotations */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <MousePointer2 size={12} />
                    <span>Annotations</span>
                  </div>
                  
                  <button 
                    onClick={() => setIsAddingAnnotation(!isAddingAnnotation)}
                    className={`
                      w-full py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all
                      ${isAddingAnnotation 
                        ? 'bg-accent text-white border-accent shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                        : 'bg-slate-900/50 border-white/10 text-slate-300 hover:bg-slate-800 hover:border-white/20'
                      }
                    `}
                  >
                    {isAddingAnnotation ? (
                      <>Click Map to Place Text...</>
                    ) : (
                      <><Sparkles size={14} /> Add Text Overlay</>
                    )}
                  </button>
                  
                  <p className="text-[10px] text-slate-500 leading-relaxed px-1">
                    Double-click text on map to edit. Drag to move.
                  </p>
                </div>

                <div className="h-px bg-white/5" />

                {/* 3. Title */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <LayoutTemplate size={12} />
                    <span>Map Title</span>
                  </div>

                  <div className="space-y-3">
                    <input 
                      type="text" 
                      placeholder="Main Title"
                      value={titleSettings.title}
                      onChange={(e) => updateTitleSettings('title', e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-accent/50"
                    />
                     <input 
                      type="text" 
                      placeholder="Subtitle"
                      value={titleSettings.subtitle}
                      onChange={(e) => updateTitleSettings('subtitle', e.target.value)}
                      className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-accent/50"
                    />

                    {/* Position */}
                     <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-semibold">POSITION</label>
                        <div className="flex gap-2">
                           {['top', 'bottom', 'none'].map((pos) => (
                             <button
                               key={pos}
                               onClick={() => updateTitleSettings('position', pos as any)}
                               className={`
                                 flex-1 py-1.5 text-[10px] uppercase font-bold rounded-lg border transition-all
                                 ${titleSettings.position === pos 
                                   ? 'bg-slate-700 text-white border-slate-600' 
                                   : 'bg-transparent text-slate-500 border-white/10 hover:bg-white/5'
                                 }
                               `}
                             >
                               {pos}
                             </button>
                           ))}
                        </div>
                     </div>
                     
                     {/* Alignment */}
                     <div className="space-y-1.5">
                        <label className="text-[10px] text-slate-500 font-semibold">ALIGNMENT</label>
                        <div className="flex bg-slate-900/50 rounded-lg p-1 border border-white/10">
                           <button onClick={() => updateTitleSettings('alignment', 'left')} className={`flex-1 flex justify-center py-1 rounded ${titleSettings.alignment === 'left' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><AlignLeft size={14} /></button>
                           <button onClick={() => updateTitleSettings('alignment', 'center')} className={`flex-1 flex justify-center py-1 rounded ${titleSettings.alignment === 'center' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><AlignCenter size={14} /></button>
                           <button onClick={() => updateTitleSettings('alignment', 'right')} className={`flex-1 flex justify-center py-1 rounded ${titleSettings.alignment === 'right' ? 'bg-slate-700 text-white' : 'text-slate-500'}`}><AlignRight size={14} /></button>
                        </div>
                     </div>
                  </div>
                </div>

                <button 
                  onClick={() => {
                    setLabelSettings(DEFAULT_LABEL_SETTINGS);
                    setTitleSettings(DEFAULT_TITLE_SETTINGS);
                  }}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  <RotateCcw size={14} />
                  Reset Text Settings
                </button>
              </div>
            )}

          </div>

        </div>
        
        {/* Collapsed Icon View */}
        {isCollapsed && (
          <div className="absolute inset-0 flex flex-col items-center pt-24 gap-6">
            <button className="group relative p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10 text-accent hover:border-accent/50 transition-all">
              <Sparkles size={20} className="group-hover:animate-pulse" />
            </button>
            <button className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <Upload size={20} />
            </button>
            <button className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <Palette size={20} />
            </button>
            <button className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all">
              <Type size={20} />
            </button>
          </div>
        )}

      </GlassPanel>
    </aside>
  );
};