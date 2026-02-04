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
   */
  enableTilt(options = {}) {
    this.tiltEnabled = true;

    const { selector = null, tiltMultiplier = 1, margin = 20, pressDown = 10, keyPress = true } = options;
    const target =
      (selector
        ? (this.shadowRoot?.querySelector(selector) ?? this.querySelector(selector))
        : null) || this;
    if (selector && target === this) {
      console.warn(`enableTilt: selector "${selector}" not found in shadowRoot or light DOM; falling back to host.`);
    }
    target.setAttribute('data-tilt', '');
    let keyPressActive = false;

    const getTiltBoost = (rect) => {
      const widthBoost = rect.width > 0 ? Math.min(3, 120 / rect.width) : 1;
      const heightBoost = rect.height > 0 ? Math.min(3, 120 / rect.height) : 1;
      return { widthBoost, heightBoost };
    };

    const downHandler = (e) => {
      this.canClick = true;
      this.setPointerCapture(e.pointerId); // Parmağı/Mouse'u dışarı kaydırsan bile takibi bırakmaz
      this.setPressed(target, true);

      const rect = this.getBoundingClientRect();
      const x = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const y = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const { widthBoost, heightBoost } = getTiltBoost(rect);
      target.style.transform = `translateZ(${-pressDown}px) rotateX(${-x * tiltMultiplier * widthBoost}deg) rotateY(${y * tiltMultiplier * heightBoost}deg)`;

    };

    const upHandler = () => {
      this.setPressed(target, false);

      target.style.transform = `translateZ(0px) rotateX(0deg) rotateY(0deg)`;
    };

    const keyDownHandler = (event) => {
      if (!keyPress) return;
      if (event.key !== ' ' && event.key !== 'Enter') return;
      if (keyPressActive) return;
      keyPressActive = true;
      this.setPressed(target, true);
      target.style.transform = `translateZ(${-pressDown}px)`;
    };

    const keyUpHandler = (event) => {
      if (!keyPress) return;
      if (event.key !== ' ' && event.key !== 'Enter') return;
      keyPressActive = false;
      this.setPressed(target, false);
      target.style.transform = `translateZ(0px)`;
    };

    this.addEventListener('pointerdown', downHandler);
    this.addEventListener('pointerup', upHandler);
    this.addEventListener('keydown', keyDownHandler);
    this.addEventListener('keyup', keyUpHandler);
    this.addEventListener('pointercancel', () => this.setPressed(target, false));
    this.addEventListener('pointermove', (e) => {
      //update tilt
      if (!this.hasPointerCapture(e.pointerId)) return;

      const rect = this.getBoundingClientRect();
      const x = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      const y = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const { widthBoost, heightBoost } = getTiltBoost(rect);
      target.style.transform = `translateZ(${pressDown}) rotateX(${-x * tiltMultiplier * widthBoost}deg) rotateY(${y * tiltMultiplier * heightBoost}deg)`;


      // detect if pointer is outside the element 10px margin
      if (
        e.clientX < rect.left - margin ||
        e.clientX > rect.right + margin ||
        e.clientY < rect.top - margin ||
        e.clientY > rect.bottom + margin
      ) {
        upHandler();
        this.canClick = false;
      }
    })
    this.addEventListener('click', (e) => {
      if (!this.canClick) {
        console.info('Click cancelled due to pointer move outside element.');
        e.stopImmediatePropagation();
        e.preventDefault();
      }
    });
  }
}

export default DiscoUIElement;
