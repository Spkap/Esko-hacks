import { test, expect } from '@playwright/test';
import path from 'node:path';
const samplePdf = path.resolve('public/demo/fieldwork-carton.pdf');

test('validates files and required fields without losing product details; reset clears draft', async ({
  page,
}) => {
  await page.goto('/checks/new');
  await page.getByRole('button', { name: 'Create file preview' }).click();
  await expect(page.getByLabel('Product name')).toBeFocused();
  await page.getByLabel('Product name').fill('My beverage');
  await page
    .getByLabel('Packaging artwork', { exact: true })
    .setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('bad') });
  await page.getByRole('button', { name: 'Create file preview' }).click();
  await expect(page.getByLabel('Packaging artwork', { exact: true })).toBeFocused();
  await expect(page.getByLabel('Product name')).toHaveValue('My beverage');
  await expect(
    page.getByText('Choose a non-empty PDF, PNG, or JPEG no larger than 20 MiB.'),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Product name')).toHaveValue('My beverage');
  await expect(page.getByText(/Re-select files to preview them/)).toBeVisible();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(page.getByLabel('Product name')).toHaveValue('');
  await page.reload();
  await expect(page.getByLabel('Product name')).toHaveValue('');
});

test('PDF upload has readable multipage preview, no sample findings, and reload-safe metadata', async ({
  page,
}) => {
  await page.goto('/checks/new');
  await page.getByLabel('Product name').fill('Independent file preview');
  await page.getByLabel('Packaging artwork', { exact: true }).setInputFiles(samplePdf);
  await page.getByLabel('Product specification', { exact: true }).setInputFiles(samplePdf);
  await page.getByRole('button', { name: 'Create file preview' }).dblclick();
  await expect(
    page.getByText('Live analysis is not connected. No compliance checks have been run.'),
  ).toBeVisible();
  await expect(page.locator('canvas[data-rendered="true"]')).toBeVisible();
  await page.getByLabel('Artwork page', { exact: true }).selectOption('2');
  await expect(
    page.locator('canvas[aria-label="Artwork PDF page 2"][data-rendered="true"]'),
  ).toBeVisible();
  const metadata = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem('veriforge-upload-metadata-v1')!),
  );
  expect(metadata.reviews).toHaveLength(1);
  expect(metadata.artworks[0].url).toBe('');
  await page.getByRole('link', { name: 'Open saved details' }).click();
  await expect(
    page.getByRole('heading', { name: 'No compliance checks have been run' }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Independent file preview' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Juice statement/ })).toHaveCount(0);
});

test('image preview uses natural image dimensions and sample remains a separate action', async ({
  page,
}) => {
  await page.goto('/checks/new');
  await page.getByLabel('Product name').fill('Image preview');
  await page
    .getByLabel('Packaging artwork', { exact: true })
    .setInputFiles({
      name: 'label.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1cAAAAASUVORK5CYII=',
        'base64',
      ),
    });
  await page.getByLabel('Product specification', { exact: true }).setInputFiles(samplePdf);
  await page.getByRole('button', { name: 'Create file preview' }).click();
  await expect(
    page.getByText('Live analysis is not connected. No compliance checks have been run.'),
  ).toBeVisible();
  await expect(page.getByTestId('artwork-page')).toHaveAttribute('data-page', '1');
  await page.getByRole('link', { name: 'Use sample', exact: true }).click();
  await expect(page).toHaveURL('/checks/mori-strawberry');
  await expect(page.getByTestId('assessment-summary')).toContainText('Issues found');
});
