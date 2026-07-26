# Plan implementacji: prywatne encje kompendium (atuty, manewry, stany, postawy, zaklęcia) wg API Key

Plan wykonawczy dla ROADMAP §4.1. Zweryfikowany względem realnego stanu repo (2026-07-25).

Zadanie: dać atutom (`Perk`), manewrom (`Maneuver`), stanom (`State`), postawom (`Stance`) i zaklęciom (`Spell`) **ten sam** model prywatności co postaciom — czyli pole `apiKeys String[]` + filtr widoczności po nagłówku `x-api-key`, **a nie** parę `isPrivate` / `ownerId` z pierwotnego brzmienia §4.1.

## Kluczowa decyzja adaptacyjna (zmiana względem pierwotnego §4.1)

Pierwotny opis mówił o fladze `isPrivate` / `ownerId` oraz o widoczności „w ramach sesji/kampanii”. Postacie **nie działają w ten sposób** — mają jedynie:

- pole `Character.apiKeys String[] @default([])` (`prisma/schema.prisma:29`),
- regułę widoczności `characterVisibilityWhere` / `isCharacterVisible` (`src/persistence/characterVisibility.ts`),
- 3-stanowy filtr listy `all` / `mineOnly` / `publicOnly` (`CharacterVisibilityMode`).

Skoro §4.1 wprost wymaga „wzorca istniejących prywatnych postaci”, plan **rezygnuje z `isPrivate`/`ownerId` i z widoczności sesyjnej/kampanijnej** (tego w kodzie nie ma) na rzecz identycznego mechanizmu `apiKeys[]`. „Twórca” = posiadacz klucza API zapisanego w `apiKeys`. Widoczność sesji/kampanii pozostaje poza zakresem (osobne, nieistniejące jeszcze pojęcie).

## Co jest już gotowe i wprost reużywalne

- **Transport tożsamości** — `baseClient.ts` dokłada nagłówek `x-api-key` do **każdego** `POST /api/search`, niezależnie od encji. Kompendium jeździ tą samą trasą (`POST /api/search` → `searchEntity`), więc backend już dziś dostaje klucz dla zapytań o manewry/atuty/itd. — nie trzeba nowego transportu.
- **Generator warunku** — `characterVisibilityWhere(apiKey, mode)` i `isCharacterVisible(apiKeys, apiKey)` są encjo-agnostyczne w treści (operują tylko na tablicy `apiKeys`), mimo „character” w nazwie. Reużywamy je 1:1 (patrz Etap 3 — decyzja o zmianie nazwy).
- **Builder** — `SearchQueryBuilder.visibilityFilter(mode)` już istnieje i tylko ustawia pole w payloadzie; działa dla dowolnej encji.
- **UI przypisania klucza** — `EditApiKeysSection` + `AssignCurrentApiKeyButton` + `FormStringsInput path="apiKeys"` w `src/application/characters/edit/details/EditDetailsView.tsx` (linie 100–148) to gotowy, przetestowany wzorzec do przeniesienia na formularze kompendium.
- **i18n** — klucze `apiKeys`, `apiKeysDescription`, `assignCurrentApiKey`, `noApiKeySet` już są we wszystkich trzech słownikach (`translations.pl-PL/de-DE/fr-FR.ts`). Reużycie bez dopisywania (poza ewentualnym filtrem 3-stanowym, patrz Etap 8).
- **Zapis CRUD** — `createCommonRepository` (`src/persistence/common/createCommonRepository.ts`) robi `create({ data: entity })` na schemaless Mongo, więc gdy DTO poniesie `apiKeys`, zostaną zapisane bez zmian w repozytorium. Trasy `app/api/{maneuvers,perks,spells,stances,states}/route.ts` już to obsłużą.

## Największe różnice względem postaci (ryzyka do rozstrzygnięcia)

