import DiscoUIElement from './disco-ui-element.js';
import pageStyles from './disco-page.css';

const ensurePageStyles = (() => {
  let injected = false;
  return () => {
    if (injected) return;
    const style = document.createElement('style');
    style.textContent = pageStyles;
    document.head.appendChild(style);
    injected = true;
  };
})();

class DiscoPage extends DiscoUIElement {
  constructor() {
    super();
    ensurePageStyles();
    // Standard WP 8.1 transition timings
    this.animationInDuration = 350;
    this.animationOutDuration = 250;
  }

  // Methods for the Frame to call
  async animateIn() {
    this.style.animation = `discoPageIn ${this.animationInDuration}ms ease-out forwards`;
    return new Promise((resolve) => setTimeout(resolve, this.animationInDuration));
  }

  async animateOut() {
    this.style.animation = `discoPageOut ${this.animationOutDuration}ms ease-in forwards`;
    return new Promise((resolve) => setTimeout(resolve, this.animationOutDuration));
  }
}

export default DiscoPage;
