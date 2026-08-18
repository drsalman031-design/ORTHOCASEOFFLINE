import React, { useState } from 'react';
import { ApprovalAuditEntry, PatientRecord, StudentProfile } from '../../../types';
import {
  History,
  User,
  ShieldCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';

interface ApprovalAuditHistoryProps {
  patient: PatientRecord;
  profile?: StudentProfile;
}

export const ApprovalAuditHistory: React.FC<ApprovalAuditHistoryProps> = ({ patient, profile }) => {
  const [isOpen, setIsOpen] = useState(true);

  const historyList: ApprovalAuditEntry[] = patient.approvalHistory || [];
  const studentName = profile?.studentName || 'Dr. Postgraduate Resident';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* HEADER COLLAPSIBLE BAR */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-slate-900 p-4 sm:p-4.5 text-white flex items-center justify-between gap-3 text-left cursor-pointer transition-colors hover:bg-slate-800"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800 text-teal-400 border border-slate-700">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-400 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
                Permanent Institutional Record
              </span>
              <span className="text-xs text-slate-400 font-semibold hidden sm:inline-block">
                • {historyList.length} Audit Events Recorded
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Approval Audit Trail & Version Sign-off Log
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 hover:text-white">
          <span className="text-xs font-semibold hidden sm:inline-block">
            {isOpen ? 'Hide Audit Log' : 'Show Audit Log'}
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* EXPANDABLE TIMELINE CONTENT */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-6 bg-slate-50/60">
          {/* SUMMARY CARDS GRID: STUDENT, STAFF, HOD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* STUDENT SUBMISSION CARD */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-teal-700 font-bold text-xs uppercase tracking-wider">
                <User className="w-4 h-4" />
                <span>1. Resident Submission</span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">{studentName}</div>
              <div className="text-[11px] text-slate-500">
                Date:{' '}
                <span className="font-semibold text-slate-700">
                  {patient.studentSubmissionDate
                    ? new Date(patient.studentSubmissionDate).toLocaleDateString()
                    : 'Draft Mode'}
                </span>
              </div>
            </div>

            {/* STAFF REVIEWER CARD */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>2. Staff Reviewer</span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {patient.staffReviewerName || 'Awaiting Staff Review'}
              </div>
              <div className="text-[11px] text-slate-500">
                Date:{' '}
                <span className="font-semibold text-slate-700">
                  {patient.staffApprovalDate
                    ? new Date(patient.staffApprovalDate).toLocaleDateString()
                    : 'Pending'}
                </span>
              </div>
              {patient.staffComments && (
                <div className="text-[11px] text-slate-600 italic bg-amber-50 p-1.5 rounded border border-amber-200/80">
                  "{patient.staffComments}"
                </div>
              )}
            </div>

            {/* HOD EXECUTIVE CARD */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-2 text-purple-700 font-bold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4" />
                <span>3. HOD Approval</span>
              </div>
              <div className="text-xs font-bold text-slate-900 truncate">
                {patient.hodReviewerName || 'Awaiting HOD Approval'}
              </div>
              <div className="text-[11px] text-slate-500">
                Date:{' '}
                <span className="font-semibold text-slate-700">
                  {patient.hodApprovalDate
                    ? new Date(patient.hodApprovalDate).toLocaleDateString()
                    : 'Pending'}
                </span>
              </div>
              {patient.hodComments && (
                <div className="text-[11px] text-slate-600 italic bg-purple-50 p-1.5 rounded border border-purple-200/80">
                  "{patient.hodComments}"
                </div>
              )}
            </div>
          </div>

          {/* CHRONOLOGICAL AUDIT LOG TIMELINE */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Chronological Event History & Audit Log</span>
            </h4>

            {historyList.length === 0 ? (
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs text-slate-500 italic text-center">
                No approval transitions logged yet. Complete fields and submit your case to begin the faculty approval workflow.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300">
                {historyList.map((entry) => {
                  const getRoleIcon = () => {
                    switch (entry.actorRole) {
                      case 'hod':
                        return <Building2 className="w-3.5 h-3.5 text-purple-600" />;
                      case 'staff':
                        return <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />;
                      case 'student':
                      default:
                        return <User className="w-3.5 h-3.5 text-teal-600" />;
                    }
                  };

                  return (
                    <div key={entry.id} className="relative bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-1">
                      {/* TIMELINE NODE */}
                      <div className="absolute -left-6 top-4 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-white ring-2 ring-slate-200" />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div className="flex items-center gap-2">
                          <span className="p-1 rounded bg-slate-100">{getRoleIcon()}</span>
                          <span className="font-bold text-xs text-slate-900">{entry.action}</span>
                          <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 border border-slate-200">
                            {entry.actorRole}
                          </span>
                        </div>

                        <span className="text-[11px] text-slate-500 font-medium">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-xs text-slate-700">
                        By: <strong className="text-slate-900">{entry.actorName}</strong> • Resulting Status:{' '}
                        <span className="font-bold text-slate-800">{entry.statusAfter}</span>
                      </div>

                      {entry.comments && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-200/80 mt-1 italic">
                          "{entry.comments}"
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
