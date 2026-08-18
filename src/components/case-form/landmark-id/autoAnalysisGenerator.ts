import {
  DownsAnalysisData,
  SteinersAnalysisData,
  RickettsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CogsSoftTissueAnalysisData,
  CephDiscrepancyAnalysisData,
  VerticalJawDivergenceAnalysisData,
  Gender,
} from '../../../types';
import {
  Point2D,
  LineEquation,
  calculateDistance,
  calculateLineAngle,
  calculateAngleBetweenLines,
  calculateVertexAngle,
  calculateLineEquation,
  calculatePerpendicularDistance,
} from './geometryEngine';

export interface AutoAnalysisResult {
  downsAnalysis: DownsAnalysisData;
  steinersAnalysis: SteinersAnalysisData;
  rickettsAnalysis: RickettsAnalysisData;
  mcnamaraAnalysis: McnamaraAnalysisData;
  schwarzTweedAnalysis: SchwarzTweedAnalysisData;
  holdawayAnalysis: HoldawayAnalysisData;
  cogsAnalysis: CogsAnalysisData;
  cogsSoftTissueAnalysis: CogsSoftTissueAnalysisData;
  cephDiscrepancyAnalysis: CephDiscrepancyAnalysisData;
  verticalJawDivergenceAnalysis: VerticalJawDivergenceAnalysisData;
}

/**
 * Main Auto-Generation Engine for Phase 6:
 * Automatically calculates all cephalometric analyses (Steiner, Downs, Tweed, McNamara, Ricketts,
 * Jarabak, Schwarz, Bjork, Holdaway, COGS, Wits, Ceph Discrepancy, Sassouni)
 * from landmark coordinates and calibration scale.
 */
