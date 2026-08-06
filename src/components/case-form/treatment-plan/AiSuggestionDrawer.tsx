import React, { useState } from 'react';
import { StudentTreatmentPlan } from '../../../types';
import { TREATMENT_PLAN_PARAMETERS } from './treatmentPlanHelpers';
import {
  Sparkles,
  X,
  Check,
  Copy,
  Edit3,
  ArrowRight,
  ShieldAlert,
  CheckCircle2,
  ListPlus,
  RefreshCw,
} from 'lucide-react';

interface AiSuggestionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  aiPlan: StudentTreatmentPlan;
  studentPlan: StudentTreatmentPlan;
  onAcceptAll: (aiPlan: StudentTreatmentPlan) => void;
  onCopyField: (key: keyof StudentTreatmentPlan, text: string) => void;
  isGenerating?: boolean;
  onRegenerateAi?: () => void;
}

export const AiSuggestionDrawer: React.FC<AiSuggestionDrawerProps> = ({
  isOpen,
  onClose,
  aiPlan,
  studentPlan,
  onAcceptAll,
  onCopyField,
  isGenerating = false,
  onRegenerateAi,
}) => {
  const [editingKey, setEditingKey] = useState<keyof StudentTreatmentPlan | null>(null);
  const [editingText, setEditingText] = useState('');
  const [copiedKeys, setCopiedKeys] = useState<Record<string, boolean>>({});
  const [showConfirmAcceptAll, setShowConfirmAcceptAll] = useState(false);

  if (!isOpen) return null;

  const handleCopySingle = (key: keyof StudentTreatmentPlan, value: string) => {
    onCopyField(key, value);
    setCopiedKeys((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedKeys((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const handleStartEdit = (key: keyof StudentTreatmentPlan, currentText: string) => {
    setEditingKey(key);
    setEditingText(currentText);
  };

  const handleSaveEditAndCopy = (key: keyof StudentTreatmentPlan) => {
    onCopyField(key, editingText);
    setEditingKey(null);
    setEditingText('');
    setCopiedKeys((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedKeys((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
      <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 text-slate-100 flex flex-col shadow-2xl overflow-hidden">
        {/* DRAWER HEADER */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300">
              <Sparkles className="w-5 h-5 text-teal-400 animate-spin-slow" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-300 text-[11px] font-bold uppercase tracking-wider">
                AI Clinical Reasoning Assistant
              </div>
              <h3 className="text-lg font-extrabold text-white">AI Suggested Treatment Plan</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onRegenerateAi && (
              <button
                type="button"
                onClick={onRegenerateAi}
                disabled={isGenerating}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Regenerate AI Suggestion"
              >
                <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* IMPORTANT NOTICE BANNER */}
        <div className="bg-amber-950/50 border-b border-amber-500/30 p-3.5 px-5 flex items-start gap-3 shrink-0 text-amber-200 text-xs">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Student Decision-Making Safeguard:</span>
            <p className="text-amber-200/80 leading-relaxed mt-0.5">
              This AI suggestion is provided solely as an evidence-informed clinical reference. It will <strong>NEVER</strong> automatically overwrite your manual entries unless you explicitly choose to copy or accept suggestions.
            </p>
          </div>
        </div>

        {/* ACCEPT ALL CONFIRMATION BAR */}
        {showConfirmAcceptAll ? (
          <div className="p-4 bg-teal-950/80 border-b border-teal-500/40 space-y-3 shrink-0">
            <p className="text-xs text-teal-200 font-semibold">
              Are you sure you want to copy ALL 16 AI suggested parameters into your Student Treatment Plan? This will populate empty fields and replace existing entries.
            </p>
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowConfirmAcceptAll(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onAcceptAll(aiPlan);
                  setShowConfirmAcceptAll(false);
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm cursor-pointer"
              >
                Confirm & Accept All Suggestions
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 px-5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
            <span className="text-xs text-slate-400 font-medium">
              16 AI Clinical Recommendations Generated
            </span>
            <button
              type="button"
              onClick={() => setShowConfirmAcceptAll(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Accept All Suggestions</span>
            </button>
          </div>
        )}

        {/* PARAMETERS LIST (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {TREATMENT_PLAN_PARAMETERS.map((param) => {
            const aiVal = aiPlan[param.key] || 'No specific AI suggestion generated for this parameter.';
            const studentVal = studentPlan[param.key];
            const isEditing = editingKey === param.key;
            const isCopied = copiedKeys[param.key];

            return (
              <div
                key={param.key}
                className="bg-slate-950/80 rounded-xl border border-slate-800/80 p-3.5 sm:p-4 space-y-2.5 transition-all hover:border-slate-700"
              >
                {/* PARAMETER TITLE & ACTION BUTTONS */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-800/80 pb-2">
                  <div>
                    <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider bg-teal-950 px-2 py-0.5 rounded border border-teal-800/60">
                      Step {param.stepNumber}
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{param.title}</h4>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {!isEditing && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(param.key, aiVal)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
                          title="Modify text before copying"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="hidden sm:inline">Modify</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopySingle(param.key, aiVal)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-teal-600 hover:bg-teal-500 text-white'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy to Plan</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* AI VALUE CONTENT / EDITING TEXTAREA */}
                {isEditing ? (
                  <div className="space-y-2 pt-1">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 rounded-lg border border-teal-500 bg-slate-900 text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-400 font-mono"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingKey(null)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEditAndCopy(param.key)}
                        className="px-3 py-1 rounded bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold cursor-pointer"
                      >
                        Save & Copy to My Plan
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800 text-xs sm:text-[13px] text-teal-100/90 leading-relaxed font-sans whitespace-pre-wrap">
                      {aiVal}
                    </div>

                    {studentVal && (
                      <div className="text-[11px] text-slate-400 bg-slate-900/40 p-2 rounded border border-slate-800/60 flex items-start gap-1.5">
                        <span className="font-bold text-slate-300 shrink-0">Your Current Entry:</span>
                        <span className="truncate italic">{studentVal}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* FOOTER DISMISS ACTION */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <span className="text-xs text-slate-400">
            Review completed. Close window to return to manual editor.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            Reject / Dismiss AI Panel
          </button>
        </div>
      </div>
    </div>
  );
};
