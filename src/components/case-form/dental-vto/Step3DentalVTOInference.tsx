import React from 'react';
import {
  CurrentDentalStatus,
  DesiredDentalObjective,
  SpaceBudget,
  AnchorageDemandLevel,
} from '../../../types/dentalVto';
import { calculateIncisorDifferences } from '../../../lib/dentalVTOEngine';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Info,
  CheckCircle2,
  Anchor,
  FileText,
} from 'lucide-react';

interface Step3DentalVTOInferenceProps {
  current: CurrentDentalStatus;
  target: DesiredDentalObjective;
  spaceBudget: SpaceBudget;
  anchorageDemand: AnchorageDemandLevel;
}

export const Step3DentalVTOInference: React.FC<Step3DentalVTOInferenceProps> = ({
  current,
  target,
  spaceBudget,
  anchorageDemand,
}) => {
  const diffs = calculateIncisorDifferences(current, target);
  const max = spaceBudget.maxillary;
  const mand = spaceBudget.mandibular;

  // Overjet & Overbite deltas
  const currOj = typeof current.overjetMm === 'number' ? current.overjetMm : 2.5;
  const tgtOj = typeof target.overjetMm === 'number' ? target.overjetMm : 2.5;
  const deltaOj = Number((tgtOj - currOj).toFixed(1));

  const currOb = typeof current.overbiteMm === 'number' ? current.overbiteMm : 2.0;
  const tgtOb = typeof target.overbiteMm === 'number' ? target.overbiteMm : 2.0;
  const deltaOb = Number((tgtOb - currOb).toFixed(1));

  // Maxillary & Mandibular incisor AP values
  const currU1 = typeof current.u1NaMm === 'number' ? current.u1NaMm : 4.0;
  const tgtU1 = typeof target.u1NaMm === 'number' ? target.u1NaMm : 4.0;
  const deltaU1 = diffs.deltaU1NaMm;

  const currL1 = typeof current.l1NbMm === 'number' ? current.l1NbMm : 4.0;
  const tgtL1 = typeof target.l1NbMm === 'number' ? target.l1NbMm : 4.0;
  const deltaL1 = diffs.deltaL1NbMm;

  const deltaU1Deg = diffs.deltaU1NaDeg;
  const deltaImpa = diffs.deltaImpaDeg;

  // Space status badge
  const isSurplus = max.balanceMm > 0.2;
  const isDeficit = max.balanceMm < -0.2;

  return (
    <div className="space-y-6 w-full">
      {/* ------------------------------------------------------------- */}
      {/* CONTEXT HEADER */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs w-full">
        <div>
          <span className="inline-block bg-teal-700 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full mb-1 tracking-widest uppercase">
            Badge 03
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            DENTAL VTO INFERENCE
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-100 py-1.5 px-3 rounded-full border border-slate-200 text-xs font-bold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />
          <span className="text-[11px] uppercase tracking-wider text-slate-800">
            Analysis Complete
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* VERTICAL ONE-BY-ONE INFERENCE STACK */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col gap-4 w-full">
        {/* SECTION A1: U1 MAXILLARY INCISOR CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-teal-600 transition-colors w-full">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>U1: Maxillary Incisor</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase">AP & Torque</span>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                  {deltaU1 < 0 ? 'Retraction' : deltaU1 > 0 ? 'Advancement' : 'Position'}
                </span>
                <span className="font-mono text-2xl font-black text-teal-700">
                  {deltaU1 < 0 ? `${Math.abs(deltaU1)}mm` : deltaU1 > 0 ? `+${deltaU1}mm` : '0.0mm'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                  Torque (U1-NA)
                </span>
                <span className="font-mono text-2xl font-black text-slate-900">
                  {deltaU1Deg > 0 ? `+${deltaU1Deg}°` : `${deltaU1Deg}°`}
                </span>
              </div>
            </div>

            {/* SVG Graphic (Posterior / Anterior Shift) */}
            <div className="w-full h-24 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
              <svg className="opacity-90 w-full h-full max-w-[200px]" viewBox="0 0 200 80">
                {/* Original Position (Dashed) */}
                <path d="M120 20 C 130 40, 130 60, 120 80" fill="none" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="2.5" />
                <path d="M110 20 C 120 40, 120 60, 110 80" fill="none" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="2.5" />
                
                {/* Directional Arrow */}
                {deltaU1 < 0 ? (
                  <>
                    <line x1="115" y1="50" x2="85" y2="50" stroke="#0f766e" strokeWidth="3" markerEnd="url(#arrow-teal)" />
                    <text x="100" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f766e">
                      ← {Math.abs(deltaU1)}mm
                    </text>
                  </>
                ) : deltaU1 > 0 ? (
                  <>
                    <line x1="85" y1="50" x2="115" y2="50" stroke="#2563eb" strokeWidth="3" markerEnd="url(#arrow-blue)" />
                    <text x="100" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2563eb">
                      → {deltaU1}mm
                    </text>
                  </>
                ) : (
                  <text x="100" y="52" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#059669">
                    Maintain AP
                  </text>
                )}

                <defs>
                  <marker id="arrow-teal" markerHeight="6" markerWidth="6" orient="auto" refX="0" refY="3">
                    <polygon fill="#0f766e" points="0 0, 6 3, 0 6" />
                  </marker>
                  <marker id="arrow-blue" markerHeight="6" markerWidth="6" orient="auto" refX="0" refY="3">
                    <polygon fill="#2563eb" points="0 0, 6 3, 0 6" />
                  </marker>
                </defs>

                {/* New Target Position (Solid) */}
                <path d="M80 20 C 90 40, 90 60, 80 80" fill="none" stroke="#0f766e" strokeWidth="3.5" />
                <path d="M70 20 C 80 40, 80 60, 70 80" fill="none" stroke="#0f766e" strokeWidth="3.5" />
              </svg>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium p-3 bg-slate-50 rounded-xl border border-slate-200">
            {deltaU1 < 0
              ? `Significant palatal retraction (${Math.abs(deltaU1)} mm) and torque adjustment (${deltaU1Deg}°) required to achieve ideal interincisal angle and resolve anterior protrusion.`
              : deltaU1 > 0
              ? `Anterior advancement (${deltaU1} mm) indicated to support lip posture and establish positive overjet.`
              : 'Incisor AP position is maintained harmoniously at current baseline.'}
          </p>
        </div>

        {/* SECTION A2: L1 MANDIBULAR INCISOR CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-teal-600 transition-colors w-full">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>L1: Mandibular Incisor</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase">AP & IMPA</span>
            </div>

            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                  {deltaL1 > 0 ? 'Advancement' : deltaL1 < 0 ? 'Retraction' : 'Position'}
                </span>
                <span className="font-mono text-2xl font-black text-teal-700">
                  {deltaL1 > 0 ? `+${deltaL1}mm` : deltaL1 < 0 ? `${Math.abs(deltaL1)}mm` : '0.0mm'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 text-right">
                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-widest">
                  IMPA Inclination
                </span>
                <span className="font-mono text-2xl font-black text-slate-900">
                  {deltaImpa > 0 ? `+${deltaImpa}°` : `${deltaImpa}°`}
                </span>
              </div>
            </div>

            {/* SVG Graphic (Anterior / Posterior Shift) */}
            <div className="w-full h-24 bg-slate-50 border border-slate-200/80 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
              <svg className="opacity-90 w-full h-full max-w-[200px]" viewBox="0 0 200 80">
                {/* Original Position (Dashed) */}
                <path d="M70 20 C 80 40, 80 60, 70 80" fill="none" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="2.5" />
                <path d="M80 20 C 90 40, 90 60, 80 80" fill="none" stroke="#94a3b8" strokeDasharray="4 4" strokeWidth="2.5" />
                
                {/* Directional Arrow */}
                {deltaL1 > 0 ? (
                  <>
                    <line x1="85" y1="50" x2="115" y2="50" stroke="#0f766e" strokeWidth="3" markerEnd="url(#arrow-teal-l1)" />
                    <text x="100" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f766e">
                      → {deltaL1}mm
                    </text>
                  </>
                ) : deltaL1 < 0 ? (
                  <>
                    <line x1="115" y1="50" x2="85" y2="50" stroke="#e11d48" strokeWidth="3" markerEnd="url(#arrow-red-l1)" />
                    <text x="100" y="42" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#e11d48">
                      ← {Math.abs(deltaL1)}mm
                    </text>
                  </>
                ) : (
                  <text x="100" y="52" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#059669">
                    Maintain IMPA
                  </text>
                )}

                <defs>
                  <marker id="arrow-teal-l1" markerHeight="6" markerWidth="6" orient="auto" refX="0" refY="3">
                    <polygon fill="#0f766e" points="0 0, 6 3, 0 6" />
                  </marker>
                  <marker id="arrow-red-l1" markerHeight="6" markerWidth="6" orient="auto" refX="0" refY="3">
                    <polygon fill="#e11d48" points="0 0, 6 3, 0 6" />
                  </marker>
                </defs>

                {/* New Target Position (Solid) */}
                <path d="M110 20 C 120 40, 120 60, 110 80" fill="none" stroke="#0f766e" strokeWidth="3.5" />
                <path d="M120 20 C 130 40, 130 60, 120 80" fill="none" stroke="#0f766e" strokeWidth="3.5" />
              </svg>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-medium p-3 bg-slate-50 rounded-xl border border-slate-200">
            {deltaImpa > 0
              ? `Controlled proclination (+${deltaImpa}°) aids in space resolution within physiological limits of the symphyseal cortical plate.`
              : deltaImpa < 0
              ? `Uprighting (${deltaImpa}°) indicated to eliminate dental compensation and establish upright mandibular base.`
              : 'Mandibular incisor inclination is preserved at baseline standard.'}
          </p>
        </div>

        {/* SECTION B: CORRECTION CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between w-full">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
            Section B: Correction
          </h3>
          <div className="flex flex-col gap-2.5">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Overjet
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-600">{currOj} → {tgtOj}</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded text-[11px]">
                  {deltaOj > 0 ? `+${deltaOj}mm` : `${deltaOj}mm`}
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase text-[11px] tracking-wider">
                Overbite
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-600">{currOb} → {tgtOb}</span>
                <span className="font-mono font-bold text-teal-800 bg-teal-100 px-2 py-0.5 rounded text-[11px]">
                  {deltaOb > 0 ? `+${deltaOb}mm` : `${deltaOb}mm`}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION C: SPACE BALANCE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between w-full">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">
              Section C: Space Balance
            </h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
              isSurplus ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
              isDeficit ? 'bg-rose-100 text-rose-900 border-rose-300' :
              'bg-amber-100 text-amber-900 border-amber-300'
            }`}>
              {isSurplus ? 'Surplus' : isDeficit ? 'Deficit' : 'Balanced'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Req</span>
              <span className="font-mono text-sm font-bold text-slate-800">{max.required.totalRequiredMm}</span>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 flex flex-col items-center justify-center text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider mb-0.5">Avail</span>
              <span className="font-mono text-sm font-bold text-slate-800">{max.available.totalAvailableMm}</span>
            </div>
            <div className="bg-teal-700 text-white rounded-xl p-2.5 flex flex-col items-center justify-center text-center shadow-xs">
              <span className="text-[9px] uppercase font-bold text-teal-200 tracking-wider mb-0.5">Net</span>
              <span className="font-mono text-sm font-black">{max.balanceMm > 0 ? `+${max.balanceMm}mm` : `${max.balanceMm}mm`}</span>
            </div>
          </div>
        </div>

        {/* SECTION D: ANCHORAGE CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden w-full">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2 relative z-10">
            Section D: Anchorage
          </h3>
          
          <div className="flex-1 flex items-center justify-center relative z-10 py-1">
            <div className="flex flex-col items-center text-center p-4 bg-indigo-50/70 border border-indigo-200/80 rounded-xl w-full">
              <Anchor className="w-6 h-6 text-indigo-600 mb-1" />
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {anchorageDemand} Demand
              </span>
              <span className="text-[11px] text-slate-600 font-medium mt-0.5">
                {anchorageDemand === 'Very High' ? 'Maximum skeletal anchorage reinforcement indicated.' :
                 anchorageDemand === 'High' ? 'Reinforced cortical or auxiliary anchorage indicated.' :
                 anchorageDemand === 'Moderate' ? 'Standard anchorage reinforcement recommended.' :
                 'Reciprocal anchorage mechanics sufficient.'}
              </span>
            </div>
          </div>

          <Anchor className="w-24 h-24 absolute -bottom-6 -right-6 text-slate-200/50 -z-0 pointer-events-none" />
        </div>

        {/* SECTION E: CLINICAL SYNTHESIS CARD */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-3 w-full">
          <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-2.5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600" />
            <span>Section E: Clinical Synthesis</span>
          </h3>

          <div className="flex flex-col gap-3 text-xs text-slate-700 font-medium w-full">
            <div className="flex gap-2.5 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/70 w-full">
              <span className="font-mono font-bold text-teal-700 w-6 shrink-0 pt-0.5">01</span>
              <p className="leading-relaxed">
                Profile convexity will reduce secondary to {Math.abs(deltaU1)} mm maxillary incisor retraction; monitor nasolabial angle.
              </p>
            </div>

            <div className="flex gap-2.5 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/70 w-full">
              <span className="font-mono font-bold text-teal-700 w-6 shrink-0 pt-0.5">02</span>
              <p className="leading-relaxed">
                Space balance ({max.balanceMm > 0 ? `+${max.balanceMm}mm` : `${max.balanceMm}mm`}) {isSurplus ? 'affords complete resolution of anterior crowding.' : 'indicates space opening/extraction mechanics required.'}
              </p>
            </div>

            <div className="flex gap-2.5 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/70 w-full">
              <span className="font-mono font-bold text-teal-700 w-6 shrink-0 pt-0.5">03</span>
              <p className="leading-relaxed">
                Mandibular incisor displacement ({deltaL1 > 0 ? `+${deltaL1}mm` : `${deltaL1}mm`}) is within acceptable limits, respecting symphyseal cortical plate boundaries.
              </p>
            </div>

            <div className="flex gap-2.5 items-start p-3 rounded-xl bg-slate-50 border border-slate-200/70 w-full">
              <span className="font-mono font-bold text-teal-700 w-6 shrink-0 pt-0.5">04</span>
              <p className="leading-relaxed">
                {anchorageDemand} anchorage preparation indicated in the maxillary arch to prevent unwanted molar anchor loss.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* FOOTER: EDUCATIONAL DISCLAIMER */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-teal-50/70 border border-teal-200 p-4 rounded-2xl flex gap-3 items-start shadow-2xs w-full">
        <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="font-bold text-teal-900 uppercase tracking-wider text-[11px]">
            Educational Disclaimer
          </h4>
          <p className="text-xs text-teal-900/90 leading-relaxed font-medium">
            The metrics provided by this inference engine are generated algorithmically for educational planning purposes and do not replace professional clinical judgment. Variations in biological response, appliance mechanics, and patient compliance may significantly alter expected outcomes.
          </p>
        </div>
      </div>
    </div>
  );
};
