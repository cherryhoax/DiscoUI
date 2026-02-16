# DiscoMediaElement (`<disco-media-element>`)

Audio/video media control with custom Metro-style circular play/pause button, timeline, loading state, and volume flyout.

## Usage

```html
<disco-media-element src="https://www.w3schools.com/html/horse.mp3"></disco-media-element>

<disco-media-element
  kind="video"
  src="https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_5MB.mp4"
></disco-media-element>
```

## Behavior

- Uses custom controls (no native browser volume slider).
- Play/pause button is a circular icon button.
- Shows an indeterminate top progress bar while loading and while buffering/waiting on slow networks.
- Volume icon click opens a small flyout above the button.
- Flyout animates with slide-up + fade-in and contains:
  - `disco-slider` for volume
  - live volume percentage text
- If flyout is open and volume icon is clicked again, it toggles mute.
- Clicking outside closes the volume flyout.

## Attributes

- `src` (`string`): Audio source URL.
- `kind` (`auto` | `audio` | `video`): Media mode (`auto` by default, infers from URL extension).
- `autoplay` (`boolean`): Starts playback when possible.
- `loop` (`boolean`): Repeats playback.
- `muted` (`boolean`): Mutes audio output.

## Methods

- `play()`: Starts playback.
- `pause()`: Pauses playback.
