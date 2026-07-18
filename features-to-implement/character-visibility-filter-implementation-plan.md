# Plan implementacji: filtr widoczności postaci (Wszystkie / Tylko moje / Tylko publiczne)

Kontynuacja już dowiezionej funkcjonalności z `features-to-implement/visible-only-to-api-keys-implementation-plan.md` (pole `Character.apiKeys`, `characterVisibilityWhere`, `isCharacterVisible`). Ten dokument opisuje dodanie **filtra UI** na `/characters` i w bestiariuszu, pozwalającego zawęzić listę do postaci prywatnych przypisanych do własnego API key albo do postaci publicznych — zamiast tylko biernie ukrywać niewidoczne postacie, jak robi to obecny mechanizm.

## Ustalenia (potwierdzone z użytkownikiem przed pisaniem planu)

1. **UI = jeden 3-stanowy przełącznik**, nie dwa niezależne checkboxy: `Wszystkie` / `Tylko moje` / `Tylko publiczne`. Wyklucza to sprzeczne kombinacje.
2. **„Tylko moje” = wyłącznie postacie sprywatyzowane do mojego klucza** (`apiKeys` zawiera mój klucz), **bez** postaci publicznych. Publiczne są osobną kategorią („Tylko publiczne”). To nowa reguła, różna od dzisiejszej domyślnej widoczności (publiczne + moje).
3. **Brak ustawionego API key → opcja „Tylko moje” jest `disabled` w UI.** Backend mimo to musi się defensywnie zabezpieczyć (patrz Etap 2) na wypadek ręcznego wywołania API z tym trybem bez klucza.

## Reguły dla trzech trybów

```
mode = "all"        -> apiKeys.isEmpty == true  OR  apiKeys has mój klucz     (dzisiejsze zachowanie, bez zmian)
mode = "publicOnly" -> apiKeys.isEmpty == true                                 (niezależnie od tego, czy klucz jest ustawiony)
mode = "mineOnly"   -> apiKeys has mój klucz                                   (wymaga ustawionego klucza; bez klucza -> pusty wynik)
```

`mineOnly` nie potrzebuje osobnego warunku `isEmpty: false` — dopasowanie `has: klucz` jest niemożliwe na pustej tablicy, więc jest ono automatycznie wykluczające.

---

## Docelowy przepływ (bez zmian w warstwie transportu tożsamości)

```
CharactersHeadersList / BestiaryTable
  (state: visibilityMode: 'all' | 'mineOnly' | 'publicOnly', domyślnie 'all')
  → createSearchCharactersKey(..., apiKey, visibilityMode)      [cache key]
  → createCharacterSummaryQuery/createCharacterQuery(..., visibilityMode)
      → SearchQueryBuilder.visibilityFilter(mode) → payload.characterVisibilityMode
  → client.search() → baseClient (nagłówek x-api-key, BEZ ZMIAN)
  → POST /api/search → route.ts (BEZ ZMIAN — przekazuje cały payload jak dziś)
  → searchEntity(payload, apiKey)
      → payload.characterVisibilityMode odczytywany wewnątrz, NIE trzeba nowego parametru funkcji
      → characterVisibilityWhere(apiKey, mode)
```

Kluczowa decyzja architektoniczna: `apiKey` (tożsamość) dalej leci nagłówkiem — tak jak dziś. Nowy `visibilityMode` (opcja filtra, nie tożsamość) leci **w treści payloadu** requestu, tak jak `search`/`exclude`/`sort`. Dzięki temu **`route.ts` i `[id]/route.ts` nie wymagają żadnych zmian** — już dziś przekazują cały `searchEntityPayload` do `searchEntity`.

`searchEntityById`/`/api/search/[id]` **celowo nie obsługuje** `characterVisibilityMode` — to filtr widoku listy, nie dotyczy pobierania pojedynczej postaci po ID (tam nadal obowiązuje wyłącznie `isCharacterVisible`, czyli reguła „all”, jak dziś).

---

## Etap 1 — Rozszerzenie typu w `SearchPayloads.ts`

**Plik:** `src/common/global/SearchPayloads.ts`

