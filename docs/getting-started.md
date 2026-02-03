# Getting Started

## Installation

```bash
npm install discoui
```

## Quick Start (Vite)

1. Import `DiscoApp` and the CSS.

```javascript
/* main.js */
import { DiscoApp } from 'discoui';
// Ensure dist/discoui.preload.css is loaded in your HTML head to prevent FOUC
```

2. Setup your `index.html`.

```html
<!DOCTYPE html>
<html disco-theme="dark" disco-accent="#d80073">
<head>
    <link rel="stylesheet" href="node_modules/discoui/dist/discoui.preload.css">
</head>
<body>
    <disco-frame id="appFrame">
        <!-- Initial Page -->
        <disco-pivot-page app-title="MY APP">
            <disco-pivot-item header="home">
                 <p>Hello World</p>
                 <button id="btnGo">Go to Settings</button>
            </disco-pivot-item>
        </disco-pivot-page>
    </disco-frame>
    <script type="module" src="./main.js"></script>
</body>
</html>
```

3. Initialize the App.

```javascript
import { DiscoApp } from 'discoui';

DiscoApp.ready(() => {
    const app = new DiscoApp({ splash: 'auto' });
    const frame = document.getElementById('appFrame');
    app.launch(frame);
    
    // Navigation example
    document.getElementById('btnGo').onclick = async () => {
        // Load an external page
        try {
            const settingsPage = await frame.loadPage('pages/settings.html');
            await frame.navigate(settingsPage);
        } catch (e) {
            console.error('Nav failed', e);
        }
    };
});
```
