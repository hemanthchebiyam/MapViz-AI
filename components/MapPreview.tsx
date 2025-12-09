import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { GlassPanel } from './GlassPanel';
import { 
  Plus, Minus, RotateCcw, Search, X, 
  Map as MapIcon, Globe, Layers, Maximize2, Minimize2,
  Navigation, Database
} from 'lucide-react';
import { MapStyle, PALETTES, LabelSettings, TitleSettings, Annotation, MapDataState, SAMPLE_DATASET } from '../types';

interface Feature {
  type: 'Feature';
  id: string; // ISO 3166-1 numeric code
  properties: {
    name: string;
  };
  geometry: any;
}

interface MapPreviewProps {
  mapStyle: MapStyle;
  labelSettings: LabelSettings;
  titleSettings: TitleSettings;
  annotations: Annotation[];
  isAddingAnnotation: boolean;
  onAddAnnotation: (a: Annotation) => void;
  onUpdateAnnotation: (id: string, text: string) => void;
  onDeleteAnnotation: (id: string) => void;
  onMoveAnnotation: (id: string, x: number, y: number) => void;
  
  // Lifted Data State
  mapData: MapDataState | null;
  setMapData: (data: MapDataState | null) => void;
}

// ... (Keep existing helpers like ID_TO_ISO, getFlagEmoji) ...
const ID_TO_ISO: Record<string, string> = {
  '840': 'US', '124': 'CA', '156': 'CN', '356': 'IN', '076': 'BR', 
  '643': 'RU', '036': 'AU', '276': 'DE', '250': 'FR', '826': 'GB', 
  '710': 'ZA', '392': 'JP', '380': 'IT', '724': 'ES', '484': 'MX', 
  '032': 'AR', '818': 'EG', '566': 'NG', '360': 'ID', '792': 'TR', 
  '682': 'SA', '410': 'KR', '702': 'SG', '756': 'CH', '528': 'NL',
  '752': 'SE', '578': 'NO', '208': 'DK', '246': 'FI', '616': 'PL'
};

