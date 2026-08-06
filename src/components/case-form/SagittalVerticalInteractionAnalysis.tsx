import React, { useState, useEffect, useMemo } from 'react';
import {
  SagittalVerticalInteractionAnalysisData,
  SagittalVerticalTable1Data,
  UpperIncisorExposureTable2Data,
  Gender,
} from '../../types';
import { CephParameterRow } from './CephParameterRow';
import {
  Calculator,
  RotateCcw,
  Copy,
  Check,
  FileText,
  ChevronDown,
  ChevronUp,
  Sliders,
  Activity,
  Sparkles,
} from 'lucide-react';

export interface SagittalVerticalInteractionAnalysisProps {
  data?: SagittalVerticalInteractionAnalysisData;
  onChange?: (data: SagittalVerticalInteractionAnalysisData) => void;
  activeStage?: 'pre' | 'mid' | 'post';
  isOpen?: boolean;
  onToggle?: () => void;
  patientGender?: Gender;
  patientAge?: number | string;
}

export const STAGE_COLUMNS = [
  { key: 'preRx', label: 'Pre Rx' },
  { key: 'pGrMod', label: 'P.Gr. Mod' },
  { key: 'preIII', label: 'Pre III' },
  { key: 'postRx', label: 'Post Rx' },
  { key: 'retention', label: 'Retention' },
  { key: 'change', label: 'Change' },
] as const;

export type StageColKey = typeof STAGE_COLUMNS[number]['key'];

export const DEFAULT_TABLE_1: SagittalVerticalTable1Data = {
  sagittalUnaffectedByVertical: { preRx: '', pGrMod: '', preIII: '', postRx: '', retention: '', change: '' },
  sagittalCausedByVertical: { preRx: '', pGrMod: '', preIII: '', postRx: '', retention: '', change: '' },
  sagittalWorsenedByVertical: { preRx: '', pGrMod: '', preIII: '', postRx: '', retention: '', change: '' },
  sagittalCompensatedByVertical: { preRx: '', pGrMod: '', preIII: '', postRx: '', retention: '', change: '' },
};

export const DEFAULT_TABLE_2: UpperIncisorExposureTable2Data = {
  uiExposureRest: { preRx: '', pGrMod: '', preIII: '', postRx: '', retention: '', change: '' },
  uiExposureSmile: { preRx: '', pGrMod: '', preIII: '', postRx: '', retention: '', change: '' },
  ansToIncisor: { preRx: '', pGrMod: '', preIII: '', postRx: '', retention: '', change: '' },
  uLipLength: { preRx: '', pGrMod: '', preIII: '', postRx: '', retention: '', change: '' },
};

export const SAMPLE_TABLE_1: SagittalVerticalTable1Data = {
  sagittalUnaffectedByVertical: { preRx: 'Class I Skeletal Base', pGrMod: 'Class I', preIII: 'Class I', postRx: 'Class I', retention: 'Stable', change: '0' },
  sagittalCausedByVertical: { preRx: 'Clockwise Mandibular Rotation', pGrMod: 'Controlled', preIII: 'Normal', postRx: 'Improved', retention: 'Stable', change: '-2°' },
  sagittalWorsenedByVertical: { preRx: 'High Angle Divergence', pGrMod: 'Reduced', preIII: 'Normal', postRx: 'Harmonious', retention: 'Stable', change: '-3°' },
  sagittalCompensatedByVertical: { preRx: 'Lower Incisor Proclination', pGrMod: 'Unchanged', preIII: 'Uprighted', postRx: 'Normal', retention: 'Stable', change: '-4°' },
};

export const SAMPLE_TABLE_2: UpperIncisorExposureTable2Data = {
  uiExposureRest: { preRx: 5.5, pGrMod: 4.0, preIII: 3.5, postRx: 3.0, retention: 3.0, change: -2.5 },
  uiExposureSmile: { preRx: 11.0, pGrMod: 9.5, preIII: 9.0, postRx: 8.5, retention: 8.5, change: -2.5 },
  ansToIncisor: { preRx: 38.0, pGrMod: 36.5, preIII: 34.0, postRx: 33.0, retention: 33.0, change: -5.0 },
  uLipLength: { preRx: 21.0, pGrMod: 21.5, preIII: 22.0, postRx: 22.0, retention: 22.0, change: +1.0 },
};

