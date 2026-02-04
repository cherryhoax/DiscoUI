import DiscoPage from '../disco-page.js';
import pivotPageCss from './disco-pivot-page.scss';
import DiscoAnimations from '../animations/disco-animations.js';
import '../disco-flip-view.js';

/**
 * Pivot-style page with header strip and flip-view content.
 * @extends DiscoPage
 */
class DiscoPivotPage extends DiscoPage {
  /**
   * @typedef {HTMLElement & { _updateChildrenLayout?: () => void }} PivotViewport
   */
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

  static get observedAttributes() {
    return ['app-title'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'app-title' && oldValue !== newValue) {
        this.appTitle = newValue;
        const titleEl = this.shadowRoot?.querySelector('.app-title');
        if (titleEl) {
            titleEl.textContent = newValue;
        }
    }
  }

  /**
    * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateInFn(options = { direction: 'forward' }) {
    this._setAnimationOverflow(true);
    try {
      await DiscoAnimations.animationSet.page.in(this, options);
    } finally {
      this._setAnimationOverflow(false);
    }
  }

  /**
    * @param {DiscoPageAnimationOptions} [options]
   * @returns {Promise<void>}
   */
  async animateOutFn(options = { direction: 'forward' }) {
    this._setAnimationOverflow(true);
    try {
      await DiscoAnimations.animationSet.page.out(this, options);
    } finally {
      this._setAnimationOverflow(false);
    }
  }

  /**
   * @param {boolean} enabled
   */
  _setAnimationOverflow(enabled) {
    if (enabled) {
      this.setAttribute('data-animating', '');
      this._isAnimating = true;
    } else {
      this.removeAttribute('data-animating');
      this._isAnimating = false;
    }
    const viewport = this._getViewport();
    if (viewport) {
      viewport.style.overflow = enabled ? 'visible' : '';
      viewport.style.contain = enabled ? 'none' : '';
      const wrapper = viewport.shadowRoot?.querySelector('.scroll-content');
      if (wrapper instanceof HTMLElement) {
        wrapper.style.overflow = enabled ? 'visible' : '';
      }
      if (enabled) {
        this._animPrevOverscrollMode = viewport.getAttribute('overscroll-mode');
        if ((this._animPrevOverscrollMode || '').toLowerCase() === 'loop') {
          viewport.removeAttribute('overscroll-mode');
        }
        if (typeof viewport._updateChildrenLayout === 'function') {
          viewport._updateChildrenLayout();
        }
      } else if (this._animPrevOverscrollMode != null) {
        viewport.setAttribute('overscroll-mode', this._animPrevOverscrollMode);
        this._animPrevOverscrollMode = null;
        if (typeof viewport._updateChildrenLayout === 'function') {
          viewport._updateChildrenLayout();
        }
      }
    }
    const pivotItems = /** @type {HTMLElement[]} */ (Array.from(this.querySelectorAll('disco-pivot-item')));
    if (enabled) {
      pivotItems.forEach((item) => {
        item.style.visibility = 'visible';
        item.style.opacity = '1';
        item.style.transition = 'none';
        item.style.animation = 'none';
      });
    } else {
      pivotItems.forEach((item) => {
        item.style.visibility = '';
        item.style.opacity = '';
        item.style.transition = '';
        item.style.animation = '';
      });
    }
  }

