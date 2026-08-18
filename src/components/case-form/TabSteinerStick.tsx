import React, { useState, useMemo, useCallback } from 'react';
import {
  SteinersAnalysisData,
  SchwarzTweedAnalysisData,
  DownsAnalysisData,
  CephLandmarkModuleData,
  Gender,
} from '../../types';
import { autoGenerateAllCephAnalyses } from './landmark-id/autoAnalysisGenerator';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Info,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface TabSteinerStickProps {
  steinersAnalysis?: SteinersAnalysisData;
  onUpdateSteinersAnalysis?: (data: SteinersAnalysisData) => void;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  downsAnalysis?: DownsAnalysisData;
  cephLandmarkData?: CephLandmarkModuleData;
  overjetMm?: number | '';
  overbiteMm?: number | '';
  patientName?: string;
  patientAge?: number | string;
  patientGender?: Gender;
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
  interincisal: 131.0,
  mandibularPlane: 32.0,
  occlusalPlane: 14.0,
  sLine: 0.0,
} as const;

export const TabSteinerStick: React.FC<TabSteinerStickProps> = ({
  steinersAnalysis,
  onUpdateSteinersAnalysis,
  schwarzTweedAnalysis,
  downsAnalysis,
  cephLandmarkData,
  patientAge = 18,
  patientGender = 'Female',
}) => {
  // --- 1. AUTO-GENERATION FROM LANDMARKS IF STEINER ANALYSIS IS BLANK ---
  const derivedFromLandmarks = useMemo(() => {
    if (cephLandmarkData?.landmarks && Object.keys(cephLandmarkData.landmarks).length >= 4) {
      try {
        const result = autoGenerateAllCephAnalyses(
          cephLandmarkData.landmarks,
          cephLandmarkData.scalePixelsPerMm || 10,
          'pre',
          typeof patientAge === 'number' ? patientAge : 18,
          (patientGender as Gender) || 'Male'
        );
        return result.steinersAnalysis;
      } catch (err) {
        console.warn('Failed to auto-derive Steiner values from landmarks:', err);
      }
    }
    return null;
  }, [cephLandmarkData, patientAge, patientGender]);

  // Combine direct steinersAnalysis with derived landmarks
  const activeSteiners = useMemo(() => {
    if (steinersAnalysis?.parameters && Object.keys(steinersAnalysis.parameters).length > 0) {
      return steinersAnalysis;
    }
    return derivedFromLandmarks || undefined;
  }, [steinersAnalysis, derivedFromLandmarks]);

  // --- 2. SAMPLE DEMO DATA FALLBACK TOGGLE ---
  const [useSampleFallback, setUseSampleFallback] = useState<boolean>(false);

  // Read values
  const snaFromCeph = useMemo(() => {
    const v = readSteinersStageValue(activeSteiners, 'sna');
    if (v !== null) return v;
    return useSampleFallback ? 85.5 : null;
  }, [activeSteiners, useSampleFallback]);

  const snbFromCeph = useMemo(() => {
    const v = readSteinersStageValue(activeSteiners, 'snb');
    if (v !== null) return v;
    return useSampleFallback ? 79.0 : null;
  }, [activeSteiners, useSampleFallback]);

  const anbFromCeph = useMemo(() => {
    const direct = readSteinersStageValue(activeSteiners, 'anb');
    if (direct !== null) return direct;
    if (snaFromCeph !== null && snbFromCeph !== null) {
      return parseFloat((snaFromCeph - snbFromCeph).toFixed(1));
    }
    const downsVal = readDownsAnb(downsAnalysis);
    if (downsVal !== null) return downsVal;
    return useSampleFallback ? 6.5 : null;
  }, [activeSteiners, downsAnalysis, snaFromCeph, snbFromCeph, useSampleFallback]);

  const u1NaDegFromCeph = useMemo(() => {
    const v = readSteinersStageValue(activeSteiners, 'upperIncisorToNaDeg');
    if (v !== null) return v;
    return useSampleFallback ? 28.5 : null;
  }, [activeSteiners, useSampleFallback]);

  const u1NaMmFromCeph = useMemo(() => {
    const v = readSteinersStageValue(activeSteiners, 'upperIncisorToNaMm');
    if (v !== null) return v;
    return useSampleFallback ? 6.5 : null;
  }, [activeSteiners, useSampleFallback]);

  const l1NbDegFromCeph = useMemo(() => {
    const v = readSteinersStageValue(activeSteiners, 'lowerIncisorToNbDeg');
    if (v !== null) return v;
    return useSampleFallback ? 29.0 : null;
  }, [activeSteiners, useSampleFallback]);

  const l1NbMmFromCeph = useMemo(() => {
    const v = readSteinersStageValue(activeSteiners, 'lowerIncisorToNbMm');
    if (v !== null) return v;
    return useSampleFallback ? 5.5 : null;
  }, [activeSteiners, useSampleFallback]);

  const hasPatientCeph =
    snaFromCeph !== null &&
    snbFromCeph !== null &&
    anbFromCeph !== null &&
    u1NaDegFromCeph !== null &&
    u1NaMmFromCeph !== null &&
    l1NbDegFromCeph !== null &&
    l1NbMmFromCeph !== null;

  const dataOriginBadge = useMemo(() => {
    if (steinersAnalysis?.parameters && Object.keys(steinersAnalysis.parameters).length > 0) {
      return { text: 'Auto-Synced from Tab 7 Ceph', type: 'success' };
    }
    if (derivedFromLandmarks) {
      return { text: 'Derived from Digitized Landmarks', type: 'info' };
    }
    if (useSampleFallback) {
      return { text: 'Loaded Sample Clinical Baseline', type: 'warning' };
    }
    return { text: 'Awaiting Tab 7 Ceph Data', type: 'empty' };
  }, [steinersAnalysis, derivedFromLandmarks, useSampleFallback]);

  const handleAutofetchClick = useCallback(() => {
    if (derivedFromLandmarks && onUpdateSteinersAnalysis) {
      onUpdateSteinersAnalysis(derivedFromLandmarks);
      setUseSampleFallback(false);
    } else {
      setUseSampleFallback(true);
    }
  }, [derivedFromLandmarks, onUpdateSteinersAnalysis]);

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
    return useSampleFallback ? 94.5 : null;
  }, [schwarzTweedAnalysis, downsAnalysis, useSampleFallback]);

  // --- 3. MOVEMENT CALCULATIONS (DELTAS vs ideal) ---
  const upperShiftMm = hasPatientCeph ? parseFloat((IDEAL_STEINER.u1Mm - u1NaMm).toFixed(1)) : 0;
  const upperTorqueDeg = hasPatientCeph ? parseFloat((IDEAL_STEINER.u1Deg - u1NaDeg).toFixed(1)) : 0;
  const lowerShiftMm = hasPatientCeph ? parseFloat((IDEAL_STEINER.l1Mm - l1NbMm).toFixed(1)) : 0;
  const lowerTorqueDeg = hasPatientCeph ? parseFloat((IDEAL_STEINER.l1Deg - l1NbDeg).toFixed(1)) : 0;

  // --- 4. AUTOMATIC INFERENCE LOGIC ---
  const skeletalInference = useMemo(() => {
    if (!hasPatientCeph) return 'Awaiting Tab 7 Steiner Values';
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

  return (
    <div className="space-y-4 font-sans text-slate-900 w-full">
      {/* 1. TOP BAR & DATA AUTOFETCH HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full">
        <div className="flex items-start sm:items-center gap-3.5 w-full md:w-auto flex-1">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5 sm:mt-0">
            <Compass className="w-5 h-5" />
          </div>
          <div className="space-y-1 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Steiner Analysis & Incisor Treatment Planning
              </h2>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 whitespace-nowrap ${
                  dataOriginBadge.type === 'success'
                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                    : dataOriginBadge.type === 'info'
                    ? 'text-sky-700 bg-sky-50 border-sky-200'
                    : dataOriginBadge.type === 'warning'
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : 'text-slate-600 bg-slate-100 border-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>{dataOriginBadge.text}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Comprehensive cephalometric incisor movement predetermination, torque targets & dentoalveolar compensation
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-start md:justify-end shrink-0 pt-1 md:pt-0">
          <button
            type="button"
            onClick={handleAutofetchClick}
            className="flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95 cursor-pointer whitespace-nowrap"
            title="Refresh and auto-fetch values from Tab 7 Ceph"
          >
            <RefreshCw className="w-3.5 h-3.5 shrink-0" />
            <span>Auto-Fetch Data</span>
          </button>
          {!hasPatientCeph && !useSampleFallback && (
            <button
              type="button"
              onClick={() => setUseSampleFallback(true)}
              className="flex items-center justify-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors active:scale-95 cursor-pointer whitespace-nowrap"
              title="Load sample baseline parameters"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>Load Sample Data</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. PLANNED INCISOR BIOMECHANICS & MOVEMENT TARGETS (VERTICAL ONE-BY-ONE) */}
      <div className="flex flex-col gap-4 w-full">
        {/* UPPER INCISOR CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h4 className="text-sm font-bold text-slate-900">
                Upper Incisor (U1) Treatment Planning
              </h4>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              NA Reference Line
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Linear Movement
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {upperShiftMm < 0 ? (
                  <ArrowLeft className="w-4 h-4 text-rose-500" />
                ) : upperShiftMm > 0 ? (
                  <ArrowRight className="w-4 h-4 text-emerald-500" />
                ) : null}
                <span className="text-base font-mono font-extrabold text-slate-900">
                  {Math.abs(upperShiftMm)} mm
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-slate-600 mt-0.5 block">
                {upperShiftMm < 0 ? 'Retraction Target' : upperShiftMm > 0 ? 'Advancement Target' : 'Neutral Position'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Angular Torque
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-base font-mono font-extrabold text-slate-900">
                  {upperTorqueDeg > 0 ? `+${upperTorqueDeg}` : upperTorqueDeg}°
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-slate-600 mt-0.5 block">
                {upperTorqueDeg < 0
                  ? 'Palatal Root Torque'
                  : upperTorqueDeg > 0
                  ? 'Labial Crown Tip'
                  : 'Maintain Inclination'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Current Measured:</span>
              <strong className="font-mono text-slate-900">
                {u1NaDeg.toFixed(1)}° / {u1NaMm.toFixed(1)} mm
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Ideal Steiner Norm:</span>
              <strong className="font-mono text-teal-700">22.0° / 4.0 mm</strong>
            </div>
            <div className="flex items-start gap-1.5 bg-teal-50/60 border border-teal-100 rounded-xl p-3 text-teal-900 mt-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed">
                <strong>Movement Prescription:</strong> {suggestedUpperMovementText}
              </span>
            </div>
          </div>
        </div>

        {/* LOWER INCISOR CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 w-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <h4 className="text-sm font-bold text-slate-900">
                Lower Incisor (L1) Treatment Planning
              </h4>
            </div>
            <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              NB Reference Line
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-center">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Linear Movement
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                {lowerShiftMm < 0 ? (
                  <ArrowLeft className="w-4 h-4 text-rose-500" />
                ) : lowerShiftMm > 0 ? (
                  <ArrowRight className="w-4 h-4 text-emerald-500" />
                ) : null}
                <span className="text-base font-mono font-extrabold text-slate-900">
                  {Math.abs(lowerShiftMm)} mm
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-slate-600 mt-0.5 block">
                {lowerShiftMm < 0 ? 'Retraction Target' : lowerShiftMm > 0 ? 'Advancement Target' : 'Neutral Position'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Angular Torque
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className="text-base font-mono font-extrabold text-slate-900">
                  {lowerTorqueDeg > 0 ? `+${lowerTorqueDeg}` : lowerTorqueDeg}°
                </span>
              </div>
              <span className="text-[10.5px] font-semibold text-slate-600 mt-0.5 block">
                {lowerTorqueDeg < 0
                  ? 'Lingual Root Torque'
                  : lowerTorqueDeg > 0
                  ? 'Labial Crown Tip'
                  : 'Maintain Inclination'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 pt-1 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span>Current Measured:</span>
              <strong className="font-mono text-slate-900">
                {l1NbDeg.toFixed(1)}° / {l1NbMm.toFixed(1)} mm
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Ideal Steiner Norm:</span>
              <strong className="font-mono text-teal-700">25.0° / 4.0 mm</strong>
            </div>
            <div className="flex items-start gap-1.5 bg-teal-50/60 border border-teal-100 rounded-xl p-3 text-teal-900 mt-2">
              <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed">
                <strong>Movement Prescription:</strong> {suggestedLowerMovementText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KEY CLINICAL INFERENCES & COMPENSATION SYNTHESIS (VERTICAL ONE-BY-ONE) */}
      <div className="flex flex-col gap-3.5 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5 w-full">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-teal-600" /> Skeletal Sagittal Pattern
          </span>
          <p className="text-xs font-bold text-slate-900 leading-snug">
            {skeletalInference}
          </p>
          <p className="text-[11px] text-slate-500">
            SNA: {sna.toFixed(1)}° | SNB: {snb.toFixed(1)}° | ANB: {anb.toFixed(1)}°
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5 w-full">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" /> Dentoalveolar Inferences
          </span>
          <p className="text-xs font-medium text-slate-800 leading-snug">
            <strong>U1:</strong> {upperIncisorInference}
          </p>
          <p className="text-xs font-medium text-slate-800 leading-snug">
            <strong>L1:</strong> {lowerIncisorInference}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-1.5 w-full">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Dental Compensation
          </span>
          <p className="text-xs text-slate-700 leading-relaxed">
            {dentalCompensationInference}
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabSteinerStick);
