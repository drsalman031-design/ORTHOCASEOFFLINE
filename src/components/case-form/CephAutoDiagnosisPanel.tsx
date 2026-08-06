import React from 'react';
import { Brain, Sparkles } from 'lucide-react';
import { evaluateCephParameter, DiagnosisCardData, EvaluateParamOptions } from '../../lib/cephDiagnosisEngine';
import { MasterCephAiSummaryCard } from './MasterCephAiSummaryCard';

interface CephAutoDiagnosisPanelProps {
  analysisName: string;
  parameters: EvaluateParamOptions[];
  title?: string;
  subtitle?: string;
}

export const CephAutoDiagnosisPanel: React.FC<CephAutoDiagnosisPanelProps> = ({
  analysisName,
  parameters,
  title = `${analysisName} — AI Clinical Auto-Diagnosis`,
  subtitle = 'Automatic specialist-level orthodontic interpretations and point-wise clinical synthesis',
}) => {
  // Evaluate all parameters dynamically
  const evaluatedCards: DiagnosisCardData[] = parameters
    .map((param) => evaluateCephParameter({ ...param, analysisName: param.analysisName || analysisName }))
    .filter((card): card is DiagnosisCardData => card !== null);

  if (evaluatedCards.length === 0) {
    return (
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center space-y-1.5 my-3">
        <Brain className="w-5 h-5 text-slate-400 mx-auto" />
        <p className="text-xs font-bold text-slate-600">No Parameters Measured Yet</p>
        <p className="text-[11px] text-slate-400">
          Scroll the vertical value drums above to set measurements for {analysisName}. AI point-wise interpretations will appear automatically.
        </p>
      </div>
    );
  }

  const normalCount = evaluatedCards.filter((c) => c.status === 'Normal').length;
  const borderlineCount = evaluatedCards.filter((c) => c.status === 'Borderline').length;
  const abnormalCount = evaluatedCards.filter((c) => c.status === 'Increased' || c.status === 'Decreased').length;

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl border border-teal-200/80 shadow-xs p-3.5 sm:p-5 space-y-4 my-4 font-sans">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-teal-100 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Brain className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>{title}</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </h4>
            <p className="text-[11px] text-slate-500 font-medium leading-tight">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Status Counts Pill */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            {normalCount} Normal
          </span>
          {borderlineCount > 0 && (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
              {borderlineCount} Borderline
            </span>
          )}
          {abnormalCount > 0 && (
            <span className="text-[10px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
              {abnormalCount} Deviations
            </span>
          )}
        </div>
      </div>

      {/* MASTER UNIFIED AI CLINICAL SYNTHESIS CARD (POINT-WISE FORMAT) */}
      <MasterCephAiSummaryCard
        analysisName={analysisName}
        evaluatedCards={evaluatedCards}
      />
    </div>
  );
};

export default React.memo(CephAutoDiagnosisPanel);
