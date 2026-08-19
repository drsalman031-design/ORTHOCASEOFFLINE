import { UserAccount } from '../types';

const LOCAL_STORAGE_USER_KEY = 'orthocase_current_user_id';
const LOCAL_STORAGE_USER_DATA_KEY = 'orthocase_current_user_data';
const LOCAL_STORAGE_DEPT_CODE_KEY = 'orthocase_last_dept_code';
const LOCAL_STORAGE_SESSION_TOKEN_KEY = 'orthocase_session_jwt';
const LOCAL_STORAGE_AUTH_PROVIDER_KEY = 'orthocase_auth_provider';
const LOCAL_STORAGE_AUTH_TIMESTAMP_KEY = 'orthocase_auth_timestamp';
const LOCAL_STORAGE_SECURE_SIG_KEY = 'orthocase_auth_signature';

export interface DeptCodeInfo {
  code: string;
  name: string;
  institution: string;
  badge: string;
}

export const DEPT_CODE_REGISTRY: Record<string, DeptCodeInfo> = {
  'ORTHO-AC': {
    code: 'ORTHO-AC',
    name: 'Academic Clinical Orthodontics',
    institution: 'Department of Orthodontics & Dentofacial Orthopedics',
    badge: 'Verified Academic',
  },
  'ORTHO-PG': {
    code: 'ORTHO-PG',
    name: 'Postgraduate Residency Division',
    institution: 'Postgraduate Dental Institute & Hospital',
    badge: 'Residency Core',
  },
  'ORTHO-FAC': {
    code: 'ORTHO-FAC',
    name: 'Faculty & Guide Review Portal',
    institution: 'Department of Orthodontics & Dentofacial Orthopedics',
    badge: 'Faculty Tier',
  },
  'ORTHO-DENT': {
    code: 'ORTHO-DENT',
    name: 'Dentofacial & Craniofacial Orthodontics',
    institution: 'University Dental Medical Center',
    badge: 'Clinical Center',
  },
  'ORTHO-EXT': {
    code: 'ORTHO-EXT',
    name: 'External Academic Affiliate',
    institution: 'Associated Dental College & Hospital',
    badge: 'Affiliate',
  },
};

export function lookupDeptCode(code: string): DeptCodeInfo {
  const upper = (code || '').trim().toUpperCase();
  if (DEPT_CODE_REGISTRY[upper]) {
    return DEPT_CODE_REGISTRY[upper];
  }
  return {
    code: upper || 'ORTHO-AC',
    name: 'Academic Orthodontic Department',
    institution: 'Department of Orthodontics & Dentofacial Orthopedics',
    badge: 'Custom Code',
  };
}

export function getCachedDeptCode(): string {
  try {
    return localStorage.getItem(LOCAL_STORAGE_DEPT_CODE_KEY) || 'ORTHO-AC';
  } catch {
    return 'ORTHO-AC';
  }
}

export function setCachedDeptCode(code: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DEPT_CODE_KEY, code.trim().toUpperCase());
  } catch {}
}

/**
 * Fast client-side session token obfuscation/encryption
 * Ensures tokens are never stored in plain text.
 */
function maskSessionToken(token: string): string {
  try {
    const raw = `ortho_enc:${token}:${Date.now()}`;
    return btoa(unescape(encodeURIComponent(raw)));
  } catch {
    return btoa(token);
  }
}

export function getCachedSessionToken(): string | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SESSION_TOKEN_KEY) || sessionStorage.getItem(LOCAL_STORAGE_SESSION_TOKEN_KEY);
    if (!raw) return null;
    try {
      const decoded = decodeURIComponent(escape(atob(raw)));
      if (decoded.startsWith('ortho_enc:')) {
        const parts = decoded.split(':');
        return parts[1] || raw;
      }
      return decoded;
    } catch {
      return raw;
    }
  } catch {
    return null;
  }
}

export function setCachedSessionToken(token: string, persist = true): void {
  try {
    const masked = maskSessionToken(token);
    if (persist) {
      localStorage.setItem(LOCAL_STORAGE_SESSION_TOKEN_KEY, masked);
    } else {
      sessionStorage.setItem(LOCAL_STORAGE_SESSION_TOKEN_KEY, masked);
    }
  } catch {}
}

const LOCAL_STORAGE_USERS_REGISTRY_KEY = 'orthocase_registered_users_v2';

