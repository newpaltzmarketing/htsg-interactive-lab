import { arenaFor, bossGeometry, createInvadersState, createRunnerState, INVADER_HAZARDS, INVADER_THREAT_SCALE, invaderWeapon } from './game-engine.js';
import { brand } from './brand.js';
import { SHIP_PALETTES, normalizeShipAppearance } from './ship-customization.js';

const TAU = Math.PI * 2;
const paint = brand.canvas?.player || '#f78c1a';
const droneAccent = brand.canvas?.obstacle || '#f43618';
const beamCore = brand.canvas?.projectile || '#ffffff';
export const INVADER_WORLD_ASSET = 'invaders-orbital-agency-20261018.webp';
const hazardDescriptions = { 'scope-creep': 'Finger-wagging client', 'missed-deadlines': 'Ticking clock', 'budget-overruns': 'Cash overflow', 'tech-debt': 'Tangled circuits', bottlenecks: 'Clogged flow', 'broken-handoffs': 'Broken connection' };
export const HAZARD_VISUALS = Object.freeze(Object.fromEntries(INVADER_HAZARDS.map(({ id, label }) => [id, Object.freeze({ label, description: hazardDescriptions[id] })])));
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
const noise = value => { const n = Math.sin(value * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
const circle = (ctx, x, y, radius) => { ctx.beginPath(); ctx.arc(x, y, Math.max(0.01, radius), 0, TAU); };
function ellipse(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), 0, 0, TAU); }
function rounded(ctx, x, y, width, height, radius = 8) { ctx.beginPath(); ctx.roundRect(x, y, width, height, radius); }
function gradient(ctx, x0, y0, x1, y1, stops) {
  const result = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([point, color]) => result.addColorStop(point, color));
  return result;
}
function glow(ctx, x, y, radius, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha *= alpha;
  const light = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, radius));
  light.addColorStop(0, color); light.addColorStop(1, 'transparent');
  ctx.fillStyle = light; circle(ctx, x, y, radius); ctx.fill();
  ctx.restore();
}

function cover(ctx, image, width, height) {
  const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  ctx.drawImage(image, (width - drawWidth) / 2, (height - drawHeight) * 0.42, drawWidth, drawHeight);
}

