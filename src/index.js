export { default as DiscoApp, DiscoAppDelegate } from './components/disco-app.js';
export { default as DiscoFrame } from './components/disco-frame.js';
export { default as DiscoSplash } from './components/disco-splash.js';
export { default as DiscoPage } from './components/disco-page.js';
export { default as DiscoButton } from './components/disco-button.js';
export { default as DiscoProgressBar } from './components/disco-progress-bar.js';
export { default as DiscoCheckbox } from './components/disco-checkbox.js';
export { default as DiscoUIElement } from './components/disco-ui-element.js';
export { default as DiscoScrollView } from './components/disco-scroll-view.js';
export { default as DiscoPivot } from './components/pivot-page/index.js';
export { default as DiscoAnimations } from './components/animations/disco-animations.js';
export { default as DiscoList } from './components/list-view/index.js';
export { default as DiscoHub } from './components/hub/index.js';

const applyInitialThemeStyles = () => {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	const themeAttr = (root.getAttribute('disco-theme') || 'dark').toLowerCase();
	let themeValue = 0;
	if (themeAttr === 'light') {
		themeValue = 1;
	} else if (themeAttr === 'auto') {
		const prefersLight = typeof window !== 'undefined'
			&& typeof window.matchMedia === 'function'
			&& window.matchMedia('(prefers-color-scheme: light)').matches;
		themeValue = prefersLight ? 1 : 0;
	}

	const bg = `rgb(${255 * themeValue} ${255 * themeValue} ${255 * themeValue})`;
	const fg = `rgb(${255 - 255 * themeValue} ${255 - 255 * themeValue} ${255 - 255 * themeValue})`;
	root.style.setProperty('--disco-theme', String(themeValue));
	root.style.setProperty('--disco-background', bg);
	root.style.setProperty('--disco-foreground', fg);
	root.style.backgroundColor = bg;
	root.style.color = fg;
};

applyInitialThemeStyles();

/**
 * Public exports for DiscoUI.
 */
// Public exports are listed above.