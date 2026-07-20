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

# Reguły walki z podręcznika (ŹRÓDŁO PRAWDY)

Pełny podręcznik systemu jest przechowywany statycznie w repo i serwowany pod `/rulebook`:
- `public/data/rulebook/system-walki.json` — mechanika walki, obrażenia, krytyki, **Defensywa** (Niewrażliwość, Odporność, Redukcja, Parowanie, Uniki, Blokowanie), manewry, postawy, stany;
- `public/data/rulebook/zdrowie-i-regeneracja.json` — Zdrowie, Bariera, Żywotność, Twardość, **Przeżywalność**, **Determinacja**, leczenie, urazy;
- ładowany serwerowo przez `src/persistence/rulebook/rulebookLoader.ts` (`loadRulebookData`, `loadCategorySections('system-walki')`).

**To jest kanoniczne źródło reguł silnika.** Poniższe zastępuje wcześniejsze "założenia do potwierdzenia" — reguły zostały wyciągnięte z podręcznika i silnik MUSI je odwzorować dokładnie. Combat Lab może też czytać podręcznik statycznie (przez `rulebookLoader`), np. by zasilać domyślne parametry Parameter Tuning albo walidować w Rules Validator.

### Kolejność rozliczania obrażeń (kanoniczna)

Dla pojedynczego źródła obrażeń:

```
rzut ataku (kości broni + kości obrażeń, z krytykami)
   ↓  (przy ataku bronią) Niewrażliwość: atakujący usuwa N kości
Odporność (odejmowana NAJPIERW, per źródło, do 6 źródeł/rundę)
   ↓  nadmiar
Redukcja (uporządkowana pula: uniki/parowanie → blok → pancerz → magia → unikatowa)
   ↓  nadmiar
Bariera (pochłania przed zdrowiem)
   ↓  nadmiar
Zdrowie
```

### Niewrażliwość (`immunity`) — to NIE procent

"Niewrażliwość określa o ile mniej kości, z wyłączeniem kości widmowych, będzie stosował przeciwnik w każdym ataku. Przeciwnik sam wybiera, która kość jest redukowana." Czyli `immunity = N` → atakujący **usuwa N kości** (niewidmowych, `isPhantom=false`) z każdego ataku. Racjonalny atakujący usuwa kości o najmniejszej wartości oczekiwanej (najmniejszy `grade`). Działa przeciwko dowolnej liczbie przeciwników. **Korekta silnika:** dotychczasowy model (procentowy mnożnik) jest błędny — niewrażliwość realizujemy przy składaniu ataku (`rollOffense`/`resolveAttack`), nie w `reduceDamage`.

### Odporność (`resistance`) — odejmowana najpierw, per źródło

"Odporność jest to wartość, od której w pierwszej kolejności odejmowane są obrażenia jakiegokolwiek rodzaju poza obrażeniami śmiertelnymi i nieuchronnymi. Dopiero nadmiar przechodzi na redukcję. W każdej rundzie odporność jest odejmowana od obrażeń pierwszych 6 źródeł." Czyli odporność to płaska absorpcja **przed** redukcją, stosowana per źródło (do 6/rundę). **Korekta silnika:** odejmować odporność **przed** redukcją (dziś jest po). Nie dotyczy obrażeń śmiertelnych/nieuchronnych.

### Redukcja (`block`/`parry`/`dodge`/`protection`/`bonus`) — pula z kolejnością

"Całkowita redukcja = redukcja ze zbroi + z blokowania + z parowania + z uników + ze źródeł magicznych + unikatowa." Kolejność odejmowania: (1) uniki lub parowanie, (2) drugie z nich, (3) blok, (4) zbroja, (5) magia, (6) unikatowa. Podzbiory zależne od typu obrażeń:
- **Redukcja blokowalna** = zbroja + blok + magia + unikatowa (bez parowania i uników),
- **Redukcja bezpośrednia** = zbroja + magia + unikatowa (bez parowania, uników, bloku).

