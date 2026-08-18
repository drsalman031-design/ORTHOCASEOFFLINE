import React, { useState } from 'react';
import {
  MolarCanineClass,
  IncisorRelation,
  OverallPeriodontalStatus,
  FrenalAttachment,
  ArchShape,
  FacialSymmetry,
  IntraoralPhotos,
} from '../../types';
import { Stethoscope, Layers, Box, ChevronDown } from 'lucide-react';
import { SelectField } from './SelectField';
import { IntraoralPhotoGallery } from './IntraoralPhotoGallery';

const CARD = 'bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4';
const SECTION_TITLE =
  'text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2.5';
const STACK = 'space-y-3.5';

function withCustomOption(options: readonly string[], current: string) {
  return current && !options.includes(current) ? [...options, current] : options;
}

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

function buildNumericOptions(
  min: number,
  max: number,
  step: number,
  unit: string,
  presets: { label: string; val: number }[] = []
) {
  const options: { value: string; label: string }[] = [];
  for (let i = min; i <= max; i += step) {
    const valRounded = Math.round(i * 10) / 10;
    const preset = presets.find((p) => p.val === valRounded);
    options.push({
      value: String(valRounded),
      label: `${valRounded > 0 ? '+' : ''}${valRounded} ${unit}${
        preset ? ` (${preset.label})` : ''
      }`,
    });
  }
  return options;
}

interface TabIntraoralProps {
  tongueSize: string;
  setTongueSize: (v: string) => void;
  tonguePosture: string;
  setTonguePosture: (v: string) => void;
  periodontalStatus: string;
  setPeriodontalStatus: (v: string) => void;
  brushingHabit: string;
  setBrushingHabit: (v: string) => void;
  overallPeriodontal: OverallPeriodontalStatus;
  setOverallPeriodontal: (v: OverallPeriodontalStatus) => void;
  frenalAttachments: FrenalAttachment;
  setFrenalAttachments: (v: FrenalAttachment) => void;
  oralMucosa: string;
  setOralMucosa: (v: string) => void;

  teethPresent: string;
  setTeethPresent: (v: string) => void;
  deciduousTeeth: string;
  setDeciduousTeeth: (v: string) => void;

  cariesTeeth: string;
  setCariesTeeth: (v: string) => void;
  missingTeeth: string;
  setMissingTeeth: (v: string) => void;
  supernumeraryTeeth: string;
  setSupernumeraryTeeth: (v: string) => void;
  impactedTeeth: string;
  setImpactedTeeth: (v: string) => void;
  toothColourTexture: string;
  setToothColourTexture: (v: string) => void;
  toothShapeSizeForm: string;
  setToothShapeSizeForm: (v: string) => void;
  localizedAbnormalities: string;
  setLocalizedAbnormalities: (v: string) => void;

  incisorRelation: IncisorRelation;
  setIncisorRelation: (v: IncisorRelation) => void;
  canineRelationRight: MolarCanineClass;
  setCanineRelationRight: (v: MolarCanineClass) => void;
  canineRelationLeft: MolarCanineClass;
  setCanineRelationLeft: (v: MolarCanineClass) => void;
  buccalOcclusionRight: MolarCanineClass;
  setBuccalOcclusionRight: (v: MolarCanineClass) => void;
  buccalOcclusionLeft: MolarCanineClass;
  setBuccalOcclusionLeft: (v: MolarCanineClass) => void;

  curveOfSpeeMm: number | '';
  setCurveOfSpeeMm: (v: number | '') => void;
  overjetMm: number | '';
  setOverjetMm: (v: number | '') => void;
  overbiteMm: number | '';
  setOverbiteMm: (v: number | '') => void;
  crossbite: string;
  setCrossbite: (v: string) => void;
  displacements: string;
  setDisplacements: (v: string) => void;

  archFormUpper: ArchShape;
  setArchFormUpper: (v: ArchShape) => void;
  archFormLower: ArchShape;
  setArchFormLower: (v: ArchShape) => void;
  archInadequacies: string;
  setArchInadequacies: (v: string) => void;
  archSymmetry: FacialSymmetry;
  setArchSymmetry: (v: FacialSymmetry) => void;
  midlineUpper: string;
  setMidlineUpper: (v: string) => void;
  midlineLower: string;
  setMidlineLower: (v: string) => void;
  midlineTogether: string;
  setMidlineTogether: (v: string) => void;
  intraoralPhotos?: IntraoralPhotos;
  setIntraoralPhotos?: React.Dispatch<React.SetStateAction<IntraoralPhotos>>;
}

