# Demonstration QA

## Crossword Break — 1.7.0 installed, October 22, 2026

Three original five-by-five minis are connected and fully checked: 19 open cells and ten clues each, with 30 distinct answers across the bank. The engine's 12 focused tests are included in **105/105 Node tests**. Source checks cover **23 JavaScript files and all three HTML metadata blocks**. The new player passed **10/10 source browser checks** and **10/10 actual public checks**: all three puzzles solved by ordinary keyboard entry, touch keys, arrow/Space/Backspace/Enter/Tab behavior, word checking, one-letter hints, confirmed clearing, persistence across reload/puzzle changes, blocked-storage feedback and direct four-game navigation. Source and live screenshots at 1280, 390, 320 and 844 were reviewed. Phone typing keeps the clue, grid and familiar QWERTY keys visible together; narrow letter keys use familiar phone proportions while grid cells and main controls remain at least 44 pixels. Mobile checks are Chromium emulation, not physical phone/Safari tests.

Core regression acceptance covers 20 distinct checks. Six gallery/404 cases initially caught the absent fourth gallery card; its CRLF insertion mismatch was corrected, then all six affected cases plus the shared error gate passed 7/7. The focused four-game touch/keyboard navigation and error gate passed 2/2. Original arcade engines and challenge rules are unchanged. Exact WordPress adapter checks passed **159/159**, sharing checks **15/15 locally and publicly**, with real image GET/HEAD, initial HTML, crawler and no-JavaScript cases. Eight ordinary anonymous public assets matched the frozen build byte-for-byte.

The publisher confirmed active game **1.7.0**, unchanged Community **1.0.6**, and purged SiteGround cache from the stable plugins page. The installer has **46 independently decompressed/matched entries**, **5,418,884 bytes**, SHA-256 `b53f8ad1e1b204a81f3355cc5eca1ea366b7d042102f198f1944f53b5fd0386d`. The dated October 22 cover represents all four games; editable illustration/composition and provenance are retained. It is original representative artwork, not a solved-puzzle screenshot. This static/plugin route has no native WordPress post requiring a featured-image placeholder. Facebook Sharing Debugger fetched the new crossword and refreshed the gallery successfully: HTTP 206 with the correct titles/canonicals, updated descriptions and full October 22 four-game image. The existing nonblocking fb:app_id warning remains. Actual platform screenshots/text are in the parent release folder; no social post was made.

Evidence: parent `output/crossword-break-2026-10-22/evidence/`. No backend, paid runtime dependency, account, email, score or Community data change was introduced. The crossword has no account gate or server score; progress stays in the browser. Existing three game URLs and rules 1.6.0 remain intact.

## Historical personal ships and layered support — 1.6.1

Game 1.6.1, rules 1.6.0 and Community 1.0.6 are installed. Source syntax/metadata checks passed, with **93 Node tests** (including seven renderer checks), **20 core browser**, **eight controls**, **six presentation**, **six expansion UI** and **five Community-client** scenarios. The broader upgrade run passed 29 of 30; the lost final-life cause was restored and its focused case/error gate passed 2/2. Earned phone play passed; the desktop earned run caught a boss name hidden by Inbox Zero, which was corrected and passed the desktop run/error gate 2/2. The final integrated busy/HUD/paused/reduced fixtures passed 4/4 at 320/390/844. The 390×844 canvas stays 390×678 CSS pixels.

The live review caught the ship-selection border still losing to a generic button rule; the final 1.6.1 CSS selector and a rendered-border assertion passed all six local expansion checks. No engine or service change was needed. Source/public fixtures are labeled separately from actual earned gameplay. No physical iOS/Android or Safari test is claimed.

PHP lint and **130 adapter checks** passed. Both candidate and final installers were independently decompressed and compared; final **37 entries**, **3,808,755 bytes**, SHA-256 `efe59cc6cc7105af59156ba69637a1bc7417ec567e1eb92e2b298e1f5ec16c1c`. The initial sharing harness was incorrectly pointed at raw public files without a build manifest and correctly returned 503; the packaged adapter passed **14/14**, as did actual public sharing. This setup error did not affect production. The existing reviewed dated cover remains relevant and unchanged.

