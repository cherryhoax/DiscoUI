import DiscoFlipView from '../disco-flip-view.js';

/**
 * Flip view variant for time picker.
 * @extends DiscoFlipView
 */
class DiscoTimePickerFlipView extends DiscoFlipView {
  connectedCallback() {
    super.connectedCallback();

    if (!this._layoutResizeObserver) {
      this._layoutResizeObserver = new ResizeObserver(() => {
        if (this._layoutRaf) cancelAnimationFrame(this._layoutRaf);
        this._layoutRaf = requestAnimationFrame(() => {
          this._layoutRaf = null;
          this._updateChildrenLayout();
        });
      });
    }

    this._layoutResizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback();

    if (this._layoutResizeObserver) {
      this._layoutResizeObserver.disconnect();
    }

    if (this._layoutRaf) {
      cancelAnimationFrame(this._layoutRaf);
      this._layoutRaf = null;
    }
  }

  _resolveCssLengthPx(varName, fallback = 0) {
    if (!this.shadowRoot) return fallback;

    if (!this._lengthProbe) {
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.visibility = 'hidden';
      probe.style.pointerEvents = 'none';
      probe.style.left = '-99999px';
      probe.style.top = '-99999px';
      probe.style.width = '0';
      probe.style.height = '0';
      this.shadowRoot.appendChild(probe);
      this._lengthProbe = probe;
    }

    this._lengthProbe.style.height = `var(${varName})`;
    const computed = getComputedStyle(this._lengthProbe).height;
    const parsed = parseFloat(computed || '');
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
    return fallback;
  }

  _applyTileBoxSize(node, tileSize, itemGap) {
    const visualHeight = Math.max(0, tileSize - itemGap);
    node.style.width = '100%';
    node.style.height = `${visualHeight}px`;
    node.style.minHeight = `${visualHeight}px`;
    node.style.maxHeight = `${visualHeight}px`;
    node.style.flex = '0 0 auto';
  }

  _updateChildrenLayout() {
    const prevTileSize = this._lastTileSize;
    const nextTileSize = this._getTileSize();
    const shouldKeepIndex = this.direction === 'vertical' && prevTileSize && nextTileSize && prevTileSize !== nextTileSize;
    const currentIndex = shouldKeepIndex
      ? Math.round((this.scrollTop || 0) / prevTileSize)
      : null;

    this._lastTileSize = nextTileSize;
    super._updateChildrenLayout();

    if (currentIndex != null && Number.isFinite(currentIndex)) {
      this.scrollTop = currentIndex * nextTileSize;
    }

    const size = this._getTileSize();
    const gap = this._getItemGap();
    const nodes = this._getPageElements();
    nodes.forEach((node) => {
      this._applyTileBoxSize(node, size, gap);
    });

    if (this.direction === 'vertical' && !this._isLooping()) {
      nodes.forEach((node) => {
        node.style.position = 'absolute';
        node.style.top = '0';
        node.style.left = '0';
        node.style.willChange = 'transform';
      });
      this._renderNonLoop();
    }
  }

  _getTileSize() {
    const stepResolved = this._resolveCssLengthPx('--time-picker-tile-step', 0);
    if (Number.isFinite(stepResolved) && stepResolved > 0) return stepResolved;

    const tileHeight = this._resolveCssLengthPx('--time-picker-tile-height', 0);
    if (Number.isFinite(tileHeight) && tileHeight > 0) {
      const gap = this._getItemGap();
      return tileHeight + gap;
    }

    return this.clientHeight || 1;
  }

  _getItemGap() {
    const resolved = this._resolveCssLengthPx('--time-picker-item-gap', 0);
    if (Number.isFinite(resolved) && resolved > 0) return resolved;
    return 0;
  }

  _getPageSize() {
    if (this.direction === 'vertical') {
      return this._getTileSize();
    }
    return super._getPageSize();
  }

  get scrollTop() {
    if (this.direction === 'vertical' && !this._isLooping()) {
      return this._nonLoopVirtualY || 0;
    }
    return super.scrollTop;
  }

  set scrollTop(val) {
    if (this.direction === 'vertical' && !this._isLooping()) {
      this._nonLoopVirtualY = val;
      this._renderNonLoop();
      return;
    }
    super.scrollTop = val;
  }

  get maxScrollTop() {
    if (this.direction === 'vertical' && !this._isLooping()) {
      return this._getNonLoopMax();
    }
    return super.maxScrollTop;
  }

  _renderLoop() {
    if (this.direction !== 'vertical') {
      super._renderLoop();
      return;
    }

    const { pageSize, span, count } = this._getLoopMetrics();
    if (count === 0) return;

    const nodes = this._getPageElements();
    const virtual = this._loopVirtualY || 0;
    const gap = this._getItemGap();
    const baseOffset = (this.clientHeight - pageSize) / 2 + (gap / 2);

    nodes.forEach((node, i) => {
      this._applyTileBoxSize(node, pageSize, gap);
      const rawOffset = i * pageSize - virtual;
      let offset = ((rawOffset % span) + span) % span;
      if (offset > span / 2) {
        offset -= span;
      }

      const zIndex = 100000 - (Math.round(Math.abs(offset)) * 10) - i;
      node.style.zIndex = `${zIndex}`;
      node.style.transform = `translate3d(0, ${offset + baseOffset}px, 0)`;
    });

    if (this._emitScroll) this._emitScroll();
  }

  _renderNonLoop() {
    if (this.direction !== 'vertical' || this._isLooping()) return;

    const size = this._getTileSize();
    const nodes = this._getPageElements();
    if (!nodes.length) return;

    const virtual = this._nonLoopVirtualY || 0;
    const gap = this._getItemGap();
    const baseOffset = (this.clientHeight - size) / 2 + (gap / 2);

    nodes.forEach((node, i) => {
      this._applyTileBoxSize(node, size, gap);
      const offset = i * size - virtual + baseOffset;
      const zIndex = 100000 - (Math.round(Math.abs(offset)) * 10) - i;
      node.style.zIndex = `${zIndex}`;
      node.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    if (this._emitScroll) this._emitScroll();
  }

  _getNonLoopMax() {
    const size = this._getTileSize();
    const count = this._getPageElements().length;
    if (!count) return 0;
    return Math.max(0, (count - 1) * size);
  }

  _renderOverscroll(x, y) {
    if (Math.abs(x) < 0.1 && Math.abs(y) < 0.1) {
      this._wrapper.style.transform = '';
      return;
    }

    this._wrapper.style.transform = `translate3d(0, ${Math.round(y / 3)}px, 0)`;
  }
}

customElements.define('disco-time-picker-flip-view', DiscoTimePickerFlipView);

export default DiscoTimePickerFlipView;
