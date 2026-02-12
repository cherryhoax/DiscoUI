import DiscoLoopingSelector from '../looping-selector/disco-looping-selector.js';
import timePickerCss from './disco-time-picker.scss';
import '../app-bar/disco-app-bar.js';
import '../app-bar/disco-app-bar-icon-button.js';

/**
 * Time picker built on top of DiscoLoopingSelector.
 * @extends DiscoLoopingSelector
 */
class DiscoTimePicker extends DiscoLoopingSelector {
  /**
   * @param {string} [title]
   * @param {Date | string} [value]
   * @param {{ minuteIncrement?: number, locale?: string, format?: string }} [options]
   */
  constructor(title = 'CHOOSE TIME', value = new Date(), options = {}) {
    super(title, title);

    this.loadStyle(timePickerCss, this.shadowRoot);

    const safeOptions = options || {};
    this._locale = safeOptions.locale || (navigator.language || 'en-US');
    this._format = safeOptions.format || this._resolveDefaultFormat(this._locale);
    this._minuteIncrement = this._normalizeMinuteIncrement(safeOptions.minuteIncrement);

    this._selectedDate = this._normalizeToMinuteIncrement(this._parseTimeValue(value));

    this._hourItems = [];
    this._minuteItems = [];
    this._periodItems = [];
    this._hourValues = [];
    this._minuteValues = [];
    this._periodValues = [];

    this._initSliderPicker(['hour', 'minute', 'period']);
    this._resolveSelection = null;
    this._openPromise = null;
    this._skipResolveOnClose = false;

    this._buildContent();
    this._buildAppBar();
    this._applyFormat();
    this._syncToTime(this._selectedDate);
  }

