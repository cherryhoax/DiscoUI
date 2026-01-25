import DiscoUIElement from './disco-ui-element.js';
import checkboxStyles from './disco-checkbox.scss';

class DiscoCheckbox extends DiscoUIElement {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(checkboxStyles, this.shadowRoot);
    this.enableTilt();

    const wrapper = document.createElement('label');
    wrapper.className = 'wrapper';

    this._input = document.createElement('input');
    this._input.className = 'input';
    this._input.type = 'checkbox';

    const box = document.createElement('span');
    box.className = 'box';

    const text = document.createElement('span');
    text.className = 'text';
    const slot = document.createElement('slot');
    text.appendChild(slot);

    wrapper.appendChild(this._input);
    wrapper.appendChild(box);
    wrapper.appendChild(text);
    this.shadowRoot.appendChild(wrapper);

    wrapper.addEventListener('click', (event) => {
      if (this.disabled) return;
      event.preventDefault();
      this.checked = !this.checked;
      this._syncFromAttributes();
      this.dispatchEvent(new Event('change', { bubbles: true }));
    });

    this._input.addEventListener('change', () => {
      this.checked = this._input.checked;
    });

    this.setAttribute('role', 'checkbox');
    this.tabIndex = 0;
    this.addEventListener('keydown', (event) => {
      if (this.disabled) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this.checked = !this.checked;
        this._syncFromAttributes();
        this.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    this._syncFromAttributes();
  }

  static get observedAttributes() {
    return ['checked', 'disabled'];
  }

  /**
   * @returns {boolean}
   */
  get checked() {
    return this.hasAttribute('checked');
  }

  /**
   * @param {boolean} next
   */
  set checked(next) {
    if (next) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
  }

  /**
   * @returns {boolean}
   */
  get disabled() {
    return this.hasAttribute('disabled');
  }

  /**
   * @param {boolean} next
   */
  set disabled(next) {
    if (next) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  /**
   * @param {string} _name
   * @param {string | null} _oldValue
   * @param {string | null} _newValue
   */
  attributeChangedCallback(_name, _oldValue, _newValue) {
    this._syncFromAttributes();
  }

  _syncFromAttributes() {
    if (!this._input) return;
    this._input.checked = this.checked;
    this._input.disabled = this.disabled;
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