// FDI Teeth Definitions
const Q1_TEETH = ['18', '17', '16', '15', '14', '13', '12', '11'];
const Q2_TEETH = ['21', '22', '23', '24', '25', '26', '27', '28'];
const Q4_TEETH = ['48', '47', '46', '45', '44', '43', '42', '41'];
const Q3_TEETH = ['31', '32', '33', '34', '35', '36', '37', '38'];

const DECIDUOUS_Q1 = ['55', '54', '53', '52', '51'];
const DECIDUOUS_Q2 = ['61', '62', '63', '64', '65'];
const DECIDUOUS_Q4 = ['85', '84', '83', '82', '81'];
const DECIDUOUS_Q3 = ['71', '72', '73', '74', '75'];

type ToothChartLayout = {
  upperRight: string[];
  upperLeft: string[];
  lowerRight: string[];
  lowerLeft: string[];
  upperLabel: string;
  lowerLabel: string;
};

const PERMANENT_CHART: ToothChartLayout = {
  upperRight: [...Q1_TEETH].reverse(),
  upperLeft: Q2_TEETH,
  lowerRight: [...Q4_TEETH].reverse(),
  lowerLeft: Q3_TEETH,
  upperLabel: 'Maxillary permanent (18 – 28)',
  lowerLabel: 'Mandibular permanent (48 – 38)',
};

const DECIDUOUS_CHART: ToothChartLayout = {
  upperRight: DECIDUOUS_Q1,
  upperLeft: DECIDUOUS_Q2,
  lowerRight: DECIDUOUS_Q4,
  lowerLeft: DECIDUOUS_Q3,
  upperLabel: 'Maxillary deciduous (55 – 65)',
  lowerLabel: 'Mandibular deciduous (85 – 75)',
};

