import React, { useState } from 'react';
import {
  Gender,
  DurationOption,
  TreatmentMotivation,
  TreatmentAttitude,
} from '../../types';
import {
  User,
  HeartPulse,
  Stethoscope,
  Sparkles,
  ChevronDown,
  Check,
  Activity,
  Smile,
} from 'lucide-react';

const FIELD =
  'w-full min-h-11 px-3 py-2.5 border border-slate-300 rounded-xl text-base font-medium bg-white text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 cursor-pointer';
const LABEL = 'block text-slate-900 font-bold text-meta mb-1.5';
const CARD = 'bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4';
const SECTION_TITLE =
  'text-base font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2.5';
const SUBHEAD = 'text-xs font-bold text-slate-500 uppercase tracking-wide';

/* ---------- option lists (tap-only, no free text) ---------- */
const AGE_OPTIONS = Array.from({ length: 56 }, (_, i) => i + 5); // 5–60 yrs

const INFORMER_OPTIONS = [
  'Self',
  'Mother',
  'Father',
  'Both Parents',
  'Guardian',
  'Spouse',
  'Relative / Other',
];

const PREGNANCY_OPTIONS = [
  'Normal / Uneventful',
  'Maternal Infection (1st Trimester)',
  'Drug / Medication Exposure',
  'Gestational Diabetes',
  'Preeclampsia / Hypertension',
  'Severe Nutritional Deficiency',
  'Complicated Pregnancy',
  'Not known / Not recalled',
];

const DELIVERY_OPTIONS = [
  'Normal Vaginal Delivery',
  'Forceps / Assisted Delivery',
  'Vacuum Extraction',
  'LSCS (C-Section)',
  'Pre-term / Premature',
  'Not known / Not recalled',
];

const FEEDING_OPTIONS = [
  'Exclusive Breastfeeding',
  'Bottle Feeding',
  'Mixed (Breast & Bottle)',
  'Prolonged Bottle Feeding',
  'Weaned Early',
  'Not known / Not recalled',
];

const MILESTONE_OPTIONS = [
  'Normal / On Schedule',
  'Delayed Motor Milestones',
  'Delayed Speech / Language',
  'Delayed Teething / Eruption',
  'Overall Delayed Milestones',
  'Not known / Not recalled',
];

const CHILDHOOD_DISEASE_OPTIONS = [
  'Measles',
  'Mumps',
  'Chicken Pox',
  'Rubella',
  'Scarlet Fever',
  'Whooping Cough',
  'Diphtheria',
  'Frequent Tonsillitis',
  'Asthma / Allergies',
  'Rheumatic Fever',
  'None / No Childhood Illnesses',
];

const BEHAVIORAL_OPTIONS = [
  'Cooperative / Calm',
  'Anxious in clinic',
  'Highly aesthetic-conscious',
  'Peer / bullying related concern',
  'School performance impact',
  'Previous dental fear',
  'Good compliance expected',
  'Compliance uncertain',
  'No significant behavioral notes',
];

const SOCIAL_OPTIONS = [
  'Supportive family',
  'Single-parent household',
  'Boarding school / hostel',
  'Urban professional lifestyle',
  'Rural / limited access',
  'Financial constraints noted',
  'Sibling also in ortho care',
  'No significant social notes',
];

const OTHER_PERTINENT_OPTIONS = [
  'Exam / wedding deadline',
  'Travel abroad soon',
  'Sports / wind instrument',
  'High smile-line concern',
  'Previous ortho relapse',
  'None',
];

const CC_PRIMARY_OPTIONS = [
  'Irregular / Crooked Teeth',
  'Forward / Protruding Teeth',
  'Gaps / Spacing',
  'Missing Teeth',
  'Jaw Problem / Asymmetry',
  'Facial Aesthetics Concern',
];

const CC_OTHER_OPTIONS = [
  'None',
  'Difficulty chewing',
  'Speech concern',
  'TMJ / clicking pain',
  'Breathing / snoring concern',
  'Retained deciduous teeth',
  'Impacted teeth concern',
  'Gummy smile',
];

const DURATION_PRESETS: { label: string; value: DurationOption }[] = [
  { label: '< 6 months', value: '<6 months' },
  { label: '6 months – 1 year', value: '6 months-1 year' },
  { label: '1 – 3 years', value: '1-3 years' },
  { label: '> 3 years', value: '>3 years' },
];

