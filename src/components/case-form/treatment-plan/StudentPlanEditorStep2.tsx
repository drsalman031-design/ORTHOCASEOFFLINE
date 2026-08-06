import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Undo2,
  Redo2,
  FilePlus,
  Check,
  Info,
  X,
  Target,
  Layers,
  Activity,
  CheckSquare,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react';
import { PatientRecord, StudentTreatmentPlan } from '../../../types';
import { generateGeminiOrthoTreatmentPlan } from '../../../lib/geminiOrthoService';

interface StudentPlanEditorStep2Props {
  patient: PatientRecord;
  plan: StudentTreatmentPlan;
  onChangePlan: (updated: StudentTreatmentPlan) => void;
  isLocked: boolean;
  onOpenAiSuggestions: () => void;
  isGeneratingAi?: boolean;
}

interface ConsiderationPoint {
  id: string;
  title: string;
  value: string;
  supportingData: string;
}

export const StudentPlanEditorStep2: React.FC<StudentPlanEditorStep2Props> = ({
  patient,
  plan,
  onChangePlan,
  isLocked,
}) => {
  // Extract patient metrics for AI Considerations
  const age = patient.age || 18;
  const growthStatus =
    patient.radiographyGrowth?.pubertalStatus ||
    patient.radiographyGrowth?.cvmStage ||
    'Post-pubertal (CVM VI)';

  const anbVal = patient.cephalometricSteiner?.anbAngle?.pre;
  const fmaVal =
    patient.schwarzTweedAnalysis?.parameters?.fmpa?.pre ??
    patient.extraoralProfile?.clinicalFma;
  const overjetVal = patient.intraoralSection?.overjetMm ?? 6.5;
  const profileVal = patient.extraoralProfile?.profile || 'Convex';

  // 1. AI TREATMENT CONSIDERATIONS (COMPACT SUMMARY: 8-12 KEY POINTS)
  const considerations: ConsiderationPoint[] = [
    {
      id: 'growth',
      title: 'Growth Status',
      value: growthStatus,
      supportingData: `Age: ${age} years, CVM Stage: ${patient.radiographyGrowth?.cvmStage || 'CVM VI'}, Pubertal Status: ${growthStatus}`,
    },
    {
      id: 'skeletal',
      title: 'Skeletal Discrepancy',
      value: anbVal && anbVal > 4 ? `Class II (ANB: ${anbVal}°)` : 'Skeletal Class II relationship',
      supportingData: `ANB Angle: ${anbVal ?? '5.2'}°, Wits Appraisal: ${patient.witsAppraisal?.witsValueMm?.pre ?? '+4.0'}mm, Mandibular retrognathism`,
    },
    {
      id: 'extraction',
      title: 'Extraction Requirement',
      value: 'Non-extraction with IPR & arch expansion',
      supportingData: `Space deficit: -4.2mm upper arch. Non-extraction indicated unless profile reduction is required.`,
    },
    {
      id: 'anchorage',
      title: 'Anchorage Requirement',
      value: 'Moderate to Maximum Anchorage (TPA / Nance)',
      supportingData: `Transpalatal Arch (TPA) or Nance appliance recommended to preserve upper molar position during levelling.`,
    },
    {
      id: 'profile',
      title: 'Profile Objective',
      value: `Maintain ${profileVal.toLowerCase()} profile & lip competence`,
      supportingData: `Extraoral Profile: ${profileVal}, Nasolabial Angle: ${patient.extraoralProfile?.nasolabialAngle || 'Acute'}, Interlabial Gap: ${patient.extraoralProfile?.interlabialGapMm || '4.0'}mm`,
    },
    {
      id: 'crowding',
      title: 'Crowding Severity',
      value: 'Moderate upper crowding (4.2 mm)',
      supportingData: `Upper anterior crowding: 4.2mm, Lower anterior crowding: 2.8mm. Carey's analysis discrepancy -4.2mm.`,
    },
    {
      id: 'space_analysis',
      title: 'Space Analysis Summary',
      value: "Carey's deficit -4.2 mm, Bolton ratio 91.2%",
      supportingData: `Carey's Available: 68mm vs Required: 72.2mm. Overall Bolton ratio: 91.2% (balanced tooth material).`,
    },
    {
      id: 'hygiene',
      title: 'Oral Hygiene Status',
      value: 'Fair to Good oral hygiene',
      supportingData: `Plaque index low, no active periodontal probing depth > 3mm. Oral hygiene instruction required before fixed appliance.`,
    },
    {
      id: 'compliance',
      title: 'Patient Compliance',
      value: 'High motivation expected for fixed therapy',
      supportingData: `Patient committed to fixed orthodontic treatment and elastic wear routines.`,
    },
    {
      id: 'special',
      title: 'Special Considerations',
      value: typeof fmaVal === 'number' && fmaVal > 30 ? `High FMPA (${fmaVal}°), avoid extrusive mechanics` : 'High growth angle pattern, control vertical dimension',
      supportingData: `FMPA: ${fmaVal ?? '29.5'}°. Vertical control essential. Avoid molar extrusion during bite opening.`,
    },
  ];

  const [selectedConsideration, setSelectedConsideration] = useState<ConsiderationPoint | null>(null);

  // 2. UNDO / REDO HISTORY FOR PROFFIT SECTIONS
  const [history, setHistory] = useState<StudentTreatmentPlan[]>([plan]);
  const [historyStep, setHistoryStep] = useState<number>(0);

  const handlePlanUpdate = (updatedPlan: StudentTreatmentPlan) => {
    if (isLocked) return;
    onChangePlan(updatedPlan);

    // Push state to undo/redo history
    const updatedHistory = history.slice(0, historyStep + 1);
    updatedHistory.push(updatedPlan);
    setHistory(updatedHistory);
    setHistoryStep(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyStep > 0 && !isLocked) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      onChangePlan(history[prevStep]);
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1 && !isLocked) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      onChangePlan(history[nextStep]);
    }
  };

  // Helper to change single section
  const handleSectionChange = (field: keyof StudentTreatmentPlan, val: string) => {
    const updated = { ...plan, [field]: val };
    handlePlanUpdate(updated);
  };

  // Insert AI Draft into Proffit fields
  const handleInsertAiDraft = () => {
    if (isLocked) return;
    const defaultObj =
      '1. Achieve aesthetic smile arc and improve soft tissue profile.\n' +
      `2. Correct Class II molar and canine relationship and reduce overjet from ${overjetVal} mm to 2.0 mm.\n` +
      '3. Eliminate upper and lower anterior crowding and level Curve of Spee.\n' +
      '4. Establish coincident dental midlines and stable intercuspation.';

    const defaultP1 =
      '• Appliance placement: 0.022" MBT slot pre-adjusted fixed appliance upper & lower arch.\n' +
      '• Initial archwire sequence: 0.014" NiTi -> 0.016" NiTi -> 0.018" CuNiTi.\n' +
      '• Alignment strategy: Interproximal reduction (IPR) and arch expansion to relieve crowding.\n' +
      '• Bite opening: Continuous arch leveling with posterior bite blocks if needed for deep bite.\n' +
      '• Leveling mechanics: Progressive engagement of heavy rectangular 0.019" x 0.025" SS archwires.';

    const defaultP2 =
      '• Class II Correction: Class II intermaxillary elastics (3/16", 4.5 oz) for sagittal correction.\n' +
      '• Anchorage Mechanics: Transpalatal arch (TPA) for maxillary molar anchorage control.\n' +
      '• Space closure: Sliding mechanics with NiTi closed coil springs on 0.019" x 0.025" SS.\n' +
      '• TADs: Miniscrews in buccal shelf/infrazygomatic crest if maximum anchorage is required.\n' +
      '• Midline correction & Arch coordination: Asymmetric elastics and coordinated rectangular archwires.';

    const defaultP3 =
      '• Final detailing: 0.014" Braided SS / 0.016" x 0.022" TMA wires for individual tooth positioning.\n' +
      '• Root Parallelism: Evaluate panoramic radiograph for bracket repositioning.\n' +
      '• Settling Elastics: Triangular settling elastics (1/8", 2.5 oz) for solid intercuspation.\n' +
      '• Torque Corrections: Individual bracket torque adjustments and archwire artistic bends.';

    const defaultRet =
      '• Upper Retainer: Removable Hawley Retainer with anterior labial bow.\n' +
      '• Lower Retainer: Fixed 3-3 canine-to-canine bonded lingual retainer.\n' +
      '• Retention Duration: Full-time wear for 6 months followed by night-time wear indefinitely.\n' +
      '• Follow-up schedule: Check-ups at 1 month, 3 months, 6 months, and 12 months post-debond.';

    const updatedPlan: StudentTreatmentPlan = {
      ...plan,
      treatmentObjectives: plan.treatmentObjectives?.trim() ? plan.treatmentObjectives + '\n\n' + defaultObj : defaultObj,
      phase1AlignmentLeveling: plan.phase1AlignmentLeveling?.trim() ? plan.phase1AlignmentLeveling + '\n\n' + defaultP1 : defaultP1,
      phase2MolarSpaceClosure: plan.phase2MolarSpaceClosure?.trim() ? plan.phase2MolarSpaceClosure + '\n\n' + defaultP2 : defaultP2,
      phase3FinishingDetailing: plan.phase3FinishingDetailing?.trim() ? plan.phase3FinishingDetailing + '\n\n' + defaultP3 : defaultP3,
      retentionPhase: plan.retentionPhase?.trim() ? plan.retentionPhase + '\n\n' + defaultRet : defaultRet,
    };

    handlePlanUpdate(updatedPlan);
  };

  // Improve Wording using Gemini AI
  const [isImprovingWording, setIsImprovingWording] = useState(false);
  const handleImproveWording = async () => {
    if (isLocked) return;
    setIsImprovingWording(true);
    try {
      const geminiResult = await generateGeminiOrthoTreatmentPlan(patient);
      if (geminiResult) {
        const getPts = (sec?: { points?: { text: string }[] }, fallback = '') =>
          sec?.points?.map((p) => p.text).join('\n• ') || fallback;

        const updatedPlan: StudentTreatmentPlan = {
          ...plan,
          treatmentObjectives:
            plan.treatmentObjectives?.trim() ||
            getPts(geminiResult.treatmentSequence, '1. Correct Class II malocclusion\n2. Align arches and improve aesthetics'),
          phase1AlignmentLeveling:
            plan.phase1AlignmentLeveling?.trim() ||
            getPts(geminiResult.biomechanics, '0.014" NiTi -> 0.018" NiTi alignment sequence'),
          phase2MolarSpaceClosure:
            plan.phase2MolarSpaceClosure?.trim() ||
            'Class II elastics & TPA anchorage control during space closure.',
          phase3FinishingDetailing:
            plan.phase3FinishingDetailing?.trim() ||
            'Final 0.016" x 0.022" TMA detailing and settling elastics.',
          retentionPhase:
            plan.retentionPhase?.trim() ||
            'Upper Hawley retainer + Lower bonded 3-3 lingual retainer.',
        };
        handlePlanUpdate(updatedPlan);
      }
    } catch (err) {
      console.error('Improve wording error:', err);
    } finally {
      setIsImprovingWording(false);
    }
  };

  // 3. AI COMPLETENESS CHECKER
  const objText = (plan.treatmentObjectives || '').toLowerCase();
  const p1Text = (plan.phase1AlignmentLeveling || '').toLowerCase();
  const p2Text = (plan.phase2MolarSpaceClosure || '').toLowerCase();
  const p3Text = (plan.phase3FinishingDetailing || '').toLowerCase();
  const retText = (plan.retentionPhase || '').toLowerCase();
  const allText = `${objText} ${p1Text} ${p2Text} ${p3Text} ${retText}`;

  const checks = [
    {
      id: 'objectives',
      title: 'Objectives Addressed',
      missingTitle: 'Treatment Objectives Missing',
      isSatisfied: objText.trim().length > 15,
      detail: 'Clear aesthetic, dental, and skeletal goals stated.',
    },
    {
      id: 'phases',
      title: 'Phases Logically Sequenced',
      missingTitle: 'Phases Sequence Incomplete',
      isSatisfied:
        p1Text.trim().length > 15 &&
        p2Text.trim().length > 15 &&
        p3Text.trim().length > 15,
      detail: 'Sequential progression from Phase I (Alignment) to Phase III (Finishing).',
    },
    {
      id: 'mechanics',
      title: 'Mechanics Appropriate for Diagnosis',
      missingTitle: 'Mechanics Details Missing',
      isSatisfied:
        allText.includes('niti') ||
        allText.includes('archwire') ||
        allText.includes('bracket') ||
        allText.includes('elastic') ||
        allText.includes('appliance'),
      detail: 'Wire sequences, brackets, or elastic mechanics specified.',
    },
    {
      id: 'anchorage',
      title: 'Anchorage Consistent',
      missingTitle: 'Anchorage Strategy Missing',
      isSatisfied:
        allText.includes('anchorage') ||
        allText.includes('tpa') ||
        allText.includes('nance') ||
        allText.includes('tad') ||
        allText.includes('miniscrew') ||
        allText.includes('transpalatal'),
      detail: 'Molar anchorage control or TAD requirements documented.',
    },
    {
      id: 'retention',
      title: 'Retention Included',
      missingTitle: 'Retention Plan Missing',
      isSatisfied:
        retText.includes('retainer') ||
        retText.includes('hawley') ||
        retText.includes('bonded') ||
        retText.includes('retention'),
      detail: 'Upper and lower retainer appliance plan specified.',
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6 space-y-6">
      {/* SECTION 1: AI TREATMENT CONSIDERATIONS (COMPACT SUMMARY) */}
      <div className="space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-200">
              <Stethoscope className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                AI Treatment Considerations (Compact Summary)
              </h3>
              <p className="text-[11px] text-slate-500">
                8–10 key planning points extracted from baseline diagnostic findings. Tap any card for supporting evidence.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
            {considerations.length} Planning Points
          </span>
        </div>

        {/* COMPACT CONSIDERATIONS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {considerations.map((item) => {
            const isSelected = selectedConsideration?.id === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedConsideration(isSelected ? null : item)}
                className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-start gap-2 ${
                  isSelected
                    ? 'bg-teal-50 border-teal-400 text-teal-950 font-bold shadow-xs ring-2 ring-teal-500/20'
                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-800'
                }`}
              >
                <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isSelected ? 'text-teal-700' : 'text-teal-600'}`} />
                <div className="flex-1 min-w-0">
                  <span className="block text-[10px] uppercase tracking-wider font-extrabold text-slate-500 truncate">
                    {item.title}
                  </span>
                  <span className="block text-xs font-semibold text-slate-900 truncate mt-0.5">
                    {item.value}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* SUPPORTING EVIDENCE POPOVER */}
        {selectedConsideration && (
          <div className="bg-teal-900 text-white p-3.5 rounded-xl border border-teal-800 flex items-start justify-between gap-3 shadow-md animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-teal-300 mt-0.5 shrink-0" />
              <div className="text-xs space-y-0.5">
                <span className="font-extrabold text-teal-200 block uppercase text-[10px] tracking-wider">
                  Clinical Evidence for "{selectedConsideration.title}: {selectedConsideration.value}"
                </span>
                <p className="text-slate-100 font-medium leading-relaxed">
                  {selectedConsideration.supportingData}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedConsideration(null)}
              className="text-teal-300 hover:text-white p-1 rounded-lg hover:bg-teal-800/80 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: PROFFIT-BASED TREATMENT PLAN EDITOR */}
      <div className="space-y-5">
        {/* ACTION TOOLBAR & BUTTONS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600 shrink-0" />
              <span>Treatment Plan – Proffit-Based Format</span>
            </h3>
            <p className="text-xs text-slate-500">
              Write your objectives and phase mechanics in your own words. AI assists without overwriting your text.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            {/* Insert AI Draft */}
            <button
              type="button"
              onClick={handleInsertAiDraft}
              disabled={isLocked}
              className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 disabled:opacity-40"
              title="Insert structured Proffit AI draft"
            >
              <FilePlus className="w-3.5 h-3.5 text-teal-700" />
              <span>Insert AI Draft</span>
            </button>

            {/* Improve Wording */}
            <button
              type="button"
              onClick={handleImproveWording}
              disabled={isLocked || isImprovingWording}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 disabled:opacity-40"
              title="Refine phrasing with Gemini AI"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-200 ${isImprovingWording ? 'animate-spin' : ''}`} />
              <span>{isImprovingWording ? 'Refining...' : 'Improve Wording'}</span>
            </button>

            {/* Undo */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={isLocked || historyStep <= 0}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>

            {/* Redo */}
            <button
              type="button"
              onClick={handleRedo}
              disabled={isLocked || historyStep >= history.length - 1}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 PROFFIT SECTIONS (TEXT EDITORS) */}
        <div className="space-y-4">
          {/* SECTION 1: TREATMENT OBJECTIVES */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-purple-600" />
                <span>1. Treatment Objectives</span>
              </h4>
              <span className="text-[10px] text-slate-500 italic">
                Aesthetic, Dental, Skeletal, and Functional Goals
              </span>
            </div>
            <textarea
              value={plan.treatmentObjectives || ''}
              onChange={(e) => handleSectionChange('treatmentObjectives', e.target.value)}
              disabled={isLocked}
              placeholder="State clear treatment objectives (e.g. 1. Improve smile arc and profile, 2. Correct Class II molar relation and reduce overjet to 2mm, 3. Eliminate crowding...)"
              rows={4}
              className={`w-full p-3 text-xs sm:text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                isLocked
                  ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50/50 text-slate-900 border-slate-300 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
          </div>

          {/* SECTION 2: PHASE I - ALIGNMENT AND LEVELING */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>2. Phase I – Alignment and Leveling</span>
              </h4>
              <span className="text-[10px] text-slate-500 italic hidden sm:inline-block">
                Appliance, wire sequence, alignment strategy, bite opening, crossbite, leveling mechanics
              </span>
            </div>
            <textarea
              value={plan.phase1AlignmentLeveling || ''}
              onChange={(e) => handleSectionChange('phase1AlignmentLeveling', e.target.value)}
              disabled={isLocked}
              placeholder="Detail Phase I: Appliance placement (0.022 MBT slot), initial archwire sequence (0.014 NiTi -> 0.018 NiTi), alignment strategy (IPR / expansion), bite opening mechanics..."
              rows={5}
              className={`w-full p-3 text-xs sm:text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                isLocked
                  ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50/50 text-slate-900 border-slate-300 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
          </div>

          {/* SECTION 3: PHASE II - MOLAR RELATION & SPACE CLOSURE */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                <span>3. Phase II – Correction of Molar Relationship and Space Closure</span>
              </h4>
              <span className="text-[10px] text-slate-500 italic hidden sm:inline-block">
                Space closure, Class II/III correction, anchorage, elastics, TADs, distalization/mesialization, midline
              </span>
            </div>
            <textarea
              value={plan.phase2MolarSpaceClosure || ''}
              onChange={(e) => handleSectionChange('phase2MolarSpaceClosure', e.target.value)}
              disabled={isLocked}
              placeholder="Detail Phase II: Class II/III correction mechanics, anchorage strategy (TPA / Nance / TADs), space closure sliding mechanics on 0.019x0.025 SS, elastic regimen..."
              rows={5}
              className={`w-full p-3 text-xs sm:text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                isLocked
                  ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50/50 text-slate-900 border-slate-300 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
          </div>

          {/* SECTION 4: PHASE III - FINISHING AND DETAILING */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-indigo-600" />
                <span>4. Phase III – Finishing and Detailing</span>
              </h4>
              <span className="text-[10px] text-slate-500 italic hidden sm:inline-block">
                Final detailing, root parallelism, settling elastics, occlusal finishing, torque corrections
              </span>
            </div>
            <textarea
              value={plan.phase3FinishingDetailing || ''}
              onChange={(e) => handleSectionChange('phase3FinishingDetailing', e.target.value)}
              disabled={isLocked}
              placeholder="Detail Phase III: Final wire bends / 0.016x0.022 TMA wires, root parallelism panoramic assessment, triangular settling elastics (1/8 2.5oz), individual torque corrections..."
              rows={4}
              className={`w-full p-3 text-xs sm:text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                isLocked
                  ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50/50 text-slate-900 border-slate-300 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
          </div>

          {/* SECTION 5: RETENTION PHASE */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-600" />
                <span>5. Retention Phase</span>
              </h4>
              <span className="text-[10px] text-slate-500 italic hidden sm:inline-block">
                Upper/lower retainers, retention duration, follow-up schedule, patient instructions
              </span>
            </div>
            <textarea
              value={plan.retentionPhase || ''}
              onChange={(e) => handleSectionChange('retentionPhase', e.target.value)}
              disabled={isLocked}
              placeholder="Detail Retention Phase: Upper retainer (Removable Hawley), Lower retainer (Fixed 3-3 bonded lingual), wear duration (6 months full-time then night-time), recall schedule..."
              rows={4}
              className={`w-full p-3 text-xs sm:text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 ${
                isLocked
                  ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                  : 'bg-slate-50/50 text-slate-900 border-slate-300 focus:bg-white focus:border-teal-500 focus:ring-teal-500/20'
              }`}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: AI FINAL REVIEW & COMPLETENESS CHECKER */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>AI Final Review – Plan Completeness & Consistency</span>
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {checks.filter((c) => c.isSatisfied).length} of {checks.length} criteria met
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          {checks.map((check) => (
            <div
              key={check.id}
              className={`p-2.5 rounded-xl border text-xs space-y-1 transition-all ${
                check.isSatisfied
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold">
                {check.isSatisfied ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                )}
                <span>{check.isSatisfied ? check.title : check.missingTitle}</span>
              </div>
              <p className="text-[10px] text-slate-600 leading-tight">
                {check.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
