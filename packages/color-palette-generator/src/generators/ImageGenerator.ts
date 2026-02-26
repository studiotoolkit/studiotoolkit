/**
 * ImageGenerator
 * Extracts color palettes from image pixel data using 10 algorithms:
 *   kmeans, medianCut, dominant, vibrant, muted,
 *   octree, colorMoments, neuralQuant, histogram, deltaE
 *
 * Input:  Uint8ClampedArray (RGBA from canvas.getImageData) — optional.
 *         Falls back to synthetic pixels generated from input.square.
 * Output: { [algorithmName]: string[] }  — hex arrays, always length k.
 *
 * All perceptual math in OKLab. Zero external dependencies.
 */

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

interface RGB {
  r: number;
  g: number;
  b: number;
}
interface Lab {
  L: number;
  a: number;
  b: number;
}

export interface ImageGeneratorInput {
  square: string[]; // fallback hint colors when no image data is provided
}

export interface ImageGeneratorOutput {
  kmeans: string[];
  medianCut: string[];
  dominant: string[];
  vibrant: string[];
  muted: string[];
  octree: string[];
  colorMoments: string[];
  neuralQuant: string[];
  histogram: string[];
  deltaE: string[];
}

// ─────────────────────────────────────────────────────────────
// sRGB ↔ OKLab
// Reference: Ottosson, B. (2020). oklab.org
// ─────────────────────────────────────────────────────────────

const linearize = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const delinearize = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

const rgbToOklab = ({ r, g, b }: RGB): Lab => {
  const lr = linearize(r),
    lg = linearize(g),
    lb = linearize(b);
  const l = Math.cbrt(
    0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb,
  );
  const m = Math.cbrt(
    0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb,
  );
  const s = Math.cbrt(
    0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb,
  );
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
    r: clamp01(
      delinearize(+4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    ),
    g: clamp01(
      delinearize(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    ),
    b: clamp01(
      delinearize(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
    ),
  };
};

const labDist2 = (a: Lab, b: Lab): number =>
  (a.L - b.L) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2;

const labChroma = (lab: Lab): number =>
  Math.sqrt(lab.a * lab.a + lab.b * lab.b);

// ─────────────────────────────────────────────────────────────
// Hex utilities
// ─────────────────────────────────────────────────────────────

const hexToRgb = (hex: string): RGB => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
});

const rgbToHex = ({ r, g, b }: RGB): string => {
  const f = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
};

const labToHex = (lab: Lab): string => rgbToHex(oklabToRgb(lab));

// ─────────────────────────────────────────────────────────────
// Guarantee exactly k results — pads with evenly spaced
// lightness variants of the last color if an algorithm
// returns fewer than k (edge case with very small pixel sets).
// ─────────────────────────────────────────────────────────────

const padToK = (labs: Lab[], k: number): Lab[] => {
  if (labs.length >= k) return labs.slice(0, k);
  const result = [...labs];
  const base = labs[labs.length - 1] ?? { L: 0.5, a: 0, b: 0 };
  while (result.length < k) {
    const t = result.length / k;
    result.push({ ...base, L: clamp01(0.2 + t * 0.6) });
  }
  return result;
};

const padRgbToK = (rgbs: RGB[], k: number): RGB[] => {
  if (rgbs.length >= k) return rgbs.slice(0, k);
  const result = [...rgbs];
  while (result.length < k) {
    const t = result.length / k;
    result.push({ r: t, g: t, b: t });
  }
  return result;
};

// ─────────────────────────────────────────────────────────────
// Pixel sampling — at most ~6k pixels from RGBA data
// ─────────────────────────────────────────────────────────────

interface PixelSample {
  rgbs: RGB[];
  labs: Lab[];
}

