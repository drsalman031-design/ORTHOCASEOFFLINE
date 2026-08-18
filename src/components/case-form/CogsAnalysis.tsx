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

// --- Hard Tissue Clinical Presets (Burstone COGS) ---
export const CLASS_I_COGS_HARD_SAMPLE: CogsParametersMap = {
  na: { pre: 0, mid: 0, post: 0 },
  nb: { pre: -3, mid: -3, post: -3 },
  maxillaryLengthPtmA: { pre: 50, mid: 50, post: 50 },
  totalMandibularLengthArPg: { pre: 110, mid: 110, post: 110 },
  corpusLengthGoPg: { pre: 75, mid: 75, post: 75 },
  ramusHeightArGo: { pre: 47, mid: 47, post: 47 },
  nAns: { pre: 50, mid: 50, post: 50 },
  ansMe: { pre: 62, mid: 62, post: 62 },
  facialHeightRatio: { pre: 0.81, mid: 0.81, post: 0.81 },
};

export const CLASS_II_COGS_HARD_SAMPLE: CogsParametersMap = {
  na: { pre: 2.5, mid: 1.5, post: 0.5 },
  nb: { pre: -8.5, mid: -5.5, post: -3.0 },
  maxillaryLengthPtmA: { pre: 53.0, mid: 51.5, post: 50.0 },
  totalMandibularLengthArPg: { pre: 98.0, mid: 104.0, post: 110.0 },
  corpusLengthGoPg: { pre: 67.0, mid: 71.0, post: 75.0 },
  ramusHeightArGo: { pre: 41.0, mid: 44.0, post: 47.0 },
  nAns: { pre: 51.0, mid: 50.5, post: 50.0 },
  ansMe: { pre: 72.0, mid: 67.0, post: 62.0 },
  facialHeightRatio: { pre: 0.71, mid: 0.75, post: 0.81 },
};

export const CLASS_III_COGS_HARD_SAMPLE: CogsParametersMap = {
  na: { pre: -4.5, mid: -2.0, post: 0.0 },
  nb: { pre: 3.5, mid: 0.0, post: -3.0 },
  maxillaryLengthPtmA: { pre: 44.0, mid: 47.0, post: 50.0 },
  totalMandibularLengthArPg: { pre: 124.0, mid: 117.0, post: 110.0 },
  corpusLengthGoPg: { pre: 85.0, mid: 80.0, post: 75.0 },
  ramusHeightArGo: { pre: 54.0, mid: 50.5, post: 47.0 },
  nAns: { pre: 49.0, mid: 49.5, post: 50.0 },
  ansMe: { pre: 69.0, mid: 65.5, post: 62.0 },
  facialHeightRatio: { pre: 0.71, mid: 0.76, post: 0.81 },
};

// --- Soft Tissue Clinical Presets (Legan-Burstone COGS) ---
export const CLASS_I_COGS_SOFT_SAMPLE: CogsSoftTissueParametersMap = {
  gSnPg: { pre: 12, mid: 12, post: 12 },
  gSn: { pre: 6, mid: 6, post: 6 },
  gPg: { pre: 0, mid: 0, post: 0 },
  gSnSnMeRatio: { pre: 1.0, mid: 1.0, post: 1.0 },
  snGnC: { pre: 100, mid: 100, post: 100 },
  snGnCGnRatio: { pre: 1.2, mid: 1.2, post: 1.2 },
  cmSnLs: { pre: 102, mid: 102, post: 102 },
  lsSnPg: { pre: 3, mid: 3, post: 3 },
  liSnPg: { pre: 2, mid: 2, post: 2 },
  siLiPg: { pre: 4, mid: 4, post: 4 },
  snStmsStmiRatio: { pre: 0.5, mid: 0.5, post: 0.5 },
  stmsI: { pre: 2, mid: 2, post: 2 },
  stmsStmi: { pre: 2, mid: 2, post: 2 },
  merrifieldZAngle: { pre: 80, mid: 80, post: 80 },
};

