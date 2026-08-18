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
  Activity,
  Sparkles,
  ShieldAlert,
  Layers,
  ArrowRight,
  Stethoscope,
  Info,
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

export type StageColKey = (typeof STAGE_COLUMNS)[number]['key'];

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

export interface InteractionPreset {
  table1: SagittalVerticalTable1Data;
  table2: UpperIncisorExposureTable2Data;
  interactionCategory: 'unaffected' | 'caused_by' | 'worsened_by' | 'compensated_by';
  palatal: string;
  symphyseal: string;
  symphysealLocation: string;
  sagittalAlteration: 'Needed' | 'Not Needed';
  verticalAlteration: 'Needed' | 'Not Needed';
  skeletalAlteration: 'Needed' | 'Not Needed';
  pathway: 'Growth Modulation' | 'Surgical Orthodontics' | 'Normal Skeletal Relation' | 'Orthodontic Camouflage';
}

export const PRESET_CLASS_I: InteractionPreset = {
  table1: {
    sagittalUnaffectedByVertical: { preRx: 'Class I Skeletal Base (ANB 2°)', pGrMod: 'Class I', preIII: 'Class I', postRx: 'Class I Harmonious', retention: 'Stable', change: '0°' },
    sagittalCausedByVertical: { preRx: 'No vertical rotation impact', pGrMod: 'None', preIII: 'None', postRx: 'None', retention: 'Stable', change: '0°' },
    sagittalWorsenedByVertical: { preRx: 'Normodivergent pattern', pGrMod: 'Stable', preIII: 'Stable', postRx: 'Harmonious', retention: 'Stable', change: '0°' },
    sagittalCompensatedByVertical: { preRx: 'Normal dental compensation', pGrMod: 'Maintained', preIII: 'Maintained', postRx: 'Ideal Occlusion', retention: 'Stable', change: '0°' },
  },
  table2: {
    uiExposureRest: { preRx: 3.0, pGrMod: 3.0, preIII: 3.0, postRx: 3.0, retention: 3.0, change: 0 },
    uiExposureSmile: { preRx: 8.5, pGrMod: 8.5, preIII: 8.5, postRx: 8.5, retention: 8.5, change: 0 },
    ansToIncisor: { preRx: 30.5, pGrMod: 30.5, preIII: 30.5, postRx: 30.5, retention: 30.5, change: 0 },
    uLipLength: { preRx: 21.5, pGrMod: 21.5, preIII: 21.5, postRx: 21.5, retention: 21.5, change: 0 },
  },
  interactionCategory: 'unaffected',
  palatal: 'Adequate',
  symphyseal: 'Adequate',
  symphysealLocation: 'Both',
  sagittalAlteration: 'Not Needed',
  verticalAlteration: 'Not Needed',
  skeletalAlteration: 'Not Needed',
  pathway: 'Normal Skeletal Relation',
};

export const PRESET_CLASS_II_HYPER: InteractionPreset = {
  table1: {
    sagittalUnaffectedByVertical: { preRx: 'Retrognathic Mandible', pGrMod: 'Advancing', preIII: 'Controlled', postRx: 'Class I', retention: 'Stable', change: '+3mm' },
    sagittalCausedByVertical: { preRx: 'Posterior vertical excess rotates chin backward', pGrMod: 'Intruding molars', preIII: 'Autorotating', postRx: 'Harmonious', retention: 'Stable', change: '+2.5°' },
    sagittalWorsenedByVertical: { preRx: 'High Angle / Clockwise rotation exacerbating Class II profile', pGrMod: 'Vertical anchorage', preIII: 'FMA reduced', postRx: 'Controlled FMA', retention: 'Stable', change: '-3°' },
    sagittalCompensatedByVertical: { preRx: 'Lower incisors proclined to contact upper incisors', pGrMod: 'Uprighting', preIII: 'Normal torque', postRx: 'Ideal IMPA', retention: 'Stable', change: '-4°' },
  },
  table2: {
    uiExposureRest: { preRx: 5.5, pGrMod: 4.0, preIII: 3.5, postRx: 3.0, retention: 3.0, change: -2.5 },
    uiExposureSmile: { preRx: 11.5, pGrMod: 9.5, preIII: 9.0, postRx: 8.5, retention: 8.5, change: -3.0 },
    ansToIncisor: { preRx: 38.0, pGrMod: 36.0, preIII: 34.0, postRx: 33.0, retention: 33.0, change: -5.0 },
    uLipLength: { preRx: 19.5, pGrMod: 20.5, preIII: 21.5, postRx: 22.0, retention: 22.0, change: +2.5 },
  },
  interactionCategory: 'worsened_by',
  palatal: 'Thin Cortex',
  symphyseal: 'Narrow Symphysis',
  symphysealLocation: 'Mandible',
  sagittalAlteration: 'Needed',
  verticalAlteration: 'Needed',
  skeletalAlteration: 'Needed',
  pathway: 'Growth Modulation',
};

