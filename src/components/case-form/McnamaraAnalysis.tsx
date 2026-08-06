import React, { useState, useEffect, useMemo } from 'react';
import {
  McnamaraParameterKey,
  McnamaraParametersMap,
  McnamaraAnalysisData,
  SizeFrame,
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
  Sliders,
} from 'lucide-react';

export interface McnamaraParameterMeta {
  key: McnamaraParameterKey;
  label: string;
  category:
    | 'Maxilla to Cranial Base'
    | 'Maxilla to Mandible'
    | 'Mandible to Cranial Base'
    | 'Dentition'
    | 'Airway';
  unit: string;
  minRange?: number;
  maxRange?: number;
  step?: number;
  normalText: (frame: SizeFrame) => string;
  getNormalRange: (frame: SizeFrame) => { minNormal: number; maxNormal: number };
  evaluateInference: (
    val: number,
    frame: SizeFrame
  ) => {
    inference: string;
    status: 'normal' | 'abnormal';
  };
}

export const MCNAMARA_PARAMETERS_META: McnamaraParameterMeta[] = [
  // 1. Maxilla to Cranial Base
  {
    key: 'nasolabialAngle',
    label: '1. Nasiolabial Angle',
    category: 'Maxilla to Cranial Base',
    unit: '°',
    minRange: 60,
    maxRange: 140,
    step: 0.5,
    normalText: () => '102° ± 8° (94° - 110°)',
    getNormalRange: () => ({ minNormal: 94, maxNormal: 110 }),
    evaluateInference: (val: number) => {
      if (val < 94) return { inference: 'Acute Nasiolabial Angle / Upper Lip Protrusion', status: 'abnormal' };
      if (val > 110) return { inference: 'Obtuse Nasiolabial Angle / Upper Lip Retrusion', status: 'abnormal' };
      return { inference: 'Normal Lip Profile Angle', status: 'normal' };
    },
  },
  {
    key: 'naPerpToPointA',
    label: '2. Na-perp to Point A',
    category: 'Maxilla to Cranial Base',
    unit: 'mm',
    minRange: -15,
    maxRange: 20,
    step: 0.5,
    normalText: () => '0 to 1 mm',
    getNormalRange: () => ({ minNormal: 0, maxNormal: 1 }),
    evaluateInference: (val: number) => {
      if (val > 1) return { inference: 'Maxillary Skeletal Protrusion', status: 'abnormal' };
      if (val < 0) return { inference: 'Maxillary Skeletal Retrusion', status: 'abnormal' };
      return { inference: 'Normal Maxillary AP Position', status: 'normal' };
    },
  },

  // 2. Maxilla to Mandible
  {
    key: 'mandibularLengthCoGn',
    label: '3. Mandibular Length (Co-Gn)',
    category: 'Maxilla to Mandible',
    unit: 'mm',
    minRange: 70,
    maxRange: 160,
    step: 0.5,
    normalText: (frame: SizeFrame) => (frame === 'small' ? '97-103 mm' : frame === 'medium' ? '105-120 mm' : '121-135 mm'),
    getNormalRange: (frame: SizeFrame) =>
      frame === 'small'
        ? { minNormal: 97, maxNormal: 103 }
        : frame === 'medium'
        ? { minNormal: 105, maxNormal: 120 }
        : { minNormal: 121, maxNormal: 135 },
    evaluateInference: (val: number, frame: SizeFrame) => {
      const { minNormal, maxNormal } =
        frame === 'small'
          ? { minNormal: 97, maxNormal: 103 }
          : frame === 'medium'
          ? { minNormal: 105, maxNormal: 120 }
          : { minNormal: 121, maxNormal: 135 };
      if (val < minNormal) return { inference: 'Decreased Mandibular Effective Length', status: 'abnormal' };
      if (val > maxNormal) return { inference: 'Increased Mandibular Effective Length', status: 'abnormal' };
      return { inference: 'Normal Mandibular Length', status: 'normal' };
    },
  },
  {
    key: 'maxillaryLengthCoPointA',
    label: '4. Maxillary Length (Co-Point A)',
    category: 'Maxilla to Mandible',
    unit: 'mm',
    minRange: 50,
    maxRange: 130,
    step: 0.5,
    normalText: (frame: SizeFrame) => (frame === 'small' ? '75-82 mm' : frame === 'medium' ? '83-92 mm' : '93-102 mm'),
    getNormalRange: (frame: SizeFrame) =>
      frame === 'small'
        ? { minNormal: 75, maxNormal: 82 }
        : frame === 'medium'
        ? { minNormal: 83, maxNormal: 92 }
        : { minNormal: 93, maxNormal: 102 },
    evaluateInference: (val: number, frame: SizeFrame) => {
      const { minNormal, maxNormal } =
        frame === 'small'
          ? { minNormal: 75, maxNormal: 82 }
          : frame === 'medium'
          ? { minNormal: 83, maxNormal: 92 }
          : { minNormal: 93, maxNormal: 102 };
      if (val < minNormal) return { inference: 'Decreased Maxillary Effective Length', status: 'abnormal' };
      if (val > maxNormal) return { inference: 'Increased Maxillary Effective Length', status: 'abnormal' };
      return { inference: 'Normal Maxillary Length', status: 'normal' };
    },
  },
  {
    key: 'mandibularPlaneAngle',
    label: '5. Mandibular Plane Angle',
    category: 'Maxilla to Mandible',
    unit: '°',
    minRange: 10,
    maxRange: 50,
    step: 0.5,
    normalText: () => '22° to 28°',
    getNormalRange: () => ({ minNormal: 22, maxNormal: 28 }),
    evaluateInference: (val: number) => {
      if (val < 22) return { inference: 'Hypodivergent / Low Angle Mandibular Plane', status: 'abnormal' };
      if (val > 28) return { inference: 'Hyperdivergent / High Angle Mandibular Plane', status: 'abnormal' };
      return { inference: 'Normal Mandibular Plane Angle', status: 'normal' };
    },
  },

  // 3. Mandible to Cranial Base
  {
    key: 'pogNaPerp',
    label: '6. Pogonion to Na-Perp',
    category: 'Mandible to Cranial Base',
    unit: 'mm',
    minRange: -25,
    maxRange: 15,
    step: 0.5,
    normalText: () => '-2 to 4 mm',
    getNormalRange: () => ({ minNormal: -2, maxNormal: 4 }),
    evaluateInference: (val: number) => {
      if (val < -2) return { inference: 'Mandibular Retrusion (Class II)', status: 'abnormal' };
      if (val > 4) return { inference: 'Mandibular Protrusion (Class III)', status: 'abnormal' };
      return { inference: 'Normal Mandibular Chin Position', status: 'normal' };
    },
  },

  // 4. Dentition
  {
    key: 'upperIncisorToPointA',
    label: '7. Upper Incisor to Point A',
    category: 'Dentition',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: () => '4 to 6 mm',
    getNormalRange: () => ({ minNormal: 4, maxNormal: 6 }),
    evaluateInference: (val: number) => {
      if (val > 6) return { inference: 'Upper Incisor Protrusion', status: 'abnormal' };
      if (val < 4) return { inference: 'Upper Incisor Retrusion', status: 'abnormal' };
      return { inference: 'Normal Upper Incisor Position', status: 'normal' };
    },
  },
  {
    key: 'lowerIncisorToPointA',
    label: '8. Lower Incisor to Point A',
    category: 'Dentition',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: () => '1 to 3 mm',
    getNormalRange: () => ({ minNormal: 1, maxNormal: 3 }),
    evaluateInference: (val: number) => {
      if (val > 3) return { inference: 'Lower Incisor Protrusion', status: 'abnormal' };
      if (val < 1) return { inference: 'Lower Incisor Retrusion', status: 'abnormal' };
      return { inference: 'Normal Lower Incisor Position', status: 'normal' };
    },
  },

  // 5. Airway
  {
    key: 'upperPharynx',
    label: '9. Upper Pharyngeal Airway Width',
    category: 'Airway',
    unit: 'mm',
    minRange: 2,
    maxRange: 35,
    step: 0.5,
    normalText: () => '15 to 20 mm',
    getNormalRange: () => ({ minNormal: 15, maxNormal: 20 }),
    evaluateInference: (val: number) => {
      if (val < 15) return { inference: 'Constricted Upper Airway / Adenoid Hypertrophy Risk', status: 'abnormal' };
      if (val > 20) return { inference: 'Wide Upper Airway', status: 'normal' };
      return { inference: 'Normal Upper Airway Width', status: 'normal' };
    },
  },
  {
    key: 'lowerPharynx',
    label: '10. Lower Pharyngeal Airway Width',
    category: 'Airway',
    unit: 'mm',
    minRange: 2,
    maxRange: 30,
    step: 0.5,
    normalText: () => '11 to 14 mm',
    getNormalRange: () => ({ minNormal: 11, maxNormal: 14 }),
    evaluateInference: (val: number) => {
      if (val < 11) return { inference: 'Constricted Lower Airway / Retroglossal Airway Risk', status: 'abnormal' };
      if (val > 14) return { inference: 'Wide Lower Airway', status: 'normal' };
      return { inference: 'Normal Lower Airway Width', status: 'normal' };
    },
  },
];

