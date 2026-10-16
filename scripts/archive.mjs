import { readdir, readFile, lstat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { deflateRawSync } from 'node:zlib';

const table = Array.from({ length: 256 }, (_, value) => {
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});
function crc32(bytes) {
  let value = 0xffffffff;
  for (const byte of bytes) value = table[(value ^ byte) & 0xff] ^ (value >>> 8);
  return (value ^ 0xffffffff) >>> 0;
}
export async function collectFiles(base, directory = base) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if ((await lstat(path)).isSymbolicLink()) throw new Error(`Cannot package a symbolic link: ${path}`);
    if (entry.isDirectory()) files.push(...await collectFiles(base, path));
    else if (entry.isFile()) files.push({ name: relative(base, path).replaceAll('\\', '/'), bytes: await readFile(path) });
  }
  return files;
}
export function createZip(files) {
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
    header.writeUInt16LE(33, 12);
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
