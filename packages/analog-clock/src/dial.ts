/**
 * Dial options: numbers, numerals, markers and minute ticks. Each one is
 * optional; anything left unset keeps the watch face's own design.
 */
import type { FaceGeometry, Mark } from "./faces";

/** Which hours get a number. */
export type DialNumbers = "all" | "quarters" | "12" | "12-6" | "none";
/** "roman" writes 4 as IV; "roman-iiii" as IIII, like many clocks. */
export type DialNumerals = "arabic" | "roman" | "roman-iiii";
export type DialMarker =
  | "bar"
  | "line"
  | "double"
  | "dot"
  | "square"
  | "triangle-in"
  | "triangle-out"
  | "diamond"
  | "none";
export type DialMinuteTicks =
  | "line"
  | "short"
  | "dot"
  | "railway"
  | "rainbow"
  | "none";

export interface DialOptions {
  numbers?: DialNumbers;
  numerals?: DialNumerals;
  /** Turn each number so its top faces the edge. */
  rotateNumbers?: boolean;
  /** Markers at 12, 3, 6 and 9. */
  mainMarker?: DialMarker;
  /** Marker at 12 only. Defaults to the main marker. */
  marker12?: DialMarker;
  /** Markers at the other 8 hours. Defaults to the main marker. */
  hourMarker?: DialMarker;
  minuteTicks?: DialMinuteTicks;
  /** Leave out the marker wherever a number is drawn. */
  hideMarkersAtNumbers?: boolean;
}

type Option<T> = { id: T; label: string };

/** Display names, handy for pickers. */
export const DIAL_NUMBERS: Option<DialNumbers>[] = [
  { id: "all", label: "All (1-12)" },
  { id: "quarters", label: "Quarters (12, 3, 6, 9)" },
  { id: "12", label: "12 only" },
  { id: "12-6", label: "12 and 6" },
  { id: "none", label: "None" },
];
export const DIAL_NUMERALS: Option<DialNumerals>[] = [
  { id: "arabic", label: "Arabic (1, 2, 3)" },
  { id: "roman", label: "Roman (I, II, IV)" },
  { id: "roman-iiii", label: "Roman, clock style (IIII)" },
];
export const DIAL_MARKERS: Option<DialMarker>[] = [
  { id: "bar", label: "Bars" },
  { id: "line", label: "Thin lines" },
  { id: "double", label: "Double bars" },
  { id: "dot", label: "Dots" },
  { id: "square", label: "Squares" },
  { id: "triangle-in", label: "Triangle in" },
  { id: "triangle-out", label: "Triangle out" },
  { id: "diamond", label: "Diamond" },
  { id: "none", label: "None" },
];
export const DIAL_MINUTE_TICKS: Option<DialMinuteTicks>[] = [
  { id: "line", label: "Lines" },
  { id: "short", label: "Short lines" },
  { id: "dot", label: "Dots" },
  { id: "railway", label: "Railway track" },
  { id: "rainbow", label: "Rainbow" },
  { id: "none", label: "None" },
];

/**
 * A marker drawn inward from `edge` (fraction of the radius). `scale`
 * makes the 12/3/6/9 markers a little bolder than the other hours.
 */
function markerMark(
  kind: DialMarker,
  edge: number,
  scale = 1,
  maxLen = 1,
): Mark | null {
  const len = Math.min(0.13 * scale, maxLen);
  // Round shapes shrink with the room too, so they never touch the numbers
  scale = Math.min(scale, Math.max(0.6, maxLen / 0.1));
  switch (kind) {
    case "bar":
      return { from: edge, to: edge - len, width: 0.032 * scale, minWidth: 2 };
    case "line":
      return { from: edge, to: edge - len, width: 0.012, minWidth: 1.2 };
    case "double":
      return {
        shape: "double",
        from: edge,
        to: edge - len,
        width: 0.035 * scale,
        minWidth: 3,
      };
    case "dot": {
      const c = edge - 0.045 * scale;
      return { shape: "dot", from: c, to: c, width: 0.055 * scale, minWidth: 3 };
    }
    case "square": {
      const c = edge - 0.045 * scale;
      return { shape: "square", from: c, to: c, width: 0.05 * scale, minWidth: 3 };
    }
    case "triangle-in":
      // Base at the edge, point toward the centre
      return {
        shape: "triangle",
        from: edge,
        to: edge - len,
        width: 0.09 * scale,
        minWidth: 4,
      };
    case "triangle-out":
      // Base inside, point toward the edge
      return {
        shape: "triangle",
        from: edge - len,
        to: edge,
        width: 0.09 * scale,
        minWidth: 4,
      };
    case "diamond":
      return {
        shape: "diamond",
        from: edge,
        to: edge - len,
        width: 0.06 * scale,
        minWidth: 3,
      };
    default:
      return null;
  }
}

