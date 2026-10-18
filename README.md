# HTSG Gamification Labs

**1.5.3 is installed** with an orbital agency office backdrop, a matching game-gallery preview and a newly versioned three-game sharing cover. Desktop/phone artwork and public image/metadata checks passed. Engine rules remain 1.5.0 and Community remains 1.0.5; the separate WordPress homepage/Community presentation is unchanged.

The retained **1.5.2 character artwork** makes the falling Scope Creep hazard an animated finger-wagging client, with the same movement and hitbox. Its Help icon uses the same artwork. Rules remain 1.5.0 and Community remains 1.0.5; all three games and their URLs are preserved.

Retained features include a compact pause panel, weapon-family switching while paused and more generous, gently guided missiles. Challenges use separate versioned weekly scores; existing history and unexpired prior attempts are preserved by the coordinated Community 1.0.5 update. The phone dashboard also keeps the arena height fixed when a fallback font wraps a weapon label. Challenge rules remain 1.5.0 and Community remains 1.0.5. All three games retain their public URLs.

Three browser games for Holistic Tech Solutions Group demonstrations:

| Game | Play |
| --- | --- |
| [Agency Invaders](https://holistictechsolutionsgroup.com/demos/interactive-lab/play.html?game=invaders) | Choose spread or focused fire, collect side missiles, and outfly named agency bosses. |
| [Launch Runner](https://holistictechsolutionsgroup.com/demos/interactive-lab/play.html?game=runner) | Take the actual Halo character past barriers with double jumps and energy boosts. |
| [Trivia Challenge](https://holistictechsolutionsgroup.com/demos/interactive-lab/play.html?game=trivia) | Explore three sets of five questions, with streaks and explanations. |

The recognizable agency-object enemies, paper/printer bosses and reviewed sharing cover are retained. See the [change notes](docs/CHANGELOG.md) for the current pause and missile mechanics.

The installed game lets you choose Spread/Focused from one pause panel, retain earned upgrades when switching, and collect up to eight guided missile pairs. The first upgrade supplies four pairs; capsules add six. Optional sound starts muted and its volume is saved only on this browser. The 390 × 844 phone playfield remains 678 CSS pixels high. All three games and their public URLs remain stable. See [deployment status](docs/DEPLOYMENT.md#current-publish-status), [QA evidence](docs/QA.md), and [implemented versus future game direction](docs/GAME-DIRECTION.md).

The three games run locally using static HTML, CSS, local artwork and JavaScript. Free play needs no account or backend and remains usable when the optional community connection fails. There is no advertising, analytics, payment service or paid runtime dependency. The game-hosting WordPress companion serves the reviewed files and adds a direct administration link; it creates no game records or API. A separate first-party community plugin supplies the optional challenge service. The owner has enabled its public features and Google configuration; actual existing-member challenge submission, history and the unverified board passed, while fresh Google onboarding has separate acceptance limits in [QA.md](docs/QA.md). Playwright is a free development dependency used only for browser checks.

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
npm run test:polish
npm run test:controls
npm run test:upgrade
npm run test:gamification
npm run build
npm run test:share
npm run test:community
npm run preview
```

The local preview serves `dist/` at `http://127.0.0.1:4173`. `npm run build` replaces only this project's `dist/` folder. It accepts static file types from `public/`, refuses symbolic links and backend entry points, and adds a SHA-256 asset manifest. Source documentation and test files are excluded from deployment. The build adds the shared Content Security Policy and complete social metadata to each page, validating the actual cover image. Metadata uses the configured primary HTSG address; `SITE_URL` rewrites all canonical/social URLs together for an alternate HTTPS host.

Run `npm run package` to rebuild and create `release/htsg-interactive-lab-deploy.zip`, `release/htsg-interactive-lab-source.zip`, and `release/SHA256SUMS.txt`. The deploy ZIP contains the built site at its root. The source ZIP includes code, documentation, tests, workflows, selected artwork originals, exact prompts, and provenance; it excludes credentials, dependencies, Git history, and test output. Only the optimized WebP artwork ships to players.

The validation workflow runs syntax and asset checks, game logic tests, browser checks, the upgrade's touch/fullscreen/layout scenarios, and mandatory raw-HTML/image sharing checks before producing release artifacts. See [QA evidence and remaining device checks](docs/QA.md) for the actual validation scope; browser emulation does not replace physical iOS and Android checks. [The sharing guide](docs/SHARING.md) explains the per-game WordPress metadata, static fallback, and public release check.

## Controls

Drag anywhere in the Invaders arena to fly and fire. The ship follows relative finger movement; lift to stop firing. Direction and Fire buttons remain available, and keyboard controls use arrows or W/A/S/D and Space. Weapons upgrade after three and seven defeated hazards and stay upgraded after a hit. After wave two, choose wide spread or stronger, narrower focused fire without a timer. Missile capsules load up to four pairs that launch automatically alongside primary fire. The dashboard shows the weapon and remaining pairs. Bosses arrive every fifth wave: watch the locked warning marks and move clear. Named hazards show the cause of each lost life; shields absorb one impact. Sound starts off and can be enabled in Help. Pause reveals Restart. Invaders keeps a personal best only in this browser.

Tap the Runner arena, swipe up, or use Jump; a second jump in the air gives extra height. The player provides instructions, pause/resume, replay, previous/next links and a game selector. Full screen uses the native feature where available and an expanded browser layout otherwise. Games pause when the page loses visibility. Trivia uses ordinary answer buttons and supports keyboard navigation.

## Project structure

| Path | Purpose |
| --- | --- |
| `public/` | All files served to players. |
| `public/game-engine.js` | Game rules and state, separate from browser events and drawing. |
| `public/game-renderer.js` | Procedural spacecraft/effects, simulation-timed Halo frames, readable labels, and environment drawing. |
| `public/game-audio.js` | Original synthesized effects, default off and stopped while paused. |
| `public/community-client.js`, `public/community.css` | Optional same-origin challenge connection and overlay; independent of free play. |
| `public/brand.css`, `public/play.css` | Shared brand tokens and the responsive game player. |
| `artwork/` | Selected world originals/prompts, approved Halo source frames, extraction recipe, and file provenance. |
| `scripts/` | Dependency-free static build, checks, and local server. |
| `tests/` | Game logic and browser validation. |
| `wordpress/` | Scoped static-file host for the existing HTSG WordPress site. |
| `docs/BRANDING.md` | Reusable visual and content system. |
| `docs/ARTWORK.md` | Artwork sources, optimization, and stable runtime paths. |
| `public/share.json`, `docs/SHARING.md` | Initial-HTML preview configuration and mandatory release checks. |
| `docs/QA.md` | Validation results and device coverage. |
| `docs/DEPLOYMENT.md` | GitHub and Cloudflare Pages setup and release procedure. |
| `docs/prototype-readme.md` | Original attachment notes retained as source reference. |

The attachment's handoff notes are reference material. The requested scope is the user's public demonstration brief; speculative features from the attachment are not implemented.

## Publishing

The lab is live at [the HTSG Gamification Labs](https://holistictechsolutionsgroup.com/demos/interactive-lab/). Run `npm run package:wordpress` to build the reviewed plugin ZIP for upload through the existing WordPress plugin installer. The games remain browser-only; the companion serves its manifest-listed files on that path. See [the deployment guide](docs/DEPLOYMENT.md) for installation, verification, and rollback.

The separate Cloudflare Pages project `htsg-interactive-lab` remains an optional static hosting route. Its workflow runs only by manual dispatch. Source pushes validate and package code without deploying a website. No workflow configures custom domains or DNS.

Hosting plans and usage limits are external to this code. The project does not enable a paid product or require a paid dependency.
