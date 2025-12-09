import React, { useState } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MapPreview } from './components/MapPreview';
import { 
  DEFAULT_MAP_STYLE, MapStyle, 
  DEFAULT_LABEL_SETTINGS, LabelSettings,
  DEFAULT_TITLE_SETTINGS, TitleSettings,
  Annotation
} from './types';

const App: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mapStyle, setMapStyle] = useState<MapStyle>(DEFAULT_MAP_STYLE);
  
  // Text & Annotation State
  const [labelSettings, setLabelSettings] = useState<LabelSettings>(DEFAULT_LABEL_SETTINGS);
  const [titleSettings, setTitleSettings] = useState<TitleSettings>(DEFAULT_TITLE_SETTINGS);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const addAnnotation = (newAnnotation: Annotation) => {
    setAnnotations([...annotations, newAnnotation]);
    setIsAddingAnnotation(false);
  };

  const updateAnnotation = (id: string, text: string) => {
    setAnnotations(annotations.map(a => a.id === id ? { ...a, text } : a));
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
  };

  const moveAnnotation = (id: string, x: number, y: number) => {
    setAnnotations(annotations.map(a => a.id === id ? { ...a, x, y } : a));
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background relative overflow-hidden selection:bg-cyan-500/30">
      {/* Ambient background effects */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-[120px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

      {/* Header */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 flex overflow-hidden relative z-10 pt-4 px-4 pb-4 gap-4">
        
        {/* Left Panel - Controls */}
        <Sidebar 
          isCollapsed={isSidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
          mapStyle={mapStyle}
          setMapStyle={setMapStyle}
          // Text Props
          labelSettings={labelSettings}
          setLabelSettings={setLabelSettings}
          titleSettings={titleSettings}
          setTitleSettings={setTitleSettings}
          isAddingAnnotation={isAddingAnnotation}
          setIsAddingAnnotation={setIsAddingAnnotation}
        />

        {/* Right Panel - Map */}
        <div className="flex-1 h-full min-w-0 transition-all duration-500 ease-in-out relative">
           <MapPreview 
             mapStyle={mapStyle} 
             labelSettings={labelSettings}
             titleSettings={titleSettings}
             annotations={annotations}
             isAddingAnnotation={isAddingAnnotation}
             onAddAnnotation={addAnnotation}
             onUpdateAnnotation={updateAnnotation}
             onDeleteAnnotation={deleteAnnotation}
             onMoveAnnotation={moveAnnotation}
           />
           
           {/* Annotation Mode Indicator */}
           {isAddingAnnotation && (
             <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-2 rounded-full shadow-lg shadow-accent/20 text-sm font-bold z-50 animate-bounce pointer-events-none">
               Click anywhere on map to add text
             </div>
           )}
        </div>

      </main>
    </div>
  );
};

export default App;