import { html, css, unsafeCSS } from 'lit';
import { query } from 'lit/decorators.js';
import DiscoUIElement from './disco-ui-element.js';
import buttonStyles from './disco-button.scss';

/**
 * A clickable Disco UI button element.
 * @extends DiscoUIElement
 */
class DiscoButton extends DiscoUIElement {
  static styles = css`${unsafeCSS(buttonStyles)}`;

  @query('.button') _button;

  firstUpdated() {
    this.enableTilt({ selector: '.button' });
  }

  render() {
    return html`
      <button class="button" type="button">
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('disco-button', DiscoButton);

export default DiscoButton;
