import DiscoPickerBox from '../picker-box/disco-picker-box.js';
import datePickerCss from './disco-date-picker.scss';
import './disco-date-picker-flip-view.js';
import '../app-bar/disco-app-bar.js';
import '../app-bar/disco-app-bar-icon-button.js';

const LIMIT_DAYS = 100_000_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEFAULT_MIN = new Date(-LIMIT_DAYS * MS_PER_DAY);
const DEFAULT_MAX = new Date(LIMIT_DAYS * MS_PER_DAY);

/**
 * Date picker built on top of DiscoPickerBox.
 * @extends DiscoPickerBox
 */
class DiscoDatePicker extends DiscoPickerBox {
  /**
   * @param {string} [title]
   * @param {Date} [initialDate]
   * @param {{ min?: Date, max?: Date, format?: string, locale?: string }} [options]
   */
  constructor(title = 'CHOOSE DATE', initialDate = new Date(), options = {}) {
    super(title, title);

    this.loadStyle(datePickerCss, this.shadowRoot);

    const safeOptions = options || {};
    this._locale = safeOptions.locale || (navigator.language || 'en-US');
    this._format = safeOptions.format || 'dd MMMM yyyy';
    this._minDate = safeOptions.min ? new Date(safeOptions.min) : new Date(DEFAULT_MIN);
    this._maxDate = safeOptions.max ? new Date(safeOptions.max) : new Date(DEFAULT_MAX);

    this._selectedDate = this._clampDate(initialDate || new Date());

    this._monthItems = [];
    this._dayItems = [];
    this._yearItems = [];

    this._isSyncing = false;
    this._activeColumn = null;
    this._pendingIndex = { month: null, day: null, year: null };
    this._scrollStopTimers = { month: null, day: null, year: null };
    this._suppressScroll = { month: 0, day: 0, year: 0 };
    this._hasUserInteracted = false;
    this._lastInteractedKind = null;
    this._resolveSelection = null;
    this._openPromise = null;
    this._skipResolveOnClose = false;

    this._buildContent();
    this._buildAppBar();
    this._applyFormat();
    this._syncToDate(this._selectedDate);
  }

  /**
   * @returns {Promise<Date | null>}
   */
  open() {
    if (this._openPromise) return this._openPromise;

    this._openPromise = new Promise((resolve) => {
      this._resolveSelection = resolve;
    });

    this.show().then(() => {
      // Reset any active column state so it opens clean
      this._activeColumn = null;
      this._hasUserInteracted = false;
      this._lastInteractedKind = null;
      [this._monthColumn, this._dayColumn, this._yearColumn].forEach((col) => {
        if (col) col.removeAttribute('data-expanded');
      });

      requestAnimationFrame(() => this._syncToDate(this._selectedDate));
    });

    return this._openPromise;
  }

  /**
   * @returns {Promise<void>}
   */
  async close() {
    if (this._resolveSelection && !this._skipResolveOnClose) {
      this._resolveOnce(null);
    }
    this._skipResolveOnClose = false;
    await super.close();
  }

  _resolveOnce(value) {
    if (!this._resolveSelection) return;
    const resolver = this._resolveSelection;
    this._resolveSelection = null;
    this._openPromise = null;
    resolver(value);
  }

  _buildContent() {
    if (!this._contentViewport) return;

    this._contentViewport.innerHTML = '';
    this._contentViewport.classList.add('date-picker-viewport');

    this._columnsEl = document.createElement('div');
    this._columnsEl.className = 'date-picker-columns';

    this._monthColumn = this._createColumn('month');
    this._dayColumn = this._createColumn('day');
    this._yearColumn = this._createColumn('year');

    this._columnsEl.appendChild(this._monthColumn);
    this._columnsEl.appendChild(this._dayColumn);
    this._columnsEl.appendChild(this._yearColumn);

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
    if (done) {
      done.addEventListener('click', () => this._confirmSelection());
    }

    const cancel = appBar.querySelector('disco-app-bar-icon-button[icon="cross"]');
    if (cancel) {
      cancel.addEventListener('click', () => this._cancelSelection());
    }

    this.appendChild(appBar);
    this._appBar = appBar;
  }

  _confirmSelection() {
    const date = new Date(this._selectedDate.getTime());
    this._skipResolveOnClose = true;
    this._resolveOnce(date);
    this.close();
  }

  _cancelSelection() {
    this._skipResolveOnClose = true;
    this._resolveOnce(null);
    this.close();
  }

