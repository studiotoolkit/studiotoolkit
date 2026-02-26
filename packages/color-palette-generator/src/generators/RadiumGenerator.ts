/**
 * RadiumGenerator
 * Accepts any color palette JSON structure and returns the same structure
 * with Radium-generated colors — same keys, same array lengths, new colors.
 *
 * Base color is inferred from the first valid hex found in the input.
 * All color math uses OKLab/OKLCH for perceptual uniformity.
 * Zero external dependencies.
 */

// ─────────────────────────────────────────────────────────────
// Internal types
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

// ─────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────

/**
 * Any JSON object whose values are arrays of hex-color strings.
 * The exact shape (keys + array lengths) is mirrored in the output.
 *
 * @example
 * {
 *   triadic:       ["#ff0000", "#00ff00", "#0000ff"],
 *   monochromatic: ["#4d0000", ..., "#ffb3b3"],   // 16 entries
 * }
 */
export type RadiumInput = Record<string, string[]>;
export type RadiumOutput = Record<string, string[]>;

// ─────────────────────────────────────────────────────────────
// OKLab / OKLCH  (Ottosson 2020 — oklab.org)
// ─────────────────────────────────────────────────────────────

const linearize = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const delinearize = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const hexToRgb01 = (hex: string): RGB => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
});

const rgbToHex = ({ r, g, b }: RGB): string => {
  const f = (c: number) =>
    Math.round(clamp01(c) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
};

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

/**
 * OKLab → linear-sRGB, **unclipped**.
 * Channel values may exceed [0, 1] for out-of-gamut colors.
 * Used by lchToHexSafe's binary-search — must NOT clamp here.
 */
const oklabToRgbRaw = ({ L, a, b }: Lab): RGB => {
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l * l * l,
    m3 = m * m * m,
    s3 = s * s * s;
  return {
    r: delinearize(4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    g: delinearize(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    b: delinearize(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
  };
};

/** OKLab → sRGB clamped to [0, 1]. Safe for hex encoding. */
const oklabToRgb = (lab: Lab): RGB => {
  const { r, g, b } = oklabToRgbRaw(lab);
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b) };
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

const hexToLch = (hex: string): LCH =>
  oklabToOklch(rgbToOklab(hexToRgb01(hex)));

// const lchToHex = (lch: LCH): string => rgbToHex(oklabToRgb(oklchToOklab(lch)));

/**
 * Gamut-safe conversion: reduces chroma until the color fits inside sRGB.
 *
 * When an OKLCH color lies outside the sRGB gamut, naively converting it
 * clamps each RGB channel independently — this distorts the hue angle
 * (e.g. orange becomes red, yellow-green becomes green). Binary-searching
 * chroma downward preserves the hue exactly while landing on the most
 * vivid in-gamut color at the target lightness.
 *
 * Tolerance 0.001 in chroma ≈ visually imperceptible difference.
 */
const lchToHexSafe = (lch: LCH): string => {
  // Gamut test uses UNCLIPPED (raw) values — clamped values always appear
  // "in gamut" which defeats the binary search entirely.
  const inGamut = (rgb: RGB): boolean =>
    rgb.r >= -0.001 &&
    rgb.r <= 1.001 &&
    rgb.g >= -0.001 &&
    rgb.g <= 1.001 &&
    rgb.b >= -0.001 &&
    rgb.b <= 1.001;

  // Fast path: already in gamut
  const direct = oklabToRgbRaw(oklchToOklab(lch));
  if (inGamut(direct)) return rgbToHex(oklabToRgb(oklchToOklab(lch)));

  // Binary search on raw values: find max C that stays inside sRGB.
  // Preserves hue exactly — only chroma is reduced, never hue.
  // 24 iterations → precision ≈ lch.C / 2^24 (imperceptible).
  let lo = 0;
  let hi = lch.C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklabToRgbRaw(oklchToOklab({ ...lch, C: mid })))) lo = mid;
    else hi = mid;
  }
  return rgbToHex(oklabToRgb(oklchToOklab({ ...lch, C: lo })));
};

