import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import textBoxStyles from './disco-text-box.scss';

/**
 * A Metro-style text input box.
 */
class DiscoTextBox extends DiscoUIElement {
  static get observedAttributes() {
    return ['value', 'placeholder', 'type'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(textBoxStyles, this.shadowRoot);

    this._input = document.createElement('input');
    this._input.className = 'text-box';
    this._input.type = 'text'; // default

    // Re-dispatch events
    this._input.addEventListener('input', (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('input', { detail: { value: this.value }, bubbles: true }));
    });
    this._input.addEventListener('change', (e) => {
        e.stopPropagation();
        this.dispatchEvent(new CustomEvent('change', { detail: { value: this.value }, bubbles: true }));
    });
    this._input.addEventListener('keydown', (e) => {
        // Allow event to bubble naturally or re-dispatch if needed.
        // For standard inputs, keydown bubbles through shadow root mostly fine if composed: true, but native inputs don't always doing that simply.
        // Actually native input events cross shadow boundary mostly.
    });

    this.shadowRoot.appendChild(this._input);
  }

  connectedCallback() {
      if (this.hasAttribute('value')) {
          this._input.value = this.getAttribute('value');
      }
      if (this.hasAttribute('placeholder')) {
          this._input.placeholder = this.getAttribute('placeholder');
      }
      if (this.hasAttribute('type')) {
          this._input.type = this.getAttribute('type');
      }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!this._input) return;
    if (name === 'value') {
        if (this._input.value !== newValue) {
            this._input.value = newValue || '';
        }
    } else if (name === 'placeholder') {
        this._input.placeholder = newValue || '';
    } else if (name === 'type') {
        this._input.type = newValue || 'text';
    }
  }

  get value() {
    return this._input.value;
  }

  set value(val) {
    this._input.value = val;
    this.setAttribute('value', val);
  }

  get placeholder() {
      return this._input.placeholder;
  }

  set placeholder(val) {
      if (val) this.setAttribute('placeholder', val);
      else this.removeAttribute('placeholder');
  }

  get type() {
      return this._input.type;
  }
  
  set type(val) {
      if (val) this.setAttribute('type', val);
      else this.removeAttribute('type'); // Default handling
  }

  focus() {
      this._input.focus();
  }
}

customElements.define('disco-text-box', DiscoTextBox);
export default DiscoTextBox;