export const CLASS_II_COGS_SOFT_SAMPLE: CogsSoftTissueParametersMap = {
  gSnPg: { pre: 20, mid: 16, post: 12 },
  gSn: { pre: 8.5, mid: 7.0, post: 6.0 },
  gPg: { pre: -7.0, mid: -3.5, post: 0.0 },
  gSnSnMeRatio: { pre: 0.85, mid: 0.92, post: 1.0 },
  snGnC: { pre: 115, mid: 107, post: 100 },
  snGnCGnRatio: { pre: 1.45, mid: 1.32, post: 1.2 },
  cmSnLs: { pre: 88, mid: 95, post: 102 },
  lsSnPg: { pre: 6.5, mid: 4.5, post: 3.0 },
  liSnPg: { pre: 4.5, mid: 3.0, post: 2.0 },
  siLiPg: { pre: 7.5, mid: 5.5, post: 4.0 },
  snStmsStmiRatio: { pre: 0.42, mid: 0.46, post: 0.5 },
  stmsI: { pre: 5.5, mid: 3.5, post: 2.0 },
  stmsStmi: { pre: 5.0, mid: 3.5, post: 2.0 },
  merrifieldZAngle: { pre: 64, mid: 72, post: 80 },
};

export const CLASS_III_COGS_SOFT_SAMPLE: CogsSoftTissueParametersMap = {
  gSnPg: { pre: 4, mid: 8, post: 12 },
  gSn: { pre: 3.5, mid: 4.8, post: 6.0 },
  gPg: { pre: 6.5, mid: 3.0, post: 0.0 },
  gSnSnMeRatio: { pre: 0.88, mid: 0.94, post: 1.0 },
  snGnC: { pre: 90, mid: 95, post: 100 },
  snGnCGnRatio: { pre: 0.95, mid: 1.08, post: 1.2 },
  cmSnLs: { pre: 116, mid: 109, post: 102 },
  lsSnPg: { pre: 0.5, mid: 1.8, post: 3.0 },
  liSnPg: { pre: 4.5, mid: 3.2, post: 2.0 },
  siLiPg: { pre: 2.0, mid: 3.0, post: 4.0 },
  snStmsStmiRatio: { pre: 0.52, mid: 0.51, post: 0.5 },
  stmsI: { pre: 1.0, mid: 1.5, post: 2.0 },
  stmsStmi: { pre: 1.5, mid: 1.8, post: 2.0 },
  merrifieldZAngle: { pre: 88, mid: 84, post: 80 },
};

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

  const generateHardSummary = (
    currentParams: CogsParametersMap,
    g: 'Male' | 'Female',
    stage: 'pre' | 'mid' | 'post'
  ): string => {
    const stageLabel = stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';

    const getVal = (k: CogsParameterKey): number | null => {
      const v = currentParams[k]?.[stage];
      if (v === '' || v === undefined || isNaN(Number(v))) return null;
      return Number(v);
    };

    const na = getVal('na');
    const nb = getVal('nb');
    const ptmA = getVal('maxillaryLengthPtmA');
    const arPg = getVal('totalMandibularLengthArPg');
    const goPg = getVal('corpusLengthGoPg');
    const arGo = getVal('ramusHeightArGo');
    const nAns = getVal('nAns');
    const ansMe = getVal('ansMe');
    const fhr = getVal('facialHeightRatio');

    const entered = [na, nb, ptmA, arPg, goPg, arGo, nAns, ansMe, fhr].filter((v) => v !== null).length;
    if (entered === 0) {
      return 'Please enter COGS Hard Tissue cephalometric measurements to auto-generate surgical diagnostic conclusion.';
    }

    const sentences: string[] = [];

    // 1. Skeletal AP Maxillomandibular Position (Burstone)
    const apParts: string[] = [];
    if (na !== null) {
      if (na > 3) apParts.push(`maxillary AP excess/prognathism (N-A: ${na} mm vs norm 0±3 mm)`);
      else if (na < -3) apParts.push(`maxillary AP hypoplasia/retrognathism (N-A: ${na} mm)`);
      else apParts.push(`orthognathic maxillary AP position (N-A: ${na} mm)`);
    }
    if (nb !== null) {
      if (nb > 0) apParts.push(`mandibular AP excess/prognathism (N-B: ${nb} mm vs norm -3±3 mm)`);
      else if (nb < -6) apParts.push(`mandibular AP deficiency/retrognathism (N-B: ${nb} mm)`);
      else apParts.push(`balanced mandibular AP placement (N-B: ${nb} mm)`);
    }
    if (na !== null && nb !== null) {
      const diff = na - nb;
      if (diff > 5.5) {
        apParts.push(`severe skeletal Class II sagittal maxillomandibular basal discrepancy (Δ: ${diff.toFixed(1)} mm)`);
      } else if (diff < 0) {
        apParts.push(`skeletal Class III sagittal basal discrepancy with negative sagittal gap (Δ: ${diff.toFixed(1)} mm)`);
      }
    }
    if (apParts.length > 0) {
      sentences.push(`Skeletal AP Relationship indicates ${apParts.join(', ')}.`);
    }

    // 2. Hard Tissue Jaw Lengths & Dimensions
    const lenParts: string[] = [];
    const ptmNorm = g === 'Male' ? { min: 50, max: 56, avg: 53 } : { min: 47, max: 53, avg: 50 };
    const arPgNorm = g === 'Male' ? { min: 112, max: 124, avg: 118 } : { min: 105, max: 115, avg: 110 };
    const goPgNorm = g === 'Male' ? { min: 75, max: 85, avg: 80 } : { min: 71, max: 79, avg: 75 };
    const arGoNorm = g === 'Male' ? { min: 48, max: 56, avg: 52 } : { min: 43, max: 51, avg: 47 };

    if (ptmA !== null) {
      if (ptmA > ptmNorm.max) lenParts.push(`increased maxillary apical unit length (Ptm-A: ${ptmA} mm)`);
      else if (ptmA < ptmNorm.min) lenParts.push(`deficient maxillary apical base length (Ptm-A: ${ptmA} mm)`);
      else lenParts.push(`harmonious maxillary length (Ptm-A: ${ptmA} mm)`);
    }
    if (arPg !== null) {
      if (arPg > arPgNorm.max) lenParts.push(`mandibular macrognathia/hypertrophy (Ar-Pg: ${arPg} mm vs ${arPgNorm.avg} mm norm)`);
      else if (arPg < arPgNorm.min) lenParts.push(`mandibular micrognathia/hypoplasia (Ar-Pg: ${arPg} mm vs ${arPgNorm.avg} mm norm)`);
      else lenParts.push(`normative total mandibular length (Ar-Pg: ${arPg} mm)`);
    }
    if (goPg !== null) {
      if (goPg > goPgNorm.max) lenParts.push(`long mandibular body (Go-Pg: ${goPg} mm)`);
      else if (goPg < goPgNorm.min) lenParts.push(`short mandibular body (Go-Pg: ${goPg} mm)`);
    }
    if (arGo !== null) {
      if (arGo > arGoNorm.max) lenParts.push(`well-developed high ascending ramus (Ar-Go: ${arGo} mm)`);
      else if (arGo < arGoNorm.min) lenParts.push(`short vertical ramus (Ar-Go: ${arGo} mm)`);
    }
    if (lenParts.length > 0) {
      sentences.push(`Hard Tissue Morphometrics demonstrate ${lenParts.join(', ')}.`);
    }

    // 3. Vertical Facial Heights & Proportions
    const vertParts: string[] = [];
    if (ansMe !== null) {
      const ansMeNorm = g === 'Male' ? { min: 64, max: 72, avg: 68 } : { min: 58, max: 66, avg: 62 };
      if (ansMe > ansMeNorm.max) vertParts.push(`increased lower anterior facial height (ANS-Me: ${ansMe} mm) indicative of vertical maxillary excess (VME) or steep mandibular plane`);
      else if (ansMe < ansMeNorm.min) vertParts.push(`reduced lower anterior facial height (ANS-Me: ${ansMe} mm) with deep skeletal bite tendency`);
      else vertParts.push(`balanced lower facial height (ANS-Me: ${ansMe} mm)`);
    }
    if (fhr !== null) {
      if (fhr < 0.75) vertParts.push(`low facial height ratio (${fhr}) reflecting lower face excess`);
      else if (fhr > 0.87) vertParts.push(`high facial height ratio (${fhr}) reflecting lower face deficiency`);
      else vertParts.push(`ideal vertical facial height ratio (${fhr})`);
    }
    if (nAns !== null && vertParts.length === 0) {
      vertParts.push(`upper facial height measured at N-ANS: ${nAns} mm`);
    }
    if (vertParts.length > 0) {
      sentences.push(`Vertical Analysis confirms ${vertParts.join(', ')}.`);
    }

    const bulletLines = sentences.map((s, i) => `${i + 1}. ${s}`);
    return `COGS Hard Tissue Surgical Summary (${stageLabel}):\n${bulletLines.join('\n')}`;
  };

  const generateSoftSummary = (
    currentParams: CogsSoftTissueParametersMap,
    stage: 'pre' | 'mid' | 'post'
  ): string => {
    const stageLabel = stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';

    const getVal = (k: CogsSoftTissueParameterKey): number | null => {
      const v = currentParams[k]?.[stage];
      if (v === '' || v === undefined || isNaN(Number(v))) return null;
      return Number(v);
    };

    const gSnPg = getVal('gSnPg');
    const gSn = getVal('gSn');
    const gPg = getVal('gPg');
    const gSnRatio = getVal('gSnSnMeRatio');
    const snGnC = getVal('snGnC');
    const throatRatio = getVal('snGnCGnRatio');
    const cmSnLs = getVal('cmSnLs');
    const lsSnPg = getVal('lsSnPg');
    const liSnPg = getVal('liSnPg');
    const siLiPg = getVal('siLiPg');
    const lipRatio = getVal('snStmsStmiRatio');
    const stmsI = getVal('stmsI');
    const stmsStmi = getVal('stmsStmi');
    const zAngle = getVal('merrifieldZAngle');

    const entered = [gSnPg, gSn, gPg, gSnRatio, snGnC, throatRatio, cmSnLs, lsSnPg, liSnPg, siLiPg, lipRatio, stmsI, stmsStmi, zAngle].filter((v) => v !== null).length;
    if (entered === 0) {
      return 'Please enter Legan-Burstone Soft Tissue measurements to auto-generate clinical diagnostic conclusion.';
    }

    const sentences: string[] = [];

    // 1. Soft Tissue Facial Form & Chin Prominence
    const formParts: string[] = [];
    if (gSnPg !== null) {
      if (gSnPg > 16) formParts.push(`convex soft tissue facial profile (G-Sn-Pg': ${gSnPg}° vs 12° norm)`);
      else if (gSnPg < 8) formParts.push(`straight-to-concave soft tissue profile (G-Sn-Pg': ${gSnPg}°)`);
      else formParts.push(`harmonious soft tissue convexity (G-Sn-Pg': ${gSnPg}°)`);
    }
    if (gPg !== null) {
      if (gPg < -4) formParts.push(`retrogenia / recessive soft tissue chin projection (G-Pg': ${gPg} mm)`);
      else if (gPg > 4) formParts.push(`macrogenia / prominent soft tissue chin (G-Pg': ${gPg} mm)`);
      else formParts.push(`ideal soft tissue chin projection (G-Pg': ${gPg} mm)`);
    }
    if (gSnRatio !== null) {
      if (gSnRatio < 0.9) formParts.push(`lower facial third vertical excess (G-Sn/Sn-Me': ${gSnRatio})`);
      else if (gSnRatio > 1.1) formParts.push(`upper facial third dominance (G-Sn/Sn-Me': ${gSnRatio})`);
    }
    if (formParts.length > 0) {
      sentences.push(`Facial Form & Profile Outline shows ${formParts.join(' with ')}.`);
    }

    // 2. Neck-Chin / Submental Form
    if (snGnC !== null || throatRatio !== null) {
      const throatParts: string[] = [];
      if (snGnC !== null) {
        if (snGnC > 107) throatParts.push(`obtuse submental-cervical angle (Sn-Gn'-C: ${snGnC}° vs 100° norm) indicating poor chin-neck transition`);
        else if (snGnC < 93) throatParts.push(`acute, well-defined submental-cervical throat angle (Sn-Gn'-C: ${snGnC}°)`);
        else throatParts.push(`favorable submental-cervical throat form (Sn-Gn'-C: ${snGnC}°)`);
      }
      if (throatRatio !== null) {
        if (throatRatio > 1.3) throatParts.push(`increased submental depth ratio (${throatRatio})`);
        else if (throatRatio < 1.1) throatParts.push(`short submental throat length ratio (${throatRatio})`);
      }
      sentences.push(`Submental & Cervical Contour indicates ${throatParts.join(' and ')}.`);
    }

    // 3. Lip Posture, Competence & Incisor Display
    const lipParts: string[] = [];
    if (cmSnLs !== null) {
      if (cmSnLs < 94) lipParts.push(`acute nasolabial angle (Cm-Sn-Ls: ${cmSnLs}°) suggesting maxillary dentoalveolar protrusion`);
      else if (cmSnLs > 110) lipParts.push(`obtuse nasolabial angle (Cm-Sn-Ls: ${cmSnLs}°) suggesting retruded upper lip/midface`);
      else lipParts.push(`ideal nasolabial angle (Cm-Sn-Ls: ${cmSnLs}°)`);
    }
    if (lsSnPg !== null || liSnPg !== null) {
      const uLip = lsSnPg !== null ? (lsSnPg > 4 ? `protrusive upper lip (+${lsSnPg} mm)` : lsSnPg < 2 ? `retrusive upper lip (${lsSnPg} mm)` : `balanced upper lip (+${lsSnPg} mm)`) : null;
      const lLip = liSnPg !== null ? (liSnPg > 3 ? `protrusive lower lip (+${liSnPg} mm)` : liSnPg < 1 ? `retrusive lower lip (${liSnPg} mm)` : `balanced lower lip (+${liSnPg} mm)`) : null;
      lipParts.push([uLip, lLip].filter(Boolean).join(' and '));
    }
    if (siLiPg !== null) {
      if (siLiPg > 6) lipParts.push(`deep mentolabial sulcus (${siLiPg} mm)`);
      else if (siLiPg < 2) lipParts.push(`shallow/flat mentolabial sulcus (${siLiPg} mm)`);
    }
    if (stmsI !== null) {
      if (stmsI > 4) lipParts.push(`excessive maxillary incisor display at rest (${stmsI} mm - gummy smile tendency)`);
      else if (stmsI < 0) lipParts.push(`inadequate incisor display at rest (${stmsI} mm)`);
      else lipParts.push(`ideal resting incisor display (${stmsI} mm)`);
    }
    if (stmsStmi !== null) {
      if (stmsStmi > 4) lipParts.push(`interlabial gap / lip incompetence at rest (${stmsStmi} mm) requiring active mentalis strain`);
      else lipParts.push(`competent lip seal (${stmsStmi} mm gap)`);
    }
    if (lipParts.length > 0) {
      sentences.push(`Perioral & Lip Dynamics demonstrates ${lipParts.join('; ')}.`);
    }

    // 4. Merrifield's Z-Angle
    if (zAngle !== null) {
      if (zAngle < 71) sentences.push(`Merrifield's Z-Angle is acute (${zAngle}° vs 80° norm), reflecting combined profile convexity and retrusive chin posture.`);
      else if (zAngle > 89) sentences.push(`Merrifield's Z-Angle is obtuse (${zAngle}°), demonstrating a straight-to-prominent soft tissue chin profile.`);
      else sentences.push(`Merrifield's Z-Angle is harmonious (${zAngle}°), confirming excellent soft tissue facial balance.`);
    }

    const bulletLines = sentences.map((s, i) => `${i + 1}. ${s}`);
    return `Legan-Burstone Soft Tissue Summary (${stageLabel}):\n${bulletLines.join('\n')}`;
  };

  useEffect(() => {
    if (hardData?.parameters) setHardParams((prev) => ({ ...prev, ...hardData.parameters }));
    if (softData?.parameters) setSoftParams((prev) => ({ ...prev, ...softData.parameters }));
  }, [hardData?.parameters, softData?.parameters]);

  const genderValid: 'Female' | 'Male' = gender === 'Male' ? 'Male' : 'Female';
  const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';

  const handleHardValueChange = (key: CogsParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updated = { ...hardParams, [key]: { ...hardParams[key], [stage]: newNumber } };
    setHardParams(updated);
    if (onHardChange) {
      onHardChange({
        parameters: updated,
        gender,
        diagnosticConclusion: generateHardSummary(updated, genderValid, stage),
      });
    }
  };

  const handleSoftValueChange = (key: CogsSoftTissueParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updated = { ...softParams, [key]: { ...softParams[key], [stage]: newNumber } };
    setSoftParams(updated);
    if (onSoftChange) {
      onSoftChange({
        parameters: updated,
        diagnosticConclusion: generateSoftSummary(updated, stage),
      });
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
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
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

            <div className="flex items-center gap-2">
              {/* Presets Toolbar */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mr-1 hidden sm:inline">
                  Presets:
                </span>
                {activeTab === 'hard' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setHardParams(CLASS_I_COGS_HARD_SAMPLE);
                        if (onHardChange) {
                          onHardChange({
                            parameters: CLASS_I_COGS_HARD_SAMPLE,
                            gender,
                            diagnosticConclusion: generateHardSummary(CLASS_I_COGS_HARD_SAMPLE, genderValid, stageKey),
                          });
                        }
                      }}
                      className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
                    >
                      Class I
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHardParams(CLASS_II_COGS_HARD_SAMPLE);
                        if (onHardChange) {
                          onHardChange({
                            parameters: CLASS_II_COGS_HARD_SAMPLE,
                            gender,
                            diagnosticConclusion: generateHardSummary(CLASS_II_COGS_HARD_SAMPLE, genderValid, stageKey),
                          });
                        }
                      }}
                      className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
                    >
                      Class II
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHardParams(CLASS_III_COGS_HARD_SAMPLE);
                        if (onHardChange) {
                          onHardChange({
                            parameters: CLASS_III_COGS_HARD_SAMPLE,
                            gender,
                            diagnosticConclusion: generateHardSummary(CLASS_III_COGS_HARD_SAMPLE, genderValid, stageKey),
                          });
                        }
                      }}
                      className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
                    >
                      Class III
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSoftParams(CLASS_I_COGS_SOFT_SAMPLE);
                        if (onSoftChange) {
                          onSoftChange({
                            parameters: CLASS_I_COGS_SOFT_SAMPLE,
                            diagnosticConclusion: generateSoftSummary(CLASS_I_COGS_SOFT_SAMPLE, stageKey),
                          });
                        }
                      }}
                      className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
                    >
                      Class I
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSoftParams(CLASS_II_COGS_SOFT_SAMPLE);
                        if (onSoftChange) {
                          onSoftChange({
                            parameters: CLASS_II_COGS_SOFT_SAMPLE,
                            diagnosticConclusion: generateSoftSummary(CLASS_II_COGS_SOFT_SAMPLE, stageKey),
                          });
                        }
                      }}
                      className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
                    >
                      Class II
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSoftParams(CLASS_III_COGS_SOFT_SAMPLE);
                        if (onSoftChange) {
                          onSoftChange({
                            parameters: CLASS_III_COGS_SOFT_SAMPLE,
                            diagnosticConclusion: generateSoftSummary(CLASS_III_COGS_SOFT_SAMPLE, stageKey),
                          });
                        }
                      }}
                      className="px-2 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors"
                    >
                      Class III
                    </button>
                  </>
                )}
              </div>

              {/* Reset Button */}
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'hard') {
                    setHardParams(DEFAULT_COGS_HARD_PARAMS);
                    if (onHardChange) {
                      onHardChange({
                        parameters: DEFAULT_COGS_HARD_PARAMS,
                        gender,
                        diagnosticConclusion: '',
                      });
                    }
                  } else {
                    setSoftParams(DEFAULT_COGS_SOFT_PARAMS);
                    if (onSoftChange) {
                      onSoftChange({
                        parameters: DEFAULT_COGS_SOFT_PARAMS,
                        diagnosticConclusion: '',
                      });
                    }
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Reset current tab"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1 text-xs font-bold text-slate-500 pl-2 border-l border-slate-200">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>{gender}</span>
              </div>
            </div>
          </div>

          {/* Hard Tissue Parameters Tab */}
          {activeTab === 'hard' && (
            <div className="space-y-6">
              {hardCategories.map((cat) => {
                const catMetas = COGS_PARAMETERS_META.filter((m) => m.category === cat);
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

          {/* Dedicated Diagnostic Conclusion Summary Card (Point-wise Presentation) */}
          {(() => {
            const currentSummary =
              activeTab === 'hard'
                ? generateHardSummary(hardParams, genderValid, stageKey)
                : generateSoftSummary(softParams, stageKey);

            const lines = currentSummary.split('\n').filter((l) => l.trim().length > 0);
            const headerText = lines[0] || '';
            const bulletItems = lines.slice(1);

            return (
              <div className="p-4 sm:p-5 bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 text-white rounded-2xl shadow-lg border border-teal-700/50 space-y-3.5">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-teal-800/60 flex-wrap">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-teal-100 uppercase tracking-wider">
                      {activeTab === 'hard'
                        ? 'COGS Hard Tissue Surgical Inference & Conclusion'
                        : 'Legan-Burstone Soft Tissue Profile Inference & Conclusion'}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(currentSummary);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-800/80 hover:bg-teal-700 text-teal-200 hover:text-white border border-teal-600/50 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                  </button>
                </div>

                {bulletItems.length === 0 ? (
                  <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-medium italic">
                    {headerText}
                  </p>
                ) : (
                  <ul className="space-y-2.5">
                    {bulletItems.map((line, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-teal-500/20 hover:border-teal-500/40 transition-colors"
                      >
                        <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200 font-normal flex-1">
                          {line.replace(/^\d+\.\s*/, '')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })()}
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
