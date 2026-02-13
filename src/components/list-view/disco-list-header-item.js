import DiscoListItem from './disco-list-item.js';
import listHeaderItemStyles from './disco-list-header-item.scss';

/**
 * Sticky/group header item for Disco list view.
 */
class DiscoListHeaderItem extends DiscoListItem {
  constructor() {
    super();
    this.loadStyle(listHeaderItemStyles, this.shadowRoot);
    this.setAttribute('role', 'button');
    this.tabIndex = 0;

    this.disableTilt();
    this.enableTilt({ selector: '.item' });
  }
}

if (!customElements.get('disco-list-header-item')) {
  customElements.define('disco-list-header-item', DiscoListHeaderItem);
}

export default DiscoListHeaderItem;
