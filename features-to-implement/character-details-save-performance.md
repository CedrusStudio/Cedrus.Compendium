# Zapis szczegółów dużej postaci — ograniczenie zbędnych operacji

Gałąź: `codex/optimize-character-details-save`.

## Zgłoszenie i analiza

Produkcja nadal zgłaszała P2028 po zwiększeniu limitu z 5 do 10 sekund, także przy usuwaniu jednego atutu „Większy Fechtunek 8” z dużej postaci. `createUpsertPayload` generował aktualizację każdego przesłanego istniejącego atutu, nawet jeżeli jego zawartość nie zmieniła się. Usunięcie jednego ze 100 atutów oznaczało odpięcie oraz 99 zbędnych aktualizacji. To potwierdzony koszt w kodzie; nie mamy pomiaru poszczególnych etapów na produkcji.

## Poprawka

- Jeden zbiorczy odczyt pól zapisywanych atutów; nested update obejmuje tylko rzeczywiste różnice. Nowe własne atuty, podpinanie istniejących i odpinanie nadal działają w tej samej transakcji.
- Porównanie obejmuje nazwę, rangę, opis, cenę, tagi, wymagania i zastępowane atuty. Pominięte pola opcjonalne nie są zapisem; jawne wyczyszczenie listy pozostaje zmianą. Wymagania porównywane są niezależnie od kolejności kluczy obiektów.
- Brak zmian relacji pomija całe pole `perks`. Niezmieniona rasa nie wymaga walidacji ani ponownego podpinania.
- Zapis szczegółów wykorzystuje odczyt ochrony przed konfliktami zamiast ponownie pobierać ten sam rekord postaci. Odpowiedź update pobiera tylko tablice snapshotu repertuaru.
- Limit transakcji pozostaje 10 sekund; nie usunięto kontroli widoczności, migawki ani atomowości.

## Diagnostyka po wdrożeniu

Zapis trwający co najmniej sekundę loguje `Character details save timing`: `elapsedMs`, `writeMs`, `submittedPerks` oraz liczby `create/update/connect/disconnect`. Log pojawia się także po błędzie/timeoutcie; nie zawiera nazw, opisów ani kluczy API. Przy usuwaniu jednego niezmienianego atutu z dużej karty oczekujemy `update: 0`, `disconnect: 1`. Te pomiary pozwalają odróżnić dalszy koszt zapisu od przygotowania/odczytów i połączenia z bazą. Optymalizacja nie stanowi pomiaru ani gwarancji czasu produkcji.

## Weryfikacja

- **47/47 testów jednostkowych**: duża karta (100 atutów), usunięcie jednego bez 99 aktualizacji, dodanie dwóch bez aktualizacji pozostałych, rzeczywiste edycje wszystkich obsługiwanych pól, jawne czyszczenie wymagań, pominięte pola opcjonalne, własne nowe atuty, limit 10 sekund, guard i endpointy.
- **11/11 testów integracyjnych na rzeczywistym MongoDB 7 z replikacją**: duża karta 100 → 99 → 101 atutów, obie strony relacji, edycja jednego atutu oraz istniejące testy konkurencji, rollbacku, widoczności, limitów i osieroconych relacji.
- TypeScript i `git diff --check` zaliczone. Tymczasowy MongoDB na `127.0.0.1:27029/cedrus_membership_test_details` został usunięty. Nie zapisywano do bazy użytkownika.

Dzienniki lokalne: `.mobile-details-perf-unit.log`, `.mobile-details-perf-integration.log`, `.mobile-details-perf-types.log`.

## Rozszerzenie: manewry, postawy, stany i zaklęcia

W tej samej gałęzi zoptymalizowano zapis sekcji walki. Każda z czterech kategorii ma zbiorczy odczyt i plan rzeczywistych zmian; niezmienione wpisy nie generują nested update, a całkiem niezmieniona relacja jest pomijana. Guard udostępnia już odczytany snapshot, a wynik zapisu pobiera tylko tablice ID. Wspólna specyfikacja kilku mocy jest podpinana raz i tylko wtedy, gdy nie była wcześniej powiązana. Dotychczasowego zachowania zachowywania starszych powiązań specyfikacji nie zmieniano.

Zaklęcia porównywane są po przeliczeniu kosztu na format bazy, z normalizacją starszych brakujących pól. Jedno ID zaklęcia występuje tylko raz w operacjach relacji, nawet gdy zaklęcie należy do kilku mocy. Usunięcie z jednej mocy zachowuje relację, jeżeli jest jeszcze używana przez inną; ostatnie odwołanie powoduje odpięcie. Zachowano rzeczywiste edycje, tworzenie własnych elementów i pomijanie niezdefiniowanych pól, w tym danych symulacyjnych nieedytowanych w formularzu postaci.

Osadzone dane zdrowia, ofensyw, obron i mocy nadal są zapisywane w dokumencie postaci. Optymalizacja dotyczy zbędnych operacji na powiązanych rekordach. Limit pozostaje 10 sekund; produkcyjny czas nie był mierzony. Wolne zapisy walki logują `Character combat save timing` z czasem i liczbami operacji według kategorii, bez treści rekordów i kluczy API.

Weryfikacja całego rozszerzenia razem z atutami: **60/60 testów jednostkowych**, **15/15 testów na rzeczywistym MongoDB 7 z replikacją**, TypeScript i kontrola diffu. Integracja obejmuje 100 manewrów, po 20 postaw/stanów, usunięcie jednego, prawdziwą edycję z zachowaniem efektów i współdzielone zaklęcie dwóch mocy z edycją kosztu i usunięciem ostatniego odwołania. Jednostkowe testy potwierdzają brak aktualizacji pozostałych wpisów, brak duplikatów connect/create, starsze koszty zaklęć i porównanie JSON. Tymczasową bazę testową usunięto po kontroli; nie zapisywano do bazy użytkownika.

Dzienniki: `.mobile-combat-perf-unit.log`, `.mobile-combat-perf-integration.log`, `.mobile-combat-perf-types.log`.

## Końcowy przegląd

Przegląd wykrył dodatkowy przypadek utraty edycji współdzielonego zaklęcia: przy dwóch kopiach tego samego ID ostatnia niezmieniona kopia mogła przesłonić zmodyfikowaną wcześniej. Test regresyjny odtworzył błąd. Plan relacji wybiera teraz rzeczywistą zmianę względem rekordu bazy, niezależnie od kolejności mocy. Dwie sprzeczne edycje jednego ID są odrzucane przed zapisem jako czytelny błąd HTTP 400. Identyczne kopie nadal generują tylko jeden create/connect/update. Wyszukiwanie relacji w tym planie korzysta z Map/Set.

Po poprawce: **pełny Vitest 2039 zaliczonych, 16 pominiętych** (15 integracji wymagających dedykowanej bazy + 1 wcześniej wyłączony test hooka `useCombatRolls`). **Wszystkie 15 integracji uruchomiono oddzielnie i zaliczono na rzeczywistym MongoDB**; dodano do nich zapis edycji zaklęcia z pierwszej mocy przy niezmienionej kopii w drugiej. TypeScript i kontrola diffu zaliczone. Tymczasowy kontener bazy usunięto. Produkcyjnego czasu i wdrożenia nie weryfikowano.

Dzienniki końcowe: `.mobile-character-save-review-suite.log`, `.mobile-character-save-review-integration.log`, `.mobile-character-save-review-types.log`; regresja i obsługa HTTP: `.mobile-save-review-regression.log`.
