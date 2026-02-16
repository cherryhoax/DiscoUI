# Copilot — Vibe Coding instructions for DiscoUI / DiscoUICapacitor

Purpose: provide an explicit system-level instruction for Copilot Chat so it can generate UI code (DiscoUI) or scaffold apps (DiscoUICapacitor) using the project's APIs and "metro" design language.

Primary rules
- If the user does NOT ask to "create an app" or "build an application", prefer using DiscoUI (web components) and return UI-only code (components, pages, examples).
- If the user asks to create an app (mobile/desktop/web app), use DiscoUICapacitor and include the required setup commands before scaffolding:
  - npm install discouicapacitor
  - npx cap sync
  - npx discouicapacitor create-app

Design language (Metro-style — short)
- Grid / tiles first: use large rectangular tiles with bold accents, flat surfaces, generous spacing (8–16px rhythm).
- Strong typographic hierarchy: large headings, clear captions, high-contrast accent color for primary actions.
- Animations: subtle elevation and slide transitions for navigation; no heavy shadows.
- Accessible color contrast and clear focus states.

APIs / methods to use (DiscoUI / DiscoUICapacitor)
- UI imports: `import { DiscoButton, DiscoFrame, DiscoTile } from 'discoui'` (use web components like `<disco-frame>`, `<disco-page>`, `<disco-tile>`, `<disco-button>`).
- Capacitor entry: `import { DiscoApp } from 'discouicapacitor'` then `const app = new DiscoApp(); app.launch(frame);` and `DiscoApp.ready(cb)`.
- Useful instance methods: `app.launch(frame)`, `frame.navigate(pageId)`, `app.dismissSplash()`, `DiscoApp.ready(callback)`.
- Configuration: `disco.config.json` keys: `theme`, `accent`, `font`, `splash` (mode, color, icon, showProgress).

Developer behavior
- Always show both a small UI-only snippet (DiscoUI) and, when the user requests an app, a Capacitor variant that runs the install/sync commands and uses `DiscoApp`.
- Prefer minimal, copy-pasteable examples with clear file names (e.g., `index.html`, `app.js`, `App.vue` / `App.tsx` for React) and short explanations.
- When scaffolding an app, include the exact CLI steps and any additional Capacitor sync instructions.

Example outputs
- UI-only example (HTML + JS) using `discoui` components.
- App example: `npm install discouicapacitor && npx cap sync` then `npx discouicapacitor create-app` and a short sample `main.js` showing `new DiscoApp()` usage.

Create App (CLI)
```bash
npm install discouicapacitor
npx cap sync

# scaffold
npx discouicapacitor create-app
```

Notes for Copilot
- Be concise, provide runnable code blocks, and include only necessary dependencies.
- When asked for UI theme or vibe, use the Metro-style defaults described above unless the user specifies otherwise.
- If the user asks for tests, include a simple unit or E2E test stub.

Repository files & links
- Primary repository files the model should read when available (prefer these for authoritative API/type info):
  - `src/index.d.ts` — main type declarations and exports
  - `src/types.d.ts` / `src/types.js` — types and typedefs
  - `src/exports.js` / `src/index.js` — runtime exports and wrappers
  - `docs/index.md` — local docs overview

- Helpful external documentation links:
  - https://github.com/cherryhoax/DiscoUI/blob/main/docs/index.md
  - https://github.com/cherryhoax/DiscoUICapacitor/blob/main/docs/index.md

- Model instruction: If you have repository access, open and parse the files listed above (start with `src/index.d.ts` and `src/types.d.ts`) to discover available exports, component names, method signatures, and configuration keys. Prefer concrete information from those files over assumptions. If you cannot access the repository, ask the user to provide the files or paste their contents.

Create App (CLI)
```bash
npm install discouicapacitor
npx cap sync

# scaffold
npx discouicapacitor create-app
```

-- end of copilot-instructions --