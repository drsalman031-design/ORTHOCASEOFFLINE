/** Warm lazy chunks during idle time so tab switches feel instant. */
export function prefetchCaseForm() {
  // CaseForm + first tab (History) — avoid Add Patient waterfall
  void import('../components/CaseForm');
  void import('../components/case-form/TabHistory');
}

export function prefetchBonwillHawley() {
  void import('../components/bonwill/BonwillHawleyGenerator');
}

export function prefetchPatientList() {
  void import('../components/PatientList');
}

export function prefetchReportViewer() {
  void import('../components/ReportViewer');
}

export function prefetchOnIdle(task: () => void, timeoutMs = 2000) {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(() => task(), { timeout: timeoutMs });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(task, Math.min(timeoutMs, 1200));
  return () => window.clearTimeout(id);
}
