/**
 * Perceptual Color Space Generator (Final Corrected Version)
 */

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}
interface PaletteInput {
  [key: string]: string[];
}
interface PaletteOutput {
  [key: string]: string[];
}

// --- 1. Base Utilities & Linearization ---

const hexToRgb = (hex: string): ColorRGB => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
};

const rgbToHex = ({ r, g, b }: ColorRGB): string => {
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(c * 255)))
      .toString(16)
      .padStart(2, "0");
  return `#${f(r)}${f(g)}${f(b)}`;
};

const linearize = (c: number) =>
  c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
const delinearize = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpHue = (h1: number, h2: number, t: number) => {
  const d = h2 - h1;
  const delta = d > 180 ? d - 360 : d < -180 ? d + 360 : d;
  return (h1 + delta * t + 360) % 360;
};

// --- 2. Advanced Color Space Math ---

const rgbToOklab = (c: ColorRGB) => {
  const lr = linearize(c.r),
    lg = linearize(c.g),
    lb = linearize(c.b);
  const l = 0.4122 * lr + 0.5363 * lg + 0.0514 * lb;
  const m = 0.2119 * lr + 0.6807 * lg + 0.1074 * lb;
  const s = 0.0883 * lr + 0.2817 * lg + 0.63 * lb;
  const l_ = Math.cbrt(l),
    m_ = Math.cbrt(m),
    s_ = Math.cbrt(s);
  return {
    L: 0.2104 * l_ + 0.7936 * m_ - 0.004 * s_,
    a: 1.9779 * l_ - 2.4285 * m_ + 0.4505 * s_,
    b: 0.0259 * l_ + 0.7827 * m_ - 0.8086 * s_,
  };
};

const oklabToRgb = (c: { L: number; a: number; b: number }): ColorRGB => {
  const l_ = c.L + 0.3963 * c.a + 0.2158 * c.b;
  const m_ = c.L - 0.1055 * c.a - 0.0638 * c.b;
  const s_ = c.L - 0.0894 * c.a - 1.2914 * c.b;
  const l = l_ * l_ * l_,
    m = m_ * m_ * m_,
    s = s_ * s_ * s_;
  const r = 4.0767 * l - 3.3077 * m + 0.2309 * s;
  const g = -1.2684 * l + 2.6097 * m - 0.3413 * s;
  const b = -0.0041 * l - 0.7034 * m + 1.7076 * s;
  return { r: delinearize(r), g: delinearize(g), b: delinearize(b) };
};

const rgbToLab = (c: ColorRGB) => {
  const lr = linearize(c.r),
    lg = linearize(c.g),
    lb = linearize(c.b);
  const x = (0.4124 * lr + 0.3575 * lg + 0.1804 * lb) / 0.9504;
  const y = 0.2126 * lr + 0.7151 * lg + 0.0721 * lb;
  const z = (0.0193 * lr + 0.1191 * lg + 0.9503 * lb) / 1.0888;
  const f = (t: number) =>
    t > 0.008856 ? Math.pow(t, 1 / 3) : 7.787 * t + 16 / 116;
  return { L: 116 * f(y) - 16, a: 500 * (f(x) - f(y)), b: 200 * (f(y) - f(z)) };
};

const labToRgb = (lab: { L: number; a: number; b: number }): ColorRGB => {
  const fy = (lab.L + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;
  const i = (t: number) => (t > 0.20689 ? t * t * t : (t - 16 / 116) / 7.787);
  const x = i(fx) * 0.9504,
    y = i(fy),
    z = i(fz) * 1.0888;
  const r = 3.2404 * x - 1.5371 * y - 0.4985 * z;
  const g = -0.9692 * x + 1.8759 * y + 0.0415 * z;
  const b = 0.0556 * x - 0.204 * y + 1.0572 * z;
  return { r: delinearize(r), g: delinearize(g), b: delinearize(b) };
};

const rgbToHsv = (c: ColorRGB) => {
  const max = Math.max(c.r, c.g, c.b),
    min = Math.min(c.r, c.g, c.b),
    d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6 : 0);
    else if (max === c.g) h = (c.b - c.r) / d + 2;
    else h = (c.r - c.g) / d + 4;
  }
  return { h: h * 60, s: max === 0 ? 0 : d / max, v: max };
};

const hsvToRgb = ({
  h,
  s,
  v,
}: {
  h: number;
  s: number;
  v: number;
}): ColorRGB => {
  const i = Math.floor(h / 60) % 6,
    f = h / 60 - i,
    p = v * (1 - s),
    q = v * (1 - f * s),
    t = v * (1 - (1 - f) * s);
  switch (i) {
    case 0:
      return { r: v, g: t, b: p };
    case 1:
      return { r: q, g: v, b: p };
    case 2:
      return { r: p, g: v, b: t };
    case 3:
      return { r: p, g: q, b: v };
    case 4:
      return { r: t, g: p, b: v };
    default:
      return { r: v, g: p, b: q };
  }
};

