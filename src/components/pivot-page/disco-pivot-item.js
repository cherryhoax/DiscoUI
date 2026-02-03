import { html, css, unsafeCSS } from 'lit';
import { query } from 'lit/decorators.js';
import DiscoUIElement from '../disco-ui-element.js';
import pivotItemStyles from './disco-pivot-item.scss';

/**
 * An item used within a pivot page.
 * @extends DiscoUIElement
 */
class DiscoPivotItem extends DiscoUIElement {
  static styles = css`${unsafeCSS(pivotItemStyles)}`;

  @query('.pivot-item-content') _contentWrapper;

  render() {
    return html`
      <div class="pivot-item-content">
        <slot></slot>
      </div>
    `;
  }

  /**
   * @param {number} startOffset
   * @param {number} [duration=300]
   * @returns {Promise<void>}
   */
  async playEntranceAnimation(startOffset, duration = 300) {
    if (!this._contentWrapper) return;
    const animation = this._contentWrapper.animate([
      { transform: `translateX(${startOffset}px)` },
      { transform: 'translateX(0)' }
    ], {
      duration: duration,
      easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)',
      fill: 'both'
    });
    return animation.finished;
  }
}

customElements.define('disco-pivot-item', DiscoPivotItem);

export default DiscoPivotItem;
