import baseStyles from './disco-ui-element.scss';

/**
 * Base class for Disco UI custom elements.
 */
class DiscoUIElement extends HTMLElement {
  constructor() {
    super();
    this.loadStyle(baseStyles);
    this.canClick = true;
    this.tiltEnabled = false;
  }

  /**
   * @param {string} styleText
   * @param {Document['head'] | ShadowRoot} [target]
   */
  loadStyle(styleText, target = document.head) {
    if (!styleText || !target) return;

    if (target === document.head) {
      const ctor = /** @type {typeof DiscoUIElement & { _styleCache?: Set<string> }} */ (DiscoUIElement);
      const cache = ctor._styleCache || (ctor._styleCache = new Set());
      if (cache.has(styleText)) return;
      const style = document.createElement('style');
      style.textContent = styleText;
      document.head.appendChild(style);
      cache.add(styleText);
      return;
    }

    const ctor = /** @type {typeof DiscoUIElement & { _shadowStyleCache?: WeakMap<ShadowRoot, Set<string>> }} */ (
      DiscoUIElement
    );
    const shadowCache = ctor._shadowStyleCache || (ctor._shadowStyleCache = new WeakMap());
    const shadowTarget = /** @type {ShadowRoot} */ (target);
    const existing = shadowCache.get(shadowTarget) || new Set();
    if (existing.has(styleText)) return;
    const style = document.createElement('style');
    style.textContent = styleText;
    target.appendChild(style);
    existing.add(styleText);
    shadowCache.set(shadowTarget, existing);
  }

  /**
   * @param {boolean} isPressed
   */
  setPressed(target, isPressed) {
    if (isPressed) {
      target.setAttribute('data-pressed', '');
      this.canClick = true;
    } else {
      target.removeAttribute('data-pressed');
    }
  }

  /**
   * Enable pointer tilt interaction on the element.
    * @param {{
    *  selector?: string | null,
    *  tiltMultiplier?: number,
    *  margin?: number,
    *  pressDown?: number,
    *  keyPress?: boolean,
    *  skipTransformWhenHostDisabled?: boolean,
    *  suppressNativeClickOnPress?: boolean
    * }} [options]
   */
  enableTilt(options = {}) {
    if (this._tiltHandlers) return;
    this.tiltEnabled = true;

    const {
      selector = null,
      tiltMultiplier = 2,
      margin = 20,
      pressDown = 20,
      keyPress = true,
      skipTransformWhenHostDisabled = false,
      suppressNativeClickOnPress = false
    } = options;
    const target =
      (selector
        ? (this.shadowRoot?.querySelector(selector) ?? this.querySelector(selector))
        : null) || this;
    if (selector && target === this) {
      console.warn(`enableTilt: selector "${selector}" not found in shadowRoot or light DOM; falling back to host.`);
    }
    target.setAttribute('data-tilt', '');
    let keyPressActive = false;
    let suppressClickOnce = false;
    let startX = 0;
    let startY = 0;
    let scrollParent = null;

    const emitDiscoPress = (originalEvent, source) => {
      if (this.hasAttribute('disabled')) return;
      this.dispatchEvent(new CustomEvent('disco-press', {
        bubbles: true,
        composed: true,
        detail: {
          source,
          originalEvent,
          target
        }
      }));
    };

    const canApplyTransform = () => !(skipTransformWhenHostDisabled && this.hasAttribute('disabled'));

    const getTiltBoost = (rect) => {
      const widthBoost = rect.width > 0 ? Math.min(3, 120 / rect.width) : 1;
      const heightBoost = rect.height > 0 ? Math.min(3, 120 / rect.height) : 1;
      return { widthBoost, heightBoost };
    };

    const resetTiltState = () => {
      if (canApplyTransform()) {
        target.style.transform = 'translateZ(0px) rotateX(0deg) rotateY(0deg)';
      }

      this.setPressed(target, false);
    };

    const downHandler = (e) => {
      this.canClick = true;
      startX = e.clientX;
      startY = e.clientY;
      scrollParent = this.closest('disco-scroll-view, disco-list-view');
      this.setPointerCapture(e.pointerId); // Parmağı/Mouse'u dışarı kaydırsan bile takibi bırakmaz
      this.setPressed(target, true);

      const rect = this.getBoundingClientRect();
      const x = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const y = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const { widthBoost, heightBoost } = getTiltBoost(rect);
      if (canApplyTransform()) {
        target.style.transform = `translateZ(${-pressDown}px) rotateX(${-x * tiltMultiplier * widthBoost}deg) rotateY(${y * tiltMultiplier * heightBoost}deg)`;
      }

    };

    const upHandler = (e) => {
      const shouldEmitPress = target.hasAttribute('data-pressed') && this.canClick;
      resetTiltState();
      if (shouldEmitPress) {
        if (suppressNativeClickOnPress) {
          suppressClickOnce = true;
        }
        emitDiscoPress(e, 'pointer');
      }
    };

    const keyDownHandler = (event) => {
      if (!keyPress) return;
      if (event.key !== ' ' && event.key !== 'Enter') return;
      if (keyPressActive) return;
      keyPressActive = true;
      this.setPressed(target, true);
      if (canApplyTransform()) {
        target.style.transform = `translateZ(${-pressDown}px)`;
      }
    };

    const keyUpHandler = (event) => {
      if (!keyPress) return;
      if (event.key !== ' ' && event.key !== 'Enter') return;
      keyPressActive = false;
      this.setPressed(target, false);
      if (canApplyTransform()) {
        target.style.transform = `translateZ(0px)`;
      }
      emitDiscoPress(event, 'keyboard');
    };

    const cancelHandler = () => {
      if (target.hasAttribute('data-pressed')) resetTiltState();
    };
    const lostCaptureHandler = () => {
      if (target.hasAttribute('data-pressed')) resetTiltState();
    };
    const moveHandler = (e) => {
      //update tilt
      if (!this.hasPointerCapture(e.pointerId)) return;

      if (scrollParent) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.hypot(dx, dy) > 5) {
          resetTiltState();
          this.canClick = false;
          this.releasePointerCapture(e.pointerId);
          return;
        }
      }

