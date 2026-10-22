import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadShareConfig, shareFields, replaceShareBlock, validateShareHtml, SHARE_HTML_PAGES } from './share-metadata.mjs';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const config = await loadShareConfig(root);
for (const [filename, key] of Object.entries(SHARE_HTML_PAGES)) {
  const path = resolve(root, filename);
  const fields = shareFields(config, key);
  const html = replaceShareBlock(await readFile(path, 'utf8'), fields);
  validateShareHtml(html, fields, filename);
  await writeFile(path, html);
}
console.log('Synchronized complete initial-HTML social metadata from public/share.json.');
