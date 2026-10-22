import { test, expect } from '@playwright/test';
test('sources open readable local documents and sample assets resolve', async ({
  page,
  request,
}) => {
  await page.goto('/checks/mori-strawberry');
  const popupPromise = page.waitForEvent('popup');
  await page.getByRole('link', { name: /Open source document/ }).click();
  const source = await popupPromise;
  await expect(
    source.getByRole('heading', { name: 'Illustrative review checklist' }),
  ).toBeVisible();
  await expect(source.getByText('1 · Juice statement')).toBeVisible();
  await source.close();
  for (const asset of [
    '/demo/mori-v1.svg',
    '/demo/mori-v2.svg',
    '/demo/fieldwork-carton.pdf',
    '/demo/sample-specification.html',
    '/demo/sample-checklist.html',
    '/pdf.worker.min.mjs',
  ]) {
    expect((await request.get(asset)).status()).toBe(200);
  }
});
test('reset clears the visible decision and the report', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/checks/mori-strawberry');
  await page.getByRole('button', { name: 'Acknowledge', exact: true }).click();
  await expect(page.getByTestId('decision-status')).toContainText('Acknowledged');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('button', { name: 'Reset workspace', exact: true }).click();
  await expect(page).toHaveURL('/dashboard');
  await page.goto('/checks/mori-strawberry');
  await expect(page.getByTestId('decision-status')).toContainText('Open');
  await expect(page.getByTestId('assessment-summary')).toContainText('Issues found');
  await page.reload();
  await expect(page.getByTestId('decision-status')).toContainText('Open');
});
test('corrupt browser storage does not crash review or report', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('veriforge-decisions-v1', 'invalid-json'));
  await page.goto('/checks/mori-strawberry');
  await expect(page.getByTestId('decision-status')).toContainText('Open');
  await page.getByRole('button', { name: 'Acknowledge', exact: true }).click();
  await expect(page.getByTestId('decision-status')).toContainText('Acknowledged');
});
