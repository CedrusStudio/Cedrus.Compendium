# Facety tagów — plan docelowy

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

**Podział na facety** — zatwierdzony przez Marka 2026-08-07, do wprowadzenia seedem w 9.1:

| Facet | Encje | Tagi | `selectionMode` | Uwagi |
|---|---|---|---|---|
| `rola` | Manewr, Postawa, Stan, Zaklęcie, Atut | ofensywa, defensywa | `multi` | po ujednoliceniu z 9.0 |
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
⚠️ Broń ma `mistrzowski` (1 szt., liczba pojedyncza), Zbroje `mistrzowskie` (3 szt.) — **rename do 9.0**.

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
Dlatego alias niesie własną listę encji i nie może być zwykłym `String[]`. Historia renamów z 9.0
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

### 9.0 Ujednolicenie słownika — `M` · ⭐⭐⭐ — **warunek wstępny**

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

### Stan wykonania 9.0 (2026-08-07) — **KOD GOTOWY, MIGRACJA NIEURUCHOMIONA**

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

### Stan wykonania 9.1 i 9.3 (2026-08-07) — **ZROBIONE**

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

**Weryfikacja na backupie z nałożonym w pamięci renamem 9.0 — obie liczby z AC się zgadzają:**
`rola: ofensywa` + `rodzaj-istoty: — brak —` → **339**; `zwierzęta ∪ potwory` → **147** (a nie 117
ani 0). Pułapka aliasu sprawdzona wprost: 52 Atuty z tagiem `natura` (szkoła magii) **nie** wpadają
do rodzaju istoty — łapią się tylko 3 prawdziwie zwierzęce. `tsc --noEmit` czysty, 22 asercje
przechodzą.

---

### 9.1 Model i seed — `M` · ⭐⭐⭐

Dwa modele Prismy (§3) + skrypt `scripts/seed-tag-facets.ts`, który wypisuje propozycję przypisania
z §2 i **nie zapisuje nic bez `--apply`**. Tagi nieprzypisane zostają nieprzypisane — brak
zgadywania. Skrypt uruchamiany przez `node --experimental-strip-types`, jak reszta narzędzi w repo.

**AC:** `prisma generate` przechodzi; seed w trybie podglądu drukuje tabelę tag → facet → liczba
wystąpień; puste kolekcje nie zmieniają zachowania aplikacji.

---

### 9.2 API — `S` · ⭐⭐

- `GET /api/tag-facets` — facety + definicje + tagi nieprzypisane, per encja. Jedno wywołanie
  zasila cały filtr. Cache 5 min, jak `useEntityTags`.
- `GET|POST|PATCH|DELETE /api/tag-facets/admin` — CRUD dla admina, za `useAdminStatus`.
- `useEntityTags` zostaje nietknięty i dalej jest fallbackiem.
- **Synchronizacja istniejącego zarządzania tagami** (patrz §8) — `rename` aktualizuje
  `TagDefinition.tag` i dopisuje starą nazwę do `aliases`; `delete` kasuje osieroconą definicję.
  Świadomie tutaj, a nie w 9.6: od momentu istnienia `TagDefinition` każdy rename bez tego kroku
  osierca definicję.