const samplePixels = (
  data: Uint8ClampedArray,
  maxPixels = 6000,
): PixelSample => {
  const step = Math.max(1, Math.floor(data.length / 4 / maxPixels));
  const rgbs: RGB[] = [],
    labs: Lab[] = [];
  for (let i = 0; i < data.length; i += 4 * step) {
    if (data[i + 3] < 128) continue;
    const rgb: RGB = {
      r: data[i] / 255,
      g: data[i + 1] / 255,
      b: data[i + 2] / 255,
    };
    rgbs.push(rgb);
    labs.push(rgbToOklab(rgb));
  }
  return { rgbs, labs };
};

// ─────────────────────────────────────────────────────────────
// Synthetic pixel data from square hint colors.
// Used when no real image is provided.
// Each color expands to 800 pixels with ±15/255 Gaussian noise.
// ─────────────────────────────────────────────────────────────

const syntheticPixels = (colors: string[]): Uint8ClampedArray => {
  const PPc = 800;
  const buf = new Uint8ClampedArray(colors.length * PPc * 4);
  let off = 0;
  for (const hex of colors) {
    const rgb = hexToRgb(hex);
    for (let i = 0; i < PPc; i++) {
      const n = () => (Math.random() - 0.5) * 30;
      buf[off++] = Math.round(clamp01(rgb.r) * 255 + n());
      buf[off++] = Math.round(clamp01(rgb.g) * 255 + n());
      buf[off++] = Math.round(clamp01(rgb.b) * 255 + n());
      buf[off++] = 255;
    }
  }
  return buf;
};

// ─────────────────────────────────────────────────────────────
// 1. K-Means++ (OKLab, chroma-weighted sampling)
// Vivid pixels included at higher rate so small saturated regions
// are not absorbed by large muted backgrounds.
// Score = count × (1 + 3 × chroma) for vivid-biased ranking.
// ─────────────────────────────────────────────────────────────

