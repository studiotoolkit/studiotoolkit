import '@testing-library/jest-dom';

// Polyfill ClipboardEvent for jsdom
if (typeof ClipboardEvent === 'undefined') {
  class ClipboardEventPolyfill extends Event {
    clipboardData: DataTransfer | null;

    constructor(type: string, eventInitDict?: EventInit) {
      super(type, eventInitDict);
      this.clipboardData = null;
    }
  }

  (global as any).ClipboardEvent = ClipboardEventPolyfill;
}
