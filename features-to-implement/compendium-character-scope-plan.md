# Kontekst postaci w kompendium — analiza i plan wdrożenia

Data analizy i implementacji: 2026-10-18. Status: **pierwsze wydanie zaimplementowane**; rozszerzenia A/B pozostają poza tym wydaniem.
Gałąź: `codex/plan-compendium-character-scope`.

### Wynik implementacji

Gotowe: wspólny panel i sesyjny wybór postaci, status posiadania po ID, filtr we wszystkich 12 kategoriach, bezpośrednie przypinanie/odpinanie manewrów, atutów, postaw i stanów, ocena wymagań dla wybranej postaci oraz ochrona formularzy `combat`/`details` przed nadpisaniem repertuaru. Importery nadal operują na draftach. Nie zmieniono schematu bazy ani danych aplikacji.

Ochrona zapisu używa **odczytu snapshotu i nested write w tej samej transakcji MongoDB**. Test rzeczywistego connectora wykazał, że filtr list nie obsługuje `isSet`; transakcyjny odczyt obsługuje również starsze dokumenty bez tablic ID. Nie było potrzeby wprowadzania liczników wersji ani backfillu. Osierocone ID, którego rekord biblioteki został wcześniej usunięty, jest odpinane osobną gałęzią w tej samej transakcji, ponieważ zwykłe Prisma `disconnect` ignoruje brakujący rekord.

Weryfikacja: **1974 testy zakończone sukcesem, 12 pominiętych**, pełny TypeScript i build produkcyjny; osobno **10 testów integracyjnych** na odizolowanym lokalnym MongoDB z replikacją (domyślnie są wśród testów pomijanych). W przeglądarce sprawdzono panel, reset po zmianie klucza, przypisanie i odpięcie, pusty repertuar, zachowanie kontekstu/filtra przy zmianie kategorii oraz ich odtworzenie po przeładowaniu. Poniższe sekcje zachowują analizę wyjściową i specyfikację; rozszerzenia A/B są dalszym zakresem.

Powtórzenie integracji (wymaga dedykowanego lokalnego MongoDB z replikacją):

```powershell
$env:MEMBERSHIP_TEST_DATABASE_URL = 'mongodb://127.0.0.1:27019/cedrus_membership_test?directConnection=true'
node node_modules/vitest/vitest.mjs run src/persistence/characters/__tests__/characterMembership.integration.test.ts
```

Bez tej zmiennej integracja jest celowo pomijana; test odrzuca adres inny niż localhost/127.0.0.1 i nazwę bazy spoza `cedrus_membership_test*`. Testy nie korzystają z połączenia aplikacji. Zależności z lockfile zostały zainstalowane, a klient Prisma wygenerowany.

### Poprawka wydajności dodawania i usuwania

Odpowiedź zapisu zwraca teraz autorytatywny `characterPatch` obejmujący wyłącznie zmienioną kategorię i jej tablicę ID. Klient aktualizuje z niej cache i status od razu po zatwierdzeniu transakcji, bez kolejnego pobrania całej postaci z 12 relacjami. Poboczne odświeżenia nie blokują kolejnej akcji; wyszukiwanie podsumowań postaci nie jest odświeżane, bo jego pola się nie zmieniają. Ocena wymagań w aktywnym kontekście nie pobiera dodatkowo postaci głównej. Prisma współdzieli jedną pulę połączeń również po HMR w trybie deweloperskim.

Testy potwierdzają brak dodatkowego odczytu pełnej postaci po udanym dodaniu i usunięciu oraz odblokowanie przycisków niezależnie od wolnych zapytań pobocznych. Sprawdzono też odpowiedź zapisu na prawdziwym MongoDB oraz zachowanie oryginalnych snapshotów pozostałych sekcji. Przy niejednoznacznym błędzie sieci lub odpowiedzi starszego serwera nadal wykonywany jest pełny odczyt potwierdzający stan.

## 1. Cel

Użytkownik wybiera postać podczas przeglądania kompendium. Od tego momentu widzi, które wpisy ta postać posiada, może przypisywać jej i odpinać konkretne elementy oraz opcjonalnie ograniczyć wyniki do posiadanych. Zmiana kategorii kompendium nie wymaga ponownego wybierania postaci. Zapis pojedynczej zmiany odbywa się od razu, bez otwierania edycji karty postaci.

Przykład: wybieram „Aldara”, przeglądam wszystkie manewry, przy posiadanym widzę „Na postaci” i „Usuń z postaci”, przy pozostałych „Dodaj do postaci”. Następnie przechodzę do atutów, nadal pracując na Aldarze. „Tylko posiadane” jest osobnym, domyślnie wyłączonym filtrem.

## 2. Analiza obecnego kodu

Poniższe ustalenia pochodzą z kodu, a nie wyłącznie z historycznych planów. Nie wykonywano zapytań do bazy ani zmian danych.

