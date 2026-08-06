import React, { useState, useEffect, lazy, Suspense, startTransition } from 'react';
import { ActiveTab, PatientRecord, StudentProfile, UserRole, UserAccount, AppUserRole } from './types';
import {
  getAllPatients,
  savePatient,
  savePatientsBatch,
  deletePatient,
  toggleArchivePatient,
  getStudentProfile,
  saveStudentProfile,
  getDB,
} from './lib/db';
import { prefetchCaseForm, prefetchBonwillHawley, prefetchOnIdle, prefetchPatientList, prefetchReportViewer } from './lib/prefetch';
import { getCurrentUserAccount, getActiveUserAccount, clearAuthSession } from './lib/authContext';
import { LoginScreen } from './components/LoginScreen';

// Role Dashboard Route Helpers
function getRoleDashboardRoute(role: AppUserRole | UserRole | string): string {
  if (role === 'HOD') return '/hod/dashboard';
  if (role === 'STAFF_GUIDE') return '/staff/dashboard';
  return '/student/dashboard';
}

function getTabRoute(tab: ActiveTab, role: AppUserRole | UserRole | string): string {
  const rolePrefix = role === 'HOD' ? '/hod' : role === 'STAFF_GUIDE' ? '/staff' : '/student';
  switch (tab) {
    case 'home':
      return `${rolePrefix}/dashboard`;
    case 'patients':
      return `${rolePrefix}/cases`;
    case 'form':
      return '/cases/new';
    case 'reports':
      return '/reports';
    case 'students':
      return '/students';
    case 'analytics':
      return '/analytics';
    case 'settings':
      return '/settings';
    case 'bonwill':
      return '/bonwill';
    default:
      return `${rolePrefix}/dashboard`;
  }
}

function getTabFromPath(path: string): ActiveTab {
  if (path.includes('/cases/new') || path.includes('/cases/edit')) return 'form';
  if (path.includes('/cases')) return 'patients';
  if (path.includes('/reports')) return 'reports';
  if (path.includes('/students')) return 'students';
  if (path.includes('/analytics')) return 'analytics';
  if (path.includes('/settings')) return 'settings';
  if (path.includes('/bonwill')) return 'bonwill';
  return 'home';
}

// Components loaded on first paint (home shell)
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { Dashboard } from './components/Dashboard';

