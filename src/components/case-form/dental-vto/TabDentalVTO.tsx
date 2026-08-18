import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  PatientRecord,
  StudentProfile,
  DentalVTOData,
  CurrentDentalStatus,
  DesiredDentalObjective,
} from '../../../types';
import {
  createDefaultDentalVTOData,
  createDefaultDesiredObjective,
  createDefaultWhatIfParams,
  calculateIncisorDifferences,
  calculateSpaceBudget,
  calculateAnchorageDemand,
} from '../../../lib/dentalVTOEngine';
import {
  adaptPatientToDentalVTO,
  AdaptedDentalVTOStatus,
} from '../../../lib/dentalVTODataAdapter';
import { Step1CurrentDentalStatus } from './Step1CurrentDentalStatus';
import { Step2DesiredObjective } from './Step2DesiredObjective';
import { Step3DentalVTOInference } from './Step3DentalVTOInference';
import { DentalVTOReportModal } from './DentalVTOReportModal';
import {
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface TabDentalVTOProps {
  patient: PatientRecord;
  profile?: StudentProfile;
  onUpdatePatient: (updated: PatientRecord) => void;
  onPrevTab?: () => void;
  onNextTab?: () => void;
}

const WORKFLOW_STEPS = [
  { id: 1, label: '01 Current Case' },
  { id: 2, label: '02 Set Objective' },
  { id: 3, label: '03 Dental VTO Inference' },
];

export const TabDentalVTO: React.FC<TabDentalVTOProps> = ({
  patient,
  profile,
  onUpdatePatient,
  onPrevTab,
  onNextTab,
}) => {
  // Set of user-overridden field names
  const [userOverrides, setUserOverrides] = useState<Set<string>>(new Set());

  // Adapt baseline from patient case record
  const adapted: AdaptedDentalVTOStatus = useMemo(() => {
    return adaptPatientToDentalVTO(
      patient,
      patient.dentalVto?.currentStatus,
      userOverrides
    );
  }, [patient, userOverrides]);

  // Main Dental VTO Data State
  const [vtoData, setVtoData] = useState<DentalVTOData>(() => {
    const existing = patient.dentalVto;
    if (existing) {
      return {
        ...existing,
        currentStatus: adapted.status,
      };
    }
    return {
      ...createDefaultDentalVTOData(),
      currentStatus: adapted.status,
    };
  });

  const [activeStep, setActiveStep] = useState<number>(1);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Sync with incoming patient record updates
  useEffect(() => {
    if (patient.dentalVto) {
      setVtoData((prev) => ({
        ...prev,
        ...patient.dentalVto,
        currentStatus: prev.currentStatus || adapted.status,
      }));
    }
  }, [patient.id]);

  const currentStatus = vtoData.currentStatus || adapted.status;
  const desiredObjective = vtoData.desiredObjective || createDefaultDesiredObjective();
  const mechanics = vtoData.mechanics;
  const whatIfParams = vtoData.whatIfParams || createDefaultWhatIfParams();

  // Space Budget calculations
  const spaceBudget = useMemo(() => {
    return calculateSpaceBudget(currentStatus, desiredObjective, mechanics, whatIfParams);
  }, [currentStatus, desiredObjective, mechanics, whatIfParams]);

  // Incisor Differences
  const diffs = useMemo(() => {
    return calculateIncisorDifferences(currentStatus, desiredObjective);
  }, [currentStatus, desiredObjective]);

  // Anchorage Demand
  const calculatedAnchorageDemand = useMemo(() => {
    return calculateAnchorageDemand(diffs.deltaU1NaMm, spaceBudget, vtoData.anchorage?.strategy);
  }, [diffs.deltaU1NaMm, spaceBudget, vtoData.anchorage?.strategy]);

  // State update dispatcher
  const updateVTOState = useCallback((updated: Partial<DentalVTOData>) => {
    const fullUpdated: DentalVTOData = {
      ...vtoData,
      ...updated,
      updatedAt: new Date().toISOString(),
    };
    setVtoData(fullUpdated);
    onUpdatePatient({
      ...patient,
      dentalVto: fullUpdated,
    });
  }, [vtoData, patient, onUpdatePatient]);

  // Handle student manual override in Step 1
  const handleCurrentStatusChange = (
    updatedStatus: CurrentDentalStatus,
    overriddenField?: keyof CurrentDentalStatus
  ) => {
    if (overriddenField) {
      setUserOverrides((prev) => new Set(prev).add(overriddenField));
    }
    updateVTOState({ currentStatus: updatedStatus });
  };

  // SYNC WITH CASE button handler
  const handleSyncWithCase = () => {
    setUserOverrides(new Set()); // Reset student overrides
    const freshAdapted = adaptPatientToDentalVTO(patient, undefined, new Set());
    updateVTOState({ currentStatus: freshAdapted.status });
    setSaveBanner('Successfully synchronized with the latest Patient Case Record!');
    setTimeout(() => setSaveBanner(null), 3500);
  };

  // Reset entire VTO
  const handleResetVTO = () => {
    if (window.confirm('Are you sure you want to reset Dental VTO to defaults?')) {
      const def = createDefaultDentalVTOData();
      def.currentStatus = adapted.status;
      setVtoData(def);
      setUserOverrides(new Set());
      onUpdatePatient({ ...patient, dentalVto: def });
    }
  };

  return (
    <div className="space-y-4 w-full max-w-7xl mx-auto px-2 sm:px-4 pb-8">
      {/* ------------------------------------------------------------- */}
      {/* HERO HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-teal-800/40 shadow-lg space-y-2.5">
        {/* HEADER: title on left, reset button on right */}
        <div className="flex items-center justify-between gap-4 w-full">
          <div className="flex flex-col space-y-1">
            <div className="inline-flex items-center">
              <span className="text-[10px] bg-teal-500/20 text-teal-300 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-teal-500/30">
                Module 8 • Educational Inference
              </span>
            </div>
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-teal-200 leading-none">
                DENTAL VTO
              </h2>
              <span className="text-xs sm:text-sm font-semibold text-teal-300">
                Dental Visual Treatment Objective
              </span>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleResetVTO}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10 transition-colors cursor-pointer shrink-0"
              title="Reset to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>
        
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          Interpret planned dental objectives, required incisor translation, space balance, and anchorage demand through point-wise clinical analysis.
        </p>

        {/* NOTIFICATION BANNER */}
        {saveBanner && (
          <div className="p-2.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
            <span>{saveBanner}</span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3-STEP WORKFLOW NAVIGATOR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-2.5 shadow-2xs">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {WORKFLOW_STEPS.map((step) => {
            const isActive = activeStep === step.id;
            const isCompleted = activeStep > step.id;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStep(step.id)}
                className={`py-2 px-1.5 sm:px-3 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm ring-2 ring-teal-600/30'
                    : isCompleted
                    ? 'bg-teal-50/80 text-teal-900 hover:bg-teal-100/70 border border-teal-200/60'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                }`}
              >
                <span className="truncate">{step.label}</span>
                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 hidden sm:inline" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ACTIVE STEP CONTENT */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-6">
        {/* STEP 1: CURRENT CASE */}
        {activeStep === 1 && (
          <Step1CurrentDentalStatus
            patientId={patient.patientId}
            data={currentStatus}
            provenanceMap={adapted.provenanceMap}
            sourceModuleMap={adapted.sourceModuleMap}
            summaryStats={adapted.summary}
            onChange={handleCurrentStatusChange}
            onSyncWithCase={handleSyncWithCase}
          />
        )}

        {/* STEP 2: SET OBJECTIVE */}
        {activeStep === 2 && (
          <Step2DesiredObjective
            current={currentStatus}
            target={desiredObjective}
            onChange={(updated) => updateVTOState({ desiredObjective: updated })}
          />
        )}

        {/* STEP 3: DENTAL VTO INFERENCE */}
        {activeStep === 3 && (
          <Step3DentalVTOInference
            current={currentStatus}
            target={desiredObjective}
            spaceBudget={spaceBudget}
            anchorageDemand={calculatedAnchorageDemand}
          />
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* STEP NAVIGATION BOTTOM CONTROLS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => {
            if (activeStep > 1) {
              setActiveStep(activeStep - 1);
            } else if (onPrevTab) {
              onPrevTab();
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>{activeStep > 1 ? `Previous: ${WORKFLOW_STEPS[activeStep - 2].label}` : 'Previous Module (Ceph)'}</span>
        </button>

        <span className="text-xs font-bold text-slate-500">
          Step {activeStep} of 3
        </span>

        <button
          type="button"
          onClick={() => {
            if (activeStep < 3) {
              setActiveStep(activeStep + 1);
            } else if (onNextTab) {
              onNextTab();
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white cursor-pointer shadow-md"
        >
          <span>{activeStep < 3 ? `Next: ${WORKFLOW_STEPS[activeStep].label}` : 'Next Module (Bonwill)'}</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REPORT MODAL */}
      {/* ------------------------------------------------------------- */}
      <DentalVTOReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        patientName={patient.name}
        patientId={patient.patientId}
        patientAge={patient.age}
        patientGender={patient.gender}
        studentName={profile?.studentName || 'Post-Graduate Student'}
        vtoData={vtoData}
        spaceBudget={spaceBudget}
        anchorageDemand={calculatedAnchorageDemand}
      />
    </div>
  );
};
