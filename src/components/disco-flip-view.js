import DiscoScrollView from './disco-scroll-view.js';
import flipViewCss from './disco-flip-view.scss';

/**
 * Flip-style view that pages children horizontally or vertically with loop overscroll support.
 * @extends DiscoScrollView
 */
class DiscoFlipView extends DiscoScrollView {
  constructor() {
    super();
    this.loadStyle(flipViewCss, this.shadowRoot);
    // Force horizontal direction by default
    if (!this.hasAttribute('direction')) this.setAttribute('direction', 'horizontal');

    this._boundUpdateChildren = this._updateChildrenLayout.bind(this);
    this._slotObserver = new MutationObserver(this._boundUpdateChildren);
    this._loopInitialized = false;
    this._lastPageSize = 0;
  }

  static get observedAttributes() {
    return ['direction', 'overscroll-mode'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (super.attributeChangedCallback) {
      super.attributeChangedCallback(name, oldValue, newValue);
    }
    if (name === 'overscroll-mode') {
      this._loopInitialized = false;
      this._updateChildrenLayout();
    }
  }

  connectedCallback() {
    super.connectedCallback();
    // ensure children are full-size pages
    const slot = this.shadowRoot.querySelector('slot');
    if (slot) {
      // Initial sizing after layout
      requestAnimationFrame(() => this._updateChildrenLayout());
      // Observe light DOM changes to reapply sizing
      this._slotObserver.observe(this, { childList: true, subtree: true });
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._slotObserver.disconnect();
  }


  _updateMetrics() {
    if (super._updateMetrics) super._updateMetrics();
    if (!this._isLooping()) return;

    const pageSize = this.direction === 'horizontal'
      ? (this.clientWidth || 1)
      : (this.clientHeight || 1);

    if (!Number.isFinite(pageSize) || pageSize <= 1) return;

    if (!Number.isFinite(this._lastPageSize) || this._lastPageSize <= 1) {
      this._loopVirtualX = 0;
      this._loopVirtualY = 0;
      this._loopInitialized = true;
    }

    this._lastPageSize = pageSize;
    this._renderLoop();
  }

  _updateChildrenLayout() {
    if (this._isLooping()) {
      this.style.overflow = 'hidden';
      const nodes = this._getPageElements();
      nodes.forEach(node => {
        node.style.position = 'absolute';
        node.style.top = '0';
        node.style.left = '0';
        node.style.width = '100%';
        node.style.height = '100%';
        node.style.willChange = 'transform';
      });
      // Ensure we have a valid virtual position
      if (!this._loopInitialized) {
        this._loopVirtualX = 0;
        this._loopVirtualY = 0;
        this._loopInitialized = true;
      } else {
        if (!Number.isFinite(this._loopVirtualX)) this._loopVirtualX = 0;
        if (!Number.isFinite(this._loopVirtualY)) this._loopVirtualY = 0;
      }
      this._renderLoop();
    } else {
      this.style.overflow = '';
      const nodes = this._getPageElements();
      nodes.forEach(node => {
        node.style.position = '';
        node.style.top = '';
        node.style.left = '';
        node.style.width = '';
        node.style.height = '';
        node.style.willChange = '';
        node.style.transform = '';
      });
    }
  }

  get scrollLeft() {
    if (this._isLooping() && this.direction === 'horizontal') {
      return this._loopVirtualX || 0;
    }
    return super.scrollLeft;
  }

  set scrollLeft(val) {
    if (this._isLooping() && this.direction === 'horizontal') {
      if (this._loopVirtualX !== val) {
        this._loopVirtualX = val;
        this._renderLoop();
      }
    } else {
      super.scrollLeft = val;
    }
  }

  get scrollTop() {
    if (this._isLooping() && this.direction === 'vertical') {
      return this._loopVirtualY || 0;
    }
    return super.scrollTop;
  }

  set scrollTop(val) {
    if (this._isLooping() && this.direction === 'vertical') {
      if (this._loopVirtualY !== val) {
        this._loopVirtualY = val;
        this._renderLoop();
      }
    } else {
      super.scrollTop = val;
    }
  }

  _renderLoop() {
    const { direction, pageSize, span, count } = this._getLoopMetrics();
    if (count === 0) return;

    const nodes = this._getPageElements();
    
    // We render based on _loopVirtualX/Y
    // Use modulo arithmetic to wrap items around
    const virtual = direction === 'horizontal' ? (this._loopVirtualX || 0) : (this._loopVirtualY || 0);

    nodes.forEach((node, i) => {
      // Theoretical position if just a long strip
      const rawOffset = i * pageSize - virtual;
      
      // Wrap into [-span/2, span/2] range approximately
      // ((x % n) + n) % n gives [0, n)
      let offset = ((rawOffset % span) + span) % span;
      
      // Adjust to center around 0 (or rather, ensure validity in viewport)
      // If the item is "too far right" relative to the start, 
      // it implies it should have been on the left (wrapped).
      // Threshold: if > span / 2, move it back by span.
      if (offset > span / 2) {
        offset -= span;
      }

      const zIndex = 100000 - (Math.round(Math.abs(offset)) * 10) - i;
      node.style.zIndex = `${zIndex}`;
      
      if (direction === 'horizontal') {
        node.style.transform = `translate3d(${offset}px, 0, 0)`;
      } else {
        node.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
    });

    if (this._emitScroll) this._emitScroll();

    // We also need to "fake" the scrollLeft/Top getters? Done.
  }

  _isLooping() {
    return (this.getAttribute('overscroll-mode') || '').toLowerCase() === 'loop';
  }

  _getLoopMetrics() {
    const direction = this.direction;
    const pageSize = this._getPageSize();
    const nodes = this._getPageElements();
    const count = Math.max(1, nodes.length);
    const span = pageSize * count;
    return { direction, pageSize, count, span };
  }

  /**
   * @returns {number}
   */
  _getPageSize() {
    return this.direction === 'horizontal' ? (this.clientWidth || 1) : (this.clientHeight || 1);
  }

  /**
   * @returns {HTMLElement[]}
   */
  _getPageElements() {
    const slot = this.shadowRoot?.querySelector('slot');
    const nodes = slot ? slot.assignedElements({ flatten: true }) : [];
    return nodes.filter((node) =>
      node instanceof HTMLElement &&
      node.tagName !== 'STYLE' &&
      node.tagName !== 'SCRIPT' &&
      node.tagName !== 'TEMPLATE'
    );
  }


  _onPointerDown(e) {
    super._onPointerDown(e);
    // Capture start position for scroll limiting
    this._dragStartVirtualX = this.scrollLeft;
    this._dragStartVirtualY = this.scrollTop;

    if (!this._isLooping()) return;
    this._loopVirtualX = this.scrollLeft;
    this._loopVirtualY = this.scrollTop;
    this._overscrollX = 0;
    this._overscrollY = 0;
    this._renderOverscroll(0, 0);
  }

  _handleMove(dx, dy) {
    if (!this._isLooping()) {
      super._handleMove(dx, dy);
      return;
    }

    const scrollLimit = (this.getAttribute('scroll-limit') || '').toLowerCase();
    const hasPageLimit = scrollLimit === 'page';

    if (this.direction === 'horizontal') {
      let nextLeft = this.scrollLeft - dx;
      
      if (hasPageLimit) {
        const pageWidth = this.clientWidth || 1;
        const start = this._dragStartVirtualX;
        const diff = nextLeft - start;
        
        // Hard clamp to +/- 1 page
        if (diff > pageWidth) nextLeft = start + pageWidth;
        else if (diff < -pageWidth) nextLeft = start - pageWidth;
      }

      this.scrollLeft = nextLeft;
    } else {
      let nextTop = this.scrollTop - dy;

      if (hasPageLimit) {
        const pageHeight = this.clientHeight || 1;
        const start = this._dragStartVirtualY;
        const diff = nextTop - start;

        if (diff > pageHeight) nextTop = start + pageHeight;
        else if (diff < -pageHeight) nextTop = start - pageHeight;
      }
      this.scrollTop = nextTop;
    }

    this._overscrollX = 0;
    this._overscrollY = 0;
    this._renderOverscroll(0, 0);
  }

  _onWheel(e) {
    if (!this._isLooping()) {
      super._onWheel(e);
      return;
    }

    const nestedScrollView = this._getNestedScrollViewFromEvent(e);
    if (nestedScrollView && nestedScrollView !== this) {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);
      let isHorizontal = absX > absY;
      if (absX === absY) {
        const dir = this._normalizeDirection(this.direction);
        if (dir === 'horizontal') isHorizontal = true;
        if (dir === 'vertical') isHorizontal = false;
      }
      if (this._canScrollInAxis(nestedScrollView, isHorizontal)) return;
    }
    e.preventDefault();
    this._stopAnimation();

    const direction = this.direction;
    const deltaX = direction === 'vertical' ? 0 : e.deltaX;
    const deltaY = direction === 'horizontal' ? 0 : e.deltaY;

    if (direction === 'horizontal') {
      this.scrollLeft += deltaX;
    } else {
      this.scrollTop += deltaY;
    }

    this._overscrollX = 0;
    this._overscrollY = 0;
    this._renderOverscroll(0, 0);
  }

  /**
   * Override momentum launch to snap to exact page widths (no CSS snap involved).
   */
  _launchMomentum() {
    const timeConstant = 100; // ms
    this._timeConstant = timeConstant;

    const vX = this._velocity.x * 1000; // px/sec
    const vY = this._velocity.y * 1000; // px/sec

    let targetX = this.scrollLeft - (vX * (timeConstant / 1000));
    let targetY = this.scrollTop - (vY * (timeConstant / 1000));
    // Only horizontal snapping by default; if direction vertical, snap Y instead
    const direction = this.direction;
    if (direction === 'vertical') targetX = this.scrollLeft;
    if (direction === 'horizontal') targetY = this.scrollTop;

    const pageWidth = this._getPageSize();
    const nodes = this._getPageElements();
    const maxIndex = Math.max(0, nodes.length - 1);
    const overscrollMode = (this.getAttribute('overscroll-mode') || '').toLowerCase();
    const loopEnabled = overscrollMode === 'loop';
    if (loopEnabled) {
      if (direction === 'horizontal' && !Number.isFinite(this._loopVirtualX)) this._loopVirtualX = this.scrollLeft;
      if (direction === 'vertical' && !Number.isFinite(this._loopVirtualY)) this._loopVirtualY = this.scrollTop;
      if (direction === 'horizontal') {
        targetX = this._loopVirtualX - (vX * (timeConstant / 1000));
      } else {
        targetY = this._loopVirtualY - (vY * (timeConstant / 1000));
      }
    }

    if (direction === 'horizontal') {
      const snapMode = (this.getAttribute('snap-mode') || '').toLowerCase();
      const snapStopEnabled = snapMode === 'stop';
      let idx;

      if (snapStopEnabled) {
        // Calculate index based on current position, forcing move to adjacent page if flicked
        const currentPos = (loopEnabled && Number.isFinite(this._loopVirtualX)) ? this._loopVirtualX : this.scrollLeft;
        const currentIdx = currentPos / pageWidth;
        const flickThreshold = 50; // px/sec

        if (Math.abs(vX) > flickThreshold) {
          if (vX < 0) {
            // Moving right (content moves left), index increases
            idx = Math.floor(currentIdx) + 1;
          } else {
            // Moving left (content moves right), index decreases
            idx = Math.ceil(currentIdx) - 1;
          }
        } else {
          idx = Math.round(currentIdx);
        }
      } else {
        // Default momentum behavior: snap to projected target
        idx = Math.round(targetX / pageWidth);
      }

      if (!loopEnabled) {
        idx = Math.max(0, Math.min(maxIndex, idx));
      }
      targetX = idx * pageWidth;
    } else {
      const snapMode = (this.getAttribute('snap-mode') || '').toLowerCase();
      const snapStopEnabled = snapMode === 'stop';
      let idx;

      if (snapStopEnabled) {
        const currentPos = (loopEnabled && Number.isFinite(this._loopVirtualY)) ? this._loopVirtualY : this.scrollTop;
        const currentIdx = currentPos / (this._getPageSize() || 1);
        const flickThreshold = 50;

        if (Math.abs(vY) > flickThreshold) {
          if (vY < 0) {
             idx = Math.floor(currentIdx) + 1;
          } else {
             idx = Math.ceil(currentIdx) - 1;
          }
        } else {
          idx = Math.round(currentIdx);
        }
      } else {
        idx = Math.round(targetY / (this._getPageSize() || 1));
      }

      if (!loopEnabled) {
        idx = Math.max(0, Math.min(maxIndex, idx));
      }
      targetY = idx * (this._getPageSize() || 1);
    }

    // clamp
    if (!loopEnabled) {
      targetX = Math.max(0, Math.min(targetX, this.maxScrollLeft));
      targetY = Math.max(0, Math.min(targetY, this.maxScrollTop));
    }

    this._targetX = targetX;
    this._targetY = targetY;

    this._amplitudeX = targetX - this.scrollLeft;
    this._amplitudeY = targetY - this.scrollTop;
    
    // Dispatch snap event with projected index
    const finalizedIdx = direction === 'horizontal' ? Math.round(targetX / pageWidth) : Math.round(targetY / (this._getPageSize() || 1));
    this.dispatchEvent(new CustomEvent('disco-snap-target', {
      detail: { index: finalizedIdx, targetX, targetY },
      bubbles: true,
      composed: true
    }));

    this._timestampStart = performance.now();
    this._rafId = requestAnimationFrame(this._update);
  }

  _snapToNearestPage() {
    const direction = this.direction;
    const pageSize = this._getPageSize();
    const nodes = this._getPageElements();
    const maxIndex = Math.max(0, nodes.length - 1);
    const overscrollMode = (this.getAttribute('overscroll-mode') || '').toLowerCase();
    const loopEnabled = overscrollMode === 'loop';

    let idx;
    if (direction === 'horizontal') {
      const base = loopEnabled && Number.isFinite(this._loopVirtualX) ? this._loopVirtualX : this.scrollLeft;
      idx = Math.round(base / pageSize);
    } else {
      const base = loopEnabled && Number.isFinite(this._loopVirtualY) ? this._loopVirtualY : this.scrollTop;
      idx = Math.round(base / pageSize);
    }
    if (!loopEnabled) {
      idx = Math.max(0, Math.min(maxIndex, idx));
    }

    const target = idx * pageSize;

    if (direction === 'horizontal') {
      this._targetX = target;
      this._amplitudeX = this._targetX - this.scrollLeft;
    } else {
      this._targetY = target;
      this._amplitudeY = this._targetY - this.scrollTop;
    }
    
    // Dispatch snap event
    this.dispatchEvent(new CustomEvent('disco-snap-target', {
      detail: { index: idx, targetX: this._targetX, targetY: this._targetY },
      bubbles: true,
      composed: true
    }));

    // use a shorter time constant for strict snap
    this._prevTimeConstant = this._timeConstant;
    this._timeConstant = 160;
    this._strictSnapActive = true;
    this._timestampStart = performance.now();
    this._rafId = requestAnimationFrame(this._update);
  }

  _onPointerUp(e) {
    // Adapted from DiscoScrollView._onPointerUp but with snap-mode handling
    this._isDragging = false;
    this._isPreDragging = false;
    this._nestedScrollView = null;
    try { this.releasePointerCapture(e.pointerId); } catch (err) { }
    this._removePointerListeners();

    const overscrollX = Math.abs(this._overscrollX) > 1;
    const overscrollY = Math.abs(this._overscrollY) > 1;

    if (overscrollX || overscrollY) {
      if (overscrollX && overscrollY) {
        this._snapBack(true, true);
        return;
      }
      if (overscrollX) {
        this._velocity.x = 0;
        this._snapBack(true, false, false);
      }
      if (overscrollY) {
        this._velocity.y = 0;
        this._snapBack(false, true, false);
      }
      // If snap-mode is strict, perform strict snap here
      const snapMode = (this.getAttribute('snap-mode') || '').toLowerCase();
      if (snapMode === 'strict') {
        this._snapToNearestPage();
        return;
      }
      // otherwise fallthrough to momentum
      this._launchMomentum();
      return;
    }

    const snapMode = (this.getAttribute('snap-mode') || '').toLowerCase();
    if (snapMode === 'strict') {
      this._snapToNearestPage();
      return;
    }

    // default behavior
    this._launchMomentum();
  }

  /**
   * @param {PointerEvent} e
   */
  _onPointerCancel(e) {
    this._isDragging = false;
    this._isPreDragging = false;
    this._nestedScrollView = null;
    try { this.releasePointerCapture(e.pointerId); } catch (err) { }
    this._removePointerListeners();

    const overscrollX = Math.abs(this._overscrollX) > 1;
    const overscrollY = Math.abs(this._overscrollY) > 1;

    if (overscrollX || overscrollY) {
      this._velocity.x = 0;
      this._velocity.y = 0;
      this._snapBack(overscrollX, overscrollY, true);
      return;
    }

    this._snapToNearestPage();
  }

  _update() {
    if (this._isLooping()) {
      const now = performance.now();
      const elapsed = now - this._timestampStart;
      const timeConstant = this._timeConstant;

      if (elapsed > timeConstant * 6) {
        this._stopAnimation();
        if (this._targetX !== null && this.direction === 'horizontal') {
          this.scrollLeft = this._targetX;
        }
        if (this._targetY !== null && this.direction === 'vertical') {
          this.scrollTop = this._targetY;
        }
        if (this._strictSnapActive && this._prevTimeConstant != null) {
          this._timeConstant = this._prevTimeConstant;
          this._prevTimeConstant = undefined;
          this._strictSnapActive = false;
        }
        return;
      }

      const delta = -elapsed / timeConstant;
      const scrollX = this._targetX - this._amplitudeX * Math.exp(delta);
      const scrollY = this._targetY - this._amplitudeY * Math.exp(delta);

      if (this.direction === 'horizontal') {
        this.scrollLeft = scrollX;
      } else {
        this.scrollTop = scrollY;
      }

      this._overscrollX = 0;
      this._overscrollY = 0;
      this._renderOverscroll(0, 0);

      this._rafId = requestAnimationFrame(this._update);
      return;
    }

    // Call base update
    super._update();
    // After base update completes, restore time constant if needed
    if (this._strictSnapActive && !this._rafId) {
      if (this._prevTimeConstant != null) this._timeConstant = this._prevTimeConstant;
      this._prevTimeConstant = undefined;
      this._strictSnapActive = false;
    }
  }
}

customElements.define('disco-flip-view', DiscoFlipView);
export default DiscoFlipView;
