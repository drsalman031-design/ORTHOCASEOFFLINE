import React, { useMemo } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DiagnosisCardData } from '../../lib/cephDiagnosisEngine';

export interface MasterCephAiSummaryCardProps {
  analysisName: string;
  evaluatedCards: DiagnosisCardData[];
}

export interface SynthesisPoint {
  category: 'Skeletal Pattern' | 'Vertical Growth Vector' | 'Dentoalveolar Inclination' | 'Soft Tissue & Profile';
  finding: string;
  status: 'normal' | 'deviation';
}

export interface PointWiseSynthesisResult {
  headline: string;
  points: SynthesisPoint[];
  deviationCount: number;
}

/**
 * Point-Wise AI Clinical Synthesis Generator
 */
export function generatePointWiseSynthesis(
  analysisName: string,
  cards: DiagnosisCardData[]
): PointWiseSynthesisResult {
  const abnormalCards = cards.filter((c) => c.status === 'Increased' || c.status === 'Decreased');

  if (cards.length === 0) {
    return {
      headline: `${analysisName} — Point-Wise AI Diagnosis Summary`,
      points: [
        {
          category: 'Skeletal Pattern',
          finding: `No measurement values entered for ${analysisName} yet. Scroll parameter drums to auto-generate findings.`,
          status: 'normal',
        },
      ],
      deviationCount: 0,
    };
  }

  const skeletalAbnormal = abnormalCards.filter((c) => c.category === 'Skeletal');
  const dentalAbnormal = abnormalCards.filter((c) => c.category === 'Dental');
  const softTissueAbnormal = abnormalCards.filter((c) => c.category === 'Soft Tissue');
  const verticalAbnormal = abnormalCards.filter((c) => c.category === 'Vertical');

  const points: SynthesisPoint[] = [];

  // 1. Skeletal Pattern Point
  if (skeletalAbnormal.length > 0) {
    const isClass2 = skeletalAbnormal.some(
      (c) => c.status === 'Increased' && (c.parameterName.includes('ANB') || c.parameterName.includes('Convexity'))
    );
    const skDetail = skeletalAbnormal.map((c) => `${c.parameterName} ${c.status.toLowerCase()} (${c.measuredValue}${c.unit})`).join(', ');
    points.push({
      category: 'Skeletal Pattern',
      finding: isClass2
        ? `Skeletal Class II jaw discrepancy with increased AP convexity and mandibular retrognathia (${skDetail}).`
        : `Skeletal Class III jaw discrepancy with reduced AP convexity (${skDetail}).`,
      status: 'deviation',
    });
  } else {
    points.push({
      category: 'Skeletal Pattern',
      finding: 'Normative Class I skeletal jaw relationship with harmonious maxillary and mandibular alignment.',
      status: 'normal',
    });
  }

  // 2. Vertical Growth Vector Point
  if (verticalAbnormal.length > 0) {
    const vertDetail = verticalAbnormal.map((c) => `${c.parameterName} ${c.status.toLowerCase()} (${c.measuredValue}${c.unit})`).join(', ');
    const isHyper = verticalAbnormal.some((c) => c.status === 'Increased');
    points.push({
      category: 'Vertical Growth Vector',
      finding: isHyper
        ? `Hyperdivergent high mandibular plane angle pattern associated with steep occlusal plane (${vertDetail}).`
        : `Hypodivergent low mandibular plane angle pattern with deep bite tendency (${vertDetail}).`,
      status: 'deviation',
    });
  } else {
    points.push({
      category: 'Vertical Growth Vector',
      finding: 'Normodivergent vertical growth pattern with balanced facial height proportions.',
      status: 'normal',
    });
  }

  // 3. Dentoalveolar Inclination Point
  if (dentalAbnormal.length > 0) {
    const dentDetail = dentalAbnormal.map((c) => `${c.parameterName} ${c.status.toLowerCase()} (${c.measuredValue}${c.unit})`).join(', ');
    points.push({
      category: 'Dentoalveolar Inclination',
      finding: `Dentoalveolar compensation featuring ${dentDetail}.`,
      status: 'deviation',
    });
  } else {
    points.push({
      category: 'Dentoalveolar Inclination',
      finding: 'Well-positioned upper and lower incisors within normative alveolar limits.',
      status: 'normal',
    });
  }

  // 4. Soft Tissue & Profile Point
  if (softTissueAbnormal.length > 0) {
    const softDetail = softTissueAbnormal.map((c) => `${c.parameterName} ${c.status.toLowerCase()} (${c.measuredValue}${c.unit})`).join(', ');
    points.push({
      category: 'Soft Tissue & Profile',
      finding: `Altered soft tissue profile with modified lip strain and H-line inclination (${softDetail}).`,
      status: 'deviation',
    });
  } else {
    points.push({
      category: 'Soft Tissue & Profile',
      finding: 'Harmonious soft tissue facial profile and lip posture.',
      status: 'normal',
    });
  }

  return {
    headline: `${analysisName} — Point-Wise AI Diagnosis Summary`,
    points,
    deviationCount: abnormalCards.length,
  };
}

export const MasterCephAiSummaryCard: React.FC<MasterCephAiSummaryCardProps> = ({
  analysisName,
  evaluatedCards,
}) => {
  const synthesis = useMemo(
    () => generatePointWiseSynthesis(analysisName, evaluatedCards),
    [analysisName, evaluatedCards]
  );

  return (
    <div className="bg-gradient-to-br from-teal-50/90 via-white to-sky-50/80 rounded-2xl p-4 sm:p-5 border-2 border-teal-500/30 shadow-2xs space-y-3 font-sans relative overflow-hidden">
      {/* HEADER: Analysis Title + Deviation Badge */}
      <div className="flex items-center justify-between gap-3 border-b border-teal-100/90 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight truncate">
            {synthesis.headline}
          </h3>
        </div>

        {/* Status Badge */}
        <span
          className={`shrink-0 text-[10px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs ${
            synthesis.deviationCount > 0
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {synthesis.deviationCount > 0 ? (
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-600" />
              {synthesis.deviationCount} Deviations
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Normative Synthesis
            </span>
          )}
        </span>
      </div>

      {/* BODY: Point-Wise Structured Clinical Findings */}
      <div className="space-y-2 pt-1">
        {synthesis.points.map((pt, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs transition-all ${
              pt.status === 'deviation'
                ? 'bg-rose-50/70 border-rose-200/90 text-rose-950'
                : 'bg-emerald-50/70 border-emerald-200/90 text-emerald-950'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                pt.status === 'deviation' ? 'bg-rose-500' : 'bg-emerald-500'
              }`}
            />
            <div className="min-w-0 flex-1 leading-relaxed">
              <strong className="font-extrabold text-slate-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                {pt.category}:
              </strong>
              <span className="text-slate-800 font-semibold">{pt.finding}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(MasterCephAiSummaryCard);
