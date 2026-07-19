# Plan implementacji: Combat Lab

Plan wykonawczy dla `features-to-implement/combat-simulator.md`, oparty o realny stan repo (zweryfikowane 2026-07-19). Zakres: pełna roadmapa v0.1 → v1.0.

## Ustalenia wstępne (różnice względem dokumentu źródłowego)

Dokument źródłowy opisuje Combat Lab jako osobną aplikację z własnym stackiem (ASP.NET 9, SQLite/PostgreSQL, encje relacyjne). Po przejrzeniu realnego repozytorium te założenia trzeba skorygować — nie budujemy drugiej aplikacji obok, tylko moduł wewnątrz istniejącej apki, reużywający dojrzałej domeny walki, która już istnieje.

- **Stack jest już ustalony i jest to TypeScript, nie .NET.** Repo to Next.js 16 / React 19 / TypeScript / Prisma na MongoDB (`prisma/schema.prisma`, `@prisma/client`), z UI na shadcn/ui + Radix, stanem w Redux Toolkit + React Query, formularzami React Hook Form + Zod, tabelami TanStack Table. Wszystkie technologie z sekcji "Frontend" dokumentu (poza React Flow, Recharts, Framer Motion) są już zainstalowane. **Nie wprowadzamy ASP.NET ani relacyjnej bazy** — Combat Engine i silnik symulacji piszemy w TS, jako czysta biblioteka domenowa (`src/domain`), tak samo jak istniejąca logika rzutów. Uzasadnienie: cała domena walki (statystyki, obrażenia, obrony, ekonomia akcji) jest już w TS i przetestowana w `vitest`; przepisanie jej do C# oznaczałoby utrzymywanie dwóch źródeł prawdy o tym samym systemie RPG.

- **Domena walki już istnieje — nie zaczynamy od zera.** W `src/domain/characters` jest komplet encji, które dokument wymienia jako "Encje" do zaprojektowania:
  - `Character.ts` — pełna karta postaci (charakterystyki, atrybuty, talenty, zdrowie, obrony, ataki, ekwipunek, postawy/stany, manewry, moce, perki, profile buffów),
  - `combat/Offense.ts` — model ofensywy z kośćmi broni (`kX`, gdzie X = `grade*2`), krytykami (`Critical { power, range }`), premią do obrażeń, oraz **gotową logiką rzutów**: `roll(grade)`, `calculateWeaponDamageRoll`, `handleWeaponDamageRolls`, `calculateCriticalDamage`,
  - `combat/Defense.ts` — obrona (`immunity`, `resistance`, `protection`, `block`, `parry`, `dodge`, `bonus`) z `calculateSelectedReduction` i trybami redukcji `full`/`block`/`direct`,
  - `combat/Health.ts` — zdrowie (`vitality`, `toughness`, `barrier`, `lethalHealth`, `lethalRounds`) z `calculateTotalHealthForCharacter`,
  - `combat/Power.ts` — moce i zaklęcia z własną ofensywą i kosztem (`SpellCost`),
  - `combat/Maneuver.ts` (= `Perk & Castable`), `Talent.ts`, `Perk.ts`, `equipment/*` (Weapon, Armor, Shield, Mount, Item),
  - `buffs/BuffProfile.ts` — bogaty, ustrukturyzowany model modyfikatorów statystyk (buffy/debuffy) z `applyBuffProfile`.

  To pokrywa większość listy "Encje" z dokumentu (Characters, Classes ≈ Race/Talent, Weapons, Armor, Maneuvers, Talents, Skills ≈ Power/Perk, Buffs, Debuffs ≈ BuffProfile). Brakuje tylko trzech: **Effects (ustrukturyzowane), Simulations, Results** — i to jest realny zakres nowej pracy nad danymi.

- **Ekonomia akcji ("AP") już istnieje — inaczej niż w dokumencie.** Dokument mówi o "AP" (action points). Realny system nie liczy punktów, tylko dopuszczalne kombinacje typów akcji przez czas rzucania. `Castable.ts` definiuje `CastTime` (`Pełnorundowa`/`Standardowa`/`Natychmiastowa`/`Nadnatychmiastowa`), pięć dopuszczalnych profili kombinacji na turę (`CASTABLE_COMBINATION_PROFILES`) oraz `canUseCastable(castable, usedCastables)` z obsługą cooldownów i "raz na turę". **Silnik symulacji musi używać tego modelu ekonomii akcji, a nie wprowadzać liczbowego AP.** "Economy Analyzer" z dokumentu (Damage/AP) tłumaczymy na Damage/akcję-w-turze wg tych profili. To istotna korekta — inaczej analizy ekonomii kłóciłyby się z rzeczywistymi zasadami systemu.

