const CACHE_NAME = 'orthocase-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.svg',
  '/icon-512.svg',
  '/src/main.tsx',
  '/src/App.tsx',
  '/src/index.css',
  '/src/components/Header.tsx',
  '/src/components/BottomNav.tsx',
  '/src/components/CaseForm.tsx',
  '/src/components/Dashboard.tsx',
  '/src/components/PatientList.tsx',
  '/src/components/Settings.tsx',
  '/src/components/ReportViewer.tsx',
  '/src/components/CaseDetailsModal.tsx',
  '/src/components/FacultyReviewPortal.tsx',
  '/src/components/BonwillHawleyGenerator.tsx',
  '/src/components/case-form/TabCephalometricAnalysis.tsx',
  '/src/components/case-form/TabTreatmentPlan.tsx',
  '/src/components/case-form/TabHistory.tsx',
  '/src/components/case-form/TabExtraoralProfile.tsx',
  '/src/components/case-form/TabIntraoral.tsx',
  '/src/components/case-form/TabModelAnalysis.tsx',
  '/src/components/case-form/TabRadiographyGrowth.tsx',
  '/src/components/case-form/TabFunctionalTmj.tsx',
  '/src/components/case-form/TabAiDiagnosis.tsx',
  '/src/components/case-form/DownsAnalysis.tsx',
  '/src/components/case-form/SteinersAnalysis.tsx',
  '/src/components/case-form/RickettsAnalysis.tsx',
  '/src/components/case-form/McnamaraAnalysis.tsx',
  '/src/components/case-form/SchwarzTweedAnalysis.tsx',
  '/src/components/case-form/HoldawayAnalysis.tsx',
  '/src/components/case-form/CogsAnalysis.tsx',
  '/src/components/case-form/CephDiscrepancyAnalysis.tsx',
  '/src/components/case-form/VerticalJawDivergenceAnalysis.tsx',
  '/src/components/case-form/SagittalVerticalInteractionAnalysis.tsx',
  '/src/components/case-form/SelectField.tsx',
  '/src/components/case-form/MultiSelectField.tsx',
  '/src/lib/db.ts',
  '/src/lib/sampleData.ts',
  '/src/lib/completion.ts',
  '/src/lib/pdfGenerator.ts',
  '/src/lib/prefetch.ts',
  '/src/lib/orthoTreatmentPlanEngine.ts',
  '/src/lib/orthoDiagnosisEngine.ts',
  '/src/lib/geminiOrthoService.ts',
  '/src/lib/calculations.ts',
  '/src/lib/potraceVectorizer.ts',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      });
    })
  );
});