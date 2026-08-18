import React, { useState, useEffect, useMemo } from 'react';
import {
  DownsParameterKey,
  DownsParametersMap,
  DownsAnalysisData,
} from '../../types';
import { CephParameterRow } from './CephParameterRow';
import { CephAutoDiagnosisPanel } from './CephAutoDiagnosisPanel';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface ParameterMeta {
  key: DownsParameterKey;
  label: string;
  category: 'Skeletal' | 'Dental';
  normalText: string;
  unit: string;
  minNormal: number;
  maxNormal: number;
  minRange?: number;
  maxRange?: number;
  step?: number;
  evaluateInference: (val: number) => {
    inference: string;
    status: 'normal' | 'abnormal';
  };
}

export const DOWNS_PARAMETERS_META: ParameterMeta[] = [
  // Skeletal Parameters
  {
    key: 'facialAngle',
    label: 'Facial Angle (FH to N-Pog)',
    category: 'Skeletal',
    normalText: '87.8° (84.0° to 91.5°)',
    unit: '°',
    minNormal: 84.0,
    maxNormal: 91.5,
    minRange: 50,
    maxRange: 120,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val < 84.0) return { inference: 'Retrognathic Mandible / Mandibular Retrusion (Class II tendency)', status: 'abnormal' };
      if (val > 91.5) return { inference: 'Prognathic Mandible / Mandibular Prominence (Class III tendency)', status: 'abnormal' };
      return { inference: 'Orthognathic Mandible (Class I Normal)', status: 'normal' };
    },
  },
  {
    key: 'angleConvexity',
    label: 'Angle of Convexity (N-A-Pog)',
    category: 'Skeletal',
    normalText: '0.0° (-5.0° to +5.0°)',
    unit: '°',
    minNormal: -5.0,
    maxNormal: 5.0,
    minRange: -30,
    maxRange: 40,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 5.0) return { inference: 'Convex Facial Profile (Skeletal Class II / Maxillary Prominence)', status: 'abnormal' };
      if (val < -5.0) return { inference: 'Concave Facial Profile (Skeletal Class III / Mandibular Prominence)', status: 'abnormal' };
      return { inference: 'Straight Facial Profile (Class I Normal)', status: 'normal' };
    },
  },
  {
    key: 'abPlane',
    label: 'A-B Plane Angle (to N-Pog)',
    category: 'Skeletal',
    normalText: '-4.6° (-8.5° to 0.0°)',
    unit: '°',
    minNormal: -8.5,
    maxNormal: 0.0,
    minRange: -25,
    maxRange: 15,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val < -8.5) return { inference: 'Class II Skeletal Discrepancy (Mandibular Retrusion relative to Maxilla)', status: 'abnormal' };
      if (val > 0.0) return { inference: 'Class III Skeletal Discrepancy (Mandibular Protrusion relative to Maxilla)', status: 'abnormal' };
      return { inference: 'Class I Skeletal Relationship (Normal)', status: 'normal' };
    },
  },
  {
    key: 'mandibularPlaneAngle',
    label: 'Mandibular Plane Angle (MP to FH)',
    category: 'Skeletal',
    normalText: '21.9° (17.0° to 26.0°)',
    unit: '°',
    minNormal: 17.0,
    maxNormal: 26.0,
    minRange: 5,
    maxRange: 55,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 26.0) return { inference: 'Hyperdivergent Pattern (High Angle / Steep Mandibular Plane)', status: 'abnormal' };
      if (val < 17.0) return { inference: 'Hypodivergent Pattern (Low Angle / Flat Mandibular Plane)', status: 'abnormal' };
      return { inference: 'Normodivergent Vertical Pattern (Normal)', status: 'normal' };
    },
  },
  {
    key: 'yAxis',
    label: 'Y-Axis / Growth Axis (SGn to FH)',
    category: 'Skeletal',
    normalText: '59.4° (55.0° to 64.0°)',
    unit: '°',
    minNormal: 55.0,
    maxNormal: 64.0,
    minRange: 35,
    maxRange: 85,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 64.0) return { inference: 'Vertical Mandibular Growth Vector (Downward & Backward Rotation)', status: 'abnormal' };
      if (val < 55.0) return { inference: 'Horizontal Mandibular Growth Vector (Forward Rotation / Deep Bite)', status: 'abnormal' };
      return { inference: 'Normal Balanced Growth Vector', status: 'normal' };
    },
  },

  // Dental Parameters
  {
    key: 'cantOfOcclusion',
    label: 'Cant of Occlusal Plane (OP to FH)',
    category: 'Dental',
    normalText: '9.3° (5.5° to 13.5°)',
    unit: '°',
    minNormal: 5.5,
    maxNormal: 13.5,
    minRange: -10,
    maxRange: 30,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 13.5) return { inference: 'Steep Occlusal Plane (Class II / Open Bite Tendency)', status: 'abnormal' };
      if (val < 5.5) return { inference: 'Flat Occlusal Plane (Class III / Deep Bite Tendency)', status: 'abnormal' };
      return { inference: 'Normal Occlusal Plane Slope', status: 'normal' };
    },
  },
  {
    key: 'lowerIncisorToOcclusal',
    label: 'Lower Incisors to Occlusal Plane',
    category: 'Dental',
    normalText: '14.5° (11.0° to 18.0°)',
    unit: '°',
    minNormal: 11.0,
    maxNormal: 18.0,
    minRange: -10,
    maxRange: 40,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 18.0) return { inference: 'Proclined Lower Incisors (Protrusion)', status: 'abnormal' };
      if (val < 11.0) return { inference: 'Retroclined Lower Incisors (Upright)', status: 'abnormal' };
      return { inference: 'Normal Lower Incisor Inclination', status: 'normal' };
    },
  },
  {
    key: 'impa',
    label: 'Lower Incisors to Mandibular Plane (IMPA)',
    category: 'Dental',
    normalText: '90.0° (85.0° to 95.0°)',
    unit: '°',
    minNormal: 85.0,
    maxNormal: 95.0,
    minRange: -25,
    maxRange: 120,
    step: 0.5,
    evaluateInference: (val: number) => {
      // Support both total degree entry (e.g. 90-105°) and Downs deviation entry (-8° to +8°)
      if (val > 50) {
        if (val > 95.0) return { inference: 'Proclined Lower Incisors (IMPA > 95°)', status: 'abnormal' };
        if (val < 85.0) return { inference: 'Retroclined Lower Incisors (IMPA < 85°)', status: 'abnormal' };
        return { inference: 'Normal Lower Incisor Inclination (IMPA 85°–95°)', status: 'normal' };
      } else {
        if (val > 5.0) return { inference: 'Proclined Lower Incisors (IMPA > +5°)', status: 'abnormal' };
        if (val < -5.0) return { inference: 'Retroclined Lower Incisors (IMPA < -5°)', status: 'abnormal' };
        return { inference: 'Normal Lower Incisor Inclination (IMPA)', status: 'normal' };
      }
    },
  },
  {
    key: 'interincisalAngle',
    label: 'Interincisal Angle (U1 to L1)',
    category: 'Dental',
    normalText: '135.4° (130.0° to 142.0°)',
    unit: '°',
    minNormal: 130.0,
    maxNormal: 142.0,
    minRange: 90,
    maxRange: 180,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val < 130.0) return { inference: 'Acute Interincisal Angle (Bimaxillary / Incisor Proclination)', status: 'abnormal' };
      if (val > 142.0) return { inference: 'Obtuse Interincisal Angle (Incisor Retroclination / Class II Div 2 Tendency)', status: 'abnormal' };
      return { inference: 'Normal Interincisal Relationship', status: 'normal' };
    },
  },
  {
    key: 'upperIncisalAngle',
    label: 'Upper Incisor to A-Pog (1 to A-Po)',
    category: 'Dental',
    normalText: '+2.7 mm (0.5 to 5.0 mm)',
    unit: 'mm',
    minNormal: 0.5,
    maxNormal: 5.0,
    minRange: -10,
    maxRange: 20,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 5.0) return { inference: 'Upper Incisor Protrusion (Class II Div 1 Feature)', status: 'abnormal' };
      if (val < 0.5) return { inference: 'Upper Incisor Retrusion (Class II Div 2 / Class III Feature)', status: 'abnormal' };
      return { inference: 'Normal Upper Incisor Position', status: 'normal' };
    },
  },
];

