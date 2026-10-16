import { readdir, readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateRawSync } from 'node:zlib';
import { createHash } from 'node:crypto';

const root = fileURLToPath(new URL('../', import.meta.url));
const release = resolve(root, 'release');
const table = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = table[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
async function collect(base, directory = base) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if ((await lstat(path)).isSymbolicLink()) throw new Error(`Cannot package a symbolic link: ${path}`);
    if (entry.isDirectory()) files.push(...await collect(base, path));
    else if (entry.isFile()) files.push({ name: relative(base, path).replaceAll('\\', '/'), bytes: await readFile(path) });
  }
  return files;
}
function zip(files) {
  const chunks = [];
  const directory = [];
  let offset = 0;
  for (const file of files.sort((a, b) => a.name.localeCompare(b.name))) {
    const name = Buffer.from(file.name, 'utf8');
    const compressed = deflateRawSync(file.bytes, { level: 9 });
    const checksum = crc32(file.bytes);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(8, 8);
    header.writeUInt16LE(33, 12); // Stable ZIP date: 1980-01-01.
    header.writeUInt32LE(checksum, 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(file.bytes.length, 22);
    header.writeUInt16LE(name.length, 26);
    chunks.push(header, name, compressed);
    const record = Buffer.alloc(46);
    record.writeUInt32LE(0x02014b50, 0);
    record.writeUInt16LE(20, 4);
    record.writeUInt16LE(20, 6);
    record.writeUInt16LE(0x0800, 8);
    record.writeUInt16LE(8, 10);
    record.writeUInt16LE(33, 14);
    record.writeUInt32LE(checksum, 16);
    record.writeUInt32LE(compressed.length, 20);
    record.writeUInt32LE(file.bytes.length, 24);
    record.writeUInt16LE(name.length, 28);
    record.writeUInt32LE(offset, 42);
    directory.push(record, name);
    offset += header.length + name.length + compressed.length;
  }
  const directoryLength = directory.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directoryLength, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...chunks, ...directory, end]);
}

const deployed = await collect(resolve(root, 'dist'));
for (const required of ['index.html', 'play.html', '404.html', '_headers', 'build-manifest.json']) {
  if (!deployed.some(file => file.name === required)) throw new Error(`Build dist/ before packaging: missing ${required}`);
}
const sources = [];
for (const directory of ['public', 'scripts', 'tests', 'docs', '.github']) {
  for (const file of await collect(resolve(root, directory))) sources.push({ ...file, name: `${directory}/${file.name}` });
}
for (const name of ['package.json', 'package-lock.json', 'README.md', '.gitignore', '.gitattributes', 'wrangler.toml']) {
  sources.push({ name, bytes: await readFile(resolve(root, name)) });
}
await mkdir(release, { recursive: true });
const sums = [];
for (const [name, files] of [['htsg-interactive-lab-deploy.zip', deployed], ['htsg-interactive-lab-source.zip', sources]]) {
  const bytes = zip(files);
  await writeFile(resolve(release, name), bytes);
  sums.push(`${createHash('sha256').update(bytes).digest('hex')}  ${name}`);
  console.log(`${name}: ${files.length} files, ${(bytes.length / 1024).toFixed(1)} KiB`);
}
await writeFile(resolve(release, 'SHA256SUMS.txt'), `${sums.join('\n')}\n`);
