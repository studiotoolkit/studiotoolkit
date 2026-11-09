/**
 * Shape of each watch face. Colours and fonts live in the matching
 * src/faces/<name>.css file as CSS variables, so a face can be restyled
 * without touching this file. All sizes are fractions of the dial radius.
 */

export type ClockFace =
  | "default"
  | "gold"
  | "blue"
  | "wall-black"
  | "wall-white"
  | "roman"
  | "steel"
  | "navy"
  | "spectrum"
  | "chrono"
  | "ocean"
  | "blush";

/** Recursively freezes an object so shared face data can't be changed at runtime. */
function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const key of Object.keys(value))
      deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

export const CLOCK_FACES: readonly {
  readonly id: ClockFace;
  readonly label: string;
}[] = deepFreeze([
  { id: "default", label: "Default" },
  { id: "gold", label: "Gold" },
  { id: "blue", label: "Blue" },
  { id: "wall-black", label: "Wall Black" },
  { id: "wall-white", label: "Wall White" },
  { id: "roman", label: "Roman" },
  { id: "steel", label: "Steel" },
  { id: "navy", label: "Navy" },
  { id: "spectrum", label: "Spectrum" },
  { id: "chrono", label: "Chrono" },
  { id: "ocean", label: "Ocean" },
  { id: "blush", label: "Blush" },
]);

export interface Mark {
  /**
   * line: runs from `from` to `to`.
   * double: two parallel lines, `width` apart.
   * dot / square: centred between `from` and `to`, `width` across.
   * triangle: base at `from`, point at `to`, `width` across the base.
   */
  shape?: "line" | "double" | "dot" | "square" | "triangle";
  /** Outer end, as a fraction of the radius. */
  from: number;
  /** Inner end, as a fraction of the radius. */
  to: number;
  /** Stroke width (or dot diameter) as a fraction of the radius. */
  width: number;
  /** Minimum width in pixels, so small clocks stay readable. */
  minWidth: number;
}

export interface Hand {
  /**
   * taper: pointed, narrowing from the centre.
   * bar: flat rectangle.
   * spade: thin shaft with a leaf near the tip.
   * dauphine: slim lance, widest just past the centre, narrowing to a sharp point.
   * sword: parallel-sided blade with a pointed tip.
   */
  shape: "taper" | "bar" | "spade" | "dauphine" | "sword";
  length: number;
  tail: number;
  /** Width at the centre (shaft width for spade). */
  base: number;
  /** Width at the tip (taper), or the widest part (spade, dauphine, sword). */
  tip: number;
  /** Shade one half of the hand (--ac-hand-shine) so it looks faceted. */
  facet?: boolean;
  /** Draw a lighter stripe down the middle (--ac-hand-inlay), like lume. */
  inlay?: boolean;
}

export interface FaceGeometry {
  bezelWidth: number;
  bezelMinWidth: number;
  /** Faint ring just inside the bezel. */
  innerRing: boolean;
  /** Extra rings on the dial, e.g. the band around Roman numerals. */
  rings: { radius: number; width: number }[];
  linecap: "round" | "butt";
  /** Which hour numbers are drawn: a preset or a list of hours, e.g. [12, 6]. */
  numbers: "all" | "quarters" | "none" | number[];
  /** Leave out the hour mark wherever a number is drawn. */
  hideMarksAtNumbers: boolean;
  numerals: "arabic" | "roman";
  /** Turn each number so its top faces the bezel. */
  rotateNumbers: boolean;
  numberRadius: number;
  numberSize: number;
  minorNumberSize: number;
  /** Opacity of the numbers other than 12, 3, 6 and 9. */
  minorNumberOpacity: number;
  /** Marks at 12, 3, 6 and 9. null = no mark. */
  quarterMark: Mark | null;
  hourMark: Mark | null;
  minuteMark: Mark | null;
  /** Replace the mark at specific hours, e.g. { 12: triangle }. */
  markOverrides?: Partial<Record<number, Mark | null>>;
  /**
   * Colour each mark by its position around the dial, starting at
   * --ac-tick-hue and stepping --ac-tick-hue-step degrees per minute.
   */
  spectrumTicks?: boolean;
  hourHand: Hand;
  minuteHand: Hand;
  secondHand: {
    length: number;
    tail: number;
    width: number;
    /** Counterweight size: circle radius, or bar width for "bar". */
    weight: number;
    weightStyle: "filled" | "ring" | "bar";
  };
  capRadius: number;
  capDotRadius: number;
  /** Label distance from the centre. Positive = above, negative = below. */
  labelOffset: number;
}

