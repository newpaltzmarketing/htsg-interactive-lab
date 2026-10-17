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
npm run test:upgrade
npm run build
npm run test:share
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

The 33 rules tests cover:

- Keyboard and touch sources held at the same time, individual release, repeated keydown, and clearing held controls.
- Agency Invaders two-axis movement, simultaneous directions, relative drag and thumb-stick input with per-axis keyboard priority, portrait thumb clearance and proportional travel time, delayed-frame caps, firing and collisions at the moved ship position, six named hazards, life loss, shield protection, wave transitions, combo scoring, game over, and clean restart state.
- Launch Runner two-jump limit and landing reset, safe obstacle clearance, collision, energy pickups and boost protection, distance scoring, game over, and clean restart state. Portrait collision and collection areas match the enlarged artwork; camera framing preserves the full astronaut without changing jump physics.
- Resize preserves arcade progress and relative positions; Runner retains its physical jump height and velocity.
- Every trivia question, correct and incorrect scoring, invalid answer indices, perfect and zero scores, and three distinct replay rounds containing 15 questions.

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

At that publication check, the installed versions were Lab 1.0.1 and HQ 2.16.2. No unresolved failures remained from those game, viewport, control, navigation, and deployment-path checks. Reports and final proof are in:

- `artifacts/live-qa/`: integration reports and the public desktop Demos directory screenshot.
- `artifacts/navigation-live/`: actual published keyboard/touch navigation results and settled 320-pixel menu proof.
- `artifacts/live-games/`: complete live game results and desktop/mobile game screenshots.
- `artifacts/live-landscape/`: published compact landscape viewport and rotation proof.

## Cinematic upgrade verification — 1.1.0 candidate

The 1.1.0 upgrade was verified locally on 16 October 2026 with Playwright 1.64.1 and Chrome 155.0.8059.84. These results describe the candidate source; the prior live-publication record above does not establish that this upgrade has been published.

The final rules suite passed 24/24. The existing complete browser suite passed 25/25, including the six additional touch scenarios, with no browser exceptions or failed resources. The upgrade suite passed 20/20. The suites have overlapping coverage and their counts are not added together.

The upgrade suite checks:

- Both cinematic arcade games at 320 × 740, 390 × 844, 844 × 390, 1280 × 900, and 1440 × 900. The arena fills the available screen shape; its full visible area and every essential navigation/session/touch target fit together. Enabled targets are uncovered and at least 44 × 44 CSS pixels.
- Actual touch drag steering, both arena edges, pointer release and cancellation, plus assistive-technology click nudges using the same bounds. Keyboard movement, held input clearing, pause/restart, native button activation, and a single animation loop remain covered by the core suite.
- Paused and active portrait/landscape rotation, retained score and jump physics, and the full astronaut remaining visible at a landscape double-jump apex.
- Native fullscreen entry and exit, with `document.fullscreenElement` explicitly checked; a deliberately rejected API tests the expanded-view fallback and Escape exit. Both retain the paused run.
- Touch navigation through previous/next links and all three game-picker destinations. Help and the picker pause gameplay, dismiss on resume, and restore canvas focus; Escape closes the picker and restores its summary focus.
- Readable trivia questions and answers at all five widths, answer/continuation focus, all 15 questions across three perfect rounds, progress, review, clean replay, and a working results skip-link focus target.
- Simulated safe insets at 320/390-pixel portrait and 844-pixel landscape using the same CSS variables that read device safe-area values. Navigation and controls remain inside the usable area.
- No browser exceptions, resource errors, or renderer mutations of game state. Client-only observation wraps the original renderer; production files contain no test globals.

After the complete runs, focused follow-ups passed 4/4 for explicit native-versus-fallback fullscreen and release/cancel observations, then 4/4 for the final Help/picker resume, accessible edge nudges, and trivia results skip-link fixes. These follow-ups overlap the 20 upgrade scenarios and do not increase the scenario count. No unresolved application failures remained.

Desktop and phone captures were visually reviewed after real gameplay, including enemies and projectiles in Invaders and an approaching obstacle, energy pickups, and a jump in Runner after approximately 2–3 seconds. The final portrait Runner has a shallow track and enlarged character/obstacles; the landscape double-jump camera keeps the astronaut in view. Trivia answers, explanations, and focus rings remain legible at 320 pixels. Fullscreen, safe-inset, paused, and ready views were also reviewed.

