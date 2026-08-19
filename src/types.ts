export * from './types/dentalVto';
export type Gender = 'Male' | 'Female' | 'Other';
export type DurationOption = '<6 months' | '6 months-1 year' | '1-3 years' | '>3 years';
export type MolarCanineClass = 'Class I' | 'Class II' | 'Class III' | 'End-on' | 'Edge-to-Edge';
export type IncisorRelation =
  | 'Class I'
  | 'Class II'
  | 'Class III'
  | 'Open bite'
  | 'Deep bite'
  | 'Edge to edge';

export type BodyType = 'Ectomorph' | 'Endomorph' | 'Mesomorph';
export type ShapeOfHead = 'Brachycephalic' | 'Mesocephalic' | 'Dolichocephalic';
export type FacialForm = 'Euryprosopic' | 'Europrosopic' | 'Mesoprosopic' | 'Leptoprosopic';
export type FacialSymmetry = 'Symmetrical' | 'Asymmetrical';
export type LipPostureTonicity = 'Competent' | 'Potentially Competent' | 'Incompetent' | 'Hypotonic' | 'Normotonic' | 'Hypertonic';
export type FacialProfile = 'Convex' | 'Orthognathic or Straight' | 'Concave';
export type FacialDivergence = 'Anterior' | 'Straight' | 'Posterior';
export type NasolabialAngleType = 'Acute' | 'Right Angle' | 'Obtuse';
export type MentolabialSulcus = 'Shallow' | 'Normal' | 'Deep';

export type TreatmentMotivation = 'Internal' | 'External' | 'Combination';
export type TreatmentAttitude = 'Enthusiastic' | 'Interested' | 'Neutral' | 'Reluctant' | 'Negative';

export type RespirationType = 'Nasal' | 'Oral' | 'Abnormal retained infantile' | 'Mature swallow';
export type MasticationType = 'Unilateral' | 'Bilateral';

export type OverallPeriodontalStatus = 'Good' | 'Average' | 'Poor' | 'Compromised';
export type FrenalAttachment = 'High' | 'Normal';
export type ArchShape = 'U-shaped' | 'V-shaped' | 'Square-shaped';
export type ArchAlignment = 'Crowding' | 'Spacing' | 'Rotation';

export interface ChiefComplaint {
  irregularTeeth: boolean;
  protrudingTeeth: boolean;
  spacing: boolean;
  missingTeeth: boolean;
  jawProblem: boolean;
  facialAesthetics: boolean;
  otherText: string;
  duration: DurationOption;
  additionalNotes?: string;
}

export interface MedicalHistory {
  diabetes: boolean;
  hypertension: boolean;
  asthma: boolean;
  allergy: boolean;
  bleedingDisorder: boolean;
  otherMedical: boolean;
  noSignificantHistory: boolean;
  medicalNotes?: string;
}

export interface DentalHistory {
  previousExtraction: boolean;
  previousOrtho: boolean;
  trauma: boolean;
  restoration: boolean;
  dentalNotes?: string;
}

export interface HabitHistory {
  thumbSucking: boolean;
  mouthBreathing: boolean;
  tongueThrusting: boolean;
  lipHabit: boolean;
  bruxism: boolean;
  none: boolean;
  habitDurationNotes?: string;
}

export interface HistorySection {
  informer?: string;
  prenatalMotherCondition?: string;
  deliveryType?: string;
  postnatalFeeding?: string;
  postnatalMilestones?: string;
  behavioralHistory?: string;
  socialHistory?: string;
  childhoodDiseases?: string;
  habitsNotes?: string;
  motivationForTreatment?: TreatmentMotivation;
  attitudeTowardsTreatment?: TreatmentAttitude;
  otherPertinentInfo?: string;
}

export interface ExtraoralProfileSection {
  built?: string;
  heightCm?: number | '';
  weightKg?: number | '';
  gait?: string;
  bodyType?: BodyType;
  facialIndex?: string;
  cephalicIndex?: string;
  shapeOfHead?: ShapeOfHead;
  facialForm?: FacialForm;
  symmetry?: FacialSymmetry;
  maxillaryMidline?: string;
  mandibularMidline?: string;
  lipPostureTonicity?: LipPostureTonicity;
  interlabialGapMm?: number | '';
  incisorStomionMm?: number | '';
  profile?: FacialProfile;
  facialDivergence?: FacialDivergence;
  nasolabialAngle?: NasolabialAngleType;
  mentolabialSulcus?: MentolabialSulcus;
  clinicalFma?: string;
  vto?: string;
  smileAssessment?: SmileAssessmentData;
  notes?: string;
}

