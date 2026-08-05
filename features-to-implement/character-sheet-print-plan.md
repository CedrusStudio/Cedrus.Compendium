# Karta postaci do druku (PDF) — analiza i plan

**Status:** ZREALIZOWANE 2026-08-04 (ROADMAP §9.1)
**Data:** 2026-08-04

> Dokument zachowany jako zapis analizy i decyzji. Odchylenia od pierwotnego planu zebrane w §12.

---

## 1. Decyzje wyjściowe

| Decyzja | Wybór | Konsekwencja |
|---|---|---|
| Technologia | **Print CSS + `Ctrl+P` → „Zapisz jako PDF"** | Zero nowych zależności. Osobna trasa `/characters/[id]/sheet` z regułami `@media print`. Nie ma przycisku „pobierz .pdf" — użytkownik drukuje z przeglądarki. |
| Zakres | **Kompakt + opcjonalny załącznik** | Strony 1–2: wszystko do gry przy stole. `Ekwipunek`, `moce i zaklęcia`, `umiejętności` mogą zająć własne strony. Dalej opcjonalny załącznik z pełnymi opisami manewrów/postaw/zaklęć/atutów. |
| Przeznaczenie | **Wydruk na sesję** | Optymalizacja pod czarno-biały druk, puste pola i kratki do wypełniania ołówkiem, miejsce na notatki. |
| Wzmocnienia | ~~Wartości bazowe + tabela buffów~~ → **wartości efektywne + tabela buffów** (odwrócone 2026-08-04) | `CharacterSheetView` woła `applyActiveBuffProfile` jak `CharacterView`, więc karta zgadza się z ekranem. Tabela wzmocnień mówi, co jest w tych liczbach wliczone. Powód odwrócenia w §12. |

---

## 2. Analiza stanu obecnego

### 2.1 Skąd wziąć dane — gotowe

Cała karta mieści się w jednym obiekcie `Character` (`src/domain/characters/Character.ts`). Zapytanie `characterQueryById` używa `includeAllRelations`, więc jednym zapytaniem przychodzą: postawy, stany, manewry, zaklęcia, atuty, bronie, pancerze, tarcze, ekwipunek, wierzchowce, specyfikacje mocy i rasa. **Nie trzeba dokładać żadnego endpointu ani zapytania** — wystarczy powtórzyć wzorzec z `src/app/(chracters)/characters/[id]/page.tsx` (prefetch po stronie serwera + `useGetCharacterById` po stronie klienta).

Uwaga na widoczność: `searchEntityById` respektuje `apiKeys` tylko wtedy, gdy dostanie klucz. Prefetch serwerowy w `page.tsx` klucza nie przekazuje — postać prywatna wraca jako `null`, a dociąga ją dopiero klient przez `useApiKey`. **Trasa karty musi trzymać się tego samego wzorca**, inaczej prywatne postacie wyjdą jako pusta strona.

Dwa niuanse modelu, łatwe do przeoczenia:

- **Zaklęcia nie wiszą przy postaci** — `Character` nie ma pola `spells`. Wiszą przy mocy: `Power.spells` (`toPower` w `characterMapping.ts` rozwiązuje je z `spellsIds`). Sekcja rzucania musi iterować po `character.powers`, nie po postaci.
- **Koszty i siła zaklęć** siedzą w `PowerSpecification.offenses: PowerOffense[]` (pole `cost`, `spellOffense`, `spellDamage`), pobieranej osobno — nie w samym `Power`.

### 2.2 Istniejących widoków nie da się użyć do druku

To jest główny wniosek analizy. Każdy widok karty postaci jest interaktywnym komponentem klienckim:

| Widok | Blokada |
|---|---|
| `StatisticView` | `useState` na bonusie, przyciski rzutu i zmiany wartości, `ResetButton` |
| `HealthCard` | `useState` na obrażeniach i leczeniu, `ChangeButtons` |
| `ModesCard` | wybór postawy przez `Select` — na papierze widać jedną pozycję zamiast listy |
| `ManeuversCard` | `Collapsible`, pole wyszukiwania, filtry po czasie rzucania i tagach, historia użycia |
| `PowerCard` | to samo + licznik esencji |
| `EquipmentView` | pole wyszukiwania, filtrowanie po stanie klienta |
| `DetailsView` | `ExpandableText` — obcina opis do „pokaż więcej" |

