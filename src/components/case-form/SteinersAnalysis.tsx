import React, { useState, useEffect, useMemo } from 'react';
import {
  SteinersParameterKey,
  SteinersParametersMap,
  SteinersAnalysisData,
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
  Compass,
} from 'lucide-react';

export interface SteinersParameterMeta {
  key: SteinersParameterKey;
  label: string;
  category: 'Skeletal' | 'Dental' | 'Soft Tissue';
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

export const STEINERS_PARAMETERS_META: SteinersParameterMeta[] = [
  // 1. Skeletal Parameters (5)
  {
    key: 'sna',
    label: 'SNA Angle',
    category: 'Skeletal',
    normalText: '82° (80° - 84°)',
    unit: '°',
    minNormal: 80,
    maxNormal: 84,
    minRange: 50,
    maxRange: 120,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 84) return { inference: 'Maxillary Prognathism', status: 'abnormal' };
      if (val < 80) return { inference: 'Maxillary Retrognathism', status: 'abnormal' };
      return { inference: 'Normal Maxillary AP Position', status: 'normal' };
    },
  },
  {
    key: 'snb',
    label: 'SNB Angle',
    category: 'Skeletal',
    normalText: '80° (78° - 82°)',
    unit: '°',
    minNormal: 78,
    maxNormal: 82,
    minRange: 50,
    maxRange: 120,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 82) return { inference: 'Mandibular Prognathism', status: 'abnormal' };
      if (val < 78) return { inference: 'Mandibular Retrognathism', status: 'abnormal' };
      return { inference: 'Normal Mandibular AP Position', status: 'normal' };
    },
  },
  {
    key: 'anb',
    label: 'ANB Angle',
    category: 'Skeletal',
    normalText: '2° (0° - 4°)',
    unit: '°',
    minNormal: 0,
    maxNormal: 4,
    minRange: -15,
    maxRange: 25,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 4) return { inference: 'Skeletal Class II Malocclusion', status: 'abnormal' };
      if (val < 0) return { inference: 'Skeletal Class III Malocclusion', status: 'abnormal' };
      return { inference: 'Skeletal Class I Pattern', status: 'normal' };
    },
  },
  {
    key: 'occlusalPlaneAngle',
    label: 'Occlusal Plane Angle',
    category: 'Skeletal',
    normalText: '14° (12° - 16°)',
    unit: '°',
    minNormal: 12,
    maxNormal: 16,
    minRange: -5,
    maxRange: 35,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 16) return { inference: 'Steep Occlusal Plane Angle', status: 'abnormal' };
      if (val < 12) return { inference: 'Flat Occlusal Plane Angle', status: 'abnormal' };
      return { inference: 'Normal Occlusal Plane', status: 'normal' };
    },
  },
  {
    key: 'mandibularPlaneAngle',
    label: 'Mandibular Plane Angle (GoGn-SN)',
    category: 'Skeletal',
    normalText: '32° (29° - 35°)',
    unit: '°',
    minNormal: 29,
    maxNormal: 35,
    minRange: 10,
    maxRange: 60,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 35) return { inference: 'Hyperdivergent / High Angle Pattern', status: 'abnormal' };
      if (val < 29) return { inference: 'Hypodivergent / Low Angle Pattern', status: 'abnormal' };
      return { inference: 'Normodivergent Pattern', status: 'normal' };
    },
  },

  // 2. Dental Parameters (5)
  {
    key: 'upperIncisorToNaMm',
    label: 'Upper Incisors to NA (mm)',
    category: 'Dental',
    normalText: '4 mm (2 to 6 mm)',
    unit: 'mm',
    minNormal: 2,
    maxNormal: 6,
    minRange: -10,
    maxRange: 20,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 6) return { inference: 'Upper Incisor Protrusion', status: 'abnormal' };
      if (val < 2) return { inference: 'Upper Incisor Retrusion', status: 'abnormal' };
      return { inference: 'Normal Upper Incisor Position', status: 'normal' };
    },
  },
  {
    key: 'upperIncisorToNaDeg',
    label: 'Upper Incisors to NA Angle',
    category: 'Dental',
    normalText: '22° (18° to 26°)',
    unit: '°',
    minNormal: 18,
    maxNormal: 26,
    minRange: -10,
    maxRange: 50,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 26) return { inference: 'Upper Incisor Proclination', status: 'abnormal' };
      if (val < 18) return { inference: 'Upper Incisor Retroclination', status: 'abnormal' };
      return { inference: 'Normal Upper Incisor Inclination', status: 'normal' };
    },
  },
  {
    key: 'lowerIncisorToNbDeg',
    label: 'Lower Incisors to NB Angle',
    category: 'Dental',
    normalText: '25° (21° to 29°)',
    unit: '°',
    minNormal: 21,
    maxNormal: 29,
    minRange: -10,
    maxRange: 50,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 29) return { inference: 'Lower Incisor Proclination', status: 'abnormal' };
      if (val < 21) return { inference: 'Lower Incisor Retroclination', status: 'abnormal' };
      return { inference: 'Normal Lower Incisor Inclination', status: 'normal' };
    },
  },
  {
    key: 'lowerIncisorToNbMm',
    label: 'Lower Incisors to NB (mm)',
    category: 'Dental',
    normalText: '4 mm (2 to 6 mm)',
    unit: 'mm',
    minNormal: 2,
    maxNormal: 6,
    minRange: -10,
    maxRange: 20,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 6) return { inference: 'Lower Incisor Protrusion', status: 'abnormal' };
      if (val < 2) return { inference: 'Lower Incisor Retrusion', status: 'abnormal' };
      return { inference: 'Normal Lower Incisor Position', status: 'normal' };
    },
  },
  {
    key: 'interincisalAngle',
    label: 'Interincisal Angle',
    category: 'Dental',
    normalText: '130° (125° to 135°)',
    unit: '°',
    minNormal: 125,
    maxNormal: 135,
    minRange: 90,
    maxRange: 180,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val < 125) return { inference: 'Proclined Incisors / Acute Interincisal Angle', status: 'abnormal' };
      if (val > 135) return { inference: 'Retroclined Incisors / Obtuse Interincisal Angle', status: 'abnormal' };
      return { inference: 'Normal Interincisal Angle', status: 'normal' };
    },
  },

  // 3. Soft Tissue Parameter (1)
  {
    key: 'steinersSLine',
    label: "Steiner's S-Line",
    category: 'Soft Tissue',
    normalText: '0 mm (-2 to 2 mm)',
    unit: 'mm',
    minNormal: -2,
    maxNormal: 2,
    minRange: -15,
    maxRange: 15,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 2) return { inference: 'Soft Tissue Lip Protrusion', status: 'abnormal' };
      if (val < -2) return { inference: 'Soft Tissue Lip Retrusion', status: 'abnormal' };
      return { inference: 'Balanced Lip Profile', status: 'normal' };
    },
  },
];

