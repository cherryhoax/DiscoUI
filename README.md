<div align="center">
	<img src="assets/dui.svg" alt="DiscoUI logo" width="120" />
	<h1>DiscoUI</h1>
	<p>Custom Elements for a Metro-inspired mobile shell: pivot navigation, frame/page transitions, and a splash screen—built with vanilla JS, Shadow DOM, and CSS.</p>
    <img alt="GitHub Downloads (all assets, all releases)" src="https://img.shields.io/github/downloads/cherryhoax/DiscoUI/total?style=for-the-badge&label=Total%20Downloads">

</div>

## Quick Start
```bash
npm install
npm run dev
# open http://localhost:3000 (auto-opens by default)
```

The viewer loads `src/index.html`, which hosts the app inside an iframe. The demo pivot app lives at `src/examples/disco-pivot.html`.

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
Change colors and fonts via CSS variables (set on `:root` or any ancestor):
```css
:root {
	--disco-bg: #000;
	--disco-fg: #fff;
	--disco-accent: #d80073;
	--disco-font: 'Segoe UI', sans-serif;
}
```

## Project Structure
- `src/components/` — web components (frame, page base, splash, pivot)
- `src/index.html` — viewer shell with controls (theme/accent/font/scale)
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
- [ ] Disco List View
- [ ] Disco Button
- [ ] Disco Dropdown & Combo Box
- [ ] Disco Slider
- [ ] Disco Checkbox
- [ ] Disco Panorama
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