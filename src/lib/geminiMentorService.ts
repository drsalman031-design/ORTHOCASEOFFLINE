import { GoogleGenAI } from '@google/genai';
import { PatientRecord } from '../types';
import { generateOrthoMentorData, MentorModuleData } from './orthoMentorEngine';

export interface ChatMessage {
  id: string;
  sender: 'student' | 'mentor';
  text: string;
  timestamp: string;
  moduleRef?: string;
}

export async function generateGeminiMentorData(
  patient: PatientRecord
): Promise<MentorModuleData> {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  const fallbackData = generateOrthoMentorData(patient);

  if (!apiKey) {
    return fallbackData;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are OrthoCase AI Mentor, a Senior University Professor of Orthodontics, postgraduate examiner, and clinical mentor discussing a postgraduate orthodontic case presentation.
Analyze the following patient record and synthesize a comprehensive, textbook-grade postgraduate clinical discussion covering all 13 required educational modules formatted strictly as JSON.

PATIENT RECORD:
${JSON.stringify(patient, null, 2)}

REQUIREMENTS:
Return a JSON object strictly matching this TypeScript structure:

{
  "module1CaseDiscussion": {
    "overview": "...",
    "interrelationships": [ { "findingA": "...", "findingB": "...", "clinicalEffect": "..." } ],
    "synthesisParagraph": "..."
  },
  "module2DiagnosticReasoning": {
    "summary": "...",
    "diagnosticJustifications": [ { "diagnosis": "...", "rationale": "...", "clinicalSignificance": "..." } ]
  },
  "module3ClinicalCorrelation": {
    "correlations": [ { "diagnosisItem": "...", "clinicalManifestation": "...", "physiologicalExplanation": "..." } ]
  },
  "module4DifferentialDiagnosis": {
    "differentialItems": [ { "alternativeDiagnosis": "...", "whyConsidered": "...", "whyExcluded": "...", "supportingEvidenceForFinal": "..." } ]
  },
  "module5TreatmentObjectives": {
    "prioritizedObjectives": [ { "priority": 1, "objective": "...", "drivingFindings": "...", "importance": "..." } ]
  },
  "module6TreatmentOptions": {
    "options": [
      {
        "title": "...",
        "modality": "...",
        "indications": [ "..." ],
        "advantages": [ "..." ],
        "limitations": [ "..." ],
        "levelOfEvidence": "...",
        "clinicalConsiderations": "..."
      }
    ],
    "mentorRecommendationSummary": "..."
  },
  "module7RiskAnalysis": {
    "risks": [ { "category": "...", "riskDescription": "...", "mitigatingStrategy": "...", "level": "Low" | "Moderate" | "High" } ]
  },
  "module8EvidenceBasedLearning": {
    "principles": [ { "concept": "...", "referenceSource": "...", "applicationToCase": "..." } ]
  },
  "module9ClinicalPearls": [ "Pearl 1...", "Pearl 2...", "Pearl 3..." ],
  "module10CommonMistakes": { "mistake": "...", "impact": "...", "preventionStrategy": "..." },
  "module11VivaPreparation": [
    {
      "id": "viva-1",
      "level": "Basic",
      "question": "...",
      "hint": "...",
      "modelAnswer": "...",
      "keyConcepts": [ "..." ]
    }
  ],
  "module12SelfAssessment": [
    {
      "id": "sa-1",
      "question": "...",
      "guidance": "...",
      "evidencePoints": [ "..." ]
    }
  ],
  "module13FacultyNotes": {
    "presentationHighlights": [ "..." ],
    "teachingPoints": [ "..." ],
    "discussionTopics": [ "..." ],
    "clinicalControversies": [ "..." ]
  }
}

RULES:
- Return RAW JSON ONLY. No markdown formatted ticks around JSON.
- Be concise, textbook-grade, and academically rigorous.
- Never encourage blind acceptance of AI suggestions; explain WHY.
- Always encourage evidence-based thinking.
- Never fabricate clinical findings.
- Relate every diagnosis to clinical presentation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '';
    const parsed = JSON.parse(text) as MentorModuleData;
    if (parsed && parsed.module1CaseDiscussion && parsed.module11VivaPreparation) {
      return parsed;
    }
  } catch (err) {
    console.warn('Gemini AI mentor generation failed or fallback triggered:', err);
  }

  return fallbackData;
}

export async function askGeminiMentorQuestion(
  patient: PatientRecord,
  userQuestion: string,
  history: ChatMessage[] = []
): Promise<string> {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  if (!apiKey) {
    return `[Professor OrthoCase AI Mentor] Excellent question regarding this case! Based on the patient's record (${patient.name || 'Patient'}, ${patient.age || 14}y/o ${patient.gender || 'Female'}), when evaluating "${userQuestion}", we must correlate the cephalometric findings (SNA, SNB, ANB, FMPA), intraoral overjet/overbite, and soft tissue profile. Remember: always evaluate skeletal vs dental compensation before committing to a treatment decision.`;
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const formattedHistory = history
      .slice(-6)
      .map((m) => `${m.sender === 'student' ? 'Student' : 'Professor'}: ${m.text}`)
      .join('\n');

    const prompt = `You are OrthoCase AI Mentor, an experienced Professor of Orthodontics, postgraduate examiner, and clinical mentor.
You are discussing a patient case in a university postgraduate seminar with a postgraduate resident.

PATIENT RECORD DATA:
${JSON.stringify(patient, null, 2)}

PREVIOUS CONVERSATION CONTEXT:
${formattedHistory}

STUDENT QUESTION:
"${userQuestion}"

INSTRUCTIONS:
1. Respond in the tone of an encouraging, highly knowledgeable Professor of Orthodontics.
2. Address the student's question directly, referencing specific data points from this patient's case (e.g. cephalometrics, overjet, profile, growth status, model analysis).
3. Explain the underlying biomechanical and biological WHY behind the clinical reasoning.
4. Keep the answer structured, concise, and academically rigorous.
5. End with a thought-provoking clinical follow-up question or clinical pearl to stimulate further reasoning.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || 'I apologize, but I could not synthesize a response. Let us review the patient record together.';
  } catch (err) {
    console.error('Error asking Gemini Mentor:', err);
    return `[Professor OrthoCase AI Mentor] Good query! In this patient's case, we need to carefully weigh the skeletal discrepancy against the soft tissue profile and patient growth potential.`;
  }
}
