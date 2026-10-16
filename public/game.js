import { brand } from './brand.js';
import { questions } from './questions.js';
import {
  ARENA, createInputState, setInput, getInput, clearInput,
  createInvadersState, stepInvaders, fireInvaders,
  createRunnerState, jumpRunner, stepRunner, gradeAnswer,
} from './game-engine.js';

const games = {
  invaders: {
    title: 'Agency Invaders',
    instructions: 'Clear the incoming project chaos. You have three lives; each hit scores 10 points.',
    help: 'Move: A / D or left / right arrows. Fire: Space or up arrow. On touch screens, hold a direction and Fire together. P or Escape pauses.',
    action: 'Fire',
  },
  runner: {
    title: 'Launch Runner',
    instructions: 'Keep the launch moving. Jump over each obstacle and see how far you can go.',
    help: 'Jump: Space, W, or up arrow. On touch screens, tap the arena or Jump. Release and press again for your next jump. P or Escape pauses.',
    action: 'Jump',
  },
  trivia: {
    title: 'Trivia Challenge',
    instructions: 'Answer five questions about useful digital experiences. Learn a little after every answer.',
    help: 'Choose one answer, read the explanation, then continue. Use Tab and Enter or tap an answer.',
  },
};
const requestedMode = new URLSearchParams(location.search).get('game');
const mode = Object.hasOwn(games, requestedMode) ? requestedMode : 'invaders';
const game = games[mode];
const byId = id => document.getElementById(id);
const canvas = byId('canvas') || document.querySelector('canvas');
const context = canvas.getContext('2d');
const status = byId('status');
const controls = byId('controls');
const start = byId('start');
const pause = byId('pause');
const announcement = byId('announcement');
const quiz = byId('quiz');
const palette = {
  background: '#111111', grid: '#242424', player: '#f7b21b', projectile: '#ffcf66',
  obstacle: '#f5f2e9', text: '#ffffff', overlay: 'rgba(17,17,17,.94)',
  ...(brand.canvas || {}),
};
const input = createInputState();
let state;
let playing = false;
let paused = false;
let frameId = null;
let lastFrame = 0;
let accumulator = 0;
let pixelRatio = 1;
let lastLives = 3;

byId('title').textContent = game.title;
byId('instructions').textContent = game.instructions;
if (byId('game-help')) byId('game-help').textContent = game.help;
document.title = `${game.title} | ${brand.name || 'HTSG Interactive Lab'}`;
status.setAttribute('aria-live', 'off');

function announce(message) {
  if (announcement) announcement.textContent = message;
}

function setStatus(message) {
  if (status.textContent !== message) status.textContent = message;
}

function scoreText() {
  return mode === 'runner' ? `Distance: ${Math.floor(state.score)} m` : `Score: ${state.score} · Lives: ${state.lives} of 3`;
}

function syncStatus() {
  const message = state ? scoreText() : 'Ready to play';
  setStatus(paused ? `Paused · ${message}` : state?.ended ? `Game over · ${message}` : message);
  if (byId('score-value') && state) byId('score-value').textContent = Math.floor(state.score);
  if (state && mode === 'invaders' && state.lives !== lastLives) {
    lastLives = state.lives;
    if (!state.ended) announce(`${state.lives} ${state.lives === 1 ? 'life' : 'lives'} remaining.`);
  }
}

function clearControls() {
  clearInput(input);
  controls.querySelectorAll('[aria-pressed]').forEach(button => {
    if (button !== pause) button.setAttribute('aria-pressed', 'false');
  });
}

function stopFrame() {
  if (frameId !== null) cancelAnimationFrame(frameId);
  frameId = null;
  lastFrame = 0;
  accumulator = 0;
}

function scheduleFrame() {
  if (playing && !paused && frameId === null) frameId = requestAnimationFrame(frame);
}

function resizeCanvas() {
  pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(ARENA.width * pixelRatio);
  canvas.height = Math.round(ARENA.height * pixelRatio);
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  render();
}

