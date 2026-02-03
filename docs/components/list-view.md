# DiscoListView (`<disco-list-view>`)

A scrollable list with support for item click events, selection modes, and built-in styling for list items.

## Usage

```html
<disco-list-view item-click-enabled>
    <disco-list-item>
        <span>Item 1</span>
    </disco-list-item>
    <disco-list-item>
        <span>Item 2</span>
    </disco-list-item>
</disco-list-view>
```

## API

### Properties
- `items` (`Array`): Array of data objects to dynamically render. (Dynamic rendering implementation detail).
- `itemClickEnabled` (`boolean`): Toggles the `itemselect` event firing.
- `selectionMode` (`string`): `'none'`, `'single'`, or `'multiple'` (implementation may vary).

### Events
- `itemselect`: Fired when an item is clicked (if enabled). `event.detail` contains:
    - `index`: Index of the item.
    - `element`: The DOM element.
    - `data`: Associated data object (if dynamic).

## Attributes
- `item-click-enabled`: Enables interactive click effects and events.
- `selection-mode`: Sets the selection mode.

## Child Components
### `<disco-list-item>`
A simple container for styling list items.