- **Rzuty są dziś niedeterministyczne — a dokument wymaga determinizmu.** `roll()` w `Offense.ts` woła `Math.random()`. Dokument w kilku miejscach ("Całość działa deterministycznie", "Combat Replay", "przewijanie tura po turze", "100 000 walk") wymaga **powtarzalności**: ten sam seed → ta sama walka. Dlatego pierwszym krokiem Combat Engine jest **wstrzykiwalny, seedowalny PRNG** (np. `mulberry32`/`xoshiro128`) zamiast `Math.random()`. Istniejące funkcje (`roll`, `calculateWeaponDamageRoll`) dostają wariant przyjmujący `Rng`, a stary podpis zostaje jako cienka nakładka na globalny RNG (kompatybilność wsteczna z `useCombatRolls`). Bez tego nie da się zrobić ani Replay, ani reprodukowalnych raportów balansu.

- **Istnieje już moduł bitwy — ale to tracker manualny, nie symulator.** `src/application/bestiary/battle/*` + `src/domain/battlePresets/*` to ręczny widok walki: inicjatywa, uczestnicy, duplikaty, presety zapisywane per klucz API (Redux + `sessionStorage`, encja `BattlePreset` w Prisma). Combat Lab to **osobny, zautomatyzowany** przepływ (silnik + tysiące walk bez UI walki). Reużywamy z tego modułu: kształt uczestnika, `createDuplicatedCharacter` (świeży snapshot z aktualnej postaci), oraz wzorzec presetów. **Nie reużywamy** widoku bitwy jako pętli symulacji — to inny cel (dokument wprost: "Nie jest to aplikacja do prowadzenia walki").

- **Persystencja: MongoDB + Prisma + `ulid()`, wzorzec repozytorium.** Wszystkie modele mają `id String @id @default(ulid()) @map("_id")`. Nowe encje (`Simulation`, `SimulationResult`, `ManeuverDefinition`/efekty) idą tym samym wzorcem: `src/domain/{feature}` (typy) + `src/persistence/{feature}/{feature}Repository.ts` (`'use server'`) + `{feature}Mapping.ts` + `{feature}Errors.ts`, dokładnie jak `battlePresets` i `characters`. **Nie** SQLite/Postgres z dokumentu.

- **Ciężkie obliczenia: Web Worker / Route Handler streaming, nie ASP.NET Background Service.** Dokument zakłada `Background Services` i `Parallel Processing` w .NET. Realny odpowiednik w tym stacku: pętla symulacji jako czysta funkcja TS, uruchamiana albo w **Web Workerze** (klient, nie blokuje UI, `postMessage` z progresem), albo w **Route Handlerze** Next.js z odpowiedzią strumieniową dla dużych partii. Determinizm silnika sprawia, że zrównoleglenie jest trywialne: dzielimy zakres seedów na N kawałków i scalamy wyniki.

---

## Docelowa architektura (osadzona w realnym kodzie)

Przepływ danych zgodny z diagramem z dokumentu, ale wyrażony w warstwach repo:

```
Character (domain)  ─┐
Weapon / Armor      ─┤
Talent / Perk       ─┼─►  CombatantSnapshot (domain/combat-lab)
Maneuver + Effects  ─┤        (znormalizowana, deterministyczna kopia karty)
BuffProfile         ─┘
                            ↓
                     Combat Engine  (domain/combat-lab/engine)   ← czysta funkcja + seedowalny Rng
                            ↓  CombatLog (turn-by-turn, serializowalny)
                     Simulation Engine (domain/combat-lab/simulation)  ← N walk po zakresie seedów
                            ↓  RawResults
                     Statistics Engine (domain/combat-lab/stats)  ← agregacje bez UI
                            ↓
                     Balance / Matchup / Economy / Combo / Synergy / Meta Analyzers
                            ↓
                     Persystencja (Simulation, SimulationResult)  +  UI (src/app/(combat-lab), src/application/combat-lab)
```

