import appStyles from './disco-app.scss';
import './disco-frame.js';
import './disco-splash.js';
/** @typedef {import('./disco-splash.d.ts').DiscoSplashElement} DiscoSplashElement */

/**
 * @typedef {'none' | 'auto' | 'manual'} SplashMode
 */

/**
 * @typedef {Object} DiscoSplashConfig
 * @property {SplashMode} [mode]
 * @property {string | null} [color]
 * @property {string | HTMLElement | null} [icon]
 * @property {boolean} [showProgress]
 * @property {string | null} [progressColor]
 */

/**
 * @typedef {Object} DiscoAppConfig
 * @property {string} [accent]
 * @property {'dark' | 'light' | 'auto'} [theme]
 * @property {string | null} [font]
 * @property {string | HTMLElement | null} [icon]
 * @property {DiscoSplashConfig | SplashMode} [splash]
 * @property {string | null} [statusBarColor]
 * @property {string | null} [navBarColor]
 * @property {string | number | null} [scale]
 */


const injectThemeStyles = (() => {
  let injected = false;
  return () => {
    if (injected) return;
    const style = document.createElement('style');
    style.textContent = appStyles;
    document.head.appendChild(style);
    injected = true;
  };
})();

const injectFontStyles = (() => {
  let injected = false;
  return () => {
    if (injected) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap';
    document.head.appendChild(link);
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://fonts.googleapis.com';
    document.head.appendChild(preconnect);
    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'anonymous';
    document.head.appendChild(preconnect2);
    injected = true;
  };
})();

injectThemeStyles();
injectFontStyles();

/**
 * App-level orchestrator for Disco UI themes and boot flow.
 * @public
 */
