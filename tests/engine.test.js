import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARENA, INVADER_HAZARDS, INVADER_THREAT_SCALE, invaderWeapon, invaderPace, bossGeometry, arenaFor, resizeGame, createInputState, setInput, getInput, clearInput,
  createInvadersState, fireInvaders, steerInvaders, stepInvaders,
  createRunnerState, jumpRunner, stepRunner, gradeAnswer,
  chooseInvaderWeapon, equipInvaderWeapon, createInvadersChallenge, invadersResult, CHALLENGE_ARENA, INVADER_MISSILES,
} from '../public/game-engine.js';
import { questions, questionsForRound } from '../public/questions.js';
import { runnerCameraOffset, bossHealthBarLayout } from '../public/game-renderer.js';

const idle = { left: false, right: false, up: false, down: false, action: false };
const fixedRandom = () => 0.5;
const frames = (count, callback) => { for (let index = 0; index < count; index += 1) callback(1 / 120); };

test('keyboard and simultaneous touch sources release independently; blur clears every source', () => {
  const input = createInputState();
  setInput(input, 'left', 'key:ArrowLeft', true);
  setInput(input, 'left', 'pointer:1', true);
  setInput(input, 'action', 'pointer:2', true);
  setInput(input, 'up', 'key:ArrowUp', true);
  setInput(input, 'down', 'key:KeyS', true);
  setInput(input, 'left', 'pointer:1', false);
  assert.deepEqual(getInput(input), { left: true, right: false, up: true, down: true, action: true });
  setInput(input, 'left', 'key:ArrowLeft', false);
  assert.equal(getInput(input).left, false);
  clearInput(input);
  assert.deepEqual(getInput(input), idle);
});

test('repeated keydown cannot leave a key held after a single keyup', () => {
  const input = createInputState();
  for (let index = 0; index < 10; index += 1) setInput(input, 'action', 'key:Space', true);
  setInput(input, 'action', 'key:Space', false);
  assert.equal(getInput(input).action, false);
});

test('Agency Invaders moves at the same speed in either direction and stays within the arena', () => {
  const state = createInvadersState();
  frames(60, dt => stepInvaders(state, { ...idle, right: true }, dt, fixedRandom));
  assert.ok(Math.abs(state.player - (ARENA.width / 2 + 215)) < 0.001);
  frames(60, dt => stepInvaders(state, { ...idle, left: true }, dt, fixedRandom));
  assert.ok(Math.abs(state.player - ARENA.width / 2) < 0.001);
  frames(1000, dt => stepInvaders(state, { ...idle, left: true, action: true }, dt, () => 1));
  assert.ok(state.player >= 38);
  const opposite = createInvadersState();
  frames(1000, dt => stepInvaders(opposite, { ...idle, right: true, action: true }, dt, () => 0));
  assert.ok(opposite.player <= ARENA.width - 38);
});

test('simultaneous left/right controls cancel and a delayed frame cannot teleport the player', () => {
  const state = createInvadersState();
  stepInvaders(state, { ...idle, left: true, right: true }, 1 / 60, fixedRandom);
  assert.equal(state.player, ARENA.width / 2);
  stepInvaders(state, { ...idle, right: true }, 30, fixedRandom);
  assert.equal(state.player, ARENA.width / 2 + 430 * 0.05);
});

test('firing respects cooldown and consumes one projectile for one scored target', () => {
  const state = createInvadersState();
  assert.equal(fireInvaders(state), true);
  assert.equal(fireInvaders(state), false);
  assert.equal(state.bullets.length, 1);
  state.enemies.push({ x: state.player, y: 440 });
  stepInvaders(state, idle, 1 / 60, fixedRandom);
  assert.equal(state.score, 10);
  assert.equal(state.bullets.length, 0);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.lives, 3, 'a successful last-moment shot saves the life');
  frames(36, dt => stepInvaders(state, idle, dt, fixedRandom));
  assert.equal(fireInvaders(state), true);
});

test('a projectile crosses an enemy in a slower frame without missing the collision', () => {
  const state = createInvadersState();
  state.bullets.push({ x: 100, y: 120 });
  state.enemies.push({ x: 100, y: 100 });
  stepInvaders(state, idle, 0.05, fixedRandom);
  assert.equal(state.score, 10);
  assert.equal(state.enemies.length, 0);
});

test('missed targets and ship collisions end at zero lives, and game over freezes rules', () => {
  const state = createInvadersState();
  const escaped = () => ({ x: 100, y: arenaFor(state).height + 30 });
  state.enemies.push(escaped(), escaped(), { x: state.player, y: arenaFor(state).playerY });
  stepInvaders(state, idle, 1 / 60, fixedRandom);
  assert.equal(state.lives, 2, 'a cluster of simultaneous misses costs one life during the grace period');
  assert.equal(state.ended, false);
  for (let hit = 0; hit < 2; hit += 1) {
    frames(90, dt => stepInvaders(state, idle, dt, fixedRandom));
    state.enemies.push(escaped());
    stepInvaders(state, idle, 1 / 60, fixedRandom);
  }
  assert.equal(state.lives, 0);
  assert.equal(state.ended, true);
  const snapshot = structuredClone(state);
  stepInvaders(state, { left: true, right: false, action: true }, 1, fixedRandom);
  assert.deepEqual(state, snapshot);
  assert.equal(fireInvaders(state), false);
  const restarted = createInvadersState();
  assert.equal(restarted.score, 0);
  assert.equal(restarted.lives, 3);
  assert.equal(restarted.enemies.length, 0);
  assert.equal(restarted.ended, false);
});

test('Launch Runner permits two jumps, blocks a third, and resets both jumps after landing', () => {
  const state = createRunnerState();
  assert.equal(jumpRunner(state), true);
  assert.equal(jumpRunner(state), true, 'the second press activates the aerial jump');
  assert.equal(state.jumps, 2);
  assert.equal(jumpRunner(state), false);
  stepRunner(state, 1 / 120, fixedRandom);
  assert.ok(state.height > 0);
  assert.equal(jumpRunner(state), false);
  frames(120, dt => stepRunner(state, dt, fixedRandom));
  assert.equal(state.height, 0);
  assert.equal(state.velocity, 0);
  assert.equal(state.jumps, 0);
  assert.equal(jumpRunner(state), true);
});

test('Launch Runner detects an obstacle at ground level and freezes after game over', () => {
  const state = createRunnerState();
  state.obstacles.push({ x: 185, width: 42, height: 60 });
  stepRunner(state, 1 / 120, fixedRandom);
  assert.equal(state.ended, true);
  const snapshot = structuredClone(state);
  assert.equal(jumpRunner(state), false);
  stepRunner(state, 10, fixedRandom);
  assert.deepEqual(state, snapshot);
});

test('Launch Runner clears an obstacle while airborne and earns distance', () => {
  const state = createRunnerState();
  state.height = 100;
  state.velocity = 0;
  state.obstacles.push({ x: 185, width: 42, height: 60 });
  stepRunner(state, 1 / 120, fixedRandom);
  assert.equal(state.ended, false);
  assert.ok(state.score > 0);
  const restarted = createRunnerState();
  assert.equal(restarted.score, 0);
  assert.equal(restarted.height, 0);
  assert.equal(restarted.obstacles.length, 0);
});

