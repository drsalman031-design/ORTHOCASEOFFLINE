import React, { useState, useMemo } from 'react';
import {
  Brain,
  Sparkles,
  Copy,
  Check,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Gender,
  SteinersAnalysisData,
  DownsAnalysisData,
  SchwarzTweedAnalysisData,
  McnamaraAnalysisData,
  RickettsAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CogsSoftTissueAnalysisData,
  CephDiscrepancyAnalysisData,
} from '../../types';
import { StageData } from './ComprehensiveCephAnalysis';
import { sanitizeNumericValue } from '../../lib/cephDiagnosisEngine';

interface MasterCephDiagnosisEngineProps {
  activeData: StageData;
  activeStage?: 'pre' | 'mid' | 'post';
  patientGender?: Gender | string;
  patientAge?: number | string;
  steinersAnalysis?: SteinersAnalysisData;
  downsAnalysis?: DownsAnalysisData;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  mcnamaraAnalysis?: McnamaraAnalysisData;
  rickettsAnalysis?: RickettsAnalysisData;
  holdawayAnalysis?: HoldawayAnalysisData;
  cogsAnalysis?: CogsAnalysisData;
  cogsSoftTissueAnalysis?: CogsSoftTissueAnalysisData;
  cephDiscrepancyAnalysis?: CephDiscrepancyAnalysisData;
  isOpen?: boolean;
  onToggle?: () => void;
}

const getVal = (val: number | string | '' | null | undefined): number | null => {
  return sanitizeNumericValue(val);
};

