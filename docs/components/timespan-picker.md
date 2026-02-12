````markdown
# Time Span Picker (`<disco-timespan-picker>`)

Fullscreen duration picker built on slider blades.

## Usage

```javascript
import { DiscoTimeSpanPicker } from 'discoui';

const picker = new DiscoTimeSpanPicker('DURATION', '01:30:00', {
  min: '00:00:00',
  max: '23:59:59',
  step: { m: 5, s: 10 },
  showSeconds: true
});

const selected = await picker.open();
if (selected) {
  console.log(selected); // HH:mm:ss
}
```

## Constructor

```javascript
new DiscoTimeSpanPicker(title?, value?, options?)
```

- `title` (`string`, default: `'DURATION'`): Modal header text.
- `value` (`string`, default: `'00:00:00'`): Initial duration, format `HH:mm:ss`.

## Options

- `max` (`string`, default: `'23:59:59'`): Maximum selectable duration.
- `min` (`string`, default: `'00:00:00'`): Minimum selectable duration.
- `step` (`{ m?: number, s?: number }`, default: `{ m: 1, s: 1 }`): Minute/second blade increments.
- `showSeconds` (`boolean`, default: `false`): Shows or hides the seconds blade.

## Methods

- `open(): Promise<string | null>`: Opens picker and resolves selected duration or `null` when cancelled.
- `close(): Promise<void>`: Closes picker.

## Properties

- `title` (`string`)
- `value` (`string`, format `HH:mm:ss`)
- `min` (`string`, format `HH:mm:ss`)
- `max` (`string`, format `HH:mm:ss`)
- `step` (`{ m: number, s: number }`)
- `showSeconds` (`boolean`)

````