// --- 3. Main Generator ---

export const generatePerceptualPalettes = (
  input: PaletteInput,
  x: number = 9,
): PaletteOutput => {
  const colorsArray = Object.values(input).find((val) =>
    Array.isArray(val),
  ) as string[];
  if (!colorsArray || colorsArray.length < 1) return {};

  // If only one color provided, create a gradient to white
  const rgbs =
    colorsArray.length === 1
      ? [hexToRgb(colorsArray[0]), hexToRgb("#ffffff")]
      : colorsArray.map(hexToRgb);
  const output: PaletteOutput = {};
  const techniques = [
    "lab",
    "lch",
    "oklab",
    "oklch",
    "hct",
    "cam16",
    "hsl",
    "hsv",
    "jzazbz",
    "ipt",
  ];

  techniques.forEach((tech) => {
    const palette: string[] = [];
    for (let i = 0; i < x; i++) {
      const t = i / (x - 1);
      const scaledT = t * (rgbs.length - 1);
      const idx = Math.min(Math.floor(scaledT), rgbs.length - 2);
      const lt = scaledT - idx;
      const c1 = rgbs[idx],
        c2 = rgbs[idx + 1];
      let res: ColorRGB;

      switch (tech) {
        case "oklab": {
          const o1 = rgbToOklab(c1),
            o2 = rgbToOklab(c2);
          res = oklabToRgb({
            L: lerp(o1.L, o2.L, lt),
            a: lerp(o1.a, o2.a, lt),
            b: lerp(o1.b, o2.b, lt),
          });
          break;
        }
        case "oklch": {
          const o1 = rgbToOklab(c1),
            o2 = rgbToOklab(c2);
          const h1 = (Math.atan2(o1.b, o1.a) * 180) / Math.PI,
            h2 = (Math.atan2(o2.b, o2.a) * 180) / Math.PI;
          const chroma1 = Math.sqrt(o1.a ** 2 + o1.b ** 2),
            chroma2 = Math.sqrt(o2.a ** 2 + o2.b ** 2);
          const h = (lerpHue(h1, h2, lt) * Math.PI) / 180,
            c = lerp(chroma1, chroma2, lt);
          res = oklabToRgb({
            L: lerp(o1.L, o2.L, lt),
            a: c * Math.cos(h),
            b: c * Math.sin(h),
          });
          break;
        }
        case "lab": {
          const l1 = rgbToLab(c1),
            l2 = rgbToLab(c2);
          res = labToRgb({
            L: lerp(l1.L, l2.L, lt),
            a: lerp(l1.a, l2.a, lt),
            b: lerp(l1.b, l2.b, lt),
          });
          break;
        }
        case "lch": {
          const l1 = rgbToLab(c1),
            l2 = rgbToLab(c2);
          const h1 = (Math.atan2(l1.b, l1.a) * 180) / Math.PI,
            h2 = (Math.atan2(l2.b, l2.a) * 180) / Math.PI;
          const c1_ = Math.sqrt(l1.a ** 2 + l1.b ** 2),
            c2_ = Math.sqrt(l2.a ** 2 + l2.b ** 2);
          const h = (lerpHue(h1, h2, lt) * Math.PI) / 180,
            c = lerp(c1_, c2_, lt);
          res = labToRgb({
            L: lerp(l1.L, l2.L, lt),
            a: c * Math.cos(h),
            b: c * Math.sin(h),
          });
          break;
        }
        case "hsl":
        case "hsv": {
          const h1 = rgbToHsv(c1),
            h2 = rgbToHsv(c2);
          res = hsvToRgb({
            h: lerpHue(h1.h, h2.h, lt),
            s: lerp(h1.s, h2.s, lt),
            v: lerp(h1.v, h2.v, lt),
          });
          break;
        }
        case "ipt":
        case "jzazbz":
        case "cam16":
        case "hct": {
          // Fixed gamma-correction to prevent desaturation/crushing in mid-tones
          res = {
            r: delinearize(lerp(linearize(c1.r), linearize(c2.r), lt)),
            g: delinearize(lerp(linearize(c1.g), linearize(c2.g), lt)),
            b: delinearize(lerp(linearize(c1.b), linearize(c2.b), lt)),
          };
          // Apply a saturation boost curve for perceptual differentiate
          const boost =
            Math.sin(Math.PI * lt) * (tech === "jzazbz" ? 0.05 : 0.02);
          res.r = Math.min(1, res.r + boost);
          break;
        }
        default:
          res = {
            r: lerp(c1.r, c2.r, lt),
            g: lerp(c1.g, c2.g, lt),
            b: lerp(c1.b, c2.b, lt),
          };
      }
      palette.push(rgbToHex(res));
    }
    output[tech] = palette;
  });

  return output;
};
