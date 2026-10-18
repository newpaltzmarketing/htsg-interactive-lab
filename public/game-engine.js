// Deterministic rules. Browser events, rendering, and clocks stay outside this module.
export const ARENA = Object.freeze({ width: 960, height: 540, floor: 454 });
export const INVADER_THREAT_SCALE = 1.35;
export const INVADER_WEAPONS = Object.freeze([
  { level: 1, kills: 0, name: 'Single shot', pattern: [{ offset: 0, vx: 0 }] },
  { level: 2, kills: 3, name: 'Twin streams', pattern: [{ offset: -16, vx: 0 }, { offset: 16, vx: 0 }] },
  { level: 3, kills: 7, name: 'Quad spread', pattern: [{ offset: -28, vx: -115 }, { offset: -10, vx: -30 }, { offset: 10, vx: 30 }, { offset: 28, vx: 115 }] },
].map(weapon => Object.freeze({ ...weapon, pattern: Object.freeze(weapon.pattern.map(Object.freeze)) })));
export function invaderWeapon(state) {
  return INVADER_WEAPONS[Math.max(0, Math.min(2, Math.floor(state?.weaponLevel || 1) - 1))];
}
export const INVADER_HAZARDS = Object.freeze([
  { id: 'scope-creep', label: 'Scope creep' },
  { id: 'missed-deadlines', label: 'Missed deadlines' },
  { id: 'budget-overruns', label: 'Budget overruns' },
  { id: 'tech-debt', label: 'Tech debt' },
  { id: 'bottlenecks', label: 'Bottlenecks' },
  { id: 'broken-handoffs', label: 'Broken handoffs' },
].map(hazard => Object.freeze(hazard)));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomUnit = random => clamp(Number(random()) || 0, 0, 1);
const timeStep = seconds => Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, 0.05) : 0;

function dimensions(options = {}) {
  return {
    width: clamp(Number(options.width) || ARENA.width, 320, 2400),
    height: clamp(Number(options.height) || ARENA.height, 240, 2600),
  };
}

export function arenaFor(state) {
  const world = state?.world || ARENA;
  const bottom = world.height - (world.height > world.width ? 120 : 64);
  const invadersBounds = { left: 38, right: world.width - 38, top: Math.min(world.height * 0.5, bottom - 64), bottom };
  return {
    width: world.width, height: world.height,
    floor: world.height - clamp(world.height * 0.16, 64, 86),
    playerY: Number.isFinite(state?.playerY) ? clamp(state.playerY, invadersBounds.top, bottom) : bottom,
    invadersBounds,
    runnerX: world.width * 176 / 960,
    runnerScale: 1 + clamp((world.height / world.width - 0.85) / 0.4, 0, 1) * 0.3,
  };
}

export function resizeGame(state, width, height) {
  if (!state) return state;
  const previous = arenaFor(state);
  const world = dimensions({ width, height });
  const scaleX = world.width / previous.width;
  const scaleY = world.height / previous.height;
  state.world = world;
  if (state.kind === 'invaders') {
    const next = arenaFor(state);
    const verticalProgress = clamp((previous.playerY - previous.invadersBounds.top) / (previous.invadersBounds.bottom - previous.invadersBounds.top), 0, 1);
    state.player = clamp(state.player * scaleX, next.invadersBounds.left, next.invadersBounds.right);
    state.playerY = next.invadersBounds.top + verticalProgress * (next.invadersBounds.bottom - next.invadersBounds.top);
    for (const group of [state.enemies, state.bullets, state.pickups]) {
      for (const item of group || []) {
        item.x *= scaleX;
        item.y *= scaleY;
        if (Number.isFinite(item.baseX)) item.baseX *= scaleX;
        if (Number.isFinite(item.previousY)) item.previousY *= scaleY;
        if (Number.isFinite(item.previousX)) item.previousX *= scaleX;
      }
    }
  } else {
    for (const group of [state.obstacles, state.collectibles]) {
      for (const item of group || []) item.x *= scaleX;
    }
    // Jump height and velocity are physical distances, not absolute screen coordinates.
  }
  for (const effect of state.effects || []) { effect.x *= scaleX; effect.y *= scaleY; }
  return state;
}
export const resizeGameState = resizeGame;