To **dokładnie** odpowiada istniejącemu `calculateSelectedReduction(defense, mode)` z trybami `full`/`block`/`direct` — mapowanie: `protection`=zbroja, `bonus`=magia/unikatowa, `block`/`parry`/`dodge` wprost. Silnik używa tej funkcji poprawnie; typ obrażeń wybiera tryb (bezpośrednie→`direct`, blokowalne→`block`, zwykłe→`full`).
- **Niedomiar redukcji przechodzi na kolejne źródła w tej samej rundzie** (pula malejąca). W 1v1 z jednym atakiem/turę bez znaczenia, ale przy wielu źródłach (druga broń, DoT, walka grupowa) trzeba to modelować. **Do zrobienia:** redukcja jako malejąca pula per runda (dziś: redukcja per atak, niepomniejszana — udokumentowane uproszczenie).

### Typy obrażeń = kategorie redukcji (nie żywioły)

Oś obrażeń, która steruje redukcją, to kategorie z podręcznika, a **nie** żywioły. System nie ma odporności „na ogień" itp. (atak ogniem to po prostu atak blokowalny). `DamageType` w silniku został przemapowany na:

- **zwyczajne** → pełna redukcja (`full`) — atak w zwarciu. Trafia zawsze (brak testu trafienia); uniki/parowanie to redukcja, nie szansa na pudło.
- **blokowane** → redukcja blokowalna (`block` = zbroja + blok + magia + unikatowa; bez uników/parowania) — magia dystansowa, ataki które można blokować, ale nie unikać.
- **bezpośrednie** → redukcja bezpośrednia (`direct` = zbroja + magia + unikatowa; bez uników/parowania/bloku) — trafiłyby cel stojący bez ruchu i bez tarczy (np. strzały).
- **śmiertelne** → omija odporność, redukcję **i barierę** (np. trucizna).
- **nieuchronne** → omija odporność i redukcję (bariera nadal działa).

`damageType` bezpośrednio wybiera tryb redukcji — usunęło to wymyślony wcześniej `reductionMode` w konfiguracji.

### Ataki dystansowe (test trafienia)

W przeciwieństwie do zwarcia, ataki z łuku/kuszy mają **test trafienia**: precyzja przeciw `max(refleks, ST odległości)`; tarcza dodaje refleks broniącemu; po trafieniu cel dostaje obrażenia **bezpośrednie**. Silnik dziś modeluje tylko zwarcie — test trafienia dla dystansu jest do dodania (v0.3+/Scenario).

### Inicjatywa — zasób zmienny (odłożone)

Inicjatywa jest ustalana na początku, ale **zmienia się** w trakcie (manewry, postawy, konkretne stany), co potrafi odwrócić kolejność; spadek poniżej 0 = obalenie. Silnik dziś rzuca inicjatywę raz i sortuje. Dynamiczna inicjatywa → **Scenario Builder (v0.4)**.

### Odporność vs. redukcja + wiele źródeł

W walce 1v1 odporność i redukcja są liczone tak samo (obie to płaskie odjęcie od jednego źródła — silnik: odporność, potem redukcja). Różnica ujawnia się przy wielu źródłach: **redukcja jest „zużywalna" w rundzie** (niedomiar zostaje na kolejne źródła), a **odporność nie** (działa na maks. 6 źródeł/rundę). Walka dwoma brońmi to **jedno źródło** (leading + secondary + bonusy liczone łącznie jako jeden atak — silnik już tak robi w `rollOffense`), więc pula nie ma tu znaczenia. Pełna pula → v0.4 (walka grupowa).

### Krytyki

"Trafienie krytyczne występuje gdy na kości broni wypadnie oczko równe maksymalnej wartości minus szansa trafienia krytycznego" → `roll >= grade*2 - critChance`, dodaje `critPower`. Bazowo `critChance=0`, `critPower=1`. To **dokładnie** istniejące `calculateCriticalDamage(offense, roll)` (`offense.critical.range`=szansa, `offense.critical.power`=siła). Silnik już to stosuje przez `handleWeaponDamageRolls`. Dodatkowo: **redukcja na obrażenia krytyczne** neguje tylko obrażenia z krytyka — do dodania jako osobne pole/efekt.

