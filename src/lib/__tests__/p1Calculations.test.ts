import {
  calculateBolton,
  calculatePonts,
  calculateCarey,
} from '../calculations';
import { autoGenerateAllCephAnalyses } from '../../components/case-form/landmark-id/autoAnalysisGenerator';
import {
  runGeometryEngine,
  Point2D,
} from '../../components/case-form/landmark-id/geometryEngine';

export function runP1Tests() {
  console.log('====================================================');
  console.log('   ORTHOCASE — P1 CALCULATION & VALIDATION TESTS     ');
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
  // P1-01: BOLTON INPUT VALIDATION
  // -------------------------------------------------------------
  console.log('--- [P1-01] Bolton Ratio Input Validation ---');
  {
    const full12Max: Record<string, number> = {
      '16': 10.0, '15': 7.0, '14': 7.0, '13': 7.5, '12': 6.5, '11': 8.5,
      '21': 8.5, '22': 6.5, '23': 7.5, '24': 7.0, '25': 7.0, '26': 10.0,
    };
    const full12Mand: Record<string, number> = {
      '46': 10.5, '45': 7.0, '44': 7.0, '43': 6.5, '42': 5.5, '41': 5.0,
      '31': 5.0, '32': 5.5, '33': 6.5, '34': 7.0, '35': 7.0, '36': 10.5,
    };
    const complete24Teeth = { ...full12Max, ...full12Mand };

    // 1. Complete 24 teeth calculates both ratios
    const res1 = calculateBolton(complete24Teeth);
    assert(
      res1.anteriorRatio !== null && Math.abs(res1.anteriorRatio - 75.56) < 0.1,
      'P1-01.1: Complete 24 teeth calculates valid Anterior Ratio (75.6%)',
      `Got ${res1.anteriorRatio}`
    );
    assert(
      res1.overallRatio !== null && Math.abs(res1.overallRatio - 89.25) < 0.1,
      'P1-01.2: Complete 24 teeth calculates valid Overall Ratio (89.25%)',
      `Got ${res1.overallRatio}`
    );

    // 2. Complete 6-6 anterior teeth calculates anterior ratio, overall is null
    const anteriorOnly: Record<string, number> = {
      '13': 7.5, '12': 6.5, '11': 8.5, '21': 8.5, '22': 6.5, '23': 7.5,
      '43': 6.5, '42': 5.5, '41': 5.0, '31': 5.0, '32': 5.5, '33': 6.5,
    };
    const res2 = calculateBolton(anteriorOnly);
    assert(
      res2.anteriorRatio !== null && Math.abs(res2.anteriorRatio - 75.56) < 0.1,
      'P1-01.3: Complete 6-6 anterior teeth calculates valid Anterior Ratio',
      `Got ${res2.anteriorRatio}`
    );
    assert(
      res2.overallRatio === null,
      'P1-01.4: Missing posteriors results in overallRatio === null',
      `Got ${res2.overallRatio}`
    );

    // 3. One missing tooth in maxillary anterior (13 missing)
    const missing13 = { ...complete24Teeth };
    delete missing13['13'];
    const res3 = calculateBolton(missing13);
    assert(
      res3.anteriorRatio === null,
      'P1-01.5: Missing 13 results in anteriorRatio === null',
      `Got ${res3.anteriorRatio}`
    );
    assert(
      res3.overallRatio === null,
      'P1-01.6: Missing 13 results in overallRatio === null',
      `Got ${res3.overallRatio}`
    );

    // 4. One missing tooth in mandibular anterior (43 missing)
    const missing43 = { ...complete24Teeth };
    delete missing43['43'];
    const res4 = calculateBolton(missing43);
    assert(
      res4.anteriorRatio === null && res4.overallRatio === null,
      'P1-01.7: Missing 43 results in null ratios'
    );

    // 5. Partial dataset (only central incisors 11, 21, 31, 41)
    const partial = { '11': 8.5, '21': 8.5, '31': 5.0, '41': 5.0 };
    const res5 = calculateBolton(partial);
    assert(
      res5.anteriorRatio === null && res5.overallRatio === null,
      'P1-01.8: Partial central incisors only results in null ratios'
    );

    // 6. Empty / zero data
    const res6 = calculateBolton({});
    assert(
      res6.anteriorRatio === null && res6.overallRatio === null,
      'P1-01.9: Empty data results in null ratios'
    );
  }

  // -------------------------------------------------------------
  // P1-02: PONT'S INDEX INPUT VALIDATION
  // -------------------------------------------------------------
  console.log('\n--- [P1-02] Pont\'s Index Input Validation ---');
  {
    // 1. Complete 4/4 incisors (12, 11, 21, 22)
    const fourIncisors = { '12': 7.0, '11': 9.0, '21': 9.0, '22': 7.0 };
    const res1 = calculatePonts(fourIncisors, 38.0, 48.0);
    assert(
      res1.calculatedMPV === 40.0,
      'P1-02.1: 4/4 incisors calculates exact MPV (40.0 mm)',
      `Got ${res1.calculatedMPV}`
    );
    assert(
      res1.calculatedMMV === 50.0,
      'P1-02.2: 4/4 incisors calculates exact MMV (50.0 mm)',
      `Got ${res1.calculatedMMV}`
    );
    assert(
      res1.premolarExpansionNeeded === 2.0,
      'P1-02.3: 4/4 incisors calculates expansion needed (2.0 mm)',
      `Got ${res1.premolarExpansionNeeded}`
    );

    // 2. 3/4 incisors (12 missing)
    const threeIncisors = { '11': 9.0, '21': 9.0, '22': 7.0 };
    const res2 = calculatePonts(threeIncisors, 38.0);
    assert(
      res2.calculatedMPV === null && res2.premolarExpansionNeeded === null,
      'P1-02.4: 3/4 incisors yields null MPV and null expansion',
      `Got MPV=${res2.calculatedMPV}`
    );

    // 3. 2/4 incisors (only 11 and 21)
    const twoIncisors = { '11': 9.0, '21': 9.0 };
    const res3 = calculatePonts(twoIncisors, 38.0);
    assert(
      res3.calculatedMPV === null,
      'P1-02.5: 2/4 incisors yields null MPV',
      `Got MPV=${res3.calculatedMPV}`
    );

    // 4. 1/4 incisors
    const oneIncisor = { '11': 9.0 };
    const res4 = calculatePonts(oneIncisor);
    assert(
      res4.calculatedMPV === null,
      'P1-02.6: 1/4 incisors yields null MPV'
    );

    // 5. 0/4 incisors
    const res5 = calculatePonts({});
    assert(
      res5.calculatedMPV === null,
      'P1-02.7: 0/4 incisors yields null MPV'
    );
  }

  // -------------------------------------------------------------
  // P1-03: DOWNS ANGLE OF CONVEXITY
  // -------------------------------------------------------------
  console.log('\n--- [P1-03] Downs Angle of Convexity (N-A-Pog) ---');
  {
    const pxToMm = 10;

    // 1. Straight profile (collinear N, A, Pog)
    const straightLandmarks: Record<string, Point2D> = {
      porion: { x: 100, y: 150 },
      orbitale: { x: 300, y: 150 },
      nasion: { x: 300, y: 50 },
      point_a: { x: 300, y: 150 },
      pogonion: { x: 300, y: 250 },
    };
    const res1 = autoGenerateAllCephAnalyses(straightLandmarks, pxToMm);
    const val1 = res1.downsAnalysis.parameters.angleConvexity.pre;
    assert(
      val1 === 0.0,
      'P1-03.1: Straight collinear profile produces 0.0° convexity',
      `Got ${val1}°`
    );

    // 2. Convex profile (Point A anterior / protrusive by +20 px)
    const convexLandmarks: Record<string, Point2D> = {
      porion: { x: 100, y: 150 },
      orbitale: { x: 300, y: 150 },
      nasion: { x: 300, y: 50 },
      point_a: { x: 320, y: 150 }, // Point A anterior
      pogonion: { x: 300, y: 250 },
    };
    const res2 = autoGenerateAllCephAnalyses(convexLandmarks, pxToMm);
    const val2 = res2.downsAnalysis.parameters.angleConvexity.pre as number;
    assert(
      val2 > 0 && Math.abs(val2 - 22.6) < 0.2,
      'P1-03.2: Convex profile produces positive (+) angle (+22.6°)',
      `Got ${val2}°`
    );

    // 3. Concave profile (Point A posterior / retrusive by -20 px)
    const concaveLandmarks: Record<string, Point2D> = {
      porion: { x: 100, y: 150 },
      orbitale: { x: 300, y: 150 },
      nasion: { x: 300, y: 50 },
      point_a: { x: 280, y: 150 }, // Point A posterior
      pogonion: { x: 300, y: 250 },
    };
    const res3 = autoGenerateAllCephAnalyses(concaveLandmarks, pxToMm);
    const val3 = res3.downsAnalysis.parameters.angleConvexity.pre as number;
    assert(
      val3 < 0 && Math.abs(val3 - (-22.6)) < 0.2,
      'P1-03.3: Concave profile produces negative (−) angle (−22.6°)',
      `Got ${val3}°`
    );

    // 4. Translation invariance
    const translatedLandmarks: Record<string, Point2D> = {
      porion: { x: 250, y: 350 },
      orbitale: { x: 450, y: 350 },
      nasion: { x: 450, y: 250 },
      point_a: { x: 470, y: 350 }, // +20 px anterior
      pogonion: { x: 450, y: 450 },
    };
    const res4 = autoGenerateAllCephAnalyses(translatedLandmarks, pxToMm);
    const val4 = res4.downsAnalysis.parameters.angleConvexity.pre as number;
    assert(
      Math.abs(val4 - 22.6) < 0.2,
      'P1-03.4: Convexity calculation is strictly translation invariant',
      `Got ${val4}°`
    );
  }

  // -------------------------------------------------------------
  // P1-04: DOWNS A-B PLANE ANGLE
  // -------------------------------------------------------------
  console.log('\n--- [P1-04] Downs A-B Plane Angle (AB to N-Pog) ---');
  {
    const pxToMm = 10;

    // 1. Class I/II configuration (Point B posterior to Point A relative to facial plane)
    const class1Landmarks: Record<string, Point2D> = {
      porion: { x: 100, y: 150 },
      orbitale: { x: 300, y: 150 },
      nasion: { x: 300, y: 50 },
      pogonion: { x: 300, y: 350 }, // Facial plane is line x = 300
      point_a: { x: 310, y: 150 }, // distA = +10 px
      point_b: { x: 305, y: 250 }, // distB = +5 px (more posterior than A)
    };
    const res1 = autoGenerateAllCephAnalyses(class1Landmarks, pxToMm);
    const val1 = res1.downsAnalysis.parameters.abPlane.pre as number;
    assert(
      val1 < 0 && Math.abs(val1 - (-2.9)) < 0.2,
      'P1-04.1: Class I/II normal configuration produces negative (−) angle (−2.9°)',
      `Got ${val1}°`
    );

    // 2. Class III configuration (Point B anterior to Point A relative to facial plane)
    const class3Landmarks: Record<string, Point2D> = {
      porion: { x: 100, y: 150 },
      orbitale: { x: 300, y: 150 },
      nasion: { x: 300, y: 50 },
      pogonion: { x: 300, y: 350 },
      point_a: { x: 310, y: 150 }, // distA = +10 px
      point_b: { x: 320, y: 250 }, // distB = +20 px (more anterior than A)
    };
    const res2 = autoGenerateAllCephAnalyses(class3Landmarks, pxToMm);
    const val2 = res2.downsAnalysis.parameters.abPlane.pre as number;
    assert(
      val2 > 0 && Math.abs(val2 - 5.7) < 0.2,
      'P1-04.2: Class III configuration produces positive (+) angle (+5.7°)',
      `Got ${val2}°`
    );

    // 3. Parallel A-B line and N-Pog line produces 0.0°
    const parallelLandmarks: Record<string, Point2D> = {
      porion: { x: 100, y: 150 },
      orbitale: { x: 300, y: 150 },
      nasion: { x: 300, y: 50 },
      pogonion: { x: 300, y: 350 },
      point_a: { x: 310, y: 150 },
      point_b: { x: 310, y: 250 },
    };
    const res3 = autoGenerateAllCephAnalyses(parallelLandmarks, pxToMm);
    const val3 = res3.downsAnalysis.parameters.abPlane.pre;
    assert(
      val3 === 0.0,
      'P1-04.3: Parallel A-B and N-Pog lines produce 0.0°',
      `Got ${val3}°`
    );
  }

  // -------------------------------------------------------------
  // P1-05: PP-MP LIVE BADGE PREVIEW
  // -------------------------------------------------------------
  console.log('\n--- [P1-05] PP-MP Live Badge Preview in geometryEngine ---');
  {
    const landmarks: Record<string, Point2D> = {
      ans: { x: 250, y: 120 },
      pns: { x: 120, y: 120 }, // Palatal plane
      gonion: { x: 100, y: 220 },
      menton: { x: 230, y: 270 }, // Mandibular plane sloping down-forward
    };
    const res = runGeometryEngine(landmarks, 10);
    const ppMp = res.angles.find((a) => a.id === 'pp_mp');
    assert(
      ppMp !== undefined && ppMp.valueDegrees < 90 && Math.abs(ppMp.valueDegrees - 21.0) < 0.5,
      'P1-05.1: Live PP-MP angle returns acute value (~21.0°), NOT obtuse (>90°)',
      `Got ${ppMp?.valueDegrees}°`
    );
  }

  // -------------------------------------------------------------
  // P1-06: CAREY MANDIBULAR INPUT VALIDATION
  // -------------------------------------------------------------
  console.log('\n--- [P1-06] Carey\'s Model Analysis Input Validation ---');
  {
    const full10MandTeeth: Record<string, number> = {
      '45': 7.0, '44': 7.0, '43': 6.5, '42': 5.5, '41': 5.0,
      '31': 5.0, '32': 5.5, '33': 6.5, '34': 7.0, '35': 7.0,
    };

    // 1. Complete 10 mandibular teeth with arch length available
    const res1 = calculateCarey(full10MandTeeth, 58.0);
    assert(
      res1.discrepancy === -4.0 && res1.totalToothMaterial === 62.0,
      'P1-06.1: Complete 10 teeth calculates exact deficiency (-4.0 mm)',
      `Got discrepancy=${res1.discrepancy}, TTM=${res1.totalToothMaterial}`
    );

    // 2. Missing 1 mandibular tooth (35 missing)
    const missing35 = { ...full10MandTeeth };
    delete missing35['35'];
    const res2 = calculateCarey(missing35, 58.0);
    assert(
      res2.discrepancy === null,
      'P1-06.2: Missing 35 yields discrepancy === null',
      `Got discrepancy=${res2.discrepancy}`
    );
    assert(
      res2.inference.includes('Enter all 10 Mandibular Tooth Widths'),
      'P1-06.3: Inference informs user of missing mandibular teeth'
    );

    // 3. Partial 2 teeth entered
    const twoTeeth = { '31': 5.0, '41': 5.0 };
    const res3 = calculateCarey(twoTeeth, 60.0);
    assert(
      res3.discrepancy === null,
      'P1-06.4: Partial 2 teeth yields null discrepancy (never false spacing)',
      `Got discrepancy=${res3.discrepancy}`
    );

    // 4. Missing arch length
    const res4 = calculateCarey(full10MandTeeth, '');
    assert(
      res4.discrepancy === null,
      'P1-06.5: Missing arch length available yields null discrepancy'
    );

    // 5. Zero arch length
    const res5 = calculateCarey(full10MandTeeth, 0);
    assert(
      res5.discrepancy === null,
      'P1-06.6: Zero arch length available yields null discrepancy'
    );
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`P1 TEST RUN COMPLETE: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

// Auto-run when executed directly via tsx
runP1Tests();