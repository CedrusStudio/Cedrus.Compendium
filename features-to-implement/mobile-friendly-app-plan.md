# Cała aplikacja wygodna na telefonie — analiza i plan

Data: 2026-10-18. Status: **pierwszy przekrojowy przebieg wdrożony i sprawdzony; pełny odbiór pozostaje otwarty**.
Baza analizy: zaktualizowany `main`, commit `3c598a4` (`init (#95)`).
Gałąź planu: `codex/plan-mobile-friendly-app`.
Gałąź implementacji: `codex/mobile-friendly-app`. Wyniki, potwierdzone problemy i granice sprawdzenia: [rejestr audytu](mobile-audit.md). Instrukcja testów: [e2e/README.md](../e2e/README.md).

Ponowna weryfikacja: 1984 testy jednostkowe, 10 integracyjnych na rzeczywistym MongoDB i 242 przeglądarkowe zaliczone; build i typy poprawne. Naprawiono zamknięcie dialogu po resize w Firefoxie oraz niezależność danych nowych postaci. Szczegóły celowych pominięć i pozostałego przypadku brzegowego funkcji rzutów są w rejestrze; pełny odbiór M0–M6 nadal obejmuje otwarte punkty opisane niżej.

### Doprecyzowanie po feedbacku użytkownika

Na telefonach wyszukiwarka i filtry **przewijają się ze stroną**. Nie pozostają przypięte nad wynikami. Wspólny `ListHeader`, bestiariusz i bitwa zachowują sticky dopiero od breakpointu `lg`; test przewijania obejmuje rozbudowane szybkie tagi ze zgłoszonego przypadku. To obowiązująca decyzja produktu, zastępująca opcjonalne kompaktowanie przypiętego paska na telefonie.

## 1. Cel i granice

Każdą obecną funkcję aplikacji można znaleźć i obsłużyć na telefonie: przeglądanie kompendium, przypisywanie wpisów postaci, karta i edycja postaci, tworzenie ręczne/kopia/AI, bestiariusz i prowadzenie walki, podręcznik, personalizacja, administracja oraz cały Combat Lab. Zmiana orientacji lub szerokości nie gubi bieżącej pracy. Desktop zachowuje użyteczność i gęstość informacji.

Nie wystarczy usunąć poziomego paska przewijania. Trzeba zapewnić czytelność, dostępność wszystkich akcji, poprawne otwieranie paneli, wpisywanie tekstu i zapis. Prace dotyczą interfejsu; nie wymagają migracji danych ani zmiany zasad gry. Redesign mechaniki walki i rozszerzenie akcji kontekstu postaci pozostają oddzielnymi zadaniami roadmapy.

**Stan dowodów:** sekcja 2 zachowuje wyjściową analizę statyczną. Późniejszy audyt uruchomionej aplikacji, zmierzone przepełnienia i wyniki testów są w [rejestrze](mobile-audit.md). Nie należy utożsamiać listy ryzyk statycznych z listą błędów potwierdzonych w przeglądarce.

## 2. Co wynika z obecnego kodu

