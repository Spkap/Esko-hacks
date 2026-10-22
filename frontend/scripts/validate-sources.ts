import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../../', import.meta.url));
const sources = JSON.parse(readFileSync(path.join(root, 'reference-data/sources.json'), 'utf8'));
const ids = new Set<string>();
for (const source of sources) {
  for (const field of [
    'id',
    'url',
    'publisher',
    'title',
    'location',
    'language',
    'translationStatus',
    'effectiveDate',
    'reuseTerms',
    'retrievedAt',
    'path',
    'sha256',
    'archiveType',
  ])
    if (!source[field]) throw new Error(`Missing ${field}: ${source.id}`);
  if (ids.has(source.id)) throw new Error(`Duplicate source ${source.id}`);
  ids.add(source.id);
  if (new URL(source.url).protocol !== 'https:') throw new Error(`Invalid source URL ${source.id}`);
  const file = path.join(root, source.path);
  if (
    !existsSync(file) ||
    createHash('sha256').update(readFileSync(file)).digest('hex') !== source.sha256
  )
    throw new Error(`Source artifact mismatch: ${source.id}`);
}
console.log(
  `Validated ${sources.length} source records and local artifact hashes. Original CAA PDFs remain externally linked; direct downloads were unavailable.`,
);
