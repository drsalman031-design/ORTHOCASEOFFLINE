import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Activity,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Scissors,
  ShieldAlert,
  Sliders,
  Check,
  X,
  ArrowRight,
  Copy,
} from 'lucide-react';
import {
  Gender,
  SteinersAnalysisData,
  DownsAnalysisData,
  SchwarzTweedAnalysisData,
  McnamaraAnalysisData,
  RickettsAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CogsSoftTissueAnalysisData,
  CephDiscrepancyAnalysisData,
} from '../../types';
import { extractPrimaryCephValues } from '../../lib/cephAutoFetchEngine';

export type AnalysisStage = 'preRx' | 'pGrMod' | 'preIII' | 'postRx' | 'retention' | 'change';

export interface StageData {
  // Sagittal Classification
  skeletal_class?: 'Class I' | 'Class II' | 'Class III';
  skeletal_subtype?: string;

  // Section 1: Vertical Skeletal Relation & Divergence
  mid_lower_face_ht?: number | '';
  soft_tissue_vert_prop?: number | '';
  sn_go_gn?: number | '';
  fma?: number | '';
  jarabak_ratio?: number | '';
  bjork_sum?: number | '';
  saddle_angle?: number | '';
  articular_angle?: number | '';
  u_gonial_angle?: number | '';
  l_gonial_angle?: number | '';
  yaxis_ns_gn?: number | '';
  yaxis_fh_s_gn?: number | '';
  ramus_height_ar_go?: number | '';
  compensated_by_ramus_height?: boolean | string;
  basal_plane_angle?: number | '';
  occlusal_to_nf?: number | '';
  occlusal_to_mp?: number | '';
  vert_max_placement?: number | '';
  nasion_to_ans?: number | '';
  maxillary_rotation?: number | '';

  divergence_subclassification?:
    | 'anterior_divergent'
    | 'anterior_convergent'
    | 'upward_rotation_max_mand'
    | 'downward_rotation_max_mand'
    | string;
  anterior_divergent?: boolean;
  anterior_convergent?: boolean;
  upward_rotation_max_mand?: boolean;
  downward_rotation_max_mand?: boolean;

  // Section 2: Sagittal/Vertical Interaction & Exposure
  sagittal_unaffected?: boolean;
  sagittal_caused_by_vertical?: boolean;
  sagittal_worsened_by_vertical?: boolean;
  sagittal_compensated?: boolean;

  ui_exposure_rest?: number | '';
  ui_exposure_smile?: number | '';
  ans_to_incisor?: number | '';
  u_lip_length?: number | '';

  palatal_cortex?: string;
  symphyseal_cortex?: string;
  symphyseal_location?: string;
  sagittal_alteration?: 'Needed' | 'Not Needed' | '';
  vertical_alteration?: 'Needed' | 'Not Needed' | '';
  skeletal_alteration?: 'Needed' | 'Not Needed' | '';
  selected_pathway?: string;
  growth_status?: string;

  // Section 3: Upper Dento-Alveolar & Soft Tissue
  n_a_mm?: number | '';
  ui_sn?: number | '';
  ui_na_deg?: number | '';
  ui_na_mm?: number | '';
  ui_nl?: number | '';
  ui_apog_deg?: number | '';
  ui_apog_mm?: number | '';
  ui_npog_mm?: number | '';
  nasolabial_angle?: number | '';
  nasal_angle?: number | '';
  labial_angle?: number | '';
  u_lip_thickness?: number | '';
  basic_u_lip_thickness?: number | '';
  lip_strain?: boolean;

  // Section 4: Lower Dento-Alveolar & Soft Tissue
  li_fh?: number | '';
  li_mp?: number | '';
  li_nb_deg?: number | '';
  li_nb_mm?: number | '';
  li_apog_mm?: number | '';
  li_npog_mm?: number | '';
  li_nb_holdaway_ratio?: number | '';
  mentolabial_angle?: number | '';
  l_lip_thickness?: number | '';
  l_lip_length?: number | '';
}

export type ComprehensiveCephData = Record<string, StageData>;

interface ComprehensiveCephAnalysisProps {
  data?: Partial<ComprehensiveCephData>;
  onChange?: (data: ComprehensiveCephData) => void;
  activeStage?: 'pre' | 'mid' | 'post';
  patientAge?: number | string;
  patientGender?: Gender;
  isOpen?: boolean;
  onToggle?: () => void;
  downsAnalysis?: DownsAnalysisData;
  steinersAnalysis?: SteinersAnalysisData;
  rickettsAnalysis?: RickettsAnalysisData;
  mcnamaraAnalysis?: McnamaraAnalysisData;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  holdawayAnalysis?: HoldawayAnalysisData;
  cogsAnalysis?: CogsAnalysisData;
  cogsSoftTissueAnalysis?: CogsSoftTissueAnalysisData;
  cephDiscrepancyAnalysis?: CephDiscrepancyAnalysisData;
}

export const DEFAULT_STAGE_DATA: StageData = {
  skeletal_class: 'Class I',
  skeletal_subtype: 'Class I Normal / Bimaxillary',
  mid_lower_face_ht: 45,
  sn_go_gn: '',
  fma: '',
  jarabak_ratio: '',
  bjork_sum: '',
  saddle_angle: '',
  articular_angle: '',
  u_gonial_angle: '',
  l_gonial_angle: '',
  yaxis_ns_gn: '',
  yaxis_fh_s_gn: '',
  basal_plane_angle: '',
  occlusal_to_nf: '',
  occlusal_to_mp: '',
  nasion_to_ans: '',

  anterior_divergent: false,
  anterior_convergent: false,
  upward_rotation_max_mand: false,
  downward_rotation_max_mand: false,

  sagittal_unaffected: true,
  sagittal_caused_by_vertical: false,
  sagittal_worsened_by_vertical: false,
  sagittal_compensated: false,

  ui_exposure_rest: '',
  ui_exposure_smile: '',
  ans_to_incisor: '',
  u_lip_length: '',

  palatal_cortex: 'Adequate',
  symphyseal_cortex: 'Adequate',
  symphyseal_location: 'Mandible',
  sagittal_alteration: 'Needed',
  vertical_alteration: 'Not Needed',
  skeletal_alteration: 'Needed',
  selected_pathway: 'Growth Modulation',
  growth_status: 'Actively Growing',

  n_a_mm: '',
  ui_sn: '',
  ui_na_deg: '',
  ui_na_mm: '',
  ui_nl: '',
  ui_apog_deg: '',
  ui_apog_mm: '',
  ui_npog_mm: '',
  nasolabial_angle: '',
  nasal_angle: '',
  labial_angle: '',
  u_lip_thickness: '',
  basic_u_lip_thickness: '',
  lip_strain: false,

  li_fh: '',
  li_mp: '',
  li_nb_deg: '',
  li_nb_mm: '',
  li_apog_mm: '',
  li_npog_mm: '',
  li_nb_holdaway_ratio: '',
  mentolabial_angle: '',
  l_lip_thickness: '',
  l_lip_length: '',
};

export const CLASS1_PRESET_DATA: StageData = {
  skeletal_class: 'Class I',
  skeletal_subtype: 'Class I Bimaxillary Alignment',
  mid_lower_face_ht: 45,
  sn_go_gn: 32,
  fma: 25,
  jarabak_ratio: 63.5,
  bjork_sum: 396,
  saddle_angle: 123,
  articular_angle: 143,
  u_gonial_angle: 54,
  l_gonial_angle: 76,
  yaxis_ns_gn: 59,
  yaxis_fh_s_gn: 59,
  basal_plane_angle: 25,
  occlusal_to_nf: 14,
  occlusal_to_mp: 14,
  nasion_to_ans: 55,
  anterior_divergent: false,
  anterior_convergent: false,
  upward_rotation_max_mand: false,
  downward_rotation_max_mand: false,
  sagittal_unaffected: true,
  sagittal_caused_by_vertical: false,
  sagittal_worsened_by_vertical: false,
  sagittal_compensated: false,
  ui_exposure_rest: 2.5,
  ui_exposure_smile: 2.0,
  ans_to_incisor: 32,
  u_lip_length: 22,
  n_a_mm: 0,
  ui_sn: 104,
  ui_na_deg: 24,
  ui_na_mm: 4,
  ui_nl: 110,
  ui_apog_deg: 28,
  ui_apog_mm: 5,
  ui_npog_mm: 2,
  nasolabial_angle: 102,
  nasal_angle: 30,
  labial_angle: 72,
  u_lip_thickness: 13,
  basic_u_lip_thickness: 15,
  lip_strain: false,
  li_fh: 65,
  li_mp: 93,
  li_nb_deg: 25,
  li_nb_mm: 4,
  li_apog_mm: 2,
  li_npog_mm: 1,
  li_nb_holdaway_ratio: 1.0,
  mentolabial_angle: 124,
  l_lip_thickness: 13,
  l_lip_length: 44,
};

export const CLASS2_PRESET_DATA: StageData = {
  skeletal_class: 'Class II',
  skeletal_subtype: 'Class II Div 1 (Mandibular Retrognathism & Proclined Upper Incisors)',
  mid_lower_face_ht: 42,
  sn_go_gn: 36,
  fma: 29,
  jarabak_ratio: 60.5,
  bjork_sum: 404,
  saddle_angle: 126,
  articular_angle: 147,
  u_gonial_angle: 55,
  l_gonial_angle: 76,
  yaxis_ns_gn: 64,
  yaxis_fh_s_gn: 63,
  basal_plane_angle: 29,
  occlusal_to_nf: 17,
  occlusal_to_mp: 16,
  nasion_to_ans: 56,
  anterior_divergent: true,
  anterior_convergent: false,
  upward_rotation_max_mand: false,
  downward_rotation_max_mand: true,
  sagittal_unaffected: false,
  sagittal_caused_by_vertical: false,
  sagittal_worsened_by_vertical: true,
  sagittal_compensated: false,
  ui_exposure_rest: 4.5,
  ui_exposure_smile: 4.0,
  ans_to_incisor: 35,
  u_lip_length: 20,
  n_a_mm: 2.5,
  ui_sn: 114,
  ui_na_deg: 32,
  ui_na_mm: 8.5,
  ui_nl: 118,
  ui_apog_deg: 36,
  ui_apog_mm: 9,
  ui_npog_mm: 7,
  nasolabial_angle: 90,
  nasal_angle: 26,
  labial_angle: 64,
  u_lip_thickness: 11,
  basic_u_lip_thickness: 14,
  lip_strain: true,
  li_fh: 56,
  li_mp: 99,
  li_nb_deg: 31,
  li_nb_mm: 7.5,
  li_apog_mm: 4,
  li_npog_mm: 2,
  li_nb_holdaway_ratio: 1.4,
  mentolabial_angle: 102,
  l_lip_thickness: 11,
  l_lip_length: 42,
};

