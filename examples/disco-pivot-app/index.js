import { DiscoApp } from '../../dist/index.js';

const launchDemo = async () => {
  const app = new DiscoApp({
    theme: document.documentElement.getAttribute('disco-theme') || 'dark',
    accent: document.documentElement.getAttribute('disco-accent') || '#D80073',
    font: document.documentElement.getAttribute('disco-font') || null,
    splash: 'none'
  });

  const frame = document.getElementById('demoFrame');
  const page = document.getElementById('demoPivot');

  if (!frame || !page) return;
  window.discoApp = app;
  window.discoFrame = frame;
  app.launch(frame);
  await frame.navigate(page);

};

DiscoApp.ready(launchDemo);
