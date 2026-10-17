<?php
/**
 * Plugin Name: HTSG Interactive Lab
 * Description: Serves the reviewed static browser games at /demos/interactive-lab/.
 * Version: 1.1.2
 * Author: Holistic Tech Solutions Group
 * Requires PHP: 8.0
 */
defined('ABSPATH') || exit;

function htsg_lab_url(): string { return home_url('/demos/interactive-lab/'); }
function htsg_lab_base(): string { return (string) wp_parse_url(htsg_lab_url(), PHP_URL_PATH); }
function htsg_lab_host_allowed(): bool {
    return in_array(strtolower((string) wp_parse_url(home_url('/'), PHP_URL_HOST)), ['holistictechsolutionsgroup.com', 'www.holistictechsolutionsgroup.com'], true);
}

/** null means this request belongs to WordPress or another application. */
function htsg_lab_request(string $uri, string $base): ?array {
    $path = parse_url($uri, PHP_URL_PATH);
    if (!is_string($path)) { return null; }
    if ($path === rtrim($base, '/')) { return ['redirect' => true]; }
    if (substr($path, 0, strlen($base)) !== $base) { return null; }
    $relative = substr($path, strlen($base));
    if ($relative === '') { $relative = 'index.html'; }
    if (!preg_match('~\A[a-zA-Z0-9][a-zA-Z0-9._/-]*\z~', $relative)) { return ['file' => '404.html', 'status' => 404]; }
    foreach (explode('/', $relative) as $part) {
        if ($part === '' || $part[0] === '.' || $part[0] === '_') { return ['file' => '404.html', 'status' => 404]; }
    }
    return ['file' => $relative, 'status' => 200];
}

function htsg_lab_types(): array {
    return ['html' => 'text/html; charset=utf-8', 'css' => 'text/css; charset=utf-8', 'js' => 'text/javascript; charset=utf-8',
        'json' => 'application/json; charset=utf-8', 'svg' => 'image/svg+xml', 'png' => 'image/png', 'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg', 'webp' => 'image/webp', 'avif' => 'image/avif', 'gif' => 'image/gif', 'ico' => 'image/x-icon',
        'txt' => 'text/plain; charset=utf-8', 'woff' => 'font/woff', 'woff2' => 'font/woff2',
        'mp3' => 'audio/mpeg', 'ogg' => 'audio/ogg', 'wav' => 'audio/wav'];
}

function htsg_lab_manifest(?string $directory = null): array {
    $directory = $directory ?? __DIR__ . '/site';
    $file = $directory . '/build-manifest.json';
    if (!is_file($file)) { return []; }
    $raw = json_decode((string) file_get_contents($file), true);
    return is_array($raw) ? $raw : [];
}

/** Shared metadata is packaged static configuration, never request-provided copy. */
function htsg_lab_share_config(?string $directory = null): ?array {
    $asset = htsg_lab_asset('share.json', $directory);
    if (!$asset) { return null; }
    $config = json_decode((string) file_get_contents($asset['path']), true);
    if (!is_array($config) || !is_string($config['site_name'] ?? null) || trim($config['site_name']) === '' ||
        !is_string($config['locale'] ?? null) || trim($config['locale']) === '' || !is_string($config['site_url'] ?? null)) { return null; }
    $site = parse_url($config['site_url']);
    if (!$site || ($site['scheme'] ?? '') !== 'https' || empty($site['host']) || isset($site['user']) || isset($site['pass']) ||
        isset($site['query']) || isset($site['fragment']) || substr($config['site_url'], -1) !== '/') { return null; }
    $paths = ['gallery' => '', 'play' => 'play.html', 'invaders' => 'play.html?game=invaders',
        'runner' => 'play.html?game=runner', 'trivia' => 'play.html?game=trivia'];
    foreach ($paths as $key => $path) {
        $page = $config['pages'][$key] ?? null;
        if (!is_array($page) || ($page['path'] ?? null) !== $path || !is_string($page['title'] ?? null) || trim($page['title']) === '' ||
            !is_string($page['description'] ?? null) || trim($page['description']) === '') { return null; }
    }
    $image = $config['image'] ?? null;
    if (!is_array($image) || !is_string($image['path'] ?? null) || !preg_match('~\Aassets/[a-z0-9][a-z0-9.-]*\.(?:png|jpe?g)\z~i', $image['path']) ||
        strpos($image['path'], '..') !== false || ($image['width'] ?? null) !== 1200 || ($image['height'] ?? null) !== 630 ||
        !in_array($image['type'] ?? '', ['image/jpeg', 'image/png'], true) || !is_string($image['alt'] ?? null) || trim($image['alt']) === '') { return null; }
    $cover = htsg_lab_asset($image['path'], $directory);
    $info = $cover ? @getimagesize($cover['path']) : false;
    if (!$cover || $cover['bytes'] > 1000000 || !$info || $info[0] !== 1200 || $info[1] !== 630 ||
        ($info['mime'] ?? '') !== $image['type'] || $cover['type'] !== $image['type']) { return null; }
    return $config;
}

