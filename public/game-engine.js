// Deterministic rules. Browser events, rendering, and clocks stay outside this module.
export const ARENA = Object.freeze({ width: 960, height: 540, floor: 454 });
export const INVADER_THREAT_SCALE = 1.35;
export const INVADER_RULES_VERSION = '1.6.0';
export const INVADER_TICK = 1 / 120;
export const CHALLENGE_ARENA = Object.freeze({ width: 960, height: 1669 });
export const INVADER_MISSILES = Object.freeze({ maxPairs: 8, upgradePairs: 4, pickupPairs: 6, cadence: .7, maxActive: 8, life: 2.2, homingDelay: .18, maxLateralSpeed: 260 });
export const INVADER_SUPPORT = Object.freeze({ wingCadence: .65, maxWingShots: 8, supportCapacity: 56, relayCadence: .4, relayRange: 220, inboxCharge: 20, inboxDuration: 6 });
export const INVADER_WEAPONS = Object.freeze([
  { level: 1, kills: 0, name: 'Single shot', pattern: [{ offset: 0, vx: 0 }] },
  { level: 2, kills: 3, name: 'Twin streams', pattern: [{ offset: -16, vx: 0 }, { offset: 16, vx: 0 }] },
  { level: 3, kills: 7, name: 'Quad spread', pattern: [{ offset: -28, vx: -115 }, { offset: -10, vx: -30 }, { offset: 10, vx: 30 }, { offset: 28, vx: 115 }] },
].map(weapon => Object.freeze({ ...weapon, pattern: Object.freeze(weapon.pattern.map(Object.freeze)) })));
export function invaderWeapon(state) {
  const level = Math.max(0, Math.min(2, Math.floor(state?.weaponLevel || 1) - 1));
  if (state?.weaponFamily === 'focused') return [
    { level: 1, name: 'Focused pulse', damage: 2, cadence: 0.32, pattern: [{ offset: 0, vx: 0 }] },
    { level: 2, name: 'Focused lance', damage: 3, cadence: 0.32, pattern: [{ offset: 0, vx: 0 }] },
    { level: 3, name: 'Twin lances', damage: 3, cadence: 0.32, pattern: [{ offset: -9, vx: 0 }, { offset: 9, vx: 0 }] },
  ][level];
  return INVADER_WEAPONS[level];
}
export function chooseInvaderWeapon(state, family) {
  if (state.ended || state.phase !== 'choice' || !['spread', 'focused'].includes(family)) return false;
  state.weaponFamily = family; state.choiceMade = true; state.phase = 'intermission'; state.waveIn = 1.8;
  return true;
}
export function equipInvaderWeapon(state, family) {
  if (state?.kind !== 'invaders' || state.ended || !(state.lives > 0) || !['spread', 'focused'].includes(family)) return false;
  if (state.phase === 'choice') return chooseInvaderWeapon(state, family);
  state.weaponFamily = family;
  state.choiceMade = true;
  return true;
}
export function equipInvaderSupport(state, family) {
  if (state?.kind !== 'invaders' || state.ended || !(state.lives > 0) || !['wingmates', 'relay'].includes(family)) return false;
  state.supportFamily = family;
  return true;
}
export function createInvadersChallenge(config = {}) {
  const seed = String(config.seed ?? 'agency-invaders');
  let randomState = 2166136261;
  for (const character of seed) randomState = Math.imul(randomState ^ character.charCodeAt(0), 16777619) >>> 0;
  return Object.assign(createInvadersState(CHALLENGE_ARENA), { randomState, challenge: {
    seed, challengeId: config.challengeId ?? null, rulesVersion: INVADER_RULES_VERSION,
    durationSeconds: clamp(Number(config.durationSeconds) || 300, 1, 300),
  } });
}
export function invadersResult(state) {
  return { ...state.challenge, rulesVersion: INVADER_RULES_VERSION, score: Math.floor(state.score), wave: state.wave,
    kills: state.kills, bossesDefeated: state.bossesDefeated, elapsed: state.elapsed,
    reason: state.endReason || (state.ended ? 'lives' : 'active'), weaponFamily: state.weaponFamily,
    supportFamily: state.supportFamily, supportLevel: state.supportLevel, inboxBursts: state.inboxBursts };
}
function seededRandom(state) {
  state.randomState = (state.randomState + 0x6D2B79F5) >>> 0;
  let value = state.randomState; value = Math.imul(value ^ value >>> 15, value | 1);
  value ^= value + Math.imul(value ^ value >>> 7, value | 61);
  return ((value ^ value >>> 14) >>> 0) / 4294967296;
}
export function invaderPace(wave = 1) {
  const level = Math.max(1, Math.floor(wave));
  return {
    pressure: clamp((level - 2) / 12, 0, 1),
    descent: level <= 2 ? 74 + (level - 1) * 4 : Math.min(230, 90 + (level - 3) * 14),
    spawnInterval: level <= 2 ? 1.15 - (level - 1) * 0.025 : Math.max(0.38, 1.05 - (level - 3) * 0.065),
    quota: level <= 2 ? 6 + (level - 1) * 2 : Math.min(18, 8 + (level - 2) * 2),
  };
}
export function bossGeometry(state) {
  const arena = arenaFor(state);
  const halfWidth = Math.min(160, arena.width * 0.19);
  const halfHeight = clamp(arena.height * 0.1, 24, 54);
  return { halfWidth, halfHeight, left: halfWidth + 18, right: arena.width - halfWidth - 18,
    targetY: clamp(arena.height * 0.2, halfHeight + 6, Math.max(halfHeight + 6, arena.invadersBounds.top - halfHeight - 48)) };
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
  if (state.challenge) return state;
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
    for (const group of [state.enemies, state.bullets, state.pickups, state.hostileShots, state.missiles]) {
      for (const item of group || []) {
        item.x *= scaleX;
        item.y *= scaleY;
        if (Number.isFinite(item.baseX)) item.baseX *= scaleX;
        if (Number.isFinite(item.previousY)) item.previousY *= scaleY;
        if (Number.isFinite(item.previousX)) item.previousX *= scaleX;
        if (Number.isFinite(item.aimX)) item.aimX *= scaleX;
        if (Number.isFinite(item.aimY)) item.aimY *= scaleY;
        if (item.hostile || item.kind === 'missile') {
          if (Number.isFinite(item.vx)) item.vx *= scaleX;
          if (Number.isFinite(item.vy)) item.vy *= scaleY;
        }
        for (const point of item.trail || []) { point.x *= scaleX; point.y *= scaleY; }
      }
    }
    if (state.boss) {
      const shape = bossGeometry(state);
      state.boss.x = clamp(state.boss.x * scaleX, shape.left, shape.right);
      state.boss.y = state.boss.phase === 'entering' ? state.boss.y * scaleY : shape.targetY;
      state.boss.aimX *= scaleX; state.boss.aimY *= scaleY;
      for (const shot of state.boss.pendingShots || []) { shot.x *= scaleX; shot.y *= scaleY; shot.aimX *= scaleX; shot.aimY *= scaleY; }
    }
  } else {
    for (const group of [state.obstacles, state.collectibles]) {
      for (const item of group || []) item.x *= scaleX;
    }
    // Jump height and velocity are physical distances, not absolute screen coordinates.
  }
  for (const effect of state.effects || []) {
    effect.x *= scaleX; effect.y *= scaleY;
    if (Number.isFinite(effect.toX)) effect.toX *= scaleX;
    if (Number.isFinite(effect.toY)) effect.toY *= scaleY;
  }
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

