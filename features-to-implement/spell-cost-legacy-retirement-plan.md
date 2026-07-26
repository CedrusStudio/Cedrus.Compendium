# Plan: wycofanie legacy pola `Spell.cost`

> **Status (2026-07-24):** Krok 1 (backfill danych `--apply`) — wykonany przez Marka. Kroki 3–4, 7 (zmiany w kodzie), 8 (weryfikacja logiki domeny) — wykonane. Pola strukturalne zostawione jako **nullable** (bezpieczniejszy wariant dla Mongo, patrz Krok 2). **Pozostało do wykonania na Windowsie:** `prisma generate` + `prisma db push`, pełny `tsc --noEmit` + `npm test`, oraz opcjonalny `$unset cost` (Krok 6). Sandbox nie może uruchomić prisma/tsc/vitest (binaria), dlatego te kroki są po Twojej stronie.

## Wniosek z analizy

Podejrzenie jest **słuszne** — `cost Int` w modelu `Spell` to pole legacy, w pełni zastępowalne przez nowy zestaw pól strukturalnych (`costBase`, `costScalingMode`, `costScalingValue`, `costRounding`).

Dowody z kodu:

- **Zapis (`toSpellCostPersistence`, `SpellCost.ts:93-104`)** zawsze ustawia `cost = normalizedCost.baseCost`. Przy każdym zapisie `cost` jest więc duplikatem `costBase` — nie niesie żadnej dodatkowej informacji.
- **Odczyt (`fromSpellCostPersistence`, `SpellCost.ts:83-91`)** czyta `baseCost: rawCost.costBase ?? rawCost.cost`. Legacy `cost` służy wyłącznie jako fallback dla rekordów, które nie zostały jeszcze zbackfillowane do pól strukturalnych.
- **Warstwa domenowa** (`Power.ts:63`) ma już `Spell.cost: SpellCost` (obiekt strukturalny), a nie `number`. Cała aplikacja (PowerCard, EditPowerCard, SpellView, CombatantSnapshot, SpellEditableFields) operuje na obiekcie `SpellCost`, nie na surowym `Int`.
- Surowe `cost: Int` z persystencji pojawia się już **tylko** w: `schema.prisma`, `spellMappings.ts`, `SpellCost.ts` oraz skrypcie `backfill-spell-costs.ts`.

Wąskie gardło: `cost Int` jest polem **wymaganym (non-null)**, a nowe pola są opcjonalne (`Int?` / `String?`). Dlatego nie można go po prostu usunąć, dopóki nie zagwarantujemy, że każdy rekord ma komplet pól strukturalnych.

> Uwaga o bazie: datasource to **MongoDB** (`provider = "mongodb"`). Nie ma migracji SQL — schemat wdraża się przez `prisma db push`. Usunięcie pola ze schematu **nie usuwa** danych z dokumentów Mongo; Prisma po prostu przestaje je czytać/zapisywać. Faktyczne skasowanie wartości `cost` z dokumentów (jeśli chcemy) wymaga osobnego `$unset` — patrz krok 6 (opcjonalny).

---

## ⚠️ Uwaga: NIE mylić z `PowerOffense.cost`

W schemacie istnieje **drugie, niezależne** pole `cost Int` — w typie `PowerOffense` (`schema.prisma:571`, domena `Power.ts:32`, walidacja `powerSchema.ts:34`). To osobny koncept (koszt ofensywy mocy), **wciąż aktywnie używany** i **poza zakresem** tej migracji. Podczas edycji/`find-replace` na `cost` uważaj, by go nie ruszyć. Zakres wycofania dotyczy wyłącznie pola `cost` w modelu `Spell` (`schema.prisma:222`).

## Zakres: co jest, a co NIE jest do zmiany

- **Granica API/DTO jest już czysta.** `spellSchema` (`powerSchema.ts:13-25`) waliduje `cost` jako obiekt strukturalny (`baseCost`/`scalingMode`/`scalingValue`/`rounding`), a nie surowy `Int`. Endpointy `/api/spells` i `/api/spells/[id]` oraz `spellsClient.ts` operują na `SpellDto` i idą przez `toSpellPersistenceModel` — **nie wymagają zmian**.
- Zmiany kodu ograniczają się do: `SpellCost.ts`, `spellMappings.ts` (weryfikacja typów), `backfill-spell-costs.ts`, testów `SpellCost.test.ts` oraz `schema.prisma`.

## Kolejność działań

### Krok 1 — Backfill wszystkich rekordów (przygotowanie danych)
Uruchom istniejący skrypt, żeby każdy spell miał wypełnione pola strukturalne.

```
# dry run — pokazuje, ile rekordów wymaga uzupełnienia
node --experimental-strip-types scripts/backfill-spell-costs.ts

# zapis
node --experimental-strip-types scripts/backfill-spell-costs.ts --apply
```

Cel: `Found 0 spells requiring spell-cost backfill.` na czysto. Dopiero wtedy fallback `?? cost` jest praktycznie martwy.

(Wg pamięci projektu `tsx` jest zablokowany — użyj `node --experimental-strip-types`.)