  _createColumn(kind) {
    const column = document.createElement('div');
    column.className = 'date-picker-column';
    column.dataset.column = kind;

    const view = document.createElement('disco-date-picker-flip-view');
    view.className = 'date-picker-view';
    view.setAttribute('direction', 'vertical');
    view.setAttribute('overscroll-mode', 'loop');

    view.addEventListener('pointerdown', () => this._markUserInteraction(kind));
    view.addEventListener('touchstart', () => this._markUserInteraction(kind), { passive: true });
    view.addEventListener('wheel', () => this._markUserInteraction(kind), { passive: true });
    view.addEventListener('scroll', () => this._onScroll(kind), { passive: true });
    view.addEventListener('disco-snap-target', (e) => this._onSnap(kind, e));

    column.appendChild(view);

    if (kind === 'month') this._monthView = view;
    if (kind === 'day') this._dayView = view;
    if (kind === 'year') this._yearView = view;

    return column;
  }

  _applyFormat() {
    this._formatSpec = this._parseFormat(this._format);

    if (this._monthColumn) {
      this._monthColumn.toggleAttribute('data-hidden', !this._formatSpec.hasMonth);
    }
    if (this._dayColumn) {
      this._dayColumn.toggleAttribute('data-hidden', !this._formatSpec.hasDay);
    }
    if (this._yearColumn) {
      this._yearColumn.toggleAttribute('data-hidden', !this._formatSpec.hasYear);
    }

    this._buildMonthItems();
    this._buildYearItems();
    this._buildDayItems();
  }

  getFlipClone() {
    if (!this._root) return null;

    const rootClone = this._root.cloneNode(true);
    const viewport = rootClone.querySelector('.content-viewport');
    if (!viewport) return rootClone;

    viewport.innerHTML = '';

    const columnsEl = document.createElement('div');
    columnsEl.className = 'date-picker-columns';

    const addColumn = (kind, item) => {
      if (!item) return;
      const col = document.createElement('div');
      col.className = 'date-picker-column';
      col.dataset.column = kind;

      const view = document.createElement('div');
      view.className = 'date-picker-view';

      view.appendChild(item.cloneNode(true));
      col.appendChild(view);
      columnsEl.appendChild(col);
    };

    if (this._formatSpec?.hasMonth) {
      addColumn('month', this._monthItems[this._monthIndex]);
    }
    if (this._formatSpec?.hasDay) {
      addColumn('day', this._dayItems[this._dayIndex]);
    }
    if (this._formatSpec?.hasYear) {
      addColumn('year', this._yearItems[this._yearIndex]);
    }

    viewport.appendChild(columnsEl);
    return rootClone;
  }

  _parseFormat(format) {
    const safeFormat = typeof format === 'string' ? format : 'dd MMMM yyyy';
    const hasMonthName = /MMMM/.test(safeFormat) ? 'long' : (/MMM/.test(safeFormat) ? 'short' : null);
    const hasMonthNumber = /MM/.test(safeFormat) || /\bM\b/.test(safeFormat);
    const hasDayNumber = /dd/.test(safeFormat) || /\bd\b/.test(safeFormat);
    const hasYear = /yyyy/.test(safeFormat) ? 'numeric' : (/yy/.test(safeFormat) ? '2-digit' : null);
    const hasWeekday = /dddd/.test(safeFormat) ? 'long' : (/ddd/.test(safeFormat) ? 'short' : null);

    return {
      hasMonth: Boolean(hasMonthName || hasMonthNumber),
      hasDay: Boolean(hasDayNumber),
      hasYear: Boolean(hasYear),
      monthNameStyle: hasMonthName,
      monthNumberDigits: /MM/.test(safeFormat) ? 2 : (hasMonthNumber ? 1 : 0),
      dayNumberDigits: /dd/.test(safeFormat) ? 2 : (hasDayNumber ? 1 : 0),
      yearStyle: hasYear,
      weekdayStyle: hasWeekday
    };
  }

  _buildMonthItems() {
    if (!this._monthView) return;

    const monthFormatter = this._formatSpec.monthNameStyle
      ? new Intl.DateTimeFormat(this._locale, { month: this._formatSpec.monthNameStyle })
      : null;

    const items = [];
    for (let m = 0; m < 12; m += 1) {
      const date = new Date(2020, m, 1);
      const monthNumber = this._formatSpec.monthNumberDigits
        ? String(m + 1).padStart(this._formatSpec.monthNumberDigits, '0')
        : '';
      const monthName = monthFormatter ? monthFormatter.format(date) : '';
      const item = this._createItem(monthNumber || monthName, monthNumber ? monthName : '');
      item.dataset.index = String(m);
      items.push(item);
    }

    this._monthItems = items;
    this._populateView(this._monthView, items);
  }

