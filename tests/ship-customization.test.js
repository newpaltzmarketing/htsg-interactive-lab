import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeShipAppearance, readShipAppearance, saveShipAppearance } from '../public/ship-customization.js';

test('ship preferences tolerate broken or unavailable device storage', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.deepEqual(readShipAppearance(blocked), { style: 'studio', color: 'orange' });
  assert.equal(saveShipAppearance({ style: 'relay', color: 'blue' }, blocked), false);
  assert.deepEqual(readShipAppearance({ getItem: () => '{broken' }), { style: 'studio', color: 'orange' });
  assert.deepEqual(normalizeShipAppearance({ style: '<script>', color: 'teal', speed: 99 }), { style: 'studio', color: 'teal' });
});

test('ship selections round-trip without gameplay or account information', () => {
  const data = new Map(), storage = { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) };
  assert.equal(saveShipAppearance({ style: 'fixer', color: 'violet', score: 500, email: 'unused' }, storage), true);
  assert.deepEqual(readShipAppearance(storage), { style: 'fixer', color: 'violet' });
  assert.equal(data.size, 1);
  assert.deepEqual(JSON.parse([...data.values()][0]), { style: 'fixer', color: 'violet' });
});
