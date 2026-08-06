import { UserAccount } from '../types';

export const PRESET_ACCOUNTS: UserAccount[] = [
  {
    id: 'usr-student-1',
    name: 'Dr. Rahul Sharma',
    role: 'STUDENT',
    email: 'rahul.sharma@institution.edu',
    designation: 'PG Resident (Y2)',
    rollNumber: 'ORTHO-2024-PG-01',
    assignedStaffId: 'usr-staff-1',
    assignedStaffName: 'Dr. Sunita Patil (Assoc. Prof)',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics & Dentofacial Orthopedics',
  },
  {
    id: 'usr-student-2',
    name: 'Dr. Ananya Deshmukh',
    role: 'STUDENT',
    email: 'ananya.deshmukh@institution.edu',
    designation: 'PG Resident (Y2)',
    rollNumber: 'ORTHO-2024-PG-02',
    assignedStaffId: 'usr-staff-1',
    assignedStaffName: 'Dr. Sunita Patil (Assoc. Prof)',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics & Dentofacial Orthopedics',
  },
  {
    id: 'usr-student-3',
    name: 'Dr. James Wilson',
    role: 'STUDENT',
    email: 'james.wilson@institution.edu',
    designation: 'PG Resident (Y3 Senior)',
    rollNumber: 'ORTHO-2023-PG-08',
    assignedStaffId: 'usr-staff-1',
    assignedStaffName: 'Dr. Sunita Patil (Assoc. Prof)',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics & Dentofacial Orthopedics',
  },
  {
    id: 'usr-student-4',
    name: 'Dr. Sarah Chen',
    role: 'STUDENT',
    email: 'sarah.chen@institution.edu',
    designation: 'PG Resident (Y2 Junior)',
    rollNumber: 'ORTHO-2024-PG-12',
    assignedStaffId: 'usr-staff-2',
    assignedStaffName: 'Dr. Rajesh Kumar (Reader)',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics & Dentofacial Orthopedics',
  },
  {
    id: 'usr-student-5',
    name: 'Dr. Aarav Mehta',
    role: 'STUDENT',
    email: 'aarav.mehta@institution.edu',
    designation: 'PG Resident (Y1)',
    rollNumber: 'ORTHO-2025-PG-03',
    assignedStaffId: 'usr-staff-2',
    assignedStaffName: 'Dr. Rajesh Kumar (Reader)',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics & Dentofacial Orthopedics',
  },
  {
    id: 'usr-staff-1',
    name: 'Dr. Sunita Patil',
    role: 'STAFF_GUIDE',
    email: 'sunita.patil@institution.edu',
    designation: 'Associate Professor & PG Guide',
    assignedStudentIds: ['usr-student-1', 'usr-student-2', 'usr-student-3'],
    institution: 'Department of Orthodontics',
    department: 'Orthodontics & Dentofacial Orthopedics',
  },
  {
    id: 'usr-staff-2',
    name: 'Dr. Rajesh Kumar',
    role: 'STAFF_GUIDE',
    email: 'rajesh.kumar@institution.edu',
    designation: 'Reader & PG Guide',
    assignedStudentIds: ['usr-student-4', 'usr-student-5'],
    institution: 'Department of Orthodontics',
    department: 'Orthodontics & Dentofacial Orthopedics',
  },
  {
    id: 'usr-hod-1',
    name: 'Prof. Dr. Richardson',
    role: 'HOD',
    email: 'hod.ortho@institution.edu',
    designation: 'Head of Department & Senior Examiner',
    institution: 'Department of Orthodontics',
    department: 'Orthodontics & Dentofacial Orthopedics',
  },
];

const LOCAL_STORAGE_USER_KEY = 'orthocase_current_user_id';
const LOCAL_STORAGE_ASSIGNMENTS_KEY = 'orthocase_student_assignments';

export function getCurrentUserAccount(): UserAccount {
  const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (savedId) {
    const found = PRESET_ACCOUNTS.find((acc) => acc.id === savedId);
    if (found) {
      console.log('[AUTH-DEBUG] getCurrentUserAccount => FOUND:', found.name, found.role, found.id);
      return found;
    }
    console.log('[AUTH-DEBUG] getCurrentUserAccount => savedId NOT in PRESET_ACCOUNTS:', savedId);
  } else {
    console.log('[AUTH-DEBUG] getCurrentUserAccount => NO savedId in localStorage, returning default STUDENT');
  }
  return PRESET_ACCOUNTS[0]; // Default fallback for active session
}

export function getActiveUserAccount(): UserAccount | null {
  const savedId = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
  if (!savedId) return null;
  return PRESET_ACCOUNTS.find((acc) => acc.id === savedId) || null;
}

export function setCurrentUserAccount(userId: string): UserAccount {
  console.log('[AUTH-DEBUG] setCurrentUserAccount called with userId:', userId);
  localStorage.setItem(LOCAL_STORAGE_USER_KEY, userId);
  return getCurrentUserAccount();
}

export function clearAuthSession(): void {
  localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  localStorage.removeItem('orthocase_user_role');
  localStorage.removeItem('orthocase_jwt_token');
  sessionStorage.clear();
}

/** Get assignment mapping: studentId -> staffId */
export function getStudentAssignments(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ASSIGNMENTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    'usr-student-1': 'usr-staff-1',
    'usr-student-2': 'usr-staff-1',
    'usr-student-3': 'usr-staff-2',
  };
}

export function saveStudentAssignment(studentId: string, staffId: string): void {
  const current = getStudentAssignments();
  current[studentId] = staffId;
  localStorage.setItem(LOCAL_STORAGE_ASSIGNMENTS_KEY, JSON.stringify(current));
}

const LOCAL_STORAGE_DEPT_CONFIG_KEY = 'orthocase_department_config';

export function extractFolderIdFromUrl(url: string): string {
  if (!url) return '';
  const match = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return match[1];
  // If user pasted direct folder ID
  if (/^[a-zA-Z0-9_-]{15,}$/.test(url.trim())) return url.trim();
  return url.trim();
}

export function getDepartmentConfig(): { driveFolderUrl: string; driveFolderId: string; updatedAt: string; updatedBy: string } {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DEPT_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // fallback
  }
  return {
    driveFolderUrl: 'https://drive.google.com/drive/folders/1A2b3C4d5E6f7G8h9I0j_ORTHOCASE_VAULT',
    driveFolderId: '1A2b3C4d5E6f7G8h9I0j_ORTHOCASE_VAULT',
    updatedAt: new Date().toLocaleString(),
    updatedBy: 'Prof. Dr. A. K. Varma (HOD)',
  };
}

export function saveDepartmentConfig(folderUrl: string, authorName: string): { driveFolderUrl: string; driveFolderId: string; updatedAt: string; updatedBy: string } {
  const folderId = extractFolderIdFromUrl(folderUrl);
  const config = {
    driveFolderUrl: folderUrl,
    driveFolderId: folderId,
    updatedAt: new Date().toLocaleString(),
    updatedBy: authorName,
  };
  localStorage.setItem(LOCAL_STORAGE_DEPT_CONFIG_KEY, JSON.stringify(config));
  return config;
}
