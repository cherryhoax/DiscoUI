import itemCss from './disco-pivot-item.css';

class DiscoPivotItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' }).innerHTML = `
      <style>${itemCss}</style>
      <slot></slot>
    `;
  }
}

customElements.define('disco-pivot-item', DiscoPivotItem);

export default DiscoPivotItem;
