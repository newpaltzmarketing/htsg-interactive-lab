# Demonstration QA

The lab contains Agency Invaders, Launch Runner, and Trivia Challenge. All game logic and scores stay in the browser. The games have no application backend or paid runtime dependencies.

## Repeatable checks

Use Node.js 22 or later:

```sh
npm ci
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm run build
```

The browser script starts its own temporary local server, applies the production response headers, uses headless Chromium or installed Chrome, and closes the server after testing. Set `CHROME_PATH` to choose an installed compatible browser or `BASE_URL` to test a deployed preview. `PLAYWRIGHT_MODULE_PATH` can point to an existing Playwright `index.mjs` when using a managed development runtime.

After building, a narrow smoke check of the production files can run without repeating the entire suite:

```sh
npm run test:browser -- --dir dist --match 320px --match runner
```

`--dir dist` selects built files, including the build's security-policy meta tag. Repeat `--match` to select test names by pattern. The final browser-error check always runs. `QA_SITE_DIR` and `QA_MATCH` provide the same directory/filter options through environment variables.

For an authorized public deployment, `--url https://example.com/path/` runs the same game checks against its live directory and preserves subpath-relative game and module URLs. Add `--touch-all` to exercise touch controls at 320 and 390 pixels plus 844 × 390 landscape; the default touch control run uses 390 pixels. `--skip404` omits the standalone hosting 404 check when a parent website owns error routing. No game check submits information or changes the deployed site.

The separate public integration check accepts the real site, demos-page, and lab URLs:

```sh
node tests/live-qa.mjs --site-url https://example.com/ --demos-url https://example.com/demos/ --lab-url https://example.com/lab/ --menu-label Demos
```

It checks deployed asset types, security-policy/module loading, static-adapter HTTP behavior, the public menu, gallery destinations, and desktop/mobile/landscape layouts. The adapter check sends one empty request to the static lab URL and expects HTTP 405; it never submits contact forms or accesses an account or administrator page. Integration screenshots and reports are saved in `artifacts/live-qa/`.

Browser screenshots and the machine-readable report are saved in `artifacts/qa/` and excluded from deployment. The report lists each check and any browser exceptions. These artifacts are local review evidence, not game content.

## Automated coverage

The twelve rules tests cover:

- Keyboard and touch sources held at the same time, individual release, repeated keydown, and clearing held controls.
- Agency Invaders movement bounds and direction speed, simultaneous directions, delayed-frame caps, firing cooldown, projectile collisions, life loss, game over, and clean restart state.
- Launch Runner jump and landing, double-jump prevention, safe obstacle clearance, collision, distance scoring, game over, and clean restart state.
- Every trivia question, correct and incorrect scoring, invalid answer indices, and a perfect and zero score.

The browser suite covers:

- All four routes at desktop 1280 × 900, mobile portrait 390 × 844, 360 × 800, 320 × 740, and mobile landscape 844 × 390.
- Horizontal overflow, game route availability, start, pause, resume, restart, and frozen canvas while paused.
- Repeated restart without accumulating animation loops, keyboard movement and release, automatic pause on window blur, and native Space activation on session buttons.
- Chromium touch emulation: hold movement and Fire together, cancel touches, release a captured pointer outside a button, jump by button or arena tap, and trivia answer/continuation taps.
- Trivia results at 5/5 and 0/5, disabled answered choices, keyboard continuation, and focus after answering and restarting.
- Invalid game query fallback and browser errors.
- A nested missing URL: branded 404 response, root-relative stylesheet and favicon, correct gallery return link, and desktop/mobile screenshots.

## Scope and demonstration checklist

Mobile checks use Chromium browser emulation. They do not constitute testing on physical iOS or Android hardware, and they do not establish Safari compatibility.

Before a public demonstration:

- Open the preview URL on the actual presentation computer and phone.
- Play one run of each game using the intended keyboard or touch controls.
- Switch tabs during an arcade game and confirm it pauses; return and select Resume.
- Check the projected or shared-screen size and ensure browser zoom is appropriate.
- Recheck the preview after changing any brand asset, question, control, or game rule.

The lab does not collect lead information or persist scores. Navigating away resets a run. External project links open the HTSG contact page in another tab.

## Verification record

Verification completed on 16 October 2026 at 3:51 p.m. EDT with Playwright 1.64.1 and installed Chrome 155.0.8059.40 in headless mode. The rules suite passed 12/12. The initial complete source browser suite passed all 18 scenarios. The nested-404 scenario was then added and checked separately; a new unfiltered run includes 19 browser scenarios.

The final mobile artwork and desktop/mobile game screens were visually reviewed, including the paused status and controls at 320 pixels. The final header and small-screen gallery were captured again from the production build.

A targeted follow-up applied the production security headers to the local source preview. Layouts at 320 and 390 pixels, arcade pause/resume/restart, multi-touch cancellation, runner taps, and a perfect trivia run passed. A timing-sensitive Runner assertion was corrected to read the zero-distance reset synchronously, before a subsequent animation frame can legitimately increase the counter; both Runner scenarios then passed. This was a test-harness correction, not an application defect.

