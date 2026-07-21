# Combat Lab — STATUS implementacji

Zwięzły, autorytatywny stan całego symulatora walki. Szczegóły decyzji projektowych: `combat-simulator-implementation-plan.md` (plan + dziennik postępu). Dokument źródłowy: `combat-simulator.md`. Plan pluginów: `combat-lab-plugin-system-plan.md`.

**Stan:** cała roadmapa **v0.1 → v1.0 zrealizowana.** Rdzeń to czysta, deterministyczna domena TS (bez ASP.NET/relacyjnej bazy z pierwotnego dokumentu), reużywająca istniejącej domeny walki (`src/domain/characters`). Reguły oparte na podręczniku (`/rulebook`, `public/data/rulebook/*`).

---

## Roadmapa — status

| Wersja | Moduł | Status |
|---|---|---|
| v0.1 | Combat Engine (silnik walki, deterministyczny) | ✅ |
| v0.1 | Simulation Engine (tysiące walk, worker) | ✅ |
| v0.1 | Character Builder / CombatantPicker (+ wzmocnienia per symulacja) | ✅ |
| v0.1 | Combat Replay (odtwarzanie tura-po-turze) | ✅ |
| v0.1 | Persystencja `Simulation` + zapisane biegi | ✅ |
| v0.2 | Balance Analyzer (radar + ranking) | ✅ |
| v0.2 | Matchup Analyzer (heatmapa N×N) | ✅ |
| v0.2 | Statistics (histogramy, recharts) | ✅ |
| v0.3 | Combo Analyzer (graf, React Flow) | ✅ |
| v0.3 | Synergy Analyzer (ablacja manewrów) | ✅ |
| v0.3 | Probability Explorer (kalkulator wymiany) | ✅ |
| v0.4 | Scenario Builder (presety środowisk) | ✅ |
| v0.4 | Rules Validator (statyczna walidacja manewrów) | ✅ |
| v0.4 | Parameter Tuning (globalne Δ + porównanie) | ✅ |
| v1.0 | Meta Analyzer (round-robin, ranking buildów) | ✅ |
| v1.0 | Eksport CSV | ✅ |
| v1.0 | Raporty + eksport PDF (print-to-PDF) | ✅ |
| v1.0 | Plugin System (statyczne rejestry, MVP) | ✅ |

---

## Inwentarz plików

**Domena** (`src/domain/combat-lab/`, ~64 pliki, 20 z testami):
- `rng/` — seedowalny RNG (mulberry32).
- `effects/` — model efektów (`Effect` z `CustomEffect`), schemat Zod, `describeManeuver`, `ManeuverDefinition`.
- `engine/` — `CombatantSnapshot`, `rollOffense`, `damage`, `resolveAttack`, `resolveRangedAttack`, `applyEffect`, `actionEconomy`, `buffs`, `CombatState`, `runCombat`, `CombatLog`, `ai/` (polityki + wycena + oczekiwane obrażenia).
- `simulation/` — `runSimulation`, `summarizeCombat`, `aggregateResults`, `RawResult`.
- `replay/` — `buildReplayFrames`, `describeEvent`.
- `analysis/` — `matchup`, `balance`, `distributions`, `combo`, `synergy`, `probability`, `meta`.
- `scenario/`, `tuning/`, `validation/`, `export/`, `i18n/`, `persistence/` (`SavedSimulation`, `reproduceFight`), `plugins/` (rejestr + typy + loadPlugins + plugin referencyjny).

**Warstwa aplikacji** (`src/application/combat-lab/`, ~50 plików):
- 7 workerów: `simulation`, `matchup`, `synergy`, `combo`, `tuning`, `scenario`, `meta`.
- 10 hooków: `useSimulation`, `useMatchup`, `useSynergy`, `useCombo`, `useMeta`, `useScenario`, `useTuning`, `useCharacterById`, `useCharactersByIds`, `useSavedSimulations`.
- Panele: builder (picker), runner, replay, analysis (7), scenario, tuning, validation, report, plugins (rejestr analizatorów), export.

**Trasy / API / persystencja:**
- `src/app/(combat-lab)/combat-lab/` — `page.tsx` (11 zakładek), `replay/`, `report/[id]/`.
- `src/app/api/combat-lab/simulations/` — `route.ts` + `[id]`.
- `src/persistence/combat-lab/` — repozytorium + mapping + errors (model Prisma `Simulation`).
- Nawigacja: karta „Combat Lab" na stronie głównej (`src/app/page.tsx`).

**Zależności dodane:** `recharts` (wykresy/radar/histogramy), `@xyflow/react` (graf combo). Reszta reużywa istniejącego stacku.

---

## Świadome ograniczenia (future, nie bugi)

- **Silnik 1v1** — walka grupowa / NvN (Scenario „Oblężenie") przybliżona parametrami; pełne NvN wymaga silnika wielopostaciowego.
- **Redukcja jako malejąca pula per runda** + odporność na 6 źródeł — istotne dopiero przy wielu źródłach (walka grupowa).
- **Test trafienia** modelowany dla dystansu; zwarcie bez testu (zgodnie z podręcznikiem).
- **Statystyki per-event** (krytyki/uniki/armor efficiency) wymagają wzbogacenia `RawResult` o liczniki.
- **Reguły dynamiczne** w Rules Validator (nieskończone combo z tras) — na razie tylko statyczne.
- **Plugin System (MVP)** — statyczne rejestry w repo; dynamiczne/zewnętrzne pluginy (sandboxing) oraz rozszerzalne kategorie obrażeń/statusy poza MVP.
- **Kategorie obrażeń / statusy** — zamknięte (5 kategorii z podręcznika); redukcja na obrażenia krytyczne do dodania.

---

## Jak zweryfikować

```
npm test -- src/domain/combat-lab      # testy jednostkowe (deterministyczne)
npm run build                          # pełny typecheck + build Next
npm run dev                            # → /combat-lab (11 zakładek), /combat-lab/replay
```

Testy `vitest` są napisane dla całej domeny; nie były uruchamiane w środowisku roboczym (niezgodność binariów rollup/esbuild Windows/Linux) — uruchom lokalnie. Typecheck przechodził na czysto dla wszystkich modułów.