function effect(state, kind, x, y, life = 0.65, details = {}) {
  state.effects.push({ kind, x, y, age: 0, life, seed: state.nextId++, ...details });
}
function tickEffects(state, dt) {
  state.effects.forEach(item => { item.age += dt; });
  state.effects = state.effects.filter(item => item.age < item.life);
}

export function createInvadersState(options = {}) {
  const world = dimensions(options);
  return {
    kind: 'invaders', world, score: 0, lives: 3, player: world.width / 2, playerY: arenaFor({ world }).playerY,
    bullets: [], missiles: [], enemies: [], pickups: [], hostileShots: [], effects: [], elapsed: 0, ticks: 0,
    spawnIn: 1.1, cooldown: 0, ended: false, bank: 0,
    wave: 1, waveSpawned: 0, waveQuota: 6, phase: 'wave', waveIn: 0,
    combo: 0, bestCombo: 0, kills: 0, shield: 0, shieldTime: 0,
    weaponLevel: 1, weaponUpgradeTime: 0,
    weaponFamily: 'spread', choiceMade: false, missilePairs: 0, missileCooldown: 0, supplyWave: 0, pickupSerial: 0, volleys: 0,
    supportFamily: 'wingmates', supportLevel: 0, supportCooldown: 0, relayCooldown: 0, supportVolleys: 0, supportUpgradeTime: 0,
    inboxCharge: 0, inboxTime: 0, inboxBursts: 0,
    pressure: 0, boss: null, bossesDefeated: 0, lastBoss: '', bossBonus: 0,
    damageCooldown: 0, lastHazard: '', lastHazardTime: 0, lastHazardBlocked: false, lastHazardReason: '', nextId: 1,
  };
}

