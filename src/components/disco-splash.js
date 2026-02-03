import { html, css } from 'lit';
import { property } from 'lit/decorators.js';
import DiscoUIElement from './disco-ui-element.js';

/**
 * Splash screen element shown while the app is starting.
 * @extends DiscoUIElement
 */
class DiscoSplash extends DiscoUIElement {
  static styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: var(--disco-accent, #d80073);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: opacity 0.4s ease;
      color: #fff;
    }

    .splash {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .dots {
      display: flex;
      gap: 8px;
      margin-top: 20px;
    }

    .dot {
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      animation: fly 1.5s infinite;
    }

    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes fly {
      0% {
        transform: translateX(-50px);
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: translateX(50px);
        opacity: 0;
      }
    }

    img {
      filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35));
    }
  `;

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
