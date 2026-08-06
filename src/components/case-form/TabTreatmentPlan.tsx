import React, { useState } from 'react';
import {
  getCurrentUserAccount,
  getStudentAssignments,
  PRESET_ACCOUNTS,
} from '../../lib/authContext';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Send,
  User,
  Sparkles,
  FileText,
  ShieldCheck,
  List,
  Wand2,
} from 'lucide-react';
import { PatientRecord, TreatmentPlanItem, StudentProfile } from '../../types';

interface TabTreatmentPlanProps {
  patient: PatientRecord;
  profile?: StudentProfile;
  onUpdatePatient?: (updated: PatientRecord) => void;
  isLocked?: boolean;
}

const DEFAULT_MAIN_PLACEHOLDER = 'Write the complete orthodontic treatment plan here...';

export const TabTreatmentPlan: React.FC<TabTreatmentPlanProps> = ({
  patient,
  profile,
  onUpdatePatient,
  isLocked = false,
}) => {
  // Create new treatment plan card object
  const createPlanCard = (planNum: number): TreatmentPlanItem => {
    const now = new Date();
    const formattedDate = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const authorName = profile?.studentName || 'Dr. Student (PG Resident)';

    const defaultTitle = planNum === 1
      ? 'Treatment Plan 1: Main Plan'
      : planNum === 2
      ? 'Treatment Plan 2: Alternative Plan'
      : `Treatment Plan ${planNum}`;

    const initialText = planNum === 1
      ? `1. TREATMENT OBJECTIVES:
• Achieve aesthetic smile arc and facial soft tissue lip support.
• Correct Class II molar and canine relation to Class I.
• Reduce overjet to 2.0 mm and level deep overbite.
• Relieve anterior crowding via non-extraction expansion and interproximal reduction (IPR).

2. APPLIANCE & ANCHORAGE SELECTION:
• Fixed Appliance: 0.022" MBT slot pre-adjusted edgewise metal brackets.
• Anchorage: Transpalatal Arch (TPA) for maxillary first molar stabilization.
• Biomechanics: Continuous arch wires, sliding mechanics, Class II intermaxillary elastics.

3. TREATMENT SEQUENCE:
• Alignment & Leveling: 0.014" NiTi -> 0.016" NiTi -> 0.018" CuNiTi archwires.
• Working Archwires: 0.019" x 0.025" Stainless Steel for arch expansion and torque control.
• Interproximal Reduction: Perform 2.5 mm lower anterior IPR to relieve lower crowding.
• Class II Correction: Class II elastics (3/16", 4.5 oz) bilateral full time.
• Finishing: 0.016" x 0.022" TMA detailing wires and settling elastics.

4. RETENTION & STABILITY:
• Maxillary: Upper Hawley retainer with labial bow.
• Mandibular: Fixed 3-3 canine-to-canine bonded lingual retainer.`
      : '';

    return {
      id: `plan-${Date.now()}-${planNum}`,
      planNumber: planNum,
      title: defaultTitle,
      author: authorName,
      dateTime: formattedDate,
      versionNumber: 'v1.0',
      status: 'Draft',
      isApprovedFinal: planNum === 1,
      isCollapsed: false,
      fullTextPlan: initialText,
      phase1PreTreatment: '',
      phase2ActiveOrtho: '',
      phase3Retention: '',
      treatmentObjectives: '',
      alternativePlan: '',
      patientInstructionsConsent: '',
    };
  };

  // State initialization
  const [plans, setPlans] = useState<TreatmentPlanItem[]>(() => {
    if (patient.treatmentPlanItems && patient.treatmentPlanItems.length > 0) {
      return patient.treatmentPlanItems;
    }
    return [createPlanCard(1)];
  });

  const [fullScreenPlanId, setFullScreenPlanId] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [showAiMenuPlanId, setShowAiMenuPlanId] = useState<string | null>(null);

  // Sync back to parent patient record
  const syncPatientRecord = (updatedPlans: TreatmentPlanItem[], notifyMessage?: string) => {
    setPlans(updatedPlans);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLastSavedTime(nowTime);

    if (onUpdatePatient) {
      const activePlan = updatedPlans[0] || createPlanCard(1);
      onUpdatePatient({
        ...patient,
        treatmentPlanItems: updatedPlans,
        studentTreatmentPlan: {
          treatmentModality: activePlan.title,
          growthModification: 'Not Indicated',
          extractionDecision: activePlan.fullTextPlan.toLowerCase().includes('extract') ? 'Extraction' : 'Non-Extraction',
          applianceSelection: '0.022" MBT Slot Metal Brackets',
          anchoragePlanning: 'Transpalatal Arch (TPA)',
          biomechanics: 'Sliding mechanics',
          treatmentSequence: '0.014 NiTi -> 0.018 NiTi -> 0.019x0.025 SS',
          elastics: 'Class II Elastics',
          tadRequirement: 'Optional',
          expansionPlan: 'Arch expansion & IPR',
          surgicalPlan: 'None',
          retentionPlan: 'Hawley & Bonded 3-3',
          estimatedDuration: '18-24 Months',
          prognosis: 'Good',
          patientInstructions: 'Strict oral hygiene & elastic wear',
          treatmentObjectives: 'Achieve Class I molar & canine relation',
          phase1AlignmentLeveling: '',
          phase2MolarSpaceClosure: '',
          phase3FinishingDetailing: activePlan.fullTextPlan,
          retentionPhase: '',
        },
      });
    }

    if (notifyMessage) {
      setSaveNotification(notifyMessage);
      setTimeout(() => setSaveNotification(null), 2500);
    }
  };

  // Update specific field on a plan card
  const handleUpdateField = (planId: string, field: keyof TreatmentPlanItem, value: any) => {
    if (isLocked) return;
    const updated = plans.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          [field]: value,
          dateTime: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        };
      }
      return p;
    });
    syncPatientRecord(updated);
  };

  // Floating + Button / Explicit Top Header Action: Create another Treatment Plan card
  const handleAddPlanCard = () => {
    if (isLocked) return;
    const nextNum = plans.length + 1;
    const newPlan = createPlanCard(nextNum);
    const updated = [...plans, newPlan];
    syncPatientRecord(updated, `Created Treatment Plan ${nextNum}`);
  };

  // Delete plan card
  const handleDeletePlanCard = (id: string) => {
    if (isLocked) return;
    const targetPlan = plans.find((p) => p.id === id);
    if (plans.length <= 1) {
      alert('You must have at least one Treatment Plan card.');
      return;
    }
    const planTitle = targetPlan ? targetPlan.title : 'this treatment plan';
    const confirmDelete = window.confirm(`Are you sure you want to delete "${planTitle}"?`);
    if (!confirmDelete) return;

    const updated = plans.filter((p) => p.id !== id);
    const renumbered = updated.map((p, idx) => ({
      ...p,
      planNumber: idx + 1,
    }));
    syncPatientRecord(renumbered, 'Treatment plan deleted');
  };

  // Toggle Collapse / Expand
  const handleToggleCollapse = (id: string) => {
    const updated = plans.map((p) => (p.id === id ? { ...p, isCollapsed: !p.isCollapsed } : p));
    setPlans(updated);
  };

  // Formatting Helper: Add Bullets
  const handleFormatList = (planId: string) => {
    if (isLocked) return;
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const lines = plan.fullTextPlan.split('\n');
    const bulletedLines = lines.map((line) => {
      if (line.trim().length > 0 && !line.trim().startsWith('•') && !line.trim().match(/^\d+\./)) {
        return `• ${line}`;
      }
      return line;
    });

    handleUpdateField(planId, 'fullTextPlan', bulletedLines.join('\n'));
    syncPatientRecord(plans, 'Applied list formatting');
  };

  // AI Assist Actions
  const handleAiAction = (planId: string, actionType: 'sequence' | 'refine' | 'retention') => {
    if (isLocked) return;
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    let textToAppend = '';
    if (actionType === 'sequence') {
      textToAppend = `\n\n• RECOMMENDED WIRE SEQUENCE:
1. Alignment & Leveling: 0.014" NiTi -> 0.016" NiTi -> 0.018" CuNiTi
2. Working Archwires: 0.019" x 0.025" Stainless Steel
3. Detailing & Finishing: 0.016" x 0.022" TMA with settling elastics`;
    } else if (actionType === 'refine') {
      textToAppend = `\n\n• ACADEMIC CLINICAL NOTES:
Patient exhibits Class II Division 1 skeletal pattern with mild bimaxillary dentoalveolar protrusion. Treatment aims for maximal anterior torque control and stable sagittal intercuspation.`;
    } else if (actionType === 'retention') {
      textToAppend = `\n\n• RETENTION PROTOCOL:
• Maxillary Arch: Upper Hawley retainer with labial bow (full-time 6 months, then night-time).
• Mandibular Arch: Bonded 3-3 canine-to-canine stainless steel lingual retainer.`;
    }

    const updatedText = plan.fullTextPlan ? `${plan.fullTextPlan}${textToAppend}` : textToAppend.trim();
    handleUpdateField(planId, 'fullTextPlan', updatedText);
    setShowAiMenuPlanId(null);
    syncPatientRecord(plans, 'AI suggestion inserted!');
  };

  // Bottom Button Action: Submit to Guide
  const handleSubmitToGuide = () => {
    const currentUser = getCurrentUserAccount();
    const studentAssignments = getStudentAssignments();
    const assignedStaffId = currentUser.assignedStaffId || studentAssignments[currentUser.id] || 'usr-staff-1';
    const assignedStaffAccount = PRESET_ACCOUNTS.find((a) => a.id === assignedStaffId);

    const newHistoryEntry = {
      id: `fb-${Date.now()}`,
      role: 'STUDENT' as const,
      authorName: currentUser.name,
      comment: 'Clinical case history completed and submitted for Staff Guide review.',
      timestamp: new Date().toLocaleString(),
      statusAction: 'PENDING_STAFF',
    };

    const updatedPlans = plans.map((p) => ({ ...p, status: 'Submitted' as const }));
    const updatedPatient: PatientRecord = {
      ...patient,
      treatmentPlanItems: updatedPlans,
      approvalStatus: 'PENDING_STAFF',
      studentOwnerId: currentUser.id,
      assignedStaffId: assignedStaffId,
      assignedStaffName: assignedStaffAccount?.name || 'Dr. Sunita Patil (Assoc. Prof)',
      studentSubmissionDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
      feedbackHistory: [...(patient.feedbackHistory || []), newHistoryEntry],
    };

    onUpdatePatient(updatedPatient);
    alert(`Case History submitted for approval! Sent to your assigned Staff Guide: ${assignedStaffAccount?.name || 'Dr. Sunita Patil'}. Initial status: PENDING_STAFF.`);
  };

  // Calculate word & char count
  const calculateWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const fullScreenPlan = plans.find((p) => p.id === fullScreenPlanId);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-32 sm:pb-36 font-sans text-slate-800">
      {/* NOTIFICATION TOAST */}
      {saveNotification && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* 1. COMPACT HEADER */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs p-2.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-sm font-bold text-slate-900 tracking-tight truncate">
            Treatment Planning
          </h1>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="hidden xs:inline sm:inline">Saved</span>
              <span className="sm:hidden">{lastSavedTime === 'Just now' ? 'Saved' : lastSavedTime}</span>
              <span className="hidden sm:inline">: {lastSavedTime}</span>
            </span>

            {!isLocked && (
              <button
                type="button"
                onClick={handleAddPlanCard}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-teal-600 active:bg-teal-700 text-white text-xs font-bold rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Plan</span>
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg border border-slate-200/80 px-2.5 py-1.5 text-xs flex items-center gap-1.5 text-slate-700 font-medium min-w-0">
          <User className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="font-bold text-slate-900 truncate">{patient.name || 'Patient'}</span>
          <span className="text-slate-300 shrink-0">·</span>
          <span className="font-mono text-slate-600 truncate">{patient.patientId || patient.id}</span>
          {(patient.age || patient.gender) && (
            <>
              <span className="text-slate-300 shrink-0">·</span>
              <span className="text-slate-500 shrink-0 whitespace-nowrap">
                {patient.age ? `${patient.age}y` : ''}
                {patient.age && patient.gender ? ' ' : ''}
                {patient.gender || ''}
              </span>
            </>
          )}
        </div>
      </div>

      {/* 2. TREATMENT PLAN CARDS LIST WITH INLINE AI TOOLBAR */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const wordCount = calculateWordCount(plan.fullTextPlan);
          const isCollapsed = !!plan.isCollapsed;

          return (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-3.5 sm:p-5 space-y-3 transition-all"
            >
              {/* CARD HEADER */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      Treatment Plan {plan.planNumber}
                    </span>

                    <span
                      className={`text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                        plan.status === 'Submitted'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : plan.status === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {plan.status}
                    </span>

                    <span className="text-xs text-slate-400 hidden sm:inline">•</span>
                    <span className="text-xs text-slate-400 hidden sm:inline">{plan.dateTime}</span>
                  </div>

                  {/* EDITABLE TITLE */}
                  <input
                    type="text"
                    value={plan.title}
                    onChange={(e) => handleUpdateField(plan.id, 'title', e.target.value)}
                    disabled={isLocked}
                    placeholder={`Treatment Plan ${plan.planNumber} Title`}
                    className="text-sm sm:text-base font-black text-slate-900 w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none transition-all py-0.5"
                  />
                </div>

                {/* CARD ACTIONS */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center z-10 pointer-events-auto">
                  {/* DELETE BUTTON */}
                  {!isLocked && plans.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeletePlanCard(plan.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer pointer-events-auto"
                      title="Delete Plan Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  {/* COLLAPSE / EXPAND TOGGLE */}
                  <button
                    type="button"
                    onClick={() => handleToggleCollapse(plan.id)}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    title={isCollapsed ? 'Expand Plan' : 'Collapse Plan'}
                  >
                    {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CARD WRITING AREA (WHEN EXPANDED) */}
              {!isCollapsed && (
                <div className="space-y-2">
                  {/* 4. INLINE ACTION & AI ASSIST TOOLBAR */}
                  <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs overflow-x-auto">
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* AI ASSIST DROPDOWN */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowAiMenuPlanId(showAiMenuPlanId === plan.id ? null : plan.id)}
                          disabled={isLocked}
                          className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-extrabold flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          <Wand2 className="w-3.5 h-3.5 text-teal-600" />
                          <span>✨ AI Assist</span>
                          <ChevronDown className="w-3 h-3 text-teal-600" />
                        </button>

                        {showAiMenuPlanId === plan.id && (
                          <div className="absolute top-full left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 space-y-0.5 animate-fadeIn">
                            <button
                              type="button"
                              onClick={() => handleAiAction(plan.id, 'sequence')}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-teal-50 hover:text-teal-900 font-semibold flex items-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              <span>Suggest Wire Sequence</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAiAction(plan.id, 'refine')}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-teal-50 hover:text-teal-900 font-semibold flex items-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              <span>Refine Terminology</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAiAction(plan.id, 'retention')}
                              className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-teal-50 hover:text-teal-900 font-semibold flex items-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              <span>Check Retention Protocol</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {/* FORMAT LIST BUTTON */}
                      <button
                        type="button"
                        onClick={() => handleFormatList(plan.id)}
                        disabled={isLocked}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1 transition-all cursor-pointer"
                        title="Format lines with bullets"
                      >
                        <List className="w-3.5 h-3.5 text-slate-600" />
                        <span className="hidden sm:inline">Format List</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* FULL-SCREEN EXPAND BUTTON */}
                      <button
                        type="button"
                        onClick={() => setFullScreenPlanId(plan.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1 transition-all cursor-pointer text-xs"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Fullscreen</span>
                      </button>
                    </div>
                  </div>

                  {/* TEXTAREA WRITING CONTAINER (350px-400px HEIGHT, NO CLIPPING) */}
                  <div className="relative rounded-2xl border border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all shadow-2xs">
                    <textarea
                      value={plan.fullTextPlan}
                      onChange={(e) => handleUpdateField(plan.id, 'fullTextPlan', e.target.value)}
                      disabled={isLocked}
                      placeholder={DEFAULT_MAIN_PLACEHOLDER}
                      className="w-full p-4 text-xs sm:text-sm leading-relaxed text-slate-900 bg-transparent rounded-2xl focus:outline-none resize-y min-h-[360px] sm:min-h-[400px] font-sans pb-10"
                    />
                  </div>

                  {/* SEPARATE CLEAN WORD COUNT FOOTER BELOW TEXT BOX */}
                  <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 font-medium">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span><strong>{wordCount}</strong> words</span>
                      <span>•</span>
                      <span><strong>{plan.fullTextPlan.length}</strong> characters</span>
                    </div>

                    <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Auto-saved</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. BOTTOM WORKFLOW STATIC FOOTER ACTION BAR */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3 my-6">
        <div className="text-xs text-slate-500 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0" />
          <span>All plans linked to patient history & records.</span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSubmitToGuide}
            disabled={isLocked}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>Submit to Guide</span>
          </button>
        </div>
      </div>

      {/* FLOATING "+" BUTTON ISOLATED AT BOTTOM RIGHT */}
      {!isLocked && !fullScreenPlanId && (
        <div className="fixed bottom-20 sm:bottom-8 right-4 sm:right-6 z-30 pointer-events-auto">
          <button
            type="button"
            onClick={handleAddPlanCard}
            className="p-3.5 rounded-full bg-teal-600 hover:bg-teal-700 text-white shadow-xl flex items-center justify-center transition-all cursor-pointer active:scale-95 group hover:pr-4 border-2 border-white"
            title="Create another Treatment Plan card"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 text-xs font-black transition-all duration-300 uppercase tracking-wider">
              Add Plan
            </span>
          </button>
        </div>
      )}

      {/* FULL-SCREEN WRITING MODE OVERLAY (FULL COVERAGE OVER NAV BARS) */}
      {fullScreenPlan && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-md p-2 sm:p-6 pb-20 sm:pb-24 flex flex-col justify-between animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-5xl mx-auto flex-1 flex flex-col overflow-hidden shadow-2xl border border-slate-800 relative">
            {/* MODAL HEADER */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {fullScreenPlan.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient: {patient.name || 'Patient'} • ID: {patient.patientId || patient.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400 hidden sm:inline">
                  {calculateWordCount(fullScreenPlan.fullTextPlan)} words
                </span>
<button
                type="button"
                onClick={() => setFullScreenPlanId(null)}
                className="p-2 min-h-[48px] px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
              >
                  <Minimize2 className="w-4 h-4" />
                  <span>Exit Full Screen</span>
                </button>
              </div>
            </div>

            {/* FULL-SCREEN TEXTAREA SCROLL CONTAINER */}
            <div className="flex-1 p-4 sm:p-6 bg-white overflow-y-auto pb-20 scroll-pb-20">
              <textarea
                value={fullScreenPlan.fullTextPlan}
                onChange={(e) => handleUpdateField(fullScreenPlan.id, 'fullTextPlan', e.target.value)}
                disabled={isLocked}
                placeholder={DEFAULT_MAIN_PLACEHOLDER}
                className="w-full h-full min-h-[350px] text-sm sm:text-base leading-relaxed text-slate-900 bg-transparent focus:outline-none resize-none font-sans"
              />
            </div>

            {/* DEDICATED STICKY FOOTER ACTION BAR */}
            <div className="sticky bottom-0 bg-white px-4 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 z-40 shadow-lg">
              <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                <span>Auto-saved in real-time</span>
              </div>
              <button
                type="button"
                onClick={() => setFullScreenPlanId(null)}
                className="px-6 py-3 min-h-[48px] rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs sm:text-sm cursor-pointer transition-all active:scale-95 shadow-md flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Done Writing</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TabTreatmentPlan);
