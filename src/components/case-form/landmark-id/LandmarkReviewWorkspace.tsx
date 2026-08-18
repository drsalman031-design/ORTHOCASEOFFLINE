import React, { useState, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Edit3,
  Save,
  ChevronLeft,
  ChevronRight,
  Target,
  Sliders,
  Sun,
  Eye,
  Check,
  RefreshCcw,
  Sparkles,
  Search,
  Move,
  Layers,
  ShieldCheck,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { CEPH_LANDMARKS, LandmarkDefinition } from './landmarksData';
import { CephLandmarkModuleData } from '../../../types';

interface LandmarkReviewWorkspaceProps {
  originalImage: string;
  data?: CephLandmarkModuleData;
  onUpdateData?: (data: CephLandmarkModuleData) => void;
  onProceedToAnalysis?: () => void;
  onBackToIdentification?: () => void;
}

export const LandmarkReviewWorkspace: React.FC<LandmarkReviewWorkspaceProps> = ({
  originalImage,
  data,
  onUpdateData,
  onProceedToAnalysis,
  onBackToIdentification,
}) => {
  // Landmarks state dictionary map: { landmarkId: { x: number, y: number } }
  const [landmarks, setLandmarks] = useState<Record<string, { x: number; y: number }>>(
    data?.landmarks || {}
  );

  // Status flags map per landmark: 'correct' (green) | 'needs_review' (yellow)
  const [landmarkStatuses, setLandmarkStatuses] = useState<Record<string, 'correct' | 'needs_review'>>({});

  // Active selected landmark for editing/moving
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);

  // Manual Editing Coordinate Input State
  const [manualX, setManualX] = useState<number>(0);
  const [manualY, setManualY] = useState<number>(0);

  // Canvas View Controls
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  // Dragging Landmark Pin State
  const [draggingLandmarkId, setDraggingLandmarkId] = useState<string | null>(null);

  // Filter / Search in Coordinate Table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Correct' | 'Needs Review' | 'Missing'>('All');

  // Notification Toast for Save
  const [saveToastVisible, setSaveToastVisible] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Quality Score Calculation
  const totalCount = CEPH_LANDMARKS.length;
  const placedCount = Object.keys(landmarks).length;
  const missingCount = totalCount - placedCount;
  const completenessScore = Math.round((placedCount / totalCount) * 100);

  // Needs review count
  const needsReviewCount = Object.values(landmarkStatuses).filter((s) => s === 'needs_review').length;

  // Calculate Overall Quality Score (weighted score out of 100)
  const qualityScore = Math.max(0, Math.round(completenessScore - needsReviewCount * 2));

  // Helper to commit landmark updates to parent
  const handleUpdateLandmarks = (updated: Record<string, { x: number; y: number }>) => {
    setLandmarks(updated);
    const updatedModuleData: CephLandmarkModuleData = {
      ...data,
      originalImage,
      landmarks: updated,
      currentStep: 'review',
    };
    onUpdateData?.(updatedModuleData);
  };

  // Toggle Landmark Status (Correct vs Needs Review)
  const handleToggleStatus = (id: string) => {
    setLandmarkStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === 'needs_review' ? 'correct' : 'needs_review',
    }));
  };

  // Delete Landmark
  const handleDeleteLandmark = (id: string) => {
    const updated = { ...landmarks };
    delete updated[id];
    handleUpdateLandmarks(updated);
    if (selectedLandmarkId === id) {
      setSelectedLandmarkId(null);
    }
  };

  // Select landmark for inspection or manual coordinate edit
  const handleSelectLandmark = (id: string) => {
    setSelectedLandmarkId(id);
    if (landmarks[id]) {
      setManualX(landmarks[id].x);
      setManualY(landmarks[id].y);
    }
  };

  // Apply manual coordinate edit
  const handleApplyManualCoords = () => {
    if (!selectedLandmarkId) return;
    const updated = {
      ...landmarks,
      [selectedLandmarkId]: { x: Math.round(manualX), y: Math.round(manualY) },
    };
    handleUpdateLandmarks(updated);
  };

  // Save Review Data
  const handleSaveReview = () => {
    const updatedModuleData: CephLandmarkModuleData = {
      ...data,
      originalImage,
      landmarks,
      currentStep: 'review',
    };
    onUpdateData?.(updatedModuleData);
    setSaveToastVisible(true);
    setTimeout(() => setSaveToastVisible(false), 3000);
  };

  // Canvas Interactions
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !draggingLandmarkId) {
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
      return;
    }

    if (draggingLandmarkId && imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const naturalWidth = imgRef.current.naturalWidth || rect.width;
      const naturalHeight = imgRef.current.naturalHeight || rect.height;

      const imgX = Math.round((clickX / rect.width) * naturalWidth);
      const imgY = Math.round((clickY / rect.height) * naturalHeight);

      setLandmarks((prev) => ({
        ...prev,
        [draggingLandmarkId]: { x: imgX, y: imgY },
      }));
      setManualX(imgX);
      setManualY(imgY);
    }
  };

  const handleMouseUp = () => {
    if (draggingLandmarkId) {
      handleUpdateLandmarks(landmarks);
      setDraggingLandmarkId(null);
    }
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

  // Filtered Landmarks List for Coordinate Table
  const filteredLandmarks = CEPH_LANDMARKS.filter((lm) => {
    const isPlaced = Boolean(landmarks[lm.id]);
    const status = !isPlaced ? 'Missing' : landmarkStatuses[lm.id] === 'needs_review' ? 'Needs Review' : 'Correct';

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Correct' && status === 'Correct') ||
      (statusFilter === 'Needs Review' && status === 'Needs Review') ||
      (statusFilter === 'Missing' && status === 'Missing');

    const matchesSearch =
      lm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lm.abbreviation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lm.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="w-full space-y-4 font-sans text-slate-800">
      {/* HEADER & QUALITY SCORE BANNER */}
      <div className="bg-[#0B1329] border border-[#1E293B] text-white rounded-[24px] p-5 shadow-md space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-extrabold border border-blue-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Phase 4 • Verification Protocol</span>
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Landmark Verification & Quality Review
            </h3>
            <p className="text-xs text-slate-300 font-medium">
              Verify complete anatomical landmark placements and inspect precision X,Y coordinates before running cephalometric analysis.
            </p>
          </div>

          {/* Quality Score Badge */}
          <div className="bg-[#0D1836] border border-[#1E293B] rounded-[20px] p-4 text-center shrink-0 min-w-[200px] space-y-1 shadow-inner">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
              Landmark Quality Score
            </span>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-emerald-400">{qualityScore}</span>
              <span className="text-sm font-bold text-slate-400">/ 100</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-slate-300 pt-0.5">
              <span className="text-emerald-400">{placedCount} Correct</span>
              <span>•</span>
              <span className="text-amber-400">{needsReviewCount} Review</span>
              <span>•</span>
              <span className="text-red-400">{missingCount} Missing</span>
            </div>
          </div>
        </div>
      </div>

      {/* SAVE TOAST NOTIFICATION */}
      {saveToastVisible && (
        <div className="bg-emerald-600 text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span>Landmark review data saved successfully to patient record.</span>
        </div>
      )}

      {/* MAIN TWO COLUMN LAYOUT: IMAGE CANVAS (LEFT/TOP) + COORDINATE TABLE (RIGHT/BOTTOM) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT COLUMN: COMPLETE IMAGE VIEW WITH ALL LANDMARKS OVERLAY */}
        <div className="lg:col-span-7 space-y-3">
          {/* VIEW CONTROLS TOOLBAR */}
          <div className="bg-[#0B1329] border border-[#1E293B] rounded-[20px] p-3 text-white shadow-md flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-extrabold text-slate-200">
              <Target className="w-4 h-4 text-blue-400" />
              <span>Cephalogram Map View ({placedCount} Landmarks Placed)</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(prev * 1.25, 5))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-blue-300" />
              </button>

              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(prev / 1.25, 0.4))}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-blue-300" />
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
                  invert ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Invert</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFiltersPanel((v) => !v)}
                className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  showFiltersPanel ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* BRIGHTNESS / CONTRAST PANEL */}
          {showFiltersPanel && (
            <div className="bg-[#0B1329] border border-[#1E293B] rounded-[18px] p-3 text-white shadow-sm space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Brightness</span>
                    </span>
                    <span className="font-mono text-blue-300">{brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={brightness}
                    onChange={(e) => setBrightness(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Contrast</span>
                    </span>
                    <span className="font-mono text-blue-300">{contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={contrast}
                    onChange={(e) => setContrast(Number(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* INTERACTIVE CANVAS WITH ALL LANDMARKS OVERLAY */}
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
                alt="Radiograph Complete Review"
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

              {/* OVERLAY SVG FOR ALL LANDMARK PINS */}
              {imgRef.current && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  viewBox={`0 0 ${imgRef.current.naturalWidth || 1000} ${
                    imgRef.current.naturalHeight || 1000
                  }`}
                >
                  {CEPH_LANDMARKS.map((lm) => {
                    const pos = landmarks[lm.id];
                    if (!pos) return null;

                    const isSelected = selectedLandmarkId === lm.id;
                    const status = landmarkStatuses[lm.id] || 'correct';

                    const colorHex = isSelected
                      ? '#3B82F6'
                      : status === 'needs_review'
                      ? '#F59E0B'
                      : '#10B981';

                    return (
                      <g
                        key={lm.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="pointer-events-auto cursor-pointer"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          handleSelectLandmark(lm.id);
                          setDraggingLandmarkId(lm.id);
                        }}
                      >
                        {/* Halo */}
                        <circle
                          r={isSelected ? '16' : '10'}
                          fill={colorHex}
                          fillOpacity="0.25"
                          stroke={colorHex}
                          strokeWidth="2"
                          className={isSelected ? 'animate-pulse' : ''}
                        />

                        {/* Center Dot */}
                        <circle r="3" fill={colorHex} />

                        {/* Label */}
                        <text
                          x="12"
                          y="-6"
                          fill={colorHex}
                          fontSize="12"
                          fontWeight="900"
                          fontFamily="sans-serif"
                          style={{
                            textShadow: '0px 1px 3px rgba(0,0,0,0.95)',
                          }}
                        >
                          {lm.abbreviation}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: COORDINATE TABLE & INSPECTOR PANEL */}
        <div className="lg:col-span-5 space-y-3">
          {/* INSPECTOR CARD FOR SELECTED LANDMARK */}
          {selectedLandmarkId && landmarks[selectedLandmarkId] ? (
            <div className="bg-[#0B1329] border border-[#1E293B] text-white rounded-[22px] p-4 shadow-md space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-[#1E293B] pb-2">
                <span className="text-xs font-black text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-blue-400" />
                  <span>Edit Selected Landmark</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedLandmarkId(null)}
                  className="text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>

              {(() => {
                const lm = CEPH_LANDMARKS.find((item) => item.id === selectedLandmarkId);
                if (!lm) return null;
                const status = landmarkStatuses[lm.id] || 'correct';

                return (
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-base font-extrabold text-white">
                        {lm.name} ({lm.abbreviation})
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">{lm.definition}</p>
                    </div>

                    {/* Manual Coordinate Editing Inputs */}
                    <div className="bg-[#0D1836] border border-[#1E293B] rounded-xl p-3 space-y-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Manual Coordinates (px):
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block">X Coordinate</label>
                          <input
                            type="number"
                            value={manualX}
                            onChange={(e) => setManualX(Number(e.target.value))}
                            className="w-full bg-[#071B49] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 block">Y Coordinate</label>
                          <input
                            type="number"
                            value={manualY}
                            onChange={(e) => setManualY(Number(e.target.value))}
                            className="w-full bg-[#071B49] border border-[#1E293B] rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-white outline-none focus:ring-1 focus:ring-blue-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={handleApplyManualCoords}
                          className="px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-blue-600 text-white text-xs font-bold transition-all cursor-pointer"
                        >
                          Apply Coords
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleStatus(lm.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            status === 'needs_review'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {status === 'needs_review' ? 'Mark Correct' : 'Flag Needs Review'}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => handleDeleteLandmark(lm.id)}
                        className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Landmark</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : null}

          {/* COORDINATE TABLE & FILTER BAR */}
          <div className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-xs font-extrabold text-[#071B49] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#2563EB]" />
                <span>Landmarks Coordinate Table</span>
              </h4>

              <div className="flex items-center gap-1 text-[11px] font-bold">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Green: Correct
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                  Yellow: Review
                </span>
                <span className="px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200">
                  Red: Missing
                </span>
              </div>
            </div>

            {/* Filter Pills & Search */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter landmarks table..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#071B49] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
                />
              </div>

              <div className="flex gap-1 text-[10px] font-bold">
                {(['All', 'Correct', 'Needs Review', 'Missing'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-[#071B49] text-white font-black'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* SCROLLABLE COORDINATE TABLE */}
            <div className="max-h-[380px] overflow-y-auto border border-slate-200 rounded-xl font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100 text-slate-600 font-sans font-bold text-[11px] sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Landmark</th>
                    <th className="p-2.5">X (px)</th>
                    <th className="p-2.5">Y (px)</th>
                    <th className="p-2.5 text-center">Status</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {filteredLandmarks.map((lm) => {
                    const pos = landmarks[lm.id];
                    const isPlaced = Boolean(pos);
                    const status = !isPlaced
                      ? 'Missing'
                      : landmarkStatuses[lm.id] === 'needs_review'
                      ? 'Needs Review'
                      : 'Correct';

                    const isSelected = selectedLandmarkId === lm.id;

                    return (
                      <tr
                        key={lm.id}
                        onClick={() => isPlaced && handleSelectLandmark(lm.id)}
                        className={`hover:bg-slate-50 transition-colors ${
                          isSelected ? 'bg-blue-50/70 font-bold' : ''
                        } ${isPlaced ? 'cursor-pointer' : ''}`}
                      >
                        <td className="p-2.5">
                          <div className="font-bold text-[#071B49] text-xs">
                            {lm.name} ({lm.abbreviation})
                          </div>
                          <div className="text-[10px] text-slate-400">{lm.category}</div>
                        </td>

                        <td className="p-2.5 font-mono">
                          {isPlaced ? pos.x : <span className="text-slate-300">--</span>}
                        </td>

                        <td className="p-2.5 font-mono">
                          {isPlaced ? pos.y : <span className="text-slate-300">--</span>}
                        </td>

                        <td className="p-2.5 text-center">
                          {status === 'Correct' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Correct</span>
                            </span>
                          )}

                          {status === 'Needs Review' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-extrabold">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Review</span>
                            </span>
                          )}

                          {status === 'Missing' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200 text-[10px] font-extrabold">
                              <XCircle className="w-3 h-3 text-red-600" />
                              <span>Missing</span>
                            </span>
                          )}
                        </td>

                        <td className="p-2.5 text-right">
                          {isPlaced ? (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleStatus(lm.id);
                                }}
                                className="p-1 rounded-md hover:bg-slate-200 text-slate-600 cursor-pointer"
                                title="Toggle Status"
                              >
                                <RefreshCcw className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLandmark(lm.id);
                                }}
                                className="p-1 rounded-md hover:bg-red-100 text-red-600 cursor-pointer"
                                title="Delete Landmark"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={onBackToIdentification}
                              className="text-[11px] font-extrabold text-[#2563EB] hover:underline cursor-pointer"
                            >
                              Mark Now
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* FOOTER ACTION BAR */}
      <div className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-sm flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToIdentification}
          className="px-4 py-3 rounded-[16px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Identification</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveReview}
            className="px-5 py-3 rounded-[16px] bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-300"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>Save Coordinates</span>
          </button>

          <button
            type="button"
            onClick={onProceedToAnalysis}
            className="px-6 py-3.5 rounded-[18px] bg-[#071B49] hover:bg-[#0A2668] text-white text-sm font-extrabold shadow-md shadow-[#071B49]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-[#0A2668]"
          >
            <span>Proceed to Ceph Analysis</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandmarkReviewWorkspace;
