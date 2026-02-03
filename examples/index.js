/**
 * Example demo loader used by the examples page.
 */

import { DiscoApp } from './dist/index.js';
const launchDemo = async () => {
  const app = new DiscoApp({
    theme: document.documentElement.getAttribute('disco-theme') || 'dark',
    accent: document.documentElement.getAttribute('disco-accent') || '#D80073',
    font: document.documentElement.getAttribute('disco-font') || null,
    splash: 'none'
  });

  const frame = document.getElementById('componentsFrame');
  if (!frame) return;
  window.frame = frame;
  const homePage = document.getElementById('componentsHome');
  const pivotPage = document.getElementById('componentsPivot');
  const hubPage = document.getElementById('componentsHub');
  const checkboxPage = document.getElementById('componentsCheckbox');
  const progressPage = document.getElementById('componentsProgress');
  const buttonPage = document.getElementById('componentsButton');
  const scrollViewPage = document.getElementById('componentsScrollView');
  const flipViewPage = document.getElementById('componentsFlipView');
  const stressScrollPage = document.getElementById('componentsStressScroll');
  const stressNativeScrollPage = document.getElementById('componentsStressNativeScroll');

  const list = homePage.querySelector('#componentsList');
  if (list) {
    list.items = [
      { id: 'pivot', Title: 'Pivot' },
      { id: 'hub', Title: 'Hub' },
      { id: 'progress', Title: 'Progress Bar' },
      { id: 'checkbox', Title: 'Checkbox' },
      { id: 'button', Title: 'Button' },
      { id: 'scrollview', Title: 'Scroll View' },
      { id: 'flipview', Title: 'Flip View' }
    ];

    list.addEventListener('itemselect', (event) => {
      const detail = event.detail;
      const id = detail?.data?.id;
      if (id === 'pivot') {
        frame.navigate(pivotPage);
      }
      if (id === 'hub') {
        frame.navigate(hubPage);
      }
      if (id === 'progress') {
        frame.navigate(progressPage);
      }
      if (id === 'checkbox') {
        frame.navigate(checkboxPage);
      }
      if (id === 'button') {
        frame.navigate(buttonPage);
      }
      if (id === 'scrollview') {
        frame.navigate(scrollViewPage);
      }
      if (id === 'flipview') {
        frame.navigate(flipViewPage);
      }
      if (id === 'stressscroll') {
        frame.navigate(stressScrollPage);
      }
      if (id === 'stressnative') {
        frame.navigate(stressNativeScrollPage);
      }
    });
  }

  const button = document.getElementById('homeButton');
  if (button) {
    button.addEventListener('click', () => frame.navigate(homePage));
  }

  const stressButton = document.getElementById('stressScrollButton');
  if (stressButton) {
    stressButton.addEventListener('click', () => frame.navigate(stressScrollPage));
  }

  const stressNativeButton = document.getElementById('stressNativeScrollButton');
  if (stressNativeButton) {
    stressNativeButton.addEventListener('click', () => frame.navigate(stressNativeScrollPage));
  }

  const stressContainer = document.getElementById('stressScrollContent');
  if (stressContainer) {
    const fragment = document.createDocumentFragment();
    const variants = ['stress-scroll__item--card', 'stress-scroll__item--mesh', 'stress-scroll__item--ring'];
    const animations = ['stress-scroll__anim--float', 'stress-scroll__anim--pulse', 'stress-scroll__anim--spin', 'stress-scroll__anim--shimmer'];
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (list) => list[random(0, list.length - 1)];
    for (let i = 1; i <= 48; i += 1) {
      const item = document.createElement('div');
      const variant = variants[i % variants.length];
      item.className = `stress-scroll__item ${variant}`;

      const content = document.createElement('div');
      content.className = 'stress-scroll__content';

      const blocks = random(3, 8);
      for (let j = 0; j < blocks; j += 1) {
        const block = document.createElement('div');
        block.className = 'stress-scroll__block';
        if (Math.random() < 0.6) block.classList.add(pick(animations));
        content.appendChild(block);
      }

      const lines = random(1, 3);
      for (let k = 0; k < lines; k += 1) {
        const line = document.createElement('div');
        line.className = 'stress-scroll__line';
        if (Math.random() < 0.4) line.classList.add(pick(animations));
        content.appendChild(line);
      }

      const label = document.createElement('div');
      label.className = 'stress-scroll__label';
      label.textContent = `Item ${i}`;
      content.appendChild(label);

      const badge = document.createElement('div');
      badge.className = 'stress-scroll__badge';
      if (Math.random() < 0.5) badge.classList.add(pick(animations));
      badge.textContent = `#${random(100, 999)}`;

      item.appendChild(content);
      item.appendChild(badge);
      fragment.appendChild(item);
    }
    stressContainer.appendChild(fragment);
  }

  const nativeContainer = document.getElementById('stressNativeScrollContent');
  if (nativeContainer) {
    const fragment = document.createDocumentFragment();
    const variants = ['stress-scroll__item--card', 'stress-scroll__item--mesh', 'stress-scroll__item--ring'];
    const animations = ['stress-scroll__anim--float', 'stress-scroll__anim--pulse', 'stress-scroll__anim--spin', 'stress-scroll__anim--shimmer'];
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (list) => list[random(0, list.length - 1)];
    for (let i = 1; i <= 48; i += 1) {
      const item = document.createElement('div');
      const variant = variants[i % variants.length];
      item.className = `stress-scroll__item ${variant}`;

      const content = document.createElement('div');
      content.className = 'stress-scroll__content';

      const blocks = random(3, 8);
      for (let j = 0; j < blocks; j += 1) {
        const block = document.createElement('div');
        block.className = 'stress-scroll__block';
        if (Math.random() < 0.6) block.classList.add(pick(animations));
        content.appendChild(block);
      }

      const lines = random(1, 3);
      for (let k = 0; k < lines; k += 1) {
        const line = document.createElement('div');
        line.className = 'stress-scroll__line';
        if (Math.random() < 0.4) line.classList.add(pick(animations));
        content.appendChild(line);
      }

      const label = document.createElement('div');
      label.className = 'stress-scroll__label';
      label.textContent = `Item ${i}`;
      content.appendChild(label);

      const badge = document.createElement('div');
      badge.className = 'stress-scroll__badge';
      if (Math.random() < 0.5) badge.classList.add(pick(animations));
      badge.textContent = `#${random(100, 999)}`;

      item.appendChild(content);
      item.appendChild(badge);
      fragment.appendChild(item);
    }
    nativeContainer.appendChild(fragment);
  }

  // Progress controls
  const inc = document.getElementById('incProgress');
  const toggle = document.getElementById('toggleIndeterminate');
  const det = document.getElementById('progressDeterminate');
  if (inc && det) {
    inc.addEventListener('click', () => {
      const current = Number(det.getAttribute('value') || 0);
      const max = Number(det.getAttribute('max') || 100);
      det.setAttribute('value', String(Math.min(max, current + 10)));
    });
  }
  if (toggle && det) {
    toggle.addEventListener('click', () => {
      if (det.hasAttribute('indeterminate')) det.removeAttribute('indeterminate');
      else det.setAttribute('indeterminate', '');
    });
  }

  app.launch(frame);
  await frame.navigate(homePage);
};

DiscoApp.ready(launchDemo);
