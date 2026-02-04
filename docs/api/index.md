# API Reference

This section collects the public APIs exposed by DiscoUI.

## Core

- [DiscoApp](../components/app.md)
- [DiscoAppDelegate](../components/app-delegate.md)
- [DiscoFrame](../components/frame.md)
- [DiscoPage](../components/page.md)
- [DiscoUIElement](../components/ui-element.md)
- [DiscoAnimations](../components/animations.md)

## Components

See the full list under [Components](../components/index.md).

## Extending DiscoUI Classes

If you want to create custom components or pages, extend the base classes and reuse the animation set.

### Custom Page Example

```javascript
import DiscoPage from 'discoui/src/components/disco-page.js';
import DiscoAnimations from 'discoui/src/components/animations/disco-animations.js';

class MyPage extends DiscoPage {
	async animateInFn(options = { direction: 'forward' }) {
		await DiscoAnimations.animationSet.page.in(this, options);
	}

	async animateOutFn(options = { direction: 'forward' }) {
		await DiscoAnimations.animationSet.page.out(this, options);
	}
}

customElements.define('my-page', MyPage);
```

### Custom Element Example

```javascript
import DiscoUIElement from 'discoui/src/components/disco-ui-element.js';

class MyTile extends DiscoUIElement {
	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = '<slot></slot>';
	}
}

customElements.define('my-tile', MyTile);
```