function fallbackSpace(ctx, width, height) {
  ctx.fillStyle = gradient(ctx, 0, 0, width, height, [[0, '#07121e'], [0.42, '#12293a'], [1, '#020811']]);
  ctx.fillRect(0, 0, width, height);
  const x = width * 0.67, y = height * 0.2, r = Math.min(width * 0.35, height * 0.35);
  glow(ctx, x - r * 0.5, y, r * 1.8, '#8d583850', 0.75);
  const planet = ctx.createRadialGradient(x - r * 0.5, y - r * 0.6, r * 0.05, x, y, r);
  planet.addColorStop(0, '#a68160'); planet.addColorStop(0.55, '#5e5550'); planet.addColorStop(0.9, '#243546'); planet.addColorStop(1, '#0a1420');
  ctx.fillStyle = planet; circle(ctx, x, y, r); ctx.fill();
  ctx.strokeStyle = '#b7c7ca40'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(x, y + r * 0.08, r * 1.5, r * 0.24, -0.23, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#050c17d9';
  ctx.beginPath(); ctx.moveTo(0, height * 0.65); ctx.lineTo(width * 0.19, height * 0.41); ctx.lineTo(width * 0.24, height * 0.43); ctx.lineTo(width * 0.09, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
}

function fallbackAgencyOffice(ctx, width, height) {
  fallbackSpace(ctx, width, height);
  // An orbital studio frames the open flight lane. Props are anchored to the
  // actual screen edges, so the office still reads without a loaded bitmap.
  ctx.save();
  ctx.fillStyle = gradient(ctx, 0, 0, 0, height * .24, [[0, '#334654'], [1, '#101e2b']]);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(width, 0); ctx.lineTo(width, height * .16);
  ctx.lineTo(width * .83, height * .11); ctx.lineTo(width * .17, height * .11); ctx.lineTo(0, height * .16); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#b1c8c84d'; ctx.lineWidth = width * .003;
  ctx.beginPath(); ctx.moveTo(0, height * .16); ctx.lineTo(width * .17, height * .11); ctx.lineTo(width * .83, height * .11); ctx.lineTo(width, height * .16); ctx.stroke();
  const deskY = Math.min(height * .37, height * .15 + width * .17);
  for (const side of [-1, 1]) {
    ctx.save();
    if (side === 1) { ctx.translate(width, 0); ctx.scale(-1, 1); }
    ctx.fillStyle = gradient(ctx, 0, 0, width * .12, 0, [[0, '#455760'], [.55, '#20333f'], [1, '#0a172400']]);
    ctx.beginPath(); ctx.moveTo(0, height * .14); ctx.lineTo(width * .09, height * .12); ctx.lineTo(width * .13, deskY + width * .12); ctx.lineTo(0, deskY + width * .17); ctx.closePath(); ctx.fill();
    // A lit desktop monitor, paper tray and chair distinguish the agency
    // workspace from a spaceship cockpit without adding readable UI chrome.
    ctx.save(); ctx.translate(width * .085, deskY - width * .055); ctx.rotate(-.08);
    ctx.fillStyle = '#13232d'; ctx.strokeStyle = '#78939d'; ctx.lineWidth = width * .002;
    rounded(ctx, -width * .065, -width * .065, width * .13, width * .085, width * .007); ctx.fill(); ctx.stroke();
    ctx.fillStyle = gradient(ctx, 0, -width * .06, 0, width * .01, [[0, '#7097a1'], [.45, '#3e6573'], [1, '#173947']]);
    rounded(ctx, -width * .057, -width * .057, width * .114, width * .064, width * .003); ctx.fill();
    ctx.fillStyle = '#ffb25b8c'; ctx.fillRect(-width * .048, -width * .045, width * .025, width * .041);
    ctx.fillStyle = '#d7e3d787';
    for (let row = 0; row < 3; row += 1) ctx.fillRect(-width * .014, -width * .043 + row * width * .012, width * (.045 - row * .006), width * .004);
    ctx.fillStyle = '#536a74'; ctx.fillRect(-width * .009, width * .02, width * .018, width * .024);
    rounded(ctx, -width * .035, width * .041, width * .07, width * .008, width * .003); ctx.fill(); ctx.restore();
    ctx.fillStyle = gradient(ctx, 0, deskY, 0, deskY + width * .026, [[0, '#a79d83'], [.22, '#6a6f68'], [1, '#182b37']]);
    ctx.beginPath(); ctx.moveTo(0, deskY); ctx.lineTo(width * .21, deskY - width * .008); ctx.lineTo(width * .24, deskY + width * .028); ctx.lineTo(0, deskY + width * .048); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#e2ba7c69'; ctx.lineWidth = width * .002;
    ctx.beginPath(); ctx.moveTo(0, deskY); ctx.lineTo(width * .21, deskY - width * .008); ctx.lineTo(width * .24, deskY + width * .028); ctx.stroke();
    for (let sheet = 0; sheet < 3; sheet += 1) {
      ctx.fillStyle = sheet === 2 ? '#e3d3ac' : '#9d9c8e';
      ctx.beginPath(); ctx.moveTo(width * .15 + sheet * width * .003, deskY - width * (.011 + sheet * .004)); ctx.lineTo(width * .19, deskY - width * (.014 + sheet * .004)); ctx.lineTo(width * .205, deskY - sheet * width * .004); ctx.lineTo(width * .16, deskY + width * .003 - sheet * width * .004); ctx.closePath(); ctx.fill();
    }
    ctx.fillStyle = '#192d3a'; ctx.strokeStyle = '#6e81855c'; ctx.lineWidth = width * .002;
    rounded(ctx, width * .025, deskY + width * .045, width * .09, width * .1, width * .025); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

function background(ctx, image, arena, time, reducedMotion, mode) {
  const { width, height, floor } = arena;
  if (image?.complete && image.naturalWidth) {
    ctx.fillStyle = '#030a14'; ctx.fillRect(0, 0, width, height);
    cover(ctx, image, width, height);
  } else if (mode === 'invaders') fallbackAgencyOffice(ctx, width, height);
  else fallbackSpace(ctx, width, height);
  const wash = gradient(ctx, 0, 0, 0, height, [[0, '#03101c22'], [0.5, '#02091300'], [1, '#020711bc']]);
  ctx.fillStyle = wash; ctx.fillRect(0, 0, width, height);
  if (mode === 'invaders') {
    for (let index = 0; index < 30; index += 1) {
      const depth = 0.25 + noise(index + 3) * 0.75;
      const x = noise(index + 73) * width;
      const travel = reducedMotion ? 0 : time * 9 * depth;
      const y = (noise(index + 147) * height + travel) % height;
      ctx.fillStyle = `rgba(207,228,242,${0.16 + depth * 0.3})`;
      ellipse(ctx, x, y, 0.8 + depth, reducedMotion ? 0.8 + depth : 1.4 + depth * 2); ctx.fill();
    }
    glow(ctx, width * 0.5, height * 0.97, width * 0.4, '#ec752119', 0.8);
  } else if (mode === 'runner' && !image?.naturalWidth) {
    for (let index = 0; index < 14; index += 1) {
      const x = index * width / 11;
      const towerHeight = 35 + noise(index + 9) * 110;
      ctx.fillStyle = gradient(ctx, x, floor - towerHeight, x + 40, floor, [[0, '#20384c'], [1, '#09131f']]);
      ctx.beginPath(); ctx.moveTo(x, floor); ctx.lineTo(x + 8, floor - towerHeight); ctx.lineTo(x + 30, floor - towerHeight - 9); ctx.lineTo(x + 42, floor); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#f6aa4c70'; ctx.fillRect(x + 19, floor - towerHeight + 15, 3, 13);
    }
  }
}

function vignette(ctx, width, height) {
  const shade = ctx.createRadialGradient(width * 0.5, height * 0.48, Math.min(width, height) * 0.18, width * 0.5, height * 0.5, Math.max(width, height) * 0.7);
  shade.addColorStop(0, 'transparent'); shade.addColorStop(0.72, '#01061118'); shade.addColorStop(1, '#01050ab8');
  ctx.fillStyle = shade; ctx.fillRect(0, 0, width, height);
}

function thruster(ctx, x, y, length, time, reducedMotion, width = 9) {
  const flicker = reducedMotion ? 1 : 0.9 + Math.sin(time * 31) * 0.1;
  glow(ctx, x, y + length * 0.2, length * 1.3, paint, 0.28);
  ctx.fillStyle = gradient(ctx, 0, y, 0, y + length, [[0, '#fff6d7'], [0.18, '#ffe09a'], [0.5, paint], [1, 'transparent']]);
  ctx.beginPath(); ctx.moveTo(x - width, y); ctx.bezierCurveTo(x - width * 0.8, y + length * 0.5, x - 2, y + length * flicker, x, y + length); ctx.bezierCurveTo(x + 3, y + length * 0.8, x + width, y + length * 0.4, x + width, y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#fff8dc'; ellipse(ctx, x, y + 2, width * 0.7, 3); ctx.fill();
}

function shipMaterials(appearance) {
  const normalized = normalizeShipAppearance(appearance);
  return { ...normalized, palette: SHIP_PALETTES.find(item => item.id === normalized.color) || SHIP_PALETTES[0] };
}

// All hulls are decorative around the same gameplay center. Cannons, missile
// mounts, collision rules and steering never depend on the selected appearance.
function shipHull(ctx, appearance) {
  const { style, palette } = shipMaterials(appearance);
  const hullPaint = () => gradient(ctx, -42, -30, 43, 32, [[0, palette.dark], [.24, palette.body], [.48, palette.light], [.68, palette.body], [1, palette.dark]]);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = '#0b2232'; ctx.lineWidth = 2;
  ctx.fillStyle = hullPaint();
  if (style === 'relay') {
    // Twin booms and visible negative space make Relay recognizable in silhouette.
    rounded(ctx, -44, -1, 88, 23, 10); ctx.fill(); ctx.stroke();
    for (const side of [-1, 1]) {
      ctx.fillStyle = hullPaint(); rounded(ctx, side < 0 ? -47 : 22, -48, 25, 86, 12); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = palette.light; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(side * 34, -39); ctx.lineTo(side * 34, -18); ctx.stroke();
      ctx.fillStyle = '#112c40'; rounded(ctx, side < 0 ? -41 : 28, -29, 13, 16, 5); ctx.fill();
      ctx.fillStyle = '#c8eff5'; rounded(ctx, side < 0 ? -39 : 30, -27, 9, 5, 2); ctx.fill();
      ctx.strokeStyle = '#0b2232'; ctx.lineWidth = 2;
    }
    ctx.fillStyle = hullPaint(); rounded(ctx, -16, -33, 32, 67, 15); ctx.fill(); ctx.stroke();
  } else if (style === 'fixer') {
    // A soft utility tug: broad rounded cabin, service pods and a sturdy bumper.
    for (const side of [-1, 1]) { rounded(ctx, side < 0 ? -49 : 33, -3, 16, 32, 7); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = hullPaint(); rounded(ctx, -38, -45, 76, 84, 25); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.dark; rounded(ctx, -31, 24, 62, 12, 5); ctx.fill();
    ctx.strokeStyle = palette.light; ctx.lineWidth = 2; rounded(ctx, -27, 4, 54, 13, 4); ctx.stroke();
    for (const side of [-1, 1]) { ctx.fillStyle = '#deece7'; circle(ctx, side * 27, -4, 3); ctx.fill(); ctx.fillStyle = '#274458'; ctx.fillRect(side * 27 - 1, -6, 2, 4); }
  } else {
    // Studio is a welcoming broad-wing glider with a compact central canopy.
    ctx.beginPath(); ctx.moveTo(0, -47); ctx.bezierCurveTo(-14, -34, -24, -2, -47, 16);
    ctx.quadraticCurveTo(-52, 22, -45, 32); ctx.quadraticCurveTo(-32, 34, -14, 22);
    ctx.lineTo(-9, 37); ctx.lineTo(9, 37); ctx.lineTo(14, 22);
    ctx.quadraticCurveTo(32, 34, 45, 32); ctx.quadraticCurveTo(52, 22, 47, 16);
    ctx.bezierCurveTo(24, -2, 14, -34, 0, -47); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = palette.light; ctx.lineWidth = 2.2;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 39, 23); ctx.quadraticCurveTo(side * 23, 10, side * 13, -12); ctx.stroke(); }
    ctx.fillStyle = hullPaint(); rounded(ctx, -17, -39, 34, 73, 16); ctx.fill(); ctx.strokeStyle = '#0b2232'; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // Consistent bright cabin glass and trim keep every reviewed paint readable.
  const window = style === 'fixer' ? { x: -20, y: -29, w: 40, h: 27 } : { x: -10, y: -28, w: 20, h: 31 };
  ctx.fillStyle = gradient(ctx, 0, window.y, 0, window.y + window.h, [[0, '#dcf9fa'], [.3, '#72b9cd'], [1, '#173d58']]);
  ctx.strokeStyle = '#123145'; ctx.lineWidth = 2; rounded(ctx, window.x, window.y, window.w, window.h, 9); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#f0ffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(window.x + 5, window.y + 7); ctx.lineTo(window.x + 5, window.y + window.h * .5); ctx.stroke();
  ctx.fillStyle = '#fff5dc'; ctx.fillRect(-5, 15, 2.5, 9); ctx.fillRect(2.5, 15, 2.5, 9); ctx.fillRect(-3, 18, 6, 2.5);
}

function spacecraft(ctx, x, y, bank, time, reducedMotion, shield, damageCooldown = 0, weaponLevel = 1, weaponFamily = 'spread', recoil = 0, appearance) {
  ctx.save(); ctx.translate(x, y + recoil); ctx.rotate(bank * .16);
  glow(ctx, 0, 17, 74, shipMaterials(appearance).palette.body, .12);
  const pulse = reducedMotion ? 0 : Math.sin(time * 4) * 4;
  if (shield > 0) {
    glow(ctx, 0, -3, 80, '#6bd8ed20');
    ctx.strokeStyle = '#92eaff98'; ctx.lineWidth = 2.5; ellipse(ctx, 0, -5, 54 + pulse, 68 + pulse); ctx.stroke();
    ctx.strokeStyle = '#d8faff35'; ctx.lineWidth = 1; ellipse(ctx, 0, -5, 61 + pulse, 75 + pulse); ctx.stroke();
  }
  thruster(ctx, -24, 31, 45, time, reducedMotion, 6);
  thruster(ctx, 24, 31, 45, time + .7, reducedMotion, 6);
  shipHull(ctx, appearance);
  for (const shot of invaderWeapon({ weaponLevel, weaponFamily }).pattern) {
    ctx.fillStyle = '#b6cbd0'; rounded(ctx, shot.offset - 3.5, -36, 7, 15, 2); ctx.fill();
    ctx.fillStyle = beamCore; rounded(ctx, shot.offset - 2.5, -39, 5, 5, 2); ctx.fill();
  }
  if (damageCooldown > 0) { ctx.strokeStyle = '#ffc58e99'; ctx.lineWidth = 2; ellipse(ctx, 0, -3, 58, 65); ctx.stroke(); }
  ctx.restore();
}

export function drawShipPreview(ctx, appearance) {
  const { width, height } = ctx.canvas;
  const scale = Math.min(width / 130, height / 160);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, width, height);
  ctx.translate(width / 2, height / 2 - 10 * scale); ctx.scale(scale, scale);
  spacecraft(ctx, 0, 0, 0, 0, true, 0, 0, 1, 'spread', 0, appearance);
  ctx.restore();
}

export function wingmateVisualGeometry(scene) {
  const arena = arenaFor(scene);
  if (!(scene.supportLevel > 0) || scene.supportFamily !== 'wingmates' && !(scene.inboxTime > 0)) return [];
  return [-1, 1].map(side => ({ side, x: clamp(scene.player + side * 70, 8, arena.width - 8), y: arena.playerY - 6 }));
}

function supportCraft(ctx, scene, arena, time, reducedMotion, appearance) {
  const { palette } = shipMaterials(appearance);
  for (const mount of wingmateVisualGeometry(scene)) {
    const bob = reducedMotion ? 0 : Math.sin(time * 3 + mount.side) * 1.3;
    ctx.save(); ctx.translate(mount.x, mount.y + 14 + bob);
    glow(ctx, 0, 7, 29, '#7be4cf', .12);
    ctx.fillStyle = palette.dark; ctx.strokeStyle = '#102d3a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(-9, -13, -14, 7); ctx.quadraticCurveTo(-12, 17, 0, 18); ctx.quadraticCurveTo(12, 17, 14, 7); ctx.quadraticCurveTo(9, -13, 0, -16); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = palette.body; rounded(ctx, -9, -9, 18, 22, 8); ctx.fill();
    ctx.fillStyle = '#d1fff4'; rounded(ctx, -6, -7, 12, 8, 4); ctx.fill();
    ctx.fillStyle = '#254e60'; for (const x of [-2.5, 2.5]) { circle(ctx, x, -3, 1); ctx.fill(); }
    ctx.fillStyle = '#9ce8cf'; rounded(ctx, -2, -19, 4, 8, 2); ctx.fill();
    if (scene.supportLevel > 1) { ctx.strokeStyle = '#e4fff2'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-6, 7); ctx.lineTo(-1, 11); ctx.lineTo(6, 4); ctx.stroke(); }
    ctx.fillStyle = '#ffe1a1'; ellipse(ctx, 0, 19, 3, reducedMotion ? 5 : 6 + Math.sin(time * 14) * 1.2); ctx.fill();
    ctx.restore();
  }
  if (scene.inboxTime > 0) {
    ctx.save(); ctx.strokeStyle = '#aaf2d4aa'; ctx.lineWidth = 2;
    const radius = reducedMotion ? 66 : 66 + Math.sin(time * 4) * 1.5;
    ctx.beginPath(); ctx.arc(scene.player, arena.playerY, radius, .18, Math.PI - .18); ctx.stroke();
    checkmark(ctx, scene.player - 55, arena.playerY + 30, 9, '#d3fff0');
    checkmark(ctx, scene.player + 55, arena.playerY + 30, 9, '#d3fff0');
    ctx.restore();
  }
}

export function enemyTelegraphGeometry(enemy, arena) {
  if (enemy.attackPhase !== 'warning' || !Number.isFinite(enemy.aimX)) return null;
  if (enemy.behavior === 'deadline') {
    const halfWidth = hazardVisualGeometry(enemy).collision.halfWidth + 21;
    return { kind: 'lane', x: enemy.aimX, top: clamp(enemy.y + 25 * (enemy.scale || INVADER_THREAT_SCALE), 0, arena.height), bottom: arena.height,
      left: Math.max(0, enemy.aimX - halfWidth), right: Math.min(arena.width, enemy.aimX + halfWidth) };
  }
  if (enemy.behavior === 'client' && Number.isFinite(enemy.aimY)) return { kind: 'target', x: enemy.aimX, y: enemy.aimY, fromX: enemy.x, fromY: enemy.y };
  return null;
}

function enemyTelegraphs(ctx, scene, arena, options) {
  const unit = arena.height / Math.max(1, options.cssHeight || arena.height);
  for (const enemy of scene.enemies || []) {
    const mark = enemyTelegraphGeometry(enemy, arena);
    if (!mark) continue;
    ctx.save(); ctx.strokeStyle = '#ffcf83'; ctx.fillStyle = '#f9b85712'; ctx.lineWidth = 1.5 * unit;
    ctx.setLineDash([5 * unit, 5 * unit]);
    if (mark.kind === 'lane') {
      ctx.fillRect(mark.left, mark.top, mark.right - mark.left, mark.bottom - mark.top);
      for (const x of [mark.left, mark.right]) { ctx.beginPath(); ctx.moveTo(x, mark.top); ctx.lineTo(x, mark.bottom); ctx.stroke(); }
      ctx.setLineDash([]); ctx.lineWidth = 2 * unit;
      const y = Math.min(mark.bottom - 16 * unit, mark.top + 25 * unit);
      ctx.beginPath(); ctx.moveTo(mark.x - 7 * unit, y - 4 * unit); ctx.lineTo(mark.x, y + 3 * unit); ctx.lineTo(mark.x + 7 * unit, y - 4 * unit); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(mark.fromX, mark.fromY); ctx.lineTo(mark.x, mark.y); ctx.stroke();
      ctx.setLineDash([]); circle(ctx, mark.x, mark.y, 20 * unit); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fff0c8'; ctx.lineWidth = 2 * unit;
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(mark.x + side * 15 * unit, mark.y); ctx.lineTo(mark.x + side * 24 * unit, mark.y); ctx.stroke(); }
      paper(ctx, mark.fromX - 15 * unit, mark.fromY + 18 * unit, 10 * unit, 13 * unit, -.1);
    }
    ctx.restore();
  }
}

function hazardId(enemy) {
  const id = enemy.hazardId || enemy.hazard?.id;
  return HAZARD_VISUALS[id] ? id : INVADER_HAZARDS.find(item => item.label === enemy.label)?.id || 'scope-creep';
}

export function hazardVisualGeometry(enemy, { reducedMotion = false } = {}) {
  const scale = enemy.scale || INVADER_THREAT_SCALE;
  const halfWidth = (enemy.type === 'heavy' ? 39 : 32) * scale, halfHeight = 25 * scale;
  return { id: hazardId(enemy), x: enemy.x, y: enemy.y, scaleX: halfWidth / 32, scaleY: scale, rotation: 0,
    time: reducedMotion ? 0 : enemy.age || 0, collision: { halfWidth, halfHeight },
    bounds: { left: enemy.x - halfWidth, right: enemy.x + halfWidth, top: enemy.y - halfHeight, bottom: enemy.y + halfHeight } };
}

function eyes(ctx, x, y, spacing = 7, expression = 0) {
  ctx.fillStyle = '#fff9e4';
  for (const side of [-1, 1]) { ellipse(ctx, x + side * spacing, y, 4.5, 5); ctx.fill(); }
  ctx.fillStyle = '#132535';
  for (const side of [-1, 1]) { ellipse(ctx, x + side * spacing + 0.6, y + 1, 2.2, 3); ctx.fill(); }
  if (expression) {
    ctx.strokeStyle = '#283343'; ctx.lineWidth = 2.3; ctx.lineCap = 'round';
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(x + side * spacing - 4, y - 7); ctx.quadraticCurveTo(x + side * spacing, y - 10 - expression, x + side * spacing + 4, y - 7); ctx.stroke(); }
  }
}

function paper(ctx, x, y, width, height, tilt = 0, tint = '#fff4d5') {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  ctx.fillStyle = gradient(ctx, -width / 2, -height / 2, width / 2, height / 2, [[0, '#ffffff'], [0.45, tint], [1, '#b8a585']]);
  ctx.strokeStyle = '#443e35'; ctx.lineWidth = 1.4;
  rounded(ctx, -width / 2, -height / 2, width, height, 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d7c69f'; ctx.beginPath(); ctx.moveTo(width / 2 - 8, -height / 2); ctx.lineTo(width / 2 - 8, -height / 2 + 8); ctx.lineTo(width / 2, -height / 2 + 8); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#9c8f78'; ctx.lineWidth = 1.4;
  for (let line = 0; line < 3; line += 1) { ctx.beginPath(); ctx.moveTo(-width * .31, height * .12 + line * 4); ctx.lineTo(width * .28, height * .12 + line * 4); ctx.stroke(); }
  ctx.restore();
}

function hazardModel(ctx, id, time = 0, damaged = false) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (id === 'scope-creep') {
    // A generic comic client: the raised hand and face stay inside the same
    // 64 by 50 envelope at every wag angle, including the static Help pose.
    ctx.fillStyle = gradient(ctx, -25, 3, 12, 24, [[0, '#7596b3'], [.4, '#355671'], [1, '#172f48']]);
    ctx.strokeStyle = '#0b2035'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-17, 3); ctx.lineTo(1, 3); ctx.quadraticCurveTo(10, 5, 14, 14); ctx.lineTo(11, 23); ctx.lineTo(-27, 23); ctx.lineTo(-28, 15); ctx.quadraticCurveTo(-25, 6, -17, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff6dc'; ctx.beginPath(); ctx.moveTo(-15, 4); ctx.lineTo(-6, 16); ctx.lineTo(2, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = paint; ctx.beginPath(); ctx.moveTo(-9, 7); ctx.lineTo(-5, 7); ctx.lineTo(-3, 21); ctx.lineTo(-7, 24); ctx.lineTo(-11, 21); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#9db9cc'; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(-18, 6); ctx.lineTo(-13, 15); ctx.lineTo(-18, 17); ctx.lineTo(-12, 23); ctx.moveTo(3, 6); ctx.lineTo(0, 15); ctx.lineTo(4, 17); ctx.lineTo(0, 23); ctx.stroke();
    // Bent suit sleeve and bright cuff frame the separately articulated hand.
    ctx.strokeStyle = '#142e47'; ctx.lineWidth = 10;
    ctx.beginPath(); ctx.moveTo(7, 9); ctx.lineTo(15, 16); ctx.lineTo(22, 7); ctx.stroke();
    ctx.strokeStyle = '#7598b6'; ctx.lineWidth = 6; ctx.stroke();
    ctx.strokeStyle = '#fff5dd'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(20, 8); ctx.lineTo(23, 5); ctx.stroke();
    ctx.save(); ctx.translate(23, 7); ctx.rotate(Math.sin(time * 3.4) * .18);
    ctx.fillStyle = gradient(ctx, -7, -25, 6, 3, [[0, '#ffe1b6'], [.55, '#edb47d'], [1, '#c78558']]);
    ctx.strokeStyle = '#633d2e'; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(-6, 2); ctx.lineTo(4, 2); ctx.quadraticCurveTo(8, -3, 4, -10); ctx.quadraticCurveTo(2, -12, 1, -8); ctx.lineTo(1, -26); ctx.quadraticCurveTo(-2, -29, -4, -26); ctx.lineTo(-4, -10); ctx.lineTo(-6, -12); ctx.quadraticCurveTo(-10, -13, -9, -9); ctx.lineTo(-6, -3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#a86a47'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-3, -4); ctx.lineTo(2, -4); ctx.moveTo(-2, -8); ctx.lineTo(2, -7); ctx.stroke(); ctx.restore();
    const skin = gradient(ctx, -18, -19, 5, 4, [[0, '#ffe8c3'], [.5, '#efbd87'], [1, '#c98355']]);
    ctx.fillStyle = skin; ctx.strokeStyle = '#633d2e'; ctx.lineWidth = 1.5;
    for (const x of [-19, 5]) { ellipse(ctx, x, -7, 3, 4); ctx.fill(); ctx.stroke(); }
    rounded(ctx, -12, 0, 10, 8, 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-18, -15); ctx.quadraticCurveTo(-18, -23, -7, -23); ctx.quadraticCurveTo(5, -23, 5, -13); ctx.lineTo(3, -2); ctx.quadraticCurveTo(-7, 8, -17, -2); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#34343b';
    ctx.beginPath(); ctx.moveTo(-19, -9); ctx.lineTo(-20, -16); ctx.quadraticCurveTo(-18, -25, -8, -24); ctx.quadraticCurveTo(1, -26, 6, -17); ctx.lineTo(5, -10); ctx.lineTo(1, -15); ctx.quadraticCurveTo(-5, -13, -11, -17); ctx.lineTo(-16, -14); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#a4a6a7'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-17, -17); ctx.quadraticCurveTo(-15, -21, -10, -21); ctx.stroke();
    ctx.fillStyle = '#fff9e8';
    for (const x of [-12, -2]) { ellipse(ctx, x, -7, 3.7, 3.2); ctx.fill(); }
    ctx.fillStyle = '#203040'; for (const x of [-11.5, -1.5]) { ellipse(ctx, x, -6.5, 1.8, 2.5); ctx.fill(); }
    ctx.strokeStyle = '#3c3030'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(-16, -12); ctx.quadraticCurveTo(-12, -16, -8, -12); ctx.moveTo(-5, -12); ctx.quadraticCurveTo(-1, -16, 3, -12); ctx.stroke();
    ctx.strokeStyle = '#a86a47'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-7, -6); ctx.lineTo(-9, -1); ctx.lineTo(-5, -1); ctx.stroke();
    ctx.strokeStyle = '#6e332a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-12, 2); ctx.quadraticCurveTo(-7, 6, -2, 2); ctx.stroke();
    ctx.save(); ctx.translate(-23, 14); ctx.rotate(-.12);
    ctx.fillStyle = '#996233'; ctx.strokeStyle = '#342e28'; ctx.lineWidth = 1.5; rounded(ctx, -6, -8, 13, 17, 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff0ca'; rounded(ctx, -4, -6, 9, 13, 1); ctx.fill(); ctx.fillStyle = paint; rounded(ctx, -2, -9, 5, 4, 1); ctx.fill();
    ctx.strokeStyle = '#a28a63'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-2, 0); ctx.lineTo(3, 0); ctx.moveTo(-2, 3); ctx.lineTo(2, 3); ctx.stroke(); ctx.restore();
  } else if (id === 'missed-deadlines') {
    ctx.strokeStyle = '#a8ceda'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(-12, 16); ctx.lineTo(-18, 24); ctx.moveTo(12, 16); ctx.lineTo(18, 24); ctx.stroke();
    ctx.fillStyle = gradient(ctx, -25, -23, 22, -8, [[0, '#ffe8af'], [0.4, paint], [1, '#a45224']]);
    for (const side of [-1, 1]) { ellipse(ctx, side * 14, -18, 10, 7); ctx.fill(); }
    ctx.fillStyle = gradient(ctx, -21, -17, 21, 22, [[0, '#bdebf4'], [0.4, '#4c9bb9'], [1, '#193d58']]);
    ctx.strokeStyle = '#102a3b'; ctx.lineWidth = 2.5; circle(ctx, 0, 2, 21); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff5d9'; circle(ctx, 0, 2, 16.5); ctx.fill();
    ctx.strokeStyle = '#586876'; ctx.lineWidth = 1.5;
    for (let tick = 0; tick < 12; tick += 1) { const a = tick * TAU / 12; ctx.beginPath(); ctx.moveTo(Math.sin(a) * 13, 2 + Math.cos(a) * 13); ctx.lineTo(Math.sin(a) * 15, 2 + Math.cos(a) * 15); ctx.stroke(); }
    ctx.strokeStyle = '#213c50'; ctx.lineWidth = 2.8; ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(-7, -5); ctx.moveTo(0, 2); ctx.lineTo(Math.sin(time * .8 + .7) * 11, 2 - Math.cos(time * .8 + .7) * 11); ctx.stroke();
    ctx.fillStyle = droneAccent; circle(ctx, 0, 2, 2.6); ctx.fill();
  } else if (id === 'budget-overruns') {
    for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * 10, -12); ctx.rotate(side * .24);
      ctx.fillStyle = gradient(ctx, -13, -13, 13, 10, [[0, '#b7f1b1'], [0.55, '#4ba77d'], [1, '#21634e']]);
      ctx.strokeStyle = '#173d36'; ctx.lineWidth = 1.5; rounded(ctx, -13, -13, 26, 26, 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d4f2b0'; rounded(ctx, -9, -9, 18, 17, 2); ctx.stroke(); circle(ctx, 0, -1, 4); ctx.stroke(); ctx.restore();
    }
    ctx.fillStyle = gradient(ctx, -30, -8, 27, 23, [[0, '#ffd79c'], [0.25, paint], [0.65, '#c66b32'], [1, '#6d3b2a']]);
    ctx.strokeStyle = '#503528'; ctx.lineWidth = 2; rounded(ctx, -30, -9, 60, 32, 6); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#ffe0a780'; ctx.lineWidth = 1; rounded(ctx, -25, -4, 50, 22, 3); ctx.stroke();
    eyes(ctx, -5, 4, 6, damaged ? 2 : 0);
    ctx.fillStyle = '#824829'; rounded(ctx, 15, 1, 16, 12, 3); ctx.fill(); ctx.fillStyle = '#ffe4a1'; circle(ctx, 23, 7, 2.4); ctx.fill();
  } else if (id === 'tech-debt') {
    ctx.strokeStyle = '#182f3b'; ctx.lineWidth = 7;
    const wires = [[-30,-10,-19,-32,18,-26,24,-10],[-27,14,-39,-19,34,25,25,-18],[-22,-18,11,24,-20,33,27,16]];
    wires.forEach((wire,index) => { ctx.beginPath(); ctx.moveTo(wire[0],wire[1]); ctx.bezierCurveTo(...wire.slice(2)); ctx.stroke(); ctx.strokeStyle = ['#66e9cb','#b8a0ff','#ffc36b'][index]; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#182f3b'; ctx.lineWidth = 7; });
    ctx.fillStyle = gradient(ctx, -22, -17, 22, 21, [[0, '#65bcad'], [0.4, '#21716b'], [1, '#103d4a']]); ctx.strokeStyle = '#0b2733'; ctx.lineWidth = 2; rounded(ctx, -22, -16, 44, 35, 4); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#b9d7b4'; ctx.lineWidth = 2;
    for (const side of [-1,1]) for (let pin = -1; pin <= 1; pin += 1) { ctx.beginPath(); ctx.moveTo(side * 22,pin * 10); ctx.lineTo(side * 29,pin * 10); ctx.stroke(); }
    ctx.fillStyle = '#172b44'; rounded(ctx, -13, -9, 26, 22, 3); ctx.fill(); eyes(ctx, 0, 0, 6, 1);
    ctx.fillStyle = droneAccent; circle(ctx, 17, -10, 3); ctx.fill();
  } else if (id === 'bottlenecks') {
    ctx.fillStyle = '#a9e8f12b'; ctx.strokeStyle = '#9ed8e7'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-18,-20); ctx.quadraticCurveTo(-19,-8,-5,0); ctx.quadraticCurveTo(-19,9,-18,20); ctx.lineTo(18,20); ctx.quadraticCurveTo(19,8,5,0); ctx.quadraticCurveTo(19,-9,18,-20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffc96b'; ctx.beginPath(); ctx.moveTo(-15,-15); ctx.lineTo(15,-15); ctx.lineTo(3,-4); ctx.lineTo(-3,-4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14,18); ctx.lineTo(0,9); ctx.lineTo(14,18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff1cb'; for (const [x,y] of [[-3,0],[3,1],[0,5]]) { rounded(ctx,x-3,y-2,6,4,1); ctx.fill(); }
    ctx.fillStyle = gradient(ctx,-26,0,26,0,[[0,'#864b2b'],[.3,paint],[.55,'#ffe4a4'],[1,'#9d542b']]);
    for (const y of [-24,18]) { rounded(ctx,-26,y,52,7,3); ctx.fill(); }
    ctx.strokeStyle = '#ffdca0'; ctx.lineWidth = 3; for(const side of [-1,1]) { ctx.beginPath(); ctx.moveTo(side*23,-17); ctx.lineTo(side*23,18); ctx.stroke(); }
  } else {
    ctx.strokeStyle = '#16263b'; ctx.lineWidth = 8;
    for (const side of [-1,1]) { ctx.beginPath(); ctx.moveTo(side*28,-1); ctx.bezierCurveTo(side*35,-25,side*9,-28,side*19,-14); ctx.stroke(); ctx.strokeStyle = side<0?'#8bc6fa':'#e0a0ea'; ctx.lineWidth=4; ctx.stroke(); ctx.strokeStyle='#16263b'; ctx.lineWidth=8; }
    for(const side of [-1,1]) {
      ctx.fillStyle=gradient(ctx,side*29,-13,side*9,14,[[0,side<0?'#77c8ed':'#d79ce7'],[.45,side<0?'#3885ad':'#9b63af'],[1,'#263452']]); ctx.strokeStyle='#14283e'; ctx.lineWidth=2; rounded(ctx,side<0?-30:10,-12,20,29,5); ctx.fill();ctx.stroke();
      ctx.fillStyle='#e3d4a2'; for(const y of [-5,5]) { rounded(ctx,side<0?-11:4,y,7,3,1);ctx.fill(); }
      ctx.fillStyle='#11263b'; rounded(ctx,side<0?-23:15,-6,8,9,2);ctx.fill();
    }
    ctx.fillStyle='#fff0a8'; ctx.beginPath();ctx.moveTo(1,-8);ctx.lineTo(-4,1);ctx.lineTo(1,1);ctx.lineTo(-1,10);ctx.lineTo(6,-1);ctx.lineTo(1,-1);ctx.closePath();ctx.fill();
  }
  if (damaged) { ctx.strokeStyle='#ffddaa';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(-6,-11);ctx.lineTo(2,-3);ctx.lineTo(-2,4);ctx.lineTo(7,11);ctx.stroke(); }
}

export function drawHazardIcon(ctx, id, size = 64) {
  ctx.save(); ctx.translate(size / 2, size / 2); ctx.scale(size / 76, size / 76);
  hazardModel(ctx, HAZARD_VISUALS[id] ? id : 'scope-creep'); ctx.restore();
}

function drone(ctx, enemy, height, time, reducedMotion) {
  const pose = hazardVisualGeometry(enemy, { reducedMotion });
  ctx.save(); ctx.translate(pose.x, pose.y); ctx.scale(pose.scaleX, pose.scaleY);
  glow(ctx,0,3,42,pose.id==='tech-debt'?'#75dacc':paint,.11);
  ctx.save(); ctx.beginPath(); ctx.rect(-32,-25,64,50); ctx.clip();
  hazardModel(ctx,pose.id,pose.time,enemy.maxHealth>1 && enemy.health===1); ctx.restore();
  if(enemy.maxHealth>1) for(let index=0;index<enemy.maxHealth;index+=1) { ctx.fillStyle=index<enemy.health?'#ffe3a5':'#263c4b';rounded(ctx,(index-(enemy.maxHealth-1)/2)*10-3,28,6,4,1);ctx.fill(); }
  ctx.restore();
}

export function bossHealthBarLayout(scene, arena = arenaFor(scene), { cssHeight = arena.height, reservedRects = [] } = {}) {
  if (!scene.boss) return null;
  const boss = scene.boss, shape = bossGeometry(scene);
  const unit = arena.height / Math.max(1, cssHeight), margin = 6 * unit;
  const width = Math.min(shape.halfWidth * 1.8, arena.width - margin * 2), height = 6 * unit;
  const x = clamp(boss.x - width / 2, margin, arena.width - width - margin);
  const preferredY = Math.max(8 * unit, boss.y - shape.halfHeight - 12 * unit);
  const occupied = [...reservedRects, { x: boss.x - shape.halfWidth, y: boss.y - shape.halfHeight, width: shape.halfWidth * 2, height: shape.halfHeight * 2 }];
  const candidates = [preferredY, boss.y + shape.halfHeight + 8 * unit,
    ...reservedRects.flatMap(rect => [rect.y + rect.height + margin, rect.y - height - margin])];
  const y = candidates.filter(top => top >= margin && top + height <= arena.height - margin &&
    !occupied.some(rect => x < rect.x + rect.width + margin && x + width + margin > rect.x && top < rect.y + rect.height + margin && top + height + margin > rect.y))
    .sort((a, b) => Math.abs(a - preferredY) - Math.abs(b - preferredY))[0];
  return y === undefined ? null : { x, y, width, height, unit };
}

export function bossVisualPose(scene, { reducedMotion = false } = {}) {
  if (!scene?.boss) return null;
  const boss = scene.boss, geometry = bossGeometry(scene);
  return { ...geometry, geometry, kind: boss.label === 'Scope Creep' ? 'paperwork' : 'revision',
    windup: boss.phase === 'windup' ? reducedMotion ? 1 : clamp(1 - boss.attackIn / 1.1, 0, 1) : 0,
    recoil: !reducedMotion && boss.phase === 'recover' ? clamp((boss.attackIn - 1.43) / .27, 0, 1) : 0,
    motion: reducedMotion ? 0 : Math.sin((boss.age || 0) * 2) * 2,
    lowHealth: boss.health <= boss.maxHealth * .5 };
}

function paperworkBoss(ctx, pose) {
  for (const side of [-1, 1]) {
    ctx.strokeStyle = '#293444'; ctx.lineWidth = 15;
    ctx.beginPath(); ctx.moveTo(side * 66, 14); ctx.lineTo(side * 110, 34); ctx.lineTo(side * 140, 14 - pose.windup * 10); ctx.stroke();
    ctx.strokeStyle = gradient(ctx,-145,0,145,0,[[0,'#8f4825'],[.3,paint],[.55,'#ffe0a1'],[1,'#a44b22']]); ctx.lineWidth=9; ctx.stroke();
    ctx.fillStyle='#ffe2b3'; circle(ctx,side*109,33,6);ctx.fill();
    ctx.save();ctx.translate(side*139,7-pose.windup*10+pose.motion);
    ctx.fillStyle=gradient(ctx,-16,-20,16,21,[[0,'#ffdf9d'],[.4,paint],[1,'#8e421f']]);ctx.strokeStyle='#513323';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(side*-7,18);ctx.lineTo(side*-12,-10);ctx.lineTo(side*-4,-4);ctx.lineTo(side*9,-24+pose.windup*8);ctx.lineTo(side*17,-5);ctx.lineTo(side*11,18);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  }
  paper(ctx,-8,-6,160,76,-.06);paper(ctx,8,-2,160,76,.06);paper(ctx,0,6,160,76);
  ctx.fillStyle=gradient(ctx,-62,-33,62,-24,[[0,'#9f3d25'],[.45,droneAccent],[1,'#ffb56b']]);rounded(ctx,-63,-32,113,9,2);ctx.fill();
  for(const side of [-1,1]) {ctx.fillStyle=paint;rounded(ctx,side<0?-91:80,-21,12,15,2);ctx.fill();}
  ctx.save();ctx.translate(0,-7);ctx.scale(2,2);eyes(ctx,0,0,15,pose.windup?2:1);ctx.restore();
  ctx.strokeStyle='#514338';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-17,21);ctx.quadraticCurveTo(0,pose.windup?28:31,17,21);ctx.stroke();
  ctx.strokeStyle='#82969b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-63,-29);ctx.lineTo(-63,-41);ctx.quadraticCurveTo(-63,-49,-53,-45);ctx.lineTo(-53,-32);ctx.stroke();
  if(pose.lowHealth) {
    ctx.fillStyle='#192d39';ctx.beginPath();ctx.moveTo(39,44);ctx.lineTo(45,29);ctx.lineTo(51,42);ctx.lineTo(60,31);ctx.lineTo(68,44);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#bd7952';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-51,-8);ctx.lineTo(-41,4);ctx.lineTo(-45,12);ctx.stroke();
  }
}

function revisionBoss(ctx, pose) {
  for(const side of [-1,1]) {
    ctx.fillStyle=gradient(ctx,side*150,0,side*110,0,[[0,'#253c50'],[.5,'#8aa9b6'],[1,'#263f52']]);ctx.strokeStyle='#102535';ctx.lineWidth=3;
    rounded(ctx,side<0?-157:110,-7,47,41,8);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#dbd9b6';ctx.lineWidth=2;for(let line=0;line<3;line+=1){ctx.beginPath();ctx.moveTo(side*116,8+line*7);ctx.lineTo(side*149,8+line*7);ctx.stroke();}
  }
  paper(ctx,0,-31,104,42,-.035);
  ctx.fillStyle=gradient(ctx,-114,-28,110,49,[[0,'#b9d0d5'],[.25,'#6d919f'],[.55,'#294a61'],[1,'#122a40']]);ctx.strokeStyle='#0b2032';ctx.lineWidth=3;
  rounded(ctx,-112,-24,224,74,12);ctx.fill();ctx.stroke();
  ctx.fillStyle='#dbe8e3';rounded(ctx,-83,-34,166,16,5);ctx.fill();
  ctx.fillStyle='#142e41';rounded(ctx,-78,10,156,27,5);ctx.fill();
  paper(ctx,4,32,83,31,.025);ctx.strokeStyle=droneAccent;ctx.lineWidth=3;ctx.beginPath();ctx.arc(4,31,8,.2,5.1);ctx.stroke();ctx.beginPath();ctx.moveTo(9,23);ctx.lineTo(16,24);ctx.lineTo(12,30);ctx.stroke();
  const stampY=-19-pose.windup*8+pose.recoil*7;
  ctx.fillStyle='#e2d8b5';rounded(ctx,-37,stampY-14,13,20,4);ctx.fill();
  ctx.fillStyle=gradient(ctx,-55,stampY,-8,stampY+21,[[0,'#ffdf9d'],[.45,paint],[1,'#9e4e28']]);rounded(ctx,-53,stampY,46,16,4);ctx.fill();
  ctx.fillStyle='#7d3a2a';rounded(ctx,-56,stampY+14,52,5,2);ctx.fill();
  ctx.fillStyle=pose.windup?'#ffd783':'#a8eddf';rounded(ctx,45,-13,45,23,4);ctx.fill();
  ctx.strokeStyle='#21485b';ctx.lineWidth=3;ctx.beginPath();ctx.arc(67,-2,7,.1,5.1);ctx.stroke();ctx.beginPath();ctx.moveTo(70,-10);ctx.lineTo(77,-7);ctx.lineTo(72,-3);ctx.stroke();
  for(let index=0;index<3;index+=1){ctx.fillStyle=index===0?droneAccent:'#bdd6d7';circle(ctx,81-index*10,42,2.3);ctx.fill();}
  if(pose.lowHealth) {
    ctx.strokeStyle='#ffcd8a';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(-98,10);ctx.lineTo(-84,20);ctx.lineTo(-91,31);ctx.lineTo(-76,42);ctx.stroke();
    ctx.fillStyle='#463c39';ellipse(ctx,94,-16,11,5);ctx.fill();
  }
}

function bossThreat(ctx, scene, arena, options) {
  const boss = scene.boss;
  if (!boss) return;
  const shape = bossGeometry(scene);
  const unit = arena.height / Math.max(1, options.cssHeight || arena.height);
  if (boss.phase === 'windup') {
    ctx.save(); ctx.strokeStyle = '#ffbc78b3'; ctx.fillStyle = '#e6532420'; ctx.lineWidth = 2 * unit;
    ctx.setLineDash([8 * unit, 8 * unit]);
    for (const offset of boss.warningOffsets || [0]) {
      ctx.beginPath(); ctx.moveTo(boss.x, boss.y + shape.halfHeight); ctx.lineTo(boss.aimX + offset, boss.aimY); ctx.stroke();
      circle(ctx, boss.aimX + offset, boss.aimY, 21 * unit); ctx.fill(); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffe3bd'; ctx.textAlign = 'center'; ctx.font = `700 ${12 * unit}px system-ui, sans-serif`;
    ctx.fillText('Incoming', clamp(boss.aimX, 50 * unit, arena.width - 50 * unit), Math.max(18 * unit, boss.aimY - 29 * unit));
    ctx.restore();
  }
  const pose = bossVisualPose(scene, options);
  ctx.save(); ctx.translate(boss.x, boss.y); ctx.scale(shape.halfWidth / 160, shape.halfHeight / 54);
  glow(ctx,0,10,155,paint,.12);
  ctx.beginPath();ctx.rect(-160,-54,320,108);ctx.clip();
  if(pose.kind==='paperwork') paperworkBoss(ctx,pose); else revisionBoss(ctx,pose);
  ctx.restore();
  ctx.save();
  const bar = bossHealthBarLayout(scene, arena, options);
  if (bar) {
    ctx.fillStyle = '#071522'; rounded(ctx, bar.x, bar.y, bar.width, bar.height, 3 * unit); ctx.fill();
    ctx.fillStyle = '#ffbc70'; rounded(ctx, bar.x, bar.y, Math.max(0.1, bar.width * clamp(boss.health / boss.maxHealth, 0, 1)), bar.height, 3 * unit); ctx.fill();
    ctx.strokeStyle = '#ffe0a5a0'; ctx.lineWidth = unit; rounded(ctx, bar.x, bar.y, bar.width, bar.height, 3 * unit); ctx.stroke();
  }
  ctx.restore();
}
function hostileProjectile(ctx, shot) {
  ctx.save(); ctx.translate(shot.x, shot.y);
  const angle = Math.atan2(shot.vy, shot.vx);
  if (shot.kind === 'paper') {
    ctx.rotate(angle - Math.PI / 2);
    const radius = shot.radius || 10;
    paper(ctx, 0, 0, radius * 1.6, radius * 2, 0, '#fff0bf');
    ctx.fillStyle = '#f2a64f'; rounded(ctx, -radius * .55, -radius * .85, radius * .9, radius * .35, 1); ctx.fill();
    ctx.restore(); return;
  }
  ctx.strokeStyle = '#ffb15f99'; ctx.lineWidth = shot.radius * 1.2;
  ctx.beginPath(); ctx.moveTo(-Math.cos(angle) * 24, -Math.sin(angle) * 24); ctx.lineTo(0, 0); ctx.stroke();
  glow(ctx, 0, 0, shot.radius * 2.3, '#ff7542', 0.6);
  ctx.fillStyle = '#fff0bd'; circle(ctx, 0, 0, shot.radius * 0.65); ctx.fill(); ctx.restore();
}

function projectile(ctx, bullet, reducedMotion) {
  const lance = bullet.kind === 'lance', missile = bullet.kind === 'missile', wingmate = bullet.kind === 'wingmate';
  if (missile && !reducedMotion) {
    const trail = (bullet.trail || []).slice(0, 8);
    ctx.save(); ctx.lineCap = 'round';
    for (let index = trail.length - 1; index >= 0; index -= 1) {
      const next = index === 0 ? bullet : trail[index - 1];
      ctx.strokeStyle = paint;
      ctx.globalAlpha = (1 - index / 8) * 0.32; ctx.lineWidth = 2 + (1 - index / 8) * 4;
      ctx.beginPath(); ctx.moveTo(trail[index].x, trail[index].y + 15); ctx.lineTo(next.x, next.y + 15); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.save(); ctx.translate(bullet.x, bullet.y); ctx.rotate(Math.atan2(bullet.vx || 0, missile ? Math.max(1, -(bullet.vy || -510)) : 620));
  if (missile) {
    glow(ctx,0,15,25,paint,.28);
    ctx.fillStyle=gradient(ctx,-5,0,5,0,[[0,'#7499ac'],[.45,'#f0fbfa'],[1,'#577c92']]);rounded(ctx,-5,-13,10,27,3);ctx.fill();
    ctx.fillStyle=paint;ctx.beginPath();ctx.moveTo(-5,-12);ctx.lineTo(0,-23);ctx.lineTo(5,-12);ctx.closePath();ctx.fill();
    for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(side*4,0);ctx.lineTo(side*11,12);ctx.lineTo(side*4,10);ctx.closePath();ctx.fill();}
    ctx.fillStyle=gradient(ctx,0,12,0,39,[[0,'#fff6d3'],[.35,paint],[1,'transparent']]);
    ctx.beginPath();ctx.moveTo(-4,13);ctx.lineTo(0,reducedMotion?29:37);ctx.lineTo(4,13);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fffbe4';ellipse(ctx,0,14,2.5,5);ctx.fill();
  } else {
    const tail=wingmate?25:lance?76:43, color=wingmate?'#a8f2d5':lance?'#8be8ff':paint;
    glow(ctx,0,-3,wingmate?9:lance?19:14,color,wingmate?.18:.32);
    ctx.fillStyle=gradient(ctx,0,-12,0,tail,[[0,beamCore],[.2,color],[1,'transparent']]);
    rounded(ctx,wingmate?-2:lance?-2.5:-4,-12,wingmate?4:lance?5:8,tail,3);ctx.fill();
    ctx.fillStyle=beamCore;rounded(ctx,-1.4,-13,2.8,lance?35:15,1.3);ctx.fill();
    if(lance){ctx.strokeStyle='#b7f1ff70';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-6,4);ctx.lineTo(-6,36);ctx.moveTo(6,4);ctx.lineTo(6,36);ctx.stroke();}
  }
  ctx.restore();
}

export function volleyVisualPose(scene, { reducedMotion = false } = {}) {
  const weapon=invaderWeapon(scene), cadence=weapon.cadence||.24;
  const flare=reducedMotion||!(scene.volleys>0)?0:clamp((scene.cooldown-(cadence-.085))/.085,0,1);
  return { flare, recoil:flare*3, color:scene.weaponFamily==='focused'?'#9beaff':paint, weapon };
}

function muzzleGlow(ctx,scene,arena,pose) {
  if(!pose.flare)return;
  ctx.save();ctx.globalAlpha*=pose.flare;
  for(const shot of pose.weapon.pattern){
    const x=scene.player+shot.offset,y=arena.playerY-39+pose.recoil;
    glow(ctx,x,y,17,pose.color,.32);
    ctx.fillStyle=beamCore;ctx.beginPath();ctx.moveTo(x-4,y+3);ctx.lineTo(x,y-10);ctx.lineTo(x+4,y+3);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}

export function hazardLabelLayout(ctx, enemies, arena, { cssHeight = arena.height, reservedRects = [] } = {}) {
  const unit = arena.height / Math.max(1, cssHeight);
  const fontSize = 13 * unit;
  const height = 24 * unit;
  const margin = 7 * unit;
  ctx.save(); ctx.font = `600 ${fontSize}px system-ui, sans-serif`;
  const labels = [];
  for (const enemy of [...(enemies || [])].sort((a, b) => b.y - a.y)) {
    const text = enemy.label || enemy.hazard?.label;
    if (!text || enemy.y < -15 || enemy.y > arena.height + 20) continue;
    const width = Math.min(arena.width - margin * 2, ctx.measureText(text).width + 18 * unit);
    const threatScale = enemy.scale || INVADER_THREAT_SCALE;
    const preferred = { x: clamp(enemy.x - width / 2, margin, arena.width - width - margin),
      y: clamp(enemy.y - 42 * threatScale - height, margin, arena.height - height - margin) };
    const occupied = [...reservedRects, ...labels];
    const candidates = [preferred, { x: preferred.x, y: enemy.y + 38 * threatScale }];
    for (const other of occupied) {
      candidates.push({ x: preferred.x, y: other.y + other.height + margin },
        { x: preferred.x, y: other.y - height - margin },
        { x: other.x + other.width + margin, y: preferred.y },
        { x: other.x - width - margin, y: preferred.y });
    }
    const fits = point => point.x >= margin && point.x + width <= arena.width - margin &&
      point.y >= margin && point.y + height <= arena.height - margin &&
      Math.abs(point.y + height / 2 - enemy.y) <= 100 * unit &&
      !occupied.some(other => point.x < other.x + other.width + margin && point.x + width + margin > other.x &&
        point.y < other.y + other.height + margin && point.y + height + margin > other.y);
    const cost = point => Math.abs(point.y - preferred.y) + Math.abs(point.x - preferred.x) * .8;
    const point = candidates.filter(fits).sort((a, b) => cost(a) - cost(b))[0];
    // A just-entering hazard can briefly wait for a free label position instead
    // of covering the HUD or showing a name far from its actual target.
    if (!point) continue;
    const shifted = Math.abs(point.x - preferred.x) > 8 * unit || Math.abs(point.y - preferred.y) > 12 * unit;
    labels.push({ text, ...point, width, height, fontSize, unit, shifted, enemyX: enemy.x, enemyY: enemy.y });
  }
  ctx.restore();
  return labels;
}

function hazardLabels(ctx, scene, arena, options) {
  for (const label of hazardLabelLayout(ctx, scene.enemies, arena, options)) {
    ctx.save();
    if (label.shifted) {
      ctx.strokeStyle = '#ed995b7d'; ctx.lineWidth = label.unit;
      ctx.beginPath(); ctx.moveTo(label.enemyX, label.enemyY - 20);
      ctx.lineTo(clamp(label.enemyX, label.x + 4 * label.unit, label.x + label.width - 4 * label.unit),
        label.y > label.enemyY ? label.y : label.y + label.height); ctx.stroke();
    }
    ctx.fillStyle = '#09131fec'; ctx.strokeStyle = '#ed995b9c'; ctx.lineWidth = label.unit;
    rounded(ctx, label.x, label.y, label.width, label.height, 6 * label.unit); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#fff3df'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `600 ${label.fontSize}px system-ui, sans-serif`;
    ctx.fillText(label.text, label.x + label.width / 2, label.y + label.height / 2, label.width - 12 * label.unit);
    ctx.restore();
  }
}

function hazardImpact(ctx, scene, arena, reducedMotion) {
  if (!(scene.lastHazardTime > 0)) return;
  const age = Math.max(0, 2.4 - scene.lastHazardTime);
  const fade = Math.min(1, scene.lastHazardTime / 0.7);
  const blocked = scene.lastHazardBlocked;
  ctx.save();
  // A steady fade gives life-loss feedback without flashing or camera shake.
  ctx.strokeStyle = blocked ? `rgba(133,225,244,${0.7 * fade})` : `rgba(255,112,72,${0.8 * fade})`;
  ctx.lineWidth = 5; rounded(ctx, 3, 3, arena.width - 6, arena.height - 6, 8); ctx.stroke();
  if (age < 0.7) {
    ctx.globalAlpha = (1 - age / 0.7) * 0.8;
    ctx.lineWidth = 3;
    const spread = reducedMotion ? 0 : age * 42;
    ellipse(ctx, scene.player, arena.playerY - 5, 54 + spread, 65 + spread); ctx.stroke();
  }
  ctx.restore();
}

function pickupModel(ctx, kind) {
  if (kind === 'missiles') {
    glow(ctx, 0, 0, 40, paint, .24);
    ctx.fillStyle = '#123240'; ctx.strokeStyle = '#ffc98c'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(25, -14); ctx.lineTo(25, 15); ctx.lineTo(0, 30); ctx.lineTo(-25, 15); ctx.lineTo(-25, -14); ctx.closePath(); ctx.fill(); ctx.stroke();
    // One broad rocket silhouette reads as ammunition at phone scale.
    ctx.fillStyle = gradient(ctx, -11, -15, 12, 16, [[0, '#ffe6b4'], [.24, paint], [1, '#a93916']]);
    ctx.strokeStyle = '#ffe1a6'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -25); ctx.bezierCurveTo(10, -16, 12, -6, 10, 10); ctx.lineTo(-10, 10); ctx.bezierCurveTo(-12, -6, -10, -16, 0, -25); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffad4d';
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 9, -2); ctx.lineTo(side * 20, 16); ctx.lineTo(side * 8, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.fillStyle = '#112e42'; circle(ctx, 0, -5, 5.5); ctx.fill(); ctx.strokeStyle = '#d4ffff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff0b7'; ctx.beginPath(); ctx.moveTo(-6, 12); ctx.lineTo(0, 26); ctx.lineTo(6, 12); ctx.closePath(); ctx.fill();
    return;
  }
  glow(ctx, 0, 0, 35, '#83defc60');
  ctx.fillStyle = gradient(ctx, -15, -18, 15, 18, [[0, '#aee7e6'], [0.45, '#397891'], [1, '#092a46']]);
  ctx.strokeStyle = '#b9f2f4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, -11); ctx.lineTo(12, 4); ctx.quadraticCurveTo(8, 13, 0, 19); ctx.quadraticCurveTo(-8, 13, -12, 4); ctx.lineTo(-14, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#f7ffea'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-1, 5); ctx.lineTo(7, -7); ctx.stroke();
}

export function drawPickupIcon(ctx, kind, size = 64) {
  ctx.save(); ctx.translate(size / 2, size / 2); ctx.scale(size / 76, size / 76);
  pickupModel(ctx, kind === 'missiles' ? 'missiles' : 'shield'); ctx.restore();
}

function shieldPickup(ctx, item, time, reducedMotion) {
  const bob = reducedMotion ? 0 : Math.sin(time * 3 + item.x) * 3;
  ctx.save(); ctx.translate(item.x, item.y + bob);
  pickupModel(ctx, item.kind); ctx.restore();
}

function effects(ctx, list, reducedMotion) {
  for (const item of list || []) {
    const t = clamp(item.age / item.life, 0, 1);
    const fade = (1 - t) ** 1.6;
    if (item.kind === 'wave' || item.kind === 'landing') continue;
    if (item.kind === 'explosion' || item.kind === 'impact') {
      const radius = reducedMotion ? 23 : 14 + t * 70;
      glow(ctx, item.x, item.y, radius, '#ff8e2a', fade * 0.75);
      glow(ctx, item.x, item.y, radius * 0.44, '#fff1be', fade);
      ctx.strokeStyle = `rgba(255,194,111,${fade * 0.65})`; ctx.lineWidth = 2;
      circle(ctx, item.x, item.y, radius * 0.85); ctx.stroke();
      if (!reducedMotion) {
        for (let index = 0; index < 13; index += 1) {
          const angle = noise(index + item.seed * 7) * TAU;
          const distance = (20 + noise(index + 43) * 70) * t;
          const x = item.x + Math.cos(angle) * distance;
          const y = item.y + Math.sin(angle) * distance;
          ctx.fillStyle = `rgba(255,${Math.floor(142 + noise(index) * 100)},74,${fade})`;
          ellipse(ctx, x, y, 1.5 + noise(index + 2) * 2, 1.5); ctx.fill();
        }
      }
    } else if (item.kind === 'shield' || item.kind === 'energy') {
      ctx.strokeStyle = item.kind === 'shield' ? `rgba(160,238,255,${fade})` : `rgba(255,202,102,${fade})`;
      ctx.lineWidth = 3; circle(ctx, item.x, item.y, 15 + t * (reducedMotion ? 8 : 50)); ctx.stroke();
    } else if (item.kind === 'dust' || item.kind === 'jet') {
      if (reducedMotion) continue;
      for (let index = 0; index < 8; index += 1) {
        const dx = (noise(index + item.seed) - 0.5) * 80 * t;
        const dy = (item.kind === 'jet' ? 25 : -14) * t + index * 0.8;
        ctx.fillStyle = item.kind === 'jet' ? `rgba(255,188,85,${fade * 0.8})` : `rgba(187,161,121,${fade * 0.45})`;
        ellipse(ctx, item.x + dx, item.y + dy, 3 + t * 6, 2 + t * 3); ctx.fill();
      }
    } else {
      glow(ctx, item.x, item.y, 20 * (1 - t) + 4, '#fff0b8', fade);
    }
  }
}

function checkmark(ctx, x, y, size, color = '#b5f1d8') {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - size * .6, y); ctx.lineTo(x - size * .12, y + size * .42); ctx.lineTo(x + size * .7, y - size * .55);
  ctx.strokeStyle = '#153744'; ctx.lineWidth = Math.max(3, size * .28); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, size * .16); ctx.stroke(); ctx.restore();
}

