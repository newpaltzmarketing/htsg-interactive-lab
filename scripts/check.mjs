import { readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadShareConfig, shareFields, validateShareHtml } from './share-metadata.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
let checked = 0;
async function check(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) { await check(path); continue; }
    if (!/\.(?:js|mjs)$/.test(entry.name)) continue;
    const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
    if (result.status !== 0) throw new Error(result.stderr || `Syntax check failed: ${path}`);
    checked += 1;
  }
}
await check(resolve(root, 'public'));
await check(resolve(root, 'scripts'));
const shareConfig = await loadShareConfig(resolve(root, 'public'));
for (const name of ['index.html', 'play.html']) {
  const html = await readFile(resolve(root, 'public', name), 'utf8');
  validateShareHtml(html, shareFields(shareConfig, name === 'index.html' ? 'gallery' : 'play'), name);
  if (!/<html[^>]+lang="en"/.test(html) || !/name="viewport"/.test(html)) throw new Error(`${name}: missing language or viewport`);
  for (const match of html.matchAll(/(?:src|href)="([^"#?]+)(?:[?#][^"]*)?"/g)) {
    const value = match[1];
    if (/^(?:[a-z]+:|\/\/)/i.test(value)) continue;
    const path = resolve(root, 'public', value.replace(/^\//, ''));
    await readFile(path);
  }
}
console.log(`Checked ${checked} JavaScript files, both HTML entry points, complete social metadata, and the 1200 x 630 cover.`);
