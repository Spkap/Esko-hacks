import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
function artworkPdf(quantity = 250) {
  const stream = `BT /F1 18 Tf 40 220 Td (Fruit beverage) Tj 0 -30 Td (Net quantity ${quantity} mL) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 300] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 6\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((n) => `${String(n).padStart(10, '0')} 00000 n \n`)
    .join('')}trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf);
}
test('live upload runs real extraction and preserves upload hash and rule versions', async ({
  page,
}) => {
  test.skip(
    process.env.NEXT_PUBLIC_DATA_MODE !== 'live',
    'Requires live backend, database, worker and server-only reviewer token.',
  );
  test.setTimeout(180000);
  const artwork = artworkPdf();
  await page.goto('/checks/new');
  await page.getByLabel('Product name').fill(`Live quantity mismatch ${Date.now()}`);
  await page
    .getByLabel('Packaging artwork', { exact: true })
    .setInputFiles({ name: 'actual-250ml.pdf', mimeType: 'application/pdf', buffer: artwork });
  await page.getByLabel('Product specification', { exact: true }).setInputFiles({
    name: 'approved-spec.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        schemaVersion: '1',
        product: { netQuantity: { value: 300, unit: 'mL' } },
        requiredStatements: [],
      }),
    ),
  });
  await page.getByLabel('Specification approval status').selectOption('approved');
  await page.getByRole('button', { name: 'Upload and run checks' }).click();
  await expect(page.getByTestId('assessment-summary')).toBeVisible({ timeout: 120000 });
  await expect(page.getByTestId('assessment-summary')).toContainText('Issues found');
  const reviewId = new URL(page.url()).pathname.split('/').at(-1)!;
  const detail = await (await page.request.get(`/api/backend/v1/reviews/${reviewId}`)).json();
  const report = await (
    await page.request.get(`/api/backend/v1/runs/${detail.review.latestRunId}/report`)
  ).json();
  expect(detail.artworkVersions[0].fileHash).toBe(
    createHash('sha256').update(artwork).digest('hex'),
  );
  expect(report.run.mode).toBe('live');
  expect(report.run.status).toBe('completed');
  expect(report.run.artworkVersionId).toBe(detail.artworkVersions[0].id);
  expect(report.run.referenceIds).toContain(detail.references[0].id);
  expect(report.run.ruleSetVersion).toBe('wavelength-core-v1');
  expect(
    report.checks.find((check: { ruleId: string }) => check.ruleId === 'net-quantity').result,
  ).toBe('fail');
  await page.getByRole('link', { name: 'View report' }).click();
  await expect(page.getByRole('heading', { name: 'Review report', exact: true })).toBeVisible();
  await expect(page.getByText('actual-250ml.pdf', { exact: false })).toBeVisible();
  const originalReportUrl = page.url();
  await page.getByRole('link', { name: 'Back to artwork review' }).click();
  await page.getByLabel('Check a corrected artwork version').setInputFiles({
    name: 'corrected-300ml.pdf',
    mimeType: 'application/pdf',
    buffer: artworkPdf(300),
  });
  await page.getByRole('button', { name: 'Upload new version and recheck' }).click();
  await expect(page.getByTestId('selected-evidence')).toContainText('300 mL', { timeout: 120000 });
  await expect(page.getByTestId('selected-evidence')).toContainText('Pass');
  await expect(page.locator('.review-heading')).toContainText('Artwork V2');
  await expect(page.locator('canvas')).toHaveAttribute('data-rendered', 'true', { timeout: 30000 });
  await page.screenshot({ path: 'evidence/live-corrected-review-1440.png', fullPage: true });
  const correctedDetail = await (
    await page.request.get(`/api/backend/v1/reviews/${reviewId}`)
  ).json();
  expect(correctedDetail.artworkVersions).toHaveLength(2);
  expect(correctedDetail.review.latestRunId).not.toBe(report.run.id);
  await page.goto(originalReportUrl);
  await expect(page.getByRole('heading', { name: 'Review report', exact: true })).toBeVisible();
  await expect(page.getByText('actual-250ml.pdf', { exact: false })).toBeVisible();
  await expect(page.getByText('Issues found', { exact: true })).toBeVisible();
  await page.goto(`/checks/${reviewId}`);
  await page.getByText('Update the specification or rerun current inputs', { exact: true }).click();
  await page.getByLabel('Updated product specification (optional)').setInputFiles({
    name: 'revised-350ml.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        schemaVersion: '1',
        product: { netQuantity: { value: 350, unit: 'mL' } },
        requiredStatements: [],
      }),
    ),
  });
  await page.getByLabel('Updated specification approval status').selectOption('approved');
  await page.getByRole('button', { name: 'Run selected inputs again' }).click();
  await expect(page.getByTestId('selected-evidence')).toContainText('350 mL', { timeout: 120000 });
  await expect(page.getByTestId('selected-evidence')).toContainText('Fail');
  await expect(page.getByText('Analysis history', { exact: true })).toBeVisible();
  const revised = await (await page.request.get(`/api/backend/v1/reviews/${reviewId}`)).json();
  expect(revised.runs).toHaveLength(3);
  expect(revised.runs[0].referenceIds).not.toContain(report.run.referenceIds[0]);
  // Upload without starting a new job: frozen historical reports must still open.
  const upload = await page.request.post(`/api/backend/v1/reviews/${reviewId}/artworks`, {
    headers: { Origin: new URL(page.url()).origin },
    multipart: {
      file: {
        name: 'unrun-third-version.pdf',
        mimeType: 'application/pdf',
        buffer: artworkPdf(350),
      },
    },
  });
  expect(upload.status()).toBe(201);
  await page.goto(originalReportUrl);
  await expect(page.getByText('actual-250ml.pdf', { exact: false })).toBeVisible();
  await expect(page.getByText('Issues found', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to artwork review' }).click();
  await expect(page.getByTestId('selected-evidence')).toContainText('250 mL');
  const origin = new URL(page.url()).origin;
  const queued = await page.request.post('/api/backend/v1/runs', {
    headers: { Origin: origin },
    data: {
      reviewId,
      artworkVersionId: report.run.artworkVersionId,
      referenceIds: report.run.referenceIds,
      ruleSetVersion: report.run.ruleSetVersion,
      selectedRuleIds: report.run.selectedRuleIds,
      requestKey: crypto.randomUUID(),
    },
  });
  expect(queued.status()).toBe(202);
  const queuedRun = await queued.json();
  const cancelled = await page.request.post(`/api/backend/v1/runs/${queuedRun.id}/cancel`, {
    headers: { Origin: origin },
    data: {},
  });
  expect((await cancelled.json()).status).toBe('cancelled');
  await page.goto(`/checks/${reviewId}?run=${queuedRun.id}`);
  await page.getByRole('button', { name: 'Retry analysis with saved inputs' }).click();
  await expect(page.getByTestId('assessment-summary')).toContainText('Issues found', {
    timeout: 120000,
  });
  const recovered = await (await page.request.get(`/api/backend/v1/reviews/${reviewId}`)).json();
  expect(recovered.review.latestRunId).not.toBe(queuedRun.id);
});
