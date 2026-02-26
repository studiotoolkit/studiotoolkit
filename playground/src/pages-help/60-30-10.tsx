/**
 * 60-30-10 Color Rule — Role Selector
 *
 * ═══════════════════════════════════════════════════════════════════
 * PALETTE ANALYSIS (OKLab perceptual scores)
 * ═══════════════════════════════════════════════════════════════════
 *
 * Input hex     →  L (lightness)  C (chroma)   H (hue °)   role
 * ─────────────────────────────────────────────────────────────────
 * #fefefe       →  0.997          0.000         89.9    ← neutralLight ★
 * #c3e0ca       →  0.879          0.043        152.7
 * #84d4ea       →  0.826          0.084        217.3
 * #97cd5c       →  0.787          0.155        130.5   ← accentColor ★
 * #63c4e6       →  0.774          0.103        223.6
 * #e995b8       →  0.765          0.109        353.4
 * #7ac27e       →  0.749          0.121        145.5
 * #44b1d7       →  0.714          0.112        224.9
 * #5cb7a3       →  0.718          0.093        177.3
 * #f72f68       →  0.641          0.231         11.3   ← mainColor ★ (highest C)
 * #e92b61       →  0.612          0.222         11.5   ← mainColorShade ★
 * #cf2c7f       →  0.577          0.208        355.2
 * #c33488       →  0.567          0.195        349.2
 * #b43a8d       →  0.551          0.180        343.0
 * #a54396       →  0.543          0.163        334.0
 * #944899       →  0.528          0.147        325.0   ← darkest in palette
 * ─────────────────────────────────────────────────────────────────
 * neutralDark   →  DERIVED from main hue       [not in palette]
 *
 * ═══════════════════════════════════════════════════════════════════
 * THE 5 COLOR ROLES — "How to prepare"
 * ═══════════════════════════════════════════════════════════════════
 *
 *  ┌─────────────────┬────────┬──────────┬─────────────────────────┐
 *  │ Role            │ Weight │ Source   │ Method                  │
 *  ├─────────────────┼────────┼──────────┼─────────────────────────┤
 *  │ neutralLight    │  60%   │ #fefefe  │ Highest L, C < 0.06     │
 *  │ neutralDark     │ used   │ derived  │ Main hue → L=0.20 C=0.04│
 *  │ mainColor       │  30%   │ #f72f68  │ Highest C in L[0.40-0.72│
 *  │ mainColorShade  │ with30%│ #e92b61  │ Same hue family, next C │
 *  │ accentColor     │  10%   │ #97cd5c  │ Hue ≥100° from main, hi C│
 *  └─────────────────┴────────┴──────────┴─────────────────────────┘
 *
 * ── 1. neutralLight (#fefefe) ─────────────────────────────────────
 *   Filter colors where OKLab chroma C < 0.06 (near-neutral).
 *   Sort by L descending. Pick first → #fefefe (L=0.997, C=0.000).
 *   This is your 60% canvas: page background, cards, inputs.
 *
 * ── 2. neutralDark (DERIVED, not in palette) ──────────────────────
 *   This palette has NO true neutral dark — even the darkest color
 *   (#944899) has high chroma (C=0.147). A pure #111111 would feel
 *   disconnected from the brand. Solution: take the mainColor hue
 *   (H=11.3°, warm red-pink) and force it to L=0.20, C=0.035 in
 *   OKLCH → produces a very dark warm near-black (#180b0e).
 *   This harmonizes with the brand while passing 7:1 contrast on white.
 *
 * ── 3. mainColor (#f72f68) ────────────────────────────────────────
 *   Filter colors in mid-lightness band: 0.40 ≤ L ≤ 0.72.
 *   Sort by chroma C descending. Pick first → #f72f68 (C=0.231).
 *   The most vivid, readable brand color. 30% of screen real estate:
 *   hero sections, primary buttons, nav bars.
 *
 * ── 4. mainColorShade (#e92b61) ───────────────────────────────────
 *   Find colors not yet selected, hue within 30° of mainColor (H=11.3°),
 *   C > 0.10. Sort by chroma. Pick first → #e92b61 (H=11.5°, C=0.222).
 *   A darker twin: hover/active states, gradient depth alongside main.
 *   Together with mainColor these fill the "30% brand" band.
 *
 * ── 5. accentColor (#97cd5c) ──────────────────────────────────────
 *   Find colors not yet selected, hue distance ≥ 100° from mainColor.
 *   main H=11.3°, lime H=130.5° → distance = 119.2° ✓
 *   Sort by C → #97cd5c (C=0.155) wins.
 *   The 10% surprise: CTAs, badges, price highlights.
 *   Warm pink + acid lime = electric complementary contrast.
 */

