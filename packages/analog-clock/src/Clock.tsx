import {
  useState,
  useEffect,
  useId,
  useInsertionEffect,
  useRef,
  type CSSProperties,
  type ReactNode,
} from "react";
import { FACE_GEOMETRY, type ClockFace } from "./faces";
import {
  applyDialOptions,
  type DialMarker,
  type DialMinuteTicks,
  type DialNumbers,
  type DialNumerals,
} from "./dial";
import { injectFaceStyles } from "./styles";
import { secondHandAngle, type SecondHandMotion } from "./motion";
import { parseSecondHandStyle, type SecondHandStyle } from "./secondHandStyles";

/** Motions that overshoot or wobble; replaced by "tick" under reduced motion. */
const WOBBLY_MOTIONS: SecondHandMotion[] = ["bounce", "ease", "anticipate"];

/** Second-hand angle at a given instant. Zone offsets are whole minutes,
 *  so local seconds match every zone. */
const angleAt = (motion: SecondHandMotion, now: Date) =>
  secondHandAngle(motion, now.getSeconds(), now.getMilliseconds());

/** True when the user has asked the system for reduced motion. */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(query.matches);
    const onChange = () => setReduced(query.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

export type ClockTheme = "light" | "dark";
export type TimeFormat = "12h" | "24h";

export interface ClockProps {
  /** Radius of the dial in pixels. */
  radius?: number;
  /** Text shown on the dial (e.g. a city name). Hidden when radius < 50. */
  label?: string;
  /** IANA time zone, e.g. "Europe/London". Defaults to the local zone. */
  timezone?: string | null;
  /** Watch face. "gold" and "blue" need '@studiotoolkit/analog-clock/style.css'. */
  face?: ClockFace;
  /** Colour scheme for the dial (and the digital time on the gold/blue faces). */
  theme?: ClockTheme;
  /** Show the second hand. */
  showSeconds?: boolean;
  /**
   * How the second hand moves: "tick" (one jump per second), "smooth",
   * "sweep" (8 beats/s), "stop-to-go" (58 s lap, pause, minute jump),
   * "bounce", "ease" or "anticipate".
   */
  secondHandMotion?: SecondHandMotion;
  /**
   * How the second hand looks: "face" (the face's own hand), "plain",
   * "tapered", or a line with an object on it, `<shape>-<fill>`: shape
   * "circle", "rect", "half-circle" or "triangle"; fill "filled" or
   * "outline". E.g. "circle-filled".
   */
  secondHandStyle?: SecondHandStyle;
  /**
   * Where the object sits along the second hand, 0-100: 0 is flush with the
   * inner end (the tail past the centre), 100 flush with the tip.
   */
  secondHandMarkerAt?: number;
  /** Which hours get a number: "all", "quarters", "12", "12-6" or "none". */
  numbers?: DialNumbers;
  /** "arabic" (1, 2), "roman" (I, IV) or "roman-iiii" (I, IIII). */
  numerals?: DialNumerals;
  /** Turn each number so its top faces the edge. */
  rotateNumbers?: boolean;
  /**
   * Markers at 12, 3, 6 and 9: "bar", "line", "double", "dot", "square",
   * "triangle-in", "triangle-out", "diamond" or "none".
   */
  mainMarker?: DialMarker;
  /** Marker at 12 only. Defaults to the main marker. */
  marker12?: DialMarker;
  /** Markers at the other 8 hours. Defaults to the main marker. */
  hourMarker?: DialMarker;
  /** Minute ticks: "line", "short", "dot", "railway", "rainbow" or "none". */
  minuteTicks?: DialMinuteTicks;
  /** Leave out the marker wherever a number is drawn. */
  hideMarkersAtNumbers?: boolean;
  /** Show the digital time below the dial. */
  showDigital?: boolean;
  /** Digital time format: "12h" (hh:mm:ss AM) or "24h" (HH:mm:ss). */
  timeFormat?: TimeFormat;
  /** Bezel colour. Overrides the face. */
  borderColor?: string;
  /**
   * Dial (face) colour. Overrides the face. The edge is shaded slightly
   * darker so the dial keeps its gentle gradient.
   */
  dialColor?: string;
  /** Colour of the tick marks. Minute ticks are drawn at reduced opacity. */
  tickColor?: string;
  /** Colour of the hour hand (and the centre cap). */
  hourHandColor?: string;
  /** Colour of the minute hand. */
  minuteHandColor?: string;
  /** Colour of the second hand (and the centre dot). */
  secondHandColor?: string;
  /** Colour of the numbers on the dial. */
  numberColor?: string;
  /** Colour of the digital time below the dial. */
  digitalColor?: string;
}

interface ClockTime {
  hours: number; // 0-23
  minutes: number;
  seconds: number;
}

/** Current wall-clock time in the given IANA zone (local zone if none or invalid). */
export function getTimeInZone(
  timezone?: string | null,
  now: Date = new Date(),
): ClockTime {
  if (timezone) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      }).formatToParts(now);
      const get = (type: string) =>
        parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);
      // Some engines report midnight as "24"
      return {
        hours: get("hour") % 24,
        minutes: get("minute"),
        seconds: get("second"),
      };
    } catch {
      // Invalid zone: fall through to local time
    }
  }
  return {
    hours: now.getHours(),
    minutes: now.getMinutes(),
    seconds: now.getSeconds(),
  };
}

