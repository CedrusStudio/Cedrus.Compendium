# Plan: Plugin System dla Combat Lab (v1.0)

Plan wykonawczy ostatniego elementu v1.0. **To jest plan — bez implementacji.** Osadzony w realnym kodzie combat-lab (silnik, efekty, polityki, scenariusze, analizatory) zbudowanym w poprzednich etapach.

---

## 1. Cel i zakres

Plugin System ma otworzyć Combat Lab na rozszerzenia bez modyfikowania rdzenia: nowe **efekty manewrów**, **polityki AI**, **scenariusze**, **analizatory** (zakładki), a docelowo **kategorie obrażeń** i **statusy**. Deklaratywny bundle `CombatLabPlugin` rejestruje swoje wkłady, a silnik/UI odczytują je z rejestrów.

**Zakres MVP (to, co planujemy zrobić):**
- Statyczne rejestry (rejestracja w kodzie przy starcie aplikacji), a **nie** dynamiczne ładowanie kodu od użytkownika.
- Punkty rozszerzeń, które są dziś „domknięte" (unie + `switch`), zamienione na otwarte (lookup w rejestrze) — tam, gdzie to bezpieczne i tanie.
- `CombatLabPlugin` + `PluginRegistry` + wpięcie w main thread **i** w Web Workery.

**Poza MVP (świadomie na później):**
- Dynamiczne ładowanie pluginów spoza repo (upload/URL) — wymaga sandboxingu i modelu bezpieczeństwa (patrz §6).
- Rozszerzanie kategorii obrażeń i statusów o nietrywialną logikę redukcji/DoT (patrz §4.5, §4.6) — ryzykowne, zostawiamy jako opcję.
- Plugin marketplace / wersjonowanie / zależności między pluginami.

---

## 2. Punkty rozszerzeń — realny stan (co jest dziś „domknięte")

Rdzeń świadomie używał **unii dyskryminowanych + wyczerpujących `switch`** (bezpieczeństwo typów, determinizm). To jest zamknięte na rozszerzenia. Inwentaryzacja:

| Obszar | Gdzie | Jak domknięte dziś |
|---|---|---|
| Efekty | `domain/combat-lab/effects/Effect.ts` (`Effect` union) | interpretacja: `engine/applyEffect.ts` (`switch(effect.type)`); walidacja: `effects/effectSchema.ts` (Zod discriminatedUnion); opis: `effects/describeManeuver.ts`; etykiety: `i18n/labels.ts`; analiza: `analysis/*` (flattenEffects + switch) |
| Polityki AI | `engine/ai/policy.ts` (`ActionPolicy`) | rozwiązywanie po nazwie: `worker/policyResolver.ts`, `persistence/reproduceFight.ts` (`resolveSavedPolicy`); typ `SavedPolicy` (unia nazw) |
| Scenariusze | `scenario/scenario.ts` (`SCENARIO_PRESETS`) | stała tablica presetów |
| Analizatory (zakładki) | `application/combat-lab/runner/CombatLabTabs.tsx` | ręcznie wypisane `TabsTrigger`/`TabsContent` |
| Kategorie obrażeń | `effects/Effect.ts` (`DamageType`) | `engine/damage.ts` (`reductionModeFor`/`bypassesDefense`/`bypassesBarrier` — switch) |
| Statusy | `effects/Effect.ts` (`StatusId`) | `engine/runCombat.ts` (tick DoT), `CombatState.isStaggered`, etykiety |

**Wniosek:** silnik jest domknięty celowo. Plugin System = zamiana wybranych domknięć na **rejestry**, z zachowaniem determinizmu, serializowalności i bezpieczeństwa typów tam, gdzie się da.

---

## 3. Architektura pluginów

### 3.1 Typ pluginu

**Nowy plik:** `src/domain/combat-lab/plugins/CombatLabPlugin.ts`

