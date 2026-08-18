import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap,
  Sparkles,
  MessageSquare,
  BookOpen,
  Brain,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  FileText,
  Target,
  ShieldAlert,
  Send,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  ArrowRight,
  UserCheck,
  Zap,
} from 'lucide-react';
import { PatientRecord, StudentProfile } from '../../types';
import {
  MentorModuleData,
  generateOrthoMentorData,
} from '../../lib/orthoMentorEngine';

export interface ChatMessage {
  id: string;
  sender: 'student' | 'mentor';
  text: string;
  timestamp: string;
}

interface TabAiMentorProps {
  patient: PatientRecord;
  profile?: StudentProfile | null;
}

type ModuleKey =
  | 'all'
  | 'discussion'
  | 'reasoning'
  | 'correlation'
  | 'differential'
  | 'objectives'
  | 'options'
  | 'risks'
  | 'evidence'
  | 'pearls'
  | 'mistakes'
  | 'viva'
  | 'assessment'
  | 'faculty'
  | 'chat';

const MODULE_TABS: { id: ModuleKey; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'all', label: 'Overview & All Modules', icon: Layers },
  { id: 'discussion', label: '1. Case Discussion', icon: BookOpen },
  { id: 'reasoning', label: '2. Diagnostic Reasoning', icon: Brain },
  { id: 'correlation', label: '3. Clinical Correlation', icon: UserCheck },
  { id: 'differential', label: '4. Differential Diagnosis', icon: HelpCircle },
  { id: 'objectives', label: '5. Treatment Objectives', icon: Target },
  { id: 'options', label: '6. Treatment Options', icon: Layers },
  { id: 'risks', label: '7. Risk Analysis', icon: ShieldAlert },
  { id: 'evidence', label: '8. Evidence-Based', icon: Award },
  { id: 'pearls', label: '9. Clinical Pearls', icon: Lightbulb },
  { id: 'mistakes', label: '10. Common Mistakes', icon: AlertTriangle },
  { id: 'viva', label: '11. Viva Preparation', icon: GraduationCap, badge: 'Interactive' },
  { id: 'assessment', label: '12. Self-Assessment', icon: CheckCircle2 },
  { id: 'faculty', label: '13. Faculty Notes', icon: FileText },
  { id: 'chat', label: 'Professor Seminar Chat', icon: MessageSquare, badge: 'AI Live' },
];