test('zero, negative and invalid elapsed time do not progress either game', () => {
  for (const seconds of [0, -0.1, NaN, Infinity]) {
    const invaders = createInvadersState();
    const runner = createRunnerState();
    stepInvaders(invaders, { left: false, right: true, action: true }, seconds, fixedRandom);
    stepRunner(runner, seconds, fixedRandom);
    assert.deepEqual(invaders, createInvadersState());
    assert.deepEqual(runner, createRunnerState());
  }
});

test('direct steering follows the target smoothly and clamps at both world edges', () => {
  const state = createInvadersState({ width: 720, height: 1280 });
  const before = state.player;
  steerInvaders(state, 10000, 1 / 60);
  assert.ok(state.player > before && state.player < 682, 'one touch move steers without teleporting');
  frames(180, dt => steerInvaders(state, 10000, dt));
  assert.ok(Math.abs(state.player - (state.world.width - 38)) < 0.001);
  frames(180, dt => steerInvaders(state, -10000, dt));
  assert.ok(Math.abs(state.player - 38) < 0.001);
  const stopped = state.player;
  for (const invalid of [NaN, Infinity, undefined]) steerInvaders(state, invalid, 1 / 60);
  assert.equal(state.player, stopped);
});

test('keyboard direction takes priority over a simultaneous touch target', () => {
  const state = createInvadersState();
  stepInvaders(state, { left: true, targetX: 10000 }, 0.05, fixedRandom);
  assert.equal(state.player, ARENA.width / 2 - 430 * 0.05);
  const before = state.player;
  stepInvaders(state, { left: true, right: true, targetX: 10000 }, 0.05, fixedRandom);
  assert.equal(state.player, before);
});

test('Invaders steers both axes smoothly within the lower playfield at every screen shape', () => {
  for (const height of [240, 540, 1700]) {
    const state = createInvadersState({ height });
    const bounds = arenaFor(state).invadersBounds;
    assert.ok(bounds.top >= height * 0.45 && bounds.bottom <= height - 60);
    const startY = state.playerY;
    stepInvaders(state, { targetX: 10000, targetY: -10000 }, 1 / 120, fixedRandom);
    assert.ok(state.player > 480 && state.player < bounds.right, 'relative drag follows without a horizontal teleport');
    assert.ok(state.playerY < startY && state.playerY > bounds.top, 'relative drag follows without a vertical teleport');
    frames(180, dt => steerInvaders(state, 10000, dt, -10000));
    assert.ok(Math.abs(state.player - bounds.right) < 0.001);
    assert.ok(Math.abs(state.playerY - bounds.top) < 0.001);
    frames(180, dt => steerInvaders(state, -10000, dt, 10000));
    assert.ok(Math.abs(state.player - bounds.left) < 0.001);
    assert.ok(Math.abs(state.playerY - bounds.bottom) < 0.001);
  }
});

test('portrait Invaders keeps the ship clear of the thumb pad and retains that clearance after resizing', () => {
  const state = createInvadersState({ width: 960, height: 1700 });
  assert.equal(state.playerY, 1580);
  assert.equal(arenaFor(state).invadersBounds.bottom, state.world.height - 120);
  assert.ok(120 * 390 / 960 >= 48, 'a 390px phone leaves at least48px below the ship center inside the arena');
  resizeGame(state, 960, 300);
  assert.equal(state.playerY, 236, 'landscape retains the compact64world inset');
  resizeGame(state, 960, 1700);
  assert.equal(state.playerY, 1580, 'rotation back preserves the bottom-of-band position');
  const shortestPortrait = arenaFor(createInvadersState({ width: 320, height: 321 })).invadersBounds;
  assert.ok(shortestPortrait.bottom - shortestPortrait.top >= 64, 'even a nearly square portrait retains its minimum travel band');
});

test('thumb joystick has continuous two-axis velocity without a diagonal speed advantage', () => {
  const straight = createInvadersState({ height: 1700 });
  const diagonal = createInvadersState({ height: 1700 });
  straight.playerY = diagonal.playerY = 1300;
  stepInvaders(straight, { axisX: 1 }, 0.05, fixedRandom);
  stepInvaders(diagonal, { axisX: 1, axisY: -1 }, 0.05, fixedRandom);
  assert.equal(straight.player - 480, 850 * 0.05);
  assert.ok(Math.abs(Math.hypot(diagonal.player - 480, diagonal.playerY - 1300) - 850 * 0.05) < 1e-9);
  const stopped = { x: diagonal.player, y: diagonal.playerY };
  stepInvaders(diagonal, { axisX: 0, axisY: 0 }, 0.05, fixedRandom);
  assert.deepEqual({ x: diagonal.player, y: diagonal.playerY }, stopped, 'releasing the joystick stops movement immediately');
});

test('keyboard overrides joystick and drag independently on each axis; opposing vertical keys cancel', () => {
  const state = createInvadersState({ height: 1700 });
  state.playerY = 1300;
  stepInvaders(state, { left: true, up: true, axisX: 1, axisY: 1, targetX: 900, targetY: 1600 }, 0.05, fixedRandom);
  assert.equal(state.player, 480 - 430 * 0.05);
  assert.equal(state.playerY, 1300 - 430 * 0.05);
  const beforeY = state.playerY;
  stepInvaders(state, { up: true, down: true, targetY: 1600, axisY: 1 }, 0.05, fixedRandom);
  assert.equal(state.playerY, beforeY);
  stepInvaders(state, { left: true, axisY: -1 }, 0.05, fixedRandom);
  assert.equal(state.playerY, beforeY - 850 * 0.05, 'horizontal keyboard input leaves the vertical joystick usable');
});

test('Invaders firing and shield pickup follow the ship after vertical movement', () => {
  const state = createInvadersState();
  state.playerY = 340;
  assert.equal(fireInvaders(state), true);
  assert.equal(state.bullets[0].y, 305);
  state.pickups.push({ x: state.player, y: 340, kind: 'shield' });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.shield, 1);
  assert.equal(state.pickups.length, 0);
  assert.equal(state.effects.at(-1).y, 340);
});

test('Invaders collisions use the moved ship position and name the actual hazard', () => {
  const state = createInvadersState();
  state.playerY = 340;
  state.enemies.push({ x: state.player, y: 476, label: 'Bottlenecks' });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.lives, 3, 'a drone at the old ship row cannot collide with the moved ship');
  state.enemies.push({ x: state.player, y: 340, label: 'Scope creep' });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.lives, 2);
  assert.equal(state.lastHazard, 'Scope creep');
  assert.equal(state.lastHazardReason, 'collision');
  assert.equal(state.lastHazardBlocked, false);
  assert.equal(state.lastHazardTime, 2.4);
  assert.equal(state.effects.at(-1).y, 340);
  state.enemies.push({ x: 100, y: 600, label: 'Tech debt' });
  stepInvaders(state, idle, 0.05, fixedRandom);
  assert.equal(state.lastHazard, 'Scope creep', 'grace-period hazards cannot overwrite the actual impact feedback');
  assert.ok(state.lastHazardTime < 2.4);
});

