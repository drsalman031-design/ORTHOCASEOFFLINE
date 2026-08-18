import React, { useState } from 'react';
import { ApprovalRole, ApprovalStatus, PatientRecord, StudentProfile } from '../../../types';
import {
  ShieldCheck,
  Building2,
  Send,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Lock,
  Unlock,
  MessageSquare,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';

interface FacultyReviewPanelProps {
  currentRole: ApprovalRole;
  status: ApprovalStatus;
  isLocked: boolean;
  patient: PatientRecord;
  profile?: StudentProfile;
  onSubmitForStaff: (studentNotes: string) => void;
  onStaffApprove: (staffName: string, comments: string) => void;
  onStaffReturn: (staffName: string, comments: string) => void;
  onHodApprove: (hodName: string, comments: string) => void;
  onHodReturn: (hodName: string, comments: string) => void;
  onHodReject: (hodName: string, comments: string) => void;
  onHodUnlock: (hodName: string, reason: string) => void;
}

export const FacultyReviewPanel: React.FC<FacultyReviewPanelProps> = ({
  currentRole,
  status,
  isLocked,
  patient,
  profile,
  onSubmitForStaff,
  onStaffApprove,
  onStaffReturn,
  onHodApprove,
  onHodReturn,
  onHodReject,
  onHodUnlock,
}) => {
  const [studentNotes, setStudentNotes] = useState('');
  const [staffName, setStaffName] = useState(patient.staffReviewerName || 'Dr. S. K. Mehta (Reader & Guide)');
  const [staffComments, setStaffComments] = useState(patient.staffComments || '');
  const [hodName, setHodName] = useState(patient.hodReviewerName || 'Prof. Dr. A. K. Roy (HOD & Professor)');
  const [hodComments, setHodComments] = useState(patient.hodComments || '');
  const [unlockReason, setUnlockReason] = useState('');
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  // 1. STUDENT VIEW
  if (currentRole === 'student') {
    const isSubmitted = status === 'Pending Staff Approval' || status === 'Pending HOD Approval' || status === 'HOD Approved';

    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <Send className="w-5 h-5 text-teal-600" />
          <h3 className="text-lg font-bold text-slate-900">Student Submission Control</h3>
        </div>

        {isSubmitted ? (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-teal-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-teal-600" />
              <span>Case History & Treatment Plan Submitted</span>
            </div>
            <p className="text-xs text-slate-600">
              Your treatment plan has been submitted for faculty review. Current Status: <strong className="text-slate-900">{status}</strong>. Edits are restricted during active review.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Student Notes / Submission Comments for Guide:
              </label>
              <textarea
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Specify key clinical considerations, rationale, or questions for your staff reviewer..."
                rows={5}
                className="w-full min-h-[110px] text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed resize-y"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-500">
                Ensure all 16 treatment parameters are filled before submitting.
              </span>
              <button
                type="button"
                onClick={() => onSubmitForStaff(studentNotes)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit Case for Staff Approval</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. STAFF REVIEWER VIEW
  if (currentRole === 'staff') {
    return (
      <div className="bg-amber-50/40 rounded-2xl border border-amber-200 shadow-xs p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-amber-200 pb-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-lg">
            <ShieldCheck className="w-6 h-6 text-amber-600" />
            <h3>Staff Guide / Reviewer Assessment Panel</h3>
          </div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
            Role: Staff Reviewer
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Staff Reviewer / Guide Name:
            </label>
            <input
              type="text"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Submission Date:
            </label>
            <input
              type="text"
              disabled
              value={patient.studentSubmissionDate ? new Date(patient.studentSubmissionDate).toLocaleString() : 'Not Yet Submitted'}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-600 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Staff Evaluation Comments & Corrections:
          </label>
          <textarea
            value={staffComments}
            onChange={(e) => setStaffComments(e.target.value)}
            placeholder="Provide constructive feedback, corrections to extraction/anchorage choices, or guidance for the resident..."
            rows={5}
            className="w-full min-h-[120px] text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed resize-y"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => onStaffReturn(staffName, staffComments)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return to Student for Corrections</span>
          </button>

          <button
            type="button"
            onClick={() => onStaffApprove(staffName, staffComments)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Approve & Send to HOD</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. HOD VIEW
  return (
    <div className="bg-purple-50/50 rounded-2xl border border-purple-200 shadow-xs p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-purple-200 pb-3">
        <div className="flex items-center gap-2 text-purple-950 font-bold text-lg">
          <Building2 className="w-6 h-6 text-purple-700" />
          <h3>Head of Department (HOD) Final Executive Approval</h3>
        </div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-purple-900 bg-purple-100 px-2.5 py-1 rounded-full border border-purple-300">
          Role: HOD
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            HOD / Department Head Name:
          </label>
          <input
            type="text"
            value={hodName}
            onChange={(e) => setHodName(e.target.value)}
            className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-800 mb-1">
            Staff Reviewer Sign-off:
          </label>
          <input
            type="text"
            disabled
            value={patient.staffReviewerName ? `${patient.staffReviewerName} (${patient.staffApprovalDate ? new Date(patient.staffApprovalDate).toLocaleDateString() : 'Approved'})` : 'Pending Staff Sign-off'}
            className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 font-medium"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-800 mb-1">
          HOD Final Comments & Executive Observations:
        </label>
        <textarea
          value={hodComments}
          onChange={(e) => setHodComments(e.target.value)}
          placeholder="Final clinical remarks, approval conditions, or modifications required..."
          rows={5}
          className="w-full min-h-[120px] text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed resize-y"
        />
      </div>

      {isLocked ? (
        <div className="bg-purple-100/80 p-4 rounded-xl border border-purple-300 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-purple-950 font-bold text-xs sm:text-sm">
            <Lock className="w-5 h-5 text-purple-700" />
            <span>Case Approved & Locked by HOD. No further edits allowed unless unlocked.</span>
          </div>

          <button
            type="button"
            onClick={() => setShowUnlockModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
          >
            <Unlock className="w-4 h-4" />
            <span>Unlock Case for Edits</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => onHodReturn(hodName, hodComments)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Request Modifications</span>
          </button>

          <button
            type="button"
            onClick={() => onHodReject(hodName, hodComments)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-2xs transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Case</span>
          </button>

          <button
            type="button"
            onClick={() => onHodApprove(hodName, hodComments)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4 text-purple-300" />
            <span>Approve & Lock Treatment Plan</span>
          </button>
        </div>
      )}

      {/* UNLOCK MODAL */}
      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-2 text-purple-900 font-bold text-base border-b border-slate-200 pb-2">
              <Unlock className="w-5 h-5 text-purple-700" />
              <h4>HOD Case Unlocking Security Confirmation</h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Unlocking this approved treatment plan will revert its read-only status and allow the resident or staff guide to modify clinical fields. Please state the reason for unlocking:
            </p>

            <textarea
              value={unlockReason}
              onChange={(e) => setUnlockReason(e.target.value)}
              placeholder="e.g. Patient changed preference to clear aligners; required updated biomechanics..."
              rows={4}
              className="w-full min-h-[90px] text-xs sm:text-sm p-3.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 focus:outline-none leading-relaxed resize-y"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowUnlockModal(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onHodUnlock(hodName, unlockReason);
                  setShowUnlockModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Confirm & Unlock Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
