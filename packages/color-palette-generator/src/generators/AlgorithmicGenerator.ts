/**
 * AlgorithmicGenerator
 * Generates 11 algorithmic / generative palette types from a square input:
 *   random, goldenRatio, noise, temperature, bezierInterpolation,
 *   easeInOut, blackbody, fibonacci, harmonicSeries, sinusoidal, cubehelix
 *
 * Color math: OKLab / OKLCH for perceptual uniformity.
 * Deterministic by default via seeded pseudo-random (mulberry32).
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

export interface AlgorithmicInput {
  square: string[];
}
export interface AlgorithmicOutput {
  random: string[];
  goldenRatio: string[];
  noise: string[];
  temperature: string[];
  bezierInterpolation: string[];
  easeInOut: string[];
  blackbody: string[];
  fibonacci: string[];
  harmonicSeries: string[];
  sinusoidal: string[];
  cubehelix: string[];
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
const TAU = Math.PI * 2;

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
const labToHex = (lab: Lab): string => rgbToHex(oklabToRgb(lab));

const lerpLab = (a: Lab, b: Lab, t: number): Lab => ({
  L: lerp(a.L, b.L, t),
  a: lerp(a.a, b.a, t),
  b: lerp(a.b, b.b, t),
});

// ─────────────────────────────────────────────────────────────
// Seeded PRNG — mulberry32
// Deterministic per base-color seed so output is reproducible.
// Reference: Tommy Ettinger (2021)
// ─────────────────────────────────────────────────────────────

const makePrng = (seed: number) => {
  let s = seed >>> 0;
  return (): number => {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
};

// Derive a numeric seed from the base hex string
const seedFromHex = (hex: string): number => {
  let h = 0;
  for (let i = 1; i < 7; i++) h = (Math.imul(31, h) + parseInt(hex[i], 16)) | 0;
  return Math.abs(h);
};

// ─────────────────────────────────────────────────────────────
// Perlin-style value noise (1D, no external lib)
// Uses smoothstep interpolation between seeded random gradients.
// Produces smooth, correlated values unlike pure PRNG.
// ─────────────────────────────────────────────────────────────

const makeValueNoise = (seed: number) => {
  const table: number[] = [];
  const rng = makePrng(seed);
  for (let i = 0; i < 256; i++) table.push(rng());
  const smoothstep = (t: number) => t * t * (3 - 2 * t);
  return (x: number): number => {
    const xi = Math.floor(x) & 255;
    const xf = x - Math.floor(x);
    return lerp(table[xi], table[(xi + 1) & 255], smoothstep(xf));
  };
};

// ─────────────────────────────────────────────────────────────
// Bezier cubic helper — De Casteljau evaluation
// ─────────────────────────────────────────────────────────────

const bezier3 = (
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number => {
  const mt = 1 - t;
  return (
    mt * mt * mt * p0 +
    3 * mt * mt * t * p1 +
    3 * mt * t * t * p2 +
    t * t * t * p3
  );
};

const bezierLab = (p0: Lab, p1: Lab, p2: Lab, p3: Lab, t: number): Lab => ({
  L: bezier3(p0.L, p1.L, p2.L, p3.L, t),
  a: bezier3(p0.a, p1.a, p2.a, p3.a, t),
  b: bezier3(p0.b, p0.b, p2.b, p3.b, t),
});

// ─────────────────────────────────────────────────────────────
// Ease-in-out cubic — smoothstep family
// ─────────────────────────────────────────────────────────────

const easeInOutCubic = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// ─────────────────────────────────────────────────────────────
// Blackbody radiation — Planckian locus approximation
// Maps temperature (Kelvin) to CIE xy chromaticity, then to sRGB.
// Reference: Kang et al. (2002) — polynomial approximation valid 1000K–25000K
// ─────────────────────────────────────────────────────────────

const kelvinToRgb = (K: number): RGB => {
  // CIE xy chromaticity via Kang et al. polynomial
  let x: number;
  if (K >= 1667 && K <= 4000) {
    x =
      -0.2661239e9 / (K * K * K) -
      0.234358e6 / (K * K) +
      0.8776956e3 / K +
      0.17991;
  } else {
    x =
      -3.0258469e9 / (K * K * K) +
      2.1070379e6 / (K * K) +
      0.2226347e3 / K +
      0.24039;
  }
  let y: number;
  if (K >= 1667 && K <= 2222) {
    y =
      -1.1063814 * x * x * x - 1.3481102 * x * x + 2.18555832 * x - 0.20219683;
  } else if (K <= 4000) {
    y =
      -0.9549476 * x * x * x - 1.37418593 * x * x + 2.09137015 * x - 0.16748867;
  } else {
    y = 3.081758 * x * x * x - 5.8733867 * x * x + 3.75112997 * x - 0.37001483;
  }

  // xy → XYZ (Y = 1)
  const Y = 1.0;
  const X = (Y * x) / Math.max(y, 1e-6);
  const Z = (Y * (1 - x - y)) / Math.max(y, 1e-6);

  // XYZ → linear sRGB (D65 matrix)
  const rl = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
  const gl = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
  const bl = 0.0557 * X - 0.204 * Y + 1.057 * Z;

  // Normalise to max channel = 1, then compand
  const mx = Math.max(rl, gl, bl, 1e-6);
  return {
    r: clamp01(delinearize(rl / mx)),
    g: clamp01(delinearize(gl / mx)),
    b: clamp01(delinearize(bl / mx)),
  };
};

// ─────────────────────────────────────────────────────────────
// CubeHelix — Green (1990), D. A. Green
// Monotonically increasing luminance spiral through RGB cube.
// Parameters: start hue, rotations, saturation (hue), gamma.
// Reference: Green, D.A. (2011). A colour scheme for the display of astronomical intensity images.
// ─────────────────────────────────────────────────────────────

const cubehelixRgb = (
  t: number,
  start = 0.5,
  rotations = -1.5,
  saturation = 1.2,
  gamma = 1.0,
): RGB => {
  const angle = TAU * (start / 3 + rotations * t);
  const tg = Math.pow(t, gamma);
  const amp = (saturation * tg * (1 - tg)) / 2;
  const cos_a = Math.cos(angle);
  const sin_a = Math.sin(angle);
  return {
    r: clamp01(tg + amp * (-0.14861 * cos_a + 1.78277 * sin_a)),
    g: clamp01(tg + amp * (-0.29227 * cos_a - 0.90649 * sin_a)),
    b: clamp01(tg + amp * (1.97294 * cos_a)),
  };
};

// ─────────────────────────────────────────────────────────────
// Generators — each returns exactly n hex strings
// ─────────────────────────────────────────────────────────────

/**
 * random — Randomly generated colors seeded by base color.
 * PRNG-seeded so the same input always produces the same output.
 * Hue is fully random; L and C are constrained to readable range.
 */
