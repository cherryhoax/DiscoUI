# DiscoAnimations

Provides common animation helpers and predefined animation sets used across DiscoUI.

## Usage

```javascript
import DiscoAnimations from 'discoui/src/components/animations/disco-animations.js';

await DiscoAnimations.animationSet.page.in(element, { direction: 'forward' });
await DiscoAnimations.animationSet.page.out(element, { direction: 'back' });
```

`direction` accepts `'forward'` or `'back'` for page-like transitions.

## Animation Sets

- `animationSet.page.in / out`
- `animationSet.splash.in / out`
- `animationSet.hub.in`
- `animationSet.list.in / out`

## Helpers

- `DiscoAnimations.animate(target, keyframes, options)`
- `DiscoAnimations.animateAll(items, hideInitially)`

### Helper Parameters

**`animate(target, keyframes, options)`**

- `target`: The element to animate.
- `keyframes`: Web Animations keyframes.
- `options`: Standard Web Animations options plus:
	- `spline`: `true` or an object to enable spline interpolation.

**`animateAll(items, hideInitially)`**

- `items`: Array of `{ target, delay, run }` where `run()` returns a promise or animation.
- `hideInitially`: If `true`, temporarily hides targets until their animation starts.
