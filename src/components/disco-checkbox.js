import { html, css, unsafeCSS } from 'lit';
import DiscoUIElement from './disco-ui-element.js';
import checkboxStyles from './disco-checkbox.scss';

/**
 * Checkbox control element for Disco UI.
 * @extends DiscoUIElement
 */
class DiscoCheckbox extends DiscoUIElement {
  static styles = css`${unsafeCSS(checkboxStyles)}`;

  static get properties() {
    return {
      checked: { type: Boolean, reflect: true },
      disabled: { type: Boolean, reflect: true }
    };
  }

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.setAttribute('role', 'checkbox');
    this.tabIndex = 0;
  }

  firstUpdated() {
    this._input = this.shadowRoot.querySelector('.input');
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
