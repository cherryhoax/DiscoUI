import DiscoLoopingSelector from '../looping-selector/disco-looping-selector.js';
import timeSpanPickerCss from './disco-timespan-picker.scss';
import '../app-bar/disco-app-bar.js';
import '../app-bar/disco-app-bar-icon-button.js';

/**
 * Time span picker built on top of DiscoLoopingSelector.
 * @extends DiscoLoopingSelector
 */
class DiscoTimeSpanPicker extends DiscoLoopingSelector {
  /**
   * @param {string} [title]
   * @param {string} [value]
   * @param {{ max?: string, min?: string, step?: { m?: number, s?: number }, showSeconds?: boolean }} [options]
   */
  constructor(title = 'DURATION', value = '00:00:00', options = {}) {
    super(title, title);

    this.loadStyle(timeSpanPickerCss, this.shadowRoot);

    const safeOptions = options || {};

    this._step = this._normalizeStep(safeOptions.step);
    this._showSeconds = Boolean(safeOptions.showSeconds);

    this._minTotal = this._parseDurationToTotal(safeOptions.min, 0);
    this._maxTotal = this._parseDurationToTotal(safeOptions.max, (23 * 3600) + (59 * 60) + 59);
    if (this._minTotal > this._maxTotal) {
      const swap = this._minTotal;
      this._minTotal = this._maxTotal;
      this._maxTotal = swap;
    }

    const initialTotal = this._parseDurationToTotal(value, 0);
    this._selectedTotal = this._normalizeToStep(this._clampTotal(initialTotal));

    this._hourItems = [];
    this._minuteItems = [];
    this._secondItems = [];
    this._hourValues = [];
    this._minuteValues = [];
    this._secondValues = [];

    this._initSliderPicker(['hour', 'minute', 'second']);
    this._resolveSelection = null;
    this._openPromise = null;
    this._skipResolveOnClose = false;

    this._buildContent();
    this._buildAppBar();
    this._applyVisibility();
    this._buildItems();
    this._syncToDuration(this._selectedTotal);
  }

  connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => this._syncToDuration(this._selectedTotal));
  }

  /**
   * @returns {Promise<string | null>}
   */
  open() {
    if (this._openPromise) return this._openPromise;

    this._openPromise = new Promise((resolve) => {
      this._resolveSelection = resolve;
    });

    this.show().then(() => {
      this._resetSliderInteractionState();
      requestAnimationFrame(() => this._syncToDuration(this._selectedTotal));
    });

    return this._openPromise;
  }

  /**
   * @returns {Promise<void>}
   */
  async close(options) {
    if (this._resolveSelection && !this._skipResolveOnClose) {
      this._resolveOnce(null);
    }
    this._skipResolveOnClose = false;
    await super.close(options);
  }

  _resolveOnce(value) {
    if (!this._resolveSelection) return;
    const resolver = this._resolveSelection;
    this._resolveSelection = null;
    this._openPromise = null;
    resolver(value);
  }

  get title() {
    return this.header || 'DURATION';
  }

  set title(val) {
    const next = typeof val === 'string' && val.trim() ? val.trim() : 'DURATION';
    this.appTitle = next;
    this.header = next;
    this.setAttribute('app-title', next);
    this.setAttribute('header', next);
    if (this._appTitleEl) this._appTitleEl.textContent = next;
  }

  get value() {
    return this._formatDuration(this._selectedTotal);
  }

  set value(val) {
    const parsed = this._parseDurationToTotal(val, 0);
    this._selectedTotal = this._normalizeToStep(this._clampTotal(parsed));
    this._syncToDuration(this._selectedTotal);
  }

  get min() {
    return this._formatDuration(this._minTotal);
  }

  set min(val) {
    const parsed = this._parseDurationToTotal(val, 0);
    this._minTotal = Math.max(0, Math.min(parsed, (23 * 3600) + (59 * 60) + 59));
    if (this._minTotal > this._maxTotal) this._maxTotal = this._minTotal;
    this._selectedTotal = this._normalizeToStep(this._clampTotal(this._selectedTotal));
    this._buildItems();
    this._syncToDuration(this._selectedTotal);
  }

  get max() {
    return this._formatDuration(this._maxTotal);
  }

  set max(val) {
    const parsed = this._parseDurationToTotal(val, (23 * 3600) + (59 * 60) + 59);
    this._maxTotal = Math.max(0, Math.min(parsed, (23 * 3600) + (59 * 60) + 59));
    if (this._maxTotal < this._minTotal) this._minTotal = this._maxTotal;
    this._selectedTotal = this._normalizeToStep(this._clampTotal(this._selectedTotal));
    this._buildItems();
    this._syncToDuration(this._selectedTotal);
  }

  get step() {
    return { ...this._step };
  }

  set step(val) {
    this._step = this._normalizeStep(val);
    this._selectedTotal = this._normalizeToStep(this._selectedTotal);
    this._buildItems();
    this._syncToDuration(this._selectedTotal);
  }

  get showSeconds() {
    return this._showSeconds;
  }

  set showSeconds(val) {
    const next = Boolean(val);
    if (next === this._showSeconds) return;
    this._showSeconds = next;
    this._applyVisibility();
    this._selectedTotal = this._normalizeToStep(this._selectedTotal);
    this._buildItems();
    this._syncToDuration(this._selectedTotal);
  }

  _buildContent() {
    if (!this._contentViewport) return;

    this._contentViewport.innerHTML = '';
    this._contentViewport.classList.add('timespan-picker-viewport');

    this._columnsEl = document.createElement('div');
    this._columnsEl.className = 'timespan-picker-columns';

    this._hourColumn = this._createColumn('hour');
    this._minuteColumn = this._createColumn('minute');
    this._secondColumn = this._createColumn('second');

    this._columnsEl.appendChild(this._hourColumn);
    this._columnsEl.appendChild(this._minuteColumn);
    this._columnsEl.appendChild(this._secondColumn);

    this._contentViewport.appendChild(this._columnsEl);
  }

  _buildAppBar() {
    if (this._appBar) return;
    const appBar = document.createElement('disco-app-bar');
    appBar.innerHTML = `
      <disco-app-bar-icon-button icon="done" label="done"></disco-app-bar-icon-button>
      <disco-app-bar-icon-button icon="cross" label="cancel"></disco-app-bar-icon-button>
    `;

    const done = appBar.querySelector('disco-app-bar-icon-button[icon="done"]');
    if (done) done.addEventListener('click', () => this._confirmSelection());

    const cancel = appBar.querySelector('disco-app-bar-icon-button[icon="cross"]');
    if (cancel) cancel.addEventListener('click', () => this._cancelSelection());

    this.appendChild(appBar);
    this._appBar = appBar;
  }

  _confirmSelection() {
    this._skipResolveOnClose = true;
    this._resolveOnce(this.value);
    this.close();
  }

  _cancelSelection() {
    this._skipResolveOnClose = true;
    this._resolveOnce(null);
    this.close();
  }

  _createColumn(kind) {
    const column = document.createElement('div');
    column.className = 'timespan-picker-column';
    column.dataset.column = kind;

    const view = document.createElement('disco-looping-selector-flip-view');
    view.className = 'timespan-picker-view';
    view.setAttribute('direction', 'vertical');
    view.setAttribute('overscroll-mode', 'loop');
    view.setAttribute('css-prefix', 'timespan-picker');

    view.addEventListener('pointerdown', () => this._markUserInteraction(kind));
    view.addEventListener('scroll', () => this._onScroll(kind), { passive: true });
    view.addEventListener('scroll-end', () => this._onScrollEnd(kind));
    view.addEventListener('disco-snap-target', (e) => this._onSnap(kind, e));

    column.appendChild(view);

    if (kind === 'hour') this._hourView = view;
    if (kind === 'minute') this._minuteView = view;
    if (kind === 'second') this._secondView = view;

    this._registerSliderKind(kind, { column, view });
    return column;
  }

  _applyVisibility() {
    this.setAttribute('data-show-seconds', String(this._showSeconds));
    if (this._secondColumn) {
      this._secondColumn.toggleAttribute('data-hidden', !this._showSeconds);
    }
  }

  _buildItems() {
    this._buildHourItems();
    this._buildMinuteItems();
    this._buildSecondItems();
  }

  _buildHourItems() {
    if (!this._hourView) return;
    const items = [];
    const values = [];
    for (let hour = 0; hour <= 23; hour += 1) {
      const text = String(hour).padStart(2, '0');
      const item = this._createItem(text);
      item.dataset.index = String(items.length);
      item.dataset.value = String(hour);
      items.push(item);
      values.push(hour);
    }
    this._hourItems = items;
    this._hourValues = values;
    this._registerSliderKind('hour', { items, values });
    this._populateView(this._hourView, items, 'hour');
    this._updateLoopingForView(this._hourView, 'hour', items.length);
  }

  _buildMinuteItems() {
    if (!this._minuteView) return;
    const items = [];
    const values = [];
    for (let minute = 0; minute < 60; minute += this._step.m) {
      const text = String(minute).padStart(2, '0');
      const item = this._createItem(text);
      item.dataset.index = String(items.length);
      item.dataset.value = String(minute);
      items.push(item);
      values.push(minute);
    }
    this._minuteItems = items;
    this._minuteValues = values;
    this._registerSliderKind('minute', { items, values });
    this._populateView(this._minuteView, items, 'minute');
    this._updateLoopingForView(this._minuteView, 'minute', items.length);
  }

  _buildSecondItems() {
    if (!this._secondView) return;
    const items = [];
    const values = [];
    for (let second = 0; second < 60; second += this._step.s) {
      const text = String(second).padStart(2, '0');
      const item = this._createItem(text);
      item.dataset.index = String(items.length);
      item.dataset.value = String(second);
      items.push(item);
      values.push(second);
    }
    this._secondItems = items;
    this._secondValues = values;
    this._registerSliderKind('second', { items, values });
    this._populateView(this._secondView, items, 'second');
    this._updateLoopingForView(this._secondView, 'second', items.length);
  }

  _populateView(view, items, kind) {
    if (!view) return;
    view.innerHTML = '';
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const idx = Number(item.dataset.index || 0);
        this._markUserInteraction(kind);
        this._scrollSliderToIndex(kind, idx);
        this._pendingIndex[kind] = idx;
        this._setScrolling(kind, true);
      });
      view.appendChild(item);
    });

    if (typeof view._updateChildrenLayout === 'function') view._updateChildrenLayout();
  }

  _createItem(primaryText) {
    const item = document.createElement('div');
    item.className = 'timespan-picker-item';

    const primary = document.createElement('div');
    primary.className = 'timespan-picker-primary';
    primary.textContent = primaryText;

    const secondary = document.createElement('div');
    secondary.className = 'timespan-picker-secondary';
    secondary.textContent = '';

    item.appendChild(primary);
    item.appendChild(secondary);
    return item;
  }

  _onSliderCommit(kind, value) {
    if (kind === 'hour') {
      this._updateDurationParts({ hour: value });
      return;
    }
    if (kind === 'minute') {
      this._updateDurationParts({ minute: value });
      return;
    }
    if (kind === 'second') {
      this._updateDurationParts({ second: value });
    }
  }

  _updateDurationParts({ hour, minute, second }) {
    const current = this._partsFromTotal(this._selectedTotal);
    const nextHour = hour != null ? hour : current.hour;
    const nextMinute = minute != null ? minute : current.minute;
    let nextSecond = second != null ? second : current.second;

    if (!this._showSeconds) {
      nextSecond = 0;
    }

    const total = this._totalFromParts(nextHour, nextMinute, nextSecond);
    this._selectedTotal = this._normalizeToStep(this._clampTotal(total));
    this._syncToDuration(this._selectedTotal, {
      hour: hour != null,
      minute: minute != null,
      second: second != null || !this._showSeconds
    });
  }

  _syncToDuration(total, sync = { hour: true, minute: true, second: true }) {
    this._isSyncing = true;

    const parts = this._partsFromTotal(total);
    const minuteValue = this._closestValue(parts.minute, this._minuteValues);
    const secondValue = this._closestValue(parts.second, this._secondValues);

    const hourIndex = this._hourValues.indexOf(parts.hour);
    const minuteIndex = this._minuteValues.indexOf(minuteValue);
    const secondIndex = this._secondValues.indexOf(secondValue);

    this._hourIndex = hourIndex >= 0 ? hourIndex : 0;
    this._minuteIndex = minuteIndex >= 0 ? minuteIndex : 0;
    this._secondIndex = secondIndex >= 0 ? secondIndex : 0;

    if (sync.hour && this._hourView) this._scrollToIndex(this._hourView, this._hourIndex);
    if (sync.minute && this._minuteView) this._scrollToIndex(this._minuteView, this._minuteIndex);
    if (sync.second && this._secondView) this._scrollToIndex(this._secondView, this._secondIndex);

    this._updateSelectedStates();
    this._isSyncing = false;
  }

  _updateLoopingForView(view, _kind, count) {
    if (!view) return;
    const update = () => {
      const size = typeof view._getPageSize === 'function' ? view._getPageSize() : (view.clientHeight || 1);
      const height = view.clientHeight || 1;
      const canLoop = count * size > height + 1;
      view.setAttribute('overscroll-mode', canLoop ? 'loop' : 'none');
    };

    requestAnimationFrame(() => requestAnimationFrame(update));
  }

  _updateSelectedStates() {
    this._setSelectedIndex(this._hourItems, this._hourIndex);
    this._setSelectedIndex(this._minuteItems, this._minuteIndex);
    this._setSelectedIndex(this._secondItems, this._secondIndex);
  }

  _setSelectedIndex(items, index) {
    items.forEach((item, i) => {
      item.toggleAttribute('data-selected', i === index);
    });
  }

  _normalizeStep(step) {
    const safe = step || {};
    const minute = Number(safe.m);
    const second = Number(safe.s);
    const m = Number.isFinite(minute) ? Math.min(59, Math.max(1, Math.round(minute))) : 1;
    const s = Number.isFinite(second) ? Math.min(59, Math.max(1, Math.round(second))) : 1;
    return { m, s };
  }

  _parseDurationToTotal(value, fallback = 0) {
    if (typeof value !== 'string') return fallback;
    const match = value.trim().match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (!match) return fallback;

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    const second = Number(match[3]);

    if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(second)) return fallback;
    if (hour < 0 || hour > 23) return fallback;
    if (minute < 0 || minute > 59) return fallback;
    if (second < 0 || second > 59) return fallback;

    return this._totalFromParts(hour, minute, second);
  }

  _clampTotal(total) {
    return Math.min(this._maxTotal, Math.max(this._minTotal, total));
  }

  _normalizeToStep(total) {
    const parts = this._partsFromTotal(total);
    const minute = this._closestValue(parts.minute, this._buildStepValues(this._step.m));
    const second = this._showSeconds
      ? this._closestValue(parts.second, this._buildStepValues(this._step.s))
      : 0;
    const normalized = this._totalFromParts(parts.hour, minute, second);
    return this._clampTotal(normalized);
  }

  _buildStepValues(step) {
    const values = [];
    for (let value = 0; value < 60; value += step) {
      values.push(value);
    }
    if (!values.length) values.push(0);
    return values;
  }

  _closestValue(value, values) {
    if (!values || !values.length) return 0;
    let best = values[0];
    let bestDistance = Math.abs(value - best);

    values.forEach((candidate) => {
      const distance = Math.abs(value - candidate);
      if (distance < bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    });

    return best;
  }

  _partsFromTotal(total) {
    const safe = Math.max(0, Math.min(total, (23 * 3600) + (59 * 60) + 59));
    const hour = Math.floor(safe / 3600);
    const minute = Math.floor((safe % 3600) / 60);
    const second = safe % 60;
    return { hour, minute, second };
  }

  _totalFromParts(hour, minute, second) {
    return (hour * 3600) + (minute * 60) + second;
  }

  _formatDuration(total) {
    const { hour, minute, second } = this._partsFromTotal(total);
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }

  getFlipClone() {
    if (!this._root) return null;

    const rootClone = this._root.cloneNode(true);
    const viewport = rootClone.querySelector('.content-viewport');
    if (!viewport) return rootClone;

    viewport.innerHTML = '';

    const columnsEl = document.createElement('div');
    columnsEl.className = 'timespan-picker-columns';

    const addColumn = (kind, item) => {
      if (!item) return;
      const col = document.createElement('div');
      col.className = 'timespan-picker-column';
      col.dataset.column = kind;

      const view = document.createElement('div');
      view.className = 'timespan-picker-view';
      view.style.position = 'relative';
      view.style.overflow = 'hidden';
      view.style.height = '100%';
      view.style.width = '100%';

      const clone = item.cloneNode(true);
      clone.setAttribute('data-selected', 'true');
      clone.style.position = 'absolute';
      clone.style.top = '50%';
      clone.style.left = '0';
      clone.style.width = '100%';
      clone.style.transform = 'translateY(-50%)';

      view.appendChild(clone);
      col.appendChild(view);
      columnsEl.appendChild(col);
    };

    addColumn('hour', this._hourItems[this._hourIndex]);
    addColumn('minute', this._minuteItems[this._minuteIndex]);
    if (this._showSeconds) {
      addColumn('second', this._secondItems[this._secondIndex]);
    }

    viewport.appendChild(columnsEl);
    return rootClone;
  }
}

customElements.define('disco-timespan-picker', DiscoTimeSpanPicker);

export default DiscoTimeSpanPicker;
