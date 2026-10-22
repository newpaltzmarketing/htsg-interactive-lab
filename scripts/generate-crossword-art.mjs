import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { chromium } from 'playwright';

// Original editable illustration and campaign layout. Development tooling only.
const root = resolve(import.meta.dirname, '..'), asset = name => resolve(root, 'public/assets', name);
const grid = Array.from({ length: 25 }, (_, index) => {
  const row = Math.floor(index / 5), col = index % 5, x = 183 + col * 70, y = 95 + row * 70;
  const number = row === 0 ? col + 1 : col === 0 ? row + 5 : null;
  return `<rect x="${x}" y="${y}" width="70" height="70" fill="${row === 2 ? '#ffdd99' : '#fffdf7'}" stroke="#21354b" stroke-width="2"/>${number ? `<text x="${x + 7}" y="${y + 17}" font-size="13" fill="#43556a">${number}</text>` : ''}${row === 2 ? `<text x="${x + 35}" y="${y + 50}" text-anchor="middle" font-weight="650" font-size="40" fill="#152c44">${'IDEAS'[col]}</text>` : ''}`;
}).join('');
const illustration = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600"><defs><linearGradient id="desk" x2="1" y2="1"><stop stop-color="#172d45"/><stop offset="1" stop-color="#0b1c2b"/></linearGradient><filter id="shadow" x="-.3" y="-.3" width="1.6" height="1.7"><feDropShadow dx="0" dy="15" stdDeviation="17" flood-opacity=".25"/></filter></defs><rect width="960" height="600" fill="url(#desk)"/><g transform="rotate(-6 380 295)" filter="url(#shadow)"><rect x="145" y="56" width="428" height="450" rx="13" fill="#f3efe5"/><g font-family="Arial,sans-serif">${grid}</g><path d="M185 472h110" stroke="#ef923e" stroke-width="6" stroke-linecap="round"/></g><g transform="rotate(11 722 300)" filter="url(#shadow)"><rect x="635" y="183" width="184" height="210" rx="8" fill="#fff1c8"/><path d="M660 220h95M660 249h127M660 278h105M660 307h120M660 336h82" stroke="#9a855f" stroke-width="5" stroke-linecap="round" opacity=".5"/><path d="m653 365 10 10 21-24" fill="none" stroke="#348475" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g><g transform="rotate(29 637 453)"><rect x="624" y="352" width="24" height="190" rx="5" fill="#ef923e"/><path d="m624 537 12 29 12-29" fill="#f1d3a1"/><path d="m632 557 4 9 4-9" fill="#172d45"/><path d="M636 365v164" stroke="#ffc57a" stroke-width="5"/><rect x="624" y="352" width="24" height="23" rx="5" fill="#e8ded2"/></g><g filter="url(#shadow)"><circle cx="763" cy="85" r="53" fill="#dbe5e9"/><circle cx="763" cy="85" r="39" fill="#f9fbfa"/><circle cx="763" cy="85" r="31" fill="#9c6240"/><path d="M808 77c34-11 38 29 5 29" stroke="#dbe5e9" stroke-width="11" fill="none"/></g></svg>`;
await writeFile(asset('crossword-break-20261022.svg'), illustration);
const browser = await chromium.launch({ headless: true, executablePath: process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined });
const artPage = await browser.newPage({ viewport: { width: 960, height: 600 } });
await artPage.setContent(`<html><body style="margin:0;width:960px;height:600px;overflow:hidden">${illustration}</body></html>`);
await artPage.screenshot({ path: asset('crossword-break-20261022.png') });
await artPage.close();
const embedded = async (name, mime) => `data:${mime};base64,${(await readFile(asset(name))).toString('base64')}`;
const scenes = [
  ['invaders-orbital-agency-20261018.webp', 'image/webp', 'Agency Invaders'],
  ['runner-world.webp', 'image/webp', 'Launch Runner'],
  ['trivia-world.webp', 'image/webp', 'Trivia Challenge'],
  ['crossword-break-20261022.png', 'image/png', 'Crossword Break'],
];
const logo = await embedded('htsg-logo.png', 'image/png'), halo = await embedded('halo-runner-idle.png', 'image/png');
const tiles = [];
for (const [index, [file, mime, label]] of scenes.entries()) {
  const x = 54 + index * 278;
  const subject = index === 0 ? `<g transform="translate(${x + 130} 424)"><path d="M-20 25v59l12-23 8-39M20 25v59L8 61 0 22" fill="#f6aa48"/><path d="M0-72C-12-40-24-15-54 32l9 12 34-19h22l34 19 9-12C24-15 12-40 0-72Z" fill="#efa252" stroke="#fbe5b9" stroke-width="3"/><path d="M0-48c13 16 15 29 10 38H-10C-15-19-13-32 0-48Z" fill="#213d52" stroke="#c6f1ff" stroke-width="3"/><path d="M0-115v-30M-13-103v-23M13-103v-23" stroke="#fff0ba" stroke-width="4"/></g>` : index === 1 ? `<image x="${x + 62}" y="302" width="134" height="191" href="${halo}"/>` : index === 2 ? `<g transform="translate(${x + 76} 337)"><rect width="110" height="151" rx="14" fill="#0d2232e8" stroke="#c4e6f0"/><text x="55" y="87" text-anchor="middle" font-size="79" font-weight="700" fill="white">?</text><path d="M23 115h64M23 132h40" stroke="#efa252" stroke-width="7" stroke-linecap="round"/></g>` : '';
  tiles.push(`<g clip-path="url(#tile${index})"><image x="${x}" y="274" width="260" height="288" preserveAspectRatio="xMidYMid slice" href="${await embedded(file, mime)}"/><rect x="${x}" y="274" width="260" height="288" fill="url(#shade)"/>${subject}</g><text x="${x + 14}" y="536" fill="white" font-size="25" font-weight="650">${label}</text>`);
}
const cover = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><title>HTSG Gamification Labs</title><desc>Agency Invaders, Launch Runner, Trivia Challenge and Crossword Break.</desc><defs><linearGradient id="shade" x2="0" y2="1"><stop offset=".5" stop-color="#07121c" stop-opacity="0"/><stop offset="1" stop-color="#07121c" stop-opacity=".96"/></linearGradient>${scenes.map((_, i) => `<clipPath id="tile${i}"><rect x="${54 + i * 278}" y="274" width="260" height="288" rx="14"/></clipPath>`).join('')}</defs><rect width="1200" height="630" fill="white"/><image x="54" y="48" width="660" height="54" preserveAspectRatio="xMinYMid meet" href="${logo}"/><g font-family="Segoe UI,Arial,sans-serif"><text x="50" y="218" font-size="94" font-weight="750" letter-spacing="-5" fill="#111">Gamification Labs<tspan fill="#f43618">.</tspan></text>${tiles.join('')}</g><path d="M54 595h1092" stroke="#f43618" stroke-width="7"/></svg>`;
await writeFile(asset('lab-share-20261022.svg'), cover);
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(`<html><body style="margin:0;width:1200px;height:630px;overflow:hidden">${cover}</body></html>`);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.querySelectorAll('image')].map(node => new Promise((done, reject) => { const img = new Image(); img.onload = done; img.onerror = reject; img.src = node.getAttribute('href'); }))); });
  await page.screenshot({ path: asset('lab-share-20261022.jpg'), type: 'jpeg', quality: 88 });
} finally { await browser.close(); }
const fingerprint = async name => { const bytes = await readFile(asset(name)); return { path: `public/assets/${name}`, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') }; };
const path = resolve(root, 'artwork/provenance.json'), provenance = JSON.parse(await readFile(path, 'utf8'));
if (!provenance.share_card?.outputs?.some(x => x.path.endsWith('lab-share-20261022.jpg'))) provenance.share_card_history = [...(provenance.share_card_history || []), provenance.share_card];
provenance.share_card = { method: 'Original editable SVG desk crossword illustration and four-game composition from approved local assets, rendered by Chromium. The crossword illustration is representative art, not a solved game screenshot.', generator: 'scripts/generate-crossword-art.mjs', dimensions: [1200, 630], inputs: await Promise.all(['htsg-logo.png', 'halo-runner-idle.png', ...scenes.slice(0, 3).map(x => x[0])].map(fingerprint)), outputs: await Promise.all(['crossword-break-20261022.svg', 'crossword-break-20261022.png', 'lab-share-20261022.svg', 'lab-share-20261022.jpg'].map(fingerprint)) };
await writeFile(path, JSON.stringify(provenance, null, 2) + '\n');
console.log('Created original crossword illustration and versioned four-game cover; retained previous artwork.');
