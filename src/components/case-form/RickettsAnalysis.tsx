import React, { useState, useEffect, useMemo } from 'react';
import {
  RickettsParameterKey,
  RickettsParametersMap,
  RickettsAnalysisData,
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

export interface RickettsParameterMeta {
  key: RickettsParameterKey;
  label: string;
  category: 'Chin in Space / Skeletal' | 'Convexity' | 'Teeth' | 'Profile';
  normalText: (age: number) => string;
  unit: string;
  minRange?: number;
  maxRange?: number;
  step?: number;
  getNormalRange: (age: number) => { minNormal: number; maxNormal: number };
  evaluateInference: (val: number, age: number) => {
    inference: string;
    status: 'normal' | 'abnormal';
  };
}

export const RICKETTS_PARAMETERS_META: RickettsParameterMeta[] = [
  // 1. Chin in Space / Skeletal Parameters (3)
  {
    key: 'facialAxis',
    label: '1. Facial Axis Angle',
    category: 'Chin in Space / Skeletal',
    normalText: () => '90° ± 3.5° (86.5° - 93.5°)',
    unit: '°',
    minRange: 60,
    maxRange: 120,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 86.5, maxNormal: 93.5 }),
    evaluateInference: (val: number) => {
      if (val < 86.5) return { inference: 'Vertical Growth Pattern / Retrusive Chin', status: 'abnormal' };
      if (val > 93.5) return { inference: 'Horizontal Growth Pattern / Prominent Chin', status: 'abnormal' };
      return { inference: 'Normal Growth Vector', status: 'normal' };
    },
  },
  {
    key: 'facialDepth',
    label: '2. Facial Depth Angle',
    category: 'Chin in Space / Skeletal',
    normalText: () => '87° ± 3° (84° - 90°)',
    unit: '°',
    minRange: 60,
    maxRange: 120,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 84, maxNormal: 90 }),
    evaluateInference: (val: number) => {
      if (val < 84) return { inference: 'Skeletal Retrusive Mandible / Class II Tendency', status: 'abnormal' };
      if (val > 90) return { inference: 'Skeletal Prognathic Mandible / Class III Tendency', status: 'abnormal' };
      return { inference: 'Normal Facial Depth', status: 'normal' };
    },
  },
  {
    key: 'mandibularPlaneAngle',
    label: '3. Mandibular Plane Angle',
    category: 'Chin in Space / Skeletal',
    normalText: () => '26° ± 4.5° (21.5° - 30.5°)',
    unit: '°',
    minRange: 5,
    maxRange: 55,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 21.5, maxNormal: 30.5 }),
    evaluateInference: (val: number) => {
      if (val > 30.5) return { inference: 'Hyperdivergent / High Angle Pattern', status: 'abnormal' };
      if (val < 21.5) return { inference: 'Hypodivergent / Low Angle Pattern', status: 'abnormal' };
      return { inference: 'Normodivergent Pattern', status: 'normal' };
    },
  },

  // 2. Convexity Parameter (1)
  {
    key: 'convexityPointA',
    label: '4. Convexity Point A',
    category: 'Convexity',
    normalText: () => '2 ± 2 mm (0 - 4 mm)',
    unit: 'mm',
    minRange: -15,
    maxRange: 20,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 0, maxNormal: 4 }),
    evaluateInference: (val: number) => {
      if (val > 4) return { inference: 'Skeletal Class II Convex Profile', status: 'abnormal' };
      if (val < 0) return { inference: 'Skeletal Class III Concave Profile', status: 'abnormal' };
      return { inference: 'Normal Profile Convexity', status: 'normal' };
    },
  },

  // 3. Teeth Parameters (3)
  {
    key: 'lowerIncisorToAPogMm',
    label: '5. Lower Incisor to A-Pog (mm)',
    category: 'Teeth',
    normalText: () => '1 ± 2 mm (-1 - 3 mm)',
    unit: 'mm',
    minRange: -10,
    maxRange: 15,
    step: 0.5,
    getNormalRange: () => ({ minNormal: -1, maxNormal: 3 }),
    evaluateInference: (val: number) => {
      if (val > 3) return { inference: 'Lower Incisor Protrusion', status: 'abnormal' };
      if (val < -1) return { inference: 'Lower Incisor Retrusion', status: 'abnormal' };
      return { inference: 'Normal Lower Incisor Position', status: 'normal' };
    },
  },
  {
    key: 'upperMolarToPtv',
    label: '6. Upper Molar to Pt Vertical',
    category: 'Teeth',
    normalText: (age: number) => `Age + 3 mm (Norm: ~${age + 3} mm)`,
    unit: 'mm',
    minRange: 0,
    maxRange: 50,
    step: 0.5,
    getNormalRange: (age: number) => {
      const norm = age + 3;
      return { minNormal: norm - 2, maxNormal: norm + 2 };
    },
    evaluateInference: (val: number, age: number) => {
      const norm = age + 3;
      if (val > norm + 2) return { inference: 'Upper Molar Mesial Displacement', status: 'abnormal' };
      if (val < norm - 2) return { inference: 'Upper Molar Distal Position', status: 'abnormal' };
      return { inference: 'Normal Upper Molar Position', status: 'normal' };
    },
  },
  {
    key: 'lowerIncisorToAPogDeg',
    label: '7. Lower Incisor Inclination (1-APog)',
    category: 'Teeth',
    normalText: () => '22° ± 4° (18° - 26°)',
    unit: '°',
    minRange: -10,
    maxRange: 50,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 18, maxNormal: 26 }),
    evaluateInference: (val: number) => {
      if (val > 26) return { inference: 'Lower Incisor Proclination', status: 'abnormal' };
      if (val < 18) return { inference: 'Lower Incisor Retroclination', status: 'abnormal' };
      return { inference: 'Normal Lower Incisor Inclination', status: 'normal' };
    },
  },

  // 4. Profile Parameter (1)
  {
    key: 'lowerLipToEPlane',
    label: '8. Lower Lip to Esthetic Line (E-Line)',
    category: 'Profile',
    normalText: () => '-2 ± 2 mm (-4 - 0 mm)',
    unit: 'mm',
    minRange: -15,
    maxRange: 15,
    step: 0.5,
    getNormalRange: () => ({ minNormal: -4, maxNormal: 0 }),
    evaluateInference: (val: number) => {
      if (val > 0) return { inference: 'Lower Lip Protrusion', status: 'abnormal' };
      if (val < -4) return { inference: 'Lower Lip Retrusion', status: 'abnormal' };
      return { inference: 'Normal Esthetic Lip Position', status: 'normal' };
    },
  },
];

