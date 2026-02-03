import { html, css, unsafeCSS } from 'lit';
import DiscoUIElement from '../disco-ui-element.js';
import listItemStyles from './disco-list-item.scss';

/**
 * Disco list item wrapper.
 */
class DiscoListItem extends DiscoUIElement {
  static styles = css`${unsafeCSS(listItemStyles)}`;

  constructor() {
    super();
    this.setAttribute('role', 'listitem');
  }

  firstUpdated() {
    this._item = this.shadowRoot.querySelector('.item');
    this.enableTilt({ selector: '.item' });
  }

  render() {
    return html`
      <div class="item">
        <slot></slot>
      </div>
    `;
  }

  get direction() {
    return 'vertical';
  }

  set direction(val) {
    return;
  }
}

customElements.define('disco-list-item', DiscoListItem);

export default DiscoListItem;
