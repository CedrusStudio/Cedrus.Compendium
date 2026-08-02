# Plan: Testy sporne (T2c) w Combat Lab

Plan implementacji — **bez kodu.** Po jego przejrzeniu wybierzesz zakres (pełny model umiejętności vs przybliżenie). Dokument uziemiony w realnych danych manewrów i w faktycznym kształcie postaci.

---

## 1. Kontekst i niezależność od Twojej pracy

Test sporny to **~22% manewrów (220 z 992)** — największy pojedynczy strumień niemodelowanej mechaniki. **Nie wymaga Twojej klasyfikacji przed startem:** budowa silnika testu spornego jest niezależna od ręcznego rozstrzygania manewrów klasy A. Autorstwo konkretnych 220 manewrów T2c przychodzi **dopiero po** zbudowaniu silnika (inaczej nie ma czym wypełniać efektów). Można to więc robić równolegle do Twojej pracy.

---

## 2. Anatomia testu spornego (z realnych danych)

Przykłady z backupu:
- *Akrobatyka* — „**Test sporny Refleksu z Refleksem/Fechtunkiem/Fortelem**. **Za każde oczko przewagi** dodaje 2 uniki."
- *Atak Rękojeścią* — „Test **fechtunku/fortelu+walka wręcz−2** vs **fechtunku/fortelu+refleks/siła/walka wręcz**. Wygrany powoduje dodaje obrażeń równych walce wręcz."
- *Atak Szubrawcy* — „Test sporny **walki wręcz+fortelu** vs walka wręcz+fortel/walka wręcz+siła. **Zadaje 1k6w obrażeń.** Tylko przeciw walce wręcz."
- *Gniewne Natarcie* — „Test sporny **siły−1** vs zręczność/siła. Wygrany powoduje dorzucenie dodatkowej kości broni i usunięcie jednej z najgorszym wynikiem."

Z tego wynika gramatyka puli:
- **`+`** — suma statów w puli (`walka wręcz + fortel`).
- **`/`** — alternatywy: wybierasz lepszą (`refleks/siła/walka wręcz` = najlepszy z tych trzech). Racjonalny gracz bierze najwyższą.
- **`±N`** — płaski modyfikator puli (`siły−1`, `walka wręcz−2`).
- **bramkowanie** — „Wygrany powoduje…", efekt odpala się tylko przy wygranej.
- **skalowanie marginesem** — „za każde oczko przewagi …" → efekt proporcjonalny do przewagi.
- Często **warunek** — „Tylko przeciw walce wręcz" (patrz wspólny mechanizm warunków z planu edytora).

---

## 3. Realny problem: snapshot nie niesie surowych statów

`CombatantSnapshot` ma dziś **pre-baked** `offenses`/`defenses` oraz trzy statystyki testowe (`initiative`, `precision`, `reflex`), ale **nie** niesie pełnego zestawu umiejętności/atrybutów (fechtunek, fortel, walka wręcz, siła, zręczność, kondycja…). Bez nich nie da się policzyć pul testu spornego. To główna zmiana infrastrukturalna tego zadania.

---

## 4. Mapowanie nazw pul PL → pola postaci (kompletne)

Postać ma `attributes` i `characteristics` (każde jako `Statistic`). Nazwy z tekstu manewrów mapują się jednoznacznie (źródło: `translations.pl-PL.ts`):

| tekst w manewrze | pole | grupa |
|---|---|---|
| fechtunek | `attributes.fencing` | atrybut |
| fortel | `attributes.artifice` | atrybut |
| precyzja | `attributes.precision` | atrybut |
| inicjatywa | `attributes.initiative` | atrybut |
| walka wręcz | `attributes.martialArt` | atrybut |
| jeździectwo | `attributes.horsemanship` | atrybut |
| wytrzymałość | `attributes.fortitude` | atrybut |
| refleks | `attributes.reflex` | atrybut |
| wola | `attributes.willpower` | atrybut |
| siła | `characteristics.strength` | charakterystyka |
| kondycja | `characteristics.constitution` | charakterystyka |
| zręczność | `characteristics.dexterity` | charakterystyka |
| umysł | `characteristics.mind` | charakterystyka |
| charyzma | `characteristics.charisma` | charakterystyka |
| czarokrwistość | `characteristics.spellborn` | charakterystyka |

