# Plan: Edytor efektów manewrów w aplikacji (kompendium)

Wyczerpujący plan implementacji. Cel: przenieść autorstwo efektów z osobnego narzędzia HTML (`tools/maneuver-effect-editor.html` + CSV + skrypt importu) **do samej aplikacji** — edycja manewru w kompendium zapisuje efekty prosto do bazy przez istniejące API, bez ręcznego CSV/importu. Plan osadzony w realnych wzorcach repo.

---

## 1. Stan wyjścia (co już mamy)

- **Model efektów kompletny**: `Effect` (damage, heal, stat, roll, contested, save, when, control, status, buff, debuff, push, pull, resource, chance, custom) + `effectSchema` (Zod) + `describeManeuver` + walidator + `flattenEffects`.
- **Dane w bazie**: `Maneuver` ma `effects Json?`, `simulatable Boolean?`, `unsupportedReason String?` (po `prisma db push`).
- **DTO**: `maneuverSchema` już ma opcjonalne `effects` (walidowane `effectSchema`), `simulatable`, `unsupportedReason` — więc round-trip przez API **już przepuszcza te pola**.
- **API/persystencja**: `PUT /api/maneuvers/[id]` → `createCommonRepository(prisma.maneuver).update(dto)` — zapisuje cały DTO, w tym `effects`. Zero nowego backendu.
- **Formularz edycji**: `ManeuverView` → `EditFormForSheet<ManeuverDto>` (react-hook-form + `typedZodResolver(maneuverSchema)`) → `EditSheet` z `PerkEditableFields` + `CastablePerkEditableFields`. **Sekcji „Efekty" brak — to jedyne, co dokładamy w UI.**
- **Wzorce w repo**: `useFieldArray` używany w `EditCharacterBuffs`, `PowerSpecificationEditableFields`; pola przez `InputFormField`/`AreaInputFormField` (`path` = `FieldPath`), `Select` z `@/ui/select`, `Form`/`FormField`/`useFormContext` z `@/ui/form`.

**Wniosek:** to zadanie jest w ~90% UI. Backend, schemat i model są gotowe.

---

## 2. Zakres v1 (i świadome granice)

**W zakresie:** graficzny edytor wszystkich typów efektów w arkuszu edycji manewru, z zagnieżdżeniem (contested/save/when/chance), builderem pul, edytorem warunku, kontrolką `simulatable` + `unsupportedReason`, podglądem opisu na żywo (`describeManeuver`) i inline-walidacją (`effectSchema` + `validateManeuvers`).

