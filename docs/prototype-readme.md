# HTSG Interactive Lab, zero-cost prototype

Three playable mobile-friendly HTML/CSS/JS demos, no build process, backend, or external dependencies.

## Run locally

From this folder: `python3 -m http.server 8080` then open `http://localhost:8080`.

## Publish

Upload this folder as a static site to Cloudflare Pages, or copy its files to an existing HTTPS host. Link from the HTSG website to the published gallery, or embed individual `play.html?game=...` pages in responsive iframes. Confirm the actual HTSG site/domain before integration. No live deployment or changes to HTSG have been made.

## Codex handoff

1. Initialize Git repository, preserve the working no-dependency demo.
2. Test on iOS Safari, Android Chrome, desktop Chrome and keyboard.
3. Fix gameplay bugs, add pause/resume on page visibility change, accessibility, responsive UI, audio toggle.
4. Refactor into reusable configurable themes, assets and question banks, ideally Phaser + TypeScript only if it improves maintainability.
5. Add an HTSG-branded sales CTA using verified contact information. No placeholder email or invented business details.
6. Add privacy-conscious analytics only with appropriate disclosures/consent; avoid collecting player PII in prototype.
7. Set up CI smoke tests and deploy a preview before requesting production approval.

## Notes

Current artwork is CSS/canvas shapes, not licensed third-party images. Games are prototypes, not fully QA-tested production software. Avoid promises of $0 at scale if hosting usage grows.