const base = {
  innerRing: false,
  rings: [],
  numerals: "arabic",
  rotateNumbers: false,
  hideMarksAtNumbers: false,
  minorNumberOpacity: 1,
} satisfies Partial<FaceGeometry>;

/** The original clock style. */
const defaultFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.035,
  bezelMinWidth: 2,
  innerRing: true,
  linecap: "round",
  numbers: "all",
  numberRadius: 0.66,
  numberSize: 0.19,
  minorNumberSize: 0.15,
  minorNumberOpacity: 0.8,
  quarterMark: { from: 0.92, to: 0.83, width: 0.03, minWidth: 2 },
  hourMark: { from: 0.92, to: 0.85, width: 0.02, minWidth: 1.5 },
  minuteMark: { from: 0.92, to: 0.89, width: 0, minWidth: 1 },
  hourHand: { shape: "taper", length: 0.5, tail: 0.1, base: 0.075, tip: 0.035 },
  minuteHand: {
    shape: "taper",
    length: 0.74,
    tail: 0.12,
    base: 0.055,
    tip: 0.022,
  },
  secondHand: {
    length: 0.84,
    tail: 0.2,
    width: 0.012,
    weight: 0.035,
    weightStyle: "filled",
  },
  capRadius: 0.05,
  capDotRadius: 0.025,
  labelOffset: 0.32,
};

/** Gold case, white dial, long thin hour sticks and numbers at the quarters. */
const goldFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.07,
  bezelMinWidth: 3,
  linecap: "butt",
  numbers: "quarters",
  numberRadius: 0.72,
  numberSize: 0.13,
  minorNumberSize: 0.13,
  quarterMark: null,
  hourMark: { from: 0.8, to: 0.6, width: 0.02, minWidth: 1.5 },
  minuteMark: { from: 0.93, to: 0.84, width: 0.007, minWidth: 0.75 },
  hourHand: {
    shape: "taper",
    length: 0.46,
    tail: 0.06,
    base: 0.035,
    tip: 0.02,
  },
  minuteHand: {
    shape: "taper",
    length: 0.74,
    tail: 0.06,
    base: 0.028,
    tip: 0.015,
  },
  secondHand: {
    length: 0.86,
    tail: 0.24,
    width: 0.009,
    weight: 0.03,
    weightStyle: "ring",
  },
  capRadius: 0.045,
  capDotRadius: 0.02,
  labelOffset: 0.3,
};

/** Steel case, navy dial, slim hour markers, double lines at 12/3/6/9, pointed hands, no numbers. */
const blueFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.08,
  bezelMinWidth: 3,
  linecap: "butt",
  numbers: "none",
  numberRadius: 0.66,
  numberSize: 0,
  minorNumberSize: 0,
  quarterMark: {
    shape: "double",
    from: 0.93,
    to: 0.7,
    width: 0.055,
    minWidth: 3,
  },
  hourMark: { from: 0.93, to: 0.75, width: 0.03, minWidth: 1.5 },
  minuteMark: { from: 0.93, to: 0.87, width: 0.012, minWidth: 1 },
  hourHand: {
    shape: "taper",
    length: 0.55,
    tail: 0.12,
    base: 0.065,
    tip: 0.022,
  },
  minuteHand: {
    shape: "taper",
    length: 0.84,
    tail: 0.14,
    base: 0.048,
    tip: 0.016,
  },
  secondHand: {
    length: 0.76,
    tail: 0.24,
    width: 0.014,
    weight: 0.045,
    weightStyle: "filled",
  },
  capRadius: 0.04,
  capDotRadius: 0.018,
  labelOffset: 0.36,
};

