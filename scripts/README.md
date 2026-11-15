# Skrypty

Narzędzia jednorazowe: migracje danych, diagnostyka, raporty. Uruchamiane przez `npm run <nazwa>`.

## Zasady

1. **Przed każdym skryptem zapisującym: `npm run backup-mongodb`.** To jedyna kopia danych sprzed zmiany.
2. **Skrypty zapisujące domyślnie są dry runem.** Zapis wymaga osobnego wariantu `:apply`.
3. **Nie używaj `npm run <skrypt> -- --apply` w PowerShellu.** PowerShell zjada separator `--`, flaga nie dociera do skryptu i przebieg po cichu zostaje dry runem — zdarzyło się to już raz przy migracji wymagań. Zawsze wariant `:apply`.
4. Skrypty czytające pola **usunięte ze `schema.prisma`** (np. dawne `requirements`, `cost`) muszą używać `findRaw` / `$runCommandRaw` — wygenerowany klient Prismy takiego pola nie zna.

## Kopie zapasowe i diagnostyka

| Komenda | Co robi |
|---|---|
| `backup-mongodb` | Zrzut wszystkich kolekcji do `backup/<timestamp>/`. Katalog jest poza gitem. |
| `diag-requirements` | Stan wymagań w bazie: liczniki per kolekcja, docelowa baza, podgląd rekordu, `process.argv` (weryfikacja, czy flagi doszły). |
| `diag-apikeys` | Rozkład `apiKeys` na postaciach — kto co widzi. |
| `diag-duplicate-shortnames` | Kolizje `shortName` postaci. |
| `maneuver-coverage` | Raport pokrycia efektów: ile manewrów jest ZMAPOWANYCH, ile w KOLEJCE, ile NIESYMULOWALNYCH — per rekord i per unikalna nazwa. Tylko odczyt. |
| `verify-sheet-model` | Karta postaci do druku na realnych danych z `backup/`: składa `CharacterWithRelations`, przepuszcza przez `buildSheetModel` i liczy budżet stron. Bez argumentów — największa i typowa postać; `--all` — sweep po wszystkich z listą przekroczeń limitu 2 stron; fragment nazwy — konkretna postać. Nie dotyka bazy. |

## Generowanie postaci przez AI

| Komenda | Co robi |
|---|---|
| `dump-ai-context` | Zrzuca do `ai-workspace/context/` wszystko, czego potrzeba do przygotowania draftu poza aplikacją: reguły promptu, pełne kompendium, schemat propozycji, profile balansu, skale mocy i podręcznik. Bez bazy: `--from-backup=backup/<znacznik>`. |
| `verify-ai-draft` | Sprawdza `ai-workspace/drafts/draft.json` tymi samymi walidatorami, których użyje serwer — kontrakt Zod, walidacja akceptacji, wymagania, mechanika walki, odchylenie od profilu. Uwagi nie blokują, kod wyjścia 1 tylko gdy draft w ogóle się nie wczyta. |

Oba tylko do odczytu. Szczegóły przepływu: `ai-workspace/README.md`.

## Podręcznik

| Komenda | Co robi |
|---|---|
| `sync-rulebook` | Skleja `public/data/rulebook/rulebook-complete.json` z pięciu plików kategorii. **Uruchamiaj po każdej edycji kategorii** — pliku zbiorczego nie edytuje się ręcznie. Skrypt nie modyfikuje plików źródłowych. |

## Wymagania (Fale 5–8)

| Komenda | Co robi |
|---|---|
| `audit-legacy-requirements` | Tylko odczyt. Klasyfikuje teksty legacy na: osierocone / częściowe / zduplikowane / czyste. Bramka przed czyszczeniem. |
| `backfill-requirements` / `:apply` | Dopisuje `rankless` dla każdego niepokrytego tekstu legacy. Idempotentny, nie nadpisuje istniejących wpisów. |
| `auto-map-requirements` / `:apply` | Proponuje strukturę dla tekstów `rankless` (statystyka, encja, sprzęt…). Czyta wyłącznie `structuredRequirements`. |
| `clear-legacy-requirements` / `:apply` | Usuwa pole `requirements` z Mongo (`$unset`) — **tylko** dla rekordów w pełni pokrytych. Nieodwracalne. Wykonane 2026-08-02. |
| `extract-replaces` / `:apply` | Przenosi „Zastępuje X" z wymagań do pola `replaces`. Wykonane; reguła parsowania mieszka w `src/domain/characters/replaces.ts`. |
| `fix-mismapped-strength` / `:apply` | Usuwa dwa błędne wpisy `siła` (`Pogromienie`, `Napór Włóczniarza`), które zostały po ręcznej poprawce w panelu. Nie rusza rekordu, gdy siła jest tam jedynym wymaganiem. |
| `backfill-power-types` | Uzupełnia typy Mocy na postaciach. |
| `backfill-spell-costs` | Rozbija tekstowy koszt zaklęcia na pola strukturalne (`costBase`, `costScalingMode`…). |
| `backfill-character-api-keys` | Uzupełnia `apiKeys` na starych postaciach (puste = publiczna). |

