import DiscoUIElement from '../disco-ui-element.js';
import itemCss from './disco-pivot-item.scss';

class DiscoPivotItem extends DiscoUIElement {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(itemCss, this.shadowRoot);
    const slot = document.createElement('slot');
    this.shadowRoot.appendChild(slot);
  }
}

customElements.define('disco-pivot-item', DiscoPivotItem);

export default DiscoPivotItem;
