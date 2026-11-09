import { useState, useEffect, useId } from "react";

export type ClockTheme = "light" | "dark";

export interface ClockProps {
  /** Radius of the dial in pixels. */
  radius?: number;
  /** Text shown on the dial (e.g. a city name). Hidden when radius < 50. */
  label?: string;
  /** Bezel colour. Defaults to a theme-appropriate colour. */
  borderColor?: string;
  /** IANA time zone, e.g. "Europe/London". Defaults to the local zone. */
  timezone?: string | null;
  /** Colour scheme for the dial. */
  theme?: ClockTheme;
  /** Show the red second hand. */
  showSeconds?: boolean;
  /** Show the digital time below the dial. */
  showDigital?: boolean;
}

interface ClockTime {
  hours: number; // 0-23
  minutes: number;
  seconds: number;
}

/** Current wall-clock time in the given IANA zone (local zone if none or invalid). */
export function getTimeInZone(timezone?: string | null, now: Date = new Date()): ClockTime {
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
      return { hours: get("hour") % 24, minutes: get("minute"), seconds: get("second") };
    } catch {
      // Invalid zone: fall through to local time
    }
  }
  return { hours: now.getHours(), minutes: now.getMinutes(), seconds: now.getSeconds() };
}

/** Formats a time as "hh:mm:ss AM" (or "hh:mm AM" without seconds). */
export function formatDigitalTime({ hours, minutes, seconds }: ClockTime, withSeconds = true): string {
  const hh = String(hours % 12 || 12).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const period = hours < 12 ? "AM" : "PM";
  return withSeconds ? `${hh}:${mm}:${ss} ${period}` : `${hh}:${mm} ${period}`;
}

