import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('dashboard and navigation dialog have no axe violations', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByTestId('review-row')).toHaveCount(5);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.setViewportSize({ width: 390, height: 1000 });
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.getByRole('dialog', { name: 'Workspace navigation' })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
