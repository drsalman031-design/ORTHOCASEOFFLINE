import type { PatientRecord } from '../types';
import {
  CurrentDentalStatus,
  MolarClassification,
  CanineClassification,
  BiteStatus,
} from '../types/dentalVto';
import { createDefaultCurrentStatus } from './dentalVTOEngine';

export type FieldProvenance = 'auto-filled' | 'missing' | 'override';

export interface FieldMetadata<T> {
  value: T;
  provenance: FieldProvenance;
  sourceModule?: string;
}

export interface AdaptedDentalVTOStatus {
  status: CurrentDentalStatus;
  provenanceMap: Record<keyof CurrentDentalStatus, FieldProvenance>;
  sourceModuleMap: Record<keyof CurrentDentalStatus, string | undefined>;
  summary: {
    autoFilledCount: number;
    missingCount: number;
    overrideCount: number;
    totalFields: number;
  };
}

// -------------------------------------------------------------
// INDIVIDUAL FIELD EXTRACTORS WITH PRIORITY MAPPING
// -------------------------------------------------------------

export function getMolarRelationRight(patient?: PatientRecord | null): { value: MolarClassification; source?: string } | null {
  const intra = patient?.intraoralSection;
  const buccalR = intra?.buccalOcclusionRight;
  if (buccalR) {
    if (buccalR.includes('Class II') || buccalR === 'Class II') return { value: buccalR.includes('End-on') ? 'End-on Class II' : 'Class II', source: 'Intraoral Exam (Right Buccal)' };
    if (buccalR.includes('Class III') || buccalR === 'Class III') return { value: buccalR.includes('End-on') ? 'End-on Class III' : 'Class III', source: 'Intraoral Exam (Right Buccal)' };
    if (buccalR.includes('Class I') || buccalR === 'Class I') return { value: 'Class I', source: 'Intraoral Exam (Right Buccal)' };
  }
  const diag = patient?.diagnosisAndPlan?.dentalClassification;
  if (diag) {
    if (diag.includes('Class II')) return { value: 'Class II', source: 'Diagnosis & Plan' };
    if (diag.includes('Class III')) return { value: 'Class III', source: 'Diagnosis & Plan' };
    if (diag.includes('Class I')) return { value: 'Class I', source: 'Diagnosis & Plan' };
  }
  return null;
}

export function getMolarRelationLeft(patient?: PatientRecord | null): { value: MolarClassification; source?: string } | null {
  const intra = patient?.intraoralSection;
  const buccalL = intra?.buccalOcclusionLeft;
  if (buccalL) {
    if (buccalL.includes('Class II') || buccalL === 'Class II') return { value: buccalL.includes('End-on') ? 'End-on Class II' : 'Class II', source: 'Intraoral Exam (Left Buccal)' };
    if (buccalL.includes('Class III') || buccalL === 'Class III') return { value: buccalL.includes('End-on') ? 'End-on Class III' : 'Class III', source: 'Intraoral Exam (Left Buccal)' };
    if (buccalL.includes('Class I') || buccalL === 'Class I') return { value: 'Class I', source: 'Intraoral Exam (Left Buccal)' };
  }
  const rVal = getMolarRelationRight(patient);
  if (rVal) return { value: rVal.value, source: `${rVal.source} (Bilateral)` };
  return null;
}

export function getCanineRelationRight(patient?: PatientRecord | null): { value: CanineClassification; source?: string } | null {
  const intra = patient?.intraoralSection;
  const cR = intra?.canineRelationRight;
  if (cR) {
    if (cR.includes('Class II')) return { value: 'Class II', source: 'Intraoral Exam (Right Canine)' };
    if (cR.includes('Class III')) return { value: 'Class III', source: 'Intraoral Exam (Right Canine)' };
    if (cR.includes('Class I')) return { value: 'Class I', source: 'Intraoral Exam (Right Canine)' };
  }
  return null;
}

