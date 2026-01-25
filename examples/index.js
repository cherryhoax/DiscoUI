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
  const hubPage = document.getElementById('componentsHub');
  const checkboxPage = document.getElementById('componentsCheckbox');
  const progressPage = document.getElementById('componentsProgress');
  const buttonPage = document.getElementById('componentsButton');

  const list = homePage.querySelector('#componentsList');
  if (list) {
    list.items = [
      { id: 'pivot', Title: 'Pivot' },
      { id: 'hub', Title: 'Hub' },
      { id: 'progress', Title: 'Progress Bar' },
      { id: 'checkbox', Title: 'Checkbox' },
      { id: 'button', Title: 'Button' }
    ];

    list.addEventListener('itemselect', (event) => {
      const detail = event.detail;
      const id = detail?.data?.id;
      if (id === 'pivot') {
        frame.navigate(pivotPage);
      }
      if (id === 'hub') {
        frame.navigate(hubPage);
      }
      if (id === 'progress') {
        frame.navigate(progressPage);
      }
      if (id === 'checkbox') {
        frame.navigate(checkboxPage);
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

  // Progress controls
  const inc = document.getElementById('incProgress');
  const toggle = document.getElementById('toggleIndeterminate');
  const det = document.getElementById('progressDeterminate');
  if (inc && det) {
    inc.addEventListener('click', () => {
      const current = Number(det.getAttribute('value') || 0);
      const max = Number(det.getAttribute('max') || 100);
      det.setAttribute('value', String(Math.min(max, current + 10)));
    });
  }
  if (toggle && det) {
    toggle.addEventListener('click', () => {
      if (det.hasAttribute('indeterminate')) det.removeAttribute('indeterminate');
      else det.setAttribute('indeterminate', '');
    });
  }

  app.launch(frame);
  await frame.navigate(homePage);
};

DiscoApp.ready(launchDemo);
