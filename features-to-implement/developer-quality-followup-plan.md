# Compendium developer quality follow-ups

Captured: 2026-11-03. Status: **open**. Owner: Compendium maintainer.
The two items below are independent application fixes. META-M5b delivered developer
guidance; META-M5c concerns OutboxRegistry and does not implement these fixes.
Track current status in [ROADMAP.md](../ROADMAP.md).

## COMP-Q1 — Restore scoped TypeScript verification

Status: fixed in the CI repair candidate. Baseline: ef05dd157a9a0cd9a73957ec25e88061d4a2b877 and M5b source
128f2a80d4eee865c02a96e4e83c7ea8a5256387 both produce the same 67 diagnostics with
the same installed dependencies. Errors include missing testing-library matcher types
in the character-scope tests. This is not a runtime-prompt or guidance-adoption failure.

Reproduce with `npm ci` and `npm run typecheck:scoped`. Inspect the complete diagnostics,
the scoped compiler inclusion/ambient types and the Vitest/testing-library setup before
selecting a fix. Preserve the intended scoped feature coverage and real assertions.
Do not hide failures by excluding affected tests, weakening compiler options, adding
type suppressions or replacing meaningful assertions with untyped values.

Acceptance: scoped typecheck exits zero; affected existing tests pass; full typecheck
is run and its result reported separately. Keep runtime character-generation contracts
unchanged unless an explicitly selected product fix requires otherwise. Record the final
source revision, commands and results here and close the matching roadmap row.

Verification on 2026-11-05 reproduced 67 diagnostics before the change.
The scoped configuration now includes the existing Vitest setup, which declares
the matchers used by tests in scope. Both `npm run typecheck:scoped` and
`npm run typecheck` passed with the original test files included.

## COMP-Q2 — Meet the existing coverage thresholds

