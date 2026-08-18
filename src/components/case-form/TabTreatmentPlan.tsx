import React, { useState, useRef, useEffect } from 'react';
import {
  getCurrentUserAccount,
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
  Sparkles,
  FileText,
  ShieldCheck,
  List,
  Wand2,
  Mic,
  MicOff,
  Target,
  ClipboardList,
} from 'lucide-react';
import { PatientRecord, TreatmentPlanItem, StudentProfile } from '../../types';
import {
  normalizeOrthoSpeechText,
  polishOrthoDictationOffline,
  ORTHO_QUICK_MACROS,
} from '../../lib/orthoVoiceEngine';
import { generateOrthoTreatmentPlan } from '../../lib/orthoTreatmentPlanEngine';

interface TabTreatmentPlanProps {
  patient: PatientRecord;
  profile?: StudentProfile;
  onUpdatePatient?: (updated: PatientRecord) => void;
  isLocked?: boolean;
}

const DEFAULT_OBJECTIVES_PLACEHOLDER =
  '• Achieve aesthetic smile arc and facial soft tissue lip support...\n• Correct molar and canine relation...\n• Relieve crowding/spacing...';

const DEFAULT_PLAN_PLACEHOLDER =
  '1. APPLIANCE & ANCHORAGE:\n• Fixed Appliance: 0.022" MBT slot brackets\n• Anchorage: Transpalatal Arch (TPA)\n\n2. TREATMENT SEQUENCE:\n• Alignment & Leveling: 0.014" NiTi -> 0.016" NiTi -> 0.018" CuNiTi\n• Working: 0.019" x 0.025" Stainless Steel\n\n3. RETENTION:\n• Upper Hawley retainer & Lower bonded 3-3 retainer';

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
      ? 'Main Plan'
      : planNum === 2
      ? 'Alternative Plan'
      : `Plan ${planNum}`;

    const defaultObjectives = planNum === 1
      ? `• Achieve aesthetic smile arc and facial soft tissue lip support.
• Correct Class II molar and canine relation to Class I.
• Reduce overjet to 2.0 mm and level deep overbite.
• Relieve anterior crowding via non-extraction expansion and interproximal reduction (IPR).`
      : `• Objective 1: Improve facial profile & dental alignment
• Objective 2: Correct canine and molar occlusion`;

    const defaultPlanText = planNum === 1
      ? `1. APPLIANCE & ANCHORAGE SELECTION:
• Fixed Appliance: 0.022" MBT slot pre-adjusted edgewise metal brackets.
• Anchorage: Transpalatal Arch (TPA) for maxillary first molar stabilization.
• Biomechanics: Continuous arch wires, sliding mechanics, Class II intermaxillary elastics.

2. TREATMENT SEQUENCE:
• Alignment & Leveling: 0.014" NiTi -> 0.016" NiTi -> 0.018" CuNiTi archwires.
• Working Archwires: 0.019" x 0.025" Stainless Steel for arch expansion and torque control.
• Interproximal Reduction: Perform 2.5 mm lower anterior IPR to relieve lower crowding.
• Class II Correction: Class II elastics (3/16", 4.5 oz) bilateral full time.
• Finishing: 0.016" x 0.022" TMA detailing wires and settling elastics.

3. RETENTION & STABILITY:
• Maxillary: Upper Hawley retainer with labial bow.
• Mandibular: Fixed 3-3 canine-to-canine bonded lingual retainer.`
      : `1. APPLIANCE & ANCHORAGE SELECTION:
• Appliance: Alternative clear aligners or extraction therapy.

2. TREATMENT SEQUENCE:
• Phase 1: Space creation or arch expansion.
• Phase 2: Alignment & Space Closure.

3. RETENTION & STABILITY:
• Maxillary & Mandibular vacuum-formed retainers (VFRs).`;

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
      fullTextPlan: defaultPlanText,
      treatmentObjectives: defaultObjectives,
      phase1PreTreatment: '',
      phase2ActiveOrtho: '',
      phase3Retention: '',
      alternativePlan: '',
      patientInstructionsConsent: '',
    };
  };

  // State initialization with auto-migration for legacy single-block items
  const [plans, setPlans] = useState<TreatmentPlanItem[]>(() => {
    if (patient.treatmentPlanItems && patient.treatmentPlanItems.length > 0) {
      return patient.treatmentPlanItems.map((p) => {
        // Migration check: if treatmentObjectives is empty but fullTextPlan contains objectives block
        if (!p.treatmentObjectives && p.fullTextPlan && p.fullTextPlan.includes('1. TREATMENT OBJECTIVES:')) {
          const parts = p.fullTextPlan.split(/2\.\s+APPLIANCE/i);
          if (parts.length > 1) {
            const rawObjs = parts[0].replace(/1\.\s+TREATMENT OBJECTIVES:/i, '').trim();
            const rawPlan = `2. APPLIANCE${parts[1]}`.trim();
            return {
              ...p,
              treatmentObjectives: rawObjs,
              fullTextPlan: rawPlan,
            };
          }
        }
        return p;
      });
    }
    return [createPlanCard(1)];
  });

  const [fullScreenPlanId, setFullScreenPlanId] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string>('Just now');
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [showAiMenu, setShowAiMenu] = useState<{ planId: string; field: 'treatmentObjectives' | 'fullTextPlan' } | null>(null);
  const [planToDeleteId, setPlanToDeleteId] = useState<string | null>(null);

  // Speech Recognition / Voice Dictation State
  const [listeningState, setListeningState] = useState<{ planId: string; field: 'treatmentObjectives' | 'fullTextPlan' } | null>(null);
  const recognitionRef = useRef<any>(null);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Voice Dictation Toggle Handler
  const toggleSpeechRecognition = (planId: string, field: 'treatmentObjectives' | 'fullTextPlan') => {
    if (isLocked) return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    // If currently listening to the exact same field, stop it
    if (listeningState?.planId === planId && listeningState?.field === field) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setListeningState(null);
      return;
    }

    // Stop any active recognition before starting a new session
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setListeningState({ planId, field });
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalChunk += event.results[i][0].transcript + ' ';
          }
        }

        if (finalChunk.trim()) {
          const normalized = normalizeOrthoSpeechText(finalChunk);
          setPlans((prevPlans) => {
            const targetPlan = prevPlans.find((p) => p.id === planId);
            if (!targetPlan) return prevPlans;

            const existingValue = targetPlan[field] || '';
            const updatedValue = existingValue
              ? `${existingValue.trim()}\n• ${normalized}`
              : `• ${normalized}`;

            const updatedPlans = prevPlans.map((p) =>
              p.id === planId
                ? {
                    ...p,
                    [field]: updatedValue,
                    dateTime: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                  }
                : p
            );

            // Sync
            syncPatientRecord(updatedPlans, 'Voice dictation added text');
            return updatedPlans;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setListeningState(null);
      };

      recognition.onend = () => {
        setListeningState(null);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setListeningState(null);
    }
  };

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
          extractionDecision: (activePlan.fullTextPlan + activePlan.treatmentObjectives).toLowerCase().includes('extract')
            ? 'Extraction'
            : 'Non-Extraction',
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
          treatmentObjectives: activePlan.treatmentObjectives,
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

  // Create another Treatment Plan card
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
    setPlanToDeleteId(id);
  };

  const confirmDeletePlan = (id: string) => {
    if (isLocked) return;
    let updated: TreatmentPlanItem[] = [];
    if (plans.length > 1) {
      const filtered = plans.filter((p) => p.id !== id);
      updated = filtered.map((p, idx) => ({
        ...p,
        planNumber: idx + 1,
      }));
    } else {
      updated = [createPlanCard(1)];
    }
    syncPatientRecord(updated, 'Treatment plan deleted');
    setPlanToDeleteId(null);
  };

  // Toggle Collapse / Expand
  const handleToggleCollapse = (id: string) => {
    const updated = plans.map((p) => (p.id === id ? { ...p, isCollapsed: !p.isCollapsed } : p));
    setPlans(updated);
  };

  // Formatting Helper: Add Bullets to a specific field
  const handleFormatList = (planId: string, field: 'treatmentObjectives' | 'fullTextPlan') => {
    if (isLocked) return;
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const currentText = plan[field] || '';
    const lines = currentText.split('\n');
    const bulletedLines = lines.map((line) => {
      if (line.trim().length > 0 && !line.trim().startsWith('•') && !line.trim().match(/^\d+\./)) {
        return `• ${line}`;
      }
      return line;
    });

    handleUpdateField(planId, field, bulletedLines.join('\n'));
    syncPatientRecord(plans, 'Applied list formatting');
  };

  // Local Clinical Decision Engine Actions
  const handleAiAction = (
    planId: string,
    field: 'treatmentObjectives' | 'fullTextPlan',
    actionType: 'sequence' | 'refine' | 'retention' | 'objectives'
  ) => {
    if (isLocked) return;
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const enginePlan = generateOrthoTreatmentPlan(patient);
    let textToAppend = '';

    if (actionType === 'objectives') {
      const objPoints = enginePlan.treatmentObjectives.points.map((p) => p.text).join('\n');
      textToAppend = `\n${objPoints}`;
    } else if (actionType === 'sequence') {
      const seqPoints = enginePlan.treatmentSequence.points.map((p) => p.text).join('\n');
      textToAppend = `\n\n• TREATMENT SEQUENCE:\n${seqPoints}`;
    } else if (actionType === 'refine') {
      const biomech = enginePlan.biomechanics.points.map((p) => p.text).join('\n');
      const appliance = enginePlan.applianceSelection.points.map((p) => p.text).join('\n');
      textToAppend = `\n\n• BIOMECHANICS & APPLIANCE SELECTION:\n${appliance}\n\n${biomech}`;
    } else if (actionType === 'retention') {
      textToAppend = `\n\n• RETENTION PROTOCOL:
• Maxillary Arch: Upper Hawley retainer with labial bow (full-time 6 months, then night-time retention).
• Mandibular Arch: Bonded 3-3 canine-to-canine stainless steel lingual retainer.`;
    }

    const currentVal = plan[field] || '';
    const updatedText = currentVal ? `${currentVal}${textToAppend}` : textToAppend.trim();
    handleUpdateField(planId, field, updatedText);
    setShowAiMenu(null);
    syncPatientRecord(plans, 'Clinical recommendation inserted!');
  };

  // 100% Offline Quick-Macro append handler
  const handleAppendQuickMacro = (
    planId: string,
    field: 'treatmentObjectives' | 'fullTextPlan',
    macroText: string
  ) => {
    if (isLocked) return;
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const currentVal = plan[field] || '';
    const updatedVal = currentVal.trim()
      ? `${currentVal.trim()}\n• ${macroText}`
      : `• ${macroText}`;
    handleUpdateField(planId, field, updatedVal);
  };

  // Save & Finalize Record
  const handleSubmitToGuide = () => {
    const currentUser = getCurrentUserAccount();

    const updatedPlans = plans.map((p) => ({ ...p, status: 'Completed' as const }));
    const updatedPatient: PatientRecord = {
      ...patient,
      treatmentPlanItems: updatedPlans,
      approvalStatus: 'APPROVED',
      studentOwnerId: currentUser.id,
      studentSubmissionDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString(),
    };

    if (onUpdatePatient) {
      onUpdatePatient(updatedPatient);
    }
    setSaveNotification('Case History Record Completed & Saved! Ready for PDF Report export.');
    setTimeout(() => setSaveNotification(null), 3500);
  };

  // Calculate word count
  const calculateWordCount = (text: string) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const fullScreenPlan = plans.find((p) => p.id === fullScreenPlanId);

  return (
    <div className="space-y-3 max-w-5xl mx-auto pb-12 sm:pb-16 font-sans text-slate-800">
      {/* NOTIFICATION TOAST */}
      {saveNotification && (
        <div className="fixed top-16 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{saveNotification}</span>
        </div>
      )}

      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between gap-2 px-1 py-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-700">
            {plans.length} {plans.length === 1 ? 'Treatment Plan' : 'Treatment Plans'}
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-[11px] text-slate-500 font-medium truncate max-w-[220px] sm:max-w-none">
            {patient.name ? `${patient.name} (${patient.patientId || patient.id})` : patient.patientId || patient.id}
          </span>
        </div>

        {!isLocked && (
          <button
            type="button"
            onClick={handleAddPlanCard}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plan</span>
          </button>
        )}
      </div>

      {/* 2. TREATMENT PLAN CARDS LIST WITH TWO LARGE BOXES & VOICE DICTATION */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const isCollapsed = !!plan.isCollapsed;
          const objectivesWordCount = calculateWordCount(plan.treatmentObjectives);
          const planWordCount = calculateWordCount(plan.fullTextPlan);

          const isListeningObjectives =
            listeningState?.planId === plan.id && listeningState?.field === 'treatmentObjectives';
          const isListeningPlan =
            listeningState?.planId === plan.id && listeningState?.field === 'fullTextPlan';

          return (
            <div
              key={plan.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-5 space-y-3.5 transition-all"
            >
              {/* CARD HEADER */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs font-black text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200 shrink-0">
                    Plan {plan.planNumber}
                  </span>

                  {/* EDITABLE TITLE */}
                  <input
                    type="text"
                    value={plan.title}
                    onChange={(e) => handleUpdateField(plan.id, 'title', e.target.value)}
                    disabled={isLocked}
                    placeholder={`Plan ${plan.planNumber} Title`}
                    className="text-xs sm:text-sm font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none transition-all py-0.5 min-w-0 flex-1 truncate"
                  />

                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                      plan.status === 'Submitted'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : plan.status === 'Approved'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>

                {/* CARD ACTIONS */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* DELETE BUTTON */}
                  {!isLocked && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeletePlanCard(plan.id);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Delete Plan Card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* COLLAPSE / EXPAND TOGGLE */}
                  <button
                    type="button"
                    onClick={() => handleToggleCollapse(plan.id)}
                    className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-all cursor-pointer"
                    title={isCollapsed ? 'Expand Plan' : 'Collapse Plan'}
                  >
                    {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* CARD WRITING AREA (WHEN EXPANDED) */}
              {!isCollapsed && (
                <div className="space-y-4 pt-1">
                  {/* ==================== BOX 1: TREATMENT OBJECTIVES ==================== */}
                  <div className="space-y-1.5 rounded-2xl border border-teal-200/80 bg-teal-50/20 p-3 sm:p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-teal-600" />
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                          1. Treatment Objectives
                        </h4>
                        <span className="text-[10px] text-teal-700 bg-teal-100/70 font-semibold px-2 py-0.5 rounded-full">
                          Goals & Priorities
                        </span>
                      </div>

                      {/* BOX 1 TOOLBAR */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* VOICE DICTATION BUTTON */}
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => toggleSpeechRecognition(plan.id, 'treatmentObjectives')}
                            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer text-xs shadow-2xs ${
                              isListeningObjectives
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                            title={isListeningObjectives ? 'Click to stop listening' : 'Speak into microphone to dictate'}
                          >
                            {isListeningObjectives ? (
                              <>
                                <MicOff className="w-3.5 h-3.5 animate-bounce" />
                                <span>Listening... Stop</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-3.5 h-3.5 text-rose-600" />
                                <span>Dictate Voice</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* AI ASSIST FOR OBJECTIVES */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setShowAiMenu(
                                showAiMenu?.planId === plan.id && showAiMenu?.field === 'treatmentObjectives'
                                  ? null
                                  : { planId: plan.id, field: 'treatmentObjectives' }
                              )
                            }
                            disabled={isLocked}
                            className="px-2.5 py-1 rounded-lg bg-teal-100 hover:bg-teal-200 text-teal-900 border border-teal-300 font-extrabold flex items-center gap-1 transition-all cursor-pointer text-xs"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-teal-700" />
                            <span>✨ Engine Objectives</span>
                          </button>

                          {showAiMenu?.planId === plan.id && showAiMenu?.field === 'treatmentObjectives' && (
                            <div className="absolute top-full right-0 sm:left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 space-y-0.5 animate-fadeIn">
                              <button
                                type="button"
                                onClick={() => handleAiAction(plan.id, 'treatmentObjectives', 'objectives')}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-teal-50 font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                <span>Deterministic Objectives</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* BULLET FORMAT */}
                        <button
                          type="button"
                          onClick={() => handleFormatList(plan.id, 'treatmentObjectives')}
                          disabled={isLocked}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1 transition-all cursor-pointer text-xs"
                          title="Format lines with bullets"
                        >
                          <List className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        <span className="text-[11px] font-mono text-slate-500 pl-1">
                          {objectivesWordCount} w
                        </span>
                      </div>
                    </div>

                    {/* 100% OFFLINE QUICK MACROS ROW */}
                    {!isLocked && (
                      <div className="flex items-center gap-1.5 flex-wrap py-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">⚡ 100% Offline Quick Macros:</span>
                        {ORTHO_QUICK_MACROS.slice(0, 5).map((m) => (
                          <button
                            key={m.label}
                            type="button"
                            onClick={() => handleAppendQuickMacro(plan.id, 'treatmentObjectives', m.text)}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 transition-colors font-medium cursor-pointer"
                          >
                            + {m.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* LARGE TEXTAREA FOR OBJECTIVES */}
                    <div className="relative rounded-xl border border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all shadow-2xs">
                      <textarea
                        value={plan.treatmentObjectives || ''}
                        onChange={(e) => handleUpdateField(plan.id, 'treatmentObjectives', e.target.value)}
                        disabled={isLocked}
                        placeholder={DEFAULT_OBJECTIVES_PLACEHOLDER}
                        className="w-full p-4 sm:p-5 text-sm sm:text-base leading-relaxed text-slate-900 bg-transparent rounded-xl focus:outline-none resize-y min-h-[240px] sm:min-h-[300px] font-sans"
                      />
                    </div>
                  </div>

                  {/* ==================== BOX 2: TREATMENT PLANNING & EXECUTION ==================== */}
                  <div className="space-y-1.5 rounded-2xl border border-slate-300 bg-slate-50/40 p-3 sm:p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-1.5">
                        <ClipboardList className="w-4 h-4 text-slate-700" />
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                          2. Treatment Planning & Execution
                        </h4>
                        <span className="text-[10px] text-slate-600 bg-slate-200/80 font-semibold px-2 py-0.5 rounded-full">
                          Appliances, Mechanics & Sequence
                        </span>
                      </div>

                      {/* BOX 2 TOOLBAR */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* VOICE DICTATION BUTTON */}
                        {!isLocked && (
                          <button
                            type="button"
                            onClick={() => toggleSpeechRecognition(plan.id, 'fullTextPlan')}
                            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer text-xs shadow-2xs ${
                              isListeningPlan
                                ? 'bg-rose-600 text-white animate-pulse'
                                : 'bg-white hover:bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                            title={isListeningPlan ? 'Click to stop listening' : 'Speak into microphone to dictate'}
                          >
                            {isListeningPlan ? (
                              <>
                                <MicOff className="w-3.5 h-3.5 animate-bounce" />
                                <span>Listening... Stop</span>
                              </>
                            ) : (
                              <>
                                <Mic className="w-3.5 h-3.5 text-rose-600" />
                                <span>Dictate Voice</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* AI ASSIST FOR PLANNING */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setShowAiMenu(
                                showAiMenu?.planId === plan.id && showAiMenu?.field === 'fullTextPlan'
                                  ? null
                                  : { planId: plan.id, field: 'fullTextPlan' }
                              )
                            }
                            disabled={isLocked}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-extrabold flex items-center gap-1 transition-all cursor-pointer text-xs"
                          >
                            <Wand2 className="w-3.5 h-3.5 text-teal-600" />
                            <span>✨ Engine Plan</span>
                          </button>

                          {showAiMenu?.planId === plan.id && showAiMenu?.field === 'fullTextPlan' && (
                            <div className="absolute top-full right-0 sm:left-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-30 space-y-0.5 animate-fadeIn">
                              <button
                                type="button"
                                onClick={() => handleAiAction(plan.id, 'fullTextPlan', 'sequence')}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-teal-50 hover:text-teal-900 font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                <span>Suggest Wire Sequence</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAiAction(plan.id, 'fullTextPlan', 'refine')}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-teal-50 hover:text-teal-900 font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                <span>Refine Terminology</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAiAction(plan.id, 'fullTextPlan', 'retention')}
                                className="w-full text-left px-3 py-1.5 text-xs text-slate-800 hover:bg-teal-50 hover:text-teal-900 font-semibold flex items-center gap-2 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                                <span>Check Retention Protocol</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* BULLET FORMAT */}
                        <button
                          type="button"
                          onClick={() => handleFormatList(plan.id, 'fullTextPlan')}
                          disabled={isLocked}
                          className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center gap-1 transition-all cursor-pointer text-xs"
                          title="Format lines with bullets"
                        >
                          <List className="w-3.5 h-3.5 text-slate-600" />
                        </button>

                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] pl-1">
                          <span>{planWordCount} w</span>
                          {/* FULL-SCREEN EXPAND BUTTON */}
                          <button
                            type="button"
                            onClick={() => setFullScreenPlanId(plan.id)}
                            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1 transition-all cursor-pointer text-xs"
                          >
                            <Maximize2 className="w-3 h-3" />
                            <span>Fullscreen</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 100% OFFLINE QUICK MACROS ROW */}
                    {!isLocked && (
                      <div className="flex items-center gap-1.5 flex-wrap py-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">⚡ 100% Offline Quick Macros:</span>
                        {ORTHO_QUICK_MACROS.slice(4, 10).map((m) => (
                          <button
                            key={m.label}
                            type="button"
                            onClick={() => handleAppendQuickMacro(plan.id, 'fullTextPlan', m.text)}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 transition-colors font-medium cursor-pointer"
                          >
                            + {m.label}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* LARGE TEXTAREA FOR TREATMENT PLANNING */}
                    <div className="relative rounded-xl border border-slate-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all shadow-2xs">
                      <textarea
                        value={plan.fullTextPlan}
                        onChange={(e) => handleUpdateField(plan.id, 'fullTextPlan', e.target.value)}
                        disabled={isLocked}
                        placeholder={DEFAULT_PLAN_PLACEHOLDER}
                        className="w-full p-4 sm:p-5 text-sm sm:text-base leading-relaxed text-slate-900 bg-transparent rounded-xl focus:outline-none resize-y min-h-[420px] sm:min-h-[520px] font-sans"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. BOTTOM WORKFLOW STATIC FOOTER ACTION BAR */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-2.5 my-3">
        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>All plans linked to patient history & records.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleSubmitToGuide}
            disabled={isLocked}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Save & Finalize Record</span>
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

      {/* FULL-SCREEN WRITING MODE OVERLAY */}
      {fullScreenPlan && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/95 backdrop-blur-md p-2 sm:p-6 pb-20 sm:pb-24 flex flex-col justify-between animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-5xl mx-auto flex-1 flex flex-col overflow-hidden shadow-2xl border border-slate-800 relative">
            {/* MODAL HEADER */}
            <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-teal-400" />
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">
                    {fullScreenPlan.title} — Fullscreen Mode
                  </h3>
                  <p className="text-xs text-slate-400">
                    Patient: {patient.name || 'Patient'} • ID: {patient.patientId || patient.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFullScreenPlanId(null)}
                  className="p-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Exit Fullscreen</span>
                </button>
              </div>
            </div>

            {/* FULL-SCREEN SCROLL CONTAINER WITH BOTH BOXES */}
            <div className="flex-1 p-4 sm:p-6 bg-white overflow-y-auto space-y-6 pb-20">
              {/* OBJECTIVES IN FULLSCREEN */}
              <div className="space-y-2 border border-teal-200 bg-teal-50/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-teal-600" />
                    <h4 className="text-base font-black text-slate-900">1. Treatment Objectives</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSpeechRecognition(fullScreenPlan.id, 'treatmentObjectives')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      listeningState?.planId === fullScreenPlan.id && listeningState?.field === 'treatmentObjectives'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-white text-rose-700 border border-rose-200'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-rose-600" />
                    <span>
                      {listeningState?.planId === fullScreenPlan.id && listeningState?.field === 'treatmentObjectives'
                        ? 'Listening...'
                        : 'Dictate Voice'}
                    </span>
                  </button>
                </div>
                <textarea
                  value={fullScreenPlan.treatmentObjectives || ''}
                  onChange={(e) => handleUpdateField(fullScreenPlan.id, 'treatmentObjectives', e.target.value)}
                  disabled={isLocked}
                  placeholder={DEFAULT_OBJECTIVES_PLACEHOLDER}
                  className="w-full min-h-[260px] p-5 text-sm sm:text-base leading-relaxed text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 font-sans"
                />
              </div>

              {/* TREATMENT PLANNING IN FULLSCREEN */}
              <div className="space-y-2 border border-slate-300 bg-slate-50/50 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-slate-800" />
                    <h4 className="text-base font-black text-slate-900">2. Treatment Planning & Execution</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleSpeechRecognition(fullScreenPlan.id, 'fullTextPlan')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                      listeningState?.planId === fullScreenPlan.id && listeningState?.field === 'fullTextPlan'
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-white text-rose-700 border border-rose-200'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-rose-600" />
                    <span>
                      {listeningState?.planId === fullScreenPlan.id && listeningState?.field === 'fullTextPlan'
                        ? 'Listening...'
                        : 'Dictate Voice'}
                    </span>
                  </button>
                </div>
                <textarea
                  value={fullScreenPlan.fullTextPlan || ''}
                  onChange={(e) => handleUpdateField(fullScreenPlan.id, 'fullTextPlan', e.target.value)}
                  disabled={isLocked}
                  placeholder={DEFAULT_PLAN_PLACEHOLDER}
                  className="w-full min-h-[480px] p-5 text-sm sm:text-base leading-relaxed text-slate-900 bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-teal-500 font-sans"
                />
              </div>
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

      {/* DELETE CONFIRMATION MODAL */}
      {planToDeleteId && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setPlanToDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm w-full p-5 space-y-4 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-2xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Treatment Plan?</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {plans.length > 1
                    ? 'Are you sure you want to delete this treatment plan?'
                    : 'This will reset the treatment plan to a clean draft.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPlanToDeleteId(null)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmDeletePlan(planToDeleteId)}
                className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-2xs cursor-pointer"
              >
                Delete Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TabTreatmentPlan);
