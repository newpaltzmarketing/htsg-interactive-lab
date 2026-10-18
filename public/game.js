import { brand } from './brand.js';
import { readPersonalBest, savePersonalBest } from './score-store.js';
import { questionsForRound } from './questions.js';
import {
  ARENA, arenaFor, createInputState, setInput, getInput, clearInput,
  createInvadersState, stepInvaders, fireInvaders, invaderWeapon,
  createRunnerState, jumpRunner, stepRunner, gradeAnswer, resizeGame,
} from './game-engine.js';
import { createRenderer } from './game-renderer.js';

const games = {
  invaders: {
    title: 'Agency Invaders', headline: 'Clear the orbit.',
    instructions: 'Scope creep, missed deadlines, budget overruns. Clear the project chaos before it costs you a life.',
    help: 'Drag anywhere in the game to fly and fire. The ship follows your movement without jumping under your finger. Lift to stop firing. Keyboard: arrows or W / A / S / D to fly; Space to fire. P or Escape pauses.',
    depth: 'Defeat 3 hazards for Twin streams and 7 for Quad spread. Later waves bring weaving and armored threats; every fifth wave is a boss. Watch the warning marks and move before its shots arrive. Your weapon stays upgraded after a hit. Shields block one impact. Your personal best stays on this device.',
    hint: 'Drag anywhere to fly and fire.', action: 'Fire',
  },
  runner: {
    title: 'Launch Runner', headline: 'Find your next horizon.',
    instructions: 'Take Halo across the launch complex. Clear the barriers, collect energy, and give that cape some air.',
    help: 'Tap the arena or swipe up to jump. Tap again in the air for a double jump. The Jump button works too. Keyboard: Space, W, or up arrow. Release before jumping again. P or Escape pauses.',
    depth: 'Collect five glowing energy cells for a brief protective boost. Each cell also earns a bonus. The route gets faster as you travel; use your second jump to clear a late obstacle or reach a higher cell.',
    hint: 'Tap or swipe up to jump. Tap again for a double jump.', action: 'Jump',
  },
  trivia: {
    title: 'Trivia Challenge', headline: 'A little knowledge. A better launch.',
    instructions: 'Five decisions per round. Explore digital experiences, build a streak, and learn why each answer works.',
    help: 'Tap an answer, read the explanation, then continue. Use Tab and Enter on a keyboard. Each new round has five questions; three different rounds cover strategy, design, and trust.',
    depth: 'Build a correct-answer streak and review what you learned at the end. There is no timer, so take the time you need.',
    hint: 'Choose an answer to begin.',
  },
};
const requestedMode = new URLSearchParams(location.search).get('game');
const mode = Object.hasOwn(games, requestedMode) ? requestedMode : 'invaders';
const game = games[mode];
const byId = id => document.getElementById(id);
const canvas = byId('canvas');
const context = canvas.getContext('2d');
const status = byId('status');
const controls = byId('controls');
const start = byId('start');
const pause = byId('pause');
const announcement = byId('announcement');
const quiz = byId('quiz');
const shell = byId('game-shell');
const overlay = byId('arena-overlay');
const picker = byId('game-picker');
const helpPanel = byId('help-panel');
const impactFeedback = byId('impact-feedback');
const renderer = createRenderer();
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const input = createInputState();
const arenaPointers = new Map();
let state;
let playing = false;
let paused = false;
let frameId = null;
let lastFrame = 0;
let accumulator = 0;
let world = { width: ARENA.width, height: ARENA.height };
let lastLives = 3;
let lastWeaponLevel = 1;
let steeringPointer = null;
let targetX;
let targetY;
let personalBest = mode === 'invaders' ? readPersonalBest() : 0;
let newPersonalBest = false;
let fullscreenBusy = false;