```ts
export type CombatLabPlugin = {
  id: string;              // unikalny, np. "cedrus.bleed-pack"
  name: string;
  version: string;
  effects?: EffectPlugin[];        // nowe typy efektów
  policies?: PolicyPlugin[];       // nowe ActionPolicy (po nazwie)
  scenarios?: Scenario[];          // dodatkowe presety scenariuszy
  analyzers?: AnalyzerPlugin[];    // dodatkowe zakładki UI
  // (opcjonalnie, poza MVP) damageCategories?, statuses?
};
```

### 3.2 Rejestr

**Nowy plik:** `src/domain/combat-lab/plugins/registry.ts`

- Globalny, mutowalny-przy-inicjalizacji `PluginRegistry` z mapami: `effects: Map<string, EffectPlugin>`, `policies: Map<string, PolicyPlugin>`, `scenarios: Scenario[]`, `analyzers: AnalyzerPlugin[]`.
- `registerPlugin(plugin)` — waliduje id (brak kolizji), wpina wkłady do map.
- `getEffectPlugin(type)`, `getPolicy(name)`, `allScenarios()`, `allAnalyzers()` — odczyt.
- **Determinizm rejestracji:** kolejność ładowania pluginów musi być stała (lista w konfiguracji), bo wpływa np. na kolejność scenariuszy/zakładek.

### 3.3 Inicjalizacja (main + worker)

**Krytyczne:** rejestr musi być zainicjalizowany **identycznie** w wątku głównym i w **każdym Web Workerze** (symulacja, matchup, synergy, combo, tuning, scenario, meta), bo to tam wykonuje się silnik.

- **Nowy plik:** `src/domain/combat-lab/plugins/loadPlugins.ts` — importuje wbudowane pluginy z ustalonej listy i woła `registerPlugin` w deterministycznej kolejności. Czysta domena (bez React/DOM), żeby dało się ją zaimportować w workerze.
- Każdy worker na starcie woła `loadPlugins()` (zanim odbierze pierwszą wiadomość). Wątek główny woła to raz przy bootstrapie combat-lab (np. w `CombatLabTabs` lub w module top-level).

---

## 4. Poszczególne rejestry — projekt i refaktory

### 4.1 Efekty (`EffectPlugin`) — najważniejsze

Dziś dodanie efektu wymaga edycji **pięciu** miejsc (typ, interpreter, schemat Zod, opis, etykiety) + analizy. Plugin ma to skupić w jednym wkładzie:

```ts
export type EffectPlugin = {
  type: string;                    // dyskryminator, np. "lifesteal"
  schema: z.ZodType<any>;          // walidacja pola efektu (Zod)
  apply(effect, source, target, ctx): void;   // interpreter (mutuje runtime + log)
  describe(effect): string;        // PL opis dla describeManeuver
  expectedValue?(effect, self, opponent): number; // wycena dla valuePolicy (opcja)
};
```

**Refaktory rdzenia (otwarcie domknięć):**
- `Effect.ts`: dodać wariant `CustomEffect = { type: string; data: unknown }` do unii **jako escape-hatch** dla efektów pluginów (rdzeń zostaje silnie typowany dla wbudowanych; pluginy trzymają swoje pola w `data` walidowanym własnym `schema`). Alternatywa (§7): w pełni otwarta unia — odrzucona, bo traci wyczerpujące `switch` w rdzeniu.
- `applyEffect.ts`: `default:` w switchu → `getEffectPlugin(effect.type)?.apply(...)`; brak pluginu → log ostrzeżenia/no-op.
- `effectSchema.ts`: dodać do `discriminatedUnion` gałąź `custom` lub walidować pluginowe efekty po `type` przez rejestr (`effectSchema` staje się funkcją, nie stałą — bo zależy od rejestru).
- `describeManeuver.ts` / `describeEvent.ts`: `default` → `getEffectPlugin(type)?.describe(...)`.
- `ai/policyValue.ts`: `effectValue` `default` → `getEffectPlugin(type)?.expectedValue?.(...) ?? 0`.
- `flattenEffects`: musi umieć wejść w zagnieżdżone efekty pluginów (jeśli plugin ma `then`-podobne pola) — do rozważenia interfejs `children(effect)`.

