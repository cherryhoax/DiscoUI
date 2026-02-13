import DiscoPage from '../page/disco-page.js';
import pickerBoxCss from './disco-picker-box.scss';
import DiscoAnimations from '../animations/disco-animations.js';

/**
 * A fullscreen "picker-box" modal.
 * Concepts:
 * - Fullscreen, on top of everything.
 * - Supports AppBar.
 * - Has app-title and header like SinglePage.
 * - Animates In: 'slide-up', 'flip', or none.
 * - Animates Out: 'slide-down' (reverse of slide-up), reverse flip, or none.
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
        this._animationType = 'flip'; // 'slide-up' | 'flip' | 'none'

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
            if (newValue === 'flip') {
                this._animationType = 'flip';
            } else if (newValue === 'none') {
                this._animationType = 'none';
            } else {
                this._animationType = 'slide-up';
            }
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
            await DiscoAnimations.animationSet.pickerBox.inFlip(this);
        } else if (this._animationType === 'slide-up') {
            await DiscoAnimations.animationSet.pickerBox.inSlide(this);
        } else if (this._root) {
            this._root.style.visibility = 'visible';
            this._root.style.opacity = '1';
            this._root.style.transform = 'none';
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
            await DiscoAnimations.animationSet.pickerBox.outFlip(this);
        } else if (this._animationType === 'slide-up') {
            await DiscoAnimations.animationSet.pickerBox.outSlide(this);
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
