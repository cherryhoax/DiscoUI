import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import splashCss from './disco-splash.scss';
import DiscoAnimations from '../animations/disco-animations.js';
import '../progress-bar/disco-progress-bar.js';

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
    this._introPlayed = false;
    this.render();
  }

  connectedCallback() {
    if (this._introPlayed) return;
    this._introPlayed = true;
    requestAnimationFrame(() => {
      DiscoAnimations.animationSet.splash.in(this);
    });
  }

  /**
   * @returns {string[]}
   */
  static get observedAttributes() {
    return ['logo', 'color', 'show-progress', 'progress-color'];
  }

  /**
   * @param {string} name
   * @param {string | null} _oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(name, _oldValue, newValue) {
    if (name === 'color') {
      this.style.backgroundColor = newValue || '';
    } else {
      this.render();
    }
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
   * @returns {Promise<void>}
   */
  async dismiss() {
    if (!this.shadowRoot) return;
    const host = /** @type {HTMLElement} */ (this.shadowRoot.host);
    await DiscoAnimations.animationSet.splash.out(host);
    host.remove();
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
      img.width = 120;
      img.height = 120;
      img.alt = 'App logo';
      wrapper.appendChild(img);
    }

    if (this.hasAttribute('show-progress')) {
      const doc = this.ownerDocument || document;
      const progress = doc.createElement('disco-progress-bar');
      progress.className = 'splash-progress';
      progress.setAttribute('indeterminate', '');
      const progressColor = this.getAttribute('progress-color') || '#fff';
      progress.style.setProperty('--disco-accent', progressColor);
      this._container.appendChild(progress);
    }

    this._container.appendChild(wrapper);
  }
}

customElements.define('disco-splash', DiscoSplash);

export default DiscoSplash;