  connectedCallback() {
    super.connectedCallback();
    requestAnimationFrame(() => this._syncToTime(this._selectedDate));
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
      this._resetSliderInteractionState();
      requestAnimationFrame(() => this._syncToTime(this._selectedDate));
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

  _buildContent() {
    if (!this._contentViewport) return;

    this._contentViewport.innerHTML = '';
    this._contentViewport.classList.add('time-picker-viewport');

    this._columnsEl = document.createElement('div');
    this._columnsEl.className = 'time-picker-columns';

    this._hourColumn = this._createColumn('hour');
    this._minuteColumn = this._createColumn('minute');
    this._periodColumn = this._createColumn('period');

    this._columnsEl.appendChild(this._hourColumn);
    this._columnsEl.appendChild(this._minuteColumn);
    this._columnsEl.appendChild(this._periodColumn);

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
    const value = new Date(this._selectedDate.getTime());
    this._skipResolveOnClose = true;
    this._resolveOnce(value);
    this.close();
  }

  _cancelSelection() {
    this._skipResolveOnClose = true;
    this._resolveOnce(null);
    this.close();
  }

  _createColumn(kind) {
    const column = document.createElement('div');
    column.className = 'time-picker-column';
    column.dataset.column = kind;

    const view = document.createElement('disco-looping-selector-flip-view');
    view.className = 'time-picker-view';
    view.setAttribute('direction', 'vertical');
    view.setAttribute('overscroll-mode', kind === 'period' ? 'none' : 'loop');
    view.setAttribute('css-prefix', 'time-picker');

    view.addEventListener('pointerdown', () => this._markUserInteraction(kind));
    view.addEventListener('scroll', () => this._onScroll(kind), { passive: true });
    view.addEventListener('scroll-end', () => this._onScrollEnd(kind));
    view.addEventListener('disco-snap-target', (e) => this._onSnap(kind, e));

    column.appendChild(view);

    if (kind === 'hour') this._hourView = view;
    if (kind === 'minute') this._minuteView = view;
    if (kind === 'period') this._periodView = view;

    this._registerSliderKind(kind, { column, view });

    return column;
  }

  _applyFormat() {
    this._formatSpec = this._parseFormat(this._format);
    this.setAttribute('data-has-period', String(Boolean(this._formatSpec.hasPeriod)));

    if (this._hourColumn) {
      this._hourColumn.toggleAttribute('data-hidden', !this._formatSpec.hasHour);
    }
    if (this._minuteColumn) {
      this._minuteColumn.toggleAttribute('data-hidden', !this._formatSpec.hasMinute);
    }
    if (this._periodColumn) {
      this._periodColumn.toggleAttribute('data-hidden', !this._formatSpec.hasPeriod);
    }

    this._applyColumnOrder();

    this._buildHourItems();
    this._buildMinuteItems();
    this._buildPeriodItems();

    this._selectedDate = this._normalizeToMinuteIncrement(this._selectedDate);
    this._syncToTime(this._selectedDate);
  }

  _applyColumnOrder() {
    if (!this._columnsEl) return;
    const order = this._formatSpec?.order || ['hour', 'minute', 'period'];
    const map = {
      hour: this._hourColumn,
      minute: this._minuteColumn,
      period: this._periodColumn
    };

    this._columnsEl.innerHTML = '';
    order.forEach((kind) => {
      const col = map[kind];
      if (col) this._columnsEl.appendChild(col);
    });

    ['hour', 'minute', 'period'].forEach((kind) => {
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
    columnsEl.className = 'time-picker-columns';

    const addColumn = (kind, item) => {
      if (!item) return;
      const col = document.createElement('div');
      col.className = 'time-picker-column';
      col.dataset.column = kind;

      const view = document.createElement('div');
      view.className = 'time-picker-view';
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

    const order = this._formatSpec?.order || ['hour', 'minute', 'period'];
    order.forEach((kind) => {
      if (kind === 'hour' && this._formatSpec?.hasHour) {
        addColumn('hour', this._hourItems[this._hourIndex]);
      }
      if (kind === 'minute' && this._formatSpec?.hasMinute) {
        addColumn('minute', this._minuteItems[this._minuteIndex]);
      }
      if (kind === 'period' && this._formatSpec?.hasPeriod) {
        addColumn('period', this._periodItems[this._periodIndex]);
      }
    });

    viewport.appendChild(columnsEl);
    return rootClone;
  }

  get locale() {
    return this._locale;
  }

  set locale(val) {
    const next = val || 'en-US';
    if (this._locale === next) return;
    this._locale = next;
    this._buildPeriodItems();
    this._syncToTime(this._selectedDate, { period: true });
  }

  get format() {
    return this._format;
  }

  set format(val) {
    const next = typeof val === 'string' && val.trim()
      ? val.trim()
      : this._resolveDefaultFormat(this._locale);
    if (this._format === next) return;
    this._format = next;
    this._applyFormat();
  }

  _resolveDefaultFormat(locale) {
    try {
      const resolved = new Intl.DateTimeFormat(locale || undefined, { hour: 'numeric' }).resolvedOptions();
      if (typeof resolved.hour12 === 'boolean') {
        return resolved.hour12 ? 'h:mm tt' : 'HH:mm';
      }
    } catch {
      // Ignore and use fallback below.
    }

    return 'HH:mm';
  }

  get minuteIncrement() {
    return this._minuteIncrement;
  }

  set minuteIncrement(val) {
    const next = this._normalizeMinuteIncrement(val);
    if (this._minuteIncrement === next) return;
    this._minuteIncrement = next;
    this._buildMinuteItems();
    this._selectedDate = this._normalizeToMinuteIncrement(this._selectedDate);
    this._syncToTime(this._selectedDate, { minute: true });
  }

  get value() {
    return new Date(this._selectedDate.getTime());
  }

  set value(val) {
    const parsed = this._parseTimeValue(val);
    this._selectedDate = this._normalizeToMinuteIncrement(parsed);
    this._syncToTime(this._selectedDate);
  }

  _parseFormat(format) {
    const safeFormat = typeof format === 'string' && format.trim()
      ? format.trim()
      : this._resolveDefaultFormat(this._locale);
    const tokens = safeFormat.match(/HH|H|hh|h|mm|m|tt|a/g) || [];

    const firstHourToken = tokens.find((token) => /^(HH|H|hh|h)$/.test(token)) || 'HH';
    const is12Hour = firstHourToken === 'hh' || firstHourToken === 'h';

    const hasHour = /(HH|H|hh|h)/.test(safeFormat);
    const hasMinute = /(mm|m)/.test(safeFormat);
    const hasPeriodToken = /(tt|a)/.test(safeFormat);
    const hasPeriod = hasPeriodToken || is12Hour;

    const minuteDigits = /mm/.test(safeFormat) ? 2 : (hasMinute ? 1 : 0);

    const order = [];
    tokens.forEach((token) => {
      let kind = null;
      if (/^(HH|H|hh|h)$/.test(token)) kind = 'hour';
      else if (/^(mm|m)$/.test(token)) kind = 'minute';
      else if (/^(tt|a)$/.test(token)) kind = 'period';
      if (kind && !order.includes(kind)) order.push(kind);
    });

    const fallbackOrder = hasPeriod ? ['hour', 'minute', 'period'] : ['hour', 'minute'];

    return {
      hasHour,
      hasMinute,
      hasPeriod,
      is12Hour,
      minuteDigits,
      order: order.length ? order : fallbackOrder
    };
  }

  _buildHourItems() {
    if (!this._hourView) return;

    const items = [];
    const values = [];
    const start = this._formatSpec.is12Hour ? 1 : 0;
    const end = this._formatSpec.is12Hour ? 12 : 23;

    for (let hour = start; hour <= end; hour += 1) {
      const text = String(hour).padStart(2, '0');
      const item = this._createItem(text, '');
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

    for (let minute = 0; minute < 60; minute += this._minuteIncrement) {
      const text = String(minute).padStart(Math.max(2, this._formatSpec.minuteDigits || 2), '0');
      const item = this._createItem(text, '');
      item.dataset.index = String(items.length);
      item.dataset.value = String(minute);
      items.push(item);
      values.push(minute);
    }

    if (!values.length) {
      const fallbackItem = this._createItem('00', '');
      fallbackItem.dataset.index = '0';
      fallbackItem.dataset.value = '0';
      items.push(fallbackItem);
      values.push(0);
    }

    this._minuteItems = items;
    this._minuteValues = values;
    this._registerSliderKind('minute', { items, values });
    this._populateView(this._minuteView, items, 'minute');
    this._updateLoopingForView(this._minuteView, 'minute', items.length);
  }

  _buildPeriodItems() {
    if (!this._periodView) return;

    const labels = this._resolvePeriodLabels();
    const values = ['AM', 'PM'];
    const items = values.map((value, index) => {
      const text = labels[index] || value;
      const item = this._createItem(text, '');
      item.dataset.index = String(index);
      item.dataset.value = value;
      return item;
    });

    this._periodItems = items;
    this._periodValues = values;
    this._registerSliderKind('period', { items, values });
    this._populateView(this._periodView, items, 'period');
    this._updateLoopingForView(this._periodView, 'period', items.length);
  }

  _resolvePeriodLabels() {
    try {
      const formatter = new Intl.DateTimeFormat(this._locale, { hour: 'numeric', hour12: true });
      const morning = formatter
        .formatToParts(new Date(2020, 0, 1, 9, 0, 0, 0))
        .find((part) => part.type === 'dayPeriod')?.value;
      const evening = formatter
        .formatToParts(new Date(2020, 0, 1, 21, 0, 0, 0))
        .find((part) => part.type === 'dayPeriod')?.value;
      return [morning || 'AM', evening || 'PM'];
    } catch {
      return ['AM', 'PM'];
    }
  }

  _populateView(view, items, kind) {
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

    if (typeof view._updateChildrenLayout === 'function') {
      view._updateChildrenLayout();
    }
  }

  _createItem(primaryText, secondaryText) {
    const item = document.createElement('div');
    item.className = 'time-picker-item';

    const primary = document.createElement('div');
    primary.className = 'time-picker-primary';
    primary.textContent = primaryText;

    const secondary = document.createElement('div');
    secondary.className = 'time-picker-secondary';
    secondary.textContent = secondaryText || '';

    item.appendChild(primary);
    item.appendChild(secondary);

    return item;
  }

  _onSliderCommit(kind, value) {
    if (kind === 'hour') {
      this._updateTimeParts({ hourValue: value });
      return;
    }
    if (kind === 'minute') {
      this._updateTimeParts({ minute: value });
      return;
    }
    if (kind === 'period') {
      this._updateTimeParts({ period: value });
    }
  }

  _updateTimeParts({ hourValue, minute, period }) {
    const currentHour = this._selectedDate.getHours();
    const currentMinute = this._selectedDate.getMinutes();

    let nextHour = currentHour;

    if (this._formatSpec.is12Hour && hourValue != null) {
      const currentPeriod = currentHour >= 12 ? 'PM' : 'AM';
      const periodToUse = period || currentPeriod;
      const normalized12 = hourValue % 12;
      nextHour = periodToUse === 'PM' ? normalized12 + 12 : normalized12;
      if (periodToUse === 'AM' && hourValue === 12) nextHour = 0;
      if (periodToUse === 'PM' && hourValue === 12) nextHour = 12;
    } else if (hourValue != null) {
      nextHour = hourValue;
    }

    if (this._formatSpec.is12Hour && period && hourValue == null) {
      const displayHour = currentHour % 12 === 0 ? 12 : currentHour % 12;
      const normalized12 = displayHour % 12;
      nextHour = period === 'PM' ? normalized12 + 12 : normalized12;
      if (period === 'AM' && displayHour === 12) nextHour = 0;
      if (period === 'PM' && displayHour === 12) nextHour = 12;
    }

    const nextMinute = minute != null ? minute : currentMinute;

    const nextDate = new Date(this._selectedDate.getTime());
    nextDate.setHours(nextHour, nextMinute, 0, 0);
    this._selectedDate = this._normalizeToMinuteIncrement(nextDate);
    this._syncToTime(this._selectedDate, {
      hour: hourValue != null || period != null,
      minute: minute != null,
      period: hourValue != null || period != null
    });
  }

  _syncToTime(date, sync = { hour: true, minute: true, period: true }) {
    this._isSyncing = true;

    const hour24 = date.getHours();
    const minute = date.getMinutes();
    const period = hour24 >= 12 ? 'PM' : 'AM';
    const hourDisplay = this._formatSpec.is12Hour
      ? (hour24 % 12 === 0 ? 12 : hour24 % 12)
      : hour24;

    const hourIndex = this._hourValues.indexOf(hourDisplay);
    const minuteIndex = this._minuteValues.indexOf(this._closestMinuteValue(minute));
    const periodIndex = this._periodValues.indexOf(period);

    this._hourIndex = hourIndex >= 0 ? hourIndex : 0;
    this._minuteIndex = minuteIndex >= 0 ? minuteIndex : 0;
    this._periodIndex = periodIndex >= 0 ? periodIndex : 0;

    if (sync.hour && this._hourView) this._scrollToIndex(this._hourView, this._hourIndex);
    if (sync.minute && this._minuteView) this._scrollToIndex(this._minuteView, this._minuteIndex);
    if (sync.period && this._periodView) this._scrollToIndex(this._periodView, this._periodIndex);

    this._updateSelectedStates();
    this._isSyncing = false;
  }

  _updateLoopingForView(view, kind, count) {
    if (!view) return;

    if (kind === 'period') {
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

  _updateSelectedStates() {
    this._setSelectedIndex(this._hourItems, this._hourIndex);
    this._setSelectedIndex(this._minuteItems, this._minuteIndex);
    this._setSelectedIndex(this._periodItems, this._periodIndex);
  }

  _setSelectedIndex(items, index) {
    items.forEach((item, i) => {
      item.toggleAttribute('data-selected', i === index);
    });
  }

  _normalizeMinuteIncrement(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return 1;
    const rounded = Math.round(parsed);
    return Math.min(30, Math.max(1, rounded));
  }

  _parseTimeValue(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Date(value.getTime());
    }

    if (typeof value === 'string') {
      const parsed = this._parseTimeString(value);
      if (parsed) return parsed;
    }

    return new Date();
  }

  _parseTimeString(value) {
    const match = String(value)
      .trim()
      .match(/^(\d{1,2})\s*:\s*(\d{1,2})(?:\s*([aApP])\.?\s*(?:[mM])\.?)?$/);

    if (!match) return null;

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const periodToken = (match[3] || '').toUpperCase();

    if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
    if (minute < 0 || minute > 59) return null;

    if (periodToken) {
      if (hour < 1 || hour > 12) return null;
      if (periodToken === 'A') {
        if (hour === 12) hour = 0;
      } else if (periodToken === 'P') {
        if (hour !== 12) hour += 12;
      }
    } else {
      if (hour < 0 || hour > 23) return null;
    }

    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  _normalizeToMinuteIncrement(date) {
    const next = new Date(date.getTime());
    const normalizedMinute = this._closestMinuteValue(next.getMinutes());
    next.setMinutes(normalizedMinute, 0, 0);
    return next;
  }

  _closestMinuteValue(minute) {
    const values = this._minuteValues && this._minuteValues.length
      ? this._minuteValues
      : this._buildMinuteValueList();

    let best = values[0] ?? 0;
    let bestDistance = Math.abs(minute - best);

    values.forEach((value) => {
      const distance = Math.abs(minute - value);
      if (distance < bestDistance) {
        best = value;
        bestDistance = distance;
      }
    });

    return best;
  }

  _buildMinuteValueList() {
    const values = [];
    for (let minute = 0; minute < 60; minute += this._minuteIncrement) {
      values.push(minute);
    }
    if (!values.length) values.push(0);
    return values;
  }
}

customElements.define('disco-time-picker', DiscoTimePicker);

export default DiscoTimePicker;