export const DEFAULT_DOWNS_PARAMS: DownsParametersMap = {
  facialAngle: { pre: '', mid: '', post: '' },
  angleConvexity: { pre: '', mid: '', post: '' },
  abPlane: { pre: '', mid: '', post: '' },
  mandibularPlaneAngle: { pre: '', mid: '', post: '' },
  yAxis: { pre: '', mid: '', post: '' },
  cantOfOcclusion: { pre: '', mid: '', post: '' },
  lowerIncisorToOcclusal: { pre: '', mid: '', post: '' },
  impa: { pre: '', mid: '', post: '' },
  interincisalAngle: { pre: '', mid: '', post: '' },
  upperIncisalAngle: { pre: '', mid: '', post: '' },
};

// Preset sample cases
const CLASS_I_NORM_SAMPLE: DownsParametersMap = {
  facialAngle: { pre: 87.8, mid: 87.8, post: 87.8 },
  angleConvexity: { pre: 0, mid: 0, post: 0 },
  abPlane: { pre: -4.6, mid: -4.6, post: -4.6 },
  mandibularPlaneAngle: { pre: 21.9, mid: 21.9, post: 21.9 },
  yAxis: { pre: 59.4, mid: 59.4, post: 59.4 },
  cantOfOcclusion: { pre: 9.3, mid: 9.3, post: 9.3 },
  lowerIncisorToOcclusal: { pre: 14.5, mid: 14.5, post: 14.5 },
  impa: { pre: 91.4, mid: 91.4, post: 91.4 },
  interincisalAngle: { pre: 135.4, mid: 135.4, post: 135.4 },
  upperIncisalAngle: { pre: 2.7, mid: 2.7, post: 2.7 },
};

