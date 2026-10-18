# HTSG Gamification Labs deployment

The approved public destination is **https://holistictechsolutionsgroup.com/demos/interactive-lab/**. The static games use the existing HTSG WordPress host. Free play requires no account, game backend, paid dependency or DNS change. The optional first-party community service is maintained and accepted separately.

## Release 1.5.2 live — October 17, 2026

The renderer-only release replaces one falling Scope Creep hazard with a finger-wagging client. Rules remain 1.5.0 and Community remains 1.0.5; no schema, account, Google, subscription or data change is included. Artwork is approved; source checks, 70 Node tests, six presentation cases and three actual-size client probes passed. The existing reviewed three-game cover and initial metadata remain unchanged.

Installed installer: `release/htsg-interactive-lab-wordpress-1.5.2.zip`, **3,529,515 bytes**, SHA-256 `5a3e36aa03a572e0f1e8a8c23b49a5ca067e03e7bc4dc11e10125624ef1c878c`. All **34 entries** independently matched; only the release field, renderer and derived manifest differ from 1.5.1. PHP lint/125 adapter checks and 14 sharing checks passed. The publisher confirmed active 1.5.2 and purged SiteGround cache. The ordinary anonymous public renderer matched the frozen bytes/hash, and actual public sharing passed **14/14**. No Community replacement/audit or other state change was required.

Immediate rollback is the preserved 1.5.1 installer, **3,528,783 bytes**, SHA-256 `a66c7577ca95e3e9fb3dcbe4641deae6faf344204915d6dcd44db805f410673d`. Its hash was reverified; no older installer was overwritten.

## Historical release 1.5.1 — October 17, 2026

The game-only replacement fixes phone arena resizing caused by an Arial-fallback weapon label wrapping in the dashboard. Its internal small-screen gap changes from four to two pixels; engine rules remain **1.5.0** and Community remains **1.0.5**, with no new audit or data change required. Targeted Arial/boss and phone geometry checks passed, followed by **8/8** actual public controls checks, the exact corrected CSS hash and **14/14** public sharing checks.

Installed archive: `release/htsg-interactive-lab-wordpress-1.5.1.zip`, **3,528,783 bytes**, SHA-256 `a66c7577ca95e3e9fb3dcbe4641deae6faf344204915d6dcd44db805f410673d`. All **34 entries** independently matched; only the release field, CSS and derived manifest differ from 1.5.0. PHP lint and **125/125** adapter checks passed. The publisher confirmed the active version and purged SiteGround cache. Immediate same-rules rollback is immutable **1.5.0**, 3,528,770 bytes, SHA-256 `eeed1afe030847f19fd29f44c1dee08f3fc4f048dc7d2dd88c98dd711b92cdce`; the older 1.4.1 coordinated rollback is retained below. See [QA.md](QA.md) for both initial CI failures, the reproduced cause and final scope.

## Historical release 1.5.0 — October 17, 2026

This release adds a compact pause panel, paused weapon-family switching and more generous guided missiles. Mechanics now use rules **1.5.0**. The publisher installed Community **1.0.5** first and repeated its member-access audit (**14/14** at 2026-10-18T03:11:29Z), then installed the reviewed game and purged SiteGround cache. Both active versions were confirmed; HQ remains unchanged at 2.17.0. New challenge IDs include the rules version (`invaders-YYYY-MM-DD-v1.5.0`); boards cannot mix old/new rules. Existing history and original unexpired 1.4.0 tickets remain finishable. No schema, account, email, Google setup or DNS change is required.