  _buildYearItems() {
    if (!this._yearView) return;

    const minYear = this._minDate.getFullYear();
    const maxYear = this._maxDate.getFullYear();
    this._minYear = minYear;
    this._maxYear = maxYear;

    const items = [];
    for (let y = minYear; y <= maxYear; y += 1) {
      const display = this._formatSpec.yearStyle === '2-digit'
        ? String(y).slice(-2)
        : String(y);
      const item = this._createItem(display, '');
      item.dataset.index = String(y - minYear);
      items.push(item);
    }

    this._yearItems = items;
    this._populateView(this._yearView, items);
  }

  _buildDayItems() {
    if (!this._dayView) return;

    const year = this._selectedDate.getFullYear();
    const month = this._selectedDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const weekdayFormatter = this._formatSpec.weekdayStyle
      ? new Intl.DateTimeFormat(this._locale, { weekday: this._formatSpec.weekdayStyle })
      : null;

    const selectedDay = this._selectedDate.getDate();
    const items = [];
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month, d);
      const dayNumber = this._formatSpec.dayNumberDigits
        ? String(d).padStart(this._formatSpec.dayNumberDigits, '0')
        : String(d);
      const weekday = weekdayFormatter ? weekdayFormatter.format(date) : '';
      const item = this._createItem(dayNumber, weekday);
      item.dataset.index = String(d - 1);
      if (d === selectedDay) {
        item.toggleAttribute('data-selected', true);
      }
      items.push(item);
    }

    this._dayItems = items;
    this._populateView(this._dayView, items);
  }

  _populateView(view, items) {
    view.innerHTML = '';
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const idx = Number(item.dataset.index || 0);
        this._markUserInteraction(view === this._monthView ? 'month' : view === this._dayView ? 'day' : 'year');
        this._scrollToIndex(view, idx);
        this._scheduleCommit(view === this._monthView ? 'month' : view === this._dayView ? 'day' : 'year', idx);
      });
      view.appendChild(item);
    });

    if (typeof view._updateChildrenLayout === 'function') {
      view._updateChildrenLayout();
    }
  }

  _createItem(primaryText, secondaryText) {
    const item = document.createElement('div');
    item.className = 'date-picker-item';

    const primary = document.createElement('div');
    primary.className = 'date-picker-primary';
    primary.textContent = primaryText;

    const secondary = document.createElement('div');
    secondary.className = 'date-picker-secondary';
    secondary.textContent = secondaryText || '';

    item.appendChild(primary);
    item.appendChild(secondary);

    return item;
  }

  _markUserInteraction(kind) {
    this._hasUserInteracted = true;
    this._lastInteractedKind = kind;
    this._setActiveColumn(kind);
  }

  _setActiveColumn(kind) {
    if (this._activeColumn === kind) return;
    this._activeColumn = kind;

    const columns = [this._monthColumn, this._dayColumn, this._yearColumn];
    columns.forEach((col) => {
      if (!col) return;
      const isActive = col.dataset.column === kind;
      col.toggleAttribute('data-expanded', Boolean(isActive));
    });
  }

  _onScroll(kind) {
    if (this._isSyncing || this._suppressScroll[kind]) return;
    if (!this._hasUserInteracted || this._lastInteractedKind !== kind) return;
    this._setActiveColumn(kind);
    this._scheduleCommit(kind, null);
  }

  _onSnap(kind, e) {
    if (this._isSyncing) return;
    if (!this._hasUserInteracted || this._lastInteractedKind !== kind) return;

    const detail = /** @type {{ index?: number }} */ (e.detail || {});
    const idx = Number(detail.index || 0);
    this._setActiveColumn(kind);
    this._scheduleCommit(kind, idx);
  }

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

  _commitPendingSelection(kind) {
    const view = kind === 'month' ? this._monthView : kind === 'day' ? this._dayView : this._yearView;
    if (!view) return;

    let idx = this._pendingIndex[kind];
    if (idx == null || !Number.isFinite(idx)) {
      const size = typeof view._getPageSize === 'function' ? view._getPageSize() : (view.clientHeight || 1);
      const rawIdx = size > 0 ? Math.round(view.scrollTop / size) : 0;
      idx = rawIdx;
    }

    if (kind === 'month') {
      const normalized = this._normalizeIndex(idx, this._monthItems.length);
      this._updateDateParts({ month: normalized });
      return;
    }

    if (kind === 'day') {
      const normalized = this._normalizeIndex(idx, this._dayItems.length);
      this._updateDateParts({ day: normalized + 1 });
      return;
    }

    if (kind === 'year') {
      const normalized = this._normalizeIndex(idx, this._yearItems.length);
      const year = this._minYear + normalized;
      this._updateDateParts({ year });
    }
  }

  _normalizeIndex(idx, count) {
    if (count <= 0) return 0;
    return ((idx % count) + count) % count;
  }

  _updateDateParts({ year, month, day }) {
    const current = this._selectedDate;
    const nextYear = year != null ? year : current.getFullYear();
    const nextMonth = month != null ? month : current.getMonth();
    const maxDay = new Date(nextYear, nextMonth + 1, 0).getDate();
    const nextDay = day != null ? Math.min(day, maxDay) : Math.min(current.getDate(), maxDay);

    const nextDate = new Date(nextYear, nextMonth, nextDay);
    const clamped = this._clampDate(nextDate);

    this._selectedDate = clamped;

    const monthChanged = current.getMonth() !== clamped.getMonth();
    const yearChanged = current.getFullYear() !== clamped.getFullYear();
    const requiresDayRebuild = monthChanged || yearChanged;
    if (requiresDayRebuild) {
      // Suppress scroll events triggered by rebuilding the view (which resets scroll to 0)
      this._suppressScroll.day += 1;
      this._buildDayItems();
      // Use setTimeout to ensure we cover any async layout/scroll event timing
      setTimeout(() => {
        this._suppressScroll.day = Math.max(0, this._suppressScroll.day - 1);
      }, 100);
    }

    const dayClamped = clamped.getDate() !== current.getDate();
    this._syncToDate(clamped, {
      month: month != null,
      year: year != null,
      day: day != null || dayClamped || requiresDayRebuild
    });
  }

  _syncToDate(date, sync = { month: true, day: true, year: true }) {
    this._isSyncing = true;

    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    this._monthIndex = month;
    this._yearIndex = Math.max(0, Math.min(this._yearItems.length - 1, year - this._minYear));
    this._dayIndex = Math.max(0, Math.min(this._dayItems.length - 1, day - 1));

    if (sync.month && this._monthView) this._scrollToIndex(this._monthView, this._monthIndex);
    if (sync.day && this._dayView) this._scrollToIndex(this._dayView, this._dayIndex);
    if (sync.year && this._yearView) this._scrollToIndex(this._yearView, this._yearIndex);

    this._updateSelectedStates();

    this._isSyncing = false;
  }

  _scrollToIndex(view, index) {
    const size = typeof view._getPageSize === 'function' ? view._getPageSize() : (view.clientHeight || 1);
    const kind = this._getKindForView(view);
    if (kind) {
      this._suppressScroll[kind] += 1;
      // Use setTimeout to ensure the suppression covers the async scroll event
      setTimeout(() => {
        this._suppressScroll[kind] = Math.max(0, this._suppressScroll[kind] - 1);
      }, 100);
    }
    view.scrollTop = index * size;
  }

  _getKindForView(view) {
    if (view === this._monthView) return 'month';
    if (view === this._dayView) return 'day';
    if (view === this._yearView) return 'year';
    return null;
  }

  _updateSelectedStates() {
    this._setSelectedIndex(this._monthItems, this._monthIndex);
    this._setSelectedIndex(this._dayItems, this._dayIndex);
    this._setSelectedIndex(this._yearItems, this._yearIndex);
  }

  _setSelectedIndex(items, index) {
    items.forEach((item, i) => {
      item.toggleAttribute('data-selected', i === index);
    });
  }

  _clampDate(date) {
    const time = date.getTime();
    if (Number.isNaN(time)) return new Date(this._minDate);

    if (this._minDate && time < this._minDate.getTime()) {
      return new Date(this._minDate);
    }

    if (this._maxDate && time > this._maxDate.getTime()) {
      return new Date(this._maxDate);
    }

    return new Date(date);
  }
}

customElements.define('disco-date-picker', DiscoDatePicker);

export default DiscoDatePicker;
