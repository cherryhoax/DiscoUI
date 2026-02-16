# DiscoProgressBar (`<disco-progress-bar>`)

Displays the progress of a task.

<img src="../../assets/components/progress.gif" alt="DiscoProgressBar" style="max-width: 480px; width: 100%;" />

## Usage

### Determinate
Displays a specific percentage.

```html
<disco-progress-bar value="50" max="100"></disco-progress-bar>
```

### Indeterminate
Displays a repeating animation (for unknown durations).

```html
<disco-progress-bar indeterminate></disco-progress-bar>
```

## Attributes

- `value` (number): Current value.
- `max` (number): Maximum value (default 100).
- `indeterminate` (boolean): Activates the "dots" animation mode.

## Methods

- `startIndeterminate()`: Starts indeterminate animation from the beginning.
- `stopIndeterminate({ graceful: true })`: Stops after current animation cycle finishes.
