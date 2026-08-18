import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Check,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { IntraoralPhotos } from '../../types';

interface IntraoralPhotoGalleryProps {
  intraoralPhotos?: IntraoralPhotos;
  setIntraoralPhotos?: React.Dispatch<React.SetStateAction<IntraoralPhotos>>;
  disabled?: boolean;
}

export type IntraoralSlotKey = 'front' | 'right' | 'left' | 'upperOcclusal' | 'lowerOcclusal';

interface IntraoralSlotMeta {
  key: IntraoralSlotKey;
  label: string;
  shortLabel: string;
  description: string;
  quadrantHint: string;
}

export const INTRAORAL_PHOTO_SLOTS: IntraoralSlotMeta[] = [
  {
    key: 'right',
    label: 'Right Buccal / Lateral View',
    shortLabel: 'Right Lateral',
    description: 'Canine & molar relationship, buccal interdigitation in occlusion',
    quadrantHint: 'Right Quadrants (Q1 & Q4)',
  },
  {
    key: 'front',
    label: 'Frontal View in Occlusion',
    shortLabel: 'Frontal View',
    description: 'Overjet, overbite, dental midlines & anterior aesthetics',
    quadrantHint: 'Anterior Teeth (Q1/Q2 & Q3/Q4)',
  },
  {
    key: 'left',
    label: 'Left Buccal / Lateral View',
    shortLabel: 'Left Lateral',
    description: 'Canine & molar relationship, buccal interdigitation in occlusion',
    quadrantHint: 'Left Quadrants (Q2 & Q3)',
  },
  {
    key: 'upperOcclusal',
    label: 'Maxillary (Upper) Occlusal View',
    shortLabel: 'Upper Occlusal',
    description: 'Palatal vault, maxillary arch form, crowding/spacing & tooth rotations',
    quadrantHint: 'Maxillary Arch (18–28)',
  },
  {
    key: 'lowerOcclusal',
    label: 'Mandibular (Lower) Occlusal View',
    shortLabel: 'Lower Occlusal',
    description: 'Mandibular arch form, lingual inclination, Curve of Spee & incisal crowding',
    quadrantHint: 'Mandibular Arch (48–38)',
  },
];