function completedPaperwork(ctx, item, reducedMotion) {
  const t = clamp(item.age / item.life, 0, 1), fade = (1 - t) ** 1.3;
  const boss = item.life >= .9, reach = boss ? 105 : 42, seed = item.seed || 0;
  ctx.save(); ctx.globalAlpha *= fade;
  glow(ctx, item.x, item.y, boss ? 65 : 28, '#9bddca', .18);
  if (!reducedMotion) for (let index = 0; index < (boss ? 7 : 4); index += 1) {
    const angle = noise(index + seed * 7) * TAU, distance = (.4 + noise(index + 43) * .6) * reach * t;
    const x = item.x + Math.cos(angle) * distance, y = item.y + Math.sin(angle) * distance - t * 12;
    paper(ctx, x, y, boss ? 11 : 7, boss ? 14 : 9, Math.sin(angle) * .35, ['#fff3cc', '#dbf7ec', '#e1f0ff'][index % 3]);
  }
  checkmark(ctx, item.x, item.y - (reducedMotion ? 0 : t * 10), boss ? 29 : 15);
  ctx.restore();
}

function invaderEffects(ctx, list, reducedMotion) {
  // Rendering is bounded independently of the simulation's transient list.
  for(const item of (list||[]).slice(-24)){
    if (item.kind === 'relay') {
      if (![item.x, item.y, item.toX, item.toY].every(Number.isFinite)) continue;
      const fade = 1 - clamp(item.age / item.life, 0, 1);
      ctx.save(); ctx.globalAlpha *= fade; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(item.x, item.y); ctx.lineTo(item.toX, item.toY);
      ctx.strokeStyle = '#133947'; ctx.lineWidth = 7; ctx.stroke();
      ctx.strokeStyle = '#b5f4dc'; ctx.lineWidth = 3; ctx.stroke();
      ctx.fillStyle = '#f2fff5'; circle(ctx, item.toX, item.toY, 4); ctx.fill();
      ctx.restore(); continue;
    }
    if (item.kind === 'support-upgrade' || item.kind === 'inbox-zero') {
      const t = clamp(item.age / item.life, 0, 1), fade = 1 - t;
      ctx.save(); ctx.globalAlpha *= fade;
      ctx.strokeStyle = '#b8f2d6'; ctx.lineWidth = 2;
      ellipse(ctx, item.x, item.y, reducedMotion ? 54 : 35 + t * 35, reducedMotion ? 34 : 22 + t * 25); ctx.stroke();
      checkmark(ctx, item.x, item.y - 60, 13); ctx.restore(); continue;
    }
    if (item.kind === 'explosion') { completedPaperwork(ctx, item, reducedMotion); continue; }
    if (['missile-launch', 'missile-impact', 'missile-load'].includes(item.kind)) {
      const t = clamp(item.age / item.life, 0, 1), fade = (1 - t) ** 1.5;
      const launch = item.kind === 'missile-launch', load = item.kind === 'missile-load';
      const radius = reducedMotion ? 23 : load ? 24 + t * 55 : launch ? 12 + t * 27 : 16 + t * 68;
      ctx.save(); ctx.globalAlpha *= fade;
      for (const side of launch ? [-1, 1] : [0]) {
        const x = item.x + side * 40;
        glow(ctx, x, item.y + (launch ? 15 : 0), radius, paint, launch ? .3 : .45);
        ctx.strokeStyle = load ? '#a9f3ed' : '#ffd6a1'; ctx.lineWidth = 2;
        ellipse(ctx, x, item.y, radius, radius * (launch ? .5 : .8)); ctx.stroke();
        if (reducedMotion || load) continue;
        for (let index = 0; index < (launch ? 4 : 10); index += 1) {
          const angle = noise(index + item.seed * 7) * TAU;
          const reach = (launch ? 32 : 72) * t, sx = x + Math.cos(angle) * reach, sy = item.y + Math.sin(angle) * reach;
          ctx.strokeStyle = index % 2 ? '#a6f1fa' : '#ffe4b8'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(angle) * 9, sy + Math.sin(angle) * 9); ctx.stroke();
        }
      }
      ctx.restore(); continue;
    }
    if(!['explosion','impact','spark'].includes(item.kind)){effects(ctx,[item],reducedMotion);continue;}
    const t=clamp(item.age/item.life,0,1),fade=(1-t)**1.6;
    const boss=item.kind==='explosion'&&item.life>=.9;
    const reach=item.kind==='spark'?22:boss?155:65;
    const radius=reducedMotion?item.kind==='spark'?12:30:12+t*reach;
    glow(ctx,item.x,item.y,radius,paint,fade*(boss ? .32 : .45));
    glow(ctx,item.x,item.y,radius*.28,'#fff4d2',fade*.65);
    if(reducedMotion)continue;
    ctx.save();ctx.globalAlpha*=fade;
    const count=boss?18:item.kind==='spark'?6:10;
    for(let index=0;index<count;index+=1){
      const angle=noise(index+item.seed*7)*TAU;
      const distance=(.3+noise(index+43)*.7)*reach*t;
      const x=item.x+Math.cos(angle)*distance,y=item.y+Math.sin(angle)*distance+(boss?24*t*t:0);
      ctx.save();ctx.translate(x,y);ctx.rotate(angle+t*2);
      ctx.fillStyle=boss?['#fff2ce',paint,'#a8e7e7'][index%3]:index%3?'#ffd997':paint;
      if(boss){rounded(ctx,-5,-3,10,6,1);ctx.fill();ctx.strokeStyle='#83684d';ctx.lineWidth=.7;ctx.stroke();}
      else{ctx.beginPath();ctx.moveTo(-4,0);ctx.lineTo(4+index%3*2,-1);ctx.lineTo(1,2);ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    if(boss){ctx.strokeStyle='#ffe1a66e';ctx.lineWidth=2;circle(ctx,item.x,item.y,20+t*130);ctx.stroke();}
    ctx.restore();
  }
}

function terrain(ctx, arena, time, speed, reducedMotion) {
  const { width, height, floor } = arena;
  glow(ctx, width * 0.7, floor - 20, width * 0.45, '#e3923429');
  ctx.fillStyle = gradient(ctx, 0, floor - 8, 0, height, [[0, '#5b6261'], [0.035, '#263743'], [0.08, '#0e202d'], [1, '#060f1a']]);
  ctx.beginPath(); ctx.moveTo(0, floor - 7); ctx.lineTo(width, floor - 7); ctx.lineTo(width, height); ctx.lineTo(0, height); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#d4ba877d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, floor - 7); ctx.lineTo(width, floor - 7); ctx.stroke();
  ctx.strokeStyle = '#07141fb3'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, floor + 16); ctx.lineTo(width, floor + 16); ctx.stroke();
  const travel = reducedMotion ? 0 : time * speed;
  for (let index = -1; index < width / 170 + 2; index += 1) {
    const x = index * 170 - travel % 170;
    ctx.fillStyle = '#a5adb22b';
    ctx.beginPath(); ctx.moveTo(x, floor + 28); ctx.lineTo(x + 82, floor + 28); ctx.lineTo(x + 15, height); ctx.lineTo(x - 80, height); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = paint; ctx.fillRect(x + 70, floor + 1, 14, 4); ctx.restore();
  }
  // A nearer, softly lit rail moves faster than the distant skyline.
  ctx.strokeStyle = '#73838d38'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, height - 19); ctx.lineTo(width, height - 19); ctx.stroke();
}

