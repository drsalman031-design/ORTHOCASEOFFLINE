import React, { useState } from 'react';
import {
  CurrentDentalStatus,
  MolarClassification,
  CanineClassification,
  BiteStatus,
} from '../../../types/dentalVto';
import { FieldProvenance } from '../../../lib/dentalVTODataAdapter';
import { RefreshCw, CheckCircle2, AlertCircle, Edit3, User, Sparkles } from 'lucide-react';

interface Step1CurrentDentalStatusProps {
  patientId?: string;
  data: CurrentDentalStatus;
  provenanceMap: Record<keyof CurrentDentalStatus, FieldProvenance>;
  sourceModuleMap: Record<keyof CurrentDentalStatus, string | undefined>;
  summaryStats: {
    autoFilledCount: number;
    missingCount: number;
    overrideCount: number;
  };
  onChange: (updated: CurrentDentalStatus, overriddenField?: keyof CurrentDentalStatus) => void;
  onSyncWithCase: () => void;
}

export const Step1CurrentDentalStatus: React.FC<Step1CurrentDentalStatusProps> = ({
  patientId,
  data,
  provenanceMap,
  sourceModuleMap,
  summaryStats,
  onChange,
  onSyncWithCase,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  const handleFieldChange = <K extends keyof CurrentDentalStatus>(
    field: K,
    value: CurrentDentalStatus[K]
  ) => {
    onChange({ ...data, [field]: value }, field);
  };

  const handleNumChange = (field: keyof CurrentDentalStatus, val: string) => {
    if (val === '') {
      handleFieldChange(field, '' as any);
    } else {
      const parsed = parseFloat(val);
      handleFieldChange(field, (isNaN(parsed) ? '' : parsed) as any);
    }
  };

  const renderDot = (field: keyof CurrentDentalStatus) => {
    const prov = provenanceMap[field] || 'missing';
    const source = sourceModuleMap[field];

    if (prov === 'override') {
      return (
        <span
          className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 inline-block ring-2 ring-blue-100"
          title="Student Override"
        />
      );
    }
    if (prov === 'auto-filled') {
      return (
        <span
          className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 inline-block ring-2 ring-emerald-100"
          title={source ? `Auto-filled from ${source}` : 'Auto-filled from Case Record'}
        />
      );
    }
    return (
      <span
        className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 inline-block ring-2 ring-amber-100"
        title="Enter manually"
      />
    );
  };

  return (
    <div className="space-y-6 w-full">
      {/* ------------------------------------------------------------- */}
      {/* HEADER & AUTO-SYNC ACTION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4 sm:p-5 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 w-full flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 font-extrabold text-base shrink-0">
              01
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Step 1: Current Case Dental Baseline
              </h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  Patient ID:
                </span>
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-xs">
                  {patientId || 'ORTHO-2026-001'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-start sm:items-center justify-start sm:justify-end gap-2.5 w-full md:w-auto">
            <button
              type="button"
              onClick={onSyncWithCase}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SYNC WITH CASE</span>
            </button>
            <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-full text-xs font-bold text-slate-700 flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                {summaryStats.autoFilledCount} auto-filled
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                {summaryStats.missingCount} missing
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                {summaryStats.overrideCount} overrides
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VERTICAL ONE-BY-ONE STACKED CARDS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 w-full">
        {/* CARD 1: SAGITTAL OCCLUSION */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase">
                SAGITTAL OCCLUSION
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                CAST & EXAM
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Molar Relation */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">Molar Relation:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('molarRelationRight')}
                  {isEditMode ? (
                    <select
                      value={data.molarRelationRight}
                      onChange={(e) => handleFieldChange('molarRelationRight', e.target.value as MolarClassification)}
                      className="h-7 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Class I">Class I</option>
                      <option value="Class II">Class II</option>
                      <option value="End-on Class II">End-on Class II</option>
                      <option value="Class III">Class III</option>
                    </select>
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs min-w-[75px] text-center">
                      {data.molarRelationRight || 'Class I'}
                    </span>
                  )}
                </div>
              </div>

              {/* Canine Relation */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">Canine Relation:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('canineRelationRight')}
                  {isEditMode ? (
                    <select
                      value={data.canineRelationRight}
                      onChange={(e) => handleFieldChange('canineRelationRight', e.target.value as CanineClassification)}
                      className="h-7 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="Class I">Class I</option>
                      <option value="Class II">Class II</option>
                      <option value="Class III">Class III</option>
                    </select>
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs min-w-[75px] text-center">
                      {data.canineRelationRight || 'Class I'}
                    </span>
                  )}
                </div>
              </div>

              {/* Overjet */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">Overjet:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('overjetMm')}
                  {isEditMode ? (
                    <input
                      type="number"
                      step="0.5"
                      value={data.overjetMm}
                      onChange={(e) => handleNumChange('overjetMm', e.target.value)}
                      className="w-16 h-7 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white text-right"
                    />
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100/70 px-3 py-1 rounded-lg border border-slate-300/80 min-w-[75px] text-center">
                      {data.overjetMm !== '' ? `${data.overjetMm} mm` : '—'}
                    </span>
                  )}
                </div>
              </div>

              {/* Midline */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">Midline:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('upperMidlineDevMm')}
                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs min-w-[75px] text-center">
                    {Number(data.upperMidlineDevMm) === 0 ? 'Coincident' : `${data.upperMidlineDevMm} mm`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: VERTICAL / SPACE */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase">
                VERTICAL / SPACE
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                CAST & MODELS
              </span>
            </div>

            <div className="space-y-3.5">
              {/* Overbite */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">Overbite:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('overbiteMm')}
                  {isEditMode ? (
                    <input
                      type="number"
                      step="0.5"
                      value={data.overbiteMm}
                      onChange={(e) => handleNumChange('overbiteMm', e.target.value)}
                      className="w-16 h-7 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white text-right"
                    />
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100/70 px-3 py-1 rounded-lg border border-slate-300/80 min-w-[75px] text-center">
                      {data.overbiteMm !== '' ? `${data.overbiteMm} mm` : '—'}
                    </span>
                  )}
                </div>
              </div>

              {/* Curve of Spee */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">Curve of Spee:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('curveOfSpeeMm')}
                  {isEditMode ? (
                    <input
                      type="number"
                      step="0.5"
                      value={data.curveOfSpeeMm}
                      onChange={(e) => handleNumChange('curveOfSpeeMm', e.target.value)}
                      className="w-16 h-7 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white text-right"
                    />
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs min-w-[75px] text-center">
                      {data.curveOfSpeeMm !== '' ? `${data.curveOfSpeeMm} mm` : '1.5 mm'}
                    </span>
                  )}
                </div>
              </div>

              {/* Upper Crowding */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">Upper Crowding:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('upperCrowdingMm')}
                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs min-w-[75px] text-center">
                    {Number(data.upperCrowdingMm) > 0 ? `-${data.upperCrowdingMm} mm` : '0.0 mm'}
                  </span>
                </div>
              </div>

              {/* Upper Spacing */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">Upper Spacing:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('upperSpacingMm')}
                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs min-w-[75px] text-center">
                    {Number(data.upperSpacingMm) > 0 ? `+${data.upperSpacingMm} mm` : '0.0 mm'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: CEPHALOMETRIC */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-black tracking-wider text-slate-800 uppercase">
                CEPHALOMETRIC
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                STEINER & TWEED
              </span>
            </div>

            <div className="space-y-3.5">
              {/* U1-NA */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">U1-NA:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('u1NaMm')}
                  {isEditMode ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="mm"
                        value={data.u1NaMm}
                        onChange={(e) => handleNumChange('u1NaMm', e.target.value)}
                        className="w-12 h-7 px-1 rounded border text-xs"
                      />
                      <input
                        type="number"
                        step="1"
                        placeholder="°"
                        value={data.u1NaDeg}
                        onChange={(e) => handleNumChange('u1NaDeg', e.target.value)}
                        className="w-12 h-7 px-1 rounded border text-xs"
                      />
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100/70 px-3 py-1 rounded-lg border border-slate-300/80 min-w-[75px] text-center">
                      {data.u1NaMm !== '' ? `${data.u1NaMm}mm` : '4mm'} / {data.u1NaDeg !== '' ? `${data.u1NaDeg}°` : '22°'}
                    </span>
                  )}
                </div>
              </div>

              {/* IMPA */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">IMPA:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('impaDeg')}
                  {isEditMode ? (
                    <input
                      type="number"
                      value={data.impaDeg}
                      onChange={(e) => handleNumChange('impaDeg', e.target.value)}
                      className="w-16 h-7 px-2 rounded-lg border border-slate-300 text-xs font-bold bg-white text-right"
                    />
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100/70 px-3 py-1 rounded-lg border border-slate-300/80 min-w-[75px] text-center">
                      {data.impaDeg !== '' ? `${data.impaDeg}°` : '95°'}
                    </span>
                  )}
                </div>
              </div>

              {/* L1-NB */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">L1-NB:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('l1NbMm')}
                  {isEditMode ? (
                    <div className="flex gap-1">
                      <input
                        type="number"
                        step="0.5"
                        placeholder="mm"
                        value={data.l1NbMm}
                        onChange={(e) => handleNumChange('l1NbMm', e.target.value)}
                        className="w-12 h-7 px-1 rounded border text-xs"
                      />
                      <input
                        type="number"
                        step="1"
                        placeholder="°"
                        value={data.l1NbDeg}
                        onChange={(e) => handleNumChange('l1NbDeg', e.target.value)}
                        className="w-12 h-7 px-1 rounded border text-xs"
                      />
                    </div>
                  ) : (
                    <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs min-w-[75px] text-center">
                      {data.l1NbMm !== '' ? `${data.l1NbMm}mm` : '4mm'} / {data.l1NbDeg !== '' ? `${data.l1NbDeg}°` : '25°'}
                    </span>
                  )}
                </div>
              </div>

              {/* U1-SN */}
              <div className="flex justify-between items-center py-0.5 text-xs">
                <span className="text-slate-700 font-semibold">U1-SN:</span>
                <div className="flex items-center gap-2.5">
                  {renderDot('u1SnDeg')}
                  <span className="font-mono font-bold text-xs text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs min-w-[75px] text-center">
                    {data.u1SnDeg !== '' ? `${data.u1SnDeg}°` : '102°'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit / Quick Override toggle footer */}
      <div className="px-5 py-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between text-xs w-full shadow-xs">
        <span className="text-slate-500 font-medium">
          All values are auto-populated from clinical examination & cephalometric analyses.
        </span>
        <button
          type="button"
          onClick={() => setIsEditMode(!isEditMode)}
          className="inline-flex items-center gap-1.5 font-bold text-teal-700 hover:text-teal-800 cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditMode ? 'Finish Manual Editing' : 'Enable Manual Adjustments'}</span>
        </button>
      </div>
    </div>
  );
};