/** Wall clock hands shared by the black and white wall faces. */
const wallHands = {
  hourHand: {
    shape: "taper",
    length: 0.52,
    tail: 0.16,
    base: 0.075,
    tip: 0.035,
  },
  minuteHand: {
    shape: "taper",
    length: 0.8,
    tail: 0.18,
    base: 0.055,
    tip: 0.025,
  },
  secondHand: {
    length: 0.84,
    tail: 0.3,
    width: 0.012,
    weight: 0.045,
    weightStyle: "bar",
  },
  capRadius: 0.035,
  capDotRadius: 0.02,
} satisfies Partial<FaceGeometry>;

/** Black case, numbers around the edge, tick ring inside them with hour dots. */
const wallBlackFace: FaceGeometry = {
  ...base,
  ...wallHands,
  bezelWidth: 0.09,
  bezelMinWidth: 4,
  innerRing: true,
  linecap: "round",
  numbers: "all",
  numberRadius: 0.785,
  numberSize: 0.21,
  minorNumberSize: 0.21,
  quarterMark: {
    shape: "dot",
    from: 0.66,
    to: 0.66,
    width: 0.04,
    minWidth: 2.5,
  },
  hourMark: { shape: "dot", from: 0.66, to: 0.66, width: 0.04, minWidth: 2.5 },
  minuteMark: { from: 0.69, to: 0.63, width: 0.014, minWidth: 1 },
  labelOffset: -0.3,
};

/** Slim white case, heavy numbers, ticks around the outer edge. */
const wallWhiteFace: FaceGeometry = {
  ...base,
  ...wallHands,
  bezelWidth: 0.05,
  bezelMinWidth: 3,
  innerRing: true,
  linecap: "butt",
  numbers: "all",
  numberRadius: 0.71,
  numberSize: 0.245,
  minorNumberSize: 0.245,
  quarterMark: { from: 0.95, to: 0.87, width: 0.022, minWidth: 1.5 },
  hourMark: { from: 0.95, to: 0.87, width: 0.022, minWidth: 1.5 },
  minuteMark: { from: 0.95, to: 0.9, width: 0.012, minWidth: 1 },
  labelOffset: -0.3,
};

/** Thick black case, Roman numerals in an outer band, spade hands, no ticks. */
const romanFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.08,
  bezelMinWidth: 4,
  rings: [{ radius: 0.66, width: 0.012 }],
  linecap: "round",
  numbers: "all",
  numerals: "roman",
  rotateNumbers: true,
  numberRadius: 0.8,
  numberSize: 0.2,
  minorNumberSize: 0.2,
  quarterMark: null,
  hourMark: null,
  minuteMark: null,
  hourHand: { shape: "spade", length: 0.48, tail: 0.04, base: 0.03, tip: 0.1 },
  minuteHand: {
    shape: "spade",
    length: 0.64,
    tail: 0.04,
    base: 0.022,
    tip: 0.08,
  },
  secondHand: {
    length: 0.62,
    tail: 0.12,
    width: 0.008,
    weight: 0.025,
    weightStyle: "filled",
  },
  capRadius: 0.06,
  capDotRadius: 0.015,
  labelOffset: -0.32,
};

