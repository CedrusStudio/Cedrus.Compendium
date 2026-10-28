# Symulator rzutu kośćmi — plan funkcjonalności

Stan rozpoznania: 2026-10-28. Plan i rejestr wdrożenia na gałęzi `codex/dice-roller-panel`.

## Cel i decyzja o interfejsie

Użytkownik ma móc wykonać dowolny rzut bez opuszczania bieżącej strony, a także otworzyć w tym samym miejscu rzut przygotowany z cechy, talentu, ofensywy lub mocy. Proponowany wzorzec to **jedna globalna zakładka „Kości”**: przycisk w nawigacji i zwinięty uchwyt widoczny po pierwszym otwarciu panelu. Na dużym ekranie panel wysuwa się z prawej, ma szerokość pozwalającą przeczytać wyniki i nie zasłania całej strony; na telefonie zajmuje prawie cały ekran. To panel roboczy, więc interakcja ze stroną w tle powinna pozostać możliwa na desktopie. Istniejący `Sheet` nakłada modalną osłonę; można wykorzystać jego wygląd, lecz zachowanie panelu trzeba zbudować lub skonfigurować świadomie, nie kopiować gotowego `SheetContent` wprost.

Panel jest montowany w głównym `Providers`, ponad grupami tras Next.js. Nawigacja w aplikacji nie resetuje jego stanu ani historii. Zamknięcie zwija panel, a ponowne otwarcie przywraca roboczy rzut. Odświeżenie przeglądarki może wyczyścić historię w pierwszej wersji. Widok wydruku nie pokazuje panelu ani przycisku.

## Co istnieje dziś

| Obszar | Aktualne zachowanie | Wniosek dla nowej funkcji |
| --- | --- | --- |
| Cechy i atrybuty | `StatisticView.tsx`: `1k(2 × grade) + value + bonus + testBonus`, regulowany bonus; przycisk pokazuje tylko sumę. | Zachować szybki rzut i dodać opcję „Otwórz w kościach” z gotowym zestawem. Pokazać wartość kości i składniki sumy. |
| Talenty | `talentsColumns.tsx`: `1k(2 × grade) + bonus`, lokalny modyfikator. Wynik startuje od `0`, zanim nastąpi rzut. | W nowym panelu stan „jeszcze nie rzucono” ma być pusty; dla istniejącej tabeli uwzględnić korektę początkowego `0` przy integracji. |
| Ofensywy i moce | `useCombatRolls.ts`, `usePowerRolls.ts`: kilka pul, bonusy, krytyki, przerzut konkretnej kości i suma. | Przygotować zestaw z aktualnych parametrów. Nie zgubić lokalnych zmian ani szczegółów krytyka. |
| Inicjatywa bestiariusza | `Attributes.ts`, `InitiativeCell.tsx`, `BattleTable.tsx`: osobny losowy rzut; wynik zapisywany w stanie bitwy. | Panel może otworzyć podgląd równego rzutu, ale wykonanie rzutu do bitwy musi nadal aktualizować inicjatywę jej własną akcją. |
| Rdzeń obliczeń | `Offense.ts`: `roll(grade)` losuje `1..2 × grade`, funkcje dla broni i obrażeń przyjmują źródło losowości. `rollOffense.ts` stosuje te same funkcje w Combat Lab. | Wspólny silnik panelu ma używać istniejących funkcji lub wydzielonych z nich czystych obliczeń; nie tworzyć drugiego zestawu zasad. |
| Nawigacja | `NavbarDefaultButton.tsx` występuje w pięciu głównych obszarach. `src/app/layout.tsx` zawiera globalny `Providers`. | Jeden przycisk nawigacyjny daje szeroki zasięg, a provider pod root layoutem utrzymuje panel przy zmianie trasy. |

Istotne reguły: `grade` jest rangą, więc `grade=3` oznacza k6. W broni `bonus` jest doliczany do **każdej** kości i każda kość może dostać premię krytyczną; w `DamageOffense` bonus jest doliczany **raz do puli**. Oznaczenie kości widmowej jest częścią definicji puli, choć samo nie zmienia liczby w prostym rzucie. Gdy `amount=0`, trzeba jawnie zdecydować, czy zostaje płaski bonus; istniejący kod obrażeń go zachowuje. W panelu należy pokazać tę regułę użytkownikowi.

## Zachowanie pierwszej wersji

