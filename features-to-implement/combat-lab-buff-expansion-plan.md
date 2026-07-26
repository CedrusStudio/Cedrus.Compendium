# Plan: Rozbudowa systemu wzmocnień (Combat Lab)

Plan — **bez implementacji.** Cel: zbliżyć wzmocnienia na czas symulacji do pełnego edytora `BuffProfile` z zakładki Characters, bez łamania determinizmu i modelu snapshotu.

---

## 1. Realny stan

Combat Lab ma dziś **dwie** ścieżki wzmocnień (`builder/combatantSelection.ts` + `CombatantPicker.tsx`):

1. **Przełączanie profili postaci** — `activeBuffProfileIds` włącza/wyłącza istniejące `BuffProfile` postaci. To **ten sam** system co w Characters (te same profile), tylko wybór on/off.
2. **`createTempBuff`** — szybkie wzmocnienie ad-hoc na symulację, `TempBuffKind`: `damage / diceGrade / critPower / block / parry / dodge / protection / resistance / precision / reflex`. Wąski zestaw pól.

Snapshot (`toCombatantSnapshot`) przyjmuje `overrideActiveBuffProfileIds` **i** `extraBuffProfiles`, więc kanał wstrzykiwania profili **już istnieje** — brakuje tylko bogatszego kreatora po stronie UI.

---

## 2. Kluczowe ograniczenie: statystyki są PRE-BAKED

Snapshot niesie **już policzone** `offenses`, `defenses`, `maxHp`, `precision`, `reflex` — a **nie** surowe charakterystyki/atrybuty (siła, budowa, zręczność) ani formuły karty postaci. Silnik nakłada buffy **na te gotowe wartości** (`effectiveOffense`/`effectiveDefense`/`effectivePrecision`/`effectiveReflex` dodają Δ z `BuffProfile`).

Konsekwencja: **buff charakterystyki (np. +2 siły) NIE przeliczy pochodnych** (obrażeń, HP, obrony) w symulacji, bo pochodne nie są liczone w czasie walki. Pełny edytor „jak w Characters" miałby więc pola, które w symulacji są **no-op**. To trzeba albo **oznaczyć/odfiltrować**, albo dołożyć przeliczanie pochodnych ze statów (duży zakres — formuły karty postaci).

---

## 3. Trzy drogi

### Droga A — reużyć komponent edytora `BuffProfile` z Characters

Wstawić istniejący edytor profili (z zakładki Characters) do `CombatantPicker`. **Plusy:** spójny UX, pełny zestaw pól, zero nowego kodu edytora. **Minusy:** część pól (charakterystyki/atrybuty) jest w symulacji **no-op** przez pre-baking (§2) — myli użytkownika; trzeba je wyszarzyć/oznaczyć „nie wpływa na symulację".

### Droga B — rozbudować `createTempBuff` do pełnego, kategoryzowanego kreatora (REKOMENDACJA)

Rozszerzyć `TempBuffKind` i UI do wszystkich pól, które **realnie** wpływają na snapshot, pogrupowanych jak w Characters, z etykietą wpływu:
- **Ofensywa:** wszystkie komponenty broni (kości/rangi/bonus), krytyk (szansa i siła), obrażenia bezpośrednie/warunkowe.
- **Obrona:** wszystkie warstwy (blok/parowanie/unik/pancerz) + **odporność** + **niewrażliwość** (usuwanie kości!).
- **Zdrowie:** `maxHp`, `barrier`, przeżywalność/determinacja (`lethalHealth`/`lethalRounds`).
- **Statystyki testowe:** inicjatywa / precyzja / refleks.

**Plusy:** każde pole ma efekt w silniku (nie myli), spójne z modelem snapshotu, można zapisać jako `BuffProfile` (wiele naraz przez `extraBuffProfiles`). **Minusy:** własny UI (ale prosty, wzorzec `createTempBuff` już jest).

### Droga C — „prawdziwe" charakterystyki (FUTURE, duży zakres)

Przeliczać `offense`/`defense`/`maxHp` **ze statów** w czasie budowy snapshotu, wtedy buff charakterystyki miałby realny efekt. Wymaga wyciągnięcia **formuł pochodnych z karty postaci** do funkcji dzielonej z domeną combat-lab. Osobny, większy strumień — poza tym planem.

---

## 4. Rekomendacja

**Droga B** jako rdzeń: rozbudowany, kategoryzowany kreator tymczasowych profili z **jasną etykietą „wpływa na symulację"**, zapisywalny jako `BuffProfile` (kanał `extraBuffProfiles` już istnieje). Opcjonalnie **A** obok — przycisk „załaduj z profilu postaci" reużywający komponent z Characters do prepopulacji, z wyszarzeniem pól no-op. **C** świadomie odłożone (wymaga formuł karty).

Efekt uboczny: ten sam kreator posłuży edytorowi manewrów dla efektu `buff`/`debuff` („manewr nakłada taki buff") — patrz `combat-lab-maneuver-editor-plan.md` §5.

---

## 5. Etapy

1. **Inwentaryzacja pól `BuffProfile`** vs pola snapshotu, na które realnie działają `effective*` — mapa „pole → wpływa/no-op".
2. **Rozbudowa `createTempBuff` + `TempBuffKind`** o pełny zestaw pól z §3.B, pogrupowany.
3. **UI kreatora** w `CombatantPicker`: kategorie (Ofensywa / Obrona / Zdrowie / Statystyki), etykieta wpływu, podgląd w `CombatantStatsCard` (już pokazuje snapshot po buffach).
4. **Zapis/wczytanie profilu:** „zapisz jako profil postaci" + „załaduj z profilu" (droga A jako prepopulacja).
5. **(Future) Droga C:** przeliczanie pochodnych ze statów — osobny plan.

---

## 6. Otwarte pytania

1. **No-op pola** — wyszarzyć czy w ogóle ukryć w kontekście symulacji? (Rekomendacja: pokazać wyszarzone z tooltipem „pre-baked — wymaga przeliczania ze statów".)
2. **Zakres pól obrony** — czy odsłaniać `immunity` (usuwanie kości) i `resistance` osobno (mają różną semantykę: niewrażliwość = usuwa kości przed rzutem, odporność = odejmowana pierwsza)?
3. **Trwałość** — tymczasowy (tylko ten bieg) vs zapisany profil postaci (persystencja). Domyślnie tymczasowy; zapis na życzenie.
4. **Nakładanie wielu profili** — kolejność/kumulacja Δ przy kilku aktywnych profilach (dziś `effective*` sumuje) — potwierdzić, że suma jest pożądana, nie max.
