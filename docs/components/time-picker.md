````markdown
# Time Picker (`<disco-time-picker>`)

Fullscreen time picker built on slider blades.

## Usage

```javascript
import { DiscoTimePicker } from 'discoui';

const picker = new DiscoTimePicker('CHOOSE TIME', '14:30', {
  minuteIncrement: 5,
  locale: 'en-US',
  format: 'HH:mm'
});

const selectedTime = await picker.open();
if (selectedTime) {
  console.log(selectedTime);
}
```

## Constructor

```javascript
new DiscoTimePicker(title?, value?, options?)
```

- `title` (`string`, default: `'CHOOSE TIME'`): Fullscreen modal header text.
- `value` (`Date | string`, default: `new Date()`): Initial selected time. Accepts values like `'14:30'`, `'2:30 PM'`, or a `Date` object.

## Options

- `minuteIncrement` (`number`, default: `1`): Minute column step size (`5`, `10`, `15`, etc.).
- `locale` (`string`, default: system locale): Locale used for AM/PM naming and formatting (`'tr-TR'`, `'en-US'`).
- `format` (`string`, default: locale-based): Controls blade order and 12/24-hour mode (for example `'h:mm tt'` or `'HH:mm'`).

## Methods

- `open(): Promise<Date | null>`: Opens picker and resolves selected value or `null` when cancelled.
- `close(): Promise<void>`: Closes picker.

## Properties

- `value` (`Date | string`): Get/set selected time.
- `minuteIncrement` (`number`): Get/set minute step.
- `locale` (`string`): Get/set locale.
- `format` (`string`): Get/set format.

````
