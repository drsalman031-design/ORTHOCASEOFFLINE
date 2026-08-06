import { jsPDF } from 'jspdf';
import { BonwillTemplateData } from '../../types';
import { calculateHawleyGeometry, CalculatedHawleyGeometry } from './BonwillGeometry';

/**
 * Generates True 1:1 Scale Vector PDF document using jsPDF for Hawley's Method B.
 */
export function exportBonwillPDF(data: BonwillTemplateData) {
  const geom = calculateHawleyGeometry(data);

  // Create A4 PDF in Portrait mode (210mm x 297mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;

  // Header Box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(10, 10, 190, 28, 'F');
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.3);
  doc.rect(10, 10, 190, 28, 'S');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('HAWLEY METHOD B ORTHODONTIC ARCH PREDETERMINATION', 14, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text('Hawley\'s Original Method B (Sum of 6 Anteriors) True 1:1 Scale Vector Diagram', 14, 23);

  // Metadata Columns
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Patient Name:`, 110, 18);
  doc.text(`Patient ID:`, 110, 23);
  doc.text(`Arch Type:`, 110, 28);

  doc.text(`Clinician:`, 158, 18);
  doc.text(`Method:`, 158, 23);
  doc.text(`Date:`, 158, 28);

  doc.setFont('helvetica', 'normal');
  doc.text(`${data.patientName || 'N/A'}`, 130, 18);
  doc.text(`${data.patientId || 'N/A'}`, 126, 23);
  doc.text(`${data.archType} Arch`, 126, 28);

  doc.text(`${data.clinicianName || 'Dr. Rahul Sharma'}`, 172, 18);
  doc.text(`Hawley Method B`, 171, 23);
  doc.text(`${data.date || new Date().toISOString().split('T')[0]}`, 167, 28);

  // -------------------------------------------------------------
  // CRITICAL PRINT CALIBRATION REQUIREMENT WARNING
  // -------------------------------------------------------------
  doc.setFillColor(254, 242, 242); // red-50
  doc.setDrawColor(239, 68, 68); // red-500
  doc.rect(10, 40, 190, 12, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(185, 28, 28); // red-700
  doc.text('CRITICAL PRINT CALIBRATION REQUIREMENT (TRUE 1:1 SCALE):', 13, 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(153, 27, 27);
  doc.text(
    '1. Set printer dialog to "100% Scale" or "Actual Size" (DO NOT select "Fit to Page" or "Shrink to Fit").\n2. MUST verify 10x10 mm Calibration Square and Reference Rulers with physical calipers prior to clinical template overlay.',
    13,
    48
  );

  // -------------------------------------------------------------
  // CALIBRATION SQUARE & REFERENCE RULER
  // -------------------------------------------------------------
  const calibX = 10;
  const calibY = 54;

  // 10mm x 10mm Calibration Square
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.rect(calibX, calibY, 10, 10, 'S');

  // Fill cross inside square
  doc.setLineWidth(0.15);
  doc.line(calibX + 5, calibY, calibX + 5, calibY + 10);
  doc.line(calibX, calibY + 5, calibX + 10, calibY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(15, 23, 42);
  doc.text('10x10 mm', calibX + 12, calibY + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Calibration Square', calibX + 12, calibY + 8);

  // 100mm Reference Ruler
  const rulerX = 65;
  const rulerY = 56;
  const rulerWidth = 100;

  doc.setLineWidth(0.4);
  doc.line(rulerX, rulerY + 6, rulerX + rulerWidth, rulerY + 6);

  for (let mm = 0; mm <= 100; mm += 1) {
    const rx = rulerX + mm;
    let tickH = 1.5;
    if (mm % 10 === 0) {
      tickH = 4.5;
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(`${mm}`, rx - 1, rulerY + 1);
    } else if (mm % 5 === 0) {
      tickH = 3.0;
    }
    doc.setLineWidth(mm % 10 === 0 ? 0.3 : 0.15);
    doc.line(rx, rulerY + 6, rx, rulerY + 6 - tickH);
  }
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('100 mm Physical Reference Ruler', rulerX + 30, rulerY + 10);

  // -------------------------------------------------------------
  // MILLIMETER GRAPH CANVAS AREA
  // -------------------------------------------------------------
  const canvasFrameX = 15;
  const canvasFrameY = 68;
  const canvasSize = 180; // 180mm x 180mm
  const originX = canvasFrameX + canvasSize / 2; // Center X
  const originY = canvasFrameY + 35; // Apex A (0,0) at 35mm from top edge

  // Canvas Border
  doc.setDrawColor(51, 65, 85);
  doc.setLineWidth(0.5);
  doc.rect(canvasFrameX, canvasFrameY, canvasSize, canvasSize, 'S');

  // Draw 1mm / 5mm / 10mm Grid — clipped strictly inside the canvas frame
  for (let x = -80; x <= 80; x += 1) {
    const px = originX + x;
    if (px < canvasFrameX || px > canvasFrameX + canvasSize) continue;

    if (x % 10 === 0) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(px, canvasFrameY, px, canvasFrameY + canvasSize);

      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`${x}`, px - 1.5, canvasFrameY - 1);
    } else if (x % 5 === 0) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.12);
      doc.line(px, canvasFrameY, px, canvasFrameY + canvasSize);
    } else {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.06);
      doc.line(px, canvasFrameY, px, canvasFrameY + canvasSize);
    }
  }

  for (let y = -25; y <= 140; y += 1) {
    const py = originY - y;
    // Must use canvasFrameY (not canvasFrameX) — otherwise grid lines bleed into the header
    if (py < canvasFrameY || py > canvasFrameY + canvasSize) continue;

    if (y % 10 === 0) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.line(canvasFrameX, py, canvasFrameX + canvasSize, py);

      doc.setFontSize(5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      if (canvasFrameX - 4 > 2) {
        doc.text(`${y}`, canvasFrameX - 4, py + 1);
      }
    } else if (y % 5 === 0) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.12);
      doc.line(canvasFrameX, py, canvasFrameX + canvasSize, py);
    } else {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.06);
      doc.line(canvasFrameX, py, canvasFrameX + canvasSize, py);
    }
  }

  // Midline Axis (Vertical red dashed line)
  doc.setDrawColor(225, 29, 72);
  doc.setLineWidth(0.25);
  doc.line(originX, canvasFrameY, originX, canvasFrameY + canvasSize);

  // Coordinate mapper to PDF canvas
  const toPdf = (pt: { x: number; y: number }) => ({
    x: originX + pt.x,
    y: originY - pt.y,
  });

  // -------------------------------------------------------------
  // CONSTRUCTION CIRCLES & RAYS
  // -------------------------------------------------------------
  const centerB = toPdf(geom.pointB);

  // Inner Circle (r)
  doc.setDrawColor(2, 132, 199); // sky-600
  doc.setLineWidth(0.2);
  doc.ellipse(centerB.x, centerB.y, geom.r, geom.r, 'S');

  // Outer Circle (2r)
  doc.setDrawColor(126, 34, 206); // purple-700
  doc.setLineWidth(0.2);
  doc.ellipse(centerB.x, centerB.y, 2 * geom.r, 2 * geom.r, 'S');

  // 42° Rays
  const cL = toPdf(geom.canineLeft);
  const rayEndL = toPdf(geom.leftRayPoints[1]);
  const cR = toPdf(geom.canineRight);
  const rayEndR = toPdf(geom.rightRayPoints[1]);

  doc.setDrawColor(234, 88, 12); // orange-600
  doc.setLineWidth(0.3);
  doc.line(cL.x, cL.y, rayEndL.x, rayEndL.y);
  doc.line(cR.x, cR.y, rayEndR.x, rayEndR.y);

  // -------------------------------------------------------------
  // 120° ANTERIOR ARC & FULL ARCH CURVE
  // -------------------------------------------------------------
  doc.setDrawColor(13, 148, 136); // teal-600 bold curve
  doc.setLineWidth(0.8);

  const arcPts = geom.anteriorArcPoints;
  for (let i = 0; i < arcPts.length - 1; i++) {
    const p1 = toPdf(arcPts[i]);
    const p2 = toPdf(arcPts[i + 1]);
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }

  // Full Arch Path
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(0.5);
  const archPts = geom.fullArchPath;
  for (let i = 0; i < archPts.length - 1; i++) {
    const p1 = toPdf(archPts[i]);
    const p2 = toPdf(archPts[i + 1]);
    doc.line(p1.x, p1.y, p2.x, p2.y);
  }

  // -------------------------------------------------------------
  // LANDMARK MARKERS & LABELS
  // -------------------------------------------------------------
  geom.landmarkList.forEach((item) => {
    const p = toPdf(item.point);
    const isApex = item.key === 'pointA';
    const isCenter = item.key === 'pointB';
    const isCanine = item.key === 'canineLeft' || item.key === 'canineRight';

    doc.setFillColor(isApex ? 225 : isCenter ? 168 : isCanine ? 16 : 2, isApex ? 29 : isCenter ? 85 : isCanine ? 185 : 132, isApex ? 72 : isCenter ? 247 : isCanine ? 129 : 199);
    doc.circle(p.x, p.y, isApex ? 1.2 : 0.9, 'F');

    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);

    const offsetX = item.isRight ? 3 : item.isLeft ? -14 : -4;
    const offsetY = isApex ? -2 : 3;

    doc.text(`${item.label}`, p.x + offsetX, p.y + offsetY);
  });

  // -------------------------------------------------------------
  // AUTOMATIC MEASUREMENT SUMMARY TABLE & SIGNATURE (Bottom)
  // -------------------------------------------------------------
  const tableY = 252;

  doc.setFillColor(241, 245, 249);
  doc.rect(10, tableY, 118, 36, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(10, tableY, 118, 36, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('HAWLEY METHOD B ARCH ANALYSIS SUMMARY', 13, tableY + 5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Sum of 6 Anteriors: ${geom.metrics.sumOfAnteriors.toFixed(1)} mm`, 13, tableY + 10);
  doc.text(`Bracket Allowance: ${geom.metrics.bracketAllowance.toFixed(1)} mm`, 13, tableY + 14);
  doc.text(`Corrected Sum: ${geom.metrics.correctedSum.toFixed(1)} mm`, 13, tableY + 18);
  doc.text(`Anterior Radius (r): ${geom.metrics.anteriorRadius.toFixed(2)} mm`, 13, tableY + 22);
  doc.text(`Ray Divergence: ${geom.metrics.rayDivergenceAngle.toFixed(1)}°`, 13, tableY + 26);

  doc.text(`Intercanine Span (r√3): ${geom.metrics.intercanineSpan.toFixed(1)} mm`, 68, tableY + 10);
  doc.text(`1st Premolar Span: ${geom.metrics.interpremolar1Span.toFixed(1)} mm`, 68, tableY + 14);
  doc.text(`1st Molar Span: ${geom.metrics.intermolar1Span.toFixed(1)} mm`, 68, tableY + 18);
  doc.text(`2nd Molar Span: ${geom.metrics.intermolar2Span.toFixed(1)} mm`, 68, tableY + 22);
  doc.text(`Arch Perimeter: ${geom.metrics.archPerimeter.toFixed(1)} mm`, 68, tableY + 26);

  // Faculty Sign Box
  doc.rect(130, tableY, 70, 36, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('FACULTY VERIFICATION', 133, tableY + 5);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Verified 1:1 Print Scale:  [  ] YES   [  ] NO', 133, tableY + 10);
  doc.text('Ray Divergence 42°:       [  ] Pass', 133, tableY + 15);
  doc.text('Faculty Signature: __________________', 133, tableY + 23);
  doc.text(`Date: ____________________________`, 133, tableY + 29);

  // Save PDF
  const filename = `Hawley_MethodB_Arch_${(data.patientName || 'Case').replace(/\s+/g, '_')}_${data.archType}.pdf`;
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