  /**
   * @returns {PivotViewport | null}
   */
  _getViewport() {
    const viewport = this.shadowRoot?.getElementById('viewport');
    return viewport instanceof HTMLElement ? /** @type {PivotViewport} */ (viewport) : null;
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
        <disco-flip-view class="content-viewport" id="viewport" direction="horizontal" snap-mode="stop" overscroll-mode="loop" scroll-limit="page">
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
    const scrollView = /** @type {{ scrollTo?: (x: number, y: number, animate?: boolean) => void }} */ (viewport);
    if (viewport.tagName === 'DISCO-SCROLL-VIEW' && typeof scrollView.scrollTo === 'function') {
      scrollView.scrollTo(left, 0, smooth);
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
    const viewport = this._getViewport();
    if (!strip || !viewport) return;

    const items = /** @type {HTMLElement[]} */ (Array.from(this.querySelectorAll('disco-pivot-item')));
    strip.innerHTML = '';

    // Create 11 sets of headers to simulate infinite strip
    // Index 5 is middle (0,1,2,3,4, [5], 6,7,8,9,10)
    const sets = Array.from({ length: 11 }, (_, i) => i);

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
    const viewport = this._getViewport();
    if (!viewport) return;
    const span = this.getPageSpan ? this.getPageSpan(viewport) : (viewport.clientWidth || 1);
    this.scrollViewportTo(viewport, 0, false);
  }

  /**
   * @returns {void}
   */
  setupScrollSync() {
    const viewport = this._getViewport();
    const strip = this.shadowRoot?.getElementById('headerStrip');
    if (!viewport || !strip) return;

    const items = () => /** @type {HTMLElement[]} */ (Array.from(this.querySelectorAll('disco-pivot-item')));
    const isFromNestedFlipView = (event) => {
      if (!event || typeof event.composedPath !== 'function') return false;
      const path = event.composedPath();
      for (const node of path) {
        if (node === viewport) break;
        if (node instanceof HTMLElement && node.tagName === 'DISCO-FLIP-VIEW') return true;
      }
      return false;
    };

    // Visibility Management
    let dragStartIndex = 0;
    let isSnapping = false;
    let snapTargetIndex = null;

    const showAllItems = () => {
      const itemElements = items();
      itemElements.forEach((el) => {
        el.style.visibility = 'visible';
        el.style.opacity = '1';
        el.style.transition = 'none';
      });
    };

    const setVisibleItems = (indices) => {
      if (this._isAnimating) {
        showAllItems();
        return;
      }
      const itemElements = items();
      const count = itemElements.length;
      if (count === 0) return;
      const set = new Set(indices.map(i => ((i % count) + count) % count));
        
      itemElements.forEach((el, i) => {
        if (set.has(i)) {
          el.style.visibility = 'visible';
          el.style.opacity = '1';
          el.style.transition = 'none';
        } else {
          el.style.visibility = 'hidden';
          el.style.opacity = '0';
          el.style.transition = 'none';
        }
      });
    };

    // Initialize visibility
    requestAnimationFrame(() => {
      if (this._isAnimating) {
        showAllItems();
      } else {
        setVisibleItems([0]);
      }
        // Trigger initial header measurement/scroll
        if (items().length > 0) {
            updateHeaders(); 
            // Also center the strip initially
            const { totalWidth } = measureOneSet();
            const w = totalWidth; 
            strip.scrollLeft = w * 5;
        }
    });

    // --- Header Interaction Sync ---
    // Forward pointer events from headers to viewport to allow dragging from the top
    strip.addEventListener('pointerdown', (e) => {
        strip.setPointerCapture(e.pointerId);
        
        const cloneEvent = (type, original) => {
            return new PointerEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window,
                pointerId: original.pointerId,
                isPrimary: original.isPrimary,
                clientX: original.clientX,
                clientY: original.clientY,
                screenX: original.screenX,
                screenY: original.screenY,
                movementX: original.movementX,
                movementY: original.movementY,
                button: original.button,
                buttons: original.buttons
            });
        };

        viewport.dispatchEvent(cloneEvent('pointerdown', e));

        const startX = e.clientX;
        const startY = e.clientY;
        const targetHeader = (e.target instanceof Element) ? e.target.closest('.header-item') : null;
        let isTap = true;

        const onSysMove = (moveE) => {
            if (moveE.pointerId !== e.pointerId) return;
            viewport.dispatchEvent(cloneEvent('pointermove', moveE));
            
            const dist = Math.hypot(moveE.clientX - startX, moveE.clientY - startY);
            if (dist > 10) isTap = false;
        };

        const onSysUp = (upE) => {
            if (upE.pointerId !== e.pointerId) return;
            strip.removeEventListener('pointermove', onSysMove);
            strip.removeEventListener('pointerup', onSysUp);
            try { strip.releasePointerCapture(upE.pointerId); } catch(ex){}

            viewport.dispatchEvent(cloneEvent('pointerup', upE));

            if (isTap && targetHeader instanceof HTMLElement) {
              const i = parseInt(targetHeader.dataset.index || '0', 10);
                navigateToIndex(i);
            }
        };

        strip.addEventListener('pointermove', onSysMove);
        strip.addEventListener('pointerup', onSysUp);
    });

    const navigateToIndex = (index) => {
      const span = this.getPageSpan(viewport);
      const currentVirtual = viewport.scrollLeft;
      const count = items().length;
      
      const currentVirtualPage = currentVirtual / span;
      const currentCycle = Math.round(currentVirtualPage / count);
      
      let targetPage = currentCycle * count + index;
      
      // Optimize shortest path
      if (Math.abs((targetPage - count) - currentVirtualPage) < Math.abs(targetPage - currentVirtualPage)) {
        targetPage -= count;
      } else if (Math.abs((targetPage + count) - currentVirtualPage) < Math.abs(targetPage - currentVirtualPage)) {
        targetPage += count;
      }
      
      this.scrollViewportTo(viewport, targetPage * span, true);
    };

