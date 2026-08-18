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
  // --- A. Mandibular Length & Anatomical Factors ---
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
      if (val > 128) return { inference: 'Obtuse Saddle Angle (Posterior Fossa / Class II Risk)', status: 'abnormal' };
      if (val < 118) return { inference: 'Acute Saddle Angle (Anterior Fossa / Class III Risk)', status: 'abnormal' };
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
    label: 'Effect of Total Gonial Angle (Ar-Go-Me)',
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
    key: 'upperGonialAngle',
    label: 'Upper Gonial Angle (Ar-Go-N)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: '°',
    minRange: 40,
    maxRange: 70,
    step: 0.5,
    normalText: () => '52° to 55°',
    getNormalRange: () => ({ minNormal: 52, maxNormal: 55 }),
    evaluateInference: (val) => {
      if (val > 55) return { inference: 'Posterior Ramal Incline / Mandibular Backward Tilt', status: 'abnormal' };
      if (val < 52) return { inference: 'Upright Ramus / Forward Mandibular Projection', status: 'abnormal' };
      return { inference: 'Normal Upper Gonial Angle', status: 'normal' };
    },
  },
  {
    key: 'lowerGonialAngle',
    label: 'Lower Gonial Angle (N-Go-Me)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: '°',
    minRange: 55,
    maxRange: 90,
    step: 0.5,
    normalText: () => '70° to 75°',
    getNormalRange: () => ({ minNormal: 70, maxNormal: 75 }),
    evaluateInference: (val) => {
      if (val > 75) return { inference: 'Downward Mandibular Growth / Open Bite Risk', status: 'abnormal' };
      if (val < 70) return { inference: 'Horizontal Mandibular Growth / Deep Bite Risk', status: 'abnormal' };
      return { inference: 'Normal Lower Gonial Angle', status: 'normal' };
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
  {
    key: 'ramusHeightArGo',
    label: 'Ramus Height (Ar-Go)',
    category: 'Mandibular Length & Anatomical Factors',
    unit: 'mm',
    minRange: 30,
    maxRange: 75,
    step: 0.5,
    normalText: () => '46 to 52 mm',
    getNormalRange: () => ({ minNormal: 46, maxNormal: 52 }),
    evaluateInference: (val) => {
      if (val < 46) return { inference: 'Short Ramus / Uncompensated Vertical Risk', status: 'abnormal' };
      if (val > 52) return { inference: 'Robust Ramus / High Vertical Compensation', status: 'normal' };
      return { inference: 'Normal Ramus Height', status: 'normal' };
    },
  },

  // --- B. Vertical Skeletal Parameters & Jaw Divergence ---
  {
    key: 'midLowerFaceHeightRatio',
    label: 'Mid/Lower Face Height Ratio',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '%',
    minRange: 30,
    maxRange: 60,
    step: 0.5,
    normalText: () => '45:55 (45.0% ± 3.0%)',
    getNormalRange: () => ({ minNormal: 42, maxNormal: 48 }),
    evaluateInference: (val) => {
      if (val > 48) return { inference: 'Increased Lower Facial Height (Vertical Excess)', status: 'abnormal' };
      if (val < 42) return { inference: 'Decreased Lower Facial Height (Deep Bite Tendency)', status: 'abnormal' };
      return { inference: 'Normal Facial Proportion Balance', status: 'normal' };
    },
  },
  {
    key: 'softTissueVerticalProportions',
    label: 'Soft Tissue Vertical Proportions (Sn-Stm %)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '%',
    minRange: 15,
    maxRange: 50,
    step: 0.5,
    normalText: () => 'Sn-Stm : Stm-Me = 1:2 (30% to 36%)',
    getNormalRange: () => ({ minNormal: 30, maxNormal: 36 }),
    evaluateInference: (val) => {
      if (val > 36) return { inference: 'Elongated Upper Lip Philtrum', status: 'abnormal' };
      if (val < 30) return { inference: 'Short Upper Lip / Lower Lip & Chin Dominance', status: 'abnormal' };
      return { inference: 'Balanced Soft Tissue Vertical Thirds', status: 'normal' };
    },
  },
  {
    key: 'snGoGnAngle',
    label: 'SN-GoGn (Mandibular Plane Angle)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 5,
    maxRange: 60,
    step: 0.5,
    normalText: () => '32° ± 4° (28° to 36°)',
    getNormalRange: () => ({ minNormal: 28, maxNormal: 36 }),
    evaluateInference: (val) => {
      if (val > 36) return { inference: 'Hyperdivergent / Steep Mandibular Plane', status: 'abnormal' };
      if (val < 28) return { inference: 'Hypodivergent / Flat Mandibular Plane', status: 'abnormal' };
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
      if (val > 29) return { inference: 'Hyperdivergent / Clockwise Growth Pattern', status: 'abnormal' };
      if (val < 21) return { inference: 'Hypodivergent / Counter-Clockwise Pattern', status: 'abnormal' };
      return { inference: 'Normal FMA Vertical Divergence', status: 'normal' };
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
      if (val < 62) return { inference: 'Posterior Rotator / Clockwise (<62%)', status: 'abnormal' };
      if (val > 65) return { inference: 'Anterior Rotator / Counter-Clockwise (>65%)', status: 'abnormal' };
      return { inference: 'Balanced Jarabak Vertical Ratio', status: 'normal' };
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
      if (val > 402) return { inference: 'Clockwise Mandibular Opening (>402°)', status: 'abnormal' };
      if (val < 390) return { inference: 'Counter-Clockwise Closing (<390°)', status: 'abnormal' };
      return { inference: 'Neutral Structural Polygon Equilibrium', status: 'normal' };
    },
  },
  {
    key: 'yAxisNsGfa',
    label: 'Y-Axis to SN (N-S-Gn)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 45,
    maxRange: 85,
    step: 0.5,
    normalText: () => '66° ± 3° (63° to 69°)',
    getNormalRange: () => ({ minNormal: 63, maxNormal: 69 }),
    evaluateInference: (val) => {
      if (val > 69) return { inference: 'Downward & Backward Growth Trajectory', status: 'abnormal' };
      if (val < 63) return { inference: 'Horizontal / Forward Growth Trajectory', status: 'abnormal' };
      return { inference: 'Harmonious Growth Vector Axis', status: 'normal' };
    },
  },
  {
    key: 'yAxisFhSGn',
    label: 'Y-Axis to FH (S-Gn to FH)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 40,
    maxRange: 80,
    step: 0.5,
    normalText: () => '59° ± 3° (56° to 62°)',
    getNormalRange: () => ({ minNormal: 56, maxNormal: 62 }),
    evaluateInference: (val) => {
      if (val > 62) return { inference: 'Clockwise Mandibular Incline', status: 'abnormal' };
      if (val < 56) return { inference: 'Counter-Clockwise Mandibular Incline', status: 'abnormal' };
      return { inference: 'Normal Frankfort-Gn Growth Vector', status: 'normal' };
    },
  },
  {
    key: 'basalPlaneAngle',
    label: 'Basal Plane Angle (PP-MP)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 0,
    maxRange: 45,
    step: 0.5,
    normalText: () => '25° ± 5° (20° to 30°)',
    getNormalRange: () => ({ minNormal: 20, maxNormal: 30 }),
    evaluateInference: (val) => {
      if (val > 30) return { inference: 'Increased Inter-Basal Divergence', status: 'abnormal' };
      if (val < 20) return { inference: 'Convergent Basal Planes / Deep Bite', status: 'abnormal' };
      return { inference: 'Normal Inter-Basal Plane Angle', status: 'normal' };
    },
  },
  {
    key: 'occlusalPlaneToNf',
    label: 'Occlusal Plane to NF (PP)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 0,
    maxRange: 35,
    step: 0.5,
    normalText: () => '14° ± 4° (10° to 18°)',
    getNormalRange: () => ({ minNormal: 10, maxNormal: 18 }),
    evaluateInference: (val) => {
      if (val > 18) return { inference: 'Steep Maxillary Occlusal Plane Incline', status: 'abnormal' };
      if (val < 10) return { inference: 'Flat Maxillary Occlusal Plane Incline', status: 'abnormal' };
      return { inference: 'Harmonious Palatal-Occlusal Relation', status: 'normal' };
    },
  },
  {
    key: 'occlusalPlaneToMp',
    label: 'Occlusal Plane to MP',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: 0,
    maxRange: 35,
    step: 0.5,
    normalText: () => '14° ± 4° (10° to 18°)',
    getNormalRange: () => ({ minNormal: 10, maxNormal: 18 }),
    evaluateInference: (val) => {
      if (val > 18) return { inference: 'Increased Mandibular Occlusal Divergence', status: 'abnormal' };
      if (val < 10) return { inference: 'Decreased Mandibular Occlusal Divergence', status: 'abnormal' };
      return { inference: 'Normal Mandibular-Occlusal Incline', status: 'normal' };
    },
  },
  {
    key: 'vertMaxPlacementNToAns',
    label: 'Vertical Maxillary Placement (Ptm to NF)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: 'mm',
    minRange: 35,
    maxRange: 75,
    step: 0.5,
    normalText: () => '56.0 mm (53.0 to 60.0 mm)',
    getNormalRange: () => ({ minNormal: 53, maxNormal: 60 }),
    evaluateInference: (val) => {
      if (val > 60) return { inference: 'Vertical Maxillary Excess (VME Tendency)', status: 'abnormal' };
      if (val < 53) return { inference: 'Vertical Maxillary Deficiency (VMD)', status: 'abnormal' };
      return { inference: 'Ideal Vertical Spatial Maxillary Position', status: 'normal' };
    },
  },
  {
    key: 'nasionToAns',
    label: 'Nasion to ANS (Upper Face Height)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: 'mm',
    minRange: 40,
    maxRange: 80,
    step: 0.5,
    normalText: (gender) => (gender === 'Male' ? '60.0 ± 4.0 mm (56 to 64 mm)' : '55.0 ± 2.0 mm (53 to 57 mm)'),
    getNormalRange: (gender) => (gender === 'Male' ? { minNormal: 56, maxNormal: 64 } : { minNormal: 53, maxNormal: 57 }),
    evaluateInference: (val, gender) => {
      const min = gender === 'Male' ? 56 : 53;
      const max = gender === 'Male' ? 64 : 57;
      if (val > max) return { inference: 'Elongated Upper Anterior Facial Height', status: 'abnormal' };
      if (val < min) return { inference: 'Short Upper Anterior Facial Height', status: 'abnormal' };
      return { inference: 'Normal Upper Face Height Dimension', status: 'normal' };
    },
  },
  {
    key: 'maxillaryRotation',
    label: 'Maxillary Rotation (Palatal Incline to SN)',
    category: 'Vertical Skeletal Parameters & Jaw Divergence',
    unit: '°',
    minRange: -10,
    maxRange: 25,
    step: 0.5,
    normalText: () => '8.0° ± 3.0° (5.0° to 11.0°)',
    getNormalRange: () => ({ minNormal: 5, maxNormal: 11 }),
    evaluateInference: (val) => {
      if (val > 11) return { inference: 'Downward Anterior Tipping of Maxilla', status: 'abnormal' };
      if (val < 5) return { inference: 'Upward Anterior Tipping of Maxilla', status: 'abnormal' };
      return { inference: 'Normal Maxillary Palatal Orientation', status: 'normal' };
    },
  },
];

export const DEFAULT_VERTICAL_JAW_DIVERGENCE_PARAMS: VerticalJawDivergenceParametersMap = {
  mandibularEffectiveLength: { pre: '', mid: '', post: '' },
  mandibularPlacement: { pre: '', mid: '', post: '' },
  saddleAngle: { pre: '', mid: '', post: '' },
  postCranialBase: { pre: '', mid: '', post: '' },
  effectOfGonialAngle: { pre: '', mid: '', post: '' },
  upperGonialAngle: { pre: '', mid: '', post: '' },
  lowerGonialAngle: { pre: '', mid: '', post: '' },
  articularAngle: { pre: '', mid: '', post: '' },
  ramusHeightArGo: { pre: '', mid: '', post: '' },
  compensatedByRamusHeight: { pre: '', mid: '', post: '' },
  midLowerFaceHeightRatio: { pre: '', mid: '', post: '' },
  softTissueVerticalProportions: { pre: '', mid: '', post: '' },
  snGoGnAngle: { pre: '', mid: '', post: '' },
  fmaAngle: { pre: '', mid: '', post: '' },
  basalPlaneAngle: { pre: '', mid: '', post: '' },
  effectOfRamusOrientation: { pre: '', mid: '', post: '' },
  bjoerkSum: { pre: '', mid: '', post: '' },
  jarabakRatio: { pre: '', mid: '', post: '' },
  yAxisNsGfa: { pre: '', mid: '', post: '' },
  yAxisFhSGn: { pre: '', mid: '', post: '' },
  occlusalPlaneToNf: { pre: '', mid: '', post: '' },
  occlusalPlaneToMp: { pre: '', mid: '', post: '' },
  vertMaxPlacementNToAns: { pre: '', mid: '', post: '' },
  nasionToAns: { pre: '', mid: '', post: '' },
  maxillaryRotation: { pre: '', mid: '', post: '' },
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
