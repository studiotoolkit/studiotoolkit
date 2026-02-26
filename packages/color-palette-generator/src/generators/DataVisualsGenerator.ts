/**
 * DataVisualsGenerator
 * Generates 7 data visualization palette types from a square input:
 *   sequential, diverging, qualitative, bivariate,
 *   cyclical, spectral, stepped
 *
 * All color math in OKLab/OKLCH for perceptual uniformity.
 * Zero external dependencies.
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
interface LCH {
  L: number;
  C: number;
  H: number;
}

export interface DataVisualsInput {
  square: string[];
}
export interface DataVisualsOutput {
  sequential: string[]; // 4 swatches — light→dark single-hue ramp
  diverging: string[]; // 4 swatches — color A → neutral → color B
  qualitative: string[]; // 4 swatches — perceptually distinct categoricals
  bivariate: string[]; // 4 swatches — 2×2 grid (A-low, AB-mid, B-low, AB-high)
  cyclical: string[]; // 4 swatches — hue wheel that wraps back to start
  spectral: string[]; // 4 swatches — full rainbow diverging arc
  stepped: string[]; // 4 swatches — discrete class breaks, equal lightness steps
}

// ─────────────────────────────────────────────────────────────
// sRGB ↔ OKLab ↔ OKLCH
// Reference: Ottosson, B. (2020). oklab.org
// ─────────────────────────────────────────────────────────────

const linearize = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const delinearize = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

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

const oklabToOklch = ({ L, a, b }: Lab): LCH => ({
  L,
  C: Math.sqrt(a * a + b * b),
  H: ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360,
});

const oklchToOklab = ({ L, C, H }: LCH): Lab => ({
  L,
  a: C * Math.cos((H * Math.PI) / 180),
  b: C * Math.sin((H * Math.PI) / 180),
});

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

const hexToLch = (hex: string): LCH => oklabToOklch(rgbToOklab(hexToRgb(hex)));
const lchToHex = (lch: LCH): string => rgbToHex(oklabToRgb(oklchToOklab(lch)));

// Interpolate hue along shortest arc
const lerpHue = (h1: number, h2: number, t: number): number => {
  let d = h2 - h1;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return (h1 + d * t + 360) % 360;
};

const lerpLch = (a: LCH, b: LCH, t: number): LCH => ({
  L: lerp(a.L, b.L, t),
  C: lerp(a.C, b.C, t),
  H: lerpHue(a.H, b.H, t),
});

// ─────────────────────────────────────────────────────────────
// Core generators — each returns exactly `n` hex strings
// ─────────────────────────────────────────────────────────────

/**
 * sequential — Light-to-dark continuous ramp along a single hue.
 * Lightness spans 0.92 (near-white) → 0.25 (dark) in OKLab.
 * Chroma is held at the base color's chroma for saturation consistency.
 */
const sequential = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return lchToHex({ L: lerp(0.92, 0.25, t), C: lch.C, H: lch.H });
  });
};

/**
 * diverging — Two hues with a neutral (low-chroma) midpoint.
 * color[0] → neutral grey → color[1], symmetric lightness arc.
 * Lightness peaks at 0.90 (midpoint) and settles at 0.40 at both ends.
 */
const diverging = (colorA: string, colorB: string, n: number): string[] => {
  const lchA = hexToLch(colorA);
  const lchB = hexToLch(colorB);
  const neutral: LCH = { L: 0.9, C: 0.02, H: lchA.H }; // near-white grey

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1); // 0 … 1 across full range
    const half = t * 2; // 0 … 2
    if (t <= 0.5) {
      // Left arm: colorA (dark) → neutral (light)
      const lchStart: LCH = { ...lchA, L: 0.4 };
      return lchToHex(lerpLch(lchStart, neutral, half));
    } else {
      // Right arm: neutral (light) → colorB (dark)
      const lchEnd: LCH = { ...lchB, L: 0.4 };
      return lchToHex(lerpLch(neutral, lchEnd, half - 1));
    }
  });
};

/**
 * qualitative — Perceptually distinct categoricals.
 * Hues spaced evenly around the OKLCH wheel starting from base hue.
 * Lightness and chroma held constant so no color looks "more important".
 */
const qualitative = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  const L = clamp01(lerp(0.55, 0.65, 0.5)); // fixed mid lightness
  const C = Math.max(lch.C, 0.12); // guarantee saturation
  return Array.from({ length: n }, (_, i) => {
    const H = (lch.H + (360 / n) * i) % 360;
    return lchToHex({ L, C, H });
  });
};

/**
 * bivariate — 2×2 color matrix for two independent variables.
 * Encodes Variable A along hue axis and Variable B along lightness axis.
 * Layout: [A-low B-low, A-high B-low, A-low B-high, A-high B-high]
 * With 4 swatches this produces the four corners of the bivariate grid.
 */
