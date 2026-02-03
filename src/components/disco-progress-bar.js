import { html, css, unsafeCSS } from 'lit';
import { property, query } from 'lit/decorators.js';
import DiscoUIElement from './disco-ui-element.js';
import progressBarStyles from './disco-progress-bar.scss';

/**
 * Progress bar element with determinate and indeterminate modes.
 * @extends DiscoUIElement
 */
class DiscoProgressBar extends DiscoUIElement {
  static styles = css`${unsafeCSS(progressBarStyles)}`;

  @property({ type: Boolean, reflect: true }) indeterminate = false;
  @property({ type: Number }) value = 0;
  @property({ type: Number }) max = 100;

  @query('.fill') _fill;

  constructor() {
    super();
    this.setAttribute('role', 'progressbar');
  }

  updated(changedProperties) {
    if (changedProperties.has('value') || changedProperties.has('max') || changedProperties.has('indeterminate')) {
      this._syncAria();
      this._syncFill();
    }
  }

  render() {
    return html`
      <div class="track">
        <div class="fill"></div>
        <div class="dots">
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
          <div class="dot"></div>
        </div>
      </div>
    `;
  }

  _syncFill() {
    if (!this._fill) return;
    if (this.indeterminate) {
      this._fill.style.width = '0%';
      return;
    }
    const max = this.max;
    const value = Math.max(0, Math.min(this.value, max));
    const ratio = max === 0 ? 0 : value / max;
    this._fill.style.width = `${ratio * 100}%`;
  }

  _syncAria() {
    if (this.indeterminate) {
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', String(this.max));
      this.removeAttribute('aria-valuenow');
      this.setAttribute('aria-valuetext', 'Loading');
      return;
    }
    const max = this.max;
    const value = Math.max(0, Math.min(this.value, max));
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(max));
    this.setAttribute('aria-valuenow', String(value));
    this.removeAttribute('aria-valuetext');
  }
}

customElements.define('disco-progress-bar', DiscoProgressBar);

export default DiscoProgressBar;
