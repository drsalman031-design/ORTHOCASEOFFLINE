import React, { useMemo, useState } from 'react';
import {
  FolderKanban,
  Calendar,
  FileText,
  CheckCircle2,
  ChevronRight,
  Clock,
  FolderX,
  Trash2,
} from 'lucide-react';
import { PatientRecord, StudentProfile, ActiveTab, UserAccount } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { getCurrentUserAccount } from '../lib/authContext';

interface DashboardProps {
  patients: PatientRecord[];
  profile: StudentProfile;
  currentUser?: UserAccount | null;
  onChangeTab: (tab: ActiveTab, filter?: string) => void;
  onSelectPatient: (patient: PatientRecord) => void;
  onNewCase: () => void;
  onGeneratePDF: (patient: PatientRecord) => void;
  onLoadSamples: () => void;
  onDeletePatient?: (patientId: string) => void;
}

// Dedicated Orthodontic Malocclusion Classification Engine with strict word boundaries and clinical hierarchies
export function classifyPatientMalocclusion(p: PatientRecord): 'Class I' | 'Class II' | 'Class III' {
  // 1. Explicit written diagnosis text (provisional, final, student synthesis)
  const explicitDiagnosisText = [
    p.diagnosisAndPlan?.provisionalDiagnosis,
    (p.diagnosisAndPlan as any)?.finalDiagnosis,
    p.studentDiagnosis?.synthesizedParagraph,
    (p as any).diagnosisPlan?.provisionalDiagnosis,
    (p as any).diagnosisPlan?.finalDiagnosis,
    p.studentDiagnosis?.dentalMolarCanine,
    (p as any).synthesizedDiagnosis?.dentalMolarCanine,
    p.diagnosisAndPlan?.dentalClassification,
  ].filter(Boolean).join(' ');

  // 2. Intraoral molar & canine relationships
  const intraoralDentalTexts = [
    p.intraoralSection?.buccalOcclusionRight,
    p.intraoralSection?.buccalOcclusionLeft,
    (p as any).intraoralExam?.molarClassRight,
    (p as any).intraoralExam?.molarRight,
    (p as any).intraoralExam?.molarClassLeft,
    (p as any).intraoralExam?.molarLeft,
    p.intraoralSection?.canineRelationRight,
    p.intraoralSection?.canineRelationLeft,
    (p as any).intraoralExam?.canineClassRight,
    (p as any).intraoralExam?.canineClassLeft,
    p.intraoralSection?.incisorRelation,
    (p as any).intraoralExam?.incisorRelationship,
  ].filter(Boolean).join(' ');

  // 3. Skeletal & Cephalometric texts
  const skeletalTexts = [
    p.diagnosisAndPlan?.skeletalClassification,
    p.studentDiagnosis?.skeletalAnteroposterior,
    (p as any).diagnosisPlan?.skeletalClass,
    p.radiographyGrowth?.lateralCephFindings,
    p.investigations?.cephalometricSummary,
  ].filter(Boolean).join(' ');

  // 4. Notes & Chief complaint text
  const notesText = [
    p.chiefComplaint?.additionalNotes,
    p.chiefComplaint?.otherText,
    p.historySection?.otherPertinentInfo,
    p.extraoralProfile?.vto,
  ].filter(Boolean).join(' ');

  const allText = `${explicitDiagnosisText} ${intraoralDentalTexts} ${skeletalTexts} ${notesText}`;

  // Helper matching functions with exact word boundaries (avoids 'class ii' matching 'class i')
  const isClass3 = (text: string) =>
    /\b(?:class\s*(?:iii|3)|class-iii|prognathic\s+mandible|reverse\s+overjet|underbite)\b/i.test(text);

  const isClass2 = (text: string) =>
    /\b(?:class\s*(?:ii|2)|class-ii|div(?:ision)?\s*[12]|retrognathic\s+mandible|distal\s+step)\b/i.test(text);

  const isClass1 = (text: string) =>
    /\b(?:class\s*(?:i|1)|class-i|bimaxillary)\b/i.test(text);

  // 1. Check for explicit Class III / Class II anywhere in case record
  if (isClass3(allText)) return 'Class III';
  if (isClass2(allText)) return 'Class II';

  // 2. Cephalometric Steiner / Downs ANB Angle
  const steinerAnb =
    p.radiographyGrowth?.steinersAnalysis?.parameters?.anb?.pre ??
    (p.radiographyGrowth?.steinersAnalysis as any)?.anb?.pre ??
    (p.radiographyGrowth?.downsAnalysis as any)?.anb;
  const numAnb = typeof steinerAnb === 'number' ? steinerAnb : parseFloat(String(steinerAnb || ''));
  if (!isNaN(numAnb)) {
    if (numAnb > 4.0) return 'Class II';
    if (numAnb < 0.0) return 'Class III';
  }

  // 3. Clinical features (overjet, chief complaint, profile)
  const overjet = parseFloat(String(p.intraoralSection?.overjetMm || ''));
  if (!isNaN(overjet) && overjet >= 4.0) {
    return 'Class II';
  }
  if (!isNaN(overjet) && overjet < 0.0) {
    return 'Class III';
  }

  if (p.chiefComplaint?.protrudingTeeth) {
    return 'Class II';
  }

  if (p.extraoralProfile?.profile === 'Convex') {
    return 'Class II';
  }
  if (p.extraoralProfile?.profile === 'Concave') {
    return 'Class III';
  }

  // 4. If explicit Class I was diagnosed
  if (isClass1(explicitDiagnosisText) || isClass1(intraoralDentalTexts)) {
    return 'Class I';
  }

  return 'Class I';
}