| Obszar | Obecny kod | Znaczenie dla funkcji |
|---|---|---|
| Granica kompendium | `src/app/(compendium)/layout.tsx`, `src/application/compendium/CompendiumNavbar.tsx` | Wspólny layout zawiera navbar i dzieci; odpowiednie miejsce na klientowy provider kontekstu i stale dostępny przycisk wyboru. |
| Istniejący wybór postaci | `src/application/compendium/CharacterModeFilter.tsx` | Popover z wyszukiwarką i lokalnymi `characterId`/`enabled`. Wybór od razu włącza filtrowanie. Stan należy do konkretnej listy, więc nie jest wspólnym kontekstem i nie daje akcji przypisania. |
| Istniejące „tylko posiadane” | `src/application/compendium/characterOwnership.ts`, listy kompendium; ROADMAP, Fala 12 | Obsługuje 12 kategorii. Większość dopasowuje nazwy, a dla rang dodatkowo parę `name|grade`; specyfikacje mocy po ID. To użyteczna baza, ale nazwa i ranga nie wystarczą jako tożsamość operacji zapisu. |
| Paginacja filtra | `narrowToOwned`, `matchesOwned`, np. `maneuvers/ManeuversList.tsx`, `perks/PerksList.tsx` | Zapytanie zawęża rodziny i rangi, zwiększa stronę do iloczynu ich liczebności, z limitem 400; lista wyłącza `hasMore` przy filtrze. Nie wolno odtwarzać tego ograniczenia w nowym filtrze po dokładnych ID. |
| Wybieranie postaci | `src/application/characters/components/CharacterPickerGrid.tsx`, `hooks/useSearchCharactersSummary.ts` | Wspólna wyszukiwarka i tagi są już używane przy kopiowaniu/importowaniu. Hook uwzględnia klucz API w cache, ale zwraca tylko `characters`; picker korzysta z pierwszej strony i nie udostępnia stanów błędu/ładowania ani doczytywania. Karty wyboru są klikalnymi `Card`, więc potrzebują obsługi klawiatury. |
| Pobieranie postaci | `src/application/combat-lab/hooks/useCharacterById.ts`, `src/application/characters/hooks/useGetCharacterById.ts` | Wariant parametryzowany już istnieje, mapuje przez `toCharacter`, memoizuje wynik i używa `createCharacterByIdKey(id, apiKey)`. Do współdzielenia warto przenieść go z obszaru Combat Lab do hooków postaci; rozszerzyć o błąd/refetch. |
| Identyfikacja posiadanych wpisów | `prisma/schema.prisma`, `src/persistence/mappings/characterMapping.ts` | Postać ma m.in. `maneuversIds`, `perksIds`, `stancesIds`, `statesIds` i relacje do istniejących rekordów. Domena zachowuje ID elementów. Nowy przycisk może więc pracować na istniejącej relacji bez kopiowania wpisu. |
| Dotychczasowy zapis | `src/persistence/characters/charactersRepository.ts`, `src/persistence/mappings/createUpsertPayload.ts`, API `characters/[id]/combat` i `details` | Formularz wysyła całą sekcję. Repozytorium generuje `create`, `update`, `connect`, `disconnect`. Ponowne wysłanie starego formularza może odpiąć element dodany później; zapis istniejącego elementu może aktualizować współdzielony rekord. To zły kontrakt dla szybkiego przycisku kompendium. |
| Limity repertuaru | `persistence/schemas/characters/combat/maneuverSchema.ts`, `combat/modeSchema.ts`, `perkSchema.ts` | Obecne formularze dopuszczają 100 manewrów, po 20 postaw/stanów i 500 atutów. Nowe przypisanie musi respektować te same limity, żeby nie tworzyć postaci niemożliwej do zapisania w edytorze. |
| Usuwanie w kompendium | `maneuvers/ManeuverView.tsx`, `perks/PerkView.tsx`, `CompendiumEditView.tsx` | Obecny `DeleteButton` usuwa encję biblioteki. Nowa akcja „Usuń z postaci” musi mieć osobny komponent, nazwę i endpoint; wykonuje wyłącznie odpięcie relacji. |
| Współdzielone widoki wpisów | np. `EditManeuversCard.tsx`, `EditPerksList.tsx` i widoki kompendium | Te same `ManeuverView`/`PerkView` są renderowane w importerach z `disableEdit`. Akcje nowego kontekstu trzeba włączać jawnie na stronach kompendium, aby nie zapisywały postaci podczas zaznaczania importu do formularza. |
| Odwrotne wyszukiwanie właścicieli | `src/application/common/OwnedByCharacters.tsx`, `hooks/useOwningCharacters.ts`, `src/app/api/characters/owning/route.ts` | Lista „Posiadane przez postacie” już działa po ID i respektuje widoczność. Po przypisaniu/odpięciu trzeba odświeżyć jej cache `owning-characters`. |
| Wymagania | `src/application/common/RequirementsView.tsx`, `requirements/useMainCharacter.ts`, `src/domain/requirements/checkRequirement.ts` | Kolorowanie odnosi się dziś do postaci głównej z personalizacji. Przy aktywnym kontekście musi wskazywać wybraną postać. Silnik jawnie zakazuje blokowania dodawania za niespełnione wymagania. |
| Dostęp | `src/proxy.ts`, `src/lib/apiKeyValidation.ts`, `src/persistence/characterVisibility.ts`, `src/app/api/search/*` | Zapis wymaga poprawnego klucza z puli administratorów; odczyt postaci uwzględnia publiczność i jej `apiKeys`. Sam proxy nie sprawdza widoczności konkretnej postaci w starych endpointach zapisu. Nowa operacja musi sprawdzać obie rzeczy na serwerze. |
| Cache | `src/persistence/cacheKeys.ts`, `src/application/combat-lab/hooks/useCharactersByIds.ts`, `src/application/characters/edit/editFormConstants.ts` | Pojedyncza postać ma klucz `['characters', id, apiKey]`, odczyt zbiorczy osobny `combat-lab-characters-by-ids`. Samo odświeżenie jednej listy manewrów nie odświeży karty, wymagań i widoku właścicieli. |
| Testy | `vitest.config.ts`, `src/__tests__/utils/testUtils.tsx`, istniejące testy ownership, pickerów, list i repozytoriów | Są Vitest, Testing Library, jsdom i mocki Prisma. Brak skonfigurowanego Playwright/Cypress w `package.json`; automatyzacja przeglądarkowa byłaby osobnym rozszerzeniem infrastruktury. |

