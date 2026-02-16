/**
 * Example demo loader used by the examples page.
 */

import { DiscoApp, DiscoDatePicker, DiscoTimePicker, DiscoTimeSpanPicker } from './dist/discoui.mjs';
const launchDemo = async () => {
  const app = new DiscoApp({
    theme: document.documentElement.getAttribute('disco-theme') || 'dark',
    accent: document.documentElement.getAttribute('disco-accent') || '#008a00',
    font: document.documentElement.getAttribute('disco-font') || null
  });
  app.scale = 1.025;
  app.setInsets({ top: 0, bottom: 0, left: 0, right: 0 });
  window.app = app;

  const frame = document.getElementById('componentsFrame');
  if (!frame) return;
  window.frame = frame;
  const homePage = document.getElementById('componentsHome');
  const homeEasingsItem = document.getElementById('componentsHomeEasings');
  window.homePage = homePage;
  const pivotPage = document.getElementById('componentsPivot');
  const hubPage = document.getElementById('componentsHub');
  const appBarPage = document.getElementById('componentsAppBar');
  const groupStylePage = document.getElementById('componentsGroupStyle');
  const checkboxPage = document.getElementById('componentsCheckbox');
  const progressPage = document.getElementById('componentsProgress');
  const comboBoxPage = document.getElementById('componentsComboBox');
  const buttonPage = document.getElementById('componentsButton');
  const textBoxPage = document.getElementById('componentsTextBox');
  const passwordBoxPage = document.getElementById('componentsPasswordBox');
  const scrollViewPage = document.getElementById('componentsScrollView');
  const flipViewPage = document.getElementById('componentsFlipView');
  const groupStyleList = document.getElementById('groupStyleList');
  const comboBox = document.querySelector('#componentsComboBox disco-combo-box');

  // App Bar Test Pages
  const appBarSinglePage = document.getElementById('appBarSinglePage');
  const appBarPivotPage = document.getElementById('appBarPivotPage');
  const appBarHubPage = document.getElementById('appBarHubPage');
  const appBarPivotLocalOnlyPage = document.getElementById('appBarPivotLocalOnlyPage');
  const appBarHubLocalOnlyPage = document.getElementById('appBarHubLocalOnlyPage');
  const appBarTestList = document.getElementById('appBarTestList');

  if (appBarTestList) {
    appBarTestList.items = [
      { id: 'single', Title: 'App Bar in Page' },
      { id: 'pivot', Title: 'App Bar in Pivot' },
      { id: 'panorama', Title: 'App Bar in Panorama' },
      { id: 'pivot-local', Title: 'Pivot: Local Only' },
      { id: 'panorama-local', Title: 'Panorama: Local Only' }
    ];
    appBarTestList.addEventListener('itemselect', (e) => {
      const id = e.detail?.data?.id;
      if (id === 'single') frame.navigate(appBarSinglePage);
      if (id === 'pivot') frame.navigate(appBarPivotPage);
      if (id === 'panorama') frame.navigate(appBarHubPage);
      if (id === 'pivot-local') frame.navigate(appBarPivotLocalOnlyPage);
      if (id === 'panorama-local') frame.navigate(appBarHubLocalOnlyPage);
    });
  }

  let stressScrollPage = document.getElementById('componentsStressScroll');
  let stressNativeScrollPage = document.getElementById('componentsStressNativeScroll');

  const populateStressContent = (container) => {
    if (!container) return;
    const fragment = document.createDocumentFragment();
    const variants = ['stress-scroll__item--card', 'stress-scroll__item--mesh', 'stress-scroll__item--ring'];
    const animations = ['stress-scroll__anim--float', 'stress-scroll__anim--pulse', 'stress-scroll__anim--spin', 'stress-scroll__anim--shimmer'];
    const random = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    const pick = (list) => list[random(0, list.length - 1)];
    for (let i = 1; i <= 48; i += 1) {
      const item = document.createElement('div');
      const variant = variants[i % variants.length];
      item.className = `stress-scroll__item ${variant}`;

      const content = document.createElement('div');
      content.className = 'stress-scroll__content';

      const blocks = random(3, 8);
      for (let j = 0; j < blocks; j += 1) {
        const block = document.createElement('div');
        block.className = 'stress-scroll__block';
        if (Math.random() < 0.6) block.classList.add(pick(animations));
        content.appendChild(block);
      }

      const lines = random(1, 3);
      for (let k = 0; k < lines; k += 1) {
        const line = document.createElement('div');
        line.className = 'stress-scroll__line';
        if (Math.random() < 0.4) line.classList.add(pick(animations));
        content.appendChild(line);
      }

      const label = document.createElement('div');
      label.className = 'stress-scroll__label';
      label.textContent = `Item ${i}`;
      content.appendChild(label);

      const badge = document.createElement('div');
      badge.className = 'stress-scroll__badge';
      if (Math.random() < 0.5) badge.classList.add(pick(animations));
      badge.textContent = `#${random(100, 999)}`;

      item.appendChild(content);
      item.appendChild(badge);
      fragment.appendChild(item);
    }
    container.appendChild(fragment);
  };

  const list = homePage.querySelector('#componentsList');
  if (list) {
    const getTheme = () => document.documentElement.getAttribute('disco-theme') || 'dark';
    const listItems = [
      { id: 'toggle-theme', Title: 'Toggle Theme', Description: `current theme: ${getTheme()}` },
      { id: 'pivot', Title: 'Pivot', Description: '' },
      { id: 'hub', Title: 'Hub', Description: '' },
      { id: 'appbar', Title: 'App Bar', Description: '' },
      { id: 'groupstyle', Title: 'Group Style (Sticky Header)', Description: '' },
      { id: 'progress', Title: 'Progress Bar', Description: '' },
      { id: 'checkbox', Title: 'Checkbox', Description: '' },
      { id: 'textbox', Title: 'Text Box', Description: '' },
      { id: 'passwordbox', Title: 'Password Box', Description: '' },
      { id: 'combobox', Title: 'Combo Box', Description: '' },
      { id: 'button', Title: 'Button', Description: '' },
      { id: 'scrollview', Title: 'Scroll View', Description: '' },
      { id: 'flipview', Title: 'Flip View', Description: '' },
      { id: 'datepicker', Title: 'Date Picker', Description: '' },
      { id: 'timepicker', Title: 'Time Picker', Description: '' },
      { id: 'timespanpicker', Title: 'Time Span Picker', Description: '' }
    ];
    const sortedItems = listItems
      .filter((item) => item.id !== 'toggle-theme')
      .sort((a, b) => a.Title.localeCompare(b.Title));
    list.items = [listItems[0], ...sortedItems];

    list.addEventListener('itemselect', async (event) => {
      const detail = event.detail;
      const id = detail?.data?.id;
      if (id === 'datepicker') {
        const datePicker = new DiscoDatePicker(
          'Choose Date',
          new Date(),
          {
            min: new Date(1900, 0, 1),
            max: new Date(),
            format: 'MM MMMM dddd dd yyyy'
          }
        );

        datePicker.open().then((selectedDate) => {
          if (selectedDate) {
            console.log('Date picker selected:', selectedDate);
          }
        });
      }
      if (id === 'timepicker') {
        const timePicker = new DiscoTimePicker(
          'CHOOSE TIME',
          '14:30',
          {
            minuteIncrement: 5
          }
        );

        timePicker.open().then((selectedTime) => {
          if (selectedTime) {
            console.log('Time picker selected:', selectedTime);
          }
        });
      }
      if (id === 'timespanpicker') {
        const timeSpanPicker = new DiscoTimeSpanPicker(
          'DURATION',
          '01:30:00',
          {
            min: '00:10:00',
            max: '12:00:00',
            step: { m: 5, s: 10 },
            showSeconds: true
          }
        );

        timeSpanPicker.open().then((selectedValue) => {
          if (selectedValue) {
            console.log('Time span picker selected:', selectedValue);
          }
        });
      }
      if (id === 'toggle-theme') {
        const nextTheme = getTheme() === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('disco-theme', nextTheme);
        const updatedDescription = `current theme: ${nextTheme}`;
        if (list.items[0] && typeof list.items[0] === 'object') {
          list.items[0].Description = updatedDescription;
        }
      }
      if (id === 'pivot') {
        frame.navigate(pivotPage);
      }
      if (id === 'hub') {
        frame.navigate(hubPage);
      }
      if (id === 'appbar') {
        frame.navigate(appBarPage);
      }
      if (id === 'groupstyle') {
        frame.navigate(groupStylePage);
      }
      if (id === 'progress') {
        frame.navigate(progressPage);
      }
      if (id === 'checkbox') {
        frame.navigate(checkboxPage);
      }
      if (id === 'combobox') {
        frame.navigate(comboBoxPage);
      }
      if (id === 'button') {
        frame.navigate(buttonPage);
      }
      if (id === 'textbox') {
        frame.navigate(textBoxPage);
      }
      if (id === 'passwordbox') {
        frame.navigate(passwordBoxPage);
      }
      if (id === 'scrollview') {
        frame.navigate(scrollViewPage);
      }
      if (id === 'flipview') {
        frame.navigate(flipViewPage);
      }
      if (id === 'stressscroll') {
        if (!stressScrollPage) {
          stressScrollPage = await frame.loadPage('stress-scroll.html', {
            onLoad: (page) => populateStressContent(page.querySelector('#stressScrollContent'))
          });
        }
        frame.navigate(stressScrollPage);
      }
      if (id === 'stressnative') {
        if (!stressNativeScrollPage) {
          stressNativeScrollPage = await frame.loadPage('stress-native-scroll.html', {
            onLoad: (page) => populateStressContent(page.querySelector('#stressNativeScrollContent'))
          });
        }
        frame.navigate(stressNativeScrollPage);
      }
    });
  }

  const button = document.getElementById('homeButton');
  if (button) {
    button.addEventListener('click', () => frame.navigate(homePage));
  }

  const stressButton = document.getElementById('stressScrollButton');
  if (stressButton) {
    stressButton.addEventListener('click', async () => {
      if (!stressScrollPage) {
        stressScrollPage = await frame.loadPage('stress-scroll.html', {
          onLoad: (page) => populateStressContent(page.querySelector('#stressScrollContent'))
        });
      }
      frame.navigate(stressScrollPage);
    });
  }

  const stressNativeButton = document.getElementById('stressNativeScrollButton');
  if (stressNativeButton) {
    stressNativeButton.addEventListener('click', async () => {
      if (!stressNativeScrollPage) {
        stressNativeScrollPage = await frame.loadPage('stress-native-scroll.html', {
          onLoad: (page) => populateStressContent(page.querySelector('#stressNativeScrollContent'))
        });
      }
      frame.navigate(stressNativeScrollPage);
    });
  }

  // Stress content population logic moved to populateStressContent() and called via loadPage options

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

  if (comboBox) {
    comboBox.addEventListener('change', (event) => {
      const detail = event.detail || {};
      console.log('Combo box changed:', detail.value, detail.index);
    });
  }

  if (groupStyleList) {
    groupStyleList.items = [
      { Title: '00 Zero' },
      { Title: '& Specials' },
      { Title: 'Alarm' },
      { Title: 'Calendar' },
      { Title: 'Camera' },
      { Title: 'Files' },
      { Title: 'Gallery' },
      { Title: 'Mail' },
      { Title: 'Maps' },
      { Title: 'Music' },
      { Title: 'Notes' },
      { Title: 'Phone' },
      { Title: 'Photos' },
      { Title: 'Settings' },
      { Title: 'Store' },
      { Title: 'Terminal' },
      { Title: 'Weather' }
    ];
    groupStyleList.addEventListener('separatorselect', (event) => {
      console.log('Group selector selected:', event.detail);
    });
  }

  if (homePage && homeEasingsItem) {
    homePage.addEventListener('disco-active-item-change', (event) => {
      const activeItem = event.detail?.item;
      if (activeItem === homeEasingsItem) {
        homeEasingsItem.setAttribute('data-easing-active', '');
      } else {
        homeEasingsItem.removeAttribute('data-easing-active');
      }
    });
  }

  app.launch(frame);
  frame.navigate(homePage);
};

DiscoApp.ready(launchDemo);
