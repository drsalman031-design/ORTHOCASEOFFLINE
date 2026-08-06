import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
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
import { StudentProfile, PatientRecord, NotificationItem } from '../types';
import { getCurrentUserAccount, setCurrentUserAccount, PRESET_ACCOUNTS } from '../lib/authContext';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  subscribeNotifications,
} from '../lib/notificationService';

interface HeaderProps {
  profile: StudentProfile;
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

  const currentUser = getCurrentUserAccount();
  const isResident = currentUser.role === 'STUDENT';
  const isHOD = currentUser.role === 'HOD';

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

  // Derive initial from current user's name
  const cleanName = currentUser.name.replace(/^(Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
  const avatarInitial = cleanName.charAt(0).toUpperCase() || 'U';

  const roleBadgeLabel = currentUser.role === 'HOD' ? 'HOD' : currentUser.role === 'STAFF_GUIDE' ? 'FACULTY' : 'RESIDENT';
  const rolePortalLabel = isResident ? 'Resident Portal' : isHOD ? 'HOD Portal' : 'Faculty Portal';
  const deptName = currentUser.department === 'Orthodontics & Dentofacial Orthopedics' ? 'Dept. of Orthodontics' : (currentUser.department || 'Dept. of Orthodontics');

  return (
    <header className="z-40 bg-[#0F172A] text-white shadow-md border-b border-slate-800 shrink-0 sticky top-0 flex flex-col font-sans">
      {/* 36px TOP NAV BAR */}
      <div className="h-[36px] flex items-center w-full border-b border-slate-800/60">
        <div className="w-full max-w-md mx-auto px-3 flex items-center justify-between gap-2 min-w-0">
          {/* BRAND LOGO & TITLE + ROLE BADGE */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-6 h-6 rounded-md bg-blue-600/30 backdrop-blur-md flex items-center justify-center text-white border border-blue-400/30 shrink-0 shadow-xs">
              <Stethoscope className="w-3 h-3 text-blue-300" />
            </div>
            <div className="min-w-0 flex items-center gap-1.5">
              <h1 className="font-bold text-[12px] tracking-tight text-white leading-none truncate">
                OrthoCase
              </h1>
              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0">
                {roleBadgeLabel}
              </span>
            </div>
          </div>

          {/* HEADER ACTIONS: SEARCH, NOTIFICATION BELL & USER AVATAR CIRCLE */}
          <div className="flex items-center gap-1 shrink-0 relative">
            <button
              type="button"
              onClick={onOpenSearch}
              className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              title="Search"
              aria-label="Search"
            >
              <Search className="w-3 h-3" />
            </button>

            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotificationsOpen((v) => !v);
                  setAccountMenuOpen(false);
                }}
                className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer relative"
                title="Notifications"
              >
                <Bell className="w-3 h-3" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-1 rounded-full bg-rose-500 text-white text-[8px] font-extrabold flex items-center justify-center leading-none shadow-xs border border-[#0F172A]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* NOTIFICATIONS DROPDOWN */}
              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-2xl z-50 p-3 space-y-2 animate-fadeIn font-sans">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#00317e]" /> Clinical Alerts
                      </span>
                      {unreadCount > 0 ? (
                        <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                          {unreadCount} Unread
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                          All Caught Up
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {recentNotifications.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          No notifications available.
                        </div>
                      ) : (
                        recentNotifications.map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`p-2.5 rounded-xl border transition-all text-xs cursor-pointer ${
                              !item.read
                                ? 'bg-blue-50/60 border-blue-200 font-medium'
                                : 'bg-slate-50 border-slate-100 opacity-90'
                            } hover:bg-blue-50/80`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <p className="text-slate-900 font-bold leading-snug truncate">
                                {item.title}
                              </p>
                              {!item.read && (
                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1" />
                              )}
                            </div>
                            <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5 leading-snug">
                              {item.message}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mt-1.5">
                              <span className="font-bold text-slate-700">{item.patientId}</span>
                              <span>
                                {new Date(item.updatedAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setNotificationsOpen(false);
                          if (onOpenNotificationCenter) onOpenNotificationCenter();
                        }}
                        className="w-full bg-[#00317e] hover:bg-blue-900 text-white font-bold text-xs py-1.5 rounded-xl transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Open Notification Center</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* USER ACCOUNT & LOGOUT MENU */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setAccountMenuOpen((v) => !v);
                  setNotificationsOpen(false);
                }}
                className="flex items-center gap-1 pl-1 pr-1.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 transition-all cursor-pointer text-white"
                title="Account Menu & Logout"
              >
                <div className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shadow-2xs">
                  {avatarInitial}
                </div>
                <ChevronDown className="w-2.5 h-2.5 text-slate-300" />
              </button>

              {accountMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAccountMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-white text-slate-800 border border-slate-200 shadow-2xl z-50 p-3 space-y-2.5 animate-fadeIn font-sans">
                    <div className="border-b border-slate-100 pb-2">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</p>
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-blue-50 text-[#00317e] border border-blue-200">
                          {roleBadgeLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{currentUser.designation}</p>
                      <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email}</p>
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


