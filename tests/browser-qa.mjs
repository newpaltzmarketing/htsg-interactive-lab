import assert from 'node:assert/strict';
import { INVADER_RULES_VERSION } from '../public/game-engine.js';
import { resumeArcade, restartArcade } from './arcade-actions.mjs';
import { createServer } from 'node:http';
import { readFile, mkdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { questions } from '../public/questions.js';

// Browser tests are development tooling only. The published site has no dependencies.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const urlArgument = process.argv.indexOf('--url');
const requestedBaseURL = process.env.BASE_URL || (urlArgument >= 0 ? process.argv[urlArgument + 1] : null);
let externalBaseURL;
if (requestedBaseURL) {
  const parsed = new URL(requestedBaseURL);
  if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('--url / BASE_URL must be a public HTTP(S) directory URL without credentials, query, or fragment');
  }
  externalBaseURL = parsed.href.replace(/\/+$/, '');
}
const directoryArgument = process.argv.indexOf('--dir');
const publicRoot = resolve(root, process.env.QA_SITE_DIR || (directoryArgument >= 0 ? process.argv[directoryArgument + 1] : 'public'));
const publicTarget = externalBaseURL && !['localhost', '127.0.0.1'].includes(new URL(externalBaseURL).hostname);
const outputArgument = process.argv.indexOf('--output');
const output = outputArgument >= 0 ? resolve(root, process.argv[outputArgument + 1]) : resolve(root, 'artifacts', publicTarget ? 'live-games' : 'qa');
await mkdir(output, { recursive: true });
let playwright;
try {
  playwright = await import('playwright');
} catch (error) {
  if (!process.env.PLAYWRIGHT_MODULE_PATH) {
    throw new Error('Install the free Playwright development dependency or set PLAYWRIGHT_MODULE_PATH to its index.mjs.', { cause: error });
  }
  playwright = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE_PATH).href);
}