Dodać typ trybu i pole do `SearchPayload` (warstwa `common`, żeby `persistence/characterVisibility.ts` mogło go zaimportować bez odwrotnej zależności common→persistence):

```ts
export type CharacterVisibilityMode = 'all' | 'mineOnly' | 'publicOnly';

export type SearchPayload =
{
  search?: { [key: string]: SearchValueInput };
  exclude?: { [key: string]: SearchValueInput };
  sort?: { [key: string]: 'asc' | 'desc' }[] | undefined;
  pagination?: OffsetPagination | KeysetPagination;
  select?: Select;
  // Dotyczy wyłącznie entity === 'character'; ignorowane dla pozostałych encji.
  characterVisibilityMode?: CharacterVisibilityMode;
};
```

## Etap 2 — `characterVisibility.ts`: obsługa trybu

**Plik:** `src/persistence/characterVisibility.ts`

```ts
import type { CharacterVisibilityMode } from '@/common/global/SearchPayloads';

export type CharacterVisibilityWhere =
  | { apiKeys: { isEmpty: true } }
  | { apiKeys: { has: string } }
  | { OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: string } }] };

export function characterVisibilityWhere(
  apiKey: string | null | undefined,
  mode: CharacterVisibilityMode = 'all'
): CharacterVisibilityWhere
{
  const normalizedApiKey = normalizeApiKey(apiKey);

  if (mode === 'publicOnly')
  {
    return { apiKeys: { isEmpty: true } };
  }

  if (mode === 'mineOnly')
  {
    if (!normalizedApiKey)
    {
      // Wywołujący (searchEntity) musi to sprawdzić WCZEŚNIEJ i nie wołać
      // bazy w ogóle — patrz canUseMineOnlyVisibility poniżej. Rzucamy tu,
      // żeby błąd wołającego był wykryty od razu, a nie ciszą zwrócić
      // fałszywie puste `where`.
      throw new Error('characterVisibilityWhere: mode "mineOnly" requires an API key.');
    }

    return { apiKeys: { has: normalizedApiKey } };
  }

  // mode === 'all' — dzisiejsze zachowanie, bez zmian
  if (!normalizedApiKey)
  {
    return { apiKeys: { isEmpty: true } };
  }

  return { OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: normalizedApiKey } }] };
}

// Używane przez searchEntity, żeby uniknąć zbędnego (i błędnego) zapytania
// do bazy, gdy UI mimo wszystko wysłałby "mineOnly" bez klucza (np. ręczne
// wywołanie API po usunięciu klucza w innej karcie).
export function canUseMineOnlyVisibility(apiKey: string | null | undefined): boolean
{
  return normalizeApiKey(apiKey) !== null;
}
```

`isCharacterVisible` (używane przez `searchEntityById`) **pozostaje bez zmian** — nadal reprezentuje wyłącznie regułę „all”, zgodnie z decyzją, że pojedyncze pobranie po ID nie respektuje `characterVisibilityMode`.

## Etap 3 — `searchEntity.ts`: odczyt trybu z payloadu + guard

**Plik:** `src/persistence/searchEntity.ts`

- `createSearchInput` (linia ~120): zamiast `characterVisibilityWhere(apiKey)` wywołać `characterVisibilityWhere(apiKey, payload.characterVisibilityMode ?? 'all')`.
- `searchEntity` (linia ~67): dodać guard na wejściu, **przed** wywołaniem `createSearchInput`/`findMany`:

```ts
export async function searchEntity<TMappedResult>(payload: SearchEntityPayload, apiKey?: string | null): Promise<TMappedResult[]>
{
  if (
    payload.entity === CHARACTER_ENTITY &&
    payload.characterVisibilityMode === 'mineOnly' &&
    !canUseMineOnlyVisibility(apiKey)
  )
  {
    return [] as TMappedResult[];
  }

  const findInput = createSearchInput(payload, apiKey, payload.include);
  // ...bez zmian dalej
}
```

Dzięki temu: (a) nie ma zapytania do bazy w sytuacji, która i tak nie może zwrócić wyników, (b) `characterVisibilityWhere` nigdy nie rzuca w praktyce, bo `searchEntity` już odciął tę ścieżkę wcześniej — `throw` w Etapie 2 jest czystą asercją na wypadek błędu w innym, przyszłym wywołującym.