Zasady warstw (spójne z resztą repo):
- `src/domain/combat-lab/**` — **zero zależności od React/Next/Prisma**. Czysty TS, w pełni pokryty `vitest`. To jest "silnik jako biblioteka" z dokumentu.
- `src/persistence/combat-lab/**` — `'use server'` repozytoria + mapping Prisma ⇄ domena.
- `src/application/combat-lab/**` — komponenty i hooki UI (React Query do CRUD symulacji, Web Worker do liczenia).
- `src/app/(combat-lab)/**` — trasy (route group), zgodnie z konwencją `(bestiary)`, `(chracters)`, `(rulebook)`.
- `src/infrastructure/clients/combatLabClient.ts` — klient HTTP (axios/`baseClient`, nagłówek `x-api-key` doklejany automatycznie).

Autoryzacja i klucze API: bez zmian względem reszty apki — zapisy `/api/*` walidowane globalnie w `src/proxy.ts`, `GET` czyta `x-api-key` lokalnie (wzorzec `getValidatedApiKey`). Wyniki symulacji, jeśli prywatne, wiążemy z `apiKeyHash` (jak `PersonalizationProfileRecord`/`BattlePreset`), nie z kluczem jawnym.

---

## Kamień węgielny: data-driven model efektów (warunek wszystkiego innego)

Dokument stawia to jako osobną sekcję ("Model manewrów"), ale w praktyce jest to **fundament całego projektu** — bez niego silnik nie ma czego symulować, a analizatory nie mają co analizować. Dziś `Maneuver` = `Perk & Castable`, czyli tekstowy `description: string` + `requirements: string[]` + `castTime`/`cooldown`/`price`/`tags`. Silnik **nie potrafi** odczytać z tego mechaniki. Trzeba dołożyć maszynowo-czytelny opis efektów, zachowując istniejące pole tekstowe (opis dla gracza generowany z danych, jak w przykładzie YAML z dokumentu).

**Nowy plik:** `src/domain/combat-lab/effects/Effect.ts` — dyskryminowana unia efektów (dyskryminatorem jest `type`):

```ts
export type Effect =
  | DamageEffect      // { type: 'damage', damage: DamageSpec, damageType, canCrit }
  | HealEffect        // { type: 'heal', amount: DamageSpec }
  | StatusEffect      // { type: 'status', status: StatusId, duration, stacks? }  (bleeding, stagger, stun…)
  | BuffEffect        // { type: 'buff', profile: BuffProfileRef, duration }      ← reuse BuffProfile
  | DebuffEffect      // { type: 'debuff', profile: BuffProfileRef, duration }
  | MoveEffect        // { type: 'push' | 'pull', distance }
  | ControlEffect     // { type: 'control', control: 'stun'|'root'|'disarm', duration }
  | ChanceEffect      // { type: 'chance', chance: number, then: Effect[] }        ← np. stagger 35%
  | ResourceEffect;   // { type: 'resource', resource: 'ap'|'mana'|'essence', delta }

export type DamageSpec = { amount: number; grade: number; bonus: number; isPhantom?: boolean };
```

`DamageSpec` celowo ma ten sam kształt co `DamageOffense` z `Offense.ts`, żeby efekty obrażeń przechodziły przez **tę samą** funkcję rzutu (`calculateWeaponDamageRoll`/`handleDamageOffenseRolls`) — jedna droga liczenia obrażeń dla ataków broni i dla efektów manewrów.

**Nowy plik:** `src/domain/combat-lab/effects/ManeuverDefinition.ts` — rozszerza istniejący `Maneuver` o efekty i twarde wymagania (zamiast/obok tekstowych `requirements: string[]`):

```ts
export type ManeuverDefinition = Maneuver & {
  effects: Effect[];
  hardRequirements: MechanicalRequirement[];  // np. { kind: 'weapon', value: 'shield' }
  cost: ActionCost;                            // pochodne z castTime + ewentualny koszt zasobu
};
```

**Nowy plik:** `src/domain/combat-lab/effects/describeManeuver.ts` — generator opisu tekstowego z danych (`ManeuverDefinition → string`), realizujący "Opis dla gracza może być generowany automatycznie z danych". Testy porównują wygenerowany opis z ręcznym dla kilku manewrów wzorcowych (Shield Bash z dokumentu jako fixture).

