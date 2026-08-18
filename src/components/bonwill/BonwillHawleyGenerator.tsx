import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { BonwillTemplateData, ToothWidthsAnterior, ArchJawType, PatientRecord } from '../../types';
import { calculateHawleyGeometry, DEFAULT_TOOTH_WIDTHS, hawleyInputsFromFdi } from './BonwillGeometry';
import { getAnterior6FdiTeeth } from '../../lib/calculations';
import { getCurrentUserAccount } from '../../lib/authContext';
import { BonwillCanvas } from './BonwillCanvas';
import {
  Ruler,
  Calculator,
  Printer,
  Info,
  Layers,
  Sun,
  Moon,
  CheckCircle2,
  Sparkles,
  Sliders,
} from 'lucide-react';

interface BonwillHawleyGeneratorProps {
  patient?: PatientRecord | null;
  toothWidths?: Record<string, number | ''>;
  patientName?: string;
  patientId?: string;
}

export const BonwillHawleyGenerator = memo(function BonwillHawleyGenerator({
  patient,
  toothWidths: toothWidthsProp,
  patientName: patientNameProp,
  patientId: patientIdProp,
}: BonwillHawleyGeneratorProps) {
  const resolvedName =
    patientNameProp ?? patient?.name ?? 'John Doe';
  const resolvedId =
    patientIdProp ?? patient?.patientId ?? patient?.id ?? 'ORTHO-2024-88';
  const resolvedClinician =
    patient?.assignedStaffName || getCurrentUserAccount()?.name || 'Orthodontist';

  // State for Hawley Template Data
  const [data, setData] = useState<BonwillTemplateData>({
    patientName: resolvedName,
    patientId: resolvedId,
    archType: 'Maxillary',
    archForm: 'Ovoid',
    clinicianName: resolvedClinician,
    date: new Date().toISOString().split('T')[0],
    sumOfAnteriors: 42.0,
    bracketAllowance: 3.0,
    toothWidthsAnterior: { ...DEFAULT_TOOTH_WIDTHS },
    showGrid: true,
    showConstructionLines: true,
    showMeasurementLabels: true,
    showCoordinates: false, // Default OFF to keep vector lines uncluttered
    showArcFill: true,
    themeMode: 'dark',
  });

  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingDualPdf, setIsExportingDualPdf] = useState(false);

  // Keep patient name & ID synced if props change
  useEffect(() => {
    setData((prev) => ({
      ...prev,
      patientName: resolvedName,
      patientId: resolvedId,
    }));
  }, [resolvedName, resolvedId]);

  const fdiToothWidths = toothWidthsProp ?? patient?.modelAnalysis?.toothWidths;
  const fdiHawley = useMemo(
    () => hawleyInputsFromFdi(fdiToothWidths, data.archType),
    [fdiToothWidths, data.archType]
  );
  const isAutoFromFdi = fdiHawley !== null;
  const activeData = useMemo(
    () =>
      fdiHawley
        ? {
            ...data,
            sumOfAnteriors: fdiHawley.sumOfAnteriors,
            toothWidthsAnterior: fdiHawley.toothWidthsAnterior,
          }
        : data,
    [data, fdiHawley]
  );

  // Calculate live geometry once per activeData change
  const geom = useMemo(() => calculateHawleyGeometry(activeData), [activeData]);

  const handleExportPdf = useCallback(async () => {
    setIsExportingPdf(true);
    try {
      const { exportBonwillPDF } = await import('./BonwillExport');
      exportBonwillPDF(activeData);
    } finally {
      setIsExportingPdf(false);
    }
  }, [activeData]);

  const handleExportDualPdf = useCallback(async () => {
    setIsExportingDualPdf(true);
    try {
      const { exportBonwillDualArchPDF } = await import('./BonwillExport');
      const maxFdi = hawleyInputsFromFdi(fdiToothWidths, 'Maxillary');
      const mandFdi = hawleyInputsFromFdi(fdiToothWidths, 'Mandibular');

      const maxPayload: Partial<BonwillTemplateData> = {
        archType: 'Maxillary',
        sumOfAnteriors: maxFdi ? maxFdi.sumOfAnteriors : (data.archType === 'Maxillary' ? activeData.sumOfAnteriors : 45.0),
        toothWidthsAnterior: maxFdi ? maxFdi.toothWidthsAnterior : (data.archType === 'Maxillary' ? activeData.toothWidthsAnterior : undefined),
        bracketAllowance: activeData.bracketAllowance,
      };

      const mandPayload: Partial<BonwillTemplateData> = {
        archType: 'Mandibular',
        sumOfAnteriors: mandFdi ? mandFdi.sumOfAnteriors : (data.archType === 'Mandibular' ? activeData.sumOfAnteriors : 38.0),
        toothWidthsAnterior: mandFdi ? mandFdi.toothWidthsAnterior : (data.archType === 'Mandibular' ? activeData.toothWidthsAnterior : undefined),
        bracketAllowance: activeData.bracketAllowance,
      };

      exportBonwillDualArchPDF(resolvedName, resolvedId, maxPayload, mandPayload);
    } finally {
      setIsExportingDualPdf(false);
    }
  }, [fdiToothWidths, data.archType, activeData, resolvedName, resolvedId]);

  // ACTION C: Quick Preset Handler (Anatomically scaled proportions matching target sum)
  const handleApplyPreset = (sumValue: number) => {
    const ratio = sumValue / 42.0;
    const newToothWidths: ToothWidthsAnterior = {
      lr3: parseFloat((DEFAULT_TOOTH_WIDTHS.lr3 * ratio).toFixed(2)),
      lr2: parseFloat((DEFAULT_TOOTH_WIDTHS.lr2 * ratio).toFixed(2)),
      lr1: parseFloat((DEFAULT_TOOTH_WIDTHS.lr1 * ratio).toFixed(2)),
      ll1: parseFloat((DEFAULT_TOOTH_WIDTHS.ll1 * ratio).toFixed(2)),
      ll2: parseFloat((DEFAULT_TOOTH_WIDTHS.ll2 * ratio).toFixed(2)),
      ll3: parseFloat((DEFAULT_TOOTH_WIDTHS.ll3 * ratio).toFixed(2)),
    };
    const actualSum = parseFloat(
      (
        newToothWidths.lr3 +
        newToothWidths.lr2 +
        newToothWidths.lr1 +
        newToothWidths.ll1 +
        newToothWidths.ll2 +
        newToothWidths.ll3
      ).toFixed(2)
    );

    setData((prev) => ({
      ...prev,
      sumOfAnteriors: actualSum,
      toothWidthsAnterior: newToothWidths,
    }));
  };

  // ACTION B: Two-Way Data Binding - Handler when "Sum of 6 Anteriors" slider or number input changes
  const handleSumChange = (val: number) => {
    const newSum = Math.max(20.0, Math.min(80.0, isNaN(val) ? 20 : val));
    const currentSum =
      data.toothWidthsAnterior.lr3 +
      data.toothWidthsAnterior.lr2 +
      data.toothWidthsAnterior.lr1 +
      data.toothWidthsAnterior.ll1 +
      data.toothWidthsAnterior.ll2 +
      data.toothWidthsAnterior.ll3;

    let newToothWidths: ToothWidthsAnterior;

    if (currentSum > 0) {
      const scale = newSum / currentSum;
      newToothWidths = {
        lr3: parseFloat((data.toothWidthsAnterior.lr3 * scale).toFixed(2)),
        lr2: parseFloat((data.toothWidthsAnterior.lr2 * scale).toFixed(2)),
        lr1: parseFloat((data.toothWidthsAnterior.lr1 * scale).toFixed(2)),
        ll1: parseFloat((data.toothWidthsAnterior.ll1 * scale).toFixed(2)),
        ll2: parseFloat((data.toothWidthsAnterior.ll2 * scale).toFixed(2)),
        ll3: parseFloat((data.toothWidthsAnterior.ll3 * scale).toFixed(2)),
      };
    } else {
      const singleWidth = parseFloat((newSum / 6).toFixed(2));
      newToothWidths = {
        lr3: singleWidth,
        lr2: singleWidth,
        lr1: singleWidth,
        ll1: singleWidth,
        ll2: singleWidth,
        ll3: singleWidth,
      };
    }

    setData((prev) => ({
      ...prev,
      sumOfAnteriors: newSum,
      toothWidthsAnterior: newToothWidths,
    }));
  };

  return (
    <div className="w-full text-slate-100 flex flex-col font-sans">
      {/* 1. HEADER BAR - Standard Flow Block (prevents fixed sticky overlay bugs) */}
      <header className="relative w-full rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-md px-3 py-2.5 mb-4 shadow-md flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 shrink-0">
            <Ruler className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold tracking-tight text-slate-100 truncate">
              HAWLEY BONWILL ARCH FORM
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 truncate hidden sm:block">
              1:1 vector CAD from anterior mesiodistal dimensions
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setData((prev) => ({ ...prev, themeMode: prev.themeMode === 'dark' ? 'light' : 'dark' }))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Toggle Light / Dark Viewport Mode"
          >
            {data.themeMode === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            title="Export 1:1 True-Scale Printable PDF for Current Arch"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-600 disabled:opacity-60 text-white font-semibold text-[10px] sm:text-xs shadow-md shadow-teal-950/40 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isExportingPdf ? 'Exporting…' : `Print 1:1 ${data.archType} (PDF)`}</span>
            <span className="sm:hidden">{isExportingPdf ? '…' : 'PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportDualPdf}
            disabled={isExportingDualPdf}
            title="Export 1:1 True-Scale Printable PDF containing BOTH Upper & Lower Arches"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-60 text-white font-semibold text-[10px] sm:text-xs shadow-md shadow-teal-900/30 transition-colors"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-200" />
            <span className="hidden sm:inline">{isExportingDualPdf ? 'Exporting…' : 'Dual Arch (Upper+Lower 1:1)'}</span>
            <span className="sm:hidden">{isExportingDualPdf ? '…' : 'Both'}</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT STACK - VERTICAL ONE BY ONE */}
      <div className="flex flex-col gap-4 w-full">
        {/* 1. QUICK CLINICAL PRESETS */}
        {!isAutoFromFdi && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                Quick Clinical Presets
              </span>
              <span className="text-[10px] text-slate-500 font-mono">MD Sum</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Small', sum: 38.0 },
                { label: 'Standard', sum: 42.0 },
                { label: 'Large', sum: 46.0 },
                { label: 'X-Large', sum: 50.0 },
              ].map((preset) => {
                const isSelected = Math.abs(data.sumOfAnteriors - preset.sum) < 0.2;
                return (
                  <button
                    key={preset.label}
                    onClick={() => handleApplyPreset(preset.sum)}
                    className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex flex-col items-center gap-0.5 transition-all ${
                      isSelected
                        ? 'bg-teal-500/20 border-teal-500/50 text-teal-300 shadow-md shadow-teal-950'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="font-bold">{preset.sum} mm</span>
                    <span className="text-[10px] opacity-70 font-normal">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 2. PARAMETER ENTRY PANEL */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col gap-3.5 w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h2 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              Input Parameters
            </h2>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
              Auto
            </span>
          </div>

          {/* PRIMARY FIELD: SUM OF 6 ANTERIORS */}
          <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-bold text-teal-300 flex items-center gap-1">
                <span>Sum of 6 Anteriors</span>
                <Info className="w-3 h-3 text-slate-400" title="Mesiodistal width sum from distal of LR3 to distal of LL3 in mm" />
              </label>
              <span className="text-sm font-mono font-bold text-teal-400">{activeData.sumOfAnteriors.toFixed(1)} mm</span>
            </div>

            {!isAutoFromFdi && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  step="0.5"
                  min="20"
                  max="80"
                  value={data.sumOfAnteriors}
                  onChange={(e) => handleSumChange(parseFloat(e.target.value))}
                  className="w-20 bg-slate-900 border border-teal-500/40 rounded-lg px-2 py-1 text-xs font-bold text-teal-200 focus:outline-none focus:border-teal-400 font-mono text-center"
                />
                <input
                  type="range"
                  min="30"
                  max="58"
                  step="0.5"
                  value={data.sumOfAnteriors}
                  onChange={(e) => handleSumChange(parseFloat(e.target.value))}
                  className="flex-1 accent-teal-500 cursor-pointer h-1.5"
                />
              </div>
            )}

            {isAutoFromFdi && (
              <p className="text-[10px] text-slate-500 leading-snug">
                Tab 6 FDI: {getAnterior6FdiTeeth(data.archType).join(', ')}
              </p>
            )}
          </div>

          {/* BRACKET ALLOWANCE & ARCH JAW TYPE DROPDOWN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-300">
                Bracket Allowance (mm)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="10"
                value={data.bracketAllowance}
                onChange={(e) => setData({ ...data, bracketAllowance: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-semibold text-slate-300">
                Arch Jaw Type
              </label>
              <select
                value={data.archType}
                onChange={(e) => setData({ ...data, archType: e.target.value as ArchJawType })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 focus:outline-none focus:border-teal-500 cursor-pointer"
              >
                <option value="maxillary">Maxillary</option>
                <option value="mandibular">Mandibular</option>
              </select>
            </div>
          </div>
        </div>

        {/* 3. CALCULATED SUMMARY METRICS PANEL */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-md flex flex-col gap-3 w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5" />
              Calculated Metrics
            </h3>
            {isAutoFromFdi ? (
              <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                Tab 6 FDI
              </span>
            ) : (
              <span className="text-[10px] text-amber-400">Enter Tab 6 tooth widths</span>
            )}
          </div>

          {isAutoFromFdi && (
            <p className="text-[10px] text-slate-500 leading-snug">
              From {getAnterior6FdiTeeth(data.archType).join(', ')} + {data.bracketAllowance.toFixed(1)} mm bracket
              = {geom.correctedSum.toFixed(1)} mm corrected sum
            </p>
          )}

          <div className="grid grid-cols-3 gap-2.5 font-mono text-xs w-full">
            {/* Top 1: Anterior Radius */}
            <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-sans">Anterior Radius (r)</span>
              <span className="text-sm font-bold text-teal-300">{geom.r.toFixed(2)} mm</span>
              <span className="text-[8px] text-slate-500 font-sans">Corrected Sum / π</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-sans">Ray Divergence</span>
              <span className="text-sm font-bold text-amber-400">42.0°</span>
              <span className="text-[8px] text-slate-500 font-sans">Fixed Hawley angle</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-sans">Intercanine Span</span>
              <span className="text-sm font-bold text-sky-300">{geom.metrics.intercanineSpan.toFixed(1)} mm</span>
              <span className="text-[8px] text-slate-500 font-sans">r × √3</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-sans">1st Molar Span</span>
              <span className="text-sm font-bold text-emerald-300">{geom.metrics.intermolar1Span.toFixed(1)} mm</span>
              <span className="text-[8px] text-slate-500 font-sans">1.0mm outside O</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-sans">2nd Molar Span</span>
              <span className="text-sm font-bold text-indigo-300">{geom.metrics.intermolar2Span.toFixed(1)} mm</span>
              <span className="text-[8px] text-slate-500 font-sans">4.5mm inside O</span>
            </div>

            <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex flex-col gap-0.5">
              <span className="text-[9px] text-slate-400 uppercase font-sans">Arch Perimeter</span>
              <span className="text-sm font-bold text-rose-300">{geom.metrics.archPerimeter.toFixed(1)} mm</span>
              <span className="text-[8px] text-slate-500 font-sans">Arc + Ray Lengths</span>
            </div>
          </div>
        </div>

        {/* 4. VIEWPORT LAYER TOGGLES */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md w-full">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-bold text-slate-200">Layer View Toggles</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                checked={data.showGrid}
                onChange={(e) => setData({ ...data, showGrid: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
              />
              <span>1mm Grid</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                checked={data.showConstructionLines}
                onChange={(e) => setData({ ...data, showConstructionLines: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
              />
              <span>Construction Lines (r, 2r, 42° Rays)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                checked={data.showMeasurementLabels}
                onChange={(e) => setData({ ...data, showMeasurementLabels: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
              />
              <span>Text Labels</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                checked={data.showCoordinates}
                onChange={(e) => setData({ ...data, showCoordinates: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
              />
              <span>Detailed Coordinates (X, Y)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-slate-100">
              <input
                type="checkbox"
                checked={data.showArcFill}
                onChange={(e) => setData({ ...data, showArcFill: e.target.checked })}
                className="rounded border-slate-700 bg-slate-950 text-teal-500 focus:ring-0 cursor-pointer"
              />
              <span>Shaded Arch Area</span>
            </label>
          </div>
        </div>

        {/* 5. MAIN CAD CANVAS CONTAINER */}
        <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-2xl relative min-h-[580px] flex flex-col">
          <BonwillCanvas data={activeData} geometry={geom} />
        </div>
      </div>
    </div>
  );
});