**`route.ts` i `[id]/route.ts` — brak zmian**, zgodnie z decyzją architektoniczną powyżej.

## Etap 4 — `SearchQueryBuilder.ts`: nowa metoda buildera

**Plik:** `src/infrastructure/searchQueries/SearchQueryBuilder.ts`

```ts
private _characterVisibilityMode?: CharacterVisibilityMode;

visibilityFilter(mode: CharacterVisibilityMode | undefined): this
{
  if (!mode || mode === 'all') return this; // 'all' = brak pola w payloadzie, tak jak dziś
  this._characterVisibilityMode = mode;
  return this;
}
```

W `build()`, obok istniejących `if (this._search...)`, `if (this._exclude...)` itd., dodać:

```ts
if (this._characterVisibilityMode)
{
  query.characterVisibilityMode = this._characterVisibilityMode;
}
```

## Etap 5 — Query factory: `createCharacterSummaryQuery` i `createCharacterQuery`

**Pliki:**
- `src/infrastructure/searchQueries/characters/createCharacterSummaryQuery.ts` (używane przez `/characters`)
- `src/infrastructure/searchQueries/characters/createCharacterQuery.ts` (używane przez bestiariusz)

Dodać ostatni parametr `visibilityMode?: CharacterVisibilityMode` do obu funkcji i doczepić `.visibilityFilter(visibilityMode)` do łańcucha buildera. Zmiana czysto addytywna (nowy opcjonalny parametr na końcu) — nie łamie innych wywołujących.

## Etap 6 — Cache keys

**Plik:** `src/persistence/cacheKeys.ts`