export function getCanineRelationLeft(patient?: PatientRecord | null): { value: CanineClassification; source?: string } | null {
  const intra = patient?.intraoralSection;
  const cL = intra?.canineRelationLeft;
  if (cL) {
    if (cL.includes('Class II')) return { value: 'Class II', source: 'Intraoral Exam (Left Canine)' };
    if (cL.includes('Class III')) return { value: 'Class III', source: 'Intraoral Exam (Left Canine)' };
    if (cL.includes('Class I')) return { value: 'Class I', source: 'Intraoral Exam (Left Canine)' };
  }
  const rVal = getCanineRelationRight(patient);
  if (rVal) return { value: rVal.value, source: `${rVal.source} (Bilateral)` };
  return null;
}

export function getOverjet(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const intra = patient?.intraoralSection;
  if (typeof intra?.overjetMm === 'number' && !isNaN(intra.overjetMm)) {
    return { value: intra.overjetMm, source: 'Intraoral Examination' };
  }
  return null;
}

export function getOverbite(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const intra = patient?.intraoralSection;
  if (typeof intra?.overbiteMm === 'number' && !isNaN(intra.overbiteMm)) {
    return { value: intra.overbiteMm, source: 'Intraoral Examination' };
  }
  return null;
}

export function getUpperMidline(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const intra = patient?.intraoralSection;
  if (typeof intra?.midlineUpper === 'number' && !isNaN(intra.midlineUpper)) {
    return { value: intra.midlineUpper, source: 'Intraoral Examination' };
  }
  const extra = patient?.extraoralProfile;
  if (extra?.maxillaryMidline && extra.maxillaryMidline.toLowerCase().includes('coincident')) {
    return { value: 0, source: 'Extraoral Profile Examination' };
  }
  return null;
}

export function getLowerMidline(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const intra = patient?.intraoralSection;
  if (typeof intra?.midlineLower === 'number' && !isNaN(intra.midlineLower)) {
    return { value: intra.midlineLower, source: 'Intraoral Examination' };
  }
  const extra = patient?.extraoralProfile;
  if (extra?.mandibularMidline && extra.mandibularMidline.toLowerCase().includes('coincident')) {
    return { value: 0, source: 'Extraoral Profile Examination' };
  }
  return null;
}

export function getCurveOfSpee(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const intra = patient?.intraoralSection;
  if (typeof intra?.curveOfSpeeMm === 'number' && !isNaN(intra.curveOfSpeeMm)) {
    return { value: intra.curveOfSpeeMm, source: 'Intraoral Examination' };
  }
  return null;
}

export function getBiteStatus(patient?: PatientRecord | null): { value: BiteStatus; source?: string } | null {
  const intra = patient?.intraoralSection;
  const rel = intra?.incisorRelation;
  if (rel) {
    if (rel.toLowerCase().includes('open')) return { value: 'Open Bite', source: 'Intraoral Exam (Incisor Relation)' };
    if (rel.toLowerCase().includes('deep')) return { value: 'Deep Bite', source: 'Intraoral Exam (Incisor Relation)' };
    if (rel.toLowerCase().includes('edge')) return { value: 'Edge-to-Edge', source: 'Intraoral Exam (Incisor Relation)' };
    if (rel.toLowerCase().includes('class')) return { value: 'Normal', source: 'Intraoral Exam (Incisor Relation)' };
  }
  if (typeof intra?.overbiteMm === 'number') {
    if (intra.overbiteMm > 4) return { value: 'Deep Bite', source: 'Intraoral Exam (Overbite > 4mm)' };
    if (intra.overbiteMm < 0) return { value: 'Open Bite', source: 'Intraoral Exam (Negative Overbite)' };
    return { value: 'Normal', source: 'Intraoral Exam (Normal Overbite)' };
  }
  return null;
}

export function getUpperCrowding(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const model = patient?.modelAnalysis;
  if (model?.archAlignment && model.archAlignment.includes('Crowding')) {
    return { value: 3.5, source: 'Model Analysis (Alignment Findings)' };
  }
  return null;
}

export function getUpperSpacing(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const model = patient?.modelAnalysis;
  if (model?.archAlignment && model.archAlignment.includes('Spacing')) {
    return { value: 2.0, source: 'Model Analysis (Alignment Findings)' };
  }
  return null;
}

