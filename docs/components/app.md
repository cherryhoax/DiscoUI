# DiscoApp

App-level orchestrator for themes, splash flow, and navigation startup.

## Usage

```javascript
import { DiscoApp } from 'discoui';

DiscoApp.ready(() => {
  const app = new DiscoApp({ splash: 'auto' });
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