export interface SmileAssessmentData {
  photoUrl?: string;
  midlineType?: 'Coinciding' | 'Non-coinciding' | string;
  midlineDeviationMm?: number | '';
  midlineDeviationDirection?: 'Right' | 'Left' | string;
  incisorExposureRestMm?: number | '';
  incisorExposureSmile?: 'Full crown' | '3/4 crown' | '1/2 crown' | 'Gingival display' | 'Inadequate (< 75%)' | string;
  gingivalExposureMm?: number | '';
  buccalCorridor?: 'Normal' | 'Increased' | 'Restricted' | string;
  smileArc?: 'Consonant' | 'Flat' | 'Reversed' | string;
  notes?: string;
}

export interface ExtraoralPhotos {
  frontal_rest?: string;
  frontal_smile?: string;
  profile?: string;
  oblique?: string;
  vto?: string;
  [key: string]: string | undefined;
}

export interface IntraoralPhotos {
  front?: string;
  right?: string;
  left?: string;
  upperOcclusal?: string;
  lowerOcclusal?: string;
  [key: string]: string | undefined;
}

export interface FrontalGuideLines {
  trichionY: number;   // normalized 0.0 - 1.0 (default 0.15)
  glabellaY: number;   // normalized 0.0 - 1.0 (default 0.35)
  subnasaleY: number;  // normalized 0.0 - 1.0 (default 0.60)
  mentonY: number;     // normalized 0.0 - 1.0 (default 0.85)
  midlineX: number;    // normalized 0.0 - 1.0 (default 0.50)
  vLeftOuterX?: number;  // Far Left Facial Margin (default 0.15)
  vLeftInnerX?: number;  // Left Inner Canthus / Alar Base (default 0.38)
  vRightInnerX?: number; // Right Inner Canthus / Alar Base (default 0.62)
  vRightOuterX?: number; // Far Right Facial Margin (default 0.85)
}

export interface VtoComparisonNotes {
  lipCompetence?: string;
  chinProjection?: string;
  overallImprovement?: 'Yes' | 'Partial' | 'No' | string;
  comparisonNotes?: string;
}

export interface ExtraoralPhotoAnalysis {
  guides?: FrontalGuideLines;
  thirdsInterpretation?: string;
  midlineDeviation?: string;
  fifthsInterpretation?: string;
  conclusion?: string;
  viewNotes?: {
    frontal_rest?: string;
    frontal_smile?: string;
    profile?: string;
    oblique?: string;
    vto?: string;
  };
  vtoComparison?: VtoComparisonNotes;
}

export interface FunctionalTmjSection {
  respiration?: RespirationType;
  speech?: string;
  mastication?: MasticationType;
  swallowing?: string;
  painHistory?: boolean;
  clicking?: boolean;
  crepitus?: boolean;
  tendernessPalpation?: boolean;
  pathOfClosure?: string;
  deviation?: string;
  coCrDiscrepancy?: string;
  maxOpeningMm?: number | '';
  freewaySpaceMm?: number | '';
  notes?: string;
}

export interface IntraoralExamSection {
  tongueSize?: string;
  tonguePosture?: string;
  periodontalStatus?: string;
  brushingHabit?: string;
  overallPeriodontal?: OverallPeriodontalStatus;
  frenalAttachments?: FrenalAttachment;
  oralMucosa?: string;
  teethPresent?: string;
  deciduousTeeth?: string;
  cariesTeeth?: string;
  missingTeeth?: string;
  supernumeraryTeeth?: string;
  impactedTeeth?: string;
  toothColourTexture?: string;
  toothShapeSizeForm?: string;
  localizedAbnormalities?: string;
  incisorRelation?: IncisorRelation;
  canineRelationRight?: MolarCanineClass;
  canineRelationLeft?: MolarCanineClass;
  buccalOcclusionRight?: MolarCanineClass;
  buccalOcclusionLeft?: MolarCanineClass;
  curveOfSpeeMm?: number | '';
  overjetMm?: number | '';
  overbiteMm?: number | '';
  crossbite?: string;
  displacements?: string;
  archFormUpper?: ArchShape;
  archFormLower?: ArchShape;
  archInadequacies?: string;
  archSymmetry?: FacialSymmetry;
  midlineUpper?: string;
  midlineLower?: string;
  midlineTogether?: string;
  photos?: IntraoralPhotos;
  notes?: string;
}

export type DownsParameterKey =
  | 'facialAngle'
  | 'angleConvexity'
  | 'abPlane'
  | 'mandibularPlaneAngle'
  | 'yAxis'
  | 'cantOfOcclusion'
  | 'lowerIncisorToOcclusal'
  | 'impa'
  | 'interincisalAngle'
  | 'upperIncisalAngle';

export interface DownsStageValues {
  pre: number | '';
  mid: number | '';
  post: number | '';
}

export type DownsParametersMap = Record<DownsParameterKey, DownsStageValues>;

export interface DownsAnalysisData {
  parameters?: Partial<DownsParametersMap>;
  conclusion?: string;
}