export const CLASS3_PRESET_DATA: StageData = {
  skeletal_class: 'Class III',
  skeletal_subtype: 'Class III (Mandibular Prognathism & Midface Deficiency)',
  mid_lower_face_ht: 47,
  sn_go_gn: 27,
  fma: 20,
  jarabak_ratio: 67.5,
  bjork_sum: 386,
  saddle_angle: 118,
  articular_angle: 138,
  u_gonial_angle: 52,
  l_gonial_angle: 78,
  yaxis_ns_gn: 55,
  yaxis_fh_s_gn: 54,
  basal_plane_angle: 20,
  occlusal_to_nf: 11,
  occlusal_to_mp: 12,
  nasion_to_ans: 53,
  anterior_divergent: false,
  anterior_convergent: true,
  upward_rotation_max_mand: true,
  downward_rotation_max_mand: false,
  sagittal_unaffected: false,
  sagittal_caused_by_vertical: false,
  sagittal_worsened_by_vertical: false,
  sagittal_compensated: true,
  ui_exposure_rest: 1.5,
  ui_exposure_smile: 1.0,
  ans_to_incisor: 28,
  u_lip_length: 23,
  n_a_mm: -2.5,
  ui_sn: 112,
  ui_na_deg: 30,
  ui_na_mm: 6.5,
  ui_nl: 116,
  ui_apog_deg: 24,
  ui_apog_mm: 2,
  ui_npog_mm: -1,
  nasolabial_angle: 114,
  nasal_angle: 32,
  labial_angle: 82,
  u_lip_thickness: 14,
  basic_u_lip_thickness: 16,
  lip_strain: false,
  li_fh: 74,
  li_mp: 81,
  li_nb_deg: 17,
  li_nb_mm: 1.5,
  li_apog_mm: -1,
  li_npog_mm: 3,
  li_nb_holdaway_ratio: 0.6,
  mentolabial_angle: 144,
  l_lip_thickness: 14,
  l_lip_length: 46,
};

// -------------------------------------------------------------
// INLINE INFERENCE EVALUATOR FUNCTIONS
// -------------------------------------------------------------

// Section A: Vertical Skeletal Parameters
const getBjorkSumInference = (val: number) => {
  if (val > 402) return { status: 'high' as const, text: '⚠️ Hyperdivergent / Clockwise Growth Pattern' };
  if (val < 390) return { status: 'low' as const, text: '⚠️ Hypodivergent / Counter-Clockwise Pattern' };
  return { status: 'normal' as const, text: '✓ Normodivergent Growth Pattern' };
};

const getJarabakInference = (val: number) => {
  if (val < 62) return { status: 'high' as const, text: '⚠️ Anterior Divergent Rotation' };
  if (val > 65) return { status: 'low' as const, text: '⚠️ Anterior Convergent Rotation' };
  return { status: 'normal' as const, text: '✓ Balanced Vertical Proportions' };
};

const getSnGoGnInference = (val: number) => {
  if (val > 35) return { status: 'high' as const, text: '⚠️ High Mandibular Plane Angle' };
  if (val < 29) return { status: 'low' as const, text: '⚠️ Low Mandibular Plane Angle' };
  return { status: 'normal' as const, text: '✓ Normal Mandibular Plane Inclination' };
};

const getFmaInference = (val: number) => {
  if (val > 28) return { status: 'high' as const, text: '⚠️ High Frankfort-Mandibular Angle' };
  if (val < 22) return { status: 'low' as const, text: '⚠️ Low Frankfort-Mandibular Angle' };
  return { status: 'normal' as const, text: '✓ Normal FMA' };
};

const getSaddleInference = (val: number) => {
  if (val > 128) return { status: 'high' as const, text: '⚠️ Posterior Condyle / Mandibular Retrognathism' };
  if (val < 118) return { status: 'low' as const, text: '⚠️ Anterior Condyle / Mandibular Prognathism' };
  return { status: 'normal' as const, text: '✓ Normal Cranial Base Flexure' };
};

const getArticularInference = (val: number) => {
  if (val > 149) return { status: 'high' as const, text: '⚠️ Backward Ramus Orientation / Vertical Vector' };
  if (val < 137) return { status: 'low' as const, text: '⚠️ Forward Ramus Orientation / Horizontal Vector' };
  return { status: 'normal' as const, text: '✓ Normal Articular Relation' };
};

const getUpperGonialInference = (val: number) => {
  if (val > 55) return { status: 'high' as const, text: '⚠️ Backward Ramus Tilt' };
  if (val < 52) return { status: 'low' as const, text: '⚠️ Forward Ramus Inclination' };
  return { status: 'normal' as const, text: '✓ Normal Ramus Position' };
};

const getLowerGonialInference = (val: number) => {
  if (val > 75) return { status: 'high' as const, text: '⚠️ Downward/Backward Mandibular Body Rotation' };
  if (val < 70) return { status: 'low' as const, text: '⚠️ Horizontal Mandibular Body Orientation' };
  return { status: 'normal' as const, text: '✓ Normal Mandibular Body Orientation' };
};

const getMidLowerFaceInference = (val: number) => {
  if (val > 48) return { status: 'high' as const, text: '⚠️ Increased Upper Anterior Face Height' };
  if (val < 42) return { status: 'low' as const, text: '⚠️ Decreased Upper Face / Lower Face Excess' };
  return { status: 'normal' as const, text: '✓ Normal Facial Height Ratio' };
};

const getYaxisNsGnInference = (val: number) => {
  if (val > 69) return { status: 'high' as const, text: '⚠️ Vertical Facial Growth Vector' };
  if (val < 63) return { status: 'low' as const, text: '⚠️ Horizontal Facial Growth Vector' };
  return { status: 'normal' as const, text: '✓ Normal Growth Axis' };
};

const getYaxisFhSGnInference = (val: number) => {
  if (val > 62) return { status: 'high' as const, text: '⚠️ Downward & Backward Growth Vector' };
  if (val < 56) return { status: 'low' as const, text: '⚠️ Forward Growth Vector' };
  return { status: 'normal' as const, text: '✓ Balanced Growth Axis' };
};

const getNasionToAnsInference = (gender?: Gender | string) => (val: number) => {
  const minNorm = gender === 'Female' ? 53 : 56;
  const maxNorm = gender === 'Female' ? 57 : 64;
  if (val > maxNorm) return { status: 'high' as const, text: '⚠️ Increased Upper Anterior Facial Height' };
  if (val < minNorm) return { status: 'low' as const, text: '⚠️ Decreased Upper Anterior Facial Height' };
  return { status: 'normal' as const, text: '✓ Normal Upper Anterior Height' };
};

const getSoftTissueVertPropInference = (val: number) => {
  if (val > 36) return { status: 'high' as const, text: '⚠️ Elongated Upper Lip Philtrum (>36%)' };
  if (val < 30) return { status: 'low' as const, text: '⚠️ Short Upper Lip / Lower Lip & Chin Dominance (<30%)' };
  return { status: 'normal' as const, text: '✓ Balanced 1:2 Soft Tissue Proportions' };
};

const getRamusHeightInference = (val: number) => {
  if (val < 46) return { status: 'low' as const, text: '⚠️ Short Ramus Height / Uncompensated Vertical Risk' };
  if (val > 52) return { status: 'high' as const, text: '✓ Tall Ramus Height / High Vertical Compensation' };
  return { status: 'normal' as const, text: '✓ Normal Ramus Height (46-52 mm)' };
};

const getBasalPlaneInference = (val: number) => {
  if (val > 30) return { status: 'high' as const, text: '⚠️ High Inter-Basal Divergence (>30°)' };
  if (val < 20) return { status: 'low' as const, text: '⚠️ Convergent Basal Planes / Skeletal Deep Bite (<20°)' };
  return { status: 'normal' as const, text: '✓ Normal Inter-Basal Plane Angle (20°-30°)' };
};

const getOcclusalToNfInference = (val: number) => {
  if (val > 18) return { status: 'high' as const, text: '⚠️ Steep Maxillary Occlusal Plane Incline (>18°)' };
  if (val < 10) return { status: 'low' as const, text: '⚠️ Flat Maxillary Occlusal Plane Incline (<10°)' };
  return { status: 'normal' as const, text: '✓ Harmonious Palatal-Occlusal Incline (10°-18°)' };
};

const getOcclusalToMpInference = (val: number) => {
  if (val > 18) return { status: 'high' as const, text: '⚠️ Increased Mandibular Occlusal Divergence (>18°)' };
  if (val < 10) return { status: 'low' as const, text: '⚠️ Decreased Mandibular Occlusal Divergence (<10°)' };
  return { status: 'normal' as const, text: '✓ Normal Mandibular-Occlusal Incline (10°-18°)' };
};

const getVertMaxPlacementInference = (val: number) => {
  if (val > 60) return { status: 'high' as const, text: '⚠️ Vertical Maxillary Excess / Long Midface (>60 mm)' };
  if (val < 53) return { status: 'low' as const, text: '⚠️ Vertical Maxillary Deficiency / Short Midface (<53 mm)' };
  return { status: 'normal' as const, text: '✓ Ideal Vertical Maxillary Position (53-60 mm)' };
};

const getMaxillaryRotationInference = (val: number) => {
  if (val > 11) return { status: 'high' as const, text: '⚠️ Downward Anterior Palatal Tipping / Clockwise (>11°)' };
  if (val < 5) return { status: 'low' as const, text: '⚠️ Upward Anterior Palatal Tipping / Counter-Clockwise (<5°)' };
  return { status: 'normal' as const, text: '✓ Normal Maxillary Rotation to SN (5°-11°)' };
};

// Section B: Upper Dentoalveolar & Soft Tissue Parameters
const getNAInference = (val: number) => {
  if (val > 3) return { status: 'high' as const, text: '⚠️ Maxillary Prognathism / Forward Position' };
  if (val < -3) return { status: 'low' as const, text: '⚠️ Maxillary Retrognathism / Deficient Position' };
  return { status: 'normal' as const, text: '✓ Normal Maxillary AP Position' };
};

const getUiNaMmInference = (val: number) => {
  if (val > 6) return { status: 'high' as const, text: '⚠️ Maxillary Dentoalveolar Protrusion' };
  if (val < 2) return { status: 'low' as const, text: '⚠️ Maxillary Dentoalveolar Retrusion' };
  return { status: 'normal' as const, text: '✓ Normal Upper Incisor Position' };
};