**Nowy plik:** `src/domain/combat-lab/effects/effectSchema.ts` — schematy **Zod** dla `Effect`/`ManeuverDefinition` (Zod jest już w repo). Używane do: (a) walidacji importu YAML/JSON, (b) walidacji formularza w edytorze manewrów (React Hook Form + `@hookform/resolvers`), (c) Rules Validatora.

**Migracja danych:** istniejące manewry mają tylko opis tekstowy. Skrypt `scripts/backfill-maneuver-effects.ts` (wzorzec: istniejące `scripts/backfill-*.ts` uruchamiane przez `tsx`) tworzy puste `effects: []` dla starych rekordów; wypełnianie efektów to praca redakcyjna w edytorze (Etap 1c). Prisma: pole `effects Json?` na modelu `Maneuver` (typ `Json`, jak `configuration` w `BattlePreset` — bez ręcznego `JSON.stringify`).

> **Kolejność jest krytyczna:** ten model musi powstać i zostać przetestowany **przed** Combat Engine, bo silnik konsumuje `Effect[]`. Dlatego jest Etapem 0/1, a nie osobną sekcją "na koniec".

---

# Roadmapa wykonawcza

Numeracja wersji zgodna z dokumentem. Każdy etap: co budujemy, konkretne pliki, na czym się opiera, kryteria "gotowe".

## v0.1 — Fundament (Combat Engine, Character Builder, Simulation Engine, Combat Replay)

### Etap 0 — Determinizm i model efektów (prerekwizyt)

**Cel:** silnik da się reprodukować i ma czym karmić.

**Pliki:**
- `src/domain/combat-lab/rng/Rng.ts` — interfejs `Rng { next(): number; nextInt(maxExclusive): number }` + implementacja seedowalna (`createRng(seed: number)`, np. mulberry32). Testy: ten sam seed → identyczny ciąg.
- `src/domain/combat-lab/effects/*` — cały model efektów z sekcji "Kamień węgielny".
- Refaktor `src/domain/characters/combat/Offense.ts`: `roll(grade, rng?)`, `calculateWeaponDamageRoll(offense, rng?)` — gdy `rng` pominięty, używa globalnego (dziś. `Math.random`), więc `useCombatRolls.ts` działa bez zmian. Testy istniejące (`Offense.test.ts`) muszą przejść bez modyfikacji.

**Gotowe, gdy:** `vitest` zielony, seedowany rzut powtarzalny, `describeManeuver` odtwarza opis Shield Bash z fixtures.

### Etap 1 — Combat Engine (najważniejszy moduł)

**Cel:** deterministyczna, pozbawiona UI pętla walki 1v1 (i Nv N jako uogólnienie), zwracająca pełny, serializowalny log.

**Pliki (`src/domain/combat-lab/engine/`):**
- `CombatantSnapshot.ts` — znormalizowana, "spłaszczona" kopia postaci do walki (policzone HP z `calculateTotalHealthForCharacter`, aktywne obrony/ataki, dostępne manewry jako `ManeuverDefinition[]`, aktywne buffy przez `applyBuffProfile`). Budowany funkcją `toCombatantSnapshot(character, options)`. Reużywa `createDuplicatedCharacter` z `bestiary/battle/BattleCombatants.ts` jako źródło świeżego snapshotu.
- `CombatState.ts` — stan walki (uczestnicy, tura, runda, kolejka inicjatywy, aktywne statusy/cooldowny). Niemutowalny lub mutowany lokalnie w obrębie jednej symulacji (do decyzji — patrz Otwarte pytania).
- `resolveAttack.ts` — rozstrzygnięcie trafienia i obrażeń: rzut ataku vs. obrona (`calculateSelectedReduction` z `Defense.ts`, tryby `full`/`block`/`direct`), krytyk (`calculateCriticalDamage`), redukcja przez `protection`/`resistance`/`immunity`, odjęcie od HP/bariery. Cały rzut przez `Rng` z Etapu 0.
- `applyEffect.ts` — interpreter `Effect[]`: damage/heal/status/buff/debuff/push/control/chance/resource. Reużywa `applyBuffProfile` dla buff/debuff, `resolveAttack`/rzuty dla damage.
- `actionEconomy.ts` — cienki adapter na `Castable.canUseCastable`: co uczestnik może zrobić w tej turze (profile `CASTABLE_COMBINATION_PROFILES`, cooldowny). **Nie** duplikuje logiki — woła istniejącą.
- `initiative.ts` — kolejność tur z atrybutu `initiative` (istnieje w `Attributes`), remisy rozstrzygane deterministycznie przez `Rng`.
- `ai/policy.ts` — deterministyczna "polityka" wyboru akcji (bo dokument: "AI nie jest wymagane"). Interfejs `ActionPolicy { chooseAction(state, self): Action }` + implementacje: `greedyDamage` (max oczekiwane obrażenia/akcję), `lowestCastTime`, `scripted` (stała sekwencja). Wymienna, żeby badać wpływ strategii na balans (to zasila Meta Analyzer "dominujące strategie").
- `runCombat.ts` — pętla: inicjatywa → tury → akcje wg polityki → efekty → warunki końca (śmierć = HP≤0 lub `lethalHealth`/`lethalRounds`) → `CombatLog`. Gwarancja terminacji: twardy limit rund (konfigurowalny, domyślnie np. 100) → wynik "draw/timeout" (potrzebne przez Rules Validator: "nieskończone kombinacje").
- `CombatLog.ts` — serializowalny zapis tura-po-turze: inicjatywa, użyte manewry, rzuty (wartości kości), obrażenia, efekty, zmiany HP. To jest bezpośrednie źródło dla **Combat Replay**.