**Do potwierdzenia:** czy w pulach pojawiają się nazwy spoza tej tabeli (np. „budowa", „wytrwałość" — uwaga: „wytrwałość" to podsystem chorób/zasobów, NIE „wytrzymałość"=fortitude). Skrypt klasyfikatora może wyekstrahować wszystkie nazwy pul do listy kontrolnej.

---

## 5. Model danych: `ContestedTestEffect`

Nowy wariant `Effect`:

```
type PoolTerm =
{
  // Alternatywy — wybierana najlepsza (operator "/"). Pojedynczy stat = tablica 1-elem.
  anyOf: SkillRef[];
};
type SkillRef = { group: "attributes" | "characteristics"; key: string };

type TestSide =
{
  pool: PoolTerm[];        // termy sumowane (operator "+")
  modifier?: number;       // płaski ±N do wyniku strony (np. "walka wręcz −2")
  dieGradeDelta?: number;  // zmiana rangi kości testu przez manewr (±)
  rollMod?: "advantage" | "disadvantage"; // przewaga/utrudnienie: 2 rzuty, wyższy/niższy
};

type ContestedTestEffect =
{
  type: "contested";
  attacker: TestSide;
  defender: TestSide;
  onWin: Effect[];                                       // efekty przy wygranej (margines > 0)
  // Skalowanie marginesem: efekt aplikowany floor(margines / per) razy (opcj. limit).
  perMargin?: { per: number; effect: Effect; cap?: number };
  // Do kogo trafiają onWin/perMargin: domyślnie "target" (przeciwnik); "self" dla
  // testów obronnych typu Akrobatyka ("dodaje 2 uniki" = self-buff).
  onWinTarget?: "self" | "target";
};
```

Zakres modyfikacji per strona wynika z potwierdzenia autora (§7 pyt. 4): **płaski modyfikator puli**, **zmiana rangi kości**, **przewaga/utrudnienie na rzut**. Dodawanie/zamiana statystyki w puli NIE jest potrzebne.

