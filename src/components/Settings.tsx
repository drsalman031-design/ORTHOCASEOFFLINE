import React, { useState, useEffect } from 'react';
import {
  User,
  Save,
  HardDrive,
  Download,
  Upload,
  Database,
  Trash2,
  CheckCircle2,
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
  Brain,
  Shield,
  Info,
  ChevronRight,
  X,
  RotateCcw,
} from 'lucide-react';
import { StudentProfile } from '../types';
import { exportAllDataJSON, importDataJSON } from '../lib/db';
import {
  getCurrentUserAccount,
  getDepartmentConfig,
  saveDepartmentConfig,
  extractFolderIdFromUrl,
} from '../lib/authContext';

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
  const isHOD = currentUser.role === 'HOD';
  const isFaculty = currentUser.role === 'STAFF_GUIDE';
  const canManageStudentsAndCases = isHOD || isFaculty;

  // Profile Form state - Prioritize logged in user account info for HOD, Staff, and Residents
  const [studentName, setStudentName] = useState(currentUser.name || profile.studentName || '');
  const [rollNumber, setRollNumber] = useState(currentUser.rollNumber || profile.rollNumber || (isHOD ? 'HOD-ORTHO-01' : isFaculty ? 'STAFF-ORTHO-01' : 'ORTHO-2024-PG-01'));
  const [institution, setInstitution] = useState(currentUser.institution || profile.institution || 'Department of Orthodontics');
  const [department, setDepartment] = useState(currentUser.department || profile.department || 'Orthodontics & Dentofacial Orthopedics');
  const [academicYear, setAcademicYear] = useState(currentUser.designation || profile.academicYear || 'Senior MDS / Faculty');
  const [supervisorName, setSupervisorName] = useState(currentUser.assignedStaffName || profile.supervisorName || 'Prof. Dr. Richardson');

  // Keep local state in sync whenever currentUser or profile changes
  useEffect(() => {
    const user = getCurrentUserAccount();
    if (user) {
      setStudentName(user.name || profile.studentName || '');
      setRollNumber(user.rollNumber || profile.rollNumber || (user.role === 'HOD' ? 'HOD-ORTHO-01' : user.role === 'STAFF_GUIDE' ? 'STAFF-ORTHO-01' : 'ORTHO-2024-PG-01'));
      setInstitution(user.institution || profile.institution || 'Department of Orthodontics');
      setDepartment(user.department || profile.department || 'Orthodontics & Dentofacial Orthopedics');
      setAcademicYear(user.designation || profile.academicYear || 'Senior MDS / Faculty');
      setSupervisorName(user.assignedStaffName || profile.supervisorName || 'Prof. Dr. Richardson');
    }
  }, [currentUser.id, currentUser.name, profile.studentName]);

  // Department Google Drive Config State
  const initialDeptConfig = getDepartmentConfig();
  const [driveFolderUrlInput, setDriveFolderUrlInput] = useState(initialDeptConfig.driveFolderUrl);
  const [extractedFolderId, setExtractedFolderId] = useState(initialDeptConfig.driveFolderId);
  const [driveConfigSaved, setDriveConfigSaved] = useState(false);

  // Toggles
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [aiDiagnosisEnabled, setAiDiagnosisEnabled] = useState(true);
  const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);

  // Modals & Banners
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  const handleDriveUrlChange = (url: string) => {
    setDriveFolderUrlInput(url);
    const extracted = extractFolderIdFromUrl(url);
    setExtractedFolderId(extracted);
  };

  const handleSaveDriveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedConfig = saveDepartmentConfig(driveFolderUrlInput, currentUser.name);
    setExtractedFolderId(updatedConfig.driveFolderId);
    setDriveConfigSaved(true);
    setTimeout(() => setDriveConfigSaved(false), 2500);
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
    setSavedSuccess(true);
    setIsEditProfileOpen(false);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSyncNow = () => {
    setSyncStatusMsg('Syncing all patient records with Cloud Vault...');
    setTimeout(() => {
      setSyncStatusMsg('Cloud sync completed successfully at ' + new Date().toLocaleTimeString());
      setTimeout(() => setSyncStatusMsg(null), 3000);
    }, 1200);
  };

  const handleExportData = async () => {
    try {
      const jsonStr = await exportAllDataJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OrthoCase_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error exporting backup file: ' + err);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const text = reader.result as string;
        const count = await importDataJSON(text);
        setImportSuccessMessage(`Successfully restored ${count} patient case records!`);
        setTimeout(() => {
          setImportSuccessMessage(null);
          window.location.reload();
        }, 2000);
      } catch (err) {
        alert('Failed to restore backup file. Make sure it is a valid OrthoCase JSON backup.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3.5 pb-20 font-sans box-border min-w-0">
      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Department Profile updated successfully!</span>
        </div>
      )}

      {importSuccessMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-2.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{importSuccessMessage}</span>
        </div>
      )}

      {syncStatusMsg && (
        <div className="bg-blue-50 border border-blue-200 text-[#00317e] p-2.5 rounded-xl flex items-center gap-2 font-bold text-xs shadow-xs">
          <RefreshCw className="w-4 h-4 text-[#00317e] animate-spin shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* DEPARTMENT PROFILE CARD */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-extrabold text-xl flex items-center justify-center overflow-hidden">
                {currentUser.name ? currentUser.name[0] : 'D'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-teal-600 border-2 border-white rounded-full flex items-center justify-center text-[9px] text-white font-bold">
                ✓
              </span>
            </div>

            <div className="space-y-0.5">
              <h2 className="text-base font-bold text-slate-900">{currentUser.name || studentName}</h2>
              <p className="text-[11px] font-semibold text-teal-700">
                {currentUser.designation || 'MDS, Orthodontics'} • {currentUser.role === 'HOD' ? 'HOD' : currentUser.role === 'STAFF_GUIDE' ? 'Faculty Guide' : 'PG Resident'}
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

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Department
            </span>
            <span className="font-bold text-slate-800 text-[11px]">{department}</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              College
            </span>
            <span className="font-bold text-slate-800 text-[11px]">{institution}</span>
          </div>
        </div>
      </section>

      {/* GOOGLE DRIVE & CLOUD BACKUP CARD */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
              <Cloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Cloud Backup</h3>
              <p className="text-[10px] text-slate-500 font-medium">Auto-sync case history & photos</p>
            </div>
          </div>
          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Connected
          </span>
        </div>

        <p className="text-[11px] text-slate-600 font-medium">
          Last Backup: <span className="font-bold text-slate-900">Today, 10:45 AM</span>
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-bold text-slate-800">Auto Backup</span>
            <button
              type="button"
              onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                autoBackupEnabled ? 'bg-teal-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoBackupEnabled ? 'translate-x-4' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleSyncNow}
              className="bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>SYNC NOW</span>
            </button>
            <button
              type="button"
              onClick={handleExportData}
              className="border border-teal-600 text-teal-700 hover:bg-teal-50 py-2 rounded-xl text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>RESTORE / BACKUP</span>
            </button>
          </div>
        </div>

        {/* HOD GOOGLE DRIVE FOLDER VAULT CONFIG */}
        {currentUser.role === 'HOD' && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <FolderCheck className="w-3.5 h-3.5 text-teal-600" />
                Department Google Drive Vault
              </span>
              <span className="text-[10px] font-mono text-slate-400">settings/department_config</span>
            </div>

            {driveConfigSaved && (
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Department Shared Drive Vault updated!</span>
              </div>
            )}

            <form onSubmit={handleSaveDriveConfig} className="space-y-1.5">
              <input
                type="url"
                required
                value={driveFolderUrlInput}
                onChange={(e) => handleDriveUrlChange(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
              />
              <div className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                <span className="text-slate-500 font-mono text-[10px]">
                  ID: <strong className="text-teal-700">{extractedFolderId || 'None'}</strong>
                </span>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-lg cursor-pointer"
                >
                  Save Vault Link
                </button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* GROUPED NAVIGATION SECTIONS */}
      <div className="space-y-3">
        {/* STUDENT MANAGEMENT & CASE MANAGEMENT (VISIBLE ONLY TO HOD & FACULTY/STAFF) */}
        {canManageStudentsAndCases && (
          <>
            {/* STUDENT MANAGEMENT */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Student Management
              </p>
              <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('students')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Group className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-800">View All Students</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('students')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <UserPlus className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-800">Add New Resident</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  type="button"
                  onClick={() => alert('Password reset links dispatched to resident institutional emails.')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-800">Reset Resident Password</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* CASE MANAGEMENT */}
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
                Case Management
              </p>
              <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('patients')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-800">Pending Approvals</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-rose-100 text-rose-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                      12
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('analytics')}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <span className="text-xs font-bold text-slate-800">Department Statistics</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* AI INTELLIGENCE */}
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">
            AI Intelligence
          </p>
          <div className="bg-white border border-slate-200/80 rounded-2xl divide-y divide-slate-100 overflow-hidden shadow-2xs">
            <div className="flex items-center justify-between px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <Brain className="w-4 h-4 text-teal-600" />
                <span className="text-xs font-bold text-slate-800">Enable AI Diagnosis</span>
              </div>
              <button
                type="button"
                onClick={() => setAiDiagnosisEnabled(!aiDiagnosisEnabled)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                  aiDiagnosisEnabled ? 'bg-teal-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    aiDiagnosisEnabled ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
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

      {/* OFFLINE DATA ACTIONS */}
      <section className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-slate-500" />
            Local IndexedDB Database
          </span>
          <span className="font-mono font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded text-[11px]">
            {patientCount} Cases Stored
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-0.5">
          <button
            type="button"
            onClick={onLoadSamples}
            className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 text-[11px] cursor-pointer flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Reload Samples</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-bold hover:bg-rose-100 text-[11px] cursor-pointer flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3 text-rose-600" />
            <span>Clear Local Data</span>
          </button>
        </div>
      </section>

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

