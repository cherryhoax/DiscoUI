import { describe, expect, it, vi } from 'vitest';
import DiscoFlipView from '../../src/components/flip-view/disco-flip-view.js';

describe('DiscoFlipView loop layout', () => {
  it('wraps pages around the virtual scroll offset', () => {
    const view = new DiscoFlipView();
    view.setAttribute('overscroll-mode', 'loop');
    view.setAttribute('direction', 'horizontal');

    Object.defineProperty(view, 'clientWidth', { value: 200, configurable: true });
    Object.defineProperty(view, 'clientHeight', { value: 200, configurable: true });

    const pageA = document.createElement('div');
    const pageB = document.createElement('div');
    const pageC = document.createElement('div');

    view.appendChild(pageA);
    view.appendChild(pageB);
    view.appendChild(pageC);

    document.body.appendChild(view);

    view._updateChildrenLayout();
    view.scrollLeft = 200;

    expect(pageA.style.transform).toContain('translate3d(-200px');
    expect(pageB.style.transform).toContain('translate3d(0px');
    expect(pageC.style.transform).toContain('translate3d(200px');

    view.remove();
  });

  it('snaps to the nearest page target', () => {
    const view = new DiscoFlipView();
    view.setAttribute('direction', 'horizontal');

    const rafSpy = vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(() => 0);

    Object.defineProperty(view, 'clientWidth', { value: 100, configurable: true });
    Object.defineProperty(view, 'clientHeight', { value: 100, configurable: true });

    const pageA = document.createElement('div');
    const pageB = document.createElement('div');
    const pageC = document.createElement('div');

    view.appendChild(pageA);
    view.appendChild(pageB);
    view.appendChild(pageC);

    document.body.appendChild(view);

    view.scrollLeft = 160;
    view._snapToNearestPage();

    expect(view._targetX).toBe(200);

    rafSpy.mockRestore();

    view.remove();
  });
});