/**
 * Rule-Based Auto-Inference Engine for Upper Incisor Exposure
 */
export function computeUpperIncisorInference(
  table2: UpperIncisorExposureTable2Data,
  colKey: StageColKey = 'preRx',
  gender: 'Male' | 'Female' = 'Male'
): {
  primaryInference: string;
  triggers: string[];
  isSkeletalExcess: boolean;
  isDentalExcess: boolean;
  isShortLip: boolean;
  severity: 'normal' | 'abnormal' | 'warning';
} {
  const restVal = Number(table2.uiExposureRest?.[colKey]);
  const smileVal = Number(table2.uiExposureSmile?.[colKey]);
  const ansVal = Number(table2.ansToIncisor?.[colKey]);
  const lipVal = Number(table2.uLipLength?.[colKey]);

  const hasRest = !isNaN(restVal) && table2.uiExposureRest?.[colKey] !== '';
  const hasSmile = !isNaN(smileVal) && table2.uiExposureSmile?.[colKey] !== '';
  const hasAns = !isNaN(ansVal) && table2.ansToIncisor?.[colKey] !== '';
  const hasLip = !isNaN(lipVal) && table2.uLipLength?.[colKey] !== '';

  const ansUpperThreshold = gender === 'Male' ? 36 : 33;
  const lipShortThreshold = gender === 'Male' ? 20 : 18;

  const isRestHigh = hasRest && restVal > 4;
  const isSmileHigh = hasSmile && smileVal > 10;
  const isAnsHigh = hasAns && ansVal > ansUpperThreshold;
  const isLipShort = hasLip && lipVal < lipShortThreshold;

  const triggers: string[] = [];
  if (isRestHigh) triggers.push(`UI rest exposure > 4mm (${restVal}mm)`);
  if (isSmileHigh) triggers.push(`UI smile exposure > 10mm (${smileVal}mm)`);
  if (isAnsHigh) triggers.push(`ANS to Incisor > ${ansUpperThreshold}mm (${ansVal}mm)`);
  if (isLipShort) triggers.push(`Upper lip length < ${lipShortThreshold}mm (${lipVal}mm)`);

  if (!isRestHigh && !isSmileHigh) {
    return {
      primaryInference: 'Normal Upper Incisor Exposure (Within Norms)',
      triggers,
      isSkeletalExcess: false,
      isDentalExcess: false,
      isShortLip: false,
      severity: 'normal',
    };
  }

  if (isAnsHigh && isLipShort) {
    return {
      primaryInference: 'Combination: Vertical Maxillary Excess (VME) AND Short Upper Lip',
      triggers,
      isSkeletalExcess: true,
      isDentalExcess: false,
      isShortLip: true,
      severity: 'abnormal',
    };
  }

  if (isAnsHigh) {
    return {
      primaryInference: 'Skeletal: Vertical Maxillary Excess (VME)',
      triggers,
      isSkeletalExcess: true,
      isDentalExcess: false,
      isShortLip: false,
      severity: 'abnormal',
    };
  }

  if (isLipShort) {
    return {
      primaryInference: 'Soft Tissue: Short Upper Lip Defect',
      triggers,
      isSkeletalExcess: false,
      isDentalExcess: false,
      isShortLip: true,
      severity: 'warning',
    };
  }

  return {
    primaryInference: 'Dentoalveolar: Excessive Upper Incisor Eruption',
    triggers,
    isSkeletalExcess: false,
    isDentalExcess: true,
    isShortLip: false,
    severity: 'abnormal',
  };
}

