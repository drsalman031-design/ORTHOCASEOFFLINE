import React, { useState, useEffect, useMemo } from 'react';
import {
  SchwarzTweedParameterKey,
  SchwarzTweedParametersMap,
  SchwarzTweedAnalysisData,
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

export interface SchwarzTweedParameterMeta {
  key: SchwarzTweedParameterKey;
  label: string;
  category: 'Schwarz Analysis' | 'Tweed Analysis Triangle';
  unit: string;
  normalText: string;
  minRange?: number;
  maxRange?: number;
  step?: number;
  getNormalRange: () => { minNormal: number; maxNormal: number };
  evaluateInference: (val: number) => {
    inference: string;
    status: 'normal' | 'abnormal';
  };
}

export const SCHWARZ_TWEED_PARAMETERS_META: SchwarzTweedParameterMeta[] = [
  // SCHWARZ ANALYSIS (4)
  {
    key: 'seNLength',
    label: '1. Se-N (Cranial Base Length)',
    category: 'Schwarz Analysis',
    unit: 'mm',
    normalText: '68 mm (66 - 70 mm)',
    minRange: 40,
    maxRange: 100,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 66, maxNormal: 70 }),
    evaluateInference: (val: number) => {
      if (val > 70) return { inference: 'Increased Anterior Cranial Base Length', status: 'abnormal' };
      if (val < 66) return { inference: 'Decreased Anterior Cranial Base Length', status: 'abnormal' };
      return { inference: 'Normal Cranial Base Length', status: 'normal' };
    },
  },
  {
    key: 'mandibularLength',
    label: '2. Mandibular Length',
    category: 'Schwarz Analysis',
    unit: 'mm',
    normalText: '71 mm (69 - 73 mm)',
    minRange: 40,
    maxRange: 110,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 69, maxNormal: 73 }),
    evaluateInference: (val: number) => {
      if (val > 73) return { inference: 'Increased Mandibular Length / Macrognathia', status: 'abnormal' };
      if (val < 69) return { inference: 'Decreased Mandibular Length / Micrognathia', status: 'abnormal' };
      return { inference: 'Normal Mandibular Length', status: 'normal' };
    },
  },
  {
    key: 'ascendingRamusLength',
    label: '3. Ascending Ramus Length',
    category: 'Schwarz Analysis',
    unit: 'mm',
    normalText: '50 mm (48 - 52 mm)',
    minRange: 20,
    maxRange: 80,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 48, maxNormal: 52 }),
    evaluateInference: (val: number) => {
      if (val > 52) return { inference: 'Increased Ramus Height', status: 'abnormal' };
      if (val < 48) return { inference: 'Decreased Ramus Height', status: 'abnormal' };
      return { inference: 'Normal Ramus Height', status: 'normal' };
    },
  },
  {
    key: 'maxillaryLength',
    label: '4. Maxillary Length',
    category: 'Schwarz Analysis',
    unit: 'mm',
    normalText: '47.5 mm (45.5 - 49.5 mm)',
    minRange: 20,
    maxRange: 80,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 45.5, maxNormal: 49.5 }),
    evaluateInference: (val: number) => {
      if (val > 49.5) return { inference: 'Increased Maxillary Length', status: 'abnormal' };
      if (val < 45.5) return { inference: 'Decreased Maxillary Length', status: 'abnormal' };
      return { inference: 'Normal Maxillary Length', status: 'normal' };
    },
  },

  // TWEED ANALYSIS TRIANGLE (3)
  {
    key: 'fmpa',
    label: '5. Frankfort Mandibular Plane Angle (FMPA)',
    category: 'Tweed Analysis Triangle',
    unit: '°',
    normalText: '25° (22° - 28°)',
    minRange: 5,
    maxRange: 55,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 22, maxNormal: 28 }),
    evaluateInference: (val: number) => {
      if (val > 28) return { inference: 'High Mandibular Plane Angle / Hyperdivergent Pattern', status: 'abnormal' };
      if (val < 22) return { inference: 'Low Mandibular Plane Angle / Hypodivergent Pattern', status: 'abnormal' };
      return { inference: 'Normodivergent Facial Pattern', status: 'normal' };
    },
  },
  {
    key: 'fmia',
    label: '6. Frankfort Mandibular Incisor Angle (FMIA)',
    category: 'Tweed Analysis Triangle',
    unit: '°',
    normalText: '65° (62° - 68°)',
    minRange: 35,
    maxRange: 95,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 62, maxNormal: 68 }),
    evaluateInference: (val: number) => {
      if (val < 62) return { inference: 'Lower Incisor Proclination / Anterior Discrepancy', status: 'abnormal' };
      if (val > 68) return { inference: 'Lower Incisor Retroclination', status: 'abnormal' };
      return { inference: 'Normal FMIA Balance', status: 'normal' };
    },
  },
  {
    key: 'impa',
    label: '7. Incisor Mandibular Plane Angle (IMPA)',
    category: 'Tweed Analysis Triangle',
    unit: '°',
    normalText: '90° (87° - 93°)',
    minRange: 65,
    maxRange: 120,
    step: 0.5,
    getNormalRange: () => ({ minNormal: 87, maxNormal: 93 }),
    evaluateInference: (val: number) => {
      if (val > 93) return { inference: 'Proclined Lower Incisors (IMPA > 93°)', status: 'abnormal' };
      if (val < 87) return { inference: 'Retroclined Lower Incisors (IMPA < 87°)', status: 'abnormal' };
      return { inference: 'Normal IMPA Position', status: 'normal' };
    },
  },
];

