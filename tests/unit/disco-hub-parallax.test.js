import { describe, expect, it } from 'vitest';
import '../../src/components/hub/disco-hub.js';

const setNumberProperty = (target, prop, value) => {
  Object.defineProperty(target, prop, {
    value,
    configurable: true
  });
};

describe('DiscoHub parallax', () => {
  it('updates background and header offsets on scroll', () => {
    const hub = document.createElement('disco-hub-page');
    const sectionA = document.createElement('disco-hub-section');
    const sectionB = document.createElement('disco-hub-section');

    hub.appendChild(sectionA);
    hub.appendChild(sectionB);
    document.body.appendChild(hub);

    setNumberProperty(sectionA, 'offsetWidth', 300);
    setNumberProperty(sectionB, 'offsetWidth', 300);

    const viewport = hub.shadowRoot?.getElementById('viewport');
    expect(viewport).toBeTruthy();

    setNumberProperty(viewport, 'clientWidth', 300);
    Object.defineProperty(window, 'innerWidth', { value: 600, configurable: true });

    viewport.scrollLeft = 150;
    viewport.dispatchEvent(new Event('scroll'));

    const background = hub.shadowRoot?.querySelector('.hub-background');
    const header = hub.shadowRoot?.querySelector('.hub-header');

    expect(background?.style.left).toBe('-150px');
    expect(header?.style.getPropertyValue('--translate-x')).toBe('-100px');

    hub.remove();
  });
});