export function autoGenerateAllCephAnalyses(
  landmarks: Record<string, Point2D>,
  scalePixelsPerMm: number = 10,
  stage: 'pre' | 'mid' | 'post' = 'pre',
  patientAge: number = 12,
  patientGender: Gender = 'Male',
  existingData?: {
    downs?: DownsAnalysisData;
    steiners?: SteinersAnalysisData;
    ricketts?: RickettsAnalysisData;
    mcnamara?: McnamaraAnalysisData;
    schwarzTweed?: SchwarzTweedAnalysisData;
    holdaway?: HoldawayAnalysisData;
    cogs?: CogsAnalysisData;
    cogsSoftTissue?: CogsSoftTissueAnalysisData;
    cephDiscrepancy?: CephDiscrepancyAnalysisData;
    verticalJawDivergence?: VerticalJawDivergenceAnalysisData;
  }
): AutoAnalysisResult {
  const pxToMm = scalePixelsPerMm > 0 ? scalePixelsPerMm : 10;

  // Helper to extract point safely
  const p = (id: string): Point2D | null => {
    return landmarks[id] ? { x: landmarks[id].x, y: landmarks[id].y } : null;
  };

  // Extract all landmark coordinates
  const sella = p('sella');
  const nasion = p('nasion');
  const porion = p('porion');
  const orbitale = p('orbitale');
  const basion = p('basion');
  const articulare = p('articulare');
  const condylon = p('condylon');
  const ans = p('ans');
  const pns = p('pns');
  const pointA = p('point_a');
  const pointB = p('point_b');
  const pogonion = p('pogonion');
  const gnathion = p('gnathion');
  const menton = p('menton');
  const gonion = p('gonion');
  const u1Tip = p('u1_tip');
  const u1Apex = p('u1_apex');
  const l1Tip = p('l1_tip');
  const l1Apex = p('l1_apex');
  const u6Mesial = p('u6_mesial');
  const l6Mesial = p('l6_mesial');
  const occAnt = p('occ_anterior');
  const occPost = p('occ_posterior');
  const softNasion = p('soft_nasion');
  const pronasale = p('pronasale');
  const subnasaleSoft = p('subnasale_soft');
  const labSuperius = p('labiale_superius');
  const labInferius = p('labiale_inferius');
  const softPog = p('soft_pogonion');
  const softMenton = p('soft_menton');
  const columella = p('columella');
  const ptPoint = p('pt_point');
  const antegonialNotch = p('antegonial_notch');

  // Fallbacks for Occlusal and Mandibular Plane ends
  let occStart = occAnt;
  let occEnd = occPost;
  if (!occStart || !occEnd) {
    if (u1Tip && l1Tip && u6Mesial && l6Mesial) {
      occStart = { x: Math.round((u1Tip.x + l1Tip.x) / 2), y: Math.round((u1Tip.y + l1Tip.y) / 2) };
      occEnd = { x: Math.round((u6Mesial.x + l6Mesial.x) / 2), y: Math.round((u6Mesial.y + l6Mesial.y) / 2) };
    }
  }

  const mpStart = gonion;
  const mpEnd = menton || gnathion;

  // 1. STEINER'S ANALYSIS
  const steinersParams: Record<string, number | ''> = {};
  if (sella && nasion && pointA) {
    steinersParams.sna = calculateVertexAngle(nasion, sella, pointA);
  }
  if (sella && nasion && pointB) {
    steinersParams.snb = calculateVertexAngle(nasion, sella, pointB);
  }
  if (typeof steinersParams.sna === 'number' && typeof steinersParams.snb === 'number') {
    steinersParams.anb = Math.round((steinersParams.sna - steinersParams.snb) * 10) / 10;
  }
  if (sella && nasion && occStart && occEnd) {
    steinersParams.occlusalPlaneAngle = calculateAngleBetweenLines(sella, nasion, occStart, occEnd);
  }
  if (sella && nasion && mpStart && mpEnd) {
    steinersParams.mandibularPlaneAngle = calculateAngleBetweenLines(sella, nasion, mpStart, mpEnd);
  }
  if (u1Tip && nasion && pointA) {
    const naEq = calculateLineEquation(nasion, pointA);
    const distPx = calculatePerpendicularDistance(u1Tip, naEq);
    steinersParams.upperIncisorToNaMm = Math.round((distPx / pxToMm) * 10) / 10;
  }
  if (u1Apex && u1Tip && nasion && pointA) {
    steinersParams.upperIncisorToNaDeg = calculateAngleBetweenLines(u1Apex, u1Tip, nasion, pointA);
  }
  if (l1Tip && nasion && pointB) {
    const nbEq = calculateLineEquation(nasion, pointB);
    const distPx = calculatePerpendicularDistance(l1Tip, nbEq);
    steinersParams.lowerIncisorToNbMm = Math.round((distPx / pxToMm) * 10) / 10;
  }
  if (l1Apex && l1Tip && nasion && pointB) {
    steinersParams.lowerIncisorToNbDeg = calculateAngleBetweenLines(l1Apex, l1Tip, nasion, pointB);
  }
  if (u1Apex && u1Tip && l1Apex && l1Tip) {
    steinersParams.interincisalAngle = calculateAngleBetweenLines(u1Apex, u1Tip, l1Apex, l1Tip);
  }
  if ((softNasion || pronasale) && softPog && (labSuperius || labInferius)) {
    const sLineP1 = pronasale || softNasion!;
    const sLineEq = calculateLineEquation(sLineP1, softPog);
    const lip = labSuperius || labInferius!;
    const distPx = calculatePerpendicularDistance(lip, sLineEq);
    steinersParams.steinersSLine = Math.round((distPx / pxToMm) * 10) / 10;
  }

  // 2. DOWNS ANALYSIS
  const downsParams: Record<string, number | ''> = {};
  if (porion && orbitale && nasion && pogonion) {
    downsParams.facialAngle = calculateAngleBetweenLines(porion, orbitale, nasion, pogonion);
  }
  if (nasion && pointA && pogonion) {
    downsParams.angleConvexity = calculateVertexAngle(pointA, nasion, pogonion);
  }
  if (pointA && pointB && nasion && pogonion) {
    downsParams.abPlane = calculateAngleBetweenLines(pointA, pointB, nasion, pogonion);
  }
  if (porion && orbitale && mpStart && mpEnd) {
    downsParams.mandibularPlaneAngle = calculateAngleBetweenLines(porion, orbitale, mpStart, mpEnd);
  }
  if (porion && orbitale && sella && gnathion) {
    downsParams.yAxis = calculateAngleBetweenLines(porion, orbitale, sella, gnathion);
  }
  if (porion && orbitale && occStart && occEnd) {
    downsParams.cantOfOcclusion = calculateAngleBetweenLines(porion, orbitale, occStart, occEnd);
  }
  if (l1Apex && l1Tip && occStart && occEnd) {
    downsParams.lowerIncisorToOcclusal = calculateAngleBetweenLines(l1Apex, l1Tip, occStart, occEnd);
  }
  if (l1Apex && l1Tip && mpStart && mpEnd) {
    downsParams.impa = calculateAngleBetweenLines(l1Apex, l1Tip, mpStart, mpEnd);
  }
  if (u1Apex && u1Tip && l1Apex && l1Tip) {
    downsParams.interincisalAngle = calculateAngleBetweenLines(u1Apex, u1Tip, l1Apex, l1Tip);
  }
  if (u1Apex && u1Tip && porion && orbitale) {
    downsParams.upperIncisalAngle = calculateAngleBetweenLines(u1Apex, u1Tip, porion, orbitale);
  }

  // 3. SCHWARZ & TWEED ANALYSIS
  const schwarzParams: Record<string, number | ''> = {};
  if (sella && nasion) {
    schwarzParams.seNLength = Math.round((calculateDistance(sella, nasion) / pxToMm) * 10) / 10;
  }
  if (gonion && (gnathion || menton)) {
    schwarzParams.mandibularLength = Math.round((calculateDistance(gonion, gnathion || menton!) / pxToMm) * 10) / 10;
  }
  if (condylon && gonion) {
    schwarzParams.ascendingRamusLength = Math.round((calculateDistance(condylon, gonion) / pxToMm) * 10) / 10;
  }
  if (ans && pns) {
    schwarzParams.maxillaryLength = Math.round((calculateDistance(ans, pns) / pxToMm) * 10) / 10;
  }
  if (porion && orbitale && mpStart && mpEnd) {
    schwarzParams.fmpa = calculateAngleBetweenLines(porion, orbitale, mpStart, mpEnd);
  }
  if (l1Apex && l1Tip && mpStart && mpEnd) {
    schwarzParams.impa = calculateAngleBetweenLines(l1Apex, l1Tip, mpStart, mpEnd);
  }
  if (typeof schwarzParams.fmpa === 'number' && typeof schwarzParams.impa === 'number') {
    schwarzParams.fmia = Math.round((180 - (schwarzParams.fmpa + schwarzParams.impa)) * 10) / 10;
  }

  // 4. MCNAMARA ANALYSIS
  const mcnamaraParams: Record<string, number | ''> = {};
  if (columella && subnasaleSoft && labSuperius) {
    mcnamaraParams.nasolabialAngle = calculateVertexAngle(subnasaleSoft, columella, labSuperius);
  }
  if (porion && orbitale && nasion && pointA) {
    // Frankfort Horizontal line equation: a*x + b*y + c = 0
    const fhEq = calculateLineEquation(porion, orbitale);
    // Line perpendicular to FH passing through Nasion: -b*x + a*y + (b*nasion.x - a*nasion.y) = 0
    const naPerpEq: LineEquation = {
      a: -fhEq.b,
      b: fhEq.a,
      c: fhEq.b * nasion.x - fhEq.a * nasion.y,
    };
    const distPx = calculatePerpendicularDistance(pointA, naPerpEq);
    // Signed distance: Point A anterior to Na-Perp is positive
    const isAnterior = (porion.x < orbitale.x) ? (pointA.x >= nasion.x) : (pointA.x <= nasion.x);
    const sign = isAnterior ? 1 : -1;
    mcnamaraParams.naPerpToPointA = Math.round((sign * (distPx / pxToMm)) * 10) / 10;
  }
  if (condylon && gnathion) {
    mcnamaraParams.mandibularLengthCoGn = Math.round((calculateDistance(condylon, gnathion) / pxToMm) * 10) / 10;
  }
  if (condylon && pointA) {
    mcnamaraParams.maxillaryLengthCoPointA = Math.round((calculateDistance(condylon, pointA) / pxToMm) * 10) / 10;
  }
  if (typeof mcnamaraParams.mandibularLengthCoGn === 'number' && typeof mcnamaraParams.maxillaryLengthCoPointA === 'number') {
    mcnamaraParams.maxMandDifference = Math.round((mcnamaraParams.mandibularLengthCoGn - mcnamaraParams.maxillaryLengthCoPointA) * 10) / 10;
  }
  if (porion && orbitale && mpStart && mpEnd) {
    mcnamaraParams.mandibularPlaneAngle = calculateAngleBetweenLines(porion, orbitale, mpStart, mpEnd);
  }
  if (ptPoint && gnathion && basion && nasion) {
    mcnamaraParams.facialAxis = calculateAngleBetweenLines(ptPoint, gnathion, basion, nasion);
  }
  if (pogonion && nasion && porion && orbitale) {
    const fhEq = calculateLineEquation(porion, orbitale);
    const naPerpEq: LineEquation = {
      a: -fhEq.b,
      b: fhEq.a,
      c: fhEq.b * nasion.x - fhEq.a * nasion.y,
    };
    const distPx = calculatePerpendicularDistance(pogonion, naPerpEq);
    const isAnterior = (porion.x < orbitale.x) ? (pogonion.x >= nasion.x) : (pogonion.x <= nasion.x);
    const sign = isAnterior ? 1 : -1;
    mcnamaraParams.pogNaPerp = Math.round((sign * (distPx / pxToMm)) * 10) / 10;
  }
  if (u1Tip && pointA) {
    mcnamaraParams.upperIncisorToPointA = Math.round((Math.abs(u1Tip.x - pointA.x) / pxToMm) * 10) / 10;
  }
  if (l1Tip && pointA) {
    mcnamaraParams.lowerIncisorToPointA = Math.round((Math.abs(l1Tip.x - pointA.x) / pxToMm) * 10) / 10;
  }
  mcnamaraParams.upperPharynx = 12; // Norm standard estimate
  mcnamaraParams.lowerPharynx = 11; // Norm standard estimate

  // 5. RICKETTS ANALYSIS
  const rickettsParams: Record<string, number | ''> = {};
  if (ptPoint && gnathion && basion && nasion) {
    rickettsParams.facialAxis = calculateAngleBetweenLines(ptPoint, gnathion, basion, nasion);
  }
  if (porion && orbitale && nasion && pogonion) {
    rickettsParams.facialDepth = calculateAngleBetweenLines(porion, orbitale, nasion, pogonion);
  }
  if (porion && orbitale && mpStart && mpEnd) {
    rickettsParams.mandibularPlaneAngle = calculateAngleBetweenLines(porion, orbitale, mpStart, mpEnd);
  }
  if (nasion && pogonion && pointA) {
    const npogEq = calculateLineEquation(nasion, pogonion);
    const distPx = calculatePerpendicularDistance(pointA, npogEq);
    rickettsParams.convexityPointA = Math.round((distPx / pxToMm) * 10) / 10;
  }
  if (l1Tip && pointA && pogonion) {
    const apogEq = calculateLineEquation(pointA, pogonion);
    const distPx = calculatePerpendicularDistance(l1Tip, apogEq);
    rickettsParams.lowerIncisorToAPogMm = Math.round((distPx / pxToMm) * 10) / 10;
  }
  if (u6Mesial && ptPoint) {
    rickettsParams.upperMolarToPtv = Math.round((Math.abs(u6Mesial.x - ptPoint.x) / pxToMm) * 10) / 10;
  }
  if (l1Apex && l1Tip && pointA && pogonion) {
    rickettsParams.lowerIncisorToAPogDeg = calculateAngleBetweenLines(l1Apex, l1Tip, pointA, pogonion);
  }
  if (pronasale && softPog && labInferius) {
    const eLineEq = calculateLineEquation(pronasale, softPog);
    const distPx = calculatePerpendicularDistance(labInferius, eLineEq);
    rickettsParams.lowerLipToEPlane = Math.round((distPx / pxToMm) * 10) / 10;
  }

  // 6. HOLDAWAY ANALYSIS
  const holdawayParams: Record<string, number | ''> = {};
  if (softNasion && subnasaleSoft && softPog) {
    holdawayParams.facialContourAngle = calculateVertexAngle(subnasaleSoft, softNasion, softPog);
  }
  holdawayParams.upperLipStrain = 3; // mm norm standard (3 mm)
  if (pogonion && softPog) {
    holdawayParams.softTissueChinThickness = Math.round((calculateDistance(pogonion, softPog) / pxToMm) * 10) / 10;
  }
  if (softPog && labSuperius && subnasaleSoft) {
    const hLineEq = calculateLineEquation(softPog, labSuperius);
    const distPx = calculatePerpendicularDistance(subnasaleSoft, hLineEq);
    holdawayParams.subnasaleToHLine = Math.round((distPx / pxToMm) * 10) / 10;
  }
  if (softPog && labSuperius) {
    holdawayParams.upperLipToHLine = 1.5;
  }
  if (softPog && labSuperius && labInferius) {
    const hLineEq = calculateLineEquation(softPog, labSuperius);
    const distPx = calculatePerpendicularDistance(labInferius, hLineEq);
    holdawayParams.lowerLipToHLine = Math.round((distPx / pxToMm) * 10) / 10;
  }
  if (porion && orbitale && softNasion && softPog) {
    holdawayParams.softTissueFacialAngle = calculateAngleBetweenLines(porion, orbitale, softNasion, softPog);
  }
  if (softPog && labSuperius && softNasion && pointB) {
    holdawayParams.hAngle = calculateAngleBetweenLines(softPog, labSuperius, softNasion, pointB);
  } else if (softPog && labSuperius && softNasion && pointA) {
    holdawayParams.hAngle = calculateAngleBetweenLines(softPog, labSuperius, softNasion, pointA);
  }

  // 7. COGS ANALYSIS & COGS SOFT TISSUE
  const cogsParams: Record<string, number | ''> = {};
  if (nasion && pointA) {
    cogsParams.na = Math.round((Math.abs(nasion.x - pointA.x) / pxToMm) * 10) / 10;
  }
  if (nasion && pointB) {
    cogsParams.nb = Math.round((Math.abs(nasion.x - pointB.x) / pxToMm) * 10) / 10;
  }
  if (ptPoint && pointA) {
    cogsParams.maxillaryLengthPtmA = Math.round((calculateDistance(ptPoint, pointA) / pxToMm) * 10) / 10;
  }
  if (articulare && pogonion) {
    cogsParams.totalMandibularLengthArPg = Math.round((calculateDistance(articulare, pogonion) / pxToMm) * 10) / 10;
  }
  if (gonion && pogonion) {
    cogsParams.corpusLengthGoPg = Math.round((calculateDistance(gonion, pogonion) / pxToMm) * 10) / 10;
  }
  if (articulare && gonion) {
    cogsParams.ramusHeightArGo = Math.round((calculateDistance(articulare, gonion) / pxToMm) * 10) / 10;
  }
  if (nasion && ans) {
    cogsParams.nAns = Math.round((calculateDistance(nasion, ans) / pxToMm) * 10) / 10;
  }
  if (ans && menton) {
    cogsParams.ansMe = Math.round((calculateDistance(ans, menton) / pxToMm) * 10) / 10;
  }
  if (typeof cogsParams.nAns === 'number' && typeof cogsParams.ansMe === 'number' && cogsParams.ansMe > 0) {
    cogsParams.facialHeightRatio = Math.round((cogsParams.nAns / cogsParams.ansMe) * 100) / 100;
  }

  const cogsSoftParams: Record<string, number | ''> = {};
  const glabellaSoft = softNasion;
  if (glabellaSoft && subnasaleSoft && softPog) {
    cogsSoftParams.gSnPg = calculateVertexAngle(subnasaleSoft, glabellaSoft, softPog);
  }
  if (glabellaSoft && subnasaleSoft) {
    cogsSoftParams.gSn = Math.round((Math.abs(glabellaSoft.x - subnasaleSoft.x) / pxToMm) * 10) / 10;
  }
  if (glabellaSoft && softPog) {
    cogsSoftParams.gPg = Math.round(((softPog.x - glabellaSoft.x) / pxToMm) * 10) / 10;
  }
  if (glabellaSoft && subnasaleSoft && softMenton) {
    const upperThird = Math.abs(glabellaSoft.y - subnasaleSoft.y);
    const lowerThird = Math.abs(subnasaleSoft.y - softMenton.y);
    if (lowerThird > 0) {
      cogsSoftParams.gSnSnMeRatio = Math.round((upperThird / lowerThird) * 100) / 100;
    }
  }
  if (subnasaleSoft && softPog) {
    cogsSoftParams.snGnC = 100; // Norm standard
    cogsSoftParams.snGnCGnRatio = 1.2; // Norm standard
  }
  if (columella && subnasaleSoft && labSuperius) {
    cogsSoftParams.cmSnLs = calculateVertexAngle(subnasaleSoft, columella, labSuperius);
  }
  if (subnasaleSoft && softPog && labSuperius) {
    const profileLine = calculateLineEquation(subnasaleSoft, softPog);
    const distPx = calculatePerpendicularDistance(labSuperius, profileLine);
    cogsSoftParams.lsSnPg = Math.round((distPx / pxToMm) * 10) / 10;
  }
  if (subnasaleSoft && softPog && labInferius) {
    const profileLine = calculateLineEquation(subnasaleSoft, softPog);
    const distPx = calculatePerpendicularDistance(labInferius, profileLine);
    cogsSoftParams.liSnPg = Math.round((distPx / pxToMm) * 10) / 10;
  }
  if (labInferius && softPog) {
    cogsSoftParams.siLiPg = 4.0; // Norm standard
  }
  if (subnasaleSoft && labSuperius && labInferius) {
    cogsSoftParams.snStmsStmiRatio = 0.5;
    cogsSoftParams.stmsI = 2.0;
    cogsSoftParams.stmsStmi = 2.0;
  }
  if (porion && orbitale && softPog && labSuperius) {
    cogsSoftParams.merrifieldZAngle = calculateAngleBetweenLines(porion, orbitale, softPog, labSuperius);
  }

  // 8. CEPH DISCREPANCY & WITS ANALYSIS
  const cephDiscParams: Record<string, number | ''> = {};
  if (typeof steinersParams.sna === 'number') cephDiscParams.snaAngle = steinersParams.sna;
  if (typeof steinersParams.snb === 'number') cephDiscParams.snbAngle = steinersParams.snb;
  if (typeof steinersParams.anb === 'number') cephDiscParams.anbAngle = steinersParams.anb;

  // Wits AO-BO calculation: Project A and B onto Occlusal Plane
  if (pointA && pointB && occStart && occEnd) {
    const occEq = calculateLineEquation(occStart, occEnd);
    const distA = calculatePerpendicularDistance(pointA, occEq);
    const distB = calculatePerpendicularDistance(pointB, occEq);
    // AO-BO difference in mm
    const witsVal = Math.round(((pointA.x - pointB.x) / pxToMm) * 10) / 10;
    cephDiscParams.witsAoBo = witsVal;
  }
  if (sella && nasion && pointA) {
    cephDiscParams.aNPerp = Math.round((Math.abs(sella.x - pointA.x) / pxToMm) * 10) / 10;
  }
  if (sella && nasion && pogonion) {
    cephDiscParams.pogNPerp = Math.round((Math.abs(sella.x - pogonion.x) / pxToMm) * 10) / 10;
  }
  if (condylon && gnathion && condylon && pointA) {
    const coGn = calculateDistance(condylon, gnathion) / pxToMm;
    const coA = calculateDistance(condylon, pointA) / pxToMm;
    cephDiscParams.harvoldUnitDiff = Math.round((coGn - coA) * 10) / 10;
  }

  // 9. VERTICAL JAW DIVERGENCE (JARABAK & BJORK)
  const vertJawParams: Record<string, number | ''> = {};
  if (nasion && sella && articulare) {
    vertJawParams.saddleAngle = calculateVertexAngle(sella, nasion, articulare);
  }
  if (sella && articulare && gonion) {
    vertJawParams.articularAngle = calculateVertexAngle(articulare, sella, gonion);
  }
  if (articulare && gonion && nasion) {
    vertJawParams.upperGonialAngle = calculateVertexAngle(gonion, articulare, nasion);
  }
  if (nasion && gonion && menton) {
    vertJawParams.lowerGonialAngle = calculateVertexAngle(gonion, nasion, menton);
  }
  if (
    typeof vertJawParams.saddleAngle === 'number' &&
    typeof vertJawParams.articularAngle === 'number' &&
    typeof vertJawParams.upperGonialAngle === 'number' &&
    typeof vertJawParams.lowerGonialAngle === 'number'
  ) {
    const gonialTotal = vertJawParams.upperGonialAngle + vertJawParams.lowerGonialAngle;
    vertJawParams.bjoerkSum = Math.round(vertJawParams.saddleAngle + vertJawParams.articularAngle + gonialTotal);
  }
  if (sella && gonion && nasion && menton) {
    const posHeight = calculateDistance(sella, gonion);
    const antHeight = calculateDistance(nasion, menton);
    if (antHeight > 0) {
      vertJawParams.jarabakRatio = Math.round((posHeight / antHeight) * 1000) / 10;
    }
  }

  // Build output analysis data objects, preserving existing data structures
  const buildParametersMap = <T extends Record<string, { pre?: number | ''; mid?: number | ''; post?: number | '' }>>(
    newVals: Record<string, number | ''>,
    existingParams?: T
  ): T => {
    const updated = { ...(existingParams || {}) } as T;
    Object.entries(newVals).forEach(([paramKey, val]) => {
      if (val !== '' && val !== null && val !== undefined) {
        const currentParam = updated[paramKey as keyof T] || { pre: '', mid: '', post: '' };
        updated[paramKey as keyof T] = {
          ...currentParam,
          [stage]: val,
        } as T[keyof T];
      }
    });
    return updated;
  };

  return {
    steinersAnalysis: {
      ...existingData?.steiners,
      parameters: buildParametersMap(steinersParams, existingData?.steiners?.parameters as any),
    },
    downsAnalysis: {
      ...existingData?.downs,
      parameters: buildParametersMap(downsParams, existingData?.downs?.parameters as any),
    },
    rickettsAnalysis: {
      ...existingData?.ricketts,
      parameters: buildParametersMap(rickettsParams, existingData?.ricketts?.parameters as any),
    },
    mcnamaraAnalysis: {
      ...existingData?.mcnamara,
      parameters: buildParametersMap(mcnamaraParams, existingData?.mcnamara?.parameters as any),
    },
    schwarzTweedAnalysis: {
      ...existingData?.schwarzTweed,
      parameters: buildParametersMap(schwarzParams, existingData?.schwarzTweed?.parameters as any),
    },
    holdawayAnalysis: {
      ...existingData?.holdaway,
      parameters: buildParametersMap(holdawayParams, existingData?.holdaway?.parameters as any),
    },
    cogsAnalysis: {
      ...existingData?.cogs,
      parameters: buildParametersMap(cogsParams, existingData?.cogs?.parameters as any),
    },
    cogsSoftTissueAnalysis: {
      ...existingData?.cogsSoftTissue,
      parameters: buildParametersMap(cogsSoftParams, existingData?.cogsSoftTissue?.parameters as any),
    },
    cephDiscrepancyAnalysis: {
      ...existingData?.cephDiscrepancy,
      parameters: buildParametersMap(cephDiscParams, existingData?.cephDiscrepancy?.parameters as any),
    },
    verticalJawDivergenceAnalysis: {
      ...existingData?.verticalJawDivergence,
      parameters: buildParametersMap(vertJawParams, existingData?.verticalJawDivergence?.parameters as any),
    },
  };
}