// /** Rotate hue by `deg`, preserving L and C */
// const rotateHue = (lch: LCH, deg: number): string =>
//   lchToHexSafe({ ...lch, H: (lch.H + deg + 360) % 360 });

// ─────────────────────────────────────────────────────────────
// Palette key → hue-offset definitions
// ─────────────────────────────────────────────────────────────

/**
 * Maps normalised palette key names to their canonical hue-rotation offsets.
 * Keys are lowercased with all non-alpha chars stripped for loose matching.
 */
const HARMONY_OFFSETS: Record<string, number[]> = {
  harmonypalette: [0, 150, 210],
  analogous: [-30, 0, 30],
  complementary: [0, 180],
  splitcomplementary: [0, 150, 210],
  triadic: [0, 120, 240],
  tetradic: [0, 60, 180, 240],
  square: [0, 90, 180, 270],
  accentedanalogous: [-30, 0, 30, 180],
  doublesplitcomplementary: [0, 30, 150, 180, 210, 330],
  ambiguous: [15, 135, 255],
};

/**
 * Semantic single-token transforms, resolved by normalised key name.
 * Each entry: match predicate + apply function (LCH → LCH).
 * Resolution is first-match in order — more specific fragments first.
 *
 * All target L values are absolute so the transform is strong and
 * predictable regardless of input lightness. lchToHexSafe() is used on
 * the result to prevent hue drift from sRGB gamut clipping.
 */
const SEMANTIC_TRANSFORMS: Array<{
  match: (k: string) => boolean;
  apply: (lch: LCH) => LCH;
}> = [
  // neutralLight → very light near-white, hue ghost only
  {
    match: (k) =>
      k.includes("neutrallight") ||
      (k.includes("neutral") && k.includes("light")),
    apply: (lch) => ({ ...lch, L: 0.93, C: Math.min(lch.C * 0.08, 0.015) }),
  },
  // neutralDark → very dark near-black, hue ghost only
  {
    match: (k) =>
      k.includes("neutraldark") ||
      (k.includes("neutral") && k.includes("dark")),
    apply: (lch) => ({ ...lch, L: 0.1, C: Math.min(lch.C * 0.08, 0.015) }),
  },
  // neutral (generic) → mid-grey, very low chroma
  {
    match: (k) => k.includes("neutral"),
    apply: (lch) => ({ ...lch, L: 0.55, C: Math.min(lch.C * 0.06, 0.012) }),
  },
  // *shade → fixed dark L 0.30, chroma preserved (gamut-safe)
  {
    match: (k) => k.endsWith("shade") || k.includes("colorshade"),
    apply: (lch) => ({ ...lch, L: 0.3, C: lch.C }),
  },
  // *dark → deeper dark L 0.22, chroma preserved (gamut-safe)
  {
    match: (k) => k.endsWith("dark"),
    apply: (lch) => ({ ...lch, L: 0.22, C: lch.C }),
  },
  // *light / *tint → fixed light L 0.88, chroma halved
  {
    match: (k) => k.endsWith("light") || k.endsWith("tint"),
    apply: (lch) => ({ ...lch, L: 0.88, C: lch.C * 0.5 }),
  },
  // accent* → vivid mid-tone L 0.62, chroma floored at 0.22
  {
    match: (k) => k.startsWith("accent"),
    apply: (lch) => ({ ...lch, L: 0.62, C: Math.max(lch.C, 0.22) }),
  },
  // main* / primary* / brand* → saturated mid-tone L 0.52, chroma floored at 0.22
  {
    match: (k) =>
      k.startsWith("main") || k.startsWith("primary") || k.startsWith("brand"),
    apply: (lch) => ({ ...lch, L: 0.52, C: Math.max(lch.C, 0.22) }),
  },
  // background* / bg* → near-white, essentially no chroma
  {
    match: (k) => k.startsWith("background") || k.startsWith("bg"),
    apply: (lch) => ({ ...lch, L: 0.97, C: Math.min(lch.C * 0.08, 0.012) }),
  },
  // surface* → off-white with subtle hue tint
  {
    match: (k) => k.startsWith("surface"),
    apply: (lch) => ({ ...lch, L: 0.91, C: Math.min(lch.C * 0.18, 0.025) }),
  },
  // foreground* / text* / on* → near-black, very low chroma
  {
    match: (k) =>
      k.startsWith("foreground") || k.startsWith("text") || k.startsWith("on"),
    apply: (lch) => ({ ...lch, L: 0.18, C: Math.min(lch.C * 0.12, 0.02) }),
  },
];