const CLASS_II_DIV1_SAMPLE: DownsParametersMap = {
  facialAngle: { pre: 80.0, mid: 83.0, post: 86.0 },
  angleConvexity: { pre: 12.0, mid: 8.0, post: 3.0 },
  abPlane: { pre: -11.5, mid: -8.0, post: -4.5 },
  mandibularPlaneAngle: { pre: 29.0, mid: 26.0, post: 23.0 },
  yAxis: { pre: 67.0, mid: 63.5, post: 60.0 },
  cantOfOcclusion: { pre: 15.5, mid: 12.5, post: 9.5 },
  lowerIncisorToOcclusal: { pre: 21.0, mid: 17.5, post: 14.5 },
  impa: { pre: 98.0, mid: 94.5, post: 91.5 },
  interincisalAngle: { pre: 118.0, mid: 126.5, post: 134.0 },
  upperIncisalAngle: { pre: 7.5, mid: 5.0, post: 3.0 },
};

const CLASS_II_DIV2_SAMPLE: DownsParametersMap = {
  facialAngle: { pre: 81.5, mid: 84.0, post: 86.5 },
  angleConvexity: { pre: 8.5, mid: 5.0, post: 2.0 },
  abPlane: { pre: -9.5, mid: -7.0, post: -4.5 },
  mandibularPlaneAngle: { pre: 16.0, mid: 18.5, post: 21.0 },
  yAxis: { pre: 55.5, mid: 57.5, post: 59.0 },
  cantOfOcclusion: { pre: 8.0, mid: 8.5, post: 9.0 },
  lowerIncisorToOcclusal: { pre: 8.5, mid: 11.5, post: 14.0 },
  impa: { pre: 84.0, mid: 88.0, post: 91.0 },
  interincisalAngle: { pre: 148.0, mid: 141.0, post: 135.5 },
  upperIncisalAngle: { pre: -0.5, mid: 1.5, post: 2.5 },
};