1. **`@@unique([name, grade])` na wszystkich pięciu encjach** (`schema.prisma`: `stances:114`, `states:143`, `maneuvers:178`, `perks:202`, `spells:232`). Postacie mają unikalne `name`/`shortName` globalnie, ale nie było problemu „prywatny duplikat publicznego”. Tu prywatny „Kula ognia, stopień 1” **koliduje** z publicznym o tej samej nazwie i stopniu. **To blokuje sens funkcji i wymaga decyzji przed Etapem 1** — patrz „Otwarte decyzje”.
2. **Pięć encji zamiast jednej** — filtr widoczności w `searchEntity` jest dziś zawężony twardo do `payload.entity === CHARACTER_ENTITY` (`searchEntity.ts:165`). Trzeba go rozszerzyć na zbiór encji, nie na pojedynczą.
3. **Ścieżka `requirementFilter` (aggregateRaw)** — `searchEntity.ts:90` dla kompendium schodzi do `buildRequirementSearchPipeline` i **celowo wyklucza character, żeby nie ominąć widoczności**. Jeśli objąć kompendium widocznością, ta gałąź `aggregateRaw` **ominie** filtr. Trzeba wstrzyknąć warunek widoczności również do pipeline’u (`$match` na `apiKeys`). Łatwe do przeoczenia — to realna dziura bezpieczeństwa.
4. **Frontend kompendium nie zna dziś `apiKey`** — brak `useApiKey` w `src/application/compendium/**`. Każda encja ma **osobne** fabryki zapytań (`createManeuverOffsetQuery`/`...KeysetQuery`, analogicznie perks/spells; stances/states) i **osobne** klucze cache (`createOffsetSearchManeuversKey`, `...PerksKey`, `...StancesKey`, `...StatesKey`, `...SpellsKey` w `cacheKeys.ts`) — inaczej niż postacie, które dzieliły jeden klucz `'characters'`. Klucz + tryb trzeba przeciągnąć przez **każdą** parę fabryka+cache-key i **każdy** komponent listy.
5. **`searchEntityById` dla nie-character** — dziś `prisma[entity].findUnique` bez żadnego sprawdzenia widoczności (`searchEntity.ts:21-25`). Bezpośrednie wejście po ID (np. `/compendium/maneuvers/{id}`) ominęłoby prywatność. Gałąź z checkiem `isCharacterVisible` (dziś tylko dla character, `:40-45`) trzeba uogólnić na nowe encje.

---

## Etap 0 — Rozstrzygnięcie kolizji unikalności (blokujące)

Zanim cokolwiek: zdecydować model unikalności (patrz „Otwarte decyzje” pkt 1). Rekomendacja domyślna: **zachować globalną unikalność `name+grade`** i w UI tworzenia prywatnego elementu wymuszać własną, niekolidującą nazwę (walidator dający czytelny błąd zamiast 500 z Prisma). Alternatywy (namespacing nazw kluczem, rozbicie unikalności) mają większy koszt i konsekwencje dla importu/mapowań — do świadomej akceptacji przed startem.

## Etap 1 — Model danych (5 encji)

**Plik:** `prisma/schema.prisma` — dodać do `Perk`, `Maneuver`, `State`, `Stance`, `Spell` (analogicznie do `Character:29`):

```prisma
  // API keys allowed to see this element. Empty (or missing on legacy records) = public.
  apiKeys String[] @default([])
```

**Domena:** dodać `apiKeys?: string[]` do typów i pustych obiektów w:
`src/domain/characters/combat/Maneuver.ts` oraz odpowiednikach Perk/State/Stance/Spell (zweryfikować dokładne ścieżki — Maneuver żyje w `domain/characters/combat/`).

Po zmianie schematu: `npx prisma generate` + `prisma db push` (Mongo, brak migracji SQL).

## Etap 2 — Backfill istniejących rekordów (5 kolekcji)

