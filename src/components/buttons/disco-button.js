import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import buttonStyles from './disco-button.scss';

/**
 * A clickable Disco UI button element.
 * @extends DiscoUIElement
 */
class DiscoButton extends DiscoUIElement {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(buttonStyles, this.shadowRoot);

    const button = document.createElement('button');
    button.className = 'button';
    button.type = 'button';
    const slot = document.createElement('slot');
    button.appendChild(slot);
    this.shadowRoot.appendChild(button);

    this.enableTilt({ selector: 'button', skipTransformWhenHostDisabled: true });
  }
}

customElements.define('disco-button', DiscoButton);

export default DiscoButton;
