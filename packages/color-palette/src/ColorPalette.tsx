import "./ColorPalette.css";

type PaletteData = { [key: string]: string[] | undefined };
type DisplayType = "square" | "table" | "circle" | "triangle" | "block";

interface ColorPaletteProps {
  paletteData: PaletteData | null;
  showCopyButton?: boolean;
  displayType?: DisplayType;
  width?: number;
  boxBorderSize?: number;
  boxBorderColor?: string;
  displayTitle?: boolean;
  fontColor?: string;
  fontSize?: number;
  backgroundColor?: string;
  displayHexcode?: boolean;
  /** How many color parts to show per swatch. 1 = transformed. 2 = transformed + transformed. 3 = transformed + transformed + original. */
  parts?: 1 | 2 | 3;
  /** Saturation for Part 1 (top band) (0 = fully desaturated, 100 = fully saturated). Default 50. */
  saturation1?: number;
  /** Brightness for Part 1 (top band) (0 = black, 50 = mid-tone, 100 = white). Default 50. */
  brightness1?: number;
  /** Saturation for Part 2 (middle band) (0 = fully desaturated, 100 = fully saturated). Default 50. */
  saturation2?: number;
  /** Brightness for Part 2 (middle band) (0 = black, 50 = mid-tone, 100 = white). Default 50. */
  brightness2?: number;
}

// ─── Color math (zero dependencies) ───────────────────────────────────

const hexToRgb = (hex: string): { r: number; g: number; b: number } => ({
  r: parseInt(hex.slice(1, 3), 16) / 255,
  g: parseInt(hex.slice(3, 5), 16) / 255,
  b: parseInt(hex.slice(5, 7), 16) / 255,
});

