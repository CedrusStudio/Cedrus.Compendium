# Pola liczbowe — usuwanie zer wiodących

Status: poprawka zaimplementowana i sprawdzona lokalnie; gotowa do przeglądu na gałęzi.

Gałąź: `codex/normalize-numeric-inputs`, utworzona z pobranego `origin/main` (`d162bf6`).

## Problem i przyczyna

Po dopisaniu `5` do domyślnego `0` pole pokazuje `05`. Oczekiwane jest natychmiastowe `5`, bez potrzeby opuszczania pola. Samo `0` musi pozostać poprawną wartością.

W `RequirementPicker.tsx` wszystkie pięć pól liczbowych konwertują wpis przez `Number(...)`. Dla wymogu siły `05` już daje liczbę `5` w stanie formularza. To jednak nie gwarantuje poprawienia widocznego tekstu: React DOM dla `type="number"` porównuje wartość elementu z przekazaną liczbą przez luźne porównanie. Ponieważ `"05" == 5`, nie przepisuje tekstu. Przyczynę potwierdzono w kodzie zainstalowanego React DOM (`updateInput`) oraz testem wspólnego komponentu, który przed poprawką miał 4 błędy związane z zerami wiodącymi.

Jest też drugi wariant: `InputFormField.tsx` renderuje domyślnie pole tekstowe i przekazuje zdarzenie bez konwersji. Używają go zarówno nazwy/opisy, jak i rangi, ceny, zdrowie czy bonusy. Tutaj `05` może pozostać tekstem aż do konwersji przez schemat Zod. Nie można normalizować wszystkich pól tekstowych ani rozpoznawać przeznaczenia pola tylko po aktualnym typie wartości — po pierwszej edycji liczba może już być tekstem.

## Zakres znaleziony w kodzie

| Miejsce | Zakres poprawki |
| --- | --- |
| `RequirementPicker` | Zwykły próg wymagania, alternatywy, suma, liczba elementów i opcjonalna ranga. Wspólny edytor dla manewrów, atutów, postaw, stanów i czarów. |
| Wspólny `Input` z `type="number"` | Filtry wymagań i rangi, zmiana ilości, pola walki/bestiariusza, liczby w laboratorium walki. |
| `InputFormField` | Jawnie wskazane pola liczbowe w formularzach tworzenia/edycji kompendium i postaci, w tym ranga/cena w `PerkableAddSheet` i `PerkEditableFields`. |
| `LabeledFormInput` | Między innymi ranga i bonus nowej umiejętności; obecnie rozpoznaje pole liczbowe przez `typeof value`. |
| Natywne `<input type="number">` | Pola w `AiCharacterGenerationView`; sprawdzić i podłączyć do tej samej normalizacji. |
| Panel administracyjny kategorii | Pole kolejności przechowujące tekst i konwertujące go dopiero przy zapisie. Wykryte przy drugim przeglądzie. |

Filtr rangi ma już `normalizeGradeFilterInput` (konwersja, ograniczenie 0–15). Zachować jego reguły; wspólne formatowanie nie zastępuje walidacji ani ograniczeń domenowych. Tekstowe formuły kości, nazwy, opisy, identyfikatory i klucze API nie podlegają zmianie.

## Plan implementacji

1. Dodać czystą funkcję normalizującą wyłącznie nadmiarowe zera przed częścią całkowitą. Nie używać globalnego `Number(...)` do formatowania — zmienia zapis ułamków, notację wykładniczą i może gubić precyzję. Przykłady: `05 → 5`, `00012 → 12`, `000 → 0`, `-05 → -5`, `00.5 → 0.5`; `0`, `10`, `0.5`, `-0.5` i pusty wpis pozostają bez zmian. Zachować znak i zera wewnątrz/na końcu liczby.
2. Podłączyć normalizację do wspólnego `Input` dla pól jawnie oznaczonych jako liczbowe. W obsłudze zmiany zsynchronizować tekst rzeczywistego elementu przed wywołaniem dotychczasowego `onChange`. Poprawia to zarówno widok, jak i wartość odczytywaną przez formularz, również gdy stan liczbowy się nie zmienił (`0 → 00`, `5 → 05`). Nie opierać naprawy wyłącznie na ponownym renderze lub `onBlur`.
3. Dodać do `InputFormField` jawne oznaczenie przeznaczenia liczbowego, niezależne od aktualnego typu `field.value`. Przejrzeć miejsca użycia i oznaczyć rzeczywiste liczby. Zachować obecne typy danych formularza, reguły pustej wartości i walidację Zod; nie przerabiać formuł lub pól typu liczba/tekst bez sprawdzenia ich znaczenia.
4. Ujednolicić `LabeledFormInput` i pozostałe natywne pola liczbowe z tym mechanizmem. Zachować przekazywanie `ref`, `name`, `onBlur`, atrybutów `min/max/step` oraz dotychczasowych handlerów.
5. Zweryfikować zwykłe pisanie, wklejanie, kasowanie i edycję wewnątrz tekstu. Zmiana ma następować od razu, bez utraty kolejnych cyfr, przeskakiwania fokusu ani dodatkowych zapisów do API.

