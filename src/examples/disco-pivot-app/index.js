import { DiscoApp } from '../../index.js';

const app = new DiscoApp({
    splash: 'none'
});

    const frame = /** @type {DiscoFrameElement | null} */ (document.getElementById('demoFrame'));
    const page = /** @type {HTMLElement | null} */ (document.getElementById('demoPivot'));


app.launch(frame);
    await frame.navigate(page);