export const SagittalVerticalInteractionAnalysis: React.FC<SagittalVerticalInteractionAnalysisProps> = ({
  data,
  onChange,
  activeStage = 'pre',
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
  patientGender = 'Female',
  patientAge = 14,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(true);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const onToggle = () => {
    if (externalOnToggle) {
      externalOnToggle();
    } else {
      setInternalIsOpen((prev) => !prev);
    }
  };

  const [currentStageCol, setCurrentStageCol] = useState<StageColKey>(
    activeStage === 'pre' ? 'preRx' : activeStage === 'mid' ? 'pGrMod' : 'postRx'
  );

  const [selectedGender, setSelectedGender] = useState<Gender>(patientGender);

  const [table1, setTable1] = useState<SagittalVerticalTable1Data>(() => {
    if (data?.table1Interaction) return { ...DEFAULT_TABLE_1, ...data.table1Interaction };
    return DEFAULT_TABLE_1;
  });

  const [table2, setTable2] = useState<UpperIncisorExposureTable2Data>(() => {
    if (data?.table2UpperIncisorExposure) return { ...DEFAULT_TABLE_2, ...data.table2UpperIncisorExposure };
    return DEFAULT_TABLE_2;
  });

  const [palatalCortex, setPalatalCortex] = useState<string>(data?.palatalCortexSupport || 'Intact');
  const [symphysealCortex, setSymphysealCortex] = useState<string>(data?.symphysealCortexSupport || 'Adequate');
  const [skeletalAlteration, setSkeletalAlteration] = useState<string>(data?.skeletalAlterationNeeded || 'Needed');

  const numericAge = typeof patientAge === 'number' ? patientAge : parseInt(patientAge || '14', 10);
  const isGrowingAge = !isNaN(numericAge) && numericAge < 18;

  const [alterationNeededOption, setAlterationNeededOption] = useState<string>(
    data?.alterationNeededOption || (isGrowingAge ? 'Growth Modulation' : 'Surgical Orthodontics')
  );

  const [summarySagittal, setSummarySagittal] = useState<string>(data?.summarySagittal || '');
  const [summaryVertical, setSummaryVertical] = useState<string>(data?.summaryVertical || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.table1Interaction) setTable1((prev) => ({ ...prev, ...data.table1Interaction }));
    if (data?.table2UpperIncisorExposure) setTable2((prev) => ({ ...prev, ...data.table2UpperIncisorExposure }));
    if (data?.palatalCortexSupport) setPalatalCortex(data.palatalCortexSupport);
    if (data?.symphysealCortexSupport) setSymphysealCortex(data.symphysealCortexSupport);
    if (data?.skeletalAlterationNeeded) setSkeletalAlteration(data.skeletalAlterationNeeded);
    if (data?.alterationNeededOption) setAlterationNeededOption(data.alterationNeededOption);
    if (data?.summarySagittal) setSummarySagittal(data.summarySagittal);
    if (data?.summaryVertical) setSummaryVertical(data.summaryVertical);
  }, [data]);

  const inferenceResult = useMemo(() => {
    return computeUpperIncisorInference(table2, currentStageCol, selectedGender);
  }, [table2, currentStageCol, selectedGender]);

  const justification = useMemo(() => {
    return `Diagnostic Summary:
- Sagittal Reading: ${summarySagittal || 'Not specified'}
- Vertical Reading: ${summaryVertical || 'Not specified'}
- Upper Incisor Etiology: ${inferenceResult.primaryInference}
- Cortical Support: Palatal (${palatalCortex}), Symphyseal (${symphysealCortex})
- Skeletal Alteration: ${skeletalAlteration} (${alterationNeededOption})`;
  }, [summarySagittal, summaryVertical, inferenceResult, palatalCortex, symphysealCortex, skeletalAlteration, alterationNeededOption]);

  const notifyChange = (partial: Partial<SagittalVerticalInteractionAnalysisData>) => {
    if (!onChange) return;
    const currentInference = computeUpperIncisorInference(
      partial.table2UpperIncisorExposure || table2,
      currentStageCol,
      selectedGender
    );

    const fullData: SagittalVerticalInteractionAnalysisData = {
      table1Interaction: partial.table1Interaction || table1,
      table2UpperIncisorExposure: partial.table2UpperIncisorExposure || table2,
      excessExposureInference: currentInference.primaryInference,
      palatalCortexSupport: partial.palatalCortexSupport || palatalCortex,
      symphysealCortexSupport: partial.symphysealCortexSupport || symphysealCortex,
      skeletalAlterationNeeded: partial.skeletalAlterationNeeded || skeletalAlteration,
      alterationNeededOption: partial.alterationNeededOption || alterationNeededOption,
      summarySagittal: partial.summarySagittal !== undefined ? partial.summarySagittal : summarySagittal,
      summaryVertical: partial.summaryVertical !== undefined ? partial.summaryVertical : summaryVertical,
      justification: justification,
    };
    onChange(fullData);
  };

  const handleTable1Change = (
    rowKey: keyof SagittalVerticalTable1Data,
    colKey: StageColKey,
    val: string
  ) => {
    const updatedTable1 = {
      ...table1,
      [rowKey]: {
        ...table1[rowKey],
        [colKey]: val,
      },
    };
    setTable1(updatedTable1);
    notifyChange({ table1Interaction: updatedTable1 });
  };

  const handleTable2Change = (
    rowKey: keyof UpperIncisorExposureTable2Data,
    colKey: StageColKey,
    valStr: number | ''
  ) => {
    const updatedTable2 = {
      ...table2,
      [rowKey]: {
        ...table2[rowKey],
        [colKey]: valStr,
      },
    };
    setTable2(updatedTable2);
    notifyChange({ table2UpperIncisorExposure: updatedTable2 });
  };

  const handleReset = () => {
    setTable1(DEFAULT_TABLE_1);
    setTable2(DEFAULT_TABLE_2);
    setPalatalCortex('Intact');
    setSymphysealCortex('Adequate');
    setSkeletalAlteration('Needed');
    setAlterationNeededOption(isGrowingAge ? 'Growth Modulation' : 'Surgical Orthodontics');
    setSummarySagittal('');
    setSummaryVertical('');

    notifyChange({
      table1Interaction: DEFAULT_TABLE_1,
      table2UpperIncisorExposure: DEFAULT_TABLE_2,
      palatalCortexSupport: 'Intact',
      symphysealCortexSupport: 'Adequate',
      skeletalAlterationNeeded: 'Needed',
      alterationNeededOption: isGrowingAge ? 'Growth Modulation' : 'Surgical Orthodontics',
      summarySagittal: '',
      summaryVertical: '',
    });
  };

  const handleCopyJustification = () => {
    navigator.clipboard.writeText(justification);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const measuredCount = useMemo(() => {
    let count = 0;
    STAGE_COLUMNS.forEach((col) => {
      if (table2.uiExposureRest?.[col.key] !== '') count++;
      if (table2.uiExposureSmile?.[col.key] !== '') count++;
      if (table2.ansToIncisor?.[col.key] !== '') count++;
      if (table2.uLipLength?.[col.key] !== '') count++;
    });
    return count;
  }, [table2]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all w-full max-w-full">
      {/* Accordion Card Header */}
      <div
        onClick={onToggle}
        className="w-full p-3 sm:p-4 cursor-pointer hover:bg-slate-50 transition-colors space-y-2 border-b border-slate-100"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-1.5">
                Interaction Between Sagittal and Vertical Readings
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Worksheet
                </span>
              </h4>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Interactive Vertical Scroll Drum Picker • Sagittal-vertical coupling & upper incisor exposure
              </p>
            </div>
          </div>
          <div className="text-slate-500 shrink-0 p-1 rounded-lg hover:bg-slate-200/60 transition-colors">
            {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pl-0 sm:pl-10">
          <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
            <Activity className="w-3 h-3 text-teal-600" />
            {measuredCount}/24 Recorded
          </span>
        </div>
      </div>

      {/* Accordion Body Content */}
      {isOpen && (
        <div className="p-3 sm:p-5 space-y-6 bg-slate-50/50">
          {/* Top Stage Control Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Stage:
              </span>
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex-wrap">
                {STAGE_COLUMNS.map((col) => (
                  <button
                    key={col.key}
                    type="button"
                    onClick={() => setCurrentStageCol(col.key)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      currentStageCol === col.key
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {col.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>

          {/* Upper Incisor Exposure Parameters via CephParameterRow */}
          <div className="space-y-3">
            <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
              Upper Incisor Exposure Parameters ({STAGE_COLUMNS.find((c) => c.key === currentStageCol)?.label})
            </h5>
            <div className="grid grid-cols-1 gap-3">
              <CephParameterRow
                label="a) UI Exposure at Rest"
                norm="2 to 4 mm"
                value={table2.uiExposureRest?.[currentStageCol] ?? ''}
                onChange={(n) => handleTable2Change('uiExposureRest', currentStageCol, n)}
                unit="mm"
                min={0}
                max={15}
                step={0.5}
                inference={
                  table2.uiExposureRest?.[currentStageCol] !== '' && !isNaN(Number(table2.uiExposureRest?.[currentStageCol]))
                    ? Number(table2.uiExposureRest?.[currentStageCol]) > 4
                      ? { inference: 'Excessive Rest Exposure', status: 'abnormal' }
                      : { inference: 'Normal Rest Exposure', status: 'normal' }
                    : { inference: 'Not Measured', status: 'empty' }
                }
              />

              <CephParameterRow
                label="b) UI Exposure in Smile"
                norm="8 to 10 mm"
                value={table2.uiExposureSmile?.[currentStageCol] ?? ''}
                onChange={(n) => handleTable2Change('uiExposureSmile', currentStageCol, n)}
                unit="mm"
                min={0}
                max={20}
                step={0.5}
                inference={
                  table2.uiExposureSmile?.[currentStageCol] !== '' && !isNaN(Number(table2.uiExposureSmile?.[currentStageCol]))
                    ? Number(table2.uiExposureSmile?.[currentStageCol]) > 10
                      ? { inference: 'Excessive Smile Exposure (Gummy Smile)', status: 'abnormal' }
                      : { inference: 'Normal Smile Exposure', status: 'normal' }
                    : { inference: 'Not Measured', status: 'empty' }
                }
              />

              <CephParameterRow
                label="c) ANS to Incisor"
                norm={selectedGender === 'Male' ? '33 ± 3 mm' : '30 ± 3 mm'}
                value={table2.ansToIncisor?.[currentStageCol] ?? ''}
                onChange={(n) => handleTable2Change('ansToIncisor', currentStageCol, n)}
                unit="mm"
                min={15}
                max={50}
                step={0.5}
                inference={
                  table2.ansToIncisor?.[currentStageCol] !== '' && !isNaN(Number(table2.ansToIncisor?.[currentStageCol]))
                    ? Number(table2.ansToIncisor?.[currentStageCol]) > (selectedGender === 'Male' ? 36 : 33)
                      ? { inference: 'Increased ANS-Incisor Distance (VME)', status: 'abnormal' }
                      : { inference: 'Normal ANS-Incisor Distance', status: 'normal' }
                    : { inference: 'Not Measured', status: 'empty' }
                }
              />

              <CephParameterRow
                label="d) Upper Lip Length"
                norm={selectedGender === 'Male' ? '22 ± 2 mm' : '20 ± 2 mm'}
                value={table2.uLipLength?.[currentStageCol] ?? ''}
                onChange={(n) => handleTable2Change('uLipLength', currentStageCol, n)}
                unit="mm"
                min={10}
                max={35}
                step={0.5}
                inference={
                  table2.uLipLength?.[currentStageCol] !== '' && !isNaN(Number(table2.uLipLength?.[currentStageCol]))
                    ? Number(table2.uLipLength?.[currentStageCol]) < (selectedGender === 'Male' ? 20 : 18)
                      ? { inference: 'Short Upper Lip Defect', status: 'abnormal' }
                      : { inference: 'Normal Upper Lip Length', status: 'normal' }
                    : { inference: 'Not Measured', status: 'empty' }
                }
              />
            </div>
          </div>

          {/* Rule-Based Inference Box */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                Rule-Based Etiology Inference ({STAGE_COLUMNS.find((c) => c.key === currentStageCol)?.label})
              </h5>
              <button
                type="button"
                onClick={handleCopyJustification}
                className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Summary'}
              </button>
            </div>
            <p className="text-xs font-bold text-teal-800 bg-teal-50 p-3 rounded-lg border border-teal-200">
              {inferenceResult.primaryInference}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
