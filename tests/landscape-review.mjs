import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const target = new URL(process.argv[2]);
if (!['https:', 'http:'].includes(target.protocol) || target.username || target.password) throw new Error('Use a public HTTP(S) lab URL');
target.pathname = target.pathname.replace(/\/+$/, '') + '/';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'artifacts', ['localhost', '127.0.0.1'].includes(target.hostname) ? 'local-landscape' : 'live-landscape');
await mkdir(output, { recursive: true });
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && existsSync(chrome) ? chrome : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const context = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
const page = await context.newPage();
const results = [];
const errors = [];
page.on('pageerror', error => errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
async function geometry() {
  return page.evaluate(() => {
    const rect = selector => {
      const { x, y, width, height, bottom, right } = document.querySelector(selector).getBoundingClientRect();
      return { x, y, width, height, bottom, right };
    };
    const canvas = rect('#canvas');
    const controls = rect('#controls');
    const targets = [...document.querySelectorAll('#controls button')].filter(button => !button.hidden).map(button => {
      const { x, y, width, height, bottom, right } = button.getBoundingClientRect();
      return { id: button.id, x, y, width, height, bottom, right };
    });
    return {
      viewport: { width: innerWidth, height: innerHeight }, canvas, controls, targets,
      noHorizontalOverflow: document.documentElement.scrollWidth <= innerWidth + 1,
      simultaneouslyVisible: canvas.y >= -1 && canvas.bottom <= innerHeight + 1 && targets.every(button => button.y >= -1 && button.bottom <= innerHeight + 1 && button.x >= -1 && button.right <= innerWidth + 1),
      minimumTouchTarget: targets.every(button => button.width >= 44 && button.height >= 44),
    };
  });
}
async function observe(mode, stage) {
  const dimensions = await geometry();
  results.push({ mode, stage, ...dimensions });
  await page.screenshot({ path: resolve(output, `${mode}-${stage}-landscape-viewport.png`) });
  if (process.argv.includes('--require-fit')) {
    assert.ok(dimensions.simultaneouslyVisible, `${mode}/${stage}: the whole arena and controls must fit together`);
    assert.ok(dimensions.minimumTouchTarget, `${mode}/${stage}: touch targets are at least 44 pixels`);
    assert.ok(dimensions.noHorizontalOverflow, `${mode}/${stage}: horizontal content fits`);
  }
}
try {
  for (const mode of ['invaders', 'runner']) {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(new URL(`play.html?game=${mode}`, target).href);
    await page.waitForFunction(() => document.querySelector('#start')?.disabled === false && document.querySelector('#title')?.textContent !== 'HTSG game');
    await observe(mode, 'ready');
    await page.locator('#start').tap();
    const beforeInput = await page.locator('#canvas').evaluate(canvas => canvas.toDataURL());
    if (mode === 'invaders') {
      const touch = await context.newCDPSession(page);
      const point = async (selector, id) => {
        const box = await page.locator(selector).boundingBox();
        return { id, x: box.x + box.width / 2, y: box.y + box.height / 2 };
      };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [await point('#right', 1), await point('#action', 2)] });
      assert.equal(await page.locator('#right').getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'true');
      await page.waitForTimeout(100);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      assert.equal(await page.locator('#right').getAttribute('aria-pressed'), 'false');
      assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
      await touch.detach();
    } else {
      await page.locator('#action').tap();
      await page.waitForTimeout(100);
      assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
    }
    assert.notEqual(await page.locator('#canvas').evaluate(canvas => canvas.toDataURL()), beforeInput, `${mode}: touch input changes the rendered game`);
    await observe(mode, 'running');
    await page.locator('#pause').tap();
    const pausedStatus = await page.locator('#status').textContent();
    assert.match(pausedStatus, /paused/i);
    await observe(mode, 'paused');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#status').textContent(), pausedStatus, `${mode}: state survives rotation to portrait`);
    assert.ok((await geometry()).noHorizontalOverflow, `${mode}: portrait remains contained`);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('#status').textContent(), pausedStatus, `${mode}: state survives rotation back to landscape`);
    await observe(mode, 'rotated');
  }
  assert.deepEqual(errors, []);
} finally {
  await browser.close();
}
const report = { generatedAt: new Date().toISOString(), url: target.href, results, errors };
await writeFile(resolve(output, 'landscape-review.json'), JSON.stringify(report, null, 2));
for (const result of results) console.log(`${result.simultaneouslyVisible && result.minimumTouchTarget && result.noHorizontalOverflow ? 'PASS' : 'FAIL'} ${result.mode} ${result.stage}: arena ${Math.round(result.canvas.width)} × ${Math.round(result.canvas.height)}, full arena and touch controls visible=${result.simultaneouslyVisible}`);
console.log(`Browser errors: ${errors.length}. Report: ${resolve(output, 'landscape-review.json')}`);
if (process.argv.includes('--require-fit') && results.some(result => !result.simultaneouslyVisible)) process.exitCode = 1;
