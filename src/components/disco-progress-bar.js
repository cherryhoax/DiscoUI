import { html, css } from 'lit';
import { property, query } from 'lit/decorators.js';
import DiscoUIElement from './disco-ui-element.js';

/**
 * Progress bar element with determinate and indeterminate modes.
 * @extends DiscoUIElement
 */
class DiscoProgressBar extends DiscoUIElement {
  static styles = css`
    :host {
      display: inline-block;
      width: 265px;
      height: 4px;
      box-sizing: border-box;
    }

    .track {
      width: 100%;
      height: 100%;
      --disco-progress-bar-bg: calc(25 + (205 * var(--disco-theme)));
      background-color: rgb(var(--disco-progress-bar-bg), var(--disco-progress-bar-bg), var(--disco-progress-bar-bg));
      overflow: hidden;
      position: relative;
    }

    .fill {
      width: 0%;
      height: 100%;
      background-color: var(--disco-accent);
      transition: width 160ms ease-out;
    }

    .dots {
      position: absolute;
      inset: 0;
      display: none;
      align-items: center;
      justify-content: center;
      gap: 14px;
      animation: disco-progress-dots 3s infinite linear;
    }

    .dot {
      width: 4px;
      height: 4px;
      border-radius: 2px;
      background-color: var(--disco-accent);
      animation: disco-progress-dot 3s infinite var(--disco-ease-in-out-sine);
      opacity: 0;
    }

    .dot:nth-child(1) {
      animation-delay: 0.5s;
    }

    .dot:nth-child(2) {
      animation-delay: 0.4s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.3s;
    }

    .dot:nth-child(4) {
      animation-delay: 0.2s;
    }

    .dot:nth-child(5) {
      animation-delay: 0.1s;
    }

    :host([indeterminate]) .track {
      background-color: transparent;
    }

    :host([indeterminate]) .fill {
      display: none;
    }

    :host([indeterminate]) .dots {
      display: flex;
    }

    @keyframes disco-progress-dots {
      0% {
        transform: translateX(-30%);
      }
      100% {
        transform: translateX(30%);
      }
    }

    @keyframes disco-progress-dot {
      0% {
        transform: translateX(-1500%);
        opacity: 0;
      }
      20% {
        transform: translateX(0%);
        opacity: 1;
      }
      40% {
        transform: translateX(0%);
        opacity: 1;
      }
      60%, 100% {
        transform: translateX(1500%);
        opacity: 0;
      }
    }
  `;

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
