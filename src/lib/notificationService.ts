import {
  NotificationItem,
  NotificationPriority,
  NotificationType,
  UserAccount,
  PatientRecord,
} from '../types';


const NOTIFICATIONS_STORAGE_KEY = 'orthocase_notifications_v2';
const REMINDERS_LOG_KEY = 'orthocase_reminders_log';

type Listener = () => void;
const listeners: Set<Listener> = new Set();

export function subscribeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(): void {
  listeners.forEach((l) => {
    try {
      l();
    } catch (e) {
      console.error('Error in notification listener:', e);
    }
  });
}

function getInitialSeedNotifications(): NotificationItem[] {
  const now = new Date();
  const minsAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString();
  const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

  return [
    // Seed for Dr. Rahul Sharma (Student 1)
    {
      id: 'notif-seed-1',
      patientId: 'OC-2024-8831',
      patientName: 'Chen, Wei-Long',
      patientRecordId: 'patient-demo-1',
      title: 'Revision Requested on Cephalometric Analysis',
      message: 'Dr. Sunita Patil requested revision on ANB angle calculation and VTO analysis.',
      type: 'STAFF_REVISION',
      priority: 'HIGH',
      targetUserId: 'usr-student-1',
      targetRole: 'STUDENT',
      senderUserId: 'usr-staff-1',
      senderName: 'Dr. Sunita Patil',
      senderRole: 'STAFF_GUIDE',
      sectionId: 'radiographyGrowth',
      read: false,
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
      threadKey: 'usr-student-1_patient-demo-1_STAFF_REVISION',
      auditLog: {
        createdAt: hoursAgo(2),
        deliveredAt: hoursAgo(2),
      },
    },
    {
      id: 'notif-seed-2',
      patientId: 'OC-2024-9042',
      patientName: 'Priya Sharma',
      patientRecordId: 'patient-demo-2',
      title: 'Case Submitted Successfully',
      message: 'Case #OC-2024-9042 submitted to Dr. Sunita Patil for initial faculty review.',
      type: 'CASE_SUBMITTED',
      priority: 'LOW',
      targetUserId: 'usr-student-1',
      targetRole: 'STUDENT',
      senderUserId: 'usr-student-1',
      senderName: 'Dr. Rahul Sharma',
      senderRole: 'STUDENT',
      sectionId: 'history',
      read: true,
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5),
      threadKey: 'usr-student-1_patient-demo-2_CASE_SUBMITTED',
      auditLog: {
        createdAt: hoursAgo(5),
        deliveredAt: hoursAgo(5),
        readAt: hoursAgo(4),
      },
    },

    // Seed for Dr. Sunita Patil (Staff 1)
    {
      id: 'notif-seed-3',
      patientId: 'OC-2024-9042',
      patientName: 'Priya Sharma',
      patientRecordId: 'patient-demo-2',
      title: 'New Case Awaiting Staff Review',
      message: 'Dr. Rahul Sharma submitted Case #OC-2024-9042 (Priya Sharma) for your review.',
      type: 'CASE_SUBMITTED',
      priority: 'HIGH',
      targetUserId: 'usr-staff-1',
      targetRole: 'STAFF_GUIDE',
      senderUserId: 'usr-student-1',
      senderName: 'Dr. Rahul Sharma',
      senderRole: 'STUDENT',
      sectionId: 'history',
      read: false,
      createdAt: minsAgo(30),
      updatedAt: minsAgo(30),
      threadKey: 'usr-staff-1_patient-demo-2_CASE_SUBMITTED',
      auditLog: {
        createdAt: minsAgo(30),
        deliveredAt: minsAgo(30),
      },
    },
    {
      id: 'notif-seed-4',
      patientId: 'OC-2024-8831',
      patientName: 'Chen, Wei-Long',
      patientRecordId: 'patient-demo-1',
      title: 'Resubmitted After Revision',
      message: 'Dr. Rahul Sharma updated and resubmitted Case #OC-2024-8831.',
      type: 'CASE_SUBMITTED',
      priority: 'HIGH',
      targetUserId: 'usr-staff-1',
      targetRole: 'STAFF_GUIDE',
      senderUserId: 'usr-student-1',
      senderName: 'Dr. Rahul Sharma',
      senderRole: 'STUDENT',
      sectionId: 'radiographyGrowth',
      read: true,
      createdAt: hoursAgo(3),
      updatedAt: hoursAgo(3),
      threadKey: 'usr-staff-1_patient-demo-1_CASE_SUBMITTED',
      auditLog: {
        createdAt: hoursAgo(3),
        deliveredAt: hoursAgo(3),
        readAt: hoursAgo(2),
      },
    },

    // Seed for HOD Prof. Richardson
    {
      id: 'notif-seed-5',
      patientId: 'OC-2024-9110',
      patientName: 'Kavita Patel',
      patientRecordId: 'patient-demo-3',
      title: 'Case Forwarded for HOD Review',
      message: 'Dr. Sunita Patil approved and forwarded Case #OC-2024-9110 for HOD Final Approval.',
      type: 'FORWARDED_TO_HOD',
      priority: 'HIGH',
      targetUserId: 'usr-hod-1',
      targetRole: 'HOD',
      senderUserId: 'usr-staff-1',
      senderName: 'Dr. Sunita Patil',
      senderRole: 'STAFF_GUIDE',
      sectionId: 'treatmentPlan',
      read: false,
      createdAt: minsAgo(15),
      updatedAt: minsAgo(15),
      threadKey: 'usr-hod-1_patient-demo-3_FORWARDED_TO_HOD',
      auditLog: {
        createdAt: minsAgo(15),
        deliveredAt: minsAgo(15),
      },
    },
    {
      id: 'notif-seed-6',
      patientId: 'OC-2024-9042',
      patientName: 'Priya Sharma',
      patientRecordId: 'patient-demo-2',
      title: 'Department Workflow Update: Case Submitted',
      message: 'Resident Dr. Rahul Sharma submitted Case #OC-2024-9042 to Dr. Sunita Patil.',
      type: 'CASE_SUBMITTED',
      priority: 'MEDIUM',
      targetUserId: 'usr-hod-1',
      targetRole: 'HOD',
      senderUserId: 'usr-student-1',
      senderName: 'Dr. Rahul Sharma',
      senderRole: 'STUDENT',
      read: true,
      createdAt: hoursAgo(1),
      updatedAt: hoursAgo(1),
      threadKey: 'usr-hod-1_patient-demo-2_CASE_SUBMITTED',
      auditLog: {
        createdAt: hoursAgo(1),
        deliveredAt: hoursAgo(1),
        readAt: minsAgo(45),
      },
    },
  ];
}

