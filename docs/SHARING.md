# Social and featured previews

Sharing is a release check for the gallery, its `index.html` alias, all three `play.html?game=...` links, and the standalone `crossword.html` page. The image, title, description, and canonical URL must be present in the first HTML response, without JavaScript or a signed-in session. The [Open Graph protocol](https://ogp.me/) defines the core title, type, image, and canonical URL properties and the image's structured properties.

## Source of truth

`public/share.json` defines the site identity, canonical paths, gallery/player/game copy, and the shared cover. The current 1.7.0 primary image is `assets/lab-share-20261022.jpg`: a real **1200 × 630 JPEG**, **133395 bytes**, SHA-256 `0ee2ffe6873546ccf4a86c7009ecc155875d57d473475a0d57f8fd0314bee662`. It shows Agency Invaders, Halo in Launch Runner, Trivia Challenge and the original illustrated Crossword Break grid. The editable source and raster derivative are versioned alongside the retained October 18 artwork. `scripts/generate-crossword-art.mjs` records the source assets and hashes in `artwork/provenance.json`; `npm run artwork:share` uses that current generator. The crossword desk art is a representative illustration, rather than a screenshot or solved puzzle. Use a new image filename when replacing published sharing artwork so a previous image URL does not keep referring to different pixels.

All three HTML entry points contain a complete metadata block in source. It includes the document title/description, canonical link, Open Graph title/description/type/site/URL, image URL/type/dimensions/alternative text, Twitter large-image title/description/image/alternative text, and an `image_src` fallback link. All social URLs are absolute HTTPS URLs.

The standalone crossword has its own initial-HTML title, description and canonical on both WordPress and static hosts. The WordPress companion chooses game-specific copy and canonical URLs for `invaders`, `runner`, and `trivia` before sending the page. It reads only the packaged configuration; request text is never reflected. The first exact `game` query key follows the browser's selection behavior. Missing, invalid, and array-only values use the complete all-game player fallback. Gallery aliases and tracking parameters canonicalize to the directory URL. Rendered HTML receives its own byte length and ETag per game.

Plain static hosts cannot specialize a shared HTML file by query string. They receive the complete all-game cover and player metadata fallback. A build-time `SITE_URL` rewrites all canonical and social image URLs together for an alternate HTTPS host. Without it, metadata uses the configured primary HTSG address; the static ZIP's other assets remain relative.

## Required checks

After editing `share.json`, regenerate the initial HTML with `npm run metadata:sync`. After changing cover artwork, run `npm run artwork:share`, choose a new published image filename when needed, update the config, and sync the metadata. `scripts/share-image.mjs` is a compatibility entry point for that same artwork generator; it cannot regenerate the obsolete block-art card.

```sh
npm run metadata:sync
npm run check
npm test
npm run build
npm run test:share
```

The syntax/source check and every static build validate required metadata and the actual cover's local existence, PNG/JPEG signature, dimensions, MIME/extension agreement, alternative text, and this project's 1 MB image budget. Negative tests cover missing/duplicate/relative fields, unsafe configuration, truncated images, and MIME mismatches. WordPress activation also verifies the complete metadata, game configuration, manifest integrity, and actual image dimensions/type. The isolated adapter tests cover query selection, escaping, fallback behavior, and per-game response hashes/lengths.

`npm run test:share` runs the exact PHP adapter in an isolated local fixture by default. It checks raw anonymous/crawler HTML, GET/HEAD behavior, complete fields, actual image decoding, and preview layouts. It accepts `--url` for the approved public Lab URL after installation. Its visual card simulations are review aids, not evidence that an external social platform has refreshed its cache. See [QA.md](QA.md) for actual results and command options.

The validation workflow runs this sharing suite on every push and pull request before uploading release artifacts. A failing gate prevents successful validation. Source pushes still do not publish WordPress or change DNS.

## Public release check

After the reviewed installer is published and the site cache is purged, repeat the sharing suite against the actual public URL. Confirm the image and all six page variants work without authentication, compare anonymous and crawler responses, and inspect decoded image/card captures at phone sizes. Where access is available, re-scrape the gallery and four games with the intended platform's debugging tool and inspect its actual preview. Record the result separately from local simulations; a platform cache can outlast a website deployment.

The parent HTSG workspace's `SOCIAL_SHARING_STANDARD.md` extends this release practice to future HTSG work. The code gates here enforce it within this Lab repository; they do not claim automatic enforcement across unrelated sites.

## October 22 crossword release

The publisher confirmed game 1.7.0, purged SiteGround cache, and passed 15/15 actual public sharing cases. The crossword and gallery were fetched/refreshed in Facebook Sharing Debugger, which showed HTTP 206, the correct canonicals/copy and the complete October 22 four-game cover. The existing fb:app_id warning is nonblocking. Screenshots and public response evidence are in the parent `output/crossword-break-2026-10-22/evidence/` folder. Other platform previews were simulated by the anonymous/no-JavaScript/crawler gate, not posted to social networks.