Installed game archive: `release/htsg-interactive-lab-wordpress-1.5.0.zip`, **3,528,770 bytes**, SHA-256 `eeed1afe030847f19fd29f44c1dee08f3fc4f048dc7d2dd88c98dd711b92cdce`. All **34 entries** were independently decompressed and matched to the scoped build/entry point; PHP lint and **125/125** adapter checks passed. Actual anonymous sharing passed **14/14** and **28/28** ordinary public asset hashes matched. Community anonymous rules/board/privacy/sharing checks passed **4/4**. Actual public controls passed **8/8** across desktop, portrait and landscape layouts, with explicit fixture boundaries recorded in [QA.md](QA.md). The publisher manually checked the public pause/weapon/fullscreen/help sequence. Facebook Sharing Debugger was refreshed and returned 206 with the exact reviewed cover; its existing nonblocking `fb:app_id` warning remains. No social post was published. The game rollback is immutable **1.4.1**, 3,524,001 bytes, SHA256 `35d930fa97f5e41a7059a004a58a9b3fd03cbf9686598fdaff6808a55d18091d`. Community rollback is immutable **1.0.4**; coordinate both versions rather than mixing fresh-ticket rules. A temporary mismatch rejects a new challenge start while free play stays available. Preserve old records; do not reseed, migrate or clear scores.

## Historical release 1.4.1 — October 17, 2026

The installed release refines Agency Invaders' agency-themed hazard silhouettes, distinct boss artwork and firing feedback. It changes no balance, collision geometry, weapon mechanics or challenge rules (`1.4.0`). The existing three-game sharing cover remains relevant. The separate installed Community 1.0.4 service and its data/settings are outside this update.

The installed archive is `release/htsg-interactive-lab-wordpress-1.4.1.zip`, **3,524,001 bytes**, SHA-256 **`35d930fa97f5e41a7059a004a58a9b3fd03cbf9686598fdaff6808a55d18091d`**. All **34 entries** were independently decompressed and matched; CRC, safe paths, duplicates and the SHA sidecar passed. Sharing passed **14/14**, PHP lint and **125/125** adapter checks passed, and the publisher approved desktop/mobile artwork and Help. Source checks, 59/59 Node tests, 20/20 core browser checks, 6/6 focused visual/audio checks and 2/2 Help/impact checks passed; the verified installer was replaced through WordPress, its active 1.4.1 version confirmed and SiteGround cache purged. The immediate rollback is the immutable 1.4.0 archive recorded below. Existing content-hash ETags, browser revalidation and the publication-time SiteGround purge apply to the same asset paths; no adapter logic change is required.

Actual public visual/audio checks passed **6/6**, sharing passed **14/14**, and all **28/28** ordinary non-HTML asset URLs returned exact final-build bytes and hashes. The visual fixture scenes are disclosed in [QA.md](QA.md); emulated phone drag/fire/audio controls were checked separately from earned combat. Facebook Sharing Debugger was refreshed for the Invaders URL and returned 200 with the existing reviewed JPEG and correct title/description. Its existing missing `fb:app_id` warning did not prevent the preview; no social post was published. Public evidence is in the parent `output/agency-invaders-polish-2026-10-17/` release folder.

## Historical release 1.4.0 — October 17, 2026

Version **1.4.0 was installed**, following replacement through the WordPress plugin installer. Agency Invaders adds an untimed spread/focused choice after wave two, finite side-missile pairs, distinct signaled boss patterns, a compact dashboard and optional default-off sound. All three games remain freely playable. The responsive phone canvas remains 678 CSS pixels high at 390 × 844. Public routes and game-host permissions are unchanged.

Installed archive: `release/htsg-interactive-lab-wordpress-1.4.0.zip`, **3,518,808 bytes**, SHA-256 **`ce1a3f5403572381589de72704467f1d3085b47d438ae7d5194d04cb6438961a`**. Independent Python ZIP decompression matched all **34 entries** to the final scoped PHP entry point and `dist/`; CRC, duplicate/path checks and the hash sidecar passed. PHP lint and **125/125 adapter checks** passed. Evidence is in the parent workspace's `output/agency-invaders-community-2026-10-17/`. See [QA.md](QA.md) for current public results and remaining acceptance limits.

