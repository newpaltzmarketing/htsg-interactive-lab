import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

// Public, read-only integration checks. This script never signs in or submits forms.
const argumentsList = process.argv.slice(2);
function option(name, fallback) {
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : fallback;
}
function publicURL(value, name) {
  if (!value) throw new Error(`Missing ${name}`);
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.hash || url.search) {
    throw new Error(`${name} must be an HTTP(S) URL without credentials, query, or fragment`);
  }
  return url.href;
}
const siteURL = publicURL(option('--site-url'), '--site-url');
const demosURL = publicURL(option('--demos-url'), '--demos-url');
const labURL = publicURL(option('--lab-url'), '--lab-url').replace(/\/+$/, '') + '/';
const menuLabel = option('--menu-label', 'Demos');
const filters = argumentsList.flatMap((argument, index, all) => argument === '--match' ? [all[index + 1]] : []);
const testFilter = filters.join('|') || null;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'artifacts', 'live-qa');
await mkdir(output, { recursive: true });
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && existsSync(chrome) ? chrome : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const browserVersion = browser.version();
const results = [];
const diagnostics = [];
const network = [];
const normalized = value => new URL(value).href.replace(/\/+$/, '');

async function check(name, action) {
  if (testFilter && !new RegExp(testFilter).test(name)) return;
  try {
    await action();
    results.push({ name, passed: true });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, passed: false, message: error.message });
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

