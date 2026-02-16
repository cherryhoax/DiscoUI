# DiscoDialog (`<disco-dialog>`)

Programmatic dialog with backdrop and a flipped panel title.

## Usage

```javascript
import { DiscoDialog } from 'discoui';

const dialog = new DiscoDialog('Settings');
dialog.append('Dialog content');
await dialog.open();
```

## API

- `new DiscoDialog(title?)`
- `title: string`
- `open(): Promise<void>`
- `close(options?): Promise<void>`

## Notes

- Intended to be created from JavaScript (like pickers/flyouts).
- Clicking the backdrop closes the dialog.