Pusty wpis nie jest tym samym co zero. Normalizator pozostawia `""`; dotychczasowy handler konkretnego pola nadal decyduje o `0`, `undefined` lub pustym tekście. Szczególnie opcjonalna minimalna ranga musi dać się wyczyścić. Sposób wpisywania minusa, ułamków i wykładnika należy sprawdzić w prawdziwej przeglądarce; formatowanie nie może ich przypadkowo blokować tam, gdzie pole je dopuszcza.

## Testy i kryteria odbioru

- **Jednostkowe normalizatora:** zera pojedyncze/wielokrotne, `05`, `00012`, `1005`, liczby ujemne i dodatni znak, ułamki (`00.50 → 0.50`), puste i przejściowe wpisy, notacja wykładnicza oraz długi ciąg cyfr bez utraty precyzji.
- **Wspólnego komponentu:** handler otrzymuje poprawiony tekst, a DOM pokazuje `5` zamiast `05`; przypadki niezmienionej wartości liczbowej (`00`, `05` przy stanie 5), pisanie i wklejenie, obsługa formularza przez `ref`/`onBlur`. Pole tekstowe z `005` pozostaje nietknięte.
- **React Hook Form:** wymaganie siły `0 → dopisanie 5 → 5` i poprawny liczbowy payload; warianty wymagania zwykłego, alternatywy, sumy i liczby. Opcjonalna ranga zachowuje możliwość wyczyszczenia. Ranga/cena przez `InputFormField` zachowują normalizację po kolejnych edycjach, resetowaniu i załadowaniu formularza.
- **Przeglądarkowe Playwright:** rzeczywiste dopisanie cyfry do `0` (nie samo `fill('5')`), `00 → 0`, wklejenie `0005`, kolejne dopisanie `2 → 52`, usunięcie i ponowny wpis, edycja w środku. Najpierw odtworzyć regresję na obecnym kodzie. Sprawdzić utworzenie manewru z wymogiem siły i przesłany payload przy przechwyconym API, bez zapisu do bazy użytkownika. Dodatkowo przykładowa cena/ranga i bonus umiejętności. Uruchomić Chromium desktop/mobile oraz Firefox i WebKit, jeżeli lokalnie dostępne — zachowanie pól liczbowych zależy od silnika.
- **Kontrola końcowa:** TypeScript, testy zmienionych formularzy i pól wspólnych oraz `git diff --check`. Rozszerzyć testy w razie wykrytej regresji. Nie jest potrzebna migracja bazy ani zmiana kontraktów API.

Kryterium zakończenia: każde pole objęte zakresem pokazuje znormalizowaną liczbę już podczas edycji, pojedyncze zero pozostaje dostępne, opcjonalne pola można wyczyścić, a wartości tekstowe i dotychczasowa walidacja działają jak wcześniej.

## Zrealizowane rozwiązanie

- `numericInput.ts` udostępnia normalizację tekstu i synchronizację elementu DOM z zachowaniem zaznaczenia/kursora dla pól tekstowych. Nie wykonuje konwersji liczbowej ani walidacji.
- Wspólny `Input` stosuje ją automatycznie przy `type="number"` oraz po jawnym oznaczeniu `numeric`. Następnie wywołuje istniejący handler. Dzięki temu działa także bez zmiany stanu liczbowego (`00` przy 0, `05` przy 5).
- `InputFormField` przekazuje jawne oznaczenie `numeric`. Oznaczono 37 deklaracji pól, w tym generowane z list właściwości zdrowia, obron, mocy i wzmocnień. Zachowano tekstowy rodzaj tych pól, ich klawiaturę, przejściowe wpisy i schematy walidacji. Nazwy, opisy, krótkie nazwy postaci i tryb zaokrąglania kosztu pozostają tekstem.
- Ranga/bonus dodawanej umiejętności mają jawny `type="number"`; `LabeledFormInput` respektuje tę właściwość również po otrzymaniu wartości tekstowej i wiąże etykietę przez `id`.
- Dwa natywne edytory liczb w propozycji postaci AI korzystają z tego samego helpera, bez zmiany wyglądu. Kolejność kategorii w panelu administracyjnym ma oznaczenie `numeric`.
- Powtórny audyt objął wszystkie `InputFormField`, użycia `Input`, natywne `input`, konwersje `Number`/`parseInt`/`parseFloat` i selektory liczb. Przyciski zwiększania/zmniejszania, listy wyboru i suwaki nie przyjmują tekstowego zapisu liczby i nie potrzebują tej poprawki. Nowe pola `type="number"` automatycznie dziedziczą normalizację; nowe pola liczbowe renderowane jako tekst powinny dostać `numeric`.