// These are articulated frames from the approved Halo entrance animation, not a
// wall-clock animated image. Simulation time selects the pose and freezes on pause.
export const HALO_ATLAS = Object.freeze({
  file: 'halo-runner-atlas.webp', columns: 4, rows: 4,
  tileWidth: 256, tileHeight: 256, anchorX: 112, anchorY: 246, frames: 14,
  sourceFrames: Object.freeze([0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26]),
  bounds: Object.freeze([[31,24,215,247],[27,21,213,247],[25,19,212,246],[23,15,212,246],
    [24,29,210,247],[33,33,216,247],[50,33,232,247],[53,31,230,247],[55,30,227,247],
    [54,29,199,247],[54,29,195,247],[54,28,195,247],[54,27,200,247],[54,21,210,247]].map(Object.freeze)),
});

export function haloGeometry(state, arena = arenaFor(state), { reducedMotion = false } = {}) {
  const time = Number.isFinite(state?.elapsed) ? Math.max(0, state.elapsed) : 0;
  const airborne = (state?.height || 0) > 1;
  const landing = (state?.effects || []).find(item => item.kind === 'landing');
  let frame = 10;
  let squash = 0;
  let rotation = 0;
  if (!reducedMotion && !state?.ended) {
    if (airborne) {
      frame = (state.velocity > 0 ? 0 : 3) + Math.floor(time * 12) % 4;
      rotation = state.velocity > 0 ? 0.045 : -0.035;
    } else if (landing) {
      const progress = clamp(landing.age / landing.life, 0, 1);
      frame = [6, 7, 8, 10][Math.min(3, Math.floor(progress * 4))];
      squash = Math.sin(progress * Math.PI) * 0.075;
    } else {
      const cycle = [3, 4, 5, 6, 7, 8, 7, 6, 5, 4];
      frame = cycle[Math.floor(time * 12) % cycle.length];
    }
  }
  const artworkScale = arena.height > arena.width ? 1.35 : 1;
  const scale = (arena.runnerScale || 1) * 0.4 * artworkScale;
  const scaleX = scale * (1 + squash), scaleY = scale * (1 - squash);
  const x = arena.runnerX, y = arena.floor - (state?.height || 0);
  const [left, top, right, bottom] = HALO_ATLAS.bounds[frame];
  const points = [[left,top],[right,top],[right,bottom],[left,bottom]].map(([px,py]) => {
    const dx = -(px - HALO_ATLAS.anchorX) * scaleX, dy = (py - HALO_ATLAS.anchorY) * scaleY;
    return { x: x + dx * Math.cos(rotation) - dy * Math.sin(rotation),
      y: y + dx * Math.sin(rotation) + dy * Math.cos(rotation) };
  });
  return {
    frame, x, y, rotation, artworkScale,
    scaleX, scaleY, width: HALO_ATLAS.tileWidth * scaleX, height: HALO_ATLAS.tileHeight * scaleY,
    drawX: -HALO_ATLAS.anchorX, drawY: -HALO_ATLAS.anchorY,
    // The cape is decorative. The existing 37-unit body collision span is unchanged.
    bodyLeft: arena.runnerX - 17 * (arena.runnerScale || 1),
    bodyRight: arena.runnerX + 20 * (arena.runnerScale || 1),
    bootsY: arena.floor - (state?.height || 0),
    bounds: { left: Math.min(...points.map(point => point.x)), top: Math.min(...points.map(point => point.y)),
      right: Math.max(...points.map(point => point.x)), bottom: Math.max(...points.map(point => point.y)) },
  };
}

