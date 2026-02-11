import DiscoFlipView from '../disco-flip-view.js';

/**
 * Flip view variant for date picker that allows overflow to be visible.
 * @extends DiscoFlipView
 */
class DiscoDatePickerFlipView extends DiscoFlipView {
  _updateChildrenLayout() {
    super._updateChildrenLayout();
    const size = this._getTileSize();
    const nodes = this._getPageElements();
    nodes.forEach((node) => {
      node.style.height = `${size}px`;
      node.style.width = '100%';
    });

    this.style.overflow = 'hidden';
    const wrapper = this.shadowRoot?.querySelector('.scroll-content');
    if (wrapper instanceof HTMLElement) {
      wrapper.style.overflow = 'hidden';
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
}

customElements.define('disco-date-picker-flip-view', DiscoDatePickerFlipView);

export default DiscoDatePickerFlipView;