import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../ThemeContext";
import "./60-30-10.css";

// ─────────────────────────────────────────────────────────────────────
// OKLab / OKLCH color math — zero external dependencies
// Reference: Ottosson, B. (2020). oklab.org
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
const lchToHex = ({ L, C, H }: LCH) => {
  const rad = (H * Math.PI) / 180;
  return rgbToHex(
    oklabToRgb({ L, a: C * Math.cos(rad), b: C * Math.sin(rad) }),
  );
};

const hueDist = (h1: number, h2: number) => {
  const d = Math.abs(h1 - h2) % 360;
  return d > 180 ? 360 - d : d;
};
const wcagY = ({ r, g, b }: RGB) =>
  0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
const contrast = (a: string, b: string) => {
  const ya = wcagY(hexToRgb(a)),
    yb = wcagY(hexToRgb(b));
  return (Math.max(ya, yb) + 0.05) / (Math.min(ya, yb) + 0.05);
};
const textOn = (bg: string) =>
  contrast(bg, "#ffffff") >= contrast(bg, "#111111") ? "#ffffff" : "#111111";

// ─────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────

export type RoleName =
  | "neutralLight"
  | "neutralDark"
  | "mainColor"
  | "mainColorShade"
  | "accentColor";

export interface ColorRole {
  role: RoleName;
  hex: string;
  lch: LCH;
  label: string;
  weight: string;
  desc: string;
  criterion: string;
  derived: boolean;
  textColor: string;
}

export interface RuleResult {
  neutralLight: ColorRole;
  neutralDark: ColorRole;
  mainColor: ColorRole;
  mainColorShade: ColorRole;
  accentColor: ColorRole;
}

// ─────────────────────────────────────────────────────────────────────
// Core algorithm
// ─────────────────────────────────────────────────────────────────────