export const Dashboard: React.FC<DashboardProps> = React.memo(({
  patients,
  profile,
  currentUser: currentUserProp,
  onSelectPatient,
  onDeletePatient,
}) => {
  const [patientToDelete, setPatientToDelete] = useState<PatientRecord | null>(null);
  const activeUser = currentUserProp || getCurrentUserAccount();
  const welcomeName = profile?.studentName || activeUser?.name || 'Resident';

  // Active cases count calculations
  const totalCasesCount = patients.length;

  const thisMonthCasesCount = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return patients.filter((p) => {
      if (!p.createdAt && !p.updatedAt) return false;
      const d = new Date(p.createdAt || p.updatedAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).length;
  }, [patients]);

  const draftCasesCount = useMemo(() => {
    return patients.filter((p) => {
      const isCompleted =
        p.completionStatus?.overallPercentage === 100 || p.approvalStatus === 'APPROVED';
      return !isCompleted;
    }).length;
  }, [patients]);

  const completedCasesCount = useMemo(() => {
    return patients.filter((p) => {
      const isCompleted =
        p.completionStatus?.overallPercentage === 100 || p.approvalStatus === 'APPROVED';
      return isCompleted;
    }).length;
  }, [patients]);

  // 5 Most recently recorded cases
  const recentCases = useMemo(() => {
    return [...patients]
      .sort((a, b) => {
        const timeA = new Date(b.updatedAt || b.createdAt || 0).getTime();
        const timeB = new Date(a.updatedAt || a.createdAt || 0).getTime();
        return timeA - timeB;
      })
      .slice(0, 5);
  }, [patients]);

  // Dynamic Malocclusion Distribution calculations
  const malocclusionCounts = useMemo(() => {
    let class1 = 0;
    let class2 = 0;
    let class3 = 0;

    patients.forEach((p) => {
      const result = classifyPatientMalocclusion(p);
      if (result === 'Class III') class3++;
      else if (result === 'Class II') class2++;
      else class1++;
    });

    const total = patients.length;
    return { class1, class2, class3, total };
  }, [patients]);

  const getCoordinatesForPercent = (percent: number) => {
    const x = Math.cos(2 * Math.PI * percent);
    const y = Math.sin(2 * Math.PI * percent);
    return [x, y];
  };

  const createSegment = (startPercent: number, endPercent: number) => {
    if (endPercent <= startPercent) return '';
    if (endPercent - startPercent >= 0.999) {
      return 'M 1 0 A 1 1 0 1 1 -1 0 A 1 1 0 1 1 1 0 L 0 0';
    }
    const [startX, startY] = getCoordinatesForPercent(startPercent);
    const [endX, endY] = getCoordinatesForPercent(endPercent);
    const largeArcFlag = endPercent - startPercent > 0.5 ? 1 : 0;
    return `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY} L 0 0`;
  };

  const p1 = malocclusionCounts.total > 0 ? malocclusionCounts.class1 / malocclusionCounts.total : 0;
  const p2 = malocclusionCounts.total > 0 ? malocclusionCounts.class2 / malocclusionCounts.total : 0;
  const p3 = malocclusionCounts.total > 0 ? malocclusionCounts.class3 / malocclusionCounts.total : 0;

  return (
    <div className="w-full max-w-md mx-auto min-h-full flex flex-col space-y-3.5 pb-6 font-sans">
      {/* 1. WELCOME CARD */}
      <div className="bg-[#071B49] text-white rounded-xl sm:rounded-2xl py-2.5 px-4 sm:py-3 shadow-xs border border-[#0A2668]">
        <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white leading-snug break-words">
          Welcome, {welcomeName}
        </h1>
      </div>

      {/* 2. CLINICAL OVERVIEW */}
      <div className="space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
          CLINICAL OVERVIEW
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Total Cases */}
          <div className="bg-white rounded-[20px] p-3.5 border border-slate-100 shadow-2xs flex flex-col justify-between text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Total Cases</span>
              <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100/80">
                <FolderKanban className="w-3.5 h-3.5 text-[#2563EB]" />
              </div>
            </div>
            <div className="text-[28px] font-black leading-none text-[#071B49] tracking-tight">
              {totalCasesCount}
            </div>
          </div>

          {/* Card 2: Cases This Month */}
          <div className="bg-white rounded-[20px] p-3.5 border border-slate-100 shadow-2xs flex flex-col justify-between text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Cases This Month</span>
              <div className="w-7 h-7 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/80">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            </div>
            <div className="text-[28px] font-black leading-none text-[#071B49] tracking-tight">
              {thisMonthCasesCount}
            </div>
          </div>

          {/* Card 3: Draft Cases */}
          <div className="bg-white rounded-[20px] p-3.5 border border-slate-100 shadow-2xs flex flex-col justify-between text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Draft Cases</span>
              <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/80">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
              </div>
            </div>
            <div className="text-[28px] font-black leading-none text-[#071B49] tracking-tight">
              {draftCasesCount}
            </div>
          </div>

          {/* Card 4: Completed Cases */}
          <div className="bg-white rounded-[20px] p-3.5 border border-slate-100 shadow-2xs flex flex-col justify-between text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600">Completed Cases</span>
              <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
            </div>
            <div className="text-[28px] font-black leading-none text-[#071B49] tracking-tight">
              {completedCasesCount}
            </div>
          </div>
        </div>
      </div>

      {/* 3. MALOCCLUSION DISTRIBUTION (DYNAMIC DONUT CHART) */}
      <div className="bg-white rounded-[20px] border border-slate-200/80 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-0.5">
            <h3 className="text-[13px] font-extrabold text-slate-900 tracking-tight">
              Malocclusion Distribution
            </h3>
            <p className="text-[10px] text-slate-500 font-medium italic">
              Clinical analysis summary
            </p>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100/80 px-2 py-1 rounded-lg border border-slate-200/50">
            <div className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
              {profile?.academicYear
                ? profile.academicYear.toLowerCase().includes('batch')
                  ? profile.academicYear
                  : `Batch ${profile.academicYear}`
                : 'Batch 2024'}
            </span>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="relative w-40 h-40">
            <svg
              viewBox="-1.05 -1.05 2.1 2.1"
              className="w-full h-full transform -rotate-90 overflow-visible drop-shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
            >
              {malocclusionCounts.total === 0 ? (
                <circle cx="0" cy="0" r="1" fill="#f1f5f9" />
              ) : (
                <>
                  {p1 > 0 && <path d={createSegment(0, p1)} fill="#10b981" />}
                  {p2 > 0 && <path d={createSegment(p1, p1 + p2)} fill="#3b82f6" />}
                  {p3 > 0 && <path d={createSegment(p1 + p2, 1)} fill="#f97316" />}
                </>
              )}
              <circle cx="0" cy="0" r="0.78" fill="white" />
            </svg>

            {/* Center Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                Total
              </span>
              <span className="text-3xl font-black text-slate-800 leading-none">
                {malocclusionCounts.total}
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                Patients
              </span>
            </div>
          </div>
        </div>

        {/* Color-Connected Legend */}
        <div className="grid grid-cols-1 gap-2 pt-1">
          {/* Class I Row */}
          <div
            className="flex items-center justify-between p-2.5 rounded-[14px] border transition-all duration-200"
            style={{ backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-[11px] font-bold text-slate-700">Class I</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-900">{malocclusionCounts.class1}</span>
              <span className="text-[10px] font-medium text-slate-500 ml-0.5">patients</span>
            </div>
          </div>

          {/* Class II Row */}
          <div
            className="flex items-center justify-between p-2.5 rounded-[14px] border transition-all duration-200"
            style={{ backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-[11px] font-bold text-slate-700">Class II</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-900">{malocclusionCounts.class2}</span>
              <span className="text-[10px] font-medium text-slate-500 ml-0.5">patients</span>
            </div>
          </div>

          {/* Class III Row */}
          <div
            className="flex items-center justify-between p-2.5 rounded-[14px] border transition-all duration-200"
            style={{ backgroundColor: '#fff7ed', borderColor: '#ffedd5' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: '#f97316' }}></div>
              <span className="text-[11px] font-bold text-slate-700">Class III</span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-900">{malocclusionCounts.class3}</span>
              <span className="text-[10px] font-medium text-slate-500 ml-0.5">patients</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. RECENT CASES */}
      <div className="space-y-2">
        <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 px-1">
          RECENT CASES
        </h2>

        {recentCases.length === 0 ? (
          /* EMPTY STATE (No button, purely informative message) */
          <div className="text-center py-8 px-5 bg-white rounded-[24px] border border-slate-200/80 shadow-2xs space-y-3">
            <div className="w-16 h-16 rounded-full bg-blue-50/80 text-[#2563EB] flex items-center justify-center mx-auto border border-blue-100">
              <FolderX className="w-8 h-8 text-[#2563EB]" />
            </div>
            <div className="space-y-1 max-w-xs mx-auto">
              <h3 className="text-base font-bold text-[#071B49]">No cases recorded yet</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Tap the + button in the bottom navigation to record your first orthodontic case.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCases.map((patient) => {
              const isCompleted =
                patient.completionStatus?.overallPercentage === 100 ||
                patient.approvalStatus === 'APPROVED';
              const age = patient.age || '--';
              const gender = patient.gender || '--';
              const dateStr =
                patient.createdAt || patient.updatedAt
                  ? new Date(patient.createdAt || patient.updatedAt).toLocaleDateString(
                      undefined,
                      { month: 'short', day: 'numeric', year: 'numeric' }
                    )
                  : 'Recent';

              return (
                <div
                  key={patient.id}
                  onClick={() => onSelectPatient(patient)}
                  className="p-3.5 rounded-[20px] bg-white border border-slate-200/80 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-98"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs font-bold text-[#071B49] truncate group-hover:text-[#2563EB] transition-colors">
                        {patient.name}
                      </h4>
                      <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                        {patient.patientId || 'OC-CASE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium">
                      <span>
                        {age} Yrs / {gender}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isCompleted
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}
                    >
                      {isCompleted ? 'Completed' : 'Draft'}
                    </span>

                    {onDeletePatient && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPatientToDelete(patient);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200/60 hover:border-rose-200 transition-all cursor-pointer"
                        title="Delete case"
                        aria-label={`Delete case ${patient.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-[#2563EB] transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DEVELOPER ATTRIBUTION FOOTER */}
      <div className="mt-auto pt-6 pb-2 text-center text-xs text-slate-500 font-medium tracking-wide border-t border-slate-200/60 leading-relaxed px-4">
        <div>
          Developed by <span className="font-semibold text-slate-700">Dr. Salman, MDS Orthodontist</span> in collaboration with <span className="font-semibold text-slate-700">Dr. Raghu Devanna</span>
        </div>
        <div className="mt-0.5">
          and <span className="font-semibold text-slate-700">Dr. K. Srinivas Karnam</span>.
        </div>
      </div>

      <ConfirmDeleteModal
        patient={patientToDelete}
        isOpen={!!patientToDelete}
        onClose={() => setPatientToDelete(null)}
        onConfirm={(patientId) => {
          if (onDeletePatient) {
            onDeletePatient(patientId);
          }
        }}
      />
    </div>
  );
});