function getAllNotificationsRaw(): NotificationItem[] {
  try {
    const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error parsing notifications from localStorage:', e);
  }
  const seeds = getInitialSeedNotifications();
  saveNotificationsRaw(seeds);
  return seeds;
}

function saveNotificationsRaw(items: NotificationItem[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving notifications to localStorage:', e);
  }
}

/**
 * Get role-filtered notifications for a given user account.
 * Enforces strict security:
 * - Resident ONLY sees their own case notifications.
 * - Staff ONLY sees notifications for allocated residents.
 * - HOD sees department-wide notifications.
 */
export function getNotificationsForUser(
  user: UserAccount,
  allPatients: PatientRecord[] = []
): NotificationItem[] {
  const allNotifs = getAllNotificationsRaw();

  return allNotifs.filter((n) => {
    // 1. Deleted items excluded
    if (n.auditLog?.deletedAt) return false;

    // 2. RESIDENT Role (STUDENT)
    if (user.role === 'STUDENT') {
      if (n.targetUserId !== user.id) return false;
      // Double check patient ownership if available
      if (n.patientRecordId && allPatients.length > 0) {
        const patient = allPatients.find((p) => p.id === n.patientRecordId);
        if (patient && patient.studentOwnerId && patient.studentOwnerId !== user.id) {
          return false; // Security boundary: prohibit seeing other residents' cases
        }
      }
      return true;
    }

    // 3. STAFF Role (STAFF_GUIDE)
    if (user.role === 'STAFF_GUIDE') {
      if (n.targetUserId === user.id) {
        if (n.patientRecordId && allPatients.length > 0) {
          const patient = allPatients.find((p) => p.id === n.patientRecordId);
          if (patient) {
            const isAssignedStaff = patient.assignedStaffId === user.id;
            const isAssignedStudent =
              user.assignedStudentIds?.includes(patient.studentOwnerId || '') || false;
            if (!isAssignedStaff && !isAssignedStudent && patient.studentOwnerId) {
              return false; // Prohibit unallocated residents
            }
          }
        }
        return true;
      }
      return false;
    }

    // 4. HOD Role
    if (user.role === 'HOD') {
      return (
        n.targetRole === 'HOD' ||
        n.targetUserId === user.id ||
        n.targetUserId === 'HOD_ALL' ||
        n.targetUserId === 'DEPT_ALL'
      );
    }

    return false;
  });
}

