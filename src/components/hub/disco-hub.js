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

        this._background = document.createElement('div');
        this._background.className = 'hub-background';
        this.shadowRoot.insertBefore(this._background, this._container);

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
        await DiscoAnimations.animationSet.page.in(this, options);
        this.removeAttribute('data-animating');
        if (viewport) viewport.removeAttribute('data-animating');
        sections.forEach((section) => section.removeAttribute('data-animating'));
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
            <disco-hub-view class="hub-viewport" id="viewport" direction="horizontal" data-debug-overflow>
                <slot></slot>
            </disco-hub-view>
        `;
        this._header = this._container.querySelector('.hub-header')
    }

    setupParallax() {
        const viewport = this.shadowRoot.getElementById('viewport');
        if (!viewport) return;
        const slot = viewport.shadowRoot?.querySelector('slot') || null;
        viewport.addEventListener('scroll', () => {
            const items = slot?.assignedElements().filter(el => el.tagName.toLowerCase().includes('hub-section')) || [];
            if (items.length === 0) return;
            const firstItem = items[0];
            const lastItem = items[items.length - 1];

            const start = firstItem.offsetLeft;
            const end = lastItem.offsetLeft;
            const totalScrollableDistance = end - start;
            const scrollLeft = viewport.scrollLeft - start;
            var scrollPercent = scrollLeft / totalScrollableDistance;
            var scrollFirst = viewport.scrollLeft / firstItem.offsetWidth;
            scrollPercent = scrollPercent < 0 ? (1 - scrollFirst) * -1 : scrollPercent;
/*
            if (viewport.scrollLeft < ghostLeft.offsetWidth) {
                const ghostPercent = (viewport.scrollLeft - ghostLeft.offsetLeft) / ghostLeft.offsetWidth;
                this._background.style.backgroundPositionX = `calc(${(1 - ghostPercent) * 100}vw)`;
            } else if (viewport.scrollLeft > lastItem.offsetLeft) {
                const ghostPercent = (viewport.scrollLeft - ghostRight.offsetLeft) / ghostRight.offsetWidth;
                this._background.style.backgroundPositionX = `calc(${(1 - ghostPercent) * 100}vw)`;
            } else {
                this._background.style.backgroundPositionX = `0vw`;
            }*/

            this._background.style.left = `${-Math.min(Math.max(scrollPercent * 100, 0), 100)}%`;
            //scroll header
            this._header.style.setProperty('--translate-x', `${-scrollPercent * 200}px`);

        }, { passive: true });
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