Mongo jest schemaless — stare rekordy nie mają `apiKeys` (`undefined`, nie `null`). Wyrównać do `[]`, żeby `isEmpty: true` działało deterministycznie. Skrypt `scripts/backfill-compendium-api-keys.ts` wzorem `backfill-character-api-keys` (jeśli istnieje) — pętla `updateMany({ where: { apiKeys: null }, data: { apiKeys: [] } })` po `prisma.maneuver/perk/state/stance/spell`. Najpierw diagnostyka realnego kształtu danych na kopii bazy, potem uruchomienie. Uwaga na uprawnienia zapisu — to ta sama pula operacyjna co przy postaciach.

## Etap 3 — Uogólnienie warstwy widoczności

**Plik:** `src/persistence/characterVisibility.ts`

Treść funkcji jest już encjo-agnostyczna. Decyzja: albo (a) **zmienić nazwę** na `visibilityWhere` / `visibility.ts` i zaktualizować importy (czyściej, ale większy diff), albo (b) **zostawić nazwy** i tylko reużyć (mniejszy diff, mylące „character” w nazwie dla manewrów). Rekomendacja: (a) — przenieść do `src/persistence/visibility.ts`, wyeksportować aliasy wstecznie kompatybilne, żeby testy postaci nie padły.

**Plik:** `src/persistence/searchEntity.ts`

- wprowadzić zbiór `const VISIBILITY_SCOPED_ENTITIES = new Set(['character','perk','maneuver','state','stance','spell'])`.
- `createSearchInput` (`:165`): warunek `if (payload.entity === CHARACTER_ENTITY)` → `if (VISIBILITY_SCOPED_ENTITIES.has(payload.entity))` — dokłada `visibilityWhere(apiKey, mode)` przez ten sam mechanizm `AND`, który już scala z paginacją kursorową.
- guard `mineOnly` (`:81`): rozszerzyć warunek encji analogicznie.
- **`searchEntityById` (`:21-45`):** uogólnić gałąź z checkiem widoczności — dla encji z `VISIBILITY_SCOPED_ENTITIES` pobrać rekord z wymuszonym `apiKeys` w `select`, sprawdzić `isVisible(record.apiKeys, apiKey)`, zwrócić `null` gdy niewidoczny, i zdjąć `apiKeys` z wyniku, jeśli wołający go nie żądał (dokładnie jak dziś robi to gałąź character).
- **`requirementFilter` / aggregateRaw (`:90`):** przestać wykluczać widoczność. Do `buildRequirementSearchPipeline` (`src/persistence/requirementSearchPipeline.ts`) przekazać `apiKey`+`mode` i dodać na początku pipeline’u etap `$match` odpowiadający `visibilityWhere` (`{ apiKeys: { $size: 0 } }` dla publicznych, `$in` klucza dla `mineOnly`, `$or` dla `all`). Bez tego filtr wymagań omija prywatność.

**Plik:** `src/app/api/search/route.ts` i `[id]/route.ts` — już czytają nagłówek i przekazują `apiKey` do `searchEntity`/`searchEntityById` (zmiana zrobiona przy postaciach). Zweryfikować, że nie zawężają tego do character. Jeśli tak — poszerzyć.

## Etap 4 — Frontend: przeciągnięcie klucza i trybu przez wyszukiwarki kompendium

Dla **każdej** z 5 encji (manewry, atuty, zaklęcia, stany, postawy):

- **Fabryki zapytań** (`src/infrastructure/searchQueries/{maneuvers,perks,spells,stances,states}/create*OffsetQuery.ts` i `create*KeysetQuery.ts`) — dodać opcjonalny, ostatni parametr `visibilityMode?: CharacterVisibilityMode` i doczepić `.visibilityFilter(visibilityMode)` do łańcucha buildera (addytywne, nie łamie wywołujących bez tego parametru). Klucz API jedzie nagłówkiem — nie trafia do treści payloadu.
- **Cache keys** (`src/persistence/cacheKeys.ts`: `createOffsetSearch{Maneuvers,Perks,Stances,States,Spells}Key` + ewentualne warianty keyset) — dodać na końcu tablicy klucza `apiKey` **oraz** `visibilityMode`, żeby różne klucze/tryby nie dzieliły cache React Query (dokładnie jak przy `createSearchCharactersKey`).
- **Komponenty list** (`ManeuversList.tsx`, `PerksList.tsx`, `SpellsList.tsx`, `StancesList.tsx`, `StatesList.tsx`) — pobrać `apiKey`/`hasApiKey` z `useApiKey()`, dopisać do `queryKey` i do wywołania fabryki zapytania.
- **Inwalidacja po zmianie klucza** — w `src/common/hooks/useApiKey.ts` `saveApiKey`/`removeApiKey` dziś inwalidują `['characters']`. Dodać inwalidację prefiksów kompendium (`['maneuvers']`, `['perks']`, `['spells']`, `['stances']`, `['states']` — potwierdzić realne prefiksy w `cacheKeys.ts`), żeby przełączenie klucza odświeżyło też listy kompendium.

