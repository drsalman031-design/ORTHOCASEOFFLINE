import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Maximize2,
  RotateCcw,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Sliders,
  Info,
  Eye,
  FileText,
  Layers,
  X,
  ArrowRightLeft,
  Image as ImageIcon
} from 'lucide-react';
import {
  ExtraoralPhotos,
  ExtraoralPhotoAnalysis,
  FrontalGuideLines,
  VtoComparisonNotes
} from '../../types';

interface ExtraoralPhotoAnalyzerProps {
  extraoralPhotos?: ExtraoralPhotos;
  setExtraoralPhotos?: React.Dispatch<React.SetStateAction<ExtraoralPhotos>>;
  extraoralPhotoAnalysis?: ExtraoralPhotoAnalysis;
  setExtraoralPhotoAnalysis?: React.Dispatch<React.SetStateAction<ExtraoralPhotoAnalysis>>;
  vto?: string;
  setVto?: (val: string) => void;
  facialForm?: string;
  setFacialForm?: (val: any) => void;
  symmetry?: string;
  setSymmetry?: (val: any) => void;
}

type PhotoSlotKey = 'frontal_rest' | 'frontal_smile' | 'profile' | 'oblique' | 'vto';

interface SlotMeta {
  key: PhotoSlotKey;
  label: string;
  shortLabel: string;
  description: string;
  requiredForAnalyzer?: boolean;
}

const PHOTO_SLOTS: SlotMeta[] = [
  {
    key: 'frontal_rest',
    label: 'Frontal at Rest',
    shortLabel: 'Frontal Rest',
    description: 'Required for facial thirds & midline analysis',
    requiredForAnalyzer: true,
  },
  {
    key: 'frontal_smile',
    label: 'Frontal Smiling',
    shortLabel: 'Frontal Smile',
    description: 'Evaluates smile arc & dental display',
  },
  {
    key: 'profile',
    label: 'Right Profile',
    shortLabel: 'Profile',
    description: 'Profile divergence & soft tissue angles',
  },
  {
    key: 'oblique',
    label: 'Three-Quarter Oblique',
    shortLabel: 'Oblique',
    description: 'Malar prominence & cheek contour',
  },
  {
    key: 'vto',
    label: 'VTO / Treatment Objective',
    shortLabel: 'VTO / Morph',
    description: 'Predicted profile improvement for comparison',
  },
];

const DEFAULT_GUIDES: FrontalGuideLines = {
  trichionY: 0.15,
  glabellaY: 0.35,
  subnasaleY: 0.60,
  mentonY: 0.85,
  midlineX: 0.50,
  vLeftOuterX: 0.15,
  vLeftInnerX: 0.38,
  vRightInnerX: 0.62,
  vRightOuterX: 0.85,
};

