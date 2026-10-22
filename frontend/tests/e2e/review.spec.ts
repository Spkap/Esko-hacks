import { test, expect } from '@playwright/test';

test('finding selection links evidence, artwork, and source; missing text has no marker', async ({
  page,
}) => {
  await page.goto('/checks/mori-strawberry');
  await expect(page.getByRole('heading', { name: 'MORI Strawberry', exact: true })).toBeVisible();
  await expect(page.getByTestId('selected-evidence')).toContainText('No juice statement');
  await expect(page.getByTestId('selected-marker')).toHaveCount(0);
  await page
    .getByRole('button', { name: /^2 Declared net quantity matches specification/ })
    .click();
  await expect(page.getByTestId('selected-marker')).toBeVisible();
  await expect(page.getByTestId('selected-evidence')).toContainText('250 mL');
  await expect(page.getByRole('link', { name: /Open source document/ })).toHaveAttribute(
    'href',
    '/demo/sample-specification.html',
  );
  await page.reload();
  await expect(page.getByTestId('selected-evidence')).toContainText('250 mL');
  await page.getByRole('button', { name: /Marker 2/ }).click();
  await expect(page.getByTestId('selected-evidence')).toContainText('250 mL');
});

test('decisions persist without changing the original failure; dismissal requires a reason', async ({
  page,
}) => {
  await page.goto('/checks/mori-strawberry');
  await page.getByRole('button', { name: 'Acknowledge', exact: true }).click();
  await expect(page.getByTestId('decision-status')).toContainText('Acknowledged');
  await expect(page.getByTestId('assessment-summary')).toContainText('Issues found');
  await page.getByRole('button', { name: 'Dismiss', exact: true }).click();
  await page.getByRole('button', { name: 'Save dismissal' }).click();
  await expect(page.getByLabel('Reason for dismissal')).toBeFocused();
  await page
    .getByLabel('Reason for dismissal')
    .fill('Demo review: exception needs a separate approval.');
  await page.getByRole('button', { name: 'Save dismissal' }).click();
  await page.reload();
  await expect(page.getByTestId('decision-status')).toContainText('Dismissed');
  await expect(page.getByTestId('assessment-summary')).toContainText('Issues found');
  await page.getByRole('link', { name: 'View report' }).click();
  await expect(page.getByRole('heading', { name: 'Review report' })).toBeVisible();
  await expect(page.getByText('Demo review: exception needs a separate approval.')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Review report' })).toBeVisible();
});

test('PDF selection opens page two and viewer controls render at different zoom and rotation', async ({
  page,
}) => {
  await page.goto('/checks/fieldwork-granola');
  await expect(page.locator('canvas')).toHaveAttribute('data-rendered', 'true');
  await expect(page.getByLabel('Artwork page')).toHaveValue('2');
  await page.getByRole('button', { name: 'Rotate clockwise' }).click();
  await expect(page.getByTestId('artwork-page')).toHaveAttribute('data-rotation', '90');
  await page.getByRole('button', { name: 'Zoom in' }).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-rendered', 'true');
  await page.getByRole('button', { name: 'Fit page' }).click();
  await page.getByLabel('Artwork page').selectOption('1');
  await expect(page.locator('canvas')).toHaveAttribute('data-rendered', 'true');
  await page.getByLabel('Artwork page').selectOption('2');
  await page.getByRole('button', { name: /Nutrition panel verification not selected/ }).click();
  await expect(page.getByTestId('selected-evidence')).toContainText('Not checked');
});

test('unknown review and report URLs have a recovery link', async ({ page }) => {
  for (const url of ['/checks/does-not-exist', '/checks/does-not-exist/report']) {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Review not found' })).toBeVisible();
    await page.getByRole('link', { name: 'Back to dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Packaging reviews' })).toBeVisible();
  }
});