export const DEFAULT_STEINERS_PARAMS: SteinersParametersMap = {
  sna: { pre: '', mid: '', post: '' },
  snb: { pre: '', mid: '', post: '' },
  anb: { pre: '', mid: '', post: '' },
  occlusalPlaneAngle: { pre: '', mid: '', post: '' },
  mandibularPlaneAngle: { pre: '', mid: '', post: '' },
  upperIncisorToNaMm: { pre: '', mid: '', post: '' },
  upperIncisorToNaDeg: { pre: '', mid: '', post: '' },
  lowerIncisorToNbDeg: { pre: '', mid: '', post: '' },
  lowerIncisorToNbMm: { pre: '', mid: '', post: '' },
  interincisalAngle: { pre: '', mid: '', post: '' },
  steinersSLine: { pre: '', mid: '', post: '' },
};

const CLASS_I_STEINERS_NORM: SteinersParametersMap = {
  sna: { pre: 82, mid: 82, post: 82 },
  snb: { pre: 80, mid: 80, post: 80 },
  anb: { pre: 2, mid: 2, post: 2 },
  occlusalPlaneAngle: { pre: 14, mid: 14, post: 14 },
  mandibularPlaneAngle: { pre: 32, mid: 32, post: 32 },
  upperIncisorToNaMm: { pre: 4, mid: 4, post: 4 },
  upperIncisorToNaDeg: { pre: 22, mid: 22, post: 22 },
  lowerIncisorToNbDeg: { pre: 25, mid: 25, post: 25 },
  lowerIncisorToNbMm: { pre: 4, mid: 4, post: 4 },
  interincisalAngle: { pre: 130, mid: 130, post: 130 },
  steinersSLine: { pre: 0, mid: 0, post: 0 },
};

