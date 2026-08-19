import React, { useState, useRef, useCallback } from 'react';
import {
  Smile,
  Upload,
  Camera,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  Info,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { SmileAssessmentData, ExtraoralPhotos } from '../../types';
import { SelectField } from './SelectField';

interface SmileAssessmentCardProps {
  smileAssessment?: SmileAssessmentData;
  setSmileAssessment?: React.Dispatch<React.SetStateAction<SmileAssessmentData>>;
  extraoralPhotos?: ExtraoralPhotos;
}

// Client-side offline image compressor
const compressImage = (file: File, maxWidth = 1600, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

const MIDLINE_TYPE_OPTIONS = [
  { value: 'Coinciding', label: 'Coinciding with Facial Midline' },
  { value: 'Non-coinciding', label: 'Non-coinciding (Deviated)' },
];

const INCISOR_SMILE_OPTIONS = [
  { value: 'Full crown (100%)', label: 'Full crown display (100% - Ideal)' },
  { value: '3/4 crown (75%)', label: '3/4 crown display (75%)' },
  { value: '1/2 crown (50%)', label: '1/2 crown display (50%)' },
  { value: 'Gingival display (> 100%)', label: 'Gingival display (> 100% - Gummy smile)' },
  { value: 'Inadequate (< 50%)', label: 'Inadequate display (< 50%)' },
];

const BUCCAL_CORRIDOR_OPTIONS = [
  { value: 'Normal', label: 'Normal (Ideal lateral negative space)' },
  { value: 'Increased', label: 'Increased (Wide dark corridors / Narrow maxilla)' },
  { value: 'Restricted', label: 'Restricted / Deficient (Broad arch / Minimal corridor)' },
];

const SMILE_ARC_OPTIONS = [
  { value: 'Consonant', label: 'Consonant (Incisal curve parallel to lower lip)' },
  { value: 'Flat', label: 'Flat (Non-consonant / Straight incisal line)' },
  { value: 'Reversed', label: 'Reversed (Inverted curvature / Canines lower than incisors)' },
];

export const SmileAssessmentCard: React.FC<SmileAssessmentCardProps> = ({
  smileAssessment = {} as SmileAssessmentData,
  setSmileAssessment,
  extraoralPhotos = {} as ExtraoralPhotos,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [compressing, setCompressing] = useState(false);
  const [isOpen, setIsOpen] = useState(true);

  const updateField = useCallback(
    <K extends keyof SmileAssessmentData>(key: K, value: SmileAssessmentData[K]) => {
      if (!setSmileAssessment) return;
      setSmileAssessment((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [setSmileAssessment]
  );

  const handleFileUpload = async (file: File) => {
    try {
      setCompressing(true);
      const compressed = await compressImage(file);
      updateField('photoUrl', compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
    } finally {
      setCompressing(false);
    }
  };

  const currentPhoto =
    smileAssessment.photoUrl ||
    extraoralPhotos.frontal_smile ||
    extraoralPhotos.frontalSmile;

  const handleUseExtraoralSmilePhoto = () => {
    const existing = extraoralPhotos.frontal_smile || extraoralPhotos.frontalSmile;
    if (existing) {
      updateField('photoUrl', existing);
    }
  };

  const isNonCoinciding = smileAssessment.midlineType === 'Non-coinciding';

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all">
      {/* ACCORDION / DROPDOWN HEADER */}
      <div
        onClick={() => setIsOpen((prev) => !prev)}
        className="px-4 py-3.5 flex items-center justify-between cursor-pointer select-none transition-colors hover:bg-slate-50 border-b border-slate-200"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-teal-50 text-teal-600 rounded-lg border border-teal-200/80 shadow-xs shrink-0">
            <Smile className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2 truncate">
              Smile Assessment & Aesthetic Analysis
            </h3>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Macro & micro smile aesthetics, incisor/gingival exposure & smile arc
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-md hidden md:flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-600" />
            Macro & Micro
          </span>
          <button
            type="button"
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label={isOpen ? 'Collapse Smile Assessment' : 'Expand Smile Assessment'}
          >
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-600" />
            )}
          </button>
        </div>
      </div>

      {/* ACCORDION CONTENT BODY */}
      {isOpen && (
        <div className="p-4 space-y-4">
        
        {/* 1. FRONTAL SMILE PHOTOGRAPH UPLOAD BOX */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            Frontal Smile Photograph:
          </label>

          <div className="relative border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50 transition-all hover:border-teal-500 flex flex-col items-center justify-center min-h-[220px]">
            {currentPhoto ? (
              <div className="relative w-full h-[240px] bg-slate-950 flex items-center justify-center group">
                <img
                  src={currentPhoto}
                  alt="Frontal Smile Assessment"
                  className="max-w-full max-h-full object-contain"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-xl bg-white/90 text-slate-800 hover:bg-white text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Replace</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField('photoUrl', undefined)}
                    className="p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-600 text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-xs">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Upload Frontal Smile Photo</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">JPEG or PNG • Automatic offline compression</p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={compressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Select Photo</span>
                  </button>
                  {(extraoralPhotos.frontal_smile || extraoralPhotos.frontalSmile) && (
                    <button
                      type="button"
                      onClick={handleUseExtraoralSmilePhoto}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 cursor-pointer flex items-center gap-1.5"
                      title="Import photo from Extraoral series"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                      <span>Use Extraoral Smile</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />
          </div>

          <p className="text-[11px] text-slate-500 flex items-center gap-1.5 px-1">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            Photo is rendered alongside summary metrics in the exported PDF presentation slide.
          </p>
        </div>

        {/* 2. SKELETAL VS DENTAL MIDLINE */}
        <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <SelectField
            label="Skeletal vs. Dental Midline"
            value={smileAssessment.midlineType || 'Coinciding'}
            onChange={(v) => updateField('midlineType', v)}
            options={MIDLINE_TYPE_OPTIONS}
            placeholder="Select midline relation…"
          />

          {isNonCoinciding && (
            <div className="space-y-3 pt-2 border-t border-slate-200 animate-in fade-in">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Midline Deviation (mm)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(smileAssessment.midlineDeviationMm) || 0;
                      updateField('midlineDeviationMm', Math.max(0, cur - 0.5));
                    }}
                    className="w-9 h-9 flex items-center justify-center bg-white active:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={smileAssessment.midlineDeviationMm ?? ''}
                    onChange={(e) =>
                      updateField(
                        'midlineDeviationMm',
                        e.target.value === '' ? '' : Number(e.target.value)
                      )
                    }
                    placeholder="1.5"
                    className="w-24 text-center py-2 px-3 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const cur = Number(smileAssessment.midlineDeviationMm) || 0;
                      updateField('midlineDeviationMm', cur + 0.5);
                    }}
                    className="w-9 h-9 flex items-center justify-center bg-white active:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Deviation Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Right', 'Left'].map((dir) => {
                    const selected = (smileAssessment.midlineDeviationDirection || 'Right') === dir;
                    return (
                      <button
                        key={dir}
                        type="button"
                        onClick={() => updateField('midlineDeviationDirection', dir as 'Right' | 'Left')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          selected
                            ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        Shifted {dir}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. AMOUNT OF INCISOR EXPOSURE AT REST (MM) */}
        <div className="space-y-1.5">
          <label className="block text-slate-900 font-bold text-sm">
            Amount of Incisor Exposure at Rest (mm)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const cur = Number(smileAssessment.incisorExposureRestMm) || 2.5;
                updateField('incisorExposureRestMm', Math.max(0, cur - 0.5));
              }}
              className="w-9 h-9 flex items-center justify-center bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              step="0.5"
              value={smileAssessment.incisorExposureRestMm ?? ''}
              onChange={(e) =>
                updateField(
                  'incisorExposureRestMm',
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              placeholder="2.5"
              className="w-24 text-center py-2 px-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            <button
              type="button"
              onClick={() => {
                const cur = Number(smileAssessment.incisorExposureRestMm) || 2.5;
                updateField('incisorExposureRestMm', cur + 0.5);
              }}
              className="w-9 h-9 flex items-center justify-center bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 ml-1">
              Norm: 2.0 - 3.5 mm (Ideal rest display)
            </span>
          </div>
        </div>

        {/* 4. AMOUNT OF INCISOR EXPOSURE ON SMILE */}
        <div className="space-y-1.5">
          <SelectField
            label="Amount of Incisor Exposure on Smile"
            value={smileAssessment.incisorExposureSmile || 'Full crown (100%)'}
            onChange={(v) => updateField('incisorExposureSmile', v)}
            options={INCISOR_SMILE_OPTIONS}
            placeholder="Select smile display…"
          />
        </div>

        {/* 5. AMOUNT OF GINGIVAL EXPOSURE ON SMILE (MM) */}
        <div className="space-y-1.5">
          <label className="block text-slate-900 font-bold text-sm">
            Amount of Gingival Exposure on Smile (mm)
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const cur = Number(smileAssessment.gingivalExposureMm) || 0;
                updateField('gingivalExposureMm', Math.max(0, cur - 0.5));
              }}
              className="w-9 h-9 flex items-center justify-center bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0 cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              step="0.5"
              min="0"
              value={smileAssessment.gingivalExposureMm ?? ''}
              onChange={(e) =>
                updateField(
                  'gingivalExposureMm',
                  e.target.value === '' ? '' : Number(e.target.value)
                )
              }
              placeholder="0"
              className="w-24 text-center py-2 px-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            <button
              type="button"
              onClick={() => {
                const cur = Number(smileAssessment.gingivalExposureMm) || 0;
                updateField('gingivalExposureMm', cur + 0.5);
              }}
              className="w-9 h-9 flex items-center justify-center bg-slate-100 active:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-300 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-500 ml-1">
              {Number(smileAssessment.gingivalExposureMm) > 2
                ? '⚠️ Excessive Gingival Display (Gummy Smile)'
                : '✓ Aesthetic Normal Range (0 - 2 mm)'}
            </span>
          </div>
        </div>

        {/* 6. BUCCAL CORRIDOR */}
        <div className="space-y-1.5">
          <SelectField
            label="Buccal Corridor"
            value={smileAssessment.buccalCorridor || 'Normal'}
            onChange={(v) => updateField('buccalCorridor', v)}
            options={BUCCAL_CORRIDOR_OPTIONS}
            placeholder="Select corridor type…"
          />
        </div>

        {/* 7. SMILE ARC */}
        <div className="space-y-1.5">
          <SelectField
            label="Smile Arc"
            value={smileAssessment.smileArc || 'Consonant'}
            onChange={(v) => updateField('smileArc', v)}
            options={SMILE_ARC_OPTIONS}
            placeholder="Select smile arc…"
          />
        </div>

        {/* 8. SMILE ASSESSMENT NOTES & AESTHETIC INFERENCES */}
        <div className="space-y-1.5">
          <label className="block text-slate-900 font-bold text-sm">
            Smile Assessment Notes & Aesthetic Inferences
          </label>
          <textarea
            rows={3}
            value={smileAssessment.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="e.g. Consonant smile arc with symmetrical 1.5mm gingival display and harmonious buccal corridors."
            className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder-slate-400 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 outline-none"
          />
        </div>
      </div>
    )}
  </div>
);
};

export default React.memo(SmileAssessmentCard);