## Wynik weryfikacji

- 47 nowych testów: normalizator, zaznaczenie, wspólny `Input`, `InputFormField` z React Hook Form, `LabeledFormInput` oraz wszystkie liczbowe warianty wymagań, w tym wyczyszczenie opcjonalnej rangi. Testowane są surowe wartości DOM, ponieważ sprawdzenie samej wartości liczbowej nie wykrywa różnicy `05`/`5`.
- Pełny Vitest: **2086 zaliczonych, 16 pominiętych**, 223 zaliczone pliki. Pominięcia obejmują 15 osobno uruchamianych testów MongoDB i 1 istniejący pominięty przypadek; ta poprawka nie zmienia persystencji.
- Playwright: **12/12** — Chromium desktop, Chromium przy 390 px, Firefox i WebKit. Każdy projekt sprawdza utworzenie manewru i przechwycony payload (wymóg siły, ranga, cena, cooldown), edycję liczb na karcie postaci z zachowaniem kursora/ujemnych/ułamków/pustego wpisu oraz bonus nowej umiejętności. Nazwa `005` pozostaje niezmieniona. Dane i zapisy API są atrapami.
- TypeScript i `git diff --check` zaliczone. Testowy serwer został automatycznie zakończony.

Logi lokalne: `.mobile-numeric-before.log`, `.mobile-numeric-unit.log`, `.mobile-numeric-suite.log`, `.mobile-numeric-e2e.log`, `.mobile-numeric-types.log`.

## Uzupełnienie po feedbacku: puste pole w trakcie wpisywania

Użytkownik powinien móc skasować początkowe `0`, zobaczyć puste pole i dopiero wtedy wpisać własną liczbę. Sam normalizator zer wiodących tego nie zapewniał: handlery `Number("")`, jawne `"" ? 0 : …` i ograniczanie do minimum natychmiast przywracały wartość w kontrolowanym elemencie.

Wspólny, pozbawiony stylów `NumericInput` utrzymuje teraz pusty szkic podczas edycji. Nadal przekazuje dotychczasowemu handlerowi zdarzenie i zachowuje numeryczny stan formularza; zmienia tylko tekst widoczny podczas wpisywania. Wpisanie cyfry kończy pusty szkic. Opuszczenie pola przywraca wynik dotychczasowych reguł (np. `0` albo minimum `1`) przed wywołaniem walidacji `onBlur`. Jeżeli handler zachował `""` lub wyczyścił opcjonalną wartość do `undefined`, pole pozostaje puste.

Szkic odnosi się do wyniku konkretnej edycji: niezwiązane renderowanie rodzica go nie kasuje, ale nowa zewnętrzna wartość lub zmiana nazwy pola zastępuje szkic. Jedna aktualizacja lokalnego stanu po zdarzeniu zapamiętuje wynik handlera rodzica; komponent nie wymaga efektów ani zmiany typów domenowych na `number | string`.

`Input` deleguje do tego komponentu wszystkie pola `type="number"` i `numeric`. Dwa kompaktowe edytory propozycji AI również używają `NumericInput`, zachowując swoje style. Obsługa zer wiodących, zaznaczenia, `ref`, wartości opcjonalnych oraz dotychczasowej walidacji pozostaje wspólna.

Przed poprawką rozszerzony test regresji wykazał 7 błędów: znikający pusty wpis w wymaganiach i polu wspólnym. Dodano sześć przypadków dla edycji zera i liczby niezerowej, opuszczenia pola, minimum innego niż zero, zewnętrznej aktualizacji wartości/nazwy oraz ponownego renderowania rodzica. Istniejące przypadki zwykłego wymagania, alternatywy, sumy i licznika sprawdzają teraz także wyczyszczenie przed wpisaniem `5`. Testy przeglądarkowe wykonują rzeczywiste `Backspace` w wymogu siły oraz bonusie umiejętności i sprawdzają przywrócenie zera po opuszczeniu pustego wymogu.