**Ograniczenia:** efekt musi być **serializowalny** (przechodzi przez granicę workera jako dane) i **deterministyczny** (rng tylko z `ctx.random`, żadnego `Math.random`/`Date`).

### 4.2 Polityki (`PolicyPlugin`)

Najprostszy i najbezpieczniejszy rejestr — polityki już są rozwiązywane po nazwie.

```ts
export type PolicyPlugin = {
  name: string;                      // np. "defensive"
  label: string;                     // PL etykieta do UI
  create(config?: unknown): ActionPolicy;
};
```

**Refaktory:**
- `worker/policyResolver.ts` i `persistence/reproduceFight.ts`: `default` w switchu → `getPolicy(spec.name)?.create(...)`.
- `SavedPolicy` / `PolicySpec`: rozszerzyć `name` o `string` (dla pluginów) obok literałów wbudowanych — albo trzymać `{ name: string; config?: unknown }`. Uwaga na obecny wzorzec dyskryminowanej unii `PolicySpec` (scripted wymaga `sequence`) — pluginy przez `config`.
- UI (selektory polityk w Runner/Matchup/Synergy/Combo/Meta/Scenario/Tuning): lista opcji budowana z wbudowanych + `getPolicy` z rejestru. **Do rozważenia:** wspólny komponent `PolicySelect` zamiast 6 kopii (dziś zduplikowany) — dobra okazja do konsolidacji przy okazji.

### 4.3 Scenariusze

Trywialny: `allScenarios()` = `SCENARIO_PRESETS` + pluginowe. `ScenarioBuilder` iteruje `allScenarios()` zamiast stałej. Scenariusz to już czyste dane (`Scenario`), więc plugin wnosi po prostu obiekty. Zero refaktoru silnika.

### 4.4 Analizatory (zakładki UI)

```ts
export type AnalyzerPlugin = {
  id: string;
  label: string;                     // etykieta zakładki
  component: React.ComponentType;    // panel
};
```

- `CombatLabTabs.tsx`: wbudowane zakładki + `allAnalyzers().map(...)` na `TabsTrigger`/`TabsContent`.
- Uwaga: to jest warstwa aplikacji (React) — plugin analizatora zawiera komponent, więc **nie** może być importowany w workerze (tylko main thread). Rozdzielić: `analyzers` to część „UI pluginu", ładowana tylko w wątku głównym; `effects`/`policies`/`scenarios` (czysta domena) ładowane też w workerze. To dzieli plugin na część domenową i część UI — patrz §5.

### 4.5 Kategorie obrażeń (poza MVP)

`DamageType` steruje `reductionModeFor`/`bypassesDefense`/`bypassesBarrier`. Nowa kategoria = nowa reguła redukcji. Otwarcie tego (rejestr kategorii z funkcją redukcji) jest możliwe, ale **ryzykowne** (dotyka rdzenia rozliczania obrażeń i bariery). Zostawiamy na później; MVP trzyma 5 kategorii z podręcznika jako zamknięte.

### 4.6 Statusy (poza MVP)

`StatusId` + DoT tick + `isStaggered` + specjalne zachowania (oszołomienie zmienia gardy). Nowy status z nietrywialnym zachowaniem (jak stagger) wymaga hooków w pętli walki, nie tylko danych. MVP: statusy zamknięte; ewentualnie prosty status-DoT jako typ efektu pluginu (§4.1), bo DoT to już dane (`tick`).

---

## 5. Determinizm, serializacja, granica workera (twarde ograniczenia)

To jest sedno trudności i musi być w planie wyraźnie:

1. **Podział pluginu na domenę i UI.** `effects`/`policies`/`scenarios` = czysta domena (serializowalne dane + czyste funkcje), ładowane w main thread **i** workerze. `analyzers` = React, tylko main thread. `CombatLabPlugin` rozbić lub oznaczyć, które pola są „worker-safe".
2. **Rejestracja w workerze.** Każdy worker (`simulation`, `matchup`, `synergy`, `combo`, `tuning`, `scenario`, `meta`) musi na starcie zaimportować i wykonać `loadPlugins()` (część domenowa). Inaczej efekty/polityki pluginów nie zadziałają w obliczeniach.
3. **Serializowalność efektów.** Efekt pluginu przechodzi jako dane (`{type, data}`); `data` musi być strukturalnie klonowalne (bez funkcji, klas, `Map`). Walidacja przez `schema` na wejściu.
4. **Polityki po nazwie.** Funkcje nie przechodzą przez granicę workera — polityka pluginu jest odtwarzana w workerze przez `getPolicy(name).create(config)`. `config` musi być serializowalny.
5. **Determinizm.** Kontrakt pluginu: efekt/polityka używają wyłącznie wstrzykniętego `Rng`/`ctx.random`; zakaz `Math.random`, `Date.now`, I/O. Trudne do wymuszenia technicznie w MVP — egzekwujemy dokumentacją + testami „golden log" (patrz §9). Dynamiczne pluginy (poza MVP) wymagałyby sandboxa.
6. **Kolejność.** Lista pluginów i kolejność rejestracji stała → determinizm scenariuszy/zakładek/rozstrzygania konfliktów nazw.

---

## 6. Bezpieczeństwo — statyczne vs dynamiczne

- **MVP = statyczne pluginy w repo.** Rejestrowane z ustalonej listy w `loadPlugins.ts`. Zero wykonywania kodu z zewnątrz → brak nowej powierzchni ataku. To jest realny „plugin system" z dokumentu (rejestry punktów rozszerzeń wystawione publicznie).
- **Dynamiczne pluginy (poza MVP).** Ładowanie kodu użytkownika (upload/URL) to osobny, duży temat: sandboxing (Web Worker/iframe/QuickJS), limity zasobów, walidacja, zaufanie. Wymaga własnego planu bezpieczeństwa. **Nie robimy w MVP** i zapisujemy to jawnie.
- Zgodność z resztą repo: klucze API/`proxy.ts` bez zmian — pluginy nie dotykają persystencji ani sieci.

---

## 7. Kompromis bezpieczeństwa typów

Dwie drogi dla efektów (i analogicznie dla polityk/kategorii):
- **(A) Escape-hatch `CustomEffect { type: string; data: unknown }`** (rekomendacja): rdzeń zostaje silnie typowany i wyczerpujący dla wbudowanych efektów; pluginy żyją w jednym wariancie `custom`, walidowanym własnym Zod. Minimalny refaktor, zachowane `switch`-exhaustiveness dla rdzenia.
- **(B) W pełni otwarta unia `Effect = KnownEffect | { type: string; ... }`** — elastyczniejsze, ale traci wyczerpujące `switch` (każdy `switch` w rdzeniu potrzebuje `default`), więcej ryzyka regresji.

Rekomendacja: **(A)** na MVP.

---

## 8. Etapy wdrożenia (kolejność)

