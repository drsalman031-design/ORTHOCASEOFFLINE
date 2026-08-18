import React, { useState, useRef, useMemo } from 'react';
import {
  Sparkles,
  Compass,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Eye,
  Sun,
  ChevronLeft,
  ChevronRight,
  Target,
  Layers,
  Ruler,
  Info,
  SlidersHorizontal,
  Table,
  Activity,
  Award,
  Zap,
} from 'lucide-react';
import { CephLandmarkModuleData, CephPlaneResult } from '../../../types';
import { runGeometryEngine, calculateLineIntersection } from './geometryEngine';

interface GeometryEngineWorkspaceProps {
  originalImage: string;
  data?: CephLandmarkModuleData;
  onUpdateData?: (data: CephLandmarkModuleData) => void;
  onProceedToAnalysis?: () => void;
  onBackToReview?: () => void;
}

export const GeometryEngineWorkspace: React.FC<GeometryEngineWorkspaceProps> = ({
  originalImage,
  data,
  onUpdateData,
  onProceedToAnalysis,
  onBackToReview,
}) => {
  const landmarks = data?.landmarks || {};
  const scalePixelsPerMm = data?.calibration?.scalePixelsPerMm || 10;

  // Run pure mathematical Geometry Engine calculations
  const geometryData = useMemo(() => {
    return runGeometryEngine(landmarks, scalePixelsPerMm);
  }, [landmarks, scalePixelsPerMm]);

  // Plane visibility toggle states: { [planeId]: boolean }
  const [visiblePlanes, setVisiblePlanes] = useState<Record<string, boolean>>({
    sn_plane: true,
    frankfort_plane: true,
    palatal_plane: true,
    occlusal_plane: true,
    mandibular_plane: true,
    facial_plane: true,
    facial_axis: true,
    y_axis: true,
    na_line: true,
    nb_line: true,
    basion_nasion: true,
    ricketts_eline: true,
    holdaway_hline: true,
    u1_axis: true,
    l1_axis: true,
    ramus_line: true,
  });

  // Active view mode in right panel
  const [activeTab, setActiveTab] = useState<'planes' | 'angles' | 'linears'>('planes');

  // Active Selected Plane for detail inspection
  const [selectedPlaneId, setSelectedPlaneId] = useState<string | null>('sn_plane');

  // Canvas View Controls
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle plane visibility
  const togglePlane = (id: string) => {
    setVisiblePlanes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle all planes
  const toggleAllPlanes = (visible: boolean) => {
    const updated: Record<string, boolean> = {};
    geometryData.planes.forEach((p) => {
      updated[p.id] = visible;
    });
    setVisiblePlanes(updated);
  };

  // Canvas Mouse Interactions for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev * 1.15, 5));
    } else {
      setZoom((prev) => Math.max(prev / 1.15, 0.4));
    }
  };

  // Save geometry calculations back to parent module data
  const handleSaveGeometry = () => {
    const updatedModuleData: CephLandmarkModuleData = {
      ...data,
      originalImage,
      landmarks,
      geometryData,
      currentStep: 'geometry',
    };
    onUpdateData?.(updatedModuleData);
    onProceedToAnalysis?.();
  };

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">
      {/* HEADER BANNER */}
      <div className="bg-[#0B1329] border border-[#1E293B] text-white rounded-[24px] p-5 shadow-md space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-extrabold border border-cyan-400/30 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>Phase 5 • Mathematical Geometry Engine</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Cephalometric Reference Planes & Geometry
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              100% automated vector calculations for cranial base, maxillary, mandibular, occlusal, and soft-tissue reference planes.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="bg-[#0D1836] border border-[#1E293B] rounded-[20px] p-3 text-center shrink-0 min-w-[220px] space-y-1 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              Calculated Planes & Geometry
            </span>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-2xl font-black text-cyan-400">{geometryData.planes.length}</span>
              <span className="text-xs font-bold text-slate-300">Planes</span>
              <span className="text-slate-500">•</span>
              <span className="text-2xl font-black text-emerald-400">{geometryData.angles.length}</span>
              <span className="text-xs font-bold text-slate-300">Angles</span>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT: CANVAS VIEW (LEFT) + GEOMETRY METRICS PANEL (RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: INTERACTIVE CANVAS WITH PLANES OVERLAY */}
        <div className="lg:col-span-7 space-y-3">
          {/* VIEW CONTROLS TOOLBAR */}
          <div className="bg-[#0B1329] border border-[#1E293B] rounded-[20px] p-3 text-white shadow-md flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-200">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Cephalogram Vector Canvas</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(prev * 1.25, 5))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-cyan-300" />
              </button>

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(prev / 1.25, 0.4))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-cyan-300" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setPan({ x: 0, y: 0 });
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer active:scale-95"
              >
                Fit
              </button>

              <button
                type="button"
                onClick={() => setInvert((v) => !v)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  invert ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Invert</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFiltersPanel((v) => !v)}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showFiltersPanel ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* BRIGHTNESS / CONTRAST ADJUSTMENT */}
          {showFiltersPanel && (
            <div className="bg-[#0B1329] border border-[#1E293B] rounded-[18px] p-3 text-white shadow-sm space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Brightness</span>
                    </span>
                    <span className="font-mono text-cyan-300">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Contrast</span>
                    </span>
                    <span className="font-mono text-cyan-300">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* RADIOGRAPH CANVAS WITH VECTOR PLANES OVERLAY */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-[62vh] min-h-[460px] max-h-[660px] bg-[#030712] rounded-[24px] border-2 border-[#1E293B] relative overflow-hidden flex items-center justify-center select-none shadow-2xl cursor-grab active:cursor-grabbing"
            style={{
              backgroundImage:
                'radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #030712 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          >
            <div
              className="relative transition-transform duration-75 ease-out touch-none flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              <img
                ref={imgRef}
                src={originalImage}
                alt="Radiograph Vector Geometry"
                draggable={false}
                className="max-w-none shadow-2xl block"
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                    invert ? 'invert(100%)' : ''
                  }`,
                  maxHeight: '82vh',
                  maxWidth: '85vw',
                  objectFit: 'contain',
                }}
              />

              {/* OVERLAY SVG FOR VECTOR PLANES */}
              {imgRef.current && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  viewBox={`0 0 ${imgRef.current.naturalWidth || 1000} ${
                    imgRef.current.naturalHeight || 1000
                  }`}
                >
                  {/* DRAW ALL CALCULATED PLANES */}
                  {geometryData.planes.map((plane) => {
                    if (!visiblePlanes[plane.id]) return null;

                    const isSelected = selectedPlaneId === plane.id;
                    const strokeW = isSelected ? 3.5 : 2;

                    // Calculate extended line coordinates for visualization
                    const dx = plane.endPoint.x - plane.startPoint.x;
                    const dy = plane.endPoint.y - plane.startPoint.y;

                    // Extend line outward by factor of 0.5 for extended plane appearance
                    const extP1 = {
                      x: plane.startPoint.x - dx * 0.3,
                      y: plane.startPoint.y - dy * 0.3,
                    };
                    const extP2 = {
                      x: plane.endPoint.x + dx * 0.3,
                      y: plane.endPoint.y + dy * 0.3,
                    };

                    // Label midpoint
                    const midX = (plane.startPoint.x + plane.endPoint.x) / 2;
                    const midY = (plane.startPoint.y + plane.endPoint.y) / 2;

                    return (
                      <g
                        key={plane.id}
                        className="pointer-events-auto cursor-pointer"
                        onClick={() => setSelectedPlaneId(plane.id)}
                      >
                        {/* Extended Plane Line */}
                        <line
                          x1={extP1.x}
                          y1={extP1.y}
                          x2={extP2.x}
                          y2={extP2.y}
                          stroke={plane.color}
                          strokeWidth={strokeW}
                          strokeDasharray={isSelected ? 'none' : '4 2'}
                          strokeOpacity={isSelected ? 1 : 0.85}
                        />

                        {/* Defining Points */}
                        <circle
                          cx={plane.startPoint.x}
                          cy={plane.startPoint.y}
                          r={isSelected ? '5' : '3.5'}
                          fill={plane.color}
                        />
                        <circle
                          cx={plane.endPoint.x}
                          cy={plane.endPoint.y}
                          r={isSelected ? '5' : '3.5'}
                          fill={plane.color}
                        />

                        {/* Plane Abbreviation Label */}
                        <text
                          x={midX + 8}
                          y={midY - 6}
                          fill={plane.color}
                          fontSize="13"
                          fontWeight="900"
                          fontFamily="sans-serif"
                          style={{
                            textShadow: '0px 1px 4px rgba(0,0,0,0.95)',
                          }}
                        >
                          {plane.abbreviation} ({plane.angleDegrees}°)
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* QUICK TOGGLE FILTER PILLS FOR PLANES */}
          <div className="bg-[#0B1329] border border-[#1E293B] rounded-[20px] p-3 text-white shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1 text-cyan-300 uppercase tracking-wider text-[11px]">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Toggle Reference Planes</span>
              </span>
              <div className="flex items-center gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => toggleAllPlanes(true)}
                  className="text-cyan-400 hover:underline font-bold cursor-pointer"
                >
                  Show All
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => toggleAllPlanes(false)}
                  className="text-slate-400 hover:underline font-bold cursor-pointer"
                >
                  Hide All
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {geometryData.planes.map((plane) => {
                const active = visiblePlanes[plane.id];
                return (
                  <button
                    key={plane.id}
                    type="button"
                    onClick={() => togglePlane(plane.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      active
                        ? 'bg-slate-800 text-white border-slate-600 shadow-xs'
                        : 'bg-slate-900/50 text-slate-500 border-slate-800'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: plane.color, opacity: active ? 1 : 0.3 }}
                    />
                    <span>{plane.abbreviation}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: MATHEMATICAL METRICS, PLANES TABLE & ANGLES */}
        <div className="lg:col-span-5 space-y-3">
          {/* NAVIGATION TABS (PLANES TABLE / CEPH ANGLES / LINEAR METRICS) */}
          <div className="bg-white border border-slate-200 rounded-[22px] p-2 shadow-xs flex items-center justify-between gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('planes')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'planes'
                  ? 'bg-[#071B49] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Planes ({geometryData.planes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('angles')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'angles'
                  ? 'bg-[#071B49] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Angles ({geometryData.angles.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('linears')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'linears'
                  ? 'bg-[#071B49] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              <span>Linears ({geometryData.linears.length})</span>
            </button>
          </div>

          {/* TAB 1: PLANES TABLE */}
          {activeTab === 'planes' && (
            <div className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-[#071B49] uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-[#2563EB]" />
                  <span>Automatically Generated Planes</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-400">
                  Math Model: Vector Slope Line Equations
                </span>
              </div>

              {/* TABLE OF PLANES */}
              <div className="max-h-[460px] overflow-y-auto border border-slate-200 rounded-xl text-xs">
                <table className="w-full text-left border-collapse font-sans">
                  <thead className="bg-slate-100 text-slate-600 font-bold text-[11px] sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Plane</th>
                      <th className="p-2.5">Angle</th>
                      <th className="p-2.5">Length</th>
                      <th className="p-2.5 text-right">Equation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {geometryData.planes.map((plane) => {
                      const isSelected = selectedPlaneId === plane.id;

                      return (
                        <tr
                          key={plane.id}
                          onClick={() => setSelectedPlaneId(plane.id)}
                          className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                            isSelected ? 'bg-blue-50/80 font-bold' : ''
                          }`}
                        >
                          <td className="p-2.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: plane.color }}
                              />
                              <div>
                                <div className="font-extrabold text-[#071B49] text-xs">
                                  {plane.name} ({plane.abbreviation})
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="p-2.5 font-mono text-xs font-bold text-slate-700">
                            {plane.angleDegrees}°
                          </td>

                          <td className="p-2.5 font-mono text-xs text-slate-700">
                            {plane.lengthMm} mm
                          </td>

                          <td className="p-2.5 text-right font-mono text-[10px] text-slate-500">
                            {plane.equation.a}x + {plane.equation.b}y + {plane.equation.c} = 0
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: CALCULATED CEPHALOMETRIC ANGLES */}
          {activeTab === 'angles' && (
            <div className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-[#071B49] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-[#2563EB]" />
                  <span>Calculated Plane Angles</span>
                </h4>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Auto Calculated
                </span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {geometryData.angles.map((ang) => (
                  <div
                    key={ang.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#071B49]">{ang.name}</span>
                      <span className="text-sm font-black font-mono text-[#2563EB] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {ang.valueDegrees}°
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Norm: {ang.normalRange}</span>
                      <span className="font-bold text-slate-700">{ang.interpretation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LINEAR MEASUREMENTS */}
          {activeTab === 'linears' && (
            <div className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-extrabold text-[#071B49] uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-[#2563EB]" />
                  <span>Calculated Linear Distances</span>
                </h4>
                <span className="text-[10px] font-bold text-slate-400">Scale Calibrated</span>
              </div>

              <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                {geometryData.linears.map((lin) => (
                  <div
                    key={lin.id}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#071B49]">{lin.name}</span>
                      <span className="text-sm font-black font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                        {lin.valueMm} mm
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Norm: {lin.normalRange}</span>
                      <span className="font-bold text-slate-700">{lin.interpretation}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER NAVIGATION & ACTION BAR */}
      <div className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-sm flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToReview}
          className="px-4 py-3 rounded-[16px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Landmark Review</span>
        </button>

        <button
          type="button"
          onClick={handleSaveGeometry}
          className="px-6 py-3.5 rounded-[18px] bg-[#071B49] hover:bg-[#0A2668] text-white text-sm font-extrabold shadow-md shadow-[#071B49]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-[#0A2668]"
        >
          <span>Proceed to Ceph Analysis Tables</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default GeometryEngineWorkspace;