Challenge hooks use a seeded fixed 960 × 1669 logical course, 120 Hz simulation and a maximum five-minute active clock; weapon-choice time is excluded. A new attempt needs a fresh server run ticket. The game-hosting plugin creates no accounts, score tables or challenge API. The separate community plugin owns those services. Failed community requests never block free play.

At this release’s publication, the separate community 1.0.1 plugin was installed. Its corrected disabled-session response was verified as HTTP 200 and redacted, then the owner enabled public features and Google configuration. Production game verification passes 19 distinct core checks, 14 sharing checks and all three focused gameplay scenarios; all 28 public non-HTML assets match the final build. Earlier transitional 404 results and the successful affected rerun are both preserved.

Actual existing-member acceptance also passed: a fresh UI-issued weekly attempt earned 10 points through normal input and ended through natural hazard damage. The saved result appeared in member history and the public unverified board. The browser was already signed in as the owner; that session was preserved, so a fresh Google OAuth/signup flow was not exercised. No subscription or profile change was made. See `evidence/member-live/ACCEPTANCE.md` in the parent release folder and [QA.md](QA.md) for the exact boundary. Google configuration being enabled is not a claim that fresh onboarding was independently tested.

The actual Facebook Sharing Debugger was refreshed for Invaders after publication. It returned HTTP 200 with the current weapon/missile description and reviewed dated JPEG cover. The existing missing `fb:app_id` warning remained; no social post was published. Actual preview evidence is `evidence/facebook-live/invaders-refreshed.png` in the parent release folder, separate from anonymous crawler simulations.

The immediate game rollback is the immutable **1.3.0** archive, `release/htsg-interactive-lab-wordpress-1.3.0.zip` (3,510,741 bytes, SHA-256 `6e53b8c3b0c61be5a7cd1fd093e6669c1f600c52ef6e882cb580afc40830a93e`). Restore only the game companion, verify its version, purge SiteGround cache and recheck all three routes and sharing. Headquarters and the separate community service have their own recovery procedures.

## Historical release 1.3.0 — October 17, 2026

Version **1.3.0 was installed and active**, confirmed through the WordPress plugin installer at 00:55:49 UTC on October 18 (8:55:49 p.m. EDT on October 17). The update provided direct thumb steering and a larger playfield, escalating pressure and signaled bosses, and a browser-local personal best. Headquarters 2.16.6 and native Demos content required no further change.

The installed archive is `release/htsg-interactive-lab-wordpress-1.3.0.zip`: 3,510,741 bytes, SHA-256 `6e53b8c3b0c61be5a7cd1fd093e6669c1f600c52ef6e882cb580afc40830a93e`. Its 31 entries were independently decompressed and matched to the reviewed scoped build and entry point. PHP lint and all 122 adapter checks passed. Source QA and current actual public results are recorded in [QA.md](QA.md).

Actual public integration passed **19/19**, and sharing passed **14/14**. Facebook Sharing Debugger was explicitly refreshed for Invaders and displayed the correct new description with the same reviewed dated three-game cover. The debugger reported response 206; its existing `fb:app_id` identity warning remained and did not prevent the preview. The focused public progression/boss run also passed **3/3** at approximately 8:57 p.m. EDT; its actual game inputs, health-bar geometry, and personal-best fixture scope are recorded in [QA.md](QA.md). Publication and installed-version evidence are in `output/agency-invaders-arcade-2026-10-17/` in the parent workspace.

The immediate rollback is the preserved **1.2.0** archive, `release/htsg-interactive-lab-wordpress-1.2.0.zip` (3,508,030 bytes, SHA-256 `890f30b2334f6e8ad647237a48208c6723dedc099fcb8efe3e26ad574e10dd19`). Preserve it unchanged. Restore only this companion if needed, verify the version, purge SiteGround cache, and recheck the direct games and sharing routes. No Cloudflare or DNS change was performed.