## Combat Lab — autorstwo efektów

Current write path: prepare a review bundle → review each ID/rank → run an offline/live plan → take a complete backup → explicit guarded apply → retain the journal. Legacy CSV and cross-grade tools are previews; their `--apply` modes refuse writes.

| Komenda | Co robi |
|---|---|
| `classify-maneuvers` | Tylko odczyt, offline (czyta `backup/<timestamp>/Maneuver.json`). Klasyfikuje manewry na poziomy symulowalności i eksportuje CSV do przeglądu przez człowieka. Analogiczne CSV dla postaw i stanów. |
| `import-maneuver-effects` | Inspect CSV maneuver proposals using strict validation. Legacy `:apply`/`--apply` is refused; use the guarded review tool below. |
| `import-mode-effects` | Inspect stance/state CSV proposals. Positional arguments remain supported; `--apply` is refused. |
| `copy-effects-across-grades` | Preview per-rank drafts only. No automatic publication; `:apply`/`--apply` is refused. |
| `extract-contested-pools` | Tylko odczyt, offline. Wyciąga nazwy pul z manewrów na testy sporne, żeby potwierdzić mapowanie PL → pole postaci i wyłapać nazwy spoza tabeli. |
| `backfill-mana-to-essence` / `:apply` | Przepisuje zaszłość `resource: "mana"` w zapisanych efektach na `"essence"`. System zna wyłącznie Esencję. |


## Effect authoring validation

New effect writes from the compendium editor, its maneuver/stance/state APIs and the
reviewed change-set tool use `effectsAuthoringSchema`. CSV previews use the same parser. It rejects unknown fields recursively,
including nested effects, test pools and plugin data. Custom effects require an available
plugin validation schema. Legacy `mana` aliases remain readable but must be written as
`essence`. The guarded tool persists parsed output, including plugin defaults. A supported
mapping explicitly sets `simulatable: true` and clears `unsupportedReason`.

Audit an existing `backup-mongodb` export without connecting to MongoDB:

```powershell
node --import ./scripts/ts-alias-hooks.mjs scripts/audit-effect-authoring.ts backup/2026-11-15T18-38-21-763Z
```

The JSON report contains collection counts and zero-based record indexes/issue paths.
It reads `Maneuver.json`, `Stance.json` and `State.json`, changes no files and returns
exit code 1 if validation fails. It checks structure, not agreement with prose or combat
balance. Use a fresh snapshot when assessing current database content.

## Guarded content change sets

The maintained write path covers `description`, `effects`, `simulatable` and
`unsupportedReason` on Maneuver, Stance and State. Each bundle is one atomic batch of
1–20 reviewed records, capped at 1 MiB. These are initial operating limits, not a measured
throughput guarantee. No automatic splitting or retries occur. Larger work uses separate
reviewed batches and journals; there is no cross-batch transaction.

The versioned contract lives in `src/domain/data-quality/dataChangeSet.ts`. Targets use
immutable IDs; name/rank are assertions. The canonical old-content hash also includes
price, tags, requirements, replacements and cast/cooldown context. Character relations
are excluded. Object key order is irrelevant; array order and null remain significant.
Missing optional Prisma fields normalize to null. Rollback restores Prisma-visible values,
not raw BSON types or original field absence.

Prepare the 13-row pilot from a complete existing export; the command refuses to overwrite
an output file. Supply the exact code revision corresponding to the source review:

```powershell
node --import ./scripts/ts-alias-hooks.mjs scripts/prepare-data-review.ts --from-backup=backup/<snapshot> --source-revision=<40-character-SHA> --out=backup/review/pilot.json
```

The pilot covers all reviewed ranks of Koci Instynkt, Stadne Wycie, Postawa Defensywna and
Ostrość Umysłu. It preserves source prose and before values, nonlinear rank numbers and
explicit rule questions. No row is approved automatically. Content/application approvals,
an accepted rule reference, resolved blockers and passing checks are required. Mapping
also requires an engine fixture. Keep unresolved rows in the draft and move independently
reviewed ready rows into a separate batch. Review metadata records evidence; the tool cannot prove
that a human review occurred or execute those fixtures on the reviewer's behalf.