export type SteinersParameterKey =
  | 'sna'
  | 'snb'
  | 'anb'
  | 'occlusalPlaneAngle'
  | 'mandibularPlaneAngle'
  | 'upperIncisorToNaMm'
  | 'upperIncisorToNaDeg'
  | 'lowerIncisorToNbDeg'
  | 'lowerIncisorToNbMm'
  | 'interincisalAngle'
  | 'steinersSLine';

export interface SteinersStageValues {
  pre: number | '';
  mid: number | '';
  post: number | '';
}

export type SteinersParametersMap = Record<SteinersParameterKey, SteinersStageValues>;

export interface SteinersAnalysisData {
  parameters?: Partial<SteinersParametersMap>;
  conclusion?: string;
}

export type RickettsParameterKey =
  | 'facialAxis'
  | 'facialDepth'
  | 'mandibularPlaneAngle'
  | 'convexityPointA'
  | 'lowerIncisorToAPogMm'
  | 'upperMolarToPtv'
  | 'lowerIncisorToAPogDeg'
  | 'lowerLipToEPlane';

export interface RickettsStageValues {
  pre: number | '';
  mid: number | '';
  post: number | '';
}

export type RickettsParametersMap = Record<RickettsParameterKey, RickettsStageValues>;

export interface RickettsAnalysisData {
  parameters?: Partial<RickettsParametersMap>;
  conclusion?: string;
}

export type McnamaraParameterKey =
  | 'nasolabialAngle'
  | 'naPerpToPointA'
  | 'mandibularLengthCoGn'
  | 'maxillaryLengthCoPointA'
  | 'maxMandDifference'
  | 'mandibularPlaneAngle'
  | 'facialAxis'
  | 'pogNaPerp'
  | 'upperIncisorToPointA'
  | 'lowerIncisorToPointA'
  | 'upperPharynx'
  | 'lowerPharynx';

export type SizeFrame = 'small' | 'medium' | 'large';

export interface McnamaraStageValues {
  pre: number | '';
  mid: number | '';
  post: number | '';
}

export type McnamaraParametersMap = Record<McnamaraParameterKey, McnamaraStageValues>;

export interface McnamaraAnalysisData {
  sizeFrame?: SizeFrame;
  parameters?: Partial<McnamaraParametersMap>;
  conclusion?: string;
}

export type SchwarzTweedParameterKey =
  | 'seNLength'
  | 'mandibularLength'
  | 'ascendingRamusLength'
  | 'maxillaryLength'
  | 'fmpa'
  | 'impa'
  | 'fmia';

export interface SchwarzTweedStageValues {
  pre: number | '';
  mid: number | '';
  post: number | '';
}

export type SchwarzTweedParametersMap = Record<SchwarzTweedParameterKey, SchwarzTweedStageValues>;

export interface SchwarzTweedAnalysisData {
  parameters?: Partial<SchwarzTweedParametersMap>;
  conclusion?: string;
}

export type HoldawayParameterKey =
  | 'facialContourAngle'
  | 'upperLipStrain'
  | 'softTissueChinThickness'
  | 'subnasaleToHLine'
  | 'upperLipToHLine'
  | 'lowerLipToHLine'
  | 'softTissueFacialAngle'
  | 'hAngle';

export interface HoldawayStageValues {
  pre: number | '';
  mid: number | '';
  post: number | '';
}

export type HoldawayParametersMap = Record<HoldawayParameterKey, HoldawayStageValues>;

export interface HoldawayAnalysisData {
  parameters?: Partial<HoldawayParametersMap>;
  conclusion?: string;
}

export type CogsParameterKey =
  | 'na'
  | 'nb'
  | 'maxillaryLengthPtmA'
  | 'totalMandibularLengthArPg'
  | 'corpusLengthGoPg'
  | 'ramusHeightArGo'
  | 'nAns'
  | 'ansMe'
  | 'facialHeightRatio';

export interface CogsStageValues {
  pre: number | '';
  mid: number | '';
  post: number | '';
}

export type CogsParametersMap = Record<CogsParameterKey, CogsStageValues>;

export interface CogsAnalysisData {
  parameters?: Partial<CogsParametersMap>;
  conclusion?: string;
}

export type CogsSoftTissueParameterKey =
  | 'gSnPg'
  | 'gSn'
  | 'gPg'
  | 'gSnSnMeRatio'
  | 'snGnC'
  | 'snGnCGnRatio'
  | 'cmSnLs'
  | 'lsSnPg'
  | 'liSnPg'
  | 'siLiPg'
  | 'snStmsStmiRatio'
  | 'stmsI'
  | 'stmsStmi'
  | 'merrifieldZAngle';

export type CogsSoftTissueStageValues = CogsStageValues;

export type CogsSoftTissueParametersMap = Record<CogsSoftTissueParameterKey, CogsSoftTissueStageValues>;

export interface CogsSoftTissueAnalysisData {
  parameters?: Partial<CogsSoftTissueParametersMap>;
  conclusion?: string;
}

