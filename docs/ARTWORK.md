# Gamification Labs environment artwork

World artwork uses the **OpenAI built-in image_gen tool**. Release 1.5.3 adds an original orbital agency office on October 18, 2026. The initial three environments were generated separately on October 16; one targeted edit removed a signature-like artifact from the initial Trivia result. No external reference photograph, stock asset or third-party character was supplied for these worlds. Gameplay characters and controls are drawn separately.

The environments share a cinematic 3D science-fiction treatment: deep navy and charcoal, silver structure, warm orange practical lighting, atmospheric depth and quiet gameplay areas. The orbital office is an opaque square WebP; Runner and Trivia retain their 16:9 images. Preserve native proportions when cropping, and keep gameplay objects and controls separate.

## Selected files

| Scene | Runtime file | Pixels | Bytes | Composition |
| --- | --- | --- | --- | --- |
| Agency Invaders — 1.5.3 | `public/assets/invaders-orbital-agency-20261018.webp` | 1254 × 1254 | 255,116 | Glass office station with visible desks and a paper-ring planet above a dark open flight lane. |
| Launch Runner | `public/assets/runner-world.webp` | 1536 × 864 | 379,038 | Launch complex and city recede through orange dusk; quiet launch deck in the lower third. |
| Trivia Challenge | `public/assets/trivia-world.webp` | 1536 × 864 | 327,786 | Orbital observatory and planet framed by peripheral architecture, with a quiet central deck. |

The new office PNG original is preserved at native **1254 × 1254** dimensions in `artwork/originals/invaders-orbital-agency-20261018.png`. The three initial 1672 × 941 PNG originals are also retained there, including the preceding Invaders environment. Originals remain outside the public runtime build. The three selected current worlds total **961,940 bytes**; the retained legacy `invaders-world.webp` is 367,044 additional bytes and remains available for earlier links/rollback.

`artwork/provenance.json` records the current worlds, retained `asset_history` and derived sharing inputs/outputs. `artwork/prompts.json` holds the initial exact prompts and Trivia cleanup prompt. The new office uses dedicated exact-source records: `artwork/orbital-agency-20261018-prompt.txt` and `artwork/orbital-agency-20261018-provenance.json`.

## Orbital agency office — 1.5.3

The built-in image_gen tool produced the selected square master as `exec-9e1b3c0e-e7fb-4df8-a10d-6e59b76f69ff.png`. Its exact saved prompt requests an original orbital creative agency: glass desks/conference space, a planet ring made of papers/folders, a distant coffee-mug satellite and a quiet dark flight lane. Although the prompt requested 2048 square, the actual selected tool output is **1254 × 1254**; that actual size is preserved. The PNG is **2,148,137 bytes**, SHA-256 `87952d218f31a518b8c3ce50c4788e141eb90201a43614876310ce956e4fe356`.

Bundled Pillow performed **native-size RGB WebP encoding only**, quality **92**, method **6**. There was no resizing, retouching or compositing. The runtime file is **255,116 bytes**, SHA-256 `e1be5e1488845daa3d11fe50bf52c5e4691b476a2f582b02d46bfc10c43447bf`. The selected runtime was decoded and inspected; portrait/landscape, HUD contrast, unavailable-bitmap fallback and gallery/sharing crop checks passed with publisher review. This adds no paid or runtime dependency.

## Initial environment optimization and review

The initial three selected originals were copied into this project from the built-in tool's generated-image folder, leaving those generated outputs in place. Bundled Pillow was used only for deterministic resizing, WebP encoding, and review previews; it was not used to synthesize or retouch the artwork. Encoding uses WebP quality 95 and method 6. A centered fit makes the slight native aspect-ratio difference conform to 1536 × 864 without a visible geometric change.

The optimized outputs were decoded and visually inspected together at landscape size and as centered 9:16 crops. The planet/horizon, launch skyline, and observatory view remain readable in the phone crops. The lower play regions stay relatively quiet. Bright accents may still need an in-app scrim for white HUD or quiz text, which should be judged with the actual game controls and moving objects.

The landscape/portrait review sheet is saved locally at `artifacts/artwork-review/worlds-landscape-and-portrait.png`. It is QA evidence and is excluded from deployment. No additional sprites were generated for this set.

## Derived sharing card

