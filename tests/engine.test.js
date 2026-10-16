import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ARENA, createInputState, setInput, getInput, clearInput,
  createInvadersState, fireInvaders, stepInvaders,
  createRunnerState, jumpRunner, stepRunner, gradeAnswer,
} from '../public/game-engine.js';
import { questions } from '../public/questions.js';

const idle = { left: false, right: false, action: false };
const fixedRandom = () => 0.5;
const frames = (count, callback) => { for (let index = 0; index < count; index += 1) callback(1 / 120); };

test('keyboard and simultaneous touch sources release independently; blur clears every source', () => {
  const input = createInputState();
  setInput(input, 'left', 'key:ArrowLeft', true);
  setInput(input, 'left', 'pointer:1', true);
  setInput(input, 'action', 'pointer:2', true);
  setInput(input, 'left', 'pointer:1', false);
  assert.deepEqual(getInput(input), { left: true, right: false, action: true });
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
  assert.ok(state.player >= 32);
  const opposite = createInvadersState();
  frames(1000, dt => stepInvaders(opposite, { ...idle, right: true, action: true }, dt, () => 0));
  assert.ok(opposite.player <= ARENA.width - 32);
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
  frames(24, dt => stepInvaders(state, idle, dt, fixedRandom));
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
  state.enemies.push({ x: 100, y: 520 }, { x: state.player, y: 470 }, { x: 800, y: 520 }, { x: 850, y: 520 });
  stepInvaders(state, idle, 1 / 60, fixedRandom);
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

test('Launch Runner permits a grounded jump, blocks a double jump, and lands cleanly', () => {
  const state = createRunnerState();
  assert.equal(jumpRunner(state), true);
  assert.equal(jumpRunner(state), false);
  stepRunner(state, 1 / 120, fixedRandom);
  assert.ok(state.height > 0);
  assert.equal(jumpRunner(state), false);
  frames(120, dt => stepRunner(state, dt, fixedRandom));
  assert.equal(state.height, 0);
  assert.equal(state.velocity, 0);
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

test('zero and negative elapsed time do not progress either game', () => {
  for (const seconds of [0, -0.1]) {
    const invaders = createInvadersState();
    const runner = createRunnerState();
    stepInvaders(invaders, { left: false, right: true, action: true }, seconds, fixedRandom);
    stepRunner(runner, seconds, fixedRandom);
    assert.deepEqual(invaders, createInvadersState());
    assert.deepEqual(runner, createRunnerState());
  }
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
