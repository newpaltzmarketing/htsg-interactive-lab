// Cosmetic presets only. Appearance never changes simulation or collision rules.
export const SHIP_STYLES = Object.freeze([
  { id: 'studio', name: 'Studio', description: 'Swept wings and a bright central cockpit.' },
  { id: 'relay', name: 'Relay', description: 'Twin booms with a connected central cabin.' },
  { id: 'fixer', name: 'Fixer', description: 'A rounded workshop shuttle with sturdy side pods.' },
].map(Object.freeze));
export const SHIP_PALETTES = Object.freeze([
  { id: 'orange', name: 'Orange', body: '#ef923e', light: '#ffe0a3', dark: '#914519' },
  { id: 'blue', name: 'Blue', body: '#558fe3', light: '#c4eaff', dark: '#254e92' },
  { id: 'teal', name: 'Teal', body: '#38b6a6', light: '#c4fff0', dark: '#176b69' },
  { id: 'violet', name: 'Violet', body: '#a787dc', light: '#eee0ff', dark: '#634796' },
  { id: 'white', name: 'White', body: '#dce5ed', light: '#ffffff', dark: '#748a9e' },
  { id: 'graphite', name: 'Graphite', body: '#64798d', light: '#d0e3f3', dark: '#304859' },
].map(Object.freeze));
const key = 'htsg-invaders-ship-v1';
export function normalizeShipAppearance(value) {
  return {
    style: SHIP_STYLES.some(item => item.id === value?.style) ? value.style : 'studio',
    color: SHIP_PALETTES.some(item => item.id === value?.color) ? value.color : 'orange',
  };
}
export function readShipAppearance(storage) {
  try { return normalizeShipAppearance(JSON.parse((storage ?? globalThis.localStorage)?.getItem(key) || 'null')); }
  catch { return normalizeShipAppearance(null); }
}
export function saveShipAppearance(value, storage) {
  try {
    const target = storage ?? globalThis.localStorage;
    if (!target) return false;
    target.setItem(key, JSON.stringify(normalizeShipAppearance(value)));
    return true;
  } catch { return false; }
}
