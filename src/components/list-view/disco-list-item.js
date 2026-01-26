import DiscoUIElement from '../disco-ui-element.js';
import listItemStyles from './disco-list-item.scss';

/**
 * Disco list item wrapper.
 */
class DiscoListItem extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(listItemStyles, this.shadowRoot);

    const container = document.createElement('div');
    container.className = 'item';
    const slot = document.createElement('slot');
    container.appendChild(slot);
    this.shadowRoot.appendChild(container);
    this.setAttribute('role', 'listitem');

    this.enableTilt({ selector: '.item' });
  }
}

customElements.define('disco-list-item', DiscoListItem);

export default DiscoListItem;
