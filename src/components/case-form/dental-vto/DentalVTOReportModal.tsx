import React from 'react';
import {
  DentalVTOData,
  SpaceBudget,
  AnchorageDemandLevel,
} from '../../../types/dentalVto';
import { calculateIncisorDifferences } from '../../../lib/dentalVTOEngine';
import { Printer, X, FileText, Ruler, Anchor, Info } from 'lucide-react';

interface DentalVTOReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
  patientId: string;
  patientAge: number | string;
  patientGender: string;
  studentName?: string;
  vtoData: DentalVTOData;
  spaceBudget: SpaceBudget;
  anchorageDemand: AnchorageDemandLevel;
}

export const DentalVTOReportModal: React.FC<DentalVTOReportModalProps> = ({
  isOpen,
  onClose,
  patientName,
  patientId,
  patientAge,
  patientGender,
  studentName,
  vtoData,
  spaceBudget,
  anchorageDemand,
}) => {
  if (!isOpen) return null;

  const { currentStatus, desiredObjective } = vtoData;
  const diffs = calculateIncisorDifferences(currentStatus, desiredObjective);
  const max = spaceBudget.maxillary;
  const mand = spaceBudget.mandibular;

  const currOj = typeof currentStatus?.overjetMm === 'number' ? currentStatus.overjetMm : 2.5;
  const tgtOj = typeof desiredObjective?.overjetMm === 'number' ? desiredObjective.overjetMm : 2.5;
  const deltaOj = Number((tgtOj - currOj).toFixed(1));

  const currOb = typeof currentStatus?.overbiteMm === 'number' ? currentStatus.overbiteMm : 2.0;
  const tgtOb = typeof desiredObjective?.overbiteMm === 'number' ? desiredObjective.overbiteMm : 2.0;
  const deltaOb = Number((tgtOb - currOb).toFixed(1));

  const currU1 = typeof currentStatus?.u1NaMm === 'number' ? currentStatus.u1NaMm : 4.0;
  const tgtU1 = typeof desiredObjective?.u1NaMm === 'number' ? desiredObjective.u1NaMm : 4.0;
  const deltaU1 = diffs.deltaU1NaMm;

  const currL1 = typeof currentStatus?.l1NbMm === 'number' ? currentStatus.l1NbMm : 4.0;
  const tgtL1 = typeof desiredObjective?.l1NbMm === 'number' ? desiredObjective.l1NbMm : 4.0;
  const deltaL1 = diffs.deltaL1NbMm;

  const currentDate = new Date().toISOString().slice(0, 16).replace('T', ' ');

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 flex items-center justify-center p-3 sm:p-6 backdrop-blur-xs">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col relative">
        {/* MODAL HEADER / ACTIONS (Sticky Top) */}
        <div className="bg-white border-b border-slate-200 px-5 py-3.5 flex justify-between items-center sticky top-0 z-10 shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-700" />
            <h3 className="text-base font-bold text-slate-900">VTO Analysis Report</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-600 text-white font-bold text-xs transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        </div>

        {/* MODAL CONTENT (Scrollable A4 Simulation) */}
        <div className="overflow-y-auto p-4 sm:p-6 flex-1 bg-slate-50">
          <div className="bg-white mx-auto max-w-3xl shadow-sm border border-slate-200 p-6 sm:p-8 rounded-xl space-y-6">
            {/* Institutional Header */}
            <div className="border-b-2 border-teal-700 pb-3 flex justify-between items-end">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black text-teal-800 tracking-tight">DENTAL VTO</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                  Department of Orthodontics & Dentofacial Orthopedics
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Generated</p>
                <p className="font-mono text-xs font-bold text-slate-700">{currentDate}</p>
              </div>
            </div>

            {/* Patient Demographic Block */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Patient ID</p>
                <p className="font-mono text-xs font-bold text-slate-900">{patientId || 'ORTHO-2026-001'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Name</p>
                <p className="text-xs font-bold text-slate-900">{patientName || 'Anonymous'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Age/Sex</p>
                <p className="text-xs font-bold text-slate-900">{patientAge || '—'} / {patientGender || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clinician</p>
                <p className="text-xs font-bold text-slate-900">{studentName || 'PG Resident'}</p>
              </div>
            </div>

            {/* Comparison Table (Current vs Target) */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Cephalometric Comparison
              </h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-bold text-slate-600">Measurement</th>
                      <th className="p-2.5 font-bold text-slate-600">Current</th>
                      <th className="p-2.5 font-bold text-slate-600">Target (VTO)</th>
                      <th className="p-2.5 font-bold text-slate-600">Difference</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono divide-y divide-slate-100">
                    <tr>
                      <td className="p-2.5 font-sans font-medium text-slate-800">U1 to NA (mm)</td>
                      <td className="p-2.5 text-slate-700">{currentStatus.u1NaMm !== '' ? `${currentStatus.u1NaMm}` : '—'}</td>
                      <td className="p-2.5 text-teal-700 font-bold">{desiredObjective.u1NaMm}</td>
                      <td className={`p-2.5 font-bold ${diffs.deltaU1NaMm < 0 ? 'text-rose-600' : 'text-teal-700'}`}>
                        {diffs.deltaU1NaMm > 0 ? `+${diffs.deltaU1NaMm}` : diffs.deltaU1NaMm} mm
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-sans font-medium text-slate-800">U1 to NA (deg)</td>
                      <td className="p-2.5 text-slate-700">{currentStatus.u1NaDeg !== '' ? `${currentStatus.u1NaDeg}°` : '—'}</td>
                      <td className="p-2.5 text-teal-700 font-bold">{desiredObjective.u1NaDeg}°</td>
                      <td className={`p-2.5 font-bold ${diffs.deltaU1NaDeg < 0 ? 'text-rose-600' : 'text-teal-700'}`}>
                        {diffs.deltaU1NaDeg > 0 ? `+${diffs.deltaU1NaDeg}` : diffs.deltaU1NaDeg}°
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-medium text-slate-800">L1 to NB (mm)</td>
                      <td className="p-2.5 text-slate-700">{currentStatus.l1NbMm !== '' ? `${currentStatus.l1NbMm}` : '—'}</td>
                      <td className="p-2.5 text-teal-700 font-bold">{desiredObjective.l1NbMm}</td>
                      <td className={`p-2.5 font-bold ${diffs.deltaL1NbMm > 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                        {diffs.deltaL1NbMm > 0 ? `+${diffs.deltaL1NbMm}` : diffs.deltaL1NbMm} mm
                      </td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-sans font-medium text-slate-800">IMPA (deg)</td>
                      <td className="p-2.5 text-slate-700">{currentStatus.impaDeg !== '' ? `${currentStatus.impaDeg}°` : '—'}</td>
                      <td className="p-2.5 text-teal-700 font-bold">{desiredObjective.impaDeg}°</td>
                      <td className={`p-2.5 font-bold ${diffs.deltaImpaDeg > 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                        {diffs.deltaImpaDeg > 0 ? `+${diffs.deltaImpaDeg}` : diffs.deltaImpaDeg}°
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-medium text-slate-800">Overjet (mm)</td>
                      <td className="p-2.5 text-slate-700">{currOj}</td>
                      <td className="p-2.5 text-teal-700 font-bold">{tgtOj}</td>
                      <td className="p-2.5 font-bold text-slate-800">{deltaOj > 0 ? `+${deltaOj}` : deltaOj} mm</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="p-2.5 font-sans font-medium text-slate-800">Overbite (mm)</td>
                      <td className="p-2.5 text-slate-700">{currOb}</td>
                      <td className="p-2.5 text-teal-700 font-bold">{tgtOb}</td>
                      <td className="p-2.5 font-bold text-slate-800">{deltaOb > 0 ? `+${deltaOb}` : deltaOb} mm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Space/Anchorage summary tiles */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Space Analysis &amp; Anchorage
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Maxillary Space Tile */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-1.5 text-teal-700 font-bold">
                    <Ruler className="w-4 h-4" />
                    <span>Maxillary Space Budget</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Space Required:</span>
                    <span className="font-mono font-bold text-slate-900">{max.required.totalRequiredMm} mm</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Space Available:</span>
                    <span className="font-mono font-bold text-slate-900">{max.available.totalAvailableMm} mm</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">Net Balance:</span>
                    <span className={`font-mono font-black ${max.balanceMm >= 0 ? 'text-teal-700' : 'text-rose-600'}`}>
                      {max.balanceMm > 0 ? `+${max.balanceMm}` : max.balanceMm} mm ({max.balanceMm >= 0 ? 'Surplus' : 'Deficit'})
                    </span>
                  </div>
                </div>

                {/* Anchorage Requirement Tile */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                    <Anchor className="w-4 h-4" />
                    <span>Anchorage Assessment</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Maxilla Demand:</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 font-mono text-[11px] font-black uppercase">
                      {anchorageDemand}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 font-medium">Target Occlusion:</span>
                    <span className="font-mono font-bold text-slate-900">{desiredObjective.molarRelation}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-200 text-[11px] text-slate-500">
                    {anchorageDemand === 'Very High' || anchorageDemand === 'High'
                      ? 'Stationary / skeletal anchorage recommended to avoid anchor loss.'
                      : 'Standard mechanics suitable for planned translation.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Synthesis point-wise list */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1">
                Clinical Synthesis &amp; Inferences
              </h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-700 font-medium leading-relaxed">
                <li>
                  Maxillary incisors require approximately {Math.abs(deltaU1)} mm of {deltaU1 < 0 ? 'retraction' : 'advancement'} with {diffs.deltaU1NaDeg}° torque change.
                </li>
                <li>
                  Mandibular incisors require approximately {Math.abs(deltaL1)} mm of {deltaL1 > 0 ? 'advancement' : 'retraction'} with {diffs.deltaImpaDeg}° IMPA adjustment.
                </li>
                <li>
                  Overjet correction: Planned change from {currOj} mm to {tgtOj} mm (Net: {deltaOj} mm).
                </li>
                <li>
                  Overbite correction: Planned change from {currOb} mm to {tgtOb} mm (Net: {deltaOb} mm).
                </li>
                <li>
                  Calculated net space balance: {max.balanceMm > 0 ? `+${max.balanceMm}mm` : `${max.balanceMm}mm`} ({max.balanceMm >= 0 ? 'Surplus' : 'Deficit'}).
                </li>
                <li>
                  Anchorage demand is classified as {anchorageDemand.toUpperCase()} based on planned anterior displacement.
                </li>
              </ul>
            </div>

            {/* Educational Disclaimer footer */}
            <div className="pt-4 border-t border-slate-200">
              <p className="text-[11px] text-slate-500 italic text-center leading-relaxed">
                Disclaimer: This Visual Treatment Objective (VTO) report is generated for educational and treatment planning purposes. It represents a predictive model and does not guarantee specific clinical outcomes. Final clinical decisions remain the responsibility of the attending orthodontist.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
