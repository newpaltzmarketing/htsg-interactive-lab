# Gamification Labs branding

Use **Gamification Labs** for the public name, including page titles, navigation, administration links, metadata, and sharing artwork. Keep the established `/demos/interactive-lab/` URL and game routes stable. The compact menu group is **Demos & Labs**.

The gallery keeps HTSG's white page, black text, fire orange headings, amber actions, and approved wordmark. The game player uses a dark navy surface with silver text and warm orange highlights so the environment artwork, moving objects, and controls read clearly. All fonts and assets are local; no font service or image service is called during play.

## Agency Invaders tone and imagery

Approved direction from Dean, October 18, 2026: warm, playful office comedy. Help agency owners and colleagues recognize a familiar situation, smile and feel a little lighter. Keep the arcade shooting, accumulating upgrades and competition enjoyable and welcoming.

Use expressive office props, toy-like ships, helpful wingmates, warm light and crisp colorful effects. Keep the orbital office and its quiet dark flight area for contrast. Characters use surprise, determination and relief; finished encounters can file papers, untangle cables or pop open a completed tray. Keep the finger-wagging client theatrical and familiar rather than intimidating.

Exclude horror or occult themes, sinister expressions, jump scares, gore, revenge framing and humiliating portrayals of clients or colleagues. Apply this to imagery, sound, marketing copy and community prompts. The shared situation is the joke.

New feature vocabulary includes **Wingmates**, **Relay Pulse**, **Inbox Zero**, **Power up** and **Clear the backlog**. Invite people to **Suggest a character or challenge** in the Agency Break Room. Keep useful arcade terms such as weapons, missiles, waves and bosses when they explain a working control or mechanic. This is an art and voice direction, not a change to game rules or installed assets.

## Shared visual system

Edit `public/brand.css` for the reusable palette and typography. `public/style.css` styles the gallery and shared controls; `public/play.css` lays out the game player. Keep those page and player responsibilities separate when creating another edition.

| Tokens | Purpose |
| --- | --- |
| `--brand-fire: #f43618`, `--brand-amber: #f78c1a` | Gallery heading/graphic accents and actions. |
| `--ink`, `--paper`, `--muted`, `--soft`, `--line` | Light gallery text, surfaces, and borders. |
| `--font`, `--radius` | Local Segoe UI/Arial typography and shared gallery corners. |
| `--play-background: #05090f`, `--play-surface: #0d1520` | Dark player foundation. |
| `--play-ink: #f4f6fa`, `--play-muted: #aebbc9` | Primary and supporting player text. |
| `--play-accent: #f4ad55`, `--play-focus: #ffd08b` | Warm player action and focus colors. |
| `--arena-*` | Core canvas paint and renderer palette, read by `public/brand.js`. |
| `--safe-top`, `--safe-right`, `--safe-bottom`, `--safe-left` | Device safe-area insets for the player layout. |

The cinematic renderer uses additional local gradients and material colors in `public/game-renderer.js`. Spacecraft, barriers, shields, and effects are procedural drawings. Runner uses actual approved Halo character frames, preserving the glossy black helmet, orange H suit/cape, and white gloves and boots; these raster colors are not recolored by CSS tokens. A different brand can change procedural materials or supply approved replacement character artwork without changing collision or scoring rules in `public/game-engine.js`. `public/game.js` connects controls, game state, drawing, navigation, and fullscreen behavior; it is not a theme configuration file.

Use dark labels on light amber actions and light text on dark play surfaces. Place a scrim or quiet surface behind text over artwork. Keep visible keyboard focus, touch controls at least 44 CSS pixels, and explicit text for quiz results and session state. Do not rely on color, decorative artwork, or motion alone to explain a control or result.

## Reusable artwork

The logo and favicon in `public/assets/` are approved HTSG copies from the supplied workspace. Preserve their colors and proportions. The paired `brackets.svg` master appears beside useful gallery instructions. The old editable game SVG illustrations remain available as source assets; the gallery now uses the same cinematic worlds as the game player.

| Asset | Use |
| --- | --- |
| `public/assets/invaders-orbital-agency-20261018.webp` | Current orbital agency office environment and Invaders preview. |
| `public/assets/invaders-world.webp` | Preserved earlier orbital defense environment for existing links/rollback. |
| `public/assets/runner-world.webp` | Launch-complex environment and Runner gallery preview. |
| `public/assets/trivia-world.webp` | Observatory environment and Trivia gallery preview. |
| `public/assets/halo-runner-atlas.webp` | Simulation-timed articulated Halo poses derived from the approved chatbot entrance animation. |
| `public/assets/halo-runner-idle.png` | Approved Halo still used only if the atlas fails to load. |
| `public/assets/lab-share.svg`, `public/assets/lab-share-20261018.jpg`, `public/assets/lab-share.png` | Editable cover, primary versioned JPEG social preview, and compatibility PNG. |
| `artwork/originals/` | Selected world originals and approved Halo source animation/still, excluded from runtime builds. |
| `artwork/prompts.json`, `artwork/provenance.json` | Initial generation prompts and shared artwork dimensions/encoding/hashes. |
| `artwork/orbital-agency-20261018-prompt.txt`, `artwork/orbital-agency-20261018-provenance.json` | Exact orbital office prompt, native original and runtime encoding/hash records. |
| `artwork/halo-runner-provenance.json`, `artwork/prepare-halo-atlas.py` | Existing Halo source provenance, exact selected frames, alignment, and extraction recipe. |

