# DiscoImage (`<disco-image>`)

Image surface with secondary background, top indeterminate loading bar, and fade transitions.

## Usage

```html
<disco-image src="./favicon.svg" alt="Icon" fit="contain"></disco-image>
```

## API

- `src` (`string`): Image source URL.
- `alt` (`string`): Alt text.
- `fit` (`cover` | `contain` | `stretch`): Fit mode (`cover` default).
- `ratio` (`string`): Optional aspect ratio override (for example `16 / 9`).

## Behavior

- Shows `--disco-background-secondary` while loading.
- Displays an indeterminate progress bar at the top during load.
- If loading ends mid-cycle, progress bar finishes its current indeterminate cycle before stopping.
- Fades image in when loaded.
- Crossfades when `src` changes.
- Uses loaded image intrinsic dimensions to set the host aspect ratio when `ratio` is not set.
