import DiscoUIElement from './disco-ui-element.js';
import pageStyles from './disco-page.css';
import DiscoAnimations from './animations/disco-animations.js';

class DiscoPage extends DiscoUIElement {
  constructor() {
    super();
    this.loadStyle(pageStyles);
  }

  // Methods for the Frame to call
  /**
   * @typedef {object} DiscoPageAnimationOptions
   * @property {'forward' | 'back'} direction
   */

  /**
   * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateIn(options = { direction: 'forward' }) {
    this.classList.add('animating-in');
    await this.animateInFn(options);
    this.classList.remove('animating-in');
  }

  /**
   * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateInFn(options = { direction: 'forward' }) {
    const animation = DiscoAnimations.animate(
      this,
      [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: 300,
        easing: DiscoAnimations.easeOutQuart,
        fill: 'forwards'
      }
    );
    await animation.finished;
  }

  /**
   * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateOut(options = { direction: 'forward' }) {
    this.classList.add('animating-out');
    await this.animateOutFn(options);
    this.classList.remove('animating-out');
  }
  /**
   * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateOutFn(options = { direction: 'forward' }) {
    console.log("base animate out")
    const animation = DiscoAnimations.animate(
      this,
      [{ opacity: 1 }, { opacity: 0 }],
      {
        duration: 150,
        easing: DiscoAnimations.easeOutQuad,
        fill: 'forwards'
      }
    );
    await animation.finished;
  }
}

export default DiscoPage;
