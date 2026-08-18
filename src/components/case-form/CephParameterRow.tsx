import React from 'react';
import { Lock, Edit3, Info, Sparkles } from 'lucide-react';

export interface CephParameterRowProps {
  label: string;
  norm: string;
  value: number | '';
  onChange: (val: number | '') => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  inference?: {
    inference: string;
    status: 'normal' | 'abnormal' | 'empty';
  };
  category?: string;
  disabled?: boolean;
  autoFetchedSource?: string;
}

export const CephParameterRow: React.FC<CephParameterRowProps> = React.memo(({
  label,
  norm,
  value,
  onChange,
  unit = '°',
  step = 0.5,
  inference,
  category,
  disabled = false,
  autoFetchedSource,
}) => {
  const isAutoFetched = Boolean(autoFetchedSource);
  const isLocked = disabled;
  const isMeasured = value !== '';

  // Calculate rich clinical inference text & styles
  let clinicalInferenceText = 'Pending Entry';
  let statusStyle = 'bg-slate-100/90 text-slate-600 border-slate-200/90 font-medium';

  if (isMeasured) {
    if (inference && inference.inference) {
      clinicalInferenceText = inference.inference;
      if (inference.status === 'abnormal') {
        const infLower = inference.inference.toLowerCase();
        if (
          infLower.includes('prognath') ||
          infLower.includes('proclin') ||
          infLower.includes('class ii') ||
          infLower.includes('hyper') ||
          infLower.includes('increased') ||
          infLower.includes('steep')
        ) {
          statusStyle = 'bg-rose-50 text-rose-950 border-rose-200/90 font-extrabold shadow-2xs';
        } else {
          statusStyle = 'bg-amber-50 text-amber-950 border-amber-200/90 font-extrabold shadow-2xs';
        }
      } else {
        clinicalInferenceText = inference.inference || 'Normal Range';
        statusStyle = 'bg-emerald-50 text-emerald-950 border-emerald-200/90 font-extrabold shadow-2xs';
      }
    } else {
      clinicalInferenceText = 'Normal Range';
      statusStyle = 'bg-emerald-50 text-emerald-950 border-emerald-200/90 font-extrabold shadow-2xs';
    }
  }

  // Simplify category tag text if long
  const shortCategory = category
    ?.replace('Maxillary & Mandibular Apical Base Discrepancy', 'Apical Base')
    .replace('Sagittal Skeletal Relation', 'Sagittal Skeletal');

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col space-y-3 w-full box-border overflow-hidden ${
        isAutoFetched
          ? 'bg-slate-50/90 border-slate-200 opacity-95'
          : isMeasured
          ? 'bg-white border-teal-200/90 shadow-2xs hover:border-teal-300'
          : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
      }`}
    >
      {/* TIER 1: TOP ROW (Parameter Title + Category Badge + Sync Status Tag) */}
      <div className="flex items-center justify-between gap-2 flex-wrap w-full">
        <div className="min-w-0 flex-1 flex items-center gap-2 flex-wrap">
          <h5 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-snug break-words">
            {label}
          </h5>
          {shortCategory && (
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200/90 px-2 py-0.5 rounded-md shrink-0">
              {shortCategory}
            </span>
          )}
        </div>

        {/* View-Only / Sync Status Badge */}
        {isAutoFetched ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full shrink-0 shadow-2xs">
            <Sparkles className="w-2.5 h-2.5 text-teal-600 shrink-0" />
            <span>Auto-calculated ({autoFetchedSource})</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-800 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full shrink-0">
            <Edit3 className="w-2.5 h-2.5 text-teal-600 shrink-0" />
            <span>Manual Entry</span>
          </span>
        )}
      </div>

      {/* TIER 2: MIDDLE ROW (Ref Range & Measured Text Left, Direct Numeric Input Right) */}
      <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100 w-full">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 truncate">
            <Info className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>Ref: {norm}</span>
          </div>
          {isMeasured ? (
            <div className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
              Measured: <span className="text-teal-700 font-extrabold">{value}{unit}</span>
            </div>
          ) : (
            <div className="text-[11px] italic text-slate-400 mt-0.5">
              Enter value
            </div>
          )}
        </div>

        {/* Clean Direct Numeric Text Input Field */}
        <div className="w-24 sm:w-28 shrink-0">
          <input
            type="number"
            step={step}
            value={value ?? ''}
            disabled={isLocked}
            readOnly={isLocked}
            onChange={(e) => {
              if (isLocked) return;
              const v = e.target.value;
              onChange(v === '' ? '' : parseFloat(v));
            }}
            placeholder="0.0"
            className="w-full min-h-[42px] px-3 py-1.5 rounded-xl border border-teal-400 bg-white text-slate-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-xs sm:text-sm font-extrabold text-right transition-all focus:outline-none shadow-2xs"
          />
        </div>
      </div>

      {/* TIER 3: BOTTOM ROW (Full-Width Clinical Inference Banner - 100% Span, Zero Truncation) */}
      <div className="w-full pt-0.5">
        <div
          className={`w-full flex items-start gap-2 px-3 py-2 rounded-xl border text-xs leading-snug whitespace-normal break-words shadow-2xs ${statusStyle}`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-teal-600" />
          <span className="font-extrabold flex-1 leading-snug">{clinicalInferenceText}</span>
        </div>
      </div>
    </div>
  );
});

export default CephParameterRow;
