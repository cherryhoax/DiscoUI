# DiscoScrollView (`<disco-scroll-view>`)

A general-purpose container that implements custom touch/mouse momentum scrolling, bouncing (overscroll), and snap points.

## Usage

```html
<disco-scroll-view direction="vertical">
    <div style="height: 2000px">
        Long content...
    </div>
</disco-scroll-view>
```

## Attributes

- `direction`: `'vertical'` (default), `'horizontal'`, or `'both'`.

## Features
- **Momentum**: Physics-based scrolling after release.
- **Overscroll**: Elastic bounce effect when reaching the edge. Snap-back speed scales with release velocity.
- **Snapping**: Supports CSS Scroll Snap properties (`scroll-snap-align`) on children (custom implementation).

## API

### Properties

- `scrollLeft`: Current horizontal scroll position.
- `scrollTop`: Current vertical scroll position.
- `maxScrollLeft`: Maximum horizontal scroll position.
- `maxScrollTop`: Maximum vertical scroll position.

### Methods

- `scrollTo(options?: ScrollToOptions): void`
- `scrollTo(x: number, y: number): void`
- `scrollTo(x: number, y: number, animate?: boolean): void`
