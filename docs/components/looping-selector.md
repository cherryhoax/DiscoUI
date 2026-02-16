````markdown
# Looping Selector (`DiscoLoopingSelector`)

Base class for wheel/column picker modals (used by date/time/duration pickers).

`DiscoLoopingSelector` extends `DiscoFlyout` and provides shared column behavior:

- Active column expand/collapse
- Scroll/snap commit handling
- Programmatic index scrolling with scroll suppression
- Normalized index/value resolution

## Usage

This is intended to be extended rather than used directly:

```javascript
import { DiscoLoopingSelector } from 'discoui';

class MyPicker extends DiscoLoopingSelector {
  constructor() {
    super('MY APP', 'PICKER');
    this._initSliderPicker(['left', 'right']);
  }

  _onSliderCommit(kind, value) {
    console.log(kind, value);
  }
}
```

## Built-in Flip View

The looping selector flip-view logic is built into the looping selector component implementation.

- Custom element name: `<disco-looping-selector-flip-view>`
- Source: `src/components/slider-picker/disco-looping-selector.js`
- Config attribute: `css-prefix` (maps tile/gap CSS vars per picker)

Example inside a custom picker column:

```javascript
const view = document.createElement('disco-looping-selector-flip-view');
view.setAttribute('direction', 'vertical');
view.setAttribute('overscroll-mode', 'loop');
view.setAttribute('css-prefix', 'time-picker');
```

````