// Client-side image compressor (max 1400px, quality 0.88)
const compressImage = (file: File, maxWidth = 1400, maxHeight = 1400): Promise<string> => {
  return new Promise((resolve, reject) => {
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
          resolve(canvas.toDataURL('image/jpeg', 0.88));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const IntraoralPhotoGallery: React.FC<IntraoralPhotoGalleryProps> = ({
  intraoralPhotos = {},
  setIntraoralPhotos,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeLightboxKey, setActiveLightboxKey] = useState<IntraoralSlotKey | null>(null);
  const [dragOverKey, setDragOverKey] = useState<IntraoralSlotKey | null>(null);
  const fileInputRefs = useRef<{ [key in IntraoralSlotKey]?: HTMLInputElement | null }>({});

  const photos = intraoralPhotos || {};

  // Count uploaded photos
  const uploadedCount = INTRAORAL_PHOTO_SLOTS.filter(
    (slot) => Boolean(photos[slot.key] || (photos as any)[slot.key.toLowerCase()])
  ).length;

  const handleFileUpload = async (slotKey: IntraoralSlotKey, file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (JPEG, PNG, WebP).');
      return;
    }
    try {
      const compressedDataUrl = await compressImage(file);
      if (setIntraoralPhotos) {
        setIntraoralPhotos((prev) => ({
          ...prev,
          [slotKey]: compressedDataUrl,
        }));
      }
    } catch (err) {
      console.error('Error compressing intraoral photo:', err);
    }
  };

  const handleRemovePhoto = (slotKey: IntraoralSlotKey, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (setIntraoralPhotos) {
      setIntraoralPhotos((prev) => {
        const next = { ...prev };
        delete next[slotKey];
        delete (next as any)[slotKey.toLowerCase()];
        return next;
      });
    }
    if (activeLightboxKey === slotKey) {
      setActiveLightboxKey(null);
    }
  };

  const handleDrop = (slotKey: IntraoralSlotKey, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverKey(null);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(slotKey, e.dataTransfer.files[0]);
    }
  };

  const currentLightboxIdx = activeLightboxKey
    ? INTRAORAL_PHOTO_SLOTS.findIndex((s) => s.key === activeLightboxKey)
    : -1;

  const handleNextLightbox = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentLightboxIdx !== -1) {
      const nextIdx = (currentLightboxIdx + 1) % INTRAORAL_PHOTO_SLOTS.length;
      setActiveLightboxKey(INTRAORAL_PHOTO_SLOTS[nextIdx].key);
    }
  };

  const handlePrevLightbox = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (currentLightboxIdx !== -1) {
      const prevIdx = (currentLightboxIdx - 1 + INTRAORAL_PHOTO_SLOTS.length) % INTRAORAL_PHOTO_SLOTS.length;
      setActiveLightboxKey(INTRAORAL_PHOTO_SLOTS[prevIdx].key);
    }
  };

  return (
    <div id="intraoral-photo-gallery-section" className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden mb-6">
      {/* Header */}
      <div
        id="intraoral-photo-gallery-header"
        className="px-4 py-3.5 bg-gradient-to-r from-teal-50/60 via-slate-50 to-white border-b border-slate-200 flex items-center justify-between cursor-pointer select-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-xs">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Intraoral Photographic Records
              </h3>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                  uploadedCount === 5
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : uploadedCount > 0
                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}
              >
                {uploadedCount} / 5 Uploaded
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Standard 5-View Orthodontic Series: Frontal, Right & Left Lateral in Occlusion, Upper & Lower Occlusal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {uploadedCount > 0 && !disabled && (
            <button
              id="clear-all-intraoral-photos-btn"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Are you sure you want to remove all 5 intraoral photos?')) {
                  if (setIntraoralPhotos) setIntraoralPhotos({});
                }
              }}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 transition-colors"
            >
              Clear All
            </button>
          )}
          <button
            type="button"
            className="text-slate-400 hover:text-slate-600 p-1"
            aria-label="Toggle Intraoral Photo Gallery"
          >
            {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div id="intraoral-photo-gallery-content" className="p-4 space-y-4">
          {/* Top Section: 3-View Lateral & Frontal Occlusion Series */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                Occlusal Intercuspation Series (Lateral & Frontal Views)
              </span>
              <span className="text-[11px] text-slate-400">Right, Front & Left in Centric Occlusion</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {INTRAORAL_PHOTO_SLOTS.slice(0, 3).map((slot) => {
                const photoUrl = photos[slot.key] || (photos as any)[slot.key.toLowerCase()];
                const isDragOver = dragOverKey === slot.key;

                return (
                  <div
                    key={slot.key}
                    id={`intraoral-slot-${slot.key}`}
                    className={`relative rounded-xl border transition-all flex flex-col overflow-hidden bg-slate-50/70 ${
                      isDragOver
                        ? 'border-teal-500 bg-teal-50/50 ring-2 ring-teal-200'
                        : photoUrl
                        ? 'border-teal-200 shadow-2xs bg-white'
                        : 'border-dashed border-slate-300 hover:border-slate-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverKey(slot.key);
                    }}
                    onDragLeave={() => setDragOverKey(null)}
                    onDrop={(e) => handleDrop(slot.key, e)}
                  >
                    {/* Slot Header Label */}
                    <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-slate-800 truncate">{slot.shortLabel}</span>
                      </div>
                      {photoUrl ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                          <Check className="w-3 h-3 text-teal-600" /> Saved
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Empty</span>
                      )}
                    </div>

                    {/* Image Area */}
                    <div className="relative aspect-4/3 w-full bg-slate-100 flex items-center justify-center overflow-hidden group">
                      {photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt={slot.label}
                            className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-102"
                            onClick={() => setActiveLightboxKey(slot.key)}
                          />

                          {/* Quick Overlay Action Buttons */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 pointer-events-none">
                            <button
                              type="button"
                              id={`view-btn-${slot.key}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveLightboxKey(slot.key);
                              }}
                              className="pointer-events-auto p-2 bg-white/95 text-slate-700 rounded-lg hover:bg-white hover:text-teal-700 shadow-md transition-all transform hover:scale-110"
                              title="Enlarge Fullscreen"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            {!disabled && (
                              <>
                                <button
                                  type="button"
                                  id={`replace-btn-${slot.key}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRefs.current[slot.key]?.click();
                                  }}
                                  className="pointer-events-auto p-2 bg-white/95 text-slate-700 rounded-lg hover:bg-white hover:text-teal-700 shadow-md transition-all transform hover:scale-110"
                                  title="Replace Photo"
                                >
                                  <Upload className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  id={`delete-btn-${slot.key}`}
                                  onClick={(e) => handleRemovePhoto(slot.key, e)}
                                  className="pointer-events-auto p-2 bg-white/95 text-rose-600 rounded-lg hover:bg-white hover:text-rose-700 shadow-md transition-all transform hover:scale-110"
                                  title="Delete Photo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                          onClick={() => !disabled && fileInputRefs.current[slot.key]?.click()}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500 mb-2">
                            <Upload className="w-5 h-5 text-slate-400" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 mb-0.5">Click or Drag to Upload</span>
                          <span className="text-[10px] text-slate-400 leading-tight line-clamp-2 px-1">
                            {slot.description}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Slot Description Footer */}
                    <div className="px-3 py-1.5 bg-slate-50 text-[11px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
                      <span className="truncate">{slot.quadrantHint}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[slot.key]?.click()}
                          className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 cursor-pointer ml-1 shrink-0"
                        >
                          {photoUrl ? 'Change' : 'Browse'}
                        </button>
                      )}
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={(el) => {
                        fileInputRefs.current[slot.key] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(slot.key, e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Section: 2-View Occlusal Mirror Arch Series */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-600"></span>
                Arch Occlusal Mirror Series (Upper & Lower Views)
              </span>
              <span className="text-[11px] text-slate-400">Maxillary & Mandibular Arch Form, Crowding & Symmetry</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {INTRAORAL_PHOTO_SLOTS.slice(3, 5).map((slot) => {
                const photoUrl = photos[slot.key] || (photos as any)[slot.key.toLowerCase()];
                const isDragOver = dragOverKey === slot.key;

                return (
                  <div
                    key={slot.key}
                    id={`intraoral-slot-${slot.key}`}
                    className={`relative rounded-xl border transition-all flex flex-col overflow-hidden bg-slate-50/70 ${
                      isDragOver
                        ? 'border-cyan-500 bg-cyan-50/50 ring-2 ring-cyan-200'
                        : photoUrl
                        ? 'border-cyan-200 shadow-2xs bg-white'
                        : 'border-dashed border-slate-300 hover:border-slate-400'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverKey(slot.key);
                    }}
                    onDragLeave={() => setDragOverKey(null)}
                    onDrop={(e) => handleDrop(slot.key, e)}
                  >
                    {/* Slot Header Label */}
                    <div className="px-3 py-2 bg-slate-100/90 border-b border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-bold text-slate-800 truncate">{slot.label}</span>
                      </div>
                      {photoUrl ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded border border-cyan-200">
                          <Check className="w-3 h-3 text-cyan-600" /> Saved
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Empty</span>
                      )}
                    </div>

                    {/* Image Area */}
                    <div className="relative aspect-16/10 w-full bg-slate-100 flex items-center justify-center overflow-hidden group">
                      {photoUrl ? (
                        <>
                          <img
                            src={photoUrl}
                            alt={slot.label}
                            className="w-full h-full object-contain cursor-pointer transition-transform duration-200 group-hover:scale-102"
                            onClick={() => setActiveLightboxKey(slot.key)}
                          />

                          {/* Quick Overlay Action Buttons */}
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2 pointer-events-none">
                            <button
                              type="button"
                              id={`view-btn-${slot.key}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveLightboxKey(slot.key);
                              }}
                              className="pointer-events-auto p-2 bg-white/95 text-slate-700 rounded-lg hover:bg-white hover:text-cyan-700 shadow-md transition-all transform hover:scale-110"
                              title="Enlarge Fullscreen"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </button>
                            {!disabled && (
                              <>
                                <button
                                  type="button"
                                  id={`replace-btn-${slot.key}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRefs.current[slot.key]?.click();
                                  }}
                                  className="pointer-events-auto p-2 bg-white/95 text-slate-700 rounded-lg hover:bg-white hover:text-cyan-700 shadow-md transition-all transform hover:scale-110"
                                  title="Replace Photo"
                                >
                                  <Upload className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  id={`delete-btn-${slot.key}`}
                                  onClick={(e) => handleRemovePhoto(slot.key, e)}
                                  className="pointer-events-auto p-2 bg-white/95 text-rose-600 rounded-lg hover:bg-white hover:text-rose-700 shadow-md transition-all transform hover:scale-110"
                                  title="Delete Photo"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      ) : (
                        <div
                          className="w-full h-full flex flex-col items-center justify-center p-3 text-center cursor-pointer hover:bg-slate-100/80 transition-colors"
                          onClick={() => !disabled && fileInputRefs.current[slot.key]?.click()}
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-200/80 flex items-center justify-center text-slate-500 mb-2">
                            <Upload className="w-5 h-5 text-slate-400" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 mb-0.5">Click or Drag to Upload</span>
                          <span className="text-[10px] text-slate-400 leading-tight line-clamp-2 px-1">
                            {slot.description}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Slot Description Footer */}
                    <div className="px-3 py-1.5 bg-slate-50 text-[11px] text-slate-500 border-t border-slate-100 flex items-center justify-between">
                      <span className="truncate">{slot.quadrantHint}</span>
                      {!disabled && (
                        <button
                          type="button"
                          onClick={() => fileInputRefs.current[slot.key]?.click()}
                          className="text-[11px] font-semibold text-cyan-600 hover:text-cyan-700 cursor-pointer ml-1 shrink-0"
                        >
                          {photoUrl ? 'Change' : 'Browse'}
                        </button>
                      )}
                    </div>

                    {/* Hidden Native File Input */}
                    <input
                      ref={(el) => {
                        fileInputRefs.current[slot.key] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          handleFileUpload(slot.key, e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {activeLightboxKey && (
        <div
          id="intraoral-lightbox-modal"
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
          onClick={() => setActiveLightboxKey(null)}
        >
          {/* Modal Top Bar */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white mb-3 px-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h4 className="text-base font-bold">
                {INTRAORAL_PHOTO_SLOTS.find((s) => s.key === activeLightboxKey)?.label}
              </h4>
              <p className="text-xs text-slate-300">
                {INTRAORAL_PHOTO_SLOTS.find((s) => s.key === activeLightboxKey)?.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrevLightbox}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Previous Photo"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
              <button
                type="button"
                onClick={handleNextLightbox}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Next Photo"
              >
                Next <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setActiveLightboxKey(null)}
                className="p-2 bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Image Box */}
          <div
            className="relative max-w-5xl max-h-[80vh] w-full flex items-center justify-center bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800 p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {photos[activeLightboxKey] || (photos as any)[activeLightboxKey.toLowerCase()] ? (
              <img
                src={photos[activeLightboxKey] || (photos as any)[activeLightboxKey.toLowerCase()]}
                alt={activeLightboxKey}
                className="max-w-full max-h-[76vh] object-contain rounded-lg"
              />
            ) : (
              <div className="p-12 text-center text-slate-400">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No photo uploaded for this position.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(IntraoralPhotoGallery);
