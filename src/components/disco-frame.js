import DiscoUIElement from './disco-ui-element.js';
import frameStyles from './disco-frame.scss';
import DiscoAnimations from './animations/disco-animations.js';

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
    this._predictiveActive = false;
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
   * Loads a page from an external HTML file and appends it to the frame (hidden).
   * Note: Scripts inside the loaded HTML will not be executed.
   * @param {string} path - URL to the HTML file
   * @param {object} [options]
   * @param {(page: HTMLElement) => void} [options.onLoad]
   * @param {(error: Error) => void} [options.onError]
   * @returns {Promise<HTMLElement>}
   */
  async loadPage(path, options = {}) {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
      }
      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Validation: Check for single root element
      // Filter out empty text nodes and comments to find real elements
      const elements = Array.from(doc.body.children).filter((node) => node.nodeType === Node.ELEMENT_NODE);

      if (elements.length !== 1) {
        throw new Error(`Page content at ${path} must have exactly one root element.`);
      }

      const page = /** @type {HTMLElement} */ (elements[0]);

      // Ensure it's hidden before appending
      this._setPageVisibility(page, false);

      this.appendChild(page);

      if (options.onLoad) {
        options.onLoad(page);
      }

      return page;
    } catch (error) {
      if (options.onError) {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
      throw error;
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

  /**
   * @param {number} t
   * @returns {Promise<void>}
   */
  async predictiveBackProgress(t) {
    if (this.historyIndex <= 0) return;
    const current = this.history[this.historyIndex];
    const previous = this.history[this.historyIndex - 1];
    if (!current || !previous) return;

    this._predictiveActive = true;
    if (!this.contains(previous)) {
      if (current && this.contains(current)) {
        this.insertBefore(previous, current);
      } else {
        this.appendChild(previous);
      }
    } else if (current && previous.nextSibling !== current) {
      this.insertBefore(previous, current);
    }
    if (DiscoAnimations?.animationSet?.page?.prepare) {
      DiscoAnimations.animationSet.page.prepare(previous);
    }
    this._setPageVisibility(previous, true);
    if (typeof current.animateOut === 'function') {
      await DiscoAnimations.animationSet.page.predictiveOut(current, t);
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async predictiveBackCancel() {
    if (!this._predictiveActive) return;
    const current = this.history[this.historyIndex];
    const previous = this.history[this.historyIndex - 1];
    this._predictiveActive = false;
    if (current && typeof current.animateIn === 'function') {
      await current.animateIn({ direction: 'back' });
    }
    if (previous) {
      this._setPageVisibility(previous, false);
    }
  }

  /**
   * @returns {Promise<boolean>} true if history handled, false if no history
   */
  async predictiveBackCommit() {
    const current = this.history[this.historyIndex];
    const previous = this.history[this.historyIndex - 1];
    if (!current) return false;

    await DiscoAnimations.animationSet.page.predictiveOut(current, 1, true);
    this._predictiveActive = false;

    if (!previous) {
      return false;
    }

    this._setPageVisibility(current, false);
    if (DiscoAnimations?.animationSet?.page?.prepare) {
      DiscoAnimations.animationSet.page.prepare(previous);
    }
    this._setPageVisibility(previous, true);
    this._hideInactivePages(previous);
    this.historyIndex = Math.max(0, this.historyIndex - 1);
    if (typeof previous.animateIn === 'function') {
      await previous.animateIn({ direction: 'back' });
    }
    return true;
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
