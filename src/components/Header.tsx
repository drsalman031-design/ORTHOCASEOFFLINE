import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  User,
  Bell,
  ChevronDown,
  UserCheck,
  LogOut,
  Sparkles,
  ShieldCheck,
  GraduationCap,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { ToothIcon } from './ToothIcon';
import { StudentProfile, PatientRecord, NotificationItem, UserAccount } from '../types';
import { getCurrentUserAccount, setCurrentUserAccount, PRESET_ACCOUNTS } from '../lib/authContext';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  subscribeNotifications,
} from '../lib/notificationService';

interface HeaderProps {
  profile: StudentProfile;
  currentUser?: UserAccount | null;
  compact?: boolean;
  activeTabTitle?: string;
  patients?: PatientRecord[];
  onOpenSearch?: () => void;
  onOpenSettings?: () => void;
  onLogout?: () => void;
  onRoleChanged?: () => void;
  onOpenNotificationCenter?: () => void;
  onNavigateToCase?: (patientRecordId: string, sectionId?: string) => void;
}

export const Header: React.FC<HeaderProps> = React.memo(({
  profile,
  currentUser: currentUserProp,
  compact = false,
  activeTabTitle,
  patients = [],
  onOpenSearch,
  onOpenSettings,
  onLogout,
  onRoleChanged,
  onOpenNotificationCenter,
  onNavigateToCase,
}) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [, setTick] = useState(0);

  const currentUser = currentUserProp || getCurrentUserAccount();
  const displayName = profile?.studentName || currentUser?.name || 'Doctor';
  const isResident = currentUser?.role === 'STUDENT';
  const isHOD = currentUser?.role === 'HOD';

  // Real-time notification subscription
  useEffect(() => {
    const unsubscribe = subscribeNotifications(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const handleSwitchAccount = (userId: string) => {
    setCurrentUserAccount(userId);
    setAccountMenuOpen(false);
    if (onRoleChanged) {
      onRoleChanged();
    } else {
      window.location.reload();
    }
  };

  const userNotifications = useMemo(() => {
    return getNotificationsForUser(currentUser, patients);
  }, [currentUser, patients]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.read).length;
  }, [userNotifications]);

  const recentNotifications = useMemo(() => {
    return [...userNotifications]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [userNotifications]);

  const handleItemClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    setNotificationsOpen(false);
    if (onNavigateToCase && item.patientRecordId) {
      onNavigateToCase(item.patientRecordId, item.sectionId);
    }
  };

  // Derive initial from current dynamic user's display name
  const cleanName = (displayName || '').replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  const avatarInitial = cleanName.charAt(0).toUpperCase() || 'U';

  const roleBadgeLabel = currentUser?.role || 'STUDENT';
  const rolePortalLabel = 'Student Portal';
  const deptName = currentUser?.department === 'Orthodontics & Dentofacial Orthopedics' ? 'Dept. of Orthodontics' : (currentUser?.department || 'Dept. of Orthodontics');

return (
    <header className="z-40 bg-[#071B49] text-white shadow-md border-b border-[#0A2668] shrink-0 sticky top-0 flex flex-wrap justify-between items-center font-sans">
      {/* TOP NAV BAR */}
      <div className="h-[46px] flex items-center w-full">
        <div className="w-full max-w-md mx-auto px-3.5 flex items-center justify-between gap-2 min-w-0">
          {/* BRAND LOGO & TITLE */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-xs border border-teal-500/40 bg-teal-900/30">
              <img
                src="/app-logo.jpg"
                alt="OrthoCase Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base tracking-tight text-white leading-none truncate">
                OrthoCase
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-400/30 shrink-0">
                Case Recording
              </span>
            </div>
          </div>

          {/* HEADER ACTIONS: SEARCH & USER AVATAR CIRCLE */}
          <div className="flex items-center gap-1.5 shrink-0 relative">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Search Patient"
              aria-label="Search Patient"
            >
              <Search className="w-3.5 h-3.5" />
            </button>

            {/* USER ACCOUNT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAccountMenuOpen((v) => !v)}
                className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer text-white active:scale-95"
                title="Account Menu"
              >
                <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white font-bold text-[11px] flex items-center justify-center shadow-xs">
                  {avatarInitial}
                </div>
                <ChevronDown className="w-3 h-3 text-slate-300" />
              </button>

              {accountMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-2xl z-50 p-3 space-y-2.5 animate-fadeIn font-sans">
                    <div className="border-b border-slate-100 pb-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 truncate">{displayName}</p>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-50 text-[#00317e] border border-blue-200">
                          {roleBadgeLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{profile?.academicYear || currentUser?.designation || 'PG Resident'}</p>
                      {currentUser?.email && (
                        <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      {onOpenSettings && (
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            onOpenSettings();
                          }}
                          className="w-full text-left p-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>Account Settings & Profile</span>
                        </button>
                      )}

                      {onLogout && (
                        <button
                          type="button"
                          onClick={() => {
                            setAccountMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full text-left p-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all flex items-center justify-between cursor-pointer border border-rose-200/60"
                        >
                          <div className="flex items-center gap-2">
                            <LogOut className="w-3.5 h-3.5 text-rose-600" />
                            <span>Sign Out / Log Out</span>
                          </div>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
});