test('every spawned Invaders target has a business hazard and shield feedback identifies a blocked miss', () => {
  const state = createInvadersState();
  for (let index = 0; index < INVADER_HAZARDS.length; index += 1) {
    state.spawnIn = 0;
    stepInvaders(state, idle, 1 / 120, fixedRandom);
  }
  assert.deepEqual(state.enemies.map(enemy => enemy.label), INVADER_HAZARDS.map(hazard => hazard.label));
  assert.equal(state.enemies[0].label, 'Scope creep');
  assert.ok(state.enemies.every(enemy => enemy.hazard.id === enemy.hazardId && enemy.hazard.label === enemy.label));
  state.enemies = [{ x: 100, y: 600, hazard: INVADER_HAZARDS[2] }];
  state.shield = 1;
  state.shieldTime = 5;
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.lives, 3);
  assert.equal(state.shield, 0);
  assert.equal(state.lastHazard, 'Budget overruns');
  assert.equal(state.lastHazardBlocked, true);
  assert.equal(state.lastHazardReason, 'miss');
  state.enemies = [];
  state.spawnIn = 20;
  frames(300, dt => stepInvaders(state, idle, dt, fixedRandom));
  assert.equal(state.lastHazardTime, 0, 'the feedback duration ends in simulation time');
});

test('Invaders resize preserves vertical progress inside the movement band without changing gameplay', () => {
  const state = createInvadersState({ height: 1600 });
  const original = arenaFor(state).invadersBounds;
  state.playerY = original.top + (original.bottom - original.top) * 0.35;
  Object.assign(state, { score: 70, lastHazard: 'Scope creep', lastHazardTime: 1.2 });
  const originalY = state.playerY;
  resizeGame(state, 960, 240);
  const short = arenaFor(state).invadersBounds;
  assert.ok(Math.abs(state.playerY - (short.top + (short.bottom - short.top) * 0.35)) < 1e-9);
  assert.deepEqual([state.score, state.lastHazard, state.lastHazardTime], [70, 'Scope creep', 1.2]);
  resizeGame(state, 960, 1600);
  assert.ok(Math.abs(state.playerY - originalY) < 1e-9);
});

test('portrait Invaders keeps enemy and projectile travel time proportional to arena height', () => {
  const states = [540, 1080].map(height => {
    const state = createInvadersState({ height });
    state.spawnIn = 20;
    state.enemies.push({ x: 300, y: height * 0.2 });
    state.bullets.push({ x: 600, y: height * 0.7 });
    stepInvaders(state, idle, 0.05, fixedRandom);
    return state;
  });
  assert.ok(Math.abs(states[0].enemies[0].y / 540 - states[1].enemies[0].y / 1080) < 1e-9);
  assert.ok(Math.abs(states[0].bullets[0].y / 540 - states[1].bullets[0].y / 1080) < 1e-9);
});

test('resizing Invaders preserves progress and relative positions without advancing time', () => {
  const state = createInvadersState({ width: 960, height: 1600 });
  Object.assign(state, { player: 240, score: 75, lives: 2, wave: 3, combo: 5, elapsed: 12, shield: 1, shieldTime: 4 });
  state.enemies.push({ x: 480, baseX: 460, y: 800, health: 2 });
  state.bullets.push({ x: 240, y: 1000, previousY: 1010 });
  state.pickups.push({ x: 120, y: 600, kind: 'shield' });
  state.effects.push({ x: 300, y: 900, age: 0.2, life: 1 });
  resizeGame(state, 720, 400);
  assert.deepEqual(state.world, { width: 720, height: 400 });
  assert.equal(state.player, 180);
  assert.deepEqual(state.enemies[0], { x: 360, baseX: 345, y: 200, health: 2 });
  assert.equal(state.bullets[0].previousY, 252.5);
  assert.equal(state.pickups[0].y, 150);
  assert.deepEqual([state.score, state.lives, state.wave, state.combo, state.elapsed, state.shieldTime], [75, 2, 3, 5, 12, 4]);
  resizeGame(state, 960, 1600);
  assert.equal(state.player, 240);
  assert.equal(state.enemies[0].y, 800);
});

test('resizing Runner preserves its physical jump, score and boost while repositioning track records', () => {
  const state = createRunnerState({ width: 960, height: 1500 });
  Object.assign(state, { height: 105, velocity: -50, jumps: 2, score: 90, bonus: 125, energy: 3, boost: 1.7, elapsed: 8 });
  state.obstacles.push({ x: 800, width: 58, height: 62 });
  state.collectibles.push({ x: 900, height: 138 });
  resizeGame(state, 720, 320);
  assert.equal(state.obstacles[0].x, 600);
  assert.equal(state.collectibles[0].x, 675);
  assert.equal(state.collectibles[0].height, 138);
  assert.deepEqual([state.height, state.velocity, state.jumps, state.score, state.bonus, state.energy, state.boost, state.elapsed], [105, -50, 2, 90, 125, 3, 1.7, 8]);
});

test('portrait Runner scales visible obstacles and pickups with matching collision geometry', () => {
  const portrait = createRunnerState({ width: 960, height: 1700 });
  const arena = arenaFor(portrait);
  assert.equal(arena.floor, 1614, 'the portrait ground band remains 86 world units');
  assert.equal(arena.runnerScale, 1.3);
  assert.equal(arenaFor(createRunnerState()).floor, 454, 'the original desktop track stays unchanged');
  portrait.height = 68;
  portrait.obstacles.push({ x: arena.runnerX, width: 42, height: 60 });
  stepRunner(portrait, 1 / 120, fixedRandom);
  assert.equal(portrait.ended, true, 'the enlarged obstacle collides at its visible top');

  const desktop = createRunnerState();
  desktop.height = 68;
  desktop.obstacles.push({ x: arenaFor(desktop).runnerX, width: 42, height: 60 });
  stepRunner(desktop, 1 / 120, fixedRandom);
  assert.equal(desktop.ended, false, 'the same jump clears the smaller desktop obstacle');

  const pickup = createRunnerState({ width: 960, height: 1700 });
  pickup.height = 100;
  pickup.collectibles.push({ x: arenaFor(pickup).runnerX + 45, height: 100 + 38 * 1.3 });
  stepRunner(pickup, 1 / 120, fixedRandom);
  assert.equal(pickup.collected, 1, 'the enlarged pickup uses the matching portrait collection area');
});

test('Runner camera keeps the full astronaut in short arenas without changing the physical jump', () => {
  for (const worldHeight of [240, 300, 540, 1700]) {
    for (const jumpHeight of [0, 100, 235, 400]) {
      const state = createRunnerState({ width: 960, height: worldHeight });
      state.height = jumpHeight;
      state.velocity = -20;
      const before = structuredClone(state);
      const arena = arenaFor(state);
      const offset = runnerCameraOffset(state, arena);
      const head = arena.floor - jumpHeight + offset - 92 * arena.runnerScale;
      assert.ok(head >= 54 - 1e-9, `Head clips at arena ${worldHeight}, jump ${jumpHeight}`);
      assert.ok(offset >= 0);
      assert.deepEqual(state, before, 'camera framing cannot alter simulation');
    }
  }
  assert.equal(runnerCameraOffset(createRunnerState()), 0, 'ordinary desktop framing stays fixed');
});

