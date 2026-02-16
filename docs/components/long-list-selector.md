# DiscoLongListSelector (`<disco-long-list-selector>`)

Displays a jump list for grouped list views.

## Usage

```javascript
import { DiscoLongListSelector } from 'discoui';

const selector = new DiscoLongListSelector('SELECT SECTION', items, {
  mode: 'auto',
  labelField: 'Title',
  separatorField: 'separator'
});

selector.addEventListener('separatorselect', (event) => {
  console.log(event.detail);
});

await selector.show();
```

## Options

- `mode`: `auto` or `custom`
- `labelField`: Item label field name (default `Title`)
- `separatorField`: Group field name (default `separator`)
- `separators`: Explicit separator order for custom mode
- `locale`: Locale string used for auto grouping

## Events

- `separatorselect`: Fired when a separator tile is selected.
