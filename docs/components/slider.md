# DiscoSlider (`<disco-slider>`)

A Metro-style range slider with DiscoUI theme tokens.

## Usage

```html
<disco-slider min="0" max="100" step="5" value="30"></disco-slider>
```

## API

### Properties
- `min` (`string`): Minimum value (default: `0`).
- `max` (`string`): Maximum value (default: `100`).
- `step` (`string`): Step increment (default: `1`).
- `value` (`string`): Current value.
- `disabled` (`boolean`): Disables interaction.

### Attributes
- `min`
- `max`
- `step`
- `value`
- `disabled`

### Events
- `input`: Fired while dragging.
- `change`: Fired when value commit changes.