test('clearing a completed wave awards its bonus and starts the next wave after a break', () => {
  const state = createInvadersState();
  state.waveSpawned = state.waveQuota;
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.phase, 'intermission');
  assert.equal(state.score, 25);
  const score = state.score;
  frames(210, dt => stepInvaders(state, idle, dt, fixedRandom));
  assert.equal(state.phase, 'intermission');
  assert.equal(state.score, score, 'the same cleared wave cannot award its bonus repeatedly');
  frames(12, dt => stepInvaders(state, idle, dt, fixedRandom));
  assert.equal(state.phase, 'wave');
  assert.equal(state.wave, 2);
  assert.equal(state.waveQuota, 8);
});

test('Invaders weapon progression is earned quickly by kills and survives damage until restart', () => {
  const state = createInvadersState();
  state.spawnIn = 100;
  for (let kills = 1; kills <= 7; kills += 1) {
    state.enemies.push({ x: 300, y: 100 });
    state.bullets.push({ x: 300, y: 110 });
    stepInvaders(state, idle, 1 / 120, fixedRandom);
    assert.equal(state.kills, kills);
    assert.equal(state.weaponLevel, kills >= 7 ? 3 : kills >= 3 ? 2 : 1);
  }
  assert.equal(invaderWeapon(state).name, 'Quad spread');
  assert.ok(state.weaponUpgradeTime > 2);
  state.enemies.push({ x: state.player, y: state.playerY, label: 'Scope creep' });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.lives, 2);
  assert.equal(state.weaponLevel, 3, 'a hit cannot remove a weapon upgrade');
  const fresh = createInvadersState();
  assert.equal(fresh.weaponLevel, 1);
  assert.equal(fresh.kills, 0);
  assert.equal(fresh.weaponUpgradeTime, 0);
});

test('single, twin and quad weapons have distinct symmetric patterns and one bounded cadence', () => {
  for (const [level, count] of [[1, 1], [2, 2], [3, 4]]) {
    for (const x of [38, 480, 922]) {
      const state = createInvadersState();
      state.weaponLevel = level;
      state.player = x;
      assert.equal(fireInvaders(state), true);
      assert.equal(state.bullets.length, count);
      assert.ok(state.bullets.every(bullet => bullet.x >= 8 && bullet.x <= 952));
      assert.equal(state.cooldown, 0.24);
      assert.equal(fireInvaders(state), false, 'holding fire cannot bypass the volley cooldown');
      if (x === 480) assert.equal(state.bullets.reduce((sum, bullet) => sum + bullet.x - x, 0), 0);
      assert.equal(state.bullets.reduce((sum, bullet) => sum + bullet.vx, 0), 0);
    }
  }
});

test('quad streams spread outward, preserve resize coordinates, and are pruned with bounded sustained fire', () => {
  const state = createInvadersState();
  state.spawnIn = 100;
  state.weaponLevel = 3;
  fireInvaders(state);
  const starts = state.bullets.map(bullet => bullet.x);
  stepInvaders(state, idle, 0.05, fixedRandom);
  assert.ok(state.bullets[0].x < starts[0] && state.bullets[3].x > starts[3]);
  assert.ok(state.bullets[1].x < starts[1] && state.bullets[2].x > starts[2]);
  assert.equal(state.bullets[0].y, state.playerY - 35 - 620 * 0.05);
  const previousX = state.bullets[0].previousX;
  resizeGame(state, 720, 1080);
  assert.equal(state.bullets[0].previousX, previousX * 0.75);
  assert.equal(state.weaponLevel, 3);
  frames(1200, dt => stepInvaders(state, { action: true }, dt, fixedRandom));
  assert.ok(state.bullets.length > 4 && state.bullets.length < 40, 'slow plasma and quad fire cannot accumulate an unbounded field');
});

test('spread projectile sweep can hit a larger hazard between frame endpoints', () => {
  const state = createInvadersState();
  state.spawnIn = 100;
  state.bullets.push({ x: 100, y: 120, vx: 1000 });
  state.enemies.push({ x: 95, y: 100, scale: INVADER_THREAT_SCALE });
  stepInvaders(state, idle, 0.05, fixedRandom);
  assert.equal(state.enemies.length, 0, 'swept collision follows the diagonal beam instead of only its endpoint');
  assert.equal(state.kills, 1);
});

test('Invaders gives readable larger hazards a gentle opening and capped late-wave pace', () => {
  const opening = createInvadersState();
  frames(130, dt => stepInvaders(opening, idle, dt, fixedRandom));
  assert.equal(opening.enemies.length, 0, 'the opening leaves a moment to take control');
  frames(5, dt => stepInvaders(opening, idle, dt, fixedRandom));
  assert.equal(opening.enemies.length, 1);
  assert.equal(opening.enemies[0].scale, INVADER_THREAT_SCALE);
  const y = opening.enemies[0].y;
  stepInvaders(opening, idle, 0.05, fixedRandom);
  assert.ok(opening.enemies[0].y - y < 4, 'first-wave descent stays forgiving');
  const late = createInvadersState();
  Object.assign(late, { wave: 98, phase: 'intermission', waveIn: 0 });
  stepInvaders(late, idle, 0.05, fixedRandom);
  assert.equal(late.waveQuota, 18);
  late.spawnIn = 100;
  late.enemies.push({ x: 100, y: 100, type: 'drone' });
  stepInvaders(late, idle, 0.05, fixedRandom);
  assert.ok(Math.abs(late.enemies[0].y - 100 - 230 * 0.05) < 1e-9);
});

const enterInvadersWave = (wave, height = 540) => {
  const state = createInvadersState({ height });
  Object.assign(state, { wave: wave - 1, phase: 'intermission', waveIn: 0 });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  return state;
};

test('difficulty preserves the first two welcoming waves and compounds speed, spacing and quota after them', () => {
  assert.deepEqual([invaderPace(1).descent, invaderPace(2).descent], [74, 78]);
  assert.deepEqual([invaderPace(1).quota, invaderPace(2).quota], [6, 8]);
  for (const wave of [3, 4, 6, 8]) {
    assert.ok(invaderPace(wave).descent > invaderPace(wave - 1).descent);
    assert.ok(invaderPace(wave).spawnInterval < invaderPace(wave - 1).spawnInterval);
  }
  assert.ok(invaderPace(4).quota > invaderPace(3).quota);
  assert.deepEqual(invaderPace(10000), { pressure: 1, descent: 230, spawnInterval: 0.38, quota: 18 });
});

test('later waves teach distinct named weaving and armored hazards without shrinking their targets', () => {
  const state = createInvadersState();
  state.wave = 8;
  for (let index = 0; index < 6; index += 1) { state.spawnIn = 0; stepInvaders(state, idle, 1 / 120, fixedRandom); }
  const armored = state.enemies.find(enemy => enemy.type === 'heavy');
  const weavers = state.enemies.filter(enemy => enemy.type === 'weaver');
  assert.equal(armored.label, 'Budget overruns');
  assert.equal(armored.health, 3);
  assert.ok(weavers.every(enemy => ['Tech debt', 'Broken handoffs'].includes(enemy.label)));
  assert.ok(state.enemies.every(enemy => enemy.scale === INVADER_THREAT_SCALE));
  const weaver = weavers[0], drone = state.enemies.find(enemy => enemy.type === 'drone');
  for (const enemy of [weaver, drone]) Object.assign(enemy, { baseX: 480, x: 480, phase: 0, age: 0 });
  stepInvaders(state, idle, 0.05, fixedRandom);
  assert.ok(Math.abs(weaver.x - 480) > Math.abs(drone.x - 480) * 4);
});