### Wnioski

1. Rozwijamy istniejący filtr, ale rozdzielamy **wybraną postać**, **oznaczenie posiadania** i **zawężenie wyników**.
2. Nowy zapis zmienia jedną relację po dokładnym ID. Nie wysyła całego `CombatDto`/`DetailsDto` i nie korzysta z `createUpsertPayload` do szybkich operacji.
3. W nowym kontekście posiadanie oznacza powiązanie z konkretnym rekordem. Inny rekord o tej samej nazwie i randze nie staje się posiadany. Nie projektujemy w tym zadaniu migracji ani scalania historycznych kopii.
4. Wdrożenie trzeba zakończyć testem rzeczywistego zapisu relacji MongoDB/Prisma i konfliktu ze starym formularzem. Mock repozytorium nie udowodni atomowości ani spójności obu stron relacji.

## 3. Zachowanie produktu

### 3.1 Wybór postaci i panel

- W `CompendiumNavbar` przycisk **„Wybierz postać”** z ikoną. Po wyborze: **„Postać: Aldara”**; kliknięcie ponownie otwiera boczny `Sheet`.
- Panel zawiera wyszukiwanie, tagi, zaznaczenie bieżącej postaci, link do karty oraz **„Wyczyść wybór”**. Na telefonie korzysta z dostępnej szerokości, lista ma własne przewijanie.
- Wykorzystać `CharacterPickerGrid`, uzupełniając go o prawdziwe przyciski/obsługę klawiatury, loading, error/retry i kolejne strony. Nie kopiować kolejnego pickera ograniczonego do pierwszych wyników.
- Domyślnie nie wybieramy nikogo. Postać główna i ulubione mogą być skrótami, ale wybór w kompendium nie zmienia ustawienia postaci głównej.
- Kontekst trwa przy przechodzeniu między kategoriami i stronami szczegółów kompendium. ID i `onlyOwned` zapisujemy w `sessionStorage` z podziałem na klucz API; nie zapisujemy nazw, danych postaci ani surowego klucza API. Użyć niesekretnego identyfikatora przestrzeni, a zmianę rzeczywistego klucza zawsze obsłużyć jako reset kontekstu.
- Po odświeżeniu najpierw weryfikujemy dostępność odtworzonej postaci. Do zakończenia odczytu akcje są nieaktywne. Zmiana klucza API natychmiast czyści aktywny wybór i filtr; wymaga ponownego wyboru pod nowym kluczem.
- Gdy postać zniknie albo stanie się niewidoczna: czyścimy kontekst i „tylko posiadane”, pokazujemy komunikat. Przy przejściowym błędzie sieci pokazujemy „Nie udało się odświeżyć postaci” i retry; nie zamieniamy błędu na brak posiadanych elementów.

### 3.2 Przeglądanie i filtrowanie

- Sam wybór postaci zostawia wszystkie wyniki. Przy każdym wpisie widoczny status **„Na postaci”** lub akcja dodania, niezależnie od filtra.
- Na pasku filtrów osobny przełącznik **„Tylko posiadane”**. Bez aktywnej, poprawnie wczytanej postaci jest wyłączony i nie ogranicza wyników.
- Przełącznik zachowuje stan między kategoriami. Wyszukiwanie, ranga, tagi, facety i wymagania nadal przecinają się z filtrem posiadania.
- Dla pustego repertuaru wyświetlamy „Ta postać nie ma elementów w tej kategorii” oraz możliwość wyłączenia filtra. Nie wracamy automatycznie do wszystkich wpisów.
- Widok płaski, grupowany i szczegóły mają identyczne oznaczenia oraz akcje. Grupa nie jest jednostką przypisania: operacja dotyczy konkretnego ID/rangi.
- Kolory wymagań i opisy wskazują aktywną postać; bez kontekstu zachowujemy dotychczasową postać główną. Niespełnione wymagania są informacją i nie blokują dodawania.

### 3.3 Dodawanie i usuwanie