For a supported mapping, propose the complete effects, `simulatable: true` and
`unsupportedReason: null`. An approved unsupported withdrawal explicitly proposes empty
effects, `simulatable: false` and a precise reason. Editorial rows may change description
only. Never mark a partial self-only approximation as a complete group effect.

Default mode is plan. Use an offline export first; unresolved review questions fail before
any database access. Once the entire bundle is ready, the report shows exact before/after
values and hashes:

```powershell
node --import ./scripts/ts-alias-hooks.mjs scripts/data-change-set.ts --bundle=backup/review/pilot.json --from-backup=backup/<snapshot>
node --env-file-if-exists=.env --import ./scripts/ts-alias-hooks.mjs scripts/data-change-set.ts --bundle=backup/review/pilot.json
```

The second command reads the configured database. Load only the intended local environment;
connection strings are not command arguments or report fields. New npm aliases are
`prepare-data-review`, `data-change-set`, `data-change-set:apply` and
`data-change-set:rollback`. For path options in PowerShell, use the direct Node commands
here to avoid npm argument forwarding differences.

Before **either write direction**, run the required backup-mongodb export. The tool checks
the manifest, every current Prisma collection/file/count, its total, and every affected row's
required before/after values. A backup is not a substitute for a transaction-time live check.
Apply requires a reviewed immutable bundle and explicit `--apply`:

```powershell
node --env-file-if-exists=.env --import ./scripts/ts-alias-hooks.mjs scripts/data-change-set.ts --bundle=backup/review/pilot.json --apply --backup=backup/<fresh-before-snapshot> --journal=backup/data-change-journals
```

All rows are rechecked before any write within a Prisma 6 MongoDB interactive transaction.
Unknown IDs, stale context, failed assertions and mixed before/after states abort the batch.
Stored values are re-read and hashed before commit. MongoDB write conflicts propagate; the
tool never retries automatically. Transactions require a compatible replica set. The boundary follows the installed
[Prisma 6 transaction contract](https://www.prisma.io/docs/orm/v6/prisma-client/queries/transactions)
and [MongoDB write-conflict semantics](https://www.mongodb.com/docs/manual/core/transactions-production-consideration/); those references do not replace execution evidence.

The credential-free database identity and reviewed/parsed bundle hash select a journal
directory. A flushed intent contains the original bundle and parsed after values **before**
the transaction starts. Attempts, failures and completion receipts are retained; state-file
replacement follows commit. If commit or receipt outcome is uncertain, preserve everything
and re-run a plan. A retry against matching after values returns `already_applied` without
another write. A completed journal cannot silently reapply after its result has changed.

Preserve the same journal root, connection target and immutable bundle across retries and
rollback. Journals are local evidence, not server-wide idempotency across independent machines
or deleted/copied journal roots. `operation.lock` prevents overlapping operations on a local
journal. A crashed process leaves that lock: check that it has ended before manually removing
only that journal's lock file. Do not delete its intent, receipts or backup to make a run pass.

Rollback uses the original apply journal and a fresh snapshot of the after state:

```powershell
node --env-file-if-exists=.env --import ./scripts/ts-alias-hooks.mjs scripts/data-change-set.ts --bundle=backup/review/pilot.json --rollback --backup=backup/<fresh-after-snapshot> --journal=backup/data-change-journals
```

It restores only changed fields, atomically, when every current hash still matches this
batch's after state. Later edits cause a conflict. After rollback, this journal refuses a
new apply; prepare a new reviewed identity if needed. Keep the compatible reviewed schema/
engine source available for recovery. A backup directory alone is not a tested restore.

Real-database acceptance is opt-in and separate from memory-store tests. Use only a local
replica set whose database name starts with `cedrus_data_change_test`; the suite rejects
other hosts/databases. Set `DATA_CHANGE_TEST_DATABASE_URL` for that isolated database, then:

```powershell
node node_modules/vitest/vitest.mjs run src/persistence/data-quality/__tests__/dataChangeSet.integration.test.ts
```

The tests exercise nullable JSON restoration, whole-batch rollback and a concurrent external
edit between transaction read/write. Do not use a production connection. Real MongoDB
acceptance remains pending until this suite actually runs; the authored pilot remains a
review draft and has not been applied.
