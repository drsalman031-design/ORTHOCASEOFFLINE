import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Check,
  Mic,
  MicOff,
  X,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Eye,
  FileText,
  Wand2,
  HelpCircle,
  Volume2,
  Loader2,
} from 'lucide-react';
import { PatientRecord, StudentProfile } from '../../types';
import {
  extractPatientOrthoFindings,
  buildFourDiagnosisSections,
  buildCombinedFinalDiagnosis,
  SectionTutorData,
} from '../../lib/orthoTutorEngine';
import {
  normalizeOrthoSpeechText,
  polishOrthoDictationOffline,
  ORTHO_QUICK_MACROS,
} from '../../lib/orthoVoiceEngine';

interface TabAiDiagnosisProps {
  patient: PatientRecord;
  profile?: StudentProfile;
  onUpdatePatient?: (updated: PatientRecord) => void;
}

type SectionKey = 'angle' | 'skeletal' | 'dental' | 'softTissue';

export const TabAiDiagnosis: React.FC<TabAiDiagnosisProps> = ({
  patient,
  profile,
  onUpdatePatient,
}) => {
  const patientData = extractPatientOrthoFindings(patient);

  // Initialize the 4 sections data
  const [sectionsData, setSectionsData] = useState<Record<SectionKey, SectionTutorData>>(() =>
    buildFourDiagnosisSections(patient)
  );

  // Accordion state: ONLY ONE SECTION OPEN AT A TIME
  const [expandedSection, setExpandedSection] = useState<SectionKey | null>('angle');

  // Student text entries for each section
  const [studentTexts, setStudentTexts] = useState<Record<SectionKey, string>>({
    angle: '',
    skeletal: '',
    dental: '',
    softTissue: '',
  });

  // Confirmed section status
  const [confirmedSections, setConfirmedSections] = useState<Record<SectionKey, boolean>>({
    angle: false,
    skeletal: false,
    dental: false,
    softTissue: false,
  });

  // Modal for "View Patient Findings →" drawer
  const [showFindingsDrawer, setShowFindingsDrawer] = useState<boolean>(false);

  // Final Combined Diagnosis
  const initialFinalText =
    patient.diagnosisAndPlan?.provisionalDiagnosis ||
    patient.diagnosisAndPlan?.finalDiagnosis ||
    '';
  const [finalDiagnosisText, setFinalDiagnosisText] = useState<string>(initialFinalText);

  // Voice Dictation & Interim Transcript State
  const [isListeningSection, setIsListeningSection] = useState<SectionKey | 'final' | null>(null);
  const [interimSpeechText, setInterimSpeechText] = useState<string>('');
  const [isPolishingSection, setIsPolishingSection] = useState<SectionKey | 'final' | null>(null);
  const [showVoiceHelpModal, setShowVoiceHelpModal] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef<SectionKey | 'final' | null>(null);
  isListeningRef.current = isListeningSection;

  // Auto-save state
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Count completed sections
  const completedCount = Object.values(confirmedSections).filter(Boolean).length;

  // Sync on patient change
  const prevPatientIdRef = useRef<string>(patient.id);
  useEffect(() => {
    if (prevPatientIdRef.current !== patient.id) {
      prevPatientIdRef.current = patient.id;
      const freshSections = buildFourDiagnosisSections(patient);
      setSectionsData(freshSections);
      setStudentTexts({ angle: '', skeletal: '', dental: '', softTissue: '' });
      setConfirmedSections({ angle: false, skeletal: false, dental: false, softTissue: false });
      const newFinal = patient.diagnosisAndPlan?.provisionalDiagnosis || '';
      setFinalDiagnosisText(newFinal);
    }
  }, [patient]);

  // Voice recognition cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  // Update master final text auto-save
  const handleFinalTextChange = (text: string) => {
    setFinalDiagnosisText(text);
    setIsSaved(true);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      if (onUpdatePatient) {
        onUpdatePatient({
          ...patient,
          diagnosisAndPlan: {
            ...patient.diagnosisAndPlan,
            provisionalDiagnosis: text,
          },
        });
      }
      setIsSaved(false);
    }, 400);
  };

  // Toggle Accordion: ONLY ONE SECTION OPEN AT A TIME
  const handleToggleSection = (sectionKey: SectionKey) => {
    setExpandedSection((prev) => (prev === sectionKey ? null : sectionKey));
  };

  // Handle section student text change
  const handleSectionTextChange = (sectionKey: SectionKey, text: string) => {
    setStudentTexts((prev) => ({ ...prev, [sectionKey]: text }));
  };

  // Action: Confirm Section
  const handleConfirmSection = (sectionKey: SectionKey) => {
    const textToConfirm = studentTexts[sectionKey].trim() || sectionsData[sectionKey].suggestedWording;
    
    // Set student text if empty
    if (!studentTexts[sectionKey].trim()) {
      setStudentTexts((prev) => ({ ...prev, [sectionKey]: textToConfirm }));
    }

    const updatedConfirmed = { ...confirmedSections, [sectionKey]: true };
    setConfirmedSections(updatedConfirmed);

    // Auto-build final diagnosis from confirmed sections
    const updatedTexts = { ...studentTexts, [sectionKey]: textToConfirm };
    const combined = buildCombinedFinalDiagnosis(updatedTexts);
    if (combined) {
      handleFinalTextChange(combined);
    }

    // Auto advance to next unconfirmed section
    const order: SectionKey[] = ['angle', 'skeletal', 'dental', 'softTissue'];
    const currentIndex = order.indexOf(sectionKey);
    const nextSection = order.find((s, idx) => idx > currentIndex && !updatedConfirmed[s]);
    
    if (nextSection) {
      setExpandedSection(nextSection);
    } else {
      setExpandedSection(null); // Collapse all if all done
    }
  };

  // Action: Build / Rebuild Final Diagnosis
  const handleBuildFinalDiagnosis = () => {
    // Collect texts from confirmed sections or defaults
    const activeTexts: Record<SectionKey, string> = {
      angle: studentTexts.angle.trim() || sectionsData.angle.suggestedWording,
      skeletal: studentTexts.skeletal.trim() || sectionsData.skeletal.suggestedWording,
      dental: studentTexts.dental.trim() || sectionsData.dental.suggestedWording,
      softTissue: studentTexts.softTissue.trim() || sectionsData.softTissue.suggestedWording,
    };

    setStudentTexts(activeTexts);
    setConfirmedSections({ angle: true, skeletal: true, dental: true, softTissue: true });

    const combined = buildCombinedFinalDiagnosis(activeTexts);
    handleFinalTextChange(combined);
  };

  // Action: Polish Text with AI & Ortho Normalizer
  const handlePolishText = async (target: SectionKey | 'final') => {
    const currentText = target === 'final' ? finalDiagnosisText : studentTexts[target];
    if (!currentText.trim()) return;

    setIsPolishingSection(target);
    try {
      const polished = polishOrthoDictationOffline(currentText);
      if (polished) {
        if (target === 'final') {
          handleFinalTextChange(polished);
        } else {
          setStudentTexts((prev) => ({ ...prev, [target]: polished }));
        }
      }
    } catch (err) {
      console.warn('Error during text polishing:', err);
    } finally {
      setIsPolishingSection(null);
    }
  };

  // 100% Offline Quick-Macro inserter
  const handleAppendDiagMacro = (target: SectionKey | 'final', macroText: string) => {
    if (target === 'final') {
      setFinalDiagnosisText((prev) => (prev ? `${prev.trim()}\n• ${macroText}` : `• ${macroText}`));
    } else {
      setStudentTexts((prev) => ({
        ...prev,
        [target]: prev[target] ? `${prev[target].trim()}\n• ${macroText}` : `• ${macroText}`,
      }));
    }
  };

  // High-Accuracy Orthodontic Voice Dictation with Keep-Alive and Live Normalization
  const toggleSpeech = useCallback((target: SectionKey | 'final') => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice dictation is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
      return;
    }

    // If already listening to this target, stop it cleanly
    if (isListeningRef.current === target) {
      isListeningRef.current = null;
      setIsListeningSection(null);
      setInterimSpeechText('');
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      return;
    }

    // Stop any existing session before starting new
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }

    setSpeechError(null);
    setInterimSpeechText('');

    try {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.maxAlternatives = 3;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListeningSection(target);
        isListeningRef.current = target;
        setSpeechError(null);
      };

      rec.onresult = (e: any) => {
        let interim = '';
        let finalizedChunk = '';

        for (let i = e.resultIndex; i < e.results.length; i++) {
          const transcript = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalizedChunk += transcript + ' ';
          } else {
            interim += transcript;
          }
        }

        if (interim) {
          setInterimSpeechText(interim);
        }

        if (finalizedChunk.trim()) {
          const normalized = normalizeOrthoSpeechText(finalizedChunk);
          setInterimSpeechText('');

          if (target === 'final') {
            setFinalDiagnosisText((prev) => {
              const updated = prev ? `${prev.trim()} ${normalized}` : normalized;
              handleFinalTextChange(updated);
              return updated;
            });
          } else {
            setStudentTexts((prev) => {
              const prevText = prev[target];
              const updated = prevText ? `${prevText.trim()} ${normalized}` : normalized;
              return { ...prev, [target]: updated };
            });
          }
        }
      };

      rec.onerror = (e: any) => {
        console.warn('Speech recognition event:', e.error);
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser settings.');
          setIsListeningSection(null);
          isListeningRef.current = null;
        } else if (e.error === 'no-speech') {
          // Normal brief silence, do not break UI
        }
      };

      rec.onend = () => {
        // Keep-alive: If the user didn't explicitly press Stop, and browser ended session due to silence pause, restart seamlessly
        if (isListeningRef.current === target) {
          try {
            rec.start();
          } catch (_) {
            setIsListeningSection(null);
            isListeningRef.current = null;
          }
        } else {
          setIsListeningSection(null);
          setInterimSpeechText('');
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setSpeechError('Could not initialize microphone. Please check browser permissions.');
      setIsListeningSection(null);
      isListeningRef.current = null;
    }
  }, [patient]);

  // Clean placeholder text without section numbers
  const getPlaceholder = (key: SectionKey) => {
    switch (key) {
      case 'angle':
        return "Write your Angle's classification diagnosis...";
      case 'skeletal':
        return 'Write your skeletal relationship diagnosis...';
      case 'dental':
        return 'Write your dental relationship diagnosis...';
      case 'softTissue':
        return 'Write your soft-tissue profile diagnosis...';
    }
  };

  // Render Section Accordion
  const renderSectionCard = (key: SectionKey) => {
    const sec = sectionsData[key];
    const isExpanded = expandedSection === key;
    const isConfirmed = confirmedSections[key];
    const studentVal = studentTexts[key];
    const cleanTitle = sec.title.replace(/^\d+\s*·\s*/, '');

    return (
      <div
        key={key}
        className={`bg-slate-900/90 rounded-xl border transition-all shadow-sm overflow-hidden ${
          isConfirmed
            ? 'border-emerald-500/50 ring-1 ring-emerald-500/20'
            : isExpanded
            ? 'border-teal-500/80 ring-1 ring-teal-500/30'
            : 'border-slate-800 hover:border-slate-700'
        }`}
      >
        {/* ACCORDION HEADER */}
        <div
          onClick={() => handleToggleSection(key)}
          className="px-3.5 py-2.5 sm:px-4 sm:py-3 bg-slate-900 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between gap-2.5 select-none"
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <span
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                isConfirmed
                  ? 'bg-emerald-600 text-white'
                  : isExpanded
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              0{sec.sectionNumber}
            </span>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 flex-wrap">
                <span className="break-words">{cleanTitle}</span>
                {isConfirmed && (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-1.5 py-0.2 rounded-full font-bold inline-flex items-center gap-0.5 shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span className="hidden sm:inline">Confirmed</span>
                  </span>
                )}
              </h4>
              <p className="text-[11px] text-slate-400 leading-tight break-words mt-0.5">
                {sec.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-1">
            {isConfirmed ? (
              <span className="text-emerald-400 font-bold text-xs sm:hidden">✓</span>
            ) : (
              <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline">
                {isExpanded ? 'In progress' : '○ Pending'}
              </span>
            )}
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </div>
        </div>

        {/* ACCORDION BODY */}
        {isExpanded && (
          <div className="p-3.5 sm:p-4 space-y-3 border-t border-slate-800 bg-slate-950/60">
            {/* PATIENT FINDINGS (NO TRUNCATION) */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                PATIENT FINDINGS
              </span>
              <div className="p-2.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-medium leading-relaxed break-words overflow-wrap-anywhere min-h-[50px] flex items-center">
                <p className="w-full break-words whitespace-normal text-slate-200">
                  {sec.patientFindings}
                </p>
              </div>
            </div>

            {/* SUBSECTIONS FOR SKELETAL & DENTAL IF PRESENT (RESPONSIVE LABEL + VALUE SYSTEM) */}
            {sec.subsections && sec.subsections.length > 0 && (
              <div className="space-y-2 pt-0.5">
                {sec.subsections.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 px-3 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs flex flex-col sm:grid sm:grid-cols-[210px_1fr] items-start sm:items-center gap-1 sm:gap-3 min-w-0"
                  >
                    <span className="font-bold text-teal-400 text-[10px] sm:text-[11px] uppercase tracking-wider shrink-0 min-w-0 break-words">
                      {sub.title}
                    </span>
                    <span className="text-xs text-slate-100 font-mono break-words overflow-wrap-anywhere min-w-0 leading-relaxed">
                      {sub.findings}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* YOUR DIAGNOSIS WRITING AREA (LARGE 280-340px TEXTAREA) */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="text-xs font-bold text-slate-200 block tracking-wide">
                  Your diagnosis
                </label>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* VOICE GUIDE MODAL TRIGGER */}
                  <button
                    type="button"
                    onClick={() => setShowVoiceHelpModal(true)}
                    className="p-1 text-slate-400 hover:text-teal-300 rounded hover:bg-slate-800 transition-colors title='Voice commands guide'"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>

                  {/* POLISH WITH AI BUTTON */}
                  <button
                    type="button"
                    disabled={!studentVal.trim() || isPolishingSection === key}
                    onClick={() => handlePolishText(key)}
                    className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 border border-purple-600/40 flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Clean up grammar and standardize orthodontic terms with AI"
                  >
                    {isPolishingSection === key ? (
                      <>
                        <Loader2 className="w-3 h-3 text-purple-300 animate-spin" />
                        <span>Polishing...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3 h-3 text-purple-300" />
                        <span>Polish Terms</span>
                      </>
                    )}
                  </button>

                  {/* DICTATE BUTTON */}
                  <button
                    type="button"
                    onClick={() => toggleSpeech(key)}
                    className={`text-[11px] font-bold px-3 py-1 rounded-md flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                      isListeningSection === key
                        ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400/50'
                        : 'text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700'
                    }`}
                  >
                    {isListeningSection === key ? (
                      <>
                        <MicOff className="w-3.5 h-3.5 text-white" />
                        <span>Stop Mic</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-3.5 h-3.5 text-rose-400" />
                        <span>Dictate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* LIVE REAL-TIME RECORDING BANNER (WHEN ACTIVE) */}
              {isListeningSection === key && (
                <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-600/40 text-xs flex flex-col gap-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {/* AUDIO WAVE ANIMATION BARS */}
                      <div className="flex items-center gap-0.5 h-3.5">
                        <span className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: '100%', animationDelay: '0ms' }} />
                        <span className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: '60%', animationDelay: '150ms' }} />
                        <span className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: '90%', animationDelay: '300ms' }} />
                        <span className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: '40%', animationDelay: '450ms' }} />
                      </div>
                      <span className="font-bold text-rose-200 text-[11px] uppercase tracking-wider">
                        Recording Live Orthodontic Voice...
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSpeech(key)}
                      className="text-[10px] bg-rose-800 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                    >
                      Done
                    </button>
                  </div>

                  {interimSpeechText && (
                    <div className="p-1.5 bg-slate-900/80 rounded border border-rose-900 text-slate-200 text-xs font-mono italic">
                      "{interimSpeechText}..."
                    </div>
                  )}

                  <p className="text-[10px] text-rose-300/80">
                    💡 Tip: Say terms like "Class II div 1", "SNA 82 degrees", "overjet 4 mm", "period", "new line"
                  </p>
                </div>
              )}

              {speechError && isListeningSection === key && (
                <div className="p-2 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-lg">
                  {speechError}
                </div>
              )}

              {/* 100% OFFLINE QUICK MACROS ROW */}
              <div className="flex items-center gap-1.5 flex-wrap py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">⚡ Quick Macros:</span>
                {ORTHO_QUICK_MACROS.slice(0, 4).map((m) => (
                  <button
                    key={m.label}
                    type="button"
                    onClick={() => handleAppendDiagMacro(key, m.text)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 transition-colors font-medium cursor-pointer"
                  >
                    + {m.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={16}
                value={studentVal}
                onChange={(e) => handleSectionTextChange(key, e.target.value)}
                placeholder={getPlaceholder(key)}
                className="w-full min-h-[420px] sm:min-h-[500px] p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-700 text-slate-100 text-base sm:text-lg leading-relaxed focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-sans resize-y shadow-inner"
              />

              {/* ACTION ROW BELOW WRITING BOX: CONFIRM SECTION */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => handleConfirmSection(key)}
                  className="w-full h-11 sm:h-12 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer active:scale-[0.99]"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm Section</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4 font-sans text-slate-100 pb-32 px-2 sm:px-4">
      {/* COMPACT TOP HEADER */}
      <div className="bg-slate-900/90 rounded-xl px-3.5 py-3 border border-slate-800 shadow-sm flex items-center justify-between gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-black text-white tracking-tight break-words">
            Orthodontic Diagnosis
          </h2>
          <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1 mt-0.5 break-words">
            <span>{completedCount}/4 completed</span>
            {completedCount === 4 && <span>· ✓</span>}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFindingsDrawer(true)}
          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">View patient findings →</span>
          <span className="sm:hidden">Findings →</span>
        </button>
      </div>

      {/* 4 ACCORDION SECTIONS (ONLY ONE OPEN AT A TIME) */}
      <div className="space-y-2.5">
        {renderSectionCard('angle')}
        {renderSectionCard('skeletal')}
        {renderSectionCard('dental')}
        {renderSectionCard('softTissue')}
      </div>

      {/* FINAL DIAGNOSIS BUILDER & WORKSPACE */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 shadow-sm p-3.5 sm:p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 flex-wrap sm:flex-nowrap">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5 flex-wrap">
              <FileText className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Final Integrated Diagnosis</span>
            </h3>
            <p className="text-[11px] text-slate-400 break-words mt-0.5">
              Combined statement from confirmed sections.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleBuildFinalDiagnosis}
              className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>Build Final</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE ACTIONS */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* VOICE GUIDE MODAL TRIGGER */}
            <button
              type="button"
              onClick={() => setShowVoiceHelpModal(true)}
              className="p-1 text-slate-400 hover:text-teal-300 rounded hover:bg-slate-800 transition-colors"
              title="Voice commands guide"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>

            {/* POLISH WITH AI BUTTON */}
            <button
              type="button"
              disabled={!finalDiagnosisText.trim() || isPolishingSection === 'final'}
              onClick={() => handlePolishText('final')}
              className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-purple-950/70 hover:bg-purple-900/90 text-purple-200 border border-purple-600/40 flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Refine and polish final diagnosis into standard academic phrasing"
            >
              {isPolishingSection === 'final' ? (
                <>
                  <Loader2 className="w-3 h-3 text-purple-300 animate-spin" />
                  <span>Polishing...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-3 h-3 text-purple-300" />
                  <span>Polish Final Diagnosis</span>
                </>
              )}
            </button>

            {/* DICTATE BUTTON */}
            <button
              type="button"
              onClick={() => toggleSpeech('final')}
              className={`px-3 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                isListeningSection === 'final'
                  ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700'
              }`}
            >
              {isListeningSection === 'final' ? (
                <>
                  <MicOff className="w-3.5 h-3.5 text-white" />
                  <span>Stop Mic</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-rose-400" />
                  <span>Dictate</span>
                </>
              )}
            </button>
          </div>

          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <CheckCircle2 className={`w-3 h-3 ${isSaved ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
            <span>{isSaved ? 'Saving...' : 'Auto-saved'}</span>
          </span>
        </div>

        {/* LIVE REAL-TIME RECORDING BANNER (WHEN ACTIVE FOR FINAL) */}
        {isListeningSection === 'final' && (
          <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-600/40 text-xs flex flex-col gap-1.5 animate-fadeIn">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5 h-3.5">
                  <span className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: '100%', animationDelay: '0ms' }} />
                  <span className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: '60%', animationDelay: '150ms' }} />
                  <span className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: '90%', animationDelay: '300ms' }} />
                  <span className="w-1 bg-rose-400 rounded-full animate-bounce" style={{ height: '40%', animationDelay: '450ms' }} />
                </div>
                <span className="font-bold text-rose-200 text-[11px] uppercase tracking-wider">
                  Recording Live Final Orthodontic Diagnosis...
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleSpeech('final')}
                className="text-[10px] bg-rose-800 hover:bg-rose-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
              >
                Done
              </button>
            </div>

            {interimSpeechText && (
              <div className="p-1.5 bg-slate-900/80 rounded border border-rose-900 text-slate-200 text-xs font-mono italic">
                "{interimSpeechText}..."
              </div>
            )}

            <p className="text-[10px] text-rose-300/80">
              💡 Tip: Dictate full diagnostic summary across skeletal, dental, and soft tissue patterns.
            </p>
          </div>
        )}

        {speechError && isListeningSection === 'final' && (
          <div className="p-2 bg-red-950/80 border border-red-700 text-red-200 text-xs rounded-lg">
            {speechError}
          </div>
        )}

        {/* FINAL TEXTAREA WORKSPACE (MIN-HEIGHT 180PX) */}
        <div className="relative">
          <textarea
            value={finalDiagnosisText}
            onChange={(e) => handleFinalTextChange(e.target.value)}
            placeholder="Integrated diagnosis statement..."
            className="w-full min-h-[180px] sm:min-h-[200px] p-3.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm sm:text-base leading-relaxed focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-sans resize-y shadow-inner"
          />
        </div>
      </div>

      {/* MODAL: ORTHODONTIC VOICE DICTATION GUIDE */}
      {showVoiceHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-black">Orthodontic Voice Recognition Guide</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVoiceHelpModal(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-200">
              <p className="text-slate-300 leading-relaxed">
                Our high-precision orthodontic speech engine automatically detects clinical terminology, Roman numerals, cephalometric indices, and metric units.
              </p>

              <div className="space-y-2">
                <span className="font-bold text-teal-400 uppercase tracking-wider text-[11px] block">
                  1. Spoken Angles & Classifications
                </span>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                  <p className="text-slate-300"><span className="text-amber-300">You say:</span> "class two division one malocclusion on skeletal base class two"</p>
                  <p className="text-emerald-300"><span className="text-slate-400">Transcribed:</span> Class II div. 1 malocclusion on a Skeletal Class II base</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-teal-400 uppercase tracking-wider text-[11px] block">
                  2. Cephalometrics & Measurements
                </span>
                <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] space-y-1">
                  <p className="text-slate-300"><span className="text-amber-300">You say:</span> "sna eighty four degrees wits plus five millimeters fma twenty eight"</p>
                  <p className="text-emerald-300"><span className="text-slate-400">Transcribed:</span> SNA 84°, Wits +5 mm, FMA 28°</p>
                </div>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-teal-400 uppercase tracking-wider text-[11px] block">
                  3. Punctuation & Formatting Shortcuts
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="font-bold text-teal-300">"period" / "full stop"</span> → .
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="font-bold text-teal-300">"comma"</span> → ,
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="font-bold text-teal-300">"new line"</span> → Enter
                  </div>
                  <div className="p-2 bg-slate-950 rounded border border-slate-800">
                    <span className="font-bold text-teal-300">"new paragraph"</span> → \n\n
                  </div>
                </div>
              </div>

              <div className="p-3 bg-purple-950/40 border border-purple-800/40 rounded-xl text-purple-200 text-[11px] leading-relaxed">
                <span className="font-bold block text-purple-300 mb-0.5">✨ AI Polish Feature</span>
                After dictating your raw thoughts, click <strong>"Polish Terms"</strong> or <strong>"Polish Final Diagnosis"</strong> to instantly normalize grammar, standardize anatomical abbreviations, and ensure postgraduate academic style.
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowVoiceHelpModal(false)}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL: VIEW PATIENT FINDINGS */}
      {showFindingsDrawer && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-black">Recorded Patient Findings</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowFindingsDrawer(false)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-4 text-xs text-slate-200">
              {/* CEPH PARAMETERS */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  Cephalometric Measurements
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">SNA</span>
                    <span className="font-bold break-words">{patientData.sna !== undefined ? `${patientData.sna}°` : 'Unrecorded'}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">SNB</span>
                    <span className="font-bold break-words">{patientData.snb !== undefined ? `${patientData.snb}°` : 'Unrecorded'}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">ANB</span>
                    <span className="font-bold break-words">{patientData.anb !== undefined ? `${patientData.anb}°` : 'Unrecorded'}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">Wits</span>
                    <span className="font-bold break-words">{patientData.wits !== undefined ? `${patientData.wits} mm` : 'Unrecorded'}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">FMA</span>
                    <span className="font-bold break-words">{patientData.fma !== undefined ? `${patientData.fma}°` : 'Unrecorded'}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">U1-SN</span>
                    <span className="font-bold break-words">{patientData.u1Sn !== undefined ? `${patientData.u1Sn}°` : 'Unrecorded'}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">IMPA</span>
                    <span className="font-bold break-words">{patientData.impa !== undefined ? `${patientData.impa}°` : 'Unrecorded'}</span>
                  </div>
                </div>
              </div>

              {/* CLINICAL DENTAL */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  Clinical Exam & Dental Occlusion
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">Molar Relation</span>
                    <span className="font-bold break-words">Right: {patientData.molarRight} | Left: {patientData.molarLeft}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">Canine Relation</span>
                    <span className="font-bold break-words">Right: {patientData.canineRight} | Left: {patientData.canineLeft}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">Overjet</span>
                    <span className="font-bold break-words">{patientData.overjet !== undefined ? `${patientData.overjet} mm` : 'Unrecorded'}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">Overbite</span>
                    <span className="font-bold break-words">{patientData.overbite !== undefined ? `${patientData.overbite} mm` : 'Unrecorded'}</span>
                  </div>
                </div>
              </div>

              {/* SOFT TISSUE */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider block">
                  Soft Tissue & Profile
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">Profile Contour</span>
                    <span className="font-bold break-words">{patientData.profileType}</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 min-w-0">
                    <span className="text-slate-400 block text-[10px]">Lip Posture</span>
                    <span className="font-bold break-words">{patientData.lipCompetence}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-950 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setShowFindingsDrawer(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 text-white text-xs font-bold hover:bg-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(TabAiDiagnosis);