- **„Dodaj do postaci”** przypina istniejący wpis. **„Usuń z postaci”** odpina wyłącznie od wskazanej postaci. Tekst dostępności i komunikat sukcesu zawierają nazwę postaci, np. „Dodano Młyniec 2 do Aldary”.
- Nie kopiujemy wpisu, nie zmieniamy jego opisu/rangi, nie usuwamy go z kompendium i nie zmieniamy innych postaci.
- Pierwsza wersja zapisuje bezpośrednio po kliknięciu. Bez globalnego „Zapisz” i bez dodatkowego potwierdzania odwracalnego odpięcia.
- W czasie zapisu blokujemy kolejne akcje przypisania dla tej postaci w bieżącej karcie. Pozostają dostępne przeglądanie, wyszukiwanie i nawigacja. Po potwierdzeniu aktualizujemy stan; brak optymistycznego znikania wiersza w pierwszej wersji upraszcza obsługę błędów.
- Przełączenie A → B podczas zapisu jest dozwolone: żądanie i obsługa wyniku zachowują przechwycone `characterId` oraz tożsamość dostępu A. Odpowiedź A nigdy nie modyfikuje kontekstu B. Ta sama zasada dotyczy zmiany klucza API.
- Usunięcie przy włączonym „tylko posiadane” usuwa wiersz dopiero po sukcesie. Komunikat jest dostępny dla czytnika ekranu, fokus trafia do następnego sensownego elementu/listy.
- Dodanie tej samej rangi ponownie niczego nie duplikuje. Dodanie wyższej rangi nie usuwa niższej; pole `replaces` pozostaje informacyjne. Automatyczne awansowanie lub zastępowanie wymagałoby osobnej funkcji.
- Bez poprawnego klucza API można wybrać dostępną publiczną postać i oglądać jej elementy; przyciski zapisu mają wyjaśnienie „Ustaw klucz API, aby zmieniać postać”. Serwer pozostaje ostatecznym źródłem uprawnień.

## 4. Zakres kategorii i kolejność udostępniania

Wspólny wybór i filtr obejmują wszystkie 12 obecnych kategorii. Akcje zapisu wdrażamy etapami, ponieważ nie wszystkie modele są zwykłym zbiorem relacji.

| Etap | Kategorie | Reguła zapisu |
|---|---|---|
| Pierwsze wydanie | Manewry, atuty, postawy, stany | Jednoznaczne `connect`/`disconnect` po ID. Postawa/stan oznacza wpis na karcie, nie aktywację efektu ani zmianę bieżącej postawy walki. |
| Rozszerzenie A | Broń, zbroje, tarcze, przedmioty, wierzchowce | Przypięcie/odpięcie istniejącego rekordu; bez liczby sztuk, kopii i automatycznej zmiany ofensyw/obron. Przed usunięciem trzeba ustalić z modelu, czy istnieją zależne odwołania i obsłużyć je jawnie. |
| Rozszerzenie B | Zaklęcia | Wybór docelowej mocy/więzi postaci w małym panelu. Zapis spójnie aktualizuje `powers[].spellsIds` i sumę `Character.spellsIds`. Usuwanie wskazuje konkretną moc; relacja globalna pozostaje, jeśli inne moce nadal mają zaklęcie. Brak mocy daje link do jej dodania. |
| Rozszerzenie B | Specyfikacje mocy | Samo `connect powerSpecifications` nie tworzy domenowego `Power`. Potrzebny panel utworzenia mocy/więzi z istniejącymi domyślnymi wartościami i formularzem; wiele mocy może wskazywać tę samą specyfikację. Odpięcie wymaga wyboru instancji i jawnego rozstrzygnięcia powiązanych zaklęć. |
| Rozszerzenie B | Rasy | Pojedyncze `raceId`: „Ustaw rasę”/„Zmień rasę” i „Usuń rasę”. Zmiana nie modyfikuje automatycznie statystyk postaci. |

W pierwszym wydaniu na pozostałych kategoriach działają kontekst, status i filtr, a panel może kierować do właściwej sekcji edycji. Nie pokazujemy niedziałających przycisków dodawania. Rozszerzenia A/B mają osobne zadania i testy; nie są warunkiem odbioru pierwszego wydania.

## 5. Projekt techniczny pierwszego wydania

### 5.1 Wspólny kontekst

Nowy katalog `src/application/compendium/character-scope/`:

- `CompendiumCharacterScopeProvider.tsx` — `selectedCharacterId`, stan odczytu/dostępu, `onlyOwned`, wybór/wyczyszczenie i odtworzenie sesji. Pełna postać pozostaje w React Query; provider nie prowadzi drugiego niezależnego źródła danych.
- `useCompendiumCharacterScope.ts` — dostęp do stanu; wariant opcjonalny pozwala bezpiecznie używać współdzielonych widoków poza kompendium.
- `CompendiumCharacterSelector.tsx` — przycisk w navbarze i `Sheet` korzystający ze wspólnego pickera.
- `CharacterOwnedFilter.tsx` — sam przełącznik bez własnego wyboru postaci.
- `CharacterMembershipAction.tsx` i `useCharacterMembershipMutation.ts` — status, akcje i wspólna obsługa zapisu.

Provider obejmuje navbar i `children` w istniejącym serwerowym layoucie. Nie zmieniamy całego layoutu na klientowy. Nie dodajemy kontekstu do globalnego Redux, bo zakres funkcji jest ograniczony do kompendium.

`CharacterModeFilter` zastępujemy po migracji wszystkich list. Nie utrzymujemy drugiego, konkurencyjnego wyboru postaci. Hook `useCharacterById` przenosimy do `application/characters/hooks`, aktualizując importy i zachowując stabilne memoizowanie mapowania.

### 5.2 Posiadanie i poprawna paginacja