Weryfikacja uzupełnienia:

- Playwright: **12/12** w Chromium desktop/mobile, Firefox i WebKit; od wyczyszczenia początkowego zera do ponownego wpisu i przechwyconego zapisu manewru. Bez zapisu do rzeczywistej bazy.
- Pełny przebieg Vitest: **2091 zaliczonych, 1 przekroczenie limitu 5 s, 16 pominiętych**. Przekroczenie wystąpiło w istniejącym teście dodania umiejętności ze strony 3 podczas równoległego uruchomienia testów przeglądarkowych. Ponowny przebieg tego pliku wraz z testami wymagań i wspólnego pola: **21/21**, przypadek strony 3 zakończył się w 3,0 s. Nie zmieniano limitu testu ani jego asercji. Pozostałe formularze i pola wspólne zaliczyły wcześniejszy przebieg ukierunkowany **19/19**.
- TypeScript i `git diff --check` zaliczone. Serwer testowy zakończony.

Logi: `.mobile-empty-numeric-before.log`, `.mobile-empty-numeric-unit.log`, `.mobile-empty-numeric-suite.log`, `.mobile-empty-numeric-regression.log`, `.mobile-empty-numeric-e2e.log`, `.mobile-empty-numeric-types.log`.

## Ostateczne wymaganie: pusty wymagany wpis blokuje zapis

Ta część zastępuje poprzednią regułę przywracania zera dla wymaganych pól formularzy. Wymagane pole po wyczyszczeniu pozostaje puste również po utracie fokusu. Zapis zgłasza **„Uzupełnij pole”**. Jawnie wpisane `0` przechodzi walidację, jeżeli mieści się w zakresie danego pola. Wartości opcjonalne nadal można usunąć.

### Zmiany

- `numberInput` w `numericSchema.ts` sprawdza brak wartości przed właściwym schematem liczbowym. Chroni 82 definicje liczbowe w 16 modułach schematów, używanych przez formularze i API: odrzuca pusty/biały tekst, `null`, brak wymaganej wartości i niepoprawny liczbowy szkic `NaN`, zamiast przepuszczać je przez `Number("") → 0`. Dotychczasowe zakresy, całkowitość, opcjonalność i domyślne wartości pominiętych pól pozostają zachowane.
- Tekstowe pola `InputFormField` zachowują pusty wpis do walidacji. Opcjonalny cooldown jest jawnie oznaczony i wyczyszczenie przekazuje `undefined`. Schemat cooldownu akceptuje również istniejące rekordy MongoDB z `null`, interpretując je jako brak opcjonalnej wartości. Pusty tekst w żądaniu API nie jest domyślnym zerem.
- Wymagane progi w `RequirementPicker` przekazują pusty wpis jako niepoprawny szkic liczbowy `NaN`; `NumericInput` wyświetla go jako pusty tekst. `RequirementNumberInput` pokazuje komunikat pod odpowiednim polem i wywołuje walidację po jego opuszczeniu. Obejmuje wymaganie pojedyncze, alternatywę, sumę i licznik. Minimalna ranga licznika pozostaje opcjonalna.
- Dodawanie umiejętności przechowuje edytowane rangę i bonus jako tekst do czasu walidacji, nie zastępuje wyczyszczonej rangi wartością domyślną, a do listy dodaje wynik schematu z liczbami. Początkowa ranga nadal pochodzi z `defaultTalent.grade`.
- Kompaktowe edytory propozycji AI zachowują niepoprawny szkic zamiast zera. Przed wysłaniem zmiany propozycja przechodzi lokalną walidację; niepoprawny wpis nie trafia do żądania jako `null` po serializacji `NaN`.
- Pola wyszukiwania i opcjonalne ograniczenia nie stają się obowiązkowe. Przyciski zmian ilości i parametry analizatorów zachowują dotychczasowe reguły; walidacja zapisu dotyczy edytowanych danych formularzy.

### Weryfikacja nowej reguły

- 24 testy walidacji i formularzy: brak wpisu/biały tekst, jawne zero, wszystkie warianty wymagań, minimalna ranga opcjonalna, opcjonalny cooldown i zgodność starszego `null`.
- 35 testów regresji dla tworzenia umiejętności, ras i wyposażenia. Dwa istniejące testy zostały dostosowane do nowego wymagania: jawnie pusty modyfikator rasy i ograniczenie inicjatywy wyposażenia mają być odrzucane zamiast zamieniane na zero.
- **16/16 testów Playwright**: Chromium desktop/mobile, Firefox, WebKit. Sprawdzają brak żądań zapisu przy pustych wymaganych polach, komunikaty błędów i zapis jawnego zera dla manewru oraz propozycji AI; obejmują także formularz walki postaci i nową umiejętność. API jest zastąpione atrapą.
- TypeScript i kontrola diffu zaliczone. Nie jest potrzebna migracja bazy.

