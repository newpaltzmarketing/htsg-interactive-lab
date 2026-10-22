import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadShareConfig, validateShareConfig, shareFields, shareSiteURL, shareImageDetails,
  replaceShareBlock, validateShareHtml, SHARE_HTML_PAGES } from '../scripts/share-metadata.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const config = await loadShareConfig(resolve(root, 'public'));
const source = await readFile(resolve(root, 'public/index.html'), 'utf8');

test('every shareable route has complete fallback metadata and an actual PNG/JPEG cover', async () => {
  for (const [filename, key] of Object.entries(SHARE_HTML_PAGES)) {
    assert.ok(validateShareHtml(await readFile(resolve(root, 'public', filename), 'utf8'), shareFields(config, key), filename));
  }
  for (const key of ['invaders', 'runner', 'trivia']) {
    const fields = shareFields(config, key);
    assert.equal(new URL(fields.url).searchParams.get('game'), key);
    assert.equal(fields.image, shareFields(config, 'gallery').image);
    assert.ok(validateShareHtml(replaceShareBlock(source, fields), fields));
  }
  const image = await readFile(resolve(root, 'public', config.image.path));
  assert.deepEqual(shareImageDetails(image), { width: 1200, height: 630, type: 'image/jpeg', bytes: image.length });
  assert.equal(shareImageDetails(await readFile(resolve(root, 'public/assets/lab-share.png'))).type, 'image/png');
});

test('missing, duplicate, empty, or relative metadata fails the release gate', () => {
  const fields = shareFields(config, 'gallery');
  for (const broken of [
    source.replace('property="og:image"', 'property="missing:image"'),
    source.replace('name="twitter:image"', 'name="missing:image"'),
    source.replace(/(<meta property="og:image" content=")[^"]+/, '$1assets/relative.jpg'),
    source.replace(/(<meta name="twitter:title" content=")[^"]+/, '$1'),
    source.replace('</head>', '<link rel="canonical" href="https://invalid.example/"></head>'),
    source.replace('content="1200"', 'content="1"'),
  ]) assert.throws(() => validateShareHtml(broken, fields));
  assert.throws(() => replaceShareBlock('<html><head></head></html>', fields));
});

test('invalid page configuration, unsafe image paths and private credentials cannot become preview URLs', () => {
  for (const patch of [
    value => { delete value.pages.runner.description; },
    value => { value.pages.trivia.path = 'play.html?game=<script>'; },
    value => { delete value.pages.crossword; },
    value => { value.pages.crossword.path = 'play.html?game=crossword'; },
    value => { value.image.path = '../secret.png'; },
    value => { value.image.path = 'https://remote.example/cover.jpg'; },
    value => { value.image.width = 1; },
    value => { value.image.type = 'image/svg+xml'; },
  ]) {
    const changed = structuredClone(config); patch(changed);
    assert.throws(() => validateShareConfig(changed));
  }
  for (const url of ['http://example.com/', 'https://user:password@example.com/', 'https://example.com/?token=secret', 'https://example.com/#fragment']) {
    assert.throws(() => shareSiteURL(url));
  }
});

test('alternate static hosting rewrites all social URLs together and escapes configured text', () => {
  const changed = structuredClone(config);
  changed.pages.gallery.title = '<script>alert("preview")</script> & Lab';
  const fields = shareFields(changed, 'gallery', 'https://preview.example/lab/');
  const html = replaceShareBlock(source, fields);
  assert.ok(validateShareHtml(html, fields));
  assert.equal(fields.url, 'https://preview.example/lab/');
  assert.equal(fields.image, new URL(config.image.path, 'https://preview.example/lab/').href);
  assert.ok(!html.includes('<script>alert("preview")</script>'));
  const crossword = shareFields(config, 'crossword', 'https://preview.example/lab/');
  assert.equal(crossword.url, 'https://preview.example/lab/crossword.html');
  assert.equal(crossword.image, fields.image);
  assert.ok(validateShareHtml(replaceShareBlock(source, crossword), crossword));
});

test('missing covers, MIME mismatches and truncated or unsupported image bytes fail validation', async () => {
  const artifacts = resolve(root, 'artifacts'); await mkdir(artifacts, { recursive: true });
  const directory = await mkdtemp(resolve(artifacts, 'share-gate-unit-'));
  await mkdir(resolve(directory, 'assets'));
  await writeFile(resolve(directory, 'share.json'), JSON.stringify(config));
  await assert.rejects(loadShareConfig(directory));
  const changed = structuredClone(config); changed.image.type = 'image/png';
  await writeFile(resolve(directory, 'share.json'), JSON.stringify(changed));
  const image = await readFile(resolve(root, 'public', config.image.path));
  await writeFile(resolve(directory, config.image.path), image);
  await assert.rejects(loadShareConfig(directory), /MIME/);
  assert.throws(() => shareImageDetails(image.subarray(0, image.length - 2)), /complete PNG\/JPEG/);
  assert.throws(() => shareImageDetails(Buffer.from('<svg width="1200" height="630"/>')));
});
