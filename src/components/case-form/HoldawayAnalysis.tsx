import React, { useState, useEffect, useMemo } from 'react';
import {
  HoldawayParameterKey,
  HoldawayParametersMap,
  HoldawayAnalysisData,
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
} from 'lucide-react';

export interface HoldawayParameterMeta {
  key: HoldawayParameterKey;
  label: string;
  category: 'Soft Tissue Profile';
  unit: string;
  minRange?: number;
  maxRange?: number;
  step?: number;
  normalText: (anbVal?: number | '') => string;
  getNormalRange: (anbVal?: number | '') => { minNormal: number; maxNormal: number; target?: number };
  evaluateInference: (
    val: number,
    anbVal?: number | ''
  ) => {
    inference: string;
    status: 'normal' | 'abnormal';
  };
}

export const HOLDAWAY_PARAMETERS_META: HoldawayParameterMeta[] = [
  {
    key: 'facialContourAngle',
    label: '1. Facial Contour Angle',
    category: 'Soft Tissue Profile',
    unit: '°',
    minRange: -10,
    maxRange: 30,
    step: 0.5,
    normalText: () => '8° to 10°',
    getNormalRange: () => ({ minNormal: 8, maxNormal: 10 }),
    evaluateInference: (val: number) => {
      if (val > 10) return { inference: 'Convex Soft Tissue Profile', status: 'abnormal' };
      if (val < 8) return { inference: 'Concave Soft Tissue Profile', status: 'abnormal' };
      return { inference: 'Straight / Balanced Soft Tissue Profile', status: 'normal' };
    },
  },
  {
    key: 'upperLipStrain',
    label: '2. Upper Lip Strain',
    category: 'Soft Tissue Profile',
    unit: 'mm',
    minRange: 0,
    maxRange: 15,
    step: 0.5,
    normalText: () => '3 mm',
    getNormalRange: () => ({ minNormal: 3, maxNormal: 3 }),
    evaluateInference: (val: number) => {
      if (val > 3) return { inference: 'Excessive Upper Lip Strain', status: 'abnormal' };
      if (val < 3) return { inference: 'Minimal Upper Lip Strain', status: 'abnormal' };
      return { inference: 'Normal Upper Lip Strain', status: 'normal' };
    },
  },
  {
    key: 'softTissueChinThickness',
    label: '3. Soft Tissue Chin Thickness',
    category: 'Soft Tissue Profile',
    unit: 'mm',
    minRange: 2,
    maxRange: 25,
    step: 0.5,
    normalText: () => '10 to 12 mm',
    getNormalRange: () => ({ minNormal: 10, maxNormal: 12 }),
    evaluateInference: (val: number) => {
      if (val > 12) return { inference: 'Increased Soft Tissue Chin Thickness', status: 'abnormal' };
      if (val < 10) return { inference: 'Deficient Soft Tissue Chin Thickness', status: 'abnormal' };
      return { inference: 'Normal Soft Tissue Chin Thickness', status: 'normal' };
    },
  },
  {
    key: 'subnasaleToHLine',
    label: '4. Subnasale to H-Line',
    category: 'Soft Tissue Profile',
    unit: 'mm',
    minRange: -5,
    maxRange: 20,
    step: 0.5,
    normalText: () => '3 to 7 mm',
    getNormalRange: () => ({ minNormal: 3, maxNormal: 7 }),
    evaluateInference: (val: number) => {
      if (val > 7) return { inference: 'Subnasale Protrusion / Midface Prominence', status: 'abnormal' };
      if (val < 3) return { inference: 'Subnasale Retrusion', status: 'abnormal' };
      return { inference: 'Normal Subnasale Relationship', status: 'normal' };
    },
  },
  {
    key: 'upperLipToHLine',
    label: '5. Upper Lip to H-Line',
    category: 'Soft Tissue Profile',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: () => '1 to 2 mm',
    getNormalRange: () => ({ minNormal: 1, maxNormal: 2 }),
    evaluateInference: (val: number) => {
      if (val > 2) return { inference: 'Upper Lip Protrusion relative to H-Line', status: 'abnormal' };
      if (val < 1) return { inference: 'Upper Lip Retrusion relative to H-Line', status: 'abnormal' };
      return { inference: 'Balanced Upper Lip Position', status: 'normal' };
    },
  },
  {
    key: 'lowerLipToHLine',
    label: '6. Lower Lip to H-Line',
    category: 'Soft Tissue Profile',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: () => '0 to 0.5 mm',
    getNormalRange: () => ({ minNormal: 0, maxNormal: 0.5 }),
    evaluateInference: (val: number) => {
      if (val > 0.5) return { inference: 'Lower Lip Protrusion relative to H-Line', status: 'abnormal' };
      if (val < 0) return { inference: 'Lower Lip Retrusion relative to H-Line', status: 'abnormal' };
      return { inference: 'Balanced Lower Lip Position', status: 'normal' };
    },
  },
  {
    key: 'softTissueFacialAngle',
    label: '7. Soft Tissue Facial Angle',
    category: 'Soft Tissue Profile',
    unit: '°',
    minRange: 60,
    maxRange: 120,
    step: 0.5,
    normalText: () => '91° ± 7° (84° - 98°)',
    getNormalRange: () => ({ minNormal: 84, maxNormal: 98 }),
    evaluateInference: (val: number) => {
      if (val > 98) return { inference: 'Prominent Soft Tissue Chin / Class III Profile', status: 'abnormal' };
      if (val < 84) return { inference: 'Retrusive Soft Tissue Chin / Class II Profile', status: 'abnormal' };
      return { inference: 'Normal Soft Tissue Facial Angle', status: 'normal' };
    },
  },
  {
    key: 'hAngle',
    label: '8. H-Angle (H-Line to NB Line)',
    category: 'Soft Tissue Profile',
    unit: '°',
    minRange: 0,
    maxRange: 30,
    step: 0.5,
    normalText: (anbVal) => {
      if (anbVal !== undefined && anbVal !== '' && !isNaN(Number(anbVal))) {
        const target = 7 + Number(anbVal);
        return `7° to 15° (Target: ${target}° for ANB ${anbVal}°)`;
      }
      return '7° to 15° (Ideal: 10°)';
    },
    getNormalRange: (anbVal) => {
      if (anbVal !== undefined && anbVal !== '' && !isNaN(Number(anbVal))) {
        const target = 7 + Number(anbVal);
        return {
          minNormal: Math.max(4, target - 3),
          maxNormal: target + 3,
          target,
        };
      }
      return { minNormal: 7, maxNormal: 15, target: 10 };
    },
    evaluateInference: (val: number, anbVal) => {
      const { minNormal, maxNormal } =
        anbVal !== undefined && anbVal !== '' && !isNaN(Number(anbVal))
          ? {
              minNormal: Math.max(4, 7 + Number(anbVal) - 3),
              maxNormal: 7 + Number(anbVal) + 3,
            }
          : { minNormal: 7, maxNormal: 15 };

      if (val > maxNormal)
        return { inference: 'Increased H-Angle / Soft Tissue Class II Tendency', status: 'abnormal' };
      if (val < minNormal)
        return { inference: 'Decreased H-Angle / Soft Tissue Class III Tendency', status: 'abnormal' };
      return { inference: 'Harmonious Profile Angle', status: 'normal' };
    },
  },
];

