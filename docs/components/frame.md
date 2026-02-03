# DiscoFrame (`<disco-frame>`)

The root container for the application. It manages navigation history, caching, and transitions between pages.

## Usage

```html
<disco-frame id="myFrame"></disco-frame>
```

## API

### `navigate(page: HTMLElement): Promise<void>`

Navigates to an existing DOM element (must be a `DiscoPage` or derivative).

```javascript
const page = document.getElementById('detailsPage');
await frame.navigate(page);
```

### `loadPage(path: string, options?): Promise<HTMLElement>`

Fetches an external HTML file, parses it, and appends it to the frame in a hidden state. This is useful for lazy loading views.

**Options:**
- `onLoad(page: HTMLElement)`: Callback executed after the element is appended to DOM but before it is returned. Use this to attach event listeners.
- `onError(error: Error)`: Callback executed if fetch or parsing fails.

**Note:** Scripts inside the loaded HTML file are **NOT** executed for security and performance reasons.

```javascript
const profilePage = await frame.loadPage('views/profile.html', {
    onLoad: (page) => {
        page.querySelector('.save-btn').onclick = saveProfile;
    }
});
await frame.navigate(profilePage);
```

### `goBack(): Promise<void>`

Navigates back one step in the history. Use `window.history.back()` integration if enabled.

```javascript
await frame.goBack();
```

## Attributes

- `history-key`: Unique key for History API state (default: auto-generated).
- `disable-history`: If present, disables integration with browser History API.