/** Smart notification inserter / deduplicator */
export function addSmartNotification(
  input: Omit<NotificationItem, 'id' | 'createdAt' | 'updatedAt' | 'auditLog' | 'read'> & {
    read?: boolean;
  }
): void {
  const allNotifs = getAllNotificationsRaw();
  const now = new Date().toISOString();

  const threadKey =
    input.threadKey || `${input.targetUserId}_${input.patientRecordId}_${input.type}`;

  // Find existing unread or recent (<15m) notification with same threadKey
  const existingIdx = allNotifs.findIndex(
    (n) => n.threadKey === threadKey && (!n.read || (new Date(now).getTime() - new Date(n.updatedAt).getTime()) < 15 * 60 * 1000)
  );

  if (existingIdx >= 0) {
    // Merge / Update existing thread
    const existing = allNotifs[existingIdx];
    allNotifs[existingIdx] = {
      ...existing,
      title: input.title,
      message: input.message,
      priority: input.priority,
      read: false, // mark unread on new activity
      updatedAt: now,
      sectionId: input.sectionId || existing.sectionId,
      commentId: input.commentId || existing.commentId,
      auditLog: {
        ...existing.auditLog,
        deliveredAt: now,
        readAt: undefined, // reset read timestamp
      },
    };
  } else {
    // Create new notification item
    const newItem: NotificationItem = {
      ...input,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      read: input.read ?? false,
      createdAt: now,
      updatedAt: now,
      threadKey,
      auditLog: {
        createdAt: now,
        deliveredAt: now,
      },
    };
    allNotifs.unshift(newItem);
  }

  saveNotificationsRaw(allNotifs);
  notifyListeners();
}

/** Mark a single notification as read */
export function markNotificationAsRead(notificationId: string): void {
  const allNotifs = getAllNotificationsRaw();
  const now = new Date().toISOString();

  let updated = false;
  const next = allNotifs.map((n) => {
    if (n.id === notificationId && !n.read) {
      updated = true;
      return {
        ...n,
        read: true,
        auditLog: {
          ...n.auditLog,
          readAt: now,
        },
      };
    }
    return n;
  });

  if (updated) {
    saveNotificationsRaw(next);
    notifyListeners();
  }
}

