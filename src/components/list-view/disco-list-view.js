import DiscoScrollView from '../scroll-view/disco-scroll-view.js';
import listViewStyles from './disco-list-view.scss';
import DiscoLongListSelector from '../long-list-selector/disco-long-list-selector.js';
import './disco-list-item.js';
import './disco-list-header-item.js';

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
  static get observedAttributes() {
    return ['group-style', 'group-field', 'group-label-field'];
  }

  constructor() {
    super();
    this.loadStyle(listViewStyles, this.shadowRoot);

    if (this.hasAttribute('direction')) {
      this.removeAttribute('direction');
    }

    this._items = [];
    this._itemProxyCache = new WeakMap();
    this._groupEntries = [];
    this._groupIndexByKey = new Map();
    this._groupSelector = null;

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
   * @param {string} _name
   * @param {string | null} oldValue
   * @param {string | null} newValue
   */
  attributeChangedCallback(_name, oldValue, newValue) {
    if (oldValue === newValue) return;
    this._refreshGrouping();
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
    const normalized = Array.isArray(value) ? value : [];
    this._items = normalized.map((item, index) => this._observeItem(item, index));
    this._renderDynamic();
  }

  /**
   * @returns {'auto' | 'custom' | null}
   */
  get groupStyle() {
    const style = (this.getAttribute('group-style') || '').toLowerCase();
    if (style === 'auto' || style === 'custom') return style;
    return null;
  }

  /**
   * @param {'auto' | 'custom' | null | undefined} value
   */
  set groupStyle(value) {
    const normalized = value === 'custom' ? 'custom' : (value === 'auto' ? 'auto' : null);
    if (normalized) {
      this.setAttribute('group-style', normalized);
    } else {
      this.removeAttribute('group-style');
    }
    this._refreshGrouping();
    this._renderDynamic();
  }

  /**
   * @returns {string}
   */
  get groupField() {
    return this.getAttribute('group-field') || this.getAttribute('groupfield') || 'separator';
  }

  /**
   * @param {string} value
   */
  set groupField(value) {
    if (!value) {
      this.removeAttribute('group-field');
      this.removeAttribute('groupfield');
    } else {
      this.setAttribute('group-field', value);
    }
    this._refreshGrouping();
    this._renderDynamic();
  }

  /**
   * @returns {string}
   */
  get groupLabelField() {
    return this.getAttribute('group-label-field') || this.getAttribute('group-labelfield') || 'Title';
  }

  /**
   * @param {string} value
   */
  set groupLabelField(value) {
    if (!value) {
      this.removeAttribute('group-label-field');
      this.removeAttribute('group-labelfield');
    } else {
      this.setAttribute('group-label-field', value);
    }
    this._refreshGrouping();
    this._renderDynamic();
  }

  /**
   * @param {unknown} item
   * @param {number} index
   * @returns {unknown}
   */
  _observeItem(item, index) {
    if (!item || typeof item !== 'object') {
      return item;
    }

    const cached = this._itemProxyCache.get(item);
    if (cached) {
      return cached;
    }

    const proxy = new Proxy(item, {
      set: (target, prop, nextValue) => {
        target[prop] = nextValue;
        if (typeof prop === 'string') {
          this._updateDynamicBinding(index, prop, nextValue);
        }
        return true;
      }
    });

    this._itemProxyCache.set(item, proxy);
    return proxy;
  }

  /**
   * @param {number} index
   * @param {string} field
   * @param {unknown} value
   * @returns {void}
   */
  _updateDynamicBinding(index, field, value) {
    if (!this._list) return;
    const listItem = this._list.querySelector(`[data-list-index="${index}"]`);
    if (!(listItem instanceof HTMLElement)) return;
    const node = listItem.querySelector(`[data-bind="${field}"]`);
    if (!(node instanceof HTMLElement)) return;
    node.textContent = value != null ? String(value) : '';
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
    const path = event.composedPath();
    const groupHeader = path.find((node) =>
      node instanceof HTMLElement
      && node.tagName === 'DISCO-LIST-HEADER-ITEM'
    );
    if (groupHeader instanceof HTMLElement && this.groupStyle) {
      this._openGroupSelector();
      return;
    }

    if (!this.itemClickEnabled) return;
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
      this._list.querySelectorAll('disco-list-header-item').forEach((header) => {
        if (!(header instanceof HTMLElement)) return;
        header.setAttribute('role', 'button');
        header.tabIndex = 0;
      });

      this._list.querySelectorAll('disco-list-item').forEach((child) => {
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
    let activeSection = null;
    let lastGroupKey = null;

    const ensureSectionForItem = (groupMeta) => {
      if (!this.groupStyle || !groupMeta.key) {
        if (!activeSection) {
          activeSection = document.createElement('div');
          activeSection.className = 'group-section';
          this._list.appendChild(activeSection);
        }
        return activeSection;
      }

      if (groupMeta.key !== lastGroupKey || !activeSection) {
        activeSection = document.createElement('div');
        activeSection.className = 'group-section';

        const groupHeader = new (customElements.get('disco-list-header-item'))();
        groupHeader.dataset.groupKey = groupMeta.key;
        groupHeader.dataset.groupLabel = groupMeta.label;

        const groupHeaderLabel = document.createElement('div');
        groupHeaderLabel.className = 'group-header-label';
        groupHeaderLabel.textContent = groupMeta.label || groupMeta.key;
        groupHeader.appendChild(groupHeaderLabel);

        activeSection.appendChild(groupHeader);
        this._list.appendChild(activeSection);
        lastGroupKey = groupMeta.key;
      }

      return activeSection;
    };

    this._items.forEach((item, index) => {
      const groupMeta = this._resolveGroupMeta(item);
      const section = ensureSectionForItem(groupMeta);

      const listItem = new (customElements.get('disco-list-item'))();
      listItem.dataset.listIndex = `${index}`;
      if (groupMeta.key) {
        listItem.dataset.groupKey = groupMeta.key;
        listItem.dataset.groupLabel = groupMeta.label;
      }

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
      section.appendChild(listItem);
    });

    this._syncStaticVisibility();
    this._refreshGrouping();
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

  /**
   * @param {string} key
   * @returns {string}
   */
  _mapAutoGroupLabel(key) {
    if (key === '0-9') return '#';
    if (key === '&') return '&';
    return key;
  }

  /**
   * @param {string} text
   * @returns {string | null}
   */
  _toAutoGroupKey(text) {
    const source = String(text || '').trim();
    if (!source) return null;

    const first = Array.from(source)[0]?.toLocaleUpperCase('en') || '';
    if (!first) return null;

    if (/^[0-9]$/.test(first)) return '0-9';
    if (/^[A-Z]$/.test(first)) return first;
    return '&';
  }

  /**
   * @param {unknown} item
   * @returns {{ key: string | null, label: string }}
   */
  _resolveGroupMeta(item) {
    if (!item || typeof item !== 'object') {
      return { key: null, label: '' };
    }

    if (this.groupStyle === 'custom') {
      const key = item[this.groupField] != null ? String(item[this.groupField]).trim() : '';
      return {
        key: key || null,
        label: key || ''
      };
    }

    const rawLabel = item[this.groupLabelField] != null
      ? String(item[this.groupLabelField])
      : (item.title != null ? String(item.title) : '');
    const key = this._toAutoGroupKey(rawLabel);
    return {
      key,
      label: key ? this._mapAutoGroupLabel(key) : ''
    };
  }

  _refreshGrouping() {
    if (!this.groupStyle || !Array.isArray(this._items) || !this._items.length) {
      this._groupEntries = [];
      this._groupIndexByKey = new Map();
      return;
    }

    const seen = new Set();
    const entries = [];
    const groupIndexByKey = new Map();

    this._items.forEach((item, index) => {
      const meta = this._resolveGroupMeta(item);
      if (!meta.key) return;
      if (seen.has(meta.key)) return;
      seen.add(meta.key);
      entries.push({ key: meta.key, label: meta.label, index });
      groupIndexByKey.set(meta.key, index);
    });

    this._groupEntries = entries;
    this._groupIndexByKey = groupIndexByKey;
  }

  _openGroupSelector() {
    if (!this.groupStyle || !this._groupEntries.length) return;

    if (!this._groupSelector) {
      this._groupSelector = new DiscoLongListSelector('GROUPS', [], { mode: this.groupStyle || 'auto' });
    }

    if (this.groupStyle === 'custom') {
      this._groupSelector.setData(this._items, {
        mode: 'custom',
        separatorField: this.groupField,
        separators: this._groupEntries.map((entry) => entry.key)
      });
    } else {
      this._groupSelector.setData(this._items, {
        mode: 'auto',
        labelField: this.groupLabelField
      });
    }

    this._groupSelector.open().then((selected) => {
      if (!selected) return;
      this._scrollToGroup(selected);
    });
  }

  /**
   * @param {string} key
   */
  _scrollToGroup(key) {
    const element = Array.from(this._list?.querySelectorAll('disco-list-header-item') || []).find((node) =>
      node instanceof HTMLElement
      && node.dataset.groupKey === key
    );
    if (!(element instanceof HTMLElement)) return;

    this.scrollTo(0, element.offsetTop, false);
  }
}

customElements.define('disco-list-view', DiscoListView);

export default DiscoListView;
