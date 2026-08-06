import React, { useState, useEffect, useMemo } from 'react';
import {
  CogsParameterKey,
  CogsParametersMap,
  CogsAnalysisData,
  CogsSoftTissueParameterKey,
  CogsSoftTissueParametersMap,
  CogsSoftTissueAnalysisData,
  Gender,
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
  User,
} from 'lucide-react';

// --- Hard Tissue Parameter Metadata ---
export interface CogsParameterMeta {
  key: CogsParameterKey;
  label: string;
  category: 'Skeletal AP' | 'Skeletal Hard Tissue Lengths' | 'Vertical Heights';
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

export const COGS_PARAMETERS_META: CogsParameterMeta[] = [
  // --- A. Skeletal AP (2) ---
  {
    key: 'na',
    label: 'N-A (Maxillary AP Position)',
    category: 'Skeletal AP',
    unit: 'mm',
    minRange: -15,
    maxRange: 20,
    step: 0.5,
    normalText: () => '0 ± 3 mm (-3 to 3 mm)',
    getNormalRange: () => ({ minNormal: -3, maxNormal: 3 }),
    evaluateInference: (val) => {
      if (val > 3) return { inference: 'Maxillary Prognathism / Forward Position', status: 'abnormal' };
      if (val < -3) return { inference: 'Maxillary Retrognathism / Posterior Position', status: 'abnormal' };
      return { inference: 'Normal Maxillary AP Position', status: 'normal' };
    },
  },
  {
    key: 'nb',
    label: 'N-B (Mandibular AP Position)',
    category: 'Skeletal AP',
    unit: 'mm',
    minRange: -20,
    maxRange: 15,
    step: 0.5,
    normalText: () => '-3 ± 3 mm (-6 to 0 mm)',
    getNormalRange: () => ({ minNormal: -6, maxNormal: 0 }),
    evaluateInference: (val) => {
      if (val > 0) return { inference: 'Mandibular Prognathism / Forward Position', status: 'abnormal' };
      if (val < -6) return { inference: 'Mandibular Retrognathism / Posterior Position', status: 'abnormal' };
      return { inference: 'Normal Mandibular AP Position', status: 'normal' };
    },
  },

  // --- B. Skeletal Hard Tissue Lengths (4) ---
  {
    key: 'maxillaryLengthPtmA',
    label: 'Ptm-A (Maxillary Unit Length)',
    category: 'Skeletal Hard Tissue Lengths',
    unit: 'mm',
    minRange: 30,
    maxRange: 80,
    step: 0.5,
    normalText: (gender) => (gender === 'Male' ? '53 ± 3 mm (50 to 56 mm)' : '50 ± 3 mm (47 to 53 mm)'),
    getNormalRange: (gender) =>
      gender === 'Male' ? { minNormal: 50, maxNormal: 56 } : { minNormal: 47, maxNormal: 53 },
    evaluateInference: (val, gender) => {
      const { minNormal, maxNormal } =
        gender === 'Male' ? { minNormal: 50, maxNormal: 56 } : { minNormal: 47, maxNormal: 53 };
      if (val > maxNormal) return { inference: 'Increased Maxillary Length', status: 'abnormal' };
      if (val < minNormal) return { inference: 'Decreased Maxillary Length', status: 'abnormal' };
      return { inference: 'Normal Maxillary Unit Length', status: 'normal' };
    },
  },
  {
    key: 'totalMandibularLengthArPg',
    label: 'Ar-Pg (Total Mandibular Length)',
    category: 'Skeletal Hard Tissue Lengths',
    unit: 'mm',
    minRange: 80,
    maxRange: 150,
    step: 0.5,
    normalText: (gender) => (gender === 'Male' ? '118 ± 6 mm (112 to 124 mm)' : '110 ± 5 mm (105 to 115 mm)'),
    getNormalRange: (gender) =>
      gender === 'Male' ? { minNormal: 112, maxNormal: 124 } : { minNormal: 105, maxNormal: 115 },
    evaluateInference: (val, gender) => {
      const { minNormal, maxNormal } =
        gender === 'Male' ? { minNormal: 112, maxNormal: 124 } : { minNormal: 105, maxNormal: 115 };
      if (val > maxNormal) return { inference: 'Increased Total Mandibular Length', status: 'abnormal' };
      if (val < minNormal) return { inference: 'Decreased Total Mandibular Length', status: 'abnormal' };
      return { inference: 'Normal Total Mandibular Length', status: 'normal' };
    },
  },
  {
    key: 'corpusLengthGoPg',
    label: 'Go-Pg (Mandibular Corpus Length)',
    category: 'Skeletal Hard Tissue Lengths',
    unit: 'mm',
    minRange: 50,
    maxRange: 110,
    step: 0.5,
    normalText: (gender) => (gender === 'Male' ? '80 ± 5 mm (75 to 85 mm)' : '75 ± 4 mm (71 to 79 mm)'),
    getNormalRange: (gender) =>
      gender === 'Male' ? { minNormal: 75, maxNormal: 85 } : { minNormal: 71, maxNormal: 79 },
    evaluateInference: (val, gender) => {
      const { minNormal, maxNormal } =
        gender === 'Male' ? { minNormal: 75, maxNormal: 85 } : { minNormal: 71, maxNormal: 79 };
      if (val > maxNormal) return { inference: 'Increased Mandibular Corpus Length', status: 'abnormal' };
      if (val < minNormal) return { inference: 'Decreased Mandibular Corpus Length', status: 'abnormal' };
      return { inference: 'Normal Mandibular Corpus Length', status: 'normal' };
    },
  },
  {
    key: 'ramusHeightArGo',
    label: 'Ar-Go (Ramus Height)',
    category: 'Skeletal Hard Tissue Lengths',
    unit: 'mm',
    minRange: 25,
    maxRange: 80,
    step: 0.5,
    normalText: (gender) => (gender === 'Male' ? '52 ± 4 mm (48 to 56 mm)' : '47 ± 4 mm (43 to 51 mm)'),
    getNormalRange: (gender) =>
      gender === 'Male' ? { minNormal: 48, maxNormal: 56 } : { minNormal: 43, maxNormal: 51 },
    evaluateInference: (val, gender) => {
      const { minNormal, maxNormal } =
        gender === 'Male' ? { minNormal: 48, maxNormal: 56 } : { minNormal: 43, maxNormal: 51 };
      if (val > maxNormal) return { inference: 'Increased Ramus Height', status: 'abnormal' };
      if (val < minNormal) return { inference: 'Decreased Ramus Height', status: 'abnormal' };
      return { inference: 'Normal Ramus Height', status: 'normal' };
    },
  },

  // --- C. Vertical Heights (3) ---
  {
    key: 'nAns',
    label: 'N-ANS (Upper Anterior Facial Height)',
    category: 'Vertical Heights',
    unit: 'mm',
    minRange: 30,
    maxRange: 80,
    step: 0.5,
    normalText: (gender) => (gender === 'Male' ? '55 ± 3 mm (52 to 58 mm)' : '50 ± 3 mm (47 to 53 mm)'),
    getNormalRange: (gender) =>
      gender === 'Male' ? { minNormal: 52, maxNormal: 58 } : { minNormal: 47, maxNormal: 53 },
    evaluateInference: (val, gender) => {
      const { minNormal, maxNormal } =
        gender === 'Male' ? { minNormal: 52, maxNormal: 58 } : { minNormal: 47, maxNormal: 53 };
      if (val > maxNormal) return { inference: 'Increased Upper Anterior Facial Height', status: 'abnormal' };
      if (val < minNormal) return { inference: 'Decreased Upper Anterior Facial Height', status: 'abnormal' };
      return { inference: 'Normal Upper Anterior Facial Height', status: 'normal' };
    },
  },
  {
    key: 'ansMe',
    label: 'ANS-Me (Lower Anterior Facial Height)',
    category: 'Vertical Heights',
    unit: 'mm',
    minRange: 40,
    maxRange: 90,
    step: 0.5,
    normalText: (gender) => (gender === 'Male' ? '68 ± 4 mm (64 to 72 mm)' : '62 ± 4 mm (58 to 66 mm)'),
    getNormalRange: (gender) =>
      gender === 'Male' ? { minNormal: 64, maxNormal: 72 } : { minNormal: 58, maxNormal: 66 },
    evaluateInference: (val, gender) => {
      const { minNormal, maxNormal } =
        gender === 'Male' ? { minNormal: 64, maxNormal: 72 } : { minNormal: 58, maxNormal: 66 };
      if (val > maxNormal) return { inference: 'Increased Lower Anterior Facial Height', status: 'abnormal' };
      if (val < minNormal) return { inference: 'Decreased Lower Anterior Facial Height', status: 'abnormal' };
      return { inference: 'Normal Lower Anterior Facial Height', status: 'normal' };
    },
  },
  {
    key: 'facialHeightRatio',
    label: 'N-ANS / ANS-Me (Facial Height Ratio)',
    category: 'Vertical Heights',
    unit: 'ratio',
    minRange: 0.5,
    maxRange: 1.2,
    step: 0.01,
    normalText: () => '0.81 (0.75 to 0.87)',
    getNormalRange: () => ({ minNormal: 0.75, maxNormal: 0.87 }),
    evaluateInference: (val) => {
      if (val > 0.87) return { inference: 'Upper Facial Height Excess / Lower Deficiency', status: 'abnormal' };
      if (val < 0.75) return { inference: 'Lower Facial Height Excess / Long Face Tendency', status: 'abnormal' };
      return { inference: 'Balanced Vertical Facial Height Ratio', status: 'normal' };
    },
  },
];

// --- Soft Tissue Parameter Metadata ---
export interface CogsSoftTissueParameterMeta {
  key: CogsSoftTissueParameterKey;
  label: string;
  category: 'Facial Form' | 'Lip Position & Form' | 'Profile Indices';
  unit: string;
  minRange?: number;
  maxRange?: number;
  step?: number;
  normalText: string;
  minNormal: number;
  maxNormal: number;
  evaluateInference: (val: number) => {
    inference: string;
    status: 'normal' | 'abnormal';
  };
}

export const COGS_SOFT_TISSUE_PARAMETERS_META: CogsSoftTissueParameterMeta[] = [
  // --- Facial Form Parameters (6) ---
  {
    key: 'gSnPg',
    label: "G-Sn-Pg' (Facial Convexity)",
    category: 'Facial Form',
    unit: '°',
    minRange: -10,
    maxRange: 30,
    step: 0.5,
    normalText: '12° ± 4° (8° to 16°)',
    minNormal: 8,
    maxNormal: 16,
    evaluateInference: (val) => {
      if (val > 16) return { inference: 'Convex Soft Tissue Profile', status: 'abnormal' };
      if (val < 8) return { inference: 'Concave Soft Tissue Profile', status: 'abnormal' };
      return { inference: 'Straight / Straight-Convex Profile', status: 'normal' };
    },
  },
  {
    key: 'gSn',
    label: 'G-Sn (IIHP)',
    category: 'Facial Form',
    unit: 'mm',
    minRange: -5,
    maxRange: 20,
    step: 0.5,
    normalText: '6 ± 3 mm (3 to 9 mm)',
    minNormal: 3,
    maxNormal: 9,
    evaluateInference: (val) => {
      if (val > 9) return { inference: 'Increased Subnasale Cranial Base Thickness', status: 'abnormal' };
      if (val < 3) return { inference: 'Decreased Subnasale Soft Tissue Thickness', status: 'abnormal' };
      return { inference: 'Normal Subnasale Soft Tissue Thickness', status: 'normal' };
    },
  },
  {
    key: 'gPg',
    label: "G-Pg'",
    category: 'Facial Form',
    unit: 'mm',
    minRange: -15,
    maxRange: 15,
    step: 0.5,
    normalText: '0 ± 4 mm (-4 to 4 mm)',
    minNormal: -4,
    maxNormal: 4,
    evaluateInference: (val) => {
      if (val > 4) return { inference: 'Protrusive Soft Tissue Chin', status: 'abnormal' };
      if (val < -4) return { inference: 'Retrusive Soft Tissue Chin', status: 'abnormal' };
      return { inference: 'Normal Soft Tissue Chin Position', status: 'normal' };
    },
  },
  {
    key: 'gSnSnMeRatio',
    label: "G-Sn / Sn-Me' (IIHP)",
    category: 'Facial Form',
    unit: 'ratio',
    minRange: 0.5,
    maxRange: 1.5,
    step: 0.01,
    normalText: '1.0 (0.9 to 1.1)',
    minNormal: 0.9,
    maxNormal: 1.1,
    evaluateInference: (val) => {
      if (val > 1.1) return { inference: 'Upper Soft Tissue Height Excess', status: 'abnormal' };
      if (val < 0.9) return { inference: 'Lower Soft Tissue Height Excess', status: 'abnormal' };
      return { inference: 'Balanced Vertical Soft Tissue Heights', status: 'normal' };
    },
  },
  {
    key: 'snGnC',
    label: "Sn-Gn'-C",
    category: 'Facial Form',
    unit: '°',
    minRange: 70,
    maxRange: 130,
    step: 0.5,
    normalText: '100° ± 7° (93° to 107°)',
    minNormal: 93,
    maxNormal: 107,
    evaluateInference: (val) => {
      if (val > 107) return { inference: 'Obtuse Subnasale-Gnathion-Cervical Angle', status: 'abnormal' };
      if (val < 93) return { inference: 'Acute Subnasale-Gnathion-Cervical Angle', status: 'abnormal' };
      return { inference: 'Normal Subnasale-Gnathion-Cervical Angle', status: 'normal' };
    },
  },
  {
    key: 'snGnCGnRatio',
    label: "Sn-Gn' / C-Gn'",
    category: 'Facial Form',
    unit: 'ratio',
    minRange: 0.7,
    maxRange: 1.7,
    step: 0.01,
    normalText: '1.2 (1.1 to 1.3)',
    minNormal: 1.1,
    maxNormal: 1.3,
    evaluateInference: (val) => {
      if (val > 1.3) return { inference: 'Increased Submental Distance Ratio', status: 'abnormal' };
      if (val < 1.1) return { inference: 'Decreased Submental Distance Ratio', status: 'abnormal' };
      return { inference: 'Normal Submental Distance Ratio', status: 'normal' };
    },
  },

  // --- Lip Position & Form Parameters (7) ---
  {
    key: 'cmSnLs',
    label: 'Cm-Sn-Ls (Nasolabial Angle)',
    category: 'Lip Position & Form',
    unit: '°',
    minRange: 60,
    maxRange: 140,
    step: 0.5,
    normalText: '102° ± 8° (94° to 110°)',
    minNormal: 94,
    maxNormal: 110,
    evaluateInference: (val) => {
      if (val < 94) return { inference: 'Acute Nasolabial Angle / Protrusive Upper Lip', status: 'abnormal' };
      if (val > 110) return { inference: 'Obtuse Nasolabial Angle / Upper Lip Retrusion', status: 'abnormal' };
      return { inference: 'Normal Nasolabial Angle', status: 'normal' };
    },
  },
  {
    key: 'lsSnPg',
    label: "Ls-(Sn-Pg') (Upper Lip Protrusion)",
    category: 'Lip Position & Form',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: '3 ± 1 mm (2 to 4 mm)',
    minNormal: 2,
    maxNormal: 4,
    evaluateInference: (val) => {
      if (val > 4) return { inference: 'Upper Lip Protrusion', status: 'abnormal' };
      if (val < 2) return { inference: 'Upper Lip Retrusion', status: 'abnormal' };
      return { inference: 'Normal Upper Lip Position', status: 'normal' };
    },
  },
  {
    key: 'liSnPg',
    label: "Li-(Sn-Pg') (Lower Lip Protrusion)",
    category: 'Lip Position & Form',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: '2 ± 1 mm (1 to 3 mm)',
    minNormal: 1,
    maxNormal: 3,
    evaluateInference: (val) => {
      if (val > 3) return { inference: 'Lower Lip Protrusion', status: 'abnormal' };
      if (val < 1) return { inference: 'Lower Lip Retrusion', status: 'abnormal' };
      return { inference: 'Normal Lower Lip Position', status: 'normal' };
    },
  },
  {
    key: 'siLiPg',
    label: "Si-(Li-Pg') (Mentolabial Sulcus)",
    category: 'Lip Position & Form',
    unit: 'mm',
    minRange: -2,
    maxRange: 15,
    step: 0.5,
    normalText: '4 ± 2 mm (2 to 6 mm)',
    minNormal: 2,
    maxNormal: 6,
    evaluateInference: (val) => {
      if (val > 6) return { inference: 'Deep Mentolabial Sulcus', status: 'abnormal' };
      if (val < 2) return { inference: 'Shallow Mentolabial Sulcus', status: 'abnormal' };
      return { inference: 'Normal Mentolabial Sulcus Depth', status: 'normal' };
    },
  },
  {
    key: 'snStmsStmiRatio',
    label: 'Sn-Stms / Sn-Stmi',
    category: 'Lip Position & Form',
    unit: 'ratio',
    minRange: 0.2,
    maxRange: 0.8,
    step: 0.01,
    normalText: '0.5 (0.45 to 0.55)',
    minNormal: 0.45,
    maxNormal: 0.55,
    evaluateInference: (val) => {
      if (val > 0.55) return { inference: 'Increased Upper Lip Height Ratio', status: 'abnormal' };
      if (val < 0.45) return { inference: 'Decreased Upper Lip Height Ratio', status: 'abnormal' };
      return { inference: 'Balanced Lip Length Ratio', status: 'normal' };
    },
  },
  {
    key: 'stmsI',
    label: 'Stms-I (Upper Incisor Exposure)',
    category: 'Lip Position & Form',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: '2 ± 2 mm (0 to 4 mm)',
    minNormal: 0,
    maxNormal: 4,
    evaluateInference: (val) => {
      if (val > 4) return { inference: 'Excessive Incisor Display at Rest (Gummy Smile Risk)', status: 'abnormal' };
      if (val < 0) return { inference: 'Inadequate Incisor Display / Covered Incisors', status: 'abnormal' };
      return { inference: 'Normal Upper Incisor Display', status: 'normal' };
    },
  },
  {
    key: 'stmsStmi',
    label: 'Stms-Stmi (Interlabial Gap)',
    category: 'Lip Position & Form',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: '2 ± 2 mm (0 to 4 mm)',
    minNormal: 0,
    maxNormal: 4,
    evaluateInference: (val) => {
      if (val > 4) return { inference: 'Lip Incompetence / Interlabial Gap Present', status: 'abnormal' };
      if (val < 0) return { inference: 'Tight Lip Seal / Negative Gap', status: 'abnormal' };
      return { inference: 'Normal Interlabial Gap / Competent Lips', status: 'normal' };
    },
  },

  // --- Profile Indices (1) ---
  {
    key: 'merrifieldZAngle',
    label: "Merrifield's Z-Angle",
    category: 'Profile Indices',
    unit: '°',
    minRange: 50,
    maxRange: 110,
    step: 0.5,
    normalText: '80° ± 9° (71° to 89°)',
    minNormal: 71,
    maxNormal: 89,
    evaluateInference: (val) => {
      if (val < 71) return { inference: 'Retrusive Chin / Acute Z-Angle Profile', status: 'abnormal' };
      if (val > 89) return { inference: 'Obtuse Z-Angle Profile / Protrusive Chin', status: 'abnormal' };
      return { inference: 'Balanced Profile Z-Angle', status: 'normal' };
    },
  },
];

export const DEFAULT_COGS_HARD_PARAMS: CogsParametersMap = {
  na: { pre: '', mid: '', post: '' },
  nb: { pre: '', mid: '', post: '' },
  maxillaryLengthPtmA: { pre: '', mid: '', post: '' },
  totalMandibularLengthArPg: { pre: '', mid: '', post: '' },
  corpusLengthGoPg: { pre: '', mid: '', post: '' },
  ramusHeightArGo: { pre: '', mid: '', post: '' },
  nAns: { pre: '', mid: '', post: '' },
  ansMe: { pre: '', mid: '', post: '' },
  facialHeightRatio: { pre: '', mid: '', post: '' },
};

export const DEFAULT_COGS_SOFT_PARAMS: CogsSoftTissueParametersMap = {
  gSnPg: { pre: '', mid: '', post: '' },
  gSn: { pre: '', mid: '', post: '' },
  gPg: { pre: '', mid: '', post: '' },
  gSnSnMeRatio: { pre: '', mid: '', post: '' },
  snGnC: { pre: '', mid: '', post: '' },
  snGnCGnRatio: { pre: '', mid: '', post: '' },
  cmSnLs: { pre: '', mid: '', post: '' },
  lsSnPg: { pre: '', mid: '', post: '' },
  liSnPg: { pre: '', mid: '', post: '' },
  siLiPg: { pre: '', mid: '', post: '' },
  snStmsStmiRatio: { pre: '', mid: '', post: '' },
  stmsI: { pre: '', mid: '', post: '' },
  stmsStmi: { pre: '', mid: '', post: '' },
  merrifieldZAngle: { pre: '', mid: '', post: '' },
};

interface CogsAnalysisProps {
  hardData?: CogsAnalysisData;
  softData?: CogsSoftTissueAnalysisData;
  gender?: Gender;
  onHardChange?: (updatedData: CogsAnalysisData) => void;
  onSoftChange?: (updatedData: CogsSoftTissueAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
}

export const CogsAnalysis: React.FC<CogsAnalysisProps> = ({
  hardData,
  softData,
  gender = 'Female',
  onHardChange,
  onSoftChange,
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

  const [activeTab, setActiveTab] = useState<'hard' | 'soft'>('hard');

  const [hardParams, setHardParams] = useState<CogsParametersMap>(() => {
    if (hardData?.parameters) return { ...DEFAULT_COGS_HARD_PARAMS, ...hardData.parameters };
    return DEFAULT_COGS_HARD_PARAMS;
  });

  const [softParams, setSoftParams] = useState<CogsSoftTissueParametersMap>(() => {
    if (softData?.parameters) return { ...DEFAULT_COGS_SOFT_PARAMS, ...softData.parameters };
    return DEFAULT_COGS_SOFT_PARAMS;
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (hardData?.parameters) setHardParams((prev) => ({ ...prev, ...hardData.parameters }));
    if (softData?.parameters) setSoftParams((prev) => ({ ...prev, ...softData.parameters }));
  }, [hardData?.parameters, softData?.parameters]);

  const handleHardValueChange = (key: CogsParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updated = { ...hardParams, [key]: { ...hardParams[key], [stage]: newNumber } };
    setHardParams(updated);
    if (onHardChange) {
      onHardChange({ parameters: updated, gender, diagnosticConclusion: '' });
    }
  };

  const handleSoftValueChange = (key: CogsSoftTissueParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updated = { ...softParams, [key]: { ...softParams[key], [stage]: newNumber } };
    setSoftParams(updated);
    if (onSoftChange) {
      onSoftChange({ parameters: updated, diagnosticConclusion: '' });
    }
  };

  const hardCategories = ['Skeletal AP', 'Skeletal Hard Tissue Lengths', 'Vertical Heights'] as const;
  const softCategories = ['Facial Form', 'Lip Position & Form', 'Profile Indices'] as const;

  const hardActiveCount = useMemo(() => {
    return COGS_PARAMETERS_META.filter((m) => {
      const v = hardParams[m.key]?.[currentStage];
      return v !== '' && v !== undefined && !isNaN(Number(v));
    }).length;
  }, [hardParams, currentStage]);

  const softActiveCount = useMemo(() => {
    return COGS_SOFT_TISSUE_PARAMETERS_META.filter((m) => {
      const v = softParams[m.key]?.[currentStage];
      return v !== '' && v !== undefined && !isNaN(Number(v));
    }).length;
  }, [softParams, currentStage]);

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
                  COGS Analysis (Legan-Burstone)
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  23 Params
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Orthognathic Surgical Skeletal Metrics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {hardActiveCount + softActiveCount === 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                0/23 Measured
              </span>
            ) : hardActiveCount + softActiveCount === 23 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                <span>{hardActiveCount + softActiveCount}/23 Measured</span>
              </span>
            )}