const randomPalette = (base: string, n: number): string[] => {
  const rng = makePrng(seedFromHex(base));
  return Array.from({ length: n }, () =>
    lchToHex({
      L: lerp(0.35, 0.75, rng()),
      C: lerp(0.08, 0.2, rng()),
      H: rng() * 360,
    }),
  );
};

/**
 * goldenRatio — Golden angle (137.508°) hue stepping.
 * Successive hues are spaced by the golden angle so that no two
 * adjacent swatches are ever close in hue — guaranteed separation
 * regardless of n. Irrational spacing prevents perceptual clustering.
 * Reference: Vogel, H. (1979). A better way to construct the sunflower head.
 */
const goldenRatio = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  const GOLDEN = 137.50776405003785; // 360° × (1 - 1/φ²)
  return Array.from({ length: n }, (_, i) => {
    const H = (lch.H + GOLDEN * i) % 360;
    return lchToHex({
      L: lerp(0.45, 0.7, (i % 3) / 2), // cycle lightness softly
      C: Math.max(lch.C, 0.1),
      H,
    });
  });
};

/**
 * noise — Smooth palette via value noise oscillation in OKLCH.
 * L, C, and H channels are each driven by independent noise functions
 * at different frequencies, producing an organic correlated variation.
 */
const noise = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  const seed = seedFromHex(base);
  const noiseL = makeValueNoise(seed);
  const noiseC = makeValueNoise(seed + 1);
  const noiseH = makeValueNoise(seed + 2);

  return Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(n - 1, 1);
    return lchToHex({
      L: clamp01(lerp(0.35, 0.8, noiseL(t * 3.5))),
      C: clamp01(lerp(0.06, 0.22, noiseC(t * 4.1 + 1))),
      H: (lch.H + noiseH(t * 2.7 + 2) * 120 - 60) % 360,
    });
  });
};