**Testy:** pełne `__tests__` — właściwości deterministyczne (ten sam seed+wejście → ten sam log), przypadki brzegowe (brak akcji, immunity=100%, timeout), złote logi (golden files) dla kilku znanych matchupów.

**Gotowe, gdy:** `runCombat(a, b, seed, policy)` zwraca identyczny `CombatLog` dla tego samego wejścia; log wystarcza do odtworzenia całej walki bez dostępu do RNG.

### Etap 2 — Simulation Engine

**Cel:** uruchomić tysiące/dziesiątki tysięcy walk i zebrać surowe wyniki.

**Pliki:**
- `src/domain/combat-lab/simulation/runSimulation.ts` — `runSimulation({ a, b, count, seedStart, policyA, policyB })` → iteruje seedy `seedStart..seedStart+count`, dla każdego `runCombat`, zbiera `RawResult` (zwycięzca, liczba rund, HP zwycięzcy, przyczyna śmierci, licznik użytych manewrów). Czysta funkcja — brak I/O.
- `src/domain/combat-lab/simulation/SimulationResult.ts` — typy `RawResult`, `SimulationSummary` (Win Rate, śr. długość walki, śr. HP, najczęstsza przyczyna śmierci, najczęstszy manewr — dokładnie lista z dokumentu).
- `src/application/combat-lab/worker/simulation.worker.ts` — Web Worker: odbiera zadanie, dzieli zakres seedów, liczy partiami, `postMessage` z progresem (zrównoleglenie przez determinizm — patrz architektura). Fallback: `runSimulation` synchronicznie po stronie serwera (Route Handler) dla headless/eksportu.
- `src/application/combat-lab/hooks/useSimulation.ts` — hook spinający worker + progres + anulowanie.

**Persystencja (opcjonalna na tym etapie, wymagana od v1.0):**
- Prisma: modele `Simulation` (parametry: idki postaci/snapshoty, count, seedStart, polityki, wersja zasad) i `SimulationResult` (`summary Json`, `createdAt`, `apiKeyHash?`).
- `src/persistence/combat-lab/simulationsRepository.ts` + mapping + errors (wzorzec `battlePresets`).
- `src/app/api/combat-lab/simulations/route.ts` (+ `[id]`).

**Gotowe, gdy:** 100 000 walk Knight vs Orc liczy się w tle bez zawieszania UI, z paskiem postępu, wynik zgadza się z sumą liczoną synchronicznie (determinizm).

### Etap 3 — Character Builder (w kontekście Lab)

**Cel:** wybór/parametryzacja combatantów do symulacji. Uwaga: pełny edytor postaci **już istnieje** (`src/app/(chracters)`, `src/application/characters`). W Lab nie budujemy drugiego edytora — dajemy **selektor** istniejących postaci + lekki "override" parametrów na czas symulacji.