// ─────────────────────────────────────────────────────────────
// Per-palette generators
// ─────────────────────────────────────────────────────────────

/**
 * Builds `n` colors for a named palette key.
 *
 * Resolution order:
 *  1. n > 1, named harmony   → fixed hue-offset set (triadic, square, …)
 *  2. n > 1, tint/shade key  → tint-shade power-curve ramp
 *  3. n > 1, monochromatic   → dark-to-light OKLCH ramp
 *  4. n > 1, unknown key     → evenly-spaced hues around the wheel
 *  5. n = 1, semantic key    → SEMANTIC_TRANSFORMS (absolute LCH targets, gamut-safe)
 *  6. n = 1, unknown key     → preserve hue, Radium vivid mid-tone (L 0.55, C ≥ 0.18)
 */
const generatePalette = (key: string, lch: LCH, n: number): string[] => {
  const k = key.toLowerCase().replace(/[^a-z]/g, "");

  // ── Multi-swatch paths ──────────────────────────────────────
  if (n > 1) {
    if (k.includes("tintshade")) return buildTintShadeRamp(lch, n);
    if (k.includes("monochromatic")) return buildMonochromaticRamp(lch, n);
    if (k.includes("tint") || k.includes("shade"))
      return buildTintShadeRamp(lch, n);
    const offsets = HARMONY_OFFSETS[k];
    if (offsets) return buildFromOffsets(lch, offsets, n);
    return buildEvenlySpaced(lch, n);
  }

  // ── Single-swatch: semantic transform lookup ────────────────
  for (const { match, apply } of SEMANTIC_TRANSFORMS) {
    if (match(k)) return [lchToHexSafe(apply(lch))];
  }

  // Generic single-swatch fallback: hue preserved, Radium vivid mid-tone
  return [lchToHexSafe({ ...lch, L: 0.55, C: Math.max(lch.C, 0.18) })];
};

/**
 * Cycles through a fixed offset list to produce exactly `n` swatches.
 * For indices beyond the base set, lightness is slightly darkened so
 * duplicated hues still read as distinct swatches.
 */
const buildFromOffsets = (lch: LCH, offsets: number[], n: number): string[] =>
  Array.from({ length: n }, (_, i) => {
    const deg = offsets[i % offsets.length];
    const extraShift = Math.floor(i / offsets.length) * 0.08;
    return lchToHexSafe({
      ...lch,
      L: clamp01(lch.L - extraShift),
      H: (lch.H + deg + 360) % 360,
    });
  });

/** Evenly-spaced hues covering the full 360° wheel */
const buildEvenlySpaced = (lch: LCH, n: number): string[] =>
  Array.from({ length: n }, (_, i) =>
    lchToHexSafe({ ...lch, H: (lch.H + (360 / n) * i) % 360 }),
  );

/** Continuous dark → light ramp, chroma eased at the extremes */
const buildMonochromaticRamp = (lch: LCH, n: number): string[] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(n - 1, 1);
    const L = lerp(0.12, 0.94, t);
    const C = lch.C * clamp01(1 - Math.pow(Math.abs(t - 0.45), 2.5));
    return lchToHexSafe({ L, C, H: lch.H });
  });