/**
 * temperature — Warm-to-cool spectrum mapping.
 * Traverses the perceptual temperature axis: deep red (hot) →
 * orange → yellow → neutral → teal → cool blue.
 * L arc peaks at mid-scale for a natural "glow" feeling.
 */
const temperature = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  // Hue arc: warm end (20°) → cool end (220°)
  const warmH = 20,
    coolH = 220;
  // Offset by base hue for brand alignment
  const offset = (lch.H - 120 + 360) % 360;

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const H = (lerp(warmH, coolH, t) + offset) % 360;
    // Lightness peaks in the yellow-white zone (t≈0.35)
    const L = 0.35 + 0.45 * Math.sin(t * Math.PI);
    const C = lerp(0.18, 0.12, Math.abs(t - 0.5) * 2);
    return lchToHex({ L, C, H });
  });
};

/**
 * bezierInterpolation — Multi-point cubic Bezier curve through OKLab.
 * Control points are derived from input colors; curve avoids the
 * "muddy midpoint" problem of linear RGB interpolation because
 * straight lines in OKLab are perceptually straight.
 */
const bezierInterpolation = (colors: string[], n: number): string[] => {
  // Build 4 control points from up to 4 input colors
  const labs = colors.slice(0, 4).map((c) => rgbToOklab(hexToRgb(c)));
  while (labs.length < 4) labs.push({ ...labs[labs.length - 1] });

  // Inner control points pulled toward the midpoint to smooth the curve
  const mid: Lab = {
    L: (labs[0].L + labs[3].L) / 2,
    a: (labs[0].a + labs[3].a) / 2,
    b: (labs[0].b + labs[3].b) / 2,
  };
  labs[1] = lerpLab(labs[1], mid, 0.35);
  labs[2] = lerpLab(labs[2], mid, 0.35);

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return labToHex(bezierLab(labs[0], labs[1], labs[2], labs[3], t));
  });
};

/**
 * easeInOut — Non-linear stepped interpolation for organic feel.
 * Applies a cubic ease-in-out to the t parameter before sampling
 * a linear lightness ramp. Steps cluster near the endpoints and
 * spread in the midrange — mimicking natural material gradients.
 */
const easeInOut = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  const Lmin = 0.28,
    Lmax = 0.88;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const tEased = easeInOutCubic(t);
    const L = lerp(Lmin, Lmax, tEased);
    // Chroma follows a gentle arc — peaks at mid-lightness
    const C = lch.C * (1 - 0.4 * Math.abs(t - 0.5) * 2);
    return lchToHex({ L, C, H: lch.H });
  });
};

/**
 * blackbody — Physics-based heated metal spectrum.
 * Maps Kelvin temperature (800K → 12000K) to sRGB via the
 * Planckian locus (Kang et al. 2002 polynomial approximation).
 * Produces: deep red → orange → yellow-white → cool white → blue-white.
 * Base hue shifts the temperature range anchor.
 */
const blackbody = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  // Map base hue to a temperature offset (warm hues → lower K start)
  const hueOffset = (lch.H / 360) * 3000;
  const Kmin = Math.max(900, 1500 + hueOffset);
  const Kmax = Math.min(15000, 9000 + hueOffset);

  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const K = lerp(Kmin, Kmax, t);
    return rgbToHex(kelvinToRgb(K));
  });
};

/**
 * fibonacci — Fibonacci sequence hue stepping.
 * Uses the Fibonacci sequence (1,1,2,3,5,8,13...) as angle multipliers
 * mod 360. Like the golden ratio approach but with integer steps that
 * produce a different distribution pattern — useful for categorical
 * palettes where perceptual regularity is less important than variety.
 */
