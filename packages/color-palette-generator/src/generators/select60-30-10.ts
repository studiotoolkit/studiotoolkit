/**
 * select60-30-10.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Converts any palette of hex colors into the five roles of the 60–30–10
 * design composition rule, using OKLab perceptual color math throughout.
 *
 * Zero dependencies. Works in any TypeScript / ES2020+ environment.
 *
 * ─── CHANGES FROM ORIGINAL ───────────────────────────────────────────────────
 *
 * FIX 1 (latent mutation bug — all 5 steps)
 *   Every Array.sort() call was operating directly on a shared reference
 *   (nearNeutrals, px, midBand, darkNeutrals, sameHue, rem12, farHue, rem123).
 *   JavaScript's Array.prototype.sort() sorts IN PLACE and returns the same
 *   array reference. When the ternary `(a.length > 0 ? a : b).sort()` falls
 *   back to `b`, it mutates `b` for all subsequent code.
 *
 *   Concrete failure scenario:
 *     • If the palette has no near-neutrals, step 1 falls back and sorts `px`
 *       by L descending. Step 2 then receives a `px` sorted by L, not by
 *       original insertion order. When step 2's midBand is also empty and
 *       falls back to `px`, it sorts an already-L-sorted `px` by C — which
 *       still produces the correct winner, but any future change to algorithm
 *       logic that relies on `px` order would silently break.
 *     • darkNeutrals.sort() in step 3 mutates the local filter result; while
 *       this is currently harmless, it is inconsistent and fragile.
 *
 *   Fix: prepend .slice() before every .sort() so a new array is sorted
 *   instead of the original reference.
 *
 * FIX 2 (_normaliseHex — missing typeof guard)
 *   The original code called raw.trim() without first checking that raw is a
 *   string. Passing a number, null, or undefined would throw a generic
 *   "raw.trim is not a function" TypeError instead of the descriptive message
 *   that makes library errors actionable.
 *   Fix: add `if (typeof raw !== 'string')` guard at top of _normaliseHex.
 *
 * FIX 3 (select60_30_10 — incomplete input validation)
 *   `if (!palette.length)` throws when palette is null or undefined because
 *   accessing .length on null/undefined is a TypeError at the call site, not
 *   a helpful message from the library.
 *   Fix: check Array.isArray(palette) first.
 *
 * FIX 4 (rem12 / rem123 — Set-based exclusion for O(1) lookup)
 *   `![...].includes(hex)` is O(k) per element where k is the number of
 *   excluded hexes. Using a Set makes exclusion O(1). Not a correctness bug
 *   but good practice for a library function.
 */

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface LCH {
  /** Perceptual lightness, range 0–1 */
  L: number;
  /** Chroma (colourfulness), range 0–~0.4 */
  C: number;
  /** Hue angle in degrees, range 0–360 */
  H: number;
}

export interface ColorRole {
  /** Normalised "#rrggbb" hex string */
  hex: string;
  /** Role key, e.g. "neutralLight" */
  role: string;
  /** Human label, e.g. "Neutral Light" */
  label: string;
  /** Design proportion weight: "60%", "30%", "10%", or "—" */
  weight: string;
  /** OKLab-derived LCH coordinates */
  lch: LCH;
  /** true when this color was synthesised, not picked from the input palette */
  derived: boolean;
  /** "#ffffff" or "#111111" — highest-contrast text to place on this background */
  textColor: string;
  /** WCAG 2.x contrast ratio against neutralLight */
  contrast: number;
}

export interface RuleResult {
  neutralLight: ColorRole;
  neutralDark: ColorRole;
  mainColor: ColorRole;
  mainColorShade: ColorRole;
  accentColor: ColorRole;
}

export interface SelectOptions {
  /** OKLab C ceiling to qualify as "neutral". Default 0.06. */
  neutralChromaMax?: number;
  /** OKLab L floor for mainColor candidate band. Default 0.40. */
  mainLightnessMin?: number;
  /** OKLab L ceiling for mainColor candidate band. Default 0.72. */
  mainLightnessMax?: number;
  /** Max ΔH° for shade to count as "same hue" as main. Default 30. */
  shadeHueTolerance?: number;
  /** Min ΔH° for accent to count as "opposite" to main. Default 100. */
  accentHueMin?: number;
  /** Lightness of synthesised neutralDark. Default 0.20. */
  derivedDarkL?: number;
  /** Chroma of synthesised neutralDark. Default 0.035. */
  derivedDarkC?: number;
}

