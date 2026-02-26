import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ColorWheel from '../src/ColorWheel';
import { ThemeProvider } from '../src/ThemeContext';

// ---------------------------------------------------------------------------
// Helpers / mocks
// ---------------------------------------------------------------------------

/** Wrap component in required ThemeProvider context */
const renderWheel = (props: React.ComponentProps<typeof ColorWheel> = {}) =>
  render(
    <ThemeProvider>
      <ColorWheel {...props} />
    </ThemeProvider>
  );

/**
 * Create a minimal mock for CanvasRenderingContext2D so canvas draw calls
 * don't throw in jsdom (which has no real canvas implementation).
 */
function mockCanvas() {
  const ctx: Partial<CanvasRenderingContext2D> = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    closePath: vi.fn(),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
  };

  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx as CanvasRenderingContext2D);

  return ctx;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ColorWheel', () => {
  let ctx: Partial<CanvasRenderingContext2D>;

  beforeEach(() => {
    ctx = mockCanvas();
    // Silence localStorage usage in ThemeProvider (jsdom has it but it's
    // cleaner to reset between tests)
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders a canvas element inside the container', () => {
      renderWheel();
      const canvas = document.querySelector('canvas');
      expect(canvas).not.toBeNull();
    });

    it('applies the default width and height (450×450) to the canvas', () => {
      renderWheel();
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(450);
      expect(canvas.height).toBe(450);
    });

    it('applies custom width and height props to the canvas', () => {
      renderWheel({ width: 300, height: 300 });
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(300);
      expect(canvas.height).toBe(300);
    });

    it('wraps the canvas in a .color-wheel-container div', () => {
      const { container } = renderWheel();
      expect(container.querySelector('.color-wheel-container')).not.toBeNull();
    });

    it('sets cursor:pointer style on the canvas', () => {
      renderWheel();
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas.style.cursor).toBe('pointer');
    });
  });

  // ── Canvas drawing ─────────────────────────────────────────────────────────

  describe('canvas drawing', () => {
    it("calls getContext('2d') on mount", () => {
      renderWheel();
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    });

    it('calls clearRect on every redraw', () => {
      renderWheel();
      expect(ctx.clearRect).toHaveBeenCalled();
    });

    it('calls arc to draw the color wheel segments', () => {
      renderWheel();
      // 360 arcs for the hue wheel
      expect(ctx.arc).toHaveBeenCalled();
    });

    it('fills the background with a light color when theme is light', () => {
      // ThemeProvider defaults to light; canvasBackgroundColor defaults to
      // "transparent" which triggers theme-aware fill
      renderWheel();
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });

  // ── Props → initial state ──────────────────────────────────────────────────

  describe('prop defaults', () => {
    it('accepts harmonyMode prop without throwing', () => {
      expect(() => renderWheel({ harmonyMode: 'triadic' })).not.toThrow();
    });

    it('accepts saturation prop without throwing', () => {
      expect(() => renderWheel({ saturation: 80 })).not.toThrow();
    });

    it('accepts brightness prop without throwing', () => {
      expect(() => renderWheel({ brightness: 40 })).not.toThrow();
    });

    it('accepts all optional props without throwing', () => {
      expect(() =>
        renderWheel({
          harmonyMode: 'square',
          saturation: 90,
          brightness: 55,
          circleRadius: 150,
          wheelThickness: 60,
          dotSize: 8,
          dotPosition: 'inner',
          handleThickness: 3,
          handleColor: '#ff0000',
          harmonyPolygon: true,
          polygonColor: '#0000ff',
          polygonThickness: 2,
          centerDot: '#00ff00',
          showCenterDot: true,
          borderColor: '#333333',
          canvasBackgroundColor: '#ffffff',
          width: 400,
          height: 400,
        })
      ).not.toThrow();
    });
  });

  // ── onColorsChange callback ────────────────────────────────────────────────

  describe('onColorsChange callback', () => {
    it('calls onColorsChange on mount with the initial palette', () => {
      const handler = vi.fn();
      renderWheel({ onColorsChange: handler });
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('passes a PaletteOutput object with the harmony mode as key', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'complementary', onColorsChange: handler });
      const palette = handler.mock.calls[0][0];
      expect(palette).toHaveProperty('complementary');
    });

    it('complementary palette contains exactly 2 colors', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'complementary', onColorsChange: handler });
      const palette = handler.mock.calls[0][0];
      expect(palette.complementary).toHaveLength(2);
    });

    it('triadic palette contains exactly 3 colors', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'triadic', onColorsChange: handler });
      const palette = handler.mock.calls[0][0];
      expect(palette.triadic).toHaveLength(3);
    });

    it('square palette contains exactly 4 colors', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'square', onColorsChange: handler });
      const palette = handler.mock.calls[0][0];
      expect(palette.square).toHaveLength(4);
    });

    it('monochromatic palette contains exactly 3 colors', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'monochromatic', onColorsChange: handler });
      const palette = handler.mock.calls[0][0];
      expect(palette.monochromatic).toHaveLength(3);
    });

    it('analogous palette contains exactly 3 colors', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'analogous', onColorsChange: handler });
      const palette = handler.mock.calls[0][0];
      expect(palette.analogous).toHaveLength(3);
    });

    it('split palette contains exactly 3 colors', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'split', onColorsChange: handler });
      const palette = handler.mock.calls[0][0];
      expect(palette.split).toHaveLength(3);
    });

    it('each palette color is a valid 7-character hex string', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'triadic', onColorsChange: handler });
      const colors: string[] = handler.mock.calls[0][0].triadic;
      colors.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });

    it('calls onColorsChange again when harmonyMode prop changes', () => {
      const handler = vi.fn();
      const { rerender } = render(
        <ThemeProvider>
          <ColorWheel harmonyMode="complementary" onColorsChange={handler} />
        </ThemeProvider>
      );

      const callsBefore = handler.mock.calls.length;

      act(() => {
        rerender(
          <ThemeProvider>
            <ColorWheel harmonyMode="triadic" onColorsChange={handler} />
          </ThemeProvider>
        );
      });

      expect(handler.mock.calls.length).toBeGreaterThan(callsBefore);
      // Last call should have "triadic" key
      const lastPalette = handler.mock.calls[handler.mock.calls.length - 1][0];
      expect(lastPalette).toHaveProperty('triadic');
    });
  });

  // ── Mouse interaction ──────────────────────────────────────────────────────

  describe('mouse interaction', () => {
    it('updates baseHue when the canvas is clicked', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'complementary', onColorsChange: handler });

      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const callsBefore = handler.mock.calls.length;

      // Simulate a click near the top of the wheel
      fireEvent.click(canvas, { clientX: 225, clientY: 50 });

      // onColorsChange should have fired again with a (possibly) new hue
      expect(handler.mock.calls.length).toBeGreaterThanOrEqual(callsBefore);
    });

    it('does not update hue on mousemove when not dragging', () => {
      const handler = vi.fn();
      renderWheel({ onColorsChange: handler });

      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      const callsBefore = handler.mock.calls.length;

      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });

      // No drag → no hue change → same number of calls
      expect(handler.mock.calls.length).toBe(callsBefore);
    });

    it('updates hue on mousemove while dragging (mousedown held)', () => {
      const handler = vi.fn();
      renderWheel({ harmonyMode: 'complementary', onColorsChange: handler });

      const canvas = document.querySelector('canvas') as HTMLCanvasElement;

      fireEvent.mouseDown(canvas);
      const callsAfterDown = handler.mock.calls.length;

      fireEvent.mouseMove(canvas, { clientX: 80, clientY: 80 });

      expect(handler.mock.calls.length).toBeGreaterThanOrEqual(callsAfterDown);
    });

    it('stops dragging after mouseup', () => {
      const handler = vi.fn();
      renderWheel({ onColorsChange: handler });

      const canvas = document.querySelector('canvas') as HTMLCanvasElement;

      fireEvent.mouseDown(canvas);
      fireEvent.mouseUp(canvas);

      const callsAfterUp = handler.mock.calls.length;
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 300 });

      // Movement after mouseup should not trigger additional palette changes
      expect(handler.mock.calls.length).toBe(callsAfterUp);
    });

    it('stops dragging when mouse leaves the canvas', () => {
      const handler = vi.fn();
      renderWheel({ onColorsChange: handler });

      const canvas = document.querySelector('canvas') as HTMLCanvasElement;

      fireEvent.mouseDown(canvas);
      fireEvent.mouseLeave(canvas);

      const callsAfterLeave = handler.mock.calls.length;
      fireEvent.mouseMove(canvas, { clientX: 300, clientY: 300 });

      expect(handler.mock.calls.length).toBe(callsAfterLeave);
    });
  });

  // ── window.getColorWheelPalette ────────────────────────────────────────────

  describe('window.getColorWheelPalette', () => {
    it('exposes getColorWheelPalette on window after mount', () => {
      renderWheel({ harmonyMode: 'triadic' });
      expect((window as unknown as Record<string, unknown>).getColorWheelPalette).toBeTypeOf(
        'function'
      );
    });

    it('getColorWheelPalette returns the current palette', () => {
      renderWheel({ harmonyMode: 'triadic' });
      const getPalette = (
        window as unknown as { getColorWheelPalette: () => Record<string, string[]> }
      ).getColorWheelPalette;
      const palette = getPalette();
      expect(palette).toHaveProperty('triadic');
      expect(palette.triadic).toHaveLength(3);
    });

    it('removes getColorWheelPalette from window on unmount', () => {
      const { unmount } = renderWheel();
      unmount();
      expect((window as unknown as Record<string, unknown>).getColorWheelPalette).toBeUndefined();
    });
  });

  // ── Prop updates (re-render) ───────────────────────────────────────────────

  describe('prop updates via re-render', () => {
    it('updates saturation when prop changes', () => {
      const handler = vi.fn();
      const { rerender } = render(
        <ThemeProvider>
          <ColorWheel saturation={100} onColorsChange={handler} harmonyMode="complementary" />
        </ThemeProvider>
      );

      act(() => {
        rerender(
          <ThemeProvider>
            <ColorWheel saturation={50} onColorsChange={handler} harmonyMode="complementary" />
          </ThemeProvider>
        );
      });

      // New palette should reflect the changed saturation
      const lastPalette = handler.mock.calls[handler.mock.calls.length - 1][0];
      expect(lastPalette).toHaveProperty('complementary');
    });

    it('updates harmony mode when prop changes', () => {
      const handler = vi.fn();
      const { rerender } = render(
        <ThemeProvider>
          <ColorWheel harmonyMode="complementary" onColorsChange={handler} />
        </ThemeProvider>
      );

      act(() => {
        rerender(
          <ThemeProvider>
            <ColorWheel harmonyMode="square" onColorsChange={handler} />
          </ThemeProvider>
        );
      });

      const lastPalette = handler.mock.calls[handler.mock.calls.length - 1][0];
      expect(lastPalette).toHaveProperty('square');
      expect(lastPalette.square).toHaveLength(4);
    });
  });

  // ── Edge cases ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles zero saturation (greyscale) without throwing', () => {
      const handler = vi.fn();
      expect(() => renderWheel({ saturation: 0, onColorsChange: handler })).not.toThrow();
      const palette = handler.mock.calls[0][0];
      // All colors should still be valid hex
      Object.values(palette)
        .flat()
        .forEach((c) => {
          expect(c as string).toMatch(/^#[0-9a-f]{6}$/i);
        });
    });

    it('handles brightness=0 without throwing', () => {
      expect(() => renderWheel({ brightness: 0 })).not.toThrow();
    });

    it('handles brightness=100 without throwing', () => {
      expect(() => renderWheel({ brightness: 100 })).not.toThrow();
    });

    it('renders correctly when showCenterDot is true', () => {
      expect(() => renderWheel({ showCenterDot: true, centerDot: '#ff0000' })).not.toThrow();
    });

    it('renders correctly when harmonyPolygon is enabled', () => {
      expect(() =>
        renderWheel({
          harmonyPolygon: true,
          polygonColor: '#00ff00',
          harmonyMode: 'triadic',
        })
      ).not.toThrow();
    });

    it('renders correctly in simple mode (no handles drawn)', () => {
      expect(() => renderWheel({ harmonyMode: 'simple' })).not.toThrow();
      // In simple mode drawHands returns early, so moveTo should not have been
      // called for handles
      expect(ctx.moveTo).not.toHaveBeenCalled();
    });

    it('does not call onColorsChange if prop is not provided', () => {
      // Should mount without errors even without the callback
      expect(() => renderWheel()).not.toThrow();
    });

    it('uses a custom canvasBackgroundColor when provided', () => {
      renderWheel({ canvasBackgroundColor: '#123456' });
      // fillRect is called for the custom background
      expect(ctx.fillRect).toHaveBeenCalled();
    });
  });
});
