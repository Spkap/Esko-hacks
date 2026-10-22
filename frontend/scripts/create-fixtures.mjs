// Original fictional M1–M2 interface assets; not organizer or researched M5 files.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const dir = new URL('../public/demo/', import.meta.url);
mkdirSync(dir, { recursive: true });
for (const version of [1, 2]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="620" viewBox="0 0 900 620"><title>MORI Strawberry fictional flat label, version ${version}</title><desc>Front and back packaging panels. Net quantity 250 mL.${version === 2 ? ' Back panel has juice statement 果汁2%.' : ' No juice statement appears.'}</desc><rect width="900" height="620" fill="#fff"/>
  <g font-family="Arial,sans-serif" fill="#536078"><text x="35" y="42" font-size="12" letter-spacing="2">MORI / LABEL STUDY</text><text x="855" y="42" text-anchor="end" font-size="11">V${version} · FICTIONAL ARTWORK</text><path d="M35 56H865" stroke="#dce2ec"/><text x="42" y="100" font-size="11" letter-spacing="1.5">FRONT + BACK</text><text x="42" y="125" font-size="11">Japan · Fruit beverage</text><text x="42" y="146" font-size="11">Flat label preview</text><text x="42" y="185" font-size="10">Panels shown for inspection.</text><text x="42" y="203" font-size="10">Physical scale unverified.</text><text x="42" y="544" font-size="10">ORIGINAL DEMO ASSET</text></g>
  <rect x="288" y="76" width="308" height="470" rx="5" fill="#f6e9df" stroke="#e5d6c8"/><rect x="288" y="453" width="308" height="93" fill="#af2945"/><path d="M288 456Q365 410 441 448T596 438V474H288Z" fill="#af2945"/>
  <g text-anchor="middle" font-family="Arial,sans-serif"><text x="442" y="149" font-size="49" letter-spacing="4" font-weight="bold" fill="#882d42">MORI</text><text x="442" y="181" font-size="12" letter-spacing="4" fill="#882d42">A LITTLE FRUIT. A FRESH START.</text><text x="442" y="228" font-size="28" font-weight="bold" fill="#882d42">Strawberry</text><text x="442" y="255" font-size="17" fill="#882d42">いちご</text></g>
  <g transform="translate(442 347)"><ellipse cx="0" cy="59" rx="82" ry="12" fill="#e3cabd"/><path d="M-68-25C-105-64-37-92 0-54C40-92 105-63 68-25L20 53Q0 83-20 53Z" fill="#c73452"/><path d="M-53-30C-69-53-40-65-17-47" fill="none" stroke="#ec8b8c" stroke-width="8" stroke-linecap="round"/><path d="M0-50L-35-76L-6-71L5-99L15-69L48-78L25-52L45-40L9-43L-11-28L-9-53Z" fill="#3d6c44"/><g fill="#ffe6bc"><ellipse cx="-39" cy="-20" rx="2.5" ry="5" transform="rotate(-25 -39 -20)"/><ellipse cx="-6" cy="-13" rx="2.5" ry="5"/><ellipse cx="30" cy="-18" rx="2.5" ry="5" transform="rotate(25 30 -18)"/><ellipse cx="-25" cy="11" rx="2.5" ry="5"/><ellipse cx="12" cy="16" rx="2.5" ry="5"/><ellipse cx="-3" cy="45" rx="2.5" ry="5"/></g><path d="M-96 33Q-130-1-95-14Q-57 0-79 35" fill="#f7aab3"/><path d="M-98 28L-96-6" stroke="#fff0df" stroke-width="3"/></g>
  <g font-family="Arial,sans-serif" fill="white" text-anchor="middle"><text x="442" y="484" font-size="12" letter-spacing="2">STRAWBERRY FRUIT DRINK</text><text x="442" y="516" font-size="23" font-weight="bold">250 mL</text></g>
  <rect x="649" y="76" width="205" height="470" rx="5" fill="#faf6f0" stroke="#e5d6c8"/>
  <g font-family="Arial,sans-serif" fill="#593d3d"><text x="668" y="114" font-size="18" font-weight="bold">MORI / いちご</text><text x="668" y="145" font-size="11">Fictional fruit beverage</text><path d="M668 160H835" stroke="#d7c7bd"/><text x="668" y="184" font-size="11" font-weight="bold">INGREDIENTS</text><text x="668" y="206" font-size="10">Water, sugar, strawberry juice,</text><text x="668" y="223" font-size="10">citric acid, natural flavour.</text><text x="668" y="257" font-size="11" font-weight="bold">PRODUCT INFORMATION</text><text x="668" y="282" font-size="10">Keep cool. Shake gently.</text><text x="668" y="303" font-size="10">Best before: see base.</text><text x="668" y="324" font-size="10">Made for MORI Beverage Studio.</text><text x="668" y="360" font-size="10">Sample composition: 2% juice</text><text x="668" y="378" font-size="10">Not for sale. Interface fixture.</text>${version === 2 ? '<text x="680" y="434" font-size="23" font-weight="bold">果汁2%</text>' : ''}<path d="M668 459H835" stroke="#d7c7bd"/><text x="668" y="484" font-size="10">ARTWORK VERSION ${version}</text><text x="668" y="505" font-size="10">Fictional packaging. Not a legal proof.</text></g>
  <g fill="#536078" font-family="Arial,sans-serif" font-size="10" letter-spacing="1"><text x="288" y="571">01 / FRONT PANEL</text><text x="649" y="571">02 / BACK PANEL</text></g><path d="M621 76V546" stroke="#dce2ec" stroke-dasharray="4 5"/></svg>`;
  writeFileSync(new URL(`mori-v${version}.svg`, dir), svg);
}

// Two-page vector PDF, with a stable 600×800 point coordinate system.
const stream = (text) => `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`;
const front =
  'q 0.96 0.92 0.83 rg 0 0 600 800 re f 0.25 0.32 0.22 rg 40 45 520 710 re f 0.98 0.96 0.89 rg BT /F1 18 Tf 65 710 Td (FIELDWORK) Tj 0 -65 Td /F1 46 Tf (BERRY) Tj 0 -52 Td (GRANOLA) Tj 0 -52 Td /F1 15 Tf (A fictional packaging study) Tj ET 0.69 0.24 0.31 rg 65 210 470 260 re f 0.98 0.96 0.89 rg BT /F1 25 Tf 90 315 Td (OATS + BERRIES) Tj /F1 16 Tf 90 110 Td (350 g | DEMO ARTWORK) Tj ET Q';
const back =
  'q 0.98 0.96 0.89 rg 0 0 600 800 re f 0.25 0.32 0.22 rg BT /F1 24 Tf 60 710 Td (FIELDWORK / BACK PANEL) Tj /F1 14 Tf 0 -50 Td (Fictional M1-M2 PDF viewer fixture) Tj 0 -70 Td (INGREDIENTS) Tj 0 -30 Td (Oats, dried berries, sugar, vegetable oil.) Tj 0 -155 Td (Contains oats.) Tj 0 -95 Td (Nutrition verification not selected in this run.) Tj 0 -60 Td (Reference specification is DRAFT.) Tj 0 -80 Td (Not for sale. Not an organizer-provided sample.) Tj ET Q';
const objects = [
  '<< /Type /Catalog /Pages 2 0 R >>',
  '<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>',
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 7 0 R >> >> /Contents 4 0 R >>',
  stream(front),
  '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 600 800] /Resources << /Font << /F1 7 0 R >> >> /Contents 6 0 R >>',
  stream(back),
  '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
];
let pdf = '%PDF-1.4\n';
const offsets = [0];
objects.forEach((o, i) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
  .slice(1)
  .map((o) => `${String(o).padStart(10, '0')} 00000 n \n`)
  .join('')}trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
writeFileSync(new URL('fieldwork-carton.pdf', dir), pdf);
const assetHashes = Object.fromEntries(
  [
    'mori-v1.svg',
    'mori-v2.svg',
    'fieldwork-carton.pdf',
    'sample-specification.html',
    'sample-checklist.html',
  ].map((name) => [
    name,
    createHash('sha256')
      .update(readFileSync(new URL(name, dir)))
      .digest('hex'),
  ]),
);
writeFileSync(
  new URL('../src/demo/asset-hashes.json', import.meta.url),
  JSON.stringify(assetHashes, null, 2) + '\n',
);