function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<any>,
  exportName?: string
) {
  return lazy(async () => {
    try {
      const module = await factory();
      if (exportName && module[exportName]) {
        return { default: module[exportName] as T };
      }
      if (module.default) {
        return { default: module.default as T };
      }
      const firstExport = Object.values(module)[0] as T;
      return { default: firstExport };
    } catch (error) {
      console.warn('Dynamic import failed, retrying once...', error);
      try {
        await new Promise((resolve) => setTimeout(resolve, 300));
        const module = await factory();
        if (exportName && module[exportName]) {
          return { default: module[exportName] as T };
        }
        if (module.default) {
          return { default: module.default as T };
        }
        const firstExport = Object.values(module)[0] as T;
        return { default: firstExport };
      } catch (retryErr) {
        console.error('Dynamic import retry failed:', retryErr);
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
    }
  });
}

// Secondary screens — lazy loaded so the app shell opens fast
const PatientList = lazyWithRetry(
  () => import('./components/PatientList'),
  'PatientList'
);
const StudentDirectory = lazyWithRetry(
  () => import('./components/StudentDirectory'),
  'StudentDirectory'
);
const AnalyticsDashboard = lazyWithRetry(
  () => import('./components/AnalyticsDashboard'),
  'AnalyticsDashboard'
);
const Settings = lazyWithRetry(
  () => import('./components/Settings'),
  'Settings'
);

// Heavy screens — lazy loaded so localhost opens fast
const CaseForm = lazyWithRetry(
  () => import('./components/CaseForm'),
  'CaseForm'
);
const CaseDetailsModal = lazyWithRetry(
  () => import('./components/CaseDetailsModal'),
  'CaseDetailsModal'
);
const ReportViewer = lazyWithRetry(
  () => import('./components/ReportViewer'),
  'ReportViewer'
);
const BonwillHawleyGenerator = lazyWithRetry(
  () => import('./components/bonwill/BonwillHawleyGenerator'),
  'BonwillHawleyGenerator'
);
const NotificationCenterModal = lazyWithRetry(
  () => import('./components/NotificationCenterModal'),
  'NotificationCenterModal'
);

function TabLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]" aria-label="Loading">
      <div className="h-8 w-8 rounded-full border-2 border-teal-600 border-t-transparent animate-spin" />
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('orthocase_current_user_id'));
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return getActiveUserAccount();
  });

  const [dashboardKey, setDashboardKey] = useState<number>(0);

  // Initialize activeTab strictly according to session rules:
  // - If session is already active (browser refresh), preserve current page/tab
  // - If it's a NEW login session or auto-login with Remember Me, ALWAYS start at Dashboard ('home')
  const [activeTab, setActiveTabState] = useState<ActiveTab>(() => {
    const isAuth = Boolean(localStorage.getItem('orthocase_current_user_id'));
    if (!isAuth) return 'home';

    const isSessionActive = sessionStorage.getItem('orthocase_session_active');
    if (isSessionActive === 'true') {
      const savedTab = sessionStorage.getItem('orthocase_active_tab') as ActiveTab | null;
      const pathTab = getTabFromPath(window.location.pathname);
      return savedTab || pathTab || 'home';
    } else {
      sessionStorage.setItem('orthocase_session_active', 'true');
      sessionStorage.setItem('orthocase_active_tab', 'home');
      return 'home';
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Tab switcher wrapper that synchronizes sessionStorage and browser location URL
  const handleTabChange = (tab: ActiveTab, filter?: string) => {
    if (filter) setCaseFilter(filter as any);
    setActiveTabState(tab);
    sessionStorage.setItem('orthocase_active_tab', tab);

    const user = currentUser || getCurrentUserAccount();
    const targetRoute = getTabRoute(tab, user.role);
    if (window.location.pathname !== targetRoute) {
      window.history.pushState({}, '', targetRoute);
    }
  };

  // Login handler: ALWAYS forces role-based Dashboard as default landing page & replaces history
  const handleLoginSuccess = (userAccount?: UserAccount) => {
    const loggedInUser = userAccount || getCurrentUserAccount();
    console.log('[AUTH-DEBUG] handleLoginSuccess called. loggedInUser:', loggedInUser.name, loggedInUser.role, loggedInUser.id);
    console.log('[AUTH-DEBUG] localStorage before setCurrentUser:', localStorage.getItem('orthocase_current_user_id'));
    sessionStorage.setItem('orthocase_session_active', 'true');
    sessionStorage.setItem('orthocase_active_tab', 'home');
    setCurrentUser(loggedInUser);
    setProfile({
      studentName: loggedInUser.name,
      rollNumber: loggedInUser.rollNumber || (loggedInUser.role === 'HOD' ? 'HOD-ORTHO-01' : loggedInUser.role === 'STAFF_GUIDE' ? 'STAFF-ORTHO-01' : 'PG-ORTHO-2024-012'),
      institution: loggedInUser.institution || 'Department of Orthodontics & Dentofacial Orthopedics',
      department: loggedInUser.department || 'Postgraduate Orthodontics',
      academicYear: loggedInUser.designation || 'Faculty / Senior MDS',
      supervisorName: loggedInUser.assignedStaffName || 'Prof. Dr. Richardson',
    });
    setActiveTabState('home');
    setEditingPatient(null);
    setSelectedPatientModal(null);
    setShowNotificationModal(false);
    setDashboardKey((prev) => prev + 1);
    setIsAuthenticated(true);

    const roleRoute = getRoleDashboardRoute(loggedInUser.role);
    console.log('[AUTH-DEBUG] Navigating to roleRoute:', roleRoute);
    window.history.replaceState({}, '', roleRoute);
  };

  // Logout handler: Clears session/navigation state, purges token caches, and redirects to Login screen
  const handleLogout = () => {
    console.log('[AUTH-DEBUG] handleLogout called. Clearing session.');
    clearAuthSession();
    setCurrentUser(null);
    setActiveTabState('home');
    setEditingPatient(null);
    setSelectedPatientModal(null);
    setShowNotificationModal(false);
    setIsAuthenticated(false);
    window.history.replaceState({}, '', '/login');
  };

  // Sync route on mount and when authentication or activeTab changes
  useEffect(() => {
    if (isAuthenticated) {
      const user = getCurrentUserAccount();
      const currentRoute = getTabRoute(activeTab, user.role);
      if (window.location.pathname !== currentRoute) {
        window.history.replaceState({}, '', currentRoute);
      }
    } else {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/login');
      }
    }
  }, [isAuthenticated, activeTab]);

  // Handle browser Back / Forward history popstate
  useEffect(() => {
    const handlePopState = () => {
      if (!localStorage.getItem('orthocase_current_user_id')) {
        setIsAuthenticated(false);
        return;
      }
      const pathTab = getTabFromPath(window.location.pathname);
      setActiveTabState(pathTab);
      sessionStorage.setItem('orthocase_active_tab', pathTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const activeUser = currentUser || getCurrentUserAccount();
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [profile, setProfile] = useState<StudentProfile>(() => {
    const user = activeUser;
    return {
      studentName: user?.name || 'Dr. Rahul Sharma',
      rollNumber: user?.rollNumber || (user?.role === 'HOD' ? 'HOD-ORTHO-01' : user?.role === 'STAFF_GUIDE' ? 'STAFF-ORTHO-01' : 'PG-ORTHO-2024-012'),
      institution: user?.institution || 'Department of Orthodontics & Dentofacial Orthopedics',
      department: user?.department || 'Postgraduate Orthodontics',
      academicYear: user?.designation || 'Senior MDS / Faculty',
      supervisorName: user?.assignedStaffName || 'Prof. Dr. Richardson',
    };
  });

  // Keep profile synchronized whenever logged in currentUser changes
  useEffect(() => {
    if (currentUser) {
      setProfile((prev) => ({
        ...prev,
        studentName: currentUser.name,
        rollNumber: currentUser.rollNumber || (currentUser.role === 'HOD' ? 'HOD-ORTHO-01' : currentUser.role === 'STAFF_GUIDE' ? 'STAFF-ORTHO-01' : prev.rollNumber),
        institution: currentUser.institution || prev.institution,
        department: currentUser.department || prev.department,
        academicYear: currentUser.designation || prev.academicYear,
        supervisorName: currentUser.assignedStaffName || prev.supervisorName,
      }));
    }
  }, [currentUser?.id, currentUser?.name]);

  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [selectedPatientModal, setSelectedPatientModal] = useState<PatientRecord | null>(null);
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [caseFilter, setCaseFilter] = useState<'all' | 'pending' | 'approved' | 'corrections' | 'archived'>('all');

  const handleNavigateToCase = (patientRecordId: string, _sectionId?: string) => {
    setShowNotificationModal(false);
    const target = patients.find(
      (p) => p.id === patientRecordId || p.patientId === patientRecordId
    );
    if (target) {
      setSelectedPatientModal(target);
    } else {
      handleTabChange('patients');
    }
  };

  // Load local data without blocking first paint or auto-seeding samples.
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [storedPatients, storedProfile] = await Promise.all([
          getAllPatients(),
          getStudentProfile(),
        ]);
        if (cancelled) return;
        setPatients(storedPatients);
        const user = getCurrentUserAccount();
        if (user) {
          setProfile({
            studentName: user.name,
            rollNumber: user.rollNumber || storedProfile?.rollNumber || (user.role === 'HOD' ? 'HOD-ORTHO-01' : user.role === 'STAFF_GUIDE' ? 'STAFF-ORTHO-01' : 'PG-ORTHO-2024-012'),
            institution: user.institution || storedProfile?.institution || 'Department of Orthodontics',
            department: user.department || storedProfile?.department || 'Orthodontics & Dentofacial Orthopedics',
            academicYear: user.designation || storedProfile?.academicYear || 'Faculty / Senior MDS',
            supervisorName: user.assignedStaffName || storedProfile?.supervisorName || 'Prof. Dr. Richardson',
          });
        }
      } catch (err) {
        console.error('Failed to load local data:', err);
      }
    }

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  // Warm CaseForm ASAP so Add Patient opens without waiting on idle/Bonwill
  useEffect(() => {
    prefetchCaseForm();
    return prefetchOnIdle(() => prefetchBonwillHawley(), 4000);
  }, []);

  // Handlers
  const handleSavePatient = async (patient: PatientRecord) => {
    const saved = await savePatient(patient);
    setPatients((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    setEditingPatient(null);
  };

  const handleDeletePatient = async (id: string) => {
    await deletePatient(id);
    setPatients((prev) => prev.filter((p) => p.id !== id));
    if (selectedPatientModal?.id === id) {
      setSelectedPatientModal(null);
    }
  };

  const handleToggleArchive = async (id: string) => {
    await toggleArchivePatient(id);
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, archived: !p.archived } : p))
    );
  };

  const handleSaveProfile = async (newProfile: StudentProfile) => {
    setProfile(newProfile);
    await saveStudentProfile(newProfile);
  };

  const handleLoadSamples = async () => {
    const { SAMPLE_PATIENTS } = await import('./lib/sampleData');
    await savePatientsBatch(SAMPLE_PATIENTS);
    const updated = await getAllPatients();
    setPatients(updated);
  };

  const handleClearData = async () => {
    const db = await getDB();
    const tx = db.transaction('patients', 'readwrite');
    await tx.store.clear();
    await tx.done;
    setPatients([]);
  };

  const handleStartNewCase = () => {
    prefetchCaseForm();
    setEditingPatient(null);
    startTransition(() => handleTabChange('form'));
  };

  const handleEditPatient = (patient: PatientRecord) => {
    prefetchCaseForm();
    setSelectedPatientModal(null);
    setEditingPatient(patient);
    startTransition(() => handleTabChange('form'));
  };

  const handleGeneratePDF = async (patient: PatientRecord) => {
    const { generatePatientPDF } = await import('./lib/pdfGenerator');
    generatePatientPDF(patient, profile);
  };

  const isFormMode = activeTab === 'form';

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div key={`app-${activeUser?.id || 'guest'}`} className="app-frame text-slate-900 font-sans selection:bg-teal-200">
      <div className="app-shell">
        <Header
          profile={profile}
          compact={isFormMode}
          patients={patients}
          onOpenSearch={() => handleTabChange('patients')}
          onOpenSettings={() => handleTabChange('settings')}
          onLogout={handleLogout}
          onOpenNotificationCenter={() => setShowNotificationModal(true)}
          onNavigateToCase={handleNavigateToCase}
        />

        <main className={`app-main ${isFormMode ? 'app-main--form' : 'px-3 pt-3'}`}>
          {activeTab === 'home' && (
            <Dashboard
              key={`dash-${dashboardKey}-${activeUser?.id || 'guest'}`}
              patients={patients}
              profile={profile}
              onChangeTab={(tab, filter) => handleTabChange(tab, filter)}
              onSelectPatient={(p) => setSelectedPatientModal(p)}
              onNewCase={handleStartNewCase}
              onGeneratePDF={handleGeneratePDF}
              onLoadSamples={handleLoadSamples}
            />
          )}

          {activeTab === 'patients' && (
            <Suspense fallback={<TabLoader />}>
              <PatientList
                patients={patients}
                initialFilter={caseFilter}
                onSelectPatient={(p) => setSelectedPatientModal(p)}
                onEditPatient={handleEditPatient}
                onGeneratePDF={handleGeneratePDF}
                onToggleArchive={handleToggleArchive}
                onDeletePatient={handleDeletePatient}
                onNewCase={handleStartNewCase}
              />
            </Suspense>
          )}

          {activeTab === 'form' && (
            <Suspense fallback={<TabLoader />}>
              <CaseForm
                initialPatient={editingPatient}
                onSavePatient={handleSavePatient}
                onCancel={() => {
                  setEditingPatient(null);
                  handleTabChange('patients');
                }}
              />
            </Suspense>
          )}

          {activeTab === 'bonwill' && (
            <Suspense fallback={<TabLoader />}>
              <BonwillHawleyGenerator
                patient={editingPatient || selectedPatientModal || patients[0]}
              />
            </Suspense>
          )}

          {activeTab === 'reports' && (
            <Suspense fallback={<TabLoader />}>
              <ReportViewer patients={patients} profile={profile} />
            </Suspense>
          )}

          {activeTab === 'students' && (
            <Suspense fallback={<TabLoader />}>
              <StudentDirectory patients={patients} />
            </Suspense>
          )}

          {activeTab === 'analytics' && (
            <Suspense fallback={<TabLoader />}>
              <AnalyticsDashboard />
            </Suspense>
          )}

          {activeTab === 'settings' && (
            <Suspense fallback={<TabLoader />}>
              <Settings
                profile={profile}
                onSaveProfile={handleSaveProfile}
                onLoadSamples={handleLoadSamples}
                onClearData={handleClearData}
                patientCount={patients.filter((p) => !p.archived).length}
                theme={theme}
                toggleTheme={toggleTheme}
                onLogout={handleLogout}
                onNavigate={(tab) => handleTabChange(tab as ActiveTab)}
              />
            </Suspense>
          )}
        </main>

        {selectedPatientModal && (
          <Suspense fallback={null}>
            <CaseDetailsModal
              patient={selectedPatientModal}
              profile={profile}
              onClose={() => setSelectedPatientModal(null)}
              onEdit={handleEditPatient}
            />
          </Suspense>
        )}

        {showNotificationModal && (
          <Suspense fallback={null}>
            <NotificationCenterModal
              patients={patients}
              onClose={() => setShowNotificationModal(false)}
              onNavigateToCase={handleNavigateToCase}
            />
          </Suspense>
        )}

        <BottomNav
          activeTab={activeTab}
          onChangeTab={(tab) => {
            if (tab === 'form') {
              prefetchCaseForm();
              if (editingPatient) setEditingPatient(null);
              startTransition(() => handleTabChange('form'));
              return;
            }
            handleTabChange(tab);
          }}
          onPrefetchTab={(tab) => {
            if (tab === 'form') prefetchCaseForm();
            if (tab === 'patients') prefetchPatientList();
            if (tab === 'reports') prefetchReportViewer();
          }}
          patientCount={patients.filter((p) => !p.archived).length}
        />
      </div>
    </div>
  );
}