Próba wydrukowania tych widoków dałaby kartę z ukrytą połową treści i przyciskami zamiast liczb. **Sekcje karty piszemy od nowa jako czyste komponenty prezentacyjne** — bez `"use client"`, bez stanu. Jedynym komponentem klienckim będzie pasek narzędzi z przyciskiem drukowania.

### 2.3 Ile tego jest — budżet stron

Z backupu `2026-08-02` (215 postaci):

| Kolekcja | Maksimum w bazie | Średnia |
|---|---|---|
| Umiejętności | 48 | 0,2 |
| Zaklęcia | 55 | 4,4 |
| Atuty | 29 | 0,7 |
| Manewry | 25 | 6,9 |
| Ekwipunek | 27 | 0,1 |
| Postawy | 6 | 0,4 |
| Obrony / Ataki | 4 / 5 | 1,0 / 1,0 |

Rozkład jest skrajnie nierówny: 95% rekordów to szablony NPC/bestiariusza, które zmieszczą się na jednej stronie. Ekstremum to postać gracza — największa (`Saofie`, ~28 KB JSON) ma 48 umiejętności, 4 obrony, 5 ataków, 2 moce i 6 profili wzmocnień.

**Cel projektowy:** typowy NPC ≤ 1 strona, rozbudowana postać gracza ≤ 2 strony kompaktu + załącznik. Bez agresywnej kompresji sam `Saofie` rozlałby się na 8–15 stron.

### 2.4 Środowisko

Tailwind v4 (`@import "tailwindcss"` + `@theme inline`), tryb ciemny przez klasę `.dark` na `<html>`. Karta **nie może** dziedziczyć tokenów motywu — w trybie ciemnym wydruk wyszedłby biały na czarnym albo (częściej) niewidoczny, bo przeglądarki domyślnie nie drukują teł. Sekcja karty dostaje własne, twarde kolory.

---

## 3. Architektura

### 3.1 Trasa

Nowa grupa tras `(print)` z minimalnym layoutem — bez `CharacterNavbar`:

```
src/app/(print)/layout.tsx
src/app/(print)/characters/[id]/sheet/page.tsx   →  /characters/:id/sheet
```

Grupy tras nie wchodzą do URL-a, a `/characters/:id/sheet` rozwiązuje się tylko w jednym miejscu, więc kolizji z `(chracters)/characters/[id]` nie ma. Opcje karty jadą w query stringu (`?appendix=1&sections=combat,talents`) — dzięki temu są renderowane serwerowo, dają się wysłać linkiem i nie wymagają żadnego magazynu stanu.

Layout grupy siedzi **wewnątrz** `src/app/layout.tsx`, więc nie da się uciec od `Providers` (i dobrze — `useGetCharacterById` potrzebuje react-query) ani od `ScrollToTopButton`. Ten ostatni trzeba schować regułą druku (`@media print { body > button { display: none } }` albo dorzucenie mu klasy `screen-only` w layoucie głównym — czystsze).

### 3.2 Model karty w domenie — sedno projektu

```
src/domain/characters/sheet/sheetModel.ts       buildSheetModel(character, options): SheetModel
src/domain/characters/sheet/sheetOptions.ts     SheetOptions, parseSheetOptions(searchParams)
src/domain/characters/sheet/summarizeDescription.ts
```

`buildSheetModel` to czysta funkcja, która robi **całą** robotę:

- liczy wartości pochodne raz (`calculateTotalHealthForCharacter`, `calculateSelectedReduction`, `toOffenseString`, `toCriticalRangeString` — wszystko już istnieje w `src/domain/characters/combat/`),
- składa ciągi kości (`1k{grade*2}+{value}{bonus+testBonus}`, dokładnie jak `StatisticView`),
- bierze polskie etykiety cech i atrybutów z `SKILLS` (`src/domain/characters/statistics/skills.ts`) zamiast wymyślać własne,
- wycina puste sekcje (średnia postać ma zero broni i zero umiejętności — pusty nagłówek to zmarnowany wiersz),
- skraca opisy do jednej linii,
- wylicza delty aktywnych wzmocnień względem bazy,
- sortuje (manewry po czasie rzucania, umiejętności po kategorii).

