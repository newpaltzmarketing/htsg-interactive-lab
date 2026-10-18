# Agency Invaders game direction

Updated October 18, 2026. This document separates implemented gameplay from later ideas. The public name remains **Gamification Labs**, and the three free games keep their existing URLs.

The [October 18 expansion research and plan](EXPANSION-RESEARCH-2026-10-18.md) develops the next proposed direction: compound power-ups, playful office characters, personal ships and colors, moderated contributions and company competition. It supersedes the broad future ideas below for prioritization. The first gameplay slice is implemented in the installed 1.6.1 release below. Moderated contributions and company rosters remain proposals.

Dean's October 18 creative direction is warm office comedy and shared progress. Preserve the upgrade structure and technical architecture while using friendly exaggerated props, helpful wingmates and satisfying visual payoffs. Horror themes, sinister imagery and revenge framing are excluded. Apply the [game tone and imagery standard](BRANDING.md#agency-invaders-tone-and-imagery) to future artwork, labels, sound and community prompts.

## Release boundary

**1.6.1 is installed.** Three cosmetic hulls and six paints live in the start/pause hangar and save only on this device. Wingmates or Relay Pulse join after wave two, evolve after the first boss and combine during an earned six-combat-second Inbox Zero burst. The pointing client warns a fixed paper destination; the clock warns a lane before diving. Existing primary upgrades, missiles, touch controls, arena space and all three games are retained. Rules 1.6.0 and coordinated Community 1.0.6 isolate new weekly scores while preserving history and original-expiry old tickets. No server-side ship profile, comments, Break Room or company board is included.


**Historical 1.5.3** with an orbital agency office world and matching game-gallery/sharing imagery. Portrait/landscape readability, fallback/crop checks, installer verification and actual public asset/metadata checks passed. Rules 1.5.0, existing mechanics and Community 1.0.5 are preserved; separate homepage/Community imagery is outside this release.

The retained **1.5.2 artwork** is a visual-only replacement of one falling hazard with an animated finger-wagging client. It retains the current hitbox, movement, weapons and challenge rules; no Community change is included. Reviewed source fixtures, installer verification and actual public renderer/sharing checks passed.

The retained **1.5.1 dashboard fix** keeps rules 1.5.0 and corrects a fallback-font dashboard wrap that reduced the phone arena height. The retained **1.5.0 mechanics** provide: one pause panel, Spread/Focused switching at any pause and more plentiful guided missile pairs. Earned weapon level and ammunition survive switching; the first upgrade supplies four pairs, capsules add six and capacity is eight. Supplies begin in wave two, and missiles fire independently with bounded guidance. That historical release used rules 1.5.0 with separate weekly boards. Installed Community 1.0.6 now retains those records and unexpired prior attempts alongside current rules 1.6.0. See [QA.md](QA.md) for source and actual public acceptance.

Retained visual polish from **1.4.1**: agency-themed enemy silhouettes, distinct boss artwork and clearer firing feedback. This pass changes presentation and optional sound only; damage, collision geometry, progression, weapon choices and seeded challenge rules remain at 1.4.0. Source/mobile artwork, local input and actual public checks passed. It adds no new mode, community feature or balance claim.

Earlier **1.4.0** introduced relative arena steering, a browser-local personal best and capped pressure after two approachable waves. Its automatic choice and four-pair supply were superseded by the 1.5.0 pause panel and missile rules above. The compact dashboard preserves the 678-pixel phone canvas at 390 × 844; optional original synthesized sound starts muted. Launch Runner and Trivia retain their rules. Actual source and public verification are recorded in [QA.md](QA.md).

The installed game also has a seeded challenge contract: fixed 960 × 1669 logical course, 120 Hz simulation and a maximum five-minute active clock. Weapon-choice time is excluded. A separate same-origin client handles server-issued attempts, results and fresh replay tickets. Free play never waits for this connection. The community plugin has its own security, identity configuration and data lifecycle. The owner has enabled public features and Google configuration, and an actual existing-member weekly run reached saved history and the board. Fresh Google onboarding was not tested from the already-authenticated owner session; see [QA.md](QA.md). Casual submitted scores are explicitly unverified. The browser-local personal best remains unsynchronized, and blocked storage leaves the games playable. Ideas below are future work except where implementation is explicitly stated.

## Five directions worth testing

1. **Make shared agency experiences recognizable and funny.** Keep names people recognize: Scope Creep, Missed Deadlines, Budget Overruns, Tech Debt, Bottlenecks, and Broken Handoffs. Give each a playful behavior and silhouette: a winding clock, a cable-covered server, or a handoff pair that separates. Teach the behavior through play and a brief help line. Let people recognize the situation without reading jokes while dodging.

2. **Make bosses playful office set pieces.** Version 1.4 implements Scope Creep's expanded warned fan at half health and Change Request's alternating single/staggered attack. Keep future patterns equally readable: a windup, a fair escape lane and a recovery window. Celebrate a cleared stack or a completed brief with the existing reward and breather.

3. **Add one meaningful tradeoff at a time.** The spread/focused choice is implemented. Test whether people use both families before adding another tradeoff, upgrade tree or selector. Later shield or risk/reward choices need fresh balance and accessibility testing; they are not available features.

4. **Give each session a clear shape.** Retain a quick restart. Later, test a short five-wave “One More Revision” run alongside an endless “Deadline Mode.” A fixed run gives friends a comparable finish; endless play suits personal records. Build one mode well before adding another selector or progression system.

5. **Make comparisons honest.** Deterministic challenge hooks are implemented; the separate community service needs its own acceptance. A later local result card or native share action could show score, wave and boss wins without requiring an account. Treat casual shared scores as unverified and never fabricate rankings or leaderboard entries.

## A small free-community rollout

1. Finish the readable, fair phone game first. Have a few people play three runs without coaching; ask where their thumb blocks the action, what caused each loss, and whether they chose to restart. Record feedback manually rather than adding tracking now.
2. Publish the working free link with a short actual-game clip and a specific invitation for feedback. Keep play immediate: no account, paywall, lead-form gate, or unavailable community panel. Any outreach or posting needs the owner's separate approval.
3. Accept the separate challenge service only after its permission, privacy, replay-ticket and score-disclosure checks pass. Configure and confirm Google sign-in separately. Keep the three free games immediate and available when the service is absent or unavailable.
4. Review voluntary feedback and repeat-play observations, then choose one next improvement. Moderate owner-run challenges deliberately. Verified scores, community feeds and other expanded features require a separate scope, cost, privacy and moderation decision.

Keep the current recognizable hazards, fair boss beats and satisfying restart. Future changes must preserve the phone arena and repeat actual input, choice, ammunition, boss, pause, resize and sharing checks. Roadmap ideas stay in this document until they work.
