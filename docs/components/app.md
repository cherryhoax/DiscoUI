# DiscoApp

App-level orchestrator for themes, splash flow, and navigation startup.

## Usage

```javascript
import { DiscoApp } from 'discoui';

DiscoApp.ready(() => {
  const app = new DiscoApp({
    splash: 'auto',
    statusBarColor: 'black',
    navBarColor: 'rgba(0, 0, 0, 0.5)'
  });
  const frame = document.getElementById('appFrame');
  app.launch(frame);
});
```

## API

- `ready(callback)`: Run a callback when the DOM (and fonts when available) is ready.
- `launch(frame)`: Mounts the frame and optional splash into the DOM.
- `setupSplash()`: Marks the splash as ready to dismiss (setup complete).
- `dismissSplash()`: Marks the splash as ready to dismiss (data/ready complete).

### Theme getters/setters

These properties let you read the current theme values and update them at runtime.

- `background` (`black` | `white` | string, read-only): The app background color used by DiscoUI. Default: `black`.
- `foreground` (`black` | `white` | string, read-only): The default foreground color used for text and UI chrome. Default: `white`.
- `accent` (string): Gets or sets the accent color used for highlights and emphasis. Default: `#D80073`.
- `font` (string): Gets or sets the font family used by the UI. Default: `Open Sans`.
- `theme` (`dark` | `light` | `auto`): Gets or sets the theme mode. Default: `dark`.
- `scale` (number): Gets or sets the global UI scale factor (getter returns a number). Default: `0.8`.
- `width` (number, read-only): The layout width, computed as `window.innerWidth / scale`.
- `height` (number, read-only): The layout height, computed as `window.innerHeight / scale`.
- `perspective` (string, read-only): Perspective depth computed from the layout width.

### Safe area insets

Use `disco-inset-*` attributes on `<html>` or the helper to define safe area insets (values in px).

```html
<html
  disco-inset-top="47"
  disco-inset-bottom="34"
  disco-inset-left="0"
  disco-inset-right="0">
```

```javascript
app.setInsets({ top: 47, bottom: 34, left: 0, right: 0 });
```

Inset bar colors can be provided through app options or root attributes:

- `statusBarColor`: Background color for the top inset bar. Attribute: `disco-status-bar-color`.
- `navBarColor`: Background color for the bottom inset bar. Attribute: `disco-nav-bar-color`.
