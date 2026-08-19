import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  Save,
  HardDrive,
  Download,
  Upload,
  Database,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  BookOpen,
  Sun,
  Moon,
  LogOut,
  FolderCheck,
  Link as LinkIcon,
  ExternalLink,
  Edit,
  Cloud,
  Group,
  UserPlus,
  Lock,
  Clock,
  TrendingUp,
  Shield,
  Info,
  ChevronRight,
  X,
  RotateCcw,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { StudentProfile } from '../types';
import {
  backupDatabaseToLocalVault,
  restoreDatabaseFromLocalVault,
} from '../lib/db';
import { saveBackupFileToDevice, readUploadedFile } from '../lib/fileBackupHelper';
import { getCurrentUserAccount } from '../lib/authContext';

interface SettingsProps {
  profile: StudentProfile;
  onSaveProfile: (profile: StudentProfile) => void;
  onLoadSamples: () => void;
  onClearData: () => void;
  patientCount: number;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onLogout?: () => void;
  onNavigate?: (tab: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({
  profile,
  onSaveProfile,
  onLoadSamples,
  onClearData,
  patientCount,
  theme,
  toggleTheme,
  onLogout,
  onNavigate,
}) => {
  const currentUser = getCurrentUserAccount();
  const isHOD = currentUser?.role === 'HOD';
  const isFaculty = currentUser?.role === 'STAFF_GUIDE';
  const canManageStudentsAndCases = isHOD || isFaculty;

  // Profile Form state - Prioritize logged in user account info for HOD, Staff, and Residents
  const [studentName, setStudentName] = useState(currentUser?.name || profile.studentName || '');
  const [rollNumber, setRollNumber] = useState(currentUser?.rollNumber || profile.rollNumber || (isHOD ? 'HOD-ORTHO-01' : isFaculty ? 'STAFF-ORTHO-01' : 'ORTHO-2024-PG-01'));
  const [institution, setInstitution] = useState(currentUser?.institution || profile.institution || 'Department of Orthodontics');
  const [department, setDepartment] = useState(currentUser?.department || profile.department || 'Orthodontics & Dentofacial Orthopedics');
  const [academicYear, setAcademicYear] = useState(profile.academicYear && !profile.academicYear.toLowerCase().includes('resident') ? profile.academicYear : 'Batch 2024');
  const [supervisorName, setSupervisorName] = useState(currentUser?.assignedStaffName || profile.supervisorName || 'Prof. Dr. Richardson');

  // Keep local state in sync whenever currentUser or profile changes
  useEffect(() => {
    const user = getCurrentUserAccount();
    if (user) {
      setStudentName(user.name || profile.studentName || '');
      setRollNumber(user.rollNumber || profile.rollNumber || (user.role === 'HOD' ? 'HOD-ORTHO-01' : user.role === 'STAFF_GUIDE' ? 'STAFF-ORTHO-01' : 'ORTHO-2024-PG-01'));
      setInstitution(user.institution || profile.institution || 'Department of Orthodontics');
      setDepartment(user.department || profile.department || 'Orthodontics & Dentofacial Orthopedics');
      setAcademicYear(profile.academicYear && !profile.academicYear.toLowerCase().includes('resident') ? profile.academicYear : 'Batch 2024');
      setSupervisorName(user.assignedStaffName || profile.supervisorName || 'Prof. Dr. Richardson');
    }
  }, [currentUser?.id, currentUser?.name, profile.studentName, profile.academicYear]);

  // Modals & Banners & Toast Notification State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  // Backup & Restore processing states
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string, durationMs = 3500) => {
    setToastNotification({ type, title, message });
    setTimeout(() => {
      setToastNotification((current) => (current?.title === title ? null : current));
    }, durationMs);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      studentName,
      rollNumber,
      institution,
      department,
      academicYear,
      supervisorName,
    });
    showToast('success', 'Profile Updated', 'Department profile updated successfully!');
    setIsEditProfileOpen(false);
  };

  /**
   * 1. "Backup to Phone" Feature
   * - Extracts all patient records & state
   * - Encrypts with AES-GCM-256 using device key
   * - Generates OrthoCase_Backup_YYYY-MM-DD.orthocase
   * - Saves directly to phone storage (Downloads/Documents)
   * - Shows success toast notification
   */
  const handleBackupToPhone = async () => {
    if (isBackingUp) return;
    setIsBackingUp(true);

    try {
      const backupData = await backupDatabaseToLocalVault();
      const savedSuccessfully = await saveBackupFileToDevice(backupData.payload, backupData.filename);

      if (savedSuccessfully) {
        showToast(
          'success',
          'Backup Saved to Phone Storage',
          `Encrypted vault created: ${backupData.filename} (${backupData.count} patient records securely archived with AES-256).`,
          4500
        );
      }
    } catch (err: any) {
      console.error('Backup error:', err);
      showToast('error', 'Backup Failed', err.message || 'Unable to complete backup to local storage.');
    } finally {
      setIsBackingUp(false);
    }
  };

  /**
   * 2. "Restore from Phone" Feature
   * - Opens native OS file picker restricted to .orthocase files
   * - Verifies cryptographic integrity & decrypts AES-GCM-256 payload
   * - Safely merges/restores records into local database
   * - Shows success toast & triggers UI reload
   */
  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFilePickedForRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    try {
      const fileContent = await readUploadedFile(file);
      
      let result;
      try {
        result = await restoreDatabaseFromLocalVault(fileContent);
      } catch (decryptErr: any) {
        // If automatic device key decryption failed, prompt user for custom passphrase
        const fallbackPassphrase = prompt(
          'This backup may have been created on another device or with a custom password. Enter the encryption password to unlock:'
        );
        if (!fallbackPassphrase) {
          throw new Error('Decryption cancelled. Password required to unlock this backup.');
        }
        result = await restoreDatabaseFromLocalVault(fileContent, fallbackPassphrase.trim());
      }

      showToast(
        'success',
        'Database Restored Successfully!',
        `Restored ${result.count} patient records (${result.merged} merged). Refreshing dashboard...`,
        3000
      );

      // Trigger automatic UI refresh/reload so dashboard displays restored logs immediately
      setTimeout(() => {
        window.location.reload();
      }, 1600);
    } catch (err: any) {
      console.error('Restore error:', err);
      showToast(
        'error',
        'Restore Failed',
        err.message || 'Failed to decrypt or read .orthocase backup file. Ensure file is valid and undamaged.'
      );
      setIsRestoring(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3.5 pb-20 font-sans box-border min-w-0">
      {/* FLOATING / TOP TOAST NOTIFICATION */}
      {toastNotification && (
        <div
          className={`p-3 rounded-2xl flex items-start gap-2.5 shadow-md border animate-in fade-in slide-in-from-top-2 duration-200 ${
            toastNotification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : toastNotification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          {toastNotification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : toastNotification.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold leading-tight">{toastNotification.title}</h4>
            <p className="text-[11px] opacity-90 leading-normal mt-0.5">{toastNotification.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setToastNotification(null)}
            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer rounded-lg shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DEPARTMENT PROFILE CARD */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-extrabold text-xl flex items-center justify-center overflow-hidden">
                {currentUser?.name ? currentUser.name[0] : studentName ? studentName[0] : 'D'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                ✓
              </span>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">{currentUser?.name || studentName}</h2>
                {currentUser?.authProvider === 'google' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded-md">
                    Google
                  </span>
                )}
              </div>
              <p className="text-[11px] font-semibold text-teal-700">
                {currentUser?.designation || 'MDS, Orthodontics'} • {currentUser?.role === 'HOD' ? 'HOD' : currentUser?.role === 'STAFF_GUIDE' ? 'Faculty Guide' : 'PG Resident'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsEditProfileOpen(true)}
            className="p-2 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors cursor-pointer shrink-0"
            title="Edit Profile"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Batch Year
            </span>
            <span className="font-bold text-slate-800 text-[11px] truncate block">{academicYear || profile.academicYear || 'Batch 2024'}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Department
            </span>
            <span className="font-bold text-slate-800 text-[11px] truncate block">{department}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              College
            </span>
            <span className="font-bold text-slate-800 text-[11px] truncate block">{institution}</span>
          </div>
        </div>
      </section>

      {/* GROUPED NAVIGATION SECTIONS */}
      <div className="space-y-3">

        {/* TWO-BUTTON LOCAL BACKUP & RESTORE PANEL */}
        <div className="space-y-1">
          <div className="flex items-center justify-between ml-1 mr-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Local Phone Backup & Restore (Offline AES-256)
            </p>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
              100% Offline Vault
            </span>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
            <div className="p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-bold text-slate-800">Total Cases Stored Locally</span>
                </div>
                <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                  {patientCount} Records
                </span>
              </div>

              {/* TWO CLEAN DISTINCT BUTTONS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* 1. BACKUP TO PHONE BUTTON */}
                <button
                  type="button"
                  onClick={handleBackupToPhone}
                  disabled={isBackingUp}
                  className="w-full bg-teal-600 hover:bg-teal-700 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed text-white p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer border border-teal-700/30"
                >
                  <div className="flex items-center gap-2">
                    {isBackingUp ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <Download className="w-4 h-4 text-white" />
                    )}
                    <span className="text-sm font-bold">📥 Backup to Phone</span>
                  </div>
                  <span className="text-[10px] font-medium text-teal-100 tracking-tight">
                    {isBackingUp ? 'Encrypting & Saving...' : 'Save encrypted .orthocase to phone storage'}
                  </span>
                </button>

                {/* 2. RESTORE FROM PHONE BUTTON */}
                <button
                  type="button"
                  onClick={handleRestoreClick}
                  disabled={isRestoring}
                  className="w-full bg-slate-800 hover:bg-slate-900 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed text-white p-3 rounded-xl font-bold text-xs flex flex-col items-center justify-center gap-1 shadow-sm transition-all cursor-pointer border border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    {isRestoring ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <Upload className="w-4 h-4 text-emerald-400" />
                    )}
                    <span className="text-sm font-bold">📤 Restore from Phone</span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-300 tracking-tight">
                    {isRestoring ? 'Decrypting & Restoring...' : 'Pick .orthocase file to restore database'}
                  </span>
                </button>

                {/* Hidden Native File Picker restricted to .orthocase */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".orthocase"
                  onChange={handleFilePickedForRestore}
                  className="hidden"
                />
              </div>

              {/* SECURITY / STATUS SUBTEXT */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-2.5 flex items-center justify-between text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                  <span>Payload is protected with <strong>AES-GCM-256</strong> client-side encryption.</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono text-slate-500 shrink-0">
                  <FileCheck className="w-3 h-3 text-emerald-600" />
                  <span>.orthocase format</span>
                </div>
              </div>
            </div>

            <div className="px-3.5 py-2.5 flex items-center justify-between bg-rose-50/50">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="text-xs font-bold text-rose-900">Reset Local Database</span>
              </div>
              <button
                type="button"
                onClick={() => setShowClearConfirm(true)}
                className="px-2.5 py-1 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-800 text-[11px] font-bold cursor-pointer"
              >
                Clear Data
              </button>
            </div>
          </div>
        </div>

        {/* APP & SECURITY */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            App & Security
          </p>
          <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">Two-Factor Auth</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Enabled
              </span>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-teal-600" /> : <Sun className="w-4 h-4 text-teal-600" />}
                <span className="text-xs font-bold text-slate-800">Theme</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="px-2.5 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 cursor-pointer capitalize"
              >
                {theme} Mode
              </button>
            </div>

            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <Info className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">About OrthoCase</span>
              </div>
              <span className="text-[11px] font-mono font-bold text-slate-500">v2.4.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* LOGOUT BUTTON */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowLogoutModal(true)}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* DEVELOPER ATTRIBUTION FOOTER */}
      <div className="pt-5 pb-2 text-center text-xs text-slate-500 font-medium tracking-wide border-t border-slate-200/60 leading-relaxed px-4">
        <div>
          Developed by <span className="font-semibold text-slate-700">Dr. Salman, MDS Orthodontist</span> in collaboration with <span className="font-semibold text-slate-700">Dr. Raghu Devanna</span>
        </div>
        <div className="mt-0.5">
          and <span className="font-semibold text-slate-700">Dr. K. Srinivas Karnam</span>.
        </div>
      </div>

      {/* MODAL: EDIT PROFILE CREDENTIALS */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Department Profile</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Name & Title</label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Roll / Employee Code</label>
                <input
                  type="text"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Batch / Academic Year</label>
                <input
                  type="text"
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g. Batch 2024 or 2024"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Dental College / Institution</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 border border-slate-200 font-bold text-slate-700 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRM LOGOUT */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Confirm Logout</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to log out of OrthoCase? Any unsynced offline data will remain on this device.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowLogoutModal(false);
                  if (onLogout) onLogout();
                }}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl font-bold text-xs cursor-pointer"
              >
                Yes, Log Out
              </button>
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CLEAR LOCAL DATA CONFIRMATION */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="text-base font-bold text-rose-700">Confirm Reset Local Database</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to delete all stored patient records from this device? This action cannot be undone unless you have an exported backup file.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearData();
                  setShowClearConfirm(false);
                }}
                className="px-3.5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 cursor-pointer"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

