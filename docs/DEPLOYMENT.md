# HTSG Interactive Lab deployment

Prepared October 16, 2026. This is a separate static demonstration project. Do not connect a custom domain, change DNS, replace HTSG WordPress files, or embed/link from the live HTSG website without the owner's approval.

The owner subsequently requested: “Finish the tested package; deploy later.” No preview website is being published for this delivery. The procedures below are prepared for a future deployment request.

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

`Validate static demo` runs on pushes and pull requests. It installs the pinned free testing dependency, runs the game and browser checks, and uploads the static build as an artifact. It does not publish a website. There is no GitHub Pages deployment workflow.

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

`frame-ancestors 'self'` currently prevents embedding on other domains. If HTSG later approves embedding, explicitly allow the approved origin in `_headers`, redeploy the demo, and test the integration separately. There is no live-site integration in this release.

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

Public source repository: [newpaltzmarketing/htsg-interactive-lab](https://github.com/newpaltzmarketing/htsg-interactive-lab). Website deployment is deferred at the owner's request. No Cloudflare project, custom domain, DNS change, live HTSG website change, or preview deployment is part of this delivery.

GitHub Pages was configured to use Actions while preparing the optional preview. No deployment was run, and no Pages publishing workflow is included. A source push runs validation and produces the static artifact only.
