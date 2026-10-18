import { arenaFor, createInvadersState, createRunnerState, INVADER_HAZARDS, INVADER_THREAT_SCALE, invaderWeapon } from './game-engine.js';
import { brand } from './brand.js';

const TAU = Math.PI * 2;
const paint = brand.canvas?.player || '#f78c1a';
const droneAccent = brand.canvas?.obstacle || '#f43618';
const beamCore = brand.canvas?.projectile || '#ffffff';
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

function background(ctx, image, arena, time, reducedMotion, mode) {
  const { width, height, floor } = arena;
  if (image?.complete && image.naturalWidth) {
    ctx.fillStyle = '#030a14'; ctx.fillRect(0, 0, width, height);
    cover(ctx, image, width, height);
  } else fallbackSpace(ctx, width, height);
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

function spacecraft(ctx, x, y, bank, time, reducedMotion, shield, damageCooldown = 0, weaponLevel = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(bank * 0.16);
  glow(ctx, 0, 17, 85, paint, 0.14);
  const pulse = reducedMotion ? 0 : Math.sin(time * 4) * 4;
  if (shield > 0) {
    glow(ctx, 0, -3, 80, '#6bd8ed20');
    ctx.strokeStyle = '#92eaff98'; ctx.lineWidth = 2.5; ellipse(ctx, 0, -5, 54 + pulse, 68 + pulse); ctx.stroke();
    ctx.strokeStyle = '#d8faff35'; ctx.lineWidth = 1; ellipse(ctx, 0, -5, 61 + pulse, 75 + pulse); ctx.stroke();
  }
  thruster(ctx, -24, 31, 49, time, reducedMotion, 7);
  thruster(ctx, 24, 31, 49, time + 0.7, reducedMotion, 7);
  // Swept wings with a machined leading edge and shadowed underside.
  ctx.fillStyle = gradient(ctx, -48, -12, 45, 36, [[0, '#596e7d'], [0.26, '#aab8be'], [0.5, '#334553'], [0.74, '#c6d0cd'], [1, '#172936']]);
  ctx.strokeStyle = '#0c1822'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -27); ctx.bezierCurveTo(-12, -18, -29, 7, -49, 26); ctx.lineTo(-43, 39); ctx.lineTo(-10, 26); ctx.lineTo(0, 15); ctx.lineTo(10, 26); ctx.lineTo(43, 39); ctx.lineTo(49, 26); ctx.bezierCurveTo(29, 7, 12, -18, 0, -27); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#e6d7b999'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-42, 27); ctx.lineTo(-12, -8); ctx.moveTo(42, 27); ctx.lineTo(12, -8); ctx.stroke();
  ctx.fillStyle = paint;
  for (const direction of [-1, 1]) {
    ctx.beginPath(); ctx.moveTo(direction * 16, -2); ctx.lineTo(direction * 40, 27); ctx.lineTo(direction * 29, 24); ctx.lineTo(direction * 13, 8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = gradient(ctx, direction * 24 - 8, 0, direction * 24 + 8, 0, [[0, '#152b3a'], [0.5, '#8c9da3'], [1, '#243a48']]);
    rounded(ctx, direction * 24 - 8, -9, 16, 43, 7); ctx.fill();
    ctx.fillStyle = paint;
  }
  const hull = gradient(ctx, -19, 0, 20, 0, [[0, '#6e2b15'], [0.18, paint], [0.43, '#ffb84f'], [0.55, '#ffd79a'], [0.7, paint], [1, '#8b3719']]);
  ctx.fillStyle = hull; ctx.strokeStyle = '#301a15'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, -55); ctx.bezierCurveTo(10, -43, 21, -3, 17, 26); ctx.lineTo(8, 38); ctx.lineTo(-8, 38); ctx.lineTo(-17, 26); ctx.bezierCurveTo(-21, -3, -10, -43, 0, -55); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#ffe4ad9c'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-2, -45); ctx.quadraticCurveTo(-12, -17, -13, 17); ctx.stroke();
  ctx.fillStyle = gradient(ctx, -7, -28, 10, 8, [[0, '#9fd8ec'], [0.34, '#295970'], [1, '#061828']]);
  ctx.strokeStyle = '#3c2620'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -29); ctx.bezierCurveTo(9, -21, 11, -6, 7, 7); ctx.quadraticCurveTo(0, 12, -7, 7); ctx.bezierCurveTo(-11, -6, -9, -21, 0, -29); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#ddf8ffaf'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-2, -23); ctx.quadraticCurveTo(-6, -9, -5, 1); ctx.stroke();
  ctx.fillStyle = '#fff2cf'; ctx.fillRect(-5, 18, 2, 9); ctx.fillRect(3, 18, 2, 9); ctx.fillRect(-3, 21, 6, 2);
  ctx.fillStyle = '#213543'; for (const dx of [-12, 12]) { circle(ctx, dx, 14, 1.4); ctx.fill(); }
  if (weaponLevel > 1) {
    for (const shot of invaderWeapon({ weaponLevel }).pattern) {
      ctx.fillStyle = '#9dabb0'; rounded(ctx, shot.offset - 3.5, -36, 7, 15, 2); ctx.fill();
      ctx.fillStyle = beamCore; rounded(ctx, shot.offset - 2.5, -39, 5, 5, 2); ctx.fill();
      glow(ctx, shot.offset, -37, 8, paint, 0.35);
    }
  }
  if (damageCooldown > 0) { ctx.strokeStyle = '#ffc58e99'; ctx.lineWidth = 2; ellipse(ctx, 0, -3, 58, 65); ctx.stroke(); }
  ctx.restore();
}

