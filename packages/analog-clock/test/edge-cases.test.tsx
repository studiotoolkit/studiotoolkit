import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Clock, { getTimeInZone, type ClockTheme } from '../src/Clock';

// Branches that only show up with unusual browsers or bad input from
// plain-JavaScript callers.

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('getTimeInZone', () => {
  it('reads a missing time part as 0', () => {
    vi.spyOn(Intl.DateTimeFormat.prototype, 'formatToParts').mockReturnValue([
      { type: 'hour', value: '7' },
    ]);
    expect(getTimeInZone('UTC')).toEqual({ hours: 7, minutes: 0, seconds: 0 });
  });
});

describe('<Clock theme>', () => {
  it('falls back to the light colours for an unknown theme', () => {
    const digitalColour = (theme: ClockTheme) =>
      (render(<Clock theme={theme} />).container.querySelector('.analog-clock-digital') as HTMLElement)
        .style.color;
    expect(digitalColour('sepia' as ClockTheme)).toBe(digitalColour('light'));
    expect(digitalColour('light')).not.toBe(digitalColour('dark'));
  });
});

describe('reduced motion', () => {
  it('switches a bouncy second hand to "tick" when the setting changes', () => {
    let matches = false;
    let listener: (() => void) | undefined;
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return matches;
      },
      addEventListener: (_: string, fn: () => void) => (listener = fn),
      removeEventListener: vi.fn(),
    }));
    const { container, unmount } = render(<Clock secondHandMotion="bounce" />);
    const motion = () => container.querySelector('[data-hand="second"]')?.getAttribute('data-motion');
    expect(motion()).toBe('bounce');

    matches = true;
    act(() => listener!());
    expect(motion()).toBe('tick');
    unmount();
  });
});

describe('square markers', () => {
  it('draws square hour markers as rotated squares', () => {
    const { container } = render(<Clock mainMarker="square" hourMarker="square" />);
    const squares = container.querySelectorAll('svg rect[transform^="rotate"]');
    expect(squares.length).toBe(12);
    const sq = squares[0];
    expect(sq.getAttribute('width')).toBe(sq.getAttribute('height'));
  });
});
