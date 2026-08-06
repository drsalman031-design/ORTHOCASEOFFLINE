/**
 * Browser-compatible High-Performance Potrace & Contour Vectorizer for Cephalometric Line Tracing
 * Converts high-contrast image (PNG/JPG) into discrete SVG path commands (<path d="...">).
 * Optimized with image downscaling, neighborhood visited suppression, and non-blocking async execution.
 */

export interface VectorPathItem {
  id: string;
  d: string; // SVG path d attribute
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
  center: { x: number; y: number };
  area: number;
  groupId: 'cranialBase' | 'maxilla' | 'mandible' | 'unassigned';
}

export interface VectorizationOptions {
  threshold: number; // 0 - 255 (Default: 150)
  invert: boolean; // invert black/white
  turdSize: number; // minimum component size to keep noise out (Default: 25)
  alphaMax: number; // corner threshold for curve smoothing (Default: 1.0)
  optCurve: boolean; // optimize adjacent segments into smooth Bezier curves
  maxDimension?: number; // max canvas dimension for processing
}

export const DEFAULT_VECTOR_OPTIONS: VectorizationOptions = {
  threshold: 150,
  invert: false,
  turdSize: 25,
  alphaMax: 1.0,
  optCurve: true,
  maxDimension: 1000,
};

/**
 * Traces a high-contrast line image into clean, solid SVG path elements.
 * Applies canvas-level binary thresholding (150), turd noise suppression (25), and Bezier curve smoothing.
 */
export async function vectorizeImageToPaths(
  imageSrc: string,
  options: Partial<VectorizationOptions> = {}
): Promise<{ paths: VectorPathItem[]; width: number; height: number }> {
  const opts = { ...DEFAULT_VECTOR_OPTIONS, ...options };
  const maxDim = opts.maxDimension || 1000;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setTimeout(() => {
        try {
          // 1. Calculate Target Dimensions
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            const scale = Math.min(maxDim / width, maxDim / height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            reject(new Error('Canvas context unavailable'));
            return;
          }

          // Draw image
          ctx.drawImage(img, 0, 0, width, height);

          // 2. CANVAS-LEVEL BINARY THRESHOLD FILTER (Threshold = 150)
          // Strips out paper background texture, gray shadows, and subtle pencil smudges
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          const thresh = opts.threshold;

          for (let i = 0; i < data.length; i += 4) {
            // High-contrast grayscale luminosity calculation
            const avg = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            let isBlack = avg < thresh;
            if (opts.invert) {
              isBlack = !isBlack;
            }
            const color = isBlack ? 0 : 255;
            data[i] = color;
            data[i + 1] = color;
            data[i + 2] = color;
          }
          ctx.putImageData(imageData, 0, 0);

          // 3. Create Binary Bitmap Matrix
          const bitmap = new Uint8Array(width * height);
          for (let i = 0; i < data.length; i += 4) {
            const pixelIdx = i >> 2;
            bitmap[pixelIdx] = data[i] === 0 ? 1 : 0; // 1 = solid line stroke, 0 = background
          }

          // 4. Contour Boundary Extraction with Turd Noise Filter (turdSize >= 25)
          const visited = new Uint8Array(width * height);
          const rawPaths: VectorPathItem[] = [];
          let pathCounter = 0;

          // Sequential pixel traversal without skipping to prevent dotted line fragmentation
          for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
              const idx = y * width + x;
              if (bitmap[idx] === 1 && visited[idx] === 0) {
                // Trace continuous stroke contour
                const contourPoints = traceContourContinuous(bitmap, visited, width, height, x, y);

                // TURD SIZE FILTERING: Only keep solid, continuous line paths >= turdSize (e.g. 25px)
                if (contourPoints.length >= opts.turdSize) {
                  const bounds = calculateBounds(contourPoints);
                  const pathSvgD = convertPointsToSmoothBezierPathD(
                    contourPoints,
                    opts.optCurve,
                    opts.alphaMax
                  );

                  // Auto-classify region based on vertical position
                  let initialGroup: 'cranialBase' | 'maxilla' | 'mandible' | 'unassigned' = 'unassigned';
                  const relativeY = bounds.center.y / height;
                  if (relativeY < 0.38) {
                    initialGroup = 'cranialBase';
                  } else if (relativeY < 0.62) {
                    initialGroup = 'maxilla';
                  } else {
                    initialGroup = 'mandible';
                  }

                  rawPaths.push({
                    id: `path_${++pathCounter}`,
                    d: pathSvgD,
                    bounds: bounds.box,
                    center: bounds.center,
                    area: bounds.area,
                    groupId: initialGroup,
                  });
                }
              }
            }
          }

          resolve({ paths: rawPaths, width, height });
        } catch (err) {
          reject(err);
        }
      }, 10);
    };
    img.onerror = () => reject(new Error('Failed to load tracing image'));
    img.src = imageSrc;
  });
}

/**
 * Traces a continuous line contour using 8-neighbor connectivity.
 * Marks visited pixels along the line stroke to avoid fragmented duplication.
 */
