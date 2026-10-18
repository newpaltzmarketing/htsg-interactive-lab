import assert from 'node:assert/strict';
import { INVADER_RULES_VERSION } from '../public/game-engine.js';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';
const root = process.cwd();
const outputIndex = process.argv.indexOf('--output');
const output = resolve(root, outputIndex >= 0 ? process.argv[outputIndex + 1] : '../output/agency-invaders-community-2026-10-17/community-client-qa');
await mkdir(output, { recursive: true });
const challenge = { id: '2026-W42', rulesVersion: INVADER_RULES_VERSION, seed: 12345, world: { width: 960, height: 1669 }, maxSeconds: 300, tickRate: 120, trust: 'unverified' };
let session = { enabled: true, authenticated: true, member: true, nonce: 'fixture-nonce', flags: { google: true, challenges: true }, challenge, signInURL: '/community/sign-in/', memberURL: '/community/' };
let unavailable = false, failFinish = false, failStart = false, nextRun = 0;
const writes = [], results = [];
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg' };
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;
  const json = (data, status = 200) => res.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(data));
  if (path === '/community/session/') return json(session, unavailable ? 503 : 200);
  if (path.startsWith('/wp-json/htsg-community/v1/')) {
    let text = ''; for await (const chunk of req) text += chunk;
    writes.push({ path, method: req.method, headers: req.headers, body: JSON.parse(text || '{}') });
    if (path === '/wp-json/htsg-community/v1/runs') return failStart ? json({message:'Deliberate retry unavailable'},503) : json({ ...challenge, runId: (++nextRun).toString(16).padStart(64, '0') });
    if (path.endsWith('/finish')) return json({ accepted: true, trust: 'unverified' }, failFinish ? 503 : 200);
  }
  if (path === '/fixture.html') return res.writeHead(200, { 'Content-Type': 'text/html' }).end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><div id="community-mount" hidden></div><script type="module" src="community-client.js"></script></body></html>');
  try {
    assert.ok(/^\/[A-Za-z0-9/._-]+$/.test(path) && !path.includes('..'));
    const bytes = await readFile(resolve(root, 'public', `.${path}`));
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }).end(bytes);
  } catch { res.writeHead(404).end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch({ headless: true, executablePath: process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined });
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
async function check(name, test) { await test(); results.push({ name, passed: true }); console.log(`PASS ${name}`); }
try {
  await check('Network failure leaves the actual free game playable at the larger phone size', async () => {
    unavailable = true;
    await page.goto(`${base}/play.html?game=invaders&challenge=current`);
    await page.getByText('The weekly challenge could not be loaded. Start a free game below.').waitFor();
    await page.locator('#overlay-action').click();
    await page.locator('#arena-overlay').waitFor({ state: 'hidden' });
    assert.ok((await page.locator('#canvas').boundingBox()).height >= 678);
    unavailable = false;
  });
  await check('A new challenge starts only after a fresh authenticated run ticket', async () => {
    await page.goto(`${base}/fixture.html?game=invaders&challenge=current`);
    await page.evaluate(() => document.addEventListener('htsg:challenge-start', event => { window.testStart = event.detail; }));
    await page.getByRole('button', { name: 'Play the weekly challenge' }).click();
    await page.waitForFunction(() => !!window.testStart);
    assert.deepEqual(await page.evaluate(() => window.testStart), { seed: 12345, challengeId: '2026-W42', rulesVersion: INVADER_RULES_VERSION, durationSeconds: 300 });
    const sent = writes.at(-1); assert.equal(sent.headers['x-wp-nonce'], 'fixture-nonce'); assert.equal(sent.method, 'POST'); assert.deepEqual(sent.body, { challengeId: '2026-W42' });
  });
  await check('Result adapter converts engine results once and can retry the same ticket', async () => {
    failFinish = true;
    await page.evaluate(rulesVersion => document.dispatchEvent(new CustomEvent('htsg:run-result', { detail: { challengeId: '2026-W42', rulesVersion, score: 875, wave: 5, kills: 32, bossesDefeated: 1, elapsed: 90, reason: 'lives' } })), INVADER_RULES_VERSION);
    await page.getByRole('button', { name: 'Retry score submission' }).waitFor();
    const first = writes.at(-1);
    assert.deepEqual(first.body, { score: 875, wave: 5, kills: 32, bosses: 1, elapsedTicks: 10800 });
    failFinish = false;
    await page.getByRole('button', { name: 'Retry score submission' }).click();
    await page.getByText('Your challenge score is saved to the casual scoreboard.').waitFor();
    assert.equal(writes.at(-1).path, first.path); assert.deepEqual(writes.at(-1).body, first.body);
    await page.getByRole('button', { name: 'Try the challenge again' }).click();
    await page.waitForFunction(() => document.querySelector('#community-mount').hidden);
    assert.equal(nextRun, 2);
  });
  await check('Challenge restart shows a failed request, preserves free play and starts only with a fresh successful ticket', async () => {
    await page.goto(`${base}/play.html?game=invaders&challenge=current`);
    await page.getByRole('button',{name:'Play the weekly challenge'}).waitFor();
    await page.evaluate(()=>{window.retryStarts=[];document.addEventListener('htsg:run-start',event=>window.retryStarts.push(event.detail));document.dispatchEvent(new CustomEvent('htsg:challenge-start',{detail:{seed:1,challengeId:'incompatible',rulesVersion:'0.0.0',durationSeconds:300}}));});
    assert.equal(await page.evaluate(()=>window.retryStarts.length),0,'Incompatible rules cannot start the real controller');
    await page.getByRole('button',{name:'Play the weekly challenge'}).click();await page.locator('#arena-overlay').waitFor({state:'hidden'});const firstTicket=nextRun;
    await page.locator('#pause').click();await page.locator('#panel-restart').click();failStart=true;await page.locator('#restart-confirm-yes').click();
    await page.getByText('The community connection is unavailable. Your free game still works.').waitFor();assert.equal(await page.locator('#arena-overlay').isVisible(),true);assert.equal(await page.locator('#community-mount').isVisible(),true);assert.equal(await page.locator('#control-panel').isVisible(),false);assert.equal(nextRun,firstTicket,'Failed retry issues no replacement ticket');
    const free=page.locator('#free-play');await free.waitFor({state:'visible'});await free.scrollIntoViewIfNeeded();assert.equal(await free.evaluate(button=>{const r=button.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !!hit&&button.contains(hit);}),true,'Free play is reachable above the error');
    await free.click();await page.locator('#arena-overlay').waitFor({state:'hidden'});assert.equal(await page.evaluate(()=>window.retryStarts.at(-1).challengeId),null,'Recovery starts an ordinary free run');
    failStart=false;await page.goto(`${base}/play.html?game=invaders&challenge=current`);await page.getByRole('button',{name:'Play the weekly challenge'}).click();await page.locator('#arena-overlay').waitFor({state:'hidden'});const beforeRestart=nextRun;await page.locator('#pause').click();await page.locator('#panel-restart').click();await page.locator('#restart-confirm-yes').click();await page.waitForFunction(()=>document.getElementById('arena-overlay').hidden);assert.equal(nextRun,beforeRestart+1,'Successful restart receives a fresh ticket');assert.equal(await page.locator('#control-panel').isVisible(),false);
  });
  await check('No Google button appears when sign-in is unconfigured; external return URLs are rejected', async () => {
    session = { ...session, authenticated: false, member: false, nonce: null, flags: { google: false, challenges: true } };
    await page.goto(`${base}/fixture.html?game=invaders&challenge=current`);
    await page.getByRole('link', { name: 'Challenge & scores' }).waitFor();
    assert.equal(await page.getByRole('link', { name: 'Join with Google' }).count(), 0);
    session.flags.google = true; session.signInURL = 'https://unrelated.example/';
    await page.reload();
    assert.equal(await page.getByRole('link', { name: 'Join with Google' }).getAttribute('href'), '/community/');
  });
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'results.json'), JSON.stringify({ scope: 'Local network and result-adapter fixtures; actual gameplay is checked separately.', results, errors }, null, 2));
} finally { await browser.close(); await new Promise(done => server.close(done)); }
