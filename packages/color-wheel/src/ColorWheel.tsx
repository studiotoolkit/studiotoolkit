import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import "./ColorWheel.css";
import { useTheme } from "./ThemeContext";

type HarmonyMode =
  | "complementary"
  | "analogous"
  | "monochromatic"
  | "split"
  | "triadic"
  | "square"
  | "simple";
type DotPosition = "center" | "inner" | "outer";

export interface ColorData {
  HEX: string;
  RGB: [number, number, number];
  HSL: [number, number, number];
}

export interface PaletteOutput {
  [key: string]: string[];
}

interface ControlConfig {
  name: string;
  attribute: string;
  default: unknown;
  show: boolean;
  notes: string;
}

interface ColorWheelProps {
  onColorsChange?: (palette: PaletteOutput) => void;
  harmonyMode?: HarmonyMode;
  saturation?: number;
  brightness?: number;
  circleRadius?: number;
  wheelThickness?: number;
  dotSize?: number;
  dotPosition?: DotPosition;
  handleThickness?: number;
  handleColor?: string;
  harmonyPolygon?: boolean;
  polygonColor?: string;
  polygonThickness?: number;
  centerDot?: string;
  showCenterDot?: boolean;
  borderColor?: string;
  canvasBackgroundColor?: string;
  width?: number;
  height?: number;
}

const HARMONY_RULES: Record<HarmonyMode, number[]> = {
  complementary: [0, 180],
  analogous: [-30, 0, 30],
  monochromatic: [0],
  split: [0, 150, -150],
  triadic: [0, 120, 240],
  square: [0, 90, 180, 270],
  simple: [0],
};

const CONTROL_CONFIG: ControlConfig[] = [
  {
    name: "Harmony Mode",
    attribute: "harmony-mode",
    default: "split",
    show: true,
    notes: "",
  },
  {
    name: "Saturation",
    attribute: "saturation",
    default: 100,
    show: true,
    notes: "",
  },
  {
    name: "Brightness",
    attribute: "brightness",
    default: 50,
    show: true,
    notes: "",
  },
  {
    name: "Circle Radius",
    attribute: "circle-radius",
    default: 1,
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Wheel Thickness",
    attribute: "wheel-thickness",
    default: 80,
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Dot Size",
    attribute: "dot-size",
    default: 5,
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Dot Position",
    attribute: "dot-position",
    default: "outer",
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Handle Thickness",
    attribute: "handle-thickness",
    default: 2,
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Handle Color",
    attribute: "handle-color",
    default: "#000000",
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Show Harmony Polygon",
    attribute: "harmony-polygon",
    default: false,
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Polygon Color",
    attribute: "polygon-color",
    default: "#000000",
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Polygon Thickness",
    attribute: "polygon-thickness",
    default: 1,
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Center Dot",
    attribute: "center-dot",
    default: "#ffffff",
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Palette",
    attribute: "palette",
    default: null,
    show: false,
    notes: "If not passed, default it is false",
  },
  {
    name: "Palette JSON",
    attribute: "palette-json",
    default: null,
    show: false,
    notes: "If not passed, default it is false",
  },
];