function haloRunner(ctx, state, arena, time, reducedMotion, sprite) {
  const pose = haloGeometry(state, arena, { reducedMotion });
  const scale = (arena.runnerScale || 1) * pose.artworkScale;
  ctx.fillStyle = `rgba(0,0,0,${0.3 * Math.max(0.2, 1 - state.height / 300)})`;
  ellipse(ctx, pose.x + 4, arena.floor + 2, 29 * scale, 6 * scale); ctx.fill();
  ctx.save(); ctx.translate(pose.x, pose.y); ctx.scale(scale, scale);
  if (state.boost > 0) {
    glow(ctx, 0, -42, 78, '#ffaf4238'); ctx.strokeStyle = '#ffcf8599'; ctx.lineWidth = 2;
    ellipse(ctx, 0, -43, 39, 52); ctx.stroke();
  }
  if (state.height > 1 && state.jumps > 1) thruster(ctx, -8, -2, 32, time, reducedMotion, 5);
  ctx.restore();
  if (!sprite?.image?.naturalWidth) return;
  ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate(pose.rotation);
  if (sprite.atlas) {
    // Halo faces the incoming obstacles; his cape trails behind, outside the hitbox.
    ctx.scale(-pose.scaleX, pose.scaleY);
    const sx = (pose.frame % HALO_ATLAS.columns) * HALO_ATLAS.tileWidth;
    const sy = Math.floor(pose.frame / HALO_ATLAS.columns) * HALO_ATLAS.tileHeight;
    ctx.drawImage(sprite.image, sx, sy, HALO_ATLAS.tileWidth, HALO_ATLAS.tileHeight,
      pose.drawX, pose.drawY, HALO_ATLAS.tileWidth, HALO_ATLAS.tileHeight);
  } else {
    ctx.scale(-scale * 0.27, scale * 0.27);
    ctx.drawImage(sprite.image, -128, -393, 288, 396);
  }
  ctx.restore();
}