- Dla wszystkich kategorii budujemy memoizowane zbiory dokładnych ID na podstawie postaci: relacje domenowe, `powerSpecificationId`, spłaszczone zaklęcia, `race.id`. Zbiór służy do statusu oraz do filtra.
- W nowym filtrze wykorzystujemy istniejące `search.id = anyOfValues(ids)`. Nazwa, ranga i inne ograniczenia zostają oddzielnymi polami; nie potrzeba iloczynu nazw/rang ani `matchesOwned` po pobraniu strony.
- Pusty zbiór obsługujemy jawnie jako pusty wynik, bez wysyłania pustego `anyOf`, który obecna warstwa potrafi pominąć.
- Zachowujemy zwykły rozmiar strony i doczytywanie. `hasMore` wynika z liczby wyników strony, a nie z samego faktu wybrania postaci. Testować również zbiór ponad 400 rekordów.
- Klucz zapytania zawiera kategorię, dotychczasowe filtry/paginację, ID wybranej postaci, tożsamość dostępu, `onlyOwned` i stabilny podpis posiadanych ID, gdy filtr jest aktywny.
- Zmiana postaci/filtra/repertuaru resetuje numer strony i zgromadzone wyniki jako jedną zmianę zakresu. Odpowiedzi poprzedniego zakresu nie mogą dokleić się do bieżącej listy. Wersja bez filtra nie resetuje przewinięcia po zwykłym dodaniu wpisu — zmienia się tylko status karty.
- Nie przekazujemy `characterId` jako uprawnienia z klienta do ogólnego wyszukiwania; lista ID nie daje dostępu do niewidocznej postaci. Jej odczyt nadal podlega serwerowej widoczności.

### 5.3 Osobny kontrakt zmiany relacji

Proponowana trasa:

```text
PUT /api/characters/{characterId}/compendium-memberships/{kind}/{entityId}
Body: { "present": true } albo { "present": false }
kind: maneuvers | perks | stances | states

200: { characterId, kind, entityId, present, changed }
400: niepoprawne parametry/body/rodzaj
401: brak klucza
403: niepoprawny klucz
404: postać niedostępna/nieistniejąca albo nieistniejący wpis przy dodawaniu
409: konflikt równoległego zapisu, jeżeli operacji nie da się bezpiecznie zakończyć
422: przekroczenie limitu liczby elementów danej kategorii
500: błąd zapisu
```

To ustawienie oczekiwanego stanu, nie „toggle”: ponowienie identycznego żądania jest bezpieczne. Odpięcie nieobecnego elementu zwraca sukces z `changed: false`, również gdy rekord biblioteki został już usunięty. Dodanie wymaga istnienia rekordu i dostępu do niego, jeśli w przyszłości zostaną wdrożone prywatne encje kompendium.

Nowy schemat Zod jest ścisły i dopuszcza wyłącznie wspierane rodzaje oraz `present: boolean`. Nie przyjmuje opisów wpisów, tablic całej sekcji ani nazw pól Prisma od klienta. Walidacja identyfikatorów powinna odpowiadać rzeczywistym ID repozytorium, bez zakładania nowego formatu dla starych danych.

Nowy `characterMembershipRepository.ts`:

1. Waliduje dostęp serwerowo: poprawny klucz z puli i publiczna postać lub postać widoczna temu kluczowi, zgodnie z `characterVisibilityWhere`/`isCharacterVisible`. Publiczna postać pozostaje edytowalna dowolnym poprawnym kluczem, zgodnie z obecnym modelem; nie wprowadzamy nowego systemu właścicieli.
2. Używa jawnej mapy rodzaju do relacji/modelu, nigdy dowolnego pola przekazanego w body.
3. Wykonuje wyłącznie relacyjne `connect`/`disconnect`, zachowując pozostałe relacje oraz dane wpisów. Nie zapisuje samych `*Ids` bez utrzymania odwrotnej strony relacji.
4. Sprawdzenie widoczności i zapis muszą być spójne również przy równoległej zmianie dostępu. Zastosować warunkowy zapis albo transakcję z konfliktem/retry; nie pozostawić niezabezpieczonego schematu „sprawdź, potem bezwarunkowo zapisz”.
5. Dwa równoległe dodania różnych ID zachowują oba wpisy; ponowne dodanie tego samego ID nie duplikuje relacji. Przeciwne operacje na tym samym ID kończą się ostatnim skutecznym zapisem, a klient pobiera stan serwera.
6. Respektuje współdzielone limity kategorii: 100 manewrów, 500 atutów, po 20 postaw i stanów. Sprawdzenie limitu i przypisanie są atomowe również dla dwóch równoległych żądań. Ponowienie przypisania już posiadanego ID jest sukcesem także przy pełnym limicie; odpięcie pozostaje dostępne.

Klient w `src/infrastructure/clients/charactersClient.ts` używa istniejącego `baseClient`, więc zachowuje nagłówek API i obsługę rzeczywistych kodów HTTP. Błąd nie może wracać jako HTTP 200 z polem `{ status: 500 }`, jak bywa w obecnym zapisie sekcji.

### 5.4 Konflikt z edycją całej postaci — wymagany element wdrożenia

Osobny endpoint chroni przed nadpisaniem innych pól przez nowy przycisk, ale sam nie ochroni przed późniejszym zapisaniem starego formularza postaci.

Wprowadzić precondition `expectedMembership` w zapisach `combat` i `details`: pierwotny snapshot surowych tablic ID relacji danej sekcji z chwili załadowania formularza. Snapshot pochodzi z odpowiedzi serwera (`CharacterWithRelations` zawiera skalarne `*Ids`), nie z aktualnie edytowanego formularza ani ponownego odczytu tuż przed wysłaniem.