function traceContourContinuous(
  bitmap: Uint8Array,
  visited: Uint8Array,
  width: number,
  height: number,
  startX: number,
  startY: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  let cx = startX;
  let cy = startY;

  // Clockwise 8-neighbor offsets
  const dx = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy = [0, 1, 1, 1, 0, -1, -1, -1];

  let dir = 0;
  const maxSteps = 4000;
  let steps = 0;

  while (steps < maxSteps) {
    const idx = cy * width + cx;
    visited[idx] = 1;
    points.push({ x: cx, y: cy });

    let foundNext = false;
    for (let i = 0; i < 8; i++) {
      const checkDir = (dir + i) % 8;
      const nx = cx + dx[checkDir];
      const ny = cy + dy[checkDir];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (bitmap[nIdx] === 1 && visited[nIdx] === 0) {
          cx = nx;
          cy = ny;
          dir = (checkDir + 6) % 8;
          foundNext = true;
          break;
        }
      }
    }

    if (!foundNext || (cx === startX && cy === startY && steps > 2)) {
      break;
    }
    steps++;
  }

  return points;
}

/**
 * Converts contour points into smooth Bezier curves with optCurve and alphaMax smoothing.
 * Combines adjacent line segments into unified solid vector strokes (<path d="...">).
 */
function convertPointsToSmoothBezierPathD(
  points: { x: number; y: number }[],
  optCurve = true,
  alphaMax = 1.0
): string {
  if (points.length === 0) return '';

  // Adaptive sampling to reduce point jitter while retaining anatomical contours
  const sampleInterval = optCurve ? 3 : 2;
  const sampled: { x: number; y: number }[] = [];

  for (let i = 0; i < points.length; i += sampleInterval) {
    sampled.push(points[i]);
  }
  if (sampled[sampled.length - 1] !== points[points.length - 1]) {
    sampled.push(points[points.length - 1]);
  }

  if (sampled.length < 2) {
    return `M ${sampled[0].x} ${sampled[0].y} L ${sampled[0].x + 1} ${sampled[0].y + 1}`;
  }

  let d = `M ${sampled[0].x} ${sampled[0].y}`;

  if (optCurve) {
    // Generate smooth Bezier curves through adjacent points (Potrace optCurve simulation)
    for (let i = 1; i < sampled.length - 1; i++) {
      const p0 = sampled[i - 1];
      const p1 = sampled[i];
      const p2 = sampled[i + 1];

      // Calculate corner sharpness
      const v1x = p1.x - p0.x;
      const v1y = p1.y - p0.y;
      const v2x = p2.x - p1.x;
      const v2y = p2.y - p1.y;

      const len1 = Math.hypot(v1x, v1y) || 1;
      const len2 = Math.hypot(v2x, v2y) || 1;

      const dot = (v1x * v2x + v1y * v2y) / (len1 * len2);

      // If angle is smoother than alphaMax threshold, create smooth Bezier curve
      if (dot > -alphaMax) {
        const midX = (p1.x + p2.x) * 0.5;
        const midY = (p1.y + p2.y) * 0.5;
        d += ` Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}, ${midX.toFixed(1)} ${midY.toFixed(1)}`;
      } else {
        d += ` L ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
    }
    const last = sampled[sampled.length - 1];
    d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  } else {
    for (let i = 1; i < sampled.length; i++) {
      d += ` L ${sampled[i].x.toFixed(1)} ${sampled[i].y.toFixed(1)}`;
    }
  }

  return d;
}

/**
 * Calculates bounding box and center coordinate for points.
 */
function calculateBounds(points: { x: number; y: number }[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  return {
    box: { minX, minY, maxX, maxY, width, height },
    center: { x: minX + width * 0.5, y: minY + height * 0.5 },
    area: width * height,
  };
}

/**
 * Default sample cephalometric line drawing canvas generator
 */
export function generateSampleTracingDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 700;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 600, 700);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // 1. Cranial Base & Vault (Top)
  ctx.beginPath();
  ctx.moveTo(180, 120); // Sella
  ctx.lineTo(340, 100); // Nasion
  ctx.lineTo(380, 80);
  ctx.lineTo(260, 40);
  ctx.lineTo(140, 60);
  ctx.closePath();
  ctx.stroke();

  // Orbital rim
  ctx.beginPath();
  ctx.arc(330, 130, 25, 0, Math.PI * 2);
  ctx.stroke();

  // 2. Maxilla Segment (Middle)
  ctx.beginPath();
  ctx.moveTo(350, 280); // ANS
  ctx.quadraticCurveTo(370, 310, 360, 340); // Upper Incisor
  ctx.lineTo(300, 335); // Hard palate / Occlusal
  ctx.lineTo(260, 300); // PNS
  ctx.closePath();
  ctx.stroke();

  // Upper teeth
  ctx.beginPath();
  ctx.moveTo(360, 340);
  ctx.lineTo(355, 385); // Upper central incisor
  ctx.lineTo(342, 385);
  ctx.lineTo(348, 340);
  ctx.closePath();
  ctx.stroke();

  // 3. Mandible Segment (Lower)
  ctx.beginPath();
  ctx.moveTo(210, 240); // Condyle
  ctx.lineTo(200, 360); // Ramus
  ctx.quadraticCurveTo(205, 480, 260, 520); // Angle
  ctx.lineTo(350, 530); // Body
  ctx.quadraticCurveTo(380, 530, 390, 500); // Pogonion/Menton
  ctx.lineTo(350, 420); // B-point / Lower alveolar
  ctx.closePath();
  ctx.stroke();

  // Lower teeth
  ctx.beginPath();
  ctx.moveTo(350, 420);
  ctx.lineTo(348, 380); // Lower central incisor crown
  ctx.lineTo(336, 380);
  ctx.lineTo(338, 420);
  ctx.closePath();
  ctx.stroke();

  return canvas.toDataURL('image/png');
}

