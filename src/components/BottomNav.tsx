import React from 'react';
import {
  LayoutGrid,
  FolderKanban,
  Plus,
  MessageSquareText,
  GraduationCap,
  BarChart3,
  Settings as SettingsIcon,
} from 'lucide-react';
import { ActiveTab } from '../types';
import { getCurrentUserAccount } from '../lib/authContext';

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
  patientCount = 1,
}) => {
  const currentUser = getCurrentUserAccount();
  const isResident = currentUser.role === 'STUDENT';

  if (isResident) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-[50px] flex items-center justify-between px-3 relative shadow-xs">
        <div className="w-full max-w-md mx-auto flex items-center justify-between h-full">
          {/* 1. Dashboard */}
          <button
            type="button"
            onPointerEnter={() => onPrefetchTab?.('home')}
            onClick={() => onChangeTab('home')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
              activeTab === 'home' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <LayoutGrid className={`w-4 h-4 ${activeTab === 'home' ? 'stroke-[2.2px] text-blue-600' : 'stroke-[1.8px]'}`} />
            <span className={`text-[9px] leading-none mt-0.5 font-medium truncate max-w-full ${activeTab === 'home' ? 'font-bold text-blue-600' : 'text-slate-500'}`}>
              Dashboard
            </span>
          </button>

          {/* 2. My Cases */}
          <button
            type="button"
            onPointerEnter={() => onPrefetchTab?.('patients')}
            onClick={() => onChangeTab('patients')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
              activeTab === 'patients' || activeTab === 'review' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <div className="relative">
              <FolderKanban className={`w-4 h-4 ${activeTab === 'patients' || activeTab === 'review' ? 'stroke-[2.2px] text-blue-600' : 'stroke-[1.8px]'}`} />
              <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[8px] font-extrabold rounded-full h-3.5 min-w-[14px] px-1 flex items-center justify-center leading-none">
                1
              </span>
            </div>
            <span className={`text-[9px] leading-none mt-0.5 font-medium truncate max-w-full ${activeTab === 'patients' || activeTab === 'review' ? 'font-bold text-blue-600' : 'text-slate-500'}`}>
              My Cases
            </span>
          </button>

          {/* 3. CENTER FAB: Log Case */}
          <div className="flex-1 flex justify-center items-center h-full">
            <button
              type="button"
              onPointerEnter={() => onPrefetchTab?.('form')}
              onClick={() => onChangeTab('form')}
              className="w-11 h-11 -mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-md shadow-blue-500/40 border-3 border-slate-50 transition-transform active:scale-95 cursor-pointer z-20 shrink-0"
              title="Log Case"
              aria-label="Log Case"
            >
              <Plus className="w-5 h-5 stroke-[2.5px] text-white" />
            </button>
          </div>

          {/* 4. Remarks */}
          <button
            type="button"
            onPointerEnter={() => onPrefetchTab?.('reports')}
            onClick={() => onChangeTab('reports')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
              activeTab === 'reports' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquareText className={`w-4 h-4 ${activeTab === 'reports' ? 'stroke-[2.2px] text-blue-600' : 'stroke-[1.8px]'}`} />
            <span className={`text-[9px] leading-none mt-0.5 font-medium truncate max-w-full ${activeTab === 'reports' ? 'font-bold text-blue-600' : 'text-slate-500'}`}>
              Remarks
            </span>
          </button>

          {/* 5. Settings */}
          <button
            type="button"
            onPointerEnter={() => onPrefetchTab?.('settings')}
            onClick={() => onChangeTab('settings')}
            className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
              activeTab === 'settings' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <SettingsIcon className={`w-4 h-4 ${activeTab === 'settings' ? 'stroke-[2.2px] text-blue-600' : 'stroke-[1.8px]'}`} />
            <span className={`text-[9px] leading-none mt-0.5 font-medium truncate max-w-full ${activeTab === 'settings' ? 'font-bold text-blue-600' : 'text-slate-500'}`}>
              Settings
            </span>
          </button>
        </div>
      </nav>
    );
  }

  // FACULTY & HOD DEFAULT BOTTOM NAV
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 h-[50px] flex items-center justify-between px-3 relative shadow-xs">
      <div className="w-full max-w-md mx-auto flex items-center justify-between h-full">
        <button
          type="button"
          onClick={() => onChangeTab('home')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            activeTab === 'home' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate max-w-full">Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('patients')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            activeTab === 'patients' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <FolderKanban className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate max-w-full">Cases</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('students')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            activeTab === 'students' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <GraduationCap className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate max-w-full">Students</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('analytics')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            activeTab === 'analytics' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate max-w-full">Analytics</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('settings')}
          className={`flex-1 min-w-0 flex flex-col items-center justify-center h-full cursor-pointer transition-colors ${
            activeTab === 'settings' ? 'text-blue-600 font-bold' : 'text-slate-500'
          }`}
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate max-w-full">Settings</span>
        </button>
      </div>
    </nav>
  );
});

