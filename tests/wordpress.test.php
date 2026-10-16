<?php
declare(strict_types=1);
// Isolated WordPress stubs: no production database, authentication, or network.
define('ABSPATH', __DIR__ . '/');
define('OBJECT', 'OBJECT');
$root = dirname(__DIR__);
$fixture = $root . '/artifacts/wordpress-test-' . getmypid() . '/htsg-interactive-lab';
if (!is_dir($fixture)) { mkdir($fixture, 0777, true); }
copy($root . '/wordpress/htsg-interactive-lab/htsg-interactive-lab.php', $fixture . '/htsg-interactive-lab.php');
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root . '/dist', FilesystemIterator::SKIP_DOTS));
foreach ($iterator as $file) {
    if (!$file->isFile()) { continue; }
    $relative = substr($file->getPathname(), strlen($root . '/dist') + 1);
    $target = $fixture . '/site/' . $relative;
    if (!is_dir(dirname($target))) { mkdir(dirname($target), 0777, true); }
    copy($file->getPathname(), $target);
}
$state = ['host' => 'holistictechsolutionsgroup.com', 'can' => true, 'page' => null, 'purges' => 0, 'actions' => [], 'menus' => []];
function home_url(string $path = ''): string { global $state; return 'https://' . $state['host'] . $path; }
function wp_parse_url(string $url, int $component = -1) { return parse_url($url, $component); }
function add_action($name, $callback, $priority = 10): void { global $state; $state['actions'][$name] = [$callback, $priority]; }
function register_activation_hook($file, $callback): void { global $state; $state['activation'] = $callback; }
function register_deactivation_hook($file, $callback): void { global $state; $state['deactivation'] = $callback; }
function current_user_can($capability): bool { global $state; return $state['can']; }
function get_page_by_path($path, $type, $postType) { global $state; return $state['page']; }
function wp_die($message, $title = '', $args = []): void { throw new RuntimeException($message, $args['response'] ?? 0); }
function sg_cachepress_purge_cache(): void { global $state; $state['purges']++; }
function add_submenu_page(...$args): void { global $state; $state['menus'][] = $args; }
function wp_insert_post(...$args): void { throw new RuntimeException('Unexpected post creation'); }
function wp_update_post(...$args): void { throw new RuntimeException('Unexpected post update'); }
function update_option(...$args): void { throw new RuntimeException('Unexpected persistent option write'); }
function add_role(...$args): void { throw new RuntimeException('Unexpected permission write'); }
require $fixture . '/htsg-interactive-lab.php';
$checks = 0;
function check(bool $pass, string $message): void { global $checks; if (!$pass) { throw new RuntimeException($message); } $checks++; }
function stopped(callable $action, int $code): bool { try { $action(); return false; } catch (RuntimeException $error) { return $error->getCode() === $code; } }
$base = '/demos/interactive-lab/';
foreach (['/', '/demos/', '/menu/', '/wp-admin/', '/wp-json/', '/demos/interactive-lab-other/', '/demos/all-in-advisors/'] as $path) {
    check(htsg_lab_request($path, $base) === null, 'Unrelated route intercepted: ' . $path);
}
check(htsg_lab_request('/demos/interactive-lab', $base) === ['redirect' => true], 'Missing slash must redirect canonically');
check(htsg_lab_request($base, $base) === ['file' => 'index.html', 'status' => 200], 'Gallery route');
check(htsg_lab_request($base . 'play.html?game=runner', $base) === ['file' => 'play.html', 'status' => 200], 'Query must not affect static path');
foreach (['../wp-config.php', '%2e%2e/wp-config.php', 'assets%2f../index.html', 'assets//x.js', 'assets/./x.js', 'assets/../index.html', '.env', '_headers', "assets\\x.js", 'index.html%00.php'] as $path) {
    check(htsg_lab_request($base . $path, $base)['status'] === 404, 'Unsafe route accepted: ' . $path);
}
check(htsg_lab_host_allowed(), 'Expected HTSG host');
$state['host'] = 'www.holistictechsolutionsgroup.com'; check(htsg_lab_host_allowed(), 'Expected www host');
$state['host'] = 'unrelated.example'; check(!htsg_lab_host_allowed(), 'Unrelated host enabled');
check(stopped('htsg_lab_activate', 403), 'Activation outside HTSG must stop');
$state['host'] = 'holistictechsolutionsgroup.com';
$state['can'] = false; check(stopped('htsg_lab_activate', 403), 'Unauthorized activation must stop');
$state['can'] = true; $state['page'] = (object) ['ID' => 123];
check(stopped('htsg_lab_activate', 409), 'Existing page must not be shadowed');
$state['page'] = null;
check(htsg_lab_ready(), 'The actual packaged dist files must verify');
foreach (['game-renderer.js', 'play.css', 'assets/invaders-world.webp', 'assets/runner-world.webp', 'assets/trivia-world.webp'] as $name) {
    $path = $fixture . '/site/' . $name;
    rename($path, $path . '.unavailable');
    clearstatcache();
    check(!htsg_lab_ready(), 'Missing required play surface must fail readiness: ' . $name);
    check(stopped('htsg_lab_activate', 409), 'Incomplete play surface must stop activation: ' . $name);
    rename($path . '.unavailable', $path);
    clearstatcache();
}
check(htsg_lab_ready(), 'Restored play surface must verify');
foreach (htsg_lab_manifest() as $name => $entry) {
    if ($name === '_headers') { continue; }
    $asset = htsg_lab_asset($name);
    check($asset !== null && $asset['bytes'] === $entry['bytes'], 'Packaged asset cannot resolve: ' . $name);
}
foreach (['_headers', 'build-manifest.json', '../htsg-interactive-lab.php', 'unknown.js', 'anything.php'] as $name) {
    check(htsg_lab_asset($name) === null, 'Unlisted/internal asset exposed: ' . $name);
}
file_put_contents($fixture . '/site/rogue.php', '<?php echo 1;');
check(htsg_lab_asset('rogue.php') === null, 'Unexpected file must not be served');
$index = file_get_contents($fixture . '/site/index.html');
file_put_contents($fixture . '/site/index.html', $index . 'changed');
clearstatcache();
check(htsg_lab_asset('index.html') === null && !htsg_lab_ready(), 'Changed static bytes must fail integrity');
check(stopped('htsg_lab_activate', 409), 'Incomplete package activation must stop');
file_put_contents($fixture . '/site/index.html', $index); clearstatcache();
htsg_lab_activate();
check($state['purges'] === 1, 'Successful activation only purges existing cache');
check($state['actions']['template_redirect'][1] === -100, 'Scoped route must run before normal canonical handling');
($state['actions']['admin_menu'][0])();
check($state['menus'][0][0] === 'htsg-hq' && $state['menus'][0][4] === htsg_lab_url(), 'Admin menu must link directly to the lab');
check(strpos(file_get_contents($fixture . '/site/404.html'), 'href="/demos/interactive-lab/index.html"') !== false, 'Built 404 must return to the lab subpath');
echo "PASS {$checks} WordPress static-host scope, canonical route, integrity, permission, collision and navigation checks.\n";
