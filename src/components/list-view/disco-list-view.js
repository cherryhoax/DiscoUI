import DiscoUIElement from '../disco-ui-element.js';
import listViewStyles from './disco-list-view.css';
import './disco-list-item.js';

/**
 * @typedef {object} DiscoListItemClickDetail
 * @property {number} index
 * @property {HTMLElement} element
 * @property {unknown} [data]
 */

/**
 * Disco list view with static and dynamic item support.
 */
class DiscoListView extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(listViewStyles, this.shadowRoot);

    this._items = [];
    this._list = document.createElement('div');
    this._list.className = 'list';

    this._slot = document.createElement('slot');
    this._slot.addEventListener('slotchange', () => this._syncStaticVisibility());

    this.shadowRoot.appendChild(this._list);
    this.shadowRoot.appendChild(this._slot);

    this.setAttribute('role', 'list');
    this.addEventListener('click', (event) => this._handleClick(event));
  }

  /**
   * @returns {unknown[]}
   */
  get items() {
    return this._items;
  }

  /**
   * @param {unknown[]} value
   */
  set items(value) {
    this._items = Array.isArray(value) ? value : [];
    this._renderDynamic();
  }

  /**
   * @returns {boolean}
   */
  get itemClickEnabled() {
    return this.hasAttribute('item-click-enabled') || this.hasAttribute('is-item-click-enabled');
  }

  /**
   * @param {boolean} value
   */
  set itemClickEnabled(value) {
    if (value) {
      this.setAttribute('item-click-enabled', '');
    } else {
      this.removeAttribute('item-click-enabled');
      this.removeAttribute('is-item-click-enabled');
    }
  }

  /**
   * @returns {string}
   */
  get selectionMode() {
    return this.getAttribute('selection-mode') || 'none';
  }

  /**
   * @param {string} value
   */
  set selectionMode(value) {
    if (value) {
      this.setAttribute('selection-mode', value);
    } else {
      this.removeAttribute('selection-mode');
    }
  }

  /**
   * @param {MouseEvent} event
   * @returns {void}
   */
  _handleClick(event) {
    if (!this.itemClickEnabled) return;
    const path = event.composedPath();
    const listItem = path.find((node) =>
      node instanceof HTMLElement &&
      (node.tagName === 'DISCO-LIST-ITEM' || node.hasAttribute('data-list-index'))
    );
    if (!(listItem instanceof HTMLElement)) return;

    let index = Number(listItem.dataset.listIndex ?? -1);
    let data = undefined;
    if (Number.isFinite(index) && index >= 0 && this._items[index] !== undefined) {
      data = this._items[index];
    } else {
      const staticItems = this._getStaticItems();
      index = staticItems.indexOf(listItem);
    }

    const detail = /** @type {DiscoListItemClickDetail} */ ({
      index,
      element: listItem,
      data
    });

    this.dispatchEvent(new CustomEvent('itemclick', { detail, bubbles: true }));
  }

  _getTemplate() {
    return this.querySelector('template[disco-list-template]') || this.querySelector('template');
  }

  _getStaticItems() {
    return Array.from(this.querySelectorAll('disco-list-item'));
  }

  _syncStaticVisibility() {
    const hasDynamic = this._items && this._items.length > 0;
    if (this._slot) this._slot.style.display = hasDynamic ? 'none' : '';
    if (this._list) this._list.style.display = hasDynamic ? '' : 'none';
  }

  _renderDynamic() {
    if (!this._list) return;
    this._list.innerHTML = '';
    if (!this._items || this._items.length === 0) {
      this._syncStaticVisibility();
      return;
    }

    const template = this._getTemplate();
    this._items.forEach((item, index) => {
      const listItem = new (customElements.get('disco-list-item'))();
      listItem.dataset.listIndex = `${index}`;
      if (template) {
        const fragment = template.content.cloneNode(true);
        this._bindTemplate(fragment, item);
        listItem.appendChild(fragment);
      } else {
        listItem.textContent = typeof item === 'string' ? item : JSON.stringify(item);
      }
      this._list.appendChild(listItem);
    });

    this._syncStaticVisibility();
  }

  _bindTemplate(fragment, data) {
    if (!data || typeof data !== 'object') return;
    const nodes = fragment.querySelectorAll('[data-bind]');
    nodes.forEach((node) => {
      if (!(node instanceof HTMLElement)) return;
      const field = node.getAttribute('data-bind');
      if (!field) return;
      const value = data[field];
      node.textContent = value != null ? String(value) : '';
    });
  }
}

customElements.define('disco-list-view', DiscoListView);

export default DiscoListView;