document.body.dataset.game = mode;
byId('title').textContent = game.title;
byId('instructions').textContent = game.instructions;
byId('game-help').textContent = game.help;
byId('game-depth').textContent = game.depth;
byId('overlay-title').textContent = game.headline;
byId('overlay-hint').textContent = game.hint;
byId('touch-hint').textContent = mode === 'runner' ? 'Tap or swipe up · double jump' : 'Arrows / WASD · Space to fire';
document.title = `${game.title} | ${brand.labName}`;
status.setAttribute('aria-live', 'off');
const modes = Object.keys(games);
const modeIndex = modes.indexOf(mode);
for (const [id, offset, label] of [['previous-game', -1, 'Previous'], ['next-game', 1, 'Next']]) {
  const nextMode = modes[(modeIndex + offset + modes.length) % modes.length];
  byId(id).href = `play.html?game=${nextMode}`;
  byId(id).setAttribute('aria-label', `${label} game: ${games[nextMode].title}`);
}
document.querySelectorAll('.game-option').forEach(link => {
  if (new URL(link.href).searchParams.get('game') === mode) link.setAttribute('aria-current', 'page');
});

function announce(message) { announcement.textContent = message; }
function setStatus(message) { if (status.textContent !== message) status.textContent = message; }
function scoreText() {
  return mode === 'runner' ? `Distance: ${Math.floor(state.score)} m` : `Score: ${state.score} · Lives: ${state.lives} of 3`;
}
function syncStatus() {
  byId('arcade-hud').hidden = !state;
  const message = state ? scoreText() : 'Ready to play';
  setStatus(paused ? `Paused · ${message}` : state?.ended ? `Game over · ${message}` : message);
  const detail = !state ? '' : mode === 'invaders'
    ? `Wave ${state.wave || 1} · Weapon ${state.weaponLevel || 1}: ${invaderWeapon(state).name}${state.weaponUpgradeTime > 0 ? ' · Upgraded!' : ''}${state.boss ? ` · ${state.boss.label}` : state.combo > 1 ? ` · ${state.combo} hit streak` : ''}${state.shield > 0 ? ' · Shield active' : ''}`
    : `${state.boost > 0 ? `Boost · ${state.boost.toFixed(1)}s` : `Energy ${state.energy || 0}/5`}${state.bonus ? ` · +${state.bonus} bonus` : ''}`;
  if (byId('mission-detail').textContent !== detail) byId('mission-detail').textContent = detail;
  const impact = mode === 'invaders' && state?.lastHazardTime > 0;
  impactFeedback.hidden = !impact;
  if (impact) {
    const text = state.lastHazardBlocked ? `Shield blocked ${state.lastHazard}` : `${state.lastHazard} · 1 life lost`;
    if (impactFeedback.textContent !== text) impactFeedback.textContent = text;
    impactFeedback.dataset.kind = state.lastHazardBlocked ? 'shield' : 'damage';
  }
  const notices = [];
  if (state && mode === 'invaders' && state.lives !== lastLives) {
    lastLives = state.lives;
    if (!state.ended) notices.push(`${state.lastHazard ? `${state.lastHazard} cost a life. ` : ''}${state.lives} ${state.lives === 1 ? 'life' : 'lives'} remaining.`);
  }
  if (state && mode === 'invaders' && state.weaponLevel > lastWeaponLevel) {
    lastWeaponLevel = state.weaponLevel;
    if (!state.ended) notices.push(`Weapon upgraded to ${invaderWeapon(state).name}. This upgrade stays with you for the rest of this run.`);
  }
  if (notices.length) announce(notices.join(' '));
}
function syncInputButtons() {
  const held = getInput(input);
  for (const key of ['left', 'right', 'action']) byId(key).setAttribute('aria-pressed', String(held[key]));
}
function clearControls() {
  clearInput(input);
  targetX = undefined;
  targetY = undefined;
  steeringPointer = null;
  arenaPointers.clear();
  for (const element of [canvas, ...controls.querySelectorAll('button')]) {
    // Release capture only for pointers held by this element; releases also clear their source.
    for (const pointerId of activePointers.get(element) || []) {
      if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
    }
  }
  activePointers.clear();
  syncInputButtons();
}
const activePointers = new Map();
function capture(element, pointerId) {
  element.setPointerCapture(pointerId);
  if (!activePointers.has(element)) activePointers.set(element, new Set());
  activePointers.get(element).add(pointerId);
}
function releaseCapture(element, pointerId) {
  activePointers.get(element)?.delete(pointerId);
  if (element.hasPointerCapture(pointerId)) element.releasePointerCapture(pointerId);
}
function stopFrame() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  lastFrame = 0;
  accumulator = 0;
}
function scheduleFrame() { if (playing && !paused && frameId === null) frameId = requestAnimationFrame(frame); }
function resizeCanvas() {
  if (mode === 'trivia') return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const next = { width: ARENA.width, height: ARENA.width * rect.height / rect.width };
  if (state && (next.width !== world.width || Math.abs(next.height - world.height) > .1)) resizeGame(state, next.width, next.height);
  world = next;
  const ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * ratio));
  canvas.height = Math.max(1, Math.round(rect.height * ratio));
  // A rotation changes the coordinate system; require a fresh gesture rather than keeping stale targets.
  clearControls();
  render();
}
function render() {
  if (mode === 'trivia') return;
  context.setTransform(canvas.width / world.width, 0, 0, canvas.height / world.height, 0, 0);
  const rect = canvas.getBoundingClientRect();
  const reservedRects = mode === 'invaders' && rect.width && rect.height
    ? [status, byId('mission-detail'), impactFeedback].filter(element => element.getClientRects().length).map(element => {
      const box = element.getBoundingClientRect();
      return { x: (box.left - rect.left - 4) * world.width / rect.width, y: (box.top - rect.top - 4) * world.height / rect.height,
        width: (box.width + 8) * world.width / rect.width, height: (box.height + 8) * world.height / rect.height };
    }) : [];
  renderer.render(context, state, { ...world, cssWidth: rect.width, cssHeight: rect.height, reservedRects, mode, time: state?.elapsed || 0, reducedMotion: reducedMotion.matches });
}
function syncOverlay() {
  overlay.hidden = !!state && !paused && !state.ended;
  if (overlay.hidden) return;
  const ended = state?.ended;
  byId('overlay-title').textContent = ended ? (mode === 'runner' ? 'One more launch?' : 'Flight complete.') : paused ? 'Take a breath.' : game.headline;
  byId('instructions').textContent = ended
    ? (mode === 'runner' ? `${Math.floor(state.score)} meters traveled. ${state.collected || 0} energy cells collected. Your next run starts here.` : `${state.lastHazard ? `${state.lastHazard} broke through. ` : ''}${state.score} points. Wave ${state.wave || 1} reached. Ready to clear the project chaos?`)
    : paused ? 'Your run is right where you left it.' : game.instructions;
  byId('overlay-action').textContent = ended ? 'Play again →' : paused ? 'Resume →' : 'Start game →';
  byId('overlay-hint').textContent = mode === 'invaders'
    ? `${personalBest > 0 ? `${newPersonalBest && ended ? 'New personal best' : 'Best on this device'}: ${personalBest} points. ` : ''}${game.hint}`
    : ended ? 'Try a different game with the arrows above.' : game.hint;
}
function finish() {
  if (mode === 'invaders') {
    newPersonalBest = state.score > personalBest;
    personalBest = Math.max(personalBest, savePersonalBest(state.score));
  }
  playing = false;
  clearControls();
  stopFrame();
  start.textContent = 'Again';
  start.setAttribute('aria-label', 'Play again');
  pause.disabled = true;
  pause.textContent = 'Pause';
  pause.setAttribute('aria-pressed', 'false');
  syncStatus();
  syncOverlay();
  canvas.setAttribute('aria-label', `${game.title}. Game over. ${scoreText()}. Select Play again for another run.`);
  announce(`Game over. ${scoreText()}.${newPersonalBest && mode === 'invaders' ? ' New personal best.' : ''} Select Play again to restart.`);
  render();
}
function frame(now) {
  frameId = null;
  if (!playing || paused) return;
  if (!lastFrame) lastFrame = now;
  accumulator += Math.min((now - lastFrame) / 1000, .1);
  lastFrame = now;
  const step = 1 / 120;
  while (accumulator >= step && !state.ended) {
    if (mode === 'invaders') stepInvaders(state, { ...getInput(input), targetX, targetY }, step);
    else stepRunner(state, step);
    accumulator -= step;
  }
  syncStatus();
  if (state.ended) { finish(); return; }
  render();
  scheduleFrame();
}
function resetGame() {
  stopFrame();
  clearControls();
  state = mode === 'invaders' ? createInvadersState(world) : createRunnerState(world);
  lastLives = 3;
  lastWeaponLevel = 1;
  newPersonalBest = false;
  playing = true;
  paused = false;
  start.textContent = 'Restart';
  start.setAttribute('aria-label', 'Restart game');
  pause.disabled = false;
  pause.textContent = 'Pause';
  pause.setAttribute('aria-pressed', 'false');
  closeHelp(false);
  picker.open = false;
  canvas.setAttribute('aria-label', `${game.title} arena. ${game.help}`);
  announce(`${game.title} started.`);
  syncStatus();
  syncOverlay();
  render();
  canvas.focus({ preventScroll: true });
  scheduleFrame();
}
function setPaused(nextPaused, automatic = false) {
  if (!playing || paused === nextPaused) return;
  paused = nextPaused;
  clearControls();
  stopFrame();
  pause.textContent = paused ? 'Resume' : 'Pause';
  pause.setAttribute('aria-pressed', String(paused));
  syncStatus();
  syncOverlay();
  announce(paused ? `${automatic ? 'Game paused because you left the arena. ' : 'Game paused. '}Select Resume to continue.` : 'Game resumed.');
  render();
  if (!paused) { closeHelp(false); picker.open = false; canvas.focus({ preventScroll: true }); scheduleFrame(); }
}
function press(action, source, pressed) {
  if (!playing || paused) return;
  setInput(input, action, source, pressed);
  if (action === 'action' && pressed && mode === 'runner') jumpRunner(state);
  syncInputButtons();
}
function bindButton(id, action) {
  const button = byId(id);
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0 || !playing || paused) return;
    event.preventDefault();
    capture(button, event.pointerId);
    press(action, `pointer:${event.pointerId}`, true);
  });
  const release = event => {
    setInput(input, action, `pointer:${event.pointerId}`, false);
    syncInputButtons();
    releaseCapture(button, event.pointerId);
  };
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(event, release);
  button.addEventListener('keydown', event => {
    if (!['Space', 'Enter'].includes(event.code)) return;
    event.preventDefault();
    if (!event.repeat) press(action, `button:${id}:${event.code}`, true);
  });
  button.addEventListener('keyup', event => {
    if (!['Space', 'Enter'].includes(event.code)) return;
    event.preventDefault();
    setInput(input, action, `button:${id}:${event.code}`, false);
    syncInputButtons();
  });
  button.addEventListener('blur', () => {
    for (const code of ['Space', 'Enter']) setInput(input, action, `button:${id}:${code}`, false);
    syncInputButtons();
  });
  button.addEventListener('click', event => {
    if (event.detail !== 0 || !playing || paused) return;
    if (action === 'action') mode === 'runner' ? jumpRunner(state) : fireInvaders(state);
    else if (mode === 'invaders') state.player = Math.max(38, Math.min(world.width - 38, state.player + (action === 'left' ? -48 : 48)));
    render();
  });
}
function anchorSteering(pointerId, gesture) {
  steeringPointer = pointerId;
  gesture.x = gesture.lastX;
  gesture.y = gesture.lastY;
  targetX = state.player;
  targetY = state.playerY;
}
function bindArena(surface = canvas) {
  surface.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0 || !playing || paused) return;
    event.preventDefault();
    surface.focus({ preventScroll: true });
    capture(surface, event.pointerId);
    const gesture = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastY: event.clientY, swiped: false };
    arenaPointers.set(event.pointerId, gesture);
    if (mode === 'invaders') {
      if (steeringPointer === null) anchorSteering(event.pointerId, gesture);
      press('action', `arena:${event.pointerId}`, true);
    } else {
      // Jump at contact, so taps feel immediate; an upward swipe can trigger the second jump.
      jumpRunner(state);
    }
  });
  surface.addEventListener('pointermove', event => {
    const gesture = arenaPointers.get(event.pointerId);
    if (!gesture || !playing || paused) return;
    event.preventDefault();
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
    if (mode === 'invaders' && event.pointerId === steeringPointer) {
      const dx = event.clientX - gesture.x;
      const dy = event.clientY - gesture.y;
      const rect = canvas.getBoundingClientRect();
      const bounds = arenaFor(state).invadersBounds;
      targetX = Math.max(bounds.left, Math.min(bounds.right, (targetX ?? state.player) + dx * world.width / rect.width));
      targetY = Math.max(bounds.top, Math.min(bounds.bottom, (targetY ?? state.playerY) + dy * world.height / rect.height));
      // Rebase every move so reversing at an edge responds immediately.
      gesture.x = event.clientX;
      gesture.y = event.clientY;
    }
    if (mode === 'runner' && !gesture.swiped && gesture.y - event.clientY > 32) {
      gesture.swiped = true;
      jumpRunner(state);
    }
  });
  const release = event => {
    arenaPointers.delete(event.pointerId);
    setInput(input, 'action', `arena:${event.pointerId}`, false);
    if (event.pointerId === steeringPointer) {
      steeringPointer = null;
      targetX = undefined;
      targetY = undefined;
      // A second finger can take over without snapping to its contact point.
      const remaining = arenaPointers.entries().next().value;
      if (remaining && playing && !paused) anchorSteering(...remaining);
    }
    syncInputButtons();
    releaseCapture(surface, event.pointerId);
  };
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) surface.addEventListener(event, release);
}
function closeHelp(returnFocus = true) {
  helpPanel.hidden = true;
  byId('help-toggle').setAttribute('aria-expanded', 'false');
  if (returnFocus) byId('help-toggle').focus({ preventScroll: true });
}
byId('help-toggle').addEventListener('click', () => {
  if (!helpPanel.hidden) { closeHelp(); return; }
  setPaused(true);
  picker.open = false;
  helpPanel.hidden = false;
  byId('help-toggle').setAttribute('aria-expanded', 'true');
  byId('help-close').focus({ preventScroll: true });
});
byId('help-close').addEventListener('click', () => closeHelp());
picker.addEventListener('toggle', () => { if (picker.open) { setPaused(true); closeHelp(false); } });
document.addEventListener('pointerdown', event => { if (picker.open && !picker.contains(event.target)) picker.open = false; });
function syncFullscreen() {
  const expanded = document.fullscreenElement === shell || shell.classList.contains('is-expanded');
  byId('fullscreen').setAttribute('aria-label', expanded ? 'Exit full screen' : 'Enter full screen');
  byId('fullscreen').setAttribute('aria-pressed', String(expanded));
  resizeCanvas();
}
async function exitFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen();
  shell.classList.remove('is-expanded');
  document.body.classList.remove('is-expanded');
  syncFullscreen();
}
byId('fullscreen').addEventListener('click', async () => {
  if (fullscreenBusy) return;
  fullscreenBusy = true;
  try {
    if (document.fullscreenElement || shell.classList.contains('is-expanded')) await exitFullscreen();
    else {
      if (shell.requestFullscreen && document.fullscreenEnabled) {
        try { await shell.requestFullscreen(); } catch { shell.classList.add('is-expanded'); document.body.classList.add('is-expanded'); }
      } else { shell.classList.add('is-expanded'); document.body.classList.add('is-expanded'); }
      syncFullscreen();
    }
  } finally { fullscreenBusy = false; }
});
document.addEventListener('fullscreenchange', syncFullscreen);
document.addEventListener('keydown', event => {
  if (event.code !== 'Escape') return;
  if (!helpPanel.hidden) { event.preventDefault(); closeHelp(); }
  else if (picker.open) { event.preventDefault(); picker.open = false; picker.querySelector('summary').focus(); }
  else if (shell.classList.contains('is-expanded')) { event.preventDefault(); void exitFullscreen(); }
  else if (mode !== 'trivia' && playing && !event.repeat) { event.preventDefault(); setPaused(!paused); }
});