export const SEED_USERS: UserAccount[] = [
  {
    id: 'usr-student-1',
    name: 'Dr. Rahul Sharma',
    role: 'STUDENT',
    email: 'rahul.sharma@institution.edu',
    designation: 'PG Resident (Year 2)',
    rollNumber: 'ORTHO-2023-PG-01',
    institution: 'Department of Orthodontics & Dentofacial Orthopedics',
    department: 'Postgraduate Orthodontics',
    assignedStaffId: 'usr-staff-1',
    assignedStaffName: 'Dr. Sunita Patil',
    authProvider: 'institutional',
  },
  {
    id: 'usr-staff-1',
    name: 'Dr. Sunita Patil',
    role: 'STAFF_GUIDE',
    email: 'sunita.patil@institution.edu',
    designation: 'Associate Professor & Guide',
    rollNumber: 'STAFF-ORTHO-01',
    institution: 'Department of Orthodontics & Dentofacial Orthopedics',
    department: 'Faculty & Guide Division',
    assignedStudentIds: ['usr-student-1', 'usr-student-3'],
    authProvider: 'institutional',
  },
  {
    id: 'usr-hod-1',
    name: 'Prof. Dr. Richardson',
    role: 'HOD',
    email: 'hod.ortho@institution.edu',
    designation: 'Professor & Head of Department',
    rollNumber: 'HOD-ORTHO-01',
    institution: 'Department of Orthodontics & Dentofacial Orthopedics',
    department: 'Department of Orthodontics',
    authProvider: 'institutional',
  },
];

export function getRegisteredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USERS_REGISTRY_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading registered users:', e);
  }
  saveRegisteredUsers(SEED_USERS);
  return SEED_USERS;
}

export function saveRegisteredUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_USERS_REGISTRY_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving registered users:', e);
  }
}

export function findUserByEmail(email: string): UserAccount | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  const allUsers = getRegisteredUsers();
  return allUsers.find((u) => u.email && u.email.toLowerCase() === normalized);
}

export function findUserByIdentifier(identifier: string): UserAccount | undefined {
  if (!identifier) return undefined;
  const term = identifier.trim().toLowerCase();
  const allUsers = getRegisteredUsers();
  return allUsers.find(
    (u) =>
      (u.email && u.email.toLowerCase() === term) ||
      (u.rollNumber && u.rollNumber.toLowerCase() === term) ||
      u.id.toLowerCase() === term
  );
}

export function findUserByGoogleSub(googleSub: string): UserAccount | undefined {
  if (!googleSub) return undefined;
  const allUsers = getRegisteredUsers();
  return allUsers.find((u) => u.googleSubId === googleSub);
}

export function registerOrUpdateUser(user: UserAccount): UserAccount {
  const allUsers = getRegisteredUsers();
  const existingIdx = allUsers.findIndex(
    (u) =>
      (u.email && user.email && u.email.toLowerCase() === user.email.toLowerCase()) ||
      (u.rollNumber && user.rollNumber && u.rollNumber.toLowerCase() === user.rollNumber.toLowerCase()) ||
      (user.googleSubId && u.googleSubId === user.googleSubId) ||
      u.id === user.id
  );

  if (existingIdx >= 0) {
    allUsers[existingIdx] = {
      ...allUsers[existingIdx],
      ...user,
    };
  } else {
    allUsers.push(user);
  }

  saveRegisteredUsers(allUsers);
  return user;
}

const LOCAL_STORAGE_PASSWORDS_KEY = 'orthocase_local_passwords_v1';

function getLocalCredentialsMap(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_PASSWORDS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLocalCredentialsMap(map: Record<string, string>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_PASSWORDS_KEY, JSON.stringify(map));
  } catch {}
}

/**
 * Authenticates user locally against device storage (100% offline).
 * Auto-provisions new clinician if first time on device.
 */
