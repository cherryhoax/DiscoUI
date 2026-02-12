import DiscoPickerBox from '../picker-box/disco-picker-box.js';
import sliderPickerCss from './disco-slider-picker.scss';

/**
 * Base class for "wheel/slider" pickers made of one or more scrollable columns.
 *
 * Responsibilities:
 * - Track which column the user is interacting with.
 * - Manage scroll/snap events and commit the selected index.
 * - Provide helpers to programmatically scroll to an index with scroll-event suppression.
 *
 * Subclasses are expected to:
 * - Register columns/views via `_registerSliderKind()`.
 * - Provide values per kind (either via `_registerSliderKind({ values })` or override `_getSliderValues`).
 * - Implement `_onSliderCommit(kind, value, normalizedIndex, rawIndex)`.
 *
 * @extends DiscoPickerBox
 */
class DiscoSliderPicker extends DiscoPickerBox {
  /**
   * @param {string} [appTitle]
   * @param {string} [header]
   */
  constructor(appTitle = 'DISCO APP', header = 'PICKER') {
    super(appTitle, header);

    this.loadStyle(sliderPickerCss, this.shadowRoot);

    /** @type {string[]} */
    this._sliderKinds = [];

    /** @type {Map<string, HTMLElement>} */
    this._sliderColumns = new Map();

    /** @type {Map<string, HTMLElement>} */
    this._sliderViews = new Map();

    /** @type {Map<string, HTMLElement[]>} */
    this._sliderItems = new Map();

    /** @type {Map<string, any[]>} */
    this._sliderValues = new Map();

    this._isSyncing = false;
    this._activeColumn = null;

    /** @type {Record<string, number | null>} */
    this._pendingIndex = {};

    /** @type {Record<string, number | null>} */
    this._scrollStopTimers = {};

    /** @type {Record<string, number>} */
    this._suppressScroll = {};

    this._hasUserInteracted = false;
    this._lastInteractedKind = null;
  }

  /**
   * Initialize slider internal state for a list of kinds.
   * @param {string[]} kinds
   */
  _initSliderPicker(kinds) {
    const list = Array.isArray(kinds) ? kinds : [];
    list.forEach((kind) => this._ensureSliderStateForKind(kind));
  }

  /**
   * @param {string} kind
   * @param {{ column?: HTMLElement, view?: HTMLElement, items?: HTMLElement[], values?: any[] }} [config]
   */
  _registerSliderKind(kind, config = {}) {
    if (!kind) return;
    this._ensureSliderStateForKind(kind);

    const { column, view, items, values } = config;
    if (column) this._sliderColumns.set(kind, column);
    if (view) this._sliderViews.set(kind, view);
    if (items) this._sliderItems.set(kind, items);
    if (values) this._sliderValues.set(kind, values);
  }

  /**
   * @param {string} kind
   */
  _ensureSliderStateForKind(kind) {
    if (!this._sliderKinds.includes(kind)) this._sliderKinds.push(kind);
    if (!(kind in this._pendingIndex)) this._pendingIndex[kind] = null;
    if (!(kind in this._scrollStopTimers)) this._scrollStopTimers[kind] = null;
    if (!(kind in this._suppressScroll)) this._suppressScroll[kind] = 0;
  }

  _resetSliderInteractionState() {
    this._activeColumn = null;
    this._hasUserInteracted = false;
    this._lastInteractedKind = null;

    this._sliderKinds.forEach((kind) => {
      const timer = this._scrollStopTimers[kind];
      if (timer) clearTimeout(timer);
      this._scrollStopTimers[kind] = null;
      this._pendingIndex[kind] = null;
      this._setScrolling(kind, false);
    });

    for (const col of this._sliderColumns.values()) {
      if (col) col.removeAttribute('data-expanded');
      if (col) col.removeAttribute('data-scrolling');
    }
  }

  /**
   * @param {string} kind
   */
  _markUserInteraction(kind) {
    const prevKind = this._activeColumn;
    if (prevKind && prevKind !== kind) {
      this._commitKindOnSwitch(prevKind);
    }
    this._hasUserInteracted = true;
    this._lastInteractedKind = kind;
    this._setActiveColumn(kind);
  }

  /**
   * Commit and clear a kind when the user switches focus to another kind.
   * This avoids leaving the previous column stuck in "scrolling" state
   * when its scroll-end/snap events are ignored due to lastInteractedKind changing.
   * @param {string} kind
   */
  _commitKindOnSwitch(kind) {
    this._ensureSliderStateForKind(kind);

    const timer = this._scrollStopTimers[kind];
    if (timer) {
      clearTimeout(timer);
      this._scrollStopTimers[kind] = null;
    }

    const column = this._getSliderColumn(kind);
    const wasScrolling = Boolean(column && column.hasAttribute('data-scrolling'));
    const hadPending = this._pendingIndex[kind] != null;

    if (!this._isSyncing && !this._suppressScroll[kind] && (wasScrolling || hadPending)) {
      this._commitPendingSelection(kind);
      return;
    }

    this._pendingIndex[kind] = null;
    this._setScrolling(kind, false);
  }

  /**
   * @param {string} kind
   */
  _setActiveColumn(kind) {
    if (this._activeColumn === kind) return;
    this._activeColumn = kind;

    for (const [k, col] of this._sliderColumns.entries()) {
      if (!col) continue;
      col.toggleAttribute('data-expanded', k === kind);
    }
  }

