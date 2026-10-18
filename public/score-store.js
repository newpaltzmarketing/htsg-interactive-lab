// One optional first-party record. Gameplay works when browser storage is blocked.
const key = 'htsg.agency-invaders.personal-best.v1';
const scoreValue = value => Number.isFinite(value) && value > 0 && value <= 999999999 ? Math.floor(value) : 0;

export function readPersonalBest(storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    return scoreValue(Number(target.getItem(key)));
  } catch { return 0; }
}

export function savePersonalBest(score, storage) {
  const value = scoreValue(score);
  const previous = readPersonalBest(storage);
  const best = Math.max(previous, value);
  if (value > previous) {
    try { (storage ?? globalThis.localStorage).setItem(key, String(best)); }
    catch { /* The current run still displays its best score without persistence. */ }
  }
  return best;
}