Komponenty dostają gotowe stringi i liczby — **nie liczą niczego**. Zysk: cała logika testowalna bez Reacta i bez jsdom, co jest istotne przy progach pokrycia 85%/80% obowiązujących w repo.

### 3.3 Komponenty

```
src/application/characters/sheet/
  CharacterSheet.tsx              root — składa sekcje wg SheetOptions
  SheetToolbar.tsx                "use client" — window.print() + przełączniki sekcji (klasa screen-only)
  primitives/SheetTable.tsx       gęsta tabela: 8pt, break-inside: avoid na wierszu
  primitives/StatBox.tsx          pudełko statystyki: skrót + kość + wartość
  primitives/TickBoxes.tsx        kratki do odhaczania (zdrowie, esencja, cooldowny)
  primitives/WriteLine.tsx        linia do zapisu ołówkiem
  sections/HeaderSection.tsx
  sections/StatsSection.tsx       cechy + atrybuty
  sections/VitalsSection.tsx      zdrowie, bariera, PL, zdrowie śmiertelne
  sections/DefensesSection.tsx
  sections/OffensesSection.tsx
  sections/EquipmentSection.tsx
  sections/ActionsSection.tsx     manewry + postawy + stany
  sections/CastingSection.tsx     moce + zaklęcia
  sections/TalentsSection.tsx
  sections/PerksSection.tsx
  sections/BuffsSection.tsx
  sections/AppendixSection.tsx    pełne opisy
```

### 3.4 Print CSS

Nowy `src/app/(print)/sheet.css`, importowany tylko przez layout `(print)`:

```css
@page { size: A4; margin: 9mm; }

.sheet {
  color-scheme: light;
  color: #000;
  background: #fff;
  font-size: 8.5pt;
  line-height: 1.25;
}

@media print {
  .screen-only { display: none !important; }
  .sheet-section { break-inside: avoid; }
  .sheet-appendix { break-before: page; }
  tr, .sheet-row { break-inside: avoid; }
}
```

Zasada: **ramki i pogrubienia zamiast wypełnień**. Domyślne ustawienia druku w Chrome i Firefoksie pomijają tła, więc jakiekolwiek białe-na-kolorowym zniknie. `print-color-adjust: exact` tylko tam, gdzie tło naprawdę niesie informację (np. wyróżnienie domyślnej obrony) — i zawsze z zapasowym obramowaniem.

---

## 4. Układ karty

### 4.1 Strona 1 — walka

```
┌─────────────────────────────────────────────────────────────┐
│ IMIĘ POSTACI                    [Skrót]  Rasa · tagi · data  │
├──────────────────────┬──────────────────────────────────────┤
│ CECHY (6)            │ ZDROWIE                              │
│ SIŁ 1k6+6            │ Suma: 57   Wytrz. 4   PL 5           │
│ ZRC 1k6+4            │ ☐☐☐☐☐ ☐☐☐☐☐ ☐☐☐☐☐ ... (kratki obrażeń)│
│ ...                  │ Śmiertelne 9 / Rundy 9   Bariera —   │
├──────────────────────┼──────────────────────────────────────┤
│ ATRYBUTY (9)         │ OBRONY            (▸ = domyślna)     │
│ FECH 1k8+8+1         │ nazwa │odp│rez│red│blok│par│unik│bon │
│ ...                  │ ...                                  │
├──────────────────────┴──────────────────────────────────────┤
│ ATAKI          nazwa │ broń wiodąca │ kryt │ druga │ obraż.  │
├─────────────────────────────────────────────────────────────┤
│ EKWIPUNEK BOJOWY  broń: kości/zasięg/kryt · pancerz: red./  │
│                   ogr. · tarcza: blok/ogr.                  │
├─────────────────────────────────────────────────────────────┤
│ AKTYWNE WZMOCNIENIA   profil │ co zmienia (delty)            │
└─────────────────────────────────────────────────────────────┘
```

Wszystko, czego gracz potrzebuje w trakcie tury, mieści się nad zgięciem.

