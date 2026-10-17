import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { createServer as createHTTPServer } from 'node:http';
import { spawn, spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir, cp } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const external = option('--url', process.env.BASE_URL);
const staticMode = args.includes('--static');
if (external) {
  const value = new URL(external);
  if (value.protocol !== 'https:' || value.username || value.password || value.search || value.hash) throw new Error('Use an approved public HTTPS directory URL');
}
const directory = resolve(root, option('--dir', 'dist'));
const output = resolve(root, option('--output', external ? 'artifacts/share-preview-live' : 'artifacts/share-preview-source'));
await mkdir(output, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const decode = value => value.replace(/&(?:amp|quot|apos|lt|gt|#39|#\d+|#x[\da-f]+);/gi, entity => {
  const named = { '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>' };
  return named[entity.toLowerCase()] ?? String.fromCodePoint(entity[2].toLowerCase() === 'x' ? parseInt(entity.slice(3, -1), 16) : parseInt(entity.slice(2, -1), 10));
});
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)].map(match => [match[1].toLowerCase(), decode(match[2] ?? match[3] ?? match[4])]));
}
function parse(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
  assert.ok(head, 'Sharing fields must be in the initial HTML head');
  const metadata = new Map();
  const links = new Map();
  for (const [expression, target, key] of [[/<meta\b[^>]*>/gi, metadata, 'meta'], [/<link\b[^>]*>/gi, links, 'link']]) {
    for (const match of head.matchAll(expression)) {
      const values = attributes(match[0]);
      const name = key === 'meta' ? values.property || values.name : values.rel;
      if (name) target.set(name, [...(target.get(name) || []), key === 'meta' ? values.content : values.href]);
    }
  }
  return { metadata, links, title: decode(head.match(/<title>([^<]*)<\/title>/i)?.[1] || '') };
}
function single(map, key) {
  assert.equal(map.get(key)?.length, 1, `Exactly one ${key} field is required`);
  const value = map.get(key)[0];
  assert.ok(typeof value === 'string' && value.trim(), `${key} cannot be empty`);
  return value;
}
const builtIndex = parse(await readFile(resolve(directory, 'index.html'), 'utf8'));
const advertisedBase = single(builtIndex.links, 'canonical');
const site = new URL(advertisedBase);
assert.equal(site.protocol, 'https:');
assert.equal(site.search + site.hash, '');
assert.ok(site.pathname.endsWith('/'));
const cover = single(builtIndex.metadata, 'og:image');
const coverURL = new URL(cover);
assert.equal(coverURL.origin, site.origin);
assert.ok(coverURL.pathname.startsWith(`${site.pathname}assets/`));
assert.match(coverURL.pathname, /lab-share-\d{8}\.(?:jpe?g|png)$/i, 'A new cover uses a dated URL to avoid stale image bytes');
const cases = [
  { path: '', title: 'Interactive Lab', canonical: advertisedBase },
  { path: 'index.html', title: 'Interactive Lab', canonical: advertisedBase },
  ...[['invaders', 'Agency Invaders'], ['runner', 'Launch Runner'], ['trivia', 'Trivia Challenge']].map(([mode, title]) => ({ path: `play.html?game=${mode}`, title, canonical: new URL(`play.html?game=${mode}`, advertisedBase).href })),
];
const agents = {
  anonymous: 'Mozilla/5.0 HTSG-ReadOnly-Sharing-QA',
  facebook: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  twitter: 'Twitterbot/1.0',
};
const results = [], responses = [], errors = [];
let server, staticServer, browser, baseURL;
let serverLog = '';
async function check(name, action) {
  try { await action(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, message: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}
function validate(html, expected, expectedCover = cover) {
  const parsed = parse(html), meta = parsed.metadata;
  for (const name of ['description', 'og:title', 'og:description', 'og:type', 'og:site_name', 'og:url', 'og:image', 'og:image:secure_url', 'og:image:type', 'og:image:width', 'og:image:height', 'og:image:alt', 'twitter:card', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) single(meta, name);
  assert.ok(parsed.title.includes(expected.title));
  assert.ok(single(meta, 'og:title').includes(expected.title));
  assert.equal(single(meta, 'og:type'), 'website');
  assert.equal(single(meta, 'og:url'), expected.canonical);
  assert.equal(single(parsed.links, 'canonical'), expected.canonical);
  assert.equal(single(parsed.links, 'image_src'), expectedCover);
  assert.equal(single(meta, 'og:image'), expectedCover);
  assert.equal(single(meta, 'og:image:secure_url'), expectedCover);
  assert.equal(single(meta, 'twitter:image'), expectedCover);
  for (const value of [expected.canonical, expectedCover]) assert.equal(new URL(value).protocol, 'https:');
  assert.equal(single(meta, 'twitter:title'), single(meta, 'og:title'));
  assert.equal(single(meta, 'twitter:description'), single(meta, 'og:description'));
  assert.equal(single(meta, 'twitter:image:alt'), single(meta, 'og:image:alt'));
  assert.equal(single(meta, 'twitter:card'), 'summary_large_image');
  assert.equal(single(meta, 'og:image:width'), '1200');
  assert.equal(single(meta, 'og:image:height'), '630');
  assert.ok(/image\/(jpeg|png)/.test(single(meta, 'og:image:type')));
  return parsed;
}
async function startStaticFixture() {
  const manifest = JSON.parse(await readFile(resolve(directory, 'build-manifest.json'), 'utf8'));
  const mime = { html: 'text/html; charset=utf-8', js: 'text/javascript', css: 'text/css', jpeg: 'image/jpeg', jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', svg: 'image/svg+xml', json: 'application/json' };
  staticServer = createHTTPServer(async (request, response) => {
    try {
      const path = new URL(request.url, 'http://localhost').pathname;
      assert.ok(path.startsWith(site.pathname));
      const relative = path.slice(site.pathname.length) || 'index.html';
      assert.ok(manifest[relative]);
      const bytes = await readFile(resolve(directory, relative));
      response.writeHead(200, { 'Content-Type': mime[relative.split('.').at(-1)] || 'application/octet-stream', 'Content-Length': bytes.length });
      response.end(request.method === 'HEAD' ? undefined : bytes);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(done => staticServer.listen(0, '127.0.0.1', done));
  return `http://127.0.0.1:${staticServer.address().port}${site.pathname}`;
}
async function startFixture() {
  const phpCandidates = [process.env.PHP_PATH, process.platform === 'win32' ? resolve(root, '../custom-pools-showcase/growth-release/tools/php/php.exe') : 'php', 'php'].filter(Boolean);
  const php = phpCandidates.find(candidate => spawnSync(candidate, ['-v'], { windowsHide: true, encoding: 'utf8' }).status === 0);
  if (!php) throw new Error('PHP is required for the exact local WordPress adapter fixture; set PHP_PATH or install PHP');
  const fixture = resolve(output, `fixture-${process.pid}`);
  const plugin = resolve(fixture, 'htsg-interactive-lab');
  await mkdir(plugin, { recursive: true });
  await cp(directory, resolve(plugin, 'site'), { recursive: true });
  await cp(resolve(root, 'wordpress/htsg-interactive-lab/htsg-interactive-lab.php'), resolve(plugin, 'htsg-interactive-lab.php'));
  const router = resolve(fixture, 'router.php');
  await writeFile(router, `<?php
define('ABSPATH', __DIR__ . '/');
function home_url(string $path = ''): string { return 'https://holistictechsolutionsgroup.com' . $path; }
function wp_parse_url(string $url, int $component = -1) { return parse_url($url, $component); }
function add_action(...$args): void {}
function register_activation_hook(...$args): void {}
function register_deactivation_hook(...$args): void {}
function status_header(int $status): void { http_response_code($status); }
function wp_safe_redirect(string $url, int $status = 302): void { header('Location: ' . $url, true, $status); }
function esc_attr($value): string { return htmlspecialchars((string)$value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function esc_url($value): string { return esc_attr($value); }
if (parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) === '/__qa_health') { echo 'ready'; exit; }
require __DIR__ . '/htsg-interactive-lab/htsg-interactive-lab.php';
htsg_lab_route();
http_response_code(404); echo 'Outside isolated fixture';
`);
  const reservation = createServer();
  await new Promise(done => reservation.listen(0, '127.0.0.1', done));
  const port = reservation.address().port;
  await new Promise(done => reservation.close(done));
  server = spawn(php, ['-S', `127.0.0.1:${port}`, router], { cwd: fixture, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  for (const stream of [server.stdout, server.stderr]) stream.on('data', data => { serverLog = (serverLog + data).slice(-4000); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`PHP fixture exited: ${serverLog}`);
    try { if ((await fetch(`http://127.0.0.1:${port}/__qa_health`)).ok) return `http://127.0.0.1:${port}${site.pathname}`; } catch {}
    await new Promise(done => setTimeout(done, 50));
  }
  throw new Error(`PHP fixture did not start: ${serverLog}`);
}
const normalHashes = new Map();
async function fetchHTML(path, agent) {
  const response = await fetch(new URL(path, baseURL), { headers: { 'User-Agent': agents[agent] } });
  assert.equal(response.status, 200, `${agent}: ${path}`);
  assert.match(response.headers.get('content-type') || '', /text\/html/);
  assert.ok(!/noindex|none/i.test(response.headers.get('x-robots-tag') || ''));
  const html = await response.text();
  responses.push({ kind: 'html', agent, path, status: response.status, bytes: Buffer.byteLength(html), sha256: hash(html) });
  return html;
}
function dimensions(bytes) {
  if (bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), type: 'image/png' };
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'Cover must be an actual JPEG or PNG');
  for (let offset = 2; offset < bytes.length - 9;) {
    assert.equal(bytes[offset], 0xff);
    const marker = bytes[offset + 1];
    const length = bytes.readUInt16BE(offset + 2);
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) return { width: bytes.readUInt16BE(offset + 7), height: bytes.readUInt16BE(offset + 5), type: 'image/jpeg' };
    assert.ok(length >= 2); offset += 2 + length;
  }
  throw new Error('JPEG dimensions missing');
}
try {
  baseURL = external ? external.replace(/\/+$/, '') + '/' : await (staticMode ? startStaticFixture() : startFixture());
  await check('source gallery and player always contain complete sharing metadata before JavaScript', async () => {
    const source = await readFile(resolve(root, 'public/index.html'), 'utf8');
    const fields = parse(source);
    const base = single(fields.links, 'canonical');
    const image = single(fields.metadata, 'og:image');
    validate(source, { title: 'Interactive Lab', canonical: base }, image);
    validate(await readFile(resolve(root, 'public/play.html'), 'utf8'), { title: 'Interactive Lab', canonical: new URL('play.html', base).href }, image);
  });
  await check('built static-host player has a complete generic fallback and a valid gallery canonical', async () => {
    validate(await readFile(resolve(directory, 'index.html'), 'utf8'), cases[0]);
    validate(await readFile(resolve(directory, 'play.html'), 'utf8'), { title: 'Interactive Lab', canonical: new URL('play.html', advertisedBase).href });
  });
  for (const agent of Object.keys(agents)) {
    await check(`${agent}: gallery, index alias and all three game URLs return complete raw sharing cards`, async () => {
      for (const item of cases) {
        const html = await fetchHTML(item.path, agent);
        validate(html, staticMode && item.path.startsWith('play.html') ? { title: 'Interactive Lab', canonical: new URL('play.html', advertisedBase).href } : item);
        if (agent === 'anonymous') normalHashes.set(item.path, hash(html));
        else assert.equal(hash(html), normalHashes.get(item.path), 'Crawler and anonymous responses must agree');
      }
    });
  }
  await check('missing and unknown game parameters retain the generic sharing fallback', async () => {
    for (const path of ['play.html', 'play.html?game=unknown']) validate(await fetchHTML(path, 'facebook'), { title: 'Interactive Lab', canonical: new URL('play.html', advertisedBase).href });
  });
  const imageProbe = external ? cover : new URL(coverURL.pathname.slice(site.pathname.length), baseURL).href;
  for (const agent of ['anonymous', 'facebook']) {
    await check(`${agent}: share image GET and HEAD expose the same real 1200×630 image`, async () => {
      const headers = { 'User-Agent': agents[agent] };
      const response = await fetch(imageProbe, { headers });
      assert.equal(response.status, 200);
      const bytes = Buffer.from(await response.arrayBuffer());
      const actual = dimensions(bytes);
      assert.deepEqual([actual.width, actual.height], [1200,630]);
      assert.equal(response.headers.get('content-type')?.split(';')[0], actual.type);
      assert.equal(single(builtIndex.metadata, 'og:image:type'), actual.type);
      assert.ok(bytes.length > 10000 && bytes.length < 1024 * 1024, 'Share cover stays below1MiB and contains real image data');
      const source = await readFile(resolve(root, 'public', coverURL.pathname.slice(site.pathname.length)));
      assert.equal(hash(bytes), hash(source), 'Served cover must match the reviewed image');
      const head = await fetch(imageProbe, { method: 'HEAD', headers });
      assert.equal(head.status, 200);
      assert.equal(Number(head.headers.get('content-length')), bytes.length);
      assert.equal(head.headers.get('content-type'), response.headers.get('content-type'));
      assert.equal((await head.arrayBuffer()).byteLength, 0);
      responses.push({ kind: 'image', agent, url: imageProbe, ...actual, bytes: bytes.length, sha256: hash(bytes), headStatus: head.status });
    });
  }
  const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
  const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && existsSync(chrome) ? chrome : undefined);
  browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await check('sharing metadata and image are readable with JavaScript disabled', async () => {
    const plain = await browser.newContext({ javaScriptEnabled: false });
    const page = await plain.newPage();
    await page.goto(new URL('play.html?game=runner', baseURL).href);
    assert.ok((await page.title()).includes(staticMode ? 'Interactive Lab' : 'Launch Runner'));
    assert.equal(await page.locator('meta[property="og:image"]').getAttribute('content'), cover);
    await page.goto(imageProbe);
    await page.locator('img').waitFor();
    assert.equal(await page.locator('img').evaluate(node => node.complete && node.naturalWidth === 1200 && node.naturalHeight === 630), true);
    await plain.close();
  });
  await check('reviewed cover renders at phone card sizes and in a square-crop stress test', async () => {
    const title = escape(single(builtIndex.metadata, 'og:title'));
    const description = escape(single(builtIndex.metadata, 'og:description'));
    for (const width of [320,390]) {
      const card = await browser.newPage({ viewport: { width, height: 520 }, deviceScaleFactor: 1 });
      await card.setContent(`<html><head><style>*{box-sizing:border-box}body{margin:0;padding:12px;background:#edf0f4;font:14px Arial,sans-serif;color:#18202a}.card{background:white;border:1px solid #d7dce3;border-radius:10px;overflow:hidden}img{display:block;width:100%;aspect-ratio:1200/630;object-fit:cover}.copy{padding:13px}.site{font-size:11px;color:#5f6874;overflow-wrap:anywhere}h1{font-size:18px;line-height:1.25;margin:7px 0}p{font-size:13px;line-height:1.4;margin:0;color:#4b5663}</style></head><body><article class="card"><img src="${escape(imageProbe)}" alt="${escape(single(builtIndex.metadata, 'og:image:alt'))}"><div class="copy"><div class="site">${escape(site.hostname.toUpperCase())}</div><h1>${title}</h1><p>${description}</p></div></article></body></html>`);
      await card.locator('img').evaluate(node => node.decode());
      await card.screenshot({ path: resolve(output, `card-preview-${width}.png`) });
      await card.close();
    }
    const square = await browser.newPage({ viewport: { width: 320, height: 320 } });
    await square.setContent(`<html><head><style>body{margin:0}img{display:block;width:320px;height:320px;object-fit:cover}</style></head><body><img src="${escape(imageProbe)}" alt="Center square crop stress test"></body></html>`);
    await square.locator('img').evaluate(node => node.decode());
    await square.screenshot({ path: resolve(output, 'square-crop-stress.png') });
    await square.close();
  });
  for (const mode of ['invaders','runner','trivia']) {
    await check(`${mode}: metadata changes preserve a brief phone gameplay flow`, async () => {
      await page.goto(new URL(`play.html?game=${mode}`, baseURL).href);
      await page.waitForFunction(() => document.documentElement.dataset.artwork === 'ready');
      if (mode === 'trivia') {
        await page.locator('#quiz .answers button').nth(1).tap();
        assert.match(await page.locator('#status').textContent(), /1 correct/);
        await page.locator('.quiz-next').tap();
        assert.match(await page.locator('.quiz-progress').textContent(), /Question 2/);
      } else {
        await page.locator('#overlay-action').tap();
        await page.locator(mode === 'invaders' ? '#action' : '#canvas').tap();
        await page.waitForTimeout(100);
        await page.locator('#pause').tap();
        assert.match(await page.locator('#status').textContent(), /paused/i);
        assert.equal(await page.locator('#arena-overlay').isVisible(), true);
      }
    });
  }
  await check('no browser exceptions or resource errors in the sharing and gameplay smoke', async () => assert.deepEqual(errors, []));
  await context.close();
} finally {
  const browserVersion = browser?.version();
  if (browser) await browser.close();
  if (server) server.kill();
  if (staticServer) await new Promise(done => staticServer.close(done));
  const generatedAt = new Date().toISOString();
  const report = JSON.stringify({ generatedAt, mode: `${external ? 'public' : 'isolated local'} ${staticMode ? 'static host' : 'exact WordPress adapter'} plus static fallback`, baseURL, advertisedBase, cover, browserVersion, results, responses, errors, limitations: 'Crawler user-agent simulation does not access platform caches. Card previews are local layout simulations, not Facebook/Twitter screenshots. Mobile is Chromium emulation; physical devices and Safari untested.' }, null, 2);
  await writeFile(resolve(output, 'results.json'), report);
  await writeFile(resolve(output, `results-${generatedAt.replaceAll(':','-').replaceAll('.','-')}.json`), report);
}
if (results.some(result => !result.passed)) process.exitCode = 1;
