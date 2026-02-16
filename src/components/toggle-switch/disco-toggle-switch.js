import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import toggleSwitchStyles from './disco-toggle-switch.scss';

class DiscoToggleSwitch extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(toggleSwitchStyles, this.shadowRoot);

    this._switch = document.createElement('div');
    this._switch.className = 'switch';
    this.shadowRoot.appendChild(this._switch);

    this._pointerId = null;
    this._startX = 0;
    this._lastX = 0;
    this._dragging = false;
    this._dragProgress = this.checked ? 1 : 0;
    this._isAnimating = false;
    this._animationFrame = null;

    this._switch.addEventListener('pointerdown', (event) => this._onPointerDown(event));
    this._switch.addEventListener('pointermove', (event) => this._onPointerMove(event));
    this._switch.addEventListener('pointerup', (event) => this._onPointerUp(event));
    this._switch.addEventListener('pointercancel', (event) => this._onPointerCancel(event));

    this.addEventListener('keydown', (event) => {
      if (this.disabled) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        this._setCheckedFromUser(!this.checked);
      }
    });

    this.setAttribute('role', 'switch');
    this.tabIndex = 0;
    this._syncFromAttributes();
  }

  static get observedAttributes() {
    return ['checked', 'disabled'];
  }

  get checked() {
    return this.hasAttribute('checked');
  }

  set checked(next) {
    if (next) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
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
    this.setAttribute('aria-checked', this.checked ? 'true' : 'false');
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
      this.tabIndex = -1;
    } else {
      this.removeAttribute('aria-disabled');
      this.tabIndex = 0;
    }

    if (!this._dragging) {
      this._animateTo(this.checked ? 1 : 0);
    }
  }

  _setCheckedFromUser(nextChecked) {
    const prev = this.checked;
    this.checked = Boolean(nextChecked);
    if (this.checked !== prev) {
      this.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    }
  }

  _applyProgress(progress) {
    const clamped = Math.max(0, Math.min(1, progress));
    this._dragProgress = clamped;
    this.style.setProperty('--transition', String(clamped));
    this.style.setProperty('--transition-flick', '0');
  }

  _clearProgressOverrides() {
    this.style.removeProperty('--transition');
    this.style.removeProperty('--transition-flick');
  }

  _animateTo(target) {
    if (this._isAnimating) {
      if (this._animationFrame) {
        cancelAnimationFrame(this._animationFrame);
      }
      this._isAnimating = false;
    }

    const from = this._dragProgress;
    const to = Math.max(0, Math.min(1, target));
    if (Math.abs(from - to) < 0.001) {
      this._dragProgress = to;
      this._clearProgressOverrides();
      return;
    }

    const start = performance.now();
    const duration = 200;
    this._isAnimating = true;

    const tick = (now) => {
      const t = Math.max(0, Math.min(1, (now - start) / duration));
      const eased = 1 - Math.pow(2, -10 * t);
      this._applyProgress(from + (to - from) * eased);
      if (t < 1) {
        this._animationFrame = requestAnimationFrame(tick);
        return;
      }
      this._isAnimating = false;
      this._dragProgress = to;
      this._clearProgressOverrides();
    };

    this._animationFrame = requestAnimationFrame(tick);
  }

  _onPointerDown(event) {
    if (this.disabled) return;
    this._pointerId = event.pointerId;
    this._startX = event.clientX;
    this._lastX = event.clientX;
    this._dragging = false;
    this._dragProgress = this.checked ? 1 : 0;
    this._switch.setPointerCapture(event.pointerId);
    event.preventDefault();
  }

  _onPointerMove(event) {
    if (this._pointerId !== event.pointerId) return;
    const drag = event.clientX - this._startX;
    this._lastX = event.clientX;
    if (Math.abs(drag) > 3) {
      this._dragging = true;
    }
    const travel = Math.max(1, this._switch.offsetWidth - 20);
    const start = this.checked ? 1 : 0;
    this._applyProgress(start + drag / travel);
  }

  _onPointerUp(event) {
    if (this._pointerId !== event.pointerId) return;
    try {
      this._switch.releasePointerCapture(event.pointerId);
    } catch {
      // noop
    }

    if (this._dragging) {
      const dragDelta = this._lastX - this._startX;
      if (Math.abs(dragDelta) > 0.5) {
        this._setCheckedFromUser(dragDelta > 0);
      }
    } else {
      this._setCheckedFromUser(!this.checked);
    }

    this._pointerId = null;
    this._dragging = false;
    this._animateTo(this.checked ? 1 : 0);
  }

  _onPointerCancel(event) {
    if (this._pointerId !== event.pointerId) return;
    this._pointerId = null;
    this._dragging = false;
    this._animateTo(this.checked ? 1 : 0);
  }
}

if (!customElements.get('disco-toggle-switch')) {
  customElements.define('disco-toggle-switch', DiscoToggleSwitch);
}

export default DiscoToggleSwitch;
