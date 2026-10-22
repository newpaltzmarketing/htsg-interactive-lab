import test from 'node:test';
import assert from 'node:assert/strict';
import { puzzles } from '../public/crossword-puzzles.js';
import {
  validatePuzzle, compilePuzzle, getEntry, entriesForCell, createCrosswordState,
  restoreCrosswordState, serializeCrosswordState, setCrosswordLetter,
  checkEntry, checkPuzzle, crosswordProgress,
} from '../public/crossword-engine.js';

const first = () => compilePuzzle(puzzles[0]);
function solved(puzzle) {
  const state = createCrosswordState(puzzle);
  state.letters = puzzle.cells.map(cell => cell.solution);
  return state;
}

test('the original bank has three distinct, connected, fully checked five-by-five minis with common-length unique fill', () => {
  assert.equal(puzzles.length, 3);
  assert.deepEqual(puzzles.map(puzzle => puzzle.id), ['launch-day', 'good-company', 'web-work']);
  const allAnswers = new Set(), allClues = new Set();
  for (const raw of puzzles) {
    assert.deepEqual(validatePuzzle(raw), { valid: true, errors: [] });
    const puzzle = compilePuzzle(raw);
    assert.equal(puzzle.width, 5); assert.equal(puzzle.height, 5);
    assert.equal(puzzle.cells.filter(cell => !cell.isBlock).length, 19);
    assert.equal(puzzle.entries.across.length, 5); assert.equal(puzzle.entries.down.length, 5);
    assert.deepEqual(puzzle.entries.across.map(entry => entry.number), [1, 4, 5, 6, 7]);
    assert.deepEqual(puzzle.entries.down.map(entry => entry.number), [1, 2, 3, 4, 5]);
    for (const entry of puzzle.entryList) {
      assert.ok(entry.answer.length >= 3 && entry.answer.length <= 5);
      assert.ok(entry.clue.length > 8);
      assert.ok(!allAnswers.has(entry.answer), `Answer repeated in the bank: ${entry.answer}`);
      assert.ok(!allClues.has(entry.clue));
      allAnswers.add(entry.answer); allClues.add(entry.clue);
      assert.equal(entry.cells.map(index => puzzle.cells[index].solution).join(''), entry.answer);
    }
    for (const cell of puzzle.cells.filter(cell => !cell.isBlock)) {
      const crossing = entriesForCell(puzzle, cell.index);
      assert.ok(crossing.across.cells.includes(cell.index)); assert.ok(crossing.down.cells.includes(cell.index));
    }
    assert.equal(checkPuzzle(puzzle, solved(puzzle)).complete, true);
  }
  assert.equal(allAnswers.size, 30);
});

test('numbering follows row order and one numbered cell can begin both directions', () => {
  const puzzle = first();
  assert.equal(puzzle.cells[2].number, 1);
  assert.equal(puzzle.cells[2].acrossId, 'across-1'); assert.equal(puzzle.cells[2].downId, 'down-1');
  assert.equal(getEntry(puzzle, 'across-1').answer, 'SAW');
  assert.equal(getEntry(puzzle, 'down-1').answer, 'SATIN');
  assert.equal(getEntry(puzzle, 'across-5').answer, 'NOTES');
  assert.equal(getEntry(puzzle, 'not-an-entry'), null);
  assert.deepEqual(entriesForCell(puzzle, 0), { across: null, down: null });
  assert.deepEqual(entriesForCell(puzzle, -1), { across: null, down: null });
  assert.deepEqual(entriesForCell(puzzle, '2'), { across: null, down: null });
});

test('typing updates one shared crossing immutably and accepts only a single ASCII letter or clear', () => {
  const puzzle = first(), fresh = createCrosswordState(puzzle);
  const entered = setCrosswordLetter(puzzle, fresh, 2, 's');
  assert.equal(entered.letters[2], 'S'); assert.equal(fresh.letters[2], '');
  assert.equal(checkEntry(puzzle, entered, 'across-1').filled, 1);
  assert.equal(checkEntry(puzzle, entered, 'down-1').filled, 1);
  for (const value of ['', 'AB', 'é', '<script>', 3, null, ' A ']) assert.equal(setCrosswordLetter(puzzle, entered, 2, value).letters[2], '');
  for (const index of [0, -1, 25, 2.5, '2']) assert.equal(setCrosswordLetter(puzzle, entered, index, 'A'), entered);
  assert.equal(setCrosswordLetter(puzzle, entered, 2, 'z').letters[2], 'Z');
});

