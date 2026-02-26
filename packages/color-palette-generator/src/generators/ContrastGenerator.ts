/**
 * Contrast-Based (Accessibility) Color Palette Generator
 * Implements: contrastScale, accessible, wcag, apca, colorBlindSafe, colorTokenized, highContrast
 *
 * Fix history:
 *  R1 — adjustToWcagRatio: directional binary searches anchored to hsl.l
 *  R1 — apca: binary search direction corrected
 *  R1 — colorTokenized: TokenRole interface typed, no `as any`
 *  R2 — adjustToWcagRatio: fallback to nearest extreme (black/white)
 *  R2 — apca: upper bound widened to hi=1.0
 *  R3 — wcag: pre-offset lightness per slot for distinct swatches
 *  R3 — highContrast: dark-side ramp starts at l=0.05
 *  R4 — adjustToWcagRatio: early-return restored (R3 removal broke accessible)
 *  R4 — wcag: lOffset replaced with fixed canonical startL tiers per target type
 *  R4 — highContrast: per-slot spread across wider ranges; explicit slot counts
 *  R5 — wcag: cycle saturation step 0.15→0.30; per-cycle lShift ±0.08 added
 *  R5 — highContrast: dark-side saturation fades slot-by-slot to escape dead zone
 *  R6 — highContrast: adjustToWcagRatioFromL helper added — skips early-return,
 *        searches outward from a caller-supplied startL so every slot is forced
 *        to produce a unique result even when the candidate already passes.
 *        Dark side: fade s → 0 and cap l at 0.28 to guarantee passing range.
 *        Light side: searches from per-slot startL rather than converging to white.
 */

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface TokenRole {
  name: string;
  l: number;
  s: number;
  h?: number;
}

interface PaletteInput {
  [key: string]: string[];
}

interface PaletteOutput {
  [key: string]: string[];
}

// --- Base Utilities ---

const hexToRgb = (hex: string): ColorRGB => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
});

const rgbToHex = ({ r, g, b }: ColorRGB): string => {
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
};

const linearize = (c: number): number =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

const delinearize = (c: number): number =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const clamp = (v: number, min = 0, max = 1): number =>
  Math.max(min, Math.min(max, v));

const white: ColorRGB = { r: 1, g: 1, b: 1 };
const black: ColorRGB = { r: 0, g: 0, b: 0 };

// --- Luminance & Contrast Math ---

/**
 * WCAG 2.x relative luminance (IEC 61966-2-1)
 */
const relativeLuminance = ({ r, g, b }: ColorRGB): number =>
  0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);

/**
 * WCAG 2.x contrast ratio. Range: 1:1 (identical) to 21:1 (black on white).
 */
const wcagContrastRatio = (c1: ColorRGB, c2: ColorRGB): number => {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};

/**
 * APCA (Advanced Perceptual Contrast Algorithm) — WCAG 3.x candidate.
 * Returns Lc value. Negative = dark text on light bg; positive = light text on dark bg.
 * Key thresholds: |Lc| >= 45 (large text), >= 60 (normal text), >= 75 (body text).
 * Reference: Somers, A. (2022). APCA-W3 0.0.98G-4g
 */
const apcaContrast = (textColor: ColorRGB, bgColor: ColorRGB): number => {
  const toY = ({ r, g, b }: ColorRGB): number =>
    0.2126729 * Math.pow(r, 2.4) +
    0.7151522 * Math.pow(g, 2.4) +
    0.072175 * Math.pow(b, 2.4);

  const Ysb = 0.022,
    Yco = 1.414;
  const normBG = 0.56,
    normTXT = 0.57;
  const revTXT = 0.62,
    revBG = 0.65;
  const scale = 1.14,
    loClip = 0.1,
    deltaYmin = 0.0005;

  let Ytxt = toY(textColor);
  let Ybg = toY(bgColor);
  Ytxt = Ytxt > Ysb ? Ytxt : Ytxt + Math.pow(Ysb - Ytxt, Yco);
  Ybg = Ybg > Ysb ? Ybg : Ybg + Math.pow(Ysb - Ybg, Yco);

  if (Math.abs(Ybg - Ytxt) < deltaYmin) return 0;

  if (Ybg > Ytxt) {
    const Sapc = (Math.pow(Ybg, normBG) - Math.pow(Ytxt, normTXT)) * scale;
    return Sapc < loClip ? 0 : (Sapc - 0.027) * 100;
  } else {
    const Sapc = (Math.pow(Ybg, revBG) - Math.pow(Ytxt, revTXT)) * scale;
    return Sapc > -loClip ? 0 : (Sapc + 0.027) * 100;
  }
};