### Krok 2 — Uczynienie pól strukturalnych wymaganymi w schemacie
W `prisma/schema.prisma` (model `Spell`) zmień opcjonalne pola na wymagane z sensownymi defaultami (odpowiadającymi `defaultSpellCost`):

```prisma
costBase         Int      @default(20)
costScalingMode  String   @default("fixed")
costScalingValue Int      @default(1)
costRounding     String   @default("floor")
```

Nadal **zostaw** `cost Int` na tym etapie — to krok pośredni, żeby odczyt był bezpieczny nawet dla ewentualnych dokumentów pominiętych w backfillu. Wdróż: `prisma db push` + `prisma generate`.

> Alternatywa (bezpieczniejsza dla Mongo): zostaw pola jako `Int?/String?` i polegaj na `normalizeSpellCost`, które i tak podstawia defaulty przy `null`. Wtedy pomiń zmianę na `@default`. Wybór zależy od tego, czy chcesz twardych gwarancji na poziomie schematu, czy defensywnego odczytu w warstwie domeny.

### Krok 3 — Odcięcie legacy fallbacku w kodzie domeny
W `src/domain/characters/combat/SpellCost.ts`:

1. `SpellCostPersistenceFields` — usuń pole `cost` (lub oznacz jako deprecated). Analogicznie `NormalizedSpellCostPersistenceFields`.
2. `fromSpellCostPersistence` — zmień `baseCost: rawCost.costBase ?? rawCost.cost` na `baseCost: rawCost.costBase`.
3. `toSpellCostPersistence` — usuń z wyniku pole `cost` (przestań zapisywać legacy).

### Krok 4 — Aktualizacja mapowania persystencji
`src/persistence/mappings/spellMappings.ts` nie wymaga zmian logiki (deleguje do helperów), ale zweryfikuj typy po zmianie sygnatur — `toSpellPersistenceModel` nie powinno już emitować `cost`.

### Krok 5 — Usunięcie pola ze schematu i regeneracja
W `prisma/schema.prisma` usuń linię `cost Int` z modelu `Spell`, następnie:

```
prisma db push
prisma generate
```

Po `generate` TypeScript wskaże wszystkie miejsca, które jeszcze odwołują się do surowego `cost` z persystencji — napraw je (spodziewane: `backfill-spell-costs.ts`).

### Krok 6 (opcjonalny) — Fizyczne skasowanie `cost` z dokumentów Mongo
`db push` nie usuwa istniejących wartości. Jeśli chcesz wyczyścić dokumenty:

```js
db.spells.updateMany({}, { $unset: { cost: "" } })
```

Zrób to dopiero po potwierdzeniu, że aplikacja działa bez `cost` (najlepiej po jednym cyklu na produkcji).

### Krok 7 — Retire / aktualizacja skryptu backfill
`scripts/backfill-spell-costs.ts` po usunięciu `cost` przestanie się kompilować (`select.cost`, `toSpellCostPersistence(spell.cost)`). Opcje:
- usunąć skrypt (zadanie jednorazowe, już wykonane), albo
- przepisać go tak, by normalizował na podstawie `costBase` zamiast `cost`.
Rekomendacja: usunąć po zakończeniu migracji.

### Krok 8 — Testy i weryfikacja
- Zaktualizuj `src/domain/characters/combat/__tests__/SpellCost.test.ts` (asercje na `toSpellCostPersistence` nie powinny już zawierać `cost`).
- Uruchom pełny zestaw: `npm run test` (Vitest).
- Sanity check w UI: SpellView, PowerCard, EditPowerCard — formatowanie i skalowanie kosztu bez regresji.
- Build: `npm run build` / `tsc --noEmit`.

---

## Checklista

- [ ] Backfill `--apply` → 0 rekordów do uzupełnienia
- [ ] Pola strukturalne wymagane/z defaultami w schemacie (lub świadoma decyzja o pozostawieniu `?`)
- [ ] `fromSpellCostPersistence` bez fallbacku `?? cost`
- [ ] `toSpellCostPersistence` nie zapisuje `cost`
- [ ] `SpellCostPersistenceFields` bez `cost`
- [ ] `cost Int` usunięte ze schematu + `db push` + `generate`
- [ ] `spellMappings.ts` kompiluje się bez `cost`
- [ ] `backfill-spell-costs.ts` usunięty/przepisany
- [ ] Testy SpellCost zaktualizowane, `npm run test` zielony
- [ ] (opcjonalnie) `$unset cost` na kolekcji `spells`

## Ryzyka

- **Rekordy pominięte w backfillu** — jeśli po usunięciu fallbacku istnieje dokument bez `costBase`, `normalizeSpellCost` podstawi `defaultSpellCost` (baseCost 20, fixed). To bezpieczne, ale może cicho zmienić koszt takiego rekordu. Dlatego Krok 1 (weryfikacja „0 rekordów") jest krytyczny.
- **Kolejność wdrożeń** — kod przestający zapisywać `cost` (Krok 3) można wdrożyć przed usunięciem pola ze schematu (Krok 5); odwrotna kolejność zepsułaby build. Trzymaj się kolejności kroków.
