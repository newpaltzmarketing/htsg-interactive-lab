import { compilePuzzle, createCrosswordState, restoreCrosswordState, setCrosswordLetter, serializeCrosswordState, getEntry, entriesForCell, checkEntry, crosswordProgress } from './crossword-engine.js';
import { puzzles } from './crossword-puzzles.js';

const $ = id => document.getElementById(id);
const bank = puzzles.map(compilePuzzle);
const storagePrefix = 'htsg-crossword-v1:';
const lastPuzzleKey = 'htsg-crossword-last-v1';
const sessionProgress = new Map();
let puzzle, state, storageAvailable = null;
let incorrect = new Set(), checked = new Set(), revealed = new Set(), wasComplete = false;
const cells = new Map(), clueButtons = new Map();
function message(text, kind = '') { $('feedback').textContent = text; $('feedback').dataset.kind = kind; }
function save() {
  const serialized = serializeCrosswordState(puzzle, state);
  sessionProgress.set(puzzle.id, serialized);
  try {
    localStorage.setItem(storagePrefix + puzzle.id, serialized);
    localStorage.setItem(lastPuzzleKey, puzzle.id);
    storageAvailable = true;
  } catch { storageAvailable = false; }
  $('save-status').dataset.storage = storageAvailable ? 'saved' : 'blocked';
  const notice = storageAvailable ? 'Saved on this device.' : 'Saving is unavailable. Progress lasts while this page is open.';
  if ($('save-status').textContent !== notice) $('save-status').textContent = notice;
}
function activeEntry() { return entriesForCell(puzzle, state.selectedCell)[state.direction]; }
function focusCell() { cells.get(state.selectedCell)?.focus({ preventScroll: true }); }
function showEditor() {
  if (!matchMedia('(max-width: 600px), (orientation: landscape) and (max-height: 540px)').matches) return;
  const top = $('active-clue').getBoundingClientRect().top;
  const keysBottom = $('touch-keyboard').getBoundingClientRect().bottom;
  if (top < 8 || keysBottom > innerHeight - 8) $('active-clue').scrollIntoView({ block: 'start', behavior: 'instant' });
}
function chooseEntry(entry, focus = true) {
  if (!entry) return;
  const empty = entry.cells.find(index => !state.letters[index]);
  state = { ...state, selectedCell: empty ?? entry.cells[0], direction: entry.direction };
  paint(); save(); if (focus) { focusCell(); showEditor(); }
}
function chooseCell(index, toggle = false) {
  const entries = entriesForCell(puzzle, index);
  let direction = state.direction;
  if (toggle && index === state.selectedCell && entries.across && entries.down) direction = direction === 'across' ? 'down' : 'across';
  if (!entries[direction]) direction = entries.across ? 'across' : 'down';
  state = { ...state, selectedCell: index, direction }; paint(); save(); focusCell(); showEditor();
}
function nextEntry(offset = 1) {
  const current = activeEntry();
  const index = puzzle.entryList.findIndex(entry => entry.id === current.id);
  chooseEntry(puzzle.entryList[(index + offset + puzzle.entryList.length) % puzzle.entryList.length]);
}
function clearChecks(index) {
  const entries = entriesForCell(puzzle, index);
  for (const entry of [entries.across, entries.down].filter(Boolean)) {
    checked.delete(entry.id); entry.cells.forEach(cell => incorrect.delete(cell));
  }
}
function writeLetter(letter, advance = true) {
  if (!/^[A-Z]$/.test(letter)) return;
  const index = state.selectedCell, entry = activeEntry();
  clearChecks(index); revealed.delete(index);
  state = setCrosswordLetter(puzzle, state, index, letter);
  if (advance) { const position = entry.cells.indexOf(index); if (position < entry.cells.length - 1) state = { ...state, selectedCell: entry.cells[position + 1] }; }
  message(''); paint(); save(); focusCell(); showEditor();
}
function erase(backward = false) {
  const entry = activeEntry(); let index = state.selectedCell;
  if (backward && !state.letters[index]) { const position = entry.cells.indexOf(index); if (position > 0) index = entry.cells[position - 1]; }
  clearChecks(index); revealed.delete(index);
  state = setCrosswordLetter(puzzle, { ...state, selectedCell: index }, index, '');
  message(''); paint(); save(); focusCell(); showEditor();
}
function move(rowDelta, colDelta) {
  const current = puzzle.cells[state.selectedCell]; let row = current.row + rowDelta, col = current.col + colDelta;
  while (row >= 0 && row < puzzle.height && col >= 0 && col < puzzle.width) {
    const index = row * puzzle.width + col;
    if (!puzzle.cells[index].isBlock) { state = { ...state, direction: rowDelta ? 'down' : 'across' }; chooseCell(index); return; }
    row += rowDelta; col += colDelta;
  }
}
function paint() {
  const entry = activeEntry(), progress = crosswordProgress(puzzle, state);
  $('active-clue-label').textContent = `${entry.number} ${entry.direction === 'across' ? 'Across' : 'Down'}`;
  $('active-clue-text').textContent = `${entry.clue} (${entry.cells.length})`;
  $('letter-progress').textContent = `${progress.filled}/${progress.total} filled`;
  $('crossword-grid').classList.toggle('is-complete', progress.complete);
  for (const [index, button] of cells) {
    const cell = puzzle.cells[index], selected = index === state.selectedCell;
    button.querySelector('.cell-letter').textContent = state.letters[index] || '';
    button.tabIndex = selected ? 0 : -1;
    button.parentElement.setAttribute('aria-selected', String(selected));
    button.classList.toggle('selected-cell', selected); button.classList.toggle('active-entry', entry.cells.includes(index));
    button.classList.toggle('incorrect-cell', incorrect.has(index)); button.classList.toggle('revealed-cell', revealed.has(index));
    button.classList.toggle('checked-cell', progress.complete || [...checked].some(id => getEntry(puzzle, id).cells.includes(index)));
    const relevant = entriesForCell(puzzle, index)[state.direction] || entriesForCell(puzzle, index).across || entriesForCell(puzzle, index).down;
    button.setAttribute('aria-label', `Row ${cell.row + 1}, column ${cell.col + 1}. ${relevant.number} ${relevant.direction}, ${relevant.cells.length} letters. ${state.letters[index] || 'Blank'}${incorrect.has(index) ? '. Needs another look' : ''}${revealed.has(index) ? '. Revealed' : ''}.`);
  }
  for (const item of puzzle.entryList) { const button = clueButtons.get(item.id); button.setAttribute('aria-current', String(item.id === entry.id)); button.classList.toggle('is-correct', progress.complete || checked.has(item.id)); }
  $('completion').hidden = !progress.complete;
  if (progress.complete && !wasComplete) message('Puzzle complete. Every letter is correct. Try another mini whenever you like.');
  wasComplete = progress.complete;
}
function buildGrid() {
  cells.clear(); clueButtons.clear(); $('crossword-grid').replaceChildren();
  $('crossword-grid').style.setProperty('--columns', puzzle.width);
  $('crossword-grid').setAttribute('aria-rowcount', puzzle.height); $('crossword-grid').setAttribute('aria-colcount', puzzle.width);
  $('crossword-grid').setAttribute('aria-label', `${puzzle.title}, ${puzzle.width} by ${puzzle.height} crossword`);
  for (let row = 0; row < puzzle.height; row++) {
    const line = document.createElement('div'); line.className = 'crossword-row'; line.setAttribute('role', 'row'); line.setAttribute('aria-rowindex', row + 1);
    for (let col = 0; col < puzzle.width; col++) {
      const cell = puzzle.cells[row * puzzle.width + col], slot = document.createElement('div'); slot.className = 'cell-slot'; slot.setAttribute('role', 'gridcell'); slot.setAttribute('aria-colindex', col + 1);
      if (cell.isBlock) { slot.setAttribute('aria-label', 'Blocked square'); slot.classList.add('block-slot'); }
      else {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'crossword-cell'; button.dataset.index = cell.index; button.setAttribute('aria-describedby', 'active-clue-text');
        const number = document.createElement('span'), letter = document.createElement('span'); number.className = 'cell-number'; number.textContent = cell.number || ''; number.setAttribute('aria-hidden', 'true'); letter.className = 'cell-letter'; letter.setAttribute('aria-hidden', 'true'); button.append(number, letter);
        button.addEventListener('click', () => chooseCell(cell.index, true)); cells.set(cell.index, button); slot.append(button);
      }
      line.append(slot);
    }
    $('crossword-grid').append(line);
  }
  for (const direction of ['across', 'down']) {
    const list = $(direction + '-clues'); list.replaceChildren();
    for (const entry of puzzle.entries[direction]) {
      const item = document.createElement('li'), button = document.createElement('button'), number = document.createElement('strong'), text = document.createElement('span'), length = document.createElement('span');
      button.type = 'button'; button.className = 'clue-button'; button.dataset.entry = entry.id;
      number.textContent = entry.number; text.textContent = entry.clue + ' '; length.textContent = `(${entry.cells.length})`; length.className = 'clue-length'; text.append(length); button.append(number, text); button.addEventListener('click', () => chooseEntry(entry));
      item.append(button); list.append(item); clueButtons.set(entry.id, button);
    }
  }
  $('crossword-grid').dataset.ready = 'true';
}
function loadPuzzle(id, focus = false) {
  puzzle = bank.find(item => item.id === id) || bank[0]; let stored;
  try { stored = sessionProgress.get(puzzle.id) ?? localStorage.getItem(storagePrefix + puzzle.id); } catch { storageAvailable = false; }
  state = restoreCrosswordState(puzzle, stored);
  incorrect = new Set(); checked = new Set(); revealed = new Set(); wasComplete = false;
  $('puzzle-picker').value = puzzle.id; $('puzzle-description').textContent = puzzle.description; $('clear-confirm').hidden = true;
  buildGrid(); message('Choose a clue or a square to begin.'); paint(); save(); if (focus) focusCell();
}
for (const item of bank) { const option = document.createElement('option'); option.value = item.id; option.textContent = item.title; $('puzzle-picker').append(option); }
$('puzzle-picker').addEventListener('change', event => loadPuzzle(event.target.value, true));
$('previous-clue').addEventListener('click', () => nextEntry(-1)); $('next-clue').addEventListener('click', () => nextEntry());
for (const letters of ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM']) {
  const row = document.createElement('div'); row.className = 'keyboard-row';
  for (const letter of letters) { const button = document.createElement('button'); button.type = 'button'; button.textContent = letter; button.dataset.letter = letter; button.setAttribute('aria-label', `Enter ${letter}`); button.addEventListener('click', () => writeLetter(letter)); row.append(button); }
  if (letters === 'ZXCVBNM') { const button = document.createElement('button'); button.type = 'button'; button.textContent = 'Erase'; button.className = 'erase-key'; button.addEventListener('click', () => erase(true)); row.append(button); }
  $('touch-keyboard').append(row);
}
$('crossword-grid').addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (/^[a-z]$/i.test(event.key)) { event.preventDefault(); writeLetter(event.key.toUpperCase()); return; }
  const actions = { ArrowLeft: () => move(0,-1), ArrowRight: () => move(0,1), ArrowUp: () => move(-1,0), ArrowDown: () => move(1,0), Backspace: () => erase(true), Delete: () => erase(), ' ': () => chooseCell(state.selectedCell,true), Enter: () => nextEntry(event.shiftKey ? -1 : 1) };
  if (actions[event.key]) { event.preventDefault(); actions[event.key](); }
});
$('check-word').addEventListener('click', () => {
  const entry = activeEntry(), result = checkEntry(puzzle, state, entry.id); entry.cells.forEach(index => incorrect.delete(index));
  if (result.isCorrect) { checked.add(entry.id); message(`${entry.number} ${entry.direction} is correct.`); }
  else { checked.delete(entry.id); result.incorrectCells.forEach(index => incorrect.add(index)); const wrong = result.incorrectCells.length, empty = result.emptyCells.length; message(`${entry.number} ${entry.direction}: ${[wrong ? `${wrong} ${wrong === 1 ? 'letter needs' : 'letters need'} another look` : '', empty ? `${empty} ${empty === 1 ? 'square is' : 'squares are'} empty` : ''].filter(Boolean).join('; ')}.`, 'incorrect'); }
  paint();
});
$('reveal-letter').addEventListener('click', () => { const index = state.selectedCell; clearChecks(index); state = setCrosswordLetter(puzzle,state,index,puzzle.cells[index].solution); revealed.add(index); message(`Revealed ${puzzle.cells[index].solution} in row ${puzzle.cells[index].row + 1}, column ${puzzle.cells[index].col + 1}.`); paint(); save(); });
$('clear-puzzle').addEventListener('click', () => { $('clear-confirm').hidden = false; $('cancel-clear').focus({preventScroll:true}); });
function cancelClear() { $('clear-confirm').hidden = true; $('clear-puzzle').focus({preventScroll:true}); }
$('cancel-clear').addEventListener('click', cancelClear);
$('confirm-clear').addEventListener('click', () => { state = createCrosswordState(puzzle); incorrect.clear(); checked.clear(); revealed.clear(); wasComplete = false; $('clear-confirm').hidden = true; message('This puzzle is clear. Ready for a fresh start.'); paint(); save(); focusCell(); });
$('next-puzzle').addEventListener('click', () => loadPuzzle(bank[(bank.findIndex(item => item.id === puzzle.id) + 1) % bank.length].id,true));
document.addEventListener('keydown', event => { if (event.key !== 'Escape') return; if (!$('clear-confirm').hidden) { event.preventDefault(); cancelClear(); } else if ($('game-picker').open) { $('game-picker').open = false; $('game-picker').querySelector('summary').focus(); } });
document.addEventListener('pointerdown', event => { if (!$('game-picker').contains(event.target)) $('game-picker').open = false; });
document.querySelector('.skip-link').addEventListener('click', event => { event.preventDefault(); focusCell(); showEditor(); });
document.querySelector('.help-link').addEventListener('click', () => { $('how-to-play').open = true; });
let last; try { last = localStorage.getItem(lastPuzzleKey); } catch { storageAvailable = false; }
loadPuzzle(new URLSearchParams(location.search).get('puzzle') || last);
