# Plan implementacji: Battle Presets

Plan wykonawczy dla `features-to-implement/battle-configurations.md`, oparty o realny stan repo (zweryfikowane 2026-07-18).

## Ustalenia wstępne (różnice względem dokumentu źródłowego)

Dokument źródłowy zakłada prostą strukturę `BattleConfiguration` (`allies`, `enemies`, `settings`) i architekturę opartą wyłącznie o React Query. Po przejrzeniu realnego kodu widoku bitwy trzeba to skorygować:

- **Widok bitwy nie ma dziś żadnej trwałej encji "Battle".** Stan bitwy żyje w Redux slice `src/persistence/slices/bestiarySlice.ts` i jest lustrzanie odbijany w `sessionStorage` (ginie po zamknięciu karty/sesji). Realny kształt stanu to:
  - `addedToBattle: string[]` — id postaci z bestiariusza dodanych do walki,
  - `initiatives: Record<string, { initiative: number | null }>` — rzucone/ustawione inicjatywy per uczestnik,
  - `externalParticipants: ExternalParticipant[]` — ręcznie dodani przeciwnicy spoza bestiariusza (`src/application/bestiary/battle/BattleCombatants.ts`),
  - `duplicatedCharacters: DuplicatedCharacter[]` — zduplikowane kopie postaci na czas walki (też z `BattleCombatants.ts`).

  To jest realny odpowiednik `BattleConfiguration` z dokumentu — nie `allies`/`enemies`/`settings`. Struktura poniżej w Etapie 1 zastępuje przykład z dokumentu.

- **`BattleTable.tsx` (widok bitwy) w ogóle nie używa `useApiKey()`.** Dokument w "Weryfikacji 2" zakłada, że `useApiKey()` jest już wspólnym źródłem klucza dla Battle View i Settings — w praktyce trzeba go tam dopiero wprowadzić. To nowa integracja, nie potwierdzenie istniejącej.

- **"API Key" w tym repo to klucz administracyjny z ustalonej puli**, nie dowolny identyfikator użytkownika. `NEXT_API_KEYS` → `adminApiKeys` (`src/lib/env.ts`), walidowany w `src/proxy.ts` dla wszystkich zapisów (`POST`/`PUT`/`DELETE` na `/api/*` poza `/api/search`) i osobno w handlerach `GET`, które proxy pomija (patrz `src/app/api/personalization/route.ts`). Battle Presets muszą wpisać się w ten sam mechanizm, a nie wprowadzać nowy.

- **Konwencja przechowywania "właściciela per apiKey" już istnieje** — `PersonalizationProfileRecord` (`prisma/schema.prisma`) trzyma **hash** klucza (`apiKeyHash`, `sha256` przez `src/lib/apiKeyHash.ts`), nie klucz w postaci jawnej. To inny wzorzec niż `Character.apiKeys` (tablica jawnych kluczy, bo tam klucz jest warunkiem *widoczności* wielu postaci naraz, nie *właścicielem* pojedynczego zasobu). Battle Preset jest koncepcyjnie bliżej `PersonalizationProfileRecord` (jeden zasób należący do jednego klucza) niż `Character` — plan przyjmuje **hashowanie klucza**, wbrew przykładowi z dokumentu źródłowego (`apiKey: "abc123"` jawnym tekstem). Uzasadnienie: nie ma powodu trzymać klucza admina w bazie w postaci jawnej w kolejnej kolekcji, skoro wzorzec hashowania już istnieje i jest przetestowany.

- **Wszystkie modele w repo używają `ulid()` jako `id`** (`@id @default(ulid()) @map("_id")`), nie `ObjectId`/`auto()` jak w przykładzie z dokumentu. `BattlePreset` ma być spójny z resztą schematu.

- **`configuration` jako `Json`, nie string.** Mongo + Prisma obsługuje natywnie typ `Json` (dokument BSON), więc nie trzeba (tak jak przy `PersonalizationProfileRecord.profile`) ręcznie robić `JSON.stringify`/`JSON.parse`. To zgodne z uzasadnieniem "Dlaczego Json" z dokumentu źródłowego, tylko realizowane naturalnym typem Prisma zamiast stringa.

- **React Query jest w repo używane selektywnie, nie wszędzie.** Stan bitwy (`bestiarySlice`) i personalizacja (`personalizationSlice`) żyją w Reduksie, natomiast listy z operacjami CRUD + cache (np. `useAdminEntityManagement.ts`) używają `@tanstack/react-query` (`useQuery`/`useMutation` + `invalidateQueries`). Battle Presets to dokładnie ten drugi przypadek (lista presetów per klucz, z CRUD) — plan używa React Query zgodnie z dokumentem źródłowym, ale wzorowane na `useAdminEntityManagement.ts`, a **nie** na `usePersonalization.ts` (który celowo unika React Query na rzecz Reduksu, bo tam stan musi być natychmiast dostępny offline/optimistically).

- **Duplikaty postaci (`DuplicatedCharacter`) trzymają pełną, głęboko sklonowaną kopię `Character`.** Zapisanie tego wprost do presetu oznacza kopiowanie całej karty postaci (statystyki, ataki, obrony, itd.) do JSON-a presetu — dokument JSON rośnie i **czerstwieje** (zmiana oryginalnej postaci w bestiariuszu nie odświeży zapisanego duplikatu). Rekomendacja (patrz Etap 1): w presecie zapisywać tylko `originalCharacterId` + `duplicateNumber`, a pełny `DuplicatedCharacter` odtwarzać przy `Load` na podstawie **aktualnych** danych postaci pobranych z API (reużycie `createDuplicatedCharacter` z `BattleCombatants.ts`). To odejście od dosłownego zapisu stanu, ale zgodne z zasadą "single source of truth" już stosowaną w apce dla postaci.

---

## Docelowa architektura (zweryfikowana w kodzie)

Przepływ zapisu/wczytania presetu:

```
BattleTable.tsx (panel "Battle Presets")
  → useBattlePresets() [hooks/useBattlePresets.ts, React Query]
  → battlePresetsClient [infrastructure/clients/battlePresetsClient.ts, axios/baseClient]
  → POST/PUT/DELETE/GET /api/battle-presets(/[id])
  → battlePresetsRepository [persistence/battlePresets]
  → prisma.battlePreset.*
```

Nagłówek `x-api-key` (`API_KEY_HEADER`, `src/proxy.ts`) jest już automatycznie doklejany do każdego żądania przez `baseClient.ts` — nie trzeba nic dokładać po stronie klienta poza samym wywołaniem endpointu.

Autoryzacja:
- `POST`/`PUT`/`DELETE /api/battle-presets*` — walidowane globalnie przez `src/proxy.ts` (matcher `'/api/((?!search).*)'` już je obejmuje, nic nie trzeba zmieniać w proxy).
- `GET /api/battle-presets` i `GET /api/battle-presets/[id]` — proxy pomija `GET`, więc handler musi sam odczytać `x-api-key` i zweryfikować przynależność do `adminApiKeys`, dokładnie jak `getValidatedApiKey` w `src/app/api/personalization/route.ts`. Warto wydzielić tę funkcję do wspólnego miejsca (np. `src/lib/apiKeyValidation.ts`), bo dziś jest zduplikowana lokalnie w `route.ts` personalizacji — dodanie trzeciego miejsca z kopią tego samego kodu byłoby błędem, który ten plan celowo unika.

---

## Etap 1 — Model danych

**Plik:** `prisma/schema.prisma` — nowy model, spójny z konwencją repo (`ulid()`, nie `ObjectId`):

```prisma
model BattlePreset {
  id            String   @id @default(ulid()) @map("_id")
  name          String
  apiKeyHash    String

  configuration Json

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([apiKeyHash])
  @@map("battlePresets")
}
```

Bez `@@unique([apiKeyHash, name])` na start — dokument źródłowy nie wymaga unikalności nazw, a wymuszenie tego blokowałoby dopuszczalny scenariusz "Save As" z tą samą nazwą co inny preset. Do potwierdzenia jako otwarte pytanie (patrz na dole).

**Nowy katalog:** `src/domain/battlePresets/`

`BattleConfiguration.ts` — realny kształt stanu bitwy (patrz "Ustalenia wstępne"), nie przykład z dokumentu:

```ts
export type BattleConfiguration = {
  characterIds: string[]; // odpowiednik addedToBattle
  initiatives: Record<string, { initiative: number | null }>;
  externalParticipants: ExternalParticipant[]; // z BattleCombatants.ts, zapisywane w całości (brak zewnętrznego źródła prawdy)
  duplicatedCharacterRefs: { id: string; originalCharacterId: string; duplicateNumber: number }[]; // NIE pełny DuplicatedCharacter — patrz Ustalenia wstępne
};
```

`BattlePreset.ts`:

```ts
import { Entity } from '@/domain/Entity'; // { id: string; name: string }

export type BattlePreset = Entity & {
  configuration: BattleConfiguration;
  createdAt: Date;
  updatedAt: Date;
};
```

Uruchomić `npx prisma generate` i `npx prisma db push` (Mongo, brak migracji SQL) po zmianie schematu.

---

## Etap 2 — Persistence

**Nowy katalog:** `src/persistence/battlePresets/`

- `battlePresetMapping.ts` — mapowanie Prisma `BattlePreset` ↔ domenowy `BattlePreset` (odczyt/zapis `configuration` jako `Json`, bez ręcznego `JSON.parse`/`stringify`).
- `battlePresetsRepository.ts` — **nie** przez `createCommonRepository` (ten helper nie ma pojęcia o filtrowaniu po `apiKeyHash`, patrz `src/persistence/common/createCommonRepository.ts` — operuje tylko na gołym `id`). Własne funkcje:
  - `getBattlePresetsForApiKey(apiKeyHash: string): Promise<BattlePreset[]>` — `prisma.battlePreset.findMany({ where: { apiKeyHash } })`. **Filtrowanie wyłącznie po stronie zapytania do bazy** — zgodnie z wymogiem dokumentu źródłowego ("Nie filtrować po stronie klienta"), analogicznie do `characterVisibilityWhere`.
  - `getBattlePresetById(id: string, apiKeyHash: string): Promise<BattlePreset | null>` — `findUnique({ where: { id } })`, a następnie **sprawdzenie w pamięci**, że `record.apiKeyHash === apiKeyHash`, inaczej zwrócić `null` (Mongo/Prisma `findUnique` nie łączy się z dodatkowym `where` poza kluczem unikalnym — dokładnie ten sam problem i rozwiązanie co przy `searchEntityById` dla postaci, patrz `visible-only-to-api-keys-implementation-plan.md`, Etap 3).
  - `addBattlePreset(apiKeyHash: string, name: string, configuration: BattleConfiguration): Promise<string>` — przed insertem sprawdzić limit (patrz niżej) i rzucić kontrolowany błąd, jeśli przekroczony.
  - `updateBattlePreset(id: string, apiKeyHash: string, data: { name?: string; configuration?: BattleConfiguration }): Promise<boolean>` — musi zweryfikować własność (`apiKeyHash`) przed `update`, żeby klucz A nie mógł nadpisać presetu klucza B, znając tylko jego `id`.
  - `deleteBattlePreset(id: string, apiKeyHash: string): Promise<void>` — analogicznie, weryfikacja własności przed `delete`.

- `battlePresetErrors.ts` — `BattlePresetValidationError` (wzorem `characterErrors.ts`), używany m.in. dla limitu presetów.

**Limit presetów (Weryfikacja 3 z dokumentu):** rekomendacja dokumentu (100/klucz) jest sensowna i możliwa do wymuszenia tanio — `count` przed `create`. Stała `MAX_BATTLE_PRESETS_PER_API_KEY = 100` w `battlePresetsRepository.ts`.

---

## Etap 3 — Endpointy API

**Nowe pliki:**

- `src/app/api/battle-presets/route.ts` — `GET` (lista, wymaga ręcznej walidacji `x-api-key` jak w personalizacji, bo proxy pomija `GET`), `POST` (tworzenie; autoryzacja już zapewniona przez `proxy.ts`, ale i tak trzeba odczytać `x-api-key` z nagłówka, żeby wiedzieć, do kogo przypisać `apiKeyHash` — proxy tylko *waliduje*, nie przekazuje dalej wartości do handlera).
- `src/app/api/battle-presets/[id]/route.ts` — `GET` (pojedynczy, ręczna walidacja jak wyżej), `PUT` (aktualizacja), `DELETE`.

Każdy handler odczytuje `request.headers.get(API_KEY_HEADER)`, hashuje przez `hashApiKey`, i przekazuje do repozytorium. Brak nagłówka → `401`, klucz spoza `adminApiKeys` → `403` (te same kody co w `personalization/route.ts`, dla spójności API).

**Wspólny helper do wydzielenia:** `getValidatedApiKey` z `personalization/route.ts` powinien przenieść się do `src/lib/apiKeyValidation.ts` i być reużyty przez oba miejsca (personalizację i battle presets), zamiast kopiowania. To drobny refaktor przy okazji, ale ważny — trzecia kopia tej samej walidacji "na oko" byłaby sygnałem złej architektury.

---

## Etap 4 — Application (klient + hooki)

**Nowy plik:** `src/infrastructure/clients/battlePresetsClient.ts` (wzorem `personalizationClient.ts`, przez `baseClient`):

```ts
const battlePresetsClient = {
  list: () => client.get<BattlePresetSummary[]>('/battle-presets'),
  getById: (id: string) => client.get<BattlePreset>(`/battle-presets/${id}`),
  create: (name: string, configuration: BattleConfiguration) => client.post<BattlePreset>('/battle-presets', { name, configuration }),
  update: (id: string, data: { name?: string; configuration?: BattleConfiguration }) => client.put<BattlePreset>(`/battle-presets/${id}`, data),
  remove: (id: string) => client.delete(`/battle-presets/${id}`),
};
```

**Nowy katalog:** `src/application/battlePresets/`

- `hooks/useBattlePresets.ts` — React Query, wzorowane na `useAdminEntityManagement.ts`:
  - query key: `['battle-presets', apiKey]` (dokładnie jak w dokumencie źródłowym — klucz API musi być częścią klucza cache, inaczej zmiana klucza API nie odświeży listy — dokładnie problem opisany w `visible-only-to-api-keys-implementation-plan.md`, Etap 4),
  - `enabled: hasApiKey` (bez klucza nie ma czego pobierać — brak nagłówka = `401` z API),
  - mutacje `create`/`update`/`remove` z `onSuccess: () => queryClient.invalidateQueries({ queryKey: ['battle-presets'] })` (bez apiKeya w predykacie invalidacji — inwalidacja ma czyścić dla wszystkich kluczy, prościej niż filtrować, tak jak dokument sugeruje).
  - **Inwalidacja przy zmianie klucza:** `src/common/hooks/useApiKey.ts` już inwaliduje `['characters']` w `saveApiKey`/`removeApiKey` — dopisać tam też `['battle-presets']`, inaczej lista presetów nie odświeży się po zmianie API Key (Test 6 z dokumentu źródłowego).
- `components/BattlePresetsPanel.tsx` — panel z dokumentu (`[▼ nazwa]`, `Load`, `Save Current`, `Save As`, `Delete`), reużywalny.

**Śledzenie "aktualnie wczytanego presetu":** dokument wymaga rozróżnienia `Save Current` (nadpisuje) od `Save As` (tworzy nowy) — to wymaga stanu "który preset jest teraz załadowany". Rekomendacja: dodać `loadedPresetId: string | null` do `bestiarySlice` (persystowany w tym samym `sessionStorage` co reszta stanu bitwy, ustawiany na `null` przez istniejące `clearBattle`), a nie trzymać go lokalnie w komponencie — bo obecny stan bitwy już przetrwa odświeżenie strony przez `sessionStorage`, a "który to preset" powinno przetrwać tak samo, inaczej `Save Current` po odświeżeniu strony zgubi kontekst.

---

## Etap 5 — Integracja z widokiem bitwy

**Plik:** `src/application/bestiary/battle/BattleTable.tsx`

- Dołożyć `useApiKey()` (dziś nieużywane w tym pliku) i `<BattlePresetsPanel />` w toolbarze, obok istniejących przycisków resetu/inicjatywy.
- **Load:** `clearBattle()` → `addSelectedToBattle(configuration.characterIds)` → `setInitiative` dla każdego wpisu z `initiatives` → `addExternalParticipant` dla każdego z `externalParticipants` → dla każdego `duplicatedCharacterRefs` pobrać aktualną postać (`charactersClient.getByIds`) i odtworzyć przez `createDuplicatedCharacter` (patrz Ustalenia wstępne — świeże dane zamiast zamrożonej kopii) → ustawić `loadedPresetId`.
- **Save Current:** aktywne tylko gdy `loadedPresetId !== null`; buduje `BattleConfiguration` z aktualnego stanu Reduksa i woła `update`.
- **Save As:** dialog z polem nazwy (wzorem istniejących dialogów, np. `AddExternalParticipantDialog.tsx`), woła `create`, po sukcesie ustawia `loadedPresetId` na nowo utworzony preset.
- **Delete:** `AlertDialog` z potwierdzeniem (`Are you sure?` z dokumentu) — w repo jest już wzorzec potwierdzenia usunięcia w `personalization` (przyciski `destructive` + `title`/`aria-label`), użyć tego samego stylu.
- Panel **ukryty/wyłączony, gdy `!hasApiKey`**, z komunikatem analogicznym do `PersonalizationPage` ("Najpierw ustaw API key.") — Battle Presets bez klucza nie mają do czego się przypisać.

---

## Etap 6 — Zarządzanie presetami (Personalizacja / Settings)

Dokument źródłowy chce osobnego "Widoku zarządzania presetami" pod `Settings → Battle Presets`. W repo obowiązuje wzorzec podstrony per-funkcja (`src/app/personalization/tags/page.tsx` obok głównego `src/app/personalization/page.tsx`), więc:

**Nowy plik:** `src/app/personalization/battle-presets/page.tsx` — lista (`name`, `Edit`, `Delete`) reużywająca `useBattlePresets()` z Etapu 4. Edycja: zmiana nazwy + podgląd `configuration` (read-only, np. lista imion postaci rozwiązanych przez `getByIds`) + usunięcie. Link do tej podstrony dopisać w głównym `src/app/personalization/page.tsx` (obok istniejących sekcji, np. przyciskiem `Button asChild variant="outline"` jak przy linku do strony głównej).

---

## Etap 7 — Testy

Framework: Vitest (`npm run test`), konwencja `__tests__` kolokowane obok testowanego pliku. Próg pokrycia z `vitest.config.ts` (`lines/functions/statements 85%`, `branches 80%`) obejmuje też nowe pliki — nie są domyślnie wykluczone w `coverage.exclude`, więc trzeba je faktycznie pokryć, nie tylko dopisać testy "dla zasady".

### 7.1 Domena — `src/domain/battlePresets/__tests__/BattleConfiguration.test.ts`
Testy 1–4 z dokumentu jako testy czystych funkcji budujących/parsujących `BattleConfiguration` z aktualnego stanu Reduksa (jeśli taka funkcja pomocnicza powstanie, np. `toBattleConfiguration(bestiaryState)` / `fromBattleConfiguration(configuration)`).