    viewport.addEventListener('pointerdown', (e) => {
      if (isFromNestedFlipView(e)) return;
      if (this._isAnimating) {
        showAllItems();
        return;
      }
        // User interaction starts
        isSnapping = false;
        snapTargetIndex = null;
        
        const span = this.getPageSpan(viewport);
        // Determine current page based on scroll position
        const current = Math.round(viewport.scrollLeft / span);
        dragStartIndex = current;
        
        // Hide everything except where we started
        setVisibleItems([dragStartIndex]);
        updateHeaders();
    });

    const measureOneSet = () => {
      const headersAll = Array.from(strip.children).map((el) => /** @type {HTMLElement} */(el));
      const styles = getComputedStyle(strip);
      const gapVal = parseFloat(styles.columnGap || styles.gap || '0') || 0;
      
      const count = items().length;
      const firstSet = headersAll.slice(0, count);

      const offsets = [0];
      firstSet.forEach((el, i) => {
        const prev = offsets[i];
        offsets.push(prev + el.offsetWidth + gapVal);
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

    viewport.addEventListener('disco-snap-target', async (e) => {
      if (isFromNestedFlipView(e)) return;
      if (this._isAnimating) {
        showAllItems();
        return;
      }
        const detail = /** @type {{ index: number, targetX?: number }} */ ((/** @type {CustomEvent} */(e)).detail || { index: 0 });
        isSnapping = true;
        const idx = detail.index;
        const count = items().length || 1;
        const normalizedTarget = ((idx % count) + count) % count;
        
        snapTargetIndex = normalizedTarget;
        
        // Show BOTH the previous (dragStart) and the new Target during animation
        setVisibleItems([dragStartIndex, normalizedTarget]);
        
        // Force header update
        updateHeaders();

        // Only animate if changing pages
        if (normalizedTarget !== dragStartIndex) {
            // Calculate custom entrance animation offset
            const dist = (detail.targetX || 0) - viewport.scrollLeft;
            const width = viewport.clientWidth;
            
            // "translateX(viewport.width - dist) to translateX(0)"
            let offset = width - Math.abs(dist) + width * 0.25; // Add small extra offset
            if (dist < 0) {
                // Moving left, offset should be negative
                offset = -offset;
            }
            
            const targetItem = /** @type {HTMLElement & { playEntranceAnimation?: (offset: number, duration: number) => Promise<void> }} */ (items()[normalizedTarget]);
            if (targetItem && typeof targetItem.playEntranceAnimation === 'function') {
              targetItem.style.visibility = 'hidden';
               await new Promise(resolve => setTimeout(resolve, 100));
               targetItem.style.visibility = '';
               await targetItem.playEntranceAnimation(offset, 1000);
            }
        }
        
        // Cleanup after animation
        // Only if we haven't started a new interaction
        if (isSnapping && snapTargetIndex === normalizedTarget) {
             dragStartIndex = normalizedTarget;
             setVisibleItems([normalizedTarget]);
             isSnapping = false; 
        }
    });

    const updateHeaders = () => {
        let scrollX = viewport.scrollLeft;
        const pageSpan = getPageSpan();
        const headers = Array.from(strip.children).map((el) => /** @type {HTMLElement} */(el));
        const count = items().length || 1;
        if (count === 0) return;

        const { offsets, totalWidth: cycleWidth } = measureOneSet();
      
        const pagePos = scrollX / pageSpan;
        const wrappedPagePos = ((pagePos % count) + count) % count;
        
        // Use snapTargetIndex if active, else geometric calculation
        const currentIndex = snapTargetIndex !== null ? snapTargetIndex : (Math.round(wrappedPagePos) % count);

        const clampedBase = Math.floor(wrappedPagePos);
        const frac = wrappedPagePos - clampedBase;
        
        const start = offsets[clampedBase] ?? 0;
        const end = offsets[clampedBase + 1] ?? cycleWidth;
        const localOffset = start + frac * (end - start);
        
        strip.scrollLeft = (cycleWidth * 5) + localOffset;

        headers.forEach((h) => {
            const idx = Number(h.dataset.index || 0);
            h.style.opacity = idx === currentIndex ? '1' : '0.5';
            h.style.transform = 'none';
        });
    };

    viewport.addEventListener('scroll', (e) => {
      if (isFromNestedFlipView(e)) return;
      if (this._isAnimating) {
        showAllItems();
        return;
      }
        updateHeaders();
        // If simply dragging, ensure visibility is enforced
        if (!isSnapping) {
             setVisibleItems([dragStartIndex]);
        }
    });

    // Check if hideInactiveItems logic exists from previous edit attempt and remove it if so
    // ...
  }
}

customElements.define('disco-pivot-page', DiscoPivotPage);

export default DiscoPivotPage;
