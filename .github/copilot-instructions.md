# DiscoUI — GitHub Copilot Instructions

## How to work in this repo
- Prefer small, targeted changes and avoid reformatting unrelated code.
- Use the existing module boundaries under src/components.
- Keep examples under src/examples as standalone demo apps.
- Do not introduce new framework dependencies unless requested.

## Important nuances
- `DiscoApp.launch(frame)` is the only place that should reveal a `disco-frame` (CSS keeps it hidden by default).
- Splash is optional and controlled by `splash` mode: `none`, `auto`, or `manual`.
- Theme is driven by attributes (`disco-theme`, `disco-accent`, `disco-font`) and CSS custom properties.
- Keep frame/page transitions via `frame.navigate()` so animations run.

## JSDoc and types
- Add JSDoc annotations to all public classes and methods.
- Use JSDoc typedefs for config objects (e.g., `DiscoAppConfig`).
- Keep types compatible with `npm run types` (tsconfig.types.json).
- For CSS imports, rely on the ambient module declaration in src/types/global.d.ts.
- Use explicit casts for custom elements or DOM APIs when needed.

## What to avoid
- Inline styles in example HTML for visibility; use attributes + CSS instead.
- Manual DOMContentLoaded listeners in demos; prefer `DiscoApp.ready()`.
- Directly manipulating theme variables in JS (attributes are the source of truth).
