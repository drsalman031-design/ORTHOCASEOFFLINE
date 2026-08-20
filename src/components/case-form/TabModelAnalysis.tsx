import React, { useEffect, useRef, useState } from 'react';
import { ArchShape, ArchAlignment, FacialSymmetry } from '../../types';
import {
  calculateBolton,
  calculateCarey,
  calculateNanceMaxillary,
  calculatePonts,
  calculateAshleyHowe,
  calculateTanakaJohnston,
} from '../../lib/calculations';
import { Calculator, Grid, Award, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { SelectField, NumericSelectField } from './SelectField';

const CARD = 'bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4';
const SECTION_TITLE =
  'text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2.5';
const STACK = 'space-y-3.5';
const FIELD =
  'w-full min-h-11 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600';

const ARCH_SHAPE_OPTIONS = ['U-shaped', 'V-shaped', 'Square-shaped'] as const;
const ARCH_ALIGNMENT_OPTIONS = ['Crowding', 'Spacing', 'Rotation'] as const;
const ARCH_SYMMETRY_OPTIONS = ['Symmetrical', 'Asymmetrical'] as const;

interface TabModelAnalysisProps {
  dentitionType?: 'Permanent Dentition' | 'Mixed Dentition';
  setDentitionType?: (v: 'Permanent Dentition' | 'Mixed Dentition') => void;
  maxillaryArchShape: ArchShape;
  setMaxillaryArchShape: (v: ArchShape) => void;
  mandibularArchShape: ArchShape;
  setMandibularArchShape: (v: ArchShape) => void;
  archSymmetry: FacialSymmetry;
  setArchSymmetry: (v: FacialSymmetry) => void;
  archAlignment: ArchAlignment;
  setArchAlignment: (v: ArchAlignment) => void;
  individualIrregularities: string;
  setIndividualIrregularities: (v: string) => void;

  toothWidths: Record<string, number | ''>;
  onUpdateToothWidth: (tooth: string, val: number | '') => void;

  maxillaryArchLengthAvailable: number | '';
  setMaxillaryArchLengthAvailable: (v: number | '') => void;
  mandibularArchLengthAvailable: number | '';
  setMandibularArchLengthAvailable: (v: number | '') => void;

  premolarDiameter?: number | '';
  setPremolarDiameter?: (v: number | '') => void;
  premolarBasalArchWidth?: number | '';
  setPremolarBasalArchWidth?: (v: number | '') => void;

  measuredPremolarWidth?: number | '';
  setMeasuredPremolarWidth?: (v: number | '') => void;
  measuredMolarWidth?: number | '';
  setMeasuredMolarWidth?: (v: number | '') => void;
}

const MAXILLARY_RIGHT = ['17', '16', '15', '14', '13', '12', '11'];
const MAXILLARY_LEFT = ['21', '22', '23', '24', '25', '26', '27'];
const MANDIBULAR_RIGHT = ['47', '46', '45', '44', '43', '42', '41'];
const MANDIBULAR_LEFT = ['31', '32', '33', '34', '35', '36', '37'];

const TOOTH_WIDTH_MM_OPTIONS: string[] = (() => {
  const values: string[] = [];
  for (let w = 4; w <= 14; w += 0.5) {
    values.push(w.toFixed(1));
  }
  return values;
})();

function withCustomWidthOption(current: number | '') {
  if (current === '') return TOOTH_WIDTH_MM_OPTIONS;
  const value = current.toFixed(1);
  return TOOTH_WIDTH_MM_OPTIONS.includes(value) ? TOOTH_WIDTH_MM_OPTIONS : [...TOOTH_WIDTH_MM_OPTIONS, value];
}

const ToothWidthCell: React.FC<{
  tooth: string;
  value: number | '';
  isActive: boolean;
  onOpen: () => void;
}> = ({ tooth, value, isActive, onOpen }) => {
  const display = value === '' ? '—' : value.toFixed(1);

  return (
    <div className="text-center min-w-0">
      <span className="block text-[10px] font-bold text-slate-800 mb-0.5">{tooth}</span>
      <button
        type="button"
        onClick={onOpen}
        className={`w-full min-h-9 px-0.5 py-1 border rounded-lg text-xs font-semibold transition-colors ${
          isActive
            ? 'border-teal-600 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
            : 'border-slate-300 bg-white text-slate-900 active:bg-slate-50'
        }`}
        aria-expanded={isActive}
        aria-label={`Select width for tooth ${tooth}`}
      >
        {display}
      </button>
    </div>
  );
};

function ToothWidthScrollPanel({
  tooth,
  value,
  onUpdate,
  onClose,
}: {
  tooth: string;
  value: number | '';
  onUpdate: (tooth: string, val: number | '') => void;
  onClose: () => void;
}) {
  const options = withCustomWidthOption(value);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current || value === '') return;
    const active = listRef.current.querySelector('[data-active="true"]');
    if (active instanceof HTMLElement) {
      active.scrollIntoView({ block: 'center' });
    }
  }, [tooth, value]);

  return (
    <div className="rounded-xl border border-teal-200 bg-white shadow-md overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-teal-50 border-b border-teal-100">
        <p className="text-xs font-bold text-teal-900">Tooth {tooth} — scroll to select width</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-[11px] font-semibold text-teal-800 px-2 py-1 rounded-lg active:bg-teal-100"
        >
          Done
        </button>
      </div>
      <div
        ref={listRef}
        className="max-h-56 overflow-y-auto overscroll-contain touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        <button
          type="button"
          onClick={() => {
            onUpdate(tooth, '');
            onClose();
          }}
          className="w-full px-3 py-3 text-left text-sm font-medium text-slate-500 border-b border-slate-100 active:bg-slate-50"
        >
          Clear selection
        </button>
        {options.map((opt) => {
          const active = value !== '' && value.toFixed(1) === opt;
          return (
            <button
              key={opt}
              type="button"
              data-active={active ? 'true' : undefined}
              onClick={() => {
                onUpdate(tooth, parseFloat(opt));
                onClose();
              }}
              className={`w-full px-3 py-2 text-left text-sm font-semibold flex items-center justify-between transition-colors ${
                active ? 'bg-teal-600 text-white' : 'text-slate-800 active:bg-slate-100'
              }`}
            >
              <span>{opt} mm</span>
              {active && <span className="text-xs">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ToothWidthArchSection({
  title,
  rightTeeth,
  leftTeeth,
  toothWidths,
  onUpdateToothWidth,
}: {
  title: string;
  rightTeeth: string[];
  leftTeeth: string[];
  toothWidths: Record<string, number | ''>;
  onUpdateToothWidth: (tooth: string, val: number | '') => void;
}) {
  const [activeTooth, setActiveTooth] = useState<string | null>(null);

  const renderCell = (t: string) => (
    <ToothWidthCell
      key={t}
      tooth={t}
      value={toothWidths[t] ?? ''}
      isActive={activeTooth === t}
      onOpen={() => setActiveTooth((prev) => (prev === t ? null : t))}
    />
  );

  return (
    <div className="space-y-3">
      <span className="block text-slate-900 font-bold text-xs uppercase tracking-wider">{title}</span>
      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
        <div>
          <p className="text-[10px] font-semibold text-slate-500 mb-1 text-center">Patient&apos;s right</p>
          <div className="grid grid-cols-7 gap-1">{rightTeeth.map(renderCell)}</div>
        </div>
        <div className="border-t border-slate-200 pt-2">
          <p className="text-[10px] font-semibold text-slate-500 mb-1 text-center">Patient&apos;s left</p>
          <div className="grid grid-cols-7 gap-1">{leftTeeth.map(renderCell)}</div>
        </div>
        {activeTooth ? (
          <ToothWidthScrollPanel
            tooth={activeTooth}
            value={toothWidths[activeTooth] ?? ''}
            onUpdate={onUpdateToothWidth}
            onClose={() => setActiveTooth(null)}
          />
        ) : null}
      </div>
    </div>
  );
}

export const TabModelAnalysis: React.FC<TabModelAnalysisProps> = (props) => {
  const bolton = calculateBolton(props.toothWidths);
  const careyLower = calculateCarey(props.toothWidths, props.mandibularArchLengthAvailable ?? '');
  const nanceUpper = calculateNanceMaxillary(props.toothWidths, props.maxillaryArchLengthAvailable ?? '');
  const ponts = calculatePonts(props.toothWidths, props.measuredPremolarWidth, props.measuredMolarWidth);
  const ashleyHowe = calculateAshleyHowe(props.premolarBasalArchWidth || '', props.toothWidths);
  const tanaka = calculateTanakaJohnston(props.toothWidths);

  const getBadgeComponent = (badgeColor: 'green' | 'amber' | 'red' | 'blue') => {
    switch (badgeColor) {
      case 'green':
        return (
          <span className="inline-flex items-center gap-1 font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded-full text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Normal / Favorable
          </span>
        );
      case 'amber':
        return (
          <span className="inline-flex items-center gap-1 font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2.5 py-1 rounded-full text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Borderline / Attention
          </span>
        );
      case 'red':
        return (
          <span className="inline-flex items-center gap-1 font-bold bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-full text-xs">
            <XCircle className="w-4 h-4 text-rose-600" /> Discrepancy / Extraction Indicated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 font-bold bg-blue-100 text-blue-900 border border-blue-300 px-2.5 py-1 rounded-full text-xs">
            <Award className="w-4 h-4 text-blue-600" /> Expansion Analysis
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Cast Features */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Grid className="w-4 h-4 text-teal-600" />
          General Cast Features
        </h3>

        <div className={STACK}>
          <SelectField
            label="Dentition Stage"
            value={props.dentitionType || 'Permanent Dentition'}
            onChange={(v) => props.setDentitionType && props.setDentitionType(v as 'Permanent Dentition' | 'Mixed Dentition')}
            options={['Permanent Dentition', 'Mixed Dentition']}
          />

          <SelectField
            label="Maxillary Arch Shape"
            value={props.maxillaryArchShape}
            onChange={(v) => props.setMaxillaryArchShape(v as ArchShape)}
            options={ARCH_SHAPE_OPTIONS}
          />

          <SelectField
            label="Mandibular Arch Shape"
            value={props.mandibularArchShape}
            onChange={(v) => props.setMandibularArchShape(v as ArchShape)}
            options={ARCH_SHAPE_OPTIONS}
          />

          <SelectField
            label="Arch Alignment"
            value={props.archAlignment}
            onChange={(v) => props.setArchAlignment(v as ArchAlignment)}
            options={ARCH_ALIGNMENT_OPTIONS}
          />

          <SelectField
            label="Arch Symmetry"
            value={props.archSymmetry}
            onChange={(v) => props.setArchSymmetry(v as FacialSymmetry)}
            options={ARCH_SYMMETRY_OPTIONS}
          />

          <div>
            <label className="block text-slate-900 font-bold text-sm mb-1.5">
              Individual Irregularities (Rotations, Displacements)
            </label>
            <textarea
              className={FIELD}
              rows={2}
              value={props.individualIrregularities}
              onChange={(e) => props.setIndividualIrregularities(e.target.value)}
              placeholder="e.g., 12 distolabially rotated, 23 buccally placed, 33 lingually tilted..."
            />
          </div>
        </div>
      </div>

      {/* 2. Tooth Width Measurements (FDI) */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Calculator className="w-4 h-4 text-teal-600" />
          Tooth Material: Mesiodistal Widths (mm)
        </h3>
        <p className="text-xs text-slate-700 leading-snug">
          Tap any cell to select or enter a width. Widths update Bolton, Carey, Nance, Pont&apos;s, and Ashley-Howe analyses in real time.
        </p>

        <div className="space-y-4">
          <ToothWidthArchSection
            title="Maxillary Arch (17 to 27)"
            rightTeeth={MAXILLARY_RIGHT}
            leftTeeth={MAXILLARY_LEFT}
            toothWidths={props.toothWidths}
            onUpdateToothWidth={props.onUpdateToothWidth}
          />

          <ToothWidthArchSection
            title="Mandibular Arch (47 to 37)"
            rightTeeth={MANDIBULAR_RIGHT}
            leftTeeth={MANDIBULAR_LEFT}
            toothWidths={props.toothWidths}
            onUpdateToothWidth={props.onUpdateToothWidth}
          />
        </div>
      </div>

      {/* 3. REAL-TIME AUTOMATED CALCULATIONS DISPLAY */}
      <div className="space-y-4">
        <h3 className={SECTION_TITLE}>
          <Award className="w-4 h-4 text-teal-600" />
          Automated Model Analysis & Diagnostic Inferences
        </h3>

        <div className={STACK}>
          {/* 1. Carey's Mandibular Arch Perimeter Analysis */}
          <div className={CARD}>
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-2.5">
              <h4 className="font-bold text-slate-900 text-sm">1. Carey&apos;s Mandibular Arch Perimeter Analysis</h4>
              {getBadgeComponent(careyLower.badgeColor)}
            </div>

            <div className={STACK}>
              <NumericSelectField
                label="Mandibular Arch Length Available (mm)"
                value={props.mandibularArchLengthAvailable}
                onChange={props.setMandibularArchLengthAvailable}
                min={50}
                max={90}
                step={0.5}
                placeholder="Tap to select mandibular arch length…"
                presets={[{ label: 'typical mandibular', val: 68 }]}
              />

              <div>
                <label className="block text-slate-900 font-bold text-sm mb-1.5">Mandibular Tooth Material (35–45 mm)</label>
                <div className="min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm flex items-center">
                  {careyLower.totalToothMaterial > 0
                    ? `${careyLower.totalToothMaterial.toFixed(1)} mm`
                    : '—'}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-snug">
                  Auto-calculated from lower teeth 35–45 in the tooth width grid above
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Mandibular Discrepancy:</span>
                <span className={careyLower.discrepancy !== null && careyLower.discrepancy < 0 ? 'text-rose-600 font-bold' : 'text-slate-900 font-bold'}>
                  {careyLower.discrepancy !== null ? `${careyLower.discrepancy > 0 ? '+' : ''}${careyLower.discrepancy.toFixed(1)} mm` : 'N/A'}
                </span>
              </div>
              <p className="font-bold text-teal-950 border-t border-slate-200 pt-1.5 mt-1">
                Inference: {careyLower.inference}
              </p>
            </div>
          </div>

          {/* 2. Maxillary Arch Perimeter Analysis (Nance) */}
          <div className={CARD}>
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-2.5">
              <h4 className="font-bold text-slate-900 text-sm">2. Maxillary Arch Perimeter Analysis (Nance)</h4>
              {getBadgeComponent(nanceUpper.badgeColor)}
            </div>

            <div className={STACK}>
              <NumericSelectField
                label="Maxillary Arch Length Available (mm)"
                value={props.maxillaryArchLengthAvailable}
                onChange={props.setMaxillaryArchLengthAvailable}
                min={55}
                max={95}
                step={0.5}
                placeholder="Tap to select maxillary arch length…"
                presets={[{ label: 'typical maxillary', val: 72 }]}
              />

              <div>
                <label className="block text-slate-900 font-bold text-sm mb-1.5">Maxillary Tooth Material (15–25 mm)</label>
                <div className="min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm flex items-center">
                  {nanceUpper.totalToothMaterial > 0
                    ? `${nanceUpper.totalToothMaterial.toFixed(1)} mm`
                    : '—'}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-snug">
                  Auto-calculated from upper teeth 15–25 in the tooth width grid above
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs sm:text-sm space-y-1">
              <div className="flex justify-between font-semibold text-slate-800">
                <span>Maxillary Discrepancy:</span>
                <span className={nanceUpper.discrepancy !== null && nanceUpper.discrepancy < 0 ? 'text-rose-600 font-bold' : 'text-slate-900 font-bold'}>
                  {nanceUpper.discrepancy !== null ? `${nanceUpper.discrepancy > 0 ? '+' : ''}${nanceUpper.discrepancy.toFixed(1)} mm` : 'N/A'}
                </span>
              </div>
              <p className="font-bold text-teal-950 border-t border-slate-200 pt-1.5 mt-1">
                Inference: {nanceUpper.inference}
              </p>
            </div>
          </div>

          {/* 3. Bolton's Analysis */}
          <div className={CARD}>
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-2.5">
              <h4 className="font-bold text-slate-900 text-sm">3. Bolton&apos;s Tooth Ratio Analysis</h4>
              {getBadgeComponent(bolton.anteriorBadgeColor)}
            </div>

            <div className={STACK}>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm">
                <span className="block text-slate-600 font-bold mb-0.5">Anterior Ratio (77.2%)</span>
                <span className="text-base font-extrabold text-slate-900">
                  {bolton.anteriorRatio !== null ? `${bolton.anteriorRatio.toFixed(1)}%` : '--'}
                </span>
                <p className="text-xs text-slate-700 font-medium mt-1 leading-tight">{bolton.anteriorInference}</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm">
                <span className="block text-slate-600 font-bold mb-0.5">Overall Ratio (91.3%)</span>
                <span className="text-base font-extrabold text-slate-900">
                  {bolton.overallRatio !== null ? `${bolton.overallRatio.toFixed(1)}%` : '--'}
                </span>
                <p className="text-xs text-slate-700 font-medium mt-1 leading-tight">{bolton.overallInference}</p>
              </div>
            </div>
          </div>

          {/* 4. Pont's Analysis */}
          <div className={CARD}>
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-2.5">
              <h4 className="font-bold text-slate-900 text-sm">4. Pont&apos;s Arch Width Analysis</h4>
              {getBadgeComponent(ponts.badgeColor)}
            </div>

            <div className={STACK}>
              {props.setMeasuredPremolarWidth && (
                <NumericSelectField
                  label="Measured Premolar Arch Width 14–24 (mm)"
                  value={props.measuredPremolarWidth ?? ''}
                  onChange={props.setMeasuredPremolarWidth}
                  min={28}
                  max={52}
                  step={0.5}
                  placeholder="Measured caliper width across 14-24 distal pits…"
                  presets={[{ label: 'typical 14-24', val: 36 }]}
                />
              )}

              {props.setMeasuredMolarWidth && (
                <NumericSelectField
                  label="Measured Molar Arch Width 16–26 (mm)"
                  value={props.measuredMolarWidth ?? ''}
                  onChange={props.setMeasuredMolarWidth}
                  min={35}
                  max={62}
                  step={0.5}
                  placeholder="Measured caliper width across 16-26 central fossae…"
                  presets={[{ label: 'typical 16-26', val: 45 }]}
                />
              )}
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
              <p className="font-bold text-teal-950">{ponts.inference}</p>
              {ponts.calculatedMPV && (
                <p className="text-xs text-slate-600 font-medium mt-1">
                  Sum of Incisors (SI): {ponts.sumOfIncisors} mm | Expected Premolar Width (MPV): {ponts.calculatedMPV.toFixed(1)} mm | Expected Molar Width (MMV): {ponts.calculatedMMV?.toFixed(1)} mm
                </p>
              )}
            </div>
          </div>

          {/* 5. Ashley-Howe's Analysis */}
          <div className={CARD}>
            <div className="flex flex-col gap-2 border-b border-slate-200 pb-2.5">
              <h4 className="font-bold text-slate-900 text-sm">5. Ashley-Howe&apos;s Analysis</h4>
              {getBadgeComponent(ashleyHowe.badgeColor)}
            </div>

            <div className={STACK}>
              {props.setPremolarBasalArchWidth && (
                <NumericSelectField
                  label="Premolar Basal Arch Width (PMBAW mm)"
                  value={props.premolarBasalArchWidth ?? ''}
                  onChange={props.setPremolarBasalArchWidth}
                  min={32}
                  max={50}
                  step={0.5}
                  placeholder="Tap to select PMBAW…"
                  presets={[{ label: 'typical', val: 41 }]}
                />
              )}

              <div>
                <label className="block text-slate-900 font-bold text-sm mb-1.5">Total Tooth Material (TTM 16–26 mm)</label>
                <div className="min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm flex items-center">
                  {ashleyHowe.totalToothMaterial > 0 ? `${ashleyHowe.totalToothMaterial.toFixed(1)} mm` : '—'}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-snug">
                  Auto-calculated from all 12 maxillary teeth (16–26) in the tooth width grid above
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
              <p className="font-bold text-teal-950">{ashleyHowe.inference}</p>
            </div>
          </div>

          {/* 6. Tanaka-Johnston Mixed Dentition Analysis */}
          {props.dentitionType === 'Mixed Dentition' ? (
            <div className={CARD}>
              <div className="flex flex-col gap-2 border-b border-slate-200 pb-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">6. Tanaka-Johnston Mixed Dentition Analysis</h4>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                    Mixed Dentition Active
                  </span>
                </div>
                {getBadgeComponent(tanaka.badgeColor)}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-900 font-bold text-xs mb-1">Mandibular 4 Incisors Sum (31, 32, 41, 42)</label>
                  <div className="min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 text-sm flex items-center">
                    {tanaka.hasAll4MandibularIncisors ? `${tanaka.mandibularIncisorSum.toFixed(1)} mm` : '—'}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-900 font-bold text-xs mb-1">Predicted Maxillary 3-4-5 / Quadrant</label>
                  <div className="min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-700 text-sm flex items-center">
                    {tanaka.predictedMaxillaryCpmPerQuadrant ? `${tanaka.predictedMaxillaryCpmPerQuadrant.toFixed(1)} mm (Total: ${tanaka.predictedMaxillaryTotal?.toFixed(1)} mm)` : '—'}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-900 font-bold text-xs mb-1">Predicted Mandibular 3-4-5 / Quadrant</label>
                  <div className="min-h-11 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-700 text-sm flex items-center">
                    {tanaka.predictedMandibularCpmPerQuadrant ? `${tanaka.predictedMandibularCpmPerQuadrant.toFixed(1)} mm (Total: ${tanaka.predictedMandibularTotal?.toFixed(1)} mm)` : '—'}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm">
                <p className="font-bold text-teal-950">{tanaka.inference}</p>
                <p className="text-xs text-slate-500 mt-1">
                  Formulas (75% confidence): Maxillary = (Σ lower 4 incisors / 2) + 10.5 mm | Mandibular = (Σ lower 4 incisors / 2) + 10.0 mm
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-slate-600">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800">6. Tanaka-Johnston Mixed Dentition Analysis</span>
                <p className="text-slate-500 text-[11px]">
                  Applicable specifically to mixed dentition cases. (Current case set to Permanent Dentition).
                </p>
              </div>
              {props.setDentitionType && (
                <button
                  type="button"
                  onClick={() => props.setDentitionType!('Mixed Dentition')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-slate-700 font-bold text-xs shrink-0 cursor-pointer shadow-2xs"
                >
                  Activate for Mixed Dentition
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabModelAnalysis);