function drone(ctx, enemy, height, time, reducedMotion) {
  const progress = clamp((enemy.y + 30) / height, 0, 1);
  const scale = (enemy.scale || INVADER_THREAT_SCALE) * (enemy.type === 'heavy' ? 1.24 : 1) * (0.7 + progress * 0.32);
  ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.scale(scale, scale);
  ctx.rotate(reducedMotion ? 0 : Math.sin((enemy.age || 0) * 1.6 + (enemy.phase || 0)) * 0.1);
  glow(ctx, 0, 4, 50, droneAccent, 0.14);
  ctx.fillStyle = gradient(ctx, -38, -22, 38, 20, [[0, '#152633'], [0.26, '#647985'], [0.46, '#acb8b8'], [0.55, '#3a4e5d'], [1, '#112532']]);
  ctx.strokeStyle = '#080e16'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-11, -22); ctx.lineTo(-34, -11); ctx.quadraticCurveTo(-43, -3, -34, 12); ctx.lineTo(-15, 17); ctx.lineTo(-9, 27); ctx.lineTo(9, 27); ctx.lineTo(15, 17); ctx.lineTo(34, 12); ctx.quadraticCurveTo(43, -3, 34, -11); ctx.lineTo(11, -22); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#d0d6c66b'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-30, -8); ctx.lineTo(-17, -14); ctx.moveTo(30, -8); ctx.lineTo(17, -14); ctx.stroke();
  for (const direction of [-1, 1]) {
    ctx.fillStyle = '#1b2b38'; ellipse(ctx, direction * 26, 2, 10, 14); ctx.fill();
    ctx.strokeStyle = '#81939a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = droneAccent; ellipse(ctx, direction * 26, 4, 5, 8); ctx.fill();
    ctx.fillStyle = '#ffe0b8'; ellipse(ctx, direction * 26, 6, 2, 4); ctx.fill();
  }
  ctx.fillStyle = gradient(ctx, -11, -12, 11, 17, [[0, '#9e4b2e'], [0.45, droneAccent], [1, '#5c2727']]);
  ellipse(ctx, 0, 0, 12, 18); ctx.fill();
  ctx.fillStyle = '#071625'; ellipse(ctx, 0, -4, 8, 9); ctx.fill();
  const core = reducedMotion ? 1 : 0.86 + Math.sin(time * 6 + enemy.x) * 0.14;
  glow(ctx, 0, -3, 16, droneAccent, core * 0.7);
  ctx.fillStyle = '#ffe7ba'; ellipse(ctx, 0, -3, 4, 3); ctx.fill();
  if (enemy.maxHealth > 1 && enemy.health === 1) {
    ctx.strokeStyle = '#ffb56a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(-8, -14); ctx.lineTo(7, 5); ctx.lineTo(1, 11); ctx.stroke();
  }
  ctx.restore();
}

function projectile(ctx, bullet, reducedMotion) {
  const tail = reducedMotion ? 22 : 43;
  ctx.save(); ctx.translate(bullet.x, bullet.y); ctx.rotate(Math.atan2(bullet.vx || 0, 620));
  ctx.fillStyle = gradient(ctx, 0, -8, 0, tail, [[0, beamCore], [0.25, paint], [1, 'transparent']]);
  rounded(ctx, -3, -9, 6, tail, 3); ctx.fill();
  glow(ctx, 0, 0, 13, paint, 0.4); ctx.restore();
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

function shieldPickup(ctx, item, time, reducedMotion) {
  const bob = reducedMotion ? 0 : Math.sin(time * 3 + item.x) * 3;
  ctx.save(); ctx.translate(item.x, item.y + bob);
  glow(ctx, 0, 0, 35, '#83defc60');
  ctx.fillStyle = gradient(ctx, -15, -18, 15, 18, [[0, '#aee7e6'], [0.45, '#397891'], [1, '#092a46']]);
  ctx.strokeStyle = '#b9f2f4'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, -11); ctx.lineTo(12, 4); ctx.quadraticCurveTo(8, 13, 0, 19); ctx.quadraticCurveTo(-8, 13, -12, 4); ctx.lineTo(-14, -11); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#f7ffea'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(-1, 5); ctx.lineTo(7, -7); ctx.stroke();
  ctx.restore();
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
        if (!fallback) { fallback = true; image.src = new URL(mode === 'halo' ? 'halo-runner-idle.png' : `${mode}-world.png`, assetBase).href; }
        else resolve();
      };
      image.src = new URL(mode === 'halo' ? HALO_ATLAS.file : `${mode}-world.webp`, assetBase).href;
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
      for (const bullet of scene.bullets || []) projectile(ctx, bullet, reducedMotion);
      for (const item of scene.pickups || []) shieldPickup(ctx, item, time, reducedMotion);
      spacecraft(ctx, scene.player, arena.playerY, scene.bank || 0, time, reducedMotion, scene.shield, scene.damageCooldown, scene.weaponLevel);
    }
    if (mode !== 'runner') effects(ctx, scene.effects, reducedMotion);
    vignette(ctx, width, height);
    if (mode === 'invaders') {
      hazardLabels(ctx, scene, arena, options);
      hazardImpact(ctx, scene, arena, reducedMotion);
    }
    if (scene.phase === 'intermission') {
      ctx.fillStyle = '#f6dbad'; ctx.textAlign = 'center'; ctx.font = '700 24px system-ui, sans-serif';
      ctx.fillText(`WAVE ${scene.wave} CLEAR`, width / 2, height * 0.32);
    }
    ctx.restore();
  }
  return { render, loadImages, get imagesReady() { return ready; } };
}
