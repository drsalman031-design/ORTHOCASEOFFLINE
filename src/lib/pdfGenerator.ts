import { jsPDF } from 'jspdf';
import {
  PatientRecord,
  StudentProfile,
  DownsAnalysisData,
  SteinersAnalysisData,
  RickettsAnalysisData,
  McnamaraAnalysisData,
  SchwarzTweedAnalysisData,
  HoldawayAnalysisData,
  CogsAnalysisData,
  CephDiscrepancyAnalysisData,
  VerticalJawDivergenceAnalysisData,
  SagittalVerticalInteractionAnalysisData,
  SnFhCorrectionAnalysisData,
  BonwillTemplateData,
} from '../types';
import {
  calculateBolton,
  calculateCarey,
  calculatePonts,
  calculateAshleyHowe,
} from './calculations';
import {
  calculateHawleyGeometry,
  DEFAULT_TOOTH_WIDTHS,
  hawleyInputsFromFdi,
} from '../components/bonwill/BonwillGeometry';
import {
  buildSheet1Payload,
  buildSheet1Part1Payload,
  buildSheet1Part2Payload,
  buildSheet2Payload,
  buildSheet3Payload,
  buildSheet4Payload,
  buildDiscrepancyMasterPayload1,
  buildDiscrepancyMasterPayload2,
  buildSnFhCorrectionMatrixPayload,
  buildDownsInferencePayload,
  buildSteinerInferencePayload,
  buildRickettsInferencePayload,
  buildMcNamaraInferencePayload,
  buildTweedSchwarzInferencePayload,
  buildHoldawayInferencePayload,
  buildCogsHardInferencePayload,
  buildCogsSoftInferencePayload,
  SheetInferencePoint,
} from './cephPdfInferenceHelpers';

/**
 * Builds a Professional Presentation-Slide Format Orthodontic Case & Cephalometric PDF Deck.
 * Typography & Layout Specifications:
 * - A4 Landscape format (297 mm x 210 mm, 16 mm margins).
 * - Section Header Title: Dynamic auto-scaling font size with zero clipping.
 * - Sub-Card / Group Headings: 13pt bold with distinct teal accent styling.
 * - Data Table Field Labels: Bold slate-800.
 * - Data Table Field Values: Auto-wrapped multi-line cells with dynamic row heights.
 * - Diagnostic Inferences: High-contrast, print-friendly light card theme with teal accents.
 * - Footer Metadata: 10pt muted slate text.
 */
