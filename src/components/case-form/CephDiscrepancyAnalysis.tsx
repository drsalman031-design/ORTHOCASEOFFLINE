import React, { useState, useEffect, useMemo } from 'react';
import {
  CephDiscrepancyParameterKey,
  CephDiscrepancyParametersMap,
  CephDiscrepancyAnalysisData,
  Gender,
  DownsAnalysisData,
  SteinersAnalysisData,
  RickettsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CogsSoftTissueAnalysisData,
} from '../../types';
import { CephParameterRow } from './CephParameterRow';
import { ComprehensiveCephAnalysis } from './ComprehensiveCephAnalysis';
import { extractPrimaryCephValues } from '../../lib/cephAutoFetchEngine';
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
  ShieldAlert,
  Layers,
  Smile,
} from 'lucide-react';

export type CephDiscrepancyCategory =
  | 'Hard Tissue Sagittal Standards'
  | 'Soft Tissue Profile Metrics'
  | 'Sagittal Orientation & Soft Tissue Effects'
  | 'Detailed Maxillary Discrepancy Breakdown'
  | 'Detailed Mandibular Discrepancy Breakdown';

export interface CephDiscrepancyParameterMeta {
  key: CephDiscrepancyParameterKey;
  label: string;
  category: CephDiscrepancyCategory;
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

export interface CephDiscrepancyAnalysisProps {
  data?: CephDiscrepancyAnalysisData;
  gender?: Gender;
  onChange?: (updatedData: CephDiscrepancyAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
  patientAge?: number | string;
  patientGender?: Gender;
  downsAnalysis?: DownsAnalysisData;
  steinersAnalysis?: SteinersAnalysisData;
  rickettsAnalysis?: RickettsAnalysisData;
  mcnamaraAnalysis?: McnamaraAnalysisData;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  holdawayAnalysis?: HoldawayAnalysisData;
  cogsAnalysis?: CogsAnalysisData;
  cogsSoftTissueAnalysis?: CogsSoftTissueAnalysisData;
}

export const CLASS_I_DISCREPANCY_SAMPLE: CephDiscrepancyParametersMap = {
  anbAngle: { pre: 2.0, mid: 2.0, post: 2.0 },
  aMoBFh: { pre: 4.0, mid: 4.0, post: 4.0 },
  witsAoBo: { pre: 0.0, mid: 0.0, post: 0.0 },
  betaAngle: { pre: 31.0, mid: 31.0, post: 31.0 },
  yenAngle: { pre: 120.0, mid: 120.0, post: 120.0 },
  wAngle: { pre: 53.5, mid: 53.5, post: 53.5 },
  apdi: { pre: 83.0, mid: 83.0, post: 83.0 },
  naPog: { pre: 0.0, mid: 0.0, post: 0.0 },
  abNpog: { pre: -4.5, mid: -4.5, post: -4.5 },
  maxMandRatio: { pre: 1.0, mid: 1.0, post: 1.0 },
  harvoldUnitDiff: { pre: 26.0, mid: 26.0, post: 26.0 },
  softTissueProfileAngle: { pre: 161.0, mid: 161.0, post: 161.0 },
  totalTissueProfileAngle: { pre: 135.0, mid: 135.0, post: 135.0 },
  softTissueFacialAngle: { pre: 90.5, mid: 90.5, post: 90.5 },
  subnasaleToChin: { pre: 0.0, mid: 0.0, post: 0.0 },
  snOrientationAngle: { pre: 7.0, mid: 7.0, post: 7.0 },
  basicUpperLip: { pre: 14.0, mid: 14.0, post: 14.0 },
  softTissueChin: { pre: 11.0, mid: 11.0, post: 11.0 },
  snaAngle: { pre: 82.0, mid: 82.0, post: 82.0 },
  aNPerp: { pre: 0.5, mid: 0.5, post: 0.5 },
  maxSizeAnsPns: { pre: 57.0, mid: 57.0, post: 57.0 },
  maxEffectiveLength: { pre: 92.0, mid: 92.0, post: 92.0 },
  maxPlacementSInfPtmNf: { pre: 0.0, mid: 0.0, post: 0.0 },
  maxilla1aNl: { pre: 0.0, mid: 0.0, post: 0.0 },
  snbAngle: { pre: 80.0, mid: 80.0, post: 80.0 },
  pogNPerp: { pre: 1.0, mid: 1.0, post: 1.0 },
  facialAngle: { pre: 87.8, mid: 87.8, post: 87.8 },
  mandCorpusSize: { pre: 75.0, mid: 75.0, post: 75.0 },
  mandRamusHeight: { pre: 46.0, mid: 46.0, post: 46.0 },
  mandEffectiveLength: { pre: 118.0, mid: 118.0, post: 118.0 },
  saddleAngle: { pre: 123.0, mid: 123.0, post: 123.0 },
  postCranialBase: { pre: 35.0, mid: 35.0, post: 35.0 },
  effectOfGonialAngle: { pre: 128.0, mid: 128.0, post: 128.0 },
  ramusOrientation: { pre: 143.0, mid: 143.0, post: 143.0 },
  mandibleB1nL: { pre: 0.0, mid: 0.0, post: 0.0 },
  chinNPogFh: { pre: 0.0, mid: 0.0, post: 0.0 },
};

export const CLASS_II_DISCREPANCY_SAMPLE: CephDiscrepancyParametersMap = {
  anbAngle: { pre: 6.5, mid: 4.5, post: 2.5 },
  aMoBFh: { pre: 8.5, mid: 6.0, post: 4.0 },
  witsAoBo: { pre: 4.5, mid: 2.5, post: 0.5 },
  betaAngle: { pre: 22.0, mid: 26.5, post: 30.5 },
  yenAngle: { pre: 112.0, mid: 116.0, post: 120.0 },
  wAngle: { pre: 47.0, mid: 50.0, post: 53.5 },
  apdi: { pre: 74.0, mid: 78.5, post: 83.0 },
  naPog: { pre: 14.5, mid: 8.0, post: 3.0 },
  abNpog: { pre: -9.5, mid: -7.0, post: -4.5 },
  maxMandRatio: { pre: 1.16, mid: 1.08, post: 1.0 },
  harvoldUnitDiff: { pre: 19.0, mid: 22.5, post: 26.0 },
  softTissueProfileAngle: { pre: 151.0, mid: 156.0, post: 161.0 },
  totalTissueProfileAngle: { pre: 124.0, mid: 129.5, post: 135.0 },
  softTissueFacialAngle: { pre: 83.0, mid: 87.0, post: 90.5 },
  subnasaleToChin: { pre: -4.5, mid: -2.0, post: 0.0 },
  snOrientationAngle: { pre: 9.5, mid: 8.0, post: 7.0 },
  basicUpperLip: { pre: 12.0, mid: 13.0, post: 14.0 },
  softTissueChin: { pre: 9.0, mid: 10.0, post: 11.0 },
  snaAngle: { pre: 84.5, mid: 83.0, post: 82.0 },
  aNPerp: { pre: 2.5, mid: 1.2, post: 0.5 },
  maxSizeAnsPns: { pre: 59.0, mid: 58.0, post: 57.0 },
  maxEffectiveLength: { pre: 96.0, mid: 94.0, post: 92.0 },
  maxPlacementSInfPtmNf: { pre: 2.0, mid: 1.0, post: 0.0 },
  maxilla1aNl: { pre: 2.5, mid: 1.2, post: 0.0 },
  snbAngle: { pre: 75.5, mid: 78.0, post: 80.0 },
  pogNPerp: { pre: -4.5, mid: -2.0, post: 1.0 },
  facialAngle: { pre: 82.5, mid: 85.0, post: 87.8 },
  mandCorpusSize: { pre: 67.0, mid: 71.0, post: 75.0 },
  mandRamusHeight: { pre: 41.0, mid: 43.5, post: 46.0 },
  mandEffectiveLength: { pre: 109.0, mid: 113.5, post: 118.0 },
  saddleAngle: { pre: 131.0, mid: 127.0, post: 123.0 },
  postCranialBase: { pre: 39.0, mid: 37.0, post: 35.0 },
  effectOfGonialAngle: { pre: 135.0, mid: 131.5, post: 128.0 },
  ramusOrientation: { pre: 151.0, mid: 147.0, post: 143.0 },
  mandibleB1nL: { pre: -3.0, mid: -1.5, post: 0.0 },
  chinNPogFh: { pre: -4.0, mid: -2.0, post: 0.0 },
};

export const CLASS_III_DISCREPANCY_SAMPLE: CephDiscrepancyParametersMap = {
  anbAngle: { pre: -3.5, mid: -1.0, post: 1.5 },
  aMoBFh: { pre: 0.5, mid: 2.2, post: 4.0 },
  witsAoBo: { pre: -4.5, mid: -2.0, post: 0.0 },
  betaAngle: { pre: 39.0, mid: 35.0, post: 31.0 },
  yenAngle: { pre: 128.0, mid: 124.0, post: 120.0 },
  wAngle: { pre: 60.0, mid: 57.0, post: 54.0 },
  apdi: { pre: 91.0, mid: 87.0, post: 83.0 },
  naPog: { pre: -11.0, mid: -4.5, post: 0.0 },
  abNpog: { pre: 1.5, mid: -1.5, post: -4.5 },
  maxMandRatio: { pre: 0.86, mid: 0.93, post: 1.0 },
  harvoldUnitDiff: { pre: 33.0, mid: 29.5, post: 26.0 },
  softTissueProfileAngle: { pre: 170.0, mid: 165.0, post: 161.0 },
  totalTissueProfileAngle: { pre: 145.0, mid: 140.0, post: 135.0 },
  softTissueFacialAngle: { pre: 96.0, mid: 93.0, post: 90.5 },
  subnasaleToChin: { pre: 5.0, mid: 2.5, post: 0.0 },
  snOrientationAngle: { pre: 5.5, mid: 6.2, post: 7.0 },
  basicUpperLip: { pre: 15.5, mid: 14.8, post: 14.0 },
  softTissueChin: { pre: 13.5, mid: 12.2, post: 11.0 },
  snaAngle: { pre: 78.5, mid: 80.2, post: 82.0 },
  aNPerp: { pre: -2.5, mid: -0.8, post: 0.5 },
  maxSizeAnsPns: { pre: 52.0, mid: 54.5, post: 57.0 },
  maxEffectiveLength: { pre: 87.0, mid: 89.5, post: 92.0 },
  maxPlacementSInfPtmNf: { pre: -2.0, mid: -1.0, post: 0.0 },
  maxilla1aNl: { pre: -2.5, mid: -1.2, post: 0.0 },
  snbAngle: { pre: 84.5, mid: 82.2, post: 80.0 },
  pogNPerp: { pre: 6.5, mid: 3.8, post: 1.0 },
  facialAngle: { pre: 93.5, mid: 90.5, post: 87.8 },
  mandCorpusSize: { pre: 84.0, mid: 79.5, post: 75.0 },
  mandRamusHeight: { pre: 51.0, mid: 48.5, post: 46.0 },
  mandEffectiveLength: { pre: 126.0, mid: 122.0, post: 118.0 },
  saddleAngle: { pre: 115.0, mid: 119.0, post: 123.0 },
  postCranialBase: { pre: 31.0, mid: 33.0, post: 35.0 },
  effectOfGonialAngle: { pre: 122.0, mid: 125.0, post: 128.0 },
  ramusOrientation: { pre: 134.0, mid: 138.5, post: 143.0 },
  mandibleB1nL: { pre: 3.5, mid: 1.8, post: 0.0 },
  chinNPogFh: { pre: 4.0, mid: 2.0, post: 0.0 },
};

export const CEPH_DISCREPANCY_PARAMETERS_META: CephDiscrepancyParameterMeta[] = [
  // =========================================================================
  // --- 1. Hard Tissue Sagittal Standards (8 Parameters + YEN, W, APDI) ---
  // =========================================================================
  {
    key: 'anbAngle',
    label: 'ANB Angle (Skeletal Relationship)',
    category: 'Hard Tissue Sagittal Standards',
    unit: '°',
    minRange: -10,
    maxRange: 20,
    step: 0.5,
    normalText: () => '2.0° (0.0° to 4.0°)',
    getNormalRange: () => ({ minNormal: 0, maxNormal: 4 }),
    evaluateInference: (val) => {
      if (val > 4) return { inference: `Skeletal Class II Discrepancy (${val <= 5.5 ? 'Mild' : val <= 7.5 ? 'Moderate' : 'Severe'})`, status: 'abnormal' };
      if (val < 0) return { inference: `Skeletal Class III Discrepancy (${val >= -2 ? 'Mild' : val >= -4 ? 'Moderate' : 'Severe'})`, status: 'abnormal' };
      return { inference: 'Skeletal Class I Relationship', status: 'normal' };
    },
  },
  {
    key: 'aMoBFh',
    label: 'A-MoB-^nFH (Maxillomandibular AP Distance)',
    category: 'Hard Tissue Sagittal Standards',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: () => '4.0 mm (2.0 to 6.0 mm)',
    getNormalRange: () => ({ minNormal: 2, maxNormal: 6 }),
    evaluateInference: (val) => {
      if (val > 6) return { inference: 'Increased Maxillomandibular AP Distance (Class II Tendency)', status: 'abnormal' };
      if (val < 2) return { inference: 'Decreased Maxillomandibular AP Distance (Class III Tendency)', status: 'abnormal' };
      return { inference: 'Normal Maxillomandibular AP Alignment', status: 'normal' };
    },
  },
  {
    key: 'witsAoBo',
    label: 'AO to BO (Wits Appraisal)',
    category: 'Hard Tissue Sagittal Standards',
    unit: 'mm',
    minRange: -15,
    maxRange: 20,
    step: 0.5,
    normalText: () => '0.0 mm (-1.0 to 1.0 mm)',
    getNormalRange: () => ({ minNormal: -1, maxNormal: 1 }),
    evaluateInference: (val) => {
      if (val > 3) return { inference: 'Wits Class II Basal Discrepancy', status: 'abnormal' };
      if (val > 1) return { inference: 'Mild Wits Class II Tendency', status: 'abnormal' };
      if (val < -1) return { inference: 'Wits Class III Basal Discrepancy', status: 'abnormal' };
      return { inference: 'Harmonious Wits Skeletal Relation', status: 'normal' };
    },
  },
  {
    key: 'betaAngle',
    label: 'Beta Angle',
    category: 'Hard Tissue Sagittal Standards',
    unit: '°',
    minRange: 10,
    maxRange: 50,
    step: 0.5,
    normalText: () => '31.0° (27.0° to 35.0°)',
    getNormalRange: () => ({ minNormal: 27, maxNormal: 35 }),
    evaluateInference: (val) => {
      if (val < 27) return { inference: 'Class II Skeletal Discrepancy (Beta < 27°)', status: 'abnormal' };
      if (val > 35) return { inference: 'Class III Skeletal Discrepancy (Beta > 35°)', status: 'abnormal' };
      return { inference: 'Class I Skeletal Harmony (Beta 27°-35°)', status: 'normal' };
    },
  },
  {
    key: 'naPog',
    label: 'NA-Pog (Angle of Profile Convexity)',
    category: 'Hard Tissue Sagittal Standards',
    unit: '°',
    minRange: -20,
    maxRange: 30,
    step: 0.5,
    normalText: () => '0.0° (-8.5° to 10.0°)',
    getNormalRange: () => ({ minNormal: -8.5, maxNormal: 10 }),
    evaluateInference: (val) => {
      if (val > 10) return { inference: 'Convex Facial Skeletal Profile (Class II Tendency)', status: 'abnormal' };
      if (val < -8.5) return { inference: 'Concave Facial Skeletal Profile (Class III Tendency)', status: 'abnormal' };
      return { inference: 'Straight / Normal Profile Convexity', status: 'normal' };
    },
  },
  {
    key: 'abNpog',
    label: 'AB-NPog (AB to Facial Plane)',
    category: 'Hard Tissue Sagittal Standards',
    unit: '°',
    minRange: -20,
    maxRange: 15,
    step: 0.5,
    normalText: () => '-4.5° (-8.0° to 0.0°)',
    getNormalRange: () => ({ minNormal: -8, maxNormal: 0 }),
    evaluateInference: (val) => {
      if (val < -8) return { inference: 'Class II Relationship (Point B posterior to Point A)', status: 'abnormal' };
      if (val > 0) return { inference: 'Class III Relationship (Point B anterior to Point A)', status: 'abnormal' };
      return { inference: 'Harmonious AB Plane to Facial Plane', status: 'normal' };
    },
  },
  {
    key: 'maxMandRatio',
    label: 'Max:Mand Ratio (2:3 / Effective Ratio)',
    category: 'Hard Tissue Sagittal Standards',
    unit: 'ratio',
    minRange: 0.7,
    maxRange: 1.4,
    step: 0.01,
    normalText: () => '1.00 (0.95 to 1.05)',
    getNormalRange: () => ({ minNormal: 0.95, maxNormal: 1.05 }),
    evaluateInference: (val) => {
      if (val > 1.05) return { inference: 'Relative Maxillary Excess / Mandibular Deficiency (Class II)', status: 'abnormal' };
      if (val < 0.95) return { inference: 'Relative Mandibular Excess / Maxillary Deficiency (Class III)', status: 'abnormal' };
      return { inference: 'Harmonious Maxillomandibular Proportional Ratio', status: 'normal' };
    },
  },
  {
    key: 'harvoldUnitDiff',
    label: "Harvold's Unit Length Difference",
    category: 'Hard Tissue Sagittal Standards',
    unit: 'mm',
    minRange: 10,
    maxRange: 45,
    step: 0.5,
    normalText: () => '26.0 mm (24.0 to 28.0 mm)',
    getNormalRange: () => ({ minNormal: 24, maxNormal: 28 }),
    evaluateInference: (val) => {
      if (val > 28) return { inference: 'Increased Mandibular Differential (Class III Tendency)', status: 'abnormal' };
      if (val < 24) return { inference: 'Decreased Mandibular Differential (Class II Tendency)', status: 'abnormal' };
      return { inference: 'Normal Unit Length Differential (Harmonious Jaw Bases)', status: 'normal' };
    },
  },
  {
    key: 'yenAngle',
    label: 'YEN Angle (Cranial Base Reference)',
    category: 'Hard Tissue Sagittal Standards',
    unit: '°',
    minRange: 90,
    maxRange: 150,
    step: 0.5,
    normalText: () => '120.0° (117.0° to 123.0°)',
    getNormalRange: () => ({ minNormal: 117, maxNormal: 123 }),
    evaluateInference: (val) => {
      if (val < 117) return { inference: 'Class II Skeletal Pattern (YEN < 117°)', status: 'abnormal' };
      if (val > 123) return { inference: 'Class III Skeletal Pattern (YEN > 123°)', status: 'abnormal' };
      return { inference: 'Class I Skeletal Pattern (YEN 117°-123°)', status: 'normal' };
    },
  },
  {
    key: 'wAngle',
    label: 'W Angle (True Sagittal Geometry)',
    category: 'Hard Tissue Sagittal Standards',
    unit: '°',
    minRange: 30,
    maxRange: 70,
    step: 0.5,
    normalText: () => '53.5° (51.0° to 56.0°)',
    getNormalRange: () => ({ minNormal: 51, maxNormal: 56 }),
    evaluateInference: (val) => {
      if (val < 51) return { inference: 'Class II Skeletal Pattern (W < 51°)', status: 'abnormal' };
      if (val > 56) return { inference: 'Class III Skeletal Pattern (W > 56°)', status: 'abnormal' };
      return { inference: 'Class I Skeletal Pattern (W 51°-56°)', status: 'normal' };
    },
  },
  {
    key: 'apdi',
    label: 'APDI (Anteroposterior Dysplasia Indicator)',
    category: 'Hard Tissue Sagittal Standards',
    unit: '°',
    minRange: 60,
    maxRange: 110,
    step: 0.5,
    normalText: () => '83.0° (81.0° to 85.0°)',
    getNormalRange: () => ({ minNormal: 81, maxNormal: 85 }),
    evaluateInference: (val) => {
      if (val < 81) return { inference: 'APDI Class II Skeletal Discrepancy (<81°)', status: 'abnormal' };
      if (val > 85) return { inference: 'APDI Class III Skeletal Discrepancy (>85°)', status: 'abnormal' };
      return { inference: 'Normal Anteroposterior Skeletal Balance (81°-85°)', status: 'normal' };
    },
  },

  // =========================================================================
  // --- 2. Soft Tissue Profile Metrics (4 Parameters) ---
  // =========================================================================
  {
    key: 'softTissueProfileAngle',
    label: "Soft Tissue Profile Angle (N'-Sn-Pog')",
    category: 'Soft Tissue Profile Metrics',
    unit: '°',
    minRange: 130,
    maxRange: 185,
    step: 0.5,
    normalText: () => '161.0° (157.0° to 165.0°)',
    getNormalRange: () => ({ minNormal: 157, maxNormal: 165 }),
    evaluateInference: (val) => {
      if (val < 157) return { inference: 'Convex Soft Tissue Profile / Subnasale-Chin Retrusion', status: 'abnormal' };
      if (val > 165) return { inference: 'Straight to Concave Soft Tissue Profile', status: 'abnormal' };
      return { inference: 'Harmonious Soft Tissue Profile Angle (161° Norm)', status: 'normal' };
    },
  },
  {
    key: 'totalTissueProfileAngle',
    label: "Total Tissue Profile Angle (Gl'-Prn-Pog')",
    category: 'Soft Tissue Profile Metrics',
    unit: '°',
    minRange: 110,
    maxRange: 160,
    step: 0.5,
    normalText: (gender) => gender === 'Male' ? '133.0° (130.0° to 136.0°)' : '137.0° (134.0° to 140.0°)',
    getNormalRange: (gender) => gender === 'Male' ? { minNormal: 130, maxNormal: 136 } : { minNormal: 134, maxNormal: 140 },
    evaluateInference: (val, gender) => {
      const norm = gender === 'Male' ? 133 : 137;
      const minN = gender === 'Male' ? 130 : 134;
      const maxN = gender === 'Male' ? 136 : 140;
      if (val < minN) return { inference: `Hyper-Convex Total Profile (${val}° vs ${norm}° norm; Prominent Nose / Retrusive Chin)`, status: 'abnormal' };
      if (val > maxN) return { inference: `Flat / Concave Total Profile (${val}° vs ${norm}° norm; Deficient Nose / Prominent Chin)`, status: 'abnormal' };
      return { inference: `Harmonious Total Soft Tissue Profile Contour (${norm}° Norm)`, status: 'normal' };
    },
  },
  {
    key: 'softTissueFacialAngle',
    label: "Soft Tissue Facial Angle (FH to N'-Pog')",
    category: 'Soft Tissue Profile Metrics',
    unit: '°',
    minRange: 75,
    maxRange: 105,
    step: 0.5,
    normalText: () => '90.5° (87.0° to 94.0°)',
    getNormalRange: () => ({ minNormal: 87, maxNormal: 94 }),
    evaluateInference: (val) => {
      if (val > 94) return { inference: 'Prominent / Prognathic Soft Tissue Chin', status: 'abnormal' };
      if (val < 87) return { inference: 'Retrusive / Retrognathic Soft Tissue Chin', status: 'abnormal' };
      return { inference: 'Harmonious Soft Tissue Facial Angle (90.5° Norm)', status: 'normal' };
    },
  },
  {
    key: 'subnasaleToChin',
    label: "Subnasale-to-Chin Distance (Sn to Pog')",
    category: 'Soft Tissue Profile Metrics',
    unit: 'mm',
    minRange: -12,
    maxRange: 15,
    step: 0.5,
    normalText: () => '0.0 mm (-2.0 to 2.0 mm)',
    getNormalRange: () => ({ minNormal: -2, maxNormal: 2 }),
    evaluateInference: (val) => {
      if (val > 2) return { inference: 'Anterior Chin Projection / Class III Soft Profile', status: 'abnormal' };
      if (val < -2) return { inference: 'Retrusive Chin / Class II Soft Profile', status: 'abnormal' };
      return { inference: 'Ideal Subnasale-to-Chin Soft Tissue Alignment', status: 'normal' };
    },
  },

  // =========================================================================
  // --- 3. Sagittal Orientation & Soft Tissue Effects (3 Parameters) ---
  // =========================================================================
  {
    key: 'snOrientationAngle',
    label: 'SN Orientation Angle (SN to FH)',
    category: 'Sagittal Orientation & Soft Tissue Effects',
    unit: '°',
    minRange: 0,
    maxRange: 18,
    step: 0.5,
    normalText: () => '7.0° (5.0° to 9.0°)',
    getNormalRange: () => ({ minNormal: 5, maxNormal: 9 }),
    evaluateInference: (val) => {
      if (val > 9) return { inference: 'Steep Cranial Base (High SN / Masks Class II, lowers SNA/SNB)', status: 'abnormal' };
      if (val < 5) return { inference: 'Flat Cranial Base (Low SN / Increases SNA/SNB readings)', status: 'abnormal' };
      return { inference: 'Normal Cranial Base Orientation (Reliable SN References)', status: 'normal' };
    },
  },
  {
    key: 'basicUpperLip',
    label: 'Basic Upper Lip Assessment (A Point - Sn)',
    category: 'Sagittal Orientation & Soft Tissue Effects',
    unit: 'mm',
    minRange: 6,
    maxRange: 22,
    step: 0.5,
    normalText: () => '14.0 mm ± 1.0 mm (13.0 to 15.0 mm)',
    getNormalRange: () => ({ minNormal: 13, maxNormal: 15 }),
    evaluateInference: (val) => {
      if (val < 13) return { inference: 'Thin Upper Lip (Limited soft tissue buffer; direct 1:1 incisor response)', status: 'abnormal' };
      if (val > 15) return { inference: 'Thick Upper Lip (High soft tissue cushioning of incisors)', status: 'abnormal' };
      return { inference: 'Normal Upper Lip Thickness (14 mm norm)', status: 'normal' };
    },
  },
  {
    key: 'softTissueChin',
    label: "Soft Tissue Chin Assessment (Pog - Pog')",
    category: 'Sagittal Orientation & Soft Tissue Effects',
    unit: 'mm',
    minRange: 5,
    maxRange: 20,
    step: 0.5,
    normalText: () => '11.0 mm (10.0 to 12.0 mm)',
    getNormalRange: () => ({ minNormal: 10, maxNormal: 12 }),
    evaluateInference: (val) => {
      if (val < 10) return { inference: 'Thin Soft Tissue Chin Pad (Deficient buffer; skeletal retrusion exposed)', status: 'abnormal' };
      if (val > 12) return { inference: 'Thick Soft Tissue Chin Cushion (Compensates skeletal deficiency)', status: 'abnormal' };
      return { inference: 'Normal Soft Tissue Chin Thickness (10-12 mm norm)', status: 'normal' };
    },
  },

  // =========================================================================
  // --- 4. Detailed Maxillary Discrepancy Breakdown (5 Parameters) ---
  // =========================================================================
  {
    key: 'snaAngle',
    label: 'SNA Angle (Maxillary AP Position)',
    category: 'Detailed Maxillary Discrepancy Breakdown',
    unit: '°',
    minRange: 65,
    maxRange: 100,
    step: 0.5,
    normalText: () => '82.0° ± 2.0° (80.0° to 84.0°)',
    getNormalRange: () => ({ minNormal: 80, maxNormal: 84 }),
    evaluateInference: (val) => {
      if (val > 84) return { inference: 'Maxillary Prognathism / Anterior Maxillary Placement', status: 'abnormal' };
      if (val < 80) return { inference: 'Maxillary Retrognathism / Posterior Maxillary Placement', status: 'abnormal' };
      return { inference: 'Normal Maxillary Skeletal Position', status: 'normal' };
    },
  },
  {
    key: 'aNPerp',
    label: 'A-N1 / A-NPerp (Point A to N-Perpendicular)',
    category: 'Detailed Maxillary Discrepancy Breakdown',
    unit: 'mm',
    minRange: -10,
    maxRange: 15,
    step: 0.5,
    normalText: () => '0.5 mm (0.0 to 1.0 mm)',
    getNormalRange: () => ({ minNormal: 0, maxNormal: 1 }),
    evaluateInference: (val) => {
      if (val > 1) return { inference: 'Maxillary Skeletal Protrusion (+ midface)', status: 'abnormal' };
      if (val < 0) return { inference: 'Maxillary Skeletal Retrusion (- midface)', status: 'abnormal' };
      return { inference: 'Normal Maxillary AP Alignment', status: 'normal' };
    },
  },
  {
    key: 'maxSizeAnsPns',
    label: 'Maxillary Size (ANS-PNS)',
    category: 'Detailed Maxillary Discrepancy Breakdown',
    unit: 'mm',
    minRange: 40,
    maxRange: 75,
    step: 0.5,
    normalText: () => '57.0 mm (52.0 to 62.0 mm)',
    getNormalRange: () => ({ minNormal: 52, maxNormal: 62 }),
    evaluateInference: (val) => {
      if (val > 62) return { inference: 'Maxillary Basal Size Excess (Macro-Maxilla)', status: 'abnormal' };
      if (val < 52) return { inference: 'Maxillary Basal Size Deficiency (Micro-Maxilla)', status: 'abnormal' };
      return { inference: 'Normal Maxillary Basal Dimension (ANS-PNS)', status: 'normal' };
    },
  },
  {
    key: 'maxEffectiveLength',
    label: 'Maxillary Effective Length (Co-ANS)',
    category: 'Detailed Maxillary Discrepancy Breakdown',
    unit: 'mm',
    minRange: 70,
    maxRange: 115,
    step: 0.5,
    normalText: () => '92.0 mm (85.0 to 98.0 mm)',
    getNormalRange: () => ({ minNormal: 85, maxNormal: 98 }),
    evaluateInference: (val) => {
      if (val > 98) return { inference: 'Increased Maxillary Effective Unit Length', status: 'abnormal' };
      if (val < 85) return { inference: 'Decreased Maxillary Effective Unit Length', status: 'abnormal' };
      return { inference: 'Normal Maxillary Effective Length (Co-ANS)', status: 'normal' };
    },
  },
  {
    key: 'maxPlacementSInfPtmNf',
    label: 'Maxillary Placement (S-INF to Ptm-INF)',
    category: 'Detailed Maxillary Discrepancy Breakdown',
    unit: 'mm',
    minRange: -10,
    maxRange: 15,
    step: 0.5,
    normalText: () => '0.0 mm (-2.0 to 2.0 mm)',
    getNormalRange: () => ({ minNormal: -2, maxNormal: 2 }),
    evaluateInference: (val) => {
      if (val > 2) return { inference: 'Anterior Maxillary Placement in Craniofacial Complex', status: 'abnormal' };
      if (val < -2) return { inference: 'Posterior Maxillary Placement in Craniofacial Complex', status: 'abnormal' };
      return { inference: 'Normal Maxillary Craniofacial Spatial Position', status: 'normal' };
    },
  },

  // =========================================================================
  // --- 5. Detailed Mandibular Discrepancy Breakdown (10 Parameters) ---
  // =========================================================================
  {
    key: 'snbAngle',
    label: 'SNB Angle (Mandibular AP Position)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: '°',
    minRange: 60,
    maxRange: 95,
    step: 0.5,
    normalText: () => '80.0° ± 2.0° (78.0° to 82.0°)',
    getNormalRange: () => ({ minNormal: 78, maxNormal: 82 }),
    evaluateInference: (val) => {
      if (val > 82) return { inference: 'Mandibular Prognathism / Anterior Mandibular Base', status: 'abnormal' };
      if (val < 78) return { inference: 'Mandibular Retrognathism / Deficient Mandible', status: 'abnormal' };
      return { inference: 'Normal Mandibular Skeletal Position', status: 'normal' };
    },
  },
  {
    key: 'pogNPerp',
    label: 'B-N1 / Pog-NPerp (Pogonion to N-Perpendicular)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: 'mm',
    minRange: -20,
    maxRange: 15,
    step: 0.5,
    normalText: () => '1.0 mm (-2.0 to 4.0 mm)',
    getNormalRange: () => ({ minNormal: -2, maxNormal: 4 }),
    evaluateInference: (val) => {
      if (val < -2) return { inference: 'Mandibular Retrusion / Deficient Chin', status: 'abnormal' };
      if (val > 4) return { inference: 'Mandibular Protrusion / Prominent Chin', status: 'abnormal' };
      return { inference: 'Normal Mandibular Chin Position', status: 'normal' };
    },
  },
  {
    key: 'facialAngle',
    label: 'Facial Angle (N-Pog to FH)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: '°',
    minRange: 70,
    maxRange: 105,
    step: 0.5,
    normalText: () => '87.8° ± 3.6° (84.0° to 91.0°)',
    getNormalRange: () => ({ minNormal: 84, maxNormal: 91 }),
    evaluateInference: (val) => {
      if (val > 91) return { inference: 'Mandibular Prognathism / Prominent Chin Angle', status: 'abnormal' };
      if (val < 84) return { inference: 'Mandibular Retrognathism / Recessive Chin Angle', status: 'abnormal' };
      return { inference: 'Harmonious Frankfort-Facial Angle (N-Pog to FH)', status: 'normal' };
    },
  },
  {
    key: 'mandCorpusSize',
    label: 'Mandibular Corpus Size (Go-Pog / Go-Gn)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: 'mm',
    minRange: 50,
    maxRange: 100,
    step: 0.5,
    normalText: () => '75.0 mm (70.0 to 80.0 mm)',
    getNormalRange: () => ({ minNormal: 70, maxNormal: 80 }),
    evaluateInference: (val) => {
      if (val > 80) return { inference: 'Mandibular Corpus Length Excess (Long Body)', status: 'abnormal' };
      if (val < 70) return { inference: 'Mandibular Corpus Length Deficiency (Short Body)', status: 'abnormal' };
      return { inference: 'Normal Mandibular Body Length (Go-Pog)', status: 'normal' };
    },
  },
  {
    key: 'mandRamusHeight',
    label: 'Mandibular Ramus Height (Ar-Go / Cd-Go)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: 'mm',
    minRange: 30,
    maxRange: 70,
    step: 0.5,
    normalText: () => '46.0 mm (42.0 to 50.0 mm)',
    getNormalRange: () => ({ minNormal: 42, maxNormal: 50 }),
    evaluateInference: (val) => {
      if (val > 50) return { inference: 'Elongated Mandibular Ramus (Deep Bite Tendency)', status: 'abnormal' };
      if (val < 42) return { inference: 'Short Mandibular Ramus (High Angle / Open Bite Tendency)', status: 'abnormal' };
      return { inference: 'Normal Ascending Ramus Height (Ar-Go)', status: 'normal' };
    },
  },
  {
    key: 'mandEffectiveLength',
    label: 'Mandibular Effective Length (Co-Gn)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: 'mm',
    minRange: 90,
    maxRange: 145,
    step: 0.5,
    normalText: () => '118.0 mm (110.0 to 125.0 mm)',
    getNormalRange: () => ({ minNormal: 110, maxNormal: 125 }),
    evaluateInference: (val) => {
      if (val > 125) return { inference: 'Increased Total Effective Mandibular Unit Length', status: 'abnormal' };
      if (val < 110) return { inference: 'Decreased Total Effective Mandibular Unit Length', status: 'abnormal' };
      return { inference: 'Normal Mandibular Effective Length (Co-Gn)', status: 'normal' };
    },
  },
  {
    key: 'saddleAngle',
    label: 'Mandibular Placement: Saddle Angle (N-S-Ar)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: '°',
    minRange: 105,
    maxRange: 145,
    step: 0.5,
    normalText: () => '123.0° ± 5.0° (118.0° to 128.0°)',
    getNormalRange: () => ({ minNormal: 118, maxNormal: 128 }),
    evaluateInference: (val) => {
      if (val > 128) return { inference: 'Posterior Condylar Placement (Class II Skeletal Tendency)', status: 'abnormal' };
      if (val < 118) return { inference: 'Anterior Condylar Placement (Class III Skeletal Tendency)', status: 'abnormal' };
      return { inference: 'Normal Cranial Base Flexure / Condylar Placement', status: 'normal' };
    },
  },
  {
    key: 'postCranialBase',
    label: 'Mandibular Placement: Post Cranial Base (S-Ar)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: 'mm',
    minRange: 20,
    maxRange: 50,
    step: 0.5,
    normalText: () => '35.0 mm (32.0 to 38.0 mm)',
    getNormalRange: () => ({ minNormal: 32, maxNormal: 38 }),
    evaluateInference: (val) => {
      if (val > 38) return { inference: 'Long Posterior Cranial Base (Condyle positioned backward)', status: 'abnormal' };
      if (val < 32) return { inference: 'Short Posterior Cranial Base (Condyle positioned forward)', status: 'abnormal' };
      return { inference: 'Normal Posterior Cranial Base Length (S-Ar)', status: 'normal' };
    },
  },
  {
    key: 'effectOfGonialAngle',
    label: 'Mandibular Placement: Effect of Gonial Angle (Ar-Go-Me)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: '°',
    minRange: 105,
    maxRange: 150,
    step: 0.5,
    normalText: () => '128.0° ± 6.0° (120.0° to 130.0°)',
    getNormalRange: () => ({ minNormal: 120, maxNormal: 130 }),
    evaluateInference: (val) => {
      if (val > 130) return { inference: 'Obtuse Gonial Angle (Downward/Backward Mandibular Rotation)', status: 'abnormal' };
      if (val < 120) return { inference: 'Acute Gonial Angle (Forward/Upward Mandibular Projection)', status: 'normal' };
      return { inference: 'Normal Gonial Angle Architectural Form', status: 'normal' };
    },
  },
  {
    key: 'ramusOrientation',
    label: 'Mandibular Placement: Ramus Orientation S-Ar-Go (Articular Angle)',
    category: 'Detailed Mandibular Discrepancy Breakdown',
    unit: '°',
    minRange: 120,
    maxRange: 165,
    step: 0.5,
    normalText: () => '143.0° ± 6.0° (137.0° to 149.0°)',
    getNormalRange: () => ({ minNormal: 137, maxNormal: 149 }),
    evaluateInference: (val) => {
      if (val > 149) return { inference: 'Increased Articular Angle (Retrognathic Ramal Orientation)', status: 'abnormal' };
      if (val < 137) return { inference: 'Decreased Articular Angle (Prognathic Ramal Orientation)', status: 'abnormal' };
      return { inference: 'Harmonious Ramal Articular Orientation', status: 'normal' };
    },
  },
];

export const DEFAULT_CEPH_DISCREPANCY_PARAMS: CephDiscrepancyParametersMap = {
  anbAngle: { pre: '', mid: '', post: '' },
  aMoBFh: { pre: '', mid: '', post: '' },
  witsAoBo: { pre: '', mid: '', post: '' },
  betaAngle: { pre: '', mid: '', post: '' },
  yenAngle: { pre: '', mid: '', post: '' },
  wAngle: { pre: '', mid: '', post: '' },
  apdi: { pre: '', mid: '', post: '' },
  naPog: { pre: '', mid: '', post: '' },
  abNpog: { pre: '', mid: '', post: '' },
  maxMandRatio: { pre: '', mid: '', post: '' },
  harvoldUnitDiff: { pre: '', mid: '', post: '' },
  softTissueProfileAngle: { pre: '', mid: '', post: '' },
  totalTissueProfileAngle: { pre: '', mid: '', post: '' },
  softTissueFacialAngle: { pre: '', mid: '', post: '' },
  subnasaleToChin: { pre: '', mid: '', post: '' },
  snOrientationAngle: { pre: '', mid: '', post: '' },
  basicUpperLip: { pre: '', mid: '', post: '' },
  softTissueChin: { pre: '', mid: '', post: '' },
  snaAngle: { pre: '', mid: '', post: '' },
  aNPerp: { pre: '', mid: '', post: '' },
  maxSizeAnsPns: { pre: '', mid: '', post: '' },
  maxEffectiveLength: { pre: '', mid: '', post: '' },
  maxPlacementSInfPtmNf: { pre: '', mid: '', post: '' },
  maxilla1aNl: { pre: '', mid: '', post: '' },
  snbAngle: { pre: '', mid: '', post: '' },
  pogNPerp: { pre: '', mid: '', post: '' },
  facialAngle: { pre: '', mid: '', post: '' },
  mandCorpusSize: { pre: '', mid: '', post: '' },
  mandRamusHeight: { pre: '', mid: '', post: '' },
  mandEffectiveLength: { pre: '', mid: '', post: '' },
  saddleAngle: { pre: '', mid: '', post: '' },
  postCranialBase: { pre: '', mid: '', post: '' },
  effectOfGonialAngle: { pre: '', mid: '', post: '' },
  ramusOrientation: { pre: '', mid: '', post: '' },
  mandibleB1nL: { pre: '', mid: '', post: '' },
  chinNPogFh: { pre: '', mid: '', post: '' },
};

export interface DiscrepancyPoint {
  title: string;
  finding: string;
  badge?: string;
  badgeColor?: string;
}

export interface CephInferenceResult {
  skeletalClassification: 'Skeletal Class I' | 'Skeletal Class II' | 'Skeletal Class III';
  severityRating: 'Mild' | 'Moderate' | 'Severe';
  softTissueInteraction: 'Matching' | 'Compensating' | 'Aggravating';
  faultLocalization: {
    maxillaSize: 'Normal' | 'Excess' | 'Deficient';
    maxillaPlacement: 'Normal' | 'Anterior / Prognathic' | 'Posterior / Retrognathic';
    mandibleSize: 'Normal' | 'Excess' | 'Deficient';
    mandiblePlacement: 'Normal' | 'Prognathic' | 'Retrognathic';
    primaryFault: 'Maxillary' | 'Mandibular' | 'Bi-Maxillary' | 'Harmonious';
  };
  points: DiscrepancyPoint[];
  summaryText: string;
  apicalBaseDiagnosis: string;
  softTissueDiagnosis: string;
}

export function calculateOverallCephInference(
  pMap: CephDiscrepancyParametersMap,
  autoMap: Record<string, { value: number | ''; source: string }>,
  stage: 'pre' | 'mid' | 'post',
  gender: 'Male' | 'Female' = 'Female'
): CephInferenceResult {
  const getVal = (k: CephDiscrepancyParameterKey): number | null => {
    const userV = pMap[k]?.[stage];
    const autoV = autoMap[k]?.value;
    const v = userV !== '' && userV !== undefined ? userV : autoV;
    if (v === '' || v === undefined || isNaN(Number(v))) return null;
    return Number(v);
  };

  const anb = getVal('anbAngle');
  const wits = getVal('witsAoBo');
  const beta = getVal('betaAngle');
  const yen = getVal('yenAngle');
  const w = getVal('wAngle');
  const apdi = getVal('apdi');
  const naPog = getVal('naPog');
  const aMoBFh = getVal('aMoBFh');
  const maxMandRatio = getVal('maxMandRatio');
  const harvoldDiff = getVal('harvoldUnitDiff');
  const snOrient = getVal('snOrientationAngle');
  const softProf = getVal('softTissueProfileAngle');
  const totalProf = getVal('totalTissueProfileAngle');
  const softFacial = getVal('softTissueFacialAngle');
  const snChin = getVal('subnasaleToChin');
  const upperLip = getVal('basicUpperLip');
  const softChin = getVal('softTissueChin');

  const sna = getVal('snaAngle');
  const aNPerp = getVal('aNPerp');
  const maxSize = getVal('maxSizeAnsPns');
  const maxEff = getVal('maxEffectiveLength');
  const maxPlace = getVal('maxPlacementSInfPtmNf');

  const snb = getVal('snbAngle');
  const pogNPerp = getVal('pogNPerp');
  const facialAng = getVal('facialAngle');
  const mandCorp = getVal('mandCorpusSize');
  const mandRam = getVal('mandRamusHeight');
  const mandEff = getVal('mandEffectiveLength');
  const saddle = getVal('saddleAngle');
  const postCranial = getVal('postCranialBase');
  const gonialAng = getVal('effectOfGonialAngle');
  const ramusOrient = getVal('ramusOrientation');

  const entered = [
    anb, wits, beta, yen, w, apdi, naPog, aMoBFh, maxMandRatio, harvoldDiff, snOrient,
    softProf, totalProf, softFacial, snChin, upperLip, softChin,
    sna, aNPerp, maxSize, maxEff, maxPlace,
    snb, pogNPerp, facialAng, mandCorp, mandRam, mandEff, saddle, postCranial, gonialAng, ramusOrient
  ].filter((v) => v !== null).length;

  if (entered === 0) {
    return {
      skeletalClassification: 'Skeletal Class I',
      severityRating: 'Mild',
      softTissueInteraction: 'Matching',
      faultLocalization: {
        maxillaSize: 'Normal',
        maxillaPlacement: 'Normal',
        mandibleSize: 'Normal',
        mandiblePlacement: 'Normal',
        primaryFault: 'Harmonious',
      },
      points: [],
      summaryText: 'Please enter Cephalometric Discrepancy measurements (or load preset/auto-fetch from other analyses) to generate comprehensive diagnostic inference.',
      apicalBaseDiagnosis: 'Awaiting apical base measurements.',
      softTissueDiagnosis: 'Awaiting soft tissue measurements.',
    };
  }

  const points: DiscrepancyPoint[] = [];

  // 1. Sagittal Skeletal Classification
  const classIITallies: string[] = [];
  const classIIITallies: string[] = [];
  const classITallies: string[] = [];

  if (anb !== null) {
    if (anb > 4) classIITallies.push(`ANB of ${anb}° (>4°)`);
    else if (anb < 0) classIIITallies.push(`ANB of ${anb}° (<0°)`);
    else classITallies.push(`ANB of ${anb}°`);
  }
  if (wits !== null) {
    if (wits > 1) classIITallies.push(`Wits appraisal of ${wits} mm (>1 mm)`);
    else if (wits < -1) classIIITallies.push(`Wits appraisal of ${wits} mm (<-1 mm)`);
    else classITallies.push(`Wits appraisal of ${wits} mm`);
  }
  if (beta !== null) {
    if (beta < 27) classIITallies.push(`Beta angle of ${beta}° (<27°)`);
    else if (beta > 35) classIIITallies.push(`Beta angle of ${beta}° (>35°)`);
    else classITallies.push(`Beta angle of ${beta}°`);
  }
  if (yen !== null) {
    if (yen < 117) classIITallies.push(`YEN angle of ${yen}° (<117°)`);
    else if (yen > 123) classIIITallies.push(`YEN angle of ${yen}° (>123°)`);
    else classITallies.push(`YEN angle of ${yen}°`);
  }
  if (w !== null) {
    if (w < 51) classIITallies.push(`W angle of ${w}° (<51°)`);
    else if (w > 56) classIIITallies.push(`W angle of ${w}° (>56°)`);
    else classITallies.push(`W angle of ${w}°`);
  }
  if (apdi !== null) {
    if (apdi < 81) classIITallies.push(`APDI of ${apdi}° (<81°)`);
    else if (apdi > 85) classIIITallies.push(`APDI of ${apdi}° (>85°)`);
    else classITallies.push(`APDI of ${apdi}°`);
  }
  if (harvoldDiff !== null) {
    if (harvoldDiff < 24) classIITallies.push(`Harvold diff of ${harvoldDiff} mm (<24 mm)`);
    else if (harvoldDiff > 28) classIIITallies.push(`Harvold diff of ${harvoldDiff} mm (>28 mm)`);
    else classITallies.push(`Harvold diff of ${harvoldDiff} mm`);
  }
  if (maxMandRatio !== null) {
    if (maxMandRatio > 1.05) classIITallies.push(`Max:Mand ratio of ${maxMandRatio} (>1.05)`);
    else if (maxMandRatio < 0.95) classIIITallies.push(`Max:Mand ratio of ${maxMandRatio} (<0.95)`);
    else classITallies.push(`Max:Mand ratio of ${maxMandRatio}`);
  }

  let skeletalClassification: 'Skeletal Class I' | 'Skeletal Class II' | 'Skeletal Class III' = 'Skeletal Class I';
  let badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  if (classIITallies.length > classIIITallies.length && classIITallies.length >= 2) {
    skeletalClassification = 'Skeletal Class II';
    badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  } else if (classIIITallies.length > classIITallies.length && classIIITallies.length >= 2) {
    skeletalClassification = 'Skeletal Class III';
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40';
  }

  // 2. Severity Rating Computation
  let severityRating: 'Mild' | 'Moderate' | 'Severe' = 'Mild';
  if (skeletalClassification === 'Skeletal Class II') {
    if ((anb !== null && anb > 7.5) || (wits !== null && wits > 5.0) || (harvoldDiff !== null && harvoldDiff < 19)) {
      severityRating = 'Severe';
    } else if ((anb !== null && anb > 5.5) || (wits !== null && wits > 2.5) || (harvoldDiff !== null && harvoldDiff < 22)) {
      severityRating = 'Moderate';
    } else {
      severityRating = 'Mild';
    }
  } else if (skeletalClassification === 'Skeletal Class III') {
    if ((anb !== null && anb < -4.0) || (wits !== null && wits < -5.0) || (harvoldDiff !== null && harvoldDiff > 33)) {
      severityRating = 'Severe';
    } else if ((anb !== null && anb < -2.0) || (wits !== null && wits < -2.5) || (harvoldDiff !== null && harvoldDiff > 30)) {
      severityRating = 'Moderate';
    } else {
      severityRating = 'Mild';
    }
  } else {
    severityRating = 'Mild';
  }

  const sagDiagnosis = skeletalClassification === 'Skeletal Class II'
    ? `Skeletal Class II Sagittal Discrepancy (${severityRating} severity, corroborated by ${classIITallies.join(', ')})`
    : skeletalClassification === 'Skeletal Class III'
    ? `Skeletal Class III Sagittal Discrepancy (${severityRating} severity, corroborated by ${classIIITallies.join(', ')})`
    : `Harmonious Skeletal Class I Sagittal Relationship (corroborated by ${classITallies.join(', ') || 'normative parameters'})`;

  points.push({
    title: '1. Sagittal Skeletal Basal Relationship',
    finding: sagDiagnosis,
    badge: skeletalClassification,
    badgeColor,
  });

  // 3. Component Fault Localization (Maxilla vs Mandible Size & Placement)
  let maxillaSize: 'Normal' | 'Excess' | 'Deficient' = 'Normal';
  if (maxSize !== null) {
    if (maxSize > 62) maxillaSize = 'Excess';
    else if (maxSize < 52) maxillaSize = 'Deficient';
  } else if (maxEff !== null) {
    if (maxEff > 98) maxillaSize = 'Excess';
    else if (maxEff < 85) maxillaSize = 'Deficient';
  }

  let maxillaPlacement: 'Normal' | 'Anterior / Prognathic' | 'Posterior / Retrognathic' = 'Normal';
  if (sna !== null) {
    if (sna > 84) maxillaPlacement = 'Anterior / Prognathic';
    else if (sna < 80) maxillaPlacement = 'Posterior / Retrognathic';
  } else if (aNPerp !== null) {
    if (aNPerp > 1) maxillaPlacement = 'Anterior / Prognathic';
    else if (aNPerp < 0) maxillaPlacement = 'Posterior / Retrognathic';
  }

  let mandibleSize: 'Normal' | 'Excess' | 'Deficient' = 'Normal';
  if (mandCorp !== null) {
    if (mandCorp > 80) mandibleSize = 'Excess';
    else if (mandCorp < 70) mandibleSize = 'Deficient';
  } else if (mandEff !== null) {
    if (mandEff > 125) mandibleSize = 'Excess';
    else if (mandEff < 110) mandibleSize = 'Deficient';
  }

  let mandiblePlacement: 'Normal' | 'Prognathic' | 'Retrognathic' = 'Normal';
  if (snb !== null) {
    if (snb > 82) mandiblePlacement = 'Prognathic';
    else if (snb < 78) mandiblePlacement = 'Retrognathic';
  } else if (pogNPerp !== null) {
    if (pogNPerp > 4) mandiblePlacement = 'Prognathic';
    else if (pogNPerp < -2) mandiblePlacement = 'Retrognathic';
  }

  // Determine Primary Fault
  let primaryFault: 'Maxillary' | 'Mandibular' | 'Bi-Maxillary' | 'Harmonious' = 'Harmonious';
  const hasMaxFault = maxillaSize !== 'Normal' || maxillaPlacement !== 'Normal';
  const hasMandFault = mandibleSize !== 'Normal' || mandiblePlacement !== 'Normal';

  if (hasMaxFault && hasMandFault) {
    primaryFault = 'Bi-Maxillary';
  } else if (hasMaxFault) {
    primaryFault = 'Maxillary';
  } else if (hasMandFault) {
    primaryFault = 'Mandibular';
  } else {
    primaryFault = 'Harmonious';
  }

  const apicalParts: string[] = [];
  apicalParts.push(`Maxilla: Size ${maxillaSize}${maxSize !== null ? ` (${maxSize} mm)` : ''}, Placement ${maxillaPlacement}${sna !== null ? ` (SNA ${sna}°)` : ''}`);
  apicalParts.push(`Mandible: Size ${mandibleSize}${mandCorp !== null ? ` (${mandCorp} mm)` : ''}, Placement ${mandiblePlacement}${snb !== null ? ` (SNB ${snb}°)` : ''}`);

  const apicalBaseDiagnosis = `Primary skeletal discrepancy fault localized to: ${primaryFault} origin [${apicalParts.join('; ')}].`;
  points.push({
    title: '2. Component Fault Localization (Size & Placement)',
    finding: apicalBaseDiagnosis,
    badge: `${primaryFault} Fault`,
    badgeColor: primaryFault === 'Bi-Maxillary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : primaryFault === 'Harmonious' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  });

  // 4. Soft Tissue Interaction Computation
  let softTissueInteraction: 'Matching' | 'Compensating' | 'Aggravating' = 'Matching';
  const softParts: string[] = [];

  if (softProf !== null) {
    if (softProf < 157) softParts.push(`convex profile angle (${softProf}° vs 161° norm)`);
    else if (softProf > 165) softParts.push(`straight/concave profile angle (${softProf}°)`);
    else softParts.push(`harmonious profile angle (${softProf}°)`);
  }
  if (upperLip !== null) {
    if (upperLip < 13) softParts.push(`thin upper lip (${upperLip} mm vs 14 mm norm, limited buffering)`);
    else if (upperLip > 15) softParts.push(`thick upper lip cushion (${upperLip} mm)`);
  }
  if (softChin !== null) {
    if (softChin < 10) softParts.push(`thin soft chin pad (${softChin} mm vs 11 mm norm)`);
    else if (softChin > 12) softParts.push(`thick soft chin cushion (${softChin} mm)`);
  }
  if (totalProf !== null) {
    const totalNorm = gender === 'Male' ? 133 : 137;
    if (totalProf < (gender === 'Male' ? 130 : 134)) softParts.push(`hyper-convex total profile (${totalProf}° vs ${totalNorm}° norm)`);
  }

  if (skeletalClassification === 'Skeletal Class II') {
    if ((softChin !== null && softChin > 12) || (upperLip !== null && upperLip > 15)) {
      softTissueInteraction = 'Compensating';
    } else if ((softChin !== null && softChin < 10) || (softProf !== null && softProf < 155) || (upperLip !== null && upperLip < 13)) {
      softTissueInteraction = 'Aggravating';
    } else {
      softTissueInteraction = 'Matching';
    }
  } else if (skeletalClassification === 'Skeletal Class III') {
    if ((softChin !== null && softChin > 12) || (softProf !== null && softProf > 168)) {
      softTissueInteraction = 'Aggravating';
    } else if (softChin !== null && softChin < 10) {
      softTissueInteraction = 'Compensating';
    } else {
      softTissueInteraction = 'Matching';
    }
  } else {
    softTissueInteraction = 'Matching';
  }

  const softTissueDiagnosis = softTissueInteraction === 'Compensating'
    ? `Soft tissue envelope is COMPENSATING for the underlying skeletal disharmony (${softParts.join(', ') || 'thick soft tissue cushioning softens skeletal discrepancy'}).`
    : softTissueInteraction === 'Aggravating'
    ? `Soft tissue envelope is AGGRAVATING the skeletal discrepancy (${softParts.join(', ') || 'deficient soft tissue pad exacerbates facial convexity/retrusion'}).`
    : `Soft tissue envelope is MATCHING the skeletal foundation (${softParts.join(', ') || 'proportional lip and chin cushion'}).`;

  points.push({
    title: '3. Soft Tissue Profile & Esthetic Mask Interaction',
    finding: softTissueDiagnosis,
    badge: softTissueInteraction,
    badgeColor: softTissueInteraction === 'Compensating'
      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
      : softTissueInteraction === 'Aggravating'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : 'bg-teal-500/20 text-teal-300 border-teal-500/40',
  });

  const stageLabel = stage === 'pre' ? 'Pre-Treatment' : stage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';
  const bulletLines = points.map((p, i) => `${i + 1}. ${p.title}: ${p.finding}`);
  const summaryText = `Cephalometric Discrepancy Diagnostic Conclusion (${stageLabel}):\n• Diagnosis: ${skeletalClassification} (${severityRating} Severity)\n• Primary Fault: ${primaryFault} Localization\n• Soft Tissue Dynamics: ${softTissueInteraction}\n${bulletLines.join('\n')}`;

  return {
    skeletalClassification,
    severityRating,
    softTissueInteraction,
    faultLocalization: {
      maxillaSize,
      maxillaPlacement,
      mandibleSize,
      mandiblePlacement,
      primaryFault,
    },
    points,
    summaryText,
    apicalBaseDiagnosis,
    softTissueDiagnosis,
  };
}

export const CephDiscrepancyAnalysis: React.FC<CephDiscrepancyAnalysisProps> = ({
  data,
  gender = 'Female',
  onChange,
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
  currentStage = 'pre',
  patientAge = 12,
  patientGender = 'Female',
  downsAnalysis,
  steinersAnalysis,
  rickettsAnalysis,
  mcnamaraAnalysis,
  schwarzTweedAnalysis,
  holdawayAnalysis,
  cogsAnalysis,
  cogsSoftTissueAnalysis,
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

  const [params, setParams] = useState<CephDiscrepancyParametersMap>(() => {
    if (data?.parameters) return { ...DEFAULT_CEPH_DISCREPANCY_PARAMS, ...data.parameters };
    return DEFAULT_CEPH_DISCREPANCY_PARAMS;
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.parameters) setParams((prev) => ({ ...prev, ...data.parameters }));
  }, [data?.parameters]);

  const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';
  const genderValid: 'Female' | 'Male' = (gender === 'Male' || patientGender === 'Male') ? 'Male' : 'Female';

  const autoFetchedMap = useMemo(() => {
    return extractPrimaryCephValues({
      downsAnalysis,
      steinersAnalysis,
      rickettsAnalysis,
      mcnamaraAnalysis,
      schwarzTweedAnalysis,
      holdawayAnalysis,
      cogsAnalysis,
      cogsSoftTissueAnalysis,
      stage: stageKey,
    });
  }, [
    downsAnalysis,
    steinersAnalysis,
    rickettsAnalysis,
    mcnamaraAnalysis,
    schwarzTweedAnalysis,
    holdawayAnalysis,
    cogsAnalysis,
    cogsSoftTissueAnalysis,
    stageKey,
  ]);

  const inferenceResult = useMemo(() => {
    return calculateOverallCephInference(params, autoFetchedMap, stageKey, genderValid);
  }, [params, autoFetchedMap, stageKey, genderValid]);

  const handleValueChange = (key: CephDiscrepancyParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updated = { ...params, [key]: { ...params[key], [stage]: newNumber } };
    setParams(updated);
    const updatedInference = calculateOverallCephInference(updated, autoFetchedMap, stage, genderValid);
    if (onChange) {
      onChange({
        parameters: updated,
        gender: genderValid,
        skeletalClassification: updatedInference.skeletalClassification,
        severityRating: updatedInference.severityRating,
        softTissueInteraction: updatedInference.softTissueInteraction,
        diagnosticConclusion: updatedInference.summaryText,
        conclusion: updatedInference.summaryText,
      });
    }
  };

  const handleReset = () => {
    const emptyParams = { ...DEFAULT_CEPH_DISCREPANCY_PARAMS };
    setParams(emptyParams);
    if (onChange) {
      onChange({
        parameters: emptyParams,
        gender: genderValid,
        skeletalClassification: 'Skeletal Class I',
        severityRating: 'Mild',
        softTissueInteraction: 'Matching',
        diagnosticConclusion: '',
        conclusion: '',
      });
    }
  };

  const categories: CephDiscrepancyCategory[] = [
    'Hard Tissue Sagittal Standards',
    'Soft Tissue Profile Metrics',
    'Sagittal Orientation & Soft Tissue Effects',
    'Detailed Maxillary Discrepancy Breakdown',
    'Detailed Mandibular Discrepancy Breakdown',
  ];

  const totalParamsCount = CEPH_DISCREPANCY_PARAMETERS_META.length;

  const activeCount = useMemo(() => {
    return CEPH_DISCREPANCY_PARAMETERS_META.filter((m) => {
      const userVal = params[m.key]?.[currentStage];
      const autoVal = autoFetchedMap[m.key]?.value;
      const v = userVal !== '' && userVal !== undefined ? userVal : autoVal;
      return v !== '' && v !== undefined && !isNaN(Number(v));
    }).length;
  }, [params, currentStage, autoFetchedMap]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all w-full max-w-full">
      {/* Accordion Card Header */}
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
                  Cephalometric Discrepancy & Soft Tissue Analysis
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  {totalParamsCount} Parameters
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Sagittal, Apical Bases, Harvold, Max:Mand Ratio, SN Orientation & Soft Tissue Mask
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeCount === 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                0/{totalParamsCount} Measured
              </span>
            ) : activeCount === totalParamsCount ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                <span>{activeCount}/{totalParamsCount} Measured</span>
              </span>
            )}

            <div className="text-slate-400 p-0.5 rounded-lg">
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-700" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        {activeCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${activeCount === totalParamsCount ? 'bg-emerald-500' : 'bg-teal-500'}`}
              style={{ width: `${(activeCount / totalParamsCount) * 100}%` }}
            />
          </div>
        )}
      </button>