/** Mark all user notifications as read */
export function markAllNotificationsAsRead(
  user: UserAccount,
  allPatients: PatientRecord[] = []
): void {
  const userNotifIds = new Set(
    getNotificationsForUser(user, allPatients)
      .filter((n) => !n.read)
      .map((n) => n.id)
  );

  if (userNotifIds.size === 0) return;

  const now = new Date().toISOString();
  const allNotifs = getAllNotificationsRaw();

  const next = allNotifs.map((n) => {
    if (userNotifIds.has(n.id)) {
      return {
        ...n,
        read: true,
        auditLog: {
          ...n.auditLog,
          readAt: now,
        },
      };
    }
    return n;
  });

  saveNotificationsRaw(next);
  notifyListeners();
}

/** Delete a single notification */
export function deleteNotification(notificationId: string): void {
  const allNotifs = getAllNotificationsRaw();
  const now = new Date().toISOString();

  const next = allNotifs.map((n) => {
    if (n.id === notificationId) {
      return {
        ...n,
        auditLog: {
          ...n.auditLog,
          deletedAt: now,
        },
      };
    }
    return n;
  });

  saveNotificationsRaw(next);
  notifyListeners();
}

/** Clear all read notifications for user */
export function clearReadNotifications(
  user: UserAccount,
  allPatients: PatientRecord[] = []
): void {
  const readUserNotifIds = new Set(
    getNotificationsForUser(user, allPatients)
      .filter((n) => n.read)
      .map((n) => n.id)
  );

  if (readUserNotifIds.size === 0) return;

  const now = new Date().toISOString();
  const allNotifs = getAllNotificationsRaw();

  const next = allNotifs.map((n) => {
    if (readUserNotifIds.has(n.id)) {
      return {
        ...n,
        auditLog: {
          ...n.auditLog,
          deletedAt: now,
        },
      };
    }
    return n;
  });

  saveNotificationsRaw(next);
  notifyListeners();
}

// ==========================================
// WORKFLOW EVENT NOTIFICATION GENERATORS
// ==========================================

/** 1. Case Submitted */
export function notifyCaseSubmitted(patient: PatientRecord, studentUser: UserAccount): void {
  const staffId = patient.assignedStaffId || studentUser.assignedStaffId || 'usr-staff-1';
  const staffName = patient.assignedStaffName || studentUser.assignedStaffName || 'Assigned Faculty Guide';

  // Resident notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Case Submitted Successfully',
    message: `Case #${patient.patientId} submitted to ${staffName} for review.`,
    type: 'CASE_SUBMITTED',
    priority: 'LOW',
    targetUserId: studentUser.id,
    targetRole: 'STUDENT',
    senderUserId: studentUser.id,
    senderName: studentUser.name,
    senderRole: 'STUDENT',
  });

  // Staff notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'New Case Awaiting Review',
    message: `${studentUser.name} submitted Case #${patient.patientId} (${patient.name}) for your review.`,
    type: 'CASE_SUBMITTED',
    priority: 'HIGH',
    targetUserId: staffId,
    targetRole: 'STAFF_GUIDE',
    senderUserId: studentUser.id,
    senderName: studentUser.name,
    senderRole: 'STUDENT',
  });

  // HOD notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Department Case Submitted',
    message: `Resident ${studentUser.name} submitted Case #${patient.patientId} (${patient.name}) to ${staffName}.`,
    type: 'CASE_SUBMITTED',
    priority: 'MEDIUM',
    targetUserId: 'usr-hod-1',
    targetRole: 'HOD',
    senderUserId: studentUser.id,
    senderName: studentUser.name,
    senderRole: 'STUDENT',
  });
}

