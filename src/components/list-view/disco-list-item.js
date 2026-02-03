import { html, css, unsafeCSS } from 'lit';
import { query } from 'lit/decorators.js';
import DiscoUIElement from '../disco-ui-element.js';
import listItemStyles from './disco-list-item.scss';

/**
 * Disco list item wrapper.
 */
class DiscoListItem extends DiscoUIElement {
  static styles = css`${unsafeCSS(listItemStyles)}`;

  @query('.item') _item;

  constructor() {
    super();
    this.setAttribute('role', 'listitem');
  }

  firstUpdated() {
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