      {/* Accordion Body Content */}
      {isOpen && (
        <div className="p-3 sm:p-5 space-y-6 bg-slate-50/50">
          {/* Top Presets Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mr-1">
                Discrepancy Presets:
              </span>
              <button
                type="button"
                onClick={() => {
                  setParams(CLASS_I_DISCREPANCY_SAMPLE);
                  const inf = calculateOverallCephInference(CLASS_I_DISCREPANCY_SAMPLE, autoFetchedMap, stageKey, genderValid);
                  if (onChange) {
                    onChange({
                      parameters: CLASS_I_DISCREPANCY_SAMPLE,
                      gender: genderValid,
                      skeletalClassification: inf.skeletalClassification,
                      severityRating: inf.severityRating,
                      softTissueInteraction: inf.softTissueInteraction,
                      diagnosticConclusion: inf.summaryText,
                      conclusion: inf.summaryText,
                    });
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Class I Norm
              </button>
              <button
                type="button"
                onClick={() => {
                  setParams(CLASS_II_DISCREPANCY_SAMPLE);
                  const inf = calculateOverallCephInference(CLASS_II_DISCREPANCY_SAMPLE, autoFetchedMap, stageKey, genderValid);
                  if (onChange) {
                    onChange({
                      parameters: CLASS_II_DISCREPANCY_SAMPLE,
                      gender: genderValid,
                      skeletalClassification: inf.skeletalClassification,
                      severityRating: inf.severityRating,
                      softTissueInteraction: inf.softTissueInteraction,
                      diagnosticConclusion: inf.summaryText,
                      conclusion: inf.summaryText,
                    });
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Class II Discrepancy
              </button>
              <button
                type="button"
                onClick={() => {
                  setParams(CLASS_III_DISCREPANCY_SAMPLE);
                  const inf = calculateOverallCephInference(CLASS_III_DISCREPANCY_SAMPLE, autoFetchedMap, stageKey, genderValid);
                  if (onChange) {
                    onChange({
                      parameters: CLASS_III_DISCREPANCY_SAMPLE,
                      gender: genderValid,
                      skeletalClassification: inf.skeletalClassification,
                      severityRating: inf.severityRating,
                      softTissueInteraction: inf.softTissueInteraction,
                      diagnosticConclusion: inf.summaryText,
                      conclusion: inf.summaryText,
                    });
                  }
                }}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Class III Discrepancy
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>

          {/* Parameter Rows by Category */}
          {categories.map((cat) => {
            const catMetas = CEPH_DISCREPANCY_PARAMETERS_META.filter((m) => m.category === cat);

            return (
              <div key={cat} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 px-1 border-l-3 border-teal-600 pl-2">
                    {cat} ({catMetas.length} Parameters)
                  </h5>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {catMetas.map((meta) => {
                    const userVal = params[meta.key]?.[stageKey] ?? '';
                    const autoValObj = autoFetchedMap[meta.key];
                    const val = userVal !== '' ? userVal : (autoValObj?.value ?? '');
                    const autoFetchedSource = userVal === '' && autoValObj ? autoValObj.source : undefined;

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
                        autoFetchedSource={autoFetchedSource}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Dedicated Automated Overall Inference Synthesis Engine Card */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 text-white rounded-2xl shadow-lg border border-teal-700/50 space-y-4">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-teal-800/60 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-teal-100 uppercase tracking-wider">
                    Automated Overall Cephalometric & Soft Tissue Synthesis
                  </h4>
                  <span className="text-[10px] font-semibold text-teal-400">
                    {stageKey === 'pre' ? 'Pre-Treatment' : stageKey === 'mid' ? 'Mid-Treatment' : 'Post-Treatment'} Comprehensive Diagnostic Synthesis
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inferenceResult.summaryText);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-800/80 hover:bg-teal-700 text-teal-200 hover:text-white border border-teal-600/50 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
                </button>
              </div>
            </div>

            {/* Diagnostic Core Badges: Skeletal Classification, Severity Rating, Soft Tissue Interaction */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Classification */}
              <div className="p-3 rounded-xl bg-white/[0.05] border border-teal-500/20 space-y-1">
                <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
                  <span>Skeletal Classification</span>
                </div>
                <div className="text-sm font-extrabold text-white">
                  {inferenceResult.skeletalClassification}
                </div>
              </div>

              {/* Severity */}
              <div className="p-3 rounded-xl bg-white/[0.05] border border-teal-500/20 space-y-1">
                <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-teal-400" />
                  <span>Severity Rating</span>
                </div>
                <div className={`text-sm font-extrabold ${
                  inferenceResult.severityRating === 'Severe' ? 'text-rose-400' :
                  inferenceResult.severityRating === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {inferenceResult.severityRating} Severity
                </div>
              </div>

              {/* Soft Tissue Interaction */}
              <div className="p-3 rounded-xl bg-white/[0.05] border border-teal-500/20 space-y-1">
                <div className="text-[10px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Smile className="w-3.5 h-3.5 text-teal-400" />
                  <span>Soft Tissue Interaction</span>
                </div>
                <div className={`text-sm font-extrabold ${
                  inferenceResult.softTissueInteraction === 'Compensating' ? 'text-purple-300' :
                  inferenceResult.softTissueInteraction === 'Aggravating' ? 'text-rose-400' : 'text-teal-300'
                }`}>
                  {inferenceResult.softTissueInteraction}
                </div>
              </div>
            </div>

            {/* Individual Synthesized Finding Points */}
            {inferenceResult.points.length === 0 ? (
              <p className="text-xs sm:text-sm leading-relaxed text-slate-300 font-medium italic">
                Please enter Cephalometric Discrepancy measurements (or load preset/auto-fetch from other analyses) to generate sagittal and apical base diagnostic inference.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {inferenceResult.points.map((pt, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-teal-500/20 hover:border-teal-500/40 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-teal-200 uppercase tracking-wide">
                          {pt.title}
                        </span>
                        {pt.badge && (
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${pt.badgeColor || 'bg-teal-500/20 text-teal-300 border-teal-500/40'}`}>
                            {pt.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-[13px] leading-relaxed text-slate-200 font-normal">
                        {pt.finding}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Integrated 4-Sheet Comprehensive Orthodontic Case Analysis */}
          <div className="pt-4 border-t border-slate-200/80">
            <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 px-1 mb-2">
              Integrated Comprehensive Orthodontic Case Synthesis
            </h4>
            <ComprehensiveCephAnalysis
              activeStage={currentStage}
              patientAge={patientAge}
              patientGender={patientGender}
              downsAnalysis={downsAnalysis}
              steinersAnalysis={steinersAnalysis}
              rickettsAnalysis={rickettsAnalysis}
              mcnamaraAnalysis={mcnamaraAnalysis}
              schwarzTweedAnalysis={schwarzTweedAnalysis}
              holdawayAnalysis={holdawayAnalysis}
              cogsAnalysis={cogsAnalysis}
              cogsSoftTissueAnalysis={cogsSoftTissueAnalysis}
              cephDiscrepancyAnalysis={data}
            />
          </div>
        </div>
      )}
    </div>
  );
};
