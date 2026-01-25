import DiscoPage from '../disco-page.js';
import singlePageCss from './disco-single-page.scss';
import DiscoAnimations from '../animations/disco-animations.js';

/**
 * Single pivot-style page with one header and one content slot.
 */
class DiscoSinglePage extends DiscoPage {
    /**
     * @param {string} [appTitle]
     * @param {string} [header]
     */
    constructor(appTitle = 'DISCO APP', header = 'DETAILS') {
        super();
        this.appTitle = appTitle;
        this.header = header;
        this.attachShadow({ mode: 'open' });
        this.loadStyle(singlePageCss, this.shadowRoot);
        this._container = document.createElement('div');
        this._container.className = 'single-shell';
        this.shadowRoot.appendChild(this._container);
        this.render();
    }

    static get observedAttributes() {
        return ['app-title', 'header'];
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
        if (name === 'app-title' && newValue != null) {
            this.appTitle = newValue;
        }
        if (name === 'header' && newValue != null) {
            this.header = newValue;
        }
        this.render();
    }

    /**
    * @param {DiscoPageAnimationOptions} [options]
    * @returns {Promise<void>}
    */
    async animateInFn(options = { direction: 'forward' }) {
        await DiscoAnimations.animationSet.page.in(this, options);
    }

    /**
    * @param {DiscoPageAnimationOptions} [options]
    * @returns {Promise<void>}
    */
    async animateOutFn(options = { direction: 'forward' }) {
        await DiscoAnimations.animationSet.page.out(this, options);
    }

    /**
     * @returns {void}
     */
    render() {
        if (!this.shadowRoot || !this._container) return;
        this._container.innerHTML = `
      <div class="single-root">
        <div class="app-title">${this.appTitle}</div>
        <div class="header-strip">
          <div class="header-item">${this.header}</div>
        </div>
        <div class="content-viewport">
          <slot></slot>
        </div>
      </div>
    `;
    }
}

customElements.define('disco-single-page', DiscoSinglePage);

export default DiscoSinglePage;
