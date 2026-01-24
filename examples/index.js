let DiscoAppModule;
try {
  console.log('Trying to load from ./dist/index.js');
  DiscoAppModule = await import('./dist/index.js');
} catch {
  console.log('Falling back to ../dist/index.js');
  DiscoAppModule = await import('../dist/index.js');
}
const { DiscoApp } = DiscoAppModule;

const launchDemo = async () => {
  const app = new DiscoApp({
    theme: document.documentElement.getAttribute('disco-theme') || 'dark',
    accent: document.documentElement.getAttribute('disco-accent') || '#D80073',
    font: document.documentElement.getAttribute('disco-font') || null,
    splash: 'none'
  });

  const frame = document.getElementById('componentsFrame');
  if (!frame) return;

  const homePage = document.getElementById('componentsHome');
  const pivotPage = document.getElementById('componentsPivot');
  const panoramaPage = document.getElementById('componentsPanorama');
  const buttonPage = document.getElementById('componentsButton');

  const list = homePage.querySelector('#componentsList');
  if (list) {
    list.items = [
      { id: 'pivot', Title: 'Pivot', Description: 'tabbed navigation view' },
      { id: 'panorama', Title: 'Panorama', Description: 'hub-style layout' },
      { id: 'button', Title: 'Button', Description: 'metro-style button' }
    ];

    list.addEventListener('itemclick', (event) => {
      const detail = event.detail;
      const id = detail?.data?.id;
      if (id === 'pivot') {
        frame.navigate(pivotPage);
      }
      if (id === 'panorama') {
        frame.navigate(panoramaPage);
      }
      if (id === 'button') {
        frame.navigate(buttonPage);
      }
    });
  }

  const button = document.getElementById('homeButton');
  if (button) {
    button.addEventListener('click', () => frame.navigate(homePage));
  }

  app.launch(frame);
  await frame.navigate(homePage);
};

DiscoApp.ready(launchDemo);