function launchMissilePair(state) {
  if (!(state.missilePairs > 0) || state.missileCooldown > 0 || state.missiles.length > INVADER_MISSILES.maxActive - 2) return false;
  const arena = arenaFor(state), verticalScale = clamp(arena.height / 540, .65, 4.5);
  for (const side of [-1, 1]) {
    const x = clamp(state.player + side * 40, 8, arena.width - 8), y = arena.playerY - 17;
    state.missiles.push({ x, y, previousX: x, previousY: y, vx: side * 160, vy: -510 * verticalScale,
      age: 0, life: INVADER_MISSILES.life, damage: 2, kind: 'missile', trail: [], id: state.nextId++ });
  }
  state.missilePairs -= 1;
  state.missileCooldown = INVADER_MISSILES.cadence;
  effect(state, 'missile-launch', state.player, arena.playerY - 17, .28);
  return true;
}

export function fireInvaders(state) {
  if (state.ended || state.phase === 'choice') return false;
  const missilesFired = launchMissilePair(state);
  if (state.cooldown > 0) return missilesFired;
  const { playerY, width } = arenaFor(state);
  const weapon = invaderWeapon(state);
  for (const shot of weapon.pattern) {
    const x = clamp(state.player + shot.offset, 8, width - 8);
    if (state.bullets.length >= 64) break;
    state.bullets.push({ x, previousX: x, y: playerY - 35, previousY: playerY - 35, vx: shot.vx, damage: weapon.damage || 1,
      kind: state.weaponFamily === 'focused' ? 'lance' : 'plasma', weaponLevel: weapon.level, id: state.nextId++ });
  }
  // More coverage is the reward; cadence stays bounded at every weapon level.
  state.cooldown = weapon.cadence || 0.24;
  state.volleys += 1;
  return true;
}

function upgradeSupport(state, level) {
  if (state.supportLevel >= level) return;
  state.supportLevel = level;
  state.supportUpgradeTime = 2.4;
  effect(state, 'support-upgrade', state.player, state.playerY, .9, { level });
}

function stepSupport(state, input, arena) {
  if (!state.supportLevel || !input.action || !['wave', 'boss'].includes(state.phase)) return;
  const playerY = arenaFor(state).playerY;
  const visibleThreat = state.enemies.some(enemy => enemy.y >= 0 && enemy.y < arena.height && (enemy.health ?? 1) > 0) ||
    state.boss && state.boss.phase !== 'entering' && state.boss.health > 0;
  if (state.inboxCharge >= INVADER_SUPPORT.inboxCharge && state.inboxTime === 0 && visibleThreat) {
    state.inboxCharge = 0; state.inboxTime = INVADER_SUPPORT.inboxDuration; state.inboxBursts += 1;
    state.missilePairs = Math.min(INVADER_MISSILES.maxPairs, state.missilePairs + 2);
    effect(state, 'inbox-zero', state.player, playerY, .9);
  }
  if ((state.supportFamily !== 'wingmates' && !state.inboxTime) || state.supportCooldown > 0) return;
  if (state.bullets.length + 2 > INVADER_SUPPORT.supportCapacity ||
      state.bullets.filter(shot => shot.kind === 'wingmate').length + 2 > INVADER_SUPPORT.maxWingShots) return;
  for (const side of [-1, 1]) {
    const x = clamp(state.player + side * 70, 8, arena.width - 8), y = playerY - 6;
    state.bullets.push({ x, y, previousX: x, previousY: y, vx: side * 24, damage: state.supportLevel >= 2 ? 2 : 1,
      kind: 'wingmate', supportLevel: state.supportLevel, id: state.nextId++ });
  }
  state.supportCooldown = INVADER_SUPPORT.wingCadence;
  state.supportVolleys += 1;
}

