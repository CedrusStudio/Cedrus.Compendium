# Data-quality pilot: owner decisions and acceptance

Captured 2026-11-15. PR #114 merge was reported by the maintainer. This stage starts
from its published head `de63fef7d01517dd86ff2a7857b4d18701d67428`; current remote main
could not be verified here. The source is the complete local export created at
`2026-11-15T18:38:23.881Z`. No production data has been changed.

## Decisions needed from the rules owner

The pilot has four families and thirteen records. Decisions apply to families, not
to each rank separately. The numerical values below are already present in the source;
there is no request to rebalance them. Every proposal remains unapproved.

| Decision | Existing evidence and the choice to record |
| --- | --- |
| D1. Stance/state lifetime | The rulebook's **Postawy** and **Stany** sections specify entry at round start. The simulator implementation plan and engine describe stance changes before or after an attack. Decide which is the current rule, when initial bonuses begin (including an opponent acting first), and when a state ends. If round-start rules are retained, specify whether selection is simultaneous before initiative. |
| D2. Replacing a stance | The engine applies the new stance immediately and retains the old modifiers until the next own turn. Decide whether replacement instead removes the old stance's modifiers immediately, or whether this overlap is intended. |
| D3. Damage modifiers | **Ostrość Umysłu** says +2 damage; **Postawa Defensywna** says -1 through -6. Decide which damage they modify: weapon attacks, spell attacks, direct maneuver damage, and whether they apply once per action or once per separate damage component. The current direct-damage effect bypasses the offense modifier. |
| D4. Koci Instynkt | Immunity +1 and resistance +1/+2/+3 are explicit. Define when this instantaneous defensive bonus begins/expires and whether repeated use refreshes or stacks it. The existing stored duration of 1 is observed data, not a confirmed rule. |
| D5. Stadne Wycie | Define the members of the pack, whether the caster is included, duration, refresh/stacking, and who shares the once-per-round limit in relation to the stored cooldown of 5. Separately approve or reject withdrawing the current incomplete self-only mapping until full group support exists. The proposed withdrawal sets `simulatable: false`; it does not implement group behavior. |

Record the chosen rule and one concrete example for each decision. After implementing
and testing that rule, the owner still reviews the exact proposed descriptions/effects
and explicitly approves the small application batch. A merge, passing characterization
test or generated draft does not supply that approval.

### Values already established by the source

| Family | Ranks | Values to preserve |
| --- | --- | --- |
| Postawa Defensywna | 1–6 | Resistance +1, +2, +4, +6, +8, +11; damage -1, -2, -3, -4, -5, -6 |
| Ostrość Umysłu | 1 | Damage +2; no automatic Strength-derived damage |
| Koci Instynkt | 1–3 | Immunity +1; resistance +1, +2, +3 |
| Stadne Wycie | 1–3 | Resistance +1 to each pack member; protection/reduction +0, +1, +2; one use per round in the description; cooldown 5 in stored context |

The rulebook already distinguishes immunity (removing non-phantom dice), resistance
and reduction. Generic term definitions need not be decided again for this pilot.
Its broader resistance source-count rules are outside this small mapping check.

## Technical work completed

- Added a shared synthetic thirteen-record fixture; no export-derived identifiers or
  character relations are versioned.
- Added ten engine characterization tests using the actual generated mode effects:
  six nonlinear stance ranks, repeated turns, independent stance/state slots, Strength,
  stance exit, initial initiative and direct-damage scope. They also verify the input
  snapshot is not mutated. These describe current behavior, not accepted game semantics.
- Updated generation so all thirteen rows carry explicit unresolved decisions. Generated
  semantic-engine checks remain `NOT_RUN`; characterization results never approve them.
- Added a disposable local MongoDB launcher with receipt/report evidence and scoped
  container cleanup. Its orchestration has seven tests, including failure, skipped-test
  rejection, inherited database-URL replacement and refusal to delete another owner.

Observed engine behavior: `duration: 0` mode modifiers are refreshed on the owner's
turn without accumulating. Initial stance protection is absent before that first turn.
After switching to a neutral stance, old modifiers persist until the next own turn.
State damage +2 affects the offense; a direct damage effect of 5 remains 5.