export const DEFAULT_RICKETTS_PARAMS: RickettsParametersMap = {
  facialAxis: { pre: '', mid: '', post: '' },
  facialDepth: { pre: '', mid: '', post: '' },
  mandibularPlaneAngle: { pre: '', mid: '', post: '' },
  convexityPointA: { pre: '', mid: '', post: '' },
  lowerIncisorToAPogMm: { pre: '', mid: '', post: '' },
  upperMolarToPtv: { pre: '', mid: '', post: '' },
  lowerIncisorToAPogDeg: { pre: '', mid: '', post: '' },
  lowerLipToEPlane: { pre: '', mid: '', post: '' },
};

const CLASS_I_RICKETTS_NORM: RickettsParametersMap = {
  facialAxis: { pre: 90, mid: 90, post: 90 },
  facialDepth: { pre: 87, mid: 87, post: 87 },
  mandibularPlaneAngle: { pre: 26, mid: 26, post: 26 },
  convexityPointA: { pre: 2, mid: 2, post: 2 },
  lowerIncisorToAPogMm: { pre: 1, mid: 1, post: 1 },
  upperMolarToPtv: { pre: 15, mid: 15, post: 15 },
  lowerIncisorToAPogDeg: { pre: 22, mid: 22, post: 22 },
  lowerLipToEPlane: { pre: -2, mid: -2, post: -2 },
};

