import React from 'react';
import { RespirationType, MasticationType } from '../../types';
import { Activity, ShieldAlert } from 'lucide-react';
import { SelectField } from './SelectField';
import { MultiSelectField } from './MultiSelectField';

const CARD = 'bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4';
const SECTION_TITLE =
  'text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2.5';

const RESPIRATION_OPTIONS: { value: RespirationType; label: string }[] = [
  { value: 'Nasal', label: 'Nasal (Normal)' },
  { value: 'Oral', label: 'Oral (Mouth Breathing)' },
  { value: 'Abnormal retained infantile', label: 'Oronasal / Mixed' },
  { value: 'Mature swallow', label: 'Mouth Breathing Habit' },
];

const MASTICATION_OPTIONS: { value: MasticationType; label: string }[] = [
  { value: 'Bilateral', label: 'Bilateral (Symmetrical)' },
  { value: 'Unilateral', label: 'Unilateral Mastication' },
];

const SWALLOWING_OPTIONS = [
  'Normal / Mature Swallow',
  'Tongue Thrusting (Atypical)',
  'Simple Tongue Thrust',
  'Complex Tongue Thrust',
  'Infantile / Visceral Swallow',
  'Retained Infantile Swallow',
];

const SPEECH_OPTIONS = [
  'Normal / Clear Speech',
  'Lisping (Interdental Sibilant Defect)',
  'Sibilant Sound Defect (/s/, /z/)',
  'Labiodental Defect (/f/, /v/)',
  'Palatal Sound Defect',
  'Speech Slurring / Dyslalia',
];

function withCustomOption(options: readonly string[], current: string) {
  return current && !options.includes(current) ? [...options, current] : options;
}

const TMJ_SYMPTOM_OPTIONS = [
  'History of Pain',
  'Joint Clicking',
  'Crepitus',
  'Tenderness on Palpation',
];

const PATH_OF_CLOSURE_OPTIONS = [
  'Straight / Uninhibited',
  'Deviated Right on Opening',
  'Deviated Left on Opening',
  'Deflected Path (S-Curve)',
  'Anterior Premature Contact Shift',
];

const DEVIATION_OPTIONS = [
  'None / Coincident',
  '1mm Right on Opening',
  '2mm Right on Opening',
  '>2mm Right on Opening',
  '1mm Left on Opening',
  '2mm Left on Opening',
  '>2mm Left on Opening',
  'Transverse Shift on Closure',
];

const CO_CR_OPTIONS = [
  'None / Coincident (CO = CR)',
  'Minimal (< 1.0 mm)',
  'Significant Anteroposterior Slide (≥ 1.5 mm)',
  'Lateral Shift on Closure',
  'Vertical CR-CO Shift',
];

const MAX_OPENING_MM_OPTIONS = Array.from({ length: 71 }, (_, i) => {
  const mm = i + 10;
  return { value: String(mm), label: `${mm} mm` };
});

const FREEWAY_SPACE_MM_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10].map((mm) => ({
  value: String(mm),
  label: `${mm} mm`,
}));

function withCustomNumericOption(
  options: { value: string; label: string }[],
  current: number | ''
) {
  if (current === '') return options;
  const value = String(current);
  return options.some((opt) => opt.value === value)
    ? options
    : [...options, { value, label: `${value} mm` }];
}

const FIELD =
  'w-full min-h-11 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600';

interface TabFunctionalTmjProps {
  respiration: RespirationType;
  setRespiration: (v: RespirationType) => void;
  speech: string;
  setSpeech: (v: string) => void;
  mastication: MasticationType;
  setMastication: (v: MasticationType) => void;
  swallowing: string;
  setSwallowing: (v: string) => void;

  painHistory: boolean;
  setPainHistory: (v: boolean) => void;
  clicking: boolean;
  setClicking: (v: boolean) => void;
  crepitus: boolean;
  setCrepitus: (v: boolean) => void;
  tendernessPalpation: boolean;
  setTendernessPalpation: (v: boolean) => void;

  pathOfClosure: string;
  setPathOfClosure: (v: string) => void;
  deviation: string;
  setDeviation: (v: string) => void;
  coCrDiscrepancy: string;
  setCoCrDiscrepancy: (v: string) => void;

  maxOpeningMm: number | '';
  setMaxOpeningMm: (v: number | '') => void;
  freewaySpaceMm: number | '';
  setFreewaySpaceMm: (v: number | '') => void;
  notes: string;
  setNotes: (v: string) => void;
}

