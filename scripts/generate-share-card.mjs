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
const halo = await embedded('halo-runner-idle.png', 'image/png');
const scenes = [
  { file: 'invaders-orbital-agency-20261018.webp', label: 'Agency Invaders' },
  { file: 'runner-world.webp', label: 'Launch Runner' },
  { file: 'trivia-world.webp', label: 'Trivia Challenge' },
];
const tiles = [];
for (const [index, scene] of scenes.entries()) {
  const x = 64 + index * 363;
  const image = await embedded(scene.file, 'image/webp');
  // Keep the campaign editable in its native SVG layout and reuse approved art.
  const subject = index === 0 ? `<g transform="translate(237 414) scale(1.22)" stroke-linejoin="round">
    <path d="M-24 28l-7 48 7 21 7-21-7-48M24 28l-7 48 7 21 7-21-7-48" fill="url(#flame)"/>
    <path d="M0-27C-12-18-29 7-49 26l6 13 33-13 10-11 10 11 33 13 6-13C29 7 12-18 0-27Z" fill="url(#metal)" stroke="#102431" stroke-width="2"/>
    <path d="M-16-2l-24 29 11-3 16-16M16-2l24 29-11-3-16-16" fill="#f78c1a"/>
    <rect x="-32" y="-9" width="16" height="43" rx="7" fill="url(#metal)"/><rect x="16" y="-9" width="16" height="43" rx="7" fill="url(#metal)"/>
    <path d="M0-55C10-43 21-3 17 26L8 38H-8L-17 26C-21-3-10-43 0-55Z" fill="url(#hull)" stroke="#603116" stroke-width="1.5"/>
    <path d="M0-36C8-24 10-11 8-3H-8C-10-11-8-24 0-36Z" fill="#122d40" stroke="#ccecff" stroke-width="1.4"/>
    <path d="M0-85v-18M0-119v-14" stroke="#fff1cf" stroke-width="3"/>
  </g>` : index === 1 ? `<image x="526" y="300" width="148" height="204" preserveAspectRatio="xMidYMid meet" href="${halo}"/>` : `<g transform="translate(906 323)">
    <rect width="114" height="157" rx="14" fill="#07131be8" stroke="#c4e6f0" stroke-opacity=".45"/>
    <text x="57" y="76" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-size="68" font-weight="700" fill="#ffffff">?</text>
    <rect x="22" y="97" width="70" height="8" rx="4" fill="#f78c1a"/>
    <rect x="22" y="118" width="70" height="8" rx="4" fill="#acc0cc"/>
    <rect x="22" y="139" width="48" height="5" rx="2" fill="#6d8b9d"/>
  </g>`;
  tiles.push(`  <g clip-path="url(#tile-${index})">
    <image x="${x}" y="274" width="346" height="288" preserveAspectRatio="xMidYMid slice" href="${image}"/>
    <rect x="${x}" y="274" width="346" height="288" fill="url(#caption-shade)"/>
    ${subject}
  </g>
  <text x="${x + 20}" y="535" fill="#ffffff" font-size="26" font-weight="600">${scene.label}</text>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">HTSG Gamification Labs</title>
  <desc id="description">Three cinematic browser games: Agency Invaders, Launch Runner, and Trivia Challenge.</desc>
  <defs>
    <linearGradient id="metal"><stop stop-color="#506979"/><stop offset=".28" stop-color="#c6d6df"/><stop offset=".55" stop-color="#465e6c"/><stop offset=".78" stop-color="#afc3cf"/><stop offset="1" stop-color="#223d4d"/></linearGradient>
    <linearGradient id="hull"><stop stop-color="#a1471b"/><stop offset=".28" stop-color="#f78c1a"/><stop offset=".52" stop-color="#ffdda1"/><stop offset=".74" stop-color="#f78c1a"/><stop offset="1" stop-color="#9f421c"/></linearGradient>
    <linearGradient id="flame" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#fff7d2"/><stop offset=".35" stop-color="#ffb454"/><stop offset="1" stop-color="#f78c1a" stop-opacity="0"/></linearGradient>
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
    <text x="60" y="218" fill="#111111" font-size="94" font-weight="750" letter-spacing="-5">Gamification Labs<tspan fill="#f43618">.</tspan></text>
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
  await page.screenshot({ path: asset('lab-share-20261018.jpg'), type: 'jpeg', quality: 88 });
} finally { await browser.close(); }
const fingerprint = async name => {
  const bytes = await readFile(asset(name));
  return { path: `public/assets/${name}`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
};
const provenancePath = resolve(root, 'artwork/provenance.json');
const provenance = JSON.parse(await readFile(provenancePath, 'utf8'));
if (provenance.share_card && !provenance.share_card.outputs?.some(output => output.path.endsWith('lab-share-20261018.jpg'))) {
  provenance.share_card_history = [...(provenance.share_card_history || []), provenance.share_card];
}
provenance.share_card = {
  method: 'Editable SVG composition of the approved HTSG logo, three local environments, actual Halo still, a vector spacecraft derived from the game renderer, and a quiz symbol; rendered by Chromium at 1200 x 630.',
  generator: 'scripts/generate-share-card.mjs',
  dimensions: [1200, 630],
  inputs: await Promise.all(['htsg-logo.png', 'halo-runner-idle.png', ...scenes.map(scene => scene.file)].map(fingerprint)),
  outputs: await Promise.all(['lab-share.svg', 'lab-share.png', 'lab-share-20261018.jpg'].map(fingerprint)),
};
await writeFile(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);
console.log('Updated editable social card, 1200 x 630 PNG/JPEG, and derivative provenance.');
