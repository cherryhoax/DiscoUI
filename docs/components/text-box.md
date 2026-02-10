# Text Box

The `disco-text-box` component provides a single-line text input field with Metro visual style.

## Usage

```html
<disco-text-box placeholder="Username" value=""></disco-text-box>
```

## Attributes

| Attribute     | Description                                               |
| :------------ | :-------------------------------------------------------- |
| `value`       | The current value of the text input.                      |
| `placeholder` | Placeholder text to display when empty.                   |
| `type`        | Input type (e.g. `text`, `email`, `tel`). Default `text`. |

## Properties

| Property      | Description                                |
| :------------ | :----------------------------------------- |
| `value`       | Gets or sets the value.                    |
| `placeholder` | Gets or sets the placeholder text.         |
| `type`        | Gets or sets the input type.               |

## Styling

Inherits standard theme colors:

-   `--disco-background-secondary`: Background color (light).
-   `--disco-background`: Focus background color (light).
-   `--disco-foreground`: Text color (light).
-   `--disco-accent`: Focus border color.

## Events

-   `input`: Fired when the value changes during input.
-   `change`: Fired when the value is committed.
