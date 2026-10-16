import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { collectFiles, createZip } from './archive.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const release = resolve(root, 'release');
const deployed = await collectFiles(resolve(root, 'dist'));
for (const required of ['index.html', 'play.html', '404.html', '_headers', 'build-manifest.json']) {
  if (!deployed.some(file => file.name === required)) throw new Error(`Build dist/ before packaging: missing ${required}`);
}
const sources = [];
for (const directory of ['public', 'scripts', 'tests', 'docs', '.github', 'wordpress', 'artwork']) {
  for (const file of await collectFiles(resolve(root, directory))) sources.push({ ...file, name: `${directory}/${file.name}` });
}
for (const name of ['package.json', 'package-lock.json', 'README.md', '.gitignore', '.gitattributes', 'wrangler.toml']) {
  sources.push({ name, bytes: await readFile(resolve(root, name)) });
}
await mkdir(release, { recursive: true });
const sums = [];
for (const [name, files] of [['htsg-interactive-lab-deploy.zip', deployed], ['htsg-interactive-lab-source.zip', sources]]) {
  const bytes = createZip(files);
  await writeFile(resolve(release, name), bytes);
  sums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${name}`);
  console.log(`${name}: ${files.length} files, ${(bytes.length / 1024).toFixed(1)} KiB`);
}
await writeFile(resolve(release, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
