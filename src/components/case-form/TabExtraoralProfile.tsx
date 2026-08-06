import React from 'react';
import {
  BodyType,
  ShapeOfHead,
  FacialForm,
  FacialSymmetry,
  LipPostureTonicity,
  FacialProfile,
  FacialDivergence,
  NasolabialAngleType,
  MentolabialSulcus,
  InvestigationImage,
  ExtraoralPhotos,
  ExtraoralPhotoAnalysis,
} from '../../types';
import { Eye, UserCheck, Smile, Plus, Minus } from 'lucide-react';
import { ExtraoralPhotoAnalyzer } from './ExtraoralPhotoAnalyzer';
import { SelectField } from './SelectField';

const CARD = 'bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4';
const SECTION_TITLE =
  'text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2.5';

const BUILT_OPTIONS = [
  'Average',
  'Well-built',
  'Slender / Asthenic',
  'Heavy / Obese',
  'Athletic / Muscular',
];

const BODY_TYPE_OPTIONS: { value: BodyType; label: string }[] = [
  { value: 'Mesomorph', label: 'Mesomorph (Average / Balanced)' },
  { value: 'Ectomorph', label: 'Ectomorph (Tall / Lean)' },
  { value: 'Endomorph', label: 'Endomorph (Broad / Short)' },
];

const CEPHALIC_INDEX_OPTIONS = [
  'Mesocephalic (76.0 - 80.9)',
  'Brachycephalic (81.0 - 85.4)',
  'Dolichocephalic (< 75.9)',
  'Hyperbrachycephalic (> 85.5)',
  '78.5',
  '82.0',
  '74.0',
];

const SHAPE_OF_HEAD_OPTIONS: { value: ShapeOfHead; label: string }[] = [
  { value: 'Mesocephalic', label: 'Mesocephalic (Average / Oval)' },
  { value: 'Brachycephalic', label: 'Brachycephalic (Short / Broad)' },
  { value: 'Dolichocephalic', label: 'Dolichocephalic (Long / Narrow)' },
];

const FACIAL_INDEX_OPTIONS = [
  'Mesoprosopic (85.0 - 89.9)',
  'Leptoprosopic (90.0 - 94.9)',
  'Europrosopic (80.0 - 84.9)',
  'Hypereuroprosopic (< 79.9)',
  'Hyperleptoprosopic (> 95.0)',
];

const GAIT_OPTIONS = [
  'Normal / Symmetrical',
  'Antalgic Gait',
  'Ataxic Gait',
  'Restricted / Uncoordinated',
];

const FACIAL_FORM_OPTIONS: { value: FacialForm; label: string }[] = [
  { value: 'Mesoprosopic', label: 'Mesoprosopic (Average / Oval)' },
  { value: 'Europrosopic', label: 'Europrosopic (Broad / Square)' },
  { value: 'Leptoprosopic', label: 'Leptoprosopic (Long / Narrow)' },
];

const FACIAL_SYMMETRY_OPTIONS: { value: FacialSymmetry; label: string }[] = [
  { value: 'Symmetrical', label: 'Symmetrical' },
  { value: 'Asymmetrical', label: 'Asymmetrical (Mandibular / Facial)' },
];

const LIP_POSTURE_OPTIONS: { value: LipPostureTonicity; label: string }[] = [
  { value: 'Competent', label: 'Competent' },
  { value: 'Potentially Competent', label: 'Potentially Competent' },
  { value: 'Incompetent', label: 'Incompetent' },
  { value: 'Hypotonic', label: 'Hypotonic Upper Lip' },
  { value: 'Normotonic', label: 'Normotonic' },
  { value: 'Hypertonic', label: 'Hypertonic Mentalis' },
];

const MIDLINE_OPTIONS = [
  'Coincident with Facial Midline',
  'Shifted Right 1 mm',
  'Shifted Right 2 mm',
  'Shifted Right > 2 mm',
  'Shifted Left 1 mm',
  'Shifted Left 2 mm',
  'Shifted Left > 2 mm',
];

const INTERLABIAL_GAP_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8].map((mm) => ({
  value: String(mm),
  label: mm === 0 ? '0 mm (Competent Lip Seal)' : `${mm} mm`,
}));

const INCISOR_STOMION_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6].map((mm) => ({
  value: String(mm),
  label: mm === 2.5 ? '2.5 mm (Ideal Rest Display)' : `${mm} mm`,
}));

