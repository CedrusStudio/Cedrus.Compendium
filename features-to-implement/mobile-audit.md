# Rejestr audytu mobilnego

Data: 2026-10-18. Baza porównania: `main` / `3c598a4`. Implementacja: `codex/mobile-friendly-app`.

## Feedback 2026-10-19 — zwijane filtry bestiariusza

Na `/bestiary` poniżej 768 px kategorie/tagi, widoczność rekordów i szybkie tagi są domyślnie zwinięte pod przyciskiem „Filtry”. Wyszukiwarka nazwy oraz dodawanie zaznaczonych do walki i wybór kolumn pozostają widoczne. Licznik przy przycisku pokazuje liczbę aktywnych tagów/kategorii i ustawioną widoczność. Zwinięcie panelu nie resetuje filtrów. Od 768 px panel jest zawsze widoczny, także po zmianie szerokości ekranu; stan kontrolek pozostaje zachowany. Przycisk ma `aria-expanded` i `aria-controls`.

Weryfikacja: nowy scenariusz **5/5 E2E zaliczonych** (Chromium 320/390 px i desktop, Firefox, WebKit). Obejmuje wypełnione szybkie tagi dołączające/wykluczające, wysokość początku tabeli po zwinięciu, wybór tagu i widoczności, rzeczywistą treść żądania wyszukiwania, licznik, ponowne otwarcie, resize do 1024 i 320 px oraz brak przepełnienia. Obejrzano zrzuty panelu zwiniętego przy 390 px i rozwiniętego przy 320 px. Istniejący scenariusz widoczności postaci/bestiariusza także zaliczony we wszystkich 5 projektach (`.mobile-bestiary-rerun.log`). **7/7 testów jednostkowych** i kontrola typów zaliczone.

Pierwszy przebieg ujawnił błędne dopasowanie wielkości liter i niejednoznaczny wybór tagu w nowym teście — poprawiono selektory, bez zmiany działania aplikacji. Wystąpiły też znane przejściowe błędy SSR „No QueryClient set” / kontroli dostępu WebKit na serwerze deweloperskim; ponowienie sekwencyjne zaliczyło istniejący scenariusz widoczności. Końcowy nowy scenariusz: `.mobile-bestiary-final.log` (5/5). Testy korzystały z istniejącego serwera na porcie 3000, z mockowanym API przeglądarki, bez restartu serwera ani zapisów do bazy. Dzienniki jednostkowe i typy: `.mobile-bestiary-unit.log`, `.mobile-bestiary-types.log`.

## Feedback 2026-10-19 — kompaktowe pole rangi

Wspólny `ListHeader` ma pole rangi o stałej szerokości 7 rem (112 px przy domyślnym rozmiarze tekstu) na telefonie i desktopie. Pole nazwy pozostaje szerokie. Zastąpiono `w-full sm:max-w-28` przez `w-28 shrink-0`: globalna reguła `input { max-width: 100% }` nadpisywała wcześniejszy limit szerokości. Zakres wartości i filtrowanie pozostają bez zmian.

Weryfikacja: **5/5 testów E2E zaliczonych** w Chromium (320/390 px i desktop 1440 px), Firefox i WebKit. Każdy sprawdza manewry, atuty, postawy, stany i zaklęcia: szerokość pola rangi, szersze pole nazwy, wpisanie `15`, wyczyszczenie oraz brak przepełnienia strony. Obejrzano zrzuty przy 320 i 1440 px. **2/2 istniejące testy `ListHeader`** i kontrola typów zaliczone. Użyto istniejącego serwera na porcie 3000 i mockowanego API przeglądarki. Dzienniki: `.mobile-rank-e2e.log`, `.mobile-rank-unit.log`, `.mobile-rank-types.log`.

## Feedback 2026-10-19 — zakładki karty postaci bez suwaka

Na `/characters/[id]` lista pięciu sekcji na telefonie zawija się w dwa rzędy: trzy zakładki nad dwiema. Wszystkie nazwy są widoczne, każdą sekcję otwiera jedno dotknięcie. Zmiana jest lokalna dla odczytu karty postaci; zachowuje istniejące zakładki Radix, ich stan i obsługę klawiatury. Nie zmienia nawigacji w innych modułach ani sposobu zapisu formularzy.

