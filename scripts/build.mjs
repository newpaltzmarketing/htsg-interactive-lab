import { readdir, mkdir, readFile, writeFile, rm, lstat } from 'node:fs/promises';
import { resolve, relative, extname, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, 'public');
const destination = resolve(root, 'dist');
const extensions = new Set(['.html', '.css', '.js', '.json', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif', '.ico', '.txt', '.woff', '.woff2', '.mp3', '.ogg', '.wav']);
const exactFiles = new Set(['_headers', '_redirects']);
const files = [];
let siteURL;
if (process.env.SITE_URL) {
  const value = new URL(process.env.SITE_URL);
  if (value.protocol !== 'https:' || value.username || value.password || value.search || value.hash) {
    throw new Error('SITE_URL must be an HTTPS public site URL without credentials, query, or fragment');
  }
  siteURL = value.href.replace(/\/+$/, '');
}

async function collect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error(`Refusing a symbolic link in public/: ${relative(source, path)}`);
    if (entry.name.startsWith('.')) throw new Error(`Hidden files do not belong in public/: ${relative(source, path)}`);
    if (entry.isDirectory()) {
      if (entry.name === 'functions' || entry.name === 'node_modules') throw new Error(`Static build cannot include ${entry.name}/`);
      await collect(path);
    } else if (entry.isFile()) {
      if (entry.name === '_worker.js' || (!extensions.has(extname(entry.name)) && !exactFiles.has(entry.name))) {
        throw new Error(`File type not allowed in public/: ${relative(source, path)}`);
      }
      files.push(path);
    }
  }
}

await collect(source);
for (const required of ['index.html', 'play.html', '_headers']) await readFile(join(source, required));
const headerText = await readFile(join(source, '_headers'), 'utf8');
const policy = headerText.match(/^\s+Content-Security-Policy:\s*(.+)$/m)?.[1];
if (!policy) throw new Error('public/_headers must define Content-Security-Policy');
// GitHub Pages does not apply _headers. Share the same supported CSP directives
// through a meta tag; frame-ancestors still requires Cloudflare's HTTP header.
const metaPolicy = policy.split(';').map(value => value.trim()).filter(value => value && !/^(?:frame-ancestors|report-uri|sandbox)\b/i.test(value)).join('; ');
const policyTag = `<meta http-equiv="Content-Security-Policy" content="${metaPolicy.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}">`;
// Only the fixed project dist/ directory is ever replaced.
if (relative(root, destination) !== 'dist') throw new Error('Unexpected build output directory');
try {
  if ((await lstat(destination)).isSymbolicLink()) throw new Error('Refusing a linked dist/ directory');
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const manifest = {};
let size = 0;
for (const path of files.sort()) {
  const name = relative(source, path).replaceAll('\\', '/');
  const target = join(destination, name);
  let bytes = await readFile(path);
  if (name.endsWith('.html')) {
    let html = bytes.toString('utf8');
    if (/http-equiv=["']Content-Security-Policy["']/i.test(html)) throw new Error('Keep the shared CSP in public/_headers only');
    html = html.replace(/(<meta\s+charset=[^>]+>)/i, `$1\n  ${policyTag}`);
    if (!html.includes(policyTag)) throw new Error(`${name} needs a charset meta tag before styles and scripts`);
    if (siteURL) html = html.replace(/(<meta\s+property="og:image"\s+content=")([^\"]+)(")/g, (_, before, image, after) => {
        const url = new URL(image.replace(/^\/+/, ''), `${siteURL}/`).href;
        return `${before}${url.replaceAll('&', '&amp;')}${after}`;
      });
    bytes = Buffer.from(html);
  }
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, bytes);
  manifest[name] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  size += bytes.length;
}
await writeFile(join(destination, 'build-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built ${files.length} static files (${(size / 1024).toFixed(1)} KiB) into dist/.`);
