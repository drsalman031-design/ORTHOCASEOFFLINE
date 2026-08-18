import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Clock } from 'lucide-react';
import { DiagnosisCardData } from '../../lib/cephDiagnosisEngine';

interface CephDiagnosisCardProps {
  data: DiagnosisCardData;
}

export const CephDiagnosisCard: React.FC<CephDiagnosisCardProps> = ({ data }) => {
  const {
    parameterName,
    measuredValue,
    unit,
    referenceRange,
    status,
    statusColor,
    category,
  } = data;

  // Status Pill Styling
  const badgeStyles =
    statusColor === 'green'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : statusColor === 'amber'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : statusColor === 'gray'
      ? 'bg-slate-50 text-slate-600 border-slate-200'
      : 'bg-rose-50 text-rose-800 border-rose-200';

  const badgeIcon =
    statusColor === 'green' ? (
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
    ) : statusColor === 'amber' ? (
      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
    ) : statusColor === 'gray' ? (
      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
    ) : (
      <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
    );

  const displayMeasured =
    measuredValue !== null && measuredValue !== undefined
      ? `${measuredValue}${unit}`
      : 'Pending Input';

  return (
    <div
      id={`ceph-diag-card-${parameterName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
      className="bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all p-3 sm:p-3.5 font-sans flex items-center justify-between gap-3 min-h-[50px]"
    >
      {/* Left Column: Parameter Title, Category Tag, & Measured vs Ref Range */}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug tracking-tight">
            {parameterName}
          </h4>
          {category && (
            <span className="text-[9px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded uppercase tracking-wider shrink-0">
              {category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
          <span>
            Measured:{' '}
            <strong className={measuredValue !== null ? 'text-slate-900 font-bold' : 'text-slate-500 font-normal italic'}>
              {displayMeasured}
            </strong>
          </span>
          <span className="text-slate-300">•</span>
          <span>
            Ref: <strong className="text-slate-700 font-semibold">{referenceRange}</strong>
          </span>
        </div>
      </div>

      {/* Right Column: Clean Status Pill */}
      <div className="shrink-0 flex items-center">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wider ${badgeStyles}`}>
          {badgeIcon}
          <span>{status === 'PENDING_INPUT' ? 'Pending' : status}</span>
        </span>
      </div>
    </div>
  );
};

export default React.memo(CephDiagnosisCard);
