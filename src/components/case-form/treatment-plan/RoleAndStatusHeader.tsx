import React from 'react';
import { ApprovalRole, ApprovalStatus, PatientRecord } from '../../../types';
import {
  User,
  ShieldCheck,
  Building2,
  Lock,
  Unlock,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Sparkles,
  FileCheck2,
} from 'lucide-react';

interface RoleAndStatusHeaderProps {
  currentRole: ApprovalRole;
  onSelectRole: (role: ApprovalRole) => void;
  status: ApprovalStatus;
  isLocked: boolean;
  patient: PatientRecord;
  onExportPDF: () => void;
}

export const RoleAndStatusHeader: React.FC<RoleAndStatusHeaderProps> = ({
  currentRole,
  onSelectRole,
  status,
  isLocked,
  patient,
  onExportPDF,
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'HOD Approved':
        return {
          label: 'HOD Approved & Locked',
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
        };
      case 'Pending HOD Approval':
        return {
          label: 'Pending HOD Approval',
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
          icon: <Clock className="w-4 h-4 text-blue-400 animate-pulse" />,
        };
      case 'Pending Staff Approval':
        return {
          label: 'Pending Staff Approval',
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
          icon: <Clock className="w-4 h-4 text-amber-400 animate-pulse" />,
        };
      case 'Returned for Corrections':
        return {
          label: 'Returned for Corrections',
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
        };
      case 'Rejected':
        return {
          label: 'Case Rejected',
          bg: 'bg-red-500/15 border-red-500/30 text-red-300',
          icon: <XCircle className="w-4 h-4 text-red-400" />,
        };
      case 'Draft':
      default:
        return {
          label: 'Student Draft (In Progress)',
          bg: 'bg-slate-500/20 border-slate-500/30 text-slate-300',
          icon: <FileCheck2 className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const badge = getStatusBadge();

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl text-white space-y-4">
      {/* ROLE SWITCHER BAR & STATUS BADGE */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* LEFT: TITLE & PATIENT CONTEXT */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2.5 py-0.5 rounded-full border border-teal-800/60">
              Postgraduate Clinical Workflow
            </span>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${badge.bg}`}>
              {badge.icon}
              <span>{badge.label}</span>
            </div>
            {isLocked && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-amber-300 text-xs font-bold">
                <Lock className="w-3 h-3 text-amber-400" />
                Read-Only
              </span>
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>Patient: {patient.name || 'N/A'}</span>
            <span className="text-slate-400 text-xs sm:text-sm font-normal">
              ({patient.age} yrs / {patient.gender} • ID: {patient.patientId})
            </span>
          </h2>
        </div>

        {/* RIGHT: ROLE SIMULATOR TAB TOGGLES */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start lg:self-auto">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 hidden sm:inline-block">
            Simulate Role:
          </span>
          <button
            type="button"
            onClick={() => onSelectRole('student')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentRole === 'student'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectRole('staff')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentRole === 'staff'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff Reviewer</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectRole('hod')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              currentRole === 'hod'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>HOD</span>
          </button>
        </div>
      </div>

      {/* LOCKED NOTICE BANNER */}
      {isLocked && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between gap-3 text-amber-200 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Case Approved & Permanent Lock Applied.</span>
              <p className="text-amber-300/80 text-xs mt-0.5">
                The final treatment plan is permanently locked by the Head of Department. Edits are restricted unless explicitly unlocked by HOD.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onExportPDF}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shrink-0 cursor-pointer shadow-sm"
          >
            Download PDF Report
          </button>
        </div>
      )}
    </div>
  );
};
