# Copilot — Vibe Coding instructions for DiscoUI / DiscoUICapacitor

Purpose: provide an explicit system-level instruction for Copilot Chat so it can generate UI code (DiscoUI) or scaffold apps (DiscoUICapacitor) using the project's APIs and "metro" design language.

## Primary Rules

**When to use DiscoUI vs DiscoUICapacitor:**
- **DiscoUI (UI-only)**: If the user does NOT ask to "create an app" or "build an application", generate DiscoUI web components and return UI-only code (components, pages, examples). DiscoUI is a pure web components library that works in any web environment.
- **DiscoUICapacitor (full app)**: If the user asks to create an app (mobile/desktop/web app), use DiscoUICapacitor. DiscoUICapacitor wraps DiscoUI and provides Capacitor integration for Android, Electron, and Web platforms. It includes native features like safe area insets, back button handling, and app lifecycle management.

**CRITICAL: For Capacitor apps, always use `dui create-app` — do not override with manual setup.**

When the user requests to create an app or scaffold a DiscoUICapacitor project:

**Capacitor app (required flow):**
1. Install CLI globally: `npm install -g @cherryhoax/discouicapacitor`
2. Run the scaffold: `dui create-app` (with desired flags, e.g. `--name`, `--dir`, `--theme`, `--yes`)
3. Then add or adjust npm scripts in the created project
4. Only then write or modify code inside the scaffolded app

Do **not** use `npm init -y` + `npm install @cherryhoax/discouicapacitor` as the primary path for new Capacitor apps — that would bypass the official scaffold. Use manual install only when the user explicitly asks for a custom setup without the CLI.

**DiscoUI-only (no Capacitor):**
1. `npm init -y`
2. `npm install @cherryhoax/discoui`
3. Add npm scripts, then write code

## Design Language (Metro-style)

- **Grid / tiles first**: Use large rectangular tiles with bold accents, flat surfaces, generous spacing (8–16px rhythm).
- **Strong typographic hierarchy**: Large headings, clear captions, high-contrast accent color for primary actions.
- **Animations**: Subtle elevation and slide transitions for navigation; no heavy shadows. Pages use fade transitions by default.
- **Accessibility**: Accessible color contrast and clear focus states.
- **Panoramic layouts**: Hub pages support parallax backgrounds and horizontal scrolling sections.

## Available Components

**Core Components:**
- `<disco-frame>` — Root container managing navigation, history, and page transitions. Required wrapper for all pages.
- `<disco-page>` — Base page component (abstract, use specific page types instead)
- `<disco-single-page>` — Simple single-page with scroll view wrapper and app bar support
- `<disco-pivot-page>` — Pivot navigation (horizontally swipeable tabs with header menu). Use with `<disco-pivot-item>` children.
- `<disco-hub>` — Panoramic layout with parallax header background and horizontal scrolling sections. Use with `<disco-hub-section>` children.
- `<disco-splash>` — Splash screen component (modes: none, auto, manual)

**Form Controls:**
- `<disco-button>` — Standard push button with tilt effect on press
- `<disco-checkbox>` — Checkbox input
- `<disco-radio-button>` — Radio button input
- `<disco-combo-box>` — Combo box dropdown (use with `<disco-combo-box-item>` children)
- `<disco-text-box>` — Single-line text input
- `<disco-password-box>` — Password input (masked)
- `<disco-slider>` — Range slider control
- `<disco-toggle-button>` — On/off toggle button
- `<disco-toggle-switch>` — On/off toggle switch control
- `<disco-date-picker>` — Date picker input
- `<disco-time-picker>` — Time picker input
- `<disco-timespan-picker>` — Duration/time span picker

**Layout & Navigation:**
- `<disco-scroll-view>` — Scrollable content container
- `<disco-list-view>` — Virtualized list for long lists (use with `<disco-list-item>` children)
- `<disco-long-list-selector>` — Jump list selector for grouped list views
- `<disco-app-bar>` — Bottom app bar / command area (use with `<disco-app-bar-icon-button>` and `<disco-app-bar-menu-item>` children)
- `<disco-flip-view>` — Displays a collection of items one at a time (swipeable)