interface InternalColor {
  hex: string;
  lch: LCH;
}

// ─── INTERNAL COLOR MATH ─────────────────────────────────────────────────────
// Reference: Ottosson, B. (2020). oklab.org

const _lin = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;

const _delin = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;

const _clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

const _rgbToOklab = (r: number, g: number, b: number) => {
  const lr = _lin(r),
    lg = _lin(g),
    lb = _lin(b);
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

const _oklabToRgb = (L: number, a: number, b: number) => {
  const l = L + 0.3963377774 * a + 0.2158037573 * b;
  const m = L - 0.1055613458 * a - 0.0638541728 * b;
  const s = L - 0.0894841775 * a - 1.291485548 * b;
  const l3 = l * l * l,
    m3 = m * m * m,
    s3 = s * s * s;
  return {
    r: _clamp(
      _delin(+4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3),
    ),
    g: _clamp(
      _delin(-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3),
    ),
    b: _clamp(
      _delin(-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3),
    ),
  };
};

/**
 * Normalise any CSS hex string to a lowercase "#rrggbb" string.
 * Accepts "#rgb", "#rrggbb", "rgb", "rrggbb" (# optional, case-insensitive).
 *
 * FIX 2: Added explicit typeof guard so non-string inputs produce a clear
 * TypeError rather than a confusing "raw.trim is not a function" crash.
 */
const _normaliseHex = (raw: string): string => {
  // FIX 2 ↓
  if (typeof raw !== "string") {
    throw new TypeError(
      `Color must be a string, got ${typeof raw}: ${JSON.stringify(raw)}`,
    );
  }
  const h = raw.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(h)) {
    return "#" + h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (/^[0-9a-f]{6}$/.test(h)) {
    return "#" + h;
  }
  throw new RangeError(
    `Invalid hex color: "${raw}" — expected "#rgb" or "#rrggbb"`,
  );
};

const _hexToRgb = (hex: string) => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
});

const _rgbToHex = (r: number, g: number, b: number): string => {
  const f = (c: number) =>
    Math.round(_clamp(c) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
};

const _hexToLch = (hex: string): LCH => {
  const { r, g, b } = _hexToRgb(hex);
  const lab = _rgbToOklab(r, g, b);
  return {
    L: lab.L,
    C: Math.sqrt(lab.a * lab.a + lab.b * lab.b),
    H: ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360,
  };
};

const _lchToHex = (L: number, C: number, H: number): string => {
  const rad = (H * Math.PI) / 180;
  const { r, g, b } = _oklabToRgb(L, C * Math.cos(rad), C * Math.sin(rad));
  return _rgbToHex(r, g, b);
};

/** Shortest angular distance between two hue angles → result ∈ [0, 180] */
const _hueDist = (h1: number, h2: number): number => {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
};

// ─── PUBLIC UTILITIES ────────────────────────────────────────────────────────

/**
 * WCAG 2.x contrast ratio between two colors. Always ≥ 1.
 * Accepts any valid hex format: "#rgb", "#rrggbb", with or without "#".
 */
export const wcagContrast = (hexA: string, hexB: string): number => {
  const wcagY = (hex: string) => {
    const { r, g, b } = _hexToRgb(_normaliseHex(hex));
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b);
  };
  const ya = wcagY(hexA),
    yb = wcagY(hexB);
  return (Math.max(ya, yb) + 0.05) / (Math.min(ya, yb) + 0.05);
};

/**
 * Returns "#ffffff" or "#111111" — whichever has higher contrast on bgHex.
 */
export const bestTextOn = (bgHex: string): string =>
  wcagContrast(bgHex, "#ffffff") >= wcagContrast(bgHex, "#111111")
    ? "#ffffff"
    : "#111111";

// ─── CORE ALGORITHM ──────────────────────────────────────────────────────────

/**
 * Convert a palette into the five 60–30–10 color roles.
 *
 * @param palette   Non-empty array of hex strings (any valid CSS hex format).
 * @param opts      Optional algorithm parameter overrides.
 */
