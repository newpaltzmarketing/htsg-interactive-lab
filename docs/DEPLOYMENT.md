# HTSG Interactive Lab deployment

The approved public destination is **https://holistictechsolutionsgroup.com/demos/interactive-lab/**. On October 16, 2026, the owner authorized publication and integration with the existing Demos area and navigation. The static games use the existing HTSG WordPress host. No new game backend, external API, database tables, account system, paid dependency, or DNS change is required.

## Existing HTSG WordPress host

Run `npm run package:wordpress` to build `release/htsg-interactive-lab-wordpress-1.0.1.zip` and its SHA-256 file. The filename follows the companion's version metadata. This command sets the approved `SITE_URL`, makes social metadata absolute, and adjusts the missing-page stylesheet, favicon, and gallery link to `/demos/interactive-lab/`. Ordinary game links and modules remain relative. The ZIP contains one companion entry point and the built static site; no tests, credentials, dependencies, or source history are installed.

Use the established authenticated **Plugins → Add New → Upload Plugin** route, upload the reviewed ZIP, and activate **HTSG Interactive Lab**. For later releases, replace this companion in place. Activation requires an HTSG administrator, the expected HTSG host, a complete static package, and no native page already owning `demos/interactive-lab`. It creates or overwrites no pages, options, roles, or game records; it only purges existing SiteGround cache when that function is available. A direct administration link appears under Headquarters.

Do not create a physical `demos/` directory in the WordPress webroot, which could shadow the existing native Demos route. This companion's `template_redirect` handler at priority `-100` serves only the exact lab path. Every other page and demo continues through its existing handler. The reviewed Headquarters/native-content changes provide the public Demos and menu links separately.

Only GET and HEAD are supported. The gallery without its final slash redirects to the canonical URL. Unknown or unsafe names return the branded 404. Dot paths, encoded path tricks, internal metadata, PHP files, and unlisted files cannot be served through the adapter. Assets must match the manifest's path, byte length, and SHA-256 hash and resolve inside the companion's `site/` directory. It sends the shared CSP/privacy headers from `_headers`, and gameplay remains entirely in the browser.

Development verification uses `php -l wordpress/htsg-interactive-lab/htsg-interactive-lab.php` and `php tests/wordpress.test.php` after `npm run package:wordpress`. The workspace has an existing PHP executable in `../custom-pools-showcase/growth-release/tools/php/php.exe`. PHP is only development tooling and part of the existing WordPress host; standalone games do not require it.

After installation, purge SiteGround cache and verify the gallery, all three games, module/image content types, canonical slash, HEAD, branded nested 404, method restrictions, and actual policy headers anonymously. Follow the HTSG home logo, All demos, Rocket Menu, gallery return, and contact links on desktop and mobile. Preserve all existing demos and protected access controls. See [QA.md](QA.md) for actual device coverage and results.

Rollback: deactivate only **HTSG Interactive Lab** to remove its scoped route and administration link. No game records or content require deletion. Restore the preserved Demos content and preceding Headquarters package separately if their discovery changes need rollback. Do not deactivate unrelated demos or perform a sitewide restore for this companion.

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

`Validate static demo` runs on pushes and pull requests. It installs the pinned free testing dependency, runs the game and browser checks, uploads the standalone static build, then builds and checks the WordPress companion and uploads that ZIP as a separate artifact. It does not publish a website. There is no GitHub Pages deployment workflow.

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

Optional build-time `SITE_URL` must be an HTTPS URL without credentials, a query, or a fragment. If omitted, the build retains host-neutral relative social image paths. Provide the final Cloudflare preview URL when making a shareable release for that host.

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

The **HTSG Interactive Lab 1.0.1** companion was uploaded through the existing WordPress plugin installer on October 16, 2026, and its active version was verified after replacement. The gallery and all three game routes are live at [the Interactive Lab](https://holistictechsolutionsgroup.com/demos/interactive-lab/). This release refines landscape phone layouts so the full arcade arena and its touch controls fit together. Desktop/mobile gameplay and navigation verification are recorded in [QA.md](QA.md).

Installed archive: `release/htsg-interactive-lab-wordpress-1.0.1.zip`, 167,592 bytes, SHA-256 `74b0dd800f971d7d9817bdf98a1662e6421b21762f24da8df508c43ac358765d`. The ZIP's 20 files were independently decompressed and matched against the reviewed entry point and static build before installation. PHP lint and 56 adapter scope, canonical-route, permission, collision, integrity, and navigation checks passed. The unchanged 1.0.0 archive remains available locally as a rollback package.

Public source repository: [newpaltzmarketing/htsg-interactive-lab](https://github.com/newpaltzmarketing/htsg-interactive-lab). Hosting uses the existing HTSG WordPress site. No Cloudflare project, Cloudflare deployment, custom domain, or DNS change was created. Cloudflare remains a prepared static hosting alternative.

Public discovery is integrated with native Demos page 226 and Headquarters 2.16.2. The separately maintained Headquarters release supplies the site menu/footer links and the phone-menu positioning and keyboard behavior. Its source and recovery records live in the parent HTSG publication workspace:

- Publication record: `output/interactive-lab-publication-2026-10-16/PUBLICATION.md`.
- Headquarters installer: `output/interactive-lab-publication-2026-10-16/htsg-headquarters-2.16.2.zip` (SHA-256 `c313f09507a3eee80c7975b2cb711929d61a9f2e876500f90e23127f74f7eece`).
- Headquarters source: `output/interactive-lab-publication-2026-10-16/navigation-2.16.2/package/htsg-headquarters/`.
- Preceding Headquarters installer: `output/interactive-lab-publication-2026-10-16/htsg-headquarters-2.16.1.zip`.
- Preserved native Demos content: `output/interactive-lab-publication-2026-10-16/native-content/`.

GitHub Pages was configured to use Actions while preparing the optional preview. No deployment was run, and no Pages publishing workflow is included. A source push runs validation and produces the static artifact only.