export const PRESET_CLASS_III_HYPO: InteractionPreset = {
  table1: {
    sagittalUnaffectedByVertical: { preRx: 'Mild Class III Skeletal Base (ANB -1°)', pGrMod: 'Protraction', preIII: 'Class I', postRx: 'Class I', retention: 'Stable', change: '+2°' },
    sagittalCausedByVertical: { preRx: 'Counter-clockwise mandibular autorotation projecting chin forward', pGrMod: 'Bite opening', preIII: 'Class I', postRx: 'Harmonious', retention: 'Stable', change: '+1.5°' },
    sagittalWorsenedByVertical: { preRx: 'Low angle hypodivergence', pGrMod: 'Leveling', preIII: 'Controlled', postRx: 'Normal FMA', retention: 'Stable', change: '+2°' },
    sagittalCompensatedByVertical: { preRx: 'Retroclined lower incisors / Proclined upper incisors', pGrMod: 'Decompensation', preIII: 'Normal torque', postRx: 'Positive overjet', retention: 'Stable', change: '+3mm' },
  },
  table2: {
    uiExposureRest: { preRx: 2.0, pGrMod: 2.5, preIII: 3.0, postRx: 3.0, retention: 3.0, change: +1.0 },
    uiExposureSmile: { preRx: 7.5, pGrMod: 8.5, preIII: 9.0, postRx: 9.0, retention: 9.0, change: +1.5 },
    ansToIncisor: { preRx: 28.0, pGrMod: 29.5, preIII: 31.0, postRx: 31.0, retention: 31.0, change: +3.0 },
    uLipLength: { preRx: 22.0, pGrMod: 22.0, preIII: 22.0, postRx: 22.0, retention: 22.0, change: 0 },
  },
  interactionCategory: 'caused_by',
  palatal: 'Adequate',
  symphyseal: 'Thin Cortex',
  symphysealLocation: 'Mandible',
  sagittalAlteration: 'Needed',
  verticalAlteration: 'Not Needed',
  skeletalAlteration: 'Needed',
  pathway: 'Orthodontic Camouflage',
};

/**
 * Rule-Based Auto-Inference Engine for Upper Incisor Exposure & Interaction
 */
