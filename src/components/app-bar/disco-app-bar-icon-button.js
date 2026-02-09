import DiscoUIElement from '../disco-ui-element.js';
import iconButtonStyles from './disco-app-bar-icon-button.scss';
import metroIcons from '@olton/metroui/lib/icons.css?inline';

class DiscoAppBarIconButton extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.loadStyle(metroIcons, this.shadowRoot);
    this.loadStyle(iconButtonStyles, this.shadowRoot);

    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';

    const button = document.createElement('button');
    button.className = 'icon-button';
    button.type = 'button';

    const iconSpan = document.createElement('span');
    // Default class, will be overwritten by attributeChangedCallback
    button.appendChild(iconSpan);

    const labelSpan = document.createElement('span');
    labelSpan.className = 'label';
    
    wrapper.appendChild(button);
    wrapper.appendChild(labelSpan);
    this.shadowRoot.appendChild(wrapper);

    this._button = button;
    this._iconSpan = iconSpan;
    this._labelSpan = labelSpan;

    // Tilt applies to the button circle
    this.enableTilt({ selector: '.wrapper'});
    
    // Map click on wrapper to button click for better hit/tilt behavior? 
    // Or just let events bubble. The button is the interactive part.
    // If user clicks label, we probably want to trigger button action too.
    wrapper.addEventListener('click', (e) => {
        if (e.target !== button && !button.contains(e.target)) {
            button.click();
            // Trigger visual press effect manually if needed or just let click handler fire
        }
    });
  }

  connectedCallback() {
      this.setAttribute('slot', 'icons');
      // Ensure initial render
      this.attributeChangedCallback('icon', null, this.getAttribute('icon'));
      this.attributeChangedCallback('label', null, this.getAttribute('label'));

      // Observe resizing to adjust font size if needed
      this._resizeObserver = new ResizeObserver(() => {
          this._adjustLabelFontSize();
      });
      // Observe the widget itself or the label wrapper
      this._resizeObserver.observe(this.shadowRoot.querySelector('.wrapper'));
      
      // Initial check
      this._adjustLabelFontSize();
  }

  disconnectedCallback() {
      if (this._resizeObserver) {
          this._resizeObserver.disconnect();
      }
  }

  static get observedAttributes() {
    return ['icon', 'label', 'disabled', 'show-label'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'icon') {
      this._iconSpan.className = newValue ? `mif-${newValue}` : '';
    } else if (name === 'label') {
      this._labelSpan.textContent = newValue || '';
      this._button.setAttribute('aria-label', newValue || '');
      requestAnimationFrame(() => this._adjustLabelFontSize());
    } else if (name === 'disabled') {
       if (newValue !== null) this._button.setAttribute('disabled', '');
       else this._button.removeAttribute('disabled');
    } else if (name === 'show-label') {
        if (newValue !== null) {
            this._labelSpan.classList.add('visible');
            requestAnimationFrame(() => this._adjustLabelFontSize());
        } else {
            this._labelSpan.classList.remove('visible');
        }
    }
  }

  _adjustLabelFontSize() {
    const label = this._labelSpan;
    if (!label || !label.textContent) return;
    
    // Reset to base size first to measure natural width
    label.style.fontSize = '14px';
    
    // Calculate overflow
    const currentWidth = label.scrollWidth;
    const maxWidth = 64 + 20; // wrapper (64) - margin/padding safe zone
    
    if (currentWidth > maxWidth) {
        const ratio = maxWidth / currentWidth;
        const newSize = Math.max(9, Math.floor(11 * ratio)); 
        label.style.fontSize = `${newSize}px`;
    }
  }
}

customElements.define('disco-app-bar-icon-button', DiscoAppBarIconButton);
export default DiscoAppBarIconButton;

