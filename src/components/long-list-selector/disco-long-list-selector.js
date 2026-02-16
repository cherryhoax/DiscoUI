import DiscoPickerBox from '../flyout/disco-flyout.js';
import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import DiscoAnimations from '../../theme/animations/disco-animations.js';
import longListSelectorCss from './disco-long-list-selector.scss';
import '../scroll-view/disco-scroll-view.js';

class DiscoLongListSelectorTile extends DiscoUIElement {
    constructor() {
        super();
        this.setAttribute('role', 'button');
        this.tabIndex = 0;
    }
}

if (!customElements.get('disco-long-list-selector-tile')) {
    customElements.define('disco-long-list-selector-tile', DiscoLongListSelectorTile);
}

/**
 * @typedef {{
 *  mode?: 'auto' | 'custom',
 *  labelField?: string,
 *  separatorField?: string,
 *  separators?: string[],
 *  locale?: string
 * }} DiscoLongListSelectorOptions
 */

/**
 * Long list selector modal with grouped separators.
 * - auto mode: 4 columns, square tiles, A-Z + # + special tile
 * - custom mode: 1 column, rectangular tiles
 * @extends DiscoPickerBox
 */
class DiscoLongListSelector extends DiscoPickerBox {
    /**
     * @param {string} [title]
     * @param {unknown[]} [items]
     * @param {DiscoLongListSelectorOptions} [options]
     */
    constructor(title = 'SELECT SECTION', items = [], options = {}) {
        super('', '');

        this.loadStyle(longListSelectorCss, this.shadowRoot);
        this.setAttribute('animation', 'none');

        this._items = Array.isArray(items) ? items : [];
        this._options = {
            mode: options?.mode || 'auto',
            labelField: options?.labelField || 'title',
            separatorField: options?.separatorField || 'separator',
            separators: Array.isArray(options?.separators) ? [...options.separators] : null,
            locale: options?.locale || 'en'
        };

        this._resolveSelection = null;
        this._openPromise = null;
        this._skipResolveOnClose = false;
        this._entries = [];

        this._buildContent();
        this.refresh();
    }

    /**
     * @returns {'auto' | 'custom'}
     */
    get mode() {
        return this._options.mode;
    }

    /**
     * @param {'auto' | 'custom'} value
     */
    set mode(value) {
        const next = value === 'custom' ? 'custom' : 'auto';
        if (next === this._options.mode) return;
        this._options.mode = next;
        this.refresh();
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
        this._items = Array.isArray(value) ? value : [];
        this.refresh();
    }

    /**
     * @returns {Promise<string|null>}
     */
    open() {
        if (this._openPromise) return this._openPromise;

        this._openPromise = new Promise((resolve) => {
            this._resolveSelection = resolve;
        });

        this.show().then(async () => {
            const tiles = this._getRenderedTiles();
            await DiscoAnimations.animationSet.longListSelector.in(tiles);
            this._grid?.classList.add('shown');
        });

        return this._openPromise;
    }

    /**
     * @param {{ fromPopState?: boolean }} [options]
     * @returns {Promise<void>}
     */
    async close(options) {
        if (this._resolveSelection && !this._skipResolveOnClose) {
            this._resolveOnce(null);
        }
        this._skipResolveOnClose = false;
        const tiles = this._getRenderedTiles();
        await DiscoAnimations.animationSet.longListSelector.out(tiles);
        this._grid?.classList.remove('shown');
        await super.close(options);
    }

    _getRenderedTiles() {
        if (!this._grid) return [];
        return Array.from(this._grid.querySelectorAll('.long-list-selector-tile'))
            .filter((tile) => tile instanceof HTMLElement);
    }

    /**
     * @param {unknown[]} items
     * @param {DiscoLongListSelectorOptions} [options]
     */
    setData(items, options) {
        this._items = Array.isArray(items) ? items : [];
        if (options && typeof options === 'object') {
            this._options = {
                ...this._options,
                ...options,
                mode: options.mode === 'custom' ? 'custom' : (options.mode === 'auto' ? 'auto' : this._options.mode),
                separators: Array.isArray(options.separators) ? [...options.separators] : this._options.separators
            };
        }
        this.refresh();
    }

    refresh() {
        this._entries = this._buildEntries();
        this._renderEntries();
    }

