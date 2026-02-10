import DiscoUIElement from './disco-ui-element.js';
import comboBoxStyles from './disco-combo-box.scss';
import './disco-combo-box-item.js';

/**
 * A Metro-style combo box control.
 */
class DiscoComboBox extends DiscoUIElement {
  static get observedAttributes() {
    return ['open', 'value'];
  }

  constructor() {
    super();
    this._debug = false;
    this.attachShadow({ mode: 'open' });
    this.loadStyle(comboBoxStyles, this.shadowRoot);

    this._combo = document.createElement('div');
    this._combo.className = 'combo';
    this._combo.setAttribute('role', 'listbox');

    this._itemsWrapper = document.createElement('div');
    this._itemsWrapper.className = 'items';

    this._slot = document.createElement('slot');
    this._slot.addEventListener('slotchange', () => this._syncItems());
    this._itemsWrapper.appendChild(this._slot);

    this._combo.appendChild(this._itemsWrapper);
    this.shadowRoot.appendChild(this._combo);

    this._selectedIndex = -1;
    this._open = false;

    this._boundClick = (event) => this._handleClick(event);
    this._boundPointerUp = (event) => this._handlePointerUp(event);
    this.addEventListener('click', this._boundClick, { capture: true });
    this._combo.addEventListener('click', this._boundClick, { capture: true });
    this.addEventListener('pointerup', this._boundPointerUp);
    this.addEventListener('keydown', (event) => this._handleKeydown(event));

    this.enableTilt({ selector: '.combo' });
  }

  connectedCallback() {
    this._open = this.hasAttribute('open');
    this._debug = this.hasAttribute('debug');
    if (!this.hasAttribute('tabindex')) {
      this.tabIndex = 0;
    }
    if (!this.hasAttribute('role')) {
      this.setAttribute('role', 'listbox');
    }
    this._syncItems();
    this._updateAria();
    this._bindDocumentHandlers();
  }

  attributeChangedCallback(name, _oldValue, newValue) {
    if (!this.isConnected) return;
    if (name === 'open') {
      this._open = newValue !== null;
      this._log('open changed', { open: this._open });
      this._updateLayout();
      this._updateAria();
    }
    if (name === 'value' && newValue !== null) {
      if (newValue === this.value) return;
      this._log('value changed', { value: newValue });
      this.value = newValue;
    }
  }

  disconnectedCallback() {
    this._unbindDocumentHandlers();
  }

  get items() {
    return this._getItems();
  }

  get selectedIndex() {
    return this._selectedIndex;
  }

  set selectedIndex(value) {
    this._selectIndex(Number(value), { emit: false, close: false });
  }

  get value() {
    const item = this._getSelectedItem();
    return item ? item.value : '';
  }

  set value(value) {
    const items = this._getItems();
    const index = items.findIndex((item) => item.value === value);
    if (index >= 0) {
      this._selectIndex(index, { emit: false, close: false });
    }
  }

  open() {
    if (this._open) return;
    this._open = true;
    this.setAttribute('open', '');
    this.disableTilt();
    this._updateLayout();
    this._updateAria();
  }

  close() {
    if (!this._open) return;
    this._open = false;
    this.removeAttribute('open');
    this.enableTilt({ selector: '.combo' });
    this._updateLayout();
    this._updateAria();
  }

  toggle() {
    if (this._open) {
      this.close();
    } else {
      this.open();
    }
  }

  _bindDocumentHandlers() {
    if (this._documentPointerHandler) return;
    this._documentPointerHandler = (event) => {
      if (!this.contains(event.target)) {
        this.close();
      }
    };
    document.addEventListener('pointerdown', this._documentPointerHandler);
  }

  _unbindDocumentHandlers() {
    if (!this._documentPointerHandler) return;
    document.removeEventListener('pointerdown', this._documentPointerHandler);
    this._documentPointerHandler = null;
  }

  _getItems() {
    return Array.from(this.querySelectorAll('disco-combo-box-item'));
  }

  _getSelectedItem() {
    const items = this._getItems();
    if (this._selectedIndex < 0 || this._selectedIndex >= items.length) return null;
    return items[this._selectedIndex];
  }

  _syncItems() {
    const items = this._getItems();
    items.forEach((item, index) => {
      item.dataset.index = String(index);
      item.setAttribute('role', 'option');
      item.tabIndex = -1;
    });

    let selectedIndex = items.findIndex((item) => item.hasAttribute('selected'));
    if (selectedIndex < 0 && items.length) {
      selectedIndex = this._selectedIndex >= 0 ? this._selectedIndex : 0;
    }

    if (items.length) {
      this._selectIndex(selectedIndex, { emit: false, close: false });
    } else {
      this._selectedIndex = -1;
      this.removeAttribute('value');
      if (this._itemsWrapper) this._itemsWrapper.style.removeProperty('transform');
      if (this._combo) this._combo.style.removeProperty('height');
    }
  }

