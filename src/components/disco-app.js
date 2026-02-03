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

    this.accent = config.accent || attrAccent || '#D80073'; // Classic WP Magenta
    this.theme = config.theme || attrTheme || 'dark';
    this.font = config.font || attrFont || null;
    this.icon = config.icon || null; // Optional splash foreground (URL or HTMLElement)

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
    root.setAttribute('disco-theme', this.theme);
    root.setAttribute('disco-accent', this.accent);
    if (this.font) {
      root.setAttribute('disco-font', this.font);
    }
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
    const effectiveIcon = icon || this.icon;
    if (!effectiveIcon && !this.accent && !color) return null;

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

export default DiscoApp;
