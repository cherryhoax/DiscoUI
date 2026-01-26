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
    
    // Create 11 sets of headers to simulate infinite strip
    // Index 5 is middle (0,1,2,3,4, [5], 6,7,8,9,10)
    const sets = Array.from({length: 11}, (_, i) => i);
    
    sets.forEach(setIndex => {
      items.forEach((item, i) => {
        const h = document.createElement('div');
        h.className = 'header-item';
        h.dataset.index = `${i}`;
        h.dataset.set = `${setIndex}`;
        h.textContent = item.getAttribute('header') || `item ${i + 1}`;
        h.style.opacity = '0.5';
        h.style.flexShrink = '0'; // Ensure accurate measurement
        
        h.onclick = () => {
          // Find nearest target page index to current virtual position
          const span = this.getPageSpan(viewport);
          const currentVirtual = viewport.scrollLeft;
          const currentVirtualPage = currentVirtual / span;
          const targetBase = i;
          
          // Determine nearest multiple of count
          const count = items.length;
          const currentCycle = Math.round(currentVirtualPage / count);
          
          // Target page in roughly the same cycle
          let targetPage = currentCycle * count + targetBase;
          
          // Optimize direction
          if (Math.abs((targetPage - count) - currentVirtualPage) < Math.abs(targetPage - currentVirtualPage)) {
            targetPage -= count;
          } else if (Math.abs((targetPage + count) - currentVirtualPage) < Math.abs(targetPage - currentVirtualPage)) {
            targetPage += count;
          }
          
          this.scrollViewportTo(viewport, targetPage * span, true);
        };
        strip.appendChild(h);
      });
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

    // Use a small delay/rAF to ensure layout is stable before initial sync
    requestAnimationFrame(() => {
        // Initial setup
        const items = Array.from(this.querySelectorAll('disco-pivot-item'));
        const count = items.length || 1;
        if (count > 0) {
            // Measure one set
            const headersAll = Array.from(strip.children).map((el) => /** @type {HTMLElement} */(el));
            // Considering we rendered 3 sets, first set is indices 0 to count-1
            const firstSet = headersAll.slice(0, count);
            
            const styles = getComputedStyle(strip);
            const gapVal = parseFloat(styles.columnGap || styles.gap || '0') || 0;
            
            let w = 0;
            firstSet.forEach((el, i) => {
               w += el.offsetWidth + (i < count ? gapVal : 0);
            });
            // Total width of one set of headers (including gaps)
            // Note: the last gap is conceptually part of the set for seamless tiling
            // but in DOM flow, it might be spacing. 
            // In 'renderHeaders', items are flex children.
            // Let's assume uniform distribution logic from measureHeaders below is safest.

            // Reset scroll to middle set
            strip.scrollLeft = w;
            
            // Force update of opacity/position sync
            viewport.dispatchEvent(new Event('scroll'));
        }
    });

    const items = () => Array.from(this.querySelectorAll('disco-pivot-item'));
    const measureOneSet = () => {
      const headersAll = Array.from(strip.children).map((el) => /** @type {HTMLElement} */(el));
      const styles = getComputedStyle(strip);
      const gapVal = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      
      const count = items().length;
      // We only measure the first 'count' headers to establish the rhythm
      const firstSet = headersAll.slice(0, count);

      const offsets = [0];
      firstSet.forEach((el, i) => {
        const prev = offsets[i];
        offsets.push(prev + el.offsetWidth + gapVal);
      });

      // The total width of one cycle
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

        const { offsets, totalWidth: cycleWidth } = measureOneSet();
      
        // Current logical page position (floating point)
        const pagePos = scrollX / pageSpan;
        
        // Wrap to [0, count)
        const wrappedPagePos = ((pagePos % count) + count) % count;

        const currentIndex = Math.round(wrappedPagePos) % count;

        // Calculate offset within one cycle
        const clampedBase = Math.floor(wrappedPagePos);
        const frac = wrappedPagePos - clampedBase;
        
        // offsets has length count+1. 
        // clampedBase is 0..count-1. 
        // nextBase is clampedBase + 1.
        const start = offsets[clampedBase] ?? 0;
        const end = offsets[clampedBase + 1] ?? cycleWidth;
        
        const localOffset = start + frac * (end - start);
        
        // Target scroll position:
        // We want the active header (in the middle set) to be roughly where it should be.
        // Actually, standard Pivot behavior: The strip scrolls so the 'active' header is at LHS (or specific offset).
        // Since we have 3 sets, we target the middle set (Set 1).
        // Set 0 is [0..W], Set 1 is [W..2W], Set 2 is [2W..3W].
        // Offset = cycleWidth + localOffset.
        
        // However, we want 'active' header to be visible.
        // If we simply set scrollLeft = cycleWidth + localOffset, the Left edge of the strip will
        // align with the Start of the active header (because localOffset is the start of `currentIndex`).
        // This is usually what we want (active header at left).
        
        strip.scrollLeft = cycleWidth + localOffset;

        headers.forEach((h) => {
            const idx = Number(h.dataset.index || 0);
            const dist = Math.min(Math.abs(idx - wrappedPagePos), Math.abs(idx - (wrappedPagePos - count)), Math.abs(idx - (wrappedPagePos + count)));
            
            // Simple opacity toggle or smooth fade? Existing was switch.
            // Let's keep it simple: index logic
            h.style.opacity = idx === currentIndex ? '1' : '0.5';
            h.style.transform = 'none';
        });
    });
  }
}

customElements.define('disco-pivot-page', DiscoPivotPage);

export default DiscoPivotPage;
