import DiscoPage from '../disco-page.js';
import hubCss from './disco-hub.scss';
import DiscoAnimations from '../animations/disco-animations.js';
import './disco-hub-view.js';

/**
 * A Windows Phone 8.1 / Hub style Hub page.
 * Features a large title, background with parallax, and horizontal scrolling sections.
 */
class DiscoHub extends DiscoPage {
    /**
     * @param {string} [header]
     */
    constructor(header = 'DISCO') {
        super();
        this.header = header;
        this.attachShadow({ mode: 'open' });
        this.loadStyle(hubCss, this.shadowRoot);

        this._container = document.createElement('div');
        this._container.className = 'hub-shell';
        this.shadowRoot.appendChild(this._container);

        this._backgroundClip = document.createElement('div');
        this._backgroundClip.className = 'hub-background-clip';
        this.shadowRoot.insertBefore(this._backgroundClip, this._container);

        this._background = document.createElement('div');
        this._background.className = 'hub-background';
        this._backgroundClip.appendChild(this._background);

        this.render();
    }

    static get observedAttributes() {
        return ['header', 'background'];
    }

    /**
     * @param {string} name
     * @param {string | null} _oldValue
     * @param {string | null} newValue
     */
    attributeChangedCallback(name, _oldValue, newValue) {
        if (name === 'header' && newValue != null) {
            this.header = newValue;
            this.render();
        }
        if (name === 'background' && newValue != null) {
            this._background.style.backgroundImage = `url(${newValue})`;
        }
    }

    /**
     * @param {DiscoPageAnimationOptions} [options]
     * @returns {Promise<void>}
     */
    async animateInFn(options = { direction: 'forward' }) {
        this.setAttribute('data-animating', '');
        const viewport = this.shadowRoot?.getElementById('viewport');
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

    /**
     * @param {DiscoPageAnimationOptions} [options]
     * @returns {Promise<void>}
     */
    async animateOutFn(options = { direction: 'forward' }) {
        this.setAttribute('data-animating', '');
        const viewport = this.shadowRoot?.getElementById('viewport');
        if (viewport) viewport.setAttribute('data-animating', '');
        const sections = Array.from(this.querySelectorAll('disco-hub-section'));
        sections.forEach((section) => section.setAttribute('data-animating', ''));
        await DiscoAnimations.animationSet.page.out(this, options);
        this.removeAttribute('data-animating');
        if (viewport) viewport.removeAttribute('data-animating');
        sections.forEach((section) => section.removeAttribute('data-animating'));
    }

    connectedCallback() {
        this.setupParallax();
    }

    render() {
        if (!this.shadowRoot || !this._container) return;
        this._container.innerHTML = `
            <div class="hub-header">
                <h1 class="hub-title">${this.header}</h1>
            </div>
            <disco-hub-view class="hub-viewport" id="viewport" direction="horizontal">
                <slot></slot>
            </disco-hub-view>
            <div class="hub-footer">
                <slot name="footer"></slot>
            </div>
        `;
        this._header = this._container.querySelector('.hub-header')
    }

    setupParallax() {
        const viewport = this.shadowRoot.getElementById('viewport');
        if (!viewport) return;
        const updateParallax = () => {
            const items = Array.from(this.querySelectorAll('disco-hub-section'));
            if (items.length === 0) return;
            const firstItem = items[0];
            const pageWidth = viewport.clientWidth;
            const totalPages = Math.max(1, items.length);
            const scrollLeft = viewport.scrollLeft;

            const perPageShift = viewport.clientWidth;
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
        /* CSS.registerProperty({
             name: '--bg-pos-x',
             syntax: '<percentage>',
             inherits: false,
             initialValue: '0%'
         });
         CSS.registerProperty({
             name: '--bg-animate-offset',
             syntax: '<number>',
             inherits: false,
             initialValue: '0'
         });*/
    } catch (e) {
        // Property already registered or error
    }
}

customElements.define('disco-hub-page', DiscoHub);

export default DiscoHub;
