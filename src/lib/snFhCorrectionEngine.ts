import {
  SnFhCorrectionAnalysisData,
  SnFhCorrectionStagesMap,
  SnFhCranialBaseStageMetrics,
  SnFhStageKey,
  Gender,
  SteinersAnalysisData,
  DownsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  CephDiscrepancyAnalysisData,
} from '../types';

export const DEFAULT_SN_FH_NORM = 7.5; // Acceptable clinical range: 7.0° - 8.0°
export const DEFAULT_SN_LENGTH_FEMALE = 71.0; // mm ± 3mm
export const DEFAULT_SN_LENGTH_MALE = 75.0; // mm ± 3mm
export const DEFAULT_SADDLE_ANGLE_NORM = 130.0; // ° (123° - 137°)

export const INITIAL_SN_FH_STAGE_METRICS: SnFhCranialBaseStageMetrics = {
  snFhAngle: '',
  snLength: '',
  saddleAngle: '',
  measuredSna: '',
  measuredSnb: '',
  measuredAnb: '',
  measuredSnGoGn: '',
  measuredFma: '',
  measuredUiSn: '',
  notes: '',
};

export const INITIAL_SN_FH_CORRECTION_DATA: SnFhCorrectionAnalysisData = {
  standardNorm: DEFAULT_SN_FH_NORM,
  stages: {
    pre: { ...INITIAL_SN_FH_STAGE_METRICS },
    mid: { ...INITIAL_SN_FH_STAGE_METRICS },
    post: { ...INITIAL_SN_FH_STAGE_METRICS },
    retention: { ...INITIAL_SN_FH_STAGE_METRICS },
  },
};

export interface ParameterAdjustmentRow {
  key: string;
  parameter: string;
  measured: number | '';
  delta: number | '';
  corrected: number | '';
  normText: string;
  unit: string;
  measuredInference: string;
  correctedInference: string;
  impactNote: string;
  isSignificant: boolean;
  status: 'normal' | 'steep_masked' | 'flat_masked' | 'concordant';
}

export interface SnFhEvaluationResult {
  delta: number | null;
  inclinationType: 'Steep (Clockwise)' | 'Flat (Counter-Clockwise)' | 'Normal (Harmonious)' | 'Unset';
  badgeVariant: 'red' | 'amber' | 'emerald' | 'slate';
  badgeLabel: string;
  snFhMeasured: number | null;
  snLengthMeasured: number | null;
  saddleAngleMeasured: number | null;
  correctedSna: number | null;
  correctedSnb: number | null;
  correctedAnb: number | null;
  correctedSnGoGn: number | null;
  correctedFma: number | null;
  correctedUiSn: number | null;
  maskingEffects: string[];
  clinicalSummary: string;
  biomechanicsRecommendation: string;
  rows: ParameterAdjustmentRow[];
}

/**
 * Calculates real-time SN-FH angular adjustment matrix and clinical inferences
 */