| Obszar i pliki | Ustalenie z kodu | Konsekwencja dla planu |
|---|---|---|
| Layouty `src/app/**/layout.tsx`, `src/app/globals.css`, `common/components/navbars/*` | Moduły mają osobne paski nawigacji i odstępy. Np. `CharacterNavbar.tsx` używa `px-10`, a `CompendiumNavbar.tsx` już ma `px-3 sm:px-10` i zawijanie. | Uzgodnić wspólne marginesy i hierarchię akcji; poprawiać brakujące przypadki, zachować działające rozwiązania. |
| `src/common/components/ui/tabs.tsx` | `TabsList` ma `h-9 w-fit`; trigger `whitespace-nowrap` i wysokość zależną od rodzica. | Samo dopisanie `flex-wrap` nie wystarczy. Ustalić wariant nawigacji dla krótkich i długich list zakładek. |
| `src/common/components/ui/dialog.tsx`, `sheet.tsx` | Dialog jest wyśrodkowany i ma `p-6`, bez domyślnego ograniczenia wysokości/przewijania. Sheet domyślnie ma 3/4 szerokości; poszczególni użytkownicy nadpisują wymiary i scroll. | Wspólny kontrakt panelu: granice viewportu, dostęp do zamknięcia, treści i zapisu przy małej wysokości; sprawdzić wszystkie nadpisania. |
| `src/common/components/filters/FacetedTagFilter.tsx`, `TagFilter.tsx`, `ExistingTagSelect.tsx`; `inputs/ExistingRequirementDropdown.tsx` | Popovery mają m.in. 340/300 px; filtr fasetowy zawiera akcję `hidden ... group-hover:inline-flex`. | Ograniczyć rozmiar do dostępnej przestrzeni. Każda akcja musi być dostępna bez hover; zweryfikować kolizje portali przy krawędziach. |
| `src/common/components/ui/table.tsx` | Tabela **już ma** rodzica `overflow-x-auto`; komórki korzystają z `whitespace-nowrap`. | Nie przebudowywać wszystkich tabel automatycznie na karty. Sprawdzić rozmiary rodziców, sens kolumn i lokalne przewijanie. |
| `src/common/components/WithScroll.tsx`, `lists/GroupedItemsList.tsx` | Wewnętrzne listy mają `minHeight: '100vh'`. `WithScroll` sprawdza też wysokość dokumentu przy automatycznym doczytywaniu. | Sprawdzić krótkie listy, przewijanie w sheetach, zmianę orientacji i poprawność doczytywania; nie wymieniać jednostek mechanicznie. |
| `src/application/characters/CharacterView.tsx`, `edit/EditCharacterView.tsx` | Karta ma 5 zakładek i osobny niezawijany rząd akcji; edycja 6 zakładek. Statystyki na telefonie są w zakładce postaci. | Uporządkować zakładki/akcje, zachować dostęp do statystyk i wszystkie sekcje edycji. Sprawdzić stan formularzy przy zmianach układu. |
| `src/application/compendium/CompendiumNavbar.tsx`, `character-scope/CompendiumCharacterSelector.tsx`, `common/components/lists/ListHeader.tsx` | Navbar i wybór postaci częściowo reagują na szerokość; picker ma sheet `w-full ... overflow-y-auto`; listy mają sticky nagłówki i rozbudowane filtry. | Zweryfikować cały przepływ wraz z długą nazwą postaci, filtrami, błędami i doczytywaniem. Nie zakładać, że wszystkie elementy wymagają przebudowy. |
| `src/application/characters/ai/AiCharacterGenerationView.tsx`, `add/AddCharacterView.tsx` | Tworzenie obejmuje ręczne dane, kopię oraz duży edytor propozycji AI; pickery AI używają dolnych paneli `h-[80vh]`. | Uwzględnić wersję roboczą, katalog, referencje, błędy, korekty i akceptację, także przy otwartej klawiaturze. |
| `src/application/bestiary/BestiaryTable.tsx`, `bestiary/battle/BattleTable.tsx`, `battlePresets/components/BattlePresetsPanel.tsx` | Rozbudowane tabele z preferencjami kolumn i akcjami. Presety mają selektor 220 px i formularz `grid-cols-4`. | Zaprojektować priorytety kolumn i obsługę walki kciukiem. Zachować identyfikację uczestników, inicjatywę, HP i presety. |
| `src/app/(rulebook)/rulebook/[category]/layout.tsx`, `application/rulebook/RulebookSectionView.tsx` | Wewnętrzny layout ma `mx-10`, artykuł `w-3xl`. Sidebar jest `hidden xl:block`, spis treści `hidden lg:block`. | Płynna szerokość artykułu; wygodny dostęp do kategorii i nagłówków na telefonie. Zweryfikować istniejące linki, nie utożsamiać ukrycia sidebara z brakiem całej nawigacji. |
| `src/application/combat-lab/runner/CombatLabTabs.tsx`, `analysis/*`, `replay/CombatReplay.tsx` | 11 podstawowych zakładek plus analizatory wtyczek, `TabsList flex-wrap`; wykresy Recharts, graf xyflow, macierze i replay. | Osobny etap dla wszystkich analizatorów; dane dostępne dotykiem, lokalny pan/zoom i alternatywa tekstowa dla szczegółów z hover. |
| `src/app/personalization/page.tsx`, `src/app/admin/*`, `application/admin/*` | Wiele selektorów i akcji zarządzania; `admin/requirements/StructuredRequirementsManager.tsx` ma sheet `overflow-hidden`. | Sprawdzić wszystkie sekcje ustawień i edycję administracyjną, w tym długie formularze, listy tagów i zagnieżdżone wymagania. |
| `src/app/(print)/sheet.css`, `characters/[id]/sheet/page.tsx` | Osobny layout karty A4 i reguły `@media print`. | Mobilny pasek narzędzi i podgląd na ekranie; osobna regresja wydruku A4. |
| `package.json`, `vitest.config.ts`, `.github/workflows/test.yml` | Vitest/Testing Library/jsdom i testy jednostkowe w CI; brak skonfigurowanego Playwright/Cypress. | Zachować testy logiki, dodać rzeczywistą przeglądarkę do geometrii, dotyku i screenshotów. jsdom nie potwierdzi poprawnego layoutu. |

## 3. Pełna mapa zakresu

W `src/app` są obecnie **34 pliki `page.tsx`**. Trasy dynamiczne wymagają reprezentatywnych rekordów; sama wizyta pod adresem nie pokrywa zakładek i paneli. Poniższa mapa jest listą obowiązkową, aktualizowaną również o nowe strony dodane podczas realizacji.

