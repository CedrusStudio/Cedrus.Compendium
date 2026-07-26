# Plan implementacji: widoczność postaci wg API Key

Plan wykonawczy dla `features-to-implement/visible-only-to-api-keys.md`, oparty o realny stan repo (zweryfikowane 2026-07-18).

## Ustalenia wstępne (różnice względem dokumentu źródłowego)

Dokument źródłowy zakłada, że filtr **już istnieje** i został błędnie przeniesiony do `searchEntity.ts`. To nieaktualne:

- pole `apiKeys` **nie istnieje** nigdzie w repo — ani w `prisma/schema.prisma` (`model Character`), ani w domenie (`src/domain/characters/Character.ts`), ani w warstwie search. Funkcjonalność jest budowana od zera, nie naprawiana.
- `searchEntity.ts` nie zawiera dziś żadnego filtrowania po `apiKeys` — więc "Etap 3 – usunięcie filtrowania z searchEntity.ts" z dokumentu jest bezprzedmiotowe. Zamiast usuwać, dodajemy filtr od razu na poziomie Prisma.
- w repo istnieje już koncepcja `apiKey` — ale jako **klucz administracyjny** (`NEXT_API_KEYS` → `adminApiKeys`, walidowany w `src/proxy.ts` dla zapisów). To ten sam klucz przechowywany w `localStorage` przez `useApiKey()` i wysyłany nagłówkiem `x-api-key` (`src/infrastructure/clients/baseClient.ts`). Nowa funkcjonalność wykorzysta ten sam nagłówek jako identyfikator "aktualnego użytkownika" do porównania z `Character.apiKeys` — nie trzeba wprowadzać nowego mechanizmu tożsamości.
- **Znaleziony bug** w `baseClient.ts` (interceptor requestu):

  ```ts
  const isSearchPost = method === 'POST' && config.url?.includes('/search');
  if (method === 'GET' && isSearchPost) return config; // nigdy nie może być prawdą
  ```

  Warunek jest martwy (nie da się mieć `method === 'GET'` i `isSearchPost === true` jednocześnie, bo `isSearchPost` wymaga `POST`). Efekt uboczny: nagłówek `x-api-key` **jest już dziś wysyłany** przy `POST /api/search`, mimo że kod wygląda, jakby miał to pomijać. To akurat działa na naszą korzyść (potrzebujemy klucza w tym requeście), ale kod wprowadza w błąd i wymaga uporządkowania jako część tej pracy.
- `src/proxy.ts` ma matcher wykluczający `/api/search` z obowiązkowej autoryzacji (`'/api/((?!search).*)'`) — zgodne z regułą biznesową "publiczna domyślnie". Nie trzeba tego zmieniać.

## Docelowa architektura (zweryfikowana w kodzie)

Przepływ requestu wyszukiwania postaci:

```
CharactersHeadersList / BestiaryTable
  → useQuery (queryKey: createSearchCharactersKey)
  → searchClient.search() → baseClient (axios, dokłada nagłówek x-api-key)
  → POST /api/search → route.ts → searchEntity(payload) → prisma.character.findMany(where)
```

Pojedyncza postać:

```
characters/[id]/page.tsx, edit/page.tsx
  → searchClient.searchById() → POST /api/search/[id] → route.ts → searchEntityById() → prisma.character.findUnique()
```

Oba miejsca (`searchEntity`, `searchEntityById`) muszą wymuszać widoczność — inaczej prywatną postać da się otworzyć bezpośrednio po znanym/zgadniętym ID z `/characters/{id}`.

---

## Etap 1 — Model danych

**Plik:** `prisma/schema.prisma`, model `Character` (linia ~21).

```prisma
model Character {
  ...
  apiKeys String[] @default([])
}
```

**Plik:** `src/domain/characters/Character.ts` — dodać `apiKeys?: string[]` do typu `Character` oraz do `emptyCharacter` (`apiKeys: []`).

Uruchomić `npx prisma generate` (i `prisma db push`, bo to Mongo — brak klasycznych migracji SQL) po zmianie schematu.