const getFlagEmoji = (numericId: string) => {
  const iso = ID_TO_ISO[numericId];
  if (!iso) return null;
  const codePoints = iso.toUpperCase().split('').map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

type ProjectionType = 'mercator' | 'orthographic' | 'equalEarth';

export const MapPreview: React.FC<MapPreviewProps> = ({ 
  mapStyle, 
  labelSettings, 
  titleSettings,
  annotations,
  isAddingAnnotation,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onMoveAnnotation,
  mapData, 
  setMapData
}) => {
  // -- State --
  const [geoData, setGeoData] = useState<Feature[]>([]);
  const [meshData, setMeshData] = useState<any>(null); 
  const [loading, setLoading] = useState(true);
  const [projectionType, setProjectionType] = useState<ProjectionType>('mercator');
  
  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Feature[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  // View State
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [transform, setTransform] = useState({ k: 1, x: 0, y: 0 }); 
  
  // D3 Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomBehavior = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // Interaction State
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: '' });

  // Annotation Editing
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [draggingAnnotationId, setDraggingAnnotationId] = useState<string | null>(null);

  // -- Initialization --

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          const { width, height } = entries[0].contentRect;
          setDimensions({ width, height });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
        const topology = await response.json();
        // @ts-ignore
        const features = topojson.feature(topology, topology.objects.countries).features;
        // @ts-ignore
        const mesh = topojson.mesh(topology, topology.objects.countries);
        const filteredFeatures = features.filter((f: Feature) => f.id !== '010');
        
        setGeoData(filteredFeatures);
        setMeshData(mesh);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load map data", error);
        setLoading(false);
      }
    };
    fetchTopology();
  }, []);

  // -- D3 Logic --

  const { pathGenerator } = useMemo(() => {
    let proj: d3.GeoProjection;
    const w = dimensions.width;
    const h = dimensions.height;

    switch (projectionType) {
      case 'orthographic':
        proj = d3.geoOrthographic().fitExtent([[20, 20], [w - 20, h - 20]], { type: "Sphere" });
        break;
      case 'equalEarth':
        proj = d3.geoEqualEarth().fitExtent([[20, 20], [w - 20, h - 20]], { type: "Sphere" });
        break;
      case 'mercator':
      default:
        proj = d3.geoMercator().fitExtent([[20, 20], [w - 20, h - 20]], { type: "Sphere" });
    }

    const pathGen = d3.geoPath().projection(proj);
    return { projection: proj, pathGenerator: pathGen };
  }, [projectionType, dimensions]);

  // Minimap Projection
  const minimapProps = useMemo(() => {
    const size = 120;
    const proj = d3.geoMercator().fitSize([size, size], { type: "Sphere" });
    const path = d3.geoPath().projection(proj);
    return { proj, path, size };
  }, []);

  // Zoom Behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    zoomBehavior.current = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .extent([[0, 0], [dimensions.width, dimensions.height]])
      .on('zoom', (event) => {
        if (gRef.current) {
          d3.select(gRef.current).attr('transform', event.transform.toString());
          setTransform({ k: event.transform.k, x: event.transform.x, y: event.transform.y });
        }
      });

    const svg = d3.select(svgRef.current);
    svg.call(zoomBehavior.current);
    svg.on("dblclick.zoom", null);
  }, [dimensions]);

  // Color Scale
  const colorScale = useMemo(() => {
    if (!mapData) return null;
    const values = Object.values(mapData.values);
    const paletteColors = PALETTES[mapStyle.palette];
    
    // Create an interpolator or range
    const rangeColors = d3.quantize(d3.interpolateRgbBasis(paletteColors), mapStyle.classesCount);
    
    // Fallback for simple quantile
    return d3.scaleQuantile<string>().domain(values).range(rangeColors);
  }, [mapData, mapStyle]);

  // -- Interaction --

  const handleZoom = (factor: number) => {
    if (!svgRef.current || !zoomBehavior.current) return;
    d3.select(svgRef.current).transition().duration(300).ease(d3.easeCubicOut).call(zoomBehavior.current.scaleBy, factor);
  };

  const resetView = () => {
    if (!svgRef.current || !zoomBehavior.current) return;
    d3.select(svgRef.current).transition().duration(750).ease(d3.easeCubicInOut).call(zoomBehavior.current.transform, d3.zoomIdentity);
    setSelectedFeatureId(null);
  };

  const focusOnFeature = (feature: Feature) => {
    setSelectedFeatureId(feature.id);
    const bounds = pathGenerator.bounds(feature);
    const dx = bounds[1][0] - bounds[0][0];
    const dy = bounds[1][1] - bounds[0][1];
    const x = (bounds[0][0] + bounds[1][0]) / 2;
    const y = (bounds[0][1] + bounds[1][1]) / 2;
    const scale = Math.max(1, Math.min(8, 0.9 / Math.max(dx / dimensions.width, dy / dimensions.height)));
    const translate = [dimensions.width / 2 - scale * x, dimensions.height / 2 - scale * y];

    if (svgRef.current && zoomBehavior.current) {
      d3.select(svgRef.current).transition().duration(750).ease(d3.easeCubicInOut).call(zoomBehavior.current.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
    }
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (val.length > 1) {
      const results = geoData.filter(f => f.properties.name.toLowerCase().includes(val.toLowerCase()));
      setSearchResults(results.slice(0, 5));
      setIsSearchActive(true);
    } else {
      setSearchResults([]);
      setIsSearchActive(false);
    }
  };

  const selectSearchResult = (feature: Feature) => {
    setSearchQuery(feature.properties.name);
    setIsSearchActive(false);
    focusOnFeature(feature);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // -- Visual Helpers --

  const getFill = (feature: Feature) => {
    if (selectedFeatureId === feature.id) return '#06b6d4';
    if (mapData && colorScale && mapData.values[feature.id] !== undefined) return colorScale(mapData.values[feature.id]);
    return '#1e293b';
  };

  const getOpacity = (feature: Feature) => {
    if (selectedFeatureId && selectedFeatureId !== feature.id) return 0.4;
    return 1;
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (isAddingAnnotation && svgRef.current) {
      const t = d3.zoomTransform(svgRef.current);
      const rect = svgRef.current.getBoundingClientRect();
      const [x, y] = t.invert([e.clientX - rect.left, e.clientY - rect.top]);
      onAddAnnotation({ id: Date.now().toString(), x, y, text: 'New Annotation' });
    } else {
      if (selectedFeatureId) {
        setSelectedFeatureId(null);
        resetView();
      }
    }
  };

  // -- Render --

  return (
    <GlassPanel 
      className={`h-full w-full relative flex flex-col group overflow-hidden transition-colors duration-500`}
      style={{ backgroundColor: mapStyle.backgroundColor }} 
    >
      <div 
        ref={containerRef} 
        className="relative w-full h-full overflow-hidden bg-transparent"
      >
        
        {/* --- Top Left: Search Card --- */}
        <div className="absolute top-4 left-4 z-30 w-72">
           <div className={`
              relative flex items-center bg-white rounded-lg shadow-xl transition-all duration-300
              ${isSearchActive ? 'rounded-b-none' : ''}
           `}>
              <div className="pl-3 text-slate-400"><Search size={18}/></div>
              <input 
                 type="text" 
                 className="w-full bg-transparent border-none p-3 text-sm text-slate-800 focus:outline-none placeholder-slate-400"
                 placeholder="Search Google Maps..."
                 value={searchQuery}
                 onChange={handleSearchInput}
                 onFocus={() => searchQuery.length > 1 && setIsSearchActive(true)}
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(''); setIsSearchActive(false); }} className="p-2 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
           </div>
           
           {/* Autocomplete Results */}
           {isSearchActive && searchResults.length > 0 && (
             <div className="absolute top-full left-0 w-full bg-white rounded-b-lg shadow-xl overflow-hidden border-t border-slate-100">
                {searchResults.map(feature => (
                  <button
                    key={feature.id}
                    onClick={() => selectSearchResult(feature)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-center gap-3 text-sm text-slate-700 transition-colors"
                  >
                    <span className="text-lg">{getFlagEmoji(feature.id) || '🏳️'}</span>
                    {feature.properties.name}
                  </button>
                ))}
             </div>
           )}
        </div>

        {/* --- Top Right: Projection & Data --- */}
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-3 items-end">
           {/* Projection Toggle */}
           <div className="bg-white rounded-lg shadow-lg p-1 flex gap-1">
               {(['mercator', 'equalEarth', 'orthographic'] as ProjectionType[]).map(pt => (
                 <button
                   key={pt}
                   onClick={() => setProjectionType(pt)}
                   className={`p-2 rounded transition-all ${projectionType === pt ? 'bg-slate-100 text-primary' : 'text-slate-400 hover:text-slate-600'}`}
                   title={pt}
                 >
                   {pt === 'mercator' ? <MapIcon size={18}/> : pt === 'equalEarth' ? <Layers size={18}/> : <Globe size={18}/>}
                 </button>
               ))}
           </div>

           {/* Data Badge */}
           {mapData && (
              <div className="bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-right-4">
                 <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    {mapData.metric}
                 </div>
                 <button onClick={() => setMapData(null)} className="text-slate-400 hover:text-red-500 transition-colors">
                   <X size={14} />
                 </button>
              </div>
           )}
           
           {!mapData && (
             <button 
               onClick={() => setMapData(SAMPLE_DATASET)}
               className="bg-white hover:bg-slate-50 text-primary font-semibold text-xs py-2 px-3 rounded-lg shadow-lg flex items-center gap-2 transition-all"
             >
               <Database size={14} /> Load Demo Data
             </button>
           )}
        </div>


        {/* --- Main SVG Map --- */}
        {loading ? (
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="flex flex-col items-center gap-4">
               <div className="w-16 h-16 border-4 border-slate-700 border-t-accent rounded-full animate-spin" />
               <span className="text-slate-500 font-mono text-sm animate-pulse">LOADING WORLD GEOMETRY...</span>
             </div>
           </div>
        ) : (
          <svg 
            ref={svgRef}
            width="100%" height="100%"
            className={`w-full h-full ${isAddingAnnotation ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'} outline-none`}
            onClick={handleMapClick}
            onMouseLeave={() => { setTooltip(prev => ({ ...prev, visible: false })); setHoveredFeature(null); }}
          >
             <defs>
               <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                 <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
               </filter>
             </defs>

             <g ref={gRef}>
                {geoData.map((feature) => {
                  const isSelected = selectedFeatureId === feature.id;
                  return (
                    <path
                      key={feature.id}
                      d={pathGenerator(feature) || ''}
                      fill={getFill(feature)}
                      fillOpacity={getOpacity(feature)}
                      stroke={isSelected ? '#fff' : mapStyle.borderColor}
                      strokeWidth={isSelected ? 1.5 : mapStyle.showBorders ? mapStyle.borderWidth : 0}
                      vectorEffect="non-scaling-stroke" 
                      className="transition-all duration-300 ease-out"
                      style={{ filter: isSelected || hoveredFeature?.id === feature.id ? 'url(#shadow)' : 'none' }}
                      onMouseEnter={(e) => {
                         setHoveredFeature(feature);
                         const rect = containerRef.current?.getBoundingClientRect();
                         if (rect) {
                           setTooltip({ visible: true, x: e.clientX - rect.left, y: e.clientY - rect.top, content: '' });
                         }
                      }}
                      onMouseMove={(e) => {
                        const rect = containerRef.current?.getBoundingClientRect();
                         if (rect) {
                           setTooltip(prev => ({ ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }));
                         }
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        focusOnFeature(feature);
                      }}
                      onClick={(e) => {
                        if (!isAddingAnnotation) {
                          e.stopPropagation();
                          focusOnFeature(feature);
                        }
                      }}
                    />
                  );
                })}

                {/* Labels */}
                {labelSettings.showLabels && geoData.map(feature => {
                   const centroid = pathGenerator.centroid(feature);
                   const area = pathGenerator.area(feature);
                   const isVisible = (area * transform.k > 600) || (transform.k > 4); 
                   if (!centroid || isNaN(centroid[0]) || (!isVisible && !labelSettings.smartLabels)) return null;
                   return (
                     <text
                        key={`label-${feature.id}`}
                        x={centroid[0]}
                        y={centroid[1]}
                        textAnchor="middle"
                        dy=".35em"
                        className="pointer-events-none select-none drop-shadow-md transition-opacity duration-500"
                        style={{
                          fill: labelSettings.color,
                          fontFamily: labelSettings.fontFamily,
                          fontSize: `${labelSettings.fontSize / transform.k}px`, 
                          opacity: isVisible || hoveredFeature?.id === feature.id ? 1 : 0
                        }}
                     >
                       {feature.properties.name}
                     </text>
                   );
                })}

                {/* Annotations */}
                {annotations.map((ann) => (
                    <foreignObject
                      key={ann.id}
                      x={ann.x}
                      y={ann.y}
                      width={1} height={1} 
                      className="overflow-visible"
                    >
                       <div 
                         className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                         onMouseDown={(e) => { e.stopPropagation(); setDraggingAnnotationId(ann.id); }}
                       >
                          {editingAnnotationId === ann.id ? (
                             <textarea
                               autoFocus
                               defaultValue={ann.text}
                               onBlur={(e) => { onUpdateAnnotation(ann.id, e.target.value); setEditingAnnotationId(null); }}
                               onMouseDown={(e) => e.stopPropagation()}
                               className="bg-slate-800/90 text-white p-2 rounded border border-accent min-w-[150px]"
                               style={{ fontSize: `${14 / transform.k}px`, transform: `scale(${1/transform.k})` }}
                             />
                          ) : (
                             <div 
                               onDoubleClick={(e) => { e.stopPropagation(); setEditingAnnotationId(ann.id); }}
                               className="cursor-move px-2 py-1 rounded hover:bg-black/30 border border-transparent hover:border-white/20 transition-all"
                             >
                                <div style={{ color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.5)', fontSize: `${16 / transform.k}px`, whiteSpace: 'nowrap' }}>
                                  {ann.text}
                                </div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); onDeleteAnnotation(ann.id); }}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ transform: `scale(${1/transform.k})` }}
                                >
                                  <X size={10} />
                                </button>
                             </div>
                          )}
                       </div>
                    </foreignObject>
                ))}
             </g>
          </svg>
        )}

        {/* --- Tooltip --- */}
        <div 
          className="absolute z-50 pointer-events-none transition-all duration-100 ease-out"
          style={{ 
             left: tooltip.x, top: tooltip.y, 
             transform: `translate(-50%, -130%)`,
             opacity: tooltip.visible ? 1 : 0
          }}
        >
          {hoveredFeature && (
            <div className="bg-white rounded shadow-2xl p-3 min-w-[140px] text-slate-800 relative">
               <div className="flex items-center gap-2 mb-1 pb-1 border-b border-slate-100">
                  <span className="text-xl leading-none">{getFlagEmoji(hoveredFeature.id) || '🏳️'}</span>
                  <span className="font-bold text-sm">{hoveredFeature.properties.name}</span>
               </div>
               
               {mapData && mapData.values[hoveredFeature.id] !== undefined ? (
                  <div className="flex justify-between items-center text-xs">
                     <span className="text-slate-500">{mapData.metric}:</span>
                     <span className="font-mono font-bold text-primary">{mapData.values[hoveredFeature.id]}</span>
                  </div>
               ) : (
                  <div className="text-[10px] text-slate-400 italic">No data available</div>
               )}

               <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 shadow-sm" />
            </div>
          )}
        </div>

        {/* --- Bottom Right: Google-style Controls --- */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-30">
           <div className="flex flex-col bg-white rounded-lg shadow-xl overflow-hidden">
              <button onClick={() => handleZoom(1.4)} className="p-3 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 text-slate-600 transition-colors">
                <Plus size={20} />
              </button>
              <button onClick={() => handleZoom(0.7)} className="p-3 hover:bg-slate-50 active:bg-slate-100 text-slate-600 transition-colors">
                <Minus size={20} />
              </button>
           </div>
           <button onClick={resetView} className="bg-white p-3 rounded-lg shadow-xl hover:bg-slate-50 active:bg-slate-100 text-slate-600 transition-colors" title="Reset">
             <Navigation size={20} className={transform.k > 1 ? "text-primary fill-primary/20" : ""} />
           </button>
           <button onClick={toggleFullscreen} className="bg-white p-3 rounded-lg shadow-xl hover:bg-slate-50 active:bg-slate-100 text-slate-600 transition-colors">
             {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
           </button>
        </div>

        {/* --- Bottom Left: Minimap --- */}
        <div className="absolute bottom-6 left-6 z-20 hidden md:block">
           <div className="bg-white/90 backdrop-blur border-4 border-white rounded-lg shadow-2xl overflow-hidden w-[120px] h-[120px] relative transition-transform hover:scale-105 duration-300">
               <svg width="100%" height="100%" viewBox={`0 0 ${minimapProps.size} ${minimapProps.size}`}>
                  <path d={minimapProps.path(meshData) || ''} fill="#cbd5e1" />
                  <rect
                    x={-transform.x / transform.k / (dimensions.width / minimapProps.size)}
                    y={-transform.y / transform.k / (dimensions.width / minimapProps.size)}
                    width={dimensions.width / transform.k / (dimensions.width / minimapProps.size)}
                    height={dimensions.height / transform.k / (dimensions.width / minimapProps.size)}
                    fill="none" stroke="#0ea5e9" strokeWidth={1.5}
                  />
               </svg>
           </div>
        </div>

        {/* --- Bottom Center: Legend --- */}
        {mapData && (
           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur rounded-full px-4 py-2 shadow-xl flex items-center gap-3 border border-white">
              <span className="text-[10px] font-bold text-slate-500">{d3.min(Object.values(mapData.values))}</span>
              <div className="w-32 h-2 rounded-full" style={{ background: `linear-gradient(to right, ${PALETTES[mapStyle.palette].join(', ')})` }} />
              <span className="text-[10px] font-bold text-slate-500">{d3.max(Object.values(mapData.values))}</span>
           </div>
        )}

      </div>
    </GlassPanel>
  );
};