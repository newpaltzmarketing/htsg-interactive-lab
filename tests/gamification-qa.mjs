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
let activePage;
async function check(name, action) {
  try { await action(); results.push({name,passed:true}); console.log(`PASS ${name}`); }
  catch(error) {
    results.push({name,passed:false,message:error.message}); console.error(`FAIL ${name}: ${error.message}`);
    if(activePage&&!activePage.isClosed()){
      const detail=await activePage.evaluate(()=>({state:window.__qaState,boss:window.__qaBoss,trace:window.__qaTrace,aimError:window.__qaAimError,focus:document.activeElement?.id,status:document.getElementById('status')?.textContent,inputs:['left','right','action'].map(id=>[id,document.getElementById(id)?.getAttribute('aria-pressed')])})).catch(()=>null);
      await writeFile(resolve(output,'failure.json'),JSON.stringify(detail,null,2));
      await activePage.screenshot({path:resolve(output,'failure.png')}).catch(()=>{});
    }
  }
}
async function fits(page) {
  const geometry = await page.evaluate(() => {
    const rect = node => { const box=node.getBoundingClientRect(); return {x:box.x,y:box.y,right:box.right,bottom:box.bottom,width:box.width,height:box.height}; };
    return { viewport:{width:innerWidth,height:innerHeight}, overflow:document.documentElement.scrollWidth>innerWidth+1,
      canvas:rect(document.getElementById('canvas')), hud:rect(document.getElementById('mission-detail')),
      dashboard:document.getElementById('weapon-dashboard')?.getClientRects().length ? rect(document.getElementById('weapon-dashboard')) : null,
      controls:[...document.querySelectorAll('#controls button')].filter(node=>node.getClientRects().length).map(rect) };
  });
  assert.equal(geometry.overflow,false);
  assert.ok(geometry.hud.x>=0 && geometry.hud.right<=geometry.viewport.width+1 && geometry.hud.bottom<=geometry.canvas.bottom);
  for(const box of [geometry.canvas,...geometry.controls]) assert.ok(box.x>=-1 && box.y>=-1 && box.right<=geometry.viewport.width+1 && box.bottom<=geometry.viewport.height+1,'Canvas and controls fit together');
  if(geometry.dashboard) assert.ok(geometry.dashboard.x>=0 && geometry.dashboard.right<=geometry.viewport.width && geometry.dashboard.bottom<=geometry.viewport.height,'Weapon and missile readouts fit in the compact dashboard');
  return geometry;
}
async function bossBarFits(page) {
  const layout=await page.evaluate(async()=>{
    const {bossHealthBarLayout}=await import(new URL('game-renderer.js?qa-original=1',location.href));
    const options=window.__qaRenderOptions;
    const bar=bossHealthBarLayout(window.__qaState,undefined,options);
    const overlaps=bar && options.reservedRects.some(rect=>bar.x<rect.x+rect.width && bar.x+bar.width>rect.x && bar.y<rect.y+rect.height && bar.y+bar.height>rect.y);
    return {viewport:{width:innerWidth,height:innerHeight},bar,overlaps,arena:window.__qaState.world};
  });
  assert.ok(layout.bar,'The active boss has a visible health bar');
  assert.equal(layout.overlaps,false,'Boss health stays clear of the actual status, mission and impact HUD');
  assert.ok(layout.bar.x>=0 && layout.bar.y>=0 && layout.bar.x+layout.bar.width<=layout.arena.width && layout.bar.y+layout.bar.height<=layout.arena.height,'Boss health fits within the game area');
  return layout;
}
try {
  for(const viewport of [{width:390,height:844},{width:1280,height:900}].filter(value=>!args.includes('--viewport') || String(value.width)===option('--viewport'))) {
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
if(state){window.__qaState=JSON.parse(JSON.stringify(state));window.__qaScene=state;window.__qaRenderOptions=JSON.parse(JSON.stringify(options));window.__qaMaxBullets=Math.max(window.__qaMaxBullets||0,state.bullets?.length||0);const key=state.weaponLevel+':'+state.wave+':'+state.phase;if(key!==window.__qaLast){(window.__qaTrace||=[]).push({level:state.weaponLevel,wave:state.wave,phase:state.phase,kills:state.kills,elapsed:state.elapsed});window.__qaLast=key;}
const drone=state.enemies?.find(enemy=>enemy.type==='drone'&&enemy.age>.05);if(drone){const scale=Math.min(4.5,Math.max(.65,state.world.height/540));(window.__qaPace||={})[state.wave]={quota:state.waveQuota,descent:(drone.y+58)/drone.age/scale};}
if(state.boss){const boss=window.__qaBoss||={maxHealth:state.boss.maxHealth,minimumHealth:state.boss.health,phases:[],maxHostileShots:0};boss.minimumHealth=Math.min(boss.minimumHealth,state.boss.health);if(!boss.phases.includes(state.boss.phase))boss.phases.push(state.boss.phase);boss.maxHostileShots=Math.max(boss.maxHostileShots,state.hostileShots?.length||0);boss.lastSeen=state.elapsed;}else if(window.__qaBoss&&state.phase==='intermission')window.__qaBoss.defeated=true;}
if(state){window.__qaMissiles||={maximumPairs:0,maximumActive:0,launched:false};window.__qaMissileIds||=new Set();for(const shot of state.missiles||[])window.__qaMissileIds.add(shot.id);window.__qaMissiles.launchedPairs=window.__qaMissileIds.size/2;window.__qaMissiles.maximumPairs=Math.max(window.__qaMissiles.maximumPairs,state.missilePairs||0);window.__qaMissiles.maximumActive=Math.max(window.__qaMissiles.maximumActive,state.missiles?.length||0);if(state.missiles?.length>=2)window.__qaMissiles.launched=true;if(window.__qaMissiles.maximumPairs>0&&state.missilePairs===0)window.__qaMissiles.depleted=true;}
return renderer.render(ctx,state,options);}};}`});
    });
    const page=await context.newPage();
    activePage=page;
    page.on('pageerror',error=>errors.push(error.message));
    const name=args.includes('--choice-only') ? `${viewport.width}px earned untimed weapon choice and background-input isolation` : `${viewport.width}px earned ${viewport.width<600?'focused':'spread'} choice, finite missiles${viewport.width===1280?', compounding waves and boss':''}, pause and restart`;
    await check(name,async()=>{
      await page.goto(`${base}/play.html?game=invaders`);
      await page.waitForFunction(()=>document.documentElement.dataset.artwork==='ready');
      await page.locator('#overlay-action').click();
      assert.match(await page.title(),/Agency Invaders/);
      assert.equal(await page.locator('#weapon-readout').textContent(),'Single shot');
      await page.keyboard.down('Space');
      let aiming=true, heldDirection;
      const aimTask=(async()=>{
        while(aiming&&!page.isClosed()){
          const input=await page.evaluate(()=>({state:window.__qaState,ammoSeen:window.__qaMissiles?.maximumPairs>0,left:document.getElementById('left').getAttribute('aria-pressed')==='true',right:document.getElementById('right').getAttribute('aria-pressed')==='true',action:document.getElementById('action').getAttribute('aria-pressed')==='true'}));
          const state=input.state;
          if(state?.ended) break;
          if(state?.phase==='choice'){
            if(heldDirection)await page.keyboard.up(heldDirection);
            heldDirection=undefined;
            await page.keyboard.up('Space');
            await page.waitForTimeout(80);
            continue;
          }
          if(!input.action){await page.keyboard.up('Space');await page.keyboard.down('Space');}
          const supply=!input.ammoSeen && state?.pickups?.find(pickup=>pickup.kind==='missiles' && pickup.y>state.playerY-state.world.height*.35);
          const target=state?.boss || supply || state?.enemies.filter(enemy=>enemy.y>0 && enemy.y<state.playerY-75).sort((a,b)=>b.y-a.y)[0];
          const direction=target && Math.abs(target.x-state.player)>18 ? (target.x>state.player?'ArrowRight':'ArrowLeft') : undefined;
          const released=direction && !input[direction==='ArrowLeft'?'left':'right'];
          if(direction!==heldDirection||released){if(heldDirection)await page.keyboard.up(heldDirection);if(direction)await page.keyboard.down(direction);heldDirection=direction;}
          await page.waitForTimeout(80);
        }
        if(heldDirection)await page.keyboard.up(heldDirection);
      })().catch(async error=>{await page.evaluate(message=>{window.__qaAimError=message;},error.message).catch(()=>{});errors.push(`Keyboard aiming: ${error.message}`);});
      await page.waitForFunction(()=>window.__qaState?.weaponLevel===2 && window.__qaState.bullets.filter(shot=>shot.weaponLevel===2).length>=2,undefined,{timeout:45000});
      const twin=await page.evaluate(()=>window.__qaState.bullets.filter(shot=>shot.weaponLevel===2).slice(-2));
      assert.equal(twin.length,2); assert.ok(twin[0].x!==twin[1].x && twin.every(shot=>shot.vx===0));
      assert.equal(await page.locator('#weapon-readout').textContent(),'Twin streams');
      await page.waitForFunction(()=>window.__qaState?.weaponLevel===3 && window.__qaState.bullets.filter(shot=>shot.weaponLevel===3).length>=4,undefined,{timeout:45000});
      await page.waitForTimeout(230);
      const state=await page.evaluate(()=>window.__qaState);
      const quad=state.bullets.filter(shot=>shot.weaponLevel===3).slice(-4);
      assert.equal(quad.length,4);
      assert.ok(quad.some(shot=>shot.vx<0)&&quad.some(shot=>shot.vx>0));
      assert.ok(Math.max(...quad.map(shot=>shot.x))-Math.min(...quad.map(shot=>shot.x))>50);
      assert.equal(await page.locator('#weapon-readout').textContent(),'Quad spread');
      const trace=await page.evaluate(()=>window.__qaTrace);
      assert.deepEqual([...new Set(trace.map(item=>item.level))],[1,2,3]);
      const breath=trace.find(item=>item.phase==='intermission');
      const resumed=trace.find(item=>item.phase==='wave' && breath && item.elapsed>breath.elapsed);
      assert.ok(breath && resumed && resumed.elapsed-breath.elapsed>=1.7,'A visible breather separates waves');
      const maximum=await page.evaluate(()=>window.__qaMaxBullets);
      assert.ok(maximum<=64,`Projectile list grew beyond a bounded active volley budget: ${maximum}`);
      const geometry=await fits(page);
      assert.equal(await page.locator('#steering-pad').count(),0);
      if(viewport.width===390) assert.ok(geometry.canvas.height>=666,'The phone arena gains at least60px over the former606px stage');
      await page.screenshot({path:resolve(output,`invaders-quad-${viewport.width}.png`)});
      await page.waitForFunction(()=>window.__qaState?.phase==='choice',undefined,{timeout:30000});
      await page.locator('#weapon-choice').waitFor({state:'visible'});
      assert.equal(await page.locator('#weapon-choice-title').evaluate(node=>node===document.activeElement),true,'The untimed choice is announced and receives focus');
      const choiceBefore=await page.evaluate(()=>window.__qaState);
      await page.waitForTimeout(220);
      assert.equal((await page.evaluate(()=>window.__qaState)).elapsed,choiceBefore.elapsed,'Taking time to choose does not advance hazards or the challenge clock');
      assert.equal(await page.locator('#controls').evaluate(node=>node.inert),true,'The choice makes background controls unavailable');
      const choiceState=await page.evaluate(()=>JSON.stringify(window.__qaScene));
      await page.keyboard.down('ArrowRight');
      await page.keyboard.down('Space');
      await page.waitForTimeout(80);
      await page.keyboard.up('ArrowRight');
      await page.keyboard.up('Space');
      assert.equal(await page.evaluate(()=>JSON.stringify(window.__qaScene)),choiceState,'Movement and Fire cannot alter the untimed choice state');
      await page.screenshot({path:resolve(output,`invaders-choice-${viewport.width}.png`)});
      const family=viewport.width<600?'focused':'spread';
      if(viewport.width<600)await page.locator(`#weapon-${family}`).tap();
      else await page.locator(`#weapon-${family}`).click();
      assert.equal(await page.locator('#weapon-choice').isVisible(),false);
      assert.equal(await page.locator('#canvas').evaluate(node=>node===document.activeElement),true);
      await page.waitForFunction(selected=>window.__qaState?.weaponFamily===selected && window.__qaState.bullets.filter(shot=>selected==='focused'?shot.kind==='lance':shot.weaponLevel===3).length>=2,family);
      const selected=await page.evaluate(()=>window.__qaState);
      assert.equal(selected.weaponLevel,3,'Choosing a family preserves the earned upgrade');
      assert.equal(await page.locator('#weapon-readout').textContent(),family==='focused'?'Twin lances':'Quad spread');
      if(family==='focused')assert.ok(selected.bullets.filter(shot=>shot.kind==='lance').slice(-2).every(shot=>shot.damage===3&&shot.vx===0),'Focused fire supplies stronger straight beams instead of a renamed spread');
      assert.equal(await page.locator('#controls').evaluate(node=>node.inert),false,'Selecting a weapon restores ordinary controls');
      if(args.includes('--choice-only')){aiming=false;await aimTask;observations.push({viewport,family,choiceElapsed:choiceBefore.elapsed,scope:'Earned wave-two choice; background keyboard isolation and selection only.'});return;}
      await page.waitForFunction(()=>window.__qaMissiles?.launched && window.__qaState.missiles.length>=2,undefined,{timeout:30000});
      const missiles=await page.evaluate(()=>({observed:window.__qaMissiles,state:window.__qaState,readout:document.getElementById('missile-readout').textContent}));
      assert.ok(missiles.observed.maximumPairs>0&&missiles.observed.maximumPairs<=4,'A real collected capsule loads a bounded missile supply');
      assert.ok(missiles.observed.maximumActive>=2&&missiles.observed.maximumActive<=8,'Side missiles launch as bounded pairs alongside primary fire');
      assert.match(missiles.readout,/^[0-4] missile pairs?$/);
      await fits(page);
      await page.screenshot({path:resolve(output,`invaders-${family}-missiles-${viewport.width}.png`)});
      await page.waitForFunction(()=>window.__qaMissiles?.depleted&&window.__qaMissiles.launchedPairs>=4,undefined,{timeout:10000});
      const ammunition=await page.evaluate(()=>window.__qaMissiles);
      const expansion={family,choiceElapsed:choiceBefore.elapsed,missilePairs:ammunition.maximumPairs,maximumMissiles:ammunition.maximumActive,launchedPairs:ammunition.launchedPairs,depleted:ammunition.depleted};
      let bossObservation;
      if(viewport.width===1280){
        await page.waitForFunction(()=>window.__qaState?.boss?.phase==='windup',undefined,{timeout:75000});
        const bossLabel=await page.evaluate(()=>window.__qaState.boss.label);
        assert.ok((await page.locator('#mission-detail').textContent()).includes(bossLabel),'The HUD identifies the active boss');
        await fits(page);
        const barLayouts=[await bossBarFits(page)];
        await page.screenshot({path:resolve(output,'invaders-boss-1280.png')});
        for(const rotated of [{width:390,height:844},{width:844,height:390},{width:568,height:320}]){
          await page.setViewportSize(rotated);
          await page.waitForTimeout(80);
          await fits(page);
          barLayouts.push(await bossBarFits(page));
          assert.equal((await page.evaluate(()=>window.__qaState)).weaponLevel,3,'Boss rotation retains the upgraded run');
          await page.screenshot({path:resolve(output,`invaders-boss-${rotated.width}.png`)});
        }
        await page.setViewportSize(viewport);
        if(heldDirection)await page.keyboard.up(heldDirection);
        heldDirection=undefined;
        await page.keyboard.up('Space');
        await page.keyboard.down('Space');
        await page.waitForFunction(()=>window.__qaBoss?.maxHostileShots>0,undefined,{timeout:10000});
        await page.waitForFunction(()=>window.__qaBoss?.defeated,undefined,{timeout:30000});
        const later=await page.evaluate(()=>({state:window.__qaState,pace:window.__qaPace,boss:window.__qaBoss,maximum:window.__qaMaxBullets}));
        assert.ok(later.pace[3].descent>later.pace[2].descent && later.pace[4].descent>later.pace[3].descent,'Actual post-Quad waves keep increasing hazard descent');
        assert.ok(later.pace[4].quota>later.pace[3].quota,'Later waves add more hazards');
        assert.ok(later.boss.phases.includes('windup') && later.boss.phases.includes('recover') && later.boss.minimumHealth<later.boss.maxHealth,'Boss telegraphs, attacks, recovers and takes real projectile damage');
        assert.ok(later.state.wave===5 && later.state.phase==='intermission' && later.state.weaponLevel===3,'The occasional boss yields a breather while preserving the weapon upgrade');
        assert.equal(later.state.bossesDefeated,1);
        assert.equal(later.state.shield,1,'Defeating the boss rewards a protective shield');
        assert.ok(later.maximum<=64,'Longer play keeps the projectile list bounded');
        bossObservation={pace:later.pace,boss:later.boss,kills:later.state.kills,elapsed:later.state.elapsed,maximumBullets:later.maximum,barLayouts};
        await page.screenshot({path:resolve(output,'invaders-boss-defeated-1280.png')});
      }
      aiming=false;await aimTask;
      if(viewport.width<600){
        const arena=await page.locator('#canvas').boundingBox();
        const touch=await context.newCDPSession(page);
        const anchor={id:1,x:arena.x+arena.width*.35,y:arena.y+arena.height*.65};
        const beforeTouch=await page.evaluate(()=>window.__qaState);
        await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[anchor]});
        await page.waitForTimeout(80);
        const contact=await page.evaluate(()=>window.__qaState);
        assert.ok(Math.abs(contact.player-beforeTouch.player)<1 && Math.abs(contact.playerY-beforeTouch.playerY)<1,'Contact does not teleport the ship');
        await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...anchor,x:anchor.x+50,y:anchor.y-35}]});
        await page.waitForTimeout(220);
        const moved=await page.evaluate(()=>window.__qaState);
        assert.ok(moved.player>beforeTouch.player+15 && moved.playerY<beforeTouch.playerY-15);
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
      if(viewport.width<600){
        await page.locator('#help-toggle').click();
        assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false','Original sound effects are off until explicitly enabled');
        await page.locator('#sound-toggle').click();
        assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'true');
        await page.locator('#sound-toggle').click();
        assert.equal(await page.locator('#sound-toggle').getAttribute('aria-pressed'),'false');
        await page.locator('#help-close').click();
      }
      let personalBest;
      if(viewport.width===1280){
        await page.locator('#pause').click();
        // Only the storage/controller boundary uses an ended-run fixture. The
        // score, upgrades, later waves and boss above were earned with inputs.
        personalBest=await page.evaluate(()=>{const scene=window.__qaScene;scene.ended=true;return scene.score;});
        await page.waitForFunction(()=>document.getElementById('start').textContent==='Again');
        assert.match(await page.locator('#overlay-hint').textContent(),new RegExp(`New personal best: ${personalBest} points`));
        await page.reload();
        await page.waitForFunction(()=>document.documentElement.dataset.artwork==='ready');
        assert.match(await page.locator('#overlay-hint').textContent(),new RegExp(`Best on this device: ${personalBest} points`),'Completed-run personal best survives a fresh page load');
      }
      await page.locator('#start').click();
      const restarted=await page.evaluate(()=>window.__qaState);
      assert.equal(restarted.weaponLevel,1);assert.equal(restarted.kills,0);assert.equal(restarted.score,0);
      observations.push({viewport,trace,maximumBullets:maximum,quadVelocity:quad.map(shot=>shot.vx),earnedKills:state.kills,elapsed:state.elapsed,geometry,expansion,...(bossObservation?{bossObservation}:{}),...(personalBest?{personalBest}: {})});
    });
    await context.close();
  }
  await check('no focused gameplay browser exceptions',async()=>assert.deepEqual(errors,[]));
} finally {
  const browserVersion=browser.version();
  await browser.close();
  if(server) await new Promise(done=>server.close(done));
  await writeFile(resolve(output,'results.json'),JSON.stringify({generatedAt:new Date().toISOString(),baseURL:base,browserVersion,results,observations,errors,scope:'Seeded lane jitter and keyboard aiming for repeatability. Earned kills, upgrades, wave-two weapon choice, missile collection/expenditure, later waves and boss use the unmodified simulation with actual held Fire and direct arena gestures. Sound checks verify the explicit default-off/toggle controls, not physical audio output. Only the personal-best controller/storage check marks the earned run ended, without changing its score. Mobile Chromium emulation; no physical-device/Safari claim.'},null,2));
}
if(results.some(result=>!result.passed))process.exitCode=1;
