import React, { useState, useEffect, useRef, lazy, Suspense, startTransition, useDeferredValue } from 'react';
import {
  Menu,
  X,
  Check,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  User,
  Eye,
  Activity,
  Stethoscope,
  ImageIcon,
  Calculator,
  FileText,
  Compass,
  Brain,
  ClipboardList,
} from 'lucide-react';

const CircularProgress: React.FC<{ value: number }> = ({ value }) => {

  const radius = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center w-7 h-7 shrink-0"
      title={`Case Completion: ${value}%`}
    >
      <svg className="w-7 h-7 -rotate-90 transform" viewBox="0 0 28 28">
        <circle
          cx="14"
          cy="14"
          r={radius}
          className="text-slate-200"
          strokeWidth="2.5"
          stroke="currentColor"
          fill="transparent"
        />
        <circle
          cx="14"
          cy="14"
          r={radius}
          className="text-teal-600 transition-all duration-300 ease-in-out"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
        />
      </svg>
      <span className="absolute text-[8px] font-extrabold text-slate-800">{value}%</span>
    </div>
  );
};
import {
  PatientRecord,
  Gender,
  DurationOption,
  TreatmentMotivation,
  TreatmentAttitude,
  BodyType,
  ShapeOfHead,
  FacialForm,
  FacialSymmetry,
  LipPostureTonicity,
  FacialProfile,
  FacialDivergence,
  NasolabialAngleType,
  MentolabialSulcus,
  RespirationType,
  MasticationType,
  OverallPeriodontalStatus,
  FrenalAttachment,
  ArchShape,
  ArchAlignment,
  MolarCanineClass,
  IncisorRelation,
  InvestigationImage,
  DownsAnalysisData,
  SteinersAnalysisData,
  RickettsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CogsSoftTissueAnalysisData,
  CephDiscrepancyAnalysisData,
  VerticalJawDivergenceAnalysisData,
  SagittalVerticalInteractionAnalysisData,
  ExtraoralPhotos,
  ExtraoralPhotoAnalysis,
} from '../types';
import { calculateCompletionStatus } from '../lib/completion';
import { TabHistory } from './case-form/TabHistory';

const TabLoader = () => (
  <div className="flex items-center justify-center min-h-[28vh]" aria-label="Loading section">
    <div className="h-7 w-7 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
  </div>
);

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<any>,
  exportName?: string
) {
  return lazy(async () => {
    try {
      const module = await factory();
      if (exportName && module[exportName]) {
        return { default: module[exportName] as T };
      }
      if (module.default) {
        return { default: module.default as T };
      }
      const firstExport = Object.values(module)[0] as T;
      return { default: firstExport };
    } catch (error) {
      console.warn('Dynamic import failed, retrying once...', error);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const module = await factory();
        if (exportName && module[exportName]) {
          return { default: module[exportName] as T };
        }
        if (module.default) {
          return { default: module.default as T };
        }
        const firstExport = Object.values(module)[0] as T;
        return { default: firstExport };
      } catch (retryErr) {
        console.error('Dynamic import retry failed:', retryErr);
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
    }
  });
}

// Tab 1 is eager so "Add Patient" does not wait on a second lazy chunk.
const TabExtraoralProfile = lazyWithRetry(
  () => import('./case-form/TabExtraoralProfile'),
  'TabExtraoralProfile'
);
const TabFunctionalTmj = lazyWithRetry(
  () => import('./case-form/TabFunctionalTmj'),
  'TabFunctionalTmj'
);
const TabIntraoral = lazyWithRetry(
  () => import('./case-form/TabIntraoral'),
  'TabIntraoral'
);
const TabRadiographyGrowth = lazyWithRetry(
  () => import('./case-form/TabRadiographyGrowth'),
  'TabRadiographyGrowth'
);
const TabModelAnalysis = lazyWithRetry(
  () => import('./case-form/TabModelAnalysis'),
  'TabModelAnalysis'
);
const TabCephalometricAnalysis = lazyWithRetry(
  () => import('./case-form/TabCephalometricAnalysis'),
  'TabCephalometricAnalysis'
);
const TabSteinerStick = lazyWithRetry(
  () => import('./case-form/TabSteinerStick'),
  'TabSteinerStick'
);
const TabAiDiagnosis = lazyWithRetry(
  () => import('./case-form/TabAiDiagnosis'),
  'TabAiDiagnosis'
);
const TabTreatmentPlan = lazyWithRetry(
  () => import('./case-form/TabTreatmentPlan'),
  'TabTreatmentPlan'
);
const BonwillHawleyGenerator = lazyWithRetry(
  () => import('./bonwill/BonwillHawleyGenerator'),
  'BonwillHawleyGenerator'
);

const DEFAULT_TOOTH_WIDTHS: Record<string, number | ''> = {
  '17': 9.5, '16': 10, '15': 7, '14': 7, '13': 7.5, '12': 7, '11': 8.5,
  '21': 8.5, '22': 7, '23': 7.5, '24': 7, '25': 7, '26': 10, '27': 9.5,
  '47': 9.5, '46': 10.5, '45': 7, '44': 7, '43': 6.5, '42': 5.5, '41': 5,
  '31': 5, '32': 5.5, '33': 6.5, '34': 7, '35': 7, '36': 10.5, '37': 9.5,
};

interface CaseFormProps {
  initialPatient?: PatientRecord | null;
  onSavePatient: (patient: PatientRecord) => void;
  onCancel: () => void;
}

export type FormTab =
  | 'history'
  | 'extraoralProfile'
  | 'functionalTmj'
  | 'intraoral'
  | 'radiographyGrowth'
  | 'modelAnalysis'
  | 'cephalometricAnalysis'
  | 'bonwillCad'
  | 'steinerStick'
  | 'aiDiagnosis'
  | 'treatmentPlan';

const TAB_CONFIG: { id: FormTab; label: string; icon: React.ElementType }[] = [
  { id: 'history', label: 'History', icon: User },
  { id: 'extraoralProfile', label: 'Extra Oral', icon: Eye },
  { id: 'functionalTmj', label: 'TMJ', icon: Activity },
  { id: 'intraoral', label: 'Intra Oral', icon: Stethoscope },
  { id: 'radiographyGrowth', label: 'Radiographs', icon: ImageIcon },
  { id: 'modelAnalysis', label: 'Models', icon: Calculator },
  { id: 'cephalometricAnalysis', label: 'Cephalometry', icon: FileText },
  { id: 'bonwillCad', label: 'Bonwill', icon: Sparkles },
  { id: 'steinerStick', label: 'Steiner', icon: Compass },
  { id: 'aiDiagnosis', label: 'Diagnosis', icon: Brain },
  { id: 'treatmentPlan', label: 'Treatment Plan', icon: ClipboardList },
];

const TAB_PREFETCH: Partial<Record<FormTab, () => Promise<unknown>>> = {
  history: () => import('./case-form/TabHistory'),
  extraoralProfile: () => import('./case-form/TabExtraoralProfile'),
  functionalTmj: () => import('./case-form/TabFunctionalTmj'),
  intraoral: () => import('./case-form/TabIntraoral'),
  radiographyGrowth: () => import('./case-form/TabRadiographyGrowth'),
  modelAnalysis: () => import('./case-form/TabModelAnalysis'),
  cephalometricAnalysis: () => import('./case-form/TabCephalometricAnalysis'),
  bonwillCad: () => import('./bonwill/BonwillHawleyGenerator'),
  steinerStick: () => import('./case-form/TabSteinerStick'),
  aiDiagnosis: () => import('./case-form/TabAiDiagnosis'),
  treatmentPlan: () => import('./case-form/TabTreatmentPlan'),
};

function prefetchTab(tab: FormTab) {
  TAB_PREFETCH[tab]?.();
}