Weryfikacja: **10/10 testów E2E zaliczonych** w Chromium (320/390 px i desktop), Firefox i WebKit. Nowy scenariusz sprawdza 320, 360, 390 i 430 px (układ 3 + 2), a na desktopie 768, 1280 i 1440 px; każda zakładka mieści się w pasku, nie ma poziomego przepełnienia, a kliknięcie pokazuje właściwy panel. Powtórzono też wszystkie zakładki odczytu i edycji oraz zachowanie wartości formularza przy resize. Obejrzano obrazy przy 320 i 390 px; kontrola typów zaliczona. Użyto istniejącego serwera deweloperskiego na porcie 3000 i mockowanego API, bez restartu serwera ani zapisów do bazy. Dziennik: `.mobile-character-tabs-e2e.log`.

## Feedback 2026-10-19 — filtr widoczności na desktopie

Na `/characters` grupa „Wszystkie / Tylko moje / Tylko publiczne” nie jest już ściskana przez sąsiednie filtry. Krótka lista opcji nie ma przewijania poziomego; przy mniejszej ilości miejsca może się zawinąć. Kontener filtrów pozwala przejść do nowego wiersza, a wyszukiwarka ma od `md` szerokość 24 rem. Poprawka wspólnego `CharacterVisibilityFilter` obejmuje też bestiariusz; nie zmieniano globalnego komponentu zakładek.

Sprawdzenie: **14/14 testów jednostkowych** filtrów/list, kontrola typów oraz scenariusz przeglądarkowy w **5 projektach** (Chromium 320/390/desktop, Firefox, WebKit). Desktop obejmuje 768, 1024, 1280, 1440 i 1920 px na `/characters` oraz `/bestiary`, sprawdza geometrię wszystkich opcji, brak przepełnienia i przełączanie filtrów. Obejrzano zrzut przy 1920 px. Użyto działającego serwera użytkownika na porcie 3000, bez jego restartowania; żądania API przeglądarki były mockowane. Tymczasową konfigurację testową usunięto po sprawdzeniu.

W pierwszej kontroli desktopu po zmianach działający serwer deweloperski zgłosił błąd SSR „No QueryClient set”; ponowienie bez kolejnych zmian aplikacji przeszło (1/1). Pozostałe 4 projekty przeszły w poprzednim przebiegu. Dzienniki: `.mobile-visibility-unit.log`, `.mobile-visibility-e2e.log`, `.mobile-visibility-desktop-rerun.log`. Produkcyjnego builda dla tej lokalnej poprawki układu nie uruchamiano; weryfikowano działającą wersję deweloperską i typy.

## Metoda i zakres dowodów

Pierwszy przebieg przeglądarki obejmował publiczne widoki przy 320, 390, 430 i 1440 CSS px. Następnie dodano kontrolowane rekordy kompendium i postaci, uprawnienia administratora, obsługę zapisów w mockowanym API oraz przypadki otwartych paneli. Wymiary dotyczą dokumentu (`scrollWidth`), nie lokalnej szerokości tabeli. Rejestr rozróżnia zmianę w kodzie, zaliczony test i odbiór fizycznego urządzenia.

Powtarzalny zestaw: `e2e/mobile.spec.ts`, dane `e2e/fixtures.ts`, instrukcja `e2e/README.md`. Przeglądarka nie zapisuje do bazy użytkownika. Zrzuty i trace powstają w `test-results/`, raport w `playwright-report/`; obrazy do odbioru trzeba zachować przed następnym przebiegiem. Pierwsze pomiary poniżej pochodzą z uruchomionej aplikacji, nie z samego przeglądu klas CSS.

## Potwierdzone problemy i rozwiązania

