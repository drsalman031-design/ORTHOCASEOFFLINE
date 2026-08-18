import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sun,
  Sliders,
  Eye,
  RefreshCw,
  Maximize2,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Trash2,
  Move,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  FileImage,
  Target,
  Ruler,
  AlertTriangle,
  RotateCcw,
  Check,
  Lock,
  Compass,
} from 'lucide-react';
import { CephLandmarkModuleData, InvestigationImage } from '../../types';
import LandmarkIdentificationWorkspace from './landmark-id/LandmarkIdentificationWorkspace';
import LandmarkReviewWorkspace from './landmark-id/LandmarkReviewWorkspace';
import GeometryEngineWorkspace from './landmark-id/GeometryEngineWorkspace';

interface TabCephLandmarkIdentificationProps {
  data?: CephLandmarkModuleData;
  investigationsImages?: InvestigationImage[];
  onUpdateData?: (data: CephLandmarkModuleData) => void;
  onAddInvestigationImage?: (img: InvestigationImage) => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
}

export const TabCephLandmarkIdentification: React.FC<TabCephLandmarkIdentificationProps> = ({
  data,
  investigationsImages = [],
  onUpdateData,
  onAddInvestigationImage,
  onNextTab,
  onPrevTab,
}) => {
  // Current active sub-step inside Ceph Landmark Module
  const [activeStep, setActiveStep] = useState<
    'upload' | 'calibration' | 'identification' | 'review' | 'geometry' | 'completed'
  >(data?.currentStep || (data?.originalImage ? 'calibration' : 'upload'));

  // Original pristine image dataUrl
  const [originalImage, setOriginalImage] = useState<string | undefined>(data?.originalImage);

  // Calibration State
  const [rulerLengthMm, setRulerLengthMm] = useState<number>(
    data?.calibration?.rulerLengthMm || 10
  );
  const [point1, setPoint1] = useState<{ x: number; y: number } | undefined>(
    data?.calibration?.point1
  );
  const [point2, setPoint2] = useState<{ x: number; y: number } | undefined>(
    data?.calibration?.point2
  );
  const [calibrationCompleted, setCalibrationCompleted] = useState<boolean>(
    Boolean(data?.calibration?.completed)
  );

  // Interaction Mode in Calibration
  const [interactionMode, setInteractionMode] = useState<'pan' | 'calibrate'>('calibrate');

  // Viewer state controls
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [invert, setInvert] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);

  // UI state
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showFiltersPanel, setShowFiltersPanel] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with parent data if updated externally
  useEffect(() => {
    if (data?.originalImage && data.originalImage !== originalImage) {
      setOriginalImage(data.originalImage);
    }
    if (data?.calibration) {
      if (data.calibration.rulerLengthMm) setRulerLengthMm(data.calibration.rulerLengthMm);
      if (data.calibration.point1) setPoint1(data.calibration.point1);
      if (data.calibration.point2) setPoint2(data.calibration.point2);
      if (typeof data.calibration.completed === 'boolean') {
        setCalibrationCompleted(data.calibration.completed);
      }
    }
  }, [data]);

  // Derived calibration calculations
  const pixelDistance = React.useMemo(() => {
    if (!point1 || !point2) return 0;
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, [point1, point2]);

  const scalePixelsPerMm = React.useMemo(() => {
    if (!pixelDistance || !rulerLengthMm || rulerLengthMm <= 0) return 0;
    return pixelDistance / rulerLengthMm;
  }, [pixelDistance, rulerLengthMm]);

  // Save calibration changes to parent data
  const updateCalibrationData = useCallback(
    (p1?: { x: number; y: number }, p2?: { x: number; y: number }, lenMm?: number) => {
      const activeP1 = p1 !== undefined ? p1 : point1;
      const activeP2 = p2 !== undefined ? p2 : point2;
      const activeLen = lenMm !== undefined ? lenMm : rulerLengthMm;

      let distPx = 0;
      if (activeP1 && activeP2) {
        const dx = activeP2.x - activeP1.x;
        const dy = activeP2.y - activeP1.y;
        distPx = Math.sqrt(dx * dx + dy * dy);
      }

      const ratio = distPx > 0 && activeLen > 0 ? distPx / activeLen : 0;
      const isDone = Boolean(activeP1 && activeP2 && ratio > 0);

      setCalibrationCompleted(isDone);

      const updatedModuleData: CephLandmarkModuleData = {
        ...data,
        originalImage,
        calibration: {
          scalePixelsPerMm: Math.round(ratio * 1000) / 1000,
          rulerLengthMm: activeLen,
          point1: activeP1,
          point2: activeP2,
          completed: isDone,
        },
        currentStep: activeStep,
      };

      onUpdateData?.(updatedModuleData);
    },
    [data, originalImage, point1, point2, rulerLengthMm, activeStep, onUpdateData]
  );

  // File Upload Handlers
  const processFile = useCallback(
    (file: File) => {
      if (!file) return;
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a valid image file (.jpg, .jpeg, or .png).');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setOriginalImage(dataUrl);
        setZoom(1);
        setPan({ x: 0, y: 0 });
        setBrightness(100);
        setContrast(100);
        setInvert(false);
        setRotation(0);
        setPoint1(undefined);
        setPoint2(undefined);
        setCalibrationCompleted(false);

        // Move to calibration step automatically
        setActiveStep('calibration');

        const updatedModuleData: CephLandmarkModuleData = {
          ...data,
          originalImage: dataUrl,
          uploadedAt: new Date().toISOString(),
          calibration: {
            scalePixelsPerMm: 0,
            rulerLengthMm: 10,
            completed: false,
          },
          currentStep: 'calibration',
        };
        onUpdateData?.(updatedModuleData);

        // Also add to investigations images if not already present
        if (onAddInvestigationImage) {
          const existingLatCeph = investigationsImages.find((img) => img.category === 'Lateral Ceph');
          if (!existingLatCeph) {
            onAddInvestigationImage({
              id: `ceph-${Date.now()}`,
              category: 'Lateral Ceph',
              title: 'Lateral Cephalogram',
              dataUrl,
              uploadedAt: new Date().toISOString(),
            });
          }
        }
      };
      reader.readAsDataURL(file);
    },
    [data, investigationsImages, onAddInvestigationImage, onUpdateData]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Select existing Lateral Ceph from patient investigations
  const existingCephImages = investigationsImages.filter((img) => img.category === 'Lateral Ceph');

  const handleSelectExistingCeph = (dataUrl: string) => {
    setOriginalImage(dataUrl);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveStep('calibration');

    const updatedModuleData: CephLandmarkModuleData = {
      ...data,
      originalImage: dataUrl,
      uploadedAt: new Date().toISOString(),
      calibration: {
        scalePixelsPerMm: 0,
        rulerLengthMm: 10,
        completed: false,
      },
      currentStep: 'calibration',
    };
    onUpdateData?.(updatedModuleData);
  };

  // Reset viewer parameters
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setBrightness(100);
    setContrast(100);
    setInvert(false);
    setRotation(0);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev * 1.25, 5));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev / 1.25, 0.3));

  const handleFitToScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleRotateCw = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (!originalImage) return;
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(prev * 1.1, 5));
    } else {
      setZoom((prev) => Math.max(prev / 1.1, 0.3));
    }
  };

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!originalImage) return;
    if (interactionMode === 'pan') {
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || interactionMode !== 'pan') return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // Image Click Handler for Calibration Point Placement
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (interactionMode !== 'calibrate' || !imgRef.current) return;

    const rect = imgRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const naturalWidth = imgRef.current.naturalWidth || rect.width;
    const naturalHeight = imgRef.current.naturalHeight || rect.height;

    const imgX = Math.round((clickX / rect.width) * naturalWidth);
    const imgY = Math.round((clickY / rect.height) * naturalHeight);

    if (!point1 || (point1 && point2)) {
      // Set Point 1
      const p1 = { x: imgX, y: imgY };
      setPoint1(p1);
      setPoint2(undefined);
      updateCalibrationData(p1, undefined, rulerLengthMm);
    } else {
      // Set Point 2
      const p2 = { x: imgX, y: imgY };
      setPoint2(p2);
      updateCalibrationData(point1, p2, rulerLengthMm);
    }
  };

  // Touch handlers for calibration and pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!originalImage || e.touches.length !== 1) return;
    if (interactionMode === 'pan') {
      setIsPanning(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isPanning || interactionMode !== 'pan' || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsPanning(false);
  };

  // Reset calibration points
  const handleResetCalibrationPoints = () => {
    setPoint1(undefined);
    setPoint2(undefined);
    updateCalibrationData(undefined, undefined, rulerLengthMm);
  };

  // Remove image
  const handleRemoveImage = () => {
    if (confirm('Are you sure you want to remove this cephalogram?')) {
      setOriginalImage(undefined);
      setPoint1(undefined);
      setPoint2(undefined);
      setCalibrationCompleted(false);
      setActiveStep('upload');

      const updatedModuleData: CephLandmarkModuleData = {
        ...data,
        originalImage: undefined,
        calibration: {
          scalePixelsPerMm: 0,
          rulerLengthMm: 10,
          completed: false,
        },
        currentStep: 'upload',
      };
      onUpdateData?.(updatedModuleData);
    }
  };

  // Handle step navigation inside Ceph Module
  const handleSelectStep = (
    step: 'upload' | 'calibration' | 'identification' | 'review' | 'geometry' | 'completed'
  ) => {
    if (step === 'upload') {
      setActiveStep('upload');
      return;
    }
    if (!originalImage) {
      alert('Please upload a cephalogram first.');
      return;
    }
    if (step === 'calibration') {
      setActiveStep('calibration');
      return;
    }
    if (!calibrationCompleted) {
      alert('Image calibration is mandatory before proceeding to landmark identification.');
      return;
    }
    setActiveStep(step);
  };

  return (
    <div className="w-full space-y-5 font-sans">
      {/* MODULE HEADER (Material Design 3 Dark Theme Accent) */}
      <div className="bg-[#0B1329] text-white rounded-[24px] p-5 border border-[#1E293B] shadow-md relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/30">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>OrthoCase 3.0 Module</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400 font-medium">
              {activeStep === 'upload' && 'Step 1 of 5 • Upload Cephalogram'}
              {activeStep === 'calibration' && 'Step 2 of 5 • Image Calibration'}
              {activeStep === 'identification' && 'Step 3 of 5 • Landmark Identification'}
              {activeStep === 'review' && 'Step 4 of 5 • Landmark Review'}
              {activeStep === 'geometry' && 'Step 5 of 5 • Geometry Engine'}
              {activeStep === 'completed' && 'Cephalometric Analysis Ready'}
            </span>
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {activeStep === 'upload' && 'Upload Cephalogram'}
              {activeStep === 'calibration' && 'Image Calibration'}
              {activeStep === 'identification' && 'Landmark Identification'}
              {activeStep === 'review' && 'Landmark Review'}
              {activeStep === 'geometry' && 'Geometry Engine (Planes & Reference Vectors)'}
              {activeStep === 'completed' && 'Cephalometric Analysis'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mt-1">
              {activeStep === 'upload' &&
                'Upload a high-resolution lateral cephalogram to begin digital analysis.'}
              {activeStep === 'calibration' &&
                'Mark 2 known points on the ruler scale and specify physical length in mm to calculate pixel ratio.'}
              {activeStep === 'identification' &&
                'Identify anatomical landmarks on the calibrated radiograph.'}
              {activeStep === 'review' &&
                'Verify and adjust landmark coordinates and inspect missing landmarks.'}
              {activeStep === 'geometry' &&
                'Automatically generate all cephalometric planes, vectors, and linear dimensions mathematically.'}
            </p>
          </div>
        </div>
      </div>

      {/* WORKFLOW PIPELINE BREADCRUMB / STEPS */}
      <div className="bg-white border border-slate-200/90 rounded-[20px] p-3 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max text-[11px] font-bold text-slate-600">
          <button
            type="button"
            onClick={() => handleSelectStep('upload')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              activeStep === 'upload'
                ? 'bg-[#071B49] text-white font-extrabold shadow-xs'
                : originalImage
                ? 'bg-blue-50 text-[#2563EB] border border-blue-200'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>1. Upload</span>
            {originalImage && <Check className="w-3 h-3 text-emerald-500 ml-0.5" />}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* STEP 2: CALIBRATION */}
          <button
            type="button"
            onClick={() => handleSelectStep('calibration')}
            disabled={!originalImage}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              !originalImage
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : activeStep === 'calibration'
                ? 'bg-[#071B49] text-white font-extrabold shadow-xs cursor-pointer'
                : calibrationCompleted
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-pointer'
                : 'bg-amber-50 text-amber-700 border border-amber-200 cursor-pointer'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>2. Calibration</span>
            {calibrationCompleted && <Check className="w-3 h-3 text-emerald-600 ml-0.5" />}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* STEP 3: LANDMARK ID */}
          <button
            type="button"
            onClick={() => handleSelectStep('identification')}
            disabled={!calibrationCompleted}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              !calibrationCompleted
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : activeStep === 'identification'
                ? 'bg-[#071B49] text-white font-extrabold shadow-xs cursor-pointer'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
            }`}
          >
            {!calibrationCompleted ? (
              <Lock className="w-3 h-3 text-slate-400" />
            ) : (
              <Target className="w-3.5 h-3.5" />
            )}
            <span>3. Landmark ID</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* STEP 4: REVIEW */}
          <button
            type="button"
            onClick={() => handleSelectStep('review')}
            disabled={!calibrationCompleted || !data?.landmarks || Object.keys(data.landmarks).length === 0}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              !calibrationCompleted || !data?.landmarks || Object.keys(data.landmarks).length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : activeStep === 'review'
                ? 'bg-[#071B49] text-white font-extrabold shadow-xs cursor-pointer'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>4. Review</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />

          {/* STEP 5: GEOMETRY ENGINE */}
          <button
            type="button"
            onClick={() => handleSelectStep('geometry')}
            disabled={!calibrationCompleted || !data?.landmarks || Object.keys(data.landmarks).length === 0}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 shrink-0 transition-all ${
              !calibrationCompleted || !data?.landmarks || Object.keys(data.landmarks).length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : activeStep === 'geometry'
                ? 'bg-[#071B49] text-white font-extrabold shadow-xs cursor-pointer'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>5. Geometry Engine</span>
          </button>
        </div>
      </div>

      {/* STEP 1: UPLOAD SCREEN */}
      {activeStep === 'upload' && (
        <div className="space-y-4">
          {!originalImage ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-[24px] p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
                isDraggingFile
                  ? 'border-[#2563EB] bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50/50'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div className="w-16 h-16 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shadow-2xs">
                <Upload className="w-8 h-8 text-[#2563EB]" />
              </div>

              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-extrabold text-[#071B49]">
                  Upload Lateral Cephalogram
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Drag and drop your high-resolution radiograph here, or click to browse files from your device.
                </p>
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-200">
                  <span>Supported Formats:</span>
                  <span className="text-[#2563EB]">JPG, JPEG, PNG</span>
                </div>
              </div>

              <button
                type="button"
                className="px-6 py-2.5 rounded-full bg-[#071B49] hover:bg-[#0A2668] text-white text-xs font-bold shadow-md shadow-[#071B49]/20 transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
              >
                <FileImage className="w-4 h-4" />
                <span>Browse Image File</span>
              </button>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-[24px] p-6 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h3 className="text-base font-extrabold text-[#071B49]">
                  Cephalogram Uploaded
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Pristine original image stored safely. Proceed to Step 2 for mandatory scale calibration.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4 text-slate-500" />
                  <span>Replace Image</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStep('calibration')}
                  className="px-6 py-2.5 rounded-xl bg-[#071B49] hover:bg-[#0A2668] text-white text-xs font-extrabold shadow-md transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
                >
                  <Ruler className="w-4 h-4 text-blue-300" />
                  <span>Proceed to Calibration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Existing Lateral Ceph Radiographs */}
          {existingCephImages.length > 0 && !originalImage && (
            <div className="bg-white border border-slate-200 rounded-[20px] p-4 shadow-2xs space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#2563EB]" />
                <span>Use Existing Radiograph from Patient Record</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {existingCephImages.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => handleSelectExistingCeph(img.dataUrl)}
                    className="group border border-slate-200 hover:border-[#2563EB] rounded-xl overflow-hidden p-2 text-left bg-slate-50 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <div className="w-full h-24 rounded-lg overflow-hidden bg-black flex items-center justify-center border border-slate-200">
                      <img
                        src={img.dataUrl}
                        alt={img.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[11px] font-bold text-[#071B49] truncate w-full text-center">
                      {img.title || 'Lateral Ceph'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: IMAGE CALIBRATION SCREEN */}
      {activeStep === 'calibration' && originalImage && (
        <div className="space-y-4">
          {/* CALIBRATION INSTRUCTION & STATUS CARD */}
          <div className="bg-white border border-slate-200/90 rounded-[24px] p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center border border-blue-100 shrink-0">
                  <Ruler className="w-5 h-5 text-[#2563EB]" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#071B49]">
                    Image Calibration Protocol
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Mark 2 known tick marks on the ruler scale visible on the radiograph.
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div>
                {calibrationCompleted ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Calibrated: {scalePixelsPerMm.toFixed(2)} px/mm</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-extrabold border border-amber-200 shadow-2xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Calibration Required</span>
                  </div>
                )}
              </div>
            </div>

            {/* CALIBRATION INPUTS & LOGIC PANEL */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Known Ruler Length Input */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-[16px] p-3 space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                  Known Ruler Length (mm)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    step="0.5"
                    value={rulerLengthMm}
                    onChange={(e) => {
                      const val = Math.max(1, parseFloat(e.target.value) || 10);
                      setRulerLengthMm(val);
                      updateCalibrationData(point1, point2, val);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm font-black text-[#071B49] focus:ring-2 focus:ring-[#2563EB] outline-none"
                  />
                  <span className="text-xs font-bold text-slate-500">mm</span>
                </div>
              </div>

              {/* Point Selection Status */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-[16px] p-3 space-y-1">
                <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                  Calibration Points
                </span>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Point 1:</span>
                    {point1 ? (
                      <span className="text-emerald-700 font-bold">
                        ({point1.x}, {point1.y})
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans italic">Not set</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Point 2:</span>
                    {point2 ? (
                      <span className="text-emerald-700 font-bold">
                        ({point2.x}, {point2.y})
                      </span>
                    ) : (
                      <span className="text-slate-400 font-sans italic">Not set</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Calculated Ratio Result */}
              <div className="bg-slate-50/80 border border-slate-200/80 rounded-[16px] p-3 space-y-1 flex flex-col justify-between">
                <span className="text-[11px] font-bold text-slate-600 block uppercase tracking-wider">
                  Pixel Scale Ratio
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-black text-[#071B49]">
                      {scalePixelsPerMm > 0 ? scalePixelsPerMm.toFixed(2) : '--'}
                    </span>
                    <span className="text-xs text-slate-500 font-bold ml-1">px/mm</span>
                  </div>

                  {(point1 || point2) && (
                    <button
                      type="button"
                      onClick={handleResetCalibrationPoints}
                      className="px-2.5 py-1 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                      title="Reset Points & Recalibrate"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Recalibrate</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* VIEWER TOOLBAR (With Mode Switch: Calibrate vs Pan) */}
          <div className="bg-[#0B1329] border border-[#1E293B] rounded-[20px] p-3 text-white shadow-md space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Interaction Mode Toggle */}
              <div className="flex items-center gap-1 bg-slate-800/90 p-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setInteractionMode('calibrate')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    interactionMode === 'calibrate'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Target className="w-3.5 h-3.5 text-blue-200" />
                  <span>Place Calibration Points</span>
                </button>

                <button
                  type="button"
                  onClick={() => setInteractionMode('pan')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    interactionMode === 'pan'
                      ? 'bg-[#2563EB] text-white shadow-xs'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Move className="w-3.5 h-3.5 text-blue-200" />
                  <span>Pan & Zoom</span>
                </button>
              </div>

              {/* View Control Tools */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer active:scale-95"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4 text-blue-300" />
                </button>

                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer active:scale-95"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4 text-blue-300" />
                </button>

                <button
                  type="button"
                  onClick={handleFitToScreen}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                  title="Fit Screen"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-slate-300" />
                  <span className="hidden sm:inline">Fit</span>
                </button>

                <button
                  type="button"
                  onClick={handleRotateCw}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer active:scale-95"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-4 h-4 text-blue-300" />
                </button>

                <button
                  type="button"
                  onClick={() => setInvert((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                    invert
                      ? 'bg-blue-600 text-white border border-blue-400'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title="Invert View"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Invert</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowFiltersPanel((v) => !v)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 ${
                    showFiltersPanel || brightness !== 100 || contrast !== 100
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                  }`}
                  title="Adjust Brightness & Contrast"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Adjust</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetView}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer active:scale-95"
                  title="Reset View"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Adjustment Sliders */}
            {showFiltersPanel && (
              <div className="bg-[#0D1836] border border-[#1E293B] rounded-[18px] p-3 text-white shadow-sm space-y-3 pt-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>Brightness</span>
                      </span>
                      <span className="font-mono text-blue-300">{brightness}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Contrast</span>
                      </span>
                      <span className="font-mono text-blue-300">{contrast}%</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* INTERACTIVE CALIBRATION CANVAS STAGE */}
          <div
            ref={containerRef}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-full h-[62vh] min-h-[440px] max-h-[680px] bg-[#030712] rounded-[24px] border-2 border-[#1E293B] relative overflow-hidden flex items-center justify-center select-none shadow-inner ${
              interactionMode === 'calibrate' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'
            }`}
            style={{
              backgroundImage:
                'radial-gradient(#1e293b 1px, transparent 1px), radial-gradient(#1e293b 1px, #030712 1px)',
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 10px 10px',
            }}
          >
            {/* TRANSFORMED CONTAINER FOR IMAGE + OVERLAYS */}
            <div
              className="relative transition-transform duration-75 ease-out touch-none flex items-center justify-center"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
              }}
            >
              {/* Pristine Cephalogram Image */}
              <img
                ref={imgRef}
                src={originalImage}
                alt="Lateral Cephalogram Calibration"
                draggable={false}
                onClick={handleImageClick}
                className="max-w-none shadow-2xl block"
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) ${
                    invert ? 'invert(100%)' : ''
                  }`,
                  maxHeight: '82vh',
                  maxWidth: '85vw',
                  objectFit: 'contain',
                }}
              />

              {/* OVERLAY SVG FOR CALIBRATION LINE & POINTS */}
              {imgRef.current && (
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-20"
                  viewBox={`0 0 ${imgRef.current.naturalWidth || 1000} ${
                    imgRef.current.naturalHeight || 1000
                  }`}
                >
                  {/* Line connecting Point 1 and Point 2 */}
                  {point1 && point2 && (
                    <g>
                      <line
                        x1={point1.x}
                        y1={point1.y}
                        x2={point2.x}
                        y2={point2.y}
                        stroke="#2563EB"
                        strokeWidth="4"
                        strokeDasharray="6 4"
                      />
                      <line
                        x1={point1.x}
                        y1={point1.y}
                        x2={point2.x}
                        y2={point2.y}
                        stroke="#60A5FA"
                        strokeWidth="2"
                      />

                      {/* Distance Label Box */}
                      <foreignObject
                        x={(point1.x + point2.x) / 2 - 60}
                        y={(point1.y + point2.y) / 2 - 20}
                        width="120"
                        height="36"
                      >
                        <div className="bg-[#071B49]/90 backdrop-blur-md text-white border border-blue-400 rounded-lg text-[11px] font-mono font-bold text-center py-1 px-1 shadow-md">
                          {rulerLengthMm} mm ({pixelDistance.toFixed(1)} px)
                        </div>
                      </foreignObject>
                    </g>
                  )}

                  {/* Point 1 Reticle Marker */}
                  {point1 && (
                    <g transform={`translate(${point1.x}, ${point1.y})`}>
                      <circle r="14" fill="#2563EB" fillOpacity="0.25" stroke="#3B82F6" strokeWidth="2" />
                      <circle r="4" fill="#60A5FA" />
                      <line x1="-18" y1="0" x2="18" y2="0" stroke="#60A5FA" strokeWidth="2" />
                      <line x1="0" y1="-18" x2="0" y2="18" stroke="#60A5FA" strokeWidth="2" />
                      <text
                        x="18"
                        y="-10"
                        fill="#60A5FA"
                        fontSize="14"
                        fontWeight="900"
                        fontFamily="sans-serif"
                      >
                        P1
                      </text>
                    </g>
                  )}

                  {/* Point 2 Reticle Marker */}
                  {point2 && (
                    <g transform={`translate(${point2.x}, ${point2.y})`}>
                      <circle r="14" fill="#10B981" fillOpacity="0.25" stroke="#10B981" strokeWidth="2" />
                      <circle r="4" fill="#34D399" />
                      <line x1="-18" y1="0" x2="18" y2="0" stroke="#34D399" strokeWidth="2" />
                      <line x1="0" y1="-18" x2="0" y2="18" stroke="#34D399" strokeWidth="2" />
                      <text
                        x="18"
                        y="-10"
                        fill="#34D399"
                        fontSize="14"
                        fontWeight="900"
                        fontFamily="sans-serif"
                      >
                        P2
                      </text>
                    </g>
                  )}
                </svg>
              )}
            </div>

            {/* HELPER OVERLAY */}
            <div className="absolute top-3 left-3 pointer-events-none flex flex-col gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/85 backdrop-blur-md text-blue-300 text-[10px] font-mono font-bold border border-slate-700/80 shadow-md">
                <Target className="w-3.5 h-3.5 text-blue-400" />
                <span>
                  {interactionMode === 'calibrate'
                    ? !point1
                      ? 'Click Point 1 on ruler start'
                      : !point2
                      ? 'Click Point 2 on ruler end'
                      : 'Points set! Adjust ruler length or recalibrate'
                    : 'Pan & Zoom mode active'}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: LANDMARK IDENTIFICATION WORKSPACE */}
      {activeStep === 'identification' && originalImage && (
        <LandmarkIdentificationWorkspace
          originalImage={originalImage}
          data={data}
          onUpdateData={onUpdateData}
          onProceedToReview={() => setActiveStep('review')}
          onBackToCalibration={() => setActiveStep('calibration')}
        />
      )}

      {/* STEP 4: LANDMARK REVIEW WORKSPACE */}
      {activeStep === 'review' && originalImage && (
        <LandmarkReviewWorkspace
          originalImage={originalImage}
          data={data}
          onUpdateData={onUpdateData}
          onProceedToAnalysis={() => setActiveStep('geometry')}
          onBackToIdentification={() => setActiveStep('identification')}
        />
      )}

      {/* STEP 5: GEOMETRY ENGINE WORKSPACE */}
      {activeStep === 'geometry' && originalImage && (
        <GeometryEngineWorkspace
          originalImage={originalImage}
          data={data}
          onUpdateData={onUpdateData}
          onProceedToAnalysis={() => {
            if (onNextTab) {
              onNextTab();
            } else {
              setActiveStep('completed');
            }
          }}
          onBackToReview={() => setActiveStep('review')}
        />
      )}

      {/* BOTTOM ACTION BAR (FOR STEPS 1 & 2 ONLY) */}
      {(activeStep === 'upload' || activeStep === 'calibration') && (
        <div className="bg-white border border-slate-200 rounded-[22px] p-4 shadow-sm flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (activeStep === 'calibration') setActiveStep('upload');
              else if (onPrevTab) onPrevTab();
            }}
            className="px-4 py-3 rounded-[16px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {activeStep === 'upload' && (
            <button
              type="button"
              disabled={!originalImage}
              onClick={() => setActiveStep('calibration')}
              className={`px-6 py-3.5 rounded-[18px] text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                originalImage
                  ? 'bg-[#071B49] hover:bg-[#0A2668] text-white shadow-[#071B49]/20 border border-[#0A2668]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
              }`}
            >
              <span>Proceed to Calibration</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {activeStep === 'calibration' && (
            <button
              type="button"
              disabled={!calibrationCompleted}
              onClick={() => {
                if (calibrationCompleted) {
                  setActiveStep('identification');
                }
              }}
              className={`px-6 py-3.5 rounded-[18px] text-sm font-extrabold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                calibrationCompleted
                  ? 'bg-[#071B49] hover:bg-[#0A2668] text-white shadow-[#071B49]/20 border border-[#0A2668]'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none border border-slate-200'
              }`}
              title={
                !calibrationCompleted
                  ? 'Please complete image calibration by setting Point 1 and Point 2 on the ruler.'
                  : 'Proceed to Landmark Identification'
              }
            >
              {!calibrationCompleted && <Lock className="w-4 h-4 text-slate-400" />}
              <span>Continue to Landmark ID</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TabCephLandmarkIdentification;

