import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, relative, extname, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
function option(name, fallback) {
  const position = args.indexOf(name);
  if (position === -1) return fallback;
  if (!args[position + 1]) throw new Error(`Missing value for ${name}`);
  return args[position + 1];
}
const root = fileURLToPath(new URL('../', import.meta.url));
const directory = option('--dir', 'public');
if (!['public', 'dist'].includes(directory)) throw new Error('--dir must be public or dist');
const base = await realpath(resolve(root, directory));
const port = Number(option('--port', process.env.PORT || '4173'));
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid port');
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav'
};
const headers = {};
for (const line of (await readFile(resolve(base, '_headers'), 'utf8')).split(/\r?\n/)) {
  const match = line.match(/^\s+([^:]+):\s*(.+)$/);
  if (match) headers[match[1]] = match[2];
}
function inside(path) {
  const name = relative(base, path);
  return name !== '..' && !name.startsWith(`..${process.platform === 'win32' ? '\\' : '/'}`) && !isAbsolute(name);
}
async function notFound(response, method) {
  let page;
  try { page = await readFile(resolve(base, '404.html')); }
  catch { page = Buffer.from('Not found'); }
  response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Length': page.length });
  response.end(method === 'HEAD' ? undefined : page);
}
const server = http.createServer(async (request, response) => {
  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    return response.end('Method not allowed');
  }
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.includes('\\') || pathname.split('/').some(segment => segment.startsWith('.') || segment.startsWith('_'))) {
      return notFound(response, request.method);
    }
    if (pathname.endsWith('/')) pathname += 'index.html';
    const target = resolve(base, `.${pathname}`);
    if (!inside(target)) return notFound(response, request.method);
    const actual = await realpath(target);
    if (!inside(actual) || !(await stat(actual)).isFile()) return notFound(response, request.method);
    const content = await readFile(actual);
    response.writeHead(200, { 'Content-Type': types[extname(actual)] || 'application/octet-stream', 'Content-Length': content.length, 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : content);
  } catch (error) {
    const invalid = error instanceof URIError;
    if (invalid) { response.writeHead(400); response.end('Invalid URL'); }
    else await notFound(response, request.method);
  }
});
server.listen(port, '127.0.0.1', () => console.log(`HTSG Gamification Labs: http://127.0.0.1:${port} (${directory}/)`));
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