export function buildPatientPDFDoc(patient: PatientRecord, profile: StudentProfile): jsPDF {
  const doc = new jsPDF({
    orientation: 'l',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 265 mm
  const contentHeight = pageHeight - margin * 2; // 178 mm
  let y = margin;
  let slideCount = 0;

  // Helper: Start a new slide with full presentation header (Guaranteed zero collision/overlap)
  const startNewSlide = (title: string, subtitle?: string) => {
    if (slideCount > 0) {
      doc.addPage();
    }
    slideCount++;
    y = 10;

    const barH = 17;

    // Header bar across top of slide
    doc.setFillColor(15, 23, 42); // slate-900
    doc.roundedRect(margin, y, contentWidth, barH, 2, 2, 'F');

    // Accent left stripe
    doc.setFillColor(13, 148, 136); // teal-600
    doc.roundedRect(margin, y, 4.5, barH, 2, 2, 'F');

    const titleStr = title.toUpperCase();
    const maxTitleW = contentWidth - 18;

    if (subtitle) {
      // 2-Tier Stacked Header: Title on top line, Subtitle cleanly below main title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');

      // Dynamic title font size auto-fitting to prevent any right-edge clipping
      let titleFontSize = 14.5;
      doc.setFontSize(titleFontSize);
      while (doc.getTextWidth(titleStr) > maxTitleW && titleFontSize > 8.5) {
        titleFontSize -= 0.3;
        doc.setFontSize(titleFontSize);
      }
      doc.text(titleStr, margin + 8, y + 6.8);

      // Subtitle below main title (slate-300)
      doc.setFont('helvetica', 'normal');
      let subFontSize = 9.5;
      doc.setFontSize(subFontSize);
      doc.setTextColor(203, 213, 225); // slate-300

      while (doc.getTextWidth(subtitle) > maxTitleW && subFontSize > 7.5) {
        subFontSize -= 0.25;
        doc.setFontSize(subFontSize);
      }
      const subLines = doc.splitTextToSize(subtitle, maxTitleW);
      doc.text(subLines[0] || subtitle, margin + 8, y + 13.2);
    } else {
      // Single Line Centered Title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      let titleFontSize = 17.0;
      doc.setFontSize(titleFontSize);
      while (doc.getTextWidth(titleStr) > maxTitleW && titleFontSize > 9.5) {
        titleFontSize -= 0.4;
        doc.setFontSize(titleFontSize);
      }
      doc.text(titleStr, margin + 8, y + 11.2);
    }

    y += barH + 5.5;
    doc.setTextColor(30, 41, 59);
  };

  // Helper: Render a subheader within a slide (13pt bold with accent)
  const addSubsectionHeader = (title: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(13, 148, 136); // teal-600 accent
    doc.text(title, margin + 1, y);
    doc.setDrawColor(204, 251, 241); // teal-100
    doc.setLineWidth(0.5);
    doc.line(margin + 1, y + 2.5, margin + contentWidth - 1, y + 2.5);
    y += 7.2;
    doc.setTextColor(30, 41, 59);
  };

  // Helper: 2-Column modular data card container with synchronized rows, uniform typography & balanced alignment
  const renderTwoColumnCard = (
    leftTitle: string,
    leftItems: { label: string; value: string | number | undefined | null }[],
    rightTitle: string,
    rightItems: { label: string; value: string | number | undefined | null }[],
    cardHeight = 140
  ) => {
    const colWidth = (contentWidth - 8) / 2; // 128.5 mm
    const leftX = margin;
    const rightX = margin + colWidth + 8;
    const startCardY = y;
    const headerH = 10.5;

    // Draw left & right outer card containers
    [leftX, rightX].forEach((x) => {
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.3);
      doc.roundedRect(x, startCardY, colWidth, cardHeight, 2, 2, 'FD');

      // Card header banner
      doc.setFillColor(248, 250, 252); // slate-50
      doc.roundedRect(x, startCardY, colWidth, headerH, 2, 2, 'FD');
      doc.setDrawColor(226, 232, 240);
      doc.line(x, startCardY + headerH, x + colWidth, startCardY + headerH);
    });

    // Sub-Card / Group Headings
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(13, 148, 136); // teal-600 accent
    doc.text(leftTitle, leftX + 4, startCardY + 7.0);
    doc.text(rightTitle, rightX + 4, startCardY + 7.0);

    // Synchronize row rendering across both columns for lockstep vertical alignment
    const maxRows = Math.max(leftItems.length, rightItems.length, 1);
    const availableRowsH = cardHeight - headerH - 2;
    const rowH = availableRowsH / maxRows;

    const fSize = maxRows <= 6 ? 10.2 : maxRows <= 8 ? 9.5 : 8.6;
    const fontH = fSize * 0.3528;
    const lineStep = Math.max(3.5, fontH * 1.25);
    const labelMaxW = (colWidth - 10) * 0.44;
    const valMaxW = (colWidth - 10) * 0.54;

    for (let r = 0; r < maxRows; r++) {
      const curRowY = startCardY + headerH + 1 + r * rowH;

      // Alternating zebra stripe across both columns
      if (r % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(leftX + 0.5, curRowY, colWidth - 1, rowH, 'F');
        doc.rect(rightX + 0.5, curRowY, colWidth - 1, rowH, 'F');
      }

      // Subtle bottom divider line
      if (r < maxRows - 1) {
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(leftX + 2, curRowY + rowH, leftX + colWidth - 2, curRowY + rowH);
        doc.line(rightX + 2, curRowY + rowH, rightX + colWidth - 2, curRowY + rowH);
      }

      // Helper to render a cell cleanly bounded to avoid any overlapping
      const renderCell = (
        cellX: number,
        item: { label: string; value: string | number | undefined | null } | undefined
      ) => {
        if (!item) return;

        const labelStr = String(item.label || '');
        const valStr =
          item.value !== undefined && item.value !== null && String(item.value).trim() !== ''
            ? String(item.value).trim()
            : '—';

        doc.setFontSize(fSize);
        doc.setFont('helvetica', 'bold');
        const splitLabel = doc.splitTextToSize(labelStr, labelMaxW);

        doc.setFont('helvetica', 'normal');
        const splitVal = doc.splitTextToSize(valStr, valMaxW);

        const linesCount = Math.max(splitLabel.length, splitVal.length, 1);
        const totalBlockH = (linesCount - 1) * lineStep + fontH;
        const startBaselineY = curRowY + (rowH - totalBlockH) / 2 + fontH;

        // Render Label on left
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(fSize);
        doc.setTextColor(51, 65, 85); // slate-700
        splitLabel.forEach((line: string, lIdx: number) => {
          doc.text(line, cellX + 4, startBaselineY + lIdx * lineStep);
        });

        // Render Value on right
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(fSize);
        doc.setTextColor(15, 23, 42); // slate-900
        const valX = cellX + colWidth - 4;
        splitVal.forEach((line: string, vIdx: number) => {
          doc.text(line, valX, startBaselineY + vIdx * lineStep, { align: 'right' });
        });
      };

      renderCell(leftX, leftItems[r]);
      renderCell(rightX, rightItems[r]);
    }

    y += cardHeight + 4;
  };

  // Helper: Full-Width single modular data card container with uniform typography & balanced alignment
  const renderSingleColumnCard = (
    title: string,
    items: { label: string; value: string | number | undefined | null }[],
    cardHeight = 140
  ) => {
    const cardWidth = contentWidth; // 265 mm
    const startX = margin;
    const startCardY = y;
    const headerH = 10.5;

    // Draw outer card container
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.roundedRect(startX, startCardY, cardWidth, cardHeight, 2, 2, 'FD');

    // Card header banner
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(startX, startCardY, cardWidth, headerH, 2, 2, 'FD');
    doc.setDrawColor(226, 232, 240);
    doc.line(startX, startCardY + headerH, startX + cardWidth, startCardY + headerH);

    // Group Heading
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(13, 148, 136); // teal-600 accent
    doc.text(title, startX + 6, startCardY + 7.0);

    const maxRows = Math.max(items.length, 1);
    const availableRowsH = cardHeight - headerH - 2;
    const rowH = availableRowsH / maxRows;

    const fSize = maxRows <= 4 ? 11.2 : maxRows <= 6 ? 10.5 : maxRows <= 8 ? 9.6 : 8.8;
    const fontH = fSize * 0.3528;
    const lineStep = Math.max(3.8, fontH * 1.3);
    const labelMaxW = 80; // 80 mm for label column
    const valMaxW = cardWidth - labelMaxW - 20; // ~165 mm for value column

    for (let r = 0; r < maxRows; r++) {
      const curRowY = startCardY + headerH + 1 + r * rowH;
      const item = items[r];

      // Alternating zebra stripe
      if (r % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(startX + 0.5, curRowY, cardWidth - 1, rowH, 'F');
      }

      // Subtle bottom divider line
      if (r < maxRows - 1) {
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(startX + 4, curRowY + rowH, startX + cardWidth - 4, curRowY + rowH);
      }

      if (!item) continue;

      const labelStr = String(item.label || '');
      const valStr =
        item.value !== undefined && item.value !== null && String(item.value).trim() !== ''
          ? String(item.value).trim()
          : '—';

      doc.setFontSize(fSize);
      doc.setFont('helvetica', 'bold');
      const splitLabel = doc.splitTextToSize(labelStr, labelMaxW);

      doc.setFont('helvetica', 'normal');
      const splitVal = doc.splitTextToSize(valStr, valMaxW);

      const linesCount = Math.max(splitLabel.length, splitVal.length, 1);
      const totalBlockH = (linesCount - 1) * lineStep + fontH;
      const startBaselineY = curRowY + (rowH - totalBlockH) / 2 + fontH;

      // Render Label on left
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fSize);
      doc.setTextColor(51, 65, 85); // slate-700
      splitLabel.forEach((line: string, lIdx: number) => {
        doc.text(line, startX + 6, startBaselineY + lIdx * lineStep);
      });

      // Render Value on right side of label
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fSize);
      doc.setTextColor(15, 23, 42); // slate-900
      const valX = startX + labelMaxW + 10;
      splitVal.forEach((line: string, vIdx: number) => {
        doc.text(line, valX, startBaselineY + vIdx * lineStep);
      });
    }

    y += cardHeight + 4;
  };

  // Helper: Structured Table with Zebra striping and dynamic multi-line word wrapping
  const renderSlideTable = (
    headers: string[],
    rows: (string | number)[][],
    colWidths: number[],
    alignments?: ('left' | 'center' | 'right')[],
    tableRowHeight = 7.5,
    customFontSize = 9.5
  ) => {
    const headerHeight = 8.5;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    // Table Header
    doc.setFillColor(15, 23, 42); // slate-900 header
    doc.rect(margin, y, tableWidth, headerHeight, 'F');
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.25);
    doc.rect(margin, y, tableWidth, headerHeight, 'S');

    const headerFontSize = Math.min(10.0, Math.max(8.0, customFontSize));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(headerFontSize);
    doc.setTextColor(255, 255, 255);

    let curX = margin;
    headers.forEach((h, idx) => {
      const w = colWidths[idx];
      const align = alignments?.[idx] || 'left';
      if (align === 'center') {
        doc.text(h, curX + w / 2, y + 5.8, { align: 'center' });
      } else if (align === 'right') {
        doc.text(h, curX + w - 3, y + 5.8, { align: 'right' });
      } else {
        doc.text(h, curX + 3.5, y + 5.8);
      }
      curX += w;
    });
    y += headerHeight;

    const fontH = customFontSize * 0.3528;
    const lineStep = Math.max(3.6, fontH * 1.25);

    // Body Rows with uniform font size, multi-line auto-wrap and dynamic row height
    rows.forEach((row, rIdx) => {
      // Calculate required height for this row based on all cells
      let maxCellLines = 1;
      const cellSplitTexts: string[][] = [];

      row.forEach((cell, cIdx) => {
        const w = colWidths[cIdx];
        const str = String(cell !== undefined && cell !== null ? cell : '—');
        doc.setFontSize(customFontSize);
        const splitLines = doc.splitTextToSize(str, Math.max(6, w - 5));
        cellSplitTexts.push(splitLines);
        if (splitLines.length > maxCellLines) {
          maxCellLines = splitLines.length;
        }
      });

      const effectiveRowH = Math.max(tableRowHeight, (maxCellLines - 1) * lineStep + fontH + 3.4);

      // Zebra background
      if (rIdx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.rect(margin, y, tableWidth, effectiveRowH, 'F');
      }

      // Bottom border for this row
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.2);
      doc.line(margin, y + effectiveRowH, margin + tableWidth, y + effectiveRowH);

      // Render cells
      let cellX = margin;
      row.forEach((cell, cIdx) => {
        const w = colWidths[cIdx];
        const align = alignments?.[cIdx] || 'left';
        const str = String(cell !== undefined && cell !== null ? cell : '—');
        const splitLines = cellSplitTexts[cIdx];

        // Color coding for status & inferences
        if (
          (cIdx === row.length - 1 || cIdx === row.length - 2) &&
          (str.includes('Proclin') ||
            str.includes('Retro') ||
            str.includes('Excess') ||
            str.includes('Defic') ||
            str.includes('Class II') ||
            str.includes('Class III') ||
            str.includes('Acute') ||
            str.includes('Severe') ||
            str.includes('+') ||
            str.includes('-')) &&
          !str.includes('Normal') &&
          !str.includes('Harmonious') &&
          !str.includes('0.0')
        ) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(customFontSize);
          doc.setTextColor(185, 28, 28); // red-700
        } else if (
          cIdx === row.length - 1 &&
          (str.includes('Normal') || str.includes('Class I') || str.includes('Sufficient') || str.includes('Ideal') || str.includes('Harmonious') || str.includes('Balanced'))
        ) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(customFontSize);
          doc.setTextColor(15, 118, 110); // teal-700
        } else if (cIdx === 0) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(customFontSize);
          doc.setTextColor(15, 23, 42); // slate-900
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(customFontSize);
          doc.setTextColor(51, 65, 85); // slate-700
        }

        // Render all lines inside the cell vertically centered
        const totalTextH = (splitLines.length - 1) * lineStep + fontH;
        const startBaselineY = y + (effectiveRowH - totalTextH) / 2 + fontH;

        splitLines.forEach((lineStr, lIdx) => {
          const lineY = startBaselineY + lIdx * lineStep;
          if (align === 'center') {
            doc.text(lineStr, cellX + w / 2, lineY, { align: 'center' });
          } else if (align === 'right') {
            doc.text(lineStr, cellX + w - 3, lineY, { align: 'right' });
          } else {
            doc.text(lineStr, cellX + 3.5, lineY);
          }
        });

        cellX += w;
      });

      y += effectiveRowH;
    });

    // Outer table border
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.25);
    doc.rect(margin, y - (tableWidth > 0 ? 0 : 0), tableWidth, 0, 'S');

    y += 3.5;
  };

  // Helper: Full-Slide Diagnostic Summary & Inferences Card (Clean Print-Friendly Light Theme)
  const renderFullSlideInferenceCard = (
    title: string,
    stageLabel: string,
    points: SheetInferencePoint[],
    cardHeight = 142
  ) => {
    const cardWidth = contentWidth;
    const startX = margin;
    const startCardY = y;

    // Outer container - Light Crisp Theme with subtle border
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.4);
    doc.roundedRect(startX, startCardY, cardWidth, cardHeight, 2.5, 2.5, 'FD');

    // Header banner inside card
    const bannerH = 10.5;
    doc.setFillColor(13, 148, 136); // teal-600
    doc.roundedRect(startX, startCardY, cardWidth, bannerH, 2.5, 2.5, 'FD');

    const bannerText = `DIAGNOSTIC SUMMARY & INFERENCES — ${title.toUpperCase()} (${stageLabel.toUpperCase()})`;
    let bannerFontSize = 10.0;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(bannerFontSize);
    while (doc.getTextWidth(bannerText) > cardWidth - 14 && bannerFontSize > 7.5) {
      bannerFontSize -= 0.3;
      doc.setFontSize(bannerFontSize);
    }
    doc.setTextColor(255, 255, 255);
    doc.text(bannerText, startX + 6, startCardY + 7.0);

    const availableH = cardHeight - bannerH - 6;
    const count = Math.max(points.length, 1);
    const itemBlockH = availableH / count;
    const maxItemW = cardWidth - 26;

    points.forEach((pt, idx) => {
      const itemTopY = startCardY + bannerH + 3 + idx * itemBlockH;

      // Zebra / background box for item
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252); // slate-50
        doc.roundedRect(startX + 3, itemTopY, cardWidth - 6, itemBlockH - 2, 1.5, 1.5, 'F');
      }

      // Subtle divider line between items
      if (idx > 0 && idx % 2 === 0) {
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.3);
        doc.line(startX + 4, itemTopY - 1, startX + cardWidth - 4, itemTopY - 1);
      }

      // Number badge circle
      doc.setFillColor(13, 148, 136); // teal-600
      doc.circle(startX + 8.5, itemTopY + 6.8, 3.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.0);
      doc.setTextColor(255, 255, 255);
      doc.text(String(idx + 1), startX + 8.5, itemTopY + 7.9, { align: 'center' });

      // Clean Title (strip any leading duplicate digit numbering like '1. ')
      const cleanTitle = pt.title.replace(/^\d+\.\s*/, '').toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.0);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(cleanTitle, startX + 16, itemTopY + 7.4);

      if (pt.badge) {
        const titleW = doc.getTextWidth(cleanTitle);
        const badgeW = doc.getTextWidth(pt.badge.toUpperCase()) + 6;
        const badgeX = startX + 19 + titleW;

        if (badgeX + badgeW < startX + cardWidth - 10) {
          doc.setFillColor(240, 253, 250); // teal-50
          doc.setDrawColor(13, 148, 136); // teal-600
          doc.setLineWidth(0.3);
          doc.roundedRect(badgeX, itemTopY + 3.4, badgeW, 5.2, 1.2, 1.2, 'FD');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.0);
          doc.setTextColor(13, 148, 136); // teal-600
          doc.text(pt.badge.toUpperCase(), badgeX + 3, itemTopY + 7.1);
        }
      }

      // Finding text in readable 9.2pt font with 4.5mm line spacing
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      doc.setTextColor(51, 65, 85); // slate-700

      const findingLines = doc.splitTextToSize(pt.finding, maxItemW);
      const textStartY = itemTopY + 13.5;
      const lineSpacing = 4.6;

      findingLines.forEach((fl: string, lIdx: number) => {
        doc.text(fl, startX + 16, textStartY + lIdx * lineSpacing);
      });
    });

    y += cardHeight + 4;
  };

  // Helper: Diagnostic Summary & Inferences Card with Stage Badge (Compact Light Theme)
  const renderSheetInferenceCard = (
    title: string,
    stageLabel: string,
    points: SheetInferencePoint[],
    cardH?: number
  ) => {
    const cardWidth = contentWidth;
    const startX = margin;
    const startCardY = y;
    const computedH = cardH || (Math.max(points.length, 3) * 8.2 + 15);

    // Outer container
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.roundedRect(startX, startCardY, cardWidth, computedH, 2, 2, 'FD');

    // Header banner inside card
    const bannerH = 7.5;
    doc.setFillColor(13, 148, 136); // teal-600
    doc.roundedRect(startX, startCardY, cardWidth, bannerH, 2, 2, 'FD');

    const bannerText = `DIAGNOSTIC SUMMARY & INFERENCES — ${title.toUpperCase()} (${stageLabel.toUpperCase()})`;
    let bannerFontSize = 8.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(bannerFontSize);
    while (doc.getTextWidth(bannerText) > cardWidth - 10 && bannerFontSize > 6.5) {
      bannerFontSize -= 0.25;
      doc.setFontSize(bannerFontSize);
    }
    doc.setTextColor(255, 255, 255);
    doc.text(bannerText, startX + 4, startCardY + 5.2);

    let curItemY = startCardY + bannerH + 4.2;
    const maxItemW = cardWidth - 14;

    points.forEach((pt, idx) => {
      // Number badge circle
      doc.setFillColor(13, 148, 136); // teal-600
      doc.circle(startX + 5, curItemY - 0.8, 1.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(255, 255, 255);
      doc.text(String(idx + 1), startX + 5, curItemY - 0.2, { align: 'center' });

      // Clean Title
      const cleanTitle = pt.title.replace(/^\d+\.\s*/, '').toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42); // slate-900
      const pointTitle = `${cleanTitle}${pt.badge ? ` [${pt.badge.toUpperCase()}]` : ''}: `;
      doc.text(pointTitle, startX + 9, curItemY);

      const titleW = doc.getTextWidth(pointTitle);

      // Finding text cleanly wrapped within safe width
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(51, 65, 85); // slate-700

      const firstLineAvailW = Math.max(25, maxItemW - titleW);
      const firstLines = doc.splitTextToSize(pt.finding, firstLineAvailW);

      if (firstLines.length <= 1) {
        doc.text(firstLines[0] || pt.finding, startX + 9 + titleW, curItemY);
      } else {
        doc.text(firstLines[0], startX + 9 + titleW, curItemY);
        const restFinding = pt.finding.substring(firstLines[0].length).trim();
        const restLines = doc.splitTextToSize(restFinding, maxItemW);
        restLines.forEach((rl: string) => {
          curItemY += 3.6;
          doc.text(rl, startX + 9, curItemY);
        });
      }
      curItemY += 4.5;
    });

    y += computedH + 4;
  };

  // Helper: Text Block Box with Title & Text with Word-Wrapping
  const printSlideTextBlock = (title: string, text: string | undefined | null, blockH?: number) => {
    if (!text || !text.trim()) return;
    const h = blockH || 24;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(204, 251, 241); // teal-100
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, h, 2, 2, 'FD');

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(margin, y, contentWidth, 7.5, 2, 2, 'FD');
    doc.setDrawColor(204, 251, 241);
    doc.line(margin, y + 7.5, margin + contentWidth, y + 7.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text(title, margin + 4, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59); // slate-800
    const splitT = doc.splitTextToSize(text, contentWidth - 8);
    const lineStep = 4.4;
    splitT.slice(0, 4).forEach((line: string, lIdx: number) => {
      doc.text(line, margin + 4, y + 12.0 + lIdx * lineStep);
    });

    y += h + 4;
  };

  // Helper for format detection
  const getImageFormat = (dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' => {
    if (dataUrl.includes('image/png')) return 'PNG';
    if (dataUrl.includes('image/webp')) return 'WEBP';
    return 'JPEG';
  };

  // Dedicated aspect-ratio preserving container renderer (object-fit: contain)
  const renderImageContainInDoc = (
    dataUrl: string,
    boxX: number,
    boxY: number,
    boxWidth: number,
    boxHeight: number,
    bgFill: [number, number, number] = [248, 250, 252],
    borderColor: [number, number, number] = [203, 213, 225]
  ) => {
    doc.setFillColor(bgFill[0], bgFill[1], bgFill[2]);
    doc.setDrawColor(borderColor[0], borderColor[1], borderColor[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(boxX, boxY, boxWidth, boxHeight, 2, 2, 'FD');

    let imgWidth = boxWidth;
    let imgHeight = boxHeight;
    let format = getImageFormat(dataUrl);

    try {
      const props = doc.getImageProperties(dataUrl);
      if (props && props.width > 0 && props.height > 0) {
        imgWidth = props.width;
        imgHeight = props.height;
        if (props.fileType) {
          const ft = props.fileType.toUpperCase();
          if (ft === 'PNG' || ft === 'JPEG' || ft === 'WEBP') {
            format = ft as any;
          }
        }
      }
    } catch {
      // fallback
    }

    const innerPad = 0.8;
    const availW = Math.max(1, boxWidth - innerPad * 2);
    const availH = Math.max(1, boxHeight - innerPad * 2);
    const imgRatio = imgWidth / imgHeight;
    const boxRatio = availW / availH;

    let drawW = availW;
    let drawH = availH;

    if (imgRatio > boxRatio) {
      drawW = availW;
      drawH = availW / imgRatio;
    } else {
      drawH = availH;
      drawW = availH * imgRatio;
    }

    const drawX = boxX + (boxWidth - drawW) / 2;
    const drawY = boxY + (boxHeight - drawH) / 2;

    try {
      doc.addImage(dataUrl, format, drawX, drawY, drawW, drawH);
    } catch {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text('[Image attached]', boxX + 3, boxY + boxHeight / 2);
    }
  };

  // Media aggregation
  interface ExportMediaItem {
    id: string;
    category: 'Extraoral Photo' | 'Intraoral Photo' | 'OPG' | 'Lateral Ceph' | 'Hand Wrist' | 'IOPA' | 'Occlusal' | 'CBCT' | 'Models/Scans' | 'Other';
    title: string;
    dataUrl: string;
  }
  const allMedia: ExportMediaItem[] = [];
  const addedDataUrls = new Set<string>();

  const addMedia = (item: ExportMediaItem) => {
    if (!item.dataUrl || typeof item.dataUrl !== 'string' || !item.dataUrl.trim()) return;
    const trimmed = item.dataUrl.trim();
    if (addedDataUrls.has(trimmed)) return;
    addedDataUrls.add(trimmed);
    allMedia.push({ ...item, dataUrl: trimmed });
  };

  const extraoralPhotosObj = patient.extraoralPhotos || {};
  const extraoralKeyMap: Record<string, string> = {
    frontal_rest: 'Frontal at Rest',
    frontalRest: 'Frontal at Rest',
    frontal_smile: 'Frontal Smile',
    frontalSmile: 'Frontal Smile',
    profile: 'Profile Right',
    profileRight: 'Profile Right',
    profile_left: 'Profile Left',
    profileLeft: 'Profile Left',
    oblique: '3/4 Oblique View',
    threeQuarter: '3/4 Oblique View',
    nasolabial: 'Nasolabial / Submental View',
    vto: 'Soft Tissue VTO Outcome',
  };

  Object.entries(extraoralPhotosObj).forEach(([key, val]) => {
    if (typeof val === 'string' && val.startsWith('data:image')) {
      const title = extraoralKeyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      addMedia({ id: `extraoral_${key}`, category: 'Extraoral Photo', title, dataUrl: val });
    }
  });

  const smileData = patient.smileAssessment || patient.extraoralProfile?.smileAssessment;
  if (smileData?.photoUrl && typeof smileData.photoUrl === 'string' && smileData.photoUrl.startsWith('data:image')) {
    addMedia({ id: 'smile_assessment_photo', category: 'Extraoral Photo', title: 'Smile Assessment Photo', dataUrl: smileData.photoUrl });
  }

  const intraoralPhotosObj = (patient.intraoralPhotos || patient.intraoralSection?.photos || {}) as any;
  const intraoralKeyMap: Record<string, string> = {
    front: 'Frontal View in Occlusion',
    frontal: 'Frontal View in Occlusion',
    right: 'Right Buccal / Lateral View',
    rightBuccal: 'Right Buccal / Lateral View',
    left: 'Left Buccal / Lateral View',
    leftBuccal: 'Left Buccal / Lateral View',
    upperOcclusal: 'Maxillary Occlusal View',
    upper: 'Maxillary Occlusal View',
    lowerOcclusal: 'Mandibular Occlusal View',
    lower: 'Mandibular Occlusal View',
  };

  Object.entries(intraoralPhotosObj).forEach(([key, val]) => {
    if (typeof val === 'string' && val.startsWith('data:image')) {
      const title = intraoralKeyMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      addMedia({ id: `intraoral_${key}`, category: 'Intraoral Photo', title, dataUrl: val });
    }
  });

  if (patient.investigations?.images && Array.isArray(patient.investigations.images)) {
    patient.investigations.images.forEach((img) => {
      if (img && img.dataUrl) {
        addMedia({ id: img.id || `inv_${Math.random()}`, category: img.category || 'Other', title: img.title || img.category || 'Clinical Record', dataUrl: img.dataUrl });
      }
    });
  }

  if (patient.cephLandmarkModuleData?.originalImage) {
    addMedia({ id: 'ceph_landmark_orig', category: 'Lateral Ceph', title: 'Lateral Cephalogram Radiograph', dataUrl: patient.cephLandmarkModuleData.originalImage });
  }

  // Global Radiography / Growth reference
  const rad = patient.radiographyGrowth || ({} as any);
  const getStageVal = (paramObj: any, stage: 'pre' | 'mid' | 'post' = 'pre'): number | null => {
    if (!paramObj) return null;
    const v = paramObj[stage] !== undefined && paramObj[stage] !== '' ? paramObj[stage] : paramObj.pre;
    return typeof v === 'number' && !isNaN(v) ? v : null;
  };

  // =========================================================================
  // SLIDE 1: PATIENT DEMOGRAPHICS & ADMINISTRATIVE RECORD
  // =========================================================================
  startNewSlide('1. Patient Demographics & Administrative Record', `${profile.institution || 'Department of Orthodontics'}`);

  const examDateStr = (patient as any).dateOfExamination || patient.examDate;
  const contactStr = (patient as any).contactNumber || patient.contact;

  renderTwoColumnCard(
    'Patient Identification & Contact',
    [
      { label: 'Patient Name', value: patient.name },
      { label: 'Patient Case ID', value: patient.patientId || patient.id },
      { label: 'Age / Gender', value: `${patient.age || '—'} Years / ${patient.gender || '—'}` },
      { label: 'Date of Examination', value: examDateStr ? new Date(examDateStr).toLocaleDateString() : 'Recorded' },
      { label: 'Primary Contact', value: contactStr || 'N/A' },
      { label: 'Email Address', value: patient.email || 'N/A' },
      { label: 'Residential Address', value: patient.address || 'N/A' },
    ],
    'Institutional & Academic Record',
    [
      { label: 'Institution', value: profile.institution || 'Department of Orthodontics' },
      { label: 'Department', value: profile.department || 'Orthodontics & Dentofacial Orthopedics' },
      { label: 'Treating Student', value: `${profile.studentName || 'Student Doctor'} (${profile.rollNumber || 'N/A'})` },
      { label: 'Faculty Supervisor', value: profile.supervisorName || 'Department Faculty' },
      { label: 'Academic Year', value: profile.academicYear || '2025-2029' },
      { label: 'Record Approval Status', value: patient.approvalStatus || 'DRAFT' },
      { label: 'Case Documentation Date', value: new Date().toLocaleDateString() },
    ],
    140
  );

  // =========================================================================
  // SLIDE 2: CHIEF COMPLAINT & PATIENT CASE HISTORY
  // =========================================================================
  const cc = patient.chiefComplaint || ({} as any);
  const med = patient.medicalHistory || ({} as any);
  const dent = patient.dentalHistory || ({} as any);
  const hab = (patient.habitHistory as any) || (patient as any).habits || ({} as any);

  const complaints: string[] = [];
  if (cc.irregularTeeth) complaints.push('Irregular teeth');
  if (cc.forwardTeeth) complaints.push('Forwardly placed teeth');
  if (cc.spacing) complaints.push('Spacing / Gaps');
  if (cc.crowding) complaints.push('Crowding');
  if (cc.difficultyChewing) complaints.push('Difficulty chewing');
  if (cc.aestheticConcern) complaints.push('Facial aesthetics concern');
  if (cc.pain) complaints.push('Pain / Discomfort');
  if (cc.other) complaints.push(cc.other);

  const medList: string[] = [];
  if (med.none) medList.push('No significant medical history');
  if (med.allergies) medList.push('Allergies');
  if (med.asthma) medList.push('Asthma');
  if (med.diabetes) medList.push('Diabetes');
  if (med.cardiacCondition) medList.push('Cardiac condition');
  if (med.bleedingDisorder) medList.push('Bleeding disorder');
  if (med.boneJointDisorders) medList.push('Bone/Joint disorders');
  if (med.otherMedical) medList.push(med.otherMedical);

  const dentList: string[] = [];
  if (dent.previousExtraction) dentList.push('Previous Extraction');
  if (dent.previousOrtho) dentList.push('Previous Orthodontic Treatment');
  if (dent.trauma) dentList.push('Dental Trauma');
  if (dent.restoration) dentList.push('Restorations/Fillings');

  const habList: string[] = [];
  if (hab.none) habList.push('No habits reported');
  if (hab.thumbSucking) habList.push('Thumb sucking');
  if (hab.mouthBreathing) habList.push('Mouth breathing');
  if (hab.tongueThrusting) habList.push('Tongue thrusting');
  if (hab.lipHabit) habList.push('Lip biting/sucking');
  if (hab.bruxism) habList.push('Bruxism');

  startNewSlide('2. Chief Complaint & Patient Case History', 'Clinical History Synthesis');

  renderTwoColumnCard(
    'Chief Complaint & Present Illness',
    [
      { label: 'Primary Concerns', value: complaints.join(', ') || 'Irregular alignment' },
      { label: 'Symptom Duration', value: cc.duration || 'Longstanding' },
      { label: 'Patient Motivation', value: patient.historySection?.motivationForTreatment || 'Aesthetic & Functional Improvement' },
      { label: 'Attitude Towards Treatment', value: patient.historySection?.attitudeTowardsTreatment || 'Positive / Cooperative' },
      { label: 'Additional CC Notes', value: cc.additionalNotes || 'Patient seeks alignment and bite correction.' },
    ],
    'Medical, Dental & Habit History',
    [
      { label: 'Medical Conditions', value: medList.join(', ') || 'No significant medical history' },
      { label: 'Medical Notes', value: med.medicalNotes || 'Fit for routine orthodontic therapy' },
      { label: 'Dental History', value: dentList.join(', ') || 'No prior orthodontic interventions' },
      { label: 'Dental Notes', value: dent.dentalNotes || 'Regular dental care' },
      { label: 'Habits Present', value: habList.join(', ') || 'No deleterious oral habits' },
      { label: 'Habit Duration / Status', value: hab.habitDurationNotes || 'Habit extinguished / None' },
    ],
    140
  );

  // =========================================================================
  // SLIDE 3: EXTRAORAL CLINICAL & FACIAL EXAMINATION
  // =========================================================================
  const ex = patient.extraoralProfile || patient.extraoralExam || ({} as any);

  startNewSlide('3. Extraoral Clinical & Facial Examination', 'Facial Morphology & Soft Tissue Aesthetics');

  renderTwoColumnCard(
    'Physical Build & Craniofacial Form',
    [
      { label: 'Physical Build', value: ex.built || 'Ectomorphic / Average' },
      { label: 'Body Type & Gait', value: `${ex.bodyType || 'Average'} • Gait: ${ex.gait || 'Normal'}` },
      { label: 'Height / Weight', value: ex.heightCm || ex.weightKg ? `${ex.heightCm || '—'} cm / ${ex.weightKg || '—'} kg` : 'Recorded' },
      { label: 'Head Shape', value: ex.shapeOfHead || 'Mesocephalic' },
      { label: 'Cephalic Index', value: ex.cephalicIndex || '76-80 (Normal)' },
      { label: 'Facial Form', value: ex.facialForm || 'Mesoprosopic' },
      { label: 'Facial Index', value: ex.facialIndex || '88-93 (Harmonious)' },
      { label: 'Facial Divergence', value: ex.facialDivergence || 'Orthodivergent' },
    ],
    'Facial Symmetry, Profile & Lips',
    [
      { label: 'Facial Symmetry', value: ex.symmetry || 'Grossly symmetrical' },
      { label: 'Facial Profile', value: ex.profile || 'Convex profile' },
      { label: 'Lip Posture & Competence', value: ex.lipPostureTonicity || ex.lipCompetency || 'Competent' },
      { label: 'Interlabial Gap', value: ex.interlabialGapMm !== undefined && ex.interlabialGapMm !== '' ? `${ex.interlabialGapMm} mm` : '0-2 mm (Normal)' },
      { label: 'Incisor-Stomion Gap', value: ex.incisorStomionMm !== undefined && ex.incisorStomionMm !== '' ? `${ex.incisorStomionMm} mm` : '2-3 mm at rest' },
      { label: 'Nasolabial Angle', value: ex.nasolabialAngle || '90-110° (Average)' },
      { label: 'Mentolabial Sulcus', value: ex.mentolabialSulcus || 'Average depth' },
      { label: 'Visual Treatment Objective', value: ex.vto || 'Positive soft tissue change' },
    ],
    140
  );

  // =========================================================================
  // SLIDE 4: EXTRA-ORAL PHOTOGRAPHIC EXAMINATION GALLERY
  // =========================================================================
  startNewSlide('4. Diagnostic Photographic Records: Extra-Oral Examination', 'Standard 4-View Clinical Facial Series (2×2 Landscape Grid)');

  const extraoralSlots = [
    {
      id: 'frontal_rest',
      title: '1. Frontal at Rest',
      subtitle: 'Facial thirds, symmetry & lip posture',
      url: extraoralPhotosObj.frontal_rest || extraoralPhotosObj.frontalRest || '',
    },
    {
      id: 'frontal_smile',
      title: '2. Frontal Smiling',
      subtitle: 'Smile arc, incisal show & buccal corridors',
      url: extraoralPhotosObj.frontal_smile || extraoralPhotosObj.frontalSmile || '',
    },
    {
      id: 'profile_right',
      title: '3. Lateral Profile (Right)',
      subtitle: 'Profile convexity, nasolabial angle & chin',
      url: extraoralPhotosObj.profile || extraoralPhotosObj.profileRight || '',
    },
    {
      id: 'oblique',
      title: '4. 3/4 Oblique / Lateral (Left)',
      subtitle: 'Malar projection & cheek contour',
      url: extraoralPhotosObj.oblique || extraoralPhotosObj.threeQuarter || extraoralPhotosObj.profile_left || extraoralPhotosObj.profileLeft || '',
    },
  ];

  const extraoralMediaList = allMedia.filter(m => m.category === 'Extraoral Photo');
  extraoralSlots.forEach(slot => {
    if (!slot.url) {
      const match = extraoralMediaList.find(m =>
        m.title.toLowerCase().includes(slot.id.replace('_', ' ')) ||
        m.id.toLowerCase().includes(slot.id)
      );
      if (match) slot.url = match.dataUrl;
    }
  });

  const photoCardW = (contentWidth - 8) / 2; // 128.5 mm
  const photoH = 58;
  const labelH = 8.5;
  const slotTotalH = photoH + labelH;

  const startGridY = y;
  extraoralSlots.forEach((slot, idx) => {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const cardX = margin + col * (photoCardW + 8);
    const cardY = startGridY + row * (slotTotalH + 4);

    if (slot.url && typeof slot.url === 'string' && slot.url.startsWith('data:image')) {
      renderImageContainInDoc(slot.url, cardX, cardY, photoCardW, photoH, [248, 250, 252], [203, 213, 225]);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardY, photoCardW, photoH, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('[Photo Not Uploaded]', cardX + photoCardW / 2, cardY + photoH / 2 - 1, { align: 'center' });
      doc.setFontSize(8.5);
      doc.text('Standard Clinical View', cardX + photoCardW / 2, cardY + photoH / 2 + 4, { align: 'center' });
    }

    // Label container
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY + photoH + 0.6, photoCardW, labelH, 1.5, 1.5, 'FD');

    // Title (left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const splitTitle = doc.splitTextToSize(slot.title, photoCardW * 0.55);
    doc.text(splitTitle[0] || slot.title, cardX + 3.5, cardY + photoH + 5.5);

    // Subtitle (right)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(71, 85, 105);
    const splitSub = doc.splitTextToSize(slot.subtitle, photoCardW * 0.42);
    doc.text(splitSub[0] || slot.subtitle, cardX + photoCardW - 3.5, cardY + photoH + 5.5, { align: 'right' });
  });

  // =========================================================================
  // SLIDE 4B: FACIAL THIRDS, MIDLINE & TRANSVERSE SYMMETRY ANALYSIS
  // =========================================================================
  const photoAnalysis = patient.extraoralPhotoAnalysis || {};
  const photoGuides = photoAnalysis.guides || {
    trichionY: 0.20,
    glabellaY: 0.45,
    subnasaleY: 0.70,
    mentonY: 0.95,
    midlineX: 0.50,
    vLeftOuterX: 0.15,
    vLeftInnerX: 0.38,
    vRightInnerX: 0.62,
    vRightOuterX: 0.85,
  };

  const totalSpan = Math.max(0.01, photoGuides.mentonY - photoGuides.trichionY);
  const upperThird = Math.max(0, photoGuides.glabellaY - photoGuides.trichionY);
  const middleThird = Math.max(0, photoGuides.subnasaleY - photoGuides.glabellaY);
  const lowerThird = Math.max(0, photoGuides.mentonY - photoGuides.subnasaleY);

  const upperPct = Math.round((upperThird / totalSpan) * 100);
  const middlePct = Math.round((middleThird / totalSpan) * 100);
  const lowerPct = Math.round((lowerThird / totalSpan) * 100);

  const vTotalW = Math.max(0.01, (photoGuides.vRightOuterX ?? 0.85) - (photoGuides.vLeftOuterX ?? 0.15));
  const intercanthalW = Math.max(0, (photoGuides.vRightInnerX ?? 0.62) - (photoGuides.vLeftInnerX ?? 0.38));
  const intercanthalPct = Math.round((intercanthalW / vTotalW) * 100);

  const leftHalf = Math.max(0.001, (photoGuides.midlineX ?? 0.5) - (photoGuides.vLeftOuterX ?? 0.15));
  const rightHalf = Math.max(0.001, (photoGuides.vRightOuterX ?? 0.85) - (photoGuides.midlineX ?? 0.5));
  const symmetryRatio = Math.round((Math.min(leftHalf, rightHalf) / Math.max(leftHalf, rightHalf)) * 100);

  let thirdsInterp = photoAnalysis.thirdsInterpretation;
  if (!thirdsInterp) {
    if (lowerPct > 36) thirdsInterp = `Increased Lower Facial Third (${lowerPct}% vs Norm ~33%). Hyperdivergent facial pattern tendency.`;
    else if (lowerPct < 29) thirdsInterp = `Decreased Lower Facial Third (${lowerPct}% vs Norm ~33%). Hypodivergent facial pattern tendency.`;
    else thirdsInterp = `Balanced Facial Thirds (Upper ${upperPct}%, Middle ${middlePct}%, Lower ${lowerPct}%).`;
  }

  let midlineInterp = photoAnalysis.midlineDeviation;
  if (!midlineInterp) {
    const devPct = ((photoGuides.midlineX ?? 0.5) - 0.5) * 100;
    if (Math.abs(devPct) < 0.8) midlineInterp = 'Centered / Coincident with facial midline';
    else if (devPct > 0) midlineInterp = `Facial Midline Deviated Right by ${devPct.toFixed(1)}% (~${(devPct * 0.35).toFixed(1)} mm)`;
    else midlineInterp = `Facial Midline Deviated Left by ${Math.abs(devPct).toFixed(1)}% (~${(Math.abs(devPct) * 0.35).toFixed(1)} mm)`;
  }

  let fifthsInterp = photoAnalysis.fifthsInterpretation;
  if (!fifthsInterp) {
    if (intercanthalPct > 24) fifthsInterp = `Increased Intercanthal/Alar Width (${intercanthalPct}%, Norm ~20%). Wide base tendency. Transverse symmetry: ${symmetryRatio}%.`;
    else if (intercanthalPct < 16) fifthsInterp = `Narrow Intercanthal/Alar Width (${intercanthalPct}%, Norm ~20%). Hypotelorism tendency. Transverse symmetry: ${symmetryRatio}%.`;
    else fifthsInterp = `Balanced Vertical Facial Fifths & Intercanthal Width (${intercanthalPct}%, Norm ~20%). Transverse symmetry: ${symmetryRatio}%.`;
  }

  const frontalRestUrl = extraoralPhotosObj.frontal_rest || extraoralPhotosObj.frontalRest || '';

  startNewSlide('Facial Thirds, Midline & Transverse Symmetry Analysis', 'Frontal Facial Proportions, Vertical Thirds & Transverse Symmetry');

  const thirdsPhotoW = 108;
  const thirdsPhotoH = 125;
  const thirdsLabelH = 9;
  const thirdsCardX = margin;
  const thirdsCardY = y;

  // Render Frontal Rest Photo (Left)
  if (frontalRestUrl && typeof frontalRestUrl === 'string' && frontalRestUrl.startsWith('data:image')) {
    renderImageContainInDoc(frontalRestUrl, thirdsCardX, thirdsCardY, thirdsPhotoW, thirdsPhotoH, [248, 250, 252], [203, 213, 225]);
  } else {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(thirdsCardX, thirdsCardY, thirdsPhotoW, thirdsPhotoH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('[Frontal at Rest Photo Not Uploaded]', thirdsCardX + thirdsPhotoW / 2, thirdsCardY + thirdsPhotoH / 2 - 2, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text('Frontal Landmark Proportions Record', thirdsCardX + thirdsPhotoW / 2, thirdsCardY + thirdsPhotoH / 2 + 3.5, { align: 'center' });
  }

  // Label below photo
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(thirdsCardX, thirdsCardY + thirdsPhotoH + 0.8, thirdsPhotoW, thirdsLabelH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Frontal at Rest Landmark Calibration', thirdsCardX + 4, thirdsCardY + thirdsPhotoH + 6.0);

  // Right Table Container (149 mm wide)
  const thirdsTableX = margin + thirdsPhotoW + 8;
  const thirdsTableW = contentWidth - thirdsPhotoW - 8;
  const thirdsTableH = thirdsPhotoH + thirdsLabelH + 0.8;

  // Outer Box for Table
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(thirdsTableX, thirdsCardY, thirdsTableW, thirdsTableH, 2, 2, 'FD');

  // Header Banner
  const thirdsHeaderH = 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(thirdsTableX, thirdsCardY, thirdsTableW, thirdsHeaderH, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.line(thirdsTableX, thirdsCardY + thirdsHeaderH, thirdsTableX + thirdsTableW, thirdsCardY + thirdsHeaderH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text('Live Proportions & Diagnostic Auto-Inferences', thirdsTableX + 4.5, thirdsCardY + 6.8);

  const thirdsRows = [
    { label: 'Upper Facial Third (Tr - G)', value: `${upperPct}% (Norm: ~33.3%)` },
    { label: 'Middle Facial Third (G - Sn)', value: `${middlePct}% (Norm: ~33.3%)` },
    { label: 'Lower Facial Third (Sn - Me)', value: `${lowerPct}% (Norm: ~33.3%)` },
    { label: 'Thirds Diagnostic Interpretation', value: thirdsInterp },
    { label: 'Facial Midline Position', value: midlineInterp },
    { label: 'Intercanthal / Alar Width', value: `${intercanthalPct}% of facial width (Norm: ~20%)` },
    { label: 'Transverse Facial Symmetry', value: `${symmetryRatio}% Symmetry Ratio` },
    { label: 'Vertical Fifths & Symmetry Inference', value: fifthsInterp },
  ];

  const thirdsRowCount = thirdsRows.length;
  const thirdsAvailH = thirdsTableH - thirdsHeaderH - 2;
  const thirdsSingleRowH = thirdsAvailH / thirdsRowCount;

  thirdsRows.forEach((item, rIdx) => {
    const rowY = thirdsCardY + thirdsHeaderH + 1 + rIdx * thirdsSingleRowH;

    if (rIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(thirdsTableX + 0.5, rowY, thirdsTableW - 1, thirdsSingleRowH, 'F');
    }

    if (rIdx < thirdsRowCount - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(thirdsTableX + 2, rowY + thirdsSingleRowH, thirdsTableX + thirdsTableW - 2, rowY + thirdsSingleRowH);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85);
    const splitLbl = doc.splitTextToSize(item.label, thirdsTableW * 0.42);
    doc.text(splitLbl[0] || item.label, thirdsTableX + 4, rowY + thirdsSingleRowH / 2 + 1.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    const splitVal = doc.splitTextToSize(item.value, thirdsTableW * 0.54);
    doc.text(splitVal, thirdsTableX + thirdsTableW * 0.44, rowY + (splitVal.length > 1 ? 3.8 : thirdsSingleRowH / 2 + 1.2));
  });

  // =========================================================================
  // SLIDE 5 (CONDITIONAL): SOFT TISSUE VTO MORPH ANALYSIS
  // =========================================================================
  const vtoPhotoUrl = extraoralPhotosObj.vto || (patient.extraoralPhotos as any)?.vto || '';
  const vtoComp = patient.extraoralPhotoAnalysis?.vtoComparison;
  const vtoProfilePhotoUrl = extraoralPhotosObj.profile || extraoralPhotosObj.profileRight || (patient.extraoralPhotos as any)?.profile || '';

  const hasVtoData = Boolean(
    (vtoPhotoUrl && typeof vtoPhotoUrl === 'string' && vtoPhotoUrl.startsWith('data:image')) ||
    (vtoComp && (vtoComp.overallImprovement || vtoComp.comparisonNotes || vtoComp.lipCompetence || vtoComp.chinProjection)) ||
    (patient.extraoralProfile?.vto && patient.extraoralProfile.vto !== 'None' && patient.extraoralProfile.vto.trim() !== '')
  );

  if (hasVtoData) {
    startNewSlide('5. Soft Tissue Visual Treatment Objective (VTO) & Morph', 'Side-by-Side Aesthetic Simulation & Morphological Forecast');

    const vtoW = (contentWidth - 8) / 2; // 128.5 mm
    const vtoH = 92;

    // Left: Pre-Treatment
    const preX = margin;
    if (vtoProfilePhotoUrl && typeof vtoProfilePhotoUrl === 'string' && vtoProfilePhotoUrl.startsWith('data:image')) {
      renderImageContainInDoc(vtoProfilePhotoUrl, preX, y, vtoW, vtoH, [248, 250, 252], [203, 213, 225]);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(preX, y, vtoW, vtoH, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text('[Pre-Treatment Profile Photo]', preX + vtoW / 2, y + vtoH / 2, { align: 'center' });
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(preX, y + vtoH + 0.8, vtoW, 9.5, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Pre-Treatment Baseline Lateral Profile', preX + 4, y + vtoH + 6.5);

    // Right: VTO Morph
    const postX = margin + vtoW + 8;
    if (vtoPhotoUrl && typeof vtoPhotoUrl === 'string' && vtoPhotoUrl.startsWith('data:image')) {
      renderImageContainInDoc(vtoPhotoUrl, postX, y, vtoW, vtoH, [248, 250, 252], [203, 213, 225]);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(postX, y, vtoW, vtoH, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text('[Post-Treatment VTO Simulation Morph]', postX + vtoW / 2, y + vtoH / 2, { align: 'center' });
    }

    doc.setFillColor(241, 245, 249);
    doc.roundedRect(postX, y + vtoH + 0.8, vtoW, 9.5, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('Post-Treatment Soft Tissue VTO Morph', postX + 4, y + vtoH + 6.5);

    y += vtoH + 13;
    const vtoDesc = vtoComp?.comparisonNotes || patient.extraoralProfile?.vto || 'Simulated soft tissue profile shows harmonious lip competence and improved chin projection.';
    printSlideTextBlock('VTO Morphological Analysis Notes', vtoDesc, 26);
  }

  // =========================================================================
  // SLIDE: SMILE ASSESSMENT & AESTHETIC ANALYSIS
  // =========================================================================
  const smile = patient.smileAssessment || patient.extraoralProfile?.smileAssessment || ({} as any);
  const smilePhotoUrl =
    smile.photoUrl ||
    extraoralPhotosObj.frontal_smile ||
    extraoralPhotosObj.frontalSmile ||
    '';

  startNewSlide('Smile Assessment & Aesthetic Analysis', 'Macro, Mini & Micro Aesthetic Smile Examination');

  const smilePhotoW = 108;
  const smilePhotoH = 125;
  const smileLabelH = 9;
  const photoCardX = margin;
  const photoCardY = y;

  // Render Smile Photo (Left)
  if (smilePhotoUrl && typeof smilePhotoUrl === 'string' && smilePhotoUrl.startsWith('data:image')) {
    renderImageContainInDoc(smilePhotoUrl, photoCardX, photoCardY, smilePhotoW, smilePhotoH, [248, 250, 252], [203, 213, 225]);
  } else {
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.roundedRect(photoCardX, photoCardY, smilePhotoW, smilePhotoH, 2, 2, 'FD');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(148, 163, 184);
    doc.text('[Frontal Smile Photo Not Uploaded]', photoCardX + smilePhotoW / 2, photoCardY + smilePhotoH / 2 - 2, { align: 'center' });
    doc.setFontSize(8.5);
    doc.text('Diagnostic Smile Aesthetic Record', photoCardX + smilePhotoW / 2, photoCardY + smilePhotoH / 2 + 3.5, { align: 'center' });
  }

  // Label below photo
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.roundedRect(photoCardX, photoCardY + smilePhotoH + 0.8, smilePhotoW, smileLabelH, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Frontal Aesthetic Smile View', photoCardX + 4, photoCardY + smilePhotoH + 6.0);

  // Right Table Container (149 mm wide)
  const tableX = margin + smilePhotoW + 8; // 16 + 108 + 8 = 132 mm
  const tableW = contentWidth - smilePhotoW - 8; // 265 - 116 = 149 mm
  const tableH = smilePhotoH + smileLabelH + 0.8; // 134.8 mm

  // Outer Box for Table
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(tableX, photoCardY, tableW, tableH, 2, 2, 'FD');

  // Header Banner
  const tableHeaderH = 10;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(tableX, photoCardY, tableW, tableHeaderH, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.line(tableX, photoCardY + tableHeaderH, tableX + tableW, photoCardY + tableHeaderH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text('Clinical Smile Parameters & Aesthetics Summary', tableX + 4.5, photoCardY + 6.8);

  // Formulate Midline Text
  let midlineText = smile.midlineType || 'Coinciding with Facial Midline';
  if (smile.midlineType === 'Non-coinciding') {
    const devMm = smile.midlineDeviationMm !== undefined && smile.midlineDeviationMm !== '' ? `${smile.midlineDeviationMm} mm` : 'Deviated';
    const dir = smile.midlineDeviationDirection ? ` to ${smile.midlineDeviationDirection}` : '';
    midlineText = `Non-coinciding (${devMm}${dir})`;
  }

  // Formulate Incisor Exposure
  const restExposure = smile.incisorExposureRestMm !== undefined && smile.incisorExposureRestMm !== ''
    ? `${smile.incisorExposureRestMm} mm (Norm: 2.0-3.5 mm)`
    : '2.5 mm (Normal Display)';
  const smileExposure = smile.incisorExposureSmile || 'Full crown display (100%)';

  // Gingival Exposure
  const gingivalExp = smile.gingivalExposureMm !== undefined && smile.gingivalExposureMm !== ''
    ? `${smile.gingivalExposureMm} mm ${Number(smile.gingivalExposureMm) > 2 ? '(Excessive / Gummy)' : '(Ideal ≤ 2 mm)'}`
    : '0 mm (Ideal ≤ 2 mm)';

  const smileRows = [
    { label: 'Skeletal vs Dental Midline', value: midlineText },
    { label: 'Incisor Exposure at Rest', value: restExposure },
    { label: 'Incisor Exposure on Smile', value: smileExposure },
    { label: 'Gingival Exposure on Smile', value: gingivalExp },
    { label: 'Buccal Corridor Space', value: smile.buccalCorridor || 'Normal (Harmonious negative space)' },
    { label: 'Smile Arc Curvature', value: smile.smileArc || 'Consonant (Follows lower lip)' },
    { label: 'Smile Assessment Notes', value: smile.notes || 'Consonant smile arc with symmetrical dental display and harmonious buccal corridors.' },
  ];

  const rowCount = smileRows.length;
  const availRowsH = tableH - tableHeaderH - 2;
  const singleRowH = availRowsH / rowCount;

  smileRows.forEach((item, rIdx) => {
    const rowY = photoCardY + tableHeaderH + 1 + rIdx * singleRowH;

    // Zebra striping
    if (rIdx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(tableX + 0.5, rowY, tableW - 1, singleRowH, 'F');
    }

    // Divider
    if (rIdx < rowCount - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(tableX + 2, rowY + singleRowH, tableX + tableW - 2, rowY + singleRowH);
    }

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(51, 65, 85); // slate-700
    const splitLabel = doc.splitTextToSize(item.label, tableW * 0.42);
    doc.text(splitLabel, tableX + 4, rowY + singleRowH / 2 + 1);

    // Value
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // slate-900
    const splitVal = doc.splitTextToSize(item.value, tableW * 0.54);
    const startValY = rowY + (singleRowH - (splitVal.length - 1) * 3.5) / 2 + 1;
    splitVal.forEach((line: string, lIdx: number) => {
      doc.text(line, tableX + tableW - 4, startValY + lIdx * 3.5, { align: 'right' });
    });
  });

  y += tableH + 4;

  // =========================================================================
  // SLIDE 6: FUNCTIONAL & TMJ EXAMINATION
  // =========================================================================
  const func = patient.functionalExam || ({} as any);

  startNewSlide('6. Functional & TMJ Examination', 'Stomatognathic System & Joint Dynamics');

  renderTwoColumnCard(
    'Functional Habits & Deglutition',
    [
      { label: 'Respiration / Airway', value: func.respiration || 'Nasal' },
      { label: 'Deglutition / Swallowing', value: func.deglutition || 'Mature swallow pattern' },
      { label: 'Mastication Pattern', value: func.mastication || 'Bilateral' },
      { label: 'Speech & Articulation', value: func.speech || 'Normal clear speech' },
      { label: 'Freeway Space (FWS)', value: func.fwsMm !== undefined && func.fwsMm !== '' ? `${func.fwsMm} mm` : '2-3 mm (Normal)' },
      { label: 'Maximum Mouth Opening', value: func.maxOpeningMm !== undefined && func.maxOpeningMm !== '' ? `${func.maxOpeningMm} mm` : '40-45 mm' },
    ],
    'TMJ Status, Sounds & Mandibular Kinematics',
    [
      { label: 'TMJ Pain History', value: func.tmjPain ? 'Pain reported' : 'No pain reported' },
      { label: 'Clicking / Joint Sounds', value: func.clicking ? 'Joint clicking present' : 'No joint clicking' },
      { label: 'Crepitus', value: func.crepitus ? 'Crepitus noted' : 'No crepitus' },
      { label: 'Muscle Tenderness', value: func.tendernessMuscles || 'No tenderness on palpation' },
      { label: 'Path of Mandibular Closure', value: func.pathOfClosure || 'Straight uninhibited closure' },
      { label: 'Mandibular Deviation / Deflection', value: func.deviation || 'None' },
      { label: 'CO-CR Discrepancy', value: func.coCrDiscrepancy || 'Minimal (<1mm)' },
    ],
    140
  );

  // =========================================================================
  // SLIDE 7: INTRAORAL CLINICAL EXAMINATION & STREAMLINED FDI ODONTOGRAM
  // =========================================================================
  const io = patient.intraoralExam || ({} as any);

  startNewSlide('7. Intraoral Clinical Examination & FDI Dentition', 'Soft Tissues, Arch Forms, Occlusal Relations & Full FDI Odontogram');

  renderTwoColumnCard(
    'Soft Tissues, Arch Form & Alignment',
    [
      { label: 'Oral Mucosa', value: io.mucosa || 'Healthy pink' },
      { label: 'Periodontal Status', value: io.gingiva || io.periodontalStatus || 'Good' },
      { label: 'Frenal Attachments', value: io.frenum || 'Normal' },
      { label: 'Tongue Size & Posture', value: `${io.tongueSize || 'Normal'} / ${io.tonguePosture || 'Normal resting posture'}` },
      { label: 'Maxillary Arch Form', value: io.maxArchForm || 'U-shaped' },
      { label: 'Mandibular Arch Form', value: io.mandArchForm || 'U-shaped' },
      { label: 'Arch Alignment & Symmetry', value: `${io.archAlignment || 'Crowded'} • ${io.archSymmetry || 'Symmetrical'}` },
      { label: 'Midline Relationship', value: `Upper: ${io.midlineUpper || 'Coincident'} | Lower: ${io.midlineLower || 'Coincident'}` },
    ],
    'Dentition, Anomalies & Occlusal Classification',
    [
      { label: 'Number of Teeth Present', value: `${io.numberOfTeethPresent || 32} Teeth Present` },
      { label: 'Missing / Impacted Teeth', value: `${io.missingTeeth || 'None'} / ${io.impactedTeeth || 'None'}` },
      { label: 'Deciduous / Supernumerary', value: `${io.deciduousTeeth || 'None'} / ${io.supernumeraryTeeth || 'None'}` },
      { label: 'Molar Relationship (R / L)', value: `Right: ${io.molarClassRight || 'Class I'} • Left: ${io.molarClassLeft || 'Class I'}` },
      { label: 'Canine Relationship (R / L)', value: `Right: ${io.canineClassRight || 'Class I'} • Left: ${io.canineClassLeft || 'Class I'}` },
      { label: 'Incisor Relationship', value: io.incisorRelationship || 'Class I' },
      { label: 'Overjet / Overbite', value: `Overjet: ${io.overjetMm !== undefined && io.overjetMm !== '' ? io.overjetMm + ' mm' : '2-3 mm'} • Overbite: ${io.overbiteMm !== undefined && io.overbiteMm !== '' ? io.overbiteMm + ' mm' : '2-3 mm'}` },
      { label: 'Curve of Spee & Crossbite', value: `Spee: ${io.curveOfSpeeMm !== undefined && io.curveOfSpeeMm !== '' ? io.curveOfSpeeMm + ' mm' : 'Normal'} • ${io.crossbite || 'None'}` },
    ],
    92
  );

  // Streamlined FDI Odontogram Grid
  const parseTeeth = (val: string | undefined): string[] => {
    if (!val || typeof val !== 'string') return [];
    return val.split(',').map(s => s.trim().replace(/\D/g, '')).filter(Boolean);
  };

  const parsedPresent = parseTeeth(io.teethPresentList);
  const parsedMissing = parseTeeth(io.missingTeeth);
  const parsedImpacted = parseTeeth(io.impactedTeeth);
  const parsedCaries = parseTeeth(io.cariesTeeth);
  const parsedDeciduous = parseTeeth(io.deciduousTeeth);

  const presentSet = new Set(parsedPresent.length > 0 ? parsedPresent : ['18','17','16','15','14','13','12','11','21','22','23','24','25','26','27','28','48','47','46','45','44','43','42','41','31','32','33','34','35','36','37','38']);
  const missingSet = new Set(parsedMissing);
  const impactedSet = new Set(parsedImpacted);
  const cariesSet = new Set(parsedCaries);

  const presentCount = Array.from(presentSet).filter(t => !missingSet.has(t)).length;
  const chartBoxY = y + 1.5;
  const chartBoxH = 44;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, chartBoxY, contentWidth, chartBoxH, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, chartBoxY, contentWidth, 7.5, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, chartBoxY + 7.5, margin + contentWidth, chartBoxY + 7.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(13, 148, 136); // teal-600
  doc.text('FDI DENTAL CHARTING — COMPLETE RECORD OF ALL TEETH PRESENT', margin + 4, chartBoxY + 5.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(`Total Permanent Teeth Present: ${presentCount} / 32`, margin + contentWidth - 4, chartBoxY + 5.2, { align: 'right' });

  // Grid Configuration for FDI Teeth
  const q1 = ['18', '17', '16', '15', '14', '13', '12', '11'];
  const q2 = ['21', '22', '23', '24', '25', '26', '27', '28'];
  const q4 = ['48', '47', '46', '45', '44', '43', '42', '41'];
  const q3 = ['31', '32', '33', '34', '35', '36', '37', '38'];

  const toothBoxW = 12.6;
  const toothBoxH = 9.8;
  const toothGap = 1.0;
  const midlineGap = 5.0;
  const startTeethX = margin + 30;

  const renderToothBadge = (tNum: string, posX: number, posY: number) => {
    const isPresent = presentSet.has(tNum) && !missingSet.has(tNum);
    const isImp = impactedSet.has(tNum);
    const isCar = cariesSet.has(tNum);

    if (isCar) {
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(220, 38, 38);
      doc.setLineWidth(0.4);
      doc.roundedRect(posX, posY, toothBoxW, toothBoxH, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(185, 28, 28);
      doc.text(tNum, posX + toothBoxW / 2, posY + 4.8, { align: 'center' });
      doc.setFontSize(5.8);
      doc.text('CARIES', posX + toothBoxW / 2, posY + 8.2, { align: 'center' });
    } else if (isImp) {
      doc.setFillColor(254, 243, 199);
      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.4);
      doc.roundedRect(posX, posY, toothBoxW, toothBoxH, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(180, 83, 9);
      doc.text(tNum, posX + toothBoxW / 2, posY + 4.8, { align: 'center' });
      doc.setFontSize(5.8);
      doc.text('IMPACT', posX + toothBoxW / 2, posY + 8.2, { align: 'center' });
    } else if (isPresent) {
      // Clean Present tooth box - Prominent tooth number, zero clutter
      doc.setFillColor(240, 253, 250);
      doc.setDrawColor(13, 148, 136);
      doc.setLineWidth(0.4);
      doc.roundedRect(posX, posY, toothBoxW, toothBoxH, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 118, 110);
      doc.text(tNum, posX + toothBoxW / 2, posY + 6.2, { align: 'center' });
    } else {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.roundedRect(posX, posY, toothBoxW, toothBoxH, 1.2, 1.2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.0);
      doc.setTextColor(148, 163, 184);
      doc.text(tNum, posX + toothBoxW / 2, posY + 4.8, { align: 'center' });
      doc.setFontSize(5.8);
      doc.text('MISSING', posX + toothBoxW / 2, posY + 8.2, { align: 'center' });
    }
  };

  // Maxillary Arch (Upper)
  const upperY = chartBoxY + 10.0;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('MAXILLARY', margin + 4, upperY + 4.0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.text('(UPPER ARCH)', margin + 4, upperY + 7.5);

  q1.forEach((t, i) => {
    renderToothBadge(t, startTeethX + i * (toothBoxW + toothGap), upperY);
  });

  const midlineX = startTeethX + 8 * (toothBoxW + toothGap) - toothGap + midlineGap / 2;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(midlineX, chartBoxY + 9.0, midlineX, chartBoxY + 33.0);

  q2.forEach((t, i) => {
    renderToothBadge(t, startTeethX + 8 * (toothBoxW + toothGap) + midlineGap + i * (toothBoxW + toothGap), upperY);
  });

  // Mandibular Arch (Lower)
  const lowerY = chartBoxY + 21.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('MANDIBULAR', margin + 4, lowerY + 4.0);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.0);
  doc.text('(LOWER ARCH)', margin + 4, lowerY + 7.5);

  q4.forEach((t, i) => {
    renderToothBadge(t, startTeethX + i * (toothBoxW + toothGap), lowerY);
  });

  q3.forEach((t, i) => {
    renderToothBadge(t, startTeethX + 8 * (toothBoxW + toothGap) + midlineGap + i * (toothBoxW + toothGap), lowerY);
  });

  // Legend Bar
  const legendY = chartBoxY + 33.5;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + 2, legendY, contentWidth - 4, 8.0, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text('CHART LEGEND:', margin + 4.5, legendY + 5.2);

  // Present Badge
  doc.setFillColor(240, 253, 250);
  doc.setDrawColor(13, 148, 136);
  doc.roundedRect(margin + 34, legendY + 1.8, 4.2, 4.2, 0.8, 0.8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.0);
  doc.setTextColor(13, 148, 136);
  doc.text('Present', margin + 40.0, legendY + 5.0);

  // Missing Badge
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + 58, legendY + 1.8, 4.2, 4.2, 0.8, 0.8, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Missing', margin + 64.0, legendY + 5.0);

  // Impacted Badge
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(margin + 82, legendY + 1.8, 4.2, 4.2, 0.8, 0.8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('Impacted', margin + 88.0, legendY + 5.0);

  // Caries Badge
  doc.setFillColor(254, 226, 226);
  doc.setDrawColor(220, 38, 38);
  doc.roundedRect(margin + 107, legendY + 1.8, 4.2, 4.2, 0.8, 0.8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('Carious', margin + 113.0, legendY + 5.0);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.0);
  doc.setTextColor(100, 116, 139);
  doc.text(`All Teeth Status: ${presentCount} present • ${parsedMissing.length} missing • ${parsedImpacted.length} impacted`, margin + contentWidth - 6, legendY + 5.0, { align: 'right' });

  // =========================================================================
  // SLIDE 8: INTRAORAL PHOTOGRAPHIC EXAMINATION GALLERY
  // =========================================================================
  startNewSlide('8. Diagnostic Photographic Records: Intraoral Examination', 'Standard 5-View Clinical Intraoral Series (Occlusal Intercuspation & Arch Mirror Views)');

  const intraoralSlots = [
    {
      id: 'right',
      title: '1. Right Buccal / Lateral',
      subtitle: 'Right Canine & Molar Relationship',
      url: intraoralPhotosObj.right || intraoralPhotosObj.rightBuccal || '',
    },
    {
      id: 'front',
      title: '2. Frontal View in Occlusion',
      subtitle: 'Overjet, Overbite, Midlines & Crossbite',
      url: intraoralPhotosObj.front || intraoralPhotosObj.frontal || '',
    },
    {
      id: 'left',
      title: '3. Left Buccal / Lateral View',
      subtitle: 'Left Canine & Molar Relationship',
      url: intraoralPhotosObj.left || intraoralPhotosObj.leftBuccal || '',
    },
    {
      id: 'upper',
      title: '4. Maxillary (Upper) Occlusal View',
      subtitle: 'Palatal Vault, Arch Form, Crowding & Symmetry',
      url: intraoralPhotosObj.upper || intraoralPhotosObj.upperOcclusal || '',
    },
    {
      id: 'lower',
      title: '5. Mandibular (Lower) Occlusal View',
      subtitle: 'Mandibular Arch Form, Spee & Incisal Alignment',
      url: intraoralPhotosObj.lower || intraoralPhotosObj.lowerOcclusal || '',
    },
  ];

  const intraoralMediaList = allMedia.filter(m => m.category === 'Intraoral Photo');
  intraoralSlots.forEach(slot => {
    if (!slot.url) {
      const match = intraoralMediaList.find(m =>
        m.title.toLowerCase().includes(slot.id.replace('_', ' ')) ||
        m.id.toLowerCase().includes(slot.id)
      );
      if (match) slot.url = match.dataUrl;
    }
  });

  const photoCardW3 = (contentWidth - 12) / 3; // 81.6 mm
  const photoH3 = 54;
  const photoCardW2 = (contentWidth - 8) / 2; // 128.5 mm
  const photoH2 = 58;
  const intraLabelH = 8.0;

  // Row 1: 3 views
  const row1StartY = y;
  [intraoralSlots[0], intraoralSlots[1], intraoralSlots[2]].forEach((slot, idx) => {
    const cardX = margin + idx * (photoCardW3 + 6);
    const cardY = row1StartY;

    if (slot.url && typeof slot.url === 'string' && slot.url.startsWith('data:image')) {
      renderImageContainInDoc(slot.url, cardX, cardY, photoCardW3, photoH3, [248, 250, 252], [203, 213, 225]);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardY, photoCardW3, photoH3, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(148, 163, 184);
      doc.text('[Photo Not Uploaded]', cardX + photoCardW3 / 2, cardY + photoH3 / 2 - 1, { align: 'center' });
      doc.setFontSize(8.0);
      doc.text('Standard Clinical View', cardX + photoCardW3 / 2, cardY + photoH3 / 2 + 4, { align: 'center' });
    }

    // Label container
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY + photoH3 + 0.6, photoCardW3, intraLabelH, 1.2, 1.2, 'FD');

    // Title (left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const splitTitle3 = doc.splitTextToSize(slot.title, photoCardW3 * 0.55);
    doc.text(splitTitle3[0] || slot.title, cardX + 3.0, cardY + photoH3 + 5.2);

    // Subtitle (right)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.0);
    doc.setTextColor(71, 85, 105);
    const splitSub3 = doc.splitTextToSize(slot.subtitle, photoCardW3 * 0.42);
    doc.text(splitSub3[0] || slot.subtitle, cardX + photoCardW3 - 3.0, cardY + photoH3 + 5.2, { align: 'right' });
  });

  // Row 2: 2 Occlusal views
  const row2StartY = row1StartY + photoH3 + intraLabelH + 4;
  [intraoralSlots[3], intraoralSlots[4]].forEach((slot, idx) => {
    const cardX = margin + idx * (photoCardW2 + 8);
    const cardY = row2StartY;

    if (slot.url && typeof slot.url === 'string' && slot.url.startsWith('data:image')) {
      renderImageContainInDoc(slot.url, cardX, cardY, photoCardW2, photoH2, [248, 250, 252], [203, 213, 225]);
    } else {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.roundedRect(cardX, cardY, photoCardW2, photoH2, 2, 2, 'FD');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(148, 163, 184);
      doc.text('[Photo Not Uploaded]', cardX + photoCardW2 / 2, cardY + photoH2 / 2 - 1, { align: 'center' });
      doc.setFontSize(8.5);
      doc.text('Standard Occlusal Mirror View', cardX + photoCardW2 / 2, cardY + photoH2 / 2 + 4, { align: 'center' });
    }

    // Label container
    doc.setFillColor(241, 245, 249);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY + photoH2 + 0.6, photoCardW2, intraLabelH, 1.2, 1.2, 'FD');

    // Title (left)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    const splitTitle2 = doc.splitTextToSize(slot.title, photoCardW2 * 0.55);
    doc.text(splitTitle2[0] || slot.title, cardX + 3.5, cardY + photoH2 + 5.2);

    // Subtitle (right)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(71, 85, 105);
    const splitSub2 = doc.splitTextToSize(slot.subtitle, photoCardW2 * 0.42);
    doc.text(splitSub2[0] || slot.subtitle, cardX + photoCardW2 - 3.5, cardY + photoH2 + 5.2, { align: 'right' });
  });

  // =========================================================================
  // SLIDE 9: RADIOGRAPHIC FINDINGS & SKELETAL GROWTH MATURATION
  // =========================================================================
  startNewSlide('9. Radiographic Findings & Skeletal Growth Maturation', 'Cervical Vertebral & Hand-Wrist Skeletal Staging');

  renderTwoColumnCard(
    'Radiographic Pathologies & Anatomical Findings',
    [
      { label: 'OPG Panoramic Report', value: rad.opgFindings || 'All permanent teeth present, healthy condylar anatomy & alveolar crests' },
      { label: 'Lateral Cephalogram', value: rad.lateralCephFindings || 'Skeletal Class I/II relationship, vertical and sagittal balance evaluated' },
      { label: 'IOPA Findings', value: rad.iopaFindings || 'Intact root structure and normal lamina dura' },
      { label: 'Hand-Wrist Radiograph', value: rad.handWristFindings || 'Normal ossification centers' },
      { label: 'CBCT / Specialized Imaging', value: rad.otherRadFindings || 'None indicated' },
    ],
    'Skeletal Growth Maturation Assessment',
    [
      { label: 'SMI Stage (Fishman Hand-Wrist)', value: rad.smiStage || 'SMI 4-6 (Accelerating growth)' },
      { label: 'CVM Stage (Baccetti Cervical)', value: rad.cvmStage || 'CS3 / CS4 (Peak pubertal spurt)' },
      { label: 'Pubertal Growth Status', value: rad.pubertalStatus || 'Peak Growth Spurt' },
      { label: 'Growth Potential Remaining', value: rad.pubertalStatus?.includes('Peak') ? 'High Growth Potential (Favorable for Orthopedics)' : 'Adult Phase (Dentoalveolar / Surgical)' },
      { label: 'Growth Modification Window', value: 'Favorable for functional appliance / maxillary expansion' },
    ],
    140
  );

  // =========================================================================
  // SLIDE 10: DIAGNOSTIC RADIOGRAPHIC RECORDS (OPG & LATERAL CEPH)
  // =========================================================================
  startNewSlide('10. Diagnostic Radiographic Records (OPG & Lateral Cephalogram)', 'High-Resolution Diagnostic Imaging Series');

  const opgImages = allMedia.filter(m => m.category === 'OPG');
  const cephImages = allMedia.filter(m => m.category === 'Lateral Ceph');

  const opgUrl = opgImages[0]?.dataUrl || (patient.radiographyGrowth as any)?.opgImage || (patient.investigations as any)?.opgImage || '';
  const cephUrl = patient.cephLandmarkModuleData?.originalImage || cephImages[0]?.dataUrl || (patient.radiographyGrowth as any)?.lateralCephImage || '';

  const radCardW = (contentWidth - 8) / 2; // 128.5 mm
  const radCardH = 96;

  // Left: OPG
  if (opgUrl && typeof opgUrl === 'string' && opgUrl.startsWith('data:image')) {
    renderImageContainInDoc(opgUrl, margin, y, radCardW, radCardH, [15, 23, 42], [51, 65, 85]);
  } else {
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(51, 65, 85);
    doc.roundedRect(margin, y, radCardW, radCardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(226, 232, 240);
    doc.text('Orthopantomogram (OPG)', margin + radCardW / 2, y + radCardH / 2 - 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('[Digital OPG Record Attached]', margin + radCardW / 2, y + radCardH / 2 + 5, { align: 'center' });
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, y + radCardH + 0.8, radCardW, 9.5, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Orthopantomogram (OPG) Panoramic Radiograph', margin + 3.5, y + radCardH + 6.5);

  // Right: Lateral Ceph
  const cephX = margin + radCardW + 8;
  if (cephUrl && typeof cephUrl === 'string' && cephUrl.startsWith('data:image')) {
    renderImageContainInDoc(cephUrl, cephX, y, radCardW, radCardH, [15, 23, 42], [51, 65, 85]);
  } else {
    doc.setFillColor(15, 23, 42);
    doc.setDrawColor(51, 65, 85);
    doc.roundedRect(cephX, y, radCardW, radCardH, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(226, 232, 240);
    doc.text('Lateral Cephalogram', cephX + radCardW / 2, y + radCardH / 2 - 2, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('[Digital Lateral Ceph Attached]', cephX + radCardW / 2, y + radCardH / 2 + 5, { align: 'center' });
  }

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(cephX, y + radCardH + 0.8, radCardW, 9.5, 1.5, 1.5, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Standard Lateral Cephalometric Radiograph', cephX + 3.5, y + radCardH + 6.5);

  y += radCardH + 13;
  printSlideTextBlock('Radiographic Clinical Findings', `${rad.opgFindings || 'All teeth present, healthy alveolar crests.'} • ${rad.lateralCephFindings || 'ANB: 2°, SNA: 82°, SNB: 80°.'}`, 22);

  // =========================================================================
  // SLIDE 11: STUDY MODEL ANALYSIS & ARCH DISCREPANCY INFERENCES
  // =========================================================================
  const ma = patient.modelAnalysis || ({} as any);
  const toothWidths = ma.toothWidths || {};
  const bolton = calculateBolton(toothWidths);
  const careyUpper = calculateCarey(toothWidths, ma.maxillaryArchLengthAvailable ?? '');
  const ponts = calculatePonts(toothWidths);
  const ttm = bolton.max12 > 0 ? bolton.max12 : careyUpper.totalToothMaterial;
  const ashleyHowe = calculateAshleyHowe(ma.premolarBasalArchWidth ?? '', ttm);

  startNewSlide('11. Study Model Analysis & Arch Discrepancy Inferences', 'Mesiodistal Tooth Material & Mathematical Arch Indices');

  // FDI Tooth Width Table
  const formatWidth = (t: string) => (toothWidths[t] !== undefined && toothWidths[t] !== '' ? Number(toothWidths[t]).toFixed(1) : '—');
  addSubsectionHeader('Mesiodistal Tooth Width Grid (mm - FDI Notation)');

  renderSlideTable(
    ['Arch (FDI)', '17 (M2)', '16 (M1)', '15 (P2)', '14 (P1)', '13 (C)', '12 (I2)', '11 (I1)', '21 (I1)', '22 (I2)', '23 (C)', '24 (P1)', '25 (P2)', '26 (M1)', '27 (M2)'],
    [
      [
        'Maxillary (17-27)',
        formatWidth('17'), formatWidth('16'), formatWidth('15'), formatWidth('14'), formatWidth('13'), formatWidth('12'), formatWidth('11'),
        formatWidth('21'), formatWidth('22'), formatWidth('23'), formatWidth('24'), formatWidth('25'), formatWidth('26'), formatWidth('27')
      ],
      [
        'Mandibular (47-37)',
        formatWidth('47'), formatWidth('46'), formatWidth('45'), formatWidth('44'), formatWidth('43'), formatWidth('42'), formatWidth('41'),
        formatWidth('31'), formatWidth('32'), formatWidth('33'), formatWidth('34'), formatWidth('35'), formatWidth('36'), formatWidth('37')
      ],
    ],
    [41, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16, 16],
    ['left', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center', 'center'],
    7.5,
    9.5
  );

  // Automated Model Analyses Results Table
  addSubsectionHeader('Automated Model Analyses Summary & Inferences');

  const modelRows: (string | number)[][] = [
    [
      "Carey's Arch Perimeter",
      careyUpper.totalToothMaterial > 0 ? `${careyUpper.totalToothMaterial.toFixed(1)} mm` : '—',
      ma.maxillaryArchLengthAvailable ? `${Number(ma.maxillaryArchLengthAvailable).toFixed(1)} mm` : '—',
      careyUpper.discrepancy !== null ? `${careyUpper.discrepancy > 0 ? '+' : ''}${careyUpper.discrepancy.toFixed(1)} mm` : '—',
      careyUpper.inference
    ],
    [
      "Bolton's Anterior Ratio",
      bolton.mand6 > 0 && bolton.max6 > 0 ? `${bolton.mand6.toFixed(1)} / ${bolton.max6.toFixed(1)}` : '—',
      '77.2%',
      bolton.anteriorRatio !== null ? `${bolton.anteriorRatio.toFixed(1)}%` : '—',
      bolton.anteriorInference
    ],
    [
      "Bolton's Overall Ratio",
      bolton.mand12 > 0 && bolton.max12 > 0 ? `${bolton.mand12.toFixed(1)} / ${bolton.max12.toFixed(1)}` : '—',
      '91.3%',
      bolton.overallRatio !== null ? `${bolton.overallRatio.toFixed(1)}%` : '—',
      bolton.overallInference
    ],
    [
      "Pont's Arch Width",
      `PM: ${ponts.measuredPremolarWidth.toFixed(1)} | M: ${ponts.measuredMolarWidth.toFixed(1)}`,
      ponts.calculatedMPV ? `MPV: ${ponts.calculatedMPV.toFixed(1)} | MMV: ${ponts.calculatedMMV?.toFixed(1)}` : 'Calculated Index',
      ponts.premolarExpansionNeeded !== null ? `${ponts.premolarExpansionNeeded.toFixed(1)} mm PM exp` : '—',
      ponts.inference
    ],
    [
      "Ashley-Howe's Analysis",
      ashleyHowe.pmbaRatio !== null ? `PMBAW: ${ma.premolarBasalArchWidth ?? 'N/A'} mm` : '—',
      '> 44.0%',
      ashleyHowe.pmbaRatio !== null ? `${ashleyHowe.pmbaRatio.toFixed(1)}%` : '—',
      ashleyHowe.inference
    ],
  ];

  renderSlideTable(
    ['Analysis Model', 'Measured Value', 'Standard / Norm', 'Discrepancy', 'Diagnostic Clinical Inference'],
    modelRows,
    [52, 42, 38, 38, 95],
    ['left', 'center', 'center', 'center', 'left'],
    8.5,
    10.5
  );

  // =========================================================================
  // SLIDES 12 & 13: BONWILL-HAWLEY ARCH FORM (MAXILLARY & MANDIBULAR)
  // EXACT 1:1 TRUE-SCALE PRINTABLE ARCHWIRE TEMPLATE WITH ZERO COLLISION
  // =========================================================================
  const renderBonwillPrintableSlide = (archJaw: 'Maxillary' | 'Mandibular', slideIndex: string) => {
    const fdiData = hawleyInputsFromFdi(toothWidths, archJaw);
    const templateInput: Partial<BonwillTemplateData> = {
      patientName: patient.name || 'Patient',
      patientId: patient.patientId || patient.id || 'N/A',
      archType: archJaw,
      sumOfAnteriors: fdiData ? fdiData.sumOfAnteriors : (archJaw === 'Maxillary' ? 45.0 : 38.0),
      bracketAllowance: 3.0,
      toothWidthsAnterior: fdiData ? fdiData.toothWidthsAnterior : DEFAULT_TOOTH_WIDTHS,
    };

    const geom = calculateHawleyGeometry(templateInput);

    startNewSlide(
      `${slideIndex}. Bonwill-Hawley Arch Form Predetermination: ${archJaw} Arch`,
      `Hawley's Original Method B (1:1 True-Scale Vector Template for Student Wire Bending & Hawley Retainer Fabrication)`
    );

    const leftColW = 142;
    const rightColW = 115;
    const colGap = 8;
    const leftX = margin;
    const rightX = margin + leftColW + colGap;
    const startY = y;

    // --- LEFT COLUMN: 1:1 TRUE SCALE VECTOR DIAGRAM & CALIBRATION BOX ---
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.roundedRect(leftX, startY, leftColW, 154, 2, 2, 'FD');

    // Calibration Banner & Warning
    doc.setFillColor(254, 242, 242); // red-50
    doc.setDrawColor(239, 68, 68); // red-500
    doc.roundedRect(leftX + 2, startY + 2, leftColW - 4, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(185, 28, 28); // red-700
    doc.text('CRITICAL 1:1 TRUE-SCALE PRINT INSTRUCTION FOR ARCHWIRE BENDING:', leftX + 5, startY + 6.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(153, 27, 27);
    doc.text(
      'Print at 100% / Actual Size (DO NOT select "Fit to Page"). Verify 20mm Calibration Box with physical calipers.',
      leftX + 5,
      startY + 11.2
    );

    // Physical Caliper Scale Verification Blocks (20x20 mm & 10x10 mm)
    const calibBoxX = leftX + 4;
    const calibBoxY = startY + 17;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.4);
    doc.rect(calibBoxX, calibBoxY, 20, 20, 'FD');

    doc.setDrawColor(203, 213, 225);
    doc.rect(calibBoxX + 5, calibBoxY + 5, 10, 10, 'S');

    // Center Crosshairs
    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.2);
    doc.line(calibBoxX + 10, calibBoxY, calibBoxX + 10, calibBoxY + 20);
    doc.line(calibBoxX, calibBoxY + 10, calibBoxX + 20, calibBoxY + 10);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.0);
    doc.setTextColor(15, 23, 42);
    doc.text('20 x 20 mm', calibBoxX + 22, calibBoxY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Caliper Verification Target', calibBoxX + 22, calibBoxY + 10.0);
    doc.text('Tolerance: ± 0.2 mm', calibBoxX + 22, calibBoxY + 14.5);
    doc.text('1:1 Exact Physical Scale', calibBoxX + 22, calibBoxY + 19.0);

    // 50 mm Horizontal Physical Reference Ruler
    const rulerX = leftX + 72;
    const rulerY = startY + 21;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.35);
    doc.line(rulerX, rulerY + 8, rulerX + 50, rulerY + 8);

    for (let mm = 0; mm <= 50; mm += 1) {
      const rx = rulerX + mm;
      let tickH = 1.2;
      if (mm % 10 === 0) {
        tickH = 4.0;
        doc.setFontSize(6.0);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(`${mm}`, rx - 1.5, rulerY + 3);
      } else if (mm % 5 === 0) {
        tickH = 2.5;
      }
      doc.setLineWidth(mm % 10 === 0 ? 0.3 : 0.12);
      doc.line(rx, rulerY + 8, rx, rulerY + 8 - tickH);
    }
    doc.setFontSize(6.0);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('50 mm Physical Reference Ruler', rulerX + 8, rulerY + 13.5);

    // -------------------------------------------------------------
    // MILLIMETER GRAPH CANVAS (1:1 TRUE PHYSICAL SCALE)
    // -------------------------------------------------------------
    const canvasFrameX = leftX + 4;
    const canvasFrameY = startY + 39;
    const canvasW = leftColW - 8; // 134 mm
    const canvasH = 111;

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.4);
    doc.rect(canvasFrameX, canvasFrameY, canvasW, canvasH, 'FD');

    const originX = canvasFrameX + canvasW / 2; // Midline X
    const originY = canvasFrameY + 24; // Apex A (0,0)

    // 1mm, 5mm, 10mm Graph Grid
    for (let x = -60; x <= 60; x += 1) {
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

    for (let yVal = -15; yVal <= 85; yVal += 1) {
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

    // Midline Symmetry Axis (Red dashed line)
    doc.setDrawColor(225, 29, 72); // rose-600
    doc.setLineWidth(0.3);
    doc.setLineDashPattern([1.5, 1.5], 0);
    doc.line(originX, canvasFrameY, originX, canvasFrameY + canvasH);
    doc.setLineDashPattern([], 0);

    // Map point to PDF coordinates
    const toSlidePt = (pt: { x: number; y: number }) => ({
      x: originX + pt.x,
      y: originY - pt.y,
    });

    // Bonwill Equilateral Triangle (100mm side, 60° angles)
    const tri = geom.bonwillTriangle;
    const pA = toSlidePt(tri.apexA);
    const pB = toSlidePt(tri.vertexB);
    const pC = toSlidePt(tri.vertexC);

    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.25);
    doc.setLineDashPattern([2, 1.5], 0);
    doc.line(pA.x, pA.y, pB.x, pB.y);
    doc.line(pA.x, pA.y, pC.x, pC.y);
    doc.line(pB.x, pB.y, pC.x, pC.y);
    doc.setLineDashPattern([], 0);

    // Construction Circles (Inner radius r, Outer radius 2r)
    const centerB = toSlidePt(geom.pointB);
    doc.setDrawColor(56, 189, 248); // sky-400
    doc.setLineWidth(0.15);
    doc.ellipse(centerB.x, centerB.y, geom.r, geom.r, 'S');

    doc.setDrawColor(192, 132, 252); // purple-400
    doc.setLineWidth(0.12);
    doc.ellipse(centerB.x, centerB.y, 2 * geom.r, 2 * geom.r, 'S');

    // 42° Divergence Posterior Rays
    const cL = toSlidePt(geom.canineLeft);
    const rayEndL = toSlidePt(geom.leftRayPoints[1]);
    const cR = toSlidePt(geom.canineRight);
    const rayEndR = toSlidePt(geom.rightRayPoints[1]);

    doc.setDrawColor(249, 115, 22); // orange-500
    doc.setLineWidth(0.3);
    doc.line(cL.x, cL.y, rayEndL.x, rayEndL.y);
    doc.line(cR.x, cR.y, rayEndR.x, rayEndR.y);

    // 120° Anterior Incisal Arc (Heavy Bold Wire Guideline - Teal)
    doc.setDrawColor(13, 148, 136); // teal-600
    doc.setLineWidth(0.85);
    const arcPts = geom.anteriorArcPoints;
    for (let i = 0; i < arcPts.length - 1; i++) {
      const p1 = toSlidePt(arcPts[i]);
      const p2 = toSlidePt(arcPts[i + 1]);
      doc.line(p1.x, p1.y, p2.x, p2.y);
    }

    // Full Arch Form Path (Blue outline)
    doc.setDrawColor(2, 132, 199); // sky-600
    doc.setLineWidth(0.45);
    const fullPts = geom.fullArchPath;
    for (let i = 0; i < fullPts.length - 1; i++) {
      const p1 = toSlidePt(fullPts[i]);
      const p2 = toSlidePt(fullPts[i + 1]);
      doc.line(p1.x, p1.y, p2.x, p2.y);
    }

    // Transverse Width Guidelines (Intercanine Span with Clean Dynamic Pill)
    const pCL = toSlidePt(geom.canineLeft);
    const pCR = toSlidePt(geom.canineRight);
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(pCL.x, pCL.y, pCR.x, pCR.y);
    doc.setLineDashPattern([], 0);

    // Solid white badge pill for C-C' Span (drawn before landmarks so text is never covered)
    const badgeW = Math.min(22, Math.max(14, geom.metrics.intercanineSpan - 4));
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(13, 148, 136);
    doc.setLineWidth(0.2);
    doc.roundedRect(originX - badgeW / 2, pCL.y - 3.8, badgeW, 4.8, 1, 1, 'FD');

    doc.setFontSize(5.0);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136);
    doc.text(`C-C' Span: ${geom.metrics.intercanineSpan.toFixed(1)} mm`, originX, pCL.y - 0.6, { align: 'center' });

    // Tooth Landmarks with STAGGERED ZERO-COLLISION OFFSETS
    const isUpper = archJaw === 'Maxillary';
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
      const p = toSlidePt(item.point);
      const isApex = item.key === 'pointA';
      const isCanine = item.key === 'canineLeft' || item.key === 'canineRight';
      const isPointO = item.key === 'pointOLeft' || item.key === 'pointORight';

      doc.setFillColor(isApex ? 225 : isCanine ? 16 : isPointO ? 168 : 2, isApex ? 29 : isCanine ? 185 : isPointO ? 85 : 132, isApex ? 72 : isCanine ? 129 : isPointO ? 247 : 199);
      doc.circle(p.x, p.y, isApex ? 1.3 : isCanine ? 1.1 : 0.8, 'F');

      const labelText = toothLabels[item.key] || item.label;
      doc.setFontSize(5.2);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);

      // Staggered offsets to eliminate label collision along 42-degree rays
      let offX = 0;
      let offY = 0;

      if (isApex) {
        offX = -8;
        offY = -2.2;
      } else if (item.key === 'canineLeft') {
        offX = -13;
        offY = -0.5;
      } else if (item.key === 'canineRight') {
        offX = 3.5;
        offY = -0.5;
      } else if (item.key === 'premolar1Left') {
        offX = -14;
        offY = -1.2;
      } else if (item.key === 'premolar1Right') {
        offX = 3.5;
        offY = -1.2;
      } else if (item.key === 'premolar2Left') {
        offX = -14;
        offY = 2.4;
      } else if (item.key === 'premolar2Right') {
        offX = 3.5;
        offY = 2.4;
      } else if (item.key === 'molar1Left') {
        offX = -14;
        offY = -1.2;
      } else if (item.key === 'molar1Right') {
        offX = 3.5;
        offY = -1.2;
      } else if (item.key === 'molar2Left') {
        offX = -14;
        offY = 2.4;
      } else if (item.key === 'molar2Right') {
        offX = 3.5;
        offY = 2.4;
      } else if (item.key === 'pointOLeft') {
        offX = 2.5;
        offY = -3.5;
      } else if (item.key === 'pointORight') {
        offX = -6.5;
        offY = -3.5;
      } else {
        offX = item.isRight ? 3.5 : -12;
        offY = 1.5;
      }

      doc.text(labelText, p.x + offX, p.y + offY);
    });

    // --- RIGHT COLUMN: ARCH METRICS, STUDENT WIRE BENDING PROTOCOL & GRADING RUBRIC ---
    let rightY = startY;

    // Card 1: Hawley Method B Geometry & Dimension Card
    const metricsCardH = 48;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(rightX, rightY, rightColW, metricsCardH, 2, 2, 'FD');

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightX, rightY, rightColW, 8.5, 2, 2, 'FD');
    doc.setDrawColor(203, 213, 225);
    doc.line(rightX, rightY + 8.5, rightX + rightColW, rightY + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(13, 148, 136); // teal-600
    doc.text(`1. Hawley Method B Arch Dimensions (${archJaw})`, rightX + 3.5, rightY + 5.8);

    doc.setFontSize(7.2);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);

    const mY = rightY + 13;
    const col2X = rightX + 64;

    // Row 1
    doc.setFont('helvetica', 'normal');
    doc.text(`• Sum of 6 Anteriors:`, rightX + 3.5, mY);
    doc.setFont('helvetica', 'bold');
    doc.text(`${geom.metrics.sumOfAnteriors.toFixed(1)} mm`, rightX + 42, mY);

    doc.setFont('helvetica', 'normal');
    doc.text(`• Bracket Allowance:`, col2X, mY);
    doc.setFont('helvetica', 'bold');
    doc.text(`+${geom.metrics.bracketAllowance.toFixed(1)} mm`, col2X + 38, mY);

    // Row 2
    doc.setFont('helvetica', 'normal');
    doc.text(`• Corrected Sum (C):`, rightX + 3.5, mY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${geom.metrics.correctedSum.toFixed(1)} mm`, rightX + 42, mY + 6);

    doc.setFont('helvetica', 'normal');
    doc.text(`• Anterior Arc Radius:`, col2X, mY + 6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 148, 136);
    doc.text(`${geom.metrics.anteriorRadius.toFixed(2)} mm`, col2X + 38, mY + 6);

    // Row 3
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(`• Intercanine Span:`, rightX + 3.5, mY + 12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${geom.metrics.intercanineSpan.toFixed(1)} mm`, rightX + 42, mY + 12);

    doc.setFont('helvetica', 'normal');
    doc.text(`• 1st Premolar Span:`, col2X, mY + 12);
    doc.setFont('helvetica', 'bold');
    doc.text(`${geom.metrics.interpremolar1Span.toFixed(1)} mm`, col2X + 38, mY + 12);

    // Row 4
    doc.setFont('helvetica', 'normal');
    doc.text(`• 1st Molar Span (6-6):`, rightX + 3.5, mY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${geom.metrics.intermolar1Span.toFixed(1)} mm`, rightX + 42, mY + 18);

    doc.setFont('helvetica', 'normal');
    doc.text(`• 2nd Molar Span (7-7):`, col2X, mY + 18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${geom.metrics.intermolar2Span.toFixed(1)} mm`, col2X + 38, mY + 18);

    // Row 5
    doc.setFont('helvetica', 'normal');
    doc.text(`• Posterior Divergence:`, rightX + 3.5, mY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`42.0° (21° bi)`, rightX + 42, mY + 24);

    doc.setFont('helvetica', 'normal');
    doc.text(`• Arch Perimeter:`, col2X, mY + 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${geom.metrics.archPerimeter.toFixed(1)} mm`, col2X + 38, mY + 24);

    rightY += metricsCardH + 3.5;

    // Card 2: Student Wire Bending & Fabrication Protocol
    const protoCardH = 58;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(rightX, rightY, rightColW, protoCardH, 2, 2, 'FD');

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightX, rightY, rightColW, 8.5, 2, 2, 'FD');
    doc.setDrawColor(203, 213, 225);
    doc.line(rightX, rightY + 8.5, rightX + rightColW, rightY + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(13, 148, 136);
    doc.text('2. Student Laboratory Wire Bending Protocol', rightX + 3.5, rightY + 5.8);

    const steps = [
      '1. Calibrate Sheet: Confirm 20mm calibration box measures 20.0mm with digital calipers.',
      '2. Wire Selection: Use 0.028" (0.7mm) or 0.032" (0.8mm) round hard stainless steel wire.',
      '3. Anterior 120° Arc: Contour anterior arc from Canine C to C\' using bird-beak/turret pliers.',
      '4. Canine U-Loops: Mark C & C\' points; form vertical U-loops resting in canine interdental embrasure.',
      '5. Posterior Divergence: Form straight posterior legs along the 42° rays through premolars & molars.',
      '6. Flatness & Symmetry: Overlay wire on the printed template; check flat seating on glass slab.',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.0);
    doc.setTextColor(51, 65, 85);
    steps.forEach((step, sIdx) => {
      doc.text(step, rightX + 3.5, rightY + 13.5 + sIdx * 7.2);
    });

    rightY += protoCardH + 3.5;

    // Card 3: Practical Assessment Checklist
    const checkCardH = 41;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(rightX, rightY, rightColW, checkCardH, 2, 2, 'FD');

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(rightX, rightY, rightColW, 8.5, 2, 2, 'FD');
    doc.setDrawColor(203, 213, 225);
    doc.line(rightX, rightY + 8.5, rightX + rightColW, rightY + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(13, 148, 136);
    doc.text('3. Practical Assessment & Sign-Off Checklist', rightX + 3.5, rightY + 5.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(51, 65, 85);
    doc.text('[ ] 1:1 Scale Caliper Verified', rightX + 3.5, rightY + 13.5);
    doc.text('[ ] Anterior 120° Arc Symmetry (±0.5mm)', col2X - 6, rightY + 13.5);
    doc.text('[ ] Canine Loop Position (C-C\')', rightX + 3.5, rightY + 19.5);
    doc.text('[ ] 42° Posterior Divergence Maintained', col2X - 6, rightY + 19.5);

    doc.text('Student: __________________', rightX + 3.5, rightY + 27.5);
    doc.text('Faculty Sign: __________________', col2X - 6, rightY + 27.5);
    doc.text('Evaluation:  [ ] Pass   [ ] Needs Revision', rightX + 3.5, rightY + 34.5);
    doc.text('Date: __________________', col2X - 6, rightY + 34.5);
  };

  renderBonwillPrintableSlide('Maxillary', '12');
  renderBonwillPrintableSlide('Mandibular', '13');

  // =========================================================================
  // SLIDE 14: DOWNS' CEPHALOMETRIC ANALYSIS
  // =========================================================================
  const downs = rad.downsAnalysis || ({} as any);
  const downsP = downs.parameters || {};
  const steiner = rad.steinersAnalysis || ({} as any);
  const steinerP = steiner.parameters || {};
  const activeStageLabel =
    rad.activeStage === 'mid'
      ? 'Mid-Treatment'
      : rad.activeStage === 'post'
      ? 'Post-Treatment'
      : rad.activeStage === 'retention'
      ? 'Retention'
      : 'Pre-Treatment';

  startNewSlide("14. Downs' Cephalometric Analysis: Skeletal & Dental Patterns", 'Quantitative Assessment of Craniofacial Form & Dentofacial Relationships');

  // 1. Skeletal Parameters
  addSubsectionHeader("I. Downs' Skeletal Parameters (5 Parameters)");
  const downsSkeletalRows: (string | number)[][] = [
    [
      '1. Facial Angle (FH to N-Pog)',
      getStageVal(downsP.facialAngle) !== null ? `${getStageVal(downsP.facialAngle)?.toFixed(1)}°` : '—',
      '87.8° (84.0° to 91.5°)',
      getStageVal(downsP.facialAngle) !== null
        ? getStageVal(downsP.facialAngle)! > 91.5
          ? 'Prognathic Mandible / Mandibular Prominence (Class III tendency)'
          : getStageVal(downsP.facialAngle)! < 84.0
          ? 'Retrognathic Mandible / Mandibular Retrusion (Class II tendency)'
          : 'Orthognathic Mandible (Class I Normal)'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. Angle of Convexity (N-A-Pog)',
      getStageVal(downsP.angleConvexity) !== null ? `${getStageVal(downsP.angleConvexity)?.toFixed(1)}°` : '—',
      '0.0° (-5.0° to +5.0°)',
      getStageVal(downsP.angleConvexity) !== null
        ? getStageVal(downsP.angleConvexity)! > 5.0
          ? 'Convex Facial Profile (Skeletal Class II / Maxillary Prominence)'
          : getStageVal(downsP.angleConvexity)! < -5.0
          ? 'Concave Facial Profile (Skeletal Class III / Mandibular Prominence)'
          : 'Straight Facial Profile (Class I Normal)'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. A-B Plane Angle (to N-Pog)',
      getStageVal(downsP.abPlane) !== null ? `${getStageVal(downsP.abPlane)?.toFixed(1)}°` : '—',
      '-4.6° (-8.5° to 0.0°)',
      getStageVal(downsP.abPlane) !== null
        ? getStageVal(downsP.abPlane)! < -8.5
          ? 'Class II Skeletal Discrepancy (Mandibular Retrusion relative to Maxilla)'
          : getStageVal(downsP.abPlane)! > 0.0
          ? 'Class III Skeletal Discrepancy (Mandibular Protrusion relative to Maxilla)'
          : 'Class I Skeletal Relationship (Normal Harmony)'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Mandibular Plane Angle (MP to FH)',
      getStageVal(downsP.mandibularPlaneAngle) !== null ? `${getStageVal(downsP.mandibularPlaneAngle)?.toFixed(1)}°` : '—',
      '21.9° (17.0° to 26.0°)',
      getStageVal(downsP.mandibularPlaneAngle) !== null
        ? getStageVal(downsP.mandibularPlaneAngle)! > 26.0
          ? 'Hyperdivergent Vertical Growth (High Angle / Steep Mandibular Plane)'
          : getStageVal(downsP.mandibularPlaneAngle)! < 17.0
          ? 'Hypodivergent Vertical Growth (Low Angle / Flat Mandibular Plane)'
          : 'Normodivergent Vertical Growth Pattern (Normal)'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Y-Axis / Growth Axis (SGn to FH)',
      getStageVal(downsP.yAxis) !== null ? `${getStageVal(downsP.yAxis)?.toFixed(1)}°` : '—',
      '59.4° (55.0° to 64.0°)',
      getStageVal(downsP.yAxis) !== null
        ? getStageVal(downsP.yAxis)! > 64.0
          ? 'Vertical Mandibular Growth Vector (Downward & Backward Rotation)'
          : getStageVal(downsP.yAxis)! < 55.0
          ? 'Horizontal Mandibular Growth Vector (Forward Rotation / Deep Bite)'
          : 'Normal Balanced Craniofacial Growth Vector'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ['Downs Skeletal Parameter', 'Measured Value', 'Downs Norm (Range)', 'Diagnostic Clinical Inference'],
    downsSkeletalRows,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.5,
    10.0
  );

  // 2. Dental Parameters
  addSubsectionHeader("II. Downs' Dental Parameters (5 Parameters)");
  const downsDentalRows: (string | number)[][] = [
    [
      '1. Cant of Occlusal Plane (OP to FH)',
      getStageVal(downsP.cantOfOcclusion) !== null ? `${getStageVal(downsP.cantOfOcclusion)?.toFixed(1)}°` : '—',
      '9.3° (5.5° to 13.5°)',
      getStageVal(downsP.cantOfOcclusion) !== null
        ? getStageVal(downsP.cantOfOcclusion)! > 13.5
          ? 'Steep Occlusal Plane (Class II / Open Bite Tendency)'
          : getStageVal(downsP.cantOfOcclusion)! < 5.5
          ? 'Flat Occlusal Plane (Class III / Deep Bite Tendency)'
          : 'Normal Occlusal Plane Slope'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. Lower Incisors to Occlusal Plane',
      getStageVal(downsP.lowerIncisorToOcclusal) !== null ? `${getStageVal(downsP.lowerIncisorToOcclusal)?.toFixed(1)}°` : '—',
      '14.5° (11.0° to 18.0°)',
      getStageVal(downsP.lowerIncisorToOcclusal) !== null
        ? getStageVal(downsP.lowerIncisorToOcclusal)! > 18.0
          ? 'Proclined Lower Incisors (Incisor Protrusion to OP)'
          : getStageVal(downsP.lowerIncisorToOcclusal)! < 11.0
          ? 'Retroclined Lower Incisors (Upright Incisors to OP)'
          : 'Normal Lower Incisor Inclination to Occlusal Plane'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. Lower Incisors to Mandibular Plane (IMPA)',
      getStageVal(downsP.impa) !== null ? `${getStageVal(downsP.impa)?.toFixed(1)}°` : '—',
      '91.4° (85.0° to 95.0°)',
      getStageVal(downsP.impa) !== null
        ? (() => {
            const v = getStageVal(downsP.impa)!;
            if (v > 50) {
              if (v > 95.0) return 'Proclined Lower Incisors (IMPA > 95° / Extraction Risk)';
              if (v < 85.0) return 'Retroclined Lower Incisors (IMPA < 85° / Lingual Incline)';
              return 'Ideal Incisor-Mandibular Plane Angle (IMPA 85° - 95°)';
            } else {
              if (v > 5.0) return 'Proclined Lower Incisors (IMPA Deviation > +5°)';
              if (v < -5.0) return 'Retroclined Lower Incisors (IMPA Deviation < -5°)';
              return 'Ideal Incisor-Mandibular Plane Angle (Harmonious)';
            }
          })()
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Interincisal Angle (U1 to L1)',
      getStageVal(downsP.interincisalAngle) !== null ? `${getStageVal(downsP.interincisalAngle)?.toFixed(1)}°` : '—',
      '135.4° (130.0° to 142.0°)',
      getStageVal(downsP.interincisalAngle) !== null
        ? getStageVal(downsP.interincisalAngle)! < 130.0
          ? 'Acute Interincisal Angle (Bimaxillary / Incisor Proclination)'
          : getStageVal(downsP.interincisalAngle)! > 142.0
          ? 'Obtuse Interincisal Angle (Incisor Retroclination / Class II Div 2)'
          : 'Harmonious Interincisal Relationship'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Upper Incisor to A-Pog (1 to A-Po)',
      getStageVal(downsP.upperIncisalAngle) !== null ? `${getStageVal(downsP.upperIncisalAngle)?.toFixed(1)} mm` : '—',
      '+2.7 mm (0.5 to 5.0 mm)',
      getStageVal(downsP.upperIncisalAngle) !== null
        ? getStageVal(downsP.upperIncisalAngle)! > 5.0
          ? 'Upper Incisor Protrusion (Class II Div 1 Feature)'
          : getStageVal(downsP.upperIncisalAngle)! < 0.5
          ? 'Upper Incisor Retrusion (Class II Div 2 / Class III Feature)'
          : 'Normal Upper Incisor AP Position to A-Pog'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ['Downs Dental Parameter', 'Measured Value', 'Downs Norm (Range)', 'Diagnostic Clinical Inference'],
    downsDentalRows,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.5,
    10.0
  );

  // =========================================================================
  // SLIDE 15: DOWNS' ANALYSIS OVERALL SUMMARY & CLINICAL INFERENCES
  // =========================================================================
  const downsPayload = buildDownsInferencePayload(downsP, getStageVal, downs.conclusion);
  startNewSlide("15. Downs' Analysis: Overall Diagnostic Summary & Clinical Inferences", 'Comprehensive Craniofacial Form, Growth Vector & Dentoalveolar Arc Synthesis');
  renderFullSlideInferenceCard(
    "Downs' Analysis Overall Summary & Clinical Inferences",
    activeStageLabel,
    downsPayload.inferencePoints,
    140
  );

  // =========================================================================
  // SLIDE 16: STEINER'S CEPHALOMETRIC ANALYSIS
  // =========================================================================
  startNewSlide("16. Steiner's Cephalometric Analysis: Basal & Dental Parameters", 'Skeletal Basal Bones, Dentoalveolar Compensation & Soft Tissue Harmony');

  addSubsectionHeader("I. Steiner's Skeletal Parameters (5 Parameters)");
  const steinerSkeletalRows: (string | number)[][] = [
    [
      '1. SNA Angle (Maxillary AP)',
      getStageVal(steinerP.sna) !== null ? `${getStageVal(steinerP.sna)?.toFixed(1)}°` : '—',
      '82.0° (80.0° - 84.0°)',
      getStageVal(steinerP.sna) !== null
        ? getStageVal(steinerP.sna)! > 84.0
          ? 'Maxillary Prognathism / Anterior Apical Base Excess'
          : getStageVal(steinerP.sna)! < 80.0
          ? 'Maxillary Retrognathism / Midface Deficiency'
          : 'Normal Maxillary Anteroposterior Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. SNB Angle (Mandibular AP)',
      getStageVal(steinerP.snb) !== null ? `${getStageVal(steinerP.snb)?.toFixed(1)}°` : '—',
      '80.0° (78.0° - 82.0°)',
      getStageVal(steinerP.snb) !== null
        ? getStageVal(steinerP.snb)! > 82.0
          ? 'Mandibular Prognathism / Mandibular Apical Base Prominence'
          : getStageVal(steinerP.snb)! < 78.0
          ? 'Mandibular Retrognathism / Mandibular Retrusion'
          : 'Normal Mandibular Anteroposterior Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. ANB Angle (Skeletal Sagittal)',
      getStageVal(steinerP.anb) !== null ? `${getStageVal(steinerP.anb)?.toFixed(1)}°` : '—',
      '2.0° (0.0° - 4.0°)',
      getStageVal(steinerP.anb) !== null
        ? getStageVal(steinerP.anb)! > 4.0
          ? 'Skeletal Class II Basal Relationship (Maxillomandibular Discrepancy)'
          : getStageVal(steinerP.anb)! < 0.0
          ? 'Skeletal Class III Basal Relationship (Mandibular Prominence)'
          : 'Skeletal Class I Harmonious Basal Relationship'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Occlusal Plane Angle (OP to SN)',
      getStageVal(steinerP.occlusalPlaneAngle) !== null ? `${getStageVal(steinerP.occlusalPlaneAngle)?.toFixed(1)}°` : '—',
      '14.0° (12.0° - 16.0°)',
      getStageVal(steinerP.occlusalPlaneAngle) !== null
        ? getStageVal(steinerP.occlusalPlaneAngle)! > 16.0
          ? 'Steep Occlusal Plane Angle (Class II tendency)'
          : getStageVal(steinerP.occlusalPlaneAngle)! < 12.0
          ? 'Flat Occlusal Plane Angle (Class III / Deep bite tendency)'
          : 'Normal Occlusal Plane Orientation'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Mandibular Plane Angle (GoGn-SN)',
      getStageVal(steinerP.mandibularPlaneAngle) !== null ? `${getStageVal(steinerP.mandibularPlaneAngle)?.toFixed(1)}°` : '—',
      '32.0° (29.0° - 35.0°)',
      getStageVal(steinerP.mandibularPlaneAngle) !== null
        ? getStageVal(steinerP.mandibularPlaneAngle)! > 35.0
          ? 'Hyperdivergent / High Angle Backward Rotator Growth Pattern'
          : getStageVal(steinerP.mandibularPlaneAngle)! < 29.0
          ? 'Hypodivergent / Low Angle Forward Rotator Growth Pattern'
          : 'Normodivergent Balanced Vertical Growth Pattern'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ["Steiner's Skeletal Parameter", 'Measured Value', 'Steiner Norm (Range)', 'Diagnostic Clinical Inference'],
    steinerSkeletalRows,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.2,
    10.0
  );

  addSubsectionHeader("II. Steiner's Dental & Soft Tissue Parameters (6 Parameters)");
  const steinerDentalRows: (string | number)[][] = [
    [
      '1. Upper Incisor to NA (deg)',
      getStageVal(steinerP.u1NaDeg) !== null ? `${getStageVal(steinerP.u1NaDeg)?.toFixed(1)}°` : '—',
      '22.0° (18.0° - 26.0°)',
      getStageVal(steinerP.u1NaDeg) !== null
        ? getStageVal(steinerP.u1NaDeg)! > 26.0
          ? 'Maxillary Incisor Proclination / Labial Tipping'
          : getStageVal(steinerP.u1NaDeg)! < 18.0
          ? 'Maxillary Incisor Retroclination / Lingual Tipping'
          : 'Normal Upper Incisor Axial Angulation'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. Upper Incisor to NA (linear mm)',
      getStageVal(steinerP.u1NaMm) !== null ? `${getStageVal(steinerP.u1NaMm)?.toFixed(1)} mm` : '—',
      '4.0 mm (2.0 - 6.0 mm)',
      getStageVal(steinerP.u1NaMm) !== null
        ? getStageVal(steinerP.u1NaMm)! > 6.0
          ? 'Maxillary Incisor Linear Protrusion'
          : getStageVal(steinerP.u1NaMm)! < 2.0
          ? 'Maxillary Incisor Linear Retrusion'
          : 'Normal Upper Incisor Linear Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. Lower Incisor to NB (deg)',
      getStageVal(steinerP.l1NbDeg) !== null ? `${getStageVal(steinerP.l1NbDeg)?.toFixed(1)}°` : '—',
      '25.0° (21.0° - 29.0°)',
      getStageVal(steinerP.l1NbDeg) !== null
        ? getStageVal(steinerP.l1NbDeg)! > 29.0
          ? 'Mandibular Incisor Proclination / Labial Tipping'
          : getStageVal(steinerP.l1NbDeg)! < 21.0
          ? 'Mandibular Incisor Retroclination / Lingual Tipping'
          : 'Normal Lower Incisor Axial Angulation'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Lower Incisor to NB (linear mm)',
      getStageVal(steinerP.l1NbMm) !== null ? `${getStageVal(steinerP.l1NbMm)?.toFixed(1)} mm` : '—',
      '4.0 mm (2.0 - 6.0 mm)',
      getStageVal(steinerP.l1NbMm) !== null
        ? getStageVal(steinerP.l1NbMm)! > 6.0
          ? 'Mandibular Incisor Linear Protrusion'
          : getStageVal(steinerP.l1NbMm)! < 2.0
          ? 'Mandibular Incisor Linear Retrusion'
          : 'Normal Lower Incisor Linear Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Interincisal Angle (U1 to L1)',
      getStageVal(steinerP.interincisalAngle) !== null ? `${getStageVal(steinerP.interincisalAngle)?.toFixed(1)}°` : '—',
      '130.0° (125.0° - 135.0°)',
      getStageVal(steinerP.interincisalAngle) !== null
        ? getStageVal(steinerP.interincisalAngle)! < 125.0
          ? 'Acute Interincisal Angle (Bimaxillary / Incisor Proclination)'
          : getStageVal(steinerP.interincisalAngle)! > 135.0
          ? 'Obtuse Interincisal Angle (Upright Incisors / Deep bite tendency)'
          : 'Balanced Interincisal Relationship'
        : 'Awaiting primary tracing data',
    ],
    [
      '6. Steiner\'s S-Line (Soft Tissue Profile)',
      getStageVal(steinerP.sLineLowerLip) !== null ? `${getStageVal(steinerP.sLineLowerLip)?.toFixed(1)} mm` : '—',
      '0.0 mm (-2.0 to 2.0 mm)',
      getStageVal(steinerP.sLineLowerLip) !== null
        ? getStageVal(steinerP.sLineLowerLip)! > 2.0
          ? 'Protrusive Soft Tissue Lip Profile'
          : getStageVal(steinerP.sLineLowerLip)! < -2.0
          ? 'Retrusive Soft Tissue Lip Profile'
          : 'Harmonious Esthetic Lip Profile (Tangent to S-Line)'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ["Steiner's Dental Parameter", 'Measured Value', 'Steiner Norm (Range)', 'Diagnostic Clinical Inference'],
    steinerDentalRows,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.2,
    10.0
  );

  // =========================================================================
  // SLIDE 17: STEINER'S ANALYSIS OVERALL SUMMARY & CLINICAL INFERENCES
  // =========================================================================
  const steinerPayload = buildSteinerInferencePayload(steinerP, getStageVal, steiner.conclusion);
  startNewSlide("17. Steiner's Analysis: Overall Diagnostic Summary & Clinical Inferences", 'Skeletal Basal Harmony, Mandibular Growth Vector & Dentoalveolar Diagnostics');
  renderFullSlideInferenceCard(
    "Steiner's Analysis Overall Summary & Diagnostic Inference",
    activeStageLabel,
    steinerPayload.inferencePoints,
    140
  );

  // =========================================================================
  // SLIDE 18: RICKETTS' CEPHALOMETRIC ANALYSIS
  // =========================================================================
  const ricketts = rad.rickettsAnalysis || ({} as any);
  const rickP = ricketts.parameters || {};

  startNewSlide("18. Ricketts' Cephalometric Analysis", 'Growth Vectors, Skeletal Morphology & Esthetic Plane (8 Parameters)');

  const rickettsRows: (string | number)[][] = [
    [
      '1. Facial Axis (Pt-Gn to Ba-N)',
      getStageVal(rickP.facialAxis) !== null ? `${getStageVal(rickP.facialAxis)?.toFixed(1)}°` : '—',
      '90.0° ± 3.5° (86.5° - 93.5°)',
      getStageVal(rickP.facialAxis) !== null
        ? getStageVal(rickP.facialAxis)! < 86.5
          ? 'Vertical / Backward Growth Vector (Dolichofacial / High Angle)'
          : getStageVal(rickP.facialAxis)! > 93.5
          ? 'Horizontal / Forward Growth Vector (Brachyfacial / Low Angle)'
          : 'Mesofacial Growth Pattern (Normal)'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. Facial Depth (N-Pg to FH)',
      getStageVal(rickP.facialDepth) !== null ? `${getStageVal(rickP.facialDepth)?.toFixed(1)}°` : '—',
      '87.0° ± 3.0° (84.0° - 90.0°)',
      getStageVal(rickP.facialDepth) !== null
        ? getStageVal(rickP.facialDepth)! < 84.0
          ? 'Mandibular Retrusion / Skeletal Class II Tendency'
          : getStageVal(rickP.facialDepth)! > 90.0
          ? 'Mandibular Prognathism / Skeletal Class III Tendency'
          : 'Normal Mandibular Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. Mandibular Plane Angle (to FH)',
      getStageVal(rickP.mandibularPlaneAngle) !== null ? `${getStageVal(rickP.mandibularPlaneAngle)?.toFixed(1)}°` : '—',
      '26.0° ± 4.5° (21.5° - 30.5°)',
      getStageVal(rickP.mandibularPlaneAngle) !== null
        ? getStageVal(rickP.mandibularPlaneAngle)! > 30.5
          ? 'Hyperdivergent / High Mandibular Plane Angle'
          : getStageVal(rickP.mandibularPlaneAngle)! < 21.5
          ? 'Hypodivergent / Low Mandibular Plane Angle'
          : 'Normal Mandibular Plane Divergence'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Convexity of Point A (A-N-Pg)',
      getStageVal(rickP.convexityOfPointA) !== null ? `${getStageVal(rickP.convexityOfPointA)?.toFixed(1)} mm` : '—',
      '2.0 ± 2.0 mm (0.0 - 4.0 mm)',
      getStageVal(rickP.convexityOfPointA) !== null
        ? getStageVal(rickP.convexityOfPointA)! > 4.0
          ? 'Convex Profile / Maxillary Protrusion (Class II)'
          : getStageVal(rickP.convexityOfPointA)! < 0.0
          ? 'Concave Profile / Maxillary Deficiency (Class III)'
          : 'Straight Profile (Class I Normal)'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Lower Incisor to A-Pog (linear mm)',
      getStageVal(rickP.lowerIncisorToAPogMm) !== null ? `${getStageVal(rickP.lowerIncisorToAPogMm)?.toFixed(1)} mm` : '—',
      '1.0 ± 2.0 mm (-1.0 - 3.0 mm)',
      getStageVal(rickP.lowerIncisorToAPogMm) !== null
        ? getStageVal(rickP.lowerIncisorToAPogMm)! > 3.0
          ? 'Protruded Lower Incisors (Extraction warning)'
          : getStageVal(rickP.lowerIncisorToAPogMm)! < -1.0
          ? 'Retruded Lower Incisors'
          : 'Ideal Lower Incisor AP Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '6. Upper Molar to Pt Vertical (PTV)',
      getStageVal(rickP.upperMolarToPTV) !== null ? `${getStageVal(rickP.upperMolarToPTV)?.toFixed(1)} mm` : '—',
      'Age + 3 mm (~21 ± 2 mm)',
      getStageVal(rickP.upperMolarToPTV) !== null
        ? getStageVal(rickP.upperMolarToPTV)! > 23.0
          ? 'Mesially Positioned Upper Molar / Molar Protrusion'
          : getStageVal(rickP.upperMolarToPTV)! < 19.0
          ? 'Distally Positioned Upper Molar / Maxillary Molar Retrusion'
          : 'Normal Upper Molar Position relative to PTV'
        : 'Awaiting primary tracing data',
    ],
    [
      '7. Lower Incisor Inclination (1 to A-Pog)',
      getStageVal(rickP.lowerIncisorToAPogDeg) !== null ? `${getStageVal(rickP.lowerIncisorToAPogDeg)?.toFixed(1)}°` : '—',
      '22.0° ± 4.0° (18.0° - 26.0°)',
      getStageVal(rickP.lowerIncisorToAPogDeg) !== null
        ? getStageVal(rickP.lowerIncisorToAPogDeg)! > 26.0
          ? 'Proclined Lower Incisors to A-Pog Line'
          : getStageVal(rickP.lowerIncisorToAPogDeg)! < 18.0
          ? 'Retroclined Lower Incisors to A-Pog Line'
          : 'Normal Lower Incisor Axial Inclination'
        : 'Awaiting primary tracing data',
    ],
    [
      '8. Lower Lip to Esthetic Line (E-Plane)',
      getStageVal(rickP.lowerLipToEPlane) !== null ? `${getStageVal(rickP.lowerLipToEPlane)?.toFixed(1)} mm` : '—',
      '-2.0 ± 2.0 mm (-4.0 - 0.0 mm)',
      getStageVal(rickP.lowerLipToEPlane) !== null
        ? getStageVal(rickP.lowerLipToEPlane)! > 0.0
          ? 'Protrusive Lower Lip / Lip Fullness'
          : getStageVal(rickP.lowerLipToEPlane)! < -4.0
          ? 'Retrusive Lower Lip / Flat Profile'
          : 'Harmonious Esthetic Lip Profile (Balanced)'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ["Ricketts' Diagnostic Parameter", 'Measured Value', "Ricketts Norm (± SD)", 'Diagnostic Clinical Inference'],
    rickettsRows,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    8.5,
    10.5
  );

  // =========================================================================
  // SLIDE 19: RICKETTS' ANALYSIS OVERALL SUMMARY & CLINICAL INFERENCES
  // =========================================================================
  const rickInferencePayload = buildRickettsInferencePayload(rickP, getStageVal, Number(patient.age) || 14);
  startNewSlide("19. Ricketts' Analysis: Overall Diagnostic Summary & Clinical Inferences", 'Craniofacial Growth Biotype, Basal Convexity & Esthetic Profile Dynamics');
  renderFullSlideInferenceCard(
    "Ricketts' Analysis Overall Summary & Diagnostic Inference",
    activeStageLabel,
    rickInferencePayload.inferencePoints,
    140
  );

  // =========================================================================
  // SLIDE 20: MCNAMARA'S CEPHALOMETRIC ANALYSIS (CONSOLIDATED 10 PARAMETERS)
  // =========================================================================
  const mcnamara = rad.mcnamaraAnalysis || ({} as any);
  const mcnamaraP = mcnamara.parameters || {};
  const frameSize = mcnamara.sizeFrame || 'medium';

  startNewSlide("20. McNamara's Cephalometric Analysis: Maxillary, Mandibular & Airway Dimensions", 'Nasion Perpendicular Projections, Harvold Effective Lengths & Pharyngeal Airway Patency (10 Parameters)');

  addSubsectionHeader("I. Maxillary, Mandibular & Skeletal Dimensions (6 Parameters)");
  const mcRowsPart1: (string | number)[][] = [
    [
      '1. Nasolabial Angle',
      getStageVal(mcnamaraP.nasolabialAngle) !== null ? `${getStageVal(mcnamaraP.nasolabialAngle)?.toFixed(1)}°` : '—',
      '102.0° ± 8.0° (94.0° - 110.0°)',
      getStageVal(mcnamaraP.nasolabialAngle) !== null
        ? getStageVal(mcnamaraP.nasolabialAngle)! < 94.0
          ? 'Acute Nasolabial Angle / Upper Lip Protrusion'
          : getStageVal(mcnamaraP.nasolabialAngle)! > 110.0
          ? 'Obtuse Nasolabial Angle / Upper Lip Retrusion'
          : 'Normal Soft Tissue Lip Profile Angle'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. Na-Perp to Point A (Maxillary AP)',
      getStageVal(mcnamaraP.naPerpToPointA) !== null ? `${getStageVal(mcnamaraP.naPerpToPointA)?.toFixed(1)} mm` : '—',
      '0.0 - 1.0 mm',
      getStageVal(mcnamaraP.naPerpToPointA) !== null
        ? getStageVal(mcnamaraP.naPerpToPointA)! > 1.0
          ? 'Maxillary Skeletal Protrusion'
          : getStageVal(mcnamaraP.naPerpToPointA)! < 0.0
          ? 'Maxillary Skeletal Retrusion'
          : 'Normal Maxillary AP Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. Mandibular Effective Length (Co-Gn)',
      getStageVal(mcnamaraP.mandibularLengthCoGn) !== null ? `${getStageVal(mcnamaraP.mandibularLengthCoGn)?.toFixed(1)} mm` : '—',
      frameSize === 'small' ? '97 - 103 mm (Small)' : frameSize === 'large' ? '121 - 135 mm (Large)' : '105 - 120 mm (Med)',
      getStageVal(mcnamaraP.mandibularLengthCoGn) !== null
        ? getStageVal(mcnamaraP.mandibularLengthCoGn)! < (frameSize === 'small' ? 97 : frameSize === 'large' ? 121 : 105)
          ? 'Decreased Mandibular Effective Length'
          : getStageVal(mcnamaraP.mandibularLengthCoGn)! > (frameSize === 'small' ? 103 : frameSize === 'large' ? 135 : 120)
          ? 'Increased Mandibular Effective Length'
          : 'Normal Mandibular Effective Length'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Maxillary Effective Length (Co-Pt A)',
      getStageVal(mcnamaraP.maxillaryLengthCoPointA) !== null ? `${getStageVal(mcnamaraP.maxillaryLengthCoPointA)?.toFixed(1)} mm` : '—',
      frameSize === 'small' ? '75 - 82 mm (Small)' : frameSize === 'large' ? '93 - 102 mm (Large)' : '83 - 92 mm (Med)',
      getStageVal(mcnamaraP.maxillaryLengthCoPointA) !== null
        ? getStageVal(mcnamaraP.maxillaryLengthCoPointA)! < (frameSize === 'small' ? 75 : frameSize === 'large' ? 93 : 83)
          ? 'Decreased Maxillary Effective Length'
          : getStageVal(mcnamaraP.maxillaryLengthCoPointA)! > (frameSize === 'small' ? 82 : frameSize === 'large' ? 102 : 92)
          ? 'Increased Maxillary Effective Length'
          : 'Normal Maxillary Effective Length'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Mandibular Plane Angle (to FH)',
      getStageVal(mcnamaraP.mandibularPlaneAngle) !== null ? `${getStageVal(mcnamaraP.mandibularPlaneAngle)?.toFixed(1)}°` : '—',
      '22.0° - 28.0°',
      getStageVal(mcnamaraP.mandibularPlaneAngle) !== null
        ? getStageVal(mcnamaraP.mandibularPlaneAngle)! < 22.0
          ? 'Hypodivergent / Low Angle Mandibular Plane'
          : getStageVal(mcnamaraP.mandibularPlaneAngle)! > 28.0
          ? 'Hyperdivergent / High Angle Mandibular Plane'
          : 'Normal Mandibular Plane Angle'
        : 'Awaiting primary tracing data',
    ],
    [
      '6. Pogonion to Na-Perp (Mandibular AP)',
      getStageVal(mcnamaraP.pogNaPerp) !== null ? `${getStageVal(mcnamaraP.pogNaPerp)?.toFixed(1)} mm` : '—',
      '-2.0 to 4.0 mm',
      getStageVal(mcnamaraP.pogNaPerp) !== null
        ? getStageVal(mcnamaraP.pogNaPerp)! < -2.0
          ? 'Mandibular Skeletal Retrusion (Class II)'
          : getStageVal(mcnamaraP.pogNaPerp)! > 4.0
          ? 'Mandibular Skeletal Protrusion (Class III)'
          : 'Normal Mandibular Chin Position'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ["McNamara Parameter", 'Measured Value', "McNamara Norm", 'Diagnostic Clinical Inference'],
    mcRowsPart1,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.0,
    9.5
  );

  addSubsectionHeader("II. Dentoalveolar & Pharyngeal Airway Dimensions (4 Parameters)");
  const mcRowsPart2: (string | number)[][] = [
    [
      '7. Upper Incisor to Point A',
      getStageVal(mcnamaraP.upperIncisorToPointA) !== null ? `${getStageVal(mcnamaraP.upperIncisorToPointA)?.toFixed(1)} mm` : '—',
      '4.0 - 6.0 mm',
      getStageVal(mcnamaraP.upperIncisorToPointA) !== null
        ? getStageVal(mcnamaraP.upperIncisorToPointA)! > 6.0
          ? 'Upper Incisor Protrusion'
          : getStageVal(mcnamaraP.upperIncisorToPointA)! < 4.0
          ? 'Upper Incisor Retrusion'
          : 'Normal Upper Incisor Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '8. Lower Incisor to Point A',
      getStageVal(mcnamaraP.lowerIncisorToPointA) !== null ? `${getStageVal(mcnamaraP.lowerIncisorToPointA)?.toFixed(1)} mm` : '—',
      '1.0 - 3.0 mm',
      getStageVal(mcnamaraP.lowerIncisorToPointA) !== null
        ? getStageVal(mcnamaraP.lowerIncisorToPointA)! > 3.0
          ? 'Lower Incisor Protrusion'
          : getStageVal(mcnamaraP.lowerIncisorToPointA)! < 1.0
          ? 'Lower Incisor Retrusion'
          : 'Normal Lower Incisor Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '9. Upper Pharyngeal Airway Width',
      getStageVal(mcnamaraP.upperPharynx) !== null ? `${getStageVal(mcnamaraP.upperPharynx)?.toFixed(1)} mm` : '—',
      '15.0 - 20.0 mm',
      getStageVal(mcnamaraP.upperPharynx) !== null
        ? getStageVal(mcnamaraP.upperPharynx)! < 15.0
          ? 'Constricted Upper Airway / Adenoid Hypertrophy Risk'
          : 'Adequate Nasopharyngeal Airway Space'
        : 'Awaiting primary tracing data',
    ],
    [
      '10. Lower Pharyngeal Airway Width',
      getStageVal(mcnamaraP.lowerPharynx) !== null ? `${getStageVal(mcnamaraP.lowerPharynx)?.toFixed(1)} mm` : '—',
      '11.0 - 14.0 mm',
      getStageVal(mcnamaraP.lowerPharynx) !== null
        ? getStageVal(mcnamaraP.lowerPharynx)! < 11.0
          ? 'Constricted Lower Airway / Retroglossal Airway Risk'
          : 'Adequate Oropharyngeal Airway Space'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ["McNamara Parameter", 'Measured Value', "McNamara Norm", 'Diagnostic Clinical Inference'],
    mcRowsPart2,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.0,
    9.5
  );

  // =========================================================================
  // SLIDE 21: MCNAMARA'S ANALYSIS OVERALL SUMMARY & CLINICAL INFERENCES
  // =========================================================================
  const mcInferencePayload = buildMcNamaraInferencePayload(mcnamaraP, getStageVal, frameSize);
  startNewSlide(
    "21. McNamara's Analysis: Overall Diagnostic Summary & Clinical Inferences",
    'Nasion Perpendicular Projections, Harvold Differentials & Pharyngeal Airway'
  );
  renderFullSlideInferenceCard(
    "McNamara's Analysis Overall Summary & Diagnostic Inference",
    activeStageLabel,
    mcInferencePayload.inferencePoints,
    140
  );

  // =========================================================================
  // SLIDE 22: TWEED'S TRIANGLE & SCHWARZ'S CEPHALOMETRIC ANALYSES (CONSOLIDATED 7 PARAMETERS)
  // =========================================================================
  const schwarzTweed = rad.schwarzTweedAnalysis || ({} as any);
  const stP = schwarzTweed.parameters || {};

  startNewSlide("22. Tweed's Triangle & Schwarz's Basal Cephalometric Analyses", 'Diagnostic Anchorage Triangle, Vertical Divergence & Linear Basal Dimensions (7 Parameters)');

  addSubsectionHeader("I. Tweed's Diagnostic Triangle Analysis (3 Parameters)");
  const tweedRows: (string | number)[][] = [
    [
      '1. FMA / FMPA (Frankfort Mandibular Plane Angle)',
      getStageVal(stP.fmpa) !== null ? `${getStageVal(stP.fmpa)?.toFixed(1)}°` : '—',
      '25.0° (22.0° - 28.0°)',
      getStageVal(stP.fmpa) !== null
        ? getStageVal(stP.fmpa)! > 28.0
          ? 'High Mandibular Plane Angle / Hyperdivergent Pattern (Unfavorable Anchorage)'
          : getStageVal(stP.fmpa)! < 22.0
          ? 'Low Mandibular Plane Angle / Hypodivergent Pattern (Strong Anchorage)'
          : 'Normodivergent Facial Pattern / Balanced Anchorage'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. FMIA (Frankfort Mandibular Incisor Angle)',
      getStageVal(stP.fmia) !== null ? `${getStageVal(stP.fmia)?.toFixed(1)}°` : '—',
      '65.0° (62.0° - 68.0°)',
      getStageVal(stP.fmia) !== null
        ? getStageVal(stP.fmia)! < 62.0
          ? 'Lower Incisor Proclination / Anterior Discrepancy (Tweed Goal < 65°)'
          : getStageVal(stP.fmia)! > 68.0
          ? 'Lower Incisor Retroclination / Upright Position'
          : 'Harmonious FMIA Balance / Stable Facial Esthetics'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. IMPA (Incisor Mandibular Plane Angle)',
      getStageVal(stP.impa) !== null ? `${getStageVal(stP.impa)?.toFixed(1)}°` : '—',
      '90.0° (85.0° - 95.0°)',
      getStageVal(stP.impa) !== null
        ? getStageVal(stP.impa)! > 95.0
          ? 'Proclined Lower Incisors (IMPA > 95° / Extraction Warning)'
          : getStageVal(stP.impa)! < 85.0
          ? 'Retroclined Lower Incisors (IMPA < 85°)'
          : 'Ideal Lower Incisor Uprightness on Basal Bone (85° - 95°)'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ['Tweed Diagnostic Parameter', 'Measured Value', 'Standard Norm', 'Diagnostic Clinical Inference'],
    tweedRows,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.5,
    10.0
  );

  addSubsectionHeader("II. Schwarz's Cephalometric Basal Dimensions (4 Parameters)");
  const schwarzRows: (string | number)[][] = [
    [
      '1. Se-N (Anterior Cranial Base Length)',
      getStageVal(stP.seNLength) !== null ? `${getStageVal(stP.seNLength)?.toFixed(1)} mm` : '—',
      '68.0 mm (66.0 - 70.0 mm)',
      getStageVal(stP.seNLength) !== null
        ? getStageVal(stP.seNLength)! > 70.0
          ? 'Increased Anterior Cranial Base Length'
          : getStageVal(stP.seNLength)! < 66.0
          ? 'Decreased Anterior Cranial Base Length'
          : 'Normal Anterior Cranial Base Dimension'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. Maxillary Length (SpP / Basal Base)',
      getStageVal(stP.maxillaryLength) !== null ? `${getStageVal(stP.maxillaryLength)?.toFixed(1)} mm` : '—',
      '47.5 mm (45.5 - 49.5 mm)',
      getStageVal(stP.maxillaryLength) !== null
        ? getStageVal(stP.maxillaryLength)! > 49.5
          ? 'Increased Maxillary Basal Length / Maxillary Prognathism'
          : getStageVal(stP.maxillaryLength)! < 45.5
          ? 'Decreased Maxillary Basal Length / Midface Micrognathia'
          : 'Normal Maxillary Basal Base Length'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. Mandibular Length (Corpus / Basal Base)',
      getStageVal(stP.mandibularLength) !== null ? `${getStageVal(stP.mandibularLength)?.toFixed(1)} mm` : '—',
      '71.0 mm (69.0 - 73.0 mm)',
      getStageVal(stP.mandibularLength) !== null
        ? getStageVal(stP.mandibularLength)! > 73.0
          ? 'Increased Mandibular Length / Macrognathia (Class III tendency)'
          : getStageVal(stP.mandibularLength)! < 69.0
          ? 'Decreased Mandibular Length / Micrognathia (Class II tendency)'
          : 'Normal Mandibular Basal Length'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Ascending Ramus Length (Ramus Height)',
      getStageVal(stP.ascendingRamusLength) !== null ? `${getStageVal(stP.ascendingRamusLength)?.toFixed(1)} mm` : '—',
      '50.0 mm (48.0 - 52.0 mm)',
      getStageVal(stP.ascendingRamusLength) !== null
        ? getStageVal(stP.ascendingRamusLength)! > 52.0
          ? 'Increased Ramus Height / Favorable Vertical Growth'
          : getStageVal(stP.ascendingRamusLength)! < 48.0
          ? 'Decreased Ramus Height / Open Bite Tendency'
          : 'Normal Ramus Height & Vertical Development'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ["Schwarz's Basal Parameter", 'Measured Value', 'Schwarz Norm', 'Diagnostic Clinical Inference'],
    schwarzRows,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.5,
    10.0
  );

  // =========================================================================
  // SLIDE 23: TWEED'S & SCHWARZ'S DIAGNOSTIC SUMMARY & INFERENCES
  // =========================================================================
  const stInferencePayload = buildTweedSchwarzInferencePayload(stP, getStageVal);
  startNewSlide(
    "23. Tweed's & Schwarz's Analyses: Diagnostic Summary & Clinical Inferences",
    'Anchorage Envelope, Mandibular Incisor Uprightness & Basal Morphology'
  );
  renderFullSlideInferenceCard(
    "Tweed's & Schwarz's Analysis Overall Summary & Diagnostic Inference",
    activeStageLabel,
    stInferencePayload.inferencePoints,
    140
  );

  // =========================================================================
  // SLIDE 24: HOLDAWAY'S SOFT TISSUE CEPHALOMETRIC ANALYSIS
  // =========================================================================
  const holdaway = rad.holdawayAnalysis || ({} as any);
  const holdP = holdaway.parameters || {};
  const anbForHoldaway = getStageVal(steinerP.anb);

  startNewSlide("24. Holdaway's Soft Tissue Cephalometric Analysis", 'Comprehensive Soft Tissue Profile, H-Line & Lip Harmony (8 Parameters)');

  const holdawayRows: (string | number)[][] = [
    [
      '1. Facial Contour Angle',
      getStageVal(holdP.facialContourAngle) !== null ? `${getStageVal(holdP.facialContourAngle)?.toFixed(1)}°` : '—',
      '8.0° - 10.0°',
      getStageVal(holdP.facialContourAngle) !== null
        ? getStageVal(holdP.facialContourAngle)! > 10.0
          ? 'Convex Soft Tissue Profile'
          : getStageVal(holdP.facialContourAngle)! < 8.0
          ? 'Straight / Concave Soft Tissue Profile'
          : 'Ideal Soft Tissue Facial Contour'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. Upper Lip Strain',
      getStageVal(holdP.upperLipStrain) !== null ? `${getStageVal(holdP.upperLipStrain)?.toFixed(1)} mm` : '—',
      '3.0 mm',
      getStageVal(holdP.upperLipStrain) !== null
        ? getStageVal(holdP.upperLipStrain)! > 4.0
          ? 'Excessive Upper Lip Strain (Perioral Tightness)'
          : getStageVal(holdP.upperLipStrain)! < 2.0
          ? 'Flaccid / Thick Soft Tissue Upper Lip'
          : 'Normal Upper Lip Strain'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. Soft Tissue Chin Thickness',
      getStageVal(holdP.softTissueChinThickness) !== null ? `${getStageVal(holdP.softTissueChinThickness)?.toFixed(1)} mm` : '—',
      '10.0 - 12.0 mm',
      getStageVal(holdP.softTissueChinThickness) !== null
        ? getStageVal(holdP.softTissueChinThickness)! > 12.0
          ? 'Thick Soft Tissue Chin Pad (Masks Retrognathism)'
          : getStageVal(holdP.softTissueChinThickness)! < 10.0
          ? 'Thin Soft Tissue Chin Pad'
          : 'Ideal Soft Tissue Chin Thickness'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Subnasale to H-Line',
      getStageVal(holdP.subnasaleToHLine) !== null ? `${getStageVal(holdP.subnasaleToHLine)?.toFixed(1)} mm` : '—',
      '3.0 - 7.0 mm (Ideal: 5.0 mm)',
      getStageVal(holdP.subnasaleToHLine) !== null
        ? getStageVal(holdP.subnasaleToHLine)! > 7.0
          ? 'Retrusive Base of Upper Lip / Prominent Nose'
          : getStageVal(holdP.subnasaleToHLine)! < 3.0
          ? 'Protrusive Base of Upper Lip'
          : 'Balanced Subnasale Projection'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Upper Lip to H-Line',
      getStageVal(holdP.upperLipToHLine) !== null ? `${getStageVal(holdP.upperLipToHLine)?.toFixed(1)} mm` : '—',
      '1.0 - 2.0 mm',
      getStageVal(holdP.upperLipToHLine) !== null
        ? getStageVal(holdP.upperLipToHLine)! > 2.0
          ? 'Protrusive Upper Lip relative to H-Line'
          : getStageVal(holdP.upperLipToHLine)! < 1.0
          ? 'Retrusive Upper Lip relative to H-Line'
          : 'Ideal Upper Lip Harmony on H-Line'
        : 'Awaiting primary tracing data',
    ],
    [
      '6. Lower Lip to H-Line',
      getStageVal(holdP.lowerLipToHLine) !== null ? `${getStageVal(holdP.lowerLipToHLine)?.toFixed(1)} mm` : '—',
      '0.0 - 0.5 mm',
      getStageVal(holdP.lowerLipToHLine) !== null
        ? getStageVal(holdP.lowerLipToHLine)! > 0.5
          ? 'Protrusive Lower Lip relative to H-Line'
          : getStageVal(holdP.lowerLipToHLine)! < 0.0
          ? 'Retrusive Lower Lip relative to H-Line'
          : 'Ideal Lower Lip Harmony on H-Line'
        : 'Awaiting primary tracing data',
    ],
    [
      '7. Soft Tissue Facial Angle',
      getStageVal(holdP.softTissueFacialAngle) !== null ? `${getStageVal(holdP.softTissueFacialAngle)?.toFixed(1)}°` : '—',
      '91.0° ± 7.0° (84.0° - 98.0°)',
      getStageVal(holdP.softTissueFacialAngle) !== null
        ? getStageVal(holdP.softTissueFacialAngle)! > 98.0
          ? 'Prognathic Soft Tissue Chin Profile'
          : getStageVal(holdP.softTissueFacialAngle)! < 84.0
          ? 'Retrognathic Soft Tissue Chin Profile'
          : 'Normal Soft Tissue Facial Angle'
        : 'Awaiting primary tracing data',
    ],
    [
      '8. H-Angle (H-Line to NB Line)',
      getStageVal(holdP.hAngle) !== null ? `${getStageVal(holdP.hAngle)?.toFixed(1)}°` : '—',
      anbForHoldaway !== null ? `${(10.0 + anbForHoldaway).toFixed(1)}° (Norm: 7-15°)` : '7.0° - 15.0° (Ideal: 10.0°)',
      getStageVal(holdP.hAngle) !== null
        ? getStageVal(holdP.hAngle)! > 15.0
          ? 'Prominent Soft Tissue Profile / Convexity'
          : getStageVal(holdP.hAngle)! < 7.0
          ? 'Straight / Flat Soft Tissue Profile'
          : 'Harmonious Soft Tissue Balance (H-Angle)'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ["Holdaway's Diagnostic Parameter", 'Measured Value', "Holdaway Norm", 'Diagnostic Clinical Inference'],
    holdawayRows,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    8.5,
    10.5
  );

  // =========================================================================
  // SLIDE 25: HOLDAWAY'S ANALYSIS OVERALL SUMMARY & CLINICAL INFERENCES
  // =========================================================================
  const holdInferencePayload = buildHoldawayInferencePayload(holdP, getStageVal, anbForHoldaway);
  startNewSlide(
    "25. Holdaway's Soft Tissue Analysis: Diagnostic Summary & Clinical Inferences",
    'Facial Contour Angle, H-Angle & Soft Tissue Lip-Chin Drape'
  );
  renderFullSlideInferenceCard(
    "Holdaway's Soft Tissue Analysis Overall Summary & Diagnostic Inference",
    activeStageLabel,
    holdInferencePayload.inferencePoints,
    140
  );

  // =========================================================================
  // SLIDE 26: COGS HARD TISSUE CEPHALOMETRIC ANALYSIS (CONSOLIDATED 9 PARAMETERS)
  // =========================================================================
  const cogs = rad.cogsAnalysis || ({} as any);
  const cogsHardP = cogs.hardTissue || {};
  const cogsSoftP = cogs.softTissue || {};

  startNewSlide('26. COGS Hard Tissue Cephalometric Analysis (Burstone)', 'Surgical-Orthodontic Skeletal Appraisal — Linear Basal Dimensions & Vertical Facial Heights (9 Parameters)');

  addSubsectionHeader("I. Sagittal Projections & Linear Basal Dimensions (5 Parameters)");
  const cogsHardRowsPart1: (string | number)[][] = [
    [
      '1. N-A (Maxillary Sagittal / AP to HP)',
      getStageVal(cogsHardP.nToA) !== null ? `${getStageVal(cogsHardP.nToA)?.toFixed(1)} mm` : '—',
      '0.0 ± 3.0 mm (-3.0 to +3.0 mm)',
      getStageVal(cogsHardP.nToA) !== null
        ? getStageVal(cogsHardP.nToA)! > 3.0
          ? 'Maxillary Skeletal Protrusion (AP Excess)'
          : getStageVal(cogsHardP.nToA)! < -3.0
          ? 'Maxillary Skeletal Retrusion (AP Deficiency)'
          : 'Orthognathic Maxillary Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. N-B (Mandibular Sagittal / AP to HP)',
      getStageVal(cogsHardP.nToB) !== null ? `${getStageVal(cogsHardP.nToB)?.toFixed(1)} mm` : '—',
      '-3.0 ± 3.0 mm (-6.0 to 0.0 mm)',
      getStageVal(cogsHardP.nToB) !== null
        ? getStageVal(cogsHardP.nToB)! > 0.0
          ? 'Mandibular Skeletal Protrusion (Class III)'
          : getStageVal(cogsHardP.nToB)! < -6.0
          ? 'Mandibular Skeletal Retrusion (Class II)'
          : 'Normal Mandibular AP Alignment'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. Ptm-A (Maxillary Basal Unit Length)',
      getStageVal(cogsHardP.ptmToA) !== null ? `${getStageVal(cogsHardP.ptmToA)?.toFixed(1)} mm` : '—',
      '50.0 ± 3.0 mm (47.0 - 53.0 mm)',
      getStageVal(cogsHardP.ptmToA) !== null
        ? getStageVal(cogsHardP.ptmToA)! > 53.0
          ? 'Increased Maxillary Basal Length'
          : getStageVal(cogsHardP.ptmToA)! < 47.0
          ? 'Decreased Maxillary Basal Length (Micrognathia)'
          : 'Normal Maxillary Basal Unit Length'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. Ar-Pg (Total Mandibular Length)',
      getStageVal(cogsHardP.arToPg) !== null ? `${getStageVal(cogsHardP.arToPg)?.toFixed(1)} mm` : '—',
      '110.0 ± 5.0 mm (105.0 - 115.0 mm)',
      getStageVal(cogsHardP.arToPg) !== null
        ? getStageVal(cogsHardP.arToPg)! > 115.0
          ? 'Increased Total Mandibular Length (Macrognathia)'
          : getStageVal(cogsHardP.arToPg)! < 105.0
          ? 'Decreased Total Mandibular Length (Micrognathia)'
          : 'Normal Total Mandibular Length'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Go-Pg (Mandibular Corpus Length)',
      getStageVal(cogsHardP.goPgCorpus) !== null ? `${getStageVal(cogsHardP.goPgCorpus)?.toFixed(1)} mm` : '—',
      '75.0 ± 4.0 mm (71.0 - 79.0 mm)',
      getStageVal(cogsHardP.goPgCorpus) !== null
        ? getStageVal(cogsHardP.goPgCorpus)! > 79.0
          ? 'Increased Mandibular Body Length'
          : getStageVal(cogsHardP.goPgCorpus)! < 71.0
          ? 'Decreased Mandibular Body Length'
          : 'Normal Mandibular Corpus Length'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ['COGS Hard Tissue Parameter', 'Measured Value', 'Burstone Norm', 'Diagnostic Clinical Inference'],
    cogsHardRowsPart1,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.0,
    9.5
  );

  addSubsectionHeader("II. Ramus Height & Vertical Facial Proportions (4 Parameters)");
  const cogsHardRowsPart2: (string | number)[][] = [
    [
      '6. Ar-Go (Ascending Ramus Height)',
      getStageVal(cogsHardP.arGoRamus) !== null ? `${getStageVal(cogsHardP.arGoRamus)?.toFixed(1)} mm` : '—',
      '47.0 ± 4.0 mm (43.0 - 51.0 mm)',
      getStageVal(cogsHardP.arGoRamus) !== null
        ? getStageVal(cogsHardP.arGoRamus)! > 51.0
          ? 'Increased Ascending Ramus Height'
          : getStageVal(cogsHardP.arGoRamus)! < 43.0
          ? 'Decreased Ramus Height / Open Bite Risk'
          : 'Normal Ascending Ramus Height'
        : 'Awaiting primary tracing data',
    ],
    [
      '7. N-ANS (Upper Anterior Facial Height)',
      getStageVal(cogsHardP.nAns) !== null ? `${getStageVal(cogsHardP.nAns)?.toFixed(1)} mm` : '—',
      '50.0 ± 3.0 mm (47.0 - 53.0 mm)',
      getStageVal(cogsHardP.nAns) !== null
        ? getStageVal(cogsHardP.nAns)! > 53.0
          ? 'Increased Upper Anterior Facial Height'
          : getStageVal(cogsHardP.nAns)! < 47.0
          ? 'Decreased Upper Anterior Facial Height'
          : 'Normal Upper Anterior Facial Height'
        : 'Awaiting primary tracing data',
    ],
    [
      '8. ANS-Me (Lower Anterior Facial Height)',
      getStageVal(cogsHardP.ansMe) !== null ? `${getStageVal(cogsHardP.ansMe)?.toFixed(1)} mm` : '—',
      '62.0 ± 4.0 mm (58.0 - 66.0 mm)',
      getStageVal(cogsHardP.ansMe) !== null
        ? getStageVal(cogsHardP.ansMe)! > 66.0
          ? 'Vertical Maxillary/Mandibular Excess (VME)'
          : getStageVal(cogsHardP.ansMe)! < 58.0
          ? 'Decreased Lower Facial Height (Deep Bite)'
          : 'Normal Lower Anterior Facial Height'
        : 'Awaiting primary tracing data',
    ],
    [
      '9. N-ANS / ANS-Me (Facial Height Ratio)',
      getStageVal(cogsHardP.nAnsAnsMeRatio) !== null ? `${getStageVal(cogsHardP.nAnsAnsMeRatio)?.toFixed(2)}` : '—',
      '0.81 (0.75 - 0.87)',
      getStageVal(cogsHardP.nAnsAnsMeRatio) !== null
        ? getStageVal(cogsHardP.nAnsAnsMeRatio)! < 0.75
          ? 'Long Lower Face (Vertical Skeletal Excess)'
          : getStageVal(cogsHardP.nAnsAnsMeRatio)! > 0.87
          ? 'Short Lower Face (Vertical Skeletal Deficiency)'
          : 'Balanced Vertical Facial Height Ratio'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ['COGS Hard Tissue Parameter', 'Measured Value', 'Burstone Norm', 'Diagnostic Clinical Inference'],
    cogsHardRowsPart2,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    7.0,
    9.5
  );

  // =========================================================================
  // SLIDE 27: COGS HARD TISSUE DIAGNOSTIC SUMMARY & INFERENCES
  // =========================================================================
  const cogsHardPayload = buildCogsHardInferencePayload(cogsHardP, getStageVal, patient.gender === 'Male' ? 'Male' : 'Female');
  startNewSlide(
    '27. COGS Hard Tissue Analysis: Diagnostic Summary & Clinical Inferences',
    'Surgical Skeletal Appraisal, Linear Basal Dimensions & Vertical Facial Heights'
  );
  renderFullSlideInferenceCard(
    'COGS Hard Tissue Analysis Overall Summary & Diagnostic Inference',
    activeStageLabel,
    cogsHardPayload.inferencePoints,
    140
  );

  // =========================================================================
  // SLIDE 28: COGS SOFT TISSUE CEPHALOMETRIC ANALYSIS (CONSOLIDATED 14 PARAMETERS)
  // =========================================================================
  startNewSlide('28. COGS Soft Tissue Cephalometric Analysis (Legan-Burstone)', 'Surgical Soft Tissue Appraisal — Facial Convexity, Lip Protrusions & Perioral Dynamics (14 Parameters)');

  addSubsectionHeader("I. Facial Convexity, Vertical Height Ratio & Throat Form (7 Parameters)");
  const cogsSoftRowsPart1: (string | number)[][] = [
    [
      '1. G-Sn-Pg\' (Facial Convexity Angle)',
      getStageVal(cogsSoftP.gSnPg) !== null ? `${getStageVal(cogsSoftP.gSnPg)?.toFixed(1)}°` : '—',
      '12.0° ± 4.0° (8.0° - 16.0°)',
      getStageVal(cogsSoftP.gSnPg) !== null
        ? getStageVal(cogsSoftP.gSnPg)! > 16.0
          ? 'Convex Soft Tissue Profile (Class II Tendency)'
          : getStageVal(cogsSoftP.gSnPg)! < 8.0
          ? 'Concave / Flat Soft Tissue Profile (Class III Tendency)'
          : 'Straight / Orthognathic Facial Profile'
        : 'Awaiting primary tracing data',
    ],
    [
      '2. G-Sn (Subnasale Cranial Base Thickness)',
      getStageVal(cogsSoftP.gSn) !== null ? `${getStageVal(cogsSoftP.gSn)?.toFixed(1)} mm` : '—',
      '6.0 ± 3.0 mm (3.0 - 9.0 mm)',
      getStageVal(cogsSoftP.gSn) !== null
        ? getStageVal(cogsSoftP.gSn)! > 9.0
          ? 'Thick Upper Soft Tissue Base'
          : getStageVal(cogsSoftP.gSn)! < 3.0
          ? 'Thin Upper Soft Tissue Base'
          : 'Normal Soft Tissue Thickness at Subnasale'
        : 'Awaiting primary tracing data',
    ],
    [
      '3. G-Pg\' (Soft Tissue Chin Prominence)',
      getStageVal(cogsSoftP.gPg) !== null ? `${getStageVal(cogsSoftP.gPg)?.toFixed(1)} mm` : '—',
      '0.0 ± 4.0 mm (-4.0 to +4.0 mm)',
      getStageVal(cogsSoftP.gPg) !== null
        ? getStageVal(cogsSoftP.gPg)! > 4.0
          ? 'Protrusive Soft Tissue Chin'
          : getStageVal(cogsSoftP.gPg)! < -4.0
          ? 'Retrusive Soft Tissue Chin'
          : 'Harmonious Soft Tissue Chin Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '4. G-Sn / Sn-Me\' (Vertical Soft Tissue Height Ratio)',
      getStageVal(cogsSoftP.gSnSnMeRatio) !== null ? `${getStageVal(cogsSoftP.gSnSnMeRatio)?.toFixed(2)}` : '—',
      '1.0 (0.90 - 1.10)',
      getStageVal(cogsSoftP.gSnSnMeRatio) !== null
        ? getStageVal(cogsSoftP.gSnSnMeRatio)! < 0.90
          ? 'Increased Lower Vertical Soft Tissue Height'
          : getStageVal(cogsSoftP.gSnSnMeRatio)! > 1.10
          ? 'Decreased Lower Vertical Soft Tissue Height'
          : 'Balanced Vertical Soft Tissue Proportions'
        : 'Awaiting primary tracing data',
    ],
    [
      '5. Sn-Gn\'-C (Subnasale-Gnathion-Cervical Angle)',
      getStageVal(cogsSoftP.snGnC) !== null ? `${getStageVal(cogsSoftP.snGnC)?.toFixed(1)}°` : '—',
      '100.0° ± 7.0° (93.0° - 107.0°)',
      getStageVal(cogsSoftP.snGnC) !== null
        ? getStageVal(cogsSoftP.snGnC)! > 107.0
          ? 'Obtuse Chin-Throat Angle (Poor Chin-Neck Definition)'
          : getStageVal(cogsSoftP.snGnC)! < 93.0
          ? 'Acute Chin-Throat Angle (Well-defined Cervical Contour)'
          : 'Normal Submental-Cervical Angle'
        : 'Awaiting primary tracing data',
    ],
    [
      '6. Sn-Gn\' / C-Gn\' (Submental Distance Ratio)',
      getStageVal(cogsSoftP.snGnCGnRatio) !== null ? `${getStageVal(cogsSoftP.snGnCGnRatio)?.toFixed(2)}` : '—',
      '1.2 (1.10 - 1.30)',
      getStageVal(cogsSoftP.snGnCGnRatio) !== null
        ? getStageVal(cogsSoftP.snGnCGnRatio)! > 1.30
          ? 'Short Submental Throat Length'
          : getStageVal(cogsSoftP.snGnCGnRatio)! < 1.10
          ? 'Long Submental Throat Length'
          : 'Balanced Throat Length Ratio'
        : 'Awaiting primary tracing data',
    ],
    [
      '7. Cm-Sn-Ls (Nasolabial Angle)',
      getStageVal(cogsSoftP.cmSnLs) !== null ? `${getStageVal(cogsSoftP.cmSnLs)?.toFixed(1)}°` : '—',
      '102.0° ± 8.0° (94.0° - 110.0°)',
      getStageVal(cogsSoftP.cmSnLs) !== null
        ? getStageVal(cogsSoftP.cmSnLs)! < 94.0
          ? 'Acute Nasolabial Angle (Upper Lip Protrusion)'
          : getStageVal(cogsSoftP.cmSnLs)! > 110.0
          ? 'Obtuse Nasolabial Angle (Upper Lip Retrusion)'
          : 'Ideal Soft Tissue Nasolabial Contour'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ['COGS Soft Tissue Parameter', 'Measured Value', 'Legan-Burstone Norm', 'Diagnostic Clinical Inference'],
    cogsSoftRowsPart1,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    6.8,
    9.0
  );

  addSubsectionHeader("II. Lip Protrusions, Perioral Dynamics & Z-Angle (7 Parameters)");
  const cogsSoftRowsPart2: (string | number)[][] = [
    [
      '8. Ls-(Sn-Pg\') (Upper Lip Protrusion)',
      getStageVal(cogsSoftP.lsSnPg) !== null ? `${getStageVal(cogsSoftP.lsSnPg)?.toFixed(1)} mm` : '—',
      '3.0 ± 1.0 mm (2.0 - 4.0 mm)',
      getStageVal(cogsSoftP.lsSnPg) !== null
        ? getStageVal(cogsSoftP.lsSnPg)! > 4.0
          ? 'Upper Lip Protrusion'
          : getStageVal(cogsSoftP.lsSnPg)! < 2.0
          ? 'Upper Lip Retrusion'
          : 'Normal Upper Lip Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '9. Li-(Sn-Pg\') (Lower Lip Protrusion)',
      getStageVal(cogsSoftP.liSnPg) !== null ? `${getStageVal(cogsSoftP.liSnPg)?.toFixed(1)} mm` : '—',
      '2.0 ± 1.0 mm (1.0 - 3.0 mm)',
      getStageVal(cogsSoftP.liSnPg) !== null
        ? getStageVal(cogsSoftP.liSnPg)! > 3.0
          ? 'Lower Lip Protrusion'
          : getStageVal(cogsSoftP.liSnPg)! < 1.0
          ? 'Lower Lip Retrusion'
          : 'Normal Lower Lip Position'
        : 'Awaiting primary tracing data',
    ],
    [
      '10. Si-(Li-Pg\') (Mentolabial Sulcus Depth)',
      getStageVal(cogsSoftP.siLiPg) !== null ? `${getStageVal(cogsSoftP.siLiPg)?.toFixed(1)} mm` : '—',
      '4.0 ± 2.0 mm (2.0 - 6.0 mm)',
      getStageVal(cogsSoftP.siLiPg) !== null
        ? getStageVal(cogsSoftP.siLiPg)! > 6.0
          ? 'Deep Mentolabial Sulcus (Curled Lower Lip)'
          : getStageVal(cogsSoftP.siLiPg)! < 2.0
          ? 'Shallow Mentolabial Sulcus (Flat Chin-Lip Contour)'
          : 'Harmonious Mentolabial Sulcus Depth'
        : 'Awaiting primary tracing data',
    ],
    [
      '11. Sn-Stms / Sn-Stmi (Upper Lip Length Ratio)',
      getStageVal(cogsSoftP.snStmsSnStmiRatio) !== null ? `${getStageVal(cogsSoftP.snStmsSnStmiRatio)?.toFixed(2)}` : '—',
      '0.50 (0.45 - 0.55)',
      getStageVal(cogsSoftP.snStmsSnStmiRatio) !== null
        ? getStageVal(cogsSoftP.snStmsSnStmiRatio)! < 0.45
          ? 'Short Upper Lip Philtrum'
          : getStageVal(cogsSoftP.snStmsSnStmiRatio)! > 0.55
          ? 'Long Upper Lip Philtrum'
          : 'Balanced Lip Length Proportion'
        : 'Awaiting primary tracing data',
    ],
    [
      '12. Stms-I (Upper Incisor Exposure at Rest)',
      getStageVal(cogsSoftP.stmsI) !== null ? `${getStageVal(cogsSoftP.stmsI)?.toFixed(1)} mm` : '—',
      '2.0 ± 2.0 mm (0.0 - 4.0 mm)',
      getStageVal(cogsSoftP.stmsI) !== null
        ? getStageVal(cogsSoftP.stmsI)! > 4.0
          ? 'Excessive Incisor Display at Rest (Vertical Maxillary Excess)'
          : getStageVal(cogsSoftP.stmsI)! < 0.0
          ? 'Insufficient Incisor Display at Rest'
          : 'Ideal Incisor Exposure at Rest'
        : 'Awaiting primary tracing data',
    ],
    [
      '13. Stms-Stmi (Interlabial Gap)',
      getStageVal(cogsSoftP.stmsStmi) !== null ? `${getStageVal(cogsSoftP.stmsStmi)?.toFixed(1)} mm` : '—',
      '2.0 ± 2.0 mm (0.0 - 4.0 mm)',
      getStageVal(cogsSoftP.stmsStmi) !== null
        ? getStageVal(cogsSoftP.stmsStmi)! > 4.0
          ? 'Lip Incompetence / Increased Interlabial Gap'
          : 'Competent Lip Seal at Rest'
        : 'Awaiting primary tracing data',
    ],
    [
      '14. Merrifield\'s Z-Angle',
      getStageVal(cogsSoftP.merrifieldZAngle) !== null ? `${getStageVal(cogsSoftP.merrifieldZAngle)?.toFixed(1)}°` : '—',
      '80.0° ± 9.0° (71.0° - 89.0°)',
      getStageVal(cogsSoftP.merrifieldZAngle) !== null
        ? getStageVal(cogsSoftP.merrifieldZAngle)! < 71.0
          ? 'Acute Z-Angle / Facial Profile Protrusion'
          : getStageVal(cogsSoftP.merrifieldZAngle)! > 89.0
          ? 'Obtuse Z-Angle / Flat Profile'
          : 'Balanced Profile Esthetics (Merrifield Z-Angle)'
        : 'Awaiting primary tracing data',
    ],
  ];

  renderSlideTable(
    ['COGS Soft Tissue Parameter', 'Measured Value', 'Legan-Burstone Norm', 'Diagnostic Clinical Inference'],
    cogsSoftRowsPart2,
    [75, 38, 48, 104],
    ['left', 'center', 'center', 'left'],
    6.8,
    9.0
  );

  // =========================================================================
  // SLIDE 29: COGS SOFT TISSUE DIAGNOSTIC SUMMARY & INFERENCES
  // =========================================================================
  const cogsSoftPayload = buildCogsSoftInferencePayload(cogsSoftP, getStageVal);
  startNewSlide(
    '29. COGS Soft Tissue Analysis: Diagnostic Summary & Clinical Inferences',
    'Surgical Soft Tissue Profile, Perioral Dynamics, Lip Protrusions & Z-Angle'
  );
  renderFullSlideInferenceCard(
    'COGS Soft Tissue Analysis Overall Summary & Diagnostic Inference',
    activeStageLabel,
    cogsSoftPayload.inferencePoints,
    140
  );

  // =========================================================================
  // CEPHALOMETRIC DISCREPANCY & MASTER SYNTHESIS MODULE
  // =========================================================================
  const cephDisc = rad.cephDiscrepancyAnalysis || (patient as any).cephDiscrepancyAnalysis || {};
  const cephDiscP = cephDisc.parameters || cephDisc;
  const compCeph = (patient as any).comprehensiveCephAnalysis || (patient as any).cephAnalysisData || {};

  const findCephVal = (...candidateValues: (number | string | undefined | null)[]): number | null => {
    for (const c of candidateValues) {
      if (c !== undefined && c !== null && c !== '') {
        const num = Number(c);
        if (!isNaN(num)) return num;
      }
    }
    return null;
  };

  const anbVal = findCephVal(getStageVal(steinerP.anb), getStageVal(downsP.anb), getStageVal(cephDiscP.anbAngle), getStageVal(cephDiscP.anb), compCeph.anb_angle, compCeph.anb);
  const snaVal = findCephVal(getStageVal(steinerP.sna), getStageVal(downsP.sna), getStageVal(cephDiscP.snaAngle), compCeph.sna);
  const snbVal = findCephVal(getStageVal(steinerP.snb), getStageVal(downsP.snb), getStageVal(cephDiscP.snbAngle), compCeph.snb);
  const fmaVal = findCephVal(getStageVal(stP.fmpa), getStageVal(downsP.mandibularPlaneAngle), getStageVal(mcnamaraP.mandibularPlaneAngle), getStageVal(cephDiscP.fmaAngle), compCeph.fma);
  const witsVal = findCephVal(getStageVal(cephDiscP.wits), getStageVal(cephDiscP.witsAppraisal), getStageVal(cephDiscP.aoBo), compCeph.wits_appraisal, (patient.investigations as any)?.witsAppraisal);
  const harvoldDiffVal = findCephVal(getStageVal(cephDiscP.harvoldDifference), getStageVal(cephDiscP.harvoldUnitDiff), compCeph.harvold_unit_diff);
  const maxMandRatioVal = findCephVal(getStageVal(cephDiscP.maxMandRatio), getStageVal(cephDiscP.effectiveRatio), compCeph.max_mand_ratio);
  const snOrientVal = findCephVal(getStageVal(cephDiscP.snOrientationAngle), compCeph.sn_fh_angle);

  const hAngleVal = findCephVal(getStageVal(holdP.hAngle));
  const softProfileAngleVal = findCephVal(
    getStageVal(cephDiscP.softTissueProfileAngle),
    getStageVal(cogsSoftP.gSnPg),
    hAngleVal !== null ? 180 - hAngleVal : null
  );
  const isMalePatient = patient.gender === 'Male';
  const totalTissueProfileAngleVal = findCephVal(
    getStageVal(cephDiscP.totalTissueProfileAngle),
    getStageVal(cogsSoftP.totalProfileAngle)
  );
  const basicUpperLipVal = findCephVal(
    getStageVal(cephDiscP.basicUpperLip),
    getStageVal(holdP.basicUpperLipThickness),
    getStageVal(holdP.upperLipThickness),
    compCeph.basic_u_lip_thickness,
    compCeph.u_lip_thickness
  );
  const softChinVal = findCephVal(
    getStageVal(holdP.softTissueChinThickness),
    getStageVal(cephDiscP.softTissueChin),
    getStageVal(cogsSoftP.gPg)
  );
  const nasolabialVal = findCephVal(getStageVal(mcnamaraP.nasolabialAngle), getStageVal(cogsSoftP.cmSnLs), getStageVal(steinerP.nasolabialAngle), compCeph.nasolabial_angle);

  // --- SLIDE 30: MASTER CEPHALOMETRIC DISCREPANCY (PART 1: SAGITTAL STANDARDS & SOFT TISSUE) ---
  const sheet5Data = buildDiscrepancyMasterPayload1(cephDiscP, patient.gender || 'Female', getStageVal, steinerP, downsP, holdP, cogsSoftP, mcnamaraP, compCeph);
  startNewSlide('30. Master Cephalometric Discrepancy (Part 1: Sagittal Standards & Soft Tissue)', 'Hard Tissue Sagittal Standards, Soft Tissue Profile Metrics & Cranial Orientation (18 Parameters)');
  renderSlideTable(sheet5Data.tableHeaders, sheet5Data.rows, sheet5Data.colWidths, sheet5Data.alignments, sheet5Data.tableRowHeight, sheet5Data.customFontSize);

  // --- SLIDE 31: MASTER SAGITTAL DIAGNOSTIC SUMMARY ---
  startNewSlide(
    '31. Master Cephalometric Synthesis: Sagittal Architecture & Soft Tissue Inferences',
    'Comprehensive Sagittal Skeletal Architecture, Harvold Ratios & Integumental Profile Dynamics (Pre-Treatment)'
  );
  renderFullSlideInferenceCard(
    'Master Sagittal & Soft Tissue Profile Synthesis',
    activeStageLabel,
    sheet5Data.inferencePoints,
    140
  );

  // --- SLIDE 32: MASTER CEPHALOMETRIC DISCREPANCY (PART 2: MAXILLARY & MANDIBULAR BREAKDOWN) ---
  const sheet6Data = buildDiscrepancyMasterPayload2(cephDiscP, getStageVal, steinerP, downsP, mcnamaraP, cogsHardP, cogsSoftP, compCeph);
  startNewSlide('32. Master Cephalometric Discrepancy (Part 2: Maxillary & Mandibular Breakdown)', 'Maxillary & Mandibular Size, Length, Spatial Placement & Fault Localization (15 Parameters)');
  renderSlideTable(sheet6Data.tableHeaders, sheet6Data.rows, sheet6Data.colWidths, sheet6Data.alignments, sheet6Data.tableRowHeight, sheet6Data.customFontSize);

  // --- SLIDE 33: MASTER MAXILLARY & MANDIBULAR BREAKDOWN DIAGNOSTIC SUMMARY ---
  startNewSlide(
    '33. Diagnostic Summary & Inferences — Maxillary & Mandibular Breakdown',
    'Apical Base Dimensions, Ramus Geometry, Condylar Placement & Jaw Fault Localization (Pre-Treatment)'
  );
  renderFullSlideInferenceCard(
    'Maxillary & Mandibular Apical Base Breakdown & Fault Localization',
    activeStageLabel,
    sheet6Data.inferencePoints,
    140
  );

  // --- SLIDE 34: SN-FH CRANIAL BASE CORRECTION MATRIX & ANGULAR ADJUSTMENT ENGINE ---
  const snFhData = rad.snFhCorrectionAnalysis || (patient as any).snFhCorrectionAnalysis;
  const currentActiveStageKey: 'pre' | 'mid' | 'post' | 'retention' =
    rad.activeStage === 'mid' || rad.activeStage === 'post' || rad.activeStage === 'retention'
      ? rad.activeStage
      : 'pre';
  const snFhPayload = buildSnFhCorrectionMatrixPayload(
    snFhData,
    patient.gender || 'Female',
    steinerP,
    downsP,
    mcnamaraP,
    stP,
    compCeph,
    getStageVal,
    currentActiveStageKey
  );
  startNewSlide('34. SN-FH Cranial Base Correction Matrix & Angular Adjustment Engine', 'Automated Rotational Deviation Delta & True Skeletal/Dental Vector Normalization');
  renderSlideTable(
    snFhPayload.tableHeaders,
    snFhPayload.rows,
    snFhPayload.colWidths,
    snFhPayload.alignments,
    snFhPayload.tableRowHeight,
    snFhPayload.customFontSize
  );

  // --- SLIDE 35: DIAGNOSTIC SUMMARY & INFERENCES — SN-FH CRANIAL BASE CORRECTION ---
  startNewSlide(
    '35. Diagnostic Summary & Inferences — SN-FH Cranial Base Correction',
    'Rotational Deviation Delta, Masking Impact & True Biological Skeletal/Dental Vector Realignment (Pre-Treatment)'
  );
  renderFullSlideInferenceCard(
    'SN-FH Cranial Base Angular Correction & Diagnostic Inferences',
    activeStageLabel,
    snFhPayload.inferencePoints,
    140
  );

  // --- SLIDE 36: SHEET 1 (PART I: VERTICAL SKELETAL RELATION & ROTATIONAL DYNAMICS) ---
  const sheet1Part1Data = buildSheet1Part1Payload(compCeph, patient.gender || 'Female', steinerP, downsP, stP, mcnamaraP, cogsHardP, rickP, getStageVal);
  startNewSlide('36. Cephalometric Discrepancy (Sheet 1 — Part I: Vertical Skeletal Relation & Vectors)', 'Vertical Skeletal Angles, Facial Proportions & Rotational Polygon (Params 1–10)');
  renderSlideTable(sheet1Part1Data.tableHeaders, sheet1Part1Data.rows, sheet1Part1Data.colWidths, sheet1Part1Data.alignments, sheet1Part1Data.tableRowHeight, sheet1Part1Data.customFontSize);

  // --- SLIDE 37: DIAGNOSTIC SUMMARY & INFERENCES — VERTICAL SKELETAL PROPORTIONS & ROTATIONAL VECTOR ---
  startNewSlide(
    '37. Diagnostic Summary & Inferences — Vertical Skeletal Proportions & Rotational Vector',
    'Vertical Skeletal Ratios, Angular Divergence, Jarabak Growth Dynamics & Biomechanics Vector (Pre-Treatment)'
  );
  renderFullSlideInferenceCard(
    'Vertical Skeletal Proportions & Rotational Vector',
    activeStageLabel,
    sheet1Part1Data.inferencePoints,
    140
  );

  // --- SLIDE 38: SHEET 1 (PART II: CRANIAL GEOMETRY, RAMUS & DIVERGENCE CLASSIFICATION) ---
  const sheet1Part2Data = buildSheet1Part2Payload(compCeph, patient.gender || 'Female', steinerP, downsP, stP, mcnamaraP, cogsHardP, rickP, getStageVal);
  startNewSlide('38. Cephalometric Discrepancy (Sheet 1 — Part II: Ramus & Divergence Classification)', 'Growth Vectors, Ramus Compensation & 4 Divergence Sub-Classifications (Params 11–20)');
  renderSlideTable(sheet1Part2Data.tableHeaders, sheet1Part2Data.rows, sheet1Part2Data.colWidths, sheet1Part2Data.alignments, sheet1Part2Data.tableRowHeight, sheet1Part2Data.customFontSize);

  // --- SLIDE 39: DIAGNOSTIC SUMMARY & INFERENCES — CRANIAL GEOMETRY & RAMUS BUFFER ---
  startNewSlide(
    '39. Diagnostic Summary & Inferences — Cranial Geometry & Divergence Classification',
    'Cranial Flexure, Articular/Saddle Angles, Ramus Compensation & 4 Divergence Sub-Classifications (Pre-Treatment)'
  );
  renderFullSlideInferenceCard(
    'Cranial Geometry, Ramus Buffer & Divergence Categorization',
    activeStageLabel,
    sheet1Part2Data.inferencePoints,
    140
  );

  // --- SLIDE 40: SHEET 2 (SAGITTAL & VERTICAL INTERACTION / EXPOSURE) ---
  const sagVertData = rad.sagittalVerticalInteractionAnalysis || (patient as any).sagittalVerticalInteractionAnalysis || (compCeph as any).sagittalVerticalInteractionAnalysis;
  const sheet2Data = buildSheet2Payload(compCeph, anbVal, fmaVal, sagVertData, patient.gender || 'Female', patient.age || 14);
  startNewSlide('40. Comprehensive Cephalometric Discrepancy (Sheet 2: Sagittal & Vertical Interaction / Exposure)', 'Interaction Dynamics, Incisor Exposure Differential, Cortical Limits & Treatment Tree (14 Parameters)');
  renderSlideTable(sheet2Data.tableHeaders, sheet2Data.rows, sheet2Data.colWidths, sheet2Data.alignments, sheet2Data.tableRowHeight, sheet2Data.customFontSize);

  // --- SLIDE 41: DIAGNOSTIC SUMMARY & INFERENCES — SAGITTAL & VERTICAL INTERACTION ---
  startNewSlide(
    '41. Diagnostic Summary & Inferences — Sagittal & Vertical Interaction & Treatment Tree',
    'Interaction Dynamics, Incisor Exposure Differential, Cortical Limits & Treatment Tree (Pre-Treatment)'
  );
  renderFullSlideInferenceCard(
    'Sagittal / Vertical Interaction, Cortical Limits & Treatment Tree',
    activeStageLabel,
    sheet2Data.inferencePoints,
    140
  );

  // --- SLIDE 42: SHEET 3 (UPPER DENTO-ALVEOLAR & SOFT TISSUE) ---
  const sheet3Data = buildSheet3Payload(compCeph, downsP, steinerP, mcnamaraP, holdP, getStageVal);
  startNewSlide('42. Comprehensive Cephalometric Discrepancy (Sheet 3: Upper Dento-Alveolar & Soft Tissue)', 'Maxillary Basal Position, Upper Incisor Proclination & Nasolabial Aesthetics (13 Parameters)');
  renderSlideTable(sheet3Data.tableHeaders, sheet3Data.rows, sheet3Data.colWidths, sheet3Data.alignments, sheet3Data.tableRowHeight, sheet3Data.customFontSize);

  // --- SLIDE 43: DIAGNOSTIC SUMMARY & INFERENCES — UPPER DENTO-ALVEOLAR & NASOLABIAL AESTHETICS ---
  startNewSlide(
    '43. Diagnostic Summary & Inferences — Upper Dento-Alveolar & Nasolabial Aesthetics',
    'Maxillary Incisor Torque, Retraction Limits, Lip Cushion Buffer & Profile Dynamics (Pre-Treatment)'
  );
  renderFullSlideInferenceCard(
    'Upper Dento-Alveolar & Nasolabial Aesthetics',
    activeStageLabel,
    sheet3Data.inferencePoints,
    140
  );

  // --- SLIDE 44: SHEET 4 (LOWER DENTO-ALVEOLAR & SOFT TISSUE) ---
  const sheet4Data = buildSheet4Payload(compCeph, stP, downsP, steinerP, rickP, getStageVal);
  startNewSlide('44. Comprehensive Cephalometric Discrepancy (Sheet 4: Lower Dento-Alveolar & Soft Tissue)', 'Mandibular Incisor Inclination, Holdaway Harmony & Mentolabial Sulcus (10 Parameters)');
  renderSlideTable(sheet4Data.tableHeaders, sheet4Data.rows, sheet4Data.colWidths, sheet4Data.alignments, sheet4Data.tableRowHeight, sheet4Data.customFontSize);

  // --- SLIDE 45: DIAGNOSTIC SUMMARY & INFERENCES — LOWER DENTO-ALVEOLAR & TWEED-HOLDAWAY EQUILIBRIUM ---
  startNewSlide(
    '45. Diagnostic Summary & Inferences — Lower Dento-Alveolar & Tweed-Holdaway Equilibrium',
    'Mandibular Incisor Biological Envelope, IMPA/FMIA Limits & Tweed-Holdaway Equilibrium (Pre-Treatment)'
  );
  renderFullSlideInferenceCard(
    'Lower Dento-Alveolar & Tweed-Holdaway Equilibrium',
    activeStageLabel,
    sheet4Data.inferencePoints,
    140
  );

  // =========================================================================
  // SLIDE 46: MASTER CEPHALOMETRIC SYNTHESIS
  // =========================================================================
  const totalProfileNormText = isMalePatient ? '133.0° (130.0° - 136.0°)' : '137.0° (134.0° - 140.0°)';

  startNewSlide('46. Master Cephalometric Synthesis: Skeletal Basal Architecture & Dentoalveolar Limits', 'Definitive Skeletal Classification, Growth Vector Trajectory & Incisor Compensation Limits');

  let diagnosedSkeletalClass = 'Skeletal Class I';
  let diagnosedSeverity = 'Mild';
  let diagnosedSoftInteraction = 'Matching';

  if (anbVal !== null) {
    if (anbVal > 4.0) {
      diagnosedSkeletalClass = 'Skeletal Class II';
      diagnosedSeverity = anbVal > 7.5 || (witsVal !== null && witsVal > 5.0) ? 'Severe' : anbVal > 5.5 || (witsVal !== null && witsVal > 2.5) ? 'Moderate' : 'Mild';
    } else if (anbVal < 0.0) {
      diagnosedSkeletalClass = 'Skeletal Class III';
      diagnosedSeverity = anbVal < -4.0 || (witsVal !== null && witsVal < -5.0) ? 'Severe' : anbVal < -2.0 || (witsVal !== null && witsVal < -2.5) ? 'Moderate' : 'Mild';
    } else {
      diagnosedSkeletalClass = 'Skeletal Class I';
      diagnosedSeverity = 'Mild';
    }
  }

  if (diagnosedSkeletalClass === 'Skeletal Class II') {
    if ((softChinVal !== null && softChinVal > 12.0) || (basicUpperLipVal !== null && basicUpperLipVal > 15.0)) {
      diagnosedSoftInteraction = 'Compensating (Soft tissue cushioning masks underlying mandibular retrusion)';
    } else if ((softChinVal !== null && softChinVal < 10.0) || (softProfileAngleVal !== null && softProfileAngleVal < 155.0)) {
      diagnosedSoftInteraction = 'Aggravating (Thin chin cushion & convex profile exaggerate Class II retrusion)';
    } else {
      diagnosedSoftInteraction = 'Matching (Soft tissue envelope directly reflects Class II basal foundation)';
    }
  } else if (diagnosedSkeletalClass === 'Skeletal Class III') {
    if ((softChinVal !== null && softChinVal > 12.0) || (softProfileAngleVal !== null && softProfileAngleVal > 168.0)) {
      diagnosedSoftInteraction = 'Aggravating (Thick chin cushion exaggerates mandibular prominence)';
    } else if (softChinVal !== null && softChinVal < 10.0) {
      diagnosedSoftInteraction = 'Compensating (Thin chin pad softens skeletal prognathism)';
    } else {
      diagnosedSoftInteraction = 'Matching (Soft tissue envelope directly reflects Class III foundation)';
    }
  } else {
    diagnosedSoftInteraction = 'Matching (Harmonious soft tissue profile over Class I basal foundation)';
  }

  // Top Summaries: Skeletal Classification & Soft Tissue Dynamics
  const bannerW = (contentWidth - 6) / 2;
  const bannerH = 18;

  // Left Diagnostic Card: Skeletal Classification
  doc.setFillColor(240, 253, 250); // teal-50
  doc.setDrawColor(13, 148, 136); // teal-600
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, bannerW, bannerH, 2, 2, 'FD');

  doc.setFillColor(13, 148, 136); // teal-600
  doc.roundedRect(margin, y, bannerW, 6, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('PRIMARY SKELETAL CLASSIFICATION & SEVERITY', margin + 3.5, y + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.0);
  doc.setTextColor(15, 118, 110); // teal-800
  doc.text(`${diagnosedSkeletalClass.toUpperCase()} (${diagnosedSeverity.toUpperCase()} SEVERITY)`, margin + 4, y + 11.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(`ANB: ${anbVal !== null ? anbVal.toFixed(1) + '°' : 'N/A'} | Wits: ${witsVal !== null ? witsVal.toFixed(1) + ' mm' : 'N/A'} | Harvold Diff: ${harvoldDiffVal !== null ? harvoldDiffVal.toFixed(1) + ' mm' : 'N/A'} | Ratio: ${maxMandRatioVal !== null ? maxMandRatioVal.toFixed(2) : '1.00'}`, margin + 4, y + 15.2);

  // Right Diagnostic Card: Soft Tissue Interaction
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(79, 70, 229); // indigo-600
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + bannerW + 6, y, bannerW, bannerH, 2, 2, 'FD');

  doc.setFillColor(79, 70, 229); // indigo-600
  doc.roundedRect(margin + bannerW + 6, y, bannerW, 6, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('SOFT TISSUE ENVELOPE INTERACTION DYNAMICS', margin + bannerW + 9, y + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.8);
  doc.setTextColor(67, 56, 202); // indigo-700
  const shortInteractionTitle = diagnosedSoftInteraction.split('(')[0].trim().toUpperCase();
  doc.text(`${shortInteractionTitle} SOFT TISSUE DYNAMICS`, margin + bannerW + 10, y + 11.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // slate-700
  const subSoftDesc = diagnosedSoftInteraction.includes('(') ? diagnosedSoftInteraction.split('(')[1].replace(')', '') : 'Balanced lip and chin cushion dynamics.';
  doc.text(doc.splitTextToSize(subSoftDesc, bannerW - 8)[0], margin + bannerW + 10, y + 15.2);

  y += bannerH + 4.5;

  const masterSkeletalText = anbVal !== null
    ? anbVal > 4.0
      ? `Skeletal Class II Basal Discrepancy (${diagnosedSeverity} severity, ANB ${anbVal.toFixed(1)}°, Wits ${witsVal !== null ? witsVal.toFixed(1) + ' mm' : 'N/A'}, Harvold diff ${harvoldDiffVal !== null ? harvoldDiffVal.toFixed(1) + ' mm' : 'N/A'}) with ${fmaVal && fmaVal > 29 ? 'Hyperdivergent / High-Angle clockwise growth vector' : fmaVal && fmaVal < 21 ? 'Hypodivergent / Low-Angle counter-clockwise growth vector' : 'Normodivergent balanced growth'} (${snaVal && snaVal > 84 ? 'maxillary skeletal excess' : snbVal && snbVal < 78 ? 'mandibular retrognathism' : 'combined sagittal disharmony'}).`
      : anbVal < 0.0
      ? `Skeletal Class III Basal Discrepancy (${diagnosedSeverity} severity, ANB ${anbVal.toFixed(1)}°, Wits ${witsVal !== null ? witsVal.toFixed(1) + ' mm' : 'N/A'}, Harvold diff ${harvoldDiffVal !== null ? harvoldDiffVal.toFixed(1) + ' mm' : 'N/A'}) with ${fmaVal && fmaVal > 29 ? 'Hyperdivergent pattern' : fmaVal && fmaVal < 21 ? 'Hypodivergent pattern' : 'Normodivergent pattern'} (${snbVal && snbVal > 82 ? 'mandibular prognathism' : 'maxillary skeletal retrusion'}).`
      : `Skeletal Class I Harmonious Relationship (ANB ${anbVal.toFixed(1)}°, Wits ${witsVal !== null ? witsVal.toFixed(1) + ' mm' : '0.0 mm'}, Harvold diff ${harvoldDiffVal !== null ? harvoldDiffVal.toFixed(1) + ' mm' : '26.0 mm'}) with ${fmaVal && fmaVal > 29 ? 'hyperdivergent vertical tendency' : fmaVal && fmaVal < 21 ? 'hypodivergent horizontal tendency' : 'balanced vertical facial proportions'}.`
    : 'Skeletal basal and vertical parameters synthesized across Steiner, Downs, Tweed, McNamara and COGS analyses.';

  const masterDentalText = (getStageVal(stP.impa) !== null || getStageVal(steinerP.u1NaDeg) !== null)
    ? `Dentoalveolar compensation: Lower incisors aligned on basal bone with balanced upper incisor inclination and physiological torque envelope.`
    : 'Incisor inclination and dentoalveolar compensation limits within physiological norms.';

  const masterSoftText = `Profile: ${patient.extraoralProfile?.profile || (anbVal && anbVal > 4 ? 'Convex' : 'Straight')}; Angle ${softProfileAngleVal ? softProfileAngleVal.toFixed(1) + '°' : '161°'}, Total ${totalTissueProfileAngleVal ? totalTissueProfileAngleVal.toFixed(1) + '°' : totalProfileNormText}, Nasolabial ${nasolabialVal ? nasolabialVal.toFixed(1) + '°' : '102°'}, Upper Lip ${basicUpperLipVal ? basicUpperLipVal.toFixed(1) + ' mm' : '14 mm'}, Soft Chin ${softChinVal ? softChinVal.toFixed(1) + ' mm' : '11 mm'}.`;

  renderTwoColumnCard(
    'I. Sagittal & Vertical Skeletal Basal Architecture',
    [
      { label: 'Skeletal Diagnosis', value: `${diagnosedSkeletalClass} (${diagnosedSeverity} Severity)` },
      { label: 'Apical Base Discrepancy', value: masterSkeletalText },
      { label: 'Vertical Vector Trajectory', value: fmaVal && fmaVal > 29 ? 'Hyperdivergent / Clockwise Facial Growth (High Angle)' : fmaVal && fmaVal < 21 ? 'Hypodivergent / Counter-Clockwise Facial Growth (Low Angle)' : 'Normodivergent Balanced Growth (Neutral Angle)' },
      { label: 'Cranial Orientation', value: snOrientVal && snOrientVal > 9 ? 'Steep cranial base inclination (Tilted SN reference)' : 'Standard cranial base inclination (8.0° - 9.0° to FH)' },
      { label: 'Soft Tissue Profile Balance', value: masterSoftText },
    ],
    'II. Dentoalveolar Compensation & Incisor Stability Limits',
    [
      { label: 'Upper Incisor Angulation', value: getStageVal(steinerP.u1NaDeg) !== null ? `${getStageVal(steinerP.u1NaDeg)?.toFixed(1)}° (Normal Torque)` : 'Normal Torque' },
      { label: 'Mandibular Incisor (IMPA)', value: getStageVal(stP.impa) !== null ? `${getStageVal(stP.impa)?.toFixed(1)}° (Stable 90° Alignment)` : 'Stable 90° Alignment' },
      { label: 'Dentoalveolar Compensation', value: masterDentalText },
      { label: 'Tweed-Holdaway Relapse Line', value: 'Position lower incisor within 1.0mm of A-Pog line for lifelong periodontal stability' },
      { label: 'Interincisal Equilibrium', value: 'Harmonious Interincisal Angle' },
    ],
    128
  );

  // =========================================================================
  // SLIDE 47: CLINICAL DIAGNOSIS & POSTGRADUATE 5-AXIS PROBLEM LIST
  // =========================================================================
  const dp = patient.diagnosisAndPlan || (patient as any).diagnosisPlan || ({} as any);
  const sd = patient.studentDiagnosis || (patient as any).synthesizedDiagnosis || ({} as any);

  startNewSlide('47. Clinical Diagnosis & Problem List Synthesis', 'Comprehensive 5-Axis Postgraduate Problem List');

  renderTwoColumnCard(
    'Primary Clinical & Skeletal Diagnosis',
    [
      { label: 'Provisional Diagnosis', value: dp.provisionalDiagnosis || 'Comprehensive Orthodontic Malocclusion' },
      { label: 'Skeletal Classification', value: dp.skeletalClass || 'Skeletal Class I' },
      { label: 'Dental Classification', value: dp.dentalClass || 'Class I' },
      { label: 'Soft Tissue Profile', value: dp.softTissueProfile || 'Straight profile with competent lips' },
      { label: 'Integrated Synthesis', value: sd.synthesizedParagraph || dp.provisionalDiagnosis || 'Postgraduate diagnosis synthesized across sagittal, vertical, and transverse axes.' },
    ],
    'Postgraduate 5-Axis Problem List',
    [
      { label: 'Axis 1: Skeletal AP & Vertical', value: `${sd.skeletalAnteroposterior || 'Class II tendency'} • ${sd.skeletalVertical || 'Normodivergent'}` },
      { label: 'Axis 2: Skeletal Transverse', value: sd.skeletalTransverse || 'Normal transverse jaw relationship' },
      { label: 'Axis 3: Dental Occlusion', value: `${sd.dentalMolarCanine || 'Angle Class I / II'} • ${sd.dentalOverjetOverbite || 'Increased overjet'}` },
      { label: 'Axis 4: Dental Alignment', value: sd.dentalAlignmentDiscrepancy || 'Moderate crowding in both arches' },
      { label: 'Axis 5: Soft Tissue & Aesthetics', value: `${sd.softTissueProfileAesthetics || 'Convex profile'} • ${sd.softTissueLipCompetency || 'Potentially competent'}` },
    ],
    140
  );

  // =========================================================================
  // SLIDE 48: COMPREHENSIVE TREATMENT STRATEGY & PROFFIT 3-PHASE BIOMECHANICS (UNIFIED 2-COLUMN SLIDE)
  // =========================================================================
  const tp = patient.studentTreatmentPlan || ({} as any);

  startNewSlide('48. Comprehensive Treatment Strategy & Proffit 3-Phase Biomechanics Protocol', 'Postgraduate Treatment Planning, Anchorage Directive & Staged Wire Mechanics');

  renderTwoColumnCard(
    'Treatment Strategy & Appliance Modality',
    [
      { label: 'Proposed Modality', value: tp.treatmentModality || 'Fixed Appliance Therapy (Pre-adjusted Edgewise)' },
      { label: 'Extraction Decision', value: dp.extractionPlan || tp.extractionDecision || 'Non-Extraction' },
      { label: 'Growth Modification', value: tp.growthModification || 'None / Not indicated (Post-pubertal growth status)' },
      { label: 'Surgical Plan', value: tp.surgicalPlan || 'Orthognathic surgery not indicated (Camouflage / Conventional ortho)' },
      { label: 'Expansion Protocol', value: tp.expansionPlan || 'Slow maxillary expansion / Dentoalveolar coordination' },
      { label: 'Estimated Duration', value: tp.estimatedDuration || '18 - 24 Months' },
      { label: 'Treatment Objectives', value: tp.treatmentObjectives || 'Achieve Class I occlusion, optimal overjet/overbite, and harmonious soft tissue profile.' },
    ],
    'Proffit 3-Phase Biomechanics & Retention',
    [
      { label: 'Phase 1: Alignment & Leveling', value: tp.phase1AlignmentLeveling || '0.014" NiTi -> 0.016" NiTi -> 0.019x0.025" NiTi wire sequence' },
      { label: 'Phase 2: Space Closure & AP', value: tp.phase2MolarSpaceClosure || '0.019x0.025" SS working wires with sliding mechanics / NiTi closing springs' },
      { label: 'Phase 3: Finishing & Detailing', value: tp.phase3FinishingDetailing || '0.019x0.025" TMA / 0.016" SS with settling elastics' },
      { label: 'Anchorage Planning & Control', value: tp.anchoragePlanning || 'Maximum anchorage in upper arch / moderate anchorage in lower arch' },
      { label: 'Intermaxillary Elastics', value: tp.elastics || 'Class II / Settling elastics during finishing & detailing' },
      { label: 'Retention Modality & Protocol', value: tp.retentionPhase || dp.retentionPlan || tp.retentionPlan || 'Upper Hawley Retainer + Lower Fixed 3-3 Lingual Retainer' },
      { label: 'Patient Instructions & Care', value: tp.patientInstructions || 'Strict appliance hygiene, wear elastics as instructed, attend regular follow-ups' },
    ],
    140
  );

  // =========================================================================
  // SLIDE 49: FACULTY APPROVAL, INSTITUTIONAL VERIFICATION & FORMAL SIGNATURE BLOCKS
  // =========================================================================
  startNewSlide('49. Faculty Approval, Feedback Audit & Formal Signatures', 'Departmental Verification, Case Log Sign-Off & Academic Audit');

  // Left Column: Audit & Submission Record
  const colWidth = (contentWidth - 8) / 2; // 128.5 mm
  const leftX = margin;
  const rightX = margin + colWidth + 8;
  const cardHeight = 142;
  const startCardY = y;
  const headerH = 10.5;

  // Left Container: Submission Status
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(leftX, startCardY, colWidth, cardHeight, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftX, startCardY, colWidth, headerH, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.line(leftX, startCardY + headerH, leftX + colWidth, startCardY + headerH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(13, 148, 136);
  doc.text('Postgraduate Case History Verification', leftX + 4, startCardY + 7.0);

  const auditItems = [
    { label: 'Patient Record ID', value: patient.patientId || 'ORTHO-CASE-001' },
    { label: 'Patient Name & Age', value: `${patient.name} (${patient.age || '—'} Yrs / ${patient.gender || '—'})` },
    { label: 'Postgraduate Resident', value: profile.studentName || 'Resident Doctor' },
    { label: 'Institutional Roll Number', value: profile.rollNumber || 'ORTHO-PG-01' },
    { label: 'Department / Institution', value: profile.institution || 'Department of Orthodontics' },
    { label: 'Assigned Faculty Guide', value: profile.supervisorName || patient.staffReviewerName || 'Faculty Supervisor' },
    { label: 'Examination / Record Date', value: patient.examDate || new Date().toLocaleDateString() },
  ];

  const rowH = (cardHeight - headerH - 2) / auditItems.length;
  auditItems.forEach((item, r) => {
    const curRowY = startCardY + headerH + 1 + r * rowH;
    if (r % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(leftX + 0.5, curRowY, colWidth - 1, rowH, 'F');
    }
    if (r < auditItems.length - 1) {
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(leftX + 2, curRowY + rowH, leftX + colWidth - 2, curRowY + rowH);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(51, 65, 85);
    doc.text(item.label, leftX + 4, curRowY + rowH / 2 + 1.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.2);
    doc.setTextColor(15, 23, 42);
    doc.text(item.value, leftX + colWidth - 4, curRowY + rowH / 2 + 1.2, { align: 'right' });
  });

  // Right Column: 3 Dedicated Formal Signature & Stamp Boxes
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(rightX, startCardY, colWidth, cardHeight, 2, 2, 'FD');

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(rightX, startCardY, colWidth, headerH, 2, 2, 'FD');
  doc.setDrawColor(226, 232, 240);
  doc.line(rightX, startCardY + headerH, rightX + colWidth, startCardY + headerH);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.setTextColor(13, 148, 136);
  doc.text('Institutional Verification & Signatures', rightX + 4, startCardY + 7.0);

  const sigBoxH = 38;
  const sigPad = 3.5;

  // Box 1: Student Orthodontist
  const box1Y = startCardY + headerH + 3.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(rightX + sigPad, box1Y, colWidth - sigPad * 2, sigBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 118, 110);
  doc.text('1. STUDENT ORTHODONTIST', rightX + sigPad + 3, box1Y + 5.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`${profile.studentName || 'Student Doctor'} • Roll No: ${profile.rollNumber || 'N/A'}`, rightX + sigPad + 3, box1Y + 10.2);

  doc.setDrawColor(203, 213, 225);
  doc.line(rightX + colWidth - sigPad - 45, box1Y + 28, rightX + colWidth - sigPad - 4, box1Y + 28);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Student Signature', rightX + colWidth - sigPad - 24, box1Y + 32, { align: 'center' });
  doc.text(`Date: ${new Date().toLocaleDateString()}`, rightX + sigPad + 3, box1Y + 32);

  // Box 2: Faculty Supervisor
  const box2Y = box1Y + sigBoxH + 3.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(rightX + sigPad, box2Y, colWidth - sigPad * 2, sigBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 118, 110);
  doc.text('2. FACULTY GUIDE / SUPERVISOR', rightX + sigPad + 3, box2Y + 5.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`${profile.supervisorName || 'Prof. Dr. Faculty Guide'} • Dept. of Orthodontics`, rightX + sigPad + 3, box2Y + 10.2);

  doc.setDrawColor(203, 213, 225);
  doc.line(rightX + colWidth - sigPad - 45, box2Y + 28, rightX + colWidth - sigPad - 4, box2Y + 28);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Faculty Signature & Stamp', rightX + colWidth - sigPad - 24, box2Y + 32, { align: 'center' });
  doc.text('Date: ________________', rightX + sigPad + 3, box2Y + 32);

  // Box 3: Head of Department
  const box3Y = box2Y + sigBoxH + 3.5;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.25);
  doc.roundedRect(rightX + sigPad, box3Y, colWidth - sigPad * 2, sigBoxH, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(15, 118, 110);
  doc.text('3. HEAD OF DEPARTMENT (HOD)', rightX + sigPad + 3, box3Y + 5.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  doc.text(`${patient.hodReviewerName || 'Professor & Head of Department'}`, rightX + sigPad + 3, box3Y + 10.2);

  doc.setDrawColor(203, 213, 225);
  doc.line(rightX + colWidth - sigPad - 45, box3Y + 28, rightX + colWidth - sigPad - 4, box3Y + 28);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Department Seal & Signature', rightX + colWidth - sigPad - 24, box3Y + 32, { align: 'center' });
  doc.text('Date: ________________', rightX + sigPad + 3, box3Y + 32);

  // =========================================================================
  // GLOBAL PRESENTATION SLIDE FOOTERS ON ALL PAGES (10pt Muted Text)
  // =========================================================================
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(100, 116, 139); // slate-500 muted text

    doc.text(
      `Case ID: ${patient.patientId || 'N/A'} • Patient: ${patient.name}`,
      margin,
      pageHeight - 7.0
    );

    doc.text(
      `Slide ${i} of ${totalPages} | ${new Date().toLocaleDateString()} | Developed by Dr. Salman MDS Orthodontist in collaboration with Dr. Raghu Devanna & Dr. K. Srinivas Karnam`,
      margin + contentWidth,
      pageHeight - 7.0,
      { align: 'right' }
    );
  }

  return doc;
}

export function generatePatientPDF(patient: PatientRecord, profile: StudentProfile): void {
  const doc = buildPatientPDFDoc(patient, profile);
  const fileName = `${patient.patientId || 'Case'}_${patient.name.replace(/\s+/g, '_')}_Orthodontic_Presentation.pdf`;
  doc.save(fileName);
}