### Zdrowie, Bariera, Przeżywalność, Determinacja

- **Bariera** pochłania obrażenia przed Punktami Zdrowia (silnik: `dealDamage` już to robi). Wyjątek: obrażenia śmiertelne (np. trucizna) omijają barierę.
- **Przeżywalność** (`lethalHealth`, PL "przeżywalność") = ile obrażeń **poniżej zera** postać może przyjąć wciąż walcząc.
- **Determinacja** (`lethalRounds`, PL "determinacja") = ile rund postać może walczyć ze zdrowiem między 0 a −przeżywalność; po przekroczeniu pada.
- Poniżej 0 (do −Poziom Leczenia) postać domyślnie pada nieprzytomna; dopiero zdolności pozwalają walczyć dalej aż do progu przeżywalności. **Model śmierci w `runCombat` jest z tym zgodny** (`isDead`: martwy gdy `hp ≤ -lethalHealth`, lub `lethalRounds ≤ 0`, lub `roundsDowned ≥ lethalRounds`; downed pomija turę). Zgodne — bez zmian.

### Obrażenia śmiertelne / nieuchronne

Omijają odporność (i zwykłą redukcję/barierę wg typu). W modelu efektów odpowiada im `damageType: "true"` (nieuchronne) — a osobno trzeba dodać kategorię **śmiertelnych** (`śmiertelne`), które omijają barierę i odporność, ale mogą podlegać innym regułom. **Do dodania** do `DamageType`.

---

# Terminologia i tłumaczenia (PL)

Repo trzyma **identyfikatory w kodzie po angielsku**, a wyświetlanie tłumaczy przez moduł `@/common/translations` (`displayedText`, oparty na `translations.pl-PL.ts` / `.de-DE` / `.fr-FR`, przełączane `NEXT_LANGUAGE`). Przykłady istniejących kluczy: `immunity`→"niewrażliwość", `resistance`→"odporność", `lethalHealth`→"przeżywalność", `lethalRounds`→"determinacja", `parry`→"parowanie", `dodge`→"unikanie".

**Zasada dla Combat Lab:**
- Identyfikatory domenowe (`StatusId`, `DamageType`, `ControlKind`, `deathCause`, itd.) zostają po angielsku — spójnie z resztą kodu (`block`, `parry`, `immunity`…).
- **Każdy tekst widoczny dla użytkownika idzie przez `displayedText`**, nie przez surowe identyfikatory. Dodajemy klucze combat-lab (statusy: `krwawienie`/`zatrucie`/`podpalenie`/`oszołomienie`/`ogłuszenie`…, typy obrażeń: `fizyczne`/`ogień`/`zimno`…, przyczyny śmierci) do `translations.pl-PL.ts` (+ pozostałych locale) i do `displayedText`.
- `describeManeuver` i `describeEvent` (Replay) renderują po polsku; docelowo etykiety statusów/typów pobierają z `displayedText`, a nie zaszyte na sztywno.

---

# Postęp realizacji (stan na 2026-07-19)

Zaimplementowane i przechodzące `tsc` (testy `vitest` napisane; nie uruchomione w sandboxie — niezgodność binariów rollup Windows/Linux):
- **Etap 0** ✅ — `combat-lab/rng/Rng.ts` (seedowalny mulberry32), wstrzyknięcie `RandomSource` do `Offense.ts`, model efektów (`Effect`, `ManeuverDefinition`, `effectSchema` Zod, `describeManeuver`).
- **Etap 1** ✅ — `combat-lab/engine/*`: `CombatantSnapshot`, `rollOffense`, `damage`, `resolveAttack`, `applyEffect`, `actionEconomy` (adapter na `canUseCastable`), `ai/policy` (greedy/scripted/basic), `CombatState`, `runCombat`, `CombatLog`.
- **Etap 2** ✅ — `combat-lab/simulation/*`: `summarizeCombat`, `runSimulation`, `aggregateResults`, `splitSeedRange` + warstwa aplikacji: Web Worker, `useSimulation`.
- **Etap 4 (Replay)** ✅ — `combat-lab/replay/*` (`buildReplayFrames`, `describeEvent`) + `CombatReplay.tsx` + demo + trasa `/combat-lab/replay`.

