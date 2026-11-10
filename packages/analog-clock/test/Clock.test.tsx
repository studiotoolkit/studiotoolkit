import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Clock, { getTimeInZone, formatDigitalTime } from '../src/Clock';
import * as publicApi from '../src/index';
import { Clock as NamedClock, AnalogClock, CLOCK_FACES, SECOND_HAND_STYLES } from '../src/index';
import { FACE_GEOMETRY } from '../src/faces';
import { FACE_STYLE_ID } from '../src/styles';

// 2026-03-15 10:15:30 UTC
const FIXED = new Date(Date.UTC(2026, 2, 15, 10, 15, 30));

const rotation = (el: Element | null) => {
  const m = el?.getAttribute('transform')?.match(/rotate\(([-\d.]+)/);
  return m ? parseFloat(m[1]) : NaN;
};

describe('getTimeInZone', () => {
  it('returns the time in the requested zone', () => {
    expect(getTimeInZone('UTC', FIXED)).toEqual({ hours: 10, minutes: 15, seconds: 30 });
    expect(getTimeInZone('Asia/Kolkata', FIXED)).toEqual({ hours: 15, minutes: 45, seconds: 30 });
    expect(getTimeInZone('America/New_York', FIXED)).toEqual({ hours: 6, minutes: 15, seconds: 30 });
  });

  it('reports midnight as hour 0', () => {
    const midnight = new Date(Date.UTC(2026, 0, 1, 0, 0, 5));
    expect(getTimeInZone('UTC', midnight).hours).toBe(0);
  });

  it('falls back to local time for a missing or invalid zone', () => {
    const local = { hours: FIXED.getHours(), minutes: FIXED.getMinutes(), seconds: FIXED.getSeconds() };
    expect(getTimeInZone(null, FIXED)).toEqual(local);
    expect(getTimeInZone('Not/AZone', FIXED)).toEqual(local);
  });
});

describe('formatDigitalTime', () => {
  it('formats 12-hour time with AM/PM', () => {
    expect(formatDigitalTime({ hours: 0, minutes: 5, seconds: 9 })).toBe('12:05:09 AM');
    expect(formatDigitalTime({ hours: 12, minutes: 0, seconds: 0 })).toBe('12:00:00 PM');
    expect(formatDigitalTime({ hours: 23, minutes: 59, seconds: 59 })).toBe('11:59:59 PM');
  });

  it('can omit seconds', () => {
    expect(formatDigitalTime({ hours: 9, minutes: 30, seconds: 45 }, false)).toBe('09:30 AM');
  });

  it('formats 24-hour time without AM/PM', () => {
    expect(formatDigitalTime({ hours: 0, minutes: 5, seconds: 9 }, true, '24h')).toBe('00:05:09');
    expect(formatDigitalTime({ hours: 15, minutes: 45, seconds: 30 }, true, '24h')).toBe('15:45:30');
    expect(formatDigitalTime({ hours: 23, minutes: 59, seconds: 0 }, false, '24h')).toBe('23:59');
  });
});

describe('Clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is exported as Clock and AnalogClock', () => {
    expect(NamedClock).toBe(Clock);
    expect(AnalogClock).toBe(Clock);
  });

  it('shows the digital time for the given zone', () => {
    render(<Clock timezone="UTC" />);
    expect(screen.getByText('10:15:30 AM')).toBeInTheDocument();
  });

  it('positions the hands for the current time', () => {
    const { container } = render(<Clock timezone="UTC" />);
    // 10:15:30 -> hour (615/720)*360, minute (930/3600)*360, second 30*6
    expect(rotation(container.querySelector('[data-hand="hour"]'))).toBeCloseTo(307.5);
    expect(rotation(container.querySelector('[data-hand="minute"]'))).toBeCloseTo(93);
    expect(rotation(container.querySelector('[data-hand="second"]'))).toBeCloseTo(180);
  });

  it('ticks every second', () => {
    render(<Clock timezone="UTC" />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('10:15:32 AM')).toBeInTheDocument();
  });

  it('updates when the timezone prop changes', () => {
    const { rerender } = render(<Clock timezone="UTC" />);
    rerender(<Clock timezone="Asia/Tokyo" />);
    expect(screen.getByText('07:15:30 PM')).toBeInTheDocument();
  });

  it('stops its timer on unmount', () => {
    const { unmount } = render(<Clock timezone="UTC" />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('renders 12 numbers and 60 ticks', () => {
    const { container } = render(<Clock />);
    const numbers = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
    expect(numbers).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']);
    expect(container.querySelectorAll('line')).toHaveLength(61); // 60 ticks + second hand
  });

  it('shows an uppercase label when large enough', () => {
    render(<Clock label="London" radius={100} timezone="UTC" />);
    expect(screen.getByText('LONDON')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'London: 10:15:30 AM');
  });

  it('hides the label on small clocks', () => {
    render(<Clock label="London" radius={40} />);
    expect(screen.queryByText('LONDON')).not.toBeInTheDocument();
  });

  it('can hide the second hand and the digital readout', () => {
    const { container } = render(<Clock timezone="UTC" showSeconds={false} showDigital={false} />);
    expect(container.querySelector('[data-hand="second"]')).toBeNull();
    expect(container.querySelector('.analog-clock-digital')).toBeNull();
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', '10:15 AM');
  });

  it('sizes the SVG from the radius', () => {
    const { container } = render(<Clock radius={50} />);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('width')).toBe('136'); // 2 * 50 + 2 * 18 padding
  });

  it('sets the theme and face on the root element', () => {
    const { container } = render(<Clock theme="dark" face="gold" />);
    const root = container.querySelector('.analog-clock')!;
    expect(root).toHaveClass('analog-clock--gold');
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(root).toHaveAttribute('data-face', 'gold');
  });

  it('turns colour props into CSS variables that override the face', () => {
    const { container } = render(
      <Clock
        timezone="UTC"
        borderColor="#123456"
        tickColor="#111111"
        hourHandColor="#222222"
        minuteHandColor="#333333"
        secondHandColor="#444444"
        numberColor="#555555"
        digitalColor="#666666"
      />
    );
    const root = container.querySelector('.analog-clock') as HTMLElement;
    const v = (name: string) => root.style.getPropertyValue(name);
    expect(v('--ac-bezel')).toBe('#123456');
    expect(v('--ac-bezel-2')).toBe('#123456');
    expect(v('--ac-tick')).toBe('#111111');
    expect(v('--ac-minor-tick')).toBe('#111111');
    expect(v('--ac-hour-hand')).toBe('#222222');
    expect(v('--ac-minute-hand')).toBe('#333333');
    expect(v('--ac-second-hand')).toBe('#444444');
    expect(v('--ac-number')).toBe('#555555');
    expect(v('--ac-digital')).toBe('#666666');

    // Minute ticks stay lighter than hour ticks
    const ticks = Array.from(container.querySelectorAll('.ac-tick'));
    expect(ticks).toHaveLength(60);
    expect(ticks[1]).toHaveAttribute('stroke-opacity', '0.45');
    expect(ticks[0]).not.toHaveAttribute('stroke-opacity');
  });

  it('sets no CSS variables when no colour props are given', () => {
    const { container } = render(<Clock />);
    const root = container.querySelector('.analog-clock') as HTMLElement;
    expect(root.style.getPropertyValue('--ac-hour-hand')).toBe('');
  });

  it('draws the elements from CSS variables with theme fallbacks', () => {
    const { container } = render(<Clock theme="dark" />);
    const style = (sel: string) => container.querySelector(sel)!.getAttribute('style') ?? '';
    expect(style('[data-hand="hour"]')).toContain('var(--ac-hour-hand, #ddd)');
    expect(style('[data-hand="minute"]')).toContain('var(--ac-minute-hand, #ddd)');
    expect(style('[data-hand="second"] line')).toContain('var(--ac-second-hand, #e03a3a)');
    expect(style('.ac-tick--hour')).toContain('var(--ac-tick, #ddd)');
    expect(style('.ac-number')).toContain('var(--ac-number, #ddd)');
    expect(style('.analog-clock-digital')).toContain('var(--ac-digital, #ddd)');
  });

  describe('second hand style', () => {
    const hand = (container: HTMLElement) => container.querySelector('[data-hand="second"]')!;
    const C = 118; // radius 100 + 18 padding
    const markerCy = (container: HTMLElement) =>
      Number(container.querySelector('[data-part="second-marker"] circle')!.getAttribute('cy'));

    it('keeps the face hand by default', () => {
      const { container } = render(<Clock />);
      expect(hand(container).getAttribute('data-style')).toBe('face');
      expect(hand(container).querySelector('[data-part="second-marker"]')).toBeNull();
    });

    it.each(SECOND_HAND_STYLES.filter((s) => s.id !== 'face').map((s) => s.id))(
      '%s draws without the face counterweight',
      (style) => {
        const { container } = render(<Clock secondHandStyle={style} />);
        expect(hand(container).getAttribute('data-style')).toBe(style);
        expect(hand(container).querySelectorAll('circle:not([data-part="second-marker"] *)')).toHaveLength(0);
      },
    );

    it('lists the three hands plus every shape, filled and outlined', () => {
      const ids = SECOND_HAND_STYLES.map((s) => s.id);
      expect(ids.slice(0, 3)).toEqual(['face', 'plain', 'tapered']);
      expect(new Set(ids).size).toBe(11);
      for (const shape of ['circle', 'rect', 'half-circle', 'triangle'])
        for (const fill of ['filled', 'outline']) expect(ids).toContain(`${shape}-${fill}`);
    });

    it('draws filled and outlined objects', () => {
      const style = (c: HTMLElement) =>
        c.querySelector('[data-part="second-marker"] circle')!.getAttribute('style');
      expect(style(render(<Clock secondHandStyle="circle-filled" />).container)).not.toContain('fill: none');
      expect(style(render(<Clock secondHandStyle="circle-outline" />).container)).toContain('fill: none');
    });

    it('draws each object shape', () => {
      const shapes = { 'rect-outline': 'rect', 'half-circle-filled': 'path', 'triangle-outline': 'polygon' } as const;
      for (const [style, tag] of Object.entries(shapes)) {
        const { container } = render(<Clock secondHandStyle={style as keyof typeof shapes} />);
        expect(container.querySelector(`[data-part="second-marker"] ${tag}`)).not.toBeNull();
      }
    });

    it('places the object along the hand: 0 at the tail end, 100 (default) at the tip', () => {
      const { length, tail } = FACE_GEOMETRY.default.secondHand;
      const s = 5; // marker half-size at radius 100
      const at = (n?: number) =>
        markerCy(render(<Clock secondHandStyle="circle-filled" secondHandMarkerAt={n} />).container);
      expect(at()).toBeCloseTo(C - (length * 100 - s));
      expect(at(100)).toBeCloseTo(C - (length * 100 - s));
      expect(at(0)).toBeCloseTo(C + (tail * 100 - s));
      expect(at(50)).toBeCloseTo((at(0) + at(100)) / 2);
    });

    it('clamps the position to 0-100', () => {
      const at = (n: number) =>
        markerCy(render(<Clock secondHandStyle="circle-filled" secondHandMarkerAt={n} />).container);
      expect(at(150)).toBeCloseTo(at(100));
      expect(at(-20)).toBeCloseTo(at(0));
      expect(at(NaN)).toBeCloseTo(at(100));
    });

    it('keeps the hand running to the tip past a mid-hand object', () => {
      const { container } = render(<Clock secondHandStyle="circle-filled" secondHandMarkerAt={50} />);
      const L = FACE_GEOMETRY.default.secondHand.length * 100;
      const tipY = Math.min(
        ...Array.from(hand(container).querySelectorAll('line')).map((l) => Number(l.getAttribute('y2'))),
      );
      expect(tipY).toBeCloseTo(C - L);
    });

    it('plain is a single line and tapered a single shape', () => {
      const plain = render(<Clock secondHandStyle="plain" />).container;
      expect(hand(plain).children).toHaveLength(1);
      expect(hand(plain).firstElementChild!.tagName).toBe('line');
      const tapered = render(<Clock secondHandStyle="tapered" />).container;
      expect(hand(tapered).querySelector('[data-part="second-body"]')).not.toBeNull();
    });
  });

  describe('faces', () => {
    const count = (face: 'default' | 'gold' | 'blue', sel: string) =>
      render(<Clock face={face} />).container.querySelectorAll(sel).length;

    it('default face draws all 12 numbers and 60 ticks', () => {
      expect(count('default', '.ac-number')).toBe(12);
      expect(count('default', '.ac-tick')).toBe(60);
    });

    it('gold face shows numbers only at 12, 3, 6 and 9, with no marks under them', () => {
      const { container } = render(<Clock face="gold" />);
      const nums = Array.from(container.querySelectorAll('.ac-number')).map((n) => n.textContent);
      expect(nums).toEqual(['3', '6', '9', '12']);
      expect(container.querySelectorAll('.ac-tick')).toHaveLength(56);
    });

    it('blue face has no numbers, double lines at the quarters and pointed hands', () => {
      const { container } = render(<Clock face="blue" />);
      expect(container.querySelectorAll('.ac-number')).toHaveLength(0);
      expect(container.querySelectorAll('g.ac-tick')).toHaveLength(4); // 12, 3, 6, 9
      expect(container.querySelectorAll('line.ac-tick')).toHaveLength(56);
      // Tapered hands end in a curve, flat bar hands don't
      expect(container.querySelector('[data-hand="hour"]')!.getAttribute('d')).toContain('Q');
      expect(container.querySelector('[data-hand="minute"]')!.getAttribute('d')).toContain('Q');
    });

    it('wall-black face draws hour marks as dots inside the numbers', () => {
      const { container } = render(<Clock face="wall-black" />);
      expect(container.querySelectorAll('circle.ac-tick')).toHaveLength(12);
      expect(container.querySelectorAll('line.ac-tick')).toHaveLength(48);
      expect(container.querySelectorAll('.ac-number')).toHaveLength(12);
    });

    it('wall faces give the second hand a bar-shaped tail', () => {
      const { container } = render(<Clock face="wall-white" />);
      expect(container.querySelector('[data-hand="second"] rect')).not.toBeNull();
    });

    it('roman face uses rotated Roman numerals, a dial ring and no ticks', () => {
      const { container } = render(<Clock face="roman" />);
      const nums = Array.from(container.querySelectorAll('.ac-number'));
      expect(nums.map((n) => n.textContent)).toEqual([
        'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
      ]);
      expect(nums[2].getAttribute('transform')).toMatch(/^rotate\(90 /);
      expect(container.querySelectorAll('.ac-tick')).toHaveLength(0);
      expect(container.querySelectorAll('.ac-ring')).toHaveLength(1);
    });

    it('steel face shows upright Roman XII and VI, with no marks under them', () => {
      const { container } = render(<Clock face="steel" />);
      const nums = Array.from(container.querySelectorAll('.ac-number'));
      expect(nums.map((n) => n.textContent)).toEqual(['VI', 'XII']);
      expect(nums[0]).not.toHaveAttribute('transform');
      expect(container.querySelectorAll('.ac-tick--hour')).toHaveLength(10);
      expect(container.querySelectorAll('.ac-hand-facet')).toHaveLength(2);
    });

    it('navy face shows 12/3/6/9 with sword hands and a stripe inlay', () => {
      const { container } = render(<Clock face="navy" />);
      const nums = Array.from(container.querySelectorAll('.ac-number')).map((n) => n.textContent);
      expect(nums).toEqual(['3', '6', '9', '12']);
      expect(container.querySelectorAll('.ac-tick--hour')).toHaveLength(8);
      expect(container.querySelectorAll('.ac-hand-inlay')).toHaveLength(2);
      expect(container.querySelectorAll('.ac-hand-facet')).toHaveLength(0);
    });

    it('spectrum face uses plain line marks only, with no special shapes', () => {
      const { container } = render(<Clock face="spectrum" />);
      expect(container.querySelectorAll('line.ac-tick')).toHaveLength(60);
      expect(container.querySelectorAll('polygon.ac-tick, rect.ac-tick, circle.ac-tick, g.ac-tick')).toHaveLength(0);
      expect(container.querySelectorAll('.ac-number')).toHaveLength(0);
    });

    it('spectrum ticks are coloured by position, unless tickColor is set', () => {
      const style = (el: Element | null) => el?.getAttribute('style') ?? '';
      const { container, rerender } = render(<Clock face="spectrum" />);
      expect(style(container.querySelector('line.ac-tick'))).toContain('--ac-tick-hue');
      rerender(<Clock face="spectrum" tickColor="#ffffff" />);
      expect(style(container.querySelector('line.ac-tick'))).not.toContain('--ac-tick-hue');
    });

    it('chrono face has a minute track, all numbers and a triangle at 12', () => {
      const { container } = render(<Clock face="chrono" />);
      expect(container.querySelectorAll('.ac-number')).toHaveLength(12);
      expect(container.querySelectorAll('polygon.ac-tick')).toHaveLength(1);
      expect(container.querySelectorAll('.ac-hand-inlay')).toHaveLength(2);
    });

    it('ocean face has hour dots, bars at 3/6/9, a triangle at 12 and striped hands', () => {
      const { container } = render(<Clock face="ocean" />);
      expect(container.querySelectorAll('circle.ac-tick')).toHaveLength(8);
      expect(container.querySelectorAll('polygon.ac-tick')).toHaveLength(1);
      expect(container.querySelectorAll('line.ac-tick--hour')).toHaveLength(3);
      expect(container.querySelectorAll('.ac-hand-inlay')).toHaveLength(2);
    });

    it('blush face shows 12/3/6/9 with faceted hands and dotted minutes', () => {
      const { container } = render(<Clock face="blush" />);
      const nums = Array.from(container.querySelectorAll('.ac-number')).map((n) => n.textContent);
      expect(nums).toEqual(['3', '6', '9', '12']);
      expect(container.querySelectorAll('circle.ac-tick')).toHaveLength(48);
      expect(container.querySelectorAll('.ac-hand-facet')).toHaveLength(2);
    });

    it('every listed face renders', () => {
      for (const { id } of CLOCK_FACES) {
        const { container, unmount } = render(<Clock face={id} label="Test" />);
        expect(container.querySelector('.analog-clock')).toHaveAttribute('data-face', id);
        unmount();
      }
    });

    it('falls back to the default face for an unknown face', () => {
      // @ts-expect-error testing a bad value from untyped callers
      expect(count('nope', '.ac-number')).toBe(12);
    });
  });

  it('gives each clock unique SVG ids', () => {
    const { container } = render(
      <>
        <Clock />
        <Clock />
      </>
    );
    const ids = Array.from(container.querySelectorAll('radialGradient')).map((g) => g.id);
    expect(new Set(ids).size).toBe(2);
  });
});

describe('server rendering', () => {
  it('renders no time on the server, then hydrates without a mismatch', async () => {
    const { renderToString } = await import('react-dom/server');
    const { hydrateRoot } = await import('react-dom/client');
    const html = renderToString(<Clock label="London" timezone="UTC" />);
    expect(html).not.toContain('data-hand');
    expect(html).toContain('aria-label="London: Clock"');

    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.appendChild(host);
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(host, <Clock label="London" timezone="UTC" />, {
        onRecoverableError: recoverable,
      });
    });
    expect(recoverable).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
    // Once mounted in the browser, the hands and time appear
    expect(host.querySelector('[data-hand="hour"]')).not.toBeNull();
    errors.mockRestore();
    host.remove();
  });
});

