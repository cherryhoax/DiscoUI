import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import contextMenuCss from './disco-context-menu.scss';

/**
 * @typedef {{
 *  id?: string,
 *  label: string,
 *  value?: unknown,
 *  disabled?: boolean,
 *  danger?: boolean,
 *  action?: (item: DiscoContextMenuItem, menu: DiscoContextMenu) => unknown | Promise<unknown>
 * }} DiscoContextMenuItem
 */

class DiscoContextMenu extends DiscoUIElement {
  /**
   * @param {DiscoContextMenuItem[]} [items]
   * @param {{ backgroundRoot?: HTMLElement | null }} [options]
   */
  constructor(items = [], options = {}) {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(contextMenuCss, this.shadowRoot);

    this._items = [];
    this._target = null;
    this._anchorClone = null;
    this._openPromise = null;
    this._resolveSelection = null;
    this._isClosing = false;
    this._skipResolveOnClose = false;
    this._backgroundRoot = options?.backgroundRoot || null;
    this._savedBackgroundStyle = null;
    this._savedTargetVisibility = null;
    this._pushedState = false;

    this._root = document.createElement('div');
    this._root.className = 'context-root';

    this._backdrop = document.createElement('div');
    this._backdrop.className = 'context-backdrop';
    this._backdrop.addEventListener('click', () => this.close());

    this._anchorLayer = document.createElement('div');
    this._anchorLayer.className = 'context-anchor-layer';

    this._menu = document.createElement('div');
    this._menu.className = 'context-menu';
    this._menu.setAttribute('role', 'menu');

    this._root.append(this._backdrop, this._anchorLayer, this._menu);
    this.shadowRoot.appendChild(this._root);

    this.setItems(items);
  }

  /**
   * @param {DiscoContextMenuItem[]} items
   */
  setItems(items = []) {
    this._items = Array.isArray(items) ? items : [];
    this._renderItems();
  }

  /**
   * @param {HTMLElement} target
   * @param {{ items?: DiscoContextMenuItem[], backgroundRoot?: HTMLElement | null }} [options]
   * @returns {Promise<unknown | null>}
   */
  openFor(target, options = {}) {
    if (!(target instanceof HTMLElement)) {
      return Promise.resolve(null);
    }

    if (this._openPromise) return this._openPromise;
    if (options.items) this.setItems(options.items);

    this._target = target;
    this._pointerX = Number.isFinite(options.pointerX) ? options.pointerX : null;
    this._backgroundRoot = options.backgroundRoot || this._backgroundRoot || this._resolveBackgroundRoot(target);

    this._openPromise = new Promise((resolve) => {
      this._resolveSelection = resolve;
    });

    this._show();
    return this._openPromise;
  }

  /**
   * @param {{ fromPopState?: boolean }} [options]
   * @returns {Promise<void>}
   */
  async close(options = {}) {
    if (this._isClosing) return;
    this._isClosing = true;

    if (this._resolveSelection && !this._skipResolveOnClose) {
      this._resolveOnce(null);
    }
    this._skipResolveOnClose = false;

    this._root.classList.remove('open');
    this._root.classList.add('closing');

    await new Promise((resolve) => setTimeout(resolve, 190));

    this._removeListeners();
    this._restoreTargetVisibility();
    this._restoreBackground();
    this._anchorLayer.replaceChildren();
    this._anchorClone = null;

    if (this.parentNode) this.remove();

    const fromPopState = Boolean(options?.fromPopState);
    if (this._pushedState && !fromPopState) {
      this._pushedState = false;
      window.history.back();
    }
    if (fromPopState) {
      this._pushedState = false;
    }

    this._openPromise = null;
    this._isClosing = false;
    this._target = null;
  }

  /**
   * @param {HTMLElement} target
   * @param {DiscoContextMenuItem[]} items
   * @param {{ backgroundRoot?: HTMLElement | null }} [options]
   * @returns {Promise<unknown | null>}
   */
  static openFor(target, items, options = {}) {
    const menu = new DiscoContextMenu(items, options);
    return menu.openFor(target, options);
  }