function awardInvaderKill(state, enemy) {
  const index = state.enemies.indexOf(enemy);
  if (index === -1) return;
  state.enemies.splice(index, 1);
  state.combo += 1; state.bestCombo = Math.max(state.bestCombo, state.combo); state.kills += 1;
  const unlocked = state.kills >= 7 ? 3 : state.kills >= 3 ? 2 : 1;
  if (unlocked > state.weaponLevel) {
    if (state.weaponLevel < 2) state.missilePairs = Math.min(INVADER_MISSILES.maxPairs, state.missilePairs + INVADER_MISSILES.upgradePairs);
    state.weaponLevel = unlocked; state.weaponUpgradeTime = 2.4;
    effect(state, 'upgrade', state.player, state.playerY, .9);
  }
  if (state.supportLevel && !state.inboxTime) state.inboxCharge = Math.min(INVADER_SUPPORT.inboxCharge, state.inboxCharge + 1);
  state.score += 10 + Math.min(3, Math.floor(state.combo / 4)) * 5;
  effect(state, 'explosion', enemy.x, enemy.y);
  if (state.kills % 5 === 0) state.pickups.push({ x: enemy.x, y: enemy.y, kind: 'shield', id: state.nextId++ });
  if (state.wave >= 2 && (state.supplyWave !== state.wave || state.kills % 6 === 0) && state.pickups.filter(item => item.kind === 'missiles').length < 2) {
    state.supplyWave = state.wave;
    state.pickups.push({ x: clamp(enemy.x + (state.kills % 5 === 0 ? 65 : 0), 38, state.world.width - 38), y: enemy.y, kind: 'missiles', id: state.nextId++ });
  }
}

function damageInvader(state, enemy, damage) {
  enemy.health = (enemy.health ?? 1) - damage;
  if (enemy.health <= 0) awardInvaderKill(state, enemy);
  else effect(state, 'spark', enemy.x, enemy.y, .25);
}

function relayPulse(state, origin, projectile) {
  if (!state.supportLevel || (state.supportFamily !== 'relay' && !state.inboxTime) || state.relayCooldown > 0 ||
      ['wingmate', 'missile'].includes(projectile.kind)) return;
  const arena = arenaFor(state), verticalScale = clamp(arena.height / 540, .65, 4.5);
  const range = INVADER_SUPPORT.relayRange * arena.width / 960;
  const visited = new Set([origin]);
  let previous = origin, count = 0;
  for (let hop = 0; hop < Math.min(2, state.supportLevel); hop += 1) {
    const distance = enemy => Math.hypot(enemy.x - previous.x, (enemy.y - previous.y) / verticalScale);
    const target = state.enemies.filter(enemy => !visited.has(enemy) && (enemy.health ?? 1) > 0 &&
      enemy.x >= 0 && enemy.x <= arena.width && enemy.y >= 0 && enemy.y <= arena.height && distance(enemy) <= range)
      .sort((a, b) => distance(a) - distance(b))[0];
    if (!target) break;
    visited.add(target);
    effect(state, 'relay', previous.x, previous.y, .22, { toX: target.x, toY: target.y, level: state.supportLevel });
    damageInvader(state, target, 1);
    previous = target; count += 1;
  }
  if (count) state.relayCooldown = INVADER_SUPPORT.relayCadence;
}

