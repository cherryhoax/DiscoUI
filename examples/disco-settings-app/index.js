import { DiscoApp } from '../../dist/index.js';

const launchDemo = async () => {
  const app = new DiscoApp({
    theme: document.documentElement.getAttribute('disco-theme') || 'dark',
    accent: document.documentElement.getAttribute('disco-accent') || '#00A4FF',
    font: document.documentElement.getAttribute('disco-font') || null,
    splash: 'none'
  });

  const frame = document.getElementById('settingsFrame');
  const page = document.getElementById('settingsPage');
  const settingsList = document.getElementById('settingsList');
  const appsList = document.getElementById('appsList');

  if (!frame || !page || !settingsList || !appsList) return;

  appsList.items = [
    { Title: 'Calendar', Status: 'updated' },
    { Title: 'Photos', Status: 'syncing' },
    { Title: 'Music', Status: 'up to date' },
    { Title: 'Store', Status: '1 update' }
  ];

  const openPlaceholder = (detail) => {
    if (!detail) return;
    const title = detail?.data?.Title
      || detail?.data?.title
      || detail?.element?.querySelector('.setting-title')?.textContent
      || 'Details';

    const pivotPage = document.createElement('disco-single-page');
    pivotPage.setAttribute('app-title', title);
    pivotPage.setAttribute('header', title);

    const titleNode = document.createElement('div');
    titleNode.className = 'setting-title';
    titleNode.textContent = title;

    const descNode = document.createElement('div');
    descNode.className = 'setting-description';
    descNode.textContent = 'this is a placeholder page';

    pivotPage.appendChild(titleNode);
    pivotPage.appendChild(descNode);

    frame.navigate(pivotPage);
  };

  const handleItemClick = (event) => {
    const detail = event.detail;
    if (!detail || typeof detail.index !== 'number') return;
    openPlaceholder(detail);
  };

  settingsList.addEventListener('itemclick', handleItemClick);
  appsList.addEventListener('itemclick', handleItemClick);

  app.launch(frame);
  await frame.navigate(page);
};

DiscoApp.ready(launchDemo);
