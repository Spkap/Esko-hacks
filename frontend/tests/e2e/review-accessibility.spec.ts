import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
for (const route of [
  '/checks/mori-strawberry',
  '/checks/mori-corrected',
  '/checks/mori-raster',
  '/checks/fieldwork-granola',
  '/checks/mori-cancelled',
  '/checks/mori-strawberry/report',
  '/checks/does-not-exist',
]) {
  test(`axe and no browser exceptions: ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route);
    await expect(page.locator('.skeleton')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    if (route.includes('fieldwork'))
      await expect(page.locator('canvas')).toHaveAttribute('data-rendered', 'true');
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    expect(errors).toEqual([]);
    if (route === '/checks/mori-strawberry') {
      await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  });
}

test('keyboard opens a finding, reaches its source, and contains navigation focus', async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 1000 });
  await page.goto('/dashboard');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'New check', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('link', { name: 'Use sample', exact: true }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /^2 Declared net quantity/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('selected-evidence')).toContainText('250 mL');
  await page.getByRole('link', { name: /Open source document/ }).focus();
  await expect(page.getByRole('link', { name: /Open source document/ })).toBeFocused();
  await page.getByRole('button', { name: 'Open navigation' }).focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Workspace navigation' });
  await expect(dialog).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'evidence/navigation-drawer-768.png', fullPage: true });
  for (let n = 0; n < 12; n++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeFocused();
});