WordPress showed both final versions active and SiteGround cache was purged. The fresh Community audit passed **14/14** at **2026-10-18T13:14:56Z**; public descriptor/board/privacy/card checks passed **4/4**. Seven ordinary anonymous asset GETs matched the frozen release exactly. Actual public expansion controls passed 6/6 before the CSS patch; the strengthened final 1.6.1 pass also passed 6/6, including rendered ship/paint border checks at all four viewports. Facebook Sharing Debugger was refreshed successfully (HTTP 200), showing the current copy and October 18 cover; its existing nonblocking fb:app_id warning remains. No social post, new account or synthetic production score was created.

Evidence: parent workspace `output/agency-invaders-expansion-2026-10-18/evidence/`. Ship appearance is device-local. Community comments, company rosters, server-saved appearance and fresh Google onboarding remain outside this release.

## Historical orbital agency office imagery — 1.5.3

The installed release uses the approved orbital agency office in the game player, gallery and sharing cover. Source checks passed **18 JavaScript files**, both HTML/social blocks and the reviewed cover; Node checks passed **70/70**. Presentation passed **6/6**, unavailable-bitmap fallback **4/4**, and final gallery image/decode/link checks **3/3** at 1280/390/320 after the approved 24% crop refinement. Compact 320/390 covers were reviewed. Fixture/real-input scope and unavailable-image limits are indexed in the parent `evidence/QA-SOURCE.md`; no new earned combat or server challenge is claimed.

The scoped build and sharing gate passed **14/14**, PHP lint and **127/127** adapter checks passed, and all **36 installer entries** independently matched the frozen payload. The missing-office test caught the adapter's stale required-world path before publication; the one-path correction was rebuilt and passed PHP/archive checks. Engine/controller/audio, player CSS, Community client, other-game images and the prior dated cover are byte-identical to 1.5.2. Rules remain 1.5.0 and Community remains 1.0.5. The publisher confirmed active game 1.5.3 and unchanged Community 1.0.5 after replacement, then purged SiteGround cache. Bounded ordinary anonymous checks passed **4/4** for the exact world, renderer, new primary cover and changed gallery stylesheet: status, MIME, length and SHA-256 matched the frozen build, without cookies or cache-busting. Actual public sharing passed **14/14** with no browser/resource errors. The publisher also viewed native free play with the office, client and other hazards, left it paused, and refreshed Facebook Sharing Debugger around 03:52Z: HTTP 206 and the complete new October 18 three-game cover were observed; the existing `fb:app_id` warning remained nonblocking. These observed platform results are separate from crawler/card simulations. No social post or Community state change was made. Evidence is `output/agency-invaders-office-2026-10-18/evidence/` in the parent workspace.

## Historical finger-wagging client artwork — 1.5.2

The installed release changes one falling Scope Creep hazard model through the renderer only. Source checks passed **18 JavaScript files** and both initial-HTML metadata/cover checks; Node tests passed **70/70**. Existing presentation checks passed **6/6**, and a bounded actual-size client probe passed **3/3** at 1280/390/320 with no errors. Two simulation ages differ; pause/reduced-motion pixels are stable, collision bounds are unchanged and Help uses the actual renderer helper. These are explicit renderer fixtures, not earned combat. The publisher approved the phone and Help artwork.

The scoped build and sharing gate passed **14/14**, PHP lint and **125/125** adapter checks passed, and all **34 installer entries** independently matched the frozen payload. Only the release field, renderer and derived manifest differ from immutable 1.5.1. Engine rules stay 1.5.0 and Community stays 1.0.5. The approved cover/metadata remain relevant and unchanged. The publisher confirmed active 1.5.2 after replacement and purged SiteGround cache; Community remains unchanged. The ordinary anonymous renderer GET returned HTTP 200 with the exact frozen 61,336-byte file and SHA-256 `7b91c08b8e48427d561f4b3325bb37e352be23ae291e13c4842edfbb4466df7a`. Actual public sharing passed **14/14** with no browser/resource errors. No cookies or cache-busting parameters were used for renderer identity; no account, ticket, score or email preference was changed. Source renderer fixtures and public byte identity are distinct from earned production combat. The publisher also reviewed the actual public Help model/copy and refreshed Facebook Sharing Debugger around 03:36Z: HTTP 206 and the complete unchanged three-game cover were observed; the existing `fb:app_id` warning remained nonblocking. No social post was published. Evidence is in the parent `output/agency-invaders-client-2026-10-18/evidence/` folder; no extra broad local gameplay suite is claimed.

## Historical fixed phone dashboard — 1.5.1

