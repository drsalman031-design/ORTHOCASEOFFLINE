import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sliders,
  Sparkles,
  Layers,
  Search,
} from 'lucide-react';

/**
 * Cephalometric Analysis Data Model for Dynamic Rendering
 */
export interface CephAnalysisItem {
  id: string;
  title: string;
  shortTitle?: string;
  subtitle: string; // Clinical focus area ONLY (concise, no redundant subtitle text)
  parameterCount: number;
  measuredCount: number;
  deviationCount: number;
  category: 'Skeletal' | 'Dental' | 'Soft Tissue' | 'Surgical' | 'Discrepancy';
  icon?: string;
  parameters?: Array<{
    id: string;
    name: string;
    norm: string;
    unit: string;
    value?: number | string;
    deviation?: boolean;
    interpretation?: string;
  }>;
}

/**
 * Standard JSON Array of Cephalometric Analyses for Mobile List View
 */
export const DEFAULT_CEPH_ANALYSIS_DATA: CephAnalysisItem[] = [
  {
    id: 'downs',
    title: 'Downs Analysis',
    shortTitle: 'Downs',
    subtitle: 'Skeletal & Dental Cephalometrics',
    parameterCount: 10,
    measuredCount: 10,
    deviationCount: 2,
    category: 'Skeletal',
    parameters: [
      { id: 'd1', name: 'Facial Angle', norm: '87.8°', unit: '°', value: 89.2, deviation: false, interpretation: 'Orthognathic' },
      { id: 'd2', name: 'Angle of Convexity', norm: '0°', unit: '°', value: 6.5, deviation: true, interpretation: 'Convex Profile (Class II)' },
      { id: 'd3', name: 'A-B Plane Angle', norm: '-4.6°', unit: '°', value: -7.0, deviation: true, interpretation: 'Retrusive Mandible' },
      { id: 'd4', name: 'Mandibular Plane Angle', norm: '21.9°', unit: '°', value: 22.0, deviation: false, interpretation: 'Normodivergent' },
      { id: 'd5', name: 'Y-Axis (SGn-FH)', norm: '59.4°', unit: '°', value: 59.0, deviation: false, interpretation: 'Normal Growth Direction' },
      { id: 'd6', name: 'Occlusal Plane Angle', norm: '9.3°', unit: '°', value: 9.5, deviation: false, interpretation: 'Normal' },
      { id: 'd7', name: 'U1 to APog', norm: '5.0 mm', unit: 'mm', value: 5.5, deviation: false, interpretation: 'Normal Protrusion' },
      { id: 'd8', name: 'L1 to Occlusal Plane', norm: '14.5°', unit: '°', value: 15.0, deviation: false, interpretation: 'Normal' },
      { id: 'd9', name: 'L1 to Mandibular Plane', norm: '1.4°', unit: '°', value: 2.0, deviation: false, interpretation: 'Normal' },
      { id: 'd10', name: 'SNA Angle', norm: '82.0°', unit: '°', value: 82.5, deviation: false, interpretation: 'Normal Maxilla' },
    ],
  },
  {
    id: 'steiners',
    title: "Steiner's Analysis",
    shortTitle: 'Steiner',
    subtitle: 'Skeletal, Dental & Soft Tissue Profile',
    parameterCount: 11,
    measuredCount: 11,
    deviationCount: 3,
    category: 'Skeletal',
    parameters: [
      { id: 's1', name: 'SNA', norm: '82.0°', unit: '°', value: 84.0, deviation: true, interpretation: 'Maxillary Prognathism' },
      { id: 's2', name: 'SNB', norm: '80.0°', unit: '°', value: 78.0, deviation: true, interpretation: 'Mandibular Retrognathism' },
      { id: 's3', name: 'ANB', norm: '2.0°', unit: '°', value: 6.0, deviation: true, interpretation: 'Skeletal Class II Pattern' },
      { id: 's4', name: 'SND', norm: '76.0°', unit: '°', value: 75.5, deviation: false, interpretation: 'Normal' },
      { id: 's5', name: 'U1 to NA (mm)', norm: '4.0 mm', unit: 'mm', value: 4.5, deviation: false, interpretation: 'Normal' },
      { id: 's6', name: 'U1 to NA (deg)', norm: '22.0°', unit: '°', value: 23.0, deviation: false, interpretation: 'Normal' },
      { id: 's7', name: 'L1 to NB (mm)', norm: '4.0 mm', unit: 'mm', value: 4.2, deviation: false, interpretation: 'Normal' },
      { id: 's8', name: 'L1 to NB (deg)', norm: '25.0°', unit: '°', value: 26.0, deviation: false, interpretation: 'Normal' },
      { id: 's9', name: 'Pog to NB', norm: '2.0 mm', unit: 'mm', value: 2.0, deviation: false, interpretation: 'Normal Chin Prominence' },
      { id: 's10', name: 'GoGn-SN Angle', norm: '32.0°', unit: '°', value: 32.5, deviation: false, interpretation: 'Normodivergent' },
      { id: 's11', name: 'Occlusal to SN Angle', norm: '14.0°', unit: '°', value: 14.2, deviation: false, interpretation: 'Normal' },
    ],
  },
  {
    id: 'ricketts',
    title: 'Ricketts Analysis',
    shortTitle: 'Ricketts',
    subtitle: 'Esthetic Line, Growth & Teeth Position',
    parameterCount: 11,
    measuredCount: 5,
    deviationCount: 1,
    category: 'Dental',
    parameters: [],
  },
  {
    id: 'mcnamara',
    title: 'McNamara Analysis',
    shortTitle: 'McNamara',
    subtitle: 'Maxilla, Mandible, Dentition & Airway Widths',
    parameterCount: 11,
    measuredCount: 0,
    deviationCount: 0,
    category: 'Skeletal',
    parameters: [],
  },
  {
    id: 'schwarzTweed',
    title: 'Schwarz & Tweed Analysis',
    shortTitle: 'Schwarz & Tweed',
    subtitle: 'Schwarz Cranial/Mandibular & Tweed Triangle',
    parameterCount: 8,
    measuredCount: 8,
    deviationCount: 0,
    category: 'Dental',
    parameters: [],
  },
  {
    id: 'holdaway',
    title: 'Holdaway Soft Tissue Analysis',
    shortTitle: 'Holdaway',
    subtitle: 'Soft Tissue Profile & H-Line Harmony',
    parameterCount: 11,
    measuredCount: 4,
    deviationCount: 1,
    category: 'Soft Tissue',
    parameters: [],
  },
  {
    id: 'cogs',
    title: 'COGS Analysis',
    shortTitle: 'COGS',
    subtitle: 'Orthognathic Surgical Skeletal Metrics',
    parameterCount: 10,
    measuredCount: 0,
    deviationCount: 0,
    category: 'Surgical',
    parameters: [],
  },
  {
    id: 'cephDiscrepancy',
    title: 'Ceph Discrepancy Analysis',
    shortTitle: 'Discrepancy',
    subtitle: 'Sagittal & Apical Base Discrepancies',
    parameterCount: 6,
    measuredCount: 6,
    deviationCount: 2,
    category: 'Discrepancy',
    parameters: [],
  },
];

