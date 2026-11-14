import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Clock from '../src/Clock';
import { DATE_FORMATS, formatClockDate } from '../src/index';

// Saturday 2026-11-14 18:30:00 UTC (already Sunday the 15th in Tokyo)
const SAT = new Date(Date.UTC(2026, 10, 14, 18, 30, 0));

describe('formatClockDate', () => {
  it.each([
    ['none', ''],
    ['day-short', 'Sat'],
    ['day-long', 'Saturday'],
    ['date-us', '11/14/2026'],
    ['date-short', 'Nov-14-2026'],
    ['date-intl', '14-Nov-2026'],
    ['day-date', 'Sat · Nov 14'],
  ] as const)('formats %s', (format, expected) => {
    expect(formatClockDate(format, SAT, 'UTC')).toBe(expected);
  });

  it('pads single-digit days in the dashed formats', () => {
    const d = new Date(Date.UTC(2026, 0, 5, 12));
    expect(formatClockDate('date-short', d, 'UTC')).toBe('Jan-05-2026');
    expect(formatClockDate('date-intl', d, 'UTC')).toBe('05-Jan-2026');
    expect(formatClockDate('date-us', d, 'UTC')).toBe('1/5/2026');
  });

  it("uses the clock's time zone, not the browser's", () => {
    expect(formatClockDate('day-date', SAT, 'Asia/Tokyo')).toBe('Sun · Nov 15');
    expect(formatClockDate('date-intl', SAT, 'America/Los_Angeles')).toBe('14-Nov-2026');
  });

  it('uses local time when no zone is given', () => {
    expect(formatClockDate('date-us', SAT)).toBe(SAT.toLocaleDateString('en-US'));
    expect(formatClockDate('day-long', SAT, null)).toBe(
      SAT.toLocaleDateString('en-US', { weekday: 'long' }),
    );
  });

  it('returns nothing for an unknown format', () => {
    expect(formatClockDate('julian' as never, SAT, 'UTC')).toBe('');
  });

  it('falls back to local time for an invalid zone', () => {
    expect(formatClockDate('date-us', SAT, 'Not/AZone')).toBe(SAT.toLocaleDateString('en-US'));
  });

  it('formats "locale" in the visitor\'s language', () => {
    const text = formatClockDate('locale', SAT, 'UTC');
    expect(text).toBe(
      SAT.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }),
    );
  });

  it('lists every format with a label and example', () => {
    expect(DATE_FORMATS.map((f) => f.id)).toEqual([
      'none', 'day-short', 'day-long', 'date-us', 'date-short', 'date-intl', 'day-date', 'locale',
    ]);
    for (const f of DATE_FORMATS) expect(f.label).toBeTruthy();
  });
});

describe('<Clock dateFormat>', () => {
  afterEach(() => vi.useRealTimers());

  const mount = (ui: React.ReactElement) => {
    vi.useFakeTimers();
    vi.setSystemTime(SAT);
    const result = render(ui);
    act(() => vi.advanceTimersByTime(0));
    return result;
  };

  it('shows no date by default', () => {
    const { container } = mount(<Clock timezone="UTC" />);
    expect(container.querySelector('.analog-clock-date')).toBeNull();
  });

  it('shows the date below the dial in the clock\'s zone', () => {
    const { container } = mount(<Clock timezone="Asia/Tokyo" dateFormat="day-date" />);
    const el = container.querySelector('.analog-clock-date');
    expect(el?.textContent).toBe('Sun · Nov 15');
    // After the svg (and the digital time)
    expect(container.querySelector('.analog-clock')?.lastElementChild).toBe(el);
  });

  it('shows the date even without the digital time', () => {
    const { container } = mount(<Clock timezone="UTC" showDigital={false} dateFormat="day-long" />);
    expect(container.querySelector('.analog-clock-date')?.textContent).toBe('Saturday');
  });

  it('includes the date in the aria-label', () => {
    const { container } = mount(<Clock timezone="UTC" label="London" dateFormat="date-intl" />);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe(
      'London: 06:30:00 PM, 14-Nov-2026',
    );
  });

  it('draws the date on the dial with dateInside', () => {
    const { container } = mount(<Clock timezone="UTC" dateFormat="day-short" dateInside />);
    expect(container.querySelector('svg .ac-date')?.textContent).toBe('Sat');
    expect(container.querySelector('.analog-clock-date')).toBeNull();
    // Lower half of the dial
    const svg = container.querySelector('svg')!;
    const centre = Number(svg.getAttribute('width')) / 2;
    expect(Number(container.querySelector('.ac-date')!.getAttribute('y'))).toBeGreaterThan(centre);
  });

  it('puts the date under a label that sits below the centre', () => {
    const { container } = mount(
      <Clock face="wall-black" label="Home" timezone="UTC" dateFormat="day-short" dateInside />,
    );
    const labelY = Number(container.querySelector('.ac-label')!.getAttribute('y'));
    const dateY = Number(container.querySelector('.ac-date')!.getAttribute('y'));
    expect(dateY).toBeGreaterThan(labelY);
  });

  it('moves the date below the clock when the dial is too small', () => {
    const { container } = mount(<Clock radius={40} timezone="UTC" dateFormat="day-short" dateInside />);
    expect(container.querySelector('.ac-date')).toBeNull();
    expect(container.querySelector('.analog-clock-date')?.textContent).toBe('Sat');
  });
});
