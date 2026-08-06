import React, { useState, useEffect, useMemo } from 'react';
import {
  VerticalJawDivergenceParameterKey,
  VerticalJawDivergenceParametersMap,
  VerticalJawDivergenceAnalysisData,
  Gender,
} from '../../types';
import { CephParameterRow } from './CephParameterRow';
import {
  Calculator,
  RotateCcw,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface VerticalJawDivergenceParameterMeta {
  key: VerticalJawDivergenceParameterKey;
  label: string;
  category: 'Mandibular Length & Anatomical Factors' | 'Vertical Skeletal Parameters & Jaw Divergence';
  unit: string;
  minRange?: number;
  maxRange?: number;
  step?: number;
  normalText: (gender: 'Male' | 'Female') => string;
  getNormalRange: (gender: 'Male' | 'Female') => { minNormal: number; maxNormal: number };
  evaluateInference: (
    val: number,
    gender: 'Male' | 'Female'
  ) => {
    inference: string;
    status: 'normal' | 'abnormal';
  };
}

export const VERTICAL_JAW_DIVERGENCE_PARAMETERS_META: VerticalJawDivergenceParameterMeta[] = [
  // --- A. Mandibular Length & Anatomical Factors (6) ---
  {
    key: 'mandibularEffectiveLength',
    label: 'Mandibular Effective Length (Co-Gn)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: 'mm',
    minRange: 70,
    maxRange: 150,
    step: 0.5,
    normalText: () => '105 to 120 mm (Age/Chart Norm)',
    getNormalRange: () => ({ minNormal: 105, maxNormal: 120 }),
    evaluateInference: (val) => {
      if (val < 105) return { inference: 'Micrognathic / Short Mandibular Length', status: 'abnormal' };
      if (val > 120) return { inference: 'Macrognathic / Long Mandibular Length', status: 'abnormal' };
      return { inference: 'Normal Mandibular Effective Length', status: 'normal' };
    },
  },
  {
    key: 'mandibularPlacement',
    label: 'Mandibular Placement (S-N-Pgon)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: '°',
    minRange: 60,
    maxRange: 100,
    step: 0.5,
    normalText: () => '78° to 82° (Rel. to Cranial Base)',
    getNormalRange: () => ({ minNormal: 78, maxNormal: 82 }),
    evaluateInference: (val) => {
      if (val < 78) return { inference: 'Retrognathic Mandibular Position', status: 'abnormal' };
      if (val > 82) return { inference: 'Prognathic Mandibular Position', status: 'abnormal' };
      return { inference: 'Normal Mandibular Placement', status: 'normal' };
    },
  },
  {
    key: 'saddleAngle',
    label: 'Saddle Angle (N-S-Ar)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: '°',
    minRange: 90,
    maxRange: 150,
    step: 0.5,
    normalText: () => '123° ± 5° (118° to 128°)',
    getNormalRange: () => ({ minNormal: 118, maxNormal: 128 }),
    evaluateInference: (val) => {
      if (val > 128) return { inference: 'Obtuse Saddle Angle (Posterior Fossa Position)', status: 'abnormal' };
      if (val < 118) return { inference: 'Acute Saddle Angle (Anterior Fossa Position)', status: 'abnormal' };
      return { inference: 'Normal Saddle Angle', status: 'normal' };
    },
  },
  {
    key: 'postCranialBase',
    label: 'Post Cranial Base (S-Ar)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: 'mm',
    minRange: 15,
    maxRange: 55,
    step: 0.5,
    normalText: () => '32 to 38 mm',
    getNormalRange: () => ({ minNormal: 32, maxNormal: 38 }),
    evaluateInference: (val) => {
      if (val < 32) return { inference: 'Short Posterior Cranial Base Length', status: 'abnormal' };
      if (val > 38) return { inference: 'Long Posterior Cranial Base Length', status: 'abnormal' };
      return { inference: 'Normal Posterior Cranial Base', status: 'normal' };
    },
  },
  {
    key: 'effectOfGonialAngle',
    label: 'Effect of Gonial Angle (Ar-Go-Me)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: '°',
    minRange: 90,
    maxRange: 160,
    step: 0.5,
    normalText: () => '120° to 130°',
    getNormalRange: () => ({ minNormal: 120, maxNormal: 130 }),
    evaluateInference: (val) => {
      if (val > 130) return { inference: 'Obtuse Gonial Angle / Hyperdivergent Tendency', status: 'abnormal' };
      if (val < 120) return { inference: 'Acute Gonial Angle / Hypodivergent Tendency', status: 'abnormal' };
      return { inference: 'Normal Gonial Angle', status: 'normal' };
    },
  },
  {
    key: 'articularAngle',
    label: 'Articular Angle (S-Ar-Go)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: '°',
    minRange: 100,
    maxRange: 170,
    step: 0.5,
    normalText: () => '143° ± 6° (137° to 149°)',
    getNormalRange: () => ({ minNormal: 137, maxNormal: 149 }),
    evaluateInference: (val) => {
      if (val > 149) return { inference: 'Increased Articular Angle / Retrognathic Mandible', status: 'abnormal' };
      if (val < 137) return { inference: 'Decreased Articular Angle / Prognathic Mandible', status: 'abnormal' };
      return { inference: 'Normal Articular Angle', status: 'normal' };
    },
  },

  // --- B. Vertical Skeletal Parameters & Jaw Divergence (6) ---
  {
    key: 'snGoGnAngle',
    label: 'SN-GoGn (Mandibular Plane Angle)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 5,
    maxRange: 60,
    step: 0.5,
    normalText: () => '32° ± 5° (27° to 37°)',
    getNormalRange: () => ({ minNormal: 27, maxNormal: 37 }),
    evaluateInference: (val) => {
      if (val > 37) return { inference: 'Hyperdivergent / High Angle Pattern', status: 'abnormal' };
      if (val < 27) return { inference: 'Hypodivergent / Low Angle Pattern', status: 'abnormal' };
      return { inference: 'Normodivergent Vertical Pattern', status: 'normal' };
    },
  },
  {
    key: 'fmaAngle',
    label: 'FMA (Frankfort Mandibular Plane Angle)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 5,
    maxRange: 50,
    step: 0.5,
    normalText: () => '25° ± 4° (21° to 29°)',
    getNormalRange: () => ({ minNormal: 21, maxNormal: 29 }),
    evaluateInference: (val) => {
      if (val > 29) return { inference: 'Hyperdivergent FMA Pattern', status: 'abnormal' };
      if (val < 21) return { inference: 'Hypodivergent FMA Pattern', status: 'abnormal' };
      return { inference: 'Normal FMA Vertical Divergence', status: 'normal' };
    },
  },
  {
    key: 'basalPlaneAngle',
    label: 'Basal Plane Angle (PP-MP)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 0,
    maxRange: 40,
    step: 0.5,
    normalText: () => '25° ± 6° (19° to 31°)',
    getNormalRange: () => ({ minNormal: 19, maxNormal: 31 }),
    evaluateInference: (val) => {
      if (val > 31) return { inference: 'Steep Basal Plane / High Divergence', status: 'abnormal' };
      if (val < 19) return { inference: 'Flat Basal Plane / Low Divergence', status: 'abnormal' };
      return { inference: 'Normal Basal Plane Divergence', status: 'normal' };
    },
  },
  {
    key: 'effectOfRamusOrientation',
    label: 'Effect of Ramus Orientation',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 60,
    maxRange: 100,
    step: 0.5,
    normalText: () => '85° to 90°',
    getNormalRange: () => ({ minNormal: 85, maxNormal: 90 }),
    evaluateInference: (val) => {
      if (val > 90) return { inference: 'Posteriorly Inclined Ramus', status: 'abnormal' };
      if (val < 85) return { inference: 'Anteriorly Inclined Ramus', status: 'abnormal' };
      return { inference: 'Normal Ramus Orientation', status: 'normal' };
    },
  },
  {
    key: 'bjoerkSum',
    label: "Björk Sum (Saddle + Articular + Gonial)",
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 350,
    maxRange: 430,
    step: 0.5,
    normalText: () => '396° ± 6° (390° to 402°)',
    getNormalRange: () => ({ minNormal: 390, maxNormal: 402 }),
    evaluateInference: (val) => {
      if (val > 402) return { inference: 'Clockwise Growth Rotation / High Divergence', status: 'abnormal' };
      if (val < 390) return { inference: 'Counter-Clockwise Rotation / Low Divergence', status: 'abnormal' };
      return { inference: 'Normal Vertical Growth Rotation Sum', status: 'normal' };
    },
  },
  {
    key: 'jarabakRatio',
    label: 'Jarabak Ratio (S-Go / N-Me %)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '%',
    minRange: 40,
    maxRange: 80,
    step: 0.5,
    normalText: () => '62% to 65%',
    getNormalRange: () => ({ minNormal: 62, maxNormal: 65 }),
    evaluateInference: (val) => {
      if (val < 62) return { inference: 'Hyperdivergent / Clockwise Growth Pattern', status: 'abnormal' };
      if (val > 65) return { inference: 'Hypodivergent / Counter-Clockwise Pattern', status: 'abnormal' };
      return { inference: 'Balanced Jarabak Vertical Ratio', status: 'normal' };
    },
  },
];

export const DEFAULT_VERTICAL_JAW_DIVERGENCE_PARAMS: VerticalJawDivergenceParametersMap = {
  mandibularEffectiveLength: { pre: '', mid: '', post: '' },
  mandibularPlacement: { pre: '', mid: '', post: '' },
  saddleAngle: { pre: '', mid: '', post: '' },
  postCranialBase: { pre: '', mid: '', post: '' },
  effectOfGonialAngle: { pre: '', mid: '', post: '' },
  articularAngle: { pre: '', mid: '', post: '' },
  snGoGnAngle: { pre: '', mid: '', post: '' },
  fmaAngle: { pre: '', mid: '', post: '' },
  basalPlaneAngle: { pre: '', mid: '', post: '' },
  effectOfRamusOrientation: { pre: '', mid: '', post: '' },
  bjoerkSum: { pre: '', mid: '', post: '' },
  jarabakRatio: { pre: '', mid: '', post: '' },
  midLowerFaceHeightRatio: { pre: '', mid: '', post: '' },
  upperGonialAngle: { pre: '', mid: '', post: '' },
  lowerGonialAngle: { pre: '', mid: '', post: '' },
  yAxisNsGfa: { pre: '', mid: '', post: '' },
  yAxisFhSGn: { pre: '', mid: '', post: '' },
  vertMaxPlacementNToAns: { pre: '', mid: '', post: '' },
};

interface VerticalJawDivergenceAnalysisProps {
  data?: VerticalJawDivergenceAnalysisData;
  gender?: Gender;
  onChange?: (updatedData: VerticalJawDivergenceAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
}

export const VerticalJawDivergenceAnalysis: React.FC<VerticalJawDivergenceAnalysisProps> = ({
  data,
  gender = 'Female',
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

  const [params, setParams] = useState<VerticalJawDivergenceParametersMap>(() => {
    if (data?.parameters) return { ...DEFAULT_VERTICAL_JAW_DIVERGENCE_PARAMS, ...data.parameters };
    return DEFAULT_VERTICAL_JAW_DIVERGENCE_PARAMS;
  });

  useEffect(() => {
    if (data?.parameters) setParams((prev) => ({ ...prev, ...data.parameters }));
  }, [data?.parameters]);

  const handleValueChange = (key: VerticalJawDivergenceParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updated = { ...params, [key]: { ...params[key], [stage]: newNumber } };
    setParams(updated);
    if (onChange) {
      onChange({ parameters: updated, gender, diagnosticConclusion: '' });
    }
  };

  const handleReset = () => {
    const emptyParams = { ...DEFAULT_VERTICAL_JAW_DIVERGENCE_PARAMS };
    setParams(emptyParams);
    if (onChange) {
      onChange({ parameters: emptyParams, gender, diagnosticConclusion: '' });
    }
  };

  const categories = [
    'Mandibular Length & Anatomical Factors',
    'Vertical Skeletal Parameters & Jaw Divergence',
  ] as const;

  const activeCount = useMemo(() => {
    return VERTICAL_JAW_DIVERGENCE_PARAMETERS_META.filter((m) => {
      const v = params[m.key]?.[currentStage];
      return v !== '' && v !== undefined && !isNaN(Number(v));
    }).length;
  }, [params, currentStage]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all w-full max-w-full">
      {/* Accordion Card Header */}
      <div
        onClick={onToggle}
        className="w-full p-3 sm:p-4 cursor-pointer hover:bg-slate-50 transition-colors space-y-2 border-b border-slate-100"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                Vertical Jaw Divergence Analysis
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  12 Parameters
                </span>
              </h4>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Interactive Vertical Scroll Drum Picker • Mandibular Growth Rotations & Vertical Jaw Divergence
              </p>
            </div>
          </div>
          <div className="text-slate-500 shrink-0 p-1 rounded-lg hover:bg-slate-200/60 transition-colors">
            {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-10">
          <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
            <Activity className="w-3 h-3 text-teal-600" />
            {activeCount}/12 Measured
          </span>
        </div>
      </div>

      {/* Accordion Body Content */}
      {isOpen && (
        <div className="p-3 sm:p-5 space-y-6 bg-slate-50/50">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>

          {categories.map((cat) => {
            const catMetas = VERTICAL_JAW_DIVERGENCE_PARAMETERS_META.filter((m) => m.category === cat);
            const genderValid: 'Female' | 'Male' = gender === 'Male' ? 'Male' : 'Female';
            const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';

            return (
              <div key={cat} className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
                  {cat} ({catMetas.length})
                </h5>
                <div className="grid grid-cols-1 gap-3">
                  {catMetas.map((meta) => {
                    const val = params[meta.key]?.[stageKey] ?? '';
                    const numericVal = Number(val);
                    const isValid = val !== '' && !isNaN(numericVal);
                    const inf = isValid
                      ? meta.evaluateInference(numericVal, genderValid)
                      : { inference: 'Not Measured', status: 'empty' as const };

                    return (
                      <CephParameterRow
                        key={meta.key}
                        label={meta.label}
                        norm={meta.normalText(genderValid)}
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
        </div>
      )}
    </div>
  );
};