// --- Color Space Conversions ---

const rgbToHsl = ({ r, g, b }: ColorRGB) => {
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = d / (l > 0.5 ? 2 - max - min : max + min);
  let h = 0;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: h * 60, s, l };
};

const hslToRgb = ({
  h,
  s,
  l,
}: {
  h: number;
  s: number;
  l: number;
}): ColorRGB => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  return { r: r + m, g: g + m, b: b + m };
};

// --- Core Helpers ---

/**
 * Standard WCAG ratio adjuster with early-return.
 * If the input already passes, returns it unchanged.
 * Used by: accessible, wcag (after pre-offsetting).
 */
const adjustToWcagRatio = (
  color: ColorRGB,
  reference: ColorRGB,
  targetRatio: number,
  maxIter = 48,
): ColorRGB => {
  if (wcagContrastRatio(color, reference) >= targetRatio) return color;

  const hsl = rgbToHsl(color);
  let best: ColorRGB | null = null;

  // Search darker
  {
    let lo = 0,
      hi = hsl.l;
    for (let i = 0; i < maxIter; i++) {
      const mid = (lo + hi) / 2;
      const candidate = hslToRgb({ ...hsl, l: mid });
      if (wcagContrastRatio(candidate, reference) >= targetRatio) {
        best = candidate;
        hi = mid;
      } else {
        lo = mid;
      }
    }
  }
  if (best && wcagContrastRatio(best, reference) >= targetRatio) return best;

  // Search lighter
  {
    let lo = hsl.l,
      hi = 1;
    for (let i = 0; i < maxIter; i++) {
      const mid = (lo + hi) / 2;
      const candidate = hslToRgb({ ...hsl, l: mid });
      if (wcagContrastRatio(candidate, reference) >= targetRatio) {
        best = candidate;
        lo = mid;
      } else {
        hi = mid;
      }
    }
  }
  if (best && wcagContrastRatio(best, reference) >= targetRatio) return best;

  // Fallback to nearest extreme
  return wcagContrastRatio(black, reference) >=
    wcagContrastRatio(white, reference)
    ? black
    : white;
};

/**
 * R6: Forced-search variant — NO early-return.
 * Searches outward from a caller-supplied startL in one direction only.
 * `direction`: "dark" searches [0, startL], "light" searches [startL, 1].
 * Used exclusively by highContrast so each slot starts from its own unique
 * lightness and cannot converge to the same passing value as a neighbour.
 */
const adjustToWcagRatioFromL = (
  hue: number,
  sat: number,
  startL: number,
  reference: ColorRGB,
  targetRatio: number,
  direction: "dark" | "light",
  maxIter = 48,
): ColorRGB => {
  let lo = direction === "dark" ? 0 : startL;
  let hi = direction === "dark" ? startL : 1;
  let best: ColorRGB | null = null;

  for (let i = 0; i < maxIter; i++) {
    const mid = (lo + hi) / 2;
    const candidate = hslToRgb({ h: hue, s: sat, l: mid });
    if (wcagContrastRatio(candidate, reference) >= targetRatio) {
      best = candidate;
      // Converge toward startL — find the value closest to startL that still passes
      if (direction === "dark") {
        lo = mid;
      } else {
        hi = mid;
      }
    } else {
      if (direction === "dark") {
        hi = mid;
      } else {
        lo = mid;
      }
    }
  }

  if (best && wcagContrastRatio(best, reference) >= targetRatio) return best;

  // Fallback: nearest extreme
  return wcagContrastRatio(black, reference) >=
    wcagContrastRatio(white, reference)
    ? black
    : white;
};

/**
 * Simulate Deuteranopia (red-green colour blindness, green-weak).
 * Reference: Machado, G.M., Oliveira, M.M., & Fernandes, L.A. (2009)
 */
const simulateDeuteranopia = ({ r, g, b }: ColorRGB): ColorRGB => {
  const lr = linearize(r),
    lg = linearize(g),
    lb = linearize(b);
  return {
    r: delinearize(clamp(0.29031 * lr + 0.70969 * lg + 0.0 * lb)),
    g: delinearize(clamp(0.29031 * lr + 0.70969 * lg + 0.0 * lb)),
    b: delinearize(clamp(-0.02197 * lr + 0.02197 * lg + 1.0 * lb)),
  };
};

/**
 * Simulate Protanopia (red-green colour blindness, red-weak).
 * Reference: Machado et al. (2009)
 */