/** 2. Staff Approved */
export function notifyStaffApproved(patient: PatientRecord, staffUser: UserAccount): void {
  const studentOwnerId = patient.studentOwnerId || 'usr-student-1';

  // Resident notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Staff Approved Case',
    message: `${staffUser.name} approved Case #${patient.patientId}. Forwarded to HOD for Final Approval.`,
    type: 'STAFF_APPROVED',
    priority: 'MEDIUM',
    targetUserId: studentOwnerId,
    targetRole: 'STUDENT',
    senderUserId: staffUser.id,
    senderName: staffUser.name,
    senderRole: 'STAFF_GUIDE',
  });

  // HOD notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Case Forwarded for HOD Review',
    message: `${staffUser.name} approved and forwarded Case #${patient.patientId} (${patient.name}) for HOD Review.`,
    type: 'FORWARDED_TO_HOD',
    priority: 'HIGH',
    targetUserId: 'usr-hod-1',
    targetRole: 'HOD',
    senderUserId: staffUser.id,
    senderName: staffUser.name,
    senderRole: 'STAFF_GUIDE',
  });
}

/** 3. Staff Requested Revision */
export function notifyStaffRevision(
  patient: PatientRecord,
  staffUser: UserAccount,
  remarks?: string
): void {
  const studentOwnerId = patient.studentOwnerId || 'usr-student-1';

  // Resident notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Revision Requested by Staff',
    message: `${staffUser.name} requested revisions on Case #${patient.patientId}${remarks ? `: "${remarks}"` : '.'}`,
    type: 'STAFF_REVISION',
    priority: 'HIGH',
    targetUserId: studentOwnerId,
    targetRole: 'STUDENT',
    senderUserId: staffUser.id,
    senderName: staffUser.name,
    senderRole: 'STAFF_GUIDE',
  });

  // HOD notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Staff Requested Revision',
    message: `${staffUser.name} requested revisions on Case #${patient.patientId} (${patient.name}).`,
    type: 'STAFF_REVISION',
    priority: 'LOW',
    targetUserId: 'usr-hod-1',
    targetRole: 'HOD',
    senderUserId: staffUser.id,
    senderName: staffUser.name,
    senderRole: 'STAFF_GUIDE',
  });
}

/** 4. Staff Rejected */
export function notifyStaffRejected(
  patient: PatientRecord,
  staffUser: UserAccount,
  remarks?: string
): void {
  const studentOwnerId = patient.studentOwnerId || 'usr-student-1';

  // Resident notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Case Rejected by Staff',
    message: `${staffUser.name} rejected Case #${patient.patientId}${remarks ? `: "${remarks}"` : '.'}`,
    type: 'STAFF_REJECTED',
    priority: 'HIGH',
    targetUserId: studentOwnerId,
    targetRole: 'STUDENT',
    senderUserId: staffUser.id,
    senderName: staffUser.name,
    senderRole: 'STAFF_GUIDE',
  });

  // HOD notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Case Rejected by Staff',
    message: `${staffUser.name} rejected Case #${patient.patientId} (${patient.name}).`,
    type: 'STAFF_REJECTED',
    priority: 'MEDIUM',
    targetUserId: 'usr-hod-1',
    targetRole: 'HOD',
    senderUserId: staffUser.id,
    senderName: staffUser.name,
    senderRole: 'STAFF_GUIDE',
  });
}

/** 5. HOD Approved (Final Approval) */
export function notifyHodApproved(patient: PatientRecord, hodUser: UserAccount): void {
  const studentOwnerId = patient.studentOwnerId || 'usr-student-1';
  const staffId = patient.assignedStaffId || 'usr-staff-1';

  // Resident notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'HOD Final Approval Granted! 🎉',
    message: `${hodUser.name} gave Final Approval for Case #${patient.patientId} (${patient.name}). Workflow completed!`,
    type: 'HOD_APPROVED',
    priority: 'HIGH',
    targetUserId: studentOwnerId,
    targetRole: 'STUDENT',
    senderUserId: hodUser.id,
    senderName: hodUser.name,
    senderRole: 'HOD',
  });

  // Staff notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Case Finally Approved by HOD',
    message: `${hodUser.name} gave Final Approval for Case #${patient.patientId} (${patient.name}).`,
    type: 'HOD_APPROVED',
    priority: 'MEDIUM',
    targetUserId: staffId,
    targetRole: 'STAFF_GUIDE',
    senderUserId: hodUser.id,
    senderName: hodUser.name,
    senderRole: 'HOD',
  });

  // HOD confirmation
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'You Granted Final Approval',
    message: `You granted Final Approval for Case #${patient.patientId} (${patient.name}).`,
    type: 'HOD_APPROVED',
    priority: 'LOW',
    targetUserId: hodUser.id,
    targetRole: 'HOD',
    senderUserId: hodUser.id,
    senderName: hodUser.name,
    senderRole: 'HOD',
  });
}

