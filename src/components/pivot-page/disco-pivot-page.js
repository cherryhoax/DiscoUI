import DiscoPage from '../disco-page.js';
import pivotPageCss from './disco-pivot-page.scss';
import DiscoAnimations from '../animations/disco-animations.js';
import '../disco-flip-view.js';

class DiscoPivotPage extends DiscoPage {
  /**
   * @typedef {object} DiscoPageAnimationOptions
   * @property {'forward' | 'back'} direction
   */

  /**
   * @param {string} [appTitle]
   */
  constructor(appTitle = 'DISCO APP') {
    super();
    this.appTitle = appTitle;
    this.attachShadow({ mode: 'open' });
    this.loadStyle(pivotPageCss, this.shadowRoot);
    this._container = document.createElement('div');
    this._container.className = 'pivot-shell';
    this.shadowRoot.appendChild(this._container);
    this.render();
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

  /**
   * @returns {void}
   */
  connectedCallback() {
    this.renderHeaders();
    this.setupScrollSync();
  }

  /**
   * @returns {void}
   */
  render() {
    if (!this.shadowRoot || !this._container) return;
    this._container.innerHTML = `
      <div class="pivot-root">
        <div class="app-title">${this.appTitle}</div>
        <div class="header-strip" id="headerStrip"></div>
        <disco-flip-view class="content-viewport" id="viewport" direction="horizontal" snap-mode="stop" overscroll-mode="loop">
          <slot></slot>
        </disco-flip-view>
      </div>
    `;
  }

  /**
   * @param {HTMLElement} viewport
   * @param {number} left
   * @param {boolean} smooth
   */
  scrollViewportTo(viewport, left, smooth = true) {
    if (!viewport) return;
    if (viewport.tagName === 'DISCO-SCROLL-VIEW' && typeof viewport.scrollTo === 'function') {
      viewport.scrollTo(left, 0, smooth);
      return;
    }
    if (smooth && typeof viewport.scrollTo === 'function') {
      viewport.scrollTo({ left, behavior: 'smooth' });
      return;
    }
    viewport.scrollLeft = left;
  }

  /**
   * @returns {void}
   */
  renderHeaders() {
    const strip = this.shadowRoot?.getElementById('headerStrip');
    const viewport = this.shadowRoot?.getElementById('viewport');
    if (!strip || !viewport) return;

    const items = Array.from(this.querySelectorAll('disco-pivot-item'));
    strip.innerHTML = '';

    // Build first real set
    items.forEach((item, i) => {
      const h = document.createElement('div');
      h.className = 'header-item';
      h.dataset.index = `${i}`;
      h.dataset.real = 'true';
      h.textContent = item.getAttribute('header') || `item ${i + 1}`;
      h.style.opacity = i === 0 ? '1' : '0.5';
      h.onclick = () => {
        const span = this.getPageSpan(viewport);
        this.scrollViewportTo(viewport, i * span, true);
      };
      strip.appendChild(h);
    });
  }

  /**
   * @returns {void}
   */
  jumpToFirstPage() {
    const viewport = this.shadowRoot?.getElementById('viewport');
    if (!viewport) return;
    const span = this.getPageSpan ? this.getPageSpan(viewport) : (viewport.clientWidth || 1);
    this.scrollViewportTo(viewport, 0, false);
  }

  /**
   * @returns {void}
   */
  setupScrollSync() {
    const viewport = this.shadowRoot?.getElementById('viewport');
    const strip = this.shadowRoot?.getElementById('headerStrip');
    if (!viewport || !strip) return;

    const items = () => Array.from(this.querySelectorAll('disco-pivot-item'));
    const measureHeaders = () => {
      const headersAll = Array.from(strip.children).map((el) => /** @type {HTMLElement} */(el));
      const styles = getComputedStyle(strip);
      const gapVal = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      const realHeaders = headersAll.filter((h) => h.dataset.real === 'true');

      const offsets = [0];
      realHeaders.forEach((el, i) => {
        const prev = offsets[i];
        offsets.push(prev + el.offsetWidth + (i < realHeaders.length - 1 ? gapVal : 0));
      });

      const totalWidth = offsets[offsets.length - 1] || 1;
      return { offsets, totalWidth, gapVal };
    };
    const getPageSpan = (vp = viewport) => {
      const width = vp.clientWidth || 1;
      const first = items()[0];
      const mr = first ? parseFloat(getComputedStyle(first).marginRight || '0') || 0 : 0;
      return width + mr;
    };
    this.getPageSpan = getPageSpan;

    viewport.addEventListener('scroll', () => {
      let scrollX = viewport.scrollLeft;
      const pageSpan = getPageSpan();
      const headers = Array.from(strip.children).map((el) => /** @type {HTMLElement} */(el));
      const count = items().length || 1;
      if (count === 0) return;

      // Map page scroll to header scroll distance based on measured header widths.
      const { offsets, totalWidth: headerSetWidth } = measureHeaders();
      const maxScrollable = Math.max(headerSetWidth - strip.clientWidth, 0);

      const currentIndex = Math.round(scrollX / pageSpan) % count;
      let pagePos = scrollX / pageSpan; // pages scrolled (can be fractional)
      
      // Handle infinite loop wrapping for header animation
      if (viewport.getAttribute('overscroll-mode') === 'loop') {
         pagePos = (pagePos % count + count) % count;
      }

      // Use live measured widths + uniform gap for precise interpolation per page.
      const clampedBase = Math.max(0, Math.min(Math.floor(pagePos), offsets.length - 2));
      const frac = pagePos - clampedBase;
      const start = offsets[clampedBase] ?? 0;
      const end = offsets[clampedBase + 1] ?? headerSetWidth;
      const headerPos = Math.min(start + frac * (end - start), maxScrollable);
      strip.scrollLeft = headerPos;

      headers.forEach((h) => {
        const idx = Number(h.dataset.index || 0);
        h.style.opacity = idx === currentIndex ? '1' : '0.5';
        h.style.transform = 'none'; // disable scale animation
      });
    });
  }
}

customElements.define('disco-pivot-page', DiscoPivotPage);

export default DiscoPivotPage;
