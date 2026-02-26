import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ColorFromImage from '../src/ColorFromImage';

// ---------------------------------------------------------------------------
// Canvas / Image mocks
// ---------------------------------------------------------------------------

/**
 * jsdom has no real canvas implementation. We replace getContext with a
 * minimal mock so draw calls don't throw and getImageData returns a
 * predictable pixel buffer (solid red, fully opaque) that the colour
 * extraction algorithm can work with.
 */
function setupCanvasMock(imageDataOverride?: Uint8ClampedArray) {
  // 4 red pixels — simple but enough for k-means to extract #ff0000
  const defaultPixels = new Uint8ClampedArray([
    255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255, 255, 0, 0, 255,
  ]);

  const pixels = imageDataOverride ?? defaultPixels;

  const ctx = {
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: pixels,
      width: 2,
      height: 2,
    })),
    fillRect: vi.fn(),
    fillStyle: '',
  };

  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx as unknown as CanvasRenderingContext2D);

  return ctx;
}

/**
 * Create a fake HTMLImageElement whose onload fires synchronously.
 * naturalWidth / naturalHeight are set so extractColors doesn't bail out.
 */
function makeFakeImage(overrides: Partial<HTMLImageElement> = {}) {
  // Create an Image element without calling the mocked constructor
  const img = document.createElement('img') as HTMLImageElement;

  // Define read-only properties using Object.defineProperty
  Object.defineProperty(img, 'naturalWidth', {
    value: 2,
    writable: false,
    configurable: true,
  });
  Object.defineProperty(img, 'naturalHeight', {
    value: 2,
    writable: false,
    configurable: true,
  });
  Object.defineProperty(img, 'width', {
    value: 2,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(img, 'height', {
    value: 2,
    writable: true,
    configurable: true,
  });

  // Apply any overrides
  Object.keys(overrides).forEach((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(overrides, key);
    if (descriptor) {
      Object.defineProperty(img, key, descriptor);
    }
  });

  return img;
}

/** Simulate Image constructor returning a fake image that loads successfully. */
function mockImageLoad(overrides: Partial<HTMLImageElement> = {}) {
  const img = makeFakeImage(overrides);

  vi.spyOn(window, 'Image').mockImplementation(() => {
    // Trigger onload on the next tick so effects can attach listeners first
    queueMicrotask(() => img.onload?.(new Event('load')));
    return img;
  });

  return img;
}

/** Simulate Image constructor where the first load fails (CORS), second succeeds. */
function mockImageLoadCorsFailThenFallback() {
  let callCount = 0;

  vi.spyOn(window, 'Image').mockImplementation(() => {
    const img = makeFakeImage();
    callCount++;
    if (callCount === 1) {
      // First image (CORS attempt) → onerror
      queueMicrotask(() => img.onerror?.(new Event('error')));
    } else {
      // Second image (fallback, no crossOrigin) → onload
      queueMicrotask(() => img.onload?.(new Event('load')));
    }
    return img;
  });
}

/** Simulate Image constructor where all loads fail. */
function mockImageLoadAllFail() {
  vi.spyOn(window, 'Image').mockImplementation(() => {
    const img = makeFakeImage();
    queueMicrotask(() => img.onerror?.(new Event('error')));
    return img;
  });
}

/** Create a fake image File / Blob. */
function makeImageFile(name = 'test.png', type = 'image/png'): File {
  return new File(['fakebinarydata'], name, { type });
}

// ---------------------------------------------------------------------------
// FileReader mock
// ---------------------------------------------------------------------------

/** Replace FileReader so readAsDataURL fires onload synchronously. */
function mockFileReader(result = 'data:image/png;base64,FAKEDATA') {
  vi.spyOn(window, 'FileReader').mockImplementation(() => {
    const reader = {
      readAsDataURL: vi.fn(function (this: typeof reader) {
        queueMicrotask(() => {
          this.result = result;
          this.onload?.({ target: this } as unknown as ProgressEvent);
        });
      }),
      onload: null as ((e: ProgressEvent) => void) | null,
      result: '',
    };
    return reader as unknown as FileReader;
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ColorFromImage', () => {
  beforeEach(() => {
    setupCanvasMock();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Rendering ─────────────────────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the .cfi-container element', () => {
      const { container } = render(<ColorFromImage />);
      expect(container.querySelector('.cfi-container')).not.toBeNull();
    });

    it('renders a canvas with the default dimensions (200×200)', () => {
      render(<ColorFromImage />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(200);
      expect(canvas.height).toBe(200);
    });

    it('renders a canvas with custom width and height', () => {
      render(<ColorFromImage width={320} height={240} />);
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      expect(canvas.width).toBe(320);
      expect(canvas.height).toBe(240);
    });

    it('shows the drag-and-drop overlay when no image is loaded', () => {
      render(<ColorFromImage />);
      expect(screen.getByText('Drag & Drop')).toBeInTheDocument();
      expect(screen.getByText('or Ctrl+V / Paste')).toBeInTheDocument();
    });

    it('applies borderColor and borderThickness to the canvas wrapper', () => {
      const { container } = render(<ColorFromImage borderColor="#ff0000" borderThickness={3} />);
      const wrapper = container.querySelector('.cfi-canvas-wrapper') as HTMLElement;
      expect(wrapper.style.borderColor).toBe('rgb(255, 0, 0)');
      expect(wrapper.style.borderWidth).toBe('3px');
    });

    it('does not render an error message initially', () => {
      const { container } = render(<ColorFromImage />);
      expect(container.querySelector('.cfi-url-error')).toBeNull();
    });
  });

  // ── imageUrl prop ─────────────────────────────────────────────────────────

  describe('imageUrl prop', () => {
    it('calls onColorsExtracted with a non-empty palette when imageUrl loads successfully', async () => {
      mockImageLoad();
      const handler = vi.fn();

      render(
        <ColorFromImage imageUrl="https://example.com/photo.jpg" onColorsExtracted={handler} />
      );

      await waitFor(() => {
        expect(handler).toHaveBeenCalled();
        const arg: { palette: string[] } = handler.mock.calls[0][0];
        expect(arg.palette.length).toBeGreaterThan(0);
      });
    });

    it('palette colors from imageUrl are valid hex strings', async () => {
      mockImageLoad();
      const handler = vi.fn();

      render(
        <ColorFromImage imageUrl="https://example.com/photo.jpg" onColorsExtracted={handler} />
      );

      await waitFor(() => expect(handler).toHaveBeenCalled());

      const colors: string[] = handler.mock.calls[0][0].palette;
      colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
    });

    it('hides the overlay after imageUrl loads successfully', async () => {
      mockImageLoad();

      render(<ColorFromImage imageUrl="https://example.com/photo.jpg" />);

      await waitFor(() => {
        expect(screen.queryByText('Drag & Drop')).toBeNull();
      });
    });

    it('shows a CORS error message when CORS load fails but fallback succeeds', async () => {
      mockImageLoadCorsFailThenFallback();

      render(<ColorFromImage imageUrl="https://example.com/photo.jpg" />);

      await waitFor(() => {
        expect(screen.getByText(/CORS blocked/i)).toBeInTheDocument();
      });
    });

    it('shows a generic error message when all image loads fail', async () => {
      mockImageLoadAllFail();

      render(<ColorFromImage imageUrl="https://broken.url/img.jpg" />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load image/i)).toBeInTheDocument();
      });
    });

    it('does not call onColorsExtracted if the URL fails to load', async () => {
      mockImageLoadAllFail();
      const handler = vi.fn();

      render(<ColorFromImage imageUrl="https://broken.url/img.jpg" onColorsExtracted={handler} />);

      await waitFor(() => expect(screen.getByText(/Failed to load image/i)).toBeInTheDocument());

      expect(handler).not.toHaveBeenCalled();
    });

    it('re-runs extraction when imageUrl prop changes', async () => {
      mockImageLoad();
      const handler = vi.fn();

      const { rerender } = render(
        <ColorFromImage imageUrl="https://example.com/a.jpg" onColorsExtracted={handler} />
      );

      await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

      act(() => {
        rerender(
          <ColorFromImage imageUrl="https://example.com/b.jpg" onColorsExtracted={handler} />
        );
      });

      await waitFor(() => expect(handler.mock.calls.length).toBeGreaterThan(1));
    });
  });

  // ── imageFile prop ────────────────────────────────────────────────────────

  describe('imageFile prop', () => {
    it('calls onColorsExtracted when a valid image File is provided', async () => {
      mockFileReader();
      mockImageLoad();
      const handler = vi.fn();
      const file = makeImageFile();

      render(<ColorFromImage imageFile={file} onColorsExtracted={handler} />);

      await waitFor(() => {
        expect(handler).toHaveBeenCalled();
        const arg: { palette: string[] } = handler.mock.calls[0][0];
        expect(arg.palette.length).toBeGreaterThan(0);
      });
    });

    it('hides the overlay after a file is loaded', async () => {
      mockFileReader();
      mockImageLoad();
      const file = makeImageFile();

      render(<ColorFromImage imageFile={file} />);

      await waitFor(() => {
        expect(screen.queryByText('Drag & Drop')).toBeNull();
      });
    });

    it('does not run when imageFile is null', async () => {
      const handler = vi.fn();
      render(<ColorFromImage imageFile={null} onColorsExtracted={handler} />);
      // Small delay to ensure no async work fires
      await new Promise((r) => setTimeout(r, 50));
      expect(handler).not.toHaveBeenCalled();
    });

    it('re-runs when imageFile prop changes to a new file', async () => {
      mockFileReader();
      mockImageLoad();
      const handler = vi.fn();
      const file1 = makeImageFile('a.png');
      const file2 = makeImageFile('b.png');

      const { rerender } = render(<ColorFromImage imageFile={file1} onColorsExtracted={handler} />);
      await waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

      act(() => {
        rerender(<ColorFromImage imageFile={file2} onColorsExtracted={handler} />);
      });

      await waitFor(() => expect(handler.mock.calls.length).toBeGreaterThan(1));
    });
  });

  // ── clearTrigger prop ─────────────────────────────────────────────────────

  describe('clearTrigger prop', () => {
    it('calls onColorsExtracted with an empty palette when clearTrigger fires', async () => {
      // First: load an image so the component has state to clear
      mockFileReader();
      mockImageLoad();
      const handler = vi.fn();
      const file = makeImageFile();

      const { rerender } = render(
        <ColorFromImage imageFile={file} onColorsExtracted={handler} clearTrigger={0} />
      );

      await waitFor(() => expect(handler).toHaveBeenCalled());
      handler.mockClear();

      // Trigger clear
      act(() => {
        rerender(<ColorFromImage imageFile={file} onColorsExtracted={handler} clearTrigger={1} />);
      });

      await waitFor(() => {
        expect(handler).toHaveBeenCalledWith({ palette: [] });
      });
    });

    it('shows the drag-and-drop overlay again after clearTrigger fires', async () => {
      mockFileReader();
      mockImageLoad();
      const file = makeImageFile();

      const { rerender } = render(<ColorFromImage imageFile={file} clearTrigger={0} />);

      await waitFor(() => expect(screen.queryByText('Drag & Drop')).toBeNull());

      act(() => {
        rerender(<ColorFromImage imageFile={file} clearTrigger={1} />);
      });

      await waitFor(() => expect(screen.getByText('Drag & Drop')).toBeInTheDocument());
    });

    it('clears any existing error message when clearTrigger fires', async () => {
      mockImageLoadAllFail();

      const { rerender } = render(
        <ColorFromImage imageUrl="https://broken.url/img.jpg" clearTrigger={0} />
      );

      await waitFor(() => expect(screen.getByText(/Failed to load image/i)).toBeInTheDocument());

      act(() => {
        rerender(<ColorFromImage imageUrl="https://broken.url/img.jpg" clearTrigger={1} />);
      });

      await waitFor(() => expect(screen.queryByText(/Failed to load image/i)).toBeNull());
    });

    it('calls clearRect on the canvas when clearTrigger fires', async () => {
      const ctx = setupCanvasMock();
      mockFileReader();
      mockImageLoad();
      const file = makeImageFile();

      const { rerender } = render(<ColorFromImage imageFile={file} clearTrigger={0} />);
      await waitFor(() => expect(screen.queryByText('Drag & Drop')).toBeNull());

      act(() => {
        rerender(<ColorFromImage imageFile={file} clearTrigger={1} />);
      });

      await waitFor(() => {
        expect(ctx.clearRect).toHaveBeenCalled();
      });
    });
  });

  // ── Drag & Drop ───────────────────────────────────────────────────────────

  describe('drag and drop', () => {
    it('calls preventDefault on dragover to allow drop', () => {
      const { container } = render(<ColorFromImage />);
      const wrapper = container.querySelector('.cfi-canvas-wrapper') as HTMLElement;

      const dragOverEvent = new Event('dragover', { bubbles: true });
      dragOverEvent.preventDefault = vi.fn();
      fireEvent(wrapper, dragOverEvent);

      expect(dragOverEvent.preventDefault).toHaveBeenCalled();
    });

    it('loads an image when an image file is dropped', async () => {
      mockFileReader();
      mockImageLoad();
      const handler = vi.fn();

      const { container } = render(<ColorFromImage onColorsExtracted={handler} />);
      const wrapper = container.querySelector('.cfi-canvas-wrapper') as HTMLElement;

      const file = makeImageFile();
      fireEvent.drop(wrapper, {
        dataTransfer: { files: [file] },
      });

      await waitFor(() => {
        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].palette.length).toBeGreaterThan(0);
      });
    });

    it('ignores a drop of a non-image file', async () => {
      const handler = vi.fn();
      const { container } = render(<ColorFromImage onColorsExtracted={handler} />);
      const wrapper = container.querySelector('.cfi-canvas-wrapper') as HTMLElement;

      const textFile = new File(['hello'], 'note.txt', { type: 'text/plain' });
      fireEvent.drop(wrapper, { dataTransfer: { files: [textFile] } });

      await new Promise((r) => setTimeout(r, 50));
      expect(handler).not.toHaveBeenCalled();
    });

    it('hides the overlay after a drop', async () => {
      mockFileReader();
      mockImageLoad();
      const { container } = render(<ColorFromImage />);
      const wrapper = container.querySelector('.cfi-canvas-wrapper') as HTMLElement;

      fireEvent.drop(wrapper, { dataTransfer: { files: [makeImageFile()] } });

      await waitFor(() => expect(screen.queryByText('Drag & Drop')).toBeNull());
    });
  });

  // ── Clipboard paste ───────────────────────────────────────────────────────

  describe('clipboard paste (Ctrl+V)', () => {
    it('loads image and calls onColorsExtracted when an image is pasted', async () => {
      mockFileReader();
      mockImageLoad();
      const handler = vi.fn();

      render(<ColorFromImage onColorsExtracted={handler} />);

      const blob = new Blob(['fake'], { type: 'image/png' });
      const item = { type: 'image/png', getAsFile: () => blob };
      const pasteEvent = new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
      });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: { items: [item] },
      });

      act(() => window.dispatchEvent(pasteEvent));

      await waitFor(() => {
        expect(handler).toHaveBeenCalled();
        expect(handler.mock.calls[0][0].palette.length).toBeGreaterThan(0);
      });
    });

    it('ignores paste events with no image items', async () => {
      const handler = vi.fn();
      render(<ColorFromImage onColorsExtracted={handler} />);

      const textItem = { type: 'text/plain', getAsFile: () => null };
      const pasteEvent = new ClipboardEvent('paste', { bubbles: true });
      Object.defineProperty(pasteEvent, 'clipboardData', {
        value: { items: [textItem] },
      });

      act(() => window.dispatchEvent(pasteEvent));

      await new Promise((r) => setTimeout(r, 50));
      expect(handler).not.toHaveBeenCalled();
    });

    it('ignores paste events with no clipboardData', async () => {
      const handler = vi.fn();
      render(<ColorFromImage onColorsExtracted={handler} />);

      const pasteEvent = new ClipboardEvent('paste', { bubbles: true });
      Object.defineProperty(pasteEvent, 'clipboardData', { value: null });

      act(() => window.dispatchEvent(pasteEvent));

      await new Promise((r) => setTimeout(r, 50));
      expect(handler).not.toHaveBeenCalled();
    });

    it('removes the paste listener on unmount', () => {
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = render(<ColorFromImage />);
      unmount();
      expect(removeSpy).toHaveBeenCalledWith('paste', expect.any(Function));
    });
  });

  // ── Canvas drawing ────────────────────────────────────────────────────────

  describe('canvas drawing', () => {
    it("calls getContext('2d') on the canvas element", () => {
      // Provide clearTrigger to actually trigger getContext call
      render(<ColorFromImage clearTrigger={true} />);
      expect(HTMLCanvasElement.prototype.getContext).toHaveBeenCalledWith('2d');
    });

    it('calls drawImage after a file is loaded', async () => {
      const ctx = setupCanvasMock();
      mockFileReader();
      mockImageLoad();

      render(<ColorFromImage imageFile={makeImageFile()} />);

      await waitFor(() => expect(ctx.drawImage).toHaveBeenCalled());
    });

    it('redraws when width/height props change', async () => {
      const ctx = setupCanvasMock();
      mockFileReader();
      mockImageLoad();
      const file = makeImageFile();

      const { rerender } = render(<ColorFromImage imageFile={file} width={200} height={200} />);
      await waitFor(() => expect(ctx.drawImage).toHaveBeenCalled());

      const drawCallsBefore = (ctx.drawImage as ReturnType<typeof vi.fn>).mock.calls.length;

      act(() => {
        rerender(<ColorFromImage imageFile={file} width={300} height={300} />);
      });

      await waitFor(() =>
        expect((ctx.drawImage as ReturnType<typeof vi.fn>).mock.calls.length).toBeGreaterThan(
          drawCallsBefore
        )
      );
    });
  });

  // ── Colour extraction edge cases ──────────────────────────────────────────

  describe('colour extraction edge cases', () => {
    it('does not call onColorsExtracted when pixel data is all transparent', async () => {
      // All pixels have alpha=0
      const transparentPixels = new Uint8ClampedArray(16).fill(0);
      setupCanvasMock(transparentPixels);
      mockImageLoad();
      const handler = vi.fn();

      render(
        <ColorFromImage
          imageUrl="https://example.com/transparent.png"
          onColorsExtracted={handler}
        />
      );

      // Wait briefly to confirm nothing fires
      await new Promise((r) => setTimeout(r, 80));
      expect(handler).not.toHaveBeenCalled();
    });

    it('returns palette colors with valid hex format for mixed pixel data', async () => {
      // Mix of red, green, blue pixels
      const mixedPixels = new Uint8ClampedArray([
        255,
        0,
        0,
        255, // red
        0,
        255,
        0,
        255, // green
        0,
        0,
        255,
        255, // blue
        255,
        255,
        0,
        255, // yellow
      ]);
      setupCanvasMock(mixedPixels);
      mockImageLoad();
      const handler = vi.fn();

      render(
        <ColorFromImage imageUrl="https://example.com/mixed.png" onColorsExtracted={handler} />
      );

      await waitFor(() => expect(handler).toHaveBeenCalled());
      const colors: string[] = handler.mock.calls[0][0].palette;
      colors.forEach((c) => expect(c).toMatch(/^#[0-9a-f]{6}$/i));
    });
  });

  // ── Prop defaults ─────────────────────────────────────────────────────────

  describe('prop defaults', () => {
    it('renders without throwing when no props are provided', () => {
      expect(() => render(<ColorFromImage />)).not.toThrow();
    });

    it('renders without throwing when all props are explicitly provided', () => {
      mockFileReader();
      mockImageLoad();
      expect(() =>
        render(
          <ColorFromImage
            width={300}
            height={300}
            borderColor="#333333"
            borderThickness={2}
            imageUrl="https://example.com/img.jpg"
            imageFile={null}
            clearTrigger={0}
            onColorsExtracted={vi.fn()}
          />
        )
      ).not.toThrow();
    });
  });
});
