# DiscoAppDelegate

Read-only delegate for app-level layout and theme values. This is useful in low-level modules (like animations) where you want access to layout metrics without holding a `DiscoApp` instance.

## Usage

```javascript
import { DiscoAppDelegate } from 'discoui';

const width = DiscoAppDelegate.width;
const height = DiscoAppDelegate.height;
```

## API

- `background` (`black` | `white` | string, read-only): The app background color used by DiscoUI. Default: `black`.
- `foreground` (`black` | `white` | string, read-only): The default foreground color used for text and UI chrome. Default: `white`.
- `accent` (string, read-only): Accent color used for highlights and emphasis.
- `font` (string, read-only): Font family used by the UI.
- `theme` (string, read-only): Theme value from the HTML attribute.
- `scale` (number, read-only): Global UI scale factor.
- `width` (number, read-only): Layout width computed as `window.innerWidth / scale`.
- `height` (number, read-only): Layout height computed as `window.innerHeight / scale`.
- `perspective` (string, read-only): Perspective depth computed from the layout width.
