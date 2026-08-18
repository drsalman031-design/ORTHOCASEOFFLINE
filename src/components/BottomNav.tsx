import React from 'react';
import {
  LayoutGrid,
  FolderKanban,
  Plus,
  FileText,
  Settings as SettingsIcon,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface BottomNavProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  onPrefetchTab?: (tab: ActiveTab) => void;
  patientCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = React.memo(({
  activeTab,
  onChangeTab,
  onPrefetchTab,
  patientCount = 0,
}) => {
  return (
    <nav
      className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 relative shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="w-full max-w-md mx-auto flex items-center justify-between h-[60px] px-3">
        {/* 1. Dashboard */}
        <button
          type="button"
          onPointerEnter={() => onPrefetchTab?.('home')}
          onClick={() => onChangeTab('home')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-all active:scale-95 ${
            activeTab === 'home' ? 'text-[#071B49]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <LayoutGrid className={`w-4.5 h-4.5 ${activeTab === 'home' ? 'stroke-[2.4px] text-[#071B49]' : 'stroke-[1.8px]'}`} />
          <span className={`text-[11px] leading-none mt-1 ${activeTab === 'home' ? 'font-bold text-[#071B49]' : 'font-medium text-slate-500'}`}>
            Dashboard
          </span>
        </button>

        {/* 2. My Cases */}
        <button
          type="button"
          onPointerEnter={() => onPrefetchTab?.('patients')}
          onClick={() => onChangeTab('patients')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-all active:scale-95 ${
            activeTab === 'patients' || activeTab === 'review' ? 'text-[#071B49]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <FolderKanban className={`w-4.5 h-4.5 ${activeTab === 'patients' || activeTab === 'review' ? 'stroke-[2.4px] text-[#071B49]' : 'stroke-[1.8px]'}`} />
            {patientCount > 0 && (
              <span className="absolute -top-1 -right-2.5 bg-[#2563EB] text-white text-[10px] font-extrabold rounded-full h-4 min-w-[18px] px-1 flex items-center justify-center leading-none shadow-xs">
                {patientCount}
              </span>
            )}
          </div>
          <span className={`text-[11px] leading-none mt-1 ${activeTab === 'patients' || activeTab === 'review' ? 'font-bold text-[#071B49]' : 'font-medium text-slate-500'}`}>
            My Cases
          </span>
        </button>

        {/* 3. CENTER ELEVATED FAB: Record Case */}
        <div className="flex-1 flex justify-center items-center h-full">
          <button
            type="button"
            onPointerEnter={() => onPrefetchTab?.('form')}
            onClick={() => onChangeTab('form')}
            className="w-12 h-12 -mt-5 bg-[#071B49] hover:bg-[#0A2668] text-white rounded-full flex items-center justify-center shadow-lg shadow-[#071B49]/30 border-4 border-white transition-all active:scale-90 cursor-pointer z-20 shrink-0"
            title="Record New Case"
            aria-label="Record New Case"
          >
            <Plus className="w-5 h-5 stroke-[2.8px] text-white" />
          </button>
        </div>

        {/* 4. PDF Reports */}
        <button
          type="button"
          onPointerEnter={() => onPrefetchTab?.('reports')}
          onClick={() => onChangeTab('reports')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-all active:scale-95 ${
            activeTab === 'reports' ? 'text-[#071B49]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className={`w-4.5 h-4.5 ${activeTab === 'reports' ? 'stroke-[2.4px] text-[#071B49]' : 'stroke-[1.8px]'}`} />
          <span className={`text-[11px] leading-none mt-1 ${activeTab === 'reports' ? 'font-bold text-[#071B49]' : 'font-medium text-slate-500'}`}>
            PDF Reports
          </span>
        </button>

        {/* 5. Settings */}
        <button
          type="button"
          onPointerEnter={() => onPrefetchTab?.('settings')}
          onClick={() => onChangeTab('settings')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-all active:scale-95 ${
            activeTab === 'settings' ? 'text-[#071B49]' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <SettingsIcon className={`w-4.5 h-4.5 ${activeTab === 'settings' ? 'stroke-[2.4px] text-[#071B49]' : 'stroke-[1.8px]'}`} />
          <span className={`text-[11px] leading-none mt-1 ${activeTab === 'settings' ? 'font-bold text-[#071B49]' : 'font-medium text-slate-500'}`}>
            Settings
          </span>
        </button>
      </div>
    </nav>
  );
});

