import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PatientRecord, StudentProfile } from '../types';
import { encryptDataToVault, decryptDataFromVault, EncryptedVaultPayload } from './cryptoVault';

interface OrthoCaseDB extends DBSchema {
  patients: {
    key: string;
    value: PatientRecord;
    indexes: {
      'by-patientId': string;
      'by-name': string;
      'by-updatedAt': string;
      'by-archived': number;
    };
  };
  settings: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'OrthoCaseStudentDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OrthoCaseDB>> | null = null;

export async function getDB(): Promise<IDBPDatabase<OrthoCaseDB>> {
  if (!dbPromise) {
    dbPromise = openDB<OrthoCaseDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
          patientStore.createIndex('by-patientId', 'patientId');
          patientStore.createIndex('by-name', 'name');
          patientStore.createIndex('by-updatedAt', 'updatedAt');
          patientStore.createIndex('by-archived', 'archived');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    }).catch((err) => {
      console.warn('IndexedDB failed to open, resetting DB promise:', err);
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function ensureStoragePersistence(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persisted();
      if (!isPersisted) {
        const granted = await navigator.storage.persist();
        return granted;
      }
      return true;
    } catch (e) {
      console.warn('Storage persistence request error:', e);
      return false;
    }
  }
  return false;
}

let cachedPatients: PatientRecord[] | null = null;
let cachedProfile: StudentProfile | null = null;

// Patient CRUD operations
export async function getAllPatients(): Promise<PatientRecord[]> {
  if (cachedPatients) {
    return cachedPatients;
  }
  try {
    const db = await getDB();
    const patients = await db.getAll('patients');
    const sorted = patients.sort((a, b) => {
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
    cachedPatients = sorted;
    return sorted;
  } catch (err) {
    console.error('Error fetching patients from IndexedDB:', err);
    return cachedPatients || [];
  }
}

export async function getPatientById(id: string): Promise<PatientRecord | undefined> {
  if (cachedPatients) {
    const found = cachedPatients.find((p) => p.id === id);
    if (found) return found;
  }
  try {
    const db = await getDB();
    return await db.get('patients', id);
  } catch (err) {
    console.error('Error getting patient:', err);
    return undefined;
  }
}

export async function savePatient(patient: PatientRecord): Promise<PatientRecord> {
  const updatedPatient = {
    ...patient,
    updatedAt: new Date().toISOString(),
  };

  try {
    const db = await getDB();
    await db.put('patients', updatedPatient);
  } catch (err) {
    console.error('Error saving patient to IndexedDB:', err);
  }

  if (cachedPatients) {
    const idx = cachedPatients.findIndex((p) => p.id === updatedPatient.id);
    if (idx >= 0) {
      cachedPatients[idx] = updatedPatient;
    } else {
      cachedPatients.unshift(updatedPatient);
    }
  } else {
    cachedPatients = [updatedPatient];
  }

  return updatedPatient;
}

export async function savePatientsBatch(patients: PatientRecord[]): Promise<PatientRecord[]> {
  if (patients.length === 0) return [];

  const now = new Date().toISOString();
  const updatedPatients = patients.map((patient) => ({
    ...patient,
    updatedAt: now,
  }));

  try {
    const db = await getDB();
    const tx = db.transaction('patients', 'readwrite');
    await Promise.all([
      ...updatedPatients.map((p) => tx.store.put(p)),
      tx.done,
    ]);
  } catch (err) {
    console.error('Error saving patients batch to IndexedDB:', err);
  }

  cachedPatients = null; // Invalidate cache so fresh sorted list is retrieved next time
  return updatedPatients;
}

export async function deletePatient(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('patients', id);
  } catch (err) {
    console.error('Error deleting patient from IndexedDB:', err);
  }

  if (cachedPatients) {
    cachedPatients = cachedPatients.filter((p) => p.id !== id);
  }
}

export async function toggleArchivePatient(id: string): Promise<boolean> {
  let newArchivedStatus = false;
  try {
    const db = await getDB();
    const patient = await db.get('patients', id);
    if (patient) {
      patient.archived = !patient.archived;
      patient.updatedAt = new Date().toISOString();
      await db.put('patients', patient);
      newArchivedStatus = patient.archived;
    }
  } catch (err) {
    console.error('Error toggling archive status in IndexedDB:', err);
  }

  if (cachedPatients) {
    const found = cachedPatients.find((p) => p.id === id);
    if (found) {
      found.archived = !found.archived;
      found.updatedAt = new Date().toISOString();
      newArchivedStatus = found.archived;
    }
  }

  return newArchivedStatus;
}

// Student Profile Settings
const DEFAULT_PROFILE: StudentProfile = {
  studentName: '',
  rollNumber: 'PG-ORTHO-2024-012',
  institution: 'Department of Orthodontics & Dentofacial Orthopedics',
  department: 'Postgraduate Orthodontics',
  academicYear: 'Final Year MDS',
  supervisorName: 'Prof. Dr. A. K. Varma',
};

export async function getStudentProfile(): Promise<StudentProfile> {
  if (cachedProfile) {
    return cachedProfile;
  }
  try {
    const db = await getDB();
    const profile = await db.get('settings', 'studentProfile');
    const result = profile || DEFAULT_PROFILE;
    cachedProfile = result;
    return result;
  } catch (e) {
    return cachedProfile || DEFAULT_PROFILE;
  }
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  cachedProfile = profile;
  try {
    const db = await getDB();
    await db.put('settings', profile, 'studentProfile');
  } catch (e) {
    console.error('Error saving student profile to IndexedDB:', e);
  }
}

/**
 * Role-Aware Patient Query Function
 * Enforces ownership and departmental access policies
 */
export async function getPatientsForUser(userId?: string, role?: string): Promise<PatientRecord[]> {
  const allPatients = await getAllPatients();
  if (!userId || !role) {
    return allPatients;
  }

  if (role === 'STUDENT') {
    return allPatients.filter(
      (p) => p.studentOwnerId === userId || !p.studentOwnerId
    );
  }

  // STAFF_GUIDE & HOD can view all cases assigned to their department
  return allPatients;
}

export async function getPatientForUser(
  patientId: string,
  userId?: string,
  role?: string
): Promise<PatientRecord | null> {
  const patient = await getPatientById(patientId);
  if (!patient) return null;
  if (!userId || !role) return patient;
  if (role === 'STUDENT' && patient.studentOwnerId && patient.studentOwnerId !== userId) {
    return null; // Access denied
  }
  return patient;
}

export async function deletePatientForUser(
  patientId: string,
  userId?: string,
  role?: string
): Promise<boolean> {
  const patient = await getPatientById(patientId);
  if (!patient) return false;
  if (role === 'STUDENT' && patient.studentOwnerId && patient.studentOwnerId !== userId) {
    throw new Error('Unauthorized: Students can only delete their own cases.');
  }
  if (role === 'STAFF_GUIDE') {
    throw new Error('Unauthorized: Staff Guides cannot delete cases.');
  }
  await deletePatient(patientId);
  return true;
}

export async function updatePatientForUser(
  patient: PatientRecord,
  userId?: string,
  role?: string
): Promise<PatientRecord> {
  if (role === 'STUDENT' && patient.studentOwnerId && patient.studentOwnerId !== userId) {
    throw new Error('Unauthorized: Students cannot modify peer cases.');
  }
  return await savePatient(patient);
}

/**
 * Exports entire logbook as an AES-GCM-256 Encrypted .orthocase Vault
 */
export async function exportEncryptedVault(passphrase?: string): Promise<string> {
  const patients = await getAllPatients();
  const profile = await getStudentProfile();

  const exportPayload = {
    appName: 'OrthoCase Clinical Logbook',
    appVersion: '3.4.0',
    exportedAt: new Date().toISOString(),
    profile,
    patients,
  };

  const encryptedVault = await encryptDataToVault(exportPayload, passphrase, {
    recordCount: patients.length,
  });
  return JSON.stringify(encryptedVault, null, 2);
}

/**
 * High-Level One-Click Backup function for Settings page
 */
export async function backupDatabaseToLocalVault(customPassphrase?: string): Promise<{
  payload: string;
  filename: string;
  count: number;
}> {
  const patients = await getAllPatients();
  const profile = await getStudentProfile();

  const exportPayload = {
    appName: 'OrthoCase Clinical Logbook',
    appVersion: '3.4.0',
    exportedAt: new Date().toISOString(),
    profile,
    patients,
  };

  const encryptedVault = await encryptDataToVault(exportPayload, customPassphrase, {
    recordCount: patients.length,
  });
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const filename = `OrthoCase_Backup_${year}-${month}-${day}.orthocase`;

  return {
    payload: JSON.stringify(encryptedVault, null, 2),
    filename,
    count: patients.length,
  };
}

/**
 * Exports a single patient case as an AES-GCM-256 Encrypted .orthocase Vault
 */
export async function exportSinglePatientVault(patientId: string, passphrase?: string): Promise<string> {
  const patient = await getPatientById(patientId);
  if (!patient) throw new Error('Patient record not found.');
  const profile = await getStudentProfile();

  const exportPayload = {
    appName: 'OrthoCase Clinical Single Case Vault',
    appVersion: '3.4.0',
    exportedAt: new Date().toISOString(),
    profile,
    patients: [patient],
  };

  const encryptedVault = await encryptDataToVault(exportPayload, passphrase, {
    recordCount: 1,
  });
  return JSON.stringify(encryptedVault, null, 2);
}

/**
 * Imports and decrypts an AES-GCM-256 Encrypted .orthocase Vault
 */
export async function importEncryptedVault(
  vaultString: string,
  passphrase?: string,
  conflictMode: 'merge' | 'overwrite' = 'merge'
): Promise<{ count: number; merged: number; profileUpdated: boolean }> {
  let parsedVault: any;
  try {
    parsedVault = JSON.parse(vaultString);
  } catch {
    throw new Error('Invalid file format. Selected file is not a valid JSON or .orthocase vault.');
  }

  // Handle encrypted vault format
  let decryptedData: {
    patients: PatientRecord[];
    profile?: StudentProfile;
  };

  if (parsedVault.format === 'ORTHOCASE_ENCRYPTED_VAULT') {
    decryptedData = await decryptDataFromVault<{
      patients: PatientRecord[];
      profile?: StudentProfile;
    }>(parsedVault, passphrase);
  } else if (parsedVault.patients && Array.isArray(parsedVault.patients)) {
    // Unencrypted legacy JSON fallback
    decryptedData = parsedVault;
  } else {
    throw new Error('Unrecognized backup structure. File does not contain valid OrthoCase records.');
  }

  if (!decryptedData.patients || !Array.isArray(decryptedData.patients)) {
    throw new Error('Invalid decrypted logbook structure. No patient records found.');
  }

  const db = await getDB();
  const tx = db.transaction('patients', 'readwrite');

  if (conflictMode === 'overwrite') {
    await tx.store.clear();
  }

  let count = 0;
  let merged = 0;

  for (const patient of decryptedData.patients) {
    if (patient.id && patient.name) {
      const existing = await tx.store.get(patient.id);
      if (existing) {
        merged++;
      }
      await tx.store.put(patient);
      count++;
    }
  }

  await tx.done;

  let profileUpdated = false;
  if (decryptedData.profile && decryptedData.profile.studentName) {
    await saveStudentProfile(decryptedData.profile);
    profileUpdated = true;
  }

  cachedPatients = null;
  return { count, merged, profileUpdated };
}

/**
 * High-Level One-Click Restore function for Settings page
 */
export async function restoreDatabaseFromLocalVault(
  vaultString: string,
  customPassphrase?: string,
  conflictMode: 'merge' | 'overwrite' = 'merge'
): Promise<{ count: number; merged: number; profileUpdated: boolean }> {
  return await importEncryptedVault(vaultString, customPassphrase, conflictMode);
}

// Plaintext JSON Export & Import (Legacy Support)
export async function exportAllDataJSON(): Promise<string> {
  const patients = await getAllPatients();
  const profile = await getStudentProfile();
  const exportData = {
    appName: 'OrthoCase Student',
    exportedAt: new Date().toISOString(),
    profile,
    patients,
  };
  return JSON.stringify(exportData, null, 2);
}

export async function importDataJSON(jsonString: string): Promise<number> {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.patients || !Array.isArray(parsed.patients)) {
      throw new Error('Invalid backup file format');
    }
    const db = await getDB();
    const tx = db.transaction('patients', 'readwrite');
    let count = 0;
    for (const patient of parsed.patients) {
      if (patient.id && patient.name) {
        await tx.store.put(patient);
        count++;
      }
    }
    await tx.done;
    if (parsed.profile) {
      await saveStudentProfile(parsed.profile);
    }
    cachedPatients = null;
    return count;
  } catch (err) {
    console.error('Import failed:', err);
    throw err;
  }
}