**Pliki:**
- `src/application/combat-lab/builder/CombatantPicker.tsx` — wybór postaci z listy (reużycie `charactersClient`/istniejących zapytań), wybór aktywnej obrony/ataku/postawy, aktywnych profili buffów.
- `src/application/combat-lab/builder/ManeuverDefinitionEditor.tsx` — **Etap 1c z sekcji "Kamień węgielny"**: edytor efektów manewru (React Hook Form + `effectSchema` Zod), z podglądem auto-generowanego opisu (`describeManeuver`). To tutaj redakcyjnie uzupełnia się `effects` dla istniejących manewrów.

**Gotowe, gdy:** można złożyć parę combatantów z realnych postaci i odpalić symulację; manewry mają uzupełnione efekty.

### Etap 4 — Combat Replay

**Cel:** obejrzeć pojedynczą symulację tura po turze.

**Pliki:**
- `src/application/combat-lab/replay/CombatReplay.tsx` — odtwarzacz `CombatLog` z Etapu 1: oś tur, użyte manewry, rzuty, obrażenia, efekty, przewijanie (`Framer Motion` do animacji przejść). Bo log jest deterministyczny, replay nie liczy nic od nowa — tylko renderuje zapis.
- `src/app/(combat-lab)/combat-lab/replay/[simulationId]/page.tsx` — trasa.

**Gotowe, gdy:** dowolną walkę z zebranej partii można otworzyć i przewinąć krok po kroku; wartości zgadzają się z logiem.

**Kryterium wyjścia v0.1:** end-to-end — wybór 2 postaci → 10k walk w workerze → podsumowanie (Win Rate itd.) → otwarcie pojedynczej walki w Replay.

---

## v0.2 — Analiza podstawowa (Balance Analyzer, Matchup Analyzer, Statistics)

Wszystko poniżej to **czyste agregacje** nad `RawResult[]`/`CombatLog[]` — `src/domain/combat-lab/analysis/**`, bez UI, w pełni testowalne; UI to cienka warstwa `Recharts`/`TanStack Table`.

### Balance Analyzer
- `src/domain/combat-lab/analysis/balance.ts` — dla zestawu postaci liczy wymiary z dokumentu: obrażenia, przeżywalność, mobilność, kontrola, ekonomia akcji, utility → znormalizowany `PowerRating` + ranking. Wektory cech wyliczane z symulacji (a nie z deklaracji), żeby ranking odzwierciedlał realne wyniki.
- UI: `src/application/combat-lab/analysis/BalanceRankingTable.tsx` (TanStack Table) + radar (`Recharts`).

### Matchup Analyzer
- `src/domain/combat-lab/analysis/matchup.ts` — macierz N×N: dla każdej pary `runSimulation` → Win Rate. Zwraca `MatchupMatrix`.
- UI: `src/application/combat-lab/analysis/MatchupHeatmap.tsx` — heatmapa (Recharts lub własny grid + skala barw z tokenów theme). Dokument wprost prosi o heatmapę.

### Statistics
- `src/domain/combat-lab/analysis/distributions.ts` — rozkłady: Damage, Healing, AP/akcje, Critical Hits, Dodge Rate, Armor Efficiency, Average Turns, Win Rate (histogramy/agregaty).
- UI: `src/application/combat-lab/stats/StatisticsDashboard.tsx` — zestaw wykresów `Recharts`.

**Zależność:** wymaga, by Simulation Engine zapisywał wystarczająco szczegółowe `RawResult` (liczniki krytyków, uników, redukcji zbroi). Jeśli v0.1 zbierał minimalny zestaw — tu rozszerzamy `RawResult` i wersjonujemy format wyniku.

---

## v0.3 — Analiza zaawansowana (Combo Analyzer, Synergy Analyzer, Probability Explorer)

### Combo Analyzer
- `src/domain/combat-lab/analysis/combo.ts` — z `CombatLog[]` wydobywa **sekwencje** efektów/manewrów (np. Bleeding → Execution → Critical Bonus → Double Damage z dokumentu), liczy częstość i skuteczność (wpływ na wynik). Zwraca graf: węzły = efekty/manewry, krawędzie = następstwa z wagą.
- UI: `src/application/combat-lab/analysis/ComboGraph.tsx` — **React Flow** (z dokumentu) do wizualizacji grafu; lista "najczęstsze / najpotężniejsze / nieopłacalne kombinacje".