function stepMissiles(state, arena, dt, verticalScale) {
  for (const missile of state.missiles) {
    missile.previousX = missile.x; missile.previousY = missile.y;
    missile.age = (Number.isFinite(missile.age) ? missile.age : 0) + dt;
    missile.vx = Number.isFinite(missile.vx) ? clamp(missile.vx, -INVADER_MISSILES.maxLateralSpeed, INVADER_MISSILES.maxLateralSpeed) : 0;
    missile.trail ||= [];
    missile.trail.unshift({ x: missile.x, y: missile.y });
    missile.trail.length = Math.min(missile.trail.length, 8);
    if (missile.age >= INVADER_MISSILES.homingDelay) {
      let target, nearest = Infinity;
      for (const candidate of [...state.enemies, ...(state.boss ? [state.boss] : [])]) {
        if (!Number.isFinite(candidate.x) || !Number.isFinite(candidate.y) || (candidate.health ?? 1) <= 0 ||
            candidate.x < 0 || candidate.x > arena.width || candidate.y < 0 || candidate.y >= missile.y - 12 || candidate.y > arena.height) continue;
        const distance = (candidate.x - missile.x) ** 2 + ((candidate.y - missile.y) / verticalScale) ** 2 * .35;
        if (distance < nearest) { nearest = distance; target = candidate; }
      }
      const desired = target ? clamp((target.x - missile.x) * 2.4, -INVADER_MISSILES.maxLateralSpeed, INVADER_MISSILES.maxLateralSpeed) : 0;
      missile.vx += (desired - missile.vx) * (1 - Math.exp(-4 * dt));
    }
    missile.vy = -510 * verticalScale;
    missile.x = clamp(missile.x + missile.vx * dt, 8, arena.width - 8);
    missile.y += missile.vy * dt;
    if (missile.x === 8 && missile.vx < 0 || missile.x === arena.width - 8 && missile.vx > 0) missile.vx = 0;
  }
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
  const weaver = !heavy && state.wave >= 3 && state.waveSpawned % 3 === 1;
  const health = heavy ? Math.min(4, 2 + Math.floor((state.wave - 3) / 4)) : (weaver && state.wave >= 4 || state.wave >= 7) ? 2 : 1;
  const hazard = heavy ? INVADER_HAZARDS[2] : weaver ? INVADER_HAZARDS[state.waveSpawned % 2 ? 3 : 5]
    : state.wave >= 3 && state.waveSpawned === 0 ? INVADER_HAZARDS[0]
    : state.wave >= 3 && state.waveSpawned === 2 ? INVADER_HAZARDS[1]
    : INVADER_HAZARDS[(state.waveSpawned + state.wave - 1) % INVADER_HAZARDS.length];
  state.enemies.push({
    id: state.nextId++, x, baseX: x, y: -58, scale: INVADER_THREAT_SCALE,
    type: heavy ? 'heavy' : weaver ? 'weaver' : state.waveSpawned % 3 === 0 ? 'interceptor' : 'drone',
    hazard, hazardId: hazard.id, label: hazard.label,
    health, maxHealth: health,
    phase: randomUnit(random) * Math.PI * 2,
    age: 0,
    ...(state.wave >= 3 && ['scope-creep', 'missed-deadlines'].includes(hazard.id) ? {
      behavior: hazard.id === 'scope-creep' ? 'client' : 'deadline', attackPhase: 'approach', attackIn: 0,
    } : {}),
  });
  state.waveSpawned += 1;
}

function finishInvaderWave(state, bossLabel = '') {
  state.phase = 'intermission'; state.waveIn = bossLabel ? 2.2 : 1.8;
  state.lastBoss = bossLabel; state.bossBonus = bossLabel ? 250 + state.wave * 25 : 0;
  state.score += state.bossBonus || 25 * state.wave;
  effect(state, 'wave', state.world.width / 2, state.world.height * 0.32, state.waveIn);
  state.hostileShots = state.hostileShots.filter(shot => shot.kind !== 'paper');
  if (state.wave === 2) {
    upgradeSupport(state, 1);
    if (!state.choiceMade) state.phase = 'choice';
  }
}
function beginInvaderWave(state) {
  const pace = invaderPace(state.wave);
  state.pressure = pace.pressure; state.waveSpawned = 0; state.waveQuota = pace.quota;
  state.phase = 'wave'; state.spawnIn = 0.75; state.lastBoss = ''; state.bossBonus = 0;
  if (state.wave >= 3) upgradeSupport(state, state.bossesDefeated ? 2 : 1);
  if (state.wave % 5 === 0) {
    const stage = state.wave / 5;
    const shape = bossGeometry(state);
    const health = Math.min(128, 80 + (stage - 1) * 16);
    state.phase = 'boss'; state.waveQuota = 0; state.hostileShots = []; state.bullets = [];
    state.boss = { label: stage % 2 ? 'Scope Creep' : 'Change Request', x: state.world.width / 2, y: -shape.halfHeight,
      health, maxHealth: health, phase: 'entering', attackIn: 1.4, aimX: state.player, aimY: state.playerY, age: 0,
      attackCount: 0, warningOffsets: [0], pendingShots: [] };
  }
}
function projectileHits(bullet, x, y, halfWidth, halfHeight) {
  const progress = clamp((bullet.previousY - y) / Math.max(0.001, bullet.previousY - bullet.y), 0, 1);
  const crossingX = bullet.previousX + (bullet.x - bullet.previousX) * progress;
  return Math.abs(x - crossingX) < halfWidth && bullet.y < y + halfHeight && bullet.previousY >= y - halfHeight;
}