export function createInputState() { return { left: new Set(), right: new Set(), up: new Set(), down: new Set(), action: new Set() }; }
export function setInput(input, action, source, pressed) {
  if (!input[action]) return;
  if (pressed) input[action].add(source);
  else input[action].delete(source);
}
export function getInput(input) { return Object.fromEntries(Object.entries(input).map(([key, sources]) => [key, sources.size > 0])); }
export function clearInput(input) { Object.values(input).forEach(sources => sources.clear()); }

function effect(state, kind, x, y, life = 0.65) {
  state.effects.push({ kind, x, y, age: 0, life, seed: state.nextId++ });
}
function tickEffects(state, dt) {
  state.effects.forEach(item => { item.age += dt; });
  state.effects = state.effects.filter(item => item.age < item.life);
}

export function createInvadersState(options = {}) {
  const world = dimensions(options);
  return {
    kind: 'invaders', world, score: 0, lives: 3, player: world.width / 2, playerY: arenaFor({ world }).playerY,
    bullets: [], enemies: [], pickups: [], effects: [], elapsed: 0,
    spawnIn: 1.1, cooldown: 0, ended: false, bank: 0,
    wave: 1, waveSpawned: 0, waveQuota: 6, phase: 'wave', waveIn: 0,
    combo: 0, bestCombo: 0, kills: 0, shield: 0, shieldTime: 0,
    weaponLevel: 1, weaponUpgradeTime: 0,
    damageCooldown: 0, lastHazard: '', lastHazardTime: 0, lastHazardBlocked: false, lastHazardReason: '', nextId: 1,
  };
}

export function fireInvaders(state) {
  if (state.ended || state.cooldown > 0) return false;
  const { playerY, width } = arenaFor(state);
  const weapon = invaderWeapon(state);
  for (const shot of weapon.pattern) {
    const x = clamp(state.player + shot.offset, 8, width - 8);
    state.bullets.push({ x, previousX: x, y: playerY - 35, previousY: playerY - 35, vx: shot.vx, weaponLevel: weapon.level, id: state.nextId++ });
  }
  // More coverage is the reward; cadence stays bounded at every weapon level.
  state.cooldown = 0.24;
  return true;
}

// Keep the original X/seconds arguments; optional Y extends direct steering to two axes.
export function steerInvaders(state, targetX, seconds, targetY) {
  const dt = timeStep(seconds);
  if (!dt || state.ended) return;
  const arena = arenaFor(state);
  const { left, right, top, bottom } = arena.invadersBounds;
  const follow = (position, target, min, max) => {
    if (!Number.isFinite(target)) return position;
    const movement = clamp((clamp(target, min, max) - position) * (1 - Math.exp(-36 * dt)), -4200 * dt, 4200 * dt);
    return clamp(position + movement, min, max);
  };
  state.player = follow(state.player, targetX, left, right);
  state.playerY = follow(arena.playerY, targetY, top, bottom);
}

function damageInvaders(state, x, y, enemy, reason) {
  if (state.damageCooldown > 0 || state.ended) return;
  state.combo = 0;
  state.damageCooldown = 0.7;
  state.lastHazard = enemy?.label || enemy?.hazard?.label || 'Project chaos';
  state.lastHazardTime = 2.4;
  state.lastHazardBlocked = state.shield > 0;
  state.lastHazardReason = reason;
  if (state.shield > 0) {
    state.shield = 0;
    state.shieldTime = 0;
    effect(state, 'shield', x, y, 0.8);
  } else {
    state.lives = Math.max(0, state.lives - 1);
    effect(state, 'impact', x, y, 0.65);
    state.ended = state.lives === 0;
  }
}

