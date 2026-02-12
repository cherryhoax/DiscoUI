import DiscoSliderPicker from '../slider-picker/disco-slider-picker.js';
import datePickerCss from './disco-date-picker.scss';
import './disco-date-picker-flip-view.js';
import '../app-bar/disco-app-bar.js';
import '../app-bar/disco-app-bar-icon-button.js';

const LIMIT_DAYS = 100_000_000;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DEFAULT_MIN = new Date(-LIMIT_DAYS * MS_PER_DAY);
const DEFAULT_MAX = new Date(LIMIT_DAYS * MS_PER_DAY);

/**
 * Date picker built on top of DiscoSliderPicker.
 * @extends DiscoSliderPicker
 */
class DiscoDatePicker extends DiscoSliderPicker {
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
    this._monthValues = [];
    this._dayValues = [];
    this._yearValues = [];

    this._initSliderPicker(['month', 'day', 'year']);
    this._resolveSelection = null;
    this._openPromise = null;
    this._skipResolveOnClose = false;

    this._buildContent();
    this._buildAppBar();
    this._applyFormat();
    // Initial sync. Note: scrollTop assignments here won't work if detached,
    // so we also sync in connectedCallback.
    this._syncToDate(this._selectedDate);
  }

  connectedCallback() {
    super.connectedCallback();
    // Re-apply scroll positions now that we are attached and have layout dimensions
    requestAnimationFrame(() => this._syncToDate(this._selectedDate));
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
      this._resetSliderInteractionState();

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
    view.addEventListener('scroll', () => this._onScroll(kind), { passive: true });
    view.addEventListener('scroll-end', () => this._onScrollEnd(kind));
    view.addEventListener('disco-snap-target', (e) => this._onSnap(kind, e));

    column.appendChild(view);

    if (kind === 'month') this._monthView = view;
    if (kind === 'day') this._dayView = view;
    if (kind === 'year') this._yearView = view;

    this._registerSliderKind(kind, { column, view });

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

    this._applyColumnOrder();

    this._buildMonthItems();
    this._buildYearItems();
    this._buildDayItems();
  }

  _applyColumnOrder() {
    if (!this._columnsEl) return;
    const order = this._formatSpec?.order || ['month', 'day', 'year'];
    const map = {
      month: this._monthColumn,
      day: this._dayColumn,
      year: this._yearColumn
    };

    this._columnsEl.innerHTML = '';
    order.forEach((kind) => {
      const col = map[kind];
      if (col) this._columnsEl.appendChild(col);
    });

    ['month', 'day', 'year'].forEach((kind) => {
      if (order.includes(kind)) return;
      const col = map[kind];
      if (col) this._columnsEl.appendChild(col);
    });
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
      view.style.position = 'relative';
      view.style.overflow = 'hidden';
      view.style.height = '100%';
      view.style.width = '100%';

      const clone = item.cloneNode(true);
      clone.setAttribute('data-selected', 'true');
      
      // Manually center the item since we want it to match the "selected" position (center of view)
      clone.style.position = 'absolute';
      clone.style.top = '50%';
      clone.style.left = '0';
      clone.style.width = '100%';
      clone.style.transform = 'translateY(-50%)';

      view.appendChild(clone);
      col.appendChild(view);
      columnsEl.appendChild(col);
    };

    const order = this._formatSpec?.order || ['month', 'day', 'year'];
    order.forEach((kind) => {
      if (kind === 'month' && this._formatSpec?.hasMonth) {
        addColumn('month', this._monthItems[this._monthIndex]);
      }
      if (kind === 'day' && this._formatSpec?.hasDay) {
        addColumn('day', this._dayItems[this._dayIndex]);
      }
      if (kind === 'year' && this._formatSpec?.hasYear) {
        addColumn('year', this._yearItems[this._yearIndex]);
      }
    });

    viewport.appendChild(columnsEl);
    return rootClone;
  }

  get locale() {
    return this._locale;
  }

  set locale(val) {
    if (this._locale !== val) {
      this._locale = val || 'en-US';
      this._buildMonthItems();
      this._buildDayItems();
    }
  }

  _parseFormat(format) {
    const safeFormat = typeof format === 'string' ? format : 'dd MMMM yyyy';
    // User requested MMMM to render short month names (e.g. "Jan" instead of "January")
    // effectively overriding the standard meaning of MMMM for the view.
    const hasMonthName = /MMMM/.test(safeFormat) ? 'short' : (/MMM/.test(safeFormat) ? 'short' : null);
    const hasMonthNumber = /(?:^|[^M])MM(?!M)/.test(safeFormat) || /(?:^|[^M])M(?!M)/.test(safeFormat);
    const hasDayNumber = /(?:^|[^d])dd(?!d)/.test(safeFormat) || /(?:^|[^d])d(?!d)/.test(safeFormat);
    const hasYear = /yyyy/.test(safeFormat) ? 'numeric' : (/yy/.test(safeFormat) ? '2-digit' : null);
    const hasWeekday = /dddd/.test(safeFormat) ? 'long' : (/ddd/.test(safeFormat) ? 'short' : null);

    const tokens = safeFormat.match(/yyyy|yy|MMMM|MMM|MM|M|dd|d/g) || [];
    const order = [];
    tokens.forEach((token) => {
      let kind = null;
      if (token.startsWith('y')) kind = 'year';
      else if (token.startsWith('M')) kind = 'month';
      else if (token.startsWith('d')) kind = 'day';
      if (kind && !order.includes(kind)) order.push(kind);
    });

    const finalOrder = order.length ? order : ['month', 'day', 'year'];

    return {
      hasMonth: Boolean(hasMonthName || hasMonthNumber),
      hasDay: Boolean(hasDayNumber),
      hasYear: Boolean(hasYear),
      monthNameStyle: hasMonthName,
      monthNumberDigits: /(?:^|[^M])MM(?!M)/.test(safeFormat) ? 2 : (hasMonthNumber ? 1 : 0),
      dayNumberDigits: /(?:^|[^d])dd(?!d)/.test(safeFormat) ? 2 : (hasDayNumber ? 1 : 0),
      yearStyle: hasYear,
      weekdayStyle: hasWeekday,
      order: finalOrder
    };
  }

  _buildMonthItems() {
    if (!this._monthView) return;

    const year = this._selectedDate.getFullYear();

    const monthFormatter = this._formatSpec.monthNameStyle
      ? new Intl.DateTimeFormat(this._locale, { month: this._formatSpec.monthNameStyle })
      : null;

    const items = [];
    const values = [];
    for (let m = 0; m < 12; m += 1) {
      const start = new Date(year, m, 1);
      const end = new Date(year, m + 1, 0, 23, 59, 59, 999);
      if (!this._isRangeInBounds(start, end)) continue;

      const date = new Date(2020, m, 1);
      const monthNumber = this._formatSpec.monthNumberDigits
        ? String(m + 1).padStart(this._formatSpec.monthNumberDigits, '0')
        : '';
      const monthName = monthFormatter ? monthFormatter.format(date) : '';
      const item = this._createItem(monthNumber || monthName, monthNumber ? monthName : '');
      item.dataset.index = String(items.length);
      item.dataset.value = String(m);
      items.push(item);
      values.push(m);
    }

    this._monthItems = items;
    this._monthValues = values;
    this._registerSliderKind('month', { items, values });
    this._populateView(this._monthView, items);
    this._updateLoopingForView(this._monthView, 'month', items.length);
  }

  _buildYearItems() {
    if (!this._yearView) return;

    const minYear = this._minDate.getFullYear();
    const maxYear = this._maxDate.getFullYear();
    this._minYear = minYear;
    this._maxYear = maxYear;

    const items = [];
    const values = [];
    for (let y = minYear; y <= maxYear; y += 1) {
      const start = new Date(y, 0, 1);
      const end = new Date(y, 11, 31, 23, 59, 59, 999);
      if (!this._isRangeInBounds(start, end)) continue;

      const display = this._formatSpec.yearStyle === '2-digit'
        ? String(y).slice(-2)
        : String(y);
      const item = this._createItem(display, '');
      item.dataset.index = String(items.length);
      item.dataset.value = String(y);
      items.push(item);
      values.push(y);
    }

    this._yearItems = items;
    this._yearValues = values;
    this._registerSliderKind('year', { items, values });
    this._populateView(this._yearView, items);
    this._updateLoopingForView(this._yearView, 'year', items.length);
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
    const values = [];
    for (let d = 1; d <= daysInMonth; d += 1) {
      const date = new Date(year, month, d);
      if (!this._isDateInBounds(date)) continue;

      const dayNumber = this._formatSpec.dayNumberDigits
        ? String(d).padStart(this._formatSpec.dayNumberDigits, '0')
        : String(d);
      const weekday = weekdayFormatter ? weekdayFormatter.format(date) : '';
      const item = this._createItem(dayNumber, weekday);
      item.dataset.index = String(items.length);
      item.dataset.value = String(d);
      if (d === selectedDay) {
        item.toggleAttribute('data-selected', true);
      }
      items.push(item);
      values.push(d);
    }

    this._dayItems = items;
    this._dayValues = values;
    this._registerSliderKind('day', { items, values });
    this._populateView(this._dayView, items);
    this._updateLoopingForView(this._dayView, 'day', items.length);
  }

  _populateView(view, items) {
    view.innerHTML = '';
    items.forEach((item) => {
      item.addEventListener('click', () => {
        const idx = Number(item.dataset.index || 0);
        const kind = view === this._monthView ? 'month' : view === this._dayView ? 'day' : 'year';
        this._markUserInteraction(kind);
        this._scrollSliderToIndex(kind, idx);
        this._pendingIndex[kind] = idx;
        this._setScrolling(kind, true);
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

  _onSliderCommit(kind, value) {
    if (kind === 'month') {
      this._updateDateParts({ month: value });
      return;
    }
    if (kind === 'day') {
      this._updateDateParts({ day: value });
      return;
    }
    if (kind === 'year') {
      this._updateDateParts({ year: value });
    }
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

    const monthIndex = this._monthValues.indexOf(month);
    const yearIndex = this._yearValues.indexOf(year);
    const dayIndex = this._dayValues.indexOf(day);

    this._monthIndex = monthIndex >= 0 ? monthIndex : 0;
    this._yearIndex = yearIndex >= 0 ? yearIndex : 0;
    this._dayIndex = dayIndex >= 0 ? dayIndex : 0;

    if (sync.month && this._monthView) this._scrollToIndex(this._monthView, this._monthIndex);
    if (sync.day && this._dayView) this._scrollToIndex(this._dayView, this._dayIndex);
    if (sync.year && this._yearView) this._scrollToIndex(this._yearView, this._yearIndex);

    this._updateSelectedStates();

    this._isSyncing = false;
  }

  _updateLoopingForView(view, kind, count) {
    if (!view) return;

    if (kind === 'year') {
      view.setAttribute('overscroll-mode', 'none');
      return;
    }

    const update = () => {
      const size = typeof view._getPageSize === 'function' ? view._getPageSize() : (view.clientHeight || 1);
      const height = view.clientHeight || 1;
      const canLoop = count * size > height + 1;
      view.setAttribute('overscroll-mode', canLoop ? 'loop' : 'none');
    };

    requestAnimationFrame(() => requestAnimationFrame(update));
  }

  _isDateInBounds(date) {
    const time = date.getTime();
    return time >= this._minDate.getTime() && time <= this._maxDate.getTime();
  }

  _isRangeInBounds(start, end) {
    const minTime = this._minDate.getTime();
    const maxTime = this._maxDate.getTime();
    return end.getTime() >= minTime && start.getTime() <= maxTime;
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