`public/assets/lab-share.svg` is an editable, self-contained 1200 × 630 composition using the approved HTSG wordmark, three cinematic worlds, the actual Halo character, a spacecraft derived from the game renderer, and a quiz symbol. It carries the Gamification Labs title and all three game names. Its image inputs are embedded, so the SVG has no external file dependency. This replaces the preceding block-art sharing illustration and gives each game a recognizable subject in previews.

The 1.5.3 primary cover for the game gallery and all three games is `public/assets/lab-share-20261018.jpg`: **1200 × 630**, **image/jpeg**, **134,985 bytes**, SHA-256 `904c1104f95ae28cec2939b0c8e9a4ee09b51866005a4efda42fb3f3c945c88f`. Its Invaders panel embeds the new orbital office while retaining all three subjects, actual Halo and game names. `lab-share.svg` is the editable source; `lab-share.png` is the matching 527,223-byte compatibility raster. The October 16 and 17 dated JPEGs remain unchanged for existing links and rollback; the October 17 cover was 128,579 bytes and introduced the Gamification Labs title. The new versioned JPEG avoids changing pixels at the preceding primary URL. The publisher reviewed the new cover at desktop/phone sizes; automated local and actual public sharing checks passed 14/14, including image decoding and compact views. Prior cover review evidence remains at `artifacts/branding-20261017/sharing-cover-mobile.png`. Run `npm run artwork:share` with the free Playwright development dependency and Chromium installed to regenerate them from the current local assets. This code-native layout uses no further image generation. `scripts/generate-share-card.mjs` also updates the derivative's input and output hashes in `artwork/provenance.json`. The old `scripts/share-image.mjs` delegates to this same generator rather than producing a divergent block-art cover. See [SHARING.md](SHARING.md) for the mandatory metadata/image checks and publication procedure.

## Asset contract

Use the selected versioned/stable runtime paths above, load the appropriate image for the chosen game, preserve its aspect ratio, and provide a dark color fallback while it loads. Keep preceding world assets available when they are still referenced by published artwork or rollback. Images are decorative; game instructions and state must remain readable as ordinary interface content. The background must not replace gameplay objects or communicate a collision boundary by itself.

The current static build already permits `.webp` and automatically hashes new public assets into the build manifest. The WordPress adapter already serves `image/webp` and manifest-listed JavaScript modules. Originals and provenance belong in the source package; only optimized runtime images belong in the standalone deployment and WordPress site directory. No paid or additional runtime dependency is required.

## Actual Halo character frames

The focused 1.1.1 update replaces the procedural Runner astronaut with the existing approved Halo chatbot character: glossy black helmet, orange H suit and cape, and white gloves and boots. The source is the HTSG Halo Assistant `return-wave-release-1.2.1` artwork already maintained in the parent workspace. No new character image was generated or painted.

`public/assets/halo-runner-atlas.webp` contains 14 articulated poses extracted from entrance frames 0–26 at two-frame intervals. The 1024 × 1024 static atlas uses isolated 256 × 256 tiles, with the helmet and boots aligned consistently and the cape preserved. It is 232,394 bytes. `public/assets/halo-runner-idle.png` is the approved 288 × 396 still (102,185 bytes), used only if the atlas cannot load. The renderer mirrors the character to face approaching obstacles; his cape remains decorative outside the unchanged collision body.

Pose selection follows simulation elapsed time, jump ascent/descent, and the brief landing effect. The grounded cycle changes actual limb and cape frames; it is not an idle still with a bob animation. Pausing freezes the selected pose exactly. Reduced-motion mode uses a fixed actual pose. Portrait artwork is 35% larger than the initial Halo integration, anchored at the boots; landscape sizing and physics are unchanged. The camera follows the current image's alpha bounds and tilt to keep the head visible during high jumps.

Selected source files are preserved as `artwork/originals/halo-entrance-source.webp` and `artwork/originals/halo-idle-source.png`. `artwork/halo-runner-provenance.json` records their hashes, exact source-frame indices, atlas alignment, per-frame bounds, and runtime hashes. The deterministic Pillow extraction recipe is `artwork/prepare-halo-atlas.py`; it is development tooling and is excluded from the public build. Existing entrance/wave source sequences were inspected before choosing these poses.
