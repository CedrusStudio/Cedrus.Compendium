# Plan: Analiza manewrów z backupu → mapowanie na efekty (z triażem symulowalności)

Plan — **bez implementacji.** Dokument-siostra do `combat-lab-maneuver-editor-plan.md`: tam jest **model efektów i edytor**, tu jest **proces**, jak przejść 992 manewry, przypisać im efekty i **świadomie odrzucić te zbyt specyficzne** (oznaczyć jako niesymulowalne, zamiast udawać, że działają).

Źródło: `backup/2026-07-19T16-14-20-698Z/Maneuver.json` — **992 rekordy** (warianty rang), **567 unikalnych nazw**, wszystkie z opisem PL w polu `description`.

---

## 1. Zasada nadrzędna: trzy wyniki, nie dwa

Każdy manewr po analizie trafia do jednego z trzech stanów — a **„niesymulowalny" jest pełnoprawnym, docelowym wynikiem**, nie porażką:

1. **Zmapowany** — ma `effects[]`; działa w symulacji.
2. **Do zmapowania** — rozpoznany, mechanika jasna, ale wymaga typu efektu, którego jeszcze nie zbudowano (klasa B/C z planu edytora). Czeka w kolejce.
3. **Niesymulowalny** — `simulatable = false` + `unsupportedReason`. Świadomie poza symulacją, bo mechanika wychodzi poza model walki 1‑na‑1 (podsystemy: choroby/trucizny, esencja, many, cooldowny cudzych manewrów, środowisko/pozycja, wierzchowce, narracja).

Bez stanu (3) baza „efektów pustych" jest dwuznaczna: nie wiadomo, czy manewr *czeka na autorstwo*, czy *nigdy nie zadziała*. Rozróżnienie jest kluczowe dla walidatora i dla oceny pokrycia.

---

## 2. Triaż na realnych danych (zgrubny automat)

Klasyfikacja priorytetowa 992 rekordów (pierwsze trafienie wzorca):

| % | udział | poziom | znaczenie |
|---|---|---|---|
| 16.1% | 160 | **T1 — wyrażalne teraz** | płaskie/skalowane obrażenia, dodatkowa kość, bufy redukcji/uniku/odporności, bariera, leczenie, kontrola, postawy → istniejący model `Effect` |
| 15.1% | 150 | **T2b — modyfikator rzutu** | reroll, wybór wyższej/niższej, dodatkowa kość z wyborem, ranga kości → nowy `RollModifierEffect` + hook w `rollOffense` |
| 21.7% | 215 | **T2c — test sporny** | rzut przeciwstawny na umiejętnościach, efekt skalowany marginesem → nowy `ContestedTestEffect` + surowe umiejętności w snapshocie |
| 15.8% | 157 | **T3 — prawdopodobnie niesymulowalne** | markery podsystemów (esencja, wytrwałość/choroba/trucizna, many, odnowienia, wierzchowiec) |
| 31.2% | 310 | **T? — do ręcznej oceny** | nie złapane wzorcem; przy próbkowaniu głównie T1 (dodatkowe kości/płaskie dmg) i część T3 |

**Markery „off‑sim"** (≥1 marker ma **17.4%** rekordów): wytrwałość/choroba/trucizna **93**, esencja **39**, many/czar **16**, cooldown/odnowienie **15**, środowisko/pozycja **14**, wierzchowiec/towarzysz **4**, interakcja z cudzym manewrem **6**.

**Wnioski o pokryciu (szacunek):** realistycznie **~45–55%** manewrów da się uczynić symulowalnymi bez wielkiej przebudowy (T1 + T2b), kolejne **~20%** po zbudowaniu testu spornego (T2c), a **~15–20%** świadomie zostanie oznaczonych jako niesymulowalne (T3). To jest zdrowy, uczciwy podział — nie próbujemy wcisnąć chorób i esencji do silnika walki.

---

## 3. Czy model efektów ogarnie „specyficzne" sytuacje?

Z próbek widać cztery poziomy specyficzności — i granicę, za którą odpuszczamy:

**Ogarnie (rozszerzenie istniejącego modelu):**
- **Skalowanie** („za każdą niewrażliwość wroga +2 dmg", „za każde oczko przewagi +2 uniki", „+1 wytrwałości za każde 4 esencji max 5") → wspólny `scaling: { per: <źródło>; amount; max? }` na efekcie. Źródła policzalne w stanie walki (kości wroga, margines testu, warstwy obrony) są OK.
- **Warunki** („atakując z powietrza", „tylko przeciw szarży", „tylko przeciw walce wręcz") → wspólny `condition` (predykat po stanie walki / trybie ataku). Część warunków jest reprezentowalna (tryb ataku, dystans, staggered), część nie (patrz niżej).
- **Wartości referencyjne** („obrażeń równych walce wręcz", „dodaje bazowy fechtunek do obrażeń") → efekt czyta wartość umiejętności; wymaga surowych umiejętności w snapshocie (wspólne z T2c).

**Nie ogarnie sensownie → T3 (niesymulowalne):**
- Podsystemy spoza walki 1‑na‑1: **choroby/trucizny** (skala trudności, stacki, testy wytrwałości co rundę poza modelem), **esencja/many** (ekonomia zasobów nieistniejąca w snapshocie), **wierzchowce/towarzysze**.
- **Interakcje między manewrami** i **manipulacja cooldownami** przeciwnika („wydłuża odnowienie manewru defensywnego przeciwnika") — wymagają modelu kolejek manewrów obu stron i cooldownów, których silnik nie prowadzi.
- **Warunki narracyjno‑pozycyjne** bez reprezentacji w silniku („z ukrycia", „flankując", „za plecami") — dopóki Scenario/pozycjonowanie nie modeluje pozycji, traktujemy jako niesymulowalne albo (opcja) jako założenie scenariusza (flaga w Scenario Builderze).

**Reguła kciuka do decyzji T3:** jeśli poprawne rozstrzygnięcie manewru wymaga stanu, którego snapshot/CombatState **nie niesie i nie planujemy dołożyć** (zasoby, choroby, pozycja, cudze cooldowny), → `simulatable = false` z konkretnym `unsupportedReason`. Nie przybliżamy „na oko" — to psułoby balans.

---

## 4. Jak dodawać efekty — pipeline autorstwa

1. **Model danych (prereq, z planu edytora):** `effects Json?` na `Maneuver`. **Dodatkowo tutaj:** `simulatable Boolean?` (domyślnie `null` = nieoceniony) i `unsupportedReason String?`. Trzy pola razem kodują stan z §1.
2. **Notacja mapowania:** dla każdego manewru autor zapisuje listę efektów w edytorze (kompendium manewrów). Efekty walidowane `effectSchema` (Zod, istnieje). Wspólne pola `condition?` i `scaling?` (§3) dokładane do modelu `Effect`.
3. **Ścieżka do symulacji:** `toManeuverDefinition` czyta realne `effects` zamiast `[]`. Manewr z `simulatable=false` **nie trafia do puli** ruchów (albo trafia oznaczony i polityki go pomijają) — inaczej niż „pusty, ale czekający".
4. **Walidator:** Rules Validator rozróżnia trzy komunikaty — „zmapowany OK", „**do zmapowania** (brak efektów, oczekuje typu X)", „**niesymulowalny** (powód: …)". Dziś ma tylko „martwe mechaniki (brak efektów)" — rozbić na dwa.
5. **Podgląd:** `CombatantStatsCard` już oznacza manewry bez efektów amber „nie zostanie użyty"; rozszerzyć o trzeci stan „niesymulowalny (powód)".

---

## 5. Workflow analizy (batchami, półautomat → człowiek)

Nie robimy 992 na raz. Przebieg iteracyjny per kategoria triażu:

1. **Auto‑klasyfikacja** (skrypt, rozszerzenie tego z analizy): każdemu rekordowi nadaj wstępny `tier` (T1/T2b/T2c/T3/T?) + wykryte markery. Eksport do CSV do przeglądu.
2. **Przegląd ludzki** partiami — zacząć od **T1** (największy zysk, zero pracy silnikowej) i **manewrów z aktywnych buildów** (te, które realnie wpłyną na balans). Potwierdź tier, dla T3 wpisz `unsupportedReason`.
3. **Autorstwo T1** w edytorze → `effects[]`. Po drodze uzupełniać słownik `condition`/`scaling` o realnie napotkane przypadki (nie spekulować).
4. **Budowa silnika T2b, potem T2c** (osobne strumienie z planu edytora) → odblokowanie kolejnych partii.
5. **Raport pokrycia** po każdej partii: ile zmapowanych / do zmapowania / niesymulowalnych, % rekordów i % *unikalnych nazw*. Cel: świadomie rosnące pokrycie, nie 100%.

---

## 6. Kryteria akceptacji „symulowalne" (checklist na rekord)

Manewr jest `simulatable=true` tylko gdy **wszystkie** spełnione:
- efekt da się wyrazić dostępnym typem `Effect` (T1) lub zaplanowanym (T2b/T2c po zbudowaniu),
- wszystkie jego **warunki** są reprezentowalne w stanie walki (tryb ataku / dystans / stagger / margines testu),
- wszystkie jego **źródła skalowania** są policzalne ze snapshotu/CombatState,
- nie zależy od podsystemu poza modelem (zasoby, choroby, cudze cooldowny, pozycja) — chyba że ten podsystem świadomie dołożono.

Inaczej → `simulatable=false` + jednozdaniowy `unsupportedReason` (np. „skaluje się esencją — brak modelu zasobów", „manipuluje cooldownem manewru przeciwnika — brak modelu kolejek").

---

## 7. Dodatki do modelu danych (podsumowanie)

- `Maneuver.effects Json?` — lista efektów (wspólne z planem edytora).
- `Maneuver.simulatable Boolean?` — `null` nieoceniony / `true` / `false`.
- `Maneuver.unsupportedReason String?` — powód dla `false`.
- `Effect.condition?` — predykat aktywacji (tryb ataku, dystans, stagger, „tylko przeciw szarży").
- `Effect.scaling?` — `{ per: źródło; amount; max? }` (per‑niewrażliwość, per‑margines, per‑kość).

---

## 8. Kolejność i kamienie milowe

1. **Skrypt auto‑klasyfikacji + eksport CSV** (rozszerzenie analizy z tego dokumentu) — daje roboczą listę 992 z tierami.
2. **Model danych:** `effects`/`simulatable`/`unsupportedReason` + walidator trójstanowy + podgląd.
3. **Partia T1** (autorstwo, ~160+ z T? → realnie kilkaset) — pierwszy realny efekt w symulacji.
4. **T2b** (modyfikatory rzutu) → autorstwo kolejnej partii.
5. **T2c** (test sporny) → największy strumień; autorstwo.
6. **Oznaczenie T3** jako niesymulowalne z powodami — domyka bazę, walidator przestaje zgłaszać je jako „martwe".

**Miara sukcesu:** nie „100% manewrów w symulacji", lecz **każdy manewr ma jednoznaczny stan** (zmapowany / w kolejce / niesymulowalny‑z‑powodem) oraz rosnące, uczciwe pokrycie mechanik faktycznie wpływających na balans.