References: [engine characterization](../src/domain/data-quality/__tests__/modePilotEngineCharacterization.test.ts),
[pilot generator](../src/domain/data-quality/pilotReview.ts),
[rulebook](../public/data/rulebook/system-walki.json) (`Postawy`, `Stany`, `Niewrażliwość`, `Odporność`),
[simulator implementation plan](combat-simulator-implementation-plan.md),
[existing stance worksheet](postawy-autorowanie.md).
The older worksheet uses `duration: 1`; it is historical analysis, not proof of the
current intended lifetime. This stage does not change the combat engine or rulebook.

## Remaining technical acceptance

These are execution tasks, not additional game-design questions.

1. Run the real MongoDB tests from this candidate checkout in a normal PowerShell
   session with Docker Desktop running in Linux-container mode:

   ```powershell
   npm run test:data-change-integration
   ```

   Or use `node scripts/run-data-change-integration.mjs --port=27028` when the default
   port 27027 is occupied. The launcher uses a uniquely named local test database and
   container, initializes a replica set, prepares its schema and requires all three
   transaction/rollback/race tests to execute and pass. No `.env` edit is needed.
   Results are in `backup/data-change-acceptance/<run-id>/receipt.json` and `vitest.json`.
   A controlled failure still cleans its own container. After a forced process kill,
   inspect the receipt/container ownership before any manual cleanup. No global prune
   is part of this workflow. The `mongo:7.0` image is retained for reuse; its image ID
   is recorded when a container is created.
2. Run the existing browser scenarios on desktop and 320px:

   ```powershell
   node scripts/run-e2e.mjs effect-authoring.spec.ts --project=desktop --project=phone-320
   node scripts/run-e2e.mjs mobile.spec.ts --project=desktop --project=phone-320 --grep "real simulation worker"
   ```

   See [E2E prerequisites](../e2e/README.md). These use mocked API responses and the real
   simulation worker. They do not establish live persistence or physical-phone behavior.
3. Retain COMP-Q3's separate character-access/membership integration acceptance. The new
   MongoDB launcher deliberately runs only the data-change suite.
4. Once D1–D5 are resolved, implement any necessary engine changes, turn the relevant
   characterization into accepted-rule regression fixtures, and regenerate the pilot
   from a fresh complete export. Run the guarded offline plan, review exact before/after
   values and approve the intended batch. Take another fresh backup before any explicit
   apply, retain the journal and perform the agreed rollback acceptance on isolated data.

## Environment limits observed in this stage

In the initial local attempt Docker refused access to the `dockerDesktopLinuxEngine` named pipe, so the launcher
stopped before container creation or schema work. The three real MongoDB tests did not
run. A separate browser harness bundled the actual effect editor, sheet, simulation hook
and worker, but Chromium navigation to `127.0.0.1` failed with `ERR_NETWORK_ACCESS_DENIED`.
No rendered desktop/mobile acceptance is claimed. Existing browser gates remain open.

The maintainer's later run on `da8a2a0ffbda1be40eed7879ba5a698fa9b0279f` did reach
MongoDB: two tests passed and nullable-effects rollback failed because the adapter sent
the SQL-only `Prisma.DbNull` sentinel. Its container was cleaned up. The adapter now
preserves literal null and uses a checked Prisma input type. Its updated regression failed
before the fix and the selected unit suite passes after it. The corrected real MongoDB
suite still needs a complete passing run; this does not change D1–D5 or approve any row.

The source and maintained documentation belong to the dedicated task branch. Publication
must replay only this stage onto freshly fetched main, preserving intervening changes.
The shared profile remains `0a42eb8fcc6f86a592c259aa461a49875fda6637`.

Selected local verification: 84 tests passed across eleven files; the three real MongoDB
cases were skipped. Full/scoped TypeScript checks, launcher syntax and diff whitespace
checks passed. No full build, coverage run, production apply or deployment ran. The
publication evidence retains these results with the exact candidate revision.
