import {
  canEditCase,
  canDeleteCase,
  canSignOffCase,
  canViewDepartmentAnalytics,
  getCurrentUserAccount,
  setSecureAuthSession,
  clearAuthSession,
  hasValidAuthSession,
  hashUserPin,
  verifyUserPin,
} from '../authContext';
import {
  encryptDataToVault,
  decryptDataFromVault,
} from '../cryptoVault';
import { UserAccount } from '../../types';

// Polyfill localStorage & sessionStorage for Node.js test runner
if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
}
if (typeof globalThis.sessionStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).sessionStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = String(value); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
}

/**
 * SECURITY & RBAC ADVERSARIAL ATTACK TEST SUITE
 * Simulates real-world threat models, unauthorized privilege escalation,
 * token tampering, ciphertext corruption, and session leakage attacks.
 */
async function runSecurityAdversarialAudit() {
  console.log('\n======================================================');
  console.log('  ORTHOCASE SECURITY & RBAC ADVERSARIAL ATTACK SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // Define Mock Users
  const student1: UserAccount = {
    id: 'usr-student-1',
    name: 'Dr. Student One',
    role: 'STUDENT',
    email: 'student1@institution.edu',
    designation: 'Resident',
    institution: 'Department of Orthodontics',
    department: 'Postgraduate Orthodontics',
  };

  const student2: UserAccount = {
    id: 'usr-student-2',
    name: 'Dr. Student Two',
    role: 'STUDENT',
    email: 'student2@institution.edu',
    designation: 'Resident',
    institution: 'Department of Orthodontics',
    department: 'Postgraduate Orthodontics',
  };

  const facultyGuide: UserAccount = {
    id: 'usr-faculty-1',
    name: 'Prof. Faculty Guide',
    role: 'STAFF_GUIDE',
    email: 'guide@institution.edu',
    designation: 'Associate Professor',
    institution: 'Department of Orthodontics',
    department: 'Faculty Division',
    assignedStudentIds: ['usr-student-1'],
  };

  const hodUser: UserAccount = {
    id: 'usr-hod-1',
    name: 'Prof. Dr. HOD',
    role: 'HOD',
    email: 'hod@institution.edu',
    designation: 'Professor & Head',
    institution: 'Department of Orthodontics',
    department: 'Faculty Division',
  };

  const patientOwnedByStudent1 = {
    studentOwnerId: 'usr-student-1',
  };

  // -----------------------------------------------------------------
  // 1. RBAC ATTACK SCENARIOS
  // -----------------------------------------------------------------
  console.log('--- 1. RBAC Privilege Escalation Attack Tests ---');

  // Attack 1: Student 2 attempts to edit Student 1's case
  const student2CanEdit = canEditCase(student2, patientOwnedByStudent1);
  assert(!student2CanEdit, 'Student 2 blocked from editing Student 1 case');

  // Attack 2: Student 2 attempts to delete Student 1's case
  const student2CanDelete = canDeleteCase(student2, patientOwnedByStudent1);
  assert(!student2CanDelete, 'Student 2 blocked from deleting Student 1 case');

  // Attack 3: Student 1 attempts to sign off / approve own case
  const student1CanSignOff = canSignOffCase(student1);
  assert(!student1CanSignOff, 'Student strictly blocked from formal case sign-off');

  // Attack 4: Student attempts to view departmental analytics
  const studentCanViewAnalytics = canViewDepartmentAnalytics(student1);
  assert(!studentCanViewAnalytics, 'Student blocked from department-wide analytics access');

  // Attack 5: Faculty Guide attempts to delete student case (Only HOD has delete rights)
  const guideCanDelete = canDeleteCase(facultyGuide, patientOwnedByStudent1);
  assert(!guideCanDelete, 'Faculty Guide blocked from permanent case deletion (HOD privilege only)');

  // Legitimate permissions check
  assert(canEditCase(student1, patientOwnedByStudent1), 'Student 1 permitted to edit own case');
  assert(canEditCase(facultyGuide, patientOwnedByStudent1), 'Assigned Guide permitted to review/edit case');
  assert(canEditCase(hodUser, patientOwnedByStudent1), 'HOD permitted to review departmental case');
  assert(canSignOffCase(facultyGuide), 'Faculty Guide permitted to sign off');
  assert(canSignOffCase(hodUser), 'HOD permitted to sign off');
  assert(canDeleteCase(hodUser, patientOwnedByStudent1), 'HOD permitted to delete case');

  // -----------------------------------------------------------------
  // 2. CRYPTOGRAPHY & CIPHERTEXT INTEGRITY ATTACKS
  // -----------------------------------------------------------------
  console.log('\n--- 2. Cryptography AES-GCM-256 Tampering & Brute Force Attacks ---');

  const secretPayload = {
    patientName: 'Confidential Patient',
    diagnosis: 'Severe Skeletal Class II with Bimaxillary Proclination',
    sna: 88.5,
    snb: 79.0,
  };
  const password = 'StrongPassword!2026';

  // Legitimate encryption
  const encryptedVault = await encryptDataToVault(secretPayload, password);
  assert(encryptedVault.algorithm === 'AES-256-GCM', 'Vault uses AES-256-GCM');
  assert(encryptedVault.kdf.iterations === 100000, 'PBKDF2 uses 100,000 iterations');

  // Attack 6: Wrong Password Decryption
  let wrongPassThrew = false;
  try {
    await decryptDataFromVault(encryptedVault, 'WrongPassword123');
  } catch (err) {
    wrongPassThrew = true;
  }
  assert(wrongPassThrew, 'Decryption strictly rejected with invalid password');

  // Attack 7: Ciphertext Bit-Flipping / Tampering Attack
  const tamperedVault = JSON.parse(JSON.stringify(encryptedVault));
  // Mutate ciphertext string
  const rawCipher = atob(tamperedVault.ciphertext);
  const corrupted = btoa(rawCipher.slice(0, -4) + 'AAAA');
  tamperedVault.ciphertext = corrupted;

  let tamperThrew = false;
  try {
    await decryptDataFromVault(tamperedVault, password);
  } catch (err) {
    tamperThrew = true;
  }
  assert(tamperThrew, 'Tampered ciphertext strictly rejected by GCM Auth Tag / Checksum');

  // Legitimate recovery
  const recovered = await decryptDataFromVault(encryptedVault, password);
  assert(recovered.patientName === 'Confidential Patient', 'Legitimate password successfully recovers exact data');

  // -----------------------------------------------------------------
  // 3. EXPLICIT LOGOUT & SESSION INVALIDATION
  // -----------------------------------------------------------------
  console.log('\n--- 3. Auth Session Persistence & Explicit Logout Purge ---');

  // Setup session
  setSecureAuthSession(student1, 'mock_jwt_token_xyz_123', 'institutional');
  assert(hasValidAuthSession(), 'Session is valid after login');
  assert(getCurrentUserAccount()?.id === 'usr-student-1', 'Current user account recovered');

  // Attack 8: Reopen after explicit logout
  clearAuthSession();
  assert(!hasValidAuthSession(), 'Session is immediately invalid after clearAuthSession()');
  assert(getCurrentUserAccount() === null, 'Current user account is null after explicit logout');

  // -----------------------------------------------------------------
  // 4. PIN CODE VERIFICATION (PBKDF2 SHA-256)
  // -----------------------------------------------------------------
  console.log('\n--- 4. Staff Guide PIN Verification Security ---');
  const salt = 'a1b2c3d4e5f60718';
  const expectedHash = await hashUserPin('1234', salt);

  const pinValid = await verifyUserPin('1234', salt, expectedHash);
  assert(pinValid, 'Correct PIN "1234" passes PBKDF2 hash check');

  const pinInvalid = await verifyUserPin('9999', salt, expectedHash);
  assert(!pinInvalid, 'Wrong PIN "9999" rejected');

  console.log(`\n======================================================`);
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAdversarialAudit();