// Client-side image compressor & validator (100% Offline)
const compressImage = (file: File, maxWidth = 1600, maxHeight = 1200): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('Invalid file type: Please upload standard clinical images (JPEG, PNG, WebP).'));
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const ExtraoralPhotoAnalyzer: React.FC<ExtraoralPhotoAnalyzerProps> = ({
  extraoralPhotos,
  setExtraoralPhotos,
  extraoralPhotoAnalysis,
  setExtraoralPhotoAnalysis,
  vto,
  setVto,
  facialForm,
  setFacialForm,
  symmetry,
  setSymmetry,
}) => {
  const photos: ExtraoralPhotos = extraoralPhotos || {};
  const analysis: ExtraoralPhotoAnalysis = extraoralPhotoAnalysis || {};

  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'gallery' | 'thirds' | 'vtoCompare' | 'summary'>('gallery');

  // Interactive Lightbox State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Frontal Thirds Guides
  const guides: FrontalGuideLines = analysis.guides || DEFAULT_GUIDES;
  const [draggedLine, setDraggedLine] = useState<string | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Hidden file inputs refs per slot
  const fileInputRefs = useRef<Record<PhotoSlotKey, HTMLInputElement | null>>({
    frontal_rest: null,
    frontal_smile: null,
    profile: null,
    oblique: null,
    vto: null,
  });

  // Calculate Facial Thirds
  const totalSpan = Math.max(0.01, guides.mentonY - guides.trichionY);
  const upperThird = Math.max(0, guides.glabellaY - guides.trichionY);
  const middleThird = Math.max(0, guides.subnasaleY - guides.glabellaY);
  const lowerThird = Math.max(0, guides.mentonY - guides.subnasaleY);

  const upperPct = Math.round((upperThird / totalSpan) * 100);
  const middlePct = Math.round((middleThird / totalSpan) * 100);
  const lowerPct = Math.round((lowerThird / totalSpan) * 100);

  // Calculate Vertical Fifths & Transverse Proportions
  const vLeftOuterX = guides.vLeftOuterX ?? 0.15;
  const vLeftInnerX = guides.vLeftInnerX ?? 0.38;
  const midlineX = guides.midlineX ?? 0.50;
  const vRightInnerX = guides.vRightInnerX ?? 0.62;
  const vRightOuterX = guides.vRightOuterX ?? 0.85;

  const totalFaceWidth = Math.max(0.01, vRightOuterX - vLeftOuterX);
  const intercanthalWidth = Math.max(0, vRightInnerX - vLeftInnerX);
  const leftFaceWidth = Math.max(0.01, midlineX - vLeftOuterX);
  const rightFaceWidth = Math.max(0.01, vRightOuterX - midlineX);

  const intercanthalPct = Math.round((intercanthalWidth / totalFaceWidth) * 100);
  const symmetryRatio = Math.round((Math.min(leftFaceWidth, rightFaceWidth) / Math.max(leftFaceWidth, rightFaceWidth)) * 100);

  // Auto-generate live inferences whenever guide lines or midline position change
  useEffect(() => {
    let thirdsSuggestion = '';
    if (lowerPct > 36) {
      thirdsSuggestion = `Increased Lower Facial Third (${lowerPct}% vs Norm ~33%). Hyperdivergent facial pattern tendency.`;
    } else if (lowerPct < 29) {
      thirdsSuggestion = `Decreased Lower Facial Third (${lowerPct}% vs Norm ~33%). Hypodivergent facial pattern tendency.`;
    } else {
      thirdsSuggestion = `Balanced Facial Thirds (Upper ${upperPct}%, Middle ${middlePct}%, Lower ${lowerPct}%).`;
    }

    const devPct = (midlineX - 0.5) * 100;
    let midlineSuggestion = '';
    if (Math.abs(devPct) < 0.8) {
      midlineSuggestion = 'Centered / Coincident with facial midline';
    } else if (devPct > 0) {
      midlineSuggestion = `Facial Midline Deviated Right by ${devPct.toFixed(1)}% (~${(devPct * 0.35).toFixed(1)} mm)`;
    } else {
      midlineSuggestion = `Facial Midline Deviated Left by ${Math.abs(devPct).toFixed(1)}% (~${(Math.abs(devPct) * 0.35).toFixed(1)} mm)`;
    }

    let fifthsSuggestion = '';
    if (intercanthalPct > 24) {
      fifthsSuggestion = `Increased Intercanthal/Nasal Base Width (${intercanthalPct}% of facial width, Norm ~20%). Wide nasal base/hypertelorism tendency. Transverse facial symmetry: ${symmetryRatio}%.`;
    } else if (intercanthalPct < 16) {
      fifthsSuggestion = `Narrow Intercanthal/Nasal Base Width (${intercanthalPct}% of facial width, Norm ~20%). Hypotelorism tendency. Transverse facial symmetry: ${symmetryRatio}%.`;
    } else {
      fifthsSuggestion = `Balanced Vertical Facial Fifths & Intercanthal Width (${intercanthalPct}% of facial width, Norm ~20%). Transverse facial symmetry: ${symmetryRatio}%.`;
    }

    updateAnalysisField('thirdsInterpretation', thirdsSuggestion);
    updateAnalysisField('midlineDeviation', midlineSuggestion);
    updateAnalysisField('fifthsInterpretation', fifthsSuggestion);
  }, [lowerPct, upperPct, middlePct, midlineX, vLeftOuterX, vLeftInnerX, vRightInnerX, vRightOuterX, intercanthalPct, symmetryRatio]);

  // Upload handler for a slot
  const handleSlotUpload = async (slot: PhotoSlotKey, file: File) => {
    try {
      const compressedDataUrl = await compressImage(file);
      if (setExtraoralPhotos) {
        setExtraoralPhotos((prev) => ({
          ...prev,
          [slot]: compressedDataUrl,
        }));
      }

      // If uploaded frontal_rest, automatically open Frontal Thirds tab
      if (slot === 'frontal_rest' && activeTab === 'gallery') {
        setActiveTab('thirds');
      }
    } catch (err) {
      console.error('Failed to compress image:', err);
    }
  };

  // Delete photo from a slot
  const handleSlotDelete = (slot: PhotoSlotKey) => {
    if (setExtraoralPhotos) {
      setExtraoralPhotos((prev) => {
        const next = { ...prev };
        delete next[slot];
        return next;
      });
    }
  };

  // Helper to update analysis object fields
  const updateAnalysisField = (field: keyof ExtraoralPhotoAnalysis, value: any) => {
    if (setExtraoralPhotoAnalysis) {
      setExtraoralPhotoAnalysis((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Helper to update guide lines
  const updateGuideLines = (newGuides: FrontalGuideLines) => {
    updateAnalysisField('guides', newGuides);
  };

  const handleResetGuides = () => {
    updateGuideLines(DEFAULT_GUIDES);
  };

  // Draggable handle move handler
  const handlePointerDown = (lineName: string, e: React.PointerEvent) => {
    e.preventDefault();
    setDraggedLine(lineName);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedLine || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const relY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));

    const currentGuides = { ...guides };
    if (draggedLine === 'trichionY') {
      currentGuides.trichionY = Math.min(relY, currentGuides.glabellaY - 0.02);
    } else if (draggedLine === 'glabellaY') {
      currentGuides.glabellaY = Math.max(currentGuides.trichionY + 0.02, Math.min(relY, currentGuides.subnasaleY - 0.02));
    } else if (draggedLine === 'subnasaleY') {
      currentGuides.subnasaleY = Math.max(currentGuides.glabellaY + 0.02, Math.min(relY, currentGuides.mentonY - 0.02));
    } else if (draggedLine === 'mentonY') {
      currentGuides.mentonY = Math.max(relY, currentGuides.subnasaleY + 0.02);
    } else if (draggedLine === 'vLeftOuterX') {
      currentGuides.vLeftOuterX = Math.min(relX, (currentGuides.vLeftInnerX ?? 0.38) - 0.02);
    } else if (draggedLine === 'vLeftInnerX') {
      currentGuides.vLeftInnerX = Math.max((currentGuides.vLeftOuterX ?? 0.15) + 0.02, Math.min(relX, currentGuides.midlineX - 0.02));
    } else if (draggedLine === 'midlineX') {
      currentGuides.midlineX = Math.max((currentGuides.vLeftInnerX ?? 0.38) + 0.02, Math.min(relX, (currentGuides.vRightInnerX ?? 0.62) - 0.02));
    } else if (draggedLine === 'vRightInnerX') {
      currentGuides.vRightInnerX = Math.max(currentGuides.midlineX + 0.02, Math.min(relX, (currentGuides.vRightOuterX ?? 0.85) - 0.02));
    } else if (draggedLine === 'vRightOuterX') {
      currentGuides.vRightOuterX = Math.max((currentGuides.vRightInnerX ?? 0.62) + 0.02, relX);
    }

    updateGuideLines(currentGuides);
  };

  const handlePointerUp = () => {
    setDraggedLine(null);
  };

  // VTO Comparison checklist updater
  const updateVtoComparison = (field: keyof VtoComparisonNotes, val: string) => {
    const currentVtoComp = analysis.vtoComparison || {};
    const updatedVtoComp = {
      ...currentVtoComp,
      [field]: val,
    };

    updateAnalysisField('vtoComparison', updatedVtoComp);

    // Sync to CaseForm `vto` text field if present
    if (setVto) {
      const summaryParts = [];
      if (updatedVtoComp.overallImprovement) summaryParts.push(`Overall Improvement: ${updatedVtoComp.overallImprovement}`);
      if (updatedVtoComp.lipCompetence) summaryParts.push(`Lip Competence: ${updatedVtoComp.lipCompetence}`);
      if (updatedVtoComp.chinProjection) summaryParts.push(`Chin Projection: ${updatedVtoComp.chinProjection}`);
      if (updatedVtoComp.comparisonNotes) summaryParts.push(`Notes: ${updatedVtoComp.comparisonNotes}`);

      if (summaryParts.length > 0) {
        setVto(summaryParts.join(' | '));
      }
    }
  };

  // Count uploaded photos
  const uploadedCount = PHOTO_SLOTS.filter((s) => Boolean(photos[s.key])).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden transition-all text-slate-100">
      {/* Hidden File Input Elements for Each Slot */}
      {PHOTO_SLOTS.map((slot) => (
        <input
          key={slot.key}
          type="file"
          accept="image/*"
          ref={(el) => {
            fileInputRefs.current[slot.key] = el;
          }}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleSlotUpload(slot.key, file);
            }
            e.target.value = '';
          }}
        />
      ))}

      {/* Accordion Header Bar */}
      <div
        onClick={() => setIsAccordionOpen((prev) => !prev)}
        className="bg-slate-950 active:bg-slate-900/90 px-3 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between cursor-pointer border-b border-slate-800 transition-colors select-none gap-2"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-blue-600/90 text-white rounded-lg shadow-sm shrink-0">
            <Camera className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide uppercase truncate">
                Extraoral Analyzer
              </h3>
              <span className="text-[10px] font-bold bg-blue-950 text-blue-300 border border-blue-800/80 px-2 py-0.5 rounded-full shrink-0">
                {uploadedCount}/{PHOTO_SLOTS.length}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Gallery, facial thirds, VTO compare & notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isAccordionOpen ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </div>

      {/* Accordion Content Body */}
      {isAccordionOpen && (
        <div className="p-4 sm:p-5 space-y-5">
          {/* Navigation Tabs Bar */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('gallery')}
              className={`shrink-0 min-h-10 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'gallery'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 active:text-slate-200 active:bg-slate-900'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('thirds')}
              className={`shrink-0 min-h-10 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'thirds'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 active:text-slate-200 active:bg-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Thirds</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vtoCompare')}
              className={`shrink-0 min-h-10 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'vtoCompare'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 active:text-slate-200 active:bg-slate-900'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>VTO</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`shrink-0 min-h-10 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 active:text-slate-200 active:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Summary</span>
            </button>
          </div>

          {/* TAB 1: GALLERY & UPLOAD SLOTS */}
          {activeTab === 'gallery' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  Clinical Extraoral Photo Upload Slots
                </span>
                <span className="text-xs text-slate-400">
                  Select or drag photos into each clinical view
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
                {PHOTO_SLOTS.map((slot) => {
                  const hasPhoto = Boolean(photos[slot.key]);
                  const photoUrl = photos[slot.key];

                  return (
                    <div
                      key={slot.key}
                      className={`bg-slate-950 rounded-xl p-3 border flex flex-col justify-between transition-all ${
                        hasPhoto
                          ? 'border-slate-700 hover:border-blue-500/80 shadow-md'
                          : 'border-slate-800 border-dashed hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Slot Header */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-200 flex items-center gap-1">
                            {slot.shortLabel}
                            {slot.requiredForAnalyzer && (
                              <span className="text-rose-400 font-bold text-xs" title="Required for facial third analyzer">
                                *
                              </span>
                            )}
                          </span>

                          {hasPhoto ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                              Uploaded
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                              Empty
                            </span>
                          )}
                        </div>

                        {/* Thumbnail or Upload Target */}
                        {hasPhoto && photoUrl ? (
                          <div className="relative aspect-[3/4] rounded-lg overflow-hidden border border-slate-800 bg-black group">
                            <img
                              src={photoUrl}
                              alt={slot.label}
                              className="w-full h-full object-contain object-center group-hover:scale-105 transition-transform"
                            />

                            {/* Always-visible controls for touch */}
                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950/90 via-slate-950/70 to-transparent flex flex-col gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setLightboxUrl(photoUrl);
                                  setLightboxTitle(slot.label);
                                }}
                                className="w-full min-h-9 px-2 bg-blue-600 active:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span>Preview</span>
                              </button>

                              <div className="flex gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[slot.key]?.click()}
                                  className="flex-1 min-h-9 px-2 bg-slate-800 active:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                                >
                                  <Upload className="w-3.5 h-3.5 text-blue-400" />
                                  <span>Replace</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleSlotDelete(slot.key)}
                                  className="min-h-9 px-2.5 bg-rose-950 active:bg-rose-900 text-rose-300 rounded-lg text-xs font-semibold flex items-center justify-center border border-rose-800/60"
                                  aria-label="Delete photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => fileInputRefs.current[slot.key]?.click()}
                            className="aspect-[3/4] rounded-lg border-2 border-dashed border-slate-800 hover:border-blue-500/60 bg-slate-900/40 hover:bg-slate-900 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all group"
                          >
                            <div className="p-2.5 bg-slate-800 group-hover:bg-blue-600 text-slate-400 group-hover:text-white rounded-full transition-colors mb-2">
                              <Upload className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-bold text-slate-300 group-hover:text-blue-300">
                              Upload {slot.shortLabel}
                            </span>
                            <span className="text-[10px] text-slate-500 mt-1 leading-tight">
                              {slot.description}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Bottom Direct Tab Jump Button if Photo Available */}
                      {hasPhoto && (
                        <div className="mt-2 pt-2 border-t border-slate-800">
                          {slot.key === 'frontal_rest' && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('thirds')}
                              className="w-full py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/80 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>Analyze Thirds</span>
                            </button>
                          )}
                          {(slot.key === 'profile' || slot.key === 'vto') && (
                            <button
                              type="button"
                              onClick={() => setActiveTab('vtoCompare')}
                              className="w-full py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800/80 rounded text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>VTO Compare</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: FRONTAL THIRDS WORKSPACE */}
          {activeTab === 'thirds' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    Interactive Frontal Facial Thirds & Midline Analyzer
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Drag the horizontal facial-third lines (Tr, G, Sn, Me) and vertical midline to calculate proportions
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetGuides}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reset Guides</span>
                  </button>
                </div>
              </div>

              {!photos.frontal_rest ? (
                /* Empty state when Frontal at Rest photo is missing */
                <div className="bg-slate-950 border-2 border-dashed border-slate-800 rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-slate-900 text-blue-400 rounded-full border border-slate-800">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h5 className="text-sm font-bold text-slate-100">
                      Frontal at Rest Photo Required
                    </h5>
                    <p className="text-xs text-slate-400">
                      To calibrate facial thirds (Trichion, Glabella, Subnasale, Menton) and vertical midline, please upload a frontal extraoral photo at rest.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current.frontal_rest?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md border border-blue-400 flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Frontal at Rest Photo</span>
                  </button>
                </div>
              ) : (
                /* Interactive Canvas & Measurements Layout */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left: Interactive Workspace Canvas */}
                  <div className="lg:col-span-7 bg-slate-950 rounded-2xl p-3.5 border border-slate-800 shadow-xl flex flex-col items-center justify-center min-h-[280px] sm:min-h-[360px] lg:min-h-[460px]">
                    <div
                      ref={workspaceRef}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerLeave={handlePointerUp}
                      className="relative w-full max-w-[420px] aspect-[3/4] rounded-xl overflow-hidden border border-slate-800 shadow-2xl select-none touch-none bg-black"
                    >
                      {/* Photo Image */}
                      <img
                        src={photos.frontal_rest}
                        alt="Frontal at Rest"
                        className="w-full h-full object-cover object-center pointer-events-none"
                      />

                      {/* SVG Lines Overlay */}
                      <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                        {/* 1. Trichion Line (Tr) */}
                        <line
                          x1="0"
                          y1={`${guides.trichionY * 100}%`}
                          x2="100%"
                          y2={`${guides.trichionY * 100}%`}
                          stroke="#38bdf8"
                          strokeWidth="2"
                          strokeDasharray="4 2"
                        />

                        {/* 2. Glabella Line (G) */}
                        <line
                          x1="0"
                          y1={`${guides.glabellaY * 100}%`}
                          x2="100%"
                          y2={`${guides.glabellaY * 100}%`}
                          stroke="#10b981"
                          strokeWidth="2"
                        />

                        {/* 3. Subnasale Line (Sn) */}
                        <line
                          x1="0"
                          y1={`${guides.subnasaleY * 100}%`}
                          x2="100%"
                          y2={`${guides.subnasaleY * 100}%`}
                          stroke="#f59e0b"
                          strokeWidth="2"
                        />

                        {/* 4. Menton Line (Me) */}
                        <line
                          x1="0"
                          y1={`${guides.mentonY * 100}%`}
                          x2="100%"
                          y2={`${guides.mentonY * 100}%`}
                          stroke="#a855f7"
                          strokeWidth="2"
                        />

                        {/* 5. Vertical Left Outer Line */}
                        <line
                          x1={`${vLeftOuterX * 100}%`}
                          y1="0"
                          x2={`${vLeftOuterX * 100}%`}
                          y2="100%"
                          stroke="#818cf8"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />

                        {/* 6. Vertical Left Inner / Alar Line */}
                        <line
                          x1={`${vLeftInnerX * 100}%`}
                          y1="0"
                          x2={`${vLeftInnerX * 100}%`}
                          y2="100%"
                          stroke="#34d399"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />

                        {/* 7. Vertical Facial Midline */}
                        <line
                          x1={`${midlineX * 100}%`}
                          y1="0"
                          x2={`${midlineX * 100}%`}
                          y2="100%"
                          stroke="#f43f5e"
                          strokeWidth="2"
                          strokeDasharray="4 3"
                        />

                        {/* 8. Vertical Right Inner / Alar Line */}
                        <line
                          x1={`${vRightInnerX * 100}%`}
                          y1="0"
                          x2={`${vRightInnerX * 100}%`}
                          y2="100%"
                          stroke="#34d399"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />

                        {/* 9. Vertical Right Outer Line */}
                        <line
                          x1={`${vRightOuterX * 100}%`}
                          y1="0"
                          x2={`${vRightOuterX * 100}%`}
                          y2="100%"
                          stroke="#818cf8"
                          strokeWidth="1.5"
                          strokeDasharray="3 3"
                        />
                      </svg>

                      {/* Touch Drag Handles */}
                      {/* Trichion Handle */}
                      <div
                        style={{ top: `${guides.trichionY * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('trichionY', e)}
                        className="absolute left-2 -translate-y-1/2 cursor-ns-resize z-20 group"
                        title="Drag Trichion (Hairline)"
                      >
                        <div className="bg-sky-500 text-slate-950 font-black text-xs px-2 py-1 rounded shadow-lg group-hover:scale-110 transition-transform flex items-center gap-1 min-w-[44px] justify-center">
                          Tr
                        </div>
                      </div>

                      {/* Glabella Handle */}
                      <div
                        style={{ top: `${guides.glabellaY * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('glabellaY', e)}
                        className="absolute left-2 -translate-y-1/2 cursor-ns-resize z-20 group"
                        title="Drag Glabella (Brow)"
                      >
                        <div className="bg-emerald-500 text-slate-950 font-black text-xs px-2 py-1 rounded shadow-lg group-hover:scale-110 transition-transform flex items-center gap-1 min-w-[44px] justify-center">
                          G
                        </div>
                      </div>

                      {/* Subnasale Handle */}
                      <div
                        style={{ top: `${guides.subnasaleY * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('subnasaleY', e)}
                        className="absolute right-2 -translate-y-1/2 cursor-ns-resize z-20 group"
                        title="Drag Subnasale (Base of nose)"
                      >
                        <div className="bg-amber-400 text-slate-950 font-black text-xs px-2 py-1 rounded shadow-lg group-hover:scale-110 transition-transform flex items-center gap-1 min-w-[44px] justify-center">
                          Sn
                        </div>
                      </div>

                      {/* Menton Handle */}
                      <div
                        style={{ top: `${guides.mentonY * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('mentonY', e)}
                        className="absolute left-2 -translate-y-1/2 cursor-ns-resize z-20 group"
                        title="Drag Menton (Bottom of chin)"
                      >
                        <div className="bg-purple-600 text-white font-black text-xs px-2 py-1 rounded shadow-lg group-hover:scale-110 transition-transform flex items-center gap-1 min-w-[44px] justify-center">
                          Me
                        </div>
                      </div>

                      {/* Vertical Handles */}
                      {/* Left Outer Handle */}
                      <div
                        style={{ left: `${vLeftOuterX * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('vLeftOuterX', e)}
                        className="absolute top-1 -translate-x-1/2 cursor-ew-resize z-20 group"
                        title="Drag Left Outer Boundary"
                      >
                        <div className="bg-indigo-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-lg group-hover:scale-110 transition-transform">
                          L.Out
                        </div>
                      </div>

                      {/* Left Inner / Alar Handle */}
                      <div
                        style={{ left: `${vLeftInnerX * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('vLeftInnerX', e)}
                        className="absolute bottom-1 -translate-x-1/2 cursor-ew-resize z-20 group"
                        title="Drag Left Inner Canthus / Alar Base"
                      >
                        <div className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-lg group-hover:scale-110 transition-transform">
                          L.Alar
                        </div>
                      </div>

                      {/* Midline Handle */}
                      <div
                        style={{ left: `${midlineX * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('midlineX', e)}
                        className="absolute top-1 -translate-x-1/2 cursor-ew-resize z-20 group"
                        title="Drag Vertical Facial Midline"
                      >
                        <div className="bg-rose-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-lg group-hover:scale-110 transition-transform">
                          MIDLINE
                        </div>
                      </div>

                      {/* Right Inner / Alar Handle */}
                      <div
                        style={{ left: `${vRightInnerX * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('vRightInnerX', e)}
                        className="absolute bottom-1 -translate-x-1/2 cursor-ew-resize z-20 group"
                        title="Drag Right Inner Canthus / Alar Base"
                      >
                        <div className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-lg group-hover:scale-110 transition-transform">
                          R.Alar
                        </div>
                      </div>

                      {/* Right Outer Handle */}
                      <div
                        style={{ left: `${vRightOuterX * 100}%` }}
                        onPointerDown={(e) => handlePointerDown('vRightOuterX', e)}
                        className="absolute top-1 -translate-x-1/2 cursor-ew-resize z-20 group"
                        title="Drag Right Outer Boundary"
                      >
                        <div className="bg-indigo-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow-lg group-hover:scale-110 transition-transform">
                          R.Out
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Live Proportions & Measurements Panel */}
                  <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Live Facial Third Percentages
                        </span>
                        <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                          Norm: ~33% Each
                        </span>
                      </div>

                      {/* Upper Third */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-sky-400">Upper Third (Trichion - Glabella)</span>
                          <span className="text-slate-100 font-mono text-sm">{upperPct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-sky-400 transition-all duration-200"
                            style={{ width: `${Math.min(100, upperPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Middle Third */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-emerald-400">Middle Third (Glabella - Subnasale)</span>
                          <span className="text-slate-100 font-mono text-sm">{middlePct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-emerald-400 transition-all duration-200"
                            style={{ width: `${Math.min(100, middlePct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Lower Third */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-amber-400">Lower Third (Subnasale - Menton)</span>
                          <span className="text-slate-100 font-mono text-sm">{lowerPct}%</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-amber-400 transition-all duration-200"
                            style={{ width: `${Math.min(100, lowerPct)}%` }}
                          />
                        </div>
                      </div>

                      {/* Live Auto-Inference: Thirds Diagnostic Interpretation */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
                            Thirds Diagnostic Interpretation
                          </label>
                          <span className="text-[10px] font-bold text-blue-400 bg-blue-950/80 border border-blue-800/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live Auto-Inference
                          </span>
                        </div>
                        <p className="text-xs text-blue-100 font-medium leading-relaxed bg-blue-950/30 p-2.5 rounded-lg border border-blue-900/40">
                          {analysis.thirdsInterpretation || `Balanced Facial Thirds (Upper ${upperPct}%, Middle ${middlePct}%, Lower ${lowerPct}%).`}
                        </p>
                      </div>

                      {/* Live Auto-Inference: Facial Midline Deviation */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                            Facial Midline Deviation
                          </label>
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live Auto-Inference
                          </span>
                        </div>
                        <p className="text-xs text-emerald-100 font-medium leading-relaxed bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40 font-mono">
                          {analysis.midlineDeviation || 'Centered / Coincident with facial midline'}
                        </p>
                      </div>

                      {/* Live Vertical Facial Fifths & Transverse Proportions */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/30 space-y-2.5">
                        <div className="flex justify-between items-center text-xs font-bold border-b border-slate-800 pb-1.5">
                          <span className="text-purple-400 uppercase tracking-wider">Vertical Fifths & Transverse Symmetry</span>
                          <span className="text-[10px] text-purple-300 bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Intercanthal Norm: ~20%
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block text-[10px] font-bold">Intercanthal / Alar Width</span>
                            <span className="text-emerald-400 font-mono font-bold text-sm">{intercanthalPct}%</span>
                          </div>

                          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block text-[10px] font-bold">Transverse Symmetry</span>
                            <span className="text-indigo-400 font-mono font-bold text-sm">{symmetryRatio}%</span>
                          </div>
                        </div>
                      </div>

                      {/* Live Auto-Inference: Vertical Fifths & Transverse Symmetry */}
                      <div className="bg-slate-950 p-3.5 rounded-xl border border-purple-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                            Vertical Fifths Diagnostic Interpretation
                          </label>
                          <span className="text-[10px] font-bold text-purple-400 bg-purple-950/80 border border-purple-800/60 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Live Auto-Inference
                          </span>
                        </div>
                        <p className="text-xs text-purple-100 font-medium leading-relaxed bg-purple-950/30 p-2.5 rounded-lg border border-purple-900/40">
                          {analysis.fifthsInterpretation || `Balanced Vertical Facial Fifths & Intercanthal Width (${intercanthalPct}% of facial width). Transverse facial symmetry: ${symmetryRatio}%.`}
                        </p>
                      </div>
                    </div>

                    {/* Apply to Case Form Button */}
                    {(setFacialForm || setSymmetry) && (
                      <button
                        type="button"
                        onClick={() => {
                          if (setFacialForm) {
                            if (lowerPct > 36) setFacialForm('Leptoprosopic');
                            else if (lowerPct < 29) setFacialForm('Euryprosopic');
                            else setFacialForm('Mesoprosopic');
                          }
                          if (setSymmetry) {
                            setSymmetry('Symmetrical');
                          }
                        }}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-xs border border-blue-400 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Apply Proportions to Extraoral Form</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PROFILE VS VTO COMPARISON */}
          {activeTab === 'vtoCompare' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                    Profile vs Visual Treatment Objective (VTO) Comparison
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    Compare pre-treatment right profile photo with soft-tissue VTO predicted outcome
                  </p>
                </div>
              </div>

              {/* Photos Stage */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left: Profile Photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        Pre-Treatment Right Profile
                      </span>
                      {!photos.profile && (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current.profile?.click()}
                          className="text-[11px] font-bold text-blue-400 hover:underline cursor-pointer"
                        >
                          + Upload Profile
                        </button>
                      )}
                    </div>

                    {photos.profile ? (
                      <div className="aspect-[3/4] rounded-xl overflow-hidden border border-slate-800 bg-black max-w-[360px] mx-auto">
                        <img
                          src={photos.profile}
                          alt="Pre-treatment Profile"
                          className="w-full h-full object-contain object-center"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current.profile?.click()}
                        className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer max-w-[360px] mx-auto group hover:border-blue-500/60"
                      >
                        <Upload className="w-6 h-6 text-slate-500 group-hover:text-blue-400 mb-2" />
                        <span className="text-xs font-bold text-slate-300">
                          Upload Right Profile Photo
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right: VTO Photo */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        VTO Predicted Profile Morph
                      </span>
                      {!photos.vto && (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current.vto?.click()}
                          className="text-[11px] font-bold text-emerald-400 hover:underline cursor-pointer"
                        >
                          + Upload VTO
                        </button>
                      )}
                    </div>

                    {photos.vto ? (
                      <div className="aspect-[3/4] rounded-xl overflow-hidden border border-slate-800 bg-black max-w-[360px] mx-auto">
                        <img
                          src={photos.vto}
                          alt="VTO Profile Morph"
                          className="w-full h-full object-contain object-center"
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current.vto?.click()}
                        className="aspect-[3/4] rounded-xl border-2 border-dashed border-slate-800 bg-slate-900/50 flex flex-col items-center justify-center p-6 text-center cursor-pointer max-w-[360px] mx-auto group hover:border-emerald-500/60"
                      >
                        <Upload className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 mb-2" />
                        <span className="text-xs font-bold text-slate-300">
                          Upload VTO / Predicted Morph Photo
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* VTO Comparison Checklist & Notes */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block border-b border-slate-800 pb-2">
                  VTO Profile Outcome Checklist & Notes
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Lip Competence */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Lip Competence with VTO
                    </label>
                    <select
                      value={analysis.vtoComparison?.lipCompetence || 'Improved'}
                      onChange={(e) => updateVtoComparison('lipCompetence', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Competent">Competent</option>
                      <option value="Incompetent">Incompetent</option>
                      <option value="Improved with VTO">Improved with VTO</option>
                      <option value="Unchanged">Unchanged</option>
                    </select>
                  </div>

                  {/* Chin Projection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Chin Projection
                    </label>
                    <select
                      value={analysis.vtoComparison?.chinProjection || 'Improved'}
                      onChange={(e) => updateVtoComparison('chinProjection', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Retrognathic">Retrognathic</option>
                      <option value="Orthognathic">Orthognathic</option>
                      <option value="Prognathic">Prognathic</option>
                      <option value="Improved with VTO">Improved with VTO</option>
                    </select>
                  </div>

                  {/* Overall Improvement */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 block">
                      Overall Aesthetic Improvement
                    </label>
                    <select
                      value={analysis.vtoComparison?.overallImprovement || 'Yes'}
                      onChange={(e) => updateVtoComparison('overallImprovement', e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      <option value="Yes">Yes (Significant)</option>
                      <option value="Partial">Partial</option>
                      <option value="No">No Improvement</option>
                    </select>
                  </div>
                </div>

                {/* VTO Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    VTO Comparison Notes & Treatment Justification
                  </label>
                  <textarea
                    rows={3}
                    value={analysis.vtoComparison?.comparisonNotes || ''}
                    onChange={(e) => updateVtoComparison('comparisonNotes', e.target.value)}
                    placeholder="Describe planned lip retraction, chin advancement, or soft tissue facial improvement..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANALYSIS SUMMARY & PER-VIEW NOTES */}
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="border-b border-slate-800 pb-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Diagnostic Photo Analysis Summary & View Notes
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  Review overall findings and record specific notes for each uploaded clinical photo view
                </p>
              </div>

              {/* Live Inferences Summary Box */}
              {(analysis.thirdsInterpretation || analysis.midlineDeviation || analysis.fifthsInterpretation) && (
                <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/30 space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                    <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
                    <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      Live Diagnostic Measurements & Auto-Inferences
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {analysis.thirdsInterpretation && (
                      <div className="bg-blue-950/30 p-2.5 rounded-lg border border-blue-900/40 space-y-1">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Facial Thirds</span>
                        <p className="text-xs text-blue-100 font-medium">{analysis.thirdsInterpretation}</p>
                      </div>
                    )}

                    {analysis.midlineDeviation && (
                      <div className="bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40 space-y-1">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Facial Midline</span>
                        <p className="text-xs text-emerald-100 font-medium font-mono">{analysis.midlineDeviation}</p>
                      </div>
                    )}

                    {analysis.fifthsInterpretation && (
                      <div className="bg-purple-950/30 p-2.5 rounded-lg border border-purple-900/40 space-y-1">
                        <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Vertical Fifths & Symmetry</span>
                        <p className="text-xs text-purple-100 font-medium">{analysis.fifthsInterpretation}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Overall Conclusion Field */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-200 uppercase tracking-wider block">
                  Overall Extraoral Photo Analysis Conclusion
                </label>
                <textarea
                  rows={3}
                  value={analysis.conclusion || ''}
                  onChange={(e) => updateAnalysisField('conclusion', e.target.value)}
                  placeholder="Synthesized conclusion combining frontal facial thirds, smile aesthetics, profile divergence, and VTO objective..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Individual View Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {PHOTO_SLOTS.map((slot) => {
                  const currentNote =
                    analysis.viewNotes?.[slot.key] || '';

                  return (
                    <div
                      key={slot.key}
                      className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400">
                          {slot.label} Notes
                        </span>
                        {photos[slot.key] ? (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">
                            Photo Present
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            No photo
                          </span>
                        )}
                      </div>

                      <textarea
                        rows={2}
                        value={currentNote}
                        onChange={(e) => {
                          const existingNotes = analysis.viewNotes || {};
                          updateAnalysisField('viewNotes', {
                            ...existingNotes,
                            [slot.key]: e.target.value,
                          });
                        }}
                        placeholder={`Clinical notes regarding ${slot.shortLabel.toLowerCase()} view...`}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {lightboxUrl && (
        <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="relative max-w-4xl w-full max-h-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900 gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
                {lightboxTitle || 'Extraoral Photo Lightbox'}
              </span>
              <button
                type="button"
                onClick={() => setLightboxUrl(null)}
                className="touch-target text-slate-400 active:text-white rounded-xl active:bg-slate-800 flex items-center justify-center shrink-0"
                aria-label="Close lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-black">
              <img
                src={lightboxUrl}
                alt={lightboxTitle}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ExtraoralPhotoAnalyzer);
