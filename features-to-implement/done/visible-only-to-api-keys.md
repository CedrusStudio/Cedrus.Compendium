# Implementacja filtrowania postaci po API Key – Plan naprawczy v2

## Cel biznesowy

Postać ma być widoczna:

- dla wszystkich użytkowników, jeśli nie ma przypisanych żadnych API Key,
- dla użytkowników posiadających API Key znajdujący się na liście postaci,
- niewidoczna dla wszystkich pozostałych.

### Reguła widoczności

```text
apiKeys == undefined  -> publiczna
apiKeys == []         -> publiczna
apiKeys contains key  -> widoczna
apiKeys contains inne -> ukryta
```

---

# Aktualny problem

W trakcie implementacji filtr został częściowo przeniesiony do:

```ts
searchEntity.ts
```

i zaczął filtrować wyniki po pobraniu ich z bazy.

Jest to niezgodne z pierwotnym wymaganiem:

> Filtrowanie powinno być realizowane na poziomie bazy danych.

W efekcie:

- trudno przewidzieć zachowanie cache,
- paginacja może zwracać błędne wyniki,
- wydajność spada wraz z liczbą postaci,
- logika jest rozproszona pomiędzy frontend, backend i warstwę persistence.

---

# Plan diagnostyczny (obowiązkowy)

Przed dalszym wdrażaniem należy wykonać podwójną weryfikację.

---

## Krok 1 – Zweryfikować rzeczywiste dane w MongoDB

Uruchomić:

```ts
const characters = await prisma.character.findMany({
  select: {
    id: true,
    name: true,
    apiKeys: true,
  },
});
```

i sprawdzić jak naprawdę wyglądają rekordy.

### Możliwe warianty

#### Wariant A

```json
{
  "apiKeys": []
}
```

#### Wariant B

```json
{
  "apiKeys": null
}
```

#### Wariant C

```json
{
}
```

(brak pola)

#### Wariant D

```json
{
  "apiKeys": ["abc"]
}
```

To jest najważniejszy punkt diagnostyczny.

Bez tej wiedzy nie da się poprawnie zbudować filtra.

---

## Krok 2 – Zweryfikować generowane Prisma Query

Dodać tymczasowy log:

```ts
console.log(JSON.stringify(where, null, 2));
```

bezpośrednio przed:

```ts
prisma.character.findMany(...)
```

### Scenariusz: brak API Key

Powinno powstawać coś w rodzaju:

```ts
{
  OR: [
    { apiKeys: { isEmpty: true } },
    { apiKeys: null }
  ]
}
```

### Scenariusz: API Key ustawiony

Powinno powstawać:

```ts
{
  OR: [
    {
      apiKeys: {
        isEmpty: true
      }
    },
    {
      apiKeys: {
        has: currentApiKey
      }
    }
  ]
}
```

---

## Krok 3 – Zweryfikować aktualny API Key

Dodać tymczasowy log:

```ts
const { apiKey } = useApiKey();

console.log("CURRENT API KEY", apiKey);
```

oraz sprawdzić:

```ts
localStorage.getItem(...)
```

aby upewnić się, że:

- API Key jest faktycznie ustawiony,
- hook działa poprawnie,
- SSR nie nadpisuje wartości.

---

# Docelowa architektura

## Model domenowy

```ts
type Character = {
  ...
  apiKeys?: string[];
}
```

---

## Prisma

```prisma
model Character {
  id       String   @id @default(auto()) @map("_id") @db.ObjectId
  ...
  apiKeys  String[]
}
```

---

# Migracja istniejących danych

Największym źródłem problemów są stare rekordy.

Obecnie mogą występować:

```ts
apiKeys: undefined
```

lub

```ts
apiKeys: null
```

Docelowo wszystkie powinny zostać wyrównane do:

```ts
apiKeys: []
```

### Przykładowy skrypt migracyjny

```ts
await prisma.character.updateMany({
  where: {
    apiKeys: null
  },
  data: {
    apiKeys: []
  }
});
```

lub dedykowany migration script dla Mongo.

---

# Docelowy filtr Prisma

Po migracji danych logika znacząco się upraszcza.

---

## Brak API Key

```ts
where: {
  apiKeys: {
    isEmpty: true
  }
}
```

---

## API Key ustawiony

```ts
where: {
  OR: [
    {
      apiKeys: {
        isEmpty: true
      }
    },
    {
      apiKeys: {
        has: currentApiKey
      }
    }
  ]
}
```

---

# Weryfikacja przepływu frontend → backend

## Widok postaci

Sprawdzić:

```text
CharactersHeadersList
```

oraz:

```text
useSearchCharactersSummary
```

Czy aktualny API Key trafia do query buildera.

---

## Bestiariusz

Sprawdzić:

```text
BestiaryTable
```

oraz:

```text
useSearchCharacters
useSearchCharactersSummary
```

Czy przekazują aktualny API Key.

---

# Weryfikacja cache

## React Query Key

Query Key musi zawierać API Key.

Przykład:

```ts
[
  "characters",
  search,
  apiKey
]
```

Jeżeli API Key nie znajduje się w Query Key, React Query może zwracać stare wyniki.

---

## Invalidate po zmianie API Key

Po zmianie klucza należy wykonać:

```ts
queryClient.invalidateQueries({
  queryKey: ["characters"]
});
```

oraz:

```ts
queryClient.invalidateQueries({
  queryKey: ["bestiary"]
});
```

---

# Testy obowiązkowe

## Test 1 – Publiczna postać bez API Key

Dane:

```ts
apiKeys: []
```

Aktualny użytkownik:

```ts
apiKey = undefined
```

Oczekiwany wynik:

```text
widoczna
```

---

## Test 2 – Publiczna postać z API Key

Dane:

```ts
apiKeys: []
```

Aktualny użytkownik:

```ts
apiKey = "ABC"
```

Oczekiwany wynik:

```text
widoczna
```

---

## Test 3 – Postać prywatna z pasującym kluczem

Dane:

```ts
apiKeys: ["ABC"]
```

Aktualny użytkownik:

```ts
apiKey = "ABC"
```

Oczekiwany wynik:

```text
widoczna
```

---

## Test 4 – Postać prywatna z innym kluczem

Dane:

```ts
apiKeys: ["ABC"]
```

Aktualny użytkownik:

```ts
apiKey = "XYZ"
```

Oczekiwany wynik:

```text
niewidoczna
```

---

## Test 5 – Stary rekord (undefined)

Dane:

```ts
apiKeys: undefined
```

Aktualny użytkownik:

```ts
apiKey = undefined
```

Oczekiwany wynik:

```text
widoczna
```

---

## Test 6 – Stary rekord (undefined) z API Key

Dane:

```ts
apiKeys: undefined
```

Aktualny użytkownik:

```ts
apiKey = "ABC"
```

Oczekiwany wynik:

```text
widoczna
```

---

# Kolejność wdrożenia

## Etap 1 – Diagnostyka

- Zweryfikować dane MongoDB.
- Zweryfikować wygenerowane Prisma Query.
- Zweryfikować aktualny API Key.

---

## Etap 2 – Migracja danych

- Zamienić `undefined` i `null` na `[]`.
- Ujednolicić wszystkie rekordy.

---

## Etap 3 – Filtrowanie w bazie

- Usunąć filtrowanie z `searchEntity.ts`.
- Przenieść całość do Prisma `where`.

---

## Etap 4 – Frontend

- Zweryfikować przekazywanie API Key.
- Zweryfikować Query Keys.
- Dodać invalidate cache.

---

## Etap 5 – Testy

- Dodać komplet testów jednostkowych.
- Dodać test integracyjny wyszukiwania.
- Dodać test dla starych rekordów (`undefined`).

---

# Rekomendacja

Najbardziej prawdopodobna przyczyna obecnych problemów:

1. Starsze rekordy mają `apiKeys = undefined` lub brak pola.
2. Prisma/Mongo nie interpretuje pustych tablic tak, jak zakładano.
3. Cache tylko maskuje problem, ale nie jest jego główną przyczyną.
4. Filtrowanie zostało przeniesione z bazy do `searchEntity.ts`, co utrudniło diagnostykę.

Dlatego przed kolejnymi zmianami należy najpierw:
- sprawdzić rzeczywiste dane w Mongo,
- sprawdzić rzeczywiste Prisma Query,
- dopiero potem poprawiać logikę filtrowania.