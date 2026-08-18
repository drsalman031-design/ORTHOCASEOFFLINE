import { jsPDF } from 'jspdf';
import { BonwillTemplateData } from '../../types';
import { calculateHawleyGeometry, CalculatedHawleyGeometry } from './BonwillGeometry';

/**
 * Draws a comprehensive 1:1 true-scale Hawley Method B archwire template page on a jsPDF instance.
 */
function renderHawleyPage(doc: jsPDF, data: BonwillTemplateData, pageNum: number, totalPages: number) {
  const geom = calculateHawleyGeometry(data);
  const isUpper = data.archType === 'Maxillary';

  // -------------------------------------------------------------
  // 1. HEADER & CASE METADATA
  // -------------------------------------------------------------
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(10, 8, 190, 22, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.rect(10, 8, 190, 22, 'S');

  // Accent band
  doc.setFillColor(13, 148, 136); // teal-600
  doc.rect(10, 8, 3.5, 22, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`BONWILL-HAWLEY METHOD B ARCH FORM (${data.archType.toUpperCase()} ARCH)`, 16, 14.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Exact 1:1 True-Scale Physical Wire-Bending & Hawley Retainer Fabrication Template', 16, 19);
  doc.text(`Page ${pageNum} of ${totalPages} | Standard Equilateral Bonwill Triangle & Hawley Method B Coordinate System`, 16, 24);

  // Metadata Columns
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`Patient:`, 130, 14.5);
  doc.text(`ID:`, 130, 19);
  doc.text(`Date:`, 130, 24);

  doc.setFont('helvetica', 'normal');
  doc.text(`${data.patientName || 'Case Record'}`, 142, 14.5);
  doc.text(`${data.patientId || 'N/A'}`, 136, 19);
  doc.text(`${data.date || new Date().toISOString().split('T')[0]}`, 138, 24);

  // -------------------------------------------------------------
  // 2. CRITICAL PRINT CALIBRATION & INSTRUCTION BANNER
  // -------------------------------------------------------------
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(239, 68, 68); // red-500
  doc.setLineWidth(0.35);
  doc.rect(10, 32, 190, 11, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text('CRITICAL 1:1 PHYSICAL PRINT CALIBRATION MANDATE:', 13, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(153, 27, 27);
  doc.text(
    '1. Set printer dialog to "100% Scale" or "Actual Size" (DO NOT select "Fit to Page").\n2. MUST verify 20x20mm Caliper Box and 100mm Rulers with digital calipers before bending archwire.',
    13,
    40
  );

  // -------------------------------------------------------------
  // 3. DUAL-AXIS PHYSICAL CALIBRATION (20x20mm Box & 100mm Rulers)
  // -------------------------------------------------------------
  const calibX = 10;
  const calibY = 45;

  // 20mm x 20mm Outer Calibration Square + 10x10mm Inner Square
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(calibX, calibY, 20, 20, 'FD');

  doc.setDrawColor(203, 213, 225);
  doc.rect(calibX + 5, calibY + 5, 10, 10, 'S');

  // Crosshairs
  doc.setDrawColor(225, 29, 72);
  doc.setLineWidth(0.2);
  doc.line(calibX + 10, calibY, calibX + 10, calibY + 20);
  doc.line(calibX, calibY + 10, calibX + 20, calibY + 10);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(15, 23, 42);
  doc.text('20 x 20 mm', calibX + 22, calibY + 5.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(71, 85, 105);
  doc.text('Digital Caliper Target', calibX + 22, calibY + 10);
  doc.text('Tolerance: ±0.2 mm', calibX + 22, calibY + 14.5);
  doc.text('1:1 Physical Scale', calibX + 22, calibY + 19);

  // 100mm Horizontal Reference Ruler
  const rulerX = 62;
  const rulerY = calibY + 2;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(rulerX, rulerY + 8, rulerX + 100, rulerY + 8);

  for (let mm = 0; mm <= 100; mm += 1) {
    const rx = rulerX + mm;
    let tickH = 1.5;
    if (mm % 10 === 0) {
      tickH = 4.5;
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`${mm}`, rx - 1.2, rulerY + 3);
    } else if (mm % 5 === 0) {
      tickH = 2.8;
    }
    doc.setLineWidth(mm % 10 === 0 ? 0.3 : 0.12);
    doc.line(rx, rulerY + 8, rx, rulerY + 8 - tickH);
  }
  doc.setFontSize(6.0);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('100 mm Horizontal Physical Reference Ruler (Caliper Scale Check)', rulerX + 14, rulerY + 14);

  // -------------------------------------------------------------
  // 4. MILLIMETER GRAPH CANVAS (1:1 TRUE PHYSICAL SCALE)
  // -------------------------------------------------------------
  const canvasFrameX = 10;
  const canvasFrameY = 68;
  const canvasW = 190;
  const canvasH = 138;
  const originX = canvasFrameX + canvasW / 2; // 105 mm (centerline)
  const originY = canvasFrameY + 26; // Apex A (0,0) at 26mm from top of canvas

  // Canvas Border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.4);
  doc.rect(canvasFrameX, canvasFrameY, canvasW, canvasH, 'FD');

  // Draw 1mm / 5mm / 10mm Grid — clipped strictly inside the canvas frame
  for (let x = -90; x <= 90; x += 1) {
    const px = originX + x;
    if (px < canvasFrameX || px > canvasFrameX + canvasW) continue;

    if (x % 10 === 0) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.18);
      doc.line(px, canvasFrameY, px, canvasFrameY + canvasH);

      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`${x}`, px - 1.5, canvasFrameY + 3);
    } else if (x % 5 === 0) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.line(px, canvasFrameY, px, canvasFrameY + canvasH);
    } else {
      doc.setDrawColor(248, 250, 252);
      doc.setLineWidth(0.05);
      doc.line(px, canvasFrameY, px, canvasFrameY + canvasH);
    }
  }

  for (let yVal = -15; yVal <= 105; yVal += 1) {
    const py = originY + yVal;
    if (py < canvasFrameY || py > canvasFrameY + canvasH) continue;

    if (yVal % 10 === 0) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.18);
      doc.line(canvasFrameX, py, canvasFrameX + canvasW, py);

      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(`${yVal}`, canvasFrameX + 1.5, py + 1.2);
    } else if (yVal % 5 === 0) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.1);
      doc.line(canvasFrameX, py, canvasFrameX + canvasW, py);
    } else {
      doc.setDrawColor(248, 250, 252);
      doc.setLineWidth(0.05);
      doc.line(canvasFrameX, py, canvasFrameX + canvasW, py);
    }
  }

  // Midline Axis (Vertical red dashed line)
  doc.setDrawColor(225, 29, 72);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(originX, canvasFrameY, originX, canvasFrameY + canvasH);
  doc.setLineDashPattern([], 0);

  // Coordinate mapper to PDF canvas
  const toPdf = (pt: { x: number; y: number }) => ({
    x: originX + pt.x,
    y: originY - pt.y,
  });

  // -------------------------------------------------------------
  // 5. BONWILL EQUILATERAL TRIANGLE (100.0 mm x 60.0°)
  // -------------------------------------------------------------
  const tri = geom.bonwillTriangle;
  const pA = toPdf(tri.apexA);
  const pB = toPdf(tri.vertexB);
  const pC = toPdf(tri.vertexC);

  doc.setDrawColor(220, 38, 38);
  doc.setLineWidth(0.35);
  doc.setLineDashPattern([2, 1.5], 0);
  doc.line(pA.x, pA.y, pB.x, pB.y);
  doc.line(pA.x, pA.y, pC.x, pC.y);
  doc.line(pB.x, pB.y, pC.x, pC.y);
  doc.setLineDashPattern([], 0);

  doc.setFillColor(220, 38, 38);
  doc.circle(pA.x, pA.y, 1.1, 'F');
  doc.circle(pB.x, pB.y, 1.1, 'F');
  doc.circle(pC.x, pC.y, 1.1, 'F');

  doc.setFontSize(5.0);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('Bonwill: 100 mm (60°)', (pA.x + pB.x) / 2 - 24, (pA.y + pB.y) / 2);
  doc.text('Bonwill: 100 mm (60°)', (pA.x + pC.x) / 2 + 2, (pA.y + pC.y) / 2);
  doc.text('Base: 100 mm (60°)', (pB.x + pC.x) / 2 - 14, pB.y + 4);
  doc.text('Apex A', pA.x - 5, pA.y - 3);
  doc.text('Condyle B', pB.x - 14, pB.y + 2);
  doc.text('Condyle C', pC.x + 3, pC.y + 2);

  // -------------------------------------------------------------
  // 6. HAWLEY INNER & OUTER CIRCLES AND 42° RAYS
  // -------------------------------------------------------------
  const centerB = toPdf(geom.pointB);

  // Inner Circle (r)
  doc.setDrawColor(56, 189, 248); // sky-400
  doc.setLineWidth(0.18);
  doc.ellipse(centerB.x, centerB.y, geom.r, geom.r, 'S');

  // Outer Circle (2r)
  doc.setDrawColor(192, 132, 252); // purple-400
  doc.setLineWidth(0.15);
  doc.ellipse(centerB.x, centerB.y, 2 * geom.r, 2 * geom.r, 'S');

  // 42° Rays
  const cL = toPdf(geom.canineLeft);
  const rayEndL = toPdf(geom.leftRayPoints[1]);
  const cR = toPdf(geom.canineRight);
  const rayEndR = toPdf(geom.rightRayPoints[1]);

  doc.setDrawColor(249, 115, 22); // orange-500
  doc.setLineWidth(0.3);
  doc.line(cL.x, cL.y, rayEndL.x, rayEndL.y);
  doc.line(cR.x, cR.y, rayEndR.x, rayEndR.y);

  // -------------------------------------------------------------
  // 7. 120° ANTERIOR INCISAL ARC & FULL ARCH PATH
  // -------------------------------------------------------------
  // 120° Incisal Arc (Bold Wire Guideline - Teal)
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.9);
  const arcPts = geom.anteriorArcPoints;
  for (let i = 0; i < arcPts.length - 1; i++) {
    const p1 = toPdf(arcPts[i]);
    const p2 = toPdf(arcPts[i + 1]);
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }

  // Full Arch Path (Blue)
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  const archPts = geom.fullArchPath;
  for (let i = 0; i < archPts.length - 1; i++) {
    const p1 = toPdf(archPts[i]);
    const p2 = toPdf(archPts[i + 1]);
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }

  // FDI Tooth Landmarking
  const toothLabels: Record<string, string> = isUpper
    ? {
        pointA: '11|21 (A)',
        canineLeft: '23 (C)',
        canineRight: '13 (C\')',
        premolar1Left: '24 (P1)',
        premolar1Right: '14 (P1)',
        premolar2Left: '25 (P2)',
        premolar2Right: '15 (P2)',
        molar1Left: '26 (M1)',
        molar1Right: '16 (M1)',
        molar2Left: '27 (M2)',
        molar2Right: '17 (M2)',
        pointOLeft: 'O',
        pointORight: 'O\'',
      }
    : {
        pointA: '31|41 (A)',
        canineLeft: '33 (C)',
        canineRight: '43 (C\')',
        premolar1Left: '34 (P1)',
        premolar1Right: '44 (P1)',
        premolar2Left: '35 (P2)',
        premolar2Right: '45 (P2)',
        molar1Left: '36 (M1)',
        molar1Right: '46 (M1)',
        molar2Left: '37 (M2)',
        molar2Right: '47 (M2)',
        pointOLeft: 'O',
        pointORight: 'O\'',
      };

  geom.landmarkList.forEach((item) => {
    const p = toPdf(item.point);
    const isApex = item.key === 'pointA';
    const isCenter = item.key === 'pointB';
    const isCanine = item.key === 'canineLeft' || item.key === 'canineRight';

    doc.setFillColor(isApex ? 225 : isCenter ? 168 : isCanine ? 16 : 2, isApex ? 29 : isCenter ? 85 : isCanine ? 185 : 132, isApex ? 72 : isCenter ? 247 : isCanine ? 129 : 199);
    doc.circle(p.x, p.y, isApex ? 1.3 : isCanine ? 1.1 : 0.85, 'F');

    doc.setFontSize(5.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    const labelText = toothLabels[item.key] || item.label;
    const offsetX = item.isRight ? 3 : item.isLeft ? -13 : -5;
    const offsetY = isApex ? -2.5 : 3;

    doc.text(labelText, p.x + offsetX, p.y + offsetY);
  });

  // Intercanine Span Dimension Line
  doc.setDrawColor(13, 148, 136);
  doc.setLineWidth(0.2);
  doc.setLineDashPattern([1, 1], 0);
  doc.line(cL.x, cL.y, cR.x, cR.y);
  doc.setLineDashPattern([], 0);

  doc.setFontSize(4.8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(13, 148, 136);
  doc.text(`Intercanine Span: ${geom.metrics.intercanineSpan.toFixed(1)} mm`, originX - 14, cL.y - 1.5);

  // -------------------------------------------------------------
  // 8. THREE BENCH CARDS: METRICS, LAB BENDING GUIDE & GRADING
  // -------------------------------------------------------------
  const benchY = 210;

  // CARD A: Hawley Geometric Metrics Table (W = 60mm)
  doc.setFillColor(248, 250, 252);
  doc.rect(10, benchY, 60, 78, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.rect(10, benchY, 60, 78, 'S');

  doc.setFillColor(241, 245, 249);
  doc.rect(10, benchY, 60, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(13, 148, 136);
  doc.text('1. HAWLEY GEOMETRIC METRICS', 12, benchY + 5.2);

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  let curMY = benchY + 12.0;
  const addMetric = (label: string, val: string) => {
    doc.setFont('helvetica', 'normal');
    doc.text(label, 12, curMY);
    doc.setFont('helvetica', 'bold');
    doc.text(val, 68, curMY, { align: 'right' });
    curMY += 5.8;
  };

  addMetric('Sum of 6 Anteriors (Σ6):', `${geom.metrics.sumOfAnteriors.toFixed(1)} mm`);
  addMetric('Bracket Allowance:', `+${geom.metrics.bracketAllowance.toFixed(1)} mm`);
  addMetric('Corrected Sum (C):', `${geom.metrics.correctedSum.toFixed(1)} mm`);
  addMetric('Anterior Radius (r = C/π):', `${geom.metrics.anteriorRadius.toFixed(2)} mm`);
  addMetric('Intercanine Span (r√3):', `${geom.metrics.intercanineSpan.toFixed(1)} mm`);
  addMetric('1st Premolar Span:', `${geom.metrics.interpremolar1Span.toFixed(1)} mm`);
  addMetric('2nd Premolar Span:', `${geom.metrics.interpremolar2Span.toFixed(1)} mm`);
  addMetric('1st Molar Span (6-6):', `${geom.metrics.intermolar1Span.toFixed(1)} mm`);
  addMetric('2nd Molar Span (7-7):', `${geom.metrics.intermolar2Span.toFixed(1)} mm`);
  addMetric('Ray Divergence Angle:', `42.0° (21° bi)`);
  addMetric('Arch Perimeter:', `${geom.metrics.archPerimeter.toFixed(1)} mm`);

  // CARD B: Student Wire Bending Bench Protocol (W = 68mm)
  doc.setFillColor(255, 255, 255);
  doc.rect(73, benchY, 68, 78, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(73, benchY, 68, 78, 'S');

  doc.setFillColor(241, 245, 249);
  doc.rect(73, benchY, 68, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(13, 148, 136);
  doc.text('2. WIRE BENDING PROTOCOL', 75, benchY + 5.2);

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  const labSteps = [
    '• Wire Specification: 0.028" (0.7mm) or 0.032" (0.8mm) SS round wire.',
    '• Step 1: Calibrate with digital calipers against 20mm box (±0.2mm).',
    '• Step 2: Form anterior 120° arc with bird-beak pliers from C to C\'.',
    '• Step 3: Check anterior contour passes through incisal edge Apex A.',
    '• Step 4: Bend vertical U-loops at Canine landmarks C and C\'.',
    '• Step 5: Adapt crossover tags through C-P1 interdental embrasure.',
    '• Step 6: Align straight posterior legs along 42° divergence rays.',
    '• Step 7: Lay wire on flat glass slab to verify zero torque/rocking.',
    '• Step 8: Overlay wire directly onto template to confirm symmetry.',
  ];

  labSteps.forEach((st, idx) => {
    doc.text(st, 75, benchY + 12 + idx * 6.8);
  });

  // CARD C: Student & Faculty Assessment Rubric (W = 56mm)
  doc.setFillColor(255, 255, 255);
  doc.rect(144, benchY, 56, 78, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(144, benchY, 56, 78, 'S');

  doc.setFillColor(241, 245, 249);
  doc.rect(144, benchY, 56, 7.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. EVALUATION & SIGN-OFF', 146, benchY + 5.2);

  doc.setFontSize(5.8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const rubrics = [
    '[  ] 1:1 Scale Caliper Verified',
    '[  ] Incisal Arc Symmetry (±0.5mm)',
    '[  ] Canine Loop Heights Uniform',
    '[  ] 42° Divergence Maintained',
    '[  ] Passive Seating on Glass Slab',
  ];

  rubrics.forEach((rb, idx) => {
    doc.text(rb, 146, benchY + 13 + idx * 6.2);
  });

  doc.setFontSize(6.2);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Student:', 146, benchY + 47);
  doc.setFont('helvetica', 'normal');
  doc.text('___________________', 157, benchY + 47);

  doc.setFont('helvetica', 'bold');
  doc.text('Faculty:', 146, benchY + 54);
  doc.setFont('helvetica', 'normal');
  doc.text('___________________', 157, benchY + 54);

  doc.setFont('helvetica', 'bold');
  doc.text('Grade:', 146, benchY + 61);
  doc.setFont('helvetica', 'normal');
  doc.text('[  ] PASS    [  ] REVISE', 157, benchY + 61);

  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 146, benchY + 68);
  doc.setFont('helvetica', 'normal');
  doc.text('___________________', 157, benchY + 68);
}

/**
 * Generates True 1:1 Scale Vector PDF document using jsPDF for Hawley's Method B.
 */
export function exportBonwillPDF(data: BonwillTemplateData) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  renderHawleyPage(doc, data, 1, 1);

  const filename = `Hawley_MethodB_Arch_${(data.patientName || 'Case').replace(/\s+/g, '_')}_${data.archType}.pdf`;
  doc.save(filename);
}

/**
 * Generates True 1:1 Scale Vector PDF document containing BOTH Maxillary & Mandibular arches.
 */
export function exportBonwillDualArchPDF(
  patientName: string,
  patientId: string,
  maxillaryData: Partial<BonwillTemplateData>,
  mandibularData: Partial<BonwillTemplateData>
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const maxFull: BonwillTemplateData = {
    patientName: patientName || 'Case',
    patientId: patientId || 'N/A',
    archType: 'Maxillary',
    archForm: 'Ovoid',
    clinicianName: 'Orthodontist',
    date: new Date().toISOString().split('T')[0],
    sumOfAnteriors: maxillaryData.sumOfAnteriors || 45.0,
    bracketAllowance: maxillaryData.bracketAllowance ?? 3.0,
    toothWidthsAnterior: maxillaryData.toothWidthsAnterior || {
      lr3: 7.5,
      lr2: 6.5,
      lr1: 8.5,
      ll1: 8.5,
      ll2: 6.5,
      ll3: 7.5,
    },
    showGrid: true,
    showConstructionLines: true,
    showMeasurementLabels: true,
    showCoordinates: false,
    showArcFill: true,
    themeMode: 'light',
    ...maxillaryData,
  };

  const mandFull: BonwillTemplateData = {
    patientName: patientName || 'Case',
    patientId: patientId || 'N/A',
    archType: 'Mandibular',
    archForm: 'Ovoid',
    clinicianName: 'Orthodontist',
    date: new Date().toISOString().split('T')[0],
    sumOfAnteriors: mandibularData.sumOfAnteriors || 38.0,
    bracketAllowance: mandibularData.bracketAllowance ?? 3.0,
    toothWidthsAnterior: mandibularData.toothWidthsAnterior || {
      lr3: 6.5,
      lr2: 5.5,
      lr1: 5.0,
      ll1: 5.0,
      ll2: 5.5,
      ll3: 6.5,
    },
    showGrid: true,
    showConstructionLines: true,
    showMeasurementLabels: true,
    showCoordinates: false,
    showArcFill: true,
    themeMode: 'light',
    ...mandibularData,
  };

  // Page 1: Maxillary Arch
  renderHawleyPage(doc, maxFull, 1, 2);

  // Page 2: Mandibular Arch
  doc.addPage();
  renderHawleyPage(doc, mandFull, 2, 2);

  const filename = `Hawley_MethodB_DualArch_${(patientName || 'Case').replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Generates raw SVG string for standalone SVG vector download.
 */
export function exportBonwillSVG(data: BonwillTemplateData): string {
  const geom = calculateHawleyGeometry(data);

  const originX = 105;
  const originY = 100;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="297mm" viewBox="0 0 210 297" style="background:#ffffff; font-family:sans-serif;">\n`;

  // Header
  svg += `<rect x="10" y="10" width="190" height="28" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.3"/>\n`;
  svg += `<text x="14" y="20" font-size="5" font-weight="bold" fill="#0f172a">HAWLEY METHOD B ARCH PREDETERMINATION (TRUE 1:1 SCALE)</text>\n`;
  svg += `<text x="14" y="25" font-size="3" fill="#475569">Patient: ${data.patientName || 'N/A'} (${data.patientId || 'N/A'}) | Sum Anteriors: ${geom.metrics.sumOfAnteriors}mm | Radius r: ${geom.r.toFixed(2)}mm | Ray Angle: 42.0°</text>\n`;

  // 10x10 Calibration Square
  svg += `<rect x="10" y="42" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="0.4"/>\n`;
  svg += `<line x1="15" y1="42" x2="15" y2="52" stroke="#0f172a" stroke-width="0.15"/>\n`;
  svg += `<line x1="10" y1="47" x2="20" y2="47" stroke="#0f172a" stroke-width="0.15"/>\n`;
  svg += `<text x="23" y="48" font-size="2.5" font-weight="bold" fill="#0f172a">10x10 mm Calibration Square</text>\n`;

  // Reference Ruler 100mm
  svg += `<line x1="60" y1="48" x2="160" y2="48" stroke="#0f172a" stroke-width="0.4"/>\n`;
  for (let i = 0; i <= 100; i += 5) {
    const rx = 60 + i;
    const h = i % 10 === 0 ? 4 : 2.5;
    svg += `<line x1="${rx}" y1="48" x2="${rx}" y2="${48 - h}" stroke="#0f172a" stroke-width="${i % 10 === 0 ? 0.3 : 0.15}"/>\n`;
    if (i % 10 === 0) {
      svg += `<text x="${rx - 1}" y="42" font-size="2" fill="#0f172a">${i}</text>\n`;
    }
  }

  // Canvas Frame
  svg += `<rect x="15" y="58" width="180" height="180" fill="none" stroke="#334155" stroke-width="0.5"/>\n`;
  svg += `<line x1="${originX}" y1="58" x2="${originX}" y2="238" stroke="#e11d48" stroke-dasharray="1,1" stroke-width="0.3"/>\n`;

  // Anterior Arc
  let pathD = `M `;
  geom.anteriorArcPoints.forEach((pt, idx) => {
    const sx = originX + pt.x;
    const sy = originY - pt.y;
    pathD += `${idx === 0 ? '' : 'L '}${sx.toFixed(2)} ${sy.toFixed(2)} `;
  });
  svg += `<path d="${pathD}" fill="none" stroke="#0d9488" stroke-width="0.8"/>\n`;

  // Full Arch Path
  let fullD = `M `;
  geom.fullArchPath.forEach((pt, idx) => {
    const sx = originX + pt.x;
    const sy = originY - pt.y;
    fullD += `${idx === 0 ? '' : 'L '}${sx.toFixed(2)} ${sy.toFixed(2)} `;
  });
  svg += `<path d="${fullD}" fill="none" stroke="#0284c7" stroke-width="0.5"/>\n`;

  // Landmarks
  geom.landmarkList.forEach((item) => {
    const sx = originX + item.point.x;
    const sy = originY - item.point.y;
    svg += `<circle cx="${sx.toFixed(2)}" cy="${sy.toFixed(2)}" r="1.2" fill="#0284c7"/>\n`;
    svg += `<text x="${(sx + 2).toFixed(2)}" y="${(sy + 1).toFixed(2)}" font-size="2.2" font-weight="bold" fill="#0f172a">${item.label}</text>\n`;
  });

  svg += `</svg>`;
  return svg;
}

/**
 * Downloads generated SVG content as a file.
 */
export function downloadBonwillSVG(data: BonwillTemplateData) {
  const svgContent = exportBonwillSVG(data);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Hawley_MethodB_Arch_${(data.patientName || 'Case').replace(/\s+/g, '_')}_${data.archType}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
