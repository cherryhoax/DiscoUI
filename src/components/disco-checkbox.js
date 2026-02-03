import { html, css } from 'lit';
import { property, query } from 'lit/decorators.js';
import DiscoUIElement from './disco-ui-element.js';

/**
 * Checkbox control element for Disco UI.
 * @extends DiscoUIElement
 */
class DiscoCheckbox extends DiscoUIElement {
  static styles = css`
    :host {
      display: inline-flex;
      align-items: center;
    }

    .wrapper {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--disco-fg);
      font-size: 16px;
    }

    .input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
      width: 0;
      height: 0;
    }

    .box {
      width: 22px;
      height: 22px;
      border: 2px solid var(--disco-fg);
      background-color: var(--disco-bg);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      box-sizing: border-box;
    }

    .box::after {
      content: '';
      width: 10px;
      height: 6px;
      border-left: 2px solid var(--disco-fg);
      border-bottom: 2px solid var(--disco-fg);
      transform: rotate(-45deg);
      opacity: 0;
    }

    .input:checked+.box::after {
      opacity: 1;
    }

    :host([data-pressed]) .wrapper .box,
    :host([data-pressed]) .input+.box {
      background-color: var(--disco-accent);
    }

    :host([data-pressed]) .wrapper .box::after,
    :host([data-pressed]) .input+.box::after {
      border-left-color: #fff;
      border-bottom-color: #fff;
    }

    :host([disabled]) .wrapper {
      opacity: 0.5;
    }

    .text {
      display: inline-flex;
      align-items: center;
    }
  `;

  @property({ type: Boolean, reflect: true }) checked = false;
  @property({ type: Boolean, reflect: true }) disabled = false;

  @query('.input') _input;

  constructor() {
    super();
    this.setAttribute('role', 'checkbox');
    this.tabIndex = 0;
  }

  firstUpdated() {
    this.enableTilt();
    this._syncAttributes();
  }

  updated(changedProperties) {
    if (changedProperties.has('checked') || changedProperties.has('disabled')) {
      this._syncAttributes();
    }
  }

  render() {
    return html`
      <label class="wrapper" @click=${this._handleClick}>
        <input 
          class="input" 
          type="checkbox" 
          .checked=${this.checked}
          .disabled=${this.disabled}
          @change=${this._handleInputChange}
        />
        <span class="box"></span>
        <span class="text">
          <slot></slot>
        </span>
      </label>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    this.addEventListener('keydown', this._handleKeyDown);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.removeEventListener('keydown', this._handleKeyDown);
  }

  _handleClick = (event) => {
    if (this.disabled) return;
    event.preventDefault();
    this.checked = !this.checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  };

  _handleInputChange = () => {
    this.checked = this._input.checked;
  };

  _handleKeyDown = (event) => {
    if (this.disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.checked = !this.checked;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  _syncAttributes() {
    this.setAttribute('aria-checked', this.checked ? 'true' : 'false');
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
  }
}

customElements.define('disco-checkbox', DiscoCheckbox);

export default DiscoCheckbox;
