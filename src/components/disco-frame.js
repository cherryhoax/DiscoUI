import DiscoUIElement from './disco-ui-element.js';
import frameStyles from './disco-frame.scss';

/**
 * Frame container for Disco UI pages. Manages navigation history and page transitions.
 * @extends DiscoUIElement
 */
class DiscoFrame extends DiscoUIElement {
  constructor() {
    super();
    this.loadStyle(frameStyles);
    this.history = [];
    this.historyIndex = -1;
    this._historyKey = this.getAttribute('history-key') || `disco-frame-${DiscoFrame._nextId++}`;
    this._historyEnabled = !this.hasAttribute('disable-history');
    this._onPopState = this._onPopState.bind(this);
    this._historyListenerAttached = false;
  }

  connectedCallback() {
    if (this._historyEnabled && !this._historyListenerAttached && typeof window !== 'undefined') {
      window.addEventListener('popstate', this._onPopState);
      this._historyListenerAttached = true;
    }
  }

  disconnectedCallback() {
    if (this._historyListenerAttached && typeof window !== 'undefined') {
      window.removeEventListener('popstate', this._onPopState);
      this._historyListenerAttached = false;
    }
  }

  /**
   * @param {HTMLElement | null | undefined} page
   * @returns {Promise<void>}
   */
  async navigate(page) {
    if (!page) return;
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    await this._transitionTo(page, { direction: 'forward' });
    this.history.push(page);
    this.historyIndex = this.history.length - 1;
    this._pushHistoryState();
  }

  /**
   * @returns {Promise<void>}
   */
  async goBack() {
    if (this.historyIndex <= 0) return;
    if (this._historyEnabled && typeof window !== 'undefined') {
      window.history.back();
      return;
    }
    await this._navigateToIndex(this.historyIndex - 1, 'back', true);
  }

  async _transitionTo(page, options) {
    const current = /** @type {import('./disco-page.js').default | null} */ (
      this.history[this.historyIndex] || null
    );

    if (current && current !== page) {
      if (typeof current.animateOut === 'function') {
        await current.animateOut(options);
      }
      this._setPageVisibility(current, false);
    }

    if (!this.contains(page)) {
      this.appendChild(page);
    }
    this._setPageVisibility(page, true);
    this._hideInactivePages(page);

    const typedPage = /** @type {import('./disco-page.js').default} */ (page);
    if (typeof typedPage.animateIn === 'function') {
      await typedPage.animateIn(options);
    }
  }

  /**
   * @param {HTMLElement} page
   * @param {boolean} isVisible
   */
  _setPageVisibility(page, isVisible) {
    if (isVisible) {
      page.removeAttribute('hidden');
      page.removeAttribute('aria-hidden');
      if ('inert' in page) {
        page.inert = false;
      } else {
        page.removeAttribute('inert');
      }
      return;
    }

    page.setAttribute('hidden', '');
    page.setAttribute('aria-hidden', 'true');
    if ('inert' in page) {
      page.inert = true;
    } else {
      page.setAttribute('inert', '');
    }
  }

  /**
   * @param {HTMLElement} activePage
   */
  _hideInactivePages(activePage) {
    const children = Array.from(this.children);
    for (const child of children) {
      const typedChild = /** @type {import('./disco-page.js').default} */ (child);
      if (typeof typedChild.animateIn !== 'function' && typeof typedChild.animateOut !== 'function') continue;
      if (child === activePage) continue;
      this._setPageVisibility(child, false);
    }
  }

  async _navigateToIndex(targetIndex, direction, fromHistory) {
    const target = this.history[targetIndex];
    if (!target) return;
    await this._transitionTo(target, { direction });
    this.historyIndex = targetIndex;
    if (!fromHistory) {
      this._pushHistoryState();
    }
  }

  _pushHistoryState() {
    if (!this._historyEnabled || typeof window === 'undefined') return;
    try {
      window.history.pushState(
        { discoFrame: this._historyKey, index: this.historyIndex },
        '',
        window.location.href
      );
    } catch (error) {
      // Ignore history API failures (e.g., cross-origin restrictions).
    }
  }

  _onPopState(event) {
    const state = event?.state;
    if (!state || state.discoFrame !== this._historyKey) return;
    const targetIndex = Number(state.index);
    if (!Number.isFinite(targetIndex) || targetIndex < 0 || targetIndex >= this.history.length) return;
    const direction = targetIndex < this.historyIndex ? 'back' : 'forward';
    this._navigateToIndex(targetIndex, direction, true);
  }
}

DiscoFrame._nextId = 1;

customElements.define('disco-frame', DiscoFrame);

export default DiscoFrame;
