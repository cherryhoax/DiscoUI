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

## Documentation

- [Docs](docs/index.md)

## Related

- [DiscoUI Capacitor](https://github.com/cherryhoax/DiscoUICapacitor?tab=readme-ov-file) - Capacitor plugin for Android, Electron, and Web.

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
- `src/components/` — web components (frame, page, splash, pivot, hub, list view, buttons, inputs)
- `examples/` — demo apps and viewer shell
- `vite.config.js` — bundling/dev-server config

## Development
- `npm run dev` — start Vite dev server with hot reload
- `npm run build` — production bundle
- `npm run test:unit` — run unit tests (Vitest + jsdom)
- `npm run test:e2e` — run browser tests (Playwright)

## Planned
- Password Box
- Radio Button
- Text Box

## Contributing
1. Install dependencies: `npm install`.
2. Run tests: `npm test`.
3. Ensure `npm run types` passes before opening a PR.

## Components
| | Control | Description |
|---|---|---|
| ✅ | [DiscoApp](docs/components/app.md) | App entry/runner (launch, ready, splash control) |
| ✅ | [DiscoAppBar](docs/components/app-bar.md) | Bottom app bar / command area |
| ✅ | [DiscoButton](docs/components/button.md) | Button control |
| ✅ | [DiscoCheckbox](docs/components/checkbox.md) | Checkbox input |
| ✅ | [DiscoComboBox](docs/components/combo-box.md) | Combo box input |
| | DiscoContextMenu | Contextual menu / right-click menu |
| ✅ | [DiscoDatePicker](docs/components/date-picker.md) | Date picker input |
| ✅ | [DiscoFlipView](docs/components/flip-view.md) | Displays a collection of items one at a time |
| | DiscoFlyout | Displays a non-modal popup |
| ✅ | [DiscoFrame](docs/components/frame.md) | Top-level frame handling navigation, theme, and transitions |
| ✅ | [DiscoHub](docs/components/hub.md) | Panoramic layout with parallax header |
| | DiscoHyperlink | Displays a hyperlink inline |
| | DiscoHyperlinkButton | Button that displays a hyperlink |
| | DiscoImage | Displays an image |
| ✅ | [DiscoListView / DiscoListItem](docs/components/list-view.md) | Virtualized list for long lists |
| | DiscoLongListSelector | Multi-item selector for very long lists |
| | DiscoMediaElement | Audio/video playback |
| ✅ | [DiscoPage](docs/components/page.md) | Base page component for content and transitions (used by variants) |
| ✅ | [DiscoPickerBox](docs/components/picker-box.md) | Fullscreen picker modal with flip/slide animations |
| ✅ | [DiscoPivot / DiscoPivotPage](docs/components/pivot.md) | Pivot navigation (pivot page and pivot items) |
| ✅ | [DiscoProgressRing](docs/components/progress-ring.md) | Circular indeterminate progress indicator |
| ✅ | [DiscoProgressBar](docs/components/progress.md) | Indeterminate/determinate progress indicator |
| ✅ | [DiscoPasswordBox](docs/components/password-box.md) | Password input |
| | DiscoRadioButton | Radio button input |
| ✅ | [DiscoScrollView](docs/components/scroll-view.md) | Scrollable content area |
| ✅ | [DiscoSlider](docs/components/slider.md) | Slider input control |
| ✅ | [DiscoLoopingSelector](docs/components/looping-selector.md) | Base class for wheel/column pickers |
| ✅ | [DiscoSplash](docs/components/splash.md) | Optional splash screen (modes: none, auto, manual) |
| ✅ | [DiscoTextBox](docs/components/text-box.md) | Single-line text input |
| ✅ | [DiscoTimePicker](docs/components/time-picker.md) | Time picker input |
| ✅ | [DiscoTimeSpanPicker](docs/components/timespan-picker.md) | Duration picker input |
| | DiscoToggleButton | On/off toggle button |
| ✅ | [DiscoToggleSwitch](docs/components/toggle-switch.md) | On/off toggle control |

...maybe more to come! (feel free to open issues/PRs for them)



## License
This project is licensed under the [MIT License](./LICENSE).

## Contact

For any inquiries or feedback, feel free to reach out!

<a href="https://www.buymeacoffee.com/cherryhoax" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>