**Korekty wg podręcznika — wykonane:**
- ✅ `damage.ts`: odporność **przed** redukcją; usunięty procentowy model niewrażliwości.
- ✅ Niewrażliwość jako **usuwanie kości** (`applyImmunity` w `rollOffense`, wpięte w `resolveAttack`); wybór po stronie atakującego (usuwa kości o najmniejszej randze), kości widmowe pominięte.
- ✅ `DamageType` przemapowany na kategorie `zwyczajne`/`blokowane`/`bezpośrednie`/`śmiertelne`/`nieuchronne`; kategoria wybiera tryb redukcji; śmiertelne omija barierę.
- ✅ **Oszołomienie** wpięte: brak manewrów (`actionEconomy`), −1 kość ataku i połowa gard (blok/parowanie/uniki) w `resolveAttack`/`applyEffect` (`halveGuards`, `isStaggered`).
- ✅ Etykiety PL scentralizowane (`combat-lab/i18n/labels.ts`) i użyte w opisach/Replay.

**Dodane po v0.1:**
- ✅ **Test trafienia dla ataków dystansowych** (`resolveRangedAttack`): precyzja vs `max(refleks, ST odległości)`; trafienie → obrażenia **bezpośrednie** (fizyczne) lub **blokowane** (magiczne). Snapshot ma `precision`/`reflex`/`attackKind`; akcja `ranged`, event `rangedAttack` w logu/Replay, `DISTANCE_ST` z tabeli podręcznika. Test trafienia tylko dla dystansu — zwarcie bez zmian.
- ✅ **Persystencja `Simulation`** (`prisma/schema.prisma` model `Simulation`; `src/persistence/combat-lab/*`; `src/app/api/combat-lab/simulations/*`; `combatLabClient`). Jeden dokument = konfiguracja („Simulation") + wynik („SimulationResult"). **Logów nie zapisujemy** — dzięki determinizmowi `reproduceFight(configuration, seed)` odtwarza dowolną walkę z zapisanego biegu (Replay ładuje realne walki). Wymaga u Ciebie: `npx prisma generate` + `npx prisma db push` (w sandboxie zablokowane pobieranie silnika Prisma).

**Korekty wg podręcznika — do zrobienia:**
- Redukcja jako **malejąca pula per runda** (wiele źródeł) + odporność na maks. 6 źródeł — istotne dopiero przy walce grupowej (v0.4).
- Redukcja na obrażenia krytyczne (osobne pole/efekt).
- Test trafienia dla ataków **dystansowych** (precyzja vs refleks/ST).
- Docelowo etykiety PL przez wspólny `displayedText` (dziś osobny moduł `i18n/labels.ts`).

**Wzmocnienia per symulacja (punkt z rozmowy).** Modyfikatory ataku (wyszkolenie z broni, style, pozycja) są zwykle już wliczone w statystyki postaci; część pochodzi z atutów/broni. Snapshot bierze aktywne `BuffProfile` z postaci (`applyActiveBuffProfile`) — do dodania: możliwość **ustawiania wzmocnień z poziomu symulacji** (nadpisanie aktywnych profili buffów / dołożenie tymczasowych), analogicznie do istniejącego mechanizmu buffów. To część Etapu 3 (CombatantPicker/override).

Pozostaje do domknięcia v0.1: **CombatantPicker** (realne postacie + wzmocnienia per symulacja) i **persystencja** `Simulation`/`SimulationResult`.