const select60_30_10 = (palette: string[]): RuleResult => {
  const px = palette.map((hex) => ({ hex, lch: hexToLch(hex) }));
  const mk = (
    role: RoleName,
    label: string,
    weight: string,
    hex: string,
    desc: string,
    criterion: string,
    derived = false,
  ): ColorRole => ({
    role,
    hex,
    lch: hexToLch(hex),
    label,
    weight,
    desc,
    criterion,
    derived,
    textColor: textOn(hex),
  });

  // 1. neutralLight — lightest near-neutral
  const neutrals = px.filter((c) => c.lch.C < 0.06);
  const nlSrc = (neutrals.length ? neutrals : px).sort(
    (a, b) => b.lch.L - a.lch.L,
  )[0];
  const neutralLight = mk(
    "neutralLight",
    "Neutral Light",
    "60%",
    nlSrc.hex,
    "Page background, cards, inputs — the dominant 60% canvas",
    `Highest L=${nlSrc.lch.L.toFixed(3)} with chroma C < 0.06 (near-neutral, no hue pollution)`,
  );

  // 2. mainColor — highest chroma in mid-lightness band
  const midBand = px.filter((c) => c.lch.L >= 0.4 && c.lch.L <= 0.72);
  const mainSrc = (midBand.length ? midBand : px).sort(
    (a, b) => b.lch.C - a.lch.C,
  )[0];
  const mainColor = mk(
    "mainColor",
    "Main Color",
    "30%",
    mainSrc.hex,
    "Hero sections, primary buttons, key brand moments",
    `Highest chroma C=${mainSrc.lch.C.toFixed(3)} in mid-lightness band L ∈ [0.40–0.72]`,
  );

  // 3. neutralDark — DERIVED (no true dark in palette)
  const darkHex = lchToHex({ L: 0.2, C: 0.035, H: mainSrc.lch.H });
  const neutralDark = mk(
    "neutralDark",
    "Neutral Dark",
    "—",
    darkHex,
    "Body text, headings, borders — structural skeleton",
    `Derived: palette has no true dark (darkest = L=0.528). Main hue H=${mainSrc.lch.H.toFixed(1)}° clamped to L=0.20, C=0.035`,
    true,
  );

  // 4. mainColorShade — same hue family, second-best chroma
  const sel1 = new Set([nlSrc.hex, mainSrc.hex]);
  const shadePool = px
    .filter(
      (c) =>
        !sel1.has(c.hex) &&
        hueDist(c.lch.H, mainSrc.lch.H) < 30 &&
        c.lch.C > 0.1,
    )
    .sort((a, b) => b.lch.C - a.lch.C);
  const shadeSrc =
    shadePool[0] ??
    px.filter((c) => !sel1.has(c.hex)).sort((a, b) => b.lch.C - a.lch.C)[0];
  const mainColorShade = mk(
    "mainColorShade",
    "Main Color Shade",
    "—",
    shadeSrc.hex,
    "Hover/active states, gradient depth — darker twin of main",
    `Hue within 30° of main (H=${shadeSrc.lch.H.toFixed(1)}°), chroma C=${shadeSrc.lch.C.toFixed(3)}`,
  );

  // 5. accentColor — hue ≥ 100° from main, highest chroma
  const sel2 = new Set([nlSrc.hex, mainSrc.hex, shadeSrc.hex]);
  const accentPool = px
    .filter((c) => !sel2.has(c.hex) && hueDist(c.lch.H, mainSrc.lch.H) >= 100)
    .sort((a, b) => b.lch.C - a.lch.C);
  const accentSrc =
    accentPool[0] ??
    px.filter((c) => !sel2.has(c.hex)).sort((a, b) => b.lch.C - a.lch.C)[0];
  const dist = hueDist(accentSrc.lch.H, mainSrc.lch.H);
  const accentColor = mk(
    "accentColor",
    "Accent Color",
    "10%",
    accentSrc.hex,
    "CTAs, badges, price highlights — the 10% surprise pop",
    `Hue ≥ 100° from main (actual dist = ${dist.toFixed(0)}°), highest C=${accentSrc.lch.C.toFixed(3)} among candidates`,
  );

  return { neutralLight, neutralDark, mainColor, mainColorShade, accentColor };
};

// ─────────────────────────────────────────────────────────────────────
// React UI
// ─────────────────────────────────────────────────────────────────────

const PALETTE = [
  "#e92b61",
  "#fefefe",
  "#cf2c7f",
  "#97cd5c",
  "#44b1d7",
  "#63c4e6",
  "#a54396",
  "#84d4ea",
  "#5cb7a3",
  "#f72f68",
  "#b43a8d",
  "#944899",
  "#7ac27e",
  "#c33488",
  "#c3e0ca",
  "#e995b8",
];

const ROLE_HUE: Record<RoleName, string> = {
  neutralLight: "#e2e8f0",
  neutralDark: "#94a3b8",
  mainColor: "#fb7185",
  mainColorShade: "#f43f5e",
  accentColor: "#a3e635",
};

const ROLE_WEIGHT_LABEL: Record<RoleName, string> = {
  neutralLight: "60%",
  neutralDark: "structural",
  mainColor: "30%",
  mainColorShade: "30% shade",
  accentColor: "10%",
};

