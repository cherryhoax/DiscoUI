import DiscoUIElement from './disco-ui-element.js';
import splashCss from './disco-splash.css';

class DiscoSplash extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  static get observedAttributes() {
    return ['logo'];
  }

  attributeChangedCallback() {
    this.render();
  }

  set logoNode(node) {
    this._logoNode = node;
    this.render();
  }

  get logoNode() {
    return this._logoNode;
  }

  dismiss() {
    if (!this.shadowRoot) return;
    const host = this.shadowRoot.host;
    host.style.opacity = '0';
    setTimeout(() => host.remove(), 400);
  }

  render() {
    if (!this.shadowRoot) return;
    this.shadowRoot.innerHTML = '';

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

    const style = document.createElement('style');
    style.textContent = splashCss;

    this.shadowRoot.append(style, wrapper);
  }
}

customElements.define('disco-splash', DiscoSplash);

export default DiscoSplash;
