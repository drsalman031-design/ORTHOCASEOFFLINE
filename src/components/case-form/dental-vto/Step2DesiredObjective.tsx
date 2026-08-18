import React, { useState } from 'react';
import {
  CurrentDentalStatus,
  DesiredDentalObjective,
  MolarClassification,
  CanineClassification,
} from '../../../types/dentalVto';
import { calculateIncisorDifferences } from '../../../lib/dentalVTOEngine';
import {
  BookOpen,
  X,
  Ruler,
  Compass,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  MoveHorizontal,
  MoveVertical,
  ChevronDown,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

interface Step2DesiredObjectiveProps {
  current: CurrentDentalStatus;
  target: DesiredDentalObjective;
  onChange: (updated: DesiredDentalObjective) => void;
}

export const Step2DesiredObjective: React.FC<Step2DesiredObjectiveProps> = ({
  current,
  target,
  onChange,
}) => {
  const [isReferenceModalOpen, setIsReferenceModalOpen] = useState(false);
  const diffs = calculateIncisorDifferences(current, target);

  const handleFieldChange = <K extends keyof DesiredDentalObjective>(
    field: K,
    value: DesiredDentalObjective[K]
  ) => {
    onChange({ ...target, [field]: value });
  };

  const handleNumChange = (field: keyof DesiredDentalObjective, val: string) => {
    if (val === '') {
      handleFieldChange(field, '' as any);
    } else {
      const parsed = parseFloat(val);
      handleFieldChange(field, (isNaN(parsed) ? '' : parsed) as any);
    }
  };

  const applyReferenceNorms = () => {
    onChange({
      ...target,
      molarRelation: 'Class I',
      canineRelation: 'Class I',
      overjetMm: 2.5,
      overbiteMm: 2.0,
      upperMidlineDevMm: 0,
      lowerMidlineDevMm: 0,
      u1SnDeg: 102,
      u1NaDeg: 22,
      u1NaMm: 4.0,
      impaDeg: 95,
      l1NbDeg: 25,
      l1NbMm: 4.0,
    });
    setIsReferenceModalOpen(false);
  };

  const resetToCurrent = () => {
    onChange({
      ...target,
      molarRelation: current.molarRelationRight || 'Class I',
      canineRelation: current.canineRelationRight || 'Class I',
      overjetMm: current.overjetMm !== '' ? Number(current.overjetMm) : 2.5,
      overbiteMm: current.overbiteMm !== '' ? Number(current.overbiteMm) : 2.0,
      u1NaMm: current.u1NaMm !== '' ? Number(current.u1NaMm) : 4.0,
      u1NaDeg: current.u1NaDeg !== '' ? Number(current.u1NaDeg) : 22,
      l1NbMm: current.l1NbMm !== '' ? Number(current.l1NbMm) : 4.0,
      l1NbDeg: current.l1NbDeg !== '' ? Number(current.l1NbDeg) : 25,
      impaDeg: current.impaDeg !== '' ? Number(current.impaDeg) : 95,
    });
  };

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* STEP HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-extrabold text-base shrink-0">
            02
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900">
              Step 2: Desired Dental Objectives
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Define target metrics for VTO simulation.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsReferenceModalOpen(true)}
          className="flex items-center gap-2 px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors bg-white shadow-2xs cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-teal-600" />
          <span>Reference Norms</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* CEPHALOMETRIC TARGET TUNING (VERTICAL ONE-BY-ONE CARDS) */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3 w-full">
        <h3 className="text-xs font-black tracking-wider text-slate-700 uppercase">
          Cephalometric Target Tuning
        </h3>

        <div className="flex flex-col gap-4 w-full">
          {/* Card 1: U1-NA mm */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col gap-2 relative overflow-hidden group hover:border-teal-500 transition-colors">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${diffs.deltaU1NaMm < 0 ? 'bg-rose-500' : 'bg-teal-500'}`} />
            
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-slate-800">U1-NA (mm)</span>
              <Ruler className="w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-3 gap-1 items-center mb-2">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-slate-400 font-bold">Current</span>
                <span className="font-mono text-sm font-bold text-slate-600">
                  {current.u1NaMm !== '' ? `${current.u1NaMm}` : '—'}
                </span>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-end">
                <label className="text-[9px] uppercase text-teal-700 font-black mb-0.5">Target</label>
                <input
                  type="number"
                  step="0.5"
                  value={target.u1NaMm}
                  onChange={(e) => handleNumChange('u1NaMm', e.target.value)}
                  className="w-16 h-8 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-900 px-2"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-2 flex justify-between items-center mt-auto border border-slate-100">
              <span className="text-[11px] text-slate-500 font-bold">Change</span>
              <div className={`flex items-center gap-1 font-mono text-xs font-black ${
                diffs.deltaU1NaMm < 0 ? 'text-rose-600' : diffs.deltaU1NaMm > 0 ? 'text-teal-600' : 'text-slate-600'
              }`}>
                {diffs.deltaU1NaMm < 0 ? <ArrowLeft className="w-3.5 h-3.5" /> : diffs.deltaU1NaMm > 0 ? <ArrowRight className="w-3.5 h-3.5" /> : null}
                <span>{diffs.deltaU1NaMm > 0 ? `+${diffs.deltaU1NaMm}` : diffs.deltaU1NaMm} mm</span>
              </div>
            </div>
          </div>

          {/* Card 2: U1-NA ° */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col gap-2 relative overflow-hidden group hover:border-teal-500 transition-colors">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${diffs.deltaU1NaDeg < 0 ? 'bg-rose-500' : 'bg-teal-500'}`} />
            
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-slate-800">U1-NA (°)</span>
              <Compass className="w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-3 gap-1 items-center mb-2">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-slate-400 font-bold">Current</span>
                <span className="font-mono text-sm font-bold text-slate-600">
                  {current.u1NaDeg !== '' ? `${current.u1NaDeg}°` : '—'}
                </span>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-end">
                <label className="text-[9px] uppercase text-teal-700 font-black mb-0.5">Target</label>
                <input
                  type="number"
                  step="1"
                  value={target.u1NaDeg}
                  onChange={(e) => handleNumChange('u1NaDeg', e.target.value)}
                  className="w-16 h-8 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-900 px-2"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-2 flex justify-between items-center mt-auto border border-slate-100">
              <span className="text-[11px] text-slate-500 font-bold">Change</span>
              <div className={`flex items-center gap-1 font-mono text-xs font-black ${
                diffs.deltaU1NaDeg < 0 ? 'text-rose-600' : diffs.deltaU1NaDeg > 0 ? 'text-teal-600' : 'text-slate-600'
              }`}>
                {diffs.deltaU1NaDeg < 0 ? <ArrowDown className="w-3.5 h-3.5" /> : diffs.deltaU1NaDeg > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : null}
                <span>{diffs.deltaU1NaDeg > 0 ? `+${diffs.deltaU1NaDeg}` : diffs.deltaU1NaDeg}°</span>
              </div>
            </div>
          </div>

          {/* Card 3: L1-NB mm */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col gap-2 relative overflow-hidden group hover:border-teal-500 transition-colors">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${diffs.deltaL1NbMm < 0 ? 'bg-rose-500' : 'bg-teal-500'}`} />
            
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-slate-800">L1-NB (mm)</span>
              <Ruler className="w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-3 gap-1 items-center mb-2">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-slate-400 font-bold">Current</span>
                <span className="font-mono text-sm font-bold text-slate-600">
                  {current.l1NbMm !== '' ? `${current.l1NbMm}` : '—'}
                </span>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-end">
                <label className="text-[9px] uppercase text-teal-700 font-black mb-0.5">Target</label>
                <input
                  type="number"
                  step="0.5"
                  value={target.l1NbMm}
                  onChange={(e) => handleNumChange('l1NbMm', e.target.value)}
                  className="w-16 h-8 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-900 px-2"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-2 flex justify-between items-center mt-auto border border-slate-100">
              <span className="text-[11px] text-slate-500 font-bold">Change</span>
              <div className={`flex items-center gap-1 font-mono text-xs font-black ${
                diffs.deltaL1NbMm < 0 ? 'text-rose-600' : diffs.deltaL1NbMm > 0 ? 'text-teal-600' : 'text-slate-600'
              }`}>
                {diffs.deltaL1NbMm > 0 ? <ArrowRight className="w-3.5 h-3.5" /> : diffs.deltaL1NbMm < 0 ? <ArrowLeft className="w-3.5 h-3.5" /> : null}
                <span>{diffs.deltaL1NbMm > 0 ? `+${diffs.deltaL1NbMm}` : diffs.deltaL1NbMm} mm</span>
              </div>
            </div>
          </div>

          {/* Card 4: IMPA ° */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col gap-2 relative overflow-hidden group hover:border-teal-500 transition-colors">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${diffs.deltaImpaDeg < 0 ? 'bg-rose-500' : 'bg-teal-500'}`} />
            
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-slate-800">IMPA (°)</span>
              <Compass className="w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-3 gap-1 items-center mb-2">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase text-slate-400 font-bold">Current</span>
                <span className="font-mono text-sm font-bold text-slate-600">
                  {current.impaDeg !== '' ? `${current.impaDeg}°` : '—'}
                </span>
              </div>
              <div className="flex justify-center text-slate-400">
                <ArrowRight className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-end">
                <label className="text-[9px] uppercase text-teal-700 font-black mb-0.5">Target</label>
                <input
                  type="number"
                  step="1"
                  value={target.impaDeg}
                  onChange={(e) => handleNumChange('impaDeg', e.target.value)}
                  className="w-16 h-8 text-right font-mono text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg focus:border-teal-600 focus:ring-1 focus:ring-teal-600 text-slate-900 px-2"
                />
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-2 flex justify-between items-center mt-auto border border-slate-100">
              <span className="text-[11px] text-slate-500 font-bold">Change</span>
              <div className={`flex items-center gap-1 font-mono text-xs font-black ${
                diffs.deltaImpaDeg < 0 ? 'text-rose-600' : diffs.deltaImpaDeg > 0 ? 'text-teal-600' : 'text-slate-600'
              }`}>
                {diffs.deltaImpaDeg > 0 ? <ArrowUp className="w-3.5 h-3.5" /> : diffs.deltaImpaDeg < 0 ? <ArrowDown className="w-3.5 h-3.5" /> : null}
                <span>{diffs.deltaImpaDeg > 0 ? `+${diffs.deltaImpaDeg}` : diffs.deltaImpaDeg}°</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TARGET OCCLUSION PARAMETERS */}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-3">
        <h3 className="text-xs font-black tracking-wider text-slate-700 uppercase">
          Target Occlusion Parameters
        </h3>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Column 1: Relations */}
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Final Molar Relation
                </label>
                <div className="relative">
                  <select
                    value={target.molarRelation}
                    onChange={(e) => handleFieldChange('molarRelation', e.target.value as MolarClassification)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all outline-none"
                  >
                    <option value="Class I">Class I</option>
                    <option value="Class II">Class II</option>
                    <option value="Class III">Class III</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Final Canine Relation
                </label>
                <div className="relative">
                  <select
                    value={target.canineRelation}
                    onChange={(e) => handleFieldChange('canineRelation', e.target.value as CanineClassification)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-800 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all outline-none"
                  >
                    <option value="Class I">Class I</option>
                    <option value="Class II">Class II</option>
                    <option value="Class III">Class III</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column 2: Metrics */}
            <div className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Final Overjet (mm)
                </label>
                <div className="relative flex items-center">
                  <MoveHorizontal className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="number"
                    step="0.5"
                    value={target.overjetMm}
                    onChange={(e) => handleNumChange('overjetMm', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 font-mono text-xs font-bold text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Final Overbite (mm)
                </label>
                <div className="relative flex items-center">
                  <MoveVertical className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="number"
                    step="0.5"
                    value={target.overbiteMm}
                    onChange={(e) => handleNumChange('overbiteMm', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-10 pr-3.5 py-2 font-mono text-xs font-bold text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reset / Preset button bar */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">
              Calculates real-time incisor vector displacements in Step 3.
            </span>
            <button
              type="button"
              onClick={resetToCurrent}
              className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Baseline</span>
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* REFERENCE NORMS POPUP MODAL */}
      {/* ------------------------------------------------------------- */}
      {isReferenceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" />
                <h4 className="text-sm font-black text-slate-900">Standard Cephalometric Reference Norms</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsReferenceModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>Maxillary Incisor (U1-NA mm):</span>
                <strong className="font-mono">4.0 mm</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>Maxillary Incisor (U1-NA °):</span>
                <strong className="font-mono">22.0°</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>Mandibular Incisor (L1-NB mm):</span>
                <strong className="font-mono">4.0 mm</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>Mandibular Incisor (IMPA °):</span>
                <strong className="font-mono">95.0° (Tweed) / 90.0°</strong>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-slate-50">
                <span>Target Overjet / Overbite:</span>
                <strong className="font-mono">2.5 mm / 2.0 mm</strong>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsReferenceModalOpen(false)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={applyReferenceNorms}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white shadow-xs cursor-pointer"
              >
                Apply Norms to Targets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