export default function ColorRuleSelector() {
  const { isDark } = useTheme();
  const result = select60_30_10(PALETTE);
  const [hover, setHover] = useState<RoleName | null>(null);
  const th = {
    pageBg: isDark ? "#0d0f14" : "#f0f4f8",
    pageText: isDark ? "#dde3ef" : "#1e293b",
    h1: isDark ? "#f1f5f9" : "#0f172a",
    h2: isDark ? "#475569" : "#64748b",
    body: isDark ? "#64748b" : "#475569",
    label: isDark ? "#f1f5f9" : "#0f172a",
    desc: isDark ? "#94a3b8" : "#64748b",
    faint: isDark ? "#334155" : "#94a3b8",
    legend: isDark ? "#334155" : "#64748b",
    panelBg: isDark ? "#161b27" : "#ffffff",
    panelHover: isDark ? "#1e2535" : "#f8fafc",
    border: isDark ? "#2a3347" : "#e2e8f0",
    trackBg: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    lchTrack: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    codeBg: isDark ? "#1e2a42" : "#eff6ff",
    previewBorder: isDark ? "#2a3347" : "#e2e8f0",
    previewShadow: isDark
      ? "0 2px 8px rgba(0,0,0,0.4)"
      : "0 1px 4px rgba(0,0,0,0.06)",
    ringBg: isDark ? "#0d0f14" : "#f0f4f8",
    badgeBorder: isDark ? "#0d0f14" : "#f0f4f8",
  };

  const roles: ColorRole[] = [
    result.neutralLight,
    result.neutralDark,
    result.mainColor,
    result.mainColorShade,
    result.accentColor,
  ];

  const roleByHex = new Map(
    roles.filter((r) => !r.derived).map((r) => [r.hex, r]),
  );
  const active = hover ? roles.find((r) => r.role === hover)! : null;

  return (
    <div className="help-60-30-10-page">
      <Header />

      {/* ─── Hero ──────────────────────────────────────────────── */}
      <div className="help-6030-hero">
        <div className="help-6030-hero-eyebrow">Color Design Rule</div>
        <h1>60 – 30 – 10</h1>
        <p className="help-6030-hero-rule">Color Proportion Rule</p>
        <p className="help-6030-hero-subtitle">
          Five roles, one palette. The algorithm scores every extracted color on{" "}
          <em>lightness</em>, <em>chroma</em>, and <em>hue distance</em> using
          OKLab perceptual math to assign each role.
        </p>
      </div>

      {/* Ambient glow layer */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          background: [
            `radial-gradient(ellipse 55% 35% at 85% 5%, ${result.mainColor.hex}20 0%, transparent 65%)`,
            `radial-gradient(ellipse 35% 25% at 5% 95%, ${result.accentColor.hex}15 0%, transparent 55%)`,
            `radial-gradient(ellipse 45% 45% at 50% 50%, ${result.mainColorShade.hex}08 0%, transparent 70%)`,
          ].join(","),
        }}
      />

      <div
        className="help-6030-content"
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: '"Inter", system-ui, -apple-system, sans-serif',
          color: th.pageText,
        }}
      >
        {/* ─── Proportion bars ─────────────────────────────────── */}
        <div style={{ marginBottom: 40, marginTop: 32 }}>
          {[
            {
              label: "60% — Neutral Light",
              role: result.neutralLight,
              flex: 60,
            },
            { label: "30% — Main + Shade", role: result.mainColor, flex: 30 },
            { label: "10% — Accent", role: result.accentColor, flex: 10 },
          ].map(({ label, role, flex }) => (
            <div
              key={role.role}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: th.h2,
                  fontFamily: "system-ui, sans-serif",
                  letterSpacing: "0.08em",
                  width: 160,
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 28,
                  borderRadius: 6,
                  overflow: "hidden",
                  background: th.trackBg,
                }}
              >
                <div
                  onMouseEnter={() => setHover(role.role)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    height: "100%",
                    width: `${flex}%`,
                    background:
                      role.role === "mainColor"
                        ? `linear-gradient(90deg, ${result.mainColor.hex}, ${result.mainColorShade.hex})`
                        : role.hex,
                    borderRadius: 6,
                    boxShadow:
                      hover === role.role ? `0 0 20px ${role.hex}60` : "none",
                    transition: "box-shadow 0.2s",
                    cursor: "default",
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: ROLE_HUE[role.role],
                  fontFamily: "system-ui, sans-serif",
                  width: 32,
                  textAlign: "right",
                }}
              >
                {flex}%
              </span>
            </div>
          ))}
        </div>

        {/* ─── Main grid ───────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(300px,1fr) minmax(260px, 420px)",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Left: Role cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {roles.map((role, idx) => {
              const isHov = hover === role.role;
              const ac = ROLE_HUE[role.role];
              return (
                <div
                  key={role.role}
                  onMouseEnter={() => setHover(role.role)}
                  onMouseLeave={() => setHover(null)}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "60px 1fr 52px",
                    gap: 14,
                    padding: "14px 18px 14px 14px",
                    borderRadius: 14,
                    background: isHov ? th.panelHover : th.panelBg,
                    border: `1px solid ${isHov ? ac + "50" : th.border}`,
                    transition: "all 0.18s ease",
                    cursor: "default",
                    transform: isHov ? "translateX(6px)" : "none",
                  }}
                >
                  {/* Swatch col */}
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 12,
                        background: role.hex,
                        boxShadow: isHov
                          ? `0 8px 28px ${role.hex}80, 0 2px 8px ${role.hex}40`
                          : `0 2px 12px ${role.hex}40`,
                        transition: "box-shadow 0.2s",
                        flexShrink: 0,
                      }}
                    />
                    {role.derived && (
                      <div
                        title="Color derived from algorithm — not in source palette"
                        style={{
                          position: "absolute",
                          top: -5,
                          right: -5,
                          width: 17,
                          height: 17,
                          borderRadius: "50%",
                          background: "#f59e0b",
                          border: `2px solid ${th.badgeBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 8,
                          color: "#000",
                          fontWeight: 800,
                          fontFamily: "system-ui",
                        }}
                      >
                        ✦
                      </div>
                    )}
                  </div>

                  {/* Info col */}
                  <div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 400,
                          color: th.label,
                        }}
                      >
                        {role.label}
                      </span>
                      {!role.derived && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: "1px 6px",
                            borderRadius: 20,
                            letterSpacing: "0.08em",
                            background: ac + "25",
                            color: ac,
                            border: `1px solid ${ac}45`,
                            fontFamily: "system-ui, sans-serif",
                          }}
                        >
                          {ROLE_WEIGHT_LABEL[role.role]}
                        </span>
                      )}
                      {role.derived && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "1px 6px",
                            borderRadius: 20,
                            background: "#f59e0b20",
                            color: "#f59e0b",
                            border: "1px solid #f59e0b40",
                            fontFamily: "system-ui, sans-serif",
                          }}
                        >
                          DERIVED
                        </span>
                      )}
                    </div>
                    <code
                      style={{
                        fontSize: 11,
                        color: th.body,
                        background: th.codeBg,
                        padding: "2px 7px",
                        borderRadius: 5,
                        display: "inline-block",
                        marginBottom: 5,
                        fontFamily: "monospace",
                      }}
                    >
                      {role.hex}
                    </code>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: th.desc,
                        fontFamily: "system-ui, sans-serif",
                        lineHeight: 1.5,
                      }}
                    >
                      {role.desc}
                    </p>
                  </div>

                  {/* Index */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-end",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 28,
                        fontWeight: 400,
                        color: ac,
                        opacity: 0.4,
                        lineHeight: 1,
                        letterSpacing: "-0.04em",
                      }}
                    >
                      0{idx + 1}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Detail + mock preview */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Detail panel */}
            <div
              style={{
                padding: "20px 22px",
                borderRadius: 14,
                minHeight: 200,
                background: th.panelBg,
                border: `1px solid ${active ? ROLE_HUE[active.role] + "45" : th.border}`,
                transition: "border-color 0.2s",
              }}
            >
              {active ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: active.hex,
                        flexShrink: 0,
                        boxShadow: `0 4px 20px ${active.hex}70`,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: 14,
                          color: th.label,
                          marginBottom: 2,
                        }}
                      >
                        {active.label}
                      </div>
                      <code
                        style={{
                          fontSize: 11,
                          color: th.h2,
                          fontFamily: "monospace",
                        }}
                      >
                        {active.hex}
                      </code>
                    </div>
                  </div>

                  {/* LCH meters */}
                  {(
                    [
                      ["L — Lightness", active.lch.L, 1.0, active.lch.L],
                      ["C — Chroma", active.lch.C, 0.28, active.lch.C / 0.28],
                      ["H — Hue °", active.lch.H, 360, active.lch.H / 360],
                    ] as [string, number, number, number][]
                  ).map(([label, val, , pct]) => (
                    <div key={label} style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            letterSpacing: "0.1em",
                            color: th.h2,
                            fontFamily: "system-ui, sans-serif",
                            textTransform: "uppercase",
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: th.body,
                            fontFamily: "monospace",
                          }}
                        >
                          {label.includes("Hue")
                            ? val.toFixed(1) + "°"
                            : val.toFixed(3)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 4,
                          borderRadius: 2,
                          background: th.lchTrack,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: Math.min(pct, 1) * 100 + "%",
                            background: ROLE_HUE[active.role],
                            borderRadius: 2,
                            transition: "width 0.3s ease",
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <div
                    style={{
                      marginTop: 12,
                      paddingTop: 12,
                      borderTop: `1px solid ${th.border}`,
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 4px",
                        fontSize: 11,
                        color: th.desc,
                        fontFamily: "system-ui, sans-serif",
                        lineHeight: 1.6,
                      }}
                    >
                      <span style={{ color: th.body }}>Algorithm: </span>
                      {active.criterion}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 11,
                        color: th.h2,
                        fontFamily: "system-ui, sans-serif",
                      }}
                    >
                      Contrast on light bg:{" "}
                      <strong style={{ color: th.body }}>
                        {contrast(active.hex, result.neutralLight.hex).toFixed(
                          1,
                        )}
                        :1
                      </strong>
                    </p>
                  </div>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 160,
                    flexDirection: "column",
                    gap: 10,
                    opacity: 0.25,
                  }}
                >
                  <div style={{ fontSize: 32, transform: "rotate(-10deg)" }}>
                    ↙
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: "system-ui, sans-serif",
                      letterSpacing: "0.08em",
                      color: th.body,
                    }}
                  >
                    HOVER A ROLE
                  </span>
                </div>
              )}
            </div>

            {/* Mock UI preview */}
            <div
              style={{
                borderRadius: 14,
                overflow: "hidden",
                border: `1px solid ${th.previewBorder}`,
                boxShadow: th.previewShadow,
              }}
            >
              {/* Nav */}
              <div
                style={{
                  background: `linear-gradient(110deg, ${result.mainColor.hex} 0%, ${result.mainColorShade.hex} 100%)`,
                  padding: "11px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: result.mainColor.textColor,
                    fontFamily: "system-ui, sans-serif",
                  }}
                >
                  ● Brand
                </span>
                <div
                  style={{
                    background: result.accentColor.hex,
                    color: result.accentColor.textColor,
                    fontSize: 10,
                    fontWeight: 800,
                    fontFamily: "system-ui, sans-serif",
                    padding: "3px 10px",
                    borderRadius: 20,
                    boxShadow: `0 2px 12px ${result.accentColor.hex}80`,
                  }}
                >
                  New
                </div>
              </div>

              {/* Body */}
              <div
                style={{
                  background: result.neutralLight.hex,
                  padding: "18px 18px 16px",
                }}
              >
                {/* Headline */}
                <div
                  style={{
                    width: "60%",
                    height: 11,
                    borderRadius: 5,
                    background: result.neutralDark.hex,
                    opacity: 0.9,
                    marginBottom: 8,
                  }}
                />
                <div
                  style={{
                    width: "82%",
                    height: 7,
                    borderRadius: 4,
                    background: result.neutralDark.hex,
                    opacity: 0.3,
                    marginBottom: 5,
                  }}
                />
                <div
                  style={{
                    width: "68%",
                    height: 7,
                    borderRadius: 4,
                    background: result.neutralDark.hex,
                    opacity: 0.2,
                    marginBottom: 16,
                  }}
                />

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginBottom: 14,
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    style={{
                      padding: "7px 15px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "system-ui, sans-serif",
                      background: `linear-gradient(135deg, ${result.mainColor.hex}, ${result.mainColorShade.hex})`,
                      color: result.mainColor.textColor,
                      boxShadow: `0 4px 18px ${result.mainColor.hex}55`,
                    }}
                  >
                    Primary CTA
                  </div>
                  <div
                    style={{
                      padding: "7px 15px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "system-ui, sans-serif",
                      background: result.accentColor.hex,
                      color: result.accentColor.textColor,
                      boxShadow: `0 4px 14px ${result.accentColor.hex}50`,
                    }}
                  >
                    Get Started ✦
                  </div>
                  <div
                    style={{
                      padding: "7px 15px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: "system-ui, sans-serif",
                      color: result.mainColor.hex,
                      border: `1.5px solid ${result.mainColor.hex}60`,
                    }}
                  >
                    Learn More
                  </div>
                </div>

                {/* Tag chips */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {[
                    { hex: result.mainColor.hex, label: "Main" },
                    { hex: result.accentColor.hex, label: "Accent" },
                    { hex: result.mainColorShade.hex, label: "Shade" },
                  ].map(({ hex, label }) => (
                    <div
                      key={label}
                      style={{
                        padding: "3px 10px",
                        borderRadius: 20,
                        fontSize: 10,
                        fontFamily: "system-ui, sans-serif",
                        background: hex + "20",
                        color: hex,
                        border: `1px solid ${hex}40`,
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Source palette ───────────────────────────────────── */}
        <div style={{ marginTop: 40 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 14,
            }}
          >
            <div
              style={{
                width: 3,
                height: 14,
                background: th.faint,
                borderRadius: 2,
              }}
            />
            <span
              style={{
                fontSize: 9,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: th.faint,
                fontFamily: "system-ui, sans-serif",
              }}
            >
              Source palette — {PALETTE.length} extracted colors
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PALETTE.map((hex, i) => {
              const role = roleByHex.get(hex);
              const isSelected = !!role;
              return (
                <div
                  key={hex + i}
                  onMouseEnter={() => role && setHover(role.role)}
                  onMouseLeave={() => setHover(null)}
                  title={`${hex}${role ? " → " + role.label : ""}`}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background: hex,
                    flexShrink: 0,
                    position: "relative",
                    boxShadow:
                      isSelected && hover === role?.role
                        ? `0 0 0 2px ${th.ringBg}, 0 0 0 4px ${ROLE_HUE[role!.role]}, 0 4px 18px ${hex}80`
                        : isSelected
                          ? `0 0 0 2px ${th.ringBg}, 0 0 0 3.5px ${ROLE_HUE[role!.role]}`
                          : "0 1px 6px rgba(0,0,0,0.4)",
                    transition: "box-shadow 0.15s, transform 0.15s",
                    transform:
                      hover === role?.role && isSelected
                        ? "translateY(-4px)"
                        : "none",
                    cursor: isSelected ? "default" : "default",
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: 9,
                        background: "rgba(0,0,0,0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 13,
                        color: textOn(hex),
                      }}
                    >
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p
            style={{
              fontFamily: "system-ui, sans-serif",
              fontSize: 10,
              color: th.legend,
              marginTop: 10,
              letterSpacing: "0.04em",
            }}
          >
            Colored ring = assigned role · ✓ = selected for a role · ✦ badge on
            card = derived, not in palette
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