/** 6. HOD Requested Revision / Returned to Staff or Resident */
export function notifyHodRevision(
  patient: PatientRecord,
  hodUser: UserAccount,
  remarks?: string
): void {
  const studentOwnerId = patient.studentOwnerId || 'usr-student-1';
  const staffId = patient.assignedStaffId || 'usr-staff-1';

  // Resident notification
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'HOD Requested Revision',
    message: `${hodUser.name} requested revisions on Case #${patient.patientId}${remarks ? `: "${remarks}"` : '.'}`,
    type: 'HOD_REVISION',
    priority: 'HIGH',
    targetUserId: studentOwnerId,
    targetRole: 'STUDENT',
    senderUserId: hodUser.id,
    senderName: hodUser.name,
    senderRole: 'HOD',
  });

  // Staff notification (HOD returned case for further staff review)
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'HOD Returned Case for Review',
    message: `${hodUser.name} returned Case #${patient.patientId} (${patient.name}) for further Staff review${remarks ? `: "${remarks}"` : '.'}`,
    type: 'HOD_REVISION',
    priority: 'HIGH',
    targetUserId: staffId,
    targetRole: 'STAFF_GUIDE',
    senderUserId: hodUser.id,
    senderName: hodUser.name,
    senderRole: 'HOD',
  });
}

/** 7. HOD Rejected */
export function notifyHodRejected(
  patient: PatientRecord,
  hodUser: UserAccount,
  remarks?: string
): void {
  const studentOwnerId = patient.studentOwnerId || 'usr-student-1';
  const staffId = patient.assignedStaffId || 'usr-staff-1';

  // Resident
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Case Rejected by HOD',
    message: `${hodUser.name} rejected Case #${patient.patientId}${remarks ? `: "${remarks}"` : '.'}`,
    type: 'HOD_REJECTED',
    priority: 'HIGH',
    targetUserId: studentOwnerId,
    targetRole: 'STUDENT',
    senderUserId: hodUser.id,
    senderName: hodUser.name,
    senderRole: 'HOD',
  });

  // Staff
  addSmartNotification({
    patientId: patient.patientId,
    patientName: patient.name,
    patientRecordId: patient.id,
    title: 'Case Rejected by HOD',
    message: `${hodUser.name} rejected Case #${patient.patientId} (${patient.name}).`,
    type: 'HOD_REJECTED',
    priority: 'HIGH',
    targetUserId: staffId,
    targetRole: 'STAFF_GUIDE',
    senderUserId: hodUser.id,
    senderName: hodUser.name,
    senderRole: 'HOD',
  });
}

