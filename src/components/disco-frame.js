import DiscoUIElement from './disco-ui-element.js';
import frameStyles from './disco-frame.css';

const ensureFrameStyles = (() => {
  let injected = false;
  return () => {
    if (injected) return;
    const style = document.createElement('style');
    style.textContent = frameStyles;
    document.head.appendChild(style);
    injected = true;
  };
})();

class DiscoFrame extends DiscoUIElement {
  constructor() {
    super();
    ensureFrameStyles();
    this.history = [];
  }

  async navigate(page) {
    if (!page) return;
    const current = this.history[this.history.length - 1] || null;
    const exitDuration = current?.animationOutDuration ?? 0;

    if (current) {
      if (typeof current.animateOut === 'function') {
        await current.animateOut();
      } else if (exitDuration > 0) {
        await new Promise((resolve) => setTimeout(resolve, exitDuration));
      }
    }

    this.innerHTML = '';
    this.appendChild(page);
    this.history.push(page);

    if (typeof page.animateIn === 'function') {
      await page.animateIn();
    }
  }

  async goBack() {
    if (this.history.length <= 1) return;

    const current = this.history.pop();
    const exitDuration = current?.animationOutDuration ?? 0;

    if (current) {
      if (typeof current.animateOut === 'function') {
        await current.animateOut();
      } else if (exitDuration > 0) {
        await new Promise((resolve) => setTimeout(resolve, exitDuration));
      }
    }

    const previous = this.history[this.history.length - 1];
    this.innerHTML = '';
    if (previous) {
      this.appendChild(previous);
      if (typeof previous.animateIn === 'function') {
        await previous.animateIn();
      }
    }
  }
}

customElements.define('disco-frame', DiscoFrame);

export default DiscoFrame;