| Rodzina | Trasy | Stany i funkcje do odbioru |
|---|---|---|
| Start i ustawienia (2) | `/`, `/personalization` | Nawigacja do modułów, skróty, ulubione, postać główna, klucz API, szybkie tagi, preferencje kolumn, zarządzanie presetami, zapis/błąd. |
| Postacie (5) | `/characters`, `/characters/favorites`, `/characters/add`, `/characters/[id]`, `/characters/[id]/edit` | Listy/wyszukiwanie, wszystkie zakładki karty i edycji, importery, bufy i repertuar, ekwipunek, tworzenie ręczne/kopia/AI, duplikowanie, potwierdzenia usuwania. |
| Karta do druku (1) | `/characters/[id]/sheet` | Narzędzia ekranowe, podgląd, druk długiej i krótkiej karty A4. |
| Kompendium (14) | `/compendium`, `/compendium/equipment`; `/compendium/{maneuvers,perks,stances,states,spells,powers,races}`; `/compendium/equipment/{weapons,armors,shields,inventory,mounts}` | Wszystkie 12 list, filtry fasetowe i wymagania, grupy/rangi, szczegóły, edycja/dodawanie/usuwanie encji, powiązania, wybór postaci i oznaczenia. Przypinanie/odpinanie w 4 obecnie obsługiwanych kategoriach; pozostałe zachowują swój aktualny zakres funkcji. |
| Bestiariusz (2) | `/bestiary`, `/bestiary/battle` | Filtry, kolumny, zaznaczanie i doczytywanie, wybór uczestników, duplikaty, inicjatywa, HP, akcje i presety bitwy. |
| Podręcznik (4) | `/rulebook`, `/rulebook/search`, `/rulebook/[category]`, `/rulebook/[category]/[slug]` | Kategorie, wyszukiwarka pełna i command palette, nawigacja między sekcjami, spis treści, kotwice, treść, tabele i bloki kodu. |
| Combat Lab (3) | `/combat-lab`, `/combat-lab/replay`, `/combat-lab/report/[id]` | Nowa symulacja, matchupy, balans, meta, synergia, kombinacje, scenariusze, walidator, strojenie, kalkulator, zapisane biegi oraz każdy zarejestrowany analizator wtyczki. Dobór postaci, konfiguracja, postęp, wyniki, replay i eksporty. |
| Administracja (3) | `/admin`, `/admin/tags`, `/admin/requirements` | Nawigacja, tagi/kategorie/fasety, wymagania i ich edytory, wyszukiwanie, masowe akcje i potwierdzenia, odmowa dostępu. |

Dla każdej rodziny obowiązują: ładowanie, pusto, duża liczba wyników, błąd i ponowienie, długie nazwy/opisy/tagi, brak dostępu i poprawne uprawnienia. Oddzielnie sprawdzić toasty, tooltipy, menu, selecty, okna potwierdzeń, skeletony i ekran braku rekordu. Nie trzeba mnożyć identycznych testów dla każdego rekordu: wspólne komponenty testować reprezentatywnie, ale każda strona i każda odmienna interakcja muszą mieć wpis w rejestrze pokrycia.

## 4. Wspólne decyzje interfejsu

1. **Treść i marginesy:** jedna kolumna jako punkt wyjścia; szersze siatki dopiero przy wystarczającej przestrzeni. Rodzice flex/grid pozwalają dzieciom się zwężać (`min-w-0`, odpowiednie `minmax`). Długie nazwy i opisy zawijają się; skrót musi mieć dostępny sposób odczytania pełnej wartości.
2. **Nawigacja:** główne akcje pozostają widoczne, drugorzędne mogą trafić do podpisanego menu „Więcej”. Krótkie listy zakładek mają lokalne przewijanie i widoczny aktywny element; w Combat Lab na telefonie użyć kompaktowego wyboru modułu z nazwą bieżącego widoku. Zachować semantykę, fokus i jedno źródło stanu. Makietę tych dwóch wzorców sprawdzić w M0 na prawdziwych etykietach.
3. **Panele i formularze:** ograniczenia do dostępnej szerokości/wysokości, odstęp od krawędzi, bezpieczne obszary ekranu. Jeden główny właściciel przewijania w panelu; nagłówek/zamknięcie i zapis zawsze osiągalne, również po fokusie ostatniego pola. Rozważyć `dvh` i safe-area tam, gdzie rozwiązuje to zmierzony problem. Portal popovera nie może wypadać poza ekran lub pod panel.
4. **Dotyk i tekst:** przyjąć projektowy cel 44 × 44 CSS px dla podstawowych akcji dotykowych, także ikonek zamknięcia/usuwania; ewentualne zwarte wyjątki uzasadnić i sprawdzić odstępy. Pola tekstowe na telefonie celują w 16 px. Nie zmniejszać całego interfejsu, nie blokować powiększania. To wymagania projektu, nie deklaracja pełnej zgodności z normą dostępności.
5. **Tabele:** w listach priorytet nazwy i akcji; drugorzędne informacje w rozwinięciu, jeśli poprawi to obsługę. Porównania liczbowe mogą zachować tabelę w oznaczonym, lokalnie przewijanym obszarze. Akcje wiersza, nagłówki i związek wartości z postacią pozostają zrozumiałe. Istniejących preferencji kolumn nie nadpisywać przy zmianie szerokości.
6. **Wykresy i grafy:** responsywny kontener, czytelne etykiety/legenda; kliknięcie/dotknięcie udostępnia szczegóły. Duże macierze/grafy mają wydzielony obszar oraz dostęp do wartości poza samym hover. Gesty nie mogą przejmować przewijania całej strony bez możliwości wyjścia. Kontrolki zoom/reset są dostępne dotykiem.
7. **Zachowanie stanu:** CSS i wspólna logika, bez dwóch niezależnych drzew formularzy/pobierania danych dla mobile i desktop. Zmiana orientacji nie resetuje filtrów, wybranej postaci, zakładki, uczestników bitwy ani wpisanych danych. Zachować obecny kontrakt zapisu i obsługę konfliktów kontekstu postaci.
8. **Sticky i nakładki:** na telefonie nagłówki filtrów przewijają się razem ze stroną; sticky dopiero od `lg`. Sprawdzić warstwy menu, sheetów, toasta i przycisku przewijania do góry. Nie maskować usterek globalnym `overflow-x: hidden`.

