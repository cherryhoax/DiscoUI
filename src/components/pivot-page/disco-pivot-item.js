import { html, css } from 'lit';
import { query } from 'lit/decorators.js';
import DiscoUIElement from '../disco-ui-element.js';

/**
 * An item used within a pivot page.
 * @extends DiscoUIElement
 */
class DiscoPivotItem extends DiscoUIElement {
  static styles = css`
    :host {
      flex: 0 0 100%;
      height: 100%;
      width: 100vw;
      max-width: 100vw;
      min-width: 100vw;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      box-sizing: border-box;
      overflow-y: auto;
      padding: 0 20px;
      display: block;
    }

    :host * {
      transform-style: preserve-3d;
    }

    .pivot-item-content {
      height: 100%;
      width: 100%;
    }
  `;

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