function stepAgencyEnemy(state, enemy, arena, descent, verticalScale, dt) {
  enemy.previousX = enemy.x; enemy.previousY = enemy.y;
  enemy.age = (enemy.age || 0) + dt;
  if (enemy.attackPhase === 'warning') {
    enemy.attackIn = Math.max(0, enemy.attackIn - dt);
    if (enemy.attackIn > 0) return;
    if (enemy.behavior === 'deadline') enemy.attackPhase = 'dive';
    else {
      if (state.hostileShots.length < 18 && state.hostileShots.filter(shot => shot.kind === 'paper').length < 3) {
        const travel = 1.6;
        state.hostileShots.push({ x: enemy.x, y: enemy.y, previousX: enemy.x, previousY: enemy.y,
          vx: (enemy.aimX - enemy.x) / travel, vy: Math.max(30, (enemy.aimY - enemy.y) / travel),
          radius: 10, kind: 'paper', hostile: true, label: enemy.label || 'Scope creep', age: 0, life: 5, id: state.nextId++ });
      }
      enemy.attackPhase = 'recover';
    }
  }
  if (enemy.attackPhase === 'dive') {
    enemy.x = enemy.aimX;
    enemy.y += Math.min(320, 250 + state.wave * 8) * verticalScale * dt;
    return;
  }
  enemy.y += descent * (enemy.type === 'interceptor' ? state.wave >= 4 ? 1.18 : 1.04 : enemy.type === 'heavy' ? .88 : 1) * dt;
  if (Number.isFinite(enemy.baseX)) {
    const edge = enemy.type === 'heavy' ? 78 : 64, weaving = enemy.type === 'weaver';
    const amplitude = weaving ? Math.min(132, 72 + state.wave * 4) * arena.width / 960 : enemy.type === 'heavy' ? 12 : 22;
    enemy.x = clamp(enemy.baseX + Math.sin(enemy.age * (weaving ? 2.1 : 1.25) + enemy.phase) * amplitude, edge, arena.width - edge);
  }
  const warningY = Math.max(20, Math.min(arena.height * .16, arena.invadersBounds.top - 64));
  if (enemy.behavior && enemy.attackPhase === 'approach' && enemy.y >= warningY) {
    enemy.attackPhase = 'warning'; enemy.attackIn = enemy.behavior === 'client' ? 1 : .95;
    enemy.aimX = enemy.behavior === 'client' ? state.player : enemy.x;
    enemy.aimY = enemy.behavior === 'client' ? state.playerY : arena.height + 26;
  }
}