/**
 * Formats a time as "hh:mm:ss AM" (12h) or "HH:mm:ss" (24h).
 * Seconds are dropped when withSeconds is false.
 */
export function formatDigitalTime(
  { hours, minutes, seconds }: ClockTime,
  withSeconds = true,
  format: TimeFormat = "12h",
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const hh = format === "24h" ? pad(hours) : pad(hours % 12 || 12);
  const time = withSeconds
    ? `${hh}:${pad(minutes)}:${pad(seconds)}`
    : `${hh}:${pad(minutes)}`;
  if (format === "24h") return time;
  return `${time} ${hours < 12 ? "AM" : "PM"}`;
}

/**
 * Default-face colours, used when style.css is not loaded.
 * Keep in sync with src/faces/default.css.
 */
const fallbacks = {
  light: {
    ink: "#000",
    bezel: "#000",
    faceInner: "#ffffff",
    faceOuter: "#eef1f5",
    minorTick: "rgba(0,0,0,0.3)",
    label: "#6b7c8f",
    faceShadow: 0.22,
    handShadow: 0.25,
  },
  dark: {
    ink: "#ddd",
    bezel: "#56677a",
    faceInner: "#262b33",
    faceOuter: "#15181d",
    minorTick: "rgba(221,221,221,0.35)",
    label: "#8fa3b8",
    faceShadow: 0.6,
    handShadow: 0.5,
  },
};

const ACCENT = "#e03a3a";
const ROMAN = [
  "",
  "I",
  "II",
  "III",
  "IIII",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
];
/** Roman numerals with 4 written as IV instead of the clock-style IIII. */
const ROMAN_IV = ROMAN.map((n) => (n === "IIII" ? "IV" : n));
const FONT = "'Courier New', Courier, monospace";

/** `var(--ac-<name>, <fallback>)` */
const cssVar = (name: string, fallback: string | number) =>
  `var(--ac-${name}, ${fallback})`;

