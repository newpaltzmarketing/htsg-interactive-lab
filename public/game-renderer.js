import { arenaFor, createInvadersState, createRunnerState } from './game-engine.js';
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

function spacecraft(ctx, x, y, bank, time, reducedMotion, shield, damageCooldown = 0) {
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
  if (damageCooldown > 0) { ctx.strokeStyle = '#ffc58e99'; ctx.lineWidth = 2; ellipse(ctx, 0, -3, 58, 65); ctx.stroke(); }
  ctx.restore();
}

function drone(ctx, enemy, height, time, reducedMotion) {
  const progress = clamp((enemy.y + 30) / height, 0, 1);
  const scale = (enemy.type === 'heavy' ? 1.24 : 1) * (0.7 + progress * 0.32);
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
  ctx.fillStyle = gradient(ctx, bullet.x, bullet.y - 8, bullet.x, bullet.y + tail, [[0, beamCore], [0.25, paint], [1, 'transparent']]);
  rounded(ctx, bullet.x - 3, bullet.y - 9, 6, tail, 3); ctx.fill();
  glow(ctx, bullet.x, bullet.y, 13, paint, 0.4);
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
    if (item.kind === 'wave') continue;
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

function limb(ctx, x1, y1, x2, y2, width, color) {
  ctx.strokeStyle = '#101e29'; ctx.lineWidth = width + 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function astronaut(ctx, state, arena, time, reducedMotion) {
  const x = arena.runnerX, y = arena.floor - state.height;
  ctx.fillStyle = `rgba(0,0,0,${0.3 * Math.max(0.2, 1 - state.height / 300)})`;
  ellipse(ctx, x + 4, arena.floor + 2, 31 * arena.runnerScale, 7 * arena.runnerScale); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.scale(arena.runnerScale, arena.runnerScale);
  const airborne = state.height > 1;
  const stride = airborne ? 0.55 : reducedMotion ? 0.15 : Math.sin(time * 13) * 0.75;
  if (state.boost > 0) { glow(ctx, 0, -38, 79, '#ffaf4238'); ctx.strokeStyle = '#ffcf8599'; ctx.lineWidth = 2; ellipse(ctx, 0, -40, 38, 52); ctx.stroke(); }
  if (airborne && state.jumps > 1) thruster(ctx, -18, -23, 39, time, reducedMotion, 5);
  ctx.fillStyle = gradient(ctx, -28, -51, -10, -18, [[0, '#8d9eaa'], [0.5, '#233947'], [1, '#101f2c']]);
  rounded(ctx, -26, -53, 17, 34, 6); ctx.fill();
  ctx.fillStyle = paint; rounded(ctx, -28, -45, 4, 14, 2); ctx.fill();
  // Far-side arm and legs stay darker, giving the silhouette clear depth.
  limb(ctx, -8, -43, -16 - stride * 10, -27, 8, '#9c4b24');
  const backKneeX = -8 - stride * 12, frontKneeX = 10 + stride * 12;
  limb(ctx, -5, -24, backKneeX, -12, 11, '#a45428');
  limb(ctx, backKneeX, -12, -9 + stride * 15, -2 - (airborne ? 9 : 0), 9, '#88979c');
  ctx.fillStyle = '#172735'; rounded(ctx, -16 + stride * 15, -5 - (airborne ? 9 : 0), 21, 8, 4); ctx.fill();
  limb(ctx, 7, -23, frontKneeX, -13 - (airborne ? 5 : 0), 12, paint);
  limb(ctx, frontKneeX, -13 - (airborne ? 5 : 0), 10 - stride * 15, -2 - (airborne ? 4 : 0), 10, '#b9c4c3');
  ctx.fillStyle = gradient(ctx, 0, -6, 0, 4, [[0, '#637681'], [1, '#142331']]); rounded(ctx, 3 - stride * 15, -5 - (airborne ? 4 : 0), 23, 8, 4); ctx.fill();
  ctx.fillStyle = gradient(ctx, -17, -54, 18, -24, [[0, '#ffbf60'], [0.42, paint], [0.78, '#b34a20'], [1, '#723522']]);
  ctx.strokeStyle = '#172634'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-11, -55); ctx.quadraticCurveTo(3, -60, 16, -49); ctx.lineTo(17, -29); ctx.quadraticCurveTo(2, -19, -14, -27); ctx.lineTo(-17, -45); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = '#ffe0a8a6'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-11, -49); ctx.lineTo(-8, -33); ctx.stroke();
  ctx.fillStyle = '#e9e7d6'; rounded(ctx, -2, -48, 12, 12, 2); ctx.fill();
  ctx.fillStyle = '#c15c24'; ctx.fillRect(1, -45, 2, 7); ctx.fillRect(6, -45, 2, 7); ctx.fillRect(3, -42, 3, 2);
  limb(ctx, 12, -47, 21 + stride * 6, -34, 10, paint);
  limb(ctx, 21 + stride * 6, -34, 31, -37 + stride * 4, 8, '#a6b5bc');
  ctx.fillStyle = paint; ellipse(ctx, 33, -36 + stride * 4, 6, 5); ctx.fill();
  const helmet = gradient(ctx, -10, -88, 22, -51, [[0, '#fff6db'], [0.28, '#e1e8df'], [0.66, '#98aab4'], [1, '#374c60']]);
  ctx.fillStyle = helmet; ctx.strokeStyle = '#223b4b'; ctx.lineWidth = 2; ellipse(ctx, 5, -70, 20, 21); ctx.fill(); ctx.stroke();
  ctx.fillStyle = gradient(ctx, 5, -84, 23, -56, [[0, '#4f91aa'], [0.4, '#092f48'], [0.85, '#091828'], [1, '#d69245']]);
  ctx.beginPath(); ctx.ellipse(12, -70, 12, 14, 0.12, -Math.PI * 0.55, Math.PI * 0.65); ctx.quadraticCurveTo(-2, -65, 1, -78); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e2fbffb3'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(9, -80); ctx.quadraticCurveTo(17, -80, 20, -72); ctx.stroke();
  ctx.fillStyle = paint; rounded(ctx, -9, -56, 25, 5, 2); ctx.fill();
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
    state.enemies = [0.24, 0.5, 0.76].map((fraction, index) => ({ x: width * fraction, y: Math.max(95, height * 0.2) + (index % 2) * 45, type: index === 1 ? 'heavy' : 'drone', phase: index, age: 0 }));
    state.enemies.push({ x: width * 0.34, y: arena.playerY * 0.6, type: 'interceptor', phase: 1.2, age: 0 });
    state.bullets = [{ x: width * 0.5, y: arena.playerY - 100 }, { x: width * 0.5, y: arena.playerY - 155 }];
  }
  return state;
}

