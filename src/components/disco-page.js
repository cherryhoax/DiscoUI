import DiscoUIElement from './ui-elements/disco-ui-element.js';
import pageStyles from './disco-page.scss';
import DiscoAnimations from './animations/disco-animations.js';

/**
 * Base page class for Disco UI frames.
 * Provides default animateIn/animateOut behavior.
 * @extends DiscoUIElement
 */
class DiscoPage extends DiscoUIElement {
  constructor() {
    super();
    this.loadStyle(pageStyles);
    this._activeAppBarItem = null;
    this._activeAppBarTemplate = null;
    this._appBarLive = null;
    this._appBarHost = null;
    this._appBarManagerReady = false;
  }

  connectedCallback() {
    this._setupAppBarManager();
  }

  disconnectedCallback() {
    if (this._appBarMutationObserver) {
      this._appBarMutationObserver.disconnect();
      this._appBarMutationObserver = null;
    }
  }

  _setupAppBarManager() {
    if (this._appBarManagerReady) return;
    this._appBarHost = this.shadowRoot?.querySelector('[data-appbar-host]') || null;
    if (!this._appBarHost) return;
    this._appBarManagerReady = true;

    this.addEventListener('disco-active-item-change', (event) => {
      this._activeAppBarItem = event.detail?.item || null;
      this._refreshAppBar(true);
    });

    this.addEventListener('disco-page-animate-in', (event) => {
      if (event.detail?.phase !== 'start') return;
      if (this._appBarLive) this._animateAppBarSlideIn(this._appBarLive);
    });

    this.addEventListener('disco-page-animate-out', (event) => {
      if (event.detail?.phase !== 'start') return;
      if (this._appBarLive) this._animateAppBarSlideOut(this._appBarLive);
    });

    this._appBarMutationObserver = new MutationObserver(() => {
      this._refreshAppBar(false);
    });
    this._appBarMutationObserver.observe(this, { childList: true, subtree: true });

    this._refreshAppBar(false);
  }

  _refreshAppBar(animate) {
    const template = this._getAppBarTemplateForItem(this._activeAppBarItem);
    this._swapAppBar(template, animate);
  }

  _getAppBarTemplateForItem(item) {
    if (item instanceof HTMLElement) {
      const localTemplate = item.querySelector('template[data-appbar]');
      if (localTemplate) return localTemplate;
    }

    const globalTemplate = this.querySelector('template[data-appbar-global]');
    if (globalTemplate) return globalTemplate;

    const candidates = Array.from(this.querySelectorAll('template[data-appbar]'));
    return candidates.find((tpl) => !tpl.closest('disco-pivot-item, disco-hub-section')) || null;
  }

  _swapAppBar(template, animate) {
    if (template === this._activeAppBarTemplate) return;
    this._activeAppBarTemplate = template || null;

    const host = this._appBarHost;
    if (!host) return;

    const prevBar = this._appBarLive;
    if (!template) {
      if (prevBar) {
        prevBar.closeMenu?.();
        if (animate) {
          const slidePromise = this._animateAppBarSlideOut(prevBar) || Promise.resolve();
          const outPromise = this._animateBarIconsOut(prevBar);
          Promise.all([slidePromise, outPromise]).then(() => prevBar.remove());
        } else {
          prevBar.remove();
        }
      }
      this._appBarLive = null;
      return;
    }

    const fragment = template.content.cloneNode(true);
    const newBar = fragment.querySelector('disco-app-bar');
    if (!newBar) return;

    newBar.setAttribute('data-appbar-live', '');
    if (prevBar) newBar.setAttribute('data-appbar-transparent', '');
    newBar.style.zIndex = '1001';
    host.appendChild(newBar);

    this._appBarLive = newBar;

    if (prevBar) {
      prevBar.closeMenu?.();
      if (animate) {
        const outPromise = this._animateBarIconsOut(prevBar);
        const inPromise = this._animateBarIconsIn(newBar);
        const prevHeight = typeof prevBar.getCollapsedHeight === 'function'
          ? prevBar.getCollapsedHeight()
          : null;
        const newHeight = typeof newBar.getCollapsedHeight === 'function'
          ? newBar.getCollapsedHeight()
          : null;
        const heightPromise = typeof newBar.animateCollapsedHeight === 'function' && prevHeight != null
          ? newBar.animateCollapsedHeight(prevHeight)
          : Promise.resolve();
        const prevHeightPromise = typeof prevBar.animateHeightTo === 'function' && prevHeight != null && newHeight != null
          ? prevBar.animateHeightTo(prevHeight, newHeight)
          : Promise.resolve();
        Promise.all([outPromise, inPromise, heightPromise, prevHeightPromise]).then(() => {
          newBar.setAttribute('data-appbar-solidify', '');
          newBar.removeAttribute('data-appbar-transparent');
          prevBar.remove();
          requestAnimationFrame(() => newBar.removeAttribute('data-appbar-solidify'));
        });
      } else {
        prevBar.remove();
        newBar.removeAttribute('data-appbar-transparent');
      }
    } else if (animate) {
      this._animateAppBarSlideIn(newBar);
      this._animateBarIconsIn(newBar).then(() => {
        newBar.setAttribute('data-appbar-solidify', '');
        newBar.removeAttribute('data-appbar-transparent');
        requestAnimationFrame(() => newBar.removeAttribute('data-appbar-solidify'));
      });
    } else {
      newBar.removeAttribute('data-appbar-transparent');
    }

    requestAnimationFrame(() => {
      if (newBar) newBar.style.zIndex = '';
    });
  }

