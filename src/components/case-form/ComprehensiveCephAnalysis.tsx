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
import { MasterCephDiagnosisEngine } from './MasterCephDiagnosisEngine';
import { extractPrimaryCephValues } from '../../lib/cephAutoFetchEngine';

export type AnalysisStage = 'preRx' | 'pGrMod' | 'preIII' | 'postRx' | 'retention' | 'change';

export interface StageData {
  // Section 1: Vertical Skeletal Relation & Divergence
  mid_lower_face_ht?: number | '';
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
  basal_plane_angle?: number | '';
  occlusal_to_nf?: number | '';
  occlusal_to_mp?: number | '';
  nasion_to_ans?: number | '';

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

const DEFAULT_STAGE_DATA: StageData = {
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

  // -------------------------------------------------------------
  // INFERENCE ENGINE LOGIC
  // -------------------------------------------------------------
  const inferences = useMemo(() => {
    const d = activeData;
    const ageNum = typeof patientAge === 'number' ? patientAge : parseFloat(patientAge) || 12;
    const isMale = patientGender === 'Male';

    // 1. Growth Pattern & Divergence
    let bjorkResult = 'Normodivergent Growth Pattern';
    let bjorkStatus: 'normal' | 'hyper' | 'hypo' = 'normal';
    const bjorkNum = typeof d.bjork_sum === 'number' ? d.bjork_sum : NaN;
    if (!isNaN(bjorkNum)) {
      if (bjorkNum > 402) {
        bjorkResult = 'Hyperdivergent / Clockwise Growth Pattern';
        bjorkStatus = 'hyper';
      } else if (bjorkNum < 390) {
        bjorkResult = 'Hypodivergent / Counter-Clockwise Growth Pattern';
        bjorkStatus = 'hypo';
      }
    }

    let jarabakResult = 'Normal Rotational Pattern';
    const jarabakNum = typeof d.jarabak_ratio === 'number' ? d.jarabak_ratio : NaN;
    if (!isNaN(jarabakNum)) {
      if (jarabakNum < 62) {
        jarabakResult = 'Anterior Divergent Rotation';
      } else if (jarabakNum > 65) {
        jarabakResult = 'Anterior Convergent Rotation';
      }
    }

    // 2. Upper Incisor Exposure Etiology
    const restExp = typeof d.ui_exposure_rest === 'number' ? d.ui_exposure_rest : 0;
    const smileExp = typeof d.ui_exposure_smile === 'number' ? d.ui_exposure_smile : 0;
    let exposureEtiology = 'Normal Upper Incisor Exposure';
    let isExcessExposure = false;

    if (restExp > 4 || smileExp > 4) {
      isExcessExposure = true;
      const ansInc = typeof d.ans_to_incisor === 'number' ? d.ans_to_incisor : 0;
      const lipLen = typeof d.u_lip_length === 'number' ? d.u_lip_length : 22;
      const skeletalCutoff = isMale ? 36 : 33;

      if (ansInc > skeletalCutoff) {
        exposureEtiology = 'Excess Exposure due to Vertical Skeletal Excess';
      } else if (lipLen < 20) {
        exposureEtiology = 'Excess Exposure due to Short Upper Lip';
      } else {
        exposureEtiology = 'Excess Exposure due to Vertical Dental Excess';
      }
    }

    // 3. Upper Incisor Retraction Calculations
    const uiNaMm = typeof d.ui_na_mm === 'number' ? d.ui_na_mm : 4;
    const retractionMaxillaMm = Math.max(0, Number((uiNaMm - 4).toFixed(1)));
    const retractionCamouflageMm = Math.max(0, Number((uiNaMm - 4).toFixed(1)));

    const nasolabialNum = typeof d.nasolabial_angle === 'number' ? d.nasolabial_angle : 102;
    const uLipThickNum = typeof d.u_lip_thickness === 'number' ? d.u_lip_thickness : 13;
    const uiNpogNum = typeof d.ui_npog_mm === 'number' ? d.ui_npog_mm : 2;

    const supportedByNla = nasolabialNum < 102;
    const nlaImpactWarning = !supportedByNla && retractionMaxillaMm > 0
      ? `Full ${retractionMaxillaMm} mm UI retraction will open NLA by +${Math.round(retractionMaxillaMm * 1.5)}° to +${Math.round(retractionMaxillaMm * 2)}° (yielding ≥ ${nasolabialNum + Math.round(retractionMaxillaMm * 1.5)}°), flattening the upper lip profile.`
      : null;

    const correctedUiRetractionTargetMm = !supportedByNla && retractionMaxillaMm > 3
      ? "2 - 3 mm (Controlled)"
      : `${retractionMaxillaMm} mm`;

    const prescribedBiomechanics = !supportedByNla
      ? "Focus on bodily translation / palatal root torque rather than tipping to protect lip profile."
      : "Standard retraction / palatal root torque with profile monitoring.";

    const upperSoftSupport = {
      nasolabial: nasolabialNum < 94,
      lipStrain: d.lip_strain === true,
      lipThickness: uLipThickNum >= 13,
      estheticLine: uiNpogNum > 4 || uLipThickNum >= 13,
    };

    // 4. Lower Incisor Retraction Calculations
    const liNbMm = typeof d.li_nb_mm === 'number' ? d.li_nb_mm : 4;
    const lowerRetractionMandibleMm = Math.max(0, Number((liNbMm - 4).toFixed(1)));
    const lowerRetractionCamouflageMm = Math.max(0, Number((liNbMm - 4).toFixed(1)));

    const mentolabialNum = typeof d.mentolabial_angle === 'number' ? d.mentolabial_angle : 122;
    const lLipThickNum = typeof d.l_lip_thickness === 'number' ? d.l_lip_thickness : 12;
    const holdawayRatioNum = typeof d.li_nb_holdaway_ratio === 'number' ? d.li_nb_holdaway_ratio : 1;

    const lowerSoftSupport = {
      mentolabial: mentolabialNum < 112,
      lLipThickness: lLipThickNum >= 12,
      holdawayRatio: holdawayRatioNum > 1.2,
    };

    const correctedLiRetractionTargetMm = `${lowerRetractionMandibleMm} mm (Fully supported by Mentolabial sulcus and Holdaway ratio)`;

    // 5. Treatment Pathway Decision Tree
    const fmaNum = typeof d.fma === 'number' ? d.fma : 25;
    const snGoGnNum = typeof d.sn_go_gn === 'number' ? d.sn_go_gn : 32;
    const isSevereSkeletal =
      (!isNaN(bjorkNum) && (bjorkNum > 408 || bjorkNum < 384)) ||
      fmaNum > 34 ||
      snGoGnNum > 40;

    let treatmentPathway = 'Camouflage Treatment / Normal Skeletal Relation Pathway';
    let pathwayBadge: 'surgery' | 'growth' | 'camouflage' = 'camouflage';

    if (isSevereSkeletal) {
      if (ageNum >= 18) {
        treatmentPathway = 'Skeletal Alteration: Orthognathic Surgery Required';
        pathwayBadge = 'surgery';
      } else {
        treatmentPathway = 'Skeletal Alteration: Growth Modulation Required';
        pathwayBadge = 'growth';
      }
    }

    return {
      bjorkResult,
      bjorkStatus,
      jarabakResult,
      isExcessExposure,
      exposureEtiology,
      retractionMaxillaMm,
      retractionCamouflageMm,
      upperSoftSupport,
      lowerRetractionMandibleMm,
      lowerRetractionCamouflageMm,
      lowerSoftSupport,
      supportedByNla,
      nlaImpactWarning,
      correctedUiRetractionTargetMm,
      prescribedBiomechanics,
      correctedLiRetractionTargetMm,
      treatmentPathway,
      pathwayBadge,
    };
  }, [activeData, patientAge, patientGender]);

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
                      subtitle="Posterior / Anterior Face Height"
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
                      subtitle="Anterior Facial Height Proportion"
                      normText="45:55 (45%)"
                      unit="%"
                      placeholder="45"
                      value={activeData.mid_lower_face_ht ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('mid_lower_face_ht', val)}
                      getInference={getMidLowerFaceInference}
                    />

                    <CephFieldCard
                      label="SN-GoGn (°)"
                      subtitle="Mandibular Plane Angle to SN"
                      normText="32° ± 3° (29° - 35°)"
                      unit="°"
                      placeholder="32"
                      value={activeData.sn_go_gn ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('sn_go_gn', val)}
                      getInference={getSnGoGnInference}
                    />

                    <CephFieldCard
                      label="FMA (°)"
                      subtitle="Frankfort-Mandibular Angle"
                      normText="25° ± 3° (22° - 28°)"
                      unit="°"
                      placeholder="25"
                      value={activeData.fma ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('fma', val)}
                      getInference={getFmaInference}
                    />

                    <CephFieldCard
                      label="Saddle Angle (°)"
                      subtitle="Nasion - Saddle - Articular"
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
                      subtitle="Saddle - Articular - Gonion"
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
                      subtitle="Articular - Gonion - Nasion"
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
                      subtitle="Nasion - Gonion - Menton"
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
                      subtitle="Growth Axis Angle to SN"
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
                      label="Nasion to ANS (mm)"
                      subtitle="Upper Anterior Facial Height"
                      normText={patientGender === 'Male' ? '60 ± 4 mm' : '55 ± 2 mm'}
                      unit="mm"
                      placeholder="58"
                      value={activeData.nasion_to_ans ?? ''}
                      disabled={activeStage === 'change'}
                      onChange={(val) => handleNumChange('nasion_to_ans', val)}
                      getInference={getNasionToAnsInference(patientGender || 'Male')}
                    />
                  </div>

                  {/* Jaw Divergence Flags */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <span className="text-xs font-bold text-slate-700 block">Jaw Divergence Clinical Flags</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={activeData.anterior_divergent || false}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('anterior_divergent', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-xs font-medium text-slate-700">Anterior Divergent Jaw Base</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={activeData.anterior_convergent || false}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('anterior_convergent', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-xs font-medium text-slate-700">Anterior Convergent Jaw Base</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={activeData.upward_rotation_max_mand || false}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('upward_rotation_max_mand', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-xs font-medium text-slate-700">Upward Rotation (Max/Mand)</span>
                      </label>

                      <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer min-h-[44px]">
                        <input
                          type="checkbox"
                          checked={activeData.downward_rotation_max_mand || false}
                          disabled={activeStage === 'change'}
                          onChange={(e) => updateActiveData('downward_rotation_max_mand', e.target.checked)}
                          className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                        />
                        <span className="text-xs font-medium text-slate-700">Downward Rotation (Max/Mand)</span>
                      </label>
                    </div>
                  </div>
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
                </div>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SECTION 5: Auto-Generated Inferences & Treatment Roadmap */}
            {/* ------------------------------------------------------------- */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection(5)}
                className="w-full p-3 bg-slate-100/80 hover:bg-slate-100 flex items-center justify-between text-left transition-colors cursor-pointer min-h-[44px]"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-teal-700">🧠 5.</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-800">
                    Auto-Generated Clinical Inferences & Treatment Roadmap
                  </span>
                </div>
                {openSection === 5 ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
              </button>

              {openSection === 5 && (
                <div className="p-3 sm:p-5 space-y-4 border-t border-slate-200/80 bg-white">
                  {/* Real-time Header Summary */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                          <span>Clinical Diagnostic & Biomechanics Summary</span>
                          <span className="text-[9px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border border-teal-200">
                            Real-time
                          </span>
                        </h4>
                        <p className="text-[11px] text-slate-600 font-medium">
                          Rule-based diagnostic calculations for evaluation stage: <strong className="text-teal-700 capitalize">{activeStage}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parameter Evaluation Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* 1. Growth Pattern */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                        1. Skeletal Growth Pattern & Rotation
                      </span>
                      <p className="text-xs font-bold text-slate-900 leading-snug">{inferences.bjorkResult}</p>
                      <p className="text-[11px] text-slate-600">{inferences.jarabakResult}</p>
                    </div>

                    {/* 2. Incisor Exposure */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                        2. Upper Incisor Exposure Etiology
                      </span>
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                            inferences.isExcessExposure ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        />
                        <p className="text-xs font-bold text-slate-900 leading-snug">{inferences.exposureEtiology}</p>
                      </div>
                    </div>

                    {/* 3. Upper Incisor Retraction Targets */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                        3. Upper Incisor Retraction & Soft Tissue Support
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs w-full">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block font-medium">Skeletal Maxilla Target</span>
                          <strong className="text-slate-900 font-extrabold">{inferences.retractionMaxillaMm} mm</strong>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block font-medium">Corrected Target</span>
                          <strong className="text-teal-700 font-extrabold">{inferences.correctedUiRetractionTargetMm}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 4. Lower Incisor Retraction Targets */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                        4. Lower Incisor Retraction & Soft Tissue Support
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs w-full">
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block font-medium">Mandible Retraction</span>
                          <strong className="text-slate-900 font-extrabold">{inferences.lowerRetractionMandibleMm} mm</strong>
                        </div>
                        <div className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-500 block font-medium">Holdaway Support</span>
                          <strong className="text-teal-700 font-extrabold">{inferences.lowerSoftSupport.holdawayRatio ? 'Supported' : 'Standard'}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Soft Tissue Impact Warning Callout */}
                  {inferences.nlaImpactWarning && (
                    <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5 text-amber-900">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider">
                          ⚠️ Soft Tissue Contraindication Warning
                        </span>
                      </div>
                      <p className="text-xs font-semibold leading-relaxed text-amber-950">
                        {inferences.nlaImpactWarning}
                      </p>
                      <div className="pt-1 text-[11px] font-medium text-amber-900 border-t border-amber-200/80 mt-1">
                        <strong>Prescribed Biomechanics:</strong> {inferences.prescribedBiomechanics}
                      </div>
                    </div>
                  )}

                  {/* Clinical Treatment Roadmap Pathway */}
                  <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center font-extrabold shrink-0 shadow-2xs">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-800 block">
                        5. Clinical Treatment Roadmap Pathway
                      </span>
                      <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                        {inferences.treatmentPathway}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MASTER AI CEPHALOMETRIC DIAGNOSIS ENGINE */}
            <MasterCephDiagnosisEngine
              activeData={activeData}
              activeStage={activeStage}
              patientGender={patientGender}
              patientAge={patientAge}
              steinersAnalysis={steinersAnalysis}
              downsAnalysis={downsAnalysis}
              schwarzTweedAnalysis={schwarzTweedAnalysis}
              mcnamaraAnalysis={mcnamaraAnalysis}
              rickettsAnalysis={rickettsAnalysis}
              holdawayAnalysis={holdawayAnalysis}
              cogsAnalysis={cogsAnalysis}
              cogsSoftTissueAnalysis={cogsSoftTissueAnalysis}
              cephDiscrepancyAnalysis={cephDiscrepancyAnalysis}
            />
          </div>
        </div>
      )}
    </div>
  );
};