const CLASS_II_RICKETTS_SAMPLE: RickettsParametersMap = {
  facialAxis: { pre: 83, mid: 86, post: 89 },
  facialDepth: { pre: 80, mid: 83, post: 86 },
  mandibularPlaneAngle: { pre: 34, mid: 30, post: 27 },
  convexityPointA: { pre: 7, mid: 4, post: 2 },
  lowerIncisorToAPogMm: { pre: 5, mid: 3, post: 1 },
  upperMolarToPtv: { pre: 21, mid: 18, post: 15 },
  lowerIncisorToAPogDeg: { pre: 29, mid: 25, post: 22 },
  lowerLipToEPlane: { pre: 3, mid: 0, post: -2 },
};

const CLASS_III_RICKETTS_SAMPLE: RickettsParametersMap = {
  facialAxis: { pre: 95, mid: 92, post: 90 },
  facialDepth: { pre: 93, mid: 90, post: 87 },
  mandibularPlaneAngle: { pre: 19, mid: 23, post: 26 },
  convexityPointA: { pre: -3, mid: 0, post: 2 },
  lowerIncisorToAPogMm: { pre: -1, mid: 0, post: 1 },
  upperMolarToPtv: { pre: 10, mid: 13, post: 15 },
  lowerIncisorToAPogDeg: { pre: 15, mid: 19, post: 22 },
  lowerLipToEPlane: { pre: -5, mid: -3, post: -2 },
};

