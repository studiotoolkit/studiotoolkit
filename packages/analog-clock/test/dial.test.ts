import { describe, it, expect } from 'vitest';
import { applyDialOptions, DIAL_MARKERS, DIAL_MINUTE_TICKS, type DialNumbers } from '../src/dial';
import { FACE_GEOMETRY, type FaceGeometry } from '../src/faces';

const plain = FACE_GEOMETRY.default;

describe('applyDialOptions markers', () => {
  it.each(DIAL_MARKERS.map((m) => m.id))('builds a "%s" marker for every position', (id) => {
    const g = applyDialOptions(plain, { mainMarker: id, marker12: id, hourMarker: id });
    if (id === 'none') {
      expect(g.quarterMark).toBeNull();
      expect(g.hourMark).toBeNull();
      expect(g.markOverrides?.[12]).toBeNull();
      return;
    }
    for (const m of [g.quarterMark!, g.hourMark!, g.markOverrides![12]!]) {
      expect(m.width).toBeGreaterThan(0);
      expect(m.minWidth).toBeGreaterThan(0);
    }
    // 12 and the quarters are drawn bolder than the other hours
    expect(g.quarterMark!.width).toBeGreaterThanOrEqual(g.hourMark!.width);
    expect(g.markOverrides![12]!.width).toBeGreaterThanOrEqual(g.quarterMark!.width);
  });

  it('gives dots and squares their shape, centred on one radius', () => {
    for (const shape of ['dot', 'square'] as const) {
      const m = applyDialOptions(plain, { mainMarker: shape }).quarterMark!;
      expect(m.shape).toBe(shape);
      expect(m.from).toBe(m.to);
    }
  });

  it('changes only the other hours when just hourMarker is set', () => {
    const g = applyDialOptions(FACE_GEOMETRY.gold, { hourMarker: 'dot' });
    expect(g.quarterMark).toBe(FACE_GEOMETRY.gold.quarterMark);
    expect(g.hourMark?.shape).toBe('dot');
    expect(g.markOverrides).toBe(FACE_GEOMETRY.gold.markOverrides);
  });

  it('keeps the face markers when just marker12 is set', () => {
    const g = applyDialOptions(plain, { marker12: 'diamond' });
    expect(g.quarterMark).toBe(plain.quarterMark);
    expect(g.hourMark).toBe(plain.hourMark);
    expect(g.markOverrides?.[12]?.shape).toBe('diamond');
  });

  it('drops the face 12 accent when the main marker changes', () => {
    const g = applyDialOptions(FACE_GEOMETRY.gold, { mainMarker: 'bar' });
    expect(g.markOverrides).toBeUndefined();
  });

  it('moves markers out of the numbers on a face without minute marks', () => {
    // Hour marks run through the numbers and there is no minute track
    const face: FaceGeometry = {
      ...plain,
      minuteMark: null,
      numberRadius: 0.8,
      numberSize: 0.15,
      hourMark: { from: 0.85, to: 0.75, width: 0.02, minWidth: 1 },
      quarterMark: { from: 0.85, to: 0.75, width: 0.03, minWidth: 1 },
    };
    const g = applyDialOptions(face, { numbers: 'all', mainMarker: 'bar' });
    const numTop = 0.8 + 0.15 * 0.55;
    expect(g.quarterMark!.from).toBeGreaterThan(numTop);
    expect(g.quarterMark!.from).toBeLessThanOrEqual(0.95);
  });
});

describe('applyDialOptions numbers', () => {
  it('sizes numbers on faces drawn without them', () => {
    expect(FACE_GEOMETRY.blue.numberSize).toBe(0);
    const g = applyDialOptions(FACE_GEOMETRY.blue, { numbers: 'all' });
    expect(g.numberSize).toBeGreaterThan(0);
    expect(g.minorNumberSize).toBeGreaterThan(0);
  });

  it('leaves the size alone when numbers stay off', () => {
    expect(applyDialOptions(FACE_GEOMETRY.blue, { numbers: 'none' }).numberSize).toBe(0);
  });

  it("keeps the face's numbers for an unknown value", () => {
    const g = applyDialOptions(plain, { numbers: 'odd' as DialNumbers });
    expect(g.numbers).toBe(plain.numbers);
  });
});

describe('applyDialOptions minute ticks', () => {
  it.each(DIAL_MINUTE_TICKS.map((t) => t.id))('builds "%s" ticks', (id) => {
    const g = applyDialOptions(plain, { minuteTicks: id });
    if (id === 'none') return expect(g.minuteMark).toBeNull();
    expect(g.minuteMark).not.toBeNull();
    expect(g.spectrumTicks).toBe(id === 'rainbow' || undefined);
    if (id === 'railway') expect(g.rings).toHaveLength(plain.rings.length + 2);
  });

  it('draws short ticks at half the length of lines', () => {
    const len = (id: 'line' | 'short') => {
      const m = applyDialOptions(plain, { minuteTicks: id }).minuteMark!;
      return m.from - m.to;
    };
    expect(len('short')).toBeCloseTo(len('line') / 2);
  });

  it('places ticks from the hour marks or the fallback on faces without minute marks', () => {
    const noMinutes: FaceGeometry = { ...plain, minuteMark: null };
    expect(applyDialOptions(noMinutes, { minuteTicks: 'line' }).minuteMark!.from).toBe(plain.hourMark!.from);
    const bare: FaceGeometry = { ...plain, minuteMark: null, hourMark: null, numberRadius: 0.7 };
    expect(applyDialOptions(bare, { minuteTicks: 'line' }).minuteMark!.from).toBe(0.92);
  });
});