Najpierw wykorzystać istniejące prymitywy. Wspólny wariant komponentu wprowadzać, kiedy kilka realnych widoków wymaga tego samego zachowania; nie budować nowego frameworka responsywności. Zmiany globalnych `Button`, `Tabs`, `Table` i `Dialog` wymagają przeglądu ich użytkowników również na desktopie.

## 5. Etapy realizacji i kryteria odbioru

Każdy etap kończy się małym zestawem możliwym do zrecenzowania: zmiany, testy zachowania, zrzuty przed/po i aktualizacja rejestru. Nie czekać z testami do końca. Użytkownik zatwierdził implementację; poniższe kryteria pozostają docelowym zakresem odbioru, a nie deklaracją zaliczenia wszystkich wariantów.

Stan po pierwszym przebiegu implementacji:

| Etap | Wdrożone i sprawdzone | Do rozszerzenia przy pełnym odbiorze |
|---|---|---|
| M0 | Audyt wszystkich 34 stron, zmierzone problemy, Playwright i kontrola pokrycia tras. | Zatwierdzone wzorce obrazów do porównań pikselowych. |
| M1 | Wspólne układy, panele, tabele, zakładki, dotyk i doczytywanie list; testy otwartych paneli. | Rzeczywista klawiatura ekranowa i wszystkie kombinacje zagnieżdżonych paneli. |
| M2 | Wszystkie listy i zakładki postaci, przypisanie/odpięcie atutu, tworzenie z propozycji AI, zachowanie wpisanej wartości przy resize. | Wszystkie edytory encji i warianty błędów zapisu, importery oraz pełna edycja katalogu/referencji AI. |
| M3 | Układ filtrów/tabel, dostęp do kolumn, uczestnik zewnętrzny, zapis i odtworzenie presetu. | Rozbudowana bitwa z kopiami postaci, pełne operacje na presetach i ich błędy. |
| M4 | Artykuły i mobilna nawigacja podręcznika, strony ustawień/admina, długi edytor wymagań, podgląd A4 i generacja PDF. | Wszystkie operacje masowe admina, błędy ustawień i oględziny podziału długiego wydruku na strony. |
| M5 | Dostęp do wszystkich analizatorów, geometria, alternatywy tekstowe wykresów/grafu, worker, wynik i zapisany raport. | Pełne wyniki i eksporty każdego analizatora oraz anulowanie/błędy obliczeń. |
| M6 | Regresja jednostkowa, build, kontrola desktopu i silników przeglądarek; dokładne wyniki w rejestrze. | Fizyczny iOS/Android, wszystkie języki i tekst 200%. |

Zapisy w E2E używają kontrolowanego API; nie potwierdzają persystencji MongoDB. Szczegóły dowodów i otwartych punktów: [rejestr audytu](mobile-audit.md).

### M0 — audyt w przeglądarce i baza testowa

