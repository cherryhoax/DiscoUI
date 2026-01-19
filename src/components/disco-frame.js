import DiscoUIElement from './disco-ui-element.js';
import frameStyles from './disco-frame.css';

class DiscoFrame extends DiscoUIElement {
  constructor() {
    super();
    this.loadStyle(frameStyles);
    this.history = [];
  }

  /**
   * @param {HTMLElement | null | undefined} page
   * @returns {Promise<void>}
   */
  async navigate(page) {
    if (!page) return;
    const current = /** @type {import('./disco-page.js').default | null} */ (
      this.history[this.history.length - 1] || null
    );
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

    const typedPage = /** @type {import('./disco-page.js').default} */ (page);
    if (typeof typedPage.animateIn === 'function') {
      await typedPage.animateIn();
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async goBack() {
    if (this.history.length <= 1) return;

    const current = /** @type {import('./disco-page.js').default | undefined} */ (this.history.pop());
    const exitDuration = current?.animationOutDuration ?? 0;

    if (current) {
      if (typeof current.animateOut === 'function') {
        await current.animateOut();
      } else if (exitDuration > 0) {
        await new Promise((resolve) => setTimeout(resolve, exitDuration));
      }
    }

    const previous = /** @type {import('./disco-page.js').default | undefined} */ (
      this.history[this.history.length - 1]
    );
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