**Media & Display:**
- `<disco-image>` — Image component with loading progress bar and fade transitions
- `<disco-media-element>` — Audio playback with custom controls and volume flyout
- `<disco-progress-ring>` — Circular indeterminate progress indicator
- `<disco-progress-bar>` — Linear indeterminate/determinate progress indicator

**Dialogs & Overlays:**
- `<disco-dialog>` — Programmatic dialog with backdrop and flipped panel animation
- `<disco-message-dialog>` — Message dialog with text and action buttons
- `<disco-flyout>` — Fullscreen flyout modal with flip/slide animations
- `<disco-context-menu>` — Contextual menu / right-click menu
- `<disco-looping-selector>` — Base class for wheel/column pickers (used by date/time pickers)

## Import Patterns

**DiscoUI (web components library):**
```javascript
import { DiscoApp, DiscoFrame, DiscoPage, DiscoSinglePage, DiscoPivotPage, DiscoHub, DiscoButton, DiscoAppBar } from '@cherryhoax/discoui';

// Components are registered as custom elements automatically
// Use in HTML as: <disco-frame>, <disco-button>, etc.
```

**DiscoUICapacitor (Capacitor plugin):**
```javascript
import { DiscoApp } from '@cherryhoax/discouicapacitor';
// DiscoApp from discouicapacitor extends DiscoApp from discoui
// It automatically loads disco.config.json and provides Capacitor integration

// Also available:
import { DiscoUI } from '@cherryhoax/discouicapacitor';
// DiscoUI.initialize(), DiscoUI.getInsets(), DiscoUI.exitApp()
```

## DiscoApp API

**DiscoApp (from discoui or discouicapacitor):**
```javascript
// Static method
DiscoApp.ready(() => {
  // DOM and fonts are ready
});

// Constructor options
const app = new DiscoApp({
  theme: 'dark' | 'light' | 'auto',
  accent: '#D80073',
  font: 'Segoe UI',
  splash: {
    mode: 'none' | 'auto' | 'manual',
    color: '#000000',
    icon: './icon.svg',
    showProgress: true,
    progressColor: '#ffffff'
  },
  statusBarColor: 'black',
  navBarColor: 'rgba(0, 0, 0, 0.5)',
  scale: 0.8
});

// Instance methods
app.launch(frameElement);           // Launch app with frame
app.setupSplash();                  // Mark splash ready to dismiss
app.dismissSplash();                // Dismiss splash screen
app.setInsets({ top, bottom, left, right }); // Set safe area insets

// Properties (getters/setters)
app.theme = 'dark';
app.accent = '#D80073';
app.font = 'Segoe UI';
app.scale = 0.8;
const width = app.width;            // Layout width (viewport / scale)
const height = app.height;           // Layout height (viewport / scale)
const perspective = app.perspective; // CSS perspective value
```

**DiscoUICapacitor Plugin API:**
```javascript
import { DiscoUI } from 'discouicapacitor';

// Initialize (loads config, sets up DiscoApp)
await DiscoUI.initialize({
  config: { theme: 'dark', accent: '#D80073' },
  configPath: 'disco.config.json',
  importPath: '/assets/discoui.mjs',
  cssHref: '/assets/discoui.css'
});

// Get safe area insets
const insets = await DiscoUI.getInsets(); // { top, right, bottom, left }

// Exit app
await DiscoUI.exitApp();
```

## DiscoFrame API

```javascript
const frame = document.getElementById('mainFrame');

// Navigate to existing page element
await frame.navigate(pageElement);

// Load external HTML page (lazy loading)
const page = await frame.loadPage('views/settings.html', {
  onLoad: (page) => {
    // Attach event listeners
  },
  onError: (error) => {
    // Handle error
  }
});
await frame.navigate(page);

// Navigation history
await frame.goBack();

// Predictive back (Android)
await frame.predictiveBackProgress(0.5); // 0.0 to 1.0
await frame.predictiveBackCancel();
const handled = await frame.predictiveBackCommit(); // Returns boolean

// Properties
frame.history;        // Array of page elements
frame.historyIndex;   // Current history index
```