function stepBoss(state, arena, dt) {
  const boss = state.boss;
  if (!boss) return;
  const shape = bossGeometry(state);
  boss.age += dt; boss.attackIn -= dt;
  for (let index = boss.pendingShots.length - 1; index >= 0; index -= 1) {
    boss.pendingShots[index].delay -= dt;
    if (boss.pendingShots[index].delay > 0) continue;
    const queued = boss.pendingShots.splice(index, 1)[0];
    if (state.hostileShots.length >= 18) continue;
    const x = queued.x, y = queued.y;
    state.hostileShots.push({ x, y, previousX: x, previousY: y, vx: (queued.aimX - x) / 1.5,
      vy: Math.max(30, (queued.aimY - y) / 1.5), radius: 12, hostile: true, label: boss.label, age: 0, life: 5, id: state.nextId++ });
  }
  if (boss.phase === 'entering') {
    boss.y = -shape.halfHeight + (shape.targetY + shape.halfHeight) * clamp(boss.age / 1.4, 0, 1);
  } else {
    boss.y = shape.targetY;
    if (boss.phase !== 'windup') {
      const target = arena.width / 2 + Math.sin(boss.age * 0.65) * Math.min(240, arena.width * 0.28);
      boss.x = clamp(boss.x + clamp(target - boss.x, -100 * dt, 100 * dt), shape.left, shape.right);
    }
  }
  if (boss.attackIn <= 0) {
    if (boss.phase === 'windup') {
      const offsets = boss.warningOffsets;
      for (const offset of offsets) {
        if (state.hostileShots.length >= 18) break;
        const x = boss.x, y = boss.y + shape.halfHeight;
        const delay = boss.label === 'Change Request' && offsets.indexOf(offset) === 1 ? 0.25 : 0;
        if (delay) boss.pendingShots.push({ x, y, aimX: boss.aimX + offset, aimY: boss.aimY, delay });
        else state.hostileShots.push({ x, y, previousX: x, previousY: y, vx: (boss.aimX + offset - x) / 1.5,
          vy: Math.max(30, (boss.aimY - y) / 1.5), radius: 12, hostile: true, label: boss.label, age: 0, life: 5, id: state.nextId++ });
      }
      boss.phase = 'recover'; boss.attackIn = 1.7;
    } else {
      boss.phase = 'windup'; boss.attackIn = 1.1;
      boss.attackCount += 1;
      boss.warningOffsets = boss.label === 'Scope Creep' ? boss.health <= boss.maxHealth / 2 ? [-120, 0, 120] : [0]
        : boss.attackCount % 2 === 0 ? [-60, 60] : [0];
      // Aim locks before firing. Moving after this warning gives a clear escape.
      boss.aimX = state.player; boss.aimY = state.playerY;
    }
  }
  for (const projectiles of [state.bullets, state.missiles]) for (let index = projectiles.length - 1; index >= 0; index -= 1) {
    if (!state.boss || !projectileHits(projectiles[index], boss.x, boss.y, shape.halfWidth * 0.9, shape.halfHeight)) continue;
    const projectile = projectiles.splice(index, 1)[0];
    boss.health -= projectile.damage || 1;
    if (projectile.kind === 'missile') effect(state, 'missile-impact', projectile.x, boss.y, .4);
    relayPulse(state, boss, projectile);
    if (boss.health <= 0) {
      effect(state, 'explosion', boss.x, boss.y, 1);
      state.boss = null; state.hostileShots = []; state.bossesDefeated += 1;
      upgradeSupport(state, 2);
      if (!state.inboxTime) state.inboxCharge = Math.min(INVADER_SUPPORT.inboxCharge, state.inboxCharge + 5);
      state.shield = 1; state.shieldTime = 12;
      effect(state, 'shield', state.player, state.playerY, 1);
      finishInvaderWave(state, boss.label);
      break;
    }
  }
}
function stepHostileShots(state, arena, dt) {
  for (let index = state.hostileShots.length - 1; index >= 0; index -= 1) {
    const shot = state.hostileShots[index];
    shot.previousX = shot.x; shot.previousY = shot.y; shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.age += dt;
    const dx = shot.x - shot.previousX, dy = shot.y - shot.previousY;
    const progress = clamp(((state.player - shot.previousX) * dx + (state.playerY - shot.previousY) * dy) / Math.max(0.001, dx * dx + dy * dy), 0, 1);
    const hit = Math.hypot(state.player - shot.previousX - dx * progress, state.playerY - shot.previousY - dy * progress) < 22 + shot.radius;
    if (hit) damageInvaders(state, state.player, state.playerY, shot, 'projectile');
    if (hit || shot.age >= shot.life || shot.y > arena.height + 30 || shot.x < -30 || shot.x > arena.width + 30) state.hostileShots.splice(index, 1);
  }
}

