import DiscoPage from '../disco-page.js';
import singlePageCss from './disco-single-page.scss';
import DiscoAnimations from '../animations/disco-animations.js';
import '../disco-scroll-view.js';

/**
 * Single pivot-style page with one header and one content slot.
 * Defaults to a vertical scroll view with extra bottom padding.
 * If the only child is a scroll or list view, scrolling is delegated to that child.
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
        this._slot = document.createElement('slot');
        this._slot.addEventListener('slotchange', () => this._updateScrollMode());

        this._scrollView = document.createElement('disco-scroll-view');
        this._scrollView.className = 'single-page-scrollview';
        this._scrollView.setAttribute('direction', 'vertical');

        this._scrollContent = document.createElement('div');
        this._scrollContent.className = 'single-page-scroll-content';
        this._scrollContent.appendChild(this._slot);
        this._scrollView.appendChild(this._scrollContent);

        this._plainContent = document.createElement('div');
        this._plainContent.className = 'single-page-plain-content';

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
            if (this._appTitleEl) this._appTitleEl.textContent = this.appTitle;
        }
        if (name === 'header') {
            this.header = newValue || 'DETAILS';
            if (this._headerItem) this._headerItem.textContent = this.header;
        }
    }

    connectedCallback() {
        this._updateScrollMode();
    }

    /**
    * @param {DiscoPageAnimationOptions} [options]
    * @returns {Promise<void>}
    */
    async animateInFn(options = { direction: 'forward' }) {
        const appTitle = this._appTitleEl;
        const headerStrip = this._headerStrip;
        const viewport = this._contentViewport;
        const slot = this._slot;
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
    }

    /**
    * @param {DiscoPageAnimationOptions} [options]
    * @returns {Promise<void>}
    */
    async animateOutFn(options = { direction: 'forward' }) {
        const appTitle = this._appTitleEl;
        const headerStrip = this._headerStrip;
        const viewport = this._contentViewport;
        const slot = this._slot;
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
        this._container.innerHTML = '';
        this._root = document.createElement('div');
        this._root.className = 'single-root';

        this._appTitleEl = document.createElement('div');
        this._appTitleEl.className = 'app-title';
        this._appTitleEl.textContent = this.appTitle;

        this._headerStrip = document.createElement('div');
        this._headerStrip.className = 'header-strip';

        this._headerItem = document.createElement('div');
        this._headerItem.className = 'header-item';
        this._headerItem.textContent = this.header;
        this._headerStrip.appendChild(this._headerItem);

        this._contentViewport = document.createElement('div');
        this._contentViewport.className = 'content-viewport';
        this._contentViewport.appendChild(this._scrollView);

        this._root.appendChild(this._appTitleEl);
        this._root.appendChild(this._headerStrip);
        this._root.appendChild(this._contentViewport);
        this._container.appendChild(this._root);
        this._updateScrollMode();
    }

    /**
     * @param {Element} element
     * @returns {boolean}
     */
    _isStandaloneScrollChild(element) {
        return element.tagName === 'DISCO-SCROLL-VIEW' || element.tagName === 'DISCO-LIST-VIEW';
    }

    _updateScrollMode() {
        if (!this._slot || !this._contentViewport) return;
        const assigned = this._slot.assignedElements({ flatten: true })
            .filter((el) => el instanceof Element);
        const disableScroll = assigned.length === 1 && this._isStandaloneScrollChild(assigned[0]);

        if (disableScroll) {
            if (this._plainContent && this._slot.parentElement !== this._plainContent) {
                this._plainContent.appendChild(this._slot);
            }
            if (this._contentViewport.firstChild !== this._plainContent) {
                this._contentViewport.replaceChildren(this._plainContent);
            }
            return;
        }

        if (this._scrollContent && this._slot.parentElement !== this._scrollContent) {
            this._scrollContent.appendChild(this._slot);
        }
        if (this._contentViewport.firstChild !== this._scrollView) {
            this._contentViewport.replaceChildren(this._scrollView);
        }
    }
}

customElements.define('disco-single-page', DiscoSinglePage);

export default DiscoSinglePage;
