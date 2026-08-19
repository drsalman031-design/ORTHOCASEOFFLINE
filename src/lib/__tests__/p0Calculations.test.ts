import {
  calculateAnatomicalAngle,
  calculateAcuteLineAngle,
  calculateSignedPerpendicularDistance,
  calculateLineEquation,
} from '../../components/case-form/landmark-id/geometryEngine';
import { autoGenerateAllCephAnalyses } from '../../components/case-form/landmark-id/autoAnalysisGenerator';
import { calculateCarey, sumCareyMandibularToothMaterial } from '../calculations';
import { generateOrthoTreatmentPlan } from '../orthoTreatmentPlanEngine';
import {
  findCephVal,
  buildSheet1Payload,
  buildSheet2Payload,
  buildSheet3Payload,
  buildSheet4Payload,
  buildDiscrepancyMasterPayload1,
  buildDiscrepancyMasterPayload2,
} from '../cephPdfInferenceHelpers';
import { PatientRecord } from '../../types';

function runP0Tests() {
  console.log('====================================================');
  console.log('   ORTHOCASE — CRITICAL (P0) CALCULATION TEST SUITE  ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST CRIT-01: CEPH ANGLE OBTUSE TRUNCATION
  // -------------------------------------------------------------
  console.log('--- [CRIT-01] Anatomical vs Acute Line Angle Calculations ---');
  {
    // Line 1: along X axis (0, 0) to (10, 0)
    // Line 2: obtuse direction (0, 0) to (-10, 10) -> angle is 135°
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 10, y: 0 };
    const p3 = { x: 0, y: 0 };
    const p4 = { x: -10, y: 10 };

    const anatomical = calculateAnatomicalAngle(p1, p2, p3, p4);
    assert(Math.abs(anatomical - 135) < 0.1, 'CRIT-01.1: Anatomical angle preserves obtuse angle (135°)', `Got ${anatomical}°`);

    const acute = calculateAcuteLineAngle(p1, p2, p3, p4);
    assert(Math.abs(acute - 45) < 0.1, 'CRIT-01.2: Acute line angle clamps to 0-90° (45°)', `Got ${acute}°`);

    // IMPA obtuse line test: lower incisor tilted forward (proclined) relative to mandibular plane
    const mp1 = { x: 0, y: 100 }; // Gonion
    const mp2 = { x: 100, y: 100 }; // Menton
    const l1Apex = { x: 50, y: 80 }; // Root apex
    const l1Tip = { x: 60, y: 20 }; // Crown tip (proclined anteriorly)
    const impaAngle = calculateAnatomicalAngle(l1Tip, l1Apex, mp1, mp2);
    assert(impaAngle > 90, 'CRIT-01.3: Proclined IMPA calculated > 90°', `Got ${impaAngle}°`);
  }

  // -------------------------------------------------------------
  // TEST CRIT-02: WITS ORTHOGONAL PROJECTION
  // -------------------------------------------------------------
  console.log('\n--- [CRIT-02] Wits Orthogonal Projection onto Occlusal Plane ---');
  {
    const pxToMm = 5; // 5 px per mm
    // Define Occlusal Plane from (100, 300) to (500, 300) (horizontal occlusal plane)
    // Point A at (300, 200) -> orthogonal projection onto OP is (300, 300)
    // Point B at (285, 400) -> orthogonal projection onto OP is (285, 300)
    // Point A is 15 px (3.0 mm) anterior to Point B -> Wits = +3.0 mm (Class II)
    const landmarks = {
      point_a: { x: 300, y: 200 },
      point_b: { x: 285, y: 400 },
      occ_anterior: { x: 100, y: 300 },
      occ_posterior: { x: 500, y: 300 },
      porion: { x: 100, y: 100 },
      orbitale: { x: 400, y: 100 },
    };

    const analysis = autoGenerateAllCephAnalyses(landmarks, pxToMm);
    const wits = analysis.cephDiscrepancyAnalysis?.parameters?.witsAoBo?.pre;
    assert(wits === 3.0, 'CRIT-02.1: Horizontal OP Wits is +3.0 mm', `Got ${wits} mm`);

    // Now test with canted occlusal plane (slanted line at 45°: y = x)
    const cantedLandmarks = {
      point_a: { x: 200, y: 100 },
      point_b: { x: 100, y: 150 },
      occ_anterior: { x: 50, y: 50 },
      occ_posterior: { x: 400, y: 400 },
      porion: { x: 50, y: 20 },
      orbitale: { x: 300, y: 20 },
    };
    const cantedAnalysis = autoGenerateAllCephAnalyses(cantedLandmarks, pxToMm);
    const cantedWits = cantedAnalysis.cephDiscrepancyAnalysis?.parameters?.witsAoBo?.pre;
    assert(typeof cantedWits === 'number' && cantedWits > 0, 'CRIT-02.2: Canted OP Wits correctly projects orthogonally', `Got ${cantedWits} mm`);
  }

  // -------------------------------------------------------------
  // TEST CRIT-03: MCNAMARA NASION-PERPENDICULAR LINE
  // -------------------------------------------------------------
  console.log('\n--- [CRIT-03] McNamara Nasion-Perpendicular Line & Distances ---');
  {
    const pxToMm = 10; // 10 px per mm
    // FH line: Po(50, 100) to Or(250, 100) (horizontal line y=100)
    // Nasion at (200, 50)
    // N-Perpendicular line: x = 200
    // Point A at (220, 150) -> 20 px anterior = +2.0 mm
    // Pogonion at (180, 250) -> 20 px posterior = -2.0 mm
    const landmarks = {
      porion: { x: 50, y: 100 },
      orbitale: { x: 250, y: 100 },
      nasion: { x: 200, y: 50 },
      point_a: { x: 220, y: 150 },
      pogonion: { x: 180, y: 250 },
    };

    const analysis = autoGenerateAllCephAnalyses(landmarks, pxToMm);
    const aNPerp = analysis.mcnamaraAnalysis?.parameters?.naPerpToPointA?.pre;
    const pogNPerp = analysis.mcnamaraAnalysis?.parameters?.pogNaPerp?.pre;

    assert(aNPerp === 2.0, 'CRIT-03.1: McNamara Point A to N-Perp is +2.0 mm', `Got ${aNPerp} mm`);
    assert(pogNPerp === -2.0, 'CRIT-03.2: McNamara Pogonion to N-Perp is -2.0 mm', `Got ${pogNPerp} mm`);

    const discANPerp = analysis.cephDiscrepancyAnalysis?.parameters?.aNPerp?.pre;
    const discPogNPerp = analysis.cephDiscrepancyAnalysis?.parameters?.pogNPerp?.pre;
    assert(discANPerp === 2.0, 'CRIT-03.3: Discrepancy A to N-Perp is +2.0 mm', `Got ${discANPerp} mm`);
    assert(discPogNPerp === -2.0, 'CRIT-03.4: Discrepancy Pog to N-Perp is -2.0 mm', `Got ${discPogNPerp} mm`);
  }

  // -------------------------------------------------------------
  // TEST CRIT-04: SIGNED PERPENDICULAR DISTANCE FUNCTION
  // -------------------------------------------------------------
  console.log('\n--- [CRIT-04] Signed Perpendicular Profile Distances ---');
  {
    // Vertical reference line: x = 100, passing through (100, 0) and (100, 200)
    const line = calculateLineEquation({ x: 100, y: 0 }, { x: 100, y: 200 });

    // Protrusive point (anterior, x=130): +30 px
    const protrusivePt = { x: 130, y: 100 };
    const distPro = calculateSignedPerpendicularDistance(protrusivePt, line, true);
    assert(distPro === 30, 'CRIT-04.1: Anterior protrusive point has positive signed distance (+30)', `Got ${distPro}`);

    // Retrusive point (posterior, x=70): -30 px
    const retrusivePt = { x: 70, y: 100 };
    const distRet = calculateSignedPerpendicularDistance(retrusivePt, line, true);
    assert(distRet === -30, 'CRIT-04.2: Posterior retrusive point has negative signed distance (-30)', `Got ${distRet}`);

    // On-the-line point (x=100): 0 px
    const onLinePt = { x: 100, y: 100 };
    const distZero = calculateSignedPerpendicularDistance(onLinePt, line, true);
    assert(distZero === 0, 'CRIT-04.3: Point directly on line has zero distance (0)', `Got ${distZero}`);
  }

  // -------------------------------------------------------------
  // TEST CRIT-05: CAREY'S ANALYSIS NO CROSS-ARCH FALLBACK
  // -------------------------------------------------------------
  console.log('\n--- [CRIT-05] Carey\'s Analysis Mandibular Independence ---');
  {
    // Case A: Missing mandibular arch length available -> should return null discrepancy, not fallback to maxillary
    const toothWidthsMaxOnly = {
      '11': 8.5, '12': 7.0, '13': 7.5, '14': 7.0, '15': 6.5, '16': 10.0,
      '21': 8.5, '22': 7.0, '23': 7.5, '24': 7.0, '25': 6.5, '26': 10.0,
    };
    const resultIncomplete = calculateCarey(toothWidthsMaxOnly, '');
    assert(resultIncomplete.discrepancy === null, 'CRIT-05.1: Missing mandibular arch length yields null discrepancy', `Got ${resultIncomplete.discrepancy}`);
    assert(resultIncomplete.totalToothMaterial === 0, 'CRIT-05.2: Mandibular tooth material is 0 when only maxillary teeth entered', `Got ${resultIncomplete.totalToothMaterial}`);
    assert(resultIncomplete.inference.includes('Mandibular'), 'CRIT-05.3: Guidance mentions Mandibular requirements', resultIncomplete.inference);

    // Case B: Valid mandibular arch length & tooth widths (35-45 sum = 55.0 mm, available = 50.0 mm -> discrepancy = -5.0 mm)
    const toothWidthsMand: Record<string, number> = {
      '31': 5.0, '32': 5.5, '33': 6.5, '34': 7.0, '35': 7.0,
      '41': 5.0, '42': 5.5, '43': 6.5, '44': 7.0, '45': 7.0,
      '46': 10.0, // tooth 46 should not be included in Carey 35-45
    };
    const mandToothSum = sumCareyMandibularToothMaterial(toothWidthsMand);
    assert(mandToothSum === 62.0, 'CRIT-05.4: sumCareyMandibularToothMaterial correctly sums only 35 to 45 (62.0 mm)', `Got ${mandToothSum}`);

    const resultValid = calculateCarey(toothWidthsMand, 50.0);
    assert(resultValid.discrepancy === -12.0, 'CRIT-05.5: calculateCarey computes true discrepancy: 50.0 - 62.0 = -12.0 mm', `Got ${resultValid.discrepancy}`);
    assert(resultValid.badgeColor === 'amber' || resultValid.badgeColor === 'red', 'CRIT-05.6: Badge color reflects deficiency', resultValid.badgeColor);
  }

  // -------------------------------------------------------------
  // TEST CRIT-06: TREATMENT PLAN ARCH LENGTH DISCREPANCY FLOW
  // -------------------------------------------------------------
  console.log('\n--- [CRIT-06] Orthodontic Treatment Plan True ALD Flow ---');
  {
    // Patient has maxillaryArchLengthAvailable = 74 mm, but tooth widths sum to 72 mm (ALD = -4.0 mm crowding)
    const patientWithCrowding: PatientRecord = {
      id: 'test-p1',
      name: 'Test Patient',
      age: 20,
      gender: 'Female',
      date: '2026-08-19',
      chiefComplaint: {
        protrudingTeeth: false,
        irregularTeeth: true,
      },
      modelAnalysis: {
        maxillaryArchLengthAvailable: 74,
        mandibularArchLengthAvailable: 68,
        toothWidths: {
          '31': 6.0, '32': 6.5, '33': 7.5, '34': 8.0, '35': 8.0,
          '41': 6.0, '42': 6.5, '43': 7.5, '44': 8.0, '45': 8.0,
        }, // Mandibular sum = 72.0 mm -> Mandibular ALD = 68 - 72 = -4.0 mm
      },
    };

    const plan = generateOrthoTreatmentPlan(patientWithCrowding);
    const justPoint = plan.extractionDecision.points.find(p => p.id === 'ed-3');

    assert(justPoint?.text.includes('-4.0 mm') || justPoint?.text.includes('ALD'), 'CRIT-06.1: Treatment plan references true calculated ALD, not absolute 74 mm perimeter', justPoint?.text);

    // Patient with mild ALD (+15.0 mm spacing):
    const patientWithSpacing: PatientRecord = {
      id: 'test-p2',
      name: 'Test Patient Spacing',
      age: 18,
      gender: 'Male',
      chiefComplaint: {
        protrudingTeeth: false,
        irregularTeeth: false,
      },
      modelAnalysis: {
        mandibularArchLengthAvailable: 70,
        toothWidths: {
          '31': 5.0, '32': 5.5, '33': 6.5, '34': 7.0, '35': 7.0,
          '41': 5.0, '42': 5.5, '43': 6.5, '44': 7.0, '45': 7.0,
        }, // Mandibular sum = 55.0 mm -> ALD = +15.0 mm
      },
    };
    const planSpacing = generateOrthoTreatmentPlan(patientWithSpacing);
    const extRec = planSpacing.extractionDecision.points.find(p => p.id === 'ed-1');
    assert(extRec?.text.includes('Non-Extraction'), 'CRIT-06.2: Non-extraction planned for positive arch length discrepancy', extRec?.text);
  }

  // -------------------------------------------------------------
  // TEST CRIT-07: CEPH PDF REPORT SILENT FAKE NUMBER ELIMINATION
  // -------------------------------------------------------------
  console.log('\n--- [CRIT-07] Elimination of Silent Default Values in PDF Helpers ---');
  {
    // When no cephalometric values are supplied:
    const emptyCompCeph = {};
    const getStageVal = () => null;

    // 1. findCephVal returns null when candidates are empty
    const val = findCephVal(undefined, null, '');
    assert(val === null, 'CRIT-07.1: findCephVal returns null for empty candidates', `Got ${val}`);

    // 2. Sheet 1 payload has dashes '—' instead of fake numbers
    const s1 = buildSheet1Payload(emptyCompCeph, 'Female', {}, {}, {}, {}, {}, {}, getStageVal);
    const midLowerRow = s1.rows[0];
    const snGoGnRow = s1.rows[2];
    const fmaRow = s1.rows[3];
    const jarabakRow = s1.rows[4];
    const bjorkRow = s1.rows[5];

    assert(midLowerRow[1] === '—', 'CRIT-07.2: Sheet 1 Mid-Lower face ht displays "—" when empty', String(midLowerRow[1]));
    assert(snGoGnRow[1] === '—', 'CRIT-07.3: Sheet 1 SN-GoGn displays "—" when empty (not 32.0°)', String(snGoGnRow[1]));
    assert(fmaRow[1] === '—', 'CRIT-07.4: Sheet 1 FMA displays "—" when empty (not 25.0°)', String(fmaRow[1]));
    assert(jarabakRow[1] === '—', 'CRIT-07.5: Sheet 1 Jarabak displays "—" when empty (not 63.5%)', String(jarabakRow[1]));
    assert(bjorkRow[1] === '—', 'CRIT-07.6: Sheet 1 Bjork Sum displays "—" when empty (not 396.0°)', String(bjorkRow[1]));
    assert(midLowerRow[3] === 'Not Recorded', 'CRIT-07.7: Diagnostic inference is "Not Recorded" when unmeasured', String(midLowerRow[3]));

    // 3. Sheet 2 payload
    const s2 = buildSheet2Payload(emptyCompCeph, null, null, undefined, 'Female');
    const uiRestRow = s2.rows[5];
    assert(uiRestRow[1] === '—', 'CRIT-07.8: Sheet 2 UI Rest displays "—" when empty', String(uiRestRow[1]));

    // 4. Sheet 3 payload
    const s3 = buildSheet3Payload(emptyCompCeph, {}, {}, {}, {}, getStageVal);
    const uiNaDegRow = s3.rows[2];
    assert(uiNaDegRow[1] === '—', 'CRIT-07.9: Sheet 3 UI-NA deg displays "—" when empty (not 24.0°)', String(uiNaDegRow[1]));

    // 5. Sheet 4 payload
    const s4 = buildSheet4Payload(emptyCompCeph, {}, {}, {}, {}, getStageVal);
    const impaRow = s4.rows[1];
    assert(impaRow[1] === '—', 'CRIT-07.10: Sheet 4 IMPA displays "—" when empty (not 93.0°)', String(impaRow[1]));

    // 6. Master Discrepancy 1 payload
    const m1 = buildDiscrepancyMasterPayload1({}, 'Female', getStageVal, {}, {}, {}, {}, {}, {});
    const anbRow = m1.rows[0];
    const witsRow = m1.rows[2];
    assert(anbRow[1] === '—', 'CRIT-07.11: Master Discrepancy ANB displays "—" when empty (not 2.0°)', String(anbRow[1]));
    assert(witsRow[1] === '—', 'CRIT-07.12: Master Discrepancy Wits displays "—" when empty (not 0.0 mm)', String(witsRow[1]));

    // 7. Master Discrepancy 2 payload
    const m2 = buildDiscrepancyMasterPayload2({}, getStageVal, {}, {}, {}, {}, {}, {});
    const snaRow = m2.rows[0];
    const snbRow = m2.rows[5];
    assert(snaRow[1] === '—', 'CRIT-07.13: Master Discrepancy SNA displays "—" when empty (not 82.0°)', String(snaRow[1]));
    assert(snbRow[1] === '—', 'CRIT-07.14: Master Discrepancy SNB displays "—" when empty (not 80.0°)', String(snbRow[1]));
  }

  console.log('\n====================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runP0Tests();