## Etap 2 — Skrypt wyrównania istniejących danych

Mongo jest bezschematowy — stare rekordy nie mają pola `apiKeys` (`undefined`), nie `null`. Trzeba je wyrównać do `[]`, żeby filtr Prisma (`isEmpty: true`) działał deterministycznie.

Dodać jednorazowy skrypt, np. `scripts/backfill-character-api-keys.ts`:

```ts
import prisma from '@/lib/prisma';

async function main() {
  const result = await prisma.character.updateMany({
    where: { apiKeys: null },
    data: { apiKeys: [] },
  });
  console.log(`Zaktualizowano ${result.count} rekordów.`);
}

main().finally(() => prisma.$disconnect());
```

Przed uruchomieniem na produkcyjnej bazie: wykonać dokładnie krok diagnostyczny z dokumentu źródłowego (Krok 1) — `prisma.character.findMany({ select: { id: true, name: true, apiKeys: true } })` — żeby potwierdzić realny kształt danych (warianty A–D z dokumentu) i dopiero wtedy dobrać `where` w skrypcie. Zostawiam to jako pierwszy krok wykonawczy, nie architektoniczny.

## Etap 3 — Filtr widoczności na poziomie Prisma

**Nowy plik:** `src/persistence/characterVisibility.ts`

```ts
export function characterVisibilityWhere(apiKey: string | null | undefined) {
  if (!apiKey) {
    return { apiKeys: { isEmpty: true } };
  }
  return {
    OR: [
      { apiKeys: { isEmpty: true } },
      { apiKeys: { has: apiKey } },
    ],
  };
}
```

**Modyfikacja:** `src/persistence/searchEntity.ts`

- `searchEntity` i `searchEntityById` przyjmują dodatkowy parametr `apiKey: string | null`.
- Warunek widoczności dokładany jest **tylko dla `payload.entity === 'character'`**, scalany z istniejącym `whereClause` przez ten sam mechanizm `AND`, który już obsługuje cursor pagination (patrz `isAndCondition` / scalanie w `createSearchInput`) — czyli reużywamy istniejącego wzorca zamiast dodawać nowy.
- Dla `searchEntityById` (Prisma `findUnique`) dodać `apiKeys` do `where` nie jest trywialne (Mongo `findUnique` wymaga unikalnego pola w `where`) — bezpieczniejsze rozwiązanie: pobrać rekord przez `findUnique({ where: { id } })`, a następnie w kodzie sprawdzić `characterVisibilityWhere`-owy warunek in-memory i zwrócić `null`/404, jeśli niewidoczny. To jedyne uzasadnione odejście od "filtrowania w bazie" — bo Mongo/Prisma nie pozwala łączyć `findUnique` z dodatkowymi warunkami `where` poza kluczem unikalnym.

**Modyfikacja:** `src/app/api/search/route.ts` i `src/app/api/search/[id]/route.ts`

- odczytać `request.headers.get(API_KEY_HEADER)` (`API_KEY_HEADER` z `@/proxy`) i przekazać jako `apiKey` do `searchEntity`/`searchEntityById`.
- filtr stosować wyłącznie, gdy `searchEntityPayload.entity === 'character'` — reszta encji (maneuver, spell, perk, itd.) nie ma pola `apiKeys` i nie powinna być dotykana.

**Uporządkowanie:** `src/infrastructure/clients/baseClient.ts` — naprawić/skomentować martwy warunek `isSearchPost`, żeby jasno wynikało z kodu, że `x-api-key` jest celowo wysyłany również dla `POST /search` (a nie że przypadkiem "przecieka" przez błędny warunek).

## Etap 4 — Frontend: cache keys i przekazywanie klucza

Klucz API dociera dziś do backendu automatycznie przez nagłówek (interceptor w `baseClient.ts`) — **nie trzeba** dokładać go do treści payloadu wyszukiwania. Wymagane zmiany dotyczą wyłącznie React Query cache:

**Plik:** `src/persistence/cacheKeys.ts` — `createSearchCharactersKey` przyjmuje dodatkowy parametr `apiKey: string | null`, dopisywany na końcu tablicy klucza.

**Pliki wywołujące:** `CharactersHeadersList.tsx`, `BestiaryTable.tsx`, `useSearchCharactersSummary.ts`, `SelectBaseCharacterDialog.tsx` — pobrać `apiKey` przez `useApiKey()` i przekazać do `createSearchCharactersKey`.

Uwaga: `BestiaryTable` i `CharactersHeadersList` używają **tego samego** klucza `'characters'` (nie ma osobnego klucza `'bestiary'`, wbrew przykładowi w dokumencie źródłowym) — inwalidacja `['characters']` pokryje oba widoki.

**Invalidacja po zmianie klucza:** w `src/common/hooks/useApiKey.ts` — dodać `useQueryClient()` i wywołać `queryClient.invalidateQueries({ queryKey: ['characters'] })` w `saveApiKey` oraz `removeApiKey` (a nie osobno `bestiary`, patrz wyżej).

## Etap 5 — Testy

Framework: Vitest (`npm run test`), konwencja `__tests__` obok testowanego pliku — zgodnie z istniejącymi `src/common/global/__tests__/SearchPayloads.test.ts`, `src/proxy.test.ts`.

### 5.1 `src/persistence/__tests__/characterVisibility.test.ts` (nowy, czysta funkcja — najważniejsze testy)

Bezpośrednie odwzorowanie 6 przypadków z dokumentu źródłowego + przypadki brzegowe:

1. `apiKeys: []`, `apiKey: undefined` → widoczna (`isEmpty: true` w where, brak requestu z kluczem).
2. `apiKeys: []`, `apiKey: "ABC"` → widoczna.
3. `apiKeys: ["ABC"]`, `apiKey: "ABC"` → widoczna.
4. `apiKeys: ["ABC"]`, `apiKey: "XYZ"` → niewidoczna.
5. `apiKeys: undefined` (stary rekord), `apiKey: undefined` → widoczna (dopóki backfill z Etapu 2 nie jest pewny — test dokumentuje zamierzone zachowanie zanim dane zostaną wyrównane).
6. `apiKeys: undefined`, `apiKey: "ABC"` → widoczna.
7. (dodatkowe) `apiKey: ""` (pusty string po `trim()`) → traktowany jak brak klucza.
8. (dodatkowe) `apiKeys: ["ABC", "DEF"]`, `apiKey: "DEF"` → widoczna (dopasowanie do dowolnego elementu listy, nie tylko pierwszego).

Testy 1–6 uruchamiane jako sprawdzenie *kształtu zwracanego obiektu where* (nie wymaga bazy) — czyli test jednostkowy generatora warunku, zgodnie z Krokiem 2 dokumentu źródłowego ("zweryfikować generowane Prisma Query"), tylko jako trwały test automatyczny zamiast tymczasowego `console.log`.

### 5.2 `src/persistence/__tests__/searchEntity.test.ts` (nowy, integracja z mockiem Prisma)

- mockować `@/lib/prisma` (`vi.mock`), sprawdzić że `searchEntity({ entity: 'character', ... }, apiKey)` woła `prisma.character.findMany` z `where` zawierającym warunek widoczności scalony przez `AND` z pozostałymi filtrami (search/exclude/cursor).
- sprawdzić, że dla innych encji (`entity: 'spell'`, `entity: 'maneuver'`) warunek widoczności **nie jest** dokładany.
- `searchEntityById`: mockować `findUnique` zwracające prywatną postać (`apiKeys: ["ABC"]`) i sprawdzić, że przy `apiKey !== "ABC"` funkcja zwraca `null`/rzuca kontrolowany błąd zamiast danych.

### 5.3 `src/app/api/search/route.test.ts` i `src/app/api/search/[id]/route.test.ts` (nowe)

- request z nagłówkiem `x-api-key` → weryfikacja, że wartość trafia do `searchEntity` jako parametr.
- request bez nagłówka → `apiKey` przekazany jako `null`/`undefined`, encja `character` filtrowana jako publiczna.