interface RickettsAnalysisProps {
  data?: RickettsAnalysisData;
  onChange?: (updatedData: RickettsAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  patientAge?: number;
  currentStage?: 'pre' | 'mid' | 'post';
}

export const RickettsAnalysis: React.FC<RickettsAnalysisProps> = ({
  data,
  onChange,
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
  patientAge = 12,
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

  const [params, setParams] = useState<RickettsParametersMap>(() => {
    if (data?.parameters) {
      return { ...DEFAULT_RICKETTS_PARAMS, ...data.parameters };
    }
    return DEFAULT_RICKETTS_PARAMS;
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

  const generateSummary = (
    currentParams: RickettsParametersMap,
    age: number,
    stage: 'pre' | 'mid' | 'post'
  ): string => {
    const stageLabel =
      stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';

    const getVal = (k: RickettsParameterKey): number | null => {
      const v = currentParams[k]?.[stage];
      if (v === '' || v === undefined || isNaN(Number(v))) return null;
      return Number(v);
    };

    const fa = getVal('facialAxis');
    const fd = getVal('facialDepth');
    const mp = getVal('mandibularPlaneAngle');
    const conv = getVal('convexityPointA');
    const liMm = getVal('lowerIncisorToAPogMm');
    const liDeg = getVal('lowerIncisorToAPogDeg');
    const umPtv = getVal('upperMolarToPtv');
    const eLine = getVal('lowerLipToEPlane');

    const totalEntered = [fa, fd, mp, conv, liMm, liDeg, umPtv, eLine].filter((v) => v !== null).length;
    if (totalEntered === 0) {
      return `Please enter Ricketts Cephalometric measurements to auto-generate diagnostic conclusion.`;
    }

    const sentences: string[] = [];

    // 1. Facial Biotype & Growth Direction (Facial Axis, Facial Depth, Mandibular Plane)
    if (fa !== null || fd !== null || mp !== null) {
      let isDolicho = false;
      let isBrachy = false;
      if ((fa !== null && fa < 86.5) || (mp !== null && mp > 30.5) || (fd !== null && fd < 84)) isDolicho = true;
      if ((fa !== null && fa > 93.5) || (mp !== null && mp < 21.5) || (fd !== null && fd > 90)) isBrachy = true;

      if (isDolicho && !isBrachy) {
        sentences.push(`Dolichofacial vertical growth biotype with downward-backward mandibular rotation (Facial Axis: ${fa ?? '-'}°, Facial Depth: ${fd ?? '-'}°, MP Angle: ${mp ?? '-'}°).`);
      } else if (isBrachy && !isDolicho) {
        sentences.push(`Brachyfacial horizontal growth biotype with strong forward mandibular projection (Facial Axis: ${fa ?? '-'}°, Facial Depth: ${fd ?? '-'}°, MP Angle: ${mp ?? '-'}°).`);
      } else {
        sentences.push(`Mesofacial normodivergent facial growth pattern (Facial Axis: ${fa ?? 90}°, Facial Depth: ${fd ?? 87}°, MP Angle: ${mp ?? 26}°).`);
      }
    }

    // 2. Skeletal Convexity of Point A
    if (conv !== null) {
      if (conv > 4) {
        sentences.push(`Severe skeletal profile convexity (Point A Convexity: +${conv} mm) indicative of Class II basal discrepancy.`);
      } else if (conv < 0) {
        sentences.push(`Skeletal profile concavity (Point A Convexity: ${conv} mm) indicative of Class III skeletal pattern.`);
      } else {
        sentences.push(`Harmonious straight-to-mildly convex skeletal profile (Point A Convexity: +${conv} mm).`);
      }
    }

    // 3. Dentoalveolar (Lower Incisor to A-Pog, Upper Molar to PTV)
    const dentalParts: string[] = [];
    if (liMm !== null || liDeg !== null) {
      const isProt = (liMm !== null && liMm > 3) || (liDeg !== null && liDeg > 26);
      const isRetr = (liMm !== null && liMm < -1) || (liDeg !== null && liDeg < 18);
      if (isProt) dentalParts.push(`lower incisor protrusion/proclination relative to A-Pog (${liMm ?? '-'} mm / ${liDeg ?? '-'}°)`);
      else if (isRetr) dentalParts.push(`lower incisor retrusion relative to A-Pog (${liMm ?? '-'} mm / ${liDeg ?? '-'}°)`);
      else dentalParts.push(`well-positioned lower incisors (${liMm ?? 1} mm / ${liDeg ?? 22}°)`);
    }
    if (umPtv !== null) {
      const normPtv = age + 3;
      if (umPtv > normPtv + 2) dentalParts.push(`maxillary first molar mesial migration/protrusion (${umPtv} mm vs expected ${normPtv} mm to PTV)`);
      else if (umPtv < normPtv - 2) dentalParts.push(`maxillary first molar distal position (${umPtv} mm vs expected ${normPtv} mm to PTV)`);
      else dentalParts.push(`ideal maxillary molar sagittal position (${umPtv} mm to PTV)`);
    }
    if (dentalParts.length > 0) {
      sentences.push(`Dentoalveolar analysis demonstrates ${dentalParts.join(' and ')}.`);
    }

    // 4. Esthetic Plane (E-Line)
    if (eLine !== null) {
      if (eLine > 0) {
        sentences.push(`Esthetic analysis indicates lower lip protrusion (+${eLine} mm relative to Ricketts E-Line).`);
      } else if (eLine < -4) {
        sentences.push(`Esthetic analysis indicates lower lip retrusion (${eLine} mm relative to Ricketts E-Line).`);
      } else {
        sentences.push(`Esthetic analysis shows harmonious lower lip balance (${eLine} mm relative to Ricketts E-Line).`);
      }
    }

    return `Ricketts Analysis Summary (${stageLabel}, Age ${age}y): ${sentences.join(' ')}`;
  };

  const handleValueChange = (key: RickettsParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updatedParams: RickettsParametersMap = {
      ...params,
      [key]: {
        ...params[key],
        [stage]: newNumber,
      },
    };

    setParams(updatedParams);
    const updatedConclusion = generateSummary(updatedParams, patientAge, stage);

    if (onChange) {
      onChange({
        parameters: updatedParams,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const handleReset = () => {
    const emptyParams: RickettsParametersMap = { ...DEFAULT_RICKETTS_PARAMS };
    setParams(emptyParams);
    const emptySummary = `Please enter measurement values to auto-generate Ricketts Cephalometric diagnostic conclusion.`;
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

    RICKETTS_PARAMETERS_META.forEach((meta) => {
      const val = params[meta.key]?.[stageKey];
      if (val !== '' && val !== undefined && !isNaN(Number(val))) {
        const res = meta.evaluateInference(Number(val), patientAge);
        map[meta.key] = res;
      } else {
        map[meta.key] = { inference: 'Not Measured', status: 'empty' };
      }
    });

    return map;
  }, [params, stageKey, patientAge]);

  const activeCount = useMemo(() => {
    return RICKETTS_PARAMETERS_META.filter((m) => {
      const val = params[m.key]?.[stageKey];
      return val !== '' && val !== undefined && !isNaN(Number(val));
    }).length;
  }, [params, stageKey]);

  const abnormalCount = useMemo(() => {
    return Object.values(inferences).filter((inf) => (inf as any)?.status === 'abnormal').length;
  }, [inferences]);

  const diagnosticConclusion = useMemo(() => {
    return generateSummary(params, patientAge, stageKey);
  }, [params, patientAge, stageKey]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(diagnosticConclusion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = ['Chin in Space / Skeletal', 'Convexity', 'Teeth', 'Profile'] as const;

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
                  Ricketts Analysis
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  8 Params
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Esthetic Line, Growth & Teeth Position
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeCount === 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                0/8 Measured
              </span>
            ) : abnormalCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{abnormalCount} Deviations</span>
              </span>
            ) : activeCount === 8 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                <span>{activeCount}/8 Measured</span>
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
                abnormalCount > 0 ? 'bg-amber-500' : activeCount === 8 ? 'bg-emerald-500' : 'bg-teal-500'
              }`}
              style={{ width: `${(activeCount / 8) * 100}%` }}
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
                onClick={() => {
                  setParams(CLASS_I_RICKETTS_NORM);
                  if (onChange) {
                    onChange({
                      parameters: CLASS_I_RICKETTS_NORM,
                      diagnosticConclusion: generateSummary(CLASS_I_RICKETTS_NORM, patientAge, stageKey),
                    });
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
              >
                Class I Norm
              </button>
              <button
                type="button"
                onClick={() => {
                  setParams(CLASS_II_RICKETTS_SAMPLE);
                  if (onChange) {
                    onChange({
                      parameters: CLASS_II_RICKETTS_SAMPLE,
                      diagnosticConclusion: generateSummary(CLASS_II_RICKETTS_SAMPLE, patientAge, stageKey),
                    });
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
              >
                Class II
              </button>
              <button
                type="button"
                onClick={() => {
                  setParams(CLASS_III_RICKETTS_SAMPLE);
                  if (onChange) {
                    onChange({
                      parameters: CLASS_III_RICKETTS_SAMPLE,
                      diagnosticConclusion: generateSummary(CLASS_III_RICKETTS_SAMPLE, patientAge, stageKey),
                    });
                  }
                }}
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

          {/* Parameter Categories */}
          {categories.map((cat) => {
            const catMetas = RICKETTS_PARAMETERS_META.filter((m) => m.category === cat);
            if (catMetas.length === 0) return null;
            return (
              <div key={cat} className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
                  {cat} ({catMetas.length})
                </h5>
                <div className="grid grid-cols-1 gap-3">
                  {catMetas.map((meta) => {
                    const val = params[meta.key]?.[stageKey] ?? '';
                    const inf = inferences[meta.key];
                    return (
                      <CephParameterRow
                        key={meta.key}
                        label={meta.label}
                        norm={meta.normalText(patientAge)}
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
            );
          })}

          {/* AI Clinical Auto-Diagnosis Panel */}
          <CephAutoDiagnosisPanel
            analysisName="Ricketts Analysis"
            parameters={RICKETTS_PARAMETERS_META.map((meta) => {
              const range = meta.getNormalRange(patientAge);
              return {
                parameterKey: meta.key,
                parameterName: meta.label,
                analysisName: 'Ricketts Analysis',
                value: params[meta.key]?.[stageKey] ?? '',
                minNormal: range.minNormal,
                maxNormal: range.maxNormal,
                unit: meta.unit,
                category: meta.category,
              };
            })}
          />
        </div>
      )}
    </div>
  );
};