/** Match URLSearchParams.get: first exact game key wins; arrays are not game keys. */
function htsg_lab_share_game(string $uri): ?string {
    $query = parse_url($uri, PHP_URL_QUERY);
    if (!is_string($query)) { return null; }
    foreach (explode('&', $query) as $pair) {
        $parts = explode('=', $pair, 2);
        $key = rawurldecode(str_replace('+', ' ', $parts[0]));
        if ($key !== 'game') { continue; }
        $value = rawurldecode(str_replace('+', ' ', $parts[1] ?? ''));
        return in_array($value, ['invaders', 'runner', 'trivia'], true) ? $value : null;
    }
    return null;
}

function htsg_lab_share_fields(string $uri, string $file, array $config, ?string $siteURL = null): array {
    $key = $file === 'index.html' ? 'gallery' : (htsg_lab_share_game($uri) ?? 'play');
    $page = $config['pages'][$key];
    $base = $siteURL ?? htsg_lab_url();
    return ['title' => $page['title'], 'description' => $page['description'], 'url' => $base . $page['path'],
        'image' => $base . $config['image']['path'], 'imageType' => $config['image']['type'],
        'imageWidth' => $config['image']['width'], 'imageHeight' => $config['image']['height'],
        'imageAlt' => $config['image']['alt'], 'siteName' => $config['site_name'], 'locale' => $config['locale']];
}

function htsg_lab_share_block(array $fields): string {
    $escape = static fn($value): string => htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $tags = [
        ['name', 'description', $fields['description']], ['name', 'robots', 'index,follow,max-image-preview:large'],
        ['property', 'og:title', $fields['title']], ['property', 'og:description', $fields['description']],
        ['property', 'og:type', 'website'], ['property', 'og:site_name', $fields['siteName']], ['property', 'og:locale', $fields['locale']],
        ['property', 'og:url', $fields['url']], ['property', 'og:image', $fields['image']], ['property', 'og:image:secure_url', $fields['image']],
        ['property', 'og:image:type', $fields['imageType']], ['property', 'og:image:width', $fields['imageWidth']],
        ['property', 'og:image:height', $fields['imageHeight']], ['property', 'og:image:alt', $fields['imageAlt']],
        ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', $fields['title']],
        ['name', 'twitter:description', $fields['description']], ['name', 'twitter:image', $fields['image']],
        ['name', 'twitter:image:alt', $fields['imageAlt']],
    ];
    $lines = ['<!-- HTSG social:start -->', '  <title>' . $escape($fields['title']) . '</title>'];
    foreach ($tags as [$attribute, $name, $value]) { $lines[] = '  <meta ' . $attribute . '="' . $name . '" content="' . $escape($value) . '">'; }
    $lines[] = '  <link rel="canonical" href="' . $escape($fields['url']) . '">';
    $lines[] = '  <link rel="image_src" href="' . $escape($fields['image']) . '">';
    $lines[] = '  <!-- HTSG social:end -->';
    return implode("\n", $lines);
}

function htsg_lab_share_html(string $html, array $fields): ?string {
    if (substr_count($html, '<!-- HTSG social:start -->') !== 1 || substr_count($html, '<!-- HTSG social:end -->') !== 1) { return null; }
    return preg_replace_callback('~<!-- HTSG social:start -->.*?<!-- HTSG social:end -->~s',
        static fn(): string => htsg_lab_share_block($fields), $html, 1);
}

