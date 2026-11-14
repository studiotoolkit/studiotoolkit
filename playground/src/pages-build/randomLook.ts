import {
  CLOCK_FACES,
  type ClockFace,
  type ClockProps,
  type DialMarker,
  type DialMinuteTicks,
  type DialNumbers,
  type DialNumerals,
  type SecondHandMotion,
  type SecondHandStyle,
} from '@studiotoolkit/analog-clock';

/**
 * Curated building blocks for the Randomise button. Picking each part at
 * random from these lists, instead of from every enum value, keeps every
 * result looking deliberate: colours that belong together, dial layouts
 * that read well, and hand objects at sensible positions.
 */

interface Palette {
  name: string;
  dial: string;
  border: string;
  /** Ticks, numbers and the hour and minute hands. */
  ink: string;
  /** Second hand: the one colour that pops. */
  accent: string;
}

const PALETTES: Palette[] = [
  { name: 'Ivory & Ink', dial: '#f7f3ea', border: '#2b2b2b', ink: '#222222', accent: '#d1495b' },
  { name: 'Paper & Navy', dial: '#fffdf7', border: '#1d3557', ink: '#1d3557', accent: '#e63946' },
  { name: 'Arctic', dial: '#f4f8fb', border: '#5c7fa3', ink: '#1f3b57', accent: '#e63946' },
  { name: 'Sage', dial: '#dfe7d7', border: '#4a5d44', ink: '#2f3b2b', accent: '#c8553d' },
  { name: 'Sand', dial: '#e9dcc5', border: '#8c6a43', ink: '#4a3423', accent: '#2a9d8f' },
  { name: 'Blush', dial: '#f6e1e1', border: '#b76e79', ink: '#5a2a35', accent: '#8c2f39' },
  { name: 'Lavender', dial: '#e6e1f5', border: '#6b5b95', ink: '#3b2f5c', accent: '#f08a24' },
  { name: 'Mustard', dial: '#f2c14e', border: '#2d2a26', ink: '#2d2a26', accent: '#1d4e89' },
  { name: 'Midnight Gold', dial: '#14213d', border: '#c9a227', ink: '#e5e5e5', accent: '#fca311' },
  { name: 'Deep Ocean', dial: '#0b3954', border: '#8fb8c9', ink: '#e0f2f7', accent: '#ff7f11' },
  { name: 'Forest', dial: '#1f3d2b', border: '#b08d57', ink: '#f1ede4', accent: '#e76f51' },
  { name: 'Teal & Coral', dial: '#0f4c5c', border: '#e0d5c1', ink: '#f7f1e3', accent: '#ff6f59' },
  { name: 'Slate & Mint', dial: '#2f3640', border: '#9aa3ad', ink: '#f5f6fa', accent: '#00b894' },
  { name: 'Burgundy', dial: '#4a1520', border: '#d4af37', ink: '#f3e6d8', accent: '#f2c14e' },
  { name: 'Copper', dial: '#2b1d16', border: '#b87333', ink: '#f0d9c4', accent: '#e85d3f' },
  { name: 'Carbon & Lime', dial: '#1c1c1c', border: '#4a4a4a', ink: '#eeeeee', accent: '#c6f432' },
];

interface DialLayout {
  name: string;
  numbers: DialNumbers;
  numerals?: DialNumerals;
  rotateNumbers?: boolean;
  mainMarker: DialMarker;
  marker12?: DialMarker;
  hourMarker?: DialMarker;
  minuteTicks: DialMinuteTicks;
  hideMarkersAtNumbers?: boolean;
}