Status: open. Hosted full unit tests pass: 2,228 passed and 18 skipped. The lane then
fails coverage identically before and after M5b:
[baseline](https://github.com/dr-marek-jaskula/Cedrus-Compendium/actions/runs/40727430929),
[M5b](https://github.com/dr-marek-jaskula/Cedrus-Compendium/actions/runs/41640046578).

| Coverage | Recorded result | Existing threshold |
| --- | --- | --- |
| Lines | 75.31% | 85% |
| Functions | 63.41% | 85% |
| Statements | 73.16% | 85% |
| Branches | 62.73% | 80% |

Reproduce with `npm run test:coverage`; inspect the report and prioritize meaningful
untested behavior and failure paths in the owning modules. Keep the existing thresholds,
instrumented scope and test semantics. Do not reduce thresholds, expand exclusions or
skip tests to manufacture a green report. Keep paid providers, live database operations
and product releases outside ordinary isolated test execution.

Acceptance: the full unit and coverage lane passes at its existing thresholds; existing
skips are explained; scoped typecheck remains green after COMP-Q1. Record final source,
coverage values, run link and any separately agreed follow-ups before closing this item.

## Execution order and evidence

Resolve COMP-Q1 first, then COMP-Q2. Recheck the current checkout and dependency baseline
before implementation; these recorded counts are evidence, not assumptions about future
source. See the [development guide](../docs/development.md#guidance-provenance-and-updates) for developer-guidance checks.
Original M5b evidence is in [the local receipt](../docs/history/m5b-guidance-20261103.md)
and [Meta integration evidence](https://github.com/dr-marek-jaskula/Cedrus.Meta/blob/main/docs/history/m5b-application-guidance.md).
No code, test, compiler configuration or coverage threshold is changed by recording this plan.

## COMP-Q3 - Character access boundaries

Status: merge reported by the maintainer on 2026-11-15 for CODE-01 and the character-input
portion of CODE-02. The exact accepted main SHA and additional integration evidence were
not available locally; the following test results retain their original candidate attribution.

Batch reads now use the existing database visibility predicate. Statistics, talents,
equipment, buffs and deletion require a validated API key and perform their access read
and write in the same transaction. Details/combat repository methods require their
existing access/membership guard; the unguarded fallback is removed. Public and legacy
public characters retain the existing visibility policy. Hidden and missing characters
produce the same 404; transaction conflicts remain 409. Submitted keys are not echoed
in validation messages.

The batch route validates nonempty string IDs and accepts at most 200 IDs per request.
Legacy imported identifiers remain supported. Existing clients deduplicate and split
larger selections into consecutive requests; a failed later batch rejects the entire
client operation. The endpoint returns domain Characters, so its Combat Lab consumer
no longer applies a second persistence mapping. Character creation uses the existing
header schema before persistence. Existing successful response envelopes are preserved.

Runtime validation for battle presets/saved simulations, strict effect authoring,
simulation lifecycle, browse/UI work and content changes remain open. This candidate
does not close COMP-Q1/COMP-Q2 or authorize a database backfill.

Verification in the isolated task worktree uses existing installed dependencies and no
application secrets. The selected 15-file suite passed 196 tests; 21 integration cases
were skipped without a configured dedicated database. Full and scoped TypeScript checks
pass. The integration suite includes four new cases for cross-key access, allowed writes,
rollback and concurrent access revocation. It requires the isolated database described
in [the character-scope plan](compendium-character-scope-plan.md); Docker access was denied
in this environment, so those scenarios are NOT_RUN. Unit mocks do not prove MongoDB
transaction behavior. The pending real-database acceptance remains recorded despite the reported merge.

Follow-up: run the character access/membership integration suite against a disposable
local replica-set database and retain its actual result; the merge report is not a new test execution.

## COMP-Q4 - Simulation lifecycle and result provenance

Status: merge reported by the maintainer; browser acceptance remains pending. Implements
CODE-04, UI-06 and the runner portion of UI-05
from the 2026-11-15 improvement review. The remaining saved-list, broader UI and effect
authoring work is independent and remains open.

Each simulation invocation owns a separate worker. Cancellation, supersession and
unmount terminate the worker and settle the returned Promise with `AbortError`; late
callbacks cannot overwrite or terminate a newer run. Startup, execution and response
decoding failures settle as explicit failures. The internal hook now resolves an outcome
containing both summary and raw results, so the caller captures one completed result.

The pure simulation loop emits progress after the actual completed fights, preserving
seed order and aggregation. Counts, progress intervals and seed ranges reject invalid
integer values before execution. Empty pure-domain runs remain supported.

The runner captures names, complete configuration, collection option and results for
the completed invocation. Editing the next setup cannot rename or alter that result,
save payload or replay range. The UI exposes cancellation and durable failure/retry
states, and explains that switching tabs cancels active work. A new invocation clears
the previous result; setup/result persistence across analyzer navigation is not added.

Saving has an immediate in-flight guard, pending/error/success state and explicit retry
after failure. After success the default save action is disabled for that result; a new
run permits a new save. Cache-refresh failure cannot invite a duplicate write. This is
a UI guarantee, not server idempotency. New controls/statuses use the existing PL/DE/FR
translation tables and associated labels. The saved simulation JSON contract is unchanged.

Verification: 86 tests passed across 14 selected files covering lifecycle, runner,
worker transport using the real engine, deterministic simulation/analysis and existing
translation helpers. Full and scoped TypeScript checks passed in the task worktree;
23 new translation keys are present in PL/DE/FR. The mobile suite now checks cancellation
and restart, retained result counts after editing setup, and the exact saved payload.
Browser acceptance is NOT_COMPLETED: an isolated Playwright/Next startup attempt did
not produce test results and was interrupted. Keep the PR draft until that acceptance
is run on a working browser environment; no rendered or physical-device result is claimed.

The source base is the previously accepted candidate `36534bae21a5f5d3c1d9f0787a095d02804eb065`.
The maintainer reported its merge, but the exact current remote main revision could not
be fetched from this environment. Publication must transplant only this stage onto the
current accepted main, preserving any intervening changes and handling conflicts normally.


## COMP-Q5 - Safe effect authoring and shared write validation

Status: PR #112 merge reported by the maintainer. Implements the authoring portion of
CODE-03 and UI-07/UI-08. Browser acceptance and broader effect-editor accessibility remain
open. Current bulk-write behavior is owned by COMP-Q6 below; semantic content review remains open.

`effectAuthoringSchema` adds strict write checks to the canonical compatibility parser:
unknown fields are rejected recursively, legacy resource aliases require an explicit
`essence` value and custom effects require a plugin schema. Registered plugins and built-in
schemas work in the editor, API and CSV previews. Persistence uses parsed output,
including plugin defaults/transforms. Current bulk writes and reason coherence use COMP-Q6;
legacy CSV apply is now refused.
The existing permissive read schema and stored effect contract remain available.

Raw JSON fields preserve the visible draft and distinguish syntax from schema errors.
Malformed text is represented as an invalid form value, preventing a resolver from
submitting the last good payload. Valid edits work without blur. Field-array identity and
record/reset handling keep drafts with the correct effect. Labels, associated errors,
invalid state and focus support correction. Changing a type that contains fields requires
confirmation, with cancellation focused by default. New strings use PL/DE/FR tables.

The description preview distinguishes empty, invalid and unsupported effects and updates
on changes to the effects, simulation status and maneuver metadata. Invalid drafts cannot
produce a preview of a previously valid payload.

The offline `scripts/audit-effect-authoring.ts` command checks a local MongoDB backup
without importing Prisma or writing data. The 2026-11-15T18-38-21-763Z snapshot contained
993 maneuvers (84 with 92 top-level effects), 217 stances and 30 states (neither with effects).
All 92 effects pass the new write validation. This is structural evidence; the previously
identified description/mechanics discrepancies still require reviewed content changes.

The source base is the published previous candidate
`0968d99ea39179370eedace1fe6718f3e85c0f1e`. Its merge was reported by the maintainer;
publication must transplant only this stage onto current remote main and preserve any
intervening changes. No live database writes, merge or deployment are part of this stage.


Verification: 276 tests passed across 11 selected files on Node 22.15.1 / Vitest 4.0.15,
covering recursive validation, plugins, API create/update boundaries, JSON draft handling,
importer dry-run/mock-apply and the offline audit. Full and scoped TypeScript checks passed.
The existing numeric-route fixtures now supply the API key required by the accepted character
access boundary; production access checks were not changed. No real importer apply ran.

Browser acceptance is NOT_COMPLETED: an isolated Next/Playwright attempt using webpack
produced no ready application or test result and was interrupted. The new browser scenario
covers malformed/schema-invalid JSON, focus, cancelling a destructive type change and the
exact repaired save payload; execute it on a working environment before marking the PR ready.
The shared profile revision remained `0a42eb8fcc6f86a592c259aa461a49875fda6637`.
The Meta workspace guidance check could not run because its checkout was outside the
available read permissions; this change does not modify shared guidance.


## COMP-Q6 - Guarded data review batches and local recovery journals

Status: PR #114 merge reported by the maintainer for the remaining selected CODE-03 /
DATA-03 write boundary. Real MongoDB acceptance remains pending despite that merge. No production content
has been changed and semantic corpus review remains open.

The [script guide](../scripts/README.md#guarded-content-change-sets) owns commands and the
operating procedure. A versioned review bundle targets immutable IDs on Maneuver, Stance
and State; editorial changes are separate from mappings. Before-content hashes also guard
name/rank, price, tags, requirements, replacements and cast/cooldown context. Private character
relations are excluded. Review approvals, evidence, resolved questions and passing checks
are required; a generator cannot approve its own drafts automatically.

A batch contains 1–20 records and at most 1 MiB. Planning is the default and can operate
entirely from a complete local backup. Explicit apply/rollback requires a complete backup
manifest/files/counts and matching affected values. Every row is rechecked before the first
write in a Prisma 6 MongoDB transaction; stored values are verified before commit. A mixed
before/after state, unknown ID, stale context or write conflict aborts the batch. No automatic
retry, splitting or cross-batch atomicity is claimed.

A flushed local intent precedes the transaction. It retains the immutable reviewed bundle,
before/parsed-after values and hashes, bound to a credential-free database identity. Attempts,
failures and completion receipts remain available. Retries recover uncertain completion by
checking current hashes and return `already_applied` without another write. Rollback restores
only changed fields when every live after hash matches. Later edits block rollback. A rolled
back journal refuses reapplication, and a completed operation cannot silently repeat after
its result has changed. Preserve the same journal/bundle for recovery; this is local journal
idempotency, not a server-wide service across independent machines or deleted journals.

Legacy CSV import and cross-grade copying scripts retain read-only previews but refuse
`--apply` before file/database reads. Their direct update code was removed. This prevents
those bulk paths from bypassing the review and hash gates. Explicit legacy-resource migration
and other unrelated maintenance tools are not migrated by this stage.

The offline pilot generated 13 unapproved rows from the 2026-11-15T18-38-21-763Z complete
21-collection export: Koci Instynkt (3), Stadne Wycie (3), Postawa Defensywna (6), Ostrość
Umysłu (1). It retains all original owned values and nonlinear stance numbers. Six rows
require named rule/withdrawal decisions; all thirteen require content/application approval
and an applicable engine fixture. The actual pilot plan returned `blocked` before database
access. Export-derived IDs and payloads remain ignored local artifacts, not versioned fixtures.

Verification: 100 tests passed in 10 selected files; 3 real MongoDB tests were skipped because
`DATA_CHANGE_TEST_DATABASE_URL` was not configured. Coverage includes whole-batch preflight,
mode/approval/schema coherence, parsed plugin defaults, local journal retry/recovery, guarded
rollback, CLI backup/argument boundaries and refusal of legacy writes. Memory-store tests do
not establish MongoDB transaction correctness. The opt-in real suite covers nullable JSON
restoration, whole-batch rollback and an external edit between transaction read/write.
Full and scoped TypeScript checks passed; scoped coverage now includes all data-quality modules.
No build, browser rerun, live import/apply or deployment ran for this boundary.

The base is the published previous candidate `a9fe532f2923c963f9a35ac22ecd133ebf886fa6`,
whose PR #112 merge was reported by the maintainer. GitHub fetch failed with DNS resolution
from this environment. Publication must replay only this stage onto freshly fetched remote
main. The shared profile remains `0a42eb8fcc6f86a592c259aa461a49875fda6637`; no shared guidance
changed. The Meta checkout remains outside this task's available read permissions.

## COMP-Q7 - Pilot engine characterization and owner decisions

Status: implementation candidate. The [owner-decision worksheet](data-quality-pilot-decisions.md)
records five family-level choices and the technical acceptance still required. The base is
PR #114's published head `de63fef7d01517dd86ff2a7857b4d18701d67428`; its merge is reported,
and the exact accepted remote main remains unavailable here.

Ten new characterization tests exercise the generated mode candidates against the real
engine. They preserve the six nonlinear defensive ranks and state +2 damage, show no
per-turn accumulation, verify independent slots and immutable snapshots, and expose timing,
stance-exit and direct-damage scope differences. The rulebook says round-start activation;
the existing simulator plan/engine uses pre/post-attack stance changes and own-turn mode
refresh. Deciding the current rule belongs to the game owner. These tests describe current
behavior and do not establish semantic acceptance or authorize a backfill.

Pilot generation now records unresolved decisions on all thirteen rows, rather than only
the previous six maneuver rows. It leaves content/application approval pending and semantic
engine verification `NOT_RUN`. The original COMP-Q6 counts/results above remain historical
evidence for that implementation; they are not new runs of this stage.

The disposable MongoDB launcher creates a uniquely named local replica-set container,
overrides inherited database URLs, rejects remote contexts and skipped test runs, and
checks ownership before cleanup. Seven orchestration tests cover successful routing,
test failure, skipped tests, Docker denial, remote engines and foreign ownership. The launcher does not
run the separate character-membership suite or modify application data.

Environment acceptance remains NOT_COMPLETED: Docker denied access to its Desktop Linux
engine before container creation. An isolated harness bundled the actual editor/sheet and
simulation hook/worker, but Chromium's navigation to the loopback server failed with
`ERR_NETWORK_ACCESS_DENIED`. No rendered desktop/mobile acceptance is claimed; COMP-Q3,
COMP-Q4 and COMP-Q5 retain their separate pending integration/browser gates.

Verification on Node 22.15.1 / Vitest 4.0.15: 84 tests passed in 11 selected files and
3 real MongoDB tests were skipped without a configured isolated database. The selected
suite covers the data-quality domain/application/persistence/infrastructure, new launcher
and existing stance/stance-change tests. Full and scoped TypeScript checks passed;
`node --check scripts/run-data-change-integration.mjs` and `git diff --check` passed.
No full application build, coverage run, live apply or deployment was performed. These
results belong to this task candidate and its installed dependencies; publication records
the resulting SHA separately and checks whether relevant inputs changed on transplantation.

### MongoDB null-restore regression found during owner acceptance

The maintainer executed the real suite on candidate
`da8a2a0ffbda1be40eed7879ba5a698fa9b0279f`, run
`4ffd9a47-a334-4c27-bddf-e77e8622056e`: two cases passed and the nullable-effects
rollback case failed. The receipt confirms its container was cleaned up. This supersedes
the initial environment-only status for that run, not the outstanding browser gate.

The adapter translated literal `null` into `Prisma.DbNull` and hid the incompatible value
behind a type assertion. MongoDB rejects that SQL null sentinel. The corrected adapter
passes the reviewed JSON patch directly, with a checked Prisma input type and no assertion.
See the [Prisma 6 JSON null contract](https://www.prisma.io/docs/orm/v6/prisma-client/special-fields-and-types/working-with-json-fields#using-null-values).
Restoring null, writing empty effects and omitting effects remain distinct operations.

The transaction-adapter regression now checks those three cases for Maneuver, Stance and
State. It failed against the former adapter before the fix. After the fix, the selected
suite again passed 84 tests (three real MongoDB cases skipped in this environment), and
full/scoped TypeScript checks passed. A new local Docker attempt was denied before creation;
real MongoDB acceptance of the corrected adapter still requires execution. Preserve the
earlier failing report rather than relabeling its two passing cases as a complete pass.