export const DEFAULT_SCHWARZ_TWEED_PARAMS: SchwarzTweedParametersMap = {
  seNLength: { pre: '', mid: '', post: '' },
  mandibularLength: { pre: '', mid: '', post: '' },
  ascendingRamusLength: { pre: '', mid: '', post: '' },
  maxillaryLength: { pre: '', mid: '', post: '' },
  fmpa: { pre: '', mid: '', post: '' },
  impa: { pre: '', mid: '', post: '' },
  fmia: { pre: '', mid: '', post: '' },
};

const NORM_SCHWARZ_TWEED_SAMPLE: SchwarzTweedParametersMap = {
  seNLength: { pre: 68, mid: 68, post: 68 },
  mandibularLength: { pre: 71, mid: 71, post: 71 },
  ascendingRamusLength: { pre: 50, mid: 50, post: 50 },
  maxillaryLength: { pre: 47.5, mid: 47.5, post: 47.5 },
  fmpa: { pre: 25, mid: 25, post: 25 },
  fmia: { pre: 65, mid: 65, post: 65 },
  impa: { pre: 90, mid: 90, post: 90 },
};

interface SchwarzTweedAnalysisProps {
  data?: SchwarzTweedAnalysisData;
  onChange?: (updatedData: SchwarzTweedAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
}

export const SchwarzTweedAnalysis: React.FC<SchwarzTweedAnalysisProps> = ({
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

  const [params, setParams] = useState<SchwarzTweedParametersMap>(() => {
    if (data?.parameters) {
      return { ...DEFAULT_SCHWARZ_TWEED_PARAMS, ...data.parameters };
    }
    return DEFAULT_SCHWARZ_TWEED_PARAMS;
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
    currentParams: SchwarzTweedParametersMap,
    stage: 'pre' | 'mid' | 'post'
  ): string => {
    const findings: string[] = [];
    SCHWARZ_TWEED_PARAMETERS_META.forEach((meta) => {
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
      return `All measured Schwarz & Tweed Analysis values for ${stageLabel} stage fall within standard normative ranges.`;
    }

    return `Schwarz & Tweed Summary (${stageLabel}): Patient presents with ${findings.join(', ')}.`;
  };

  const handleValueChange = (key: SchwarzTweedParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updatedParams: SchwarzTweedParametersMap = {
      ...params,
      [key]: {
        ...params[key],
        [stage]: newNumber,
      },
    };

    setParams(updatedParams);
    const updatedConclusion = generateSummary(updatedParams, stage);

    if (onChange) {
      onChange({
        parameters: updatedParams,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const handleReset = () => {
    const emptyParams: SchwarzTweedParametersMap = { ...DEFAULT_SCHWARZ_TWEED_PARAMS };
    setParams(emptyParams);
    const emptySummary = `Please enter measurement values to auto-generate Schwarz & Tweed diagnostic conclusion.`;
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

    SCHWARZ_TWEED_PARAMETERS_META.forEach((meta) => {
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
    return SCHWARZ_TWEED_PARAMETERS_META.filter((m) => {
      const val = params[m.key]?.[stageKey];
      return val !== '' && val !== undefined && !isNaN(Number(val));
    }).length;
  }, [params, stageKey]);

  const abnormalCount = useMemo(() => {
    return Object.values(inferences).filter((inf) => (inf as any)?.status === 'abnormal').length;
  }, [inferences]);

  const diagnosticConclusion = useMemo(() => {
    return generateSummary(params, stageKey);
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
                  Schwarz & Tweed Analysis
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  7 Params
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Schwarz Cranial/Mandibular & Tweed Triangle
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeCount === 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                0/7 Measured
              </span>
            ) : abnormalCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{abnormalCount} Deviations</span>
              </span>
            ) : activeCount === 7 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                <span>{activeCount}/7 Measured</span>
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
                abnormalCount > 0 ? 'bg-amber-500' : activeCount === 7 ? 'bg-emerald-500' : 'bg-teal-500'
              }`}
              style={{ width: `${(activeCount / 7) * 100}%` }}
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
                  setParams(NORM_SCHWARZ_TWEED_SAMPLE);
                  if (onChange) {
                    onChange({
                      parameters: NORM_SCHWARZ_TWEED_SAMPLE,
                      diagnosticConclusion: generateSummary(NORM_SCHWARZ_TWEED_SAMPLE, stageKey),
                    });
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
              >
                Standard Norms
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

          {/* Schwarz Analysis Section */}
          <div className="space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
              Schwarz Analysis (4)
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {SCHWARZ_TWEED_PARAMETERS_META.filter((m) => m.category === 'Schwarz Analysis').map((meta) => {
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

          {/* Tweed Analysis Triangle Section */}
          <div className="space-y-3 pt-2">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
              Tweed Analysis Triangle (3)
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {SCHWARZ_TWEED_PARAMETERS_META.filter((m) => m.category === 'Tweed Analysis Triangle').map((meta) => {
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
            analysisName="Schwarz & Tweed Analysis"
            parameters={SCHWARZ_TWEED_PARAMETERS_META.map((meta) => {
              const range = meta.getNormalRange();
              return {
                parameterKey: meta.key,
                parameterName: meta.label,
                analysisName: 'Schwarz & Tweed Analysis',
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
