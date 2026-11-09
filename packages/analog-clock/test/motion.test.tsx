import { render, act, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Clock from '../src/Clock';
import { secondHandAngle, SECOND_HAND_MOTIONS } from '../src/motion';
import * as publicApi from '../src/index';

const rotation = (el: Element | null) => {
  const m = el?.getAttribute('transform')?.match(/rotate\(([-\d.]+)/);
  return m ? parseFloat(m[1]) : NaN;
};

describe('secondHandAngle', () => {
  it('tick jumps once a second', () => {
    expect(secondHandAngle('tick', 30, 999)).toBe(180);
  });

  it('smooth follows the milliseconds', () => {
    expect(secondHandAngle('smooth', 30, 500)).toBeCloseTo(183);
  });

  it('sweep moves in eighths of a second', () => {
    expect(secondHandAngle('sweep', 30, 124)).toBeCloseTo(180);
    expect(secondHandAngle('sweep', 30, 125)).toBeCloseTo(180.75);
    expect(secondHandAngle('sweep', 30, 999)).toBeCloseTo(185.25);
  });

  it('stop-to-go laps in 58 seconds, then waits at 12', () => {
    expect(secondHandAngle('stop-to-go', 29, 0)).toBeCloseTo(180);
    expect(secondHandAngle('stop-to-go', 58, 0)).toBeCloseTo(360);
    expect(secondHandAngle('stop-to-go', 59, 900)).toBeCloseTo(360);
    expect(secondHandAngle('stop-to-go', 0, 0)).toBe(0);
  });

  it('bounce reaches the mark on the second, overshoots, then settles', () => {
    expect(secondHandAngle('bounce', 29, 900)).toBeCloseTo(174);
    expect(secondHandAngle('bounce', 29, 950)).toBeGreaterThan(174);
    expect(secondHandAngle('bounce', 30, 0)).toBeCloseTo(180);
    expect(secondHandAngle('bounce', 30, 90)).toBeGreaterThan(180);
    expect(secondHandAngle('bounce', 30, 700)).toBe(180);
  });

  it('ease lands exactly on the second', () => {
    expect(secondHandAngle('ease', 29, 700)).toBeCloseTo(174);
    expect(secondHandAngle('ease', 29, 850)).toBeCloseTo(177);
    expect(secondHandAngle('ease', 30, 0)).toBe(180);
    expect(secondHandAngle('ease', 30, 500)).toBe(180);
  });

  it('anticipate dips back, then lands on the second', () => {
    expect(secondHandAngle('anticipate', 29, 825)).toBeLessThan(174);
    expect(secondHandAngle('anticipate', 30, 0)).toBe(180);
  });

  it('is exported with a list of motions', () => {
    expect(publicApi.secondHandAngle).toBe(secondHandAngle);
    expect(SECOND_HAND_MOTIONS.map((m) => m.id)).toEqual([
      'tick', 'smooth', 'sweep', 'stop-to-go', 'bounce', 'ease', 'anticipate',
    ]);
  });
});

describe('Clock secondHandMotion', () => {
  // 10:15:30.500 UTC
  const FIXED = new Date(Date.UTC(2026, 2, 15, 10, 15, 30, 500));
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date', 'requestAnimationFrame', 'cancelAnimationFrame'] });
    vi.setSystemTime(FIXED);
  });
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('defaults to tick', () => {
    const { container } = render(<Clock timezone="UTC" />);
    const hand = container.querySelector('[data-hand="second"]');
    expect(hand).toHaveAttribute('data-motion', 'tick');
    expect(rotation(hand)).toBeCloseTo(180);
  });

  it('smooth places the hand between seconds and keeps moving', () => {
    const { container } = render(<Clock timezone="UTC" secondHandMotion="smooth" />);
    const hand = container.querySelector('[data-hand="second"]');
    expect(rotation(hand)).toBeCloseTo(183);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(rotation(hand)).toBeGreaterThan(183);
  });

  it('stop-to-go keeps the minute hand on the minute', () => {
    const { container } = render(<Clock timezone="UTC" secondHandMotion="stop-to-go" />);
    expect(rotation(container.querySelector('[data-hand="minute"]'))).toBeCloseTo(90);
  });

  it('draws the current angle on the first render after switching motion', () => {
    const { container, rerender } = render(<Clock timezone="UTC" />);
    rerender(<Clock timezone="UTC" secondHandMotion="smooth" />);
    expect(rotation(container.querySelector('[data-hand="second"]'))).toBeCloseTo(183);
  });

  it('falls back to tick for wobbly motions under reduced motion', () => {
    const original = window.matchMedia;
    window.matchMedia = ((q: string) => ({
      matches: q.includes('reduce'),
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      const { container } = render(<Clock timezone="UTC" secondHandMotion="bounce" />);
      expect(container.querySelector('[data-hand="second"]')).toHaveAttribute('data-motion', 'tick');
      const smooth = render(<Clock timezone="UTC" secondHandMotion="smooth" />);
      expect(smooth.container.querySelector('[data-hand="second"]')).toHaveAttribute('data-motion', 'smooth');
    } finally {
      window.matchMedia = original;
    }
  });

  it('keeps the time current when animation frames are paused', () => {
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
    render(<Clock timezone="UTC" secondHandMotion="smooth" />);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('10:15:32 AM')).toBeInTheDocument();
  });

  it('stops animating on unmount', () => {
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame');
    const { unmount } = render(<Clock secondHandMotion="bounce" />);
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