const CC_NOTES_OPTIONS = [
  'Wants straighter smile',
  'Concerned about forward teeth',
  'Parents brought for crowding',
  'Referred by general dentist',
  'Aesthetic concern mainly',
  'Functional complaint mainly',
  'Both aesthetic and functional',
  'No additional wording recorded',
];

const MED_CONDITION_OPTIONS = [
  'No significant history',
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Allergies',
  'Bleeding disorder',
  'Other',
];

const MED_NOTES_OPTIONS = [
  'No medications',
  'On inhaler (asthma)',
  'On antihypertensives',
  'Known drug allergy — see chart',
  'Antibiotic prophylaxis advised',
  'Physician clearance obtained',
  'No additional medical notes',
];

const DENT_CONDITION_OPTIONS = [
  'Previous extractions',
  'Previous orthodontic treatment',
  'Dental trauma',
  'Restorations / crowns',
];

const HAB_CONDITION_OPTIONS = [
  'No deleterious habits',
  'Thumb / digit sucking',
  'Mouth breathing',
  'Tongue thrusting',
  'Lip biting / sucking',
  'Bruxism',
];

const DENT_NOTES_OPTIONS = [
  'Routine dental care only',
  'Multiple restorations present',
  'Extraction history (specify FDI in Intraoral)',
  'Previous removable appliance',
  'Previous fixed appliance',
  'Trauma to anterior teeth',
  'No additional dental notes',
];

const HAB_NOTES_OPTIONS = [
  'Habit discontinued',
  'Habit active — day only',
  'Habit active — night only',
  'Habit active — day and night',
  'Started habit-breaking appliance',
  'No additional habit notes',
];

