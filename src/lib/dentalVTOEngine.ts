import {
  CurrentDentalStatus,
  DesiredDentalObjective,
  ToothMovementItem,
  ArchToothMovements,
  SpaceBudget,
  SpaceRequirementsBreakdown,
  SpaceAvailableBreakdown,
  AnchorageDemandLevel,
  AnchorageAnalysisData,
  TreatmentMechanicsData,
  VTOConsistencyResult,
  ConsistencyCheckItem,
  VTOWhatIfParams,
  DentalVTOData,
} from '../types/dentalVto';

// -------------------------------------------------------------
// DEFAULT INITIALIZATION FACTORIES
// -------------------------------------------------------------

export const createDefaultCurrentStatus = (): CurrentDentalStatus => ({
  molarRelationRight: 'Class I',
  molarRelationLeft: 'Class I',
  canineRelationRight: 'Class I',
  canineRelationLeft: 'Class I',
  overjetMm: 3.0,
  upperMidlineDevMm: 0,
  lowerMidlineDevMm: 0,
  overbiteMm: 2.5,
  curveOfSpeeMm: 1.5,
  biteStatus: 'Normal',
  upperCrowdingMm: 0,
  upperSpacingMm: 0,
  lowerCrowdingMm: 0,
  lowerSpacingMm: 0,
  u1SnDeg: 102,
  u1NaDeg: 22,
  u1NaMm: 4.0,
  impaDeg: 95,
  l1NbDeg: 25,
  l1NbMm: 4.0,
});

export const createDefaultDesiredObjective = (): DesiredDentalObjective => ({
  molarRelation: 'Class I',
  canineRelation: 'Class I',
  overjetMm: 2.5,
  overbiteMm: 2.0,
  upperMidlineDevMm: 0,
  lowerMidlineDevMm: 0,
  u1SnDeg: 102,
  u1NaDeg: 22,
  u1NaMm: 4.0,
  impaDeg: 95,
  l1NbDeg: 25,
  l1NbMm: 4.0,
});

export const createDefaultWhatIfParams = (): VTOWhatIfParams => ({
  extractionsEnabled: false,
  iprMm: 0,
  distalizationMm: 0,
  expansionMm: 0,
});

