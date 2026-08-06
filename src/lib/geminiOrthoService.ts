import { GoogleGenAI } from '@google/genai';
import { PatientRecord } from '../types';
import { FullOrthoDiagnosis, generateOrthoDiagnosis } from './orthoDiagnosisEngine';
import { FullOrthoTreatmentPlan, generateOrthoTreatmentPlan } from './orthoTreatmentPlanEngine';

export async function generateGeminiOrthoDiagnosis(
  patient: PatientRecord
): Promise<FullOrthoDiagnosis> {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  if (!apiKey) {
    // Return deterministic postgraduate rule engine output
    return generateOrthoDiagnosis(patient);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a Senior University Professor of Orthodontics & Dentofacial Orthopedics.
Analyze the following postgraduate patient record data and generate a point-wise, textbook-precise postgraduate orthodontic diagnosis formatted strictly in JSON.

PATIENT RECORD DATA:
${JSON.stringify(patient, null, 2)}

REQUIREMENTS:
Generate a valid JSON object matching the following TypeScript interface exactly:

{
  "chiefComplaint": { "id": "chiefComplaint", "title": "1. Chief Complaint", "points": [ { "id": "cc-1", "text": "..." } ] },
  "extraoralDiagnosis": { "id": "extraoralDiagnosis", "title": "2. Extraoral Diagnosis", "points": [ { "id": "eo-1", "text": "..." } ] },
  "functionalDiagnosis": { "id": "functionalDiagnosis", "title": "3. Functional Diagnosis", "points": [ { "id": "fn-1", "text": "..." } ] },
  "skeletalDiagnosis": { "id": "skeletalDiagnosis", "title": "4. Skeletal Diagnosis", "points": [ { "id": "sk-1", "text": "..." } ] },
  "dentalDiagnosis": { "id": "dentalDiagnosis", "title": "5. Dental Diagnosis", "points": [ { "id": "dt-1", "text": "..." } ] },
  "cephalometricSummary": { "id": "cephalometricSummary", "title": "6. Cephalometric Summary", "points": [ { "id": "cp-1", "text": "..." } ] },
  "steinerStickDiagnosis": { "id": "steinerStickDiagnosis", "title": "7. Steiner's Stick Diagnosis", "points": [ { "id": "st-1", "text": "..." } ] },
  "modelAnalysisSummary": { "id": "modelAnalysisSummary", "title": "8. Model Analysis Summary", "points": [ { "id": "ma-1", "text": "..." } ] },
  "bonwillHawleyDiagnosis": { "id": "bonwillHawleyDiagnosis", "title": "9. Bonwill-Hawley Triangle Diagnosis", "points": [ { "id": "bh-1", "text": "..." } ] },
  "radiographicDiagnosis": { "id": "radiographicDiagnosis", "title": "10. Radiographic Diagnosis", "points": [ { "id": "rd-1", "text": "..." } ] },
  "etiologicalDiagnosis": { "id": "etiologicalDiagnosis", "title": "11. Etiological Diagnosis", "points": [ { "id": "et-1", "text": "..." } ] },
  "problemList": { "id": "problemList", "title": "12. Prioritized Problem List", "points": [ { "id": "pr-1", "text": "..." } ] },
  "finalComprehensiveDiagnosis": { "id": "finalComprehensiveDiagnosis", "title": "13. Final Comprehensive Diagnosis", "points": [ { "id": "fd-1", "text": "..." } ] }
}

RULES:
- Return raw JSON ONLY, no markdown ticks (\`\`\`json).
- Provide complete, unabbreviated, and detailed clinical sentences for all sections.
- Do NOT truncate thoughts, summarize excessively, or clip medical descriptions short.
- Ensure every bullet point forms a fully realized, grammatically complete clinical observation in textbook-grade postgraduate orthodontic prose.
- Correlate clinical, cephalometric, model analysis, and radiographic findings across all tabs seamlessly.
- Mention abnormal findings prior to normal physiological observations.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText) as FullOrthoDiagnosis;
    if (parsed && parsed.chiefComplaint && parsed.finalComprehensiveDiagnosis) {
      return parsed;
    }
  } catch (err) {
    console.warn('Gemini AI diagnosis failed or API key not available, using fallback rule engine:', err);
  }

  return generateOrthoDiagnosis(patient);
}

export async function generateGeminiOrthoTreatmentPlan(
  patient: PatientRecord
): Promise<FullOrthoTreatmentPlan> {
  const apiKey =
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    '';

  if (!apiKey) {
    return generateOrthoTreatmentPlan(patient);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a Senior University Professor of Orthodontics & Dentofacial Orthopedics.
Analyze the following patient record and synthesize an evidence-informed, textbook-grade postgraduate orthodontic final treatment plan formatted strictly as JSON.

PATIENT RECORD:
${JSON.stringify(patient, null, 2)}

REQUIREMENTS:
Generate a valid JSON matching this schema:
{
  "caseSummary": { "id": "caseSummary", "title": "1. Case Summary", "points": [ { "id": "cs-1", "text": "..." } ] },
  "treatmentObjectives": { "id": "treatmentObjectives", "title": "2. Treatment Objectives", "points": [ { "id": "to-1", "text": "..." } ] },
  "treatmentModality": { "id": "treatmentModality", "title": "3. Treatment Modality", "points": [ { "id": "tm-1", "text": "..." } ] },
  "growthModification": { "id": "growthModification", "title": "4. Growth Modification", "points": [ { "id": "gm-1", "text": "..." } ] },
  "extractionDecision": { "id": "extractionDecision", "title": "5. Extraction Decision", "points": [ { "id": "ed-1", "text": "..." } ] },
  "expansionPlan": { "id": "expansionPlan", "title": "6. Expansion Plan", "points": [ { "id": "ep-1", "text": "..." } ] },
  "applianceSelection": { "id": "applianceSelection", "title": "7. Appliance Selection", "points": [ { "id": "as-1", "text": "..." } ] },
  "anchoragePlanning": { "id": "anchoragePlanning", "title": "8. Anchorage Planning", "points": [ { "id": "ap-1", "text": "..." } ] },
  "biomechanics": { "id": "biomechanics", "title": "9. Biomechanics & Force Vectors", "points": [ { "id": "bm-1", "text": "..." } ] },
  "treatmentSequence": { "id": "treatmentSequence", "title": "10. Step-by-Step Treatment Sequence", "points": [ { "id": "ts-1", "text": "..." } ] },
  "orthognathicSurgery": { "id": "orthognathicSurgery", "title": "11. Orthognathic Surgery", "points": [ { "id": "og-1", "text": "..." } ] }
}

RULES:
- Return raw JSON ONLY.
- Each section MUST contain complete, detailed, textbook-grade orthodontic sentences.
- Correlate diagnostic findings, age/growth status, space analyses (Carey, ALD, Bolton), and cephalometric angles.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text || '';
    const parsed = JSON.parse(jsonText) as FullOrthoTreatmentPlan;
    if (parsed && parsed.caseSummary && parsed.treatmentSequence) {
      return parsed;
    }
  } catch (err) {
    console.warn('Gemini AI treatment plan generation failed, falling back to rule engine:', err);
  }

  return generateOrthoTreatmentPlan(patient);
}