### 7.2 Persistence — `src/persistence/battlePresets/__tests__/battlePresetsRepository.test.ts`
Mock `@/lib/prisma` (wzorem `charactersRepository.test.ts`):
- `getBattlePresetsForApiKey` woła `findMany` z `where: { apiKeyHash }` — nigdy z surowym kluczem.
- `getBattlePresetById` zwraca `null`, gdy `apiKeyHash` rekordu różni się od żądającego (Test 5 z dokumentu, "API Key A nie widzi presetów API Key B").
- `updateBattlePreset`/`deleteBattlePreset` odmawiają działania (rzucają błąd lub zwracają `false`), gdy `apiKeyHash` się nie zgadza — nie tylko przy odczycie, ale też przy zapisie/usunięciu (dokument wspomina tylko o odczycie, ale ten sam problem dotyczy edycji i usuwania cudzego presetu po znanym `id`).
- `addBattlePreset` rzuca `BattlePresetValidationError`, gdy `count >= 100` dla danego `apiKeyHash` (Weryfikacja 3).

### 7.3 API routes — `src/app/api/battle-presets/route.test.ts`, `src/app/api/battle-presets/[id]/route.test.ts`
Wzorem `personalization/route.test.ts`:
- brak nagłówka `x-api-key` → `401`; nagłówek spoza `adminApiKeys` → `403`.
- `GET` zwraca tylko presety dla hashu bieżącego klucza.
- `POST`/`PUT`/`DELETE` — happy path + próba edycji/usunięcia cudzego `id` → `404`/`403` (do ustalenia który kod, patrz otwarte pytania).

### 7.4 Application/hooki — `src/application/battlePresets/hooks/__tests__/useBattlePresets.test.ts`
- `queryKey` zawiera `apiKey` (Test 6 — zmiana klucza odświeża listę).
- mutacje wołają `invalidateQueries({ queryKey: ['battle-presets'] })` po sukcesie (Testy 1/3/4 z dokumentu: "Preset zapisany" / "Zmiany zapisane" / "Preset usunięty" jako efekt uboczny widoczny w cache, nie tylko network call).

### 7.5 Integracja z widokiem bitwy — `src/application/bestiary/battle/__tests__/BattleTable.test.tsx` (rozszerzenie istniejących testów, jeśli są, albo nowy)
- `Load` czyści `addedToBattle`/`initiatives`/`externalParticipants`/`duplicatedCharacters` i odtwarza je z presetu (Test 2, "Bitwa odtworzona").
- `Save Current` wysyła `PUT` z bieżącą konfiguracją tylko gdy `loadedPresetId` jest ustawiony.
- `Save As` tworzy preset i przełącza `loadedPresetId` na nowy.

### 7.6 `useApiKey.test.tsx` (istniejący plik) — dopisać
- `saveApiKey`/`removeApiKey` wywołują też `invalidateQueries({ queryKey: ['battle-presets'] })`, nie tylko `['characters']`.

---

## Etap 8 — Podwójna weryfikacja (obowiązkowa przed uznaniem zadania za zakończone)

1. `npm run test` — cała pula zielona, ze szczególną uwagą na `src/proxy.test.ts` (nowe ścieżki `/api/battle-presets*` nie mogą ominąć wymogu klucza dla zapisów) i nowe testy z Etapu 7.
2. `npx tsc --noEmit` (lub `npm run build`) — typy `BattleConfiguration`/`BattlePreset` zgodne wszędzie (domena, mapping, klient, hooki, komponenty).
3. `npm run lint`.
4. `npm run test:coverage` — sprawdzić, że nowe pliki nie zaniżają progu 85%/85%/80%/85% z `vitest.config.ts` (repozytorium go dziś egzekwuje globalnie, nie per-plik).
5. Ręczny smoke test lokalnie (`prisma studio` lub bezpośrednie żądania):
   - z kluczem `A`: dodać postacie do walki, ustawić inicjatywy, dodać uczestnika zewnętrznego i duplikat → `Save As` → potwierdzić rekord w Mongo (`apiKeyHash` = hash klucza `A`, nie jawny klucz).
   - `Load` na tym samym presecie po `clearBattle()` ręcznym (np. odświeżenie + wyczyszczenie sessionStorage) → potwierdzić pełne odtworzenie, w tym że duplikat postaci ma **aktualne** dane (zmienić coś na oryginalnej postaci między zapisem a wczytaniem i sprawdzić, że duplikat to odzwierciedla).
   - zmienić API Key na `B` w `ApiKeySettings` → lista presetów w panelu i w `/personalization/battle-presets` **musi się odświeżyć i nie może pokazać presetu klucza `A`** (Test 5 i 6 z dokumentu).
   - spróbować `PUT`/`DELETE` na `id` presetu klucza `A`, wysyłając nagłówek `x-api-key: B` (np. przez `restClient.http` albo curl) → oczekiwać odmowy, nie cichego sukcesu.