export const createDefaultDentalVTOData = (): DentalVTOData => ({
  currentStatus: createDefaultCurrentStatus(),
  desiredObjective: createDefaultDesiredObjective(),
  whatIfParams: createDefaultWhatIfParams(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// -------------------------------------------------------------
// TOOTH CODES & LABELS (FDI Notation)
// -------------------------------------------------------------
export const MAXILLARY_TEETH = [16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26];
export const MANDIBULAR_TEETH = [46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36];

export const TOOTH_LABELS: Record<number, string> = {
  16: 'UR6', 15: 'UR5', 14: 'UR4', 13: 'UR3', 12: 'UR2', 11: 'UR1',
  21: 'UL1', 22: 'UL2', 23: 'UL3', 24: 'UL4', 25: 'UL5', 26: 'UL6',
  46: 'LR6', 45: 'LR5', 44: 'LR4', 43: 'LR3', 42: 'LR2', 41: 'LR1',
  31: 'LL1', 32: 'LL2', 33: 'LL3', 34: 'LL4', 35: 'LL5', 36: 'LL6',
};

// -------------------------------------------------------------
// 1. INCISOR OBJECTIVE DIFFERENCE CALCULATOR
// -------------------------------------------------------------
export interface IncisorObjectiveDifferences {
  deltaU1NaMm: number;
  deltaU1NaDeg: number;
  deltaU1SnDeg: number;
  deltaImpaDeg: number;
  deltaL1NbMm: number;
  deltaL1NbDeg: number;
  deltaOverjetMm: number;
  deltaOverbiteMm: number;
  u1Direction: 'Retraction' | 'Advancement' | 'Maintain';
  l1Direction: 'Retraction' | 'Advancement' | 'Maintain';
}

export const calculateIncisorDifferences = (
  curr: CurrentDentalStatus,
  target: DesiredDentalObjective
): IncisorObjectiveDifferences => {
  const hasU1NaMm = typeof curr.u1NaMm === 'number' && !isNaN(curr.u1NaMm) && typeof target.u1NaMm === 'number' && !isNaN(target.u1NaMm);
  const deltaU1NaMm = hasU1NaMm ? Number(((target.u1NaMm as number) - (curr.u1NaMm as number)).toFixed(1)) : 0;

  const hasU1NaDeg = typeof curr.u1NaDeg === 'number' && !isNaN(curr.u1NaDeg) && typeof target.u1NaDeg === 'number' && !isNaN(target.u1NaDeg);
  const deltaU1NaDeg = hasU1NaDeg ? Number(((target.u1NaDeg as number) - (curr.u1NaDeg as number)).toFixed(1)) : 0;

  const hasU1SnDeg = typeof curr.u1SnDeg === 'number' && !isNaN(curr.u1SnDeg) && typeof target.u1SnDeg === 'number' && !isNaN(target.u1SnDeg);
  const deltaU1SnDeg = hasU1SnDeg ? Number(((target.u1SnDeg as number) - (curr.u1SnDeg as number)).toFixed(1)) : 0;

  const hasImpaDeg = typeof curr.impaDeg === 'number' && !isNaN(curr.impaDeg) && typeof target.impaDeg === 'number' && !isNaN(target.impaDeg);
  const deltaImpaDeg = hasImpaDeg ? Number(((target.impaDeg as number) - (curr.impaDeg as number)).toFixed(1)) : 0;

  const hasL1NbMm = typeof curr.l1NbMm === 'number' && !isNaN(curr.l1NbMm) && typeof target.l1NbMm === 'number' && !isNaN(target.l1NbMm);
  const deltaL1NbMm = hasL1NbMm ? Number(((target.l1NbMm as number) - (curr.l1NbMm as number)).toFixed(1)) : 0;

  const hasL1NbDeg = typeof curr.l1NbDeg === 'number' && !isNaN(curr.l1NbDeg) && typeof target.l1NbDeg === 'number' && !isNaN(target.l1NbDeg);
  const deltaL1NbDeg = hasL1NbDeg ? Number(((target.l1NbDeg as number) - (curr.l1NbDeg as number)).toFixed(1)) : 0;

  const hasOverjet = typeof curr.overjetMm === 'number' && !isNaN(curr.overjetMm) && typeof target.overjetMm === 'number' && !isNaN(target.overjetMm);
  const deltaOverjetMm = hasOverjet ? Number(((target.overjetMm as number) - (curr.overjetMm as number)).toFixed(1)) : 0;

  const hasOverbite = typeof curr.overbiteMm === 'number' && !isNaN(curr.overbiteMm) && typeof target.overbiteMm === 'number' && !isNaN(target.overbiteMm);
  const deltaOverbiteMm = hasOverbite ? Number(((target.overbiteMm as number) - (curr.overbiteMm as number)).toFixed(1)) : 0;

  const u1Direction = deltaU1NaMm < -0.2 ? 'Retraction' : deltaU1NaMm > 0.2 ? 'Advancement' : 'Maintain';
  const l1Direction = deltaL1NbMm < -0.2 ? 'Retraction' : deltaL1NbMm > 0.2 ? 'Advancement' : 'Maintain';

  return {
    deltaU1NaMm,
    deltaU1NaDeg,
    deltaU1SnDeg,
    deltaImpaDeg,
    deltaL1NbMm,
    deltaL1NbDeg,
    deltaOverjetMm,
    deltaOverbiteMm,
    u1Direction,
    l1Direction,
  };
};

// -------------------------------------------------------------
// 2. SPACE REQUIREMENTS & SPACE AVAILABLE CALCULATOR
// -------------------------------------------------------------
export const calculateSpaceBudget = (
  curr: CurrentDentalStatus,
  target: DesiredDentalObjective,
  mechanics?: TreatmentMechanicsData,
  whatIf?: VTOWhatIfParams
): SpaceBudget => {
  const diffs = calculateIncisorDifferences(curr, target);

  // --- MAXILLARY REQUIREMENTS ---
  const maxCrowding = typeof curr.upperCrowdingMm === 'number' ? Math.max(0, curr.upperCrowdingMm) : 0;
  const maxSpacing = typeof curr.upperSpacingMm === 'number' ? Math.max(0, curr.upperSpacingMm) : 0;
  const netMaxCrowding = Math.max(0, maxCrowding - maxSpacing);

  const currUpperMidline = typeof curr.upperMidlineDevMm === 'number' ? Math.abs(curr.upperMidlineDevMm) : 0;
  const targetUpperMidline = typeof target.upperMidlineDevMm === 'number' ? Math.abs(target.upperMidlineDevMm) : 0;
  const maxMidlineCorrection = Math.max(0, currUpperMidline - targetUpperMidline);

  // Incisor AP space: Every 1mm retraction requires ~2mm of arch perimeter space
  const maxIncisorApReq = diffs.deltaU1NaMm < 0 ? Math.abs(diffs.deltaU1NaMm) * 2.0 : 0;

  const maxReqTotal = Number((netMaxCrowding + maxMidlineCorrection + maxIncisorApReq).toFixed(1));

  const maxRequired: SpaceRequirementsBreakdown = {
    crowdingMm: netMaxCrowding,
    curveOfSpeeMm: 0,
    midlineCorrectionMm: maxMidlineCorrection,
    incisorApCorrectionMm: maxIncisorApReq,
    otherMm: 0,
    totalRequiredMm: maxReqTotal,
  };

  // --- MANDIBULAR REQUIREMENTS ---
  const mandCrowding = typeof curr.lowerCrowdingMm === 'number' ? Math.max(0, curr.lowerCrowdingMm) : 0;
  const mandSpacing = typeof curr.lowerSpacingMm === 'number' ? Math.max(0, curr.lowerSpacingMm) : 0;
  const netMandCrowding = Math.max(0, mandCrowding - mandSpacing);

  // Curve of Spee Leveling (McLaughlin & Bennett rule: ~0.5mm space per mm depth beyond 0.5mm)
  const cosDepth = typeof curr.curveOfSpeeMm === 'number' ? Math.max(0, curr.curveOfSpeeMm) : 0;
  const cosLevelingSpace = cosDepth > 0.5 ? Number(((cosDepth - 0.5) * 0.8).toFixed(1)) : 0;

  const currLowerMidline = typeof curr.lowerMidlineDevMm === 'number' ? Math.abs(curr.lowerMidlineDevMm) : 0;
  const targetLowerMidline = typeof target.lowerMidlineDevMm === 'number' ? Math.abs(target.lowerMidlineDevMm) : 0;
  const mandMidlineCorrection = Math.max(0, currLowerMidline - targetLowerMidline);

  const mandIncisorApReq = diffs.deltaL1NbMm < 0 ? Math.abs(diffs.deltaL1NbMm) * 2.0 : 0;

  const mandReqTotal = Number((netMandCrowding + cosLevelingSpace + mandMidlineCorrection + mandIncisorApReq).toFixed(1));

  const mandRequired: SpaceRequirementsBreakdown = {
    crowdingMm: netMandCrowding,
    curveOfSpeeMm: cosLevelingSpace,
    midlineCorrectionMm: mandMidlineCorrection,
    incisorApCorrectionMm: mandIncisorApReq,
    otherMm: 0,
    totalRequiredMm: mandReqTotal,
  };

  // --- MAXILLARY AVAILABLE ---
  let maxExtractionSpace = 0;
  const upperExtCount = (mechanics?.extractionsUpper || []).length;
  // Premolar extraction = 7.0mm per tooth
  maxExtractionSpace = upperExtCount * 7.0;

  let maxIpr = 0;
  let maxExpansion = 0;
  let maxDistalization = 0;

  if (whatIf) {
    if (whatIf.extractionsEnabled && upperExtCount === 0) {
      maxExtractionSpace = 14.0; // Simulate bilateral 1st premolars (14, 24)
    }
    maxIpr += whatIf.iprMm || 0;
    maxExpansion += (whatIf.expansionMm || 0) * 0.5; // ~0.5mm arch length per 1mm expansion
    maxDistalization += (whatIf.distalizationMm || 0) * 2.0; // bilateral distalization
  }

  const maxAvailTotal = Number((maxExtractionSpace + maxIpr + maxExpansion + maxDistalization).toFixed(1));

  const maxAvailable: SpaceAvailableBreakdown = {
    extractionsMm: maxExtractionSpace,
    iprMm: maxIpr,
    expansionMm: maxExpansion,
    distalizationMm: maxDistalization,
    otherMm: 0,
    totalAvailableMm: maxAvailTotal,
  };

  const maxBalance = Number((maxAvailTotal - maxReqTotal).toFixed(1));
  const maxStatus: 'Surplus' | 'Balanced' | 'Deficit' =
    maxBalance > 0.2 ? 'Surplus' : maxBalance < -0.2 ? 'Deficit' : 'Balanced';

  // --- MANDIBULAR AVAILABLE ---
  let mandExtractionSpace = 0;
  const lowerExtCount = (mechanics?.extractionsLower || []).length;
  mandExtractionSpace = lowerExtCount * 7.0;

  let mandIpr = 0;
  let mandExpansion = 0;
  let mandDistalization = 0;

  if (whatIf) {
    if (whatIf.extractionsEnabled && lowerExtCount === 0) {
      mandExtractionSpace = 14.0; // Simulate bilateral lower premolars (34, 44)
    }
    mandIpr += (whatIf.iprMm || 0) * 0.8;
    mandExpansion += (whatIf.expansionMm || 0) * 0.4;
    mandDistalization += (whatIf.distalizationMm || 0) * 1.5;
  }

  const mandAvailTotal = Number((mandExtractionSpace + mandIpr + mandExpansion + mandDistalization).toFixed(1));

  const mandAvailable: SpaceAvailableBreakdown = {
    extractionsMm: mandExtractionSpace,
    iprMm: mandIpr,
    expansionMm: mandExpansion,
    distalizationMm: mandDistalization,
    otherMm: 0,
    totalAvailableMm: mandAvailTotal,
  };

  const mandBalance = Number((mandAvailTotal - mandReqTotal).toFixed(1));
  const mandStatus: 'Surplus' | 'Balanced' | 'Deficit' =
    mandBalance > 0.2 ? 'Surplus' : mandBalance < -0.2 ? 'Deficit' : 'Balanced';

  return {
    maxillary: {
      required: maxRequired,
      available: maxAvailable,
      balanceMm: maxBalance,
      status: maxStatus,
    },
    mandibular: {
      required: mandRequired,
      available: mandAvailable,
      balanceMm: mandBalance,
      status: mandStatus,
    },
  };
};

// -------------------------------------------------------------
// 3. ANCHORAGE DEMAND CALCULATOR
// -------------------------------------------------------------
export const calculateAnchorageDemand = (
  anteriorRetractionMm: number,
  spaceBudget: SpaceBudget,
  userStrategy?: string
): AnchorageDemandLevel => {
  const absRetraction = Math.abs(anteriorRetractionMm);
  const maxDeficit = Math.abs(Math.min(0, spaceBudget.maxillary.balanceMm));

  if (absRetraction > 6.0 || maxDeficit > 6.0) {
    return 'Very High';
  } else if (absRetraction >= 4.0 || maxDeficit >= 4.0) {
    return 'High';
  } else if (absRetraction >= 2.0 || maxDeficit >= 2.0) {
    return 'Moderate';
  } else {
    return 'Low';
  }
};

// -------------------------------------------------------------
// 4. TOOTH MOVEMENT ENGINE (Deterministic Vectors)
// -------------------------------------------------------------
export const calculateDeterministicToothMovements = (
  curr: CurrentDentalStatus,
  target: DesiredDentalObjective,
  mechanics?: TreatmentMechanicsData,
  manualOverrides?: ArchToothMovements
): ArchToothMovements => {
  const diffs = calculateIncisorDifferences(curr, target);
  const upperExts = new Set(mechanics?.extractionsUpper || []);
  const lowerExts = new Set(mechanics?.extractionsLower || []);

  const upperRetraction = diffs.deltaU1NaMm < 0 ? Math.abs(diffs.deltaU1NaMm) : 0;
  const upperAdvancement = diffs.deltaU1NaMm > 0 ? diffs.deltaU1NaMm : 0;
  const upperTorque = diffs.deltaU1NaDeg;

  const lowerRetraction = diffs.deltaL1NbMm < 0 ? Math.abs(diffs.deltaL1NbMm) : 0;
  const lowerAdvancement = diffs.deltaL1NbMm > 0 ? diffs.deltaL1NbMm : 0;
  const lowerTorque = diffs.deltaImpaDeg;

  const overbiteChange = diffs.deltaOverbiteMm;
  const upperIntrusion = overbiteChange < 0 ? Math.abs(overbiteChange) * 0.6 : 0;
  const lowerIntrusion = overbiteChange < 0 ? Math.abs(overbiteChange) * 0.4 : 0;

  const maxillary: Record<number, ToothMovementItem> = {};
  const mandibular: Record<number, ToothMovementItem> = {};

  // Build Maxillary Movements
  MAXILLARY_TEETH.forEach((t) => {
    const isOverride = manualOverrides?.maxillary?.[t]?.isManualOverride;
    if (isOverride && manualOverrides?.maxillary?.[t]) {
      maxillary[t] = { ...manualOverrides.maxillary[t] };
      return;
    }

    const label = TOOTH_LABELS[t] || `U${t % 10}`;
    const isExtracted = upperExts.has(t);

    let mesial = 0;
    let distal = 0;
    let intrusion = 0;
    let extrusion = 0;
    let angulation = 0;

    if (isExtracted) {
      // Extracted tooth has zero residual movement
      mesial = 0;
      distal = 0;
    } else if (t === 11 || t === 21) {
      // Central Incisors
      distal = upperRetraction;
      mesial = upperAdvancement;
      intrusion = upperIntrusion;
      angulation = upperTorque;
    } else if (t === 12 || t === 22) {
      // Lateral Incisors
      distal = Number((upperRetraction * 0.9).toFixed(1));
      mesial = Number((upperAdvancement * 0.9).toFixed(1));
      intrusion = upperIntrusion;
      angulation = Number((upperTorque * 0.8).toFixed(1));
    } else if (t === 13 || t === 23) {
      // Canines
      distal = Number((upperRetraction * 0.8).toFixed(1));
      mesial = Number((upperAdvancement * 0.8).toFixed(1));
      angulation = Number((upperTorque * 0.5).toFixed(1));
    } else if (t === 14 || t === 24 || t === 15 || t === 25) {
      // Premolars
      if (upperExts.size > 0) {
        mesial = 1.0; // Anchorage loss / space closure
      }
    } else if (t === 16 || t === 26) {
      // First Molars
      if (upperExts.size > 0) {
        mesial = 1.5; // Controlled mesial movement
      }
    }

    maxillary[t] = {
      toothNumber: t,
      label,
      mesialMm: mesial,
      distalMm: distal,
      intrusionMm: intrusion,
      extrusionMm: extrusion,
      angulationDeg: angulation,
      isManualOverride: false,
    };
  });

  // Build Mandibular Movements
  MANDIBULAR_TEETH.forEach((t) => {
    const isOverride = manualOverrides?.mandibular?.[t]?.isManualOverride;
    if (isOverride && manualOverrides?.mandibular?.[t]) {
      mandibular[t] = { ...manualOverrides.mandibular[t] };
      return;
    }

    const label = TOOTH_LABELS[t] || `L${t % 10}`;
    const isExtracted = lowerExts.has(t);

    let mesial = 0;
    let distal = 0;
    let intrusion = 0;
    let extrusion = 0;
    let angulation = 0;

    if (isExtracted) {
      mesial = 0;
      distal = 0;
    } else if (t === 41 || t === 31) {
      // Central Incisors
      distal = lowerRetraction;
      mesial = lowerAdvancement;
      intrusion = lowerIntrusion;
      angulation = lowerTorque;
    } else if (t === 42 || t === 32) {
      // Lateral Incisors
      distal = Number((lowerRetraction * 0.9).toFixed(1));
      mesial = Number((lowerAdvancement * 0.9).toFixed(1));
      intrusion = lowerIntrusion;
      angulation = Number((lowerTorque * 0.8).toFixed(1));
    } else if (t === 43 || t === 33) {
      // Canines
      distal = Number((lowerRetraction * 0.8).toFixed(1));
      mesial = Number((lowerAdvancement * 0.8).toFixed(1));
      angulation = Number((lowerTorque * 0.5).toFixed(1));
    } else if (t === 44 || t === 34 || t === 45 || t === 35) {
      // Premolars
      if (lowerExts.size > 0) {
        mesial = 1.0;
      }
    } else if (t === 46 || t === 36) {
      // First Molars
      if (lowerExts.size > 0) {
        mesial = 1.5;
      }
    }

    mandibular[t] = {
      toothNumber: t,
      label,
      mesialMm: mesial,
      distalMm: distal,
      intrusionMm: intrusion,
      extrusionMm: extrusion,
      angulationDeg: angulation,
      isManualOverride: false,
    };
  });

  return { maxillary, mandibular };
};

// -------------------------------------------------------------
// 5. 9-POINT VTO CONSISTENCY AUDITOR
// -------------------------------------------------------------
export const evaluateVTOConsistency = (vto: DentalVTOData): VTOConsistencyResult => {
  const items: ConsistencyCheckItem[] = [];
  const curr = vto.currentStatus;
  const target = vto.desiredObjective;
  const budget = vto.spaceBudget || calculateSpaceBudget(curr, target, vto.mechanics, vto.whatIfParams);
  const diffs = calculateIncisorDifferences(curr, target);
  const mechanics = vto.mechanics || { selectedMechanics: [], extractionsUpper: [], extractionsLower: [], mechanicsRationale: '' };
  const plan = vto.studentPlan || { narrativePlan: '', extractionDecision: '', anchorageStrategy: '', spaceManagement: '', incisorCorrection: '', molarCanineCorrection: '', finishingObjectives: '' };

  // Rule 1: Incisor Objectives Internal Consistency
  const isU1Consistent =
    (diffs.deltaU1NaMm < 0 && diffs.deltaU1NaDeg <= 0) ||
    (diffs.deltaU1NaMm > 0 && diffs.deltaU1NaDeg >= 0) ||
    Math.abs(diffs.deltaU1NaMm) < 0.5;

  items.push({
    id: 'incisor_objectives',
    title: '1. Incisor Objectives Internal Consistency',
    status: isU1Consistent ? 'consistent' : 'review_required',
    message: isU1Consistent
      ? 'Maxillary & mandibular incisor AP displacement and angular changes are directionally correlated.'
      : 'Incisor linear change (U1-NA mm) opposes angular change (U1-NA °). Verify torque vs translational mechanics.',
  });

  // Rule 2: Space Budget Balance
  const isMaxDeficit = budget.maxillary.balanceMm < -1.5;
  const isMandDeficit = budget.mandibular.balanceMm < -1.5;
  const hasDeficit = isMaxDeficit || isMandDeficit;

  const maxSurplus = budget.maxillary.balanceMm > 2.0;
  const mandSurplus = budget.mandibular.balanceMm > 2.0;
  const hasSignificantSurplus = maxSurplus || mandSurplus;

  let spaceStatus: 'consistent' | 'review_required' | 'inconsistent' = 'consistent';
  let spaceMessage = `Arch space budget is well-balanced (Maxilla: ${budget.maxillary.balanceMm >= 0 ? '+' : ''}${budget.maxillary.balanceMm} mm, Mandible: ${budget.mandibular.balanceMm >= 0 ? '+' : ''}${budget.mandibular.balanceMm} mm).`;

  if (hasDeficit) {
    spaceStatus = (budget.maxillary.balanceMm < -3.0 || budget.mandibular.balanceMm < -3.0) ? 'inconsistent' : 'review_required';
    spaceMessage = `Space deficit detected (Maxilla: ${budget.maxillary.balanceMm} mm, Mandible: ${budget.mandibular.balanceMm} mm). Additional space creation (Extractions/IPR/Expansion) needed to achieve goals.`;
  } else if (hasSignificantSurplus) {
    spaceStatus = 'consistent';
    spaceMessage = `Space surplus available (Maxilla: +${budget.maxillary.balanceMm} mm, Mandible: +${budget.mandibular.balanceMm} mm). Excess extraction space will be absorbed via controlled molar mesialization / anchor loss.`;
  }

  items.push({
    id: 'space_balance',
    title: '2. Space Required vs Management',
    status: spaceStatus,
    message: spaceMessage,
  });

  // Rule 3: Extraction Selection Compatibility
  const hasExts = (mechanics.extractionsUpper.length > 0) || (mechanics.extractionsLower.length > 0);
  const severeCrowding = (typeof curr.upperCrowdingMm === 'number' && curr.upperCrowdingMm > 6.0) ||
                          (typeof curr.lowerCrowdingMm === 'number' && curr.lowerCrowdingMm > 6.0) ||
                          diffs.deltaU1NaMm < -4.0;

  const isExtractionReasonable = (!severeCrowding || hasExts) && (!hasExts || budget.maxillary.available.extractionsMm > 0 || budget.mandibular.available.extractionsMm > 0);

  items.push({
    id: 'extraction_compatibility',
    title: '3. Extraction Space Compatibility',
    status: isExtractionReasonable ? 'consistent' : 'review_required',
    message: isExtractionReasonable
      ? hasExts
        ? `Extraction space (${budget.maxillary.available.extractionsMm}mm upper, ${budget.mandibular.available.extractionsMm}mm lower) is integrated into the space budget.`
        : 'Non-extraction approach is compatible with current crowding and incisor position.'
      : 'Severe crowding (>6mm) or severe retraction planned without extraction space. Review non-extraction boundary.',
  });

  // Rule 4: Planned Tooth Movements vs Stated Goals
  items.push({
    id: 'tooth_movements',
    title: '4. Tooth Movement Vectors vs Stated Goals',
    status: 'consistent',
    message: `Incisor retraction vectors (U1: ${Math.abs(diffs.deltaU1NaMm)}mm, L1: ${Math.abs(diffs.deltaL1NbMm)}mm) reflect the target objective.`,
  });

  // Rule 5: Anchorage Strategy Appropriateness
  const demand = vto.anchorage?.calculatedDemandLevel || calculateAnchorageDemand(diffs.deltaU1NaMm, budget);
  const userStrategy = vto.anchorage?.strategy || 'Conventional';
  const hasSkeletalOrReinforced = userStrategy === 'Skeletal (TADs)' || userStrategy === 'Reinforced' || userStrategy === 'Extraoral (Headgear)';

  const isAnchorageConsistent =
    (demand === 'Low' || demand === 'Moderate') ||
    ((demand === 'High' || demand === 'Very High') && hasSkeletalOrReinforced);

  items.push({
    id: 'anchorage_strategy',
    title: '5. Anchorage Strategy Compatibility',
    status: isAnchorageConsistent ? 'consistent' : 'review_required',
    message: isAnchorageConsistent
      ? `Anchorage strategy (${userStrategy}) matches the ${demand} anchorage demand level.`
      : `Anchorage demand is ${demand}, but strategy is ${userStrategy}. Consider micro-implants / TADs or TPA to prevent anchorage loss.`,
  });

  // Rule 6: Final Overjet Objective
  const targetOj = typeof target.overjetMm === 'number' ? target.overjetMm : 2.5;
  const isOjNormal = targetOj >= 1.5 && targetOj <= 3.5;

  items.push({
    id: 'final_overjet',
    title: '6. Final Overjet Goal Normalcy',
    status: isOjNormal ? 'consistent' : 'review_required',
    message: isOjNormal
      ? `Target overjet (${targetOj} mm) is within normal aesthetic range (1.5 - 3.5 mm).`
      : `Target overjet (${targetOj} mm) is outside standard aesthetic parameters.`,
  });

  // Rule 7: Final Overbite & Leveling
  const targetOb = typeof target.overbiteMm === 'number' ? target.overbiteMm : 2.0;
  const isObNormal = targetOb >= 1.0 && targetOb <= 3.5;

  items.push({
    id: 'final_overbite',
    title: '7. Final Overbite & Leveling Goal',
    status: isObNormal ? 'consistent' : 'review_required',
    message: isObNormal
      ? `Target overbite (${targetOb} mm) provides adequate anterior guidance.`
      : `Target overbite (${targetOb} mm) indicates potential edge-to-edge or deep bite residual.`,
  });

  // Rule 8: Molar and Canine Target Definition
  items.push({
    id: 'molar_canine_goals',
    title: '8. Molar & Canine Sagittal Target',
    status: 'consistent',
    message: `Target occlusion established as ${target.molarRelation} Molar and ${target.canineRelation} Canine.`,
  });

  // Rule 9: Student Treatment Plan Narrative
  const hasNarrative = Boolean(plan.narrativePlan && plan.narrativePlan.trim().length > 15);

  items.push({
    id: 'student_plan',
    title: '9. Student Treatment Plan Completeness',
    status: hasNarrative ? 'consistent' : 'review_required',
    message: hasNarrative
      ? 'Student has provided a written justification and mechanics description.'
      : 'Student treatment plan narrative is empty or incomplete. Please document proposed mechanics and rationale.',
  });

  // Overall status
  const hasInconsistent = items.some((i) => i.status === 'inconsistent');
  const hasReviewReq = items.some((i) => i.status === 'review_required');

  const overallStatus: 'consistent' | 'review_required' | 'inconsistent' =
    hasInconsistent ? 'inconsistent' : hasReviewReq ? 'review_required' : 'consistent';

  const overallSummary =
    overallStatus === 'consistent'
      ? 'Dental VTO is mathematically and educationally consistent with entered objectives.'
      : overallStatus === 'review_required'
      ? 'Review suggested: Several parameters require student justification or refinement.'
      : 'Inconsistency detected: Space deficit or conflicting mechanics detected in the VTO.';

  return {
    overallStatus,
    overallSummary,
    items,
  };
};
