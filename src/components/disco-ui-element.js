import baseStyles from './disco-ui-element.css';

const ensureBaseStyles = (() => {
  let injected = false;
  return () => {
    if (injected) return;
    const style = document.createElement('style');
    style.textContent = baseStyles;
    document.head.appendChild(style);
    injected = true;
  };
})();

class DiscoUIElement extends HTMLElement {
  constructor() {
    super();
    ensureBaseStyles();
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