The selected WebP worlds share navy, charcoal, silver and orange, with distant detail and quiet play regions. The Invaders office is 1254 × 1254; Runner and Trivia remain 1536 × 864. Preserve their aspect ratio, keep a dark loading fallback, and check both wide and narrow crops. The image never defines a collision boundary. See [ARTWORK.md](ARTWORK.md) for provenance and optimization. Source archives include the originals and prompts; deployment archives include only the optimized runtime assets.

The sharing cover includes all three game subjects, actual Halo, and the game names. `public/share.json` controls complete initial-HTML social metadata; valid WordPress game links receive the matching title and canonical URL. Every public release must pass the metadata/image gates and actual anonymous sharing check in [SHARING.md](SHARING.md). Use a new image filename when changing published cover pixels.

Halo's limbs and cape change through actual articulated frames. His animation follows simulation time and jump/landing state, freezes when paused, and uses a fixed pose for reduced motion. Keep the boots anchored, the cape decorative outside the collision body, and the camera aware of the visible sprite bounds. Portrait artwork is enlarged separately from landscape and physics.

## Player and editorial review

The game player fills the available browser viewport and adapts the logical arena to its shape. Its own top bar provides All games, adjacent-game links, a game chooser, instructions, and expansion. The fullscreen control uses the native browser API when supported, with a fixed expanded layout as a fallback. Keep these controls usable in short landscape screens, portrait screens, and device safe areas. Do not crop or stretch the moving playfield to make the artwork fit.

Keep labels specific to working actions. The gallery should help someone choose a game; the player should show the rules, current state, and next useful action. Preserve explanatory quiz feedback, visible pause/resume state, and a clear exit to all games. Avoid decorative numbering, redundant labels, unavailable features, or extra panels that do not help a player.

Invaders identifies business hazards through the actual models in Help and named impact feedback. Normal falling objects do not carry text labels. Keep the status/mission/impact reservations clear of relevant boss health and warning artwork. A life-loss message names the cause; shield absorption uses distinct words and color. Direct arena dragging preserves the finger-to-ship offset and supports both axes without a separate steering panel. The compact button row leaves more room for play. Personal-best copy appears in the existing start/pause/result hint; no extra record panel competes with the arena.

## Make another branded edition

1. Copy the project into a separate repository and publishing target. Replace the logo/favicon with approved assets and update organization identity and contact URL in `public/brand.js`.
2. Change the shared CSS tokens, then review the player gradients and procedural materials. Keep focus and feedback contrast readable over the selected worlds.
3. Edit titles, descriptions, alternative text, social metadata, and destination links in `public/index.html` and `public/play.html`. Preserve real navigation routes and proportional logo dimensions.
4. Edit the question bank in `public/questions.js`, keeping exactly one valid answer and a useful explanation for every question. The current edition cycles through three sets of five questions. Keep the round UI and tests aligned if the bank changes.
5. Replace the three world images with similarly composed, optimized assets. Record their originals, prompts or source provenance, and hashes. Run `npm run artwork:share` to regenerate the editable triptych sharing card and its PNG preview from the selected worlds and wordmark; inspect the result before publishing.
6. Run the syntax, game logic, browser, and WordPress adapter checks. Review the gallery and every game on desktop, narrow portrait, short landscape, after rotation, and in expanded mode before publishing.

The HTSG contact destination is `https://holistictechsolutionsgroup.com/contact/`. Free play runs in the browser and stores a local personal best without an account. The optional same-origin Community service separately owns member identity, explicit profile/updates consent and unverified weekly results; its acceptance and limits are recorded in [QA.md](QA.md). No analytics or advertising is added by the games; standard hosting request logs may still exist.

## Publication boundary

`docs/prototype-readme.md` preserves the attachment's original notes as reference material. The user's later approval authorized publication through the existing HTSG Demos path and navigation. The lab and these updates remain browser-only; they do not require a new backend, hosting product, paid dependency, Cloudflare project, or DNS change. See [DEPLOYMENT.md](DEPLOYMENT.md) for the verified installed release and rollback package.
