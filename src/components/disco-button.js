import DiscoUIElement from './disco-ui-element.js';
import buttonStyles from './disco-button.css';

class DiscoButton extends DiscoUIElement {
  /**
   * @constructor
   */
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(buttonStyles, this.shadowRoot);
    this.enableTilt();

    const button = document.createElement('button');
    button.className = 'button';
    button.type = 'button';
    const slot = document.createElement('slot');
    button.appendChild(slot);
    this.shadowRoot.appendChild(button);
  }
}

customElements.define('disco-button', DiscoButton);

export default DiscoButton;