To pozwala wyrazić wszystkie zaobserwowane wzorce: sumy (`pool` wielu termów), alternatywy (`anyOf`), modyfikatory (`modifier`), bramkowanie (`onWin`), skalowanie („za każde oczko" → `perMargin: { per: 1, effect }`).

---

## 6. Umiejętności w snapshocie (plumbing)

- `CombatantSnapshot` zyskuje `skills: { attributes: Record<string, Statistic>; characteristics: Record<string, Statistic> }` (lub spłaszczoną mapę `Record<string, Statistic>`).
- `toCombatantSnapshot` kopiuje `buffed.attributes` i `buffed.characteristics` (już po nałożeniu aktywnych profili — atrybuty są buffowane w `applyActiveBuffProfile`). Zero nowych zależności; to samo źródło co `precision`/`reflex` dziś.
- Rozmiar snapshotu rośnie o ~15 statystyk — nieistotne dla wydajności workerów.

---

## 7. Mechanika rzutu (POTWIERDZONA)

Reguły potwierdzone przez autora systemu:

1. **Wkład statystyki do puli** = `getStatisticTotalTestValue(stat)` = `value + bonus + testBonus` (dokładnie istniejąca funkcja w kodzie — spójne z testami dystansowymi).
2. **Pula sumowana `A+B`**: `wynik = roll(maxGrade) + Σ getStatisticTotalTestValue(term) + modifier`, gdzie `maxGrade` = najwyższa ranga wśród sumowanych termów, a `roll(g)` = kość `k(g×2)` (istniejące `roll`). Czyli: JEDNA kość z rangi wyższego statu + pełne wartości wszystkich sumowanych statów.
3. **Alternatywy `A/B`** (operator „/"): wybierany term maksymalizujący **`getStatisticTotalTestValue + grade`** (uwzględnia i wartość testu, i rangę kości). Wybrany term wchodzi do sumy i jego ranga liczy się do `maxGrade`.
4. **Wygrana**: `margines = wynikAtakującego − wynikObrońcy`; efekt odpala się, gdy `margines > 0`. **Remis (0) = obrońca** (brak efektu).
5. **Skalowanie**: „za każde oczko przewagi" = **każdy punkt marginesu** → `perMargin.effect` aplikowany `floor(margines / per)` razy (`per = 1` dla „za każde oczko"), z opcjonalnym limitem („maks. X").
6. **Determinizm**: oba rzuty z seedowanego rng (test konsumuje 2 losowania). Golden-log obowiązkowy.

Ten element nie ma już niewiadomych — reszta zależała tylko od tej reguły.

---

## 8. Integracja (punkty styku)

- **`applyEffect`** — nowy case `"contested"`: policz pule (z `source.snapshot.skills` i `target.snapshot.skills`), rozstrzygnij margines, przy wygranej zaaplikuj `onWin` do wskazanego celu, a `perMargin.effect` — `floor(margines / per)` razy (rekurencyjnie przez `applyEffects`). Zaloguj wynik testu (nowy event `contestedTest` do Replayu).
- **`describeManeuver`** — „test sporny (fechtunek/fortel + walka wręcz −2) vs (…): przy wygranej …; za każde oczko przewagi …".
- **`policyValue`** — wartość ≈ `P(wygranej) × wartość(onWin)` + oczekiwana wartość skalowania. `P(wygranej)` z porównania wartości pul (przybliżenie normalne albo szybka symulacja Monte Carlo kilkuset rzutów przy wycenie — deterministyczna).
- **`effectSchema`** — gałąź `contested` (rekurencyjna: `onWin`/`perMargin.effect` to `Effect[]`).
- **`rulesValidator`** — walidacja: pula niepusta, znane nazwy statów, `onWin` niepuste, `perMargin.per ≥ 1`.
- **Narzędzie HTML + edytor** — builder puli: dodawanie termów (z alternatywami `/`), modyfikator, `onWin` jako zagnieżdżone efekty, opcjonalne `perMargin`. To najbardziej złożony element UI; można go dodać po rdzeniu silnika.
- **Replay** — pokazać wynik testu i margines w przebiegu.

---

## 9. Dwie drogi zakresu (Twoja decyzja po tym planie)

**A. Pełny model umiejętności** — dołożyć `skills` do snapshotu i liczyć pule dokładnie wg mapowania z §4. Wierne regułom, pokrywa wszystkie 220 manewrów poprawnie. Koszt: plumbing snapshotu + potwierdzenie kości testu + builder pul.

**B. Przybliżenie ze statystyk** — na start liczyć margines z już dostępnych `precision`/`reflex`/`initiative` (bez pełnych umiejętności), traktując pulę jako pojedynczy zastępczy stat. Szybsze, ale **niewierne** (manewr „test siły vs zręczność" nie ma jak się policzyć poprawnie) i myląca dla balansu. Łatwo później podmienić na A.

**Rozstrzygnięte: robimy A (pełny model).** Potwierdzona mechanika (§7) operuje na konkretnych umiejętnościach (fechtunek, walka wręcz, siła, zręczność…), więc przybliżenie (B) jest wykluczone — pule muszą czytać realne staty. Koszt ponad B to skopiowanie ~15 statów do snapshotu (trywialne); reguła kości testu jest już potwierdzona.

---

## 10. Etapy

1. **Ekstrakcja pul** (skrypt): wyciągnąć z 220 manewrów T2c wszystkie nazwy statów i operatory → lista kontrolna, potwierdzenie mapowania §4 i wyłapanie nazw spoza tabeli.
2. **Kość testu**: potwierdzić regułę pul w podręczniku (§7).
3. **Snapshot**: dołożyć `skills` do `CombatantSnapshot` + `toCombatantSnapshot` (+ test).
4. **Model + schemat**: `ContestedTestEffect` + `effectSchema` + `describeManeuver` + walidator.
5. **Silnik**: case `"contested"` w `applyEffect` (rozstrzygnięcie, bramkowanie, skalowanie, log) + event Replay + testy golden-log (determinizm).
6. **Wycena AI**: `policyValue` dla `contested`.
7. **UI**: builder pul w narzędziu HTML i/lub edytorze w apce.
8. **Autorstwo**: mapowanie 220 manewrów T2c (po zbudowaniu silnika).

---

## 11. Status ustaleń

Wszystkie kluczowe reguły **potwierdzone** (§7): wkład statystyki = `value+bonus+testBonus`; pula sumowana = jedna kość z najwyższej rangi + suma wartości; alternatywy = max `(wartość testu + ranga)`; wygrana gdy margines > 0, remis = obrońca; skalowanie per 1 punkt marginesu z opcjonalnym limitem; modyfikacje manewru = płaski modyfikator / zmiana rangi kości / przewaga-utrudnienie.

Pozostały drobiazgi do potwierdzenia na etapie autorstwa (nie blokują rdzenia):
1. **Nazwy pul spoza tabeli §4** — wyłapane skryptem (etap 1). Ustalenia autora:
   - **„morale"** (6 manewrów, „test morale") → **T3 / niesymulowalne** (wynika z woli + niezależne bonusy, mechanika nieuściślona). Oznaczyć te 6 jako `simulatable=false`.
   - **„wytrwałość"** (89 manewrów, „Test wytrwałości o ST=X") → **osobna statystyka** (nie fortitude=„wytrzymałość"!). Wpływa na HP i przeciwstawia się testom ciała/chorób/zmęczenia/wpływów magicznych. Uwaga: to **test przeciw STAŁEMU ST** (save), nie sporny — patrz nowy element niżej. Duża część tych 89 i tak jest T3 przez podsystem chorób.
   - **`constitution`** ma dwie nazwy PL: „kondycja" (tłumaczenia) i „budowa" (`allowedCharacteristics`) — mapować oba.
2. **`onWinTarget`** — poprawnie oznaczyć testy obronne (efekt na siebie) vs zaczepne (na cel) podczas mapowania manewrów.
3. **Limity skalowania** — wpisać `cap` tam, gdzie tekst mówi „maks. X".

## 13. Element pokrewny (przyszły): test przeciw stałemu ST (save)

„Test wytrwałości o ST=7. Za każde oczko straty zadaje 1dmg" to **rzut jednego statu przeciw stałej wartości ST**, ze skalowaniem marginesem PORAŻKI. To rodzeństwo `ContestedTestEffect`, gdzie „obrońca" jest liczbą, nie pulą. Do zrobienia osobno:
- dołożyć stat **„wytrwałość"** do modelu postaci i snapshotu (dziś go tam nie ma — wymaga znalezienia/utworzenia pola; wpływa też na HP wg podręcznika),
- efekt `saveTest { pool: TestSide; st: number; onFail: Effect[]; perMarginOfFailure?: ... }` albo rozszerzyć `ContestedTestEffect` o wariant „defender = stałe ST".
Nie blokuje testu spornego; wiele manewrów „wytrwałości" pozostanie T3 przez podsystem chorób.

---

## 12. Ryzyka

- **Determinizm**: test konsumuje dodatkowe losowania z rng — golden-log obowiązkowy, żeby Replay/raport były reprodukowalne.
- **Balans**: błędna kość testu przekłamie wszystkie 220 manewrów naraz — dlatego etap 2 (potwierdzenie reguły) przed masowym autorstwem.
- **Złożoność UI**: builder pul + zagnieżdżone `onWin` to najbardziej rozbudowany formularz; można go dostarczyć po rdzeniu, a na start autorować przez surowy JSON w narzędziu (furtka już istnieje).