| ID / priorytet | Widok i odtworzenie | Dowód przed | Poprawka i weryfikacja |
|---|---|---|---|
| MOB-01 / P1 | Kompendium z filtrami/szybkimi tagami, przewinąć do wyników na telefonie | Zgłoszenie użytkownika ze zrzutem: przypięty nagłówek zasłania większość wyników. | `ListHeader`, bestiariusz i bitwa: sticky dopiero od `lg`. Test „mobile search header…” przewija prawdziwą listę z tagami i sprawdza, że dolna krawędź nagłówka opuściła ekran. |
| MOB-02 / P1 | `/characters/add`, 3 przyciski trybu obok siebie | Dokument: 488 px przy 320, 523 px przy 390. | Tryby w kolumnie na telefonie; test strony i pełnej ścieżki AI. |
| MOB-03 / P1 | `/bestiary`, szeroki rząd filtrów | Dokument: 437 px przy 320, 473 px przy 390; po dołożeniu rekordów także 434/320. | Pionowy/zawijany toolbar z `min-w-0`, tabele przewijane lokalnie. Wybór kolumn dostępny również na telefonie. |
| MOB-04 / P1 | `/rulebook/podstawy/medale` | Dokument: ok. 808–809 px przy 320/390; przeglądarka pomniejszała tekst. Zrzut obejrzany podczas audytu. | Płynny artykuł, mniejsze marginesy, mobilny panel rozdziałów i spis treści. Test strony oraz kotwic; obraz po poprawce obejrzany przy 320 px. |
| MOB-05 / P1 | `/combat-lab/replay`, toolbar i sterowanie | Dokument: 457 px przy 320/390. | Zawijanie kontrolek, suwak w osobnym rzędzie, elastyczne karty uczestników; test strony i replay w wyniku prawdziwej symulacji. |
| MOB-06 / P1 | `/characters`, długa nazwa i akcje karty | Dokument: 549 px przy 320. | Ograniczony rodzic InfiniteScroll, nazwa zawijana, akcje nad tekstem na telefonie. |
| MOB-07 / P1 | Edycja postaci i talentów | Dokument: 329 px w nagłówku/rządzie ras, 334 px w akcjach talentów przy 320. | Lokalne przewijanie zakładek, zawijane akcje i formularz statystyk z podpisami pól na telefonie. Test sprawdza każdą zakładkę **po powrocie do szerokości telefonu**. |
| MOB-08 / P1 | `/admin` i `/admin/requirements` | Dokument: 336 i 427 px przy 320. | Zawijane nagłówki/filtry, przewijany sheet; test długiego edytora z kilkoma wymaganiami przy 320 × 390 i widocznym zapisie. |
| MOB-09 / P1 | Mobilna karta do druku | Tabele A4 wychodziły poza dokument (518 px przy 320). | Wydzielony podgląd A4 z lokalnym przewijaniem; reguły szerokości tylko dla ekranu. Test geometrii i generacji PDF bez toolbaru. |
| MOB-10 / P1 | Raport z długimi nazwami i ID uczestników | Dokument: 375 px przy 320 po zapisie rzeczywistej symulacji. | Wyniki raportu na telefonie w pionowych parach etykieta/wartość; długie wartości zawijane. Desktop i druk zachowują tabelę. Obraz raportu przy 320 px obejrzany po poprawce. |
| MOB-11 / P1 | Nieudany prefetch/odczyt karty do druku | Błąd SSR `Invalid URL` dla względnego `/api/search/...`, ujawniony przy izolowanej bazie testów. | Wspólny `useCharacterById` czeka na odczyt klucza, widoki pokazują ładowanie. Test SSR bez żądania i odczytu po załadowaniu klucza; nie filtrujemy tego błędu w E2E. |
| MOB-12 / P1 | Panele i filtry na krótkim ekranie | Ryzyka statyczne: stałe 300/340 px, brak wspólnego limitu wysokości, akcja zależna od hover. | Ograniczenia Radix/dvh, panel na pełną szerokość telefonu, zamknięcie sticky i limit nagłówka, widoczna akcja „tylko”, większe cele dotykowe. Testy otwartego wyboru postaci, popovera i dialogu klucza. |
| MOB-13 / P1 | Dane ukryte przy małej szerokości | Wybór kolumn był `hidden sm:block`; parametry zasięgu/stylu broni `hidden sm:flex`. | Kontrolki i parametry widoczne również na telefonie; bez usuwania funkcji mobilnych. |
| MOB-14 / P1 | Firefox: otworzyć dialog klucza i zmniejszyć ekran do 320 × 390 | W ponownej kontroli kliknięcie zamknięcia kończyło się timeoutem; trace potwierdził przycisk poza viewportem. | Usunięto animację przesunięcia dialogu, zamknięcie utrzymywane podczas przewijania. Dodano `data-slot` do dialogu, aby kontrola geometrii obejmowała go bezpośrednio; test sprawdza zamknięcie przed i po scrollu. |

## Dodatkowa kontrola istniejących pominięć

Na żądanie „sprawdź czy wszystko działa” uruchomiono również dwa wcześniej wyłączone testy. Oba początkowo zawiodły; nie traktujemy ich wcześniejszego pominięcia jako sukcesu.

- `CreateEmptyCharacter` tworzył płytką kopię wzorca. Zmiana siły jednej nowej postaci zmieniała drugą w pamięci. **Naprawiono**: fabryka zwraca głęboką kopię kompletnego wyniku. Test jest włączony na stałe i obejmuje siłę, zdrowie, ekwipunek, krytyk ofensywy i tagi. Cały plik: 33 zaliczone testy.
- `useCombatRolls([])` nadal rzuca błąd przy bezpośrednim wywołaniu. Widok `OffenseCard` ma osobny komponent i zwraca `null` dla pustej listy, więc ten przypadek nie powoduje awarii obecnego ekranu walki. Pozostawiono istniejące pominięcie testu odporności samego hooka; nie jest to zaliczona ścieżka. Poprawki mobilne nie zmieniają tego kontraktu.

