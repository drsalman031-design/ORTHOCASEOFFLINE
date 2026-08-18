import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  BookOpen,
  Award,
  UserCheck,
  FileText,
  Mail,
  Phone,
  UserPlus,
  X,
  ArrowRight,
  School,
  Check,
} from 'lucide-react';
import { PatientRecord } from '../types';

interface Resident {
  id: string;
  name: string;
  year: string;
  yearBatch: 'Year 1' | 'Year 2' | 'Year 3';
  rollNumber: string;
  guide: string;
  email: string;
  phone: string;
  status: 'On Schedule' | 'Behind Schedule';
  totalCases: number;
  approvedCases: number;
  pendingApprovals: number;
  seminarCredits: number;
  journalClubs: number;
  cephAccuracy: string;
  avatar: string;
}

interface StudentDirectoryProps {
  patients: PatientRecord[];
  onSelectStudentCases?: (studentId: string) => void;
}

const INITIAL_RESIDENTS: Resident[] = [
  {
    id: 'usr-student-1',
    name: 'Dr. Rahul Sharma',
    year: 'PG Year 2 (2023-2026)',
    yearBatch: 'Year 2',
    rollNumber: 'ORTHO-2023-PG-01',
    guide: 'Dr. Sunita Patil',
    email: 'rahul.sharma@institution.edu',
    phone: '+91 98765 43210',
    status: 'On Schedule',
    totalCases: 8,
    approvedCases: 6,
    pendingApprovals: 2,
    seminarCredits: 14,
    journalClubs: 8,
    cephAccuracy: '96%',
    avatar: 'R',
  },
  {
    id: 'usr-student-2',
    name: 'Dr. Ananya Sen',
    year: 'PG Year 1 (2024-2027)',
    yearBatch: 'Year 1',
    rollNumber: 'ORTHO-2024-PG-04',
    guide: 'Dr. Rajesh Khanna',
    email: 'ananya.sen@institution.edu',
    phone: '+91 98765 88123',
    status: 'Behind Schedule',
    totalCases: 4,
    approvedCases: 2,
    pendingApprovals: 2,
    seminarCredits: 6,
    journalClubs: 4,
    cephAccuracy: '92%',
    avatar: 'A',
  },
  {
    id: 'usr-student-3',
    name: 'Dr. Vikramaditya Reddy',
    year: 'PG Year 3 (2022-2025)',
    yearBatch: 'Year 3',
    rollNumber: 'ORTHO-2022-PG-02',
    guide: 'Dr. Sunita Patil',
    email: 'vikram.reddy@institution.edu',
    phone: '+91 98123 77654',
    status: 'On Schedule',
    totalCases: 14,
    approvedCases: 12,
    pendingApprovals: 2,
    seminarCredits: 22,
    journalClubs: 12,
    cephAccuracy: '98%',
    avatar: 'V',
  },
  {
    id: 'usr-student-4',
    name: 'Dr. Priya Patel',
    year: 'PG Year 2 (2023-2026)',
    yearBatch: 'Year 2',
    rollNumber: 'ORTHO-2023-PG-05',
    guide: 'Dr. A. K. Varma',
    email: 'priya.patel@institution.edu',
    phone: '+91 97654 32109',
    status: 'On Schedule',
    totalCases: 9,
    approvedCases: 8,
    pendingApprovals: 1,
    seminarCredits: 16,
    journalClubs: 10,
    cephAccuracy: '95%',
    avatar: 'P',
  },
];

