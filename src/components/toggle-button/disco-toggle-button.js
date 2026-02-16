import DiscoButton from '../buttons/disco-button.js';
import toggleButtonStyles from './disco-toggle-button.scss';

class DiscoToggleButton extends DiscoButton {
  constructor() {
    super();
    this.loadStyle(toggleButtonStyles, this.shadowRoot);

    this._button = this.shadowRoot?.querySelector('.button') || this.shadowRoot?.querySelector('button');
    this.addEventListener('disco-press', () => {
      if (this.disabled) return;
      this._toggleFromUser();
    });

    this.setAttribute('role', 'button');
    this._syncFromAttributes();
  }

  static get observedAttributes() {
    return ['checked', 'disabled'];
  }

  get checked() {
    return this.hasAttribute('checked');
  }

  set checked(next) {
    if (next) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(next) {
    if (next) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  attributeChangedCallback() {
    this._syncFromAttributes();
  }

  _syncFromAttributes() {
    if (this._button) {
      this._button.disabled = this.disabled;
      this._button.setAttribute('aria-pressed', this.checked ? 'true' : 'false');
    }

    this.setAttribute('aria-pressed', this.checked ? 'true' : 'false');

    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
  }

  _toggleFromUser() {
    const prev = this.checked;
    this.checked = !prev;
    if (this.checked !== prev) {
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  }
}

if (!customElements.get('disco-toggle-button')) {
  customElements.define('disco-toggle-button', DiscoToggleButton);
}

export default DiscoToggleButton;