  /**
   * @param {HTMLElement} target
   * @param {(target: HTMLElement, event: Event) => DiscoContextMenuItem[] | Promise<DiscoContextMenuItem[]>} getItems
   * @param {{ trigger?: 'contextmenu' | 'longpress' | 'both', longPressMs?: number, backgroundRoot?: HTMLElement | null }} [options]
   * @returns {() => void}
   */
  static bind(target, getItems, options = {}) {
    if (!(target instanceof HTMLElement) || typeof getItems !== 'function') {
      return () => {};
    }

    const trigger = options.trigger || 'longpress';
    const longPressMs = Number(options.longPressMs) > 0 ? Number(options.longPressMs) : 460;

    let pressTimer = null;
    let startX = 0;
    let startY = 0;

    const open = async (event) => {
      const items = await getItems(target, event);
      if (!Array.isArray(items) || !items.length) return;
      event.preventDefault?.();
      await DiscoContextMenu.openFor(target, items, {
        backgroundRoot: options.backgroundRoot || null,
        pointerX: event?.clientX
      });
    };

    const contextMenuHandler = (event) => {
      if (trigger === 'longpress') return;
      open(event);
    };

    const clearPressTimer = () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    const pointerDownHandler = (event) => {
      if (trigger === 'contextmenu') return;
      startX = event.clientX;
      startY = event.clientY;
      clearPressTimer();
      pressTimer = setTimeout(() => {
        open(event);
        clearPressTimer();
      }, longPressMs);
    };

    const pointerMoveHandler = (event) => {
      if (!pressTimer) return;
      if (Math.hypot(event.clientX - startX, event.clientY - startY) > 8) {
        clearPressTimer();
      }
    };

    const pointerEndHandler = () => {
      clearPressTimer();
    };

    target.addEventListener('contextmenu', contextMenuHandler);
    target.addEventListener('pointerdown', pointerDownHandler);
    target.addEventListener('pointermove', pointerMoveHandler);
    target.addEventListener('pointerup', pointerEndHandler);
    target.addEventListener('pointercancel', pointerEndHandler);
    target.addEventListener('pointerleave', pointerEndHandler);

    return () => {
      clearPressTimer();
      target.removeEventListener('contextmenu', contextMenuHandler);
      target.removeEventListener('pointerdown', pointerDownHandler);
      target.removeEventListener('pointermove', pointerMoveHandler);
      target.removeEventListener('pointerup', pointerEndHandler);
      target.removeEventListener('pointercancel', pointerEndHandler);
      target.removeEventListener('pointerleave', pointerEndHandler);
    };
  }