const rgbToHex = ({ r, g, b }: { r: number; g: number; b: number }): string =>
  "#" +
  [r, g, b]
    .map((c) =>
      Math.round(Math.max(0, Math.min(1, c)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

const rgbToHsl = ({
  r,
  g,
  b,
}: {
  r: number;
  g: number;
  b: number;
}): { h: number; s: number; l: number } => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h, s, l };
};

const hslToRgb = ({
  h,
  s,
  l,
}: {
  h: number;
  s: number;
  l: number;
}): { r: number; g: number; b: number } => {
  if (s === 0) return { r: l, g: l, b: l };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return {
    r: hue2rgb(p, q, h + 1 / 3),
    g: hue2rgb(p, q, h),
    b: hue2rgb(p, q, h - 1 / 3),
  };
};

/**
 * Apply saturation (0–100) and brightness (0–100) to a hex color.
 * saturation: 0 = fully desaturated grey, 100 = fully saturated.
 * brightness: 0 = black, 50 = mid-tone, 100 = white.
 */
const applySB = (
  hex: string,
  saturation: number,
  brightness: number,
): string => {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const clampedSat = Math.max(0, Math.min(100, saturation));
  const clampedBri = Math.max(0, Math.min(100, brightness));
  // Directly set saturation (0-100 maps to 0.0-1.0)
  const newS = clampedSat / 100;
  // Directly set lightness (0-100 maps to 0.0-1.0)
  const newL = clampedBri / 100;
  return rgbToHex(hslToRgb({ h: hsl.h, s: newS, l: newL }));
};

// ─── Split-swatch renderer ─────────────────────────────────────────────

/**
 * Renders one swatch split into `parts` horizontal bands.
 * The clip-path / border-radius for each shape is handled
 * by wrapping the bands inside a shaped container.
 */
function SplitSwatch({
  hex,
  parts,
  saturation1,
  brightness1,
  saturation2,
  brightness2,
  displayType,
  width,
  borderSize,
  borderColor,
}: {
  hex: string;
  parts: 1 | 2 | 3;
  saturation1: number;
  brightness1: number;
  saturation2: number;
  brightness2: number;
  displayType: DisplayType;
  width: number;
  borderSize: number;
  borderColor: string;
}) {
  // Build the ordered list of colors for each band
  // Part 1 (top) → transformed with saturation1/brightness1
  // Part 2 (middle) → transformed with saturation2/brightness2
  // Part 3 (bottom) → original color
  const bands: string[] = [];
  if (parts === 1) {
    bands.push(applySB(hex, saturation1, brightness1)); // Part 1: transformed
  } else if (parts === 2) {
    bands.push(applySB(hex, saturation1, brightness1)); // Part 1: transformed
    bands.push(applySB(hex, saturation2, brightness2)); // Part 2: transformed
  } else {
    bands.push(applySB(hex, saturation1, brightness1)); // Part 1: transformed
    bands.push(applySB(hex, saturation2, brightness2)); // Part 2: transformed
    bands.push(hex); // Part 3: original
  }

  // Shared container style — shape is applied here
  const shapeStyle: React.CSSProperties = {
    width,
    height: width,
    overflow: "hidden",
    flexShrink: 0,
    position: "relative",
    border: `${borderSize}px solid ${borderColor}`,
    boxSizing: "border-box",
    ...(displayType === "circle"
      ? { borderRadius: "50%" }
      : displayType === "square"
        ? { borderRadius: 0 }
        : displayType === "triangle"
          ? {
              borderRadius: 0,
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
              border: "none",
            }
          : { borderRadius: 10 }), // block default
  };

  if (parts === 1) {
    return (
      <div
        style={{
          ...shapeStyle,
          background: applySB(hex, saturation1, brightness1),
        }}
      />
    );
  }

  // For triangle: we can't use simple horizontal bands because the
  // clip-path creates a triangular visible region. We split by stacking
  // horizontal bands inside — visually the triangle clips them correctly.
  const bandPct = 100 / bands.length;

  return (
    <div style={shapeStyle}>
      {bands.map((color, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${i * bandPct}%`,
            height: `${bandPct}%`,
            background: color,
          }}
        />
      ))}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────

export default function ColorPalette({
  paletteData,
  showCopyButton = false,
  displayType = "block",
  width = 60,
  boxBorderSize = 1,
  boxBorderColor = "#ccc",
  displayTitle = true,
  fontColor = "#333",
  fontSize = 11,
  backgroundColor = "transparent",
  displayHexcode = true,
  parts = 1,
  saturation1 = 50,
  brightness1 = 50,
  saturation2 = 50,
  brightness2 = 50,
}: ColorPaletteProps) {
  if (!paletteData) return null;

  const handleCopySection = async (key: string, colors: string[]) => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify({ [key]: colors }, null, 2),
      );
    } catch {
      // Silent fail
    }
  };

  const effectiveParts = parts;
  const effectiveSat1 = saturation1;
  const effectiveBri1 = brightness1;
  const effectiveSat2 = saturation2;
  const effectiveBri2 = brightness2;

  return (
    <div
      className="color-palette-container"
      style={
        backgroundColor !== "transparent" ? { backgroundColor } : undefined
      }
    >
      {Object.keys(paletteData).map((key) => {
        if (Array.isArray(paletteData[key]) && paletteData[key]!.length > 0) {
          const colors = paletteData[key]!;
          return (
            <div key={key} className="palette-section">
              <div className="palette-section-header">
                {displayTitle && <h3>{key}</h3>}
                {showCopyButton && (
                  <button
                    onClick={() => handleCopySection(key, colors)}
                    className="copy-section-button"
                  >
                    Copy
                  </button>
                )}
              </div>

              {displayType === "table" ? (
                /* ── Table layout ── */
                <table className="palette-table">
                  <tbody>
                    {/* Color rows — one row per part */}
                    {Array.from({ length: effectiveParts }).map(
                      (_, partIdx) => (
                        <tr key={`part-${partIdx}`}>
                          {colors.map((hex, idx) => {
                            // Part 0 (index) → transformed with saturation1/brightness1
                            // Part 1 (index) → transformed with saturation2/brightness2
                            // Part 2 (index) → original
                            let displayHex = hex;
                            if (partIdx === 0) {
                              displayHex = applySB(
                                hex,
                                effectiveSat1,
                                effectiveBri1,
                              );
                            } else if (partIdx === 1) {
                              displayHex = applySB(
                                hex,
                                effectiveSat2,
                                effectiveBri2,
                              );
                            }
                            return (
                              <td
                                key={idx}
                                className="color-cell"
                                style={{
                                  background: displayHex,
                                  width: `${width}px`,
                                  height: `${width}px`,
                                  borderWidth: `${boxBorderSize}px`,
                                  borderColor: boxBorderColor,
                                }}
                              />
                            );
                          })}
                        </tr>
                      ),
                    )}
                    {/* Hex labels row — always shows original hex */}
                    {displayHexcode && (
                      <tr>
                        {colors.map((hex, idx) => (
                          <td
                            key={idx}
                            className="hex-cell"
                            style={{
                              ...(fontColor !== "#333" && { color: fontColor }),
                              fontSize: `${fontSize}px`,
                            }}
                          >
                            {hex}
                          </td>
                        ))}
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                /* ── Swatch layout ── */
                <div className={`colors display-${displayType}`}>
                  {colors.map((hex, idx) => (
                    <div key={idx} className="swatchBox">
                      <SplitSwatch
                        hex={hex}
                        parts={effectiveParts as 1 | 2 | 3}
                        saturation1={effectiveSat1}
                        brightness1={effectiveBri1}
                        saturation2={effectiveSat2}
                        brightness2={effectiveBri2}
                        displayType={displayType}
                        width={width}
                        borderSize={boxBorderSize}
                        borderColor={boxBorderColor}
                      />
                      {displayHexcode && (
                        <span
                          className="hex-label"
                          style={{
                            ...(fontColor !== "#333" && { color: fontColor }),
                            fontSize: `${fontSize}px`,
                          }}
                        >
                          {hex}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
