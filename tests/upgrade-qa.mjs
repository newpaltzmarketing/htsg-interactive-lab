import assert from 'node:assert/strict';
import { resumeArcade } from './arcade-actions.mjs';
import { createServer } from 'node:http';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { questionsForRound } from '../public/questions.js';
import { arenaFor, INVADER_HAZARDS } from '../public/game-engine.js';
import { runnerCameraOffset, HALO_ATLAS, haloGeometry } from '../public/game-renderer.js';

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
const defaultOutput = external && !['localhost', '127.0.0.1'].includes(new URL(external).hostname) ? 'artifacts/upgrade-live' : 'artifacts/upgrade-qa';
const output = resolve(root, option('--output', defaultOutput));
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
    window.__qaPointers = [];
    for (const type of ['pointerdown', 'pointerup', 'pointercancel']) document.addEventListener(type, event => {
      const scene = window.__qaScene;
      window.__qaPointers.push({ type, pointerId: event.pointerId, target: event.target.id, at: performance.now(),
        state: scene ? { player: scene.player, playerY: scene.playerY, world: { ...scene.world } } : null });
    }, true);
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
            if (state) { window.__qaState = JSON.parse(before); window.__qaScene = state; }
            const drawImage = ctx.drawImage;
            const fillText = ctx.fillText;
            window.__qaTexts = [];
            ctx.fillText = function(text, ...coordinates) {
              window.__qaTexts.push({ text, font: this.font });
              return fillText.call(this, text, ...coordinates);
            };
            ctx.drawImage = function(image, ...coordinates) {
              if (source.HALO_ATLAS && image?.src?.includes(source.HALO_ATLAS.file) && coordinates.length >= 8) {
                window.__qaHaloFrame = Math.round(coordinates[0] / source.HALO_ATLAS.tileWidth) + source.HALO_ATLAS.columns * Math.round(coordinates[1] / source.HALO_ATLAS.tileHeight);
              }
              return drawImage.call(this, image, ...coordinates);
            };
            let result;
            try { result = originalRender.call(renderer, ctx, state, options); }
            finally { ctx.drawImage = drawImage; ctx.fillText = fillText; }
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
  for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 568, height: 320 }, { width: 844, height: 390 }, { width: 1280, height: 900 }, { width: 1440, height: 900 }]) {
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
        assert.equal(await page.locator(mode === 'invaders' ? '#control-panel' : '#arena-overlay').isVisible(), true);
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
  await check('relative arena drag moves both axes without contact or re-grab teleporting', async () => {
    await open(page, 'invaders');
    await page.locator('#overlay-action').tap();
    const arena = await page.locator('#canvas').boundingBox();
    const anchor = { id: 1, x: arena.x + 45, y: arena.y + arena.height * 0.68 };
    const before = await snapshot(page);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [anchor] });
    await page.waitForTimeout(90);
    const contact = await snapshot(page);
    assert.ok(Math.abs(contact.player - before.player) < 1 && Math.abs(contact.playerY - before.playerY) < 1, 'A distant touch begins relative steering without snapping the ship to the finger');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...anchor, x: anchor.x + 90, y: anchor.y - 50 }] });
    await page.waitForTimeout(250);
    const moved = await snapshot(page);
    assert.ok(moved.player > before.player + 30 && moved.playerY < before.playerY - 20, 'Relative horizontal and vertical motion both reach the actual ship');
    const limits = arenaFor(moved).invadersBounds;
    assert.ok(moved.player >= limits.left && moved.player <= limits.right && moved.playerY >= limits.top && moved.playerY <= limits.bottom);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    await page.waitForTimeout(80);
    const released = await snapshot(page);
    await page.waitForTimeout(150);
    const later = await snapshot(page);
    assert.ok(Math.abs(later.player - released.player) <= 1 && Math.abs(later.playerY - released.playerY) <= 1, 'Cancelled pointer cannot keep steering either axis');
    assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
    const regrab = { ...anchor, x: arena.x + arena.width - 30, y: arena.y + 40 };
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [regrab] });
    await page.waitForTimeout(100);
    const grabbed = await snapshot(page);
    assert.ok(Math.abs(grabbed.player - later.player) <= 1 && Math.abs(grabbed.playerY - later.playerY) <= 1, 'Re-grabbing at another point starts from the current ship position');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    const ended = await snapshot(page);
    await page.waitForTimeout(120);
    const afterRelease = await snapshot(page);
    assert.ok(Math.abs(afterRelease.player - ended.player) <= 1 && Math.abs(afterRelease.playerY - ended.playerY) <= 1, 'Released pointer cannot keep steering either axis');
    assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
    for (const id of ['left', 'right']) {
      await page.locator(`#${id}`).evaluate(button => { for (let count = 0; count < 30; count += 1) button.click(); });
      const nudged = await snapshot(page);
      assert.equal(nudged.player, id === 'left' ? 38 : nudged.world.width - 38, 'Assistive-technology activation uses the same visible edge bounds');
    }
    await capture(page, 'invaders-direct-drag-390');
  });

  for (const viewport of [{ width: 320, height: 740 }, { width: 390, height: 844 }, { width: 568, height: 320 }, { width: 844, height: 390 }]) {
    await check(`${viewport.width}px direct arena steering reclaims space and supports relative two-axis multi-touch`, async () => {
      await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] }).catch(() => {});
      await page.setViewportSize(viewport);
      await open(page, 'invaders');
      await page.locator('#overlay-action').tap();
      // Start changes the control row. Wait for its visible geometry and the
      // live simulation world to agree before testing a stationary gesture.
      await page.waitForFunction(() => {
        const box = document.getElementById('canvas').getBoundingClientRect();
        const scene = window.__qaScene;
        if (!scene?.elapsed || Math.abs(scene.world.height - scene.world.width * box.height / box.width) > .1) return false;
        const key = `${box.width}:${box.height}:${scene.world.height}`;
        const previous = window.__qaStableCanvas;
        window.__qaStableCanvas = { key, frames: previous?.key === key ? previous.frames + 1 : 1 };
        return window.__qaStableCanvas.frames >= 2;
      });
      const canvas = await page.locator('#canvas').boundingBox();
      assert.equal(await page.locator('#steering-pad').count(), 0, 'The separate steering pad is removed');
      if (viewport.width === 390) assert.ok(canvas.height >= 666, `The phone arena reclaims at least 60px from its former 606px height: ${canvas.height}`);
      assertFits(await bounds(page), { portrait: viewport.width < 600 });
      const center = { id: 1, x: canvas.x + canvas.width * 0.35, y: canvas.y + canvas.height * 0.65 };
      const preDispatch = await snapshot(page);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
      await page.waitForTimeout(90);
      const { anchor, contact } = await page.evaluate(() => ({
        anchor: window.__qaPointers.findLast(event => event.type === 'pointerdown' && event.target === 'canvas')?.state,
        contact: { player: window.__qaScene.player, playerY: window.__qaScene.playerY, world: { ...window.__qaScene.world } },
      }));
      assert.ok(anchor, 'The real canvas pointerdown was delivered');
      const before = anchor;
      const diagnostic = { viewport, preDispatch: { player: preDispatch.player, playerY: preDispatch.playerY, world: preDispatch.world }, anchor, contact };
      geometry.push({ mode: 'invaders', stage: 'stationary-contact', ...diagnostic });
      assert.deepEqual(contact.world, before.world, `Canvas world stays stable during stationary contact: ${JSON.stringify(diagnostic)}`);
      assert.ok(Math.abs(contact.player - before.player) < 1 && Math.abs(contact.playerY - before.playerY) < 1, `Contact anchors relative steering without moving the ship: ${JSON.stringify(diagnostic)}`);
      const deflected = { ...center, x: center.x + 50, y: center.y - 35 };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [deflected] });
      await page.waitForTimeout(250);
      const moved = await snapshot(page);
      assert.ok(moved.player > before.player + 15 && moved.playerY < before.playerY - 15, 'Direct diagonal dragging moves the ship on both axes');
      await page.waitForTimeout(100);
      const held = await snapshot(page);
      assert.ok(Math.abs(held.player - moved.player) < 1 && Math.abs(held.playerY - moved.playerY) < 1, 'A stationary finger stops at the relative destination instead of continuing like a joystick');
      const fireBox = await page.locator('#action').boundingBox();
      const fire = { id: 2, x: fireBox.x + fireBox.width / 2, y: fireBox.y + fireBox.height / 2 };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [deflected, fire] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [deflected] });
      await page.waitForTimeout(50);
      assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'true', 'Releasing the drag preserves the separately held Fire source');
      const stopped = await snapshot(page);
      await page.waitForTimeout(100);
      const later = await snapshot(page);
      assert.ok(Math.abs(later.player - stopped.player) < 1 && Math.abs(later.playerY - stopped.playerY) < 1, `Drag release clears both movement axes: ${JSON.stringify({ before: [stopped.player, stopped.playerY], after: [later.player, later.playerY], events: await page.evaluate(() => window.__qaPointers.slice(-8)) })}`);
      await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false', 'Cancelling the remaining finger clears Fire');
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ ...center, x: canvas.x + canvas.width - 12 }] });
      await page.waitForTimeout(90);
      const regrab = await snapshot(page);
      assert.ok(Math.abs(regrab.player - later.player) < 1 && Math.abs(regrab.playerY - later.playerY) < 1, 'A new arena contact establishes its own stationary anchor');
      await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      geometry.push({ mode: 'invaders', stage: 'direct-drag', viewport, canvas });
      await capture(page, `invaders-direct-arena-${viewport.width}`);
    });
  }
  await page.setViewportSize({ width: 390, height: 844 });

  await check('a second held steering contact takes over without a jump when the first finger lifts', async () => {
    for (const primary of ['left', 'right']) {
      await open(page, 'invaders');
      await page.locator('#overlay-action').tap();
      const arena = await page.locator('#canvas').boundingBox();
      const first = { id: 1, x: arena.x + arena.width * (primary === 'left' ? 0.25 : 0.7), y: arena.y + arena.height * 0.65 };
      const second = { id: 2, x: arena.x + arena.width * (primary === 'left' ? 0.7 : 0.25), y: arena.y + arena.height * 0.6 };
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [first, second] });
      await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [first] });
      const before = await snapshot(page);
      await page.waitForTimeout(90);
      const promoted = await snapshot(page);
      assert.ok(Math.abs(promoted.player - before.player) < 1 && Math.abs(promoted.playerY - before.playerY) < 1, 'Promotion anchors at the current ship position');
      await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...second, x: second.x + 30, y: second.y - 24 }] });
      await page.waitForTimeout(220);
      const moved = await snapshot(page);
      assert.ok(moved.player > promoted.player + 15 && moved.playerY < promoted.playerY - 15, 'The remaining finger can immediately steer both axes');
      await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
      assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
    }
  });

  await check('hazard guide identifies six agency objects and feedback names damage versus shield protection', async () => {
    await open(page, 'invaders');
    await page.locator('#overlay-action').tap();
    await page.waitForTimeout(1800);
    const visibleHazards = (await snapshot(page)).enemies.filter(enemy => enemy.y > 0);
    const drawnNames = await page.evaluate(() => window.__qaTexts.map(item => item.text));
    assert.ok(visibleHazards.length > 0);
    assert.equal(INVADER_HAZARDS.some(hazard => drawnNames.includes(hazard.label)), false, 'Falling objects use their silhouettes rather than floating name labels');
    await capture(page, 'invaders-agency-objects-390');
    await page.locator('#help-toggle').tap();
    const entries = page.locator('#hazard-legend li');
    assert.equal(await entries.count(), INVADER_HAZARDS.length);
    assert.deepEqual((await entries.locator('strong').allTextContents()).sort(), INVADER_HAZARDS.map(hazard => hazard.label).sort());
    for (const entry of await entries.all()) {
      assert.match((await entry.locator('small').innerText()).trim(), /\S+\s+\S+/, 'Each object has a specific visual explanation');
      const icon = entry.locator('canvas');
      assert.equal(await icon.isVisible(), true);
      assert.ok(await icon.evaluate(canvas => canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0)), 'Guide draws a real sprite');
    }
    await capture(page, 'invaders-hazard-guide-390');
    await page.locator('#help-close').tap();
    await resumeArcade(page);
    await page.waitForFunction(() => window.__qaState?.lastHazardTime > 0 && !window.__qaState.lastHazardBlocked, undefined, { timeout: 15000 });
    assert.equal(await page.locator('#impact-feedback').isVisible(), true);
    assert.match(await page.locator('#impact-feedback').textContent(), /1 life lost/);
    const hit = await snapshot(page);
    assert.ok(INVADER_HAZARDS.some(hazard => hazard.label === hit.lastHazard));
    assert.match(await page.locator('#impact-feedback').textContent(), new RegExp(hit.lastHazard));
    assert.equal(hit.lives, 2);
    const feedbackFits = await page.locator('#impact-feedback').evaluate(node => {
      const box = node.getBoundingClientRect();
      return box.left >= 0 && box.right <= innerWidth && box.top >= 0 && box.bottom <= innerHeight;
    });
    assert.equal(feedbackFits, true, 'The named life-loss feedback remains inside the phone viewport');
    await capture(page, 'invaders-natural-impact-390');
    // Only shield protection uses deterministic client-only setup. Normal engine
    // collision, damage, feedback, shield consumption and drawing still execute.
    await page.evaluate(hazard => {
      const scene = window.__qaScene;
      scene.damageCooldown = 0;
      scene.shield = 1;
      scene.shieldTime = 5;
      scene.enemies = [{ x: scene.player, y: scene.playerY, health: 1, hazard, hazardId: hazard.id, label: hazard.label }];
    }, INVADER_HAZARDS[1]);
    await page.waitForFunction(() => document.getElementById('impact-feedback').textContent.includes('Shield blocked'));
    assert.match(await page.locator('#impact-feedback').textContent(), /Missed deadlines/);
    assert.equal(await page.locator('#impact-feedback').getAttribute('data-kind'), 'shield');
    assert.equal((await snapshot(page)).lives, 2);
    await capture(page, 'invaders-shield-feedback-390');
    await page.evaluate(hazard => {
      const scene = window.__qaScene;
      scene.lives = 1; scene.damageCooldown = 0; scene.shield = 0;
      scene.enemies = [{ x: scene.player, y: scene.playerY, health: 1, hazard, hazardId: hazard.id, label: hazard.label }];
    }, INVADER_HAZARDS[0]);
    await page.waitForFunction(() => window.__qaState?.ended);
    assert.equal(await page.locator('#arena-overlay').isVisible(), true);
    assert.match(await page.locator('#instructions').textContent(), /Scope creep/, 'The final-life overlay retains the named cause');
  });

  await check('Halo uses articulated frames, freezes on pause and keeps its full sprite in each arena', async () => {
    await open(page, 'runner');
    await page.locator('#overlay-action').tap();
    await page.waitForTimeout(180);
    const before = await snapshot(page);
    const poses = new Set();
    for (const time of [0, 0.12, 0.24, 0.36]) poses.add(haloGeometry({ ...before, elapsed: time }).frame);
    assert.ok(poses.size >= 3, 'Running selects distinct actual articulated source frames');
    const drawnFrames = new Set();
    for (let sample = 0; sample < 4; sample += 1) {
      drawnFrames.add(await page.evaluate(() => window.__qaHaloFrame));
      await page.waitForTimeout(110);
    }
    assert.ok(!drawnFrames.has(undefined) && drawnFrames.size >= 2, 'The real renderer draws different articulated atlas frames during play');
    geometry.push({ mode: 'runner', stage: 'halo-animation', drawnFrames: [...drawnFrames] });
    assert.equal(HALO_ATLAS.frames, HALO_ATLAS.sourceFrames.length);
    for (const height of [240, 320, 540, 1700]) {
      for (const jump of [0, 100, 300]) {
        const scene = { ...before, world: { width: 960, height }, height: jump, velocity: jump ? 250 : 0, effects: [] };
        const arena = arenaFor(scene);
        const pose = haloGeometry(scene, arena);
        assert.equal(pose.bootsY, arena.floor - jump);
        assert.ok(pose.frame >= 0 && pose.frame < HALO_ATLAS.frames);
        const camera = runnerCameraOffset(scene, arena);
        assert.ok(pose.bounds.left >= 0 && pose.bounds.right <= arena.width && pose.bounds.top + camera >= 0 && pose.bounds.bottom + camera <= arena.height, 'The actual visible Halo frame, including cape and tilt, remains in view');
      }
    }
    await page.waitForTimeout(80);
    await page.locator('#pause').tap();
    const frozen = await page.locator('#canvas').screenshot();
    const paused = await snapshot(page);
    await page.waitForTimeout(250);
    assert.deepEqual(await page.locator('#canvas').screenshot(), frozen, 'The paused Halo frame and whole scene stay pixel-identical');
    assert.deepEqual(await snapshot(page), paused);
    await capture(page, 'halo-paused-390');
  });

  await check('reduced motion fixes the Halo pose while retaining jump placement and gameplay', async () => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, 'runner');
    await page.locator('#overlay-action').tap();
    const observed = await snapshot(page);
    const frames = [0, 0.2, 0.5, 1].map(elapsed => haloGeometry({ ...observed, elapsed }, undefined, { reducedMotion: true }).frame);
    assert.equal(new Set(frames).size, 1);
    const pixels = await page.evaluate(async () => {
      const { createRenderer } = await import(new URL('game-renderer.js?qa-original=1', location.href));
      const { createRunnerState } = await import(new URL('game-engine.js', location.href));
      const renderer = createRenderer();
      await renderer.loadImages();
      const canvas = document.createElement('canvas'); canvas.width = 960; canvas.height = 540;
      const ctx = canvas.getContext('2d');
      const state = createRunnerState();
      const render = elapsed => { state.elapsed = elapsed; renderer.render(ctx, state, { mode: 'runner', width: 960, height: 540, cssWidth: 960, cssHeight: 540, reducedMotion: true }); return canvas.toDataURL(); };
      return { before: render(1), after: render(2) };
    });
    assert.equal(pixels.before, pixels.after, 'Reduced motion removes cosmetic frame, background and thruster animation');
    await page.locator('#action').tap();
    await page.waitForTimeout(80);
    assert.ok((await snapshot(page)).height > 0, 'Reduced motion preserves playable jumping');
    await capture(page, 'halo-reduced-motion-390');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
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
    assert.equal(await page.locator('#panel-help').evaluate(element => element === document.activeElement), true);
    await page.keyboard.press('KeyP');
    await page.locator('#help-toggle').tap();
    assert.equal(await page.locator('#help-panel').isVisible(), true);
    await page.keyboard.press('KeyP');
    assert.equal(await page.locator('#help-panel').isVisible(), false, 'P resumes and dismisses instructions');
    assert.equal(await page.locator('#arena-overlay').isVisible(), false);
    assert.equal(await page.locator('#canvas').evaluate(element => element === document.activeElement), true);
    await page.locator('#game-picker > summary').tap();
    await page.waitForFunction(() => document.getElementById('pause').textContent === 'Resume');
    await resumeArcade(page);
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
    const head = haloGeometry(apex, arena).bounds.top + runnerCameraOffset(apex, arena);
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