test('each fifth wave brings a named boss with a safe entry, locked warning and delayed aimed fire', () => {
  const state = enterInvadersWave(5);
  assert.equal(state.phase, 'boss');
  assert.equal(state.boss.label, 'Scope Creep');
  assert.equal(state.boss.health, 80);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.hostileShots.length, 0);
  for (let count = 0; count < 200 && state.boss.phase === 'entering'; count += 1) stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.boss.phase, 'windup');
  assert.equal(state.hostileShots.length, 0);
  const locked = [state.boss.aimX, state.boss.aimY];
  state.player = 100;
  frames(100, dt => stepInvaders(state, idle, dt, fixedRandom));
  assert.deepEqual([state.boss.aimX, state.boss.aimY], locked, 'the warning cannot chase the dodging player');
  assert.equal(state.hostileShots.length, 0);
  for (let count = 0; count < 50 && state.boss.phase === 'windup'; count += 1) stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.boss.phase, 'recover');
  assert.equal(state.hostileShots.length, 1);
  assert.equal(state.hostileShots[0].label, 'Scope Creep');
  assert.equal(enterInvadersWave(10).boss.label, 'Change Request');
});

test('boss bolts use swept collision, consume a shield first, and leave a readable damage reason', () => {
  const state = createInvadersState();
  state.spawnIn = 100; state.shield = 1; state.shieldTime = 12;
  const bolt = () => ({ x: state.player, y: state.playerY - 100, vx: 0, vy: 4000, radius: 12, age: 0, life: 5, hostile: true, label: 'Scope Creep' });
  state.hostileShots.push(bolt());
  stepInvaders(state, idle, 0.05, fixedRandom);
  assert.equal(state.shield, 0);
  assert.equal(state.lives, 3);
  assert.equal(state.lastHazardBlocked, true);
  assert.equal(state.lastHazardReason, 'projectile');
  assert.equal(state.hostileShots.length, 0);
  frames(90, dt => stepInvaders(state, idle, dt, fixedRandom));
  state.hostileShots.push(bolt());
  stepInvaders(state, idle, 0.05, fixedRandom);
  assert.equal(state.lives, 2);
  assert.equal(state.lastHazard, 'Scope Creep');
});

test('boss defeat awards its bonus once, clears hostile fire and grants a shield with a breather', () => {
  const state = enterInvadersWave(5);
  Object.assign(state.boss, { health: 2, phase: 'recover', attackIn: 10, y: bossGeometry(state).targetY });
  state.hostileShots.push({ x: 10, y: 10, vx: 0, vy: 20, radius: 12, age: 0, life: 5, hostile: true });
  for (let index = 0; index < 2; index += 1) state.bullets.push({ x: state.boss.x, y: state.boss.y + 10 });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.boss, null);
  assert.equal(state.phase, 'intermission');
  assert.equal(state.waveIn, 2.2);
  assert.equal(state.lastBoss, 'Scope Creep');
  assert.equal(state.score, 375);
  assert.equal(state.bossesDefeated, 1);
  assert.equal(state.shield, 1);
  assert.equal(state.hostileShots.length, 0);
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.score, 375);
  assert.equal(createInvadersState().bossesDefeated, 0);
});

test('boss warning and projectiles resize without advancing combat, and zero time freezes all boss state', () => {
  const state = enterInvadersWave(5, 1700);
  Object.assign(state.boss, { phase: 'windup', attackIn: 0.5, x: 620, y: bossGeometry(state).targetY, aimX: 200, aimY: 1400 });
  state.hostileShots.push({ x: 300, y: 700, previousX: 290, previousY: 690, vx: 60, vy: 500, radius: 12, age: 0.4, life: 5, hostile: true });
  const snapshot = structuredClone(state);
  stepInvaders(state, { action: true, axisX: 1 }, 0, fixedRandom);
  assert.deepEqual(state, snapshot);
  resizeGame(state, 960, 300);
  assert.equal(state.boss.health, snapshot.boss.health);
  assert.equal(state.boss.attackIn, 0.5);
  assert.equal(state.boss.y, bossGeometry(state).targetY);
  assert.ok(Math.abs(state.hostileShots[0].vy - 500 * 300 / 1700) < 1e-9);
  assert.equal(state.hostileShots[0].age, 0.4);
});

test('bosses stay in frame and hostile fire stays bounded in short, desktop and portrait arenas', () => {
  for (const height of [240, 540, 1700]) {
    const state = enterInvadersWave(10, height);
    state.lives = 99;
    const shape = bossGeometry(state);
    assert.ok(shape.halfHeight <= 54);
    assert.ok(shape.targetY - shape.halfHeight >= 0);
    assert.ok(shape.targetY + shape.halfHeight < arenaFor(state).invadersBounds.top);
    frames(2400, dt => stepInvaders(state, idle, dt, fixedRandom));
    assert.ok(state.boss, 'a boss cannot silently escape below the arena');
    assert.ok(state.boss.x >= shape.left && state.boss.x <= shape.right);
    assert.ok(state.boss.y + shape.halfHeight <= height);
    assert.ok(state.hostileShots.length <= 18);
  }
});

test('boss health bar avoids the real landscape HUD conflict and remains visible across phone sizes', () => {
  for (const [cssWidth, cssHeight] of [[320, 500], [390, 650], [568, 215], [844, 285], [1280, 700]]) {
    const state = enterInvadersWave(5, 960 * cssHeight / cssWidth);
    const arena = arenaFor(state), unit = 960 / cssWidth, shape = bossGeometry(state);
    Object.assign(state.boss, { x: 590, y: shape.targetY, phase: 'recover' });
    const reservedRects = [{ x: 14 * unit, y: 8 * unit, width: 180 * unit, height: 30 * unit },
      { x: (cssWidth - 266) * unit, y: 15 * unit, width: 252 * unit, height: 25 * unit }];
    const snapshot = structuredClone(state);
    const bar = bossHealthBarLayout(state, arena, { cssHeight, reservedRects });
    assert.ok(bar, `missing bar at ${cssWidth}`);
    assert.ok(bar.x >= 0 && bar.x + bar.width <= arena.width && bar.y >= 0 && bar.y + bar.height <= arena.height);
    for (const rect of reservedRects) assert.ok(!(bar.x < rect.x + rect.width && bar.x + bar.width > rect.x && bar.y < rect.y + rect.height && bar.y + bar.height > rect.y), `HUD overlap at ${cssWidth}`);
    if (cssWidth === 844) assert.ok(bar.y > state.boss.y + shape.halfHeight, 'the blocked landscape bar moves below the boss');
    assert.deepEqual(state, snapshot, 'health bar layout must not alter combat or pause state');
  }
});

test('heavy enemies require two hits, then combo scoring and shield rewards remain consistent', () => {
  const state = createInvadersState();
  state.combo = 3;
  state.kills = 4;
  state.enemies.push({ x: 300, y: 100, type: 'heavy', health: 2 });
  state.bullets.push({ x: 300, y: 110 });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.enemies[0].health, 1);
  assert.equal(state.score, 0);
  state.bullets.push({ x: 300, y: 110 });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.score, 15);
  assert.equal(state.combo, 4);
  assert.equal(state.pickups.length, 1);
});

