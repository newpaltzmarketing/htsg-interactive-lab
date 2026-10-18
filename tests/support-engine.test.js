import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInvadersState, createInvadersChallenge, stepInvaders, fireInvaders, equipInvaderWeapon,
  equipInvaderSupport, chooseInvaderWeapon, resizeGame, arenaFor, invadersResult, INVADER_SUPPORT,
} from '../public/game-engine.js';

const dt = 1 / 120, random = () => .5;
const frames = (count, state, input = {}) => { for (let index = 0; index < count; index += 1) stepInvaders(state, input, dt, random); };
function combat(options = {}) {
  return Object.assign(createInvadersState(options), { wave: 3, supportLevel: 1, spawnIn: 100 });
}
function enemy(x, y, extra = {}) { return { x, y, health: 1, label: 'Scope creep', ...extra }; }
function hit(state, target, damage = 1, kind = 'plasma') {
  state.bullets.push({ x: target.x, y: target.y + 5, damage, kind });
  stepInvaders(state, {}, dt, random);
}

test('support is earned before wave three; both equipment families retain all earned power on switching and damage', () => {
  const state = createInvadersState();
  Object.assign(state, { wave: 2, waveSpawned: 8, waveQuota: 8, weaponLevel: 3, missilePairs: 7, score: 300 });
  assert.equal(state.supportLevel, 0);
  assert.equal(equipInvaderSupport(state, 'relay'), true);
  stepInvaders(state, {}, dt, random);
  assert.equal(state.supportLevel, 1); assert.equal(state.phase, 'choice');
  assert.equal(state.supportFamily, 'relay');
  chooseInvaderWeapon(state, 'focused');
  const before = structuredClone(state);
  assert.equal(equipInvaderSupport(state, 'wingmates'), true);
  assert.deepEqual(state, { ...before, supportFamily: 'wingmates' });
  equipInvaderWeapon(state, 'spread');
  assert.equal(state.supportLevel, 1); assert.equal(state.weaponLevel, 3); assert.equal(state.missilePairs, 7);
  Object.assign(state, { phase: 'wave', spawnIn: 100 });
  state.enemies.push(enemy(state.player, state.playerY));
  stepInvaders(state, {}, dt, random);
  assert.equal(state.lives, 2); assert.equal(state.supportLevel, 1); assert.equal(state.weaponLevel, 3);
  assert.equal(state.missilePairs, 7);
  for (const invalid of [null, { ...state, ended: true }, { ...state, lives: 0 }, { kind: 'runner' }]) assert.equal(equipInvaderSupport(invalid, 'relay'), false);
  assert.equal(equipInvaderSupport(state, 'unknown'), false);
  const fresh = createInvadersState();
  assert.equal(fresh.supportLevel, 0); assert.equal(fresh.inboxCharge, 0); assert.equal(fresh.inboxTime, 0);
});

test('Wingmates add bounded independent shots without replacing primary volleys or spending missile ammunition', () => {
  const state = combat();
  Object.assign(state, { weaponLevel: 3, cooldown: 1 });
  stepInvaders(state, { action: true }, dt, random);
  const shots = state.bullets.filter(shot => shot.kind === 'wingmate');
  assert.equal(shots.length, 2);
  assert.deepEqual(shots.map(shot => shot.previousX), [state.player - 70, state.player + 70]);
  assert.ok(shots.every(shot => shot.damage === 1 && shot.previousY === state.playerY - 6));
  assert.equal(state.missilePairs, 0); assert.equal(state.volleys, 0);
  state.cooldown = 0; fireInvaders(state);
  assert.equal(state.bullets.filter(shot => shot.kind === 'plasma').length, 4);
  const full = combat(); full.cooldown = 1;
  full.bullets = Array.from({ length: 56 }, () => ({ x: 20, y: 200, kind: 'plasma' }));
  stepInvaders(full, { action: true }, dt, random);
  assert.equal(full.bullets.length, 56, 'support leaves primary capacity reserved');
  full.cooldown = 0; full.weaponLevel = 3;
  fireInvaders(full); assert.equal(full.bullets.length, 60);
});