- [ ] Uruchomić lokalną aplikację z aktualnego maina, zinwentaryzować trasy, zakładki, portale i kontrolki; sprawdzić granice breakpointów dla miejsc, gdzie zmienia się układ.
- [ ] Przejść mapę z §3 na 390 px, wykonać kontrolę przepełnień na 320/360/430 px i porównanie desktopowe. Rejestrować także problemy wysokich/niskich ekranów, nie tylko szerokość.
- [ ] Utworzyć `features-to-implement/mobile-audit.md`: ID problemu, trasa/zakładka/stan, kroki, rozmiar, przeglądarka, dane/uprawnienia, element powodujący problem, obraz przed, priorytet, planowany etap, wynik i obraz po. Przechowywać obrazy jako artefakty raportu; bez sekretów i danych prywatnych.
- [ ] Dodać Playwright, konfigurację, fixture'y, kontrolę przepełnień, pierwszy test nawigacji/panelu oraz udokumentowaną instrukcję Windows/CI. Wersję narzędzia dobrać do bieżącego Node i zależności projektu przy wdrożeniu.
- [ ] Porównać dwa wzorce nawigacji (§4) na karcie postaci i Combat Lab; zapisać decyzję i zrzuty. Ustalić wariant tabel dla bestiariusza i walki na podstawie prototypu.

**Odbiór:** każda rodzina ma wynik audytu i zadania; istnieje powtarzalny test na prawdziwym silniku przeglądarki. Rozjazdy są potwierdzone obrazami, a nie samym wyszukaniem klas CSS. M0 aktualizuje kolejność i szacunek pozostałych etapów.

### M1 — wspólne fundamenty

- [ ] Layouty i paski nawigacji, marginesy, długie etykiety, wspólne warianty zakładek i toolbarów.
- [ ] Dialog/sheet/popover/select/command: wymiary, przewijanie, fokus, zamknięcie, klawiatura i zagnieżdżone pickery.
- [ ] Filtry/tagi/wymagania, formularze i walidacja, dotyk, dostęp do akcji ukrywanych dotychczas przez hover.
- [ ] Wyeliminować źródła przepełnień i konfliktów scroll/sticky w komponentach współdzielonych; zachować doczytywanie list.

**Odbiór:** testowy ekran z rzeczywistymi współdzielonymi komponentami działa przy 320 px i małej wysokości; nic nie nakłada się na treść, fokus i zapis są osiągalne. Kontrola desktopu i wszystkich miejsc nadpisujących bazowe rozmiary paneli.

### M2 — kompendium, czytanie i edycja postaci

- [ ] Wszystkie listy kompendium, ich filtry, szczegóły, edytory, właściciele wpisu i potwierdzenia.
- [ ] Wybór i zmiana postaci, długie nazwy, „tylko posiadane”, status zapisu, dodanie/usunięcie w obsługiwanych kategoriach i błędy.
- [ ] Listy postaci/ulubionych, karta i wszystkie sekcje edycji, repertuar, statystyki, bufy, ekwipunek i importery.
- [ ] Tworzenie ręczne i z kopii; pełna ścieżka AI: opis, referencje, propozycja, poprawki, katalog, akceptacja/błąd, powrót.

**Odbiór:** da się wykonać podstawowe zadania gracza od znalezienia wpisu do zapisanej zmiany i ponownego odczytu. Obrót telefonu w trakcie edycji nie gubi wpisanych wartości. Wygląd pozostaje czytelny dla rozbudowanej postaci.

### M3 — bestiariusz i prowadzenie walki

- [ ] Uporządkować filtry, wybór kolumn, zaznaczanie, akcje wierszy i doczytywanie bestiariusza.
- [ ] Wdrożyć sprawdzony w M0 układ uczestników bitwy, kontrole HP/inicjatywy i dostęp do pozostałych danych.
- [ ] Presety: wybór, zapis, aktualizacja, usuwanie, formularze i obsługa błędów; zarządzanie nimi także w personalizacji.

**Odbiór:** poprowadzić bitwę z kilkoma uczestnikami, także dwoma kopiami tej samej postaci; zmienić HP/inicjatywę właściwego uczestnika, zapisać i odtworzyć preset. Przewijanie nie powoduje przypadkowych zmian wartości. Kolejność, zaznaczenie i preferencje kolumn nie zmieniają się wskutek resize.

### M4 — podręcznik, ustawienia, administracja i druk

- [ ] Podręcznik: szerokość artykułu, nawigacja kategorii i sekcji, mobilny spis treści, wyszukiwanie, kotwice, tabele i długie treści.
- [ ] Start i wszystkie sekcje personalizacji, w tym formularze skrótów, szybkie tagi, klucz i komunikaty zapisu.
- [ ] Wszystkie ekrany administracji, edytory kategorii/faset/wymagań i akcje masowe z potwierdzeniami.
- [ ] Mobilne narzędzia i podgląd karty do druku, oddzielona regresja `@media print` A4.

**Odbiór:** czytanie i nawigowanie bez poziomego przewijania tekstu, ustawienia i edycja admina dostępne dotykiem. Wydruk krótkiej i długiej postaci zachowuje treść, kolumny i podział stron; zmiany ekranowe nie zmniejszają A4 do szerokości telefonu.