const getUiSnInference = (val: number) => {
  if (val > 106) return { status: 'high' as const, text: '⚠️ Upper Incisor Proclination' };
  if (val < 98) return { status: 'low' as const, text: '⚠️ Upper Incisor Retroclination' };
  return { status: 'normal' as const, text: '✓ Normal Incisor Inclination' };
};

const getNasolabialInference = (val: number) => {
  if (val > 110) return { status: 'high' as const, text: '⚠️ Obtuse Nasolabial Angle (Upper Limit / Retraction Caution)' };
  if (val < 94) return { status: 'low' as const, text: '⚠️ Acute Nasolabial Angle (Supports Incisor Retraction)' };
  return { status: 'normal' as const, text: '✓ Balanced Nasolabial Profile' };
};

const getUiNaDegInference = (val: number) => {
  if (val > 26) return { status: 'high' as const, text: '⚠️ Upper Incisor Proclination to NA' };
  if (val < 18) return { status: 'low' as const, text: '⚠️ Upper Incisor Retroclination to NA' };
  return { status: 'normal' as const, text: '✓ Normal UI-NA Inclination' };
};

const getULipThicknessInference = (val: number) => {
  if (val < 12) return { status: 'low' as const, text: '⚠️ Thin Upper Lip (Sensitive Profile)' };
  if (val > 15) return { status: 'high' as const, text: '⚠️ Thick Upper Lip (High Cushioning)' };
  return { status: 'normal' as const, text: '✓ Normal Upper Lip Thickness' };
};

// Section C: Lower Dentoalveolar & Soft Tissue Parameters
const getLiNbMmInference = (val: number) => {
  if (val > 6) return { status: 'high' as const, text: '⚠️ Mandibular Dentoalveolar Protrusion' };
  if (val < 2) return { status: 'low' as const, text: '⚠️ Mandibular Dentoalveolar Retrusion' };
  return { status: 'normal' as const, text: '✓ Normal Lower Incisor Position' };
};

const getLiMpInference = (val: number) => {
  if (val > 98) return { status: 'high' as const, text: '⚠️ Lower Incisor Proclination' };
  if (val < 92) return { status: 'low' as const, text: '⚠️ Lower Incisor Retroclination' };
  return { status: 'normal' as const, text: '✓ Normal IMPA' };
};

const getMentolabialInference = (val: number) => {
  if (val < 110) return { status: 'amber' as const, text: '⚠️ Deep Mentolabial Sulcus (Everted Lower Lip)' };
  if (val > 139) return { status: 'low' as const, text: '⚠️ Shallow / Flat Mentolabial Sulcus' };
  return { status: 'normal' as const, text: '✓ Normal Mentolabial Sulcus Depth' };
};

const getLiFhInference = (val: number) => {
  if (val < 61) return { status: 'low' as const, text: '⚠️ Lower Incisor Labial Tipping' };
  if (val > 69) return { status: 'high' as const, text: '⚠️ Lower Incisor Upright Position' };
  return { status: 'normal' as const, text: '✓ Normal FMIA Angle' };
};

const getHoldawayInference = (val: number) => {
  if (val > 1.2) return { status: 'high' as const, text: '⚠️ Incisor Protrusion Relative to Chin' };
  if (val < 0.8) return { status: 'low' as const, text: '⚠️ Dominant Chin / Retruded Incisor' };
  return { status: 'normal' as const, text: '✓ Balanced Holdaway Ratio' };
};

// Section 2: Exposure & Soft Tissue
const getUiRestInference = (val: number) => {
  if (val > 4) return { status: 'high' as const, text: '⚠️ Excessive Incisor Exposure at Rest' };
  if (val < 1) return { status: 'low' as const, text: '⚠️ Deficient Incisor Show / Hidden Teeth' };
  return { status: 'normal' as const, text: '✓ Normal Incisor Show at Rest' };
};

const getUiSmileInference = (val: number) => {
  if (val > 3) return { status: 'high' as const, text: '⚠️ Gummy Smile Exposure (>3mm Gingiva)' };
  if (val < 0) return { status: 'low' as const, text: '⚠️ Incomplete Incisor Display on Smile' };
  return { status: 'normal' as const, text: '✓ Ideal Gingival Display on Smile' };
};

const getAnsToIncisorInference = (gender?: Gender | string) => (val: number) => {
  const maxVal = gender === 'Female' ? 33 : 36;
  const minVal = gender === 'Female' ? 27 : 30;
  if (val > maxVal) return { status: 'high' as const, text: '⚠️ Maxillary Dentoalveolar Vertical Excess' };
  if (val < minVal) return { status: 'low' as const, text: '⚠️ Maxillary Vertical Deficiency' };
  return { status: 'normal' as const, text: '✓ Normal Dentoalveolar Height' };
};

const getULipLengthInference = (val: number) => {
  if (val < 20) return { status: 'low' as const, text: '⚠️ Short Upper Lip (Philtrum Deficiency)' };
  if (val > 24) return { status: 'high' as const, text: '⚠️ Long Upper Lip' };
  return { status: 'normal' as const, text: '✓ Normal Upper Lip Length' };
};

// -------------------------------------------------------------
// INDIVIDUAL SHEET ANALYSIS MODELS & CARD COMPONENT
// -------------------------------------------------------------
interface SheetPoint {
  title: string;
  finding: string;
  badge?: string;
  badgeColor?: string;
}

interface SheetAnalysisSummaryCardProps {
  sheetNumber: number;
  sheetTitle: string;
  stageLabel: string;
  points: SheetPoint[];
}

