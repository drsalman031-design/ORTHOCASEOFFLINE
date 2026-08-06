import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { PatientRecord, StudentProfile } from '../types';

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

export function getDB(): Promise<IDBPDatabase<OrthoCaseDB>> {
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
    });
  }
  return dbPromise;
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
    const sorted = patients.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    cachedPatients = sorted;
    return sorted;
  } catch (err) {
    console.error('Error fetching patients from IndexedDB:', err);
    return [];
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
  const db = await getDB();
  const updatedPatient = {
    ...patient,
    updatedAt: new Date().toISOString(),
  };
  await db.put('patients', updatedPatient);
  if (cachedPatients) {
    const idx = cachedPatients.findIndex((p) => p.id === updatedPatient.id);
    if (idx >= 0) {
      cachedPatients[idx] = updatedPatient;
    } else {
      cachedPatients.unshift(updatedPatient);
    }
  }
  return updatedPatient;
}

export async function savePatientsBatch(patients: PatientRecord[]): Promise<PatientRecord[]> {
  if (patients.length === 0) return [];

  const db = await getDB();
  const now = new Date().toISOString();
  const updatedPatients = patients.map((patient) => ({
    ...patient,
    updatedAt: now,
  }));

  const tx = db.transaction('patients', 'readwrite');
  await Promise.all([
    ...updatedPatients.map((p) => tx.store.put(p)),
    tx.done,
  ]);

  cachedPatients = null; // Invalidate cache so fresh sorted list is retrieved next time
  return updatedPatients;
}

export async function deletePatient(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('patients', id);
  if (cachedPatients) {
    cachedPatients = cachedPatients.filter((p) => p.id !== id);
  }
}

export async function toggleArchivePatient(id: string): Promise<boolean> {
  const db = await getDB();
  const patient = await db.get('patients', id);
  if (patient) {
    patient.archived = !patient.archived;
    patient.updatedAt = new Date().toISOString();
    await db.put('patients', patient);
    if (cachedPatients) {
      const found = cachedPatients.find((p) => p.id === id);
      if (found) {
        found.archived = patient.archived;
        found.updatedAt = patient.updatedAt;
      }
    }
    return patient.archived;
  }
  return false;
}

// Student Profile Settings
const DEFAULT_PROFILE: StudentProfile = {
  studentName: 'Dr. Rahul Sharma',
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
    return DEFAULT_PROFILE;
  }
}

export async function saveStudentProfile(profile: StudentProfile): Promise<void> {
  const db = await getDB();
  await db.put('settings', profile, 'studentProfile');
  cachedProfile = profile;
}

// Export / Import JSON for backup
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
    return count;
  } catch (err) {
    console.error('Import failed:', err);
    throw err;
  }
}
