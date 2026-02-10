# DiscoFlipView (`<disco-flip-view>`)

A specialized scroll view designed for paging content (one item per screen/view), often used for image carousels or tab content.

![DiscoFlipView](../../assets/components/flip-view.gif)

## Usage

```html
<disco-flip-view direction="horizontal">
    <div class="page">Page 1</div>
    <div class="page">Page 2</div>
    <div class="page">Page 3</div>
</disco-flip-view>
```

## Attributes

- `direction`: `'horizontal'` (default) or `'vertical'`.
- `overscroll-mode`:
    - `loop`: Infinite scrolling (wrap around from last to first).
