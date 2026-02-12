import DiscoPage from '../disco-page.js';
import pickerBoxCss from './disco-picker-box.scss';
import DiscoAnimations from '../animations/disco-animations.js';

/**
 * A fullscreen "picker-box" modal.
 * Concepts:
 * - Fullscreen, on top of everything.
 * - Supports AppBar.
 * - Has app-title and header like SinglePage.
 * - Animates In: 'slide-up' or 'flip'.
 * - Animates Out: 'slide-down' (reverse of slide-up) or reverse flip.
 * - Manages history state (push on show, back to close).
 * - Suppresses background page animate-out when shown.
 * @extends DiscoPage
 */
class DiscoPickerBox extends DiscoPage {
    /**
     * @param {string} [appTitle]
     * @param {string} [header]
     */
    constructor(appTitle = 'DISCO APP', header = 'PICKER') {
        super();
        this.appTitle = appTitle;
        this.header = header;
        this._flipCount = 5; // Default flip count
        this._animationType = 'flip'; // 'slide-up' | 'flip'

        this.attachShadow({ mode: 'open' });
        this.loadStyle(pickerBoxCss, this.shadowRoot);

        this._container = document.createElement('div');
        this._container.className = 'picker-shell';
        this.shadowRoot.appendChild(this._container);

        this.render();
    }

    static get observedAttributes() {
        return ['app-title', 'header', 'animation', 'flip-count'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'app-title') {
            this.appTitle = newValue || 'DISCO APP';
            if (this._appTitleEl) this._appTitleEl.textContent = this.appTitle;
        }
        else if (name === 'header') {
            this.header = newValue || 'PICKER';
            if (this._appTitleEl) this._appTitleEl.textContent = this.header;
        }
        else if (name === 'animation') {
            this._animationType = (newValue === 'flip') ? 'flip' : 'slide-up';
        }
        else if (name === 'flip-count') {
            const val = parseInt(newValue, 10);
            if (!isNaN(val) && val > 0) this._flipCount = val;
        }
    }

    connectedCallback() {
        if (super.connectedCallback) super.connectedCallback();
        this._ensureFooterAppBarSlot();
        this._appBarSlotObserver = new MutationObserver(() => this._ensureFooterAppBarSlot());
        this._appBarSlotObserver.observe(this, { childList: true });
    }

    disconnectedCallback() {
        if (super.disconnectedCallback) super.disconnectedCallback();
        if (this._appBarSlotObserver) {
            this._appBarSlotObserver.disconnect();
            this._appBarSlotObserver = null;
        }
    }

    /**
     * Public method to show the picker modal.
     * Pushes state to history.
     */
    async show() {
        if (document.body.contains(this)) return; // Already shown

        if (this._root) {
            // Avoid the pre-flip flash by hiding the root until clones are ready
            if (this._animationType === 'flip') {
                this._root.style.visibility = 'hidden';
                this._root.style.opacity = '1';
            } else {
                this._root.style.opacity = '0';
            }
        }

        // Push state
        window.history.pushState({ pickerId: Math.random().toString(36) }, '', window.location.href);
        this._pushedState = true;

        this._popStateListener = () => {
            this._pushedState = false; // We are already back in history
            this.close({ fromPopState: true });
        };
        window.addEventListener('popstate', this._popStateListener, { once: true });

        // Append to DOM (likely document.body or a route root)
        document.body.appendChild(this);

        // Wait for Slot distribution to settle ensure content is available for cloning
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

        // Trigger generic page setup
        // Note: We don't manually suppress background page animate-out as requested 
        // because by appending to body over existing content (and not invoking router), 
        // the background page naturally stays put (and we are an overlay).

        if (this._animationType === 'flip') {
            await this._animateInFlip();
        } else {
            await this._animateInSlideUp();
        }
    }