### M5 — cały Combat Lab

- [ ] Mobilna nawigacja do wszystkich 11 zakładek oraz analizatorów z rejestru wtyczek; wspólny wybór postaci i konfiguracja.
- [ ] Każdy analizator osobno: formularz, ładowanie/postęp, anulowanie jeśli istnieje, błąd, pusty i pełny wynik.
- [ ] Tabele, heatmapy, radary, wykresy i graf kombinacji: wielkość, legenda, szczegóły po dotyku, lokalny scroll/pan/zoom.
- [ ] Replay: uczestnicy, sterowanie turami, oś/log zdarzeń; zapisane biegi, raport i eksporty.
- [ ] Sprawdzić responsywność UI podczas obliczeń i brak uruchamiania tych samych obliczeń wskutek samej zmiany szerokości.

**Odbiór:** każdy analizator można skonfigurować, uruchomić i odczytać na telefonie; rozbudowany wynik pozostaje osiągalny. Przejście do replay/raportu i eksport działa. Żadna zakładka nie jest pominięta jako „tylko desktop”.

### M6 — pełna regresja i odbiór

- [ ] Powtórzyć pełny rejestr stron/stanów, docelową macierz rozmiarów i scenariusze z §7; obejrzeć zrzuty po poprawkach.
- [ ] Zamknąć problemy P0/P1 i uzgodnione P2, uruchomić pełne istniejące testy, typecheck i build produkcyjny oraz mobilne E2E.
- [ ] Sprawdzić na rzeczywistym iOS Safari i Android Chrome: klawiatura, przewijanie, pasek adresu, obrót, dotyk i druk/pobieranie. Ta część wymaga dostępu do urządzenia lub weryfikacji przez użytkownika; emulator jej nie zastępuje.
- [ ] Zaktualizować dokumentację uruchamiania testów, roadmapę i rejestr dowodów; podać pozostałe ograniczenia zamiast oznaczać niesprawdzone urządzenia jako zaliczone.

**Odbiór:** wszystkie kryteria z §8 spełnione i pokrycie każdej strony udokumentowane. Jeśli testy fizyczne są jeszcze niedostępne, raport wyraźnie pozostaje z otwartym punktem odbioru urządzeń.

## 6. Macierz sprawdzania

Wymiary to CSS px. Nie uruchamiać iloczynu wszystkich możliwych kombinacji — pełna mapa stron na rozmiarze referencyjnym, a dodatkowe warianty na reprezentantach wspólnych komponentów i krytycznych ścieżkach.

| Wariant | Zakres |
|---|---|
| 320 × 568 | Minimalna szerokość odbioru, stres długich etykiet, filtrów i akcji. |
| 360 × 800, 390 × 844, 430 × 932 | Telefony w pionie; 390 px jest referencją audytu wszystkich stron. |
| 844 × 390 i krótki viewport panelu | Poziomo, brak miejsca pod nagłówkiem, ostatnie pola i przyciski formularza. Zmniejszenie viewportu jest testem pomocniczym, nie emulacją prawdziwej klawiatury. |
| 768 × 1024, 820 × 1180 | Tablet i przejścia między układem telefonu a desktopem. |
| 1280 × 800, 1440 × 900 | Desktop, regresja szerokich tabel, formularzy i czytelności. |
| Powiększenie tekstu/zoom 200% | Ręczne sprawdzenie reflow, etykiet i osiągalności akcji; niezależnie od testu viewportu. |

