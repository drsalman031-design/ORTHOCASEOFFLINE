import React, { useState, useEffect, useMemo } from 'react';
import {
  DownsAnalysisData,
  SteinersAnalysisData,
  RickettsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CogsSoftTissueAnalysisData,
  CephDiscrepancyAnalysisData,
  VerticalJawDivergenceAnalysisData,
  SagittalVerticalInteractionAnalysisData,
  Gender,
} from '../../types';
import { DownsAnalysis } from './DownsAnalysis';
import { SteinersAnalysis } from './SteinersAnalysis';
import { RickettsAnalysis } from './RickettsAnalysis';
import { McnamaraAnalysis } from './McnamaraAnalysis';
import { SchwarzTweedAnalysis } from './SchwarzTweedAnalysis';
import { HoldawayAnalysis } from './HoldawayAnalysis';
import { CogsAnalysis } from './CogsAnalysis';
import { CephDiscrepancyAnalysis } from './CephDiscrepancyAnalysis';
import { ComprehensiveCephAnalysis } from './ComprehensiveCephAnalysis';
import { ChevronLeft, ChevronRight, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const CEPH_PAGES = [
  { id: 'downs', label: 'Downs Analysis' },
  { id: 'steiners', label: "Steiner's Analysis" },
  { id: 'ricketts', label: 'Ricketts Analysis' },
  { id: 'mcnamara', label: 'McNamara Analysis' },
  { id: 'schwarzTweed', label: 'Schwarz & Tweed Analysis' },
  { id: 'holdaway', label: 'Holdaway Soft Tissue Analysis' },
  { id: 'cogs', label: 'COGS Analysis' },
  { id: 'cephDiscrepancy', label: 'Ceph Discrepancy & Case Synthesis' },
] as const;

export type MobileFilterStatus = 'all' | 'in_progress' | 'completed' | 'deviations';

interface TabCephalometricAnalysisProps {
  downsAnalysis?: DownsAnalysisData;
  onUpdateDownsAnalysis?: (data: DownsAnalysisData) => void;
  steinersAnalysis?: SteinersAnalysisData;
  onUpdateSteinersAnalysis?: (data: SteinersAnalysisData) => void;
  rickettsAnalysis?: RickettsAnalysisData;
  onUpdateRickettsAnalysis?: (data: RickettsAnalysisData) => void;
  mcnamaraAnalysis?: McnamaraAnalysisData;
  onUpdateMcnamaraAnalysis?: (data: McnamaraAnalysisData) => void;
  schwarzTweedAnalysis?: SchwarzTweedAnalysisData;
  onUpdateSchwarzTweedAnalysis?: (data: SchwarzTweedAnalysisData) => void;
  holdawayAnalysis?: HoldawayAnalysisData;
  onUpdateHoldawayAnalysis?: (data: HoldawayAnalysisData) => void;
  cogsAnalysis?: CogsAnalysisData;
  onUpdateCogsAnalysis?: (data: CogsAnalysisData) => void;
  cogsSoftTissueAnalysis?: CogsSoftTissueAnalysisData;
  onUpdateCogsSoftTissueAnalysis?: (data: CogsSoftTissueAnalysisData) => void;
  cephDiscrepancyAnalysis?: CephDiscrepancyAnalysisData;
  onUpdateCephDiscrepancyAnalysis?: (data: CephDiscrepancyAnalysisData) => void;
  verticalJawDivergenceAnalysis?: VerticalJawDivergenceAnalysisData;
  onUpdateVerticalJawDivergenceAnalysis?: (data: VerticalJawDivergenceAnalysisData) => void;
  sagittalVerticalInteractionAnalysis?: SagittalVerticalInteractionAnalysisData;
  onUpdateSagittalVerticalInteractionAnalysis?: (data: SagittalVerticalInteractionAnalysisData) => void;
  patientAge?: number | string;
  patientGender?: Gender;
  activeSubPage?: string;
  onSubPageChange?: (subPageId: string) => void;
  onPrevTab?: () => void;
  onNextTab?: () => void;
}

export const TabCephalometricAnalysis: React.FC<TabCephalometricAnalysisProps> = ({
  downsAnalysis,
  onUpdateDownsAnalysis,
  steinersAnalysis,
  onUpdateSteinersAnalysis,
  rickettsAnalysis,
  onUpdateRickettsAnalysis,
  mcnamaraAnalysis,
  onUpdateMcnamaraAnalysis,
  schwarzTweedAnalysis,
  onUpdateSchwarzTweedAnalysis,
  holdawayAnalysis,
  onUpdateHoldawayAnalysis,
  cogsAnalysis,
  onUpdateCogsAnalysis,
  cogsSoftTissueAnalysis,
  onUpdateCogsSoftTissueAnalysis,
  cephDiscrepancyAnalysis,
  onUpdateCephDiscrepancyAnalysis,
  verticalJawDivergenceAnalysis,
  onUpdateVerticalJawDivergenceAnalysis,
  sagittalVerticalInteractionAnalysis,
  onUpdateSagittalVerticalInteractionAnalysis,
  patientAge = 12,
  patientGender = 'Male',
  activeSubPage = 'downs',
  onSubPageChange,
  onPrevTab,
  onNextTab,
}) => {
  const [activeStage, setActiveStage] = useState<'pre' | 'mid' | 'post'>('pre');
  const [openAccordion, setOpenAccordion] = useState<string>(activeSubPage || 'downs');
  const [activeFilter, setActiveFilter] = useState<MobileFilterStatus>('all');

  useEffect(() => {
    if (activeSubPage && activeSubPage !== openAccordion) {
      setOpenAccordion(activeSubPage);
    }
  }, [activeSubPage]);

  // Overall Tracing Statistics Calculation
  const stats = useMemo(() => {
    const stageKey = activeStage === 'pre' ? 'pre' : activeStage === 'mid' ? 'mid' : 'post';

    // Downs
    const downsMeasured = downsAnalysis?.[stageKey] ? Object.values(downsAnalysis[stageKey] || {}).filter(v => v !== '' && v !== null && v !== undefined).length : 0;
    
    // Steiners
    const steinersMeasured = steinersAnalysis?.[stageKey] ? Object.values(steinersAnalysis[stageKey] || {}).filter(v => v !== '' && v !== null && v !== undefined).length : 0;

    // Ricketts
    const rickettsMeasured = rickettsAnalysis?.[stageKey] ? Object.values(rickettsAnalysis[stageKey] || {}).filter(v => v !== '' && v !== null && v !== undefined).length : 0;

    // McNamara
    const mcnamaraMeasured = mcnamaraAnalysis?.[stageKey] ? Object.values(mcnamaraAnalysis[stageKey] || {}).filter(v => v !== '' && v !== null && v !== undefined).length : 0;

    // Schwarz Tweed
    const schwarzMeasured = schwarzTweedAnalysis?.[stageKey] ? Object.values(schwarzTweedAnalysis[stageKey] || {}).filter(v => v !== '' && v !== null && v !== undefined).length : 0;

    // Holdaway
    const holdawayMeasured = holdawayAnalysis?.[stageKey] ? Object.values(holdawayAnalysis[stageKey] || {}).filter(v => v !== '' && v !== null && v !== undefined).length : 0;

    // COGS
    const cogsMeasured = cogsAnalysis?.[stageKey] ? Object.values(cogsAnalysis[stageKey] || {}).filter(v => v !== '' && v !== null && v !== undefined).length : 0;

    // Ceph Discrepancy
    const cephDiscMeasured = cephDiscrepancyAnalysis?.[stageKey] ? Object.values(cephDiscrepancyAnalysis[stageKey] || {}).filter(v => v !== '' && v !== null && v !== undefined).length : 0;

    const totalMeasured = downsMeasured + steinersMeasured + rickettsMeasured + mcnamaraMeasured + schwarzMeasured + holdawayMeasured + cogsMeasured + cephDiscMeasured;
    const totalMax = 75; // Total parameters across all cephalometric sets

    // Card status counts
    const cards = [
      { id: 'downs', measured: downsMeasured, total: 10 },
      { id: 'steiners', measured: steinersMeasured, total: 11 },
      { id: 'ricketts', measured: rickettsMeasured, total: 8 },
      { id: 'mcnamara', measured: mcnamaraMeasured, total: 10 },
      { id: 'schwarzTweed', measured: schwarzMeasured, total: 7 },
      { id: 'holdaway', measured: holdawayMeasured, total: 8 },
      { id: 'cogs', measured: cogsMeasured, total: 23 },
      { id: 'cephDiscrepancy', measured: cephDiscMeasured, total: 12 },
    ];

    const inProgressCount = cards.filter(c => c.measured > 0 && c.measured < c.total).length;
    const completedCount = cards.filter(c => c.measured === c.total && c.total > 0).length;

    return {
      totalMeasured,
      totalMax,
      inProgressCount,
      completedCount,
      cardsMap: Object.fromEntries(cards.map(c => [c.id, c])),
    };
  }, [
    activeStage,
    downsAnalysis,
    steinersAnalysis,
    rickettsAnalysis,
    mcnamaraAnalysis,
    schwarzTweedAnalysis,
    holdawayAnalysis,
    cogsAnalysis,
    cephDiscrepancyAnalysis,
  ]);

  const handleSelectPage = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? '' : id));
    if (onSubPageChange) {
      onSubPageChange(id);
    }
  };

  const handlePrevPage = (currentId: string) => {
    const index = CEPH_PAGES.findIndex((p) => p.id === currentId);
    if (index > 0) {
      const prevId = CEPH_PAGES[index - 1].id;
      handleSelectPage(prevId);
      setTimeout(() => {
        const el = document.getElementById(`ceph-page-${prevId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else if (onPrevTab) {
      onPrevTab();
    }
  };

  const handleNextPage = (currentId: string) => {
    const index = CEPH_PAGES.findIndex((p) => p.id === currentId);
    if (index >= 0 && index < CEPH_PAGES.length - 1) {
      const nextId = CEPH_PAGES[index + 1].id;
      handleSelectPage(nextId);
      setTimeout(() => {
        const el = document.getElementById(`ceph-page-${nextId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    } else if (onNextTab) {
      onNextTab();
    }
  };

  return (
    <div className="w-full max-w-full box-border overflow-x-hidden space-y-3 pb-6">
      {/* 1. STICKY TOP MOBILE TOOLBAR & SUMMARY HEADER */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs transition-all rounded-2xl mb-3 overflow-hidden">
        {/* Row 1: Overall Progress & Clinical Stage Switcher */}
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-2xs font-bold text-xs">
              <Activity className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
                  Overall Ceph Progress
                </h3>
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.2 rounded-full">
                  {stats.totalMeasured}/{stats.totalMax} Measured
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-28 sm:w-40 bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200/60">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(stats.totalMeasured / stats.totalMax) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Stage Switcher */}
          <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 shrink-0">
            {(['pre', 'mid', 'post'] as const).map((stage) => (
              <button
                key={stage}
                type="button"
                onClick={() => setActiveStage(stage)}
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

        {/* Row 2: Horizontal Thumb-Scrollable Segment Control / Filter Pills */}
        <div className="px-3.5 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth touch-pan-x">
          {[
            { id: 'all', label: 'All Analyses', count: CEPH_PAGES.length },
            { id: 'in_progress', label: 'In Progress', count: stats.inProgressCount },
            { id: 'completed', label: 'Completed', count: stats.completedCount },
          ].map((filter) => {
            const isActive = activeFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setActiveFilter(filter.id as MobileFilterStatus)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer select-none active:scale-95 min-h-[34px] ${
                  isActive
                    ? 'bg-teal-700 text-white shadow-xs border border-teal-800'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 active:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <span>{filter.label}</span>
                <span
                  className={`px-1.5 py-0.2 text-[10px] rounded-full font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        <div id="ceph-page-downs">
          <DownsAnalysis
            data={downsAnalysis}
            onChange={onUpdateDownsAnalysis}
            activeStage={activeStage}
            isOpen={openAccordion === 'downs'}
            onToggle={() => handleSelectPage('downs')}
          />
        </div>

        <div id="ceph-page-steiners">
          <SteinersAnalysis
            data={steinersAnalysis}
            onChange={onUpdateSteinersAnalysis}
            activeStage={activeStage}
            isOpen={openAccordion === 'steiners'}
            onToggle={() => handleSelectPage('steiners')}
          />
        </div>

        <div id="ceph-page-ricketts">
          <RickettsAnalysis
            data={rickettsAnalysis}
            onChange={onUpdateRickettsAnalysis}
            activeStage={activeStage}
            patientAge={patientAge}
            isOpen={openAccordion === 'ricketts'}
            onToggle={() => handleSelectPage('ricketts')}
          />
        </div>

        <div id="ceph-page-mcnamara">
          <McnamaraAnalysis
            data={mcnamaraAnalysis}
            onChange={onUpdateMcnamaraAnalysis}
            activeStage={activeStage}
            isOpen={openAccordion === 'mcnamara'}
            onToggle={() => handleSelectPage('mcnamara')}
          />
        </div>

        <div id="ceph-page-schwarzTweed">
          <SchwarzTweedAnalysis
            data={schwarzTweedAnalysis}
            onChange={onUpdateSchwarzTweedAnalysis}
            activeStage={activeStage}
            isOpen={openAccordion === 'schwarzTweed'}
            onToggle={() => handleSelectPage('schwarzTweed')}
          />
        </div>

        <div id="ceph-page-holdaway">
          <HoldawayAnalysis
            data={holdawayAnalysis}
            onChange={onUpdateHoldawayAnalysis}
            activeStage={activeStage}
            isOpen={openAccordion === 'holdaway'}
            onToggle={() => handleSelectPage('holdaway')}
            steinersAnalysis={steinersAnalysis}
          />
        </div>

        <div id="ceph-page-cogs">
          <CogsAnalysis
            data={cogsAnalysis}
            onChange={onUpdateCogsAnalysis}
            softTissueData={cogsSoftTissueAnalysis}
            onSoftTissueChange={onUpdateCogsSoftTissueAnalysis}
            activeStage={activeStage}
            isOpen={openAccordion === 'cogs'}
            onToggle={() => handleSelectPage('cogs')}
            patientGender={patientGender}
          />
        </div>

        <div id="ceph-page-cephDiscrepancy">
          <CephDiscrepancyAnalysis
            data={cephDiscrepancyAnalysis}
            onChange={onUpdateCephDiscrepancyAnalysis}
            activeStage={activeStage}
            isOpen={openAccordion === 'cephDiscrepancy'}
            onToggle={() => handleSelectPage('cephDiscrepancy')}
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
          />
        </div>
      </div>
    </div>
  );
};

export default React.memo(TabCephalometricAnalysis);
