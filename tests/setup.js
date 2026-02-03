import { vi } from 'vitest';

class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class MockMutationObserver {
  constructor(callback) {
    this._callback = callback;
  }
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = MockResizeObserver;
}

if (!globalThis.MutationObserver) {
  globalThis.MutationObserver = MockMutationObserver;
}

if (!globalThis.requestAnimationFrame) {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 0);
}

if (!globalThis.cancelAnimationFrame) {
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id);
}

if (!Element.prototype.animate) {
  // Minimal WAAPI stub for components that may call animate()
  Element.prototype.animate = () => ({
    finished: Promise.resolve(),
    cancel() {}
  });
}

vi.stubGlobal('scrollTo', () => {});
