import React, { useState, useEffect } from 'react';
import { 
  X, Search, Star, Layout, Save, Trash2, 
  Globe, BarChart3, CloudRain, Vote, Plane, Monitor,
  CheckCircle, Plus
} from 'lucide-react';
import { GlassPanel } from './GlassPanel';
import { MapTemplate, PRESET_TEMPLATES, MapStyle, MapDataState, TitleSettings } from '../types';

interface TemplateGalleryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: MapTemplate) => void;
  currentMapState?: {
    style: MapStyle;
    data: MapDataState | null;
    titleSettings: TitleSettings;
  };
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ 
  isOpen, onClose, onSelectTemplate, currentMapState 
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [myTemplates, setMyTemplates] = useState<MapTemplate[]>([]);
  const [saveMode, setSaveMode] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Load local storage data
  useEffect(() => {
    const savedFavs = localStorage.getItem('mapviz_favorites');
    if (savedFavs) setFavorites(JSON.parse(savedFavs));

    const savedMy = localStorage.getItem('mapviz_my_templates');
    if (savedMy) setMyTemplates(JSON.parse(savedMy));
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavs = favorites.includes(id) 
      ? favorites.filter(fid => fid !== id)
      : [...favorites, id];
    setFavorites(newFavs);
    localStorage.setItem('mapviz_favorites', JSON.stringify(newFavs));
  };

  const handleSaveCurrent = () => {
    if (!currentMapState || !currentMapState.data || !newTemplateName) return;

    const newTemplate: MapTemplate = {
      id: `custom-${Date.now()}`,
      name: newTemplateName,
      description: 'Custom saved template',
      category: 'Other',
      thumbnailGradient: 'linear-gradient(135deg, #6366f1, #a855f7)',
      style: currentMapState.style,
      data: currentMapState.data,
      titleSettings: currentMapState.titleSettings
    };

    const updated = [...myTemplates, newTemplate];
    setMyTemplates(updated);
    localStorage.setItem('mapviz_my_templates', JSON.stringify(updated));
    setSaveMode(false);
    setNewTemplateName('');
    setActiveTab('my');
  };

  const deleteTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = myTemplates.filter(t => t.id !== id);
    setMyTemplates(updated);
    localStorage.setItem('mapviz_my_templates', JSON.stringify(updated));
  };

  const allTemplates = [...PRESET_TEMPLATES, ...myTemplates];
  
  const filteredTemplates = allTemplates.filter(t => {
    // Tab filter
    if (activeTab === 'favorites' && !favorites.includes(t.id)) return false;
    if (activeTab === 'my' && !t.id.startsWith('custom-')) return false;
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <GlassPanel className="w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden bg-[#0b1121]/90">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-accent/10 rounded-lg text-accent">
               <Layout size={24} />
             </div>
             <div>
               <h2 className="text-xl font-bold text-white">Template Gallery</h2>
               <p className="text-xs text-slate-400">Jumpstart your visualization with professionally designed presets</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between bg-slate-900/50 shrink-0">
          <div className="flex gap-2">
            {['all', 'favorites', 'my'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-accent text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'all' ? 'All Templates' : tab === 'favorites' ? 'Favorites' : 'My Templates'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input 
                type="text" 
                placeholder="Search templates..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 w-64"
              />
            </div>
            
            {/* Save Current Button */}
            {currentMapState?.data && (
               <button 
                 onClick={() => setSaveMode(!saveMode)}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${saveMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 border-white/10 text-slate-300 hover:text-white'}`}
               >
                 <Save size={16} />
                 <span className="text-sm font-medium">Save Current</span>
               </button>
            )}
          </div>
        </div>

        {/* Save Mode Input Area */}
        {saveMode && (
          <div className="p-4 bg-emerald-500/5 border-b border-emerald-500/20 flex items-center gap-4 animate-in slide-in-from-top-2 shrink-0">
             <input 
               type="text" 
               autoFocus
               placeholder="Enter template name..."
               value={newTemplateName}
               onChange={(e) => setNewTemplateName(e.target.value)}
               className="flex-1 px-4 py-2 rounded-lg bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
             />
             <button 
               onClick={handleSaveCurrent}
               disabled={!newTemplateName}
               className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-lg transition-colors flex items-center gap-2"
             >
               <CheckCircle size={16} /> Save
             </button>
          </div>
        )}

        {/* Grid Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div 
                  key={template.id}
                  className="group relative flex flex-col bg-slate-900/40 border border-white/5 hover:border-accent/50 rounded-xl overflow-hidden transition-all hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:-translate-y-1"
                >
                  {/* Thumbnail / Header */}
                  <div 
                    className="h-32 w-full p-4 flex items-start justify-between"
                    style={{ background: template.thumbnailGradient }}
                  >
                     <div className="p-2 bg-black/20 backdrop-blur-md rounded-lg text-white">
                        {template.category === 'Demographics' && <Globe size={20} />}
                        {template.category === 'Economics' && <BarChart3 size={20} />}
                        {template.category === 'Environment' && <CloudRain size={20} />}
                        {template.category === 'Politics' && <Vote size={20} />}
                        {template.category === 'Other' && <Monitor size={20} />}
                     </div>

                     <button 
                       onClick={(e) => toggleFavorite(template.id, e)}
                       className={`p-2 rounded-full backdrop-blur-md transition-colors ${favorites.includes(template.id) ? 'bg-yellow-400/20 text-yellow-400' : 'bg-black/20 text-white/50 hover:text-white'}`}
                     >
                       <Star size={18} fill={favorites.includes(template.id) ? "currentColor" : "none"} />
                     </button>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex-1 flex flex-col">
                     <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{template.category}</span>
                        {template.isPopular && <span className="px-2 py-0.5 bg-accent/20 text-accent text-[10px] font-bold rounded-full">POPULAR</span>}
                     </div>
                     <h3 className="text-lg font-bold text-white mb-1 group-hover:text-accent transition-colors">{template.name}</h3>
                     <p className="text-sm text-slate-400 mb-4 line-clamp-2 flex-1">{template.description}</p>
                     
                     <div className="flex items-center gap-2 mt-auto">
                        <button 
                          onClick={() => onSelectTemplate(template)}
                          className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-accent hover:text-white border border-white/10 text-sm font-semibold text-slate-300 transition-all flex items-center justify-center gap-2"
                        >
                           Use Template
                        </button>
                        {template.id.startsWith('custom-') && (
                          <button 
                             onClick={(e) => deleteTemplate(template.id, e)}
                             className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-colors"
                             title="Delete Template"
                          >
                             <Trash2 size={18} />
                          </button>
                        )}
                     </div>
                  </div>
                </div>
              ))}
              
              {/* Add New Placeholder (only in My Templates) */}
              {activeTab === 'my' && (
                 <button 
                   onClick={() => setSaveMode(true)}
                   className="flex flex-col items-center justify-center h-full min-h-[250px] rounded-xl border-2 border-dashed border-white/10 hover:border-accent/50 hover:bg-white/5 transition-all group"
                 >
                    <div className="p-4 rounded-full bg-slate-800 text-slate-400 group-hover:bg-accent group-hover:text-white transition-all mb-4">
                       <Plus size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-300 group-hover:text-white">Create Template</h3>
                    <p className="text-sm text-slate-500">Save current map configuration</p>
                 </button>
              )}
           </div>

           {filteredTemplates.length === 0 && activeTab !== 'my' && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                 <Search size={48} className="mb-4 opacity-20" />
                 <p className="text-lg">No templates found matching your criteria.</p>
              </div>
           )}
        </div>

      </GlassPanel>
    </div>
  );
};