export default function ColorWheel({
  onColorsChange,
  harmonyMode: propHarmonyMode,
  saturation: propSaturation,
  brightness: propBrightness,
  circleRadius: propCircleRadius,
  wheelThickness: propWheelThickness,
  dotSize: propDotSize,
  dotPosition: propDotPosition,
  handleThickness: propHandleThickness,
  handleColor: propHandleColor,
  harmonyPolygon: propHarmonyPolygon,
  polygonColor: propPolygonColor,
  polygonThickness: propPolygonThickness,
  centerDot: propCenterDot,
  showCenterDot: propShowCenterDot = false,
  borderColor: propBorderColor = "#ffffff",
  canvasBackgroundColor: propCanvasBackgroundColor = "transparent",
  width = 450,
  height = 450,
}: ColorWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState(false);
  const { isDark } = useTheme();

  // Get config for each control
  const getConfig = (attr: string) =>
    CONTROL_CONFIG.find((c) => c.attribute === attr)!;

  // State for controls - use props or defaults from config
  const [mode, setMode] = useState<HarmonyMode>(
    (propHarmonyMode || getConfig("harmony-mode").default) as HarmonyMode,
  );
  const [saturation, setSaturation] = useState(
    (propSaturation ?? getConfig("saturation").default) as number,
  );
  const [lightness, setLightness] = useState(
    (propBrightness ?? getConfig("brightness").default) as number,
  );

  // Calculate radius based on canvas size if not explicitly provided
  const calculateRadius = useCallback(() => {
    const configRadius = getConfig("circle-radius").default as number;
    if (propCircleRadius !== undefined) return propCircleRadius;
    // If radius is the tiny default (1), calculate a proper radius
    if (configRadius === 1) {
      const minDim = Math.min(width, height);
      const wt =
        propWheelThickness ?? (getConfig("wheel-thickness").default as number);
      const ds = propDotSize ?? (getConfig("dot-size").default as number);
      const padding = 10;
      return minDim / 2 - wt / 2 - ds - padding;
    }
    return configRadius;
  }, [width, height, propCircleRadius, propWheelThickness, propDotSize]);

  const [radius, setRadius] = useState(calculateRadius());
  const [wheelThickness, setWheelThickness] = useState(
    (propWheelThickness ?? getConfig("wheel-thickness").default) as number,
  );
  const [dotSize, setDotSize] = useState(
    (propDotSize ?? getConfig("dot-size").default) as number,
  );
  const [dotPosition, setDotPosition] = useState<DotPosition>(
    (propDotPosition || getConfig("dot-position").default) as DotPosition,
  );
  const [handleThickness, setHandleThickness] = useState(
    (propHandleThickness ?? getConfig("handle-thickness").default) as number,
  );
  const [handleColor, setHandleColor] = useState(
    (propHandleColor ||
      (getConfig("handle-color").default === "black"
        ? "#000000"
        : getConfig("handle-color").default)) as string,
  );
  const [polyEnabled, setPolyEnabled] = useState(
    (propHarmonyPolygon ?? getConfig("harmony-polygon").default) as boolean,
  );
  const [polyColor, setPolyColor] = useState(
    (propPolygonColor ||
      (getConfig("polygon-color").default === "black"
        ? "#000000"
        : getConfig("polygon-color").default)) as string,
  );
  const [polyThickness, setPolyThickness] = useState(
    (propPolygonThickness ?? getConfig("polygon-thickness").default) as number,
  );
  const [centerDotColor, setCenterDotColor] = useState(
    (propCenterDot ||
      (getConfig("center-dot").default === "white"
        ? "#ffffff"
        : getConfig("center-dot").default)) as string,
  );
  const [showCenterDotState, setShowCenterDotState] =
    useState(propShowCenterDot);
  const [borderColorState, setBorderColorState] = useState(propBorderColor);
  const [canvasBackgroundColorState, setCanvasBackgroundColorState] = useState(
    propCanvasBackgroundColor,
  );
  const [baseHue, setBaseHue] = useState(0);

  // Update internal state when props change
  useEffect(() => {
    if (propHarmonyMode !== undefined) {
      setMode(propHarmonyMode);
    }
  }, [propHarmonyMode]);

  useEffect(() => {
    if (propSaturation !== undefined) {
      setSaturation(propSaturation);
    }
  }, [propSaturation]);

  useEffect(() => {
    if (propBrightness !== undefined) {
      setLightness(propBrightness);
    }
  }, [propBrightness]);

  useEffect(() => {
    if (propCircleRadius !== undefined) {
      setRadius(propCircleRadius);
    } else {
      // Recalculate radius when canvas size changes
      setRadius(calculateRadius());
    }
  }, [propCircleRadius, calculateRadius]);

  useEffect(() => {
    if (propWheelThickness !== undefined) {
      setWheelThickness(propWheelThickness);
    }
  }, [propWheelThickness]);

  useEffect(() => {
    if (propDotSize !== undefined) {
      setDotSize(propDotSize);
    }
  }, [propDotSize]);

  useEffect(() => {
    if (propDotPosition !== undefined) {
      setDotPosition(propDotPosition);
    }
  }, [propDotPosition]);

  useEffect(() => {
    if (propHandleThickness !== undefined) {
      setHandleThickness(propHandleThickness);
    }
  }, [propHandleThickness]);

  useEffect(() => {
    if (propHandleColor !== undefined) {
      setHandleColor(propHandleColor);
    }
  }, [propHandleColor]);

  useEffect(() => {
    if (propHarmonyPolygon !== undefined) {
      setPolyEnabled(propHarmonyPolygon);
    }
  }, [propHarmonyPolygon]);

  useEffect(() => {
    if (propPolygonColor !== undefined) {
      setPolyColor(propPolygonColor);
    }
  }, [propPolygonColor]);

  useEffect(() => {
    if (propPolygonThickness !== undefined) {
      setPolyThickness(propPolygonThickness);
    }
  }, [propPolygonThickness]);

  useEffect(() => {
    if (propCenterDot !== undefined) {
      setCenterDotColor(propCenterDot);
    }
  }, [propCenterDot]);

  useEffect(() => {
    setShowCenterDotState(propShowCenterDot);
  }, [propShowCenterDot]);

  useEffect(() => {
    setBorderColorState(propBorderColor);
  }, [propBorderColor]);

  useEffect(() => {
    setCanvasBackgroundColorState(propCanvasBackgroundColor);
  }, [propCanvasBackgroundColor]);

  const center = { x: width / 2, y: height / 2 };

  // Helper functions
  const wrapHue = (h: number): number => (h + 360) % 360;

  const hslColor = useCallback(
    (h: number, s = saturation, l = lightness): string => {
      return `hsl(${h}, ${s}%, ${l}%)`;
    },
    [saturation, lightness],
  );

  const hslToRgb = (
    h: number,
    s: number,
    l: number,
  ): { r: number; g: number; b: number } => {
    s /= 100;
    l /= 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  };

  const rgbToHex = (r: number, g: number, b: number): string => {
    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  };

  const getDotRadius = useCallback((): number => {
    if (dotPosition === "center") return radius;
    if (dotPosition === "inner") return radius - wheelThickness / 2;
    return radius + wheelThickness / 2;
  }, [dotPosition, radius, wheelThickness]);

  const hueToPoint = useCallback(
    (hue: number): { x: number; y: number } => {
      const angle = ((hue - 90) * Math.PI) / 180;
      const r = getDotRadius();
      return {
        x: center.x + r * Math.cos(angle),
        y: center.y + r * Math.sin(angle),
      };
    },
    [center.x, center.y, getDotRadius],
  );

  const pointToHue = (x: number, y: number): number => {
    const dx = x - center.x;
    const dy = y - center.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    return wrapHue(angle + 90);
  };

  // Generate palette data
  const generatePalette = useCallback((): PaletteOutput => {
    let colorsList: { h: number; l: number }[] = [];

    if (mode === "monochromatic") {
      colorsList = [
        { h: baseHue, l: 30 },
        { h: baseHue, l: 50 },
        { h: baseHue, l: 70 },
      ];
    } else {
      colorsList = HARMONY_RULES[mode].map((offset) => ({
        h: wrapHue(baseHue + offset),
        l: lightness,
      }));
    }

    const harmonyPalette = colorsList.map((c) => {
      const rgb = hslToRgb(c.h, saturation, c.l);
      return rgbToHex(rgb.r, rgb.g, rgb.b);
    });

    return {
      [mode]: harmonyPalette,
    } as PaletteOutput;
  }, [mode, baseHue, saturation, lightness]);

  // Drawing functions
  const drawWheel = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      for (let i = 0; i < 360; i++) {
        ctx.beginPath();
        ctx.strokeStyle = `hsl(${i},100%,50%)`;
        ctx.lineWidth = wheelThickness;
        ctx.arc(
          center.x,
          center.y,
          radius,
          ((i - 90) * Math.PI) / 180,
          ((i - 89) * Math.PI) / 180,
        );
        ctx.stroke();
      }
    },
    [center.x, center.y, radius, wheelThickness],
  );

  const drawPolygon = useCallback(
    (ctx: CanvasRenderingContext2D, points: { x: number; y: number }[]) => {
      if (!polyEnabled || points.length < 3) return;

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);

      points.slice(1).forEach((p) => {
        ctx.lineTo(p.x, p.y);
      });

      ctx.closePath();
      ctx.strokeStyle = polyColor;
      ctx.lineWidth = polyThickness;
      ctx.stroke();
    },
    [polyEnabled, polyColor, polyThickness],
  );

  const drawHands = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (mode === "simple") {
        // In simple mode, don't draw handles or center dot
        return;
      }

      const offsets = HARMONY_RULES[mode];
      const polygonPoints: { x: number; y: number }[] = [];

      offsets.forEach((offset) => {
        const hue = wrapHue(baseHue + offset);
        const pt = hueToPoint(hue);

        polygonPoints.push(pt);

        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.strokeStyle = handleColor;
        ctx.lineWidth = handleThickness;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, dotSize, 0, Math.PI * 2);
        ctx.fillStyle = hslColor(hue);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
      });

      drawPolygon(ctx, polygonPoints);

      // Draw center dot
      if (showCenterDotState) {
        ctx.beginPath();
        ctx.arc(center.x, center.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = centerDotColor;
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    },
    [
      mode,
      baseHue,
      center.x,
      center.y,
      dotSize,
      handleThickness,
      handleColor,
      centerDotColor,
      showCenterDotState,
      hueToPoint,
      hslColor,
      drawPolygon,
    ],
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and fill background
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw canvas background
    if (
      canvasBackgroundColorState &&
      canvasBackgroundColorState !== "transparent"
    ) {
      ctx.fillStyle = canvasBackgroundColorState;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (canvasBackgroundColorState === "transparent") {
      // Use theme-aware background color
      ctx.fillStyle = isDark ? "#1a1a1a" : "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    drawWheel(ctx);
    drawHands(ctx);

    // Draw border
    if (borderColorState) {
      ctx.strokeStyle = borderColorState;
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
  }, [
    drawWheel,
    drawHands,
    borderColorState,
    canvasBackgroundColorState,
    isDark,
  ]);

  // Mouse event handlers
  const handleMouseDown = () => setDragging(true);
  const handleMouseUp = () => setDragging(false);
  const handleMouseLeave = () => setDragging(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newHue = pointToHue(e.clientX - rect.left, e.clientY - rect.top);
    setBaseHue(newHue);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const newHue = pointToHue(e.clientX - rect.left, e.clientY - rect.top);
    setBaseHue(newHue);
  };

  // Effect to redraw canvas
  useEffect(() => {
    redraw();
  }, [redraw]);

  // Generate colors using useMemo
  const currentPalette = useMemo(() => generatePalette(), [generatePalette]);

  // Notify parent when colors change
  useEffect(() => {
    if (onColorsChange) {
      onColorsChange(currentPalette);
    }
  }, [currentPalette, onColorsChange]);

  // Public method to get current palette
  const getPalette = useCallback(
    (): PaletteOutput => currentPalette,
    [currentPalette],
  );

  // Expose getPalette via ref if needed
  useEffect(() => {
    (
      window as Window & { getColorWheelPalette?: () => PaletteOutput }
    ).getColorWheelPalette = getPalette;
    return () => {
      delete (window as Window & { getColorWheelPalette?: () => PaletteOutput })
        .getColorWheelPalette;
    };
  }, [getPalette]);

  return (
    <div className="color-wheel-container">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{
          display: "block",
          margin: "0 auto",
          cursor: "pointer",
        }}
      />
    </div>
  );
}