export function select60_30_10(
  palette: string[],
  opts: SelectOptions = {},
): RuleResult {
  // FIX 3 ↓  — robust input validation
  if (!Array.isArray(palette) || palette.length === 0) {
    throw new TypeError(
      "palette must be a non-empty array of hex color strings",
    );
  }

  const cfg = {
    neutralChromaMax: opts.neutralChromaMax ?? 0.06,
    mainLightnessMin: opts.mainLightnessMin ?? 0.4,
    mainLightnessMax: opts.mainLightnessMax ?? 0.72,
    shadeHueTolerance: opts.shadeHueTolerance ?? 30,
    accentHueMin: opts.accentHueMin ?? 100,
    derivedDarkL: opts.derivedDarkL ?? 0.2,
    derivedDarkC: opts.derivedDarkC ?? 0.035,
  };

  // Normalise all inputs to "#rrggbb" once at entry; all downstream code uses
  // the normalised hex so short-form / uppercase inputs never leak into output.
  const px: InternalColor[] = palette.map((raw) => {
    const hex = _normaliseHex(raw);
    return { hex, lch: _hexToLch(hex) };
  });

  // ── Step 1: neutralLight ──────────────────────────────────────────────────
  //   Lightest near-neutral (C < threshold).
  //   Fallback: globally lightest color when no low-chroma color exists.
  //
  //   FIX 1 ↓  .slice() before .sort() prevents mutation of nearNeutrals / px.
  const nearNeutrals = px.filter((c) => c.lch.C < cfg.neutralChromaMax);
  const nlSrc = (nearNeutrals.length > 0 ? nearNeutrals : px)
    .slice() // FIX 1
    .sort((a, b) => b.lch.L - a.lch.L)[0];

  // ── Step 2: mainColor ─────────────────────────────────────────────────────
  //   Most chromatic color in mid-lightness band.
  //   Fallback: globally most chromatic color when band is empty.
  //
  //   FIX 1 ↓
  const midBand = px.filter(
    (c) => c.lch.L >= cfg.mainLightnessMin && c.lch.L <= cfg.mainLightnessMax,
  );
  const mainSrc = (midBand.length > 0 ? midBand : px)
    .slice() // FIX 1
    .sort((a, b) => b.lch.C - a.lch.C)[0];

  // ── Step 3: neutralDark ───────────────────────────────────────────────────
  //   Darkest near-neutral (L < 0.35, C < threshold).
  //   Derived when palette has no qualifying dark neutral (common in
  //   image-extracted palettes where even dark colors carry high chroma).
  //
  //   FIX 1 ↓
  const darkNeutrals = nearNeutrals.filter(
    (c) => c.lch.L < 0.35 && c.hex !== nlSrc.hex,
  );
  let neutralDarkHex: string;
  let neutralDarkDerived: boolean;
  if (darkNeutrals.length > 0) {
    neutralDarkHex = darkNeutrals
      .slice() // FIX 1
      .sort((a, b) => a.lch.L - b.lch.L)[0].hex;
    neutralDarkDerived = false;
  } else {
    // Synthesise: take main brand hue, force to very low L and near-zero C.
    neutralDarkHex = _lchToHex(
      cfg.derivedDarkL,
      cfg.derivedDarkC,
      mainSrc.lch.H,
    );
    neutralDarkDerived = true;
  }

  // ── Step 4: mainColorShade ────────────────────────────────────────────────
  //   Darker twin of mainColor (same hue ± shadeHueTolerance, high C).
  //   Fallback 1: most chromatic unselected color (relaxed hue constraint).
  //   Fallback 2: synthesise by darkening main (tiny palette).
  //
  //   FIX 4 ↓  Set-based exclusion for O(1) lookup.
  const excluded12 = new Set([nlSrc.hex, mainSrc.hex]); // FIX 4
  const rem12 = px.filter((c) => !excluded12.has(c.hex)); // FIX 4
  let shadeHex: string;
  let shadeDerived = false;
  if (rem12.length > 0) {
    const sameHue = rem12.filter(
      (c) =>
        _hueDist(c.lch.H, mainSrc.lch.H) < cfg.shadeHueTolerance &&
        c.lch.C > 0.1,
    );
    shadeHex = (sameHue.length > 0 ? sameHue : rem12)
      .slice() // FIX 1
      .sort((a, b) => b.lch.C - a.lch.C)[0].hex;
  } else {
    shadeHex = _lchToHex(
      Math.max(0.05, mainSrc.lch.L - 0.08),
      mainSrc.lch.C * 0.92,
      mainSrc.lch.H,
    );
    shadeDerived = true;
  }

  // ── Step 5: accentColor ───────────────────────────────────────────────────
  //   Highest-chroma color with hue ≥ accentHueMin° away from main.
  //   Fallback 1: most chromatic remaining color (relaxed hue constraint).
  //   Fallback 2: synthesise a complementary color (tiny palette).
  //
  //   FIX 4 ↓
  const excluded123 = new Set([nlSrc.hex, mainSrc.hex, shadeHex]); // FIX 4
  const rem123 = px.filter((c) => !excluded123.has(c.hex)); // FIX 4
  let accentHex: string;
  let accentDerived = false;
  if (rem123.length > 0) {
    const farHue = rem123.filter(
      (c) => _hueDist(c.lch.H, mainSrc.lch.H) >= cfg.accentHueMin,
    );
    accentHex = (farHue.length > 0 ? farHue : rem123)
      .slice() // FIX 1
      .sort((a, b) => b.lch.C - a.lch.C)[0].hex;
  } else {
    accentHex = _lchToHex(
      0.72,
      Math.min(mainSrc.lch.C, 0.18),
      (mainSrc.lch.H + 150) % 360,
    );
    accentDerived = true;
  }

  // ── Assemble result ───────────────────────────────────────────────────────
  const mkRole = (
    role: string,
    label: string,
    weight: string,
    hex: string,
    derived = false,
  ): ColorRole => ({
    hex,
    role,
    label,
    weight,
    derived,
    lch: _hexToLch(hex),
    textColor: bestTextOn(hex),
    contrast: parseFloat(wcagContrast(hex, nlSrc.hex).toFixed(2)),
  });

  return {
    neutralLight: mkRole("neutralLight", "Neutral Light", "60%", nlSrc.hex),
    neutralDark: mkRole(
      "neutralDark",
      "Neutral Dark",
      "—",
      neutralDarkHex,
      neutralDarkDerived,
    ),
    mainColor: mkRole("mainColor", "Main Color", "30%", mainSrc.hex),
    mainColorShade: mkRole(
      "mainColorShade",
      "Main Color Shade",
      "—",
      shadeHex,
      shadeDerived,
    ),
    accentColor: mkRole(
      "accentColor",
      "Accent Color",
      "10%",
      accentHex,
      accentDerived,
    ),
  };
}

