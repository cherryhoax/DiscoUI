import baseStyles from './disco-ui-element.css';

class DiscoUIElement extends HTMLElement {
  constructor() {
    super();
    this.loadStyle(baseStyles);
  }

  loadStyle(styleText, target = document.head) {
    if (!styleText || !target) return;

    if (target === document.head) {
      const cache = DiscoUIElement._styleCache || (DiscoUIElement._styleCache = new Set());
      if (cache.has(styleText)) return;
      const style = document.createElement('style');
      style.textContent = styleText;
      document.head.appendChild(style);
      cache.add(styleText);
      return;
    }

    const shadowCache = DiscoUIElement._shadowStyleCache || (DiscoUIElement._shadowStyleCache = new WeakMap());
    const existing = shadowCache.get(target) || new Set();
    if (existing.has(styleText)) return;
    const style = document.createElement('style');
    style.textContent = styleText;
    target.appendChild(style);
    existing.add(styleText);
    shadowCache.set(target, existing);
  }

  enableTilt() {
    const downHandler = (e) => {
      const rect = this.getBoundingClientRect();
      const x = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const y = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      this.style.transform = `perspective(1000px) rotateX(${-x * 12}deg) rotateY(${y * 12}deg) scale(0.97)`;
    };

    const upHandler = () => {
      this.style.transform = 'rotateX(0deg) rotateY(0deg) scale(1)';
    };

    this.addEventListener('pointerdown', downHandler);
    window.addEventListener('pointerup', upHandler);
  }
}

export default DiscoUIElement;
