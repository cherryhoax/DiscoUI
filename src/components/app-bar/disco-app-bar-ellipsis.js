import DiscoUIElement from '../ui-elements/disco-ui-element.js';
import ellipsisStyles from './disco-app-bar-ellipsis.scss';

class DiscoAppBarEllipsis extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(ellipsisStyles, this.shadowRoot);

    const button = document.createElement('button');
    button.className = 'ellipsis-button';
    button.setAttribute('aria-label', 'More options');
    button.innerHTML = '<span class="ellipsis-icon">•••</span>';
    
    this.shadowRoot.appendChild(button);
    this._button = button;

    // Use standard tilt enablement on the inner button
    this.enableTilt({ selector: '.ellipsis-button', tiltMultiplier: 0.8 });
    
    // Forward click events if needed, but native bubbling should work 
    // since we're a custom element.
    // However, the tilt logic inside DiscoUIElement captures the pointer on *this* host?
    // Wait, let's re-read disco-ui-element.
    // "target = (selector ? shadowRoot.querySelector... : null) || this"
    // "this.addEventListener('pointerdown', ...)"
    // It attaches to THIS (host).
    // But if 'this' is the Ellipsis Component, then capturing pointer on IT is fine!
    // It won't capture pointer for the parent App Bar.
    // That's exactly what we want.
  }
}

customElements.define('disco-app-bar-ellipsis', DiscoAppBarEllipsis);
export default DiscoAppBarEllipsis;
