import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import progressRingStyles from './disco-progress-ring.scss';

class DiscoProgressRing extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(progressRingStyles, this.shadowRoot);

    this._loader = document.createElement('div');
    this._loader.className = 'loader';

    for (let index = 0; index < 5; index += 1) {
      const circle = document.createElement('div');
      circle.className = 'circle';
      this._loader.appendChild(circle);
    }

    const ns = 'http://www.w3.org/2000/svg';
    this._ring = document.createElementNS(ns, 'svg');
    this._ring.setAttribute('viewBox', '0 0 40 40');
    this._ring.classList.add('ring');

    this._track = document.createElementNS(ns, 'circle');
    this._track.setAttribute('cx', '20');
    this._track.setAttribute('cy', '20');
    this._track.setAttribute('r', '16');
    this._track.classList.add('ring-track');

    this._value = document.createElementNS(ns, 'circle');
    this._value.setAttribute('cx', '20');
    this._value.setAttribute('cy', '20');
    this._value.setAttribute('r', '16');
    this._value.classList.add('ring-value');

    this._ring.appendChild(this._track);
    this._ring.appendChild(this._value);

    this.shadowRoot.appendChild(this._loader);
    this.shadowRoot.appendChild(this._ring);
    this.setAttribute('role', 'progressbar');
    this._stopAfterCycle = false;
    this._stopPromise = null;
    this._resolveStopPromise = null;
    this._stopTimeout = null;
    this._lastIndeterminate = this.indeterminate;
    this._onCircleIteration = this._onCircleIteration.bind(this);

    const firstCircle = this._loader.querySelector('.circle');
    if (firstCircle) {
      firstCircle.addEventListener('animationiteration', this._onCircleIteration);
    }

    if (!this.hasAttribute('indeterminate') && !this.hasAttribute('value')) {
      this.setAttribute('indeterminate', '');
    }
    this._syncState();
  }

  static get observedAttributes() {
    return ['indeterminate', 'value', 'max', 'color-mode', 'foreground'];
  }

  get indeterminate() {
    return this.hasAttribute('indeterminate');
  }

  set indeterminate(next) {
    if (next) {
      this.setAttribute('indeterminate', '');
    } else {
      this.removeAttribute('indeterminate');
    }
  }

  get value() {
    const raw = this.getAttribute('value');
    const parsed = raw == null ? 0 : Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  set value(next) {
    this.setAttribute('value', String(next));
  }

  get max() {
    const raw = this.getAttribute('max');
    const parsed = raw == null ? 100 : Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 100;
  }

  set max(next) {
    this.setAttribute('max', String(next));
  }

  get colorMode() {
    if (this.hasAttribute('foreground')) return 'foreground';
    const mode = (this.getAttribute('color-mode') || '').toLowerCase();
    return mode === 'foreground' ? 'foreground' : 'accent';
  }

  set colorMode(value) {
    const mode = value === 'foreground' ? 'foreground' : 'accent';
    this.setAttribute('color-mode', mode);
  }

  attributeChangedCallback() {
    const isIndeterminate = this.indeterminate;
    if (!this._lastIndeterminate && isIndeterminate) {
      this._stopAfterCycle = false;
      this._clearStopTimeout();
      this._resolvePendingStop();
      this._resetIndeterminateAnimations();
    }

    if (this._lastIndeterminate && !isIndeterminate) {
      this._stopAfterCycle = false;
      this._clearStopTimeout();
      this._resolvePendingStop();
    }

    this._lastIndeterminate = isIndeterminate;
    this._syncState();
  }

  disconnectedCallback() {
    this._clearStopTimeout();
    this._resolvePendingStop();

    const firstCircle = this._loader?.querySelector('.circle');
    if (firstCircle) {
      firstCircle.removeEventListener('animationiteration', this._onCircleIteration);
    }
  }

  startIndeterminate() {
    this._stopAfterCycle = false;
    this._clearStopTimeout();
    this._resolvePendingStop();

    if (!this.indeterminate) {
      this.setAttribute('indeterminate', '');
      return;
    }
  }

  stopIndeterminate(options = {}) {
    const graceful = options.graceful !== false;

    if (!this.indeterminate) {
      return Promise.resolve();
    }

    if (!graceful) {
      this._stopAfterCycle = false;
      this._clearStopTimeout();
      this._resolvePendingStop();
      this.removeAttribute('indeterminate');
      return Promise.resolve();
    }

    if (this._stopPromise) {
      return this._stopPromise;
    }

    this._stopAfterCycle = true;
    this._stopPromise = new Promise((resolve) => {
      this._resolveStopPromise = resolve;
    });

    this._stopTimeout = window.setTimeout(() => {
      this._finishGracefulStop();
    }, 5700);

    return this._stopPromise;
  }

  _onCircleIteration() {
    if (!this._stopAfterCycle) return;
    this._finishGracefulStop();
  }

  _finishGracefulStop() {
    if (!this.indeterminate) {
      this._stopAfterCycle = false;
      this._clearStopTimeout();
      this._resolvePendingStop();
      return;
    }

    this._stopAfterCycle = false;
    this._clearStopTimeout();
    this.removeAttribute('indeterminate');
    this._resolvePendingStop();
  }

  _resetIndeterminateAnimations() {
    const circles = Array.from(this._loader.querySelectorAll('.circle'));
    circles.forEach((circle) => {
      circle.style.animation = 'none';
    });
    this._loader.offsetWidth;
    circles.forEach((circle) => {
      circle.style.removeProperty('animation');
    });
  }

  _clearStopTimeout() {
    if (this._stopTimeout == null) return;
    window.clearTimeout(this._stopTimeout);
    this._stopTimeout = null;
  }

  _resolvePendingStop() {
    if (!this._resolveStopPromise) {
      this._stopPromise = null;
      return;
    }
    const resolve = this._resolveStopPromise;
    this._resolveStopPromise = null;
    this._stopPromise = null;
    resolve();
  }

  _syncState() {
    this.style.setProperty('--disco-progress-ring-color', this.colorMode === 'foreground' ? 'var(--disco-foreground)' : 'var(--disco-accent)');

    if (this.indeterminate) {
      this.setAttribute('aria-valuetext', 'Loading');
      this.removeAttribute('aria-valuenow');
      this.setAttribute('aria-valuemin', '0');
      this.setAttribute('aria-valuemax', String(this.max));
      return;
    }

    const max = this.max;
    const value = Math.max(0, Math.min(this.value, max));
    const ratio = max === 0 ? 0 : value / max;
    const radius = 16;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - ratio);

    this._value.style.strokeDasharray = String(circumference);
    this._value.style.strokeDashoffset = String(offset);

    this.removeAttribute('aria-valuetext');
    this.setAttribute('aria-valuemin', '0');
    this.setAttribute('aria-valuemax', String(max));
    this.setAttribute('aria-valuenow', String(value));
  }
}

if (!customElements.get('disco-progress-ring')) {
  customElements.define('disco-progress-ring', DiscoProgressRing);
}

export default DiscoProgressRing;
