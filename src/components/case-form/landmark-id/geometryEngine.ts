import { CephPlaneResult, CephAngleResult, CephLinearResult, CephGeometryEngineData } from '../../../types';

export interface Point2D {
  x: number;
  y: number;
}

// Line Equation in General Form: Ax + By + C = 0
export interface LineEquation {
  a: number;
  b: number;
  c: number;
}

/**
 * Calculates line equation Ax + By + C = 0 passing through two points.
 */
export function calculateLineEquation(p1: Point2D, p2: Point2D): LineEquation {
  const a = p2.y - p1.y;
  const b = -(p2.x - p1.x);
  const c = (p2.x - p1.x) * p1.y - (p2.y - p1.y) * p1.x;
  return { a, b, c };
}

/**
 * Calculates line length in pixels.
 */
export function calculateDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates line angle relative to horizontal in degrees [0, 180).
 */
export function calculateLineAngle(p1: Point2D, p2: Point2D): number {
  const angleRad = Math.atan2(p2.y - p1.y, p2.x - p1.x);
  let angleDeg = (angleRad * 180) / Math.PI;
  if (angleDeg < 0) angleDeg += 360;
  return angleDeg % 180;
}

/**
 * Calculates acute angle (0° - 90°) between two vectors/lines defined by pairs of points.
 * Used when the acute intersection angle between planes is specifically needed.
 */
