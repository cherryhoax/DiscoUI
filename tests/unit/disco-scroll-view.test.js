import { describe, expect, it, vi } from 'vitest';
import DiscoScrollView from '../../src/components/scroll-view/disco-scroll-view.js';

describe('DiscoScrollView momentum', () => {
  it('computes momentum targets within overscroll bounds', () => {
    const view = new DiscoScrollView();

    Object.defineProperty(view, 'scrollWidth', { value: 700, configurable: true });
    Object.defineProperty(view, 'clientWidth', { value: 300, configurable: true });
    Object.defineProperty(view, 'scrollHeight', { value: 0, configurable: true });
    Object.defineProperty(view, 'clientHeight', { value: 0, configurable: true });

    view.scrollLeft = 100;
    view.scrollTop = 0;
    view._velocity = { x: -10, y: 0 };

    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);
    view._launchMomentum();

    const overscrollLimit = view._maxOverscroll * 4;
    const maxScrollLeft = view.maxScrollLeft;

    expect(view._targetX).toBeGreaterThanOrEqual(-overscrollLimit);
    expect(view._targetX).toBeLessThanOrEqual(maxScrollLeft + overscrollLimit);
    expect(view._amplitudeX).toBe(view._targetX - view.scrollLeft);
    expect(rafSpy).toHaveBeenCalled();

    rafSpy.mockRestore();
  });

  it('clamps overscroll to max when content is scrollable', () => {
    const view = new DiscoScrollView();
    Object.defineProperty(view, 'scrollWidth', { value: 600, configurable: true });
    Object.defineProperty(view, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(view, 'scrollHeight', { value: 0, configurable: true });
    Object.defineProperty(view, 'clientHeight', { value: 0, configurable: true });

    const { clampedX, overscrollX } = view._computeOverscroll(-1000, 0, 0.5);

    expect(clampedX).toBe(0);
    expect(overscrollX).toBe(view._maxOverscroll);
  });

  it('does not overscroll when no scroll range exists', () => {
    const view = new DiscoScrollView();
    Object.defineProperty(view, 'scrollWidth', { value: 100, configurable: true });
    Object.defineProperty(view, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(view, 'scrollHeight', { value: 100, configurable: true });
    Object.defineProperty(view, 'clientHeight', { value: 100, configurable: true });

    const result = view._computeOverscroll(50, 50, 0.5);

    expect(result.overscrollX).toBe(0);
    expect(result.overscrollY).toBe(0);
  });
});