test('entry checking separates an unfinished word, a filled wrong word and a correct word', () => {
  const puzzle = first(); let state = createCrosswordState(puzzle);
  assert.deepEqual(checkEntry(puzzle, state, 'across-1'), {
    entryId: 'across-1', filled: 0, total: 3, correct: 0, incorrectCells: [], emptyCells: [2, 3, 4], isFilled: false, isCorrect: false,
  });
  for (const [index, value] of [[2, 'S'], [3, 'A'], [4, 'T']]) state = setCrosswordLetter(puzzle, state, index, value);
  const wrong = checkEntry(puzzle, state, 'across-1');
  assert.equal(wrong.isFilled, true); assert.equal(wrong.isCorrect, false); assert.deepEqual(wrong.incorrectCells, [4]);
  state = setCrosswordLetter(puzzle, state, 4, 'W');
  assert.equal(checkEntry(puzzle, state, 'across-1').isCorrect, true);
  assert.equal(crosswordProgress(puzzle, state).complete, false);
  assert.equal(checkEntry(puzzle, state, 'missing'), null);
});

test('completion is derived from all correct letters, never just a filled grid or a saved flag', () => {
  for (const raw of puzzles) {
    const puzzle = compilePuzzle(raw), state = solved(puzzle);
    assert.deepEqual(crosswordProgress(puzzle, state), { filled: 19, total: 19, correct: 19, percent: 100, complete: true });
    for (const entry of puzzle.entryList) assert.equal(checkEntry(puzzle, state, entry.id).isCorrect, true);
    const index = puzzle.cells.find(cell => !cell.isBlock).index;
    state.letters[index] = state.letters[index] === 'X' ? 'Y' : 'X'; state.complete = true;
    const result = checkPuzzle(puzzle, state);
    assert.equal(result.filled, 19); assert.equal(result.correct, 18); assert.equal(result.percent, 100); assert.equal(result.complete, false);
    assert.deepEqual(result.incorrectCells, [index]);
  }
});

test('safe restore normalizes letters and selection, clears block cells and excludes unrelated saved fields', () => {
  const puzzle = first(), saved = createCrosswordState(puzzle);
  saved.letters[0] = 'X'; saved.letters[2] = 's'; saved.letters[3] = '<img>'; saved.letters[4] = 'é';
  saved.selectedCell = 0; saved.direction = 'sideways'; saved.complete = true; saved.secret = 'discard me';
  const restored = restoreCrosswordState(puzzle, JSON.stringify(saved));
  assert.equal(restored.letters[0], ''); assert.equal(restored.letters[2], 'S');
  assert.equal(restored.letters[3], ''); assert.equal(restored.letters[4], '');
  assert.equal(restored.selectedCell, 2); assert.equal(restored.direction, 'across');
  assert.equal(Object.hasOwn(restored, 'secret'), false); assert.equal(Object.hasOwn(restored, 'complete'), false);
  assert.notEqual(restored.letters, saved.letters);
  const validSelection = restoreCrosswordState(puzzle, { ...saved, selectedCell: 11, direction: 'down' });
  assert.equal(validSelection.selectedCell, 11); assert.equal(validSelection.direction, 'down');
});

test('malformed, cross-puzzle, stale-version and wrong-length saves start a clean grid', () => {
  const puzzle = first(), saved = solved(puzzle), clean = createCrosswordState(puzzle);
  for (const value of [null, false, [], 'not json', '{', 'null', { ...saved, schemaVersion: 2 },
    { ...saved, puzzleId: 'web-work' }, { ...saved, puzzleVersion: 2 }, { ...saved, letters: ['A'] }, { ...saved, letters: {} }]) {
    assert.deepEqual(restoreCrosswordState(puzzle, value), clean);
  }
});