test('a collected shield absorbs one hit before lives decrease again', () => {
  const state = createInvadersState();
  const arena = arenaFor(state);
  state.pickups.push({ x: state.player, y: arena.playerY, kind: 'shield' });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.shield, 1);
  assert.equal(state.score, 20);
  state.enemies.push({ x: state.player, y: arena.playerY });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.shield, 0);
  assert.equal(state.lives, 3);
  frames(90, dt => stepInvaders(state, idle, dt, fixedRandom));
  state.enemies.push({ x: state.player, y: arena.playerY });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.lives, 2);
});

test('five energy pickups award their bonuses and activate a temporary obstacle-clearing boost', () => {
  const state = createRunnerState();
  state.height = 100;
  const arena = arenaFor(state);
  for (let index = 0; index < 5; index += 1) state.collectibles.push({ x: arena.runnerX, height: 138 });
  stepRunner(state, 1 / 120, fixedRandom);
  assert.equal(state.collected, 5);
  assert.equal(state.energy, 0);
  assert.equal(state.bonus, 125);
  assert.ok(state.boost > 3);
  state.height = 0;
  state.velocity = 0;
  state.obstacles.push({ x: arena.runnerX, width: 58, height: 62 });
  stepRunner(state, 1 / 120, fixedRandom);
  assert.equal(state.obstacles.length, 0);
  assert.equal(state.ended, false);
  assert.equal(state.bonus, 135);
  state.boost = 0;
  state.obstacles.push({ x: arena.runnerX, width: 58, height: 62 });
  stepRunner(state, 1 / 120, fixedRandom);
  assert.equal(state.ended, true, 'protection ends when the boost expires');
});

test('Runner emits one brief landing effect only when its physical jump returns to ground', () => {
  const state = createRunnerState();
  state.spawnIn = 20;
  state.height = 1;
  state.velocity = -200;
  stepRunner(state, 1 / 60, fixedRandom);
  assert.equal(state.height, 0);
  assert.equal(state.velocity, 0);
  assert.equal(state.jumps, 0);
  const landing = state.effects.filter(item => item.kind === 'landing');
  assert.equal(landing.length, 1);
  assert.deepEqual([landing[0].x, landing[0].y, landing[0].age, landing[0].life], [arenaFor(state).runnerX, arenaFor(state).floor, 0, 0.3]);
  frames(20, dt => stepRunner(state, dt, fixedRandom));
  assert.equal(state.effects.filter(item => item.kind === 'landing').length, 1, 'standing on the floor cannot emit repeat effects');
  frames(20, dt => stepRunner(state, dt, fixedRandom));
  assert.equal(state.effects.filter(item => item.kind === 'landing').length, 0);
});

test('all five questions have one valid correct answer and reject invalid selections', () => {
  assert.equal(questions.length, 5);
  let perfectScore = 0;
  let wrongScore = 0;
  for (const question of questions) {
    assert.ok(question.prompt.trim());
    assert.ok(question.explanation.trim());
    assert.ok(question.answers.length >= 2);
    assert.ok(question.answers.every(answer => typeof answer === 'string' && answer.trim()));
    assert.ok(question.correct >= 0 && question.correct < question.answers.length);
    assert.equal(question.answers.filter((_, index) => gradeAnswer(question, index)).length, 1);
    perfectScore += Number(gradeAnswer(question, question.correct));
    wrongScore += Number(gradeAnswer(question, (question.correct + 1) % question.answers.length));
    for (const invalid of [-1, question.answers.length, '0', null, undefined, 0.5]) assert.equal(gradeAnswer(question, invalid), false);
  }
  assert.equal(perfectScore, 5);
  assert.equal(wrongScore, 0);
});

test('wave two offers an untimed family choice while retaining earned progression', () => {
  const state = createInvadersState();
  Object.assign(state, { wave: 2, waveSpawned: 6, weaponLevel: 3, kills: 14 });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.phase, 'choice');
  const frozen = structuredClone(state);
  frames(300, dt => stepInvaders(state, { action: true, right: true }, dt, fixedRandom));
  assert.equal(fireInvaders(state), false, 'Direct fire cannot mutate the untimed choice');
  assert.deepEqual(state, frozen);
  assert.equal(chooseInvaderWeapon(state, 'unavailable'), false);
  assert.equal(chooseInvaderWeapon(state, 'focused'), true);
  assert.equal(state.weaponFamily, 'focused');
  assert.equal(state.phase, 'intermission');
  assert.equal(state.weaponLevel, 3);
  assert.equal(state.kills, 14);
  assert.equal(chooseInvaderWeapon(state, 'spread'), false);
  assert.equal(createInvadersState().weaponFamily, 'spread');
});

test('focused beams trade width and cadence for actual armor damage at each stage', () => {
  for (const [level, beams, damage] of [[1, 1, 2], [2, 1, 3], [3, 2, 3]]) {
    const state = createInvadersState();
    Object.assign(state, { weaponFamily: 'focused', weaponLevel: level });
    fireInvaders(state);
    assert.equal(state.bullets.length, beams);
    assert.ok(state.bullets.every(bullet => bullet.damage === damage && bullet.kind === 'lance' && bullet.vx === 0));
    assert.equal(state.cooldown, 0.32);
  }
  const state = createInvadersState();
  state.enemies.push({ x: 300, y: 100, health: 3, type: 'heavy' });
  state.bullets.push({ x: 300, y: 110, damage: 3 });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.enemies.length, 0);
  assert.equal(state.kills, 1);
});

test('a supply loads six finite missile pairs that auto-fire within bounded active counts and expire', () => {
  const state = createInvadersState();
  state.wave = 3; state.spawnIn = 100;
  for (let index = 0; index < 2; index += 1) {
    state.enemies.push({ x: 300, y: 100 }); state.bullets.push({ x: 300, y: 110 });
    stepInvaders(state, idle, 1 / 120, fixedRandom);
  }
  assert.equal(state.pickups.filter(item => item.kind === 'missiles').length, 1);
  Object.assign(state.pickups.find(item => item.kind === 'missiles'), { x: state.player, y: state.playerY });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.missilePairs, 6);
  frames(500, dt => stepInvaders(state, { action: true }, dt, fixedRandom));
  assert.equal(state.missilePairs, 0);
  assert.ok(state.missiles.length <= 8);
  assert.ok(state.bullets.length <= 64);
  frames(300, dt => stepInvaders(state, idle, dt, fixedRandom));
  assert.equal(state.missiles.length, 0);
  assert.equal(createInvadersState().missilePairs, 0);
});