### Synergy Analyzer
- `src/domain/combat-lab/analysis/synergy.ts` — współdziałanie talentów/broni/manewrów/efektów: różnica w wyniku "z" vs "bez" danego elementu (marginal contribution / prosty ablation). Graf zależności.
- UI: współdzieli komponent grafu (React Flow) z Combo Analyzer.

### Probability Explorer
- `src/domain/combat-lab/analysis/probability.ts` — szybki, **analityczny** (bez pełnej symulacji) kalkulator: dla pojedynczej wymiany liczy szansę trafienia, rozkład obrażeń, oczekiwane AP-efficiency; dłuższe metryki (Win Rate, długość walki) przez szybką mini-symulację na zmianę.
- UI: `src/application/combat-lab/explorer/ProbabilityExplorer.tsx` — interaktywne suwaki; zmiana jednej wartości natychmiast przelicza (debounce, `use-debounce` już w repo). Dokument: "Zmiana jednej wartości natychmiast pokazuje wpływ".

---

## v0.4 — Środowisko projektowe (Scenario Builder, Rules Validator, Parameter Tuning)

### Scenario Builder
- `src/domain/combat-lab/scenario/Scenario.ts` — parametry sceny wpływające na balans: teren/rozmiar areny (dystanse — istotne dla push/pull i mobilności), walka grupowa (Nv N, boss z mnożnikiem HP), warunki startowe. Silnik z Etapu 1 przyjmuje `Scenario` jako wejście.
- Presety z dokumentu: Arena, Korytarz, Las, Walka grupowa, Boss, Oblężenie (jako dane, nie kod).
- UI: `src/application/combat-lab/scenario/ScenarioBuilder.tsx`.

### Rules Validator
- `src/domain/combat-lab/validation/rulesValidator.ts` — wykrywa: nieskończone kombinacje (walki kończące się timeoutem ponad próg → podejrzenie pętli), konflikty zasad (efekty wykluczające się), nieosiągalne warunki (`hardRequirements`, których żadna postać nie spełnia), zapętlone efekty (chance→then tworzące cykl), martwe mechaniki (manewry nigdy niewybierane przez żadną politykę). Część statyczna (na `ManeuverDefinition` + `effectSchema`), część dynamiczna (na logach symulacji).
- UI: `src/application/combat-lab/validation/RulesValidatorPanel.tsx` — lista ostrzeżeń z linkiem do źródła.

### Parameter Tuning
- `src/domain/combat-lab/tuning/parameters.ts` — warstwa nadpisań globalnych parametrów systemu (np. bazowa Siła 12→13) aplikowana do snapshotów przed symulacją, bez modyfikacji danych źródłowych. Po zmianie → przeliczenie Win Rate, Damage, Time To Kill, Power Rating.
- UI: `src/application/combat-lab/tuning/ParameterTuning.tsx` — suwaki + natychmiastowe przeliczenie (worker).

---

## v1.0 — Dojrzałość (Meta Analyzer, Raporty, Eksport PDF/CSV, Plugin System)

### Meta Analyzer
- `src/domain/combat-lab/analysis/meta.ts` — po dużej partii symulacji: najlepsze/najgorsze klasy i buildy, najczęstsze manewry, nigdy niewybierane talenty, dominujące strategie (agregacja po `policy` + wynikach). Zależny od pełnych logów v0.1–v0.3.
- UI: `src/application/combat-lab/meta/MetaDashboard.tsx`.

### Raporty i eksport
- **CSV:** biblioteka `xlsx` jest już w repo → `src/domain/combat-lab/export/toCsv.ts` (+ `toWorkbook.ts`). Eksport `RawResult[]`/podsumowań.
- **PDF:** zgodnie z konwencją repo do plików — **nie** dokładać ciężkiej zależności bez potrzeby; generować raport jako sekcję wyników i eksportować (render → PDF). Do decyzji przy realizacji, czy przez print-to-PDF trasy raportu, czy lekki generator. (Patrz Otwarte pytania.)
- `src/app/(combat-lab)/combat-lab/reports/**` — widok raportu gotowy do druku/eksportu.

### Plugin System
- Punkty rozszerzeń silnika: rejestr typów `Effect`, rejestr `ActionPolicy`, rejestr `Scenario`. Interfejs `CombatLabPlugin { effects?, policies?, scenarios?, analyzers? }` ładowany deklaratywnie. Trzymać wąsko — to najbardziej spekulatywny element; MVP = rejestry z Etapu 1 wystawione publicznie, bez dynamicznego ładowania kodu z zewnątrz.