function setupArcade() {
  quiz.hidden = true;
  byId('arcade-hud').hidden = true;
  canvas.setAttribute('aria-label', `${game.title} arena. Select Start to play. ${game.help}`);
  byId('action').textContent = game.action;
  if (mode === 'runner') { byId('left').hidden = true; byId('right').hidden = true; }
  for (const id of ['left', 'right', 'action']) bindButton(id, id);
  bindArena();
  start.addEventListener('click', resetGame);
  byId('overlay-action').addEventListener('click', () => { if (paused && playing) setPaused(false); else resetGame(); });
  pause.addEventListener('click', () => setPaused(!paused));
  const keyActions = mode === 'invaders'
    ? { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'action' }
    : { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'action', Space: 'action', KeyW: 'action' };
  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.code === 'KeyP') { if (playing && !event.repeat) { event.preventDefault(); setPaused(!paused); } return; }
    const action = keyActions[event.code];
    if (!playing || paused || !action || event.target.closest('button, a, summary')) return;
    event.preventDefault();
    if (!event.repeat) press(action, `key:${event.code}`, true);
  });
  document.addEventListener('keyup', event => {
    const action = keyActions[event.code];
    if (action) { setInput(input, action, `key:${event.code}`, false); syncInputButtons(); }
  });
  window.addEventListener('blur', () => { clearControls(); setPaused(true, true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { clearControls(); setPaused(true, true); } });
  window.addEventListener('resize', resizeCanvas);
  window.visualViewport?.addEventListener('resize', resizeCanvas);
  new ResizeObserver(resizeCanvas).observe(byId('arena-view'));
  reducedMotion.addEventListener('change', render);
  syncOverlay();
  resizeCanvas();
  renderer.loadImages().then(() => { document.documentElement.dataset.artwork = 'ready'; render(); });
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}
function setupTrivia() {
  canvas.hidden = true;
  overlay.hidden = true;
  controls.hidden = true;
  quiz.hidden = false;
  document.querySelector('.skip-link').href = '#quiz-question';
  let index = 0;
  let correct = 0;
  let streak = 0;
  let bestStreak = 0;
  let round = 0;
  let roundQuestions = questionsForRound(round);
  const choices = [];
  const art = new Image();
  art.onload = art.onerror = () => { document.documentElement.dataset.artwork = 'ready'; };
  art.src = 'assets/trivia-world.webp';

  function showResults() {
    quiz.replaceChildren();
    const results = element('div', 'quiz-results');
    const title = element('h2', '', 'Challenge complete');
    title.id = 'quiz-question';
    title.tabIndex = -1;
    const summary = `You scored ${correct} out of ${roundQuestions.length}.`;
    results.append(element('p', 'quiz-category', `Round ${round + 1} complete`), title, element('p', 'quiz-result-score', summary), element('p', '', `Best streak: ${bestStreak}. ${correct === roundQuestions.length ? 'Every decision landed. Ready for a different set?' : 'Every explanation is another useful idea to take with you.'}`));
    const again = element('button', '', 'Play again');
    again.type = 'button';
    again.addEventListener('click', () => { round += 1; roundQuestions = questionsForRound(round); index = 0; correct = 0; streak = 0; bestStreak = 0; choices.length = 0; showQuestion(true); });
    results.append(again, element('p', 'overlay-hint', 'The next round brings a different set of questions.'));
    const review = element('details', 'quiz-review');
    review.append(element('summary', '', 'Review this round'));
    const list = element('ol');
    roundQuestions.forEach((question, questionIndex) => {
      const item = element('li');
      item.append(element('strong', '', `${choices[questionIndex] === question.correct ? 'Correct' : 'Review'} · ${question.prompt}`), element('span', '', question.explanation));
      list.append(item);
    });
    review.append(list);
    results.append(review);
    quiz.append(results);
    setStatus(`Complete · ${correct} of ${roundQuestions.length} correct`);
    announce(`Challenge complete. ${summary}`);
    quiz.scrollTop = 0;
    title.focus({ preventScroll: true });
  }
  function showQuestion(moveFocus = false) {
    const question = roundQuestions[index];
    quiz.replaceChildren();
    const inner = element('div', 'quiz-inner');
    const progress = element('div', 'quiz-progress-row');
    progress.append(element('p', 'quiz-progress', `Question ${index + 1} of ${roundQuestions.length}`), element('span', 'quiz-streak', streak > 1 ? `${streak} correct in a row` : `${correct} correct`));
    const track = element('div', 'quiz-track');
    track.setAttribute('role', 'progressbar');
    track.setAttribute('aria-label', 'Round progress');
    track.setAttribute('aria-valuemin', '0');
    track.setAttribute('aria-valuemax', String(roundQuestions.length));
    track.setAttribute('aria-valuenow', String(index));
    const fill = element('span');
    fill.style.width = `${index / roundQuestions.length * 100}%`;
    track.append(fill);
    inner.append(progress, track, element('p', 'quiz-category', question.category || 'Digital experiences'));
    const heading = element('h2', 'quiz-question', question.prompt);
    heading.id = 'quiz-question';
    heading.setAttribute('aria-label', `Question ${index + 1} of ${roundQuestions.length}. ${question.prompt}`);
    heading.tabIndex = -1;
    const answers = element('div', 'answers');
    answers.setAttribute('role', 'group');
    answers.setAttribute('aria-labelledby', heading.id);
    const feedback = element('div', 'quiz-feedback');
    feedback.id = 'quiz-feedback';
    let answered = false;
    question.answers.forEach((answer, answerIndex) => {
      const button = element('button', 'answer-button', answer);
      button.type = 'button';
      button.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        choices[index] = answerIndex;
        const isCorrect = gradeAnswer(question, answerIndex);
        if (isCorrect) { correct += 1; streak += 1; bestStreak = Math.max(bestStreak, streak); } else streak = 0;
        progress.querySelector('.quiz-streak').textContent = streak > 1 ? `${streak} correct in a row` : `${correct} correct`;
        track.setAttribute('aria-valuenow', String(index + 1));
        fill.style.width = `${(index + 1) / roundQuestions.length * 100}%`;
        [...answers.children].forEach((answerButton, optionIndex) => {
          answerButton.disabled = true;
          if (optionIndex === question.correct) { answerButton.dataset.result = 'correct'; answerButton.append(element('span', 'answer-result', 'Correct answer')); }
          else if (optionIndex === answerIndex) { answerButton.dataset.result = 'incorrect'; answerButton.append(element('span', 'answer-result', 'Your answer')); }
        });
        feedback.append(element('p', 'feedback-title', isCorrect ? 'Correct.' : 'Not quite.'), element('p', '', question.explanation));
        const next = element('button', 'quiz-next', index === roundQuestions.length - 1 ? 'See results' : 'Next question');
        next.type = 'button';
        next.setAttribute('aria-describedby', feedback.id);
        next.addEventListener('click', () => {
          if (next.disabled) return;
          next.disabled = true;
          index += 1;
          index === roundQuestions.length ? showResults() : showQuestion(true);
        });
        inner.append(next);
        setStatus(`${correct} correct`);
        announce(`${isCorrect ? 'Correct.' : `Not quite. The correct answer is ${question.answers[question.correct]}.`} ${question.explanation}`);
        next.focus({ preventScroll: true });
        // The explanations can extend beyond a short landscape viewport; keep the next action reachable.
        next.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      });
      answers.append(button);
    });
    inner.append(heading, answers, feedback);
    quiz.append(inner);
    setStatus(`${correct} correct`);
    quiz.scrollTop = 0;
    if (moveFocus) heading.focus({ preventScroll: true });
  }
  showQuestion();
}
if (mode === 'trivia') setupTrivia();
else setupArcade();
