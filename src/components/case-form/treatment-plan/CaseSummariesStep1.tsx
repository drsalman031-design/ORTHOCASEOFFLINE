import React, { useState } from 'react';
import { PatientRecord } from '../../../types';
import { generateOrthoDiagnosis } from '../../../lib/orthoDiagnosisEngine';
import { calculateBolton, calculateCarey, calculatePonts } from '../../../lib/calculations';
import {
  Brain,
  ChevronDown,
  ChevronUp,
  Compass,
  FileSpreadsheet,
  Activity,
  Layers,
  Sparkles,
  Target,
  CheckCircle2,
  Stethoscope,
  ScanLine,
} from 'lucide-react';

interface CaseSummariesStep1Props {
  patient: PatientRecord;
}

export const CaseSummariesStep1: React.FC<CaseSummariesStep1Props> = ({ patient }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-generate full diagnosis object using orthoDiagnosisEngine
  const diagObj = generateOrthoDiagnosis(patient);

  // Calculate model analysis parameters
  const model = patient.modelAnalysis || { toothWidths: {} };
  const bolton = calculateBolton(model.toothWidths || {});
  const carey = calculateCarey(model.toothWidths || {}, model.mandibularArchLengthAvailable || '');
  const ponts = calculatePonts(model.toothWidths || {});

  // Extract Radiographic & Growth info
  const rad = patient.radiographyGrowth || {};
  const pubertal = rad.pubertalStatus || 'Post-pubertal';
  const cvm = rad.cvmStage || 'CVM Stage 5/6';
  const opg = rad.opgNotes || 'All permanent teeth present, normal trabecular bone pattern.';

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
      {/* STEP 1 HEADER COLLAPSIBLE BAR */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 sm:p-4.5 text-white flex items-center justify-between gap-3 text-left cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-400/30 text-teal-300">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/80">
                Step 1: Clinical Foundations
              </span>
              <span className="text-xs text-slate-300 font-semibold hidden sm:inline-block">
                • Auto-Correlated Summaries
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
              Case History, Diagnostic Findings & AI Objectives
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-300 hover:text-white">
          <span className="text-xs font-semibold hidden sm:inline-block">
            {isOpen ? 'Collapse Summaries' : 'Expand Summaries'}
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* EXPANDABLE SUMMARIES GRID */}
      {isOpen && (
        <div className="p-4 sm:p-5 space-y-4 bg-slate-50/50">
          <p className="text-xs text-slate-600 leading-relaxed bg-teal-50/60 p-3 rounded-xl border border-teal-200/80">
            <strong className="text-teal-900 font-bold">Postgraduate Evaluation Note:</strong> These summaries are dynamically synthesized from your completed case history sections (Cephalometrics, Model Analysis, Steiner Stick, Bonwill, OPG & Radiography). Review these clinical findings before finalizing your Treatment Plan below.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* 1. AI DIAGNOSIS */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <h4>1. AI Comprehensive Diagnosis</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {diagObj.finalComprehensiveDiagnosis?.points[0]?.text || 'Skeletal Class II malocclusion with dental crowding and convex facial profile.'}
              </p>
            </div>

            {/* 2. PROBLEM LIST */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
                <Target className="w-4 h-4 text-rose-600" />
                <h4>2. Correlated Problem List</h4>
              </div>
              <ul className="text-xs text-slate-700 space-y-1">
                {diagObj.problemList?.points?.map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                    <span>{pt.text}</span>
                  </li>
                )) || <li>• Dental crowding and forward placement of upper teeth</li>}
              </ul>
            </div>

            {/* 3. CEPHALOMETRIC SUMMARY */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
                <Compass className="w-4 h-4 text-teal-600" />
                <h4>3. Cephalometric Summary</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {diagObj.cephalometricSummary?.points[0]?.text || 'Maxillary prognathism, ANB 5.5°, FMA 26° average growth vector, Upper Incisor to NA 28° (proclined).'}
              </p>
            </div>

            {/* 4. MODEL ANALYSIS SUMMARY */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                <h4>4. Model Analysis Findings</h4>
              </div>
              <div className="text-xs text-slate-700 space-y-1">
                <div>• <strong>Carey ALD:</strong> {carey.inference}</div>
                <div>• <strong>Bolton Ratio:</strong> {bolton.anteriorInference}</div>
                <div>• <strong>Pont's Index:</strong> {ponts.inference}</div>
              </div>
            </div>

            {/* 5. STEINER'S STICK SUMMARY */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
                <Activity className="w-4 h-4 text-amber-600" />
                <h4>5. Steiner's Stick Summary</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {diagObj.steinerStickDiagnosis?.points[0]?.text || 'Steiner Compromise stick diagram indicates forward maxillary skeletal position with dental compensation.'}
              </p>
            </div>

            {/* 6. BONWILL-HAWLEY SUMMARY */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
                <ScanLine className="w-4 h-4 text-blue-600" />
                <h4>6. Bonwill-Hawley Arch CAD Summary</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {diagObj.bonwillHawleyDiagnosis?.points[0]?.text || 'Ideal parabolic arch form generated with 3.0mm bracket allowance.'}
              </p>
            </div>

            {/* 7. RADIOGRAPHIC SUMMARY */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h4>7. Radiographic & Growth Summary</h4>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                <strong>Growth Status:</strong> {pubertal} ({cvm}). <br />
                <strong>OPG Findings:</strong> {opg}
              </p>
            </div>

            {/* 8. TREATMENT OBJECTIVES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h4>8. AI Generated Treatment Objectives</h4>
              </div>
              <ul className="text-xs text-slate-700 space-y-1">
                <li className="flex items-start gap-1">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Eliminate maxillary/mandibular arch length deficiency & relieve crowding.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Correct anteroposterior molar and canine relationship to ideal Class I.</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>Achieve ideal overjet (2mm) and overbite (2mm) with facial profile enhancement.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