1. **Wejście ręczne.** Widoczny nawigacyjny przycisk „Kości” otwiera panel w trybie „Szybki rzut”. Domyślnie `1k6`, z czytelnym wyborem liczby kości, rodzaju kości (`k2`–`k30`, według obecnych dozwolonych rang) i modyfikatora całej puli. Przyciski `−` / `+` i pola liczbowe mają pozwolić szybko zmienić wartości. Główny przycisk „Rzuć” jest zawsze widoczny, również na telefonie. Skróty do częstych kości mogą przyspieszyć użycie, ale nie zastępują jawnej informacji, co zostanie rzucone.
2. **Wynik.** Duża suma, pod nią pełny zapis, np. `2k6 + 3 → [2, 5] + 3 = 10`, oraz czas i etykieta źródła. Każda kość jest osobnym elementem. Przy przerzucie konkretnej kości zmienia się jej wynik, suma i zapis; poprzedni rzut zostaje w historii jako osobny wpis lub wersja z oznaczeniem przerzutu. Nie ma wartości `0` udającej wynik przed pierwszym rzutem.
3. **Rzut z kontekstu.** Wspólny kontrakt `openDiceRoller(preset)` przyjmuje gotowe dane i etykietę źródła, np. `Refleks — Aria`, `Talent: Tropienie`, `Ofensywa: Rapier`. Panel pokazuje wszystkie składowe i pozwala dodać tymczasowy modyfikator. Otworzenie innego rzutu zastępuje formularz roboczy, ale zachowuje historię. Przekazujemy migawkę wartości w chwili otwarcia; późniejsza zmiana postaci w tle nie zmienia już wykonanego rzutu.
4. **Szybkie rzuty na stronie.** Dotychczasowy przycisk nadal wykonuje rzut od razu. W miejscach objętych integracją wynik trafia do tej samej historii. Osobna, wyraźnie opisana akcja „Otwórz w kościach” otwiera szczegóły. Nie wymaga to otwierania panelu przy każdym zwykłym rzucie.
5. **Historia sesji.** Ostatnie 20 rzutów w porządku od najnowszego, z etykietą, konfiguracją, wynikami kości i sumą. Akcje „Powtórz” oraz „Wyczyść historię” (z prostym potwierdzeniem). Historia jest lokalna dla karty przeglądarki; bez konta, zapisu na serwerze i współdzielenia między użytkownikami.
6. **Dostępność i telefon.** Opisany przycisk z etykietą, logiczna kolejność fokusu, obsługa klawiaturą i `Escape`, komunikat wyniku dla czytnika ekranu, brak sygnalizowania krytyka samym kolorem. Na telefonie panel nie zasłania przycisku „Rzuć” własnym przewijaniem; pola są wystarczająco duże do dotyku. Przy `prefers-reduced-motion` przyszła animacja ma być wyłączona.

Nie dodawać w pierwszym wydaniu parsera dowolnego tekstu typu `2d6+3`, 3D ani animacji. Wpisywanie wzoru może być późniejszą nakładką na ten sam model rzutu.

## Model i granice integracji

- Opisać jawne typy: `DiePool` (`amount`, `grade`, `bonus`, `bonusScope`, opcjonalnie `critical` i `isPhantom`), `RollPreset` (`label`, `source`, `pools`, płaski modyfikator) i `RollRecord` (migawka konfiguracji, wyniki każdej kości, suma, czas). `bonusScope` rozróżnia bonus do kości i do puli, aby nie przenieść błędnie zasad ofensywy do ręcznego rzutu.
- Wydzielić czystą funkcję `executeRoll(preset, random)` wykorzystującą `roll`, `calculateCriticalDamage` oraz istniejące funkcje ofensywy albo ich wspólny rdzeń. Zwracać dane do UI, nie gotowy element React. Losowanie, liczenie sumy i formatowanie zapisu mają mieć jedno źródło prawdy. Przy przerzucie pojedynczej kości liczyć całość z zapisanych wyników i reguł, bez ponownego losowania pozostałych.
- Stan panelu i historia: mały provider React w `Providers` jest wystarczający dla pierwszej wersji. Udostępnia `open`, `close`, `roll`, `reroll`, `recordExternalRoll`; nie przenosić istniejącego stanu bitwy ani edytora postaci do globalnego store. Gdy integracja bieżącego przycisku wymaga wyniku ze starego hooka, rejestrować faktyczny wynik tego hooka, nie wykonywać drugiego losowania.
- Dla ofensyw i mocy najpierw obsłużyć `preset` ze składowymi; dopiero po ujednoliceniu wyniku i zapisu wpiąć ich dotychczasowe przyciski do globalnej historii. Warto sprawdzić rozbieżność `handleDamageOffenseRolls` i `useCombatRolls` dla skrajnego `amount=0`, aby nie zmienić wyniku po cichu.
- Tłumaczenia dopisać do istniejących `translations.pl-PL.ts`, `translations.de-DE.ts` i `translations.fr-FR.ts` zgodnie z aktualną listą języków; teksty w panelu nie powinny być na stałe po polsku.

## Kolejność wdrożenia