- `details`: snapshot `perksIds`; `combat`: `maneuversIds`, `stancesIds`, `statesIds`, `spellsIds`, `powerSpecificationsIds`. Obejmuje relacje, które dana sekcja może nadpisać.
- Repozytorium porównuje snapshot i wykonuje całą aktualizację sekcji w tej samej transakcji MongoDB. Różnica daje HTTP 409 i nie wykonuje także zagnieżdżonych aktualizacji współdzielonych encji. Konflikt równoległego zapisu w transakcji również daje 409.
- UI zachowuje lokalny draft, informuje o zmianie repertuaru w innym miejscu i proponuje ponowne wczytanie; nie resetuje automatycznie niezapisanych pól i nie ponawia pełnego zapisu w tle.
- Po poprawnym zapisie formularz dostaje nowy snapshot z serwera. Otwarty, stary klient bez precondition otrzymuje błąd wymagający odświeżenia zamiast możliwości cichego nadpisania.
- Przed udostępnieniem przycisków wykonać mały test integracyjny na testowym MongoDB dla warunkowego nested update z aktualną wersją Prisma. Zweryfikować porównywanie surowych tablic oraz zachowanie przy konflikcie. Nie opierać gwarancji na komentarzach w istniejącym kodzie ani mocku.
- Jeśli connector nie pozwoli zagwarantować tego warunkowo na tablicach, zastąpić snapshot wersjami relacji/sekcji zwiększanymi w tej samej transakcji. To wymaga zmiany schematu i jawnego backfillu po backupie; decyzję i koszt należy zaktualizować w planie przed wdrożeniem UI. Docelowe zachowanie i test 409 pozostają obowiązkowe.

Wariant bazowy nie wymaga nowej kolekcji, nowych pól ani migracji danych. Nie obejmuje ogólnego rozwiązywania wszystkich konfliktów formularzy; chroni relacje objęte tą funkcją.

### 5.5 Cache, wymagania i współdzielone widoki

- Po sukcesie cache wybranej postaci jest aktualizowany autorytatywną odpowiedzią zapisu. Inne warianty dostępu tej postaci są oznaczane jako nieaktualne, a dotyczące jej odczyty zbiorcze `combat-lab-characters-by-ids` oraz `['owning-characters', kind, entityId]` odświeżają się w tle. Podsumowania postaci pozostają ważne.
- Hook mutacji pamięta zakres dostępu z chwili wysłania. Po zmianie klucza nie zapisuje odpowiedzi do cache nowego użytkownika ani odtworzonej sesji.
- Statusy i filtr są wyliczane z potwierdzonej listy zmienionej kategorii zwróconej przez serwer, również dla `changed: false`. Pełny refetch jest zachowany po niejednoznacznym błędzie sieci, gdy serwer mógł już zapisać, oraz przy odpowiedzi starszego serwera bez `characterPatch`.
- Jeśli sam zapis się udał, lecz odświeżenie nie: osobny komunikat o braku odświeżenia, bez sugerowania pewnego niepowodzenia zapisu. Do potwierdzenia świeżego stanu nie odblokowujemy kolejnych zmian na nieaktualnym repertuarze.
- `RequirementsView` dostaje opcjonalny, jawny kontekst oceny od widoków kompendium. Wybrana postać ma pierwszeństwo; poza kompendium i bez wyboru działa obecny `useMainCharacter`. Podczas ładowania innego kontekstu wymagania są neutralne zamiast przejściowo wskazywać starą postać.
- Akcję przypisania składają listy i strony szczegółów kompendium, np. przez prop/slot `characterActions`. Domyślnie jest nieobecna. Sam provider lub `disableEdit={false}` nie jest wystarczającym warunkiem pokazania mutacji w importerach.
- Dodać etykiety i komunikaty do `src/common/translations.ts` oraz wszystkich plików `translations.{pl-PL,de-DE,fr-FR}.ts`. Nowy panel używa dostępnych `Sheet`, `Button`, `Checkbox` i mechanizmu toastów.

## 6. Zadania i pliki

| Kolejność | Zakres | Główne miejsca |
|---|---|---|
| 1 | Potwierdzenie warunkowego zapisu, idempotencji i obu stron relacji na testowej bazie; decyzja snapshot/wersje | Nowy test integracyjny repozytorium, istniejący schemat Prisma |
| 2 | Kontrakt Zod, repozytorium relacji i trasa; preconditions starych zapisów | Nowe `persistence/schemas/characters/characterMembershipSchema.ts`, `persistence/characters/characterMembershipRepository.ts`, `app/api/characters/[id]/compendium-memberships/[kind]/[entityId]/route.ts`; zmiany `charactersRepository.ts`, schematów `combat`/`details`, ich tras i formularzy |
| 3 | Wspólny odczyt, provider, panel i kompletny picker | `application/characters/hooks/useCharacterById.ts`, `CharacterPickerGrid.tsx`, `useSearchCharactersSummary.ts`, `application/compendium/character-scope/*`, layout i navbar |
| 4 | ID jako tożsamość, przełącznik, paginacja i migracja 12 list | `characterOwnership.ts` i jego testy; listy `maneuvers`, `perks`, `stances`, `states`, `spells`, `powers`, `races`, pięć list `equipment`; usunięcie starego lokalnego pickera |
| 5 | Akcje czterech kategorii, cache i ocena wymagań | `charactersClient.ts`, hook mutacji, widoki/listy/szczegóły manewrów, atutów, postaw, stanów; `RequirementsView.tsx`, klucze cache |
| 6 | Regresje, dostępność, ręczny odbiór i tłumaczenia | Testy poniżej; wszystkie języki; aktualizacja ROADMAP po rzeczywistym wdrożeniu |
| Później A/B | Pozostałe akcje według tabeli zakresu | Osobne kontrakty dla ekwipunku, mocy, zaklęć i rasy; nie rozszerzać bezwarunkowo prostego endpointu relacji |