export function calculateSnFhCorrections(
  metrics?: Partial<SnFhCranialBaseStageMetrics>,
  gender: Gender = 'Female',
  standardNorm: number = DEFAULT_SN_FH_NORM
): SnFhEvaluationResult {
  const m = metrics || {};
  const numOrNull = (v: any): number | null => {
    if (v === '' || v === undefined || v === null || isNaN(Number(v))) return null;
    return Number(v);
  };

  const snFh = numOrNull(m.snFhAngle);
  const snLen = numOrNull(m.snLength);
  const saddle = numOrNull(m.saddleAngle);
  const sna = numOrNull(m.measuredSna);
  const snb = numOrNull(m.measuredSnb);
  const anb = numOrNull(m.measuredAnb) ?? (sna !== null && snb !== null ? Number((sna - snb).toFixed(1)) : null);
  const snGoGn = numOrNull(m.measuredSnGoGn);
  const fma = numOrNull(m.measuredFma);
  const uiSn = numOrNull(m.measuredUiSn);

  if (snFh === null) {
    return {
      delta: null,
      inclinationType: 'Unset',
      badgeVariant: 'slate',
      badgeLabel: 'SN-FH Not Input (Default 7.5° Norm)',
      snFhMeasured: null,
      snLengthMeasured: snLen,
      saddleAngleMeasured: saddle,
      correctedSna: sna,
      correctedSnb: snb,
      correctedAnb: anb,
      correctedSnGoGn: snGoGn,
      correctedFma: fma,
      correctedUiSn: uiSn,
      maskingEffects: ['Enter measured SN-FH angle to activate automated cranial base angular adjustment.'],
      clinicalSummary: 'Standard SN plane assumed aligned with Frankfort Horizontal at 7.5° norm.',
      biomechanicsRecommendation: 'Verify anterior cranial base inclination on cephalometric tracing to rule out rotational masking of apical bases.',
      rows: [],
    };
  }

  const delta = Number((snFh - standardNorm).toFixed(1));
  const isSteep = delta > 1.5; // > 9.0°
  const isFlat = delta < -1.5; // < 6.0°
  const isNormal = !isSteep && !isFlat;

  let inclinationType: 'Steep (Clockwise)' | 'Flat (Counter-Clockwise)' | 'Normal (Harmonious)' = 'Normal (Harmonious)';
  let badgeVariant: 'red' | 'amber' | 'emerald' = 'emerald';
  let badgeLabel = `Normal Cranial Base (SN-FH ${snFh.toFixed(1)}°, Δ 0.0°)`;

  if (isSteep) {
    inclinationType = 'Steep (Clockwise)';
    badgeVariant = delta > 3.5 ? 'red' : 'amber';
    badgeLabel = `Steep Cranial Base (+${delta.toFixed(1)}° CW Cant)`;
  } else if (isFlat) {
    inclinationType = 'Flat (Counter-Clockwise)';
    badgeVariant = delta < -3.5 ? 'red' : 'amber';
    badgeLabel = `Flat Cranial Base (${delta.toFixed(1)}° CCW Cant)`;
  }

  // Angular Corrections
  const correctedSna = sna !== null ? Number((sna + delta).toFixed(1)) : null;
  const correctedSnb = snb !== null ? Number((snb + delta).toFixed(1)) : null;
  const correctedAnb = anb !== null ? Number(anb.toFixed(1)) : null; // ANB is invariant to pure parallel rotation
  const correctedSnGoGn = snGoGn !== null ? Number((snGoGn - delta).toFixed(1)) : null;
  const correctedFma = fma !== null ? Number(fma.toFixed(1)) : (snGoGn !== null ? Number((snGoGn - snFh).toFixed(1)) : null);
  const correctedUiSn = uiSn !== null ? Number((uiSn + delta).toFixed(1)) : null;

  // Masking Effects & Summaries
  const maskingEffects: string[] = [];
  if (isSteep) {
    maskingEffects.push(`Clockwise cranial base tilt (SN-FH ${snFh.toFixed(1)}° > 7.5°) depresses raw SNA & SNB by ${Math.abs(delta).toFixed(1)}°.`);
    if (sna !== null && sna < 80 && correctedSna !== null && correctedSna >= 80) {
      maskingEffects.push(`Maxilla appears falsely retrognathic (Raw SNA ${sna.toFixed(1)}°); corrected SNA is ${correctedSna.toFixed(1)}° (Normal).`);
    }
    if (snb !== null && snb < 78 && correctedSnb !== null && correctedSnb >= 78) {
      maskingEffects.push(`Mandibular retrognathism is exaggerated; corrected SNB is ${correctedSnb.toFixed(1)}°.`);
    }
    if (snGoGn !== null) {
      maskingEffects.push(`Raw SN-GoGn (${snGoGn.toFixed(1)}°) is inflated by ${Math.abs(delta).toFixed(1)}°; true vertical divergence is ${correctedSnGoGn?.toFixed(1)}°.`);
    }
    if (uiSn !== null) {
      maskingEffects.push(`Raw U1-SN (${uiSn.toFixed(1)}°) appears retroclined; corrected inclination to true horizon is ${correctedUiSn?.toFixed(1)}°.`);
    }
  } else if (isFlat) {
    maskingEffects.push(`Counter-clockwise cranial base tilt (SN-FH ${snFh.toFixed(1)}° < 7.5°) inflates raw SNA & SNB by ${Math.abs(delta).toFixed(1)}°.`);
    if (sna !== null && sna > 84 && correctedSna !== null && correctedSna <= 84) {
      maskingEffects.push(`Maxilla appears falsely prognathic (Raw SNA ${sna.toFixed(1)}°); corrected SNA is ${correctedSna.toFixed(1)}° (Normal).`);
    }
    if (snb !== null && snb >= 78 && correctedSnb !== null && correctedSnb < 78) {
      maskingEffects.push(`True mandibular retrognathia is masked by flat cranial base; corrected SNB is ${correctedSnb.toFixed(1)}° (Retrognathic).`);
    }
    if (snGoGn !== null) {
      maskingEffects.push(`Raw SN-GoGn (${snGoGn.toFixed(1)}°) is falsely reduced; true vertical divergence is higher at ${correctedSnGoGn?.toFixed(1)}°.`);
    }
    if (uiSn !== null) {
      maskingEffects.push(`Raw U1-SN (${uiSn.toFixed(1)}°) appears more proclined than true FH-referenced incisor inclination.`);
    }
  } else {
    maskingEffects.push(`Harmonious cranial base orientation (SN-FH ${snFh.toFixed(1)}° ≈ 7.5°). S-N referenced measurements correlate directly with true Frankfort horizontal.`);
  }

  // Cranial Length (S-N) Inference
  const snLenNorm = gender === 'Male' ? DEFAULT_SN_LENGTH_MALE : DEFAULT_SN_LENGTH_FEMALE;
  if (snLen !== null) {
    if (snLen < snLenNorm - 3) {
      maskingEffects.push(`Short anterior cranial base length (S-N ${snLen.toFixed(1)} mm vs ${snLenNorm} mm norm) accentuates prognathic appearances.`);
    } else if (snLen > snLenNorm + 3) {
      maskingEffects.push(`Long anterior cranial base length (S-N ${snLen.toFixed(1)} mm vs ${snLenNorm} mm norm) increases retrognathic facial depth.`);
    }
  }

  // Saddle Angle (N-S-Ba / N-S-Ar) Inference
  if (saddle !== null) {
    if (saddle > 135) {
      maskingEffects.push(`Large Saddle Angle (${saddle.toFixed(1)}° > 130° norm) displaces glenoid fossa posteriorly/superiorly, compounding mandibular retrognathia (Class II vector).`);
    } else if (saddle < 123) {
      maskingEffects.push(`Small Saddle Angle (${saddle.toFixed(1)}° < 130° norm) displaces glenoid fossa anteriorly, projecting mandible forward (Class III vector).`);
    }
  }

  // Clinical Summary & Biomechanics
  let clinicalSummary = '';
  let biomechanicsRecommendation = '';

  if (isSteep) {
    clinicalSummary = `Steep Cranial Base (SN-FH ${snFh.toFixed(1)}°, Δ +${delta.toFixed(1)}°): Clockwise rotation of the S-N reference plane artificially reduces sagittal maxillary/mandibular readings and exaggerates hyperdivergence. Raw Steiner SNA/SNB values disguise the true apical base position.`;
    biomechanicsRecommendation = `Prioritize corrected angular values (Corrected SNA ${correctedSna?.toFixed(1) ?? '--'}°, Corrected SNB ${correctedSnb?.toFixed(1) ?? '--'}°) and Frankfort-based indices (FMA, Wits, A-NPerp). Avoid over-retracting maxillary incisors based purely on raw SNA.`;
  } else if (isFlat) {
    clinicalSummary = `Flat Cranial Base (SN-FH ${snFh.toFixed(1)}°, Δ ${delta.toFixed(1)}°): Counter-clockwise rotation of the S-N plane artificially elevates sagittal angles, creating pseudo-prognathism and disguising mandibular deficiency or vertical excess.`;
    biomechanicsRecommendation = `Utilize corrected SNB (${correctedSnb?.toFixed(1) ?? '--'}°) and FMA (${correctedFma?.toFixed(1) ?? '--'}°) to guide surgical vs orthognathic camouflage planning. Cross-verify with McNamara N-Perp and Wits appraisal.`;
  } else {
    clinicalSummary = `Harmonious Cranial Base (SN-FH ${snFh.toFixed(1)}°, Δ ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}°): Anatomical cranial base inclination aligns with standard norms. Conventional Steiner, Downs, and Tweed parameters provide direct, reliable clinical guidance.`;
    biomechanicsRecommendation = `Standard orthodontic biomechanical protocols apply without requiring cranial plane rotational compensation.`;
  }

  // Parameter Rows Table
  const rows: ParameterAdjustmentRow[] = [
    {
      key: 'sna',
      parameter: 'SNA Angle (Maxillary AP)',
      measured: sna !== null ? sna : '',
      delta: delta,
      corrected: correctedSna !== null ? correctedSna : '',
      normText: '82.0° (80.0° - 84.0°)',
      unit: '°',
      measuredInference: sna !== null ? (sna > 84 ? 'Maxillary Prognathism' : sna < 80 ? 'Maxillary Retrognathism' : 'Normal Maxilla') : 'Not measured',
      correctedInference: correctedSna !== null ? (correctedSna > 84 ? 'True Prognathism' : correctedSna < 80 ? 'True Retrognathism' : 'Orthognathic Maxilla') : 'Uncorrected',
      impactNote: isSteep ? `Adjusted +${delta.toFixed(1)}° (Overcomes clockwise SN depression)` : isFlat ? `Adjusted ${delta.toFixed(1)}° (Removes counter-clockwise elevation)` : 'Direct measurement valid',
      isSignificant: Math.abs(delta) >= 1.5 && sna !== null,
      status: isSteep ? 'steep_masked' : isFlat ? 'flat_masked' : 'concordant',
    },
    {
      key: 'snb',
      parameter: 'SNB Angle (Mandibular AP)',
      measured: snb !== null ? snb : '',
      delta: delta,
      corrected: correctedSnb !== null ? correctedSnb : '',
      normText: '80.0° (78.0° - 82.0°)',
      unit: '°',
      measuredInference: snb !== null ? (snb > 82 ? 'Mandibular Prognathism' : snb < 78 ? 'Mandibular Retrognathism' : 'Normal Mandible') : 'Not measured',
      correctedInference: correctedSnb !== null ? (correctedSnb > 82 ? 'True Prognathism' : correctedSnb < 78 ? 'True Retrognathism' : 'Orthognathic Mandible') : 'Uncorrected',
      impactNote: isSteep ? `Adjusted +${delta.toFixed(1)}° (Reduces false retrognathia severity)` : isFlat ? `Adjusted ${delta.toFixed(1)}° (Unmasks latent mandibular deficiency)` : 'Direct measurement valid',
      isSignificant: Math.abs(delta) >= 1.5 && snb !== null,
      status: isSteep ? 'steep_masked' : isFlat ? 'flat_masked' : 'concordant',
    },
    {
      key: 'anb',
      parameter: 'ANB Angle (Sagittal Basal Difference)',
      measured: anb !== null ? anb : '',
      delta: 0,
      corrected: correctedAnb !== null ? correctedAnb : '',
      normText: '2.0° (0.0° - 4.0°)',
      unit: '°',
      measuredInference: anb !== null ? (anb > 4 ? 'Skeletal Class II' : anb < 0 ? 'Skeletal Class III' : 'Skeletal Class I') : 'Not measured',
      correctedInference: correctedAnb !== null ? (correctedAnb > 4 ? 'Skeletal Class II' : correctedAnb < 0 ? 'Skeletal Class III' : 'Skeletal Class I') : 'Uncorrected',
      impactNote: 'Parallel shift keeps ANB constant; cross-validate with Wits appraisal',
      isSignificant: false,
      status: 'concordant',
    },
    {
      key: 'snGoGn',
      parameter: 'SN-GoGn (Mandibular Plane Angle)',
      measured: snGoGn !== null ? snGoGn : '',
      delta: -delta,
      corrected: correctedSnGoGn !== null ? correctedSnGoGn : '',
      normText: '32.0° (29.0° - 35.0°)',
      unit: '°',
      measuredInference: snGoGn !== null ? (snGoGn > 35 ? 'Hyperdivergent' : snGoGn < 29 ? 'Hypodivergent' : 'Normodivergent') : 'Not measured',
      correctedInference: correctedSnGoGn !== null ? (correctedSnGoGn > 35 ? 'True Hyperdivergent' : correctedSnGoGn < 29 ? 'True Hypodivergent' : 'True Normodivergent') : 'Uncorrected',
      impactNote: isSteep ? `Adjusted -${delta.toFixed(1)}° (Eliminates artificial steepness)` : isFlat ? `Adjusted +${Math.abs(delta).toFixed(1)}° (Corrects for flat S-N plane)` : 'Direct measurement valid',
      isSignificant: Math.abs(delta) >= 1.5 && snGoGn !== null,
      status: isSteep ? 'steep_masked' : isFlat ? 'flat_masked' : 'concordant',
    },
    {
      key: 'fma',
      parameter: 'FMA (FH to Mandibular Plane)',
      measured: fma !== null ? fma : (snGoGn !== null && snFh !== null ? Number((snGoGn - snFh).toFixed(1)) : ''),
      delta: 0,
      corrected: correctedFma !== null ? correctedFma : '',
      normText: '25.0° (22.0° - 28.0°)',
      unit: '°',
      measuredInference: correctedFma !== null ? (correctedFma > 28 ? 'High Angle / Hyperdivergent' : correctedFma < 22 ? 'Low Angle / Hypodivergent' : 'Normodivergent') : 'Not measured',
      correctedInference: correctedFma !== null ? (correctedFma > 28 ? 'High Angle' : correctedFma < 22 ? 'Low Angle' : 'Normodivergent') : 'Uncorrected',
      impactNote: 'FH-referenced baseline is naturally immune to S-N inclination artifacts',
      isSignificant: false,
      status: 'concordant',
    },
    {
      key: 'uiSn',
      parameter: 'U1-SN (Upper Incisor to SN)',
      measured: uiSn !== null ? uiSn : '',
      delta: delta,
      corrected: correctedUiSn !== null ? correctedUiSn : '',
      normText: '103.0° (100.0° - 106.0°)',
      unit: '°',
      measuredInference: uiSn !== null ? (uiSn > 106 ? 'Proclined Incisors' : uiSn < 100 ? 'Retroclined Incisors' : 'Normal Inclination') : 'Not measured',
      correctedInference: correctedUiSn !== null ? (correctedUiSn > 106 ? 'True Proclination' : correctedUiSn < 100 ? 'True Retroclination' : 'Orthognathic Incisors') : 'Uncorrected',
      impactNote: isSteep ? `Adjusted +${delta.toFixed(1)}° (Corrects for masked incisor proclination)` : isFlat ? `Adjusted ${delta.toFixed(1)}° (Corrects for exaggerated proclination)` : 'Direct measurement valid',
      isSignificant: Math.abs(delta) >= 1.5 && uiSn !== null,
      status: isSteep ? 'steep_masked' : isFlat ? 'flat_masked' : 'concordant',
    },
  ];

  return {
    delta,
    inclinationType,
    badgeVariant,
    badgeLabel,
    snFhMeasured: snFh,
    snLengthMeasured: snLen,
    saddleAngleMeasured: saddle,
    correctedSna,
    correctedSnb,
    correctedAnb,
    correctedSnGoGn,
    correctedFma,
    correctedUiSn,
    maskingEffects,
    clinicalSummary,
    biomechanicsRecommendation,
    rows,
  };
}

