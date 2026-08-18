import React, { useState, useMemo } from 'react';
import {
  SnFhCorrectionAnalysisData,
  SnFhCranialBaseStageMetrics,
  SnFhStageKey,
  Gender,
  SteinersAnalysisData,
  DownsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  CephDiscrepancyAnalysisData,
} from '../../types';
import {
  calculateSnFhCorrections,
  extractSnFhMetricsFromAnalyses,
  DEFAULT_SN_FH_NORM,
  DEFAULT_SN_LENGTH_FEMALE,
  DEFAULT_SN_LENGTH_MALE,
  DEFAULT_SADDLE_ANGLE_NORM,
  INITIAL_SN_FH_STAGE_METRICS,
} from '../../lib/snFhCorrectionEngine';
import {
  Compass,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Info,
  ShieldAlert,
  Sliders,
  Layers,
} from 'lucide-react';

interface SnFhCorrectionMatrixPanelProps {
  data?: SnFhCorrectionAnalysisData;
  onChange?: (updated: SnFhCorrectionAnalysisData) => void;
  patientGender?: Gender;
  activeStage?: SnFhStageKey;
  onStageChange?: (stage: SnFhStageKey) => void;
  steinersAnalysis?: SteinersAnalysisData;
  downsAnalysis?: DownsAnalysisData;
  mcnamaraAnalysis?: McnamaraAnalysisData;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  cephDiscrepancyAnalysis?: CephDiscrepancyAnalysisData;
}

const STAGES: { key: SnFhStageKey; label: string; sub: string }[] = [
  { key: 'pre', label: 'Pre-Rx', sub: 'Baseline Pre-Treatment' },
  { key: 'mid', label: 'Growth Mod', sub: 'Phase I / Mid-Treatment' },
  { key: 'post', label: 'Post-Rx', sub: 'Post-Treatment Final' },
  { key: 'retention', label: 'Retention', sub: 'Post-Debond Follow-up' },
];