**Poza zakresem v1 (osobno/później):**
- Masowe operacje („zatwierdź wszystkie high") i import auto-propozycji — zostają w ścieżce skryptowej (`classify` → `import`), bo dotyczą partii, nie pojedynczego manewru. W apce edytuje się jeden manewr naraz.
- Dashboard „manewry wymagające efektów" (lista/filtr na poziomie kompendium) — miły dodatek, ale osobny (§9).
- `buff`/`debuff` po `profileId`: w kompendium manewr nie jest przypięty do postaci, więc nie ma listy profili do wyboru. W apce promujemy **inline `stat`** (bez profilu); `buff`/`debuff` po id zostaje jako „zaawansowane" (pole tekstowe id) — patrz §7.

---

## 3. Architektura komponentów

Nowy katalog: `src/application/combat-lab/effects-editor/`.

- **`ManeuverEffectsEditableFields.tsx`** — sekcja wstawiana do `EditSheet` obok `PerkEditableFields`. `useFieldArray({ name: "effects" })`: lista `EffectCard`, przycisk „+ Dodaj efekt", oraz kontrolki `simulatable` (segmentowany select: nieoceniony / symulowalny / niesymulowalny) i `unsupportedReason` (textarea, widoczna gdy niesymulowalny). Na dole: podgląd opisu (`describeManeuver`) i panel walidacji.
- **`EffectCard.tsx`** — jeden efekt: `Select` typu (opcje z meta) + delegacja do ciała zależnego od typu (rejestr `type → komponent`). Zmiana typu resetuje pod-obiekt do domyślnego (jak w narzędziu HTML) przez `update(index, defaultEffect(type))`.
- **Ciała proste** (jedno na typ, płaskie pola przez `InputFormField`/`Select`): `DamageEffectFields`, `HealEffectFields`, `StatEffectFields`, `RollEffectFields`, `ControlEffectFields`, `StatusEffectFields`, `MoveEffectFields` (push/pull), `ResourceEffectFields`, `BuffRefEffectFields` (zaawansowane).
- **Ciała złożone (rekurencja)**: `ContestedEffectFields`, `SaveEffectFields`, `WhenEffectFields`, `ChanceEffectFields`, `CustomEffectFields` (raw JSON textarea + walidacja).
- **`NestedEffectsField.tsx`** — rekurencyjny edytor listy efektów pod ścieżką (`effects.0.onWin`, `effects.1.then`, …). Reużywa `EffectCard`. To on daje zagnieżdżanie contested.onWin / save.onFail / when.then / chance.then. Ograniczenie głębokości (np. nie oferować `contested`/`save`/`when` w zagnieżdżeniu > 2, żeby uniknąć UI-nieskończoności).
- **`TestSideFields.tsx`** — builder puli (dla contested/save): `useFieldArray` na `pool` (termy sumowane), w każdym termie `useFieldArray` na `anyOf` (alternatywy), `SkillSelect` (atrybut/charakterystyka po PL), pola `modifier`/`dieGradeDelta`/`rollMod`.
- **`SkillSelect.tsx`** — select statów (15 pozycji, wartość `group:key`, etykieta PL) — wspólny.
- **`ConditionField.tsx`** — edytor warunku dla `when`: select rodzaju + pole zależne (rodzaj ataku / status).

Wszystkie pola operują na `path` w formularzu (RHF `useFormContext`), więc walidacja `typedZodResolver(maneuverSchema)` obejmuje efekty automatycznie.

---

## 4. Wspólne metadane (jedno źródło prawdy)

Nowy moduł **`src/application/combat-lab/effects-editor/effectFieldsMeta.ts`**:
- lista typów efektów + etykiety PL (mirror `EFFECT_TYPES` z narzędzia),
- enumy + etykiety PL: `DAMAGE_TYPES`, `STATUS_IDS`+labels, `CONTROL_KINDS`+labels, `RESOURCE_KINDS`+labels, `SKILLS` (grupa/klucz/PL), `ATTACK_KINDS`, `COND_KINDS`,
- `defaultEffect(type)` — domyślny obiekt dla każdego typu (jak `defaultContested`/`defaultSave`/`defaultWhen` w narzędziu).

Etykiety statusów/kontroli/zasobów **reużyć z `@/domain/combat-lab/i18n/labels`** (już istnieją: `statusLabelsPl`, `controlNounsPl`, `resourceLabelsPl`, `damageTypeLabelsPl`), żeby nie dublować słowników. `SKILLS` PL wziąć z `@/common/translations`. To eliminuje rozjazd nazw.

> Uwaga: narzędzie HTML pozostaje osobną kopią (nie importuje TS). Po dostarczeniu edytora w apce narzędzie można wygasić (lub zostawić jako offline-fallback). W planie zakładamy, że apka staje się głównym miejscem autorstwa.

---

## 5. Wpięcie w arkusz edycji

W `ManeuverView` → `renderSheetContent`:

```
<EditSheet …>
  <PerkEditableFields entityType="maneuvers" />
  <CastablePerkEditableFields />
  <ManeuverEffectsEditableFields />   // NOWE
</EditSheet>
```

`defaultValues={maneuver}` już niesie `effects`/`simulatable`/`unsupportedReason` (mapowane z bazy przez `toCastablePerk`). Submit idzie istniejącym `client.update` → API → prisma. **Zero zmian w API i persystencji.** Jedno do sprawdzenia: czy `maneuver` z listy/detalu niesie `effects` (mapping `toCastablePerk` je czyta — tak). Jeśli `undefined`, `useFieldArray` startuje z pustą listą.

---

## 6. Podgląd i walidacja na żywo

- **Opis**: `useWatch({ name: "effects" })` → `describeManeuver(toManeuverDefinition({ ...watchedManeuver }))` w bloku podglądu (jak zielona ramka w narzędziu). Debounce niepotrzebny przy rozsądnej liczbie efektów; w razie czego `useMemo`.
- **Walidacja inline**: `effectSchema.safeParse` per efekt + `validateManeuvers([toManeuverDefinition(values)])` dla trójstanu (zmapowany / do zmapowania / niesymulowalny) i ostrzeżeń (zerowy czas trwania, puste `chance/onWin`, itd.). Pokazać pod listą, tak jak `RulesValidatorPanel`.
- Twardą walidację i tak wymusza `typedZodResolver(maneuverSchema)` przy submit — inline to tylko szybki feedback.

---

## 7. `simulatable` / `unsupportedReason` i profile buffów

- **simulatable**: 3-stanowy `Select` (nieoceniony=`undefined`/`null`, symulowalny=`true`, niesymulowalny=`false`). Przy `false` pokazać `AreaInputFormField` na `unsupportedReason`. Zapisywane wprost do DTO.
- **buff/debuff po profileId**: w kompendium brak kontekstu postaci → brak listy profili. v1: `stat` (inline) jest domyślną drogą dla wzmocnień/obrony; `buff`/`debuff` zostają jako „zaawansowane" z ręcznym polem `profileId` (tekst) i notką „wymaga istniejącego profilu na postaci". (Alternatywa na później: globalna biblioteka profili — poza zakresem.)

---

## 8. Etapy (przyrostowo, każdy zamykalny)

1. **Etap 0 — szkielet + typy proste.** `effectFieldsMeta.ts`; `ManeuverEffectsEditableFields` z `useFieldArray`, add/remove, `Select` typu, reset przy zmianie typu; ciała: damage/heal/stat/roll/control/status/push-pull/resource; kontrolki `simulatable`/`unsupportedReason`; podgląd opisu; wpięcie do `EditSheet`. **Pokrywa większość (T1 + stat + roll).**
2. **Etap 1 — rekurencja.** `NestedEffectsField`; `chance` i `when` (+ `ConditionField`). Inline-walidacja/trójstan.
3. **Etap 2 — pule.** `ContestedEffectFields`, `SaveEffectFields`, `TestSideFields`, `SkillSelect`.
4. **Etap 3 — dopięcie.** `CustomEffectFields` (raw JSON), `BuffRefEffectFields` (zaawansowane), dopieszczenie UX (kolejność, kopiuj/wklej efekt, walka o czytelność zagnieżdżeń), testy komponentów.
5. **Etap 4 (opcjonalny) — kompendium.** Filtr/wskaźnik „manewry wymagające efektów" na liście manewrów; ewentualny mini-dashboard pokrycia (reużyć logikę `maneuver-coverage`).

---

## 9. Pliki (dodać / zmienić)

Dodać (`src/application/combat-lab/effects-editor/`): `effectFieldsMeta.ts`, `ManeuverEffectsEditableFields.tsx`, `EffectCard.tsx`, `NestedEffectsField.tsx`, `TestSideFields.tsx`, `SkillSelect.tsx`, `ConditionField.tsx`, oraz ciała typów (`DamageEffectFields.tsx` … `CustomEffectFields.tsx`) — lub zgrupowane w mniejszej liczbie plików.
Zmienić: `src/application/compendium/maneuvers/ManeuverView.tsx` (dodać sekcję do `EditSheet`). Ewentualnie `maneuverSchema` — tylko jeśli okaże się, że trzeba dorównać typ `effects` do inferowanego DTO (dziś jest `z.array(effectSchema).optional()` — powinno wystarczyć).
Testy: `__tests__/ManeuverEffectsEditableFields.test.tsx` (add/remove, zmiana typu, zagnieżdżenie, submit z mockiem `client.update`, błąd walidacji).

---

## 10. Ryzyka i mitygacje

- **Zagnieżdżone `useFieldArray` (pule contested)** bywają upierdliwe (dynamiczne ścieżki, re-render). Mitygacja: mały, kontrolowany podkomponent z własnym `useFieldArray` na każdym poziomie (pool → term → anyOf), stabilne `key` z `field.id`.
- **Zmiana typu efektu** musi zresetować pod-obiekt (inaczej zostają pola z poprzedniego typu, które zepsują dyskryminowaną unię Zod). Mitygacja: `update(index, defaultEffect(nowyTyp))` — jak w narzędziu.
- **Rozjazd nazw/enumów** między apką a narzędziem/silnikiem. Mitygacja: `effectFieldsMeta.ts` importuje etykiety z `i18n/labels` i `@/common/translations` (jedno źródło).
- **Wydajność podglądu** przy każdym keystroke. Mitygacja: `useMemo`/`useWatch` na `effects`, opis liczony lokalnie (czysta funkcja).
- **`buff`/`debuff` bez kontekstu postaci** — świadomie zdegradowane do „zaawansowane" (§7); nie blokuje v1.
- **Duplikacja z narzędziem HTML** — zaakceptowana na czas przejścia; docelowo apka wypiera narzędzie.

---

## 11. Kryteria ukończenia v1

- Można w kompendium otworzyć manewr, dodać/edytować/usunąć efekty każdego typu (w tym contested/save/when z zagnieżdżeniem), ustawić `simulatable`/powód, zobaczyć podgląd opisu i ostrzeżenia, zapisać — i zmiana jest w bazie oraz widoczna w symulacji (bez CSV/importu).
- `typedZodResolver(maneuverSchema)` blokuje zapis niepoprawnych efektów; inline-walidacja daje szybki feedback.
- Testy komponentu przechodzą; typecheck czysty.
- Ścieżka skryptowa (classify/import/coverage) nadal działa równolegle do bootstrapu partii.