const kMeansCore = (labs: Lab[], k: number, maxIter = 25): Lab[] => {
  if (labs.length === 0) return [];

  // Chroma-weighted subsample
  const pixels = labs.filter((lab) => {
    const c = labChroma(lab);
    return Math.random() <= (c < 0.05 ? 0.2 : c < 0.15 ? 0.6 : 1.0);
  });
  const pool = pixels.length >= k ? pixels : labs; // fallback to full set
  const n = pool.length;

  // K-Means++ seed selection
  const centroids: Lab[] = [pool[Math.floor(Math.random() * n)]];
  for (let ci = 1; ci < k; ci++) {
    const dists = pool.map((p) =>
      Math.min(...centroids.map((c) => labDist2(p, c))),
    );
    const sum = dists.reduce((a, d) => a + d, 0);
    let rand = Math.random() * sum,
      chosen = 0;
    for (let i = 0; i < n; i++) {
      rand -= dists[i];
      if (rand <= 0) {
        chosen = i;
        break;
      }
    }
    centroids.push({ ...pool[chosen] });
  }

  const assignments = new Int32Array(n);
  for (let iter = 0; iter < maxIter; iter++) {
    let moved = false;
    for (let i = 0; i < n; i++) {
      let best = 0,
        bd = Infinity;
      for (let ci = 0; ci < k; ci++) {
        const d = labDist2(pool[i], centroids[ci]);
        if (d < bd) {
          bd = d;
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
      sums[ci].L += pool[i].L;
      sums[ci].a += pool[i].a;
      sums[ci].b += pool[i].b;
      sums[ci].count++;
    }
    for (let ci = 0; ci < k; ci++) {
      if (sums[ci].count > 0)
        centroids[ci] = {
          L: sums[ci].L / sums[ci].count,
          a: sums[ci].a / sums[ci].count,
          b: sums[ci].b / sums[ci].count,
        };
    }
  }

  const counts = new Array(k).fill(0);
  for (let i = 0; i < n; i++) counts[assignments[i]]++;

  return padToK(
    centroids
      .map((c, ci) => ({ lab: c, score: counts[ci] * (1 + 3 * labChroma(c)) }))
      .sort((a, b) => b.score - a.score)
      .map((x) => x.lab),
    k,
  );
};

// ─────────────────────────────────────────────────────────────
// 2. Median Cut (RGB, recursive bisection at median pixel)
// Reference: Heckbert, P.S. (1982). SIGGRAPH Computer Graphics.
// ─────────────────────────────────────────────────────────────

const medianCutAlgo = (rgbs: RGB[], k: number): RGB[] => {
  if (rgbs.length === 0) return padRgbToK([], k);

  type Box = { pixels: RGB[] };
  const boxes: Box[] = [{ pixels: [...rgbs] }];

  const splitBox = (box: Box): [Box, Box] => {
    let rn = 1,
      rx = 0,
      gn = 1,
      gx = 0,
      bn = 1,
      bx = 0;
    for (const p of box.pixels) {
      rn = Math.min(rn, p.r);
      rx = Math.max(rx, p.r);
      gn = Math.min(gn, p.g);
      gx = Math.max(gx, p.g);
      bn = Math.min(bn, p.b);
      bx = Math.max(bx, p.b);
    }
    const axis =
      rx - rn >= gx - gn && rx - rn >= bx - bn
        ? "r"
        : gx - gn >= bx - bn
          ? "g"
          : "b";
    box.pixels.sort((a, b) => a[axis] - b[axis]);
    const mid = Math.floor(box.pixels.length / 2);
    return [
      { pixels: box.pixels.slice(0, mid) },
      { pixels: box.pixels.slice(mid) },
    ];
  };

  while (boxes.length < k) {
    boxes.sort((a, b) => b.pixels.length - a.pixels.length);
    if (boxes[0].pixels.length < 2) break;
    const [left, right] = splitBox(boxes.shift()!);
    boxes.push(left, right);
  }

  return padRgbToK(
    boxes.map((box) => {
      const n = box.pixels.length;
      return {
        r: box.pixels.reduce((s, p) => s + p.r, 0) / n,
        g: box.pixels.reduce((s, p) => s + p.g, 0) / n,
        b: box.pixels.reduce((s, p) => s + p.b, 0) / n,
      };
    }),
    k,
  );
};

// ─────────────────────────────────────────────────────────────
// 3. Dominant — most frequent quantized colors (7 levels/channel)
// ─────────────────────────────────────────────────────────────

const dominantAlgo = (rgbs: RGB[], k: number): RGB[] => {
  const map = new Map<string, { rgb: RGB; count: number }>();
  for (const p of rgbs) {
    const r = Math.round(p.r * 7) / 7;
    const g = Math.round(p.g * 7) / 7;
    const b = Math.round(p.b * 7) / 7;
    const key = `${r},${g},${b}`;
    const e = map.get(key);
    if (e) e.count++;
    else map.set(key, { rgb: { r, g, b }, count: 1 });
  }
  return padRgbToK(
    Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, k)
      .map((e) => e.rgb),
    k,
  );
};

// ─────────────────────────────────────────────────────────────
// 4. Vibrant — high-chroma, mid-lightness pixels (C > 0.10)
// ─────────────────────────────────────────────────────────────

const vibrantAlgo = (labs: Lab[], k: number): Lab[] => {
  const vivid = labs.filter(
    (lab) => labChroma(lab) > 0.1 && lab.L > 0.25 && lab.L < 0.85,
  );
  return kMeansCore(vivid.length >= k ? vivid : labs, k);
};

// ─────────────────────────────────────────────────────────────
// 5. Muted — low-chroma desaturated tones (0.02 ≤ C ≤ 0.09)
// ─────────────────────────────────────────────────────────────

const mutedAlgo = (labs: Lab[], k: number): Lab[] => {
  const soft = labs.filter((lab) => {
    const C = labChroma(lab);
    return C >= 0.02 && C <= 0.09 && lab.L > 0.2 && lab.L < 0.9;
  });
  return kMeansCore(soft.length >= k ? soft : labs, k);
};

// ─────────────────────────────────────────────────────────────
// 6. Octree quantization — tree-based color quantization
// Inserts pixels into an 8-ary tree, 1 bit per channel per level.
// Collapses leaf nodes with lowest count until k colors remain.
// Reference: Gervautz & Purgathofer (1988).
// ─────────────────────────────────────────────────────────────

const octreeAlgo = (rgbs: RGB[], k: number): RGB[] => {
  interface OctNode {
    r: number;
    g: number;
    b: number;
    count: number;
    children: (OctNode | null)[];
    isLeaf: boolean;
  }
  const nn = (): OctNode => ({
    r: 0,
    g: 0,
    b: 0,
    count: 0,
    children: new Array(8).fill(null),
    isLeaf: false,
  });

  const root = nn();

  const insert = (
    node: OctNode,
    r: number,
    g: number,
    b: number,
    d: number,
  ) => {
    if (d === 8) {
      node.isLeaf = true;
      node.r += r;
      node.g += g;
      node.b += b;
      node.count++;
      return;
    }
    const sh = 7 - d;
    const idx =
      (((r >> sh) & 1) << 2) | (((g >> sh) & 1) << 1) | ((b >> sh) & 1);
    if (!node.children[idx]) node.children[idx] = nn();
    insert(node.children[idx]!, r, g, b, d + 1);
  };

  const getLeaves = (node: OctNode): OctNode[] => {
    if (node.isLeaf && node.count > 0) return [node];
    return node.children.filter(Boolean).flatMap((c) => getLeaves(c!));
  };

  for (const p of rgbs) {
    insert(
      root,
      Math.round(p.r * 255),
      Math.round(p.g * 255),
      Math.round(p.b * 255),
      0,
    );
  }

  let leaves = getLeaves(root);
  while (leaves.length > k) {
    leaves.sort((a, b) => a.count - b.count);
    leaves[0].count = 0; // mark empty
    leaves = getLeaves(root);
  }

  return padRgbToK(
    leaves
      .filter((n) => n.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, k)
      .map((n) => ({
        r: clamp01(n.r / n.count / 255),
        g: clamp01(n.g / n.count / 255),
        b: clamp01(n.b / n.count / 255),
      })),
    k,
  );
};

// ─────────────────────────────────────────────────────────────
// 7. Color Moments — statistical representative extraction
// Computes mean (1st), std dev (2nd), skewness (3rd) of each
// OKLab channel. Generates k representative colors by sampling
// along the statistical spread at equal intervals.
// Reference: Stricker & Orengo (1995).
// ─────────────────────────────────────────────────────────────

const colorMomentsAlgo = (labs: Lab[], k: number): Lab[] => {
  if (labs.length === 0) return padToK([], k);
  const n = labs.length;

  const mL = labs.reduce((s, l) => s + l.L, 0) / n;
  const mA = labs.reduce((s, l) => s + l.a, 0) / n;
  const mB = labs.reduce((s, l) => s + l.b, 0) / n;

  const sL = Math.sqrt(labs.reduce((s, l) => s + (l.L - mL) ** 2, 0) / n);
  const sA = Math.sqrt(labs.reduce((s, l) => s + (l.a - mA) ** 2, 0) / n);
  const sB = Math.sqrt(labs.reduce((s, l) => s + (l.b - mB) ** 2, 0) / n);

  const kL = Math.cbrt(labs.reduce((s, l) => s + (l.L - mL) ** 3, 0) / n);
  const kA = Math.cbrt(labs.reduce((s, l) => s + (l.a - mA) ** 3, 0) / n);
  const kB = Math.cbrt(labs.reduce((s, l) => s + (l.b - mB) ** 3, 0) / n);

  return Array.from({ length: k }, (_, i) => {
    const t = k === 1 ? 0 : (i / (k - 1)) * 2 - 1; // -1 … +1
    return {
      L: clamp01(mL + t * sL + (t * t - 1 / 3) * kL * 0.3),
      a: clamp01(mA + t * sA + (t * t - 1 / 3) * kA * 0.3),
      b: clamp01(mB + t * sB + (t * t - 1 / 3) * kB * 0.3),
    };
  });
};

// ─────────────────────────────────────────────────────────────
// 8. Neural Quantization — simplified self-organising map (SOM)
// Competitive learning: each pixel nudges its best-matching neuron
// toward it; topological neighbors move with decaying influence.
// Learning rate and neighborhood radius both decay over passes.
// Reference: Dekker, A.H. (1994). Kohonen neural networks for colour quantization.
// FIX: padToK ensures exactly k results even when neurons converge.
// ─────────────────────────────────────────────────────────────

const neuralQuantAlgo = (labs: Lab[], k: number): Lab[] => {
  if (labs.length < k) return padToK(kMeansCore(labs, labs.length), k);

  // Initialise k neurons evenly spread across input
  const neurons: Lab[] = Array.from({ length: k }, (_, i) => ({
    ...labs[Math.floor((i / k) * labs.length)],
  }));

  const learnRate = 0.4;
  const passes = Math.min(labs.length, 4000);
  const step = Math.max(1, Math.floor(labs.length / passes));

  for (let pass = 0; pass < passes; pass++) {
    const lab = labs[(pass * step) % labs.length];
    const rate = learnRate * (1 - pass / passes);

    // Best matching unit
    let bmu = 0,
      bmuDist = Infinity;
    for (let ni = 0; ni < k; ni++) {
      const d = labDist2(lab, neurons[ni]);
      if (d < bmuDist) {
        bmuDist = d;
        bmu = ni;
      }
    }

    // Update BMU and topological neighbours
    const radius = Math.max(1, Math.round((k / 4) * (1 - pass / passes)));
    for (let ni = 0; ni < k; ni++) {
      const dist = Math.abs(ni - bmu);
      if (dist > radius) continue;
      const influence = rate * Math.exp(-(dist * dist) / (2 * radius * radius));
      neurons[ni].L += influence * (lab.L - neurons[ni].L);
      neurons[ni].a += influence * (lab.a - neurons[ni].a);
      neurons[ni].b += influence * (lab.b - neurons[ni].b);
    }
  }

  // Deduplicate neurons that converged to same point, then pad to k
  const unique: Lab[] = [];
  for (const n of neurons) {
    if (!unique.some((u) => labDist2(u, n) < 0.0005)) unique.push(n);
  }

  return padToK(unique, k);
};

// ─────────────────────────────────────────────────────────────
// 9. Histogram — hue-bin peak detection
// Builds a 72-bin (5°/bin) hue histogram from OKLab atan2(b,a).
// Smooths with a 3-bin mean filter, then finds k local maxima.
// Converts each peak bin to a Lab color using that bin's mean L/C.
// ─────────────────────────────────────────────────────────────

const histogramAlgo = (labs: Lab[], k: number): Lab[] => {
  const BINS = 72;
  const bins: Array<{ sumL: number; sumC: number; count: number }> = Array.from(
    { length: BINS },
    () => ({ sumL: 0, sumC: 0, count: 0 }),
  );

  for (const lab of labs) {
    const H = ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360;
    const bin = Math.floor(H / (360 / BINS)) % BINS;
    bins[bin].sumL += lab.L;
    bins[bin].sumC += labChroma(lab);
    bins[bin].count++;
  }

  // 3-bin mean smoothing (circular)
  const smooth = bins.map((_, i) => ({
    count:
      (bins[(i - 1 + BINS) % BINS].count +
        bins[i].count +
        bins[(i + 1) % BINS].count) /
      3,
    idx: i,
  }));

  // Local maxima
  const peaks: number[] = [];
  for (let i = 0; i < BINS; i++) {
    if (
      smooth[i].count > smooth[(i - 1 + BINS) % BINS].count &&
      smooth[i].count >= smooth[(i + 1) % BINS].count &&
      bins[i].count > 0
    )
      peaks.push(i);
  }
  peaks.sort((a, b) => smooth[b].count - smooth[a].count);

  const top = peaks.slice(0, k);

  // Pad if fewer than k peaks — use highest bins
  const byCount = [...smooth].sort((a, b) => b.count - a.count);
  let pi = 0;
  while (top.length < k && pi < BINS) {
    if (!top.includes(byCount[pi].idx) && bins[byCount[pi].idx].count > 0)
      top.push(byCount[pi].idx);
    pi++;
  }

  // If still short (e.g. all pixels same hue), add evenly spaced synthetic bins
  let synthBin = 0;
  while (top.length < k) {
    top.push(synthBin);
    synthBin += Math.floor(BINS / k);
  }

  return top.slice(0, k).map((bi) => {
    const H = (bi / BINS) * 360 + 360 / BINS / 2;
    const L = bins[bi].count > 0 ? bins[bi].sumL / bins[bi].count : 0.5;
    const C = bins[bi].count > 0 ? bins[bi].sumC / bins[bi].count : 0.12;
    const rad = (H * Math.PI) / 180;
    return { L, a: C * Math.cos(rad), b: C * Math.sin(rad) };
  });
};

// ─────────────────────────────────────────────────────────────
// 10. Delta-E maximally distinct selection
// Greedy farthest-point algorithm in OKLab space.
// Seeds with the most chromatic pixel, then picks the pixel
// with the largest minimum distance to already-selected colors.
// Guarantees maximum perceptual separation at each step.
// Reference: CIE ΔE*ab (CIE Pub. 15, 2004), adapted to OKLab.
// ─────────────────────────────────────────────────────────────

const deltaEAlgo = (labs: Lab[], k: number): Lab[] => {
  if (labs.length === 0) return padToK([], k);

  // Subsample for speed
  const maxC = 2000;
  const step = Math.max(1, Math.floor(labs.length / maxC));
  const cands = labs.filter((_, i) => i % step === 0);

  // Seed: most chromatic candidate
  const seed = cands.reduce((best, lab) =>
    labChroma(lab) > labChroma(best) ? lab : best,
  );

  const selected: Lab[] = [seed];
  while (selected.length < k) {
    let farthest = cands[0],
      fd = -Infinity;
    for (const c of cands) {
      const minD = selected.reduce(
        (min, s) => Math.min(min, labDist2(c, s)),
        Infinity,
      );
      if (minD > fd) {
        fd = minD;
        farthest = c;
      }
    }
    // Avoid exact duplicate when all candidates are the same
    if (fd === 0) break;
    selected.push(farthest);
  }

  return padToK(selected, k);
};

// ─────────────────────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────────────────────

/**
 * generateImagePalettes
 *
 * @param input  { square: string[] } — fallback colors used when data is absent
 * @param k      Colors to extract per algorithm (default 6)
 * @param data   Optional RGBA Uint8ClampedArray from canvas.getImageData().
 *               When omitted, synthetic pixels are generated from input.square.
 */
export const generateImagePalettes = (
  input: ImageGeneratorInput,
  k: number = 6,
  data?: Uint8ClampedArray,
): ImageGeneratorOutput => {
  const pixelData = data ?? syntheticPixels(input.square ?? ["#888888"]);
  const { rgbs, labs } = samplePixels(pixelData);

  if (labs.length === 0) {
    const empty = Array(k).fill("#000000");
    return {
      kmeans: empty,
      medianCut: empty,
      dominant: empty,
      vibrant: empty,
      muted: empty,
      octree: empty,
      colorMoments: empty,
      neuralQuant: empty,
      histogram: empty,
      deltaE: empty,
    };
  }

  return {
    kmeans: kMeansCore(labs, k).map(labToHex),
    medianCut: medianCutAlgo(rgbs, k).map(rgbToHex),
    dominant: dominantAlgo(rgbs, k).map(rgbToHex),
    vibrant: vibrantAlgo(labs, k).map(labToHex),
    muted: mutedAlgo(labs, k).map(labToHex),
    octree: octreeAlgo(rgbs, k).map(rgbToHex),
    colorMoments: colorMomentsAlgo(labs, k).map(labToHex),
    neuralQuant: neuralQuantAlgo(labs, k).map(labToHex),
    histogram: histogramAlgo(labs, k).map(labToHex),
    deltaE: deltaEAlgo(labs, k).map(labToHex),
  };
};
