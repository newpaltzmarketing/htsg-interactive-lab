import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

export const SHARE_START = '<!-- HTSG social:start -->';
export const SHARE_END = '<!-- HTSG social:end -->';
const paths = Object.freeze({ gallery: '', play: 'play.html', invaders: 'play.html?game=invaders', runner: 'play.html?game=runner', trivia: 'play.html?game=trivia', crossword: 'crossword.html' });
export const SHARE_HTML_PAGES = Object.freeze({ 'index.html': 'gallery', 'play.html': 'play', 'crossword.html': 'crossword' });
const text = value => typeof value === 'string' && value.trim().length > 0;
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const decode = value => value.replace(/&(?:amp|quot|lt|gt|#39);/g, entity => ({ '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&#39;': "'" })[entity]);

export function shareSiteURL(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) throw new Error('Social SITE_URL must be HTTPS without credentials, query, or fragment');
  return `${url.href.replace(/\/+$/, '')}/`;
}

export function validateShareConfig(config) {
  shareSiteURL(config?.site_url);
  if (!text(config.site_name) || !text(config.locale)) throw new Error('Social configuration needs site name and locale');
  if (!/^assets\/[a-z0-9][a-z0-9.-]*\.(?:png|jpg|jpeg)$/i.test(config.image?.path || '') || config.image.path.includes('..')) throw new Error('Social image must be a local PNG/JPEG in assets/');
  if (config.image.width !== 1200 || config.image.height !== 630 || !['image/jpeg', 'image/png'].includes(config.image.type) || !text(config.image.alt)) throw new Error('Social cover needs 1200 x 630 dimensions, a supported type, and alternative text');
  if (config.image.type !== (/\.png$/i.test(config.image.path) ? 'image/png' : 'image/jpeg')) throw new Error('Social cover extension and MIME type must agree');
  for (const [key, path] of Object.entries(paths)) {
    const page = config.pages?.[key];
    if (!text(page?.title) || !text(page?.description) || page.path !== path) throw new Error(`Social configuration is incomplete for ${key}`);
  }
  return config;
}

export function shareImageDetails(bytes) {
  const png = Buffer.from([137,80,78,71,13,10,26,10]);
  if (bytes.length >= 45 && bytes.subarray(0, 8).equals(png) && bytes.toString('ascii', 12, 16) === 'IHDR' && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND') {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), type: 'image/png', bytes: bytes.length };
  }
  if (bytes.length >= 20 && bytes.readUInt16BE(0) === 0xffd8 && bytes.readUInt16BE(bytes.length - 2) === 0xffd9) {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset++] !== 0xff) break;
      while (bytes[offset] === 0xff) offset += 1;
      const marker = bytes[offset++];
      if (marker === 0xda || marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      const size = bytes.readUInt16BE(offset);
      if (size < 2 || offset + size > bytes.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker) && size >= 8) {
        return { width: bytes.readUInt16BE(offset + 5), height: bytes.readUInt16BE(offset + 3), type: 'image/jpeg', bytes: bytes.length };
      }
      offset += size;
    }
  }
  throw new Error('Social cover is not a complete PNG/JPEG with readable dimensions');
}

export async function loadShareConfig(directory) {
  const config = validateShareConfig(JSON.parse(await readFile(resolve(directory, 'share.json'), 'utf8')));
  const path = resolve(directory, config.image.path);
  if (!path.startsWith(resolve(directory) + sep)) throw new Error('Social image escaped the static site');
  const details = shareImageDetails(await readFile(path));
  if (details.width !== config.image.width || details.height !== config.image.height || details.type !== config.image.type || details.bytes > 1_000_000) throw new Error('Social cover dimensions, MIME type, or 1 MB project budget do not match configuration');
  return config;
}

export function shareFields(config, key, siteURL = config.site_url) {
  validateShareConfig(config);
  const page = config.pages[key];
  if (!page) throw new Error(`Unknown social page ${key}`);
  const base = shareSiteURL(siteURL);
  return { ...page, url: new URL(page.path, base).href, image: new URL(config.image.path, base).href,
    imageType: config.image.type, imageWidth: config.image.width, imageHeight: config.image.height,
    imageAlt: config.image.alt, siteName: config.site_name, locale: config.locale };
}