export const SnFhCorrectionMatrixPanel: React.FC<SnFhCorrectionMatrixPanelProps> = ({
  data,
  onChange,
  patientGender = 'Female',
  activeStage = 'pre',
  onStageChange,
  steinersAnalysis,
  downsAnalysis,
  mcnamaraAnalysis,
  schwarzTweedAnalysis,
  cephDiscrepancyAnalysis,
}) => {
  const [internalStage, setInternalStage] = useState<SnFhStageKey>(activeStage);
  const currentStage = onStageChange ? activeStage : internalStage;
  const setStage = (st: SnFhStageKey) => {
    if (onStageChange) onStageChange(st);
    else setInternalStage(st);
  };

  const standardNorm = data?.standardNorm || DEFAULT_SN_FH_NORM;

  // Ensure stages object exists
  const currentStageMetrics: SnFhCranialBaseStageMetrics = useMemo(() => {
    const stData = data?.stages?.[currentStage];
    if (stData) return { ...INITIAL_SN_FH_STAGE_METRICS, ...stData };

    // Fallback auto-fetch if current stage is uninitialized
    return extractSnFhMetricsFromAnalyses(
      currentStage,
      steinersAnalysis,
      downsAnalysis,
      mcnamaraAnalysis,
      schwarzTweedAnalysis,
      cephDiscrepancyAnalysis
    );
  }, [data, currentStage, steinersAnalysis, downsAnalysis, mcnamaraAnalysis, schwarzTweedAnalysis, cephDiscrepancyAnalysis]);

  // Real-time evaluation results
  const safeGender: Gender = patientGender === 'Male' ? 'Male' : 'Female';
  const evalResult = useMemo(() => {
    return calculateSnFhCorrections(currentStageMetrics, safeGender, standardNorm);
  }, [currentStageMetrics, safeGender, standardNorm]);

  const updateCurrentStageMetric = (key: keyof SnFhCranialBaseStageMetrics, value: any) => {
    if (!onChange) return;
    const currentStages = data?.stages || {};
    const updatedStageData: SnFhCranialBaseStageMetrics = {
      ...currentStageMetrics,
      [key]: value,
    };

    const nextData: SnFhCorrectionAnalysisData = {
      ...data,
      standardNorm,
      stages: {
        ...currentStages,
        [currentStage]: updatedStageData,
      },
    };
    onChange(nextData);
  };

  const handleAutoFetchAll = () => {
    const fetched = extractSnFhMetricsFromAnalyses(
      currentStage,
      steinersAnalysis,
      downsAnalysis,
      mcnamaraAnalysis,
      schwarzTweedAnalysis,
      cephDiscrepancyAnalysis
    );

    if (onChange) {
      const currentStages = data?.stages || {};
      onChange({
        ...data,
        standardNorm,
        stages: {
          ...currentStages,
          [currentStage]: fetched,
        },
      });
    }
  };

  const snLenNorm = patientGender === 'Male' ? DEFAULT_SN_LENGTH_MALE : DEFAULT_SN_LENGTH_FEMALE;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-6">
      {/* Header & Stage Nav */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                SN-FH Cranial Base Correction Matrix & Angular Adjustment Engine
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-100/80 text-teal-800 border border-teal-200/60">
                  Automated Biomechanics
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Corrects cranial-reference angular measurements (SNA, SNB, SN-GoGn, U1-SN) to neutralize rotational masking from steep (&gt;9°) or flat (&lt;6°) anterior cranial bases.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start lg:self-auto">
          <button
            type="button"
            onClick={handleAutoFetchAll}
            className="px-3 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            title="Auto-sync measurements from Steiner, Downs, Tweed & McNamara analyses"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sync from Tracing
          </button>
        </div>
      </div>

      {/* Stage Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 border border-slate-200/80 rounded-xl overflow-x-auto">
        {STAGES.map((st) => {
          const isActive = currentStage === st.key;
          return (
            <button
              key={st.key}
              type="button"
              onClick={() => setStage(st.key)}
              className={`flex-1 min-w-[120px] py-2 px-3 rounded-lg text-xs font-medium transition-all flex flex-col items-center justify-center ${
                isActive
                  ? 'bg-white text-slate-900 font-bold shadow-xs border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{st.label}</span>
              <span className="text-[10px] text-slate-400 font-normal">{st.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Primary Cranial Base Inputs & Delta Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Measured SN-FH Angle */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
              Measured SN-FH Angle
              <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              Norm: 7.5° (7°–8°)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              value={currentStageMetrics.snFhAngle}
              onChange={(e) => updateCurrentStageMetric('snFhAngle', e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="7.5"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-sm font-semibold text-slate-500">°</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Sella-Nasion line relative to Frankfort Horizontal.
          </p>
        </div>

        {/* 2. Live Delta & Rotation Status */}
        <div className={`border rounded-xl p-3.5 space-y-1.5 ${
          evalResult.badgeVariant === 'red'
            ? 'bg-rose-50/80 border-rose-200'
            : evalResult.badgeVariant === 'amber'
            ? 'bg-amber-50/80 border-amber-200'
            : 'bg-emerald-50/80 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Deviation Delta (Δ)</span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              evalResult.badgeVariant === 'red'
                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                : evalResult.badgeVariant === 'amber'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}>
              {evalResult.delta !== null ? `${evalResult.delta >= 0 ? '+' : ''}${evalResult.delta.toFixed(1)}°` : '0.0°'}
            </span>
          </div>
          <div className="font-bold text-sm text-slate-900">
            {evalResult.inclinationType}
          </div>
          <p className="text-[11px] text-slate-600 leading-tight">
            {evalResult.delta !== null && evalResult.delta > 1.5
              ? 'Clockwise cant. Depresses SNA/SNB and inflates SN-GoGn.'
              : evalResult.delta !== null && evalResult.delta < -1.5
              ? 'Counter-clockwise cant. Falsely inflates SNA/SNB.'
              : 'Harmonious baseline. S-N planes correlate with true horizon.'}
          </p>
        </div>

        {/* 3. S-N Length (Anterior Cranial Base) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">S-N Length (mm)</label>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              Norm: {snLenNorm} mm ({patientGender})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              value={currentStageMetrics.snLength}
              onChange={(e) => updateCurrentStageMetric('snLength', e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder={String(snLenNorm)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-sm font-semibold text-slate-500">mm</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Short S-N (&lt;68mm) exaggerates jaw prognathism.
          </p>
        </div>

        {/* 4. Saddle Angle (N-S-Ba / N-S-Ar) */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">Saddle Angle (N-S-Ba)</label>
            <span className="text-[11px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
              Norm: 130° (123°–137°)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.5"
              value={currentStageMetrics.saddleAngle}
              onChange={(e) => updateCurrentStageMetric('saddleAngle', e.target.value === '' ? '' : parseFloat(e.target.value))}
              placeholder="130.0"
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
            <span className="text-sm font-semibold text-slate-500">°</span>
          </div>
          <p className="text-[11px] text-slate-500">
            &gt;135° displaces fossa backward (Class II vector).
          </p>
        </div>
      </div>

      {/* Real-time Angular Adjustment Matrix Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-teal-600" />
            Live Angular Adjustment & Diagnostic Correction Matrix
          </h3>
          <span className="text-xs text-slate-500">
            Formulas: Corrected = Measured ± Δ (where Δ = Measured SN-FH - 7.5°)
          </span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                <th className="py-2.5 px-3.5 w-1/4">Parameter & Metric</th>
                <th className="py-2.5 px-3 text-center w-24">Measured (Raw)</th>
                <th className="py-2.5 px-3 text-center w-20">Δ Correction</th>
                <th className="py-2.5 px-3 text-center w-28 bg-teal-50/50 text-teal-900">Adjusted Value</th>
                <th className="py-2.5 px-3 text-center w-28">Standard Norm</th>
                <th className="py-2.5 px-3.5">Diagnostic Masking Impact & Inference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 bg-white font-medium">
              {evalResult.rows.map((row) => {
                const isSignificant = row.isSignificant;
                return (
                  <tr
                    key={row.key}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isSignificant ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* Parameter Name */}
                    <td className="py-2.5 px-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        {row.parameter}
                        {isSignificant && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Significant rotational discrepancy" />
                        )}
                      </div>
                    </td>

                    {/* Measured Input */}
                    <td className="py-2 px-3 text-center">
                      <input
                        type="number"
                        step="0.5"
                        value={row.measured}
                        onChange={(e) => {
                          const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                          if (row.key === 'sna') updateCurrentStageMetric('measuredSna', val);
                          if (row.key === 'snb') updateCurrentStageMetric('measuredSnb', val);
                          if (row.key === 'anb') updateCurrentStageMetric('measuredAnb', val);
                          if (row.key === 'snGoGn') updateCurrentStageMetric('measuredSnGoGn', val);
                          if (row.key === 'fma') updateCurrentStageMetric('measuredFma', val);
                          if (row.key === 'uiSn') updateCurrentStageMetric('measuredUiSn', val);
                        }}
                        placeholder="--"
                        className="w-16 text-center bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs font-bold text-slate-900 focus:bg-white focus:ring-1 focus:ring-teal-500"
                      />
                    </td>

                    {/* Delta Correction */}
                    <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                      {row.delta !== '' ? `${row.delta >= 0 ? '+' : ''}${row.delta.toFixed(1)}°` : '--'}
                    </td>

                    {/* Corrected Value */}
                    <td className="py-2.5 px-3 text-center bg-teal-50/30 font-extrabold text-teal-900 text-sm">
                      {row.corrected !== '' ? `${row.corrected.toFixed(1)}${row.unit}` : '--'}
                    </td>

                    {/* Standard Norm */}
                    <td className="py-2.5 px-3 text-center text-slate-500 text-[11px]">
                      {row.normText}
                    </td>

                    {/* Impact & Inference */}
                    <td className="py-2.5 px-3.5 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold ${
                          isSignificant ? 'text-amber-800' : 'text-slate-800'
                        }`}>
                          {row.correctedInference}
                        </span>
                        {row.measuredInference !== row.correctedInference && row.measured !== '' && (
                          <span className="text-[10px] text-slate-400 line-through">
                            ({row.measuredInference})
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 leading-tight">
                        {row.impactNote}
                      </p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clinical Inferences & Diagnostic Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-4 space-y-3.5 shadow-md">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Automated Clinical Inferences & Diagnostic Assessment
            </h4>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            Active Stage: {STAGES.find((s) => s.key === currentStage)?.label}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Masking Effects */}
          <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <div className="font-bold text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Rotational Masking Findings:
            </div>
            <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
              {evalResult.maskingEffects.map((m, idx) => (
                <li key={idx} className="leading-snug">
                  {m}
                </li>
              ))}
            </ul>
          </div>

          {/* Clinical Diagnostic Recommendation */}
          <div className="space-y-1.5 bg-slate-800/60 p-3 rounded-lg border border-slate-700">
            <div className="font-bold text-teal-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
              Clinical Diagnostic Assessment:
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {evalResult.biomechanicsRecommendation}
            </p>
          </div>
        </div>

        {/* Notes per Stage */}
        <div className="space-y-1 pt-1">
          <label className="text-[11px] font-semibold text-slate-300">
            Stage Clinical Observations / Cephalometric Notes:
          </label>
          <textarea
            value={currentStageMetrics.notes || ''}
            onChange={(e) => updateCurrentStageMetric('notes', e.target.value)}
            placeholder="Add stage notes on cranial base inclination, anatomical landmarks, or surgical/camouflage considerations..."
            rows={2}
            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:ring-1 focus:ring-teal-400 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
