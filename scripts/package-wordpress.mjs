import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { collectFiles, createZip } from './archive.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const siteURL = 'https://holistictechsolutionsgroup.com/demos/interactive-lab/';
const built = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, env: { ...process.env, SITE_URL: siteURL }, stdio: 'inherit' });
if (built.status !== 0) process.exit(built.status || 1);
const html = await readFile(resolve(root, 'dist/404.html'), 'utf8');
if (!html.includes('href="/demos/interactive-lab/index.html"') || !html.includes('href="/demos/interactive-lab/style.css"')) {
  throw new Error('The WordPress package must use the Gamification Labs path for its missing-page links');
}
const entrypoint = 'htsg-interactive-lab.php';
const plugin = await readFile(resolve(root, 'wordpress/htsg-interactive-lab', entrypoint));
const version = plugin.toString('utf8').match(/^\s*\* Version:\s*(\d+\.\d+\.\d+)\s*$/m)?.[1];
if (!version) throw new Error('The WordPress companion needs a numeric release version');
const projectVersion = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')).version;
if (version !== projectVersion) throw new Error('Project and WordPress release versions must match');
const files = [{ name: `htsg-interactive-lab/${entrypoint}`, bytes: plugin }];
for (const file of await collectFiles(resolve(root, 'dist'))) files.push({ ...file, name: `htsg-interactive-lab/site/${file.name}` });
const bytes = createZip(files);
const release = resolve(root, 'release');
await mkdir(release, { recursive: true });
const filename = `htsg-interactive-lab-wordpress-${version}.zip`;
await writeFile(resolve(release, filename), bytes);
await writeFile(resolve(release, `${filename}.sha256`), `${createHash('sha256').update(bytes).digest('hex')}  ${filename}\n`);
console.log(`${filename}: ${files.length} files, ${(bytes.length / 1024).toFixed(1)} KiB, ${siteURL}`);
