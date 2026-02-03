# Theming (Light/Dark)

DiscoUI theme is controlled by attributes on the `<html>` element:

```html
<html disco-theme="dark" disco-accent="#d80073" disco-font="Open Sans">
```

`disco-theme` accepts `dark`, `light`, or `auto`. When set to `auto`, DiscoUI uses the OS preference.

## Dark Mode Support for Splash Icon, Background, and Progress Bar

If you want different assets/colors based on light/dark mode, detect the active theme and pass a matching `splash` config:

```javascript
const getThemeMode = () => {
  const root = document.documentElement;
  const attr = (root.getAttribute('disco-theme') || 'dark').toLowerCase();
  if (attr === 'auto') {
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  return attr;
};

const themeMode = getThemeMode();

const splashConfig = themeMode === 'light'
  ? {
      mode: 'auto',
      color: '#f3f3f3',
      progressColor: '#111111',
      icon: 'assets/logo-dark.png'
    }
  : {
      mode: 'auto',
      color: '#111111',
      progressColor: '#ffffff',
      icon: 'assets/logo-light.png'
    };

const app = new DiscoApp({
  theme: themeMode,
  accent: '#d80073',
  splash: splashConfig
});
```

## Notes

- `splash.color` controls the splash background.
- `splash.progressColor` controls the indeterminate progress bar color.
- `splash.icon` lets you use a light/dark icon depending on the theme.
