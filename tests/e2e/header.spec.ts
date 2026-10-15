import {expect, test} from '@playwright/test';

test('production header stays readable with the approved mark and no text collisions', async ({page}, testInfo) => {
  // Header layout and controls do not depend on provider availability.
  await page.route('https://**/*', route => route.abort());
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const header = page.locator('.masthead');
  const mark = header.locator('img.header-mark');
  await expect(header.locator('img')).toHaveCount(1);
  await expect(mark).toHaveAttribute('src', './observatory-mark.svg');
  await expect(mark).toHaveAttribute('width', '40');
  await expect(mark).toHaveAttribute('height', '40');
  await expect.poll(() => mark.evaluate(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0 && image.currentSrc.endsWith('/observatory-mark.svg'))).toBe(true);
  expect(await mark.evaluate(image => getComputedStyle(image).float)).toBe('none');
  for (const path of ['/observatory-mark.svg', '/favicon.svg']) {
    const asset = await page.request.get(path);
    expect(asset.ok()).toBe(true);
    const source = await asset.text();
    expect(source).toContain('<title id="title">Tezos Observatory</title>');
    expect(source).toContain('fill="#064B40"');
    expect(source).toContain('<ellipse');
    expect(source).not.toContain('ASTRA');
  }
  for (const width of [240, 360, 390, 768, 1440, 1920, 3440, 5120]) {
    await page.setViewportSize({width, height: 1000});
    const geometry = await header.evaluate(element => {
      const heading = element.querySelector('h1')!;
      const eyebrow = element.querySelector('.eyebrow')!;
      const live = element.querySelector('.live-label')!;
      const icon = element.querySelector('img')!.getBoundingClientRect();
      const textRects = (node: Element) => {
        const range = document.createRange();
        range.selectNodeContents(node);
        return [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0)
          .map(rect => ({left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom}));
      };
      return {
        headingHeight: heading.getBoundingClientRect().height,
        headingLineHeight: Number.parseFloat(getComputedStyle(heading).lineHeight),
        eyebrow: textRects(eyebrow), live: textRects(live),
        brandAndControls: [heading, eyebrow, live, ...element.querySelectorAll('button')].flatMap(textRects),
        icon: {left: icon.left, right: icon.right, top: icon.top, bottom: icon.bottom},
        headerWidth: element.clientWidth, headerScrollWidth: element.scrollWidth,
        viewport: window.innerWidth, scrollWidth: document.documentElement.scrollWidth,
      };
    });
    if (width >= 360) expect(geometry.headingHeight, `heading wraps at ${width}px`).toBeLessThanOrEqual(geometry.headingLineHeight + 1);
    expect(geometry.headerScrollWidth, `header overflow at ${width}px`).toBe(geometry.headerWidth);
    if (width >= 360) expect(geometry.scrollWidth, `horizontal overflow at ${width}px`).toBe(geometry.viewport);
    for (const text of geometry.brandAndControls) {
      const icon = geometry.icon;
      expect(icon.left < text.right && icon.right > text.left && icon.top < text.bottom && icon.bottom > text.top, `icon/text collision at ${width}px`).toBe(false);
    }
    for (const rect of [...geometry.eyebrow, ...geometry.live, geometry.icon]) {
      expect(rect.left).toBeGreaterThanOrEqual(0);
      expect(rect.right).toBeLessThanOrEqual(width);
    }
    for (const eyebrow of geometry.eyebrow) for (const live of geometry.live) {
      const intersects = eyebrow.left < live.right && eyebrow.right > live.left && eyebrow.top < live.bottom && eyebrow.bottom > live.top;
      expect(intersects, `eyebrow/monitoring text overlap at ${width}px`).toBe(false);
    }
    if ([390, 1440, 3440].includes(width)) await page.screenshot({path: testInfo.outputPath(`header-${width}.png`), fullPage: false});
  }
  const pause = page.getByRole('button', {name: 'Pause', exact: true});
  await pause.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', {name: 'Resume', exact: true})).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Enter');
  await expect(pause).toHaveAttribute('aria-pressed', 'false');
  const reconnect = page.getByRole('button', {name: 'Reconnect', exact: true});
  await reconnect.focus();
  await page.keyboard.press('Enter');
  await expect(reconnect).toBeFocused();
});