const DIAL_LAYOUTS: DialLayout[] = [
  { name: 'Classic', numbers: 'all', numerals: 'arabic', mainMarker: 'line', minuteTicks: 'line', hideMarkersAtNumbers: true },
  { name: 'Minimal', numbers: 'none', mainMarker: 'line', minuteTicks: 'short' },
  { name: 'Dots', numbers: 'quarters', numerals: 'arabic', mainMarker: 'dot', minuteTicks: 'none', hideMarkersAtNumbers: true },
  { name: 'Clockmaker', numbers: 'all', numerals: 'roman-iiii', rotateNumbers: true, mainMarker: 'none', minuteTicks: 'railway' },
  { name: 'Station', numbers: 'all', numerals: 'arabic', mainMarker: 'bar', minuteTicks: 'railway', hideMarkersAtNumbers: true },
  { name: 'Diver', numbers: 'none', mainMarker: 'bar', marker12: 'triangle-out', hourMarker: 'dot', minuteTicks: 'short' },
  { name: 'Dress', numbers: '12-6', numerals: 'roman', mainMarker: 'line', minuteTicks: 'dot', hideMarkersAtNumbers: true },
  { name: 'Sport', numbers: 'quarters', numerals: 'arabic', mainMarker: 'bar', hourMarker: 'line', minuteTicks: 'line', hideMarkersAtNumbers: true },
  { name: 'Jewel', numbers: 'none', mainMarker: 'diamond', marker12: 'triangle-out', hourMarker: 'square', minuteTicks: 'dot' },
  { name: 'Rainbow', numbers: 'none', mainMarker: 'bar', hourMarker: 'line', minuteTicks: 'rainbow' },
  { name: 'Roman Quarters', numbers: 'quarters', numerals: 'roman', mainMarker: 'double', hourMarker: 'line', minuteTicks: 'short', hideMarkersAtNumbers: true },
  { name: 'Bauhaus', numbers: '12', numerals: 'arabic', mainMarker: 'bar', minuteTicks: 'none', hideMarkersAtNumbers: true },
];

const HANDS: { style: SecondHandStyle; at?: number }[] = [
  { style: 'face' },
  { style: 'plain' },
  { style: 'tapered' },
  { style: 'circle-filled', at: 100 },
  { style: 'circle-filled', at: 86 },
  { style: 'circle-outline', at: 90 },
  { style: 'circle-outline', at: 0 },
  { style: 'triangle-filled', at: 100 },
  { style: 'triangle-outline', at: 0 },
  { style: 'rect-filled', at: 85 },
  { style: 'half-circle-filled', at: 100 },
];

/** Calm motions come up more often than the playful ones. */
const MOTIONS: SecondHandMotion[] = [
  'tick', 'tick', 'smooth', 'smooth', 'sweep', 'sweep',
  'stop-to-go', 'bounce', 'ease', 'anticipate',
];

const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];
const chance = (p: number) => Math.random() < p;

export interface RandomLook {
  face: ClockFace;
  props: ClockProps;
  /** A short description, e.g. "Navy · Midnight Gold · Diver". */
  name: string;
}

/** A random but tasteful look for the given face (or a random face). */
export function randomLook(faceId?: ClockFace): RandomLook {
  const face = CLOCK_FACES.find((f) => f.id === faceId) ?? pick(CLOCK_FACES);
  const props: ClockProps = { face: face.id };
  const parts: string[] = [face.label];

  // Sometimes keep the face's own colours or dial: they're designed too
  if (chance(0.7)) {
    const p = pick(PALETTES);
    Object.assign(props, {
      dialColor: p.dial,
      borderColor: p.border,
      tickColor: p.ink,
      numberColor: p.ink,
      hourHandColor: p.ink,
      minuteHandColor: p.ink,
      secondHandColor: p.accent,
    });
    parts.push(p.name);
  }
  if (chance(0.75)) {
    const { name, ...layout } = pick(DIAL_LAYOUTS);
    Object.assign(props, layout);
    parts.push(name);
  }

  const hand = pick(HANDS);
  props.secondHandStyle = hand.style;
  if (hand.at !== undefined) props.secondHandMarkerAt = hand.at;
  props.secondHandMotion = pick(MOTIONS);

  if (parts.length === 1) parts.push('Face Colors');
  return { face: face.id, props, name: parts.join(' · ') };
}

/**
 * `count` looks for one face, all different from each other: no two share
 * the same palette, dial, hand and motion.
 */
export function randomLooks(faceId: ClockFace, count: number): RandomLook[] {
  const looks: RandomLook[] = [];
  const seen = new Set<string>();
  for (let tries = 0; looks.length < count && tries < count * 20; tries++) {
    const look = randomLook(faceId);
    const key = JSON.stringify(look.props);
    // Also avoid repeating a palette + dial name within the row
    if (seen.has(key) || looks.some((l) => l.name === look.name)) continue;
    seen.add(key);
    looks.push(look);
  }
  return looks;
}
