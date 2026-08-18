import { UserAccount } from '../types';

const LOCAL_STORAGE_USER_KEY = 'orthocase_current_user_id';
const LOCAL_STORAGE_USER_DATA_KEY = 'orthocase_current_user_data';
const LOCAL_STORAGE_ASSIGNMENTS_KEY = 'orthocase_student_assignments';
const LOCAL_STORAGE_DEPT_CODE_KEY = 'orthocase_last_dept_code';
const LOCAL_STORAGE_SESSION_TOKEN_KEY = 'orthocase_session_jwt';

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

export function getCachedSessionToken(): string | null {
  try {
    return localStorage.getItem(LOCAL_STORAGE_SESSION_TOKEN_KEY) || sessionStorage.getItem(LOCAL_STORAGE_SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setCachedSessionToken(token: string, persist = true): void {
  try {
    if (persist) {
      localStorage.setItem(LOCAL_STORAGE_SESSION_TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(LOCAL_STORAGE_SESSION_TOKEN_KEY, token);
    }
  } catch {}
}

export function getCurrentUserAccount(): UserAccount | null {
  const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (!savedId) return null;

  const savedData = localStorage.getItem(LOCAL_STORAGE_USER_DATA_KEY);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed && parsed.id === savedId) {
        return parsed;
      }
    } catch (e) {
      // fallback: corrupt data — clear and force re-login
    }
  }
  return null;
}

export function getActiveUserAccount(): UserAccount | null {
  const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (!savedId) return null;

  const savedData = localStorage.getItem(LOCAL_STORAGE_USER_DATA_KEY);
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      if (parsed && parsed.id === savedId) {
        return parsed;
      }
    } catch (e) {
      // fallback
    }
  }
  return null;
}

export function setCurrentUserAccount(userId: string, userObj?: UserAccount): UserAccount | null {
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, userId);
  if (userObj) {
    localStorage.setItem(LOCAL_STORAGE_USER_DATA_KEY, JSON.stringify(userObj));
    return userObj;
  }
  return getCurrentUserAccount();
}

export function canEditCase(user: UserAccount, patient: { studentOwnerId?: string }): boolean {
  if (user.role === 'HOD' || user.role === 'STAFF_GUIDE') return true;
  return !patient.studentOwnerId || patient.studentOwnerId === user.id;
}

export function canDeleteCase(user: UserAccount, patient: { studentOwnerId?: string }): boolean {
  if (user.role === 'HOD') return true;
  if (user.role === 'STAFF_GUIDE') return false; // Guides review cases but cannot delete student records
  return !patient.studentOwnerId || patient.studentOwnerId === user.id;
}

export function canSignOffCase(user: UserAccount): boolean {
  return user.role === 'STAFF_GUIDE' || user.role === 'HOD';
}

export function canViewDepartmentAnalytics(user: UserAccount): boolean {
  return user.role === 'STAFF_GUIDE' || user.role === 'HOD';
}

// Session Activity Tracking & Inactivity Auto-Lock
const SESSION_ACTIVITY_KEY = 'orthocase_session_last_activity';
const DEFAULT_INACTIVITY_LIMIT_MS = 15 * 60 * 1000; // 15 minutes

export function recordUserActivity(): void {
  try {
    sessionStorage.setItem(SESSION_ACTIVITY_KEY, String(Date.now()));
  } catch {}
}

export function isSessionExpired(limitMs = DEFAULT_INACTIVITY_LIMIT_MS): boolean {
  try {
    const lastActive = sessionStorage.getItem(SESSION_ACTIVITY_KEY);
    if (!lastActive) return false;
    const elapsed = Date.now() - Number(lastActive);
    return elapsed > limitMs;
  } catch {
    return false;
  }
}

export function touchSession(): void {
  recordUserActivity();
}

// Salted Hash Verification for Local PINs / Passwords via Web Crypto
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

export function clearAuthSession(): void {
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  localStorage.removeItem(LOCAL_STORAGE_USER_DATA_KEY);
  localStorage.removeItem('orthocase_user_role');
  localStorage.removeItem('orthocase_jwt_token');
  sessionStorage.clear();
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
