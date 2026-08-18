import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Sun,
  Sliders,
  Eye,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Move,
  Target,
  Undo2,
  Redo2,
  RotateCcw,
  SkipForward,
  AlertTriangle,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { CEPH_LANDMARKS, LandmarkDefinition } from './landmarksData';
import { CephLandmarkModuleData } from '../../../types';

interface LandmarkIdentificationWorkspaceProps {
  originalImage: string;
  data?: CephLandmarkModuleData;
  onUpdateData?: (data: CephLandmarkModuleData) => void;
  onProceedToReview?: () => void;
  onBackToCalibration?: () => void;
}

export const LandmarkIdentificationWorkspace: React.FC<
  LandmarkIdentificationWorkspaceProps
> = ({
  originalImage,
  data,
  onUpdateData,
  onProceedToReview,
  onBackToCalibration,
}) => {
  // Landmarks dictionary map: { landmarkId: { x: number, y: number } }
  const [landmarks, setLandmarks] = useState<Record<string, { x: number; y: number }>>(
    data?.landmarks || {}
  );

  // Active selected landmark index (0 to CEPH_LANDMARKS.length - 1)
  const [activeLandmarkIndex, setActiveLandmarkIndex] = useState<number>(0);

  // Undo / Redo history stack
  const [history, setHistory] = useState<Array<Record<string, { x: number; y: number }>>>([
    data?.landmarks || {},
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Interaction Mode: 'place' (Tap to place) | 'pan' | 'drag'
  const [interactionMode, setInteractionMode] = useState<'place' | 'pan' | 'drag'>('place');

  // Dragging active placed landmark pin
  const [draggingLandmarkId, setDraggingLandmarkId] = useState<string | null>(null);

  // Viewer canvas transform controls
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);

  // Image load state tracking (Fixes blank black canvas issue)
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [imageError, setImageError] = useState<boolean>(false);

  // Floating Toast notification for auto placement
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Canvas Panning State
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  // Modals
  const [showMissingWarningModal, setShowMissingWarningModal] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const activeLandmark: LandmarkDefinition = CEPH_LANDMARKS[activeLandmarkIndex] || CEPH_LANDMARKS[0];

  // Sync state with parent data
  useEffect(() => {
    if (data?.landmarks && JSON.stringify(data.landmarks) !== JSON.stringify(landmarks)) {
      setLandmarks(data.landmarks);
    }
  }, [data]);

  // Image Load Handler - guarantees image is visible and scaled to fit container
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
    // Center and fit view cleanly
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  // Helper to commit landmark changes & trigger parent update immediately
  const commitLandmarksUpdate = useCallback(
    (newLandmarks: Record<string, { x: number; y: number }>) => {
      setLandmarks(newLandmarks);

      // Add to undo history
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newLandmarks);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);

      // Propagate to parent immediately
      const updatedData: CephLandmarkModuleData = {
        ...data,
        originalImage,
        landmarks: newLandmarks,
        currentStep: 'identification',
      };
      onUpdateData?.(updatedData);
    },
    [data, history, historyIndex, originalImage, onUpdateData]
  );

  // Trigger Toast Notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 1800);
  };

  // Undo Handler
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const prevLandmarks = history[prevIdx];
      setHistoryIndex(prevIdx);
      setLandmarks(prevLandmarks);

      const updatedData: CephLandmarkModuleData = {
        ...data,
        originalImage,
        landmarks: prevLandmarks,
        currentStep: 'identification',
      };
      onUpdateData?.(updatedData);
    }
  };

  // Redo Handler
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIdx = historyIndex + 1;
      const nextLandmarks = history[nextIdx];
      setHistoryIndex(nextIdx);
      setLandmarks(nextLandmarks);

      const updatedData: CephLandmarkModuleData = {
        ...data,
        originalImage,
        landmarks: nextLandmarks,
        currentStep: 'identification',
      };
      onUpdateData?.(updatedData);
    }
  };

  // Skip Current Landmark
  const handleSkipCurrent = () => {
    if (activeLandmarkIndex < CEPH_LANDMARKS.length - 1) {
      setActiveLandmarkIndex((prev) => prev + 1);
    }
  };

  // Go to Previous Landmark
  const handlePreviousLandmark = () => {
    if (activeLandmarkIndex > 0) {
      setActiveLandmarkIndex((prev) => prev - 1);
    }
  };

  // Reset Current Active Landmark Position
  const handleResetCurrentLandmark = () => {
    const newLandmarks = { ...landmarks };
    delete newLandmarks[activeLandmark.id];
    commitLandmarksUpdate(newLandmarks);
  };

  // Canvas Image Click to Place Active Landmark (AUTOMATIC SAVE -> ADVANCE NEXT)
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode === 'pan' || draggingLandmarkId) return;
    if (!imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Guard against clicks outside the actual image boundary
    if (clickX < 0 || clickX > rect.width || clickY < 0 || clickY > rect.height) return;

    const naturalWidth = imgRef.current.naturalWidth || rect.width;
    const naturalHeight = imgRef.current.naturalHeight || rect.height;

    const imgX = Math.round((clickX / rect.width) * naturalWidth);
    const imgY = Math.round((clickY / rect.height) * naturalHeight);

    // Save X, Y coordinate automatically
    const updated = {
      ...landmarks,
      [activeLandmark.id]: { x: imgX, y: imgY },
    };

    commitLandmarksUpdate(updated);
    showToast(`✓ ${activeLandmark.name} (${activeLandmark.abbreviation}) Placed`);

    // Auto advance to next unplaced landmark immediately
    const nextUnplacedIndex = CEPH_LANDMARKS.findIndex(
      (lm, idx) => idx > activeLandmarkIndex && !updated[lm.id]
    );

    if (nextUnplacedIndex !== -1) {
      setActiveLandmarkIndex(nextUnplacedIndex);
    } else if (activeLandmarkIndex < CEPH_LANDMARKS.length - 1) {
      setActiveLandmarkIndex((prev) => prev + 1);
    } else {
      // All landmarks completed!
      if (Object.keys(updated).length === CEPH_LANDMARKS.length) {
        setShowCompletionModal(true);
      }
    }
  };

  // Mouse move for Pan or Dragging Pins
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning && interactionMode === 'pan') {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
      return;
    }

    // Handle Dragging an existing landmark pin
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
    }
  };

  // Mouse Down for Pan
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactionMode === 'pan') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseUp = () => {
    if (draggingLandmarkId) {
      commitLandmarksUpdate(landmarks);
      setDraggingLandmarkId(null);
    }
    setIsPanning(false);
  };

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev * 1.15, 6));
    } else {
      setZoom((prev) => Math.max(prev / 1.15, 0.4));
    }
  };

  // Landmark Completion Statistics
  const totalCount = CEPH_LANDMARKS.length;
  const markedCount = Object.keys(landmarks).length;
  const progressPercent = Math.round((markedCount / totalCount) * 100);

  // Missing Landmarks
  const missingLandmarks = CEPH_LANDMARKS.filter((lm) => !landmarks[lm.id]);

  // Derived readiness check for analyses based on available landmarks
  const analysesReady = useMemo(() => {
    const has = (id: string) => Boolean(landmarks[id]);
    return {
      steiners: has('sella') && has('nasion') && has('a_point') && has('b_point'),
      downs: has('sella') && has('nasion') && has('a_point') && has('b_point') && has('pogonion'),
      tweed: has('porion') && has('orbitale') && has('gonion') && has('menton'),
      mcnamara: has('nasion') && has('a_point') && has('pogonion') && has('condylon'),
      ricketts: has('porion') && has('orbitale') && has('pogonion') && has('a_point'),
      cogs: has('nasion') && has('a_point') && has('b_point') && has('articulare'),
    };
  }, [landmarks]);

  // Proceed to Review / Completion
  const handleAttemptProceedToReview = () => {
    if (markedCount === totalCount) {
      setShowCompletionModal(true);
    } else if (missingLandmarks.length > 0) {
      setShowMissingWarningModal(true);
    } else {
      onProceedToReview?.();
    }
  };

  return (
    <div className="w-full space-y-3 font-sans text-slate-800">
      {/* TOP HEADER & SMART PROGRESS BAR */}
      <div className="bg-[#0B1329] border border-[#1E293B] text-white rounded-[22px] p-3.5 shadow-md space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Target className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xs sm:text-sm font-extrabold text-white">
                  Cephalometric Landmark Identification
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-black border border-blue-400/30">
                  {markedCount} / {totalCount} Placed ({progressPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* SMART ANALYSIS READINESS BADGES */}
          <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-bold">
            <span className="text-slate-400 font-sans">Ready Analyses:</span>
            <span
              className={`px-2 py-0.5 rounded-md border transition-all ${
                analysesReady.steiners
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-2xs'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
            >
              Steiner {analysesReady.steiners ? '✓' : ''}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border transition-all ${
                analysesReady.downs
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-2xs'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
            >
              Downs {analysesReady.downs ? '✓' : ''}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border transition-all ${
                analysesReady.tweed
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-2xs'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
            >
              Tweed {analysesReady.tweed ? '✓' : ''}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border transition-all ${
                analysesReady.mcnamara
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-2xs'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
            >
              McNamara {analysesReady.mcnamara ? '✓' : ''}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border transition-all ${
                analysesReady.ricketts
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-2xs'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
            >
              Ricketts {analysesReady.ricketts ? '✓' : ''}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md border transition-all ${
                analysesReady.cogs
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-2xs'
                  : 'bg-slate-800/80 text-slate-500 border-slate-700'
              }`}
            >
              COGS {analysesReady.cogs ? '✓' : ''}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* FULL SCREEN CEPHALOGRAM WORKSPACE (78vh Screen Occupancy) */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        className={`w-full h-[78vh] min-h-[520px] max-h-[850px] bg-[#030712] rounded-[24px] border-2 border-[#1E293B] relative overflow-hidden flex items-center justify-center select-none shadow-2xl ${
          interactionMode === 'place'
            ? 'cursor-crosshair'
            : interactionMode === 'drag'
            ? 'cursor-pointer'
            : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{
          backgroundImage:
            'radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #030712 1px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 10px 10px',
        }}
      >
        {/* FLOATING LANDMARK INDICATOR CARD (Top Left Overlay - <10% Screen) */}
        <div className="absolute top-3 left-3 z-30 max-w-xs sm:max-w-md bg-[#0B1329]/90 backdrop-blur-md border border-blue-500/30 text-white rounded-2xl p-3 shadow-xl space-y-1.5 select-none pointer-events-auto">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                {activeLandmarkIndex + 1}
              </span>
              <h4 className="text-xs sm:text-sm font-black text-white truncate">
                {activeLandmark.name}{' '}
                <span className="text-blue-400 font-mono">({activeLandmark.abbreviation})</span>
              </h4>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {landmarks[activeLandmark.id] ? (
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Placed</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/30">
                  Target
                </span>
              )}
            </div>
          </div>

          <p className="text-[11px] text-slate-300 leading-snug line-clamp-2">
            {activeLandmark.anatomicalGuide}
          </p>

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-[10px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Target className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>Tap image to place</span>
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousLandmark();
                }}
                disabled={activeLandmarkIndex === 0}
                className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold cursor-pointer"
              >
                Prev
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSkipCurrent();
                }}
                disabled={activeLandmarkIndex === totalCount - 1}
                className="px-2 py-0.5 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold cursor-pointer"
              >
                Skip
              </button>

              {landmarks[activeLandmark.id] && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleResetCurrentLandmark();
                  }}
                  className="px-2 py-0.5 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* FLOATING SUCCESS TOAST WHEN SAVING LANDMARK */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-4 py-2 rounded-full font-black text-xs shadow-2xl border border-emerald-300 animate-bounce flex items-center gap-1.5 pointer-events-none">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* MAIN IMAGE & SVG LAYER */}
        {!originalImage || imageError ? (
          <div className="text-center p-6 space-y-3 text-slate-300 max-w-sm">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <h4 className="text-sm font-extrabold text-white">Cephalogram Image Unreadable</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              The uploaded image could not be displayed. Please return to calibration or re-upload your cephalogram.
            </p>
            <button
              type="button"
              onClick={onBackToCalibration}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Return to Calibration</span>
            </button>
          </div>
        ) : (
          <div
            className="relative transition-transform duration-75 ease-out touch-none flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            }}
          >
            {/* Pristine Cephalogram Image */}
            <img
              ref={imgRef}
              src={originalImage}
              alt="Lateral Cephalogram Landmark Identification"
              draggable={false}
              onLoad={handleImageLoad}
              onError={handleImageError}
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

            {/* OVERLAY SVG FOR ALL PLACED LANDMARK PINS */}
            {imgRef.current && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
                viewBox={`0 0 ${imgRef.current.naturalWidth || 1000} ${
                  imgRef.current.naturalHeight || 1000
                }`}
              >
                {CEPH_LANDMARKS.map((lm, idx) => {
                  const pos = landmarks[lm.id];
                  if (!pos) return null;

                  const isActive = idx === activeLandmarkIndex;

                  return (
                    <g
                      key={lm.id}
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="pointer-events-auto cursor-pointer"
                      onMouseDown={(e) => {
                        if (interactionMode === 'drag') {
                          e.stopPropagation();
                          setDraggingLandmarkId(lm.id);
                          setActiveLandmarkIndex(idx);
                        }
                      }}
                    >
                      {/* Active Landmark Pulse Halo */}
                      {isActive && (
                        <circle
                          r="18"
                          fill="#3B82F6"
                          fillOpacity="0.25"
                          stroke="#60A5FA"
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                      )}

                      {/* Outer Pin Halo */}
                      <circle
                        r="11"
                        fill={isActive ? '#2563EB' : '#10B981'}
                        fillOpacity="0.35"
                        stroke={isActive ? '#3B82F6' : '#10B981'}
                        strokeWidth="2"
                      />

                      {/* Center Pin Point */}
                      <circle r="3.5" fill={isActive ? '#60A5FA' : '#34D399'} />

                      {/* Precision Reticle Crosshair Lines */}
                      <line
                        x1="-12"
                        y1="0"
                        x2="12"
                        y2="0"
                        stroke={isActive ? '#60A5FA' : '#34D399'}
                        strokeWidth="1.5"
                      />
                      <line
                        x1="0"
                        y1="-12"
                        x2="0"
                        y2="12"
                        stroke={isActive ? '#60A5FA' : '#34D399'}
                        strokeWidth="1.5"
                      />

                      {/* Landmark Symbol Label */}
                      <text
                        x="13"
                        y="-6"
                        fill={isActive ? '#93C5FD' : '#A7F3D0'}
                        fontSize="13"
                        fontWeight="900"
                        fontFamily="sans-serif"
                        style={{
                          textShadow: '0px 1px 3px rgba(0,0,0,0.9)',
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
        )}

        {/* PRECISION CROSSHAIR OVERLAY (Center indicator in Place Mode) */}
        {interactionMode === 'place' && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-20">
            <div className="w-px h-full bg-blue-400" />
            <div className="h-px w-full bg-blue-400 absolute" />
          </div>
        )}

        {/* FLOATING COMPACT BOTTOM TOOLBAR (<10% Screen) */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 bg-[#0B1329]/95 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-2xl shadow-2xl flex items-center gap-1 text-white select-none pointer-events-auto">
          {/* Undo / Redo */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-4 h-4 text-slate-200" />
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-all cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-4 h-4 text-slate-200" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Mode Switch (Tap to Place vs Pan) */}
          <button
            type="button"
            onClick={() => setInteractionMode(interactionMode === 'place' ? 'pan' : 'place')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              interactionMode === 'place' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
            title="Toggle Interaction Mode"
          >
            {interactionMode === 'place' ? (
              <>
                <Target className="w-3.5 h-3.5 text-blue-200" />
                <span>Place</span>
              </>
            ) : (
              <>
                <Move className="w-3.5 h-3.5 text-emerald-300" />
                <span>Pan</span>
              </>
            )}
          </button>

          {/* Zoom In & Out */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z * 1.25, 6))}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-blue-300" />
          </button>

          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z / 1.25, 0.4))}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
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
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer"
            title="Fit Screen"
          >
            Fit
          </button>

          {/* Filters & Controls */}
          <button
            type="button"
            onClick={() => setInvert((v) => !v)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              invert ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Invert Colors"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowFiltersPanel((v) => !v)}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showFiltersPanel ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-300'
            }`}
            title="Brightness & Contrast"
          >
            <Sliders className="w-4 h-4" />
          </button>

          <div className="w-px h-4 bg-slate-700 mx-1" />

          {/* Finish Button */}
          <button
            type="button"
            onClick={handleAttemptProceedToReview}
            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold flex items-center gap-1 shadow-md transition-all cursor-pointer active:scale-95"
          >
            <span>Finish</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ADJUSTMENT SLIDERS OVERLAY PANEL */}
        {showFiltersPanel && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bg-[#0D1836] border border-[#1E293B] rounded-2xl p-3 text-white shadow-2xl space-y-3 w-72">
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
        )}
      </div>

      {/* MISSING LANDMARKS WARNING MODAL */}
      {showMissingWarningModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-[24px] max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200 shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-[#071B49]">
                  Unplaced Landmarks Detected
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  {missingLandmarks.length} landmark(s) have not been marked yet.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1 text-xs">
              <span className="font-bold text-slate-600 block mb-1">
                Missing Landmarks:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {missingLandmarks.map((lm) => (
                  <span
                    key={lm.id}
                    className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[11px] font-bold"
                  >
                    {lm.name} ({lm.abbreviation})
                  </span>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500">
              You can proceed to review now, but analyses requiring these missing landmarks will omit those specific measurements.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMissingWarningModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Keep Marking
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowMissingWarningModal(false);
                  onProceedToReview?.();
                }}
                className="px-5 py-2 rounded-xl bg-[#071B49] hover:bg-[#0A2668] text-white text-xs font-extrabold shadow-md transition-all cursor-pointer"
              >
                Proceed Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LANDMARK IDENTIFICATION COMPLETION MODAL */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-md w-full p-6 space-y-5 shadow-2xl text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md border border-emerald-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-[#071B49]">
                Landmark Identification Complete!
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                All {markedCount} / {totalCount} anatomical landmarks successfully marked.
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-left space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-extrabold">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All Cephalometric Analyses Generated</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                Steiner, Downs, Tweed, McNamara, Ricketts, Holdaway, COGS, Discrepancy, Sassouni, and Jarabak analyses are automatically calculated and populated from coordinates.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowCompletionModal(false);
                onProceedToReview?.();
              }}
              className="w-full py-3.5 rounded-2xl bg-[#071B49] hover:bg-[#0A2668] text-white text-sm font-extrabold shadow-lg shadow-[#071B49]/20 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <span>Continue to Cephalometric Analysis</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FOOTER ACTION BAR */}
      <div className="bg-white border border-slate-200 rounded-[22px] p-3.5 shadow-sm flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToCalibration}
          className="px-4 py-2.5 rounded-[16px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Calibration</span>
        </button>

        <button
          type="button"
          onClick={handleAttemptProceedToReview}
          className="px-5 py-2.5 rounded-[16px] bg-[#071B49] hover:bg-[#0A2668] text-white text-xs font-extrabold shadow-md shadow-[#071B49]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-[#0A2668]"
        >
          <span>Continue to Step 4: Landmark Review</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default LandmarkIdentificationWorkspace;