test('equipping either family preserves earned progress, inventory, projectiles and all combat timers', () => {
  const state = createInvadersState();
  Object.assign(state, { weaponLevel: 3, score: 470, kills: 19, wave: 4, missilePairs: 7,
    cooldown: .19, missileCooldown: .41, shield: 1, shieldTime: 8, elapsed: 34, choiceMade: false });
  state.missiles.push({ x: 300, y: 240, vx: 23, vy: -510, age: .4, life: 2.2, kind: 'missile', trail: [] });
  for (const family of ['focused', 'spread']) {
    const before = structuredClone(state);
    assert.equal(equipInvaderWeapon(state, family), true);
    assert.deepEqual(state, { ...before, weaponFamily: family, choiceMade: true });
    assert.equal(invaderWeapon(state).level, 3);
  }
  const unchanged = structuredClone(state);
  assert.equal(equipInvaderWeapon(state, 'laser'), false);
  assert.deepEqual(state, unchanged);
  for (const invalid of [null, createRunnerState(), { ...state, ended: true }, { ...state, lives: 0 }]) {
    assert.equal(equipInvaderWeapon(invalid, 'focused'), false);
  }
});

test('an explicit early loadout replaces the later choice while choosing at the boundary still resumes the break', () => {
  const early = createInvadersState();
  assert.equal(equipInvaderWeapon(early, 'focused'), true);
  Object.assign(early, { wave: 2, waveSpawned: 8, waveQuota: 8 });
  stepInvaders(early, idle, 1 / 120, fixedRandom);
  assert.equal(early.phase, 'intermission');
  assert.equal(early.weaponFamily, 'focused');
  const waiting = createInvadersState();
  Object.assign(waiting, { phase: 'choice', weaponLevel: 3, score: 205, missilePairs: 5, waveIn: .3 });
  const before = structuredClone(waiting);
  assert.equal(equipInvaderWeapon(waiting, 'focused'), true);
  assert.deepEqual(waiting, { ...before, weaponFamily: 'focused', choiceMade: true, phase: 'intermission', waveIn: 1.8 });
  assert.equal(createInvadersState().choiceMade, false, 'restart restores the ordinary wave-two decision');
});

test('the first three-kill upgrade awards four pairs once; later upgrades and hits preserve the inventory', () => {
  const state = createInvadersState();
  Object.assign(state, { spawnIn: 100, kills: 2, missilePairs: 3 });
  for (let kill = 3; kill <= 7; kill += 1) {
    state.enemies.push({ x: 300, y: 100 }); state.bullets.push({ x: 300, y: 110 });
    stepInvaders(state, idle, 1 / 120, fixedRandom);
    assert.equal(state.missilePairs, 7);
  }
  assert.equal(state.weaponLevel, 3);
  state.enemies.push({ x: state.player, y: state.playerY });
  stepInvaders(state, idle, 1 / 120, fixedRandom);
  assert.equal(state.missilePairs, 7);
  assert.equal(createInvadersState().missilePairs, 0, 'restart clears missile inventory');
  const capped = createInvadersState();
  Object.assign(capped, { kills: 2, missilePairs: 7, spawnIn: 100 });
  capped.enemies.push({ x: 300, y: 100 }); capped.bullets.push({ x: 300, y: 110 });
  stepInvaders(capped, idle, 1 / 120, fixedRandom);
  assert.equal(capped.missilePairs, INVADER_MISSILES.maxPairs);
});

test('missile supplies start at wave two, recur at six kills and never accumulate more than two capsules', () => {
  const state = createInvadersState(); state.spawnIn = 100;
  const kill = () => {
    state.enemies.push({ x: 300, y: 100 }); state.bullets.push({ x: 300, y: 110 });
    stepInvaders(state, idle, 1 / 120, fixedRandom);
  };
  kill(); assert.equal(state.pickups.filter(item => item.kind === 'missiles').length, 0);
  state.wave = 2; kill();
  assert.equal(state.pickups.filter(item => item.kind === 'missiles').length, 1);
  while (state.kills < 6) kill();
  assert.equal(state.pickups.filter(item => item.kind === 'missiles').length, 2);
  while (state.kills < 18) kill();
  assert.equal(state.pickups.filter(item => item.kind === 'missiles').length, 2);
  state.pickups = []; state.wave = 3; kill();
  assert.equal(state.pickups.filter(item => item.kind === 'missiles').length, 1, 'a new wave offers another supply');
});

test('a collected capsule replenishes six pairs up to eight and keeps shield identity separate', () => {
  for (const [before, expected] of [[0, 6], [1, 7], [3, 8], [8, 8]]) {
    const state = createInvadersState(); state.missilePairs = before;
    state.pickups.push({ x: state.player, y: state.playerY, kind: 'missiles' });
    stepInvaders(state, idle, 1 / 120, fixedRandom);
    assert.equal(state.missilePairs, expected);
    assert.equal(state.shield, 0);
    assert.equal(state.lastPickup, 'missiles');
    assert.ok(state.effects.some(item => item.kind === 'missile-load'));
    state.pickups.push({ x: state.player, y: state.playerY, kind: 'shield' });
    stepInvaders(state, idle, 1 / 120, fixedRandom);
    assert.equal(state.shield, 1);
    assert.equal(state.missilePairs, expected);
  }
});

test('paired missiles have their own 0.7-second cadence, obey the active cap and cannot launch during a choice', () => {
  const state = createInvadersState();
  Object.assign(state, { missilePairs: 8, cooldown: .2, spawnIn: 100 });
  assert.equal(fireInvaders(state), true);
  assert.equal(state.missiles.length, 2);
  assert.equal(state.bullets.length, 0, 'a missile launch does not bypass primary cooldown');
  assert.equal(state.missileCooldown, .7);
  assert.equal(state.missilePairs, 7);
  frames(83, dt => stepInvaders(state, idle, dt, fixedRandom));
  state.cooldown = .2;
  assert.equal(fireInvaders(state), false);
  frames(2, dt => stepInvaders(state, idle, dt, fixedRandom));
  state.cooldown = .2;
  assert.equal(fireInvaders(state), true);
  assert.equal(state.missilePairs, 6);
  state.missiles = Array.from({ length: 8 }, () => ({ x: 300, y: 300, kind: 'missile' }));
  state.cooldown = .2; state.missileCooldown = 0;
  assert.equal(fireInvaders(state), false);
  assert.equal(state.missilePairs, 6);
  state.missiles = []; state.phase = 'choice';
  const frozen = structuredClone(state);
  assert.equal(fireInvaders(state), false);
  assert.deepEqual(state, frozen);
});

