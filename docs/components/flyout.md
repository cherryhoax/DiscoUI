# Flyout (disco-flyout)

Fullscreen modal surface for picker flows with optional flip or slide animations.

<img src="../../assets/components/flyout.gif" alt="Flyout" style="max-width: 480px; width: 100%;" />

## Usage

```html
<disco-flyout app-title="DISCO APP" header="PICKER" animation="flip" flip-count="5">
  <div>Content</div>
  <disco-app-bar>
    <disco-app-bar-icon-button icon="done" label="done"></disco-app-bar-icon-button>
    <disco-app-bar-icon-button icon="cross" label="cancel"></disco-app-bar-icon-button>
  </disco-app-bar>
</disco-flyout>
```

```javascript
import { DiscoFlyout } from 'discoui';

const picker = new DiscoFlyout('DISCO APP', 'PICKER');
picker.setAttribute('animation', 'flip');
picker.setAttribute('flip-count', '5');
picker.appendChild(document.createTextNode('Hello Picker'));

await picker.show();
// ...
await picker.close();
```

## Attributes

- `app-title` (string): Title text.
- `header` (string): Alias for title text (uses the same line).
- `animation` (`slide-up` | `flip`): Entry/exit animation.
- `flip-count` (number): Number of flip strips (default 5).

## Slots

- default: Picker content.
- `footer`: Footer content such as `disco-app-bar`.

## Notes

- The picker pushes a history entry on `show()` and closes on browser back.
- `frame.goBack()` closes an active picker first (no page animate-in).
