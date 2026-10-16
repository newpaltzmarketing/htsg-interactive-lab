# HTSG Interactive Lab

Three browser games for Holistic Tech Solutions Group demonstrations:

| Game | Play |
| --- | --- |
| Agency Invaders | Move, fire, and defend against incoming requests. |
| Launch Runner | Jump over obstacles and keep the launch moving. |
| Trivia Challenge | Choose answers and review the explanations. |

The site uses static HTML, CSS, SVG, and JavaScript. There is no backend, account system, advertising, analytics, payment service, or paid dependency. Games run locally in the browser. Playwright is a free development dependency used only for browser checks.

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
npm run build
npm run preview
```

The local preview serves `dist/` at `http://127.0.0.1:4173`. `npm run build` replaces only this project's `dist/` folder. It accepts static file types from `public/`, refuses symbolic links and backend entry points, and adds a SHA-256 asset manifest. Source documentation and test files are excluded from deployment. The build adds the shared Content Security Policy to each page and can make social images absolute when `SITE_URL` is provided.

Run `npm run package` to rebuild and create `release/htsg-interactive-lab-deploy.zip`, `release/htsg-interactive-lab-source.zip`, and `release/SHA256SUMS.txt`. The deploy ZIP contains the built site at its root. The source ZIP includes the code, documentation, tests, and workflow configuration; it excludes credentials, dependencies, Git history, and test output.

The validation workflow runs syntax and asset checks, game logic tests, and browser checks before producing a static build artifact. See [QA evidence and remaining device checks](docs/QA.md) for the actual validation scope; browser emulation does not replace physical iOS and Android checks.

## Controls

Use the on-screen buttons on phones and tablets. Desktop arcade controls support arrow keys and Space; the game screen shows the controls for the selected game. Start, pause, resume, and replay are available on the game screen. Games pause when the page loses visibility. Trivia uses ordinary answer buttons and supports keyboard navigation.

## Project structure

| Path | Purpose |
| --- | --- |
| `public/` | All files served to players. |
| `scripts/` | Dependency-free static build, checks, and local server. |
| `tests/` | Game logic and browser validation. |
| `docs/BRANDING.md` | Reusable visual and content system. |
| `docs/QA.md` | Validation results and device coverage. |
| `docs/DEPLOYMENT.md` | GitHub and Cloudflare Pages setup and release procedure. |
| `docs/prototype-readme.md` | Original attachment notes retained as source reference. |

The attachment's handoff notes are reference material. The requested scope is the user's public demonstration brief; speculative features from the attachment are not implemented.

## Publishing

Deployment is deferred at the owner's request. The intended future destination is the separate Cloudflare Pages project `htsg-interactive-lab`, using branch `demo-preview`. The Cloudflare workflow can run only by manual dispatch after deployment is requested again. Pushes validate and package the source without publishing a website. No workflow configures a custom domain, DNS, WordPress, or the live HTSG site. Follow [the deployment guide](docs/DEPLOYMENT.md) for the future release procedure.

Hosting plans and usage limits are external to this code. The project does not enable a paid product or require a paid dependency.