            <div className="text-slate-400 p-0.5 rounded-lg">
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-700" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>
        </div>

        {/* Slim 2px progress bar along bottom edge when in progress */}
        {(hardActiveCount + softActiveCount) > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${(hardActiveCount + softActiveCount) === 23 ? 'bg-emerald-500' : 'bg-teal-500'}`}
              style={{ width: `${((hardActiveCount + softActiveCount) / 23) * 100}%` }}
            />
          </div>
        )}
      </button>

      {/* Accordion Body Content */}
      {isOpen && (
        <div className="p-3 sm:p-5 space-y-6 bg-slate-50/50">
          {/* Sub-tab Switcher: Hard Tissue vs Soft Tissue */}
          <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('hard')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'hard'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Hard Tissue COGS (9)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('soft')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  activeTab === 'soft'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                Soft Tissue COGS (14)
              </button>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-slate-500">
              <User className="w-3.5 h-3.5 text-teal-600" />
              <span>Gender: {gender}</span>
            </div>
          </div>

          {/* Hard Tissue Parameters Tab */}
          {activeTab === 'hard' && (
            <div className="space-y-6">
              {hardCategories.map((cat) => {
                const catMetas = COGS_PARAMETERS_META.filter((m) => m.category === cat);
                const genderValid: 'Female' | 'Male' = gender === 'Male' ? 'Male' : 'Female';
                const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';

                return (
                  <div key={cat} className="space-y-3">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
                      {cat} ({catMetas.length})
                    </h5>
                    <div className="grid grid-cols-1 gap-3">
                      {catMetas.map((meta) => {
                        const val = hardParams[meta.key]?.[stageKey] ?? '';
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
                            onChange={(n) => handleHardValueChange(meta.key, stageKey, n)}
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

          {/* Soft Tissue Parameters Tab */}
          {activeTab === 'soft' && (
            <div className="space-y-6">
              {softCategories.map((cat) => {
                const catMetas = COGS_SOFT_TISSUE_PARAMETERS_META.filter((m) => m.category === cat);
                return (
                  <div key={cat} className="space-y-3">
                    <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
                      {cat} ({catMetas.length})
                    </h5>
                    <div className="grid grid-cols-1 gap-3">
                      {catMetas.map((meta) => {
                        const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';
                        const val = softParams[meta.key]?.[stageKey] ?? '';
                        const numericVal = Number(val);
                        const isValid = val !== '' && !isNaN(numericVal);
                        const inf = isValid
                          ? meta.evaluateInference(numericVal)
                          : { inference: 'Not Measured', status: 'empty' as const };

                        return (
                          <CephParameterRow
                            key={meta.key}
                            label={meta.label}
                            norm={meta.normalText}
                            value={val}
                            onChange={(n) => handleSoftValueChange(meta.key, stageKey, n)}
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
          {/* AI Clinical Auto-Diagnosis Panel */}
          {activeTab === 'hard' ? (
            <CephAutoDiagnosisPanel
              analysisName="COGS Analysis (Hard Tissue)"
              parameters={COGS_PARAMETERS_META.map((meta) => {
                const genderValid: 'Female' | 'Male' = gender === 'Male' ? 'Male' : 'Female';
                const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';
                const range = meta.getNormalRange(genderValid);
                return {
                  parameterKey: meta.key,
                  parameterName: meta.label,
                  analysisName: 'COGS Analysis (Hard Tissue)',
                  value: hardParams[meta.key]?.[stageKey] ?? '',
                  minNormal: range.minNormal,
                  maxNormal: range.maxNormal,
                  unit: meta.unit,
                  category: meta.category,
                };
              })}
            />
          ) : (
            <CephAutoDiagnosisPanel
              analysisName="COGS Analysis (Soft Tissue)"
              parameters={COGS_SOFT_TISSUE_PARAMETERS_META.map((meta) => {
                const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';
                return {
                  parameterKey: meta.key,
                  parameterName: meta.label,
                  analysisName: 'COGS Analysis (Soft Tissue)',
                  value: softParams[meta.key]?.[stageKey] ?? '',
                  minNormal: meta.minNormal,
                  maxNormal: meta.maxNormal,
                  unit: meta.unit,
                  category: meta.category,
                };
              })}
            />
          )}
        </div>
      )}
    </div>
  );
};