const fibonacci = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  // Precompute Fibonacci numbers up to n
  const fibs: number[] = [1, 1];
  while (fibs.length < n)
    fibs.push(fibs[fibs.length - 1] + fibs[fibs.length - 2]);

  return Array.from({ length: n }, (_, i) => {
    // Hue: base + Fibonacci[i] * a small prime step, mod 360
    const H = (lch.H + ((fibs[i] * 47) % 360)) % 360;
    const L = lerp(0.4, 0.72, (i % 4) / 3);
    const C = Math.max(lch.C, 0.1);
    return lchToHex({ L, C, H });
  });
};

/**
 * harmonicSeries — Lightness follows a harmonic progression (1/n).
 * The n-th swatch has lightness proportional to 1/n, compressed into
 * a useful range. The harmonic series decreases rapidly at first then
 * slowly — creating a palette that has one dominant light value and
 * progressively darker, more compressed values. Chroma follows the
 * inverse: darker swatches are more saturated (like real pigments).
 */
const harmonicSeries = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  const Lmax = 0.88,
    Lmin = 0.28;
  return Array.from({ length: n }, (_, i) => {
    // Harmonic value: 1/(i+1), normalised to [0,1] range over n terms
    const harmonic = 1 / (i + 1);
    const maxH = 1; // 1/1
    const minH = 1 / n; // 1/n
    const tH = (harmonic - minH) / (maxH - minH);
    const L = lerp(Lmin, Lmax, tH);
    // Chroma inversely proportional to lightness (darker = more vivid)
    const C = lerp(lch.C * 1.3, lch.C * 0.5, tH);
    return lchToHex({ L, C: clamp01(C), H: lch.H });
  });
};

/**
 * sinusoidal — Sine wave oscillation through OKLCH space.
 * L, C, and H each follow a sine wave at different phases and
 * frequencies, producing a rhythmic palette that cycles through
 * light/dark and warm/cool without a simple linear trend.
 * Reference: Inspired by IQ (Inigo Quilez) cosine palette technique.
 */
const sinusoidal = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  return Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(n - 1, 1);
    // Three independent sine oscillators
    const L = 0.55 + 0.25 * Math.sin(TAU * t * 1.0 + 0.0);
    const C = lch.C * (0.7 + 0.5 * Math.sin(TAU * t * 1.5 + Math.PI / 3));
    const H = (lch.H + 60 * Math.sin(TAU * t * 0.75 + Math.PI / 6) + 360) % 360;
    return lchToHex({ L: clamp01(L), C: clamp01(C), H });
  });
};

/**
 * cubehelix — Monotonic luminance spiral through RGB cube.
 * Green (1990) designed this for astronomical imaging: luminance
 * increases monotonically from black to white while hue spirals
 * through the color cube. When printed in greyscale, information
 * is still fully encoded in luminance alone.
 * Reference: Green, D.A. (2011). BASI 39, 289.
 * Parameters tuned to start near base hue and complete ~1.5 rotations.
 */
const cubehelix = (base: string, n: number): string[] => {
  const lch = hexToLch(base);
  // Map base hue (0–360) to cubehelix start parameter (0–3)
  const start = (lch.H / 120) % 3;
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    return rgbToHex(cubehelixRgb(t, start, -1.5, 1.2, 1.0));
  });
};

// ─────────────────────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────────────────────

export const generateAlgorithmic = (
  input: AlgorithmicInput,
  n: number = 5,
): AlgorithmicOutput => {
  const colors = input.square ?? [];
  const c0 = colors[0] ?? "#0065ff";
  const c1 = colors[1] ?? "#ff0000";
  const c2 = colors[2] ?? "#00ff00";
  const c3 = colors[3] ?? "#ffff00";

  return {
    random: randomPalette(c0, n),
    goldenRatio: goldenRatio(c0, n),
    noise: noise(c0, n),
    temperature: temperature(c0, n),
    bezierInterpolation: bezierInterpolation([c0, c1, c2, c3], n),
    easeInOut: easeInOut(c0, n),
    blackbody: blackbody(c0, n),
    fibonacci: fibonacci(c0, n),
    harmonicSeries: harmonicSeries(c0, n),
    sinusoidal: sinusoidal(c0, n),
    cubehelix: cubehelix(c0, n),
  };
};
