export type MolarClassification = 'Class I' | 'Class II' | 'Class III' | 'End-on Class II' | 'End-on Class III';
export type CanineClassification = 'Class I' | 'Class II' | 'Class III';
export type BiteStatus = 'Normal' | 'Deep Bite' | 'Open Bite' | 'Edge-to-Edge';
export type AnchorageDemandLevel = 'Low' | 'Moderate' | 'High' | 'Very High';
export type AnchorageStrategyType = 'Conventional' | 'Reinforced' | 'Skeletal (TADs)' | 'Extraoral (Headgear)' | 'Other';
export type ConsistencyStatus = 'consistent' | 'review_required' | 'inconsistent';

export interface CurrentDentalStatus {
  // Sagittal
  molarRelationRight: MolarClassification;
  molarRelationLeft: MolarClassification;
  canineRelationRight: CanineClassification;
  canineRelationLeft: CanineClassification;
  overjetMm: number | '';
  upperMidlineDevMm: number | ''; // positive = right, negative = left
  lowerMidlineDevMm: number | '';

  // Vertical
  overbiteMm: number | '';
  curveOfSpeeMm: number | '';
  biteStatus: BiteStatus;

  // Space
  upperCrowdingMm: number | '';
  upperSpacingMm: number | '';
  lowerCrowdingMm: number | '';
  lowerSpacingMm: number | '';

  // Incisors
  u1SnDeg: number | '';
  u1NaDeg: number | '';
  u1NaMm: number | '';
  impaDeg: number | '';
  l1NbDeg: number | '';
  l1NbMm: number | '';
}

export interface DesiredDentalObjective {
  // Sagittal
  molarRelation: MolarClassification;
  canineRelation: CanineClassification;
  overjetMm: number | '';
  overbiteMm: number | '';
  upperMidlineDevMm: number | '';
  lowerMidlineDevMm: number | '';

  // Maxillary Incisor
  u1SnDeg: number | '';
  u1NaDeg: number | '';
  u1NaMm: number | '';

  // Mandibular Incisor
  impaDeg: number | '';
  l1NbDeg: number | '';
  l1NbMm: number | '';
}

export interface ToothMovementItem {
  toothNumber: number; // FDI notation, e.g. 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26
  label: string; // e.g. 'U6', 'U1', 'L1', 'L6'
  mesialMm: number; // positive = mesial
  distalMm: number; // positive = distal
  intrusionMm: number;
  extrusionMm: number;
  angulationDeg: number; // positive = mesial tip, negative = distal tip
  isManualOverride?: boolean;
}

export interface ArchToothMovements {
  maxillary: Record<number, ToothMovementItem>;
  mandibular: Record<number, ToothMovementItem>;
}

export interface SpaceRequirementsBreakdown {
  crowdingMm: number;
  curveOfSpeeMm: number;
  midlineCorrectionMm: number;
  incisorApCorrectionMm: number;
  otherMm: number;
  totalRequiredMm: number;
}

export interface SpaceAvailableBreakdown {
  extractionsMm: number;
  iprMm: number;
  expansionMm: number;
  distalizationMm: number;
  otherMm: number;
  totalAvailableMm: number;
}

export interface SpaceBudget {
  maxillary: {
    required: SpaceRequirementsBreakdown;
    available: SpaceAvailableBreakdown;
    balanceMm: number;
    status: 'Surplus' | 'Balanced' | 'Deficit';
  };
  mandibular: {
    required: SpaceRequirementsBreakdown;
    available: SpaceAvailableBreakdown;
    balanceMm: number;
    status: 'Surplus' | 'Balanced' | 'Deficit';
  };
}

export interface AnchorageAnalysisData {
  anteriorRetractionMm: number;
  allowedPosteriorMesialMm: number;
  calculatedDemandLevel: AnchorageDemandLevel;
  strategy: AnchorageStrategyType;
  justification: string;
}

export interface TreatmentMechanicsData {
  selectedMechanics: string[]; // e.g. ['Alignment', 'Leveling', 'IPR', 'Extraction', 'TADs']
  extractionsUpper: number[]; // e.g. [14, 24]
  extractionsLower: number[]; // e.g. [34, 44]
  mechanicsRationale: string;
}

export interface StudentTreatmentPlanData {
  narrativePlan: string;
  extractionDecision: string;
  anchorageStrategy: string;
  spaceManagement: string;
  incisorCorrection: string;
  molarCanineCorrection: string;
  finishingObjectives: string;
}

export interface ConsistencyCheckItem {
  id: string;
  title: string;
  status: ConsistencyStatus;
  message: string;
  details?: string;
}

export interface VTOConsistencyResult {
  overallStatus: ConsistencyStatus;
  overallSummary: string;
  items: ConsistencyCheckItem[];
}

export interface VTOWhatIfParams {
  extractionsEnabled: boolean;
  iprMm: number;
  distalizationMm: number;
  expansionMm: number;
}

export interface DentalVTOData {
  currentStatus: CurrentDentalStatus;
  desiredObjective: DesiredDentalObjective;
  toothMovements?: ArchToothMovements;
  spaceBudget?: SpaceBudget;
  anchorage?: AnchorageAnalysisData;
  mechanics?: TreatmentMechanicsData;
  studentPlan?: StudentTreatmentPlanData;
  whatIfParams?: VTOWhatIfParams;
  facultyReview?: {
    status?: 'Pending' | 'Approved' | 'Revision Requested';
    facultyName?: string;
    comments?: string;
    reviewDate?: string;
  };
  createdAt?: string;
  updatedAt?: string;
}