const bivariate = (colorA: string, colorB: string, n: number): string[] => {
  const lchA = hexToLch(colorA);
  const lchB = hexToLch(colorB);

  // 4-corner grid — for n>4 fill intermediates by lerping
  const corners: LCH[] = [
    { L: 0.85, C: lchA.C * 0.5, H: lchA.H }, // A-low  B-low  (light A tint)
    { L: 0.45, C: lchA.C, H: lchA.H }, // A-high B-low  (dark A)
    { L: 0.85, C: lchB.C * 0.5, H: lchB.H }, // A-low  B-high (light B tint)
    { L: 0.45, C: Math.max(lchA.C, lchB.C), H: lerpHue(lchA.H, lchB.H, 0.5) }, // A-high B-high (mixed dark)
  ];

  return Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(n - 1, 1);
    // Interpolate across the 4 corners for n != 4
    const idx = t * (corners.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, corners.length - 1);
    return lchToHex(lerpLch(corners[lo], corners[hi], idx - lo));
  });
};

/**
 * cyclical — Hue wheel that returns to start, for periodic data.
 * Wraps 0°→360° while holding L and C constant.
 * The last swatch intentionally approximates the first so the
 * scale "closes" when used on cyclic data (time-of-day, compass bearings).
 */
const cyclical = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  const L = clamp01(lch.L > 0.7 ? lch.L : 0.62);
  const C = Math.max(lch.C, 0.12);
  return Array.from({ length: n }, (_, i) => {
    // t goes 0 → (n-1)/n so index n-1 is just before 360° (not identical to 0°)
    const t = i / n;
    const H = (lch.H + 360 * t) % 360;
    return lchToHex({ L, C, H });
  });
};

/**
 * spectral — Full rainbow diverging arc (like ColorBrewer Spectral).
 * Traverses the hue wheel from warm (red/orange) through neutral (yellow/green)
 * to cool (blue/purple), mirroring the perceptual "spectrum" convention.
 * Fixed hue anchors ensure the arc always reads warm→cool regardless of input;
 * input base hue shifts the overall arc by ±30° for brand alignment.
 */
const spectral = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  const offset = (lch.H - 30 + 360) % 360; // brand-align shift
  // Spectral anchors: red→orange→yellow→green→teal→blue→purple
  const anchors = [0, 30, 60, 120, 180, 240, 280].map(
    (h) => (h + offset) % 360,
  );
  const C = Math.max(lch.C, 0.14);
  const Ls = [0.45, 0.6, 0.8, 0.72, 0.62, 0.5, 0.42]; // lightness arc

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const idx = t * (anchors.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.min(lo + 1, anchors.length - 1);
    const f = idx - lo;
    return lchToHex({
      L: lerp(Ls[lo], Ls[hi], f),
      C,
      H: lerpHue(anchors[lo], anchors[hi], f),
    });
  });
};

/**
 * stepped — Discrete class breaks for choropleth / categorized maps.
 * Equal perceptual lightness steps from light to dark along the base hue.
 * Unlike sequential, steps are quantized — the scale is meant to be read
 * as distinct classes, not as a continuous gradient.
 * Lightness jumps are uniform in OKLab (perceptual) space.
 */
const stepped = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  const Lmin = 0.3,
    Lmax = 0.88;
  // Round each lightness to the nearest "step grid" value so boundaries are crisp
  const stepSize = (Lmax - Lmin) / n;
  return Array.from({ length: n }, (_, i) => {
    // Center of each band
    const L = Lmax - stepSize * (i + 0.5);
    return lchToHex({ L, C: lch.C * 0.85, H: lch.H });
  });
};

// ─────────────────────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────────────────────

export const generateDataVisuals = (
  input: DataVisualsInput,
  n: number = 4,
): DataVisualsOutput => {
  const colors = input.square ?? [];
  // Fallback gracefully if fewer than 4 colors provided
  const c0 = colors[0] ?? "#0000ff";
  const c1 = colors[1] ?? "#ff0000";
  const c2 = colors[2] ?? "#00ff00";

  return {
    // single-hue ramps use first input color
    sequential: sequential(c0, n),

    // diverging uses first (cool) and third (warm) for max hue contrast
    diverging: diverging(c0, c2, n),

    // qualitative spaces all four input hues evenly around the wheel
    qualitative: qualitative(c0, n),

    // bivariate encodes two variables: first and second input colors
    bivariate: bivariate(c0, c1, n),

    // cyclical starts at first input hue and wraps the full wheel
    cyclical: cyclical(c0, n),

    // spectral arcs across the rainbow; offset by first input hue
    spectral: spectral(c0, n),

    // stepped discrete breaks along first input hue
    stepped: stepped(c0, n),
  };
};