/**
 * Extracts and populates SN-FH correction metrics from existing patient analyses
 */
export function extractSnFhMetricsFromAnalyses(
  stage: SnFhStageKey = 'pre',
  steinersAnalysis?: SteinersAnalysisData,
  downsAnalysis?: DownsAnalysisData,
  mcnamaraAnalysis?: McnamaraAnalysisData,
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData,
  cephDiscrepancyAnalysis?: CephDiscrepancyAnalysisData
): SnFhCranialBaseStageMetrics {
  const getVal = (obj: any, key: string): number | '' => {
    if (!obj || !obj[key]) return '';
    const stVal = stage === 'retention' ? (obj[key]?.retention ?? obj[key]?.post) : (obj[key]?.[stage] ?? obj[key]);
    if (stVal === '' || stVal === undefined || stVal === null) return '';
    const num = Number(stVal);
    return isNaN(num) ? '' : num;
  };

  const getDiscVal = (key: string): number | '' => {
    if (!cephDiscrepancyAnalysis?.parameters) return '';
    const p = (cephDiscrepancyAnalysis.parameters as any)[key];
    if (!p) return '';
    const stVal = stage === 'retention' ? (p.retention ?? p.post) : (p[stage] ?? p);
    if (stVal === '' || stVal === undefined || stVal === null) return '';
    const num = Number(stVal);
    return isNaN(num) ? '' : num;
  };

  // 1. SN-FH Angle
  let snFhAngle: number | '' = '';
  if (cephDiscrepancyAnalysis) snFhAngle = getDiscVal('snOrientationAngle');
  if (snFhAngle === '' && steinersAnalysis) snFhAngle = getVal(steinersAnalysis, 'snToFh');
  if (snFhAngle === '' && downsAnalysis) snFhAngle = getVal(downsAnalysis, 'snFh');
  if (snFhAngle === '') snFhAngle = 7.5; // default norm

  // 2. S-N Length
  let snLength: number | '' = '';
  if (schwarzTweedAnalysis) snLength = getVal(schwarzTweedAnalysis, 'seNLength');
  if (snLength === '' && cephDiscrepancyAnalysis) snLength = getDiscVal('seNLength');

  // 3. Saddle Angle
  let saddleAngle: number | '' = '';
  if (cephDiscrepancyAnalysis) saddleAngle = getDiscVal('saddleAngle');

  // 4. Primary Angular Measurements
  let measuredSna: number | '' = '';
  if (steinersAnalysis) measuredSna = getVal(steinersAnalysis, 'sna');
  if (measuredSna === '' && cephDiscrepancyAnalysis) measuredSna = getDiscVal('snaAngle');

  let measuredSnb: number | '' = '';
  if (steinersAnalysis) measuredSnb = getVal(steinersAnalysis, 'snb');
  if (measuredSnb === '' && cephDiscrepancyAnalysis) measuredSnb = getDiscVal('snbAngle');

  let measuredAnb: number | '' = '';
  if (steinersAnalysis) measuredAnb = getVal(steinersAnalysis, 'anb');
  if (measuredAnb === '' && cephDiscrepancyAnalysis) measuredAnb = getDiscVal('anbAngle');

  let measuredSnGoGn: number | '' = '';
  if (steinersAnalysis) measuredSnGoGn = getVal(steinersAnalysis, 'mandibularPlaneAngle') || getVal(steinersAnalysis, 'snGoGn');

  let measuredFma: number | '' = '';
  if (schwarzTweedAnalysis) measuredFma = getVal(schwarzTweedAnalysis, 'fmpa');
  if (measuredFma === '' && downsAnalysis) measuredFma = getVal(downsAnalysis, 'mandibularPlaneAngle') || getVal(downsAnalysis, 'fma');
  if (measuredFma === '' && mcnamaraAnalysis) measuredFma = getVal(mcnamaraAnalysis, 'mandibularPlaneAngle');

  let measuredUiSn: number | '' = '';
  if (downsAnalysis) measuredUiSn = getVal(downsAnalysis, 'upperIncisalAngle') || getVal(downsAnalysis, 'u1Sn');
  if (measuredUiSn === '' && steinersAnalysis) {
    // If U1-NA is known, U1-SN ≈ U1-NA + SNA
    const u1Na = getVal(steinersAnalysis, 'upperIncisorToNaDeg');
    if (u1Na !== '' && measuredSna !== '') {
      measuredUiSn = Number((Number(u1Na) + Number(measuredSna)).toFixed(1));
    }
  }

  return {
    snFhAngle,
    snLength,
    saddleAngle,
    measuredSna,
    measuredSnb,
    measuredAnb,
    measuredSnGoGn,
    measuredFma,
    measuredUiSn,
  };
}
