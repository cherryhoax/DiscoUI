import { html, css, unsafeCSS } from 'lit';
import DiscoPage from '../disco-page.js';
import DiscoAnimations from '../animations/disco-animations.js';
import singlePageStyles from './disco-single-page.scss';

/**
 * Single pivot-style page with one header and one content slot.
 */
class DiscoSinglePage extends DiscoPage {
    static styles = css`${unsafeCSS(singlePageStyles)}`;

    static get properties() {
        return {
            appTitle: { type: String, attribute: 'app-title' },
            header: { type: String }
        };
    }

    constructor() {
        super();
        this.appTitle = 'DISCO APP';
        this.header = 'DETAILS';
    }

    firstUpdated() {
        this._container = this.shadowRoot.querySelector('.single-shell');
    }

    createRenderRoot() {
        return this.attachShadow({ mode: 'open' });
    }

    render() {
        return html`
            <div class="single-shell">
                <div class="single-root">
                    <div class="app-title">${this.appTitle}</div>
                    <div class="header-strip">
                        <div class="header-item">${this.header}</div>
                    </div>
                    <div class="content-viewport">
                        <slot></slot>
                    </div>
                </div>
            </div>
        `;
    }

    /**
    * @param {DiscoPageAnimationOptions} [options]
    * @returns {Promise<void>}
    */
    async animateInFn(options = { direction: 'forward' }) {
        const appTitle = this.shadowRoot?.querySelector('.app-title');
        const headerStrip = this.shadowRoot?.querySelector('.header-strip');
        const viewport = this.shadowRoot?.querySelector('.content-viewport');
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
        const appTitle = this.shadowRoot?.querySelector('.app-title');
        const headerStrip = this.shadowRoot?.querySelector('.header-strip');
        const viewport = this.shadowRoot?.querySelector('.content-viewport');
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
}

customElements.define('disco-single-page', DiscoSinglePage);

export default DiscoSinglePage;