export const TabAiMentor: React.FC<TabAiMentorProps> = ({ patient, profile }) => {
  const [activeModule, setActiveModule] = useState<ModuleKey>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [mentorData, setMentorData] = useState<MentorModuleData>(() =>
    generateOrthoMentorData(patient)
  );

  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'mentor',
      text: `Welcome to the postgraduate seminar. I am your OrthoCase AI Mentor. We have ${patient.name || 'this patient'}'s complete diagnostic records open. What clinical reasoning questions or treatment dilemmas would you like to discuss today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputQuery, setInputQuery] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Viva interactive state
  const [revealedViva, setRevealedViva] = useState<Record<string, boolean>>({});
  const [studentVivaAnswers, setStudentVivaAnswers] = useState<Record<string, string>>({});
  const [vivaFeedback, setVivaFeedback] = useState<Record<string, string>>({});

  // Synthesize or update Mentor Data
  const handleGenerateMentorData = () => {
    setLoading(true);
    try {
      const data = generateOrthoMentorData(patient);
      setMentorData(data);
    } catch (err) {
      console.error('Failed to generate mentor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto load data on mount
    handleGenerateMentorData();
  }, [patient.id]);

  useEffect(() => {
    if (activeModule === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, activeModule]);

  // Handle student chat input with local clinical decision engine
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isAsking) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'student',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsAsking(true);

    setTimeout(() => {
      let mentorReplyText = '';
      const q = query.toLowerCase();

      if (q.includes('extract') || q.includes('space') || q.includes('anchor')) {
        mentorReplyText = `Extraction & Anchorage Analysis for ${patient.name || 'this patient'}:\n• ${mentorData.treatmentOptions.options[0]?.description || 'Evaluate arch length discrepancy and soft tissue profile before finalizing extraction protocol.'}`;
      } else if (q.includes('viva') || q.includes('exam') || q.includes('question')) {
        mentorReplyText = `Postgraduate Viva Discussion:\n• Question: "${mentorData.vivaPrep.questions[0]?.question || 'Explain your biomechanical force system.'}"\n• Model Answer: ${mentorData.vivaPrep.questions[0]?.modelAnswer || 'Maintain anterior torque and vertical control.'}`;
      } else if (q.includes('risk') || q.includes('root') || q.includes('resorption')) {
        mentorReplyText = `Clinical Risk Analysis:\n• ${mentorData.riskAnalysis.risks[0]?.risk || 'Monitor root resorption and periodontal attachment.'}\n• Prevention: ${mentorData.riskAnalysis.risks[0]?.prevention || 'Use light continuous forces.'}`;
      } else if (q.includes('differential') || q.includes('skeletal') || q.includes('class')) {
        mentorReplyText = `Diagnostic Reasoning Chain:\n${mentorData.diagnosticReasoning.chainOfLogic.map((s) => `• ${s}`).join('\n')}`;
      } else {
        mentorReplyText = `Clinical Assessment for ${patient.name || 'this case'}:\n${mentorData.caseDiscussion.caseSummary}\n\nPrimary Objectives:\n${mentorData.treatmentObjectives.primaryObjectives.map((o) => `• ${o}`).join('\n')}`;
      }

      const mentorMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'mentor',
        text: mentorReplyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, mentorMsg]);
      setIsAsking(false);
    }, 200);
  };

  const name = patient.name || 'Patient';
  const age = patient.age || 14;
  const gender = patient.gender || 'Female';

  return (
    <div className="max-w-7xl mx-auto space-y-5 font-sans text-slate-900 pb-16">
      {/* BANNER HEADER */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white rounded-2xl p-4 sm:p-6 shadow-md border border-teal-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <GraduationCap className="w-48 h-48 text-teal-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-teal-200 shrink-0 mt-0.5">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-teal-500/30 text-teal-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-teal-400/30 uppercase tracking-wider">
                  Postgraduate Clinical Reasoning
                </span>
                <span className="bg-amber-500/20 text-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-400/30">
                  OrthoCase 3.0 Mentor Mode
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                Tab 11 — OrthoCase AI Mentor
              </h1>
              <p className="text-xs sm:text-sm text-teal-100/90 font-medium max-w-3xl mt-0.5">
                Clinical reasoning, case discussion, evidence-based options, risk analysis, and viva coaching for {name} ({gender}, {age}y).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleGenerateMentorData}
              disabled={loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-teal-500 hover:bg-teal-400 text-teal-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Synthesizing Case…' : 'Refresh AI Mentor'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODULE SELECTOR TABS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {MODULE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeModule === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveModule(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 bg-slate-50 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-teal-600'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MODULE CONTENT VIEWS */}
      <div className="space-y-6">
        {/* MODULE 1: CASE DISCUSSION */}
        {(activeModule === 'all' || activeModule === 'discussion') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Module 1: Complete Case Discussion & Interrelationships
                </h2>
                <p className="text-xs text-slate-500">
                  Synthesizing chief complaint, clinical findings, skeletal diagnosis, and soft tissue patterns.
                </p>
              </div>
            </div>

            <div className="bg-teal-50/60 border border-teal-200/80 rounded-xl p-4">
              <p className="text-xs text-teal-950 font-medium leading-relaxed">
                {mentorData.module1CaseDiscussion.overview}
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Key Interrelationship Matrix (How One Finding Influences Another)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {mentorData.module1CaseDiscussion.interrelationships.map((item, idx) => (
                  <div
                    key={idx}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-100/80 px-2 py-0.5 rounded-md">
                        Finding A
                      </span>
                      <p className="text-xs font-bold text-slate-900">{item.findingA}</p>
                    </div>

                    <div className="flex items-center justify-center my-1 text-slate-400">
                      <ArrowRight className="w-4 h-4" />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                        Finding B
                      </span>
                      <p className="text-xs font-bold text-slate-900">{item.findingB}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-700 font-medium leading-normal bg-white p-2.5 rounded-lg border border-slate-200/50">
                      <strong className="text-teal-900 block text-[10px] uppercase font-extrabold mb-0.5">
                        Clinical Effect:
                      </strong>
                      {item.clinicalEffect}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-slate-900 text-white rounded-xl text-xs font-medium leading-relaxed">
              <span className="text-teal-300 font-bold block mb-1">
                Professor's Case Synthesis:
              </span>
              {mentorData.module1CaseDiscussion.synthesisParagraph}
            </div>
          </div>
        )}

        {/* MODULE 2: DIAGNOSTIC REASONING */}
        {(activeModule === 'all' || activeModule === 'reasoning') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Module 2: Diagnostic Reasoning & Clinical Significance
                </h2>
                <p className="text-xs text-slate-500">
                  Correlating clinical examination, cephalometrics, and model analysis without dry number repeating.
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-medium bg-purple-50/50 p-3 rounded-xl border border-purple-100">
              {mentorData.module2DiagnosticReasoning.summary}
            </p>

            <div className="space-y-3">
              {mentorData.module2DiagnosticReasoning.diagnosticJustifications.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 hover:border-purple-300 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-purple-950 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-200">
                      {item.diagnosis}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        Diagnostic Rationale & Evidence:
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed">{item.rationale}</p>
                    </div>

                    <div className="bg-teal-50/80 p-3 rounded-lg border border-teal-200/80 text-xs space-y-1">
                      <span className="text-[10px] font-black uppercase text-teal-800 tracking-wider">
                        Clinical Significance:
                      </span>
                      <p className="text-teal-950 font-medium leading-relaxed">
                        {item.clinicalSignificance}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 3: CLINICAL CORRELATION */}
        {(activeModule === 'all' || activeModule === 'correlation') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Module 3: Clinical Correlation with Patient Presentation
                </h2>
                <p className="text-xs text-slate-500">
                  Relating every skeletal & dental diagnosis to what is visible on the patient's face & smile.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {mentorData.module3ClinicalCorrelation.correlations.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      Diagnosis Item
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{item.diagnosisItem}</h4>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] font-black text-slate-500 uppercase block">
                      Clinical Presentation:
                    </span>
                    <p className="text-xs text-slate-800 font-medium leading-snug">
                      {item.clinicalManifestation}
                    </p>
                  </div>

                  <div className="bg-blue-50/80 p-2.5 rounded-lg border border-blue-200 text-xs space-y-1">
                    <span className="text-[10px] font-black text-blue-800 uppercase block">
                      Anatomical & Physiological Explanation:
                    </span>
                    <p className="text-xs text-blue-950 font-medium leading-snug">
                      {item.physiologicalExplanation}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 4: DIFFERENTIAL DIAGNOSIS */}
        {(activeModule === 'all' || activeModule === 'differential') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Module 4: Differential Diagnosis & Exclusion Rationale
                </h2>
                <p className="text-xs text-slate-500">
                  Evaluating alternative diagnoses, why they were considered, and why excluded.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {mentorData.module4DifferentialDiagnosis.differentialItems.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-950 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                      Differential # {idx + 1}: {item.alternativeDiagnosis}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase block">
                        Why Considered:
                      </span>
                      <p className="text-slate-800 leading-snug">{item.whyConsidered}</p>
                    </div>

                    <div className="bg-red-50/70 p-3 rounded-lg border border-red-200 text-xs space-y-1">
                      <span className="text-[10px] font-black text-red-700 uppercase block">
                        Why Excluded:
                      </span>
                      <p className="text-red-950 font-medium leading-snug">{item.whyExcluded}</p>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 text-xs space-y-1">
                      <span className="text-[10px] font-black text-emerald-800 uppercase block">
                        Evidence Supporting Final Diagnosis:
                      </span>
                      <p className="text-emerald-950 font-medium leading-snug">
                        {item.supportingEvidenceForFinal}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 5: TREATMENT OBJECTIVES */}
        {(activeModule === 'all' || activeModule === 'objectives') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Module 5: Prioritized Treatment Objectives & Rationale
                </h2>
                <p className="text-xs text-slate-500">
                  Determining high-priority goals driven by patient findings.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mentorData.module5TreatmentObjectives.prioritizedObjectives.map((obj) => (
                <div
                  key={obj.priority}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex items-start gap-3"
                >
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    #{obj.priority}
                  </div>
                  <div className="space-y-1.5 flex-1 text-xs">
                    <h4 className="font-extrabold text-slate-900">{obj.objective}</h4>
                    <p className="text-slate-600 font-medium">
                      <strong className="text-slate-800">Driving Findings:</strong>{' '}
                      {obj.drivingFindings}
                    </p>
                    <p className="text-teal-900 bg-teal-50 p-2 rounded-lg border border-teal-200/80 font-medium leading-snug">
                      <strong className="text-teal-950 font-black">Clinical Importance:</strong>{' '}
                      {obj.importance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 6: TREATMENT OPTIONS */}
        {(activeModule === 'all' || activeModule === 'options') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Module 6: Evidence-Based Treatment Options & Comparison
                </h2>
                <p className="text-xs text-slate-500">
                  Evaluating multiple treatment modalities without enforcing a single mandatory approach.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {mentorData.module6TreatmentOptions.options.map((opt, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap border-b border-slate-200/80 pb-2">
                    <h3 className="text-sm font-extrabold text-slate-900">{opt.title}</h3>
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {opt.levelOfEvidence}
                    </span>
                  </div>

                  <div className="text-xs text-slate-800">
                    <strong className="text-slate-900">Appliance & Modality:</strong> {opt.modality}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-500 block">
                        Indications:
                      </span>
                      <p className="text-slate-800">{opt.indications}</p>
                    </div>

                    <div className="bg-emerald-50/70 p-3 rounded-lg border border-emerald-200 space-y-1">
                      <span className="text-[10px] font-black uppercase text-emerald-800 block">
                        Advantages:
                      </span>
                      <p className="text-emerald-950 font-medium">{opt.advantages}</p>
                    </div>

                    <div className="bg-amber-50/70 p-3 rounded-lg border border-amber-200 space-y-1">
                      <span className="text-[10px] font-black uppercase text-amber-800 block">
                        Limitations & Risks:
                      </span>
                      <p className="text-amber-950 font-medium">{opt.limitations}</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900 text-white rounded-lg text-xs">
                    <strong className="text-teal-300 font-bold">Key Clinical Consideration:</strong>{' '}
                    {opt.clinicalConsiderations}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-teal-900 text-white rounded-xl text-xs space-y-1">
              <span className="text-teal-200 font-extrabold uppercase text-[10px] tracking-wider block">
                Professor's Recommendation Summary:
              </span>
              <p className="leading-relaxed font-medium">
                {mentorData.module6TreatmentOptions.mentorRecommendationSummary}
              </p>
            </div>
          </div>
        )}

        {/* MODULE 7: RISK ANALYSIS */}
        {(activeModule === 'all' || activeModule === 'risks') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 rounded-xl bg-red-50 text-red-700 border border-red-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">
                  Module 7: Comprehensive Case Risk Analysis
                </h2>
                <p className="text-xs text-slate-500">
                  Anchorage, cortical limits, root resorption, profile flattening, and stability risks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mentorData.module7RiskAnalysis.risks.map((risk, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-slate-900">{risk.category}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        risk.level === 'High'
                          ? 'bg-red-100 text-red-800 border border-red-200'
                          : risk.level === 'Moderate'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-teal-100 text-teal-800 border border-teal-200'
                      }`}
                    >
                      {risk.level} Risk
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    {risk.riskDescription}
                  </p>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <strong className="text-teal-800 block text-[10px] uppercase font-black">
                      Mitigation Strategy:
                    </strong>
                    <span className="text-slate-800 font-medium">{risk.mitigatingStrategy}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODULE 8 & 9 & 10 (3 COLUMN GRID IN ALL MODE) */}
        {(activeModule === 'all' ||
          activeModule === 'evidence' ||
          activeModule === 'pearls' ||
          activeModule === 'mistakes') && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* MODULE 8: EVIDENCE BASED */}
            {(activeModule === 'all' || activeModule === 'evidence') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 flex flex-col">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Award className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-black text-slate-900">Module 8: Evidence-Based</h3>
                </div>

                <div className="space-y-3 flex-1">
                  {mentorData.module8EvidenceBasedLearning.principles.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1"
                    >
                      <h4 className="font-extrabold text-teal-900">{item.concept}</h4>
                      <p className="text-[11px] text-slate-500 italic">{item.referenceSource}</p>
                      <p className="text-slate-800 font-medium pt-1">{item.applicationToCase}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODULE 9: CLINICAL PEARLS */}
            {(activeModule === 'all' || activeModule === 'pearls') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 flex flex-col">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900">Module 9: Clinical Pearls</h3>
                </div>

                <div className="space-y-2.5 flex-1">
                  {mentorData.module9ClinicalPearls.map((pearl, idx) => (
                    <div
                      key={idx}
                      className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 font-medium flex items-start gap-2"
                    >
                      <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>{pearl}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODULE 10: COMMON MISTAKES */}
            {(activeModule === 'all' || activeModule === 'mistakes') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 flex flex-col">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="text-sm font-black text-slate-900">Module 10: Common Pitfalls</h3>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2 flex-1">
                  <div>
                    <span className="text-[10px] font-black text-red-700 uppercase block">
                      Common Student Error:
                    </span>
                    <p className="font-bold text-slate-900">{mentorData.module10CommonMistakes.mistake}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-slate-500 uppercase block">
                      Clinical Impact:
                    </span>
                    <p className="text-slate-700">{mentorData.module10CommonMistakes.impact}</p>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] font-black text-teal-800 uppercase block">
                      Prevention Strategy:
                    </span>
                    <p className="text-teal-950 font-medium">
                      {mentorData.module10CommonMistakes.preventionStrategy}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODULE 11: VIVA PREPARATION (INTERACTIVE) */}
        {(activeModule === 'all' || activeModule === 'viva') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Module 11: Interactive Viva Examination Question Bank
                  </h2>
                  <p className="text-xs text-slate-500">
                    Test your clinical knowledge. Attempt answers before revealing model professor responses.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full">
                {mentorData.module11VivaPreparation.length} Questions Ready
              </span>
            </div>

            <div className="space-y-4">
              {mentorData.module11VivaPreparation.map((q) => {
                const isRevealed = revealedViva[q.id];
                const studentAns = studentVivaAnswers[q.id] || '';

                return (
                  <div
                    key={q.id}
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                          q.level === 'Basic'
                            ? 'bg-teal-100 text-teal-800'
                            : q.level === 'Intermediate'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {q.level} Level
                      </span>
                      <div className="flex gap-1.5 flex-wrap">
                        {q.keyConcepts.map((kc, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] font-bold bg-white text-slate-600 px-2 py-0.5 rounded border border-slate-200"
                          >
                            #{kc}
                          </span>
                        ))}
                      </div>
                    </div>

                    <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                      Q: {q.question}
                    </h3>

                    <div className="text-xs text-amber-900 bg-amber-50/80 p-2.5 rounded-xl border border-amber-200/80 font-medium">
                      💡 <strong>Examiner Hint:</strong> {q.hint}
                    </div>

                    {/* STUDENT DRAFT ANSWER */}
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-bold uppercase text-slate-500 block">
                        Your Practice Viva Answer:
                      </label>
                      <textarea
                        rows={2}
                        value={studentAns}
                        onChange={(e) =>
                          setStudentVivaAnswers((prev) => ({
                            ...prev,
                            [q.id]: e.target.value,
                          }))
                        }
                        placeholder="Type your reasoning here before checking the professor answer..."
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
                      />
                    </div>

                    {/* REVEAL TOGGLE */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedViva((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                        }
                        className="text-xs font-extrabold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>{isRevealed ? 'Hide Model Answer' : 'Reveal Model Answer'}</span>
                        {isRevealed ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* REVEALED MODEL ANSWER */}
                    {isRevealed && (
                      <div className="bg-teal-900 text-white p-4 rounded-xl text-xs space-y-1.5 animate-fadeIn">
                        <span className="text-teal-300 font-extrabold uppercase text-[10px] tracking-wider block">
                          Professor's Model Viva Response:
                        </span>
                        <p className="leading-relaxed font-medium text-slate-100">
                          {q.modelAnswer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODULE 12 & 13 GRID */}
        {(activeModule === 'all' || activeModule === 'assessment' || activeModule === 'faculty') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* MODULE 12: SELF ASSESSMENT */}
            {(activeModule === 'all' || activeModule === 'assessment') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <h3 className="text-sm font-black text-slate-900">Module 12: Self-Assessment</h3>
                </div>

                <div className="space-y-3">
                  {mentorData.module12SelfAssessment.map((sa) => (
                    <div
                      key={sa.id}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2"
                    >
                      <h4 className="font-extrabold text-slate-900">Q: {sa.question}</h4>
                      <p className="text-slate-600 italic">{sa.guidance}</p>
                      <div className="bg-white p-2 rounded-lg border border-slate-200">
                        <span className="text-[10px] font-bold text-teal-800 uppercase block">
                          Supporting Case Evidence:
                        </span>
                        <ul className="list-disc list-inside text-slate-800 space-y-0.5">
                          {sa.evidencePoints.map((ep, idx) => (
                            <li key={idx}>{ep}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MODULE 13: FACULTY NOTES */}
            {(activeModule === 'all' || activeModule === 'faculty') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <FileText className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-black text-slate-900">
                    Module 13: Seminar & Faculty Notes
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 space-y-1">
                    <strong className="text-purple-950 font-bold block">Presentation Highlights:</strong>
                    <ul className="list-disc list-inside text-purple-900 space-y-0.5">
                      {mentorData.module13FacultyNotes.presentationHighlights.map((ph, idx) => (
                        <li key={idx}>{ph}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-900 font-bold block">Discussion Topics & Controversies:</strong>
                    <ul className="list-disc list-inside text-slate-800 space-y-0.5">
                      {mentorData.module13FacultyNotes.discussionTopics.map((dt, idx) => (
                        <li key={idx}>{dt}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* INTERACTIVE PROFESSOR CHAT & SEMINAR ROOM */}
        {(activeModule === 'all' || activeModule === 'chat') && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-600 text-white">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Interactive Postgraduate Seminar Room with Professor OrthoCase AI Mentor
                  </h2>
                  <p className="text-xs text-slate-500">
                    Ask any custom clinical reasoning questions regarding this patient record.
                  </p>
                </div>
              </div>
            </div>

            {/* QUICK PRESET QUESTION PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 shrink-0">
                Ask Professor:
              </span>
              {[
                'Why not extract lower premolars here?',
                'How does FMPA angle affect our choice of mechanics?',
                'What are the stability risks long-term?',
                'How would TAD anchorage change our plan?',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(preset)}
                  disabled={isAsking}
                  className="text-[11px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  "{preset}"
                </button>
              ))}
            </div>

            {/* CHAT MESSAGES STREAM */}
            <div className="bg-slate-900/95 text-slate-100 rounded-2xl p-4 h-80 overflow-y-auto space-y-3 font-sans scrollbar-thin border border-slate-800">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${
                    msg.sender === 'student' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.sender === 'mentor' && (
                    <div className="p-1.5 bg-teal-600 rounded-xl text-white shrink-0 mt-0.5">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl rounded-2xl p-3.5 text-xs leading-relaxed ${
                      msg.sender === 'student'
                        ? 'bg-teal-600 text-white rounded-br-none font-medium'
                        : 'bg-slate-800 text-slate-100 border border-slate-700/80 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[10px] text-teal-300">
                        {msg.sender === 'student' ? 'Postgraduate Resident' : 'Professor OrthoCase AI Mentor'}
                      </span>
                      <span className="text-[9px] text-slate-400">{msg.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              ))}
              {isAsking && (
                <div className="flex items-center gap-2 text-teal-300 text-xs font-bold p-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  <span>Professor is analyzing clinical findings…</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* CHAT INPUT CONTAINER */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask Professor AI Mentor about clinical reasoning, mechanics, extractions..."
                className="flex-1 text-xs px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 bg-white"
              />
              <button
                type="button"
                onClick={() => handleSendMessage()}
                disabled={!inputQuery.trim() || isAsking}
                className="bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <span>Discuss</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(TabAiMentor);