function obstacle(ctx, item, floor) {
  const { x, width, height } = item;
  const y = floor - height;
  ctx.fillStyle = '#02091066'; ellipse(ctx, x + width * 0.55, floor + 3, width * 0.72, 8); ctx.fill();
  if (item.type === 'rover') {
    for (const dx of [13, width * 0.52, width - 9]) {
      ctx.fillStyle = '#050c13'; circle(ctx, x + dx, floor - 8, 12); ctx.fill();
      ctx.fillStyle = gradient(ctx, x + dx - 8, 0, x + dx + 8, 0, [[0, '#253844'], [0.5, '#a2aeb0'], [1, '#243542']]); circle(ctx, x + dx, floor - 8, 6); ctx.fill();
    }
    ctx.fillStyle = gradient(ctx, x, y, x, floor - 11, [[0, '#a7b4b5'], [0.25, '#647886'], [0.55, '#203b4e'], [1, '#11232e']]);
    ctx.beginPath(); ctx.moveTo(x + 3, floor - 14); ctx.lineTo(x + 8, y + 20); ctx.lineTo(x + width * 0.48, y + 15); ctx.lineTo(x + width * 0.64, y); ctx.quadraticCurveTo(x + width * 0.88, y - 4, x + width - 3, y + 17); ctx.lineTo(x + width + 3, floor - 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gradient(ctx, x + width * 0.6, y, x + width, y + 24, [[0, '#97d1d5'], [0.45, '#214c66'], [1, '#071b2e']]);
    ctx.beginPath(); ctx.moveTo(x + width * 0.64, y + 6); ctx.lineTo(x + width * 0.83, y + 5); ctx.lineTo(x + width - 7, y + 23); ctx.lineTo(x + width * 0.56, y + 22); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = paint; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x + 8, floor - 20); ctx.lineTo(x + width - 4, floor - 20); ctx.stroke();
    glow(ctx, x + width - 1, y + 29, 17, '#ffe6ac66');
  } else if (item.type === 'conduit') {
    ctx.fillStyle = gradient(ctx, x, 0, x + width, 0, [[0, '#233847'], [0.3, '#9cabb0'], [0.54, '#d3d6c9'], [0.7, '#526979'], [1, '#152836']]);
    rounded(ctx, x + 4, y + 6, width - 8, height - 8, 12); ctx.fill();
    ctx.fillStyle = '#0a1c2b'; rounded(ctx, x + 12, y + 17, width - 24, height - 28, 5); ctx.fill();
    ctx.fillStyle = gradient(ctx, x, y + 20, x, floor - 16, [[0, '#ffe4aa'], [0.3, '#ff9e37'], [1, '#a34622']]);
    rounded(ctx, x + 17, y + 22, width - 34, height - 40, 4); ctx.fill();
    glow(ctx, x + width / 2, y + height / 2, 30, '#f58c272b');
    ctx.fillStyle = '#172b3b'; rounded(ctx, x, floor - 12, width, 13, 4); ctx.fill();
    ctx.fillStyle = '#d3d0b5'; ellipse(ctx, x + width / 2, y + 8, width * 0.35, 5); ctx.fill();
  } else {
    const depth = 10;
    ctx.fillStyle = '#637e8c'; ctx.beginPath(); ctx.moveTo(x, y + depth); ctx.lineTo(x + depth, y); ctx.lineTo(x + width, y); ctx.lineTo(x + width - depth, y + depth); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#172b3a'; ctx.beginPath(); ctx.moveTo(x + width - depth, y + depth); ctx.lineTo(x + width, y); ctx.lineTo(x + width, floor - depth); ctx.lineTo(x + width - depth, floor); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gradient(ctx, x, y, x + width, floor, [[0, '#8297a1'], [0.3, '#3d596e'], [1, '#172d3e']]);
    rounded(ctx, x, y + depth, width - depth, height - depth, 4); ctx.fill();
    ctx.strokeStyle = '#bdc9c77d'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = paint; ctx.fillRect(x + 7, y + depth + 5, 8, height - depth - 12); ctx.fillRect(x + width - depth - 14, y + depth + 5, 7, height - depth - 12);
    ctx.fillStyle = '#112838'; rounded(ctx, x + 19, y + height * 0.45, 14, 10, 2); ctx.fill();
    ctx.fillStyle = '#d9e3d6'; ctx.fillRect(x + 23, y + height * 0.45 + 3, 6, 2);
  }
}