    /**
     * Public method to close the picker modal.
     */
    async close(options = {}) {
        if (!document.body.contains(this)) return;

        const fromPopState = Boolean(options && options.fromPopState);

        // Clean up history listener if manually called
        if (this._popStateListener) {
            window.removeEventListener('popstate', this._popStateListener);
            this._popStateListener = null;
        }

        // Use flag to prevent double-animation if multiple calls overlap (unlikely but safe)
        if (this._isClosing) return;
        this._isClosing = true;

        if (this._animationType === 'flip') {
            await this._animateOutFlip();
        } else {
            await this._animateOutSlideUp();
        }

        this.remove();

        // If we pushed state and haven't popped yet, do it now.
        if (this._pushedState && !fromPopState) {
            this._pushedState = false;
            window.history.back();
        }

        if (fromPopState) {
            this._pushedState = false;
        }

        this._isClosing = false;
    }

    render() {
        if (!this.shadowRoot || !this._container) return;
        this._container.innerHTML = '';

        this._root = document.createElement('div');
        this._root.className = 'picker-root';

        this._appTitleEl = document.createElement('div');
        this._appTitleEl.className = 'app-title';
        this._appTitleEl.textContent = this.appTitle;

        this._contentViewport = document.createElement('div');
        this._contentViewport.className = 'content-viewport';

        // Slot for user content
        this._slot = document.createElement('slot');
        this._contentViewport.appendChild(this._slot);

        this._footer = document.createElement('div');
        this._footer.className = 'picker-footer';
        const footerSlot = document.createElement('slot');
        footerSlot.name = 'footer';
        this._footer.appendChild(footerSlot);

        this._root.appendChild(this._appTitleEl);
        this._root.appendChild(this._contentViewport);
        this._root.appendChild(this._footer);

        this._container.appendChild(this._root);
        this._ensureFooterAppBarSlot();
    }

    _ensureFooterAppBarSlot() {
        const bars = Array.from(this.querySelectorAll('disco-app-bar'));
        bars.forEach((bar) => {
            if (!bar.hasAttribute('slot')) {
                bar.setAttribute('slot', 'footer');
            }
        });
    }

    async _animateInSlideUp() {
        // Standard slide up from 100vh
        const keyframes = [
            { transform: 'translateY(100vh)', opacity: 1 },
            { transform: 'translateY(0)', opacity: 1 }
        ];
        const opts = { duration: 300, easing: DiscoAnimations.easeOutQuint, fill: 'forwards' };
        await DiscoAnimations.animate(this._root, keyframes, opts).finished;
    }

    async _animateOutSlideUp() {
        const keyframes = [
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(100vh)', opacity: 1 }
        ];
        const opts = { duration: 150, easing: DiscoAnimations.easeInQuint, fill: 'forwards' };
        await DiscoAnimations.animate(this._root, keyframes, opts).finished;
    }

    // --- FLIP ANIMATION ---

    async _animateInFlip() {
        if (!this._root) return;

        const contentSource = this._getFlipClone();
        contentSource.style.visibility = 'visible';

        this._root.style.visibility = 'hidden';

        const count = this._flipCount;
        const strips = [];
        const contentHeight = this._root.clientHeight || window.innerHeight;
        const sliceHeight = contentHeight / count;

        const animContainer = document.createElement('div');
        animContainer.style.position = 'absolute';
        animContainer.style.inset = '0';
        animContainer.style.width = '100%';
        animContainer.style.height = '100%';
        animContainer.style.overflow = 'hidden';
        animContainer.style.zIndex = '9999';
        animContainer.style.perspective = '1000px';
        animContainer.style.pointerEvents = 'none';
        animContainer.style.display = 'flex';
        animContainer.style.flexDirection = 'column';
        this._container.appendChild(animContainer);

        const getNodesForSlot = (name) => {
            const selector = name ? `slot[name="${name}"]` : 'slot:not([name])';
            const realSlot = this._root.querySelector(selector);
            return realSlot ? realSlot.assignedNodes({ flatten: true }) : [];
        };

        for (let i = 0; i < count; i++) {
            const strip = document.createElement('div');
            strip.className = 'flip-strip';
            strip.style.height = `${sliceHeight}px`;

            strip.style.transform = 'rotateX(90deg)';
            strip.style.opacity = '0';

            const content = contentSource.cloneNode(true);
            content.classList.add('flip-strip-content');
            content.style.visibility = 'visible';
            content.style.height = `${contentHeight}px`;
            content.style.top = `-${i * sliceHeight}px`;

            const slots = Array.from(content.querySelectorAll('slot'));
            slots.forEach((slotEl) => {
                const slotName = slotEl.name || null;
                const realNodes = getNodesForSlot(slotName);
                if (realNodes.length > 0) {
                    const frag = document.createDocumentFragment();
                    realNodes.forEach((node) => frag.appendChild(node.cloneNode(true)));
                    slotEl.replaceWith(frag);
                } else {
                    slotEl.remove();
                }
            });

            strip.appendChild(content);
            animContainer.appendChild(strip);
            strips.push(strip);
        }

        const stagger = 200 / count;
        const promises = strips.map((strip, i) => {
            const delay = i * stagger;
            return DiscoAnimations.animate(strip, [
                { transform: 'rotateX(90deg)', opacity: 1 },
                { transform: 'rotateX(0deg)', opacity: 1 }
            ], {
                duration: 100,
                delay,
                easing: 'ease-out',
                fill: 'forwards'
            }).finished;
        });

        await Promise.all(promises);
        animContainer.remove();
        this._root.style.visibility = '';
    }

