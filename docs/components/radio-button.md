# DiscoRadioButton (`<disco-radio-button>`)

Single-choice option control for grouped selections.

## Usage

```html
<disco-radio-button name="shuffle-theme" checked>Neon Pink</disco-radio-button>
<disco-radio-button name="shuffle-theme">Cyber Teal</disco-radio-button>
<disco-radio-button name="shuffle-theme">Lime Burst</disco-radio-button>
```

## Attributes

- `checked`: Marks the radio as selected.
- `disabled`: Disables interaction.
- `name`: Group name; radios with the same name behave as a group.

## Properties

- `checked` (`boolean`): Current selection state.
- `disabled` (`boolean`): Whether interaction is disabled.
- `name` (`string`): Group identifier.

## Events

- `change`: Fired when selection changes due to user interaction.