export type CephDiscrepancyParameterKey =
  | 'anbAngle'
  | 'aMoBFh'
  | 'witsAoBo'
  | 'betaAngle'
  | 'yenAngle'
  | 'wAngle'
  | 'apdi'
  | 'naPog'
  | 'abNpog'
  | 'maxMandRatio'
  | 'harvoldUnitDiff'
  | 'snOrientationAngle'
  | 'softTissueProfileAngle'
  | 'totalTissueProfileAngle'
  | 'softTissueFacialAngle'
  | 'subnasaleToChin'
  | 'basicUpperLip'
  | 'softTissueChin'
  | 'snaAngle'
  | 'aNPerp'
  | 'maxSizeAnsPns'
  | 'maxEffectiveLength'
  | 'maxPlacementSInfPtmNf'
  | 'maxilla1aNl'
  | 'snbAngle'
  | 'pogNPerp'
  | 'facialAngle'
  | 'mandCorpusSize'
  | 'mandRamusHeight'
  | 'mandEffectiveLength'
  | 'saddleAngle'
  | 'postCranialBase'
  | 'effectOfGonialAngle'
  | 'ramusOrientation'
  | 'mandibleB1nL'
  | 'chinNPogFh';

export type CephDiscrepancyStageValues = {
  pre: number | '';
  mid: number | '';
  post: number | '';
};

export type CephDiscrepancyParametersMap = Record<
  CephDiscrepancyParameterKey,
  CephDiscrepancyStageValues
>;

export interface CephDiscrepancyAnalysisData {
  parameters?: Partial<CephDiscrepancyParametersMap>;
  conclusion?: string;
  diagnosticConclusion?: string;
  gender?: Gender;
  skeletalClass?: string;
  skeletalClassification?: 'Skeletal Class I' | 'Skeletal Class II' | 'Skeletal Class III' | string;
  severityRating?: 'Mild' | 'Moderate' | 'Severe' | string;
  softTissueInteraction?: 'Matching' | 'Compensating' | 'Aggravating' | string;
  apicalBaseFault?: string;
  softTissueReaction?: string;
  faultLocalization?: {
    maxillaSize?: 'Normal' | 'Excess' | 'Deficient';
    maxillaPlacement?: 'Normal' | 'Anterior / Prognathic' | 'Posterior / Retrognathic';
    mandibleSize?: 'Normal' | 'Excess' | 'Deficient';
    mandiblePlacement?: 'Normal' | 'Prognathic' | 'Retrognathic';
    primaryFault?: 'Maxillary' | 'Mandibular' | 'Bi-Maxillary' | 'Harmonious';
  };
}

export type VerticalJawDivergenceParameterKey =
  | 'mandibularEffectiveLength'
  | 'mandibularPlacement'
  | 'saddleAngle'
  | 'postCranialBase'
  | 'effectOfGonialAngle'
  | 'effectOfRamusOrientation'
  | 'midLowerFaceHeightRatio'
  | 'softTissueVerticalProportions'
  | 'snGoGnAngle'
  | 'fmaAngle'
  | 'jarabakRatio'
  | 'bjoerkSum'
  | 'articularAngle'
  | 'upperGonialAngle'
  | 'lowerGonialAngle'
  | 'yAxisNsGfa'
  | 'yAxisFhSGn'
  | 'ramusHeightArGo'
  | 'compensatedByRamusHeight'
  | 'basalPlaneAngle'
  | 'occlusalPlaneToNf'
  | 'occlusalPlaneToMp'
  | 'vertMaxPlacementNToAns'
  | 'nasionToAns'
  | 'maxillaryRotation';

export type VerticalJawDivergenceStageValues = {
  pre: number | '';
  mid: number | '';
  post: number | '';
};

export type VerticalJawDivergenceParametersMap = Record<
  VerticalJawDivergenceParameterKey,
  VerticalJawDivergenceStageValues
>;

export interface VerticalJawDivergenceAnalysisData {
  parameters?: Partial<VerticalJawDivergenceParametersMap>;
  conclusion?: string;
  divergencePattern?: string;
  rotationTendency?: string;
  divergenceOfJawBases?: string;
  jawFaultLocalization?: string;
}

export interface SagittalVerticalStageValues {
  preRx?: string | number;
  pGrMod?: string | number;
  preIII?: string | number;
  postRx?: string | number;
  retention?: string | number;
  change?: string | number;
}

export interface SagittalVerticalTable1Data {
  sagittalUnaffectedByVertical?: SagittalVerticalStageValues;
  sagittalCausedByVertical?: SagittalVerticalStageValues;
  sagittalWorsenedByVertical?: SagittalVerticalStageValues;
  sagittalCompensatedByVertical?: SagittalVerticalStageValues;
}

export interface UpperIncisorExposureTable2Data {
  uiExposureRest?: SagittalVerticalStageValues;
  uiExposureSmile?: SagittalVerticalStageValues;
  ansToIncisor?: SagittalVerticalStageValues;
  uLipLength?: SagittalVerticalStageValues;
}

