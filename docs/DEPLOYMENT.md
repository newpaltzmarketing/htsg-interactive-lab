# HTSG Gamification Labs deployment

The approved public destination is **https://holistictechsolutionsgroup.com/demos/interactive-lab/**. On October 16, 2026, the owner authorized publication and integration with the existing Demos area and navigation. The static games use the existing HTSG WordPress host. No new game backend, external API, database tables, account system, paid dependency, or DNS change is required.

## Release 1.2.0 preparation

Version **1.2.0 is prepared, not yet installed**. It uses the public name Gamification Labs, a newly versioned 1200 × 630 sharing cover, and the existing canonical URL and query routes. Invaders gains short waves and automatic weapon upgrades; all three games remain browser-only. The companion folder, route handler identifiers, and repository name stay stable so replacement remains in place.

Headquarters 2.16.6 is installed, based on the authoritative 2.16.5 inquiry-routing release. Its only changes are the public Gamification Labs links, the compact Demos & Labs group label, and version fields. Existing inquiry routing and permissions are preserved. Native Demos page 226 has its single game-section heading renamed; homepage 8 has no Lab text or route to change. The game companion replacement is separately awaiting owner approval after automatic review enforced the original live-site restriction. Do not infer that the new game is live from the menu rename.

The installed 1.1.2 companion remains the immediate rollback. The current QA scope is in [QA.md](QA.md), and the metadata/image release requirements remain in [SHARING.md](SHARING.md). No Cloudflare, custom domain, or DNS change is required.

## Existing HTSG WordPress host

Run `npm run package:wordpress` to build `release/htsg-interactive-lab-wordpress-1.2.0.zip` and its SHA-256 file. The filename follows the companion's version metadata, which must match `package.json`. This command sets the approved `SITE_URL`, makes social metadata absolute, and adjusts the missing-page stylesheet, favicon, and gallery link to `/demos/interactive-lab/`. Ordinary game links and modules remain relative. The ZIP contains one companion entry point and the built static site; no tests, credentials, dependencies, artwork originals, or source history are installed.

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

`Validate static demo` runs on pushes and pull requests. It installs the pinned free testing dependency, runs the game, browser, upgrade touch/fullscreen/layout checks and mandatory `test:share` raw-HTML/image checks, uploads the standalone static build, then builds and checks the WordPress companion and uploads that ZIP as a separate artifact. It does not publish a website. There is no GitHub Pages deployment workflow.

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

The October 17 **Gamification Labs 1.2.0** candidate is prepared for review. The installed game state and hashes below describe the preceding verified release until game publication is confirmed. The new candidate and native-content snapshots are maintained in `output/gamification-labs-2026-10-17/` in the parent workspace. Source validation and game publication are separate operations; the Cloudflare preview workflow remains manual.

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