## Common Patterns

**Basic Frame + Single Page:**
```html
<!DOCTYPE html>
<html disco-theme="dark" disco-accent="#d80073">
<head>
  <link rel="stylesheet" href="node_modules/@cherryhoax/discoui/dist/discoui.css">
</head>
<body>
  <disco-frame id="mainFrame">
    <disco-single-page id="homePage" app-title="MY APP" header="Home">
      <h1>Welcome</h1>
      <disco-button>Get Started</disco-button>
    </disco-single-page>
  </disco-frame>
  <script type="module" src="./main.js"></script>
</body>
</html>
```

```javascript
import { DiscoApp } from 'discoui';

DiscoApp.ready(() => {
  const app = new DiscoApp({ splash: 'auto' });
  const frame = document.getElementById('mainFrame');
  app.launch(frame);
});
```

**Pivot Navigation (Tabs):**
```html
<disco-pivot-page app-title="MESSAGING">
  <disco-pivot-item header="all">
    <disco-list-view>
      <disco-list-item>Message 1</disco-list-item>
      <disco-list-item>Message 2</disco-list-item>
    </disco-list-view>
  </disco-pivot-item>
  <disco-pivot-item header="unread">
    <p>No unread messages.</p>
  </disco-pivot-item>
</disco-pivot-page>
```

**Hub Layout (Panoramic Home Screen):**
```html
<disco-hub header="Store" background="assets/background.jpg">
  <disco-hub-section header="highlight" width="400px">
    <!-- Featured content -->
  </disco-hub-section>
  <disco-hub-section header="apps" width="320px">
    <!-- App tiles -->
  </disco-hub-section>
</disco-hub>
```

**App Bar (Bottom Command Bar):**
```html
<disco-single-page>
  <template data-appbar-global>
    <disco-app-bar mode="compact">
      <disco-app-bar-icon-button icon="search" label="search"></disco-app-bar-icon-button>
      <disco-app-bar-menu-item label="settings"></disco-app-bar-menu-item>
    </disco-app-bar>
  </template>
  <!-- Page content -->
</disco-single-page>
```

**Capacitor App Setup (use this flow — do not replace with manual npm init):**
```bash
# 1. Install CLI tool globally
npm install -g @cherryhoax/discouicapacitor

# 2. Create app scaffold (required — do not skip for manual setup)
dui create-app \
  --name "Disco App" \
  --dir disco-app \
  --app-id com.disco.app \
  --theme auto \
  --accent "#D80073" \
  --page "single page" \
  --icon ./icon.svg \
  --description "DiscoUI Capacitor app" \
  --signing \
  --apk-action \
  --git-init \
  --yes

# 3. Enter the created app
cd disco-app

# 4. Add or adjust npm scripts in package.json, then write code
```

**Example package.json scripts:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "cap:sync": "cap sync",
    "cap:android": "cap open android"
  }
}
```

**Capacitor App Launch:**
```javascript
import { DiscoApp } from 'discouicapacitor';

DiscoApp.ready(() => {
  const app = new DiscoApp();
  const frame = document.getElementById('mainFrame');
  app.launch(frame);
  // Splash is handled automatically via disco.config.json
});
```

## Configuration

**HTML Attributes (on `<html>` tag):**
```html
<html 
  disco-theme="dark" | "light" | "auto"
  disco-accent="#d80073"
  disco-font="Segoe UI"
  disco-inset-top="47"
  disco-inset-bottom="34"
  disco-inset-left="0"
  disco-inset-right="0"
  disco-status-bar-color="black"
  disco-nav-bar-color="rgba(0, 0, 0, 0.5)">
