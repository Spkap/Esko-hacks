import { test, expect } from '@playwright/test';
for (const width of [320, 768, 1024, 1440]) {
  test(`review, artwork, report, and empty renders ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/checks/mori-corrected?check=mori-corrected-declaration');
    await expect(page.getByTestId('selected-evidence')).toContainText('果汁2%');
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `evidence/review-evidence-${width}.png`, fullPage: true });
    if (width < 1200) await page.getByRole('button', { name: 'Artwork', exact: true }).click();
    await expect(page.getByTestId('selected-marker')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `evidence/review-artwork-${width}.png`, fullPage: true });
    await page.goto('/checks/mori-strawberry/report');
    await expect(page.getByRole('heading', { name: 'Review report' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `evidence/report-${width}.png`, fullPage: true });
    await page.goto('/dashboard?q=missing');
    await expect(page.getByRole('heading', { name: 'No matching reviews' })).toBeVisible();
    await page.screenshot({ path: `evidence/empty-${width}.png`, fullPage: true });
  });
}
test('reduced motion and 200% equivalent reflow retain content', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 720, height: 900 });
  await page.goto('/checks/mori-raster');
  await expect(page.getByTestId('assessment-summary')).toContainText('Review incomplete');
  await page.getByRole('button', { name: /Printed type size/ }).click();
  await expect(page.getByTestId('selected-evidence')).toContainText('Applicability: uncertain');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'evidence/review-reflow-720-reduced-motion.png', fullPage: true });
});