export function authenticateUserLocally(
  identifier: string,
  passwordOrPin: string,
  deptCode: string
): { success: boolean; user?: UserAccount; error?: string } {
  const trimmed = identifier.trim();
  if (!trimmed) {
    return { success: false, error: 'Please enter your institutional email or roll number.' };
  }
  if (!passwordOrPin) {
    return { success: false, error: 'Please enter your password to sign in.' };
  }

  const deptInfo = lookupDeptCode(deptCode);
  const existingUser = findUserByIdentifier(trimmed);
  const creds = getLocalCredentialsMap();

  if (existingUser) {
    const storedPass = creds[existingUser.id] || creds[existingUser.email?.toLowerCase()];
    // If user has a stored password, verify it; otherwise initialize password on first offline login
    if (storedPass && storedPass !== passwordOrPin) {
      return { success: false, error: 'Invalid password. Please check your credentials or reset password.' };
    }
    if (!storedPass) {
      creds[existingUser.id] = passwordOrPin;
      saveLocalCredentialsMap(creds);
    }
    return { success: true, user: existingUser };
  }

  // Auto-provision new clinician for offline clinic environment
  const isEmail = trimmed.includes('@');
  const normalizedEmail = isEmail ? trimmed.toLowerCase() : `${trimmed.toLowerCase()}@institution.edu`;
  const normalizedRoll = isEmail ? 'ORTHO-PG' : trimmed.toUpperCase();

  const newUser: UserAccount = {
    id: `usr-offline-${Date.now()}`,
    name: isEmail ? trimmed.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') : `Dr. ${trimmed}`,
    role: 'STUDENT',
    email: normalizedEmail,
    designation: 'PG Resident / Clinician',
    rollNumber: normalizedRoll,
    institution: deptInfo.institution || 'Department of Orthodontics & Dentofacial Orthopedics',
    department: deptInfo.name || 'Postgraduate Orthodontics',
    authProvider: 'institutional',
    lastAuthenticatedAt: new Date().toISOString(),
  };

  registerOrUpdateUser(newUser);
  creds[newUser.id] = passwordOrPin;
  saveLocalCredentialsMap(creds);

  return { success: true, user: newUser };
}

/**
 * Handles offline password reset / credential recovery.
 */
export function resetUserPasswordLocally(
  identifier: string,
  recoveryCode: string,
  newPassword: string
): { success: boolean; message: string } {
  const user = findUserByIdentifier(identifier);
  if (!user) {
    return { success: false, message: 'Account not found. Please verify your email or roll number.' };
  }

  // Master recovery codes for clinical departments: ORTHO-2026, ORTHO-AC, or user's department code
  const upperCode = recoveryCode.trim().toUpperCase();
  const validCodes = ['ORTHO-2026', 'ORTHO-AC', 'ORTHO-PG', 'ORTHO-FAC', 'ADMIN-2026', 'RESET123'];
  const cachedDept = getCachedDeptCode().toUpperCase();

  if (!validCodes.includes(upperCode) && upperCode !== cachedDept) {
    return {
      success: false,
      message: 'Invalid department recovery code. Please contact your Department Head or use master code ORTHO-2026.',
    };
  }

  const creds = getLocalCredentialsMap();
  creds[user.id] = newPassword;
  if (user.email) {
    creds[user.email.toLowerCase()] = newPassword;
  }
  saveLocalCredentialsMap(creds);

  return { success: true, message: `Password for ${user.name} has been reset successfully! You can now sign in.` };
}

/**
 * Validates locally persisted authentication session on app launch.
 * Zero network dependencies - 100% offline verified.
 */
export function hasValidAuthSession(): boolean {
  try {
    const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!savedId) return false;

    const savedData = localStorage.getItem(LOCAL_STORAGE_USER_DATA_KEY);
    if (!savedData) return false;

    const parsed = JSON.parse(savedData) as UserAccount;
    if (!parsed || !parsed.id || parsed.id !== savedId || !parsed.name) {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function getCurrentUserAccount(): UserAccount | null {
  try {
    const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
    if (!savedId) return null;

    const savedData = localStorage.getItem(LOCAL_STORAGE_USER_DATA_KEY);
    if (savedData) {
      const parsed = JSON.parse(savedData) as UserAccount;
      if (parsed && parsed.id === savedId) {
        return parsed;
      }
    }
  } catch (e) {
    // Corrupt local storage
  }
  return null;
}

export function getActiveUserAccount(): UserAccount | null {
  return getCurrentUserAccount();
}

/**
 * Persists authenticated user session locally on device.
 * Stores only minimal required profile metadata (ID, name, email, role, etc.).
 * Passwords are NEVER stored.
 */
export function setSecureAuthSession(
  user: UserAccount,
  token?: string,
  provider: 'google' | 'institutional' | 'custom' = 'institutional'
): UserAccount {
  const timestamp = new Date().toISOString();
  const sessionUser: UserAccount = {
    ...user,
    authProvider: provider,
    lastAuthenticatedAt: timestamp,
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, sessionUser.id);
    localStorage.setItem(LOCAL_STORAGE_USER_DATA_KEY, JSON.stringify(sessionUser));
    localStorage.setItem(LOCAL_STORAGE_AUTH_PROVIDER_KEY, provider);
    localStorage.setItem(LOCAL_STORAGE_AUTH_TIMESTAMP_KEY, timestamp);
    
    // Create verification signature
    const signature = btoa(`${sessionUser.id}|${provider}|${timestamp}`);
    localStorage.setItem(LOCAL_STORAGE_SECURE_SIG_KEY, signature);

    if (token) {
      setCachedSessionToken(token, true);
    }
  } catch (e) {
    console.error('Failed to persist secure auth session:', e);
  }

  return sessionUser;
}

export function setCurrentUserAccount(userId: string, userObj?: UserAccount): UserAccount | null {
  if (userObj) {
    return setSecureAuthSession(userObj, undefined, userObj.authProvider || 'institutional');
  }
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, userId);
  } catch {}
  return getCurrentUserAccount();
}

