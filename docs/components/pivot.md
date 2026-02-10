# DiscoPivotPage (`<disco-pivot-page>`)

A complex page type that implements the "Pivot" navigation pattern (horizontally swipeable sections with a header menu).

![DiscoPivotPage](../../assets/components/pivot.png)

## Usage

```html
<disco-pivot-page app-title="MESSAGING">
    <disco-pivot-item header="all">
        <disco-list-view>...</disco-list-view>
    </disco-pivot-item>
    <disco-pivot-item header="unread">
        <p>No unread messages.</p>
    </disco-pivot-item>
</disco-pivot-page>
```

## Attributes

- `app-title`: The small title string displayed above the pivot headers (e.g., application name).

## Child Components

### `<disco-pivot-item>`

Represents a single tab/section within the pivot.

By default, the item content is wrapped in a vertical scroll view with extra bottom padding for breathing room. If the only child is a `<disco-scroll-view>` or `<disco-list-view>`, the wrapper is disabled and scrolling is delegated to that child.

**Attributes:**
- `header`: The title of the tab shown in the pivot header strip.

**App Bar overrides:**
Add a `template[data-appbar]` inside a pivot item to override the global app bar for that item.

```html
<disco-pivot-item header="photos">
    <template data-appbar>
        <disco-app-bar mode="compact">
            <disco-app-bar-icon-button icon="camera" label="camera"></disco-app-bar-icon-button>
        </disco-app-bar>
    </template>
    <disco-list-view>...</disco-list-view>
</disco-pivot-item>
```