export function renderShareBlock(fields) {
  const meta = (attribute, key, value) => `  <meta ${attribute}="${key}" content="${escape(value)}">`;
  return `${SHARE_START}\n  <title>${escape(fields.title)}</title>\n${[
    meta('name', 'description', fields.description),
    meta('name', 'robots', 'index,follow,max-image-preview:large'),
    meta('property', 'og:title', fields.title), meta('property', 'og:description', fields.description),
    meta('property', 'og:type', 'website'), meta('property', 'og:site_name', fields.siteName),
    meta('property', 'og:locale', fields.locale), meta('property', 'og:url', fields.url),
    meta('property', 'og:image', fields.image), meta('property', 'og:image:secure_url', fields.image),
    meta('property', 'og:image:type', fields.imageType), meta('property', 'og:image:width', fields.imageWidth),
    meta('property', 'og:image:height', fields.imageHeight), meta('property', 'og:image:alt', fields.imageAlt),
    meta('name', 'twitter:card', 'summary_large_image'), meta('name', 'twitter:title', fields.title),
    meta('name', 'twitter:description', fields.description), meta('name', 'twitter:image', fields.image),
    meta('name', 'twitter:image:alt', fields.imageAlt),
  ].join('\n')}\n  <link rel="canonical" href="${escape(fields.url)}">\n  <link rel="image_src" href="${escape(fields.image)}">\n  ${SHARE_END}`;
}

export function replaceShareBlock(html, fields) {
  const blocks = html.match(/<!-- HTSG social:start -->[\s\S]*?<!-- HTSG social:end -->/g) || [];
  if (blocks.length !== 1) throw new Error('Each shareable page needs one initial-HTML social metadata block');
  return html.replace(blocks[0], renderShareBlock(fields));
}

function attributes(tag) {
  return Object.fromEntries([...tag.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/gs)].map(([,key,,value]) => [key.toLowerCase(), decode(value)]));
}

export function validateShareHtml(html, fields, name = 'page') {
  const metas = new Map();
  for (const tag of html.match(/<meta\b[^>]*>/gi) || []) {
    const attr = attributes(tag), key = attr.property || attr.name;
    if (!key) continue;
    const values = metas.get(key) || []; values.push(attr.content); metas.set(key, values);
  }
  const expected = {
    description: fields.description, 'og:title': fields.title, 'og:description': fields.description,
    'og:type': 'website', 'og:site_name': fields.siteName, 'og:locale': fields.locale, 'og:url': fields.url,
    'og:image': fields.image, 'og:image:secure_url': fields.image, 'og:image:type': fields.imageType,
    'og:image:width': String(fields.imageWidth), 'og:image:height': String(fields.imageHeight), 'og:image:alt': fields.imageAlt,
    'twitter:card': 'summary_large_image', 'twitter:title': fields.title, 'twitter:description': fields.description,
    'twitter:image': fields.image, 'twitter:image:alt': fields.imageAlt,
  };
  for (const [key, value] of Object.entries(expected)) {
    const values = metas.get(key) || [];
    if (values.length !== 1 || values[0] !== value) throw new Error(`${name}: missing, duplicate, or incorrect ${key}`);
  }
  const titles = [...html.matchAll(/<title>([\s\S]*?)<\/title>/gi)];
  if (titles.length !== 1 || decode(titles[0][1]) !== fields.title) throw new Error(`${name}: incorrect title`);
  for (const [rel, value] of [['canonical', fields.url], ['image_src', fields.image]]) {
    const links = (html.match(/<link\b[^>]*>/gi) || []).map(attributes).filter(attr => attr.rel === rel);
    if (links.length !== 1 || links[0].href !== value) throw new Error(`${name}: missing, duplicate, or incorrect ${rel}`);
  }
  for (const url of [fields.url, fields.image]) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.hash) throw new Error(`${name}: social URL must be public HTTPS`);
  }
  return true;
}