test('support mounts and the client locked aim use the ship position after the current steering input', () => {
  const state = combat();
  const client = enemy(250, 100, { behavior: 'client', attackPhase: 'approach' }); state.enemies.push(client);
  const previousY = state.playerY;
  stepInvaders(state, { action: true, up: true }, .05, random);
  assert.ok(state.playerY < previousY);
  assert.ok(state.bullets.filter(shot => shot.kind === 'wingmate').every(shot => shot.previousY === state.playerY - 6));
  assert.equal(client.aimY, state.playerY);
});

test('the first boss evolves support once and retains the primary tier, inventory and existing victory reward', () => {
  const state = combat();
  Object.assign(state, { wave: 4, phase: 'intermission', waveIn: 0, weaponLevel: 3, missilePairs: 5 });
  stepInvaders(state, {}, dt, random);
  Object.assign(state.boss, { phase: 'recover', attackIn: 10, health: 1 });
  const targetY = Math.max(54, state.world.height * .2);
  state.bullets.push({ x: state.boss.x, y: targetY + 5, damage: 1 });
  stepInvaders(state, {}, dt, random);
  assert.equal(state.boss, null); assert.equal(state.bossesDefeated, 1);
  assert.equal(state.supportLevel, 2); assert.equal(state.weaponLevel, 3); assert.equal(state.missilePairs, 5);
  assert.equal(state.bossBonus, 375); assert.equal(state.shield, 1); assert.equal(state.inboxCharge, 5);
  Object.assign(state, { phase: 'wave', cooldown: 1, supportCooldown: 0 });
  stepInvaders(state, { action: true }, dt, random);
  assert.ok(state.bullets.filter(shot => shot.kind === 'wingmate').every(shot => shot.damage === 2));
});

test('Relay Pulse chains only primary hits, scores each cleared target once and never loops back', () => {
  for (const [level, kills] of [[1, 2], [2, 3]]) {
    const state = combat(); Object.assign(state, { supportFamily: 'relay', supportLevel: level });
    const origin = enemy(300, 120), near = enemy(390, 120), farther = enemy(480, 120), last = enemy(900, 120);
    state.enemies.push(origin, near, farther, last); hit(state, origin);
    assert.equal(state.kills, kills); assert.equal(state.score, kills * 10);
    assert.equal(state.effects.filter(item => item.kind === 'relay').length, level);
    assert.equal(state.relayCooldown, INVADER_SUPPORT.relayCadence);
    assert.equal(state.inboxCharge, kills);
  }
  for (const kind of ['wingmate', 'missile']) {
    const state = combat(); state.supportFamily = 'relay';
    const origin = enemy(300, 120); state.enemies.push(origin, enemy(390, 120)); hit(state, origin, 1, kind);
    assert.equal(state.kills, 1); assert.equal(state.effects.filter(item => item.kind === 'relay').length, 0);
  }
});

test('relay respects cooldown and living visible target range; switching support cannot reset timers', () => {
  const state = combat(); Object.assign(state, { supportFamily: 'relay', relayCooldown: .3, supportCooldown: .5 });
  const origin = enemy(300, 120); state.enemies.push(origin, enemy(390, 120));
  hit(state, origin); assert.equal(state.kills, 1);
  const timers = [state.relayCooldown, state.supportCooldown];
  equipInvaderSupport(state, 'wingmates'); equipInvaderSupport(state, 'relay');
  assert.deepEqual([state.relayCooldown, state.supportCooldown], timers);
  const isolated = combat(); isolated.supportFamily = 'relay';
  const target = enemy(300, 120);
  isolated.enemies.push(target, enemy(350, -20), enemy(600, 120), enemy(390, 120, { health: 0 }));
  hit(isolated, target);
  assert.equal(isolated.effects.filter(item => item.kind === 'relay').length, 0);
});