const CLASS_II_DIV1_STEINERS_SAMPLE: SteinersParametersMap = {
  sna: { pre: 86, mid: 84, post: 82 },
  snb: { pre: 77, mid: 79, post: 80 },
  anb: { pre: 9, mid: 5, post: 2 },
  occlusalPlaneAngle: { pre: 18, mid: 16, post: 14 },
  mandibularPlaneAngle: { pre: 38, mid: 35, post: 32 },
  upperIncisorToNaMm: { pre: 7, mid: 5, post: 4 },
  upperIncisorToNaDeg: { pre: 29, mid: 25, post: 22 },
  lowerIncisorToNbDeg: { pre: 29, mid: 27, post: 25 },
  lowerIncisorToNbMm: { pre: 6, mid: 5, post: 4 },
  interincisalAngle: { pre: 115, mid: 123, post: 130 },
  steinersSLine: { pre: 3.5, mid: 1.5, post: 0 },
};

const CLASS_II_DIV2_STEINERS_SAMPLE: SteinersParametersMap = {
  sna: { pre: 83, mid: 82, post: 82 },
  snb: { pre: 77, mid: 79, post: 80 },
  anb: { pre: 6, mid: 4, post: 2 },
  occlusalPlaneAngle: { pre: 11, mid: 13, post: 14 },
  mandibularPlaneAngle: { pre: 27, mid: 30, post: 32 },
  upperIncisorToNaMm: { pre: 1, mid: 3, post: 4 },
  upperIncisorToNaDeg: { pre: 14, mid: 18, post: 22 },
  lowerIncisorToNbDeg: { pre: 20, mid: 23, post: 25 },
  lowerIncisorToNbMm: { pre: 2, mid: 3, post: 4 },
  interincisalAngle: { pre: 146, mid: 138, post: 130 },
  steinersSLine: { pre: -1.5, mid: -0.5, post: 0 },
};

const CLASS_III_STEINERS_SAMPLE: SteinersParametersMap = {
  sna: { pre: 79, mid: 81, post: 82 },
  snb: { pre: 84, mid: 82, post: 80 },
  anb: { pre: -5, mid: -1, post: 2 },
  occlusalPlaneAngle: { pre: 10, mid: 12, post: 14 },
  mandibularPlaneAngle: { pre: 26, mid: 29, post: 32 },
  upperIncisorToNaMm: { pre: 2, mid: 3, post: 4 },
  upperIncisorToNaDeg: { pre: 16, mid: 19, post: 22 },
  lowerIncisorToNbDeg: { pre: 18, mid: 22, post: 25 },
  lowerIncisorToNbMm: { pre: 2, mid: 3, post: 4 },
  interincisalAngle: { pre: 144, mid: 137, post: 130 },
  steinersSLine: { pre: -3, mid: -1.5, post: 0 },
};

