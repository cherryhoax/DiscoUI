import DiscoUIElement from '../disco-ui-element.js';
import itemCss from './disco-pivot-item.scss';

class DiscoPivotItem extends DiscoUIElement {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(itemCss, this.shadowRoot);
    this._contentWrapper = document.createElement('div');
    this._contentWrapper.className = 'pivot-item-content';
    this._contentWrapper.style.height = '100%';
    this._contentWrapper.style.width = '100%';
    const slot = document.createElement('slot');
    this._contentWrapper.appendChild(slot);
    this.shadowRoot.appendChild(this._contentWrapper);
  }

  /**
   * @param {number} startOffset
   * @param {number} [duration=300]
   */
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
