import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import radioButtonStyles from './disco-radio-button.scss';

class DiscoRadioButton extends DiscoUIElement {
  static get observedAttributes() {
    return ['checked', 'disabled', 'name'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(radioButtonStyles, this.shadowRoot);

    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';

    this._input = document.createElement('input');
    this._input.className = 'input';
    this._input.type = 'radio';

    const circle = document.createElement('span');
    circle.className = 'circle';

    const text = document.createElement('span');
    text.className = 'text';
    const slot = document.createElement('slot');
    text.appendChild(slot);

    wrapper.append(this._input, circle, text);
    this.shadowRoot.appendChild(wrapper);

    this.enableTilt({ selector: '.wrapper', skipTransformWhenHostDisabled: true });

    this.setAttribute('role', 'radio');
    this.tabIndex = 0;

    this.addEventListener('click', () => {
      if (this.disabled) return;
      if (!this.canClick) return;
      this._checkFromUser();
    });

    this.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this._checkFromUser();
      }
    });

    this._syncFromAttributes();
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

  get name() {
    return this.getAttribute('name') || '';
  }

  set name(value) {
    if (value == null || value === '') {
      this.removeAttribute('name');
      return;
    }
    this.setAttribute('name', String(value));
  }

  attributeChangedCallback() {
    this._syncFromAttributes();
  }

  _syncFromAttributes() {
    if (!this._input) return;

    this._input.checked = this.checked;
    this._input.disabled = this.disabled;
    this._input.name = this.name;

    this.setAttribute('aria-checked', this.checked ? 'true' : 'false');
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
  }

  _checkFromUser() {
    if (this.disabled) return;
    if (this.checked) return;

    this._uncheckGroupMates();
    this.checked = true;
    this._syncFromAttributes();
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _uncheckGroupMates() {
    const groupName = this.name;
    if (!groupName) return;

    const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(groupName)
      : groupName.replace(/"/g, '\\"');

    const radios = Array.from(document.querySelectorAll(`disco-radio-button[name="${escaped}"]`));
    radios.forEach((radio) => {
      if (radio === this) return;
      if (!radio.hasAttribute('checked')) return;
      radio.removeAttribute('checked');
    });
  }
}

if (!customElements.get('disco-radio-button')) {
  customElements.define('disco-radio-button', DiscoRadioButton);
}

export default DiscoRadioButton;
