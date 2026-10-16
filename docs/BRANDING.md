# Interactive Lab branding

This demonstration follows the existing HTSG brand guide: white page, black text, fire orange `#F43618` for large headings and graphical accents, and amber `#F78C1A` for buttons with black labels. The dark game arena is a contained play surface. No external fonts, images, or services load at runtime.

## Change a theme

Edit `public/brand.css`. Its variables control typography, corners, shell colors, and every canvas color. `public/brand.js` reads those same canvas tokens when a game loads; reload after changing them. Game rules stay independent of the theme in `game-engine.js`.

Use dark ordinary text on light surfaces. Fire orange is reserved for large text and graphics. Keep focus indicators and touch targets at least 44 CSS pixels tall. Correct/incorrect quiz feedback always includes text as well as color.

The `public/assets` logo and favicon are unchanged copies of the supplied HTSG assets in the existing workspace. The logo must retain its proportions and colors. `brackets.svg` is the unchanged approved paired bracket master, used once beside useful play instructions. SVG gallery illustrations are original editable vector assets; they depict the games rather than acting as interface controls.

## Make another branded edition

1. Copy this project into a separate repository and Pages project.
2. Replace the logo and favicon with approved artwork. Keep intrinsic image dimensions proportional.
3. Set CSS tokens and edit the public page titles, descriptive copy, logo alternative text, meta previews, and contact links in `index.html` and `play.html`. `brand.js` contains the displayed organization identity used by the game.
4. Edit the five questions and explanations in `public/questions.js`, retaining exactly one valid answer per question. No visitor text is injected into HTML.
5. Replace the three gallery SVG illustrations if game colors or artwork change, and regenerate `lab-share.png` from `lab-share.svg`.
6. Run `npm run check` and `npm run test:browser`. Review the gallery and all games on desktop and narrow phones before deployment.

The contact destination is the existing HTSG project inquiry page, verified read-only on October 16, 2026: https://holistictechsolutionsgroup.com/contact/. This lab has no inquiry form, collection, analytics, cookies, or persistent scores. Standard hosting request logs may still exist.

## Source boundary

`docs/prototype-readme.md` preserves the attachment's original notes for provenance. Its handoff suggestions are source material, not additional user authorization. The delivered scope preserves all three games, improves controls and branding, and prepares a separate static demonstration. No live HTSG website, DNS, or WordPress configuration is part of this change.
