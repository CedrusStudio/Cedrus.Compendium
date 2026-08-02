# Roadmapa robót nieblokowanych — Fala 9

Zadania, które da się zrobić **bez decyzji Marka i bez dostępu do produkcyjnej bazy**. Wszystko, co go wymaga, siedzi w `TWOJA-KOLEJKA.md`.

Kolejność jest wiążąca tam, gdzie zaznaczono zależność. Każde zadanie kończy się:

```
npm run typecheck:scoped     # ~40 s, łapie to, na co next build potrzebuje minut
npm test -- <ścieżka>        # testy dotkniętego obszaru
```

**Kontekst przydatny przy każdym z tych zadań:** ROADMAP §8.10 (silnik postaw, zrobiony 2026-08-02) i `postawy-autorowanie.md` (analiza 63 rodzin postaw — z niej wzięte liczby „ile rodzin odblokowuje").

---

## 9.1 `forbidAction` — zakaz akcji — `S` · ⭐⭐⭐

**Odblokowuje:** Postawa Pełna Defensywna (r1–5), Postawa Fortyfikacji (r1–4), Styl Grupowy (r1–4) — 3 rodziny / 13 rekordów. Pełna Defensywna jest jedną z częściej używanych postaw w bibliotece.

**Dlaczego nie wystarczy `forbidTag`:** ban po tagu działa na encje z biblioteki (manewry, postawy). Atak podstawowy nie jest encją i nie ma tagów — `{ kind: "attack" }` powstaje w `takeTurn` z powietrza. Potrzebny osobny efekt operujący na RODZAJU akcji.

### Kształt

`src/domain/combat-lab/effects/Effect.ts` — obok `ForbidTagEffect`:

```ts
export type ForbidActionEffect =
{
  type: "forbidAction";
  action: "attack" | "maneuvers" | "stanceChange" | "spells";
  duration: number;   // 0 = póki trwa tryb (jak forbidTag)
};
```

Dopisać do unii `Effect` (linia z `| ForbidTagEffect`).

### Miejsca do ruszenia

| Plik | Co |
|---|---|
| `effects/Effect.ts` | typ + wpis w unii |
| `effects/effectSchema.ts` | `z.object({ type: z.literal("forbidAction"), action: z.enum([...]), duration: z.number().int().min(0) })` — wstawić obok `forbidTag` |
| `effects/describeManeuver.ts` | `case "forbidAction"` → „uniemożliwia atak / manewry / zmianę postawy / zaklęcia" |
| `engine/CombatState.ts` | `forbiddenActions: ActiveForbiddenAction[]` w `CombatantRuntime` + `[]` w `createRuntime` (dokładnie jak `forbiddenTags`) |
| `engine/applyEffect.ts` | `case "forbidAction"` — merge po `action`, `Math.max` na `remaining` |
| `engine/runCombat.ts` | `tickForbiddenActions` obok `tickForbiddenTags`, w tej samej linijce ticków |
| `engine/actionEconomy.ts` | `isActionForbidden(runtime, action)` + filtry |
| `application/combat-lab/effects-editor/effectFieldsMeta.ts` | wpis w `EFFECT_TYPE_META` + `case` w `defaultEffect` |

### Gdzie faktycznie blokować

- **atak** — `runCombat.ts`, faza 2 `takeTurn`: warunek `if (!actor.attackedThisTurn)` rozszerzyć o `&& !isActionForbidden(actor, "attack")`. **Nie** w `availableActions` — atak jest tam składany osobno i to nie jedyna ścieżka.
- **manewry** — `availableProactiveManeuvers` i `availableReactiveManeuvers`: wczesny `return []`, obok istniejącego `isStaggered`.
- **zmiana postawy** — `availableStanceChanges`: wczesny `return []`. To jest ta część „nie można używać … innych postaw" ze Stylu Grupowego.
- **zaklęcia** — `availableSpells`: wczesny `return []`.

### Pułapki

1. **Postawa Pełna Defensywna zabrania atakować, ale sama jest postawą** — ban leci z jej auto-castu, więc odnawia się co turę i znika przy wyjściu z postawy. To działa dzięki `duration: 0` i kasowaniu w ticku, dokładnie jak przy `forbidTag`. Nie kopiuj tu wzorca „duration 1".
2. **Ban na atak zmienia bilans akcji, nie tylko listę.** Combatant z zakazem ataku, bez manewrów, przejdzie turę bezczynnie — upewnij się, że `runCombat` loguje wtedy `pass` z sensownym powodem (dziś `pass` loguje się tylko przy `!canAct`, więc dochodzi gałąź).
3. **Polityki nie muszą nic wiedzieć.** Skoro akcja nie trafia na listę `available`, `argmax` jej nie zobaczy. Żadnych zmian w `policy.ts`.

### Testy — `engine/__tests__/forbidAction.test.ts`

- ban „attack" → w logu zero zdarzeń `attack` dla tego aktora, ale manewry nadal lecą (kontrola: bez banu atak jest);
- ban „maneuvers" → `availableProactiveManeuvers` puste, atak nietknięty;
- ban „stanceChange" → `availableStanceChanges` puste mimo repertuaru;
- ban podtrzymywany przez postawę znika w turze po wyjściu z niej (zbuduj przez `runCombat` z `stanceOptions` i polityką zmieniającą postawę);
- `duration: 2` wygasa po dwóch turach.

---

## 9.2 Żywe wartości atrybutów w testach spornych — `M` · ⭐⭐⭐ `[FUNDAMENT dla 9.3]`

**Problem.** `toCombatantSnapshot` (`engine/CombatantSnapshot.ts:249`) zapisuje `skills: { attributes: buffed.attributes, characteristics: buffed.characteristics }` — **zamrożone w chwili budowy snapshotu**. `resolveContestedTest` czyta wyłącznie `source.snapshot.skills` (`applyEffect.ts:314`). Efekt nałożony w trakcie walki nigdy tam nie dotrze.

Dopóki to stoi, każdy bonus „+1 fechtunek" zapisany w 9.3 byłby **martwy**: zapisany w bazie, widoczny w opisie, bez wpływu na jedyną mechanikę, w której fechtunek się liczy.

**Wzorzec jest już w repo.** Ofensywa i obrona nie są brane ze snapshotu wprost — `engine/buffs.ts` wystawia `effectiveOffense` / `effectiveDefense` / `effectivePrecision` / `effectiveReflex`, które nakładają aktywne profile w momencie rozstrzygania. Atrybuty do testów spornych mają iść tą samą drogą.

### Kształt

`engine/buffs.ts` — nowa funkcja obok istniejących:

```ts
/** Skills with every active profile's attribute/characteristic buff applied. */
export function effectiveSkills(
  skills: CombatantSnapshot["skills"],
  profiles: BuffProfile[],
): CombatantSnapshot["skills"]
```

Implementacja: dla każdego klucza w `attributes` i `characteristics` złożyć `applyStatisticBuff(stat, profile.attributes[key])` po wszystkich profilach. `applyStatisticBuff` (`characters/buffs/applyBuffProfile.ts:97`) dodaje `grade`/`value`/`bonus`/`testBonus` — czyli dokładnie to, czego potrzebuje rzut testowy.

**Zwróć `skills` bez kopii, gdy `profiles.length === 0`** — testy sporne lecą w gorącej pętli symulacji (setki walk × kilka rzutów), a to jest zwykły guard, taki sam jak w `effectiveOffense`.

### Miejsca do ruszenia

| Plik | Linia (stan 2026-08-02) | Co |
|---|---|---|
| `engine/buffs.ts` | koniec pliku | `effectiveSkills` |
| `engine/applyEffect.ts` | 314 | `resolveContestedTest(effectiveSkills(source.snapshot.skills, activeBuffProfiles(source)), effectiveSkills(target.snapshot.skills, activeBuffProfiles(target)), effect, ctx.random)` |
| `engine/ai/policyValue.ts` | 26 (`expectedSideResult`) | ta sama podmiana, żeby wycena zgadzała się z rozstrzygnięciem — inaczej AI wybiera manewr na podstawie innych liczb, niż potem wypadną |

`activeBuffProfiles(runtime)` już istnieje (`CombatState.ts:206`).

### Pułapki

1. **`grade` jest mnożnikiem kości, nie dodatkiem do wyniku.** `applyStatisticBuff` robi `Math.max(1, grade + buff.grade)`, a `rollSide` rzuca `k(grade × 2)`. Buff podnoszący `grade` zmienia rozkład, nie średnią o stałą — przy pisaniu testu nie zakładaj determinizmu bez ustalonego seeda.
2. **Debuffy celu.** `mode: "target"` daje profil o ujemnych wartościach nałożony na przeciwnika — `effectiveSkills` po jego stronie musi to uwzględnić, dlatego podmiana dotyczy OBU argumentów `resolveContestedTest`.
3. **Nie ruszaj `snapshot.skills`.** Kuszące jest przeliczenie ich raz przy nakładaniu buffa, ale snapshot jest z założenia niemutowalny i współdzielony między biegami symulacji — mutacja zatrułaby kolejne walki tym samym obiektem.

### Testy — dopisać do `engine/__tests__/contestedTest.test.ts`

- buff `+2 fechtunku` na źródle podnosi wynik testu spornego przy ustalonym seedzie (kontrola: bez buffa niżej);
- debuff `−2 fechtunku` na celu obniża jego stronę;
- brak profili → wynik identyczny jak przed zmianą (regresja gorącej ścieżki);
- `expectedSideResult` po zmianie zgadza się z `resolveContestedTest` co do kierunku.

---

## 9.3 Słownik atrybutów w `StatBuffEffect` — `M` · ⭐⭐⭐

**Zależy od 9.2.** Bez żywych wartości ta zmiana produkuje efekty, które nic nie robią.

**Odblokowuje:** 16 rodzin / 56 rekordów — Fechmistrza, Dzentelmena, Ratera, Lisa, Kruka, Szulera, Szermierska, Kaname, Kontrfechtunku, Mędrca, Spokoju, Medytacij, Góry, Dłoń Mistrza, Tura, Sztukmistrza. To największa zablokowana grupa postaw.

**Stan dziś.** `StatBuffEffect` (`effects/Effect.ts`) zna z atrybutów tylko `precision`, `reflex`, `initiative`. `BuffProfile.attributes` (`characters/buffs/BuffProfile.ts:163`) ma **dziewięć**: `fencing`, `artifice`, `precision`, `initiative`, `martialArt`, `horsemanship`, `fortitude`, `reflex`, `willpower`. Charakterystyk jest sześć: `strength`, `dexterity`, `constitution`, `mind`, `charisma`, `spellborn`. Czyli infrastruktura stoi — brakuje wyłącznie słownictwa w efekcie.

### Kształt

W `StatBuffEffect` dołożyć brakujące atrybuty i charakterystyki jako opcjonalne liczby, obok istniejących `precision`/`reflex`/`initiative`:

```ts
  // Test stats (attributes).
  fencing?: number;      // fechtunek
  artifice?: number;     // fortel
  martialArt?: number;   // sztuka walki
  horsemanship?: number; // jeździectwo
  fortitude?: number;    // wytrwałość
  willpower?: number;    // wola
  // Characteristics.
  strength?: number; dexterity?: number; constitution?: number;
  mind?: number; charisma?: number; spellborn?: number;
```

**Nie wprowadzaj zagnieżdżenia** (`attributes: { fencing: 1 }`) — cała reszta efektu jest płaska, a edytor (`effectFieldsMeta`) adresuje pola ścieżką `path`, więc płaskie klucze wpinają się bez zmian w komponencie.

### Miejsca do ruszenia

| Plik | Co |
|---|---|
| `effects/Effect.ts` | pola w `StatBuffEffect` |
| `effects/effectSchema.ts` | te same pola jako `z.number().optional()` w gałęzi `stat` |
| `effects/statBuff.ts` → `statEffectToProfile` | `if (effect.fencing) profile.attributes.fencing.value = effect.fencing;` — wzorem trzech istniejących linii |
| `effects/statBuff.ts` → `statEffectDeltas` | pary `["fechtunek", effect.fencing ?? 0]` itd. — to zasila opisy i `id` profilu |
| `effects-editor/effectFieldsMeta.ts` | pola w `stat`; **rozważ podział na sekcje**, bo lista dojdzie do ~30 pozycji |
| `i18n/labels.ts` (jeśli tam siedzą etykiety) | polskie nazwy |

### Pułapki

1. **`id` profilu jest budowane z `statEffectDeltas`** (`statBuff.ts:17`) — to on decyduje, czy ponowne nałożenie tego samego buffa odświeża czas zamiast stackować drugą kopię. Jeśli dodasz pole do `StatBuffEffect`, a **nie** dodasz go do `statEffectDeltas`, dwa różne buffy dostaną ten sam `id` i zaczną się cicho nadpisywać. To najłatwiejszy do przeoczenia błąd w całym zadaniu.
2. **`value` czy `testBonus`?** `applyStatisticBuff` dodaje osobno `grade`, `value`, `bonus`, `testBonus`. Istniejące trzy pola idą w `.value`. Trzymaj się tego dla spójności — „zwiększa fechtunek o 1" w podręczniku znaczy podniesienie wartości cechy, nie premii do testu.
3. **`policyValue.ts` `case "stat"`** wycenia buff przez `expectedOffenseDamage(applyOffenseBuff(...))` — atrybuty nie wpływają na obrażenia, więc nowe pola wycenią się na zero i AI nie doceni postawy fechtunkowej. To **akceptowalne w tym kroku**, ale odnotuj w komentarzu; docelowo wycena powinna uwzględniać przewagę w testach spornych.
4. **Harmonia.** „Dodaje 1 do Harmonii" (Medytacij, Góry) — sprawdź w `statistics/skills.ts`, czy Harmonia jest atrybutem, czy osobnym bytem. Jeśli nie ma jej wśród dziewięciu atrybutów, ta rodzina wypada z 9.3 i zostaje niesymulowalna.

### Testy

- `effects/__tests__/statBuff.test.ts`: `statEffectToProfile({ fencing: 2 })` ustawia `profile.attributes.fencing.value === 2`; dwa różne efekty atrybutowe mają **różne** `id`;
- `engine/__tests__/contestedTest.test.ts`: postawa z `fencing: +2` faktycznie podnosi wynik testu spornego (test end-to-end, spina 9.2 z 9.3);
- `effectSchema` przyjmuje nowe pola i odrzuca literówkę (`fencingg`).

---

## 9.4 Propozycje efektów dla grupy A w CSV — `M` · ⭐⭐

**Częściowo zablokowane:** 5 rodzin z widmową kością (Widma, Profesty, Wirtuoza, Zondro, Cienisty Assasyn — 13 rekordów) czeka na decyzję Marka o `phantomDice`. Pozostałe 26 rodzin / ~94 rekordy można przygotować od ręki.

**Cel:** przegląd Marka ma być serią „tak/nie", nie pisaniem JSON-a od zera.

### Kontrakt pliku (sprawdzony w `scripts/import-mode-effects.ts`)

Kolumny: `name,grade,tier,suggestedType,markers,scaling,condition,cost,proposalConfidence,proposedEffects,proposalNote,approve,tags,description`

- `approve` ∈ `tak|yes|y|x|1|true` → wgraj `proposedEffects`; `nie|niesymulowalny|unsupported` → zapisz `simulatable: false`;
- `proposedEffects` to **JSON tablicy efektów** w komórce CSV (cudzysłowy podwajane);
- import dopasowuje po parze **(name, grade)** i waliduje każdy efekt `effectSchema` — błędny JSON leci na twarz, nie po cichu.

### Co zrobić

1. Dla każdej z 26 rodzin wypełnić `proposedEffects` **dla wszystkich rang**, nie tylko pierwszej. Skalowanie **nie jest liniowe** (Postawa Defensywna: odporność 1→2→4→6→8→11), więc liczby czytaj z opisu każdego rekordu osobno — nie mnóż.
2. Ustawić `approve` puste (decyzja Marka) i dopisać w `proposalNote` jednozdaniowe uzasadnienie mapowania.
3. Mapowanie słownictwa — ustalone z podręcznika (`system-walki.json`), nie zgadywane:
   - **odporność → `resistance`** (odejmowana pierwsza, per źródło);
   - **redukcja → `protection`** (redukcja to suma uników/parowania/blokowania/zbroi; `protection` to jedyna warstwa niezwiązana z konkretną akcją obronną);
   - blokowanie → `block`, parowanie → `parry`, unik → `dodge`;
   - siła krytyka → `critPower`, zasięg krytyka → `critRange`; „ataków **wymierzonych w postać**" → `mode: "target"` z wartością ujemną;
   - ranga kości broni → `diceGrade`; płaskie obrażenia → `damage`.
4. Wszystkie postawy: `mode: "self"`, `duration: 1` — auto-cast odnawia je na starcie każdej tury.

### Pułapka

Auto-propozycje z `classify-maneuvers` bywają **niepełne, nie błędne**. Przykład z pliku: `Ciężka Tarcza r2` → „Odejmuje 2 blokowania, dodaje 2 odporności", a proponowany efekt ma tylko `resistance: 2` — brakuje `block: -2`. Każdą propozycję trzeba przeczytać przeciw opisowi, nie ufać `proposalConfidence: high`.

---

## 9.5 Oznaczenie grup D i E jako niesymulowalne — `S` · ⭐⭐

**Dotyczy:** 7 rodzin / 19 rekordów. Sojusznicy (Dowódcy, Wodza, Wsparcia, Ściana z tarcz) i modyfikatory kosztu manewrów (Balansu, Zwojów, Virtona Lenter). Dziś udają kolejkę do zrobienia; po oznaczeniu widać w Kompendium „Niesymulowalny" z powodem.

**Do zrobienia:** wypełnić w CSV `approve = nie` i dopisać powód. **Uwaga na kontrakt:** import czyta `row.unsupportedReason`, a tej kolumny **nie ma w nagłówku** generowanym przez `classify-maneuvers` — bez niej powód spadnie do `row.markers` albo do domyślnego „poza modelem walki 1-na-1". Albo dołóż kolumnę `unsupportedReason` do CSV, albo popraw generator, żeby ją emitował.

Powody do wpisania:
- sojusznicy → „efekt drużynowy — silnik jest 1v1";
- koszt/odnowienie manewrów → „modyfikacja kosztu i cooldownu manewrów — poza modelem efektów".

---

## 9.6 Proposer: rozpoznawanie zakazów — `S` · ⭐

`scripts/classify-maneuvers.ts` nie zna wzorców „uniemożliwia …" i „nie można atakować", więc `forbidTag` (Amok, 3 rekordy) i `forbidAction` (3 rodziny) trzeba dziś wpisywać ręcznie. Po 9.1 warto dołożyć dwa wzorce do proposera:

- `/uniemożliwia (.*?)(postawy|manewry)/i` → `forbidTag` z tagiem wyciągniętym z tekstu (najczęściej „defensywne");
- `/nie można atakować/i` → `forbidAction: "attack"`; `/nie można używać manewrów/i` → `forbidAction: "maneuvers"`.

Skrypt jest offline (czyta backup, zero Prismy), więc efekt sprawdza się natychmiast: `node --experimental-strip-types scripts/classify-maneuvers.ts` i porównanie liczby auto-propozycji przed/po.

---

## Kolejność i zależności

```
9.1 forbidAction        (niezależne, najszybszy zysk)
9.2 effectiveSkills  ──► 9.3 słownik atrybutów      (9.3 bez 9.2 jest pozorne)
9.4 propozycje CSV      (26 z 31 rodzin; reszta po decyzji o phantomDice)
9.5 oznaczenie D/E      (niezależne, 15 minut)
9.6 proposer            (po 9.1)
```

**Rekomendacja:** 9.1 → 9.5 → 9.2 + 9.3 razem (jedna zmiana semantyczna, jeden przegląd) → 9.4 → 9.6.

Po każdym zadaniu: wpis do `ROADMAP.md` w sekcji „Co realnie zostało" i, jeśli zadanie zamyka pozycję z `postawy-autorowanie.md`, aktualizacja tamtejszej tabeli grup.