Community directions in [GAME-DIRECTION.md](GAME-DIRECTION.md) remain proposals. No shared leaderboard, account, new game backend, or community service is part of this release.

## Historical release 1.2.0 — October 17, 2026

Version **1.2.0 was installed and active**, following the owner's explicit publication approval. WordPress confirmed the in-place replacement and installed version, then SiteGround cache was purged. It uses the public name Gamification Labs, a newly versioned 1200 × 630 sharing cover, and the existing canonical URL and query routes. Invaders gains short waves and automatic weapon upgrades; all three games remain browser-only. The companion folder, route handler identifiers, and repository name stay stable.

Headquarters 2.16.6 is installed, based on the authoritative 2.16.5 inquiry-routing release. Its only changes are the public Gamification Labs links, the compact Demos & Labs group label, and version fields. Existing inquiry routing and permissions are preserved. Native Demos page 226 has its single game-section heading renamed; homepage 8 has no Lab text or route to change. The earlier publication pause was resolved by explicit owner approval before game replacement.

The preserved 1.1.2 installer was the immediate rollback for that release. Anonymous live checks passed 3 focused progression checks, 14 sharing checks and 19 unique integration checks; actual Facebook cards were refreshed for the gallery and three game links. The current QA scope is in [QA.md](QA.md), and the metadata/image release requirements remain in [SHARING.md](SHARING.md). No Cloudflare, custom domain, or DNS change was performed.

## Existing HTSG WordPress host

Run `npm run package:wordpress` to build `release/htsg-interactive-lab-wordpress-1.4.1.zip` and its SHA-256 file. The filename follows the companion's version metadata, which must match `package.json`. This command sets the approved `SITE_URL`, makes social metadata absolute, and adjusts the missing-page stylesheet, favicon, and gallery link to `/demos/interactive-lab/`. Ordinary game links and modules remain relative. The ZIP contains one companion entry point and the built static site; no tests, credentials, dependencies, artwork originals, or source history are installed.

Use the established authenticated **Plugins → Add New → Upload Plugin** route, upload the reviewed ZIP, and activate **HTSG Gamification Labs**. For later releases, replace this companion in place. Activation requires an HTSG administrator, the expected HTSG host, a complete static package, and no native page already owning `demos/interactive-lab`. It creates or overwrites no pages, options, roles, or game records; it only purges existing SiteGround cache when that function is available. A direct administration link appears under Headquarters.

Do not create a physical `demos/` directory in the WordPress webroot, which could shadow the existing native Demos route. This companion's `template_redirect` handler at priority `-100` serves only the exact lab path. Every other page and demo continues through its existing handler. The reviewed Headquarters/native-content changes provide the public Demos and menu links separately.

Only GET and HEAD are supported. The gallery without its final slash redirects to the canonical URL. Unknown or unsafe names return the branded 404. Dot paths, encoded path tricks, internal metadata, PHP files, and unlisted files cannot be served through the adapter. Assets must match the manifest's path, byte length, and SHA-256 hash and resolve inside the companion's `site/` directory. It sends the shared CSP/privacy headers from `_headers`, and gameplay remains entirely in the browser. For the two primary HTML pages, the verified static template receives an escaped metadata block from `share.json`; valid game queries select configured game copy only. HTML Content-Length and ETag are calculated from the actual rendered response, so different game metadata cannot share a stale static response hash.

Every served response uses `Cache-Control: public, max-age=0, must-revalidate`. Each static asset receives an ETag derived from its content hash. Browser caches must revalidate the same module and image paths after a replacement; the SiteGround purge clears the host's existing cached responses. Verify the new version's stylesheet, renderer, and all three worlds anonymously after purging, rather than relying on a previously open game tab.

