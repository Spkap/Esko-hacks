import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { artworks, checks, references, reviews, runs } from '../src/demo/fixtures';
import { sampleScenarios } from '../src/demo/scenarios';
import { summarize } from '../src/domain/summary';
for (const asset of [...artworks, ...references]) {
  const file = new URL(`../public${asset.url}`, import.meta.url);
  if (createHash('sha256').update(readFileSync(file)).digest('hex') !== asset.fileHash)
    throw new Error(`Asset hash mismatch ${asset.id}`);
}
for (const list of [artworks, checks, references, reviews, runs])
  if (new Set(list.map((item) => item.id)).size !== list.length)
    throw new Error('Duplicate seed identifier');
for (const check of checks) {
  const run = runs.find((item) => item.id === check.runId);
  const art = artworks.find((item) => item.id === check.evidence.artworkVersionId);
  const source = references.find((item) => item.id === check.evidence.sourceId);
  if (
    !run ||
    !art ||
    !source ||
    run.artworkVersionId !== art.id ||
    !run.referenceIds.includes(source.id) ||
    check.evidence.page > art.pages.length ||
    !check.evidence.sourceLocation
  )
    throw new Error(`Broken evidence ${check.id}`);
}
const expected = JSON.parse(
  readFileSync(new URL('../../reference-data/expected-results.json', import.meta.url), 'utf8'),
);
for (const [id, target] of Object.entries(expected) as [
  string,
  { label: string; results: string[] },
][]) {
  const run = runs.find((item) => item.reviewId === id)!;
  const results = checks.filter((item) => item.runId === run.id);
  if (
    summarize(run.status, results).label !== target.label ||
    JSON.stringify(results.map((item) => item.result)) !== JSON.stringify(target.results)
  )
    throw new Error(`Unexpected seeded result ${id}`);
}
for (const scenario of sampleScenarios)
  if (!reviews.some((item) => item.id === scenario.id))
    throw new Error(`Missing runnable sample ${scenario.id}`);
console.log(
  `Validated ${reviews.length} reviews, ${checks.length} findings and ${sampleScenarios.length} runnable scenarios.`,
);