function arena() {
  context.fillStyle = palette.background;
  context.fillRect(0, 0, ARENA.width, ARENA.height);
  context.strokeStyle = palette.grid;
  context.lineWidth = 1;
  context.beginPath();
  // A fixed grid provides depth without decorative animation.
  for (let x = 0; x < ARENA.width; x += 60) { context.moveTo(x + 0.5, 0); context.lineTo(x + 0.5, ARENA.height); }
  for (let y = 0; y < ARENA.height; y += 60) { context.moveTo(0, y + 0.5); context.lineTo(ARENA.width, y + 0.5); }
  context.stroke();
}

function overlay(title, lines) {
  const displayScale = Math.min(1, (canvas.getBoundingClientRect().width || ARENA.width) / ARENA.width);
  const headingSize = Math.min(76, Math.max(44, 22 / displayScale));
  const bodySize = Math.min(54, Math.max(24, 15 / displayScale));
  context.fillStyle = palette.overlay;
  context.fillRect(0, 0, ARENA.width, ARENA.height);
  context.textAlign = 'center';
  context.fillStyle = palette.player;
  context.font = `700 ${headingSize}px system-ui, sans-serif`;
  context.fillText(title, ARENA.width / 2, 220);
  context.fillStyle = palette.text;
  context.font = `${bodySize}px system-ui, sans-serif`;
  lines.forEach((line, index) => context.fillText(line, ARENA.width / 2, 285 + index * bodySize * 1.5));
}

function drawInvaders() {
  context.fillStyle = palette.player;
  context.beginPath();
  context.moveTo(state.player, 460);
  context.lineTo(state.player - 27, 510);
  context.lineTo(state.player - 9, 501);
  context.lineTo(state.player + 9, 501);
  context.lineTo(state.player + 27, 510);
  context.closePath();
  context.fill();
  context.fillStyle = palette.text;
  context.fillRect(state.player - 4, 480, 8, 15);
  context.fillStyle = palette.projectile;
  state.bullets.forEach(bullet => context.fillRect(bullet.x - 3, bullet.y, 6, 19));
  state.enemies.forEach(enemy => {
    context.fillStyle = palette.obstacle;
    context.fillRect(enemy.x - 31, enemy.y - 20, 62, 40);
    context.fillStyle = palette.background;
    context.fillRect(enemy.x - 21, enemy.y - 10, 15, 6);
    context.fillRect(enemy.x + 6, enemy.y - 10, 15, 6);
    context.fillRect(enemy.x - 14, enemy.y + 5, 28, 5);
  });
}

function drawRunner() {
  context.strokeStyle = palette.obstacle;
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(0, ARENA.floor + 1.5);
  context.lineTo(ARENA.width, ARENA.floor + 1.5);
  context.stroke();
  context.fillStyle = palette.player;
  context.fillRect(152, ARENA.floor - 54 - state.height, 50, 54);
  context.fillStyle = palette.background;
  context.fillRect(184, ARENA.floor - 42 - state.height, 8, 8);
  state.obstacles.forEach(obstacle => {
    context.fillStyle = palette.obstacle;
    context.fillRect(obstacle.x, ARENA.floor - obstacle.height, obstacle.width, obstacle.height);
    context.fillStyle = palette.background;
    context.fillRect(obstacle.x + 9, ARENA.floor - obstacle.height + 10, obstacle.width - 18, 5);
  });
}

function render() {
  if (mode === 'trivia') return;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  arena();
  if (state) mode === 'invaders' ? drawInvaders() : drawRunner();
  if (!state) overlay(game.title, ['Select Start to play', mode === 'invaders' ? 'Move, fire, and protect the launch.' : 'Time your jumps. Keep moving.']);
  else if (state.ended) overlay(mode === 'invaders' ? 'Shift complete' : 'Launch blocked', [mode === 'runner' ? `${Math.floor(state.score)} m traveled` : `${state.score} points`, 'Select Play again for another run.']);
  else if (paused) overlay('Game paused', ['Select Resume when you’re ready.']);
}