const contentTypes = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.json': 'application/json' };
const productionHeaders = {};
for (const line of (await readFile(resolve(publicRoot, '_headers'), 'utf8')).split(/\r?\n/)) {
  const match = line.match(/^\s+([^:]+):\s*(.+)$/);
  if (match) productionHeaders[match[1]] = match[2];
}
const server = externalBaseURL ? null : createServer(async (request, response) => {
  for (const [name, value] of Object.entries(productionHeaders)) response.setHeader(name, value);
  try {
    const url = new URL(request.url, 'http://localhost');
    const file = resolve(publicRoot, `.${decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)}`);
    if (file !== publicRoot && !file.startsWith(`${publicRoot}${sep}`)) {
      response.writeHead(403).end();
      return;
    }
    const fileStat = await stat(file);
    if (!fileStat.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': contentTypes[extname(file)] || 'application/octet-stream' });
    response.end(await readFile(file));
  } catch {
    try {
      response.writeHead(404, { 'Content-Type': 'text/html' });
      response.end(await readFile(resolve(publicRoot, '404.html')));
    } catch {
      response.end('Not found');
    }
  }
});
if (server) await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
const baseURL = externalBaseURL || `http://127.0.0.1:${server.address().port}`;
const installedChrome = process.platform === 'win32' && existsSync('C:/Program Files/Google/Chrome/Application/chrome.exe')
  ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined;
const executablePath = process.env.CHROME_PATH || installedChrome;
const browser = await playwright.chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [];
const browserErrors = [];
const expectedHTTPFailures = new Set();
const matchArguments = process.argv.flatMap((argument, index, all) => argument === '--match' ? [all[index + 1]] : []);
const testFilter = process.env.QA_MATCH || matchArguments.join('|') || null;

async function check(name, action) {
  if (process.argv.includes('--skip404') && name.startsWith('404 ')) return;
  if (testFilter && !new RegExp(testFilter).test(name) && name !== 'no browser exceptions or failed resources during QA') return;
  try {
    await action();
    results.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, passed: false, message: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function newPage(options = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.addInitScript(() => {
    const request = window.requestAnimationFrame.bind(window);
    const cancel = window.cancelAnimationFrame.bind(window);
    const pending = new Set();
    window.__qaFrames = { pending };
    window.requestAnimationFrame = callback => {
      const handle = request(time => { pending.delete(handle); callback(time); });
      pending.add(handle);
      return handle;
    };
    window.cancelAnimationFrame = handle => { pending.delete(handle); cancel(handle); };
  });
  page.on('pageerror', error => browserErrors.push(`${page.url()}: ${error.message}`));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    if (expectedHTTPFailures.has(message.location().url) && /Failed to load resource:.*404/.test(message.text())) return;
    browserErrors.push(`${page.url()}: ${message.text()}`);
  });
  return { context, page };
}

async function openGame(page, mode) {
  await page.goto(`${baseURL}/play.html?game=${mode}`);
  await page.locator('#title').waitFor();
  await page.waitForFunction(() => ['Agency Invaders', 'Launch Runner', 'Trivia Challenge'].includes(document.querySelector('#title')?.textContent));
  await page.waitForFunction(() => !document.querySelector('#game-shell') || document.documentElement.dataset.artwork === 'ready');
}

async function assertNoOverflow(page) {
  const sizes = await page.evaluate(() => ({ width: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(sizes.document <= sizes.width + 1 && sizes.body <= sizes.width + 1, `horizontal overflow: ${JSON.stringify(sizes)}`);
}

async function canvasPixels(page) {
  return page.locator('#canvas').evaluate(canvas => canvas.toDataURL());
}

try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 360, height: 800 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
    if (testFilter && !new RegExp(testFilter).test(`${viewport.width}px gallery and all three game routes fit`)) continue;
    const mobile = viewport.width < 600 || viewport.height < 500;
    const { context, page } = await newPage({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    await check(`${viewport.width}px gallery and all three game routes fit`, async () => {
      await page.goto(`${baseURL}/`);
      await assertNoOverflow(page);
      for (const mode of ['invaders', 'runner', 'trivia']) {
        assert.equal(await page.locator(`a[href*="game=${mode}"]`).count(), 1, `${mode} gallery route`);
      }
      await page.screenshot({ path: resolve(output, `gallery-${viewport.width}.png`), fullPage: true });
      for (const mode of ['invaders', 'runner', 'trivia']) {
        await openGame(page, mode);
        await assertNoOverflow(page);
        assert.equal(await page.locator('#steering-pad').count(), 0, 'Direct game-area controls replace the separate steering pad');
        if (viewport.width === 390 && mode === 'invaders') {
          assert.ok((await page.locator('#canvas').boundingBox()).height >= 666, 'The phone arena reclaims the removed steering-row space');
        }
        if (viewport.width === 844 && viewport.height === 390 && mode !== 'trivia') {
          const fits = await page.locator('#canvas').evaluate(canvas => {
            const arena = canvas.getBoundingClientRect();
            const targets = [...document.querySelectorAll('#controls button')].filter(button => !button.hidden).map(button => button.getBoundingClientRect());
            return arena.top >= -1 && arena.bottom <= innerHeight + 1 && targets.every(button => button.top >= -1 && button.bottom <= innerHeight + 1 && button.left >= -1 && button.right <= innerWidth + 1);
          });
          assert.ok(fits, `${mode}: the complete arena and all touch controls must be visible together in phone landscape`);
        }
        await page.screenshot({ path: resolve(output, `${mode}-${viewport.width}.png`), fullPage: true });
        if (viewport.width === 320 && mode !== 'trivia') {
          await page.locator('#start').tap();
          await page.locator('#pause').tap();
          await assertNoOverflow(page);
          await page.screenshot({ path: resolve(output, `${mode}-paused-320.png`), fullPage: true });
        }
      }
    });
    await context.close();
  }

  const { context, page } = await newPage({ viewport: { width: 1280, height: 900 } });
  for (const mode of ['invaders', 'runner']) {
    await check(`${mode}: start, pause, resume, restart and focus controls`, async () => {
      await openGame(page, mode);
      assert.ok(await page.locator('#start').isEnabled());
      await page.locator('#start').click();
      await page.waitForTimeout(100);
      assert.ok(await page.locator('#pause').isEnabled());
      await page.locator('#pause').click();
      assert.match(await page.locator('#status').textContent(), /paused/i);
      const pausedPixels = await canvasPixels(page);
      await page.waitForTimeout(250);
      assert.equal(await canvasPixels(page), pausedPixels, 'pause must freeze simulation and rendering');
      // Space on a focused native button must activate that button, not gameplay.
      await page.locator(mode === 'invaders' ? '#panel-resume' : '#pause').focus();
      await page.keyboard.press('Space');
      await page.waitForTimeout(60);
      assert.doesNotMatch(await page.locator('#status').textContent(), /paused/i);
      // Read reset state in the same task as activation: wall-clock delay on a
      // busy host legitimately advances a running distance counter before a
      // separate browser round trip can inspect it.
      if (mode === 'invaders') await page.locator('#pause').click();
      const resetStatus = await restartArcade(page);
      assert.match(resetStatus, mode === 'invaders' ? /score.*0.*lives.*3/i : /distance.*0/i);
      await page.keyboard.press('Escape');
      assert.match(await page.locator('#status').textContent(), /paused/i);
      await page.screenshot({ path: resolve(output, `${mode}-paused-desktop.png`), fullPage: true });
    });
    await check(`${mode}: repeated restart has only one animation loop`, async () => {
      await openGame(page, mode);
      for (let repeat = 0; repeat < 8; repeat += 1) {
        await restartArcade(page);
      }
      await page.waitForTimeout(80);
      assert.ok(await page.evaluate(() => window.__qaFrames.pending.size <= 1));
      await page.locator('#pause').click();
      assert.equal(await page.evaluate(() => window.__qaFrames.pending.size), 0);
    });
  }

  await check('Agency Invaders: desktop movement, release, firing and leaving the tab', async () => {
    await openGame(page, 'invaders');
    await page.locator('#start').click();
    const pixels = await canvasPixels(page);
    await page.keyboard.down('ArrowRight');
    assert.equal(await page.locator('#right').getAttribute('aria-pressed'), 'true');
    await page.waitForTimeout(90);
    assert.notEqual(await canvasPixels(page), pixels, 'movement visibly changes the player position');
    await page.keyboard.up('ArrowRight');
    assert.equal(await page.locator('#right').getAttribute('aria-pressed'), 'false');
    await page.keyboard.down('Space');
    assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'true');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    assert.match(await page.locator('#status').textContent(), /paused/i);
    assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
    await page.keyboard.up('Space');
    await resumeArcade(page);
    assert.doesNotMatch(await page.locator('#status').textContent(), /paused/i);
  });

  await check('native start button retains Space activation without holding Fire', async () => {
    await openGame(page, 'invaders');
    await page.locator('#start').focus();
    await page.keyboard.press('Space');
    assert.equal(await page.locator('#start').textContent(), 'Restart');
    assert.equal(await page.locator('#action').getAttribute('aria-pressed'), 'false');
  });

  await check('challenge controller fixes the course, emits one result and requests a fresh replay ticket', async () => {
    await openGame(page, 'invaders');
    await page.evaluate(rulesVersion => {
      window.__challengeQA = { results: [], starts: [], retries: 0 };
      document.addEventListener('htsg:run-result', event => window.__challengeQA.results.push(event.detail));
      document.addEventListener('htsg:run-start', event => window.__challengeQA.starts.push(event.detail));
      document.addEventListener('htsg:challenge-retry', () => { window.__challengeQA.retries += 1; });
      document.dispatchEvent(new CustomEvent('htsg:challenge-start', { detail: { seed: 'controller-fixture', challengeId: 'fixture', rulesVersion, durationSeconds: 1 } }));
    }, INVADER_RULES_VERSION);
    const geometry = await page.locator('#canvas').boundingBox();
    assert.ok(Math.abs(geometry.width / geometry.height - 960 / 1669) < 0.001);
    await page.waitForFunction(() => window.__challengeQA.results.length === 1, null, { timeout: 15000 });
    const result = await page.evaluate(() => window.__challengeQA.results[0]);
    assert.equal(result.elapsed, 1);
    assert.equal(result.reason, 'time');
    assert.equal(result.rulesVersion, INVADER_RULES_VERSION);
    await page.locator('#overlay-action').click();
    assert.equal(await page.evaluate(() => window.__challengeQA.retries), 1);
    assert.equal(await page.evaluate(() => window.__challengeQA.starts.length), 1, 'replay cannot reuse the previous ticket locally');
    await page.locator('#free-play').click();
    assert.equal(await page.evaluate(() => window.__challengeQA.starts.at(-1).challengeId), null);
    assert.equal(await page.evaluate(() => window.__challengeQA.results.length), 1);
  });

  await check('trivia: all correct, no double scoring, result and restart', async () => {
    await openGame(page, 'trivia');
    const choices = questions.map(question => question.correct);
    for (let i = 0; i < choices.length; i++) {
      const answer = page.locator('#quiz .answers button').nth(choices[i]);
      await answer.click();
      assert.equal(await page.locator('#quiz .answers button:enabled').count(), 0);
      assert.equal(await page.locator('#quiz .quiz-next').evaluate(element => element === document.activeElement), true, 'focus moves to continuation');
      await page.getByRole('button', { name: i === 4 ? 'See results' : 'Next question', exact: true }).click();
    }
    assert.match(await page.locator('#quiz').textContent(), /5\s*(?:out of|\/)\s*5/);
    await page.screenshot({ path: resolve(output, 'trivia-perfect-desktop.png'), fullPage: true });
    await page.getByRole('button', { name: /play again/i }).click();
    assert.match(await page.locator('#quiz').textContent(), /question\s+1\s+of\s+5/i);
    assert.equal(await page.locator('#quiz-question').evaluate(element => element === document.activeElement), true, 'restart returns focus to the first question');
  });

  await check('trivia: all incorrect yields zero and keyboard advance works', async () => {
    await openGame(page, 'trivia');
    const choices = questions.map(question => (question.correct + 1) % question.answers.length);
    for (let i = 0; i < choices.length; i++) {
      await page.locator('#quiz .answers button').nth(choices[i]).focus();
      await page.keyboard.press('Space');
      assert.equal(await page.locator('#quiz .answers button:enabled').count(), 0);
      const next = page.getByRole('button', { name: i === 4 ? 'See results' : 'Next question', exact: true });
      await next.focus();
      await page.keyboard.press('Enter');
    }
    assert.match(await page.locator('#quiz').textContent(), /0\s*(?:out of|\/)\s*5/);
  });

  await check('unknown game query falls back safely to Agency Invaders', async () => {
    await openGame(page, 'not-a-game');
    assert.match(await page.locator('#title').textContent(), /Agency Invaders/);
    await page.locator('#start').click();
    assert.ok(await page.locator('#pause').isEnabled());
  });
  await check('404 nested routes retain styling, favicon and gallery navigation', async () => {
    const missingURL = `${baseURL}/qa/missing/game`;
    expectedHTTPFailures.add(missingURL);
    const response = await page.goto(missingURL);
    assert.equal(response.status(), 404);
    assert.match(await page.locator('h1').textContent(), /Page not found/);
    const stylesheet = await page.locator('link[rel="stylesheet"]').getAttribute('href');
    assert.equal(new URL(stylesheet, missingURL).href, `${baseURL}/style.css`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).margin), '0px', 'the branded stylesheet applies at a nested missing URL');
    const favicon = await page.locator('link[rel="icon"]').getAttribute('href');
    const faviconURL = new URL(favicon, missingURL).href;
    assert.equal(faviconURL, `${baseURL}/assets/favicon.png`);
    assert.equal((await page.request.get(faviconURL)).status(), 200);
    await page.screenshot({ path: resolve(output, '404-nested-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoOverflow(page);
    await page.screenshot({ path: resolve(output, '404-nested-390.png'), fullPage: true });
    await page.getByRole('link', { name: /Back to the games/ }).click();
    assert.equal(new URL(page.url()).pathname, new URL('index.html', `${baseURL}/`).pathname);
    assert.equal(await page.locator('a[href*="game="]').count(), 3);
  });
  await context.close();

  const touchViewports = process.argv.includes('--touch-all')
    ? [{ width: 390, height: 844 }, { width: 320, height: 740 }, { width: 844, height: 390 }]
    : [{ width: 390, height: 844 }];
  for (const touchViewport of touchViewports) {
  const { context: touchContext, page: touchPage } = await newPage({ viewport: touchViewport, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const touch = await touchContext.newCDPSession(touchPage);
  async function pointFor(selector, id) {
    const box = await touchPage.locator(selector).boundingBox();
    assert.ok(box, `${selector} is visible`);
    return { id, x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }
  await check(`mobile ${touchViewport.width}px: hold direction and Fire together, cancel touch, release outside`, async () => {
    await openGame(touchPage, 'invaders');
    await touchPage.locator('#start').tap();
    await touchPage.locator('#left').scrollIntoViewIfNeeded();
    const left = await pointFor('#left', 1);
    const fire = await pointFor('#action', 2);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [left, fire] });
    assert.equal(await touchPage.locator('#left').getAttribute('aria-pressed'), 'true');
    assert.equal(await touchPage.locator('#action').getAttribute('aria-pressed'), 'true');
    await touch.send('Input.dispatchTouchEvent', { type: 'touchCancel', touchPoints: [] });
    assert.equal(await touchPage.locator('#left').getAttribute('aria-pressed'), 'false');
    assert.equal(await touchPage.locator('#action').getAttribute('aria-pressed'), 'false');
    const right = await pointFor('#right', 3);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [right] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...right, x: 10, y: 10 }] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.equal(await touchPage.locator('#right').getAttribute('aria-pressed'), 'false');
    await touchPage.screenshot({ path: resolve(output, `invaders-touch-${touchViewport.width}.png`), fullPage: true });
  });

  await check(`mobile ${touchViewport.width}px: Jump button and arena tap work, then pause clears inputs`, async () => {
    await openGame(touchPage, 'runner');
    await touchPage.locator('#start').tap();
    const ground = await canvasPixels(touchPage);
    await touchPage.locator('#action').tap();
    await touchPage.waitForTimeout(80);
    assert.notEqual(await canvasPixels(touchPage), ground, 'Jump visibly moves the runner');
    assert.equal(await touchPage.locator('#action').getAttribute('aria-pressed'), 'false');
    await touchPage.waitForTimeout(850);
    const landed = await canvasPixels(touchPage);
    await touchPage.locator('#canvas').tap();
    await touchPage.waitForTimeout(80);
    assert.notEqual(await canvasPixels(touchPage), landed, 'arena tap triggers another jump');
    await touchPage.locator('#pause').tap();
    assert.match(await touchPage.locator('#status').textContent(), /paused/i);
    assert.equal(await touchPage.locator('#action').getAttribute('aria-pressed'), 'false');
  });

  await check(`mobile ${touchViewport.width}px: trivia answer and continuation tap targets work`, async () => {
    await openGame(touchPage, 'trivia');
    const answer = touchPage.locator('#quiz .answers button').nth(questions[0].correct);
    await answer.tap();
    assert.match(await touchPage.locator('#status').textContent(), /1 correct/);
    await touchPage.getByRole('button', { name: 'Next question', exact: true }).tap();
    assert.match(await touchPage.locator('#quiz').textContent(), /question\s+2\s+of\s+5/i);
  });
  await touchContext.close();
  }
  await check('no browser exceptions or failed resources during QA', async () => {
    assert.deepEqual(browserErrors, []);
  });
} finally {
  await browser.close();
  if (server) await new Promise(resolveClose => server.close(resolveClose));
  const generatedAt = new Date().toISOString();
  const report = JSON.stringify({ browser: 'Chromium / Chrome headless', browserVersion: browser.version(), baseURL, generatedAt, filter: testFilter, siteDirectory: publicRoot, results, browserErrors }, null, 2);
  await writeFile(resolve(output, 'results.json'), report);
  await writeFile(resolve(output, `results-${generatedAt.replaceAll(':', '-').replaceAll('.', '-')}.json`), report);
}

if (results.some(result => !result.passed)) process.exitCode = 1;
