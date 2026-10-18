# Agency Invaders expansion plan

October 18, 2026. Research and proposed design for Dean Lambros. Baseline: live game 1.5.3, combat rules 1.5.0 and Community 1.0.5. Implementation note: the first gameplay slice is now installed as game 1.6.1 (rules 1.6.0) with Community 1.0.6 compatibility. It delivers ship/paint choices, layered support, Inbox Zero and two warned office attacks. Server-saved appearance, moderated contributions and company competition remain later proposals. See GAME-DIRECTION.md and QA.md for the exact current boundary.

Agency Invaders should become a short, satisfying break for people who run and work in agencies: build an increasingly spectacular ship, recognize the problems flying toward you, laugh at a familiar situation, and compare a run with colleagues. The community should help invent those situations. That shared authorship gives HTSG a reason to be remembered beyond the score.

The best next investment is **power-ups that keep combining, office characters whose behavior tells the joke, and a personal ship**. Follow that with a small moderated discussion area and an agency leaderboard pilot. Keep the current immediate free play and optional sign-in.

## Creative direction

Dean's October 18 direction is upbeat office comedy: make everyday situations feel lighter, with warmth, teamwork and a satisfying sense of making progress. Keep the layered upgrades, replay structure, ship customization and community architecture.

Use bright toy-like spacecraft, expressive office props, helpful wingmates, warm windows and tidy bursts of paper, stars or small checkmarks. The orbital office remains a welcoming place. Navy can provide gameplay contrast while warm light and character expressions set the mood. Horror, occult motifs, jump scares, sinister faces and revenge framing are excluded from artwork, sound and copy.

The player clears a comically overgrown backlog. A clock relaxes, a printer finishes its stack, and a document tray pops open to reveal neatly filed pages. Characters react with surprise or relief. Keep the finger-wagging client theatrical and familiar, with an earnest “one more tiny thing” personality. The joke is the situation everyone recognizes.

Use **Wingmates**, **Relay Pulse**, **Inbox Zero**, **Power up**, **Clear the backlog** and **Nice work — next wave** as the vocabulary for new features. The underlying shooting, chaining, upgrades and boss patterns remain intact. Celebrate teamwork and progress in the Break Room; invite funny situations and constructive ideas rather than personal complaints.

## What the research supports

The specific features, timings and release order below are recommendations to test with HTSG players. The design principles are layered upgrades, varied combinations, readable characters and a useful community feedback loop. Research informs those mechanics; the creative direction above governs the game's identity.