  /**
   * @param {string} kind
   * @param {boolean} isScrolling
   */
  _setScrolling(kind, isScrolling) {
    const column = this._sliderColumns.get(kind);
    if (!column) return;
    column.toggleAttribute('data-scrolling', Boolean(isScrolling));
  }

  /**
   * @param {string} kind
   */
  _onScroll(kind) {
    if (this._isSyncing || this._suppressScroll[kind]) return;
    if (!this._hasUserInteracted || this._lastInteractedKind !== kind) return;
    this._setActiveColumn(kind);
    this._setScrolling(kind, true);
    this._pendingIndex[kind] = null;
  }

  /**
   * @param {string} kind
   */
  _onScrollEnd(kind) {
    if (this._isSyncing || this._suppressScroll[kind]) return;
    if (!this._hasUserInteracted || this._lastInteractedKind !== kind) return;
    this._setScrolling(kind, false);
    this._commitPendingSelection(kind);
  }

  /**
   * @param {string} kind
   * @param {CustomEvent} e
   */
  _onSnap(kind, e) {
    if (this._isSyncing) return;
    if (!this._hasUserInteracted || this._lastInteractedKind !== kind) return;
    const detail = /** @type {{ index?: number }} */ (e.detail || {});
    const idx = Number(detail.index || 0);
    this._setActiveColumn(kind);
    this._pendingIndex[kind] = idx;
  }

  /**
   * @param {string} kind
   * @param {number | null | undefined} idx
   */
  _scheduleCommit(kind, idx) {
    if (idx != null && Number.isFinite(idx)) {
      this._pendingIndex[kind] = idx;
    } else {
      this._pendingIndex[kind] = null;
    }

    const prevTimer = this._scrollStopTimers[kind];
    if (prevTimer) {
      clearTimeout(prevTimer);
    }

    this._scrollStopTimers[kind] = setTimeout(() => {
      this._scrollStopTimers[kind] = null;
      this._commitPendingSelection(kind);
    }, 100);
  }

  /**
   * Called when scrolling stops and a selection should be committed.
   * Subclasses implement `_onSliderCommit` to map the selection to their value model.
   * @param {string} kind
   */
  _commitPendingSelection(kind) {
    this._setScrolling(kind, false);
    const view = this._getSliderView(kind);
    if (!view) return;

    let idx = this._pendingIndex[kind];
    this._pendingIndex[kind] = null;

    if (idx == null || !Number.isFinite(idx)) {
      const size = typeof view._getPageSize === 'function' ? view._getPageSize() : (view.clientHeight || 1);
      const rawIdx = size > 0 ? Math.round(view.scrollTop / size) : 0;
      idx = rawIdx;
    }

    const values = this._getSliderValues(kind) || [];
    const normalizedIndex = this._normalizeIndex(idx, values.length);
    const value = values[normalizedIndex];
    if (value == null) return;

    if (typeof this._onSliderCommit === 'function') {
      this._onSliderCommit(kind, value, normalizedIndex, idx);
    }
  }

  /**
   * Hook for subclasses.
   * @param {string} _kind
   * @param {any} _value
   * @param {number} _normalizedIndex
   * @param {number} _rawIndex
   */
  // eslint-disable-next-line no-unused-vars
  _onSliderCommit(_kind, _value, _normalizedIndex, _rawIndex) {}

  /**
   * @param {string} kind
   * @returns {HTMLElement | null}
   */
  _getSliderView(kind) {
    return this._sliderViews.get(kind) || null;
  }

  /**
   * @param {string} kind
   * @returns {HTMLElement | null}
   */
  _getSliderColumn(kind) {
    return this._sliderColumns.get(kind) || null;
  }

  /**
   * @param {string} kind
   * @returns {HTMLElement[]}
   */
  _getSliderItems(kind) {
    return this._sliderItems.get(kind) || [];
  }

  /**
   * @param {string} kind
   * @returns {any[]}
   */
  _getSliderValues(kind) {
    return this._sliderValues.get(kind) || [];
  }

  /**
   * @param {HTMLElement} view
   * @returns {string | null}
   */
  _getSliderKindForView(view) {
    for (const [kind, v] of this._sliderViews.entries()) {
      if (v === view) return kind;
    }
    return null;
  }

  /**
   * Scroll a view to the given index while suppressing scroll handlers.
   * @param {HTMLElement} view
   * @param {number} index
   */
  _scrollToIndex(view, index) {
    const size = typeof view._getPageSize === 'function' ? view._getPageSize() : (view.clientHeight || 1);
    const kind = this._getSliderKindForView(view);
    if (kind) {
      this._suppressScroll[kind] += 1;
      setTimeout(() => {
        this._suppressScroll[kind] = Math.max(0, this._suppressScroll[kind] - 1);
      }, 100);
    }
    view.scrollTop = index * size;
  }

  /**
   * @param {string} kind
   * @param {number} index
   */
  _scrollSliderToIndex(kind, index) {
    const view = this._getSliderView(kind);
    if (!view) return;
    this._scrollToIndex(view, index);
  }

  /**
   * @param {number} idx
   * @param {number} count
   * @returns {number}
   */
  _normalizeIndex(idx, count) {
    if (count <= 0) return 0;
    return ((idx % count) + count) % count;
  }
}

customElements.define('disco-slider-picker', DiscoSliderPicker);

export default DiscoSliderPicker;