describe('face styles', () => {
  it('adds the face stylesheet to <head> once, without importing style.css', () => {
    document.getElementById(FACE_STYLE_ID)?.remove();
    render(
      <>
        <Clock face="gold" />
        <Clock face="navy" />
      </>
    );
    const sheets = document.querySelectorAll(`#${FACE_STYLE_ID}`);
    expect(sheets).toHaveLength(1);
    expect(sheets[0].textContent).toContain('.analog-clock--gold');
    expect(sheets[0].textContent).toContain('.analog-clock--navy');
    // First in <head>, so the app's own CSS wins
    expect(document.head.firstElementChild).toBe(sheets[0]);
  });

  it('includes a stylesheet for every face', () => {
    const css = document.getElementById(FACE_STYLE_ID)?.textContent ?? '';
    for (const { id } of CLOCK_FACES) {
      expect(css).toContain(`.analog-clock--${id}`);
    }
  });
});

describe('public API', () => {
  it('does not expose internal face shapes', () => {
    expect(Object.keys(publicApi).sort()).toEqual(
      ['AnalogClock', 'CLOCK_FACES', 'Clock', 'SECOND_HAND_MOTIONS', 'SECOND_HAND_STYLES', 'formatDigitalTime', 'getTimeInZone', 'secondHandAngle'].sort()
    );
  });

  it('keeps face data read-only', () => {
    expect(Object.isFrozen(CLOCK_FACES)).toBe(true);
    expect(Object.isFrozen(CLOCK_FACES[0])).toBe(true);
    expect(Object.isFrozen(FACE_GEOMETRY)).toBe(true);
    expect(Object.isFrozen(FACE_GEOMETRY.gold.hourHand)).toBe(true);
    expect(() => {
      (FACE_GEOMETRY as Record<string, unknown>).gold = {};
    }).toThrow(TypeError);
  });
});