function spawnInvader(state, random) {
  const margin = 76;
  const laneCount = 5;
  const lane = (state.waveSpawned + state.wave) % laneCount;
  const x = margin + (state.world.width - margin * 2) * (lane + 0.3 + randomUnit(random) * 0.4) / laneCount;
  const heavy = state.wave >= 3 && state.waveSpawned % 4 === 3;
  const hazard = INVADER_HAZARDS[(state.waveSpawned + state.wave - 1) % INVADER_HAZARDS.length];
  state.enemies.push({
    id: state.nextId++, x, baseX: x, y: -58, scale: INVADER_THREAT_SCALE,
    type: heavy ? 'heavy' : state.waveSpawned % 3 === 0 ? 'interceptor' : 'drone',
    hazard, hazardId: hazard.id, label: hazard.label,
    health: heavy ? 2 : 1, maxHealth: heavy ? 2 : 1,
    phase: randomUnit(random) * Math.PI * 2,
    age: 0,
  });
  state.waveSpawned += 1;
}

export function stepInvaders(state, input = {}, seconds, random = Math.random) {
  const dt = timeStep(seconds);
  if (state.ended || !dt) return state;
  const arena = arenaFor(state);
  state.elapsed += dt;
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.damageCooldown = Math.max(0, state.damageCooldown - dt);
  state.lastHazardTime = Math.max(0, state.lastHazardTime - dt);
  state.weaponUpgradeTime = Math.max(0, state.weaponUpgradeTime - dt);
  state.shieldTime = Math.max(0, state.shieldTime - dt);
  if (state.shieldTime === 0) state.shield = 0;
  tickEffects(state, dt);
  const oldX = state.player;
  state.playerY = arena.playerY;
  const horizontalHeld = input.left || input.right;
  const verticalHeld = input.up || input.down;
  const axisX = horizontalHeld || !Number.isFinite(input.axisX) ? 0 : clamp(input.axisX, -1, 1);
  const axisY = verticalHeld || !Number.isFinite(input.axisY) ? 0 : clamp(input.axisY, -1, 1);
  const axisLength = Math.max(1, Math.hypot(axisX, axisY));
  steerInvaders(state, horizontalHeld || axisX ? NaN : input.targetX, dt, verticalHeld || axisY ? NaN : input.targetY);
  if (input.left || input.right) {
    state.player = clamp(state.player + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 430 * dt, 38, arena.width - 38);
  } else if (axisX) {
    state.player = clamp(state.player + axisX / axisLength * 850 * dt, arena.invadersBounds.left, arena.invadersBounds.right);
  }
  if (input.up || input.down) {
    state.playerY = clamp(state.playerY + ((input.down ? 1 : 0) - (input.up ? 1 : 0)) * 430 * dt, arena.invadersBounds.top, arena.invadersBounds.bottom);
  } else if (axisY) {
    state.playerY = clamp(state.playerY + axisY / axisLength * 850 * dt, arena.invadersBounds.top, arena.invadersBounds.bottom);
  }
  const desiredBank = clamp((state.player - oldX) / Math.max(dt, 0.001) / 700, -0.65, 0.65);
  state.bank += (desiredBank - state.bank) * Math.min(1, dt * 12);
  if (input.action) fireInvaders(state);

  if (state.phase === 'intermission') {
    state.waveIn -= dt;
    if (state.waveIn <= 0) {
      state.wave += 1;
      state.waveSpawned = 0;
      state.waveQuota = Math.min(10, 6 + (state.wave - 1) * 2);
      state.phase = 'wave';
      state.spawnIn = 0.75;
    }
  } else if (state.waveSpawned < state.waveQuota) {
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnInvader(state, random);
      state.spawnIn += Math.max(0.85, 1.15 - (state.wave - 1) * 0.025);
    }
  }
  // Keep crossing times comparable on a tall phone and a wide desktop arena.
  const verticalScale = clamp(arena.height / 540, 0.65, 4.5);
  const descent = Math.min(118, 74 + (state.wave - 1) * 4) * verticalScale;
  state.bullets.forEach(bullet => {
    bullet.previousX = bullet.x; bullet.previousY = bullet.y;
    bullet.x += (bullet.vx || 0) * verticalScale * dt;
    bullet.y -= 620 * verticalScale * dt;
  });
  state.enemies.forEach(enemy => {
    enemy.age = (enemy.age || 0) + dt;
    enemy.y += descent * (enemy.type === 'interceptor' ? 1.04 : 1) * dt;
    if (Number.isFinite(enemy.baseX)) {
      const edge = enemy.type === 'heavy' ? 78 : 64;
      enemy.x = clamp(enemy.baseX + Math.sin(enemy.age * 1.25 + enemy.phase) * (enemy.type === 'heavy' ? 12 : 22), edge, arena.width - edge);
    }
  });
  for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
    const enemy = state.enemies[enemyIndex];
    const scale = enemy.scale || INVADER_THREAT_SCALE;
    const radius = (enemy.type === 'heavy' ? 39 : 32) * scale;
    const halfHeight = 25 * scale;
    const bulletIndex = state.bullets.findIndex(bullet => {
      const progress = clamp((bullet.previousY - enemy.y) / Math.max(0.001, bullet.previousY - bullet.y), 0, 1);
      const crossingX = bullet.previousX + (bullet.x - bullet.previousX) * progress;
      return Math.abs(enemy.x - crossingX) < radius && bullet.y < enemy.y + halfHeight && bullet.previousY >= enemy.y - halfHeight;
    });
    if (bulletIndex !== -1) {
      state.bullets.splice(bulletIndex, 1);
      enemy.health = (enemy.health ?? 1) - 1;
      if (enemy.health <= 0) {
        state.enemies.splice(enemyIndex, 1);
        state.combo += 1;
        state.bestCombo = Math.max(state.bestCombo, state.combo);
        state.kills += 1;
        const unlocked = state.kills >= 7 ? 3 : state.kills >= 3 ? 2 : 1;
        if (unlocked > state.weaponLevel) {
          state.weaponLevel = unlocked;
          state.weaponUpgradeTime = 2.4;
          effect(state, 'upgrade', state.player, state.playerY, 0.9);
        }
        state.score += 10 + Math.min(3, Math.floor(state.combo / 4)) * 5;
        effect(state, 'explosion', enemy.x, enemy.y);
        if (state.kills % 5 === 0) state.pickups.push({ x: enemy.x, y: enemy.y, kind: 'shield', id: state.nextId++ });
        continue;
      }
      effect(state, 'spark', enemy.x, enemy.y, 0.25);
    }
    const hitsPlayer = Math.abs(enemy.x - state.player) < radius + 21 && Math.abs(enemy.y - state.playerY) < halfHeight + 17;
    if (enemy.y > arena.height + 26 || hitsPlayer) {
      state.enemies.splice(enemyIndex, 1);
      damageInvaders(state, state.player, state.playerY, enemy, hitsPlayer ? 'collision' : 'miss');
    }
  }
  state.bullets = state.bullets.filter(bullet => bullet.y > -40 && bullet.x > -20 && bullet.x < arena.width + 20);
  for (let index = state.pickups.length - 1; index >= 0; index -= 1) {
    const pickup = state.pickups[index];
    pickup.y += Math.max(110, descent * 0.75) * dt;
    if (Math.abs(pickup.x - state.player) < 55 && Math.abs(pickup.y - state.playerY) < 48) {
      state.pickups.splice(index, 1);
      state.shield = 1;
      state.shieldTime = 12;
      state.score += 20;
      effect(state, 'shield', state.player, state.playerY, 0.9);
    } else if (pickup.y > arena.height + 40) state.pickups.splice(index, 1);
  }
  if (state.phase === 'wave' && state.waveSpawned >= state.waveQuota && state.enemies.length === 0 && !state.ended) {
    state.phase = 'intermission';
    state.waveIn = 1.8;
    state.score += 25 * state.wave;
    effect(state, 'wave', arena.width / 2, arena.height * 0.32, 1.8);
  }
  return state;
}

