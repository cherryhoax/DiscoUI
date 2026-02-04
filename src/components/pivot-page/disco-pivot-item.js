import DiscoUIElement from '../disco-ui-element.js';
import itemCss from './disco-pivot-item.scss';
import '../disco-scroll-view.js';

/**
 * An item used within a pivot page.
 * Defaults to a vertical scroll view with extra bottom padding.
 * If the only child is a scroll or list view, scrolling is delegated to that child.
 * @extends DiscoUIElement
 */
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

    this._slot = document.createElement('slot');
    this._slot.addEventListener('slotchange', () => this._updateScrollMode());

    this._scrollView = document.createElement('disco-scroll-view');
    this._scrollView.className = 'pivot-item-scrollview';
    this._scrollView.setAttribute('direction', 'vertical');

    this._scrollContent = document.createElement('div');
    this._scrollContent.className = 'pivot-item-scroll-content';
    this._scrollContent.appendChild(this._slot);
    this._scrollView.appendChild(this._scrollContent);

    this._plainContent = document.createElement('div');
    this._plainContent.className = 'pivot-item-plain-content';

    this._contentWrapper.appendChild(this._scrollView);
    this.shadowRoot.appendChild(this._contentWrapper);
  }

  connectedCallback() {
    this._updateScrollMode();
  }

  /**
   * @param {Element} element
   * @returns {boolean}
   */
  _isStandaloneScrollChild(element) {
    return element.tagName === 'DISCO-SCROLL-VIEW' || element.tagName === 'DISCO-LIST-VIEW';
  }

  _updateScrollMode() {
    if (!this._slot || !this._contentWrapper) return;
    const assigned = this._slot.assignedElements({ flatten: true })
      .filter((el) => el instanceof Element);
    const disableScroll = assigned.length === 1 && this._isStandaloneScrollChild(assigned[0]);

    if (disableScroll) {
      if (this._plainContent && this._slot.parentElement !== this._plainContent) {
        this._plainContent.appendChild(this._slot);
      }
      if (this._contentWrapper.firstChild !== this._plainContent) {
        this._contentWrapper.replaceChildren(this._plainContent);
      }
      return;
    }

    if (this._scrollContent && this._slot.parentElement !== this._scrollContent) {
      this._scrollContent.appendChild(this._slot);
    }
    if (this._contentWrapper.firstChild !== this._scrollView) {
      this._contentWrapper.replaceChildren(this._scrollView);
    }
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
