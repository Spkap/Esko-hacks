import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('sample setup, simulated run, persisted decision, correction, report and full reset', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/checks/new');
  await page.getByRole('button', { name: 'Start with sample files' }).click();
  await expect(page.getByLabel('Sample scenario')).toHaveValue('mori-strawberry');
  await expect(page.getByRole('link', { name: /^mori-label-v1.svg/ })).toBeVisible();
  await page.getByRole('button', { name: 'Run simulated check' }).dblclick();
  await expect(page.getByText('Demonstration only. No live analysis is running.')).toBeVisible();
  await expect(page).toHaveURL('/checks/mori-strawberry');
  await expect(page.getByTestId('assessment-summary')).toContainText('Issues found');
  await page.getByRole('button', { name: 'Acknowledge', exact: true }).click();
  await page.reload();
  await expect(page.getByTestId('decision-status')).toContainText('Acknowledged');
  expect(
    await page.evaluate(
      () => JSON.parse(sessionStorage.getItem('wavelength-sample-runs-v1') || '[]').length,
    ),
  ).toBe(1);
  await page.getByRole('link', { name: 'Compare the corrected sample' }).click();
  await expect(page.getByLabel('Sample scenario')).toHaveValue('mori-corrected');
  await page.getByRole('button', { name: 'Run simulated check' }).click();
  await expect(page).toHaveURL('/checks/mori-corrected');
  await expect(page.getByTestId('assessment-summary')).toContainText('Selected checks passed');
  await expect(page.getByText(/printed size and placement are still unverified/)).toBeVisible();
  await page.getByRole('link', { name: 'View report' }).click();
  await expect(page.getByRole('heading', { name: 'Review report' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Outside this review' })).toBeVisible();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  expect(await page.evaluate(() => sessionStorage.getItem('wavelength-sample-runs-v1'))).toBeNull();
  await page.goto('/checks/mori-strawberry');
  await expect(page.getByTestId('decision-status')).toContainText('Open');
  expect(errors).toEqual([]);
});

test('mobile organizer sample has source-backed review questions and cancellation is safe', async ({
  page,
  request,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto('/checks/new?sample=dancingfish-granola');
  await expect(page.getByLabel('Sample scenario')).toHaveValue('dancingfish-granola');
  await expect(page.getByRole('link', { name: /^dancingfish-carton.pdf/ })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  const violations = (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
    ['serious', 'critical'].includes(v.impact || ''),
  );
  expect(violations).toEqual([]);
  await page.getByRole('button', { name: 'Run simulated check' }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Run simulated check' })).toBeEnabled();
  expect(await page.evaluate(() => sessionStorage.getItem('wavelength-sample-runs-v1'))).toBeNull();
  await page.getByRole('button', { name: 'Run simulated check' }).click();
  await expect(page).toHaveURL('/checks/dancingfish-granola');
  await expect(page.getByTestId('assessment-summary')).toContainText('Review incomplete');
  await expect(page.getByTestId('selected-evidence')).toContainText('Label Information · B24');
  await page.getByRole('button', { name: 'Artwork', exact: true }).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-rendered', 'true');
  await expect(page.getByLabel('Artwork page')).toHaveValue('1');
  await page.reload();
  await expect(page.getByTestId('assessment-summary')).toContainText('Review incomplete');
  for (const path of [
    '/demo/dancingfish-carton.pdf',
    '/demo/dancingfish-content.xlsx',
    '/demo/dancingfish-reference.html',
    '/demo/japan-source-notes.html',
  ])
    expect((await request.get(path)).status()).toBe(200);
});