export const DEFAULT_MCNAMARA_PARAMS: McnamaraParametersMap = {
  nasolabialAngle: { pre: '', mid: '', post: '' },
  naPerpToPointA: { pre: '', mid: '', post: '' },
  mandibularLengthCoGn: { pre: '', mid: '', post: '' },
  maxillaryLengthCoPointA: { pre: '', mid: '', post: '' },
  maxMandDifference: { pre: '', mid: '', post: '' },
  mandibularPlaneAngle: { pre: '', mid: '', post: '' },
  facialAxis: { pre: '', mid: '', post: '' },
  pogNaPerp: { pre: '', mid: '', post: '' },
  upperIncisorToPointA: { pre: '', mid: '', post: '' },
  lowerIncisorToPointA: { pre: '', mid: '', post: '' },
  upperPharynx: { pre: '', mid: '', post: '' },
  lowerPharynx: { pre: '', mid: '', post: '' },
};

const CLASS_II_MCNAMARA_SAMPLE: McnamaraParametersMap = {
  nasolabialAngle: { pre: 90, mid: 96, post: 102 },
  naPerpToPointA: { pre: 4, mid: 2, post: 1 },
  mandibularLengthCoGn: { pre: 100, mid: 108, post: 114 },
  maxillaryLengthCoPointA: { pre: 90, mid: 88, post: 86 },
  maxMandDifference: { pre: 10, mid: 20, post: 28 },
  mandibularPlaneAngle: { pre: 28, mid: 25, post: 23 },
  facialAxis: { pre: 85, mid: 88, post: 90 },
  pogNaPerp: { pre: -8, mid: -4, post: 1 },
  upperIncisorToPointA: { pre: 9, mid: 6, post: 5 },
  lowerIncisorToPointA: { pre: 5, mid: 3, post: 2 },
  upperPharynx: { pre: 12, mid: 15, post: 17 },
  lowerPharynx: { pre: 9, mid: 11, post: 12 },
};

