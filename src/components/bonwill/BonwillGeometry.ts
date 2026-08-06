import { Point2D, BonwillTemplateData, ToothWidthsAnterior, ArchJawType } from '../../types';
import { sumAnterior6FromFdi } from '../../lib/calculations';

export interface HawleyMetricsSummary {
  sumOfAnteriors: number;         // mm
  bracketAllowance: number;       // mm
  correctedSum: number;          // mm
  anteriorRadius: number;        // r (mm)
  rayDivergenceAngle: number;    // 42.0 degrees
  intercanineSpan: number;       // r * sqrt(3) (mm)
  interpremolar1Span: number;    // mm
  interpremolar2Span: number;    // mm
  intermolar1Span: number;       // mm
  intermolar2Span: number;       // mm
  canineDepth: number;          // mm
  molar1Depth: number;           // mm
  archLength: number;            // mm
  archPerimeter: number;         // mm
}

export interface HawleyLandmarkPoint {
  key: string;
  label: string;
  point: Point2D;
  isRight: boolean;
  isLeft: boolean;
  isCenter?: boolean;
}

export interface CalculatedHawleyGeometry {
  r: number; // Anterior radius
  correctedSum: number;
  
  // Key Reference Points
  pointA: Point2D; // Apex (0, 0)
  pointB: Point2D; // Inner Circle Center (0, -r)
  
  canineLeft: Point2D; // C
  canineRight: Point2D; // C'
  
  pointOLeft: Point2D; // Point O on Left Ray (intersection with 2r outer circle)
  pointORight: Point2D; // Point O on Right Ray
  
  premolar1Left: Point2D;
  premolar1Right: Point2D;
  
  premolar2Left: Point2D;
  premolar2Right: Point2D;
  
  molar1Left: Point2D;
  molar1Right: Point2D;
  
  molar2Left: Point2D;
  molar2Right: Point2D;

  // Key landmark list for rendering labels
  landmarkList: HawleyLandmarkPoint[];

  // Vector Path Segments for Rendering
  anteriorArcPoints: Point2D[]; // 120-degree arc from C to A to C'
  leftRayPoints: Point2D[];     // Ray vector from C through E/O
  rightRayPoints: Point2D[];    // Ray vector from C' through E'/O
  innerCirclePoints: Point2D[]; // Full inner circle (r, B)
  outerCirclePoints: Point2D[]; // Full outer circle (2r, B)
  fullArchPath: Point2D[];      // Continuous arch path

  // Summary Metrics
  metrics: HawleyMetricsSummary;

