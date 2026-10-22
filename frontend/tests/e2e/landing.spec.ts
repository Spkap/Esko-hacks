import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';

test('landing sample interaction connects finding, marker, evidence and full review', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Check your packaging before it reaches the shelf.',
  );
  const productImage = page.getByRole('img', { name: /Illustrative studio render/ });
  await expect(productImage).toBeVisible();
  await expect
    .poll(() => productImage.evaluate((image) => (image as HTMLImageElement).naturalWidth))
    .toBeGreaterThan(0);
  await expect(page.getByText('Sample review uses the original flat artwork.')).toBeVisible();
  await page.getByRole('button', { name: /Juice statement missing/ }).click();
  await expect(page.getByTestId('landing-evidence')).toContainText('No juice statement appears');
  await expect(page.getByTestId('selected-marker')).toHaveCount(0);
  await page.getByRole('button', { name: /2 Declared net quantity/ }).click();
  await expect(page.getByTestId('selected-marker')).toBeVisible();
  await expect(page.getByTestId('landing-evidence')).toContainText('Artwork declares 250 mL');
  const source = page.getByRole('link', { name: /Read source/ });
  expect((await page.request.get((await source.getAttribute('href'))!)).ok()).toBeTruthy();
  await page.getByRole('link', { name: 'Open full review' }).click();
  await expect(page).toHaveURL(/checks\/mori-strawberry\?check=mori-strawberry-quantity/);
  await expect(page.getByTestId('selected-evidence')).toContainText('Artwork declares 250 mL');
  await page.goto('/');
  await page.reload();
  await page.getByRole('link', { name: 'Try sample check', exact: true }).first().click();
  await expect(page).toHaveURL('/checks/mori-strawberry');
  expect(errors).toEqual([]);
});

test('mobile navigation supports keyboard and restores focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const trigger = page.getByRole('button', { name: 'Open navigation' });
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Explore Wavelength' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.getByRole('link', { name: 'Try sample check' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(dialog.getByRole('button', { name: 'Close dialog' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
});

test('new screens reflow, respect reduced motion and have no serious axe findings', async ({
  page,
}) => {
  fs.mkdirSync('evidence', { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const route of ['/', '/checks/new']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if (route === '/') await expect(page.getByTestId('landing-evidence')).toBeVisible();
    for (const width of [1440, 768, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      if (route === '/') {
        await page
          .getByRole('img', { name: /Illustrative studio render/ })
          .evaluate((image) => (image as HTMLImageElement).decode());
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
      }
      await page.screenshot({
        path: `evidence/${route === '/' ? 'landing' : 'upload'}-${width}.png`,
        fullPage: true,
      });
    }
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter((v) => ['serious', 'critical'].includes(v.impact || '')),
    ).toEqual([]);
  }
});

test('hero review callout opens the original sample finding', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: /A detail worth reviewing/i }).click();
  await expect(page).toHaveURL('/checks/mori-strawberry?check=mori-strawberry-declaration');
  await expect(page.getByTestId('selected-evidence')).toContainText('No juice statement appears');
});

test('report handoff preview preserves the sample findings and links to the report', async ({
  page,
}) => {
  await page.goto('/');
  const preview = page.getByRole('region', { name: 'Sample report preview' });
  await expect(preview.getByRole('heading', { name: 'MORI Strawberry' })).toBeVisible();
  await expect(preview).toContainText('Issues found');
  await expect(preview.locator('.wl-report-checks a')).toHaveCount(3);
  await preview.getByRole('link', { name: /Fail Juice statement/ }).click();
  await expect(page.getByTestId('selected-evidence')).toContainText('No juice statement appears');
  await page.goto('/');
  await page
    .getByRole('region', { name: 'Sample report preview' })
    .getByRole('link', { name: 'Open sample report' })
    .click();
  await expect(page).toHaveURL('/checks/mori-strawberry/report');
  await expect(page.getByRole('heading', { name: 'Review report' })).toBeVisible();
});