## Etap 5 — UI przypisania klucza w edycji kompendium (CRUD)

Przenieść wzorzec z `EditDetailsView.tsx` (100–148) na formularze edycji encji kompendium:

- do DTO/schematów formularzy tych encji dodać `apiKeys: string[]` (init `entity.apiKeys ?? []`),
- wstawić sekcję `EditApiKeysSection` (`FormStringsInput path="apiKeys"` + `AssignCurrentApiKeyButton` czytający `useApiKey()`),
- zweryfikować, że trasy `POST/PUT app/api/{encja}/…` przepuszczają `apiKeys` do `createCommonRepository` (przy schemaless Mongo `create({ data })` zapisze pole automatycznie, o ile jest w DTO).

Jeśli któraś encja nie ma jeszcze pełnego formularza edycji (część kompendium mogła być dotąd read-only / seedowana), to jest właśnie „UI CRUD” z §4.1 — zakres do potwierdzenia per encja (patrz „Otwarte decyzje” pkt 2).

## Etap 6 — Reguła twórcy przy tworzeniu (opcjonalne, ale zgodne z §4.1 „widoczne tylko dla twórcy”)

Domyślnie nowo utworzony **prywatny** element powinien od razu dostać klucz twórcy w `apiKeys` (tak jak `AssignCurrentApiKeyButton`, ale automatycznie przy „utwórz jako prywatny”). Do rozstrzygnięcia, czy tworzenie jest domyślnie publiczne (pusty `apiKeys`) z opcją prywatyzacji, czy odwrotnie. Rekomendacja: domyślnie publiczne (spójne z regułą „empty = public” i z zachowaniem postaci).

## Etap 7 — (opcjonalny) filtr 3-stanowy na listach kompendium

Jeśli chcemy parytet z postaciami (`Wszystkie` / `Tylko moje` / `Tylko publiczne`), reużyć `CharacterVisibilityFilter` (`src/common/components/filters/CharacterVisibilityFilter.tsx`) — komponent jest generyczny (Tabs + `disabled` bez klucza). Wpiąć w pasek filtrów każdej listy, stan `visibilityMode` + auto-reset przy zniknięciu klucza (wzorzec z `CharactersHeadersList`). Jeśli poza zakresem MVP — pominąć; sama reguła „empty = public, twój klucz = widoczne” działa i bez przełącznika (tryb `all`).

## Etap 8 — i18n

Klucze `apiKeys*` już istnieją i wystarczą dla Etapu 5. Filtr 3-stanowy (Etap 7) reużywa istniejące `characterVisibilityAll/MineOnly/PublicOnly` — nazwa mówi „character”, ale tekst („Wszystkie/Tylko moje/Tylko publiczne”) jest neutralny. Rozważyć zmianę nazwy kluczy na neutralne, jeśli robimy Etap 7.

## Etap 9 — Testy (wzorem testów postaci, rozszerzone o multi-encję)