  _selectIndex(index, { emit = true, close = true } = {}) {
    const items = this._getItems();
    if (!items.length) return;
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
    const prevIndex = this._selectedIndex;
    this._selectedIndex = clampedIndex;
    this._log('select index', { index: clampedIndex, prevIndex, emit, close });

    items.forEach((item, itemIndex) => {
      if (itemIndex === clampedIndex) {
        item.setAttribute('selected', '');
        item.setAttribute('aria-selected', 'true');
      } else {
        item.removeAttribute('selected');
        item.setAttribute('aria-selected', 'false');
      }
    });

    const selectedItem = items[clampedIndex];
    const value = selectedItem?.value ?? '';
    if (value) {
      this.setAttribute('value', value);
    } else {
      this.removeAttribute('value');
    }

    this._updateLayout();

    if (emit && clampedIndex !== prevIndex) {
      this.dispatchEvent(
        new CustomEvent('change', {
          detail: {
            index: clampedIndex,
            value,
            item: selectedItem
          },
          bubbles: true
        })
      );
    }

    if (close) {
      this.close();
    }
  }

  _updateLayout() {
    const items = this._getItems();
    const itemHeight = 48;
    const openHeight = 56;
    const openSize = items.length ? items.length * openHeight : openHeight;
    if (this._combo) {
      this._combo.style.height = this._open ? `${openSize}px` : `${itemHeight}px`;
    }
    if (this._itemsWrapper) {
      if (this._open) {
        this._itemsWrapper.style.transform = 'translateY(0px)';
      } else if (this._selectedIndex >= 0) {
        this._itemsWrapper.style.transform = `translateY(${-this._selectedIndex * itemHeight}px)`;
      }
    }
    this._log('layout update', {
      open: this._open,
      selectedIndex: this._selectedIndex,
      itemHeight,
      openHeight,
      openSize
    });
  }

  _handleClick(event) {
    if (!this.isConnected) return;
    const item = this._getItemFromEvent(event);
    this._log('click', { open: this._open, target: event.target?.tagName, item: item?.tagName });
    if (this._open) {
      if (item) {
        const items = this._getItems();
        let index = Number(item.dataset.index ?? -1);
        if (!Number.isFinite(index) || index < 0 || items[index] !== item) {
          index = items.indexOf(item);
        }
        this._log('click item', { index, itemValue: item?.value });
        if (index >= 0) {
          this._selectIndex(index, { emit: true, close: true });
          this.close();
        }
      } else {
        this.close();
      }
      return;
    }

    this.open();
  }

  _handlePointerUp(event) {
    if (!this.isConnected) return;
    const item = this._getItemFromEvent(event);
    this._log('pointerup', { open: this._open, target: event.target?.tagName, item: item?.tagName });
    if (item) {
      this._handleClick(event);
    }
  }

  _handleKeydown(event) {
    const items = this._getItems();
    if (!items.length) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this._open) this.open();
        this._selectIndex(this._selectedIndex + 1, { emit: true, close: false });
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!this._open) this.open();
        this._selectIndex(this._selectedIndex - 1, { emit: true, close: false });
        break;
      case 'Home':
        event.preventDefault();
        this._selectIndex(0, { emit: true, close: false });
        break;
      case 'End':
        event.preventDefault();
        this._selectIndex(items.length - 1, { emit: true, close: false });
        break;
      case 'Enter':
      case ' ':
      case 'Spacebar':
        event.preventDefault();
        if (this._open) {
          this.close();
        } else {
          this.open();
        }
        break;
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      default:
        break;
    }
  }

  _getItemFromEvent(event) {
    if (event.target instanceof Element) {
      const direct = event.target.closest('disco-combo-box-item');
      if (direct && this.contains(direct)) return direct;
    }
    const path = event.composedPath?.() || [];
    const found = path.find((node) => node instanceof HTMLElement && node.tagName === 'DISCO-COMBO-BOX-ITEM');
    if (found) return found;
    return null;
  }

  _log(message, detail = {}) {
    if (!this._debug) return;
    console.log('[disco-combo-box]', message, detail);
  }

  _updateAria() {
    this._combo.setAttribute('aria-expanded', this._open ? 'true' : 'false');
  }
}

customElements.define('disco-combo-box', DiscoComboBox);

export default DiscoComboBox;
