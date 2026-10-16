# Demonstration QA

The lab contains Agency Invaders, Launch Runner, and Trivia Challenge. All three run in the browser; the deployed site has no server or paid runtime dependencies.

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