/** 8. Comment or Feedback Added */
export function notifyCommentAdded(
  patient: PatientRecord,
  authorUser: UserAccount,
  commentText: string,
  sectionId?: string
): void {
  const studentOwnerId = patient.studentOwnerId || 'usr-student-1';
  const staffId = patient.assignedStaffId || 'usr-staff-1';

  const preview = commentText.length > 80 ? commentText.substring(0, 80) + '...' : commentText;

  // If author is Resident -> notify assigned Staff
  if (authorUser.role === 'STUDENT') {
    addSmartNotification({
      patientId: patient.patientId,
      patientName: patient.name,
      patientRecordId: patient.id,
      title: 'New Comment from Resident',
      message: `${authorUser.name} replied on Case #${patient.patientId}: "${preview}"`,
      type: 'COMMENT_ADDED',
      priority: 'LOW',
      targetUserId: staffId,
      targetRole: 'STAFF_GUIDE',
      senderUserId: authorUser.id,
      senderName: authorUser.name,
      senderRole: 'STUDENT',
      sectionId,
    });
  }

  // If author is Staff -> notify Resident
  if (authorUser.role === 'STAFF_GUIDE') {
    addSmartNotification({
      patientId: patient.patientId,
      patientName: patient.name,
      patientRecordId: patient.id,
      title: 'New Comment from Faculty Guide',
      message: `${authorUser.name} commented on Case #${patient.patientId}: "${preview}"`,
      type: 'COMMENT_ADDED',
      priority: 'LOW',
      targetUserId: studentOwnerId,
      targetRole: 'STUDENT',
      senderUserId: authorUser.id,
      senderName: authorUser.name,
      senderRole: 'STAFF_GUIDE',
      sectionId,
    });
  }

  // If author is HOD -> notify Resident & Staff
  if (authorUser.role === 'HOD') {
    addSmartNotification({
      patientId: patient.patientId,
      patientName: patient.name,
      patientRecordId: patient.id,
      title: 'New Comment from HOD',
      message: `${authorUser.name} commented on Case #${patient.patientId}: "${preview}"`,
      type: 'COMMENT_ADDED',
      priority: 'LOW',
      targetUserId: studentOwnerId,
      targetRole: 'STUDENT',
      senderUserId: authorUser.id,
      senderName: authorUser.name,
      senderRole: 'HOD',
      sectionId,
    });

    addSmartNotification({
      patientId: patient.patientId,
      patientName: patient.name,
      patientRecordId: patient.id,
      title: 'New Comment from HOD',
      message: `${authorUser.name} commented on Case #${patient.patientId}: "${preview}"`,
      type: 'COMMENT_ADDED',
      priority: 'LOW',
      targetUserId: staffId,
      targetRole: 'STAFF_GUIDE',
      senderUserId: authorUser.id,
      senderName: authorUser.name,
      senderRole: 'HOD',
      sectionId,
    });
  }
}

/** 9. Case Reopened */
export function notifyCaseReopened(patient: PatientRecord, user: UserAccount): void {
  const studentOwnerId = patient.studentOwnerId || 'usr-student-1';
  const staffId = patient.assignedStaffId || 'usr-staff-1';

  if (user.id !== studentOwnerId) {
    addSmartNotification({
      patientId: patient.patientId,
      patientName: patient.name,
      patientRecordId: patient.id,
      title: 'Case Reopened',
      message: `${user.name} reopened Case #${patient.patientId} (${patient.name}) for further editing.`,
      type: 'CASE_REOPENED',
      priority: 'MEDIUM',
      targetUserId: studentOwnerId,
      targetRole: 'STUDENT',
      senderUserId: user.id,
      senderName: user.name,
      senderRole: user.role,
    });
  }

  if (user.id !== staffId) {
    addSmartNotification({
      patientId: patient.patientId,
      patientName: patient.name,
      patientRecordId: patient.id,
      title: 'Case Reopened',
      message: `${user.name} reopened Case #${patient.patientId} (${patient.name}).`,
      type: 'CASE_REOPENED',
      priority: 'LOW',
      targetUserId: staffId,
      targetRole: 'STAFF_GUIDE',
      senderUserId: user.id,
      senderName: user.name,
      senderRole: user.role,
    });
  }
}

