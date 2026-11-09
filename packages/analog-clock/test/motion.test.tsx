import { render, act } from '@testing-library/react';
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

  it('swiss laps in 58 seconds, then waits at 12', () => {
    expect(secondHandAngle('swiss', 29, 0)).toBeCloseTo(180);
    expect(secondHandAngle('swiss', 58, 0)).toBeCloseTo(360);
    expect(secondHandAngle('swiss', 59, 900)).toBeCloseTo(360);
    expect(secondHandAngle('swiss', 0, 0)).toBe(0);
  });

  it('bounce overshoots, then settles on the mark', () => {
    expect(secondHandAngle('bounce', 30, 0)).toBeCloseTo(174);
    expect(secondHandAngle('bounce', 30, 175)).toBeGreaterThan(180);
    expect(secondHandAngle('bounce', 30, 700)).toBe(180);
  });

  it('ease starts at the last mark and ends on the new one', () => {
    expect(secondHandAngle('ease', 30, 0)).toBeCloseTo(174);
    expect(secondHandAngle('ease', 30, 150)).toBeCloseTo(177);
    expect(secondHandAngle('ease', 30, 300)).toBe(180);
  });

  it('anticipate dips back before moving forward', () => {
    expect(secondHandAngle('anticipate', 30, 175)).toBeLessThan(174);
    expect(secondHandAngle('anticipate', 30, 350)).toBe(180);
  });

  it('is exported with a list of motions', () => {
    expect(publicApi.secondHandAngle).toBe(secondHandAngle);
    expect(SECOND_HAND_MOTIONS.map((m) => m.id)).toEqual([
      'tick', 'smooth', 'sweep', 'swiss', 'bounce', 'ease', 'anticipate',
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
  afterEach(() => vi.useRealTimers());

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

  it('swiss keeps the minute hand on the minute', () => {
    const { container } = render(<Clock timezone="UTC" secondHandMotion="swiss" />);
    expect(rotation(container.querySelector('[data-hand="minute"]'))).toBeCloseTo(90);
  });

  it('stops animating on unmount', () => {
    const cancel = vi.spyOn(globalThis, 'cancelAnimationFrame');
    const { unmount } = render(<Clock secondHandMotion="bounce" />);
    unmount();
    expect(cancel).toHaveBeenCalled();
  });
});
