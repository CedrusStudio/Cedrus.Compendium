# Plan: Usprawnienia symulatora (wybór ofensywy/obrony, podgląd, raport, niewrażliwość)

Plan — **bez implementacji.** Cztery drobne, niezależne usprawnienia. Każde osadzone w realnym kodzie; wszystkie potwierdzone jako wykonalne bez zmian w rdzeniu silnika.

---

## 1. Wybór konkretnej ofensywy / obrony (gdy jest więcej niż jedna)

**Stan:** snapshot niesie **tablice** `offenses[]` i `defenses[]` oraz `defaultOffenseId`/`defaultDefenseId` (`CombatantSnapshot.ts`). Silnik używa `selectDefaultOffense`/`selectDefaultDefense` → bierze profil domyślny **albo pierwszy**. `CombatantSelection` nie pozwala wskazać, którego użyć — postać z kilkoma zestawami broni/obrony zawsze walczy „domyślnym".

**Zmiana:**
- `CombatantSelection` (`builder/combatantSelection.ts`): dodać opcjonalne `offenseId?: string` i `defenseId?: string`.
- `buildSnapshotFromSelection`: po zbudowaniu snapshotu **nadpisać** `defaultOffenseId`/`defaultDefenseId` wybranym id (jeśli podane). Dzięki temu `selectDefault*` w silniku zadziała bez zmian — zero ingerencji w hot-loop.
- `CombatantPicker.tsx`: dwa `Select` — **renderowane tylko gdy `offenses.length > 1` / `defenses.length > 1`** (inaczej ukryte, bez szumu). Etykieta pozycji przez `toOffenseString(offense.leadingWeapon)` / opis obrony (warstwy).
- `CombatantStatsCard` już pokazuje aktywną ofensywę/obronę → od razu odzwierciedli wybór.

**Uwaga:** wymaga załadowanego `character` (żeby znać listę profili) — picker już go ma przez `useCharacterById`.

---

## 2. Lepszy podgląd statystyk + zwijanie (domyślnie zwinięte)

**Stan:** `CombatantStatsCard` renderuje się na stało pod pickerami w `SimulationRunner.tsx` (`previewA`/`previewB`) — zawsze rozwinięty, zajmuje dużo miejsca.

**Zmiana:**
- Owinąć każdą kartę w `Collapsible` (jest w `common/components/ui`) — nagłówek „Statystyki A: {nazwa}" jako trigger, treść zwijana. **`defaultOpen={false}`** (domyślnie zwinięte).
- „Lepszy podgląd": w nagłówku (widocznym też po zwinięciu) pokazać skrót jednoliniowy — tryb ataku, HP, liczba manewrów — żeby zwinięta karta niosła sens bez rozwijania. Rozwinięcie odsłania pełny `CombatantStatsCard` (atak, obrona, statystyki, lista manewrów z markerem „brak efektów").
- Stan zwinięcia lokalny (useState) per karta; opcjonalnie zapamiętany w `localStorage` (spójne z artefaktami — ale w SPA wystarczy stan komponentu).

**Pliki:** `runner/SimulationRunner.tsx` (owinięcie), `builder/CombatantStatsCard.tsx` (opcjonalny prop `summaryLine` / rozbicie na nagłówek+treść).

---

## 3. Raport: id zwycięzcy i id przegranego

**Stan:** `SimulationReport.tsx` pokazuje Win Rate per postać (`summary.winRates[a.id]`, `[b.id]`) i średnie HP zwycięzcy, ale **nie** wskazuje wprost, który build wygrał, a który przegrał serię.

**Zmiana:**
- **Wyznaczenie:** zwycięzca = wyższy `winRates`; przegrany = niższy; przy równych (lub przewadze remisów) → oznaczyć „nierozstrzygnięte". Do rozważenia: policzyć w raporcie (derive) vs utrwalić w `SimulationSummary` jako `winnerId`/`loserId` przy zapisie biegu.
  - **Rekomendacja:** dołożyć `winnerId?: string` / `loserId?: string` do `SimulationSummary` (`simulation/RawResult.ts`) liczone w agregacji (`aggregateResults`), żeby raport i eksport CSV miały jedno źródło prawdy. Fallback: derive w raporcie, gdy stary zapis nie ma pól.
- **UI raportu:** w sekcji „Wyniki" nowy wiersz **„Zwycięzca serii: {nazwa} (`{id}`)"** i **„Przegrany: {nazwa} (`{id}`)"**. Id pokazać jawnie (user prosił o id), nazwę dla czytelności.
- Ten sam `winnerId`/`loserId` warto dodać do `metaRankingToCsv`/raportu CSV dla spójności.

**Pliki:** `domain/combat-lab/simulation/RawResult.ts` (+ pola), `simulation/aggregateResults` (wyliczenie), `application/combat-lab/report/SimulationReport.tsx` (wyświetlenie), ewentualnie `export/toCsv.ts`.

---

## 4. Niewrażliwość na liście wzmocnień

**Stan:** `TempBuffKind` w `combatantSelection.ts` **nie ma** `immunity`, choć:
- `BuffProfile.defense.immunity` **istnieje** (`BuffProfile.ts:48`),
- `applyBuffProfile` **już** je nakłada (`defense.immunity + buff.immunity`),
- `resolveAttack` **czyta** `immunity` (usuwa kości ataku przed rzutem).

Czyli silnik w pełni obsługuje niewrażliwość jako buff — brakuje tylko wpięcia w szybki edytor wzmocnień. Komentarz w pliku mówi „tylko pola wpływające na silnik" — a niewrażliwość właśnie wpływa, więc to luka, nie decyzja.

**Zmiana (trywialna):**
- `TempBuffKind`: dodać `"immunity"`.
- `TEMP_BUFF_LABELS`: `immunity: "Niewrażliwość (usuwa kości)"`.
- `createTempBuff` switch: `case "immunity": profile.defense.immunity = value; break;`
- `CombatantPicker.tsx`: nowa pozycja pojawi się automatycznie, jeśli lista renderuje się z `TEMP_BUFF_LABELS`; jeśli jest hardkodowana — dopisać.

**Uwaga semantyczna:** niewrażliwość = **usuwa całe kości** ataku przed rzutem (nie odejmuje wartości), odróżnić w etykiecie/tooltipie od „Odporności" (odejmowana pierwsza). Wartość to liczba usuwanych kości.

---

## 5. Kolejność i zależności

Wszystkie cztery są niezależne i drobne. Sugerowana kolejność wg stosunku wartość/koszt: **#4 (trywialne) → #1 → #2 → #3**. Żadne nie rusza hot-loopu silnika; #3 dokłada dwa opcjonalne pola do `SimulationSummary` (kompatybilne wstecz przez fallback-derive). Weryfikacja: typecheck combat-lab + ręczny bieg (postać z ≥2 ofensywami, buff niewrażliwości, zapis → raport).
