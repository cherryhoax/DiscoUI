import { html, css, unsafeCSS } from 'lit';
import DiscoUIElement from './disco-ui-element.js';
import progressBarStyles from './disco-progress-bar.scss';

/**
 * Progress bar element with determinate and indeterminate modes.
 * @extends DiscoUIElement
 */
class DiscoProgressBar extends DiscoUIElement {
  static properties = {
    value: { type: Number, reflect: true },
    max: { type: Number, reflect: true },
    indeterminate: { type: Boolean, reflect: true }
  };

  static styles = css`
    ${unsafeCSS(progressBarStyles)}
  `;

  constructor() {
    super();
    this.value = 0;
    this.max = 100;
    this.indeterminate = false;
    this.setAttribute('role', 'progressbar');
  }

  render() {
    const fillWidth = this.indeterminate ? '0%' : `${this._calculateWidth()}%`;
    
    return html`
      <div class="track">
        <div class="fill" style="width: ${fillWidth}"></div>
        <div class="dots">
          ${[...Array(5)].map(() => html`<div class="dot"></div>`)}
        </div>
      </div>
    `;
  }

  updated(changedProperties) {
    if (changedProperties.has('value') || changedProperties.has('max') || changedProperties.has('indeterminate')) {
      this._syncAria();
    }
  }

  _calculateWidth() {
    const max = this.max > 0 ? this.max : 100;
    const value = Math.max(0, Math.min(this.value, max));
    const ratio = max === 0 ? 0 : value / max;
    return ratio * 100;
  }

  _syncAria() {
    if (this.indeterminate) {
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', String(this.max));
      this.removeAttribute('aria-valuenow');
      this.setAttribute('aria-valuetext', 'Loading');
      return;
    }
    const max = this.max > 0 ? this.max : 100;
    const value = Math.max(0, Math.min(this.value, max));
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(max));
    this.setAttribute('aria-valuenow', String(value));
    this.removeAttribute('aria-valuetext');
  }
}

customElements.define('disco-progress-bar', DiscoProgressBar);

export default DiscoProgressBar;