/** Text input with optional tap suggestions (manual entry allowed) */
function TextFieldWithSuggestions({
  label,
  value,
  onChange,
  suggestions,
  placeholder = 'Type or tap a suggestion…',
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suggestions: readonly string[] | string[];
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const query = value.trim().toLowerCase();
  const filtered = suggestions.filter(
    (s) => !query || s.toLowerCase().includes(query)
  );

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <input
        type="text"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        className={FIELD}
        autoComplete="name"
      />
      {open && filtered.length > 0 && (
        <div className="mt-1.5 rounded-xl border border-slate-200 bg-white shadow-md max-h-44 overflow-y-auto no-scrollbar">
          {filtered.map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className={`w-full px-3 py-2.5 text-left text-sm font-medium border-b border-slate-100 last:border-b-0 active:bg-slate-50 ${
                value === s ? 'bg-teal-50 text-teal-900' : 'text-slate-700'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DurationField({
  value,
  onChange,
}: {
  value: DurationOption;
  onChange: (v: DurationOption) => void;
}) {
  const preset = DURATION_PRESETS.find((p) => p.value === value);
  const display = preset?.label ?? value;

  return (
    <TextFieldWithSuggestions
      label="Duration of Complaint"
      value={display}
      onChange={(text) => {
        const match = DURATION_PRESETS.find((p) => p.label === text || p.value === text);
        onChange(match?.value ?? (text as DurationOption));
      }}
      suggestions={DURATION_PRESETS.map((p) => p.label)}
      placeholder="Tap preset or type duration…"
    />
  );
}

/** Native-feel scrolling single select (no typing) */
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Tap to select…',
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  options: readonly string[] | string[] | number[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const display =
    value === '' || value === undefined || value === null
      ? placeholder
      : String(value);

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 min-h-11 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 active:bg-slate-50"
        aria-expanded={open}
      >
        <span className={`truncate text-left ${value === '' ? 'text-slate-400' : ''}`}>
          {display}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-1.5 rounded-xl border border-slate-200 bg-white shadow-md max-h-52 overflow-y-auto no-scrollbar">
          {options.map((opt) => {
            const s = String(opt);
            const active = String(value) === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium border-b border-slate-100 last:border-b-0 ${
                  active ? 'bg-teal-50 text-teal-900' : 'text-slate-700 active:bg-slate-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                    active ? 'border-teal-600' : 'border-slate-300'
                  }`}
                >
                  {active && <span className="w-2 h-2 rounded-full bg-teal-600" />}
                </span>
                <span>{s}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Vertical multi-select dropdown (comma-joined string storage) */
function MultiSelectField({
  label,
  value,
  onChange,
  options,
  exclusiveOption,
  placeholder = 'Tap to select…',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | string[];
  exclusiveOption?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = value
    ? value.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const isSelected = (opt: string) => {
    if (exclusiveOption && (opt === exclusiveOption || opt.startsWith('None'))) {
      return selected.some(
        (s) => s === opt || s === 'None' || s === exclusiveOption || s.startsWith('None')
      );
    }
    return selected.includes(opt);
  };

  const toggle = (opt: string) => {
    const isExclusive =
      exclusiveOption &&
      (opt === exclusiveOption || opt.startsWith('None') || opt.includes('No significant') || opt.includes('No additional') || opt === 'None');

    if (isExclusive) {
      onChange(opt === exclusiveOption ? exclusiveOption : opt);
      return;
    }

    let updated = selected.filter((s) => {
      if (!exclusiveOption) return true;
      return (
        s !== exclusiveOption &&
        s !== 'None' &&
        !s.startsWith('None') &&
        !s.includes('No significant') &&
        !s.includes('No additional')
      );
    });

    if (updated.includes(opt)) {
      updated = updated.filter((s) => s !== opt);
    } else {
      updated.push(opt);
    }
    onChange(updated.join(', '));
  };

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <div>
      <label className={LABEL}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 min-h-11 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 active:bg-slate-50"
        aria-expanded={open}
      >
        <span className={`truncate text-left ${selected.length === 0 ? 'text-slate-400' : ''}`}>
          {summary}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          className="mt-1.5 rounded-xl border border-slate-200 bg-white shadow-md max-h-52 overflow-y-auto no-scrollbar"
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map((opt) => {
            const active = isSelected(opt);
            return (
              <button
                key={opt}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => toggle(opt)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium border-b border-slate-100 last:border-b-0 ${
                  active ? 'bg-teal-50 text-teal-900' : 'text-slate-700 active:bg-slate-50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    active ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                  }`}
                >
                  {active && <Check className="w-3 h-3" strokeWidth={3} />}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      )}
      {selected.length > 1 && (
        <p className="mt-1.5 text-[11px] text-slate-500 font-medium leading-snug">
          {value}
        </p>
      )}
    </div>
  );
}

interface TabHistoryProps {
  name: string;
  setName: (v: string) => void;
  patientId: string;
  setPatientId: (v: string) => void;
  age: number | '';
  setAge: (v: number | '') => void;
  gender: Gender;
  setGender: (v: Gender) => void;
  examDate: string;
  setExamDate: (v: string) => void;
  contact: string;
  setContact: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;

  informer: string;
  setInformer: (v: string) => void;
  prenatalMotherCondition: string;
  setPrenatalMotherCondition: (v: string) => void;
  deliveryType: string;
  setDeliveryType: (v: string) => void;
  postnatalFeeding: string;
  setPostnatalFeeding: (v: string) => void;
  postnatalMilestones: string;
  setPostnatalMilestones: (v: string) => void;
  behavioralHistory: string;
  setBehavioralHistory: (v: string) => void;
  socialHistory: string;
  setSocialHistory: (v: string) => void;
  childhoodDiseases: string;
  setChildhoodDiseases: (v: string) => void;

  motivation: TreatmentMotivation;
  setMotivation: (v: TreatmentMotivation) => void;
  attitude: TreatmentAttitude;
  setAttitude: (v: TreatmentAttitude) => void;
  otherPertinentInfo: string;
  setOtherPertinentInfo: (v: string) => void;

  ccIrregular: boolean;
  setCcIrregular: (v: boolean) => void;
  ccProtruding: boolean;
  setCcProtruding: (v: boolean) => void;
  ccSpacing: boolean;
  setCcSpacing: (v: boolean) => void;
  ccMissing: boolean;
  setCcMissing: (v: boolean) => void;
  ccJaw: boolean;
  setCcJaw: (v: boolean) => void;
  ccFacial: boolean;
  setCcFacial: (v: boolean) => void;
  ccOtherText: string;
  setCcOtherText: (v: string) => void;
  ccDuration: DurationOption;
  setCcDuration: (v: DurationOption) => void;
  ccNotes: string;
  setCcNotes: (v: string) => void;

  medDiabetes: boolean;
  setMedDiabetes: (v: boolean) => void;
  medHypertension: boolean;
  setMedHypertension: (v: boolean) => void;
  medAsthma: boolean;
  setMedAsthma: (v: boolean) => void;
  medAllergy: boolean;
  setMedAllergy: (v: boolean) => void;
  medBleeding: boolean;
  setMedBleeding: (v: boolean) => void;
  medOther: boolean;
  setMedOther: (v: boolean) => void;
  medNone: boolean;
  setMedNone: (v: boolean) => void;
  medNotes: string;
  setMedNotes: (v: string) => void;

  dentExtraction: boolean;
  setDentExtraction: (v: boolean) => void;
  dentOrtho: boolean;
  setDentOrtho: (v: boolean) => void;
  dentTrauma: boolean;
  setDentTrauma: (v: boolean) => void;
  dentRestoration: boolean;
  setDentRestoration: (v: boolean) => void;
  dentNotes: string;
  setDentNotes: (v: string) => void;

  habThumb: boolean;
  setHabThumb: (v: boolean) => void;
  habMouth: boolean;
  setHabMouth: (v: boolean) => void;
  habTongue: boolean;
  setHabTongue: (v: boolean) => void;
  habLip: boolean;
  setHabLip: (v: boolean) => void;
  habBruxism: boolean;
  setHabBruxism: (v: boolean) => void;
  habNone: boolean;
  setHabNone: (v: boolean) => void;
  habNotes: string;
  setHabNotes: (v: string) => void;
}

const NAME_PRESETS = [
  'Ananya Deshmukh',
  'Rahul Sharma',
  'Priya Patel',
  'Aarav Mehta',
  'Sneha Iyer',
  'Arjun Reddy',
  'Ishita Kapoor',
  'Vikram Singh',
  'Neha Joshi',
  'Kabir Khan',
  'Demo Patient A',
  'Demo Patient B',
];

export const TabHistory: React.FC<TabHistoryProps> = (props) => {
  const ccPrimaryValue = [
    props.ccIrregular && 'Irregular / Crooked Teeth',
    props.ccProtruding && 'Forward / Protruding Teeth',
    props.ccSpacing && 'Gaps / Spacing',
    props.ccMissing && 'Missing Teeth',
    props.ccJaw && 'Jaw Problem / Asymmetry',
    props.ccFacial && 'Facial Aesthetics Concern',
  ]
    .filter(Boolean)
    .join(', ');

  const setCcPrimaryValue = (value: string) => {
    const selected = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    props.setCcIrregular(selected.includes('Irregular / Crooked Teeth'));
    props.setCcProtruding(selected.includes('Forward / Protruding Teeth'));
    props.setCcSpacing(selected.includes('Gaps / Spacing'));
    props.setCcMissing(selected.includes('Missing Teeth'));
    props.setCcJaw(selected.includes('Jaw Problem / Asymmetry'));
    props.setCcFacial(selected.includes('Facial Aesthetics Concern'));
  };

  const medConditionsValue = [
    props.medNone && 'No significant history',
    props.medDiabetes && 'Diabetes',
    props.medHypertension && 'Hypertension',
    props.medAsthma && 'Asthma',
    props.medAllergy && 'Allergies',
    props.medBleeding && 'Bleeding disorder',
    props.medOther && 'Other',
  ]
    .filter(Boolean)
    .join(', ');

  const setMedConditionsValue = (value: string) => {
    const selected = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    props.setMedNone(selected.includes('No significant history'));
    props.setMedDiabetes(selected.includes('Diabetes'));
    props.setMedHypertension(selected.includes('Hypertension'));
    props.setMedAsthma(selected.includes('Asthma'));
    props.setMedAllergy(selected.includes('Allergies'));
    props.setMedBleeding(selected.includes('Bleeding disorder'));
    props.setMedOther(selected.includes('Other'));
  };

  const dentConditionsValue = [
    props.dentExtraction && 'Previous extractions',
    props.dentOrtho && 'Previous orthodontic treatment',
    props.dentTrauma && 'Dental trauma',
    props.dentRestoration && 'Restorations / crowns',
  ]
    .filter(Boolean)
    .join(', ');

  const setDentConditionsValue = (value: string) => {
    const selected = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    props.setDentExtraction(selected.includes('Previous extractions'));
    props.setDentOrtho(selected.includes('Previous orthodontic treatment'));
    props.setDentTrauma(selected.includes('Dental trauma'));
    props.setDentRestoration(selected.includes('Restorations / crowns'));
  };

  const habConditionsValue = [
    props.habNone && 'No deleterious habits',
    props.habThumb && 'Thumb / digit sucking',
    props.habMouth && 'Mouth breathing',
    props.habTongue && 'Tongue thrusting',
    props.habLip && 'Lip biting / sucking',
    props.habBruxism && 'Bruxism',
  ]
    .filter(Boolean)
    .join(', ');

  const setHabConditionsValue = (value: string) => {
    const selected = value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    props.setHabNone(selected.includes('No deleterious habits'));
    props.setHabThumb(selected.includes('Thumb / digit sucking'));
    props.setHabMouth(selected.includes('Mouth breathing'));
    props.setHabTongue(selected.includes('Tongue thrusting'));
    props.setHabLip(selected.includes('Lip biting / sucking'));
    props.setHabBruxism(selected.includes('Bruxism'));
  };

  return (
    <div className="space-y-4 pb-2">
      {/* 1. Demographics — all selectable */}
      <section className={CARD}>
        <h3 className={SECTION_TITLE}>
          <User className="w-4 h-4 text-teal-600 shrink-0" />
          Patient Demographics
        </h3>

        <div className="space-y-3.5">
          <TextFieldWithSuggestions
            label="Patient Full Name *"
            value={props.name}
            onChange={props.setName}
            suggestions={NAME_PRESETS}
            placeholder="Type patient name or tap suggestion…"
            required
          />

          <div>
            <label className={LABEL}>Patient ID / Case No</label>
            <input
              type="text"
              value={props.patientId}
              onChange={(e) => props.setPatientId(e.target.value)}
              placeholder="e.g. ORTHO-2026-001"
              className={`${FIELD} font-mono`}
            />
            <p className="mt-1 text-xs text-slate-500">Auto-filled for new cases — edit if needed</p>
          </div>

          <SelectField
            label="Age (years)"
            value={props.age === '' ? '' : props.age}
            onChange={(v) => props.setAge(Number(v))}
            options={AGE_OPTIONS}
            placeholder="Tap to select age…"
          />

          <SelectField
            label="Gender"
            value={props.gender}
            onChange={(v) => props.setGender(v as Gender)}
            options={['Female', 'Male', 'Other']}
            placeholder="Tap to select gender…"
          />

          <div>
            <label className={LABEL}>Contact Phone</label>
            <input
              type="tel"
              value={props.contact}
              onChange={(e) => props.setContact(e.target.value)}
              placeholder="+91 98765 43210"
              className={FIELD}
              inputMode="tel"
              autoComplete="tel"
            />
          </div>

          <div>
            <label className={LABEL}>Address</label>
            <textarea
              rows={2}
              value={props.address}
              onChange={(e) => props.setAddress(e.target.value)}
              placeholder="Street, city, state, PIN…"
              className={`${FIELD} min-h-[4.5rem] resize-y`}
              autoComplete="street-address"
            />
          </div>
        </div>
      </section>

      {/* 2. Prenatal & Post-Natal */}
      <section className={CARD}>
        <h3 className={SECTION_TITLE}>
          <HeartPulse className="w-4 h-4 text-teal-600 shrink-0" />
          Prenatal & Post-Natal History
        </h3>

        <div className="space-y-3.5">
          <SelectField
            label="Informer"
            value={props.informer}
            onChange={props.setInformer}
            options={INFORMER_OPTIONS}
          />

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className={SUBHEAD}>Prenatal</p>
            <SelectField
              label="Mother's Pregnancy Condition"
              value={props.prenatalMotherCondition}
              onChange={props.setPrenatalMotherCondition}
              options={PREGNANCY_OPTIONS}
            />
            <SelectField
              label="Type of Delivery"
              value={props.deliveryType}
              onChange={props.setDeliveryType}
              options={DELIVERY_OPTIONS}
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100">
            <p className={SUBHEAD}>Postnatal</p>
            <SelectField
              label="Infant Feeding"
              value={props.postnatalFeeding}
              onChange={props.setPostnatalFeeding}
              options={FEEDING_OPTIONS}
            />
            <SelectField
              label="Developmental Milestones"
              value={props.postnatalMilestones}
              onChange={props.setPostnatalMilestones}
              options={MILESTONE_OPTIONS}
            />
          </div>

          <div className="pt-2 border-t border-slate-100">
            <MultiSelectField
              label="Childhood Diseases (select multiple)"
              value={props.childhoodDiseases}
              onChange={props.setChildhoodDiseases}
              options={CHILDHOOD_DISEASE_OPTIONS}
              exclusiveOption="None / No Childhood Illnesses"
            />
          </div>
        </div>
      </section>

      {/* 3. Social & Behavioral */}
      <section className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
          Social & Behavioral History
        </h3>

        <div className="space-y-3.5">
          <SelectField
            label="Motivation for Treatment"
            value={props.motivation}
            onChange={(v) => props.setMotivation(v as TreatmentMotivation)}
            options={['Internal', 'External', 'Combination']}
            placeholder="Tap to select motivation…"
          />

          <SelectField
            label="Attitude Towards Treatment"
            value={props.attitude}
            onChange={(v) => props.setAttitude(v as TreatmentAttitude)}
            options={['Enthusiastic', 'Interested', 'Neutral', 'Reluctant', 'Negative']}
          />

          <MultiSelectField
            label="Behavioral History"
            value={props.behavioralHistory}
            onChange={props.setBehavioralHistory}
            options={BEHAVIORAL_OPTIONS}
            exclusiveOption="No significant behavioral notes"
          />

          <MultiSelectField
            label="Social History"
            value={props.socialHistory}
            onChange={props.setSocialHistory}
            options={SOCIAL_OPTIONS}
            exclusiveOption="No significant social notes"
          />

          <MultiSelectField
            label="Other Pertinent Notes"
            value={props.otherPertinentInfo}
            onChange={props.setOtherPertinentInfo}
            options={OTHER_PERTINENT_OPTIONS}
            exclusiveOption="None"
          />
        </div>
      </section>

      {/* 4. Chief Complaint */}
      <section className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Stethoscope className="w-4 h-4 text-teal-600 shrink-0" />
          Chief Complaint
        </h3>

        <div className="space-y-3.5">
          <MultiSelectField
            label="Primary Complaints"
            value={ccPrimaryValue}
            onChange={setCcPrimaryValue}
            options={CC_PRIMARY_OPTIONS}
            placeholder="Tap to select complaints…"
          />

          <SelectField
            label="Other Complaint"
            value={props.ccOtherText || 'None'}
            onChange={(v) => props.setCcOtherText(v === 'None' ? '' : v)}
            options={CC_OTHER_OPTIONS}
          />

          <DurationField value={props.ccDuration} onChange={props.setCcDuration} />

          <MultiSelectField
            label="Complaint Notes"
            value={props.ccNotes}
            onChange={props.setCcNotes}
            options={CC_NOTES_OPTIONS}
            exclusiveOption="No additional wording recorded"
          />
        </div>
      </section>

      {/* 5. Medical */}
      <section className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Activity className="w-4 h-4 text-teal-600 shrink-0" />
          Medical History
        </h3>

        <MultiSelectField
          label="Medical History Conditions"
          value={medConditionsValue}
          onChange={setMedConditionsValue}
          options={MED_CONDITION_OPTIONS}
          exclusiveOption="No significant history"
          placeholder="Tap to select conditions…"
        />

        <MultiSelectField
          label="Medical Notes"
          value={props.medNotes}
          onChange={props.setMedNotes}
          options={MED_NOTES_OPTIONS}
          exclusiveOption="No additional medical notes"
        />
      </section>

      {/* 6. Dental */}
      <section className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Smile className="w-4 h-4 text-teal-600 shrink-0" />
          Dental History
        </h3>

        <MultiSelectField
          label="Dental History Conditions"
          value={dentConditionsValue}
          onChange={setDentConditionsValue}
          options={DENT_CONDITION_OPTIONS}
          placeholder="Tap to select conditions…"
        />

        <MultiSelectField
          label="Dental Notes"
          value={props.dentNotes}
          onChange={props.setDentNotes}
          options={DENT_NOTES_OPTIONS}
          exclusiveOption="No additional dental notes"
        />
      </section>

      {/* 7. Habits */}
      <section className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Activity className="w-4 h-4 text-teal-600 shrink-0" />
          Habit History
        </h3>

        <MultiSelectField
          label="Habit History Conditions"
          value={habConditionsValue}
          onChange={setHabConditionsValue}
          options={HAB_CONDITION_OPTIONS}
          exclusiveOption="No deleterious habits"
          placeholder="Tap to select habits…"
        />

        <MultiSelectField
          label="Habit Notes"
          value={props.habNotes}
          onChange={props.setHabNotes}
          options={HAB_NOTES_OPTIONS}
          exclusiveOption="No additional habit notes"
        />
      </section>
    </div>
  );
};

export default React.memo(TabHistory);