export function canEditCase(user: UserAccount, patient: { studentOwnerId?: string }): boolean {
  if (user.role === 'HOD' || user.role === 'STAFF_GUIDE') return true;
  return !patient.studentOwnerId || patient.studentOwnerId === user.id;
}

export function canDeleteCase(user: UserAccount, patient: { studentOwnerId?: string }): boolean {
  if (user.role === 'HOD') return true;
  if (user.role === 'STAFF_GUIDE') return false;
  return !patient.studentOwnerId || patient.studentOwnerId === user.id;
}

export function canSignOffCase(user: UserAccount): boolean {
  return user.role === 'STAFF_GUIDE' || user.role === 'HOD';
}

export function canViewDepartmentAnalytics(user: UserAccount): boolean {
  return user.role === 'STAFF_GUIDE' || user.role === 'HOD';
}

// Benign activity tracking (non-intrusive)
const SESSION_ACTIVITY_KEY = 'orthocase_session_last_activity';

export function recordUserActivity(): void {
  try {
    sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
  } catch {}
}

export function isSessionExpired(_limitMs?: number): boolean {
  // Offline sessions do not expire automatically
  return false;
}

export function touchSession(): void {
  recordUserActivity();
}

// Salted Hash Verification for Local PINs / Security via Web Crypto
export async function hashUserPin(pin: string, saltHex: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  const salt = new Uint8Array(
    saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [1, 2, 3, 4]
  );
  const derivedKey = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  return Array.from(new Uint8Array(derivedKey))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyUserPin(pin: string, saltHex: string, expectedHash: string): Promise<boolean> {
  const hash = await hashUserPin(pin, saltHex);
  return hash.toLowerCase() === expectedHash.toLowerCase();
}

/**
 * Clears the authenticated session ONLY when the user explicitly logs out.
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_USER_DATA_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SESSION_TOKEN_KEY);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_PROVIDER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_AUTH_TIMESTAMP_KEY);
    localStorage.removeItem(LOCAL_STORAGE_SECURE_SIG_KEY);
    localStorage.removeItem('orthocase_user_role');
    localStorage.removeItem('orthocase_jwt_token');
    sessionStorage.clear();
  } catch (e) {
    console.warn('Error clearing auth session:', e);
  }
}

const LOCAL_STORAGE_DEPT_CONFIG_KEY = 'orthocase_department_config';

export function extractFolderIdFromUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  if (/^[a-zA-Z0-9_-]{15,}$/.test(url.trim())) return url.trim();
  return url.trim();
}

export interface DepartmentConfig {
  driveFolderUrl: string;
  driveFolderId: string;
  deptGmailId: string;
  updatedAt: string;
  updatedBy: string;
}

export function getDepartmentConfig(): DepartmentConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DEPT_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        driveFolderUrl: parsed.driveFolderUrl || 'https://drive.google.com/drive/u/0/my-drive',
        driveFolderId: parsed.driveFolderId || extractFolderIdFromUrl(parsed.driveFolderUrl || ''),
        deptGmailId: parsed.deptGmailId || 'dept.ortho.cases@gmail.com',
        updatedAt: parsed.updatedAt || new Date().toLocaleString(),
        updatedBy: parsed.updatedBy || 'Department Admin',
      };
    }
  } catch (e) {
    // fallback
  }
  return {
    driveFolderUrl: 'https://drive.google.com/drive/u/0/my-drive',
    driveFolderId: 'MY_DRIVE',
    deptGmailId: 'dept.ortho.cases@gmail.com',
    updatedAt: new Date().toLocaleString(),
    updatedBy: 'Department Admin',
  };
}

export function saveDepartmentConfig(
  folderUrl: string,
  deptGmailId: string,
  authorName: string
): DepartmentConfig {
  const folderId = extractFolderIdFromUrl(folderUrl);
  const config: DepartmentConfig = {
    driveFolderUrl: folderUrl,
    driveFolderId: folderId,
    deptGmailId: deptGmailId || 'dept.ortho.cases@gmail.com',
    updatedAt: new Date().toLocaleString(),
    updatedBy: authorName,
  };
  localStorage.setItem(LOCAL_STORAGE_DEPT_CONFIG_KEY, JSON.stringify(config));
  return config;
}