Silniki: Chromium z profilem dotykowym oraz WebKit z profilem iPhone; desktop Chromium, dodatkowo smoke desktop Firefox. WebKit może być uruchamiany w CI na wspieranym systemie, jeśli lokalne środowisko Windows go nie obsłuży. Emulację viewportu/dotyku przewiduje [dokumentacja Playwright](https://playwright.dev/docs/emulation); nie daje to gwarancji zachowania fizycznego Safari i klawiatury.

Motywy: jasny i ciemny dla współdzielonych wzorców oraz ekranów z wykresami/nakładkami. Język podstawowy PL; dodatkowo długie etykiety DE/FR oraz smoke pozostałych obsługiwanych wariantów (`en-US`, `it-IT`, `es-ES`). `NEXT_LANGUAGE` jest konfiguracją aplikacji: samo ustawienie locale przeglądarki nie przełączy tłumaczeń; potrzebny odpowiedni wariant serwera/builda lub fixture komponentu.

## 7. Plan testów i danych

### Warstwy i środowisko

- **Vitest + Testing Library:** zachowanie zmienionych komponentów: nawigacja/fokus, otwieranie i zamykanie, dostęp do akcji bez hover, zachowanie formularza i wybranej postaci, komunikaty zapisu. Rozszerzać istniejące testy zamiast odtwarzać klasy CSS w asercjach. Te testy nie oceniają geometrii.
- **Playwright:** realny layout, dotyk, local scroll, widoczność/osiągalność kontrolek, zmiana rozmiaru/orientacji, kluczowe ścieżki zapisu i screenshoty. Najpierw mockowane, deterministyczne API dla audytu layoutu; nie traktować ich jako dowodu prawdziwego zapisu.
- **Integracja:** mały zestaw krytycznych ścieżek przez faktyczne API i dedykowane lokalne MongoDB z replikacją; zapis i ponowny odczyt postaci, przypisania i ustawień/presetów zgodnie z ich istniejącą persystencją. Wykorzystać obecne zabezpieczenia testów membership. Fixture'y odrzucają docelową bazę inną niż jawnie testowa; nie korzystają z bazy użytkownika. Izolacja danych między workerami, cleanup wyłącznie rekordów testowych.
- **Ocena obrazu:** zrzuty przed/po oglądane w przeglądarce lub jako pliki, a później porównywanie stabilnych baseline'ów. [Playwright opisuje porównania wizualne](https://playwright.dev/docs/test-snapshots); baseline'y muszą powstawać na stałym systemie i wersji przeglądarki. Zmiana obrazu wymaga przeglądu; nie akceptować automatycznie wszystkich nowych snapshotów.

Dane: krótka i bardzo rozbudowana postać, długie nazwy/tagi i ciągi bez spacji, pusty/pełny repertuar, wszystkie rangi, dużo ekwipunku, duża tabela bestiariusza, duplikaty w bitwie, długi artykuł z tabelą, zagnieżdżone wymagania, pełny wynik każdego analizatora. Ustalić seed symulacji i gotowe wyniki do testów layoutu; osobny mały realny przebieg testuje uruchamianie workera. AI mockować albo użyć deterministycznej lokalnej propozycji — testy mobilności nie wykonują płatnych wywołań modelu.

Kontrola przepełnień: po ustabilizowaniu strony `document.documentElement.scrollWidth <= clientWidth + 1`. Dodatkowo badać widoczne elementy, ucięcie tekstu, nakładanie i portale. Tabele/grafy mogą przewijać się wyłącznie we własnym, jawnie zarejestrowanym kontenerze z opisem; wyjątek nie może obejmować całej strony. Asercję uruchamiać po otwarciu panelu/filtrów, zmianie zakładki, załadowaniu kolejnej strony i pojawieniu się błędów. Sam brak overflow nie wykryje ukrytego lub zasłoniętego przycisku.

### Krytyczne scenariusze E2E

| ID | Działanie | Oczekiwany wynik |
|---|---|---|
| E01 | Start → każdy moduł → powrót; otwieranie menu i ustawień klucza | Każda pozycja osiągalna dotykiem, brak przepełnienia, poprawny fokus i powrót z panelu. |
| E02 | Kompendium: wyszukanie, fasety, wymagania, rangi i doczytanie | Filtry mieszczą się na ekranie, wynik i reset działają; aktywne filtry i nagłówek nie zasłaniają listy. |
| E03 | Wybrać postać, dodać i odpiąć wpis, przełączyć kategorię i „tylko posiadane”, przeładować | Stan zgodny z zapisem; zachowany kontekst. Błąd/konflikt daje osiągalne ponowienie; brak podwójnego zapisu po tapnięciu. |
| E04 | Karta → wszystkie zakładki → edycja sekcji → picker/import → walidacja → zapis → odczyt | Wszystkie pola i akcje osiągalne. Resize w trakcie wpisywania zachowuje wartości i nie duplikuje zapytań. |
| E05 | Utworzyć postać ręcznie i z kopii; edytować deterministyczną propozycję AI i zaakceptować | Nazwy, referencje i katalog mieszczą się, wersja robocza zachowana, poprawny wynik zapisu. |
| E06 | Bestiariusz: filtry, kolumny i zaznaczenie → bitwa z duplikatami → HP/inicjatywa → preset i odtworzenie | Operacja trafia do właściwego uczestnika, stan i kolejność zgodne, lokalny scroll nie przesuwa całej strony. |
| E07 | Podręcznik: wyszukanie → artykuł → spis treści/kotwica → tabela → następna sekcja | Tekst czytelny bez poziomego scrolla strony; nagłówki nie schowane pod sticky; tabela przewija się lokalnie. |
| E08 | Personalizacja: skrót, szybkie tagi, postać główna, kolumny i zapis | Wszystkie sekcje obsługiwalne, stan po ponownym otwarciu zgodny; błąd widoczny i możliwy do poprawy. |
| E09 | Admin: edycja tagu/kategorii i złożonych wymagań; potwierdzenie operacji | Panel i walidacja nie odcinają zapisu/zamknięcia. Bez uprawnień brak niedozwolonych akcji. |
| E10 | Combat Lab: wybór obu stron → mała symulacja → zapis → replay → raport/eksport | Dotykowe sterowanie, czytelny postęp i wynik, zachowane dane, poprawny pobrany plik. |
| E11 | Parametryzowany przegląd wszystkich analizatorów i wtyczek | Dla każdego konfiguracja oraz pełny/pusty/błędny wynik; wykresy i szczegóły dostępne bez hover, brak overflow strony. |
| E12 | Otworzyć kartę do druku i wydrukować krótką/długą postać | Mobilny toolbar osiągalny, podgląd kontrolowany; regresja PDF/A4 nie traci treści ani podziałów. |

W każdym etapie wykonać związane scenariusze na 320/390 px i desktopie. Dla paneli/formularzy dodać niski viewport, dotyk, klawiaturę sprzętową oraz kontrolę focus trap/zwrotu fokusu. Nie opierać testów wyłącznie na `click(force: true)` i sztucznym ukrywaniu przeszkód.

### Automatyzacja i uruchamianie

Dodano skrypty `test:e2e`, `test:e2e:mobile`, `test:visual:mobile` oraz `audit:mobile`. Konfiguracja uruchamia własny serwer, czeka na gotowość, stosuje jawny port/baseURL i izoluje API oraz bazę. Audyt można prowadzić na `npm run dev`; powtarzalny odbiór i CI na buildzie produkcyjnym, aby oddzielić kompilację/HMR od zachowania aplikacji. Dokładne polecenia i granice sprawdzenia: [instrukcja E2E](../e2e/README.md).

Na każdym PR: istniejące testy zmienionych obszarów, typecheck, build i krótki zestaw mobilny Chromium (320/390 px) + desktop; od M0 nie dopuszczać nowych przepełnień w naprawionych obszarach. Pełne E2E, WebKit/Firefox i macierz obrazów uruchamiać przed połączeniem całości oraz ręcznie na żądanie. Raport HTML, screenshoty i trace błędów jako artefakty CI, bez kluczy/danych prywatnych. Testy zapisu używają dedykowanego środowiska; nie omijać ich po cichu jako „zielone”, gdy brakuje bazy.

## 8. Definicja ukończenia

- [ ] Każda z 34 stron, wszystkie jej odmienne zakładki/panele oraz dodane w trakcie prac strony mają wynik w rejestrze pokrycia.
- [ ] Brak poziomego przewijania dokumentu od 320 px; uzasadnione wyjątki ograniczone do opisanych tabel/grafów lub podglądu A4, z całą funkcją dostępną.
- [ ] Wszystkie obecne operacje można wykonać dotykiem; nie ma funkcji zależnej wyłącznie od hover ani ukrytej dla telefonu.
- [ ] Przyciski, walidacja, tekst i menu nie nachodzą na siebie, zapis/zamknięcie są osiągalne na niskim ekranie i z klawiaturą.
- [ ] Orientacja, resize i lokalne przewijanie nie gubią danych ani nie wykonują przypadkowych operacji.
- [ ] E01–E12 przechodzą; istniejące testy, typecheck i produkcyjny build są zielone. Zrzuty telefonu/tabletu/desktopu obejrzane, a nie tylko wygenerowane.
- [ ] Brak otwartych P0 (utrata/błędny zapis, niemożliwa główna operacja) i P1 (niedostępna funkcja, przepełnienie/zasłonięcie treści, niedziałający dotyk). Pozostałe P2 to jawnie opisane drobiazgi wizualne, bez utraty funkcji.
- [ ] Desktop i wydruk A4 bez regresji. Fizyczny iOS/Android sprawdzony albo jednoznacznie wykazany jako niedokończony punkt odbioru.

## 9. Kolejność, podział zmian i szacunek

Zależności: **M0 → M1 → M2 → M3 → M4 → M5 → M6**. Usterki wspólne wykryte w dalszym etapie wracają do wspólnego komponentu i jego testów. P0 znalezione w audycie mają pierwszeństwo niezależnie od modułu.

Orientacyjnie: M0 1–2 dni, M1 2–3, M2 3–5, M3 1–3, M4 2–3, M5 3–5, M6 1–2; łącznie **13–23 dni pracy**, do ponownej oceny po M0. To skala zakresu, nie termin dostarczenia; największa niewiadoma to tabele walki, pełny edytor AI i wizualizacje Combat Lab.

Realizować małymi PR-ami według etapów; M2 i M5 dzielić dodatkowo na konkretne przepływy. Każdy opisuje problem i zmianę, zawiera dowód przed/po, wykonane testy i pozostałe punkty. Branch implementacyjny tworzyć z aktualnego maina z prefiksem `codex/`; jeśli plan zostanie wcześniej połączony, nie odtwarzać starego stanu kodu. W roadmapie pozostawić jeden główny wpis prowadzący do tego planu i aktualizować status etapów, zamiast tworzyć rozłączne listy zadań.
