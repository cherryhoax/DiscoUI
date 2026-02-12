import DiscoUIElement from './ui-elements/disco-ui-element.js';
import checkboxStyles from './disco-checkbox.scss';

/**
 * Checkbox control element for Disco UI.
 * @extends DiscoUIElement
 */
class DiscoCheckbox extends DiscoUIElement {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(checkboxStyles, this.shadowRoot);

    const wrapper = document.createElement('div');
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

    this.addEventListener('click', () => {
      if (this.disabled) return;
      if (!this.canClick) return;
      console.log("heyyy")
      this._toggleFromUser();
    });

    this.enableTilt({ selector: '.wrapper', skipTransformWhenHostDisabled: true });

    this.setAttribute('role', 'checkbox');
    this.tabIndex = 0;
    this.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this._toggleFromUser();
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

  _toggleFromUser() {
    if (this.disabled) return;
    const prev = this.checked;
    this.checked = !prev;
    this._syncFromAttributes();
    if (this.checked !== prev) {
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

customElements.define('disco-checkbox', DiscoCheckbox);

export default DiscoCheckbox;