## Pokrycie ekranów

Kontrola inwentarza w testach porównuje wszystkie 34 pliki `src/app/**/page.tsx` z reprezentantami poniżej. Stan pusty/błąd i stan wypełniony nie są utożsamiane z pełnym przejściem każdej operacji zapisu.

| Obszar | Reprezentanci / dodatkowe interakcje |
|---|---|
| Start i ustawienia | `/`, `/personalization`; ulubione, tagi i przyciski nawigacji; dialog klucza i zwrot fokusu. |
| Postacie | `/characters`, `/characters/favorites`, `/characters/add`, `/characters/[id]`, `/characters/[id]/edit`; 5 zakładek odczytu, 6 edycji, resize bez utraty wpisanej nazwy, tworzenie kopii/AI, wybór postaci. |
| Kompendium | Start, start ekwipunku i wszystkie 12 list z danymi z fabryk domenowych. Wybór postaci, dodanie/odpięcie atutu, kategorie i „tylko”, scroll nagłówka z szybkimi tagami. |
| Bestiariusz i bitwa | Obie strony; dodanie uczestnika z długą nazwą, wybór kolumn, zapis i ponowne wczytanie presetu. |
| Podręcznik | Start, wyszukiwanie, kategoria, artykuł; panel rozdziałów i kotwice spisu treści. |
| Combat Lab | Start, replay, raport błędu oraz raport rzeczywistego wyniku; wszystkie 11 zakładek + zarejestrowane analizatory, worker 5 walk, zapis wyniku. Wykresy mają dostęp do wartości bez hover; graf także listę połączeń. |
| Administracja | Wszystkie 3 strony, dodatkowo długi edytor wymagań i osiągalność stopki na krótkim ekranie. |
| Druk | `/characters/[id]/sheet`, lokalny podgląd A4, PDF i ukryty toolbar. |

## Wyniki końcowe

### Ponowna weryfikacja na żądanie użytkownika

| Sprawdzenie | Wynik |
|---|---|
| Pełny Vitest po poprawce fabryki postaci | **1984 zaliczone, 11 pominiętych** (10 integracyjnych uruchomiono oddzielnie, 1 istniejący test odporności hooka opisano powyżej). 214 plików zaliczonych, 1 pominięty; 119,31 s. |
| Dodatkowa regresja fabryki i doczytywania | **35/35 zaliczonych**, w tym 33 testy `Character.test.ts`, z kontrolą niezależności krytyka i ekwipunku. |
| Rzeczywisty MongoDB | **10/10 zaliczonych**, 4,36 s; dedykowana lokalna baza `cedrus_membership_test_mobile_verify` w tymczasowym kontenerze MongoDB 7 z replikacją. Kontener zatrzymano i usunięto. |
| Produkcyjny build i TypeScript po poprawkach | **Zaliczone**. |
| Pełne E2E na końcowym buildzie, 5 projektów | **242 zaliczone, 8 celowo pominiętych, 0 niepowodzeń**; 250 przypadków, dwa workery, 3,5 min. Raport HTML obejmuje cały ten przebieg; `test-results/.last-run.json` ma `status: passed` i pustą listę niepowodzeń. |

Nowe przypadki przeglądarkowe sprawdzają zapis danych postaci i odczyt po odświeżeniu, ponowienie po HTTP 500 oraz odtworzenie wyboru postaci i filtra posiadania. Geometria otwartych paneli jest kontrolowana w obu osiach; dialog klucza sprawdza też zamknięcie po przewinięciu. Dane testowe poprawiono tak, aby tagi spełniały rzeczywistą walidację formularza. W pełnym przebiegu przed naprawą dialogu było 241 zaliczonych, 8 pominiętych i jedno potwierdzone niepowodzenie Firefox opisane jako MOB-14.

Pierwszą próbę uruchomienia zatrzymały ograniczenia uprawnień plików tymczasowych (`EPERM`) przed wykonaniem testów. Udany przebieg wykonano z właściwym dostępem. Nie utożsamiamy tego błędu środowiska z regresją aplikacji.

Aktualne dzienniki lokalne: `.mobile-verify-unit.log`, `.mobile-verify-regressions.log`, `.mobile-verify-integration.log`, `.mobile-verify-build.log`, `.mobile-verify-e2e-final.log`. Dziennik `.mobile-verify-disabled.log` zachowuje odtworzenie obu wcześniej pomijanych przypadków przed poprawką. Pliki te są ignorowane przez Git.

