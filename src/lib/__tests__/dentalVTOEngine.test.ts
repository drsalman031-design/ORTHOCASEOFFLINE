import {
  calculateIncisorDifferences,
  calculateSpaceBudget,
  calculateAnchorageDemand,
  calculateDeterministicToothMovements,
  evaluateVTOConsistency,
  createDefaultCurrentStatus,
  createDefaultDesiredObjective,
  createDefaultDentalVTOData,
} from '../dentalVTOEngine';
import { adaptPatientToDentalVTO } from '../dentalVTODataAdapter';
import { PatientRecord } from '../../types';

function runTests() {
  console.log('--- Starting Dental VTO Engine & Adapter Tests ---');

  // Test 1: Incisor differences
  const curr = createDefaultCurrentStatus();
  curr.u1NaMm = 8.0;
  curr.u1NaDeg = 30;
  curr.impaDeg = 90;
  curr.l1NbMm = 2.0;

  const target = createDefaultDesiredObjective();
  target.u1NaMm = 4.0;
  target.u1NaDeg = 22;
  target.impaDeg = 95;
  target.l1NbMm = 4.0;

  const diffs = calculateIncisorDifferences(curr, target);
  console.assert(diffs.deltaU1NaMm === -4.0, `Expected -4.0, got ${diffs.deltaU1NaMm}`);
  console.assert(diffs.deltaU1NaDeg === -8.0, `Expected -8.0, got ${diffs.deltaU1NaDeg}`);
  console.assert(diffs.deltaImpaDeg === 5.0, `Expected 5.0, got ${diffs.deltaImpaDeg}`);
  console.assert(diffs.deltaL1NbMm === 2.0, `Expected 2.0, got ${diffs.deltaL1NbMm}`);
  console.assert(diffs.u1Direction === 'Retraction', `Expected Retraction, got ${diffs.u1Direction}`);
  console.assert(diffs.l1Direction === 'Advancement', `Expected Advancement, got ${diffs.l1Direction}`);
  console.log('✓ Test 1: Incisor Differences passed');

  // Test 2: Space Budget Calculation
  curr.upperCrowdingMm = 4.0;
  curr.curveOfSpeeMm = 2.5;

  const mechanics = {
    selectedMechanics: ['Extraction'],
    extractionsUpper: [14, 24],
    extractionsLower: [34, 44],
    mechanicsRationale: 'Premolar extractions for anterior retraction and crowding resolution',
  };

  const budget = calculateSpaceBudget(curr, target, mechanics);
  console.assert(budget.maxillary.required.totalRequiredMm === 12.0, `Expected 12.0, got ${budget.maxillary.required.totalRequiredMm}`);
  console.assert(budget.maxillary.available.totalAvailableMm === 14.0, `Expected 14.0, got ${budget.maxillary.available.totalAvailableMm}`);
  console.assert(budget.maxillary.balanceMm === 2.0, `Expected 2.0, got ${budget.maxillary.balanceMm}`);
  console.assert(budget.maxillary.status === 'Surplus', `Expected Surplus, got ${budget.maxillary.status}`);
  console.log('✓ Test 2: Space Budget passed');

  // Test 3: Central Data Adapter Auto-Fetch
  const mockPatient: Partial<PatientRecord> = {
    id: 'pt-101',
    patientId: 'ORTHO-2026-001',
    name: 'Sarah Connor',
    age: 21,
    gender: 'Female',
    intraoralSection: {
      buccalOcclusionRight: 'Class II',
      buccalOcclusionLeft: 'Class II',
      canineRelationRight: 'Class II',
      canineRelationLeft: 'Class II',
      overjetMm: 6.5,
      overbiteMm: 4.5,
      curveOfSpeeMm: 3.0,
      midlineUpper: 0,
      midlineLower: 1.0,
    } as any,
    radiographyGrowth: {
      steinersAnalysis: {
        u1NaDeg: 28,
        u1NaMm: 7.5,
        l1NbDeg: 22,
        l1NbMm: 3.0,
      },
      schwarzTweedAnalysis: {
        impa: 88,
      },
    } as any,
    modelAnalysis: {
      archAlignment: 'Crowding Present in Upper and Lower Arch',
    } as any,
  };

  const adapted = adaptPatientToDentalVTO(mockPatient as PatientRecord);
  console.assert(adapted.status.overjetMm === 6.5, `Expected 6.5, got ${adapted.status.overjetMm}`);
  console.assert(adapted.status.u1NaDeg === 28, `Expected 28, got ${adapted.status.u1NaDeg}`);
  console.assert(adapted.status.u1NaMm === 7.5, `Expected 7.5, got ${adapted.status.u1NaMm}`);
  console.assert(adapted.status.impaDeg === 88, `Expected 88, got ${adapted.status.impaDeg}`);
  console.assert(adapted.provenanceMap.overjetMm === 'auto-filled', 'Expected overjet to be auto-filled');
  console.assert(adapted.provenanceMap.u1NaMm === 'auto-filled', 'Expected u1NaMm to be auto-filled');
  console.assert(adapted.summary.autoFilledCount >= 10, `Expected >= 10 auto-filled, got ${adapted.summary.autoFilledCount}`);
  console.log(`✓ Test 3: Central Data Adapter Auto-Fetch passed (${adapted.summary.autoFilledCount} fields auto-filled)`);

  // Test 4: Student Manual Override Tracking
  const overrides = new Set(['overjetMm']);
  const modifiedStatus = { ...adapted.status, overjetMm: 8.0 };
  const adaptedWithOverride = adaptPatientToDentalVTO(mockPatient as PatientRecord, modifiedStatus, overrides);
  console.assert(adaptedWithOverride.status.overjetMm === 8.0, `Expected 8.0, got ${adaptedWithOverride.status.overjetMm}`);
  console.assert(adaptedWithOverride.provenanceMap.overjetMm === 'override', 'Expected overjet to have override provenance');
  console.assert(adaptedWithOverride.summary.overrideCount === 1, `Expected 1 override, got ${adaptedWithOverride.summary.overrideCount}`);
  console.log('✓ Test 4: Student Override Provenance Tracking passed');

  console.log('--- All Dental VTO Engine & Adapter Tests Passed with 0 Errors! ---');
}

runTests();
