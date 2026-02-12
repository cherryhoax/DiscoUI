import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import progressBarStyles from './disco-progress-bar.scss';

/**
 * Progress bar element with determinate and indeterminate modes.
 * @extends DiscoUIElement
 */
class DiscoProgressBar extends DiscoUIElement {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(progressBarStyles, this.shadowRoot);

    this._track = document.createElement('div');
    this._track.className = 'track';

    this._fill = document.createElement('div');
    this._fill.className = 'fill';

    this._dots = document.createElement('div');
    this._dots.className = 'dots';
    for (let i = 0; i < 5; i += 1) {
      const dot = document.createElement('div');
      dot.className = 'dot';
      this._dots.appendChild(dot);
    }

    this._track.appendChild(this._fill);
    this._track.appendChild(this._dots);
    this.shadowRoot.appendChild(this._track);
    this._pendingSync = false;
  }

  connectedCallback() {
    this.setAttribute('role', 'progressbar');
    this._syncAria();
    this._syncFill();
    if (this._pendingSync) {
      this._pendingSync = false;
      this._syncAria();
      this._syncFill();
    }
  }

  static get observedAttributes() {
    return ['value', 'max', 'indeterminate'];
  }

  /**
   * @returns {boolean}
   */
  get indeterminate() {
    return this.hasAttribute('indeterminate');
  }

  /**
   * @param {boolean} next
   */
  set indeterminate(next) {
    if (next) {
      this.setAttribute('indeterminate', '');
    } else {
      this.removeAttribute('indeterminate');
    }
  }

  /**
   * @returns {number}
   */
  get value() {
    const raw = this.getAttribute('value');
    const parsed = raw == null ? 0 : Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /**
   * @param {number} next
   */
  set value(next) {
    if (next == null) {
      this.removeAttribute('value');
      return;
    }
    this.setAttribute('value', String(next));
  }

  /**
   * @returns {number}
   */
  get max() {
    const raw = this.getAttribute('max');
    const parsed = raw == null ? 100 : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
  }

  /**
   * @param {number} next
   */
  set max(next) {
    if (next == null) {
      this.removeAttribute('max');
      return;
    }
    this.setAttribute('max', String(next));
  }

  /**
   * @param {string} _name
   * @param {string | null} _oldValue
   * @param {string | null} _newValue
   */
  attributeChangedCallback(_name, _oldValue, _newValue) {
    if (!this.isConnected) {
      this._pendingSync = true;
      return;
    }
    this._syncAria();
    this._syncFill();
  }

  _syncFill() {
    if (!this._fill) return;
    if (this.indeterminate) {
      this._fill.style.width = '0%';
      return;
    }
    const max = this.max;
    const value = Math.max(0, Math.min(this.value, max));
    const ratio = max === 0 ? 0 : value / max;
    this._fill.style.width = `${ratio * 100}%`;
  }

  _syncAria() {
    if (this.indeterminate) {
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', String(this.max));
      this.removeAttribute('aria-valuenow');
      this.setAttribute('aria-valuetext', 'Loading');
      return;
    }
    const max = this.max;
    const value = Math.max(0, Math.min(this.value, max));
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(max));
    this.setAttribute('aria-valuenow', String(value));
    this.removeAttribute('aria-valuetext');
  }
}

customElements.define('disco-progress-bar', DiscoProgressBar);

export default DiscoProgressBar;