export function createRunnerState(options = {}) {
  return {
    kind: 'runner', world: dimensions(options), score: 0, height: 0, velocity: 0,
    obstacles: [], collectibles: [], effects: [], spawnIn: 1.6, elapsed: 0,
    ended: false, jumps: 0, energy: 0, collected: 0, bonus: 0, boost: 0,
    speed: 330, nextId: 1,
  };
}

export function jumpRunner(state) {
  if (state.ended || state.jumps >= 2) return false;
  const arena = arenaFor(state);
  state.velocity = state.jumps === 0 ? 670 : 600;
  state.jumps += 1;
  effect(state, state.jumps === 1 ? 'dust' : 'jet', arena.runnerX, arena.floor - state.height, 0.45);
  return true;
}

export function stepRunner(state, seconds, random = Math.random) {
  const dt = timeStep(seconds);
  if (state.ended || !dt) return state;
  const arena = arenaFor(state);
  state.elapsed += dt;
  tickEffects(state, dt);
  state.boost = Math.max(0, state.boost - dt);
  const wasAirborne = state.height > 0;
  state.height = Math.max(0, state.height + state.velocity * dt - 0.5 * 1720 * dt * dt);
  state.velocity = state.height > 0 ? state.velocity - 1720 * dt : 0;
  if (wasAirborne && state.height === 0) effect(state, 'landing', arena.runnerX, arena.floor, 0.3);
  if (state.height === 0 && state.velocity === 0) state.jumps = 0;
  state.speed = Math.min(510, 330 + state.elapsed * 2.1);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    const choice = randomUnit(random);
    const type = choice < 0.34 ? 'cargo' : choice < 0.68 ? 'rover' : 'conduit';
    const obstacle = {
      x: arena.width + 70, width: type === 'rover' ? 74 : type === 'conduit' ? 48 : 58,
      height: type === 'conduit' ? 80 : type === 'rover' ? 55 : 62,
      type, id: state.nextId++,
    };
    state.obstacles.push(obstacle);
    const arcHeight = 106 + randomUnit(random) * 32;
    for (let index = 0; index < 3; index += 1) {
      state.collectibles.push({ x: obstacle.x + 90 + index * 60, height: arcHeight + Math.sin(index * Math.PI / 2) * 24, id: state.nextId++ });
    }
    state.spawnIn += Math.max(1.3, 1.55 - state.elapsed / 500) + randomUnit(random) * 0.42;
  }
  state.obstacles.forEach(obstacle => { obstacle.x -= state.speed * dt; });
  state.obstacles = state.obstacles.filter(obstacle => obstacle.x + obstacle.width > -40);
  state.score += state.speed * dt / 20;
  for (let index = state.collectibles.length - 1; index >= 0; index -= 1) {
    const item = state.collectibles[index];
    item.x -= state.speed * dt;
    if (Math.abs(item.x - arena.runnerX) < 37 * arena.runnerScale && Math.abs(item.height - (state.height + 38 * arena.runnerScale)) < 44 * arena.runnerScale) {
      state.collectibles.splice(index, 1);
      state.energy += 1;
      state.collected += 1;
      state.bonus += 25;
      effect(state, 'energy', item.x, arena.floor - item.height, 0.5);
      if (state.energy >= 5) { state.energy = 0; state.boost = 3.2; }
    } else if (item.x < -35) state.collectibles.splice(index, 1);
  }
  for (let index = state.obstacles.length - 1; index >= 0; index -= 1) {
    const obstacle = state.obstacles[index];
    const collides = obstacle.x < arena.runnerX + 20 * arena.runnerScale && obstacle.x + obstacle.width * arena.runnerScale > arena.runnerX - 17 * arena.runnerScale && state.height + 7 * arena.runnerScale < obstacle.height * arena.runnerScale;
    if (collides && state.boost > 0) {
      effect(state, 'explosion', obstacle.x + obstacle.width * arena.runnerScale / 2, arena.floor - obstacle.height * arena.runnerScale / 2);
      state.obstacles.splice(index, 1);
      state.bonus += 10;
    } else if (collides) { state.ended = true; break; }
  }
  return state;
}

export function gradeAnswer(question, selectedIndex) {
  return Number.isInteger(selectedIndex) && selectedIndex === question.correct;
}