## Notatki na później (TODO)

- ✅ **BUG naprawiony — atak niezależny od manewrów (fix #2).** Realna ekonomia tury: osobno (1) akcja **ataku**, (2) akcja **ruchu**, oraz (3) **manewry** o łącznym koszcie pełnorundowym (np. standardowy + natychmiastowy). Wcześniej atak był modelowany jako castable „Standardowa" konkurujący z manewrami przez `canUseCastable`, więc zajmował slot standardowy i blokował standardowe manewry → mniej obrażeń/turę → timeouty. Teraz: atak jest **gwarantowany raz na turę** przez flagę `attackedThisTurn` (`CombatState`), **nie** trafia do `usedCastables`, więc manewry rozliczane są niezależnie przez `canUseCastable` — combatant może w jednej turze i zaatakować, i wydać pełny budżet manewrów. (`actionEconomy.ts`, `CombatState.ts`; testy „action economy — attack independent of maneuvers".) **Ruch** jako trzecia niezależna pula wciąż do dodania (dopiero przy pozycjonowaniu / Scenario Builder).
- ✅ **Nawigacja z głównego widoku do symulatora.** Dodana karta „Combat Lab" (ikona `FlaskConical`, `/combat-lab`) w `CategoryCards` na stronie głównej (`src/app/page.tsx`), obok Postaci/Bestiariusza/Kompendium/Podręcznika.
- ✅ **Kolejność w turze: manewry proaktywne → atak (fix).** `takeTurn` jest dwufazowy: najpierw manewry proaktywne (Standardowa/Pełnorundowa) przez politykę, potem atak. Manewry **natychmiastowe/nadnatychmiastowe** są klasyfikowane jako **reaktywne** (`isReactiveManeuver`) i wyłączone z fazy proaktywnej — zarezerwowane na odpowiedź na atak. Polityka zachłanna: `pass`=0, więc nie marnuje akcji na manewry o zerowej wartości. (`runCombat.ts`, `actionEconomy.ts`, `ai/policy.ts`; testy „resolves proactive maneuvers BEFORE the attack", „does not waste an action on a zero-value maneuver".)
- **Jak obsłużone są użycia manewrów — stan i braki (odpowiedź na pytanie):** manewr to dane `ManeuverDefinition = Maneuver & { effects: Effect[], hardRequirements, cost }`. Silnik interpretuje `effects` (`applyEffects`): damage / heal / status (z DoT tick) / control (stun/root/disarm/silence) / push/pull / resource / buff / debuff / chance. **Kiedy** manewr można użyć jest modelowane wiernie (`canUseCastable`: profile czasu rzucania, raz-na-turę, cooldown). **Braki różnorodności (TODO):**
  1. Większość istniejących manewrów ma `effects: []` (podniesione z tekstu) — nie robią nic mechanicznie, dopóki nie zostaną zredagowane (edytor efektów, Etap 1c/3).
  2. ✅ **`buff`/`debuff` są teraz APLIKOWANE** (wybór (a)). Runtime trzyma `activeBuffs: {profile, remaining}[]`; `resolveAttack`/`resolveRangedAttack`/obrażenia efektów liczą **efektywny** offense/defense przez `effectiveOffense`/`effectiveDefense` (reużycie `applyOffenseBuff`/`applyDefenseBuff` z apki). Manewr self-buff użyty w fazie 1 podnosi `Offense` na atak w fazie 2 tej samej tury. Buffy wygasają po `duration` rund (`tickBuffs`). Profil jest referowany po id z biblioteki `snapshot.buffProfiles` (postaci). (`buffs.ts`, `applyEffect.ts`, `CombatState.ts`; testy „buff application".) ✅ Buffy statystyk (precyzja/refleks) wpływają teraz na **test trafienia dystansowego** (`effectivePrecision`/`effectiveReflex` w `resolveRangedAttack`: buff precyzji podnosi rzut atakującego, buff refleksu obrońcy podnosi ST; testy „precyzja buff", „refleks buff").
  3. ✅ **Reaktywne manewry (hook reakcji) wpięte.** Gdy combatant jest atakowany, jego polityka może wydać **jeden manewr natychmiastowy/nadnatychmiastowy w odpowiedzi** — rozliczany **przed** policzeniem obrażeń, więc defensywny self-buff realnie zmniejsza nadchodzący cios (dzięki aplikacji buffów), a ofensywna reakcja rani/osłabia atakującego. Cooldown/raz-na-turę przez `canUseCastable`; brak rekurencji (efekty nie wywołują ataków). Reaktywne manewry są wyłączone z fazy proaktywnej. (`runCombat.reactToAttack`, `actionEconomy.availableReactiveManeuvers`, event `reaction` w logu/Replay; testy „reaction hook".) Uwaga: pod polityką zachłanną reakcje odpalają się dla manewrów zadających obrażenia; czysto defensywne (0 dmg) wymagają bogatszej polityki (pkt 5).
  4. `hardRequirements` (broń/tarcza/status) zdefiniowane, ale nie sprawdzane przy dostępności manewru.
  5. ✅ **Bogatsza polityka `valuePolicy`** — wycenia nie tylko obrażenia, ale też: leczenie (limitowane brakującym HP), kontrolę (oczekiwany atak przeciwnika × waga × czas: stun 1.0 / disarm 0.8 / silence 0.5 / root 0.2), status DoT (tick × czas) i nie-DoT (częściowa denializacja), self-buff (przyrost obrażeń z buffu ofensywnego + obrażenia zablokowane przez buff obronny) oraz debuff (obrażenia odjęte przeciwnikowi + nasz zysk). Wszystko w jednostkach „oczekiwanych obrażeń", więc porównywalne z atakiem. Odblokowuje **reakcje defensywne** (defensywny self-buff w odpowiedzi na atak odpala się pod `valuePolicy`, a nie pod zachłanną). Domyślna w runnerze; dostępna w workerze/persystencji. (`ai/policyValue.ts`, `ai/expectedDamage.ts`, `ai/policy.ts`; testy „valuePolicy".) Greedy (`greedyDamage`) zostaje jako opcja damage-only.
  6. ✅ Manewr „dodający obrażenia do ataku": wybrano i wdrożono **(a) self-buff podnoszący `Offense` na najbliższy atak** (patrz pkt 2).
  7. Pełnorundowy manewr a atak: dziś atak jest zawsze przyznawany w fazie 2, nawet po manewrze pełnorundowym — do doprecyzowania.


- ✅ **CombatantPicker + wzmocnienia per symulacja** (punkt 6) — ZROBIONE. `toCombatantSnapshot` przyjmuje `overrideActiveBuffProfileIds` + `extraBuffProfiles` (nadpisanie/dołożenie buffów na czas symulacji). UI: `useCharacterById` (pełna postać przez `searchClient`+`toCharacter`), `CombatantPicker` (szukaj postaci, rodzaj ataku, toggle buffów), `SimulationRunner` (2 pickery → worker → summary → zapis przez `combatLabClient` → inline Replay walki zreprodukowanej z konfiguracji), trasa `/combat-lab`. Testy `combatantSnapshot.test.ts`.
- ✅ **Lista zapisanych biegów + ponowne otwieranie w Replay** — zakładki na `/combat-lab` (`CombatLabTabs`: „Nowa symulacja" / „Zapisane biegi"). `useSavedSimulations` (lista + usuwanie, React Query), `SavedRunsList` (wybór/usuń), `SavedRunView` (ładuje bieg `getSimulation`, pokazuje podsumowanie i odtwarza dowolną walkę przez `reproduceFight`). Zapis w runnerze inwaliduje listę. Widok podsumowania wydzielony do `SimulationSummaryView` (wspólny dla runnera i zapisanych biegów).
- **Do zrobienia dalej:** polityka `scripted` w UI; wzmocnienia jako dodatkowe tymczasowe `BuffProfile` w pickerze (dziś: toggle istniejących profili postaci); sprawdzanie `hardRequirements` manewrów przy dostępności.
- **Przegląd `public/data/rulebook/magia-i-zaklecia.json`** — jak modelować w silniku moce/zaklęcia (`Power`/`Spell`, koszt `SpellCost`, esencja, kości zaklęcia), obrażenia magiczne dystansowe = **blokowane**. Do rozpisania osobno.
- **Przegląd `public/data/rulebook/zdrowie-i-regeneracja.json`** — leczenie (krótki/długi odpoczynek, poziom leczenia, medycyna, magiczne leczenie), urazy, zmęczenie, autoregeneracja mocy, efekty krytyczne. Sprawdzić, co z tego wpływa na pojedynczą walkę (raczej niewiele — leczenie w walce, DoT), a co to mechaniki poza-walkowe (pominąć w symulatorze walki 1v1).
- Redukcja jako malejąca pula per runda + odporność na 6 źródeł (walka grupowa, v0.4).
- Redukcja na obrażenia krytyczne (osobne pole/efekt).
- Dynamiczna inicjatywa (manewry/postawy/stany, obalenie) — v0.4.

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

Reguły rozstrzygania obrażeń (niewrażliwość, odporność, redukcja, krytyki, przeżywalność/determinacja) **NIE są już otwarte** — rozstrzyga je podręcznik (patrz sekcja "Reguły walki z podręcznika"). Pozostaje:

1. **Współistnienie z modułem `bestiary/battle`.** Czy Combat Lab ma pozostać w pełni odrębny, czy docelowo zasilać manualny tracker (np. import wyniku/statystyk)? Dokument sugeruje odrębność ("Nie jest to aplikacja do prowadzenia walki"), ale "Możliwe rozszerzenia" wspominają import postaci.
2. **Redukcja jako malejąca pula per runda vs. per atak.** Podręcznik opisuje pulę malejącą między źródłami w rundzie. Czy modelować to od razu (istotne dla wielu źródeł/walki grupowej), czy zacząć od uproszczenia per-atak? Rekomendacja: uproszczenie na v0.1, pula w v0.4 (przy Scenario/walka grupowa).
3. **Format modeli manewrów: YAML czy JSON w bazie?** Dokument pokazuje YAML jako *ilustrację*. W bazie i tak `Json` (Prisma). YAML sensowny tylko jako format importu/eksportu redakcyjnego. Potwierdzić, czy potrzebny import z YAML na starcie.
4. **PDF — którą drogą?** Print-to-PDF trasy raportu (zero zależności) vs. dedykowany generator. Rekomendacja: zacząć od print-to-PDF, dodać generator tylko jeśli wymagane jest headless.
5. **Zakres polityk AI w v0.1.** Ile polityk potrzeba na start, by wyniki balansu były wiarygodne? Rekomendacja: `greedyDamage` + `scripted` na v0.1; reszta w v0.3.
6. **Prywatność wyników.** Czy `Simulation`/`SimulationResult` mają być per-`apiKeyHash` (jak presety), czy publiczne/współdzielone? Wpływa na model danych i endpointy.

---

## Czego NIE robimy (świadome odcięcia względem dokumentu)

- **Nie** wprowadzamy ASP.NET, SQLite ani PostgreSQL — cały silnik i persystencja zostają w istniejącym stacku (TS + Prisma/Mongo).
- **Nie** budujemy drugiego edytora postaci — Lab reużywa istniejący (`(chracters)`), dokładając tylko selektor + edytor efektów manewru.
- **Nie** wprowadzamy liczbowego "AP" — używamy istniejącego modelu ekonomii akcji (`Castable`/profile czasu rzucania).
- **Nie** duplikujemy logiki rzutów/obrażeń/obron — silnik woła istniejące funkcje z `combat/Offense.ts` i `combat/Defense.ts`, dokładając tylko seedowalny `Rng`.

