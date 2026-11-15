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

Kolejność pracy: `classify-maneuvers` (propozycje) → ręczny przegląd CSV → `import-*-effects:apply` (zapis) → `copy-effects-across-grades` (rozlanie na rangi) → `maneuver-coverage` (kontrola postępu).

| Komenda | Co robi |
|---|---|
| `classify-maneuvers` | Tylko odczyt, offline (czyta `backup/<timestamp>/Maneuver.json`). Klasyfikuje manewry na poziomy symulowalności i eksportuje CSV do przeglądu przez człowieka. Analogiczne CSV dla postaw i stanów. |
| `import-maneuver-effects` / `:apply` | Wgrywa zatwierdzone efekty z CSV do manewrów. Dopasowanie po kluczu (nazwa, ranga); każdy payload walidowany schematem efektu. |
| `import-mode-effects` | To samo dla Postaw i Stanów. Wymaga argumentów pozycyjnych, więc uruchamiaj wprost: `npx tsx scripts/import-mode-effects.ts stance postawy-classification.csv --apply`. |
| `copy-effects-across-grades` / `:apply` | Kopiuje efekty z jednej rangi manewru na pozostałe **puste** rangi jako szkic — zostaje dostrojenie liczb zamiast pisania od zera. |
| `extract-contested-pools` | Tylko odczyt, offline. Wyciąga nazwy pul z manewrów na testy sporne, żeby potwierdzić mapowanie PL → pole postaci i wyłapać nazwy spoza tabeli. |
| `backfill-mana-to-essence` / `:apply` | Przepisuje zaszłość `resource: "mana"` w zapisanych efektach na `"essence"`. System zna wyłącznie Esencję. |


## Effect authoring validation

New effect writes from the compendium editor, its maneuver/stance/state APIs and the two
CSV importers use `effectsAuthoringSchema`. It rejects unknown fields recursively,
including nested effects, test pools and plugin data. Custom effects require an available
plugin validation schema. Legacy `mana` aliases remain readable but must be written as
`essence`. Importers persist the parsed output, including plugin defaults, and clear an
obsolete `unsupportedReason` when approving effects as simulatable.

Audit an existing `backup-mongodb` export without connecting to MongoDB:

```powershell
node --import ./scripts/ts-alias-hooks.mjs scripts/audit-effect-authoring.ts backup/2026-11-15T18-38-21-763Z
```

The JSON report contains collection counts and zero-based record indexes/issue paths.
It reads `Maneuver.json`, `Stance.json` and `State.json`, changes no files and returns
exit code 1 if validation fails. It checks structure, not agreement with prose or combat
balance. Use a fresh snapshot when assessing current database content.

CSV import approval, dry-run and explicit-apply boundaries still apply. The importers
retain their existing name/grade lookup and per-record writes; this change does not add
the planned ID/hash guarded, atomic change-set protocol or a rollback journal.