const simulateProtanopia = ({ r, g, b }: ColorRGB): ColorRGB => {
  const lr = linearize(r),
    lg = linearize(g),
    lb = linearize(b);
  return {
    r: delinearize(clamp(0.10889 * lr + 0.89111 * lg + 0.0 * lb)),
    g: delinearize(clamp(0.10889 * lr + 0.89111 * lg + 0.0 * lb)),
    b: delinearize(clamp(0.00452 * lr - 0.00452 * lg + 1.0 * lb)),
  };
};

const euclidean = (a: ColorRGB, b: ColorRGB): number =>
  Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);

const isDistinguishableUnderCB = (
  c1: ColorRGB,
  c2: ColorRGB,
  threshold = 0.12,
): boolean =>
  euclidean(simulateDeuteranopia(c1), simulateDeuteranopia(c2)) > threshold ||
  euclidean(simulateProtanopia(c1), simulateProtanopia(c2)) > threshold;

// --- Main Generator ---

export const generateContrastPalettes = (
  input: PaletteInput,
  x: number = 9,
): PaletteOutput => {
  const colorsArray = Object.values(input).find(
    (val): val is string[] => Array.isArray(val) && val.length > 0,
  );
  if (!colorsArray) return {};

  const base = hexToRgb(colorsArray[0]);
  const hsl = rgbToHsl(base);
  const output: PaletteOutput = {};

  // ─────────────────────────────────────────────────────
  // 1. contrastScale
  // ─────────────────────────────────────────────────────
  output.contrastScale = Array.from({ length: x }, (_, i) => {
    const t = i / (x - 1);
    return rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: Math.pow(t, 0.8) }));
  });

  // ─────────────────────────────────────────────────────
  // 2. accessible
  // Alternating FG/BG pairs, all verified WCAG AA (4.5:1).
  // Even = dark foreground, Odd = light background.
  // ─────────────────────────────────────────────────────
  {
    const AA = 4.5;
    const half = Math.ceil(x / 2);
    output.accessible = Array.from({ length: x }, (_, i) => {
      const isEven = i % 2 === 0;
      const l = isEven
        ? lerp(0.05, 0.35, i / 2 / half)
        : lerp(0.88, 0.98, Math.floor(i / 2) / half);
      const candidate = hslToRgb({ h: hsl.h, s: hsl.s * 0.6, l });
      const pair = isEven
        ? hslToRgb({ h: hsl.h, s: hsl.s * 0.1, l: 0.96 })
        : hslToRgb({ h: hsl.h, s: hsl.s * 0.8, l: 0.15 });
      return rgbToHex(adjustToWcagRatio(candidate, pair, AA));
    });
  }

  // ─────────────────────────────────────────────────────
  // 3. wcag
  // Fixed canonical startL tiers per target type:
  //   AA-on-white  → startL 0.20  (dark search)
  //   AAA-on-white → startL 0.10  (darker search)
  //   AA-on-black  → startL 0.80  (light search)
  //   AAA-on-black → startL 0.90  (lighter search)
  // Per-cycle: saturation −30%, lightness ±0.08 shift.
  // ─────────────────────────────────────────────────────
  {
    const targets = [
      { bg: white, ratio: 4.5, startL: 0.2 },
      { bg: white, ratio: 7.0, startL: 0.1 },
      { bg: black, ratio: 4.5, startL: 0.8 },
      { bg: black, ratio: 7.0, startL: 0.9 },
    ];

    output.wcag = Array.from({ length: x }, (_, i) => {
      const { bg, ratio, startL } = targets[i % targets.length];
      const cycle = Math.floor(i / targets.length);
      const sFactor = clamp(1 - cycle * 0.3);
      const lShift = cycle * (startL < 0.5 ? 0.08 : -0.08);
      const candidate = hslToRgb({
        h: hsl.h,
        s: hsl.s * sFactor,
        l: clamp(startL + lShift),
      });
      return rgbToHex(adjustToWcagRatio(candidate, bg, ratio));
    });
  }

  // ─────────────────────────────────────────────────────
  // 4. apca
  // Binary search: lower l → higher |Lc| on white background.
  // Targets |Lc| 30 → 90 across x slots.
  // Reference: Somers, A. APCA-W3 0.0.98G-4g (2022)
  // ─────────────────────────────────────────────────────
  {
    const bgWhite: ColorRGB = { r: 1, g: 1, b: 1 };
    output.apca = Array.from({ length: x }, (_, i) => {
      const t = i / (x - 1);
      const targetLc = lerp(30, 90, t);
      let lo = 0,
        hi = 1.0;

      for (let iter = 0; iter < 48; iter++) {
        const mid = (lo + hi) / 2;
        const candidate = hslToRgb({ h: hsl.h, s: hsl.s, l: mid });
        const lc = Math.abs(apcaContrast(candidate, bgWhite));
        if (lc > targetLc) {
          lo = mid;
        } else {
          hi = mid;
        }
      }

      return rgbToHex(hslToRgb({ h: hsl.h, s: hsl.s, l: (lo + hi) / 2 }));
    });
  }

  // ─────────────────────────────────────────────────────
  // 5. colorBlindSafe
  // ─────────────────────────────────────────────────────
  {
    const safeHues = [202, 27, 56, 180, 291, 343, 120, 240, 30];
    const cbSafe: string[] = [];

    for (let i = 0; i < x; i++) {
      const safeHue = safeHues[i % safeHues.length];
      const blendedHue = lerp(hsl.h, safeHue, 0.65);
      const l = lerp(0.25, 0.75, i / Math.max(x - 1, 1));
      let swatch = hslToRgb({ h: blendedHue, s: clamp(hsl.s, 0.4, 0.85), l });

      if (i > 0 && !isDistinguishableUnderCB(swatch, hexToRgb(cbSafe[i - 1]))) {
        swatch = hslToRgb({ h: blendedHue, s: hsl.s, l: clamp(l + 0.15) });
      }
      cbSafe.push(rgbToHex(swatch));
    }
    output.colorBlindSafe = cbSafe;
  }

  // ─────────────────────────────────────────────────────
  // 6. colorTokenized
  // ─────────────────────────────────────────────────────
  {
    const tokenRoles: TokenRole[] = [
      { name: "background", l: 0.97, s: 0.08 },
      { name: "surface", l: 0.93, s: 0.12 },
      { name: "border", l: 0.8, s: 0.18 },
      { name: "muted", l: 0.65, s: 0.25 },
      { name: "default", l: 0.45, s: hsl.s },
      { name: "emphasis", l: 0.35, s: hsl.s },
      { name: "strong", l: 0.22, s: hsl.s },
      { name: "onColor", l: 0.98, s: 0.05 },
      { name: "error", l: 0.4, s: 0.85, h: 0 },
      { name: "success", l: 0.35, s: 0.6, h: 142 },
    ];

    output.colorTokenized = Array.from({ length: x }, (_, i) => {
      const { h, s, l } = tokenRoles[i % tokenRoles.length];
      return rgbToHex(hslToRgb({ h: h ?? hsl.h, s, l }));
    });
  }

  // ─────────────────────────────────────────────────────
  // 7. highContrast
  // WCAG AAA minimum (7:1), designed for low-vision users.
  //
  // R6 FIX: Uses adjustToWcagRatioFromL (no early-return) so
  // every slot searches from its own unique startL and cannot
  // converge to the same passing value as a neighbour.
  //
  // Dark side (i < darkSlots):
  //   startL spreads 0.05 → 0.28, saturation fades hsl.s → 0
  //   Fading to grey expands contrast ceiling for hues that
  //   can't achieve 7:1 on white at mid-lightness when saturated.
  //   Searches downward from startL (direction: "dark").
  //
  // Light side (i >= darkSlots):
  //   startL spreads 0.65 → 0.98, saturation held at hsl.s * 0.7
  //   Searches upward from startL (direction: "light").
  // ─────────────────────────────────────────────────────
  {
    const AAA = 7.0;
    const darkSlots = Math.ceil(x / 2);
    const lightSlots = x - darkSlots;

    output.highContrast = Array.from({ length: x }, (_, i) => {
      if (i < darkSlots) {
        const t = i / Math.max(darkSlots - 1, 1);
        const startL = lerp(0.05, 0.28, t);
        // Fade saturation to 0 — greyscale always achieves 7:1 at low lightness
        const s = clamp(lerp(hsl.s, 0.0, t), 0.0, 1.0);
        return rgbToHex(
          adjustToWcagRatioFromL(hsl.h, s, startL, white, AAA, "dark"),
        );
      } else {
        const j = i - darkSlots;
        const t = j / Math.max(lightSlots - 1, 1);
        const startL = lerp(0.65, 0.98, t);
        const s = clamp(hsl.s * 0.7, 0.2, 0.8);
        return rgbToHex(
          adjustToWcagRatioFromL(hsl.h, s, startL, black, AAA, "light"),
        );
      }
    });
  }

  return output;
};