const SheetAnalysisSummaryCard: React.FC<SheetAnalysisSummaryCardProps> = ({
  sheetNumber,
  sheetTitle,
  stageLabel,
  points,
}) => {
  const [copied, setCopied] = useState(false);

  const fullText = useMemo(() => {
    const lines = points.map((p, i) => `${i + 1}. ${p.title}: ${p.finding}`);
    return `Sheet ${sheetNumber} Diagnostic Inferences - ${sheetTitle} (${stageLabel}):\n${lines.join('\n')}`;
  }, [sheetNumber, sheetTitle, stageLabel, points]);

  if (points.length === 0) return null;

  return (
    <div className="mt-4 p-4 sm:p-5 bg-gradient-to-br from-slate-900 via-teal-950 to-slate-950 text-white rounded-2xl shadow-lg border border-teal-700/50 space-y-3.5">
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-teal-800/60 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center border border-teal-500/30 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h5 className="text-xs sm:text-sm font-extrabold text-teal-100 uppercase tracking-wider">
              Sheet {sheetNumber} Diagnostic Summary & Inferences
            </h5>
            <span className="text-[10px] font-semibold text-teal-400">
              {sheetTitle} • {stageLabel}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText(fullText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-teal-800/80 hover:bg-teal-700 text-teal-200 hover:text-white border border-teal-600/50 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied!' : 'Copy Sheet Analysis'}</span>
        </button>
      </div>

      <ul className="space-y-2">
        {points.map((pt, idx) => (
          <li
            key={idx}
            className="flex items-start gap-2.5 p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-teal-500/20 hover:border-teal-500/40 transition-colors"
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
    </div>
  );
};

// -------------------------------------------------------------
// INDIVIDUAL SHEET ANALYSIS GENERATORS
// -------------------------------------------------------------
const getSheet1Analysis = (d: StageData, gender?: Gender | string): { points: SheetPoint[] } => {
  const points: SheetPoint[] = [];

  const bjorkNum = typeof d.bjork_sum === 'number' ? d.bjork_sum : NaN;
  const jarabakNum = typeof d.jarabak_ratio === 'number' ? d.jarabak_ratio : NaN;
  const fmaNum = typeof d.fma === 'number' ? d.fma : NaN;
  const snGoGnNum = typeof d.sn_go_gn === 'number' ? d.sn_go_gn : NaN;
  const saddleNum = typeof d.saddle_angle === 'number' ? d.saddle_angle : NaN;
  const articularNum = typeof d.articular_angle === 'number' ? d.articular_angle : NaN;
  const lGonialNum = typeof d.l_gonial_angle === 'number' ? d.l_gonial_angle : NaN;
  const yaxisNum = typeof d.yaxis_ns_gn === 'number' ? d.yaxis_ns_gn : NaN;
  const midLowerNum = typeof d.mid_lower_face_ht === 'number' ? d.mid_lower_face_ht : NaN;

  // 1. Overall Growth Divergence Vector
  let growthPattern = 'Normodivergent balanced vertical facial pattern';
  let growthBadge = 'Normodivergent';
  let growthColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  if ((!isNaN(bjorkNum) && bjorkNum > 402) || (!isNaN(fmaNum) && fmaNum > 28) || (!isNaN(snGoGnNum) && snGoGnNum > 35)) {
    growthPattern = `Hyperdivergent vertical growth pattern with steep mandibular plane (Björk Sum: ${!isNaN(bjorkNum) ? bjorkNum + '°' : '-'}, FMA: ${!isNaN(fmaNum) ? fmaNum + '°' : '-'}, SN-GoGn: ${!isNaN(snGoGnNum) ? snGoGnNum + '°' : '-'})`;
    growthBadge = 'Hyperdivergent';
    growthColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40';
  } else if ((!isNaN(bjorkNum) && bjorkNum < 390) || (!isNaN(fmaNum) && fmaNum < 22) || (!isNaN(snGoGnNum) && snGoGnNum < 29)) {
    growthPattern = `Hypodivergent horizontal growth pattern with low mandibular plane angle (Björk Sum: ${!isNaN(bjorkNum) ? bjorkNum + '°' : '-'}, FMA: ${!isNaN(fmaNum) ? fmaNum + '°' : '-'})`;
    growthBadge = 'Hypodivergent';
    growthColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40';
  }

  points.push({
    title: 'Growth Pattern & Divergence Vector',
    finding: growthPattern,
    badge: growthBadge,
    badgeColor: growthColor,
  });

  // 2. Mandibular Rotational Tendency (Jarabak & Gonial Angles)
  let rotationFinding = 'Balanced rotational equilibrium without significant vertical jaw rotation.';
  if (!isNaN(jarabakNum)) {
    if (jarabakNum < 62) {
      rotationFinding = `Anterior Divergent / Clockwise mandibular rotation (Jarabak: ${jarabakNum}% < 62%) with posterior vertical height deficiency.`;
    } else if (jarabakNum > 65) {
      rotationFinding = `Anterior Convergent / Counter-Clockwise mandibular rotation (Jarabak: ${jarabakNum}% > 65%) predisposing to deep bite.`;
    } else {
      rotationFinding = `Balanced Jarabak Ratio (${jarabakNum}% [norm 62-65%]) confirming harmonious anterior-posterior facial height balance.`;
    }
  }
  points.push({
    title: 'Rotational Vector & Jarabak Ratio',
    finding: rotationFinding,
  });

  // 3. Cranial Base & Gonial Subdivisions & Ramus Compensation
  const cranialParts: string[] = [];
  if (!isNaN(saddleNum)) {
    if (saddleNum > 128) cranialParts.push(`obtuse saddle angle (${saddleNum}°) promoting backward mandibular position`);
    else if (saddleNum < 118) cranialParts.push(`acute saddle angle (${saddleNum}°) promoting forward mandibular position`);
  }
  if (!isNaN(articularNum)) {
    if (articularNum > 149) cranialParts.push(`increased articular angle (${articularNum}°) exacerbating retrognathic profile`);
    else if (articularNum < 137) cranialParts.push(`reduced articular angle (${articularNum}°)`);
  }
  if (!isNaN(lGonialNum)) {
    if (lGonialNum > 75) cranialParts.push(`increased lower gonial angle (${lGonialNum}°) promoting downward-backward growth`);
    else if (lGonialNum < 70) cranialParts.push(`decreased lower gonial angle (${lGonialNum}°) indicating strong horizontal chin thrust`);
  }

  const ramusNum = typeof d.ramus_height_ar_go === 'number' ? d.ramus_height_ar_go : NaN;
  if (!isNaN(ramusNum)) {
    if (ramusNum >= 50) cranialParts.push(`robust ramus height (${ramusNum} mm) providing vertical skeletal compensation against clockwise opening`);
    else if (ramusNum < 45) cranialParts.push(`short ramus height (${ramusNum} mm) leaving vertical growth uncompensated`);
  }

  if (cranialParts.length > 0) {
    points.push({
      title: 'Cranial Base, Gonial Form & Ramus Compensation',
      finding: `Morphometric analysis reveals ${cranialParts.join(' with ')}.`,
    });
  }

  // 4. Facial Height Proportions, Inter-Basal & Divergence Classification
  const propParts: string[] = [];
  if (!isNaN(yaxisNum)) {
    if (yaxisNum > 69) propParts.push(`downward-backward growth direction (Y-Axis: ${yaxisNum}°)`);
    else if (yaxisNum < 63) propParts.push(`horizontal-forward growth direction (Y-Axis: ${yaxisNum}°)`);
  }
  if (!isNaN(midLowerNum)) {
    if (midLowerNum < 43) propParts.push(`lower anterior facial height excess (Mid/Lower ratio: ${midLowerNum}%)`);
    else if (midLowerNum > 47) propParts.push(`reduced lower facial height (Mid/Lower ratio: ${midLowerNum}%)`);
  }

  const basalPlaneNum = typeof d.basal_plane_angle === 'number' ? d.basal_plane_angle : NaN;
  if (!isNaN(basalPlaneNum)) {
    if (basalPlaneNum > 30) propParts.push(`steep inter-basal plane angle (${basalPlaneNum}°)`);
    else if (basalPlaneNum < 20) propParts.push(`convergent inter-basal planes (${basalPlaneNum}°)`);
  }

  // Sub-classification check
  if (d.divergence_subclassification === 'anterior_divergent' || d.anterior_divergent) {
    propParts.push('Subclassification (a): Anterior Divergent jaw bases (open-bite tendency with posterior convergence)');
  } else if (d.divergence_subclassification === 'anterior_convergent' || d.anterior_convergent) {
    propParts.push('Subclassification (b): Anterior Convergent jaw bases (deep-bite tendency with posterior divergence)');
  } else if (d.divergence_subclassification === 'upward_rotation_max_mand' || d.upward_rotation_max_mand) {
    propParts.push('Subclassification (c): Upward anterior rotation of maxilla and mandible');
  } else if (d.divergence_subclassification === 'downward_rotation_max_mand' || d.downward_rotation_max_mand) {
    propParts.push('Subclassification (d): Downward anterior rotation of maxilla and mandible');
  }

  if (propParts.length > 0) {
    points.push({
      title: 'Facial Proportions & Inter-Basal Sub-Classification',
      finding: propParts.join('; '),
    });
  }

  return { points };
};

const getSheet2Analysis = (d: StageData, gender?: Gender | string): { points: SheetPoint[] } => {
  const points: SheetPoint[] = [];

  const skClass = d.skeletal_class || 'Class I';
  const subtype = d.skeletal_subtype || 'Class I Normal / Bimaxillary';
  const restExp = typeof d.ui_exposure_rest === 'number' ? d.ui_exposure_rest : NaN;
  const smileExp = typeof d.ui_exposure_smile === 'number' ? d.ui_exposure_smile : NaN;
  const ansInc = typeof d.ans_to_incisor === 'number' ? d.ans_to_incisor : NaN;
  const lipLen = typeof d.u_lip_length === 'number' ? d.u_lip_length : NaN;

  // 1. Sagittal Malocclusion Classification
  points.push({
    title: 'Skeletal Sagittal Malocclusion',
    finding: `${skClass} (${subtype})`,
    badge: skClass,
    badgeColor: skClass === 'Class II' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : skClass === 'Class III' ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  });

  // 2. Sagittal / Vertical Coupling Dynamics
  let couplingFinding = 'Sagittal discrepancy is independent of vertical skeletal rotational vectors.';
  if (d.sagittal_worsened_by_vertical) {
    couplingFinding = 'Sagittal discrepancy is significantly exacerbated/worsened by downward-backward mandibular plane rotation.';
  } else if (d.sagittal_caused_by_vertical) {
    couplingFinding = 'Sagittal discrepancy is primarily caused by vertical divergence rotation rather than true basal discrepancy.';
  } else if (d.sagittal_compensated) {
    couplingFinding = 'Sagittal discrepancy is masked/compensated by counter-clockwise mandibular autorotation.';
  }
  points.push({
    title: 'Sagittal-Vertical Coupling Dynamics',
    finding: couplingFinding,
  });

  // 3. Incisor Exposure & Smile Esthetics
  let exposureFinding = 'Normal aesthetic incisor display at rest and on smile.';
  if (!isNaN(restExp) && !isNaN(smileExp)) {
    if (restExp > 4 || smileExp > 3) {
      exposureFinding = `Excessive maxillary incisor display (Rest: ${restExp} mm, Smile: ${smileExp} mm) indicating gummy smile tendency.`;
    } else if (restExp < 1 || smileExp < 0) {
      exposureFinding = `Inadequate maxillary incisor show (Rest: ${restExp} mm, Smile: ${smileExp} mm) with hidden incisor display.`;
    } else {
      exposureFinding = `Ideal incisal display (Rest: ${restExp} mm [norm 2-4 mm], Smile: ${smileExp} mm [norm 1-3 mm]).`;
    }
  }
  points.push({
    title: 'Incisor Exposure & Smile Esthetics',
    finding: exposureFinding,
  });

  // 4. Dentoalveolar Height & Lip Length
  const dentoLipParts: string[] = [];
  if (!isNaN(ansInc)) {
    const cutoff = gender === 'Female' ? 33 : 36;
    if (ansInc > cutoff) dentoLipParts.push(`maxillary vertical dentoalveolar excess (ANS-Incisor: ${ansInc} mm)`);
    else if (ansInc < cutoff - 6) dentoLipParts.push(`maxillary vertical dentoalveolar deficiency (ANS-Incisor: ${ansInc} mm)`);
  }
  if (!isNaN(lipLen)) {
    if (lipLen < 20) dentoLipParts.push(`short upper lip (Philtrum: ${lipLen} mm vs 22 mm norm)`);
    else if (lipLen > 24) dentoLipParts.push(`long upper lip (${lipLen} mm)`);
  }
  if (dentoLipParts.length > 0) {
    points.push({
      title: 'Upper Dentoalveolar Height & Lip Length',
      finding: dentoLipParts.join(' with '),
    });
  }

  return { points };
};

const getSheet3Analysis = (d: StageData, gender?: Gender | string): { points: SheetPoint[] } => {
  const points: SheetPoint[] = [];

  const naMm = typeof d.n_a_mm === 'number' ? d.n_a_mm : NaN;
  const uiSn = typeof d.ui_sn === 'number' ? d.ui_sn : NaN;
  const uiNaMm = typeof d.ui_na_mm === 'number' ? d.ui_na_mm : NaN;
  const nla = typeof d.nasolabial_angle === 'number' ? d.nasolabial_angle : NaN;
  const uLipThick = typeof d.u_lip_thickness === 'number' ? d.u_lip_thickness : NaN;

  // 1. Maxillary AP Skeletal Position
  let maxPos = 'Orthognathic maxillary AP position.';
  if (!isNaN(naMm)) {
    if (naMm > 3) maxPos = `Maxillary skeletal AP excess / prognathism (N-A: +${naMm} mm vs 0±3 mm norm).`;
    else if (naMm < -3) maxPos = `Maxillary skeletal AP hypoplasia / retrusion (N-A: ${naMm} mm).`;
    else maxPos = `Harmonious maxillary AP position (N-A: ${naMm} mm).`;
  }
  points.push({
    title: 'Maxillary AP Basal Position',
    finding: maxPos,
  });

  // 2. Upper Incisor Inclination & Protrusion
  const incParts: string[] = [];
  if (!isNaN(uiSn)) {
    if (uiSn > 106) incParts.push(`UI-SN proclined (${uiSn}° > 106°)`);
    else if (uiSn < 98) incParts.push(`UI-SN retroclined (${uiSn}° < 98°)`);
    else incParts.push(`UI-SN normal (${uiSn}°)`);
  }
  if (!isNaN(uiNaMm)) {
    if (uiNaMm > 6) incParts.push(`UI-NA protrusive (${uiNaMm} mm > 6 mm)`);
    else if (uiNaMm < 2) incParts.push(`UI-NA retrusive (${uiNaMm} mm < 2 mm)`);
  }
  if (incParts.length > 0) {
    points.push({
      title: 'Upper Incisor Inclination & Protrusion',
      finding: incParts.join(', '),
    });
  }

  // 3. Permissible Incisor Retraction
  const retractionMm = !isNaN(uiNaMm) ? Math.max(0, Number((uiNaMm - 4).toFixed(1))) : 0;
  points.push({
    title: 'Upper Incisor Retraction Target',
    finding: retractionMm > 0 ? `${retractionMm} mm permissible incisor retraction to reach normative dental position.` : 'Upper incisors are in ideal sagittal position; no retraction required.',
  });

  // 4. Nasolabial Angle & Soft Tissue Support
  const softParts: string[] = [];
  if (!isNaN(nla)) {
    if (nla < 94) softParts.push(`acute nasolabial angle (${nla}° < 94°) supporting full anterior retraction`);
    else if (nla > 110) softParts.push(`obtuse nasolabial angle (${nla}° > 110°) warning: high risk of profile flattening`);
    else softParts.push(`balanced nasolabial angle (${nla}°)`);
  }
  if (!isNaN(uLipThick)) {
    if (uLipThick >= 14) softParts.push(`thick upper lip cushioning (${uLipThick} mm)`);
    else if (uLipThick < 12) softParts.push(`thin upper lip profile (${uLipThick} mm) sensitive to incisor movement`);
  }
  if (d.lip_strain) softParts.push('mentalis / upper lip strain present at rest');

  if (softParts.length > 0) {
    points.push({
      title: 'Nasolabial Angle & Upper Lip Profile',
      finding: softParts.join('; '),
    });
  }

  return { points };
};

const getSheet4Analysis = (d: StageData, gender?: Gender | string): { points: SheetPoint[] } => {
  const points: SheetPoint[] = [];

  const liMp = typeof d.li_mp === 'number' ? d.li_mp : NaN;
  const liFh = typeof d.li_fh === 'number' ? d.li_fh : NaN;
  const liNbMm = typeof d.li_nb_mm === 'number' ? d.li_nb_mm : NaN;
  const holdaway = typeof d.li_nb_holdaway_ratio === 'number' ? d.li_nb_holdaway_ratio : NaN;
  const mento = typeof d.mentolabial_angle === 'number' ? d.mentolabial_angle : NaN;
  const lLipThick = typeof d.l_lip_thickness === 'number' ? d.l_lip_thickness : NaN;

  // 1. Lower Incisor Inclination (IMPA & FMIA)
  let impaFinding = 'Normal mandibular incisor inclination.';
  if (!isNaN(liMp)) {
    if (liMp > 98) {
      impaFinding = `Proclined mandibular incisors (IMPA: ${liMp}° > 98°), indicating dentoalveolar protrusion or compensation. Caution: cortical boundary limit.`;
    } else if (liMp < 92) {
      impaFinding = `Retroclined mandibular incisors (IMPA: ${liMp}° < 92°). Safe leeway available for anterior leveling or pro-inclination.`;
    } else {
      impaFinding = `Ideal mandibular incisor axial inclination (IMPA: ${liMp}° [norm 95° ± 3°]).`;
    }
  }
  points.push({
    title: 'Mandibular Incisor Inclination (IMPA / FMIA)',
    finding: impaFinding,
  });

  // 2. Lower Incisor Position to Basal Bone (LI-NB)
  const liParts: string[] = [];
  if (!isNaN(liNbMm)) {
    if (liNbMm > 6) liParts.push(`protrusive lower incisors (LI-NB: ${liNbMm} mm > 6 mm)`);
    else if (liNbMm < 2) liParts.push(`retrusive lower incisors (LI-NB: ${liNbMm} mm < 2 mm)`);
    else liParts.push(`well-positioned incisors (LI-NB: ${liNbMm} mm)`);
  }
  if (!isNaN(liFh)) {
    if (liFh < 61) liParts.push(`acute FMIA (${liFh}° < 61°)`);
    else if (liFh > 69) liParts.push(`upright FMIA (${liFh}° > 69°)`);
  }
  if (liParts.length > 0) {
    points.push({
      title: 'Lower Incisor AP Position to NB & FH',
      finding: liParts.join(' with '),
    });
  }

  // 3. Holdaway Ratio Harmony (LI-NB vs Pog-NB)
  let holdawayFinding = 'Balanced 1:1 Holdaway ratio between lower incisor and bony chin projection.';
  if (!isNaN(holdaway)) {
    if (holdaway > 1.2) {
      holdawayFinding = `Increased Holdaway Ratio (${holdaway} > 1.2), indicating incisor protrusion over bony chin projection.`;
    } else if (holdaway < 0.8) {
      holdawayFinding = `Decreased Holdaway Ratio (${holdaway} < 0.8), indicating prominent bony chin or retrusive incisors.`;
    }
  }
  points.push({
    title: 'Holdaway Ratio Harmony',
    finding: holdawayFinding,
  });

  // 4. Mentolabial Sulcus & Lower Lip Harmony
  const softParts: string[] = [];
  if (!isNaN(mento)) {
    if (mento < 110) softParts.push(`deep, acute mentolabial sulcus (${mento}° < 110°) with everted lower lip roll`);
    else if (mento > 139) softParts.push(`shallow / flat mentolabial sulcus (${mento}° > 139°)`);
    else softParts.push(`harmonious mentolabial sulcus (${mento}°)`);
  }
  if (!isNaN(lLipThick)) {
    softParts.push(`lower lip thickness of ${lLipThick} mm`);
  }
  if (softParts.length > 0) {
    points.push({
      title: 'Mentolabial Sulcus & Lower Lip Harmony',
      finding: softParts.join(', '),
    });
  }

  return { points };
};

// -------------------------------------------------------------
// REUSABLE CEPH FIELD CARD COMPONENT
// -------------------------------------------------------------
interface CephFieldCardProps {
  label: string;
  subtitle?: string;
  normText: string;
  unit?: string;
  value: number | string;
  placeholder?: string;
  disabled?: boolean;
  onChange: (val: string) => void;
  getInference?: (val: number) => {
    status: 'normal' | 'high' | 'low' | 'amber';
    text: string;
  } | null;
}

const CephFieldCard: React.FC<CephFieldCardProps> = ({
  label,
  subtitle,
  normText,
  unit,
  value,
  placeholder,
  disabled,
  onChange,
  getInference,
}) => {
  const numVal = typeof value === 'number' ? value : parseFloat(String(value));
  const hasValidNum = value !== '' && value !== undefined && value !== null && !isNaN(numVal);
  const inference = hasValidNum && getInference ? getInference(numVal) : null;

  let inputBorderClass = 'border-slate-300 focus:ring-teal-500 focus:border-teal-500';
  let badgeStyle = '';
  let Icon = CheckCircle2;

  if (inference) {
    if (inference.status === 'normal') {
      inputBorderClass = 'border-emerald-400 focus:ring-emerald-500 bg-emerald-50/40';
      badgeStyle = 'bg-emerald-50 border-emerald-200 text-emerald-900 font-extrabold';
      Icon = CheckCircle2;
    } else if (inference.status === 'high') {
      inputBorderClass = 'border-rose-400 focus:ring-rose-500 bg-rose-50/40';
      badgeStyle = 'bg-rose-50 border-rose-200 text-rose-950 font-extrabold';
      Icon = AlertTriangle;
    } else if (inference.status === 'low') {
      inputBorderClass = 'border-sky-400 focus:ring-sky-500 bg-sky-50/40';
      badgeStyle = 'bg-sky-50 border-sky-200 text-sky-950 font-extrabold';
      Icon = AlertTriangle;
    } else if (inference.status === 'amber') {
      inputBorderClass = 'border-amber-400 focus:ring-amber-500 bg-amber-50/40';
      badgeStyle = 'bg-amber-50 border-amber-200 text-amber-950 font-extrabold';
      Icon = AlertTriangle;
    }
  }

  return (
    <div className="p-3.5 sm:p-4 bg-white rounded-2xl border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between hover:border-slate-300 transition-colors w-full box-border min-w-0 overflow-hidden">
      {/* ROW 1: Title Header & Unit Badge */}
      <div className="w-full flex items-start justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <label className="text-xs sm:text-sm font-extrabold text-slate-900 block leading-snug break-words">
            {label}
          </label>
          {subtitle && (
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 block leading-tight mt-0.5 break-words">
              {subtitle}
            </span>
          )}
        </div>
        {unit && (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono text-[10px] uppercase font-black shrink-0 border border-slate-200/80">
            {unit}
          </span>
        )}
      </div>

      {/* ROW 2: Norm Context Pill */}
      <div className="text-[10px] sm:text-[11px] text-teal-900 font-extrabold bg-teal-50/90 border border-teal-200/80 px-2.5 py-0.5 rounded-lg inline-block w-fit max-w-full truncate">
        Norm: {normText}
      </div>

      {/* ROW 3: Touch-friendly Full Width Numeric Input Box */}
      <div className="w-full">
        <input
          type="number"
          step="any"
          placeholder={placeholder}
          value={value ?? ''}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full min-h-[44px] px-3.5 py-2 bg-slate-50 border rounded-xl text-sm sm:text-base font-black text-slate-900 text-right focus:outline-none focus:ring-2 focus:bg-white transition-all shadow-2xs ${inputBorderClass}`}
        />
      </div>

      {/* ROW 4: Dynamic Inline Inference Chip / Badge */}
      {inference ? (
        <div className={`w-full flex items-start gap-1.5 px-3 py-2 rounded-xl border text-xs leading-relaxed shadow-2xs ${badgeStyle}`}>
          <Icon className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="break-words font-extrabold flex-1">{inference.text}</span>
        </div>
      ) : (
        <div className="w-full flex items-center justify-between text-[10px] font-extrabold text-slate-600 bg-slate-100/80 px-2.5 py-1.5 rounded-lg border border-slate-200/80">
          <span>STATUS:</span>
          <span className="uppercase tracking-wider">UNMEASURED</span>
        </div>
      )}
    </div>
  );
};

export const ComprehensiveCephAnalysis: React.FC<ComprehensiveCephAnalysisProps> = ({
  data: externalData,
  onChange,
  activeStage = 'pre',
  patientAge = 12,
  patientGender = 'Male',
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
  downsAnalysis,
  steinersAnalysis,
  rickettsAnalysis,
  mcnamaraAnalysis,
  schwarzTweedAnalysis,
  holdawayAnalysis,
  cogsAnalysis,
  cogsSoftTissueAnalysis,
  cephDiscrepancyAnalysis,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const onToggle = externalOnToggle || (() => setInternalIsOpen((v) => !v));

  const [openSection, setOpenSection] = useState<number | null>(1);

  // Internal state if external data is not fully bound
  const [localData, setLocalData] = useState<ComprehensiveCephData>(() => ({
    pre: { ...DEFAULT_STAGE_DATA },
    mid: { ...DEFAULT_STAGE_DATA },
    post: { ...DEFAULT_STAGE_DATA },
  }));

  const currentDataset: ComprehensiveCephData = useMemo(() => {
    return {
      pre: { ...DEFAULT_STAGE_DATA, ...(externalData?.pre || localData.pre) },
      mid: { ...DEFAULT_STAGE_DATA, ...(externalData?.mid || localData.mid) },
      post: { ...DEFAULT_STAGE_DATA, ...(externalData?.post || localData.post) },
    };
  }, [externalData, localData]);

  // Auto-fetch parameters from primary analysis datasets
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
      stage: activeStage as any,
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
    activeStage,
  ]);

  // Derived dataset for active stage with auto-fetched fallback values
  const activeData: StageData = useMemo(() => {
    const rawData = currentDataset[activeStage] || DEFAULT_STAGE_DATA;
    const merged: StageData = { ...rawData };

    Object.keys(autoFetchedMap).forEach((key) => {
      const stageKey = key as keyof StageData;
      if (merged[stageKey] === '' || merged[stageKey] === undefined) {
        (merged as any)[stageKey] = autoFetchedMap[key].value;
      }
    });

    return merged;
  }, [activeStage, currentDataset, autoFetchedMap]);

  const updateActiveData = (field: keyof StageData, val: any) => {
    const updatedStage = { ...(currentDataset[activeStage] || DEFAULT_STAGE_DATA), [field]: val };
    const updatedFull: ComprehensiveCephData = {
      ...currentDataset,
      [activeStage]: updatedStage,
    };
    if (onChange) {
      onChange(updatedFull);
    } else {
      setLocalData(updatedFull);
    }
  };

  const handleLoadPreset = (presetType: 'class1' | 'class2' | 'class3') => {
    const presetData =
      presetType === 'class1'
        ? CLASS1_PRESET_DATA
        : presetType === 'class2'
        ? CLASS2_PRESET_DATA
        : CLASS3_PRESET_DATA;

    const updatedStage = { ...presetData };
    const updatedFull: ComprehensiveCephData = {
      ...currentDataset,
      [activeStage]: updatedStage,
    };
    if (onChange) {
      onChange(updatedFull);
    } else {
      setLocalData(updatedFull);
    }
  };

  const handleResetStage = () => {
    const emptyStage = { ...DEFAULT_STAGE_DATA };
    const updatedFull: ComprehensiveCephData = {
      ...currentDataset,
      [activeStage]: emptyStage,
    };
    if (onChange) {
      onChange(updatedFull);
    } else {
      setLocalData(updatedFull);
    }
  };

  // Helper for numeric inputs
  const handleNumChange = (field: keyof StageData, strVal: string) => {
    if (strVal === '') {
      updateActiveData(field, '');
    } else {
      const parsed = parseFloat(strVal);
      updateActiveData(field, isNaN(parsed) ? '' : parsed);
    }
  };

  // Helper status color badges
  const getNormBadge = (val: number | '', minNorm: number, maxNorm: number) => {
    if (val === '') return null;
    if (val >= minNorm && val <= maxNorm) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">Normal</span>;
    }
    const diff = Math.min(Math.abs(val - minNorm), Math.abs(val - maxNorm));
    if (diff <= 3) {
      return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200">Mild Dev</span>;
    }
    return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-200">Severe Dev</span>;
  };

  const toggleSection = (idx: number) => {
    setOpenSection(openSection === idx ? null : idx);
  };

  return (
    <div className="w-full bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all my-3">
      {/* CARD HEADER */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full bg-white text-slate-900 p-3.5 sm:p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 border-b border-slate-200 transition-colors text-left block"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate flex items-center gap-2">
              <span>Comprehensive Orthodontic Case Analysis</span>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200 uppercase tracking-wide font-extrabold hidden sm:inline-block">
                Auto-Inference
              </span>
            </h3>
            <p className="text-xs text-slate-600 truncate font-medium">
              4-Sheet Vertical, Sagittal & Soft Tissue Evaluation Engine
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="p-3 sm:p-4 space-y-4 bg-slate-50/50">
          {/* QUICK CASE SYNTHESIS PRESET TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-3.5 bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Case Synthesis Presets:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleLoadPreset('class1')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Class I Preset
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('class2')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Class II Preset
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset('class3')}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                Class III Preset
              </button>
              <button
                type="button"
                onClick={handleResetStage}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-all cursor-pointer"
              >
                Reset Stage
              </button>
            </div>
          </div>

          {/* ACCORDION SECTIONS */}
          <div className="space-y-3">
            {/* ------------------------------------------------------------- */}
            {/* SECTION 1: Vertical Skeletal Relation & Divergence */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(1)}
                className="w-full p-3 bg-slate-100/80 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-teal-700">📐 1.</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Vertical Skeletal Relation & Divergence (Sheet 1)
                  </span>
                </div>
                {openSection === 1 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openSection === 1 && (
                <div className="p-3 sm:p-4 space-y-4 border-t border-slate-200/80">
                  <div className="flex flex-col space-y-3.5 w-full">
                    <CephFieldCard
                      label="Björk Sum (°)"
                      subtitle="Saddle + Articular + Gonial Angles"
                      normText="396° ± 6° (390° - 402°)"
                      unit="°"
                      placeholder="396"
                      value={activeData.bjork_sum ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('bjork_sum', val)}
                      getInference={getBjorkSumInference}
                    />

                    <CephFieldCard
                      label="Jarabak Ratio (%)"
                      subtitle="Posterior / Anterior Face Height (S-Go / N-Me)"
                      normText="62% - 65%"
                      unit="%"
                      placeholder="63.5"
                      value={activeData.jarabak_ratio ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('jarabak_ratio', val)}
                      getInference={getJarabakInference}
                    />

                    <CephFieldCard
                      label="Mid/Lower Face Ht Ratio"
                      subtitle="Anterior Facial Height Proportion (N-ANS : ANS-Me)"
                      normText="45:55 (45%)"
                      unit="%"
                      placeholder="45"
                      value={activeData.mid_lower_face_ht ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('mid_lower_face_ht', val)}
                      getInference={getMidLowerFaceInference}
                    />

                    <CephFieldCard
                      label="Soft Tissue Vert Proportions"
                      subtitle="Sn-Stms : Stmi-Me' (Normal 1:2)"
                      normText="30% - 36% (1:2 Proportion)"
                      unit="%"
                      placeholder="33"
                      value={activeData.soft_tissue_vert_prop ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('soft_tissue_vert_prop', val)}
                      getInference={getSoftTissueVertPropInference}
                    />

                    <CephFieldCard
                      label="SN-GoGn (°)"
                      subtitle="Mandibular Plane Angle to SN"
                      normText="32° ± 4° (28° - 36°)"
                      unit="°"
                      placeholder="32"
                      value={activeData.sn_go_gn ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('sn_go_gn', val)}
                      getInference={getSnGoGnInference}
                    />

                    <CephFieldCard
                      label="FMA / FMPA (°)"
                      subtitle="Frankfort-Mandibular Plane Angle"
                      normText="25° ± 4° (21° - 29°)"
                      unit="°"
                      placeholder="25"
                      value={activeData.fma ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('fma', val)}
                      getInference={getFmaInference}
                    />

                    <CephFieldCard
                      label="Saddle Angle (°)"
                      subtitle="Nasion - Saddle - Articular (N-S-Ar)"
                      normText="123° ± 5° (118° - 128°)"
                      unit="°"
                      placeholder="123"
                      value={activeData.saddle_angle ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('saddle_angle', val)}
                      getInference={getSaddleInference}
                    />

                    <CephFieldCard
                      label="Articular Angle (°)"
                      subtitle="Saddle - Articular - Gonion (S-Ar-Go)"
                      normText="143° ± 6° (137° - 149°)"
                      unit="°"
                      placeholder="143"
                      value={activeData.articular_angle ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('articular_angle', val)}
                      getInference={getArticularInference}
                    />

                    <CephFieldCard
                      label="Upper Gonial Angle (°)"
                      subtitle="Articular - Gonion - Nasion (Ar-Go-N)"
                      normText="52° - 55°"
                      unit="°"
                      placeholder="53"
                      value={activeData.u_gonial_angle ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('u_gonial_angle', val)}
                      getInference={getUpperGonialInference}
                    />

                    <CephFieldCard
                      label="Lower Gonial Angle (°)"
                      subtitle="Nasion - Gonion - Menton (N-Go-Me)"
                      normText="70° - 75°"
                      unit="°"
                      placeholder="72"
                      value={activeData.l_gonial_angle ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('l_gonial_angle', val)}
                      getInference={getLowerGonialInference}
                    />

                    <CephFieldCard
                      label="Y-Axis NS-Gn (°)"
                      subtitle="Growth Axis Angle to SN (Downs)"
                      normText="66° ± 3° (63° - 69°)"
                      unit="°"
                      placeholder="66"
                      value={activeData.yaxis_ns_gn ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('yaxis_ns_gn', val)}
                      getInference={getYaxisNsGnInference}
                    />

                    <CephFieldCard
                      label="Y-Axis FH-S-Gn (°)"
                      subtitle="Growth Axis Angle to FH"
                      normText="59° ± 3° (56° - 62°)"
                      unit="°"
                      placeholder="59"
                      value={activeData.yaxis_fh_s_gn ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('yaxis_fh_s_gn', val)}
                      getInference={getYaxisFhSGnInference}
                    />

                    <CephFieldCard
                      label="Ramus Height (mm)"
                      subtitle="Articulare to Gonion (Ar-Go)"
                      normText="46 to 52 mm"
                      unit="mm"
                      placeholder="49"
                      value={activeData.ramus_height_ar_go ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('ramus_height_ar_go', val)}
                      getInference={getRamusHeightInference}
                    />

                    <CephFieldCard
                      label="Basal Plane Angle (°)"
                      subtitle="Palatal Plane to Mandibular Plane (PP-MP)"
                      normText="25° ± 5° (20° - 30°)"
                      unit="°"
                      placeholder="25"
                      value={activeData.basal_plane_angle ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('basal_plane_angle', val)}
                      getInference={getBasalPlaneInference}
                    />

                    <CephFieldCard
                      label="Occlusal Plane to NF (°)"
                      subtitle="Occlusal Plane to Nasal Floor / Palatal Plane"
                      normText="14° ± 4° (10° - 18°)"
                      unit="°"
                      placeholder="14"
                      value={activeData.occlusal_to_nf ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('occlusal_to_nf', val)}
                      getInference={getOcclusalToNfInference}
                    />

                    <CephFieldCard
                      label="Occlusal Plane to MP (°)"
                      subtitle="Occlusal Plane to Mandibular Plane"
                      normText="14° ± 4° (10° - 18°)"
                      unit="°"
                      placeholder="14"
                      value={activeData.occlusal_to_mp ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('occlusal_to_mp', val)}
                      getInference={getOcclusalToMpInference}
                    />

                    <CephFieldCard
                      label="Vertical Maxillary Placement (mm)"
                      subtitle="Ptm-Vertical to Nasal Floor (Spatial Position)"
                      normText="56.0 mm (53 - 60 mm)"
                      unit="mm"
                      placeholder="56"
                      value={activeData.vert_max_placement ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('vert_max_placement', val)}
                      getInference={getVertMaxPlacementInference}
                    />

                    <CephFieldCard
                      label="Nasion to ANS (mm)"
                      subtitle="Upper Anterior Facial Height (N-ANS)"
                      normText={patientGender === 'Male' ? '60 ± 4 mm (56 - 64 mm)' : '55 ± 2 mm (53 - 57 mm)'}
                      unit="mm"
                      placeholder="58"
                      value={activeData.nasion_to_ans ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('nasion_to_ans', val)}
                      getInference={getNasionToAnsInference(patientGender || 'Male')}
                    />

                    <CephFieldCard
                      label="Maxillary Rotation (°)"
                      subtitle="Palatal Plane Inclination to SN"
                      normText="8.0° ± 3.0° (5° - 11°)"
                      unit="°"
                      placeholder="8"
                      value={activeData.maxillary_rotation ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('maxillary_rotation', val)}
                      getInference={getMaxillaryRotationInference}
                    />
                  </div>

                  {/* Divergence of Jaw Bases Sub-Classification */}
                  <div className="pt-3 border-t border-slate-200/90 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 block">
                        Divergence of Jaw Bases Sub-Classification (4 Master Categories)
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">Select clinical subtype</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer min-h-[48px] ${
                        activeData.divergence_subclassification === 'anterior_divergent' || activeData.anterior_divergent
                          ? 'border-rose-400 bg-rose-50/70 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                      }`}>
                        <input
                          type="radio"
                          name="divergence_subclass"
                          checked={activeData.divergence_subclassification === 'anterior_divergent' || activeData.anterior_divergent || false}
                          disabled={activeStage === 'change'}
                          onChange={() => {
                            updateActiveData('divergence_subclassification', 'anterior_divergent');
                            updateActiveData('anterior_divergent', true);
                            updateActiveData('anterior_convergent', false);
                            updateActiveData('upward_rotation_max_mand', false);
                            updateActiveData('downward_rotation_max_mand', false);
                          }}
                          className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-800 block">a) Anterior Divergent</span>
                          <span className="text-[11px] text-slate-500 block">Jaw bases diverge anteriorly (open-bite / hyperdivergent tendency)</span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer min-h-[48px] ${
                        activeData.divergence_subclassification === 'anterior_convergent' || activeData.anterior_convergent
                          ? 'border-blue-400 bg-blue-50/70 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                      }`}>
                        <input
                          type="radio"
                          name="divergence_subclass"
                          checked={activeData.divergence_subclassification === 'anterior_convergent' || activeData.anterior_convergent || false}
                          disabled={activeStage === 'change'}
                          onChange={() => {
                            updateActiveData('divergence_subclassification', 'anterior_convergent');
                            updateActiveData('anterior_divergent', false);
                            updateActiveData('anterior_convergent', true);
                            updateActiveData('upward_rotation_max_mand', false);
                            updateActiveData('downward_rotation_max_mand', false);
                          }}
                          className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-800 block">b) Anterior Convergent</span>
                          <span className="text-[11px] text-slate-500 block">Jaw bases converge anteriorly (deep-bite / hypodivergent tendency)</span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer min-h-[48px] ${
                        activeData.divergence_subclassification === 'upward_rotation_max_mand' || activeData.upward_rotation_max_mand
                          ? 'border-amber-400 bg-amber-50/70 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                      }`}>
                        <input
                          type="radio"
                          name="divergence_subclass"
                          checked={activeData.divergence_subclassification === 'upward_rotation_max_mand' || activeData.upward_rotation_max_mand || false}
                          disabled={activeStage === 'change'}
                          onChange={() => {
                            updateActiveData('divergence_subclassification', 'upward_rotation_max_mand');
                            updateActiveData('anterior_divergent', false);
                            updateActiveData('anterior_convergent', false);
                            updateActiveData('upward_rotation_max_mand', true);
                            updateActiveData('downward_rotation_max_mand', false);
                          }}
                          className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-800 block">c) Upward Anterior Rotation</span>
                          <span className="text-[11px] text-slate-500 block">Both maxilla and mandible rotated upward anteriorly</span>
                        </div>
                      </label>

                      <label className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer min-h-[48px] ${
                        activeData.divergence_subclassification === 'downward_rotation_max_mand' || activeData.downward_rotation_max_mand
                          ? 'border-purple-400 bg-purple-50/70 shadow-2xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                      }`}>
                        <input
                          type="radio"
                          name="divergence_subclass"
                          checked={activeData.divergence_subclassification === 'downward_rotation_max_mand' || activeData.downward_rotation_max_mand || false}
                          disabled={activeStage === 'change'}
                          onChange={() => {
                            updateActiveData('divergence_subclassification', 'downward_rotation_max_mand');
                            updateActiveData('anterior_divergent', false);
                            updateActiveData('anterior_convergent', false);
                            updateActiveData('upward_rotation_max_mand', false);
                            updateActiveData('downward_rotation_max_mand', true);
                          }}
                          className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="text-left">
                          <span className="text-xs font-bold text-slate-800 block">d) Downward Anterior Rotation</span>
                          <span className="text-[11px] text-slate-500 block">Both maxilla and mandible rotated downward anteriorly</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Individual Sheet 1 Diagnostic Analysis */}
                  {(() => {
                    const { points } = getSheet1Analysis(activeData, patientGender);
                    const stageLabel = activeStage === 'pre' ? 'Pre-Treatment' : activeStage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';
                    return (
                      <SheetAnalysisSummaryCard
                        sheetNumber={1}
                        sheetTitle="Vertical Skeletal Relation & Divergence"
                        stageLabel={stageLabel}
                        points={points}
                      />
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 2: Sagittal & Vertical Interaction / Exposure */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(2)}
                className="w-full p-3 bg-slate-100/80 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-teal-700">🔀 2.</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Sagittal & Vertical Interaction / Exposure (Sheet 2)
                  </span>
                </div>
                {openSection === 2 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openSection === 2 && (
                <div className="p-3 sm:p-4 space-y-4 border-t border-slate-200/80">
                  {/* Skeletal Classification & Subtype Selector */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Skeletal Sagittal Malocclusion Classification
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          updateActiveData('skeletal_class', 'Class I');
                          updateActiveData('skeletal_subtype', 'Class I Bimaxillary Alignment');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                          (activeData.skeletal_class || 'Class I') === 'Class I'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          (activeData.skeletal_class || 'Class I') === 'Class I' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                        }`}>
                          {(activeData.skeletal_class || 'Class I') === 'Class I' && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold">Class I</div>
                          <div className="text-[10px] text-slate-500 font-medium">Harmonious / Bimaxillary</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateActiveData('skeletal_class', 'Class II');
                          updateActiveData('skeletal_subtype', 'Class II Div 1 (Retrognathic Mandible)');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                          activeData.skeletal_class === 'Class II'
                            ? 'bg-blue-500/10 border-blue-500 text-blue-950 font-bold ring-1 ring-blue-500/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          activeData.skeletal_class === 'Class II' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'
                        }`}>
                          {activeData.skeletal_class === 'Class II' && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold">Class II</div>
                          <div className="text-[10px] text-slate-500 font-medium">Mandibular Retrognathism / Div 1</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          updateActiveData('skeletal_class', 'Class III');
                          updateActiveData('skeletal_subtype', 'Class III (Prognathic Mandible / Deficient Maxilla)');
                        }}
                        className={`p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all cursor-pointer ${
                          activeData.skeletal_class === 'Class III'
                            ? 'bg-orange-500/10 border-orange-500 text-orange-950 font-bold ring-1 ring-orange-500/30'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center shrink-0 ${
                          activeData.skeletal_class === 'Class III' ? 'border-orange-600 bg-orange-600' : 'border-slate-300'
                        }`}>
                          {activeData.skeletal_class === 'Class III' && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <div>
                          <div className="text-xs font-extrabold">Class III</div>
                          <div className="text-[10px] text-slate-500 font-medium">Mandibular Prognathism / Hypoplasia</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Sagittal/Vertical Interaction Toggles */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Sagittal / Vertical Interaction Dynamics</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={activeData.sagittal_unaffected || false}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('sagittal_unaffected', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-xs font-medium text-slate-700">Sagittal Unaffected by Vertical</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={activeData.sagittal_caused_by_vertical || false}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('sagittal_caused_by_vertical', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-xs font-medium text-slate-700">Sagittal Caused by Vertical</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={activeData.sagittal_worsened_by_vertical || false}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('sagittal_worsened_by_vertical', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-xs font-medium text-slate-700">Sagittal Worsened by Vertical</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={activeData.sagittal_compensated || false}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('sagittal_compensated', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-xs font-medium text-slate-700">Sagittal Compensated by Vertical</span>
                      </label>
                    </div>
                  </div>

                  {/* Upper Incisor Exposure Parameters */}
                  <div className="pt-2 border-t border-slate-100 space-y-3">
                    <span className="text-xs font-bold text-slate-700 block">Upper Incisor Exposure & Lip Relations</span>
                    <div className="flex flex-col space-y-3.5 w-full">
                      <CephFieldCard
                        label="UI Exposure (Rest)"
                        subtitle="Upper Incisor Show at Rest"
                        normText="2 - 4 mm"
                        unit="mm"
                        placeholder="3"
                        value={activeData.ui_exposure_rest ?? ''}
                        disabled={activeStage === 'change'}
                        onChange={(val) => handleNumChange('ui_exposure_rest', val)}
                        getInference={getUiRestInference}
                      />

                      <CephFieldCard
                        label="UI Exposure (Smile)"
                        subtitle="Gingival Display on Smile"
                        normText="1 - 3 mm"
                        unit="mm"
                        placeholder="3"
                        value={activeData.ui_exposure_smile ?? ''}
                        disabled={activeStage === 'change'}
                        onChange={(val) => handleNumChange('ui_exposure_smile', val)}
                        getInference={getUiSmileInference}
                      />

                      <CephFieldCard
                        label="ANS to Incisor (mm)"
                        subtitle="Upper Dentoalveolar Height"
                        normText={patientGender === 'Male' ? '33 ± 3 mm' : '30 ± 3 mm'}
                        unit="mm"
                        placeholder="32"
                        value={activeData.ans_to_incisor ?? ''}
                        disabled={activeStage === 'change'}
                        onChange={(val) => handleNumChange('ans_to_incisor', val)}
                        getInference={getAnsToIncisorInference(patientGender || 'Male')}
                      />

                      <CephFieldCard
                        label="Upper Lip Length (mm)"
                        subtitle="Subnasale to Stomion"
                        normText="20 - 24 mm"
                        unit="mm"
                        placeholder="22"
                        value={activeData.u_lip_length ?? ''}
                        disabled={activeStage === 'change'}
                        onChange={(val) => handleNumChange('u_lip_length', val)}
                        getInference={getULipLengthInference}
                      />
                    </div>
                  </div>

                  {/* Alveolar Cortical Support & Periodontal Boundaries */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <span className="text-xs font-bold text-slate-700 block">Alveolar Support to Incisors (Cortical Limits)</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Palatal Cortex</span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {activeData.palatal_cortex || 'Adequate'}
                          </span>
                        </div>
                        <select
                          value={activeData.palatal_cortex || 'Adequate'}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('palatal_cortex', e.target.value)}
                          className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Adequate">Adequate / Intact Cortex</option>
                          <option value="Intact">Intact / Normal Cortical Plate</option>
                          <option value="Thin Cortex">Thin Palatal Cortex</option>
                          <option value="High Fenestration Risk">High Fenestration Risk</option>
                          <option value="Dehisced">Dehisced</option>
                        </select>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">Symphyseal Cortex</span>
                          <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                            {activeData.symphyseal_cortex || 'Adequate'} ({activeData.symphyseal_location || 'Mandible'})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <select
                            value={activeData.symphyseal_location || 'Mandible'}
                            disabled={activeStage === 'change'}
                            onChange={(e) => updateActiveData('symphyseal_location', e.target.value)}
                            className="text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="Mandible">Mandible</option>
                            <option value="Maxilla">Maxilla</option>
                            <option value="Both">Both</option>
                          </select>
                          <select
                            value={activeData.symphyseal_cortex || 'Adequate'}
                            disabled={activeStage === 'change'}
                            onChange={(e) => updateActiveData('symphyseal_cortex', e.target.value)}
                            className="text-xs font-medium px-2 py-1.5 rounded-lg border border-slate-300 bg-white"
                          >
                            <option value="Adequate">Adequate</option>
                            <option value="Narrow Symphysis">Narrow Symphysis</option>
                            <option value="Thin Cortex">Thin Cortex</option>
                            <option value="Fenestration Risk">Fenestration Risk</option>
                            <option value="Dehisced">Dehisced</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Skeletal Alteration Matrix & Decision Tree */}
                  <div className="pt-3 border-t border-slate-100 space-y-2.5">
                    <span className="text-xs font-bold text-slate-700 block">Skeletal Alteration Matrix & Treatment Pathway</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-800 block">Skeletal Alteration Status</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateActiveData('skeletal_alteration', 'Needed')}
                            className={`py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                              (activeData.skeletal_alteration || 'Needed') === 'Needed'
                                ? 'bg-teal-700 text-white border-teal-800'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            Needed
                          </button>
                          <button
                            type="button"
                            onClick={() => updateActiveData('skeletal_alteration', 'Not Needed')}
                            className={`py-1.5 text-xs font-bold rounded-lg border cursor-pointer ${
                              activeData.skeletal_alteration === 'Not Needed'
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            Not Needed
                          </button>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <span className="text-xs font-bold text-slate-800 block">Decision Tree Pathway</span>
                        <select
                          value={activeData.selected_pathway || 'Growth Modulation'}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('selected_pathway', e.target.value)}
                          className="w-full text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white"
                        >
                          <option value="Growth Modulation">1. Growth Modulation (Twin Block / Face Mask)</option>
                          <option value="Surgical Orthodontics">2. Surgical Orthodontics (Le Fort / BSSO)</option>
                          <option value="Normal Skeletal Relation">3. Normal Skeletal Relation (Dental Alignment)</option>
                          <option value="Orthodontic Camouflage">4. Orthodontic Camouflage (Dental Compensation)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Individual Sheet 2 Diagnostic Analysis */}
                  {(() => {
                    const { points } = getSheet2Analysis(activeData, patientGender);
                    const stageLabel = activeStage === 'pre' ? 'Pre-Treatment' : activeStage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';
                    return (
                      <SheetAnalysisSummaryCard
                        sheetNumber={2}
                        sheetTitle="Sagittal-Vertical Interaction & Smile Esthetics"
                        stageLabel={stageLabel}
                        points={points}
                      />
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 3: Upper Dento-Alveolar & Soft Tissue */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(3)}
                className="w-full p-3 bg-slate-100/80 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-teal-700">👄 3.</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Upper Dento-Alveolar & Soft Tissue (Sheet 3)
                  </span>
                </div>
                {openSection === 3 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openSection === 3 && (
                <div className="p-3 sm:p-4 space-y-4 border-t border-slate-200/80">
                  <div className="flex flex-col space-y-3.5 w-full">
                    <CephFieldCard
                      label="N-A (Maxillary AP)"
                      subtitle="Maxillary AP Position to N-Perp"
                      normText="0 ± 3 mm (-3 to 3 mm)"
                      unit="mm"
                      placeholder="0"
                      value={activeData.n_a_mm ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('n_a_mm', val)}
                      getInference={getNAInference}
                    />

                    <CephFieldCard
                      label="UI-NA (mm)"
                      subtitle="Upper Incisor Position to NA"
                      normText="4 ± 2 mm (2 - 6 mm)"
                      unit="mm"
                      placeholder="4"
                      value={activeData.ui_na_mm ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('ui_na_mm', val)}
                      getInference={getUiNaMmInference}
                    />

                    <CephFieldCard
                      label="UI-SN (°)"
                      subtitle="Upper Incisor Inclination to SN"
                      normText="102° ± 4° (98° - 106°)"
                      unit="°"
                      placeholder="102"
                      value={activeData.ui_sn ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('ui_sn', val)}
                      getInference={getUiSnInference}
                    />

                    <CephFieldCard
                      label="UI-NA (°)"
                      subtitle="Upper Incisor Angle to NA Line"
                      normText="22° ± 4° (18° - 26°)"
                      unit="°"
                      placeholder="22"
                      value={activeData.ui_na_deg ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('ui_na_deg', val)}
                      getInference={getUiNaDegInference}
                    />

                    <CephFieldCard
                      label="Nasolabial Angle (°)"
                      subtitle="Columella to Upper Lip"
                      normText="102° ± 8° (94° - 110°)"
                      unit="°"
                      placeholder="102"
                      value={activeData.nasolabial_angle ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('nasolabial_angle', val)}
                      getInference={getNasolabialInference}
                    />

                    <CephFieldCard
                      label="Upper Lip Thickness"
                      subtitle="Incisor Surface to Vermilion"
                      normText="13 - 14 mm (12 - 15 mm)"
                      unit="mm"
                      placeholder="13.5"
                      value={activeData.u_lip_thickness ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('u_lip_thickness', val)}
                      getInference={getULipThicknessInference}
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                      <input
                        type="checkbox"
                        checked={activeData.lip_strain || false}
                        disabled={activeStage === 'change'}
                        onChange={(e) => updateActiveData('lip_strain', e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <span className="text-xs font-medium text-slate-700">Upper Lip Strain Present (Incompetent Lips)</span>
                    </label>
                  </div>

                  {/* Individual Sheet 3 Diagnostic Analysis */}
                  {(() => {
                    const { points } = getSheet3Analysis(activeData, patientGender);
                    const stageLabel = activeStage === 'pre' ? 'Pre-Treatment' : activeStage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';
                    return (
                      <SheetAnalysisSummaryCard
                        sheetNumber={3}
                        sheetTitle="Upper Dento-Alveolar & Nasolabial Profile"
                        stageLabel={stageLabel}
                        points={points}
                      />
                    );
                  })()}
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 4: Lower Dento-Alveolar & Soft Tissue */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(4)}
                className="w-full p-3 bg-slate-100/80 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-teal-700">🦷 4.</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Lower Dento-Alveolar & Soft Tissue (Sheet 4)
                  </span>
                </div>
                {openSection === 4 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openSection === 4 && (
                <div className="p-3 sm:p-4 space-y-4 border-t border-slate-200/80">
                  <div className="flex flex-col space-y-3.5 w-full">
                    <CephFieldCard
                      label="LI-NB (mm)"
                      subtitle="Lower Incisor Position to NB"
                      normText="4 ± 2 mm (2 - 6 mm)"
                      unit="mm"
                      placeholder="4"
                      value={activeData.li_nb_mm ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('li_nb_mm', val)}
                      getInference={getLiNbMmInference}
                    />

                    <CephFieldCard
                      label="LI-MP / IMPA (°)"
                      subtitle="Lower Incisor to Mandibular Plane"
                      normText="95° ± 3° (92° - 98°)"
                      unit="°"
                      placeholder="95"
                      value={activeData.li_mp ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('li_mp', val)}
                      getInference={getLiMpInference}
                    />

                    <CephFieldCard
                      label="LI-FH / FMIA (°)"
                      subtitle="Lower Incisor to Frankfort Plane"
                      normText="65° ± 4° (61° - 69°)"
                      unit="°"
                      placeholder="65"
                      value={activeData.li_fh ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('li_fh', val)}
                      getInference={getLiFhInference}
                    />

                    <CephFieldCard
                      label="Holdaway Ratio"
                      subtitle="LI-NB mm / Pg-NB mm Ratio"
                      normText="1:1 (0.8 - 1.2)"
                      unit="ratio"
                      placeholder="1.0"
                      value={activeData.li_nb_holdaway_ratio ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('li_nb_holdaway_ratio', val)}
                      getInference={getHoldawayInference}
                    />

                    <CephFieldCard
                      label="Mentolabial Angle (°)"
                      subtitle="Lower Lip to Soft Tissue Chin"
                      normText={patientGender === 'Male' ? '122° ± 11° (110° - 139°)' : '127° ± 12° (110° - 139°)'}
                      unit="°"
                      placeholder="122"
                      value={activeData.mentolabial_angle ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('mentolabial_angle', val)}
                      getInference={getMentolabialInference}
                    />

                    <CephFieldCard
                      label="Lower Lip Thickness"
                      subtitle="Incisor Surface to Vermilion"
                      normText="12 ± 5 mm"
                      unit="mm"
                      placeholder="12"
                      value={activeData.l_lip_thickness ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('l_lip_thickness', val)}
                    />
                  </div>

                  {/* Individual Sheet 4 Diagnostic Analysis */}
                  {(() => {
                    const { points } = getSheet4Analysis(activeData, patientGender);
                    const stageLabel = activeStage === 'pre' ? 'Pre-Treatment' : activeStage === 'mid' ? 'Mid-Treatment' : 'Post-Treatment';
                    return (
                      <SheetAnalysisSummaryCard
                        sheetNumber={4}
                        sheetTitle="Lower Dento-Alveolar & Chin-Lip Harmony"
                        stageLabel={stageLabel}
                        points={points}
                      />
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