export function getLowerCrowding(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const model = patient?.modelAnalysis;
  if (model?.archAlignment && model.archAlignment.includes('Crowding')) {
    return { value: 3.0, source: 'Model Analysis (Alignment Findings)' };
  }
  return null;
}

export function getLowerSpacing(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const model = patient?.modelAnalysis;
  if (model?.archAlignment && model.archAlignment.includes('Spacing')) {
    return { value: 2.0, source: 'Model Analysis (Alignment Findings)' };
  }
  return null;
}

export function getU1SNAngle(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const steiner = patient?.radiographyGrowth?.steinersAnalysis as any;
  if (steiner?.parameters?.upperIncisorToNaDeg?.pre !== undefined && steiner?.parameters?.upperIncisorToNaDeg?.pre !== '') {
    const val = Number(steiner.parameters.upperIncisorToNaDeg.pre);
    if (!isNaN(val)) return { value: val, source: "Steiner's Cephalometric Analysis" };
  }
  return null;
}

export function getU1NAAngle(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const steiner = patient?.radiographyGrowth?.steinersAnalysis as any;
  if (steiner?.parameters?.upperIncisorToNaDeg?.pre !== undefined && steiner?.parameters?.upperIncisorToNaDeg?.pre !== '') {
    const val = Number(steiner.parameters.upperIncisorToNaDeg.pre);
    if (!isNaN(val)) return { value: val, source: "Steiner's Cephalometric Analysis" };
  }
  if (typeof steiner?.u1NaDeg === 'number' && !isNaN(steiner.u1NaDeg)) {
    return { value: steiner.u1NaDeg, source: "Steiner's Cephalometric Analysis" };
  }
  return null;
}

export function getU1NAMm(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const steiner = patient?.radiographyGrowth?.steinersAnalysis as any;
  if (steiner?.parameters?.upperIncisorToNaMm?.pre !== undefined && steiner?.parameters?.upperIncisorToNaMm?.pre !== '') {
    const val = Number(steiner.parameters.upperIncisorToNaMm.pre);
    if (!isNaN(val)) return { value: val, source: "Steiner's Cephalometric Analysis" };
  }
  if (typeof steiner?.u1NaMm === 'number' && !isNaN(steiner.u1NaMm)) {
    return { value: steiner.u1NaMm, source: "Steiner's Cephalometric Analysis" };
  }
  return null;
}

export function getIMPA(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const tweed = patient?.radiographyGrowth?.schwarzTweedAnalysis as any;
  if (tweed?.parameters?.impa?.pre !== undefined && tweed?.parameters?.impa?.pre !== '') {
    const val = Number(tweed.parameters.impa.pre);
    if (!isNaN(val)) return { value: val, source: "Tweed's Cephalometric Analysis" };
  }
  if (typeof tweed?.impa === 'number' && !isNaN(tweed.impa)) {
    return { value: tweed.impa, source: "Tweed's Cephalometric Analysis" };
  }
  return null;
}

export function getL1NBAngle(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const steiner = patient?.radiographyGrowth?.steinersAnalysis as any;
  if (steiner?.parameters?.lowerIncisorToNbDeg?.pre !== undefined && steiner?.parameters?.lowerIncisorToNbDeg?.pre !== '') {
    const val = Number(steiner.parameters.lowerIncisorToNbDeg.pre);
    if (!isNaN(val)) return { value: val, source: "Steiner's Cephalometric Analysis" };
  }
  if (typeof steiner?.l1NbDeg === 'number' && !isNaN(steiner.l1NbDeg)) {
    return { value: steiner.l1NbDeg, source: "Steiner's Cephalometric Analysis" };
  }
  return null;
}

export function getL1NBMm(patient?: PatientRecord | null): { value: number; source?: string } | null {
  const steiner = patient?.radiographyGrowth?.steinersAnalysis as any;
  if (steiner?.parameters?.lowerIncisorToNbMm?.pre !== undefined && steiner?.parameters?.lowerIncisorToNbMm?.pre !== '') {
    const val = Number(steiner.parameters.lowerIncisorToNbMm.pre);
    if (!isNaN(val)) return { value: val, source: "Steiner's Cephalometric Analysis" };
  }
  if (typeof steiner?.l1NbMm === 'number' && !isNaN(steiner.l1NbMm)) {
    return { value: steiner.l1NbMm, source: "Steiner's Cephalometric Analysis" };
  }
  return null;
}

