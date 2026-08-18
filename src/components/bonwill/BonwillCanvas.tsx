import React, { useRef, useState, useEffect, useCallback, memo } from 'react';
import { Point2D, BonwillTemplateData } from '../../types';
import { CalculatedHawleyGeometry, HawleyLandmarkPoint } from './BonwillGeometry';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface BonwillCanvasProps {
  data: BonwillTemplateData;
  geometry: CalculatedHawleyGeometry;
}

export const BonwillCanvas = memo(function BonwillCanvas({ data, geometry: geom }: BonwillCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Zoom & Pan transformation state
  const [zoom, setZoom] = useState<number>(5.0); // pixels per mm
  const [pan, setPan] = useState<Point2D>({ x: 0, y: -30 }); // pan offset in pixels
  const [hoveredPosMm, setHoveredPosMm] = useState<Point2D | null>(null);
  const [hoveredNode, setHoveredNode] = useState<HawleyLandmarkPoint | null>(null);
  const hoverRafRef = useRef<number | null>(null);

  // Convert mm world coordinates to Canvas pixel coordinates
  const worldToScreen = useCallback(
    (pt: Point2D, width: number, height: number): Point2D => {
      const centerX = width / 2 + pan.x;
      const centerY = height * 0.22 + pan.y; // Place apex A near top center
      return {
        x: centerX + pt.x * zoom,
        y: centerY - pt.y * zoom, // Invert Y so depth goes downwards on screen
      };
    },
    [zoom, pan]
  );

  // Convert Canvas pixel coordinates to mm world coordinates
  const screenToWorld = useCallback(
    (screenPt: Point2D, width: number, height: number): Point2D => {
      const centerX = width / 2 + pan.x;
      const centerY = height * 0.22 + pan.y;
      const worldX = (screenPt.x - centerX) / zoom;
      const worldY = -(screenPt.y - centerY) / zoom;
      return { x: worldX, y: worldY };
    },
    [zoom, pan]
  );

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const isDark = data.themeMode !== 'light';
    const bgColor = isDark ? '#090d16' : '#ffffff';
    const grid1mmColor = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
    const grid5mmColor = isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.08)';
    const grid10mmColor = isDark ? 'rgba(56, 189, 248, 0.20)' : 'rgba(15, 23, 42, 0.18)';
    const axisColor = isDark ? '#38bdf8' : '#0284c7';
    const textColor = isDark ? '#94a3b8' : '#475569';

    // Clear background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Screen origin
    const origin = worldToScreen({ x: 0, y: 0 }, width, height);

    // -------------------------------------------------------------
    // 1. MILLIMETER GRAPH PAPER (1mm, 5mm, 10mm Grid)
    // -------------------------------------------------------------
    if (data.showGrid) {
      const minMm = screenToWorld({ x: 0, y: height }, width, height);
      const maxMm = screenToWorld({ x: width, y: 0 }, width, height);

      const startX = Math.floor(minMm.x) - 2;
      const endX = Math.ceil(maxMm.x) + 2;
      const startY = Math.floor(minMm.y) - 2;
      const endY = Math.ceil(maxMm.y) + 2;

      // 1mm Grid
      ctx.lineWidth = 0.5;
      for (let x = startX; x <= endX; x += 1) {
        if (x % 5 === 0) continue;
        const pt = worldToScreen({ x, y: 0 }, width, height);
        ctx.strokeStyle = grid1mmColor;
        ctx.beginPath();
        ctx.moveTo(pt.x, 0);
        ctx.lineTo(pt.x, height);
        ctx.stroke();
      }
      for (let y = startY; y <= endY; y += 1) {
        if (y % 5 === 0) continue;
        const pt = worldToScreen({ x: 0, y }, width, height);
        ctx.strokeStyle = grid1mmColor;
        ctx.beginPath();
        ctx.moveTo(0, pt.y);
        ctx.lineTo(width, pt.y);
        ctx.stroke();
      }

      // 5mm Grid
      for (let x = startX - (startX % 5); x <= endX; x += 5) {
        if (x % 10 === 0) continue;
        const pt = worldToScreen({ x, y: 0 }, width, height);
        ctx.strokeStyle = grid5mmColor;
        ctx.beginPath();
        ctx.moveTo(pt.x, 0);
        ctx.lineTo(pt.x, height);
        ctx.stroke();
      }
      for (let y = startY - (startY % 5); y <= endY; y += 5) {
        if (y % 10 === 0) continue;
        const pt = worldToScreen({ x: 0, y }, width, height);
        ctx.strokeStyle = grid5mmColor;
        ctx.beginPath();
        ctx.moveTo(0, pt.y);
        ctx.lineTo(width, pt.y);
        ctx.stroke();
      }

      // 10mm Grid & Axis Numbers
      for (let x = startX - (startX % 10); x <= endX; x += 10) {
        const pt = worldToScreen({ x, y: 0 }, width, height);
        ctx.strokeStyle = grid10mmColor;
        ctx.lineWidth = x === 0 ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(pt.x, 0);
        ctx.lineTo(pt.x, height);
        ctx.stroke();

        // X Axis text numbers
        if (x !== 0 && pt.x > 20 && pt.x < width - 20) {
          ctx.font = '10px monospace';
          ctx.fillStyle = textColor;
          ctx.textAlign = 'center';
          ctx.fillText(`${x}`, pt.x, Math.max(20, Math.min(height - 10, origin.y + 12)));
        }
      }

      for (let y = startY - (startY % 10); y <= endY; y += 10) {
        const pt = worldToScreen({ x: 0, y }, width, height);
        ctx.strokeStyle = grid10mmColor;
        ctx.lineWidth = y === 0 ? 1.5 : 0.8;
        ctx.beginPath();
        ctx.moveTo(0, pt.y);
        ctx.lineTo(width, pt.y);
        ctx.stroke();

        // Y Axis text numbers
        if (y !== 0 && pt.y > 20 && pt.y < height - 20) {
          ctx.font = '10px monospace';
          ctx.fillStyle = textColor;
          ctx.textAlign = 'right';
          ctx.fillText(`${y}`, Math.max(30, Math.min(width - 10, origin.x - 6)), pt.y + 3);
        }
      }
    }

    // -------------------------------------------------------------
    // 2. CENTRAL AXIS LINES (X = Transverse, Y = Depth)
    // -------------------------------------------------------------
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = axisColor;

    // Y Axis (Mid-Sagittal Line)
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, height);
    ctx.stroke();

    // X Axis (Incisal Baseline at y=0)
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(width, origin.y);
    ctx.stroke();

    // Axis Labels
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = axisColor;
    ctx.textAlign = 'left';
    ctx.fillText('Y (Depth mm)', origin.x + 8, 20);
    ctx.textAlign = 'right';
    ctx.fillText('X (Transverse mm)', width - 15, origin.y - 8);

    // -------------------------------------------------------------
    // 3. CONSTRUCTION GEOMETRY (HAWLEY METHOD B CIRCLES & RAYS)
    // -------------------------------------------------------------
    if (data.showConstructionLines) {
      const centerB = worldToScreen(geom.pointB, width, height);
      const radiusPx = geom.r * zoom;

      // Primary Equilateral Triangle Arc Circle (Radius r, Center B)
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.45)' : 'rgba(2, 132, 199, 0.45)';
      ctx.beginPath();
      ctx.arc(centerB.x, centerB.y, radiusPx, 0, 2 * Math.PI);
      ctx.stroke();

      // Outer Circle (2r, center B)
      ctx.setLineDash([3, 5]);
      ctx.strokeStyle = isDark ? 'rgba(168, 85, 247, 0.4)' : 'rgba(126, 34, 206, 0.4)';
      ctx.beginPath();
      ctx.arc(centerB.x, centerB.y, 2 * radiusPx, 0, 2 * Math.PI);
      ctx.stroke();

      // 42-Degree Divergence Ray Lines
      ctx.setLineDash([6, 3]);
      ctx.strokeStyle = isDark ? 'rgba(251, 146, 60, 0.7)' : 'rgba(234, 88, 12, 0.7)';
      ctx.lineWidth = 1.5;

      const scrCanineL = worldToScreen(geom.canineLeft, width, height);
      const scrRayEndL = worldToScreen(geom.leftRayPoints[1], width, height);
      ctx.beginPath();
      ctx.moveTo(scrCanineL.x, scrCanineL.y);
      ctx.lineTo(scrRayEndL.x, scrRayEndL.y);
      ctx.stroke();

      const scrCanineR = worldToScreen(geom.canineRight, width, height);
      const scrRayEndR = worldToScreen(geom.rightRayPoints[1], width, height);
      ctx.beginPath();
      ctx.moveTo(scrCanineR.x, scrCanineR.y);
      ctx.lineTo(scrRayEndR.x, scrRayEndR.y);
      ctx.stroke();

      ctx.setLineDash([]); // Reset line dash

      // 42° Ray Divergence Angle Arc Label
      ctx.fillStyle = isDark ? '#fb923c' : '#ea580c';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('42.0° RAY DIVERGENCE', scrCanineL.x - 20, scrRayEndL.y + 16);
    }

    // -------------------------------------------------------------
    // 4. SHADED ARCH AREA (OPTIONAL FILL)
    // -------------------------------------------------------------
    if (data.showArcFill && geom.fullArchPath.length > 2) {
      ctx.beginPath();
      const first = worldToScreen(geom.fullArchPath[0], width, height);
      ctx.moveTo(first.x, first.y);

      for (let i = 1; i < geom.fullArchPath.length; i++) {
        const pt = worldToScreen(geom.fullArchPath[i], width, height);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();
      ctx.fillStyle = isDark ? 'rgba(13, 148, 136, 0.12)' : 'rgba(13, 148, 136, 0.08)';
      ctx.fill();
    }

    // -------------------------------------------------------------
    // 5. DRAW HAWLEY ANTERIOR 120° ARC & POSTERIOR VECTOR CURVE
    // -------------------------------------------------------------
    // 120° Anterior Arc (Thick Teal Curve)
    if (geom.anteriorArcPoints.length > 1) {
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = '#0d9488'; // teal-600
      ctx.shadowColor = 'rgba(13, 148, 136, 0.6)';
      ctx.shadowBlur = isDark ? 8 : 2;

      ctx.beginPath();
      const p0 = worldToScreen(geom.anteriorArcPoints[0], width, height);
      ctx.moveTo(p0.x, p0.y);

      for (let i = 1; i < geom.anteriorArcPoints.length; i++) {
        const p = worldToScreen(geom.anteriorArcPoints[i], width, height);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    // Full Arch Path Line
    if (geom.fullArchPath.length > 1) {
      ctx.lineWidth = 2.0;
      ctx.strokeStyle = '#0284c7'; // sky-600

      ctx.beginPath();
      const p0 = worldToScreen(geom.fullArchPath[0], width, height);
      ctx.moveTo(p0.x, p0.y);

      for (let i = 1; i < geom.fullArchPath.length; i++) {
        const p = worldToScreen(geom.fullArchPath[i], width, height);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // -------------------------------------------------------------
    // 6. SPAN MEASUREMENT OVERLAY LINES
    // -------------------------------------------------------------
    if (data.showMeasurementLabels) {
      ctx.lineWidth = 1.0;
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = isDark ? 'rgba(56, 189, 248, 0.7)' : 'rgba(2, 132, 199, 0.7)';

      // Intercanine Span Line
      const pCL = worldToScreen(geom.canineLeft, width, height);
      const pCR = worldToScreen(geom.canineRight, width, height);
      ctx.beginPath();
      ctx.moveTo(pCL.x, pCL.y);
      ctx.lineTo(pCR.x, pCR.y);
      ctx.stroke();

      // Intermolar 1 Span Line
      const pM1L = worldToScreen(geom.molar1Left, width, height);
      const pM1R = worldToScreen(geom.molar1Right, width, height);
      ctx.beginPath();
      ctx.moveTo(pM1L.x, pM1L.y);
      ctx.lineTo(pM1R.x, pM1R.y);
      ctx.stroke();

      ctx.setLineDash([]);

      // Label on Intercanine Span
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
      ctx.textAlign = 'center';
      ctx.fillText(
        `Intercanine: ${geom.metrics.intercanineSpan.toFixed(1)} mm`,
        (pCL.x + pCR.x) / 2,
        pCL.y - 6
      );

      // Label on 1st Molar Span
      ctx.fillText(
        `1st Molar Span: ${geom.metrics.intermolar1Span.toFixed(1)} mm`,
        (pM1L.x + pM1R.x) / 2,
        pM1L.y - 6
      );
    }

    // -------------------------------------------------------------
    // 7. DRAW TOOTH LANDMARK MARKERS AND DECLUTTERED LABELS
    // -------------------------------------------------------------
    geom.landmarkList.forEach((item) => {
      const scrPt = worldToScreen(item.point, width, height);
      const isApex = item.key === 'pointA';
      const isCenter = item.key === 'pointB';
      const isCanine = item.key === 'canineLeft' || item.key === 'canineRight';
      const isPointO = item.key === 'pointOLeft' || item.key === 'pointORight';
      const isHovered = hoveredNode?.key === item.key;

      // Glow effect if node is hovered
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(scrPt.x, scrPt.y, 12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(13, 148, 136, 0.35)';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#14b8a6';
        ctx.stroke();
      }

      ctx.beginPath();
      const radius = isApex ? 6.0 : isCenter ? 4.5 : isCanine ? 5.5 : isPointO ? 4.0 : 4.5;
      ctx.arc(scrPt.x, scrPt.y, radius, 0, Math.PI * 2);

      if (isApex) {
        ctx.fillStyle = '#f43f5e'; // rose-500
      } else if (isCenter) {
        ctx.fillStyle = '#a855f7'; // purple-500
      } else if (isCanine) {
        ctx.fillStyle = '#10b981'; // emerald-500
      } else if (isPointO) {
        ctx.fillStyle = '#f97316'; // orange-500
      } else {
        ctx.fillStyle = '#0284c7'; // sky-600
      }
      ctx.fill();

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Render Landmark Text Label with pill backdrop
      if (data.showMeasurementLabels) {
        ctx.font = 'bold 10px sans-serif';
        const labelText = item.label;
        const coordText = `(${item.point.x.toFixed(1)}, ${item.point.y.toFixed(1)})`;

        let textWidth = ctx.measureText(labelText).width;
        if (data.showCoordinates) {
          ctx.font = '9px monospace';
          textWidth = Math.max(textWidth, ctx.measureText(coordText).width);
        }

        const padX = 5;
        const padY = 3;
        const boxH = data.showCoordinates ? 22 : 14;

        let boxX = item.isRight
          ? scrPt.x + 8
          : item.isLeft
          ? scrPt.x - 8 - textWidth - padX * 2
          : scrPt.x - textWidth / 2 - padX;

        let boxY = isApex
          ? scrPt.y - boxH - 8
          : isCenter
          ? scrPt.y + 10
          : scrPt.y - boxH / 2;

        // Pill Backdrop
        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.90)';
        ctx.strokeStyle = isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(203, 213, 225, 0.9)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(boxX, boxY, textWidth + padX * 2, boxH + padY, 4);
        } else {
          ctx.rect(boxX, boxY, textWidth + padX * 2, boxH + padY);
        }
        ctx.fill();
        ctx.stroke();

        // Label Text
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
        ctx.textAlign = 'left';
        ctx.fillText(labelText, boxX + padX, boxY + 11);

        // Optional Detailed Coordinates inline text
        if (data.showCoordinates) {
          ctx.font = '9px monospace';
          ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
          ctx.fillText(coordText, boxX + padX, boxY + 20);
        }
      }
    });

    // -------------------------------------------------------------
    // 8. HOVER CROSSHAIR & FLOATING CARD TOOLTIP
    // -------------------------------------------------------------
    if (hoveredPosMm) {
      const hScr = worldToScreen(hoveredPosMm, width, height);

      // Crosshair lines
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.moveTo(hScr.x, 0);
      ctx.lineTo(hScr.x, height);
      ctx.moveTo(0, hScr.y);
      ctx.lineTo(width, hScr.y);
      ctx.stroke();

      // Tooltip Card Rendering
      if (hoveredNode) {
        // Detailed Landmark Card Tooltip
        const boxW = 160;
        const boxH = 44;
        const boxX = Math.min(width - boxW - 12, Math.max(12, hScr.x + 12));
        const boxY = Math.max(12, hScr.y - 50);

        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        ctx.strokeStyle = '#0d9488'; // teal border highlight
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(boxX, boxY, boxW, boxH, 8);
        } else {
          ctx.rect(boxX, boxY, boxW, boxH);
        }
        ctx.fill();
        ctx.stroke();

        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.textAlign = 'left';
        ctx.fillText(hoveredNode.label, boxX + 8, boxY + 15);

        ctx.font = 'bold 10px monospace';
        ctx.fillStyle = isDark ? '#f1f5f9' : '#0f172a';
        ctx.fillText(`X: ${hoveredNode.point.x.toFixed(2)} mm  Y: ${hoveredNode.point.y.toFixed(2)} mm`, boxX + 8, boxY + 31);
      } else {
        // Generic Coordinates Box
        const boxW = 110;
        const boxH = 22;
        const boxX = Math.min(width - boxW - 10, hScr.x + 12);
        const boxY = Math.max(10, hScr.y - 30);

        ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(boxX, boxY, boxW, boxH, 4);
        } else {
          ctx.rect(boxX, boxY, boxW, boxH);
        }
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`X: ${hoveredPosMm.x.toFixed(1)}mm  Y: ${hoveredPosMm.y.toFixed(1)}mm`, boxX + 6, boxY + 14);
      }
    }
  }, [data, geom, worldToScreen, screenToWorld, hoveredPosMm, hoveredNode, zoom, pan]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse hover (view-only: no pan drag; throttled via rAF)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (hoverRafRef.current !== null) return;

    hoverRafRef.current = window.requestAnimationFrame(() => {
      hoverRafRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scrPt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      const worldPt = screenToWorld(scrPt, canvas.width, canvas.height);

      setHoveredPosMm(worldPt);

      let nearestNode: HawleyLandmarkPoint | null = null;
      let minDistance = 4.0;
      geom.landmarkList.forEach((item) => {
        const dx = worldPt.x - item.point.x;
        const dy = worldPt.y - item.point.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          nearestNode = item;
        }
      });
      setHoveredNode(nearestNode);
    });
  };

  useEffect(
    () => () => {
      if (hoverRafRef.current !== null) {
        window.cancelAnimationFrame(hoverRafRef.current);
      }
    },
    []
  );

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(2.0, Math.min(15.0, prev * zoomFactor)));
  };

  const handleResetZoom = () => {
    setZoom(5.0);
    setPan({ x: 0, y: -30 });
  };

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[480px] select-none bg-slate-950 overflow-hidden rounded-2xl">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => {
          setHoveredPosMm(null);
          setHoveredNode(null);
        }}
        onWheel={handleWheel}
        className="w-full h-full block cursor-default"
      />

      {/* Floating Canvas Controls Overlay */}
      <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-xl shadow-xl">
        <button
          onClick={() => setZoom((prev) => Math.min(15.0, prev * 1.2))}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoom((prev) => Math.max(2.0, prev / 1.2))}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetZoom}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 font-semibold text-xs transition-colors"
          title="Reset Zoom & Pan"
        >
          <Maximize2 className="w-3.5 h-3.5 text-teal-400" />
          <span>Fit View</span>
        </button>

        <div className="h-4 w-px bg-slate-800 mx-0.5" />

        <div className="text-[10px] font-mono text-slate-400 px-1">
          Scale: <strong className="text-teal-300">{zoom.toFixed(1)} px/mm</strong>
        </div>
      </div>
    </div>
  );
});
