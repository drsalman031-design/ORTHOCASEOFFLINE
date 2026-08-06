import React, { useState } from 'react';
import {
  X,
  FileText,
  Edit,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  User,
  Stethoscope,
  Image as ImageIcon,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { PatientRecord, StudentProfile } from '../types';
import { generatePatientPDF } from '../lib/pdfGenerator';

interface CaseDetailsModalProps {
  patient: PatientRecord;
  profile: StudentProfile;
  onClose: () => void;
  onEdit: (patient: PatientRecord) => void;
}

export const CaseDetailsModal: React.FC<CaseDetailsModalProps> = ({
  patient,
  profile,
  onClose,
  onEdit,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const score = patient.completionStatus?.overallPercentage || 0;
  const cc = patient.chiefComplaint || {};
  const med = patient.medicalHistory || {};
  const dent = patient.dentalHistory || {};
  const hab = patient.habitHistory || {};
  const eo = patient.extraoralExam || patient.extraoralProfile || {};
  const ie = patient.intraoralExam || patient.intraoralSection || {};
  const fn = patient.functionalExam || patient.functionalTmj || {};
  const inv = patient.investigations || {};
  const dp = patient.diagnosisAndPlan || {};

  const handleDownloadPDF = () => {
    generatePatientPDF(patient, profile);
  };

  return (
    <div className="shell-overlay items-end sm:items-center justify-center overflow-hidden">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-[430px] h-[min(94%,100%)] sm:h-[min(92%,780px)] flex flex-col shadow-2xl overflow-hidden border border-slate-200 mb-0">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 shrink-0 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600 font-bold text-white flex items-center justify-center text-base shrink-0">
              {patient.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-bold text-base text-white truncate">{patient.name}</h3>
                <span className="text-xs bg-slate-800 text-teal-300 font-mono px-2 py-0.5 rounded border border-slate-700 shrink-0">
                  {patient.patientId}
                </span>
              </div>
              <p className="text-meta text-slate-400 truncate">
                {patient.age} Yrs • {patient.gender} • Exam Date: {patient.examDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleDownloadPDF}
              className="touch-target flex items-center justify-center gap-1 bg-teal-600 active:bg-teal-500 text-white px-2.5 rounded-xl text-meta font-semibold shadow-xs cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onEdit(patient);
              }}
              className="touch-target rounded-xl bg-slate-800 text-slate-300 active:text-white active:bg-slate-700 flex items-center justify-center cursor-pointer"
              title="Edit Form"
              aria-label="Edit form"
            >
              <Edit className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="touch-target rounded-xl text-slate-400 active:text-white active:bg-slate-800 flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-meta">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Case History Completion:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-xs ${
                score >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {score}% Complete
            </span>
          </div>
          <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-600' : 'bg-amber-500'}`}
              style={{ width: `${score}%` }}
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-meta text-slate-800">
          {/* Section 1: Demographics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-meta">
            <div>
              <span className="text-slate-500 block font-semibold text-xs">Patient Name</span>
              <span className="font-bold text-slate-900 text-base">{patient.name}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold text-xs">Patient ID</span>
              <span className="font-mono font-bold text-slate-900 text-base">{patient.patientId}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold text-xs">Age / Gender</span>
              <span className="font-bold text-slate-900 text-base">{patient.age} Yrs / {patient.gender}</span>
            </div>
            <div>
              <span className="text-slate-500 block font-semibold text-xs">Contact</span>
              <span className="font-bold text-slate-900 text-base">{patient.contact || 'N/A'}</span>
            </div>
          </div>

          {/* Section A: Chief Complaint */}
          <div className="space-y-1.5 border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base text-teal-800">A. Chief Complaint</h4>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1 text-meta">
              <p>
                <span className="font-bold text-slate-700">Complaints: </span>
                {[
                  cc.irregularTeeth && 'Irregular teeth',
                  cc.protrudingTeeth && 'Protruding teeth',
                  cc.spacing && 'Spacing',
                  cc.missingTeeth && 'Missing teeth',
                  cc.jawProblem && 'Jaw problem',
                  cc.facialAesthetics && 'Facial aesthetics',
                  cc.otherText,
                ]
                  .filter(Boolean)
                  .join(', ') || 'None specified'}
              </p>
              <p>
                <span className="font-bold text-slate-700">Duration: </span>
                {cc.duration || 'N/A'}
              </p>
              {cc.additionalNotes && (
                <p>
                  <span className="font-bold text-slate-700">Remarks: </span>
                  {cc.additionalNotes}
                </p>
              )}
            </div>
          </div>

          {/* Section B & C & D: Medical, Dental, Habits */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <h5 className="font-bold text-slate-900 text-meta">B. Medical History</h5>
              <p className="text-meta text-slate-700">
                {med.noSignificantHistory
                  ? 'No significant history'
                  : [
                      med.diabetes && 'Diabetes',
                      med.hypertension && 'Hypertension',
                      med.asthma && 'Asthma',
                      med.allergy && 'Allergy',
                      med.bleedingDisorder && 'Bleeding Disorder',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <h5 className="font-bold text-slate-900 text-meta">C. Dental History</h5>
              <p className="text-meta text-slate-700">
                {[
                  dent.previousExtraction && 'Previous extraction',
                  dent.previousOrtho && 'Previous ortho',
                  dent.trauma && 'Trauma',
                  dent.restoration && 'Restoration',
                ]
                  .filter(Boolean)
                  .join(', ') || 'No significant dental history'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
              <h5 className="font-bold text-slate-900 text-meta">D. Habit History</h5>
              <p className="text-meta text-slate-700">
                {hab.none
                  ? 'No habits'
                  : [
                      hab.thumbSucking && 'Thumb sucking',
                      hab.mouthBreathing && 'Mouth breathing',
                      hab.tongueThrusting && 'Tongue thrusting',
                      hab.lipHabit && 'Lip habit',
                      hab.bruxism && 'Bruxism',
                    ]
                      .filter(Boolean)
                      .join(', ') || 'None'}
              </p>
            </div>
          </div>

          {/* Section E: Extraoral Examination */}
          <div className="space-y-1.5 border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base text-teal-800">E. Extraoral Examination</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-meta">
              <div>
                <span className="text-slate-500 block text-xs">Symmetry</span>
                <span className="font-bold text-slate-900">{eo.symmetry || 'Symmetric'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Profile</span>
                <span className="font-bold text-slate-900">{eo.profile || 'Straight'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Facial Type</span>
                <span className="font-bold text-slate-900">{eo.facialType || 'Mesofacial'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Lip Competency</span>
                <span className="font-bold text-slate-900">{eo.lipCompetency || 'Competent'}</span>
              </div>
            </div>
          </div>

          {/* Section F: Intraoral Examination */}
          <div className="space-y-1.5 border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base text-teal-800">F. Intraoral Examination</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-meta">
              <div>
                <span className="text-slate-500 block text-xs">Molar Right</span>
                <span className="font-bold text-teal-800">{ie.molarRight || 'Class I'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Molar Left</span>
                <span className="font-bold text-teal-800">{ie.molarLeft || 'Class I'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Canine Right</span>
                <span className="font-bold text-teal-800">{ie.canineRight || 'Class I'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Canine Left</span>
                <span className="font-bold text-teal-800">{ie.canineLeft || 'Class I'}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-xs">Overjet</span>
                <span className="font-bold">{ie.overjetMm !== '' ? `${ie.overjetMm} mm` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Overbite</span>
                <span className="font-bold">{ie.overbiteMm !== '' ? `${ie.overbiteMm} mm` : 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Upper Crowding</span>
                <span className="font-bold">{ie.crowdingUpperMm || 0} mm</span>
              </div>
              <div>
                <span className="text-slate-500 block text-xs">Crossbite</span>
                <span className="font-bold">{ie.crossbite || 'None'}</span>
              </div>
            </div>
          </div>

          {/* Section G: Functional */}
          <div className="space-y-1.5 border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base text-teal-800">G. Functional Examination</h4>
            <p className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-meta">
              Breathing: <span className="font-bold text-slate-900">{fn.breathing || 'Nasal'}</span> • Swallowing:{' '}
              <span className="font-bold text-slate-900">{fn.swallowing || 'Normal'}</span> • TMJ Status:{' '}
              <span className="font-bold text-slate-900">{fn.tmj || 'Normal'}</span>
            </p>
          </div>

          {/* Section H: Investigations & Photographs */}
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <h4 className="font-bold text-slate-900 text-base text-teal-800">
              H. Investigation Photographs & Radiographs ({inv.images?.length || 0})
            </h4>

            {!inv.images || inv.images.length === 0 ? (
              <p className="text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-meta">
                No photographs uploaded for this patient.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {inv.images.map((img) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img.dataUrl)}
                    className="group bg-slate-900 rounded-xl overflow-hidden border border-slate-800 cursor-pointer relative"
                  >
                    <div className="aspect-4/3 relative overflow-hidden bg-black flex items-center justify-center">
                      <img src={img.dataUrl} alt={img.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Maximize2 className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="p-2 text-white">
                      <span className="text-xs bg-teal-500/20 text-teal-300 font-bold px-1.5 py-0.5 rounded">
                        {img.category}
                      </span>
                      <p className="text-xs font-semibold truncate mt-0.5">{img.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnosis & Plan */}
          <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-4 rounded-2xl space-y-2 shadow-md">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold text-meta uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Provisional Diagnosis & Treatment Plan
            </div>

            <p className="text-meta text-slate-200 font-medium leading-relaxed">
              {dp.provisionalDiagnosis || 'Pending clinical synthesis.'}
            </p>

            <div className="grid grid-cols-2 gap-2 text-meta pt-2 border-t border-slate-800">
              <div>
                <span className="text-slate-400 block text-xs">Skeletal Class:</span>
                <span className="font-bold text-teal-200">{dp.skeletalClassification || 'Skeletal Class I'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Appliance:</span>
                <span className="font-bold text-teal-200">{dp.proposedAppliance || 'Fixed Appliance'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Extractions:</span>
                <span className="font-bold text-teal-200">{dp.extractionPlan || 'Non-Extraction'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Retention:</span>
                <span className="font-bold text-teal-200">{dp.retentionPlan || 'Fixed Retainer'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              onClose();
              onEdit(patient);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-meta font-semibold cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Edit Record
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-meta font-bold shadow-md cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            Download Case PDF
          </button>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-full">
            <img src={selectedImage} alt="Expanded View" className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white p-2 text-sm font-bold bg-slate-800 rounded-full"
            >
              Close (✕)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
