import { html, css } from 'lit';
import { property, query } from 'lit/decorators.js';
import DiscoPage from '../disco-page.js';
import DiscoAnimations from '../animations/disco-animations.js';
import './disco-hub-view.js';

/**
 * A Windows Phone 8.1 / Hub style Hub page.
 * Features a large title, background with parallax, and horizontal scrolling sections.
 */
class DiscoHub extends DiscoPage {
    static styles = css`
        :host {
            display: block;
            width: 100%;
            height: 100%;
            position: relative;
            overflow: visible;
            user-select: none;
            background-color: var(--disco-bg, #000);
            color: var(--disco-fg, #fff);
        }

        :host([data-animating]) {
            overflow: visible !important;
        }

        .hub-background {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 200%;
            z-index: 0;
            background-size: 200% 100%;
            background-repeat: repeat-x;
            pointer-events: none;
            overflow: hidden;
        }

        .hub-background-clip {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            pointer-events: none;
            z-index: 0;
        }

        .hub-shell {
            position: relative;
            z-index: 1;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: visible;
        }

        :host([data-animating]) .hub-shell {
            overflow: visible !important;
        }

        .hub-header {
            padding: 5px 20px 28px 20px;
            z-index: 2;
            --translate-x: 0px;
            transform: translateX(var(--translate-x)) translateX(var(--animate-offset));
        }

        .hub-title {
            font-size: 90px;
            font-weight: lighter;
            line-height: 1;
            margin: 0;
            white-space: nowrap;
            text-transform: lowercase;
            opacity: 0.9;
        }

        .hub-viewport {
            flex: 1;
            display: block;
            padding-left: 0;
            padding-right: 0;
            overflow: visible;
        }

        :host([data-animating]) .hub-viewport {
            overflow: visible !important;
        }
    `;

    @property({ type: String }) header = 'DISCO';
    @property({ type: String }) background = '';

    @query('.hub-shell') _container;
    @query('.hub-header') _header;
    @query('.hub-background') _background;
    @query('#viewport') _viewport;

    constructor() {
        super();
    }

    createRenderRoot() {
        return this.attachShadow({ mode: 'open' });
    }

    updated(changedProperties) {
        if (changedProperties.has('background') && this._background) {
            this._background.style.backgroundImage = this.background ? `url(${this.background})` : '';
        }
    }

    connectedCallback() {
        super.connectedCallback();
    }

    firstUpdated() {
        this.setupParallax();
    }

    render() {
        return html`
            <div class="hub-background-clip">
                <div class="hub-background"></div>
            </div>
            <div class="hub-shell">
                <div class="hub-header">
                    <h1 class="hub-title">${this.header}</h1>
                </div>
                <disco-hub-view class="hub-viewport" id="viewport" direction="horizontal">
                    <slot></slot>
                </disco-hub-view>
            </div>
        `;
    }

    async animateInFn(options = { direction: 'forward' }) {
        this.setAttribute('data-animating', '');
        const viewport = this._viewport;
        if (viewport) viewport.setAttribute('data-animating', '');
        const sections = Array.from(this.querySelectorAll('disco-hub-section'));
        sections.forEach((section) => section.setAttribute('data-animating', ''));
        try {
            const introDuration = 1200;
            const scrollPromise = viewport
                ? DiscoAnimations.animate(
                    viewport,
                    [
                        { transform: 'translateX(1000px)' },
                        { transform: 'translateX(0px)' }
                    ],
                    {
                        duration: introDuration,
                        easing: DiscoAnimations.easeOutQuart,
                        fill: 'forwards'
                    }
                ).finished.finally(() => {
                    viewport.style.transform = '';
                })
                : Promise.resolve();
            const headerPromise = this._header
                ? DiscoAnimations.animate(
                    this._header,
                    [
                        { transform: 'translateX(500px)' },
                        { transform: 'translateX(0px)' }
                    ],
                    {
                        duration: introDuration,
                        easing: DiscoAnimations.easeOutQuart,
                        fill: 'forwards'
                    }
                ).finished
                : Promise.resolve();
            const pagePromise = DiscoAnimations.animationSet.hub.in(this, options);
            await Promise.all([
                pagePromise,
                scrollPromise,
                headerPromise
            ]);
        } finally {
            this.removeAttribute('data-animating');
            if (viewport) viewport.removeAttribute('data-animating');
            sections.forEach((section) => section.removeAttribute('data-animating'));
        }
    }

    async animateOutFn(options = { direction: 'forward' }) {
        this.setAttribute('data-animating', '');
        const viewport = this._viewport;
        if (viewport) viewport.setAttribute('data-animating', '');
        const sections = Array.from(this.querySelectorAll('disco-hub-section'));
        sections.forEach((section) => section.setAttribute('data-animating', ''));
        await DiscoAnimations.animationSet.page.out(this, options);
        this.removeAttribute('data-animating');
        if (viewport) viewport.removeAttribute('data-animating');
        sections.forEach((section) => section.removeAttribute('data-animating'));
    }

    setupParallax() {
        const viewport = this._viewport;
        if (!viewport) return;
        const updateParallax = () => {
            const items = Array.from(this.querySelectorAll('disco-hub-section'));
            if (items.length === 0) return;
            const firstItem = items[0];
            const pageWidth = firstItem.offsetWidth || viewport.clientWidth || 1;
            const totalPages = Math.max(1, items.length);
            const scrollLeft = viewport.scrollLeft;

            const perPageShift = (window.innerWidth || viewport.clientWidth || 1) / totalPages;
            const pageProgress = scrollLeft / pageWidth;
            const bgOffset = -(pageProgress * perPageShift);
            this._background.style.left = `${bgOffset}px`;

            const scrollMax = Math.max(1, (pageWidth * totalPages) - pageWidth);
            const progress = scrollLeft / scrollMax;
            this._header.style.setProperty('--translate-x', `${-progress * 200}px`);
        };
        viewport.addEventListener('scroll', updateParallax, { passive: true });
    }
}

if (window.CSS && CSS.registerProperty) {
    try {
        CSS.registerProperty({
            name: '--translate-x',
            syntax: '<length>',
            inherits: false,
            initialValue: '0px'
        });
        CSS.registerProperty({
            name: '--animate-offset',
            syntax: '<length>',
            inherits: false,
            initialValue: '0px'
        });
    } catch (e) {
        // Property already registered or error
    }
}

customElements.define('disco-hub-page', DiscoHub);

export default DiscoHub;