export const MasterCephDiagnosisEngine: React.FC<MasterCephDiagnosisEngineProps> = ({
  activeData,
  activeStage = 'pre',
  patientGender = 'Male',
  patientAge = 12,
  steinersAnalysis,
  downsAnalysis,
  schwarzTweedAnalysis,
  mcnamaraAnalysis,
  rickettsAnalysis,
  holdawayAnalysis,
  cogsAnalysis,
  cogsSoftTissueAnalysis,
  cephDiscrepancyAnalysis,
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onToggle = externalOnToggle || (() => setInternalIsOpen((v) => !v));

  const [copied, setCopied] = useState(false);

  // Stage string helper
  const stageKey = activeStage === 'pre' ? 'pre' : activeStage === 'mid' ? 'mid' : 'post';

  // Gather values across all completed analyses using sanitized numeric helpers
  const anbVal =
    getVal(steinersAnalysis?.parameters?.anb?.[stageKey]) ??
    getVal(cephDiscrepancyAnalysis?.parameters?.anbAngle?.[stageKey]);

  const snaVal =
    getVal(steinersAnalysis?.parameters?.sna?.[stageKey]) ??
    getVal(cephDiscrepancyAnalysis?.parameters?.snaAngle?.[stageKey]);

  const snbVal =
    getVal(steinersAnalysis?.parameters?.snb?.[stageKey]) ??
    getVal(cephDiscrepancyAnalysis?.parameters?.snbAngle?.[stageKey]);

  const witsVal = getVal(cephDiscrepancyAnalysis?.parameters?.witsAoBo?.[stageKey]);

  const fmaVal =
    getVal(activeData.fma) ??
    getVal(schwarzTweedAnalysis?.parameters?.fmpa?.[stageKey]) ??
    getVal(mcnamaraAnalysis?.parameters?.mandibularPlaneAngle?.[stageKey]);

  const snGoGnVal = getVal(activeData.sn_go_gn);
  const bjorkVal = getVal(activeData.bjork_sum);
  const jarabakVal = getVal(activeData.jarabak_ratio);
  const saddleVal = getVal(activeData.saddle_angle);

  const uiSnVal = getVal(activeData.ui_sn);
  const uiNaDegVal =
    getVal(activeData.ui_na_deg) ??
    getVal(steinersAnalysis?.parameters?.upperIncisorToNaDeg?.[stageKey]);
  const uiNaMmVal =
    getVal(activeData.ui_na_mm) ??
    getVal(steinersAnalysis?.parameters?.upperIncisorToNaMm?.[stageKey]);

  const impaVal =
    getVal(activeData.li_mp) ??
    getVal(schwarzTweedAnalysis?.parameters?.impa?.[stageKey]) ??
    getVal(downsAnalysis?.parameters?.impa?.[stageKey]);

  const liNbDegVal = getVal(steinersAnalysis?.parameters?.lowerIncisorToNbDeg?.[stageKey]);
  const liNbMmVal =
    getVal(activeData.li_nb_mm) ??
    getVal(steinersAnalysis?.parameters?.lowerIncisorToNbMm?.[stageKey]);

  const interincisalVal =
    getVal(steinersAnalysis?.parameters?.interincisalAngle?.[stageKey]) ??
    getVal(downsAnalysis?.parameters?.interincisalAngle?.[stageKey]);

  const nlaVal =
    getVal(activeData.nasolabial_angle) ??
    getVal(mcnamaraAnalysis?.parameters?.nasolabialAngle?.[stageKey]);

  const naMmVal =
    getVal(activeData.n_a_mm) ??
    getVal(mcnamaraAnalysis?.parameters?.naPerpToPointA?.[stageKey]);

  const pogNaPerpVal = getVal(mcnamaraAnalysis?.parameters?.pogNaPerp?.[stageKey]);

  const yaxisVal =
    getVal(activeData.yaxis_ns_gn) ??
    getVal(downsAnalysis?.parameters?.yAxis?.[stageKey]);

  const angleConvexityVal = getVal(downsAnalysis?.parameters?.angleConvexity?.[stageKey]);
  const abPlaneVal = getVal(downsAnalysis?.parameters?.abPlane?.[stageKey]);
  const facialAngleVal = getVal(downsAnalysis?.parameters?.facialAngle?.[stageKey]);

  // Dynamic Evidence Synthesis Engine with Strict Statistical Bounds
  const synthesis = useMemo(() => {
    const isMale = String(patientGender).toLowerCase() === 'male';

    // 1. Skeletal Sagittal Relationship
    // Strict Norms: ANB Normal: 2° (0° to 4°). >4°: Class II, <0°: Class III.
    // Wits Normal: Male -1mm (±2mm: -3 to +1mm), Female 0mm (±2mm: -2 to +2mm).
    let skClass: 'I' | 'II' | 'III' = 'I';
    let skSeverity = '';
    let skEtiology = '';

    if (anbVal !== null) {
      if (anbVal > 4.0) {
        skClass = 'II';
        skSeverity = anbVal > 7.0 ? 'Severe' : anbVal > 5.5 ? 'Moderate' : 'Mild';
      } else if (anbVal < 0.0) {
        skClass = 'III';
        skSeverity = anbVal < -4.0 ? 'Severe' : 'Moderate';
      } else {
        skClass = 'I';
      }
    } else if (witsVal !== null) {
      const witsMaxNorm = isMale ? 1.0 : 2.0;
      const witsMinNorm = isMale ? -3.0 : -2.0;
      if (witsVal > witsMaxNorm) {
        skClass = 'II';
        skSeverity = witsVal > witsMaxNorm + 4 ? 'Severe' : 'Moderate';
      } else if (witsVal < witsMinNorm) {
        skClass = 'III';
        skSeverity = witsVal < witsMinNorm - 3 ? 'Severe' : 'Moderate';
      } else {
        skClass = 'I';
      }
    } else if (angleConvexityVal !== null || abPlaneVal !== null || facialAngleVal !== null) {
      if (
        (angleConvexityVal !== null && angleConvexityVal > 5.0) ||
        (abPlaneVal !== null && abPlaneVal < -8.5) ||
        (facialAngleVal !== null && facialAngleVal < 84.0)
      ) {
        skClass = 'II';
        skSeverity =
          (angleConvexityVal !== null && angleConvexityVal > 10.0) ||
          (abPlaneVal !== null && abPlaneVal < -11.0) ||
          (facialAngleVal !== null && facialAngleVal < 80.0)
            ? 'Moderate to Severe'
            : 'Mild';
      } else if (
        (angleConvexityVal !== null && angleConvexityVal < -5.0) ||
        (abPlaneVal !== null && abPlaneVal > 0.0) ||
        (facialAngleVal !== null && facialAngleVal > 91.5)
      ) {
        skClass = 'III';
        skSeverity =
          (angleConvexityVal !== null && angleConvexityVal < -9.0) ||
          (abPlaneVal !== null && abPlaneVal > 3.0) ||
          (facialAngleVal !== null && facialAngleVal > 95.0)
            ? 'Moderate to Severe'
            : 'Mild';
      } else {
        skClass = 'I';
      }
    } else if (naMmVal !== null && naMmVal > 1.0) {
      skClass = 'II';
      skSeverity = 'Mild to Moderate';
    }

    if (skClass === 'II') {
      const maxPro =
        (snaVal !== null && snaVal > 84.0) ||
        (naMmVal !== null && naMmVal > 1.0) ||
        (angleConvexityVal !== null && angleConvexityVal > 5.0);
      const mandRet =
        (snbVal !== null && snbVal < 78.0) ||
        (pogNaPerpVal !== null && pogNaPerpVal < -2.0) ||
        (facialAngleVal !== null && facialAngleVal < 84.0) ||
        (abPlaneVal !== null && abPlaneVal < -8.5);
      if (maxPro && mandRet) {
        skEtiology = 'primarily due to combined maxillary protrusion/convexity and mandibular retrognathism.';
      } else if (maxPro) {
        skEtiology = 'primarily due to maxillary prognathism and increased facial profile convexity.';
      } else {
        skEtiology = 'primarily due to mandibular retrognathism.';
      }
    } else if (skClass === 'III') {
      const mandPro =
        (snbVal !== null && snbVal > 82.0) ||
        (pogNaPerpVal !== null && pogNaPerpVal > 4.0) ||
        (facialAngleVal !== null && facialAngleVal > 91.5) ||
        (abPlaneVal !== null && abPlaneVal > 0.0);
      const maxDef =
        (snaVal !== null && snaVal < 80.0) ||
        (naMmVal !== null && naMmVal < 0.0) ||
        (angleConvexityVal !== null && angleConvexityVal < -5.0);
      if (mandPro && maxDef) {
        skEtiology = 'due to combined maxillary skeletal deficiency and mandibular prognathism.';
      } else if (maxDef) {
        skEtiology = 'primarily due to maxillary skeletal deficiency.';
      } else {
        skEtiology = 'primarily due to mandibular prognathism.';
      }
    } else {
      skEtiology = 'with balanced sagittal jaw relationship.';
    }

    const skeletalRelationshipText = `• Skeletal Class ${skClass} malocclusion${skSeverity ? ` (${skSeverity.toLowerCase()})` : ''} ${skEtiology}`;

    // 2. Maxillary Diagnosis (Norm: SNA 82° ±2° / 80°–84°)
    let maxDiagnosisText = '• Maxilla is normally positioned in the sagittal plane.';
    if ((snaVal !== null && snaVal > 84.0) || (naMmVal !== null && naMmVal > 1.0)) {
      maxDiagnosisText = `• Maxillary prognathism with anterior sagittal positioning${snaVal !== null ? ` (SNA: ${snaVal}° > 84°)` : ''}.`;
    } else if ((snaVal !== null && snaVal < 80.0) || (naMmVal !== null && naMmVal < 0.0)) {
      maxDiagnosisText = `• Maxillary skeletal deficiency with retrusive sagittal position${snaVal !== null ? ` (SNA: ${snaVal}° < 80°)` : ''}.`;
    }

    // 3. Mandibular Diagnosis (Norm: SNB 80° ±2° / 78°–82°)
    let mandDiagnosisText = '• Mandible is normally positioned in the sagittal plane.';
    const isHighAngle =
      (fmaVal !== null && fmaVal > 28.0) ||
      (snGoGnVal !== null && snGoGnVal > 35.0) ||
      (bjorkVal !== null && bjorkVal > 402.0);
    const isLowAngle =
      (fmaVal !== null && fmaVal < 22.0) ||
      (snGoGnVal !== null && snGoGnVal < 29.0) ||
      (bjorkVal !== null && bjorkVal < 390.0);

    if ((snbVal !== null && snbVal < 78.0) || (pogNaPerpVal !== null && pogNaPerpVal < -2.0)) {
      mandDiagnosisText = `• Retrognathic mandible with reduced effective length${snbVal !== null ? ` (SNB: ${snbVal}° < 78°)` : ''}${isHighAngle ? ' and clockwise rotation' : isLowAngle ? ' and counter-clockwise rotation' : ''}.`;
    } else if ((snbVal !== null && snbVal > 82.0) || (pogNaPerpVal !== null && pogNaPerpVal > 4.0)) {
      mandDiagnosisText = `• Prognathic mandible with increased effective length${snbVal !== null ? ` (SNB: ${snbVal}° > 82°)` : ''}${isHighAngle ? ' and clockwise rotation' : ''}.`;
    } else if (isHighAngle) {
      mandDiagnosisText = '• Mandibular body exhibits clockwise rotation relative to cranial base.';
    }

    // 4. Vertical Skeletal Pattern (FMA Norm: 25° ±3° / 22°–28°)
    let verticalPatternText = '• Normodivergent facial pattern with balanced vertical facial proportions.';
    if (isHighAngle || (jarabakVal !== null && jarabakVal < 62.0)) {
      verticalPatternText = '• Hyperdivergent facial pattern with increased lower anterior facial height and steep mandibular plane.';
    } else if (isLowAngle || (jarabakVal !== null && jarabakVal > 65.0)) {
      verticalPatternText = '• Hypodivergent facial pattern with reduced lower anterior facial height and horizontal mandibular plane.';
    }

    // 5. Cranial Base (Saddle Norm: 123° ±5°)
    let cranialBaseText = '• Cranial base morphology and flexure are within normal limits.';
    if (saddleVal !== null) {
      if (saddleVal > 128.0) {
        cranialBaseText = '• Increased cranial base flexure (obtuse saddle angle) contributing to sagittal mandibular retrognathism.';
      } else if (saddleVal < 118.0) {
        cranialBaseText = '• Decreased cranial base flexure contributing to forward mandibular positioning.';
      }
    }

    // 6. Maxillary Incisors (U1-NA Norm: 22° / 4mm)
    let maxIncisorsText = '• Upper incisors exhibit normal inclination and sagittal position.';
    if ((uiSnVal !== null && uiSnVal > 106.0) || (uiNaDegVal !== null && uiNaDegVal > 24.0) || (uiNaMmVal !== null && uiNaMmVal > 5.0)) {
      maxIncisorsText = '• Upper incisors are proclined and dentoalveolarly protrusive.';
    } else if ((uiSnVal !== null && uiSnVal < 98.0) || (uiNaDegVal !== null && uiNaDegVal < 20.0) || (uiNaMmVal !== null && uiNaMmVal < 3.0)) {
      maxIncisorsText = '• Upper incisors are retroclined and dentoalveolarly retrusive.';
    }

    // 7. Mandibular Incisors (IMPA Norm: 90° ±5° / 85°–95°, L1-NB: 25° / 4mm)
    let mandIncisorsText = '• Lower incisors are well-positioned within the mandibular basal bone.';
    if ((impaVal !== null && impaVal > 95.0) || (liNbDegVal !== null && liNbDegVal > 27.0) || (liNbMmVal !== null && liNbMmVal > 5.0)) {
      mandIncisorsText = `• Lower incisors are proclined and labially tipped${impaVal !== null ? ` (IMPA: ${impaVal}° > 95°)` : ''}.`;
    } else if ((impaVal !== null && impaVal < 85.0) || (liNbDegVal !== null && liNbDegVal < 23.0) || (liNbMmVal !== null && liNbMmVal < 3.0)) {
      mandIncisorsText = `• Lower incisors are retroclined${impaVal !== null ? ` (IMPA: ${impaVal}° < 85°)` : ''}.`;
    }

    // 8. Interincisal Relationship (Norm: 130°–135°)
    let interincisalText = '• Normal interincisal angular relationship.';
    if (interincisalVal !== null) {
      if (interincisalVal < 125.0) {
        interincisalText = `• Reduced interincisal angle (${interincisalVal}° < 125°) indicating bimaxillary incisor proclination.`;
      } else if (interincisalVal > 138.0) {
        interincisalText = `• Increased interincisal angle (${interincisalVal}° > 138°) associated with upright or retroclined incisors.`;
      }
    } else if (
      ((uiSnVal !== null && uiSnVal > 106.0) || (uiNaDegVal !== null && uiNaDegVal > 24.0)) &&
      (impaVal !== null && impaVal > 95.0)
    ) {
      interincisalText = '• Reduced interincisal angle indicating bimaxillary incisor proclination.';
    }

    // 9. Dentoalveolar Compensation
    let compensationText = '• No significant dentoalveolar compensation detected.';
    if (skClass === 'II' && ((impaVal !== null && impaVal > 95.0) || (liNbMmVal !== null && liNbMmVal > 4.5))) {
      compensationText = '• Lower incisors are proclined to compensate for underlying mandibular deficiency.';
    } else if (skClass === 'III' && ((uiSnVal !== null && uiSnVal > 104.0) || (impaVal !== null && impaVal < 85.0))) {
      compensationText = '• Upper incisors are proclined and lower incisors retroclined to camouflage underlying Skeletal Class III discrepancy.';
    }

    // 10. Soft Tissue Profile (Nasolabial Angle Norm: 102° ±8° / 94°–110°)
    let softTissueText = '• Mildly convex soft tissue profile with balanced nasolabial angle and lip posture.';
    if (nlaVal !== null) {
      if (nlaVal > 110.0) {
        softTissueText = `• Convex soft tissue profile with an obtuse nasolabial angle (${nlaVal}° > 110°) and retrusive upper lip support.`;
      } else if (nlaVal < 94.0) {
        softTissueText = `• Convex soft tissue profile with an acute nasolabial angle (${nlaVal}° < 94°) and upper lip protrusion.`;
      }
    }

    // 11. Growth Pattern
    let growthPatternText = '• Balanced growth pattern with favorable vector.';
    if (isHighAngle || (yaxisVal !== null && yaxisVal > 66.0)) {
      growthPatternText = '• Vertical growth pattern with clockwise mandibular rotation tendency.';
    } else if (isLowAngle || (yaxisVal !== null && yaxisVal < 53.0)) {
      growthPatternText = '• Horizontal growth pattern with counter-clockwise mandibular rotation tendency.';
    }

    // 12. AI Diagnostic Correlation
    const correlationText = `• Overall cephalometric findings indicate a Skeletal Class ${skClass} malocclusion${skEtiology ? ` ${skEtiology.replace('primarily due to', 'primarily due to').replace('.', '')}` : ''} associated with a ${isHighAngle ? 'hyperdivergent' : isLowAngle ? 'hypodivergent' : 'normodivergent'} growth pattern and ${compensationText.includes('proclined') ? 'lower incisor dentoalveolar compensation' : 'minimal dentoalveolar compensation'}. The maxilla is ${maxDiagnosisText.includes('prognathism') ? 'mildly prognathic' : maxDiagnosisText.includes('deficiency') ? 'skeletally deficient' : 'normally positioned'}, while the soft tissue profile is ${softTissueText.includes('obtuse') ? 'convex with an obtuse nasolabial angle' : softTissueText.includes('acute') ? 'convex with upper lip protrusion' : 'mildly convex'}.`;

    // 13. AI Clinical Alerts (Deduplicated)
    const rawAlerts: string[] = [];
    if ((snbVal !== null && snbVal < 76.0) || (skClass === 'II' && skSeverity === 'Severe')) {
      rawAlerts.push('⚠ Severe mandibular deficiency.');
    }
    if ((impaVal !== null && impaVal > 95.0) || compensationText.includes('proclined to compensate')) {
      rawAlerts.push('⚠ Significant lower incisor proclination / compensation.');
    }
    if (isHighAngle) {
      rawAlerts.push('⚠ Hyperdivergent skeletal pattern (vertical anchorage control indicated).');
    }
    if (interincisalText.includes('Reduced interincisal')) {
      rawAlerts.push('⚠ Reduced interincisal angle / bimaxillary proclination.');
    }
    if (nlaVal !== null && nlaVal > 110.0) {
      rawAlerts.push('⚠ Obtuse nasolabial angle (cautious upper incisor retraction).');
    }

    const uniqueAlerts = Array.from(new Set(rawAlerts));
    if (uniqueAlerts.length === 0) {
      uniqueAlerts.push('• No significant cephalometric risk indicators identified.');
    }

    return {
      skeletalRelationshipText,
      maxDiagnosisText,
      mandDiagnosisText,
      verticalPatternText,
      cranialBaseText,
      maxIncisorsText,
      mandIncisorsText,
      interincisalText,
      compensationText,
      softTissueText,
      growthPatternText,
      correlationText,
      alerts: uniqueAlerts,
    };
  }, [
    anbVal,
    snaVal,
    snbVal,
    witsVal,
    fmaVal,
    snGoGnVal,
    bjorkVal,
    jarabakVal,
    saddleVal,
    uiSnVal,
    uiNaDegVal,
    uiNaMmVal,
    impaVal,
    liNbDegVal,
    liNbMmVal,
    interincisalVal,
    nlaVal,
    naMmVal,
    pogNaPerpVal,
    yaxisVal,
    angleConvexityVal,
    abPlaneVal,
    facialAngleVal,
    patientGender,
  ]);

  const copyFullDiagnosis = () => {
    const text = `# ORTHOCASE 3.0 — MASTER AI CEPHALOMETRIC DIAGNOSIS ENGINE

## 🧠 AI CEPHALOMETRIC DIAGNOSIS

### Skeletal Relationship
${synthesis.skeletalRelationshipText}

### Maxillary Diagnosis
${synthesis.maxDiagnosisText}

### Mandibular Diagnosis
${synthesis.mandDiagnosisText}

### Vertical Skeletal Pattern
${synthesis.verticalPatternText}

### Cranial Base
${synthesis.cranialBaseText}

### Maxillary Incisors
${synthesis.maxIncisorsText}

### Mandibular Incisors
${synthesis.mandIncisorsText}

### Interincisal Relationship
${synthesis.interincisalText}

### Dentoalveolar Compensation
${synthesis.compensationText}

### Soft Tissue Profile
${synthesis.softTissueText}

### Growth Pattern
${synthesis.growthPatternText}

### AI Diagnostic Correlation
${synthesis.correlationText}

### AI Clinical Alerts
${synthesis.alerts.join('\n')}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      id="master-ceph-diagnosis-engine-panel"
      className="w-full bg-white rounded-2xl border-2 border-indigo-200 shadow-md overflow-hidden transition-all my-4"
    >
      {/* HEADER BAR */}
      <div
        onClick={onToggle}
        className="w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:opacity-95 transition-all"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600/30 text-indigo-300 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
            <Brain className="w-5 h-5 text-indigo-300 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm md:text-base font-black text-white truncate tracking-wide flex items-center gap-2">
              <span>ORTHOCASE 3.0 — MASTER AI CEPHALOMETRIC DIAGNOSIS ENGINE</span>
              <span className="text-[9px] bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 hidden sm:inline-block">
                AI Consultant
              </span>
            </h3>
            <p className="text-[11px] text-indigo-200/80 truncate font-medium">
              Consensus Synthesis Engine across all active cephalometric analyses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              copyFullDiagnosis();
            }}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-600/50 hover:bg-indigo-600 text-white text-xs font-bold border border-indigo-400/40 transition-all cursor-pointer"
            title="Copy Full AI Diagnosis"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Toggle AI Engine"
          >
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ENGINE BODY */}
      {isOpen && (
        <div className="p-3.5 sm:p-5 bg-slate-50/70 space-y-4">
          {/* TOP BANNER */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 p-3 bg-white border border-indigo-100 rounded-xl shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
                🧠 AI CEPHALOMETRIC DIAGNOSIS
              </h4>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500 font-semibold">
                Evaluation Stage: <strong className="text-indigo-700 capitalize">{activeStage}</strong>
              </span>
              <button
                type="button"
                onClick={copyFullDiagnosis}
                className="sm:hidden flex items-center gap-1 px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Diagnosis'}</span>
              </button>
            </div>
          </div>

          {/* DIAGNOSIS SECTIONS LIST */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* 1. Skeletal Relationship */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Skeletal Relationship
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.skeletalRelationshipText}</p>
            </div>

            {/* 2. Maxillary Diagnosis */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Maxillary Diagnosis
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.maxDiagnosisText}</p>
            </div>

            {/* 3. Mandibular Diagnosis */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Mandibular Diagnosis
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.mandDiagnosisText}</p>
            </div>

            {/* 4. Vertical Skeletal Pattern */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Vertical Skeletal Pattern
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.verticalPatternText}</p>
            </div>

            {/* 5. Cranial Base */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Cranial Base
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.cranialBaseText}</p>
            </div>

            {/* 6. Maxillary Incisors */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Maxillary Incisors
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.maxIncisorsText}</p>
            </div>

            {/* 7. Mandibular Incisors */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Mandibular Incisors
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.mandIncisorsText}</p>
            </div>

            {/* 8. Interincisal Relationship */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Interincisal Relationship
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.interincisalText}</p>
            </div>

            {/* 9. Dentoalveolar Compensation */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Dentoalveolar Compensation
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.compensationText}</p>
            </div>

            {/* 10. Soft Tissue Profile */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Soft Tissue Profile
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.softTissueText}</p>
            </div>

            {/* 11. Growth Pattern */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1 md:col-span-2 hover:border-indigo-200 transition-colors">
              <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider block">
                Growth Pattern
              </span>
              <p className="text-slate-800 font-medium leading-snug">{synthesis.growthPatternText}</p>
            </div>
          </div>

          {/* 12. AI CLINICAL ALERTS */}
          {synthesis.alerts.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                  AI Clinical Alerts
                </span>
              </div>
              <div className="space-y-1 pl-1">
                {synthesis.alerts.map((alert, idx) => (
                  <div key={idx} className="text-xs font-bold text-amber-950 flex items-start gap-1.5">
                    <span>{alert}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(MasterCephDiagnosisEngine);