The final production-build smoke passed 4/4 checks at 3:50 p.m. EDT: 320-pixel gallery/game layouts, Runner session controls, a single animation loop after repeated restart, and no browser errors. The corrected nested-404 check and browser-error check then passed 2/2 at 3:51 p.m. EDT, including screenshots at 1280 and 390 pixels. These focused checks overlap the original coverage and are not added together as a larger test count.

Final production-build results are recorded in `artifacts/qa/results.json`. The initial complete source result is preserved as `artifacts/qa/full-results.json`; timestamped reports preserve subsequent focused runs. No unresolved application failures remain from these checks. Physical-device and Safari checks remain outside this verification scope.

## Live verification

On 16 October 2026 at 5:04 p.m. EDT, all 25 live game scenarios passed against [the published HTSG Interactive Lab](https://holistictechsolutionsgroup.com/demos/interactive-lab/), using Chrome 155.0.8059.84 with Playwright 1.64.1. This run contains the standard 19 browser scenarios and six additional touch-control scenarios at 320 pixels and 844 × 390 landscape. There were no browser exceptions or resource errors.

The live run covered the actual deployed ES modules, all three games, every gallery/game layout at 1280, 390, 360, 320, and landscape 844 pixels, desktop keyboard controls, touch controls at 390/320/844 pixels, pause/resume/restart, trivia perfect and zero scores, focus behavior, and the scoped nested 404. The subpath 404 retained its stylesheet, favicon, and working gallery link. Live desktop/mobile gallery, running Invaders, and small-screen paused views were visually reviewed.

The complete 25-scenario live game proof is preserved in `artifacts/live-games/full-results.json` and its timestamped copy. `artifacts/live-games/results.json` holds the latest focused follow-up. The accompanying screenshots show the published site. These results are Chromium touch emulation on the public site; physical iOS/Android devices and Safari remain untested.

A separate landscape viewport review then found that the initial 844 × 390 arcade canvas and touch controls could not be seen together. Version 1.0.1 adds a compact landscape layout with controls beside a proportional arena. At 5:13 p.m. EDT, the published fix passed eight viewport observations across Invaders and Runner: ready, running, paused, and after rotating through 390-pixel portrait. The whole arena and every touch control fit simultaneously, all control targets were at least 44 × 44 pixels, touch movement/firing/jumping worked, paused scores survived rotation, and no overflow or browser errors occurred. The live arena measured approximately 409 × 230 pixels and ended at vertical pixel 363 within the 390-pixel screen.

The dedicated check can be repeated with:

```sh
node tests/landscape-review.mjs https://holistictechsolutionsgroup.com/demos/interactive-lab/ --require-fit
```

Its viewport screenshots and detailed geometry are in `artifacts/live-landscape/`. It complements full-page layout checks by requiring the arena and controls to be visible on the same screen.

The standard 844 × 390 browser layout scenario now includes this visibility assertion for both arcade games, so the default suite remains 19 scenarios and catches the original landscape defect. The updated standard scenario and browser-error check passed against both the local source and the published 1.0.1 release.

## Live HTSG integration

The 19 public integration scenarios covered the deployed file types and ES modules, CSP, canonical directory redirect, HEAD responses, rejected empty POST, scoped 404, homepage menu routes, the Demos page's three direct game links and gallery link, the homepage footer's Lab link, and the Lab's All demos and Rocket Menu return routes. These checks ran at 1280 × 900, 390 × 844, 320 × 740, and 844 × 390. The existing seven Demos dropdown destinations were checked for unchanged paths and order.

The initial run passed 17/19 and exposed two real menu failures at 320 pixels and in landscape: desktop centering persisted in the mobile vertical menu, placing its first links behind the header. HQ 2.16.2 corrects the mobile alignment and skips hidden introduction links when handling arrow-key focus. At 5:17 p.m. EDT on 16 October 2026, all four dropdown journeys passed again on the actual public site, including the two previously failing widths. The other integration cases had already passed and were unchanged by this navigation-only fix.

The published HQ 2.16.2 navigation also passed 21/21 focused checks: all six panels at desktop 1280, phone 320, and landscape 844 pixels moved ArrowDown/ArrowUp focus to their visible first/last links with a clear focus indicator; the two mobile Demos flows accepted real emulated touch taps; no browser exceptions occurred. Menu screenshots were taken after the opacity transition settled. No forced clicks or contact-form submissions were used.

The final state is Lab 1.0.1 and HQ 2.16.2. No unresolved failures remain from these game, viewport, control, navigation, and deployment-path checks. Reports and final proof are in:

- `artifacts/live-qa/`: integration reports and the public desktop Demos directory screenshot.
- `artifacts/navigation-live/`: actual published keyboard/touch navigation results and settled 320-pixel menu proof.
- `artifacts/live-games/`: complete live game results and desktop/mobile game screenshots.
- `artifacts/live-landscape/`: published compact landscape viewport and rotation proof.