6. Druga para oczu: subagent code-reviewer / skill `review` po zaimplementowaniu, z naciskiem na: czy filtrowanie po `apiKeyHash` faktycznie dzieje się w zapytaniu do bazy (nie post-filtrowanie w JS), czy edycja/usunięcie cudzego presetu jest zablokowana (nie tylko odczyt), czy `loadedPresetId` poprawnie się czyści przy `clearBattle`/zmianie API Key, żeby `Save Current` nie nadpisał cudzego lub nieistniejącego presetu.

---

## Kolejność wdrożenia (checklist)

1. Etap 1 — schemat Prisma (`BattlePreset`) + typy domenowe + `prisma generate`/`db push`.
2. Etap 2 — `battlePresetsRepository.ts`, `battlePresetMapping.ts`, `battlePresetErrors.ts`, limit 100/klucz.
3. Etap 3 — routy API + wydzielenie `getValidatedApiKey` do `src/lib/apiKeyValidation.ts` (reużyte przez personalizację i battle presets).
4. Etap 4 — `battlePresetsClient.ts`, `useBattlePresets.ts`, `BattlePresetsPanel.tsx`, dopisanie inwalidacji w `useApiKey.ts`.
5. Etap 5 — integracja z `BattleTable.tsx` (Load/Save Current/Save As/Delete + `loadedPresetId` w `bestiarySlice`).
6. Etap 6 — `/personalization/battle-presets` (widok zarządzania) + link z głównej strony personalizacji.
7. Etap 7 — testy per warstwa (domena, persistence, API, hooki, widok bitwy, `useApiKey`).
8. Etap 8 — pełna weryfikacja: testy, typecheck, lint, coverage, smoke test ręczny (w tym próba dostępu do cudzego presetu), code review.

---

## Otwarte pytania do potwierdzenia przed implementacją

1. **Unikalność nazwy presetu w obrębie jednego klucza API** — dokument nie wymaga, ale UX z listą rozwijaną (`[▼ Raid Test Setup]`) sugeruje, że dwa presety o tej samej nazwie byłyby mylące. Plan zakłada brak wymuszenia (dopuszczamy duplikaty nazw), do potwierdzenia.
2. **Kod błędu przy próbie edycji/usunięcia cudzego presetu przez znany `id`** — `403 Forbidden` (jak przy błędnym API Key ogólnie) czy `404 Not Found` (żeby nie ujawniać, że dany `id` w ogóle istnieje, ale należy do kogoś innego)? Rekomendacja: `404`, bo `403` potwierdziłby istnienie zasobu i mógłby posłużyć do enumeracji cudzych presetów po samym `id`.
3. **Duplikaty postaci w presecie** — plan (Ustalenia wstępne) rekomenduje zapisywanie tylko referencji (`originalCharacterId` + `duplicateNumber`) i odtwarzanie świeżych danych przy `Load`, zamiast zamrożonej kopii `Character`. To odejście od dosłownego "pełnego odtworzenia" z dokumentu źródłowego — jeśli użytkownik oczekuje raczej migawki historycznej (np. do testów regresji na starej wersji postaci), trzeba by jednak przechowywać pełną kopię. Wymaga decyzji przed Etapem 1, bo zmienia kształt `BattleConfiguration`.