- `visibility.test.ts` (przemianowany `characterVisibility.test.ts`) — bez zmian merytorycznych; potwierdzić że działa niezależnie od encji.
- `searchEntity.test.ts` — dopisać: dla `entity: 'maneuver'` (i przynajmniej jednej innej) warunek widoczności jest scalany przez `AND`; dla encji spoza zbioru (np. `weapon`) **nie** jest dokładany; `searchEntityById` prywatnego manewru zwraca `null` przy cudzym/pustym kluczu; ścieżka `requirementFilter` (aggregateRaw) **zawiera** `$match` widoczności.
- Trasy `route.test.ts` / `[id]/route.test.ts` — nagłówek `x-api-key` trafia do `searchEntity` także dla encji kompendium.
- Fabryki zapytań + cache keys — nowy parametr `visibilityMode` odbija się w payloadzie/kluczu; brak parametru = zachowanie jak dziś (regresja) dla wołających bez filtra.
- Komponenty list — zmiana `apiKey`/trybu daje nowy `queryKey` (ponowne zapytanie).
- Formularze edycji — `AssignCurrentApiKeyButton` dokłada bieżący klucz; zapis niesie `apiKeys`.

## Etap 10 — Weryfikacja końcowa (obowiązkowa)

1. `npm run test` — cała pula zielona, szczególnie stare testy widoczności postaci (regresja po ewentualnym przemianowaniu modułu) i nowe multi-encyjne.
2. `npx tsc --noEmit` — nowe sygnatury (`visibilityWhere`, parametry fabryk, cache keys, DTO `apiKeys`) spójne wszędzie.
3. `npm run lint`.
4. Smoke test ręczny: dla manewru utworzyć 3 rekordy (`apiKeys: []`, `["ABC"]`, `["XYZ"]`), odpytać `POST /api/search` z `entity: 'maneuver'` raz bez nagłówka, raz `x-api-key: ABC` — wynik zgodny z regułą. Powtórzyć dla `POST /api/search/[id]` na prywatnym manewrze (bezpośredni dostęp po ID respektuje widoczność) **oraz** dla zapytania z `requirementFilter` (aggregateRaw nie przecieka prywatnych).
5. Druga para oczu (skill `review` / subagent code-reviewer): czy filtr działa w bazie (nie post-filtruje w JS) na wszystkich 3 ścieżkach (`findMany`, `findUnique`-by-id, `aggregateRaw`), czy paginacja kursorowa nadal łączy się przez `AND`, czy `@@unique` nie generuje 500 przy kolizji nazw, czy klucz nie jest nigdzie logowany.

## Kolejność wdrożenia (checklist)

1. Etap 0 — decyzja o unikalności `name+grade` (blokująca).
2. Etap 1 — schemat (5 encji) + domena + `generate`/`db push`.
3. Etap 2 — backfill 5 kolekcji.
4. Etap 3 — uogólnienie `searchEntity` (findMany + byId + aggregateRaw) i modułu widoczności.
5. Etap 4 — fabryki zapytań + cache keys + listy + inwalidacja.
6. Etap 5 — UI przypisania klucza w edycji (+ Etap 6 domyślna reguła twórcy).
7. Etap 7–8 — opcjonalny filtr 3-stanowy + i18n.
8. Etap 9–10 — testy i pełna weryfikacja.

## Otwarte decyzje (do potwierdzenia przed Etapem 1)

1. **Unikalność `name+grade`** — czy prywatne elementy dzielą globalną przestrzeń nazw z publicznymi (wtedy walidacja nazw), czy rozluźniamy/namespacujemy unikalność? (największy wpływ na resztę planu i na import/mapowania).
2. **Zakres CRUD per encja** — które z 5 encji mają dziś pełny formularz edycji, a które trzeba dobudować od zera w ramach §4.1?
3. **Domyślna widoczność nowego elementu** — publiczny (pusty `apiKeys`) z opcją prywatyzacji, czy prywatny do klucza twórcy? (rekomendacja: publiczny, spójnie z postaciami).
4. **Filtr 3-stanowy na listach kompendium (Etap 7)** — w MVP czy poza zakresem?
5. **Wartości w `apiKeys`** — dowolne stringi grupujące widoczność (jak przyjęto przy postaciach), czy walidowane względem `NEXT_API_KEYS`? (rekomendacja: dowolne, spójnie z postaciami).