1. **Rdzeń:** model, spójne obliczenia i formatowanie; testy z kontrolowanym źródłem losowości dla granic kości, bonusów, krytyków, pustej puli i przerzutu.
2. **Globalny panel:** provider pod root layoutem, przycisk w `NavbarDefaultButton`, mobilny i desktopowy układ, historia, zachowanie stanu przy nawigacji. Test komponentowy interakcji i test przeglądarkowy: rzut → zmiana strony → ponowne otwarcie → historia i ustawienia zachowane.
3. **Źródła danych:** `StatisticView`, talenty, ofensywy, moce, inicjatywa. Najpierw preset i otwarcie panelu, potem rejestracja istniejących szybkich rzutów. Testy potwierdzają tę samą sumę w bieżącym widoku i historii oraz brak drugiego losowania. W inicjatywie sprawdzić, że rzut z tabeli nadal zmienia kolejność walki.
4. **Odbiór UX:** telefon 320/390 px, desktop, klawiatura, czytnik ekranu, wszystkie obsługiwane języki, wydruk. Sprawdzić panel na trasach postaci, bestiariusza, kompendium, rulebooka i Combat Lab.

## Kryteria gotowości

- Z każdej głównej sekcji można otworzyć panel bez przeładowania strony; przechodzenie między sekcjami zachowuje go i bieżącą historię.
- Ręczne `2k6+3` pokazuje dwie kości, modyfikator i zgodną sumę. Granice losowania są `1..2 × grade`.
- Rzut cechy/talentu/ofensywy/mocy otwarty z kontekstu ma poprawne parametry i źródło. Krytyki oraz przerzuty ofensywy zachowują istniejące zasady.
- Szybkie przyciski działają jednym kliknięciem, pokazują ten sam wynik na stronie i w historii, a rzut inicjatywy nadal zapisuje wynik bitwy.
- Zamknięcie panelu nie kasuje pracy; po pierwszym otwarciu i przed pierwszym rzutem nie ma fałszywego wyniku. Układ działa na telefonie, jest obsługiwalny klawiaturą i nie pojawia się na wydruku.

## Później

Animacja powinna otrzymać `RollRecord` już po wyliczeniu wyniku i jedynie go odsłonić. Dzięki temu czas trwania animacji, pominięcie ruchu i wygląd kości nie zmienią zasad ani historii. Następne możliwe rozszerzenia: zapis ulubionych zestawów, kopiowanie wyniku, tekstowy zapis wzoru i przekazywanie rzutu między uczestnikami sesji.

## Stan wdrożenia — 2026-10-28

Na gałęzi `codex/dice-roller-panel` jest panel globalny z ręcznym rzutem, historią 20 wpisów, powtórzeniem i przerzutem pojedynczej kości. Przyciski otwierające panel są na stronie głównej i we wspólnej nawigacji. Cechy, talenty, ofensywy, moce oraz inicjatywa otwierają preset z kontekstu; ich szybkie rzuty są zapisywane w historii. Istniejące przerzuty w widokach ofensyw i mocy również tworzą nowy wpis. Historia pozostaje w pamięci aktualnej karty przeglądarki; ponowne ładowanie strony ją czyści.

Kontrola typów przeszła. Testy jednostkowe nowego rdzenia, panelu, dotychczasowych hooków ofensyw i mocy oraz nawigacji przechodzą; jeden istniejący test jest pominięty. Scenariusze przeglądarkowe przeszły na telefonie 390 px i desktopie: ręczny rzut, zamknięcie, przejście między stronami, ponowne otwarcie z zachowanym wynikiem, złożone pule kości i czyszczenie historii w panelu. Uruchomiony przez Playwright serwer Next na Windows nie zakończył się automatycznie po scenariuszach, więc proces testowy zatrzymano ręcznie. Testy używały gotowych danych i odizolowanego połączenia; nie zapisywały do bazy użytkownika.

Rozszerzenie po pierwszym wydaniu: panel pozwala dodać i usunąć grupy kości oraz zmienić liczbę, rangę i premię każdej grupy. Premię można liczyć na każdą kość albo raz do grupy. Osobny modyfikator dotyczy całego rzutu; wzór pokazuje wynik konfiguracji, np. `4(k6+1) + 2(k4+2) + 3`. Czyszczenie historii ma potwierdzenie w panelu zamiast systemowego okna przeglądarki. Pozostają do rozważenia animacja, parser tekstowego wzoru, trwała historia i edycja parametrów krytyka w panelu.

### Sprawdzenie lokalne

Na gałęzi `codex/dice-roller-panel` uruchomić w katalogu repozytorium `node node_modules/next/dist/bin/next dev`. Otworzyć stronę główną i przycisk „Kości”; ustawić pierwszą grupę na `4(k6+1)`, dodać drugą `2(k4+2)`, ustawić modyfikator całego rzutu i wykonać rzut. Sprawdzić usunięcie grupy i czyszczenie historii z potwierdzeniem w panelu. Potem przerzucić pojedynczą kość i zamknąć panel. Po wejściu do Postaci albo Bestiariusza otworzyć panel ponownie i sprawdzić historię. W karcie postaci obok szybkiego rzutu znajduje się akcja „Otwórz kości” z parametrami tego testu. Inicjatywa w Bestiariuszu nadal aktualizuje wynik bitwy.
