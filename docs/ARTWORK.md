# Interactive Lab environment artwork

Created October 16, 2026 with the **OpenAI built-in image_gen tool**, using three separate original-generation calls. No external reference photograph, stock asset, logo, or third-party character was supplied. One targeted image_gen edit removed a small signature-like artifact from the initial Trivia result. The selected final images contain no text, logos, interface, foreground game characters, or visible watermark.

The environments share a cinematic 3D science-fiction treatment: deep navy and charcoal, silver structure, warm orange practical lighting, atmospheric depth, and quiet areas for gameplay. The runtime files are opaque 16:9 WebP images. Gameplay, spacecraft, runners, obstacles, and quiz controls remain separate from these backgrounds.

## Selected files

| Scene | Runtime file | Pixels | Bytes | Composition |
| --- | --- | --- | --- | --- |
| Agency Invaders | `public/assets/invaders-world.webp` | 1536 × 864 | 367,044 | Gas giant and orbital station across the upper third; dark open central/lower field. |
| Launch Runner | `public/assets/runner-world.webp` | 1536 × 864 | 379,038 | Launch complex and city recede through orange dusk; quiet launch deck in the lower third. |
| Trivia Challenge | `public/assets/trivia-world.webp` | 1536 × 864 | 327,786 | Orbital observatory and planet framed by peripheral architecture, with a quiet central deck. |

All three selected PNG originals are preserved at their native **1672 × 941** dimensions in `artwork/originals/`. These originals are source material and should stay outside the public runtime build. Runtime files total **1,073,868 bytes** before transfer compression or browser caching.

`artwork/provenance.json` records each selected original and runtime file, byte size, dimensions, SHA-256 hash, generation filename, and encoding settings. `artwork/prompts.json` contains the exact prompt for each generation and the targeted Trivia cleanup prompt.

## Optimization and review

The selected originals were copied into this project from the built-in tool's generated-image folder, leaving those generated outputs in place. Bundled Pillow was used only for deterministic resizing, WebP encoding, and review previews; it was not used to synthesize or retouch the artwork. Encoding uses WebP quality 95 and method 6. A centered fit makes the slight native aspect-ratio difference conform to 1536 × 864 without a visible geometric change.

The optimized outputs were decoded and visually inspected together at landscape size and as centered 9:16 crops. The planet/horizon, launch skyline, and observatory view remain readable in the phone crops. The lower play regions stay relatively quiet. Bright accents may still need an in-app scrim for white HUD or quiz text, which should be judged with the actual game controls and moving objects.

The landscape/portrait review sheet is saved locally at `artifacts/artwork-review/worlds-landscape-and-portrait.png`. It is QA evidence and is excluded from deployment. No additional sprites were generated for this set.

## Derived sharing card

`public/assets/lab-share.svg` is an editable, self-contained 1200 × 630 composition using the approved HTSG wordmark and a cinematic triptych of the selected world images. It retains the Interactive Lab title and all three game names. The logo and world images are embedded, so the SVG has no external file dependency. This replaces the preceding block-art sharing illustration and keeps previews consistent with the upgraded games.

`public/assets/lab-share.png` is the matching 1200 × 630 raster preview used by the gallery's social metadata. Both assets were visually reviewed after rendering. Run `npm run artwork:share` with the free Playwright development dependency and Chromium installed to regenerate them from the current local assets. This code-native layout uses no further image generation. `scripts/generate-share-card.mjs` also updates the derivative's input and output hashes in `artwork/provenance.json`.

## Asset contract

Use the three stable runtime paths above, load the appropriate image for the chosen game, preserve its aspect ratio, and provide a dark color fallback while it loads. Images are decorative; game instructions and state must remain readable as ordinary interface content. The background must not replace gameplay objects or communicate a collision boundary by itself.

The current static build already permits `.webp` and automatically hashes new public assets into the build manifest. The WordPress adapter already serves `image/webp` and manifest-listed JavaScript modules. Originals and provenance belong in the source package; only optimized runtime images belong in the standalone deployment and WordPress site directory. No paid or additional runtime dependency is required.