| Evidence | Application to this game |
| --- | --- |
| Valve designed recognizable silhouettes and deliberately limited background noise in its [Team Fortress 2 rendering paper](https://cdn.steamstatic.com/apps/valve/2007/NPAR07_IllustrativeRenderingInTeamFortress2.pdf). | Improve characters through shape, pose and contrast. Extra texture cannot compensate for an unreadable character on a phone. |
| Apple's [game design session](https://developer.apple.com/videos/play/wwdc2024/10085/) emphasizes controls and layouts adapted to each device. | Keep play immediate, choices untimed and the phone playfield generous. |
| Productive's [2025 agency report](https://productive.io/reports/agency-industry-report/) describes delayed starts, scope changes, short planning horizons and operational pressure. Its public summary covers 93 agency leaders, so it is a useful directional sample rather than a universal measure. | Find humor in shared situations: missing assets, approval loops, shifting priorities and handoff mix-ups. |

## What exists and where it runs out

The current game already has touch steering, a pause and settings panel, two primary weapon families, guided missiles, six agency hazard identities, bosses, a browser-local best score and an optional five-minute weekly challenge. The community has professional profiles, Google sign-in configuration, score history and an explicitly unverified public board.

The primary weapon reaches its highest tier at **seven cleared hazards**. Earned power survives a hit and switching between Spread and Focused, but there is no later primary tier or permanent support system. Encounter difficulty continues rising after the build has stopped changing. Six hazard names also share only four movement or armor types, so the visual joke rarely changes the decision a player makes.

Ship selection, paint choices, agency membership records, member comments and an ideas queue do not exist yet. A typed business name on a profile does not establish team membership. These need deliberate additions to the existing community plugin.

## A run that becomes spectacular

Keep the quick Single → Twin → Quad opening. Then let the loadout accumulate. A player should be able to say, “I have the quad guns, missiles and my two wingmates,” and still recognize each contribution.

### Proposed progression

| Beat | What the player gains | Why it changes play |
| --- | --- | --- |
| Opening waves | Existing primary upgrades and first missiles. | Immediate competence and familiar controls. |
| Before the first boss | Choose Wingmates or Relay Pulse alongside the primary weapon family. Fold this into the existing untimed loadout stop where practical. | Wingmates cover separated targets; Relay Pulse rewards lining up clusters. |
| First boss victory | Evolve the chosen support module; keep primary tier and missile inventory. | A visible payoff for beating the boss, followed by a breather to enjoy it. |
| Later in the run | A short earned “Inbox Zero” burst. | A memorable payoff: the accumulated loadout briefly fires in concert. |
| Further free play | New encounter combinations and bounded module improvements. | Continue the run without infinite fire-rate inflation. |

Target a first support addition within roughly 60–90 active seconds and a satisfying climax within the existing five-minute challenge. These are tuning targets, not measured results. If ordinary players rarely reach the support upgrade, move it earlier rather than reserving the fun for experts.

For the first prototype, use only two support modules:

- **Wingmates:** two small companion pods fire a weaker paired volley independently of primary shots. A later evolution adds piercing or a stronger synchronized volley. The pods visually attach to the selected ship's build.
- **Relay Pulse:** a primary hit passes a bright signal to one nearby target on a bounded cooldown. Its upgrade reaches a second target. Show a brief clean connection between targets, with the same chaining mechanic and clear visibility of incoming objects.

Spread and Focused remain selectable. Switching them does not remove the support module, earned tier or ammunition. Missile ammunition stays a consumable supply; collecting it reinforces an existing system rather than temporarily replacing the player's guns.

Prototype Inbox Zero as a six-second earned burst with a clear charge indicator and a limit on effect density. Automatic activation at full charge is the initial mobile option; test a manual trigger only if players find automatic timing wasteful. This burst is the stretch item after the two support builds are fun, not a dependency for their first release.

**Within a run, keep earned strength. Between runs, keep identity and cosmetic accomplishments.** Start weekly challenges with equal equipment access. Permanent damage bonuses would make the board measure account age as well as play. A loss should offer a quick retry and one useful explanation, such as “The Deadline Dive caught your marked lane.”

## Make the agency problems playable

Use a consistent illustrated style with chunky shapes, friendly exaggerated poses and warm highlights. Preserve the orbital office. Keep its busiest lights subordinate to moving characters, especially in the upper field where new hazards enter. Review a subtle contrast treatment before commissioning another world backdrop.

Characters need anticipation, action and reaction: the client winds up an exaggerated finger wag, a clock coils before a dive, and an approval stamp lifts before a bouncy landing. Design these at actual phone size, with labels hidden, before spending effort on fine detail. Give important characters larger portraits in Help or a brief boss entrance, where their expression can be appreciated without dodging.

| Familiar agency situation | Character and readable behavior | Player's answer |
| --- | --- | --- |
| Scope creep | The finger-wagging client marks a location, then throws one extra sheet toward that locked position. | Move after the warning; the paper does not keep tracking the player. |
| Moving deadline | A clock visibly winds up, then dives down a marked lane. | Leave that lane; the clock remains large enough to recognize. |
| Approval loop | Two stamp drones pass a document between them; a brief opening appears during the handoff. | Time focused fire or break one side. |
| Missing assets | A misplaced image frame folds behind a folder, leaving a visible outline before sliding back out. | Follow the visible cue; no surprise collision while hidden. |
| Reply all | An envelope announces a fan of smaller envelopes. | Choose the safe gap and use spread fire. |
| Tech debt | A cable-covered server has a heavy front and a clearly exposed component. | Use a piercing or focused build during the opening. |

Build the client and deadline behaviors first. Treat the rest as a content bank. Do not add six new rules in one release.

Bosses should have recognizable routines, not only more health. Present these as oversized office set pieces: “One Last Revision” can use three document trays that announce different patterns; an “Approval Committee” can expose one stamp at a time. Every pattern needs a readable warning, an escape route and a recovery opening. A completed tray pops open and files its papers, visibly changing the encounter. Keep joke text for entrances, breathers and results.

Humor should feel like colleagues recognizing a shared situation and smiling together. Include our own overfull inboxes and handoff mix-ups as well as changing requests. Use invented characters; contributions must omit actual client names, private messages and identifying details. End encounters with relief, a helpful gesture or a small celebration.

## A ship and profile that feel personal

Start with three original silhouettes and six reviewed paint presets:

| Ship concept | Visual identity |
| --- | --- |
| Studio | Broad swept wings and a compact central cockpit. |
| Relay | Twin booms and clearly mounted support pods. |
| Fixer | A sturdy rounded body and exposed mechanical detailing. |

Give all three the same movement, collision footprint, firing origins and equipment access initially. Make that equality clear in the hangar. Later ship classes can offer genuine tradeoffs, but they need separate balance work.

Allow reviewed orange, blue, teal, violet, white and graphite liveries with a consistent bright edge and visible cockpit. Color changes the hull, never the meaning of hostile shots, warnings or pickups. Offer named swatches with a selected indicator and a live preview. Freeform color and uploaded logos can wait until contrast and moderation are solved.

Put the hangar before a run or inside the paused panel. It must not take more space from the mobile arena. Save guest choices on the device, and synchronize signed-in choices through the current member account. Show the same ship thumbnail beside an opted-in public display name and on the board.

Keep professional information separate: changing paint should not withdraw or resubmit an approved business biography. Make company affiliation and professional links optional. A player can be recognizable without publishing their email or employer.

Cosmetic rewards can acknowledge real accomplishments: first boss beaten, a completed weekly run, or an idea included in a release. Avoid daily streak penalties, forced sign-in, loot boxes and power bought through referrals. Return visits should come from enjoyment and belonging.

## A place to contribute

Create an **Agency Break Room** linked from Gamification Labs and the community area, with a small “Suggest a character or challenge” route after a run. Lead with useful discussion and actual submissions; an empty launch should show a simple invitation, not fabricated posts or activity counters.

The first form asks:

1. What familiar agency moment would make a fun challenge?
2. What should it look like or do?
3. How should a player clear it?

An example is “The Friday 4:59 Request: a calendar drops an urgent folder, with a clearly marked escape lane.” Submission examples must be labeled as examples, not presented as member posts.

Signed-in members can submit an idea, see its status and add a short comment to an approved discussion. Public readers can browse approved material. Start with one level of replies and a simple “I've been there” reaction, limited to one per member per item with a reliable undo. Leave direct messages and live chat out of the first version.

Publish comments only after moderation during the pilot. The complete slice needs a real pending queue, approve/reject/hide controls, author edit/delete, reporting, rate limits and an ability to restrict abusive accounts. Editing published text returns the new revision to review. Administrator approval must apply to the exact text reviewed. Short plain text is sufficient; no uploads or executable submissions are needed.

Keep internal moderation states separate from public development status. A private pending submission is not a public promise. Approved ideas may be shown as Discussing, Testing or Released only when those descriptions are true. Link released ideas to actual changes and credit the contributor with their permission. Votes help choose experiments but do not automatically schedule work.

Public authorship, profile publication, agency participation and marketing emails each need an understandable choice. Google sign-in provides account identity; it should not silently subscribe someone. Keep the optional newsletter signup available after a run or in the community, with clear expectations about what is sent.

## Friendly company competition

Begin with one agency pilot: an owner approves a roster, employees opt in, and a private team board shows each person's best score on the same weekly course. Provide individual invitation links that expire, can be revoked and are accepted once by an authenticated member. The link requests membership; approved membership must still be checked on every private-board request. Do not automatically message employees or expose membership publicly.

Use actual membership records, not company-name text or an assumed email domain. Snapshot membership when issuing a run so an employer change cannot move old results. Rank eligible members before limiting the query; filtering the current global top scores afterward would omit some colleagues.

Retain the current **unverified casual score** disclosure. The existing server checks ownership, timing and bounded result fields but does not independently replay the simulation. Friendly comparisons are appropriate; prizes and verified-champion claims need stronger validation and review. Even a valid replay alone would not prove human play.

After the internal pilot works, test inter-agency competition with declared three-person squads locked before the course opens. Each member contributes one best result; no sum of unlimited attempts. Specify missing-run and tie rules before launch. Large companies can form more squads without giving one squad an unlimited roster advantage. This is a later proposal, not an existing league.

## Build order and acceptance

| Release slice | Concrete deliverable | Ready when |
| --- | --- | --- |
| Loadout and identity | Two compound support builds, two recognizable office-character behaviors, three cosmetic ships and six paints; guest preferences saved locally. | Both builds have useful situations, upgrades remain after hits and switching, ordinary players reach the new fun, and the busiest scene is readable on phones. |
| Community expression | Synced cosmetics, the Break Room, moderated suggestions and comments, visible submission status, contributor credit. | Two separate ordinary accounts cannot edit or reveal each other's private material; moderation, reports, deletion and approval of exact revisions work. |
| Agency pilot | Approved membership, invitations and an agency-only weekly board. | Membership cannot grant site administration access, rankings include all eligible players, privacy holds across agencies, and results remain honestly labeled. |
| Later experiments | Inbox Zero if not already accepted, additional bosses, ship classes, cosmetic milestones and inter-agency squads. | Evidence from earlier releases identifies the next worthwhile addition. |

The first slice is mostly game work. The next two extend the installed WordPress community plugin and its existing database. No separate service or paid runtime dependency is needed for this design; moderation and sustained testing still require human time.

Run a small pilot with roughly six agency owners or employees, mixing casual players and regular gamers. Let each play three runs without coaching. Record whether they recognize the characters without labels, notice each upgrade, understand the loss, try a different build and voluntarily restart. Ask what made them smile, whether the mood felt lighter afterward and whether a colleague would enjoy competing. This is a qualitative test, not a statistically representative retention study. Use it before adding analytics infrastructure.

For phone acceptance, preserve the current 678 CSS-pixel playfield at 390 × 844 in the existing layout, and also review 320px, landscape and full-screen safe areas. Keep drag controls, untimed choices, keyboard navigation, visible focus, sound settings and reduced effects. Use 44 CSS-pixel control targets as a browser design target. Apple's [game design session](https://developer.apple.com/videos/play/wwdc2024/10085/) supports adapting controls and safe areas to the device and testing on real hardware; its native point measurements are not browser pixel measurements.

Test at maximum combined firepower: warning marks and incoming shots must remain distinct from friendly effects and every livery. Pair color with shape or another cue, following [Xbox guideline 103](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103). Keep decorative motion and camera effects reducible, following [guideline 117](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/117). Reduced effects must retain gameplay information.

Measure full five-minute runs on at least one physical iPhone/Safari and Android/Chrome device before claiming sustained mobile performance. Browser emulation remains useful for layout and input logic. Record frame timing and responsiveness in the busiest encounters; do not infer performance from an empty arena.

## Implementation boundaries

- Extend deterministic game state for modules and progression; keep rendering and audio separate. Version combat changes and give the new rules a separate weekly board, preserving previous history and live tickets. Explicitly handle both the legacy unversioned challenge IDs and versioned 1.5.0 IDs: the current previous-rules helper assumes the legacy format, so changing version constants alone is insufficient. Add migration and ticket-compatibility regression checks.
- Start with the present safety bounds: 64 primary projectiles, eight active missiles, 18 hostile shots, eight trail points per missile and 24 rendered transient effects. Include support shots in an explicit budget and reserve primary-fire capacity so a drone cannot suppress the player's gun. Revisit limits only with performance and balance evidence.
- Store cosmetics as validated preset identifiers. Keep them separate from the moderated professional-profile draft. Do not accept arbitrary SVG, CSS or user uploads in the first release.
- Implement suggestions through scoped community records and endpoints. Reuse member checks, nonce/origin checks, ownership, atomic limits and moderation locking. Do not enable global WordPress comments or grant members publishing or upload permissions.
- Extend privacy export and erasure to appearance, membership and contributions; define deletion or anonymization of replies and historical results before release. Preserve the current marketing-consent choice.
- Complete a fresh ordinary-user Google onboarding test and cross-account tests before inviting a company. Existing documentation records successful existing-member play, with fresh Google onboarding acceptance still limited.
- Keep all three games, existing links and anonymous free play. Review relevant sharing artwork, initial-HTML metadata and mobile previews under the workspace social-sharing standard for every public release. Private agency pages and private submissions stay excluded.

The current code evidence is in [game-engine.js](../public/game-engine.js), [game-renderer.js](../public/game-renderer.js), [game.js](../public/game.js) and [community-client.js](../public/community-client.js). The separately managed community source is at workspace path `htsg-community/package/htsg-community/includes/`: `Core.php` defines allowed profile fields and challenge rules, `Repository.php` stores and ranks records, `Plugin.php` handles permissions and privacy, and `View.php` renders member/profile pages. That private source is not part of this public game repository.

The immediate decision is to prototype the compound loadout and personal ships, then let a small group help shape the Break Room and next office challenges. Keep future features in this plan until they work.
