import DiscoUIElement from './disco-ui-element.js';
import splashCss from './disco-splash.scss';

/**
 * Splash screen element shown while the app is starting.
 * @extends DiscoUIElement
 */
class DiscoSplash extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(splashCss, this.shadowRoot);
    this._container = document.createElement('div');
    this.shadowRoot.appendChild(this._container);
    this.render();
  }

  /**
   * @returns {string[]}
   */
  static get observedAttributes() {
    return ['logo'];
  }

  /**
   * @param {string} _name
   * @param {string | null} _oldValue
   * @param {string | null} _newValue
   */
  attributeChangedCallback(_name, _oldValue, _newValue) {
    this.render();
  }

  /**
   * @param {HTMLElement | null} node
   */
  set logoNode(node) {
    this._logoNode = node;
    this.render();
  }

  /**
   * @returns {HTMLElement | null | undefined}
   */
  get logoNode() {
    return this._logoNode;
  }

  /**
   * Dismiss splash with fade-out.
   */
  dismiss() {
    if (!this.shadowRoot) return;
    const host = /** @type {HTMLElement} */ (this.shadowRoot.host);
    host.style.opacity = '0';
    setTimeout(() => host.remove(), 400);
  }

  /**
   * Render splash content.
   */
  render() {
    if (!this.shadowRoot) return;
    if (!this._container) return;
    this._container.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'splash';
    const logoPath = this.getAttribute('logo');

    if (this._logoNode instanceof HTMLElement) {
      wrapper.appendChild(this._logoNode);
    } else if (logoPath) {
      const img = document.createElement('img');
      img.src = logoPath;
      img.width = 80;
      img.height = 80;
      img.alt = 'App logo';
      wrapper.appendChild(img);
    }

    const dots = document.createElement('div');
    dots.className = 'dots';
    dots.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    wrapper.appendChild(dots);

    this._container.appendChild(wrapper);
  }
}

customElements.define('disco-splash', DiscoSplash);

export default DiscoSplash;
