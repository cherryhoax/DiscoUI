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

    console.log('Launching Panorama Demo...');
    app.launch(frame);

    // Initial navigation to ensure page is active and (optionally) animated
    if (page) {
        await frame.navigate(page);
    }
};

DiscoApp.ready(launchDemo);
