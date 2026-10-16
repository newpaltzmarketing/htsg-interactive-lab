import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

// Derived, editable campaign artwork. This is development tooling only.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const asset = name => resolve(root, 'public/assets', name);
const embedded = async (name, type) => `data:${type};base64,${(await readFile(asset(name))).toString('base64')}`;
const logo = await embedded('htsg-logo.png', 'image/png');
const scenes = [
  { file: 'invaders-world.webp', label: 'Agency Invaders' },
  { file: 'runner-world.webp', label: 'Launch Runner' },
  { file: 'trivia-world.webp', label: 'Trivia Challenge' },
];
const tiles = [];
for (const [index, scene] of scenes.entries()) {
  const x = 64 + index * 363;
  const image = await embedded(scene.file, 'image/webp');
  tiles.push(`  <g clip-path="url(#tile-${index})">
    <image x="${x}" y="274" width="346" height="288" preserveAspectRatio="xMidYMid slice" href="${image}"/>
    <rect x="${x}" y="274" width="346" height="288" fill="url(#caption-shade)"/>
  </g>
  <text x="${x + 20}" y="535" fill="#ffffff" font-size="26" font-weight="600">${scene.label}</text>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">HTSG Interactive Lab</title>
  <desc id="description">Three cinematic browser games: Agency Invaders, Launch Runner, and Trivia Challenge.</desc>
  <defs>
    <linearGradient id="caption-shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05090f" stop-opacity="0"/>
      <stop offset=".52" stop-color="#05090f" stop-opacity=".08"/>
      <stop offset="1" stop-color="#05090f" stop-opacity=".94"/>
    </linearGradient>
${scenes.map((_, index) => `    <clipPath id="tile-${index}"><rect x="${64 + index * 363}" y="274" width="346" height="288" rx="14"/></clipPath>`).join('\n')}
  </defs>
  <rect width="1200" height="630" fill="#ffffff"/>
  <image x="64" y="48" width="660" height="54" preserveAspectRatio="xMinYMid meet" href="${logo}"/>
  <g font-family="Segoe UI, Arial, sans-serif">
    <text x="60" y="218" fill="#111111" font-size="94" font-weight="750" letter-spacing="-5">Interactive Lab<tspan fill="#f43618">.</tspan></text>
${tiles.join('\n')}
  </g>
  <path d="M64 595h1072" stroke="#f43618" stroke-width="7"/>
</svg>
`;
await writeFile(asset('lab-share.svg'), svg);
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && existsSync(chrome) ? chrome : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<html><head><meta charset="utf-8"></head><body style="margin:0;width:1200px;height:630px;overflow:hidden">${svg}</body></html>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.querySelectorAll('svg image')].map(image => new Promise((done, fail) => {
      const test = new Image(); test.onload = done; test.onerror = fail; test.src = image.getAttribute('href');
    })));
  });
  await page.screenshot({ path: asset('lab-share.png'), type: 'png' });
} finally { await browser.close(); }
const fingerprint = async name => {
  const bytes = await readFile(asset(name));
  return { path: `public/assets/${name}`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
};
const provenancePath = resolve(root, 'artwork/provenance.json');
const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
provenance.share_card = {
  method: 'Editable SVG composition of the approved HTSG logo and the three selected local environment WebPs; rendered by Chromium at 1200 x 630.',
  generator: 'scripts/generate-share-card.mjs',
  dimensions: [1200, 630],
  inputs: await Promise.all(['htsg-logo.png', ...scenes.map(scene => scene.file)].map(fingerprint)),
  outputs: await Promise.all(['lab-share.svg', 'lab-share.png'].map(fingerprint)),
};
await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
console.log('Updated editable social card, 1200 x 630 PNG, and derivative provenance.');
