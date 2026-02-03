const { test, expect } = require('@playwright/test');

const gotoHubPage = async (page) => {
  await page.goto('/examples/index.html');
  await page.waitForFunction(() => !!window.frame);
  await page.evaluate(() => {
    const frame = window.frame;
    const hub = document.getElementById('componentsHub');
    return frame?.navigate(hub);
  });
  await page.waitForFunction(() => {
    const hub = document.getElementById('componentsHub');
    return hub && !hub.hasAttribute('hidden');
  });
};

const getHubViewportBox = async (page) => page.evaluate(() => {
  const hub = document.getElementById('componentsHub');
  const viewport = hub?.shadowRoot?.getElementById('viewport');
  if (!viewport) return null;
  const rect = viewport.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
});

const getHubScrollLeft = async (page) => page.evaluate(() => {
  const hub = document.getElementById('componentsHub');
  const viewport = hub?.shadowRoot?.getElementById('viewport');
  return viewport?.scrollLeft || 0;
});

const dispatchHubPointerSequence = async (page, { startX, endX, type }) => {
  await page.evaluate(({ startX, endX, type }) => {
    const hub = document.getElementById('componentsHub');
    const viewport = hub?.shadowRoot?.getElementById('viewport');
    if (!viewport) return;

    const rect = viewport.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    const fire = (eventType, clientX, buttons) => {
      viewport.dispatchEvent(new PointerEvent(eventType, {
        bubbles: true,
        composed: true,
        pointerId: 1,
        isPrimary: true,
        pointerType: type,
        clientX,
        clientY: y,
        buttons
      }));
    };

    fire('pointerdown', startX, 1);
    fire('pointermove', endX, 1);
    fire('pointerup', endX, 0);
  }, { startX, endX, type });
};

test('hub animate-in toggles animating attribute', async ({ page }) => {
  await gotoHubPage(page);
  await expect(page.locator('#componentsHub')).toHaveAttribute('data-animating', '', { timeout: 2000 });
  await expect(page.locator('#componentsHub')).not.toHaveAttribute('data-animating', '', { timeout: 5000 });
});

test('hub parallax and peeking update on scroll', async ({ page }) => {
  await gotoHubPage(page);

  const result = await page.evaluate(() => {
    const hub = document.getElementById('componentsHub');
    const viewport = hub?.shadowRoot?.getElementById('viewport');
    if (!viewport) return null;

    const section = hub.querySelector('disco-hub-section');
    const viewportRect = viewport.getBoundingClientRect();
    const sectionRect = section?.getBoundingClientRect();

    viewport.scrollLeft = 150;
    viewport.dispatchEvent(new Event('scroll'));

    const background = hub.shadowRoot?.querySelector('.hub-background');
    const header = hub.shadowRoot?.querySelector('.hub-header');

    return {
      backgroundLeft: background?.style.left || '',
      headerTranslate: header?.style.getPropertyValue('--translate-x') || '',
      viewportWidth: viewportRect.width,
      sectionWidth: sectionRect?.width || 0
    };
  });

  expect(result).not.toBeNull();
  expect(result.backgroundLeft).not.toBe('');
  expect(result.headerTranslate).not.toBe('');
  expect(result.viewportWidth - result.sectionWidth).toBeGreaterThan(50);
});

test('hub loop layout keeps pages near the viewport', async ({ page }) => {
  await gotoHubPage(page);

  const offsets = await page.evaluate(() => {
    const hub = document.getElementById('componentsHub');
    const viewport = hub?.shadowRoot?.getElementById('viewport');
    if (!hub || !viewport) return null;

    const sections = Array.from(hub.querySelectorAll('disco-hub-section'));
    const count = sections.length || 1;
    const pageSize = sections[0]?.offsetWidth || viewport.clientWidth || 1;
    const span = pageSize * count;

    viewport.scrollLeft = span + 100;

    const transforms = sections.map((section) => section.style.transform || '');
    return { transforms, span };
  });

  expect(offsets).not.toBeNull();
  offsets.transforms.forEach((transform) => {
    expect(transform).toContain('translate3d(');
  });
});

test('hub responds to mouse swipe', async ({ page }) => {
  await gotoHubPage(page);

  const box = await getHubViewportBox(page);
  expect(box).not.toBeNull();

  const before = await getHubScrollLeft(page);

  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x - 180, box.y, { steps: 6 });
  await page.mouse.up();

  await page.waitForTimeout(200);
  const after = await getHubScrollLeft(page);

  expect(after).not.toBe(before);
});

test.describe('hub touch swipe', () => {
  test.use({ hasTouch: true });

  test('hub responds to touch swipe', async ({ page }) => {
    await gotoHubPage(page);

    const box = await getHubViewportBox(page);
    expect(box).not.toBeNull();

    const before = await getHubScrollLeft(page);

    await dispatchHubPointerSequence(page, {
      startX: box.x + 120,
      endX: box.x - 120,
      type: 'touch'
    });

    await page.waitForTimeout(200);
    const after = await getHubScrollLeft(page);

    expect(after).not.toBe(before);
  });
});
