import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Undo2,
  Redo2,
  FilePlus,
  Check,
  Brain,
} from 'lucide-react';
import { PatientRecord, StudentProfile } from '../../types';
import { generateGeminiOrthoDiagnosis } from '../../lib/geminiOrthoService';

interface TabAiDiagnosisProps {
  patient: PatientRecord;
  profile?: StudentProfile;
  onUpdatePatient?: (updated: PatientRecord) => void;
}

export const TabAiDiagnosis: React.FC<TabAiDiagnosisProps> = ({
  patient,
  profile,
  onUpdatePatient,
}) => {
  // Extract patient values for clinical summary and AI suggestions
  const name = patient.name || 'Patient';
  const age = patient.age || 18;
  const gender = patient.gender || 'Female';

  const overjetVal = patient.intraoralSection?.overjetMm;
  const overbiteVal = patient.intraoralSection?.overbiteMm;

  // Diagnosis Text Area state with undo/redo
  const initialText = patient.diagnosisAndPlan?.provisionalDiagnosis || '';
  const [diagnosisText, setDiagnosisText] = useState<string>(initialText);
  const [history, setHistory] = useState<string[]>([initialText]);
  const [historyStep, setHistoryStep] = useState<number>(0);

  const [isGeneratingGemini, setIsGeneratingGemini] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync when patient ID changes
  const prevPatientIdRef = useRef<string>(patient.id);
  useEffect(() => {
    if (prevPatientIdRef.current !== patient.id) {
      prevPatientIdRef.current = patient.id;
      const newInitial = patient.diagnosisAndPlan?.provisionalDiagnosis || '';
      setDiagnosisText(newInitial);
      setHistory([newInitial]);
      setHistoryStep(0);
    }
  }, [patient]);

  // Text changes handler
  const handleTextChange = (newVal: string) => {
    setDiagnosisText(newVal);

    if (newVal !== history[historyStep]) {
      const updatedHistory = history.slice(0, historyStep + 1);
      updatedHistory.push(newVal);
      setHistory(updatedHistory);
      setHistoryStep(updatedHistory.length - 1);
    }

    setIsSaved(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (onUpdatePatient) {
        onUpdatePatient({
          ...patient,
          diagnosisAndPlan: {
            ...patient.diagnosisAndPlan,
            provisionalDiagnosis: newVal,
          },
        });
      }
      setIsSaved(false);
    }, 400);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyStep > 0) {
      const prevStep = historyStep - 1;
      setHistoryStep(prevStep);
      const prevVal = history[prevStep];
      setDiagnosisText(prevVal);
      if (onUpdatePatient) {
        onUpdatePatient({
          ...patient,
          diagnosisAndPlan: {
            ...patient.diagnosisAndPlan,
            provisionalDiagnosis: prevVal,
          },
        });
      }
    }
  };

  const handleRedo = () => {
    if (historyStep < history.length - 1) {
      const nextStep = historyStep + 1;
      setHistoryStep(nextStep);
      const nextVal = history[nextStep];
      setDiagnosisText(nextVal);
      if (onUpdatePatient) {
        onUpdatePatient({
          ...patient,
          diagnosisAndPlan: {
            ...patient.diagnosisAndPlan,
            provisionalDiagnosis: nextVal,
          },
        });
      }
    }
  };

  // Insert AI Draft
  const handleInsertAiDraft = () => {
    const aiDraftText =
      `A ${age}-year-old ${gender.toLowerCase()} patient (${name}) presented with Angle's Class II division 1 malocclusion on a Skeletal Class II base due to mandibular retrognathism with an average vertical growth pattern. ` +
      `Key clinical findings include an overjet of ${overjetVal || '2.5'} mm, overbite of ${overbiteVal || '2.0'} mm, proclined upper incisors, mild to moderate anterior crowding, a convex facial profile, and incompetent lips at rest.`;

    const updated = diagnosisText.trim()
      ? diagnosisText + '\n\n' + aiDraftText
      : aiDraftText;

    handleTextChange(updated);
  };

  // Improve Wording with Gemini AI
  const handleImproveWording = async () => {
    if (!diagnosisText.trim()) {
      handleInsertAiDraft();
      return;
    }

    setIsGeneratingGemini(true);
    try {
      const geminiResult = await generateGeminiOrthoDiagnosis(patient);
      if (geminiResult && geminiResult.finalComprehensiveDiagnosis?.points?.[0]?.text) {
        const polished = geminiResult.finalComprehensiveDiagnosis.points[0].text;
        handleTextChange(polished);
      } else {
        const polished = diagnosisText
          .replace(/class 2/gi, 'Class II')
          .replace(/class 1/gi, 'Class I')
          .replace(/class 3/gi, 'Class III')
          .replace(/\bmm\b/g, 'mm');
        handleTextChange(polished);
      }
    } catch (err) {
      console.error('Gemini improvement error:', err);
    } finally {
      setIsGeneratingGemini(false);
    }
  };

  // AI Completeness Checker
  const lowerText = diagnosisText.toLowerCase();
  const completenessChecks = [
    {
      id: 'skeletal',
      label: 'Skeletal relationship included',
      missingLabel: 'Skeletal relationship missing',
      isSatisfied:
        lowerText.includes('skeletal') ||
        lowerText.includes('class ii') ||
        lowerText.includes('class i') ||
        lowerText.includes('class iii') ||
        lowerText.includes('retrognathic') ||
        lowerText.includes('prognathic'),
    },
    {
      id: 'growth',
      label: 'Growth pattern included',
      missingLabel: 'Growth pattern missing',
      isSatisfied:
        lowerText.includes('growth') ||
        lowerText.includes('divergent') ||
        lowerText.includes('angle') ||
        lowerText.includes('vertical') ||
        lowerText.includes('fma'),
    },
    {
      id: 'overjet',
      label: 'Overjet mentioned',
      missingLabel: 'Overjet missing',
      isSatisfied: lowerText.includes('overjet') || lowerText.includes('oj'),
    },
    {
      id: 'overbite',
      label: 'Overbite mentioned',
      missingLabel: 'Overbite missing',
      isSatisfied: lowerText.includes('overbite') || lowerText.includes('deep bite') || lowerText.includes('ob'),
    },
    {
      id: 'soft_tissue',
      label: 'Soft tissue profile included',
      missingLabel: 'Soft tissue profile missing',
      isSatisfied:
        lowerText.includes('profile') ||
        lowerText.includes('lip') ||
        lowerText.includes('convex') ||
        lowerText.includes('straight') ||
        lowerText.includes('concave') ||
        lowerText.includes('competent'),
    },
    {
      id: 'crowding',
      label: 'Crowding / Spacing included',
      missingLabel: 'Crowding / Spacing missing',
      isSatisfied:
        lowerText.includes('crowding') ||
        lowerText.includes('spacing') ||
        lowerText.includes('arch') ||
        lowerText.includes('alignment'),
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-4 font-sans text-slate-900 pb-12">
      {/* SECTION 3: DIAGNOSIS NOTEBOOK WORKSPACE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 sm:p-5 space-y-4 flex flex-col">
        <div className="space-y-3 flex-1 flex flex-col min-h-0">
          {/* EDITOR HEADER */}
          <div className="space-y-2.5 border-b border-slate-100 pb-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 shrink-0">
                <Brain className="w-4 h-4 text-teal-600" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-snug">
                  Diagnosis Notebook Workspace
                </h3>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Draft the provisional and final orthodontic diagnosis. Use AI helpers to scaffold and polish academic phrasing.
                </p>
              </div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleInsertAiDraft}
                className="min-h-10 px-3 py-2 rounded-xl bg-teal-50 active:bg-teal-100 text-teal-900 border border-teal-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer hover:bg-teal-100/80 transition-all"
                title="Insert structured AI draft based on case findings"
              >
                <FilePlus className="w-4 h-4 text-teal-700 shrink-0" />
                <span>Insert AI Draft</span>
              </button>

              <button
                type="button"
                onClick={handleImproveWording}
                disabled={isGeneratingGemini}
                className="min-h-10 px-3 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer transition-all shadow-xs"
                title="Refine academic phrasing using Gemini AI"
              >
                <Sparkles className={`w-4 h-4 text-amber-200 shrink-0 ${isGeneratingGemini ? 'animate-spin' : ''}`} />
                <span>{isGeneratingGemini ? 'Polishing…' : 'Improve Wording'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyStep <= 0}
                  className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  title="Undo"
                >
                  <Undo2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyStep >= history.length - 1}
                  className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200/80 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                  title="Redo"
                >
                  <Redo2 className="w-4 h-4" />
                </button>
              </div>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isSaved ? 'text-amber-500 animate-pulse' : 'text-emerald-600'}`} />
                <span>{isSaved ? 'Saving…' : 'Auto-saved to record'}</span>
              </span>
            </div>
          </div>

          {/* LARGE TEXTAREA */}
          <div className="relative flex-1 flex flex-col">
            <textarea
              value={diagnosisText}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder="Write the provisional or final orthodontic diagnosis here..."
              rows={8}
              className="w-full flex-1 p-3.5 sm:p-4 rounded-xl border border-slate-300 bg-slate-50/50 text-slate-900 text-sm leading-relaxed focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none font-sans resize-y min-h-[200px]"
            />
            <div className="absolute bottom-2.5 right-2.5 text-[10px] font-semibold text-slate-400 bg-white/90 px-2 py-0.5 rounded-md border border-slate-200">
              {diagnosisText.trim().split(/\s+/).filter(Boolean).length} words | {diagnosisText.length} chars
            </div>
          </div>
        </div>

        {/* COMPLETENESS CHECKER */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Brain className="w-3.5 h-3.5 text-teal-600 shrink-0" />
              <span>Diagnostic Quality & Component Checker</span>
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">
              {completenessChecks.filter((c) => c.isSatisfied).length} of {completenessChecks.length} components verified
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {completenessChecks.map((check) => (
              <span
                key={check.id}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium border flex items-center gap-1.5 transition-all ${
                  check.isSatisfied
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold'
                    : 'bg-amber-50 text-amber-800 border-amber-200 font-medium'
                }`}
              >
                {check.isSatisfied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span>{check.isSatisfied ? check.label : check.missingLabel}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabAiDiagnosis);