### 5.4 Frontend

- `CharactersHeadersList.test.tsx` (istniejący) — dopisać przypadek: zmiana API Key w localStorage powoduje nowy `queryKey` / ponowne zapytanie.
- `useApiKey.test.tsx` (istniejący) — dopisać: `saveApiKey`/`removeApiKey` wywołują `invalidateQueries({ queryKey: ['characters'] })`.

### 5.5 Skrypt migracyjny

Skrypt z Etapu 2 nie potrzebuje testu jednostkowego (to jednorazowy operacyjny skrypt), ale przed uruchomieniem na realnej bazie: wykonać na kopii/lokalnym Mongo i zweryfikować `result.count` oraz ręcznie sprawdzić kilka rekordów przez `prisma.character.findMany({ select: { apiKeys: true } })`.

## Etap 6 — Podwójna weryfikacja (obowiązkowa przed uznaniem zadania za zakończone)

1. `npm run test` — cała pula testów zielona, ze szczególną uwagą na `src/proxy.test.ts` (upewnić się, że zmiany w `baseClient.ts` nie naruszyły istniejącej logiki autoryzacji zapisów) i nowe testy z Etapu 5.
2. `npx tsc --noEmit` (lub `npm run build`) — typy `Character.apiKeys` i sygnatur `searchEntity`/`searchEntityById` się zgadzają wszędzie, gdzie te funkcje są wołane.
3. `npm run lint`.
4. Ręczny smoke test lokalnie: przez `prisma studio` lub skrypt seedujący utworzyć 3 postacie (`apiKeys: []`, `apiKeys: ["ABC"]`, `apiKeys: ["XYZ"]`) i odpytać `POST /api/search` raz bez nagłówka `x-api-key`, raz z `x-api-key: ABC` — potwierdzić, że lista wyników odpowiada regule z dokumentu źródłowego.
5. Powtórzyć krok 4 dla `/api/search/[id]` na postaci prywatnej, żeby potwierdzić że bezpośredni dostęp po ID też respektuje widoczność (to scenariusz, którego brakowało w dokumencie źródłowym).
6. Druga para oczu: po zaimplementowaniu zmian uruchomić przegląd kodu (np. subagent code-reviewer / skill `review`) pod kątem: czy filtr faktycznie działa na poziomie zapytania do bazy (nie post-filtruje w JS), czy paginacja kursorowa nadal działa poprawnie z dodatkowym warunkiem `AND`, czy nagłówek `x-api-key` nie jest logowany/persystowany nigdzie po drodze.

## Kolejność wdrożenia (checklist)

1. Etap 1 — schemat Prisma + model domenowy + `prisma generate`/`db push`.
2. Etap 2 — diagnostyka realnych danych Mongo, potem skrypt backfill.
3. Etap 3 — `characterVisibilityWhere`, zmiany w `searchEntity.ts`, `route.ts` (x2), porządek w `baseClient.ts`.
4. Etap 4 — cache keys + invalidacja.
5. Etap 5 — testy (jednostkowe generatora where, integracyjne searchEntity, route, frontend).
6. Etap 6 — pełna weryfikacja: testy, typecheck, lint, smoke test ręczny, code review.

## Otwarte pytanie do potwierdzenia przed implementacją

Dokument źródłowy nie precyzuje, czy wartości w `Character.apiKeys` muszą pochodzić z tej samej puli co `NEXT_API_KEYS` (klucze administracyjne), czy są dowolnymi, niezależnie nadawanymi wartościami służącymi tylko do grupowania widoczności. Plan zakłada wariant drugi (dowolne stringi, bez walidacji względem `adminApiKeys`), zgodnie z literalnym brzmieniem reguły widoczności w dokumencie źródłowym. Warto to potwierdzić przed Etapem 1, bo wpływa na to, czy przy tworzeniu/edycji postaci (`edit/page.tsx`) potrzebny jest walidator/autouzupełnianie z listy znanych kluczy.
