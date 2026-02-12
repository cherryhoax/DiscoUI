import DiscoFlipView from '../disco-flip-view.js';

/**
 * Flip view variant for date picker.
 * @extends DiscoFlipView
 */
class DiscoDatePickerFlipView extends DiscoFlipView {
  _updateChildrenLayout() {
    const prevTileSize = this._lastTileSize;
    const nextTileSize = this._getTileSize();

    if (this.direction === 'vertical' && this._isLooping() && prevTileSize && nextTileSize && prevTileSize !== nextTileSize) {
      const currentIndex = Math.round(this.scrollTop / prevTileSize);
      this.scrollTop = currentIndex * nextTileSize;
    }

    this._lastTileSize = nextTileSize;
    super._updateChildrenLayout();
    const size = this._getTileSize();
    const nodes = this._getPageElements();
    nodes.forEach((node) => {
      node.style.height = `${size}px`;
      node.style.width = '100%';
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
    const value = getComputedStyle(this).getPropertyValue('--date-picker-tile-height');
    const parsed = parseFloat(value || '');
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
    return this.clientHeight || 1;
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
    const baseOffset = (this.clientHeight - pageSize) / 2;

    nodes.forEach((node, i) => {
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
    const baseOffset = (this.clientHeight - size) / 2;

    nodes.forEach((node, i) => {
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
}

customElements.define('disco-date-picker-flip-view', DiscoDatePickerFlipView);

export default DiscoDatePickerFlipView;
