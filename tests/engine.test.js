import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARENA, INVADER_HAZARDS, INVADER_THREAT_SCALE, invaderWeapon, arenaFor, resizeGame, createInputState, setInput, getInput, clearInput,
  createInvadersState, fireInvaders, steerInvaders, stepInvaders,
  createRunnerState, jumpRunner, stepRunner, gradeAnswer,
} from '../public/game-engine.js';
import { questions, questionsForRound } from '../public/questions.js';
import { runnerCameraOffset } from '../public/game-renderer.js';

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
  Object.assign(late, { wave: 99, phase: 'intermission', waveIn: 0 });
  stepInvaders(late, idle, 0.05, fixedRandom);
  assert.equal(late.waveQuota, 10);
  late.spawnIn = 100;
  late.enemies.push({ x: 100, y: 100, type: 'drone' });
  stepInvaders(late, idle, 0.05, fixedRandom);
  assert.ok(Math.abs(late.enemies[0].y - 100 - 118 * 0.05) < 1e-9);
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
