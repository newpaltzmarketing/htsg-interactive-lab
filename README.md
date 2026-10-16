# HTSG Interactive Lab

Three browser games for Holistic Tech Solutions Group demonstrations:

| Game | Play |
| --- | --- |
| [Agency Invaders](https://holistictechsolutionsgroup.com/demos/interactive-lab/play.html?game=invaders) | Fly in two dimensions, clear named business hazards, and collect shields. |
| [Launch Runner](https://holistictechsolutionsgroup.com/demos/interactive-lab/play.html?game=runner) | Take the actual Halo character past barriers with double jumps and energy boosts. |
| [Trivia Challenge](https://holistictechsolutionsgroup.com/demos/interactive-lab/play.html?game=trivia) | Explore three sets of five questions, with streaks and explanations. |

Release **1.1.1 is installed** on the existing HTSG site. It adds a separate thumb steering pad and relative arena dragging, readable named hazards and impact causes, and actual animated Halo artwork for Runner. The cinematic environments, deeper rules, and screen-filling player remain in place. See [deployment status](docs/DEPLOYMENT.md#current-publish-status) for the installed archive and [QA evidence](docs/QA.md) for the actual validation scope.

The games use static HTML, CSS, local artwork, and JavaScript. There is no game backend, account system, advertising, analytics, payment service, or paid dependency. Games run locally in the browser. The WordPress companion serves the reviewed static files through the existing HTSG site and adds a direct administration link. It creates no game records or API. Playwright is a free development dependency used only for browser checks.

## Run locally

Use Node.js 22 or later. No dependency installation is required to serve or build the site.

```sh
npm run dev
```

Open `http://127.0.0.1:4173`. To use a different port, run `npm run dev -- --port 8080`.

## Validate and build

```sh
npm ci
npx playwright install chromium
npm run check
npm test
npm run test:browser
npm run test:upgrade
npm run build
npm run preview
```

The local preview serves `dist/` at `http://127.0.0.1:4173`. `npm run build` replaces only this project's `dist/` folder. It accepts static file types from `public/`, refuses symbolic links and backend entry points, and adds a SHA-256 asset manifest. Source documentation and test files are excluded from deployment. The build adds the shared Content Security Policy to each page and can make social images absolute when `SITE_URL` is provided.

Run `npm run package` to rebuild and create `release/htsg-interactive-lab-deploy.zip`, `release/htsg-interactive-lab-source.zip`, and `release/SHA256SUMS.txt`. The deploy ZIP contains the built site at its root. The source ZIP includes code, documentation, tests, workflows, selected artwork originals, exact prompts, and provenance; it excludes credentials, dependencies, Git history, and test output. Only the optimized WebP artwork ships to players.

The validation workflow runs syntax and asset checks, game logic tests, browser checks, and the upgrade's touch/fullscreen/layout scenarios before producing a static build artifact. See [QA evidence and remaining device checks](docs/QA.md) for the actual validation scope; browser emulation does not replace physical iOS and Android checks.

## Controls

Drag and hold the Invaders pad below the arena to fly in any direction and fire, keeping your thumb clear of the ship. Relative dragging in the arena and the direction/Fire buttons also work; keyboard controls use arrows or W/A/S/D and Space. Named hazards cost a life when they collide with the ship or pass its defenses, with the cause shown after impact. Tap the Runner arena, swipe up, or use Jump; a second jump in the air gives extra height. The game player provides instructions, pause/resume, replay, previous/next game links, and a game selector. The expand control uses native full screen where available and an expanded browser layout otherwise. Games pause when the page loses visibility. Trivia uses ordinary answer buttons and supports keyboard navigation.

## Project structure

| Path | Purpose |
| --- | --- |
| `public/` | All files served to players. |
| `public/game-engine.js` | Game rules and state, separate from browser events and drawing. |
| `public/game-renderer.js` | Procedural spacecraft/effects, simulation-timed Halo frames, readable labels, and environment drawing. |
| `public/brand.css`, `public/play.css` | Shared brand tokens and the responsive game player. |
| `artwork/` | Selected world originals/prompts, approved Halo source frames, extraction recipe, and file provenance. |
| `scripts/` | Dependency-free static build, checks, and local server. |
| `tests/` | Game logic and browser validation. |
| `wordpress/` | Scoped static-file host for the existing HTSG WordPress site. |
| `docs/BRANDING.md` | Reusable visual and content system. |
| `docs/ARTWORK.md` | Artwork sources, optimization, and stable runtime paths. |
| `docs/QA.md` | Validation results and device coverage. |
| `docs/DEPLOYMENT.md` | GitHub and Cloudflare Pages setup and release procedure. |
| `docs/prototype-readme.md` | Original attachment notes retained as source reference. |

The attachment's handoff notes are reference material. The requested scope is the user's public demonstration brief; speculative features from the attachment are not implemented.

## Publishing

The lab is live at [the HTSG Interactive Lab](https://holistictechsolutionsgroup.com/demos/interactive-lab/). Run `npm run package:wordpress` to build the reviewed plugin ZIP for upload through the existing WordPress plugin installer. The games remain browser-only; the companion serves its manifest-listed files on that path. See [the deployment guide](docs/DEPLOYMENT.md) for installation, verification, and rollback.

The separate Cloudflare Pages project `htsg-interactive-lab` remains an optional static hosting route. Its workflow runs only by manual dispatch. Source pushes validate and package code without deploying a website. No workflow configures custom domains or DNS.

Hosting plans and usage limits are external to this code. The project does not enable a paid product or require a paid dependency.