export const DEFAULT_HOLDAWAY_PARAMS: HoldawayParametersMap = {
  facialContourAngle: { pre: '', mid: '', post: '' },
  upperLipStrain: { pre: '', mid: '', post: '' },
  softTissueChinThickness: { pre: '', mid: '', post: '' },
  subnasaleToHLine: { pre: '', mid: '', post: '' },
  upperLipToHLine: { pre: '', mid: '', post: '' },
  lowerLipToHLine: { pre: '', mid: '', post: '' },
  softTissueFacialAngle: { pre: '', mid: '', post: '' },
  hAngle: { pre: '', mid: '', post: '' },
};

const CLASS_I_HOLDAWAY_NORM: HoldawayParametersMap = {
  facialContourAngle: { pre: 9, mid: 9, post: 9 },
  upperLipStrain: { pre: 3, mid: 3, post: 3 },
  softTissueChinThickness: { pre: 11, mid: 11, post: 11 },
  subnasaleToHLine: { pre: 5, mid: 5, post: 5 },
  upperLipToHLine: { pre: 1.5, mid: 1.5, post: 1.5 },
  lowerLipToHLine: { pre: 0.2, mid: 0.2, post: 0.2 },
  softTissueFacialAngle: { pre: 91, mid: 91, post: 91 },
  hAngle: { pre: 10, mid: 10, post: 10 },
};

