import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteURL = new URL(process.argv[2]);
if (!['https:', 'http:'].includes(siteURL.protocol) || siteURL.username || siteURL.password) throw new Error('Use a public HTTP(S) site');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const candidate = process.argv.includes('--candidate-flex-start');
const output = resolve(root, 'artifacts', candidate ? 'menu-review-candidate' : 'menu-review');
await mkdir(output, { recursive: true });
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = process.env.CHROME_PATH || (process.platform === 'win32' && existsSync(chrome) ? chrome : undefined);
const browser = await chromium.launch({ headless: true, ...(executablePath ? { executablePath } : {}) });
const results = [];
try {
  for (const viewport of [{ width: 320, height: 740 }, { width: 844, height: 390 }]) {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
    const page = await context.newPage();
    await page.goto(siteURL.href);
    if (candidate) await page.addStyleTag({ content: '@media (max-width:1200px) { body.htsg-site .site-nav { justify-content: flex-start; } }' });
    await page.getByRole('button', { name: 'Menu', exact: true }).click();
    await page.locator('button[aria-controls="mega-demos"]').click();
    const link = page.locator('#mega-demos .mega-links > a').first();
    async function observe(stage) {
      const detail = await link.evaluate(element => {
        const box = element.getBoundingClientRect();
        const target = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        const ancestors = [];
        let parent = element.parentElement;
        while (parent) {
          const bounds = parent.getBoundingClientRect();
          const style = getComputedStyle(parent);
          ancestors.push({ tag: parent.tagName, id: parent.id, className: parent.className, overflow: style.overflowY, position: style.position, display: style.display, flexDirection: style.flexDirection, justifyContent: style.justifyContent, alignItems: style.alignItems, flexShrink: style.flexShrink, transform: style.transform, marginTop: style.marginTop, scrollTop: parent.scrollTop, scrollHeight: parent.scrollHeight, clientHeight: parent.clientHeight, top: bounds.top, bottom: bounds.bottom });
          parent = parent.parentElement;
        }
        return { windowScrollY: scrollY, focused: document.activeElement?.outerHTML.slice(0, 240), link: { x: box.x, y: box.y, width: box.width, height: box.height, bottom: box.bottom }, hit: target?.outerHTML.slice(0, 240), hittable: Boolean(target && element.contains(target)), ancestors };
      });
      results.push({ viewport, stage, ...detail });
      await page.screenshot({ path: resolve(output, `menu-${viewport.width}-${stage}.png`) });
      return detail;
    }
    await observe('natural-open');
    await page.keyboard.press('Tab');
    await observe('keyboard-tab');
    const touch = await context.newCDPSession(page);
    await touch.send('Input.synthesizeScrollGesture', { x: viewport.width / 2, y: viewport.height - 80, yDistance: 120, gestureSourceType: 'touch', speed: 600 });
    await observe('touch-scroll-up');
    await touch.send('Input.synthesizeScrollGesture', { x: viewport.width / 2, y: viewport.height - 80, yDistance: -120, gestureSourceType: 'touch', speed: 600 });
    await observe('touch-scroll-down');
    await touch.detach();
    await link.scrollIntoViewIfNeeded();
    await observe('automatic-scroll');
    await link.evaluate(element => {
      let parent = element.parentElement;
      while (parent) {
        if (parent.scrollHeight > parent.clientHeight && ['auto', 'scroll'].includes(getComputedStyle(parent).overflowY)) {
          parent.scrollBy({ top: -160, behavior: 'instant' });
          return;
        }
        parent = parent.parentElement;
      }
      window.scrollBy({ top: -160, behavior: 'instant' });
    });
    const adjusted = await observe('scroll-adjusted');
    if (adjusted.hittable) {
      await page.touchscreen.tap(adjusted.link.x + adjusted.link.width / 2, adjusted.link.y + adjusted.link.height / 2);
      await page.waitForURL(/\/demos\/interactive-lab\/$/);
      results.push({ viewport, stage: 'touch-navigation', passed: true, url: page.url() });
    }
    await context.close();
  }
} finally {
  await browser.close();
}
const report = { generatedAt: new Date().toISOString(), siteURL: siteURL.href, results };
await writeFile(resolve(output, 'results.json'), JSON.stringify(report, null, 2));
for (const result of results) console.log(`${result.viewport.width}px ${result.stage}: ${result.stage === 'touch-navigation' ? `navigation=${result.passed}` : `hittable=${result.hittable}, link top=${Math.round(result.link.y)}, scroll=${result.windowScrollY}`}`);
console.log(`Report: ${resolve(output, 'results.json')}`);