Logi tej części: `.mobile-required-numeric-unit.log`, `.mobile-required-numeric-regression.log`, `.mobile-required-numeric-optional.log`, `.mobile-required-numeric-suite-final.log`, `.mobile-required-numeric-e2e.log`, `.mobile-required-numeric-types.log`.

## Dodatkowy dokładny przegląd ścieżek zapisu

Po rozszerzonym przeglądzie poprawiono także miejsca, w których sam formularz lub sam schemat nie zapewniał pełnego zachowania:

- **27 handlerów API** nie uruchamiało wcześniej schematów: tworzenie i aktualizacja atutów, manewrów, postaw, stanów, czarów, ras, specyfikacji mocy, broni, zbroi, tarcz i wierzchowców oraz zapis statystyk, umiejętności, wyposażenia, wzmocnień i kopii postaci. Wspólny `validateFormBody` uruchamia istniejący schemat przed zapisem; zwraca 400 z komunikatem i ścieżkami błędów. Repozytorium otrzymuje sparsowane dane, więc jawne tekstowe `"0"` staje się liczbą. Zachowano kontrolę zgodności ID w PUT. Nie zmieniano uwierzytelniania ani usuwania wpisów.
- **Opcjonalny cooldown po wyczyszczeniu:** samo przekazanie `undefined` powodowało pominięcie pola przez Prisma, przez co poprzednia wartość mogła zostać w bazie. Pełny zapis manewru/czaru normalizuje teraz brak cooldownu do `0` (brak czasu odnowienia). Dotyczy kompendium i zapisu repertuaru postaci. Porównywanie relacji nadal traktuje poprzednie `null`/brak jako zero, więc nie generuje niepotrzebnych aktualizacji niezmienionych wpisów.
- **Ręczne dialogi uczestników bitwy:** dodawanie i edycja sprawdzają wymagane zdrowie, rangę i bonus inicjatywy. Pusty wpis nie jest zastępowany 50/3/0 i nie zapisuje `NaN` do stanu. Bonus `0` pozostaje poprawny. Anulowanie edycji i ponowne otwarcie przywraca zapisane wartości uczestnika.
- **Panel kategorii:** pusta kolejność zgłasza „Uzupełnij pole”, zamiast po cichu użyć poprzedniej liczby; jawne zero jest poprawne. Niecałkowity wpis nie jest obcinany przez `parseInt`.

### Końcowe kontrole

- **2218 zaliczonych testów Vitest**, 229 zaliczonych plików. W zwykłym przebiegu pominięto 17 testów MongoDB uruchamianych osobno oraz 1 wcześniej wyłączony przypadek.
- **17/17 testów na rzeczywistym MongoDB 7** z replikacją, na osobnej bazie `cedrus_membership_test_numeric_audit`, pod lokalnym portem 27031. Nowe przypadki obejmują rzeczywisty handler POST/PUT kompendium (400 bez zapisu dla pustej ceny, zapis jawnego zera) oraz wyczyszczenie cooldownu manewru i czaru, zapis i ponowny odczyt postaci. Tymczasowy kontener `cedrus-numeric-audit-test` został usunięty; baza aplikacji nie była używana.
- **96 bezpośrednich testów API** w ramach pełnego zestawu: blokada pustego/białego/null wymaganego wpisu, dane zagnieżdżone, jawne zero, wyczyszczenie cooldownu, niepoprawny JSON, niezgodne ID i kopiowanie postaci. Niewłaściwe dane nie dochodzą do zapisu.
- **20/20 testów Playwright** w Chromium desktop/mobile, Firefox i WebKit: dodanie manewru, edycja postaci, nowa umiejętność, propozycja AI i ręczne dialogi uczestników bitwy. Sprawdzają również anulowanie edycji i brak nieobsłużonych błędów JavaScript w każdym scenariuszu. Serwer testowy został zakończony.
- TypeScript i `git diff --check` zaliczone.

Logi końcowe: `.mobile-numeric-audit-suite.log`, `.mobile-numeric-audit-api.log`, `.mobile-numeric-audit-regression.log`, `.mobile-numeric-audit-integration.log`, `.mobile-numeric-audit-e2e.log`, `.mobile-numeric-audit-types.log`.