The three runtime world paths are `assets/invaders-world.webp`, `assets/runner-world.webp`, and `assets/trivia-world.webp`, each 1536 × 864. Their selected originals and exact prompts are preserved under `artwork/` and included in the source ZIP, outside the installed plugin. See [ARTWORK.md](ARTWORK.md) for file hashes and optimization, and [BRANDING.md](BRANDING.md) for the shared tokens and reusable asset contract.

Development verification uses `php -l wordpress/htsg-interactive-lab/htsg-interactive-lab.php` and `php tests/wordpress.test.php` after `npm run package:wordpress`. The workspace has an existing PHP executable in `../custom-pools-showcase/growth-release/tools/php/php.exe`. PHP is only development tooling and part of the existing WordPress host; standalone games do not require it.

After installation, purge SiteGround cache and verify the gallery, all three games, module/image content types, canonical slash, HEAD, branded nested 404, method restrictions, and actual policy headers anonymously. Follow the HTSG home logo, All demos, Rocket Menu, gallery return, and contact links on desktop and mobile. Preserve all existing demos and protected access controls. See [QA.md](QA.md) for actual device coverage and results.

Rollback for a 1.2.0 regression: replace only this companion with the preserved `release/htsg-interactive-lab-wordpress-1.1.2.zip`, verify version 1.1.2, purge SiteGround cache, and repeat the direct game, mobile, and sharing checks. Its SHA-256 is `c8dd203f166aa4a65eeb11210c8283f13d5561d84794bdcdfc22cd5cd4c74b38` (3,385,228 bytes). This restores the previous name and game edition while keeping all routes valid. Older installers remain preserved. To remove the lab entirely, deactivate only this companion; no game records require deletion. Restore native Demos content and Headquarters separately only if those discovery changes also need rollback; do not perform a sitewide restore for this companion.

## Cloudflare alternative

The original separate Cloudflare Pages configuration remains prepared as an alternative. No Cloudflare project or deployment has been created. The procedures below apply only when choosing that alternative; they do not modify HTSG WordPress or DNS.

## Targets

| Setting | Value |
| --- | --- |
| GitHub repository | `newpaltzmarketing/htsg-interactive-lab` |
| Cloudflare Pages project | `htsg-interactive-lab` |
| Production branch on that new Pages project | `main` |
| Demonstration deployment branch | `demo-preview` |
| Source directory | `public/` |
| Build command | `npm run build` |
| Build output | `dist/` |
| Framework | None |
| Runtime bindings, Functions, Workers | None |
| Custom domains | None |

All public site assets are local. No environment variables are needed by the game. Do not place credentials in `public/`; everything in that folder is intended to be published. Development dependencies stay outside the build.

## Create the GitHub repository

The project has its own Git repository, separate from the parent HTSG workspace. Once all checks pass:

```sh
gh auth status
gh repo create newpaltzmarketing/htsg-interactive-lab --public --source . --remote origin
git add .
git commit -m "Prepare HTSG Interactive Lab public demonstration"
git push -u origin main
```

Create the remote only once. If it already exists, verify it with `gh repo view newpaltzmarketing/htsg-interactive-lab` and use the existing `origin`. Never initialize or publish the parent HTSG workspace.

## Create the isolated Cloudflare Pages preview

Use the official Wrangler CLI. Browser authentication may require the account owner to finish sign-in. The following does not change DNS or the existing HTSG website:

```sh
npm exec --yes --package=wrangler@4 -- wrangler login
npm exec --yes --package=wrangler@4 -- wrangler whoami
npm exec --yes --package=wrangler@4 -- wrangler pages project create htsg-interactive-lab --production-branch main
npm run check
npm test
npm run test:browser
npm run build
npm exec --yes --package=wrangler@4 -- wrangler pages deploy dist --project-name htsg-interactive-lab --branch demo-preview
```

The project creation command is a one-time step. If a project with that name already exists, inspect it and confirm it is the isolated game demo before using it. A non-production branch deploy produces a preview URL and a branch alias; use the URL actually returned by Cloudflare rather than assuming a deployment succeeded.

