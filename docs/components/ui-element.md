# DiscoUIElement

Base class for all DiscoUI custom elements. It includes common utilities like style injection and tilt effects.

## Usage

```javascript
import DiscoUIElement from 'discoui/src/components/disco-ui-element.js';

class MyTile extends DiscoUIElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = '<slot></slot>';
  }
}

customElements.define('my-tile', MyTile);
```
