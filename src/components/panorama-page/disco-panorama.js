import DiscoPage from '../disco-page.js';
import panoramaCss from './disco-panorama.css';
import DiscoAnimations from '../animations/disco-animations.js';

/**
 * A Windows Phone 8.1 / Hub style Panorama page.
 * Features a large title, background with parallax, and horizontal scrolling sections.
 */
class DiscoPanorama extends DiscoPage {
    /**
     * @param {string} [header]
     */
    constructor(header = 'DISCO') {
        super();
        this.header = header;
        this.attachShadow({ mode: 'open' });
        this.loadStyle(panoramaCss, this.shadowRoot);

        this._container = document.createElement('div');
        this._container.className = 'panorama-shell';
        this.shadowRoot.appendChild(this._container);

        this._background = document.createElement('div');
        this._background.className = 'panorama-background';
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
        await DiscoAnimations.animationSet.page.in(this, options);
    }

    /**
     * @param {DiscoPageAnimationOptions} [options]
     * @returns {Promise<void>}
     */
    async animateOutFn(options = { direction: 'forward' }) {
        await DiscoAnimations.animationSet.page.out(this, options);
    }

    connectedCallback() {
        this.setupParallax();
        this.setupInfiniteScroll();
    }

    render() {
        if (!this.shadowRoot || !this._container) return;
        this._container.innerHTML = `
            <div class="panorama-header">
                <h1 class="panorama-title">${this.header}</h1>
            </div>
            <div class="panorama-viewport" id="viewport">
                <div class="ghost ghost-left"></div>
                <slot></slot>
                <div class="ghost ghost-right"></div>
            </div>
        `;
    }