export function computeUpperIncisorInference(
  table2: UpperIncisorExposureTable2Data,
  colKey: StageColKey = 'preRx',
  gender: 'Male' | 'Female' = 'Male'
): {
  primaryInference: string;
  causeType: 'Vertical skeletal excess' | 'Vertical dental excess' | 'Short upper lip' | 'Combination' | 'Normal';
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
      primaryInference: 'Normal Upper Incisor Exposure (Harmonious Rest & Smile Display)',
      causeType: 'Normal',
      triggers,
      isSkeletalExcess: false,
      isDentalExcess: false,
      isShortLip: false,
      severity: 'normal',
    };
  }

  if (isAnsHigh && isLipShort) {
    return {
      primaryInference: 'Excess Exposure Etiology: Combination of Vertical Skeletal Excess (VME) AND Short Upper Lip',
      causeType: 'Combination',
      triggers,
      isSkeletalExcess: true,
      isDentalExcess: false,
      isShortLip: true,
      severity: 'abnormal',
    };
  }

  if (isAnsHigh) {
    return {
      primaryInference: 'Excess Exposure Etiology: Vertical Skeletal Excess (VME / Elongated Anterior Maxilla)',
      causeType: 'Vertical skeletal excess',
      triggers,
      isSkeletalExcess: true,
      isDentalExcess: false,
      isShortLip: false,
      severity: 'abnormal',
    };
  }

  if (isLipShort) {
    return {
      primaryInference: 'Excess Exposure Etiology: Short Upper Lip Philtrum Incompetence',
      causeType: 'Short upper lip',
      triggers,
      isSkeletalExcess: false,
      isDentalExcess: false,
      isShortLip: true,
      severity: 'warning',
    };
  }

  return {
    primaryInference: 'Excess Exposure Etiology: Vertical Dental Excess (Dentoalveolar Extrusion of Incisors)',
    causeType: 'Vertical dental excess',
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

  const [selectedInteractionCategory, setSelectedInteractionCategory] = useState<string>(
    data?.selectedInteractionCategory || 'unaffected'
  );

  const [palatalCortex, setPalatalCortex] = useState<string>(data?.palatalCortexSupport || 'Adequate');
  const [symphysealCortex, setSymphysealCortex] = useState<string>(data?.symphysealCortexSupport || 'Adequate');
  const [symphysealLocation, setSymphysealLocation] = useState<string>(data?.symphysealCortexLocation || 'Mandible');

  const [sagittalAlteration, setSagittalAlteration] = useState<'Needed' | 'Not Needed' | ''>(
    data?.sagittalAlterationNeeded || 'Needed'
  );
  const [verticalAlteration, setVerticalAlteration] = useState<'Needed' | 'Not Needed' | ''>(
    data?.verticalAlterationNeeded || 'Not Needed'
  );
  const [skeletalAlteration, setSkeletalAlteration] = useState<'Needed' | 'Not Needed' | ''>(
    data?.skeletalAlterationNeeded || 'Needed'
  );

  const numericAge = typeof patientAge === 'number' ? patientAge : parseInt(String(patientAge || '14'), 10);
  const isGrowingAge = !isNaN(numericAge) && numericAge < 17;

  const [growthStatus, setGrowthStatus] = useState<string>(
    data?.growthStatus || (isGrowingAge ? 'Actively Growing' : 'Non-Growing / Adult')
  );

  const [selectedPathway, setSelectedPathway] = useState<string>(
    data?.selectedPathway ||
      (skeletalAlteration === 'Needed'
        ? isGrowingAge
          ? 'Growth Modulation'
          : 'Surgical Orthodontics'
        : 'Normal Skeletal Relation')
  );

  const [customJustification, setCustomJustification] = useState<string>(data?.justification || '');
  const [summarySagittal, setSummarySagittal] = useState<string>(data?.summarySagittal || '');
  const [summaryVertical, setSummaryVertical] = useState<string>(data?.summaryVertical || '');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.table1Interaction) setTable1((prev) => ({ ...prev, ...data.table1Interaction }));
    if (data?.table2UpperIncisorExposure) setTable2((prev) => ({ ...prev, ...data.table2UpperIncisorExposure }));
    if (data?.selectedInteractionCategory) setSelectedInteractionCategory(data.selectedInteractionCategory);
    if (data?.palatalCortexSupport) setPalatalCortex(data.palatalCortexSupport);
    if (data?.symphysealCortexSupport) setSymphysealCortex(data.symphysealCortexSupport);
    if (data?.symphysealCortexLocation) setSymphysealLocation(data.symphysealCortexLocation);
    if (data?.sagittalAlterationNeeded) setSagittalAlteration(data.sagittalAlterationNeeded);
    if (data?.verticalAlterationNeeded) setVerticalAlteration(data.verticalAlterationNeeded);
    if (data?.skeletalAlterationNeeded) setSkeletalAlteration(data.skeletalAlterationNeeded);
    if (data?.selectedPathway) setSelectedPathway(data.selectedPathway);
    if (data?.growthStatus) setGrowthStatus(data.growthStatus);
    if (data?.justification) setCustomJustification(data.justification);
    if (data?.summarySagittal) setSummarySagittal(data.summarySagittal);
    if (data?.summaryVertical) setSummaryVertical(data.summaryVertical);
  }, [data]);

  const inferenceResult = useMemo(() => {
    return computeUpperIncisorInference(table2, currentStageCol, selectedGender);
  }, [table2, currentStageCol, selectedGender]);

  // Auto-calculated master justification
  const autoGeneratedJustification = useMemo(() => {
    let interactionDesc = 'Sagittal discrepancy is unaffected by vertical divergence.';
    if (selectedInteractionCategory === 'caused_by') {
      interactionDesc = 'Sagittal discrepancy is primarily caused by vertical rotational divergence (backward or forward autorotation).';
    } else if (selectedInteractionCategory === 'worsened_by') {
      interactionDesc = 'Sagittal discrepancy is aggravated/worsened by steep mandibular plane / hyperdivergent clockwise rotation.';
    } else if (selectedInteractionCategory === 'compensated_by') {
      interactionDesc = 'Sagittal discrepancy is masked or compensated by counter-clockwise mandibular autorotation or dental compensation.';
    }

    const boneLimits = `Alveolar cortical boundaries: Palatal cortex (${palatalCortex}), Symphyseal cortex (${symphysealCortex} in ${symphysealLocation}).`;

    const modalityDesc =
      skeletalAlteration === 'Needed'
        ? selectedPathway === 'Growth Modulation'
          ? `Skeletal alteration indicated via Growth Modulation (${growthStatus}) targeting orthopedic jaw redirection.`
          : `Skeletal alteration indicated via Orthognathic Surgery (${growthStatus}) due to severity exceeding biological limits.`
        : selectedPathway === 'Orthodontic Camouflage'
        ? `Skeletal alteration not required; managed by Orthodontic Camouflage (dental compensation & selective retraction).`
        : `Skeletal alteration not required; harmonious basal relationship managed by routine dental alignment.`;

    return `Diagnostic Master Rationale:
1. Sagittal-Vertical Interplay: ${interactionDesc}
2. Upper Incisor Exposure: ${inferenceResult.primaryInference} (Rest: ${table2.uiExposureRest?.[currentStageCol] || '-'} mm, Smile: ${table2.uiExposureSmile?.[currentStageCol] || '-'} mm, ANS-UI: ${table2.ansToIncisor?.[currentStageCol] || '-'} mm, Lip Length: ${table2.uLipLength?.[currentStageCol] || '-'} mm).
3. Periodontal Safety: ${boneLimits}
4. Treatment Decision: ${modalityDesc}`;
  }, [
    selectedInteractionCategory,
    inferenceResult,
    table2,
    currentStageCol,
    palatalCortex,
    symphysealCortex,
    symphysealLocation,
    skeletalAlteration,
    selectedPathway,
    growthStatus,
  ]);

  const activeJustification = customJustification || autoGeneratedJustification;

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
      selectedInteractionCategory: (partial.selectedInteractionCategory !== undefined ? partial.selectedInteractionCategory : selectedInteractionCategory) as any,
      excessExposureInference: currentInference.primaryInference,
      excessExposureCause: currentInference.causeType,
      palatalCortexSupport: partial.palatalCortexSupport || palatalCortex,
      symphysealCortexSupport: partial.symphysealCortexSupport || symphysealCortex,
      symphysealCortexLocation: partial.symphysealCortexLocation || symphysealLocation,
      sagittalAlterationNeeded: partial.sagittalAlterationNeeded || sagittalAlteration,
      verticalAlterationNeeded: partial.verticalAlterationNeeded || verticalAlteration,
      skeletalAlterationNeeded: partial.skeletalAlterationNeeded || skeletalAlteration,
      alterationNeededOption: (partial.selectedPathway === 'Growth Modulation' || partial.selectedPathway === 'Surgical Orthodontics' ? partial.selectedPathway : '') as any,
      alterationNotNeededOption: (partial.selectedPathway === 'Normal Skeletal Relation' || partial.selectedPathway === 'Orthodontic Camouflage' ? partial.selectedPathway : '') as any,
      selectedPathway: (partial.selectedPathway !== undefined ? partial.selectedPathway : selectedPathway) as any,
      growthStatus: (partial.growthStatus !== undefined ? partial.growthStatus : growthStatus) as any,
      summarySagittal: partial.summarySagittal !== undefined ? partial.summarySagittal : summarySagittal,
      summaryVertical: partial.summaryVertical !== undefined ? partial.summaryVertical : summaryVertical,
      justification: partial.justification !== undefined ? partial.justification : activeJustification,
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

  const handleLoadPreset = (preset: InteractionPreset) => {
    setTable1(preset.table1);
    setTable2(preset.table2);
    setSelectedInteractionCategory(preset.interactionCategory);
    setPalatalCortex(preset.palatal);
    setSymphysealCortex(preset.symphyseal);
    setSymphysealLocation(preset.symphysealLocation);
    setSagittalAlteration(preset.sagittalAlteration);
    setVerticalAlteration(preset.verticalAlteration);
    setSkeletalAlteration(preset.skeletalAlteration);
    setSelectedPathway(preset.pathway);
    setCustomJustification('');

    notifyChange({
      table1Interaction: preset.table1,
      table2UpperIncisorExposure: preset.table2,
      selectedInteractionCategory: preset.interactionCategory as any,
      palatalCortexSupport: preset.palatal,
      symphysealCortexSupport: preset.symphyseal,
      symphysealCortexLocation: preset.symphysealLocation,
      sagittalAlterationNeeded: preset.sagittalAlteration,
      verticalAlterationNeeded: preset.verticalAlteration,
      skeletalAlterationNeeded: preset.skeletalAlteration,
      selectedPathway: preset.pathway,
      justification: '',
    });
  };

  const handleReset = () => {
    setTable1(DEFAULT_TABLE_1);
    setTable2(DEFAULT_TABLE_2);
    setSelectedInteractionCategory('unaffected');
    setPalatalCortex('Adequate');
    setSymphysealCortex('Adequate');
    setSymphysealLocation('Mandible');
    setSagittalAlteration('Needed');
    setVerticalAlteration('Not Needed');
    setSkeletalAlteration('Needed');
    setSelectedPathway(isGrowingAge ? 'Growth Modulation' : 'Surgical Orthodontics');
    setCustomJustification('');
    setSummarySagittal('');
    setSummaryVertical('');

    notifyChange({
      table1Interaction: DEFAULT_TABLE_1,
      table2UpperIncisorExposure: DEFAULT_TABLE_2,
      selectedInteractionCategory: 'unaffected',
      palatalCortexSupport: 'Adequate',
      symphysealCortexSupport: 'Adequate',
      symphysealCortexLocation: 'Mandible',
      sagittalAlterationNeeded: 'Needed',
      verticalAlterationNeeded: 'Not Needed',
      skeletalAlterationNeeded: 'Needed',
      selectedPathway: isGrowingAge ? 'Growth Modulation' : 'Surgical Orthodontics',
      justification: '',
      summarySagittal: '',
      summaryVertical: '',
    });
  };

  const handleCopyJustification = () => {
    navigator.clipboard.writeText(activeJustification);
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
                <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full">
                  Sheet 2 Worksheet
                </span>
              </h4>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                Coupling dynamics, Upper Incisor Exposure Etiology, Alveolar Cortical Boundaries & Treatment Pathway Tree
              </p>
            </div>
          </div>
          <div className="text-slate-500 shrink-0 p-1 rounded-lg hover:bg-slate-200/60 transition-colors">
            {isOpen ? <ChevronUp className="w-5 h-5 text-slate-600" /> : <ChevronDown className="w-5 h-5 text-slate-600" />}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pl-0 sm:pl-10">
          <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md text-[11px]">
            <Activity className="w-3 h-3 text-teal-600" />
            {measuredCount}/24 Recorded
          </span>
          <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded-md">
            Pathway: {selectedPathway || 'Not Selected'}
          </span>
        </div>
      </div>

      {/* Accordion Body Content */}
      {isOpen && (
        <div className="p-3 sm:p-5 space-y-6 bg-slate-50/50">
          {/* Top Stage Control Toolbar & Presets */}
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
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
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

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                Presets:
              </span>
              <button
                type="button"
                onClick={() => handleLoadPreset(PRESET_CLASS_I)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Class I Balanced
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset(PRESET_CLASS_II_HYPER)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Class II Hyperdivergent
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset(PRESET_CLASS_III_HYPO)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Class III Hypodivergent
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
          </div>

          {/* 1. SAGITTAL AND VERTICAL INTERACTION ROWS (4 CATEGORIES) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  1. Sagittal & Vertical Interaction Categories
                </h5>
                <p className="text-[11px] text-slate-500 font-medium">
                  Select primary clinical coupling mechanism and document stage values
                </p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Stage: {STAGE_COLUMNS.find((c) => c.key === currentStageCol)?.label}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Row a: Sagittal unaffected by Vertical */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  selectedInteractionCategory === 'unaffected'
                    ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="interaction_category"
                    checked={selectedInteractionCategory === 'unaffected'}
                    onChange={() => {
                      setSelectedInteractionCategory('unaffected');
                      notifyChange({ selectedInteractionCategory: 'unaffected' });
                    }}
                    className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        a) Sagittal Unaffected by Vertical
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.2 rounded-md">
                        Independent
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Sagittal skeletal base relationship develops independently of vertical rotation.
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Class I Skeletal Base (ANB 2°)"
                      value={table1.sagittalUnaffectedByVertical?.[currentStageCol] || ''}
                      onChange={(e) =>
                        handleTable1Change('sagittalUnaffectedByVertical', currentStageCol, e.target.value)
                      }
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </label>
              </div>

              {/* Row b: Sagittal caused by Vertical */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  selectedInteractionCategory === 'caused_by'
                    ? 'border-blue-500 bg-blue-50/70 ring-1 ring-blue-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="interaction_category"
                    checked={selectedInteractionCategory === 'caused_by'}
                    onChange={() => {
                      setSelectedInteractionCategory('caused_by');
                      notifyChange({ selectedInteractionCategory: 'caused_by' });
                    }}
                    className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        b) Sagittal Caused by Vertical
                      </span>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.2 rounded-md">
                        Rotational Origin
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      AP discrepancy is secondary to vertical rotational divergence (e.g. chin retrusion from posterior excess).
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Clockwise Mandibular Rotation causing Class II"
                      value={table1.sagittalCausedByVertical?.[currentStageCol] || ''}
                      onChange={(e) =>
                        handleTable1Change('sagittalCausedByVertical', currentStageCol, e.target.value)
                      }
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </label>
              </div>

              {/* Row c: Sagittal worsened by Vertical */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  selectedInteractionCategory === 'worsened_by'
                    ? 'border-rose-500 bg-rose-50/70 ring-1 ring-rose-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="interaction_category"
                    checked={selectedInteractionCategory === 'worsened_by'}
                    onChange={() => {
                      setSelectedInteractionCategory('worsened_by');
                      notifyChange({ selectedInteractionCategory: 'worsened_by' });
                    }}
                    className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        c) Sagittal Worsened by Vertical
                      </span>
                      <span className="text-[10px] font-semibold text-rose-700 bg-rose-100/80 px-2 py-0.2 rounded-md">
                        Aggravating
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Pre-existing sagittal malocclusion is exacerbated by steep mandibular angle or hyperdivergence.
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. High Angle FMA 32° worsening retrognathic mandible"
                      value={table1.sagittalWorsenedByVertical?.[currentStageCol] || ''}
                      onChange={(e) =>
                        handleTable1Change('sagittalWorsenedByVertical', currentStageCol, e.target.value)
                      }
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </label>
              </div>

              {/* Row d: Sagittal compensated by Vertical */}
              <div
                className={`p-3 rounded-xl border transition-all ${
                  selectedInteractionCategory === 'compensated_by'
                    ? 'border-purple-500 bg-purple-50/70 ring-1 ring-purple-500/30'
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/60'
                }`}
              >
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="interaction_category"
                    checked={selectedInteractionCategory === 'compensated_by'}
                    onChange={() => {
                      setSelectedInteractionCategory('compensated_by');
                      notifyChange({ selectedInteractionCategory: 'compensated_by' });
                    }}
                    className="mt-0.5 w-4 h-4 text-teal-600 focus:ring-teal-500"
                  />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        d) Sagittal Compensated by Vertical
                      </span>
                      <span className="text-[10px] font-semibold text-purple-700 bg-purple-100/80 px-2 py-0.2 rounded-md">
                        Masked / Buffer
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      Skeletal defect is masked by counter-clockwise autorotation or dental pro/retroclination.
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. Hypodivergence / Deep bite masking Class II base"
                      value={table1.sagittalCompensatedByVertical?.[currentStageCol] || ''}
                      onChange={(e) =>
                        handleTable1Change('sagittalCompensatedByVertical', currentStageCol, e.target.value)
                      }
                      className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* 2. UPPER INCISOR EXPOSURE PARAMETERS (TABLE 2) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 px-1 border-l-3 border-teal-600 pl-2">
                2. Upper Incisor Exposure Parameters ({STAGE_COLUMNS.find((c) => c.key === currentStageCol)?.label})
              </h5>
              <span className="text-[11px] text-slate-500 font-medium">
                Norms adjusted for: <strong className="text-slate-800">{selectedGender}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <CephParameterRow
                label="a) Upper Incisor Exposure at Rest"
                norm={selectedGender === 'Female' ? '3.0 to 5.0 mm (3.5 mm)' : '2.0 to 4.0 mm (2.5 mm)'}
                value={table2.uiExposureRest?.[currentStageCol] ?? ''}
                onChange={(n) => handleTable2Change('uiExposureRest', currentStageCol, n)}
                unit="mm"
                min={0}
                max={15}
                step={0.5}
                inference={
                  table2.uiExposureRest?.[currentStageCol] !== '' && !isNaN(Number(table2.uiExposureRest?.[currentStageCol]))
                    ? Number(table2.uiExposureRest?.[currentStageCol]) > 4
                      ? { inference: 'Excessive Rest Exposure (Gingival Excess Risk)', status: 'abnormal' }
                      : Number(table2.uiExposureRest?.[currentStageCol]) < (selectedGender === 'Female' ? 2 : 1)
                      ? { inference: 'Inadequate Rest Exposure (Hidden Incisors)', status: 'abnormal' }
                      : { inference: 'Ideal Rest Exposure', status: 'normal' }
                    : { inference: 'Not Measured', status: 'empty' }
                }
              />

              <CephParameterRow
                label="b) Upper Incisor Exposure in Smile"
                norm="8.0 to 10.0 mm (100% crown + 0-2mm gingiva)"
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
                      : Number(table2.uiExposureSmile?.[currentStageCol]) < 7
                      ? { inference: 'Reduced Smile Display (Incomplete Arc)', status: 'abnormal' }
                      : { inference: 'Harmonious Consonant Smile Display', status: 'normal' }
                    : { inference: 'Not Measured', status: 'empty' }
                }
              />

              <CephParameterRow
                label="c) ANS to Incisor (Upper Dentoalveolar Height)"
                norm={selectedGender === 'Male' ? '33 ± 3 mm (30 - 36 mm)' : '30 ± 3 mm (27 - 33 mm)'}
                value={table2.ansToIncisor?.[currentStageCol] ?? ''}
                onChange={(n) => handleTable2Change('ansToIncisor', currentStageCol, n)}
                unit="mm"
                min={15}
                max={50}
                step={0.5}
                inference={
                  table2.ansToIncisor?.[currentStageCol] !== '' && !isNaN(Number(table2.ansToIncisor?.[currentStageCol]))
                    ? Number(table2.ansToIncisor?.[currentStageCol]) > (selectedGender === 'Male' ? 36 : 33)
                      ? { inference: 'Vertical Maxillary Dentoalveolar Excess', status: 'abnormal' }
                      : Number(table2.ansToIncisor?.[currentStageCol]) < (selectedGender === 'Male' ? 30 : 27)
                      ? { inference: 'Vertical Maxillary Deficiency', status: 'abnormal' }
                      : { inference: 'Normal Anterior Dentoalveolar Height', status: 'normal' }
                    : { inference: 'Not Measured', status: 'empty' }
                }
              />

              <CephParameterRow
                label="d) Upper Lip Length (Philtrum Height Sn-Stms)"
                norm={selectedGender === 'Male' ? '22 ± 2 mm (20 - 24 mm)' : '20 ± 2 mm (18 - 22 mm)'}
                value={table2.uLipLength?.[currentStageCol] ?? ''}
                onChange={(n) => handleTable2Change('uLipLength', currentStageCol, n)}
                unit="mm"
                min={10}
                max={35}
                step={0.5}
                inference={
                  table2.uLipLength?.[currentStageCol] !== '' && !isNaN(Number(table2.uLipLength?.[currentStageCol]))
                    ? Number(table2.uLipLength?.[currentStageCol]) < (selectedGender === 'Male' ? 20 : 18)
                      ? { inference: 'Short Upper Lip Defect (Philtrum Incompetence)', status: 'abnormal' }
                      : Number(table2.uLipLength?.[currentStageCol]) > (selectedGender === 'Male' ? 24 : 22)
                      ? { inference: 'Long Upper Lip (Curtains Incisor Display)', status: 'abnormal' }
                      : { inference: 'Harmonious Upper Lip Length', status: 'normal' }
                    : { inference: 'Not Measured', status: 'empty' }
                }
              />
            </div>
          </div>

          {/* 3. AUTOMATED DIFFERENTIAL DIAGNOSIS BOX FOR EXCESS EXPOSURE */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-teal-600" />
                3. Excess Incisor Exposure Differential Etiology Engine
              </h5>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                inferenceResult.causeType === 'Vertical skeletal excess'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : inferenceResult.causeType === 'Vertical dental excess'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : inferenceResult.causeType === 'Short upper lip'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : inferenceResult.causeType === 'Combination'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {inferenceResult.causeType}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-teal-50/70 border border-teal-200/80 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-teal-900">
                  {inferenceResult.primaryInference}
                </span>
              </div>
              {inferenceResult.triggers.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-teal-200/50">
                  <span className="text-[10px] font-bold text-teal-800 uppercase">Diagnostic Triggers:</span>
                  {inferenceResult.triggers.map((trig, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold bg-white/90 text-teal-900 px-2 py-0.5 rounded-md border border-teal-300 shadow-2xs"
                    >
                      {trig}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 4. ALVEOLAR CORTICAL SUPPORT & PERIODONTAL BOUNDARIES */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-600" />
                4. Alveolar Support to Incisors (Periodontal Limits)
              </h5>
              <span className="text-[10px] text-slate-500 font-medium">Biological boundaries of tooth movement</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Palatal Cortex */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">a) Palatal Cortex Support</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    palatalCortex.includes('Thin') || palatalCortex.includes('Risk') || palatalCortex.includes('Dehisced')
                      ? 'bg-rose-100 text-rose-800 border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {palatalCortex}
                  </span>
                </div>
                <select
                  value={palatalCortex}
                  onChange={(e) => {
                    setPalatalCortex(e.target.value);
                    notifyChange({ palatalCortexSupport: e.target.value });
                  }}
                  className="w-full text-xs font-semibold px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                >
                  <option value="Adequate">Adequate / Intact Palatal Cortex</option>
                  <option value="Intact">Intact / Normal Cortical Plate</option>
                  <option value="Thin Cortex">Thin Palatal Cortex (Torque Caution)</option>
                  <option value="High Fenestration Risk">High Fenestration Risk during Retraction</option>
                  <option value="Dehisced">Dehisced / Reduced Palatal Bone</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Dictates limits of upper incisor palatal root torque and retraction.
                </p>
              </div>

              {/* Symphyseal Cortex */}
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">b) Symphyseal Cortex Support</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    symphysealCortex.includes('Narrow') || symphysealCortex.includes('Thin') || symphysealCortex.includes('Risk')
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}>
                    {symphysealCortex}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={symphysealLocation}
                    onChange={(e) => {
                      setSymphysealLocation(e.target.value);
                      notifyChange({ symphysealCortexLocation: e.target.value });
                    }}
                    className="text-xs font-semibold px-2 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="Mandible">Mandible</option>
                    <option value="Maxilla">Maxilla</option>
                    <option value="Both">Both Jaws</option>
                  </select>
                  <select
                    value={symphysealCortex}
                    onChange={(e) => {
                      setSymphysealCortex(e.target.value);
                      notifyChange({ symphysealCortexSupport: e.target.value });
                    }}
                    className="text-xs font-semibold px-2 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                  >
                    <option value="Adequate">Adequate</option>
                    <option value="Narrow Symphysis">Narrow Symphysis</option>
                    <option value="Thin Cortex">Thin Cortex</option>
                    <option value="Fenestration Risk">Fenestration Risk</option>
                    <option value="Dehisced">Dehisced</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500">
                  Restricts lower incisor AP movement (proclination/retraction envelope).
                </p>
              </div>
            </div>
          </div>

          {/* 5. SKELETAL ALTERATION NEEDED MATRIX & TREATMENT PATHWAY TREE */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-teal-600" />
                5. Skeletal Alteration Matrix & Decision Pathway Tree
              </h5>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-500">Growth:</span>
                <select
                  value={growthStatus}
                  onChange={(e) => {
                    setGrowthStatus(e.target.value);
                    notifyChange({ growthStatus: e.target.value });
                  }}
                  className="text-xs font-bold px-2 py-1 rounded-md border border-slate-300 bg-slate-50"
                >
                  <option value="Actively Growing">Actively Growing (CVM 1-3 / SMI 1-7)</option>
                  <option value="Decelerating">Decelerating Growth (CVM 4 / SMI 8-9)</option>
                  <option value="Non-Growing / Adult">Non-Growing / Adult (CVM 5-6 / SMI 10-11)</option>
                </select>
              </div>
            </div>

            {/* Skeletal Alteration Matrix Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Sagittal Alteration</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSagittalAlteration('Needed');
                      notifyChange({ sagittalAlterationNeeded: 'Needed' });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      sagittalAlteration === 'Needed'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Needed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSagittalAlteration('Not Needed');
                      notifyChange({ sagittalAlterationNeeded: 'Not Needed' });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      sagittalAlteration === 'Not Needed'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Not Needed
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Vertical Alteration</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setVerticalAlteration('Needed');
                      notifyChange({ verticalAlterationNeeded: 'Needed' });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      verticalAlteration === 'Needed'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Needed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setVerticalAlteration('Not Needed');
                      notifyChange({ verticalAlterationNeeded: 'Not Needed' });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      verticalAlteration === 'Not Needed'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Not Needed
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">Overall Skeletal Alteration</span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSkeletalAlteration('Needed');
                      notifyChange({ skeletalAlterationNeeded: 'Needed' });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      skeletalAlteration === 'Needed'
                        ? 'bg-teal-700 text-white border-teal-800 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Needed
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSkeletalAlteration('Not Needed');
                      notifyChange({ skeletalAlterationNeeded: 'Not Needed' });
                    }}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      skeletalAlteration === 'Not Needed'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Not Needed
                  </button>
                </div>
              </div>
            </div>

            {/* Decision Tree Pathways */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-teal-950 text-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-teal-300">
                  Treatment Planning Pathway Matrix
                </span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {skeletalAlteration === 'Needed' ? 'Skeletal Correction Mode' : 'Dental Correction Mode'}
                </span>
              </div>

              {skeletalAlteration === 'Needed' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPathway('Growth Modulation');
                      notifyChange({ selectedPathway: 'Growth Modulation' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPathway === 'Growth Modulation'
                        ? 'bg-teal-600/30 border-teal-400 text-white ring-1 ring-teal-400'
                        : 'bg-white/5 border-slate-700 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-200">1. Growth Modulation</span>
                      {selectedPathway === 'Growth Modulation' && <Check className="w-4 h-4 text-teal-300" />}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Indicated for actively growing patients (Twin Block, Herbst, Face Mask, High-Pull HG).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPathway('Surgical Orthodontics');
                      notifyChange({ selectedPathway: 'Surgical Orthodontics' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPathway === 'Surgical Orthodontics'
                        ? 'bg-teal-600/30 border-teal-400 text-white ring-1 ring-teal-400'
                        : 'bg-white/5 border-slate-700 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-200">2. Orthognathic Surgery</span>
                      {selectedPathway === 'Surgical Orthodontics' && <Check className="w-4 h-4 text-teal-300" />}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Indicated for mature non-growing adults with severe basal dysplasia exceeding camouflage.
                    </p>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPathway('Normal Skeletal Relation');
                      notifyChange({ selectedPathway: 'Normal Skeletal Relation' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPathway === 'Normal Skeletal Relation'
                        ? 'bg-teal-600/30 border-teal-400 text-white ring-1 ring-teal-400'
                        : 'bg-white/5 border-slate-700 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-200">1. Normal Skeletal Relation</span>
                      {selectedPathway === 'Normal Skeletal Relation' && <Check className="w-4 h-4 text-teal-300" />}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Harmonious basal bases; manage pure dental malalignment, crowding, and arch leveling.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPathway('Orthodontic Camouflage');
                      notifyChange({ selectedPathway: 'Orthodontic Camouflage' });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedPathway === 'Orthodontic Camouflage'
                        ? 'bg-teal-600/30 border-teal-400 text-white ring-1 ring-teal-400'
                        : 'bg-white/5 border-slate-700 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-200">2. Orthodontic Camouflage</span>
                      {selectedPathway === 'Orthodontic Camouflage' && <Check className="w-4 h-4 text-teal-300" />}
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Mild-moderate skeletal discrepancy masked by dental compensation (extractions, elastics).
                    </p>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 6. FINAL MASTER JUSTIFICATION NARRATIVE BLOCK */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-600" />
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  6. Final Master Justification Narrative Block
                </h5>
              </div>
              <button
                type="button"
                onClick={handleCopyJustification}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg bg-teal-50 text-teal-700 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Narrative'}</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={activeJustification}
              onChange={(e) => {
                setCustomJustification(e.target.value);
                notifyChange({ justification: e.target.value });
              }}
              placeholder="Comprehensive diagnostic synthesis narrative..."
              className="w-full text-xs font-medium leading-relaxed p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(SagittalVerticalInteractionAnalysis);
