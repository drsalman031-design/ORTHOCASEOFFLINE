import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  FileText,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  History,
  User,
  Archive,
  ArchiveRestore,
  Trash2,
  FileCheck2,
} from 'lucide-react';
import { PatientRecord } from '../types';
import { getCurrentUserAccount } from '../lib/authContext';

interface PatientListProps {
  patients: PatientRecord[];
  initialFilter?: FilterTab;
  onSelectPatient: (patient: PatientRecord) => void;
  onEditPatient: (patient: PatientRecord) => void;
  onGeneratePDF: (patient: PatientRecord) => void;
  onToggleArchive: (patientId: string) => void;
  onDeletePatient: (patientId: string) => void;
  onNewCase: () => void;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'corrections' | 'archived';

interface PatientCardProps {
  p: PatientRecord;
  onSelectPatient: (patient: PatientRecord) => void;
  onGeneratePDF: (patient: PatientRecord) => void;
  onToggleArchive: (patientId: string) => void;
}

const PatientCard: React.FC<PatientCardProps> = React.memo(({
  p,
  onSelectPatient,
  onGeneratePDF,
  onToggleArchive,
}) => {
  const score = p.completionStatus?.overallPercentage || 0;
  const isApproved = score >= 80;
  const isPending = score >= 50 && score < 80;

  const sna = p.cephAnalysis?.SNA ?? 82;
  const snb = p.cephAnalysis?.SNB ?? 78;
  const anb = p.cephAnalysis?.ANB ?? 4;
  const molarRel = p.intraoralExam?.molarRight || p.intraoralExam?.molarLeft || 'Class I';
  const diagnosis = p.diagnosisAndPlan?.provisionalDiagnosis || "Angle's Class II division 1 malocclusion on a Skeletal Class II base due to retrognathic mandible, with severe overjet and deep bite.";

  const initials = p.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow group cursor-pointer"
      onClick={() => onSelectPatient(p)}
    >
      <div className="p-4 sm:p-5 space-y-3.5">
        {/* Top Row: Patient Avatar, Details & Status */}
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#00317e] font-extrabold text-sm shrink-0 overflow-hidden">
              {p.photoUrl ? (
                <img
                  src={p.photoUrl}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span>{initials || 'PT'}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-base text-slate-900 group-hover:text-[#00317e] transition-colors truncate">
                {p.name}
              </h3>
              <p className="text-slate-500 font-mono text-xs flex items-center gap-1.5 mt-0.5 truncate">
                <span className="font-bold text-slate-700">{p.patientId}</span>
                <span className="text-slate-300">•</span>
                <span>
                  {p.age} Yrs • {p.gender}
                </span>
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="shrink-0">
            {isApproved ? (
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Approved</span>
              </span>
            ) : isPending ? (
              <span className="bg-amber-50 text-amber-800 border border-amber-200/80 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending</span>
              </span>
            ) : (
              <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Corrections</span>
              </span>
            )}
          </div>
        </div>

        {/* Clinical Summary Box */}
        <div className="bg-slate-50 p-3.5 rounded-lg border-l-4 border-[#00317e]/30">
          <p className="text-slate-700 text-xs font-medium italic leading-relaxed">
            "{diagnosis}"
          </p>
        </div>

        {/* Analysis Section (Grid) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50 flex flex-col gap-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              Ceph Metrics
            </span>
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-slate-800 font-bold text-xs">
              <span>SNA: {sna}°</span>
              <span>SNB: {snb}°</span>
              <span>ANB: {anb}°</span>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/50 flex flex-col gap-1">
            <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              Molar Relationship
            </span>
            <span className="text-slate-800 font-bold text-xs">{molarRel}</span>
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span>Updated: {new Date(p.updatedAt).toLocaleDateString('en-GB')}</span>
        </div>

        <div className="flex items-center gap-2">
          {p.archived ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleArchive(p.id);
              }}
              className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-slate-100 font-bold text-xs cursor-pointer"
              title="Restore Case"
            >
              <ArchiveRestore className="w-3.5 h-3.5 text-blue-600" />
              <span>Restore</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onGeneratePDF(p);
            }}
            className="bg-white border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-slate-100 transition-all active:scale-95 font-bold text-xs cursor-pointer shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#00317e]" />
            <span>PDF</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPatient(p);
            }}
            className="bg-[#00317e] text-white px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 hover:bg-blue-900 transition-all active:scale-95 font-bold text-xs shadow-2xs cursor-pointer"
          >
            <span>View Case</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
});

export const PatientList: React.FC<PatientListProps> = React.memo(({
  patients,
  initialFilter = 'all',
  onSelectPatient,
  onEditPatient,
  onGeneratePDF,
  onToggleArchive,
  onDeletePatient,
  onNewCase,
}) => {
  const currentUser = getCurrentUserAccount();
  const isHOD = currentUser.role === 'HOD';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterTab>(initialFilter);

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  // Filter logic
  const filteredPatients = useMemo(() => {
    return patients
      .filter((p) => {
        // Archive filter
        if (activeFilter === 'archived') {
          if (!p.archived) return false;
        } else {
          if (p.archived) return false;
        }

        const score = p.completionStatus?.overallPercentage || 0;
        // Approval status mapping for demo
        if (activeFilter === 'pending' && score >= 80) return false;
        if (activeFilter === 'approved' && score < 80) return false;
        if (activeFilter === 'corrections' && score >= 50) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.patientId.toLowerCase().includes(q) ||
          p.contact.includes(q) ||
          (p.intraoralExam?.molarRight && p.intraoralExam.molarRight.toLowerCase().includes(q)) ||
          (p.diagnosisAndPlan?.provisionalDiagnosis && p.diagnosisAndPlan.provisionalDiagnosis.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [patients, activeFilter, searchQuery]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-8 font-sans box-border min-w-0">
      {/* HEADER & ACTIVE BADGE */}
      <div className="flex justify-between items-center gap-2 min-w-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Case Directory</h2>
        </div>
        <div className="bg-blue-50 border border-blue-200 text-[#00317e] px-3 py-1 rounded-lg shrink-0">
          <span className="text-xs font-bold">{filteredPatients.length} Active</span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div className="relative group w-full">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00317e] transition-colors" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search UHID, Name, Diagnosis..."
          className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-[#00317e] outline-none shadow-2xs transition-all"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* FILTER CHIPS (HORIZONTAL SCROLL) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pb-1 w-full min-w-0">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-[#00317e] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          All ({patients.filter((p) => !p.archived).length})
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Pending</span>
          <span className="text-xs">⌛</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('approved')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeFilter === 'approved'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          <span>Approved</span>
          <span className="text-emerald-600 font-bold text-xs">✓</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('corrections')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'corrections'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Corrections
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('archived')}
          className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
            activeFilter === 'archived'
              ? 'bg-slate-800 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Archived ({patients.filter((p) => p.archived).length})
        </button>
      </div>

      {/* CLINICAL PRECISION CASE QUEUE CARDS */}
      {filteredPatients.length === 0 ? (
        <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 bg-white space-y-2">
          <FileCheck2 className="w-10 h-10 text-slate-300" />
          <p className="text-xs font-bold text-slate-700">End of Case Directory</p>
          <p className="text-[11px] text-slate-400">No cases match the selected filter query.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPatients.map((p) => (
            <PatientCard
              key={p.id}
              p={p}
              onSelectPatient={onSelectPatient}
              onGeneratePDF={onGeneratePDF}
              onToggleArchive={onToggleArchive}
            />
          ))}
        </div>
      )}
    </div>
  );
});


