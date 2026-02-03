import { html, css, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import DiscoUIElement from './disco-ui-element.js';
import splashStyles from './disco-splash.scss';

/**
 * Splash screen element shown while the app is starting.
 * @extends DiscoUIElement
 */
class DiscoSplash extends DiscoUIElement {
  static styles = css`${unsafeCSS(splashStyles)}`;

  @property({ type: String }) logo = '';

  _logoNode = null;

  /**
   * @param {HTMLElement | null} node
   */
  set logoNode(node) {
    this._logoNode = node;
    this.requestUpdate();
  }

  /**
   * @returns {HTMLElement | null}
   */
  get logoNode() {
    return this._logoNode;
  }

  /**
   * Dismiss splash with fade-out.
   */
  dismiss() {
    this.style.opacity = '0';
    setTimeout(() => this.remove(), 400);
  }

  render() {
    return html`
      <div class="splash">
        ${this._logoNode instanceof HTMLElement
          ? this._logoNode
          : this.logo
          ? html`<img src="${this.logo}" width="80" height="80" alt="App logo" />`
          : ''}
        <div class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
  }
}

customElements.define('disco-splash', DiscoSplash);

export default DiscoSplash;
