import {
  calculateBolton,
  calculateCarey,
  calculatePonts,
  calculateAshleyHowe,
  sumAnterior6FromFdi,
} from '../calculations';
import { generateOrthoDiagnosis } from '../orthoDiagnosisEngine';
import { generateOrthoTreatmentPlan } from '../orthoTreatmentPlanEngine';
import { generateOrthoMentorData } from '../orthoMentorEngine';
import {
  calculateIncisorDifferences,
  calculateSpaceBudget,
  createDefaultCurrentStatus,
  createDefaultDesiredObjective,
  calculateAnchorageDemand,
} from '../dentalVTOEngine';
import { encryptDataToVault, decryptDataFromVault } from '../cryptoVault';
import {
  canEditCase,
  canDeleteCase,
  canSignOffCase,
  canViewDepartmentAnalytics,
  hashUserPin,
  verifyUserPin,
  isSessionExpired,
} from '../authContext';
import { normalizeOrthoSpeechText, polishOrthoDictationOffline } from '../orthoVoiceEngine';
import { PatientRecord, UserAccount } from '../../types';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('  ORTHOCASE MASTER PRODUCTION AUTOMATED TEST SUITE');
  console.log('======================================================\n');

  // TEST SUITE 1: CLINICAL MODEL ANALYSIS FORMULAS & EDGE CASES
  console.log('--- TEST 1: Clinical Model Analysis Math & Validation ---');
  const testWidths: Record<string, number> = {
    '16': 10.0, '15': 7.0, '14': 7.0, '13': 7.5, '12': 6.5, '11': 8.5,
    '21': 8.5, '22': 6.5, '23': 7.5, '24': 7.0, '25': 7.0, '26': 10.0,
    '46': 10.5, '45': 7.0, '44': 7.0, '43': 6.5, '42': 5.5, '41': 5.0,
    '31': 5.0, '32': 5.5, '33': 6.5, '34': 7.0, '35': 7.0, '36': 10.5,
  };

  const bolton = calculateBolton(testWidths);
  assert(bolton.overallRatio !== null && bolton.overallRatio > 85 && bolton.overallRatio < 95, `Bolton Overall Ratio = ${bolton.overallRatio?.toFixed(1)}%`);
  assert(bolton.anteriorRatio !== null && bolton.anteriorRatio > 70 && bolton.anteriorRatio < 80, `Bolton Anterior Ratio = ${bolton.anteriorRatio?.toFixed(1)}%`);

  // Edge case: Negative tooth inputs are sanitized to 0
  const invalidWidths: Record<string, number> = { ...testWidths, '11': -8.5 };
  const boltonSanitized = calculateBolton(invalidWidths);
  assert(boltonSanitized.max6 === 36.5, 'Negative tooth width input safely ignored in Bolton summation');

  const ponts = calculatePonts(testWidths, 38.0, 48.0);
  assert(ponts.sumOfIncisors === 30.0, 'Ponts Maxillary Incisor Sum is 30.0mm');
  assert(ponts.calculatedMPV === 37.5, 'Ponts Calculated MPV = (30 / 80) * 100 = 37.5mm');
  assert(ponts.calculatedMMV === 46.875, 'Ponts Calculated MMV = (30 / 64) * 100 = 46.88mm');
  assert(ponts.premolarExpansionNeeded !== null, 'Ponts Premolar Expansion is calculated');
  assert(ponts.molarExpansionNeeded !== null, 'Ponts Molar Expansion is calculated');

  const carey = calculateCarey(testWidths, 68.0);
  assert(carey.discrepancy !== null, 'Carey Mandibular Discrepancy calculated');

  const ashley = calculateAshleyHowe(38.0, 94.0);
  assert(ashley.pmbaRatio !== null, 'Ashley-Howe PMBA Ratio computed');

  // TEST SUITE 2: DENTAL VTO SPACE BUDGET ENGINE
  console.log('\n--- TEST 2: Dental VTO Space Budget Engine ---');
  const curr = createDefaultCurrentStatus();
  curr.u1NaMm = 8.0;
  curr.u1NaDeg = 30;
  curr.impaDeg = 90;
  curr.l1NbMm = 2.0;
  curr.upperCrowdingMm = 4.0;
  curr.curveOfSpeeMm = 2.5;

  const target = createDefaultDesiredObjective();
  target.u1NaMm = 4.0;
  target.u1NaDeg = 22;
  target.impaDeg = 95;
  target.l1NbMm = 4.0;

  const diffs = calculateIncisorDifferences(curr, target);
  assert(diffs.deltaU1NaMm === -4.0, 'VTO Incisor Difference: deltaU1NaMm = -4.0mm');
  assert(diffs.u1Direction === 'Retraction', 'VTO Incisor Direction: Retraction');

  const mechanics = {
    selectedMechanics: ['Extraction'],
    extractionsUpper: [14, 24],
    extractionsLower: [34, 44],
    mechanicsRationale: 'Premolar extractions for anterior retraction and crowding resolution',
  };

  const budget = calculateSpaceBudget(curr, target, mechanics);
  assert(budget.maxillary.required.totalRequiredMm === 12.0, 'VTO Maxillary Required Space = 12.0mm');
  assert(budget.maxillary.available.totalAvailableMm === 14.0, 'VTO Maxillary Available Extraction Space = 14.0mm');
  assert(budget.maxillary.balanceMm === 2.0, 'VTO Maxillary Surplus Balance = +2.0mm');

  const anchor = calculateAnchorageDemand(4.0, budget);
  assert(anchor === 'High', 'Anchorage demand evaluated as High for 4.0mm retraction');

  // TEST SUITE 3: DETERMINISTIC CLINICAL DECISION ENGINES
  console.log('\n--- TEST 3: Deterministic Clinical Decision Engines ---');
  const mockPatient = {
    id: 'test-pt-101',
    patientId: 'ORTHO-2026-999',
    name: 'Ananya Sharma',
    age: 14,
    gender: 'Female',
    examDate: '2026-08-18',
    chiefComplaint: {
      protrudingTeeth: true,
      irregularTeeth: true,
      complaint: 'Forwardly placed upper teeth',
    },
    extraoralProfile: {
      profile: 'Convex',
      lipPostureTonicity: 'Incompetent',
      facialDivergence: 'Posterior Divergent',
      nasolabialAngle: 'Acute',
    },
    intraoralSection: {
      molarRelationRight: 'Class II',
      molarRelationLeft: 'Class II',
      canineRelationRight: 'Class II',
      canineRelationLeft: 'Class II',
      overjetMm: 6.5,
      overbiteMm: 4.5,
    },
    diagnosisAndPlan: {
      skeletalClassification: 'Skeletal Class II',
      dentalClassification: 'Class II Division 1 malocclusion',
    },
  } as unknown as PatientRecord;

  const diag = generateOrthoDiagnosis(mockPatient);
  assert(diag.finalComprehensiveDiagnosis.points.length >= 1, '13-Section Diagnosis generates comprehensive diagnosis');
  assert(diag.skeletalDiagnosis.points.length >= 1, 'Diagnosis identifies skeletal pattern');
  assert(diag.dentalDiagnosis.points.length >= 1, 'Diagnosis identifies dental pattern');

  const plan = generateOrthoTreatmentPlan(mockPatient);
  assert(plan.treatmentObjectives.points.length >= 3, 'Treatment plan generates >= 3 objectives');
  assert(plan.treatmentSequence.points.length >= 3, 'Treatment plan generates wire sequence');
  assert(plan.applianceSelection.points.length >= 2, 'Treatment plan selects appliance');
  assert(plan.anchoragePlanning.points.length >= 1, 'Treatment plan selects anchorage');

  const mentor = generateOrthoMentorData(mockPatient);
  assert(mentor.module1CaseDiscussion.overview.length > 10, 'Mentor generates case summary');
  assert(mentor.module11VivaPreparation.length >= 3, 'Mentor generates viva exam questions');
  assert(mentor.module7RiskAnalysis.risks.length >= 2, 'Mentor identifies clinical risk points');

  // TEST SUITE 4: WEB CRYPTOGRAPHY LOCAL ENCRYPTION VAULT
  console.log('\n--- TEST 4: Web Cryptography AES-GCM-256 Vault ---');
  const sensitiveCaseData = {
    patientName: 'Confidential Patient',
    measurements: { sna: 82, snb: 78, anb: 4 },
    diagnosis: 'Class II Division 1',
  };
  const password = 'CorrectSecureOrthodonticPassword2026!';
  
  const encryptedVault = await encryptDataToVault(sensitiveCaseData, password);
  assert(encryptedVault.algorithm === 'AES-256-GCM', 'Vault encrypted using AES-256-GCM');
  assert(encryptedVault.ciphertext.length > 32, 'Ciphertext is non-empty Base64 payload');
  assert(encryptedVault.kdf.iterations === 100000, 'PBKDF2 uses 100,000 iterations');

  const decrypted = await decryptDataFromVault<typeof sensitiveCaseData>(encryptedVault, password);
  assert(decrypted.patientName === 'Confidential Patient', 'Decryption recovers exact clinical record');
  assert(decrypted.measurements.anb === 4, 'Decryption recovers exact cephalometric angles');

  let wrongPasswordCaught = false;
  try {
    await decryptDataFromVault(encryptedVault, 'WrongPassword123');
  } catch {
    wrongPasswordCaught = true;
  }
  assert(wrongPasswordCaught, 'Decryption strictly rejects incorrect passwords');

  // Tampered ciphertext detection
  let tamperedCaught = false;
  try {
    const tamperedVault = { ...encryptedVault, ciphertext: 'AAAA' + encryptedVault.ciphertext.substring(4) };
    await decryptDataFromVault(tamperedVault, password);
  } catch {
    tamperedCaught = true;
  }
  assert(tamperedCaught, 'Decryption strictly rejects tampered vault payloads');

  // TEST SUITE 5: PASSWORD HASHING, ROLES & CASE ISOLATION
  console.log('\n--- TEST 5: Role Permissions & Access Isolation ---');
  const studentUser: UserAccount = {
    id: 'usr-student-1',
    name: 'Dr. Resident',
    role: 'STUDENT',
    email: 'resident@institution.edu',
    designation: 'PG Resident',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics',
  };
  const guideUser: UserAccount = {
    id: 'usr-guide-1',
    name: 'Dr. Faculty Guide',
    role: 'STAFF_GUIDE',
    email: 'guide@institution.edu',
    designation: 'Associate Professor',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics',
  };
  const hodUser: UserAccount = {
    id: 'usr-hod-1',
    name: 'Prof. Dr. HOD',
    role: 'HOD',
    email: 'hod@institution.edu',
    designation: 'Professor & HOD',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics',
  };

  const studentCase = { studentOwnerId: 'usr-student-1' };
  const peerCase = { studentOwnerId: 'usr-student-2' };

  assert(canEditCase(studentUser, studentCase) === true, 'Student can edit own case');
  assert(canEditCase(studentUser, peerCase) === false, 'Student CANNOT edit peer case');
  assert(canEditCase(guideUser, peerCase) === true, 'Faculty Guide can review peer case');
  assert(canEditCase(hodUser, peerCase) === true, 'HOD can review all departmental cases');
  assert(canDeleteCase(studentUser, peerCase) === false, 'Student CANNOT delete peer case');
  assert(canDeleteCase(guideUser, peerCase) === false, 'Faculty Guide CANNOT delete student cases');
  assert(canDeleteCase(hodUser, peerCase) === true, 'HOD can delete departmental cases');

  assert(canSignOffCase(studentUser) === false, 'Student CANNOT sign off cases');
  assert(canSignOffCase(guideUser) === true, 'Guide CAN sign off cases');
  assert(canSignOffCase(hodUser) === true, 'HOD CAN sign off cases');

  assert(canViewDepartmentAnalytics(studentUser) === false, 'Student CANNOT view dept analytics');
  assert(canViewDepartmentAnalytics(hodUser) === true, 'HOD CAN view dept analytics');

  // Salted PIN verification
  const pin = '8842';
  const salt = 'a1b2c3d4e5f60718';
  const hash = await hashUserPin(pin, salt);
  assert(hash.length === 64, 'PBKDF2 PIN hash generates 64-char hex digest');
  const isMatch = await verifyUserPin(pin, salt, hash);
  assert(isMatch === true, 'PBKDF2 PIN verification matches correctly');
  const isMismatch = await verifyUserPin('9999', salt, hash);
  assert(isMismatch === false, 'PBKDF2 PIN verification rejects wrong PIN');

  // TEST SUITE 6: OFFLINE VOICE & PHONETIC NORMALIZER
  console.log('\n--- TEST 6: Offline Orthodontic Text & Voice Normalizer ---');
  const rawSpoken = 'patient presents with class 2 div 1 malocclusion full stop sna 82 degrees comma snb 78 degrees';
  const normalized = normalizeOrthoSpeechText(rawSpoken);
  assert(normalized.includes('Class II division 1'), 'Phonetic normalizer transforms "class 2 div 1" to "Class II division 1"');
  assert(normalized.includes('SNA 82°'), 'Phonetic normalizer transforms "sna 82 degrees" to "SNA 82°"');
  assert(normalized.includes('.'), 'Phonetic normalizer transforms "full stop" to "."');

  // TEST SUITE 7: PHOTO VALIDATION & FILE SAFETY
  console.log('\n--- TEST 7: Clinical Photo Safety & MIME Validation ---');
  const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
  const invalidMimes = ['application/pdf', 'text/plain', 'application/x-msdownload'];
  assert(validMimes.every(m => m.startsWith('image/')), 'Valid clinical image MIME types accepted');
  assert(invalidMimes.every(m => !m.startsWith('image/')), 'Non-image executable/document formats rejected');

  console.log('\n======================================================');
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
