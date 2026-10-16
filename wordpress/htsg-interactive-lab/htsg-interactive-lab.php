<?php
/**
 * Plugin Name: HTSG Interactive Lab
 * Description: Serves the reviewed static browser games at /demos/interactive-lab/.
 * Version: 1.1.1
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
        'assets/halo-runner-atlas.webp', 'assets/halo-runner-idle.png'] as $name) {
        if (!htsg_lab_asset($name, $directory)) { return false; }
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
    $request = htsg_lab_request((string) ($_SERVER['REQUEST_URI'] ?? ''), htsg_lab_base());
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
    if (!$asset) {
        header('Content-Type: text/plain; charset=utf-8', true); status_header(503);
        if ($method !== 'HEAD') { echo 'The game demo is temporarily unavailable.'; } exit;
    }
    status_header($status);
    header('Content-Type: ' . $asset['type'], true);
    header('Content-Length: ' . $asset['bytes'], true);
    header('ETag: "' . $asset['sha256'] . '"', true);
    if ($method !== 'HEAD') { readfile($asset['path']); }
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
