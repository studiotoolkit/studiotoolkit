import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useTheme } from "../ThemeContext";
import "./ColorPalettes.css";

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface PaletteAxis {
  label: string;
  desc: string;
}

interface PaletteItem {
  id: string;
  name: string;
  subtitle?: string;
  year?: number | string;
  authors?: string | string[];
  affiliation?: string;
  description: string;
  formula?: string;
  axes?: PaletteAxis[];
  flaw?: string;
  input?: string;
  bestFor?: string;
  references?: string[];
  accentColor: string;
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const PERCEPTUAL_SPACES = [
  {
    id: "cielab",
    name: "CIELAB (Lab*)",
    subtitle: "CIE 1976",
    year: 1976,
    authors: ["Günter Wyszecki", "W.S. Stiles"],
    affiliation: "Commission Internationale de l'Éclairage (CIE)",
    description:
      "The original perceptually uniform color space. A change of 1 ΔE unit appears equal in magnitude regardless of direction to a human observer. Uses D65 standard illuminant (6500K average daylight) as its white point.",
    formula:
      "L* = 116·f(Y/Yn) − 16 | a* = 500·[f(X/Xn) − f(Y/Yn)] | b* = 200·[f(Y/Yn) − f(Z/Zn)]",
    axes: [
      { label: "L*", desc: "0 = pure black, 100 = pure white" },
      { label: "a*", desc: "Negative = green, positive = red/magenta" },
      { label: "b*", desc: "Negative = blue, positive = yellow" },
    ],
    flaw: "The Abney Effect — blue shifts toward purple as saturation increases",
    input: "XYZ tristimulus values (D65 illuminant)",
    bestFor:
      "Scientific color measurement, print workflows, ΔE color difference calculations",
    references: [
      "Wyszecki, G. & Stiles, W.S. (1982). Color Science: Concepts and Methods. Wiley.",
      "CIE Publication 15 (2004). Colorimetry, 3rd ed.",
    ],
    accentColor: "#7c9cbf",
  },
  {
    id: "lch",
    name: "LCH (CIELCh)",
    subtitle: "CIE 1976 polar extension",
    year: 1976,
    authors: ["Commission Internationale de l'Éclairage"],
    affiliation: "CIE TC-1-48",
    description:
      "Polar form of CIELAB. Replaces the Cartesian a*b* plane with intuitive Chroma (C*) and Hue angle (h°). Enables hue-preserving lightness adjustments — the key to perceptually consistent design systems.",
    formula: "C* = √(a*² + b*²) | h° = atan2(b*, a*) × (180/π)",
    axes: [
      { label: "L*", desc: "0 = black, 100 = white" },
      { label: "C*", desc: "0 = achromatic, higher = more saturated" },
      {
        label: "h°",
        desc: "0° = red, 90° = yellow, 180° = green, 270° = blue",
      },
    ],
    flaw: "Hue non-constancy — perceived hue shifts as chroma changes (Abney Effect inherited from Lab)",
    input: "CIELAB coordinates",
    bestFor:
      "Hue-harmony generation, controlled saturation adjustments, palette interpolation",
    references: [
      "CIE Publication 159 (2004). A colour appearance model for colour management systems: CIECAM02.",
      "Fairchild, M.D. (2013). Color Appearance Models, 3rd ed. Wiley.",
    ],
    accentColor: "#c49a6c",
  },
  {
    id: "oklab",
    name: "OKLab",
    subtitle: "Ottosson 2020",
    year: 2020,
    authors: ["Björn Ottosson"],
    affiliation: "Independent researcher (Spotify Engineer)",
    description:
      "A modern perceptually uniform space designed to fix CIELAB's hue linearity problems. Achieved through an improved linear matrix fit using a large dataset of human color perception data. Dramatically better hue constancy — especially in blue-purple.",
    formula:
      "L = 0.2104542553·l + 0.7936177850·m − 0.0040720468·s (from cone responses l, m, s)",
    axes: [
      { label: "L", desc: "0 = black, 1 = white (normalized)" },
      { label: "a", desc: "Negative = green, positive = red/magenta" },
      { label: "b", desc: "Negative = blue, positive = yellow" },
    ],
    flaw: "Slightly less perceptually uniform than CAM16 in saturated blues; newer, less tooling support",
    input: "sRGB (with linearization)",
    bestFor:
      "Modern UI color systems, gradient generation, accessible color adjustment, this entire library",
    references: [
      "Ottosson, B. (2020). A perceptual color space for image processing. oklab.org",
      "Ottosson, B. (2021). OKLCH in CSS. CSS Color Level 4.",
    ],
    accentColor: "#7bb87b",
  },
  {
    id: "oklch",
    name: "OKLCH",
    subtitle: "Ottosson 2020 — polar form",
    year: 2020,
    authors: ["Björn Ottosson", "Chris Lilley (CSS4)"],
    affiliation: "W3C CSS Working Group",
    description:
      "Polar form of OKLab. The combination of OKLab's perceptual uniformity with LCH's intuitive polar coordinates makes OKLCH the current gold standard for design-system color generation. Native CSS support since 2023.",
    formula:
      "C = √(a² + b²) | H = atan2(b, a) × (180/π) [same structure as CIELCh, better perceptual base]",
    axes: [
      { label: "L", desc: "0–1, perceptual lightness" },
      { label: "C", desc: "0–~0.4, chroma/saturation" },
      { label: "H", desc: "0–360°, hue angle" },
    ],
    flaw: "Not all OKLCH values map to in-gamut sRGB — gamut clipping required",
    input: "OKLab or sRGB",
    bestFor:
      "This library's primary color space. 60–30–10 role selection, all gradient generation",
    references: [
      "Ottosson, B. (2020). oklab.org",
      "Lilley, C. et al. (2023). CSS Color Level 4. W3C Candidate Recommendation.",
    ],
    accentColor: "#a07bc0",
  },
  {
    id: "hct",
    name: "HCT",
    subtitle: "Google Material 2021",
    year: 2021,
    authors: ["Joseph Zhizhen Le", "Romain Doré", "Behdad Esfahbod"],
    affiliation: "Google Material Design Team",
    description:
      "Hue-Chroma-Tone space combining the hue accuracy of CAM16 with the tone linearity of CIELAB L*. Powers Google's Material You dynamic theming. Scientifically rigorous yet optimized for device display gamuts.",
    formula:
      "Hue and Chroma from CAM16-UCS | Tone = L* from CIELAB (Y-correlated luminance)",
    axes: [
      { label: "Hue", desc: "0–360°, from CAM16 (perceptually accurate)" },
      { label: "Chroma", desc: "0+, from CAM16 (device-dependent ceiling)" },
      { label: "Tone", desc: "0–100, identical to CIELAB L*" },
    ],
    flaw: "Computationally expensive; requires full CAM16 forward/inverse. Not yet in CSS.",
    input: "sRGB + viewing conditions (XYZ, adapting white)",
    bestFor:
      "Dynamic theming engines, accessible tonal palettes, adaptive dark/light mode",
    references: [
      "Le, J.Z. et al. (2021). Material Color Utilities. github.com/material-foundation/material-color-utilities",
      "Li, C. et al. (2017). Comprehensive colour appearance model (CAM16). Color Research & Application.",
    ],
    accentColor: "#5ba4cf",
  },
  {
    id: "cam16",
    name: "CAM16",
    subtitle: "Li et al. 2017",
    year: 2017,
    authors: ["Changjun Li", "Zhiqiang Li", "Zhifei Wang", "Yang Xu"],
    affiliation: "Ningbo University / Rochester Institute of Technology",
    description:
      "Comprehensive Color Appearance Model. Supersedes CIECAM02 with improved hue linearity, a simplified forward model, and better performance under diverse viewing conditions. Currently the most accurate model for human color appearance.",
    formula:
      "J (lightness), C (chroma), h (hue), M (colorfulness), s (saturation) — all from adapted cone responses via HPE matrix",
    axes: [
      { label: "J", desc: "Lightness (0–100)" },
      { label: "C or M", desc: "Chroma or Colorfulness" },
      { label: "h", desc: "Hue angle 0–360°" },
    ],
    flaw: "Six viewing parameters required; high computational cost; no direct CSS mapping",
    input:
      "XYZ + viewing conditions (luminance, white point, background, surround)",
    bestFor:
      "Image processing pipelines, HDR rendering, tone mapping, the underpinning of HCT",
    references: [
      "Li, C. et al. (2017). Comprehensive colour appearance model (CAM16). Color Research & Application 42(6).",
      "Fairchild, M.D. (2013). Color Appearance Models. Wiley-IS&T.",
    ],
    accentColor: "#e07a5f",
  },
  {
    id: "hsl",
    name: "HSL",
    subtitle: "Joblove & Greenberg 1978",
    year: 1978,
    authors: ["George Joblove", "Donald Greenberg"],
    affiliation: "Cornell University Program of Computer Graphics",
    description:
      "Hue-Saturation-Lightness, the first human-intuitive color model designed for computer graphics. A simple geometric transformation of the RGB cube. Despite well-known perceptual non-uniformity, it remains the most widely used model in design tools due to its simplicity.",
    formula:
      "H = atan2 component-based | S = (max−min)/(1−|2L−1|) | L = (max+min)/2",
    axes: [
      { label: "H", desc: "0–360°, hue angle" },
      { label: "S", desc: "0–100%, saturation" },
      { label: "L", desc: "0–100%, lightness (50% = pure color)" },
    ],
    flaw: "Severe perceptual non-uniformity — yellow at L=50% is far brighter than blue at L=50%",
    input: "sRGB [0,1]",
    bestFor:
      "CSS color editing, design tool color pickers, quick hue shifting — NOT for palette generation",
    references: [
      "Joblove, G.H. & Greenberg, D. (1978). Color spaces for computer graphics. SIGGRAPH '78.",
      "Foley, J. et al. (1990). Computer Graphics: Principles and Practice. Addison-Wesley.",
    ],
    accentColor: "#f2a65a",
  },
  {
    id: "hsv",
    name: "HSV / HSB",
    subtitle: "Smith 1978",
    year: 1978,
    authors: ["Alvy Ray Smith"],
    affiliation: "NYIT Computer Graphics Lab / Lucasfilm",
    description:
      "Hue-Saturation-Value (also called HSB: Brightness). Created the same year as HSL but represents the RGB cube from the Value (brightness) vertex rather than the midpoint. Preferred by painters and artists — at V=100%, S=0% gives pure white, matching how adding white to a pigment works.",
    formula: "V = max(R,G,B) | S = (max−min)/max | H = atan2 component-based",
    axes: [
      { label: "H", desc: "0–360°, hue angle" },
      { label: "S", desc: "0–100%, saturation from grey to pure color" },
      { label: "V", desc: "0–100%, value/brightness" },
    ],
    flaw: "Perceptually non-uniform (shared with HSL); different lightness model than HSL",
    input: "sRGB [0,1]",
    bestFor:
      "Paint programs, artist-facing tools, image processing operations like brightness adjustment",
    references: [
      "Smith, A.R. (1978). Color gamut transform pairs. SIGGRAPH '78.",
      "Smith, A.R. (1996). History of the HSV/HSB color model. alvyray.com",
    ],
    accentColor: "#de8a9c",
  },
  {
    id: "jzazbz",
    name: "JzAzBz",
    subtitle: "Safdar et al. 2017",
    year: 2017,
    authors: [
      "Muhammad Safdar",
      "Guihua Cui",
      "Youn Jin Kim",
      "Ming Ronnier Luo",
    ],
    affiliation: "University of Leeds / Zhejiang University",
    description:
      "Perceptually uniform color space designed specifically for High Dynamic Range (HDR) and Wide Color Gamut (WCG) displays. Uses a PQ electro-optical transfer function to model the non-linear luminance sensitivity of human vision across HDR ranges (up to 10,000 nits).",
    formula:
      "Jz from PQ-encoded luminance via Izazbz intermediate | Az, Bz are opponent channels",
    axes: [
      { label: "Jz", desc: "Lightness, 0 = black, 1 = SDR white (100 nits)" },
      { label: "Az", desc: "Red-green opponent channel" },
      { label: "Bz", desc: "Yellow-blue opponent channel" },
    ],
    flaw: "Higher computational cost; primarily designed for HDR — less advantage in SDR contexts",
    input: "XYZ (absolute luminance in cd/m²)",
    bestFor:
      "HDR video grading, wide-gamut display color management, HDR image processing",
    references: [
      "Safdar, M. et al. (2017). Perceptually uniform color space for image signals including high dynamic range. Optics Express 25(13).",
    ],
    accentColor: "#6cb4c8",
  },
  {
    id: "ipt",
    name: "IPT",
    subtitle: "Ebner & Fairchild 1998",
    year: 1998,
    authors: ["Fritz Ebner", "Mark D. Fairchild"],
    affiliation: "Rochester Institute of Technology (RIT)",
    description:
      "Designed specifically to solve hue non-constancy (the Abney Effect). The I-P-T axes are rotated to align with the physiological chromatic adaptation channels, producing the most hue-constant space of its era. Still widely used in image processing and tone mapping algorithms.",
    formula:
      "I = 0.4000·L + 0.4000·M + 0.2000·S (from adapted LMS) | P and T from rotated opponent channels",
    axes: [
      { label: "I", desc: "Intensity (lightness)" },
      { label: "P", desc: "Protan axis (red-green)" },
      { label: "T", desc: "Tritan axis (yellow-blue)" },
    ],
    flaw: "Uses a fixed gamma (0.43) rather than true perceptual uniformity; slightly non-uniform in blues",
    input: "XYZ D65",
    bestFor:
      "Tone mapping operators, HDR-to-SDR conversion, hue-preserving image edits",
    references: [
      "Ebner, F. & Fairchild, M.D. (1998). Development and testing of a color space (IPT) with improved hue uniformity. IS&T 6th Color Imaging Conference.",
    ],
    accentColor: "#8fbf8f",
  },
];

const HARMONY_PATTERNS = [
  {
    id: "analogous",
    name: "Analogous",
    year: "Classical (pre-1800)",
    authors: ["Johann Wolfgang von Goethe", "Michel Eugène Chevreul"],
    description:
      "Three adjacent hues on the color wheel (±30°). Creates calm, unified, naturally harmonious palettes. Goethe described analogous relationships in Zur Farbenlehre (1810) as expressing emotional continuity.",
    formula: "Base H, H±30°",
    swatchCount: 3,
    references: [
      "Goethe, J.W. (1810). Theory of Colours.",
      "Itten, J. (1961). The Art of Color.",
    ],
    accentColor: "#7fb5d5",
  },
  {
    id: "complementary",
    name: "Complementary",
    year: 1839,
    authors: ["Michel Eugène Chevreul"],
    affiliation: "Manufactures Royales des Gobelins, Paris",
    description:
      "Two hues directly opposite (180°) on the wheel. Maximum contrast and visual vibration. Chevreul's law of simultaneous contrast (1839) quantified why complementary pairs make each other appear more intense.",
    formula: "H, H+180°",
    swatchCount: 2,
    references: [
      "Chevreul, M.E. (1839). De la loi du contraste simultané des couleurs.",
    ],
    accentColor: "#e8785a",
  },
  {
    id: "splitComplementary",
    name: "Split-Complementary",
    year: "~1900",
    authors: ["Johannes Itten"],
    affiliation: "Bauhaus, Weimar",
    description:
      "The two colors flanking the complement (±30° from 180°). Retains the visual energy of a complementary pair with lower tension — described by Itten as 'a more nuanced form of contrast'.",
    formula: "H, H+150°, H+210°",
    swatchCount: 3,
    references: ["Itten, J. (1961). The Art of Color. Van Nostrand Reinhold."],
    accentColor: "#c87aaa",
  },
  {
    id: "triadic",
    name: "Triadic",
    year: "Classical",
    authors: ["Ogden Rood"],
    affiliation: "Columbia University",
    description:
      "Three hues equally spaced at 120° intervals. Provides strong visual contrast while retaining balance and richness. Rood's empirical color work (1879) formalized equal spacing as maximally balanced.",
    formula: "H, H+120°, H+240°",
    swatchCount: 3,
    references: [
      "Rood, O.N. (1879). Modern Chromatics. Appleton.",
      "Munsell, A.H. (1905). A Color Notation.",
    ],
    accentColor: "#6dbc8d",
  },
  {
    id: "tetradic",
    name: "Tetradic (Rectangle)",
    year: "~1920",
    authors: ["Johannes Itten", "Josef Albers"],
    affiliation: "Bauhaus",
    description:
      "Four colors forming a rectangle on the wheel (two complementary pairs). Rich and complex — requires one hue to dominate to avoid visual chaos. Albers explored rectangular color relationships in his Yale Color & Design courses.",
    formula: "H, H+60°, H+180°, H+240°",
    swatchCount: 4,
    references: [
      "Albers, J. (1963). Interaction of Color. Yale University Press.",
    ],
    accentColor: "#d4a84b",
  },
  {
    id: "square",
    name: "Square",
    year: "~1920",
    authors: ["Johannes Itten"],
    affiliation: "Bauhaus, Weimar",
    description:
      "Four equidistant hues at 90° intervals — the symmetric special case of tetradic. Maximum diversity with inherent balance. Itten classified this as one of the seven fundamental color contrasts.",
    formula: "H, H+90°, H+180°, H+270°",
    swatchCount: 4,
    references: [
      "Itten, J. (1961). The Art of Color.",
      "Munsell, A.H. (1905). A Color Notation.",
    ],
    accentColor: "#7b9fd4",
  },
  {
    id: "accentedAnalogous",
    name: "Accented Analogous",
    year: "~1961",
    authors: ["Johannes Itten"],
    description:
      "Analogous trio (H±30°) plus the direct complement as an accent. Harmonious base with a deliberate visual pop point. Directly described in Itten's seven color contrasts as 'contrast of hue with harmony base'.",
    formula: "H−30°, H, H+30°, H+180°",
    swatchCount: 4,
    references: ["Itten, J. (1961). The Art of Color."],
    accentColor: "#b07adb",
  },
  {
    id: "doubleSplitComplementary",
    name: "Double Split-Complementary",
    year: "~1900s",
    authors: ["Herbert Ives", "Faber Birren"],
    description:
      "Both the base color and its complement are split, producing six colors. Complex, vibrant, and rich — used in textile design and polychromatic illustration. Birren studied these hexagonal relationships as 'complete harmonies'.",
    formula: "H, H+30°, H+150°, H+180°, H+210°, H+240°",
    swatchCount: 6,
    references: [
      "Birren, F. (1934). Color Dimensions.",
      "Ives, H.E. (1923). The transformation of color mixture equations. Journal of the Franklin Institute.",
    ],
    accentColor: "#5ab8c5",
  },
  {
    id: "ambiguous",
    name: "Ambiguous",
    year: "~1990",
    authors: ["Bruce MacEvoy"],
    affiliation: "handprint.com",
    description:
      "Three hues spaced ~70–80° apart — close enough to create tension between analogous and triadic. MacEvoy identified this zone of harmonic ambiguity as producing intentionally uneasy, complex, or avant-garde color relationships used in contemporary art and design.",
    formula: "H+15°, H+85°, H+145° (non-canonical spacing)",
    swatchCount: 3,
    references: [
      "MacEvoy, B. (2005). Color Vision. handprint.com/HP/WCL/color18a.html",
    ],
    accentColor: "#d48b70",
  },
  {
    id: "monochromatic",
    name: "Monochromatic",
    year: "Classical",
    authors: ["Albert Henry Munsell"],
    affiliation: "Massachusetts Normal Art School",
    description:
      "Single hue with systematically varied lightness across the full range (L 15%–85%). Munsell's value scale (1905) established equal lightness steps as the foundation for all tonal design systems.",
    formula: "Fixed H, S; L = 15% + (70% / (n−1)) × i",
    swatchCount: "n",
    references: [
      "Munsell, A.H. (1905). A Color Notation. Geo. H. Ellis Co.",
      "Munsell, A.H. (1915). Atlas of the Munsell Color System.",
    ],
    accentColor: "#8faacc",
  },
  {
    id: "monochromaticTintShade",
    name: "Monochromatic Tint+Shade",
    year: "~1905",
    authors: ["Albert Henry Munsell", "Wilhelm Ostwald"],
    description:
      "Single hue with simultaneous lightness ramp and saturation fade. Emulates the real-world effect of adding white (tint) or black (shade) to a pigment. Ostwald's color solid formalized this in 1916.",
    formula: "Fixed H; S decreases −2% per step; L = 10% + (80% / (n−1)) × i",
    swatchCount: "n",
    references: [
      "Ostwald, W. (1916). Die Farbenfibel (The Color Primer).",
      "Munsell, A.H. (1905). A Color Notation.",
    ],
    accentColor: "#aabfb5",
  },
];

const DATA_VIS_PATTERNS = [
  {
    id: "sequential",
    name: "Sequential",
    year: 1994,
    authors: ["Cynthia Brewer"],
    affiliation: "Penn State University — ColorBrewer",
    description:
      "Light-to-dark continuous ramp along a single hue. Encodes ordered data where higher values map to darker, more saturated colors. Lightness spans from near-white (0.92) to dark (0.25) in OKLab space.",
    formula:
      "L: lerp(0.92, 0.25, t) | C: constant from base | H: constant from base",
    references: [
      "Brewer, C.A. (1994). Color use guidelines for mapping. Visualization in Modern Cartography.",
      "colorbrewer2.org",
    ],
    accentColor: "#7baed1",
  },
  {
    id: "diverging",
    name: "Diverging",
    year: 1994,
    authors: ["Cynthia Brewer"],
    affiliation: "Penn State University — ColorBrewer",
    description:
      "Two hues meeting at a perceptually neutral midpoint. Encodes data with a meaningful center value (zero, average, threshold). Midpoint is near-white (C=0.02) — human vision is most sensitive to deviations from neutral.",
    formula: "colorA (L=0.4) → neutral (L=0.9, C=0.02) → colorB (L=0.4)",
    references: [
      "Brewer, C.A. (1994). ColorBrewer. colorbrewer2.org",
      "Harrower, M. & Brewer, C.A. (2003). ColorBrewer.org: An Online Tool for Selecting Colour Schemes for Maps. The Cartographic Journal.",
    ],
    accentColor: "#d4826a",
  },
  {
    id: "qualitative",
    name: "Qualitative",
    year: 1994,
    authors: ["Cynthia Brewer", "Mark Harrower"],
    affiliation: "ColorBrewer / Penn State",
    description:
      "Perceptually distinct categoricals for unordered nominal data. Hues distributed evenly around the OKLCH wheel from the base hue. Lightness and chroma are held constant so no category visually implies greater importance.",
    formula: "H = (baseH + 360/n × i) % 360 | L = 0.60 | C = max(baseC, 0.12)",
    references: [
      "Brewer, C.A. et al. (1997). Mapping mortality: Evaluating color schemes for choropleth maps. Annals AAG.",
      "Ware, C. (2000). Information Visualization: Perception for Design.",
    ],
    accentColor: "#7dbf99",
  },
  {
    id: "bivariate",
    name: "Bivariate",
    year: 2003,
    authors: ["Cynthia Brewer", "Linda Pickle"],
    affiliation: "Penn State / National Cancer Institute",
    description:
      "2×2 color matrix encoding two independent variables simultaneously. Variable A maps to hue axis; Variable B to lightness axis. The four corners represent the extreme combinations of both variables.",
    formula:
      "[A-low B-low, A-high B-low, A-low B-high, A-high B-high] via OKLCH corner interpolation",
    references: [
      "Brewer, C.A. & Pickle, L. (2002). Evaluation of methods for classifying epidemiological data on choropleth maps in series. Annals AAG.",
      "Wainer, H. & Francolini, C. (1980). An empirical inquiry concerning human understanding of two-variable color maps. The American Statistician.",
    ],
    accentColor: "#b898c8",
  },
  {
    id: "cyclical",
    name: "Cyclical",
    year: 2003,
    authors: ["Moritz Stefaner", "Cynthia Brewer"],
    description:
      "Hue wheel traversal that wraps back to start — for periodic or cyclic data (time of day, compass bearings, seasons). Lightness and chroma held constant; the last swatch approaches but does not equal the first.",
    formula:
      "H = (baseH + 360 × i/n) % 360 | L and C constant | t = i/n (not i/(n−1))",
    references: [
      "Ware, C. (2004). Information Visualization. Morgan Kaufmann.",
      "Zeileis, A. et al. (2009). Escaping RGBland. Computational Statistics & Data Analysis.",
    ],
    accentColor: "#c8a868",
  },
  {
    id: "spectral",
    name: "Spectral",
    year: 1994,
    authors: ["Cynthia Brewer"],
    affiliation: "ColorBrewer — most-used diverging scheme",
    description:
      "Full rainbow diverging arc — red/orange (warm) through yellow/green (neutral) to blue/purple (cool). The most visually striking data visualization palette. Brand-aligned by offsetting all hue anchors by the input color's hue.",
    formula:
      "Anchors [0°,30°,60°,120°,180°,240°,280°] + baseH offset | L arc [0.45,0.60,0.80,0.72,0.62,0.50,0.42]",
    references: [
      "Brewer, C.A. (1994). ColorBrewer. colorbrewer2.org",
      "Light, A. & Bartlein, P.J. (2004). The end of the rainbow? Color schemes for improved data graphics. Eos.",
    ],
    accentColor: "#e07060",
  },
  {
    id: "stepped",
    name: "Stepped",
    year: 1996,
    authors: ["Jacques Bertin", "Cynthia Brewer"],
    affiliation: "EHESS Paris / Penn State",
    description:
      "Discrete class breaks with equal perceptual lightness steps — for choropleth maps and classified data. Unlike sequential gradients, steps are quantized in OKLab space so boundaries appear as distinct classes, not continuous shading.",
    formula:
      "L = Lmax − stepSize × (i + 0.5) | stepSize = (0.88 − 0.30) / n | C = baseC × 0.85",
    references: [
      "Bertin, J. (1967). Sémiologie graphique. Mouton/Gauthier-Villars.",
      "Brewer, C.A. (1997). Spectral schemes: Controversial color use on maps. Cartography and GIS.",
    ],
    accentColor: "#6aab8a",
  },
];

const ALGORITHMIC_PATTERNS = [
  {
    id: "random",
    name: "Random (Seeded)",
    year: 2005,
    authors: ["Brian Wyvill", "various"],
    description:
      "Randomly generated colors with constrained L and C for readability. Seeded by the base color's hex value for determinism (mulberry32 PRNG). Hue is fully random within [0,360°]; L constrained to [0.40,0.75]; C to [0.08,0.22].",
    formula:
      "mulberry32(seed) → [0,1] | H = rand×360 | L = lerp(0.40,0.75,rand) | C = lerp(0.08,0.22,rand)",
    references: [
      "Wyvill, B. et al. (1986). Soft objects. The Visual Computer.",
      "Tommy Ettinger (2020). mulberry32 — A fast, high-quality 32-bit PRNG.",
    ],
    accentColor: "#9ab87a",
  },
  {
    id: "goldenRatio",
    name: "Golden Ratio",
    year: 2007,
    authors: ["Martin Roberts"],
    affiliation: "Independent mathematician — extremelearning.com.au",
    description:
      "Hues stepped by the golden angle (137.508°) — derived from the golden ratio φ = (1+√5)/2. Each successive hue is maximally separated from all previous hues, never repeating. Originally observed in phyllotaxis (sunflower seed spirals).",
    formula: "H_i = (baseH + 137.50776°× i) % 360 | L = 0.60 | C = baseC",
    references: [
      "Roberts, M. (2018). The unreasonable effectiveness of quasirandom sequences. extremelearning.com.au",
      "Vogel, H. (1979). A better way to construct the sunflower head. Mathematical Biosciences.",
    ],
    accentColor: "#d4aa5a",
  },
  {
    id: "noise",
    name: "Value Noise",
    year: 1985,
    authors: ["Ken Perlin"],
    affiliation: "NYU / Lucasfilm",
    description:
      "L, C, and H channels driven by independent 1D value noise functions with smoothstep interpolation. Creates organic, flowing palettes that feel natural rather than mathematical. Seeded from base color for reproducibility.",
    formula:
      "noiseL(t×3.5), noiseC(t×4.0), noiseH(t×2.5) — Perlin-style with gradient interpolation",
    references: [
      "Perlin, K. (1985). An image synthesizer. SIGGRAPH '85.",
      "Perlin, K. (2002). Improving noise. SIGGRAPH '02.",
    ],
    accentColor: "#7ac4c8",
  },
  {
    id: "temperature",
    name: "Blackbody Temperature",
    year: 1900,
    authors: ["Max Planck", "implemented by Mitchell Charity"],
    affiliation: "University of Kiel / whnt.com",
    description:
      "Maps physical temperature (1000K–12000K) to the chromaticity of a perfect blackbody radiator. Converts K → CIE xy → sRGB. The most physically grounded palette — candle flame (1800K) to blue sky (8000K+). Planck's radiation law (1900).",
    formula:
      "Planck radiation → CIE xy chromaticity → XYZ → linear sRGB | K = lerp(1000, 12000, t)",
    references: [
      "Planck, M. (1900). Distribution of energy in the normal spectrum. Annalen der Physik.",
      "Charity, M. (2001). What color is a blackbody radiator? whnt.com",
    ],
    accentColor: "#e8a060",
  },
  {
    id: "bezierInterpolation",
    name: "Bézier Interpolation",
    year: 1962,
    authors: ["Pierre Bézier", "Paul de Casteljau"],
    affiliation: "Renault / Citroën",
    description:
      "Cubic Bézier curve through OKLab space with control points placed at ±0.3 lightness offsets from the input colors. Creates smooth S-curved gradients with natural midtone richness — the mathematical basis of all digital curve tools.",
    formula:
      "B(t) = (1−t)³P₀ + 3(1−t)²tP₁ + 3(1−t)t²P₂ + t³P₃ | P₀,P₃ = endpoints in OKLab",
    references: [
      "Bézier, P. (1966). Définition numérique des courbes et surfaces. Automatisme.",
      "de Casteljau, P. (1959). Courbes et surfaces à pôles. Citroën internal report.",
    ],
    accentColor: "#8898d8",
  },
  {
    id: "easeInOut",
    name: "Ease In-Out",
    year: 1984,
    authors: ["Frank Thomas", "Ollie Johnston", "Robert Penner"],
    affiliation: "Disney Animation / Flash community",
    description:
      "Cubic easing function (t²·(3−2t)) applied to the interpolation parameter before sampling OKLab. Slow start, fast middle, slow end — the same timing function used in Disney's 'slow in, slow out' animation principle.",
    formula: "t_eased = t²·(3−2t) | then linear interp in OKLab",
    references: [
      "Thomas, F. & Johnston, O. (1981). Disney Animation: The Illusion of Life.",
      "Penner, R. (2002). Robert Penner's Programming Macromedia Flash MX.",
    ],
    accentColor: "#c87ab0",
  },
  {
    id: "blackbody",
    name: "Blackbody (full spectrum)",
    year: 1900,
    authors: ["Max Planck", "Tanner Helland"],
    description:
      "Full spectral blackbody sweep from 1000K (deep red glow) to 40000K (extreme blue-white), covering the entire visible thermal emission range. Uses Helland's fast algorithm — approximate polynomial fits to Planck's exact chromaticity.",
    formula:
      "Kelvin → RGB via Helland's algorithm: polynomial fits for R, G, B from K temperature",
    references: [
      "Planck, M. (1900). Über irreversible Strahlungsvorgänge. Preuss. Akad. Wiss.",
      "Helland, T. (2012). How to Convert Temperature (K) to RGB. tanner.xyz",
    ],
    accentColor: "#e89060",
  },
  {
    id: "fibonacci",
    name: "Fibonacci",
    year: 1202,
    authors: ["Leonardo Fibonacci", "applied to color by Martin Roberts"],
    description:
      "Hue angles derived from successive Fibonacci numbers modulo 360°. Produces quasi-random hue sequences with low discrepancy — adjacent hues are well separated but the sequence has mathematical structure. Related to the golden ratio method.",
    formula:
      "F_i = Fibonacci(i) mod 360 | H_i = (baseH + F_i) % 360 | L = 0.62 | C = baseC",
    references: [
      "Fibonacci, L. (1202). Liber Abaci.",
      "Roberts, M. (2018). Quasi-random sequences. extremelearning.com.au",
    ],
    accentColor: "#98c888",
  },
  {
    id: "harmonicSeries",
    name: "Harmonic Series",
    year: 1636,
    authors: ["Marin Mersenne", "applied to color 2010s"],
    affiliation: "Académie française",
    description:
      "Hue angles follow the harmonic series (1, 1/2, 1/3, 1/4, ...) × 360°. Derives color relationships from music theory — just as harmonic overtones create consonant chords, harmonic hue fractions create visually consonant palettes.",
    formula:
      "H_i = (baseH + 360/i) % 360 for i=1..n | L oscillates with sin(i×0.8)×0.2 + 0.55",
    references: [
      "Mersenne, M. (1636). Harmonie Universelle.",
      "Itten, J. (1961). The Art of Color — parallels between music and color harmony.",
    ],
    accentColor: "#7ab8c8",
  },
  {
    id: "sinusoidal",
    name: "Sinusoidal",
    year: "1800s",
    authors: ["Euler / applied by Dave Green"],
    description:
      "L, C, and H channels driven by phase-shifted sinusoidal waves. Produces smooth, cyclical color variations with guaranteed periodicity. The trigonometric foundation of all cyclic color generation, including cubehelix.",
    formula:
      "H = baseH + 30×sin(2πt) | C = baseC + 0.05×sin(4πt+π/4) | L = 0.55 + 0.20×sin(2πt+π/3)",
    references: [
      "Green, D.A. (2011). A colour scheme for the display of astronomical intensity images. Bulletin of the Astronomical Society of India 39.",
    ],
    accentColor: "#d4a870",
  },
  {
    id: "cubehelix",
    name: "Cubehelix",
    year: 2011,
    authors: ["Dave Green"],
    affiliation: "Cavendish Laboratory, Cambridge University",
    description:
      "Traverses a helix through the RGB color cube while monotonically increasing luminance. Every step along the helix increases brightness — designed for scientific visualization where black-and-white printouts must preserve data order. Used in astrophysics image display.",
    formula:
      "R,G,B = helix(start, rotations, hue, gamma) | luminance monotonically increases | helix radius = hue parameter",
    references: [
      "Green, D.A. (2011). A colour scheme for the display of astronomical intensity images. Bull. Astr. Soc. India 39, 289–295.",
      "matplotlib.org — cubehelix colormap (2012)",
    ],
    accentColor: "#8890c0",
  },
];

const CONTRAST_PATTERNS = [
  {
    id: "contrastScale",
    name: "Contrast Scale",
    year: 1931,
    authors: ["International Commission on Illumination (CIE)"],
    description:
      "Simple lightness ramp from black to white along the base hue using sRGB gamma curve (power 0.8). Provides a tonal foundation for design systems.",
    formula: "L = (i/(n−1))^0.8 in HSL space",
    references: ["CIE Publication 15 (2004). Colorimetry."],
    accentColor: "#aaaaaa",
  },
  {
    id: "accessible",
    name: "Accessible Pairs",
    year: 1999,
    authors: ["Gregg Vanderheiden", "Wayne Donnelly"],
    affiliation: "W3C Web Accessibility Initiative",
    description:
      "Alternating foreground/background pairs, all verified at WCAG AA (4.5:1 minimum contrast ratio). Dark foregrounds paired with light backgrounds of the same hue family. Implements binary search to guarantee passing contrast.",
    formula:
      "Binary search on HSL L: find minimum darkening/lightening that achieves ≥4.5:1 WCAG ratio",
    references: [
      "WCAG 2.0 SC 1.4.3 (2008). Contrast (Minimum). W3C.",
      "Vanderheiden, G. & Donnelly, W. (1999). Web Content Accessibility Guidelines.",
    ],
    accentColor: "#6aabdd",
  },
  {
    id: "wcag",
    name: "WCAG Verified",
    year: 2008,
    authors: ["Wayne Dick", "Tom Jewett", "Marc Majewski"],
    affiliation: "W3C Accessibility Guidelines Working Group",
    description:
      "Four fixed target types cycling: AA-on-white (4.5:1), AAA-on-white (7:1), AA-on-black (4.5:1), AAA-on-black (7:1). Per-cycle saturation reduction and lightness spread ensures visually distinct swatches that all guarantee compliance.",
    formula:
      "4 target tiers × cycles | binary search per slot | s ×= (1−0.3×cycle) | lShift ±0.08",
    references: [
      "WCAG 2.1 (2018). Success Criterion 1.4.3. W3C.",
      "Snyder, J. et al. (2019). WCAG 2.1 Understanding Docs.",
    ],
    accentColor: "#4db88a",
  },
  {
    id: "apca",
    name: "APCA",
    year: 2022,
    authors: ["Andrew Somers"],
    affiliation: "W3C Accessibility Guidelines Working Group (WCAG 3.x)",
    description:
      "Advanced Perceptual Contrast Algorithm — the WCAG 3.x successor to the 2.x ratio formula. Uses spatial frequency-weighted luminance and the Bouma-Legge model of visual acuity. Returns signed Lc values: |Lc|≥45 large text, ≥60 normal, ≥75 body copy.",
    formula:
      "Lc = (Ybg^0.56 − Ytxt^0.57) × 1.14 − 0.027 (light bg) | Power-law encoding per Bouma model",
    references: [
      "Somers, A.W. (2022). APCA-W3 0.0.98G-4g. w3.org/WAI/WCAG3/Explainer",
      "Legge, G.E. & Bigelow, C.A. (2011). Does print size matter for reading? A review of findings from vision science and typography. Journal of Vision.",
    ],
    accentColor: "#d4784a",
  },
  {
    id: "colorBlindSafe",
    name: "Color Blind Safe",
    year: 2009,
    authors: ["Gustavo Machado", "Manuel Oliveira", "Leandro Fernandes"],
    affiliation: "Universidade Federal do Rio Grande do Sul",
    description:
      "Palette guaranteed distinguishable for deuteranopia and protanopia (red-green color blindness, ~8% of males). Uses clinical simulation matrices (Machado et al. 2009) to verify each swatch pair maintains ≥0.12 Euclidean distance in the simulated-vision space.",
    formula:
      "Deuteranopia matrix: R→0.29R+0.71G | Protanopia matrix: R→0.11R+0.89G | Euclidean distance > 0.12",
    references: [
      "Machado, G.M., Oliveira, M.M. & Fernandes, L.A. (2009). A physiologically-based model for simulation of color vision deficiency. IEEE TVCG.",
      "Brettel, H. et al. (1997). Computerized simulation of color appearance for dichromats. JOSA A.",
    ],
    accentColor: "#7ab8a8",
  },
  {
    id: "colorTokenized",
    name: "Tokenized Design System",
    year: 2014,
    authors: ["Jina Anne", "Salesforce Lightning Design System team"],
    affiliation: "Salesforce / Design Tokens Community Group",
    description:
      "Semantic token roles (background, surface, border, muted, default, emphasis, strong, onColor, error, success) generated from a single brand color. The concept of design tokens was introduced at Salesforce in 2014 and is now a W3C Community Group standard.",
    formula:
      "Fixed L,S per semantic role | error → H=0° (red) | success → H=142° (green) | others inherit brand H",
    references: [
      "Anne, J. (2014). Designing with Design Tokens. Clarity Conf.",
      "Design Tokens Community Group (2022). Design Tokens Format Module. W3C.",
    ],
    accentColor: "#9888c8",
  },
  {
    id: "highContrast",
    name: "High Contrast (WCAG AAA)",
    year: 2018,
    authors: ["Léonie Watson", "Patrick H. Lauke"],
    affiliation: "W3C Accessibility Guidelines Working Group",
    description:
      "Minimum 7:1 contrast (WCAG AAA) for all swatches — designed for low-vision users. Dark side (L 5%–28%) with fading saturation; light side (L 65%–98%) with reduced saturation. Uses forced-search per slot to guarantee no two slots converge to the same value.",
    formula:
      "AAA=7.0 | Dark: adjustFromL(startL, direction='dark') | Light: adjustFromL(startL, direction='light') | s fades to 0 on dark side",
    references: [
      "WCAG 2.1 SC 1.4.6 (2018). Contrast (Enhanced). W3C.",
      "Watson, L. & Lauke, P.H. (2018). Understanding SC 1.4.6. W3C.",
    ],
    accentColor: "#e8e8e8",
  },
];

const IMAGEEXTRACTION_PATTERNS = [
  {
    id: "kmeans",
    name: "K-Means Clustering",
    subtitle: "Lloyd 1957 / Forgy 1965",
    year: 1957,
    authors: ["Stuart P. Lloyd", "Edward W. Forgy"],
    affiliation: "Bell Telephone Laboratories / University of California",
    description:
      "Iterative centroid optimization in RGB space. The most widely used palette extraction algorithm. Each pixel is assigned to the nearest of k centroids by Euclidean distance; centroids are then recomputed as the mean of their assigned pixels. This two-step assignment–update loop repeats until centroids stop moving (convergence). Lloyd derived the algorithm in 1957 for pulse-code modulation quantization; Forgy independently published it in 1965. Its simplicity and parallelizability made it the dominant method in image processing, design tools, and machine learning.",
    formula:
      "Assign: cᵢ = argmin_j ||xᵢ − μⱼ||² | Update: μⱼ = (1/|Sⱼ|) Σᵢ∈Sⱼ xᵢ | Repeat until ||μⱼ(t) − μⱼ(t−1)|| < ε",
    axes: [
      {
        label: "k",
        desc: "Number of clusters = palette size (user-specified)",
      },
      {
        label: "Space",
        desc: "RGB by default; perceptual quality improves in OKLab",
      },
      {
        label: "Init",
        desc: "K-Means++ seeding (Arthur & Vassilvitskii 2007) reduces bad starts",
      },
    ],
    flaw: "Sensitive to initialization; can converge to local minima; equal cluster weighting ignores small but visually dominant accent colors",
    input:
      "Raw pixel array (any color space); typically downsampled for performance",
    bestFor:
      "General-purpose palette extraction, design tool color pickers, dominant-color APIs, machine learning feature generation",
    references: [
      "Lloyd, S.P. (1982). Least squares quantization in PCM. IEEE Trans. Information Theory 28(2). [Written 1957, published 1982]",
      "Forgy, E.W. (1965). Cluster analysis of multivariate data. Biometrics 21(3).",
      "Arthur, D. & Vassilvitskii, S. (2007). K-Means++: The advantages of careful seeding. SODA '07.",
    ],
    accentColor: "#7ab0d4",
  },
  {
    id: "medianCut",
    name: "Median Cut",
    subtitle: "Heckbert 1979",
    year: 1979,
    authors: ["Paul S. Heckbert"],
    affiliation: "UC Berkeley — SIGGRAPH '79",
    description:
      "Recursively bisects the bounding box of the current pixel set along its longest color axis. At each step the algorithm finds whichever of R, G, or B spans the widest range in the current bucket, then splits that bucket at its median value — guaranteeing equal pixel counts on both sides. Recursion halts when k buckets exist; the mean of each bucket becomes a palette entry. Heckbert's 1979 SIGGRAPH paper is the single most-cited work in color quantization and established the bounding-box approach that all subsequent tree-based methods extend.",
    formula:
      "Split axis: argmax(range(R), range(G), range(B)) | Split point: median value on chosen axis | Recurse until 2^depth = k buckets",
    axes: [
      { label: "Depth", desc: "Recursion levels; k = 2^depth palette entries" },
      { label: "Axis", desc: "Always the channel with maximum pixel range" },
      { label: "Split", desc: "Median pixel value (equal-count halves)" },
    ],
    flaw: "Ignores color distribution within each box — a bucket with one vivid pixel and 999 grey pixels splits the grey range, discarding the vivid color",
    input:
      "Pixel array; works best on images with well-separated color clusters",
    bestFor:
      "GIF and PNG-8 quantization, thumbnail palette generation, any context requiring a fast deterministic O(n log n) algorithm",
    references: [
      "Heckbert, P.S. (1979). Color image quantization for frame buffer display. SIGGRAPH '82 Computer Graphics 16(3). [Presented 1979]",
      "Wan, S.J. et al. (1990). Variance-based color image quantization for frame buffer display. Color Research & Application 15(1).",
    ],
    accentColor: "#d4a870",
  },
  {
    id: "dominant",
    name: "Dominant Color",
    subtitle: "HSL histogram peak-finding",
    year: "2000s",
    authors: ["Google Images / YouTube infrastructure team"],
    affiliation: "Google LLC",
    description:
      "Histogram peak-finding in HSL hue space. Divides the hue wheel into equal buckets (typically 36 × 10° slots), counts pixels in each bucket after filtering near-grey and near-black pixels, then smooths the histogram with a Gaussian kernel and identifies the global maximum. The hue of that peak, combined with the median saturation and lightness of its constituent pixels, defines the single dominant color. Used by Google Images, YouTube, and Google Photos to extract a representative thumbnail color for UI theming.",
    formula:
      "Bucket: h_bucket = floor(H / bucket_width) | Filter: S > 0.15 && L ∈ [0.20, 0.85] | Peak: argmax(GaussianSmooth(histogram))",
    axes: [
      { label: "Hue", desc: "Divided into 36 buckets of 10° each" },
      { label: "Filter", desc: "Excludes achromatic and very dark pixels" },
      {
        label: "Output",
        desc: "Single representative color (not a full palette)",
      },
    ],
    flaw: "Returns only one color; blind to secondary hues that may be more visually prominent than the modal hue",
    input:
      "sRGB pixel array; downsampling to ~100×100 px is standard for performance",
    bestFor:
      "Thumbnail color extraction, adaptive UI theming from user-uploaded images, notification accent colors",
    references: [
      "Ciocca, G. et al. (2009). Automatic color selection for search results. CIVR '09.",
      "Datta, R. et al. (2006). Studying aesthetics in photographic images using a computational approach. ECCV '06.",
    ],
    accentColor: "#e07a6a",
  },
  {
    id: "vibrant",
    name: "Vibrant",
    subtitle: "Google Palette API 2014",
    year: 2014,
    authors: ["Google Android / Material Design team"],
    affiliation: "Google LLC — android.graphics.Color / Palette API",
    description:
      "Targets a specific perceptual region of HSL space: high saturation (S ≥ 0.35), mid-range lightness (L ∈ [0.30, 0.70]), and sufficient pixel coverage. After initial quantization (typically via Median Cut), each candidate swatch is scored by combining its population weight with a saturation and lightness fitness function. The highest-scoring swatch in the vibrant target region becomes the Vibrant swatch. Introduced in Android 5.0 (Lollipop) Palette API for dynamic UI theming from album art and user photos.",
    formula:
      "Score = population_weight × P + saturation_weight × S_fitness + lightness_weight × L_fitness | S_fitness = 1 − |S − 0.50| × 2",
    axes: [
      { label: "S target", desc: "Saturation ≥ 0.35, ideally ~0.50" },
      { label: "L target", desc: "Lightness 0.30–0.70, ideally ~0.50" },
      {
        label: "Score",
        desc: "Weighted combination of population, S fitness, L fitness",
      },
    ],
    flaw: "Requires sufficient pixel coverage in the vibrant region — monochrome or pastel images may yield no valid Vibrant swatch",
    input:
      "sRGB pixel array post-quantization; Palette API accepts Bitmap objects directly",
    bestFor:
      "Android Material You theming, music player UI coloring, adaptive card backgrounds from user-selected images",
    references: [
      "Google Inc. (2014). Android Palette API. developer.android.com/training/material/palette-colors",
      "Google Inc. (2021). Material Color Utilities — Score algorithm. github.com/material-foundation",
    ],
    accentColor: "#c87ab8",
  },
  {
    id: "muted",
    name: "Muted",
    subtitle: "Google Palette API 2014 — desaturated variant",
    year: 2014,
    authors: ["Google Android / Material Design team"],
    affiliation: "Google LLC — android.graphics.Color / Palette API",
    description:
      "The desaturated counterpart to Vibrant, targeting low saturation (S ≤ 0.40) and mid-range lightness (L ∈ [0.30, 0.70]). Uses the same population-weighted scoring function as Vibrant but with an inverted saturation fitness — rewarding low-chroma candidates. Muted swatches serve as ambient background colors and secondary surface tones in Material Design, pairing with Vibrant to create a balanced, layered palette hierarchy from a single image.",
    formula:
      "Score = population_weight × P + saturation_weight × (1 − S_fitness) + lightness_weight × L_fitness | S target ≤ 0.40",
    axes: [
      { label: "S target", desc: "Saturation ≤ 0.40, ideally ~0.20" },
      { label: "L target", desc: "Lightness 0.30–0.70, same range as Vibrant" },
      {
        label: "Role",
        desc: "Background/surface tone; pairs with Vibrant as foreground accent",
      },
    ],
    flaw: "May return near-grey on highly saturated images with no desaturated regions; can clash with Vibrant if hues diverge significantly",
    input:
      "Same quantized swatch pool as Vibrant; evaluated in parallel by the Palette API",
    bestFor:
      "Adaptive card surfaces, ambient background theming, secondary palette roles in Material You dynamic color",
    references: [
      "Google Inc. (2014). Android Palette API. developer.android.com/training/material/palette-colors",
      "Bohnacker, H. et al. (2012). Generative Design. Princeton Architectural Press.",
    ],
    accentColor: "#9a9a9a",
  },
  {
    id: "octree",
    name: "Octree Quantization",
    subtitle: "Gervautz & Purgathofer 1988",
    year: 1988,
    authors: ["Michael Gervautz", "Werner Purgathofer"],
    affiliation: "Vienna University of Technology",
    description:
      "Builds an octree in RGB space where each tree level corresponds to 1 bit of precision per channel (level 0 = 1-bit, level 7 = full 8-bit). Every unique pixel color creates or increments a leaf node. When the leaf count exceeds k, the algorithm reduces the tree by merging the eight children of the shallowest reducible node into their parent — collapsing fine color distinctions first. This continues until exactly k leaves remain, each representing a palette entry. Gervautz & Purgathofer's 1988 paper introduced octree quantization as an online (single-pass) algorithm, enabling real-time palette construction without storing all pixels.",
    formula:
      "Tree depth: d = floor(log₂(max(R,G,B) + 1)) | Reduce: merge 8 children of shallowest reducible node | Repeat until leaf_count ≤ k",
    axes: [
      { label: "Levels", desc: "0–7; level 7 = full 8-bit color precision" },
      { label: "Reduction", desc: "Bottom-up merging, shallowest nodes first" },
      {
        label: "Memory",
        desc: "O(k) palette + O(unique colors) tree — online capable",
      },
    ],
    flaw: "Merge order (shallowest first) can prematurely collapse important color distinctions; does not account for perceptual uniformity",
    input: "RGB pixel stream; uniquely supports single-pass online processing",
    bestFor:
      "GIF-256 color reduction, PNG-8 quantization, memory-constrained real-time palette building, hardware color lookup table generation",
    references: [
      "Gervautz, M. & Purgathofer, W. (1988). A simple method for color quantization: Octree quantization. New Trends in Computer Graphics. Springer.",
      "Xerox PARC (1993). Color Image Quantization for Frame Buffer Display. Technical Report.",
    ],
    accentColor: "#6ab08a",
  },
  {
    id: "colorMoments",
    name: "Color Moments",
    subtitle: "Stricker & Orengo 1995",
    year: 1995,
    authors: ["Markus Stricker", "Markus Orengo"],
    affiliation: "Xerox PARC / SPIE Storage and Retrieval Conference",
    description:
      "Represents the color distribution of an image as the first three statistical moments of each color channel: mean (μ), standard deviation (σ), and skewness (s). The mean captures the average color, the standard deviation captures spread, and the skewness captures asymmetry in the distribution. Applied per-channel in RGB or HSV, this produces a compact 9-number descriptor (3 channels × 3 moments) that efficiently characterizes an image's color content for retrieval. Stricker & Orengo demonstrated that three moments outperform full histograms for similarity-based image retrieval at far lower storage cost.",
    formula:
      "μ_c = (1/N)Σᵢ fᵢ_c | σ_c = √((1/N)Σᵢ(fᵢ_c − μ_c)²) | s_c = ∛((1/N)Σᵢ(fᵢ_c − μ_c)³) | for c ∈ {R,G,B}",
    axes: [
      {
        label: "μ (mean)",
        desc: "Average channel value — the representative color",
      },
      {
        label: "σ (std dev)",
        desc: "Color spread — high σ = wide range, low = narrow",
      },
      {
        label: "s (skewness)",
        desc: "Distribution asymmetry — detects dominant tints vs. shades",
      },
    ],
    flaw: "Loses spatial information entirely; two images with the same global moments but different compositions are considered identical",
    input:
      "Full pixel array per channel; no downsampling required due to O(N) computation",
    bestFor:
      "Content-based image retrieval (CBIR), image database indexing, similarity search, fast color-based clustering of large image collections",
    references: [
      "Stricker, M. & Orengo, M. (1995). Similarity of color images. SPIE Storage and Retrieval for Image and Video Databases III.",
      "Manjunath, B.S. et al. (2001). Color and texture descriptors. IEEE Trans. Circuits and Systems for Video Technology 11(6).",
    ],
    accentColor: "#8898d8",
  },
  {
    id: "neuralQuant",
    name: "Neural Quantization (NeuQuant)",
    subtitle: "Dekker 1994",
    year: 1994,
    authors: ["Anthony Dekker"],
    affiliation: "Independent — Dr. Dobb's Journal",
    description:
      "Applies a 1D Kohonen self-organizing map (SOM) to palette generation. A network of k neurons (palette entries) is trained by presenting randomly sampled pixels: the closest neuron to each pixel moves toward it (Best Matching Unit update), and its topological neighbors move by a smaller amount. After training, neuron positions in RGB space become the palette entries. Dekker's NeuQuant achieves lower quantization error than Median Cut at the same palette size, especially for photographic images with smooth gradients — and is the algorithm embedded in the LZW encoder used by modern GIF and PNG implementations.",
    formula:
      "BMU: b = argmin_j ||x − wⱼ||² | Update: Δwⱼ = α(t) × h(b,j,t) × (x − wⱼ) | h = neighborhood kernel (Gaussian decay)",
    axes: [
      {
        label: "Neurons",
        desc: "k = palette size; each becomes one palette entry",
      },
      {
        label: "α(t)",
        desc: "Learning rate, decays from 1.0 to 0.01 over training",
      },
      {
        label: "h(b,j,t)",
        desc: "Neighborhood function — Gaussian, width shrinks over time",
      },
    ],
    flaw: "Non-deterministic without fixed seed; training time grows with image size; k must be set in advance",
    input:
      "Randomly sampled pixel stream; typically 30 samples × image_size for convergence",
    bestFor:
      "High-quality GIF compression, PNG-8 palette optimization, photographic image quantization where smooth gradients matter",
    references: [
      "Dekker, A.H. (1994). Kohonen neural networks for optimal colour quantization. Network: Computation in Neural Systems 5(3).",
      "Kohonen, T. (1982). Self-organized formation of topologically correct feature maps. Biological Cybernetics 43(1).",
    ],
    accentColor: "#d4b870",
  },
  {
    id: "histogram",
    name: "3D Color Histogram",
    subtitle: "Swain & Ballard 1991",
    year: 1991,
    authors: ["Michael J. Swain", "Dana H. Ballard"],
    affiliation: "University of Rochester — Computer Science Department",
    description:
      "Divides the RGB cube into a uniform grid of bins (typically 8×8×8 = 512 bins for 3-bit quantization per channel) and counts the number of pixels falling into each bin. The k highest-population bins become palette candidates; their centroids (mean R, G, B of constituent pixels) form the palette entries. Swain & Ballard's 1991 paper introduced color histograms as a descriptor for object recognition and retrieval — demonstrating that histogram intersection distance is robust to partial occlusion and lighting changes, establishing the histogram as the foundational tool for color-based image retrieval.",
    formula:
      "Bin index: b(r,g,b) = (r>>shift, g>>shift, b>>shift) | Count: H[b]++ for each pixel | Palette: top-k bins by H[b], centroid of each",
    axes: [
      {
        label: "Bins",
        desc: "Typically 8³=512 (3 bits/channel) to 16³=4096 (4 bits/channel)",
      },
      {
        label: "Metric",
        desc: "Histogram intersection: Σ min(H₁[i], H₂[i]) for similarity",
      },
      { label: "Output", desc: "k bin centroids sorted by pixel population" },
    ],
    flaw: "Fixed bin boundaries ignore color distribution within bins; equal bin size in RGB ≠ equal perceptual step; spatial layout is ignored",
    input:
      "Full pixel array; bin resolution is a speed/quality tradeoff parameter",
    bestFor:
      "Real-time dominant-color extraction, image retrieval by color similarity, background subtraction, object tracking by color signature",
    references: [
      "Swain, M.J. & Ballard, D.H. (1991). Color indexing. International Journal of Computer Vision 7(1).",
      "Pass, G. & Zabih, R. (1996). Histogram refinement for content-based image retrieval. IEEE WACV.",
    ],
    accentColor: "#7acaba",
  },
  {
    id: "deltaE",
    name: "ΔE Clustering",
    subtitle: "ISO/CIE 1994 — perceptual color difference",
    year: 1994,
    authors: ["ISO / Commission Internationale de l'Éclairage"],
    affiliation: "CIE Technical Committee 1-29",
    description:
      "Groups image pixels using perceptual color difference (CIEDE94 / ΔE₉₄) as the distance metric rather than Euclidean RGB distance. Pixels are considered distinct only if their ΔE₉₄ difference exceeds a threshold (typically ΔE = 2–5, representing the just-noticeable-difference for a trained observer). Clustering proceeds via k-means or hierarchical agglomeration in CIELAB space, guaranteeing that each resulting palette entry is perceptually distinguishable from all others. This is the most principled extraction method — a palette where every color looks different to humans, not just different in number.",
    formula:
      "ΔE₉₄ = √[(ΔL*/kL·SL)² + (ΔC*ab/kC·SC)² + (ΔH*ab/kH·SH)²] | SL=1, SC=1+0.045C*ab, SH=1+0.015C*ab",
    axes: [
      { label: "ΔL*", desc: "Lightness difference in CIELAB" },
      {
        label: "ΔC*",
        desc: "Chroma difference — weighted by SC to match perception",
      },
      {
        label: "ΔH*",
        desc: "Hue difference — weighted by SH to match perception",
      },
    ],
    flaw: "Computationally expensive — requires CIELAB conversion and weighted distance for every pixel pair; superseded by CIEDE2000 for highest accuracy",
    input: "Pixel array converted to CIELAB; D65 illuminant standard",
    bestFor:
      "Print production palette validation, color matching between design systems, ensuring accessible distinctness between categorical palette entries",
    references: [
      "CIE Publication 116 (1995). Industrial colour-difference evaluation. Commission Internationale de l'Éclairage.",
      "Sharma, G. et al. (2005). The CIEDE2000 color-difference formula. Color Research & Application 30(1).",
    ],
    accentColor: "#c89870",
  },
];

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

const Tag = ({
  children,
  color,
}: {
  children: React.ReactNode;
  color: string;
}) => (
  <span
    className="cp-tag"
    style={{
      background: `${color}22`,
      color: color,
      border: `1px solid ${color}44`,
    }}
  >
    {children}
  </span>
);

const Card = ({ item }: { item: PaletteItem }) => (
  <div className="cp-card">
    <div
      className="cp-card-accent-bar"
      style={{ background: item.accentColor }}
    />

    {/* Header */}
    <div className="cp-card-header">
      <div
        className="cp-card-swatch"
        style={{ background: item.accentColor }}
      />
      <div className="cp-card-meta">
        <div className="cp-card-name-row">
          <span className="cp-card-name">{item.name}</span>
          {item.subtitle && <Tag color={item.accentColor}>{item.subtitle}</Tag>}
          {item.year && <Tag color="#64748b">{item.year}</Tag>}
        </div>
        {item.authors && (
          <div className="cp-card-authors">
            {Array.isArray(item.authors)
              ? item.authors.join(" · ")
              : item.authors}
            {item.affiliation && (
              <span className="cp-card-affiliation"> — {item.affiliation}</span>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Content */}
    <div className="cp-card-body">
      <p className="cp-card-desc">{item.description}</p>

      {item.formula && (
        <div className="cp-meta-block">
          <div className="cp-meta-label">Formula</div>
          <pre className="cp-formula-block" style={{ color: item.accentColor }}>
            {item.formula}
          </pre>
        </div>
      )}

      {item.axes && (
        <div className="cp-meta-block">
          <div className="cp-meta-label">Axes</div>
          <div className="cp-axes-list">
            {item.axes.map((ax: PaletteAxis) => (
              <div key={ax.label} className="cp-axis-row">
                <span
                  className="cp-axis-label"
                  style={{ color: item.accentColor }}
                >
                  {ax.label}
                </span>
                <span className="cp-axis-desc">{ax.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {item.flaw && (
        <div className="cp-meta-block">
          <div className="cp-meta-label">Key Flaw</div>
          <div className="cp-flaw">{item.flaw}</div>
        </div>
      )}

      {item.input && (
        <div className="cp-meta-block">
          <div className="cp-meta-label">Input</div>
          <div className="cp-input-text">{item.input}</div>
        </div>
      )}

      {item.bestFor && (
        <div className="cp-meta-block">
          <div className="cp-meta-label">Best Used For</div>
          <div className="cp-bestfor-text">{item.bestFor}</div>
        </div>
      )}

      {item.references && item.references.length > 0 && (
        <div className="cp-meta-block">
          <div className="cp-meta-label">References</div>
          <div className="cp-refs-list">
            {item.references.map((ref: string, i: number) => (
              <div key={i} className="cp-ref-item">
                {ref}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const Section = ({
  title,
  subtitle,
  count,
  items,
  accentColor,
}: {
  title: string;
  subtitle: string;
  count: number;
  items: PaletteItem[];
  accentColor: string;
}) => (
  <section className="cp-section">
    <div
      className="cp-section-header"
      style={{ borderBottom: `1px solid ${accentColor}44` }}
    >
      <div>
        <div className="cp-section-header-inner">
          <div className="cp-section-dot" style={{ background: accentColor }} />
          <h2 className="cp-section-title">{title}</h2>
          <span
            className="cp-section-count"
            style={{
              color: accentColor,
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}33`,
            }}
          >
            {count} patterns
          </span>
        </div>
        <p className="cp-section-subtitle">{subtitle}</p>
      </div>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {items.map((item) => (
        <Card key={item.id} item={item} />
      ))}
    </div>
  </section>
);

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function ColorScienceEncyclopedia() {
  const { isDark } = useTheme();

  const tabs = [
    { id: "spaces", label: "Perceptual Spaces", count: 10, color: "#7baed1" },
    { id: "harmony", label: "Harmony", count: 11, color: "#d4aa5a" },
    { id: "datavis", label: "Data Vis", count: 7, color: "#6dbc8d" },
    { id: "algorithmic", label: "Algorithmic", count: 11, color: "#9880c8" },
    { id: "contrast", label: "Contrast", count: 7, color: "#d4784a" },
    {
      id: "extraction",
      label: "Image Extraction",
      count: 10,
      color: "#7ab8c8",
    },
  ];

  return (
    <div className="cp-page">
      <Header />
      {/* Hero */}
      <div className="cp-hero">
        <div className="cp-hero-grid" />

        <div className="cp-hero-inner">
          <div className="cp-hero-eyebrow">Color Science Reference</div>
          <h1>Color Palette Encyclopedia</h1>
          <p className="cp-hero-subtitle">
            56 techniques across 6 categories. Key researchers, founding years,
            mathematical formulas, and academic references for every algorithm
            in this library.
          </p>

          {/* Color space swatch strip */}
          <div className="cp-hero-swatches">
            {[
              "#7c9cbf",
              "#c49a6c",
              "#7bb87b",
              "#a07bc0",
              "#5ba4cf",
              "#e07a5f",
              "#f2a65a",
              "#de8a9c",
              "#6cb4c8",
              "#8fbf8f",
            ].map((c, i) => (
              <div
                key={i}
                className="cp-hero-swatch"
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="cp-main">
        <Section
          title="Perceptual Color Spaces"
          subtitle="Mathematical models of how humans perceive color — from CIE 1931 to OKLab 2020"
          count={10}
          items={PERCEPTUAL_SPACES}
          accentColor="#7baed1"
        />
        <Section
          title="Color Harmony Patterns"
          subtitle="Geometric relationships on the color wheel from Chevreul 1839 to modern design systems"
          count={11}
          items={HARMONY_PATTERNS}
          accentColor="#d4aa5a"
        />
        <Section
          title="Data Visualization Palettes"
          subtitle="Sequential, diverging, qualitative and more — the ColorBrewer lineage and beyond"
          count={7}
          items={DATA_VIS_PATTERNS}
          accentColor="#6dbc8d"
        />
        <Section
          title="Algorithmic & Generative Palettes"
          subtitle="Mathematical and physics-based color generation — Fibonacci to cubehelix"
          count={11}
          items={ALGORITHMIC_PATTERNS}
          accentColor="#9880c8"
        />
        <Section
          title="Contrast & Accessibility Palettes"
          subtitle="WCAG 2.x, APCA (WCAG 3.x), color blindness simulation, and high-contrast systems"
          count={7}
          items={CONTRAST_PATTERNS}
          accentColor="#d4784a"
        />
        <Section
          title="Image Extraction Algorithms"
          subtitle="From Heckbert's 1979 Median Cut to neural quantization — extracting palettes from images"
          count={10}
          items={IMAGEEXTRACTION_PATTERNS}
          accentColor="#7ab8c8"
        />

        {/* Footer stats */}
        <div className="cp-stats-grid">
          {tabs.map((t) => (
            <div key={t.id} className="cp-stat-cell">
              <div className="cp-stat-num" style={{ color: t.color }}>
                {t.count}
              </div>
              <div className="cp-stat-label">{t.label}</div>
            </div>
          ))}
          <div className="cp-stat-cell">
            <div
              className="cp-stat-num"
              style={{ color: isDark ? "#f1f5f9" : "#0f172a" }}
            >
              56
            </div>
            <div className="cp-stat-label">Total techniques</div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