export function stepInvaders(state, input = {}, seconds, random = Math.random) {
  let dt = timeStep(seconds);
  if (state.ended || !dt || state.phase === 'choice') return state;
  if (state.challenge) { dt = INVADER_TICK; random = () => seededRandom(state); }
  const arena = arenaFor(state);
  state.ticks += 1;
  state.elapsed = state.challenge ? state.ticks * INVADER_TICK : state.elapsed + dt;
  if (state.challenge && state.elapsed >= state.challenge.durationSeconds) { state.ended = true; state.endReason = 'time'; return state; }
  state.cooldown = Math.max(0, state.cooldown - dt);
  state.missileCooldown = Math.max(0, state.missileCooldown - dt);
  state.supportCooldown = Math.max(0, state.supportCooldown - dt);
  state.relayCooldown = Math.max(0, state.relayCooldown - dt);
  state.supportUpgradeTime = Math.max(0, state.supportUpgradeTime - dt);
  // Earned concerted fire is not spent during the between-wave breather or
  // while the next boss is still entering the arena.
  if (['wave', 'boss'].includes(state.phase) && state.boss?.phase !== 'entering') state.inboxTime = Math.max(0, state.inboxTime - dt);
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
      beginInvaderWave(state);
    }
  } else if (state.phase === 'wave' && state.waveSpawned < state.waveQuota) {
    state.spawnIn -= dt;
    if (state.spawnIn <= 0) {
      spawnInvader(state, random);
      state.spawnIn += invaderPace(state.wave).spawnInterval;
    }
  }
  // Keep crossing times comparable on a tall phone and a wide desktop arena.
  const verticalScale = clamp(arena.height / 540, 0.65, 4.5);
  state.pressure = invaderPace(state.wave).pressure;
  const descent = invaderPace(state.wave).descent * verticalScale;
  stepSupport(state, input, arena);
  state.bullets.forEach(bullet => {
    bullet.previousX = bullet.x; bullet.previousY = bullet.y;
    bullet.x += (bullet.vx || 0) * verticalScale * dt;
    bullet.y -= 620 * verticalScale * dt;
  });
  stepMissiles(state, arena, dt, verticalScale);
  state.enemies.forEach(enemy => stepAgencyEnemy(state, enemy, arena, descent, verticalScale, dt));
  // Relay can resolve another target during this pass; a stable snapshot avoids
  // skipping or processing an object twice after those removals.
  for (const enemy of [...state.enemies].reverse()) {
    if (!state.enemies.includes(enemy)) continue;
    const scale = enemy.scale || INVADER_THREAT_SCALE;
    const radius = (enemy.type === 'heavy' ? 39 : 32) * scale;
    const halfHeight = 25 * scale;
    const projectiles = state.bullets.some(bullet => projectileHits(bullet, enemy.x, enemy.y, radius, halfHeight)) ? state.bullets : state.missiles;
    const bulletIndex = projectiles.findIndex(bullet => projectileHits(bullet, enemy.x, enemy.y, radius, halfHeight));
    if (bulletIndex !== -1) {
      const projectile = projectiles.splice(bulletIndex, 1)[0];
      const damage = projectile.damage || 1;
      if (projectile.kind === 'missile') effect(state, 'missile-impact', enemy.x, enemy.y, .4);
      damageInvader(state, enemy, damage);
      relayPulse(state, enemy, projectile);
      if (!state.enemies.includes(enemy)) continue;
    }
    const inLane = Math.abs(enemy.x - state.player) < radius + 21;
    const hitsPlayer = inLane && (Math.abs(enemy.y - state.playerY) < halfHeight + 17 ||
      enemy.attackPhase === 'dive' && enemy.previousY <= state.playerY && enemy.y >= state.playerY);
    if (enemy.y > arena.height + 26 || hitsPlayer) {
      state.enemies.splice(state.enemies.indexOf(enemy), 1);
      if (hitsPlayer || enemy.attackPhase !== 'dive') damageInvaders(state, state.player, state.playerY, enemy, hitsPlayer ? 'collision' : 'miss');
    }
  }
  stepBoss(state, arena, dt);
  stepHostileShots(state, arena, dt);
  state.bullets = state.bullets.filter(bullet => bullet.y > -40 && bullet.x > -20 && bullet.x < arena.width + 20);
  state.missiles = state.missiles.filter(missile => missile.age < missile.life && missile.y > -40 && missile.x > -20 && missile.x < arena.width + 20);
  for (let index = state.pickups.length - 1; index >= 0; index -= 1) {
    const pickup = state.pickups[index];
    pickup.y += Math.max(110, descent * 0.75) * dt;
    if (Math.abs(pickup.x - state.player) < 55 && Math.abs(pickup.y - state.playerY) < 48) {
      state.pickups.splice(index, 1);
      if (pickup.kind === 'missiles') state.missilePairs = Math.min(INVADER_MISSILES.maxPairs, state.missilePairs + INVADER_MISSILES.pickupPairs);
      else { state.shield = 1; state.shieldTime = 12; }
      state.pickupSerial += 1; state.lastPickup = pickup.kind;
      state.score += 20;
      effect(state, pickup.kind === 'missiles' ? 'missile-load' : 'shield', state.player, state.playerY, 0.9);
    } else if (pickup.y > arena.height + 40) state.pickups.splice(index, 1);
  }
  if (state.phase === 'wave' && state.waveSpawned >= state.waveQuota && state.enemies.length === 0 && !state.ended) {
    finishInvaderWave(state);
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