      const rect = this.getBoundingClientRect();
      const isOutside =
        e.clientX < rect.left - margin ||
        e.clientX > rect.right + margin ||
        e.clientY < rect.top - margin ||
        e.clientY > rect.bottom + margin;

      if (isOutside) {
        if (this.canClick) {
          resetTiltState();
          this.canClick = false;
        }
        return;
      }

      if (!this.canClick) {
        this.setPressed(target, true);
        this.canClick = true;
      }

      const x = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const y = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const { widthBoost, heightBoost } = getTiltBoost(rect);
      if (canApplyTransform()) {
        target.style.transform = `translateZ(${-pressDown}px) rotateX(${-x * tiltMultiplier * widthBoost}deg) rotateY(${y * tiltMultiplier * heightBoost}deg)`;
      }
    };
    const clickGuardHandler = (e) => {
      if (suppressClickOnce) {
        suppressClickOnce = false;
        e.stopImmediatePropagation();
        e.preventDefault();
        return;
      }

      if (!this.canClick) {
        console.info('Click cancelled due to pointer move outside element.');
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    };

    this.addEventListener('pointerdown', downHandler);
    this.addEventListener('pointerup', upHandler);
    this.addEventListener('keydown', keyDownHandler);
    this.addEventListener('keyup', keyUpHandler);
    this.addEventListener('pointercancel', cancelHandler);
    this.addEventListener('lostpointercapture', lostCaptureHandler);
    this.addEventListener('pointermove', moveHandler);
    this.addEventListener('click', clickGuardHandler);

    this._tiltTarget = target;
    this._tiltHandlers = {
      downHandler,
      upHandler,
      keyDownHandler,
      keyUpHandler,
      cancelHandler,
      lostCaptureHandler,
      moveHandler,
      clickGuardHandler
    };
  }

  disableTilt() {
    if (!this._tiltHandlers) return;
    const target = this._tiltTarget || this;
    const {
      downHandler,
      upHandler,
      keyDownHandler,
      keyUpHandler,
      cancelHandler,
      lostCaptureHandler,
      moveHandler,
      clickGuardHandler
    } = this._tiltHandlers;

    this.removeEventListener('pointerdown', downHandler);
    this.removeEventListener('pointerup', upHandler);
    this.removeEventListener('keydown', keyDownHandler);
    this.removeEventListener('keyup', keyUpHandler);
    this.removeEventListener('pointercancel', cancelHandler);
    this.removeEventListener('lostpointercapture', lostCaptureHandler);
    this.removeEventListener('pointermove', moveHandler);
    this.removeEventListener('click', clickGuardHandler);

    this.setPressed(target, false);
    target.style.transform = 'translateZ(0px) rotateX(0deg) rotateY(0deg)';
    target.removeAttribute('data-tilt');
    this.tiltEnabled = false;
    this._tiltHandlers = null;
    this._tiltTarget = null;
  }
}

export default DiscoUIElement;
