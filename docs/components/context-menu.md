# DiscoContextMenu (`<disco-context-menu>`)

Programmatic context menu for list items and arbitrary targets.

## Usage

```javascript
import { DiscoContextMenu } from 'discoui';

listView.addEventListener('itemselect', async (event) => {
  const target = event.detail?.element;
  if (!(target instanceof HTMLElement)) return;

  const result = await DiscoContextMenu.openFor(target, [
    { id: 'pin', label: 'add to start' },
    { id: 'uninstall', label: 'uninstall', danger: true }
  ]);

  if (result === 'pin') {
    // pin item
  }
  if (result === 'uninstall') {
    // uninstall item
  }
});
```

## Long-press / right-click binding

```javascript
const unbind = DiscoContextMenu.bind(
  itemElement,
  () => [
    { id: 'open', label: 'open' },
    { id: 'remove', label: 'remove', danger: true }
  ],
  { trigger: 'both', longPressMs: 460 }
);

// later
unbind();
```

## API

- `new DiscoContextMenu(items?, options?)`
- `setItems(items): void`
- `openFor(target, options?): Promise<unknown | null>`
- `close(options?): Promise<void>`
- `DiscoContextMenu.openFor(target, items, options?): Promise<unknown | null>`
- `DiscoContextMenu.bind(target, getItems, options?): () => void`

## Notes

- Opens as a fullscreen overlay, scales/dims the page background, and keeps the selected target visually isolated.
- Pushes history state while open, and closes on browser/app back.
- Resolves `null` when dismissed without selection.
