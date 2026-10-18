import test from 'node:test';
import assert from 'node:assert/strict';
import { createInvadersState, arenaFor, INVADER_HAZARDS } from '../public/game-engine.js';
import { SHIP_STYLES, SHIP_PALETTES } from '../public/ship-customization.js';
import { createRenderer, drawShipPreview, wingmateVisualGeometry, enemyTelegraphGeometry } from '../public/game-renderer.js';

// Recording the real drawing operations catches mutation, invalid geometry and
// cosmetic coupling without adding a native canvas dependency to the project.
function canvasTrace(width = 128, height = 160) {
  const calls = [], values = { canvas: { width, height }, globalAlpha: 1 };
  const finite = list => { for (const value of list) { if (Array.isArray(value)) finite(value); else if (typeof value === 'number') assert.ok(Number.isFinite(value), 'Drawing coordinates stay finite'); } };
  const ctx = new Proxy(values, {
    get(target, key) {
      if (key in target) return target[key];
      if (key === 'measureText') return value => ({ width: String(value).length * 8 });
      if (key === 'createLinearGradient' || key === 'createRadialGradient') return (...args) => {
        finite(args); calls.push([key, ...args]);
        return { addColorStop(offset, color) { finite([offset]); calls.push(['color', offset, color]); } };
      };
      return (...args) => { finite(args); calls.push([key, ...args]); };
    },
    set(target, key, value) { target[key] = value; if (typeof value !== 'object') calls.push(['set', key, value]); return true; },
  });
  return { ctx, calls };
}
const paths = calls => calls.filter(([name]) => ['moveTo', 'lineTo', 'bezierCurveTo', 'quadraticCurveTo', 'roundRect', 'arc', 'ellipse'].includes(name));
function scene() {
  const state = createInvadersState({ width: 960, height: 1669 });
  Object.assign(state, { elapsed: 12, weaponLevel: 3, supportFamily: 'wingmates', supportLevel: 2, inboxTime: 4, score: 500 });
  state.enemies = [
    { x: 220, y: 320, age: .8, scale: 1.35, type: 'drone', hazardId: 'scope-creep', label: INVADER_HAZARDS[0].label, behavior: 'client', attackPhase: 'warning', aimX: 480, aimY: 1300, health: 1 },
    { x: 690, y: 360, age: .8, scale: 1.35, type: 'drone', hazardId: 'missed-deadlines', label: INVADER_HAZARDS[1].label, behavior: 'deadline', attackPhase: 'warning', aimX: 690, aimY: 1695, health: 1 },
  ];
  state.effects = [{ kind: 'relay', x: 220, y: 320, toX: 690, toY: 360, age: .08, life: .22, seed: 1 },
    { kind: 'explosion', x: 330, y: 460, age: .2, life: .65, seed: 2 },
    { kind: 'inbox-zero', x: 480, y: 1500, age: .2, life: .9, seed: 3 }];
  state.hostileShots = [{ kind: 'paper', x: 430, y: 800, vx: 0, vy: 400, radius: 10 }];
  state.bullets = [{ kind: 'wingmate', x: 410, y: 1250, vx: -24, weaponLevel: 3 }];
  return state;
}

test('three ship previews have distinct geometry and six paints retain each silhouette', () => {
  const silhouettes = [];
  for (const { id: style } of SHIP_STYLES) {
    let baseline;
    for (const { id: color, body, light, dark } of SHIP_PALETTES) {
      const { ctx, calls } = canvasTrace();
      drawShipPreview(ctx, { style, color });
      const shape = paths(calls);
      if (baseline) assert.deepEqual(shape, baseline, 'Paint cannot change hull geometry or mounts'); else baseline = shape;
      for (const paint of [body, light, dark]) assert.ok(calls.some(call => call[0] === 'color' && call[2] === paint));
      assert.deepEqual(calls.find(call => call[0] === 'setTransform'), ['setTransform', 1, 0, 0, 1, 0, 0]);
      assert.equal(calls.filter(call => call[0] === 'save').length, calls.filter(call => call[0] === 'restore').length);
    }
    silhouettes.push(JSON.stringify(baseline));
  }
  assert.equal(new Set(silhouettes).size, 3, 'Studio, Relay and Fixer are original silhouettes, not repaints');
});

