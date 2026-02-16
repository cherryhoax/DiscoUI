# DiscoMessageDialog (`<disco-message-dialog>`)

Programmatic message dialog with body text and action buttons.

## Usage

```javascript
import { DiscoMessageDialog } from 'discoui';

const dialog = new DiscoMessageDialog(
  'Delete item',
  'This action cannot be undone.',
  {
    cancel: null,
    delete: true
  }
);

const result = await dialog.open();
```

## API

- `new DiscoMessageDialog(title?, message?, actions?, options?)`
- `message: string`
- `setActions(actions): void`
- `open(): Promise<unknown | null>`
- `close(options?): Promise<void>`

## Notes

- Intended to be created from JavaScript (like pickers/flyouts).
- `open()` resolves with selected action result, or `null` on dismiss.
