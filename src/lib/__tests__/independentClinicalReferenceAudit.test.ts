import {
  calculateAnatomicalAngle,
  calculateAcuteLineAngle,
  calculateSignedPerpendicularDistance,
  calculateLineEquation,
  calculateVertexAngle,
} from '../../components/case-form/landmark-id/geometryEngine';
import {
  calculateBolton,
  calculateCarey,
  calculateNanceMaxillary,
  calculatePonts,
  calculateAshleyHowe,
  calculateTanakaJohnston,
  sumCareyMandibularToothMaterial,
  sumMaxillaryArchToothMaterial,
  sumMandibular4Incisors,
} from '../calculations';
import {
  calculateIncisorDifferences,
  calculateSpaceBudget,
} from '../dentalVTOEngine';

/**
 * INDEPENDENT CLINICAL REFERENCE AUDIT
 * Computes reference mathematical benchmarks independently from production functions
 * and rigorously compares outputs across standard, boundary, and extreme scenarios.
 */
function runIndependentReferenceAudit() {
  console.log('\n======================================================');
  console.log('  ORTHOCASE INDEPENDENT CLINICAL REFERENCE AUDIT');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assertEqual(actual: any, expected: any, desc: string) {
    if (actual === expected || (typeof actual === 'number' && typeof expected === 'number' && Math.abs(actual - expected) < 1e-3)) {
      console.log(`  ✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${desc} (Expected ${expected}, got ${actual})`);
      failed++;
    }
  }

  // -----------------------------------------------------------------
  // 1. INDEPENDENT CEPHALOMETRIC ANGLE AUDIT (Pure Vector Trig)
  // -----------------------------------------------------------------
  console.log('--- 1. Cephalometric Angle & Trig Verification ---');
  // Vector 1: (0,0) -> (10, 0)
  // Vector 2: (0,0) -> (-10, 10) (135 degrees)
  const p1 = { x: 0, y: 0 };
  const p2 = { x: 10, y: 0 };
  const p3 = { x: 0, y: 0 };
  const p4 = { x: -10, y: 10 };

  // Independent dot product calculation
  const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
  const v2 = { x: p4.x - p3.x, y: p4.y - p3.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  const expectedAnatomical = Math.round((Math.acos(dot / (mag1 * mag2)) * 180 / Math.PI) * 10) / 10;
  const actualAnatomical = calculateAnatomicalAngle(p1, p2, p3, p4);

  assertEqual(actualAnatomical, expectedAnatomical, 'Anatomical Angle matches independent vector cosine law (135.0°)');
  assertEqual(actualAnatomical, 135.0, 'Anatomical Angle preserves obtuse angle > 90°');

  const actualAcute = calculateAcuteLineAngle(p1, p2, p3, p4);
  assertEqual(actualAcute, 45.0, 'Acute line angle clamps to supplementary angle (45.0°)');

  // Vertex angle: SNA (Sella -> Nasion -> Point A)
  // Sella: (10, 10), Nasion: (50, 10), Point A: (40, 40)
  const sella = { x: 10, y: 10 };
  const nasion = { x: 50, y: 10 };
  const pointA = { x: 40, y: 40 };
  const va1 = { x: sella.x - nasion.x, y: sella.y - nasion.y };
  const va2 = { x: pointA.x - nasion.x, y: pointA.y - nasion.y };
  const dotA = va1.x * va2.x + va1.y * va2.y;
  const magA1 = Math.sqrt(va1.x * va1.x + va1.y * va1.y);
  const magA2 = Math.sqrt(va2.x * va2.x + va2.y * va2.y);
  const expectedSna = Math.round((Math.acos(dotA / (magA1 * magA2)) * 180 / Math.PI) * 10) / 10;
  const actualSna = calculateVertexAngle(nasion, sella, pointA);
  assertEqual(actualSna, expectedSna, `Vertex Angle SNA matches ground truth (${expectedSna}°)`);

  // -----------------------------------------------------------------
  // 2. SIGNED PROFILE DISTANCE AUDIT (Holdaway / Ricketts / McNamara)
  // -----------------------------------------------------------------
  console.log('\n--- 2. Signed Profile Distance Vector Verification ---');
  // Vertical reference line: (50, 0) to (50, 100) (facing right)
  const lineP1 = { x: 50, y: 0 };
  const lineP2 = { x: 50, y: 100 };
  const lineEq = calculateLineEquation(lineP1, lineP2);

  // Protrusive point anterior to line (x = 70)
  const protrusivePt = { x: 70, y: 50 };
  const protDist = calculateSignedPerpendicularDistance(protrusivePt, lineEq, true);
  assertEqual(protDist > 0, true, 'Anterior point produces positive signed distance');
  assertEqual(Math.round(protDist), 20, 'Anterior point perpendicular distance = +20px');

  // Retrusive point posterior to line (x = 30)
  const retrusivePt = { x: 30, y: 50 };
  const retroDist = calculateSignedPerpendicularDistance(retrusivePt, lineEq, true);
  assertEqual(retroDist < 0, true, 'Posterior point produces negative signed distance');
  assertEqual(Math.round(retroDist), -20, 'Posterior point perpendicular distance = -20px');

  // -----------------------------------------------------------------
  // 3. MODEL ANALYSIS MATHEMATICAL INVARIANTS
  // -----------------------------------------------------------------
  console.log('\n--- 3. Model Analysis Mathematical Verification ---');
  // Standard tooth width dataset
  const tw: Record<string, number | ''> = {
    '16': 10.0, '15': 7.0, '14': 7.0, '13': 8.0, '12': 7.0, '11': 8.5,
    '21': 8.5, '22': 7.0, '23': 8.0, '24': 7.0, '25': 7.0, '26': 10.0,
    '46': 10.5, '45': 7.0, '44': 7.0, '43': 7.0, '42': 6.0, '41': 5.5,
    '31': 5.5, '32': 6.0, '33': 7.0, '34': 7.0, '35': 7.0, '36': 10.5,
  };

  // Bolton ground truth:
  // Max 6 = 8 + 7 + 8.5 + 8.5 + 7 + 8 = 47.0 mm
  // Mand 6 = 7 + 6 + 5.5 + 5.5 + 6 + 7 = 37.0 mm
  // Anterior ratio = (37.0 / 47.0) * 100 = 78.723%
  const bolton = calculateBolton(tw);
  const expectedAnteriorRatio = (37.0 / 47.0) * 100;
  assertEqual(bolton.anteriorRatio !== null && Math.abs(bolton.anteriorRatio - expectedAnteriorRatio) < 0.01, true, 'Bolton Anterior Ratio matches independent calculation (78.72%)');

  // Carey ground truth:
  // Mandibular 10 teeth (35 to 45) = 7+7+7+6+5.5+5.5+6+7+7+7 = 65.0 mm
  const mand10Sum = sumCareyMandibularToothMaterial(tw);
  assertEqual(mand10Sum, 65.0, 'Carey Mandibular 10 Teeth sum = 65.0 mm');
  const careyResult = calculateCarey(tw, 60.0);
  assertEqual(careyResult.discrepancy, -5.0, 'Carey Discrepancy (60 - 65) = -5.0 mm');

  // Nance ground truth:
  // Maxillary 10 teeth (15 to 25) = 7+7+8+7+8.5+8.5+7+8+7+7 = 75.0 mm
  const max10Sum = sumMaxillaryArchToothMaterial(tw);
  assertEqual(max10Sum, 75.0, 'Nance Maxillary 10 Teeth sum = 75.0 mm');
  const nanceResult = calculateNanceMaxillary(tw, 78.0);
  assertEqual(nanceResult.discrepancy, 3.0, 'Nance Discrepancy (78 - 75) = +3.0 mm');

  // Pont's Index ground truth:
  // Sum of incisors (12+11+21+22) = 7.0 + 8.5 + 8.5 + 7.0 = 31.0 mm
  // Expected MPV = (31.0 / 80) * 100 = 38.75 mm
  // Expected MMV = (31.0 / 64) * 100 = 48.4375 mm
  const ponts = calculatePonts(tw, 35.0, 45.0);
  assertEqual(ponts.calculatedMPV, 38.75, 'Ponts Expected MPV = 38.75 mm');
  assertEqual(ponts.calculatedMMV, 48.4375, 'Ponts Expected MMV = 48.44 mm');
  assertEqual(ponts.premolarExpansionNeeded, 3.75, 'Ponts Premolar Expansion = 3.75 mm');
  assertEqual(ponts.molarExpansionNeeded, 3.4375, 'Ponts Molar Expansion = 3.44 mm');

  // Tanaka-Johnston ground truth:
  // Lower 4 incisors (31+32+41+42) = 5.5 + 6.0 + 5.5 + 6.0 = 23.0 mm
  // Half sum = 11.5 mm
  // Upper 3-4-5 space / quad = 11.5 + 10.5 = 22.0 mm
  // Lower 3-4-5 space / quad = 11.5 + 10.0 = 21.5 mm
  const tanakaSum = sumMandibular4Incisors(tw);
  assertEqual(tanakaSum, 23.0, 'Tanaka-Johnston Lower 4 incisors sum = 23.0 mm');
  const tanaka = calculateTanakaJohnston(tw);
  assertEqual(tanaka.predictedMaxillaryCpmPerQuadrant, 22.0, 'Tanaka-Johnston Upper 3-4-5 Space / Quad = 22.0 mm');
  assertEqual(tanaka.predictedMandibularCpmPerQuadrant, 21.5, 'Tanaka-Johnston Lower 3-4-5 Space / Quad = 21.5 mm');

  // -----------------------------------------------------------------
  // 4. DENTAL VTO ZERO FALLBACK INTEGRITY AUDIT
  // -----------------------------------------------------------------
  console.log('\n--- 4. Dental VTO Zero Fallback Integrity Verification ---');
  // When unrecorded/empty, VTO should not invent 4.0mm or 102 deg
  const emptyCurr: any = {
    molarRelationRight: 'Class I',
    molarRelationLeft: 'Class I',
    canineRelationRight: 'Class I',
    canineRelationLeft: 'Class I',
    overjetMm: '',
    overbiteMm: '',
    upperMidlineDevMm: '',
    lowerMidlineDevMm: '',
    curveOfSpeeMm: '',
    biteStatus: 'Normal',
    upperCrowdingMm: '',
    upperSpacingMm: '',
    lowerCrowdingMm: '',
    lowerSpacingMm: '',
    u1SnDeg: '',
    u1NaDeg: '',
    u1NaMm: '',
    impaDeg: '',
    l1NbDeg: '',
    l1NbMm: '',
  };
  const emptyTarget: any = {
    molarRelation: 'Class I',
    canineRelation: 'Class I',
    overjetMm: '',
    overbiteMm: '',
    upperMidlineDevMm: '',
    lowerMidlineDevMm: '',
    u1SnDeg: '',
    u1NaDeg: '',
    u1NaMm: '',
    impaDeg: '',
    l1NbDeg: '',
    l1NbMm: '',
  };

  const emptyDiffs = calculateIncisorDifferences(emptyCurr, emptyTarget);
  assertEqual(emptyDiffs.deltaU1NaMm, 0, 'Unrecorded U1-NA yields 0 delta (no fabricated 4.0mm fallback)');
  assertEqual(emptyDiffs.deltaImpaDeg, 0, 'Unrecorded IMPA yields 0 delta (no fabricated 95° fallback)');
  assertEqual(emptyDiffs.u1Direction, 'Maintain', 'Unrecorded incisor yields Maintain direction (not forced Retraction)');

  const emptyBudget = calculateSpaceBudget(emptyCurr, emptyTarget);
  assertEqual(emptyBudget.maxillary.required.totalRequiredMm, 0, 'Unrecorded parameters yield 0 required space (no fabricated crowding)');
  assertEqual(emptyBudget.maxillary.available.totalAvailableMm, 0, 'Unrecorded extractions yield 0 available space (no fabricated 14mm)');

  console.log(`\n======================================================`);
  console.log(`  RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runIndependentReferenceAudit();
