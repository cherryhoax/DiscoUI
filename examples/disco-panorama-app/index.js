import { DiscoApp } from '../../dist/index.js';

const launchDemo = async () => {
    const app = new DiscoApp({
        theme: document.documentElement.getAttribute('disco-theme') || 'dark',
        accent: document.documentElement.getAttribute('disco-accent') || '#0078D4',
        font: document.documentElement.getAttribute('disco-font') || null,
        splash: 'none'
    });

    const frame = document.getElementById('demoFrame');
    const page = document.getElementById('demoPanorama');

    app.launch(frame);
    await frame.navigate(page);
};

DiscoApp.ready(launchDemo);