Choose a Direct Upload Pages project for this procedure. Cloudflare documents limitations on switching between Direct Upload and Git integration, so choose the publishing mode deliberately. Wrangler creates a static Pages deployment here; no backend or Pages Functions are part of the build.

## GitHub Actions

`Validate static demo` runs on pushes and pull requests. It installs the pinned free testing dependency, runs the game, browser, upgrade touch/fullscreen/layout checks, optional community-client fixtures and mandatory `test:share` raw-HTML/image checks, uploads the standalone static build, then builds and checks the WordPress companion and uploads that ZIP as a separate artifact. It does not publish a website. There is no GitHub Pages deployment workflow.

`Deploy demonstration preview` runs only when manually dispatched after a future deployment request. It validates the selected source and deploys the fixed `demo-preview` branch of the separate `htsg-interactive-lab` Pages project. There is no automatic deployment or production deployment workflow.

For that manual workflow, create a GitHub environment named `demo-preview` and store:

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Account → Cloudflare Pages → Edit, scoped to the intended account. |
| `CLOUDFLARE_ACCOUNT_ID` | The account that owns this new Pages project. |

Credentials belong in GitHub environment secrets or the user's local Wrangler sign-in. Never paste them into repository files, browser URLs, screenshots, or logs. Creating a new token is an account-owner action; this project does not create one automatically.

## Verify a deployment

1. Open the returned HTTPS preview URL and load all three games directly: `play.html?game=invaders`, `play.html?game=runner`, and `play.html?game=trivia`.
2. Repeat the desktop and mobile controls in [QA.md](QA.md). Check browser console and network requests for missing assets or policy errors.
3. Confirm the expected `Content-Security-Policy`, `X-Content-Type-Options`, and privacy headers from `public/_headers` reached the response. The local server applies these headers too.
4. Save the actual deployment URL and associated Git commit. Rebuild and re-upload if anything fails.

`frame-ancestors 'self'` permits same-origin HTSG embedding; this release uses direct links from the live Demos directory and navigation. If embedding from another origin is later approved, explicitly allow that origin in `_headers`, redeploy, and test that integration separately.

Other static hosts may not apply Cloudflare's `_headers` file. The build also injects the shared Content Security Policy as an HTML meta tag, omitting directives unsupported in meta tags. Cloudflare adds the full HTTP policy and privacy headers. A host that ignores `_headers` cannot enforce `frame-ancestors` or the other custom HTTP headers through this file.

Optional build-time `SITE_URL` must be an HTTPS URL without credentials, a query, or a fragment. If omitted, social metadata uses the primary absolute HTSG address from `public/share.json`; other static asset links remain relative. An explicit alternate URL rewrites canonical, OG, Twitter, and `image_src` URLs together. Provide the final Cloudflare preview URL when making a separately canonical shareable release for that host. Static query URLs use the complete all-game metadata fallback; the existing WordPress host supplies game-specific metadata before JavaScript.

## Updates and rollback

Re-run checks and deploy the same `demo-preview` branch with the command above. Keep the previous successful deployment URL for a quick demonstration fallback. If a new build fails, use the prior preview URL while fixing the change; do not change the live HTSG website to recover a demo.

## Official references

