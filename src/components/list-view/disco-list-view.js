import DiscoScrollView from '../disco-scroll-view.js';
import listViewStyles from './disco-list-view.scss';
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
class DiscoListView extends DiscoScrollView {
  constructor() {
    super();
    this.loadStyle(listViewStyles, this.shadowRoot);

    if (this.hasAttribute('direction')) {
      this.removeAttribute('direction');
    }

    this._items = [];
    this._list = document.createElement('div');
    this._list.className = 'list';

    this._slot = this.shadowRoot.querySelector('slot') || document.createElement('slot');
    this._slot.addEventListener('slotchange', () => this._syncStaticVisibility());
    if (!this._slot.isConnected) {
      this._wrapper.appendChild(this._slot);
    }
    this._wrapper.insertBefore(this._list, this._slot);

    this.setAttribute('role', 'list');
    this.addEventListener('click', (event) => this._handleClick(event));
    this.addEventListener('keydown', (event) => this._handleKeydown(event));
    this.addEventListener('keyup', (event) => this._handleKeyup(event));
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
    this._syncItemInteractivity();
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
   * @returns {'vertical'}
   */
  get direction() {
    return 'vertical';
  }

  /**
   * @param {string} _value
   */
  set direction(_value) {
    if (this.hasAttribute('direction')) {
      this.removeAttribute('direction');
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

    this._dispatchItemSelect(listItem, detail);
  }

  /**
   * @param {HTMLElement} listItem
   * @param {DiscoListItemClickDetail} detail
   */
  _dispatchItemSelect(listItem, detail) {
    listItem.dispatchEvent(new CustomEvent('itemselect', { detail, bubbles: true }));
    this.dispatchEvent(new CustomEvent('itemselect', { detail, bubbles: true }));
    this.dispatchEvent(new CustomEvent('itemclick', { detail, bubbles: true }));
  }

  /**
   * @param {KeyboardEvent} event
   * @returns {void}
   */
  _handleKeydown(event) {
    if (!this.itemClickEnabled) return;
    const isActivateKey = event.key === 'Enter'
      || event.key === ' '
      || event.key === 'Spacebar'
      || event.code === 'Space'
      || event.code === 'Enter'
      || event.code === 'NumpadEnter';
    if (!isActivateKey) return;
    event.preventDefault();
    this._keyActivatePending = true;
  }

  /**
   * @param {KeyboardEvent} event
   * @returns {void}
   */
  _handleKeyup(event) {
    if (!this.itemClickEnabled) return;
    if (!this._keyActivatePending) return;
    const isActivateKey = event.key === 'Enter'
      || event.key === ' '
      || event.key === 'Spacebar'
      || event.code === 'Space'
      || event.code === 'Enter'
      || event.code === 'NumpadEnter';
    if (!isActivateKey) return;
    const path = event.composedPath();
    const listItem = path.find((node) =>
      node instanceof HTMLElement &&
      (node.tagName === 'DISCO-LIST-ITEM' || node.hasAttribute('data-list-index'))
    );
    if (!(listItem instanceof HTMLElement)) return;
    event.preventDefault();
    this._keyActivatePending = false;
    this._handleClick({ composedPath: () => [listItem] });
  }


  _getTemplate() {
    return this.querySelector('template[disco-list-template]') || this.querySelector('template');
  }

  _getStaticItems() {
    return Array.from(this.querySelectorAll('disco-list-item'));
  }

  _syncItemInteractivity() {
    const enable = this.itemClickEnabled;
    const staticItems = this._getStaticItems();
    staticItems.forEach((item) => {
      item.setAttribute('role', enable ? 'button' : 'listitem');
      if (enable) {
        item.tabIndex = 0;
      } else {
        item.removeAttribute('tabindex');
      }
    });
    if (this._list) {
      Array.from(this._list.children).forEach((child) => {
        if (!(child instanceof HTMLElement)) return;
        child.setAttribute('role', enable ? 'button' : 'listitem');
        if (enable) {
          child.tabIndex = 0;
        } else {
          child.removeAttribute('tabindex');
        }
      });
    }
  }

  _syncStaticVisibility() {
    const hasDynamic = this._items && this._items.length > 0;
    if (this._slot) this._slot.style.display = hasDynamic ? 'none' : '';
    if (this._list) this._list.style.display = hasDynamic ? '' : 'none';
    this._syncItemInteractivity();
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
      listItem.setAttribute('role', this.itemClickEnabled ? 'button' : 'listitem');
      if (this.itemClickEnabled) {
        listItem.tabIndex = 0;
      }
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