    _buildContent() {
        if (!this._contentViewport) return;

        this._contentViewport.innerHTML = '';
        this._contentViewport.classList.add('long-list-selector-viewport');

        this._backdrop = document.createElement('div');
        this._backdrop.className = 'long-list-selector-backdrop';
        this._backdrop.addEventListener('click', () => this.close());

        this._panel = document.createElement('div');
        this._panel.className = 'long-list-selector-panel';

        this._scrollView = document.createElement('disco-scroll-view');
        this._scrollView.className = 'long-list-selector-scroll';
        this._scrollView.setAttribute('direction', 'vertical');

        this._grid = document.createElement('div');
        this._grid.className = 'long-list-selector-grid';

        this._scrollView.appendChild(this._grid);
        this._panel.appendChild(this._scrollView);
        this._contentViewport.appendChild(this._backdrop);
        this._contentViewport.appendChild(this._panel);
    }

    _buildEntries() {
        if (this._options.mode === 'custom') {
            return this._buildCustomEntries();
        }
        return this._buildAutoEntries();
    }

    _buildAutoEntries() {
        const allKeys = ['0-9'];
        for (let code = 65; code <= 90; code += 1) {
            allKeys.push(String.fromCharCode(code));
        }
        allKeys.push('&');

        const enabled = new Set();
        this._items.forEach((item) => {
            const label = this._resolveItemLabel(item);
            const key = this._toAutoSeparatorKey(label);
            if (key) enabled.add(key);
        });

        return allKeys.map((key) => ({
            key,
            label: this._mapAutoLabel(key),
            disabled: !enabled.has(key)
        }));
    }

    _buildCustomEntries() {
        const byField = this._items
            .map((item) => this._resolveItemSeparator(item))
            .filter((value) => typeof value === 'string' && value.trim())
            .map((value) => value.trim());

        const fromOptions = Array.isArray(this._options.separators)
            ? this._options.separators.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())
            : [];

        const seen = new Set();
        const ordered = [...fromOptions, ...byField].filter((value) => {
            if (seen.has(value)) return false;
            seen.add(value);
            return true;
        });

        return ordered.map((value) => ({
            key: value,
            label: value,
            disabled: false
        }));
    }

    _resolveItemLabel(item) {
        if (!item || typeof item !== 'object') return '';
        const field = this._options.labelField || 'title';
        const value = item[field];
        return value == null ? '' : String(value);
    }

    _resolveItemSeparator(item) {
        if (!item || typeof item !== 'object') return '';
        const field = this._options.separatorField || 'separator';
        const value = item[field];
        return value == null ? '' : String(value);
    }

    _toAutoSeparatorKey(value) {
        const normalized = (value || '').trim();
        if (!normalized) return null;

        const first = Array.from(normalized)[0]?.toLocaleUpperCase(this._options.locale || 'en') || '';
        if (!first) return null;

        if (/^[0-9]$/.test(first)) return '0-9';
        if (/^[A-Z]$/.test(first)) return first;
        return '&';
    }

    _mapAutoLabel(key) {
        if (key === '0-9') return '#';
        if (key === '&') return '&';
        return key;
    }

    _renderEntries() {
        if (!this._grid) return;

        const customMode = this._options.mode === 'custom';
        this._grid.classList.toggle('custom-mode', customMode);
        this._grid.innerHTML = '';

        this._entries.forEach((entry, index) => {
            const TileCtor = customElements.get('disco-long-list-selector-tile');
            const tile = TileCtor ? new TileCtor() : document.createElement('disco-long-list-selector-tile');
            const rowIndex = Math.floor(index / (customMode ? 1 : 4));
            tile.className = 'long-list-selector-tile';
            tile.style.setProperty('--row-index', String(rowIndex));
            tile.dataset.rowIndex = String(rowIndex);
            tile.textContent = entry.label;

            if (entry.disabled) {
                tile.classList.add('disabled');
                tile.setAttribute('disabled', '');
                tile.setAttribute('aria-disabled', 'true');
                tile.tabIndex = -1;
            } else {
                tile.enableTilt({
                    skipTransformWhenHostDisabled: true,
                    suppressNativeClickOnPress: true
                });
                tile.addEventListener('disco-press', () => this._selectEntry(entry, index));
            }

            this._grid.appendChild(tile);
        });
    }

    async _selectEntry(entry, index) {
        const detail = {
            key: entry.key,
            label: entry.label,
            index
        };

        this.dispatchEvent(new CustomEvent('separatorselect', {
            detail,
            bubbles: true
        }));

        this._skipResolveOnClose = true;
        await this.close();
        this._resolveOnce(entry.key);
    }

    _resolveOnce(value) {
        if (!this._resolveSelection) return;
        const resolver = this._resolveSelection;
        this._resolveSelection = null;
        this._openPromise = null;
        resolver(value);
    }
}

if (!customElements.get('disco-long-list-selector')) {
    customElements.define('disco-long-list-selector', DiscoLongListSelector);
}

export default DiscoLongListSelector;