function energy(ctx, item, floor, time, reducedMotion) {
  const y = floor - item.height + (reducedMotion ? 0 : Math.sin(time * 4 + (item.id || 0)) * 3);
  glow(ctx, item.x, y, 28, paint, 0.4);
  ctx.fillStyle = gradient(ctx, item.x - 12, y - 12, item.x + 12, y + 12, [[0, '#fff3cd'], [0.3, paint], [0.65, '#c47828'], [1, '#5e3c24']]);
  circle(ctx, item.x, y, 12); ctx.fill();
  ctx.strokeStyle = '#f7dc9a'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = '#fff7d8'; ctx.beginPath(); ctx.moveTo(item.x + 1, y - 8); ctx.lineTo(item.x - 5, y + 1); ctx.lineTo(item.x, y + 1); ctx.lineTo(item.x - 1, y + 8); ctx.lineTo(item.x + 6, y - 2); ctx.lineTo(item.x + 1, y - 2); ctx.closePath(); ctx.fill();
}

function preview(mode, width, height) {
  const state = mode === 'runner' ? createRunnerState({ width, height }) : createInvadersState({ width, height });
  const arena = arenaFor(state);
  if (mode === 'runner') {
    state.obstacles = [{ x: width * 0.62, width: 74, height: 55, type: 'rover' }, { x: width * 0.86, width: 48, height: 80, type: 'conduit' }];
    state.collectibles = [0.46, 0.53, 0.6].map((fraction, index) => ({ x: width * fraction, height: 112 + index % 2 * 24, id: index }));
  } else {
    state.player = width * 0.5;
    state.enemies = [0.24, 0.5, 0.76].map((fraction, index) => ({ x: width * fraction, y: Math.max(95, height * 0.2) + (index % 2) * 45, type: index === 1 ? 'heavy' : 'drone', phase: index, age: 0, label: INVADER_HAZARDS[index].label }));
    state.enemies.push({ x: width * 0.34, y: arena.playerY * 0.6, type: 'interceptor', phase: 1.2, age: 0, label: INVADER_HAZARDS[3].label });
    state.bullets = [{ x: width * 0.5, y: arena.playerY - 100 }, { x: width * 0.5, y: arena.playerY - 155 }];
  }
  return state;
}