    setupInfiniteScroll() {
        const viewport = this.shadowRoot.getElementById('viewport');
        const slot = this.shadowRoot.querySelector('slot');
        const ghostLeft = this.shadowRoot.querySelector('.ghost-left');
        const ghostRight = this.shadowRoot.querySelector('.ghost-right');

        if (!viewport || !slot || !ghostLeft || !ghostRight) return;

        let items = [];
        let isTeleporting = false;

        const updateLayout = () => {
            // Re-query assigned elements
            items = slot.assignedElements().filter(el => el.tagName.toLowerCase().includes('panorama-section'));

            ghostLeft.innerHTML = '';
            ghostRight.innerHTML = '';

            if (items.length <= 1) {
                ghostLeft.style.width = '24px';
                ghostRight.style.width = '24px';
                return;
            }

            // Remove manual widths (let content dictate)
            ghostLeft.style.width = '';
            ghostRight.style.width = '';

            const viewportWidth = viewport.clientWidth || window.innerWidth;
            const margin = 0; // Removed extra margin calculation as per user report of gaps

            // Calculate Real Content Width/Check
            const totalItemWidth = items.reduce((acc, item) => acc + item.offsetWidth, 0);

            // If content is smaller than viewport, infinite loop is impossible without cloning.
            // We disable the ghosts to prevent visual glitches.
            if (totalItemWidth <= viewportWidth) {
                ghostLeft.style.width = '24px'; // padding
                ghostRight.style.width = '24px';
                return;
            }

            const firstItem = items[0];
            const lastItem = items[items.length - 1];
            ghostLeft.style.width = `${lastItem.offsetWidth}px`;
            // Ensure ghostRight is wide enough to let us align its start with the viewport left edge
            // This prevents "jumps" when the first item is narrower than the screen
            ghostRight.style.width = `${Math.max(firstItem.offsetWidth, viewportWidth)}px`;

            // Initial Scroll Position: Jump from 0 to Start of Real Content
            const ensureInitialScroll = (tries = 0) => {
                if (tries > 6 || items.length === 0) return;

                // Recalculate if layout changed
                const currentTotal = items.reduce((acc, item) => acc + item.offsetWidth, 0);
                if (currentTotal <= viewport.clientWidth) return;

                const firstItem = items[0];
                const targetLeft = firstItem.offsetLeft;
                // Wait until layout settles and target is measurable
                if (targetLeft <= 0 || viewport.scrollWidth === 0) {
                    requestAnimationFrame(() => ensureInitialScroll(tries + 1));
                    return;
                }
                // Only reset if we are near 0 (default) or clearly misaligned
                if (viewport.scrollLeft < 10) {
                    viewport.style.scrollBehavior = 'auto';
                    viewport.style.scrollSnapType = 'none';
                    viewport.scrollLeft = targetLeft;
                    requestAnimationFrame(() => {
                        viewport.style.scrollBehavior = '';
                        viewport.style.scrollSnapType = '';
                    });
                }
            };
            requestAnimationFrame(() => ensureInitialScroll());
        };

        // Handle Slot Changes
        slot.addEventListener('slotchange', () => {
            requestAnimationFrame(updateLayout);
            requestAnimationFrame(() => requestAnimationFrame(updateLayout));
        });
        window.addEventListener('resize', () => {
            requestAnimationFrame(updateLayout);
        });

        requestAnimationFrame(updateLayout);

        // Scroll Loop Logic
        viewport.addEventListener('scroll', () => {
            if (items.length <= 1 || isTeleporting) return;

            const firstItem = items[0];
            const lastItem = items[items.length - 1];

            const scrollLeft = viewport.scrollLeft;
            const ghostLeftWidth = ghostLeft.offsetWidth;
            const ghostRightWidth = firstItem.offsetWidth + 96
            const totalScrollWidth = viewport.scrollWidth;

            // Clean up visual transforms when not needed
            // (We'll re-apply them if we are in a zone)
            items[0].style.transform = '';
            items[items.length - 1].style.transform = '';

            // 1. Enter Left Ghost Zone
            if (scrollLeft < ghostLeftWidth) {
                console.log("enter left ghost")
                // Determine layout
                const lastItem = items[items.length - 1];

                // Visual Transform: Move Last Item to occupy Ghost Left
                // Goal: lastItem left edge should be at 0
                // Current: lastItem.offsetLeft
                lastItem.style.transform = `translateX(-${lastItem.offsetLeft}px)`;

                // Teleport Logic
                // Trigger when we've scrolled past the middle of the visual Last Item (Ghost Left)
                // This ensures symmetry with the Right Zone trigger
                if (scrollLeft <= ghostLeftWidth / 2) {
                    console.log("teleport left ghost")
                    isTeleporting = true;
                    viewport.style.scrollBehavior = 'auto';
                    viewport.style.scrollSnapType = 'none';

                    // Jump to "Middle" of Real Last Item
                    // Map visual position in Ghost Left directly to Real Last Item
                    viewport.scrollLeft = lastItem.offsetLeft + scrollLeft;

                    // Reset transform immediately so it doesn't look doubled
                    lastItem.style.transform = '';

                    requestAnimationFrame(() => {
                        viewport.style.scrollBehavior = '';
                        viewport.style.scrollSnapType = '';
                        isTeleporting = false;
                    });
                }
            }

            // 2. Enter Right Ghost Zone
            // Correctly identify the physical start of the Right Ghost element
            // This is safer than calculating from totalWidth which might include margin quirks
            const startOfGhostRight = ghostRight.offsetLeft;
            const clientWidth = viewport.clientWidth;

            if (scrollLeft + clientWidth > startOfGhostRight) {
                const firstItem = items[0];

                // Visual Transform: Move First Item to occupy Ghost Right
                // Goal: Move item from its current visual position (offsetLeft) to the ghost's position.
                // Transform = Dest - Source
                const offset = startOfGhostRight - firstItem.offsetLeft;
                firstItem.style.transform = `translateX(${offset}px)`;

                // Teleport Logic
                // We physically jump when the Viewport Left Edge hits the Ghost Right Start Edge.
                // This corresponds to the user "landing" on the ghost page.
                if (scrollLeft > lastItem.offsetLeft + lastItem.offsetWidth / 2) {
                    isTeleporting = true;
                    viewport.style.scrollBehavior = 'auto';
                    viewport.style.scrollSnapType = 'none';

                    // Jump to Start of Real Content (firstItem)
                    // Maintain any sub-pixel overshoot (e.g. momentum scolling past the exact point)
                    const delta = scrollLeft - startOfGhostRight;
                    viewport.scrollLeft = firstItem.offsetLeft + delta;

                    firstItem.style.transform = '';

                    requestAnimationFrame(() => {
                        viewport.style.scrollBehavior = '';
                        viewport.style.scrollSnapType = '';
                        isTeleporting = false;
                    });
                }
            }
            // if scroll is between two pages and its passing half of the last real page 
            if (scrollLeft > lastItem.offsetLeft + lastItem.offsetWidth / 2 || scrollLeft < firstItem.offsetLeft - firstItem.offsetWidth / 2) {
                console.log("heyafas")
            }
        }, { passive: true });
    }

    setupParallax() {
        const viewport = this.shadowRoot.getElementById('viewport');
        if (!viewport) return;
        const slot = this.shadowRoot.querySelector('slot');
        viewport.addEventListener('scroll', () => {
            const items = slot?.assignedElements().filter(el => el.tagName.toLowerCase().includes('panorama-section')) || [];
            if (items.length === 0) return;
            const firstItem = items[0];
            const lastItem = items[items.length - 1];

            const start = firstItem.offsetLeft;
            const end = lastItem.offsetLeft;
            const totalScrollableDistance = end - start;
            const scrollLeft = viewport.scrollLeft - start;
            const scrollPercent = scrollLeft / totalScrollableDistance;

            this._background.style.backgroundPositionX = `${scrollPercent * 100}%, 50%`;
            //scroll header
            this._container.querySelector('.panorama-header').style.transform = `translateX(${-scrollPercent * 200}px)`;

        }, { passive: true });
    }
}

customElements.define('disco-panorama-page', DiscoPanorama);

export default DiscoPanorama;
