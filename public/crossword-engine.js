// Original crossword rules. No DOM, clocks, network or browser storage.
const DIRECTIONS = ['across', 'down'];
const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
const text = value => typeof value === 'string' ? value.trim() : '';
const letter = value => typeof value === 'string' && /^[a-z]$/i.test(value) ? value.toUpperCase() : '';

function inspect(definition) {
  const errors = [];
  if (!definition || typeof definition !== 'object') return { errors: ['Puzzle must be an object.'] };
  if (typeof definition.id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(definition.id)) errors.push('Puzzle needs a stable lowercase ID.');
  if (!Number.isSafeInteger(definition.version) || definition.version < 1) errors.push('Puzzle version must be a positive integer.');
  if (!text(definition.title)) errors.push('Puzzle needs a title.');
  const rows = definition.rows;
  if (!Array.isArray(rows) || rows.length < 3 || rows.length > 15 || rows.some(row => typeof row !== 'string')) {
    return { errors: [...errors, 'Puzzle rows must contain 3–15 answer strings.'] };
  }
  const width = rows[0].length, height = rows.length;
  if (width < 3 || width > 15 || rows.some(row => row.length !== width || !/^[A-Z#]+$/.test(row))) {
    return { errors: [...errors, 'Rows must have equal width and use only uppercase letters or #.'] };
  }
  const cells = rows.join('').split('').map((solution, index) => ({ index, row: Math.floor(index / width), col: index % width,
    isBlock: solution === '#', solution: solution === '#' ? '' : solution, number: null, acrossId: null, downId: null }));
  const entries = { across: [], down: [] }, entryList = [];
  let number = 0;
  for (const cell of cells) {
    if (cell.isBlock) continue;
    const starts = DIRECTIONS.filter(direction => direction === 'across'
      ? (cell.col === 0 || cells[cell.index - 1].isBlock) && cell.col + 1 < width && !cells[cell.index + 1].isBlock
      : (cell.row === 0 || cells[cell.index - width].isBlock) && cell.row + 1 < height && !cells[cell.index + width].isBlock);
    if (starts.length) cell.number = ++number;
    for (const direction of starts) {
      const indices = [];
      for (let row = cell.row, col = cell.col; row < height && col < width && !cells[row * width + col].isBlock;
        direction === 'across' ? col += 1 : row += 1) indices.push(row * width + col);
      const key = `${cell.row},${cell.col}`;
      const clueMap = definition.clues?.[direction];
      const clue = clueMap && typeof clueMap === 'object' && own(clueMap, key) ? text(clueMap[key]) : '';
      const entry = { id: `${direction}-${cell.number}`, number: cell.number, direction, row: cell.row, col: cell.col,
        answer: indices.map(index => cells[index].solution).join(''), clue, cells: indices };
      if (indices.length < 3) errors.push(`${direction} at ${key} is a fragment shorter than three letters.`);
      if (!clue) errors.push(`Missing ${direction} clue at ${key}.`);
      entries[direction].push(entry); entryList.push(entry);
      for (const index of indices) cells[index][`${direction}Id`] = entry.id;
    }
  }
  const open = cells.filter(cell => !cell.isBlock);
  if (!open.length) errors.push('Puzzle has no letter cells.');
  for (const cell of open) if (!cell.acrossId || !cell.downId) errors.push(`Cell ${cell.row},${cell.col} must belong to both an across and a down entry.`);
  const answers = new Set();
  for (const entry of entryList) {
    if (answers.has(entry.answer)) errors.push(`Repeated answer: ${entry.answer}.`);
    answers.add(entry.answer);
  }
  for (const direction of DIRECTIONS) {
    const clues = definition.clues?.[direction];
    if (!clues || typeof clues !== 'object' || Array.isArray(clues)) { errors.push(`Missing ${direction} clue map.`); continue; }
    const starts = new Set(entries[direction].map(entry => `${entry.row},${entry.col}`));
    for (const key of Object.keys(clues)) if (!starts.has(key)) errors.push(`Orphan ${direction} clue at ${key}.`);
  }
  if (open.length) {
    const visited = new Set([open[0].index]), pending = [open[0].index];
    while (pending.length) {
      const cell = cells[pending.pop()];
      for (const [row, col] of [[cell.row - 1, cell.col], [cell.row + 1, cell.col], [cell.row, cell.col - 1], [cell.row, cell.col + 1]]) {
        const next = row * width + col;
        if (row >= 0 && row < height && col >= 0 && col < width && !cells[next].isBlock && !visited.has(next)) { visited.add(next); pending.push(next); }
      }
    }
    if (visited.size !== open.length) errors.push('All letter cells must form one connected grid.');
  }
  return { errors, puzzle: { id: definition.id, version: definition.version, title: text(definition.title), description: text(definition.description),
    width, height, cells, entries, entryList } };
}

export function validatePuzzle(definition) {
  const { errors } = inspect(definition);
  return { valid: errors.length === 0, errors };
}

export function compilePuzzle(definition) {
  const { errors, puzzle } = inspect(definition);
  if (errors.length) throw new Error(`Invalid crossword: ${errors.join(' ')}`);
  return puzzle;
}

export function getEntry(puzzle, id) { return puzzle.entryList.find(entry => entry.id === id) || null; }
export function entriesForCell(puzzle, index) {
  const cell = Number.isInteger(index) ? puzzle.cells[index] : null;
  return { across: cell?.acrossId ? getEntry(puzzle, cell.acrossId) : null, down: cell?.downId ? getEntry(puzzle, cell.downId) : null };
}

export function createCrosswordState(puzzle) {
  const first = puzzle.cells.find(cell => !cell.isBlock);
  return { schemaVersion: 1, puzzleId: puzzle.id, puzzleVersion: puzzle.version,
    letters: puzzle.cells.map(() => ''), selectedCell: first.index, direction: 'across' };
}

export function restoreCrosswordState(puzzle, stored) {
  const fresh = createCrosswordState(puzzle);
  let value = stored;
  if (typeof value === 'string') { try { value = JSON.parse(value); } catch { return fresh; } }
  if (!value || typeof value !== 'object' || value.schemaVersion !== 1 || value.puzzleId !== puzzle.id || value.puzzleVersion !== puzzle.version ||
    !Array.isArray(value.letters) || value.letters.length !== puzzle.cells.length) return fresh;
  const letters = puzzle.cells.map(cell => cell.isBlock ? '' : letter(value.letters[cell.index]));
  const selectedCell = Number.isInteger(value.selectedCell) && puzzle.cells[value.selectedCell] && !puzzle.cells[value.selectedCell].isBlock
    ? value.selectedCell : fresh.selectedCell;
  const direction = DIRECTIONS.includes(value.direction) ? value.direction : 'across';
  return { ...fresh, letters, selectedCell, direction };
}

export function serializeCrosswordState(puzzle, state) { return JSON.stringify(restoreCrosswordState(puzzle, state)); }

export function setCrosswordLetter(puzzle, state, index, value) {
  if (!Number.isInteger(index) || !puzzle.cells[index] || puzzle.cells[index].isBlock) return state;
  const next = restoreCrosswordState(puzzle, state);
  next.letters[index] = letter(value);
  return next;
}

function evaluateCells(puzzle, state, indices) {
  const incorrectCells = [], emptyCells = [];
  let correct = 0;
  for (const index of indices) {
    const entered = letter(state?.letters?.[index]);
    if (!entered) emptyCells.push(index);
    else if (entered === puzzle.cells[index].solution) correct += 1;
    else incorrectCells.push(index);
  }
  return { filled: indices.length - emptyCells.length, total: indices.length, correct, incorrectCells, emptyCells };
}

export function checkEntry(puzzle, state, entryId) {
  const entry = getEntry(puzzle, entryId);
  if (!entry) return null;
  const result = evaluateCells(puzzle, state, entry.cells);
  return { entryId, ...result, isFilled: result.filled === result.total, isCorrect: result.correct === result.total };
}

export function checkPuzzle(puzzle, state) {
  const result = evaluateCells(puzzle, state, puzzle.cells.filter(cell => !cell.isBlock).map(cell => cell.index));
  return { ...result, percent: Math.floor(result.filled / result.total * 100), complete: result.correct === result.total };
}

export function crosswordProgress(puzzle, state) {
  const { filled, total, correct, percent, complete } = checkPuzzle(puzzle, state);
  return { filled, total, correct, percent, complete };
}
