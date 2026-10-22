import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('dashboard and new-check dialog have no axe violations', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByTestId('review-row')).toHaveCount(5);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'New check', exact: true }).click();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
