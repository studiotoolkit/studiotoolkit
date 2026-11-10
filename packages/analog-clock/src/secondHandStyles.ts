/** Marker shapes that can sit on the second hand. */
export type SecondHandMarker = "circle" | "rect" | "half-circle" | "triangle";
export type SecondHandFill = "filled" | "outline";

/**
 * How the second hand is drawn. "face" keeps the watch face's own hand,
 * "plain" is a simple line, "tapered" narrows from tail to tip. Every other
 * style adds a marker, `<shape>-<fill>` (e.g. "circle-filled"), placed along
 * the hand by the `secondHandMarkerAt` prop.
 */
export type SecondHandStyle =
  | "face"
  | "plain"
  | "tapered"
  | `${SecondHandMarker}-${SecondHandFill}`;

const SHAPES: { id: SecondHandMarker; label: string }[] = [
  { id: "circle", label: "Circle" },
  { id: "rect", label: "Rectangle" },
  { id: "half-circle", label: "Half circle" },
  { id: "triangle", label: "Triangle" },
];
const FILLS: SecondHandFill[] = ["filled", "outline"];

type StyleOption = { id: SecondHandStyle; label: string; group: string };

/**
 * Every style with a display name and a group (for <optgroup>), handy for
 * a picker: the three plain hands, then each shape filled and outlined.
 */
export const SECOND_HAND_STYLES: StyleOption[] = [
  { id: "face", label: "Face default", group: "Hand" },
  { id: "plain", label: "Simple plain", group: "Hand" },
  { id: "tapered", label: "Tapered", group: "Hand" },
  ...SHAPES.flatMap((shape) =>
    FILLS.map((fill) => ({
      id: `${shape.id}-${fill}` as const,
      label: `${shape.label} · ${fill}`,
      group: "Object",
    })),
  ),
];

/** Splits a marker style into its parts, or null for "face", "plain", "tapered". */
export function parseSecondHandStyle(
  style: SecondHandStyle,
): { shape: SecondHandMarker; filled: boolean } | null {
  const m = /^(circle|rect|half-circle|triangle)-(filled|outline)$/.exec(style);
  if (!m) return null;
  return { shape: m[1] as SecondHandMarker, filled: m[2] === "filled" };
}