test('homing waits for launch clearance and bends gently toward a visible living target ahead', () => {
  const state = createInvadersState(); state.spawnIn = 100;
  state.missiles.push({ x: 300, y: 430, vx: 0, age: 0, life: 2.2, kind: 'missile' });
  state.enemies.push({ x: 600, y: 100, health: 99 });
  frames(20, dt => stepInvaders(state, idle, dt, fixedRandom));
  assert.equal(state.missiles[0].x, 300);
  frames(16, dt => stepInvaders(state, idle, dt, fixedRandom));
  const missile = state.missiles[0];
  assert.ok(missile.x > 300 && missile.vx > 0);
  assert.ok(missile.vx <= INVADER_MISSILES.maxLateralSpeed);
  assert.ok(missile.trail.length <= 8);
  assert.ok(missile.trail.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
});

test('dead, off-screen, invalid and behind targets do not bend missiles; no target falls back to straight flight', () => {
  const baseline = createInvadersState(), ignored = createInvadersState();
  for (const state of [baseline, ignored]) {
    state.spawnIn = 100;
    state.missiles.push({ x: 300, y: 350, vx: NaN, age: .2, life: 2.2, kind: 'missile' });
  }
  ignored.enemies.push({ x: 600, y: 100, health: 0 }, { x: -100, y: 100 }, { x: 700, y: -60 },
    { x: 700, y: 410 }, { x: NaN, y: 200 });
  frames(10, dt => { stepInvaders(baseline, idle, dt, fixedRandom); stepInvaders(ignored, idle, dt, fixedRandom); });
  assert.deepEqual(ignored.missiles, baseline.missiles);
  assert.equal(ignored.missiles[0].vx, 0);
  assert.ok(Number.isFinite(ignored.missiles[0].x));
});

test('missile trails and velocity resize coherently; homing stays finite and inside both arena edges', () => {
  const state = createInvadersState(); state.spawnIn = 100; state.missilePairs = 8;
  fireInvaders(state);
  frames(5, dt => stepInvaders(state, idle, dt, fixedRandom));
  const before = structuredClone(state.missiles[0]);
  resizeGame(state, 480, 1080);
  const after = state.missiles[0];
  assert.equal(after.x, before.x * .5); assert.equal(after.y, before.y * 2);
  assert.equal(after.vx, before.vx * .5); assert.equal(after.vy, before.vy * 2);
  assert.deepEqual(after.trail, before.trail.map(point => ({ x: point.x * .5, y: point.y * 2 })));
  state.enemies.push({ x: 470, y: 100, health: 99 });
  frames(120, dt => {
    stepInvaders(state, { action: true }, dt, fixedRandom);
    assert.ok(state.missiles.length <= 8);
    for (const missile of state.missiles) {
      assert.ok(missile.x >= 8 && missile.x <= state.world.width - 8);
      assert.ok([missile.x, missile.y, missile.vx, missile.vy].every(Number.isFinite));
    }
  });
});

test('missile swept hits damage normal threats and bosses and generate impact feedback', () => {
  const state = createInvadersState(); state.spawnIn = 100;
  state.enemies.push({ x: 300, y: 100, health: 2, type: 'heavy' });
  state.missiles.push({ x: 300, y: 110, vx: 0, age: 0, life: 2.2, kind: 'missile', damage: 2 });
  stepInvaders(state, idle, .05, fixedRandom);
  assert.equal(state.kills, 1); assert.equal(state.missiles.length, 0);
  assert.ok(state.effects.some(item => item.kind === 'missile-impact'));
  const boss = enterInvadersWave(5);
  Object.assign(boss.boss, { health: 2, phase: 'recover', attackIn: 10 });
  const shape = bossGeometry(boss);
  boss.missiles.push({ x: boss.boss.x, y: shape.targetY + 12, vx: 0, age: 0, life: 2.2, kind: 'missile', damage: 2 });
  stepInvaders(boss, idle, .05, fixedRandom);
  assert.equal(boss.boss, null); assert.equal(boss.bossesDefeated, 1);
  assert.ok(boss.effects.some(item => item.kind === 'missile-impact'));
});

test('homing is reproducible under seeded challenge ticks and emits no new random draws', () => {
  const a = createInvadersChallenge({ seed: 'missile-week' }), b = createInvadersChallenge({ seed: 'missile-week' });
  for (const state of [a, b]) {
    Object.assign(state, { missilePairs: 8, lives: 99, spawnIn: 100 });
    state.enemies.push({ x: 600, y: 250, health: 99 });
  }
  frames(180, () => {
    stepInvaders(a, { action: true }, 1 / 60, () => 0);
    stepInvaders(b, { action: true }, 1 / 120, () => 1);
  });
  assert.deepEqual(a, b);
  assert.equal(a.randomState, createInvadersChallenge({ seed: 'missile-week' }).randomState, 'target selection consumes no random values');
});

test('Scope Creep expands its warned fan and Change Request staggers a locked pair', () => {
  const scope = enterInvadersWave(5);
  Object.assign(scope.boss, { health: 30, phase: 'recover', attackIn: 0 });
  stepInvaders(scope, idle, 1 / 120, fixedRandom);
  assert.deepEqual(scope.boss.warningOffsets, [-120, 0, 120]);
  const change = enterInvadersWave(10);
  Object.assign(change.boss, { attackCount: 1, phase: 'recover', attackIn: 0 });
  stepInvaders(change, idle, 1 / 120, fixedRandom);
  assert.deepEqual(change.boss.warningOffsets, [-60, 60]);
  const aim = change.boss.aimX;
  change.player = 100; change.boss.attackIn = 0;
  stepInvaders(change, idle, 1 / 120, fixedRandom);
  assert.equal(change.hostileShots.length, 1);
  assert.equal(change.boss.pendingShots.length, 1);
  assert.equal(change.boss.aimX, aim);
  const queuedY = change.boss.pendingShots[0].y;
  resizeGame(change, 960, 1080);
  assert.equal(change.boss.pendingShots[0].y, queuedY * 2, 'a delayed shot rotates with its locked warning');
  frames(32, dt => stepInvaders(change, idle, dt, fixedRandom));
  assert.equal(change.hostileShots.length, 2);
  assert.equal(change.boss.pendingShots.length, 0);
});

test('challenge seed and fixed ticks reproduce state; geometry and timer survive resize', () => {
  const a = createInvadersChallenge({ seed: 'week-42', challengeId: '42', durationSeconds: 300 });
  const b = createInvadersChallenge({ seed: 'week-42', challengeId: '42', durationSeconds: 300 });
  a.lives = b.lives = 99;
  for (let index = 0; index < 1200; index += 1) {
    const input = { targetX: 480 + Math.sin(index / 40) * 300, action: true };
    stepInvaders(a, input, 1 / 60, () => 0);
    stepInvaders(b, input, 1 / 120, () => 1);
  }
  assert.deepEqual(a, b, 'challenge ignores external randomness and variable caller deltas');
  const frozen = structuredClone(a);
  resizeGame(a, 720, 320);
  assert.deepEqual(a, frozen);
  assert.deepEqual(a.world, CHALLENGE_ARENA);
  const timed = createInvadersChallenge({ seed: 'timer', durationSeconds: 1 });
  frames(120, dt => stepInvaders(timed, idle, dt));
  assert.equal(timed.ended, true);
  assert.equal(invadersResult(timed).elapsed, 1);
  assert.equal(invadersResult(timed).reason, 'time');
  assert.equal(invadersResult(timed).rulesVersion, '1.5.0');
});

test('replay cycles through three distinct valid five-question rounds before repeating', () => {
  const seen = new Set();
  for (let round = 0; round < 3; round += 1) {
    const set = questionsForRound(round);
    assert.equal(set.length, 5);
    for (const question of set) {
      assert.ok(!seen.has(question.prompt), 'replay introduces new prompts during the three-round cycle');
      seen.add(question.prompt);
      assert.ok(question.category && question.explanation);
      assert.equal(question.answers.filter((_, index) => gradeAnswer(question, index)).length, 1);
    }
  }
  assert.equal(seen.size, 15);
  assert.deepEqual(questionsForRound(3), questionsForRound(0));
  assert.deepEqual(questionsForRound(-1), questionsForRound(0));
  assert.deepEqual(questionsForRound(NaN), questionsForRound(0));
});
