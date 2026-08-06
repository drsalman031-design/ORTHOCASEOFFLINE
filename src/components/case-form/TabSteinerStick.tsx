import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  SteinersAnalysisData,
  SchwarzTweedAnalysisData,
  DownsAnalysisData,
  Gender,
} from '../../types';
import {
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Eye,
  EyeOff,
  Layers,
  Move,
  Compass,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface TabSteinerStickProps {
  steinersAnalysis?: SteinersAnalysisData;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  downsAnalysis?: DownsAnalysisData;
  overjetMm?: number | '';
  overbiteMm?: number | '';
  patientName?: string;
  patientAge?: number | string;
  patientGender?: Gender;
}

interface StickGeometry {
  nasion: { x: number; y: number };
  pointA: { x: number; y: number };
  pointB: { x: number; y: number };
  u1Apex: { x: number; y: number };
  u1Tip: { x: number; y: number };
  l1Apex: { x: number; y: number };
  l1Tip: { x: number; y: number };
}

/** Prefer pre-treatment Steiner value; fall back to mid/post if pre is empty. */
function readSteinersStageValue(
  analysis: SteinersAnalysisData | undefined,
  key: keyof NonNullable<SteinersAnalysisData['parameters']>
): number | null {
  const stages = analysis?.parameters?.[key];
  if (!stages) return null;
  for (const stage of ['pre', 'mid', 'post'] as const) {
    const val = stages[stage];
    if (typeof val === 'number' && !isNaN(val)) return val;
  }
  return null;
}

function readDownsAnb(analysis: DownsAnalysisData | undefined): number | null {
  const stages = (analysis?.parameters as any)?.anbAngle;
  if (!stages) return null;
  for (const stage of ['pre', 'mid', 'post'] as const) {
    const val = stages[stage];
    if (typeof val === 'number' && !isNaN(val)) return val;
  }
  return null;
}

const IDEAL_STEINER = {
  sna: 82.0,
  snb: 80.0,
  anb: 2.0,
  u1Deg: 22.0,
  u1Mm: 4.0,
  l1Deg: 25.0,
  l1Mm: 4.0,
} as const;

export const TabSteinerStick: React.FC<TabSteinerStickProps> = ({
  steinersAnalysis,
  schwarzTweedAnalysis,
  downsAnalysis,
  overjetMm = '',
  overbiteMm = '',
  patientName = 'Patient',
  patientAge = 18,
  patientGender = 'Female',
}) => {
  // --- 1. AUTO FROM TAB 7 CEPH (Steiner's Analysis) — no manual entry on this tab ---
  const snaFromCeph = useMemo(
    () => readSteinersStageValue(steinersAnalysis, 'sna'),
    [steinersAnalysis]
  );
  const snbFromCeph = useMemo(
    () => readSteinersStageValue(steinersAnalysis, 'snb'),
    [steinersAnalysis]
  );
  const anbFromCeph = useMemo(() => {
    const direct = readSteinersStageValue(steinersAnalysis, 'anb');
    if (direct !== null) return direct;
    if (snaFromCeph !== null && snbFromCeph !== null) {
      return parseFloat((snaFromCeph - snbFromCeph).toFixed(1));
    }
    return readDownsAnb(downsAnalysis);
  }, [steinersAnalysis, downsAnalysis, snaFromCeph, snbFromCeph]);

  const u1NaDegFromCeph = useMemo(
    () => readSteinersStageValue(steinersAnalysis, 'upperIncisorToNaDeg'),
    [steinersAnalysis]
  );
  const u1NaMmFromCeph = useMemo(
    () => readSteinersStageValue(steinersAnalysis, 'upperIncisorToNaMm'),
    [steinersAnalysis]
  );
  const l1NbDegFromCeph = useMemo(
    () => readSteinersStageValue(steinersAnalysis, 'lowerIncisorToNbDeg'),
    [steinersAnalysis]
  );
  const l1NbMmFromCeph = useMemo(
    () => readSteinersStageValue(steinersAnalysis, 'lowerIncisorToNbMm'),
    [steinersAnalysis]
  );
  const interincisalFromCeph = useMemo(
    () => readSteinersStageValue(steinersAnalysis, 'interincisalAngle'),
    [steinersAnalysis]
  );

  const hasPatientCeph =
    snaFromCeph !== null &&
    snbFromCeph !== null &&
    anbFromCeph !== null &&
    u1NaDegFromCeph !== null &&
    u1NaMmFromCeph !== null &&
    l1NbDegFromCeph !== null &&
    l1NbMmFromCeph !== null;

  const sna = snaFromCeph ?? IDEAL_STEINER.sna;
  const snb = snbFromCeph ?? IDEAL_STEINER.snb;
  const anb = anbFromCeph ?? IDEAL_STEINER.anb;
  const u1NaDeg = u1NaDegFromCeph ?? IDEAL_STEINER.u1Deg;
  const u1NaMm = u1NaMmFromCeph ?? IDEAL_STEINER.u1Mm;
  const l1NbDeg = l1NbDegFromCeph ?? IDEAL_STEINER.l1Deg;
  const l1NbMm = l1NbMmFromCeph ?? IDEAL_STEINER.l1Mm;

  const impa = useMemo(() => {
    const valST = schwarzTweedAnalysis?.parameters?.impa?.pre;
    if (typeof valST === 'number') return valST;
    const valDowns = downsAnalysis?.parameters?.impa?.pre;
    if (typeof valDowns === 'number') return valDowns;
    return null;
  }, [schwarzTweedAnalysis, downsAnalysis]);

  const interincisalAngle = useMemo(() => {
    if (interincisalFromCeph !== null) return interincisalFromCeph;
    if (!hasPatientCeph) return null;
    return parseFloat((180 - (u1NaDeg + l1NbDeg + Math.max(0, anb))).toFixed(1));
  }, [interincisalFromCeph, hasPatientCeph, u1NaDeg, l1NbDeg, anb]);

  const overjet = typeof overjetMm === 'number' ? overjetMm : null;
  const overbite = typeof overbiteMm === 'number' ? overbiteMm : null;

  // --- 2. OVERLAY VISIBILITY TOGGLES ---
  const [showCurrent, setShowCurrent] = useState<boolean>(true); // Blue
  const [showIdeal, setShowIdeal] = useState<boolean>(true); // Green (Dashed)
  const [showPlanned, setShowPlanned] = useState<boolean>(true); // Orange

  // --- 3. ZOOM & PAN CONTROLS ---
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // --- 4. TREATMENT ANIMATION STATE ---
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animProgress, setAnimProgress] = useState<number>(0.0); // 0.0 (Current) -> 0.5 (Translation) -> 1.0 (Final Planned)
  const [animSpeed, setAnimSpeed] = useState<number>(1.0); // 0.5x, 1x, 2x
  const animRef = useRef<number | null>(null);

  // Auto-play animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      setAnimProgress((prev) => {
        const next = prev + (dt * 0.35 * animSpeed);
        if (next >= 1.0) {
          setIsPlaying(false);
          return 1.0;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, animSpeed]);

  const handleResetAnim = () => {
    setIsPlaying(false);
    setAnimProgress(0.0);
  };

  // --- 5. GEOMETRY COMPUTATION FUNCTION ---
  // Transforms Steiner parameters into SVG coordinates
  const computeStickGeometry = (params: {
    snaVal: number;
    snbVal: number;
    anbVal: number;
    u1Deg: number;
    u1Mm: number;
    l1Deg: number;
    l1Mm: number;
  }): StickGeometry => {
    // SVG Canvas Base dimensions: 600 x 420
    const centerX = 280;
    const centerY = 210;
    const scale = 8.5; // px per mm

    // Nasion is superior-anterior
    const nasion = { x: centerX - 60, y: centerY - 140 };

    // NA line angle (deg from downward vertical)
    const naLineAngleRad = (18 * Math.PI) / 180;
    const naLength = 130;

    const pointA = {
      x: nasion.x + naLength * Math.sin(naLineAngleRad),
      y: nasion.y + naLength * Math.cos(naLineAngleRad),
    };

    // NB line angle: ANB shifts Point B posteriorly relative to Point A
    // Standard Class I ANB is 2°. Larger ANB rotates NB clockwise (further left/posterior)
    const anbOffsetRad = ((params.anbVal - 2.0) * 0.75 * Math.PI) / 180;
    const nbLineAngleRad = naLineAngleRad - anbOffsetRad;
    const nbLength = 175;

    const pointB = {
      x: nasion.x + nbLength * Math.sin(nbLineAngleRad),
      y: nasion.y + nbLength * Math.cos(nbLineAngleRad),
    };

    // --- Upper Incisor (U1) ---
    // U1 Tip is offset anterior to NA line by u1Mm
    // Position along NA line near Point A (y approx centerY - 10)
    const u1BaseOnNA = {
      x: nasion.x + 95 * Math.sin(naLineAngleRad),
      y: nasion.y + 95 * Math.cos(naLineAngleRad),
    };

    // Perpendicular vector to NA line (facing anteriorly = right)
    const naPerpVector = {
      x: Math.cos(naLineAngleRad),
      y: -Math.sin(naLineAngleRad),
    };

    const u1Tip = {
      x: u1BaseOnNA.x + params.u1Mm * scale * naPerpVector.x,
      y: u1BaseOnNA.y + params.u1Mm * scale * naPerpVector.y,
    };

    // U1 long axis angle relative to NA line
    // Angle of long axis from vertical: (naLineAngleRad + u1Deg)
    const u1AxisAngleRad = naLineAngleRad + (params.u1Deg * Math.PI) / 180;
    const toothLengthU1 = 23 * (scale * 0.35); // mm length scaled

    const u1Apex = {
      x: u1Tip.x - toothLengthU1 * Math.sin(u1AxisAngleRad),
      y: u1Tip.y - toothLengthU1 * Math.cos(u1AxisAngleRad),
    };

    // --- Lower Incisor (L1) ---
    // L1 Tip is offset anterior to NB line by l1Mm
    const l1BaseOnNB = {
      x: nasion.x + 115 * Math.sin(nbLineAngleRad),
      y: nasion.y + 115 * Math.cos(nbLineAngleRad),
    };

    const nbPerpVector = {
      x: Math.cos(nbLineAngleRad),
      y: -Math.sin(nbLineAngleRad),
    };

    const l1Tip = {
      x: l1BaseOnNB.x + params.l1Mm * scale * nbPerpVector.x,
      y: l1BaseOnNB.y + params.l1Mm * scale * nbPerpVector.y,
    };

    // L1 long axis angle relative to NB line
    const l1AxisAngleRad = nbLineAngleRad + (params.l1Deg * Math.PI) / 180;
    const toothLengthL1 = 21 * (scale * 0.35);

    const l1Apex = {
      x: l1Tip.x - toothLengthL1 * Math.sin(l1AxisAngleRad),
      y: l1Tip.y + toothLengthL1 * Math.cos(l1AxisAngleRad), // Apex goes down (inferiorly)
    };

    return {
      nasion,
      pointA,
      pointB,
      u1Apex,
      u1Tip,
      l1Apex,
      l1Tip,
    };
  };

  // --- 6. GEOMETRIES FOR THE THREE OVERLAYS ---
  // A. Current Patient Geometry (Blue) — only from Tab 7 ceph values
  const currentGeom = useMemo(() => {
    if (!hasPatientCeph) return null;
    return computeStickGeometry({
      snaVal: sna,
      snbVal: snb,
      anbVal: anb,
      u1Deg: u1NaDeg,
      u1Mm: u1NaMm,
      l1Deg: l1NbDeg,
      l1Mm: l1NbMm,
    });
  }, [hasPatientCeph, sna, snb, anb, u1NaDeg, u1NaMm, l1NbDeg, l1NbMm]);

  // B. Ideal Steiner Norm Geometry (Green Dashed)
  const idealGeom = useMemo(() => {
    return computeStickGeometry({
      snaVal: IDEAL_STEINER.sna,
      snbVal: IDEAL_STEINER.snb,
      anbVal: IDEAL_STEINER.anb,
      u1Deg: IDEAL_STEINER.u1Deg,
      u1Mm: IDEAL_STEINER.u1Mm,
      l1Deg: IDEAL_STEINER.l1Deg,
      l1Mm: IDEAL_STEINER.l1Mm,
    });
  }, []);

  // C. Planned Target Geometry (Orange) — patient's jaw base + ideal tooth norms
  const plannedParams = useMemo(() => {
    if (!hasPatientCeph) return null;
    return {
      snaVal: sna,
      snbVal: snb,
      anbVal: anb,
      u1Deg: IDEAL_STEINER.u1Deg,
      u1Mm: IDEAL_STEINER.u1Mm,
      l1Deg: IDEAL_STEINER.l1Deg,
      l1Mm: IDEAL_STEINER.l1Mm,
    };
  }, [hasPatientCeph, sna, snb, anb]);

  const plannedGeom = useMemo(() => {
    if (!plannedParams) return null;
    return computeStickGeometry(plannedParams);
  }, [plannedParams]);

  // D. Interpolated Animated Geometry (Current -> Translation -> Torque -> Final)
  const animatedGeom = useMemo(() => {
    if (!currentGeom || !plannedGeom || !plannedParams) return currentGeom;
    if (animProgress === 0.0) return currentGeom;
    if (animProgress === 1.0) return plannedGeom;

    const tTrans = Math.min(1.0, animProgress * 2.0);
    const tTorque = Math.max(0.0, (animProgress - 0.5) * 2.0);

    const midU1Mm = u1NaMm + (plannedParams.u1Mm - u1NaMm) * tTrans;
    const midL1Mm = l1NbMm + (plannedParams.l1Mm - l1NbMm) * tTrans;
    const currU1Deg = u1NaDeg + (plannedParams.u1Deg - u1NaDeg) * tTorque;
    const currL1Deg = l1NbDeg + (plannedParams.l1Deg - l1NbDeg) * tTorque;

    return computeStickGeometry({
      snaVal: sna,
      snbVal: snb,
      anbVal: anb,
      u1Deg: currU1Deg,
      u1Mm: midU1Mm,
      l1Deg: currL1Deg,
      l1Mm: midL1Mm,
    });
  }, [animProgress, currentGeom, plannedGeom, plannedParams, sna, snb, anb, u1NaMm, l1NbMm, u1NaDeg, l1NbDeg]);

  // --- 7. MOVEMENT CALCULATIONS (DELTAS vs ideal) ---
  const upperShiftMm = hasPatientCeph ? parseFloat((IDEAL_STEINER.u1Mm - u1NaMm).toFixed(1)) : 0;
  const upperTorqueDeg = hasPatientCeph ? parseFloat((IDEAL_STEINER.u1Deg - u1NaDeg).toFixed(1)) : 0;
  const lowerShiftMm = hasPatientCeph ? parseFloat((IDEAL_STEINER.l1Mm - l1NbMm).toFixed(1)) : 0;
  const lowerTorqueDeg = hasPatientCeph ? parseFloat((IDEAL_STEINER.l1Deg - l1NbDeg).toFixed(1)) : 0;

  // --- 8. AUTOMATIC INFERENCE LOGIC ---
  const skeletalInference = useMemo(() => {
    if (!hasPatientCeph) return 'Enter Steiner values in Tab 7 to generate skeletal inference';
    if (anb > 4.0) return `Skeletal Class II Pattern (ANB = ${anb.toFixed(1)}°)`;
    if (anb < 0.0) return `Skeletal Class III Pattern (ANB = ${anb.toFixed(1)}°)`;
    return `Skeletal Class I Pattern (ANB = ${anb.toFixed(1)}°)`;
  }, [hasPatientCeph, anb]);

  const upperIncisorInference = useMemo(() => {
    if (!hasPatientCeph) return 'Awaiting U1-NA from Tab 7';
    if (u1NaDeg > 25.0 || u1NaMm > 5.0) {
      return `Proclined & Prominent (U1-NA: ${u1NaDeg.toFixed(1)}°, ${u1NaMm.toFixed(1)} mm)`;
    }
    if (u1NaDeg < 19.0 || u1NaMm < 3.0) {
      return `Retroclined (U1-NA: ${u1NaDeg.toFixed(1)}°, ${u1NaMm.toFixed(1)} mm)`;
    }
    return `Normal Axial Inclination (U1-NA: ${u1NaDeg.toFixed(1)}°, ${u1NaMm.toFixed(1)} mm)`;
  }, [hasPatientCeph, u1NaDeg, u1NaMm]);

  const lowerIncisorInference = useMemo(() => {
    if (!hasPatientCeph) return 'Awaiting L1-NB from Tab 7';
    const impaText = impa !== null ? `, IMPA: ${impa.toFixed(1)}°` : '';
    if (l1NbDeg > 28.0 || l1NbMm > 5.0 || (impa !== null && impa > 95.0)) {
      return `Proclined (L1-NB: ${l1NbDeg.toFixed(1)}°, ${l1NbMm.toFixed(1)} mm${impaText})`;
    }
    if (l1NbDeg < 22.0 || l1NbMm < 3.0 || (impa !== null && impa < 85.0)) {
      return `Retroclined (L1-NB: ${l1NbDeg.toFixed(1)}°, ${l1NbMm.toFixed(1)} mm${impaText})`;
    }
    return `Normal Axial Inclination (L1-NB: ${l1NbDeg.toFixed(1)}°, ${l1NbMm.toFixed(1)} mm${impaText})`;
  }, [hasPatientCeph, l1NbDeg, l1NbMm, impa]);

  const dentalCompensationInference = useMemo(() => {
    if (!hasPatientCeph) return 'Awaiting Tab 7 Steiner values';
    if (anb > 4.0 && (l1NbDeg > 26.0 || (impa !== null && impa > 93.0))) {
      return 'Present: Lower incisors proclined attempting to compensate for mandibular retrognathism';
    }
    if (anb < 0.0 && (u1NaDeg > 23.0 || l1NbDeg < 23.0)) {
      return 'Present: Upper incisors proclined & lower incisors retroclined compensating for Class III jaw base';
    }
    return 'Absent: Incisors maintain normal axial relationship to underlying jaw bases';
  }, [hasPatientCeph, anb, l1NbDeg, impa, u1NaDeg]);

  const suggestedUpperMovementText = useMemo(() => {
    if (!hasPatientCeph) return 'Enter Tab 7 Steiner values to calculate movement';
    const mmText =
      upperShiftMm < 0
        ? `Retract ${Math.abs(upperShiftMm)} mm`
        : upperShiftMm > 0
        ? `Advance ${upperShiftMm} mm`
        : 'Hold AP Position';

    const degText =
      upperTorqueDeg < 0
        ? `Palatal Root Torque ${upperTorqueDeg}°`
        : upperTorqueDeg > 0
        ? `Labial Root Torque +${upperTorqueDeg}°`
        : 'Maintain Axial Inclination';

    return `${mmText}, ${degText}`;
  }, [hasPatientCeph, upperShiftMm, upperTorqueDeg]);

  const suggestedLowerMovementText = useMemo(() => {
    if (!hasPatientCeph) return 'Enter Tab 7 Steiner values to calculate movement';
    const mmText =
      lowerShiftMm < 0
        ? `Retract ${Math.abs(lowerShiftMm)} mm`
        : lowerShiftMm > 0
        ? `Advance ${lowerShiftMm} mm`
        : 'Hold AP Position';

    const degText =
      lowerTorqueDeg < 0
        ? `Lingual Root Torque ${lowerTorqueDeg}°`
        : lowerTorqueDeg > 0
        ? `Labial Root Torque +${lowerTorqueDeg}°`
        : 'Maintain Axial Inclination';

    return `${mmText}, ${degText}`;
  }, [hasPatientCeph, lowerShiftMm, lowerTorqueDeg]);

  // Mouse / Touch Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="space-y-3 font-sans text-slate-900">
      {/* 1. HEADER BAR & QUICK INFORMATION */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs space-y-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-sm font-bold text-slate-900 leading-snug">
              Steiner Stick Analysis
            </h3>
            <span
              className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                hasPatientCeph
                  ? 'text-teal-700 bg-teal-50 border-teal-200'
                  : 'text-amber-800 bg-amber-50 border-amber-200'
              }`}
            >
              {hasPatientCeph ? 'Auto from Tab 7 Ceph' : 'Awaiting Tab 7 Steiner values'}
            </span>
            <p className="text-xs text-slate-500 font-medium leading-snug">
              {hasPatientCeph
                ? `Live vector from Steiner's Analysis — ${patientName} (${patientAge}y, ${patientGender})`
                : 'Enter SNA, SNB, ANB, U1-NA and L1-NB in Tab 7 (Cephalometric → Steiner). No manual entry here.'}
            </p>
          </div>
        </div>

        {/* OVERLAY TOGGLE BUTTONS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className={`flex items-center justify-center gap-1.5 min-h-9 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              showCurrent
                ? 'bg-sky-50 text-sky-700 border-sky-300'
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
            Patient Current
          </button>

          <button
            type="button"
            onClick={() => setShowIdeal(!showIdeal)}
            className={`flex items-center justify-center gap-1.5 min-h-9 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              showIdeal
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 border border-dashed border-white" />
            Ideal Norm (Dashed)
          </button>

          <button
            type="button"
            onClick={() => setShowPlanned(!showPlanned)}
            className={`flex items-center justify-center gap-1.5 min-h-9 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
              showPlanned
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-slate-100 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            Planned Goal
          </button>
        </div>
      </div>

      {/* 2. MAIN VECTOR CANVAS & ANIMATION BAR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* GRAPHIC STAGE CONTAINER */}
        <div className="lg:col-span-8 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden relative flex flex-col min-h-[420px] sm:min-h-[460px] shadow-inner">
          {/* TOP GRAPHIC CANVAS CONTROLS BAR */}
          <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between text-xs text-slate-300 z-10">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] text-teal-400 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Steiner Chevron Vector View
              </span>
              <span className="hidden sm:inline-block text-[10px] text-slate-500">
                (Right-facing lateral cephalogram)
              </span>
            </div>

            {/* ZOOM & PAN CONTROLS */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono font-semibold px-1 text-slate-400">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setZoom(1.0);
                  setPan({ x: 0, y: 0 });
                }}
                className="p-1 hover:bg-slate-800 rounded text-slate-300 hover:text-white"
                title="Reset View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SVG VECTOR RENDERER */}
          <div
            className="flex-1 w-full h-full cursor-grab active:cursor-grabbing select-none relative overflow-hidden bg-radial from-slate-900 to-slate-950"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {!hasPatientCeph && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/80 p-4 pointer-events-none">
                <div className="max-w-sm text-center space-y-2 rounded-xl border border-amber-500/40 bg-slate-900/95 px-4 py-3 shadow-xl">
                  <p className="text-sm font-bold text-amber-300">No Steiner values from Tab 7 yet</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Open <strong>Tab 7 → Steiner&apos;s Analysis</strong> and enter SNA, SNB, ANB, U1-NA (°/mm)
                    and L1-NB (°/mm). This diagram auto-generates — no manual entry here.
                  </p>
                </div>
              </div>
            )}
            <svg
              className="w-full h-full min-h-[380px]"
              viewBox="0 0 580 420"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* GRID PATTERN */}
                <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                </pattern>

                {/* ARROW MARKERS FOR ANATOMICAL CALLOUTS */}
                <marker
                  id="arrow-sky"
                  viewBox="0 0 10 10"
                  refX="5"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
              </defs>

              {/* BACKGROUND GRID */}
              <rect width="100%" height="100%" fill="url(#grid)" />

              {/* TRANSFORMED CANVAS CONTENT BASED ON ZOOM AND PAN */}
              <g
                transform={`translate(${290 + pan.x}, ${210 + pan.y}) scale(${zoom}) translate(-290, -210)`}
              >
                {/* A. IDEAL STEINER OVERLAY (GREEN DASHED) */}
                {showIdeal && (
                  <g className="transition-all duration-300 opacity-80">
                    {/* NA Line */}
                    <line
                      x1={idealGeom.nasion.x}
                      y1={idealGeom.nasion.y}
                      x2={idealGeom.pointA.x}
                      y2={idealGeom.pointA.y + 40}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    {/* NB Line */}
                    <line
                      x1={idealGeom.nasion.x}
                      y1={idealGeom.nasion.y}
                      x2={idealGeom.pointB.x}
                      y2={idealGeom.pointB.y + 40}
                      stroke="#10b981"
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                    />
                    {/* Upper Incisor U1 Stick */}
                    <line
                      x1={idealGeom.u1Apex.x}
                      y1={idealGeom.u1Apex.y}
                      x2={idealGeom.u1Tip.x}
                      y2={idealGeom.u1Tip.y}
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="4,4"
                    />
                    <circle cx={idealGeom.u1Apex.x} cy={idealGeom.u1Apex.y} r="3" fill="#10b981" />
                    <circle cx={idealGeom.u1Tip.x} cy={idealGeom.u1Tip.y} r="3.5" fill="#10b981" />

                    {/* Lower Incisor L1 Stick */}
                    <line
                      x1={idealGeom.l1Apex.x}
                      y1={idealGeom.l1Apex.y}
                      x2={idealGeom.l1Tip.x}
                      y2={idealGeom.l1Tip.y}
                      stroke="#10b981"
                      strokeWidth="2.5"
                      strokeDasharray="4,4"
                    />
                    <circle cx={idealGeom.l1Apex.x} cy={idealGeom.l1Apex.y} r="3" fill="#10b981" />
                    <circle cx={idealGeom.l1Tip.x} cy={idealGeom.l1Tip.y} r="3.5" fill="#10b981" />

                    <text
                      x={idealGeom.u1Apex.x - 45}
                      y={idealGeom.u1Apex.y - 5}
                      fill="#10b981"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      Ideal Norm
                    </text>
                  </g>
                )}

                {/* B. PLANNED TREATMENT OVERLAY (ORANGE / AMBER) */}
                {showPlanned && plannedGeom && (
                  <g className="transition-all duration-300 opacity-85">
                    {/* Upper Incisor U1 Stick */}
                    <line
                      x1={plannedGeom.u1Apex.x}
                      y1={plannedGeom.u1Apex.y}
                      x2={plannedGeom.u1Tip.x}
                      y2={plannedGeom.u1Tip.y}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                    <circle cx={plannedGeom.u1Apex.x} cy={plannedGeom.u1Apex.y} r="3.5" fill="#f59e0b" />
                    <circle cx={plannedGeom.u1Tip.x} cy={plannedGeom.u1Tip.y} r="4" fill="#f59e0b" />

                    {/* Lower Incisor L1 Stick */}
                    <line
                      x1={plannedGeom.l1Apex.x}
                      y1={plannedGeom.l1Apex.y}
                      x2={plannedGeom.l1Tip.x}
                      y2={plannedGeom.l1Tip.y}
                      stroke="#f59e0b"
                      strokeWidth="2.5"
                    />
                    <circle cx={plannedGeom.l1Apex.x} cy={plannedGeom.l1Apex.y} r="3.5" fill="#f59e0b" />
                    <circle cx={plannedGeom.l1Tip.x} cy={plannedGeom.l1Tip.y} r="4" fill="#f59e0b" />

                    <text
                      x={plannedGeom.u1Tip.x + 10}
                      y={plannedGeom.u1Tip.y}
                      fill="#fbbf24"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      Target Goal
                    </text>
                  </g>
                )}

                {/* C. PATIENT CURRENT OR ANIMATED POSITION (BLUE / SKY) */}
                {showCurrent && animatedGeom && (
                  <g className="transition-all duration-200">
                    {/* NA Reference Line */}
                    <line
                      x1={animatedGeom.nasion.x}
                      y1={animatedGeom.nasion.y}
                      x2={animatedGeom.pointA.x}
                      y2={animatedGeom.pointA.y + 40}
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />
                    {/* NB Reference Line */}
                    <line
                      x1={animatedGeom.nasion.x}
                      y1={animatedGeom.nasion.y}
                      x2={animatedGeom.pointB.x}
                      y2={animatedGeom.pointB.y + 40}
                      stroke="#38bdf8"
                      strokeWidth="2"
                    />

                    {/* NASION LANDMARK DOT & LABEL */}
                    <circle cx={animatedGeom.nasion.x} cy={animatedGeom.nasion.y} r="4" fill="#38bdf8" />
                    <text
                      x={animatedGeom.nasion.x - 18}
                      y={animatedGeom.nasion.y - 8}
                      fill="#7dd3fc"
                      fontSize="10"
                      fontWeight="extrabold"
                    >
                      N
                    </text>

                    {/* POINT A LANDMARK & LABEL */}
                    <circle cx={animatedGeom.pointA.x} cy={animatedGeom.pointA.y} r="3.5" fill="#38bdf8" />
                    <text
                      x={animatedGeom.pointA.x + 8}
                      y={animatedGeom.pointA.y + 4}
                      fill="#7dd3fc"
                      fontSize="10"
                      fontWeight="extrabold"
                    >
                      A (NA)
                    </text>

                    {/* POINT B LANDMARK & LABEL */}
                    <circle cx={animatedGeom.pointB.x} cy={animatedGeom.pointB.y} r="3.5" fill="#38bdf8" />
                    <text
                      x={animatedGeom.pointB.x + 8}
                      y={animatedGeom.pointB.y + 4}
                      fill="#7dd3fc"
                      fontSize="10"
                      fontWeight="extrabold"
                    >
                      B (NB)
                    </text>

                    {/* ANB ANGLE CALLOUT ARC */}
                    <path
                      d={`M ${animatedGeom.nasion.x + 5} ${animatedGeom.nasion.y + 25} Q ${
                        animatedGeom.nasion.x + 10
                      } ${animatedGeom.nasion.y + 28} ${animatedGeom.nasion.x + 18} ${
                        animatedGeom.nasion.y + 22
                      }`}
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="1.2"
                    />
                    <text
                      x={animatedGeom.nasion.x + 12}
                      y={animatedGeom.nasion.y + 40}
                      fill="#0284c7"
                      fontSize="9"
                      fontWeight="bold"
                      className="bg-slate-900"
                    >
                      ANB = {anb.toFixed(1)}°
                    </text>

                    {/* UPPER INCISOR (U1) STICK & LANDMARKS */}
                    <line
                      x1={animatedGeom.u1Apex.x}
                      y1={animatedGeom.u1Apex.y}
                      x2={animatedGeom.u1Tip.x}
                      y2={animatedGeom.u1Tip.y}
                      stroke="#0284c7"
                      strokeWidth="3.5"
                    />
                    {/* Root Apex Circle */}
                    <circle
                      cx={animatedGeom.u1Apex.x}
                      cy={animatedGeom.u1Apex.y}
                      r="4.5"
                      fill="#38bdf8"
                      stroke="#0284c7"
                      strokeWidth="1.5"
                    />
                    {/* Incisal Edge Tip Circle */}
                    <circle
                      cx={animatedGeom.u1Tip.x}
                      cy={animatedGeom.u1Tip.y}
                      r="5"
                      fill="#0284c7"
                      stroke="#7dd3fc"
                      strokeWidth="1.5"
                    />

                    {/* U1 PARAMETERS CALLOUT */}
                    <text
                      x={animatedGeom.u1Tip.x + 12}
                      y={animatedGeom.u1Tip.y - 10}
                      fill="#38bdf8"
                      fontSize="10"
                      fontWeight="extrabold"
                    >
                      U1-NA: {u1NaDeg.toFixed(1)}° / {u1NaMm.toFixed(1)}mm
                    </text>

                    {/* LOWER INCISOR (L1) STICK & LANDMARKS */}
                    <line
                      x1={animatedGeom.l1Apex.x}
                      y1={animatedGeom.l1Apex.y}
                      x2={animatedGeom.l1Tip.x}
                      y2={animatedGeom.l1Tip.y}
                      stroke="#0284c7"
                      strokeWidth="3.5"
                    />
                    {/* Root Apex Circle */}
                    <circle
                      cx={animatedGeom.l1Apex.x}
                      cy={animatedGeom.l1Apex.y}
                      r="4.5"
                      fill="#38bdf8"
                      stroke="#0284c7"
                      strokeWidth="1.5"
                    />
                    {/* Incisal Edge Tip Circle */}
                    <circle
                      cx={animatedGeom.l1Tip.x}
                      cy={animatedGeom.l1Tip.y}
                      r="5"
                      fill="#0284c7"
                      stroke="#7dd3fc"
                      strokeWidth="1.5"
                    />

                    {/* L1 PARAMETERS CALLOUT */}
                    <text
                      x={animatedGeom.l1Tip.x + 12}
                      y={animatedGeom.l1Tip.y + 14}
                      fill="#38bdf8"
                      fontSize="10"
                      fontWeight="extrabold"
                    >
                      L1-NB: {l1NbDeg.toFixed(1)}° / {l1NbMm.toFixed(1)}mm
                    </text>

                    {/* OVERJET & OVERBITE RELATIONSHIP AT INCISAL TIP */}
                    <line
                      x1={animatedGeom.u1Tip.x}
                      y1={animatedGeom.u1Tip.y}
                      x2={animatedGeom.l1Tip.x}
                      y2={animatedGeom.u1Tip.y}
                      stroke="#f43f5e"
                      strokeWidth="1.5"
                      strokeDasharray="2,2"
                    />
                    <text
                      x={Math.min(animatedGeom.u1Tip.x, animatedGeom.l1Tip.x) - 48}
                      y={animatedGeom.u1Tip.y + 3}
                      fill="#f43f5e"
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      OJ: {overjet !== null ? `${overjet.toFixed(1)}mm` : '—'}
                    </text>
                  </g>
                )}
              </g>
            </svg>

            {/* LEGEND overlay inside bottom left corner */}
            <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur-xs border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 flex flex-col gap-1 z-10 pointer-events-none">
              <div className="flex items-center gap-1.5 font-bold text-slate-200">
                <Layers className="w-3 h-3 text-teal-400" /> Vector Overlay Legend
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-sky-400 rounded-full" />
                <span>Solid Blue: Patient Current</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-emerald-400 border-b border-dashed border-slate-900" />
                <span>Dashed Green: Ideal Norm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400 rounded-full" />
                <span>Solid Orange: Treatment Goal</span>
              </div>
            </div>
          </div>

          {/* BOTTOM ANIMATION CONTROLS BAR */}
          <div className="bg-slate-900 border-t border-slate-800 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 z-10">
            <div className="flex items-center gap-2">
              {!isPlaying ? (
                <button
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Treatment Animation
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPlaying(false)}
                  className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  Pause
                </button>
              )}

              <button
                type="button"
                onClick={handleResetAnim}
                className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-colors"
                title="Reset animation to current position"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            {/* ANIMATION SPEED TOGGLES */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Speed:</span>
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
                {[0.5, 1.0, 2.0].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    onClick={() => setAnimSpeed(spd)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded transition-colors ${
                      animSpeed === spd
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {spd}×
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 3. LIVE PLANNED MOVEMENT METRICS & DIRECTION ARROWS */}
        <div className="lg:col-span-4 space-y-3">
          {/* UPPER INCISOR MOVEMENT BOX */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Upper Incisor (U1) Treatment
              </h4>
              <span className="text-[10px] font-mono font-semibold text-slate-400">NA Reference</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Linear Movement</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {upperShiftMm < 0 ? (
                    <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
                  ) : upperShiftMm > 0 ? (
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                  ) : null}
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {Math.abs(upperShiftMm)} mm
                  </span>
                </div>
                <span className="text-[9.5px] font-medium text-slate-500">
                  {upperShiftMm < 0 ? 'Retraction' : upperShiftMm > 0 ? 'Advancement' : 'Neutral'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Angular Torque</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {upperTorqueDeg > 0 ? `+${upperTorqueDeg}` : upperTorqueDeg}°
                  </span>
                </div>
                <span className="text-[9.5px] font-medium text-slate-500">
                  {upperTorqueDeg < 0 ? 'Palatal Root Torque' : upperTorqueDeg > 0 ? 'Labial Tip' : 'Maintain'}
                </span>
              </div>
            </div>
          </div>

          {/* LOWER INCISOR MOVEMENT BOX */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                Lower Incisor (L1) Treatment
              </h4>
              <span className="text-[10px] font-mono font-semibold text-slate-400">NB Reference</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Linear Movement</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {lowerShiftMm < 0 ? (
                    <ArrowLeft className="w-3.5 h-3.5 text-rose-500" />
                  ) : lowerShiftMm > 0 ? (
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                  ) : null}
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {Math.abs(lowerShiftMm)} mm
                  </span>
                </div>
                <span className="text-[9.5px] font-medium text-slate-500">
                  {lowerShiftMm < 0 ? 'Retraction' : lowerShiftMm > 0 ? 'Advancement' : 'Neutral'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">Angular Torque</span>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-xs font-mono font-extrabold text-slate-900">
                    {lowerTorqueDeg > 0 ? `+${lowerTorqueDeg}` : lowerTorqueDeg}°
                  </span>
                </div>
                <span className="text-[9.5px] font-medium text-slate-500">
                  {lowerTorqueDeg < 0 ? 'Lingual Root Torque' : lowerTorqueDeg > 0 ? 'Labial Tip' : 'Maintain'}
                </span>
              </div>
            </div>
          </div>

          {/* CEPHALOMETRIC VALUES SUMMARY CARD */}
          <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 gap-2">
              <span className="font-bold text-teal-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Tab 7 Steiner Values
              </span>
              <span className={`text-[10px] font-mono ${hasPatientCeph ? 'text-emerald-400' : 'text-amber-400'}`}>
                {hasPatientCeph ? 'Auto-synced' : 'Enter in Ceph tab'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px]">
              <div>
                <span className="text-slate-400">SNA Angle:</span>{' '}
                <strong className="text-white font-mono">
                  {snaFromCeph !== null ? `${snaFromCeph.toFixed(1)}°` : '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">SNB Angle:</span>{' '}
                <strong className="text-white font-mono">
                  {snbFromCeph !== null ? `${snbFromCeph.toFixed(1)}°` : '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">ANB Angle:</span>{' '}
                <strong className="text-teal-300 font-mono">
                  {anbFromCeph !== null ? `${anbFromCeph.toFixed(1)}°` : '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">IMPA Angle:</span>{' '}
                <strong className="text-white font-mono">
                  {impa !== null ? `${impa.toFixed(1)}°` : '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">U1-NA (° / mm):</span>{' '}
                <strong className="text-sky-300 font-mono">
                  {u1NaDegFromCeph !== null && u1NaMmFromCeph !== null
                    ? `${u1NaDegFromCeph.toFixed(1)}° / ${u1NaMmFromCeph.toFixed(1)}mm`
                    : '—'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400">L1-NB (° / mm):</span>{' '}
                <strong className="text-sky-300 font-mono">
                  {l1NbDegFromCeph !== null && l1NbMmFromCeph !== null
                    ? `${l1NbDegFromCeph.toFixed(1)}° / ${l1NbMmFromCeph.toFixed(1)}mm`
                    : '—'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. AUTOMATIC INFERENCE SECTION (COMPACT & PRECISE) */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <div className="w-6 h-6 rounded-md bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-900">
            Steiner Analysis Automatic Diagnostic Inference
          </h4>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
          {/* SKELETAL PATTERN */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Skeletal Pattern
            </span>
            <p className="font-semibold text-slate-900 mt-1">{skeletalInference}</p>
          </div>

          {/* UPPER INCISOR STATUS */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Upper Incisor Status
            </span>
            <p className="font-semibold text-slate-900 mt-1">{upperIncisorInference}</p>
          </div>

          {/* LOWER INCISOR STATUS */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Lower Incisor Status
            </span>
            <p className="font-semibold text-slate-900 mt-1">{lowerIncisorInference}</p>
          </div>

          {/* DENTAL COMPENSATION */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Dental Compensation
            </span>
            <p className="font-semibold text-slate-900 mt-1">{dentalCompensationInference}</p>
          </div>

          {/* SUGGESTED UPPER INCISOR MOVEMENT */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Suggested Upper Incisor Movement
            </span>
            <p className="font-bold text-teal-900 mt-1">{suggestedUpperMovementText}</p>
          </div>

          {/* SUGGESTED LOWER INCISOR MOVEMENT */}
          <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-2.5 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Suggested Lower Incisor Movement
            </span>
            <p className="font-bold text-teal-900 mt-1">{suggestedLowerMovementText}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabSteinerStick);