function withCustomOption(options: readonly string[], current: string) {
  return current && !options.includes(current) ? [...options, current] : options;
}

const FACIAL_PROFILE_OPTIONS: { value: FacialProfile; label: string }[] = [
  { value: 'Convex', label: 'Convex (Skeletal Class II)' },
  { value: 'Orthognathic or Straight', label: 'Orthognathic or Straight (Class I)' },
  { value: 'Concave', label: 'Concave (Skeletal Class III)' },
];

const FACIAL_DIVERGENCE_OPTIONS: { value: FacialDivergence; label: string }[] = [
  { value: 'Straight', label: 'Straight / Neutral Divergent' },
  { value: 'Anterior', label: 'Anterior Divergent' },
  { value: 'Posterior', label: 'Posterior Divergent' },
];

const NASOLABIAL_ANGLE_OPTIONS: { value: NasolabialAngleType; label: string }[] = [
  { value: 'Acute', label: 'Acute (< 90° - Protrusive Upper Lip)' },
  { value: 'Right Angle', label: 'Right Angle (90° - 110° - Ideal)' },
  { value: 'Obtuse', label: 'Obtuse (> 110° - Retrusive Upper Lip)' },
];

const MENTOLABIAL_SULCUS_OPTIONS: { value: MentolabialSulcus; label: string }[] = [
  { value: 'Normal', label: 'Normal Depth' },
  { value: 'Shallow', label: 'Shallow' },
  { value: 'Deep', label: 'Deep Sulcus (Everted Lower Lip)' },
];

const CLINICAL_FMA_OPTIONS = [
  'Average FMA (25° ± 3°)',
  'High FMA / Hyperdivergent (> 28°)',
  'Low FMA / Hypodivergent (< 22°)',
  'Average Angle',
  'High Growth Angle',
  'Low Growth Angle',
];

const VTO_OPTIONS = [
  'Positive VTO (Favorable Mandibular Response)',
  'Negative VTO (Unfavorable / Mandible Retrusive)',
  'Neutral / Equivocal VTO',
  'Positive',
  'Negative',
];

interface TabExtraoralProfileProps {
  extraoralPhotos?: ExtraoralPhotos;
  setExtraoralPhotos?: React.Dispatch<React.SetStateAction<ExtraoralPhotos>>;
  extraoralPhotoAnalysis?: ExtraoralPhotoAnalysis;
  setExtraoralPhotoAnalysis?: React.Dispatch<React.SetStateAction<ExtraoralPhotoAnalysis>>;
  images?: InvestigationImage[];
  setImages?: React.Dispatch<React.SetStateAction<InvestigationImage[]>>;
  built: string;
  setBuilt: (v: string) => void;
  heightCm: number | '';
  setHeightCm: (v: number | '') => void;
  weightKg: number | '';
  setWeightKg: (v: number | '') => void;
  gait: string;
  setGait: (v: string) => void;
  bodyType: BodyType;
  setBodyType: (v: BodyType) => void;
  facialIndex: string;
  setFacialIndex: (v: string) => void;

  cephalicIndex: string;
  setCephalicIndex: (v: string) => void;
  shapeOfHead: ShapeOfHead;
  setShapeOfHead: (v: ShapeOfHead) => void;

  facialForm: FacialForm;
  setFacialForm: (v: FacialForm) => void;
  symmetry: FacialSymmetry;
  setSymmetry: (v: FacialSymmetry) => void;
  maxillaryMidline: string;
  setMaxillaryMidline: (v: string) => void;
  mandibularMidline: string;
  setMandibularMidline: (v: string) => void;
  lipPostureTonicity: LipPostureTonicity;
  setLipPostureTonicity: (v: LipPostureTonicity) => void;
  interlabialGapMm: number | '';
  setInterlabialGapMm: (v: number | '') => void;
  incisorStomionMm: number | '';
  setIncisorStomionMm: (v: number | '') => void;

  profile: FacialProfile;
  setProfile: (v: FacialProfile) => void;
  facialDivergence: FacialDivergence;
  setFacialDivergence: (v: FacialDivergence) => void;
  nasolabialAngle: NasolabialAngleType;
  setNasolabialAngle: (v: NasolabialAngleType) => void;
  mentolabialSulcus: MentolabialSulcus;
  setMentolabialSulcus: (v: MentolabialSulcus) => void;
  clinicalFma: string;
  setClinicalFma: (v: string) => void;
  vto: string;
  setVto: (v: string) => void;
}