test('serialized progress round trips safely without requiring browser storage', () => {
  const puzzle = first(), state = solved(puzzle);
  state.selectedCell = 17; state.direction = 'down'; state.unsafe = '<script>';
  const serialized = serializeCrosswordState(puzzle, state);
  assert.equal(typeof serialized, 'string'); assert.ok(!serialized.includes('unsafe'));
  const restored = restoreCrosswordState(puzzle, serialized);
  assert.equal(crosswordProgress(puzzle, restored).complete, true);
  assert.equal(restored.selectedCell, 17); assert.equal(restored.direction, 'down');
});

test('validation rejects malformed rows, invalid identities and missing or orphan clues', () => {
  const cases = [null, { ...puzzles[0], id: 123 }, { ...puzzles[0], version: 0 }, { ...puzzles[0], title: '' },
    { ...puzzles[0], rows: [] }, { ...puzzles[0], rows: ['CAT', 'DOG'] },
    { ...puzzles[0], rows: ['CAT', 'DOGS', 'WEB'] }, { ...puzzles[0], rows: ['cat', 'DOG', 'WEB'] }];
  for (const raw of cases) { assert.equal(validatePuzzle(raw).valid, false); assert.throws(() => compilePuzzle(raw), /Invalid crossword/); }
  const missing = structuredClone(puzzles[0]); delete missing.clues.across['2,0'];
  assert.ok(validatePuzzle(missing).errors.some(message => message.includes('Missing across clue')));
  const orphan = structuredClone(puzzles[0]); orphan.clues.across['0,0'] = 'Not a real entry.';
  assert.ok(validatePuzzle(orphan).errors.some(message => message.includes('Orphan across clue')));
});

test('validation rejects word squares with repeated across/down answers, unchecked letters and short fragments', () => {
  const square = { id: 'test', version: 1, title: 'Test', rows: ['CAT', 'ARE', 'TEN'], clues: {
    across: { '0,0': 'A clue.', '1,0': 'A clue.', '2,0': 'A clue.' }, down: { '0,0': 'A clue.', '0,1': 'A clue.', '0,2': 'A clue.' },
  } };
  assert.ok(validatePuzzle(square).errors.some(message => message.includes('Repeated answer')));
  const fragments = { ...square, rows: ['AB#', 'CD#', '###'], clues: {
    across: { '0,0': 'A clue.', '1,0': 'A clue.' }, down: { '0,0': 'A clue.', '0,1': 'A clue.' },
  } };
  assert.ok(validatePuzzle(fragments).errors.some(message => message.includes('fragment')));
  const unchecked = { ...square, rows: ['#CAT#', '##A##', '##R##'], clues: {
    across: { '0,1': 'A clue.' }, down: { '0,2': 'A clue.' },
  } };
  assert.ok(validatePuzzle(unchecked).errors.some(message => message.includes('both an across and a down')));
});

test('disconnected regions are rejected even if every cell has across and down associations', () => {
  const raw = { id: 'test', version: 1, title: 'Test', rows: ['CAT#DOG', 'ARE#ORE', 'TEN#WEB'], clues: {
    across: { '0,0': 'A clue.', '0,4': 'A clue.', '1,0': 'A clue.', '1,4': 'A clue.', '2,0': 'A clue.', '2,4': 'A clue.' },
    down: { '0,0': 'A clue.', '0,1': 'A clue.', '0,2': 'A clue.', '0,4': 'A clue.', '0,5': 'A clue.', '0,6': 'A clue.' },
  } };
  assert.ok(validatePuzzle(raw).errors.some(message => message.includes('connected grid')));
});

test('compilation and read-only checks never mutate the original bank or player state', () => {
  const before = structuredClone(puzzles), puzzle = first(), state = createCrosswordState(puzzle), stateBefore = structuredClone(state);
  crosswordProgress(puzzle, state); checkEntry(puzzle, state, 'across-1'); checkPuzzle(puzzle, state); serializeCrosswordState(puzzle, state);
  assert.deepEqual(puzzles, before); assert.deepEqual(state, stateBefore);
  const another = createCrosswordState(puzzle); another.letters[2] = 'S'; assert.equal(state.letters[2], '');
});