class DiscoApp {
  /**
   * Run a callback once the DOM is ready.
   * @param {() => void} callback
   */
  static ready(callback) {
    if (typeof callback !== 'function') return;
    const run = () => {
      if (document.fonts && typeof document.fonts.ready?.then === 'function') {
        document.fonts.ready.then(() => callback());
      } else {
        callback();
      }
    };
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', run);
    } else {
      run();
    }
  }

  /**
   * @param {DiscoAppConfig} [config]
   */
  constructor(config = {}) {
    const root = document.documentElement;
    const attrTheme = root.getAttribute('disco-theme');
    const attrAccent = root.getAttribute('disco-accent');
    const attrFont = root.getAttribute('disco-font');
    const attrStatusBarColor = root.getAttribute('disco-status-bar-color');
    const attrNavBarColor = root.getAttribute('disco-nav-bar-color');
    const attrScale = root.getAttribute('disco-scale');

    this._accent = config.accent || attrAccent || '#D80073'; // Classic WP Magenta
    this._theme = config.theme || attrTheme || 'dark';
    this._font = config.font || attrFont || null;
    this._icon = config.icon || null; // Optional splash foreground (URL or HTMLElement)
    this._statusBarColor = config.statusBarColor ?? attrStatusBarColor ?? null;
    this._navBarColor = config.navBarColor ?? attrNavBarColor ?? null;

    // Normalize splash config
    let splashConfig = { mode: 'auto', color: null, icon: null, showProgress: true, progressColor: '#fff' };
    if (typeof config.splash === 'string') {
      splashConfig.mode = config.splash;
    } else if (typeof config.splash === 'object' && config.splash !== null) {
      splashConfig = { ...splashConfig, ...config.splash };
    }

    this.splashConfig = splashConfig;
    this.splashState = { setup: false, ready: false };
    /** @type {DiscoSplashElement | null} */
    this.splash = null;
    injectThemeStyles();
    injectFontStyles();
    this.initTheme();
    this.initInsets();
    if (config.scale !== undefined && config.scale !== null) {
      this.scale = config.scale;
    } else if (attrScale) {
      this.scale = attrScale;
    }
  }

  initTheme() {
    const root = document.documentElement;
    root.setAttribute('disco-theme', this._theme);
    root.setAttribute('disco-accent', this._accent);
    if (this._font) {
      root.setAttribute('disco-font', this._font);
    }
  }

  initInsets() {
    const root = document.documentElement;
    if (this._statusBarColor) {
      root.setAttribute('disco-status-bar-color', this._statusBarColor);
    }
    if (this._navBarColor) {
      root.setAttribute('disco-nav-bar-color', this._navBarColor);
    }
  }

  /**
   * Set safe area inset values (in px).
   * @param {{ top?: number | string | null, right?: number | string | null, bottom?: number | string | null, left?: number | string | null }} insets
   */
  setInsets(insets = {}) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const { top, right, bottom, left } = insets;
    const applyInset = (name, value) => {
      if (value === null || value === undefined || value === '') {
        root.removeAttribute(name);
        return;
      }
      root.setAttribute(name, String(value));
    };
    applyInset('disco-inset-top', top);
    applyInset('disco-inset-right', right);
    applyInset('disco-inset-bottom', bottom);
    applyInset('disco-inset-left', left);
  }

  /**
   * @returns {CSSStyleDeclaration | null}
   */
  #getRootStyles() {
    if (typeof document === 'undefined') return null;
    return getComputedStyle(document.documentElement);
  }

  /**
   * @param {string} name
   * @param {string} [fallback]
   * @returns {string}
   */
  #readVar(name, fallback) {
    const styles = this.#getRootStyles();
    if (!styles) return '';
    const value = styles.getPropertyValue(name).trim();
    if (value) return value;
    if (fallback) return styles.getPropertyValue(fallback).trim();
    return '';
  }

  /**
   * @param {string} color
   * @returns {string}
   */
  #normalizeColor(color) {
    const value = color.trim();
    if (!value) return '';
    const normalized = value.replace(/\s+/g, ' ').toLowerCase();
    if (normalized === 'rgb(0 0 0)' || normalized === 'rgb(0, 0, 0)') return 'black';
    if (normalized === 'rgb(255 255 255)' || normalized === 'rgb(255, 255, 255)') return 'white';
    const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/);
    if (!rgbMatch) return value;
    const parts = rgbMatch[1]
      .split(/[,\s]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => Number.parseFloat(part));
    if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return value;
    const toHex = (num) => {
      const clamped = Math.min(255, Math.max(0, Math.round(num)));
      return clamped.toString(16).padStart(2, '0');
    };
    return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`;
  }

  /**
   * Computed background color from `:root`.
   * @returns {string}
   */
  get background() {
    return this.#normalizeColor(this.#readVar('--disco-background'));
  }

  /**
   * Computed foreground color from `:root`.
   * @returns {string}
   */
  get foreground() {
    return this.#normalizeColor(this.#readVar('--disco-foreground'));
  }

  /**
   * Computed accent color from `:root`.
   * @returns {string}
   */
  get accent() {
    return this.#readVar('--disco-accent');
  }

  /**
   * @param {string | null} value
   */
  set accent(value) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!value) {
      this._accent = '';
      root.removeAttribute('disco-accent');
      return;
    }
    this._accent = value;
    root.setAttribute('disco-accent', value);
  }

  /**
   * Computed font family from `:root`.
   * @returns {string}
   */
  get font() {
    return this.#readVar('--disco-font');
  }

  /**
   * @param {string | null} value
   */
  set font(value) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!value) {
      this._font = null;
      root.removeAttribute('disco-font');
      return;
    }
    this._font = value;
    root.setAttribute('disco-font', value);
  }

  /**
   * Computed theme value from `:root`.
   * @returns {string}
   */
  get theme() {
    return this.#readVar('--disco-theme');
  }

  /**
   * @param {'dark' | 'light' | 'auto' | string | null} value
   */
  set theme(value) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (!value) {
      this._theme = '';
      root.removeAttribute('disco-theme');
      return;
    }
    this._theme = value;
    root.setAttribute('disco-theme', value);
  }

  /**
   * Computed scale value from `:root`.
   * @returns {number}
   */
  get scale() {
    const value = this.#readVar('--disco-scale');
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0.8 : parsed;
  }

  /**
   * @param {string | number | null} value
   */
  set scale(value) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (value === null || value === undefined || value === '') {
      this._scale = 0.8;
      root.setAttribute('disco-scale', String(0.8));
      return;
    }
    this._scale = String(value);
    root.setAttribute('disco-scale', String(value));
  }

  /**
   * Computed layout width (viewport width divided by scale).
   * @returns {number}
   */
  get width() {
    if (typeof window === 'undefined') return 0;
    const scale = this.scale || 1;
    return window.innerWidth / scale;
  }

  /**
   * Computed layout height (viewport height divided by scale).
   * @returns {number}
   */
  get height() {
    if (typeof window === 'undefined') return 0;
    const scale = this.scale || 1;
    return window.innerHeight / scale;
  }

  /**
   * Computed perspective depth based on layout width.
   * @returns {string}
   */
  get perspective() {
    return `${this.width * 4}px`;
  }

  /**
   * @param {HTMLElement} frame
   */
  launch(frame) {
    this.rootFrame = frame;
    this.splash = this.buildSplash();

    // Ensure all pages are hidden initially
    Array.from(this.rootFrame.children).forEach((page) => {
      page.setAttribute('hidden', '');
      page.setAttribute('aria-hidden', 'true');
    });

    if (this.splash) {
      document.body.appendChild(this.splash);
      // Remove frame from DOM entirely while splash is showing to prevent paint flashes
      if (this.rootFrame.parentNode) {
        this.rootFrame.remove();
      }
    } else {
      // No splash, ensuring frame is in DOM
      if (!this.rootFrame.parentNode) {
        document.body.appendChild(this.rootFrame);
      }
      this.rootFrame.setAttribute('disco-launched', 'true');
    }

    if (this.splash && this.splashConfig.mode === 'auto') {
      requestAnimationFrame(() => {
        this.dismissSplash();
      });
    }
  }

  /**
   * @returns {DiscoSplashElement | null}
   */
  buildSplash() {
    const { mode, color, icon, showProgress, progressColor } = this.splashConfig;

    if (mode === 'none') return null;
    // If no icon (configured in splash or global) and no accent, we can still show splash if specifically requested, but standard logic was:
    const effectiveIcon = icon || this._icon;
    if (!effectiveIcon && !this._accent && !color) return null;

    /** @type {DiscoSplashElement} */
    const splash = /** @type {DiscoSplashElement} */ (
      /** @type {HTMLElement} */ (document.createElement('disco-splash'))
    );

    // Apply color (background)
    // If explicit color is set, use it. Otherwise, disco-splash uses var(--disco-accent) by default via CSS.
    if (color) {
      splash.setAttribute('color', color);
    }

    // Apply Icon
    if (typeof effectiveIcon === 'string') {
      splash.setAttribute('logo', effectiveIcon);
    } else if (effectiveIcon instanceof HTMLElement) {
      splash.logoNode = effectiveIcon;
    }

    // Apply Progress
    if (showProgress) {
      splash.setAttribute('show-progress', '');
      splash.setAttribute('progress-color', progressColor || '#fff');
    }

    return splash;
  }

  setupSplash() {
    // Deprecated: No-op
  }

  async dismissSplash() {
    if (!this.splash) {
        // If no splash, ensure frame is just visible (fallback)
        if (this.rootFrame && !this.rootFrame.hasAttribute('disco-launched')) {
            if (!this.rootFrame.parentNode) {
                document.body.appendChild(this.rootFrame);
            }
            this.rootFrame.setAttribute('disco-launched', 'true');
        }
        return;
    }

    // Prepare frame before dismissing splash
    if (this.rootFrame) {
        // Ensure frame is in DOM
        if (!this.rootFrame.parentNode) {
            document.body.insertBefore(this.rootFrame, this.splash);
        }
        // Make it visible (display: flex via css)
        this.rootFrame.setAttribute('disco-launched', 'true');
    }

    // Await exit animation
    if (typeof this.splash.dismiss === 'function') {
        await this.splash.dismiss();
    } else {
        this.splash.remove();
    }
    this.splash = null;
  }

  // Deprecated internal method
  maybeDismissSplash() {}
}

/**
 * Read-only delegate for app-level layout and theme values.
 * @public
 */
class DiscoAppDelegate {
  /**
   * @returns {CSSStyleDeclaration | null}
   */
  static #getRootStyles() {
    if (typeof document === 'undefined') return null;
    return getComputedStyle(document.documentElement);
  }

  /**
   * @param {string} name
   * @returns {string}
   */
  static #readVar(name) {
    const styles = this.#getRootStyles();
    if (!styles) return '';
    return styles.getPropertyValue(name).trim();
  }

  /**
   * @param {string} color
   * @returns {string}
   */
  static #normalizeColor(color) {
    const value = color.trim();
    if (!value) return '';
    const normalized = value.replace(/\s+/g, ' ').toLowerCase();
    if (normalized === 'rgb(0 0 0)' || normalized === 'rgb(0, 0, 0)') return 'black';
    if (normalized === 'rgb(255 255 255)' || normalized === 'rgb(255, 255, 255)') return 'white';
    const rgbMatch = normalized.match(/^rgba?\(([^)]+)\)$/);
    if (!rgbMatch) return value;
    const parts = rgbMatch[1]
      .split(/[,\s]+/)
      .filter(Boolean)
      .slice(0, 3)
      .map((part) => Number.parseFloat(part));
    if (parts.length < 3 || parts.some((part) => Number.isNaN(part))) return value;
    const toHex = (num) => {
      const clamped = Math.min(255, Math.max(0, Math.round(num)));
      return clamped.toString(16).padStart(2, '0');
    };
    return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`;
  }

  /** @returns {'black' | 'white' | string} */
  static get background() {
    return this.#normalizeColor(this.#readVar('--disco-background'));
  }

  /** @returns {'black' | 'white' | string} */
  static get foreground() {
    return this.#normalizeColor(this.#readVar('--disco-foreground'));
  }

  /** @returns {string} */
  static get accent() {
    return this.#readVar('--disco-accent');
  }

  /** @returns {string} */
  static get font() {
    return this.#readVar('--disco-font');
  }

  /** @returns {string} */
  static get theme() {
    return this.#readVar('--disco-theme');
  }

  /** @returns {number} */
  static get scale() {
    const value = this.#readVar('--disco-scale');
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }

  /** @returns {number} */
  static get width() {
    if (typeof window === 'undefined') return 0;
    const scale = this.scale || 1;
    return window.innerWidth / scale;
  }

  /** @returns {number} */
  static get height() {
    if (typeof window === 'undefined') return 0;
    const scale = this.scale || 1;
    return window.innerHeight / scale;
  }

  /** @returns {string} */
  static get perspective() {
    return `${this.width * 4}px`;
  }
}

export { DiscoAppDelegate };
export default DiscoApp;