Two required CI runs exposed a real Arial-fallback layout defect: “Quad spread” wrapped to two lines in the narrow dashboard, growing the dock from 69 to 70.578 pixels and shrinking the arena; switching to “Twin lances” restored its height. The initial fixture-timing diagnosis was incomplete. Stronger readiness/geometry assertions remained in place, and the fixture now explicitly exercises Arial. Version **1.5.1** changes only the small-screen Invaders dashboard gap from four to two pixels. Engine rules stay 1.5.0; Community stays 1.0.5.

Final focused boss/Arial checks passed **2/2**, and the 320- and 390-pixel layout runs each passed **2/2** with overlapping error gates counted separately rather than summed. Exact pre-upgrade/Quad/both-family geometry and state checks passed. PHP lint and **125/125** adapter checks passed; all **34 installer entries** independently matched, and the old 1.5.0 archive is unchanged. Only the PHP release field, play.css and derived build manifest differ between installers.

The publisher confirmed active game **1.5.1** and purged site cache; Community remains unchanged. Actual public controls passed **8/8** at 2026-10-18T03:24:34Z, including forced-Arial Single → Quad → Focused → Spread geometry and retained state, all four viewports, settings/audio and other games, with no browser errors. This supersedes the earlier 1.5.0 public controls result for current acceptance. An ordinary anonymous public GET returned the exact corrected stylesheet, and actual public sharing passed **14/14** with no browser/resource errors. Initial HTML, game modules, cover and other-game bytes are unchanged from 1.5.0. Evidence is `evidence/{archive-1.5.1,fallback-regression-fixed,dock-fixed-320,dock-fixed-390,public-controls-1.5.1,css-live-1.5.1,share-live-1.5.1}/` in the parent controls release folder. Required validation for `ec63bc786fa0b3302e8b8d0be3e2c4cb0fc3a8ab` subsequently passed in [run 39093606914](https://github.com/newpaltzmarketing/htsg-interactive-lab/actions/runs/39093606914).

## Historical pause controls and missile supply — 1.5.0

The installed release adds a compact pause panel, paused weapon switching and new missile supply/guidance, requiring challenge rules 1.5.0. Community 1.0.5 issues versioned weekly IDs and separates current boards while preserving history and completion of still-live 1.4.0 tickets. Source checks passed 18 JavaScript files and initial HTML/metadata, and Node tests passed **70/70**. Final source checks passed **8/8 controls**, **20/20 core**, **3/3 earned gameplay**, **5/5 community-client fixtures** and **6/6 presentation/audio** checks. The publisher approved 1280/390/320/844 views; the actual 320-pixel dock-height shift was corrected and retested. The publisher confirmed active game 1.5.0 and Community 1.0.5 after in-place replacement and site-cache purge. The fresh Community member-access audit passed 14/14. Actual public controls passed **8/8** at 2026-10-18T03:13:15Z with no browser errors, covering the four viewport layouts and real published settings/input paths. Boss, earned-upgrade and choice boundaries in this public controls harness use explicit client fixtures, not a new earned production challenge. The separate source earned checks retain their real-input scope. Public evidence is `evidence/public-controls/` and `evidence/QA-PUBLIC.md` in the parent controls release folder.

The upgrade suite has **30 distinct accepted checks**: its first run passed 24 cases, then six outdated pause-overlay layout expectations were corrected for the actual control panel. Those six layouts and the shared error gate passed 7/7 in the focused rerun; the overlapping error check is not counted twice. Earlier reports remain preserved. The earned gameplay checks use real simulation/input; community request/retry and presentation fixtures retain their disclosed boundaries. No production run, account or score is created by these release checks.

The scoped build and sharing gate passed **14/14**, including raw metadata, decoded 1200 × 630 image bytes and brief phone flows for all three games. The obsolete Invaders pause-overlay assertion now checks the actual control panel; the accepted report preserves the earlier failed harness expectation separately. PHP lint and **125/125** adapter checks passed. All **34 installer entries** were independently decompressed and matched to the frozen entry point/build; CRC, safe paths, duplicate checks, the hash sidecar and unchanged 1.4.1 rollback passed. Community compatibility/controller/history checks are recorded separately in that project's QA record and do not claim production ticket mutation. Evidence is in the parent `output/agency-invaders-controls-2026-10-18/evidence/` folder. Chromium mobile emulation does not establish physical-device, Safari or audible-output acceptance.

Actual anonymous game sharing passed **14/14**, and all **28/28** ordinary public non-HTML assets matched the frozen build bytes and SHA-256 without cookies or cache-busting parameters. Community anonymous checks passed **4/4**, covering the current versioned descriptor/board, denied private history and exact relevant sharing image. No ticket, score, account, profile or email preference was changed. Existing old-ticket completion is fixture-tested; no production legacy score was submitted. The publisher also manually checked Pause → Focused → Fullscreen → Exit → Help → Close on the public game. Facebook Sharing Debugger was refreshed around 03:13Z, returned 206 and displayed the exact reviewed three-game cover. Its existing `fb:app_id` identity warning remained nonblocking; no social post was published. Live evidence is `evidence/{share-live,asset-live,community-live}/` in the parent controls release folder.

## Historical agency enemy and firing presentation — 1.4.1

Release **1.4.1 was installed** and refined enemy silhouettes, distinct boss artwork and firing feedback without changing balance, collision geometry or the 1.4.0 challenge rules. The publisher approved mobile hazards, both bosses, Help, desktop printer and landscape artwork. Source checks passed all 18 JavaScript files and both initial-HTML metadata blocks; Node checks passed **59/59** and the complete core browser suite passed **20/20**. The final targeted Help/impact follow-up passed 2/2 with no browser errors. All local release gates are complete; the tested installer was published through WordPress and its version verified.

Focused visual/audio checks passed **6/6** at 1280, 390, 320 and 844 pixels: all six object models, distinct bosses, paused/reduced-motion pixel stability, unchanged simulation state, and actual opt-in Web Audio voice lifecycle including mute/pause/resume. These use disclosed in-memory renderer fixtures with simulation held, not earned combat or a server challenge. The separate collision diagnostic shows outlines only in its named diagnostic images. Physical audio output was not assessed. A focused Help/damage/shield follow-up passed **2/2**, including the shared browser-error check; it verifies names remain in Help and impact feedback after falling labels are removed.

The production-scoped build and existing sharing gate passed **14/14**, including anonymous/crawler initial metadata, image GET/HEAD and decoded 1200 × 630 bytes, no-JavaScript access, compact cards and brief phone flows for all three games. The approved dated cover and engine are byte-identical to the preceding source revision. PHP lint and **125/125** unchanged adapter checks passed. The installed archive has **34 entries**, each independently decompressed and matched to the scoped `dist/` and entry point; CRC, paths, duplicates and the SHA sidecar passed. The publisher confirmed the in-place replacement and purged SiteGround cache. Evidence is `output/agency-invaders-polish-2026-10-17/evidence/{source,hazard-source-final,share-source,archive-candidate}/` in the parent workspace. The immutable installed 1.4.0 rollback was rechecked unchanged. Browser coverage is Chrome with viewport/touch emulation, not Safari or physical devices.

Actual public focused visual/audio checks passed **6/6** with no errors, covering the same four viewport fixture scenes and emulated phone direct drag/fire/audio controls. Six hazards, both bosses, focused lances and paired missiles were rendered from explicit fixture states; those captures are not earned progression or server-challenge proof. `actual-touch-gameplay-390.png` uses real simulation. The publisher reviewed phone and desktop weapon captures and the actual-touch view. Physical sound output and physical mobile devices were not assessed.

Actual anonymous sharing passed **14/14**, and **28/28** ordinary public non-HTML files matched the final scoped build byte-for-byte and by SHA-256, all HTTP 200, without cookies or cache-busting parameters. Facebook Sharing Debugger was actually refreshed for Invaders, returned 200, and displayed the correct title/description and unchanged reviewed JPEG. The existing missing `fb:app_id` warning remained nonblocking; no identity was invented or social post published. Live evidence is `evidence/{live,share-live,asset-live}/`, `evidence/facebook-invaders.{txt,png}` and the public Help/intro images in the parent polish release folder. Existing CI will run the broader required suites after the source push; no fresh full local upgrade or earned-progression run is claimed for this cosmetic release.

## Historical weapon families, missiles and challenge hooks — 1.4.0

Version **1.4.0 was installed**. The release adds an untimed spread/focused choice after wave two, finite paired side missiles, distinct boss patterns, a compact dashboard and default-off optional synthesized sound. All three games remain available without an account. The optional community plugin and Google configuration have separate acceptance; game installation alone does not establish a public sign-in or challenge service.

Final source verification passed **59 Node checks**: **51 engine**, **three personal-best storage** and **five sharing-gate**. The final engine choice guard rejects direct firing during the untimed decision. New rules tests cover focused damage/patterns, finite four-pair inventory and projectile lifetime, fan/stagger boss patterns and queued-shot resize, and reproducible seeded fixed-tick challenges. Source syntax/assets/metadata passed for all 18 JavaScript files and both HTML entry points. The final build/package and separate **4/4 community-client fixtures** also passed; those fixtures include optional-network failure without blocking free play.

The complete core browser run passed 19 checks before the new challenge-controller case; a targeted challenge run passed two checks including the shared error check, for **20 distinct core checks** across those source runs. Final focused gameplay passed **3/3** with earned Focused phone and Spread desktop progression, natural missile collection and expenditure of all four pairs, first-boss completion, pause, replay, sound controls and personal-best storage. Earned-choice isolation passed **2/2**; compact 320-pixel label/layout passed **2/2**; targeted Invaders/Runner phone layouts passed **5/5**. No fresh full 30-case upgrade run is claimed for 1.4. The 390 × 844 canvas remains 678 CSS pixels high.

The focused harness uses fixed lane jitter and actual input events, not score, weapon, enemy or timer injection. Only the disclosed personal-best controller/storage fixture marks an earned run ended without changing its score. Sound checks verify default-off and explicit toggle controls, not physical audio output. Browser coverage uses installed Chrome and mobile emulation; physical iOS/Android and Safari were not tested.

PHP lint and **125/125 adapter checks** passed. Independent Python ZIP validation decompressed and matched all **34 entries** of the installed 3,518,808-byte installer to the final entry point and `dist/`; SHA-256 is `ce1a3f5403572381589de72704467f1d3085b47d438ae7d5194d04cb6438961a`.

Anonymous production focused gameplay passed **3/3** at 01:41:27 UTC on October 18 (9:41 p.m. EDT on October 17). Actual inputs earned Focused fire on the 390-pixel phone and Spread on desktop, naturally collected and expended four missile pairs, defeated the first boss, retained readable boss health during phone/landscape rotation, and exercised touch, pause, replay, sound controls and local-best persistence. The same disclosed lane-jitter, real-input and isolated storage-fixture scope applies. Evidence is `evidence/game-live/results.json` with phone, choice, missile and boss screenshots.

Anonymous production smoke passed all **18 functional core checks** across desktop and mobile, including all three games, touch controls, repeat restart, focus and the challenge-controller boundary. All **28 public non-HTML assets** matched final local build bytes at their ordinary URLs. Initial console-clean checks found `/community/session/` returning a JSON 404, including after community 1.0 was installed with all features off. Stable and uncached probes both had `no-store, private` and cache `MISS`, identifying disabled-state routing rather than stale cache. The separate backend's 1.0.1 correction returns HTTP 200 with a disabled, redacted session. The affected production rerun then passed **3/3**, including clean console/resources and repeated-restart checks: **19 distinct live core checks** across the original functional run and overlapping correction run. No failure was suppressed; earlier reports remain preserved.

The full public sharing rerun passed **14/14** after that correction: raw gallery/index and all three game cards for anonymous/Facebook/Twitter requests, correct canonicals, image GET/HEAD, actual 1200 × 630 JPEG bytes, small-card review and phone flows with no resource or browser errors. Accepted evidence is `evidence/share-live-accepted/results.json`; the resolved core follow-up is `evidence/core-live/resolved-results.json`.

The owner subsequently enabled the separate community's public features and Google configuration. An actual existing-member acceptance run passed through the normal UI: fresh weekly attempt, keyboard aiming/held Fire, 10 earned points, natural hazard losses to zero lives, saved-result confirmation, score 10 on the unverified weekly board, and week 2026-10-12/wave 1/score 10 in member history. The update preference remained Not subscribed and no profile form was submitted. This was the owner's already-authenticated member/admin session; no game state, clock, score or live DOM was injected, and the session was not logged out. Fresh Google OAuth/onboarding and a separate non-admin identity were not tested here. Evidence and screenshots are in `evidence/member-live/ACCEPTANCE.md`.

The actual Facebook Sharing Debugger was separately refreshed for the exact Invaders URL. Its new scrape returned **HTTP 200**, the current spread/focused-fire and missile description, and the reviewed dated JPEG cover. The only reported warning was the existing missing `fb:app_id` identity property; no app identity was invented and no social post was published. The main agent completed this in its available authenticated session after the gameplay agent's separate browser lacked access. The screenshot is `evidence/facebook-live/invaders-refreshed.png` and was independently viewed. This actual platform result is distinct from simulated crawler requests and does not promise future cache or crop behavior.

Evidence is in the parent workspace's `output/agency-invaders-community-2026-10-17/`: `GAMEPLAY-VERIFICATION.md` and `evidence/{gameplay-engine,game-final,choice-boundary-final,compact-label-final,layout-source,game-live,core-live,asset-live,share-live,share-live-accepted,facebook-live,member-live,archive-final}/`.

## Historical Agency Invaders arena and bosses — 1.3.0

Final local verification on October 17, 2026, approximately 8:55 p.m. EDT. Version **1.3.0 is installed and active**, confirmed at 00:55:49 UTC on October 18 (8:55:49 p.m. EDT on October 17). The release removes the separate steering pad, enlarges the playable area, retains relative two-axis arena dragging and keyboard controls, and saves one personal best only in the current browser. It adds capped pressure after two approachable waves, weaving and armored hazards, and a signaled boss encounter every fifth wave. Launch Runner and Trivia retain their game rules and the reviewed three-game sharing cover remains relevant.

Completed source checks: source syntax/metadata, **54 Node tests** (**46 gameplay**, **three personal-best storage**, **five sharing-gate**), **19 core browser checks**, **30 upgrade checks**, **14 exact local sharing checks**, PHP lint and **122 WordPress adapter checks**. The storage tests cover a fresh read, keeping a better score, rejecting malformed/unreasonable records, and blocked storage. The companion now rejects a package missing the required score module. The sharing gate is preserved at `artifacts/share-preview-source-1.3.0/results.json`.

The final focused earned-progression/boss check passed **3/3** against the frozen renderer. Its first landscape review found the boss health bar overlapping the existing status HUD at 844 × 390; the final placement helper and regression now use the actual visible HUD reservation rectangles. Browser checks and reviewed screenshots confirmed a clear health bar at 1280, 390, 844 and 568 pixels. The final run earned the first boss defeat at 56.60 simulation seconds with 36 kills, observed its entry/windup/recovery and fired bolt, received the shield reward, and kept active player bullets bounded at 16 in that run. All final local release checks passed; the actual public scope is recorded separately below.

For repeatability, the focused harness fixes lane jitter with `Math.random = 0.5` and uses actual held Fire, keyboard aiming, direct touch gestures, cancellation and rotation. Kills, weapon upgrades, waves and the boss were earned through the unmodified simulation. Only the controller/storage boundary uses an end-of-run fixture: after earning 1,440 points, it sets the actual scene's `ended` flag without changing the score or lives. The real finish/save path shows the new personal best; a reload retains “Best on this device: 1440 points.” Restart returns to the first weapon with zero kills and score. This verifies storage behavior, not an unassisted natural game-over.

Final focused evidence is `artifacts/arena-boss-source/final/results.json`, with `invaders-boss-{1280,390,844,568}.png` and `invaders-quad-{390,844,1280}.png`. A separate overlapping direct-control follow-up passed **7/7** at `artifacts/arena-boss-source/controls/results.json`; the 390-pixel portrait canvas increased from 606 to 678 CSS pixels after removing the pad. These focused counts are reported separately from the core and upgrade suites.

After the exact tested installer was published, actual public integration passed **19/19**, and the sharing gate passed **14/14**. Facebook Sharing Debugger was refreshed for Invaders and showed its current description and the existing reviewed three-game cover. Its reported response was 206; the existing `fb:app_id` identity warning did not prevent the preview. No new Facebook app identity was supplied or invented. The focused public progression/boss run passed **3/3**, completed at 00:57:32 UTC on October 18 (8:57 p.m. EDT on October 17). It earned the boss defeat at 56.783 simulation seconds and 36 kills, with a maximum of 16 player bullets, and verified the health bar against the actual HUD at all four reviewed sizes. The phone canvas is 678 CSS pixels high, with no steering pad. The same disclosed seeded-jitter/actual-input and storage-only end-flag fixture scope applies; the earned 1,440-point best survived reload and restart reset the run. Public evidence is `artifacts/arena-boss-live-1.3.0/results.json` and the corresponding `invaders-boss-{1280,390,844,568}.png` and quad-spread captures. Installed-version evidence and publication records are kept in the parent workspace's `output/agency-invaders-arcade-2026-10-17/`.

Independent ordinary anonymous GETs (no cookies or cache-busting query) also returned the exact tested payload for all **7/7** checked files: the controller, engine, renderer, player stylesheet, score-storage module, sharing configuration, and reviewed JPEG cover. Every response returned 200 with the expected type, length, and SHA-256. The parent publication evidence is `output/agency-invaders-arcade-2026-10-17/evidence/public-payload.json`.

Mobile checks use Chromium touch/viewport emulation, not physical iOS/Android devices or Safari. No shared leaderboard, accounts, community service, score synchronization, or new game backend is implemented; the separate game-direction document is planning only.

## Historical Gamification Labs 1.2.0 — October 17, 2026

The public gallery, player context, metadata and reviewed cover use Gamification
Labs. Existing URLs remain stable. Agency Invaders now earns Twin streams after
three defeated hazards and Quad spread after seven, retaining upgrades through
damage. Hazards are larger and slower, with shorter capped waves and 1.8-second
breathers. Launch Runner and Trivia Challenge retain their game rules.

Completed local checks: source syntax/metadata, **43 Node tests** (38 gameplay
and five sharing-gate tests), **19 core browser checks**, **30 upgrade checks**,
**14 sharing checks**, PHP lint and **119 WordPress adapter checks**. The new
`npm run test:gamification` check passed **3/3**: actual firing and keyboard
aiming earned all three weapon stages on phone and desktop, the four streams
diverged, active bullets remained bounded at 12 in the observed runs, pause
froze the arena, restart reset progression, and thumb steering/rotation fit.
Its seeded lane jitter makes these runs repeatable without setting scores,
kills or weapon levels. This check is included in the validation workflow.

After explicit owner approval, the exact tested 1.2.0 installer was installed
in place and its active version confirmed. Actual public checks passed **3/3
focused progression**, **14/14 sharing**, and **19/19 unique integration**
checks. The integration result combines the full run with four narrow reruns
after correcting a test fixture's outdated accounting-demo route; no product
change was needed. Actual Facebook cards were refreshed for the gallery and
all three games with the new title and cover. Coverage uses Chromium emulation,
not physical iOS/Android devices or Safari. Local and live evidence, exact ZIP
hashes, the approval history and recovery are in the parent workspace's
`output/gamification-labs-2026-10-17/` publication record.

The lab contains Agency Invaders, Launch Runner, and Trivia Challenge. All game logic and scores stay in the browser. The games have no application backend or paid runtime dependencies.

## Repeatable checks

Use Node.js 22 or later:

```sh
npm ci
npm run check
npm test
npx playwright install chromium
npm run test:browser
npm run test:controls
npm run test:upgrade
npm run test:gamification
npm run build
npm run test:share
npm run test:community
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

The current 51 gameplay rules tests cover:

- Keyboard and touch sources held at the same time, individual release, repeated keydown, and clearing held controls.
- Agency Invaders two-axis movement, simultaneous directions, relative drag and thumb-stick input with per-axis keyboard priority, portrait thumb clearance and proportional travel time, delayed-frame caps, firing and collisions at the moved ship position, six named hazards, life loss, shield protection, wave transitions, combo scoring, game over, and clean restart state.
- Earned single/twin/quad progression, upgrade persistence after damage, symmetric spread and swept collisions, bounded firing/pruning, larger threat bounds, and gentler capped pacing.
- Later-wave capped pressure, weaving and armored health, earned boss entry, telegraphed fixed-aim shots, swept projectile collisions, shield absorption, boss rewards/breathers, and safe resize/restart state.
- Untimed spread/focused choice with background-input isolation, focused beam damage/cadence, finite paired missiles and supply/reset bounds, locked fan/stagger boss patterns, and seeded 120 Hz challenge timing, fixed course and result contract.
- Launch Runner two-jump limit and landing reset, safe obstacle clearance, collision, energy pickups and boost protection, distance scoring, game over, and clean restart state. Portrait collision and collection areas match the enlarged artwork; camera framing preserves the full astronaut without changing jump physics.
- Resize preserves arcade progress and relative positions; Runner retains its physical jump height and velocity.
- Every trivia question, correct and incorrect scoring, invalid answer indices, perfect and zero scores, and three distinct replay rounds containing 15 questions.

Three separate personal-best storage tests cover persistence through a fresh read, retaining a better score, rejecting malformed records, and denied storage. Five sharing-gate tests cover the required source/build metadata and actual declared cover. These make 59 Node tests in total.

The browser suite covers:

- All four routes at desktop 1280 × 900, mobile portrait 390 × 844, 360 × 800, 320 × 740, and mobile landscape 844 × 390.
- Horizontal overflow, game route availability, start, pause, resume, restart, and frozen canvas while paused.
- Repeated restart without accumulating animation loops, keyboard movement and release, automatic pause on window blur, and native Space activation on session buttons.
- Fixed challenge course, exactly one timed result, a fresh replay-ticket request and an explicit return to responsive free play. Separate community-client fixtures cover optional network failure without blocking the phone game.
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

The lab collects no lead information. Navigating away resets a run. The 1.3.0 release retains only an Invaders personal best in local browser storage, without synchronization or a score service. External project links open the HTSG contact page in another tab.

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

Actual Facebook Sharing Debugger checks were then completed on the public gallery and all three game links. Fresh scrapes showed the new JPEG, route-appropriate titles/descriptions/canonicals and the complete wide montage. An older cached Invaders result initially inferred an image; “Scrape Again” replaced that result with the explicit new image metadata. The final refreshed results had no missing-image warning. A residual `fb:app_id` identity warning did not prevent the image preview; no verified Facebook app ID was available, so no identity was invented. No social post was published. These actual platform checks are distinct from the automated user-agent simulations and do not promise how every future platform cache or crop will behave.

Evidence is separated from prior releases:

- `artifacts/share-preview-source/before-audit.json`: original raw metadata/crawler/image audit.
- `artifacts/share-preview-source/adapter-results-1.1.2.json`: local 14-scenario adapter result; `static-host/results.json` records the static mode.
- `artifacts/share-preview-live/full-results-1.1.2.json`: public 14-scenario result, response hashes and declared scope.
- `artifacts/share-preview-live/gameplay-identity.json`: unchanged published gameplay files and visible HTML bodies.
- `artifacts/share-preview-live/card-preview-320.png` and `card-preview-390.png`: small-card layout simulations using the real served image/metadata.
- `artifacts/share-preview-live/facebook-{gallery,invaders,runner,trivia}-preview.png`: actual refreshed Facebook debugger screenshots.

No unresolved sharing or gameplay-smoke failure remains. Physical phones and Safari remain outside the browser-emulation scope. Re-run the sharing gate after changing the cover, metadata configuration, build rewriting or adapter response handling; a valid share image is a release requirement rather than a manual afterthought.

## Gamification Labs and weapon progression — 1.2.0 candidate

The focused browser check passed 3/3 on 17 October 2026 with Chrome 155.0.8059.84. It runs real game inputs with deterministic lane jitter and keyboard aiming; it never sets score, kills, lives, weapon level, enemies or timers. The initial harness incorrectly assumed fixed random input centered every spawn; cyclic lanes required keyboard aiming instead. That harness assumption was corrected without changing the product.

At 390 × 844, the run earned Twin streams after three kills at 5.18 seconds and Quad spread after seven kills at 12.19 seconds. A 1.82-second wave breather separated the waves. The observed active projectile list peaked at 12. The desktop 1280 × 900 run independently earned all three weapon stages. Actual twin volleys have separate straight streams; quad volleys have four diverging trajectories. Paused canvas pixels remain identical, and restart restores the first weapon with zero kills and score.

The upgraded phone run also accepted real two-axis thumb-pad input and retained its weapon through rotation to 844 × 390. The complete arena, controls and weapon HUD fit together without horizontal overflow; the phone HUD ended at CSS pixel 339 within the 390-pixel screen. Phone and desktop quad-spread images were visually reviewed, including the larger hazards and upgrade feedback. There were no focused browser exceptions or unresolved application failures.

Evidence is in `artifacts/gamification-qa/results.json`, `invaders-quad-390.png`, `invaders-quad-844.png` and `invaders-quad-1280.png`. The three focused scenarios overlap the main task's existing required suites and are not added to their counts. Run this specific check with `node tests/gamification-qa.mjs`; it accepts `--url` and `--output` for a separately authorized public follow-up. It is a focused manual gate rather than a claim of automated coverage across other projects. All mobile results remain Chromium emulation; physical devices and Safari were not tested.

Visible-name expectations in the sharing, navigation and public-integration tests now use Gamification Labs, while the stable `/demos/interactive-lab/` routes remain unchanged. The sharing-image fixture uses the reviewed dated cover `lab-share-20261017.jpg`. Existing historical publication records and evidence remain separate.
