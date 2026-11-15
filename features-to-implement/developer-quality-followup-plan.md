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
+
+Status: implementation candidate for CODE-01 and the character-input portion of CODE-02
+from the 2026-11-15 improvement review. Integration acceptance and PR review are pending.
+
+Batch reads now use the existing database visibility predicate. Statistics, talents,
+equipment, buffs and deletion require a validated API key and perform their access read
+and write in the same transaction. Details/combat repository methods require their
+existing access/membership guard; the unguarded fallback is removed. Public and legacy
+public characters retain the existing visibility policy. Hidden and missing characters
+produce the same 404; transaction conflicts remain 409. Submitted keys are not echoed
+in validation messages.
+
+The batch route validates nonempty string IDs and accepts at most 200 IDs per request.
+Legacy imported identifiers remain supported. Existing clients deduplicate and split
+larger selections into consecutive requests; a failed later batch rejects the entire
+client operation. The endpoint returns domain Characters, so its Combat Lab consumer
+no longer applies a second persistence mapping. Character creation uses the existing
+header schema before persistence. Existing successful response envelopes are preserved.
+
+Runtime validation for battle presets/saved simulations, strict effect authoring,
+simulation lifecycle, browse/UI work and content changes remain open. This candidate
+does not close COMP-Q1/COMP-Q2 or authorize a database backfill.
+
+Verification in the isolated task worktree uses existing installed dependencies and no
+application secrets. The selected 15-file suite passed 196 tests; 21 integration cases
+were skipped without a configured dedicated database. Full and scoped TypeScript checks
+pass. The integration suite includes four new cases for cross-key access, allowed writes,
+rollback and concurrent access revocation. It requires the isolated database described
+in [the character-scope plan](compendium-character-scope-plan.md); Docker access was denied
+in this environment, so those scenarios are NOT_RUN. Unit mocks do not prove MongoDB
+transaction behavior. Keep the candidate draft until that acceptance passes.
+
+Before merge: run the character access/membership integration suite against a disposable
+local replica-set database, confirm no unrelated main changes conflict, and review the
+PR. No merge or deployment is implied by the implementation candidate.
+