export default function Clock({
  radius = 100,
  label = "",
  timezone = null,
  face = "default",
  theme = "light",
  showSeconds = true,
  secondHandMotion = "tick",
  secondHandStyle = "face",
  secondHandMarkerAt = 100,
  numbers: numbersProp,
  numerals,
  rotateNumbers,
  mainMarker,
  marker12,
  hourMarker,
  minuteTicks,
  hideMarkersAtNumbers,
  showDigital = true,
  timeFormat = "12h",
  borderColor,
  dialColor,
  tickColor,
  hourHandColor,
  minuteHandColor,
  secondHandColor,
  numberColor,
  digitalColor,
}: ClockProps) {
  // No time until mounted: the server and the browser's first render then
  // match exactly (no hydration mismatch). Hands and digits appear on mount.
  const [time, setTime] = useState<ClockTime | null>(null);
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  // Face colours work without importing style.css
  useInsertionEffect(() => {
    injectFaceStyles();
  }, []);

  // Bouncy motions fall back to "tick" for users who ask for less motion
  const reducedMotion = usePrefersReducedMotion();
  const motion: SecondHandMotion =
    reducedMotion && WOBBLY_MOTIONS.includes(secondHandMotion)
      ? "tick"
      : secondHandMotion;

  // Animated motions move the second hand every frame by setting its
  // transform directly; React still re-renders only once a second.
  const animated = showSeconds && motion !== "tick";
  const secondHandRef = useRef<SVGGElement>(null);
  const centreRef = useRef(0);

  useEffect(() => {
    if (!animated) {
      setTime(getTimeInZone(timezone));
      const timer = setInterval(() => setTime(getTimeInZone(timezone)), 1000);
      return () => clearInterval(timer);
    }
    let frame = 0;
    let lastSecond = -1;
    // Re-render (digital time, other hands) only when the second changes
    const sync = (now: Date) => {
      if (now.getSeconds() === lastSecond) return;
      lastSecond = now.getSeconds();
      setTime(getTimeInZone(timezone, now));
    };
    const step = () => {
      const now = new Date();
      const C = centreRef.current;
      secondHandRef.current?.setAttribute(
        "transform",
        `rotate(${angleAt(motion, now)} ${C} ${C})`,
      );
      sync(now);
      frame = requestAnimationFrame(step);
    };
    step();
    // Browsers pause animation frames in hidden tabs; this keeps the
    // time (digital readout, aria-label) current there.
    const timer = setInterval(() => sync(new Date()), 1000);
    return () => {
      cancelAnimationFrame(frame);
      clearInterval(timer);
    };
  }, [timezone, animated, motion]);

  const g = applyDialOptions(FACE_GEOMETRY[face] ?? FACE_GEOMETRY.default, {
    numbers: numbersProp,
    numerals,
    rotateNumbers,
    mainMarker,
    marker12,
    hourMarker,
    minuteTicks,
    hideMarkersAtNumbers,
  });
  const fb = fallbacks[theme] ?? fallbacks.light;

  // Colour props win over the face CSS by setting its variables inline
  const overrides: Record<string, string> = {};
  if (borderColor)
    overrides["--ac-bezel"] = overrides["--ac-bezel-2"] = borderColor;
  if (dialColor) {
    overrides["--ac-face-inner"] = dialColor;
    overrides["--ac-face-outer"] = `color-mix(in srgb, ${dialColor} 88%, #000)`;
  }
  if (tickColor)
    overrides["--ac-tick"] = overrides["--ac-minor-tick"] = tickColor;
  if (hourHandColor) overrides["--ac-hour-hand"] = hourHandColor;
  if (minuteHandColor) overrides["--ac-minute-hand"] = minuteHandColor;
  if (secondHandColor) overrides["--ac-second-hand"] = secondHandColor;
  if (numberColor) overrides["--ac-number"] = numberColor;
  if (digitalColor) overrides["--ac-digital"] = digitalColor;

  const c = {
    bezel: cssVar("bezel", fb.bezel),
    bezel2: cssVar("bezel-2", cssVar("bezel", fb.bezel)),
    faceInner: cssVar("face-inner", fb.faceInner),
    faceOuter: cssVar("face-outer", fb.faceOuter),
    tick: cssVar("tick", fb.ink),
    minorTick: cssVar("minor-tick", fb.minorTick),
    number: cssVar("number", fb.ink),
    label: cssVar("label", fb.label),
    hourHand: cssVar("hour-hand", fb.ink),
    minuteHand: cssVar("minute-hand", fb.ink),
    secondHand: cssVar("second-hand", ACCENT),
    cap: cssVar("cap", cssVar("hour-hand", fb.ink)),
    capDot: cssVar("cap-dot", cssVar("second-hand", ACCENT)),
    digital: cssVar("digital", fb.ink),
  };

  const pad = 18; // room around the dial for the drop shadow
  const svgSize = radius * 2 + pad * 2;
  const C = radius + pad; // centre of the dial inside the SVG
  centreRef.current = C;
  const r = (fraction: number) => radius * fraction;

  // Angles: 0° = 12 o'clock, clockwise
  const { hours, minutes, seconds } = time ?? {
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
  const hourAngle = (((hours % 12) * 60 + minutes) / 720) * 360;
  // In stop-to-go mode the minute hand jumps once a minute
  const minuteAngle =
    motion === "stop-to-go"
      ? minutes * 6
      : ((minutes * 60 + seconds) / 3600) * 360;
  // Animated hands are drawn at the current instant, so a re-render never
  // shows a stale angle before the next frame.
  const secondAngle =
    animated && time ? angleAt(motion, new Date()) : secondHandAngle("tick", seconds);

  const polar = (angleDeg: number, dist: number) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: C + Math.cos(rad) * dist, y: C + Math.sin(rad) * dist };
  };

  const numberHours =
    g.numbers === "all"
      ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
      : g.numbers === "quarters"
        ? [3, 6, 9, 12]
        : g.numbers === "none"
          ? []
          : g.numbers;

  // 60 marks: quarter / hour / minute, each shaped by the face
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isHour = i % 5 === 0;
    const isQuarter = i % 15 === 0;
    const hour = i / 5 || 12;
    const override = isHour ? g.markOverrides?.[hour] : undefined;
    const mark =
      override !== undefined
        ? override
        : isQuarter
          ? g.quarterMark
          : isHour
            ? g.hourMark
            : g.minuteMark;
    if (!mark) return null;
    if (isHour && g.hideMarksAtNumbers && numberHours.includes(hour))
      return null;
    return {
      i,
      isHour,
      shape: mark.shape ?? "line",
      outer: polar(i * 6, r(mark.from)),
      inner: polar(i * 6, r(mark.to)),
      centre: polar(i * 6, r((mark.from + mark.to) / 2)),
      width: Math.max(mark.minWidth, r(mark.width)),
    };
  }).filter((t) => t !== null);

  // Tick colour: spectrum by position (unless tickColor overrides), else hour/minute colour
  const tickPaint = (i: number, isHour: boolean) =>
    g.spectrumTicks && !tickColor
      ? `hsl(calc(var(--ac-tick-hue, 60) + ${i} * var(--ac-tick-hue-step, -6)), var(--ac-tick-sat, 85%), var(--ac-tick-light, 60%))`
      : isHour
        ? c.tick
        : c.minorTick;

  const numbers = [...numberHours]
    .sort((a, b) => a - b)
    .map((num) => ({
      num,
      text:
        g.numerals !== "roman"
          ? String(num)
          : numerals === "roman"
            ? ROMAN_IV[num]
            : ROMAN[num],
      ...polar(num * 30, r(g.numberRadius)),
    }));

  // Hands are drawn pointing up from the centre, then rotated into place
  const handPath = ({ shape, length, tail, base, tip }: typeof g.hourHand) => {
    const [L, T, B, P] = [r(length), r(tail), r(base), r(tip)];
    if (shape === "bar") {
      return `M ${C - B / 2} ${C + T} L ${C - B / 2} ${C - L} L ${C + B / 2} ${C - L} L ${C + B / 2} ${C + T} Z`;
    }
    if (shape === "dauphine") {
      const wide = C - L * 0.14;
      return `M ${C - B / 2} ${C + T} L ${C - P / 2} ${wide} L ${C} ${C - L} L ${C + P / 2} ${wide} L ${C + B / 2} ${C + T} Z`;
    }
    if (shape === "sword") {
      const shoulder = C - L * 0.8;
      return `M ${C - B / 2} ${C + T} L ${C - P / 2} ${shoulder} L ${C} ${C - L} L ${C + P / 2} ${shoulder} L ${C + B / 2} ${C + T} Z`;
    }
    if (shape === "spade") {
      // Thin shaft, then a leaf that swells to `tip` wide and closes to a point
      const neck = C - L * 0.66;
      const belly = C - L * 0.84;
      return (
        `M ${C - B / 2} ${C + T} L ${C - B / 2} ${neck} ` +
        `Q ${C - P} ${belly} ${C} ${C - L} ` +
        `Q ${C + P} ${belly} ${C + B / 2} ${neck} ` +
        `L ${C + B / 2} ${C + T} Z`
      );
    }
    return (
      `M ${C - B / 2} ${C + T} L ${C - P / 2} ${C - L} ` +
      `Q ${C} ${C - L - P} ${C + P / 2} ${C - L} ` +
      `L ${C + B / 2} ${C + T} Z`
    );
  };

  // Right half of a dauphine/taper hand, shaded to look faceted
  const facetPath = ({ length, tail, base, tip }: typeof g.hourHand) => {
    const [L, T, B, P] = [r(length), r(tail), r(base), r(tip)];
    const wide = C - L * 0.14;
    return `M ${C} ${C + T} L ${C + B / 2} ${C + T} L ${C + P / 2} ${wide} L ${C} ${C - L} Z`;
  };

  // Narrow stripe down the middle of a sword hand
  const inlayPath = ({ length, tip }: typeof g.hourHand) => {
    const [L, W] = [r(length), r(tip) * 0.42];
    return `M ${C - W / 2} ${C - L * 0.16} L ${C - W / 2} ${C - L * 0.78} L ${C} ${C - L * 0.93} L ${C + W / 2} ${C - L * 0.78} L ${C + W / 2} ${C - L * 0.16} Z`;
  };

  const handDetails = (
    hand: typeof g.hourHand,
    angle: number,
    kind: string,
  ) => (
    <>
      {hand.facet && (
        <path
          className={`ac-hand-facet ac-hand-facet--${kind}`}
          d={facetPath(hand)}
          style={{ fill: cssVar("hand-shine", "rgba(255,255,255,0.35)") }}
          transform={`rotate(${angle} ${C} ${C})`}
        />
      )}
      {hand.inlay && (
        <path
          className={`ac-hand-inlay ac-hand-inlay--${kind}`}
          d={inlayPath(hand)}
          style={{ fill: cssVar("hand-inlay", "rgba(255,255,255,0.85)") }}
          transform={`rotate(${angle} ${C} ${C})`}
        />
      )}
    </>
  );

  const sh = g.secondHand;

  // Second hand for any style other than "face", drawn pointing up
  const styledSecondHand = () => {
    const L = r(sh.length);
    const T = r(sh.tail);
    const w = Math.max(1, r(sh.width));
    const paint = { fill: c.secondHand };
    const line = (from: number, to: number) => (
      <line
        x1={C}
        y1={C - from}
        x2={C}
        y2={C - to}
        style={{ stroke: c.secondHand }}
        strokeWidth={w}
        strokeLinecap="round"
      />
    );

    if (secondHandStyle === "tapered") {
      // Widest at the tail end, narrowing steadily to a fine tip
      const B = Math.max(2.5, w * 3.5);
      const P = Math.max(0.6, w * 0.4);
      return (
        <path
          data-part="second-body"
          d={`M ${C - B / 2} ${C + T} L ${C - P / 2} ${C - L} L ${C + P / 2} ${C - L} L ${C + B / 2} ${C + T} Z`}
          style={paint}
        />
      );
    }

    const marker = parseSecondHandStyle(secondHandStyle);
    if (!marker) return line(-T, L); // "plain" (and any unknown style)

    const s = Math.max(3, r(0.05)); // marker half-size
    const hr = s * 1.25; // half-circle radius
    // How far each shape reaches from its centre toward the dial centre
    // (back) and toward the tip (front)
    const [back, front] =
      marker.shape === "rect"
        ? [s * 1.4, s * 1.4]
        : marker.shape === "half-circle"
          ? [hr / 2, hr / 2]
          : marker.shape === "triangle"
            ? [s, s * 1.4]
            : [s, s];
    // 0 = flush with the tail end, 100 = flush with the tip.
    // d = marker centre, as a distance from the dial centre toward the tip.
    const at = Number.isFinite(secondHandMarkerAt)
      ? Math.min(100, Math.max(0, secondHandMarkerAt)) / 100
      : 1;
    const [first, last] = [-T + back, L - front];
    const d = first + (last - first) * at;
    const [near, far] = [d - back, d + front];
    const y = C - d;
    const look = marker.filled
      ? paint
      : { fill: "none", stroke: c.secondHand };
    const stroke = marker.filled ? undefined : w;

    let shape: ReactNode;
    if (marker.shape === "circle") {
      shape = <circle cx={C} cy={y} r={s} style={look} strokeWidth={stroke} />;
    } else if (marker.shape === "rect") {
      // Long side runs along the hand
      const hw = s * 0.65;
      shape = (
        <rect
          x={C - hw}
          y={y - front}
          width={hw * 2}
          height={back + front}
          style={look}
          strokeWidth={stroke}
        />
      );
    } else if (marker.shape === "half-circle") {
      // Flat side toward the centre, dome toward the tip
      const base = y + back;
      shape = (
        <path
          d={`M ${C - hr} ${base} A ${hr} ${hr} 0 0 1 ${C + hr} ${base} Z`}
          style={look}
          strokeWidth={stroke}
        />
      );
    } else {
      // Triangle pointing to the tip
      shape = (
        <polygon
          points={`${C - s},${y + back} ${C + s},${y + back} ${C},${y - front}`}
          style={look}
          strokeWidth={stroke}
          strokeLinejoin="round"
        />
      );
    }

    return (
      <>
        {near > -T && line(-T, near)}
        {far < L && line(far, L)}
        <g data-part="second-marker" data-marker={marker.shape}>
          {shape}
        </g>
      </>
    );
  };
  const showLabel = Boolean(label) && radius >= 50;
  const faceId = `face${uid}`;
  const bezelId = `bezel${uid}`;
  const shadowId = `shadow${uid}`;
  const handShadowId = `hshadow${uid}`;
  const digitalTime = formatDigitalTime(
    time ?? { hours: 0, minutes: 0, seconds: 0 },
    showSeconds,
    timeFormat,
  );
  const spoken = time ? digitalTime : "Clock";
  const ariaLabel = label ? `${label}: ${spoken}` : spoken;

  return (
    <div
      className={`analog-clock analog-clock--${face}`}
      data-face={face}
      data-theme={theme}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        ...(overrides as CSSProperties),
      }}
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <radialGradient id={faceId} cx="50%" cy="40%" r="65%">
            <stop offset="0%" style={{ stopColor: c.faceInner }} />
            <stop offset="100%" style={{ stopColor: c.faceOuter }} />
          </radialGradient>
          <linearGradient id={bezelId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: c.bezel }} />
            <stop offset="50%" style={{ stopColor: c.bezel2 }} />
            <stop offset="100%" style={{ stopColor: c.bezel }} />
          </linearGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy={r(0.03)}
              stdDeviation={r(0.05)}
              floodColor="#000"
              floodOpacity={fb.faceShadow}
            />
          </filter>
          <filter
            id={handShadowId}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feDropShadow
              dx="0"
              dy="1"
              stdDeviation="1"
              floodColor="#000"
              floodOpacity={fb.handShadow}
            />
          </filter>
        </defs>

        {/* Bezel + face */}
        <circle
          className="ac-bezel"
          cx={C}
          cy={C}
          r={radius}
          fill={`url(#${faceId})`}
          stroke={`url(#${bezelId})`}
          strokeWidth={Math.max(g.bezelMinWidth, r(g.bezelWidth))}
          filter={`url(#${shadowId})`}
        />
        {g.innerRing && (
          <circle
            cx={C}
            cy={C}
            r={r(0.95)}
            fill="none"
            style={{ stroke: c.bezel }}
            strokeOpacity={0.25}
            strokeWidth={1}
          />
        )}

        {/* Dial rings */}
        {g.rings.map((ring, i) => (
          <circle
            key={i}
            className="ac-ring"
            cx={C}
            cy={C}
            r={r(ring.radius)}
            fill="none"
            style={{ stroke: cssVar("ring", c.tick) }}
            strokeWidth={Math.max(1, r(ring.width))}
          />
        ))}

        {/* Tick marks */}
        {ticks.map((t) => {
          const className = t.isHour ? "ac-tick ac-tick--hour" : "ac-tick";
          const paint = tickPaint(t.i, t.isHour);
          const angle = t.i * 6;
          if (t.shape === "dot") {
            return (
              <circle
                key={t.i}
                className={className}
                cx={t.centre.x}
                cy={t.centre.y}
                r={t.width / 2}
                style={{ fill: paint }}
              />
            );
          }
          if (t.shape === "square") {
            return (
              <rect
                key={t.i}
                className={className}
                x={t.centre.x - t.width / 2}
                y={t.centre.y - t.width / 2}
                width={t.width}
                height={t.width}
                style={{ fill: paint }}
                transform={`rotate(${angle} ${t.centre.x} ${t.centre.y})`}
              />
            );
          }
          if (t.shape === "triangle") {
            // Drawn at 12 o'clock (base outward, point inward), then rotated
            const top = C - Math.hypot(t.outer.x - C, t.outer.y - C);
            const tip = C - Math.hypot(t.inner.x - C, t.inner.y - C);
            return (
              <polygon
                key={t.i}
                className={className}
                points={`${C - t.width / 2},${top} ${C + t.width / 2},${top} ${C},${tip}`}
                style={{ fill: paint }}
                transform={`rotate(${angle} ${C} ${C})`}
              />
            );
          }
          if (t.shape === "diamond") {
            // Drawn at 12 o'clock (points at both ends), then rotated
            const top = C - Math.hypot(t.outer.x - C, t.outer.y - C);
            const bottom = C - Math.hypot(t.inner.x - C, t.inner.y - C);
            const mid = (top + bottom) / 2;
            return (
              <polygon
                key={t.i}
                className={className}
                points={`${C},${top} ${C + t.width / 2},${mid} ${C},${bottom} ${C - t.width / 2},${mid}`}
                style={{ fill: paint }}
                transform={`rotate(${angle} ${C} ${C})`}
              />
            );
          }
          if (t.shape === "double") {
            // Two parallel lines, drawn at 12 o'clock then rotated
            const top = C - Math.hypot(t.outer.x - C, t.outer.y - C);
            const bottom = C - Math.hypot(t.inner.x - C, t.inner.y - C);
            const stroke = Math.max(1, t.width * 0.32);
            return (
              <g
                key={t.i}
                className={className}
                style={{ stroke: paint }}
                strokeWidth={stroke}
                strokeLinecap={g.linecap}
                transform={`rotate(${angle} ${C} ${C})`}
              >
                <line
                  x1={C - t.width / 2}
                  y1={top}
                  x2={C - t.width / 2}
                  y2={bottom}
                />
                <line
                  x1={C + t.width / 2}
                  y1={top}
                  x2={C + t.width / 2}
                  y2={bottom}
                />
              </g>
            );
          }
          return (
            <line
              key={t.i}
              className={className}
              x1={t.outer.x}
              y1={t.outer.y}
              x2={t.inner.x}
              y2={t.inner.y}
              style={{ stroke: paint }}
              strokeOpacity={!t.isHour && tickColor ? 0.45 : undefined}
              strokeWidth={t.width}
              strokeLinecap={g.linecap}
            />
          );
        })}

        {/* Numbers */}
        {numbers.map(({ num, text, x, y }) => (
          <text
            key={num}
            className="ac-number"
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={r(num % 3 === 0 ? g.numberSize : g.minorNumberSize)}
            style={{
              fill: c.number,
              fontFamily: cssVar("number-font", FONT),
              fontWeight: cssVar("number-weight", "bold"),
            }}
            opacity={num % 3 === 0 ? 1 : g.minorNumberOpacity}
            transform={
              g.rotateNumbers ? `rotate(${num * 30} ${x} ${y})` : undefined
            }
          >
            {text}
          </text>
        ))}

        {/* Label */}
        {showLabel && (
          <text
            className="ac-label"
            x={C}
            y={C - r(g.labelOffset)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={r(0.1)}
            letterSpacing={r(0.012)}
            style={{
              fill: c.label,
              fontFamily: cssVar("label-font", FONT),
              fontWeight: cssVar("label-weight", "bold"),
            }}
          >
            {label.toUpperCase()}
          </text>
        )}

        {/* Hands (only once the time is known) */}
        {time && (
          <g filter={`url(#${handShadowId})`}>
            <path
              data-hand="hour"
              className="ac-hand ac-hand--hour"
              d={handPath(g.hourHand)}
              style={{ fill: c.hourHand }}
              transform={`rotate(${hourAngle} ${C} ${C})`}
            />
            {handDetails(g.hourHand, hourAngle, "hour")}
            <path
              data-hand="minute"
              className="ac-hand ac-hand--minute"
              d={handPath(g.minuteHand)}
              style={{ fill: c.minuteHand }}
              transform={`rotate(${minuteAngle} ${C} ${C})`}
            />
            {handDetails(g.minuteHand, minuteAngle, "minute")}
            {showSeconds && (
              <g
                ref={secondHandRef}
                data-hand="second"
                data-motion={motion}
                data-style={secondHandStyle}
                className="ac-hand ac-hand--second"
                transform={`rotate(${secondAngle} ${C} ${C})`}
              >
                {secondHandStyle === "face" ? (
                  <>
                    <line
                      x1={C}
                      y1={C + r(sh.tail)}
                      x2={C}
                      y2={C - r(sh.length)}
                      style={{ stroke: c.secondHand }}
                      strokeWidth={Math.max(1, r(sh.width))}
                      strokeLinecap="round"
                    />
                    {sh.weightStyle === "bar" ? (
                      <rect
                        x={C - r(sh.weight) / 2}
                        y={C}
                        width={r(sh.weight)}
                        height={r(sh.tail)}
                        style={{ fill: c.secondHand }}
                      />
                    ) : (
                      <circle
                        cx={C}
                        cy={C + r(sh.tail)}
                        r={r(sh.weight)}
                        style={
                          sh.weightStyle === "ring"
                            ? { fill: "none", stroke: c.secondHand }
                            : { fill: c.secondHand }
                        }
                        strokeWidth={
                          sh.weightStyle === "ring"
                            ? Math.max(1, r(sh.width))
                            : undefined
                        }
                      />
                    )}
                  </>
                ) : (
                  styledSecondHand()
                )}
              </g>
            )}
          </g>
        )}

        {/* Centre cap */}
        <circle
          data-part="cap"
          cx={C}
          cy={C}
          r={Math.max(3, r(g.capRadius))}
          style={{ fill: c.cap }}
        />
        <circle
          data-part="cap-dot"
          cx={C}
          cy={C}
          r={Math.max(1.5, r(g.capDotRadius))}
          style={{ fill: c.capDot }}
        />
      </svg>

      {showDigital && (
        <div
          className="analog-clock-digital"
          style={{
            fontSize: r(0.25),
            fontFamily: cssVar("digital-font", FONT),
            fontWeight: "bold",
            letterSpacing: "0.1em",
            marginTop: 8,
            color: c.digital,
          }}
        >
          {/* Before mount, a hidden placeholder keeps the layout from jumping */}
          <span
            style={time ? undefined : { visibility: "hidden" }}
            aria-hidden={time ? undefined : true}
          >
            {digitalTime}
          </span>
        </div>
      )}
    </div>
  );
}
