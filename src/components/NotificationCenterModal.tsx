import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  X,
  Search,
  CheckCheck,
  Trash2,
  Filter,
  ArrowUpDown,
  AlertCircle,
  Clock,
  CheckCircle2,
  MessageSquare,
  FileText,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';
import {
  NotificationItem,
  UserAccount,
  PatientRecord,
} from '../types';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearReadNotifications,
  subscribeNotifications,
} from '../lib/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  patients: PatientRecord[];
  onNavigateToCase: (patientRecordId: string, sectionId?: string) => void;
}

type FilterTab =
  | 'all'
  | 'unread'
  | 'pending'
  | 'approved'
  | 'revision'
  | 'rejected'
  | 'comments';

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  patients,
  onNavigateToCase,
}) => {
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [pageLimit, setPageLimit] = useState(15);
  const [, setTick] = useState(0);

  // Subscribe to real-time notification changes
  useEffect(() => {
    const unsubscribe = subscribeNotifications(() => {
      setTick((t) => t + 1);
    });
    return unsubscribe;
  }, []);

  const userNotifications = useMemo(() => {
    return getNotificationsForUser(currentUser, patients);
  }, [currentUser, patients, isOpen]);

  const filteredNotifications = useMemo(() => {
    let result = [...userNotifications];

    // Filter tab
    if (activeTab === 'unread') {
      result = result.filter((n) => !n.read);
    } else if (activeTab === 'pending') {
      result = result.filter((n) =>
        ['CASE_SUBMITTED', 'FORWARDED_TO_HOD', 'OVERDUE_REVIEW'].includes(n.type)
      );
    } else if (activeTab === 'approved') {
      result = result.filter((n) => ['STAFF_APPROVED', 'HOD_APPROVED'].includes(n.type));
    } else if (activeTab === 'revision') {
      result = result.filter((n) =>
        ['STAFF_REVISION', 'HOD_REVISION', 'REMINDER_RESUBMIT'].includes(n.type)
      );
    } else if (activeTab === 'rejected') {
      result = result.filter((n) => ['STAFF_REJECTED', 'HOD_REJECTED'].includes(n.type));
    } else if (activeTab === 'comments') {
      result = result.filter((n) => n.type === 'COMMENT_ADDED');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          n.patientName.toLowerCase().includes(q) ||
          n.patientId.toLowerCase().includes(q) ||
          (n.senderName && n.senderName.toLowerCase().includes(q))
      );
    }

    // Sort order
    result.sort((a, b) => {
      const timeA = new Date(a.updatedAt).getTime();
      const timeB = new Date(b.updatedAt).getTime();
      return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [userNotifications, activeTab, searchQuery, sortOrder]);

  const displayedNotifications = useMemo(() => {
    return filteredNotifications.slice(0, pageLimit);
  }, [filteredNotifications, pageLimit]);

  const unreadCount = useMemo(() => {
    return userNotifications.filter((n) => !n.read).length;
  }, [userNotifications]);

  if (!isOpen) return null;

  const handleNotificationClick = (item: NotificationItem) => {
    markNotificationAsRead(item.id);
    onClose();
    if (item.patientRecordId) {
      onNavigateToCase(item.patientRecordId, item.sectionId);
    }
  };

  const formatTimeAgo = (isoString: string) => {
    const diffMs = new Date().getTime() - new Date(isoString).getTime();
    const mins = Math.floor(diffMs / (1000 * 60));
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(isoString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden font-sans">
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00317e]/10 text-[#00317e] flex items-center justify-center font-bold">
              <Bell className="w-5 h-5 text-[#00317e]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">
                  Notification Center
                </h2>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                    {unreadCount} UNREAD
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Workflow alerts, reviews & case updates for {currentUser.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-slate-200/70 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CONTROLS BAR: SEARCH & SORT & BATCH ACTIONS */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, ID, keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00317e]/20 focus:border-[#00317e]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            {/* Batch Action Buttons & Sort Toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => setSortOrder((s) => (s === 'newest' ? 'oldest' : 'newest'))}
                className="bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                title="Toggle sort order"
              >
                <ArrowUpDown className="w-3 h-3 text-slate-500" />
                <span>{sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
              </button>

              <button
                type="button"
                onClick={() => markAllNotificationsAsRead(currentUser, patients)}
                disabled={unreadCount === 0}
                className="bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50 text-slate-700 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Mark All Read</span>
              </button>

              <button
                type="button"
                onClick={() => clearReadNotifications(currentUser, patients)}
                className="bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                title="Clear read notifications"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Clear Read</span>
              </button>
            </div>
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar text-xs">
            {[
              { id: 'all', label: 'All', count: userNotifications.length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              {
                id: 'pending',
                label: 'Pending',
                count: userNotifications.filter((n) =>
                  ['CASE_SUBMITTED', 'FORWARDED_TO_HOD', 'OVERDUE_REVIEW'].includes(n.type)
                ).length,
              },
              {
                id: 'approved',
                label: 'Approved',
                count: userNotifications.filter((n) =>
                  ['STAFF_APPROVED', 'HOD_APPROVED'].includes(n.type)
                ).length,
              },
              {
                id: 'revision',
                label: 'Revision',
                count: userNotifications.filter((n) =>
                  ['STAFF_REVISION', 'HOD_REVISION', 'REMINDER_RESUBMIT'].includes(n.type)
                ).length,
              },
              {
                id: 'rejected',
                label: 'Rejected',
                count: userNotifications.filter((n) =>
                  ['STAFF_REJECTED', 'HOD_REJECTED'].includes(n.type)
                ).length,
              },
              {
                id: 'comments',
                label: 'Comments',
                count: userNotifications.filter((n) => n.type === 'COMMENT_ADDED').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as FilterTab)}
                className={`px-3 py-1 rounded-lg font-bold text-xs shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-[#00317e] text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[300px]">
          {displayedNotifications.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">No notifications found</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {searchQuery
                    ? 'Try adjusting your search keywords.'
                    : 'All notifications cleared or no updates in this filter.'}
                </p>
              </div>
            </div>
          ) : (
            displayedNotifications.map((item) => {
              const isHighPriority = item.priority === 'HIGH';
              const isMedPriority = item.priority === 'MEDIUM';

              let IconComponent = Bell;
              let iconBg = 'bg-blue-50 text-blue-700 border-blue-200';

              if (item.type.includes('APPROVED')) {
                IconComponent = CheckCircle2;
                iconBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
              } else if (item.type.includes('REVISION') || item.type.includes('REMINDER')) {
                IconComponent = Clock;
                iconBg = 'bg-amber-50 text-amber-800 border-amber-200';
              } else if (item.type.includes('REJECTED') || item.type.includes('OVERDUE')) {
                IconComponent = AlertCircle;
                iconBg = 'bg-rose-50 text-rose-700 border-rose-200';
              } else if (item.type === 'COMMENT_ADDED') {
                IconComponent = MessageSquare;
                iconBg = 'bg-purple-50 text-purple-700 border-purple-200';
              }

              return (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group relative flex flex-col sm:flex-row items-start justify-between gap-3 ${
                    !item.read
                      ? 'bg-blue-50/40 border-blue-200/90 shadow-2xs hover:bg-blue-50/70'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Priority / Type Icon */}
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 ${iconBg}`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="min-w-0 space-y-1 flex-1">
                      {/* Top Meta Line: Title & Priority Badge & Unread Dot */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                        )}
                        <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-[#00317e] transition-colors">
                          {item.title}
                        </h4>
                        {isHighPriority && (
                          <span className="text-[9px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-300 px-1.5 py-0.2 rounded-md">
                            High Priority
                          </span>
                        )}
                        {isMedPriority && (
                          <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded-md">
                            Medium
                          </span>
                        )}
                      </div>

                      {/* Message Body */}
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {item.message}
                      </p>

                      {/* Patient & Sender details */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-500 pt-0.5">
                        <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200">
                          {item.patientId || item.patientName}
                        </span>
                        <span>•</span>
                        <span>{item.patientName}</span>
                        {item.senderName && (
                          <>
                            <span>•</span>
                            <span>From: {item.senderName}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Action Column */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap">
                      {formatTimeAgo(item.updatedAt)}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(item.id);
                        }}
                        className="p-1 rounded-md hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-all cursor-pointer"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(item);
                        }}
                        className="bg-[#00317e] text-white px-2.5 py-1 rounded-lg font-bold text-[11px] hover:bg-blue-900 transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <span>View Case</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Load More Pagination Button */}
          {filteredNotifications.length > pageLimit && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setPageLimit((prev) => prev + 15)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl border border-slate-200 transition-all cursor-pointer"
              >
                Load More Notifications ({filteredNotifications.length - pageLimit} remaining)
              </button>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span className="font-medium">
            Strict role-based isolation active • Real-time synchronized
          </span>
          <button
            type="button"
            onClick={onClose}
            className="bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold px-3.5 py-1.5 rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