/** Polished steel case, silver dial, Roman XII and VI, slim faceted hands. */
const steelFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.075,
  bezelMinWidth: 3,
  innerRing: true,
  linecap: "butt",
  numbers: [12, 6],
  numerals: "roman",
  hideMarksAtNumbers: true,
  numberRadius: 0.76,
  numberSize: 0.17,
  minorNumberSize: 0.17,
  quarterMark: { from: 0.86, to: 0.7, width: 0.03, minWidth: 1.5 },
  hourMark: { from: 0.86, to: 0.7, width: 0.03, minWidth: 1.5 },
  minuteMark: { from: 0.955, to: 0.915, width: 0.008, minWidth: 0.75 },
  hourHand: {
    shape: "dauphine",
    length: 0.5,
    tail: 0.08,
    base: 0.02,
    tip: 0.06,
    facet: true,
  },
  minuteHand: {
    shape: "dauphine",
    length: 0.83,
    tail: 0.1,
    base: 0.016,
    tip: 0.048,
    facet: true,
  },
  secondHand: {
    length: 0.9,
    tail: 0.2,
    width: 0.008,
    weight: 0.018,
    weightStyle: "filled",
  },
  capRadius: 0.035,
  capDotRadius: 0.014,
  labelOffset: 0.4,
};

/** Polished steel case, blue sunburst dial, 12/3/6/9 numbers, sword hands with a bright stripe. */
const navyFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.09,
  bezelMinWidth: 4,
  innerRing: true,
  linecap: "butt",
  numbers: "quarters",
  hideMarksAtNumbers: true,
  numberRadius: 0.73,
  numberSize: 0.19,
  minorNumberSize: 0.19,
  quarterMark: null,
  hourMark: { from: 0.9, to: 0.7, width: 0.034, minWidth: 2 },
  minuteMark: {
    shape: "dot",
    from: 0.935,
    to: 0.935,
    width: 0.014,
    minWidth: 1.25,
  },
  hourHand: {
    shape: "sword",
    length: 0.5,
    tail: 0.1,
    base: 0.05,
    tip: 0.075,
    inlay: true,
  },
  minuteHand: {
    shape: "sword",
    length: 0.8,
    tail: 0.12,
    base: 0.04,
    tip: 0.058,
    inlay: true,
  },
  secondHand: {
    length: 0.88,
    tail: 0.22,
    width: 0.009,
    weight: 0.02,
    weightStyle: "filled",
  },
  capRadius: 0.04,
  capDotRadius: 0.016,
  labelOffset: 0.4,
};

/** Gunmetal case, white dial, ticks in color-wheel colours, bold lines at the quarters, near-black hands. */
const spectrumFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.065,
  bezelMinWidth: 3,
  linecap: "butt",
  numbers: "none",
  numberRadius: 0.7,
  numberSize: 0,
  minorNumberSize: 0,
  spectrumTicks: true,
  quarterMark: { from: 0.95, to: 0.66, width: 0.04, minWidth: 2 },
  hourMark: { from: 0.95, to: 0.72, width: 0.026, minWidth: 1.5 },
  minuteMark: { from: 0.95, to: 0.8, width: 0.014, minWidth: 1 },
  hourHand: { shape: "bar", length: 0.5, tail: 0.05, base: 0.03, tip: 0.03 },
  minuteHand: {
    shape: "bar",
    length: 0.8,
    tail: 0.05,
    base: 0.024,
    tip: 0.024,
  },
  secondHand: {
    length: 0.84,
    tail: 0.26,
    width: 0.012,
    weight: 0.03,
    weightStyle: "ring",
  },
  capRadius: 0.045,
  capDotRadius: 0.02,
  labelOffset: 0.36,
};

