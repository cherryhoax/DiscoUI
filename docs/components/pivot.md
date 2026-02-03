# DiscoPivotPage (`<disco-pivot-page>`)

A complex page type that implements the "Pivot" navigation pattern (horizontally swipeable sections with a header menu).

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

**Attributes:**
- `header`: The title of the tab shown in the pivot header strip.
