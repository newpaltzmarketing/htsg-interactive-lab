import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { chromium } from 'playwright';
import { puzzles } from '../public/crossword-puzzles.js';
import { compilePuzzle } from '../public/crossword-engine.js';

const args = process.argv.slice(2), option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const output = resolve(option('--output', '../output/crossword-break-2026-10-22/evidence/source'));
const site = resolve(process.env.QA_SITE_DIR || 'public'), bank = puzzles.map(compilePuzzle);
await mkdir(output, { recursive: true });
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml', '.json':'application/json' };
const server = args.includes('--url') ? null : createServer(async (req, res) => {
  try { const path = new URL(req.url, 'http://localhost').pathname; assert.ok(/^\/[\w/.-]*$/.test(path) && !path.includes('..')); const file = resolve(site, '.' + (path === '/' ? '/index.html' : path)); res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream'); res.end(await readFile(file)); }
  catch { res.writeHead(404).end(); }
});
if (server) await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = option('--url', server ? `http://127.0.0.1:${server.address().port}` : '').replace(/\/$/, '');
const browser = await chromium.launch({ headless:true, executablePath: process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined });
const results = [], errors = [], observations = [];
let current;
async function check(name, action) { try { await action(); results.push({ name, passed:true }); console.log('PASS ' + name); } catch (error) { results.push({ name, passed:false, error:error.message }); console.log('FAIL ' + name + ': ' + error.message); if (current && !current.isClosed()) await current.screenshot({ path:resolve(output, `failure-${results.length}.png`), fullPage:true }).catch(() => {}); } }
async function context(viewport = { width:1280, height:900 }, blockedStorage = false) {
  const c = await browser.newContext({ viewport, isMobile:viewport.width < 600, hasTouch:viewport.width < 900 });
  if (blockedStorage) await c.addInitScript(() => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Disabled for QA', 'SecurityError'); } }); });
  const page = await c.newPage(); current = page; page.setDefaultTimeout(12000);
  page.on('pageerror', error => errors.push(error.message)); page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto(`${base}/crossword.html`); await page.locator('#crossword-grid[data-ready="true"]').waitFor(); await page.evaluate(() => document.fonts.ready);
  return { context:c, page };
}
const cell = (page, index) => page.locator(`.crossword-cell[data-index="${index}"]`);
const clue = (page, id) => page.locator(`.clue-button[data-entry="${id}"]`);
const letters = page => page.locator('.cell-letter').allTextContents();
async function clear(page) { await page.locator('#clear-puzzle').click(); await page.locator('#confirm-clear').click(); }
async function select(page, id) { await page.locator('#puzzle-picker').selectOption(id); assert.equal(await page.locator('#puzzle-picker').inputValue(), id); }
async function fill(page, puzzle) { for (const entry of puzzle.entries.across) { await clue(page, entry.id).click(); await page.keyboard.type(entry.answer); } }

try {
  for (const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:740},{width:844,height:390}]) await check(`${viewport.width}px readable grid, touch typing and no horizontal overflow`, async () => {
    const c = await context(viewport); try {
      const data = await c.page.evaluate(() => ({ overflow:document.documentElement.scrollWidth > innerWidth, cell:[...document.querySelectorAll('.crossword-cell')].map(n => ({ width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,label:n.getAttribute('aria-label') })), keys:[...document.querySelectorAll('#touch-keyboard button')].map(n => ({ width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height })), navigation:[...document.querySelectorAll('.icon-control')].map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height})), tabbable:document.querySelectorAll('.crossword-cell[tabindex="0"]').length, inputs:document.querySelectorAll('input,textarea').length }));
      assert.equal(data.overflow,false); assert.equal(data.tabbable,1); assert.equal(data.inputs,0,'Touch letters do not summon an obstructing native keyboard');
      assert.ok(data.cell.every(c => c.width >= 44 && c.height >= 44 && /Row \d, column \d.*\d (across|down), \d letters/.test(c.label)));
      assert.ok(data.keys.every(c => c.width >= 27 && c.height >= 44),'Familiar QWERTY letters retain phone-keyboard width and44px height');
      assert.ok(data.navigation.every(c=>c.width>=44&&c.height>=44));
      observations.push({viewport,...data}); await c.page.screenshot({path:resolve(output,`crossword-${viewport.width}.png`),fullPage:true});
      await clue(c.page,bank[0].entries.down[0].id).click();
      for(const letter of bank[0].entries.down[0].answer){await c.page.locator(`[data-letter="${letter}"]`).click();if(viewport.width<600||viewport.height<540){assert.equal(await c.page.evaluate(()=>{const clue=document.getElementById('active-clue').getBoundingClientRect(),grid=document.getElementById('crossword-grid').getBoundingClientRect(),keys=document.getElementById('touch-keyboard').getBoundingClientRect();return clue.top>=-1&&grid.bottom<=innerHeight&&keys.bottom<=innerHeight;}),true,'Actual upper, middle and lower keyboard rows keep the word editor visible');}}
      if(viewport.width<600||viewport.height<540){const editor=await c.page.evaluate(()=>{const rect=id=>{const r=document.getElementById(id).getBoundingClientRect();return{top:r.top,bottom:r.bottom};};return{clue:rect('active-clue'),grid:rect('crossword-grid'),keys:rect('touch-keyboard'),height:innerHeight};});assert.ok(editor.clue.top>=-1&&editor.grid.bottom<=editor.height&&editor.keys.bottom<=editor.height,'Deliberate clue selection brings clue, grid and letter keys into view');observations.push({viewport,editor});}
      await c.page.screenshot({path:resolve(output,`letter-keys-${viewport.width}.png`)});
    } finally { await c.context.close(); }
  });
  await check('native keyboard moves, toggles direction, erases and advances clues without trapping Tab', async () => {
    const c = await context(); try {
      const p = bank[0], entry = p.entries.across[0]; await select(c.page,p.id); await clue(c.page,entry.id).click(); await c.page.keyboard.type('AB'); await c.page.keyboard.press('Backspace');
      assert.equal(await cell(c.page,entry.cells[0]).locator('.cell-letter').textContent(),'A'); assert.equal(await cell(c.page,entry.cells[1]).locator('.cell-letter').textContent(),'');
      await c.page.keyboard.press('ArrowDown'); assert.match(await c.page.locator('#active-clue-label').textContent(),/Down/); await c.page.keyboard.press('Space'); assert.match(await c.page.locator('#active-clue-label').textContent(),/Across/);
      const before = await c.page.locator('.clue-button[aria-current="true"]').getAttribute('data-entry'); await c.page.keyboard.press('Enter'); assert.notEqual(await c.page.locator('.clue-button[aria-current="true"]').getAttribute('data-entry'),before);
      await c.page.keyboard.press('Tab'); assert.equal(await c.page.locator('#crossword-grid').evaluate(n => n.contains(document.activeElement)),false);
      await cell(c.page,entry.cells[0]).click(); const direction = await c.page.locator('#active-clue-label').textContent(); await cell(c.page,entry.cells[0]).click(); assert.notEqual(await c.page.locator('#active-clue-label').textContent(),direction);
    } finally { await c.context.close(); }
  });
  await check('three original puzzles solve through real keyboard controls and remain checked after reload', async () => {
    const c = await context(); try {
      for (const puzzle of bank) {
        await select(c.page,puzzle.id); await clear(c.page); await fill(c.page,puzzle);
        assert.equal(await c.page.locator('#completion').isVisible(),true); assert.equal(await c.page.locator('.crossword-cell.checked-cell').count(),puzzle.cells.filter(c=>!c.isBlock).length);
        await c.page.reload(); await c.page.locator('#crossword-grid[data-ready="true"]').waitFor(); assert.equal(await c.page.locator('#puzzle-picker').inputValue(),puzzle.id); assert.equal(await c.page.locator('#completion').isVisible(),true);
        await c.page.screenshot({path:resolve(output,`complete-${puzzle.id}.png`),fullPage:true});
      }
      const previous = await c.page.locator('#puzzle-picker').inputValue(); await c.page.locator('#next-puzzle').click(); assert.notEqual(await c.page.locator('#puzzle-picker').inputValue(),previous);
    } finally { await c.context.close(); }
  });
  await check('phone touch checks and reveals one letter; clear cancellation, persistence and puzzle switching preserve work', async () => {
    const c = await context({width:390,height:844}); try {
      const puzzle = bank[0], entry = puzzle.entries.across[0], first = entry.cells[0], wrong = entry.answer[0] === 'Z' ? 'X':'Z';
      await select(c.page,puzzle.id); await clue(c.page,entry.id).tap(); await c.page.locator(`[data-letter="${wrong}"]`).tap(); await c.page.locator('#check-word').tap(); assert.ok(await c.page.locator('.incorrect-cell').count() > 0); assert.match(await c.page.locator('#feedback').textContent(),/another look/);
      await cell(c.page,first).tap(); await c.page.locator('#reveal-letter').tap(); assert.equal(await cell(c.page,first).locator('.cell-letter').textContent(),entry.answer[0]); assert.equal(await c.page.locator('.revealed-cell').count(),1);
      const saved = await letters(c.page); await c.page.locator('#clear-puzzle').tap(); await c.page.locator('#cancel-clear').tap(); assert.deepEqual(await letters(c.page),saved);
      await c.page.locator('#clear-puzzle').click(); await c.page.keyboard.press('Escape'); assert.equal(await c.page.locator('#clear-confirm').isVisible(),false); assert.deepEqual(await letters(c.page),saved);
      await select(c.page,bank[1].id); await select(c.page,puzzle.id); assert.deepEqual(await letters(c.page),saved); await c.page.reload(); await c.page.locator('#crossword-grid[data-ready="true"]').waitFor(); assert.deepEqual(await letters(c.page),saved); assert.equal(await c.page.locator('#save-status').getAttribute('data-storage'),'saved');
      await clear(c.page); assert.ok((await letters(c.page)).every(letter=>letter===''));
    } finally { await c.context.close(); }
  });
  await check('blocked storage is reported honestly and retains in-page puzzle work without throwing', async () => {
    const c = await context({width:320,height:740},true); try {
      assert.equal(await c.page.locator('#save-status').getAttribute('data-storage'),'blocked'); assert.match(await c.page.locator('#save-status').textContent(),/while this page is open/);
      await clue(c.page,bank[0].entries.across[0].id).tap(); await c.page.locator('[data-letter="A"]').tap(); const before = await letters(c.page); await select(c.page,bank[1].id); await select(c.page,bank[0].id); assert.deepEqual(await letters(c.page),before);
      await c.page.reload(); await c.page.locator('#crossword-grid[data-ready="true"]').waitFor(); assert.ok((await letters(c.page)).every(letter=>letter===''),'Blocked browser storage cannot promise persistence after reload');
    } finally { await c.context.close(); }
  });
  await check('four-game navigation is direct and menu Escape restores its trigger', async () => {
    const c = await context({width:320,height:740}); try { assert.equal(await c.page.locator('.game-option').count(),4); assert.equal(await c.page.locator('#previous-game').getAttribute('href'),'play.html?game=trivia'); assert.equal(await c.page.locator('#next-game').getAttribute('href'),'play.html?game=invaders'); await c.page.locator('#game-picker summary').click(); assert.equal(await c.page.locator('#game-picker').getAttribute('open'),''); await c.page.keyboard.press('Escape'); assert.equal(await c.page.locator('#game-picker summary').evaluate(n=>n===document.activeElement),true); assert.equal(await c.page.locator('#game-picker').getAttribute('open'),null); } finally { await c.context.close(); }
  });
  await check('no crossword browser exceptions or console errors', async () => assert.deepEqual(errors,[]));
} finally {
  await writeFile(resolve(output,'results.json'),JSON.stringify({generatedAt:new Date().toISOString(),browser:browser.version(),results,observations,errors,scope:'Actual native keyboard and Chromium touch emulation through the complete crossword UI. Three authored puzzles are solved using their public answers; no controller/state mocks. Local storage denial is deliberately injected. No forms, accounts, submissions or production writes; no physical iOS/Android or screen-reader certification.'},null,2));
  await browser.close(); if(server) await new Promise(done=>server.close(done));
}
if(results.some(result=>!result.passed)) process.exitCode=1;
