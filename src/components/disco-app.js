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
 * @property {number} [insetTop]
 * @property {number} [insetBottom]
 * @property {number} [insetLeft]
 * @property {number} [insetRight]
 * @property {string} [statusBarColor]
 * @property {string} [navBarColor]
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
    const attrInsetTop = root.getAttribute('disco-inset-top');
    const attrInsetBottom = root.getAttribute('disco-inset-bottom');
    const attrInsetLeft = root.getAttribute('disco-inset-left');
    const attrInsetRight = root.getAttribute('disco-inset-right');

    this._accent = config.accent || attrAccent || '#D80073'; // Classic WP Magenta
    this._theme = config.theme || attrTheme || 'dark';
    this._font = config.font || attrFont || null;
    this._icon = config.icon || null; // Optional splash foreground (URL or HTMLElement)

    // Inset values
    this._insetTop = config.insetTop ?? (attrInsetTop ? parseFloat(attrInsetTop) : 0);
    this._insetBottom = config.insetBottom ?? (attrInsetBottom ? parseFloat(attrInsetBottom) : 0);
    this._insetLeft = config.insetLeft ?? (attrInsetLeft ? parseFloat(attrInsetLeft) : 0);
    this._insetRight = config.insetRight ?? (attrInsetRight ? parseFloat(attrInsetRight) : 0);

    // Inset bar colors
    this._statusBarColor = config.statusBarColor || 'var(--disco-background)';
    this._navBarColor = config.navBarColor || 'rgba(var(--disco-background-rgb), 0.8)';

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
  }

  initTheme() {
    const root = document.documentElement;
    root.setAttribute('disco-theme', this._theme);
    root.setAttribute('disco-accent', this._accent);
    if (this._font) {
      root.setAttribute('disco-font', this._font);
    }
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
   * Set safe area insets
   * @param {number} top - Top inset in pixels
   * @param {number} bottom - Bottom inset in pixels
   * @param {number} left - Left inset in pixels
   * @param {number} right - Right inset in pixels
   */
  setInset(top, bottom, left, right) {
    // Validate inputs
    this._insetTop = Math.max(0, Number(top) || 0);
    this._insetBottom = Math.max(0, Number(bottom) || 0);
    this._insetLeft = Math.max(0, Number(left) || 0);
    this._insetRight = Math.max(0, Number(right) || 0);
    
    if (this.rootFrame) {
      this._updateInsetBars();
    }
  }

  /**
   * @private
   */
  _updateInsetBars() {
    if (!this.rootFrame) return;

    // Set inset attributes on frame for reference
    this.rootFrame.setAttribute('disco-inset-top', String(this._insetTop));
    this.rootFrame.setAttribute('disco-inset-bottom', String(this._insetBottom));
    this.rootFrame.setAttribute('disco-inset-left', String(this._insetLeft));
    this.rootFrame.setAttribute('disco-inset-right', String(this._insetRight));

    // Set padding on frame
    this.rootFrame.style.paddingTop = `${this._insetTop}px`;
    this.rootFrame.style.paddingBottom = `${this._insetBottom}px`;
    this.rootFrame.style.paddingLeft = `${this._insetLeft}px`;
    this.rootFrame.style.paddingRight = `${this._insetRight}px`;

    // Remove existing inset bars in a single query
    const existingBars = this.rootFrame.querySelectorAll('.disco-inset-status-bar, .disco-inset-nav-bar');
    existingBars.forEach(bar => bar.remove());

    // Create status bar if top inset is not 0
    if (this._insetTop > 0) {
      const statusBar = document.createElement('div');
      statusBar.className = 'disco-inset-status-bar';
      statusBar.style.position = 'absolute';
      statusBar.style.top = '0';
      statusBar.style.left = '0';
      statusBar.style.right = '0';
      statusBar.style.height = `${this._insetTop}px`;
      statusBar.style.backgroundColor = this._statusBarColor;
      statusBar.style.zIndex = '10000';
      statusBar.style.pointerEvents = 'none';
      this.rootFrame.insertBefore(statusBar, this.rootFrame.firstChild);
    }

    // Create nav bar if bottom inset is not 0
    if (this._insetBottom > 0) {
      const navBar = document.createElement('div');
      navBar.className = 'disco-inset-nav-bar';
      navBar.style.position = 'absolute';
      navBar.style.bottom = '0';
      navBar.style.left = '0';
      navBar.style.right = '0';
      navBar.style.height = `${this._insetBottom}px`;
      navBar.style.backgroundColor = this._navBarColor;
      navBar.style.zIndex = '10000';
      navBar.style.pointerEvents = 'none';
      this.rootFrame.appendChild(navBar);
    }
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

    // Add to DOM as siblings
    document.body.appendChild(this.rootFrame);
    this.rootFrame.setAttribute('disco-launched', 'true');
    
    // Update inset bars
    this._updateInsetBars();
    
    if (this.splash) {
      document.body.appendChild(this.splash);
    }

    if (this.splash && this.splashConfig.mode === 'auto') {
      requestAnimationFrame(() => {
        this.setupSplash();
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
    this.splashState.setup = true;
    this.maybeDismissSplash();
  }

  dismissSplash() {
    this.splashState.ready = true;
    this.maybeDismissSplash();
  }

  maybeDismissSplash() {
    if (!this.splash) return;
    const { setup, ready } = this.splashState;
    if (setup && ready) {
      if (typeof this.splash.dismiss === 'function') {
        this.splash.dismiss();
      } else {
        this.splash.remove();
      }
      this.splash = null;
    }
  }
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