test('Inbox Zero is earned after support unlock, waits for a visible target and adds both support systems for six seconds', () => {
  const state = combat(); state.supportFamily = 'relay';
  state.inboxCharge = 19;
  const target = enemy(300, 120); state.enemies.push(target); hit(state, target);
  assert.equal(state.inboxCharge, 20);
  stepInvaders(state, { action: true }, dt, random);
  assert.equal(state.inboxTime, 0, 'a quiet arena does not waste the earned burst');
  state.enemies.push(enemy(900, 50, { health: 1000 }));
  stepInvaders(state, { action: true }, dt, random);
  assert.equal(state.inboxTime, 6); assert.equal(state.inboxCharge, 0); assert.equal(state.inboxBursts, 1);
  assert.equal(state.missilePairs, 2);
  assert.equal(state.bullets.filter(shot => shot.kind === 'wingmate').length, 2, 'Relay selection also gains Wingmates during the burst');
  const snapshot = structuredClone(state);
  stepInvaders(state, { action: true }, 0, random); assert.deepEqual(state, snapshot);
  frames(721, state);
  assert.equal(state.inboxTime, 0); assert.equal(state.inboxBursts, 1); assert.equal(state.supportFamily, 'relay');
  assert.equal(state.supportLevel, 1);
});

test('earned Inbox Zero time is preserved during a breather and the boss entrance', () => {
  const state = combat();
  Object.assign(state, { inboxTime: 4, phase: 'intermission', waveIn: 100, wave: 4 });
  frames(120, state);
  assert.equal(state.inboxTime, 4);
  state.waveIn = 0; stepInvaders(state, {}, dt, random);
  assert.equal(state.boss.phase, 'entering');
  frames(120, state);
  assert.equal(state.inboxTime, 4);
  frames(70, state);
  assert.ok(state.inboxTime < 4 && state.inboxTime > 3, 'the six-second reward resumes with active combat');
});

test('the first two waves stay welcoming; spawned client and deadline identities gain their behavior from wave three', () => {
  for (const wave of [1, 2, 3]) {
    const state = createInvadersState(); Object.assign(state, { wave, spawnIn: 0, waveQuota: 18 });
    for (let spawn = 0; spawn < 18; spawn += 1) { state.spawnIn = 0; stepInvaders(state, {}, dt, random); }
    if (wave < 3) assert.ok(state.enemies.every(item => !item.behavior));
    else {
      assert.ok(state.enemies.some(item => item.behavior === 'client' && item.hazardId === 'scope-creep'));
      assert.ok(state.enemies.some(item => item.behavior === 'deadline' && item.hazardId === 'missed-deadlines'));
    }
  }
});

test('the client warns a locked location for a full second, sends one sheet and cannot keep tracking the player', () => {
  const state = combat();
  const client = enemy(250, 100, { behavior: 'client', attackPhase: 'approach', health: 100 });
  state.enemies.push(client);
  stepInvaders(state, {}, dt, random);
  assert.equal(client.attackPhase, 'warning'); assert.equal(client.attackIn, 1);
  const aim = [client.aimX, client.aimY], position = [client.x, client.y];
  state.player = 800;
  frames(119, state);
  assert.equal(state.hostileShots.length, 0); assert.deepEqual([client.x, client.y], position);
  assert.deepEqual([client.aimX, client.aimY], aim);
  frames(2, state);
  assert.equal(client.attackPhase, 'recover'); assert.equal(state.hostileShots.length, 1);
  const paper = state.hostileShots[0];
  assert.equal(paper.kind, 'paper'); assert.equal(paper.vx, (aim[0] - position[0]) / 1.6);
  assert.equal(paper.label, 'Scope creep');
  frames(120, state); assert.ok(state.hostileShots.length <= 1, 'each client sends only one extra sheet');
});