export const TabExtraoralProfile: React.FC<TabExtraoralProfileProps> = (props) => {
  return (
    <div className="space-y-5">
      {/* EXTRA ORAL PHOTO ANALYZER MODULE */}
      <ExtraoralPhotoAnalyzer
        extraoralPhotos={props.extraoralPhotos}
        setExtraoralPhotos={props.setExtraoralPhotos}
        extraoralPhotoAnalysis={props.extraoralPhotoAnalysis}
        setExtraoralPhotoAnalysis={props.setExtraoralPhotoAnalysis}
        vto={props.vto}
        setVto={props.setVto}
        facialForm={props.facialForm}
        setFacialForm={props.setFacialForm}
        symmetry={props.symmetry}
        setSymmetry={props.setSymmetry}
      />
      {/* 1. PHYSICAL STATUS & CRANIAL EXAMINATION */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
          Physical Status & Cranial Examination
        </h3>

        <div className="space-y-3.5">
          <SelectField
            label="Built"
            value={props.built}
            onChange={props.setBuilt}
            options={
              props.built && !BUILT_OPTIONS.includes(props.built)
                ? [...BUILT_OPTIONS, props.built]
                : BUILT_OPTIONS
            }
            placeholder="Tap to select built…"
          />

          <SelectField
            label="Body Type"
            value={props.bodyType}
            onChange={(v) => props.setBodyType(v as BodyType)}
            options={BODY_TYPE_OPTIONS}
            placeholder="Tap to select body type…"
          />

          <SelectField
            label="Cephalic Index"
            value={props.cephalicIndex}
            onChange={props.setCephalicIndex}
            options={
              props.cephalicIndex && !CEPHALIC_INDEX_OPTIONS.includes(props.cephalicIndex)
                ? [...CEPHALIC_INDEX_OPTIONS, props.cephalicIndex]
                : CEPHALIC_INDEX_OPTIONS
            }
            placeholder="Tap to select cephalic index…"
          />

          <SelectField
            label="Shape of Head"
            value={props.shapeOfHead}
            onChange={(v) => props.setShapeOfHead(v as ShapeOfHead)}
            options={SHAPE_OF_HEAD_OPTIONS}
            placeholder="Tap to select shape of head…"
          />

          <SelectField
            label="Facial Index"
            value={props.facialIndex}
            onChange={props.setFacialIndex}
            options={
              props.facialIndex && !FACIAL_INDEX_OPTIONS.includes(props.facialIndex)
                ? [...FACIAL_INDEX_OPTIONS, props.facialIndex]
                : FACIAL_INDEX_OPTIONS
            }
            placeholder="Tap to select facial index…"
          />

          <SelectField
            label="Gait"
            value={props.gait}
            onChange={props.setGait}
            options={
              props.gait && !GAIT_OPTIONS.includes(props.gait)
                ? [...GAIT_OPTIONS, props.gait]
                : GAIT_OPTIONS
            }
            placeholder="Tap to select gait…"
          />

          <div>
            <label className="block text-slate-900 font-bold text-sm mb-1.5">Height (cm)</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  props.setHeightCm(props.heightCm === '' ? 160 : Math.max(100, Number(props.heightCm) - 1))
                }
                className="w-9 h-9 flex items-center justify-center bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={props.heightCm}
                onChange={(e) => props.setHeightCm(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="165"
                className="w-20 text-center px-2 py-2 border border-slate-300 rounded-xl text-slate-900 text-sm font-bold bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
              <button
                type="button"
                onClick={() =>
                  props.setHeightCm(props.heightCm === '' ? 160 : Math.min(220, Number(props.heightCm) + 1))
                }
                className="w-9 h-9 flex items-center justify-center bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-900 font-bold text-sm mb-1.5">Weight (kg)</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  props.setWeightKg(props.weightKg === '' ? 55 : Math.max(20, Number(props.weightKg) - 1))
                }
                className="w-9 h-9 flex items-center justify-center bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={props.weightKg}
                onChange={(e) => props.setWeightKg(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="60"
                className="w-20 text-center px-2 py-2 border border-slate-300 rounded-xl text-slate-900 text-sm font-bold bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
              <button
                type="button"
                onClick={() =>
                  props.setWeightKg(props.weightKg === '' ? 55 : Math.min(150, Number(props.weightKg) + 1))
                }
                className="w-9 h-9 flex items-center justify-center bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. FRONTAL EXAMINATION */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Eye className="w-4 h-4 text-teal-600 shrink-0" />
          Frontal Examination
        </h3>

        <div className="space-y-3.5">
          <SelectField
            label="Facial Form"
            value={props.facialForm}
            onChange={(v) => props.setFacialForm(v as FacialForm)}
            options={FACIAL_FORM_OPTIONS}
            placeholder="Tap to select facial form…"
          />

          <SelectField
            label="Facial Symmetry"
            value={props.symmetry}
            onChange={(v) => props.setSymmetry(v as FacialSymmetry)}
            options={FACIAL_SYMMETRY_OPTIONS}
            placeholder="Tap to select facial symmetry…"
          />

          <SelectField
            label="Lip Posture & Tonicity"
            value={props.lipPostureTonicity}
            onChange={(v) => props.setLipPostureTonicity(v as LipPostureTonicity)}
            options={LIP_POSTURE_OPTIONS}
            placeholder="Tap to select lip posture…"
          />

          <SelectField
            label="Maxillary Midline"
            value={props.maxillaryMidline}
            onChange={props.setMaxillaryMidline}
            options={withCustomOption(MIDLINE_OPTIONS, props.maxillaryMidline)}
            placeholder="Tap to select maxillary midline…"
          />

          <SelectField
            label="Mandibular Midline"
            value={props.mandibularMidline}
            onChange={props.setMandibularMidline}
            options={withCustomOption(MIDLINE_OPTIONS, props.mandibularMidline)}
            placeholder="Tap to select mandibular midline…"
          />

          <SelectField
            label="Inter-labial Gap (mm)"
            value={props.interlabialGapMm === '' ? '' : String(props.interlabialGapMm)}
            onChange={(v) => props.setInterlabialGapMm(v === '' ? '' : Number(v))}
            options={INTERLABIAL_GAP_OPTIONS}
            placeholder="Tap to select gap…"
          />

          <SelectField
            label="Incisor-Stomion (I-stm) (mm)"
            value={props.incisorStomionMm === '' ? '' : String(props.incisorStomionMm)}
            onChange={(v) => props.setIncisorStomionMm(v === '' ? '' : Number(v))}
            options={INCISOR_STOMION_OPTIONS}
            placeholder="Tap to select distance…"
          />
        </div>
      </div>

      {/* 3. PROFILE EXAMINATION */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <Smile className="w-4 h-4 text-teal-600 shrink-0" />
          Profile Examination
        </h3>

        <div className="space-y-3.5">
          <SelectField
            label="Facial Profile"
            value={props.profile}
            onChange={(v) => props.setProfile(v as FacialProfile)}
            options={FACIAL_PROFILE_OPTIONS}
            placeholder="Tap to select facial profile…"
          />

          <SelectField
            label="Facial Divergence"
            value={props.facialDivergence}
            onChange={(v) => props.setFacialDivergence(v as FacialDivergence)}
            options={FACIAL_DIVERGENCE_OPTIONS}
            placeholder="Tap to select divergence…"
          />

          <SelectField
            label="Nasolabial Angle"
            value={props.nasolabialAngle}
            onChange={(v) => props.setNasolabialAngle(v as NasolabialAngleType)}
            options={NASOLABIAL_ANGLE_OPTIONS}
            placeholder="Tap to select nasolabial angle…"
          />

          <SelectField
            label="Mento-labial Sulcus"
            value={props.mentolabialSulcus}
            onChange={(v) => props.setMentolabialSulcus(v as MentolabialSulcus)}
            options={MENTOLABIAL_SULCUS_OPTIONS}
            placeholder="Tap to select mentolabial sulcus…"
          />

          <SelectField
            label="Clinical FMA"
            value={props.clinicalFma}
            onChange={props.setClinicalFma}
            options={withCustomOption(CLINICAL_FMA_OPTIONS, props.clinicalFma)}
            placeholder="Tap to select clinical FMA…"
          />

          <SelectField
            label="VTO (Visual Treatment Objective)"
            value={props.vto}
            onChange={props.setVto}
            options={withCustomOption(VTO_OPTIONS, props.vto)}
            placeholder="Tap to select VTO…"
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabExtraoralProfile);
