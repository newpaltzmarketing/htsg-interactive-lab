import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const option = name => args[args.indexOf(name) + 1];
const siteURL = new URL(option('--url'));
if (!['https:', 'http:'].includes(siteURL.protocol) || siteURL.username || siteURL.password) throw new Error('Use a public HTTP(S) site');
const candidate = args.includes('--candidate-dir') ? resolve(option('--candidate-dir')) : null;
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'artifacts', candidate ? 'navigation-candidate' : 'navigation-live');
await mkdir(output, { recursive: true });
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && existsSync(chrome) ? chrome : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [];
const errors = [];
const panels = [
  ['products', 'Explore products & services', 'The Local Growth Site', 'Website care'],
  ['ai', 'Explore AI & automation', 'Website AI Chat Assistant', 'Prepare your business knowledge'],
  ['demos', 'Browse all demos', 'Gamification Labs', 'Lead handoff'],
  ['work', 'Browse all work', 'Customer response', 'Gunite Pool Design'],
  ['resources', 'Explore resources', 'All practical guides', 'Explore our capabilities'],
  ['company', 'Explore company', 'About HTSG', 'AI & Business Resource Library'],
];
async function check(name, action) {
  try { await action(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
  catch (error) { results.push({ name, passed: false, message: error.message }); console.error(`FAIL ${name}: ${error.message}`); }
}
async function settle(page, panelId) {
  await page.waitForTimeout(220);
  await page.waitForFunction(id => {
    const panel = document.getElementById(id);
    if (!panel || panel.hidden) return false;
    let node = panel;
    while (node) { if (Number(getComputedStyle(node).opacity) < 0.99) return false; node = node.parentElement; }
    return [...panel.querySelectorAll('a')].filter(link => link.getClientRects().length).every(link => Number(getComputedStyle(link).opacity) >= 0.99);
  }, panelId);
}
async function focusDetails(page) {
  return page.evaluate(() => {
    const element = document.activeElement;
    const box = element.getBoundingClientRect();
    const nav = document.getElementById('site-navigation');
    const navBox = nav.getBoundingClientRect();
    const style = getComputedStyle(element);
    return {
      tag: element.tagName, text: element.textContent.trim(), href: element.href,
      panel: element.closest('.mega')?.id,
      visible: box.width > 0 && box.height > 0 && style.visibility === 'visible' && Number(style.opacity) >= 0.99,
      withinScrollport: getComputedStyle(nav).overflowY !== 'auto' || (box.y >= navBox.y - 1 && box.bottom <= Math.min(innerHeight, navBox.bottom) + 1),
      focusIndicator: (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || style.boxShadow !== 'none',
    };
  });
}
try {
  for (const viewport of [{ width: 1280, height: 900 }, { width: 320, height: 740 }, { width: 844, height: 390 }]) {
    const mobile = viewport.width < 1200;
    const context = await browser.newContext({ viewport, hasTouch: mobile, isMobile: mobile, deviceScaleFactor: 1 });
    if (candidate) {
      for (const name of ['navigation-polish.css', 'flagship.js']) {
        const body = await readFile(resolve(candidate, name));
        await context.route(`**/htsg-headquarters/assets/${name}*`, route => route.fulfill({ status: 200, contentType: name.endsWith('.css') ? 'text/css' : 'text/javascript', body }));
      }
    }
    const page = await context.newPage();
    page.on('pageerror', error => errors.push({ width: viewport.width, message: error.message }));
    await page.goto(siteURL.href);
    if (!await page.locator('#site-navigation').isVisible()) await page.getByRole('button', { name: 'Menu', exact: true }).click();
    for (const [id, desktopFirst, mobileFirst, last] of panels) {
      await check(`${viewport.width}px ${id} ArrowDown/ArrowUp focuses visible first/last links`, async () => {
        const toggle = page.locator(`button[aria-controls="mega-${id}"]`);
        await toggle.focus();
        await page.keyboard.press('ArrowDown');
        await settle(page, `mega-${id}`);
        const first = await focusDetails(page);
        assert.equal(first.tag, 'A');
        assert.equal(first.panel, `mega-${id}`);
        assert.ok(first.text.startsWith(mobile ? mobileFirst : desktopFirst), JSON.stringify(first));
        assert.ok(first.visible && first.withinScrollport && first.focusIndicator, JSON.stringify(first));
        if (id === 'demos') await page.screenshot({ path: resolve(output, `demos-keyboard-${viewport.width}.png`) });
        await toggle.focus();
        await page.keyboard.press('ArrowUp');
        await settle(page, `mega-${id}`);
        const end = await focusDetails(page);
        assert.equal(end.tag, 'A');
        assert.equal(end.panel, `mega-${id}`);
        assert.ok(end.text.startsWith(last), JSON.stringify(end));
        assert.ok(end.visible && end.withinScrollport && end.focusIndicator, JSON.stringify(end));
        await page.keyboard.press('Escape');
        assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
      });
    }
    if (mobile) await check(`${viewport.width}px settled natural Demos link accepts a real touch`, async () => {
      await page.goto(siteURL.href);
      await page.getByRole('button', { name: 'Menu', exact: true }).click();
      await page.locator('button[aria-controls="mega-demos"]').click();
      await settle(page, 'mega-demos');
      const link = page.locator('#mega-demos .mega-links > a').first();
      await link.scrollIntoViewIfNeeded();
      await settle(page, 'mega-demos');
      await page.screenshot({ path: resolve(output, `demos-touch-${viewport.width}.png`) });
      await link.tap();
      await page.waitForURL(/\/demos\/interactive-lab\/$/);
      assert.equal(await page.locator('a[href*="game="]').count(), 3);
    });
    await context.close();
  }
  await check('navigation produces no browser exceptions', async () => assert.deepEqual(errors, []));
} finally {
  await browser.close();
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ generatedAt: new Date().toISOString(), siteURL: siteURL.href, candidate, results, errors }, null, 2));
}
if (results.some(result => !result.passed)) process.exitCode = 1;