export function calculateAcuteLineAngle(
  p1Line1: Point2D,
  p2Line1: Point2D,
  p1Line2: Point2D,
  p2Line2: Point2D
): number {
  const v1 = { x: p2Line1.x - p1Line1.x, y: p2Line1.y - p1Line1.y };
  const v2 = { x: p2Line2.x - p1Line2.x, y: p2Line2.y - p1Line2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  let angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;

  if (angleDeg > 90) angleDeg = 180 - angleDeg;
  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculates anatomical angle (0° - 180°) between two vectors defined by pairs of points.
 * Preserves true obtuse angles (e.g. U1-SN ~102°, Interincisal ~131°, IMPA ~90-95°).
 */
export function calculateAnatomicalAngle(
  p1Line1: Point2D,
  p2Line1: Point2D,
  p1Line2: Point2D,
  p2Line2: Point2D
): number {
  const v1 = { x: p2Line1.x - p1Line1.x, y: p2Line1.y - p1Line1.y };
  const v2 = { x: p2Line2.x - p1Line2.x, y: p2Line2.y - p1Line2.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  const angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;
  return Math.round(angleDeg * 10) / 10;
}

/**
 * Default alias for line angle calculation.
 * Preserves 0° - 180° range for cephalometric anatomical validity.
 */
export function calculateAngleBetweenLines(
  p1Line1: Point2D,
  p2Line1: Point2D,
  p1Line2: Point2D,
  p2Line2: Point2D
): number {
  return calculateAnatomicalAngle(p1Line1, p2Line1, p1Line2, p2Line2);
}

/**
 * Calculates angle at vertex V formed by points A-V-B (e.g. SNA, SNB).
 */
export function calculateVertexAngle(vertex: Point2D, pointA: Point2D, pointB: Point2D): number {
  const v1 = { x: pointA.x - vertex.x, y: pointA.y - vertex.y };
  const v2 = { x: pointB.x - vertex.x, y: pointB.y - vertex.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

  if (mag1 === 0 || mag2 === 0) return 0;

  let cosTheta = dot / (mag1 * mag2);
  cosTheta = Math.max(-1, Math.min(1, cosTheta));
  const angleDeg = (Math.acos(cosTheta) * 180) / Math.PI;
  return Math.round(angleDeg * 10) / 10;
}

/**
 * Calculates mathematical intersection of two lines L1: A1x + B1y + C1 = 0 and L2: A2x + B2y + C2 = 0.
 */
export function calculateLineIntersection(eq1: LineEquation, eq2: LineEquation): Point2D | null {
  const det = eq1.a * eq2.b - eq2.a * eq1.b;
  if (Math.abs(det) < 1e-6) return null; // Parallel lines

  const x = (eq1.b * eq2.c - eq2.b * eq1.c) / det;
  const y = (eq2.a * eq1.c - eq1.a * eq2.c) / det;
  return { x: Math.round(x), y: Math.round(y) };
}

/**
 * Calculates absolute perpendicular distance from Point (x0, y0) to Line Ax + By + C = 0 in pixels.
 */
export function calculatePerpendicularDistance(point: Point2D, line: LineEquation): number {
  const numerator = Math.abs(line.a * point.x + line.b * point.y + line.c);
  const denominator = Math.sqrt(line.a * line.a + line.b * line.b);
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Calculates signed perpendicular distance from Point (x0, y0) to Line Ax + By + C = 0 in pixels.
 * Sign convention:
 * - Positive (+) indicates the point is anterior (protrusive) relative to the profile line.
 * - Negative (-) indicates the point is posterior (retrusive) relative to the profile line.
 * - Zero (0) indicates the point lies precisely on the line.
 */
export function calculateSignedPerpendicularDistance(
  point: Point2D,
  line: LineEquation,
  isFacingRight: boolean = true
): number {
  const denominator = Math.sqrt(line.a * line.a + line.b * line.b);
  if (denominator === 0) return 0;

  let signedVal = (line.a * point.x + line.b * point.y + line.c) / denominator;

  if (line.a !== 0) {
    signedVal = line.a > 0 ? signedVal : -signedVal;
    if (!isFacingRight) signedVal = -signedVal;
  }

  return signedVal;
}

/**
 * Main Geometry Engine Calculator:
 * Takes landmark dictionary & scale, automatically generates planes, angles, and linears mathematically.
 */
export function runGeometryEngine(
  landmarks: Record<string, Point2D>,
  scalePixelsPerMm: number = 10
): CephGeometryEngineData {
  const pxToMm = scalePixelsPerMm > 0 ? scalePixelsPerMm : 10;

  const planes: CephPlaneResult[] = [];
  const angles: CephAngleResult[] = [];
  const linears: CephLinearResult[] = [];

  // Helper to extract point safely
  const getPt = (id: string): Point2D | null => {
    return landmarks[id] ? { x: landmarks[id].x, y: landmarks[id].y } : null;
  };

  // Define plane configurations
  const planeDefs = [
    {
      id: 'sn_plane',
      name: 'SN Plane',
      abbreviation: 'SN',
      p1Id: 'sella',
      p2Id: 'nasion',
      color: '#3B82F6', // Blue
    },
    {
      id: 'frankfort_plane',
      name: 'Frankfort Horizontal Plane',
      abbreviation: 'FH',
      p1Id: 'porion',
      p2Id: 'orbitale',
      color: '#10B981', // Emerald
    },
    {
      id: 'palatal_plane',
      name: 'Palatal Plane',
      abbreviation: 'PP',
      p1Id: 'ans',
      p2Id: 'pns',
      color: '#8B5CF6', // Purple
    },
    {
      id: 'occlusal_plane',
      name: 'Occlusal Plane',
      abbreviation: 'OP',
      p1Id: 'occ_anterior',
      p2Id: 'occ_posterior',
      color: '#F59E0B', // Amber
    },
    {
      id: 'mandibular_plane',
      name: 'Mandibular Plane',
      abbreviation: 'MP',
      p1Id: 'gonion',
      p2Id: 'menton',
      color: '#EF4444', // Red
    },
    {
      id: 'facial_plane',
      name: 'Facial Plane',
      abbreviation: 'FP',
      p1Id: 'nasion',
      p2Id: 'pogonion',
      color: '#EC4899', // Pink
    },
    {
      id: 'facial_axis',
      name: 'Facial Axis',
      abbreviation: 'FA',
      p1Id: 'pt_point',
      p2Id: 'gnathion',
      color: '#06B6D4', // Cyan
    },
    {
      id: 'y_axis',
      name: 'Y-Axis',
      abbreviation: 'Y-Ax',
      p1Id: 'sella',
      p2Id: 'gnathion',
      color: '#6366F1', // Indigo
    },
    {
      id: 'na_line',
      name: 'NA Line',
      abbreviation: 'NA',
      p1Id: 'nasion',
      p2Id: 'point_a',
      color: '#14B8A6', // Teal
    },
    {
      id: 'nb_line',
      name: 'NB Line',
      abbreviation: 'NB',
      p1Id: 'nasion',
      p2Id: 'point_b',
      color: '#F97316', // Orange
    },
    {
      id: 'basion_nasion',
      name: 'Basion-Nasion Line',
      abbreviation: 'BaN',
      p1Id: 'basion',
      p2Id: 'nasion',
      color: '#64748B', // Slate
    },
    {
      id: 'ricketts_eline',
      name: 'Ricketts E-Line',
      abbreviation: 'E-Line',
      p1Id: 'pronasale',
      p2Id: 'soft_pogonion',
      color: '#D946EF', // Fuchsia
    },
    {
      id: 'holdaway_hline',
      name: 'Holdaway H-Line',
      abbreviation: 'H-Line',
      p1Id: 'soft_pogonion',
      p2Id: 'labiale_superius',
      color: '#A855F7', // Purple
    },
    {
      id: 'u1_axis',
      name: 'Upper Incisor Axis',
      abbreviation: 'U1-Ax',
      p1Id: 'u1_apex',
      p2Id: 'u1_tip',
      color: '#EAB308', // Yellow
    },
    {
      id: 'l1_axis',
      name: 'Lower Incisor Axis',
      abbreviation: 'L1-Ax',
      p1Id: 'l1_apex',
      p2Id: 'l1_tip',
      color: '#84CC16', // Lime
    },
    {
      id: 'ramus_line',
      name: 'Mandibular Ramus Line',
      abbreviation: 'Ramus',
      p1Id: 'condylon',
      p2Id: 'gonion',
      color: '#9CA3AF', // Gray
    },
  ];

  // 1. Calculate All Planes
  planeDefs.forEach((def) => {
    let p1 = getPt(def.p1Id);
    let p2 = getPt(def.p2Id);

    // Fallbacks if secondary landmarks used
    if (def.id === 'occlusal_plane' && (!p1 || !p2)) {
      const u6 = getPt('u6_mesial');
      const l6 = getPt('l6_mesial');
      const u1 = getPt('u1_tip');
      const l1 = getPt('l1_tip');
      if (u6 && l6 && u1 && l1) {
        p2 = { x: Math.round((u6.x + l6.x) / 2), y: Math.round((u6.y + l6.y) / 2) };
        p1 = { x: Math.round((u1.x + l1.x) / 2), y: Math.round((u1.y + l1.y) / 2) };
      }
    }

    if (def.id === 'mandibular_plane' && !p2) {
      p2 = getPt('gnathion');
    }

    if (p1 && p2) {
      const lengthPx = calculateDistance(p1, p2);
      const lengthMm = Math.round((lengthPx / pxToMm) * 10) / 10;
      const angleDegrees = Math.round(calculateLineAngle(p1, p2) * 10) / 10;
      const equation = calculateLineEquation(p1, p2);

      planes.push({
        id: def.id,
        name: def.name,
        abbreviation: def.abbreviation,
        startLandmarkId: def.p1Id,
        endLandmarkId: def.p2Id,
        startPoint: p1,
        endPoint: p2,
        angleDegrees,
        lengthPx: Math.round(lengthPx),
        lengthMm,
        equation,
        color: def.color,
      });
    }
  });

  // 2. Calculate Cephalometric Angles
  const sella = getPt('sella');
  const nasion = getPt('nasion');
  const pointA = getPt('point_a');
  const pointB = getPt('point_b');
  const pogonion = getPt('pogonion');
  const gnathion = getPt('gnathion');
  const menton = getPt('menton');
  const gonion = getPt('gonion');
  const porion = getPt('porion');
  const orbitale = getPt('orbitale');
  const ans = getPt('ans');
  const pns = getPt('pns');
  const u1Apex = getPt('u1_apex');
  const u1Tip = getPt('u1_tip');
  const l1Apex = getPt('l1_apex');
  const l1Tip = getPt('l1_tip');
  const ptPoint = getPt('pt_point');
  const basion = getPt('basion');

  // SNA
  if (nasion && sella && pointA) {
    const val = calculateVertexAngle(nasion, sella, pointA);
    angles.push({
      id: 'sna',
      name: 'SNA Angle',
      valueDegrees: val,
      normalRange: '82° ± 2°',
      interpretation:
        val > 84
          ? 'Maxillary Prognathism (Class II tendency)'
          : val < 80
          ? 'Maxillary Retrognathism (Class III tendency)'
          : 'Normal Maxillary Position',
    });
  }

  // SNB
  if (nasion && sella && pointB) {
    const val = calculateVertexAngle(nasion, sella, pointB);
    angles.push({
      id: 'snb',
      name: 'SNB Angle',
      valueDegrees: val,
      normalRange: '80° ± 2°',
      interpretation:
        val > 82
          ? 'Mandibular Prognathism (Class III)'
          : val < 78
          ? 'Mandibular Retrognathism (Class II)'
          : 'Normal Mandibular Position',
    });
  }

  // ANB
  const snaObj = angles.find((a) => a.id === 'sna');
  const snbObj = angles.find((a) => a.id === 'snb');
  if (snaObj && snbObj) {
    const val = Math.round((snaObj.valueDegrees - snbObj.valueDegrees) * 10) / 10;
    angles.push({
      id: 'anb',
      name: 'ANB Angle',
      valueDegrees: val,
      normalRange: '2° ± 2°',
      interpretation:
        val > 4
          ? 'Skeletal Class II Malocclusion'
          : val < 0
          ? 'Skeletal Class III Malocclusion'
          : 'Skeletal Class I Relationship',
    });
  }

  // FMA (FH to MP)
  if (porion && orbitale && gonion && (menton || gnathion)) {
    const mpEnd = menton || gnathion!;
    const val = calculateAcuteLineAngle(porion, orbitale, gonion, mpEnd);
    angles.push({
      id: 'fma',
      name: 'FMA (FH to Mandibular Plane)',
      valueDegrees: val,
      normalRange: '25° ± 3°',
      interpretation:
        val > 28
          ? 'High Angle / Hyperdivergent Growth Pattern'
          : val < 22
          ? 'Low Angle / Hypodivergent Growth Pattern'
          : 'Normodivergent Facial Growth Pattern',
    });
  }

  // SN-MP
  if (sella && nasion && gonion && (menton || gnathion)) {
    const mpEnd = menton || gnathion!;
    const val = calculateAcuteLineAngle(sella, nasion, gonion, mpEnd);
    angles.push({
      id: 'sn_mp',
      name: 'SN-MP Angle',
      valueDegrees: val,
      normalRange: '32° ± 3°',
      interpretation:
        val > 35
          ? 'Vertical Hyperdivergent Jaw Growth'
          : val < 29
          ? 'Horizontal Hypodivergent Jaw Growth'
          : 'Normal Vertical Jaw Divergence',
    });
  }

  // PP-MP (Palatal to Mandibular Plane) - Acute line angle
  if (ans && pns && gonion && (menton || gnathion)) {
    const mpEnd = menton || gnathion!;
    const val = calculateAcuteLineAngle(ans, pns, gonion, mpEnd);
    angles.push({
      id: 'pp_mp',
      name: 'PP-MP (Palatal to Mandibular Plane)',
      valueDegrees: val,
      normalRange: '28° ± 3°',
      interpretation:
        val > 31
          ? 'Increased Intermaxillary Divergence'
          : val < 25
          ? 'Decreased Intermaxillary Divergence'
          : 'Normal Intermaxillary Angle',
    });
  }

  // Y-Axis Angle
  if (sella && gnathion && porion && orbitale) {
    const val = calculateAcuteLineAngle(sella, gnathion, porion, orbitale);
    angles.push({
      id: 'y_axis_angle',
      name: 'Y-Axis Angle (S-Gn to FH)',
      valueDegrees: val,
      normalRange: '59° ± 3°',
      interpretation:
        val > 62
          ? 'Downward & Backward Growth Direction'
          : val < 56
          ? 'Forward & Counterclockwise Growth Direction'
          : 'Normal Growth Axis',
    });
  }

  // Facial Axis Angle
  if (ptPoint && gnathion && basion && nasion) {
    const val = calculateAnatomicalAngle(ptPoint, gnathion, basion, nasion);
    angles.push({
      id: 'facial_axis_angle',
      name: 'Facial Axis Angle (Pt-Gn to Ba-N)',
      valueDegrees: val,
      normalRange: '90° ± 3°',
      interpretation:
        val > 93
          ? 'Strong Chin Projection / Brachyfacial'
          : val < 87
          ? 'Weak Chin Projection / Dolichofacial'
          : 'Mesofacial Growth Pattern',
    });
  }

  // U1 to SN
  if (u1Apex && u1Tip && sella && nasion) {
    const val = calculateAnatomicalAngle(u1Apex, u1Tip, sella, nasion);
    angles.push({
      id: 'u1_sn',
      name: 'U1 to SN Angle',
      valueDegrees: val,
      normalRange: '102° ± 3°',
      interpretation:
        val > 105
          ? 'Upper Incisor Proclination'
          : val < 99
          ? 'Upper Incisor Retroclination'
          : 'Normal Upper Incisor Inclination',
    });
  }

  // IMPA (L1 to MP)
  if (l1Apex && l1Tip && gonion && (menton || gnathion)) {
    const mpEnd = menton || gnathion!;
    const val = calculateAnatomicalAngle(l1Tip, l1Apex, gonion, mpEnd);
    angles.push({
      id: 'impa',
      name: 'IMPA (L1 to Mandibular Plane)',
      valueDegrees: val,
      normalRange: '90° ± 3°',
      interpretation:
        val > 93
          ? 'Lower Incisor Proclination'
          : val < 87
          ? 'Lower Incisor Retroclination'
          : 'Normal Lower Incisor Inclination',
    });
  }

  // Interincisal Angle
  if (u1Apex && u1Tip && l1Apex && l1Tip) {
    const val = calculateAnatomicalAngle(u1Apex, u1Tip, l1Apex, l1Tip);
    angles.push({
      id: 'interincisal',
      name: 'Interincisal Angle (U1-L1)',
      valueDegrees: val,
      normalRange: '131° ± 5°',
      interpretation:
        val < 126
          ? 'Severe Bimaxillary Proclination'
          : val > 136
          ? 'Bimaxillary Retroclination'
          : 'Normal Incisor Stacking',
    });
  }

  // 3. Calculate Linear Cephalometric Values (in mm)
  const condylon = getPt('condylon');
  const prn = getPt('pronasale');
  const softPog = getPt('soft_pogonion');
  const labInferius = getPt('labiale_inferius');
  const labSuperius = getPt('labiale_superius');

  // Effective Maxillary Length (Co-A)
  if (condylon && pointA) {
    const distPx = calculateDistance(condylon, pointA);
    const distMm = Math.round((distPx / pxToMm) * 10) / 10;
    linears.push({
      id: 'co_a',
      name: 'Effective Maxillary Length (Co-A)',
      valueMm: distMm,
      normalRange: '85 - 95 mm',
      interpretation: distMm > 95 ? 'Increased Maxillary Unit Length' : 'Normal Maxillary Unit Length',
    });
  }

  // Effective Mandibular Length (Co-Gn)
  if (condylon && gnathion) {
    const distPx = calculateDistance(condylon, gnathion);
    const distMm = Math.round((distPx / pxToMm) * 10) / 10;
    linears.push({
      id: 'co_gn',
      name: 'Effective Mandibular Length (Co-Gn)',
      valueMm: distMm,
      normalRange: '105 - 120 mm',
      interpretation: distMm > 120 ? 'Mandibular Hyperplasia' : 'Normal Mandibular Unit Length',
    });
  }

  // Determine lateral cephalogram facing direction (+X is anterior when facing right)
  const isFacingRight = (orbitale && porion) ? (orbitale.x > porion.x) : true;

  // Lower Lip to E-Line
  if (prn && softPog && labInferius) {
    const eLineEq = calculateLineEquation(prn, softPog);
    const distPx = calculateSignedPerpendicularDistance(labInferius, eLineEq, isFacingRight);
    const distMm = Math.round((distPx / pxToMm) * 10) / 10;
    linears.push({
      id: 'lower_lip_eline',
      name: 'Lower Lip to Ricketts E-Line',
      valueMm: distMm,
      normalRange: '0 ± 2 mm',
      interpretation: distMm > 2 ? 'Lower Lip Protrusion' : distMm < -2 ? 'Lower Lip Retrusion' : 'Balanced Lower Lip',
    });
  }

  // Upper Lip to E-Line
  if (prn && softPog && labSuperius) {
    const eLineEq = calculateLineEquation(prn, softPog);
    const distPx = calculateSignedPerpendicularDistance(labSuperius, eLineEq, isFacingRight);
    const distMm = Math.round((distPx / pxToMm) * 10) / 10;
    linears.push({
      id: 'upper_lip_eline',
      name: 'Upper Lip to Ricketts E-Line',
      valueMm: distMm,
      normalRange: '-1 ± 2 mm',
      interpretation: distMm > 1 ? 'Upper Lip Protrusion' : distMm < -3 ? 'Upper Lip Retrusion' : 'Balanced Upper Lip',
    });
  }

  return {
    planes,
    angles,
    linears,
    calculatedAt: new Date().toISOString(),
  };
}
