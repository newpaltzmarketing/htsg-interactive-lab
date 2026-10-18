# Agency Invaders game direction

Planning draft, October 17, 2026. This document describes a proposed free game and community direction, not a set of available features. The public name remains **Gamification Labs**, and the game keeps its existing URL.

## Release boundary

Version **1.3.0 is installed**. It provides direct arena steering, more playfield space, a browser-local personal best, and pressure that grows after the first two approachable waves. Weaving and armored hazards are joined by a boss every five waves, alternating Scope Creep and Change Request. Boss attacks are signaled before firing; defeating one gives a reward and a breather. Existing weapon upgrades persist through damage. Source QA passed; actual public integration, sharing, and all three focused progression/boss scenarios passed as recorded in [QA.md](QA.md).

The release has no shared leaderboard, challenge service, account, community feed, or new game backend. Personal best means this browser on this device; it is neither verified nor synchronized. Blocked or cleared storage leaves the game playable. Directions below are proposals rather than available modes or community services.

## Five directions worth testing

1. **Make agency frustration the identity.** Keep names people recognize: Scope Creep, Missed Deadlines, Budget Overruns, Tech Debt, Bottlenecks, and Broken Handoffs. Give each a distinct behavior and silhouette: a weaving deadline, a slow armored tech-debt block, or a handoff pair that separates. Teach the behavior through play and a brief help line. Avoid making the player read jokes while dodging.

2. **Make bosses feel like familiar bad meetings.** Build on the release's Scope Creep and Change Request bosses. Scope Creep could gradually add attack lanes; Change Request could announce and then change its pattern. Every dangerous move needs a readable windup, a fair escape lane, and a recovery window. A boss victory should feel like finishing a difficult project, with a clear reward and a quiet moment before the next wave.

3. **Add one meaningful tradeoff at a time.** A future between-wave choice could offer a wider shot with lower damage, a stronger shield with slower recharge, or more points for accepting an extra hazard. Keep choices understandable on a phone and make each change the next wave. This would require fresh balance and accessibility testing; it is not in 1.3.0.

4. **Give each session a clear shape.** Retain a quick restart. Later, test a short five-wave “One More Revision” run alongside an endless “Deadline Mode.” A fixed run gives friends a comparable finish; endless play suits personal records. Build one mode well before adding another selector or progression system.

5. **Let people compare the same challenge without an account.** Later, a shared seed in a link could reproduce the same hazard schedule. A local end-of-run scorecard could show score, wave, boss wins, and the seed, with an optional downloaded image or native share action. Treat shared scores as friendly and unverified. Do not imply a global ranking or build a fake leaderboard.

## A small free-community rollout

1. Finish the readable, fair phone game first. Have a few people play three runs without coaching; ask where their thumb blocks the action, what caused each loss, and whether they chose to restart. Record feedback manually rather than adding tracking now.
2. Publish the working free link with a short actual-game clip and a specific invitation for feedback. Keep play immediate: no account, paywall, lead-form gate, or unavailable community panel. Any outreach or posting needs the owner's separate approval.
3. After the game earns repeat play, prototype a fixed shared-seed challenge and an honest local scorecard. Verify deterministic play and sharing metadata before inviting comparisons. Use an existing owner-approved community channel rather than creating a game service prematurely.
4. Review voluntary feedback and repeat-play observations, then choose the next improvement. Moderate any owner-run challenge manually at first. Consider verified scores or accounts only after a separate scope, cost, privacy, and moderation decision.

The strongest near-term sequence is recognizable hazards, fair boss beats, and a satisfying restart. Shared challenges and community tools should follow demonstrated enjoyment of that core.
