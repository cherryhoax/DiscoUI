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
        if (name === 'app-title') {
            this.appTitle = newValue || 'DISCO APP';
            const el = this.shadowRoot?.querySelector('.app-title');
            if (el) el.textContent = this.appTitle;
        }
        if (name === 'header') {
            this.header = newValue || 'DETAILS';
            const el = this.shadowRoot?.querySelector('.header-item');
            if (el) el.textContent = this.header;
        }
    }

    /**
    * @param {DiscoPageAnimationOptions} [options]
    * @returns {Promise<void>}
    */
    async animateInFn(options = { direction: 'forward' }) {
        const appTitle = this._container.querySelector('.app-title');
        const headerStrip = this._container.querySelector('.header-strip');
        const viewport = this._container.querySelector('.content-viewport');
        const slot = viewport ? viewport.querySelector('slot') : null;
        const viewportChildren = slot
            ? slot.assignedElements({ flatten: true })
            : Array.from(viewport ? viewport.children : []).filter((child) => child.tagName !== 'SLOT');

        const animationItems = [
            { target: appTitle, run: () => DiscoAnimations.animationSet.page.in(appTitle, options) },
            { target: headerStrip, run: () => DiscoAnimations.animationSet.page.in(headerStrip, options) }
        ];

        viewportChildren.forEach((child) => {
            if (!(child instanceof HTMLElement)) return;
            if (child.tagName === 'DISCO-LIST-VIEW') {
                const listRoot = child.shadowRoot;
                const listItems = listRoot
                    ? Array.from(listRoot.querySelectorAll('disco-list-item, disco-list-view-item, [data-list-index]'))
                    : [];
                animationItems.push({ target: child, run: () => DiscoAnimations.animationSet.list.in(listItems, options) });
                return;
            }
            animationItems.push({ target: child, run: () => DiscoAnimations.animationSet.page.in(child, options) });
        });

        await DiscoAnimations.animateAll(animationItems);
        console.log('Single page animate in complete');
    }

    /**
    * @param {DiscoPageAnimationOptions} [options]
    * @returns {Promise<void>}
    */
    async animateOutFn(options = { direction: 'forward' }) {
        const appTitle = this._container.querySelector('.app-title');
        const headerStrip = this._container.querySelector('.header-strip');
        const viewport = this._container.querySelector('.content-viewport');
        const slot = viewport ? viewport.querySelector('slot') : null;
        const viewportChildren = slot
            ? slot.assignedElements({ flatten: true })
            : Array.from(viewport ? viewport.children : []).filter((child) => child.tagName !== 'SLOT');

        const animationItems = [
            { target: appTitle, run: () => DiscoAnimations.animationSet.page.out(appTitle, options) },
            { target: headerStrip, run: () => DiscoAnimations.animationSet.page.out(headerStrip, options) }
        ];

        viewportChildren.forEach((child) => {
            if (!(child instanceof HTMLElement)) return;
            if (child.tagName === 'DISCO-LIST-VIEW') {
                const listRoot = child.shadowRoot;
                const listItems = listRoot
                    ? Array.from(listRoot.querySelectorAll('disco-list-item, disco-list-view-item, [data-list-index]'))
                    : [];
                animationItems.push({ target: child, run: () => DiscoAnimations.animationSet.list.out(listItems, options) });
                return;
            }
            animationItems.push({ target: child, run: () => DiscoAnimations.animationSet.page.out(child, options) });
        });

        await DiscoAnimations.animateAll(animationItems);
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
