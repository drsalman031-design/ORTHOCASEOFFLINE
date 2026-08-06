import React, { useState } from 'react';
import {
  TrendingUp,
  PieChart as PieIcon,
  Activity,
  BarChart2,
  Stethoscope,
  RefreshCw,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const [timeframe, setTimeframe] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY');

  // 1. Malocclusion Distribution Data (126 Total Cases)
  const malocclusionData = [
    { name: 'Class 1', count: 42, color: '#00317e' },
    { name: 'Class 2', count: 30, color: '#0046ad' },
    { name: 'Class 2 Div 1', count: 18, color: '#3f5c9e' },
    { name: 'Class 2 Div 2', count: 12, color: '#98b5fd' },
    { name: 'Class 3', count: 10, color: '#ba1a1a' },
    { name: 'Open Bite', count: 6, color: '#00a082' },
    { name: 'Deep Bite', count: 5, color: '#2f3742' },
    { name: 'Orthognathic Surgery', count: 3, color: '#737784' },
  ];

  // 2. Approval & Submission Velocity Data
  const velocityData = [
    { month: 'Jan', Submitted: 18, Approved: 16, Revisions: 2 },
    { month: 'Feb', Submitted: 24, Approved: 21, Revisions: 3 },
    { month: 'Mar', Submitted: 28, Approved: 25, Revisions: 3 },
    { month: 'Apr', Submitted: 22, Approved: 20, Revisions: 2 },
    { month: 'May', Submitted: 32, Approved: 29, Revisions: 3 },
    { month: 'Jun', Submitted: 30, Approved: 28, Revisions: 2 },
  ];

  // 3. Cephalometric Diagnostic Means Standards vs Department Average
  const cephNormsData = [
    { metric: 'SNA (°)', MeanNorm: 82, DeptAvg: 81.8 },
    { metric: 'SNB (°)', MeanNorm: 80, DeptAvg: 78.2 },
    { metric: 'ANB (°)', MeanNorm: 2, DeptAvg: 3.6 },
    { metric: 'IMPA (°)', MeanNorm: 90, DeptAvg: 94.5 },
    { metric: 'Wits (mm)', MeanNorm: 0, DeptAvg: 1.2 },
  ];

  // 4. Appliance Modality Usage
  const applianceData = [
    { name: 'Pre-adjusted Edgewise (MBT .022)', percentage: 55, color: '#00317e' },
    { name: 'Self-Ligating Brackets', percentage: 20, color: '#0046ad' },
    { name: 'Clear Aligners', percentage: 12, color: '#00a082' },
    { name: 'Functional & Orthopedic', percentage: 8, color: '#3f5c9e' },
    { name: 'Surgical Orthodontics', percentage: 5, color: '#ba1a1a' },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-5 pb-10 font-sans box-border min-w-0">
      {/* SUB-HEADER & LIVE SYNC INDICATOR */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="text-xs font-semibold tracking-wide">
            Dept. of Orthodontics • HOD Portal
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-600">Sync: Updated</span>
        </div>
      </div>

      {/* ANALYTICS HERO CARD */}
      <section className="relative overflow-hidden bg-[#00317e] text-white rounded-2xl p-3.5 sm:p-4 shadow-sm">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5 max-w-md">
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
              Academic & Clinical Analytics
            </h2>
            <p className="text-[11px] sm:text-xs text-blue-100/90 font-medium leading-snug">
              Department Case Distribution & Approval Trends
            </p>
          </div>

          <div className="flex items-center sm:flex-col sm:items-end gap-2.5">
            <div className="bg-white/10 p-2 rounded-xl border border-white/20 backdrop-blur-xs shrink-0 hidden sm:block">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>

            {/* TIMEFRAME TOGGLE BUTTONS */}
            <div className="inline-flex p-0.5 bg-white/15 rounded-xl border border-white/20 backdrop-blur-xs">
              {(['MONTHLY', 'QUARTERLY', 'YEARLY'] as const).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setTimeframe(tf)}
                  className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                    timeframe === tf
                      ? 'bg-white text-[#00317e] shadow-2xs'
                      : 'text-blue-100 hover:text-white'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CHART GRID 1: MALOCCLUSION DISTRIBUTION & APPROVAL VELOCITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* MALOCCLUSION DISTRIBUTION CHART */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#00317e]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Malocclusion Distribution
              </h3>
            </div>
            <div className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-right">
              <span className="text-xs font-extrabold text-[#00317e]">126 Total</span>
              <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">Cases</span>
            </div>
          </div>

          {/* DONUT CHART WITH CENTER METRIC */}
          <div className="relative h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={malocclusionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {malocclusionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} cases`, 'Total']}
                  contentStyle={{
                    backgroundColor: '#00317e',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: 'none',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status
              </span>
              <span className="text-base font-extrabold text-[#00317e]">Healthy</span>
            </div>
          </div>

          {/* LEGEND GRID */}
          <div className="grid grid-cols-2 gap-y-2.5 gap-x-2 pt-3 border-t border-slate-100 text-xs">
            {malocclusionData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium text-slate-600 truncate">{item.name}</span>
                <span className="font-extrabold text-slate-900 ml-auto">{item.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* APPROVAL & SUBMISSION VELOCITY */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00317e]" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Approval & Submission Velocity
              </h3>
            </div>
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
              94% Approval Rate
            </span>
          </div>

          <div className="h-52 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={velocityData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#00317e',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: 'none',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="Submitted"
                  stroke="#0046ad"
                  strokeWidth={2.5}
                  dot={{ fill: '#0046ad', r: 3.5 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Approved"
                  stroke="#00a082"
                  strokeWidth={2.5}
                  dot={{ fill: '#00a082', r: 3.5 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="Revisions"
                  stroke="#ba1a1a"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  dot={{ fill: '#ba1a1a', r: 2.5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* LINE CHART LEGEND */}
          <div className="flex justify-around items-center pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#0046ad] rounded-full" />
              <span className="text-[11px] font-bold text-slate-700">Submitted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#00a082] rounded-full" />
              <span className="text-[11px] font-bold text-slate-700">Approved</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-[#ba1a1a] rounded-full opacity-60" />
              <span className="text-[11px] font-bold text-slate-700">Revisions</span>
            </div>
          </div>
        </section>
      </div>

      {/* CHART GRID 2: CEPHALOMETRIC MEANS & APPLIANCE MODALITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CEPHALOMETRIC DIAGNOSTIC MEANS */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3 shadow-2xs">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-[#00317e]" /> Cephalometric Diagnostic Means
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Steiner/Tweed Standard Norms vs Department Case Averages
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cephNormsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="metric" stroke="#64748b" fontSize={11} fontWeight="bold" tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#00317e',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    border: 'none',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Bar dataKey="MeanNorm" fill="#94a3b8" name="Standard Norm" radius={[4, 4, 0, 0]} />
                <Bar dataKey="DeptAvg" fill="#00317e" name="Dept Average" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* APPLIANCE MODALITY USAGE */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00317e]" /> Appliance Modality Distribution
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Active patient cases broken down by treatment technique
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {applianceData.map((item) => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-slate-800">{item.name}</span>
                  <span className="font-extrabold text-[#00317e]">{item.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