interface HoldawayAnalysisProps {
  data?: HoldawayAnalysisData;
  steinersAnalysis?: SteinersAnalysisData;
  onChange?: (updatedData: HoldawayAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
}

export const HoldawayAnalysis: React.FC<HoldawayAnalysisProps> = ({
  data,
  steinersAnalysis,
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

  const activeAnb = steinersAnalysis?.parameters?.anb?.[currentStage];

  const [params, setParams] = useState<HoldawayParametersMap>(() => {
    if (data?.parameters) {
      return { ...DEFAULT_HOLDAWAY_PARAMS, ...data.parameters };
    }
    return DEFAULT_HOLDAWAY_PARAMS;
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
    currentParams: HoldawayParametersMap,
    anbVal: number | '' | undefined,
    stage: 'pre' | 'mid' | 'post'
  ): string => {
    const findings: string[] = [];
    HOLDAWAY_PARAMETERS_META.forEach((meta) => {
      const val = currentParams[meta.key]?.[stage];
      if (val !== '' && val !== undefined && !isNaN(Number(val))) {
        const inf = meta.evaluateInference(Number(val), anbVal);
        if (inf.status === 'abnormal') {
          findings.push(`${meta.label}: ${inf.inference}`);
        }
      }
    });

    const stageLabel =
      stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';

    if (findings.length === 0) {
      return `All measured Holdaway Soft Tissue Analysis values for ${stageLabel} stage fall within standard normative ranges.`;
    }

    return `Holdaway Summary (${stageLabel}): Patient presents with ${findings.join(', ')}.`;
  };

  const handleValueChange = (key: HoldawayParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updatedParams: HoldawayParametersMap = {
      ...params,
      [key]: {
        ...params[key],
        [stage]: newNumber,
      },
    };

    setParams(updatedParams);
    const updatedConclusion = generateSummary(updatedParams, activeAnb, stage);

    if (onChange) {
      onChange({
        parameters: updatedParams,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const handleReset = () => {
    const emptyParams: HoldawayParametersMap = { ...DEFAULT_HOLDAWAY_PARAMS };
    setParams(emptyParams);
    const emptySummary = `Please enter measurement values to auto-generate Holdaway Cephalometric diagnostic conclusion.`;
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

    HOLDAWAY_PARAMETERS_META.forEach((meta) => {
      const val = params[meta.key]?.[stageKey];
      if (val !== '' && val !== undefined && !isNaN(Number(val))) {
        const res = meta.evaluateInference(Number(val), activeAnb);
        map[meta.key] = res;
      } else {
        map[meta.key] = { inference: 'Not Measured', status: 'empty' };
      }
    });

    return map;
  }, [params, stageKey, activeAnb]);

  const activeCount = useMemo(() => {
    return HOLDAWAY_PARAMETERS_META.filter((m) => {
      const val = params[m.key]?.[stageKey];
      return val !== '' && val !== undefined && !isNaN(Number(val));
    }).length;
  }, [params, stageKey]);

  const abnormalCount = useMemo(() => {
    return Object.values(inferences).filter((inf) => (inf as any)?.status === 'abnormal').length;
  }, [inferences]);

  const diagnosticConclusion = useMemo(() => {
    return generateSummary(params, activeAnb, stageKey);
  }, [params, activeAnb, stageKey]);

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
                  Holdaway Soft Tissue Analysis
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  8 Params
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Soft Tissue Profile & H-Line Harmony
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
                  setParams(CLASS_I_HOLDAWAY_NORM);
                  if (onChange) {
                    onChange({
                      parameters: CLASS_I_HOLDAWAY_NORM,
                      diagnosticConclusion: generateSummary(CLASS_I_HOLDAWAY_NORM, activeAnb, stageKey),
                    });
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
              >
                Balanced Norms
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

          {/* Parameters List */}
          <div className="space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
              Soft Tissue Parameters (8)
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {HOLDAWAY_PARAMETERS_META.map((meta) => {
                const val = params[meta.key]?.[stageKey] ?? '';
                const inf = inferences[meta.key];
                return (
                  <CephParameterRow
                    key={meta.key}
                    label={meta.label}
                    norm={meta.normalText(activeAnb)}
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
            analysisName="Holdaway Analysis"
            parameters={HOLDAWAY_PARAMETERS_META.map((meta) => {
              const range = meta.getNormalRange(activeAnb);
              return {
                parameterKey: meta.key,
                parameterName: meta.label,
                analysisName: 'Holdaway Analysis',
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
