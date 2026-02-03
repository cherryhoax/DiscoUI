<div align="center">
	<img src="assets/dui.svg" alt="DiscoUI logo" width="120" />
	<h1>DiscoUI</h1>
	<p>Custom Elements for a Metro-inspired mobile shell: pivot navigation, frame/page transitions, and a splash screen—built with vanilla JS, Shadow DOM, and CSS.</p>

</div>

## Quick Start
```bash
npm install
npm run dev
# open http://localhost:3000 (auto-opens by default)
```

The viewer loads `examples/index.html` by default.

## Usage
Import the bundle and drop the components:
```html
<disco-frame>
	<disco-pivot-page app-title="DISCO APP">
		<disco-pivot-item header="Home">…</disco-pivot-item>
		<disco-pivot-item header="Music">…</disco-pivot-item>
		<disco-pivot-item header="About">…</disco-pivot-item>
	</disco-pivot-page>
</disco-frame>
```

### Theming
Set the theme and accent color via attributes on the `<html>` tag:
```html
<html disco-theme="auto" disco-accent="#d80073" disco-font="Times New Roman">
```
```html
<html disco-theme="dark" disco-accent="green">
```

## Project Structure
- `src/components/` — web components (frame, page base, splash, pivot, hub, list view)
- `examples/` — demo apps and viewer shell
- `vite.config.js` — bundling/dev-server config

## Development
- `npm run dev` — start Vite dev server with hot reload
- `npm run build` — production bundle
- `npm run test:unit` — run unit tests (Vitest + jsdom)
- `npm run test:e2e` — run browser tests (Playwright)

## Planned
- Combobox
- Password Box
- Radio Button
- Text Box

## Contributing
1. Install dependencies: `npm install`.
2. Run tests: `npm test`.
3. Ensure `npm run types` passes before opening a PR.

## Road Map
| | Control | Description | Class | Tag |
|---|---|---|---:|---|
| ✅ | Disco App | App entry/runner (launch, ready, splash control) | DiscoApp | N/A |
| | Disco App Bar | Bottom app bar / command area | DiscoAppBar | disco-app-bar |
| ✅ | Disco Button | Button control | DiscoButton | disco-button |
| ✅ | Disco Checkbox | Checkbox input | DiscoCheckbox | disco-checkbox |
| | Disco Combobox | Combo box input | DiscoCombobox | disco-combobox |
| | Disco Context Menu | Contextual menu / right-click menu | DiscoContextMenu | disco-context-menu |
| | Disco Date Picker | Date picker input | DiscoDatePicker | disco-date-picker |
| ✅ | Disco Flip View | Displays a collection of items one at a time | DiscoFlipView | disco-flip-view |
| | Disco Flyout | Displays a non-modal popup | DiscoFlyout | disco-flyout |
| ✅ | Disco Frame | Top-level frame handling navigation, theme, and transitions | DiscoFrame | disco-frame |
| ✅ | Disco Hub | Panoramic layout with parallax header | DiscoHub | disco-hub |
| | Disco Hyperlink | Displays a hyperlink inline | DiscoHyperlink | disco-hyperlink |
| | Disco Hyperlink Button | Button that displays a hyperlink | DiscoHyperlinkButton | disco-hyperlink-button |
| | Disco Image | Displays an image | DiscoImage | disco-image |
| ✅ | Disco List View | Virtualized list for long lists | DiscoListView / DiscoListItem | disco-list-view / disco-list-item |
| | Disco Long List Selector | Multi-item selector for very long lists | DiscoLongListSelector | disco-long-list-selector |
| | Disco Media Element | Audio/video playback | DiscoMediaElement | disco-media-element |
| | Disco Password Box | Password input | DiscoPasswordBox | disco-password-box |
| ✅ | Disco Page | Base page component for content and transitions (used by variants) | DiscoPage | disco-page |
| ✅ | Disco Pivot | Pivot navigation (pivot page and pivot items) | DiscoPivot / DiscoPivotPage | disco-pivot-page / disco-pivot-item |
| ✅ | Disco Progress Bar | Indeterminate/determinate progress indicator | DiscoProgressBar | disco-progress-bar |
| | Disco Progress Ring | Circular indeterminate/determinate progress indicator | DiscoProgressRing | disco-progress-ring |
| | Disco Radio Button | Radio button input | DiscoRadioButton | disco-radio-button |
| ✅ | Disco Scroll View | Scrollable content area | DiscoScrollView | disco-scroll-view |
| | Disco Slider | Slider input control | DiscoSlider | disco-slider |
| ✅ | Disco Splash | Optional splash screen (modes: none, auto, manual) | DiscoSplash | disco-splash |
| | Disco Text Box | Single-line text input | DiscoTextBox | disco-text-box |
| | Disco Time Picker | Time picker input | DiscoTimePicker | disco-time-picker |
| | Disco Toggle Button | On/off toggle button | DiscoToggleButton | disco-toggle-button |
| | Disco Toggle Switch | On/off toggle control | DiscoToggleSwitch | disco-toggle-switch |

...maybe more to come! (feel free to open issues/PRs for them)



## License
This project is licensed under the [MIT License](./LICENSE).

## Contact

For any inquiries or feedback, feel free to reach out!

<a href="https://www.buymeacoffee.com/cherryhoax" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>