/** Tint-shade ramp with a power-curve lightness and saturated mid-dark zone */
const buildTintShadeRamp = (lch: LCH, n: number): string[] =>
  Array.from({ length: n }, (_, i) => {
    const t = i / Math.max(n - 1, 1);
    const tCurved =
      t < 0.5
        ? 0.5 * Math.pow(t * 2, 1.6)
        : 1 - 0.5 * Math.pow((1 - t) * 2, 1.4);
    const L = lerp(0.1, 0.96, tCurved);
    const C = lch.C * clamp01(1 - Math.pow((t - 0.4) / 0.7, 2) * 0.6);
    return lchToHexSafe({ L, C, H: lch.H });
  });

// ─────────────────────────────────────────────────────────────
// Base-color extraction
// ─────────────────────────────────────────────────────────────

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

/**
 * Returns the first valid 6-digit hex string from an array.
 * Falls back to `#ff0000` if none is found.
 */
const extractColorFromArray = (colors: string[]): string => {
  for (const color of colors) {
    if (HEX_RE.test(color)) return color;
  }
  return "#ff0000";
};

// ─────────────────────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────────────────────

/**
 * Accepts **any** color palette JSON and returns the **exact same structure** —
 * identical keys and array lengths — filled with Radium-generated colors.
 *
 * Each key independently derives its base color from its **own first value**.
 * Semantic key names drive perceptually accurate OKLCH transforms:
 *
 * - `neutralLight`            → L 0.93, chroma drained (near-white tint)
 * - `neutralDark`             → L 0.10, chroma drained (near-black shade)
 * - `*shade` / `*dark`        → L 0.30 / 0.22, hue exactly preserved (gamut-safe)
 * - `*light` / `*tint`        → L 0.88, chroma halved
 * - `accent*`                 → L 0.62, chroma ≥ 0.22 (vivid, gamut-safe)
 * - `main*` / `primary*`      → L 0.52, chroma ≥ 0.22 (saturated, gamut-safe)
 * - harmony keys              → hue-rotation sets
 * - ramp keys                 → lightness ramps
 * - unknown single-swatch     → L 0.55, C ≥ 0.18, hue preserved
 *
 * All single-swatch outputs use gamut-safe chroma reduction to prevent
 * hue drift when the target lightness lies outside the sRGB gamut.
 *
 * @param input  Any `Record<string, string[]>` palette map.
 * @returns      Same keys + same lengths, Radium-computed colors.
 */
export const generateRadiumColors = (input: RadiumInput): RadiumOutput =>
  Object.fromEntries(
    Object.entries(input).map(([key, colors]) => {
      const base = extractColorFromArray(colors);
      const lch = hexToLch(base);
      return [key, generatePalette(key, lch, colors.length)];
    }),
  );

// ─────────────────────────────────────────────────────────────
// Exported color utilities
// ─────────────────────────────────────────────────────────────

/** Converts a hex string to `{ r, g, b }` in 0–255 range */
export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const { r, g, b } = hexToRgb01(hex);
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
};

/** Converts a hex string to a CSS `rgba(…)` string */
export const hexToRgba = (hex: string, alpha = 1): string => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** WCAG relative luminance (0 = black, 1 = white) */
export const getLuminance = (hex: string): number => {
  const { r, g, b } = hexToRgb01(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

/** WCAG contrast ratio between two hex colors */
export const getContrastRatio = (hex1: string, hex2: string): number => {
  const l1 = getLuminance(hex1),
    l2 = getLuminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/** Returns `"#000000"` or `"#ffffff"` for accessible text on the given background */
export const getReadableTextColor = (bg: string): "#000000" | "#ffffff" =>
  getLuminance(bg) > 0.179 ? "#000000" : "#ffffff";