1. **Rdzeń rejestru** — `CombatLabPlugin`, `registry.ts`, `loadPlugins.ts` (pusta lista na start), typy `EffectPlugin`/`PolicyPlugin`/`AnalyzerPlugin`. Testy rejestru (rejestracja, kolizje id, odczyt).
2. **Scenariusze przez rejestr** — najłatwiejsze, zero refaktoru silnika. `allScenarios()` + `ScenarioBuilder` iteruje rejestr. Dowód działania end-to-end na najprostszym punkcie.
3. **Polityki przez rejestr** — refaktor `policyResolver`/`resolveSavedPolicy` + `PolicySpec.name: string`; konsolidacja `PolicySelect`. Rejestracja w workerach.
4. **Analizatory przez rejestr** — `CombatLabTabs` iteruje `allAnalyzers()` (tylko main thread).
5. **Efekty przez rejestr** — najtrudniejsze: `CustomEffect`, otwarcie `applyEffect`/`effectSchema`/`describe*`/`policyValue`; rejestracja w workerach; kontrakt determinizmu.
6. **Przykładowy plugin referencyjny** — np. „lifesteal" (efekt) + „defensive" (polityka) + „arena-wąska" (scenariusz), jako żywy test i dokumentacja API.
7. (Opcjonalnie, poza MVP) kategorie obrażeń / statusy.

---

## 9. Testy

- **Rejestr:** rejestracja, wykrywanie kolizji id, deterministyczna kolejność, odczyt.
- **Determinizm z pluginem:** golden-log — walka z efektem/polityką pluginu daje identyczny `CombatLog` dla tego samego seeda (dowód, że plugin nie łamie determinizmu).
- **Worker parity:** ten sam wynik dla obliczenia z pluginem w workerze i na main thread (rejestr zainicjalizowany identycznie).
- **Serializacja:** efekt pluginu przechodzi `structuredClone` bez utraty danych.
- **Referencyjny plugin:** testy jego efektu/polityki/scenariusza wpięte przez rejestr.
- **Brak pluginu:** nieznany `type` efektu / nazwa polityki → bezpieczny no-op + ostrzeżenie, brak wyjątku.

---

## 10. Otwarte pytania (do rozstrzygnięcia przed startem)

1. **Zakres MVP:** czy wystarczą rejestry efektów + polityk + scenariuszy + analizatorów, czy od razu kategorie obrażeń/statusy? (Rekomendacja: bez kategorii/statusów.)
2. **Escape-hatch (A) czy otwarta unia (B)** dla efektów? (Rekomendacja: A.)
3. **Gdzie inicjalizować `loadPlugins()`** w wątku głównym — moduł top-level combat-lab czy bootstrap aplikacji? (Ważne, by wykonać raz i przed pierwszym renderem/analizą.)
4. **Konsolidacja `PolicySelect`** przy okazji polityk — tak/nie (dziś 6 kopii selektora).
5. **Konflikty nazw** (dwa pluginy, ten sam `type`/`name`) — błąd twardy czy „ostatni wygrywa"? (Rekomendacja: błąd twardy przy rejestracji.)
6. **Czy pluginy mają być zapisywane w konfiguracji biegu** (`SavedSimulation`), żeby raport/Replay wiedział, że użyto pluginu? (Determinizm odtwarzania zależy od obecności tego samego pluginu — do przemyślenia wersjonowanie.)

---

## 11. Czego NIE robimy w MVP

- Dynamicznego ładowania kodu spoza repo (upload/URL) i sandboxingu — osobny plan bezpieczeństwa.
- Rozszerzalnych kategorii obrażeń i statusów o nietrywialną logikę rdzenia.
- Marketplace, wersjonowania zależności między pluginami, hot-reloadu.
- Pluginów, które mutują globalny stan poza swoimi rejestrami albo sięgają sieci/persystencji.

---

## Podsumowanie

Plugin System w MVP = **statyczne rejestry punktów rozszerzeń** (efekty, polityki, scenariusze, analizatory) z twardym rozdziałem „domena worker-safe" vs „UI main-thread", zachowaniem determinizmu i serializowalności, oraz escape-hatch `CustomEffect` chroniącym typowanie rdzenia. Największy refaktor to otwarcie ścieżki efektów (`applyEffect`/`effectSchema`/`describe*`/`policyValue`) i rejestracja rejestru we wszystkich workerach. Reszta (scenariusze, analizatory, polityki) jest tania. Dynamiczne/zewnętrzne pluginy i rozszerzalne kategorie obrażeń/statusy — świadomie poza MVP.