Repeat the upgrade checks with `npm run test:upgrade`. The script starts and closes its own local fixture with the production security headers, or accepts `--url`, `--dir`, repeated `--match`, and an optional `--output` directory. It saves viewport screenshots, geometry, browser version, and timestamped results in `artifacts/upgrade-qa/` (or `artifacts/upgrade-live/` for a public URL). The original full 20-scenario record is `artifacts/upgrade-qa/full-results-1.1.0.json`; `results.json` holds the latest focused follow-up. The final core record for that candidate is `artifacts/qa/upgrade-core-full-results.json`.

Representative final visual evidence is `runner-running-390.png`, `runner-running-844.png`, `runner-double-jump-apex-844.png`, `invaders-running-390.png`, `invaders-running-1280.png`, `trivia-answer-320.png`, and `fullscreen-fallback-390.png` in `artifacts/upgrade-qa/`.

All mobile interaction checks use Chromium touch emulation. Safe insets are simulated; no physical notch, iPhone, Android device, mobile browser fullscreen policy, or Safari was tested. The desktop browser API and fallback behavior are verified within this stated scope.

## Published cinematic upgrade — 1.1.0

On 16 October 2026 at approximately 5:45 p.m. EDT, the same frozen tests passed against [the published 1.1.0 Lab](https://holistictechsolutionsgroup.com/demos/interactive-lab/): all 20 upgrade scenarios and all 25 complete core browser scenarios passed. There were no browser exceptions, resource errors, or renderer state mutations. These were actual public-path tests with Playwright 1.64.1 and Chrome 155.0.8059.84; local source evidence is preserved separately.

The live upgrade run includes every final controller regression: Help/picker dismissal on resume, canvas focus, accessible edge nudges, and the trivia results skip target. It also verifies actual native fullscreen, rejected-API fallback, drag/release/cancel, landscape camera framing, active/paused rotation, safe-inset simulation, the three replay rounds, and the five screen sizes listed above.

Eleven published module, stylesheet, and world-art files matched the frozen source byte-for-byte by SHA-256, including all three new WebP backgrounds and `game-renderer.js`. A cache-busted `game.js` matched too. The published game HTML contains the new viewport/picker structure and serves the expected security policy.

A focused public discovery smoke passed 8/8 at desktop 1280 and phone 390 pixels: menu-to-Demos, dropdown-to-Lab, the directory's three direct game links and gallery destination, homepage footer-to-Lab, and Lab return routes to All demos and the Rocket Menu. The parent navigation implementation was unchanged; the complete HQ keyboard audit was not repeated.

Fresh public action screenshots were visually reviewed for Runner at 390 pixels and 844 × 390 landscape, Invaders at 390 and 1280 pixels, and trivia at 320 pixels. Final desktop/mobile gallery screenshots were captured after all three lazy-loaded artwork images decoded. An earlier automatic gallery screenshot preceded two lazy image loads; the settled captures supersede it. No application change was needed.

Final published evidence:

- `artifacts/upgrade-live/full-results-1.1.0.json`: 20/20 upgrade scenarios.
- `artifacts/live-games/full-results-1.1.0.json`: 25/25 core browser scenarios.
- `artifacts/live-qa/discovery-results-1.1.0.json`: 8/8 focused discovery scenarios.
- `artifacts/upgrade-live/release-files.json`: production file hashes and freshness/security checks.
- `artifacts/upgrade-live/`: public `runner-running-390.png`, `runner-running-844.png`, `invaders-running-390.png`, `invaders-running-1280.png`, `trivia-answer-320.png`, `gallery-settled-1280.png`, and `gallery-settled-390.png`.

No unresolved failures remain from this published upgrade verification. Mobile results remain Chromium touch/viewport emulation with simulated safe insets; physical devices and Safari are outside the verified scope.

## Thumb controls, named hazards and Halo — 1.1.1 candidate

Local verification completed on 16 October 2026 at approximately 7:12 p.m. EDT with Chrome 155.0.8059.84 and Playwright 1.64.1. All 33 engine tests, all 25 core browser scenarios, and all 30 upgrade scenarios passed. A focused three-scenario follow-up also passed for the final named game-over cause and alpha-bound apex checks. These overlapping counts are reported separately.

The expanded upgrade suite adds 568 × 320 landscape to the existing five sizes. Invaders now has a steering pad below the arena and relative two-axis arena dragging. Real emulated touches verify that distant contact, dead-zone jitter and re-grabbing do not teleport the ship; holding diagonal pad deflection moves continuously; both release and cancellation stop both axes. Holding Fire with another finger releases independently. A remaining pad or arena finger takes over when the first finger lifts, anchored to the current ship position. Both promotion directions are tested. At 320, 390, 568 and 844 pixels, the pad and every essential control fit below the full arena without covering the ship.

The six named hazards are checked at a minimum 13 CSS pixels, within the arena edges, and outside the actual score/wave and impact-feedback rectangles. A real normal-play capture exposed a label behind the HUD; the final renderer now avoids those rectangles and nearby labels, adds a leader when needed, and briefly waits when no close position is free. The regression checks the actual controller-provided reservations and drawn label positions. Natural gameplay supplies the named-target and first life-loss screenshots. Only shield protection and the final-life overlay use client-only deterministic state setup; their normal engine and controller behavior still execute, and those fixtures are not presented as unassisted play.

Launch Runner retains its name and physics while displaying Halo through articulated frames from the supplied animation. The test observes the actual atlas crops drawn during play, confirms different frames appear, and checks a pixel-identical frozen scene when paused. Reduced motion fixes the cosmetic pose/background while preserving playable jumping. The visible per-frame alpha bounds, cape, tilt, grounded boots, portrait enlargement and short-arena camera are checked without changing collision geometry. Actual landscape double-jump and rotation captures remain inside the arena.

The supplied prototype ZIP and earliest tracked preparation were inspected read-only: they contain unnamed canvas enemies and the wording “incoming project chaos”; they do not contain a Scope creep hazard-name list. The named hazards are a requested refinement, not recovered prototype metadata.

Local evidence is preserved in `artifacts/touch-polish-source/`: `full-results.json` contains the 30-scenario run, `core-results.json` the 25 core scenarios, and timestamped focused reports the final follow-up. Representative screenshots include `invaders-thumb-pad-390.png`, `invaders-thumb-pad-568.png`, `invaders-named-hazards-390.png`, `invaders-natural-impact-390.png`, `runner-running-390.png`, `runner-running-844.png`, and `runner-double-jump-apex-844.png`. The complete changed game surfaces were visually reviewed on phone and desktop. No unresolved local failures remain.

For version-separated public proof after an authorized publication, use `--output artifacts/touch-polish-live` with the public URL. The prior 1.1.0 publication evidence remains in `artifacts/upgrade-live/`. This candidate record does not claim that 1.1.1 is published. Mobile checks remain Chromium emulation; physical devices and Safari are untested.

## Published thumb-control and Halo refinements — 1.1.1

At approximately 7:15 p.m. EDT on 16 October 2026, the authorized public 1.1.1 update passed all 16 selected live upgrade scenarios with Chrome 155.0.8059.84 and Playwright 1.64.1. The focused selection covers 390-pixel portrait, 568 × 320 and 844 × 390 landscape layouts and trivia answers; the corresponding thumb-pad controls; relative two-axis arena drag and release; both finger-promotion directions; named hazard/impact/HUD avoidance; actual Halo frame changes, pause and reduced motion; navigation among all three games; and browser errors. There were no unresolved failures, exceptions or renderer state mutations.

All 13 published JavaScript, stylesheet and artwork files matched the frozen tested source by SHA-256, including the Halo atlas and fallback image. A cache-busted `game.js` also matched, and the public game HTML exposes the current pad/impact structure with the expected security policy. The unchanged complete core suite was not repeated on the public site; its final 25-scenario source run and the 30-scenario source upgrade run remain recorded above.

Fresh public screenshots were visually reviewed. `runner-running-844.png` and `runner-running-390.png` show Halo jumping with an approaching obstacle and energy pickups during normal play. `invaders-running-390.png`, `invaders-running-844.png`, `invaders-named-hazards-390.png` and `invaders-natural-impact-390.png` show actual gameplay, the separate thumb pad, readable names and a natural first life-loss event. These representative screenshots use no state fixture. The separate shield and final-life regression setup remains explicitly deterministic as described above.

The final public report is `artifacts/touch-polish-live/focused-results-1.1.1.json`; file identity and freshness proof is `artifacts/touch-polish-live/release-files.json`. All new public images are in that directory, preserving the earlier 1.1.0 evidence. This verification uses Chromium touch and viewport emulation with the stated physical-device and Safari limitations.

## Sharing cover and metadata — 1.1.2

The initial anonymous audit checked the gallery, its `index.html` alias, and all three game URLs with normal, Facebook, Twitter and LinkedIn user agents. All 20 page responses were successful. The three game URLs contained no Open Graph, Twitter or canonical fields in their initial HTML; their runtime JavaScript titles were unavailable to a raw crawler. The gallery already advertised a reachable 1200 × 630 PNG, but omitted its canonical identity, image dimensions/alternative text and explicit Twitter image. The existing image returned 200 to anonymous and simulated Facebook requests, and robots rules did not block the Lab. That audit supports the direct-game metadata diagnosis; it does not establish a missing-image response or crawler block for the gallery.

Version 1.1.2 adds the reviewed all-games montage at `assets/lab-share-20261016.jpg` (1200 × 630, image/jpeg, 125,637 bytes) and complete initial-HTML sharing fields. The required object identity and structured image fields follow the [Open Graph protocol](https://ogp.me/). The WordPress adapter supplies the matching title, description, `og:url` and canonical for each game query; the gallery alias canonicalizes to the directory. Missing/unknown game values and static hosts retain a complete generic player card. The image URL is dated so the new cover has a distinct cache identity.

The repeatable `npm run test:share` gate passed 14/14 against the exact local staged WordPress adapter. Its `--static` mode also passed 14/14 against the static-host fallback. These are separate, overlapping runs. The gate checks source and built HTML, five URLs under three user agents, query fallbacks, JPEG/PNG signature and declared dimensions/type, source-image hash, GET/HEAD consistency, image access with JavaScript disabled, phone-card renditions, and a brief phone flow in every game. The exact adapter fixture requires PHP; `PHP_PATH` can select it. The static mode uses no PHP. CI runs the adapter gate after building, and the Cloudflare workflow selects `--static`.

At approximately 8:08 p.m. EDT on 16 October 2026, all 14 sharing checks passed against the installed public 1.1.2 release with Playwright 1.64.1 and Chrome 155.0.8059.84. Gallery/index and game metadata was identical for anonymous, Facebook and Twitter user-agent requests; all three game titles and canonicals were correct before JavaScript. The served JPEG matched the reviewed source, returned the correct image type/dimensions/length on GET and HEAD, and loaded without JavaScript. All three brief phone game flows passed with no browser errors. Independent SHA-256 comparisons confirmed all 13 published gameplay/style/world/Halo files were unchanged from 1.1.1. Both visible HTML bodies also matched the 1.1.1 source after line-ending normalization; this release changes sharing metadata and cover presentation.

The full cover and 320/390-pixel card renditions were visually reviewed: the Lab title and three game scenes/icons remain identifiable. A forced center-square crop trims side content and branding; it is a crop stress test, not the intended wide card. Automated card images are explicitly local layout simulations, not screenshots from a social platform.

Actual Facebook Sharing Debugger checks were then completed on the public gallery and all three game links. Fresh scrapes showed the new JPEG, route-appropriate titles/descriptions/canonicals and the complete wide montage. An older cached Invaders result initially inferred an image; “Scrape Again” replaced that result with the explicit new image metadata. The final refreshed results had no missing-image warning. The unrelated optional `fb:app_id` warning was left unset because this site does not use a Facebook app. No social post was published. These actual platform checks are distinct from the automated user-agent simulations and do not promise how every future platform cache or crop will behave.

Evidence is separated from prior releases:

- `artifacts/share-preview-source/before-audit.json`: original raw metadata/crawler/image audit.
- `artifacts/share-preview-source/adapter-results-1.1.2.json`: local 14-scenario adapter result; `static-host/results.json` records the static mode.
- `artifacts/share-preview-live/full-results-1.1.2.json`: public 14-scenario result, response hashes and declared scope.
- `artifacts/share-preview-live/gameplay-identity.json`: unchanged published gameplay files and visible HTML bodies.
- `artifacts/share-preview-live/card-preview-320.png` and `card-preview-390.png`: small-card layout simulations using the real served image/metadata.
- `artifacts/share-preview-live/facebook-{gallery,invaders,runner,trivia}-preview.png`: actual refreshed Facebook debugger screenshots.

No unresolved sharing or gameplay-smoke failure remains. Physical phones and Safari remain outside the browser-emulation scope. Re-run the sharing gate after changing the cover, metadata configuration, build rewriting or adapter response handling; a valid share image is a release requirement rather than a manual afterthought.