test('invalid ship appearance draws exactly the safe default preview', () => {
  const first = canvasTrace(), fallback = canvasTrace();
  drawShipPreview(first.ctx, { style: '<script>', color: 'url(https://example.invalid/)' });
  drawShipPreview(fallback.ctx, { style: 'studio', color: 'orange' });
  assert.deepEqual(first.calls, fallback.calls);
});

test('the complete expansion renderer never changes simulation or appearance state', async () => {
  const renderer = createRenderer(); await renderer.loadImages();
  for (const { id: style } of SHIP_STYLES) for (const { id: color } of SHIP_PALETTES) {
    const state = scene(), appearance = Object.freeze({ style, color }), before = structuredClone(state), { ctx } = canvasTrace(390, 678);
    renderer.render(ctx, state, { width: 960, height: 1669, cssHeight: 678, shipAppearance: appearance });
    assert.deepEqual(state, before); assert.deepEqual(appearance, { style, color });
  }
});

test('paused rendering follows simulation time instead of an external clock', async () => {
  const renderer = createRenderer(); await renderer.loadImages(); const state = scene();
  const first = canvasTrace(), later = canvasTrace();
  renderer.render(first.ctx, state, { time: 1, shipAppearance: { style: 'relay', color: 'blue' } });
  renderer.render(later.ctx, state, { time: 900, shipAppearance: { style: 'relay', color: 'blue' } });
  assert.deepEqual(later.calls, first.calls);
});

test('reduced effects retain locked warnings and Relay feedback without decorative motion', async () => {
  const renderer = createRenderer(); await renderer.loadImages(); const first = canvasTrace(), later = canvasTrace(), state = scene();
  renderer.render(first.ctx, state, { reducedMotion: true, shipAppearance: { style: 'fixer', color: 'white' } });
  state.elapsed = 90; for (const enemy of state.enemies) enemy.age = 90;
  renderer.render(later.ctx, state, { reducedMotion: true, shipAppearance: { style: 'fixer', color: 'white' } });
  assert.deepEqual(later.calls, first.calls);
  assert.ok(first.calls.some(call => call[0] === 'lineTo' && call[1] === 690 && call[2] === 360), 'The actual relay connection remains visible');
});

test('Wingmate visuals share the exact firing origins and remain available during Inbox Zero', () => {
  const state = scene(), original = structuredClone(state), y = arenaFor(state).playerY - 6;
  assert.deepEqual(wingmateVisualGeometry(state).map(({ x, y }) => ({ x, y })), [{ x: 410, y }, { x: 550, y }]);
  assert.deepEqual(state, original, 'Reading mount geometry cannot change the simulation');
  state.player = 38; assert.equal(wingmateVisualGeometry(state)[0].x, 8);
  state.supportFamily = 'relay'; state.inboxTime = 0; assert.deepEqual(wingmateVisualGeometry(state), []);
  state.inboxTime = 6; assert.equal(wingmateVisualGeometry(state).length, 2);
  state.supportLevel = 0; assert.deepEqual(wingmateVisualGeometry(state), []);
});

test('client target and deadline lane are locked to the warned geometry in every arena', () => {
  for (const height of [240, 540, 1669]) {
    const state = createInvadersState({ width: 960, height }), arena = arenaFor(state);
    const client = { behavior: 'client', attackPhase: 'warning', x: 200, y: 100, aimX: 430, aimY: 200 };
    const deadline = { behavior: 'deadline', attackPhase: 'warning', x: 600, y: 40, aimX: 600, scale: 1.35 };
    assert.deepEqual(enemyTelegraphGeometry(client, arena), { kind: 'target', x: 430, y: 200, fromX: 200, fromY: 100 });
    const lane = enemyTelegraphGeometry(deadline, arena); assert.equal(lane.left, 600 - (32 * 1.35 + 21)); assert.equal(lane.right, 600 + (32 * 1.35 + 21)); assert.equal(lane.bottom, height);
    assert.equal(enemyTelegraphGeometry({ ...client, attackPhase: 'recover' }, arena), null);
    assert.equal(enemyTelegraphGeometry({ ...client, aimX: NaN }, arena), null);
  }
});