export interface SagittalVerticalInteractionAnalysisData {
  table1Interaction?: SagittalVerticalTable1Data;
  table2UpperIncisorExposure?: UpperIncisorExposureTable2Data;
  selectedInteractionCategory?: 'unaffected' | 'caused_by' | 'worsened_by' | 'compensated_by' | '';
  excessExposureInference?: string;
  excessExposureCause?: 'Vertical skeletal excess' | 'Vertical dental excess' | 'Short upper lip' | 'Combination' | 'Normal' | string;
  palatalCortexSupport?: 'Adequate' | 'Intact' | 'Thin Cortex' | 'Dehisced' | 'High Fenestration Risk' | string;
  symphysealCortexSupport?: 'Adequate' | 'Narrow Symphysis' | 'Thin Cortex' | 'Dehisced' | 'Fenestration Risk' | string;
  symphysealCortexLocation?: 'Mandible' | 'Maxilla' | 'Both' | string;
  sagittalAlterationNeeded?: 'Needed' | 'Not Needed' | '';
  verticalAlterationNeeded?: 'Needed' | 'Not Needed' | '';
  skeletalAlterationNeeded?: 'Needed' | 'Not Needed' | '';
  alterationNeededOption?: 'Growth Modulation' | 'Surgical Orthodontics' | '';
  alterationNotNeededOption?: 'Normal Skeletal Relation' | 'Orthodontic Camouflage' | '';
  selectedPathway?: 'Growth Modulation' | 'Surgical Orthodontics' | 'Normal Skeletal Relation' | 'Orthodontic Camouflage' | '';
  growthStatus?: 'Actively Growing' | 'Non-Growing / Adult' | 'Decelerating' | '';
  justification?: string;
  summarySagittal?: string;
  summaryVertical?: string;
}

export type SnFhStageKey = 'pre' | 'mid' | 'post' | 'retention';

export interface SnFhCranialBaseStageMetrics {
  snFhAngle: number | ''; // Measured SN-FH angle (°), Norm: 7.5° (7.0° - 8.0°)
  snLength: number | ''; // Sella-Nasion length (mm), Norm: 71.0mm (F) / 75.0mm (M)
  saddleAngle?: number | ''; // Saddle angle N-S-Ba / N-S-Ar (°), Norm: 130° (123° - 137°)
  measuredSna: number | ''; // Measured SNA (°)
  measuredSnb: number | ''; // Measured SNB (°)
  measuredAnb?: number | ''; // Measured ANB (°)
  measuredSnGoGn: number | ''; // Measured SN-GoGn (°)
  measuredFma?: number | ''; // Measured FMA (°)
  measuredUiSn: number | ''; // Measured U1-SN (°)
  notes?: string;
}

export type SnFhCorrectionStagesMap = {
  pre: SnFhCranialBaseStageMetrics;
  mid: SnFhCranialBaseStageMetrics; // Growth Modulation / Mid-Treatment
  post: SnFhCranialBaseStageMetrics; // Post-Rx
  retention: SnFhCranialBaseStageMetrics; // Retention
};

export interface SnFhCorrectionAnalysisData {
  stages?: Partial<SnFhCorrectionStagesMap>;
  standardNorm?: number; // default 7.5
  clinicalConclusion?: string;
}

export interface RadiographyGrowthSection {
  opgFindings?: string;
  lateralCephFindings?: string;
  iopaFindings?: string;
  handWristFindings?: string;
  occlusalRadFindings?: string;
  otherRadFindings?: string;
  smiStage?: string;
  cvmStage?: string;
  pubertalStatus?: string;
  downsAnalysis?: DownsAnalysisData;
  steinersAnalysis?: SteinersAnalysisData;
  rickettsAnalysis?: RickettsAnalysisData;
  mcnamaraAnalysis?: McnamaraAnalysisData;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  holdawayAnalysis?: HoldawayAnalysisData;
  cogsAnalysis?: CogsAnalysisData;
  cogsSoftTissueAnalysis?: CogsSoftTissueAnalysisData;
  cephDiscrepancyAnalysis?: CephDiscrepancyAnalysisData;
  verticalJawDivergenceAnalysis?: VerticalJawDivergenceAnalysisData;
  sagittalVerticalInteractionAnalysis?: SagittalVerticalInteractionAnalysisData;
  snFhCorrectionAnalysis?: SnFhCorrectionAnalysisData;
  comprehensiveCephAnalysis?: any;
}

export interface InvestigationImage {
  id: string;
  category: 'Extraoral Photo' | 'Intraoral Photo' | 'OPG' | 'Lateral Ceph' | 'Hand Wrist' | 'IOPA' | 'Occlusal' | 'CBCT' | 'Models/Scans';
  title: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface Investigations {
  images: InvestigationImage[];
  cephalometricSummary?: string;
  modelAnalysisSummary?: string;
  opgNotes?: string;
}

export interface ModelAnalysisSection {
  maxillaryArchShape?: ArchShape;
  mandibularArchShape?: ArchShape;
  archSymmetry?: FacialSymmetry;
  archAlignment?: ArchAlignment;
  individualIrregularities?: string;
  
