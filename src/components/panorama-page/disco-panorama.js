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
            const margin = 48; // Sync with CSS

            // Fill Ghost Right (clones of [0, 1, ...])
            let currentRightWidth = 0;
            let i = 0;
            while (currentRightWidth < viewportWidth + 400 && i < items.length * 2) { 
                // Loop i modulo length to fill space if needed
                const item = items[i % items.length];
                const clone = item.cloneNode(true);
                clone.removeAttribute('id'); 
                ghostRight.appendChild(clone);
                // include margin in layout calc
                currentRightWidth += ((item.offsetWidth || 400) + margin); 
                i++;
            }

            // Fill Ghost Left (clones of [last, last-1, ...])
            let currentLeftWidth = 0;
            let j = items.length - 1;
            while (currentLeftWidth < viewportWidth + 400 && j >= -items.length) {
                // handle negative j wrap
                const index = (j + items.length * 10) % items.length;
                const item = items[index];
                const clone = item.cloneNode(true);
                clone.removeAttribute('id');
                ghostLeft.insertBefore(clone, ghostLeft.firstChild);
                currentLeftWidth += ((item.offsetWidth || 400) + margin); 
                j--;
            }

            // Initial Scroll Position: Jump from 0 to Start of Real Content
            requestAnimationFrame(() => {
                if (viewport.scrollLeft < 10) {
                     // We want to start at the first Real Item.
                     // The first real item starts exactly after GhostLeft.
                     viewport.scrollLeft = ghostLeft.offsetWidth;
                }
            });
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
            
            const scrollLeft = viewport.scrollLeft;
            const ghostLeftWidth = ghostLeft.offsetWidth;
            const ghostRightWidth = ghostRight.offsetWidth;
            const totalScrollWidth = viewport.scrollWidth;
            
            // 1. Enter Left Ghost Zone
            if (scrollLeft < ghostLeftWidth) {
                // Offset calculation:
                // distance from Right Edge of GhostLeft = ghostLeftWidth - scrollLeft
                const distFromEnd = ghostLeftWidth - scrollLeft;
                
                // Real Content End is at (ghostLeftWidth + realContentWidth)
                // or simpler: The Real Last Item ends at (lastItem.offsetLeft + lastItem.offsetWidth).
                // But we have multiple items.
                // It is safest to map "End of GhostLeft" to "Start of Real Content".
                // Wait.
                // End of GhostLeft == Start of Real Content.
                // Visually: ... [LastClone] | [RealFirst] ...
                // If we scroll LEFT into GhostLeft, we are seeing [LastClone].
                // We should match [RealLast].
                // RealLast is at `items[last].offsetLeft`.
                // RealLast Ends at `items[last].offsetLeft + width`.
                // So (End of GhostLeft) visually matches (End of RealLast).
                // Wait. No.
                // GhostLeft Ends with LastClone.
                // Start of RealContent begins with FirstItem.
                // Loop Point: [Last] -> [First].
                // So GhostLeft End IS visually [LastClone].
                // Real Content End IS visually [LastItem].
                // The LOOP connection is correct.
                
                // Map Point: ghostLeftWidth (End of GhostLeft) <-> (End of Real Content) roughly?
                // Visual Match: The pixels immediately to the LEFT of ghostLeftWidth are [LastClone].
                // The pixels immediately to the LEFT of RightGhostStart are [LastItem].
                
                // Correct logic:
                // We are `distFromEnd` pixels into the GhostLeft (from right side).
                // We want to be `distFromEnd` pixels into the RealContent (from right side).
                
                const realContentEnd = totalScrollWidth - ghostRightWidth; 
                // This is the start of GhostRight. Which visually is after LastItem.
                // So Total Real Content ends at `realContentEnd`.
                
                // Target Scroll: realContentEnd - distFromEnd
                const targetScroll = realContentEnd - distFromEnd;
                
                // Only teleport if significant change to avoid jitter at boundary
                if (Math.abs(scrollLeft - targetScroll) > 5) {
                    isTeleporting = true;
                    viewport.style.scrollBehavior = 'auto';
                    viewport.style.scrollSnapType = 'none';
                    
                    viewport.scrollLeft = targetScroll;
                    
                    requestAnimationFrame(() => {
                        viewport.style.scrollBehavior = '';
                        viewport.style.scrollSnapType = '';
                        isTeleporting = false;
                    });
                }
            }

            // 2. Enter Right Ghost Zone
            const startOfGhostRight = totalScrollWidth - ghostRightWidth;
            
            if (scrollLeft > startOfGhostRight) {
                 // distance into GhostRight
                 const distIntoGhost = scrollLeft - startOfGhostRight;
                 
                 // GhostRight starts with FirstClone.
                 // RealContent starts with FirstItem.
                 // Start of Real Content = ghostLeftWidth.
                 
                 const realContentStart = ghostLeftWidth;
                 const targetScroll = realContentStart + distIntoGhost;
                 
                 if (Math.abs(scrollLeft - targetScroll) > 5) {
                    isTeleporting = true;
                    viewport.style.scrollBehavior = 'auto';
                    viewport.style.scrollSnapType = 'none';
                    
                    viewport.scrollLeft = targetScroll;
                    
                    requestAnimationFrame(() => {
                        viewport.style.scrollBehavior = '';
                        viewport.style.scrollSnapType = '';
                        isTeleporting = false;
                    });
                 }
            }

        }, { passive: true });
    }

    setupParallax() {
        const viewport = this.shadowRoot.getElementById('viewport');
        if (!viewport) return;

        viewport.addEventListener('scroll', () => {
            this._background.style.backgroundPositionX = `${viewport.scrollLeft / (viewport.scrollWidth - viewport.clientWidth) * 100}%, 50%`;
            //scroll header
            this._container.querySelector('.panorama-header').style.transform = `translateX(-${(viewport.scrollLeft / (viewport.scrollWidth - viewport.clientWidth)) * 200}px)`;

        }, { passive: true });
    }
}

customElements.define('disco-panorama', DiscoPanorama);

export default DiscoPanorama;