const CLASS_III_MCNAMARA_SAMPLE: McnamaraParametersMap = {
  nasolabialAngle: { pre: 112, mid: 107, post: 102 },
  naPerpToPointA: { pre: -3, mid: -1, post: 1 },
  mandibularLengthCoGn: { pre: 130, mid: 124, post: 118 },
  maxillaryLengthCoPointA: { pre: 78, mid: 82, post: 86 },
  maxMandDifference: { pre: 52, mid: 42, post: 32 },
  mandibularPlaneAngle: { pre: 32, mid: 28, post: 24 },
  facialAxis: { pre: 92, mid: 91, post: 90 },
  pogNaPerp: { pre: 8, mid: 4, post: 1 },
  upperIncisorToPointA: { pre: 1, mid: 3, post: 5 },
  lowerIncisorToPointA: { pre: -2, mid: 0, post: 2 },
  upperPharynx: { pre: 18, mid: 17, post: 17 },
  lowerPharynx: { pre: 14, mid: 13, post: 13 },
};

interface McnamaraAnalysisProps {
  data?: McnamaraAnalysisData;
  onChange?: (updatedData: McnamaraAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
}

export const McnamaraAnalysis: React.FC<McnamaraAnalysisProps> = ({
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

  const [sizeFrame, setSizeFrame] = useState<SizeFrame>(data?.sizeFrame || 'medium');
  const [params, setParams] = useState<McnamaraParametersMap>(() => {
    if (data?.parameters) {
      return { ...DEFAULT_MCNAMARA_PARAMS, ...data.parameters };
    }
    return DEFAULT_MCNAMARA_PARAMS;
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.parameters) {
      setParams((prev) => ({
        ...prev,
        ...data.parameters,
      }));
    }
    if (data?.sizeFrame) {
      setSizeFrame(data.sizeFrame);
    }
  }, [data?.parameters, data?.sizeFrame]);

  const generateSummary = (
    currentParams: McnamaraParametersMap,
    frame: SizeFrame,
    stage: 'pre' | 'mid' | 'post'
  ): string => {
    const findings: string[] = [];
    MCNAMARA_PARAMETERS_META.forEach((meta) => {
      const val = currentParams[meta.key]?.[stage];
      if (val !== '' && val !== undefined && !isNaN(Number(val))) {
        const inf = meta.evaluateInference(Number(val), frame);
        if (inf.status === 'abnormal') {
          findings.push(`${meta.label}: ${inf.inference}`);
        }
      }
    });

    const stageLabel =
      stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';

    if (findings.length === 0) {
      return `All measured McNamara Analysis values for ${stageLabel} stage fall within standard normative ranges (${frame.toUpperCase()} frame).`;
    }

    return `McNamara Summary (${stageLabel}, ${frame.toUpperCase()} frame): Patient presents with ${findings.join(', ')}.`;
  };

  const handleValueChange = (key: McnamaraParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updatedParams: McnamaraParametersMap = {
      ...params,
      [key]: {
        ...params[key],
        [stage]: newNumber,
      },
    };

    setParams(updatedParams);
    const updatedConclusion = generateSummary(updatedParams, sizeFrame, stage);

    if (onChange) {
      onChange({
        parameters: updatedParams,
        sizeFrame,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';

  const handleFrameChange = (frame: SizeFrame) => {
    setSizeFrame(frame);
    const updatedConclusion = generateSummary(params, frame, stageKey);
    if (onChange) {
      onChange({
        parameters: params,
        sizeFrame: frame,
        diagnosticConclusion: updatedConclusion,
      });
    }
  };

  const handleReset = () => {
    const emptyParams: McnamaraParametersMap = { ...DEFAULT_MCNAMARA_PARAMS };
    setParams(emptyParams);
    const emptySummary = `Please enter measurement values to auto-generate McNamara Cephalometric diagnostic conclusion.`;
    if (onChange) {
      onChange({
        parameters: emptyParams,
        sizeFrame,
        diagnosticConclusion: emptySummary,
      });
    }
  };

  const inferences = useMemo(() => {
    const map: Record<string, { inference: string; status: 'normal' | 'abnormal' | 'empty' }> = {};

    MCNAMARA_PARAMETERS_META.forEach((meta) => {
      const val = params[meta.key]?.[stageKey];
      if (val !== '' && val !== undefined && !isNaN(Number(val))) {
        const res = meta.evaluateInference(Number(val), sizeFrame);
        map[meta.key] = res;
      } else {
        map[meta.key] = { inference: 'Not Measured', status: 'empty' };
      }
    });

    return map;
  }, [params, stageKey, sizeFrame]);

  const activeCount = useMemo(() => {
    return MCNAMARA_PARAMETERS_META.filter((m) => {
      const val = params[m.key]?.[stageKey];
      return val !== '' && val !== undefined && !isNaN(Number(val));
    }).length;
  }, [params, stageKey]);

  const abnormalCount = useMemo(() => {
    return Object.values(inferences).filter((inf) => (inf as any)?.status === 'abnormal').length;
  }, [inferences]);

  const diagnosticConclusion = useMemo(() => {
    return generateSummary(params, sizeFrame, stageKey);
  }, [params, sizeFrame, stageKey]);

  const handleCopySummary = () => {
    navigator.clipboard.writeText(diagnosticConclusion);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categories = [
    'Maxilla to Cranial Base',
    'Maxilla to Mandible',
    'Mandible to Cranial Base',
    'Dentition',
    'Airway',
  ] as const;

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
                  McNamara Analysis
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  10 Params
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Maxilla, Mandible, Dentition & Airway Widths ({sizeFrame.toUpperCase()})
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
        <div className="p-3 sm:p-5 space-y-6 bg-slate-50/50">
          {/* Top Frame Selector & Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-teal-600" />
                <span className="text-xs font-bold text-slate-700">Frame:</span>
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  {(['small', 'medium', 'large'] as SizeFrame[]).map((frame) => (
                    <button
                      key={frame}
                      type="button"
                      onClick={() => handleFrameChange(frame)}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all uppercase ${
                        sizeFrame === frame
                          ? 'bg-teal-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {frame}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-slate-600 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Presets:
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setParams(CLASS_II_MCNAMARA_SAMPLE);
                    if (onChange) {
                      onChange({
                        parameters: CLASS_II_MCNAMARA_SAMPLE,
                        sizeFrame,
                        diagnosticConclusion: generateSummary(CLASS_II_MCNAMARA_SAMPLE, sizeFrame, stageKey),
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
                    setParams(CLASS_III_MCNAMARA_SAMPLE);
                    if (onChange) {
                      onChange({
                        parameters: CLASS_III_MCNAMARA_SAMPLE,
                        sizeFrame,
                        diagnosticConclusion: generateSummary(CLASS_III_MCNAMARA_SAMPLE, sizeFrame, stageKey),
                      });
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
                >
                  Class III
                </button>
              </div>
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
            const catMetas = MCNAMARA_PARAMETERS_META.filter((m) => m.category === cat);
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
                        norm={meta.normalText(sizeFrame)}
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
            analysisName="McNamara Analysis"
            parameters={MCNAMARA_PARAMETERS_META.map((meta) => {
              const range = meta.getNormalRange(sizeFrame);
              return {
                parameterKey: meta.key,
                parameterName: meta.label,
                analysisName: 'McNamara Analysis',
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
