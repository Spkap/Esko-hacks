import { test, expect } from '@playwright/test';

test('dashboard searches and combines shareable filters', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Packaging reviews' })).toBeVisible();
  await expect(page.getByText('6 reviews', { exact: true })).toBeVisible();
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
  await expect(page.getByTestId('review-row')).toHaveCount(6);
});

test('new check opens the upload form', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('link', { name: 'New check', exact: true }).last().click();
  await expect(page).toHaveURL('/checks/new');
  await expect(page.getByLabel('Product name')).toBeVisible();
});

test('summary result filters and reset keep the displayed review scope clear', async ({ page }) => {
  await page.goto('/dashboard');
  await page.getByRole('button', { name: /^Issues found/ }).click();
  await expect(page.getByLabel('Result', { exact: true })).toHaveValue('Issues found');
  await expect(page.getByTestId('review-row')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Issues found/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.getByText('of 6 in this workspace')).toBeVisible();
  await page.getByRole('button', { name: 'Reset filters', exact: true }).click();
  await expect(page.getByTestId('review-row')).toHaveCount(6);
  await expect(page.getByRole('button', { name: /^All reviews/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: /^Selected checks passed/ }).click();
  await expect(page.getByTestId('review-row')).toHaveCount(1);
  await expect(
    page.getByRole('link', { name: 'MORI Strawberry · revised artwork', exact: true }),
  ).toBeVisible();
});