/** 10. Check and generate overdue reminders (Max 1 per day per case) */
export function checkAndGenerateOverdueReminders(patients: PatientRecord[]): void {
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];

  let reminderLogs: Record<string, string> = {};
  try {
    const raw = localStorage.getItem(REMINDERS_LOG_KEY);
    if (raw) reminderLogs = JSON.parse(raw);
  } catch (e) {
    // fallback
  }

  patients.forEach((p) => {
    if (p.archived) return;

    const status = p.approvalStatus || 'DRAFT';
    const isStaffPending = status === 'PENDING_STAFF' || status === 'Pending Staff Approval';
    const isHodPending = status === 'PENDING_HOD' || status === 'Pending HOD Approval';
    const isRevision = status === 'REVISION_REQUESTED' || status === 'Returned for Corrections';

    const lastUpdated = new Date(p.updatedAt).getTime();
    const daysSinceUpdate = (now.getTime() - lastUpdated) / (1000 * 3600 * 24);

    // Staff Review Overdue (>3 days)
    if (isStaffPending && daysSinceUpdate >= 3) {
      const key = `staff_overdue_${p.id}_${todayDateStr}`;
      if (!reminderLogs[key]) {
        reminderLogs[key] = now.toISOString();
        const staffId = p.assignedStaffId || 'usr-staff-1';
        addSmartNotification({
          patientId: p.patientId,
          patientName: p.name,
          patientRecordId: p.id,
          title: 'Overdue Staff Review Reminder',
          message: `Case #${p.patientId} (${p.name}) has been awaiting Staff review for over ${Math.floor(daysSinceUpdate)} days.`,
          type: 'OVERDUE_REVIEW',
          priority: 'HIGH',
          targetUserId: staffId,
          targetRole: 'STAFF_GUIDE',
          threadKey: `overdue_staff_${p.id}`,
        });

        // Also inform HOD
        addSmartNotification({
          patientId: p.patientId,
          patientName: p.name,
          patientRecordId: p.id,
          title: 'Overdue Staff Review Alert',
          message: `Case #${p.patientId} (${p.name}) pending Staff review for ${Math.floor(daysSinceUpdate)} days.`,
          type: 'OVERDUE_REVIEW',
          priority: 'HIGH',
          targetUserId: 'usr-hod-1',
          targetRole: 'HOD',
          threadKey: `overdue_hod_staff_${p.id}`,
        });
      }
    }

    // HOD Review Overdue (>2 days)
    if (isHodPending && daysSinceUpdate >= 2) {
      const key = `hod_overdue_${p.id}_${todayDateStr}`;
      if (!reminderLogs[key]) {
        reminderLogs[key] = now.toISOString();
        addSmartNotification({
          patientId: p.patientId,
          patientName: p.name,
          patientRecordId: p.id,
          title: 'Overdue HOD Review Reminder',
          message: `Case #${p.patientId} (${p.name}) has been awaiting HOD Final Approval for over ${Math.floor(daysSinceUpdate)} days.`,
          type: 'OVERDUE_REVIEW',
          priority: 'HIGH',
          targetUserId: 'usr-hod-1',
          targetRole: 'HOD',
          threadKey: `overdue_hod_${p.id}`,
        });
      }
    }

    // Resident Resubmission Reminder (>5 days)
    if (isRevision && daysSinceUpdate >= 5) {
      const key = `resubmit_overdue_${p.id}_${todayDateStr}`;
      if (!reminderLogs[key]) {
        reminderLogs[key] = now.toISOString();
        const studentId = p.studentOwnerId || 'usr-student-1';
        addSmartNotification({
          patientId: p.patientId,
          patientName: p.name,
          patientRecordId: p.id,
          title: 'Revision Resubmission Reminder',
          message: `Please resubmit Case #${p.patientId} (${p.name}) after addressing requested revisions.`,
          type: 'REMINDER_RESUBMIT',
          priority: 'HIGH',
          targetUserId: studentId,
          targetRole: 'STUDENT',
          threadKey: `overdue_resubmit_${p.id}`,
        });
      }
    }
  });

  try {
    localStorage.setItem(REMINDERS_LOG_KEY, JSON.stringify(reminderLogs));
  } catch (e) {
    // ignore
  }
}
