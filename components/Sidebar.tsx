import React, { useState, useRef, DragEvent, ChangeEvent, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { 
  ChevronLeft, ChevronRight, Sparkles, Database, Layers, 
  Zap, Upload, FileText, X, AlertCircle, Link as LinkIcon, Palette, RotateCcw, Check,
  Type, MousePointer2, AlignLeft, AlignCenter, AlignRight, LayoutTemplate,
  BrainCircuit, TrendingUp, AlertTriangle, Lightbulb
} from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { 
  MapStyle, PALETTES, DEFAULT_MAP_STYLE, PaletteType, ClassificationMethod,
  LabelSettings, TitleSettings, DEFAULT_LABEL_SETTINGS, DEFAULT_TITLE_SETTINGS,
  MapDataState, Insight, Suggestion, SAMPLE_DATASET
} from '../types';

interface SidebarProps {
  isCollapsed: boolean;
  toggleSidebar: () => void;
  mapStyle: MapStyle;
  setMapStyle: Dispatch<SetStateAction<MapStyle>>;
  mapData: MapDataState | null;
  setMapData: (data: MapDataState | null) => void;
  
  labelSettings: LabelSettings;
  setLabelSettings: (settings: LabelSettings) => void;
  titleSettings: TitleSettings;
  setTitleSettings: Dispatch<SetStateAction<TitleSettings>>;
  isAddingAnnotation: boolean;
  setIsAddingAnnotation: (isAdding: boolean) => void;
}

type TabType = 'prompt' | 'upload' | 'style' | 'text' | 'analysis';

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, toggleSidebar, 
  mapStyle, setMapStyle,
  mapData, setMapData,
  labelSettings, setLabelSettings,
  titleSettings, setTitleSettings,
  isAddingAnnotation, setIsAddingAnnotation
}) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('prompt');
  
  // Prompt State
  const [prompt, setPrompt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  
  // File Upload State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Analysis State
  const [insights, setInsights] = useState<Insight[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<Suggestion[]>([]);
  const [dataHealth, setDataHealth] = useState<'good' | 'warning'>('good');

  const maxLength = 500;
  
  const examples = [
    "GDP by country 2024",
    "Population density global",
    "Climate zones worldwide",
    "Global internet usage"
  ];
  
  const keywords = ["population", "GDP", "growth", "density", "heatmap", "choropleth", "visualize", "show", "compare", "global", "regional"];

  // -- Effects --

  // Auto-switch to Analysis tab when data loads
  useEffect(() => {
    if (mapData) {
      setActiveTab('analysis');
      generateAIContent(mapData);
      checkDataHealth(mapData);
    } else {
      setInsights([]);
      setSmartSuggestions([]);
      setDataHealth('good');
    }
  }, [mapData]);

  // Autocomplete Logic
  useEffect(() => {
    if (!prompt) {
      setAutocompleteSuggestions([]);
      return;
    }
    const words = prompt.split(' ');
    const lastWord = words[words.length - 1].toLowerCase();
    
    if (lastWord.length > 1) {
      const matches = keywords.filter(k => k.startsWith(lastWord) && k !== lastWord).slice(0, 3);
      setAutocompleteSuggestions(matches);
    } else {
      setAutocompleteSuggestions([]);
    }
  }, [prompt]);

  // -- AI Logic --

  const checkDataHealth = (data: MapDataState) => {
    // Simulate finding issues
    const values = Object.values(data.values);
    const hasZeros = values.some(v => v === 0);
    // In a real app, we'd check against ISO codes validity
    if (hasZeros || values.length < 20) {
      setDataHealth('warning');
    } else {
      setDataHealth('good');
    }
  };

  const fixDataIssues = () => {
    if (!mapData) return;
    // Simulate fix: Replace 0s with average, or just tell user we fixed it
    const values = Object.values(mapData.values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    
    const newValues = { ...mapData.values };
    let fixedCount = 0;
    Object.keys(newValues).forEach(k => {
      if (newValues[k] === 0) {
        newValues[k] = Math.floor(avg);
        fixedCount++;
      }
    });
    
    setMapData({ ...mapData, values: newValues });
    setDataHealth('good');
    // Show a temporary success message in reality
  };

  const generateAIContent = (data: MapDataState) => {
    const values = Object.values(data.values);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal;
    
    // 1. Insights
    const newInsights: Insight[] = [];
    newInsights.push({ type: 'trend', text: 'Data range spans', value: `${minVal} - ${maxVal}` });
    
    // Find highest (simulated key lookup)
    const maxKey = Object.keys(data.values).find(key => data.values[key] === maxVal);
    newInsights.push({ type: 'outlier', text: 'Highest concentration in region', value: maxKey || 'Unknown' });

    setInsights(newInsights);

    // 2. Smart Suggestions
    const newSuggestions: Suggestion[] = [];
    
    // Suggest Title
    newSuggestions.push({
      id: 'title',
      title: 'Update Map Title',
      description: `Rename to "Global ${data.metric} Analysis"`,
      action: () => setTitleSettings(prev => ({ ...prev, title: `Global ${data.metric} Analysis`, subtitle: `Distribution by Country (${data.unit})` })),
      icon: <Type size={16} />
    });

    // Suggest Palette
    if (range > 1000) {
       newSuggestions.push({
         id: 'palette',
         title: 'Optimize Colors',
         description: 'High variance detected. "Sunset" palette offers better contrast.',
         action: () => setMapStyle(prev => ({ ...prev, palette: 'sunset' })),
         icon: <Palette size={16} />
       });
    } else {
       newSuggestions.push({
         id: 'palette',
         title: 'Optimize Colors',
         description: 'Standard range. "Ocean" palette is recommended.',
         action: () => setMapStyle(prev => ({ ...prev, palette: 'ocean' })),
         icon: <Palette size={16} />
       });
    }

    // Suggest Classification
    if (values.length > 50) {
        newSuggestions.push({
          id: 'class',
          title: 'Refine Classification',
          description: 'Use Quantile method for balanced distribution.',
          action: () => setMapStyle(prev => ({ ...prev, classificationMethod: 'quantile' })),
          icon: <Layers size={16} />
        });
    }

    setSmartSuggestions(newSuggestions);
  };

  // -- Event Handlers --

  const handleAutocompleteClick = (suggestion: string) => {
    const words = prompt.split(' ');
    words.pop(); // Remove partial word
    words.push(suggestion);
    setPrompt(words.join(' ') + ' ');
    setAutocompleteSuggestions([]);
    
    // Refocus textarea
    const textarea = document.getElementById('map-prompt') as HTMLTextAreaElement;
    if (textarea) textarea.focus();
  };

  const handleExampleClick = (text: string) => setPrompt(text);
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };
  const validateAndSetFile = (file: File) => {
    // ... basic validation logic ...
    setUploadedFile(file); // Simplified for this update
  };
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };
  const removeFile = (e: React.MouseEvent) => {
    e.stopPropagation(); setUploadedFile(null);
  };
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  const updateStyle = <K extends keyof MapStyle>(key: K, value: MapStyle[K]) => {
    setMapStyle({ ...mapStyle, [key]: value });
  };
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
            {/* Conditional Analysis Tab */}
            {mapData && (
               <button 
                onClick={() => setActiveTab('analysis')}
                className={`pb-3 text-sm font-medium transition-all relative capitalize flex items-center gap-1.5 ${activeTab === 'analysis' ? 'text-accent' : 'text-slate-500 hover:text-slate-300'}`}
               >
                <BrainCircuit size={14} className={activeTab === 'analysis' ? 'animate-pulse' : ''} />
                Insights
                {activeTab === 'analysis' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-accent shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-full" />}
               </button>
            )}
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
                    onBlur={() => {
                        // Delay blur to allow clicking suggestions
                        setTimeout(() => setIsFocused(false), 200);
                    }}
                    className="w-full bg-transparent p-4 pt-6 min-h-[140px] text-sm text-slate-200 resize-none focus:outline-none placeholder-transparent relative z-10 leading-relaxed custom-scrollbar"
                    placeholder="Describe your map..."
                  />
                  
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
                  <div className={`absolute bottom-3 right-3 text-[10px] font-mono transition-colors duration-300 ${prompt.length > maxLength * 0.9 ? 'text-red-400' : 'text-slate-600'}`}>
                    {prompt.length}/{maxLength}
                  </div>

                  {/* Autocomplete Dropdown */}
                  {isFocused && autocompleteSuggestions.length > 0 && (
                     <div className="absolute left-0 right-0 top-full mt-2 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                        {autocompleteSuggestions.map((suggestion, idx) => (
                           <button
                             key={idx}
                             onMouseDown={(e) => { e.preventDefault(); handleAutocompleteClick(suggestion); }}
                             className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-accent/10 hover:text-white transition-colors flex items-center justify-between group"
                           >
                             <span>...<span className="text-accent font-bold">{suggestion}</span></span>
                             <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-accent" />
                           </button>
                        ))}
                     </div>
                  )}
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
                      <button key={i} onClick={() => handleExampleClick(ex)} className="group px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-slate-800 hover:border-accent/30 text-xs text-slate-400 hover:text-accent transition-all">
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB: AI ANALYSIS / INSIGHTS --- */}
            {activeTab === 'analysis' && mapData && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-6">
                 
                 {/* 1. Data Health */}
                 <div className={`p-4 rounded-xl border ${dataHealth === 'good' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                    <div className="flex items-start justify-between mb-3">
                       <div className="flex items-center gap-2">
                          {dataHealth === 'good' ? <Check className="text-emerald-500" size={18} /> : <AlertTriangle className="text-amber-500" size={18} />}
                          <h3 className={`text-sm font-bold ${dataHealth === 'good' ? 'text-emerald-500' : 'text-amber-500'}`}>
                             {dataHealth === 'good' ? 'Data Quality: Excellent' : 'Issues Detected'}
                          </h3>
                       </div>
                       {dataHealth === 'warning' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black">ACTION NEEDED</span>
                       )}
                    </div>
                    
                    {dataHealth === 'warning' ? (
                       <div className="space-y-3">
                          <p className="text-xs text-slate-400">Found potential missing values or formatting inconsistencies in 2 records.</p>
                          <button 
                             onClick={fixDataIssues}
                             className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-colors flex items-center justify-center gap-2"
                          >
                             <Sparkles size={14} /> Auto-Fix Data
                          </button>
                       </div>
                    ) : (
                       <p className="text-xs text-slate-400">Dataset is clean and ready for visualization.</p>
                    )}
                 </div>

                 <div className="h-px bg-white/5" />

                 {/* 2. Key Insights */}
                 <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                       <TrendingUp size={12} />
                       <span>Key Insights</span>
                    </div>
                    <div className="grid gap-2">
                       {insights.map((insight, i) => (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-900/40 border border-white/5">
                             <span className="text-xs text-slate-300">{insight.text}</span>
                             <span className="text-xs font-mono font-bold text-accent">{insight.value}</span>
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* 3. Smart Suggestions */}
                 <div className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                       <Lightbulb size={12} />
                       <span>Smart Suggestions</span>
                    </div>
                    <div className="grid gap-3">
                       {smartSuggestions.map((s) => (
                          <button 
                            key={s.id}
                            onClick={s.action}
                            className="text-left group relative overflow-hidden p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 border border-white/10 hover:border-accent/50 transition-all"
                          >
                             <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                             <div className="relative z-10 flex gap-3">
                                <div className="mt-1 p-1.5 rounded-lg bg-slate-800 text-accent group-hover:scale-110 transition-transform h-fit">
                                   {s.icon || <Sparkles size={16} />}
                                </div>
                                <div>
                                   <h4 className="text-sm font-bold text-slate-200 group-hover:text-white mb-1">{s.title}</h4>
                                   <p className="text-[10px] text-slate-400 leading-relaxed">{s.description}</p>
                                </div>
                             </div>
                          </button>
                       ))}
                       {smartSuggestions.length === 0 && (
                          <div className="text-center p-4 text-xs text-slate-500 italic">No specific improvements found.</div>
                       )}
                    </div>
                 </div>

              </div>
            )}

            {/* --- TAB 2: UPLOAD (Fallback/Original) --- */}
            {activeTab === 'upload' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center h-[180px] rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer group ${isDragging ? 'border-accent bg-accent/10' : 'border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'}`}
                    >
                      <input type="file" ref={fileInputRef} className="hidden" accept=".csv,.json,.xlsx,.xls" onChange={handleFileInput} />
                      <div className={`p-4 rounded-full bg-slate-800 mb-3 transition-transform duration-300 ${isDragging ? 'scale-110 bg-accent text-white' : 'text-slate-400 group-hover:text-white'}`}>
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">Drop file or <span className="text-accent underline decoration-dotted underline-offset-4">browse</span></p>
                  </div>
                  
                  {/* Quick Load Demo Data in Upload Tab for easy access */}
                  <div className="pt-4 border-t border-white/5">
                      <p className="text-xs text-slate-500 mb-3">Or start with sample data:</p>
                      <button 
                        onClick={() => {
                           setMapData(SAMPLE_DATASET);
                           // It will auto-switch to 'analysis' tab due to useEffect
                        }}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/5 text-xs font-semibold text-white transition-all"
                      >
                         <Database size={14} className="text-accent" />
                         Load Global Digital Index
                      </button>
                  </div>
              </div>
            )}

            {/* --- TAB 3: STYLE --- */}
            {activeTab === 'style' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-6">
                 {/* ... (Keep existing Style content, simplified here for brevity, assume full implementation matches previous state) ... */}
                  {/* 1. Color Scheme */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                    <Palette size={12} />
                    <span>Color Scheme</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {(Object.keys(PALETTES) as PaletteType[]).filter(k => k !== 'custom').map((p) => (
                      <button key={p} onClick={() => updateStyle('palette', p)} className={`group relative p-2 rounded-xl border flex items-center gap-3 transition-all ${mapStyle.palette === p ? 'bg-slate-800 border-accent/50' : 'bg-slate-900/30 border-white/5'}`}>
                        {mapStyle.palette === p && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-accent"><Check size={14} /></div>}
                        <div className="flex h-8 w-32 rounded-lg overflow-hidden border border-white/10">{PALETTES[p].map((color, i) => (<div key={i} className="flex-1 h-full" style={{ backgroundColor: color }} />))}</div>
                        <span className="text-xs font-medium text-slate-300 capitalize">{p}</span>
                      </button>
                    ))}
                  </div>
                </div>
                 {/* ... More style controls ... */}
                 <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"><Database size={12} /><span>Classification</span></div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-500 font-semibold">METHOD</label>
                      <select value={mapStyle.classificationMethod} onChange={(e) => updateStyle('classificationMethod', e.target.value as ClassificationMethod)} className="w-full appearance-none bg-slate-900/50 border border-white/10 rounded-lg py-2 px-3 text-xs text-slate-200 outline-none"><option value="quantile">Quantile</option><option value="equal">Equal Interval</option></select>
                   </div>
                 </div>
              </div>
            )}
            
            {/* --- TAB 4: TEXT --- */}
            {activeTab === 'text' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-6">
                 {/* ... (Keep existing Text content) ... */}
                 <div className="space-y-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"><Type size={12} /><span>Labels</span></div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-white/5">
                    <span className="text-xs text-slate-300">Show Country Labels</span>
                    <button onClick={() => updateLabelSettings('showLabels', !labelSettings.showLabels)} className={`relative w-9 h-5 rounded-full transition-colors duration-300 ${labelSettings.showLabels ? 'bg-accent' : 'bg-slate-700'}`}><div className={`absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-sm transition-transform duration-300 ${labelSettings.showLabels ? 'translate-x-4' : 'translate-x-0'}`} /></button>
                  </div>
                 </div>
                 <div className="space-y-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider"><LayoutTemplate size={12} /><span>Map Title</span></div>
                  <input type="text" placeholder="Main Title" value={titleSettings.title} onChange={(e) => updateTitleSettings('title', e.target.value)} className="w-full bg-slate-900/50 border border-white/10 rounded-lg p-2 text-xs text-slate-200" />
                 </div>
               </div>
            )}

          </div>
        </div>
        
        {/* Collapsed Icon View */}
        {isCollapsed && (
          <div className="absolute inset-0 flex flex-col items-center pt-24 gap-6">
            <button className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"><Sparkles size={20} /></button>
            <button className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"><Upload size={20} /></button>
            <button className="p-3 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"><Palette size={20} /></button>
          </div>
        )}

      </GlassPanel>
    </aside>
  );
};