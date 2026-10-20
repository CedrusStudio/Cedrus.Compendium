# Domyślna postać główna w scope kompendium

Data: 2026-10-20. Gałąź: `codex/default-main-character-scope`.

## Analiza

`CompendiumCharacterScopeProvider` odtwarza ID i filtr posiadania z `sessionStorage`, oddzielnie dla każdego klucza API. Przy zmianie klucza montuje nową sesję i nie przywraca poprzedniego scope. Postać jest pobierana przez `useCharacterById`, z istniejącą obsługą niedostępności, błędów i ponowienia. `usePersonalization` udostępnia profil aktualnego klucza, `mainCharacterId` i gotowość po odczycie profilu. Scope dotąd nie korzystał z postaci głównej.

Brak ID w zapisie sesji oznaczał zarówno pusty stan początkowy, jak i ręczne odpięcie. Trzeba rozróżnić te przypadki, aby automatyczny wybór nie cofał decyzji użytkownika.

## Zachowanie i implementacja

1. Najpierw odtworzyć zapis sesji. Istniejący wybór ID (także starszy format) ma pierwszeństwo przed postacią główną.
2. Jeżeli nie było zapisanego wyboru ani ręcznej decyzji, po załadowaniu profilu klucza wybrać `mainCharacterId`. To inicjalizacja scope; późniejsze odczyty profilu nie nadpisują decyzji w tej sesji. Wybrane ID nadal podlega zwykłej weryfikacji dostępności.
3. Dodać do zapisu sesji znacznik `explicitlyCleared` dla świadomego odpięcia. Odświeżenie i przejście między kategoriami zachowują odpięcie lub wybraną inną postać. Bezpośredni wybór ma pierwszeństwo także przed opóźnionym odczytem profilu/storage.
4. Po zmianie klucza natychmiast usunąć kontekst starego klucza i zainicjalizować nową sesję postacią główną nowego klucza, zgodnie z dotychczasowym resetem scope przy zmianie dostępu. Bez klucza lub postaci głównej pozostawić scope pusty.
5. Automatyczny wybór nie włącza „Tylko posiadane”, nie zmienia postaci głównej, nie zapisuje relacji ani danych postaci. Ręczna zmiana zachowuje istniejącą obsługę filtra; odpięcie wyłącza filtr.
6. Niedostępna postać czyści scope i jest zapamiętana jako wyczyszczona, aby nie powodować pętli automatycznych prób. Błąd sieci zachowuje wybór i dotychczasowe retry. Brak dostępu do storage nie blokuje domyślnego wyboru w pamięci.

## Testy i odbiór

- Testy providera w StrictMode: domyślna postać, brak klucza/main, opóźniony profil, zapisany wybór, legacy pusty zapis, odpięcie i ponowne zamontowanie, ręczny wybór przed końcem ładowania, niedostępność i błąd sieci, niedziałający storage.
- Zmiana klucza: wybór głównej dla nowego klucza, brak przeniesienia „Tylko posiadane” i brak publikacji starej odpowiedzi.
- Istniejące testy operacji przypinania/odpinania, odświeżania cache oraz wymagań muszą nadal przechodzić.
- Test przeglądarkowy z rzeczywistym hookiem personalizacji i mockowanym API: wejście do kompendium, domyślny scope, ręczna zmiana, odświeżenie, odpięcie i odświeżenie. Telefon oraz desktop.
- Kontrola typów. Bez zmian schematu bazy i bez zapisów do bazy użytkownika.

## Wynik wdrożenia

Status: **zaimplementowane i zweryfikowane**. Provider czeka na odtworzenie sesji i profil klucza, po czym inicjalizuje scope postacią główną. Ręczny wybór/odpięcie oraz starsze zapisane ID mają pierwszeństwo. Znacznik `explicitlyCleared` zachowuje odpięcie po odświeżeniu; brak storage pozostawia działający wybór w pamięci.

- **27/27 testów jednostkowych**: 22 providera (w tym 13 nowych przypadków), 4 istniejące personalizacji i 1 przycisku postaci głównej. Wszystkie włączone przypadki zakończyły się sukcesem.
- **8/8 scenariuszy E2E** w Chromium: telefon 390 px i desktop 1440 px; po dwa nowe scenariusze oraz dwa istniejące scenariusze scope/przypisywania na każdej szerokości. Potwierdzono rzeczywiste ładowanie personalizacji, zmianę i odpięcie po reloadzie, zmianę kategorii, izolację kluczy, reset filtra oraz dotychczasowy zapis i ponowienie błędu zapisu.
- Pełna kontrola typów i `git diff --check` zaliczone. Nie zmieniano schematu bazy. Przeglądarka korzystała z mockowanego API i serwera testowego z odizolowaną konfiguracją połączenia; testy nie zapisywały do bazy użytkownika.

Dzienniki lokalne: `.mobile-default-main-unit.log`, `.mobile-default-main-e2e.log`, `.mobile-default-main-types.log`. Test przeglądarkowy: `e2e/main-character-scope.spec.ts`.

## Rozszerzenie: szybki wybór głównej i ulubionych

W panelu scope nad zwykłą wyszukiwarką są sekcje „Główna postać” i „Ulubione postacie”. Wybór jednym kliknięciem/dotknięciem ustawia scope i zamyka panel. Postać główna nie jest powtarzana w ulubionych; aktywna postać ma zaznaczony przycisk. Skróty działają również po ręcznym odpięciu. Nie zmieniają zapisanej postaci głównej ani ulubionych.

`CharacterScopeQuickAccess` odczytuje profil ze wspólnego Redux, bez kolejnego hooka zapisującego personalizację. Pobiera wyłącznie podsumowania wskazanych ID przez istniejący endpoint wyszukiwania, z cache oddzielonym według klucza API. Odczyt uruchamia się dopiero po otwarciu panelu. Brak profilu/klucza nie powoduje zapytania. Niedostępnych rekordów nie można wybrać; błąd odczytu ma przycisk ponowienia. Wyszukiwarka wszystkich postaci pozostaje dostępna.

Weryfikacja rozszerzenia: **29/29 testów jednostkowych** (7 skrótów i 22 providera), kontrola typów oraz **10/10 scenariuszy przeglądarkowych** w Chromium na telefonie 390 px i desktopie 1440 px. Nowy scenariusz sprawdza odpięcie, brak duplikatu głównej w ulubionych, wybór ulubionej i powrót do głównej, zaznaczenie i zamknięcie panelu. Obejrzano zrzut panelu na telefonie z długimi nazwami; brak przepełnienia. Przebieg użył istniejącego serwera na porcie 3000 i mockowanego API przeglądarki. Dzienniki: `.mobile-shortcuts-unit.log`, `.mobile-shortcuts-e2e.log`, `.mobile-shortcuts-types.log`.
