# DiscoProgressRing (`<disco-progress-ring>`)

Displays the progress of a task in a circular ring.

<img src="../../assets/components/progress-ring.gif" alt="DiscoProgressRing" style="max-width: 480px; width: 100%;" />

## Usage

### Indeterminate (default)

```html
<disco-progress-ring indeterminate></disco-progress-ring>
```

### Determinate

```html
<disco-progress-ring value="60" max="100"></disco-progress-ring>
```

### Foreground color mode

```html
<disco-progress-ring indeterminate color-mode="foreground"></disco-progress-ring>
```

## Attributes

- `indeterminate`: Enables 5-dot clockwise animation mode.
- `value`: Current value for determinate mode.
- `max`: Maximum value for determinate mode (default `100`).
- `color-mode`: `accent` (default) or `foreground`.
- `foreground`: Boolean alias for foreground color mode.

## Styling

- `--disco-progress-ring-size`: Ring size (default `40px`).
- Default color in both modes is `--disco-accent`.
