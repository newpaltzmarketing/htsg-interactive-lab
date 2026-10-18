import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const args=process.argv.slice(2),option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const root=process.cwd(),output=resolve(option('--output','../output/agency-invaders-polish-2026-10-17/evidence/source'));
await mkdir(output,{recursive:true});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
const server=args.includes('--url')?null:createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;assert.ok(/^\/[\w/.-]*$/.test(path)&&!path.includes('..'));const file=resolve(root,'public','.'+(path==='/'?'/index.html':path));res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream'}).end(await readFile(file));}catch{res.writeHead(404).end();}});
if(server)await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=option('--url',server?`http://127.0.0.1:${server.address().port}`:'').replace(/\/$/,'');
const browser=await chromium.launch({headless:true,executablePath:process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined});
const results=[],observations=[],errors=[];
async function check(name,action){try{await action();results.push({name,passed:true});console.log('PASS '+name);}catch(error){results.push({name,passed:false,error:error.message});console.log('FAIL '+name+': '+error.message);}}
async function instrument(context){
 await context.route('**/game-engine.js*',async route=>{
  const url=new URL(route.request().url());if(url.searchParams.has('polish-original'))return route.continue();url.searchParams.set('polish-original','1');
  await route.fulfill({contentType:'text/javascript',body:`import * as original from ${JSON.stringify(url.href)};export * from ${JSON.stringify(url.href)};export function stepInvaders(state,...args){if(window.__polishFixture){Object.assign(state,structuredClone(window.__polishFixture));return;}return original.stepInvaders(state,...args);}`});
 });
 await context.route('**/game-renderer.js*',async route=>{
  const url=new URL(route.request().url());if(url.searchParams.has('polish-original'))return route.continue();url.searchParams.set('polish-original','1');
  await route.fulfill({contentType:'text/javascript',body:`import * as original from ${JSON.stringify(url.href)};export * from ${JSON.stringify(url.href)};export function createRenderer(...args){const r=original.createRenderer(...args);return {loadImages:r.loadImages.bind(r),get imagesReady(){return r.imagesReady;},render(ctx,state,options){window.__polishState=state?structuredClone(state):null;window.__polishOptions=structuredClone(options);const before=JSON.stringify(state);const result=r.render(ctx,state,options);if(JSON.stringify(state)!==before)console.error('Renderer mutated fixture state');if(window.__polishHitboxes&&state){ctx.save();ctx.strokeStyle='#ff5d5d';ctx.lineWidth=2;for(const e of state.enemies){const p=original.hazardVisualGeometry(e,{reducedMotion:true});ctx.strokeRect(e.x-p.collision.halfWidth,e.y-p.collision.halfHeight,p.collision.halfWidth*2,p.collision.halfHeight*2);}ctx.restore();}return result;}};}`});
 });
}
async function fixture(page,kind){
 await page.evaluate(async kind=>{
  const engine=await import(new URL('game-engine.js?polish-original=1',location.href));const {width,height}=window.__polishState.world;
  const state=engine.createInvadersState({width,height});Object.assign(state,{elapsed:4.2,kills:14,score:240,weaponLevel:3,choiceMade:true,weaponFamily:'spread',wave:4});
  state.enemies=engine.INVADER_HAZARDS.map((hazard,index)=>({id:index+1,type:index===2?'heavy':index===3||index===5?'weaver':'drone',hazard,hazardId:hazard.id,label:hazard.label,scale:engine.INVADER_THREAT_SCALE,health:index===2?3:1,age:1.4,x:width*(index%2?.69:.31),y:height*(.23+Math.floor(index/2)*.15),baseX:width*(index%2?.69:.31)}));
  if(['scope-creep','change-request'].includes(kind)){
   const shape=engine.bossGeometry(state);state.enemies=[];state.phase='boss';state.wave=kind==='scope-creep'?5:10;
   state.boss={label:kind==='scope-creep'?'Scope Creep':'Change Request',x:width/2,y:shape.targetY,health:40,maxHealth:80,phase:'windup',attackIn:.55,age:3.2,attackCount:2,warningOffsets:kind==='scope-creep'?[-120,0,120]:[-60,60],pendingShots:[],aimX:state.player,aimY:state.playerY};
   state.hostileShots=[{x:width*.42,y:height*.48,vx:-30,vy:90,age:.3,radius:12,label:state.boss.label}];
  }
  state.bullets=[{x:state.player-25,y:state.playerY-110,previousY:state.playerY-100,vx:-30,weaponLevel:3},{x:state.player+25,y:state.playerY-110,previousY:state.playerY-100,vx:30,weaponLevel:3}];
  if(kind==='focused-missiles'){
   Object.assign(state,{weaponFamily:'focused',missilePairs:3,volleys:8,cooldown:.21});
   state.bullets=[-18,18].map(offset=>({x:state.player+offset,y:state.playerY-140,previousY:state.playerY-130,vx:0,weaponLevel:3,kind:'lance',damage:3}));
   state.missiles=[-55,55].map(offset=>({x:state.player+offset,y:state.playerY-215,previousY:state.playerY-200,vx:offset<0?-25:25,kind:'missile'}));
  }
  window.__polishFixtures||={};window.__polishFixtures[kind]=structuredClone(state);window.__polishFixture=state;
 },kind);
 await page.waitForTimeout(80);
}
try{
 for(const viewport of [{width:1280,height:900},{width:390,height:844},{width:320,height:740},{width:844,height:390}]){
  const context=await browser.newContext({viewport,hasTouch:viewport.width<900,isMobile:viewport.width<600});await instrument(context);const page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await check(`${viewport.width}px six object silhouettes, both bosses and stable paused/reduced rendering`,async()=>{
   await page.goto(base+'/play.html?game=invaders');await page.waitForFunction(()=>document.documentElement.dataset.artwork==='ready');await page.locator('#overlay-action').click();await page.waitForFunction(()=>window.__polishState);
   for(const kind of ['hazards','scope-creep','change-request',...([1280,390].includes(viewport.width)?['focused-missiles']:[])]){
    await fixture(page,kind);
    const data=await page.evaluate(async kind=>{
     const render=await import(new URL('game-renderer.js?polish-original=1',location.href));const engine=await import(new URL('game-engine.js?polish-original=1',location.href));
     const scene=structuredClone(window.__polishState),arena=engine.arenaFor(scene),options=window.__polishOptions;
     const canvas=document.getElementById('canvas'),box=canvas.getBoundingClientRect();const geometry=scene.enemies.map(e=>render.hazardVisualGeometry(e,{reducedMotion:false}));
     const bar=render.bossHealthBarLayout(scene,arena,options);const overlaps=bar&&options.reservedRects.some(r=>bar.x<r.x+r.width&&bar.x+bar.width>r.x&&bar.y<r.y+r.height&&bar.y+bar.height>r.y);
     return {kind,world:scene.world,geometry,bar,overlaps,boss:scene.boss?render.bossVisualPose(scene,{reducedMotion:false}):null,canvas:{x:box.x,y:box.y,right:box.right,bottom:box.bottom},overflow:document.documentElement.scrollWidth>innerWidth};
    },kind);
    assert.equal(data.overflow,false);assert.ok(data.canvas.x>=0&&data.canvas.y>=0&&data.canvas.right<=viewport.width+1&&data.canvas.bottom<=viewport.height+1);
    if(kind==='hazards'||kind==='focused-missiles'){
     assert.equal(data.geometry.length,6);assert.equal(new Set(data.geometry.map(g=>g.id)).size,6);
     assert.ok(data.geometry.every(g=>g.collision.halfWidth>0&&g.collision.halfHeight>0&&g.bounds.left>=0&&g.bounds.right<=data.world.width&&g.bounds.top>=0&&g.bounds.bottom<=data.world.height),'Six whole hazard silhouettes fit the arena');
     for(const [index,g]of data.geometry.entries()){assert.equal(g.collision.halfWidth,(index===2?39:32)*1.35,'Visual collision width matches unchanged heavy/normal engine body');assert.equal(g.collision.halfHeight,25*1.35,'Visual collision height matches engine body');}
    }else{assert.ok(data.bar);assert.equal(data.overlaps,false,'Boss health avoids actual HUD');assert.ok(data.boss);}
    observations.push({viewport,...data});
    await page.screenshot({path:resolve(output,`${kind}-fixture-${viewport.width}.png`)});
   }
   await page.locator('#pause').click();const frozen=await page.locator('#canvas').screenshot();await page.waitForTimeout(200);assert.deepEqual(await page.locator('#canvas').screenshot(),frozen,'Paused fixture freezes full rendered scene');
   const reduced=await page.evaluate(async()=>{
    const {createRenderer}=await import(new URL('game-renderer.js?polish-original=1',location.href));const r=createRenderer();await r.loadImages();const results=[];
    for(const [kind,fixture]of Object.entries(window.__polishFixtures)){const s=structuredClone(fixture),canvas=document.createElement('canvas');canvas.width=s.world.width;canvas.height=s.world.height;const ctx=canvas.getContext('2d');
     const paint=time=>{s.elapsed=time;if(s.boss)s.boss.age=time;for(const e of s.enemies)e.age=time;r.render(ctx,s,{...window.__polishOptions,reducedMotion:true,time});return canvas.toDataURL();};
     const first=paint(2),after=paint(9),before=JSON.stringify(s);r.render(ctx,s,{...window.__polishOptions,reducedMotion:true});results.push({kind,same:first===after,unchanged:before===JSON.stringify(s)});
    }return results;
   });
   assert.ok(reduced.every(r=>r.same),'Reduced motion removes decorative time-based motion for six hazards and both bosses');assert.ok(reduced.every(r=>r.unchanged),'Renderer does not mutate any fixture state');observations.push({viewport,reduced});
   if(viewport.width===390){
    await page.locator('#pause').click();await fixture(page,'hazards');await page.evaluate(()=>{window.__polishHitboxes=true;});await page.waitForTimeout(60);await page.screenshot({path:resolve(output,'hazards-collision-diagnostic-fixture-390.png')});await page.evaluate(()=>{window.__polishHitboxes=false;});
    await page.locator('#help-toggle').click();const entries=page.locator('#hazard-legend li');assert.equal(await entries.count(),6);const icons=[];for(const canvas of await entries.locator('canvas').all())icons.push(await canvas.evaluate(c=>c.toDataURL()));assert.equal(new Set(icons).size,6,'Help paints six distinct actual object sprites');await page.screenshot({path:resolve(output,'hazard-guide-390.png'),fullPage:true});
   }
  });
  await context.close();
 }
 await check('real firing sound is opt-in, bounded, paused and muted by the visible controls',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>{
   const Native=window.AudioContext;window.__polishAudio={starts:0,maximum:0,live:new Set(),contexts:[]};
   if(Native)window.AudioContext=class extends Native{
    constructor(...args){super(...args);window.__polishAudio.contexts.push(this);}
    createOscillator(){const voice=super.createOscillator(),start=voice.start.bind(voice),stop=voice.stop.bind(voice),audio=window.__polishAudio;
     voice.start=(...args)=>{audio.starts++;audio.live.add(voice);audio.maximum=Math.max(audio.maximum,audio.live.size);return start(...args);};
     voice.stop=(when)=>{if(when===undefined||when<=this.currentTime)audio.live.delete(voice);return stop(when);};voice.addEventListener('ended',()=>audio.live.delete(voice));return voice;}
   };
  });
  await instrument(context);const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  try{
   await page.goto(base+'/play.html?game=invaders');await page.waitForFunction(()=>document.documentElement.dataset.artwork==='ready');await page.locator('#overlay-action').click();
   const arena=await page.locator('#canvas').boundingBox(),cdp=await context.newCDPSession(page),anchor={id:1,x:arena.x+arena.width*.4,y:arena.y+arena.height*.7};
   const before=await page.evaluate(()=>window.__polishState);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[anchor]});await page.waitForTimeout(70);const contact=await page.evaluate(()=>window.__polishState);assert.ok(Math.abs(contact.player-before.player)<1&&Math.abs(contact.playerY-before.playerY)<1,'A new direct touch does not teleport the ship');
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...anchor,x:anchor.x+48,y:anchor.y-35}]});await page.waitForTimeout(220);const moved=await page.evaluate(()=>window.__polishState);assert.ok(moved.player>before.player+20&&moved.playerY<before.playerY-20,'Real direct touch moves on both axes');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   assert.equal(await page.locator('#action').getAttribute('aria-pressed'),'false','Ending a direct arena gesture releases Fire');
   await page.waitForTimeout(1700);await page.screenshot({path:resolve(output,'actual-touch-gameplay-390.png')});
   await page.keyboard.down('Space');await page.waitForTimeout(300);await page.keyboard.up('Space');assert.equal(await page.evaluate(()=>window.__polishAudio.starts),0,'Sound starts off');
   await page.locator('#help-toggle').click();const sound=page.locator('#sound-toggle'),box=await sound.boundingBox();assert.ok(box.y>=0&&box.y+box.height<=844,'Sound is accessible above the guide');
   await sound.click();assert.equal(await sound.getAttribute('aria-pressed'),'true');await page.locator('#help-close').click();await page.locator('#overlay-action').click();
   await page.keyboard.down('Space');await page.waitForTimeout(400);await page.keyboard.up('Space');const played=await page.evaluate(()=>({starts:window.__polishAudio.starts,maximum:window.__polishAudio.maximum}));assert.ok(played.starts>0,'Real firing creates actual Web Audio voices');assert.ok(played.maximum<=8);
   await page.locator('#pause').click();const paused=await page.evaluate(()=>({starts:window.__polishAudio.starts,live:window.__polishAudio.live.size}));assert.equal(paused.live,0);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__polishAudio.starts),paused.starts,'Pause produces no new voices');
   await page.locator('#overlay-action').click();await page.keyboard.down('Space');await page.waitForTimeout(300);await page.keyboard.up('Space');assert.ok(await page.evaluate(starts=>window.__polishAudio.starts>starts,paused.starts),'Resume restores enabled sound');
   await page.locator('#help-toggle').click();await sound.click();assert.equal(await sound.getAttribute('aria-pressed'),'false');await page.locator('#help-close').click();await page.locator('#overlay-action').click();
   const muted=await page.evaluate(()=>window.__polishAudio.starts);await page.keyboard.down('Space');await page.waitForTimeout(300);await page.keyboard.up('Space');assert.equal(await page.evaluate(()=>window.__polishAudio.starts),muted,'Muted firing creates no voices');assert.equal(await page.evaluate(()=>window.__polishAudio.live.size),0);
   observations.push({audio:played,directTouch:{before:{x:before.player,y:before.playerY},after:{x:moved.player,y:moved.playerY}},scope:'Actual simulation, direct touch, Web Audio oscillator lifecycle and real Fire/Pause/Help controls; physical sound output not assessed.'});
  }finally{await context.close();}
 });
 await check('no renderer fixture browser exceptions or simulation mutations',async()=>assert.deepEqual(errors,[]));
}finally{await writeFile(resolve(output,'results.json'),JSON.stringify({generatedAt:new Date().toISOString(),browser:browser.version(),results,observations,errors,scope:'Explicit client-only renderer fixtures; six enemies and both bosses are constructed in memory and simulation stepping is held. Actual source renderer and controller/HUD are used. Screenshots are not earned gameplay and do not establish combat, challenge or server acceptance. Red outlines appear only in the separately named collision diagnostic. Chromium viewport/touch emulation, not physical devices.'},null,2));await browser.close();if(server)await new Promise(done=>server.close(done));}
if(results.some(r=>!r.passed))process.exitCode=1;