export const CaseForm: React.FC<CaseFormProps> = ({ initialPatient, onSavePatient, onCancel }) => {
  const [activeTab, setActiveTab] = useState<FormTab>('history');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [recordId] = useState<string>(() => initialPatient?.id || `pt-${Date.now()}`);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // --- State variables for all 6 tabs ---
  // TAB 1: Demographics & History
  const [name, setName] = useState(initialPatient?.name || '');
  const [patientId, setPatientId] = useState(
    initialPatient?.patientId || `ORTHO-2026-${Math.floor(100 + Math.random() * 900)}`
  );
  const [age, setAge] = useState<number | ''>(initialPatient?.age || 18);
  const [gender, setGender] = useState<Gender>(initialPatient?.gender || 'Female');
  const [examDate, setExamDate] = useState(
    initialPatient?.examDate || new Date().toISOString().split('T')[0]
  );
  const [contact, setContact] = useState(initialPatient?.contact || '');
  const [email, setEmail] = useState(initialPatient?.email || '');
  const [address, setAddress] = useState(initialPatient?.address || '');

  const [informer, setInformer] = useState(initialPatient?.historySection?.informer || 'Self');
  const [prenatalMotherCondition, setPrenatalMotherCondition] = useState(
    initialPatient?.historySection?.prenatalMotherCondition || ''
  );
  const [deliveryType, setDeliveryType] = useState(initialPatient?.historySection?.deliveryType || '');
  const [postnatalFeeding, setPostnatalFeeding] = useState(
    initialPatient?.historySection?.postnatalFeeding || ''
  );
  const [postnatalMilestones, setPostnatalMilestones] = useState(
    initialPatient?.historySection?.postnatalMilestones || ''
  );
  const [behavioralHistory, setBehavioralHistory] = useState(
    initialPatient?.historySection?.behavioralHistory || ''
  );
  const [socialHistory, setSocialHistory] = useState(initialPatient?.historySection?.socialHistory || '');
  const [childhoodDiseases, setChildhoodDiseases] = useState(
    initialPatient?.historySection?.childhoodDiseases || ''
  );

  const [motivation, setMotivation] = useState<TreatmentMotivation>(
    initialPatient?.historySection?.motivationForTreatment || 'Internal'
  );
  const [attitude, setAttitude] = useState<TreatmentAttitude>(
    initialPatient?.historySection?.attitudeTowardsTreatment || 'Enthusiastic'
  );
  const [otherPertinentInfo, setOtherPertinentInfo] = useState(
    initialPatient?.historySection?.otherPertinentInfo || ''
  );

  // Chief Complaint & Medical
  const [ccIrregular, setCcIrregular] = useState(initialPatient?.chiefComplaint?.irregularTeeth ?? true);
  const [ccProtruding, setCcProtruding] = useState(initialPatient?.chiefComplaint?.protrudingTeeth ?? false);
  const [ccSpacing, setCcSpacing] = useState(initialPatient?.chiefComplaint?.spacing ?? false);
  const [ccMissing, setCcMissing] = useState(initialPatient?.chiefComplaint?.missingTeeth ?? false);
  const [ccJaw, setCcJaw] = useState(initialPatient?.chiefComplaint?.jawProblem ?? false);
  const [ccFacial, setCcFacial] = useState(initialPatient?.chiefComplaint?.facialAesthetics ?? true);
  const [ccOtherText, setCcOtherText] = useState(initialPatient?.chiefComplaint?.otherText || '');
  const [ccDuration, setCcDuration] = useState<DurationOption>(
    initialPatient?.chiefComplaint?.duration || '1-3 years'
  );
  const [ccNotes, setCcNotes] = useState(initialPatient?.chiefComplaint?.additionalNotes || '');

  const [medDiabetes, setMedDiabetes] = useState(initialPatient?.medicalHistory?.diabetes ?? false);
  const [medHypertension, setMedHypertension] = useState(initialPatient?.medicalHistory?.hypertension ?? false);
  const [medAsthma, setMedAsthma] = useState(initialPatient?.medicalHistory?.asthma ?? false);
  const [medAllergy, setMedAllergy] = useState(initialPatient?.medicalHistory?.allergy ?? false);
  const [medBleeding, setMedBleeding] = useState(initialPatient?.medicalHistory?.bleedingDisorder ?? false);
  const [medOther, setMedOther] = useState(initialPatient?.medicalHistory?.otherMedical ?? false);
  const [medNone, setMedNone] = useState(initialPatient?.medicalHistory?.noSignificantHistory ?? true);
  const [medNotes, setMedNotes] = useState(initialPatient?.medicalHistory?.medicalNotes || '');

  const [dentExtraction, setDentExtraction] = useState(initialPatient?.dentalHistory?.previousExtraction ?? false);
  const [dentOrtho, setDentOrtho] = useState(initialPatient?.dentalHistory?.previousOrtho ?? false);
  const [dentTrauma, setDentTrauma] = useState(initialPatient?.dentalHistory?.trauma ?? false);
  const [dentRestoration, setDentRestoration] = useState(initialPatient?.dentalHistory?.restoration ?? false);
  const [dentNotes, setDentNotes] = useState(initialPatient?.dentalHistory?.dentalNotes || '');

  const [habThumb, setHabThumb] = useState(initialPatient?.habitHistory?.thumbSucking ?? false);
  const [habMouth, setHabMouth] = useState(initialPatient?.habitHistory?.mouthBreathing ?? false);
  const [habTongue, setHabTongue] = useState(initialPatient?.habitHistory?.tongueThrusting ?? false);
  const [habLip, setHabLip] = useState(initialPatient?.habitHistory?.lipHabit ?? false);
  const [habBruxism, setHabBruxism] = useState(initialPatient?.habitHistory?.bruxism ?? false);
  const [habNone, setHabNone] = useState(initialPatient?.habitHistory?.none ?? true);
  const [habNotes, setHabNotes] = useState(initialPatient?.habitHistory?.habitDurationNotes || '');

  // TAB 2: Extra-oral & Profile
  const [extraoralPhotos, setExtraoralPhotos] = useState<ExtraoralPhotos>(
    initialPatient?.extraoralPhotos || {}
  );
  const [extraoralPhotoAnalysis, setExtraoralPhotoAnalysis] = useState<ExtraoralPhotoAnalysis>(
    initialPatient?.extraoralPhotoAnalysis || {}
  );
  const [built, setBuilt] = useState(initialPatient?.extraoralProfile?.built || 'Average');
  const [heightCm, setHeightCm] = useState<number | ''>(initialPatient?.extraoralProfile?.heightCm || 165);
  const [weightKg, setWeightKg] = useState<number | ''>(initialPatient?.extraoralProfile?.weightKg || 58);
  const [gait, setGait] = useState(initialPatient?.extraoralProfile?.gait || 'Normal');
  const [bodyType, setBodyType] = useState<BodyType>(initialPatient?.extraoralProfile?.bodyType || 'Mesomorph');
  const [facialIndex, setFacialIndex] = useState(initialPatient?.extraoralProfile?.facialIndex || 'Leptoprosopic');

  const [cephalicIndex, setCephalicIndex] = useState(initialPatient?.extraoralProfile?.cephalicIndex || '78.5');
  const [shapeOfHead, setShapeOfHead] = useState<ShapeOfHead>(initialPatient?.extraoralProfile?.shapeOfHead || 'Mesocephalic');

  const [facialForm, setFacialForm] = useState<FacialForm>(initialPatient?.extraoralProfile?.facialForm || 'Mesoprosopic');
  const [symmetry, setSymmetry] = useState<FacialSymmetry>(initialPatient?.extraoralProfile?.symmetry || 'Symmetrical');
  const [maxillaryMidline, setMaxillaryMidline] = useState(initialPatient?.extraoralProfile?.maxillaryMidline || 'Coincident');
  const [mandibularMidline, setMandibularMidline] = useState(initialPatient?.extraoralProfile?.mandibularMidline || 'Coincident');
  const [lipPostureTonicity, setLipPostureTonicity] = useState<LipPostureTonicity>(initialPatient?.extraoralProfile?.lipPostureTonicity || 'Competent');
  const [interlabialGapMm, setInterlabialGapMm] = useState<number | ''>(initialPatient?.extraoralProfile?.interlabialGapMm || 2.0);
  const [incisorStomionMm, setIncisorStomionMm] = useState<number | ''>(initialPatient?.extraoralProfile?.incisorStomionMm || 2.5);

  const [profile, setProfile] = useState<FacialProfile>(initialPatient?.extraoralProfile?.profile || 'Convex');
  const [facialDivergence, setFacialDivergence] = useState<FacialDivergence>(initialPatient?.extraoralProfile?.facialDivergence || 'Straight');
  const [nasolabialAngle, setNasolabialAngle] = useState<NasolabialAngleType>(initialPatient?.extraoralProfile?.nasolabialAngle || 'Right Angle');
  const [mentolabialSulcus, setMentolabialSulcus] = useState<MentolabialSulcus>(initialPatient?.extraoralProfile?.mentolabialSulcus || 'Normal');
  const [clinicalFma, setClinicalFma] = useState(initialPatient?.extraoralProfile?.clinicalFma || 'Average (25°)');
  const [vto, setVto] = useState(initialPatient?.extraoralProfile?.vto || 'Positive');

  // TAB 3: Functional & TMJ
  const [respiration, setRespiration] = useState<RespirationType>(initialPatient?.functionalTmj?.respiration || 'Nasal');
  const [speech, setSpeech] = useState(initialPatient?.functionalTmj?.speech || 'Normal clear speech');
  const [mastication, setMastication] = useState<MasticationType>(initialPatient?.functionalTmj?.mastication || 'Bilateral');
  const [swallowing, setSwallowing] = useState(initialPatient?.functionalTmj?.swallowing || 'Mature swallow pattern');

  const [painHistory, setPainHistory] = useState(initialPatient?.functionalTmj?.painHistory ?? false);
  const [clicking, setClicking] = useState(initialPatient?.functionalTmj?.clicking ?? false);
  const [crepitus, setCrepitus] = useState(initialPatient?.functionalTmj?.crepitus ?? false);
  const [tendernessPalpation, setTendernessPalpation] = useState(initialPatient?.functionalTmj?.tendernessPalpation ?? false);

  const [pathOfClosure, setPathOfClosure] = useState(initialPatient?.functionalTmj?.pathOfClosure || 'Straight uninhibited closure');
  const [deviation, setDeviation] = useState(initialPatient?.functionalTmj?.deviation || 'None');
  const [coCrDiscrepancy, setCoCrDiscrepancy] = useState(initialPatient?.functionalTmj?.coCrDiscrepancy || 'Minimal (<1mm)');

  const [maxOpeningMm, setMaxOpeningMm] = useState<number | ''>(initialPatient?.functionalTmj?.maxOpeningMm || 45);
  const [freewaySpaceMm, setFreewaySpaceMm] = useState<number | ''>(initialPatient?.functionalTmj?.freewaySpaceMm || 2.0);
  const [tmjNotes, setTmjNotes] = useState(initialPatient?.functionalTmj?.notes || '');

  // TAB 4: Intra-Oral Exam
  const [tongueSize, setTongueSize] = useState(initialPatient?.intraoralSection?.tongueSize || 'Normal');
  const [tonguePosture, setTonguePosture] = useState(initialPatient?.intraoralSection?.tonguePosture || 'Normal resting posture');
  const [periodontalStatus, setPeriodontalStatus] = useState(initialPatient?.intraoralSection?.periodontalStatus || 'Healthy');
  const [brushingHabit, setBrushingHabit] = useState(initialPatient?.intraoralSection?.brushingHabit || 'Twice daily');
  const [overallPeriodontal, setOverallPeriodontal] = useState<OverallPeriodontalStatus>(initialPatient?.intraoralSection?.overallPeriodontal || 'Good');
  const [frenalAttachments, setFrenalAttachments] = useState<FrenalAttachment>(initialPatient?.intraoralSection?.frenalAttachments || 'Normal');
  const [oralMucosa, setOralMucosa] = useState(initialPatient?.intraoralSection?.oralMucosa || 'Healthy pink');

  const [teethPresent, setTeethPresent] = useState(initialPatient?.intraoralSection?.teethPresent || 'None');
  const [deciduousTeeth, setDeciduousTeeth] = useState(initialPatient?.intraoralSection?.deciduousTeeth || 'None');
  const [cariesTeeth, setCariesTeeth] = useState(initialPatient?.intraoralSection?.cariesTeeth || 'None');
  const [missingTeeth, setMissingTeeth] = useState(initialPatient?.intraoralSection?.missingTeeth || 'None');
  const [supernumeraryTeeth, setSupernumeraryTeeth] = useState(initialPatient?.intraoralSection?.supernumeraryTeeth || 'None');
  const [impactedTeeth, setImpactedTeeth] = useState(initialPatient?.intraoralSection?.impactedTeeth || 'None');
  const [toothColourTexture, setToothColourTexture] = useState(initialPatient?.intraoralSection?.toothColourTexture || 'Normal shade A2');
  const [toothShapeSizeForm, setToothShapeSizeForm] = useState(initialPatient?.intraoralSection?.toothShapeSizeForm || 'Normal anatomical form');
  const [localizedAbnormalities, setLocalizedAbnormalities] = useState(initialPatient?.intraoralSection?.localizedAbnormalities || 'None');

  const [incisorRelation, setIncisorRelation] = useState<IncisorRelation>(initialPatient?.intraoralSection?.incisorRelation || 'Class I');
  const [canineRelationRight, setCanineRelationRight] = useState<MolarCanineClass>(initialPatient?.intraoralSection?.canineRelationRight || 'Class I');
  const [canineRelationLeft, setCanineRelationLeft] = useState<MolarCanineClass>(initialPatient?.intraoralSection?.canineRelationLeft || 'Class I');
  const [buccalOcclusionRight, setBuccalOcclusionRight] = useState<MolarCanineClass>(initialPatient?.intraoralSection?.buccalOcclusionRight || 'Class I');
  const [buccalOcclusionLeft, setBuccalOcclusionLeft] = useState<MolarCanineClass>(initialPatient?.intraoralSection?.buccalOcclusionLeft || 'Class I');

  const [curveOfSpeeMm, setCurveOfSpeeMm] = useState<number | ''>(initialPatient?.intraoralSection?.curveOfSpeeMm || 1.5);
  const [overjetMm, setOverjetMm] = useState<number | ''>(initialPatient?.intraoralSection?.overjetMm || 2.5);
  const [overbiteMm, setOverbiteMm] = useState<number | ''>(initialPatient?.intraoralSection?.overbiteMm || 2.0);
  const [crossbite, setCrossbite] = useState(initialPatient?.intraoralSection?.crossbite || 'None');
  const [displacements, setDisplacements] = useState(initialPatient?.intraoralSection?.displacements || 'Mild crowding');

  const [archFormUpper, setArchFormUpper] = useState<ArchShape>(initialPatient?.intraoralSection?.archFormUpper || 'U-shaped');
  const [archFormLower, setArchFormLower] = useState<ArchShape>(initialPatient?.intraoralSection?.archFormLower || 'U-shaped');
  const [archInadequacies, setArchInadequacies] = useState(initialPatient?.intraoralSection?.archInadequacies || '');
  const [archSymmetry, setArchSymmetry] = useState<FacialSymmetry>(initialPatient?.intraoralSection?.archSymmetry || 'Symmetrical');
  const [midlineUpper, setMidlineUpper] = useState(initialPatient?.intraoralSection?.midlineUpper || 'Coincident');
  const [midlineLower, setMidlineLower] = useState(initialPatient?.intraoralSection?.midlineLower || 'Coincident');
  const [midlineTogether, setMidlineTogether] = useState(initialPatient?.intraoralSection?.midlineTogether || 'Coincident');

  // TAB 10: AI Diagnosis & Plan state
  const [provisionalDiagnosis, setProvisionalDiagnosis] = useState(
    initialPatient?.diagnosisAndPlan?.provisionalDiagnosis || ''
  );

  // TAB 5: Radiography & Growth
  const [opgFindings, setOpgFindings] = useState(initialPatient?.radiographyGrowth?.opgFindings || 'All teeth present, healthy alveolar crests.');
  const [lateralCephFindings, setLateralCephFindings] = useState(initialPatient?.radiographyGrowth?.lateralCephFindings || 'ANB: 2°, SNA: 82°, SNB: 80°.');
  const [iopaFindings, setIopaFindings] = useState(initialPatient?.radiographyGrowth?.iopaFindings || 'Normal periapical architecture.');
  const [handWristFindings, setHandWristFindings] = useState(initialPatient?.radiographyGrowth?.handWristFindings || 'SMI Stage 6.');
  const [occlusalRadFindings, setOcclusalRadFindings] = useState(initialPatient?.radiographyGrowth?.occlusalRadFindings || 'Normal midpalatal suture.');
  const [otherRadFindings, setOtherRadFindings] = useState(initialPatient?.radiographyGrowth?.otherRadFindings || '');

  const [smiStage, setSmiStage] = useState(initialPatient?.radiographyGrowth?.smiStage || 'SMI Stage 6');
  const [cvmStage, setCvmStage] = useState(initialPatient?.radiographyGrowth?.cvmStage || 'CS 3');
  const [pubertalStatus, setPubertalStatus] = useState(initialPatient?.radiographyGrowth?.pubertalStatus || 'Peak pubertal velocity');

  const [downsAnalysis, setDownsAnalysis] = useState<DownsAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.downsAnalysis
  );
  const [steinersAnalysis, setSteinersAnalysis] = useState<SteinersAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.steinersAnalysis
  );
  const [rickettsAnalysis, setRickettsAnalysis] = useState<RickettsAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.rickettsAnalysis
  );
  const [mcnamaraAnalysis, setMcnamaraAnalysis] = useState<McnamaraAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.mcnamaraAnalysis
  );
  const [schwarzTweedAnalysis, setSchwarzTweedAnalysis] = useState<SchwarzTweedAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.schwarzTweedAnalysis
  );
  const [holdawayAnalysis, setHoldawayAnalysis] = useState<HoldawayAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.holdawayAnalysis
  );
  const [cogsAnalysis, setCogsAnalysis] = useState<CogsAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.cogsAnalysis
  );
  const [cogsSoftTissueAnalysis, setCogsSoftTissueAnalysis] = useState<CogsSoftTissueAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.cogsSoftTissueAnalysis
  );
  const [cephDiscrepancyAnalysis, setCephDiscrepancyAnalysis] = useState<CephDiscrepancyAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.cephDiscrepancyAnalysis
  );
  const [verticalJawDivergenceAnalysis, setVerticalJawDivergenceAnalysis] = useState<VerticalJawDivergenceAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.verticalJawDivergenceAnalysis
  );
  const [sagittalVerticalInteractionAnalysis, setSagittalVerticalInteractionAnalysis] = useState<SagittalVerticalInteractionAnalysisData | undefined>(
    initialPatient?.radiographyGrowth?.sagittalVerticalInteractionAnalysis
  );

  const [images, setImages] = useState<InvestigationImage[]>(initialPatient?.investigations?.images || []);

  // TAB 6: Model Analysis
  const [maxillaryArchShape, setMaxillaryArchShape] = useState<ArchShape>(initialPatient?.modelAnalysis?.maxillaryArchShape || 'U-shaped');
  const [mandibularArchShape, setMandibularArchShape] = useState<ArchShape>(initialPatient?.modelAnalysis?.mandibularArchShape || 'U-shaped');
  const [archAlignment, setArchAlignment] = useState<ArchAlignment>(initialPatient?.modelAnalysis?.archAlignment || 'Crowding');
  const [individualIrregularities, setIndividualIrregularities] = useState(initialPatient?.modelAnalysis?.individualIrregularities || '');

  const [toothWidths, setToothWidths] = useState<Record<string, number | ''>>(
    initialPatient?.modelAnalysis?.toothWidths || DEFAULT_TOOTH_WIDTHS
  );

  const [maxillaryArchLengthAvailable, setMaxillaryArchLengthAvailable] = useState<number | ''>(
    initialPatient?.modelAnalysis?.maxillaryArchLengthAvailable || 72
  );
  const [mandibularArchLengthAvailable, setMandibularArchLengthAvailable] = useState<number | ''>(
    initialPatient?.modelAnalysis?.mandibularArchLengthAvailable || 66
  );

  const [premolarDiameter, setPremolarDiameter] = useState<number | ''>(
    initialPatient?.modelAnalysis?.premolarDiameter || 36
  );
  const [premolarBasalArchWidth, setPremolarBasalArchWidth] = useState<number | ''>(
    initialPatient?.modelAnalysis?.premolarBasalArchWidth || 41
  );

  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tabButtonRefs = useRef<Partial<Record<FormTab, HTMLButtonElement | null>>>({});

  const buildCurrentPatientRecord = (): PatientRecord => {
    const rawRecord: Partial<PatientRecord> = {
      id: recordId,
      patientId: patientId.trim() || `ORTHO-2026-001`,
      name: name.trim() || 'New Patient',
      age: age === '' ? 18 : age,
      gender,
      examDate,
      contact,
      email,
      address,
      archived: false,
      createdAt: initialPatient?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),

      chiefComplaint: {
        irregularTeeth: ccIrregular,
        protrudingTeeth: ccProtruding,
        spacing: ccSpacing,
        missingTeeth: ccMissing,
        jawProblem: ccJaw,
        facialAesthetics: ccFacial,
        otherText: ccOtherText,
        duration: ccDuration,
        additionalNotes: ccNotes,
      },
      medicalHistory: {
        diabetes: medDiabetes,
        hypertension: medHypertension,
        asthma: medAsthma,
        allergy: medAllergy,
        bleedingDisorder: medBleeding,
        otherMedical: medOther,
        noSignificantHistory: medNone,
        medicalNotes: medNotes,
      },
      dentalHistory: {
        previousExtraction: dentExtraction,
        previousOrtho: dentOrtho,
        trauma: dentTrauma,
        restoration: dentRestoration,
        dentalNotes: dentNotes,
      },
      habitHistory: {
        thumbSucking: habThumb,
        mouthBreathing: habMouth,
        tongueThrusting: habTongue,
        lipHabit: habLip,
        bruxism: habBruxism,
        none: habNone,
        habitDurationNotes: habNotes,
      },
      historySection: {
        informer,
        prenatalMotherCondition,
        deliveryType,
        postnatalFeeding,
        postnatalMilestones,
        behavioralHistory,
        socialHistory,
        childhoodDiseases,
        motivationForTreatment: motivation,
        attitudeTowardsTreatment: attitude,
        otherPertinentInfo,
      },
      extraoralProfile: {
        built,
        heightCm,
        weightKg,
        gait,
        bodyType,
        facialIndex,
        cephalicIndex,
        shapeOfHead,
        facialForm,
        symmetry,
        maxillaryMidline,
        mandibularMidline,
        lipPostureTonicity,
        interlabialGapMm,
        incisorStomionMm,
        profile,
        facialDivergence,
        nasolabialAngle,
        mentolabialSulcus,
        clinicalFma,
        vto,
      },
      extraoralPhotos,
      extraoralPhotoAnalysis,
      functionalTmj: {
        respiration,
        speech,
        mastication,
        swallowing,
        painHistory,
        clicking,
        crepitus,
        tendernessPalpation,
        pathOfClosure,
        deviation,
        coCrDiscrepancy,
        maxOpeningMm,
        freewaySpaceMm,
        notes: tmjNotes,
      },
      intraoralSection: {
        tongueSize,
        tonguePosture,
        periodontalStatus,
        brushingHabit,
        overallPeriodontal,
        frenalAttachments,
        oralMucosa,
        teethPresent,
        deciduousTeeth,
        cariesTeeth,
        missingTeeth,
        supernumeraryTeeth,
        impactedTeeth,
        toothColourTexture,
        toothShapeSizeForm,
        localizedAbnormalities,
        incisorRelation,
        canineRelationRight,
        canineRelationLeft,
        buccalOcclusionRight,
        buccalOcclusionLeft,
        curveOfSpeeMm,
        overjetMm,
        overbiteMm,
        crossbite,
        displacements,
        archFormUpper,
        archFormLower,
        archInadequacies,
        archSymmetry: symmetry,
        midlineUpper,
        midlineLower,
        midlineTogether,
      },
      radiographyGrowth: {
        opgFindings,
        lateralCephFindings,
        iopaFindings,
        handWristFindings,
        occlusalRadFindings,
        otherRadFindings,
        smiStage,
        cvmStage,
        pubertalStatus,
        downsAnalysis,
        steinersAnalysis,
        rickettsAnalysis,
        mcnamaraAnalysis,
        schwarzTweedAnalysis,
        holdawayAnalysis,
        cogsAnalysis,
        cogsSoftTissueAnalysis,
        cephDiscrepancyAnalysis,
        verticalJawDivergenceAnalysis,
        sagittalVerticalInteractionAnalysis,
      },
      modelAnalysis: {
        maxillaryArchShape,
        mandibularArchShape,
        archSymmetry: symmetry,
        archAlignment,
        individualIrregularities,
        toothWidths,
        maxillaryArchLengthAvailable,
        mandibularArchLengthAvailable,
        premolarDiameter,
        premolarBasalArchWidth,
      },
      investigations: {
        images,
        cephalometricSummary: lateralCephFindings,
        modelAnalysisSummary: `Carey's Available: ${maxillaryArchLengthAvailable}mm`,
        opgNotes: opgFindings,
      },
      diagnosisAndPlan: {
        ...(initialPatient?.diagnosisAndPlan || {}),
        provisionalDiagnosis: provisionalDiagnosis,
        skeletalClassification: initialPatient?.diagnosisAndPlan?.skeletalClassification || 'Skeletal Class I',
        dentalClassification: initialPatient?.diagnosisAndPlan?.dentalClassification || 'Class I',
        softTissueNotes: initialPatient?.diagnosisAndPlan?.softTissueNotes || 'Straight profile with competent lips',
        treatmentObjectives: initialPatient?.diagnosisAndPlan?.treatmentObjectives || 'Align teeth, achieve Class I occlusion',
        proposedAppliance: initialPatient?.diagnosisAndPlan?.proposedAppliance || 'Fixed Appliance (MBT 0.022")',
        extractionPlan: initialPatient?.diagnosisAndPlan?.extractionPlan || 'Non-Extraction',
        retentionPlan: initialPatient?.diagnosisAndPlan?.retentionPlan || 'Hawley Retainers',
      },
      completionStatus: {
        history: true,
        extraoralProfile: true,
        functionalTmj: true,
        intraoral: true,
        radiographyGrowth: true,
        modelAnalysis: true,
        overallPercentage: 100,
      },
    };

    const completionStatus = calculateCompletionStatus(rawRecord);
    return { ...rawRecord, completionStatus } as PatientRecord;
  };

  // Debounced Autosave Effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setAutosaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (name.trim()) {
        const currentRecord = buildCurrentPatientRecord();
        onSavePatient(currentRecord);
        setAutosaveStatus('saved');
        setTimeout(() => setAutosaveStatus('idle'), 2500);
      } else {
        setAutosaveStatus('idle');
      }
    }, 800);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [
    name, age, gender, patientId, examDate, contact, email, address,
    informer, prenatalMotherCondition, deliveryType, postnatalFeeding, postnatalMilestones,
    behavioralHistory, socialHistory, childhoodDiseases, motivation, attitude, otherPertinentInfo,
    ccIrregular, ccProtruding, ccSpacing, ccMissing, ccJaw, ccFacial, ccOtherText, ccDuration, ccNotes,
    medDiabetes, medHypertension, medAsthma, medAllergy, medBleeding, medOther, medNone, medNotes,
    dentExtraction, dentOrtho, dentTrauma, dentRestoration, dentNotes,
    habThumb, habMouth, habTongue, habLip, habBruxism, habNone, habNotes,
    built, heightCm, weightKg, gait, bodyType, facialIndex, cephalicIndex, shapeOfHead,
    facialForm, symmetry, maxillaryMidline, mandibularMidline, lipPostureTonicity, interlabialGapMm, incisorStomionMm,
    profile, facialDivergence, nasolabialAngle, mentolabialSulcus, clinicalFma, vto, extraoralPhotos, extraoralPhotoAnalysis,
    respiration, speech, mastication, swallowing, painHistory, clicking, crepitus, tendernessPalpation,
    pathOfClosure, deviation, coCrDiscrepancy, maxOpeningMm, freewaySpaceMm, tmjNotes,
    tongueSize, tonguePosture, periodontalStatus, brushingHabit, overallPeriodontal, frenalAttachments, oralMucosa,
    teethPresent, deciduousTeeth, cariesTeeth, missingTeeth, supernumeraryTeeth, impactedTeeth, toothColourTexture, toothShapeSizeForm, localizedAbnormalities,
    incisorRelation, canineRelationRight, canineRelationLeft, buccalOcclusionRight, buccalOcclusionLeft,
    curveOfSpeeMm, overjetMm, overbiteMm, crossbite, displacements, archFormUpper, archFormLower, archInadequacies,
    midlineUpper, midlineLower, midlineTogether, opgFindings, lateralCephFindings, iopaFindings, handWristFindings,
    occlusalRadFindings, otherRadFindings, smiStage, cvmStage, pubertalStatus, images,
    maxillaryArchShape, mandibularArchShape, archAlignment, individualIrregularities, toothWidths,
    maxillaryArchLengthAvailable, mandibularArchLengthAvailable, premolarDiameter, premolarBasalArchWidth,
  ]);

  const [completionScore, setCompletionScore] = useState(0);
  const deferredAutosave = useDeferredValue(autosaveStatus);

  // Defer expensive completion scoring so first paint of Add Patient stays snappy
  useEffect(() => {
    const id = window.setTimeout(() => {
      startTransition(() => {
        setCompletionScore(calculateCompletionStatus(buildCurrentPatientRecord()).overallPercentage);
      });
    }, 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- score after tab/autosave changes only
  }, [activeTab, deferredAutosave]);

  const currentScore = completionScore;

  const handleUpdateToothWidth = (tooth: string, val: number | '') => {
    setToothWidths((prev) => ({ ...prev, [tooth]: val }));
  };

  const handleAddImage = (img: InvestigationImage) => {
    setImages((prev) => [...prev, img]);
  };

  const handleRemoveImage = (id: string) => {
    setImages((prev) => prev.filter((item) => item.id !== id));
  };

  // Auto-scroll form body to top whenever active tab changes
  useEffect(() => {
    const scroller = document.querySelector('.case-form-scroll');
    if (scroller instanceof HTMLElement) {
      scroller.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  useEffect(() => {
    const activeButton = tabButtonRefs.current[activeTab];
    activeButton?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeTab]);

  // Nav tab indexing
  const currentTabIndex = TAB_CONFIG.findIndex((t) => t.id === activeTab);

  useEffect(() => {
    prefetchTab(activeTab);
    const next = TAB_CONFIG[currentTabIndex + 1];
    if (next) prefetchTab(next.id);
    // Warm Bonwill CAD early — users often go Model Analysis → Bonwill
    if (activeTab === 'modelAnalysis' || activeTab === 'cephalometricAnalysis') {
      prefetchTab('bonwillCad');
    }
    if (activeTab === 'cephalometricAnalysis') {
      prefetchTab('steinerStick');
    }
  }, [activeTab, currentTabIndex]);

  const [cephSubPage, setCephSubPage] = useState<string>('downs');

  const CEPH_PAGE_IDS = [
    'downs',
    'steiners',
    'ricketts',
    'mcnamara',
    'schwarzTweed',
    'holdaway',
    'cogs',
    'cephDiscrepancy',
    'comprehensiveCeph',
  ];

  const handleNextTab = () => {
    if (activeTab === 'cephalometricAnalysis') {
      const idx = CEPH_PAGE_IDS.indexOf(cephSubPage);
      if (idx >= 0 && idx < CEPH_PAGE_IDS.length - 1) {
        const nextSub = CEPH_PAGE_IDS[idx + 1];
        setCephSubPage(nextSub);
        setTimeout(() => {
          document.getElementById(`ceph-page-${nextSub}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        return;
      }
    }
    if (currentTabIndex < TAB_CONFIG.length - 1) {
      setActiveTab(TAB_CONFIG[currentTabIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    if (activeTab === 'cephalometricAnalysis') {
      const idx = CEPH_PAGE_IDS.indexOf(cephSubPage);
      if (idx > 0) {
        const prevSub = CEPH_PAGE_IDS[idx - 1];
        setCephSubPage(prevSub);
        setTimeout(() => {
          document.getElementById(`ceph-page-${prevSub}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        return;
      }
    }
    if (currentTabIndex > 0) {
      setActiveTab(TAB_CONFIG[currentTabIndex - 1].id);
    }
  };

  const activeMeta = TAB_CONFIG[currentTabIndex] || TAB_CONFIG[0];
  const nextTab = currentTabIndex < TAB_CONFIG.length - 1 ? TAB_CONFIG[currentTabIndex + 1] : null;
  const prevTab = currentTabIndex > 0 ? TAB_CONFIG[currentTabIndex - 1] : null;

  // Calculate completion for all 11 workflow sections
  const getSectionCompletionMap = (): Record<FormTab, boolean> => {
    return {
      history: Boolean(name.trim() && patientId && age),
      extraoralProfile: Boolean(
        profile || built || extraoralPhotos?.profileRight || extraoralPhotos?.frontalRest
      ),
      functionalTmj: Boolean(
        respiration || speech || mastication || clicking || painHistory
      ),
      intraoral: Boolean(
        incisorRelation || overjetMm !== '' || overbiteMm !== ''
      ),
      radiographyGrowth: Boolean(
        opgFindings || lateralCephFindings || (images && images.length > 0)
      ),
      modelAnalysis: Boolean(
        maxillaryArchShape || (toothWidths && Object.keys(toothWidths).length > 0)
      ),
      cephalometricAnalysis: Boolean(
        downsAnalysis ||
          steinersAnalysis ||
          mcnamaraAnalysis ||
          rickettsAnalysis ||
          schwarzTweedAnalysis ||
          holdawayAnalysis ||
          cogsAnalysis ||
          cogsSoftTissueAnalysis
      ),
      bonwillCad: Boolean(toothWidths && Object.keys(toothWidths).length >= 6),
      steinerStick: Boolean(steinersAnalysis || schwarzTweedAnalysis || downsAnalysis),
      aiDiagnosis: Boolean(provisionalDiagnosis && provisionalDiagnosis.trim().length > 0),
      treatmentPlan: Boolean(
        initialPatient?.diagnosisAndPlan?.treatmentPlanText || provisionalDiagnosis.trim().length > 0
      ),
    };
  };

  const sectionCompletionMap = getSectionCompletionMap();
  const completedCount = Object.values(sectionCompletionMap).filter(Boolean).length;
  const completionPercentage = Math.round((completedCount / TAB_CONFIG.length) * 100);

  return (
    <div className="case-form-shell relative">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200/90 shadow-2xs px-3 py-1 flex items-center justify-between gap-2 min-h-[38px] h-[38px] shrink-0">
        {/* Left: Workflow Toggle (☰) */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200/80 active:bg-slate-200 text-slate-800 flex items-center justify-center transition-colors cursor-pointer shrink-0 active:scale-95"
          aria-label="Open Orthodontic Workflow Navigation Menu"
          title="Workflow Menu (☰)"
        >
          <Menu className="w-4 h-4 text-slate-800" />
        </button>

        {/* Center: Current section title */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2 px-1">
          <h1 className="text-[14px] font-bold text-slate-800 truncate leading-none">
            {activeMeta.label}
          </h1>
          <span className="text-[10px] font-medium text-slate-500 shrink-0 leading-none bg-slate-100 px-1.5 py-0.5 rounded-md">
            {currentTabIndex + 1} / {TAB_CONFIG.length}
          </span>
        </div>

        {/* Right: Auto-save status (✓ Saved / Saving...) */}
        <div className="flex items-center justify-end shrink-0 min-w-[65px]">
          {autosaveStatus === 'saving' ? (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-medium border border-amber-200/80">
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-amber-600" />
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200/80">
              <Check className="w-3 h-3 text-emerald-600 stroke-[2.5]" />
              <span>Saved</span>
            </div>
          )}
        </div>
      </header>

      {/* Left-Side Navigation Drawer */}
      {isDrawerOpen && (
        <div className="absolute inset-0 z-50 flex overflow-hidden">
          {/* Smooth Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-fadeIn cursor-pointer"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Container (Width ~85%, max 320px, rounded-r-2xl) */}
          <div className="relative z-10 w-[85%] max-w-[320px] h-full bg-white shadow-2xl flex flex-col rounded-r-2xl overflow-hidden animate-slideInLeft border-r border-slate-200">
            {/* Drawer Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold tracking-tight text-white leading-tight">
                    OrthoCase Workflow
                  </h2>
                  <p className="text-[12px] text-slate-400 truncate max-w-[170px]">
                    {name || patientId}
                  </p>
                </div>
              </div>

              {/* Close Button (min 44x44) */}
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-11 h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
                aria-label="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow Progress Banner inside Drawer */}
            <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-[12px] font-medium">
                <span className="text-slate-700 font-semibold">
                  {completedCount} of {TAB_CONFIG.length} Sections Completed
                </span>
                <span className="text-teal-700 font-bold">{completionPercentage}% Complete</span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>

            {/* Drawer Menu Items List */}
            <div className="flex-1 min-h-0 overflow-y-auto pt-1 pb-16 divide-y divide-slate-100">
              {TAB_CONFIG.map((tab, idx) => {
                const isActive = activeTab === tab.id;
                const isCompleted = sectionCompletionMap[tab.id];

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(tab.id);
                      setIsDrawerOpen(false);
                    }}
                    onPointerEnter={() => prefetchTab(tab.id)}
                    className={`w-full px-4 py-3 min-h-[48px] text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
                      isActive
                        ? 'bg-teal-50/90 text-teal-900 font-bold border-l-4 border-teal-600 shadow-2xs'
                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[12px] font-bold w-5 text-right shrink-0 ${
                          isActive ? 'text-teal-700' : 'text-slate-400'
                        }`}
                      >
                        {idx + 1}.
                      </span>
                      <span className="text-[15px] leading-snug truncate">{tab.label}</span>
                    </div>

                    <div className="shrink-0 flex items-center pl-2">
                      {isCompleted ? (
                        <div
                          className="w-5.5 h-5.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-300"
                          title="Completed"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        </div>
                      ) : (
                        <div
                          className="w-5.5 h-5.5 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-300"
                          title="Incomplete"
                        >
                          <span className="text-[10px] text-slate-400 font-bold">○</span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Scrollable form body only */}
      <div className="case-form-scroll">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
        {activeTab === 'history' && (
          <TabHistory
            name={name}
            setName={setName}
            patientId={patientId}
            setPatientId={setPatientId}
            age={age}
            setAge={setAge}
            gender={gender}
            setGender={setGender}
            examDate={examDate}
            setExamDate={setExamDate}
            contact={contact}
            setContact={setContact}
            address={address}
            setAddress={setAddress}
            informer={informer}
            setInformer={setInformer}
            prenatalMotherCondition={prenatalMotherCondition}
            setPrenatalMotherCondition={setPrenatalMotherCondition}
            deliveryType={deliveryType}
            setDeliveryType={setDeliveryType}
            postnatalFeeding={postnatalFeeding}
            setPostnatalFeeding={setPostnatalFeeding}
            postnatalMilestones={postnatalMilestones}
            setPostnatalMilestones={setPostnatalMilestones}
            behavioralHistory={behavioralHistory}
            setBehavioralHistory={setBehavioralHistory}
            socialHistory={socialHistory}
            setSocialHistory={setSocialHistory}
            childhoodDiseases={childhoodDiseases}
            setChildhoodDiseases={setChildhoodDiseases}
            motivation={motivation}
            setMotivation={setMotivation}
            attitude={attitude}
            setAttitude={setAttitude}
            otherPertinentInfo={otherPertinentInfo}
            setOtherPertinentInfo={setOtherPertinentInfo}
            ccIrregular={ccIrregular}
            setCcIrregular={setCcIrregular}
            ccProtruding={ccProtruding}
            setCcProtruding={setCcProtruding}
            ccSpacing={ccSpacing}
            setCcSpacing={setCcSpacing}
            ccMissing={ccMissing}
            setCcMissing={setCcMissing}
            ccJaw={ccJaw}
            setCcJaw={setCcJaw}
            ccFacial={ccFacial}
            setCcFacial={setCcFacial}
            ccOtherText={ccOtherText}
            setCcOtherText={setCcOtherText}
            ccDuration={ccDuration}
            setCcDuration={setCcDuration}
            ccNotes={ccNotes}
            setCcNotes={setCcNotes}
            medDiabetes={medDiabetes}
            setMedDiabetes={setMedDiabetes}
            medHypertension={medHypertension}
            setMedHypertension={setMedHypertension}
            medAsthma={medAsthma}
            setMedAsthma={setMedAsthma}
            medAllergy={medAllergy}
            setMedAllergy={setMedAllergy}
            medBleeding={medBleeding}
            setMedBleeding={setMedBleeding}
            medOther={medOther}
            setMedOther={setMedOther}
            medNone={medNone}
            setMedNone={setMedNone}
            medNotes={medNotes}
            setMedNotes={setMedNotes}
            dentExtraction={dentExtraction}
            setDentExtraction={setDentExtraction}
            dentOrtho={dentOrtho}
            setDentOrtho={setDentOrtho}
            dentTrauma={dentTrauma}
            setDentTrauma={setDentTrauma}
            dentRestoration={dentRestoration}
            setDentRestoration={setDentRestoration}
            dentNotes={dentNotes}
            setDentNotes={setDentNotes}
            habThumb={habThumb}
            setHabThumb={setHabThumb}
            habMouth={habMouth}
            setHabMouth={setHabMouth}
            habTongue={habTongue}
            setHabTongue={setHabTongue}
            habLip={habLip}
            setHabLip={setHabLip}
            habBruxism={habBruxism}
            setHabBruxism={setHabBruxism}
            habNone={habNone}
            setHabNone={setHabNone}
            habNotes={habNotes}
            setHabNotes={setHabNotes}
          />
        )}

        <Suspense fallback={<TabLoader />}>
        {activeTab === 'extraoralProfile' && (
          <TabExtraoralProfile
            extraoralPhotos={extraoralPhotos}
            setExtraoralPhotos={setExtraoralPhotos}
            extraoralPhotoAnalysis={extraoralPhotoAnalysis}
            setExtraoralPhotoAnalysis={setExtraoralPhotoAnalysis}
            images={images}
            setImages={setImages}
            built={built}
            setBuilt={setBuilt}
            heightCm={heightCm}
            setHeightCm={setHeightCm}
            weightKg={weightKg}
            setWeightKg={setWeightKg}
            gait={gait}
            setGait={setGait}
            bodyType={bodyType}
            setBodyType={setBodyType}
            facialIndex={facialIndex}
            setFacialIndex={setFacialIndex}
            cephalicIndex={cephalicIndex}
            setCephalicIndex={setCephalicIndex}
            shapeOfHead={shapeOfHead}
            setShapeOfHead={setShapeOfHead}
            facialForm={facialForm}
            setFacialForm={setFacialForm}
            symmetry={symmetry}
            setSymmetry={setSymmetry}
            maxillaryMidline={maxillaryMidline}
            setMaxillaryMidline={setMaxillaryMidline}
            mandibularMidline={mandibularMidline}
            setMandibularMidline={setMandibularMidline}
            lipPostureTonicity={lipPostureTonicity}
            setLipPostureTonicity={setLipPostureTonicity}
            interlabialGapMm={interlabialGapMm}
            setInterlabialGapMm={setInterlabialGapMm}
            incisorStomionMm={incisorStomionMm}
            setIncisorStomionMm={setIncisorStomionMm}
            profile={profile}
            setProfile={setProfile}
            facialDivergence={facialDivergence}
            setFacialDivergence={setFacialDivergence}
            nasolabialAngle={nasolabialAngle}
            setNasolabialAngle={setNasolabialAngle}
            mentolabialSulcus={mentolabialSulcus}
            setMentolabialSulcus={setMentolabialSulcus}
            clinicalFma={clinicalFma}
            setClinicalFma={setClinicalFma}
            vto={vto}
            setVto={setVto}
          />
        )}

        {activeTab === 'functionalTmj' && (
          <TabFunctionalTmj
            respiration={respiration}
            setRespiration={setRespiration}
            speech={speech}
            setSpeech={setSpeech}
            mastication={mastication}
            setMastication={setMastication}
            swallowing={swallowing}
            setSwallowing={setSwallowing}
            painHistory={painHistory}
            setPainHistory={setPainHistory}
            clicking={clicking}
            setClicking={setClicking}
            crepitus={crepitus}
            setCrepitus={setCrepitus}
            tendernessPalpation={tendernessPalpation}
            setTendernessPalpation={setTendernessPalpation}
            pathOfClosure={pathOfClosure}
            setPathOfClosure={setPathOfClosure}
            deviation={deviation}
            setDeviation={setDeviation}
            coCrDiscrepancy={coCrDiscrepancy}
            setCoCrDiscrepancy={setCoCrDiscrepancy}
            maxOpeningMm={maxOpeningMm}
            setMaxOpeningMm={setMaxOpeningMm}
            freewaySpaceMm={freewaySpaceMm}
            setFreewaySpaceMm={setFreewaySpaceMm}
            notes={tmjNotes}
            setNotes={setTmjNotes}
          />
        )}

        {activeTab === 'intraoral' && (
          <TabIntraoral
            tongueSize={tongueSize}
            setTongueSize={setTongueSize}
            tonguePosture={tonguePosture}
            setTonguePosture={setTonguePosture}
            periodontalStatus={periodontalStatus}
            setPeriodontalStatus={setPeriodontalStatus}
            brushingHabit={brushingHabit}
            setBrushingHabit={setBrushingHabit}
            overallPeriodontal={overallPeriodontal}
            setOverallPeriodontal={setOverallPeriodontal}
            frenalAttachments={frenalAttachments}
            setFrenalAttachments={setFrenalAttachments}
            oralMucosa={oralMucosa}
            setOralMucosa={setOralMucosa}
            teethPresent={teethPresent}
            setTeethPresent={setTeethPresent}
            deciduousTeeth={deciduousTeeth}
            setDeciduousTeeth={setDeciduousTeeth}
            cariesTeeth={cariesTeeth}
            setCariesTeeth={setCariesTeeth}
            missingTeeth={missingTeeth}
            setMissingTeeth={setMissingTeeth}
            supernumeraryTeeth={supernumeraryTeeth}
            setSupernumeraryTeeth={setSupernumeraryTeeth}
            impactedTeeth={impactedTeeth}
            setImpactedTeeth={setImpactedTeeth}
            toothColourTexture={toothColourTexture}
            setToothColourTexture={setToothColourTexture}
            toothShapeSizeForm={toothShapeSizeForm}
            setToothShapeSizeForm={setToothShapeSizeForm}
            localizedAbnormalities={localizedAbnormalities}
            setLocalizedAbnormalities={setLocalizedAbnormalities}
            incisorRelation={incisorRelation}
            setIncisorRelation={setIncisorRelation}
            canineRelationRight={canineRelationRight}
            setCanineRelationRight={setCanineRelationRight}
            canineRelationLeft={canineRelationLeft}
            setCanineRelationLeft={setCanineRelationLeft}
            buccalOcclusionRight={buccalOcclusionRight}
            setBuccalOcclusionRight={setBuccalOcclusionRight}
            buccalOcclusionLeft={buccalOcclusionLeft}
            setBuccalOcclusionLeft={setBuccalOcclusionLeft}
            curveOfSpeeMm={curveOfSpeeMm}
            setCurveOfSpeeMm={setCurveOfSpeeMm}
            overjetMm={overjetMm}
            setOverjetMm={setOverjetMm}
            overbiteMm={overbiteMm}
            setOverbiteMm={setOverbiteMm}
            crossbite={crossbite}
            setCrossbite={setCrossbite}
            displacements={displacements}
            setDisplacements={setDisplacements}
            archFormUpper={archFormUpper}
            setArchFormUpper={setArchFormUpper}
            archFormLower={archFormLower}
            setArchFormLower={setArchFormLower}
            archInadequacies={archInadequacies}
            setArchInadequacies={setArchInadequacies}
            archSymmetry={symmetry}
            setArchSymmetry={setSymmetry}
            midlineUpper={midlineUpper}
            setMidlineUpper={setMidlineUpper}
            midlineLower={midlineLower}
            setMidlineLower={setMidlineLower}
            midlineTogether={midlineTogether}
            setMidlineTogether={setMidlineTogether}
          />
        )}

        {activeTab === 'radiographyGrowth' && (
          <TabRadiographyGrowth
            opgFindings={opgFindings}
            setOpgFindings={setOpgFindings}
            lateralCephFindings={lateralCephFindings}
            setLateralCephFindings={setLateralCephFindings}
            otherRadFindings={otherRadFindings}
            setOtherRadFindings={setOtherRadFindings}
            smiStage={smiStage}
            setSmiStage={setSmiStage}
            cvmStage={cvmStage}
            setCvmStage={setCvmStage}
            pubertalStatus={pubertalStatus}
            setPubertalStatus={setPubertalStatus}
            images={images}
            onAddImage={handleAddImage}
            onRemoveImage={handleRemoveImage}
          />
        )}

        {activeTab === 'modelAnalysis' && (
          <TabModelAnalysis
            maxillaryArchShape={maxillaryArchShape}
            setMaxillaryArchShape={setMaxillaryArchShape}
            mandibularArchShape={mandibularArchShape}
            setMandibularArchShape={setMandibularArchShape}
            archSymmetry={symmetry}
            setArchSymmetry={setSymmetry}
            archAlignment={archAlignment}
            setArchAlignment={setArchAlignment}
            individualIrregularities={individualIrregularities}
            setIndividualIrregularities={setIndividualIrregularities}
            toothWidths={toothWidths}
            onUpdateToothWidth={handleUpdateToothWidth}
            maxillaryArchLengthAvailable={maxillaryArchLengthAvailable}
            setMaxillaryArchLengthAvailable={setMaxillaryArchLengthAvailable}
            mandibularArchLengthAvailable={mandibularArchLengthAvailable}
            setMandibularArchLengthAvailable={setMandibularArchLengthAvailable}
            premolarDiameter={premolarDiameter}
            setPremolarDiameter={setPremolarDiameter}
            premolarBasalArchWidth={premolarBasalArchWidth}
            setPremolarBasalArchWidth={setPremolarBasalArchWidth}
          />
        )}

        {activeTab === 'cephalometricAnalysis' && (
          <TabCephalometricAnalysis
            downsAnalysis={downsAnalysis}
            onUpdateDownsAnalysis={setDownsAnalysis}
            steinersAnalysis={steinersAnalysis}
            onUpdateSteinersAnalysis={setSteinersAnalysis}
            rickettsAnalysis={rickettsAnalysis}
            onUpdateRickettsAnalysis={setRickettsAnalysis}
            mcnamaraAnalysis={mcnamaraAnalysis}
            onUpdateMcnamaraAnalysis={setMcnamaraAnalysis}
            schwarzTweedAnalysis={schwarzTweedAnalysis}
            onUpdateSchwarzTweedAnalysis={setSchwarzTweedAnalysis}
            holdawayAnalysis={holdawayAnalysis}
            onUpdateHoldawayAnalysis={setHoldawayAnalysis}
            cogsAnalysis={cogsAnalysis}
            onUpdateCogsAnalysis={setCogsAnalysis}
            cogsSoftTissueAnalysis={cogsSoftTissueAnalysis}
            onUpdateCogsSoftTissueAnalysis={setCogsSoftTissueAnalysis}
            cephDiscrepancyAnalysis={cephDiscrepancyAnalysis}
            onUpdateCephDiscrepancyAnalysis={setCephDiscrepancyAnalysis}
            verticalJawDivergenceAnalysis={verticalJawDivergenceAnalysis}
            onUpdateVerticalJawDivergenceAnalysis={setVerticalJawDivergenceAnalysis}
            sagittalVerticalInteractionAnalysis={sagittalVerticalInteractionAnalysis}
            onUpdateSagittalVerticalInteractionAnalysis={setSagittalVerticalInteractionAnalysis}
            patientAge={age || 12}
            patientGender={gender}
            activeSubPage={cephSubPage}
            onSubPageChange={setCephSubPage}
            onPrevTab={() => {
              if (currentTabIndex > 0) setActiveTab(TAB_CONFIG[currentTabIndex - 1].id);
            }}
            onNextTab={() => {
              if (currentTabIndex < TAB_CONFIG.length - 1) setActiveTab(TAB_CONFIG[currentTabIndex + 1].id);
            }}
          />
        )}

        {activeTab === 'bonwillCad' && (
          <div className="pt-2">
            <BonwillHawleyGenerator
              patientName={name || 'Patient'}
              patientId={patientId}
              toothWidths={toothWidths}
            />
          </div>
        )}

        {activeTab === 'steinerStick' && (
          <TabSteinerStick
            steinersAnalysis={steinersAnalysis}
            schwarzTweedAnalysis={schwarzTweedAnalysis}
            downsAnalysis={downsAnalysis}
            overjetMm={overjetMm}
            overbiteMm={overbiteMm}
            patientName={name || 'Patient'}
            patientAge={age || 18}
            patientGender={gender}
          />
        )}

        {activeTab === 'aiDiagnosis' && (
          <TabAiDiagnosis
            patient={buildCurrentPatientRecord()}
            profile={profile}
            onUpdatePatient={(updatedPatient) => {
              if (updatedPatient.diagnosisAndPlan?.provisionalDiagnosis !== undefined) {
                setProvisionalDiagnosis(updatedPatient.diagnosisAndPlan.provisionalDiagnosis);
              }
              onSavePatient(updatedPatient);
            }}
          />
        )}

        {activeTab === 'treatmentPlan' && (
          <TabTreatmentPlan
            patient={buildCurrentPatientRecord()}
            profile={profile}
            onUpdatePatient={(updatedPatient) => onSavePatient(updatedPatient)}
          />
        )}
        </Suspense>

        {/* Inline Section Navigation - Placed naturally at the end of scrollable form content */}
        <div className="mt-7 pb-8 border-t border-slate-200/80 pt-4">
          <div className="flex items-center justify-between gap-3 max-w-2xl mx-auto px-1">
            <button
              type="button"
              onClick={handlePrevTab}
              disabled={!prevTab}
              className={`flex items-center justify-center gap-1.5 min-h-[38px] h-[38px] px-4 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                !prevTab
                  ? 'opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 border border-slate-200'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:scale-98 shadow-2xs'
              }`}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
              <span>Previous</span>
            </button>

            {/* Synchronized Dynamic Stepper Counter Pill */}
            <div className="text-center px-2">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3.5 py-1.5 rounded-full shrink-0 shadow-2xs inline-block">
                Step {currentTabIndex + 1} of {TAB_CONFIG.length}
              </span>
            </div>

            {nextTab ? (
              <button
                type="button"
                onClick={handleNextTab}
                className="flex items-center justify-center gap-1.5 min-h-[38px] h-[38px] px-5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-[13px] font-bold shadow-sm transition-all cursor-pointer active:scale-98"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (name.trim()) {
                    onSavePatient(buildCurrentPatientRecord());
                  }
                  onCancel();
                }}
                className="flex items-center justify-center gap-1.5 min-h-[38px] h-[38px] px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[13px] font-bold shadow-md transition-all cursor-pointer active:scale-98"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Finish Case</span>
              </button>
            )}
          </div>
        </div>
      </form>
      </div>
    </div>
  );
};
