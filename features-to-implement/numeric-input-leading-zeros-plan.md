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