  _show() {
    this._root.classList.remove('closing');
    this._root.classList.remove('pressing');
    this._root.classList.remove('open');
    this._root.classList.remove('open-up');

    if (!document.body.contains(this)) {
      document.body.appendChild(this);
    }

    this._createAnchorClone();
    this._applyBackgroundScale();
    this._positionMenu();

    this._popStateListener = () => {
      this._pushedState = false;
      this.close({ fromPopState: true });
    };

    window.history.pushState({ contextMenu: Math.random().toString(36) }, '', window.location.href);
    this._pushedState = true;
    window.addEventListener('popstate', this._popStateListener, { once: true });

    this._keydownListener = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.close();
      }
    };

    this._repositionListener = () => this._positionMenu();
    window.addEventListener('keydown', this._keydownListener, true);
    window.addEventListener('resize', this._repositionListener);
    window.addEventListener('scroll', this._repositionListener, true);

    requestAnimationFrame(() => {
      this._root.classList.add('pressing');
      this._pressTimeout = setTimeout(() => {
        this._root.classList.add('open');
      }, 230);
    });
  }

  _renderItems() {
    this._menu.innerHTML = '';

    this._items.forEach((item) => {
      if (!item || typeof item !== 'object') return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'context-menu-item';
      button.textContent = item.label || '';
      if (item.disabled) button.disabled = true;
      if (item.danger) button.setAttribute('data-danger', '');

      button.addEventListener('click', async () => {
        if (button.disabled) return;
        const defaultValue = item.value !== undefined
          ? item.value
          : (item.id !== undefined ? item.id : item.label);

        let result = defaultValue;
        if (typeof item.action === 'function') {
          result = await item.action(item, this);
        }

        if (result === false) return;
        this._confirmSelection(result === undefined ? defaultValue : result, item);
      });

      this._menu.appendChild(button);
    });
  }

  _createAnchorClone() {
    if (!(this._target instanceof HTMLElement)) return;

    this._restoreTargetVisibility();
    this._anchorLayer.replaceChildren();

    const rect = this._target.getBoundingClientRect();
    const clone = this._target.cloneNode(true);
    clone.classList.add('context-anchor-clone');
    clone.style.left = `${rect.left}px`;
    clone.style.top = `${rect.top}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;

    this._savedTargetVisibility = this._target.style.visibility;
    this._target.style.visibility = 'hidden';

    this._anchorClone = clone;
    this._anchorLayer.appendChild(clone);
  }

  _positionMenu() {
    if (!(this._target instanceof HTMLElement)) return;

    const anchorRect = this._target.getBoundingClientRect();
    const viewportPadding = 12;
    const itemCount = Math.max(1, this._items.length || 0);

    const collapsedItemHeight = Math.max(44, Math.min(56, Math.round(anchorRect.height || 48)));
    const openItemHeightBase = Math.round(collapsedItemHeight * 1.16);
    const openItemHeight = Math.max(collapsedItemHeight + 4, Math.min(64, openItemHeightBase));

    const menuPadding = Math.max(8, Math.min(16, Math.round(collapsedItemHeight * 0.25)));
    const menuItemPadding = Math.max(10, Math.min(14, Math.round(menuPadding)));
    const menuFontSize = Math.max(24, Math.min(32, Math.round(openItemHeight * 0.54)));

    let collapsedHeight = collapsedItemHeight + menuPadding * 2;
    let expandedHeight = (openItemHeight * itemCount) + menuPadding * 2;

    const maxExpanded = Math.max(collapsedHeight, window.innerHeight - viewportPadding * 2);
    if (expandedHeight > maxExpanded) {
      expandedHeight = maxExpanded;
      const fittedOpenItemHeight = Math.floor((expandedHeight - menuPadding * 2) / itemCount);
      const safeOpenItemHeight = Math.max(40, fittedOpenItemHeight);
      this._menu.style.setProperty('--menu-item-height-open', `${safeOpenItemHeight}px`);
    } else {
      this._menu.style.setProperty('--menu-item-height-open', `${openItemHeight}px`);
    }

    this._menu.style.setProperty('--menu-item-height-collapsed', `${collapsedItemHeight}px`);
    this._menu.style.setProperty('--menu-padding', `${menuPadding}px`);
    this._menu.style.setProperty('--menu-item-padding', `${menuItemPadding}px`);
    this._menu.style.setProperty('--menu-font-size', `${menuFontSize}px`);

    const canOpenDown = anchorRect.bottom + expandedHeight <= window.innerHeight - viewportPadding;
    this._root.classList.toggle('open-up', !canOpenDown);

    let top = canOpenDown ? anchorRect.bottom : anchorRect.top;

    if (canOpenDown && top + expandedHeight > window.innerHeight - viewportPadding) {
      top = window.innerHeight - expandedHeight - viewportPadding;
    }

    if (!canOpenDown && top - expandedHeight + collapsedHeight < viewportPadding) {
      top = expandedHeight - collapsedHeight + viewportPadding;
    }

    if (top < viewportPadding) top = viewportPadding;

    const width = Math.round(window.innerWidth);

    this._menu.style.left = `0px`;
    this._menu.style.top = `${Math.round(top)}px`;
    this._menu.style.width = `${Math.round(width)}px`;
    if (Number.isFinite(this._pointerX)) {
      this._menu.style.setProperty('--pointerX', `${Math.round(this._pointerX)}px`);
    } else {
      this._menu.style.setProperty('--pointerX', `${Math.round(anchorRect.left + (anchorRect.width / 2))}px`);
    }
    this._menu.style.setProperty('--menu-collapsed-height', `${collapsedHeight}px`);
    this._menu.style.setProperty('--menu-expanded-height', `${expandedHeight}px`);
    this._menu.style.transformOrigin = '50% 0%';

    if (this._anchorClone) {
      this._anchorClone.style.left = `${anchorRect.left}px`;
      this._anchorClone.style.top = `${anchorRect.top}px`;
      this._anchorClone.style.width = `${anchorRect.width}px`;
      this._anchorClone.style.height = `${anchorRect.height}px`;
    }
  }

  /**
   * @param {HTMLElement} target
   * @returns {HTMLElement | null}
   */
  _resolveBackgroundRoot(target) {
    return (
      target.closest('disco-page, disco-single-page, disco-pivot-page, disco-hub-page')
      || document.querySelector('disco-frame')
      || null
    );
  }

  _applyBackgroundScale() {
    const root = this._backgroundRoot;
    if (!(root instanceof HTMLElement) || !(this._target instanceof HTMLElement)) return;

    const targetRect = this._target.getBoundingClientRect();
    const originX = targetRect.left + targetRect.width / 2;
    const originY = targetRect.top + targetRect.height / 2;

    this._savedBackgroundStyle = {
      transition: root.style.transition,
      transformOrigin: root.style.transformOrigin,
      transform: root.style.transform,
      filter: root.style.filter,
      willChange: root.style.willChange
    };

    root.style.willChange = 'transform, filter';
    root.style.transition = 'transform 0.2s var(--disco-ease-out-circ, ease-out), filter 0.2s var(--disco-ease-out-circ, ease-out)';
    root.style.transformOrigin = `${originX}px ${originY}px`;
    root.style.transform = 'scale(0.94)';
    root.style.filter = 'opacity(0.38)';
  }

  _restoreBackground() {
    const root = this._backgroundRoot;
    if (!(root instanceof HTMLElement) || !this._savedBackgroundStyle) return;

    root.style.transition = this._savedBackgroundStyle.transition || '';
    root.style.transformOrigin = this._savedBackgroundStyle.transformOrigin || '';
    root.style.transform = this._savedBackgroundStyle.transform || '';
    root.style.filter = this._savedBackgroundStyle.filter || '';
    root.style.willChange = this._savedBackgroundStyle.willChange || '';
    this._savedBackgroundStyle = null;
  }

  _restoreTargetVisibility() {
    if (this._target instanceof HTMLElement) {
      if (this._savedTargetVisibility == null || this._savedTargetVisibility === '') {
        this._target.style.removeProperty('visibility');
      } else {
        this._target.style.visibility = this._savedTargetVisibility;
      }
    }
    this._savedTargetVisibility = null;
  }

  _removeListeners() {
    if (this._pressTimeout) {
      clearTimeout(this._pressTimeout);
      this._pressTimeout = null;
    }
    if (this._popStateListener) {
      window.removeEventListener('popstate', this._popStateListener);
      this._popStateListener = null;
    }
    if (this._keydownListener) {
      window.removeEventListener('keydown', this._keydownListener, true);
      this._keydownListener = null;
    }
    if (this._repositionListener) {
      window.removeEventListener('resize', this._repositionListener);
      window.removeEventListener('scroll', this._repositionListener, true);
      this._repositionListener = null;
    }
  }

  _resolveOnce(value) {
    if (!this._resolveSelection) return;
    const resolve = this._resolveSelection;
    this._resolveSelection = null;
    resolve(value);
  }

  _confirmSelection(value, item) {
    this.dispatchEvent(new CustomEvent('select', {
      bubbles: true,
      composed: true,
      detail: {
        value,
        item
      }
    }));

    this._skipResolveOnClose = true;
    this._resolveOnce(value);
    this.close();
  }
}

if (!customElements.get('disco-context-menu')) {
  customElements.define('disco-context-menu', DiscoContextMenu);
}

export default DiscoContextMenu;
