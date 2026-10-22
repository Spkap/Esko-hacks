import { test, expect } from '@playwright/test';
for (const width of [320, 768, 1024, 1440]) {
  test(`dashboard screenshot and reflow ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/dashboard');
    await expect(page.getByTestId('review-row')).toHaveCount(6);
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({ path: `evidence/dashboard-${width}.png`, fullPage: true });
  });
}