  // FDI Tooth Widths (mm)
  toothWidths: Record<string, number | ''>;
  
  // Arch Length Perimeter inputs
  maxillaryArchLengthAvailable?: number | '';
  mandibularArchLengthAvailable?: number | '';
  totalToothMaterialMm?: number | '';
  
  // Ashley Howe Inputs
  premolarDiameter?: number | '';
  premolarBasalArchWidth?: number | '';
  
  // Ponts Inputs
  measuredPremolarWidth?: number | '';
  measuredMolarWidth?: number | '';
}

export interface StudentTreatmentPlan {
  treatmentModality: string;
  growthModification: string;
  extractionDecision: string;
  applianceSelection: string;
  anchoragePlanning: string;
  biomechanics: string;
  treatmentSequence: string;
  elastics: string;
  tadRequirement: string;
  expansionPlan: string;
  surgicalPlan: string;
  retentionPlan: string;
  estimatedDuration: string;
  prognosis: string;
  patientInstructions: string;
  referencesJustification?: string;
  // Proffit-Based Format fields
  treatmentObjectives?: string;
  phase1AlignmentLeveling?: string;
  phase2MolarSpaceClosure?: string;
  phase3FinishingDetailing?: string;
  retentionPhase?: string;
}

export type UserRole = 'STUDENT' | 'HOD_FACULTY';
export type AppUserRole = 'STUDENT' | 'STAFF_GUIDE' | 'HOD';

export interface UserAccount {
  id: string;
  name: string;
  role: AppUserRole;
  email: string;
  designation: string;
  rollNumber?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStudentIds?: string[];
  institution: string;
  department: string;
  authProvider?: 'google' | 'institutional' | 'custom';
  avatarUrl?: string;
  googleSubId?: string;
  lastAuthenticatedAt?: string;
}

export type FeedbackChip = 'Needs Revision' | 'Approved' | 'Clarify Detail' | 'General Comment';

export interface SectionFeedback {
  sectionId: string;
  sectionTitle: string;
  status: 'Approved' | 'Needs Revision' | 'Clarify Detail' | 'Pending';
  chip?: FeedbackChip;
  comment: string;
  updatedAt: string;
  updatedBy: string;
}

export interface IngestionSettings {
  deptEmail: string;
  enableAutoImport: boolean;
  autoParseMalocclusion: boolean;
  defaultQueueStatus: 'Pending Review' | 'Pending Staff Approval' | 'Pending HOD Approval';
  enableEmailNotifications: boolean;
}

export interface GoogleDriveFolder {
  folderId: string;
  folderName: string;
  folderUrl: string;
  syncedToSharedDrive: boolean;
  sharedDriveName?: string;
  lastSyncTime?: string;
  filesCount?: number;
}

export interface DepartmentConfig {
  driveFolderUrl: string;
  driveFolderId: string;
  updatedAt: string;
  updatedBy: string;
}

export type MalocclusionCategory =
  | 'Class I Bimaxillary'
  | 'Class II Div 1'
  | 'Class II Div 2'
  | 'Class III'
  | 'Open Bite'
  | 'Crossbite'
  | 'Deep Bite';

export type ApprovalStatus =
  | 'DRAFT'
  | 'PENDING_STAFF'
  | 'REVISION_REQUESTED'
  | 'PENDING_HOD'
  | 'APPROVED'
  | 'Draft'
  | 'Pending Staff Approval'
  | 'Returned for Corrections'
  | 'Pending HOD Approval'
  | 'HOD Approved'
  | 'Rejected';

export interface FeedbackHistoryEntry {
  id: string;
  role: 'STUDENT' | 'STAFF' | 'HOD';
  authorName: string;
  comment: string;
  timestamp: string;
  statusAction: 'PENDING_STAFF' | 'REVISION_REQUESTED' | 'PENDING_HOD' | 'APPROVED' | string;
}

export type ApprovalRole = 'student' | 'staff' | 'hod';

export interface ApprovalAuditEntry {
  id: string;
  action: string;
  actorName: string;
  actorRole: ApprovalRole;
  timestamp: string;
  comments?: string;
  statusAfter: ApprovalStatus;
}

export interface DiagnosisAndPlan {
  provisionalDiagnosis: string;
  skeletalClassification: string;
  dentalClassification: string;
  softTissueNotes: string;
  treatmentObjectives: string;
  proposedAppliance: string;
  extractionPlan: 'Non-Extraction' | 'All 1st Premolars' | 'Upper 1st, Lower 2nd' | 'Asymmetric' | 'Other';
  retentionPlan: string;
}

export interface CaseSectionStatus {
  history: boolean;
  extraoralProfile: boolean;
  functionalTmj: boolean;
  intraoral: boolean;
  radiographyGrowth: boolean;
  modelAnalysis: boolean;
  cephalometricAnalysis?: boolean;
  overallPercentage: number;
}

export interface TreatmentPlanItem {
  id: string;
  planNumber: number;
  title: string;
  author: string;
  dateTime: string;
  versionNumber: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Revision Required';
  isApprovedFinal?: boolean;
  isCollapsed?: boolean;