const NUMBER_SETS: Record<DialNumbers, FaceGeometry["numbers"]> = {
  all: "all",
  quarters: "quarters",
  "12": [12],
  "12-6": [12, 6],
  none: "none",
};

/** The face geometry with the dial options applied on top. */
export function applyDialOptions(
  face: FaceGeometry,
  o: DialOptions,
): FaceGeometry {
  const g: FaceGeometry = { ...face };

  if (o.numbers) g.numbers = NUMBER_SETS[o.numbers] ?? face.numbers;
  // Faces drawn without numbers have no number size; give them one
  if (o.numbers && o.numbers !== "none" && face.numberSize === 0) {
    g.numberSize = 0.16;
    g.minorNumberSize = 0.13;
  }
  if (o.numerals) g.numerals = o.numerals === "arabic" ? "arabic" : "roman";
  if (o.rotateNumbers !== undefined) g.rotateNumbers = o.rotateNumbers;
  if (o.hideMarkersAtNumbers !== undefined)
    g.hideMarksAtNumbers = o.hideMarkersAtNumbers;

  // Faces with no marks of their own (Roman) get them just inside the numbers
  const fallback = face.numberRadius > 0.76 ? face.numberRadius - 0.12 : 0.92;
  // New markers start at the outer edge of the face's own hour markers
  const outerEdge = (m: Mark | null) =>
    m
      ? Math.max(m.from, m.to) +
        (m.shape === "dot" || m.shape === "square" ? m.width / 2 : 0)
      : 0;
  let edge =
    Math.max(outerEdge(face.hourMark), outerEdge(face.quarterMark)) || fallback;

  // Keep markers clear of the numbers. Markers inside the ring of numbers
  // (Wall Black) are fine; markers in the same ring move outward to the
  // minute track and get shorter.
  let maxLen = 1;
  const hasNumbers = g.numbers !== "none" && g.numbers.length !== 0;
  if (hasNumbers) {
    const numTop = g.numberRadius + g.numberSize * 0.55;
    const numBottom = g.numberRadius - g.numberSize * 0.55;
    if (edge > numBottom) {
      edge = Math.max(edge, face.minuteMark?.from ?? 0, numTop + 0.05);
      edge = Math.min(edge, 0.95);
      maxLen = Math.max(0.035, edge - numTop - 0.015);
    }
    // Numbers added to a face whose own markers run through the same ring
    // (Gold): hide those markers under the numbers unless told otherwise
    const crosses = (m: Mark | null) =>
      m !== null &&
      Math.min(m.from, m.to) < numTop &&
      Math.max(m.from, m.to) > numBottom;
    const keepFaceMarkers = !o.mainMarker && !o.hourMarker;
    if (
      o.numbers &&
      o.hideMarkersAtNumbers === undefined &&
      keepFaceMarkers &&
      (crosses(face.hourMark) || crosses(face.quarterMark))
    )
      g.hideMarksAtNumbers = true;
  }

  if (o.mainMarker || o.marker12 || o.hourMarker) {
    const main = o.mainMarker
      ? markerMark(o.mainMarker, edge, 1.25, maxLen)
      : face.quarterMark;
    g.quarterMark = main;
    g.hourMark = o.hourMarker
      ? markerMark(o.hourMarker, edge, 1, maxLen)
      : o.mainMarker
        ? markerMark(o.mainMarker, edge, 1, maxLen)
        : face.hourMark;
    // The face's own 12 o'clock accent gives way to any marker choice,
    // unless only the other hours were changed
    g.markOverrides = o.marker12
      ? { 12: markerMark(o.marker12, edge, 1.45, maxLen) }
      : o.mainMarker
        ? undefined
        : face.markOverrides;
  }

  if (o.minuteTicks) {
    const mEdge = face.minuteMark?.from ?? face.hourMark?.from ?? fallback;
    const line = (len: number): Mark => ({
      from: mEdge,
      to: mEdge - len,
      width: 0.01,
      minWidth: 1,
    });
    g.spectrumTicks = o.minuteTicks === "rainbow" || undefined;
    switch (o.minuteTicks) {
      case "line":
      case "rainbow":
        g.minuteMark = line(0.05);
        break;
      case "short":
        g.minuteMark = line(0.025);
        break;
      case "dot": {
        const c = mEdge - 0.02;
        g.minuteMark = { shape: "dot", from: c, to: c, width: 0.018, minWidth: 1.5 };
        break;
      }
      case "railway":
        // Short ticks between two thin rings, like a station clock
        g.minuteMark = line(0.05);
        g.rings = [
          ...face.rings,
          { radius: mEdge, width: 0.006 },
          { radius: mEdge - 0.05, width: 0.006 },
        ];
        break;
      default:
        g.minuteMark = null;
    }
  }

  return g;
}
