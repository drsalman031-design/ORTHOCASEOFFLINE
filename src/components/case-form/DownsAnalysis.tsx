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
    label: 'Facial Angle',
    category: 'Skeletal',
    normalText: '82° to 95°',
    unit: '°',
    minNormal: 82,
    maxNormal: 95,
    minRange: 50,
    maxRange: 120,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val < 82) return { inference: 'Retrognathic Mandible', status: 'abnormal' };
      if (val > 95) return { inference: 'Prognathic Mandible', status: 'abnormal' };
      return { inference: 'Orthognathic Mandible (Normal)', status: 'normal' };
    },
  },
  {
    key: 'angleConvexity',
    label: 'Angle of Convexity',
    category: 'Skeletal',
    normalText: '-8.5° to 10°',
    unit: '°',
    minNormal: -8.5,
    maxNormal: 10,
    minRange: -30,
    maxRange: 40,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 10) return { inference: 'Convex Profile (Class II)', status: 'abnormal' };
      if (val < -8.5) return { inference: 'Concave Profile (Class III)', status: 'abnormal' };
      return { inference: 'Straight Profile (Class I Normal)', status: 'normal' };
    },
  },
  {
    key: 'abPlane',
    label: 'A-B Plane',
    category: 'Skeletal',
    normalText: '-9° to 0°',
    unit: '°',
    minNormal: -9,
    maxNormal: 0,
    minRange: -25,
    maxRange: 15,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 0) return { inference: 'Class III Skeletal Tendency', status: 'abnormal' };
      if (val < -9) return { inference: 'Class II Skeletal Tendency', status: 'abnormal' };
      return { inference: 'Normal Skeletal Relationship', status: 'normal' };
    },
  },
  {
    key: 'mandibularPlaneAngle',
    label: 'Mandibular Plane Angle',
    category: 'Skeletal',
    normalText: '17° to 28°',
    unit: '°',
    minNormal: 17,
    maxNormal: 28,
    minRange: 5,
    maxRange: 55,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 28) return { inference: 'Hyperdivergent Pattern (High Angle)', status: 'abnormal' };
      if (val < 17) return { inference: 'Hypodivergent Pattern (Low Angle)', status: 'abnormal' };
      return { inference: 'Normodivergent Pattern', status: 'normal' };
    },
  },
  {
    key: 'yAxis',
    label: 'Y-Axis (Growth Axis)',
    category: 'Skeletal',
    normalText: '53° to 66°',
    unit: '°',
    minNormal: 53,
    maxNormal: 66,
    minRange: 35,
    maxRange: 85,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 66) return { inference: 'Vertical Growth Vector', status: 'abnormal' };
      if (val < 53) return { inference: 'Horizontal Growth Vector', status: 'abnormal' };
      return { inference: 'Normal Growth Vector', status: 'normal' };
    },
  },

  // Dental Parameters
  {
    key: 'cantOfOcclusion',
    label: 'Cant of Occlusion',
    category: 'Dental',
    normalText: '1.5° to 14°',
    unit: '°',
    minNormal: 1.5,
    maxNormal: 14,
    minRange: -10,
    maxRange: 30,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 14) return { inference: 'Steep Occlusal Plane', status: 'abnormal' };
      if (val < 1.5) return { inference: 'Flat Occlusal Plane', status: 'abnormal' };
      return { inference: 'Normal Occlusal Plane Cant', status: 'normal' };
    },
  },
  {
    key: 'lowerIncisorToOcclusal',
    label: 'Lower Incisors to Occlusal Plane',
    category: 'Dental',
    normalText: '3.5° to 20°',
    unit: '°',
    minNormal: 3.5,
    maxNormal: 20,
    minRange: -10,
    maxRange: 40,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 20) return { inference: 'Proclined Lower Incisors', status: 'abnormal' };
      if (val < 3.5) return { inference: 'Retroclined Lower Incisors', status: 'abnormal' };
      return { inference: 'Normal Lower Incisor Inclination', status: 'normal' };
    },
  },
  {
    key: 'impa',
    label: 'Lower Incisors to Mandibular Plane (IMPA)',
    category: 'Dental',
    normalText: '-8.7° to 7°',
    unit: '°',
    minNormal: -8.7,
    maxNormal: 7,
    minRange: -25,
    maxRange: 30,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 7) return { inference: 'Lower Incisor Proclination', status: 'abnormal' };
      if (val < -8.7) return { inference: 'Lower Incisor Retroclination', status: 'abnormal' };
      return { inference: 'Normal IMPA', status: 'normal' };
    },
  },
  {
    key: 'interincisalAngle',
    label: 'Interincisal Angle',
    category: 'Dental',
    normalText: '130° to 150.5°',
    unit: '°',
    minNormal: 130,
    maxNormal: 150.5,
    minRange: 90,
    maxRange: 180,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val < 130) return { inference: 'Bimaxillary Protrusion / Proclined Incisors', status: 'abnormal' };
      if (val > 150.5) return { inference: 'Retroclined Incisors', status: 'abnormal' };
      return { inference: 'Normal Interincisal Angle', status: 'normal' };
    },
  },
  {
    key: 'upperIncisalAngle',
    label: 'Upper Incisal Angle (1 to A-Po)',
    category: 'Dental',
    normalText: '-1 to 5 mm',
    unit: 'mm',
    minNormal: -1,
    maxNormal: 5,
    minRange: -10,
    maxRange: 20,
    step: 0.5,
    evaluateInference: (val: number) => {
      if (val > 5) return { inference: 'Upper Incisor Protrusion', status: 'abnormal' };
      if (val < -1) return { inference: 'Upper Incisor Retrusion', status: 'abnormal' };
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
  facialAngle: { pre: 88, mid: 88, post: 88 },
  angleConvexity: { pre: 0, mid: 0, post: 0 },
  abPlane: { pre: -4.5, mid: -4.5, post: -4.5 },
  mandibularPlaneAngle: { pre: 22, mid: 22, post: 22 },
  yAxis: { pre: 59, mid: 59, post: 59 },
  cantOfOcclusion: { pre: 9, mid: 9, post: 9 },
  lowerIncisorToOcclusal: { pre: 14, mid: 14, post: 14 },
  impa: { pre: 1.4, mid: 1.4, post: 1.4 },
  interincisalAngle: { pre: 135, mid: 135, post: 135 },
  upperIncisalAngle: { pre: 2.7, mid: 2.7, post: 2.7 },
};

const CLASS_II_SAMPLE: DownsParametersMap = {
  facialAngle: { pre: 78, mid: 81, post: 84 },
  angleConvexity: { pre: 15, mid: 11, post: 6 },
  abPlane: { pre: -12, mid: -8, post: -5 },
  mandibularPlaneAngle: { pre: 32, mid: 30, post: 27 },
  yAxis: { pre: 68, mid: 65, post: 62 },
  cantOfOcclusion: { pre: 16, mid: 13, post: 10 },
  lowerIncisorToOcclusal: { pre: 22, mid: 18, post: 14 },
  impa: { pre: 10, mid: 6, post: 2 },
  interincisalAngle: { pre: 118, mid: 126, post: 134 },
  upperIncisalAngle: { pre: 8, mid: 5, post: 3 },
};

const CLASS_III_SAMPLE: DownsParametersMap = {
  facialAngle: { pre: 97, mid: 94, post: 91 },
  angleConvexity: { pre: -12, mid: -7, post: -2 },
  abPlane: { pre: 3, mid: 0, post: -3 },
  mandibularPlaneAngle: { pre: 14, mid: 18, post: 21 },
  yAxis: { pre: 50, mid: 54, post: 57 },
  cantOfOcclusion: { pre: 0, mid: 4, post: 8 },
  lowerIncisorToOcclusal: { pre: 1, mid: 6, post: 11 },
  impa: { pre: -11, mid: -6, post: -1 },
  interincisalAngle: { pre: 155, mid: 146, post: 138 },
  upperIncisalAngle: { pre: -3, mid: 0, post: 2 },
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
    const findings: string[] = [];
    DOWNS_PARAMETERS_META.forEach((meta) => {
      const val = currentParams[meta.key]?.[stage];
      if (val !== '' && val !== undefined && !isNaN(Number(val))) {
        const inf = meta.evaluateInference(Number(val));
        if (inf.status === 'abnormal') {
          findings.push(`${meta.label}: ${inf.inference}`);
        }
      }
    });

    const stageLabel =
      stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';

    if (findings.length === 0) {
      return `All measured Downs Analysis values for ${stageLabel} stage fall within standard normative ranges.`;
    }

    return `Downs Analysis (${stageLabel}): Patient presents with ${findings.join(', ')}.`;
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
                onClick={() => handleLoadSample(CLASS_II_SAMPLE)}
                className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 active:bg-teal-100 border border-slate-200 rounded-xl transition-all shrink-0 cursor-pointer"
              >
                Class II
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