### 4.2 Strona 2 — akcje

- **Manewry** — tabela: nazwa │ ranga │ czas rzucania │ odnowienie │ efekt w jednej linii, posortowane od najszybszych
- **Postawy / Stany** — dwie tabele obok siebie: nazwa │ ranga │ efekt w jednej linii
- **Atuty** — dwie kolumny, `nazwa (ranga) efekt`, skrót przycięty do 58 znaków, żeby każdy wpis zmieścił się w jednej linii
- **Aktywne wzmocnienia** — profil │ źródło │ delty
- **Notatki** — puste linie do zapisu

### 4.3 Strony referencyjne

`Ekwipunek`, `moce i zaklęcia` oraz `umiejętności` dostają własne strony, **jeśli przekroczą 12 pozycji** (`needsOwnPage`). Poniżej progu płyną w tekście — 95% rekordów w bazie to szablony NPC z jednym pancerzem, a strona na jeden pancerz to zmarnowana kartka.

- **Ekwipunek** — bronie/pancerze/tarcze/wierzchowce w tabelach (liczby bojowe mają znaczenie), pozostałe przedmioty w dwóch kolumnach
- **Moce i Więzi** — typ │ poziom │ bonus │ esencja + kratki do odliczania esencji; pod każdą mocą tabela zaklęć: nazwa │ ranga │ czas │ koszt │ efekt
- **Umiejętności** — trzy kolumny, pogrupowane po kategorii w kolejności podręcznikowej (zmysł/język/fach/wiedza/sprawność/talent): `nazwa (cecha) … 1k8+3`

### 4.4 Załącznik (opcjonalny)

Zaczyna się od nowej strony. Pełne opisy manewrów, postaw, stanów, atutów i zaklęć w dwóch kolumnach, 7,5pt, posortowane alfabetycznie (to sekcja do wyszukiwania, nie do gry). Dla `Saofie` to około 5–7 stron; domyślnie **wyłączony**.

---

## 5. Techniki kompresji

Uszeregowane wg zysku:

1. **Tabele zamiast kart.** Aplikacja renderuje każdy manewr jako kartę z ramką i odstępami (~60 px). W tabeli wiersz to ~14 px. 25 manewrów: z ~2 stron do ~1/3 strony.
2. **Skrót opisu do jednej linii.** `summarizeDescription(text, maxChars)` — bierze pierwsze zdanie pierwszego akapitu (opisy w bazie są wielolinijkowe, z `\n`), ucina na granicy słowa, dokleja `…`. Kropka kończy zdanie tylko wtedy, gdy tekst się kończy albo następne słowo jest z wielkiej litery — to jedna reguła zamiast słownika skrótów („np.", „itp.", „m.in." zawsze poprzedzają małą literę). Budżet znaków jest **per sekcja** (`summaryLengths`), bo kolumny mają różną szerokość. Pełna treść zostaje w załączniku.
3. **Wycinanie pustych sekcji.** Średnia postać ma zero broni, zero wierzchowców, zero umiejętności. Nagłówek pustej sekcji to zmarnowany wiersz.
4. **Kolumny CSS** (`columns-2` / `columns-3`) dla list bez struktury tabelarycznej — umiejętności, atuty, przedmioty, załącznik oraz **długi opis postaci** (powyżej 8 linii). Opis Saofie to 24 linie jednolinijkowych notatek; w jednej kolumnie zjadał ćwierć pierwszej strony.
5. **Skróty etykiet**, wyprowadzone z `SKILLS`: `SIŁ ZRC BUD UMY CHA CZK` (cechy) oraz `FECH FOR PRE INI WWR JEŹ WYT REF WOL` (atrybuty); `Std` zamiast `Standardowa`. Legenda z pełnymi nazwami na dole strony 1.
6. **Typografia:** 8,5pt / interlinia 1,25 / marginesy 9mm. Poniżej 8pt tabele przestają być czytelne przy druku laserowym.
7. **Zero ikon.** `lucide-react` w druku to szum; skróty tekstowe niosą tę samą informację w mniejszej przestrzeni.
8. **Pomijanie zer.** `bonus: 0` renderowany jako pusta komórka, nie `+0`.

---

## 6. Wejście do funkcji

- **`CharacterView.tsx`** — przycisk z ikoną drukarki w rzędzie obok „Duplikuj" i „Edytuj", `Link` do `/characters/[id]/sheet`. Jedyna zmiana w istniejącym pliku.
- **`SheetToolbar`** (`screen-only`) — checkboxy sekcji, przełącznik załącznika, przycisk „Drukuj" wołający `window.print()`, plus krótka instrukcja: *w dialogu druku odznacz „Nagłówki i stopki", zaznacz „Grafika tła" jeśli chcesz wyróżnienia*.

---

## 7. Nowe i zmienione pliki

**Nowe (18):**

```
src/app/(print)/layout.tsx
src/app/(print)/sheet.css
src/app/(print)/characters/[id]/sheet/page.tsx
src/domain/characters/sheet/sheetModel.ts
src/domain/characters/sheet/sheetOptions.ts
src/domain/characters/sheet/summarizeDescription.ts
src/application/characters/sheet/CharacterSheet.tsx
src/application/characters/sheet/SheetToolbar.tsx
src/application/characters/sheet/primitives/{SheetTable,StatBox,TickBoxes,WriteLine}.tsx
src/application/characters/sheet/sections/*.tsx   (12 sekcji)
```

**Zmienione (1):** `src/application/characters/CharacterView.tsx` — przycisk drukowania.

Żadnych zmian w `prisma/schema.prisma`, w repozytoriach ani w API. Zero nowych zależności w `package.json`.

---

## 8. Testy

Progi w repo: 85% linii/funkcji/instrukcji, 80% gałęzi. Ciężar testów spada na warstwę domenową, gdzie jest tani.

| Plik | Co sprawdzić |
|---|---|
| `summarizeDescription.test.ts` | pierwszy akapit z tekstu wielolinijkowego, ucięcie na granicy słowa, tekst krótszy niż limit, pusty opis, opis bez kropki |
| `sheetModel.test.ts` | suma zdrowia zgodna z `calculateTotalHealth`, redukcja per typ, ciągi kości dla `grade`/`value`/`bonus`/`testBonus`, wycięcie pustych sekcji, delty wzmocnień, zaklęcia wyciągnięte z `character.powers` (nie z postaci) |
| `sheetOptions.test.ts` | parsowanie query, wartości domyślne, nieznana sekcja ignorowana |
| `CharacterSheet.test.tsx` | render na fixture z `CreateEmptyCharacter` + nadpisane pola (repo nie ma współdzielonego mocka postaci — testy budują własne): obecność sumy zdrowia, brak nagłówka pustej sekcji, załącznik pojawia się dopiero z `appendix=1` |

Czego **nie** testujemy automatem: samego wydruku. `Ctrl+P` nie jest sterowalne z Vitest. Zamiast tego ręczna lista kontrolna w PR:

- [ ] Chrome i Firefox, tryb jasny i ciemny — karta zawsze czarna na białym
- [ ] `Saofie` (największa postać) ≤ 2 strony kompaktu
- [ ] szablon NPC ≤ 1 strona
- [ ] żaden wiersz tabeli nie jest przecięty przez łamanie strony
- [ ] wydruk czarno-biały czytelny bez „Grafiki tła"

---

## 9. Etapy

| Faza | Zakres | Szacunek |
|---|---|---|
| **1 — Szkielet** | trasa `(print)`, `sheet.css`, `buildSheetModel`, `sheetOptions`, strona 1 (nagłówek, cechy, atrybuty, zdrowie, obrony, ataki), przycisk w `CharacterView` | ~1,5 dnia |
| **2 — Strona 2** | manewry, postawy/stany, moce i zaklęcia, umiejętności, atuty, ekwipunek, wzmocnienia | ~1 dzień |
| **3 — Załącznik i opcje** | `AppendixSection`, `SheetToolbar`, opcje w URL | ~0,5 dnia |
| **4 — Dopracowanie** | pola do wypełniania, łamanie stron, kalibracja gęstości na realnych postaciach, testy, wpis do `ROADMAP.md` | ~0,5 dnia |

Razem ~3,5 dnia. Po fazie 1 funkcja jest już użyteczna — reszta to poszerzanie zakresu, nie odblokowywanie.

---

## 10. Ryzyka i pułapki

| Ryzyko | Waga | Reakcja |
|---|---|---|
| Brak pobierania pliku `.pdf` — użytkownik musi przejść przez dialog druku | średnia | Świadomy koszt wybranej ścieżki. Wyjście opisane w §11. |
| Nagłówki/stopki przeglądarki (URL, data) psują wygląd | niska | Instrukcja w `SheetToolbar`; `@page` nimi nie steruje. |
| Tryb ciemny przeciekający do wydruku | **wysoka** | Twarde kolory w `.sheet`, `color-scheme: light`, zero tokenów motywu. Test ręczny w obu trybach jest obowiązkowy. |
| Różnice `break-inside` między Chrome a Firefoksem | średnia | `break-inside: avoid` na wierszach i sekcjach, nigdy na kontenerze całej strony. |
| Skrót opisu gubi sens manewru | średnia | Dlatego istnieje załącznik. Do rozważenia pole `shortDescription` w kompendium, jeśli skróty okażą się systematycznie złe — ale to osobny temat. |
| Postacie prywatne (`apiKeys`) puste na trasie karty | średnia | Powtórzyć wzorzec z `page.tsx`: prefetch serwerowy + doładowanie klienckie z kluczem. |
| Rozjazd między kartą a widokiem aplikacji | średnia | Cała matematyka idzie przez istniejące funkcje z `src/domain/characters/combat/` — żadnych ponownych implementacji w warstwie karty. |

---

## 11. Ścieżka wyjścia do prawdziwego pliku `.pdf`

Gdyby przycisk „Pobierz PDF" okazał się potrzebny, wybrana architektura go nie blokuje.
 Wystarczy dołożyć `src/app/api/characters/[id]/sheet.pdf/route.ts` (runtime `nodejs`), który przez `puppeteer-core` + `@sparticuz/chromium` renderuje **tę samą trasę** `/characters/[id]/sheet` do PDF-a. Layout, CSS i model karty zostają bez zmian — dochodzi wyłącznie handler i zależność.

---

## 12. Odchylenia od planu (co wyszło w implementacji)

| Zmiana | Dlaczego |
|---|---|
| **Ekwipunek, moce i umiejętności na osobnych stronach** — decyzja Marka w trakcie prac | Bez tego największa postać (`Saofie`) nie mieściła się w dwóch stronach: sam ekwipunek to 36 pozycji, umiejętności 48, zaklęcia 22. |
| **Łamanie stron adaptacyjne (`needsOwnPage`, próg 12)** zamiast bezwarunkowego | 95% rekordów to szablony NPC z jednym pancerzem i zerem umiejętności. Bezwarunkowa strona na sekcję dawała trzy kartki na postać, z których dwie były prawie puste. |
| **Budżety znaków per sekcja** (`summaryLengths`) zamiast jednej globalnej liczby | Atuty i postawy siedzą w blokach o połowie szerokości — cokolwiek dłuższego niż ~60 znaków zawijało się do drugiej linii i podwajało wysokość bloku. |
| **Reguła „wielka litera po kropce"** zamiast minimalnej długości zdania | Pierwotny próg 25 znaków wycinał krótkie, poprawne zdania („Pierwsze zdanie opisu." = 22 znaki). Reguła ortograficzna obsługuje skróty bez słownika. |
| **Długi opis postaci w dwóch kolumnach** (`descriptionIsLong`) | Nieprzewidziane w planie: opis Saofie to 24 linie krótkich notatek mechanicznych, w jednej kolumnie ćwierć pierwszej strony. |
| **Atuty i przedmioty jako listy dwukolumnowe**, nie tabele | Tabela na 29 atutów kosztuje 29 wierszy; dwie kolumny — 15. Liczby bojowe (bronie, pancerze) zostały w tabelach, bo tam kolumny mają znaczenie. |
| **`ScrollToTopButton` owinięty w `screen-only`** w `src/app/layout.tsx` | Layout grupy `(print)` siedzi wewnątrz layoutu głównego, więc pływającego przycisku nie da się z niego wyciąć — przewidziane dopiero przy implementacji. |
| **Skrypt `verify-sheet-model`** (nowy, nieplanowany) | Budżet stron to twierdzenie o realnych danych, nie o typach. Skrypt składa `CharacterWithRelations` z `backup/`, przepuszcza przez prawdziwe mapowanie i liczy strony; `--all` sprawdza wszystkie postacie, `--html` generuje podgląd wydruku bez uruchamiania aplikacji. |
| **Primitywy: 5 plików zamiast 4** | Doszedł `needsOwnPage.ts` — reguła łamania stron jest współdzielona przez trzy sekcje i zasługiwała na własne miejsce z uzasadnieniem. |
| **Wartości efektywne zamiast bazowych** — odwrócenie decyzji z §1 | Porównanie karty Saofie z aplikacją: ekran pokazywał 96 zdrowia, PL 6, barierę 7 i obrażenia `1k10+18`, karta — 68 zdrowia, PL 5, barierę 0 i `1k10+11`. Formalnie zgodne z planem („bazowe + delty obok"), w praktyce nie do obrony: karta wyglądała na zepsutą. `CharacterSheetView` woła teraz `applyActiveBuffProfile` dokładnie jak `CharacterView`, a tabela wzmocnień z nagłówka „wartości powyżej są bazowe" zmieniła się na „już wliczone w wartości powyżej". |
| **Brak kratek do odhaczania** (obrażenia, esencja) | Arkusz jest zapisem stanu postaci, nie narzędziem do śledzenia walki. Primitive `TickBoxes` usunięty w całości. |
| **Opis postaci jako osobna, wyłączalna sekcja na dole** | Blok, którego nikt nie czyta w trakcie tury, a na postaci gracza potrafi mieć dwadzieścia linii. Nad nim są teraz wyłącznie dane bojowe. |
| **Statystyki jako tabela `kość / wart. / bonus / test / razem`** | Sklejone `1k8+11` ukrywało, skąd wzięła się liczba. Przy okazji wypadły skróty (`SIŁ`, `FECH`) — przy połowie szerokości mieści się pełna nazwa, więc legenda przestała być potrzebna. |
| **Ekwipunek: kolumny per kategoria zamiast sklejonego stringa** | Jeden blob wartości rozpychał kolumnę nazwy, liczby nie wyrównywały się między wierszami, a opis dostawał resztki. |
| **Jawnie pusta lista sekcji ≠ lista nierozpoznana** (`parseSections`) | Znalezione przy przeglądzie: odznaczenie ostatniego checkboxa dawało `?sections=`, co wpadało w fallback „nic nie rozpoznano → włącz wszystko" i włączało z powrotem cały arkusz. Pusty ciąg jest teraz respektowany; fallback dotyczy tylko listy niepustej, w której nic nie pasuje. |

### Wynik weryfikacji (`npm run verify-sheet-model --all`, backup 2026-08-04)

```
postaci: 215
  karta na 1 str.: 154
  karta na 2 str.: 61
ok   budżet 2 stron dotrzymany dla wszystkich postaci
```

### Co zostało do zrobienia ręcznie

- `npm test` i `npm run typecheck` na maszynie docelowej — w piaskownicy nie da się uruchomić Vitest (brak linuksowego binarium `@rollup/rollup-linux-x64-gnu`, rejestr npm zablokowany). Asercje testów zweryfikowano osobno, uruchamiając model i komponenty przez `node --import ./scripts/ts-alias-hooks.mjs`.
- Checklista wydruku z §8: Chrome i Firefox, tryb jasny i ciemny, brak przeciętych wierszy. Wystarczy dołożyć `src/app/api/characters/[id]/sheet.pdf/route.ts` (runtime `nodejs`), który przez `puppeteer-core` + `@sparticuz/chromium` renderuje **tę samą trasę** `/characters/[id]/sheet` do PDF-a. Layout, CSS i model karty zostają bez zmian — dochodzi wyłącznie handler i zależność. To ~0,5 dnia, wtedy gdy będzie potrzebne, zamiast płacenia za headless Chrome (ciężka zależność, problemy na serverless, wolny cold start) od pierwszego dnia.
