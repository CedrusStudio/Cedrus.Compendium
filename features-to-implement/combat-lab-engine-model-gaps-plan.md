# Plan: Luki w modelu silnika Combat Lab

Plan implementacji — **bez kodu.** Cztery mechaniki, których model efektów jeszcze nie obsługuje, przez co całe klasy manewrów są nieautorowalne. Uszeregowane od najtańszego/najpewniejszego do najdroższego/najbardziej niepewnego.

Kolejność rekomendowana: **4 (krytyk) → 2 (procenty) → 3 (dynamiczne) → 1 (postawy).**

Wspólny wzorzec dla każdej mechaniki (te same „szwy" co przy poprzednich efektach): `Effect.ts` (typ) → `effectSchema.ts` (walidacja) → silnik (`applyEffect`/`resolveAttack`/`damage`) → `describeManeuver.ts` (opis PL) → `ai/policyValue.ts` (wycena) → edytor `effect-editor/*` → auto-proposer `scripts/classify-maneuvers.ts`.

---

## 4. Szansa/zasięg krytyka jako statystyka  ✅ ZROBIONE

**Zrealizowano.** `StatBuffEffect` zyskał `critRange` (mapowany w `statEffectToProfile` na `criticalRange` — silnik już to niósł) i `critDisabled`. Wyłączenie krytyka: flaga `critSuppressedRemaining` na runtime (`CombatState`), ustawiana w `applyEffect` (case `stat`), tickowana w `runCombat`, egzekwowana przez `stripCritical` w `resolveAttack`/`resolveRangedAttack`/zaklęciach (opcja `suppressCrit`). `critRange` wycenia się automatycznie (AI `expectedOffenseDamage` liczy krytyk). Edytor, opis PL i auto-proposer (wzorce „dodaje szansę krytyka(+N)", „nie można zadać krytyka") — dodane. Testy: `engine/__tests__/critStat.test.ts`. Pokrycie proposera 387 → 403.

---

### (oryginalny plan §4, dla referencji)

**Stan obecny.** `Critical = { power, range }` (`Offense.ts`); krytyk pada gdy `roll ≥ grade*2 − range` (`calculateCriticalDamage`), a `power` to premia. Infrastruktura buffów **już** dodaje `criticalRange` — `applyOffenseBuff` (`buffs/applyBuffProfile.ts`, linia ~146: `range: offense.critical.range + buff.criticalRange`). Luka jest **wyłącznie** w efekcie inline `stat`: `StatBuffEffect` ma `critPower`, ale nie `critRange`, więc „dodaje szansę krytyka +N" nie da się zautorować.

**Model docelowy.** Dodać do `StatBuffEffect` pole `critRange?: number`. Mapować w `statEffectToProfile` (`effects/statBuff.ts`): `profile.offense.leadingWeapon.criticalRange = effect.critRange`. Silnik nie wymaga zmian (buff już to niesie).

**Zmiany w plikach.**
- `Effect.ts` — `critRange?: number` w `StatBuffEffect`.
- `effectSchema.ts` — `critRange: z.number().int().optional()` w gałęzi `stat`.
- `effects/statBuff.ts` — mapowanie + wpis w `statEffectDeltas` (`["szansa krytyka", effect.critRange ?? 0]`).
- `effects/describeManeuver.ts` — etykieta „szansa krytyka".
- `application/combat-lab/effects-editor/*` — pole w builderze `stat` (już są `critPower` itd.).
- `ai/policyValue.ts` — drobny wkład do wyceny (wzrost szansy krytyka ≈ mały bonus obrażeń).
- `scripts/classify-maneuvers.ts` — wzorzec „dodaje szansę krytyka(+N)" → `stat.critRange`.

**Podproblem: „nie można zadać krytycznych obrażeń" (wyłączenie krytyka).** Buffy tylko DODAJĄ (`range+delta`), więc nie da się nimi wyzerować krytyka. Potrzebny osobny mechanizm: flaga `critDisabled` na runtime celu/atakującego (ustawiana przez `debuff`/`stat`/nowy mały efekt), sprawdzana w `calculateCriticalDamage`/`rollOffense` (jeśli aktywna → krytyk = 0). Mała, ale wymaga tknięcia rdzenia rzutu.

**Etapy.** (1) pole `critRange` end-to-end + test; (2) flaga wyłączenia krytyka + test; (3) wzorzec w proposerze.
**Rozmiar/ryzyko:** MAŁY / niskie. Punkt (1) to ~godzina; wyłączenie krytyka to jedyny fragment ruszający `rollOffense`.

---

## 2. Efekty procentowe / mnożniki  ✅ ZROBIONE

**Zrealizowano.** Nowy typ `MultiplierEffect` (`mode` self/target, `target` damageDealt/damageTaken, `factor`, `rounding` up/down/nearest, `duration`). Runtime: `activeMultipliers` (`CombatState`), tick w `runCombat`, aplikacja `applyDamageMultipliers` (`damage.ts`) na wynik PO redukcji we wszystkich trzech ścieżkach (zwarcie/dystans/zaklęcie) — mnożniki tego samego typu się kumulują, domyślne zaokrąglenie „w górę". `applyEffect` case `multiplier` + zdarzenie logu `multiplier` + opis w Replay/`describeManeuver`. AI (`policyValue`) wycenia wzmocnienie/redukcję. Edytor: builder + `defaultEffect`. Auto-proposer: „zmniejsza/zwiększa obrażenia o N%", „podwaja/potraja obrażenia". Testy: `engine/__tests__/multiplier.test.ts`. Pokrycie 403 → 406.

---

### (oryginalny plan §2, dla referencji)

**Stan obecny.** Cały model jest **addytywny**: `rollOffense` sumuje kości/bonusy, `reduceDamage` (`engine/damage.ts`) odejmuje płasko (odporność → redukcja). Brak jakiegokolwiek mnożnika. „Podwaja obrażenia", „zmniejsza obrażenia o 10%" — nieobsługiwane.

**Model docelowy.** Nowy typ efektu `multiplier`:
```
{ type: "multiplier"; target: "damageDealt" | "damageTaken"; factor: number; rounding?: "up" | "down"; duration: number }
```
- `damageDealt` — mnoży obrażenia zadawane przez posiadacza (×2 = „podwaja obrażenia").
- `damageTaken` — mnoży obrażenia otrzymywane (×0.9 = „zmniejsza o 10%").
- Stosowane jako aktywny modyfikator (jak `activeBuffs`), z czasem trwania; **kolejność**: po rzucie ofensywy i po płaskiej redukcji (mnożnik działa na wynik końcowy), zaokrąglenie wg `rounding` (domyślnie „up" — zgodnie z „zaokrąglone w górę" z opisów).

**Decyzje projektowe.**
- Wiele mnożników tej samej kategorii: mnożą się (×2 i ×0.5 → ×1) — czy sumują? v1: **mnożą się** (naturalne).
- Punkt aplikacji: `damageDealt` w `resolveAttack`/`resolveRangedAttack` po `rollOffenseWithModifiers`; `damageTaken` w `dealDamage`/`reduceDamage` na samym końcu. Trzeba przekazać aktywne mnożniki obu stron do rozstrzygnięcia (jak `activeBuffProfiles`).
- Interakcja z krytykiem/redukcją: mnożnik działa na sumę po redukcji (żeby „−10% obrażeń" nie omijało pancerza dwukrotnie).

**Zmiany w plikach.**
- `Effect.ts` + `effectSchema.ts` — typ `MultiplierEffect`.
- `CombatState.ts` — `activeMultipliers` na runtime (jak `activeBuffs`), tick czasu w `runCombat` (jak `tickBuffs`).
- `engine/applyEffect.ts` — case `multiplier` (dodaje do runtime).
- `engine/resolveAttack.ts` / `resolveRangedAttack.ts` / `damage.ts` — zastosowanie współczynnika.
- `ai/policyValue.ts` — wycena (×2 obrażeń ≈ podwojony wkład; −% ≈ redukcja wartości ataku przeciwnika — dla `damageTaken` to defensywne).
- `describeManeuver.ts`, edytor, `classify-maneuvers.ts` (wzorce „podwaja obrażenia", „zmniejsza obrażenia o N%", „zwiększa obrażenia o N%").

**Etapy.** (1) typ + schema + runtime + tick; (2) aplikacja `damageDealt` w ataku + test; (3) `damageTaken` w redukcji + test; (4) opis/AI/edytor; (5) wzorce w proposerze.
**Rozmiar/ryzyko:** ŚREDNI / niskie. Jasno ograniczone; główne ryzyko to kolejność aplikacji (mnożnik vs redukcja vs krytyk) — ustalić golden-logiem.

---

## 3. Wartości dynamiczne (skalowanie od statystyki)  ✅ ZROBIONE (płaskie wartości)

**Zrealizowano.** `ScaleSource` zyskał `selfStat`/`opponentStat` (`group` + `key`); `countScaleSource` (`scaleSource.ts`) czyta magnitudę statystyki (value + bonus, bez testBonus) ze snapshotowych `skills`. Schema, opis PL (`describeScaleSource`), edytor (selektor statystyki w `ScaleFields`), auto-proposer (wzorzec „<efekt> równ- <statystyka> [przeciwnika]"). AI wycenia automatycznie (scale przez `countScaleSource`). Testy: `engine/__tests__/scaleStat.test.ts`. Pokrycie 406 → 428.

**Stretch (dynamiczna ranga kości) — ✅ ZROBIONE.** `DamageSpec` zyskał `gradeFromStat { group, key, who? }`; `resolveDamageSpecGrade` (`scaleSource.ts`) podmienia rangę na magnitudę statystyki (floor ≥ 1) przy rzucie efektów `damage`/`heal` (`applyEffect`). Schema + auto-proposer („kość … o randze równej <stat>", z obsługą widmowej i „przeciwnika"; uwaga: „ranga"→„randze", więc regex `ran[dg]`). Test w `scaleStat.test.ts`. Pokrycie 428 → 430. UWAGA: pole `gradeFromStat` nie jest jeszcze edytowalne w builderze edytora (import ze skryptu działa; edycja w apce by je zgubiła) — do dodania, jeśli będzie autorowane ręcznie.

---

### (oryginalny plan §3, dla referencji)

**Stan obecny.** `ScaleEffect` (`Effect.ts`) skaluje efekt „za każde X" ze źródeł: `opponentDice`, `opponentImmunity`, `selfResource`, `selfStatusStacks`, `targetStatusStacks` (`engine/scaleSource.ts`, `countScaleSource`). Snapshot **już niesie `skills`** (atrybuty + charakterystyki — dodane dla T2c). Brak źródła czytającego wartość statystyki. „Redukcja równa umysłowi przeciwnika", „bonus równy sile" — nieobsługiwane.

**Model docelowy.** Dodać źródła skalowania:
```
{ kind: "selfStat"; group: "attributes" | "characteristics"; key: string }
{ kind: "opponentStat"; group: "attributes" | "characteristics"; key: string }
```
`countScaleSource` czyta `getStatisticTotalTestValue(snapshot.skills[group][key])` (albo samą `value` — do ustalenia, patrz pytania). Wtedy „redukcja równa umysłowi przeciwnika" = `scale{ source: opponentStat(mind), per: 1, effect: stat protection +1 }`.

**Podproblem: dynamiczna RANGA kości („kość równa sile").** `scale` powtarza efekt N razy — nie potrafi ustawić *rangi* kości równej statystyce. To osobny mechanizm: wariant efektu obrażeń z rangą związaną ze statystyką, np.
```
{ type: "damage"; damage: { amount: 1, gradeFromStat: { group, key }, bonus: 0 }, damageType }
```
rozwiązywany przy rzucie (grade = wartość statystyki, floor ≥ 1). Wymaga tknięcia `rollOffense`/`rollDamageSpec`. Traktować jako **stretch** — większość „dynamicznych" manewrów to płaskie wartości (redukcja/bonus), nie rangi.

**Zmiany w plikach.**
- `Effect.ts` + `effectSchema.ts` — nowe `ScaleSource` (i opcjonalnie `gradeFromStat` w `DamageSpec` dla stretcha).
- `engine/scaleSource.ts` — `countScaleSource` czyta statystyki ze snapshotu obu stron.
- `describeManeuver.ts` (`describeScaleSource`), edytor (`SCALE_SOURCE_KINDS`), `ai/policyValue.ts` (wycena scale już istnieje — użyć wartości statystyki), `classify-maneuvers.ts` (wzorce „równ\* <statystyka>", „za każd\* <statystyka>").

**Etapy.** (1) źródła `selfStat`/`opponentStat` w scale + test; (2) opis/AI/edytor; (3) proposer; (4) [stretch] `gradeFromStat` dla dynamicznej rangi kości.
**Rozmiar/ryzyko:** ŚREDNI / niskie dla płaskich wartości; stretch (ranga) — osobny, większy.

---

## 1. Postawy (stances) i stany (states)  ★ największe — USTALENIA potwierdzone

### Ustalenia z backupu + od autora (potwierdzone)

- **Biblioteka:** 214 postaw + 30 stanów, współdzielone (jak manewry/zaklęcia). **Każda ranga to osobny rekord** o autorowanych efektach (np. „Ciężka Tarcza" g1 −1 blok/+1 odp; g2 −2/+2; g3 −3/+3). Efekty wyglądają jak efekty manewrów.
- **Ranga +1 = użyj wariantu grade+1.** „Podnosisz rangę postawy o 1" znaczy: w danej rundzie traktuj postać jakby miała wariant o grade+1 tej samej postawy (jego autorowane efekty). Nie wzór — podmiana na sąsiedni rekord. Clamp do najwyższej dostępnej rangi.
- **Limity aktywności:** dokładnie **1 aktywna postawa** i **1 aktywny stan** (więcej = sytuacje specjalne → niesymulowalne). Stan ≠ postawa (osobne sloty, współistnieją).
- **Skąd w symulacji:** wybór **startowy w pickerze** (postawa + stan z biblioteki). Dodatkowo zmiana postawy to **akcja typu ruch** — nie zajmuje ataku/manewru, ale ma zasadę kolejności: można zmienić postawę PRZED atakiem (wtedy nie po), albo PO ataku (wtedy w następnej turze nie przed). → v1: max jedna zmiana postawy na turę, „darmowa".
- **Zakres v1 = jak manewry:** postawy/stany dostają pole `effects` (+ `simulatable`), wchodzą do snapshotu, autorowanie stopniowo przez ten sam proposer/edytor.

### Model docelowy

- **Persystencja:** schemat postaw/stanów zyskuje `effects`/`simulatable`/`unsupportedReason` (jak split manewrów), mapowanie w `characterMapping.ts`.
- **Rodzina rang:** żeby „ranga +1" działała, aktywna postawa/stan niesie **warianty po grade** (`Record<grade, Effect[]>`), zbudowane z rekordów o tej samej nazwie.
- **Snapshot:** `SnapshotStance` / `SnapshotState` = `{ name; grade; variantsByGrade: Record<number, Effect[]> }`. Opcje snapshotu: startowa postawa/stan (nazwa+grade) + doładowane rodziny (hook jak `usePowerSpecifications`, szuka po nazwie w bibliotece postaw/stanów). Postacie nie trzymają postaw na karcie → wybór w pickerze jest źródłem.
- **Runtime:** `activeStance?/activeState?: { variants; baseGrade; rankBonus }`. **Auto-cast:** na starcie każdej tury combatanta `applyEffects(variantsByGrade[effGrade], actor, opponent)` z `effGrade = clamp(baseGrade + rankBonus)` — postawa = „manewr rzucany na starcie każdej tury", więc pasywne bonusy trzymają się (stat buff z duration 1 odświeża się co turę), a efekty warunkowe/tikowe odpalają się per tura. Reużywa cały silnik efektów.
- **Efekt zmiany rangi:** nowy `{ type: "stanceRank"; delta; duration }` — podbija `activeStance.rankBonus` na `duration` rund (tick jak inne). To jest cel manewru „podnosisz rangę postaw o N".
- **Zmiana postawy w turze:** akcja „move-like" (nie zajmuje ataku/manewru), z regułą pre/post-atak (jedna na turę). v1 może pominąć AI-decyzję o zmianie i zostać przy wyborze startowym + efektach `stanceRank`; pełna akcja zmiany — kolejny etap.

### Etapy (jak przy magii)

1. ✅ **Dane:** `Mode` zyskał `effects`/`simulatable`; `modeWithEffectsSchema`; domenowy `ModeDefinition` + `groupModeFamilies`/`variantEffectsAt` (rodziny rang). Test `modeDefinition.test.ts`.
2. ✅ **Snapshot + picker:** `SnapshotMode` (`variantsByGrade`) + opcje w `toCombatantSnapshot`; hook `useModeFamilies` (searchClient + `groupModeFamilies`); `ModeSelector` (postawa+stan+ranga) w `CombatantPicker`; podgląd w `CombatantStatsCard`; pola w `CombatantSelection`.
3. ✅ **Runtime + auto-cast:** `activeStance/activeState` (`CombatState`), auto-cast efektów na starcie każdej tury (`runCombat`), clamp rangi. Testy `stance.test.ts`.
4. ✅ **Ranga:** efekt `stanceRank` + tick + `describe`/schema/edytor/log/Replay.
5. ✅ **Proposer:** wzorzec „podnosisz rangę postaw/stanu o N" → `stanceRank`; skrypt klasyfikuje też `Stance.json`/`State.json` → osobne CSV (postawy 44, stany 6 auto-propozycji). Wartość bycia w postawie płynie z auto-castu (AI bez zmian).
6. **Current authoring:** Stance/State effect schemas and compendium editors exist. Bulk changes now use reviewed ID/hash bundles; legacy CSV import is a read-only preview. See [the maintained procedure](../scripts/README.md#guarded-content-change-sets).
7. **(Pozostaje)** edytor efektów dla stanów w kompendium (jeśli powstanie strona States; dziś stany autorujesz importem — jest ich 30), akcja zmiany postawy w turze (pre/post-atak), wykluczenia („Amok"), Meta/Synergy dla postaw.

**Stan: v1 kompletne end-to-end.** Silnik + model + efekt rangi + proposer + picker + autorowanie (import i edytor postaw) działają i przechodzą typecheck.
**Current data work:** classification proposals require per-rank review and the guarded apply procedure linked above. The earlier schema-introduction/db-push instruction is historical, not a prerequisite for this content-review stage.

**Rozmiar/ryzyko:** DUŻY, ale bez blockerów — reguły ustalone. Główna praca w warstwie danych (rodziny rang) + auto-cast; reszta reużywa istniejące szwy.

---

### (oryginalny plan §1, dla referencji)

**Stan obecny.** `Character` ma `stances: Mode[]` i `states: Mode[]`, gdzie `Mode = Perk` (`combat/Mode.ts`) — sama nazwa/opis/`grade`/wymagania, **bez efektów i bez wiązania mechanicznego**. `toCombatantSnapshot` **całkowicie je ignoruje** (buduje tylko maneuvers/spells). „Podnosisz rangę postaw o 1" nie ma dziś żadnego znaczenia w symulacji.

**Dlaczego to najtrudniejsze.** Żeby „ranga postawy" cokolwiek robiła, potrzeba trzech rzeczy naraz: (a) postawy muszą nieść **efekty** (jak manewry dostały pole `effects`), (b) runtime musi mieć **aktywną postawę** i jej **rangę**, (c) trzeba regułę, **co ranga skaluje**. Bez (c) reszta jest pusta.

**Model docelowy (propozycja do potwierdzenia).**
- **Efekty postaw:** rozszerzyć `Mode`/schemat postaw o `effects`/`simulatable` (dokładnie jak przy manewrach — patrz `maneuverWithEffectsSchema`), tak by postawa mogła dawać np. stały `stat` bonus.
- **Aktywna postawa w runtime:** `activeStance?: { id; rank }` w `CombatantRuntime`; wejście/zmiana postawy to akcja (jak manewr) albo parametr startowy symulacji (v1: wybór startowej postawy w pickerze).
- **Ranga jako skala:** efekty postawy skalują się jej rangą — nowe źródło `scale` `selfStanceRank` (spina się z §3). Manewr „podnosisz rangę postaw o 1" = efekt `stanceRank +1` (nowe małe pole/efekt modyfikujące `activeStance.rank`, z czasem trwania).
- Snapshot: `buildStances` (jak `buildSpells`) wnoszący postawy z efektami do snapshotu.

**Zmiany w plikach (szerokie).**
- Persystencja: schemat postaw + pola `effects` (jak maneuver split), mapowanie w `characterMapping.ts`.
- `CombatantSnapshot.ts` — `stances` + `buildStances` + opcja startowej postawy.
- `CombatState.ts` — `activeStance` + tick; `runCombat` — akcja zmiany postawy / efekt `stanceRank`.
- `Effect.ts`/schema — efekt zmiany rangi postawy + źródło scale `selfStanceRank`.
- Edytor postaw w apce (analogicznie do edytora efektów manewrów), `describeManeuver`, AI, proposer.

**Decyzje / OTWARTE PYTANIA (wymagają Ciebie / podręcznika).**
1. **Co dokładnie robi ranga postawy?** Skaluje bonusy postawy liniowo? Odblokowuje progi? To sedno — bez tego nie ma modelu.
2. **Ile postaw naraz?** Jedna aktywna czy kilka? Czy „stan" (`states`) różni się od „postawy"?
3. **Wejście/zmiana postawy** — akcja w turze (koszt?) czy stan startowy? v1 proponuję: wybór startowy + manewry mogą zmieniać rangę.
4. **Zakres v1** — czy modelować pełny system, czy tylko „postawa = pasywny profil bonusów + ranga jako mnożnik"?

**Etapy.** (0) ustalić reguły rangi z podręcznikiem; (1) postawy z efektami w danych + snapshot; (2) aktywna postawa + ranga w runtime + wybór startowy; (3) efekt „zmień rangę" + źródło scale `selfStanceRank`; (4) edytor/opis/AI/proposer.
**Rozmiar/ryzyko:** DUŻY / średnie-wysokie. Blocker = punkt (0). Dopóki reguła rangi nieznana, reszta jest spekulacją.

---

## Wspólne wnioski

- **Kolejność wg zwrotu z inwestycji:** krytyk (§4, ~godziny, prawie gotowe) → procenty (§2, czyste) → dynamiczne płaskie (§3, rozszerza scale) → postawy (§1, wymaga najpierw decyzji o regułach).
- **Golden-logi** warto dołożyć razem z §2/§4 (mnożnik + krytyk zmieniają rdzeń liczenia obrażeń — łatwo o cichą regresję).
- **Każda mechanika kończy się** wzorcem w auto-proposerze, więc każda nie tylko odblokowuje autorstwo, ale i **zmniejsza je automatycznie** (mniej wierszy „do zmapowania").
- **Zależność:** §1 (ranga postawy) reużywa źródło scale z §3 — robić §3 przed §1.
