import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const args = process.argv.slice(2);
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback;
const output = resolve(root, option('--output', 'artifacts/gamification-qa'));
await mkdir(output, { recursive: true });
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.webp':'image/webp', '.svg':'image/svg+xml' };
const server = args.includes('--url') ? null : createServer(async (request, response) => {
  try {
    const path = new URL(request.url, 'http://localhost').pathname;
    assert.ok(/^\/[a-zA-Z0-9/._-]*$/.test(path) && !path.includes('..'));
    const file = resolve(root, 'public', `.${path === '/' ? '/index.html' : path}`);
    const bytes = await readFile(file);
    response.writeHead(200, { 'Content-Type':mime[extname(file)] || 'application/octet-stream' }).end(bytes);
  } catch { response.writeHead(404).end(); }
});
if (server) await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = option('--url', server ? `http://127.0.0.1:${server.address().port}` : '').replace(/\/+$/,'');
const browser = await chromium.launch({ headless:true, executablePath:process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined });
const results = [], observations = [], errors = [];
async function check(name, action) {
  try { await action(); results.push({name,passed:true}); console.log(`PASS ${name}`); }
  catch(error) { results.push({name,passed:false,message:error.message}); console.error(`FAIL ${name}: ${error.message}`); }
}
async function fits(page) {
  const geometry = await page.evaluate(() => {
    const rect = node => { const box=node.getBoundingClientRect(); return {x:box.x,y:box.y,right:box.right,bottom:box.bottom,width:box.width,height:box.height}; };
    return { viewport:{width:innerWidth,height:innerHeight}, overflow:document.documentElement.scrollWidth>innerWidth+1,
      canvas:rect(document.getElementById('canvas')), hud:rect(document.getElementById('mission-detail')),
      controls:[...document.querySelectorAll('#controls button,#steering-pad')].filter(node=>node.getClientRects().length).map(rect) };
  });
  assert.equal(geometry.overflow,false);
  assert.ok(geometry.hud.x>=0 && geometry.hud.right<=geometry.viewport.width+1 && geometry.hud.bottom<=geometry.canvas.bottom);
  for(const box of [geometry.canvas,...geometry.controls]) assert.ok(box.x>=-1 && box.y>=-1 && box.right<=geometry.viewport.width+1 && box.bottom<=geometry.viewport.height+1,'Canvas and controls fit together');
  return geometry;
}
try {
  for(const viewport of [{width:390,height:844},{width:1280,height:900}]) {
    const context=await browser.newContext({viewport,isMobile:viewport.width<600,hasTouch:viewport.width<600,deviceScaleFactor:1});
    // Repeatable lane jitter; all kills and upgrades are earned by the
    // real running simulation. No score, enemy, weapon or timer state is set.
    await context.addInitScript(()=>{Math.random=()=>0.5;});
    await context.route('**/game-renderer.js*',async route=>{
      const url=new URL(route.request().url());
      if(url.searchParams.has('qa-original')) return route.continue();
      url.searchParams.set('qa-original','1');
      await route.fulfill({contentType:'text/javascript',body:`import * as original from ${JSON.stringify(url.href)}; export * from ${JSON.stringify(url.href)};
export function createRenderer(...args){const renderer=original.createRenderer(...args);return {loadImages:renderer.loadImages.bind(renderer),get imagesReady(){return renderer.imagesReady;},render(ctx,state,options){
if(state){window.__qaState=JSON.parse(JSON.stringify(state));window.__qaMaxBullets=Math.max(window.__qaMaxBullets||0,state.bullets?.length||0);const key=state.weaponLevel+':'+state.phase;if(key!==window.__qaLast){(window.__qaTrace||=[]).push({level:state.weaponLevel,phase:state.phase,kills:state.kills,elapsed:state.elapsed});window.__qaLast=key;}}
return renderer.render(ctx,state,options);}};}`});
    });
    const page=await context.newPage();
    page.on('pageerror',error=>errors.push(error.message));
    await check(`${viewport.width}px earned weapon progression, breather, bounded volleys and restart`,async()=>{
      await page.goto(`${base}/play.html?game=invaders`);
      await page.waitForFunction(()=>document.documentElement.dataset.artwork==='ready');
      await page.locator('#overlay-action').click();
      assert.match(await page.title(),/Agency Invaders/);
      assert.match(await page.locator('#mission-detail').textContent(),/Weapon 1/);
      await page.keyboard.down('Space');
      let aiming=true, heldDirection;
      const aimTask=(async()=>{
        while(aiming&&!page.isClosed()){
          const state=await page.evaluate(()=>window.__qaState);
          if(state?.ended) break;
          const target=state?.enemies.filter(enemy=>enemy.y>0 && enemy.y<state.playerY-75).sort((a,b)=>b.y-a.y)[0];
          const direction=target && Math.abs(target.x-state.player)>18 ? (target.x>state.player?'ArrowRight':'ArrowLeft') : undefined;
          if(direction!==heldDirection){if(heldDirection)await page.keyboard.up(heldDirection);if(direction)await page.keyboard.down(direction);heldDirection=direction;}
          await page.waitForTimeout(80);
        }
        if(heldDirection)await page.keyboard.up(heldDirection);
      })().catch(()=>{});
      await page.waitForFunction(()=>window.__qaState?.weaponLevel===2 && window.__qaState.bullets.filter(shot=>shot.weaponLevel===2).length>=2,undefined,{timeout:45000});
      const twin=await page.evaluate(()=>window.__qaState.bullets.filter(shot=>shot.weaponLevel===2).slice(-2));
      assert.equal(twin.length,2); assert.ok(twin[0].x!==twin[1].x && twin.every(shot=>shot.vx===0));
      assert.match(await page.locator('#mission-detail').textContent(),/Weapon 2.*Twin streams/);
      await page.waitForFunction(()=>window.__qaState?.weaponLevel===3 && window.__qaState.bullets.filter(shot=>shot.weaponLevel===3).length>=4,undefined,{timeout:45000});
      await page.waitForTimeout(230);
      aiming=false;await aimTask;
      const state=await page.evaluate(()=>window.__qaState);
      const quad=state.bullets.filter(shot=>shot.weaponLevel===3).slice(-4);
      assert.equal(quad.length,4);
      assert.ok(quad.some(shot=>shot.vx<0)&&quad.some(shot=>shot.vx>0));
      assert.ok(Math.max(...quad.map(shot=>shot.x))-Math.min(...quad.map(shot=>shot.x))>50);
      assert.match(await page.locator('#mission-detail').textContent(),/Weapon 3.*Quad spread/);
      const trace=await page.evaluate(()=>window.__qaTrace);
      assert.deepEqual([...new Set(trace.map(item=>item.level))],[1,2,3]);
      const breath=trace.find(item=>item.phase==='intermission');
      const resumed=trace.find(item=>item.phase==='wave' && breath && item.elapsed>breath.elapsed);
      assert.ok(breath && resumed && resumed.elapsed-breath.elapsed>=1.7,'A visible breather separates waves');
      const maximum=await page.evaluate(()=>window.__qaMaxBullets);
      assert.ok(maximum<=64,`Projectile list grew beyond a bounded active volley budget: ${maximum}`);
      const geometry=await fits(page);
      await page.screenshot({path:resolve(output,`invaders-quad-${viewport.width}.png`)});
      if(viewport.width<600){
        const pad=await page.locator('#steering-pad').boundingBox();
        const touch=await context.newCDPSession(page);
        const anchor={id:1,x:pad.x+pad.width/2,y:pad.y+pad.height/2};
        await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[anchor]});
        await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...anchor,x:anchor.x+24,y:anchor.y-24}]});
        await page.waitForTimeout(220);
        const moved=await page.evaluate(()=>window.__qaState);
        assert.ok(moved.player>state.player+15 && moved.playerY<state.playerY-15);
        assert.equal(moved.weaponLevel,3);
        await touch.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
        await page.setViewportSize({width:844,height:390});
        await page.waitForTimeout(100);
        await fits(page);
        await page.screenshot({path:resolve(output,'invaders-quad-844.png')});
      }
      await page.keyboard.up('Space');
      await page.locator('#pause').click();
      const frozen=await page.locator('#canvas').screenshot();
      await page.waitForTimeout(200);
      assert.deepEqual(await page.locator('#canvas').screenshot(),frozen);
      await page.locator('#start').click();
      const restarted=await page.evaluate(()=>window.__qaState);
      assert.equal(restarted.weaponLevel,1);assert.equal(restarted.kills,0);assert.equal(restarted.score,0);
      observations.push({viewport,trace,maximumBullets:maximum,quadVelocity:quad.map(shot=>shot.vx),earnedKills:state.kills,elapsed:state.elapsed,geometry});
    });
    await context.close();
  }
  await check('no focused gameplay browser exceptions',async()=>assert.deepEqual(errors,[]));
} finally {
  const browserVersion=browser.version();
  await browser.close();
  if(server) await new Promise(done=>server.close(done));
  await writeFile(resolve(output,'results.json'),JSON.stringify({generatedAt:new Date().toISOString(),baseURL:base,browserVersion,results,observations,errors,scope:'Seeded lane jitter and keyboard aiming for repeatability; no simulation state mutation. Actual held Fire, thumb gestures, earned kills and upgrades. Mobile Chromium emulation; no physical-device/Safari claim.'},null,2));
}
if(results.some(result=>!result.passed))process.exitCode=1;