export const StudentDirectory: React.FC<StudentDirectoryProps> = ({ patients }) => {
  const [residents, setResidents] = useState<Resident[]>(() => {
    const saved = localStorage.getItem('orthocase_residents');
    return saved ? JSON.parse(saved) : INITIAL_RESIDENTS;
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('ALL');
  const [selectedDossier, setSelectedDossier] = useState<Resident | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Resident Form State
  const [newResident, setNewResident] = useState({
    name: '',
    yearBatch: 'Year 1' as 'Year 1' | 'Year 2' | 'Year 3',
    rollNumber: '',
    guide: '',
    email: '',
    phone: '',
  });

  const handleSaveResident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResident.name || !newResident.rollNumber) return;

    const yearString =
      newResident.yearBatch === 'Year 1'
        ? 'PG Year 1 (2024-2027)'
        : newResident.yearBatch === 'Year 2'
        ? 'PG Year 2 (2023-2026)'
        : 'PG Year 3 (2022-2025)';

    const created: Resident = {
      id: `usr-student-${Date.now()}`,
      name: newResident.name.startsWith('Dr.') ? newResident.name : `Dr. ${newResident.name}`,
      year: yearString,
      yearBatch: newResident.yearBatch,
      rollNumber: newResident.rollNumber,
      guide: newResident.guide || 'Dr. Sunita Patil',
      email: newResident.email || `${newResident.name.toLowerCase().replace(/[^a-z]/g, '')}@institution.edu`,
      phone: newResident.phone || '+91 98765 00000',
      status: 'On Schedule',
      totalCases: 0,
      approvedCases: 0,
      pendingApprovals: 0,
      seminarCredits: 0,
      journalClubs: 0,
      cephAccuracy: '95%',
      avatar: newResident.name.replace('Dr. ', '')[0]?.toUpperCase() || 'R',
    };

    const updated = [created, ...residents];
    setResidents(updated);
    localStorage.setItem('orthocase_residents', JSON.stringify(updated));

    setNewResident({
      name: '',
      yearBatch: 'Year 1',
      rollNumber: '',
      guide: '',
      email: '',
      phone: '',
    });
    setIsAddModalOpen(false);
  };

  const residentsWithLiveMetrics = useMemo(() => {
    return residents.map((r) => {
      const studentCases = (patients || []).filter(
        (p) =>
          p.studentOwnerId === r.id ||
          (r.id === 'usr-student-1' && !p.studentOwnerId) // default primary student
      );
      const liveTotal = studentCases.length;
      const liveApproved = studentCases.filter((p) => p.approvalStatus === 'APPROVED').length;
      const livePending = liveTotal - liveApproved;

      return {
        ...r,
        totalCases: liveTotal > 0 ? liveTotal : r.totalCases,
        approvedCases: liveTotal > 0 ? liveApproved : r.approvedCases,
        pendingApprovals: liveTotal > 0 ? livePending : r.pendingApprovals,
      };
    });
  }, [residents, patients]);

  const filteredStudents = residentsWithLiveMetrics.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guide.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBatch =
      selectedBatch === 'ALL' ||
      (selectedBatch === 'Year 1' && s.yearBatch === 'Year 1') ||
      (selectedBatch === 'Year 2' && s.yearBatch === 'Year 2') ||
      (selectedBatch === 'Year 3' && s.yearBatch === 'Year 3');
    return matchesSearch && matchesBatch;
  });

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-10 font-sans box-border min-w-0">
      {/* HERO SECTION CARD */}
      <section className="relative overflow-hidden bg-[#00317e] text-white rounded-2xl p-3.5 sm:p-4 shadow-sm">
        <div className="relative z-10 flex items-center justify-between gap-3">
          <div className="space-y-0.5 max-w-[85%]">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-snug">
              Postgraduate Resident Directory
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-100/90 leading-snug font-medium">
              Department of Orthodontics & Dentofacial Orthopedics. View performance metrics & case progress.
            </p>
          </div>
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md shrink-0">
            <School className="w-6 h-6 text-white" />
          </div>
        </div>
        {/* Decorative background blur shapes */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-6 -top-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* SEARCH AND FILTER CONTROLS */}
      <section className="bg-white border border-slate-200/80 rounded-2xl p-4 space-y-3.5 shadow-2xs">
        <div className="relative group w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00317e] transition-colors" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resident by name, roll no, or group..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-[#00317e] outline-none transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-wider mr-2">
            <Filter className="w-3.5 h-3.5" />
            <span>Year Batch:</span>
          </div>
          {['ALL', 'Year 1', 'Year 2', 'Year 3'].map((batch) => (
            <button
              key={batch}
              type="button"
              onClick={() => setSelectedBatch(batch)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedBatch === batch
                  ? 'bg-[#00317e] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {batch}
            </button>
          ))}
        </div>
      </section>

      {/* RESIDENT DIRECTORY LIST */}
      <div className="space-y-4">
        {filteredStudents.length === 0 ? (
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-white space-y-2">
            <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-800">No Residents Found</p>
            <p className="text-[11px] text-slate-400">
              Try adjusting your search query or selecting another batch filter.
            </p>
          </div>
        ) : (
          filteredStudents.map((s) => {
            const isBehind = s.status === 'Behind Schedule';

            return (
              <article
                key={s.id}
                className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all duration-300 group space-y-4"
              >
                {/* Top Row: Avatar, Info & Guide */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="relative shrink-0">
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-50 text-[#00317e] border border-blue-200/80 font-black text-xl sm:text-2xl flex items-center justify-center">
                        {s.avatar}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-5 h-5 border-2 border-white rounded-full ${
                          isBehind ? 'bg-rose-500' : 'bg-emerald-500'
                        }`}
                        title={s.status}
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900 group-hover:text-[#00317e] transition-colors">
                          {s.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                            isBehind
                              ? 'bg-rose-50 text-rose-800 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#00317e]">{s.year}</p>
                      <p className="text-[11px] font-mono text-slate-400 uppercase tracking-tight">
                        {s.rollNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2 shrink-0">
                    <div className="flex items-center gap-2 bg-emerald-50/80 px-3 py-1.5 rounded-xl border border-emerald-200/80 w-fit">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase">
                        Guide
                      </span>
                      <span className="text-xs font-bold text-emerald-900">{s.guide}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedDossier(s)}
                      className="text-[#00317e] hover:underline text-xs font-bold flex items-center gap-1 cursor-pointer transition-opacity"
                    >
                      <span>View Full Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex flex-col items-center text-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                      Cases
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">{s.totalCases}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex flex-col items-center text-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                      Approved
                    </span>
                    <span className="text-sm font-extrabold text-emerald-600">
                      {s.approvedCases}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex flex-col items-center text-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                      Ceph Acc.
                    </span>
                    <span className="text-sm font-extrabold text-[#00317e]">
                      {s.cephAccuracy}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/60 flex flex-col items-center text-center">
                    <span className="text-slate-400 font-bold text-[10px] uppercase tracking-wider mb-0.5">
                      Seminars
                    </span>
                    <span className="text-sm font-extrabold text-purple-600">
                      {s.seminarCredits}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* FLOATING ACTION BUTTON (Add Resident) */}
      <button
        type="button"
        onClick={() => setIsAddModalOpen(true)}
        className="fixed bottom-20 right-5 sm:bottom-24 sm:right-8 w-14 h-14 bg-[#00317e] text-white rounded-full shadow-xl flex items-center justify-center hover:bg-blue-900 active:scale-95 transition-all z-40 cursor-pointer"
        title="Add PG Resident"
      >
        <UserPlus className="w-6 h-6" />
      </button>

      {/* MODAL: FULL RESIDENT DOSSIER */}
      {selectedDossier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#00317e] text-white font-extrabold text-lg flex items-center justify-center">
                  {selectedDossier.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedDossier.name}</h3>
                  <p className="text-xs text-[#00317e] font-bold">{selectedDossier.year}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedDossier.rollNumber}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contact & Guide details */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Guide</span>
                <span className="font-bold text-slate-800">{selectedDossier.guide}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Status
                </span>
                <span className="font-bold text-emerald-700">{selectedDossier.status}</span>
              </div>
              <div className="col-span-2 pt-2 border-t border-slate-200/60 flex flex-wrap gap-4 text-slate-600">
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {selectedDossier.email}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {selectedDossier.phone}
                </span>
              </div>
            </div>

            {/* Comprehensive Metrics */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Academic & Clinical Progress
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Total Submissions</span>
                  <span className="font-extrabold text-[#00317e]">{selectedDossier.totalCases}</span>
                </div>
                <div className="bg-emerald-50/60 border border-emerald-100 p-3 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Approved Cases</span>
                  <span className="font-extrabold text-emerald-700">
                    {selectedDossier.approvedCases}
                  </span>
                </div>
                <div className="bg-amber-50/60 border border-amber-100 p-3 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Pending Approvals</span>
                  <span className="font-extrabold text-amber-800">
                    {selectedDossier.pendingApprovals}
                  </span>
                </div>
                <div className="bg-purple-50/60 border border-purple-100 p-3 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Ceph Tracing Acc.</span>
                  <span className="font-extrabold text-purple-700">
                    {selectedDossier.cephAccuracy}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Seminar Credits</span>
                  <span className="font-bold text-slate-900">
                    {selectedDossier.seminarCredits}
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex justify-between items-center">
                  <span className="font-medium text-slate-700">Journal Clubs</span>
                  <span className="font-bold text-slate-900">
                    {selectedDossier.journalClubs}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Patients in System */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Active Department Cases ({patients.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {patients.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No patient cases registered in system yet.</p>
                ) : (
                  patients.map((p) => (
                    <div
                      key={p.id}
                      className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs flex justify-between items-center"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{p.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{p.patientId}</span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#00317e] border border-blue-100">
                        Active
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDossier(null)}
                className="px-4 py-2 bg-[#00317e] hover:bg-blue-900 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD PG RESIDENT */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 sm:p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#00317e]" />
                <h3 className="text-base font-bold text-slate-900">Add Postgraduate Resident</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResident} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Resident Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Smita Verma"
                  value={newResident.name}
                  onChange={(e) => setNewResident({ ...newResident, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#00317e] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Batch Year</label>
                  <select
                    value={newResident.yearBatch}
                    onChange={(e) =>
                      setNewResident({
                        ...newResident,
                        yearBatch: e.target.value as 'Year 1' | 'Year 2' | 'Year 3',
                      })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#00317e] outline-none"
                  >
                    <option value="Year 1">Year 1</option>
                    <option value="Year 2">Year 2</option>
                    <option value="Year 3">Year 3</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Roll / Reg Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ORTHO-2024-PG-09"
                    value={newResident.rollNumber}
                    onChange={(e) => setNewResident({ ...newResident, rollNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#00317e] outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Assigned Guide</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Sunita Patil"
                  value={newResident.guide}
                  onChange={(e) => setNewResident({ ...newResident, guide: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#00317e] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Institutional Email</label>
                  <input
                    type="email"
                    placeholder="email@institution.edu"
                    value={newResident.email}
                    onChange={(e) => setNewResident({ ...newResident, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#00317e] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98765 00000"
                    value={newResident.phone}
                    onChange={(e) => setNewResident({ ...newResident, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-[#00317e] outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 font-bold text-slate-700 text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00317e] hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
                >
                  Save Resident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