function finish() {
  playing = false;
  clearControls();
  stopFrame();
  start.textContent = 'Play again';
  if (pause) { pause.disabled = true; pause.textContent = 'Pause'; pause.setAttribute('aria-pressed', 'false'); }
  syncStatus();
  canvas.setAttribute('aria-label', `${game.title}. Game over. ${scoreText()}. Select Play again for another run.`);
  announce(`Game over. ${scoreText()}. Select Play again to restart.`);
  render();
}

function frame(now) {
  frameId = null;
  if (!playing || paused) return;
  if (!lastFrame) lastFrame = now;
  accumulator += Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  const step = 1 / 120;
  while (accumulator >= step && !state.ended) {
    if (mode === 'invaders') stepInvaders(state, getInput(input), step);
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
  state = mode === 'invaders' ? createInvadersState() : createRunnerState();
  lastLives = 3;
  playing = true;
  paused = false;
  start.textContent = 'Restart';
  if (pause) { pause.disabled = false; pause.textContent = 'Pause'; pause.setAttribute('aria-pressed', 'false'); }
  canvas.setAttribute('aria-label', `${game.title} arena. ${game.help}`);
  announce(`${game.title} started.`);
  syncStatus();
  render();
  canvas.focus({ preventScroll: true });
  scheduleFrame();
}

function setPaused(nextPaused, automatic = false) {
  if (!playing || paused === nextPaused) return;
  paused = nextPaused;
  clearControls();
  stopFrame();
  if (pause) { pause.textContent = paused ? 'Resume' : 'Pause'; pause.setAttribute('aria-pressed', String(paused)); }
  syncStatus();
  announce(paused ? `${automatic ? 'Game paused because you left the arena. ' : 'Game paused. '}Select Resume to continue.` : 'Game resumed.');
  render();
  if (!paused) { canvas.focus({ preventScroll: true }); scheduleFrame(); }
}

function press(action, source, pressed) {
  if (!playing || paused) return;
  setInput(input, action, source, pressed);
  if (action === 'action' && pressed && mode === 'runner') jumpRunner(state);
  ['left', 'right', 'action'].forEach(key => byId(key)?.setAttribute('aria-pressed', String(getInput(input)[key])));
}

function bindPointer(element, action) {
  element.style.touchAction = 'none';
  element.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (!playing || paused) return;
    event.preventDefault();
    element.setPointerCapture(event.pointerId);
    press(action, `pointer:${event.pointerId}`, true);
  });
  const release = event => {
    setInput(input, action, `pointer:${event.pointerId}`, false);
    byId(action)?.setAttribute('aria-pressed', String(getInput(input)[action]));
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(name => element.addEventListener(name, release));
}

function bindButton(id, action) {
  const button = byId(id);
  button.setAttribute('aria-pressed', 'false');
  bindPointer(button, action);
  button.addEventListener('keydown', event => {
    if (!['Space', 'Enter'].includes(event.code)) return;
    event.preventDefault();
    if (!event.repeat) press(action, `button:${id}:${event.code}`, true);
  });
  button.addEventListener('keyup', event => {
    if (!['Space', 'Enter'].includes(event.code)) return;
    event.preventDefault();
    setInput(input, action, `button:${id}:${event.code}`, false);
    button.setAttribute('aria-pressed', String(getInput(input)[action]));
  });
  button.addEventListener('blur', () => {
    ['Space', 'Enter'].forEach(code => setInput(input, action, `button:${id}:${code}`, false));
    button.setAttribute('aria-pressed', String(getInput(input)[action]));
  });
  // Assistive technologies can activate a button without pointer or key events.
  button.addEventListener('click', event => {
    if (event.detail !== 0 || !playing || paused) return;
    if (action === 'action') mode === 'runner' ? jumpRunner(state) : fireInvaders(state);
    else if (mode === 'invaders') state.player = Math.max(32, Math.min(ARENA.width - 32, state.player + (action === 'left' ? -48 : 48)));
    render();
  });
}