  // Main Writing Area
  fullTextPlan: string;

  // Structured Phases
  phase1PreTreatment: string;
  phase2ActiveOrtho: string;
  phase3Retention: string;

  // Additional Sections
  treatmentObjectives: string;
  alternativePlan: string;
  patientInstructionsConsent: string;
}

export interface StudentDiagnosisFields {
  skeletalAnteroposterior: string;
  skeletalVertical: string;
  skeletalTransverse: string;
  dentalMolarCanine: string;
  dentalOverjetOverbite: string;
  dentalAlignmentDiscrepancy: string;
  softTissueProfileAesthetics: string;
  softTissueLipCompetency: string;
  synthesizedParagraph?: string;
}

export interface CephPlaneResult {
  id: string;
  name: string;
  abbreviation: string;
  startLandmarkId: string;
  endLandmarkId: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  angleDegrees: number;
  lengthPx: number;
  lengthMm: number;
  equation: { a: number; b: number; c: number };
  color: string;
}

export interface CephAngleResult {
  id: string;
  name: string;
  valueDegrees: number;
  normalRange: string;
  interpretation: string;
}

export interface CephLinearResult {
  id: string;
  name: string;
  valueMm: number;
  normalRange: string;
  interpretation: string;
}

export interface CephGeometryEngineData {
  planes: CephPlaneResult[];
  angles: CephAngleResult[];
  linears: CephLinearResult[];
  calculatedAt: string;
}

export interface CephLandmarkModuleData {
  originalImage?: string;
  uploadedAt?: string;
  calibration?: {
    scalePixelsPerMm?: number;
    rulerLengthMm?: number;
    point1?: { x: number; y: number };
    point2?: { x: number; y: number };
    completed?: boolean;
  };
  landmarks?: Record<string, { x: number; y: number }>;
  geometryData?: CephGeometryEngineData;
  currentStep?: 'upload' | 'calibration' | 'identification' | 'review' | 'geometry' | 'completed';
}

export interface PatientRecord {
  id: string;
  patientId: string;
  name: string;
  age: number | string;
  gender: Gender;
  examDate: string;
  contact: string;
  email?: string;
  address?: string;
  archived: boolean;
  createdAt: string;
  updatedAt: string;

  // Case History Sections
  chiefComplaint: ChiefComplaint;
  medicalHistory: MedicalHistory;
  dentalHistory: DentalHistory;
  habitHistory: HabitHistory;
  
  historySection?: HistorySection;
  extraoralProfile?: ExtraoralProfileSection;
  extraoralPhotos?: ExtraoralPhotos;
  extraoralPhotoAnalysis?: ExtraoralPhotoAnalysis;
  smileAssessment?: SmileAssessmentData;
  functionalTmj?: FunctionalTmjSection;
  intraoralSection?: IntraoralExamSection;
  intraoralPhotos?: IntraoralPhotos;
  radiographyGrowth?: RadiographyGrowthSection;
  snFhCorrectionAnalysis?: SnFhCorrectionAnalysisData;
  modelAnalysis?: ModelAnalysisSection;
  comprehensiveCephAnalysis?: any;

  // Legacy fallback fields for backward compatibility
  extraoralExam?: any;
  intraoralExam?: any;
  functionalExam?: any;

  investigations: Investigations;
  diagnosisAndPlan: DiagnosisAndPlan;
  completionStatus: CaseSectionStatus;

  // Student Treatment Plan & Faculty Approval Workflow
  studentTreatmentPlan?: StudentTreatmentPlan;
  treatmentPlans?: StudentTreatmentPlan[];
  treatmentPlanItems?: TreatmentPlanItem[];
  activePlanIndex?: number;
  studentDiagnosis?: StudentDiagnosisFields;
  studentOwnerId?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedHodId?: string;
  approvalStatus?: ApprovalStatus;
  approvalHistory?: ApprovalAuditEntry[];
  studentSubmissionDate?: string;
  staffReviewerName?: string;
  staffComments?: string;
  staffApprovalDate?: string;
  hodReviewerName?: string;
  hodComments?: string;
  hodApprovalDate?: string;
  isLocked?: boolean;

  // HOD / Faculty Review & Google Drive Sync
  sectionFeedbacks?: Record<string, SectionFeedback>;
  driveFolder?: GoogleDriveFolder;
  driveFileUrl?: string;
  feedbackHistory?: FeedbackHistoryEntry[];
  malocclusionCategory?: MalocclusionCategory | string;
  facultyDecision?: 'Approved' | 'Revision Requested' | 'Rejected' | 'Pending Review';
  facultyDecisionNote?: string;

