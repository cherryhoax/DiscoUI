import './components/disco-frame.js';
import './components/disco-splash.js';

// App-level orchestrator for Disco UI themes and boot flow.
class DiscoApp {
  constructor(config = {}) {
    this.accent = config.accent || '#D80073'; // Classic WP Magenta
    this.theme = config.theme || 'dark';
    this.icon = config.icon || null; // Optional splash foreground (URL or HTMLElement)
    this.splashState = { setup: false, ready: false };
    this.initTheme();
  }

  initTheme() {
    const root = document.documentElement;
    root.setAttribute('data-disco-theme', this.theme);
    root.style.setProperty('--disco-accent', this.accent);
    // Default WP system colors
    root.style.setProperty('--disco-bg', this.theme === 'dark' ? '#000' : '#fff');
    root.style.setProperty('--disco-fg', this.theme === 'dark' ? '#fff' : '#000');
  }

  launch(frame) {
    this.rootFrame = frame;
    this.splash = this.buildSplash();

    // Add to DOM as siblings
    document.body.appendChild(this.rootFrame);
    if (this.splash) {
      document.body.appendChild(this.splash);
    }
  }

  buildSplash() {
    // If no icon and no accent, skip splash entirely.
    if (!this.icon && !this.accent) return null;

    const splash = document.createElement('disco-splash');
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