// Follow high jumps in short arenas without changing their physical trajectory.
export function runnerCameraOffset(state, arena = arenaFor(state)) {
  return Math.max(0, (state?.height || 0) - (arena.floor - (92 * (arena.runnerScale || 1) + 54)));
}

/** No clock, animation loop, or mutable simulation state is held by the renderer. */
export function createRenderer({ assetBase = new URL('./assets/', import.meta.url).href } = {}) {
  const images = { invaders: null, runner: null, trivia: null };
  let ready = false;
  let loading;
  async function loadImages() {
    if (loading) return loading;
    loading = Promise.all(Object.keys(images).map(mode => new Promise(resolve => {
      if (typeof Image === 'undefined') { resolve(); return; }
      const image = new Image(); image.decoding = 'async';
      let fallback = false;
      image.onload = () => { images[mode] = image; resolve(); };
      image.onerror = () => {
        if (!fallback) { fallback = true; image.src = new URL(`${mode}-world.png`, assetBase).href; }
        else resolve();
      };
      image.src = new URL(`${mode}-world.webp`, assetBase).href;
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
      ctx.translate(0, runnerCameraOffset(scene, arena));
      terrain(ctx, arena, time, scene.speed || 330, reducedMotion);
      for (const item of scene.collectibles || []) {
        ctx.save(); ctx.translate(item.x, arena.floor - item.height); ctx.scale(arena.runnerScale, arena.runnerScale);
        energy(ctx, { ...item, x: 0, height: 0 }, 0, time, reducedMotion); ctx.restore();
      }
      for (const item of scene.obstacles || []) {
        ctx.save(); ctx.translate(item.x, arena.floor); ctx.scale(arena.runnerScale, arena.runnerScale);
        obstacle(ctx, { ...item, x: 0 }, 0); ctx.restore();
      }
      astronaut(ctx, scene, arena, time, reducedMotion);
      effects(ctx, scene.effects, reducedMotion);
      ctx.restore();
    } else if (mode === 'trivia') {
      glow(ctx, width * 0.5, height * 0.6, width * 0.4, '#ec9b3530');
    } else {
      for (const enemy of scene.enemies || []) drone(ctx, enemy, height, time, reducedMotion);
      for (const bullet of scene.bullets || []) projectile(ctx, bullet, reducedMotion);
      for (const item of scene.pickups || []) shieldPickup(ctx, item, time, reducedMotion);
      spacecraft(ctx, scene.player, arena.playerY, scene.bank || 0, time, reducedMotion, scene.shield, scene.damageCooldown);
    }
    if (mode !== 'runner') effects(ctx, scene.effects, reducedMotion);
    vignette(ctx, width, height);
    if (scene.phase === 'intermission') {
      ctx.fillStyle = '#f6dbad'; ctx.textAlign = 'center'; ctx.font = '700 24px system-ui, sans-serif';
      ctx.fillText(`WAVE ${scene.wave} CLEAR`, width / 2, height * 0.32);
    }
    ctx.restore();
  }
  return { render, loadImages, get imagesReady() { return ready; } };
}
