# Kategorie tagów (Fala 10) — plan docelowy

> Rozwiązanie docelowe problemu „chcę tylko manewrów ofensywnych, a dostaję ofensywy bestii".
> Wariant świadomie **maksymalny** (model w bazie + panel admina), nie minimalny — priorytetem jest
> bezpieczeństwo i odwracalność, nie czas realizacji.
> Inwentarz tagów policzony na `backup/2026-08-04T06-49-21-923Z`.

**Legenda wysiłku:** `S` = < 0,5 dnia · `M` = 0,5–2 dni · `L` = > 2 dni
**Wartość:** ⭐ niska · ⭐⭐ średnia · ⭐⭐⭐ wysoka

---

## 1. Problem

Filtr tagów zna dwa tryby: dołącz (`$all`, czyli AND) i wyklucz (`$nin`). Żeby znaleźć „manewry
ofensywne dla wojaka", trzeba wybrać `ofensywne` i ręcznie wykluczyć osiem tagów bestiarnych —
i pamiętać o dziewiątym, gdy ktoś go doda.

Trzy obserwacje z danych, które wyznaczają kształt rozwiązania:

**Tagi już są facetami, tylko nigdzie tego nie zapisano.** 42 tagi Manewrów rozpadają się na cztery
niezależne wymiary — rola, pochodzenie, styl, oręż/cecha. To samo widać w kodzie: `powerTiers.ts`
trzyma prywatną listę `['potwory','potwór','wynaturzenie','natura','dziki','demon','diabeł','zwierzę','wodne']`
pod nazwą `category: 'bestia'`. Facet „pochodzenie" **już istnieje**, tylko zaszyty na sztywno
w generatorze postaci i niewidoczny dla wyszukiwarki.