function htsg_lab_share_valid(string $html, array $fields): bool {
    $attributes = static function(string $tag): array {
        preg_match_all('/([\w:-]+)\s*=\s*(["\'])(.*?)\2/s', $tag, $matches, PREG_SET_ORDER);
        $result = [];
        foreach ($matches as $match) { $result[strtolower($match[1])] = html_entity_decode($match[3], ENT_QUOTES | ENT_HTML5, 'UTF-8'); }
        return $result;
    };
    preg_match_all('/<meta\b[^>]*>/i', $html, $tags);
    $values = [];
    foreach ($tags[0] as $tag) {
        $attrs = $attributes($tag); $key = $attrs['property'] ?? $attrs['name'] ?? null;
        if ($key) { $values[$key][] = $attrs['content'] ?? ''; }
    }
    $expected = ['description' => $fields['description'], 'og:title' => $fields['title'], 'og:description' => $fields['description'],
        'og:type' => 'website', 'og:site_name' => $fields['siteName'], 'og:locale' => $fields['locale'], 'og:url' => $fields['url'],
        'og:image' => $fields['image'], 'og:image:secure_url' => $fields['image'], 'og:image:type' => $fields['imageType'],
        'og:image:width' => (string) $fields['imageWidth'], 'og:image:height' => (string) $fields['imageHeight'], 'og:image:alt' => $fields['imageAlt'],
        'twitter:card' => 'summary_large_image', 'twitter:title' => $fields['title'], 'twitter:description' => $fields['description'],
        'twitter:image' => $fields['image'], 'twitter:image:alt' => $fields['imageAlt']];
    foreach ($expected as $key => $value) { if (($values[$key] ?? []) !== [(string) $value]) { return false; } }
    preg_match_all('/<title>(.*?)<\/title>/is', $html, $titles);
    if (count($titles[1]) !== 1 || html_entity_decode($titles[1][0], ENT_QUOTES | ENT_HTML5, 'UTF-8') !== $fields['title']) { return false; }
    preg_match_all('/<link\b[^>]*>/i', $html, $links);
    $hrefs = [];
    foreach ($links[0] as $link) { $attrs = $attributes($link); if (isset($attrs['rel'])) { $hrefs[$attrs['rel']][] = $attrs['href'] ?? ''; } }
    return ($hrefs['canonical'] ?? []) === [$fields['url']] && ($hrefs['image_src'] ?? []) === [$fields['image']];
}

/** Response hashes and lengths describe rendered HTML, including game metadata. */
function htsg_lab_response(array $asset, string $uri, string $file): ?array {
    if (!in_array($file, ['index.html', 'play.html'], true)) { return $asset + ['body' => null]; }
    $config = htsg_lab_share_config();
    if (!$config) { return null; }
    $body = htsg_lab_share_html((string) file_get_contents($asset['path']), htsg_lab_share_fields($uri, $file, $config));
    if ($body === null) { return null; }
    return array_merge($asset, ['body' => $body, 'bytes' => strlen($body), 'sha256' => hash('sha256', $body)]);
}

/** Resolve only manifest-listed static files that stay inside this package. */
function htsg_lab_asset(string $relative, ?string $directory = null): ?array {
    $directory = $directory ?? __DIR__ . '/site';
    $request = htsg_lab_request('/' . $relative, '/');
    if (!$request || ($request['status'] ?? 0) !== 200 || ($request['file'] ?? '') !== $relative) { return null; }
    $manifest = htsg_lab_manifest($directory);
    $entry = $manifest[$relative] ?? null;
    $type = htsg_lab_types()[strtolower(pathinfo($relative, PATHINFO_EXTENSION))] ?? null;
    if (!is_array($entry) || !isset($entry['bytes'], $entry['sha256']) || !is_int($entry['bytes']) || $entry['bytes'] < 0 ||
        !is_string($entry['sha256']) || !preg_match('/\A[a-f0-9]{64}\z/', $entry['sha256']) || !$type) { return null; }
    $root = realpath($directory);
    $path = realpath($directory . '/' . $relative);
    if (!$root || !$path || !is_file($path) || substr($path, 0, strlen($root . DIRECTORY_SEPARATOR)) !== $root . DIRECTORY_SEPARATOR) { return null; }
    if (filesize($path) !== $entry['bytes'] || !hash_equals($entry['sha256'], (string) hash_file('sha256', $path))) { return null; }
    return ['path' => $path, 'type' => $type, 'bytes' => $entry['bytes'], 'sha256' => $entry['sha256']];
}

