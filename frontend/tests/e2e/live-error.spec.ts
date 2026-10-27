import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('unconnected live mode shows retryable errors and never a demo report', async ({ page }) => {
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of [
      '/dashboard',
      '/checks/mori-strawberry',
      '/checks/mori-strawberry/report',
    ]) {
      await page.goto(path);
      const errorPanel = page
        .getByRole('alert')
        .filter({ hasText: 'Local reviewer credentials are not configured.' });
      await expect(errorPanel).toBeVisible();
      await page.getByRole('button', { name: 'Try again' }).click();
      await expect(errorPanel).toBeVisible();
      await expect(page.getByTestId('selected-evidence')).toHaveCount(0);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await page.screenshot({
        path: `evidence/error-${path.includes('report') ? 'report' : path.includes('checks') ? 'review' : 'dashboard'}-${width}.png`,
        fullPage: true,
      });
    }
  }
});