  _getAppBarIconButtons(bar) {
    if (!bar) return [];
    return Array.from(bar.querySelectorAll('disco-app-bar-icon-button'));
  }

  _animateBarIconsOut(bar) {
    const icons = this._getAppBarIconButtons(bar);
    if (!icons.length) return Promise.resolve();
    const animations = icons.map((icon) =>
      DiscoAnimations.animate(
        icon,
        [
          { transform: 'translateY(0px)', opacity: 1 },
          { transform: 'translateY(-40px)', opacity: 0 }
        ],
        {
          duration: 100,
          easing: DiscoAnimations.easeInQuad,
          fill: 'forwards'
        }
      ).finished.catch(() => null)
    );
    return Promise.all(animations).then(() => undefined);
  }

  _animateBarIconsIn(bar) {
    const icons = this._getAppBarIconButtons(bar);
    if (!icons.length) return Promise.resolve();
    const animations = icons.map((icon) =>
      DiscoAnimations.animate(
        icon,
        [
          { transform: 'translateY(40px)', opacity: 0 },
          { transform: 'translateY(0px)', opacity: 1 }
        ],
        {
          duration: 400,
          easing: DiscoAnimations.easeInOutBack,
          fill: 'forwards'
        }
      ).finished.then(() => {
        icon.style.opacity = '';
        icon.style.transform = '';
      }).catch(() => null)
    );
    return Promise.all(animations).then(() => undefined);
  }

  _animateAppBarSlideIn(bar) {
    DiscoAnimations.animate(
      bar,
      [
        { transform: 'translateY(100%)' },
        { transform: 'translateY(0%)' }
      ],
      {
        duration: 220,
        easing: 'ease',
        fill: 'forwards'
      }
    ).finished.catch(() => null);
  }

  _animateAppBarSlideOut(bar) {
    DiscoAnimations.animate(
      bar,
      [
        { transform: 'translateY(0%)' },
        { transform: 'translateY(100%)' }
      ],
      {
        duration: 220,
        easing: 'ease',
        fill: 'forwards'
      }
    ).finished.catch(() => null);
  }

  // Methods for the Frame to call
  /**
   * @typedef {object} DiscoPageAnimationOptions
   * @property {'forward' | 'back'} direction
   */

  /**
   * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateIn(options = { direction: 'forward' }) {
    this.classList.add('animating-in');
    this.dispatchEvent(new CustomEvent('disco-page-animate-in', {
      detail: { phase: 'start', options },
      bubbles: true,
      composed: true
    }));
    await this.animateInFn(options);
    this.dispatchEvent(new CustomEvent('disco-page-animate-in', {
      detail: { phase: 'end', options },
      bubbles: true,
      composed: true
    }));
    this.classList.remove('animating-in');
  }

  /**
   * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateInFn(options = { direction: 'forward' }) {
    const animation = DiscoAnimations.animate(
      this,
      [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: 300,
        easing: DiscoAnimations.easeOutQuart,
        fill: 'forwards'
      }
    );
    await animation.finished;
  }

  /**
   * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateOut(options = { direction: 'forward' }) {
    this.classList.add('animating-out');
    this.dispatchEvent(new CustomEvent('disco-page-animate-out', {
      detail: { phase: 'start', options },
      bubbles: true,
      composed: true
    }));
    await this.animateOutFn(options);
    this.dispatchEvent(new CustomEvent('disco-page-animate-out', {
      detail: { phase: 'end', options },
      bubbles: true,
      composed: true
    }));
    this.classList.remove('animating-out');
  }
  /**
   * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateOutFn(options = { direction: 'forward' }) {
    const animation = DiscoAnimations.animate(
      this,
      [{ opacity: 1 }, { opacity: 0 }],
      {
        duration: 150,
        easing: DiscoAnimations.easeOutQuad,
        fill: 'forwards'
      }
    );
    await animation.finished;
  }
}

export default DiscoPage;
