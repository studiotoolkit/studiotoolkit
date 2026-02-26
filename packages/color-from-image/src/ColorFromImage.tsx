import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import './ColorFromImage.css';

export interface ColorEntry {
  palette: string[];
}

interface ColorFromImageProps {
  width?: number;
  height?: number;
  borderColor?: string;
  borderThickness?: number;
  onColorsExtracted?: (colors: ColorEntry) => void;
  imageUrl?: string;
  imageFile?: File | null;
  clearTrigger?: number;
}

// ─────────────────────────────────────────────────────────────
// OKLab math — zero external dependencies
// Reference: Ottosson, B. (2020). oklab.org
// ─────────────────────────────────────────────────────────────

interface Lab {
  L: number;
  a: number;
  b: number;
}
interface RGB {
  r: number;
  g: number;
  b: number;
}

const linearize = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const delinearize = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const rgbToOklab = ({ r, g, b }: RGB): Lab => {
  const lr = linearize(r),
    lg = linearize(g),
    lb = linearize(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
};

const oklabToRgb = ({ L, a, b }: Lab): RGB => {
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l * l * l,
    m3 = m * m * m,
    s3 = s * s * s;
  return {
    r: clamp01(delinearize(+4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3)),
    g: clamp01(delinearize(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3)),
    b: clamp01(delinearize(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3)),
  };
};

const labDist2 = (a: Lab, b: Lab): number => (a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2;

const labChroma = (lab: Lab): number => Math.sqrt(lab.a * lab.a + lab.b * lab.b);

const rgbToHex = ({ r, g, b }: RGB): string => {
  const f = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
};

// ─────────────────────────────────────────────────────────────
// K-Means++ clustering in OKLab space
//
// FIX 1 — Saturation-weighted sampling:
//   Vivid pixels are up-weighted so small saturated regions
//   (e.g. a peacock's blue neck against a green forest) get
//   enough representation to form their own cluster instead of
//   being absorbed into the dominant muted background.
//     chroma < 0.05  → include at 20% rate  (near-grey, skip most)
//     chroma < 0.15  → include at 60% rate  (moderate colour)
//     chroma >= 0.15 → always include        (vivid — never skip)
//
// FIX 2 — k raised to 16:
//   More clusters mean a larger dominant region is less likely
//   to consume all slots, leaving room for vivid accent colours.
//
// FIX 3 — Chroma-biased sort:
//   Final results are sorted by a blend of cluster size and
//   chroma so vivid colours rank higher than their raw pixel
//   count alone would place them.
//   score = count × (1 + 3 × chroma)
// ─────────────────────────────────────────────────────────────

const kMeansOklab = (
  data: Uint8ClampedArray,
  k: number,
  maxIter = 20
): Array<{ hex: string; count: number; total: number }> => {
  // 1. Saturation-weighted sampling (FIX 1)
  const pixels: Lab[] = [];
  const step = Math.max(1, Math.floor(data.length / 4 / 4000));
  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i + 3] < 128) continue;
    const lab = rgbToOklab({
      r: data[i] / 255,
      g: data[i + 1] / 255,
      b: data[i + 2] / 255,
    });
    const chroma = labChroma(lab);
    // Up-weight vivid pixels so small saturated regions aren't drowned out
    const threshold = chroma < 0.05 ? 0.2 : chroma < 0.15 ? 0.6 : 1.0;
    if (Math.random() > threshold) continue;
    pixels.push(lab);
  }
  if (pixels.length === 0) return [];
  const n = pixels.length;

  // 2. K-Means++ initialisation
  const centroids: Lab[] = [];
  centroids.push(pixels[Math.floor(Math.random() * n)]);

  for (let ci = 1; ci < k; ci++) {
    const dists = pixels.map((p) => Math.min(...centroids.map((c) => labDist2(p, c))));
    const sum = dists.reduce((acc, d) => acc + d, 0);
    let rand = Math.random() * sum;
    let chosen = 0;
    for (let i = 0; i < n; i++) {
      rand -= dists[i];
      if (rand <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push({ ...pixels[chosen] });
  }

  // 3. Iterate
  const assignments = new Int32Array(n);

  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;

    for (let i = 0; i < n; i++) {
      let best = 0,
        bestDist = Infinity;
      for (let ci = 0; ci < k; ci++) {
        const d = labDist2(pixels[i], centroids[ci]);
        if (d < bestDist) {
          bestDist = d;
          best = ci;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        moved = true;
      }
    }

    if (!moved) break;

    const sums = Array.from({ length: k }, () => ({
      L: 0,
      a: 0,
      b: 0,
      count: 0,
    }));
    for (let i = 0; i < n; i++) {
      const ci = assignments[i];
      sums[ci].L += pixels[i].L;
      sums[ci].a += pixels[i].a;
      sums[ci].b += pixels[i].b;
      sums[ci].count++;
    }
    for (let ci = 0; ci < k; ci++) {
      if (sums[ci].count > 0) {
        centroids[ci] = {
          L: sums[ci].L / sums[ci].count,
          a: sums[ci].a / sums[ci].count,
          b: sums[ci].b / sums[ci].count,
        };
      }
    }
  }

  // 4. Tally sizes, convert to hex, sort by chroma-biased score (FIX 3)
  const counts = new Array(k).fill(0);
  for (let i = 0; i < n; i++) counts[assignments[i]]++;

  return centroids
    .map((c, ci) => ({
      hex: rgbToHex(oklabToRgb(c)),
      count: counts[ci],
      total: n,
      // Vivid centroids score higher than their raw pixel count alone
      score: counts[ci] * (1 + 3 * labChroma(c)),
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.score - a.score);
};

// ─────────────────────────────────────────────────────────────
// Extract ColorEntry from an HTMLImageElement
// k raised to 16 (FIX 2) — more clusters prevent one dominant
// region from consuming all slots
// ─────────────────────────────────────────────────────────────

const extractColors = (img: HTMLImageElement, k = 16): ColorEntry => {
  const cw = img.naturalWidth,
    ch = img.naturalHeight;
  if (!cw || !ch) return { palette: [] };

  const tmp = document.createElement('canvas');
  tmp.width = cw;
  tmp.height = ch;
  const ctx = tmp.getContext('2d');
  if (!ctx) return { palette: [] };
  ctx.drawImage(img, 0, 0);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, cw, ch).data;
  } catch {
    return { palette: [] };
  }

  return { palette: kMeansOklab(data, k).map(({ hex }) => hex) };
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const ColorFromImage: React.FC<ColorFromImageProps> = ({
  width = 200,
  height = 200,
  borderColor = '#cccccc',
  borderThickness = 1,
  onColorsExtracted,
  imageUrl,
  imageFile,
  clearTrigger,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawToCanvasRef = useRef<(img: HTMLImageElement) => void>(() => {});
  const onColorsExtractedRef = useRef(onColorsExtracted);

  const [imageGiven, setImageGiven] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState('');

  const drawToCanvas = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min(width / img.width, height / img.height);
    const w = img.width * scale,
      h = img.height * scale;
    ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h);
  };

  useLayoutEffect(() => {
    drawToCanvasRef.current = drawToCanvas;
  });
  useLayoutEffect(() => {
    onColorsExtractedRef.current = onColorsExtracted;
  });

  // Redraw when dimensions change
  useEffect(() => {
    if (imageGiven) drawToCanvasRef.current(imageGiven);
  }, [width, height, imageGiven]);

  // Shared: load image from any Blob via data URL (always same-origin)
  const loadFromBlob = (blob: Blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        setImageGiven(img);
        setLoadError('');
        drawToCanvasRef.current(img);
        const colors = extractColors(img);
        if (colors.palette.length > 0) onColorsExtractedRef.current?.(colors);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(blob);
  };

  // Load from imageUrl prop
  useEffect(() => {
    if (!imageUrl) return;
    setLoadError('');
    const imgCors = new Image();
    imgCors.crossOrigin = 'anonymous';
    imgCors.src = imageUrl;
    imgCors.onload = () => {
      setImageGiven(imgCors);
      drawToCanvasRef.current(imgCors);
      const colors = extractColors(imgCors);
      if (colors.palette.length > 0) {
        onColorsExtractedRef.current?.(colors);
      } else {
        setLoadError('Image loaded but color extraction failed.');
      }
    };
    imgCors.onerror = () => {
      const imgFallback = new Image();
      imgFallback.src = imageUrl;
      imgFallback.onload = () => {
        setImageGiven(imgFallback);
        drawToCanvasRef.current(imgFallback);
        setLoadError('Displayed but CORS blocked color extraction. Upload the file directly.');
      };
      imgFallback.onerror = () =>
        setLoadError('Failed to load image. Check the URL and try again.');
    };
  }, [imageUrl]);

  // Load from imageFile prop
  useEffect(() => {
    if (!imageFile) return;
    setLoadError('');
    loadFromBlob(imageFile);
  }, [imageFile]);

  // Clear trigger
  useEffect(() => {
    if (!clearTrigger) return;
    const ctx = canvasRef.current?.getContext('2d');
    ctx?.clearRect(0, 0, width, height);
    setImageGiven(null);
    setLoadError('');
    onColorsExtractedRef.current?.({ palette: [] });
  }, [clearTrigger, width, height]);

  // Ctrl+V paste
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image')) {
          const blob = items[i].getAsFile();
          if (blob) {
            loadFromBlob(blob);
            return;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  // Drag & drop
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith('image/')) loadFromBlob(file);
  };

  return (
    <div className="cfi-container">
      <div
        className="cfi-canvas-wrapper"
        style={{
          borderColor,
          borderWidth: `${borderThickness}px`,
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cfi-canvas"
          style={{ width: `${width}px`, height: `${height}px` }}
        />
        {!imageGiven && (
          <div className="cfi-canvas-overlay">
            <span>Drag &amp; Drop</span>
            <span>or Ctrl+V / Paste</span>
          </div>
        )}
      </div>
      {loadError && <p className="cfi-url-error">{loadError}</p>}
    </div>
  );
};

export default ColorFromImage;