- [Cloudflare Pages Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)
- [Wrangler Pages commands](https://developers.cloudflare.com/workers/wrangler/commands/pages/)
- [Pages headers](https://developers.cloudflare.com/pages/configuration/headers/)
- [Wrangler configuration for Pages](https://developers.cloudflare.com/pages/functions/wrangler-configuration/)
- [Cloudflare Wrangler GitHub Action](https://github.com/cloudflare/wrangler-action)
- [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Current publish status

**Gamification Labs 1.4.1 is installed.** The 34-entry installer, independent hash validation and 125 adapter checks are recorded above. Current public checks and their scope are in [QA.md](QA.md). The immutable 1.4.0 installer is the immediate game rollback. Google sign-in and community acceptance remain separate from game installation. Older installed states below are historical evidence.

The preceding October 17 **Gamification Labs 1.2.0** installed ZIP has SHA-256 `890f30b2334f6e8ad647237a48208c6723dedc099fcb8efe3e26ad574e10dd19`. Exact packages, native snapshots, publication and actual public evidence are maintained in `output/gamification-labs-2026-10-17/` in the parent workspace. The older state and hashes below are preserved historical evidence. Source validation and game publication are separate operations; the Cloudflare preview workflow remains manual.

The **HTSG Interactive Lab 1.1.2** companion was uploaded through the existing WordPress plugin installer on October 16, 2026, and its active version was verified after replacement. SiteGround cache was then purged from the stable administration page. The gallery and all three game routes are live at [the Interactive Lab](https://holistictechsolutionsgroup.com/demos/interactive-lab/). This release supplies the new shared cover, complete initial-HTML metadata, game-specific canonical/copy in the existing adapter, and mandatory local/CI sharing checks. Actual public sharing verification and platform re-scrape observations are recorded in [QA.md](QA.md).

Installed archive: `release/htsg-interactive-lab-wordpress-1.1.2.zip`, 3,385,228 bytes, SHA-256 `c8dd203f166aa4a65eeb11210c8283f13d5561d84794bdcdfc22cd5cd4c74b38`. All 29 ZIP entries were independently decompressed and matched against the reviewed entry point and scoped static build before installation. PHP lint and 118 adapter scope, permission, integrity, metadata, query-safety, response-hash, and required-asset checks passed; five negative/source sharing-gate tests and the 14-scenario exact local sharing suite passed. The separate static-host mode also passed 14/14, and the same public sharing gate passed 14/14 after installation. All four actual Facebook Debugger previews were re-scraped and visually confirmed with the new image and correct route-specific metadata; no social post was published. The preceding tested 1.1.1 archive remains unchanged as the primary local rollback; all older installers are preserved.

Public source repository: [newpaltzmarketing/htsg-interactive-lab](https://github.com/newpaltzmarketing/htsg-interactive-lab). Hosting uses the existing HTSG WordPress site. No Cloudflare project, Cloudflare deployment, custom domain, or DNS change was created. Cloudflare remains a prepared static hosting alternative.

The original public discovery release integrated native Demos page 226 and Headquarters 2.16.2. The separately maintained Headquarters release supplies the site menu/footer links and the phone-menu positioning and keyboard behavior; it was not changed by the 1.1.2 sharing update. The preceding sharing publication record is `output/interactive-lab-sharing-2026-10-16/PUBLICATION.md` in the parent workspace. The preceding touch-polish and cinematic upgrade records remain preserved at `output/interactive-lab-touch-polish-2026-10-16/PUBLICATION.md` and `output/interactive-lab-upgrade-2026-10-16/PUBLICATION.md`. Earlier integration source and recovery records remain preserved separately:

- Publication record: `output/interactive-lab-publication-2026-10-16/PUBLICATION.md`.
- Headquarters installer: `output/interactive-lab-publication-2026-10-16/htsg-headquarters-2.16.2.zip` (SHA-256 `c313f09507a3eee80c7975b2cb711929d61a9f2e876500f90e23127f74f7eece`).
- Headquarters source: `output/interactive-lab-publication-2026-10-16/navigation-2.16.2/package/htsg-headquarters/`.
- Preceding Headquarters installer: `output/interactive-lab-publication-2026-10-16/htsg-headquarters-2.16.1.zip`.
- Preserved native Demos content: `output/interactive-lab-publication-2026-10-16/native-content/`.

GitHub Pages was configured to use Actions while preparing the optional preview. No deployment was run, and no Pages publishing workflow is included. A source push runs validation and produces the static artifact only.
