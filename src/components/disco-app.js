import appStyles from './disco-app.scss';
import openSansRegular from '@fontsource/open-sans/400.css';
import openSansItalic from '@fontsource/open-sans/400-italic.css';
import './disco-frame.js';
import './disco-splash.js';
/** @typedef {import('./disco-splash.d.ts').DiscoSplashElement} DiscoSplashElement */

/**
 * @typedef {'none' | 'auto' | 'manual'} SplashMode
 */

/**
 * @typedef {Object} DiscoAppConfig
 * @property {string} [accent]
 * @property {'dark' | 'light' | 'auto'} [theme]
 * @property {string | null} [font]
 * @property {string | HTMLElement | null} [icon]
 * @property {SplashMode} [splash]
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
    const style = document.createElement('style');
    style.textContent = `${openSansRegular}\n${openSansItalic}`;
    document.head.appendChild(style);
    injected = true;
  };
})();

injectThemeStyles();
injectFontStyles();

// App-level orchestrator for Disco UI themes and boot flow.
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
    this.splashMode = config.splash || 'auto';
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

    // Add to DOM as siblings
    document.body.appendChild(this.rootFrame);
    this.rootFrame.setAttribute('disco-launched', 'true');
    if (this.splash) {
      document.body.appendChild(this.splash);
    }

    if (this.splash && this.splashMode === 'auto') {
      requestAnimationFrame(() => {
        this.signalSetup();
        this.signalReady();
      });
    }
  }

  /**
   * @returns {DiscoSplashElement | null}
   */
  buildSplash() {
    if (this.splashMode === 'none') return null;
    // If no icon and no accent, skip splash entirely.
    if (!this.icon && !this.accent) return null;

    /** @type {DiscoSplashElement} */
    const splash = /** @type {DiscoSplashElement} */ (
      /** @type {HTMLElement} */ (document.createElement('disco-splash'))
    );
    if (typeof this.icon === 'string') {
      splash.setAttribute('logo', this.icon);
    } else if (this.icon instanceof HTMLElement) {
      splash.logoNode = this.icon;
    }
    return splash;
  }

  signalSetup() {
    this.splashState.setup = true;
    this.maybeDismissSplash();
  }

  signalReady() {
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
