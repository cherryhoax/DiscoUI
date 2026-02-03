import { html, css } from 'lit';
import { property, query } from 'lit/decorators.js';
import DiscoPage from '../disco-page.js';
import DiscoAnimations from '../animations/disco-animations.js';

/**
 * Single pivot-style page with one header and one content slot.
 */
class DiscoSinglePage extends DiscoPage {
    static styles = css`
        :host {
            background-color: var(--disco-bg);
            color: var(--disco-fg);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            height: 100%;
            perspective: var(--disco-perspective);
        }

        :host * {
            transform-style: preserve-3d;
        }

        .single-shell {
            height: 100%;
        }

        .single-root {
            display: flex;
            flex-direction: column;
            height: 100%;
        }

        .app-title {
            font-size: 22px;
            text-transform: uppercase;
            padding: 18px 20px 0;
            letter-spacing: 0.05em;
            opacity: 1;
        }

        .header-strip {
            display: flex;
            gap: 25px;
            padding: 0px 20px 20px;
            overflow: hidden;
            scrollbar-width: none;
        }

        .header-strip::-webkit-scrollbar {
            display: none;
        }

        .header-item {
            font-size: 67px;
            font-weight: 100;
            white-space: nowrap;
            text-transform: lowercase;
        }

        .content-viewport {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 0 20px;
            box-sizing: border-box;
            transform-style: preserve-3d;
            perspective: var(--disco-perspective);
            perspective-origin: center;
        }

        .content-viewport ::slotted(disco-scroll-view),
        .content-viewport ::slotted(disco-list-view) {
            flex: 1;
            min-height: 0;
            align-self: stretch;
            padding: 0 20px;
            padding-bottom: 120px;
            margin: 0 -20px;
        }

        .content-viewport ::slotted(*) {
            transform-style: preserve-3d;
        }

        .content-viewport::-webkit-scrollbar {
            display: none;
        }
    `;

    @property({ type: String, attribute: 'app-title' }) appTitle = 'DISCO APP';
    @property({ type: String }) header = 'DETAILS';

    @query('.single-shell') _container;

    constructor() {
        super();
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
