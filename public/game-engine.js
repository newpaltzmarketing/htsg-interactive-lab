// Deterministic game rules. Rendering, browser events, and clocks live in game.js.
export const ARENA = Object.freeze({ width: 960, height: 540, floor: 454 });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createInputState() {
  return { left: new Set(), right: new Set(), action: new Set() };
}

export function setInput(input, action, source, pressed) {
  if (!input[action]) return;
  if (pressed) input[action].add(source);
  else input[action].delete(source);
}

export function getInput(input) {
  return Object.fromEntries(Object.entries(input).map(([key, sources]) => [key, sources.size > 0]));
}

export function clearInput(input) {
  Object.values(input).forEach(sources => sources.clear());
}

export function createInvadersState() {
  return { kind: 'invaders', score: 0, lives: 3, player: ARENA.width / 2, bullets: [], enemies: [], spawnIn: 0.8, cooldown: 0, ended: false };
}

export function fireInvaders(state) {
  if (state.ended || state.cooldown > 0) return false;
  state.bullets.push({ x: state.player, y: 461 });
  state.cooldown = 0.19;
  return true;
}

export function stepInvaders(state, input, seconds, random = Math.random) {
  if (state.ended || seconds <= 0) return state;
  const dt = Math.min(seconds, 0.05);
  state.player = clamp(state.player + ((input.right ? 1 : 0) - (input.left ? 1 : 0)) * 430 * dt, 32, ARENA.width - 32);
  state.cooldown = Math.max(0, state.cooldown - dt);
  if (input.action) fireInvaders(state);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    state.enemies.push({ x: 40 + random() * (ARENA.width - 80), y: -26 });
    state.spawnIn += Math.max(0.48, 1.1 - state.score / 700);
  }
  state.bullets.forEach(bullet => { bullet.previousY = bullet.y; bullet.y -= 720 * dt; });
  state.enemies.forEach(enemy => { enemy.y += Math.min(245, 104 + state.score * 0.3) * dt; });
  // Resolve hits first, so a last-moment shot can save a life.
  for (let enemyIndex = state.enemies.length - 1; enemyIndex >= 0; enemyIndex -= 1) {
    const enemy = state.enemies[enemyIndex];
    const bulletIndex = state.bullets.findIndex(bullet => (
      Math.abs(enemy.x - bullet.x) < 34 && bullet.y < enemy.y + 23 && bullet.previousY > enemy.y - 23
    ));
    if (bulletIndex !== -1) {
      state.enemies.splice(enemyIndex, 1);
      state.bullets.splice(bulletIndex, 1);
      state.score += 10;
      continue;
    }
    const hitsPlayer = Math.abs(enemy.x - state.player) < 48 && enemy.y > 447 && enemy.y < 518;
    if (enemy.y > 518 || hitsPlayer) {
      state.enemies.splice(enemyIndex, 1);
      state.lives = Math.max(0, state.lives - 1);
      if (state.lives === 0) state.ended = true;
    }
  }
  state.bullets = state.bullets.filter(bullet => bullet.y > -24);
  return state;
}

export function createRunnerState() {
  return { kind: 'runner', score: 0, height: 0, velocity: 0, obstacles: [], spawnIn: 1.45, elapsed: 0, ended: false };
}

export function jumpRunner(state) {
  if (state.ended || state.height > 0 || state.velocity > 0) return false;
  state.velocity = 670;
  return true;
}

export function stepRunner(state, seconds, random = Math.random) {
  if (state.ended || seconds <= 0) return state;
  const dt = Math.min(seconds, 0.05);
  state.elapsed += dt;
  state.height = Math.max(0, state.height + state.velocity * dt - 0.5 * 1720 * dt * dt);
  state.velocity = state.height > 0 ? state.velocity - 1720 * dt : 0;
  const speed = Math.min(460, 330 + state.elapsed * 1.8);
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    state.obstacles.push({ x: ARENA.width + 24, width: 42, height: 44 + random() * 22 });
    state.spawnIn += 1.22 + random() * 0.55;
  }
  state.obstacles.forEach(obstacle => { obstacle.x -= speed * dt; });
  state.obstacles = state.obstacles.filter(obstacle => obstacle.x + obstacle.width > -10);
  state.score += speed * dt / 20;
  // A small inset gives the visible player a forgiving collision box.
  state.ended = state.obstacles.some(obstacle => (
    obstacle.x < 195 && obstacle.x + obstacle.width > 159 && state.height + 5 < obstacle.height
  ));
  return state;
}

export function gradeAnswer(question, selectedIndex) {
  return Number.isInteger(selectedIndex) && selectedIndex === question.correct;
}