export type FilterStatus = 'all' | 'in_progress' | 'completed' | 'deviations';

export interface MobileCephAnalysisListViewProps {
  analyses?: CephAnalysisItem[];
  activeAccordionId?: string;
  onAccordionToggle?: (id: string) => void;
  onStageChange?: (stage: 'pre' | 'mid' | 'post') => void;
  activeStage?: 'pre' | 'mid' | 'post';
  onCardSelect?: (analysis: CephAnalysisItem) => void;
  customCardContentRender?: (analysisId: string) => React.ReactNode;
}

export const MobileCephAnalysisListView: React.FC<MobileCephAnalysisListViewProps> = ({
  analyses = DEFAULT_CEPH_ANALYSIS_DATA,
  activeAccordionId,
  onAccordionToggle,
  onStageChange,
  activeStage = 'pre',
  onCardSelect,
  customCardContentRender,
}) => {
  const [internalActiveId, setInternalActiveId] = useState<string>(activeAccordionId || 'downs');
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentOpenId = activeAccordionId !== undefined ? activeAccordionId : internalActiveId;

  const handleToggle = (id: string) => {
    const nextId = currentOpenId === id ? '' : id;
    if (onAccordionToggle) {
      onAccordionToggle(id);
    } else {
      setInternalActiveId(nextId);
    }
  };

  // Calculate Overall Statistics
  const { totalParams, totalMeasured, totalDeviations, inProgressCount, completedCount, deviationsCount } =
    useMemo(() => {
      let paramsSum = 0;
      let measuredSum = 0;
      let devSum = 0;
      let inProg = 0;
      let comp = 0;
      let devCards = 0;

      analyses.forEach((item) => {
        paramsSum += item.parameterCount;
        measuredSum += item.measuredCount;
        devSum += item.deviationCount;

        if (item.measuredCount > 0 && item.measuredCount < item.parameterCount) {
          inProg++;
        } else if (item.measuredCount === item.parameterCount && item.parameterCount > 0) {
          comp++;
        }
        if (item.deviationCount > 0) {
          devCards++;
        }
      });

      return {
        totalParams: paramsSum,
        totalMeasured: measuredSum,
        totalDeviations: devSum,
        inProgressCount: inProg,
        completedCount: comp,
        deviationsCount: devCards,
      };
    }, [analyses]);

  // Filter & Search Analyses
  const filteredAnalyses = useMemo(() => {
    return analyses.filter((item) => {
      // Search filter
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(query);
        const matchesSubtitle = item.subtitle.toLowerCase().includes(query);
        if (!matchesTitle && !matchesSubtitle) return false;
      }

      // Status filter
      if (activeFilter === 'in_progress') {
        return item.measuredCount > 0 && item.measuredCount < item.parameterCount;
      }
      if (activeFilter === 'completed') {
        return item.measuredCount === item.parameterCount && item.parameterCount > 0;
      }
      if (activeFilter === 'deviations') {
        return item.deviationCount > 0;
      }
      return true;
    });
  }, [analyses, activeFilter, searchQuery]);

  return (
    <div className="w-full max-w-full box-border font-sans bg-slate-50/60 min-h-screen pb-12">
      {/* 1. STICKY TOP MOBILE TOOLBAR & SUMMARY HEADER */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs transition-all">
        {/* Row 1: Tracing Progress & Stage Selector */}
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                  Ceph Tracing Progress
                </h3>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.2 rounded-full">
                  {totalMeasured}/{totalParams} Measured
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-24 sm:w-36 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/50">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${totalParams > 0 ? (totalMeasured / totalParams) * 100 : 0}%` }}
                  />
                </div>
                {totalDeviations > 0 && (
                  <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-md flex items-center gap-0.5">
                    <AlertTriangle className="w-3 h-3 text-rose-600" />
                    {totalDeviations} Deviations
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Clinical Stage Switcher */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shrink-0">
            {(['pre', 'mid', 'post'] as const).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => onStageChange && onStageChange(stage)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer active:scale-95 ${
                  activeStage === stage
                    ? 'bg-white text-teal-700 shadow-2xs border border-slate-200/60'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {stage.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Row 2: Horizontal Thumb-Scrollable Pill Filter Bar */}
        <div className="px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
          {[
            { id: 'all', label: 'All Cards', count: analyses.length },
            { id: 'in_progress', label: 'In Progress', count: inProgressCount },
            { id: 'completed', label: 'Completed', count: completedCount },
            { id: 'deviations', label: 'Deviations', count: deviationsCount, alert: true },
          ].map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id as FilterStatus)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 min-h-[34px] ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs border border-teal-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : filter.alert && filter.count > 0
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Optional Search / Quick Lookup Input */}
      <div className="px-3.5 pt-3 pb-1">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search analysis by title or clinical focus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white text-slate-800 placeholder-slate-400 pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/40 font-medium"
          />
        </div>
      </div>

      {/* 2. DYNAMIC MOBILE ANALYSIS CARDS LIST */}
      <div className="px-3.5 pt-2 space-y-3">
        {filteredAnalyses.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2 my-4 shadow-2xs">
            <Sliders className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No analyses match selected filter</h4>
            <p className="text-xs text-slate-500">Try selecting &quot;All Cards&quot; or clearing your search term.</p>
            <button
              type="button"
              onClick={() => {
                setActiveFilter('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold cursor-pointer active:scale-95"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredAnalyses.map((analysis) => {
            const isOpen = currentOpenId === analysis.id;
            const isUnstarted = analysis.measuredCount === 0;
            const isInProgress = analysis.measuredCount > 0 && analysis.measuredCount < analysis.parameterCount;
            const isCompleted = analysis.measuredCount === analysis.parameterCount && analysis.parameterCount > 0;
            const hasDeviations = analysis.deviationCount > 0;

            return (
              <div
                key={analysis.id}
                className={`bg-white border rounded-2xl overflow-hidden shadow-2xs transition-all w-full max-w-full ${
                  isOpen ? 'border-teal-500/60 ring-2 ring-teal-500/10' : 'border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {/* CARD HEADER - Optimized 48px+ Touch Target for One-Handed Mobile Use */}
                <button
                  type="button"
                  onClick={() => {
                    handleToggle(analysis.id);
                    if (onCardSelect) onCardSelect(analysis);
                  }}
                  aria-expanded={isOpen}
                  className="w-full min-h-[54px] px-3.5 py-3 cursor-pointer bg-white hover:bg-slate-50/80 active:bg-slate-100/90 active:scale-[0.995] transition-all text-left block relative select-none border-b border-slate-100"
                >
                  <div className="flex items-center justify-between gap-2.5">
                    {/* Left: Icon Tile + Title + Inline Parameter Pill */}
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                          hasDeviations
                            ? 'bg-rose-50 text-rose-600 border border-rose-200/60'
                            : isCompleted
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                            : isInProgress
                            ? 'bg-teal-50 text-teal-600 border border-teal-200/60'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                        }`}
                      >
                        <Calculator className="w-4 h-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Title Row with Inline "X Params" Pill */}
                        <div className="flex flex-wrap items-center gap-1.5 leading-tight">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight">
                            {analysis.title}
                          </h4>
                          {analysis.parameterCount > 0 && (
                            <span className="inline-flex items-center text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200/80 px-1.5 py-0.2 rounded-full shrink-0">
                              {analysis.parameterCount} Params
                            </span>
                          )}
                        </div>

                        {/* Concise Clinical Subtitle (No drum picker redundancy, WCAG AA compliant contrast) */}
                        <p className="text-[12px] text-slate-600 font-semibold leading-snug mt-0.5 truncate">
                          {analysis.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Right: Color-Coded Dynamic Mobile Badge & Accordion Chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Badge State Logic */}
                      {isUnstarted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200/80">
                          0/{analysis.parameterCount}
                        </span>
                      ) : hasDeviations ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                          <span>{analysis.deviationCount} Deviations</span>
                        </span>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal-50 text-teal-700 border border-teal-200">
                          <Activity className="w-3 h-3 text-teal-600 shrink-0" />
                          <span>
                            {analysis.measuredCount}/{analysis.parameterCount}
                          </span>
                        </span>
                      )}

                      {/* Accordion Chevron */}
                      <div className="text-slate-400 p-0.5 rounded-lg">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-slate-700" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-500" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SLIM 2px PROGRESS BAR along bottom edge of in-progress card */}
                  {analysis.parameterCount > 0 && analysis.measuredCount > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          hasDeviations ? 'bg-amber-500' : isCompleted ? 'bg-emerald-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${(analysis.measuredCount / analysis.parameterCount) * 100}%` }}
                      />
                    </div>
                  )}
                </button>

                {/* CARD EXPANDABLE BODY CONTENT */}
                {isOpen && (
                  <div className="p-3 sm:p-4 bg-slate-50/40 border-t border-slate-100">
                    {customCardContentRender ? (
                      customCardContentRender(analysis.id)
                    ) : analysis.parameters && analysis.parameters.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                          <span>Clinical Measurements</span>
                          <span>Norm / Value</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {analysis.parameters.map((param) => (
                            <div
                              key={param.id}
                              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs bg-white ${
                                param.deviation
                                  ? 'border-rose-200 bg-rose-50/30 text-rose-900'
                                  : 'border-slate-200/80 text-slate-800'
                              }`}
                            >
                              <div className="min-w-0">
                                <p className="font-bold truncate">{param.name}</p>
                                <p className="text-[10px] text-slate-500">Norm: {param.norm}</p>
                              </div>
                              <div className="text-right shrink-0">
                                <span
                                  className={`font-extrabold px-2 py-0.5 rounded-md text-xs ${
                                    param.deviation
                                      ? 'bg-rose-100 text-rose-700'
                                      : param.value !== undefined
                                      ? 'bg-slate-100 text-slate-800'
                                      : 'text-slate-400 italic'
                                  }`}
                                >
                                  {param.value !== undefined ? `${param.value}${param.unit}` : 'Unmeasured'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200/60">
                        <Sparkles className="w-4 h-4 text-teal-600 mx-auto mb-1" />
                        <p className="font-semibold text-slate-700">Detailed parameter controls loaded in interactive drum picker.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default React.memo(MobileCephAnalysisListView);
