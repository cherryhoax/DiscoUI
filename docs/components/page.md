# DiscoPage (`<disco-page>`)

The base class for all pages presented in a `DiscoFrame`. It handles the common entrance and exit animations (opacity fade).

Pages respect the `disco-inset-top` value from the root and apply it as top padding so content stays inside the safe area.

## Usage

You generally do not use `<disco-page>` directly. Instead, use specialized page types like `<disco-pivot-page>` or `<disco-hub>`, or inherit from `DiscoPage` to create custom page types.

```html
<disco-single-page>
    <h1>Content</h1>
</disco-single-page>
```

`<disco-single-page>` wraps its content in a vertical scroll view with extra bottom padding by default. If the only child is a `<disco-scroll-view>` or `<disco-list-view>`, the wrapper is disabled and scrolling is delegated to that child.

(Note: `disco-single-page` is a concrete implementation often found in examples, but in the library, `DiscoPage` is the base class).

## App Bar Templates

Pages manage app bars via `template` definitions. App bars are cloned into an internal footer host only when active, so the definitions do not render until needed.

Use `template[data-appbar-global]` to define the page-level (global) app bar.

```html
<disco-single-page>
    <template data-appbar-global>
        <disco-app-bar mode="compact">
            <disco-app-bar-icon-button icon="search" label="search"></disco-app-bar-icon-button>
            <disco-app-bar-menu-item label="settings"></disco-app-bar-menu-item>
        </disco-app-bar>
    </template>
</disco-single-page>
```

Use `data-appbar` on a template inside a pivot item or hub section to override the global app bar for that item.

## API

### `animateIn(options?): Promise<void>`

Called by the frame when navigating **to** this page.
- `options.direction`: `'forward'` or `'back'`.

### `animateOut(options?): Promise<void>`

Called by the frame when navigating **away** from this page.
