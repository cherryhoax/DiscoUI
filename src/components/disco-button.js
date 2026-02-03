import { html, css } from 'lit';
import { query } from 'lit/decorators.js';
import DiscoUIElement from './disco-ui-element.js';

/**
 * A clickable Disco UI button element.
 * @extends DiscoUIElement
 */
class DiscoButton extends DiscoUIElement {
  static styles = css`
    :host {
      display: inline-block;
    }

    :host([data-pressed]) .button {
      background-color: var(--disco-accent);
    }

    .button {
      transition: transform .25s .25s ease-out;
      transform-style: preserve-3d;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 22px;
      min-height: 40px;
      border: 2px solid var(--disco-fg);
      background-color: var(--disco-bg);
      color: #fff;
      font-size: 16px;
      letter-spacing: 0.02em;
      text-transform: none;
      box-sizing: border-box;
      outline: none;
    }

    .button[data-pressed] {
      transition: transform .1ms;
      background-color: var(--disco-accent);
    }

    .button:focus-visible {
      outline: 2px solid var(--disco-fg);
      outline-offset: 2px;
    }
  `;

  @query('.button') _button;

  firstUpdated() {
    this.enableTilt({ selector: '.button' });
  }

  render() {
    return html`
      <button class="button" type="button">
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('disco-button', DiscoButton);

export default DiscoButton;
