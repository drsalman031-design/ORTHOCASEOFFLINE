import React, { useState } from 'react';
import {
  FileText,
  Download,
  CheckCircle2,
  Users,
  RefreshCw,
} from 'lucide-react';
import { PatientRecord, StudentProfile } from '../types';
import { generatePatientPDF } from '../lib/pdfGenerator';
import { getDepartmentConfig } from '../lib/authContext';

interface ReportViewerProps {
  patients: PatientRecord[];
  profile: StudentProfile;
  selectedPatientId?: string;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({
  patients,
  profile,
  selectedPatientId,
}) => {
  const activePatients = patients.filter((p) => !p.archived);
  const [selectedId, setSelectedId] = useState<string>(
    selectedPatientId || (activePatients.length > 0 ? activePatients[0].id : '')
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedPatient = patients.find((p) => p.id === selectedId);
  const deptConfig = getDepartmentConfig();

  const handleDownloadSinglePDF = () => {
    if (selectedPatient) {
      setIsGenerating(true);
      setTimeout(() => {
        try {
          generatePatientPDF(selectedPatient, profile);
        } finally {
          setIsGenerating(false);
        }
      }, 50);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-2xl py-3.5 px-4 shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">PDF Case Presentation Generator</h2>
            <p className="text-xs text-slate-300">
              100% Offline 49-Slide Comprehensive Orthodontic PDF Compilation
            </p>
          </div>
        </div>
      </div>

      {activePatients.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Patient Records Available</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Please add a patient case record to generate an offline PDF report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Patient Select Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Select Patient Record:
            </label>

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm font-semibold text-slate-800 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
            >
              {activePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId}) — {p.completionStatus?.overallPercentage || 0}% Complete
                </option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-5">
              <div className="flex flex-col space-y-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-mono bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-700 px-2 py-0.5 rounded font-bold">
                      {selectedPatient.patientId}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">{selectedPatient.name}</h3>
                    <p className="text-xs text-slate-500">
                      {selectedPatient.age} Yrs • {selectedPatient.gender} • Exam Date: {selectedPatient.examDate}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {selectedPatient.completionStatus?.overallPercentage || 0}% Complete
                    </span>
                  </div>
                </div>

                {/* Primary Action Button: PDF Compilation */}
                <div className="pt-2 flex justify-center items-center">
                  <button
                    onClick={handleDownloadSinglePDF}
                    disabled={isGenerating}
                    className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-md shadow-teal-900/10 transition cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Compiling PDF...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Case Summary Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs text-slate-700 dark:text-slate-300">
                <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between text-sm">
                  <span>Report Contents Included in PDF Presentation:</span>
                  <span className="text-[11px] font-medium text-slate-500">
                    Dept Email: {deptConfig.deptGmailId}
                  </span>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Patient Demographics & Administrative Record</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Chief Complaints, Medical, Dental & Habit History</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Extraoral Examination & Facial Thirds / VTO</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Intraoral Examination, Occlusion & Arch Alignment</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Functional Examination, Mastication & TMJ Evaluation</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Study Model Analysis, Ashley Howe & Pont's Analysis</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Radiographic, Growth (SMI/CVM) & Steiner Ceph Readings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Digital Cephalometric Tracing Geometry & Measurements</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Clinical Diagnosis & Synthesized Diagnostic Problem List</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Comprehensive Treatment Plan & Biomechanics Sequence</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Clinical Photographs Gallery ({selectedPatient.investigations?.images?.length || 0})</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>HOD / Faculty Guide Sign-off Block & Institutional Seal</span>
                  </li>
                </ul>
              </div>

              {/* Institution Header Stamp Preview */}
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 bg-white dark:bg-slate-900 text-center space-y-1 text-slate-600 dark:text-slate-400 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-sm">{profile.institution}</p>
                <p className="font-medium text-slate-500">{profile.department}</p>
                <p className="text-slate-400">
                  Record Logged by: {profile.studentName} ({profile.rollNumber})
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
