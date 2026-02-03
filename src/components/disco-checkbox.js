import { html, css, unsafeCSS } from 'lit';
import { property } from 'lit/decorators.js';
import DiscoUIElement from './disco-ui-element.js';
import checkboxStyles from './disco-checkbox.scss';

/**
 * Checkbox control element for Disco UI.
 * @extends DiscoUIElement
 */
class DiscoCheckbox extends DiscoUIElement {
  static properties = {
    checked: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true }
  };

  static styles = css`
    ${unsafeCSS(checkboxStyles)}
  `;

  constructor() {
    super();
    this.checked = false;
    this.disabled = false;
    this.setAttribute('role', 'checkbox');
    this.tabIndex = 0;
  }

  render() {
    return html`
      <label class="wrapper" @click=${this._handleWrapperClick}>
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

  firstUpdated() {
    this.enableTilt();
    this.addEventListener('keydown', this._handleKeydown);
  }

  updated(changedProperties) {
    if (changedProperties.has('checked') || changedProperties.has('disabled')) {
      this._syncAriaAttributes();
    }
  }

  _handleWrapperClick(event) {
    if (this.disabled) return;
    event.preventDefault();
    this.checked = !this.checked;
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _handleInputChange(event) {
    this.checked = event.target.checked;
  }

  _handleKeydown = (event) => {
    if (this.disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.checked = !this.checked;
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  _syncAriaAttributes() {
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