Każdy etap powinien mieć testy swoich reguł przed podłączeniem UI. Przyciski zapisu udostępnić dopiero po gotowej obsłudze konfliktu z edytorem. Nie jest potrzebny refaktor całej aplikacji ani przebudowa globalnego wyszukiwania.

## 7. Plan testów

### 7.1 Automatyczne — reguły i odczyt

| Przypadek | Oczekiwany wynik |
|---|---|
| Ten sam ID / ta sama nazwa i ranga, lecz różne ID / inna ranga | Posiadany wyłącznie konkretny ID. Brak fałszywego „Na postaci”. |
| Kolejność/duplikaty wejściowych ID | Stabilny zbiór i klucz filtra, brak pętli renderowania i nadmiarowych refetchy. |
| Brak postaci / wybrana bez wpisów | Odpowiednio pełne wyniki lub jawny pusty wynik przy aktywnym filtrze. |
| Filtr ID + tekst + ranga + tagi/facety + wymagania | Warunki się przecinają i są stosowane przed paginacją, w obu ścieżkach wyszukiwania: Prisma i agregacji wymagań. |
| Wiele stron, w tym ponad 400 posiadanych atutów (limit tej kategorii to 500) | Komplet wyników po przewinięciu, bez limitu rodzin/rang i przedwczesnego `hasMore=false`. |
| A → B, zmiana filtra na stronie 3, spóźniona odpowiedź A | Strona 1 nowego zakresu; brak domieszania lub odtworzenia starej listy. |

Rozszerzyć/zastąpić `application/compendium/__tests__/characterOwnership.test.ts`; dodać przypadki do `persistence/__tests__/searchEntity.test.ts` i `requirementSearchPipeline.test.ts`. Zachować istotne dotychczasowe regresje pustej listy i przełączania cache, dostosowując je do tożsamości ID.

### 7.2 Automatyczne — API i zapis

- Testy schematu: poprawne `present`, błędny typ, nieznane pole, niewspierana kategoria, puste ID i niepoprawny JSON; bez wywołania repozytorium dla błędnych danych.
- Testy trasy i repozytorium dla czterech kategorii: dodanie, odpięcie, ponowienie obu operacji, brak postaci, brak wpisu przy dodawaniu, nieobecny/usunięty wpis przy odpinaniu.
- Brak/niepoprawny klucz → 401/403; publiczna postać + poprawny klucz → zapis; prywatna postać + pasujący klucz → zapis; prywatna + obcy poprawny klucz → 404 i zero zmian. Ukryta i nieistniejąca postać dają taki sam komunikat.
- Test wywołania przez proxy oraz test bezpośredni handlera: sprawdzenie dostępu nie może zależeć wyłącznie od ukrytego przycisku.
- Udowodnić brak `create`/`update`/`delete` encji kompendium i brak zmian innych sekcji lub innych postaci.
- Błąd bazy → rzeczywiste HTTP 500; konflikt → 409; żadnego pozornego sukcesu HTTP 200.
- Limit kategorii: ostatni wolny wpis przechodzi, następny daje 422; równoległe dodania na granicy nie przekraczają limitu. Powtórne dodanie posiadanego ID i odpięcie na pełnej postaci nadal działają.
- Testy integracyjne na osobnej testowej bazie MongoDB: spójne `Character.*Ids` i odwrotne `characterIds`, powtórne dodanie bez duplikatów, dwa równoległe dodania różnych ID, równoległa zmiana widoczności, sprzeczne operacje na tym samym ID oraz rollback/konflikt nested update. Testy nie korzystają z produkcyjnego połączenia.
- Regresja obowiązkowa: otwórz edytor → dodaj manewr w kompendium → zapisz stary `combat` → 409, zachowany manewr i pozostałe dane. Powtórzyć dla usunięcia oraz `details`/atutu. Po ponownym odczycie formularz zapisuje się poprawnie.

Nowe testy obok `characterMembershipSchema`, `characterMembershipRepository` i trasy; rozszerzenie istniejących testów `charactersRepository`, tras `combat`/`details` oraz hooków/formularzy edycji. Gwarancji równoległości nie zastępować asercją kształtu mocka Prisma.

### 7.3 Automatyczne — komponenty i przepływ użytkownika