Raport do otwarcia: `playwright-report/index.html` (lub `npm run test:e2e:report`). Końcowy przebieg ponownie sprawdził wszystkie 34 strony oraz komplet interakcji w Chromium, Firefox i WebKit. Osiem pominięć ma ten sam podział co w pierwszej kontroli: PDF poza Chromium (2), mobilny scroll na desktopach (2), powtórzenia dodatkowej macierzy rozmiarów (4). Testy przeglądarkowe nadal używają mockowanego API; dziesięć osobnych testów integracyjnych stanowi dowód rzeczywistego zapisu powiązań w MongoDB.

### Historia pierwszego przebiegu implementacyjnego

| Sprawdzenie | Wynik |
|---|---|
| Vitest, pełny zestaw | **1983 zaliczone, 12 pominiętych**; 214 plików zaliczonych, 1 pominięty. Integracje wymagające osobnej konfiguracji nie są liczone jako zaliczone. |
| TypeScript i build produkcyjny | **Zaliczone**. Build zakończył kompilację, kontrolę typów i generowanie tras. |
| E2E na serwerze deweloperskim, Chromium 320/390/1440 px | **135 zaliczonych, 3 pominięte**, 5,4 min. Ten przebieg poprzedzał dodanie dwóch scenariuszy: kategorii oraz nawigacji podręcznika. |
| E2E na buildzie produkcyjnym, 5 projektów | 240 przypadków: **227 zaliczonych**, 8 świadomie pominiętych, 5 niepowodzeń tego samego scenariusza testowego filtrów (pominięte rozwinięcie kategorii). 10,6 min. |
| Powtórka poprawionego scenariusza filtrów | **5/5 zaliczonych**, 13,3 s; wszystkie projekty. Test rozwija kategorię, wybiera „tylko” i sprawdza widoczność aktywnego filtra. Bez zmiany kodu produktu między tymi dwoma przebiegami. |

Łączny stan pokrycia produkcyjnego po powtórce: **232 zaliczone, 8 pominiętych, brak nierozwiązanych niepowodzeń**. Pominięcia to PDF poza Chromium (2), mobilny scroll na desktopach (2) i dodatkowa macierz rozmiarów uruchamiana tylko raz (4).

Projekty produkcyjne: Chromium 156 przy 320 × 700, 390 × 664 oraz 1440 × 900; Firefox 157 przy 1440 × 900; WebKit 27.2 przy 390 × 664. Dwa warianty 390 px korzystają z profilu urządzenia `iPhone 13` Playwright, nie z fizycznego iPhone'a. Dodatkowy przebieg sprawdza 360, 430, 844 (poziomo), 768, 820 i 1280 px; otwarte dialogi także 320 × 390.

Lokalne dzienniki: `.mobile-unit.log`, `.mobile-build.log`, `.mobile-e2e.log`, `.mobile-production-e2e.log` i `.mobile-filter-rerun.log` (ignorowane przez Git). Pełny przebieg produkcyjny zachował obrazy w `test-results/`; ostatnia powtórka używa `test-results/filter-rerun/`, a jej raport HTML zawiera 5 powtórzonych przypadków. Domyślne polecenia i przyszły workflow CI generują raport całego uruchomionego zestawu. Workflow dodano, ale nie uruchamiano go w GitHub Actions w tej sesji.

Obejrzano reprezentatywne obrazy podręcznika, zakładki walki i edycji statystyk, raportu symulacji, kompendium na desktopie oraz wyników po przewinięciu mobilnych filtrów. Nie jest to deklaracja ręcznych oględzin każdego wygenerowanego obrazu.

## Pozostały odbiór

- Fizyczny iOS Safari i Android Chrome: rzeczywista klawiatura, pasek adresu, gesty, druk/pobieranie.
- Pełna macierz języków i powiększenie tekstu 200%; aktualny automatyczny zestaw używa PL. Długie nazwy i tagi są osobnymi danymi testowymi.
- Testy przeglądarkowe używają mockowanego API; nie są dowodem rzeczywistego zapisu w MongoDB. Dotychczasowe testy persystencji pozostają oddzielne.
- Generowane zrzuty podlegają oględzinom. Automatyczne porównania pikselowe z zatwierdzonymi baseline'ami nie są jeszcze skonfigurowane.
- Pełne warianty operacji, błędów i eksportów z docelowych etapów M0–M6: otwarte punkty wyszczególniono w tabeli stanu implementacji w planie. Kontrola geometrii wszystkich stron nie zastępuje tych scenariuszy.
