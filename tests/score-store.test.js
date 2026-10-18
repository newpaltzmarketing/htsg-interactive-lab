import test from 'node:test';
import assert from 'node:assert/strict';
import { readPersonalBest, savePersonalBest } from '../public/score-store.js';

const memory = initial => {
  let saved = initial;
  return { getItem() { return saved; }, setItem(key, value) { saved = value; } };
};

test('a personal best survives a fresh read and a worse run cannot replace it', () => {
  const storage = memory(null);
  assert.equal(readPersonalBest(storage), 0);
  assert.equal(savePersonalBest(145, storage), 145);
  assert.equal(readPersonalBest(storage), 145);
  assert.equal(savePersonalBest(20, storage), 145);
  assert.equal(savePersonalBest(230, storage), 230);
  assert.equal(readPersonalBest(storage), 230);
});

test('missing, malformed and unreasonable stored scores do not become records', () => {
  for (const value of [null, 'garbage', 'NaN', 'Infinity', '-5', '1000000000', '{}']) {
    assert.equal(readPersonalBest(memory(value)), 0);
  }
  const storage = memory('75');
  for (const score of [NaN, Infinity, -10, 1000000000, '900', null]) {
    assert.equal(savePersonalBest(score, storage), 75);
  }
});

test('blocked storage cannot prevent a run from finishing or reporting its record', () => {
  const storage = { getItem() { throw new Error('Blocked'); }, setItem() { throw new Error('Blocked'); } };
  assert.equal(readPersonalBest(storage), 0);
  assert.equal(savePersonalBest(325, storage), 325);
});