// Follow high jumps in short arenas without changing their physical trajectory.
export function runnerCameraOffset(state, arena = arenaFor(state), options = {}) {
  return Math.max(0, 54 - haloGeometry(state, arena, options).bounds.top);
}

/** No clock, animation loop, or mutable simulation state is held by the renderer. */
export function createRenderer({ assetBase = new URL('./assets/', import.meta.url).href } = {}) {
  const images = { invaders: null, runner: null, trivia: null, halo: null };
  let ready = false;
  let loading;
  async function loadImages() {
    if (loading) return loading;
    loading = Promise.all(Object.keys(images).map(mode => new Promise(resolve => {
      if (typeof Image === 'undefined') { resolve(); return; }
      const image = new Image(); image.decoding = 'async';
      let fallback = false;
      image.onload = () => { images[mode] = mode === 'halo' ? { image, atlas: !fallback } : image; resolve(); };
      image.onerror = () => {
        if (mode === 'invaders') { resolve(); return; }
        if (!fallback) { fallback = true; image.src = new URL(mode === 'halo' ? 'halo-runner-idle.png' : `${mode}-world.png`, assetBase).href; }
        else resolve();
      };
      image.src = new URL(mode === 'halo' ? HALO_ATLAS.file : mode === 'invaders' ? INVADER_WORLD_ASSET : `${mode}-world.webp`, assetBase).href;
    }))).then(() => { ready = true; });
    return loading;
  }

  function render(ctx, state, options = {}) {
    const mode = options.mode || state?.kind || 'invaders';
    const width = options.width || state?.world?.width || 960;
    const height = options.height || state?.world?.height || 540;
    const scene = state || preview(mode, width, height);
    const arena = { ...arenaFor(scene), width, height };
    const time = Number.isFinite(scene.elapsed) ? scene.elapsed : options.time || 0;
    const reducedMotion = Boolean(options.reducedMotion);
    ctx.save();
    ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.clip();
    background(ctx, images[mode], arena, time, reducedMotion, mode);
    if (mode === 'runner') {
      ctx.save();
      ctx.translate(0, runnerCameraOffset(scene, arena, { reducedMotion }));
      terrain(ctx, arena, time, scene.speed || 330, reducedMotion);
      for (const item of scene.collectibles || []) {
        ctx.save(); ctx.translate(item.x, arena.floor - item.height); ctx.scale(arena.runnerScale, arena.runnerScale);
        energy(ctx, { ...item, x: 0, height: 0 }, 0, time, reducedMotion); ctx.restore();
      }
      for (const item of scene.obstacles || []) {
        ctx.save(); ctx.translate(item.x, arena.floor); ctx.scale(arena.runnerScale, arena.runnerScale);
        obstacle(ctx, { ...item, x: 0 }, 0); ctx.restore();
      }
      haloRunner(ctx, scene, arena, time, reducedMotion, images.halo);
      effects(ctx, scene.effects, reducedMotion);
      ctx.restore();
    } else if (mode === 'trivia') {
      glow(ctx, width * 0.5, height * 0.6, width * 0.4, '#ec9b3530');
    } else {
      for (const enemy of scene.enemies || []) drone(ctx, enemy, height, time, reducedMotion);
      bossThreat(ctx, scene, arena, options);
      for (const shot of scene.hostileShots || []) hostileProjectile(ctx, shot);
      for (const bullet of scene.bullets || []) projectile(ctx, bullet, reducedMotion);
      for (const missile of scene.missiles || []) projectile(ctx, missile, reducedMotion);
      for (const item of scene.pickups || []) shieldPickup(ctx, item, time, reducedMotion);
      const volley=volleyVisualPose(scene,{reducedMotion});
      supportCraft(ctx, scene, arena, time, reducedMotion, options.shipAppearance);
      spacecraft(ctx, scene.player, arena.playerY, scene.bank || 0, time, reducedMotion, scene.shield, scene.damageCooldown, scene.weaponLevel, scene.weaponFamily,volley.recoil, options.shipAppearance);
      muzzleGlow(ctx,scene,arena,volley);
      if (scene.missilePairs > 0) {
        ctx.save(); ctx.fillStyle = '#bfd2d4'; ctx.strokeStyle = paint; ctx.lineWidth = 2;
        for (const side of [-1, 1]) { rounded(ctx, scene.player + side * 40 - 5, arena.playerY - 15, 10, 25, 4); ctx.fill(); ctx.stroke(); }
        ctx.restore();
      }
    }
    if (mode === 'invaders') invaderEffects(ctx, scene.effects, reducedMotion);
    else if (mode !== 'runner') effects(ctx, scene.effects, reducedMotion);
    vignette(ctx, width, height);
    if (mode === 'invaders') {
      // Warnings remain above friendly volleys and decorative completion paper.
      enemyTelegraphs(ctx, scene, arena, options);
      hazardImpact(ctx, scene, arena, reducedMotion);
    }
    if (scene.phase === 'intermission') {
      ctx.fillStyle = '#f6dbad'; ctx.textAlign = 'center'; ctx.font = '700 24px system-ui, sans-serif';
      ctx.fillText(`NICE WORK · WAVE ${scene.wave} CLEAR`, width / 2, height * 0.32);
      if (scene.lastBoss) { ctx.font = '600 18px system-ui, sans-serif'; ctx.fillText(`Backlog cleared · +${scene.bossBonus}`, width / 2, height * 0.32 + 29); }
    }
    ctx.restore();
  }
  return { render, loadImages, get imagesReady() { return ready; } };
}