**Rozłączność kategorii jest nie do utrzymania na danych.** 215 z 379 manewrów bestiarnych ma więcej
niż jeden tag pochodzenia — `potwory` i `zwierzęta` dzielą 117 rekordów ze 147 w sumie,
`eteryczni` i `nieumarli` 68. Automat „wybrano jedną kategorię ⇒ wyklucz resztę" ukryłby 117 pozycji,
które naprawdę są zwierzętami. Rozłączność zostaje więc **opcją per facet** (`selectionMode`),
domyślnie wyłączoną, a nie regułą. To samo dotyczy roli: `ofensywa`+`defensywa` współwystępują
na 9 Manewrach, 5 Postawach i 1 Atucie — i jest to **celowe**, bo manewr może dawać naraz obrażenia
i redukcję („Surowa Siła: dodaje 1/3 mod siły do obrażeń i redukcji"). Nawet facet roli nie jest
więc jednowartościowy. Jedyny naprawdę rozłączny facet w całej bibliotece to `klasa` zbroi.

**Szukany zbiór to „brak tagu z facetu", nie „wykluczenie tagów".** 613 manewrów nie ma żadnego tagu
pochodzenia, z czego 339 to ofensywy. To jest lista, o którą chodzi. Nie wymaga dotagowania niczego —
wymaga tylko, żeby dało się o nią zapytać. Stąd syntetyczna wartość `— brak —` w każdym facecie.

---

## 2. Inwentarz — co mamy dzisiaj

| Encja | Rekordów | Unikalnych tagów |
|---|---:|---:|
| Maneuver | 992 | 42 |
| Perk | 552 | 47 |
| Spell | 421 | 25 |
| Character | 215 | 30 |
| Stance | 214 | 13 |
| Weapon | 163 | 24 |
| Race | 44 | 9 |
| Armor | 43 | 7 |
| InventoryItem | 34 | 7 |
| State | 30 | 7 |
| PowerSpecification | 18 | 14 |
| Shield | 11 | 2 |
| Mount | 6 | 4 |

**Podział na facety** — zatwierdzony przez Marka 2026-08-07, do wprowadzenia seedem w 10.1:

| Facet | Encje | Tagi | `selectionMode` | Uwagi |
|---|---|---|---|---|
| `rola` | Manewr, Postawa, Stan, Zaklęcie, Atut | ofensywa, defensywa | `multi` | po ujednoliceniu z 10.0 |
| `rodzaj-istoty` | Manewr, Atut, Postać, Rasa | patrz tabela aliasów niżej | `multi` | **jeden facet, dwie pisownie** — decyzja Marka; 379 Manewrów ma ≥1, 215 ma ≥2 |
| `rola-postaci` | Postać | wojak 48, mag 36, rycerz 14, walczący-wręcz 10, zbój 8, dystansowy 7, jeździec 5, łucznik 4, kusznik 3 | `multi` | istnieje w danych, nigdy nie był widoczny w filtrze |
| `styl` | Manewr, Postawa, Atut | widmowy 93, fechtunek 93, fortel 81, harmonia 35, rdzeń 33, samotny-oręż 33, girgeński 10, durski 8, mord 7 | `multi` | `widmowy` to styl gracza, **nie** typ istoty — mimo współwystępowania z nieumarłymi |
| `oręż` | Manewr, Atut | kusze 50, walka-wręcz 47, łuki 40, dwuręczny 28, duale 25, tarcze 19, włócznie 18, sztylet-do-rzutu 6 | `multi` | |
| `cecha` | Manewr, Atut | krytyk 71, dystans 66, siła 65, zręczność 49, inicjatywa 30, umysł 10, wytrwałość 5 | `multi` | |
| `forma` | Manewr | okrzyki-bojowe 44, rozkazy 32, masowe 26, postawy 20, jeździectwo 13 | `multi` | |
| `rodzaj` | Broń | miecze 50, obuchowe 32, kłute 27, drzewcowe 19, sieczne 15, puginały 11, dystansowe 11, topory 10… | `multi` | |
| `klasa` | Zbroja | lekkie 14, średnie 14, ciężkie 11, szata 4 | `single` | jedyny naprawdę rozłączny facet w bibliotece |
| `jakość` | Broń, Zbroja, Tarcza | magiczne 86, legendarne 9, mistrzowskie 4 | `multi` (flaga) | patrz niżej |

### `rodzaj-istoty` — jeden facet, dwie pisownie (decyzja Marka, wariant B)

Biblioteka stosuje **konsekwentną konwencję gramatyczną**: Manewry nazywają rodzaj istoty liczbą
mnogą lub przymiotnikiem („manewry nieumarłych", „manewr demoniczny"), a Postacie i Rasy liczbą
pojedynczą („ta istota jest nieumarłym"). To nie są dwa pojęcia — to jedno pojęcie widziane z dwóch
stron. Zamiast rozbijać je na dwa facety, `TagDefinition` skleja pisownie przez `aliases`:

| Wartość facetu | Manewr | Postać / Rasa | Uwaga |
|---|---|---|---|
| `nieumarli` | nieumarli 126 | nieumarły 33 | |
| `zwierzęta` | zwierzęta 127 | **natura** 25 | inne słowo, nie odmiana |
| `potwory` | potwory 137 | potwory 47 | jedyne identyczne po obu stronach |
| `eteryczni` | eteryczni 78 | eteryczny 17 | |
| `demon` | demoniczne 37 | demon 8 + Rasa 6 | |
| `diabeł` | diabelskie 31 | diabeł 3 + Rasa 8 | |
| `prymitywni` | prymitywni 35 | **dziki** 16 + Rasa 4 | inne słowo, nie odmiana |
| `wynaturzenia` | wynaturzenia 20 | wynaturzenie 32 | |
| `gadzie` | gadzie 3 | gad (Rasa 5) | |
| `anioł` | — | anioł 6 + Rasa 6 | brak odpowiednika na Manewrach |
| pozostałe | lądowe 2, humanoidalne 1 | podstawowa 9, skałożerca 2, trupojad 2+1, wodne 2 | bez pary |

Że to naprawdę jedna oś, widać po nazwach: „Moc Hir'er'deno" i „Manifestacja Hir'er'deno"
(Hir'er'deno = Atut demona), „Siła i Zręczność Czarta" (Czart = Rasa diabła), „Diaboliczny Refleks
Impa" (Imp = Rasa). Tag na Manewrze znaczy „dostępne dla", stąd „Raptowna Napaść" ma naraz
`demoniczne`+`diabelskie`+`nieumarli`, a „Przewraz" `demoniczne`+`potwory`+`zwierzęta`.

**Zero renamów.** Encje zachowują swoje napisy, alias istnieje tylko w warstwie opisowej.

> ⚠️ **Aliasy muszą być per encja, nie globalne.** `natura` znaczy trzy różne rzeczy zależnie od
> encji: zwierzę (Postać 25), szkoła magii (Zaklęcie 55, Atut 52 — Vortex, Drążenie, Wytłumienie)
> i naturalny materiał (Przedmiot 14). Globalny alias `zwierzęta` ← `natura` wciągnąłby 107
> zaklęć i atutów do facetu rodzaju istoty. To przesądza kształt modelu w §3.

**`jakość` to flagi, nie drabina (decyzja Marka).** Dane potwierdzają: `legendarne` **zawsze**
współwystępuje z `magiczne` (6 z 6 broni, 2 z 2 tarcz), więc jednowartościowy facet by je zjadł.
`mistrzowskie` jest niemagiczne i stoi osobno. `multi` bez „— brak —" jako wartości domyślnej
(96 broni, 23 zbroje i 5 tarcz nie ma żadnej flagi — to zwykły sprzęt, a nie brak informacji).
⚠️ Broń ma `mistrzowski` (1 szt., liczba pojedyncza), Zbroje `mistrzowskie` (3 szt.) — **rename do 10.0**.

**`prymitywni` zostaje w `pochodzenie` (decyzja Marka).** Współwystępuje ze `zwierzęta` 6 razy
i zachowuje się jak reszta grupy, więc rozdzielanie tworzyłoby facet z jedną wartością.

---

## 3. Model docelowy

Dwie nowe kolekcje. **Encje nie zmieniają schematu — `tags: String[]` zostaje dokładnie takie, jakie jest.**

```prisma
model TagFacet {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  key           String   @unique          // "pochodzenie"
  label         String                    // "Pochodzenie"
  description   String?
  order         Int                       // kolejność w UI
  selectionMode String                    // "multi" | "single"
  supportsNone  Boolean  @default(true)   // czy pokazać „— brak —"
  entities      String[]                  // dla których encji facet ma sens
}

model TagDefinition {
  id       String       @id @default(auto()) @map("_id") @db.ObjectId
  tag      String       @unique           // kanoniczna nazwa, np. "zwierzęta"
  facetKey String?                        // null = nieprzypisany
  label    String?                        // etykieta, jeśli inna niż tag
  order    Int?
  aliases  TagAlias[]                     // pisownie równoważne — patrz niżej
  formerNames String[]                    // historia renamów, osobno od aliasów
}

/** Zagnieżdżony typ (Mongo composite), nie osobna kolekcja. */
type TagAlias {
  alias    String                         // "natura"
  entities String[]                       // ["character"] — TYLKO tam alias obowiązuje
}
```

**`aliases` to nie historia renamów.** W wariancie B alias jest żywym synonimem: `zwierzęta` ma alias
`natura` **wyłącznie dla Postaci**, bo na Zaklęciach i Atutach to samo słowo znaczy szkołę magii.
Dlatego alias niesie własną listę encji i nie może być zwykłym `String[]`. Historia renamów z 10.0
przenosi się do osobnego `formerNames`, żeby dwa różne pojęcia nie dzieliły jednego pola —
pomyłka tutaj oznaczałaby, że stara nazwa tagu zaczyna być traktowana jako równoważna bieżącej.

### Zasada bezpieczeństwa, na której stoi cały plan

**`TagFacet`/`TagDefinition` to warstwa opisowa nad tagami, nigdy źródło prawdy o encji.** Wynikają
z tego trzy własności, których nie wolno naruszyć:

1. **Wdrożenie z pustymi kolekcjami = stan dzisiejszy.** Brak definicji ⇒ filtr renderuje płaską listę
   jak teraz. Rollout jest z definicji bezpieczny, bo funkcja włącza się dopiero, gdy ktoś ją wypełni.
2. **Usunięcie facetu ani definicji nigdy nie dotyka danych encji.** Najgorszy skutek pomyłki w adminie
   to gorsze grupowanie w dropdownie.
3. **Tag bez definicji musi być widoczny.** UI zawsze renderuje kubełek „Pozostałe" z tagami, których
   nie ma w `TagDefinition`. Cicha niewidzialność tagu to jedyny sposób, w jaki ta funkcja mogłaby
   naprawdę zaszkodzić — i jest wykluczona konstrukcyjnie, nie dyscypliną.

---

## 4. Semantyka wyszukiwania

Nowe pole w `SearchPayload`, obok istniejących `search`/`exclude`/`requirementFilters`:

```ts
export type TagFacetFilter =
{
  facetKey: string;
  /** Tagi wybrane w tym facecie — łączone przez OR. */
  tags: string[];
  /** true = dodatkowo dopuść rekordy bez żadnego tagu z tego facetu („— brak —"). */
  includeNone?: boolean;
};

// SearchPayload
tagFacetFilters?: TagFacetFilter[];   // AND między facetami
```

Reguły:

- **OR wewnątrz facetu** — `zwierzęta` + `nieumarli` daje sumę, nie część wspólną. Dziś `$all` daje
  tu pustkę, co jest sprzeczne z intuicją każdego użytkownika.
- **AND między facetami** — `rola: ofensywa` × `rodzaj-istoty: nieumarli`.
- **Rozwijanie aliasów jest serwerowe i zależne od encji.** Klient wysyła wartość kanoniczną
  (`zwierzęta`); serwer rozwija ją do `["zwierzęta"]` dla Manewru i `["zwierzęta","natura"]`
  dla Postaci, zgodnie z `TagAlias.entities`. Klient nigdy nie wysyła listy pisowni — inaczej
  dodanie aliasu w adminie wymagałoby przeładowania każdego otwartego widoku.
- **`includeNone`** — rozwija się do „rekord nie ma żadnego tagu należącego do tego facetu",
  czyli `$nin` po **pełnej liście tagów facetu wraz z aliasami obowiązującymi dla tej encji**.
  Pominięcie aliasów w tym miejscu jest najbardziej prawdopodobnym błędem całej funkcji: „Postacie
  bez rodzaju" pokazałoby wtedy 25 zwierząt otagowanych `natura`. Osobny przypadek testowy.
- **Filtr pusty = brak warunku.** `tags: []` bez `includeNone` nie generuje nic.
- **Stare `search.tags` / `exclude.tags` działają bez zmian** i sumują się (AND) z facetami. Zero
  zmian w istniejących wywołaniach, zapisanych zapytaniach i szybkich tagach.

### Gdzie to wpiąć — i dlaczego nie w `createFiltering`

`search`/`exclude` to płaskie mapy `pole → warunek`, więc mieści się w nich **jeden** warunek na
`tags`. Facety potrzebują kilku niezależnych warunków na tym samym polu, więc nie przejdą tą drogą.

Są dwie ścieżki wykonania i trzeba obsłużyć obie:

- ścieżka typowana Prismy (`findMany`) — warunki idą jako tablica `AND: [{ tags: { hasSome: [...] } }, …]`;
- ścieżka `aggregateRaw` (`buildRequirementSearchPipeline`), którą `searchEntity` wybiera, gdy są
  filtry wymagań — warunki idą jako `$and: [{ tags: { $in: [...] } }, …]`.

**Jedna czysta funkcja `buildTagFacetConditions(filters, facetTagIndex)` produkuje listę warunków
w formie neutralnej, a dwa cienkie renderery tłumaczą ją na Prismę i na Mongo.** Ten sam zestaw
przypadków testowych puszczany przez oba renderery — to jedyny sposób, żeby te ścieżki nie
rozjechały się po cichu, bo dziś już raz się rozjechały (`hasEvery` vs `$all` mają inną obsługę
pustej tablicy).

**Nie przenosimy filtrowania tagów do `aggregateRaw` „przy okazji".** Ścieżka raw omija mapowania
Prismy (stąd istniejąca łatka `toSpell`) i widoczność postaci. Ścieżka typowana zostaje domyślna.

---

## 5. UI

Filtr tagów zamiast jednej listy pokazuje sekcje po facetach, w kolejności `TagFacet.order`, plus
zawsze na końcu **„Pozostałe"** z tagami bez definicji.

W nagłówku każdej sekcji:

- **„— brak —"** — jedno kliknięcie, dokładnie ten przypadek z tytułu tego planu;
- **„tylko ta kategoria"** — widoczne wyłącznie przy `selectionMode: single`, wybiera jeden tag
  i wyklucza resztę facetu. Świadomie **nie** jest to zachowanie domyślne (patrz §1, 215 rekordów
  wielokategoryjnych);
- licznik wybranych.

Wybory renderują się jako plakietki jak dziś, ale z etykietą facetu (`pochodzenie: nieumarli`),
żeby dało się odczytać z paska, dlaczego wynik jest taki, a nie inny.

Zachowane bez zmian: tryb dołącz/wyklucz, szybkie tagi z personalizacji, `Collapsible` z Fali 1.6,
sticky header.

### Stary filtr zostaje — jako widoczny przełącznik, nie ukryty fallback

Płaska lista tagów **nie znika**. W nagłówku filtra siada przełącznik `Facety ⇄ Wszystkie tagi`,
z zapamiętaniem wyboru w `localStorage` (jak `maneuvers-grouped-view`). Powody, dla których to
przełącznik, a nie tylko awaryjna ścieżka:

- **Aliasy zmieniają wyniki, i to celowo.** W trybie facetów `rodzaj-istoty: zwierzęta` na Postaciach
  dopasuje też `natura`. W trybie płaskim wpisanie `natura` dopasuje dokładnie `natura` i nic więcej.
  Obie odpowiedzi są poprawne na inne pytanie, więc obie muszą być osiągalne.
- **Surowy tag zawsze pozostaje wyszukiwalny.** Nic nie jest przemianowane, więc `nieumarły`,
  `demoniczne` czy `natura` dalej istnieją jako napisy na encjach i dalej da się po nich szukać
  dosłownie — to jedyny sposób, żeby zobaczyć, co naprawdę siedzi w danych, np. przy tagowaniu.
- **Tagi spoza facetów** (kubełek „Pozostałe") bywa wygodniej przeglądać alfabetycznie.

**Degradacja:** `TagDefinition` puste albo `/api/tag-facets` nie odpowiada ⇒ tryb płaski włącza się
sam, bez błędu. Filtr tagów nie może przestać działać dlatego, że warstwa opisowa padła.

---

## 6. Etapy

### 10.0 Ujednolicenie słownika — `M` · ⭐⭐⭐ — **warunek wstępny**

Wspólny facet `rola` nie ma sensu, dopóki Manewry mówią `ofensywne`, a wszystko inne `ofensywa`.

| Encja | Z | Na | Rekordów |
|---|---|---|---:|
| Maneuver | `ofensywne` | `ofensywa` | 575 |
| Maneuver | `defensywne` | `defensywa` | 240 |
| Perk | `widmowe` | `widmowy` | 13 |
| Perk | `okrzyki` | `okrzyki-bojowe` | 6 |
| Perk | `zwierzę` | `zwierzęta` | 3 |
| Weapon | `mistrzowski` | `mistrzowskie` | 1 |

**Rozstrzygnięte — bez renamu:** `demoniczne`/`diabelskie` (Manewry) i `demon`/`diabeł` (Rasy,
Postacie, Atuty) to dwa różne pojęcia, nie dwie pisownie jednego. Trafiają do dwóch osobnych
facetów (`pochodzenie` i `rasa`) i zostają jak są.

**Cztery pułapki, które trzeba domknąć zanim ruszy pierwszy rename:**

1. **Rename nie rusza personalizacji.** `PersonalizationProfileRecord.quickTagsByContext`
   i `quickExcludeTagsByContext` trzymają nazwy tagów jako stringi. Po zmianie `ofensywne`→`ofensywa`
   szybkie tagi każdego użytkownika po cichu przestają cokolwiek znajdować — bez błędu, bez śladu.
   `/api/tag-management/rename` musi objąć tę kolekcję.
2. **Rename nie rusza wymagań.** W `structuredRequirements` siedzą **34 referencje do tagów**
   (`okrzyki-bojowe` 18, `widmowy` 8, `girgeński` 5, `fechtunek` 1, `tarcze` 1, `ofensywa` 1) —
   to wymagania licznikowe z Fali 8. Plus tabela `equipmentCategories` w `Requirement.ts` keyowana
   po tagach. Zmiana tagu bez przejścia po tych miejscach cicho psuje matcher wymagań.
3. **Rename nie rusza literałów w kodzie.** `effectFieldsMeta.ts` ma `"defensywne"` jako domyślną
   wartość efektu `forbidTag` (dwa miejsca), `powerTiers.ts` listę tagów bestii, a
   `suggestRequirementMapping.ts` wpis `["ofensyw", "ofensywa", "perks"]`. Efekt `forbidTag` porównuje
   tagi po nazwie w czasie symulacji — literał, który przestał istnieć w bibliotece, daje blokadę,
   która nigdy nie zadziała, i żaden test tego nie złapie, bo w danych **nie ma jeszcze ani jednego
   `forbidTag`** (0 z 30 Stanów ma efekty).
4. **Rename nie jest atomowy.** Obecna implementacja to `Promise.all` po `model.update` dla każdego
   rekordu, bez transakcji. Przy 575 rekordach częściowa awaria zostawia bazę w połowie przemianowaną,
   a UI pokaże wtedy oba tagi obok siebie i nikt nie będzie wiedział, który jest prawdziwy.
   Do przepisania na jedno `updateMany` (Mongo `$set` po elemencie tablicy) albo na skrypt z jawnym
   raportem przed/po.

### Stan wykonania 10.0 (2026-08-07) — **KOD GOTOWY, MIGRACJA NIEURUCHOMIONA**

Wszystkie cztery pułapki domknięte w kodzie:

- `src/domain/tags/renameTagOccurrences.ts` — czysta logika (podmiana z deduplikacją, walker po
  `structuredRequirements`, mapowanie encja → konteksty personalizacji, sweep profilu);
- `src/persistence/tags/renameTagEverywhere.ts` — strona zapisu; encje idą **dwiema komendami
  Mongo** niezależnie od liczby rekordów (`$pull` na scaleniach, potem pozycyjny `$set`), zamiast
  `Promise.all` po N update'ów;
- `/api/tag-management/rename` — przyjmuje `dryRun`, zwraca raport (rekordy, scalenia, referencje
  w wymaganiach, profile) i zachowuje `updatedCount` dla panelu admina;
- `scripts/unify-tag-vocabulary.ts` + `npm run unify-tag-vocabulary[:apply]` — sześć renamów przez
  ten sam sweep, dry-run domyślny, raport z kolumną „wstecz".

**Dwa ustalenia z danych, które zmieniły obraz:**

1. **Te sześć renamów nie dotyka ani jednej referencji w `structuredRequirements`.** Sprawdzone
   przebiegiem po backupie: wszystkie 32 wymagania licznikowe używają już nazw kanonicznych
   (`okrzyki-bojowe` 18, `widmowy` 8, `girgeński` 5, `fechtunek` 1, `tarcze` 1, `ofensywa` 1),
   żadne nie wskazuje na `ofensywne`/`defensywne`/`widmowe`/`okrzyki`/`zwierzę`/`mistrzowski`.
   Sweep i tak zostaje — chroni każdy następny rename oraz `delete`.
2. **`ofensywa` traci prawo do domyślnej grupy w matcherze wymagań.** `COUNT_TAG_WORDS` zawierało
   `["ofensyw", "ofensywa", "perks"]` — inferencja „tag implikuje grupę", sensowna tylko dopóki tag
   siedzi na jednej kolekcji. Po ujednoliceniu `ofensywa` jest na Manewrach (575), Zaklęciach (138),
   Atutach (120), Postawach (67) i Stanach (22), więc „ilość ofensywnych 5" przestaje cokolwiek
   znaczyć. Grupa zmieniona na `undefined`: tag dalej jest rozpoznawany i emitowany, ale tekst musi
   nazwać własną grupę. Jedyne wymaganie w bibliotece, które tego używa („pięć atutów ofensywnych…"),
   nazywa „atutów" wprost, więc nic się nie cofa.

`powerTiers.ts` sprawdzony i **nietknięty** — jego lista `bestia` (`potwór`, `zwierzę`, …) dopasowuje
się do tagów Postaci i do opisów, nigdy do tagów Atutów, więc rename `zwierzę`→`zwierzęta` na Atutach
jej nie dotyczy. `effectFieldsMeta.ts` poprawiony (`defensywne` → `defensywa` w dwóch miejscach).

**Weryfikacja:** `tsc --noEmit` czysty. Testy vitest napisane
(`src/domain/tags/__tests__/renameTagOccurrences.test.ts`, przepisany
`src/app/api/tag-management/rename/route.test.ts`) — **do uruchomienia na Windows**, sandbox nie
ma linuksowego binarium rollupa i nie ma dostępu do rejestru npm. Logika zweryfikowana w sandboxie
osobnym przebiegiem: 15 asercji czystych funkcji + 17 asercji sweepu + przebieg po backupie, który
potwierdził wszystkie sześć liczb (575, 240, 13, 6, 3, 1) i zero scaleń.

**Kolejność wykonania:** backup → poprawki 1–4 → dry-run z raportem liczb → rename → weryfikacja
(zero wystąpień starego tagu w pięciu kolekcjach + w personalizacji + w `structuredRequirements`)
→ commit. Rollback = rename odwrotny, bo `aliases` w `TagDefinition` trzyma poprzednią nazwę.

**AC:** `ofensywa`/`defensywa` w pięciu kolekcjach; zero wystąpień starych nazw w danych, kodzie
i personalizacji; matcher wymagań ma tę samą skuteczność co przed zmianą (96%, 1353/1413).

---

### Stan wykonania 10.1 i 10.3 (2026-08-07) — **ZROBIONE**

- `prisma/schema.prisma` — `TagFacet`, `TagDefinition`, `type TagAlias`; klient wygenerowany.
- `src/domain/tags/tagFacets.ts` — indeks facetów per encja, rozwijanie aliasów, budowanie
  warunków, dwa renderery (Prisma / Mongo) z jednej listy warunków.
- `src/domain/tags/defaultTagFacets.ts` — 10 facetów, 70 definicji (zatwierdzony podział z §2).
- `scripts/seed-tag-facets.ts` + `npm run seed-tag-facets[:apply]` — dry-run liczy wystąpienia
  **w bazie**, nie w kodzie, i wypisuje kubełek „Pozostałe" per encja.
- `src/persistence/tags/tagFacetLayer.ts` — cache warstwy (TTL 30 s) + dwa warianty indeksu:
  do filtrowania (bez `availableTags`, żeby nie wstawiać agregacji przed każde wyszukiwanie)
  i do renderowania (z `availableTags`).
- `SearchPayloads` / `SearchQueryBuilder` / `searchEntity` / `requirementSearchPipeline` —
  `tagFacetFilters` addytywne; warunki liczone **raz**, przed wyborem ścieżki, i renderowane
  dla tej, która wykonuje. Ładunek bez facetów nie ładuje warstwy i nie zmienia kształtu zapytania.
- `GET /api/tag-facets/[entity]` — jedno wywołanie zasila cały filtr.
- Rename synchronizuje `TagDefinition`, ale **tylko gdy stara nazwa zniknęła ze wszystkich encji** —
  rename jest per encja, definicja globalna, więc przemianowanie `ofensywne` na Manewrach przy
  Atutach wciąż niosących tę nazwę nie może odciągnąć definicji od rekordów, które jej używają.

**Weryfikacja na backupie z nałożonym w pamięci renamem 10.0 — obie liczby z AC się zgadzają:**
`rola: ofensywa` + `rodzaj-istoty: — brak —` → **339**; `zwierzęta ∪ potwory` → **147** (a nie 117
ani 0). Pułapka aliasu sprawdzona wprost: 52 Atuty z tagiem `natura` (szkoła magii) **nie** wpadają
do rodzaju istoty — łapią się tylko 3 prawdziwie zwierzęce. `tsc --noEmit` czysty, 22 asercje
przechodzą.

---

### Stan wykonania 10.2 i 10.4 (2026-08-07) — **ZROBIONE**

- `src/app/api/tag-facets/admin` — CRUD facetów i definicji. Usunięcie facetu zeruje `facetKey`
  w definicjach (tagi wracają do „Pozostałych") i **nie dotyka żadnego rekordu encji**.
- `src/domain/tags/validateTagAlias.ts` — trzy reguły z §10.5 jako czysta funkcja, wołana przez API;
  naruszenie to 400 z czytelnym komunikatem, nie ostrzeżenie.
- `src/persistence/tags/deleteTagEverywhere.ts` + przepisany `/api/tag-management/delete` —
  delete zamiata też profile personalizacji, kasuje osieroconą definicję (dopiero gdy tag zniknął
  ze wszystkich encji) i **zwraca nazwy dotkniętych rekordów**, bo delete nie zostawia żadnego
  innego śladu po tym, co usunął. `structuredRequirements` są liczone, ale świadomie nietykane —
  co zrobić z niespełnialnym wymaganiem to decyzja treściowa, nie zadanie dla przycisku.
- `FacetedTagFilter.tsx`, `TagFilterSwitcher.tsx`, `useTagFacets.ts`, wpięcie w `ListHeader`
  (opcjonalne propsy — listy niezmigrowane zachowują się bez zmian) i w `ManeuversList`.

**Złapany cichy błąd:** `searchEntity` dostaje nazwę encji w słowniku **wyszukiwania** (`maneuver`,
`inventoryItem`), a facety są kluczowane słownikiem **zarządzania tagami** (`maneuvers`,
`inventory`). Bez tłumaczenia indeks budowałby się dla encji, której żaden facet nie wymienia →
zero warunków → filtr przestaje zawężać, bez błędu i bez pustego stanu. Doszło
`searchEntityToTagEntity` plus test kontraktowy na wszystkie trzy mapy naraz, bo to jest dokładnie
ten rodzaj dziury, którego nie widać w code review.

---

### Stan wykonania 10.5 i 10.6 (2026-08-07) — **ZROBIONE**

- `src/application/admin/TagFacetsPanel.tsx` + zakładka „Facety" w `/admin/tags`. Raport rozjazdu
  jest **na górze**, nie na dole: nowy tag ma rzucać się w oczy, a nie czekać na przypadkowe
  zauważenie. Edytor aliasów pokazuje tylko encje objęte facetem (martwego aliasu nie da się nawet
  zaproponować), a błąd walidacji wyświetla się dosłownie, nie jako „nie udało się zapisać".
- `src/domain/tags/tagFacetDrift.ts` + `GET /api/tag-facets/drift` — trzy kierunki rozjazdu: tagi
  bez definicji, definicje bez użycia, facety wskazujące encję, która nie niesie żadnego ich tagu.
  Próg `DRIFT_ALERT_THRESHOLD = 10`, żeby literówka w jednym rekordzie nie uczyła ignorowania raportu.

**Symulacja stanu po renamie 10.0 i wsiewie, na backupie:** 0 definicji bez użycia, 0 martwych encji
facetów, 46 tagów nieprzypisanych (z tego 17 z co najmniej 10 wystąpieniami).

**Największa dziura, jaką raport pokazał: brakuje facetu magii.** Siedemnaście istotnych
nieprzypisanych tagów to niemal w całości jeden klaster, rozpięty na Zaklęciach, Atutach, Mocach
i Postaciach — `moc` 106, `promieniowanie` 50, `wielorundowe` 49, `nekromancja` 41, `szamaństwo` 37,
`esencja` 37, `ochronne` 27, `precyzja` 27, `altoria` 24, `obszar` 23, `rozpraszanie` 22, `ogień` 22,
`wiara` 22, `zimno` 20, `vortex` 19, `błyskawice` 19. Rozpada się to na trzy osie: **źródło mocy**
(altoria, nekromancja, szamaństwo, vortex, esencja, drążenie, boska, aramantia, czarna-magia,
kinetyka, moc, wiara — i **`natura`**), **żywioł** (ogień, zimno, błyskawice, promieniowanie,
światło) oraz **sposób działania** (obszar, wielorundowe, ochronne, precyzja, rozpraszanie).

To retroaktywnie potwierdza projekt aliasów: `natura` jest kanonicznym tagiem **źródła mocy** na
Zaklęciach i Atutach, a aliasem `zwierzęta` wyłącznie na Postaciach. Gdyby alias był globalny,
107 zaklęć i atutów wpadłoby do rodzaju istoty. Facety magii to naturalna Fala 10.7 — dane są gotowe,
brakuje tylko decyzji, gdzie przebiegają granice między tymi trzema osiami.

`specjalne` (17×, na Postawach, Stanach, Atutach i Broniach) zostaje nieprzypisane świadomie —
to worek na wyjątki, nie oś.

## Fala 10.8 — braki panelu kategorii `[ZROBIONE]`

Spisane po tym, jak Marek przypadkiem wrzucił `krasnoludy` (Przedmioty) do kategorii
„Pochodzenie" — i nie miał jak tego cofnąć. Jedna z tych rzeczy to wada projektu, nie brak przycisku.

### A. Przypisania są jednokierunkowe — **blokujące**

`AssignmentChip` (lista wyboru z „— brak —") renderuje się **wyłącznie** w sekcji „Tagi bez
kategorii", czyli dla definicji z `facetKey === null`. W chwili gdy tag dostanie kategorię, znika
z tamtej sekcji i **nie ma już żadnej kontrolki**, żeby go przenieść albo odpiąć. `DefinitionRow`
w rozwiniętej karcie obsługuje tylko aliasy.

Potrzebne: w `DefinitionRow` ta sama lista wyboru kategorii co w `AssignmentChip`, z „— brak —"
jako pełnoprawną opcją, plus „Usuń definicję" (API ma `resource: definition, action: delete` od
10.2, UI nigdy tego nie woła).

### B. Kategorii nie da się edytować

Formularz istnieje tylko przy tworzeniu. Karta pokazuje `label`, `description`, `order`,
`selectionMode`, `supportsNone` i `entities` jako **tekst**. Żeby dziś zmienić opis albo dołożyć
encję, trzeba usunąć kategorię i utworzyć od nowa — co odpina wszystkie jej tagi.

Potrzebne: tryb edycji na karcie, na tych samych polach co `AddFacetForm`.

### C. Etykieta kategorii nie mówi, czego dotyczy — **to jest przyczyna pomyłki**

`pochodzenie-wierzchowca` wyświetla się jako **„Pochodzenie"**. Przy przypisywaniu `krasnoludów`
lista wyboru pokazywała samo „Pochodzenie" i wyglądało to na właściwą kategorię — bo dla Przedmiotu
„pochodzenie krasnoludzkie" ma pełny sens. Zakres (Wierzchowce) nie był nigdzie widoczny.

### D. Przypisanie poza zakresem kategorii jest **martwe i ciche** — najpoważniejsze

`krasnoludy` występuje wyłącznie na Przedmiotach, a `pochodzenie-wierzchowca` obejmuje wyłącznie
Wierzchowce. Powstała definicja, która **nie robi nic**: `buildTagFacetIndex` nigdy jej nie pokaże,
bo kategoria nie obejmuje Przedmiotów. Ale tag **zniknął z „Nieprzypisanych"**, więc raport twierdzi,
że problem jest rozwiązany. To dokładnie ta klasa błędu, przed którą broni się reszta tej fali:
cichy zły wynik zamiast widocznego.

Dwie warstwy obrony, obie potrzebne:
1. **Lista wyboru w raporcie ma oferować tylko kategorie obejmujące encje, na których tag
   faktycznie występuje.** `krasnoludy` (Przedmioty) nie powinno w ogóle widzieć kategorii
   wierzchowców. Nazwa w liście powinna nieść zakres: „Pochodzenie (Wierzchowce)".
2. **Raport rozjazdu potrzebuje trzeciego kierunku: „przypisania bez efektu"** — definicja, której
   kategoria nie obejmuje żadnej encji niosącej ten tag. Dziś `deadFacetEntities` łapie odwrotność
   (kategoria bez treści na encji), więc ta dziura przechodzi.

### E. Przedmioty: brakuje osi pochodzenia

Przedmioty **mają** kategorię „Miejsce noszenia" (hełmy, karwasze, peleryny, buty, pierścienie), ale
`krasnoludy` (2) należy do innej osi — pochodzenia kulturowego. Do decyzji, czy zakładać osobną
kategorię dla dwóch rekordów, czy zostawić w „Pozostałych" do czasu, aż takich tagów przybędzie.

⚠️ **Stan bazy do posprzątania:** `krasnoludy` jest teraz przypisane do `pochodzenie-wierzchowca`.
Po dodaniu (A) da się to cofnąć klikiem; do tego czasu naprawa wymaga ponownego
`npm run seed-tag-facets:apply` (seed nie zna tej definicji, więc jej nie ruszy — trzeba usunąć
ręcznie) albo dodania definicji `krasnoludy` z `facetKey: null` do seeda.

---

## Realizacja 10.8 (2026-08-09)

### A — przenoszenie i usuwanie definicji `[ZROBIONE]`

`DefinitionRow` dostał tę samą listę wyboru co sekcja „Tagi bez kategorii" oraz „Usuń definicję"
z potwierdzeniem. Kasowanie definicji nie rusza wpisów — tag zostaje na rekordach i wraca do
„Pozostałych", i tak też brzmi podpowiedź przy przycisku.

### B — edycja kategorii `[ZROBIONE]`

`FacetEditForm` na karcie, na tych samych polach co `AddFacetForm`, minus `key` — to on wiąże
definicje z kategorią, więc jego podmiana rozjechałaby przypisania. **Zwężenie `entities` liczy
się przed zapisem:** formularz wypisuje, które listy zabierasz i ile tagów przestanie się na nich
filtrować. Same wpisy zostają nietknięte.

### C — zakres w etykiecie `[ZROBIONE]`

Wspólny `CategoryPicker` renderuje opcje jako „Pochodzenie (Wierzchowce)". Sama „Pochodzenie" była
bezpośrednią przyczyną pomyłki z `krasnoludami`.

### D — dwa nowe kierunki raportu `[ZROBIONE]`

**Przypisania bez efektu** (`ineffectiveAssignments`) — kategoria nie obejmuje **żadnej** listy
niosącej tag. Czerwona sekcja **nad** nieprzypisanymi, bo to błąd, nie zaległość: wygląda na
załatwione, a nie działa. Tag, którego nikt nie używa, jest z tej listy wyłączony — to już
`unusedDefinitions`, a podwójne zgłoszenie jednego zjawiska uczy ignorować raport.

Drugą warstwą obrony jest sam picker: oferuje tylko kategorie sięgające list, na których tag
faktycznie występuje (`drift.tagEntities`). Kategoria już przypisana zostaje na liście nawet jeśli
nie pasuje — inaczej nie dałoby się jej zdjąć.

**Niepełne pokrycie** (`partialCoverage`) — kategoria sięga części list niosących tag, ale nie
wszystkich. To **pytanie, nie błąd**: tam gdzie nie sięga, tag ląduje w „Pozostałych" i tryb „Tagi"
dalej go znajduje. Stonowana sekcja, osobno od czerwonej.

Dwie decyzje projektowe, obie wymuszone przez realne dane:

- **Grupowanie po (kategoria, lista), nie po tagu.** Per-tag dawało 20 wierszy, z czego sześć
  powtarzało jedną informację („Źródło mocy nie obejmuje Postaci"). Odpowiedź i tak jest jedna dla
  całej grupy, więc grupa jest jednostką raportu. Po zgrupowaniu: 12 wierszy.
- **Rozstrzyganie spornej pisowni.** `entitiesUsingTag` bez `facets` przypisywał to samo słowo
  każdej definicji, która je zgłasza — magiczna `natura` „występowała" na 25 Postaciach, choć te
  Postacie należą do `zwierzęta` przez alias. Remis rozstrzyga pokrycie: właścicielem słowa na danej
  liście jest definicja, której kategoria tam sięga. Gdy nikt nie sięga albo sięga kilku — nie
  zgadujemy (pierwsze zgłosi `partialCoverage`, drugie łapie test niezmienników seeda).

### E — oś pochodzenia dla Przedmiotów `[ZROBIONE]`

Doszedł facet `pochodzenie-przedmiotu` („Pochodzenie", Przedmioty) z definicją `krasnoludy`.
Osobny od `pochodzenie-wierzchowca` mimo tej samej etykiety, bo `durski` to hodowla wierzchowca,
a `krasnoludy` wyrób kulturowy (Królewska Księga Kowalska i Korona Valhangar) — zlanie w jedną oś
wstawiłoby `durski` do filtra Przedmiotów.

**To sprząta też bazę.** Seed upsertuje po `tag`, więc `npm run seed-tag-facets:apply` przestawi
`krasnoludy` z `pochodzenie-wierzchowca` na właściwą kategorię bez ręcznej interwencji.

### Przy okazji: `natura` na Rasach

Raport niepełnego pokrycia wskazał `natura` na dwóch Rasach (Szaszynszyn, Szczuroszczerk) — to
zwierzę, dokładnie jak na Postaci. Alias `natura` przy `zwierzęta` obejmuje teraz `characters`
**i** `races`. Oba niezmienniki trzymają: `źródło-mocy` nie sięga Ras, `rodzaj-istoty` sięga.

### Zostaje do decyzji Marka (raport pyta, nie zmienia)

| Co | Ile | Pytanie |
| --- | --- | --- |
| `natura` na Przedmiotach | 14 | Naturalny materiał (skorupa, chityna, pióra, porosty). Osobna oś „Materiał"? |
| `durski` na Wierzchowcach | 1 | Styl walki na 8 Manewrach, hodowla na Ogierze Durskim. Zostawić w „Pozostałych"? |
| „Źródło mocy" bez Postaci | 6 tagów | Decyzja z 10.7 — Postaci celowo wyłączone. Zamknąć temat czy objąć? |
| „Cecha" bez Postaw | 4 tagi | Postawy niosą `siła`, `zręczność`, `krytyk`, `inicjatywa`, a kategoria ich nie obejmuje. |
| „Styl" bez Stanów/Postaci/Mocy | 3 + 2 + 2 | To samo pytanie dla stylów walki. |

Wszystkie widoczne w panelu w sekcji „Kategoria nie obejmuje wszystkich list". Żadna nie psuje
dziś wyników — te tagi po prostu grupują się w „Pozostałych".

### Czytelność raportu (poprawka po pierwszym spojrzeniu Marka)

Cztery kierunki rozjazdu dzieliły **jedno zdanie wstępu** nad sekcją — opisujące tak naprawdę tylko
nieprzypisane tagi. Reszty nie dało się zrozumieć bez czytania kodu. Doszedł `DriftBlock`: każdy blok
mówi sam **co to jest** i **co z tym zrobić**, a kolejność (błąd → zaległość → pytanie → kosmetyka)
niesie pilność. Wskazówka „co zrobić" jest raz na blok, nie w każdym wierszu — trzynaście kopii tego
samego zdania czytało się jak szum.

Blok „Przypisania bez efektu" pokazuje się **także pusty**, ze zdaniem „Nic takiego — każde
przypisanie sięga tam, gdzie tag naprawdę występuje". Bez tego jedyna kontrola, która potrafi
skłamać, jest niewidoczna dokładnie wtedy, gdy wszystko działa — i nie wiadomo, że w ogóle istnieje.
Pusty blok traci czerwień: kolor ma znaczyć „jest problem", nie „tu bywa problem".

## Fala 10.9 — „Pozostałe" da się kliknąć `[ZROBIONE]` (2026-08-09)

Zgłoszone przez Marka zaraz po 10.8: raport mówi „nieprzypisany tag nie znika, trafia do
«Pozostałych»", a w filtrze „Pozostałe" było **tekstem do przeczytania**, z poradą „szukaj po nich
w trybie «Tagi»". Czyli: żeby zawęzić po jednym nieprzypisanym tagu, trzeba było wyjść z trybu
kategorii i **stracić wszystkie dotychczasowe wybory**. Obietnica z opisu nie miała pokrycia w UI.

„Pozostałe" jest teraz sekcją jak każda inna — suma w środku, iloczyn z kategoriami. Zrobione jako
**pseudo-kategoria** o zarezerwowanym kluczu `__pozostale__`, doklejana na końcu przez
`buildTagFacetIndex`. Nie oferuje „— brak —": to nie oś, a „wpisy bez żadnego nieprzypisanego tagu"
nikomu nie jest potrzebne.

**Pułapka, przez którą to nie mogło iść zwykłą ścieżką.** `buildTagFacetConditions` rozwiązuje
wartości przez `index.facets` — a indeks **wyszukiwania** powstaje bez `availableTags` (świadomie:
inaczej każde zapytanie zaczynałoby się od skanu po distinct tagach). Tam kubeł jest pusty, więc
zwykłe wyszukanie facetu **porzuciłoby filtr po cichu i poszerzyło wynik**. Dlatego zarezerwowany
klucz jest obsłużony **przed** sięgnięciem do indeksu: nieprzypisany tag z definicji nie ma aliasów,
więc wartość przysłana przez klienta już jest pisownią do dopasowania.

`hasFacets` w `useTagFacets` liczy wyłącznie **prawdziwe** kategorie — lista mająca sam kubeł nie
dostaje przełącznika „Kategorie", bo byłby to gorszy filtr tagów pod inną nazwą.

Weryfikacja na backupie (Atuty): „Pozostałe: epickie" → 6 rekordów (surowo 6), „Rola: defensywa"
× „Pozostałe: epickie" → 5 (surowo 5, sama defensywa 166). Ten sam wynik z indeksu renderującego
i wyszukiwania. Test kontraktowy pilnuje, że seed nigdy nie zajmie zarezerwowanego klucza.

---

### Stan weryfikacji

`tsc --noEmit` czysty. Testy domenowe tagów **53/53** — `vitest` nie startuje w sandboxie (node_modules
instalowane pod Windows, brak `@rollup/rollup-linux-x64-gnu`), więc prawdziwe pliki testowe poszły pod
własnym shimem `describe/it/expect`. To ważne rozróżnienie: shim uruchamia **te same pliki**, a nie
moją przepisaną kopię asercji — kopia sprawdzałaby kopię.

Niezmienniki seeda przechodzą na realnym backupie (2026-08-08): zero podwójnych roszczeń pisowni,
zero sierot, zero naruszeń walidacji aliasów. Rozjazd na tym samym backupie: **0 przypisań bez
efektu**, 12 grup niepełnego pokrycia, 10 nieprzypisanych tagów (`specjalne` 17× jako jedyny powyżej
progu), 0 definicji bez użycia. Sześć wcześniejszych skryptów kontrolnych (rename, sweep, facets,
maps, wiring, magic) dalej na zielono.

⚠️ Złapane przy przeglądzie diffa: do `tagFacetDrift.ts` wjechał **bajt NUL** w literale klucza mapy.
Kod działał, ale git uznawał plik za binarny (`Bin 3885 -> 9316 bytes`) — czyli **żaden przyszły diff
tego pliku nie byłby widoczny w review**. Naprawione; warto skanować `grep -rlP '\x00'` po masowych
edycjach skryptem.

---

### Poprawki panelu admina po pierwszym realnym użyciu (2026-08-08)

Trzy braki, które wyszły dopiero gdy Marek spróbował czegoś w panelu naprawdę dokonać:

1. **Panel nie wysyłał klucza API.** Wołał goły `fetch`, a proxy odrzuca każdy nie-GET bez nagłówka
   `x-api-key` — klucz dokłada wyłącznie interceptor w `baseClient`. Efekt: **żaden zapis nie
   działał**, niezależnie od tego jak poprawny był klucz użytkownika. Doszedł `tagFacetsClient`
   idący przez `baseClient`; komunikaty walidacji aliasów są przy okazji przekazywane dosłownie,
   bo nazywają konkretny konflikt.
2. **Nie było przycisku usuwania kategorii** — API to obsługiwało od 10.2, UI nigdy nie wołało.
   Puste kategorie (pozostałości po scaleniach, bo seed tylko upsertuje) nie dały się w ogóle
   usunąć. Doszedł przycisk z potwierdzeniem mówiącym wprost, co się stanie: przy pustej „nie
   zmieni żadnego wpisu", przy pełnej „N tagów wróci do «Pozostałych», żaden rekord encji się nie
   zmieni".
3. **Nie było jak dodać kategorii ani przypisać taga z raportu.** Raport rozjazdu wypisywał problem
   i kazał szukać rozwiązania gdzie indziej, więc w praktyce byłby ignorowany. Teraz każdy
   nieprzypisany tag ma **listę wyboru wprost w raporcie** — tam gdzie widać, ile razy występuje —
   a nad kartami kategorii jest formularz „Dodaj kategorię".

Przy okazji: panel drukował **surowe nazwy encji** (`maneuvers`, `perks`). Mapa polskich nazw
istniała, ale była zamknięta w `/admin/tags` i miała literówkę („Zaklecia"). Wyciągnięta do
`src/common/translations/entityLabels.ts`, z testem na kompletność — nowa encja nie przejdzie bez
nazwy.

### Stan końcowy (2026-08-07) — **ZAMKNIĘTE**

`npm test` 201/201 plików, 1882 testy, 2 pominięte. `tsc --noEmit` czysty. Kategorie działają na
14 listach; `inventory`, `mounts` i `powerSpecifications` pokazują sam filtr tagów, bo żadna
kategoria ich nie obejmuje — przełącznik chowa się sam. To czeka na 10.7.

### Poprawka po podpięciu 14 list (2026-08-07)

`useTagFacets` łamał własną obietnicę z nagłówka („awaria warstwy opisowej nie może zatrzymać
filtra"). `data ?? EMPTY_INDEX` broni wyłącznie przed `undefined`, a odpowiedź **osiągalna, ale
o innym kształcie** — koperta błędu z proxy, strona HTML, wpis cache sprzed zmiany, współdzielony
mock `useQuery` w teście — jest wartością zdefiniowaną bez tablicy `facets`. Wtedy
`index.facets.length` rzuca **w trakcie renderu i kładzie całą listę**, a nie tylko filtr.

Ujawniło się dopiero po podpięciu Bestiariusza i listy postaci, bo ich testy mockują `useQuery`
globalnie — jeden mock obsługuje i wyszukiwanie postaci, i kategorie. Dziesięć czerwonych testów
w dwóch plikach, wszystkie z tym samym `Cannot read properties of undefined (reading 'length')`.

Naprawa to `toFacetIndex`: kształt jest **sprawdzany, nie zakładany**, i to w dwóch miejscach —
w `queryFn` oraz na wyjściu z hooka, bo cache może trzymać wartość zapisaną przed tą zmianą.
Doszedł `src/common/hooks/__tests__/useTagFacets.test.tsx` z sześcioma kształtami, które realny
deployment potrafi zwrócić (koperta błędu, tablica, `null`, goły string, payload bez `entity`).

Po tej poprawce zostały trzy czerwone testy z innego powodu — i to już **założenie testu, nie błąd
kodu**. Sprawdzały klucz zapytania przez `useQueryMock.mock.calls.at(-1)`, czyli „ostatnie
`useQuery`", co działało dopóki w drzewie było dokładnie jedno. `useTagFacets` renderuje się niżej
niż lista, więc `.at(-1)` zaczęło zwracać `['tagFacets','characters']` — klucz, który z definicji
nigdy się nie zmienia. Zamiast tego doszedł helper `lastCharactersQueryKey()`, który pyta o klucz,
o który testowi naprawdę chodzi. Asercja jest teraz odporna na kolejny hook używający `useQuery`.

I trzecia runda, tym razem czysto moja niechlujność przy masowym podpinaniu list. Skrypt dopisujący
`facetFilters` do klucza zapytania **zagnieżdżał** klucz zamiast go rozszerzać:
`[createSearchCharactersKey(…), facetFilters]` zamiast `[...createSearchCharactersKey(…),
facetFilters]`. Dla pięciu list kompendium było to poprawne, bo ich klucz już miał kształt
`[klucz, requirementFilters]`, ale dziewięć pozostałych miało klucz **płaski** — i nagle
`toContain('publicOnly')` przestało cokolwiek widzieć, bo wartość zjechała poziom niżej. Zmiana
kształtu klucza jest przy tym zmianą zachowania cache'a, nie tylko testu. Wszystkie dziewięć
poprawione na spread; pięć list z `requirementFilters` zostaje bez zmian.

### Poprawki po pierwszym pełnym `npm test` (2026-08-07)

Dwa czerwone testy, oba moje, oba warte zapisania:

1. **Zła asercja, nie zły kod** — test kolejności dryfu zakładał `krytyk` przed `fortel`, a `fortel`
   ma 81 wystąpień wobec 71 + 4 = 75 u `krytyka`. Sumowanie po encjach jest właśnie sensem tego
   sortowania, więc poprawiona została asercja.
2. **Nieprzepisany test `delete`** — route dostał nową implementację, a jego test dalej mockował
   starą (`prisma.perk.findMany/update`), więc sweep wymagań dostawał `undefined`.

Przy przepisywaniu testu wyszedł **prawdziwy błąd odporności**: `removeOrphanedDefinition`
i `syncTagDefinition` chodzą po WSZYSTKICH encjach, żeby dowieść, że tag zniknął, i wywracały się na
modelu, którego nie ma. W produkcji klient Prismy ma komplet delegatów, więc to nie był bug widoczny
dla użytkownika — ale zachowanie było błędne w drugą stronę: brak modelu to brak dowodu. Teraz oba
sweepy przy niepoliczalnym modelu **zostawiają definicję w spokoju** zamiast rzucać, a rozjazd
i tak wyłapie raport. Mocki w testach są Proxy, bo mockowanie jednego modelu wywoływałoby ten
fail-safe zamiast testowanej ścieżki.

---

### 10.1 Model i seed — `M` · ⭐⭐⭐

Dwa modele Prismy (§3) + skrypt `scripts/seed-tag-facets.ts`, który wypisuje propozycję przypisania
z §2 i **nie zapisuje nic bez `--apply`**. Tagi nieprzypisane zostają nieprzypisane — brak
zgadywania. Skrypt uruchamiany przez `node --experimental-strip-types`, jak reszta narzędzi w repo.

**AC:** `prisma generate` przechodzi; seed w trybie podglądu drukuje tabelę tag → facet → liczba
wystąpień; puste kolekcje nie zmieniają zachowania aplikacji.

---

### 10.2 API — `S` · ⭐⭐

- `GET /api/tag-facets` — facety + definicje + tagi nieprzypisane, per encja. Jedno wywołanie
  zasila cały filtr. Cache 5 min, jak `useEntityTags`.
- `GET|POST|PATCH|DELETE /api/tag-facets/admin` — CRUD dla admina, za `useAdminStatus`.
- `useEntityTags` zostaje nietknięty i dalej jest fallbackiem.
- **Synchronizacja istniejącego zarządzania tagami** (patrz §8) — `rename` aktualizuje
  `TagDefinition.tag` i dopisuje starą nazwę do `aliases`; `delete` kasuje osieroconą definicję.
  Świadomie tutaj, a nie w 10.6: od momentu istnienia `TagDefinition` każdy rename bez tego kroku
  osierca definicję.

**AC:** endpoint działa przy pustych kolekcjach (zwraca same „nieprzypisane"); brak uprawnień
admina = 403 na ścieżkach zapisu; rename tagu z przypisanym facetem zachowuje przypisanie.

---

### 10.3 Semantyka wyszukiwania — `M` · ⭐⭐⭐

`TagFacetFilter` w `SearchPayloads.ts`, `tagFacetFilter()` w `SearchQueryBuilder`, czysta funkcja
`buildTagFacetConditions` + dwa renderery (§4). `searchEntity` składa warunki facetowe **przed**
wyborem ścieżki, żeby obie dostały to samo.

Indeks Mongo: `tags` jest już polem tablicowym; sprawdzić, czy istnieje na nim indeks
wielokluczowy dla pięciu głównych kolekcji — `$in`/`$nin` po 11 wartościach na 992 rekordach
przeżyje bez niego, ale Atuty i Zaklęcia rosną.

**AC:** tabela przypadków przechodzi identycznie na ścieżce Prismy i `aggregateRaw`; puste filtry
nie generują warunku; ładunek bez `tagFacetFilters` daje **bajt w bajt** to samo zapytanie
co przed zmianą (test regresji na serializacji).

---

### 10.4 UI filtra — `M` · ⭐⭐⭐

`TagFilter.tsx` rozbity na `FacetedTagFilter` (nowy) i zachowany `FlatTagFilter` (dzisiejszy,
jako fallback). Podpięcie kolejno: Manewry → Postawy/Stany → Zaklęcia/Atuty → sprzęt.

**AC:** „rola: ofensywa" + „pochodzenie: — brak —" na Manewrach zwraca **339** rekordów;
wybór `zwierzęta`+`potwory` zwraca **147** (suma), nie 117 (część wspólna) i nie 0 (dzisiejsze `$all`);
tag spoza `TagDefinition` widoczny w „Pozostałe"; brak `TagDefinition` = dzisiejszy filtr.

---

### 10.5 Panel admina — `M` · ⭐⭐⭐

`/admin/tags` dostaje drugą zakładkę **„Facety"**. `AdminEntityManagementPanel`
i `useAdminEntityManagement` zostają jako baza. Trzy poziomy zarządzania:

**Facety** — dodanie, edycja (`label`, `description`, `order`, `selectionMode`, `supportsNone`,
`entities`), usunięcie, kolejność przeciąganiem.

**Przypisania** — lista tagów z liczbą wystąpień i kolumną „facet" jako selectem. Sekcja
**„Nieprzypisane (N)"** przypięta na górze, żeby nowy tag rzucał się w oczy zamiast czekać
na przypadkowe zauważenie.

**Aliasy** — w wariancie B to pełnoprawny edytor, nie pole tekstowe. Przy każdej definicji lista
`alias + encje, których dotyczy`, z podpowiedzią liczby rekordów, jakie alias dociągnie
(„`natura` → +25 Postaci"). Trzy walidacje po stronie API, bo alias jest jedynym miejscem w tym
planie, gdzie da się zrobić **cicho zły wynik wyszukiwania**:

1. alias nie może być jednocześnie kanonicznym tagiem innej definicji w tym samym facecie
   (`natura` jest kanoniczne dla szkoły magii — alias wolno mu być tylko dla `character`);
2. dwie definicje w jednym facecie nie mogą dzielić aliasu dla tej samej encji;
3. `TagAlias.entities` musi być podzbiorem `TagFacet.entities` — inaczej alias jest martwy
   i nikt się o tym nie dowie.

Podgląd na żywo: „ten filtr dopasuje N rekordów" liczone przed zapisem, żeby pomyłkę w aliasie
było widać od razu, a nie tydzień później przy dziwnym wyniku.

**AC:** przypisanie tagu do facetu widoczne w filtrze po odświeżeniu cache; dodanie aliasu
z naruszeniem którejkolwiek z trzech reguł kończy się błędem 400 z czytelnym komunikatem;
usunięcie facetu przenosi jego tagi do „Nieprzypisane" i **nie zmienia żadnego rekordu encji**
(weryfikowane testem).

---

### 10.6 Strażnicy dryfu — `S` · ⭐⭐

Warstwa opisowa i dane rozjadą się — pytanie tylko kiedy. Dwa strażnicy:

- **Raport w adminie** — diff `distinct(tags)` per encja vs `TagDefinition`: tagi bez definicji
  i definicje bez wystąpień (kandydaci do usunięcia).
- **Test kontraktowy** — na fixture z backupu: każdy tag występujący ≥ 10 razy ma definicję.
  Próg zamiast zera, żeby literówka w jednym rekordzie nie wywracała CI, ale masowy nowy tag
  już tak.

**AC:** dodanie nowego tagu do encji pojawia się w raporcie w ciągu jednego odświeżenia cache.

---

## 7. Bezpieczeństwo i wycofanie

| Ryzyko | Zabezpieczenie |
|---|---|
| Rename gubi dane | backup przed operacją, dry-run z liczbami, `updateMany` zamiast N update'ów, weryfikacja po |
| Rename psuje szybkie tagi / wymagania / literały w kodzie | 10.0 pkt 1–3 jako warunek wstępny, nie „do zrobienia później" |
| Facety ukrywają wpisy | kubełek „Pozostałe" zawsze renderowany; test na to |
| Nowa semantyka psuje istniejące widoki | `tagFacetFilters` opcjonalne i addytywne; test regresji na serializacji ładunku |
| Ścieżka Prismy i raw rozjeżdżają się | jedna czysta funkcja, dwa renderery, wspólna tabela testów |
| Panel admina psuje dane | warstwa opisowa fizycznie nie ma dostępu do `tags` encji |
| Rename w adminie osierca definicję facetu | synchronizacja w 10.2 (nie 10.6); do tego czasu degradacja jest cicha, ale nieszkodliwa — tag ląduje w „Pozostałych" (§9) |
| **Zły alias daje cicho zły wynik** — jedyne miejsce w planie, gdzie da się popsuć wyszukiwanie bez błędu | trzy walidacje + podgląd „dopasuje N rekordów" przed zapisem (10.5); aliasy zawsze per encja; `includeNone` liczone z aliasami (osobny test) |

**Wycofanie każdego etapu osobno:** 10.6→10.2 to usunięcie kodu, dane zostają. 10.1 to `db.dropCollection`
na dwóch nowych kolekcjach. Tylko **10.0 jest nieodwracalne bez akcji** — i dlatego jako jedyne
wymaga backupu, dry-runu i renamu odwrotnego zapisanego w `aliases`.

---

## 8. Kolejność i zależności

```
10.0 (ujednolicenie)  ──┐
                       ├──► 10.1 (model) ──► 10.2 (API) ──┬──► 10.3 (semantyka) ──► 10.4 (UI)
                       │                                 └──► 10.5 (admin)
                       └──► niezależnie: sweep literałów w kodzie                    └──► 10.6 (strażnicy)
```

10.0 jest jedynym twardym warunkiem wstępnym. 10.3 i 10.5 można zrównoleglić po 10.2.

---

## 9. Współistnienie z `/admin/tags` w trakcie prac

Krótka odpowiedź: **facety nie blokują admina — blokuje go `rename`/`delete`, i to już dziś.**
Warto rozdzielić te dwa ryzyka, bo mają różne źródła i różne terminy ważności.

### Co jest bezpieczne w każdej chwili

Przeglądanie tagów i liczb wystąpień, cała reszta Kompendium, dodawanie i zdejmowanie tagów
na pojedynczych encjach przez zwykły edytor. Facety niczego z tego nie dotykają, bo są warstwą nad
`tags`, nie w `tags`.

### Co jest ryzykowne **niezależnie od facetów**

`rename` i `delete` w `/admin/tags` mają dziś cztery luki z §6/10.0: nie ruszają personalizacji,
nie ruszają 34 referencji w `structuredRequirements`, nie ruszają literałów w kodzie i nie są
atomowe. To nie jest dług wprowadzony przez ten plan — to stan obecny. `delete` jest przy tym
gorszy od `rename`, bo zdejmuje tag z N rekordów **bez zapisu, co usunął**; backup bazy jest
jedyną drogą powrotu.

**Rekomendacja:** wstrzymać się z masowym `rename`/`delete` do czasu 10.0. Pojedyncza literówka na
tagu, który nie występuje w `structuredRequirements`, w szybkich tagach ani w kodzie, jest
bezpieczna — ale to warto sprawdzić przed, a nie po.

### Co zmienia się po 10.1

Od chwili, gdy `TagDefinition` przestaje być pusta, `rename` w adminie zaczyna **osierocać
definicje**: rekordy encji dostają nową nazwę, definicja zostaje przy starej, tag wypada z facetu
do „Pozostałych". Degradacja jest cicha, ale nie destrukcyjna — tag pozostaje widoczny
i wyszukiwalny, gubi się tylko grupowanie. Naprawa to ponowne przypisanie w panelu.

Dlatego synchronizacja `rename`/`delete` z `TagDefinition` siedzi w **10.2**, nie w 10.6: to jedyny
etap, po którym używanie admina „po staremu" ma jakikolwiek negatywny skutek, i domykamy go
od razu, zamiast zostawiać na koniec.

### Podsumowanie w jednym zdaniu

Rób backup i używaj admina normalnie; jedyne, co warto odłożyć do 10.0, to masowe renamy i delete'y —
i to z powodów, które istniałyby także wtedy, gdyby tego planu w ogóle nie było.

---

## 10. Decyzje zamknięte (2026-08-07)

| # | Pytanie | Decyzja Marka |
|---|---|---|
| 1 | `demoniczne`/`diabelskie` vs `demon`/`diabeł` | **wariant B** — jedno pojęcie, jeden facet `rodzaj-istoty`, dwie pisownie sklejone aliasem per encja. Dotyczy całej rodziny (nieumarli/nieumarły, eteryczni/eteryczny, zwierzęta/natura, prymitywni/dziki…), nie samych demonów. Bez renamu. |
| 1a | Czy stary płaski filtr znika? | **nie** — zostaje jako widoczny przełącznik `Facety ⇄ Wszystkie tagi` (§5), bo aliasy celowo zmieniają wyniki i obie odpowiedzi muszą być osiągalne |
| 2 | `prymitywni` w `pochodzenie`? | tak |
| 3 | `magiczne`/`legendarne`/`mistrzowskie` | flaga `jakość`, `multi` — potwierdzone danymi (`legendarne` zawsze z `magiczne`) |
| 4 | `ofensywa`+`defensywa` na jednym wpisie | **celowe** — manewr może dawać jednocześnie obrażenia i redukcję („Surowa Siła: 1/3 mod siły do obrażeń i redukcji", „Obronne Uderzenie", „Symbioza Mędrców"). Żadnego czyszczenia danych, `rola` zostaje `multi`. |