function setupArcade() {
  quiz.hidden = true;
  canvas.setAttribute('aria-label', `${game.title} arena. Select Start to play. ${game.help}`);
  byId('action').textContent = game.action;
  if (mode === 'runner') { byId('left').hidden = true; byId('right').hidden = true; }
  ['left', 'right', 'action'].forEach(id => bindButton(id, id));
  bindPointer(canvas, 'action');
  start.addEventListener('click', resetGame);
  if (pause) { pause.disabled = true; pause.addEventListener('click', () => setPaused(!paused)); }
  const keyActions = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'action', Space: 'action', KeyW: 'action' };
  document.addEventListener('keydown', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.code === 'Escape' || event.code === 'KeyP') {
      if (playing && !event.repeat) { event.preventDefault(); setPaused(!paused); }
      return;
    }
    const action = keyActions[event.code];
    if (!playing || paused || !action || event.target.closest('button, a')) return;
    event.preventDefault();
    if (!event.repeat) press(action, `key:${event.code}`, true);
  });
  document.addEventListener('keyup', event => {
    const action = keyActions[event.code];
    if (action) {
      setInput(input, action, `key:${event.code}`, false);
      byId(action)?.setAttribute('aria-pressed', String(getInput(input)[action]));
    }
  });
  window.addEventListener('blur', () => { clearControls(); setPaused(true, true); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clearControls(); setPaused(true, true); }
  });
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
}

function setupTrivia() {
  canvas.hidden = true;
  controls.hidden = true;
  if (pause) pause.hidden = true;
  if (start && !controls.contains(start)) start.hidden = true;
  quiz.hidden = false;
  let index = 0;
  let correct = 0;

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function showResults() {
    quiz.replaceChildren();
    const results = element('div', 'quiz-results');
    const title = element('h2', '', 'Challenge complete');
    title.tabIndex = -1;
    const summary = `You scored ${correct} out of ${questions.length}.`;
    results.append(title, element('p', 'quiz-result-score', summary), element('p', '', 'Thanks for exploring what makes a digital experience useful.'));
    const again = element('button', '', 'Play again');
    again.type = 'button';
    again.addEventListener('click', () => { index = 0; correct = 0; showQuestion(true); });
    results.append(again);
    quiz.append(results);
    setStatus(`Complete · ${correct} of ${questions.length} correct`);
    announce(`Challenge complete. ${summary}`);
    title.focus({ preventScroll: true });
  }

  function showQuestion(moveFocus = false) {
    const question = questions[index];
    quiz.replaceChildren();
    quiz.append(element('p', 'quiz-progress', `Question ${index + 1} of ${questions.length}`));
    const heading = element('h2', 'quiz-question', question.prompt);
    heading.id = 'quiz-question';
    heading.setAttribute('aria-label', `Question ${index + 1} of ${questions.length}. ${question.prompt}`);
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
        const isCorrect = gradeAnswer(question, answerIndex);
        if (isCorrect) correct += 1;
        [...answers.children].forEach((answerButton, optionIndex) => {
          answerButton.disabled = true;
          if (optionIndex === question.correct) {
            answerButton.dataset.result = 'correct';
            answerButton.append(element('span', 'answer-result', 'Correct answer'));
          } else if (optionIndex === answerIndex) {
            answerButton.dataset.result = 'incorrect';
            answerButton.append(element('span', 'answer-result', 'Your answer'));
          }
        });
        feedback.append(element('p', 'feedback-title', isCorrect ? 'Correct.' : 'Not quite.'), element('p', '', question.explanation));
        const next = element('button', 'quiz-next', index === questions.length - 1 ? 'See results' : 'Next question');
        next.type = 'button';
        next.setAttribute('aria-describedby', feedback.id);
        next.addEventListener('click', () => {
          if (next.disabled) return;
          next.disabled = true;
          index += 1;
          index === questions.length ? showResults() : showQuestion(true);
        });
        quiz.append(next);
        setStatus(`${correct} correct`);
        announce(`${isCorrect ? 'Correct.' : `Not quite. The correct answer is ${question.answers[question.correct]}.`} ${question.explanation}`);
        next.focus({ preventScroll: true });
      });
      answers.append(button);
    });
    quiz.append(heading, answers, feedback);
    setStatus(`${correct} correct`);
    if (moveFocus) heading.focus({ preventScroll: true });
  }
  showQuestion();
}

if (mode === 'trivia') setupTrivia();
else setupArcade();