---

## Layout i nawigacja (przekrojowo)

Dokument podaje layout Toolbar / Sidebar / Main / Status Bar z pozycjami Dashboard, Characters, Maneuvers, Talents, Simulations, Balance, Matchups, Statistics, Graphs, Settings. Realizacja jako route group `src/app/(combat-lab)/combat-lab/` z podstronami odpowiadającymi modułom, reużywając istniejących komponentów `sidebar`/nawigacji z `src/common/components` (spójnie z `(bestiary)`/`(rulebook)`). Wpięcie do głównej nawigacji apki jak pozostałych sekcji.

---

## Kolejność realizacji i zależności (podsumowanie)

```
Etap 0 (RNG + Effect model)
   └─► Etap 1 (Combat Engine)
          ├─► Etap 2 (Simulation Engine) ─► Etap 3/4 (Builder-picker, Replay)   [v0.1]
          └─► v0.2 (Balance/Matchup/Statistics)  ← agregacje nad wynikami Etapu 2
                 └─► v0.3 (Combo/Synergy/Probability)  ← wymaga bogatszych logów
                        └─► v0.4 (Scenario/Rules/Tuning)  ← Scenario wpina się do Etapu 1
                               └─► v1.0 (Meta/Raporty/Eksport/Plugin)
```

Twarde zależności: (1) **nic** nie ruszy bez Etapu 0; (2) każdy analizator zależy od formatu `RawResult`/`CombatLog` — dlatego wersjonujemy te struktury od początku (`schemaVersion`), by późniejsze rozszerzenia nie unieważniały zapisanych wyników.

---

## Otwarte pytania (do potwierdzenia przed startem)

1. **Współistnienie z modułem `bestiary/battle`.** Czy Combat Lab ma pozostać w pełni odrębny, czy docelowo zasilać manualny tracker (np. import wyniku/statystyk)? Dokument sugeruje odrębność ("Nie jest to aplikacja do prowadzenia walki"), ale "Możliwe rozszerzenia" wspominają import postaci.
2. **Stan `CombatState`: niemutowalny vs. mutowany lokalnie.** Niemutowalny = łatwiejszy debug i replay, ale wolniejszy przy 100k walk. Mutowany lokalnie w obrębie jednej symulacji + serializacja tylko logu = szybszy. Rekomendacja: mutacja lokalna, log jako jedyny trwały artefakt.
3. **Format modeli manewrów: YAML czy JSON w bazie?** Dokument pokazuje YAML jako *ilustrację*. W bazie i tak `Json` (Prisma). YAML sensowny tylko jako format importu/eksportu redakcyjnego. Potwierdzić, czy potrzebny import z YAML na starcie.
4. **PDF — którą drogą?** Print-to-PDF trasy raportu (zero zależności) vs. dedykowany generator. Rekomendacja: zacząć od print-to-PDF, dodać generator tylko jeśli wymagane jest headless.
5. **Zakres polityk AI w v0.1.** Ile polityk potrzeba na start, by wyniki balansu były wiarygodne? Rekomendacja: `greedyDamage` + `scripted` na v0.1; reszta w v0.3 (bo Meta/Combo bez zróżnicowanych polityk są mało wartościowe).
6. **Prywatność wyników.** Czy `Simulation`/`SimulationResult` mają być per-`apiKeyHash` (jak presety), czy publiczne/współdzielone? Wpływa na model danych i endpointy.

---

## Czego NIE robimy (świadome odcięcia względem dokumentu)

- **Nie** wprowadzamy ASP.NET, SQLite ani PostgreSQL — cały silnik i persystencja zostają w istniejącym stacku (TS + Prisma/Mongo).
- **Nie** budujemy drugiego edytora postaci — Lab reużywa istniejący (`(chracters)`), dokładając tylko selektor + edytor efektów manewru.
- **Nie** wprowadzamy liczbowego "AP" — używamy istniejącego modelu ekonomii akcji (`Castable`/profile czasu rzucania).
- **Nie** duplikujemy logiki rzutów/obrażeń/obron — silnik woła istniejące funkcje z `combat/Offense.ts` i `combat/Defense.ts`, dokładając tylko seedowalny `Rng`.