const CLASS_III_SAMPLE: DownsParametersMap = {
  facialAngle: { pre: 96.0, mid: 93.0, post: 90.0 },
  angleConvexity: { pre: -11.0, mid: -6.0, post: -1.0 },
  abPlane: { pre: 3.5, mid: 0.0, post: -3.5 },
  mandibularPlaneAngle: { pre: 15.0, mid: 18.0, post: 21.5 },
  yAxis: { pre: 51.0, mid: 55.0, post: 58.5 },
  cantOfOcclusion: { pre: 3.0, mid: 6.0, post: 9.0 },
  lowerIncisorToOcclusal: { pre: 7.0, mid: 11.0, post: 14.0 },
  impa: { pre: 82.0, mid: 86.5, post: 91.0 },
  interincisalAngle: { pre: 147.0, mid: 141.0, post: 136.0 },
  upperIncisalAngle: { pre: -2.5, mid: 0.5, post: 2.5 },
};

interface DownsAnalysisProps {
  data?: DownsAnalysisData;
  onChange?: (updatedData: DownsAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
}

export const DownsAnalysis: React.FC<DownsAnalysisProps> = ({
  data,
  onChange,
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
  currentStage = 'pre',
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const onToggle = () => {
    if (externalOnToggle) {
      externalOnToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const [params, setParams] = useState<DownsParametersMap>(() => {
    if (data?.parameters) {
      return { ...DEFAULT_DOWNS_PARAMS, ...data.parameters };
    }
    return DEFAULT_DOWNS_PARAMS;
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.parameters) {
      setParams((prev) => ({
        ...prev,
        ...data.parameters,
      }));
    }
  }, [data?.parameters]);

  const generateDownsSummary = (
    currentParams: DownsParametersMap,
    stage: 'pre' | 'mid' | 'post'
  ): string => {
    const stageLabel =
      stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';

    const getParamVal = (key: DownsParameterKey): number | null => {
      const v = currentParams[key]?.[stage];
      if (v === '' || v === undefined || v === null) return null;
      const num = Number(v);
      return isNaN(num) ? null : num;
    };

    const facialAngle = getParamVal('facialAngle');
    const angleConvexity = getParamVal('angleConvexity');
    const abPlane = getParamVal('abPlane');
    const mpa = getParamVal('mandibularPlaneAngle');
    const yAxis = getParamVal('yAxis');
    const cant = getParamVal('cantOfOcclusion');
    const l1Op = getParamVal('lowerIncisorToOcclusal');
    const impa = getParamVal('impa');
    const interincisal = getParamVal('interincisalAngle');
    const u1Apo = getParamVal('upperIncisalAngle');

    const enteredCount = [facialAngle, angleConvexity, abPlane, mpa, yAxis, cant, l1Op, impa, interincisal, u1Apo].filter(
      (v) => v !== null
    ).length;

    if (enteredCount === 0) {
      return `Please enter measurement values to auto-generate Downs Cephalometric diagnostic conclusion.`;
    }

    // 1. Sagittal Skeletal Pattern
    let skClass: 'I' | 'II' | 'III' = 'I';
    const skFindings: string[] = [];

    const isClass2Convexity = angleConvexity !== null && angleConvexity > 5.0;
    const isClass2FacialAngle = facialAngle !== null && facialAngle < 84.0;
    const isClass2AbPlane = abPlane !== null && abPlane < -8.5;

    const isClass3Convexity = angleConvexity !== null && angleConvexity < -5.0;
    const isClass3FacialAngle = facialAngle !== null && facialAngle > 91.5;
    const isClass3AbPlane = abPlane !== null && abPlane > 0.0;

    if (isClass2Convexity || isClass2FacialAngle || isClass2AbPlane) {
      skClass = 'II';
      if (isClass2FacialAngle) skFindings.push(`mandibular retrognathism (Facial Angle: ${facialAngle}°)`);
      if (isClass2Convexity) skFindings.push(`increased facial profile convexity (Convexity: ${angleConvexity}°)`);
      if (isClass2AbPlane) skFindings.push(`maxillomandibular basal discrepancy (A-B Plane: ${abPlane}°)`);
    } else if (isClass3Convexity || isClass3FacialAngle || isClass3AbPlane) {
      skClass = 'III';
      if (isClass3FacialAngle) skFindings.push(`mandibular prognathism (Facial Angle: ${facialAngle}°)`);
      if (isClass3Convexity) skFindings.push(`concave facial profile (Convexity: ${angleConvexity}°)`);
      if (isClass3AbPlane) skFindings.push(`mandibular basal protrusion (A-B Plane: ${abPlane}°)`);
    } else if (angleConvexity !== null || facialAngle !== null || abPlane !== null) {
      skFindings.push('straight facial profile with balanced orthognathic jaw relationship');
    }

    // 2. Vertical Growth Vector
    const vertFindings: string[] = [];
    const isHyper = (mpa !== null && mpa > 26.0) || (yAxis !== null && yAxis > 64.0) || (cant !== null && cant > 13.5);
    const isHypo = (mpa !== null && mpa < 17.0) || (yAxis !== null && yAxis < 55.0) || (cant !== null && cant < 5.5);

    if (isHyper) {
      vertFindings.push('Hyperdivergent vertical growth pattern');
      if (mpa !== null && mpa > 26.0) vertFindings.push(`steep mandibular plane (${mpa}°)`);
      if (yAxis !== null && yAxis > 64.0) vertFindings.push(`increased vertical Y-axis (${yAxis}°)`);
      if (cant !== null && cant > 13.5) vertFindings.push(`steep occlusal plane (${cant}°)`);
    } else if (isHypo) {
      vertFindings.push('Hypodivergent horizontal growth pattern');
      if (mpa !== null && mpa < 17.0) vertFindings.push(`flat mandibular plane (${mpa}°)`);
      if (yAxis !== null && yAxis < 55.0) vertFindings.push(`horizontal growth axis (${yAxis}°)`);
      if (cant !== null && cant < 5.5) vertFindings.push(`flat occlusal plane (${cant}°)`);
    } else if (mpa !== null || yAxis !== null || cant !== null) {
      vertFindings.push('Normodivergent balanced vertical facial proportions');
    }

    // 3. Dental & Incisal Relationship
    const dentFindings: string[] = [];
    const isU1Protrusive = u1Apo !== null && u1Apo > 5.0;
    const isU1Retrusive = u1Apo !== null && u1Apo < 0.5;
    const isInterincisalAcute = interincisal !== null && interincisal < 130.0;
    const isInterincisalObtuse = interincisal !== null && interincisal > 142.0;

    let isL1Proclined = false;
    let isL1Retroclined = false;
    if (impa !== null) {
      if (impa > 50) {
        if (impa > 95.0) isL1Proclined = true;
        if (impa < 87.0) isL1Retroclined = true;
      } else {
        if (impa > 5.0) isL1Proclined = true;
        if (impa < -3.0) isL1Retroclined = true;
      }
    }
    if (l1Op !== null) {
      if (l1Op > 18.0) isL1Proclined = true;
      if (l1Op < 11.0) isL1Retroclined = true;
    }

    if (skClass === 'II') {
      if (isU1Protrusive || isInterincisalAcute) {
        dentFindings.push('Class II Division 1 pattern with maxillary incisor protrusion and increased overjet');
      } else if (isU1Retrusive || isInterincisalObtuse) {
        dentFindings.push('Class II Division 2 pattern with retroclined maxillary incisors and deep bite tendency');
      } else {
        dentFindings.push('Class II dental relationship');
      }
    } else if (skClass === 'III') {
      if (isL1Retroclined) {
        dentFindings.push('Class III malocclusion with lower incisor dentoalveolar retroclination (compensation)');
      } else {
        dentFindings.push('Class III malocclusion with edge-to-edge / reverse anterior relationship tendency');
      }
    } else {
      if (isInterincisalAcute && isL1Proclined) {
        dentFindings.push('Bimaxillary dentoalveolar protrusion with acute interincisal angle');
      } else if (isInterincisalObtuse) {
        dentFindings.push('Incisor retroclination with increased interincisal angle');
      } else if (isL1Proclined) {
        dentFindings.push('Lower incisor proclination');
      } else if (isL1Retroclined) {
        dentFindings.push('Lower incisor retroclination');
      }
    }

    const sections: string[] = [];
    sections.push(`Skeletal Class ${skClass} (${skFindings.join(', ') || 'normative parameters'})`);
    if (vertFindings.length > 0) sections.push(vertFindings.join(', '));
    if (dentFindings.length > 0) sections.push(dentFindings.join(', '));

    return `Downs Analysis (${stageLabel}): Patient presents with ${sections.join('; ')}.`;
  };

  const handleValueChange = (key: DownsParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updatedParams: DownsParametersMap = {
      ...params,
      [key]: {
        ...params[key],
        [stage]: newNumber,
      },
    };

    setParams(updatedParams);
    const updatedConclusion = generateDownsSummary(updatedParams, stage);

    if (onChange) {
      onChange({
        parameters: updatedParams,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';

  const handleLoadSample = (sample: DownsParametersMap) => {
    setParams(sample);
    const updatedConclusion = generateDownsSummary(sample, stageKey);
    if (onChange) {
      onChange({
        parameters: sample,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const handleReset = () => {
    const emptyParams: DownsParametersMap = { ...DEFAULT_DOWNS_PARAMS };
    setParams(emptyParams);
    const emptySummary = `Please enter measurement values to auto-generate Downs Cephalometric diagnostic conclusion.`;
    if (onChange) {
      onChange({
        parameters: emptyParams,
        diagnosticConclusion: emptySummary,
      });
    }
  };

  const inferences = useMemo(() => {
    const map: Record<string, { inference: string; status: 'normal' | 'abnormal' | 'empty' }> = {};

    DOWNS_PARAMETERS_META.forEach((meta) => {
      const val = params[meta.key]?.[stageKey];
      if (val !== '' && val !== undefined && !isNaN(Number(val))) {
        const res = meta.evaluateInference(Number(val));
        map[meta.key] = res;
      } else {
        map[meta.key] = { inference: 'Not Measured', status: 'empty' };
      }
    });

    return map;
  }, [params, stageKey]);

  const activeCount = useMemo(() => {
    return DOWNS_PARAMETERS_META.filter((m) => {
      const val = params[m.key]?.[stageKey];
      return val !== '' && val !== undefined && !isNaN(Number(val));
    }).length;
  }, [params, stageKey]);

  const abnormalCount = useMemo(() => {
    return Object.values(inferences).filter((inf) => (inf as any)?.status === 'abnormal').length;
  }, [inferences]);

  const diagnosticConclusion = useMemo(() => {
    return generateDownsSummary(params, stageKey);
  }, [params, stageKey]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(diagnosticConclusion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all w-full max-w-full">
      {/* Accordion Card Header */}
      {/* Accordion Card Header - Mobile Optimized 48px+ Touch Target */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full min-h-[52px] px-3.5 py-3 cursor-pointer bg-white hover:bg-slate-50/80 active:bg-slate-100/90 active:scale-[0.995] transition-all text-left block relative select-none border-b border-slate-100"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 leading-tight">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Downs Analysis
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  10 Params
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Skeletal & Dental Cephalometrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeCount === 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                0/10 Measured
              </span>
            ) : abnormalCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{abnormalCount} Deviations</span>
              </span>
            ) : activeCount === 10 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                <span>{activeCount}/10 Measured</span>
              </span>
            )}

            <div className="text-slate-400 p-0.5 rounded-lg">
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-700" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>
        </div>

        {/* Slim 2px progress bar along bottom edge when in progress */}
        {activeCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                abnormalCount > 0 ? 'bg-amber-500' : activeCount === 10 ? 'bg-emerald-500' : 'bg-teal-500'
              }`}
              style={{ width: `${(activeCount / 10) * 100}%` }}
            />
          </div>
        )}
      </button>

      {/* Accordion Body Content */}
      {isOpen && (
        <div className="p-3 sm:p-5 space-y-5 bg-slate-50/50">
          {/* Top Presets & Controls - Mobile Touch Optimized Horizontal Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 touch-pan-x min-w-0">
              <span className="text-xs font-extrabold text-slate-700 shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Presets:
              </span>
              <button
                type="button"
                onClick={() => handleLoadSample(CLASS_I_NORM_SAMPLE)}
                className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 border border-slate-200 rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Class I Norm
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(CLASS_II_DIV1_SAMPLE)}
                className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 border border-slate-200 rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Class II Div 1
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(CLASS_II_DIV2_SAMPLE)}
                className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 border border-slate-200 rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Class II Div 2
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(CLASS_III_SAMPLE)}
                className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 border border-slate-200 rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Class III
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 border border-slate-200 rounded-xl transition-all flex items-center gap-1 shrink-0 cursor-pointer self-end sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>

          {/* Skeletal Parameters Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
              Skeletal Parameters (5)
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {DOWNS_PARAMETERS_META.filter((m) => m.category === 'Skeletal').map((meta) => {
                const val = params[meta.key]?.[stageKey] ?? '';
                const inf = inferences[meta.key];
                return (
                  <CephParameterRow
                    key={meta.key}
                    label={meta.label}
                    norm={meta.normalText}
                    value={val}
                    onChange={(n) => handleValueChange(meta.key, stageKey, n)}
                    unit={meta.unit}
                    min={meta.minRange}
                    max={meta.maxRange}
                    step={meta.step}
                    inference={inf}
                    category={meta.category}
                  />
                );
              })}
            </div>
          </div>

          {/* Dental Parameters Section */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
              Dental Parameters (5)
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {DOWNS_PARAMETERS_META.filter((m) => m.category === 'Dental').map((meta) => {
                const val = params[meta.key]?.[stageKey] ?? '';
                const inf = inferences[meta.key];
                return (
                  <CephParameterRow
                    key={meta.key}
                    label={meta.label}
                    norm={meta.normalText}
                    value={val}
                    onChange={(n) => handleValueChange(meta.key, stageKey, n)}
                    unit={meta.unit}
                    min={meta.minRange}
                    max={meta.maxRange}
                    step={meta.step}
                    inference={inf}
                    category={meta.category}
                  />
                );
              })}
            </div>
          </div>

          {/* AI Clinical Auto-Diagnosis Panel */}
          <CephAutoDiagnosisPanel
            analysisName="Downs Analysis"
            parameters={DOWNS_PARAMETERS_META.map((meta) => ({
              parameterKey: meta.key,
              parameterName: meta.label,
              analysisName: 'Downs Analysis',
              value: params[meta.key]?.[stageKey] ?? '',
              minNormal: meta.minNormal,
              maxNormal: meta.maxNormal,
              unit: meta.unit,
              category: meta.category,
            }))}
          />
        </div>
      )}
    </div>
  );
};
