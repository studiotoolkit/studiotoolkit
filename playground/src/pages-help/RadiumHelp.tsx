/**
 * How Radium Colors Are Generated
 *
 * ═══════════════════════════════════════════════════════════════════
 * ARTICLE STRUCTURE
 * ═══════════════════════════════════════════════════════════════════
 *
 *  1. Hero — title, subtitle, animated swatch strip
 *  2. What is Radium? — overview + output shape
 *  3. The OKLCH Color Space — why perceptual math matters
 *  4. Semantic Token Architecture — the 5 keys and their roles
 *  5. Step-by-step generation — per-key algorithm walkthrough
 *     a. neutralLight
 *     b. neutralDark
 *     c. mainColor / mainColorShade
 *     d. accentColor
 *  6. Gamut safety — the sRGB binary-search clamp
 *  7. Multi-swatch palettes — ramps, harmonies, evenly-spaced
 *  8. Live demo — interactive OKLCH visualizer
 */

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../ThemeContext";
import "./RadiumHelp.css";

// ─────────────────────────────────────────────────────────────────────
// Inline color math (zero deps) — mirrors RadiumGenerator.ts
// ─────────────────────────────────────────────────────────────────────

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

const linearize = (c: number) =>
  c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
const delinearize = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

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
const oklabToRgb = (lab: Lab): RGB => {
  const { r, g, b } = oklabToRgbRaw(lab);
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b) };
};
const hexToRgb = (hex: string): RGB => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
});
const rgbToHex = ({ r, g, b }: RGB) =>
  "#" +
  [r, g, b]
    .map((c) =>
      Math.round(clamp01(c) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");
const hexToLch = (hex: string): LCH => {
  const lab = rgbToOklab(hexToRgb(hex));
  return {
    L: lab.L,
    C: Math.sqrt(lab.a ** 2 + lab.b ** 2),
    H: ((Math.atan2(lab.b, lab.a) * 180) / Math.PI + 360) % 360,
  };
};
const lchToHexSafe = (lch: LCH): string => {
  const inGamut = (rgb: RGB) =>
    rgb.r >= -0.001 &&
    rgb.r <= 1.001 &&
    rgb.g >= -0.001 &&
    rgb.g <= 1.001 &&
    rgb.b >= -0.001 &&
    rgb.b <= 1.001;
  const toLab = (c: number) => {
    const rad = (lch.H * Math.PI) / 180;
    return { L: lch.L, a: c * Math.cos(rad), b: c * Math.sin(rad) };
  };
  if (inGamut(oklabToRgbRaw(toLab(lch.C))))
    return rgbToHex(oklabToRgb(toLab(lch.C)));
  let lo = 0,
    hi = lch.C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklabToRgbRaw(toLab(mid)))) lo = mid;
    else hi = mid;
  }
  return rgbToHex(oklabToRgb(toLab(lo)));
};
const wcagY = ({ r, g, b }: RGB) =>
  0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
const contrastRatio = (a: string, b: string) => {
  const ya = wcagY(hexToRgb(a)),
    yb = wcagY(hexToRgb(b));
  return (Math.max(ya, yb) + 0.05) / (Math.min(ya, yb) + 0.05);
};
const textOn = (bg: string) =>
  contrastRatio(bg, "#ffffff") >= contrastRatio(bg, "#111111")
    ? "#ffffff"
    : "#111111";

// ─────────────────────────────────────────────────────────────────────
// Demo helper — apply semantic transforms to a hex
// ─────────────────────────────────────────────────────────────────────

type SemanticKey =
  | "neutralLight"
  | "neutralDark"
  | "mainColor"
  | "mainColorShade"
  | "accentColor";

const applySemanticTransform = (hex: string, key: SemanticKey): string => {
  const lch = hexToLch(hex);
  switch (key) {
    case "neutralLight":
      return lchToHexSafe({
        ...lch,
        L: 0.93,
        C: Math.min(lch.C * 0.08, 0.015),
      });
    case "neutralDark":
      return lchToHexSafe({ ...lch, L: 0.1, C: Math.min(lch.C * 0.08, 0.015) });
    case "mainColor":
      return lchToHexSafe({ ...lch, L: 0.52, C: Math.max(lch.C, 0.22) });
    case "mainColorShade":
      return lchToHexSafe({ ...lch, L: 0.3, C: lch.C });
    case "accentColor":
      return lchToHexSafe({ ...lch, L: 0.62, C: Math.max(lch.C, 0.22) });
  }
};

// ─────────────────────────────────────────────────────────────────────
// Static demo inputs used throughout the article
// ─────────────────────────────────────────────────────────────────────

const DEMO_INPUT: Record<SemanticKey, string> = {
  neutralLight: "#88ff00",
  neutralDark: "#0e1626",
  mainColor: "#0008ff",
  mainColorShade: "#ff7700",
  accentColor: "#f87f01",
};

const DEMO_OUTPUT: Record<SemanticKey, string> = Object.fromEntries(
  (Object.entries(DEMO_INPUT) as [SemanticKey, string][]).map(([k, v]) => [
    k,
    applySemanticTransform(v, k),
  ]),
) as Record<SemanticKey, string>;

// ─────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────

export function Swatch({
  hex,
  label,
  size = 40,
}: {
  hex: string;
  label?: string;
  size?: number;
}) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div
      className="rad-swatch"
      style={{ "--swatch-size": `${size}px` } as React.CSSProperties}
      onClick={copy}
      title={`${hex}${label ? ` — ${label}` : ""}`}
    >
      <div
        className="rad-swatch-block"
        style={{ background: hex, width: size, height: size }}
      />
      {label && (
        <span
          className="rad-swatch-label"
          style={{ color: "inherit", opacity: 0.6, fontSize: 10 }}
        >
          {copied ? "copied!" : label}
        </span>
      )}
    </div>
  );
}