  // Bounding box
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const DEFAULT_TOOTH_WIDTHS: ToothWidthsAnterior = {
  lr3: 7.5,
  lr2: 6.5,
  lr1: 7.0,
  ll1: 7.0,
  ll2: 6.5,
  ll3: 7.5,
};

const HAWLEY_FDI_MAP: Record<ArchJawType, Record<keyof ToothWidthsAnterior, string>> = {
  Maxillary: { lr3: '13', lr2: '12', lr1: '11', ll1: '21', ll2: '22', ll3: '23' },
  Mandibular: { lr3: '43', lr2: '42', lr1: '41', ll1: '31', ll2: '32', ll3: '33' },
};

function readFdiWidth(toothWidths: Record<string, number | ''>, tooth: string): number {
  const val = toothWidths[tooth];
  return typeof val === 'number' && !isNaN(val) ? val : 0;
}

/** Derive Hawley Method B inputs from Tab 6 FDI tooth width grid. */
export function hawleyInputsFromFdi(
  toothWidths: Record<string, number | ''> | undefined,
  archType: ArchJawType
): { sumOfAnteriors: number; toothWidthsAnterior: ToothWidthsAnterior } | null {
  if (!toothWidths) return null;

  const sumOfAnteriors = sumAnterior6FromFdi(toothWidths, archType);
  if (sumOfAnteriors <= 0) return null;

  const map = HAWLEY_FDI_MAP[archType === 'Mandibular' ? 'Mandibular' : 'Maxillary'];
  const toothWidthsAnterior: ToothWidthsAnterior = {
    lr3: readFdiWidth(toothWidths, map.lr3),
    lr2: readFdiWidth(toothWidths, map.lr2),
    lr1: readFdiWidth(toothWidths, map.lr1),
    ll1: readFdiWidth(toothWidths, map.ll1),
    ll2: readFdiWidth(toothWidths, map.ll2),
    ll3: readFdiWidth(toothWidths, map.ll3),
  };

  return { sumOfAnteriors, toothWidthsAnterior };
}

/**
 * Calculates Hawley's Original Method B (Sum of 6 Anteriors) Arch Geometry.
 */
export function calculateHawleyGeometry(
  inputData: Partial<BonwillTemplateData>
): CalculatedHawleyGeometry {
  const toothWidths = inputData.toothWidthsAnterior || DEFAULT_TOOTH_WIDTHS;
  const computedToothSum =
    toothWidths.lr3 + toothWidths.lr2 + toothWidths.lr1 +
    toothWidths.ll1 + toothWidths.ll2 + toothWidths.ll3;

  const sumOfAnteriors = typeof inputData.sumOfAnteriors === 'number' && inputData.sumOfAnteriors > 0
    ? inputData.sumOfAnteriors
    : computedToothSum;

  const bracketAllowance = typeof inputData.bracketAllowance === 'number' ? inputData.bracketAllowance : 3.0;

  // Step A: Calculate Radius (Method B)
  const correctedSum = sumOfAnteriors + bracketAllowance;
  const r = correctedSum / Math.PI;

  // Step B: Define Coordinate System & Anterior Arc
  // Point A (Incisal Edge Apex): (0, 0)
  const pointA: Point2D = { x: 0.0, y: 0.0 };

  // Point B (Center of Inner Circle): (0, -r)
  const pointB: Point2D = { x: 0.0, y: -r };

  // Canine Intersection Points
  // Left Canine (C): x = -r * (sqrt(3) / 2), y = -r / 2
  const canineLeft: Point2D = {
    x: -r * (Math.sqrt(3) / 2.0),
    y: -r / 2.0,
  };

  // Right Canine (C'): x = r * (sqrt(3) / 2), y = -r / 2
  const canineRight: Point2D = {
    x: r * (Math.sqrt(3) / 2.0),
    y: -r / 2.0,
  };

  const intercanineSpan = r * Math.sqrt(3);

  // Generate 120-degree Anterior Arc centered at Point B (0, -r) sweeping from C to A to C'
  const anteriorArcPoints: Point2D[] = [];
  const arcSamples = 50;
  // Angle for C is 150 deg (5*PI/6), angle for A is 90 deg (PI/2), angle for C' is 30 deg (PI/6)
  const startAngle = (5.0 * Math.PI) / 6.0;
  const endAngle = Math.PI / 6.0;

  for (let i = 0; i <= arcSamples; i++) {
    const angle = startAngle + (i / arcSamples) * (endAngle - startAngle);
    anteriorArcPoints.push({
      x: pointB.x + r * Math.cos(angle),
      y: pointB.y + r * Math.sin(angle),
    });
  }

  // Step C: Construct Posterior Rays (42° Divergence)
  // Rays angle: 21 degrees on each side from vertical downward Y axis
  const rayAngleRad = (21.0 * Math.PI) / 180.0;
  
  // Left Ray Direction Vector (extending down and left): (-sin(21°), -cos(21°))
  const leftRayDir: Point2D = {
    x: -Math.sin(rayAngleRad),
    y: -Math.cos(rayAngleRad),
  };

  // Right Ray Direction Vector (extending down and right): (sin(21°), -cos(21°))
  const rightRayDir: Point2D = {
    x: Math.sin(rayAngleRad),
    y: -Math.cos(rayAngleRad),
  };

  // Distance t_O along ray from Canine (C) to Point O (intersection with 2r Outer Circle centered at B)
  // Quadratic equation: t^2 - 2*r*sin(9°)*t - 3*r^2 = 0
  const sin9 = Math.sin((9.0 * Math.PI) / 180.0);
  const t_O = r * ((2.0 * sin9 + Math.sqrt(4.0 * sin9 * sin9 + 12.0)) / 2.0);

  const pointOLeft: Point2D = {
    x: canineLeft.x + t_O * leftRayDir.x,
    y: canineLeft.y + t_O * leftRayDir.y,
  };

  const pointORight: Point2D = {
    x: canineRight.x + t_O * rightRayDir.x,
    y: canineRight.y + t_O * rightRayDir.y,
  };

  // Step D: Plot Premolar & Molar Landmarks
  // Measured relative to Point O along the ray:
  // Canine: at C / C'
  // Premolar 1: 6.5 mm inside from O
  const t_PM1 = t_O - 6.5;
  const premolar1Left: Point2D = {
    x: canineLeft.x + t_PM1 * leftRayDir.x,
    y: canineLeft.y + t_PM1 * leftRayDir.y,
  };
  const premolar1Right: Point2D = {
    x: canineRight.x + t_PM1 * rightRayDir.x,
    y: canineRight.y + t_PM1 * rightRayDir.y,
  };

  // Premolar 2: 4.0 mm outside from O
  const t_PM2 = t_O + 4.0;
  const premolar2Left: Point2D = {
    x: canineLeft.x + t_PM2 * leftRayDir.x,
    y: canineLeft.y + t_PM2 * leftRayDir.y,
  };
  const premolar2Right: Point2D = {
    x: canineRight.x + t_PM2 * rightRayDir.x,
    y: canineRight.y + t_PM2 * rightRayDir.y,
  };

  // Molar 1: 1.0 mm outside from O
  const t_M1 = t_O + 1.0;
  const molar1Left: Point2D = {
    x: canineLeft.x + t_M1 * leftRayDir.x,
    y: canineLeft.y + t_M1 * leftRayDir.y,
  };
  const molar1Right: Point2D = {
    x: canineRight.x + t_M1 * rightRayDir.x,
    y: canineRight.y + t_M1 * rightRayDir.y,
  };

  // Molar 2: 4.5 mm inside from O
  const t_M2 = t_O - 4.5;
  const molar2Left: Point2D = {
    x: canineLeft.x + t_M2 * leftRayDir.x,
    y: canineLeft.y + t_M2 * leftRayDir.y,
  };
  const molar2Right: Point2D = {
    x: canineRight.x + t_M2 * rightRayDir.x,
    y: canineRight.y + t_M2 * rightRayDir.y,
  };

  // Generate Ray Lines for Canvas rendering
  const maxRayDist = t_O + 15.0; // extend past Point O
  const leftRayPoints: Point2D[] = [
    canineLeft,
    { x: canineLeft.x + maxRayDist * leftRayDir.x, y: canineLeft.y + maxRayDist * leftRayDir.y },
  ];

  const rightRayPoints: Point2D[] = [
    canineRight,
    { x: canineRight.x + maxRayDist * rightRayDir.x, y: canineRight.y + maxRayDist * rightRayDir.y },
  ];

  // Circle Construction Points
  const innerCirclePoints: Point2D[] = [];
  const outerCirclePoints: Point2D[] = [];
  for (let i = 0; i <= 72; i++) {
    const ang = (i / 72) * 2 * Math.PI;
    innerCirclePoints.push({
      x: pointB.x + r * Math.cos(ang),
      y: pointB.y + r * Math.sin(ang),
    });
    outerCirclePoints.push({
      x: pointB.x + 2 * r * Math.cos(ang),
      y: pointB.y + 2 * r * Math.sin(ang),
    });
  }

  // Continuous Full Arch Path (Left Ray End -> Left Canine -> Anterior Arc -> Right Canine -> Right Ray End)
  const fullArchPath: Point2D[] = [
    premolar2Left,
    molar1Left,
    pointOLeft,
    molar2Left,
    premolar1Left,
    canineLeft,
    ...anteriorArcPoints.slice(1, -1),
    canineRight,
    premolar1Right,
    molar2Right,
    pointORight,
    molar1Right,
    premolar2Right,
  ];

  // Span Measurements
  const interpremolar1Span = Math.abs(premolar1Right.x - premolar1Left.x);
  const interpremolar2Span = Math.abs(premolar2Right.x - premolar2Left.x);
  const intermolar1Span = Math.abs(molar1Right.x - molar1Left.x);
  const intermolar2Span = Math.abs(molar2Right.x - molar2Left.x);

  const canineDepth = Math.abs(canineLeft.y);
  const molar1Depth = Math.abs(molar1Left.y);
  const archLength = Math.abs(premolar2Left.y);

  // Compute Arch Perimeter (Arc length + ray lengths)
  const arcLengthMm = r * ((2.0 * Math.PI) / 3.0); // 120 deg = 2/3 PI
  const rayLengthMm = t_PM2;
  const archPerimeter = arcLengthMm + 2.0 * rayLengthMm;

  // Landmark List for UI Labels
  const landmarkList: HawleyLandmarkPoint[] = [
    { key: 'pointA', label: 'Incisal Edge Apex (A)', point: pointA, isRight: false, isLeft: false, isCenter: true },
    { key: 'pointB', label: 'Inner Circle Center (B)', point: pointB, isRight: false, isLeft: false, isCenter: true },
    { key: 'canineLeft', label: 'L Canine (C)', point: canineLeft, isRight: false, isLeft: true },
    { key: 'canineRight', label: 'R Canine (C\')', point: canineRight, isRight: true, isLeft: false },
    { key: 'premolar1Left', label: 'L Premolar 1 (6.5mm in O)', point: premolar1Left, isRight: false, isLeft: true },
    { key: 'premolar1Right', label: 'R Premolar 1 (6.5mm in O)', point: premolar1Right, isRight: true, isLeft: false },
    { key: 'molar2Left', label: 'L Molar 2 (4.5mm in O)', point: molar2Left, isRight: false, isLeft: true },
    { key: 'molar2Right', label: 'R Molar 2 (4.5mm in O)', point: molar2Right, isRight: true, isLeft: false },
    { key: 'pointOLeft', label: 'L Point O (2r Arc Intersect)', point: pointOLeft, isRight: false, isLeft: true },
    { key: 'pointORight', label: 'R Point O (2r Arc Intersect)', point: pointORight, isRight: true, isLeft: false },
    { key: 'molar1Left', label: 'L Molar 1 (1.0mm out O)', point: molar1Left, isRight: false, isLeft: true },
    { key: 'molar1Right', label: 'R Molar 1 (1.0mm out O)', point: molar1Right, isRight: true, isLeft: false },
    { key: 'premolar2Left', label: 'L Premolar 2 (4.0mm out O)', point: premolar2Left, isRight: false, isLeft: true },
    { key: 'premolar2Right', label: 'R Premolar 2 (4.0mm out O)', point: premolar2Right, isRight: true, isLeft: false },
  ];

  // Bounding Box
  let minX = -2 * r - 10;
  let maxX = 2 * r + 10;
  let minY = -3 * r - 10;
  let maxY = 10;

  return {
    r,
    correctedSum,
    pointA,
    pointB,
    canineLeft,
    canineRight,
    pointOLeft,
    pointORight,
    premolar1Left,
    premolar1Right,
    premolar2Left,
    premolar2Right,
    molar1Left,
    molar1Right,
    molar2Left,
    molar2Right,
    landmarkList,
    anteriorArcPoints,
    leftRayPoints,
    rightRayPoints,
    innerCirclePoints,
    outerCirclePoints,
    fullArchPath,
    metrics: {
      sumOfAnteriors,
      bracketAllowance,
      correctedSum,
      anteriorRadius: r,
      rayDivergenceAngle: 42.0,
      intercanineSpan,
      interpremolar1Span,
      interpremolar2Span,
      intermolar1Span,
      intermolar2Span,
      canineDepth,
      molar1Depth,
      archLength,
      archPerimeter,
    },
    minX,
    maxX,
    minY,
    maxY,
  };
}

/**
 * Backwards compatibility helper
 */
export function calculateLandmarkGeometry(input: any): any {
  return calculateHawleyGeometry(input);
}
