import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { questionsForRound } from '../public/questions.js';
import { arenaFor } from '../public/game-engine.js';
import { runnerCameraOffset } from '../public/game-renderer.js';

const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = resolve(root, option('--dir', 'public'));
const requested = option('--url', process.env.BASE_URL);
let external;
if (requested) {
  const url = new URL(requested);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Use a public HTTP(S) directory URL');
  external = url.href.replace(/\/+$/, '');
}
const output = resolve(root, 'artifacts', external && !['localhost', '127.0.0.1'].includes(new URL(external).hostname) ? 'upgrade-live' : 'upgrade-qa');
await mkdir(output, { recursive: true });
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.json': 'application/json' };
const headers = {};
for (const line of (await readFile(resolve(directory, '_headers'), 'utf8')).split(/\r?\n/)) {
  const match = line.match(/^\s+([^:]+):\s*(.+)$/);
  if (match) headers[match[1]] = match[2];
}
const server = external ? null : createServer(async (request, response) => {
  for (const [name, value] of Object.entries(headers)) response.setHeader(name, value);
  try {
    const url = new URL(request.url, 'http://localhost');
    const target = resolve(directory, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`);
    if (!target.startsWith(directory + sep)) throw new Error('Outside fixture');
    if (!(await stat(target)).isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': mime[extname(target)] || 'application/octet-stream' });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
  }
});
if (server) await new Promise(done => server.listen(0, '127.0.0.1', done));
const baseURL = external || `http://127.0.0.1:${server.address().port}`;
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && existsSync(chrome) ? chrome : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [];
const errors = [];
const geometry = [];
const patterns = args.flatMap((arg, index, all) => arg === '--match' ? [all[index + 1]] : []);
const filter = patterns.join('|');

async function check(name, action) {
  if (filter && !new RegExp(filter).test(name) && name !== 'no upgrade browser exceptions or renderer mutations') return;
  try { await action(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, message: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}

async function contextFor(viewport, { fallback = false } = {}) {
  const mobile = viewport.width < 600 || viewport.height < 500;
  const context = await browser.newContext({ viewport, screen: viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
  await context.addInitScript(({ fallback }) => {
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set();
    window.__qaFrames = { pending };
    window.requestAnimationFrame = callback => {
      const id = request(time => { pending.delete(id); callback(time); });
      pending.add(id);
      return id;
    };
    window.cancelAnimationFrame = id => { pending.delete(id); cancel(id); };
    if (fallback) Element.prototype.requestFullscreen = () => Promise.reject(new DOMException('Simulated unsupported fullscreen', 'NotSupportedError'));
  }, { fallback });
  // Client-only observation keeps production code free of test globals. The
  // actual renderer executes unchanged and still supplies all screenshots.
  await context.route('**/game-renderer.js*', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.has('qa-original')) return route.continue();
    url.searchParams.set('qa-original', '1');
    const original = JSON.stringify(url.href);
    await route.fulfill({ contentType: 'text/javascript', body: `
      import * as source from ${original};
      export * from ${original};
      export function createRenderer(...args) {
        const renderer = source.createRenderer(...args);
        const originalRender = renderer.render;
        return {
          render(ctx, state, options) {
            const before = state ? JSON.stringify(state) : null;
            if (state) window.__qaState = JSON.parse(before);
            const result = originalRender.call(renderer, ctx, state, options);
            if (state && JSON.stringify(state) !== before) console.error('Renderer mutated game state');
            return result;
          },
          loadImages: renderer.loadImages.bind(renderer),
          get imagesReady() { return renderer.imagesReady; },
        };
      }
    ` });
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push({ url: page.url(), message: error.message }));
  page.on('console', message => { if (message.type() === 'error') errors.push({ url: page.url(), message: message.text() }); });
  return { context, page, mobile };
}

async function open(page, mode) {
  await page.goto(`${baseURL}/play.html?game=${mode}`);
  await page.waitForFunction(() => document.documentElement.dataset.artwork === 'ready');
  await page.locator('#game-shell').waitFor();
}
async function snapshot(page) { return page.evaluate(() => window.__qaState); }
async function capture(page, name) { await page.screenshot({ path: resolve(output, `${name}.png`) }); }
async function bounds(page) {
  return page.evaluate(() => {
    const rect = node => { const { x, y, width, height, bottom, right } = node.getBoundingClientRect(); return { x, y, width, height, bottom, right }; };
    const canvas = rect(document.getElementById('canvas'));
    const shell = rect(document.getElementById('game-shell'));
    const targets = [...document.querySelectorAll('#controls button, #fullscreen, #help-toggle, #overlay-action, #previous-game, #next-game, #game-picker > summary')]
      .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden')
      .map(node => {
        const dimensions = rect(node);
        const hit = document.elementFromPoint(dimensions.x + dimensions.width / 2, dimensions.y + dimensions.height / 2);
        return { id: node.id || node.tagName, ...dimensions, disabled: Boolean(node.disabled), hittable: Boolean(hit && node.contains(hit)) };
      });
    return { viewport: { width: innerWidth, height: innerHeight }, canvas, shell, targets, overflow: document.documentElement.scrollWidth > innerWidth + 1 };
  });
}
function assertFits(value, { portrait = false } = {}) {
  assert.equal(value.overflow, false);
  assert.ok(value.canvas.width > 0 && value.canvas.height > 0);
  assert.ok(value.canvas.y >= -1 && value.canvas.bottom <= value.viewport.height + 1, `Canvas clipped: ${JSON.stringify(value.canvas)}`);
  for (const target of value.targets) {
    assert.ok(target.x >= -1 && target.y >= -1 && target.right <= value.viewport.width + 1 && target.bottom <= value.viewport.height + 1, `${target.id} is outside the viewport`);
    assert.ok(target.width >= 44 && target.height >= 44, `${target.id} is smaller than a 44px touch target`);
    assert.ok(target.disabled || target.hittable, `${target.id} is covered by another element`);
  }
  if (portrait) assert.ok(value.canvas.height >= value.viewport.height * 0.5, `Portrait arena remains a short strip: ${value.canvas.height}/${value.viewport.height}`);
}

try {
  for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 844, height: 390 }, { width: 1280, height: 900 }, { width: 1440, height: 900 }]) {
    const { context, page } = await contextFor(viewport);
    await check(`${viewport.width}px cinematic games use the screen and expose every essential control`, async () => {
      for (const mode of ['invaders', 'runner']) {
        await open(page, mode);
        const ready = await bounds(page);
        geometry.push({ mode, stage: 'ready', ...ready });
        await capture(page, `${mode}-ready-${viewport.width}`);
        assertFits(ready, { portrait: viewport.width < 600 });
        assert.equal(await page.locator('#arena-overlay').isVisible(), true);
        await page.locator('#overlay-action').click();
        assert.equal(await page.locator('#arena-overlay').isVisible(), false);
        assert.equal(await page.locator('#canvas').evaluate(element => element === document.activeElement), true);
        if (mode === 'invaders') {
          await page.keyboard.down('Space');
          await page.waitForTimeout(2300);
          await page.keyboard.up('Space');
        } else {
          await page.waitForTimeout(2400);
          await page.locator('#action').click();
          await page.waitForTimeout(160);
        }
        assertFits(await bounds(page), { portrait: viewport.width < 600 });
        await capture(page, `${mode}-running-${viewport.width}`);
        await page.locator('#pause').click();
        assert.match(await page.locator('#status').textContent(), /paused/i);
        assert.equal(await page.locator('#arena-overlay').isVisible(), true);
      }
    });
    await check(`${viewport.width}px trivia text and answers remain readable and keyboard accessible`, async () => {
      await open(page, 'trivia');
      const details = await page.locator('#quiz').evaluate(quiz => ({
        width: quiz.getBoundingClientRect().width,
        questionSize: parseFloat(getComputedStyle(quiz.querySelector('h2')).fontSize),
        answers: [...quiz.querySelectorAll('.answers button')].map(button => ({ fontSize: parseFloat(getComputedStyle(button).fontSize), height: button.getBoundingClientRect().height, clipped: button.scrollHeight > button.clientHeight + 1 && getComputedStyle(button).overflowY === 'hidden' })),
      }));
      await capture(page, `trivia-ready-${viewport.width}`);
      assert.ok(details.questionSize >= 18);
      assert.ok(details.answers.every(answer => answer.fontSize >= 16 && answer.height >= 44 && !answer.clipped), JSON.stringify(details));
      assert.ok(details.width <= viewport.width);
      await page.locator('#quiz .answers button').first().focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.quiz-next').evaluate(element => element === document.activeElement), true);
      await capture(page, `trivia-answer-${viewport.width}`);
    });
    errors.push(...await page.evaluate(() => (window.__qaRendererMutations || []).map(message => ({ message }))));
    await context.close();
  }

  const { context, page } = await contextFor({ width: 390, height: 844 });
  const touch = await context.newCDPSession(page);
  await check('direct touch drag steers the ship, clamps both edges and releases on cancel', async () => {
    await open(page, 'invaders');
    await page.locator('#overlay-action').tap();
    const arena = await page.locator('#canvas').boundingBox();
    const center = { id: 1, x: arena.x + arena.width / 2, y: arena.y + arena.height * 0.6 };
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...center, x: arena.x + arena.width - 1 }] });
    await page.waitForTimeout(350);
    const right = await snapshot(page);
    assert.ok(right.player / right.world.width > 0.75, 'Drag moves the actual ship toward the right edge');
    assert.ok(right.player < right.world.width, 'Ship remains inside the arena');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...center, x: Math.max(0, arena.x) }] });
    await page.waitForTimeout(350);
    const left = await snapshot(page);
    assert.ok(left.player / left.world.width < 0.25, 'Captured drag can cross toward the left edge');
    assert.ok(left.player > 0);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await page.waitForTimeout(80);
    const released = await snapshot(page);
    await page.waitForTimeout(150);
    const later = await snapshot(page);
    assert.ok(Math.abs(later.player - released.player) <= later.world.width * 0.01, 'Cancelled pointer cannot keep steering');
    assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
    await page.waitForTimeout(80);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const ended = await snapshot(page);
    await page.waitForTimeout(120);
    assert.ok(Math.abs((await snapshot(page)).player - ended.player) <= ended.world.width * 0.01, 'Released pointer cannot keep steering');
    assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
    for (const id of ['left', 'right']) {
      await page.locator(`#${id}`).evaluate(button => { for (let count = 0; count < 30; count += 1) button.click(); });
      const nudged = await snapshot(page);
      assert.equal(nudged.player, id === 'left' ? 38 : nudged.world.width - 38, 'Assistive-technology activation uses the same visible edge bounds');
    }
    await capture(page, 'invaders-direct-drag-390');
  });

  await check('rotation preserves a paused run and adapts the logical arena', async () => {
    await open(page, 'runner');
    await page.locator('#overlay-action').tap();
    await page.locator('#action').tap();
    await page.waitForTimeout(100);
    await page.locator('#pause').tap();
    const before = await snapshot(page);
    const status = await page.locator('#status').textContent();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(120);
    const after = await snapshot(page);
    assert.equal(await page.locator('#status').textContent(), status);
    assert.equal(after.score, before.score);
    assert.equal(after.ended, before.ended);
    assert.notEqual(after.world.height, before.world.height);
    assert.equal(after.height, before.height, 'Rotation preserves the physical jump height');
    assert.equal(after.velocity, before.velocity, 'Rotation preserves jump velocity');
    assertFits(await bounds(page));
    await capture(page, 'runner-rotated-paused-844');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(120);
    assert.equal(await page.locator('#status').textContent(), status);
    assertFits(await bounds(page), { portrait: true });
  });

  await check('previous, next and picker links navigate all three games by touch', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, 'invaders');
    await page.locator('#next-game').tap();
    await page.waitForURL(/game=runner/);
    await page.locator('#previous-game').tap();
    await page.waitForURL(/game=invaders/);
    await page.locator('#game-picker > summary').tap();
    assert.equal(await page.locator('#game-picker').getAttribute('open'), '');
    assert.equal(await page.locator('.game-option').count(), 3);
    await page.locator('.game-option[href*="game=trivia"]').tap();
    await page.waitForURL(/game=trivia/);
    await page.locator('#game-picker > summary').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#game-picker').getAttribute('open'), '');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#game-picker').getAttribute('open'), null);
    assert.equal(await page.locator('#game-picker > summary').evaluate(element => element === document.activeElement), true);
  });

  await check('help and picker pause safely, close on resume and return keyboard focus', async () => {
    await open(page, 'invaders');
    await page.locator('#overlay-action').tap();
    await page.locator('#help-toggle').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#help-panel').isVisible(), true);
    assert.match(await page.locator('#help-panel').textContent(), /drag|steer|touch/i);
    assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
    await page.locator('#help-close').tap();
    assert.equal(await page.locator('#help-panel').isVisible(), false);
    assert.equal(await page.locator('#help-toggle').evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('KeyP');
    await page.locator('#help-toggle').tap();
    assert.equal(await page.locator('#help-panel').isVisible(), true);
    await page.keyboard.press('KeyP');
    assert.equal(await page.locator('#help-panel').isVisible(), false, 'P resumes and dismisses instructions');
    assert.equal(await page.locator('#arena-overlay').isVisible(), false);
    assert.equal(await page.locator('#canvas').evaluate(element => element === document.activeElement), true);
    await page.locator('#game-picker > summary').tap();
    await page.waitForFunction(() => document.getElementById('pause').textContent === 'Resume');
    await page.locator('#pause').tap();
    assert.equal(await page.locator('#game-picker').getAttribute('open'), null, 'Resume dismisses the game picker');
    assert.equal(await page.locator('#canvas').evaluate(element => element === document.activeElement), true);
  });
  await check('trivia replay changes all three rounds while preserving score, review and progress behavior', async () => {
    await open(page, 'trivia');
    const prompts = new Set();
    for (let round = 0; round < 3; round += 1) {
      const questions = questionsForRound(round);
      for (let index = 0; index < questions.length; index += 1) {
        const question = questions[index];
        assert.equal((await page.locator('#quiz-question').textContent()).trim(), question.prompt);
        assert.ok(!prompts.has(question.prompt));
        prompts.add(question.prompt);
        await page.locator('#quiz .answers button').nth(question.correct).tap();
        assert.equal(await page.locator('[role="progressbar"]').getAttribute('aria-valuenow'), String(index + 1));
        assert.equal(await page.locator('#quiz .answers button:enabled').count(), 0);
        assert.equal(await page.locator('.quiz-next').evaluate(element => element === document.activeElement), true);
        await page.locator('.quiz-next').tap();
      }
      assert.match(await page.locator('#quiz').textContent(), /5 out of 5/);
      assert.match(await page.locator('#quiz').textContent(), /Best streak: 5/);
      assert.equal(await page.locator('.skip-link').getAttribute('href'), '#quiz-question');
      await page.locator('.skip-link').focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('#quiz-question').evaluate(element => element === document.activeElement), true, 'Results retain a working skip-link focus target');
      await page.locator('.quiz-review > summary').tap();
      assert.equal(await page.locator('.quiz-review li').count(), 5);
      if (round === 2) await capture(page, 'trivia-third-round-review-390');
      await page.getByRole('button', { name: 'Play again', exact: true }).tap();
      assert.equal(await page.locator('[role="progressbar"]').getAttribute('aria-valuenow'), '0');
      assert.equal(await page.locator('#quiz-question').evaluate(element => element === document.activeElement), true);
    }
    assert.equal(prompts.size, 15);
    assert.equal((await page.locator('#quiz-question').textContent()).trim(), questionsForRound(0)[0].prompt);
  });
  await check('landscape double-jump apex stays in the scene and active rotation keeps the run', async () => {
    await page.setViewportSize({ width: 844, height: 390 });
    await open(page, 'runner');
    await page.locator('#overlay-action').tap();
    await page.locator('#action').tap();
    await page.waitForTimeout(240);
    await page.locator('#action').tap();
    await page.waitForFunction(() => window.__qaState?.jumps === 2 && window.__qaState.height > 120 && window.__qaState.velocity <= 0);
    const apex = await snapshot(page);
    const arena = arenaFor(apex);
    const head = arena.floor - apex.height + runnerCameraOffset(apex, arena) - 92 * (arena.runnerScale || 1);
    assert.ok(head >= 0, `The astronaut's head clips above the landscape arena: ${head}`);
    await capture(page, 'runner-double-jump-apex-844');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(80);
    const portrait = await snapshot(page);
    assert.equal(portrait.ended, false);
    assert.ok(portrait.height > 0);
    assert.ok(portrait.score >= apex.score);
    assertFits(await bounds(page), { portrait: true });
    await capture(page, 'runner-active-jump-rotated-390');
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(80);
    assert.equal((await snapshot(page)).ended, false);
    assertFits(await bounds(page));
  });
  errors.push(...await page.evaluate(() => (window.__qaRendererMutations || []).map(message => ({ message }))));
  await context.close();

  for (const fallback of [false, true]) {
    const { context, page } = await contextFor({ width: 390, height: 844 }, { fallback });
    await check(`${fallback ? 'rejected API fallback' : 'available browser API'} fullscreen enters and exits without losing a run`, async () => {
      await open(page, 'runner');
      await page.locator('#overlay-action').tap();
      await page.waitForTimeout(100);
      await page.locator('#pause').tap();
      const before = await snapshot(page);
      await page.locator('#fullscreen').tap();
      await page.waitForFunction(() => Boolean(document.fullscreenElement) || document.getElementById('game-shell').classList.contains('is-expanded'));
      assert.equal(await page.evaluate(() => Boolean(document.fullscreenElement)), !fallback, fallback ? 'Rejected native API uses the CSS fallback' : 'Available native API actually enters fullscreen');
      assert.match(await page.locator('#fullscreen').evaluate(element => element.getAttribute('aria-label') || element.textContent), /exit.*full\s*screen/i);
      const expandedBounds = await bounds(page);
      assertFits(expandedBounds, { portrait: expandedBounds.viewport.width < expandedBounds.viewport.height });
      await capture(page, `fullscreen-${fallback ? 'fallback' : 'native'}-390`);
      await page.locator('#fullscreen').tap();
      await page.waitForFunction(() => !document.fullscreenElement && !document.getElementById('game-shell').classList.contains('is-expanded'));
      const after = await snapshot(page);
      assert.equal(after.score, before.score);
      assert.match(await page.locator('#status').textContent(), /paused/i);
      if (fallback) {
        await page.locator('#fullscreen').tap();
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => !document.getElementById('game-shell').classList.contains('is-expanded'));
        assert.match(await page.locator('#status').textContent(), /paused/i);
      }
    });
    errors.push(...await page.evaluate(() => (window.__qaRendererMutations || []).map(message => ({ message }))));
    await context.close();
  }
  await check('simulated phone safe insets keep navigation and touch controls reachable', async () => {
    for (const test of [
      { viewport: { width: 320, height: 740 }, top: 24, right: 0, bottom: 34, left: 0 },
      { viewport: { width: 390, height: 844 }, top: 24, right: 0, bottom: 34, left: 0 },
      { viewport: { width: 844, height: 390 }, top: 0, right: 34, bottom: 21, left: 34 },
    ]) {
      const { context, page } = await contextFor(test.viewport);
      await open(page, 'invaders');
      await page.evaluate(insets => {
        for (const side of ['top', 'right', 'bottom', 'left']) document.documentElement.style.setProperty(`--safe-${side}`, `${insets[side]}px`);
      }, test);
      await page.waitForTimeout(120);
      const value = await bounds(page);
      assertFits(value, { portrait: test.viewport.width < 600 });
      for (const target of value.targets) assert.ok(target.x >= test.left - 1 && target.right <= value.viewport.width - test.right + 1 && target.y >= test.top - 1 && target.bottom <= value.viewport.height - test.bottom + 1, `${target.id} intrudes into a simulated safe inset at ${test.viewport.width}px`);
      geometry.push({ mode: 'invaders', stage: 'safe-insets', ...value, simulatedInsets: test });
      await capture(page, `safe-insets-${test.viewport.width}`);
      await context.close();
    }
  });
  await check('no upgrade browser exceptions or renderer mutations', async () => assert.deepEqual(errors, []));
} finally {
  await browser.close();
  if (server) await new Promise(done => server.close(done));
  const timestamp = new Date().toISOString();
  const report = JSON.stringify({ generatedAt: timestamp, browserVersion: browser.version(), baseURL, filter: filter || null, results, errors, geometry }, null, 2);
  await writeFile(resolve(output, 'results.json'), report);
  await writeFile(resolve(output, `results-${timestamp.replaceAll(':', '-').replaceAll('.', '-')}.json`), report);
}
if (results.some(result => !result.passed)) process.exitCode = 1;
