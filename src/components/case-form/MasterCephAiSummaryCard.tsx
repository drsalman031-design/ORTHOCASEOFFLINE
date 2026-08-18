import React, { useMemo } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DiagnosisCardData, deduplicateInferences } from '../../lib/cephDiagnosisEngine';

export interface MasterCephAiSummaryCardProps {
  analysisName: string;
  evaluatedCards: DiagnosisCardData[];
}

export interface SynthesisPoint {
  diagnosticKey: string;
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
 * Point-Wise AI Clinical Synthesis Generator with Deduplication and Deterministic Standards
 */
export function generatePointWiseSynthesis(
  analysisName: string,
  cards: DiagnosisCardData[]
): PointWiseSynthesisResult {
  const validCards = cards.filter((c) => c.status !== 'PENDING_INPUT' && c.measuredValue !== null);
  const abnormalCards = validCards.filter((c) => c.status === 'Increased' || c.status === 'Decreased');

  if (validCards.length === 0) {
    return {
      headline: `${analysisName} — Point-Wise AI Diagnosis Summary`,
      points: [
        {
          diagnosticKey: 'PENDING_ANALYSIS',
          category: 'Skeletal Pattern',
          finding: `Awaiting cephalometric measurements for ${analysisName}. Enter values to generate automated clinical diagnosis.`,
          status: 'normal',
        },
      ],
      deviationCount: 0,
    };
  }

  const isVerticalParam = (name: string, key?: string) => {
    const p = (name + ' ' + (key || '')).toLowerCase();
    return (
      p.includes('mandibular plane') ||
      p.includes('fma') ||
      p.includes('fmpa') ||
      p.includes('gogn') ||
      p.includes('y-axis') ||
      p.includes('yaxis') ||
      p.includes('growth axis') ||
      p.includes('facial axis') ||
      p.includes('bjork') ||
      p.includes('jarabak') ||
      p.includes('cant of occlusion') ||
      p.includes('occlusal plane') ||
      p.includes('anterior facial height') ||
      p.includes('facial height') ||
      p.includes('lafh') ||
      p.includes('ans-me')
    );
  };

  const isDentalParam = (name: string, key?: string) => {
    const p = (name + ' ' + (key || '')).toLowerCase();
    return (
      p.includes('incisor') ||
      p.includes('molar') ||
      p.includes('impa') ||
      p.includes('interincisal') ||
      p.includes('overjet') ||
      p.includes('overbite') ||
      p.includes('canine') ||
      p.includes('1 to') ||
      p.includes('u1') ||
      p.includes('l1') ||
      p.includes('fmia')
    );
  };

  const isSoftTissueParam = (name: string, key?: string) => {
    const p = (name + ' ' + (key || '')).toLowerCase();
    return (
      p.includes('lip') ||
      p.includes('nasolabial') ||
      p.includes('e-line') ||
      p.includes('e line') ||
      p.includes('s-line') ||
      p.includes('h line') ||
      p.includes('h-angle') ||
      p.includes('holdaway') ||
      p.includes('soft tissue') ||
      p.includes('profile') ||
      p.includes('merrifield') ||
      p.includes('z angle') ||
      p.includes('sulcus')
    );
  };

  // Categorize cards
  const allVerticalCards = validCards.filter(
    (c) => c.category === 'Vertical' || (!c.category?.includes('Dental') && !c.category?.includes('Soft') && isVerticalParam(c.parameterName, c.diagnosticKey))
  );

  const allDentalCards = validCards.filter(
    (c) => c.category === 'Dental' || (!isVerticalParam(c.parameterName, c.diagnosticKey) && isDentalParam(c.parameterName, c.diagnosticKey))
  );

  const allSoftTissueCards = validCards.filter(
    (c) => c.category === 'Soft Tissue' || isSoftTissueParam(c.parameterName, c.diagnosticKey)
  );

  const allSkeletalCards = validCards.filter(
    (c) =>
      (c.category === 'Skeletal' || !c.category || c.category === 'General') &&
      !allVerticalCards.includes(c) &&
      !allDentalCards.includes(c) &&
      !allSoftTissueCards.includes(c)
  );

  const verticalAbnormal = abnormalCards.filter((c) => allVerticalCards.includes(c));
  const dentalAbnormal = abnormalCards.filter((c) => allDentalCards.includes(c));
  const softTissueAbnormal = abnormalCards.filter((c) => allSoftTissueCards.includes(c));
  const skeletalAbnormal = abnormalCards.filter((c) => allSkeletalCards.includes(c));

  const rawPoints: SynthesisPoint[] = [];

  // 1. Skeletal Pattern Point
  if (allSkeletalCards.length > 0) {
    if (skeletalAbnormal.length > 0) {
      const isClass2 = skeletalAbnormal.some((c) => {
        const p = c.parameterName.toLowerCase();
        if ((p.includes('anb') || p.includes('convexity') || p.includes('wits') || p.includes('sna') || p.includes('n-a (mm)') || p.includes('na perp')) && c.status === 'Increased') {
          return true;
        }
        if ((p.includes('facial angle') || p.includes('a-b plane') || p.includes('ab plane') || p.includes('snb') || p.includes('pog') || p.includes('mandibular length')) && c.status === 'Decreased') {
          return true;
        }
        return false;
      });

      const isClass3 = skeletalAbnormal.some((c) => {
        const p = c.parameterName.toLowerCase();
        if ((p.includes('anb') || p.includes('convexity') || p.includes('wits') || p.includes('sna') || p.includes('n-a (mm)') || p.includes('na perp')) && c.status === 'Decreased') {
          return true;
        }
        if ((p.includes('facial angle') || p.includes('a-b plane') || p.includes('ab plane') || p.includes('snb') || p.includes('pog') || p.includes('mandibular length')) && c.status === 'Increased') {
          return true;
        }
        return false;
      });

      const skDetail = skeletalAbnormal.map((c) => `${c.parameterName} ${c.status.toLowerCase()} (${c.measuredValue}${c.unit})`).join(', ');

      let findingText = '';
      if (isClass2 && !isClass3) {
        findingText = `Skeletal Class II jaw discrepancy with sagittal basal mismatch and mandibular retrusion / profile convexity (${skDetail}).`;
      } else if (isClass3 && !isClass2) {
        findingText = `Skeletal Class III jaw discrepancy with forward mandibular placement / midface skeletal deficiency (${skDetail}).`;
      } else if (isClass2 && isClass3) {
        findingText = `Complex bi-directional sagittal skeletal discrepancy (${skDetail}).`;
      } else {
        findingText = `Skeletal sagittal deviation noted (${skDetail}).`;
      }

      rawPoints.push({
        diagnosticKey: 'SYNTHESIS_SKELETAL_PATTERN',
        category: 'Skeletal Pattern',
        finding: findingText,
        status: 'deviation',
      });
    } else {
      rawPoints.push({
        diagnosticKey: 'SYNTHESIS_SKELETAL_PATTERN',
        category: 'Skeletal Pattern',
        finding: 'Normative Class I skeletal jaw relationship with harmonious maxillary and mandibular sagittal alignment.',
        status: 'normal',
      });
    }
  }

  // 2. Vertical Growth Vector Point
  if (allVerticalCards.length > 0) {
    if (verticalAbnormal.length > 0) {
      const vertDetail = verticalAbnormal.map((c) => `${c.parameterName} ${c.status.toLowerCase()} (${c.measuredValue}${c.unit})`).join(', ');
      const isHyper = verticalAbnormal.some((c) => c.status === 'Increased');
      rawPoints.push({
        diagnosticKey: 'SYNTHESIS_VERTICAL_VECTOR',
        category: 'Vertical Growth Vector',
        finding: isHyper
          ? `Hyperdivergent high mandibular plane angle pattern associated with steep vertical growth vector (${vertDetail}).`
          : `Hypodivergent low mandibular plane angle pattern with horizontal growth and deep bite tendency (${vertDetail}).`,
        status: 'deviation',
      });
    } else {
      rawPoints.push({
        diagnosticKey: 'SYNTHESIS_VERTICAL_VECTOR',
        category: 'Vertical Growth Vector',
        finding: 'Normodivergent vertical growth pattern with balanced facial height proportions.',
        status: 'normal',
      });
    }
  }

  // 3. Dentoalveolar Inclination Point
  if (allDentalCards.length > 0) {
    if (dentalAbnormal.length > 0) {
      const dentDetail = dentalAbnormal.map((c) => `${c.parameterName} ${c.status.toLowerCase()} (${c.measuredValue}${c.unit})`).join(', ');
      rawPoints.push({
        diagnosticKey: 'SYNTHESIS_DENTOALVEOLAR',
        category: 'Dentoalveolar Inclination',
        finding: `Dentoalveolar compensation / incisor inclination deviation featuring ${dentDetail}.`,
        status: 'deviation',
      });
    } else {
      rawPoints.push({
        diagnosticKey: 'SYNTHESIS_DENTOALVEOLAR',
        category: 'Dentoalveolar Inclination',
        finding: 'Well-positioned upper and lower incisors within normative alveolar limits.',
        status: 'normal',
      });
    }
  }

  // 4. Soft Tissue & Profile Point
  if (allSoftTissueCards.length > 0) {
    if (softTissueAbnormal.length > 0) {
      const softDetail = softTissueAbnormal.map((c) => `${c.parameterName} ${c.status.toLowerCase()} (${c.measuredValue}${c.unit})`).join(', ');
      rawPoints.push({
        diagnosticKey: 'SYNTHESIS_SOFT_TISSUE',
        category: 'Soft Tissue & Profile',
        finding: `Altered soft tissue profile with modified lip strain and esthetic line inclination (${softDetail}).`,
        status: 'deviation',
      });
    } else {
      rawPoints.push({
        diagnosticKey: 'SYNTHESIS_SOFT_TISSUE',
        category: 'Soft Tissue & Profile',
        finding: 'Harmonious soft tissue facial profile and lip posture.',
        status: 'normal',
      });
    }
  }

  // Strict deduplication pass
  const points = deduplicateInferences(rawPoints);

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
    <div
      id={`master-ceph-summary-${analysisName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
      className="bg-gradient-to-br from-teal-50/90 via-white to-sky-50/80 rounded-2xl p-4 sm:p-5 border-2 border-teal-500/30 shadow-2xs space-y-3 font-sans relative overflow-hidden"
    >
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
            key={pt.diagnosticKey || idx}
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
