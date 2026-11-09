import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Clock, { getTimeInZone, formatDigitalTime } from '../src/Clock';
import { Clock as NamedClock, AnalogClock } from '../src/index';

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

  it('applies theme colours and a custom border colour', () => {
    const { container, rerender } = render(<Clock theme="dark" />);
    const root = container.querySelector('.analog-clock')!;
    expect(root).toHaveAttribute('data-theme', 'dark');
    expect(container.querySelector('svg > circle')).toHaveAttribute('stroke', '#56677a');

    rerender(<Clock theme="dark" borderColor="#123456" />);
    expect(container.querySelector('svg > circle')).toHaveAttribute('stroke', '#123456');
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
