import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const root = fileURLToPath(new URL('../', import.meta.url));
const assets = path.join(root, 'public', 'assets');
const logo = await readFile(path.join(assets, 'htsg-logo.png'));
if (logo.subarray(1, 4).toString() !== 'PNG') throw new Error('The supplied logo must remain a PNG.');
const logoWidth = logo.readUInt32BE(16);
const logoHeight = logo.readUInt32BE(20);
const css = await readFile(path.join(root, 'public', 'brand.css'), 'utf8');
const color = (token, fallback) => css.match(new RegExp(`${token}\\s*:\\s*([^;\\n]+)`))?.[1].trim() || fallback;
const fire = color('--brand-fire', '#f43618');
const amber = color('--brand-amber', '#f78c1a');
const ink = '#111111';
const logoData = `data:image/png;base64,${logo.toString('base64')}`;
const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description">
  <title id="title">HTSG Interactive Lab</title>
  <desc id="description">Three playable games: Agency Invaders, Launch Runner, and Trivia Challenge.</desc>
  <defs>
    <pattern id="grid" width="44" height="44" patternUnits="userSpaceOnUse"><path d="M44 0H0V44" fill="none" stroke="#303030" stroke-width="1"/></pattern>
  </defs>
  <rect width="1200" height="630" fill="#ffffff"/>
  <image x="64" y="52" width="600" height="56" preserveAspectRatio="xMinYMid meet" href="${logoData}"/>
  <g fill="${ink}" font-family="Segoe UI, Arial, sans-serif" font-weight="800" letter-spacing="-6">
    <text x="64" y="282" font-size="120">Interactive</text>
    <text x="64" y="407" font-size="120">Lab<tspan fill="${fire}">.</tspan></text>
  </g>
  <g transform="translate(818 156)">
    <rect width="318" height="284" fill="${ink}"/>
    <rect width="318" height="284" fill="url(#grid)"/>
    <g fill="${fire}">
      <path d="M36 39h56v35H36z M131 39h56v35h-56z M226 39h56v35h-56z"/>
      <path d="M83 105h56v35H83z M178 105h56v35h-56z"/>
    </g>
    <g fill="${ink}">
      <path d="M45 48h10v6H45z M73 48h10v6H73z M140 48h10v6h-10z M168 48h10v6h-10z M235 48h10v6h-10z M263 48h10v6h-10z"/>
      <path d="M92 114h10v6H92z M120 114h10v6h-10z M187 114h10v6h-10z M215 114h10v6h-10z"/>
    </g>
    <g fill="#ffffff"><rect x="156" y="151" width="6" height="19"/><rect x="156" y="186" width="6" height="19"/></g>
    <path d="M159 220l-25 47 17-8h16l17 8z" fill="${amber}"/>
    <rect x="156" y="237" width="6" height="13" fill="#ffffff"/>
  </g>
  <path d="M64 481h1072" stroke="${ink}" stroke-width="2"/>
  <g fill="${ink}" font-family="Segoe UI, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="-.5">
    <text x="64" y="541">Agency Invaders</text>
    <text x="438" y="541">Launch Runner</text>
    <text x="809" y="541">Trivia Challenge</text>
  </g>
  <path d="M64 577h1072" stroke="${fire}" stroke-width="8"/>
</svg>`;

await writeFile(path.join(assets, 'lab-share.svg'), svg);
const candidates = [
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  chromium.executablePath(),
].filter(Boolean);
let executablePath;
for (const candidate of candidates) {
  try { await access(candidate); executablePath = candidate; break; } catch { /* Try the next installed browser. */ }
}
if (!executablePath) throw new Error('Install Chrome or set PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH to render the PNG.');
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:1200px;height:630px;overflow:hidden}svg{display:block}</style></head><body>${svg}</body></html>`);
  await page.evaluate(async data => {
    const image = new Image();
    image.src = data;
    await image.decode();
    await document.fonts.ready;
  }, logoData);
  await page.screenshot({ path: path.join(assets, 'lab-share.png') });
} finally {
  await browser.close();
}
console.log(`Created 1200×630 social SVG and PNG. Logo intrinsic size: ${logoWidth}×${logoHeight} (${(logoWidth / logoHeight).toFixed(4)}:1).`);
