import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import sliderStyles from './disco-slider.scss';

class DiscoSlider extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(sliderStyles, this.shadowRoot);

    this._input = document.createElement('input');
    this._input.type = 'range';
    this._input.className = 'slider';
    this.shadowRoot.appendChild(this._input);

    this._input.addEventListener('input', () => {
      this.setAttribute('value', this._input.value);
      this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    });

    this._input.addEventListener('change', () => {
      this.setAttribute('value', this._input.value);
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    });

  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();
    this.setAttribute('role', 'slider');
    this._syncFromAttributes();
  }

  static get observedAttributes() {
    return ['min', 'max', 'step', 'value', 'disabled'];
  }

  get min() {
    return this.getAttribute('min') ?? '0';
  }

  set min(value) {
    this.setAttribute('min', String(value));
  }

  get max() {
    return this.getAttribute('max') ?? '100';
  }

  set max(value) {
    this.setAttribute('max', String(value));
  }

  get step() {
    return this.getAttribute('step') ?? '1';
  }

  set step(value) {
    this.setAttribute('step', String(value));
  }

  get value() {
    return this.getAttribute('value') ?? '0';
  }

  set value(next) {
    this.setAttribute('value', String(next));
  }

  get disabled() {
    return this.hasAttribute('disabled');
  }

  set disabled(next) {
    if (next) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
    }
  }

  attributeChangedCallback() {
    this._syncFromAttributes();
  }

  _syncFromAttributes() {
    if (!this._input) return;

    this._input.min = this.min;
    this._input.max = this.max;
    this._input.step = this.step;
    this._input.value = this.value;
    this._input.disabled = this.disabled;

    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }

    this._updateVisualState();
  }

  _updateVisualState() {
    if (!this._input) return;

    const min = Number.parseFloat(this._input.min);
    const max = Number.parseFloat(this._input.max);
    const value = Number.parseFloat(this._input.value);
    const safeMin = Number.isFinite(min) ? min : 0;
    const safeMax = Number.isFinite(max) ? max : 100;
    const range = Math.max(1, safeMax - safeMin);
    const safeValue = Number.isFinite(value) ? value : safeMin;
    const clamped = Math.min(safeMax, Math.max(safeMin, safeValue));
    const percentage = ((clamped - safeMin) / range) * 100;

    const step = Number.parseFloat(this._input.step);
    const stepPct = Number.isFinite(step) && step > 0 ? (step / range) * 100 : 1;

    this._input.style.setProperty('--percentage', `${percentage}%`);
    this._input.style.setProperty('--step', `${Math.max(stepPct, 0.1)}%`);
    this.setAttribute('aria-valuemin', String(safeMin));
    this.setAttribute('aria-valuemax', String(safeMax));
    this.setAttribute('aria-valuenow', String(clamped));
  }
}

if (!customElements.get('disco-slider')) {
  customElements.define('disco-slider', DiscoSlider);
}

export default DiscoSlider;
