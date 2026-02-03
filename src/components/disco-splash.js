import { html, css, unsafeCSS } from 'lit';
import DiscoUIElement from './disco-ui-element.js';
import splashCss from './disco-splash.scss';

/**
 * Splash screen element shown while the app is starting.
 * @extends DiscoUIElement
 */
class DiscoSplash extends DiscoUIElement {
  static properties = {
    logo: { type: String, reflect: true },
    _logoNode: { type: Object, state: true }
  };

  static styles = css`
    ${unsafeCSS(splashCss)}
  `;

  constructor() {
    super();
    this._logoNode = null;
  }

  /**
   * @param {HTMLElement | null} node
   */
  set logoNode(node) {
    this._logoNode = node;
  }

  /**
   * @returns {HTMLElement | null | undefined}
   */
  get logoNode() {
    return this._logoNode;
  }

  render() {
    return html`
      <div class="splash">
        ${this._renderLogo()}
        <div class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
  }

  _renderLogo() {
    if (this._logoNode instanceof HTMLElement) {
      return html`${this._logoNode}`;
    } else if (this.logo) {
      return html`<img src="${this.logo}" width="80" height="80" alt="App logo" />`;
    }
    return html``;
  }

  /**
   * Dismiss splash with fade-out.
   */
  dismiss() {
    this.style.opacity = '0';
    setTimeout(() => this.remove(), 400);
  }
}

customElements.define('disco-splash', DiscoSplash);

export default DiscoSplash;
