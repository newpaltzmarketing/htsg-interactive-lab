# Agency Invaders game direction

Updated October 17, 2026. This document separates implemented gameplay from later ideas. The public name remains **Gamification Labs**, and the three free games keep their existing URLs.

## Release boundary

Visual polish **1.4.1 is installed**: agency-themed enemy silhouettes, distinct boss artwork and clearer firing feedback. This pass changes presentation and optional sound only; damage, collision geometry, progression, weapon choices and seeded challenge rules remain at 1.4.0. Source/mobile artwork, local input and actual public checks passed. It adds no new mode, community feature or balance claim.

The retained **1.4.0 mechanics** include relative arena steering, a browser-local personal best and capped pressure after two approachable waves. The untimed choice after wave two selects wide spread or stronger, narrower focused fire while retaining earned upgrades. Missile capsules from wave three load up to four pairs that launch alongside primary fire. The compact dashboard preserves the 678-pixel phone canvas at 390 × 844; optional original synthesized sound starts muted. Launch Runner and Trivia retain their rules. Actual source and public verification are recorded in [QA.md](QA.md).

The installed game also has a seeded challenge contract: fixed 960 × 1669 logical course, 120 Hz simulation and a maximum five-minute active clock. Weapon-choice time is excluded. A separate same-origin client handles server-issued attempts, results and fresh replay tickets. Free play never waits for this connection. The community plugin has its own security, identity configuration and data lifecycle. The owner has enabled public features and Google configuration, and an actual existing-member weekly run reached saved history and the board. Fresh Google onboarding was not tested from the already-authenticated owner session; see [QA.md](QA.md). Casual submitted scores are explicitly unverified. The browser-local personal best remains unsynchronized, and blocked storage leaves the games playable. Ideas below are future work except where implementation is explicitly stated.

## Five directions worth testing

1. **Make agency frustration the identity.** Keep names people recognize: Scope Creep, Missed Deadlines, Budget Overruns, Tech Debt, Bottlenecks, and Broken Handoffs. Give each a distinct behavior and silhouette: a weaving deadline, a slow armored tech-debt block, or a handoff pair that separates. Teach the behavior through play and a brief help line. Avoid making the player read jokes while dodging.

2. **Make bosses feel like familiar bad meetings.** Version 1.4 implements Scope Creep's expanded warned fan at half health and Change Request's alternating single/staggered attack. Keep future patterns equally readable: a windup, a fair escape lane and a recovery window. Preserve the victory reward and breather.

3. **Add one meaningful tradeoff at a time.** The spread/focused choice is implemented. Test whether people use both families before adding another tradeoff, upgrade tree or selector. Later shield or risk/reward choices need fresh balance and accessibility testing; they are not available features.

4. **Give each session a clear shape.** Retain a quick restart. Later, test a short five-wave “One More Revision” run alongside an endless “Deadline Mode.” A fixed run gives friends a comparable finish; endless play suits personal records. Build one mode well before adding another selector or progression system.

5. **Make comparisons honest.** Deterministic challenge hooks are implemented; the separate community service needs its own acceptance. A later local result card or native share action could show score, wave and boss wins without requiring an account. Treat casual shared scores as unverified and never fabricate rankings or leaderboard entries.

## A small free-community rollout

1. Finish the readable, fair phone game first. Have a few people play three runs without coaching; ask where their thumb blocks the action, what caused each loss, and whether they chose to restart. Record feedback manually rather than adding tracking now.
2. Publish the working free link with a short actual-game clip and a specific invitation for feedback. Keep play immediate: no account, paywall, lead-form gate, or unavailable community panel. Any outreach or posting needs the owner's separate approval.
3. Accept the separate challenge service only after its permission, privacy, replay-ticket and score-disclosure checks pass. Configure and confirm Google sign-in separately. Keep the three free games immediate and available when the service is absent or unavailable.
4. Review voluntary feedback and repeat-play observations, then choose one next improvement. Moderate owner-run challenges deliberately. Verified scores, community feeds and other expanded features require a separate scope, cost, privacy and moderation decision.

Keep the current recognizable hazards, fair boss beats and satisfying restart. Future changes must preserve the phone arena and repeat actual input, choice, ammunition, boss, pause, resize and sharing checks. Roadmap ideas stay in this document until they work.
