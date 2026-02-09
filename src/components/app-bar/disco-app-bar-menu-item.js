import DiscoUIElement from '../disco-ui-element.js';
import menuItemStyles from './disco-app-bar-menu-item.scss';

/**
 * A menu item that appears in the app bar ellipsis menu.
 * @extends DiscoUIElement
 */
class DiscoAppBarMenuItem extends DiscoUIElement {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(menuItemStyles, this.shadowRoot);

    const menuItem = document.createElement('div');
    menuItem.className = 'menu-item';

    const label = document.createElement('span');
    label.className = 'menu-label';
    menuItem.appendChild(label);

    this.shadowRoot.appendChild(menuItem);

    // Store reference
    this._menuItem = menuItem;
    this._label = label;

    this.enableTilt({ selector: '.menu-item'});
  }

  static get observedAttributes() {
    return ['label', 'disabled'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'label') {
      this._label.textContent = newValue || '';
    } else if (name === 'disabled') {
      if (newValue !== null) {
        this._menuItem.setAttribute('data-disabled', '');
      } else {
        this._menuItem.removeAttribute('data-disabled');
      }
    }
  }

  connectedCallback() {
    const label = this.getAttribute('label');
    if (label) {
      this._label.textContent = label;
    }

    // Assign to menu slot in app bar
    this.setAttribute('slot', 'menu');
  }
}

customElements.define('disco-app-bar-menu-item', DiscoAppBarMenuItem);

export default DiscoAppBarMenuItem;