```

**disco.config.json (for DiscoUICapacitor):**
```json
{
  "theme": "dark",
  "accent": "#D80073",
  "font": "SegoeUI",
  "splash": {
    "mode": "manual",
    "color": "#008a00",
    "icon": "./favicon.svg",
    "showProgress": true,
    "progressColor": "#ffffff"
  }
}
```

Place `disco.config.json` in your public root (e.g., `www/disco.config.json` for Capacitor apps).

## Theming

**Theme Modes:**
- `dark` — Dark theme (black background, white text)
- `light` — Light theme (white background, black text)
- `auto` — Follows OS preference via `prefers-color-scheme`

**Accent Color:**
- Any valid CSS color value (hex, rgb, named colors)
- Default: `#D80073` (Disco pink)

**Font:**
- Any font family name
- Default: `Open Sans` (DiscoUI), `SegoeUI` (DiscoUICapacitor)

## Developer Behavior Guidelines

1. **CRITICAL - Capacitor apps use `dui create-app`**: When the user asks to create a Capacitor app, you MUST use the CLI flow. Do not suggest manual `npm init` + `npm install` instead. Order: (1) `npm install -g @cherryhoax/discouicapacitor`, (2) `dui create-app` with flags, (3) `cd` into created dir, (4) add npm scripts if needed, (5) then write or edit code. For DiscoUI-only projects: `npm init -y`, then `npm install @cherryhoax/discoui`, then scripts, then code.

2. **Always provide runnable code**: Include complete, copy-pasteable examples with clear file names (`index.html`, `main.js`, `app.js`).

3. **Show both variants when appropriate**: 
   - For UI-only requests, show DiscoUI code that works standalone
   - For app requests, ALWAYS show DiscoUICapacitor setup commands FIRST, then app code

4. **Use actual component names**: Reference components that actually exist (see comprehensive list above). Do not invent component names like "DiscoTile" — use `<disco-hub-section>` or layout components instead.

5. **Prefer Metro-style defaults**: Unless the user specifies otherwise, use the Metro design language (tiles, generous spacing, bold typography, subtle animations).

6. **Page types**: 
   - Use `<disco-single-page>` for simple pages
   - Use `<disco-pivot-page>` for tab navigation
   - Use `<disco-hub>` for panoramic home screens
   - Do not use `<disco-page>` directly (it's abstract)

7. **App bars**: App bars are defined via `<template data-appbar-global>` for page-level bars, or `<template data-appbar>` inside pivot items/hub sections for item-specific bars.

8. **Navigation**: Always use `frame.navigate()` for programmatic navigation. Use `frame.loadPage()` for lazy loading external HTML files.

9. **Splash screens**: In DiscoUICapacitor, splash is configured via `disco.config.json`. Use `app.setupSplash()` and `app.dismissSplash()` to control manual mode.

10. **Safe area insets**: Use `disco-inset-*` attributes on `<html>` or `app.setInsets()` for safe area handling (important for notched devices).

## Repository Reference

**DiscoUI (Core Library):**
- Package: `@cherryhoax/discoui` (npm install: `npm install @cherryhoax/discoui`)
- Repository: https://github.com/cherryhoax/DiscoUI
- Main exports: `src/index.js`, `src/index.d.ts`
- Documentation: `docs/index.md`, `docs/components/*.md`

**DiscoUICapacitor (Capacitor Plugin):**
- Package: `@cherryhoax/discouicapacitor` (npm install: `npm install @cherryhoax/discouicapacitor`)
- Repository: https://github.com/cherryhoax/DiscoUICapacitor
- Main exports: `src/index.js`, `src/index.d.ts`
- Documentation: `docs/index.md`, `docs/api.md`, `docs/configuration.md`

**Primary files to reference (when available):**
- `src/index.d.ts` — Main type declarations and exports
- `src/index.js` — Runtime exports
- `docs/components/*.md` — Component documentation
- `docs/index.md` — Overview documentation
- `docs/api.md` — API reference (DiscoUICapacitor)

**Important**: If you have repository access, read `src/index.d.ts` from both repositories to discover available exports, component names, and method signatures. Prefer concrete information from those files over assumptions. If you cannot access the repository, ask the user to provide the files or paste their contents.

-- end of copilot-instructions --
