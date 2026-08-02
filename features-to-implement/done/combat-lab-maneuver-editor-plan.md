# Plan: Edytor efektów manewrów (Combat Lab)

Plan — **bez implementacji.** Cel: sprawić, by manewry realnie działały w symulacji (dziś mają puste `effects` i nie są wybierane). Osadzony w realnym kodzie.

---

## 1. Realny stan

- **`Maneuver` to tekst.** Model Prisma `maneuvers` (`prisma/schema.prisma`): `name`, `grade`, `description` (wolny tekst), `requirements: string[]`, `price`, `castTime`, `cooldown`, `tags`. **Brak pola `effects`.** Domenowy `Maneuver = Perk & Castable` — też bez efektów.
- **Snapshot podnosi manewry z pustymi efektami.** `toCombatantSnapshot` → `toManeuverDefinition(m)` ustawia `effects: []`. Polityki (`valuePolicy`/`greedyDamage`) wyceniają manewr po efektach → 0 → nie wybierają (przegrywa z „pass"/atakiem).
- **Model efektów istnieje i działa** (`Effect`, `applyEffect`, `effectSchema` Zod, `describeManeuver`, plus escape-hatch `CustomEffect` z pluginów). Brakuje tylko: (a) danych (efekty na manewrach) i (b) edytora do ich tworzenia.

---

## 2. KROK 0 (WYKONANY): analiza tekstów manewrów z backupu

Backup: `backup/2026-07-19T16-14-20-698Z/Maneuver.json`. Przeanalizowano **992 rekordy** (warianty rang) / **567 unikalnych nazw** — **wszystkie mają opis** w polu `description` (wolny tekst PL). Kategoryzacja po wzorcach (bucket priorytetowy, pierwsze trafienie):

| % | udział | kategoria |
|---|---|---|
| 42.5% | 422 | inne / nieokreślone (przy próbkowaniu: warunkowe „+X dmg", „dodaje widmową kość k4", „+10 pwT bariery") |
| **28.7%** | **285** | **test sporny (rzut przeciwstawny)** — nowa mechanika, dziś jej brak |
| 12.9% | 128 | redukcja / obrona (`zmniejsza obrażenia o N/o N%`, dodaje redukcji/odporności) |
| 4.6% | 46 | krytyk (modyfikuje siłę/szansę krytyka lub efekt przy krytyku) |
| 4.0% | 40 | ranga kości (podnosi/zmienia rangę kości) |
| 2.8% | 28 | dodatkowa kość obrażeń/broni |
| 1.8% | 18 | postawy / rangi (buff) |
| 1.4% | 14 | manipulacja kością (reroll, wybór wyższej/niższej) |
| 0.5% | 5 | leczenie · 0.5% ruch · 0.1% płaskie +obrażenia |

**Kluczowa korekta względem założeń:** największą niemodelowaną mechaniką jest **test sporny (~29%, plus wiele z „inne")**, a nie manipulacja kośćmi (łącznie ~8%). Przykłady z danych:
- Test sporny: *Akrobatyka* — „Test sporny Refleksu z Refleksem/Fechtunkiem/Fortelem. **Za każde oczko przewagi** dodaje 2 uników."; *Atak Szubrawcy* — „Test sporny walki wręcz+fortelu vs … Zadaje 1k6w obrażeń. Tylko przeciw walce wręcz."
- Skalowanie marginesem: „za każde oczko przewagi …" — efekt **proporcjonalny do przewagi** w teście.
- Warunki/wyzwalacze: „Tylko przeciw walce wręcz", „atakując z powietrza", „Trafienie krytyczne zamiast siły krytyka …", „za każdą kość broni skierowaną przeciwko tobie".
- Manipulacja kością (realne): *Antyecho* — „Przeciwnik rzuca dwiema takimi kośćmi i wybiera mniejszą"; *Echo Noworodnika* — „Rzucasz dodatkową kością broni i wybierasz dwa dowolne wyniki"; *Gniew Wampira* — „przerzut każdej kości bez krytyka, ale siła krytyka −1"; *Niewzruszona Obrona* — „przerzut kości obrażeń przeciwnika **już po ataku**" (reaktywny, koszt „5H").
- Wartości referencyjne: „obrażeń **równych walce wręcz**" — efekt czyta wartość statystyki (polityka „value" już to modeluje po stronie wyceny).

**Wniosek:** minimalny słownik pokrywający ~80% to: (1) płaskie/warunkowe obrażenia i kości [już mamy], (2) buffy redukcji/obrony/postaw [już mamy], (3) **test sporny ze skalowaniem marginesem [NOWE — największy zysk]**, (4) modyfikatory rzutu [NOWE — mniejszy zbiór], (5) warunki/wyzwalacze jako wspólny mechanizm.

---

## 3. Trzy klasy manewrów (po analizie)

### Klasa A — wyrażalne OBECNYM modelem `Effect` (większość)

Zadaj obrażenia (płaskie lub warunkowe), dodaj kość, nałóż status/kontrolę, wylecz, dodaj barierę, „z szansą X% …". **W tym kluczowe: „manewr nakłada chwilowy buff" — dokładnie jak działa dziś edytor wzmocnień.** Efekt `buff`/`debuff` aplikuje `BuffProfile` na czas trwania (self-buff podnosi Offense na najbliższy atak). Manewr „+2 obrażeń na 1 rundę" = efekt `buff` wskazujący profil z bonusem. **Zero nowej mechaniki silnika** — tylko dane + edytor. Uwaga: wiele opisów ma **warunek** („atakując z powietrza", „tylko przeciw walce wręcz") — patrz wspólny mechanizm warunków (§3.4).

### Klasa B — modyfikujące RZUT (mniejszy zbiór, ~8%)

**reroll kości**, **weź wyższą/niższą z dwóch**, **dodatkowa kość z wyborem wyników**, zmiana rangi kości. **Nie** dają się wyrazić jako efekt post-hoc — działają **na etapie rzutu** (`rollOffense`/`resolveAttack`). Potrzeba nowego `RollModifierEffect` z wariantami (do potwierdzenia na próbie danych):
- `rerollDice` — przerzuć wskazane kości (np. te bez krytyka, jak *Gniew Wampira*, z modyfikatorem `siła krytyka −1`),
- `keepBest`/`keepWorst` — rzuć N, weź k najlepszych/najgorszych (jak *Echo Noworodnika*, *Gniewne Natarcie*),
- `extraWeaponDie` / `changeDieRank`.

**Realizacja:** modyfikator ląduje na runtime jako aktywny znacznik (jak `ActiveBuff`); `rollOffense`/`resolveAttack` sprawdzają go **przy rzucie**. Wymaga **hooka w `rollOffense`** (dziś czysty rzut). Część jest **reaktywna** („po ataku przeciwnika", *Niewzruszona Obrona*) → spina się z istniejącym hookiem reakcji. **Determinizm:** reroll/keepBest **konsumują dodatkowe liczby z seedowanego `Rng`** — spójnie i z golden-logiem.

### Klasa C — TEST SPORNY (~29%, NAJWIĘKSZY brak w silniku)

Manewr wykonuje **rzut przeciwstawny**: `pula atakującego` (np. `fechtunek/fortel + walka wręcz −2`) vs `pula obrońcy` (np. `refleks/siła/walka wręcz`); **wynik bramkuje** efekt („Wygrany powoduje…"), a **margines często skaluje** efekt („za każde oczko przewagi dodaje 2 uników"). Dziś silnik nie ma pojęcia rzutu przeciwstawnego opartego na **umiejętnościach/atrybutach postaci** (Offense/Defense są pre-baked, nie ma dostępu do surowych umiejętności typu „walka wręcz", „fortel").

Potrzeba:
- nowy `ContestedTestEffect { attackerPool; defenderPool; onWin: Effect[]; perMarginOfSuccess?: Effect }`,
- dostęp w snapshocie do **surowych umiejętności/atrybutów** używanych w pulach (dziś snapshot ich nie niesie — trzeba dołożyć mapę `skills`/`attributes`),
- parser/słownik nazw umiejętności PL („fechtunek", „fortel", „walka wręcz", „refleks", „siła", „zręczność") → pola postaci.

To **osobny, największy strumień pracy** — świadomie wydzielony jako Etap 3B (może powstać po Etapie 2/3A).

### 3.4. Wspólny mechanizm: warunki i wyzwalacze

Powtarzają się warunki („tylko przeciw walce wręcz", „atakując z powietrza", „przy trafieniu krytycznym", „za każdą kość skierowaną przeciwko tobie"). Zamiast kodować je w każdym efekcie — wspólny `condition?` / `trigger?` na efekcie (predykat po stanie walki), czytany przez `applyEffect`/silnik. Zakres warunków wynika z próby danych (Etap 0 rozszerzony: policzyć najczęstsze frazy warunkowe).

---

## 4. Model danych i integracja ze snapshotem

- **Prisma:** dodać `effects Json?` do modelu `Maneuver` (typ `Json`, jak `configuration` w `BattlePreset` — bez ręcznego stringify). `hardRequirements Json?` opcjonalnie.
- **Domena:** rozszerzyć `Maneuver` o opcjonalne `effects?: Effect[]` (i `hardRequirements?`), mapowane z rekordu. Wtedy `toManeuverDefinition` używa realnych efektów zamiast `[]`.
- **Ścieżka do snapshotu:** postać trzyma manewry (relacja `characterIds`), więc efekty muszą dojechać razem z manewrem — najprościej na rekordzie `Maneuver`. `toCombatantSnapshot` już bierze `character.maneuvers`; po dodaniu `effects` zadziała bez zmian w combat-lab.
- **Backfill:** skrypt `scripts/backfill-maneuver-effects.ts` (wzorzec istniejących `backfill-*.ts`) — na start `effects: []`; wypełnianie to praca redakcyjna w edytorze (albo półautomatyczna z analizy tekstu z kroku 0).

---

## 5. Edytor (UI)

- **Miejsce:** kompendium manewrów (`/compendium/maneuvers`) — edycja manewru zyskuje sekcję „Efekty". (Combat Lab tylko konsumuje efekty; nie edytuje.)
- **Stack:** React Hook Form + `@hookform/resolvers` + `effectSchema` (Zod — **już istnieje**). Lista efektów (dodaj/usuń/zmień typ), formularze per typ efektu, **podgląd na żywo** przez `describeManeuver` (już istnieje).
- **Self-buff jak wzmocnienia:** dla efektu `buff`/`debuff` reużyć kreator profilu z rozbudowanych wzmocnień (patrz `combat-lab-buff-expansion-plan.md`) — spójny UX „manewr nakłada taki buff".
- **Walidacja:** ten sam `effectSchema`; plus Rules Validator (już istnieje) wyłapie martwe/niepoprawne manewry.

---

## 6. Etapy

0. **✅ Analiza tekstów manewrów z backupu** (992 rekordy) — WYKONANA, wyniki w §2. Rozszerzenie: policzyć najczęstsze frazy warunkowe pod §3.4.
1. **Dane:** `effects Json?` na `Maneuver` (Prisma) + domena `Maneuver.effects` + mapping + backfill; `toManeuverDefinition` czyta realne efekty.
2. **Edytor klasy A** (efekty istniejące, w tym self-buff, obrażenia warunkowe, kości, redukcja/postawy) w kompendium manewrów + podgląd + walidacja. **Pokrywa ~60% manewrów najmniejszym kosztem.**
3A. **Klasa B:** `RollModifierEffect` + hook w `rollOffense`/`resolveAttack` (+ reaktywne przez istniejący hook reakcji) + determinizm (rng) + testy golden-log.
3B. **Klasa C (test sporny):** `ContestedTestEffect` + dołożenie surowych umiejętności/atrybutów do snapshotu + słownik nazw PL → pola postaci + skalowanie marginesem. **Największy strumień — osobno.**
4. **Warunki/wyzwalacze** (§3.4): wspólny `condition?`/`trigger?` na efekcie.
5. **Redakcja/backfill:** uzupełnienie efektów manewrów (ręcznie lub półautomatycznie z parsera opisów; zacząć od manewrów w aktywnych buildach).

---

## 7. Otwarte pytania

1. **Gdzie trzymać efekty** — na rekordzie `Maneuver` (rekomendacja) czy w osobnym store `ManeuverDefinition` keyed by id?
2. **Zakres klasy C (test sporny)** — to ~29% manewrów, ale wymaga surowych umiejętności/atrybutów w snapshocie i słownika pul PL. Czy robimy pełny model rzutu przeciwstawnego, czy na start upraszczamy (np. margines liczony z Offense/Defense przybliżenia)? Największa decyzja projektowa.
3. **Kształt klasy B** — potwierdzić listę wariantów `RollModifierEffect` na pełnej próbie (14 reroll + 28 dodatkowa kość + 40 ranga kości; część nakłada się z testem spornym, jak *Gniewne Natarcie*).
4. **Determinizm rerollu/przewagi** — dodatkowe rzuty z `Rng` nie mogą psuć reprodukowalności (Replay/raport). Golden-log obowiązkowy.
5. **Warunki/wyzwalacze** — jeden wspólny `condition?`/`trigger?` (§3.4) vs osobne typy. Rekomendacja: wspólny predykat; słownik warunków z próby danych.
6. **Skala redakcji** — 567 unikalnych manewrów to duża praca redakcyjna. Zacząć od manewrów w aktywnych buildach; resztę zostawić `effects: []` (Rules Validator już oznacza „martwe").

---

## 8. Podsumowanie

Analiza 992 manewrów z backupu pokazała **trzy** klasy, nie dwie. Klasę A (obrażenia/kości/buffy/redukcja, ~60%) domknie sam **edytor efektów** na istniejącym modelu — w tym „manewr = chwilowy buff" (jak wzmocnienia). Klasa B (reroll / wyższa z dwóch kości, ~8%) wymaga **modyfikatorów rzutu z hookiem w `rollOffense`** i ostrożności o determinizm. **Największym i wcześniej niedocenionym brakiem jest klasa C — test sporny (~29%)**, wymagający modelu rzutu przeciwstawnego i surowych umiejętności w snapshocie; to osobny, największy strumień. Rekomendacja kolejności: A → B → warunki → C. Edytor stawiamy raz (klasa A), a kolejne klasy dokładają typy efektów i hooki silnika.
