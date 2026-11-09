/** How the second hand moves. "tick" is the classic one-jump-per-second. */
export type SecondHandMotion =
  | "tick"
  | "smooth"
  | "sweep"
  | "swiss"
  | "bounce"
  | "ease"
  | "anticipate";

/** Every motion with a display name, handy for a picker. */
export const SECOND_HAND_MOTIONS: { id: SecondHandMotion; label: string }[] = [
  { id: "tick", label: "Tick (default)" },
  { id: "smooth", label: "Smooth glide" },
  { id: "sweep", label: "Mechanical sweep" },
  { id: "swiss", label: "Swiss railway" },
  { id: "bounce", label: "Spring bounce" },
  { id: "ease", label: "Ease-in-out tick" },
  { id: "anticipate", label: "Anticipation tick" },
];

/** How long each per-second move takes, in ms, for the stepped motions. */
const MOVE_MS = { bounce: 700, ease: 300, anticipate: 350 };

/** Progress curves: 0 at the start of the move, 1 at the end. */
const CURVES = {
  // Damped spring: overshoots ~30%, wobbles twice, settles
  bounce: (p: number) =>
    p >= 1 ? 1 : 1 - Math.exp(-5 * p) * Math.cos(4 * Math.PI * p),
  // Cubic ease-in-out
  ease: (p: number) =>
    p < 0.5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2,
  // Dips back a quarter step, then snaps forward
  anticipate: (p: number) => 4 * p ** 3 - 3 * p ** 2,
};

/**
 * Second-hand angle in degrees (0 = 12 o'clock, clockwise) for a time of
 * `seconds` + `ms` past the minute.
 */
export function secondHandAngle(
  motion: SecondHandMotion,
  seconds: number,
  ms = 0,
): number {
  const exact = seconds + ms / 1000;
  switch (motion) {
    case "smooth":
      return exact * 6;
    case "sweep":
      // 8 beats per second, like an automatic movement
      return (seconds + Math.floor(ms / 125) / 8) * 6;
    case "swiss":
      // One lap in 58 s, then a 2 s wait at 12
      return Math.min((exact * 60) / 58, 60) * 6;
    case "bounce":
    case "ease":
    case "anticipate": {
      // Moves from the previous second's mark to this one
      const p = Math.min(ms / MOVE_MS[motion], 1);
      return (seconds - 1 + CURVES[motion](p)) * 6;
    }
    default:
      return seconds * 6;
  }
}