function htsg_lab_ready(?string $directory = null): bool {
    $directory = $directory ?? __DIR__ . '/site';
    $headers = is_file($directory . '/_headers') ? file_get_contents($directory . '/_headers') : '';
    if (!is_string($headers) || !preg_match('/^\s+Content-Security-Policy:\s*.+$/m', $headers)) { return false; }
    foreach (['index.html', 'play.html', '404.html', 'game.js', 'game-engine.js', 'game-renderer.js', 'questions.js',
        'brand.js', 'style.css', 'brand.css', 'play.css', 'assets/invaders-world.webp', 'assets/runner-world.webp', 'assets/trivia-world.webp',
        'assets/halo-runner-atlas.webp', 'assets/halo-runner-idle.png', 'share.json'] as $name) {
        if (!htsg_lab_asset($name, $directory)) { return false; }
    }
    $config = htsg_lab_share_config($directory);
    if (!$config) { return false; }
    foreach (['index.html', 'play.html'] as $name) {
        $page = htsg_lab_asset($name, $directory);
        $html = (string) file_get_contents($page['path']);
        $fields = htsg_lab_share_fields('', $name, $config, $config['site_url']);
        if (htsg_lab_share_html($html, $fields) === null || !htsg_lab_share_valid($html, $fields)) { return false; }
    }
    return true;
}

function htsg_lab_headers(): void {
    $file = __DIR__ . '/site/_headers';
    $allowed = ['content-security-policy', 'x-content-type-options', 'referrer-policy', 'permissions-policy'];
    foreach (is_file($file) ? file($file, FILE_IGNORE_NEW_LINES) : [] as $line) {
        if (preg_match('/^\s+([^:]+):\s*(.+)$/', $line, $match) && in_array(strtolower($match[1]), $allowed, true)) {
            header($match[1] . ': ' . $match[2], true);
        }
    }
    header('Cache-Control: public, max-age=0, must-revalidate', true);
}

function htsg_lab_route(): void {
    if (!htsg_lab_host_allowed()) { return; }
    $uri = (string) ($_SERVER['REQUEST_URI'] ?? '');
    $request = htsg_lab_request($uri, htsg_lab_base());
    if ($request === null) { return; }
    htsg_lab_headers();
    $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if (!in_array($method, ['GET', 'HEAD'], true)) {
        header('Allow: GET, HEAD', true); header('Content-Type: text/plain; charset=utf-8', true); status_header(405);
        echo 'Please use a game link to continue.'; exit;
    }
    if (isset($request['redirect'])) { wp_safe_redirect(htsg_lab_url(), 301); exit; }
    $asset = htsg_lab_asset($request['file']);
    $status = $request['status'];
    if (!$asset) { $asset = htsg_lab_asset('404.html'); $status = 404; }
    if ($asset) { $asset = htsg_lab_response($asset, $uri, $request['file']); }
    if (!$asset) {
        header('Content-Type: text/plain; charset=utf-8', true); status_header(503);
        if ($method !== 'HEAD') { echo 'The game demo is temporarily unavailable.'; } exit;
    }
    status_header($status);
    header('Content-Type: ' . $asset['type'], true);
    header('Content-Length: ' . $asset['bytes'], true);
    header('ETag: "' . $asset['sha256'] . '"', true);
    if ($method !== 'HEAD') {
        if ($asset['body'] !== null) { echo $asset['body']; } else { readfile($asset['path']); }
    }
    exit;
}

function htsg_lab_purge(): void {
    if (function_exists('sg_cachepress_purge_cache')) { sg_cachepress_purge_cache(); }
}
function htsg_lab_activate(): void {
    if (!current_user_can('activate_plugins') || !current_user_can('manage_options') || !htsg_lab_host_allowed()) {
        wp_die('An HTSG administrator must activate this demo.', 'Activation stopped', ['response' => 403]);
    }
    if (get_page_by_path('demos/interactive-lab', OBJECT, 'page')) {
        wp_die('An existing page owns the Interactive Lab address. No page was changed.', 'Activation stopped', ['response' => 409]);
    }
    if (!htsg_lab_ready()) { wp_die('The static game package is incomplete. No page was changed.', 'Activation stopped', ['response' => 409]); }
    htsg_lab_purge();
}

register_activation_hook(__FILE__, 'htsg_lab_activate');
register_deactivation_hook(__FILE__, 'htsg_lab_purge');
add_action('template_redirect', 'htsg_lab_route', -100);
add_action('admin_menu', static function(): void {
    if (htsg_lab_host_allowed()) {
        add_submenu_page('htsg-hq', 'Interactive Lab', 'Interactive Lab', 'manage_options', htsg_lab_url());
    }
}, 30);