`createSearchCharactersKey` dostaje nowy, ostatni parametr `visibilityMode?: CharacterVisibilityMode`, dopisywany na końcu tablicy klucza (żeby różne tryby nie dzieliły cache'u React Query):

```ts
export function createSearchCharactersKey(
    search: string,
    cursor: string,
    includeTags?: string[],
    pageSize?: number,
    excludeTags?: string[],
    apiKey?: string | null,
    visibilityMode?: CharacterVisibilityMode
) {
    return [
        characterKey, searchParamKey, search, cursor,
        includeTags?.join(',') || '', excludeTags?.join(',') || '',
        pageSize, apiKey || '', visibilityMode || 'all'
    ] as const;
}
```

**Wywołujący do zaktualizowania** (przeszukać wszystkie miejsca wołające `createSearchCharactersKey`):
- `CharactersHeadersList.tsx` — przekazać nowy stan `visibilityMode`.
- `BestiaryTable.tsx` — analogicznie.
- `useSearchCharactersSummary.ts` i `SelectBaseCharacterDialog.tsx` — nie mają UI filtra, więc po prostu pomijają ten parametr (pozostaje `undefined` → `'all'` w kluczu, zgodne z dzisiejszym zachowaniem, zero zmiany funkcjonalnej w tych miejscach).

Inwalidacja cache w `useApiKey.ts` (`saveApiKey`/`removeApiKey`) **nie wymaga zmian** — prefix `['characters']` nadal pokrywa wszystkie warianty `visibilityMode`, bo to tylko rozszerzenie istniejącego klucza o dodatkowy segment.

## Etap 7 — Nowy komponent UI: `CharacterVisibilityFilter`

**Nowy plik:** `src/common/components/filters/CharacterVisibilityFilter.tsx`

Reużywa istniejący, już używany w repo wzorzec `Tabs`/`TabsList`/`TabsTrigger` z `@/ui/tabs` (dziś używany w `CharacterView.tsx`/`EditCharacterView.tsx` jako zakładki karty postaci) — to gotowy, znany komponent Radix z natywnym wsparciem `disabled` na `TabsTrigger`, więc nie trzeba wprowadzać nowej biblioteki/wzorca (np. Switch, którego w repo nie ma).

```tsx
'use client';

import { Tabs, TabsList, TabsTrigger } from '@/ui/tabs';
import { displayedText } from '@/common/translations';
import type { CharacterVisibilityMode } from '@/common/global/SearchPayloads';

type CharacterVisibilityFilterProps = {
  value: CharacterVisibilityMode;
  onValueChange: (mode: CharacterVisibilityMode) => void;
  mineOnlyDisabled: boolean;
};

export default function CharacterVisibilityFilter({ value, onValueChange, mineOnlyDisabled }: CharacterVisibilityFilterProps)
{
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as CharacterVisibilityMode)}>
      <TabsList>
        <TabsTrigger value="all">{displayedText.characterVisibilityAll}</TabsTrigger>
        <TabsTrigger value="mineOnly" disabled={mineOnlyDisabled}>{displayedText.characterVisibilityMineOnly}</TabsTrigger>
        <TabsTrigger value="publicOnly">{displayedText.characterVisibilityPublicOnly}</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
```

## Etap 8 — Integracja z `CharactersHeadersList.tsx`

- Nowy stan: `const [visibilityMode, setVisibilityMode] = useState<CharacterVisibilityMode>('all');`
- Rozszerzyć destrukturyzację `useApiKey()` o `hasApiKey`.
- **Auto-reset**, gdy klucz zniknie w trakcie gdy wybrane jest „Tylko moje” (np. użytkownik usunie klucz w innej karcie — `useApiKey` już nasłuchuje `storage`/custom event):

```ts
useEffect(() =>
{
  if (!hasApiKey && visibilityMode === 'mineOnly') setVisibilityMode('all');
}, [hasApiKey, visibilityMode]);
```

- Handler zmiany, analogiczny do `handleSearchTagsChange` (resetuje wyniki/kursor):

```ts
const handleVisibilityModeChange = useCallback((mode: CharacterVisibilityMode) =>
{
  setVisibilityMode(mode);
  clearResults();
}, [clearResults]);
```

- `queryKey` i `queryFn`: dopisać `visibilityMode` do `createSearchCharactersKey(...)` i do `createCharacterSummaryQuery(...)`.
- W JSX, obok istniejącego `<TagFilter />` w wierszu filtrów (linia ~115-124): dodać `<CharacterVisibilityFilter value={visibilityMode} onValueChange={handleVisibilityModeChange} mineOnlyDisabled={!hasApiKey} />`.

## Etap 9 — Integracja z `BestiaryTable.tsx`

Analogicznie do Etapu 8: stan `visibilityMode`, `hasApiKey` z `useApiKey()`, auto-reset przy zniknięciu klucza, `handleVisibilityModeChange` (tu odpowiednik `handleSearchTagsChange`, czyli `clearResults()`), dopisanie do `createSearchCharactersKey`/`createCharacterQuery`, oraz dodanie `<CharacterVisibilityFilter />` w wierszu filtrów obok `<TagFilter />` (linia ~166-184).

## Etap 10 — i18n

**Plik:** `src/common/translations.ts` — dodać trzy klucze do `displayedText` (`characterVisibilityAll`, `characterVisibilityMineOnly`, `characterVisibilityPublicOnly`), wzorem istniejącego `searchByName: translate("searchByName")`.

**Pliki słownikowe** — dodać te same trzy klucze w:
- `src/common/translations/translations.pl-PL.ts`: `"Wszystkie"`, `"Tylko moje"`, `"Tylko publiczne"`.
- `src/common/translations/translations.de-DE.ts`: odpowiedniki niemieckie.
- `src/common/translations/translations.fr-FR.ts`: odpowiedniki francuskie.

## Etap 11 — Testy

Framework: Vitest, konwencja `__tests__` obok testowanego pliku (zgodnie z istniejącymi `characterVisibility.test.ts`, `searchEntity.test.ts`, `SearchQueryBuilder.test.ts`, `CharactersHeadersList.test.tsx`).

### 11.1 `src/persistence/__tests__/characterVisibility.test.ts` (rozszerzenie istniejącego)

- `mode: 'publicOnly'`, z kluczem i bez klucza → zawsze `{ apiKeys: { isEmpty: true } }` (klucz nie ma znaczenia).
- `mode: 'mineOnly'`, z kluczem `"ABC"` → `{ apiKeys: { has: "ABC" } }`.
- `mode: 'mineOnly'`, bez klucza (`undefined`, `null`, whitespace) → `characterVisibilityWhere` rzuca błąd.
- `mode: 'mineOnly'`, klucz z białymi znakami dookoła → trimowany tak samo jak w `mode: 'all'`.
- domyślny `mode` (nieprzekazany) → zachowanie identyczne z dzisiejszym `'all'` (regresja).
- nowe testy `canUseMineOnlyVisibility`: `undefined`/`null`/`''`/`'   '` → `false`; `"ABC"` → `true`.

### 11.2 `src/persistence/__tests__/searchEntity.test.ts` (rozszerzenie istniejącego)

- `payload.characterVisibilityMode: 'publicOnly'` → `where` zawiera `{ apiKeys: { isEmpty: true } }` scalone przez `AND` z resztą filtrów, tak jak dziś testowane dla `'all'`.
- `payload.characterVisibilityMode: 'mineOnly'` + poprawny `apiKey` → `where` zawiera `{ apiKeys: { has: apiKey } }`.
- `payload.characterVisibilityMode: 'mineOnly'` + brak `apiKey` → `prisma.character.findMany` **nie jest wołane w ogóle** (spy `toHaveBeenCalledTimes(0)`), funkcja zwraca `[]`.
- `payload.characterVisibilityMode` ustawiony, ale `entity !== 'character'` (np. `'spell'`) → filtr widoczności nadal nie jest dokładany (istniejący test tej reguły powinien przejść bez zmian, ale warto dopisać wariant z ustawionym trybem, żeby upewnić się że pole jest ignorowane, a nie powoduje błędu).
- brak `payload.characterVisibilityMode` → zachowanie identyczne z dzisiejszym (regresja, `mode` domyślnie `'all'`).

### 11.3 `src/infrastructure/searchQueries/__tests__/SearchQueryBuilder.test.ts` (rozszerzenie istniejącego)

- `.visibilityFilter('mineOnly')` → `build().characterVisibilityMode === 'mineOnly'`.
- `.visibilityFilter('all')` lub `.visibilityFilter(undefined)` → pole `characterVisibilityMode` **nieobecne** w wyniku `build()` (zgodność z dzisiejszym payloadem, gdy filtr nie jest używany — ważne dla `useSearchCharactersSummary`/`SelectBaseCharacterDialog`, które nie przekazują tego parametru).

### 11.4 Nowy: `src/common/components/filters/__tests__/CharacterVisibilityFilter.test.tsx`

- Renderuje trzy opcje z poprawnymi etykietami (`displayedText.*`).
- Kliknięcie opcji woła `onValueChange` z properną wartością.
- `mineOnlyDisabled=true` → trigger „Tylko moje” ma atrybut `disabled`/`aria-disabled` i kliknięcie go nie woła `onValueChange`.

### 11.5 `src/application/characters/list/__tests__/CharactersHeadersList.test.tsx` (rozszerzenie istniejącego)

- Zmiana trybu widoczności → nowy `queryKey` (ponowne zapytanie) i reset wyświetlanej listy/kursora (podobnie jak istniejący test dla zmiany tagów).
- Usunięcie API key (symulacja przez `useApiKey`/localStorage) podczas gdy wybrane jest „Tylko moje” → stan filtra wraca do `'all'`.

### 11.6 `BestiaryTable` — brak istniejącego pliku testowego

W repo nie ma dziś `BestiaryTable.test.tsx`. Do wyboru: (a) dodać nowy plik testowy pokrywający **tylko** nową funkcjonalność (filtr widoczności + reset przy usunięciu klucza), analogicznie do 11.5, albo (b) polegać wyłącznie na testach jednostkowych warstwy niższej (11.1–11.4) i ręcznym smoke teście (Etap 12). Rekomendacja: (a), żeby nie zostawiać nowej gałęzi kodu bez pokrycia w komponencie, który jej faktycznie używa — ale to decyzja do potwierdzenia, jeśli w repo jest świadoma konwencja pomijania testów dla `BestiaryTable`.

## Etap 12 — Weryfikacja końcowa (obowiązkowa przed uznaniem zadania za zakończone)

1. `npm run test` — cała pula testów zielona, ze szczególną uwagą na `characterVisibility.test.ts`, `searchEntity.test.ts`, `SearchQueryBuilder.test.ts` i nowe testy z Etapu 11.
2. `npx tsc --noEmit` — `CharacterVisibilityMode` i nowe sygnatury (`characterVisibilityWhere`, `createSearchCharactersKey`, `createCharacterSummaryQuery`, `createCharacterQuery`, `SearchQueryBuilder.visibilityFilter`) spójne wszędzie, gdzie są używane.
3. `npm run lint`.
4. Ręczny smoke test lokalnie: 3 postacie (`apiKeys: []` — publiczna, `apiKeys: ["ABC"]` — moja, `apiKeys: ["XYZ"]` — cudza), zapytanie `POST /api/search` z nagłówkiem `x-api-key: ABC` i kolejno `characterVisibilityMode: 'all' | 'mineOnly' | 'publicOnly'` w payloadzie — potwierdzić zgodność z tabelą reguł na początku dokumentu. Powtórzyć dla `mineOnly` **bez** nagłówka `x-api-key` — oczekiwany pusty wynik, zero zapytań do Mongo (do zweryfikowania np. logiem/profilerem, zgodnie z guardem z Etapu 3).
5. Ręczna weryfikacja UI: na `/characters` i w bestiariuszu — przełącznik działa, „Tylko moje” jest wyszarzone bez ustawionego klucza, usunięcie klucza w trakcie „Tylko moje” cofa na „Wszystkie” bez zawieszenia widoku pustą listą.
6. Druga para oczu (subagent code-reviewer / skill `review`): czy filtr faktycznie redukuje zapytanie na poziomie bazy (nie post-filtruje w JS), czy paginacja kursorowa nadal poprawnie łączy się przez `AND` z nowym warunkiem, czy `characterVisibilityMode` jest poprawnie ignorowany dla encji innych niż `character`, czy i18n jest kompletne we wszystkich trzech językach.

---

## Kolejność wdrożenia (checklist)

1. Etap 1 — `CharacterVisibilityMode` + pole w `SearchPayload`.
2. Etap 2 — `characterVisibilityWhere(apiKey, mode)` + `canUseMineOnlyVisibility`.
3. Etap 3 — guard i przekazanie trybu w `searchEntity.ts` (bez zmian w `route.ts`/`[id]/route.ts`).
4. Etap 4 — `SearchQueryBuilder.visibilityFilter(mode)`.
5. Etap 5 — parametr `visibilityMode` w `createCharacterSummaryQuery`/`createCharacterQuery`.
6. Etap 6 — `createSearchCharactersKey` + aktualizacja wywołujących.
7. Etap 7 — komponent `CharacterVisibilityFilter`.
8. Etap 8–9 — integracja w `CharactersHeadersList.tsx` i `BestiaryTable.tsx` (stan, auto-reset, handler, JSX).
9. Etap 10 — i18n (3 języki).
10. Etap 11 — testy (jednostkowe where/searchEntity/builder, komponent, integracja z widokami).
11. Etap 12 — pełna weryfikacja: testy, typecheck, lint, smoke test, code review.

## Ryzyka / rzeczy do pilnowania podczas implementacji

- **Reset stanu przy zniknięciu klucza** (Etap 8/9) jest łatwy do pominięcia — bez niego użytkownik zostaje z aktywnym filtrem „Tylko moje”, który po usunięciu klucza cicho zwraca pustą listę bez wyjaśnienia.
- **`mineOnly` bez guardu w `searchEntity`** (Etap 3) skutkowałby wywołaniem `characterVisibilityWhere` rzucającym wyjątek prosto do handlera API (500 zamiast pustej listy) — kolejność implementacji (guard przed builderem) ma znaczenie.
- **`SelectBaseCharacterDialog.tsx` i `useSearchCharactersSummary.ts`** nie powinny dostać nowego UI filtra w ramach tej pracy (poza zakresem — dotyczy tylko `/characters` i bestiariusza) — upewnić się, że nieprzekazanie `visibilityMode` w tych miejscach nadal kompiluje się i zachowuje jak dziś (parametr opcjonalny, domyślnie `'all'`).
