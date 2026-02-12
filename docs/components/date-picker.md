````markdown
# Date Picker (`<disco-date-picker>`)

Fullscreen date picker built on slider blades.

## Usage

```javascript
import { DiscoDatePicker } from 'discoui';

const picker = new DiscoDatePicker('CHOOSE DATE', new Date(), {
  min: new Date(1900, 0, 1),
  max: new Date(),
  format: 'dd MMMM yyyy',
  locale: 'en-US'
});

const selectedDate = await picker.open();
if (selectedDate) {
  console.log(selectedDate);
}
```

## Constructor

```javascript
new DiscoDatePicker(title?, initialDate?, options?)
```

- `title` (`string`, default: `'CHOOSE DATE'`): Modal header text.
- `initialDate` (`Date`, default: `new Date()`): Initial selected date.

## Options

- `min` (`Date`): Minimum selectable date.
- `max` (`Date`): Maximum selectable date.
- `format` (`string`, default: `'dd MMMM yyyy'`): Controls visible blades and order.
- `locale` (`string`, default: system locale): Locale used for month/day labels.

## Methods

- `open(): Promise<Date | null>`: Opens picker and resolves selected date or `null` when cancelled.
- `close(): Promise<void>`: Closes picker.

````
