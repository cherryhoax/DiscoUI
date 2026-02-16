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
// Ensure dist/discoui.css is loaded in your HTML head to prevent FOUC
```

2. Setup your `index.html`.

```html
<!DOCTYPE html>
<html disco-theme="dark" disco-accent="#d80073">
<head>
    <link rel="stylesheet" href="node_modules/discoui/dist/discoui.css">
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

## Vibe coding

Prebuilt "vibe coding" instructions and downloadable system-instruction files are available for fast prototyping with DiscoUI (UI-only) or scaffolding apps with DiscoUI Capacitor.

- For details, see the pages under `docs/vibe-coding/` in this DiscoUI repository.
- Copilot (local file): download the `docs/vibe-coding/copilot-instructions.md` file from the DiscoUICapacitor repository and use it as a system instruction in Copilot Chat.
- Google AI Studio: download the `docs/vibe-coding/google-ai-studio-instructions.md` file from the DiscoUICapacitor repository and upload it to Google AI Studio under Advanced → System instructions.