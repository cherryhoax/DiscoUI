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
- `src/components/` — web components (frame, page base, splash, pivot, panorama, list view)
- `examples/` — demo apps and viewer shell
- `webpack.config.js` — bundling/dev-server config

## Development
- `npm run dev` — start webpack dev server with hot reload
- `npm run build` — production bundle

## Road Map
- [x] Disco App
- [x] Disco Frame
- [x] Disco Page
- [x] Disco Splash
- [x] Disco Pivot
- [x] Disco List View
- [ ] Disco Button
- [ ] Disco Dropdown & Combo Box
- [ ] Disco Slider
- [ ] Disco Checkbox
- [x] Disco Panorama
- [ ] Disco Text Box
- [ ] Disco Rich Text Block
- [ ] Disco Toggle Switch
- [ ] Disco App Bar
- [ ] Disco Command Button
- [ ] Disco Context Menu
- [ ] Disco Dialog
- [ ] Disco Toast
- [ ] Disco Progress Bar
- [ ] Disco Alert
- [ ] Disco Long List Selector
...maybe more to come! (feel free to open issues/PRs for them)



## License
This project is licensed under the [MIT License](./LICENSE).

## Contact

For any inquiries or feedback, feel free to reach out!

<a href="https://www.buymeacoffee.com/cherryhoax" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>