    async _animateOutFlip() {
        if (!this._root) return;

        const contentSource = this._getFlipClone();
        contentSource.style.visibility = 'visible';

        this._root.style.visibility = 'hidden';

        const count = this._flipCount;
        const strips = [];
        const contentHeight = this._root.clientHeight || window.innerHeight;
        const sliceHeight = contentHeight / count;

        const animContainer = document.createElement('div');
        animContainer.style.position = 'absolute';
        animContainer.style.inset = '0';
        animContainer.style.width = '100%';
        animContainer.style.height = '100%';
        animContainer.style.overflow = 'hidden';
        animContainer.style.zIndex = '9999';
        animContainer.style.perspective = '1000px';
        animContainer.style.pointerEvents = 'none';
        animContainer.style.display = 'flex';
        animContainer.style.flexDirection = 'column';
        this._container.appendChild(animContainer);

        const getNodesForSlot = (name) => {
            const selector = name ? `slot[name="${name}"]` : 'slot:not([name])';
            const realSlot = this._root.querySelector(selector);
            return realSlot ? realSlot.assignedNodes({ flatten: true }) : [];
        };

        for (let i = 0; i < count; i++) {
            const strip = document.createElement('div');
            strip.className = 'flip-strip';
            strip.style.height = `${sliceHeight}px`;

            strip.style.transform = 'rotateX(0deg)';
            strip.style.opacity = '1';

            const content = contentSource.cloneNode(true);
            content.classList.add('flip-strip-content');
            content.style.visibility = 'visible';
            content.style.height = `${contentHeight}px`;
            content.style.top = `-${i * sliceHeight}px`;

            const slots = Array.from(content.querySelectorAll('slot'));
            slots.forEach((slotEl) => {
                const slotName = slotEl.name || null;
                const realNodes = getNodesForSlot(slotName);
                if (realNodes.length > 0) {
                    const frag = document.createDocumentFragment();
                    realNodes.forEach((node) => frag.appendChild(node.cloneNode(true)));
                    slotEl.replaceWith(frag);
                } else {
                    slotEl.remove();
                }
            });

            strip.appendChild(content);
            animContainer.appendChild(strip);
            strips.push(strip);
        }

        const stagger = 200 / count;
        const promises = strips.map((strip, i) => new Promise((resolve) => {
            const delay = i * stagger;
            (async () => {
                await DiscoAnimations.animate(strip, [
                    { transform: 'rotateX(0deg)' },
                    { transform: 'rotateX(-90deg)' }
                ], {
                    duration: 100,
                    delay,
                    easing: 'ease-in',
                    fill: 'forwards'
                }).finished;
                strip.style.visibility = 'hidden';
                strip.style.opacity = '0';
                resolve();
            })();
        }));

        await Promise.all(promises);
        animContainer.remove();
    }

    _getFlipClone() {
        if (typeof this.getFlipClone === 'function') {
            const clone = this.getFlipClone();
            if (clone instanceof HTMLElement) return clone;
        }
        return this._root.cloneNode(true);
    }
}

customElements.define('disco-picker-box', DiscoPickerBox);

export default DiscoPickerBox;
