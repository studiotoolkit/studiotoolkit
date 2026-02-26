import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ColorPalette from '../src/ColorPalette';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_PALETTE = {
  complementary: ['#ff0000', '#00ffff'],
  triadic: ['#ff0000', '#00ff00', '#0000ff'],
};

const renderPalette = (props: Partial<React.ComponentProps<typeof ColorPalette>> = {}) =>
  render(<ColorPalette paletteData={SAMPLE_PALETTE} {...props} />);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ColorPalette', () => {
  // ── Null / empty data ────────────────────────────────────────────────────

  describe('null / empty paletteData', () => {
    it('renders nothing when paletteData is null', () => {
      const { container } = render(<ColorPalette paletteData={null} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders nothing when paletteData is an empty object', () => {
      const { container } = render(<ColorPalette paletteData={{}} />);
      // Container div renders but contains no palette sections
      expect(container.querySelector('.palette-section')).toBeNull();
    });

    it('skips keys whose value is an empty array', () => {
      const { container } = render(<ColorPalette paletteData={{ empty: [] }} />);
      expect(container.querySelector('.palette-section')).toBeNull();
    });

    it('skips keys whose value is undefined', () => {
      const { container } = render(<ColorPalette paletteData={{ missing: undefined }} />);
      expect(container.querySelector('.palette-section')).toBeNull();
    });
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the .color-palette-container element', () => {
      const { container } = renderPalette();
      expect(container.querySelector('.color-palette-container')).not.toBeNull();
    });

    it('renders one .palette-section per palette key', () => {
      const { container } = renderPalette();
      const sections = container.querySelectorAll('.palette-section');
      expect(sections).toHaveLength(Object.keys(SAMPLE_PALETTE).length);
    });

    it('renders section titles by default', () => {
      renderPalette();
      expect(screen.getByText('complementary')).toBeInTheDocument();
      expect(screen.getByText('triadic')).toBeInTheDocument();
    });

    it('hides section titles when displayTitle=false', () => {
      renderPalette({ displayTitle: false });
      expect(screen.queryByText('complementary')).toBeNull();
      expect(screen.queryByText('triadic')).toBeNull();
    });

    it('renders hex labels by default', () => {
      renderPalette({ paletteData: { test: ['#ff0000'] } });
      expect(screen.getAllByText('#ff0000').length).toBeGreaterThan(0);
    });

    it('hides hex labels when displayHexcode=false', () => {
      renderPalette({
        paletteData: { test: ['#ff0000'] },
        displayHexcode: false,
      });
      expect(screen.queryByText('#ff0000')).toBeNull();
    });

    it('renders one swatch per color in each section', () => {
      const { container } = renderPalette();
      const swatches = container.querySelectorAll('.swatchBox');
      const totalColors = Object.values(SAMPLE_PALETTE).flat().length;
      expect(swatches).toHaveLength(totalColors);
    });

    it('applies custom backgroundColor style when provided', () => {
      const { container } = renderPalette({ backgroundColor: '#123456' });
      const el = container.querySelector('.color-palette-container') as HTMLElement;
      expect(el.style.backgroundColor).toBe('rgb(18, 52, 86)');
    });

    it("does not apply inline background when backgroundColor is 'transparent'", () => {
      const { container } = renderPalette({ backgroundColor: 'transparent' });
      const el = container.querySelector('.color-palette-container') as HTMLElement;
      expect(el.style.backgroundColor).toBe('');
    });
  });

  // ── displayType ──────────────────────────────────────────────────────────

  describe('displayType', () => {
    const types = ['square', 'circle', 'triangle', 'block'] as const;

    types.forEach((type) => {
      it(`renders swatch layout for displayType="${type}" without throwing`, () => {
        expect(() => renderPalette({ displayType: type })).not.toThrow();
      });

      it(`applies display-${type} class on the colors wrapper for displayType="${type}"`, () => {
        const { container } = renderPalette({ displayType: type });
        expect(container.querySelector(`.display-${type}`)).not.toBeNull();
      });
    });

    it("renders a <table> for displayType='table'", () => {
      const { container } = renderPalette({ displayType: 'table' });
      expect(container.querySelector('table.palette-table')).not.toBeNull();
    });

    it('renders one color cell per color per part in table layout (parts=1)', () => {
      const data = { test: ['#ff0000', '#00ff00', '#0000ff'] };
      const { container } = renderPalette({
        paletteData: data,
        displayType: 'table',
        parts: 1,
      });
      const cells = container.querySelectorAll('td.color-cell');
      expect(cells).toHaveLength(3);
    });

    it('renders correct number of color rows in table layout (parts=2)', () => {
      const data = { test: ['#ff0000', '#00ff00'] };
      const { container } = renderPalette({
        paletteData: data,
        displayType: 'table',
        parts: 2,
      });
      // 2 part rows × 2 colors = 4 color cells
      const cells = container.querySelectorAll('td.color-cell');
      expect(cells).toHaveLength(4);
    });

    it('renders hex row in table layout when displayHexcode=true', () => {
      const data = { test: ['#aa1122'] };
      const { container } = renderPalette({
        paletteData: data,
        displayType: 'table',
        displayHexcode: true,
      });
      expect(container.querySelector('td.hex-cell')).not.toBeNull();
      expect(screen.getByText('#aa1122')).toBeInTheDocument();
    });

    it('omits hex row in table layout when displayHexcode=false', () => {
      const data = { test: ['#aa1122'] };
      const { container } = renderPalette({
        paletteData: data,
        displayType: 'table',
        displayHexcode: false,
      });
      expect(container.querySelector('td.hex-cell')).toBeNull();
    });
  });

  // ── parts prop ───────────────────────────────────────────────────────────

  describe('parts prop', () => {
    it('renders 1 band div per swatch when parts=1', () => {
      // parts=1 renders a single-div swatch (no child bands)
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        parts: 1,
      });
      // The shape container has no absolute-band children
      const swatchContainer = container.querySelector('.swatchBox > div');
      expect(swatchContainer?.children).toHaveLength(0);
    });

    it('renders 2 band divs per swatch when parts=2', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        parts: 2,
      });
      const swatchContainer = container.querySelector('.swatchBox > div');
      expect(swatchContainer?.children).toHaveLength(2);
    });

    it('renders 3 band divs per swatch when parts=3', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        parts: 3,
      });
      const swatchContainer = container.querySelector('.swatchBox > div');
      expect(swatchContainer?.children).toHaveLength(3);
    });

    it('renders the original color as the 3rd band when parts=3', () => {
      const originalHex = '#ab1234';
      const { container } = renderPalette({
        paletteData: { test: [originalHex] },
        parts: 3,
      });
      const bands = container.querySelectorAll('.swatchBox > div > div');
      // Third band should be the original hex color
      expect(bands[2]).toHaveStyle(`background: ${originalHex}`);
    });
  });

  // ── Copy button ──────────────────────────────────────────────────────────

  describe('copy button', () => {
    beforeEach(() => {
      Object.assign(navigator, {
        clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('does not render the Copy button by default', () => {
      renderPalette();
      expect(screen.queryByRole('button', { name: /copy/i })).toBeNull();
    });

    it('renders a Copy button per section when showCopyButton=true', () => {
      renderPalette({ showCopyButton: true });
      const buttons = screen.getAllByRole('button', { name: /copy/i });
      expect(buttons).toHaveLength(Object.keys(SAMPLE_PALETTE).length);
    });

    it('calls clipboard.writeText with correctly formatted JSON when Copy is clicked', async () => {
      const data = { myPalette: ['#ff0000', '#00ff00'] };
      renderPalette({ paletteData: data, showCopyButton: true });

      const button = screen.getByRole('button', { name: /copy/i });
      fireEvent.click(button);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
          JSON.stringify({ myPalette: ['#ff0000', '#00ff00'] }, null, 2)
        );
      });
    });

    it('does not throw when clipboard.writeText rejects', async () => {
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockRejectedValue(new Error('denied')),
        },
      });

      renderPalette({ showCopyButton: true });
      const button = screen.getAllByRole('button', { name: /copy/i })[0];

      // Should silently fail — no error propagated to the component
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  // ── Styling props ────────────────────────────────────────────────────────

  describe('styling props', () => {
    it('applies custom fontColor to hex labels', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#aabbcc'] },
        fontColor: '#ff00ff',
        displayHexcode: true,
      });
      const label = container.querySelector('.hex-label') as HTMLElement;
      expect(label.style.color).toBe('rgb(255, 0, 255)');
    });

    it('applies custom fontSize to hex labels', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#aabbcc'] },
        fontSize: 16,
        displayHexcode: true,
      });
      const label = container.querySelector('.hex-label') as HTMLElement;
      expect(label.style.fontSize).toBe('16px');
    });

    it('applies custom width to swatch containers', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        width: 80,
        parts: 1,
      });
      const swatch = container.querySelector('.swatchBox > div') as HTMLElement;
      expect(swatch.style.width).toBe('80px');
    });

    it('applies custom boxBorderColor to swatches', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        boxBorderColor: '#abcdef',
        parts: 1,
      });
      const swatch = container.querySelector('.swatchBox > div') as HTMLElement;
      expect(swatch.style.borderColor).toBe('rgb(171, 205, 239)');
    });

    it('applies borderRadius=50% for circle displayType', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        displayType: 'circle',
        parts: 1,
      });
      const swatch = container.querySelector('.swatchBox > div') as HTMLElement;
      expect(swatch.style.borderRadius).toBe('50%');
    });

    it('applies clipPath polygon for triangle displayType', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        displayType: 'triangle',
        parts: 1,
      });
      const swatch = container.querySelector('.swatchBox > div') as HTMLElement;
      expect(swatch.style.clipPath).toContain('polygon');
    });

    it('applies borderRadius=0 for square displayType', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        displayType: 'square',
        parts: 1,
      });
      const swatch = container.querySelector('.swatchBox > div') as HTMLElement;
      expect(swatch.style.borderRadius).toBe('0');
    });
  });

  // ── Color math (applySB) ─────────────────────────────────────────────────

  describe('color transformation via saturation/brightness props', () => {
    it('renders a fully white swatch when brightness1=100 and saturation1=0', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        parts: 1,
        saturation1: 0,
        brightness1: 100,
      });
      const swatch = container.querySelector('.swatchBox > div') as HTMLElement;
      // hsl(any, 0%, 100%) = white = #ffffff
      expect(swatch.style.background).toMatch(/rgb\(255,\s*255,\s*255\)/);
    });

    it('renders a fully black swatch when brightness1=0', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        parts: 1,
        saturation1: 100,
        brightness1: 0,
      });
      const swatch = container.querySelector('.swatchBox > div') as HTMLElement;
      expect(swatch.style.background).toMatch(/rgb\(0,\s*0,\s*0\)/);
    });

    it('top band (part 1) uses saturation1/brightness1 transforms', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        parts: 3,
        saturation1: 0,
        brightness1: 50,
        saturation2: 100,
        brightness2: 50,
      });
      const bands = container.querySelectorAll('.swatchBox > div > div');
      // sat=0 → grey, hue of red with l=0.5 → rgb(128,128,128)
      expect(bands[0]).toHaveStyle('background: rgb(128, 128, 128)');
    });

    it('bottom band (part 3) always shows the original hex', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#ff0000'] },
        parts: 3,
      });
      const bands = container.querySelectorAll('.swatchBox > div > div');
      expect(bands[2]).toHaveStyle('background: #ff0000');
    });

    it('each band occupies an equal percentage height', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#aabbcc'] },
        parts: 2,
      });
      const bands = Array.from(
        container.querySelectorAll('.swatchBox > div > div')
      ) as HTMLElement[];
      bands.forEach((band) => {
        expect(band.style.height).toBe('50%');
      });
    });

    it('3-part bands each occupy ~33.33% height', () => {
      const { container } = renderPalette({
        paletteData: { test: ['#aabbcc'] },
        parts: 3,
      });
      const bands = Array.from(
        container.querySelectorAll('.swatchBox > div > div')
      ) as HTMLElement[];
      bands.forEach((band) => {
        const pct = parseFloat(band.style.height);
        expect(pct).toBeCloseTo(33.33, 1);
      });
    });
  });

  // ── Multiple sections ────────────────────────────────────────────────────

  describe('multiple palette sections', () => {
    it('renders all sections from paletteData', () => {
      const data = { a: ['#111111'], b: ['#222222'], c: ['#333333'] };
      const { container } = render(<ColorPalette paletteData={data} />);
      expect(container.querySelectorAll('.palette-section')).toHaveLength(3);
    });

    it('renders section titles for every key', () => {
      const data = { red: ['#ff0000'], blue: ['#0000ff'] };
      render(<ColorPalette paletteData={data} />);
      expect(screen.getByText('red')).toBeInTheDocument();
      expect(screen.getByText('blue')).toBeInTheDocument();
    });
  });
});
