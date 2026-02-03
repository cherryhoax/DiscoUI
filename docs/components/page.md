# DiscoPage (`<disco-page>`)

The base class for all pages presented in a `DiscoFrame`. It handles the common entrance and exit animations (opacity fade).

## Usage

You generally do not use `<disco-page>` directly. Instead, use specialized page types like `<disco-pivot-page>` or `<disco-hub>`, or inherit from `DiscoPage` to create custom page types.

```html
<disco-single-page>
    <h1>Content</h1>
</disco-single-page>
```

(Note: `disco-single-page` is a concrete implementation often found in examples, but in the library, `DiscoPage` is the base class).

## API

### `animateIn(options?): Promise<void>`

Called by the frame when navigating **to** this page.
- `options.direction`: `'forward'` or `'back'`.

### `animateOut(options?): Promise<void>`

Called by the frame when navigating **away** from this page.
