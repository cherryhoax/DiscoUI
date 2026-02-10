import DiscoTextBox from './disco-text-box.js';

class DiscoPasswordBox extends DiscoTextBox {
  constructor() {
      super();
  }
  
  connectedCallback() {
      super.connectedCallback();
      this.type = 'password';
  }
  
  // Lock type to password? Or allow toggling? 
  // Usually PasswordBox is just a TextBox with type="password".
  // But if we want a specific component for it:
}

customElements.define('disco-password-box', DiscoPasswordBox);
export default DiscoPasswordBox;