// ─── OUTPUT HELPERS ──────────────────────────────────────────────────────────

/**
 * Returns the five hex strings in role order:
 * [neutralLight, neutralDark, mainColor, mainColorShade, accentColor]
 */
export const toHexArray = (result: RuleResult): string[] => [
  result.neutralLight.hex,
  result.neutralDark.hex,
  result.mainColor.hex,
  result.mainColorShade.hex,
  result.accentColor.hex,
];

/**
 * Returns a flat { roleKey: hex } object.
 *
 * @example
 *   {
 *     neutralLight:   "#b7ccab",
 *     neutralDark:    "#2b2000",
 *     mainColor:      "#ee5034",
 *     mainColorShade: "#b4260a",
 *     accentColor:    "#4d7627",
 *   }
 */
export const toObject = (result: RuleResult) => ({
  neutralLight: result.neutralLight.hex,
  neutralDark: result.neutralDark.hex,
  mainColor: result.mainColor.hex,
  mainColorShade: result.mainColorShade.hex,
  accentColor: result.accentColor.hex,
});

/**
 * Returns a CSS `:root` block with five custom properties.
 *
 * @param result  Output of select60_30_10.
 * @param prefix  CSS variable name prefix. Defaults to "--color".
 *
 * @example
 *   toCssVars(result)
 *   // :root {
 *   //   --color-neutral-light: #b7ccab;
 *   //   --color-neutral-dark:  #2b2000;
 *   //   --color-main:          #ee5034;
 *   //   --color-main-shade:    #b4260a;
 *   //   --color-accent:        #4d7627;
 *   // }
 */
export const toCssVars = (result: RuleResult, prefix = "--color"): string => {
  const entries: [string, string][] = [
    ["neutral-light", result.neutralLight.hex],
    ["neutral-dark", result.neutralDark.hex],
    ["main", result.mainColor.hex],
    ["main-shade", result.mainColorShade.hex],
    ["accent", result.accentColor.hex],
  ];
  const maxLen = Math.max(...entries.map(([k]) => (prefix + "-" + k).length));
  const lines = entries.map(
    ([k, v]) => `  ${(prefix + "-" + k).padEnd(maxLen)}: ${v};`,
  );
  return `:root {\n${lines.join("\n")}\n}`;
};
