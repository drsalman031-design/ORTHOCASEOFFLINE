import React from 'react';
import { InvestigationImage } from '../../types';
import { FileText, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { SelectField } from './SelectField';

const CARD = 'bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-4';
const SECTION_TITLE =
  'text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 border-b border-slate-200 pb-2.5';
const STACK = 'space-y-3.5';
const FIELD =
  'w-full min-h-11 px-3 py-2 border border-slate-300 rounded-xl text-sm font-medium bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600';

function withCustomOption(options: readonly string[], current: string) {
  return current && !options.includes(current) ? [...options, current] : options;
}

const SMI_STAGE_OPTIONS = [
  'SMI Stage 1',
  'SMI Stage 2',
  'SMI Stage 3',
  'SMI Stage 4',
  'SMI Stage 5',
  'SMI Stage 6',
  'SMI Stage 7',
  'SMI Stage 8',
  'SMI Stage 9',
  'SMI Stage 10',
  'SMI Stage 11',
];

const CVM_STAGE_OPTIONS = [
  'CS 1 (Initiation)',
  'CS 2 (Acceleration)',
  'CS 3 (Peak velocity)',
  'CS 4 (Deceleration)',
  'CS 5 (Maturation)',
  'CS 6 (Completion)',
];

const PUBERTAL_STATUS_OPTIONS = [
  'Pre-pubertal',
  'Early pubertal',
  'Peak pubertal velocity',
  'Decelerating growth',
  'Post-pubertal / Adult',
];

const OTHER_RAD_OPTIONS = [
  'None',
  'CBCT: impacted canine localization',
  'TMJ tomogram: condylar remodeling',
  'PA skull: no significant asymmetry',
  'Submentovertex: mandibular asymmetry',
];

function RadiographFieldWithUpload({
  label,
  value,
  onChange,
  options,
  placeholder,
  category,
  uploadLabel,
  images,
  onAddImage,
  onRemoveImage,
  showFindings = true,
  replaceExisting = false,
}: {
  label: string;
  value?: string;
  onChange?: (v: string) => void;
  options?: readonly string[];
  placeholder?: string;
  category: InvestigationImage['category'];
  uploadLabel: string;
  images: InvestigationImage[];
  onAddImage: (img: InvestigationImage) => void;
  onRemoveImage: (id: string) => void;
  showFindings?: boolean;
  replaceExisting?: boolean;
}) {
  const categoryImages = images.filter((img) => img.category === category);
  const hasUploadedImage = categoryImages.length > 0;

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = () => {
      if (replaceExisting) {
        categoryImages.forEach((img) => onRemoveImage(img.id));
      }

      onAddImage({
        id: `img-${Date.now()}`,
        category,
        title: file.name.replace(/\.[^/.]+$/, ''),
        dataUrl: reader.result as string,
        uploadedAt: new Date().toISOString(),
      });
    };

    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-2.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      {showFindings ? (
        <SelectField
          label={label}
          value={value ?? ''}
          onChange={onChange ?? (() => {})}
          options={withCustomOption(options ?? [], value ?? '')}
          placeholder={placeholder ?? 'Tap to select…'}
        />
      ) : (
        <p className="text-sm font-bold text-slate-900">{label}</p>
      )}

      <label className="cursor-pointer w-full min-h-10 flex items-center justify-center gap-2 bg-white border border-teal-300 text-teal-800 hover:bg-teal-50 px-3 py-2 rounded-xl text-sm font-semibold transition-colors">
        <Upload className="w-4 h-4" />
        {hasUploadedImage && replaceExisting ? uploadLabel.replace(/^Upload/i, 'Replace') : uploadLabel}
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      </label>

      {hasUploadedImage ? (
        <div className="space-y-2">
          {categoryImages.map((img) => (
            <div
              key={img.id}
              className="relative border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs"
            >
              <img
                src={img.dataUrl}
                alt={img.title}
                className="w-full h-52 sm:h-60 object-contain bg-slate-900/5"
              />
              <button
                type="button"
                onClick={() => onRemoveImage(img.id)}
                className="absolute top-2 right-2 p-2 bg-rose-600 text-white rounded-lg shadow-md hover:bg-rose-700 transition-colors"
                title="Delete image"
                aria-label="Delete image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 p-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-800 truncate">{img.title}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 text-center py-1">No {label.toLowerCase()} image uploaded yet.</p>
      )}
    </div>
  );
}

interface TabRadiographyGrowthProps {
  opgFindings: string;
  setOpgFindings: (v: string) => void;
  lateralCephFindings: string;
  setLateralCephFindings: (v: string) => void;
  otherRadFindings: string;
  setOtherRadFindings: (v: string) => void;

  smiStage: string;
  setSmiStage: (v: string) => void;
  cvmStage: string;
  setCvmStage: (v: string) => void;
  pubertalStatus: string;
  setPubertalStatus: (v: string) => void;

  images: InvestigationImage[];
  onAddImage: (img: InvestigationImage) => void;
  onRemoveImage: (id: string) => void;
}

export const TabRadiographyGrowth: React.FC<TabRadiographyGrowthProps> = (props) => {
  return (
    <div className="space-y-6">
      {/* 1. Growth Status & Prediction */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <FileText className="w-4 h-4 text-teal-600" />
          Growth Status & Biological Age Prediction
        </h3>

        <div className={STACK}>
          <SelectField
            label="Fishman SMI Stage (Skeletal Maturity Index)"
            value={props.smiStage}
            onChange={props.setSmiStage}
            options={withCustomOption(SMI_STAGE_OPTIONS, props.smiStage)}
            placeholder="Tap to select SMI stage…"
          />

          <SelectField
            label="CVM Stage (Cervical Vertebral Maturation)"
            value={props.cvmStage}
            onChange={props.setCvmStage}
            options={withCustomOption(CVM_STAGE_OPTIONS, props.cvmStage)}
            placeholder="Tap to select CVM stage…"
          />

          <SelectField
            label="Pubertal Growth Status"
            value={props.pubertalStatus}
            onChange={props.setPubertalStatus}
            options={withCustomOption(PUBERTAL_STATUS_OPTIONS, props.pubertalStatus)}
            placeholder="Tap to select pubertal status…"
          />
        </div>
      </div>

      {/* 2. Radiographic Findings */}
      <div className={CARD}>
        <h3 className={SECTION_TITLE}>
          <ImageIcon className="w-4 h-4 text-teal-600" />
          Radiographic & Investigation Findings
        </h3>

        <div className={STACK}>
          <RadiographFieldWithUpload
            label="Orthopantomograph (OPG)"
            showFindings={false}
            replaceExisting
            category="OPG"
            uploadLabel="Upload OPG image"
            images={props.images}
            onAddImage={props.onAddImage}
            onRemoveImage={props.onRemoveImage}
          />

          <RadiographFieldWithUpload
            label="Lateral Cephalogram"
            showFindings={false}
            replaceExisting
            category="Lateral Ceph"
            uploadLabel="Upload lateral cephalogram"
            images={props.images}
            onAddImage={props.onAddImage}
            onRemoveImage={props.onRemoveImage}
          />

          <RadiographFieldWithUpload
            label="Hand Wrist Radiograph"
            showFindings={false}
            replaceExisting
            category="Hand Wrist"
            uploadLabel="Upload hand wrist radiograph"
            images={props.images}
            onAddImage={props.onAddImage}
            onRemoveImage={props.onRemoveImage}
          />

          <RadiographFieldWithUpload
            label="Intra-oral Periapical (IOPA / RVG)"
            showFindings={false}
            replaceExisting
            category="IOPA"
            uploadLabel="Upload IOPA / RVG image"
            images={props.images}
            onAddImage={props.onAddImage}
            onRemoveImage={props.onRemoveImage}
          />

          <RadiographFieldWithUpload
            label="Occlusal Radiograph"
            showFindings={false}
            replaceExisting
            category="Occlusal"
            uploadLabel="Upload occlusal radiograph"
            images={props.images}
            onAddImage={props.onAddImage}
            onRemoveImage={props.onRemoveImage}
          />

          <div>
            <label className="block text-slate-900 font-bold text-sm mb-1.5">
              Any Other Radiograph / CBCT
            </label>
            <input
              type="text"
              value={props.otherRadFindings}
              onChange={(e) => props.setOtherRadFindings(e.target.value)}
              list="other-rad-presets"
              placeholder="CBCT, TMJ tomogram, or tap preset…"
              className={FIELD}
            />
            <datalist id="other-rad-presets">
              {OTHER_RAD_OPTIONS.map((opt) => (
                <option key={opt} value={opt} />
              ))}
            </datalist>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabRadiographyGrowth);
