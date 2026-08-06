import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  vectorizeImageToPaths,
  VectorPathItem,
  DEFAULT_VECTOR_OPTIONS,
  generateSampleTracingDataUrl,
} from '../../utils/potraceVectorizer';
import {
  Upload,
  Scissors,
  Layers,
  Move,
  RotateCcw,
  MousePointer,
  BoxSelect,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw,
  Eye,
  Sliders,
  Grid,
  Activity,
  FileImage,
  Tag,
} from 'lucide-react';

export type GroupType = 'cranialBase' | 'maxilla' | 'mandible' | 'unassigned';

interface ManualTracingStoCanvasProps {
  patientName?: string;
}

export const ManualTracingStoCanvas: React.FC<ManualTracingStoCanvasProps> = ({
  patientName = 'Student Tracing',
}) => {
  // --- 1. FILE UPLOAD & VECTORIZATION STATE ---
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isVectorizing, setIsVectorizing] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(150);
  const [invert, setInvert] = useState<boolean>(false);
  const [turdSize, setTurdSize] = useState<number>(25);

  // Vectorized Path Data
  const [vectorPaths, setVectorPaths] = useState<VectorPathItem[]>([]);
  const [canvasDimensions, setCanvasDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 700,
  });

  // --- 2. INTERACTIVE GROUPING STATE ---
  const [activeAssignGroup, setActiveAssignGroup] = useState<GroupType>('maxilla');
  const [interactionMode, setInteractionMode] = useState<'click' | 'box' | 'translate'>('translate');
  const [selectedPathIds, setSelectedPathIds] = useState<string[]>([]);

  // Marquee Bounding Box Drag
  const [isBoxDragging, setIsBoxDragging] = useState<boolean>(false);
  const [boxStart, setBoxStart] = useState<{ x: number; y: number } | null>(null);
  const [boxCurrent, setBoxCurrent] = useState<{ x: number; y: number } | null>(null);

  // --- 3. STO 2D TRANSLATION STATE (dx, dy in mm) ---
  const [maxillaDx, setMaxillaDx] = useState<number>(3.5); // mm advancement
  const [maxillaDy, setMaxillaDy] = useState<number>(0.0); // mm impaction
  const [mandibleDx, setMandibleDx] = useState<number>(-4.0); // mm setback
  const [mandibleDy, setMandibleDy] = useState<number>(0.0); // mm vertical

  // Direct Canvas Dragging State
  const [dragSegment, setDragSegment] = useState<'maxilla' | 'mandible' | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);

  // Visual Layer Toggles & Opacity
  const [showLayer1, setShowLayer1] = useState<boolean>(true); // Pre-op Blue (#1E88E5)
  const [showLayer2, setShowLayer2] = useState<boolean>(true); // STO Green (#4CAF50)
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [layer1Opacity, setLayer1Opacity] = useState<number>(0.6);
  const [layer2Opacity, setLayer2Opacity] = useState<number>(0.9);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Load Initial Sample Tracing on Mount
  useEffect(() => {
    const sampleUrl = generateSampleTracingDataUrl();
    setImageSrc(sampleUrl);
    processVectorization(sampleUrl, threshold, invert, turdSize);
  }, []);

  // Process Vectorization with Potrace algorithm
  const processVectorization = async (
    src: string,
    threshVal: number,
    invVal: boolean,
    turdVal: number
  ) => {
    setIsVectorizing(true);
    try {
      const result = await vectorizeImageToPaths(src, {
        threshold: threshVal,
        invert: invVal,
        turdSize: turdVal,
      });
      setVectorPaths(result.paths);
      setCanvasDimensions({ width: result.width, height: result.height });
    } catch (err) {
      console.error('Potrace vectorization error:', err);
    } finally {
      setIsVectorizing(false);
    }
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        setImageSrc(dataUrl);
        processVectorization(dataUrl, threshold, invert, turdSize);
      }
    };
    reader.readAsDataURL(file);
  };

  // Load Preset Demo Tracing
  const handleLoadSample = () => {
    const sampleUrl = generateSampleTracingDataUrl();
    setImageSrc(sampleUrl);
    processVectorization(sampleUrl, threshold, invert, turdSize);
  };

  // Re-run Vectorizer with updated threshold / filter options
  const handleReVectorize = () => {
    if (imageSrc) {
      processVectorization(imageSrc, threshold, invert, turdSize);
    }
  };

  // Grouping Counts
  const groupCounts = useMemo(() => {
    const counts = { cranialBase: 0, maxilla: 0, mandible: 0, unassigned: 0 };
    vectorPaths.forEach((p) => {
      counts[p.groupId]++;
    });
    return counts;
  }, [vectorPaths]);

  // Handle Path Selection by Click
  const handlePathClick = (pathId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (interactionMode === 'translate') return;

    setVectorPaths((prev) =>
      prev.map((p) => (p.id === pathId ? { ...p, groupId: activeAssignGroup } : p))
    );
  };

  // Auto-group heuristic (assigns top -> cranialBase, mid -> maxilla, bottom -> mandible)
  const handleAutoGroup = () => {
    const height = canvasDimensions.height;
    setVectorPaths((prev) =>
      prev.map((p) => {
        const relY = p.center.y / height;
        let g: GroupType = 'unassigned';
        if (relY < 0.38) g = 'cranialBase';
        else if (relY < 0.62) g = 'maxilla';
        else g = 'mandible';
        return { ...p, groupId: g };
      })
    );
  };

  // Marquee Bounding Box Selection Handler
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (interactionMode !== 'box' || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = canvasDimensions.width / rect.width;
    const scaleY = canvasDimensions.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsBoxDragging(true);
    setBoxStart({ x, y });
    setBoxCurrent({ x, y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = canvasDimensions.width / rect.width;
    const scaleY = canvasDimensions.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isBoxDragging && boxStart) {
      setBoxCurrent({ x, y });
    } else if (dragSegment && dragStartPos) {
      // Direct SVG Canvas Dragging for dx, dy translation
      const deltaXPixels = x - dragStartPos.x;
      const deltaYPixels = y - dragStartPos.y;

      // 10 pixels = 1mm scale
      const deltaMmX = parseFloat((deltaXPixels / 10).toFixed(1));
      const deltaMmY = parseFloat((-deltaYPixels / 10).toFixed(1));

      if (dragSegment === 'maxilla') {
        setMaxillaDx((prev) => Math.min(15, Math.max(-15, prev + deltaMmX)));
        setMaxillaDy((prev) => Math.min(15, Math.max(-15, prev + deltaMmY)));
      } else if (dragSegment === 'mandible') {
        setMandibleDx((prev) => Math.min(15, Math.max(-15, prev + deltaMmX)));
        setMandibleDy((prev) => Math.min(15, Math.max(-15, prev + deltaMmY)));
      }

      setDragStartPos({ x, y });
    }
  };

  const handleMouseUp = () => {
    if (isBoxDragging && boxStart && boxCurrent) {
      // Select all paths intersecting marquee box
      const minX = Math.min(boxStart.x, boxCurrent.x);
      const maxX = Math.max(boxStart.x, boxCurrent.x);
      const minY = Math.min(boxStart.y, boxCurrent.y);
      const maxY = Math.max(boxStart.y, boxCurrent.y);

      setVectorPaths((prev) =>
        prev.map((p) => {
          const inBox =
            p.center.x >= minX && p.center.x <= maxX && p.center.y >= minY && p.center.y <= maxY;
          return inBox ? { ...p, groupId: activeAssignGroup } : p;
        })
      );
    }

    setIsBoxDragging(false);
    setBoxStart(null);
    setBoxCurrent(null);
    setDragSegment(null);
    setDragStartPos(null);
  };

  // Convert mm translation to canvas pixels (1mm = 10px)
  const maxillaPxX = maxillaDx * 10;
  const maxillaPxY = -maxillaDy * 10;

  const mandiblePxX = mandibleDx * 10;
  const mandiblePxY = -mandibleDy * 10;

  // Reset Shifts
  const handleResetShifts = () => {
    setMaxillaDx(0);
    setMaxillaDy(0);
    setMandibleDx(0);
    setMandibleDy(0);
  };

  return (
    <div className="space-y-3 font-sans text-slate-900">
      {/* 1. TOP MODULE HEADER */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Manual Cephalometric Tracing Potrace STO Engine
              </h3>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-teal-600" /> Vectorizer + 2D Kinematics
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Convert student manual line drawings into layered STO vector segments • {patientName}
            </p>
          </div>
        </div>

        {/* FILE UPLOAD & DEMO BUTTONS */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="cursor-pointer bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Tracing (.png/.jpg)</span>
            <input
              type="file"
              accept="image/png, image/jpeg, image/jpg"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleLoadSample}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <FileImage className="w-3.5 h-3.5 text-slate-500" />
            <span>Load Sample Student Tracing</span>
          </button>
        </div>
      </div>

      {/* 2. POTRAACE VECTORIZER CONTROLS TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-md space-y-2.5 text-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-bold text-slate-100">
              Potrace Line Image Vectorization & Threshold Controls
            </h4>
          </div>
          <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            {isVectorizing ? 'Vectorizing Image...' : `${vectorPaths.length} SVG Paths Generated`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* Threshold slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-semibold">
              <span>Threshold (B/W Cutoff)</span>
              <span className="font-mono text-slate-200">{threshold}</span>
            </div>
            <input
              type="range"
              min="30"
              max="220"
              value={threshold}
              onChange={(e) => setThreshold(parseInt(e.target.value, 10))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Turd Filter slider */}
          <div>
            <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-semibold">
              <span>Noise Filter (Min Size / Turd Size)</span>
              <span className="font-mono text-slate-200">{turdSize} px</span>
            </div>
            <input
              type="range"
              min="1"
              max="60"
              value={turdSize}
              onChange={(e) => setTurdSize(parseInt(e.target.value, 10))}
              className="w-full accent-teal-500 cursor-pointer"
            />
          </div>

          {/* Invert color checkbox */}
          <div className="flex items-center gap-2 pt-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
              <input
                type="checkbox"
                checked={invert}
                onChange={(e) => setInvert(e.target.checked)}
                className="accent-teal-500 rounded w-4 h-4"
              />
              Invert Line Color
            </label>
          </div>

          {/* Re-run button */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={handleReVectorize}
              disabled={isVectorizing}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVectorizing ? 'animate-spin' : ''}`} />
              Re-trace Vector Paths
            </button>
          </div>
        </div>
      </div>

      {/* 3. INTERACTIVE PATH GROUPING TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-teal-600" />
            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
              Interactive Path Grouping & Assignment Modes
            </h4>
          </div>

          {/* INTERACTION MODE TOGGLES */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Tool Mode:
            </span>
            <button
              type="button"
              onClick={() => setInteractionMode('translate')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                interactionMode === 'translate'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Move className="w-3.5 h-3.5" /> Move STO Segments
            </button>
            <button
              type="button"
              onClick={() => setInteractionMode('click')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                interactionMode === 'click'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <MousePointer className="w-3.5 h-3.5" /> Click to Assign
            </button>
            <button
              type="button"
              onClick={() => setInteractionMode('box')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 transition-all ${
                interactionMode === 'box'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <BoxSelect className="w-3.5 h-3.5" /> Bounding Box Select
            </button>
            <button
              type="button"
              onClick={handleAutoGroup}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Auto-Group Heuristic
            </button>
          </div>
        </div>

        {/* GROUP CATEGORY TARGET SELECTOR CHIPS */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Active Assign Target:
          </span>

          {/* Cranial Base */}
          <button
            type="button"
            onClick={() => setActiveAssignGroup('cranialBase')}
            className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
              activeAssignGroup === 'cranialBase'
                ? 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            a) Cranial Base ({groupCounts.cranialBase})
          </button>

          {/* Maxilla */}
          <button
            type="button"
            onClick={() => setActiveAssignGroup('maxilla')}
            className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
              activeAssignGroup === 'maxilla'
                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                : 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            b) Maxilla Segment ({groupCounts.maxilla})
          </button>

          {/* Mandible */}
          <button
            type="button"
            onClick={() => setActiveAssignGroup('mandible')}
            className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-2 transition-all cursor-pointer ${
              activeAssignGroup === 'mandible'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            c) Mandible Segment ({groupCounts.mandible})
          </button>

          {/* Unassigned */}
          <span className="text-[11px] text-slate-400 font-medium ml-auto">
            Unassigned Paths: <strong className="text-slate-700">{groupCounts.unassigned}</strong>
          </span>
        </div>
      </div>

      {/* 4. MAIN CANVAS STAGE & PARAMETRIC TRANSLATION SLIDERS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* GRAPHIC CANVAS STAGE (8 COLS) */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner flex flex-col h-[65vh] min-h-[460px] sm:h-[520px] lg:h-[600px] relative">
          {/* Top Layer Control Bar */}
          <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-2 text-xs flex items-center justify-between gap-2 z-10 text-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Layers:
              </span>

              {/* Layer 1 (Blue Baseline) */}
              <button
                type="button"
                onClick={() => setShowLayer1((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                  showLayer1
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    showLayer1 ? 'bg-[#1E88E5] shadow-[0_0_6px_#1E88E5]' : 'bg-slate-600'
                  }`}
                />
                Layer 1: Baseline (Blue)
              </button>

              {/* Layer 2 (Green STO) */}
              <button
                type="button"
                onClick={() => setShowLayer2((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                  showLayer2
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    showLayer2 ? 'bg-[#4CAF50] shadow-[0_0_6px_#4CAF50]' : 'bg-slate-600'
                  }`}
                />
                Layer 2: STO (Green)
              </button>

              {/* Grid Toggle */}
              <button
                type="button"
                onClick={() => setShowGrid((v) => !v)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 transition-all ${
                  showGrid
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-950 text-slate-500 border-slate-800'
                }`}
              >
                <Grid className="w-3 h-3 text-slate-400" /> Grid
              </button>
            </div>

            <button
              type="button"
              onClick={handleResetShifts}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-700 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-teal-400" /> Reset Shifts
            </button>
          </div>

          {/* SVG VECTOR STAGE CANVAS */}
          <div className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden cursor-crosshair">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${canvasDimensions.width} ${canvasDimensions.height}`}
              className="w-full h-full object-contain select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Background Grid Pattern */}
              {showGrid && (
                <g opacity="0.12" stroke="#ffffff" strokeWidth="0.5">
                  {Array.from({ length: 30 }).map((_, i) => (
                    <line key={`gx_${i}`} x1={i * 30} y1="0" x2={i * 30} y2={canvasDimensions.height} />
                  ))}
                  {Array.from({ length: 35 }).map((_, i) => (
                    <line key={`gy_${i}`} x1="0" y1={i * 30} x2={canvasDimensions.width} y2={i * 30} />
                  ))}
                </g>
              )}

              {/* LAYER 1: BASELINE UNMOVED TRACING (#1E88E5 BLUE) */}
              {showLayer1 && (
                <g id="layer1_baseline" opacity={layer1Opacity}>
                  {vectorPaths.map((p) => (
                    <path
                      key={`l1_${p.id}`}
                      d={p.d}
                      fill="none"
                      stroke="#1E88E5"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  ))}
                </g>
              )}

              {/* LAYER 2: MOVED STO SEGMENTS (#4CAF50 GREEN) */}
              {showLayer2 && (
                <g id="layer2_sto" opacity={layer2Opacity}>
                  {/* Fixed Cranial Base */}
                  <g id="cranialBase_group">
                    {vectorPaths
                      .filter((p) => p.groupId === 'cranialBase')
                      .map((p) => (
                        <path
                          key={`l2_cb_${p.id}`}
                          d={p.d}
                          fill="none"
                          stroke="#64748B"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          onClick={(e) => handlePathClick(p.id, e)}
                        />
                      ))}
                  </g>

                  {/* Moveable Maxilla Segment */}
                  <g
                    id="maxilla_group"
                    transform={`translate(${maxillaPxX}, ${maxillaPxY})`}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      if (interactionMode === 'translate') {
                        e.stopPropagation();
                        setDragSegment('maxilla');
                        const rect = svgRef.current?.getBoundingClientRect();
                        if (rect) {
                          const scaleX = canvasDimensions.width / rect.width;
                          const scaleY = canvasDimensions.height / rect.height;
                          setDragStartPos({
                            x: (e.clientX - rect.left) * scaleX,
                            y: (e.clientY - rect.top) * scaleY,
                          });
                        }
                      }
                    }}
                  >
                    {vectorPaths
                      .filter((p) => p.groupId === 'maxilla')
                      .map((p) => (
                        <path
                          key={`l2_mx_${p.id}`}
                          d={p.d}
                          fill="none"
                          stroke="#4CAF50"
                          strokeWidth="3.0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          onClick={(e) => handlePathClick(p.id, e)}
                        />
                      ))}
                  </g>

                  {/* Moveable Mandible Segment */}
                  <g
                    id="mandible_group"
                    transform={`translate(${mandiblePxX}, ${mandiblePxY})`}
                    className="cursor-grab active:cursor-grabbing"
                    onMouseDown={(e) => {
                      if (interactionMode === 'translate') {
                        e.stopPropagation();
                        setDragSegment('mandible');
                        const rect = svgRef.current?.getBoundingClientRect();
                        if (rect) {
                          const scaleX = canvasDimensions.width / rect.width;
                          const scaleY = canvasDimensions.height / rect.height;
                          setDragStartPos({
                            x: (e.clientX - rect.left) * scaleX,
                            y: (e.clientY - rect.top) * scaleY,
                          });
                        }
                      }
                    }}
                  >
                    {vectorPaths
                      .filter((p) => p.groupId === 'mandible')
                      .map((p) => (
                        <path
                          key={`l2_md_${p.id}`}
                          d={p.d}
                          fill="none"
                          stroke="#22C55E"
                          strokeWidth="3.0"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          onClick={(e) => handlePathClick(p.id, e)}
                        />
                      ))}
                  </g>

                  {/* Unassigned Paths */}
                  <g id="unassigned_group">
                    {vectorPaths
                      .filter((p) => p.groupId === 'unassigned')
                      .map((p) => (
                        <path
                          key={`l2_un_${p.id}`}
                          d={p.d}
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          onClick={(e) => handlePathClick(p.id, e)}
                        />
                      ))}
                  </g>
                </g>
              )}

              {/* Marquee Box Selection Overlay */}
              {isBoxDragging && boxStart && boxCurrent && (
                <rect
                  x={Math.min(boxStart.x, boxCurrent.x)}
                  y={Math.min(boxStart.y, boxCurrent.y)}
                  width={Math.abs(boxCurrent.x - boxStart.x)}
                  height={Math.abs(boxCurrent.y - boxStart.y)}
                  fill="rgba(20, 184, 166, 0.15)"
                  stroke="#14B8A6"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}
            </svg>

            {/* Bottom Floating Canvas Legend HUD */}
            <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 text-[11px] text-slate-300 shadow-lg space-y-1 z-10 pointer-events-none hidden sm:block">
              <div className="flex items-center gap-1.5 font-bold text-slate-100 border-b border-slate-800 pb-1">
                <Layers className="w-3.5 h-3.5 text-teal-400" /> Vector STO Superimposition
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1E88E5]" />
                <span>Layer 1: Pre-Op Tracing Baseline</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#4CAF50]" />
                <span>Layer 2: Post-Surgical STO Moveable Segments</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2D TRANSLATION PARAMETRIC CONTROLS (4 COLS) */}
        <div className="lg:col-span-4 space-y-3">
          {/* MAXILLA SEGMENT 2D TRANSLATION */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
                Maxilla Segment Translation (dx, dy)
              </h4>
              <span className="text-[10px] font-mono font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                dx: {maxillaDx >= 0 ? `+${maxillaDx}` : maxillaDx}mm
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                  <span>Horizontal Advancement (+) / Setback (-)</span>
                  <span className="font-mono text-slate-900">{maxillaDx} mm</span>
                </div>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={maxillaDx}
                  onChange={(e) => setMaxillaDx(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                  <span>Vertical Impaction (+) / Downgraft (-)</span>
                  <span className="font-mono text-slate-900">{maxillaDy} mm</span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.5"
                  value={maxillaDy}
                  onChange={(e) => setMaxillaDy(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* MANDIBLE SEGMENT 2D TRANSLATION */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                Mandible Segment Translation (dx, dy)
              </h4>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                dx: {mandibleDx >= 0 ? `+${mandibleDx}` : mandibleDx}mm
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                  <span>Horizontal Advancement (+) / Setback (-)</span>
                  <span className="font-mono text-slate-900">{mandibleDx} mm</span>
                </div>
                <input
                  type="range"
                  min="-14"
                  max="14"
                  step="0.5"
                  value={mandibleDx}
                  onChange={(e) => setMandibleDx(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] font-semibold text-slate-600 mb-1">
                  <span>Vertical Pitch / Position (dy)</span>
                  <span className="font-mono text-slate-900">{mandibleDy} mm</span>
                </div>
                <input
                  type="range"
                  min="-8"
                  max="8"
                  step="0.5"
                  value={mandibleDy}
                  onChange={(e) => setMandibleDy(parseFloat(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SURGICAL DISPLACEMENT SUMMARY CARD */}
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-3.5 text-xs space-y-2 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <span className="font-bold text-teal-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> STO Kinematics Displacement
              </span>
              <span className="text-[10px] text-slate-400 font-mono">2D Translation</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-[11px]">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                <span className="text-[10px] text-teal-400 uppercase block font-bold">Maxilla Δ</span>
                <span className="text-sm font-mono font-extrabold text-teal-300 mt-0.5 block">
                  X: {maxillaDx >= 0 ? `+${maxillaDx}` : maxillaDx}mm
                </span>
                <span className="text-[10px] font-mono text-slate-400 block">Y: {maxillaDy}mm</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                <span className="text-[10px] text-emerald-400 uppercase block font-bold">Mandible Δ</span>
                <span className="text-sm font-mono font-extrabold text-emerald-300 mt-0.5 block">
                  X: {mandibleDx >= 0 ? `+${mandibleDx}` : mandibleDx}mm
                </span>
                <span className="text-[10px] font-mono text-slate-400 block">Y: {mandibleDy}mm</span>
              </div>
            </div>
          </div>

          {/* EDUCATIONAL TIP */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Student Tracing Guidance</span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Upload a manual line tracing on paper or iPad. The Potrace vectorizer extracts SVG path elements. Group paths into <strong>cranialBase</strong> (fixed), <strong>maxilla</strong>, and <strong>mandible</strong> to simulate surgical movements!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