function CodeBlock({ code, lang = "ts" }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rad-code-block">
      <button
        className="rad-code-copy"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
      >
        {copied ? "✓" : "copy"}
      </button>
      <pre>
        <code className={`lang-${lang}`}>{code}</code>
      </pre>
    </div>
  );
}

function SectionHeader({
  number,
  title,
  accent,
}: {
  number: string;
  title: string;
  accent: string;
}) {
  return (
    <div className="rad-section-header">
      <span className="rad-section-num" style={{ color: accent }}>
        {number}
      </span>
      <h2 className="rad-section-title">{title}</h2>
    </div>
  );
}

function TransformRow({
  inputHex,
  outputHex,
  label,
  targetL,
  targetC,
}: {
  inputHex: string;
  outputHex: string;
  label: string;
  targetL: string;
  targetC: string;
}) {
  const iLch = hexToLch(inputHex);
  const oLch = hexToLch(outputHex);
  return (
    <div className="rad-transform-row">
      <div className="rad-transform-before">
        <div
          className="rad-transform-swatch"
          style={{ background: inputHex }}
        />
        <div className="rad-transform-info">
          <code>{inputHex}</code>
          <span>
            L={iLch.L.toFixed(3)} C={iLch.C.toFixed(3)}
          </span>
        </div>
      </div>
      <div className="rad-transform-arrow">→</div>
      <div className="rad-transform-after">
        <div
          className="rad-transform-swatch"
          style={{ background: outputHex }}
        />
        <div className="rad-transform-info">
          <code>{outputHex}</code>
          <span>
            L={oLch.L.toFixed(3)} C={oLch.C.toFixed(3)}
          </span>
        </div>
      </div>
      <div className="rad-transform-rule">
        <strong>{label}</strong>
        <span>
          L → {targetL} · C → {targetC}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Live OKLCH Explorer
// ─────────────────────────────────────────────────────────────────────

function OklchExplorer({ th }: { th: Record<string, string> }) {
  const [L, setL] = useState(0.62);
  const [C, setC] = useState(0.18);
  const [H, setH] = useState(250);

  const hex = lchToHexSafe({ L, C, H });
  const rawHex = rgbToHex(
    oklabToRgb({
      L,
      a: C * Math.cos((H * Math.PI) / 180),
      b: C * Math.sin((H * Math.PI) / 180),
    }),
  );
  const clipped = hex !== rawHex;
  const txt = textOn(hex);

  const slider = (
    label: string,
    val: number,
    min: number,
    max: number,
    step: number,
    set: (v: number) => void,
    color: string,
  ) => (
    <div className="rad-slider-row">
      <span className="rad-slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={(e) => set(parseFloat(e.target.value))}
        style={{ "--slider-color": color } as React.CSSProperties}
        className="rad-slider"
      />
      <span className="rad-slider-val">{val.toFixed(3)}</span>
    </div>
  );

  return (
    <div
      className="rad-explorer"
      style={{ background: th.panelBg, border: `1px solid ${th.border}` }}
    >
      <div className="rad-explorer-preview" style={{ background: hex }}>
        <span
          style={{
            color: txt,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          {hex}
        </span>
        {clipped && (
          <span
            style={{
              color: txt,
              fontSize: 10,
              opacity: 0.7,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            · chroma clamped for sRGB
          </span>
        )}
      </div>
      <div className="rad-explorer-controls">
        {slider("L — Lightness", L, 0, 1, 0.001, setL, "#a78bfa")}
        {slider("C — Chroma", C, 0, 0.4, 0.001, setC, "#34d399")}
        {slider("H — Hue °", H, 0, 360, 1, setH, "#fb923c")}
        <div className="rad-explorer-lch-display" style={{ color: th.body }}>
          <span>
            OKLCH({L.toFixed(3)}, {C.toFixed(3)}, {H.toFixed(0)}°)
          </span>
          <span style={{ opacity: 0.5, fontSize: 10 }}>
            wcag contrast on white: {contrastRatio(hex, "#ffffff").toFixed(1)}:1
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Gamut diagram — shows sRGB boundary for the current hue slice
// ─────────────────────────────────────────────────────────────────────

function GamutSlice({ H, th }: { H: number; th: Record<string, string> }) {
  const W = 280,
    HT = 180;
  const pts: string[] = [];
  const fills: { x: number; y: number; hex: string }[] = [];

  for (let li = 0; li <= 100; li += 2) {
    const L = li / 100;
    let maxC = 0;
    let lo = 0,
      hi = 0.45;
    const inG = (C: number) => {
      const rad = (H * Math.PI) / 180;
      const rgb = oklabToRgbRaw({
        L,
        a: C * Math.cos(rad),
        b: C * Math.sin(rad),
      });
      return (
        rgb.r >= -0.001 &&
        rgb.r <= 1.001 &&
        rgb.g >= -0.001 &&
        rgb.g <= 1.001 &&
        rgb.b >= -0.001 &&
        rgb.b <= 1.001
      );
    };
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inG(mid)) lo = mid;
      else hi = mid;
    }
    maxC = lo;
    const x = (maxC / 0.45) * W;
    const y = HT - L * HT;
    pts.push(`${x},${y}`);
  }

  // fill sample colors along the boundary
  for (let li = 5; li <= 95; li += 10) {
    const L = li / 100;
    let lo = 0,
      hi = 0.45;
    const inG = (C: number) => {
      const rad = (H * Math.PI) / 180;
      const rgb = oklabToRgbRaw({
        L,
        a: C * Math.cos(rad),
        b: C * Math.sin(rad),
      });
      return (
        rgb.r >= -0.001 &&
        rgb.r <= 1.001 &&
        rgb.g >= -0.001 &&
        rgb.g <= 1.001 &&
        rgb.b >= -0.001 &&
        rgb.b <= 1.001
      );
    };
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inG(mid)) lo = mid;
      else hi = mid;
    }
    const x = (lo / 0.45) * W;
    const y = HT - L * HT;
    fills.push({ x, y, hex: lchToHexSafe({ L, C: lo * 0.85, H }) });
  }

  return (
    <div
      className="rad-gamut-slice"
      style={{ background: th.panelBg, border: `1px solid ${th.border}` }}
    >
      <div className="rad-gamut-title" style={{ color: th.h2 }}>
        sRGB gamut at H={H.toFixed(0)}°
      </div>
      <svg width={W} height={HT} style={{ display: "block" }}>
        {/* Background */}
        <rect width={W} height={HT} fill={th.panelBg} />
        {/* Grid lines */}
        {[0.2, 0.4, 0.6, 0.8].map((l) => (
          <line
            key={l}
            x1={0}
            y1={HT - l * HT}
            x2={W}
            y2={HT - l * HT}
            stroke={th.border}
            strokeWidth={0.5}
          />
        ))}
        {/* Gamut boundary fill */}
        <polygon
          points={`0,${HT} ${pts.join(" ")} 0,0`}
          fill="rgba(99,102,241,0.08)"
          stroke="rgba(99,102,241,0.5)"
          strokeWidth={1.5}
        />
        {/* Color dots along boundary */}
        {fills.map(({ x, y, hex }, i) => (
          <circle key={i} cx={x * 0.85} cy={y} r={5} fill={hex} />
        ))}
        {/* Axis labels */}
        <text x={4} y={12} fill={th.h2} fontSize={8} fontFamily="monospace">
          L=1.0
        </text>
        <text x={4} y={HT - 4} fill={th.h2} fontSize={8} fontFamily="monospace">
          L=0.0
        </text>
        <text
          x={W - 30}
          y={HT - 4}
          fill={th.h2}
          fontSize={8}
          fontFamily="monospace"
        >
          C=0.45
        </text>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────

export default function RadiumColorsArticle() {
  const { isDark } = useTheme();
  const [gamutH, setGamutH] = useState(49);

  const th = {
    pageBg: isDark ? "#0d0f14" : "#f0f4f8",
    pageText: isDark ? "#dde3ef" : "#1e293b",
    h1: isDark ? "#f1f5f9" : "#0f172a",
    h2: isDark ? "#94a3b8" : "#64748b",
    body: isDark ? "#cbd5e1" : "#334155",
    label: isDark ? "#f1f5f9" : "#0f172a",
    desc: isDark ? "#94a3b8" : "#64748b",
    faint: isDark ? "#334155" : "#94a3b8",
    panelBg: isDark ? "#161b27" : "#ffffff",
    border: isDark ? "#2a3347" : "#e2e8f0",
    codeBg: isDark ? "#0f1623" : "#f0f4ff",
    codeText: isDark ? "#a5b4fc" : "#3730a3",
    highlight: isDark ? "#1e2a42" : "#eff6ff",
    h2Border: isDark ? "#1e293b" : "#e2e8f0",
  };

  const accent1 = "#a78bfa"; // purple
  const accent2 = "#34d399"; // green
  const accent3 = "#fb923c"; // orange
  const accent4 = "#38bdf8"; // sky

  const roles: SemanticKey[] = [
    "neutralLight",
    "neutralDark",
    "mainColor",
    "mainColorShade",
    "accentColor",
  ];

  return (
    <div
      className="rad-page"
      style={{ background: th.pageBg, color: th.pageText }}
    >
      <Header />

      {/* ─── Hero ──────────────────────────────────────── */}
      <div className="rad-hero">
        <div className="rad-hero-eyebrow">Color Science</div>
        <h1 className="rad-hero-title">
          How Radium
          <br />
          Colors Are Generated
        </h1>
        <p className="rad-hero-sub">
          A deep-dive into the OKLCH perceptual color transforms, gamut-safe
          clamping, and semantic token architecture that powers every Radium
          palette output.
        </p>

        {/* Animated swatch strip */}
        <div className="rad-hero-swatches">
          {roles.map((key) => (
            <div key={key} className="rad-hero-swatch-pair">
              <div
                className="rad-hero-swatch"
                style={{ background: DEMO_INPUT[key] }}
                title={`Input: ${DEMO_INPUT[key]}`}
              />
              <div className="rad-hero-arrow">→</div>
              <div
                className="rad-hero-swatch"
                style={{ background: DEMO_OUTPUT[key] }}
                title={`Output: ${DEMO_OUTPUT[key]}`}
              />
              <span className="rad-hero-swatch-label">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Content ──────────────────────────────────── */}
      <div className="rad-content" style={{ color: th.pageText }}>
        {/* ── §1 — What is Radium? ───────────────────── */}
        <section className="rad-section">
          <SectionHeader number="01" title="What Is Radium?" accent={accent1} />
          <p style={{ color: th.body }}>
            Radium is a color palette engine that takes arbitrary brand hex
            values as input and returns semantically-correct design token colors
            as output — with zero external dependencies. Given a bag of hex
            strings, it produces a structured{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              RadiumOutput
            </code>{" "}
            object where every key is a precisely-calibrated color, not just the
            input echoed back.
          </p>
          <p style={{ color: th.body, marginTop: 12 }}>
            The generator's input and output shapes are symmetric: same keys,
            same array lengths. A single-swatch key like{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              mainColor: ["#ff0000"]
            </code>{" "}
            is transformed into its semantically correct equivalent; a 16-swatch
            key like{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              monochromatic: Array(16).fill("#aaa")
            </code>{" "}
            expands into a full dark-to-light ramp.
          </p>
          <CodeBlock
            lang="ts"
            code={`// Input — arbitrary hex values
const input: RadiumInput = {
  neutralLight:   ["#88ff00"],
  neutralDark:    ["#0e1626"],
  mainColor:      ["#0008ff"],
  mainColorShade: ["#ff7700"],
  accentColor:    ["#f87f01"],
};

// Output — semantically transformed
const output = generateRadiumColors(input);
// {
//   neutralLight:   ["#e4eae0"],  // near-white, hue ghost only
//   neutralDark:    ["#030304"],  // near-black, hue ghost only
//   mainColor:      ["#104cff"],  // vivid mid-tone
//   mainColorShade: ["#4c1f00"],  // dark shade, hue preserved exactly
//   accentColor:    ["#cb6700"],  // warm pop, vivid
// }`}
          />
        </section>

        {/* ── §2 — OKLCH ────────────────────────────────── */}
        <section className="rad-section">
          <SectionHeader number="02" title="Why OKLCH?" accent={accent2} />
          <p style={{ color: th.body }}>
            Most color transforms in design tools operate in raw RGB or HSL.
            Both spaces have a fundamental problem:{" "}
            <em>perceptual non-uniformity</em>. Moving 10 points in HSL
            lightness produces a barely-visible change near white and a dramatic
            change near black. A blue and a yellow at the same HSL lightness
            look nothing alike in perceived brightness.
          </p>
          <p style={{ color: th.body, marginTop: 12 }}>
            OKLCH is a perceptually-uniform cylindrical color space designed by
            Björn Ottosson (2020). It has three axes:
          </p>

          <div className="rad-axis-cards">
            {[
              {
                axis: "L",
                name: "Lightness",
                range: "0 → 1",
                desc: "Perceptually uniform — Δ0.1 looks the same jump at any lightness level. Black is 0, white is 1.",
                color: accent1,
              },
              {
                axis: "C",
                name: "Chroma",
                range: "0 → ~0.4",
                desc: "Saturation / vividness. 0 is achromatic grey; higher values are more saturated. sRGB caps around 0.32 for most hues.",
                color: accent2,
              },
              {
                axis: "H",
                name: "Hue",
                range: "0° → 360°",
                desc: "Angle on the color wheel. Red ≈ 29°, yellow ≈ 110°, green ≈ 142°, cyan ≈ 195°, blue ≈ 265°, magenta ≈ 330°.",
                color: accent3,
              },
            ].map(({ axis, name, range, desc, color }) => (
              <div
                key={axis}
                className="rad-axis-card"
                style={{
                  background: th.panelBg,
                  border: `1px solid ${th.border}`,
                }}
              >
                <div className="rad-axis-letter" style={{ color }}>
                  {axis}
                </div>
                <div className="rad-axis-name" style={{ color: th.label }}>
                  {name}
                </div>
                <div className="rad-axis-range" style={{ color }}>
                  {range}
                </div>
                <p
                  style={{
                    color: th.desc,
                    fontSize: 12,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>

          <p style={{ color: th.body, marginTop: 20 }}>
            Radium targets specific{" "}
            <strong style={{ color: th.label }}>absolute L and C values</strong>{" "}
            per semantic token. Because L is perceptually uniform,{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              L=0.93
            </code>{" "}
            is always near-white regardless of the input, and{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              L=0.30
            </code>{" "}
            is always a mid-dark. Transforms are strong and predictable because
            they set the destination, not nudge from the source.
          </p>

          {/* Live explorer */}
          <div style={{ marginTop: 24 }}>
            <div className="rad-callout-label" style={{ color: th.faint }}>
              Interactive explorer
            </div>
            <OklchExplorer th={th} />
          </div>
        </section>

        {/* ── §3 — Token architecture ───────────────────── */}
        <section className="rad-section">
          <SectionHeader
            number="03"
            title="Semantic Token Architecture"
            accent={accent3}
          />
          <p style={{ color: th.body }}>
            Radium recognises five semantic roles from palette key names. Each
            role has a specific <em>L and C target</em> it enforces, while
            always preserving the input's hue angle H. The key is matched by
            normalising it to lowercase with all non-alpha characters stripped,
            then checking against a priority-ordered pattern table.
          </p>

          <div className="rad-token-table-wrap">
            <table className="rad-token-table" style={{ color: th.body }}>
              <thead>
                <tr>
                  <th style={{ color: th.h2 }}>Key pattern</th>
                  <th style={{ color: th.h2 }}>Target L</th>
                  <th style={{ color: th.h2 }}>Target C</th>
                  <th style={{ color: th.h2 }}>Role</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    pattern: "neutralLight / neutral…light",
                    L: "0.93",
                    C: "min(C×0.08, 0.015)",
                    role: "Near-white with ghost tint",
                  },
                  {
                    pattern: "neutralDark / neutral…dark",
                    L: "0.10",
                    C: "min(C×0.08, 0.015)",
                    role: "Near-black with ghost tint",
                  },
                  {
                    pattern: "neutral (generic)",
                    L: "0.55",
                    C: "min(C×0.06, 0.012)",
                    role: "Mid-grey, achromatic",
                  },
                  {
                    pattern: "*shade / *colorshade",
                    L: "0.30",
                    C: "preserved (gamut-safe)",
                    role: "Dark vivid shade",
                  },
                  {
                    pattern: "*dark",
                    L: "0.22",
                    C: "preserved (gamut-safe)",
                    role: "Deeper dark",
                  },
                  {
                    pattern: "*light / *tint",
                    L: "0.88",
                    C: "C × 0.50",
                    role: "Soft tint",
                  },
                  {
                    pattern: "accent*",
                    L: "0.62",
                    C: "max(C, 0.22)",
                    role: "Vivid mid-tone pop",
                  },
                  {
                    pattern: "main* / primary* / brand*",
                    L: "0.52",
                    C: "max(C, 0.22)",
                    role: "Core brand color",
                  },
                  {
                    pattern: "background* / bg*",
                    L: "0.97",
                    C: "min(C×0.08, 0.012)",
                    role: "Almost-white canvas",
                  },
                  {
                    pattern: "surface*",
                    L: "0.91",
                    C: "min(C×0.18, 0.025)",
                    role: "Elevated surface",
                  },
                  {
                    pattern: "foreground* / text* / on*",
                    L: "0.18",
                    C: "min(C×0.12, 0.020)",
                    role: "Dark readable text",
                  },
                ].map(({ pattern, L, C, role }, i) => (
                  <tr
                    key={i}
                    style={{
                      background: i % 2 === 0 ? th.panelBg : "transparent",
                    }}
                  >
                    <td>
                      <code
                        style={{
                          background: th.codeBg,
                          color: th.codeText,
                          padding: "1px 5px",
                          borderRadius: 3,
                          fontSize: 11,
                        }}
                      >
                        {pattern}
                      </code>
                    </td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{L}</td>
                    <td style={{ fontSize: 12 }}>{C}</td>
                    <td style={{ color: th.desc, fontSize: 12 }}>{role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ color: th.body, marginTop: 16, fontSize: 13 }}>
            Resolution is first-match in order — more specific patterns appear
            before generic ones. A key named{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              neutralLight
            </code>{" "}
            matches the first row, not the neutral-generic or *light row.
          </p>
        </section>

        {/* ── §4 — Step-by-step ─────────────────────────── */}
        <section className="rad-section">
          <SectionHeader
            number="04"
            title="Step-by-Step Generation"
            accent={accent4}
          />

          {/* 4a neutralLight */}
          <div className="rad-step">
            <div
              className="rad-step-num"
              style={{ background: accent1 + "20", color: accent1 }}
            >
              4a
            </div>
            <div className="rad-step-body">
              <h3 style={{ color: th.label, margin: "0 0 8px" }}>
                neutralLight — near-white tint
              </h3>
              <p style={{ color: th.body }}>
                The goal is a page background: very light, almost achromatic,
                but carrying a whisper of the input hue. L is set to{" "}
                <strong>0.93</strong> (perceptually near-white) and chroma is
                aggressively drained to{" "}
                <code
                  style={{
                    background: th.codeBg,
                    color: th.codeText,
                    padding: "1px 4px",
                    borderRadius: 3,
                  }}
                >
                  min(C × 0.08, 0.015)
                </code>
                . At 8% of the original chroma, a vivid lime green (#88ff00,
                C=0.293) becomes a barely-tinted off-white (#e4eae0, C=0.015) —
                still green, just whispered.
              </p>
              <TransformRow
                inputHex={DEMO_INPUT.neutralLight}
                outputHex={DEMO_OUTPUT.neutralLight}
                label="neutralLight"
                targetL="0.93 (fixed)"
                targetC="min(C×0.08, 0.015)"
              />
            </div>
          </div>

          {/* 4b neutralDark */}
          <div className="rad-step">
            <div
              className="rad-step-num"
              style={{ background: accent2 + "20", color: accent2 }}
            >
              4b
            </div>
            <div className="rad-step-body">
              <h3 style={{ color: th.label, margin: "0 0 8px" }}>
                neutralDark — near-black shade
              </h3>
              <p style={{ color: th.body }}>
                The structural skeleton — text, borders, and dark surfaces.
                Symmetrical to neutralLight: L is forced to{" "}
                <strong>0.10</strong> and chroma is drained to{" "}
                <code
                  style={{
                    background: th.codeBg,
                    color: th.codeText,
                    padding: "1px 4px",
                    borderRadius: 3,
                  }}
                >
                  min(C × 0.08, 0.015)
                </code>
                . A navy-blue input (#0e1626, H=227°) becomes a near-black with
                a faint blue ghost tint (#030304). The hue angle is preserved
                exactly; only L and C change.
              </p>
              <TransformRow
                inputHex={DEMO_INPUT.neutralDark}
                outputHex={DEMO_OUTPUT.neutralDark}
                label="neutralDark"
                targetL="0.10 (fixed)"
                targetC="min(C×0.08, 0.015)"
              />
            </div>
          </div>

          {/* 4c mainColor */}
          <div className="rad-step">
            <div
              className="rad-step-num"
              style={{ background: accent3 + "20", color: accent3 }}
            >
              4c
            </div>
            <div className="rad-step-body">
              <h3 style={{ color: th.label, margin: "0 0 8px" }}>
                mainColor — vivid brand mid-tone
              </h3>
              <p style={{ color: th.body }}>
                The core 30% brand color. L is set to <strong>0.52</strong> —
                the perceptual mid-tone that gives maximum contrast range
                (readable on both light and dark backgrounds). Chroma is floored
                at <strong>0.22</strong> to guarantee vividness:{" "}
                <code
                  style={{
                    background: th.codeBg,
                    color: th.codeText,
                    padding: "1px 4px",
                    borderRadius: 3,
                  }}
                >
                  max(C, 0.22)
                </code>
                . If the input already has higher chroma, it's preserved. A
                near-black indigo (#0008ff, C=0.311) becomes a vivid accessible
                blue (#104cff).
              </p>
              <TransformRow
                inputHex={DEMO_INPUT.mainColor}
                outputHex={DEMO_OUTPUT.mainColor}
                label="mainColor"
                targetL="0.52 (fixed)"
                targetC="max(C, 0.22)"
              />
            </div>
          </div>

          {/* 4d mainColorShade */}
          <div className="rad-step">
            <div
              className="rad-step-num"
              style={{ background: accent1 + "20", color: accent1 }}
            >
              4d
            </div>
            <div className="rad-step-body">
              <h3 style={{ color: th.label, margin: "0 0 8px" }}>
                mainColorShade — dark twin with exact hue
              </h3>
              <p style={{ color: th.body }}>
                The shade is for hover states, gradient depth, and dark brand
                moments. L drops to <strong>0.30</strong> and chroma is left
                exactly as the input provides — no floor, no ceiling. This is
                the token most prone to gamut clipping: warm hues like orange
                (H≈49°) have very little sRGB headroom at low lightness. Without
                the gamut-safety step, #ff7700 would shift to red.
              </p>
              <TransformRow
                inputHex={DEMO_INPUT.mainColorShade}
                outputHex={DEMO_OUTPUT.mainColorShade}
                label="mainColorShade"
                targetL="0.30 (fixed)"
                targetC="preserved input C (gamut-safe)"
              />
            </div>
          </div>

          {/* 4e accentColor */}
          <div className="rad-step">
            <div
              className="rad-step-num"
              style={{ background: accent2 + "20", color: accent2 }}
            >
              4e
            </div>
            <div className="rad-step-body">
              <h3 style={{ color: th.label, margin: "0 0 8px" }}>
                accentColor — vivid 10% pop
              </h3>
              <p style={{ color: th.body }}>
                CTAs, badges, price highlights — the 10% surprise. L lands at{" "}
                <strong>0.62</strong>, slightly brighter than mainColor for
                extra pop, and the C floor of <strong>0.22</strong> guarantees
                vividness. An orange (#f87f01, C=0.180) gets its chroma boosted
                to 0.22 minimum, landing at a warm caramel (#cb6700).
              </p>
              <TransformRow
                inputHex={DEMO_INPUT.accentColor}
                outputHex={DEMO_OUTPUT.accentColor}
                label="accentColor"
                targetL="0.62 (fixed)"
                targetC="max(C, 0.22)"
              />
            </div>
          </div>
        </section>

        {/* ── §5 — Gamut safety ─────────────────────────── */}
        <section className="rad-section">
          <SectionHeader
            number="05"
            title="Gamut Safety — The Binary-Search Clamp"
            accent={accent1}
          />

          <p style={{ color: th.body }}>
            Every OKLCH → sRGB conversion in Radium goes through{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              lchToHexSafe
            </code>{" "}
            instead of the naive{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              lchToHex
            </code>
            . The difference is critical for warm hues.
          </p>

          <div
            className="rad-callout"
            style={{
              background: th.highlight,
              border: `1px solid ${accent1}30`,
            }}
          >
            <div className="rad-callout-label" style={{ color: accent1 }}>
              The problem
            </div>
            <p
              style={{
                color: th.body,
                margin: 0,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              When an OKLCH color lies outside sRGB, the naive approach clamps
              each R, G, B channel independently to [0, 1]. For orange at H≈49°
              forced to L=0.30, the green and blue channels go negative.
              Clamping them to 0 produces a pure-red result — the hue drifts by
              20° without any indication this happened.
            </p>
          </div>

          <div
            className="rad-callout"
            style={{
              background: th.highlight,
              border: `1px solid ${accent2}30`,
              marginTop: 12,
            }}
          >
            <div className="rad-callout-label" style={{ color: accent2 }}>
              The fix — chroma binary search
            </div>
            <p
              style={{
                color: th.body,
                margin: 0,
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              Instead of clamping channels, we binary-search the chroma axis:
              find the maximum C value at the target (L, H) that still fits
              inside sRGB. The search uses the <em>unclipped</em> RGB values — a
              critical implementation detail. The clamped conversion always
              returns channels in [0,1] and therefore always appears in-gamut,
              defeating the search entirely.
            </p>
          </div>

          <CodeBlock
            lang="ts"
            code={`const lchToHexSafe = (lch: LCH): string => {
  // Must use UNCLIPPED oklabToRgbRaw — clamped values
  // always appear "in gamut" and defeat the search.
  const inGamut = (rgb: RGB) =>
    rgb.r >= -0.001 && rgb.r <= 1.001 &&
    rgb.g >= -0.001 && rgb.g <= 1.001 &&
    rgb.b >= -0.001 && rgb.b <= 1.001;

  // Fast path: already in gamut
  const direct = oklabToRgbRaw(oklchToOklab(lch));
  if (inGamut(direct)) return rgbToHex(oklabToRgb(oklchToOklab(lch)));

  // Binary search: find max C that stays inside sRGB.
  // Hue is NEVER modified — only chroma is reduced.
  let lo = 0, hi = lch.C;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(oklabToRgbRaw(oklchToOklab({ ...lch, C: mid }))))
      lo = mid;
    else
      hi = mid;
  }
  return rgbToHex(oklabToRgb(oklchToOklab({ ...lch, C: lo })));
};`}
          />

          <p style={{ color: th.body, marginTop: 16 }}>
            24 iterations gives precision of{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 4px",
                borderRadius: 3,
              }}
            >
              C / 2²⁴ ≈ 0.000001
            </code>{" "}
            — well below any visible threshold. The chart below shows the sRGB
            gamut boundary (maximum reachable C at each L) for the orange hue
            H=49°. Notice how the boundary drops sharply below L=0.35: at
            L=0.30, the maximum C is only ~0.08, far below the nominal 0.19 of
            #ff7700.
          </p>

          <div
            style={{
              display: "flex",
              gap: 16,
              flexWrap: "wrap",
              alignItems: "flex-start",
              marginTop: 16,
            }}
          >
            <div style={{ flex: 1, minWidth: 200 }}>
              <div
                className="rad-callout-label"
                style={{ color: th.faint, marginBottom: 8 }}
              >
                Try different hues — watch the gamut boundary shift
              </div>
              <div className="rad-slider-row" style={{ marginBottom: 0 }}>
                <span className="rad-slider-label" style={{ color: th.h2 }}>
                  H = {gamutH}°
                </span>
                <input
                  type="range"
                  min={0}
                  max={359}
                  step={1}
                  value={gamutH}
                  onChange={(e) => setGamutH(parseInt(e.target.value))}
                  className="rad-slider"
                  style={
                    {
                      "--slider-color": lchToHexSafe({
                        L: 0.6,
                        C: 0.25,
                        H: gamutH,
                      }),
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
            <GamutSlice H={gamutH} th={th} />
          </div>
        </section>

        {/* ── §6 — Multi-swatch ─────────────────────────── */}
        <section className="rad-section">
          <SectionHeader
            number="06"
            title="Multi-Swatch Palettes"
            accent={accent3}
          />
          <p style={{ color: th.body }}>
            When a key's array has more than one swatch (
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              n &gt; 1
            </code>
            ), the semantic transform table is bypassed entirely and one of four
            ramp strategies is used instead:
          </p>

          <div className="rad-multi-grid">
            {[
              {
                title: "Named harmony",
                trigger:
                  "Key matches triadic, square, splitComplementary, etc.",
                desc: "Applies a fixed hue-offset set (e.g. triadic = 0°, 120°, 240°) to the base LCH, cycling and slightly darkening repeated indices.",
                accent: accent1,
                swatches: [0, 120, 240].map((deg) =>
                  lchToHexSafe({ L: 0.55, C: 0.22, H: (250 + deg) % 360 }),
                ),
              },
              {
                title: "Tint-shade ramp",
                trigger: "Key contains tint, shade, or tintshade",
                desc: "A power-curved L ramp from 0.10 (dark) to 0.96 (tint), with chroma easing near the extremes so mid-tones stay vivid.",
                accent: accent2,
                swatches: Array.from({ length: 6 }, (_, i) => {
                  const t = i / 5;
                  const tC =
                    t < 0.5
                      ? 0.5 * (t * 2) ** 1.6
                      : 1 - 0.5 * ((1 - t) * 2) ** 1.4;
                  return lchToHexSafe({
                    L: 0.1 + tC * 0.86,
                    C: 0.22 * (1 - ((t - 0.4) / 0.7) ** 2 * 0.6),
                    H: 250,
                  });
                }),
              },
              {
                title: "Monochromatic ramp",
                trigger: "Key contains monochromatic",
                desc: "Linear L ramp 0.12 → 0.94, same hue throughout. Chroma peaks at L≈0.45 and fades at extremes using a power curve — matching how the eye perceives saturation.",
                accent: accent3,
                swatches: Array.from({ length: 6 }, (_, i) => {
                  const t = i / 5;
                  return lchToHexSafe({
                    L: 0.12 + t * 0.82,
                    C: 0.22 * (1 - Math.abs(t - 0.45) ** 2.5),
                    H: 250,
                  });
                }),
              },
              {
                title: "Evenly-spaced hues",
                trigger: "Unknown key, n > 1",
                desc: "Divides 360° evenly by n and distributes hues around the wheel at constant L and C. A 4-swatch unknown key gets a tetradic-equivalent split.",
                accent: accent4,
                swatches: Array.from({ length: 4 }, (_, i) =>
                  lchToHexSafe({
                    L: 0.55,
                    C: 0.22,
                    H: (250 + (360 / 4) * i) % 360,
                  }),
                ),
              },
            ].map(({ title, trigger, desc, accent, swatches }) => (
              <div
                key={title}
                className="rad-multi-card"
                style={{
                  background: th.panelBg,
                  border: `1px solid ${th.border}`,
                }}
              >
                <div className="rad-multi-card-header">
                  <div
                    className="rad-multi-dot"
                    style={{ background: accent }}
                  />
                  <strong style={{ color: th.label, fontSize: 13 }}>
                    {title}
                  </strong>
                </div>
                <div className="rad-multi-swatches">
                  {swatches.map((hex, i) => (
                    <div
                      key={i}
                      style={{ flex: 1, height: 32, background: hex }}
                    />
                  ))}
                </div>
                <code
                  style={{
                    fontSize: 10,
                    color: accent,
                    display: "block",
                    marginBottom: 6,
                    lineHeight: 1.4,
                  }}
                >
                  {trigger}
                </code>
                <p
                  style={{
                    color: th.desc,
                    fontSize: 12,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── §7 — Per-key independence ───────────────────── */}
        <section className="rad-section">
          <SectionHeader
            number="07"
            title="Per-Key Base Color"
            accent={accent2}
          />
          <p style={{ color: th.body }}>
            Each key extracts its base color from its{" "}
            <em>own first hex value</em>. Early versions used a single global
            base extracted from the first valid hex anywhere in the input —
            meaning all keys shared the same hue, no matter what values were
            provided per-key. The fix is straightforward:
          </p>
          <CodeBlock
            lang="ts"
            code={`// ❌ Old — global base means all keys share one hue
const base = extractBaseColor(input);          // first hex in entire object
const lch  = hexToLch(base);
Object.entries(input).map(([key, colors]) => [key, generatePalette(key, lch, colors.length)]);

// ✅ New — per-key base, each key has independent hue
Object.entries(input).map(([key, colors]) => {
  const base = colors.find(c => HEX_RE.test(c)) ?? "#ff0000";  // own first hex
  const lch  = hexToLch(base);
  return [key, generatePalette(key, lch, colors.length)];
});`}
          />
          <p style={{ color: th.body, marginTop: 12 }}>
            This allows a palette like{" "}
            <code
              style={{
                background: th.codeBg,
                color: th.codeText,
                padding: "1px 5px",
                borderRadius: 4,
              }}
            >
              {'{ mainColor: ["#ff0000"], accentColor: ["#0000ff"] }'}
            </code>{" "}
            to produce a red main color and a blue accent — instead of two reds.
          </p>
        </section>

        {/* ── §8 — Before / After ─────────────────────────── */}
        <section className="rad-section">
          <SectionHeader
            number="08"
            title="Full Before / After"
            accent={accent4}
          />
          <p style={{ color: th.body }}>
            Here's the complete transformation for the canonical test case,
            showing every token's input → output alongside its OKLCH
            coordinates:
          </p>

          <div className="rad-full-table-wrap">
            <table className="rad-full-table" style={{ color: th.body }}>
              <thead>
                <tr>
                  <th style={{ color: th.h2 }}>Token</th>
                  <th style={{ color: th.h2 }}>Input</th>
                  <th style={{ color: th.h2 }}>L C H (in)</th>
                  <th style={{ color: th.h2 }}>Output</th>
                  <th style={{ color: th.h2 }}>L C H (out)</th>
                  <th style={{ color: th.h2 }}>ΔH</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((key) => {
                  const iHex = DEMO_INPUT[key];
                  const oHex = DEMO_OUTPUT[key];
                  const iL = hexToLch(iHex);
                  const oL = hexToLch(oHex);
                  const dH = Math.min(
                    Math.abs(oL.H - iL.H),
                    360 - Math.abs(oL.H - iL.H),
                  );
                  return (
                    <tr key={key}>
                      <td>
                        <code
                          style={{
                            background: th.codeBg,
                            color: th.codeText,
                            padding: "1px 5px",
                            borderRadius: 3,
                            fontSize: 11,
                          }}
                        >
                          {key}
                        </code>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              background: iHex,
                              flexShrink: 0,
                            }}
                          />
                          <code style={{ fontSize: 11 }}>{iHex}</code>
                        </div>
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          fontVariantNumeric: "tabular-nums",
                          color: th.desc,
                        }}
                      >
                        {iL.L.toFixed(3)} {iL.C.toFixed(3)} {iL.H.toFixed(1)}°
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 4,
                              background: oHex,
                              flexShrink: 0,
                            }}
                          />
                          <code style={{ fontSize: 11 }}>{oHex}</code>
                        </div>
                      </td>
                      <td
                        style={{
                          fontSize: 11,
                          fontVariantNumeric: "tabular-nums",
                          color: th.desc,
                        }}
                      >
                        {oL.L.toFixed(3)} {oL.C.toFixed(3)} {oL.H.toFixed(1)}°
                      </td>
                      <td
                        style={{
                          color:
                            dH < 2 ? accent2 : dH < 8 ? accent3 : "#ef4444",
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      >
                        {dH.toFixed(1)}°
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p style={{ color: th.desc, fontSize: 12, marginTop: 8 }}>
            ΔH (hue drift): green = excellent (&lt;2°) · orange = acceptable
            (&lt;8°) · red = problem (&gt;8°). All values should be green after
            gamut-safe clamping.
          </p>
        </section>

        {/* ── §9 — Summary ────────────────────────────────── */}
        <section className="rad-section">
          <SectionHeader number="09" title="Summary" accent={accent1} />
          <div className="rad-summary-grid">
            {[
              {
                icon: "⬡",
                title: "OKLCH everywhere",
                desc: "All transforms target absolute (L, C, H) coordinates. Perceptual uniformity guarantees consistency regardless of input.",
                accent: accent1,
              },
              {
                icon: "⊕",
                title: "Per-key independence",
                desc: "Each token uses its own first hex value as a base. Keys can carry completely different hues.",
                accent: accent2,
              },
              {
                icon: "⟳",
                title: "Gamut-safe binary search",
                desc: "Chroma is binary-searched downward until the color fits inside sRGB. Hue is never altered by the clamp.",
                accent: accent3,
              },
              {
                icon: "◈",
                title: "Semantic pattern table",
                desc: "11 priority-ordered key patterns map token names to specific L and C transforms. First match wins.",
                accent: accent4,
              },
              {
                icon: "▦",
                title: "Ramp strategies for n > 1",
                desc: "Named harmonies, tint-shade ramps, monochromatic ramps, and evenly-spaced hues for multi-swatch keys.",
                accent: accent1,
              },
              {
                icon: "≡",
                title: "Structure preserved",
                desc: "Output always mirrors the input: same keys, same array lengths. Unknown keys fall back gracefully.",
                accent: accent2,
              },
            ].map(({ icon, title, desc, accent }) => (
              <div
                key={title}
                className="rad-summary-card"
                style={{
                  background: th.panelBg,
                  border: `1px solid ${th.border}`,
                }}
              >
                <div className="rad-summary-icon" style={{ color: accent }}>
                  {icon}
                </div>
                <div className="rad-summary-title" style={{ color: th.label }}>
                  {title}
                </div>
                <p
                  style={{
                    color: th.desc,
                    fontSize: 12,
                    margin: 0,
                    lineHeight: 1.5,
                  }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
