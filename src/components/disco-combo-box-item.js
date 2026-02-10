import DiscoUIElement from './disco-ui-element.js';
import comboBoxItemStyles from './disco-combo-box-item.scss';

/**
 * Combo box item used within <disco-combo-box>.
 */
class DiscoComboBoxItem extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(comboBoxItemStyles, this.shadowRoot);

    const item = document.createElement('div');
    item.className = 'item';
    const slot = document.createElement('slot');
    item.appendChild(slot);
    this.shadowRoot.appendChild(item);

    this.enableTilt({ selector: '.item' });
  }

  get value() {
    return this.getAttribute('value') || this.textContent || '';
  }

  set value(value) {
    if (value === null || value === undefined) {
      this.removeAttribute('value');
    } else {
      this.setAttribute('value', String(value));
    }
  }
}

customElements.define('disco-combo-box-item', DiscoComboBoxItem);

export default DiscoComboBoxItem;