- Panel: otwarcie przyciskiem, wyszukiwanie z debounce, tagi, kolejne strony, wybór spoza pierwszej strony, zmiana, wyczyszczenie, loading/error/retry i pusty wynik.
- Klawiatura: wybór Enter/Space, widoczny fokus, Escape zamyka panel i oddaje fokus wywołującemu przyciskowi; czytelne nazwy ikon.
- Provider: brak automatycznego wyboru, nawigacja manewry → atuty → szczegóły zachowuje kontekst; odtworzenie po odświeżeniu, nieprawidłowy zapis sesji, niedostępna postać i zmiana klucza czyszczą stan. Błąd sieci zachowuje rozróżnienie od pustej postaci.
- Wybranie postaci samo nie filtruje. Włączenie/wyłączenie „tylko posiadane” i reset selekcji dają właściwe wyniki także po powrocie do klucza obecnego w cache.
- Dodanie/odpięcie w widoku płaskim, grupowanym i na szczegółach: właściwy `characterId`/`entityId`, blokada wielokliku, zmiana statusu po sukcesie, brak zmiany po pewnym błędzie, obsługa niepewnego wyniku sieciowego.
- Sukces mutacji i błąd refetchu są rozróżniane; kolejne operacje wymagają potwierdzenia aktualnego stanu. Przełączenie postaci/klucza w czasie żądania nie modyfikuje nowego kontekstu.
- Sprawdzić odświeżenie karty postaci, zbiorczego cache używanego przez wymagania oraz „Posiadane przez postacie”.
- Wymagania: główna A, aktywna B → ocena B i poprawny opis; brak kontekstu → A; niespełnienie nie blokuje przycisku. Ładowanie B nie pokazuje oceny A jako oceny B.
- Importery `ImportItemsSheet`/`ImportFromCharacterSheet` nadal zmieniają wyłącznie draft; brak nowych przycisków natychmiastowego zapisu w osadzonych `ManeuverView`/`PerkView`.
- Osobno sprawdzić, że „Usuń z postaci” nie wywołuje istniejącego `DeleteButton` ani klienta usuwania encji.

Nowe testy providera, selektora, akcji i hooka mutacji; rozszerzenia `CharacterPickerGrid.test.tsx`, `ManeuversList.test.tsx`, testów wymagań i importerów. Testy przepływu używają prawdziwego providera i QueryClient z mockowanym transportem, zamiast mockowania całej testowanej logiki.

### 7.4 Ręczny odbiór i komendy

1. Na dwóch postaciach z różnymi rangami sprawdzić wybór, przejście między kategoriami, dodanie/odpięcie i poprawność po ponownym otwarciu karty.
2. Powtórzyć w widoku grupowanym, na telefonie i klawiaturą; sprawdzić pusty repertuar, duży repertuar i wpis spoza pierwszej strony kompendium.
3. W dwóch kartach przeglądarki odtworzyć konflikt ze starym edytorem; brak cichej utraty zmian. Osobno zmienić klucz API podczas trwającego żądania.
4. Zasymulować utratę sieci i błąd serwera, sprawdzić retry oraz jednoznaczność komunikatów. Sprawdzić brak wpływu na inne postacie i treść wpisu biblioteki.
5. Przejść regresje istniejących filtrów na wszystkich 12 listach i importowania do draftu.

Po implementacji: ukierunkowane `npm exec -- vitest run <zmienione-testy>`, następnie `npm exec -- vitest run`, `npm run typecheck` i `npm run build`. `typecheck:scoped` może być szybkim krokiem pośrednim, ale jego obecny zakres nie obejmuje samodzielnie wszystkich nowych tras/hooków. Wymagane uruchomienie testu integracyjnego repozytorium na testowym MongoDB przed odbiorem zapisu.

Nie dodajemy Playwright wyłącznie dla tego planu. Jeśli potrzebna będzie automatyzacja prawdziwej nawigacji/odświeżenia w przeglądarce, zaplanować oddzielne uruchamianie środowiska E2E i danych testowych; powyższy ręczny odbiór nadal jest wymagany.

### Historyczny stan weryfikacji podczas planowania

Na etapie samego planowania brakowało lokalnego Vitest. Podczas implementacji zainstalowano zależności i wykonano testy; aktualny stan jest opisany w sekcji „Wynik implementacji”.

## 8. Kryteria odbioru pierwszego wydania

- [x] Jeden widoczny wybór postaci dla całego kompendium; panel pozwala ją znaleźć, zmienić i wyczyścić.
- [x] Kontekst trwa między kategoriami, a ustawienie postaci głównej pozostaje osobne.
- [x] Widać posiadane wpisy po dokładnym ID także przy wyłączonym filtrze.
- [x] Manewry, atuty, postawy i stany można przypinać/odpinać natychmiast; zapis jest idempotentny i nie zmienia biblioteki.
- [x] „Tylko posiadane” działa na wszystkich 12 listach razem z dotychczasowymi filtrami, poprawną paginacją i pustym wynikiem.
- [x] Zmiana postaci lub klucza podczas zapisu nie powoduje modyfikacji niewłaściwego kontekstu.
- [x] Wymagania dotyczą aktywnej postaci, lecz nie blokują dodawania.
- [x] Nieaktualny formularz nie nadpisuje nowego repertuaru; konflikt daje 409 i zachowuje draft.
- [x] Serwer egzekwuje klucz API i dostępność docelowej postaci, niezależnie od UI.
- [x] Importery nadal działają na draftach; panel i akcje są dostępne klawiaturą oraz na telefonie.
- [x] Przechodzą testy jednostkowe/komponentowe, integracja MongoDB, pełny typecheck/build i ręczny odbiór; ograniczenia rozszerzeń A/B są zgodne z tabelą zakresu.