**AC:** endpoint działa przy pustych kolekcjach (zwraca same „nieprzypisane"); brak uprawnień
admina = 403 na ścieżkach zapisu; rename tagu z przypisanym facetem zachowuje przypisanie.

---

### 9.3 Semantyka wyszukiwania — `M` · ⭐⭐⭐

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

### 9.4 UI filtra — `M` · ⭐⭐⭐

`TagFilter.tsx` rozbity na `FacetedTagFilter` (nowy) i zachowany `FlatTagFilter` (dzisiejszy,
jako fallback). Podpięcie kolejno: Manewry → Postawy/Stany → Zaklęcia/Atuty → sprzęt.

**AC:** „rola: ofensywa" + „pochodzenie: — brak —" na Manewrach zwraca **339** rekordów;
wybór `zwierzęta`+`potwory` zwraca **147** (suma), nie 117 (część wspólna) i nie 0 (dzisiejsze `$all`);
tag spoza `TagDefinition` widoczny w „Pozostałe"; brak `TagDefinition` = dzisiejszy filtr.

---

### 9.5 Panel admina — `M` · ⭐⭐⭐

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

### 9.6 Strażnicy dryfu — `S` · ⭐⭐

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
| Rename psuje szybkie tagi / wymagania / literały w kodzie | 9.0 pkt 1–3 jako warunek wstępny, nie „do zrobienia później" |
| Facety ukrywają wpisy | kubełek „Pozostałe" zawsze renderowany; test na to |
| Nowa semantyka psuje istniejące widoki | `tagFacetFilters` opcjonalne i addytywne; test regresji na serializacji ładunku |
| Ścieżka Prismy i raw rozjeżdżają się | jedna czysta funkcja, dwa renderery, wspólna tabela testów |
| Panel admina psuje dane | warstwa opisowa fizycznie nie ma dostępu do `tags` encji |
| Rename w adminie osierca definicję facetu | synchronizacja w 9.2 (nie 9.6); do tego czasu degradacja jest cicha, ale nieszkodliwa — tag ląduje w „Pozostałych" (§9) |
| **Zły alias daje cicho zły wynik** — jedyne miejsce w planie, gdzie da się popsuć wyszukiwanie bez błędu | trzy walidacje + podgląd „dopasuje N rekordów" przed zapisem (9.5); aliasy zawsze per encja; `includeNone` liczone z aliasami (osobny test) |

**Wycofanie każdego etapu osobno:** 9.6→9.2 to usunięcie kodu, dane zostają. 9.1 to `db.dropCollection`
na dwóch nowych kolekcjach. Tylko **9.0 jest nieodwracalne bez akcji** — i dlatego jako jedyne
wymaga backupu, dry-runu i renamu odwrotnego zapisanego w `aliases`.

---

## 8. Kolejność i zależności

```
9.0 (ujednolicenie)  ──┐
                       ├──► 9.1 (model) ──► 9.2 (API) ──┬──► 9.3 (semantyka) ──► 9.4 (UI)
                       │                                 └──► 9.5 (admin)
                       └──► niezależnie: sweep literałów w kodzie                    └──► 9.6 (strażnicy)
```

9.0 jest jedynym twardym warunkiem wstępnym. 9.3 i 9.5 można zrównoleglić po 9.2.

---

## 9. Współistnienie z `/admin/tags` w trakcie prac

Krótka odpowiedź: **facety nie blokują admina — blokuje go `rename`/`delete`, i to już dziś.**
Warto rozdzielić te dwa ryzyka, bo mają różne źródła i różne terminy ważności.

### Co jest bezpieczne w każdej chwili

Przeglądanie tagów i liczb wystąpień, cała reszta Kompendium, dodawanie i zdejmowanie tagów
na pojedynczych encjach przez zwykły edytor. Facety niczego z tego nie dotykają, bo są warstwą nad
`tags`, nie w `tags`.

### Co jest ryzykowne **niezależnie od facetów**

`rename` i `delete` w `/admin/tags` mają dziś cztery luki z §6/9.0: nie ruszają personalizacji,
nie ruszają 34 referencji w `structuredRequirements`, nie ruszają literałów w kodzie i nie są
atomowe. To nie jest dług wprowadzony przez ten plan — to stan obecny. `delete` jest przy tym
gorszy od `rename`, bo zdejmuje tag z N rekordów **bez zapisu, co usunął**; backup bazy jest
jedyną drogą powrotu.

**Rekomendacja:** wstrzymać się z masowym `rename`/`delete` do czasu 9.0. Pojedyncza literówka na
tagu, który nie występuje w `structuredRequirements`, w szybkich tagach ani w kodzie, jest
bezpieczna — ale to warto sprawdzić przed, a nie po.

### Co zmienia się po 9.1

Od chwili, gdy `TagDefinition` przestaje być pusta, `rename` w adminie zaczyna **osierocać
definicje**: rekordy encji dostają nową nazwę, definicja zostaje przy starej, tag wypada z facetu
do „Pozostałych". Degradacja jest cicha, ale nie destrukcyjna — tag pozostaje widoczny
i wyszukiwalny, gubi się tylko grupowanie. Naprawa to ponowne przypisanie w panelu.

Dlatego synchronizacja `rename`/`delete` z `TagDefinition` siedzi w **9.2**, nie w 9.6: to jedyny
etap, po którym używanie admina „po staremu" ma jakikolwiek negatywny skutek, i domykamy go
od razu, zamiast zostawiać na koniec.

### Podsumowanie w jednym zdaniu

Rób backup i używaj admina normalnie; jedyne, co warto odłożyć do 9.0, to masowe renamy i delete'y —
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
