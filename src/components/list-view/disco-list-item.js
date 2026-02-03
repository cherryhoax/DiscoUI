import { html, css } from 'lit';
import { query } from 'lit/decorators.js';
import DiscoUIElement from '../disco-ui-element.js';

/**
 * Disco list item wrapper.
 */
class DiscoListItem extends DiscoUIElement {
  static styles = css`
    :host {
      display: block;
    }

    .item {
      transition: transform .25s .25s ease-out;
      transform-style: preserve-3d;
      display: block;
      padding: 24px 0px;
      padding-top: 4px;
      font-size: 34px;
      font-weight: 300;
    }

    .item[data-pressed] {
      transition: transform .1ms;
    }

    .item ::slotted(div.setting-description) {
      opacity: 0.5;
      font-size: 20px;
      margin-top: -5px;
    }
  `;

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