async function noOverflow(page) {
  const dimensions = await page.evaluate(() => ({ viewport: innerWidth, html: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(dimensions.html <= dimensions.viewport + 1 && dimensions.body <= dimensions.viewport + 1, `Horizontal overflow: ${JSON.stringify(dimensions)}`);
}

async function visibleLink(page, label) {
  const links = await page.getByRole('link', { name: label, exact: true }).all();
  for (const link of links) {
    const inMenu = await link.evaluate(element => Boolean(element.closest('header, nav, [role="navigation"], .elementor-location-header')) && !element.closest('footer'));
    if (inMenu && await link.isVisible()) return link;
  }
  return null;
}

async function revealMenuLink(page) {
  const htsgNavigation = page.locator('#site-navigation');
  if (await htsgNavigation.count()) {
    if (!await htsgNavigation.isVisible()) await page.getByRole('button', { name: 'Menu', exact: true }).click();
    const directDemosLink = htsgNavigation.locator('.nav-group-demos .nav-control > a');
    if (await directDemosLink.count() && await directDemosLink.isVisible()) return directDemosLink;
  }
  let link = await visibleLink(page, menuLabel);
  if (link) return link;
  const toggles = [
    page.getByRole('button', { name: /^(?:open\s+)?(?:main\s+)?menu(?:\s+toggle)?$/i }),
    page.getByRole('button', { name: /toggle.*menu|menu.*toggle|open.*navigation/i }),
    page.locator('.elementor-menu-toggle[role="button"]'),
  ];
  for (const toggleGroup of toggles) {
    for (const toggle of await toggleGroup.all()) {
      if (!await toggle.isVisible()) continue;
      await toggle.click();
      await page.waitForTimeout(150);
      link = await visibleLink(page, menuLabel);
      if (link) return link;
    }
  }
  throw new Error(`The visible menu could not expose a link named ${menuLabel}`);
}

try {
  const assetContext = await browser.newContext();
  const page = await assetContext.newPage();
  page.on('pageerror', error => diagnostics.push({ page: page.url(), type: 'exception', message: error.message }));
  page.on('console', message => {
    if (message.type() === 'error') diagnostics.push({ page: page.url(), type: 'console', message: message.text(), source: message.location().url });
  });
  page.on('requestfailed', request => diagnostics.push({ page: page.url(), type: 'request', url: request.url(), message: request.failure()?.errorText }));
  await check('deployed lab assets and ES modules return their expected file types under the live path', async () => {
    for (const [path, mime] of [
      ['index.html', /text\/html/], ['play.html', /text\/html/],
      ['game.js', /javascript|ecmascript/], ['game-engine.js', /javascript|ecmascript/],
      ['questions.js', /javascript|ecmascript/], ['brand.js', /javascript|ecmascript/],
      ['style.css', /text\/css/], ['brand.css', /text\/css/],
      ['assets/htsg-logo.png', /image\/png/], ['assets/favicon.png', /image\/png/],
    ]) {
      const url = new URL(path, labURL).href;
      const response = await page.request.get(url);
      const contentType = response.headers()['content-type'] || '';
      network.push({ url, status: response.status(), contentType });
      assert.equal(response.status(), 200, url);
      assert.match(contentType, mime, url);
    }
  });
  await check('live game loads its security policy and module graph without script errors', async () => {
    const response = await page.goto(new URL('play.html?game=invaders', labURL).href);
    assert.equal(response.status(), 200);
    await page.waitForFunction(() => document.querySelector('#title')?.textContent === 'Agency Invaders');
    const policy = response.headers()['content-security-policy'] || await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    assert.ok(policy, 'The published build provides its security policy');
    await page.locator('#start').click();
    assert.equal(await page.locator('#pause').isEnabled(), true);
    await page.locator('#pause').click();
    assert.match(await page.locator('#status').textContent(), /paused/i);
    assert.deepEqual(diagnostics.filter(item => item.type === 'exception'), []);
  });
  await check('public static adapter preserves HEAD, canonical URLs, denied methods and scoped 404 responses', async () => {
    const head = await page.request.head(new URL('game.js', labURL).href);
    assert.equal(head.status(), 200);
    assert.match(head.headers()['content-type'] || '', /javascript|ecmascript/);
    assert.equal((await head.body()).length, 0);
    const canonical = await page.request.get(labURL.replace(/\/$/, ''), { maxRedirects: 0 });
    assert.equal(canonical.status(), 301);
    assert.equal(new URL(canonical.headers().location, labURL).href, labURL);
    // The adapter rejects this empty request before serving any static file.
    // No form, contact endpoint, account, or WordPress mutation is involved.
    const denied = await page.request.post(labURL, { data: '' });
    assert.equal(denied.status(), 405);
    assert.match(denied.headers().allow || '', /GET/);
    assert.match(denied.headers().allow || '', /HEAD/);
    const missing = await page.request.get(new URL('qa-missing/nested-page', labURL).href);
    assert.equal(missing.status(), 404);
    assert.match(await missing.text(), /Page not found/);
    assert.ok((await missing.text()).includes(new URL('style.css', labURL).pathname));
  });
  await assetContext.close();

  for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
    const mobile = viewport.width < 600 || viewport.height < 500;
    const context = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', error => diagnostics.push({ page: page.url(), type: 'exception', message: error.message }));
    await check(`${viewport.width}px HTSG menu opens the public demos page`, async () => {
      const response = await page.goto(siteURL);
      assert.equal(response.status(), 200);
      await noOverflow(page);
      const link = await revealMenuLink(page);
      const href = await link.evaluate(element => element.href);
      assert.equal(normalized(href), normalized(demosURL));
      await page.screenshot({ path: resolve(output, `htsg-menu-${viewport.width}.png`), fullPage: true });
      if (mobile) await link.tap(); else await link.click();
      await page.waitForURL(url => normalized(url.href) === normalized(demosURL));
      await noOverflow(page);
      await page.screenshot({ path: resolve(output, `htsg-demos-${viewport.width}.png`), fullPage: true });
    });
    await check(`${viewport.width}px Demos dropdown exposes the lab as its first working entry`, async () => {
      await page.goto(siteURL);
      await revealMenuLink(page);
      const toggle = page.locator('button[aria-controls="mega-demos"]');
      await toggle.click();
      assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
      const choices = page.locator('#mega-demos .mega-links > a');
      assert.equal(await choices.count(), 8, 'The lab is added alongside the existing seven demos');
      const existingPaths = await choices.evaluateAll(links => links.slice(1).map(link => new URL(link.href).pathname));
      assert.deepEqual(existingPaths, ['/demos/exhibitor-operations/', '/demos/all-in-advisors/', '/custom-pools-preview/', '/demos/insights/', '/demos/question-to-project-brief/', '/demos/inquiry-to-reviewed-reply/', '/demos/regional-lead-handoff/']);
      const lab = choices.first();
      assert.match(await lab.textContent(), /^Gamification Labs/);
      assert.equal(normalized(await lab.evaluate(element => element.href)), normalized(labURL));
      await lab.scrollIntoViewIfNeeded();
      await page.waitForTimeout(220);
      await page.waitForFunction(() => [...document.querySelectorAll('#mega-demos a')].filter(link => link.getClientRects().length).every(link => Number(getComputedStyle(link).opacity) >= 0.99));
      await page.screenshot({ path: resolve(output, `htsg-demos-dropdown-${viewport.width}.png`) });
      if (mobile) await lab.tap(); else await lab.click();
      await page.waitForURL(url => normalized(url.href) === normalized(labURL));
      assert.equal(await page.locator('a[href*="game="]').count(), 3);
      await noOverflow(page);
      if (viewport.width === 1280) {
        await page.goto(demosURL);
        await page.screenshot({ path: resolve(output, 'htsg-demos-1280.png'), fullPage: true });
      }
    });
    await check(`${viewport.width}px demos gallery leads to the working three-game lab`, async () => {
      await page.goto(demosURL);
      for (const mode of ['invaders', 'runner', 'trivia']) {
        const direct = page.locator(`main a[href*="game=${mode}"]`);
        assert.equal(await direct.count(), 1, `Demos includes one direct ${mode} link`);
        const href = await direct.evaluate(element => element.href);
        assert.equal(new URL(href).pathname, new URL('play.html', labURL).pathname);
        assert.equal((await page.request.get(href)).status(), 200);
      }
      const links = page.locator('a[href]');
      let destination;
      for (const link of await links.all()) {
        const href = await link.evaluate(element => element.href);
        if (normalized(href) === normalized(labURL) && await link.isVisible()) {
          destination = link;
          break;
        }
      }
      assert.ok(destination, 'A visible demos-gallery link opens the lab');
      const href = await destination.evaluate(element => element.href);
      const response = await page.goto(href);
      assert.equal(response.status(), 200);
      for (const mode of ['invaders', 'runner', 'trivia']) {
        const route = page.locator(`a[href*="game=${mode}"]`);
        assert.equal(await route.count(), 1);
        const gameURL = await route.evaluate(element => element.href);
        assert.equal(new URL(gameURL).origin, new URL(labURL).origin);
        assert.equal(new URL(gameURL).pathname, new URL('play.html', labURL).pathname);
      }
      await noOverflow(page);
      await page.screenshot({ path: resolve(output, `live-lab-${viewport.width}.png`), fullPage: true });
    });
    await check(`${viewport.width}px lab returns to all demos and the Rocket Menu`, async () => {
      await page.goto(siteURL);
      const footerLab = page.locator('footer').getByRole('link', { name: 'Gamification Labs', exact: true });
      assert.equal(normalized(await footerLab.evaluate(element => element.href)), normalized(labURL));
      if (mobile) await footerLab.tap(); else await footerLab.click();
      await page.waitForURL(url => normalized(url.href) === normalized(labURL));
      const allDemos = page.locator('header').getByRole('link', { name: 'All demos', exact: true });
      assert.equal(await allDemos.isVisible(), true);
      assert.equal(normalized(await allDemos.evaluate(element => element.href)), normalized(demosURL));
      const rocket = page.locator('footer').getByRole('link', { name: 'The Rocket Menu', exact: true });
      const rocketURL = new URL('/menu/', siteURL).href;
      assert.equal(normalized(await rocket.evaluate(element => element.href)), normalized(rocketURL));
      if (mobile) await rocket.tap(); else await rocket.click();
      await page.waitForURL(url => normalized(url.href) === normalized(rocketURL));
      assert.equal((await page.request.get(page.url())).status(), 200);
      await page.goto(labURL);
      if (mobile) await allDemos.tap(); else await allDemos.click();
      await page.waitForURL(url => normalized(url.href) === normalized(demosURL));
    });
    await context.close();
  }
} finally {
  await browser.close();
  const generatedAt = new Date().toISOString();
  const report = JSON.stringify({ generatedAt, siteURL, demosURL, labURL, menuLabel, filter: testFilter, browser: `Chrome ${browserVersion}`, mobileMode: 'Chromium touch and viewport emulation; no physical-device or Safari verification', results, network, diagnostics }, null, 2);
  await writeFile(resolve(output, 'results.json'), report);
  await writeFile(resolve(output, `results-${generatedAt.replaceAll(':', '-').replaceAll('.', '-')}.json`), report);
}
if (results.some(result => !result.passed)) process.exitCode = 1;
