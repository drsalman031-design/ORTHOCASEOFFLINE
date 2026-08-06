import React, { useState, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Plus,
  FileText,
  Search,
  BookOpen,
  ArrowRight,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
  Award,
  AlertCircle,
  XCircle,
  Check,
  Filter,
  UserCheck,
  Activity,
  FileCheck2,
  ShieldCheck,
  History,
  Stethoscope,
  FilePlus,
  FolderKanban,
  Edit,
  X,
  GraduationCap,
} from 'lucide-react';
import { PatientRecord, StudentProfile, ActiveTab } from '../types';
import { getCurrentUserAccount } from '../lib/authContext';
import { prefetchCaseForm, prefetchPatientList } from '../lib/prefetch';

interface DashboardProps {
  patients: PatientRecord[];
  profile: StudentProfile;
  onChangeTab: (tab: ActiveTab, filter?: string) => void;
  onSelectPatient: (patient: PatientRecord) => void;
  onNewCase: () => void;
  onGeneratePDF: (patient: PatientRecord) => void;
  onLoadSamples: () => void;
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({
  patients,
  profile,
  onChangeTab,
  onSelectPatient,
  onNewCase,
  onGeneratePDF,
  onLoadSamples,
}) => {
  const currentUser = getCurrentUserAccount();
  const isResident = currentUser.role === 'STUDENT';
  const isHOD = currentUser.role === 'HOD';
  const isFaculty = currentUser.role === 'STAFF_GUIDE';

  // Filter cases strictly scoped for Resident role
  const residentCases = useMemo(() => {
    return patients.filter(
      (p) => !p.archived && (p.studentOwnerId === currentUser.id || !p.studentOwnerId)
    );
  }, [patients, currentUser.id]);

  // State for faculty/HOD approvals queue
  const [approvalList, setApprovalList] = useState([
    {
      id: 'app-1',
      patientName: 'Chen, Wei-Long',
      caseId: 'ORD-2024-0892',
      residentName: 'Dr. Rahul Sharma (Y2)',
      guideName: 'Dr. Sunita Patil',
      submissionDate: 'Today, 09:30 AM',
      type: 'Initial Treatment Plan & Ceph Analysis',
      priority: 'Urgent Review',
      priorityColor: 'bg-red-50 text-red-700 border-red-200',
      status: 'PENDING_HOD',
    },
    {
      id: 'app-2',
      patientName: 'Priya Mukherjee',
      caseId: 'OC-8821',
      residentName: 'Dr. Ananya Sen (Y1)',
      guideName: 'Dr. Sunita Patil',
      submissionDate: 'Yesterday, 04:15 PM',
      type: 'Fixed Appliance Bonding & Wire Sequence',
      priority: 'Guide Approved',
      priorityColor: 'bg-blue-50 text-[#0D52D6] border-blue-200',
      status: 'PENDING_HOD',
    },
    {
      id: 'app-3',
      patientName: 'Karan Malhotra',
      caseId: 'ORD-2024-0412',
      residentName: 'Dr. Vikramaditya (Y3)',
      guideName: 'Dr. Rajesh K. V.',
      submissionDate: '2 days ago',
      type: 'Final Debonding & Hawley Retainer Protocol',
      priority: 'High Priority',
      priorityColor: 'bg-amber-50 text-amber-800 border-amber-200',
      status: 'PENDING_HOD',
    },
  ]);

  const [activityFeed] = useState([
    {
      id: 1,
      title: 'Dr. Sunita Patil approved Treatment Plan',
      details: 'Case #OC-8821 (Priya Mukherjee) forwarded to HOD for final sign-off.',
      time: '10 mins ago',
      icon: CheckCircle2,
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      id: 2,
      title: 'New Case Logged by Dr. Rahul Sharma',
      details: 'Patient: Chen, Wei-Long (Class II Div 1 Malocclusion with Mandibular Retrognathism)',
      time: '1 hour ago',
      icon: Plus,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      id: 3,
      title: 'Cephalometric Analysis Verified',
      details: 'Steiner & Tweed values confirmed for Patient #ORD-2024-0412.',
      time: '3 hours ago',
      icon: Activity,
      color: 'text-purple-600 bg-purple-50',
    },
  ]);

  const [showRequirementsModal, setShowRequirementsModal] = useState(false);

  const handleApprove = (id: string) => {
    setApprovalList((prev) => prev.filter((item) => item.id !== id));
  };

  const handleReject = (id: string) => {
    const reason = prompt('Enter reason for requesting revision / correction:');
    if (reason !== null) {
      setApprovalList((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // RESIDENT SPECIFIC DASHBOARD VIEW
  if (isResident) {
    return (
      <div className="w-full max-w-md mx-auto min-h-screen bg-slate-50 flex flex-col overflow-x-hidden space-y-3 pb-16 font-sans">
        {/* UNIFIED HERO WELCOME CARD WIDGET */}
        <div className="w-full bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-3 shadow-sm border border-slate-800 relative overflow-hidden min-w-0">
          <div className="min-w-0 space-y-0.5 relative z-10">
            <h1 className="text-lg font-bold leading-tight text-white tracking-tight truncate">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-[11px] font-normal text-slate-300 truncate">
              {currentUser.designation} • Orthodontics
            </p>
          </div>
        </div>

        {/* SECTION HEADER: MY CLINICAL OVERVIEW */}
        <div className="px-1 pt-1 min-w-0">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            MY CLINICAL OVERVIEW
          </h2>
        </div>

        {/* METRIC CARDS GRID (2x2 UNIFORM LAYOUT) */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {/* Card 1: My Active Cases */}
          <button
            type="button"
            onClick={() => onChangeTab('patients', 'all')}
            className="rounded-2xl bg-white p-3.5 border border-slate-100 shadow-2xs hover:shadow-md hover:border-blue-300 active:scale-95 transition-all flex flex-col justify-between text-left min-w-0 h-full cursor-pointer group"
          >
            <div className="space-y-1 min-w-0 w-full">
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-[13px] font-semibold text-slate-700 truncate min-w-0">
                  My Active Cases
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
              </div>
              <div className="text-[30px] font-bold leading-none text-slate-900 pt-1">
                8
              </div>
            </div>
            <div className="pt-3 min-w-0">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 w-max max-w-full truncate block border border-blue-100/80">
                In Progress
              </span>
            </div>
          </button>


          {/* Card 3: Awaiting Review */}
          <button
            type="button"
            onClick={() => onChangeTab('patients', 'pending')}
            className="rounded-2xl bg-white p-3.5 border border-slate-100 shadow-2xs hover:shadow-md hover:border-amber-300 active:scale-95 transition-all flex flex-col justify-between text-left min-w-0 h-full cursor-pointer group"
          >
            <div className="space-y-1 min-w-0 w-full">
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-[13px] font-semibold text-slate-700 truncate min-w-0">
                  Awaiting Review
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
              </div>
              <div className="text-[30px] font-bold leading-none text-slate-900 pt-1">
                3
              </div>
            </div>
            <div className="pt-3 min-w-0">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 w-max max-w-full truncate block border border-amber-100/80">
                Faculty Review
              </span>
            </div>
          </button>

          {/* Card 4: Action Required */}
          <button
            type="button"
            onClick={() => onChangeTab('patients', 'corrections')}
            className="rounded-2xl bg-white p-3.5 border border-slate-100 shadow-2xs hover:shadow-md hover:border-rose-300 active:scale-95 transition-all flex flex-col justify-between text-left min-w-0 h-full cursor-pointer group"
          >
            <div className="space-y-1 min-w-0 w-full">
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-[13px] font-semibold text-slate-700 truncate min-w-0">
                  Action Required
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors shrink-0" />
              </div>
              <div className="text-[30px] font-bold leading-none text-slate-900 pt-1">
                1
              </div>
            </div>
            <div className="pt-3 min-w-0">
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-600 w-max max-w-full truncate block border border-rose-100/80">
                Revisions Needed
              </span>
            </div>
          </button>
        </div>

        {/* CLINICAL REQUIREMENTS CHECKLIST BOTTOM-SHEET MODAL */}
        {showRequirementsModal && (
          <div
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
            onClick={() => setShowRequirementsModal(false)}
          >
            <div
              className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 max-h-[85vh] overflow-y-auto min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>PG Resident Logbook (Y2)</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Clinical Requirements Checklist</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRequirementsModal(false)}
                  className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Banner */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-300">Total Completion</span>
                  <span className="font-bold text-emerald-400 text-sm">12 / 20 Completed (60%)</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-500 w-[60%]" />
                </div>
              </div>

              {/* Items Checklist */}
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>1. Fixed Appliances Cases</span>
                    <span className="text-blue-600 font-semibold">8 / 10 Met</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full w-[80%]" />
                  </div>
                  <p className="text-[11px] text-slate-500">2 cases remaining for target completion.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>2. Clear Aligner Cases</span>
                    <span className="text-amber-600 font-semibold">4 / 10 Met</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full w-[40%]" />
                  </div>
                  <p className="text-[11px] text-slate-500">6 cases remaining for target completion.</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>3. Cephalometric Tracings</span>
                    <span className="text-emerald-600 font-bold">20 / 20 Met ✓</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold">100% Requirement fulfilled!</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>4. Archwire Changes & Adjustments</span>
                    <span className="text-emerald-600 font-bold">15 / 15 Met ✓</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold">100% Requirement fulfilled!</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-800">
                    <span>5. Retainers & Post-Treatment</span>
                    <span className="text-emerald-600 font-bold">5 / 5 Met ✓</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full w-[100%]" />
                  </div>
                  <p className="text-[11px] text-emerald-600 font-semibold">100% Requirement fulfilled!</p>
                </div>
              </div>

              {/* Footer Close */}
              <button
                type="button"
                onClick={() => setShowRequirementsModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
              >
                Close Checklist
              </button>
            </div>
          </div>
        )}

        {/* MY RECENT CASES & REVISION QUEUE (RESIDENT SCOPED ONLY) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-3 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[12px] font-bold uppercase tracking-[0.5px] text-slate-700 flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4 text-[#0D52D6]" /> MY LOGGED CASES & REVIEWS
            </h3>
            <button
              onClick={() => onChangeTab('patients')}
              className="text-xs font-bold text-[#0D52D6] hover:underline flex items-center gap-1 cursor-pointer"
            >
              View All ({residentCases.length})
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {residentCases.slice(0, 4).map((patient) => {
              const score = patient.completionStatus?.overallPercentage || 0;
              const isApproved = score >= 80;
              const isPending = score >= 50 && score < 80;

              return (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 hover:bg-white hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {patient.name}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                        {patient.patientId}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {patient.diagnosisAndPlan?.provisionalDiagnosis || 'Class II Div 1 Malocclusion'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isApproved ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Approved ✓
                      </span>
                    ) : isPending ? (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        Awaiting Guide
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        Revision
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // FACULTY & HOD SUPERVISORY DASHBOARD VIEW
  return (
    <div className="space-y-5 pb-6 font-sans bg-[#F8FAFC]">
      {/* HOD HERO WELCOME CARD */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-3 sm:p-3.5 shadow-sm border border-slate-800 relative overflow-hidden min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-10 min-w-0">
          <div className="min-w-0 space-y-0.5">
            <h1 className="text-lg sm:text-xl font-bold leading-tight text-white tracking-tight truncate">
              Welcome, {currentUser.name}
            </h1>
            <p className="text-[11px] font-normal text-slate-300 truncate">
              {currentUser.designation}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isHOD && (
              <button
                type="button"
                onClick={() => onChangeTab('analytics')}
                className="inline-flex items-center justify-center gap-1.5 bg-white/15 hover:bg-white/25 text-white border border-white/20 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer backdrop-blur-md shrink-0"
              >
                <TrendingUp className="w-3.5 h-3.5 text-blue-300" />
                <span>Department Analytics</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DEPARTMENT OVERVIEW HEADER */}
      <div className="px-1">
        <h2 className="text-[12px] font-bold uppercase tracking-[0.5px] text-slate-500">
          DEPARTMENT METRICS OVERVIEW
        </h2>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Tile 1: Residents */}
        <div
          onClick={() => onChangeTab('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Active PG Residents</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#0D52D6] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-[30px] font-bold leading-none text-slate-900">18</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              100% Enrolled
            </span>
          </div>
        </div>

        {/* Tile 2: Active Cases */}
        <div
          onClick={() => onChangeTab('patients')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Cases Logged</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-[30px] font-bold leading-none text-slate-900">
              {patients.filter((p) => !p.archived).length || 142}
            </span>
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
              Clinical Records
            </span>
          </div>
        </div>

        {/* Tile 3: Pending HOD Approvals */}
        <div
          onClick={() => onChangeTab('patients')}
          className="bg-white p-4 rounded-2xl border border-amber-200 shadow-2xs bg-gradient-to-b from-amber-50/30 to-white hover:border-amber-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">Pending Approvals</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-[30px] font-bold leading-none text-amber-900">{approvalList.length}</span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
              Action Required
            </span>
          </div>
        </div>
      </div>

      {/* PENDING APPROVAL QUEUE */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start gap-3">
          <div className="max-w-[70%] space-y-1">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-[#00317e] shrink-0" />
              <h2 className="text-lg text-slate-900 font-extrabold tracking-tight leading-tight">
                Pending Case Approval Queue
              </h2>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Review postgraduate submissions, cephalometric values, and treatment plans.
            </p>
          </div>
          <div className="flex flex-col items-center justify-center bg-blue-50 border border-blue-200/80 rounded-xl px-3.5 py-2 min-w-[72px] shrink-0">
            <span className="text-[#00317e] font-extrabold text-2xl leading-none">
              {approvalList.length}
            </span>
            <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mt-0.5">
              Items
            </span>
          </div>
        </div>

        {approvalList.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-xs font-bold text-slate-800">All Approvals Cleared!</p>
            <p className="text-[11px] text-slate-500">
              There are no pending case reviews in your department queue.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvalList.map((item) => {
              const isUrgent = item.priority.toLowerCase().includes('urgent');
              const isHigh = item.priority.toLowerCase().includes('high');

              return (
                <div
                  key={item.id}
                  className={`bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow ${
                    isUrgent
                      ? 'border-l-4 border-l-rose-600'
                      : isHigh
                      ? 'border-l-4 border-l-amber-500'
                      : 'border-l-4 border-l-[#00317e]'
                  }`}
                >
                  <div className="p-4 space-y-3">
                    {/* Top Row: Patient Name, Case ID & Time */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col min-w-0">
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {item.patientName}
                        </h3>
                        <span className="bg-slate-100 text-slate-600 font-mono font-bold text-[11px] px-2 py-0.5 rounded mt-1 inline-block w-fit uppercase tracking-wider border border-slate-200/60">
                          {item.caseId}
                        </span>
                      </div>
                      <span className="text-slate-400 font-medium text-xs shrink-0">
                        {item.submissionDate}
                      </span>
                    </div>

                    {/* Priority Badge & Case Type */}
                    <div className="space-y-1">
                      <span
                        className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full inline-block border ${
                          isUrgent
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : isHigh
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-blue-50 text-[#00317e] border-blue-200'
                        }`}
                      >
                        {item.priority}
                      </span>
                      <h4 className="text-[#00317e] font-bold text-sm leading-snug">
                        {item.type}
                      </h4>
                    </div>

                    {/* Resident Info Row */}
                    <div className="flex items-center gap-3 py-2.5 border-y border-slate-100 my-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4 text-slate-600" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                          Resident
                        </span>
                        <span className="text-xs text-slate-900 font-bold truncate">
                          {item.residentName}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onChangeTab('patients', 'pending')}
                        className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer active:scale-95"
                      >
                        View Details
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(item.id)}
                        className="flex-1 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] text-xs cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(item.id)}
                        className="flex-1 bg-[#00317e] text-white hover:bg-blue-900 font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.98] text-xs cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

