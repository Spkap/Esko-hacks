import { test, expect } from '@playwright/test';
test.use({ deviceScaleFactor: 2 });
test('PDF raster uses the device scale and recovers after a render failure', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.route('**/demo/fieldwork-carton.pdf', (route) => route.abort());
  await page.goto('/checks/fieldwork-granola');
  await expect(
    page.getByText('The PDF could not be rendered. Retry or open the original artwork.'),
  ).toBeVisible();
  await page.screenshot({ path: 'evidence/pdf-error-recovery.png', fullPage: true });
  await page.unroute('**/demo/fieldwork-carton.pdf');
  await page.getByRole('button', { name: 'Retry PDF' }).click();
  await expect(page.locator('canvas')).toHaveAttribute('data-rendered', 'true');
  expect(
    await page
      .locator('canvas')
      .evaluate((el) => (el as HTMLCanvasElement).width >= el.getBoundingClientRect().width * 1.99),
  ).toBe(true);
  await page.screenshot({ path: 'evidence/pdf-dpr2.png', fullPage: true });
});
test('markers preserve normalized alignment through zoom, rotation, and resize at DPR2', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/checks/mori-corrected?check=mori-corrected-quantity');
  await expect(page.getByTestId('selected-marker')).toBeVisible();
  for (const rotation of [0, 90, 180, 270]) {
    if (rotation) await page.getByRole('button', { name: 'Rotate clockwise' }).click();
    await expect(page.getByTestId('artwork-page')).toHaveAttribute(
      'data-rotation',
      String(rotation),
    );
    const expected =
      rotation === 0
        ? { x: 0.407, y: 0.79, w: 0.186, h: 0.055 }
        : rotation === 90
          ? { x: 0.155, y: 0.407, w: 0.055, h: 0.186 }
          : rotation === 180
            ? { x: 0.407, y: 0.155, w: 0.186, h: 0.055 }
            : { x: 0.79, y: 0.407, w: 0.055, h: 0.186 };
    for (const zoom of ['Zoom in', 'Zoom out', 'Fit page']) {
      await page.getByRole('button', { name: zoom, exact: true }).click();
      const a = (await page.getByTestId('artwork-page').boundingBox())!;
      const b = (await page.getByTestId('selected-marker').boundingBox())!;
      expect((b.x - a.x) / a.width).toBeCloseTo(expected.x, 2);
      expect((b.y - a.y) / a.height).toBeCloseTo(expected.y, 2);
      expect(b.width / a.width).toBeCloseTo(expected.w, 2);
      expect(b.height / a.height).toBeCloseTo(expected.h, 2);
    }
  }
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.getByRole('button', { name: 'Artwork', exact: true }).click();
  await expect(page.getByTestId('selected-marker')).toBeVisible();
  await page.getByRole('button', { name: 'Findings & evidence' }).click();
  await expect(page.getByTestId('selected-evidence')).toContainText('250 mL');
});
