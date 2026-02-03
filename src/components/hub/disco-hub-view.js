import DiscoFlipView from '../disco-flip-view.js';
import DiscoAnimations from '../animations/disco-animations.js';
import hubViewCss from './disco-hub-view.scss';

/**
 * A Hub-specific flip view that defaults to looping and stop snapping.
 */
class DiscoHubView extends DiscoFlipView {
  constructor() {
    super();
    this.loadStyle(hubViewCss, this.shadowRoot);
    this._boundHubUpdate = this._updateChildrenLayout.bind(this);
  }

  /**
   * @returns {void}
   */
  connectedCallback() {
    if (!this.hasAttribute('overscroll-mode')) {
      this.setAttribute('overscroll-mode', 'loop');
    }
    if (!this.hasAttribute('snap-mode')) {
      this.setAttribute('snap-mode', 'stop');
    }
    super.connectedCallback();
    const slot = this.shadowRoot?.querySelector('slot');
    if (slot) {
      slot.addEventListener('slotchange', this._boundHubUpdate);
    }
    this._hubResizeObserver = new ResizeObserver(() => this._updateChildrenLayout());
    this._hubResizeObserver.observe(this);
    requestAnimationFrame(() => requestAnimationFrame(() => this._updateChildrenLayout()));
  }

  disconnectedCallback() {
    const slot = this.shadowRoot?.querySelector('slot');
    if (slot) {
      slot.removeEventListener('slotchange', this._boundHubUpdate);
    }
    if (this._hubResizeObserver) {
      this._hubResizeObserver.disconnect();
      this._hubResizeObserver = null;
    }
    super.disconnectedCallback();
  }

  /**
   * @returns {number}
   */
  _getPageSize() {
    if (this.direction === 'horizontal') {
      const nodes = this._getPageElements();
      const first = nodes[0];
      return first?.offsetWidth || this.clientWidth || 1;
    }
    return this.clientHeight || 1;
  }

  _updateChildrenLayout() {
    if (!this._isLooping()) {
      super._updateChildrenLayout();
      return;
    }

    this.style.overflow = 'hidden';
    const nodes = this._getPageElements();
    nodes.forEach((node) => {
      node.style.position = 'absolute';
      node.style.top = '0';
      node.style.left = '0';
      node.style.width = '';
      node.style.height = '100%';
      node.style.willChange = 'transform';
    });

    if (!this._loopInitialized) {
      this._loopVirtualX = 0;
      this._loopVirtualY = 0;
      this._loopInitialized = true;
    } else {
      if (!Number.isFinite(this._loopVirtualX)) this._loopVirtualX = 0;
      if (!Number.isFinite(this._loopVirtualY)) this._loopVirtualY = 0;
    }
    this._renderLoop();
  }

  _renderLoop() {
    const { direction, pageSize, span, count } = this._getLoopMetrics();
    if (count === 0) return;

    const nodes = this._getPageElements();
    const virtual = direction === 'horizontal' ? (this._loopVirtualX || 0) : (this._loopVirtualY || 0);
    const viewportSize = direction === 'horizontal' ? (this.clientWidth || 1) : (this.clientHeight || 1);
    const peek = Math.max(0, viewportSize - pageSize);
    const wrapThreshold = (span / 2) + peek;
    const isAnimating = this.hasAttribute('data-animating');
    const showIndices = isAnimating && count > 2 ? new Set([count - 1, 0, 1]) : null;

    nodes.forEach((node, i) => {
      if (showIndices && !showIndices.has(i)) {
        node.style.visibility = 'hidden';
        node.style.pointerEvents = 'none';
        return;
      }

      node.style.visibility = '';
      node.style.pointerEvents = '';
      const rawOffset = i * pageSize - virtual;
      let offset = rawOffset;

      if (!(isAnimating && count <= 2 && virtual < 0)) {
        offset = ((rawOffset % span) + span) % span;
        if (offset > wrapThreshold) {
          offset -= span;
        }
      }

      if (isAnimating && i === count - 1 && offset > 0) {
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

    if (!this._suppressScrollEmit && this._emitScroll) this._emitScroll();

  }

}

customElements.define('disco-hub-view', DiscoHubView);

export default DiscoHubView;