export const TabFunctionalTmj: React.FC<TabFunctionalTmjProps> = (props) => {
  const tmjSymptomsValue = [
    props.painHistory && 'History of Pain',
    props.clicking && 'Joint Clicking',
    props.crepitus && 'Crepitus',
    props.tendernessPalpation && 'Tenderness on Palpation',
  ]
    .filter(Boolean)
    .join(', ');

  const setTmjSymptomsValue = (value: string) => {
    const selected = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    props.setPainHistory(selected.includes('History of Pain'));
    props.setClicking(selected.includes('Joint Clicking'));
    props.setCrepitus(selected.includes('Crepitus'));
    props.setTendernessPalpation(selected.includes('Tenderness on Palpation'));
  };

  return (
    <div className="space-y-4">
      {/* 1. FUNCTIONAL EXAMINATION */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Activity className="w-4 h-4 text-teal-600 shrink-0" />
          Functional Examination
        </h3>

        <div className="space-y-3.5">
          <SelectField
            label="Respiration Pattern"
            value={props.respiration}
            onChange={(v) => props.setRespiration(v as RespirationType)}
            options={RESPIRATION_OPTIONS}
            placeholder="Tap to select respiration…"
          />

          <SelectField
            label="Mastication"
            value={props.mastication}
            onChange={(v) => props.setMastication(v as MasticationType)}
            options={MASTICATION_OPTIONS}
            placeholder="Tap to select mastication…"
          />

          <SelectField
            label="Swallowing Pattern"
            value={props.swallowing}
            onChange={props.setSwallowing}
            options={withCustomOption(SWALLOWING_OPTIONS, props.swallowing)}
            placeholder="Tap to select swallowing…"
          />

          <SelectField
            label="Speech & Phonetics"
            value={props.speech}
            onChange={props.setSpeech}
            options={withCustomOption(SPEECH_OPTIONS, props.speech)}
            placeholder="Tap to select speech…"
          />
        </div>
      </div>

      {/* 2. TMJ & JAW EXAMINATION */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <ShieldAlert className="w-4 h-4 text-teal-600 shrink-0" />
          TMJ & Jaw Examination
        </h3>

        <div className="space-y-3.5">
          <MultiSelectField
            label="TMJ Symptoms & Signs"
            value={tmjSymptomsValue}
            onChange={setTmjSymptomsValue}
            options={TMJ_SYMPTOM_OPTIONS}
            placeholder="Tap to select symptoms…"
          />

          <SelectField
            label="Path of Closure"
            value={props.pathOfClosure}
            onChange={props.setPathOfClosure}
            options={withCustomOption(PATH_OF_CLOSURE_OPTIONS, props.pathOfClosure)}
            placeholder="Tap to select path of closure…"
          />

          <SelectField
            label="Mandibular Deviation / Shift"
            value={props.deviation}
            onChange={props.setDeviation}
            options={withCustomOption(DEVIATION_OPTIONS, props.deviation)}
            placeholder="Tap to select deviation…"
          />

          <SelectField
            label="CO - CR Discrepancy"
            value={props.coCrDiscrepancy}
            onChange={props.setCoCrDiscrepancy}
            options={withCustomOption(CO_CR_OPTIONS, props.coCrDiscrepancy)}
            placeholder="Tap to select CO-CR discrepancy…"
          />

          <SelectField
            label="Max Mouth Opening (mm)"
            value={props.maxOpeningMm === '' ? '' : String(props.maxOpeningMm)}
            onChange={(v) => props.setMaxOpeningMm(v === '' ? '' : Number(v))}
            options={withCustomNumericOption(MAX_OPENING_MM_OPTIONS, props.maxOpeningMm)}
            placeholder="Tap to select opening…"
          />

          <SelectField
            label="Freeway Space (mm)"
            value={props.freewaySpaceMm === '' ? '' : String(props.freewaySpaceMm)}
            onChange={(v) => props.setFreewaySpaceMm(v === '' ? '' : Number(v))}
            options={withCustomNumericOption(FREEWAY_SPACE_MM_OPTIONS, props.freewaySpaceMm)}
            placeholder="Tap to select freeway space…"
          />

          <div>
            <label className="block text-slate-900 font-bold text-sm mb-1.5">Additional Functional Notes</label>
            <textarea
              rows={5}
              value={props.notes}
              onChange={(e) => props.setNotes(e.target.value)}
              placeholder="Clinical notes on functional habits, muscle palpation, or joint auscultation…"
              className={`${FIELD} resize-y min-h-[7.5rem] py-3 leading-relaxed placeholder:text-slate-400`}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabFunctionalTmj);