  // Auto-Ingested PDF Metadata
  isAutoIngested?: boolean;
  ingestedPdfName?: string;
  sourceEmail?: string;
  ingestionDate?: string;

  // OrthoCase 3.0 Cephalometric Landmark Identification Module
  cephLandmarkModuleData?: CephLandmarkModuleData;

  // Module 8: Dental Visual Treatment Objective (VTO)
  dentalVto?: import('./types/dentalVto').DentalVTOData;

  // Module 9: Bonwill-Hawley CAD Arch Predetermination
  bonwillTemplate?: BonwillTemplateData;
}

export interface StudentProfile {
  studentName: string;
  rollNumber: string;
  institution: string;
  department: string;
  academicYear: string;
  supervisorName: string;
}

export type ActiveTab = 'home' | 'patients' | 'students' | 'analytics' | 'settings' | 'form' | 'reports' | 'bonwill' | 'review';

export type ArchFormType = 'Ovoid' | 'Tapered' | 'Square' | 'Custom';
export type ArchJawType = 'Maxillary' | 'Mandibular';

export interface Point2D {
  x: number;
  y: number;
}

export interface ArchLandmarks {
  incisalMidpoint: Point2D;          // 1. Incisal midpoint
  canineRight: Point2D;              // 2. Right canine cusp tip
  canineLeft: Point2D;               // 3. Left canine cusp tip
  premolar1Right: Point2D;           // 4. Right 1st premolar buccal cusp
  premolar1Left: Point2D;            // 5. Left 1st premolar buccal cusp
  premolar2Right: Point2D;           // 6. Right 2nd premolar buccal cusp
  premolar2Left: Point2D;            // 7. Left 2nd premolar buccal cusp
  molar1Right: Point2D;              // 8. Right 1st molar mesiobuccal cusp
  molar1Left: Point2D;               // 9. Left 1st molar mesiobuccal cusp
  molar2Right?: Point2D;             // 10. (Optional) Right 2nd molar mesiobuccal cusp
  molar2Left?: Point2D;              // 11. (Optional) Left 2nd molar mesiobuccal cusp
  includeSecondMolars?: boolean;     // Whether 2nd molars are included in spline calculation
}

export interface BonwillLandmarks extends ArchLandmarks {
  molarRight: Point2D;
  molarLeft: Point2D;
  triangleApex: Point2D;
  triangleBaseRight: Point2D;
  triangleBaseLeft: Point2D;
}

export interface ToothWidthsAnterior {
  lr3: number; // Right Canine (LR3)
  lr2: number; // Right Lateral Incisor (LR2)
  lr1: number; // Right Central Incisor (LR1)
  ll1: number; // Left Central Incisor (LL1)
  ll2: number; // Left Lateral Incisor (LL2)
  ll3: number; // Left Canine (LL3)
}

export interface BonwillTemplateData {
  patientName: string;
  patientId: string;
  archType: ArchJawType;
  archForm: ArchFormType;
  clinicianName: string;
  date: string;
  // Primary Hawley Method B Inputs
  sumOfAnteriors: number;            // MD Sum from distal of LR3 to distal of LL3 in mm (e.g., 42.0)
  bracketAllowance: number;          // Total Bracket Allowance Offset in mm (Default: 3.0 mm)
  toothWidthsAnterior: ToothWidthsAnterior;
  // Display Options
  showGrid: boolean;
  showConstructionLines: boolean;
  showMeasurementLabels: boolean;
  showCoordinates: boolean;
  showArcFill: boolean;
  themeMode: 'dark' | 'light';
  // Legacy / fallback fields
  landmarks?: ArchLandmarks;
}

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type NotificationType =
  | 'CASE_SUBMITTED'
  | 'STAFF_APPROVED'
  | 'STAFF_REVISION'
  | 'STAFF_REJECTED'
  | 'HOD_APPROVED'
  | 'HOD_REVISION'
  | 'HOD_REJECTED'
  | 'COMMENT_ADDED'
  | 'CASE_REOPENED'
  | 'FORWARDED_TO_HOD'
  | 'OVERDUE_REVIEW'
  | 'REMINDER_RESUBMIT';

export interface NotificationAuditLog {
  createdAt: string;
  deliveredAt?: string;
  readAt?: string;
  dismissedAt?: string;
  deletedAt?: string;
}

export interface NotificationItem {
  id: string;
  patientId: string;
  patientName: string;
  patientRecordId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  targetUserId: string;
  targetRole?: AppUserRole;
  senderUserId?: string;
  senderName?: string;
  senderRole?: AppUserRole;
  sectionId?: string;
  commentId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  threadKey?: string;
  auditLog: NotificationAuditLog;
}
