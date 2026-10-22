import { test, expect } from '@playwright/test';

test('dashboard searches and combines shareable filters', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Packaging reviews' })).toBeVisible();
  await expect(page.getByText('5 reviews', { exact: true })).toBeVisible();
  await page.getByLabel('Search reviews').fill('MORI');
  await page.getByLabel('Market', { exact: true }).selectOption('Japan');
  await page.getByLabel('Result', { exact: true }).selectOption('Issues found');
  await expect(page.getByTestId('review-row')).toHaveCount(1);
  await page.reload();
  await expect(page.getByLabel('Search reviews')).toHaveValue('MORI');
  await expect(page.getByTestId('review-row')).toHaveCount(1);
  await page.getByLabel('Search reviews').fill('no matching product');
  await expect(page.getByRole('heading', { name: 'No matching reviews' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByTestId('review-row')).toHaveCount(5);
});

test('new check opens the upload form', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'New check', exact: true }).last().click();
  await expect(page).toHaveURL('/checks/new');
  await expect(page.getByLabel('Product name')).toBeVisible();
});