// -------------------------------------------------------------
// CENTRAL ADAPTER AGGREGATOR
// -------------------------------------------------------------

export function adaptPatientToDentalVTO(
  patient?: PatientRecord | null,
  currentVTO?: CurrentDentalStatus,
  userOverrides: Set<string> = new Set()
): AdaptedDentalVTOStatus {
  const fallback = createDefaultCurrentStatus();
  const status: CurrentDentalStatus = { ...fallback };
  const provenanceMap: Record<keyof CurrentDentalStatus, FieldProvenance> = {} as any;
  const sourceModuleMap: Record<keyof CurrentDentalStatus, string | undefined> = {} as any;

  let autoFilledCount = 0;
  let missingCount = 0;
  let overrideCount = 0;

  const processField = <K extends keyof CurrentDentalStatus>(
    key: K,
    extractorResult: { value: CurrentDentalStatus[K]; source?: string } | null,
    defaultValue: CurrentDentalStatus[K]
  ) => {
    // If student explicitly overrode the value
    if (userOverrides.has(key) && currentVTO && currentVTO[key] !== undefined && currentVTO[key] !== '') {
      status[key] = currentVTO[key];
      provenanceMap[key] = 'override';
      sourceModuleMap[key] = 'Post-Graduate Student Override';
      overrideCount++;
      return;
    }

    if (extractorResult && extractorResult.value !== undefined && extractorResult.value !== '') {
      status[key] = extractorResult.value;
      provenanceMap[key] = 'auto-filled';
      sourceModuleMap[key] = extractorResult.source;
      autoFilledCount++;
    } else if (currentVTO && currentVTO[key] !== undefined && currentVTO[key] !== '') {
      status[key] = currentVTO[key];
      provenanceMap[key] = 'auto-filled';
      sourceModuleMap[key] = 'Previously Saved VTO Data';
      autoFilledCount++;
    } else {
      status[key] = defaultValue;
      provenanceMap[key] = 'missing';
      sourceModuleMap[key] = undefined;
      missingCount++;
    }
  };

  processField('molarRelationRight', getMolarRelationRight(patient), 'Class I');
  processField('molarRelationLeft', getMolarRelationLeft(patient), 'Class I');
  processField('canineRelationRight', getCanineRelationRight(patient), 'Class I');
  processField('canineRelationLeft', getCanineRelationLeft(patient), 'Class I');
  processField('overjetMm', getOverjet(patient), '');
  processField('overbiteMm', getOverbite(patient), '');
  processField('upperMidlineDevMm', getUpperMidline(patient), 0);
  processField('lowerMidlineDevMm', getLowerMidline(patient), 0);
  processField('curveOfSpeeMm', getCurveOfSpee(patient), '');
  processField('biteStatus', getBiteStatus(patient), 'Normal');
  processField('upperCrowdingMm', getUpperCrowding(patient), 0);
  processField('upperSpacingMm', getUpperSpacing(patient), 0);
  processField('lowerCrowdingMm', getLowerCrowding(patient), 0);
  processField('lowerSpacingMm', getLowerSpacing(patient), 0);
  processField('u1SnDeg', getU1SNAngle(patient), '');
  processField('u1NaDeg', getU1NAAngle(patient), '');
  processField('u1NaMm', getU1NAMm(patient), '');
  processField('impaDeg', getIMPA(patient), '');
  processField('l1NbDeg', getL1NBAngle(patient), '');
  processField('l1NbMm', getL1NBMm(patient), '');

  const totalFields = Object.keys(status).length;

  return {
    status,
    provenanceMap,
    sourceModuleMap,
    summary: {
      autoFilledCount,
      missingCount,
      overrideCount,
      totalFields,
    },
  };
}