const palettes = {
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
const FONT = "'Courier New', Courier, monospace";

export default function Clock({
  radius = 100,
  label = "",
  borderColor,
  timezone = null,
  theme = "light",
  showSeconds = true,
  showDigital = true,
}: ClockProps) {
  const [time, setTime] = useState(() => getTimeInZone(timezone));
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");

  useEffect(() => {
    setTime(getTimeInZone(timezone));
    const timer = setInterval(() => setTime(getTimeInZone(timezone)), 1000);
    return () => clearInterval(timer);
  }, [timezone]);

  const p = palettes[theme] ?? palettes.light;
  const bezel = borderColor ?? p.bezel;

  const pad = 18; // room around the dial for the drop shadow
  const svgSize = radius * 2 + pad * 2;
  const C = radius + pad; // centre of the dial inside the SVG

  // Angles: 0° = 12 o'clock, clockwise
  const { hours, minutes, seconds } = time;
  const hourAngle = (((hours % 12) * 60 + minutes) / 720) * 360;
  const minuteAngle = ((minutes * 60 + seconds) / 3600) * 360;
  const secondAngle = (seconds / 60) * 360;

  const polar = (angleDeg: number, r: number) => {
    const rad = (angleDeg - 90) * (Math.PI / 180);
    return { x: C + Math.cos(rad) * r, y: C + Math.sin(rad) * r };
  };

  // Ticks: 12/3/6/9 longest, other hours medium, minutes fine
  const ticks = Array.from({ length: 60 }, (_, i) => {
    const isHour = i % 5 === 0;
    const isQuarter = i % 15 === 0;
    return {
      isHour,
      isQuarter,
      outer: polar(i * 6, radius * 0.92),
      inner: polar(i * 6, radius * (isQuarter ? 0.83 : isHour ? 0.85 : 0.89)),
    };
  });

  const numbers = Array.from({ length: 12 }, (_, i) => ({
    num: i + 1,
    ...polar((i + 1) * 30, radius * 0.66),
  }));

  // Tapered hand pointing up from the centre, rotated into place afterwards
  const handPath = (length: number, tail: number, base: number, tip: number) =>
    `M ${C - base / 2} ${C + tail} L ${C - tip / 2} ${C - length} ` +
    `Q ${C} ${C - length - tip} ${C + tip / 2} ${C - length} ` +
    `L ${C + base / 2} ${C + tail} Z`;

  const showLabel = Boolean(label) && radius >= 50;
  const faceId = `face${uid}`;
  const shadowId = `shadow${uid}`;
  const handShadowId = `hshadow${uid}`;
  const digitalTime = formatDigitalTime(time, showSeconds);
  const ariaLabel = label ? `${label}: ${digitalTime}` : digitalTime;

  return (
    <div
      className="analog-clock"
      data-theme={theme}
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: FONT,
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
            <stop offset="0%" stopColor={p.faceInner} />
            <stop offset="100%" stopColor={p.faceOuter} />
          </radialGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy={radius * 0.03}
              stdDeviation={radius * 0.05}
              floodColor="#000"
              floodOpacity={p.faceShadow}
            />
          </filter>
          <filter id={handShadowId} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000" floodOpacity={p.handShadow} />
          </filter>
        </defs>

        {/* Bezel + face */}
        <circle
          cx={C}
          cy={C}
          r={radius}
          fill={`url(#${faceId})`}
          stroke={bezel}
          strokeWidth={Math.max(2, radius * 0.035)}
          filter={`url(#${shadowId})`}
        />
        <circle cx={C} cy={C} r={radius * 0.95} fill="none" stroke={bezel} strokeOpacity={0.25} strokeWidth={1} />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.outer.x}
            y1={t.outer.y}
            x2={t.inner.x}
            y2={t.inner.y}
            stroke={t.isHour ? p.ink : p.minorTick}
            strokeWidth={
              t.isQuarter ? Math.max(2, radius * 0.03) : t.isHour ? Math.max(1.5, radius * 0.02) : 1
            }
            strokeLinecap="round"
          />
        ))}

        {/* Numbers */}
        {numbers.map(({ num, x, y }) => (
          <text
            key={num}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={radius * (num % 3 === 0 ? 0.19 : 0.15)}
            fontFamily={FONT}
            fontWeight="bold"
            fill={p.ink}
            opacity={num % 3 === 0 ? 1 : 0.8}
          >
            {num}
          </text>
        ))}

        {/* Label */}
        {showLabel && (
          <text
            x={C}
            y={C - radius * 0.32}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={radius * 0.1}
            fontFamily={FONT}
            fontWeight="bold"
            letterSpacing={radius * 0.012}
            fill={p.label}
          >
            {label.toUpperCase()}
          </text>
        )}

        {/* Hands */}
        <g filter={`url(#${handShadowId})`}>
          <path
            data-hand="hour"
            d={handPath(radius * 0.5, radius * 0.1, radius * 0.075, radius * 0.035)}
            fill={p.ink}
            transform={`rotate(${hourAngle} ${C} ${C})`}
          />
          <path
            data-hand="minute"
            d={handPath(radius * 0.74, radius * 0.12, radius * 0.055, radius * 0.022)}
            fill={p.ink}
            transform={`rotate(${minuteAngle} ${C} ${C})`}
          />
          {showSeconds && (
            <g data-hand="second" transform={`rotate(${secondAngle} ${C} ${C})`}>
              <line
                x1={C}
                y1={C + radius * 0.2}
                x2={C}
                y2={C - radius * 0.84}
                stroke={ACCENT}
                strokeWidth={Math.max(1, radius * 0.012)}
                strokeLinecap="round"
              />
              <circle cx={C} cy={C + radius * 0.2} r={radius * 0.035} fill={ACCENT} />
            </g>
          )}
        </g>

        {/* Centre cap */}
        <circle cx={C} cy={C} r={Math.max(3, radius * 0.05)} fill={p.ink} />
        <circle cx={C} cy={C} r={Math.max(1.5, radius * 0.025)} fill={ACCENT} />
      </svg>

      {showDigital && (
        <div
          className="analog-clock-digital"
          style={{
            fontSize: radius * 0.25,
            fontFamily: FONT,
            fontWeight: "bold",
            letterSpacing: "0.1em",
            marginTop: 8,
            color: p.ink,
          }}
        >
          {digitalTime}
        </div>
      )}
    </div>
  );
}
