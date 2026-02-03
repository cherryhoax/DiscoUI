const { test, expect } = require('@playwright/test');

const gotoPivotPage = async (page) => {
  await page.goto('/examples/index.html');
  await page.waitForFunction(() => !!window.frame);
  await page.evaluate(() => {
    const frame = window.frame;
    const pivot = document.getElementById('componentsPivot');
    return frame?.navigate(pivot);
  });
  await page.waitForFunction(() => {
    const pivot = document.getElementById('componentsPivot');
    return pivot && !pivot.hasAttribute('hidden');
  });
};

const getPivotViewportBox = async (page) => page.evaluate(() => {
  const pivot = document.getElementById('componentsPivot');
  const viewport = pivot?.shadowRoot?.getElementById('viewport');
  if (!viewport) return null;
  const rect = viewport.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
});

const getPivotScrollLeft = async (page) => page.evaluate(() => {
  const pivot = document.getElementById('componentsPivot');
  const viewport = pivot?.shadowRoot?.getElementById('viewport');
  return viewport?.scrollLeft || 0;
});

const dispatchPivotPointerSequence = async (page, { startX, endX, type }) => {
  await page.evaluate(({ startX, endX, type }) => {
    const pivot = document.getElementById('componentsPivot');
    const viewport = pivot?.shadowRoot?.getElementById('viewport');
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

test('pivot renders header strip clones', async ({ page }) => {
  await gotoPivotPage(page);

  const headerCount = await page.evaluate(() => {
    const pivot = document.getElementById('componentsPivot');
    const strip = pivot?.shadowRoot?.getElementById('headerStrip');
    return strip?.querySelectorAll('.header-item').length || 0;
  });

  expect(headerCount).toBeGreaterThan(10);
});

test('pivot header click updates viewport scroll', async ({ page }) => {
  await gotoPivotPage(page);

  const before = await page.evaluate(() => {
    const pivot = document.getElementById('componentsPivot');
    const viewport = pivot?.shadowRoot?.getElementById('viewport');
    return viewport?.scrollLeft || 0;
  });

  await page.evaluate(() => {
    const pivot = document.getElementById('componentsPivot');
    const strip = pivot?.shadowRoot?.getElementById('headerStrip');
    const header = strip?.querySelector('.header-item');
    header?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });

  await page.waitForFunction((prev) => {
    const pivot = document.getElementById('componentsPivot');
    const viewport = pivot?.shadowRoot?.getElementById('viewport');
    return (viewport?.scrollLeft || 0) !== prev;
  }, before);
});

test('pivot responds to mouse swipe', async ({ page }) => {
  await gotoPivotPage(page);

  const box = await getPivotViewportBox(page);
  expect(box).not.toBeNull();

  const before = await getPivotScrollLeft(page);

  await page.mouse.move(box.x, box.y);
  await page.mouse.down();
  await page.mouse.move(box.x - 200, box.y, { steps: 6 });
  await page.mouse.up();

  await page.waitForTimeout(200);
  const after = await getPivotScrollLeft(page);

  expect(after).not.toBe(before);
});

test.describe('pivot touch swipe', () => {
  test.use({ hasTouch: true });

  test('pivot responds to touch swipe', async ({ page }) => {
    await gotoPivotPage(page);

    const box = await getPivotViewportBox(page);
    expect(box).not.toBeNull();

    const before = await getPivotScrollLeft(page);

    await dispatchPivotPointerSequence(page, {
      startX: box.x + 140,
      endX: box.x - 140,
      type: 'touch'
    });

    await page.waitForTimeout(200);
    const after = await getPivotScrollLeft(page);

    expect(after).not.toBe(before);
  });
});
