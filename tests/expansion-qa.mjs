import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const args = process.argv.slice(2), option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const output = resolve(option('--output', '../output/agency-invaders-expansion-2026-10-18/evidence/source'));
await mkdir(output, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = args.includes('--url') ? null : createServer(async (req, res) => {
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path === '/community/session/') { res.setHeader('Content-Type', 'application/json'); return res.end('{"enabled":false,"authenticated":false}'); }
    assert.ok(/^\/[\w/.-]*$/.test(path) && !path.includes('..'));
    const file = resolve('public', '.' + (path === '/' ? '/index.html' : path));
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream'); res.end(await readFile(file));
  } catch { res.writeHead(404).end(); }
});
if (server) await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = option('--url', server ? `http://127.0.0.1:${server.address().port}` : '').replace(/\/$/, '');
const browser = await chromium.launch({ headless: true, executablePath: process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined });
const results = [], errors = [];
async function check(name, fn) { try { await fn(); results.push({ name, passed: true }); console.log('PASS ' + name); } catch (error) { results.push({ name, passed: false, error: error.message }); console.log('FAIL ' + name + ': ' + error.message); } }
async function open(viewport, blocked = false) {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 900, isMobile: viewport.width < 600 });
  if (blocked) await context.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } }));
  await context.route('**/game-renderer.js*', async route => {
    const url = new URL(route.request().url()); if (url.searchParams.has('original')) return route.continue(); url.searchParams.set('original', '1');
    await route.fulfill({ contentType: 'text/javascript', body: `import * as o from ${JSON.stringify(url.href)};export * from ${JSON.stringify(url.href)};export function createRenderer(...args){const r=o.createRenderer(...args);return {loadImages:r.loadImages.bind(r),get imagesReady(){return r.imagesReady;},render(ctx,state,options){window.__expansion=state;window.__appearance=options.shipAppearance;const before=JSON.stringify(state);const result=r.render(ctx,state,options);if(before!==JSON.stringify(state))console.error('Renderer changed simulation');return result;}};}` });
  });
  const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(`${base}/play.html?game=invaders`); await page.waitForFunction(() => document.documentElement.dataset.artwork === 'ready');
  return { context, page };
}
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) await check(`${viewport.width}px hangar, saved appearance, pause and support controls`, async () => {
    const { context, page } = await open(viewport);
    try {
      await page.locator('#open-hangar').click(); await page.locator('#control-panel').waitFor({ state: 'visible' });
      assert.equal(await page.locator('#weapon-choice').isVisible(), false);
      assert.equal(await page.locator('#control-panel-title').innerText(), 'Your ship');
      assert.equal(await page.evaluate(() => window.__expansion), undefined);
      for (const id of ['ship-studio', 'ship-relay', 'ship-fixer', 'paint-blue', 'paint-teal', 'paint-violet', 'paint-white', 'paint-graphite', 'paint-orange']) {
        await page.locator('#' + id).click(); const box = await page.locator('#' + id).boundingBox(); assert.ok(box.width >= 44 && box.height >= 44);
        assert.equal(await page.locator('#' + id).getAttribute('aria-pressed'), 'true');
        assert.equal(await page.locator('#' + id).evaluate(n => getComputedStyle(n).borderTopWidth), '2px', 'selected appearance has a visible active border');
      }
      await page.locator('#paint-teal').click(); await page.locator('#ship-fixer').click();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.screenshot({ path: resolve(output, `hangar-${viewport.width}.png`) });
      await page.keyboard.press('Escape'); assert.equal(await page.locator('#open-hangar').evaluate(n => n === document.activeElement), true);
      await page.reload(); await page.waitForFunction(() => document.documentElement.dataset.artwork === 'ready');
      await page.locator('#open-hangar').click(); assert.equal(await page.locator('#ship-summary').innerText(), 'Fixer · Teal');
      await page.locator('#panel-resume').click(); await page.locator('#overlay-action').click(); await page.waitForFunction(() => window.__expansion?.elapsed > 0);
      await page.locator('#pause').click(); const before = await page.evaluate(() => JSON.stringify(window.__expansion)); const arena = await page.locator('#canvas').boundingBox();
      await page.locator('#ship-hangar summary').click(); await page.locator('#ship-relay').click(); await page.locator('#paint-violet').click();
      assert.equal(await page.evaluate(() => JSON.stringify(window.__expansion)), before, 'cosmetics preserve the entire simulation');
      assert.deepEqual(await page.locator('#canvas').boundingBox(), arena, 'hangar does not shrink arena');
      await page.locator('#support-relay').click(); const after = await page.evaluate(() => structuredClone(window.__expansion));
      assert.equal(after.supportFamily, 'relay'); const original = JSON.parse(before); original.supportFamily = 'relay'; assert.deepEqual(after, original);
      assert.match(await page.locator('#panel-support-note').innerText(), /after wave 2/);
      await page.locator('#ship-hangar summary').click();
      for (let n = 0; n < 28; n++) { await page.keyboard.press('Tab'); assert.equal(await page.locator('#control-panel').evaluate(el => el.contains(document.activeElement)), true); }
      await page.locator('#panel-resume').click(); await page.waitForFunction(time => window.__expansion.elapsed > time, after.elapsed);
      if (viewport.width === 390) {
        const box = await page.locator('#canvas').boundingBox(); const x = box.x + box.width * .55, y = box.y + box.height * .72;
        const touch = await context.newCDPSession(page);
        await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 8 }] });
        await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 50, y: y - 80, id: 8 }] });
        await page.waitForTimeout(120); await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      }
      await page.locator('#pause').click(); await page.screenshot({ path: resolve(output, `controls-${viewport.width}.png`) });
    } finally { await context.close(); }
  });
  await check('blocked storage keeps selections playable with accurate feedback', async () => {
    const { context, page } = await open({ width: 390, height: 844 }, true);
    try { await page.locator('#open-hangar').click(); await page.locator('#ship-fixer').click(); await page.locator('#paint-blue').click(); assert.match(await page.locator('#ship-storage-note').innerText(), /this visit/); await page.locator('#panel-resume').click(); await page.locator('#overlay-action').click(); await page.waitForFunction(() => window.__expansion?.elapsed > 0); assert.deepEqual(await page.evaluate(() => window.__appearance), { style: 'fixer', color: 'blue' }); } finally { await context.close(); }
  });
  await check('no browser runtime errors', async () => assert.deepEqual(errors, []));
} finally { await browser.close(); if (server) await new Promise(done => server.close(done)); await writeFile(resolve(output, 'report.json'), JSON.stringify({ base, results, errors }, null, 2) + '\n'); }
if (results.some(result => !result.passed)) process.exitCode = 1;
