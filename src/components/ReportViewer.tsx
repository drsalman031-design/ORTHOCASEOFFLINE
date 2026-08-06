import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  Printer,
  CheckCircle2,
  Sparkles,
  Users,
  Search,
  BookOpen,
} from 'lucide-react';
import { PatientRecord, StudentProfile } from '../types';
import { generatePatientPDF } from '../lib/pdfGenerator';

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

  const selectedPatient = patients.find((p) => p.id === selectedId);

  const handleDownloadSinglePDF = () => {
    if (selectedPatient) {
      generatePatientPDF(selectedPatient, profile);
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Page Header */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">PDF Case History Generator</h2>
            <p className="text-meta text-slate-300">
              Offline PDF generation with embedded photographs & complete examination notes
            </p>
          </div>
        </div>
      </div>

      {activePatients.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Patient Records Available</h3>
          <p className="text-meta text-slate-500 max-w-xs mx-auto">
            Please add or unarchive a patient case record to generate an offline PDF report.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Patient Select Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
            <label className="block text-meta font-bold text-slate-800 uppercase tracking-wider">
              Select Patient Record:
            </label>

            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
            >
              {activePatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.patientId}) — {p.completionStatus?.overallPercentage || 0}% Complete
                </option>
              ))}
            </select>
          </div>

          {selectedPatient && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-mono bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded font-bold">
                    {selectedPatient.patientId}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">{selectedPatient.name}</h3>
                  <p className="text-meta text-slate-500">
                    {selectedPatient.age} Yrs • {selectedPatient.gender} • Exam Date: {selectedPatient.examDate}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadSinglePDF}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white px-4 py-2.5 rounded-xl text-base font-bold shadow-md transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF Report
                  </button>
                </div>
              </div>

              {/* Case Summary Card */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-meta text-slate-700">
                <div className="font-bold text-slate-900 flex items-center justify-between text-base">
                  <span>Report Contents Included in PDF:</span>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {selectedPatient.completionStatus?.overallPercentage || 0}% Complete
                  </span>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-meta">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Patient Demographics & Contact Info</span>
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Chief Complaint & Duration</span>
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Medical, Dental & Habit History</span>
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Extraoral & Intraoral Examinations</span>
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Molar/Canine Relations & Overjet/Overbite</span>
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Functional Examination (Breathing/TMJ)</span>
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Embedded Extraoral/Intraoral Photographs & Scans ({selectedPatient.investigations?.images?.length || 0})</span>
                  </li>

                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Provisional Diagnosis & Treatment Plan Notes</span>
                  </li>
                </ul>
              </div>

              {/* Institution Header Stamp Preview */}
              <div className="border border-dashed border-slate-300 rounded-xl p-4 bg-white text-center space-y-1 text-slate-600 text-meta">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-base">{profile.institution}</p>
                <p className="text-meta font-medium text-slate-500">{profile.department}</p>
                <p className="text-meta text-slate-400">
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
