import React, { useState, useEffect, useMemo } from 'react';
import {
  CephDiscrepancyParameterKey,
  CephDiscrepancyParametersMap,
  CephDiscrepancyAnalysisData,
  Gender,
  DownsAnalysisData,
  SteinersAnalysisData,
  RickettsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CogsSoftTissueAnalysisData,
} from '../../types';
import { CephParameterRow } from './CephParameterRow';
import { CephAutoDiagnosisPanel } from './CephAutoDiagnosisPanel';
import { ComprehensiveCephAnalysis } from './ComprehensiveCephAnalysis';
import { extractPrimaryCephValues } from '../../lib/cephAutoFetchEngine';
import {
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  RotateCcw,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface CephDiscrepancyParameterMeta {
  key: CephDiscrepancyParameterKey;
  label: string;
  category: 'Sagittal Skeletal Relation' | 'Maxillary & Mandibular Apical Base Discrepancy';
  unit: string;
  minRange?: number;
  maxRange?: number;
  step?: number;
  normalText: (gender: 'Male' | 'Female') => string;
  getNormalRange: (gender: 'Male' | 'Female') => { minNormal: number; maxNormal: number };
  evaluateInference: (
    val: number,
    gender: 'Male' | 'Female'
  ) => {
    inference: string;
    status: 'normal' | 'abnormal';
  };
}

export interface CephDiscrepancyAnalysisProps {
  data?: CephDiscrepancyAnalysisData;
  gender?: Gender;
  onChange?: (updatedData: CephDiscrepancyAnalysisData) => void;
  isOpen?: boolean;
  onToggle?: () => void;
  currentStage?: 'pre' | 'mid' | 'post';
  patientAge?: number | string;
  patientGender?: Gender;
  downsAnalysis?: DownsAnalysisData;
  steinersAnalysis?: SteinersAnalysisData;
  rickettsAnalysis?: RickettsAnalysisData;
  mcnamaraAnalysis?: McnamaraAnalysisData;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  holdawayAnalysis?: HoldawayAnalysisData;
  cogsAnalysis?: CogsAnalysisData;
  cogsSoftTissueAnalysis?: CogsSoftTissueAnalysisData;
}

export const CEPH_DISCREPANCY_PARAMETERS_META: CephDiscrepancyParameterMeta[] = [
  // --- A. Sagittal Skeletal Relation Parameters (12) ---
  {
    key: 'anbAngle',
    label: 'ANB Angle (Skeletal Relationship)',
    category: 'Sagittal Skeletal Relation',
    unit: '°',
    minRange: -10,
    maxRange: 20,
    step: 0.5,
    normalText: () => '2° (0° to 4°)',
    getNormalRange: () => ({ minNormal: 0, maxNormal: 4 }),
    evaluateInference: (val) => {
      if (val > 4) return { inference: `Skeletal Class II Discrepancy (${val <= 6 ? 'Mild' : val <= 8 ? 'Moderate' : 'Severe'})`, status: 'abnormal' };
      if (val < 0) return { inference: 'Skeletal Class III Discrepancy', status: 'abnormal' };
      return { inference: 'Skeletal Class I Relationship', status: 'normal' };
    },
  },
  {
    key: 'aMoBFh',
    label: 'A-MoB-^nFH',
    category: 'Sagittal Skeletal Relation',
    unit: 'mm',
    minRange: -5,
    maxRange: 15,
    step: 0.5,
    normalText: () => '4 mm (2 to 6 mm)',
    getNormalRange: () => ({ minNormal: 2, maxNormal: 6 }),
    evaluateInference: (val) => {
      if (val > 6) return { inference: 'Increased Maxillomandibular AP Distance', status: 'abnormal' };
      if (val < 2) return { inference: 'Decreased Maxillomandibular AP Distance', status: 'abnormal' };
      return { inference: 'Normal Maxillomandibular AP Alignment', status: 'normal' };
    },
  },
  {
    key: 'witsAoBo',
    label: 'AO to BO (Wits Appraisal)',
    category: 'Sagittal Skeletal Relation',
    unit: 'mm',
    minRange: -15,
    maxRange: 20,
    step: 0.5,
    normalText: () => '0 to 1 mm (-1 to 1 mm)',
    getNormalRange: () => ({ minNormal: -1, maxNormal: 1 }),
    evaluateInference: (val) => {
      if (val > 3) return { inference: 'Wits Class II Discrepancy', status: 'abnormal' };
      if (val > 1) return { inference: 'Mild Wits Class II Tendency', status: 'abnormal' };
      if (val < -1) return { inference: 'Wits Class III Discrepancy', status: 'abnormal' };
      return { inference: 'Harmonious Wits Skeletal Relation', status: 'normal' };
    },
  },
  {
    key: 'betaAngle',
    label: 'Beta Angle',
    category: 'Sagittal Skeletal Relation',
    unit: '°',
    minRange: 10,
    maxRange: 50,
    step: 0.5,
    normalText: () => '27° to 35°',
    getNormalRange: () => ({ minNormal: 27, maxNormal: 35 }),
    evaluateInference: (val) => {
      if (val < 27) return { inference: 'Class II Skeletal Discrepancy', status: 'abnormal' };
      if (val > 35) return { inference: 'Class III Skeletal Discrepancy', status: 'abnormal' };
      return { inference: 'Class I Skeletal Pattern', status: 'normal' };
    },
  },
  {
    key: 'naPog',
    label: 'NA-Pog (Angle of Convexity)',
    category: 'Sagittal Skeletal Relation',
    unit: '°',
    minRange: -20,
    maxRange: 30,
    step: 0.5,
    normalText: () => '0° (-8.5° to 10°)',
    getNormalRange: () => ({ minNormal: -8.5, maxNormal: 10 }),
    evaluateInference: (val) => {
      if (val > 10) return { inference: 'Convex Facial Skeletal Profile', status: 'abnormal' };
      if (val < -8.5) return { inference: 'Concave Facial Skeletal Profile', status: 'abnormal' };
      return { inference: 'Straight / Normal Profile Convexity', status: 'normal' };
    },
  },
  {
    key: 'yenAngle',
    label: 'YEN Angle',
    category: 'Sagittal Skeletal Relation',
    unit: '°',
    minRange: 10,
    maxRange: 50,
    step: 0.5,
    normalText: () => '117° to 123°',
    getNormalRange: () => ({ minNormal: 117, maxNormal: 123 }),
    evaluateInference: (val) => {
      if (val < 117) return { inference: 'Class II Skeletal Pattern', status: 'abnormal' };
      if (val > 123) return { inference: 'Class III Skeletal Pattern', status: 'abnormal' };
      return { inference: 'Class I Skeletal Pattern', status: 'normal' };
    },
  },
  {
    key: 'wAngle',
    label: 'W Angle',
    category: 'Sagittal Skeletal Relation',
    unit: '°',
    minRange: 30,
    maxRange: 70,
    step: 0.5,
    normalText: () => '51° to 56°',
    getNormalRange: () => ({ minNormal: 51, maxNormal: 56 }),
    evaluateInference: (val) => {
      if (val < 51) return { inference: 'Class II Skeletal Pattern', status: 'abnormal' };
      if (val > 56) return { inference: 'Class III Skeletal Pattern', status: 'abnormal' };
      return { inference: 'Class I Skeletal Pattern', status: 'normal' };
    },
  },
  {
    key: 'apdi',
    label: 'APDI (Anteroposterior Dysplasia Indicator)',
    category: 'Sagittal Skeletal Relation',
    unit: '°',
    minRange: 60,
    maxRange: 110,
    step: 0.5,
    normalText: () => '81° to 85°',
    getNormalRange: () => ({ minNormal: 81, maxNormal: 85 }),
    evaluateInference: (val) => {
      if (val < 81) return { inference: 'APDI Class II Skeletal Discrepancy', status: 'abnormal' };
      if (val > 85) return { inference: 'APDI Class III Skeletal Discrepancy', status: 'abnormal' };
      return { inference: 'Normal Anteroposterior Skeletal Balance', status: 'normal' };
    },
  },

  // --- B. Maxillary & Mandibular Apical Base Discrepancy (4) ---
  {
    key: 'snaAngle',
    label: 'SNA Angle',
    category: 'Maxillary & Mandibular Apical Base Discrepancy',
    unit: '°',
    minRange: 65,
    maxRange: 100,
    step: 0.5,
    normalText: () => '82° ± 2° (80° to 84°)',
    getNormalRange: () => ({ minNormal: 80, maxNormal: 84 }),
    evaluateInference: (val) => {
      if (val > 84) return { inference: 'Maxillary Prognathism / Forward Position', status: 'abnormal' };
      if (val < 80) return { inference: 'Maxillary Retrognathism / Deficient Position', status: 'abnormal' };
      return { inference: 'Normal Maxillary Position', status: 'normal' };
    },
  },
  {
    key: 'snbAngle',
    label: 'SNB Angle',
    category: 'Maxillary & Mandibular Apical Base Discrepancy',
    unit: '°',
    minRange: 60,
    maxRange: 95,
    step: 0.5,
    normalText: () => '80° ± 2° (78° to 82°)',
    getNormalRange: () => ({ minNormal: 78, maxNormal: 82 }),
    evaluateInference: (val) => {
      if (val > 82) return { inference: 'Mandibular Prognathism', status: 'abnormal' };
      if (val < 78) return { inference: 'Mandibular Retrognathism', status: 'abnormal' };
      return { inference: 'Normal Mandibular Position', status: 'normal' };
    },
  },
  {
    key: 'aNPerp',
    label: 'A-NPerp (Point A to N-Perpendicular)',
    category: 'Maxillary & Mandibular Apical Base Discrepancy',
    unit: 'mm',
    minRange: -10,
    maxRange: 15,
    step: 0.5,
    normalText: () => '0 to 1 mm',
    getNormalRange: () => ({ minNormal: 0, maxNormal: 1 }),
    evaluateInference: (val) => {
      if (val > 1) return { inference: 'Maxillary Skeletal Protrusion', status: 'abnormal' };
      if (val < 0) return { inference: 'Maxillary Skeletal Retrusion', status: 'abnormal' };
      return { inference: 'Normal Maxillary Position', status: 'normal' };
    },
  },
  {
    key: 'pogNPerp',
    label: 'Pog-NPerp (Pogonion to N-Perpendicular)',
    category: 'Maxillary & Mandibular Apical Base Discrepancy',
    unit: 'mm',
    minRange: -20,
    maxRange: 15,
    step: 0.5,
    normalText: () => '-2 to 4 mm',
    getNormalRange: () => ({ minNormal: -2, maxNormal: 4 }),
    evaluateInference: (val) => {
      if (val < -2) return { inference: 'Mandibular Retrusion / Deficient Chin', status: 'abnormal' };
      if (val > 4) return { inference: 'Mandibular Protrusion / Prominent Chin', status: 'abnormal' };
      return { inference: 'Normal Mandibular Position', status: 'normal' };
    },
  },
];

export const DEFAULT_CEPH_DISCREPANCY_PARAMS: CephDiscrepancyParametersMap = {
  anbAngle: { pre: '', mid: '', post: '' },
  aMoBFh: { pre: '', mid: '', post: '' },
  witsAoBo: { pre: '', mid: '', post: '' },
  betaAngle: { pre: '', mid: '', post: '' },
  yenAngle: { pre: '', mid: '', post: '' },
  wAngle: { pre: '', mid: '', post: '' },
  apdi: { pre: '', mid: '', post: '' },
  naPog: { pre: '', mid: '', post: '' },
  abNpog: { pre: '', mid: '', post: '' },
  maxMandRatio: { pre: '', mid: '', post: '' },
  harvoldUnitDiff: { pre: '', mid: '', post: '' },
  softTissueProfileAngle: { pre: '', mid: '', post: '' },
  totalTissueProfileAngle: { pre: '', mid: '', post: '' },
  softTissueFacialAngle: { pre: '', mid: '', post: '' },
  subnasaleToChin: { pre: '', mid: '', post: '' },
  snaAngle: { pre: '', mid: '', post: '' },
  aNPerp: { pre: '', mid: '', post: '' },
  maxilla1aNl: { pre: '', mid: '', post: '' },
  maxPlacementSInfPtmNf: { pre: '', mid: '', post: '' },
  snbAngle: { pre: '', mid: '', post: '' },
  pogNPerp: { pre: '', mid: '', post: '' },
  mandibleB1nL: { pre: '', mid: '', post: '' },
  chinNPogFh: { pre: '', mid: '', post: '' },
  mandCorpusSize: { pre: '', mid: '', post: '' },
  basicUpperLip: { pre: '', mid: '', post: '' },
  softTissueChin: { pre: '', mid: '', post: '' },
};

export const CephDiscrepancyAnalysis: React.FC<CephDiscrepancyAnalysisProps> = ({
  data,
  gender = 'Female',
  onChange,
  isOpen: externalIsOpen,
  onToggle: externalOnToggle,
  currentStage = 'pre',
  patientAge = 12,
  patientGender = 'Male',
  downsAnalysis,
  steinersAnalysis,
  rickettsAnalysis,
  mcnamaraAnalysis,
  schwarzTweedAnalysis,
  holdawayAnalysis,
  cogsAnalysis,
  cogsSoftTissueAnalysis,
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

  const [params, setParams] = useState<CephDiscrepancyParametersMap>(() => {
    if (data?.parameters) return { ...DEFAULT_CEPH_DISCREPANCY_PARAMS, ...data.parameters };
    return DEFAULT_CEPH_DISCREPANCY_PARAMS;
  });

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data?.parameters) setParams((prev) => ({ ...prev, ...data.parameters }));
  }, [data?.parameters]);

  const handleValueChange = (key: CephDiscrepancyParameterKey, stage: 'pre' | 'mid' | 'post', newNumber: number | '') => {
    const updated = { ...params, [key]: { ...params[key], [stage]: newNumber } };
    setParams(updated);
    if (onChange) {
      onChange({ parameters: updated, gender, diagnosticConclusion: '' });
    }
  };

  const handleReset = () => {
    const emptyParams = { ...DEFAULT_CEPH_DISCREPANCY_PARAMS };
    setParams(emptyParams);
    if (onChange) {
      onChange({ parameters: emptyParams, gender, diagnosticConclusion: '' });
    }
  };

  const categories = [
    'Sagittal Skeletal Relation',
    'Maxillary & Mandibular Apical Base Discrepancy',
  ] as const;

  const autoFetchedMap = useMemo(() => {
    return extractPrimaryCephValues({
      downsAnalysis,
      steinersAnalysis,
      rickettsAnalysis,
      mcnamaraAnalysis,
      schwarzTweedAnalysis,
      holdawayAnalysis,
      cogsAnalysis,
      cogsSoftTissueAnalysis,
      stage: (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre',
    });
  }, [
    downsAnalysis,
    steinersAnalysis,
    rickettsAnalysis,
    mcnamaraAnalysis,
    schwarzTweedAnalysis,
    holdawayAnalysis,
    cogsAnalysis,
    cogsSoftTissueAnalysis,
    currentStage,
  ]);

  const activeCount = useMemo(() => {
    return CEPH_DISCREPANCY_PARAMETERS_META.filter((m) => {
      const userVal = params[m.key]?.[currentStage];
      const autoVal = autoFetchedMap[m.key]?.value;
      const v = userVal !== '' && userVal !== undefined ? userVal : autoVal;
      return v !== '' && v !== undefined && !isNaN(Number(v));
    }).length;
  }, [params, currentStage, autoFetchedMap]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs transition-all w-full max-w-full">
      {/* Accordion Card Header - Mobile Optimized 48px+ Touch Target */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full min-h-[52px] px-3.5 py-3 cursor-pointer bg-white hover:bg-slate-50/80 active:bg-slate-100/90 active:scale-[0.995] transition-all text-left block relative select-none border-b border-slate-100"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
              <Calculator className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 leading-tight">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                  Cephalometric Discrepancy Analysis
                </h4>
                <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded-full shrink-0">
                  12 Params
                </span>
              </div>
              <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                Sagittal & Apical Base Discrepancies
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeCount === 0 ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                0/12 Measured
              </span>
            ) : activeCount === 12 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>Completed</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                <span>{activeCount}/12 Measured</span>
              </span>
            )}

            <div className="text-slate-400 p-0.5 rounded-lg">
              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-700" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </div>
          </div>
        </div>

        {/* Slim 2px progress bar along bottom edge when in progress */}
        {activeCount > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${activeCount === 12 ? 'bg-emerald-500' : 'bg-teal-500'}`}
              style={{ width: `${(activeCount / 12) * 100}%` }}
            />
          </div>
        )}
      </button>

      {/* Accordion Body Content */}
      {isOpen && (
        <div className="p-3 sm:p-5 space-y-6 bg-slate-50/50">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1 text-xs font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All
            </button>
          </div>

          {categories.map((cat) => {
            const catMetas = CEPH_DISCREPANCY_PARAMETERS_META.filter((m) => m.category === cat);
            const genderValid: 'Female' | 'Male' = gender === 'Male' ? 'Male' : 'Female';
            const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';

            return (
              <div key={cat} className="space-y-3">
                <h5 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 px-1 border-l-2 border-teal-600 pl-2">
                  {cat} ({catMetas.length})
                </h5>
                <div className="grid grid-cols-1 gap-3">
                  {catMetas.map((meta) => {
                    const userVal = params[meta.key]?.[stageKey] ?? '';
                    const autoValObj = autoFetchedMap[meta.key];
                    const val = userVal !== '' ? userVal : (autoValObj?.value ?? '');
                    const autoFetchedSource = userVal === '' && autoValObj ? autoValObj.source : undefined;

                    const numericVal = Number(val);
                    const isValid = val !== '' && !isNaN(numericVal);
                    const inf = isValid
                      ? meta.evaluateInference(numericVal, genderValid)
                      : { inference: 'Not Measured', status: 'empty' as const };

                    return (
                      <CephParameterRow
                        key={meta.key}
                        label={meta.label}
                        norm={meta.normalText(genderValid)}
                        value={val}
                        onChange={(n) => handleValueChange(meta.key, stageKey, n)}
                        unit={meta.unit}
                        min={meta.minRange}
                        max={meta.maxRange}
                        step={meta.step}
                        inference={inf}
                        category={meta.category}
                        autoFetchedSource={autoFetchedSource}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
          {/* AI Clinical Auto-Diagnosis Panel */}
          <CephAutoDiagnosisPanel
            analysisName="Cephalometric Discrepancy Analysis"
            parameters={CEPH_DISCREPANCY_PARAMETERS_META.map((meta) => {
              const genderValid: 'Female' | 'Male' = gender === 'Male' ? 'Male' : 'Female';
              const stageKey: 'pre' | 'mid' | 'post' = (currentStage === 'mid' || currentStage === 'post') ? currentStage : 'pre';
              const range = meta.getNormalRange(genderValid);
              const userVal = params[meta.key]?.[stageKey] ?? '';
              const autoValObj = autoFetchedMap[meta.key];
              const resolvedVal = userVal !== '' ? userVal : (autoValObj?.value ?? '');

              return {
                parameterKey: meta.key,
                parameterName: meta.label,
                analysisName: 'Cephalometric Discrepancy Analysis',
                value: resolvedVal,
                minNormal: range.minNormal,
                maxNormal: range.maxNormal,
                unit: meta.unit,
                category: meta.category,
              };
            })}
          />

          {/* Integrated 4-Sheet Comprehensive Orthodontic Case Analysis */}
          <div className="pt-4 border-t border-slate-200/80">
            <h4 className="text-xs font-black uppercase tracking-wider text-teal-800 px-1 mb-2">
              Integrated Comprehensive Orthodontic Case Synthesis
            </h4>
            <ComprehensiveCephAnalysis
              activeStage={currentStage}
              patientAge={patientAge}
              patientGender={patientGender}
              downsAnalysis={downsAnalysis}
              steinersAnalysis={steinersAnalysis}
              rickettsAnalysis={rickettsAnalysis}
              mcnamaraAnalysis={mcnamaraAnalysis}
              schwarzTweedAnalysis={schwarzTweedAnalysis}
              holdawayAnalysis={holdawayAnalysis}
              cogsAnalysis={cogsAnalysis}
              cogsSoftTissueAnalysis={cogsSoftTissueAnalysis}
              cephDiscrepancyAnalysis={data}
            />
          </div>
        </div>
      )}
    </div>
  );
};