interface SteinersAnalysisProps {
  data?: SteinersAnalysisData;
  onChange?: (updatedData: SteinersAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
}

export const SteinersAnalysis: React.FC<SteinersAnalysisProps> = ({
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

  const [params, setParams] = useState<SteinersParametersMap>(() => {
    if (data?.parameters) {
      return { ...DEFAULT_STEINERS_PARAMS, ...data.parameters };
    }
    return DEFAULT_STEINERS_PARAMS;
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

  const generateSteinersSummary = (
    currentParams: SteinersParametersMap,
    stage: 'pre' | 'mid' | 'post'
  ): string => {
    const stageLabel =
      stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';

    const getVal = (k: SteinersParameterKey): number | null => {
      const v = currentParams[k]?.[stage];
      if (v === '' || v === undefined || isNaN(Number(v))) return null;
      return Number(v);
    };

    const sna = getVal('sna');
    const snb = getVal('snb');
    const anb = getVal('anb');
    const mp = getVal('mandibularPlaneAngle');
    const op = getVal('occlusalPlaneAngle');
    const uiNaMm = getVal('upperIncisorToNaMm');
    const uiNaDeg = getVal('upperIncisorToNaDeg');
    const liNbDeg = getVal('lowerIncisorToNbDeg');
    const liNbMm = getVal('lowerIncisorToNbMm');
    const ii = getVal('interincisalAngle');
    const sLine = getVal('steinersSLine');

    const totalEntered = [sna, snb, anb, mp, op, uiNaMm, uiNaDeg, liNbDeg, liNbMm, ii, sLine].filter((v) => v !== null).length;
    if (totalEntered === 0) {
      return `Please enter Steiner's cephalometric measurements to auto-generate diagnostic conclusion.`;
    }

    const sentences: string[] = [];

    // 1. Sagittal Skeletal
    if (anb !== null) {
      let sagDesc = '';
      if (anb > 4) {
        let etiology = '';
        if (sna !== null && sna > 84 && snb !== null && snb < 78) etiology = ' due to combined maxillary prognathism and mandibular retrognathism';
        else if (sna !== null && sna > 84) etiology = ' primarily due to maxillary prognathism (SNA ' + sna + '°)';
        else if (snb !== null && snb < 78) etiology = ' primarily due to mandibular retrognathism (SNB ' + snb + '°)';
        sagDesc = `Skeletal Class II jaw base relationship (ANB: ${anb}°)${etiology}`;
      } else if (anb < 0) {
        let etiology = '';
        if (snb !== null && snb > 82 && sna !== null && sna < 80) etiology = ' due to combined mandibular prognathism and maxillary retrognathism';
        else if (snb !== null && snb > 82) etiology = ' driven by mandibular prognathism (SNB ' + snb + '°)';
        else if (sna !== null && sna < 80) etiology = ' driven by maxillary deficiency (SNA ' + sna + '°)';
        sagDesc = `Skeletal Class III jaw base relationship (ANB: ${anb}°)${etiology}`;
      } else {
        sagDesc = `Skeletal Class I jaw base relationship with harmonious maxillo-mandibular alignment (ANB: ${anb}°, SNA: ${sna ?? 82}°, SNB: ${snb ?? 80}°)`;
      }
      sentences.push(sagDesc);
    } else if (sna !== null || snb !== null) {
      const parts: string[] = [];
      if (sna !== null) parts.push(sna > 84 ? `maxillary prognathism (SNA: ${sna}°)` : sna < 80 ? `maxillary retrusion (SNA: ${sna}°)` : `normal maxilla (SNA: ${sna}°)`);
      if (snb !== null) parts.push(snb > 82 ? `mandibular prognathism (SNB: ${snb}°)` : snb < 78 ? `mandibular retrusion (SNB: ${snb}°)` : `normal mandible (SNB: ${snb}°)`);
      sentences.push(parts.join(' and '));
    }

    // 2. Vertical Growth Vector
    if (mp !== null) {
      if (mp > 35) {
        sentences.push(`Hyperdivergent vertical growth pattern with steep mandibular plane angle (GoGn-SN: ${mp}°${op !== null ? `, Occlusal Plane: ${op}°` : ''})`);
      } else if (mp < 29) {
        sentences.push(`Hypodivergent horizontal growth pattern with low mandibular plane angle (GoGn-SN: ${mp}°${op !== null ? `, Occlusal Plane: ${op}°` : ''}) predisposing to deep bite`);
      } else {
        sentences.push(`Normodivergent vertical growth pattern with balanced facial height proportions (GoGn-SN: ${mp}°)`);
      }
    }

    // 3. Dentoalveolar Position & Inclinations
    const dentalParts: string[] = [];
    if (uiNaDeg !== null || uiNaMm !== null) {
      const isProclined = (uiNaDeg !== null && uiNaDeg > 26) || (uiNaMm !== null && uiNaMm > 6);
      const isRetroclined = (uiNaDeg !== null && uiNaDeg < 18) || (uiNaMm !== null && uiNaMm < 2);
      if (isProclined) dentalParts.push(`maxillary incisor proclination/protrusion (UI-NA: ${uiNaDeg ?? '-'}° / ${uiNaMm ?? '-'}mm)`);
      else if (isRetroclined) dentalParts.push(`maxillary incisor retroclination (UI-NA: ${uiNaDeg ?? '-'}° / ${uiNaMm ?? '-'}mm)`);
      else dentalParts.push(`normal maxillary incisor inclination (UI-NA: ${uiNaDeg ?? 22}° / ${uiNaMm ?? 4}mm)`);
    }

    if (liNbDeg !== null || liNbMm !== null) {
      const isProclined = (liNbDeg !== null && liNbDeg > 29) || (liNbMm !== null && liNbMm > 6);
      const isRetroclined = (liNbDeg !== null && liNbDeg < 21) || (liNbMm !== null && liNbMm < 2);
      if (isProclined) dentalParts.push(`mandibular incisor proclination (LI-NB: ${liNbDeg ?? '-'}° / ${liNbMm ?? '-'}mm)`);
      else if (isRetroclined) dentalParts.push(`mandibular incisor retroclination (LI-NB: ${liNbDeg ?? '-'}° / ${liNbMm ?? '-'}mm)`);
      else dentalParts.push(`well-positioned mandibular incisors (LI-NB: ${liNbDeg ?? 25}° / ${liNbMm ?? 4}mm)`);
    }

    if (ii !== null) {
      if (ii < 125) dentalParts.push(`acute interincisal angle (${ii}°) indicating bimaxillary protrusion tendency`);
      else if (ii > 135) dentalParts.push(`obtuse interincisal angle (${ii}°) associated with upright incisors`);
    }

    if (dentalParts.length > 0) {
      sentences.push(`Dentoalveolar findings reveal ${dentalParts.join(', ')}.`);
    }

    // 4. Soft Tissue
    if (sLine !== null) {
      if (sLine > 2) {
        sentences.push(`Soft tissue profile demonstrates lip protrusion (${sLine} mm ahead of Steiner's S-Line).`);
      } else if (sLine < -2) {
        sentences.push(`Soft tissue profile demonstrates lip retrusion (${Math.abs(sLine)} mm behind Steiner's S-Line).`);
      } else {
        sentences.push(`Soft tissue profile displays balanced lip posture conforming to Steiner's S-Line (${sLine} mm).`);
      }
    }

    return `Steiner's Analysis Summary (${stageLabel}): ${sentences.join('. ')}`;
  };

  const handleValueChange = (key: SteinersParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updatedParams: SteinersParametersMap = {
      ...params,
      [key]: {
        ...params[key],
        [stage]: newNumber,
      },
    };

    setParams(updatedParams);
    const updatedConclusion = generateSteinersSummary(updatedParams, stage);

    if (onChange) {
      onChange({
        parameters: updatedParams,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const handleLoadSample = (sample: SteinersParametersMap) => {
    setParams(sample);
    const updatedConclusion = generateSteinersSummary(sample, stageKey);
    if (onChange) {
      onChange({
        parameters: sample,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const handleReset = () => {
    const emptyParams: SteinersParametersMap = { ...DEFAULT_STEINERS_PARAMS };
    setParams(emptyParams);
    const emptySummary = `Please enter measurement values to auto-generate Steiner's Cephalometric diagnostic conclusion.`;
    if (onChange) {
      onChange({
        parameters: emptyParams,
        diagnosticConclusion: emptySummary,
      });
    }
  };

  const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';

  const inferences = useMemo(() => {
    const map: Record<string, { inference: string; status: 'normal' | 'abnormal' | 'empty' }> = {};

    STEINERS_PARAMETERS_META.forEach((meta) => {
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
    return STEINERS_PARAMETERS_META.filter((m) => {
      const val = params[m.key]?.[stageKey];
      return val !== '' && val !== undefined && !isNaN(Number(val));
    }).length;
  }, [params, stageKey]);

  const abnormalCount = useMemo(() => {
    return Object.values(inferences).filter((inf) => (inf as any)?.status === 'abnormal').length;
  }, [inferences]);

  const diagnosticConclusion = useMemo(() => {
    return generateSteinersSummary(params, stageKey);
  }, [params, stageKey]);

  const [snFhAngle, setSnFhAngle] = useState<number | ''>(7.5);
  const [showSnFhCard, setShowSnFhCard] = useState<boolean>(false);

  const snFhDelta = useMemo(() => {
    if (snFhAngle === '' || isNaN(Number(snFhAngle))) return 0;
    return Number(snFhAngle) - 7.5;
  }, [snFhAngle]);

  const rawSna = params.sna?.[stageKey];
  const rawSnb = params.snb?.[stageKey];
  const rawMp = params.mandibularPlaneAngle?.[stageKey];

  const correctedSna = useMemo(() => {
    if (rawSna === '' || rawSna === undefined || isNaN(Number(rawSna))) return null;
    return Number(rawSna) + snFhDelta;
  }, [rawSna, snFhDelta]);

  const correctedSnb = useMemo(() => {
    if (rawSnb === '' || rawSnb === undefined || isNaN(Number(rawSnb))) return null;
    return Number(rawSnb) + snFhDelta;
  }, [rawSnb, snFhDelta]);

  const correctedMp = useMemo(() => {
    if (rawMp === '' || rawMp === undefined || isNaN(Number(rawMp))) return null;
    return Number(rawMp) - snFhDelta;
  }, [rawMp, snFhDelta]);

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
                  Steiner&apos;s Analysis
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  11 Params
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Skeletal, Dental & Soft Tissue Profile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeCount === 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                0/11 Measured
              </span>
            ) : abnormalCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{abnormalCount} Deviations</span>
              </span>
            ) : activeCount === 11 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                <span>{activeCount}/11 Measured</span>
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
                abnormalCount > 0 ? 'bg-amber-500' : activeCount === 11 ? 'bg-emerald-500' : 'bg-teal-500'
              }`}
              style={{ width: `${(activeCount / 11) * 100}%` }}
            />
          </div>
        )}
      </button>

      {/* Accordion Body Content */}
      {isOpen && (
        <div className="p-3 sm:p-5 space-y-6 bg-slate-50/50">
          {/* Top Presets & Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                Presets:
              </span>
              <button
                type="button"
                onClick={() => handleLoadSample(CLASS_I_STEINERS_NORM)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
              >
                Class I Norm
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(CLASS_II_DIV1_STEINERS_SAMPLE)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
              >
                Class II Div 1
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(CLASS_II_DIV2_STEINERS_SAMPLE)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
              >
                Class II Div 2
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample(CLASS_III_STEINERS_SAMPLE)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
              >
                Class III
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>

          {/* SN-FH Cranial Base Correction Quick Adjuster */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">
                  SN-FH Cranial Base Correction ({stageKey.toUpperCase()})
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Norm: 7.5° (7°–8°)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-medium text-slate-600">Measured SN-FH:</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.5"
                    value={snFhAngle}
                    onChange={(e) => setSnFhAngle(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    placeholder="7.5"
                    className="w-16 bg-white border border-slate-300 rounded px-2 py-0.5 text-xs font-bold text-slate-900 focus:ring-1 focus:ring-teal-500"
                  />
                  <span className="text-xs text-slate-500">°</span>
                </div>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  Math.abs(snFhDelta) > 1.5
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}>
                  Δ {snFhDelta >= 0 ? '+' : ''}{snFhDelta.toFixed(1)}°
                </span>
              </div>
            </div>

            {/* Quick Live Corrected Metrics when delta !== 0 or measured values present */}
            {(correctedSna !== null || correctedSnb !== null || correctedMp !== null) && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200/80 text-xs">
                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Corrected SNA:</span>
                  <span className="font-extrabold text-slate-900">
                    {correctedSna !== null ? `${correctedSna.toFixed(1)}°` : '--'}
                    {snFhDelta !== 0 && rawSna !== '' && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(raw {rawSna}°)</span>
                    )}
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Corrected SNB:</span>
                  <span className="font-extrabold text-slate-900">
                    {correctedSnb !== null ? `${correctedSnb.toFixed(1)}°` : '--'}
                    {snFhDelta !== 0 && rawSnb !== '' && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(raw {rawSnb}°)</span>
                    )}
                  </span>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Corrected SN-GoGn:</span>
                  <span className="font-extrabold text-slate-900">
                    {correctedMp !== null ? `${correctedMp.toFixed(1)}°` : '--'}
                    {snFhDelta !== 0 && rawMp !== '' && (
                      <span className="text-[10px] text-slate-400 font-normal ml-1">(raw {rawMp}°)</span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Skeletal Parameters Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
              Skeletal Parameters (5)
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {STEINERS_PARAMETERS_META.filter((m) => m.category === 'Skeletal').map((meta) => {
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
              {STEINERS_PARAMETERS_META.filter((m) => m.category === 'Dental').map((meta) => {
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

          {/* Soft Tissue Parameters Section */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
              Soft Tissue Parameters (1)
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {STEINERS_PARAMETERS_META.filter((m) => m.category === 'Soft Tissue').map((meta) => {
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
            analysisName="Steiner's Analysis"
            parameters={STEINERS_PARAMETERS_META.map((meta) => ({
              parameterKey: meta.key,
              parameterName: meta.label,
              analysisName: "Steiner's Analysis",
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
