// --- Types & Interfaces ---

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface PaletteInput {
  [key: string]: string[];
}

interface PaletteOutput {
  [key: string]: string[];
}

// --- Utility Functions ---

const hexToHsl = (hex: string): HSL => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
};

const hslToHex = ({ h, s, l }: HSL): string => {
  const l_norm = l / 100;
  const s_norm = s / 100;
  const a = s_norm * Math.min(l_norm, 1 - l_norm);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l_norm - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
};

const shift = (hsl: HSL, degree: number): HSL => ({
  ...hsl,
  h: (hsl.h + degree + 360) % 360,
});

// --- Main Library Function ---

/**
 * PaletteGenerator Library
 * @param input - Object with harmonyPalette array of hex colors
 * @param count - Number of colors to generate for scalable palettes (default: 9)
 * @returns Object with multiple palette variations
 */
export const generateHarmonyPalettes = (
  input: PaletteInput,
  count: number = 9,
): PaletteOutput => {
  // Find the first array of colors, regardless of key name
  const colorsArray = Object.values(input).find(
    (val) => Array.isArray(val) && val.length > 0,
  ) as string[] | undefined;

  if (!colorsArray || colorsArray.length === 0) {
    return {};
  }

  // Use the first color from the array as base
  const baseHex = colorsArray[0];
  const baseHsl = hexToHsl(baseHex);

  // 1. FIXED HARMONIES: These return only their natural number of points
  const fixedTechniques: Record<string, (hsl: HSL) => HSL[]> = {
    analogous: (hsl) => [shift(hsl, -30), hsl, shift(hsl, 30)],
    complementary: (hsl) => [hsl, shift(hsl, 180)],
    splitComplementary: (hsl) => [hsl, shift(hsl, 150), shift(hsl, 210)],
    triadic: (hsl) => [hsl, shift(hsl, 120), shift(hsl, 240)],
    tetradic: (hsl) => [hsl, shift(hsl, 60), shift(hsl, 180), shift(hsl, 240)],
    square: (hsl) => [hsl, shift(hsl, 90), shift(hsl, 180), shift(hsl, 270)],
    accentedAnalogous: (hsl) => [
      shift(hsl, -30),
      hsl,
      shift(hsl, 30),
      shift(hsl, 180),
    ],
    doubleSplitComplementary: (hsl) => [
      hsl,
      shift(hsl, 30),
      shift(hsl, 150),
      shift(hsl, 210),
      shift(hsl, 180),
      shift(hsl, 240),
    ],
    ambiguous: (hsl) => [shift(hsl, 15), shift(hsl, 85), shift(hsl, 145)],
  };

  // 2. SCALABLE HARMONIES: These use the 'count' (x) to generate a range
  const scalableTechniques: Record<string, (hsl: HSL, n: number) => HSL[]> = {
    monochromatic: (hsl, n) => {
      return Array.from({ length: n }, (_, i) => ({
        ...hsl,
        l: Math.max(5, Math.min(95, 15 + (70 / (n - 1 || 1)) * i)),
      }));
    },
    monochromaticTintShade: (hsl, n) => {
      return Array.from({ length: n }, (_, i) => ({
        ...hsl,
        s: Math.max(0, hsl.s - i * 2),
        l: Math.max(5, Math.min(95, 10 + (80 / (n - 1 || 1)) * i)),
      }));
    },
  };

  const output: PaletteOutput = {
    harmonyPalette: colorsArray,
  };

  // Add Fixed Harmonies (Natural length)
  Object.entries(fixedTechniques).forEach(([name, formula]) => {
    output[name] = formula(baseHsl).map(hslToHex);
  });

  // Add Scalable Harmonies (Uses the 'count' x value)
  Object.entries(scalableTechniques).forEach(([name, formula]) => {
    output[name] = formula(baseHsl, count).map(hslToHex);
  });

  return output;
};
