import DiscoUIElement from './disco-ui-element.js';
import pageStyles from './disco-page.css';

class DiscoPage extends DiscoUIElement {
  constructor() {
    super();
    this.loadStyle(pageStyles);
    // Standard WP 8.1 transition timings
    this.animationInDuration = 350;
    this.animationOutDuration = 250;
  }

  // Methods for the Frame to call
  /**
   * @returns {Promise<void>}
   */
  async animateIn() {
    this.style.animation = `discoPageIn ${this.animationInDuration}ms ease-out forwards`;
    return new Promise((resolve) => setTimeout(resolve, this.animationInDuration));
  }

  /**
   * @returns {Promise<void>}
   */
  async animateOut() {
    this.style.animation = `discoPageOut ${this.animationOutDuration}ms ease-in forwards`;
    return new Promise((resolve) => setTimeout(resolve, this.animationOutDuration));
  }
}

export default DiscoPage;