test('deadline gives a stationary lane warning; dodging its dive succeeds, while a collision consumes a shield', () => {
  const state = combat(); state.player = 800;
  const clock = enemy(250, 100, { behavior: 'deadline', attackPhase: 'approach', label: 'Missed deadlines' });
  state.enemies.push(clock); stepInvaders(state, {}, dt, random);
  assert.equal(clock.attackPhase, 'warning'); assert.equal(clock.attackIn, .95);
  const lane = clock.aimX, y = clock.y;
  frames(110, state); assert.equal(clock.y, y); assert.equal(clock.attackPhase, 'warning');
  frames(300, state);
  assert.ok(!state.enemies.includes(clock)); assert.equal(state.lives, 3); assert.equal(state.kills, 0);
  const hitState = combat(); hitState.shield = 1; hitState.shieldTime = 12;
  hitState.enemies.push(enemy(hitState.player, hitState.playerY - 15, {
    behavior: 'deadline', attackPhase: 'dive', aimX: hitState.player, label: 'Missed deadlines',
  }));
  stepInvaders(hitState, {}, .05, random);
  assert.equal(hitState.lives, 3); assert.equal(hitState.shield, 0); assert.equal(hitState.lastHazard, 'Missed deadlines');
  assert.equal(hitState.lastHazardBlocked, true); assert.equal(lane, 250);
});

test('paper shots retain ordinary swept collision and normal wave completion clears remaining sheets', () => {
  const state = combat();
  state.hostileShots.push({ x: state.player, y: state.playerY - 70, vx: 0, vy: 2000,
    radius: 10, kind: 'paper', hostile: true, label: 'Scope creep', age: 0, life: 5 });
  stepInvaders(state, {}, .05, random);
  assert.equal(state.lives, 2); assert.equal(state.lastHazardReason, 'projectile');
  state.hostileShots.push({ x: 100, y: 100, vx: 0, vy: 100, radius: 10, kind: 'paper', age: 0, life: 5 });
  state.waveSpawned = state.waveQuota;
  stepInvaders(state, {}, dt, random);
  assert.equal(state.phase, 'intermission'); assert.equal(state.hostileShots.length, 0);
});

test('resize preserves telegraph time, locked target coordinates and relay endpoints without advancing combat', () => {
  const state = combat();
  state.enemies.push(enemy(250, 100, { behavior: 'client', attackPhase: 'approach' }));
  stepInvaders(state, {}, dt, random);
  state.effects.push({ kind: 'relay', x: 100, y: 80, toX: 200, toY: 120, age: .1, life: .22 });
  const before = structuredClone(state);
  resizeGame(state, 480, 1080);
  assert.equal(state.enemies[0].attackIn, before.enemies[0].attackIn);
  assert.equal(state.enemies[0].aimX, before.enemies[0].aimX * .5);
  assert.equal(state.enemies[0].aimY, before.enemies[0].aimY * 2);
  assert.deepEqual(state.effects.at(-1), { kind: 'relay', x: 50, y: 160, toX: 100, toY: 240, age: .1, life: .22 });
  assert.equal(state.elapsed, before.elapsed); assert.equal(state.supportLevel, 1);
  assert.ok(arenaFor(state).playerY > 0);
});

test('new builds and agency attacks remain seeded with bounded five-minute challenge state and rules 1.6 results', () => {
  const a = createInvadersChallenge({ seed: 'support-week' }), b = createInvadersChallenge({ seed: 'support-week' });
  for (const state of [a, b]) Object.assign(state, {
    wave: 3, supportLevel: 2, supportFamily: 'relay', inboxTime: 6, lives: 1000, weaponLevel: 3, missilePairs: 8, choiceMade: true,
  });
  for (let index = 0; index < 36000; index += 1) {
    const input = { action: true, targetX: 480 + Math.sin(index / 90) * 350 };
    stepInvaders(a, input, 1 / 60, () => 0); stepInvaders(b, input, dt, () => 1);
    assert.ok(a.bullets.length <= 64 && a.missiles.length <= 8 && a.hostileShots.length <= 18);
    assert.ok(a.bullets.filter(shot => shot.kind === 'wingmate').length <= 8);
    assert.ok(a.hostileShots.filter(shot => shot.kind === 'paper').length <= 3);
  }
  assert.deepEqual(a, b);
  const result = invadersResult(a);
  assert.equal(result.rulesVersion, '1.6.0'); assert.equal(result.elapsed, 300); assert.equal(result.reason, 'time');
  assert.equal(result.supportLevel, 2); assert.equal(result.supportFamily, 'relay');
  assert.ok(Number.isInteger(result.score) && result.score >= 0);
});