// Helper to parse comma-separated or legacy preset tooth strings
function parseTeethString(str: string): string[] {
  if (!str || str.toLowerCase() === 'none') return [];
  const fdiMatches = str.match(/\b([1-4][1-8]|[5-8][1-5])\b/g);
  if (fdiMatches?.length) return [...new Set(fdiMatches)];
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

// Tap-to-select dropdown wrapper
function ClinicalSelectDropdown({
  label,
  value,
  onChange,
  options,
  placeholder = 'Tap to select…',
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={withCustomOption(options, value)}
      placeholder={placeholder}
    />
  );
}

// Numeric measurement dropdown
function ClinicalNumericSelectDropdown({
  label,
  value,
  onChange,
  min = -4,
  max = 12,
  step = 0.5,
  unit = 'mm',
  presets = [],
}: {
  label: string;
  value: number | '';
  onChange: (val: number | '') => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  presets?: { label: string; val: number }[];
}) {
  const options = buildNumericOptions(min, max, step, unit, presets);
  return (
    <SelectField
      label={label}
      value={value === '' ? '' : String(value)}
      onChange={(v) => onChange(v === '' ? '' : Number(v))}
      options={withCustomNumericOption(options, value)}
      placeholder="Tap to select measurement…"
    />
  );
}

// FDI tooth chart picker (chart-only entry)
const ToothChartPicker: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  layout?: ToothChartLayout;
  showCount?: boolean;
}> = ({ label, value, onChange, layout = PERMANENT_CHART, showCount = false }) => {
  const [chartOpen, setChartOpen] = useState(false);
  const selectedTeeth = parseTeethString(value);

  const toggleTooth = (tooth: string) => {
    let updated: string[];
    if (selectedTeeth.includes(tooth)) {
      updated = selectedTeeth.filter((t) => t !== tooth);
    } else {
      updated = [...selectedTeeth, tooth];
    }
    if (updated.length === 0) {
      onChange('None');
    } else {
      onChange(updated.join(', '));
    }
  };

  const renderToothRow = (teeth: string[]) => (
    <div className="flex flex-wrap justify-center gap-1.5">
      {teeth.map((tooth) => {
        const isSelected = selectedTeeth.includes(tooth);
        return (
          <button
            key={tooth}
            type="button"
            onClick={() => toggleTooth(tooth)}
            className={`min-w-[2rem] h-8 px-1 text-[11px] font-bold font-mono rounded-lg border transition-all ${
              isSelected
                ? 'bg-teal-600 text-white border-teal-700 shadow-2xs'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-teal-50'
            }`}
          >
            {tooth}
          </button>
        );
      })}
    </div>
  );

  const hasSelection = Boolean(value && value.toLowerCase() !== 'none');
  const collapsedSummary = showCount && hasSelection
    ? `${selectedTeeth.length} teeth present`
    : hasSelection
      ? value
      : 'None selected';

  return (
    <div>
      <label className="block text-slate-900 font-bold text-sm mb-1.5">{label}</label>
      <button
        type="button"
        onClick={() => setChartOpen((open) => !open)}
        className="w-full flex items-center justify-between gap-3 min-h-11 px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-800 active:bg-slate-50"
        aria-expanded={chartOpen}
        aria-label={`${label}: ${collapsedSummary}. ${chartOpen ? 'Close' : 'Open'} FDI chart`}
      >
        <span
          className={`truncate text-left text-xs sm:text-sm ${
            hasSelection && !showCount ? 'font-mono text-slate-800' : 'text-slate-800'
          } ${!hasSelection ? 'text-slate-500' : ''}`}
        >
          {collapsedSummary}
        </span>
        <span className="shrink-0 flex items-center gap-1 text-xs font-semibold text-teal-700">
          FDI chart
          <ChevronDown
            className={`w-4 h-4 transition-transform ${chartOpen ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      {chartOpen && (
        <div className="mt-1.5 bg-slate-50 p-3 rounded-xl border border-teal-200 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wide">
              Tap teeth to select
            </div>
            <button
              type="button"
              onClick={() => setChartOpen(false)}
              className="text-[11px] font-semibold text-teal-700 hover:text-teal-900"
            >
              Done
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center">
              {layout.upperLabel}
            </div>
            {renderToothRow(layout.upperRight)}
            {renderToothRow(layout.upperLeft)}
          </div>

          <div className="border-t border-slate-200" />

          <div className="space-y-1.5">
            {renderToothRow(layout.lowerRight)}
            {renderToothRow(layout.lowerLeft)}
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide text-center">
              {layout.lowerLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const TabIntraoral: React.FC<TabIntraoralProps> = (props) => {
  return (
    <div className="space-y-6">
      {/* 0. Intraoral Photographic Records (5-View Series) */}
      <IntraoralPhotoGallery
        intraoralPhotos={props.intraoralPhotos}
        setIntraoralPhotos={props.setIntraoralPhotos}
      />

      {/* 1. Soft Tissue Examination */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Stethoscope className="w-4 h-4 text-teal-600" />
          Soft Tissue Examination
        </h3>

        <div className={STACK}>
          <ClinicalSelectDropdown
            label="Overall Gingival & Periodontal Status"
            value={props.overallPeriodontal}
            onChange={(v) => props.setOverallPeriodontal(v as OverallPeriodontalStatus)}
            options={[
              'Good',
              'Average',
              'Poor',
              'Compromised',
              'Gingivitis Present',
              'Generalized Periodontitis',
              'Localized Recession',
              'Gingival Enlargement',
            ]}
          />

          <ClinicalSelectDropdown
            label="Frenal Attachments"
            value={props.frenalAttachments}
            onChange={(v) => props.setFrenalAttachments(v as FrenalAttachment)}
            options={[
              'Normal',
              'High Labial Attachment',
              'High Lingual Attachment (Ankyloglossia)',
              'Prominent Papilla-Penetrating',
              'Low Attachment',
            ]}
          />

          <ClinicalSelectDropdown
            label="Tongue Size"
            value={props.tongueSize}
            onChange={props.setTongueSize}
            options={[
              'Normal',
              'Macroglossia',
              'Microglossia',
              'Relative Macroglossia',
              'Indented Lateral Borders',
            ]}
          />

          <ClinicalSelectDropdown
            label="Tongue Posture / Position"
            value={props.tonguePosture}
            onChange={props.setTonguePosture}
            options={[
              'Normal resting posture',
              'Low resting position',
              'Anterior tongue thrust',
              'Lateral tongue thrust',
              'High posterior position',
            ]}
          />

          <ClinicalSelectDropdown
            label="Brushing Habit"
            value={props.brushingHabit}
            onChange={props.setBrushingHabit}
            options={[
              'Twice daily',
              'Once daily',
              'Modified Stillman technique',
              'Horizontal scrubbing',
              'Electric toothbrush',
              'Orthodontic toothbrush + interdental',
              'Irregular',
            ]}
          />

          <ClinicalSelectDropdown
            label="Oral Mucosa"
            value={props.oralMucosa}
            onChange={props.setOralMucosa}
            options={[
              'Healthy pink',
              'Mild erythema',
              'Frictional keratosis',
              'Traumatic ulceration',
              'Melanin pigmentation',
              'Aphthous stomatitis',
            ]}
          />
        </div>
      </div>

      {/* 2. Hard Tissue & Dental Charting */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Layers className="w-4 h-4 text-teal-600" />
          Hard Tissue & Dental Charting
        </h3>

        <div className={STACK}>
          <ToothChartPicker
            label="Number of Teeth Present"
            value={props.teethPresent}
            onChange={props.setTeethPresent}
            showCount
          />

          <ToothChartPicker
            label="Deciduous Teeth"
            value={props.deciduousTeeth}
            onChange={props.setDeciduousTeeth}
            layout={DECIDUOUS_CHART}
          />

          <ToothChartPicker
            label="Caries Teeth"
            value={props.cariesTeeth}
            onChange={props.setCariesTeeth}
          />

          <ToothChartPicker
            label="Missing Teeth"
            value={props.missingTeeth}
            onChange={props.setMissingTeeth}
          />

          <ToothChartPicker
            label="Supernumerary Teeth"
            value={props.supernumeraryTeeth}
            onChange={props.setSupernumeraryTeeth}
          />

          <ToothChartPicker
            label="Impacted Teeth"
            value={props.impactedTeeth}
            onChange={props.setImpactedTeeth}
          />

          <ClinicalSelectDropdown
            label="Tooth Colour & Texture"
            value={props.toothColourTexture}
            onChange={props.setToothColourTexture}
            options={[
              'Normal shade A2',
              'Light shade A1/B1',
              'Darker shade A3/A3.5',
              'Mild Fluorosis (White Flecks)',
              'Moderate Fluorosis',
              'Tetracycline Staining',
              'Enamel Hypoplasia',
              'Decalcification / White Spot Lesions',
            ]}
          />

          <ClinicalSelectDropdown
            label="Tooth Shape / Size / Form"
            value={props.toothShapeSizeForm}
            onChange={props.setToothShapeSizeForm}
            options={[
              'Normal anatomical form',
              'Peg lateral 12',
              'Peg lateral 22',
              'Bilateral peg laterals (12, 22)',
              'Microdontia',
              'Macrodontia',
              'Mamelons present',
              'Severe attrition',
            ]}
          />

          <ClinicalSelectDropdown
            label="Localized Abnormalities"
            value={props.localizedAbnormalities}
            onChange={props.setLocalizedAbnormalities}
            options={[
              'None',
              'Enamel Pearl',
              'Talon Cusp',
              'Transposition (13/14)',
              'Transposition (23/24)',
              'Rotation 11/21',
              'Ectopic Eruption 16/26',
              'Dilacerated Root',
            ]}
          />
        </div>
      </div>

      {/* 3. Occlusal Features & Arch Relationships */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Box className="w-4 h-4 text-teal-600" />
          Occlusal Features & Arch Relationships
        </h3>

        <div className={STACK}>
          <ClinicalSelectDropdown
            label="Incisor Relation"
            value={props.incisorRelation}
            onChange={(v) => props.setIncisorRelation(v as IncisorRelation)}
            options={['Class I', 'Class II', 'Class III', 'Open bite', 'Deep bite', 'Edge to edge']}
          />

          <ClinicalSelectDropdown
            label="Canine Relation (Right)"
            value={props.canineRelationRight}
            onChange={(v) => props.setCanineRelationRight(v as MolarCanineClass)}
            options={['Class I', 'Class II (Full)', 'Class II (End-on)', 'Class III (Full)', 'Class III (Half-unit)']}
          />

          <ClinicalSelectDropdown
            label="Canine Relation (Left)"
            value={props.canineRelationLeft}
            onChange={(v) => props.setCanineRelationLeft(v as MolarCanineClass)}
            options={['Class I', 'Class II (Full)', 'Class II (End-on)', 'Class III (Full)', 'Class III (Half-unit)']}
          />

          <ClinicalSelectDropdown
            label="Buccal Occlusion / Molar (Right)"
            value={props.buccalOcclusionRight}
            onChange={(v) => props.setBuccalOcclusionRight(v as MolarCanineClass)}
            options={['Class I', 'Class II (Full)', 'Class II (End-on)', 'Class III (Full)', 'Class III (Half-unit)']}
          />

          <ClinicalSelectDropdown
            label="Buccal Occlusion / Molar (Left)"
            value={props.buccalOcclusionLeft}
            onChange={(v) => props.setBuccalOcclusionLeft(v as MolarCanineClass)}
            options={['Class I', 'Class II (Full)', 'Class II (End-on)', 'Class III (Full)', 'Class III (Half-unit)']}
          />

          <ClinicalSelectDropdown
            label="Crossbites"
            value={props.crossbite}
            onChange={props.setCrossbite}
            options={[
              'None',
              'Anterior Crossbite (11, 21)',
              'Single Tooth Crossbite (12)',
              'Bilateral Posterior Crossbite',
              'Unilateral Right Posterior Crossbite',
              'Unilateral Left Posterior Crossbite',
              'Scissor Bite (Brodie)',
            ]}
          />

          <ClinicalSelectDropdown
            label="Displacements / Crowding / Spacing"
            value={props.displacements}
            onChange={props.setDisplacements}
            options={[
              'Well aligned',
              'Mild anterior crowding (1-3mm)',
              'Moderate crowding (4-7mm)',
              'Severe crowding (>8mm)',
              'Generalized spacing',
              'Midline diastema (1-2mm)',
            ]}
          />

          <ClinicalSelectDropdown
            label="Upper Arch Form"
            value={props.archFormUpper}
            onChange={(v) => props.setArchFormUpper(v as ArchShape)}
            options={['U-shaped', 'V-shaped', 'Square-shaped']}
          />

          <ClinicalSelectDropdown
            label="Lower Arch Form"
            value={props.archFormLower}
            onChange={(v) => props.setArchFormLower(v as ArchShape)}
            options={['U-shaped', 'V-shaped', 'Square-shaped']}
          />

          <ClinicalSelectDropdown
            label="Arch Symmetry"
            value={props.archSymmetry}
            onChange={(v) => props.setArchSymmetry(v as FacialSymmetry)}
            options={['Symmetrical', 'Asymmetrical (Maxillary Left)', 'Asymmetrical (Maxillary Right)', 'Asymmetrical (Mandibular)']}
          />

          <ClinicalSelectDropdown
            label="Maxillary Midline"
            value={props.midlineUpper}
            onChange={props.setMidlineUpper}
            options={['Coincident', 'Deviated Right 1mm', 'Deviated Right 2mm', 'Deviated Left 1mm', 'Deviated Left 2mm']}
          />

          <ClinicalSelectDropdown
            label="Mandibular Midline"
            value={props.midlineLower}
            onChange={props.setMidlineLower}
            options={['Coincident', 'Deviated Right 1mm', 'Deviated Right 2mm', 'Deviated Left 1mm', 'Deviated Left 2mm']}
          />

          <ClinicalNumericSelectDropdown
            label="Overjet (mm)"
            value={props.overjetMm}
            onChange={props.setOverjetMm}
            min={-4}
            max={12}
            step={0.5}
            presets={[
              { label: 'Edge', val: 0 },
              { label: 'Ideal', val: 2 },
              { label: 'Moderate', val: 4 },
              { label: 'Severe', val: 7 },
            ]}
          />

          <ClinicalNumericSelectDropdown
            label="Overbite (mm)"
            value={props.overbiteMm}
            onChange={props.setOverbiteMm}
            min={-4}
            max={10}
            step={0.5}
            presets={[
              { label: 'Open', val: -2 },
              { label: 'Edge', val: 0 },
              { label: 'Ideal', val: 2 },
              { label: 'Deep', val: 4.5 },
            ]}
          />

          <ClinicalNumericSelectDropdown
            label="Curve of Spee (mm)"
            value={props.curveOfSpeeMm}
            onChange={props.setCurveOfSpeeMm}
            min={0}
            max={6}
            step={0.5}
            presets={[
              { label: 'Flat', val: 0 },
              { label: 'Normal', val: 1.5 },
              { label: 'Moderate', val: 2.5 },
              { label: 'Deep', val: 4 },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabIntraoral);