/** Steel case, black dial, minute track, small numbers, white batons and a triangle at 12. */
const chronoFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.08,
  bezelMinWidth: 3,
  innerRing: true,
  linecap: "butt",
  numbers: "all",
  numberRadius: 0.875,
  numberSize: 0.075,
  minorNumberSize: 0.075,
  quarterMark: { from: 0.82, to: 0.7, width: 0.045, minWidth: 2 },
  hourMark: { from: 0.82, to: 0.7, width: 0.045, minWidth: 2 },
  minuteMark: { from: 0.975, to: 0.935, width: 0.008, minWidth: 0.75 },
  markOverrides: {
    12: { shape: "triangle", from: 0.83, to: 0.69, width: 0.11, minWidth: 5 },
  },
  hourHand: {
    shape: "sword",
    length: 0.52,
    tail: 0.12,
    base: 0.05,
    tip: 0.07,
    inlay: true,
  },
  minuteHand: {
    shape: "sword",
    length: 0.82,
    tail: 0.14,
    base: 0.04,
    tip: 0.055,
    inlay: true,
  },
  secondHand: {
    length: 0.9,
    tail: 0.2,
    width: 0.008,
    weight: 0.02,
    weightStyle: "filled",
  },
  capRadius: 0.045,
  capDotRadius: 0.018,
  labelOffset: 0.42,
};

/** Dive style: thick teal case, deep teal dial, big lume dots, bars at 3/6/9, triangle at 12. */
const oceanFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.1,
  bezelMinWidth: 4,
  innerRing: true,
  linecap: "butt",
  numbers: "none",
  numberRadius: 0.7,
  numberSize: 0,
  minorNumberSize: 0,
  quarterMark: { from: 0.9, to: 0.68, width: 0.065, minWidth: 3 },
  hourMark: { shape: "dot", from: 0.8, to: 0.8, width: 0.1, minWidth: 4 },
  minuteMark: { from: 0.95, to: 0.91, width: 0.012, minWidth: 1 },
  markOverrides: {
    12: { shape: "triangle", from: 0.92, to: 0.7, width: 0.17, minWidth: 6 },
  },
  hourHand: {
    shape: "sword",
    length: 0.5,
    tail: 0.12,
    base: 0.06,
    tip: 0.1,
    inlay: true,
  },
  minuteHand: {
    shape: "sword",
    length: 0.8,
    tail: 0.14,
    base: 0.045,
    tip: 0.07,
    inlay: true,
  },
  secondHand: {
    length: 0.86,
    tail: 0.22,
    width: 0.013,
    weight: 0.045,
    weightStyle: "ring",
  },
  capRadius: 0.05,
  capDotRadius: 0.022,
  labelOffset: 0.4,
};

/** Dress style: rose-gold case, blush dial, serif 12/3/6/9, faceted lance hands. */
const blushFace: FaceGeometry = {
  ...base,
  bezelWidth: 0.06,
  bezelMinWidth: 3,
  linecap: "round",
  numbers: "quarters",
  hideMarksAtNumbers: true,
  numberRadius: 0.74,
  numberSize: 0.17,
  minorNumberSize: 0.17,
  quarterMark: null,
  hourMark: { from: 0.88, to: 0.76, width: 0.022, minWidth: 1.5 },
  minuteMark: {
    shape: "dot",
    from: 0.935,
    to: 0.935,
    width: 0.013,
    minWidth: 1.25,
  },
  hourHand: {
    shape: "dauphine",
    length: 0.5,
    tail: 0.07,
    base: 0.022,
    tip: 0.065,
    facet: true,
  },
  minuteHand: {
    shape: "dauphine",
    length: 0.8,
    tail: 0.09,
    base: 0.016,
    tip: 0.05,
    facet: true,
  },
  secondHand: {
    length: 0.88,
    tail: 0.18,
    width: 0.008,
    weight: 0.02,
    weightStyle: "filled",
  },
  capRadius: 0.035,
  capDotRadius: 0.015,
  labelOffset: 0.36,
};

/** Internal: not exported from the package, so face shapes can change without breaking users. */
export const FACE_GEOMETRY: Readonly<Record<ClockFace, FaceGeometry>> =
  deepFreeze({
    default: defaultFace,
    gold: goldFace,
    blue: blueFace,
    "wall-black": wallBlackFace,
    "wall-white": wallWhiteFace,
    roman: romanFace,
    steel: steelFace,
    navy: navyFace,
    spectrum: spectrumFace,
    chrono: chronoFace,
    ocean: oceanFace,
    blush: blushFace,
  });
