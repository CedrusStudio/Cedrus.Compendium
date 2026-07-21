# Plan implementacji: Import elementów z innej postaci

Dokument techniczny realizujący wymagania z `features-to-implement/based-on-import-plan.md`, oparty o analizę aktualnego kodu w repozytorium (stan na 2026-07-19).

---

## 1. Kluczowe ustalenie architektoniczne

Manewry, atuty, postawy, stany i zaklęcia **nie są kopiami należącymi do postaci** — to współdzielone encje biblioteki (tabele Prisma `Maneuver`, `Perk`, `Stance`/`State` (`Mode`), `Spell`), do których postać odnosi się przez tablice ID (`maneuversIds`, `perksIds` itd. — patrz `src/persistence/characters/charactersRepository.ts`). Ekwipunek działa identycznie (`Weapon`, `Armor`, `Shield`, `InventoryItem`, `Mount`).

**Wniosek:** "import z innej postaci" to technicznie ten sam mechanizm co już istniejący "import z biblioteki" (`ImportItemsSheet`) — różni się tylko **źródłem listy elementów** (elementy konkretnej postaci zamiast wyników wyszukiwania w całej bibliotece). Zapis do bazy odbywa się przez te same, już istniejące endpointy (`PUT /characters/{id}/combat`, `/equipment`, `/details`), które już potrafią linkować istniejące encje biblioteki do postaci (`fetchExistingEntityIds` w `charactersRepository.ts`).

**Skutek:** nie są potrzebne żadne nowe endpointy backendowe do "kopiowania" elementów. Pobranie pełnych danych postaci źródłowej już istnieje (`POST /api/search/[id]` przez `searchClient.searchById(id, characterQueryById)`, patrz `src/application/characters/add/useBaseCharacter.ts` i `useGetCharacterById.ts`), a zapis następuje dopiero przy standardowym "Zapisz" formularza — dokładnie tak, jak dziś działa import z biblioteki (dodanie do draftu formularza, nie natychmiastowy zapis).

Wymagania z sekcji "Backend" dokumentu źródłowego są więc już spełnione przez istniejącą infrastrukturę; jedyna praca backendowa to ewentualne rozszerzenie o wyszukiwanie serwerowe (patrz sekcja 8, opcjonalne).

---

## 2. Co już istnieje i zostanie ponownie wykorzystane

| Element | Plik | Rola w nowej funkcji |
|---|---|---|
| `ImportItemsSheet<TItem>` | `src/common/components/import/ImportItemSheet.tsx` | Wzorzec UI (sheet, licznik, zaznacz/odznacz wszystko, przycisk importu) — nowy komponent będzie go strukturalnie odzwierciedlał |
| `SelectableItemWrapper` | `src/common/components/import/SelectableItemWrapper.tsx` | Bez zmian — obsługuje już stany `available/selected/owned/removed`, czyli dokładnie logikę duplikatów wymaganą w specyfikacji |
| `useDraftRemovableItems<TItem>` | `src/application/characters/edit/hooks/useDraftRemovableItems.ts` | Bez zmian — mechanizm dodawania do draftu formularza + oznaczania „zaimportowane”/„usunięte do przywrócenia” |
| `useWatchedFormArray` | `src/infrastructure/hooks/useWatchedFormArray.ts` | Bez zmian |
| `SelectBaseCharacterDialog` + `useSearchCharactersSummary` | `src/application/characters/add/` | Wzorzec „wybierz postać z listy” (wyszukiwarka, filtr tagów, siatka kart) — zostanie wydzielony do wspólnego komponentu (sekcja 4.1) |
| `useBaseCharacter` / `toCharacter` | `src/application/characters/add/useBaseCharacter.ts`, `src/persistence/mappings/characterMapping.ts` | Pobranie pełnej postaci źródłowej i zmapowanie jej do domenowego `Character` (już używane w kliencie, patrz `useGetCharacterById.ts`) |
| `toast` (sonner) | używane już w `src/common/global/onSaveCallbacks.tsx` | Komunikat podsumowujący import |

---

## 3. Nowe komponenty i hooki do zbudowania

### 3.1 `useCharacterItemsSource(characterId)`
Nowy hook w `src/application/characters/import/useCharacterItemsSource.ts`.

Cienka nakładka na `useBaseCharacter` (parametryzowany po `characterId`, `enabled: !!characterId`), która dodatkowo mapuje wynik przez `toCharacter()`, zwracając pełny domenowy `Character` (z gotowymi `maneuvers`, `perks`, `stances`, `states`, `powers[].spells`, `equipment.{weapons,armors,shields,inventory,mounts}`). Cache przez `@tanstack/react-query`, klucz analogiczny do `createCharacterByIdKey`.

### 3.2 `CharacterPickerGrid` (refaktor)
Wydzielenie z `SelectBaseCharacterDialog.tsx` części odpowiedzialnej za wyszukiwarkę + filtr tagów + siatkę kart postaci (`ListHeader`, `useSearchCharactersSummary`, `CharacterSelectCard`) do współdzielonego komponentu `src/application/characters/components/CharacterPickerGrid.tsx`, przyjmującego `onSelectCharacter`, `excludeCharacterId` (żeby nie dało się importować „z samej siebie”) i opcjonalnie `selectedCharacterId`.

`SelectBaseCharacterDialog` zostaje przepisany, by korzystać z tego komponentu wewnątrz swojego `Sheet` — zachowanie bez zmian, brak regresji.

To bezpośrednio realizuje wymóg ze specyfikacji: „Dialog importu powinien być wspólnym komponentem” — tu idziemy o krok dalej i współdzielimy też krok wyboru postaci źródłowej z istniejącym mechanizmem tworzenia postaci z szablonu.

### 3.3 `ImportFromCharacterSheet<TItem>`
Nowy, generyczny komponent: `src/common/components/import/ImportFromCharacterSheet.tsx`. Dwuetapowy `Sheet` (stan wewnętrzny `step: 'select-character' | 'select-items'`):

**Krok 1 — wybór postaci źródłowej:** `CharacterPickerGrid` (3.2), z `excludeCharacterId={currentCharacterId}`.

**Krok 2 — wybór elementów:** po wyborze postaci, `useCharacterItemsSource(sourceCharacterId)` pobiera pełną postać; `itemsSelector: (character: Character) => TItem[]` (prop) wyciąga właściwą kategorię (np. `c => c.maneuvers`). Lista filtrowana **po stronie klienta** (proste `name.includes(query)`, bez keyset paginacji — patrz uzasadnienie w sekcji 8) i renderowana przez ten sam `renderItem`/`SelectableItemWrapper` co `ImportItemsSheet`, z tymi samymi stanami `owned`/`removed`/`selected`/`available` liczonymi względem `currentItemsIds`/`removedItemsIds` przekazanych z karty edycji. Nad listą: nazwa postaci docelowej, nazwa postaci źródłowej, pole wyszukiwania, „zaznacz/odznacz wszystko”, licznik zaznaczonych, przyciski „Importuj”/„Anuluj” (wymóg UX z dokumentu źródłowego — sekcja „Wymagania UX”).

**Import + podsumowanie:** przy kliknięciu „Importuj” komponent sam liczy `imported = selected.filter(i => !currentItemsIds.includes(i.id))` i `skipped = selected.length - imported.length`, wywołuje `onImport(imported)` (ten sam kontrakt co `ImportItemsSheet.onImport`, więc podłącza się wprost do `registerImportedItems` z `useDraftRemovableItems`), po czym pokazuje `toast(...)` z treścią zgodną z przykładem w specyfikacji: „Zaimportowano {imported.length} elementów. Pominięto {skipped} elementów, ponieważ już istnieją na tej postaci.” Logika podsumowania żyje w jednym miejscu (komponencie), więc wszystkie 6 sekcji dostają ją za darmo, bez duplikacji kodu w kartach.

Props (symetryczne do `ImportItemsSheet`, dla spójności API):
```
importTitle, importDescription, currentCharacterId, currentCharacterName,
currentItemsIds, removedItemsIds, onToggleCurrentItem, onToggleRemovedItem,
itemsSelector: (character: Character) => TItem[],
renderItem, onImport, isPending
```

### 3.4 Ikona/tłumaczenia
Nowa ikona „import z postaci” (np. `BiUserPlus`/`BiTransfer` z `react-icons/bi`, wzorem istniejącego `importIcon` w `src/common/icons.ts`). Nowe klucze tłumaczeń w **wszystkich trzech plikach** `src/common/translations/translations.{pl-PL,de-DE,fr-FR}.ts` (repozytorium jest wielojęzyczne — łatwo to przeoczyć):
`import_from_character`, `select_source_character`, `no_source_character_selected`, `imported_summary_toast` (lub osobne `imported_count_label`/`skipped_count_label` do interpolacji), per-kategoria warianty tytułu/opisu sheeta (`import_maneuvers_from_character`, `select_maneuvers_to_import_from_character`, itd. dla wszystkich 6 kategorii) — albo, żeby nie mnożyć kluczy 6x, jeden generyczny zestaw z parametrem nazwy kategorii wstawianym w komponencie nadrzędnym (prostsze, rekomendowane).

---

## 4. Integracja w poszczególnych sekcjach

We wszystkich sekcjach poza ekwipunkiem wzorzec jest identyczny — dodanie drugiego przycisku obok istniejącego `ImportItemsSheet`, podłączonego do tych samych `currentItemsIds`/`removedItemIds`/`removeItemById`/`restoreRemovedItem` z już istniejącego `useDraftRemovableItems`:

- **Manewry** — `src/application/characters/edit/combat/EditManeuversCard.tsx`, `itemsSelector: c => c.maneuvers`
- **Atuty** — `src/application/characters/edit/details/EditPerksList.tsx`, `itemsSelector: c => c.perks`
- **Postawy** — `src/application/characters/edit/combat/EditStancesCard.tsx`, `itemsSelector: c => c.stances`
- **Stany** — `src/application/characters/edit/combat/EditStatesCard.tsx`, `itemsSelector: c => c.states`

### 4.1 Zaklęcia — decyzja projektowa wymagająca ustalenia
W tym systemie zaklęcia nie wiszą bezpośrednio pod postacią — każde `Power` (Moc) ma własną tablicę `spells`, a przycisk importu z biblioteki już dziś żyje **wewnątrz** `EditPowerCard.tsx`, per-moc. Dokument źródłowy nie uwzględnia tego podziału. Dwie opcje:

1. **(Rekomendowana)** Przycisk „Importuj z innej postaci” w `EditPowerCard` pokazuje spłaszczoną listę `sourceCharacter.powers.flatMap(p => p.spells)` — wszystkie zaklęcia postaci źródłowej niezależnie od tego, do której jej Mocy należały — i importuje zaznaczone do bieżącej Mocy. Spójne z tym, jak już działa import z biblioteki (tam też wyszukiwanie zaklęć jest globalne, nie per-Moc).
2. Dodatkowy podkrok wyboru „z której Mocy postaci źródłowej” — więcej UI, mało wartości dodanej, bo zaklęcie i tak trafia do jednej wybranej Mocy docelowej.

Rekomenduję opcję 1 i warto to potwierdzić z użytkownikiem/product ownerem przed implementacją, bo modyfikuje dosłowne brzmienie wymagania.

### 4.2 Ekwipunek — wymaga wcześniejszego refaktoru
`src/application/characters/edit/equipment/EditEquipmentView.tsx` **nie korzysta dziś z `useDraftRemovableItems`** — ma własną, uboższą implementację (lokalny `Set` importowanych ID, bez możliwości „usuń i przywróć” przy imporcie, ręczne klonowanie pól per typ zamiast wspólnej funkcji `cloneItem`). Żeby 5 podkategorii ekwipunku (`weapons`, `armors`, `shields`, `inventory`, `mounts`) miało tę samą jakość UX i identyczną obsługę duplikatów/podsumowania co pozostałe 5 sekcji, **rekomenduję najpierw** przepisać `EditEquipmentView.tsx` (i towarzyszące `EditWeaponView.tsx` itd.) na `useDraftRemovableItems`, analogicznie do `EditManeuversCard.tsx`. To osobne zadanie techniczne (dług, nie nowa funkcja), ale bez niego funkcja importu z postaci dla ekwipunku będzie niespójna z resztą aplikacji (brak przywracania usuniętych, inny mechanizm liczenia duplikatów). Jeśli czas nie pozwala, można zaimplementować import-z-postaci dla ekwipunku na istniejącym, uboższym mechanizmie (`cannotSelect` zamiast `state`) — działa, ale bez „przywróć usunięty” i bez ujednoliconego liczenia pominiętych w toaście.

Po ewentualnym refaktorze: `itemsSelector` dla każdej podkategorii to `c => c.equipment.weapons` / `.armors` / `.shields` / `.inventory` / `.mounts`, po jednym `ImportFromCharacterSheet` na podkategorię (razem 5 przycisków w tym widoku, tak jak dziś jest 5 przycisków importu z biblioteki).

---

## 5. Obsługa duplikatów i podsumowania

Zgodnie z wymaganiem, duplikaty (elementy już obecne na postaci docelowej) nie są importowane, a użytkownik dostaje komunikat z liczbami. Realizacja dwuwarstwowa:

1. **Prewencyjnie w UI** — elementy już posiadane (`currentItemsIds`) są renderowane w stanie `owned` (`SelectableItemWrapper`) — checkbox zaznaczony na zielono, kliknięcie nie dodaje do selekcji tylko wywołuje `onToggleCurrentItem` (usunięcie z postaci docelowej, tak jak dziś). Nie da się ich „przypadkiem” zaimportować drugi raz.
2. **Defensywnie przy imporcie** — mimo (1), `ImportFromCharacterSheet` i tak przelicza `imported`/`skipped` względem `currentItemsIds` tuż przed wywołaniem `onImport`, na wypadek wyścigu (np. ktoś dodał ten sam element ręcznie w drugiej karcie w międzyczasie) — i to ta liczba trafia do toasta. Spełnia to literalnie kryterium akceptacji „System poprawnie obsługuje duplikaty” i przykładowy komunikat z dokumentu źródłowego.

Odświeżenie listy po imporcie dzieje się automatycznie — `registerImportedItems` dopisuje do tej samej tablicy `react-hook-form`, którą karta już renderuje (`watchedArray`), więc nie jest potrzebny żaden ręczny refetch.

---

## 6. Pliki do utworzenia / zmiany — checklista

**Nowe pliki:**
- `src/common/components/import/ImportFromCharacterSheet.tsx`
- `src/application/characters/import/useCharacterItemsSource.ts`
- `src/application/characters/components/CharacterPickerGrid.tsx`
- `src/common/components/import/__tests__/ImportFromCharacterSheet.test.tsx`
- `src/application/characters/components/__tests__/CharacterPickerGrid.test.tsx`

**Zmiany:**
- `src/application/characters/add/SelectBaseCharacterDialog.tsx` — refaktor do użycia `CharacterPickerGrid`
- `src/application/characters/edit/combat/EditManeuversCard.tsx`
- `src/application/characters/edit/combat/EditStancesCard.tsx`
- `src/application/characters/edit/combat/EditStatesCard.tsx`
- `src/application/characters/edit/combat/EditPowerCard.tsx`
- `src/application/characters/edit/details/EditPerksList.tsx`
- `src/application/characters/edit/equipment/EditEquipmentView.tsx` (+ opcjonalny wcześniejszy refaktor na `useDraftRemovableItems`)
- `src/common/icons.ts` — nowa ikona
- `src/common/translations/translations.pl-PL.ts`, `.de-DE.ts`, `.fr-FR.ts` — nowe klucze

**Bez zmian (potwierdzone w analizie):** warstwa Prisma/schema, `charactersRepository.ts`, endpointy `PUT /characters/{id}/*`, `POST /api/search`, `POST /api/search/[id]`.

---

## 7. Kolejność wdrożenia

1. `useCharacterItemsSource` + testy (izolowany hook, łatwy do zweryfikowania na mocku `searchClient`)
2. Refaktor `SelectBaseCharacterDialog` → `CharacterPickerGrid` (najpierw upewnić się, że istniejący flow „utwórz postać z szablonu” nie regresuje — pokrycie testami już istnieje częściowo, dopisać brakujące)
3. `ImportFromCharacterSheet` (generyczny komponent + testy jednostkowe wzorem `ImportItemSheet.test.tsx`)
4. Integracja: Manewry → Postawy → Stany → Atuty (te cztery są mechanicznie identyczne, każda to ~10 linii zmian w karcie)
5. Zaklęcia (`EditPowerCard`) — po potwierdzeniu decyzji z sekcji 4.1
6. Ekwipunek — najpierw refaktor `EditEquipmentView` na `useDraftRemovableItems` (jeśli akceptowany), potem 5× integracja
7. Testy end-to-end/manualne wg kryteriów akceptacji z dokumentu źródłowego
8. Weryfikacja: `npm run lint`, `npm run test`, ręczny przegląd diffu

---

## 8. Ryzyka i otwarte kwestie

- **Brak paginacji serwerowej w kroku 2:** lista elementów postaci źródłowej pobierana jest w całości i filtrowana w przeglądarce. Dla typowej postaci (dziesiątki, nie tysiące elementów na kategorię) to nieszkodliwe uproszczenie i najprostsza droga zgodna z już istniejącym `useBaseCharacter`. Gdyby w praktyce postacie miały setki elementów w jednej kategorii, można w przyszłości podmienić filtrowanie kliencki na wariant z sekcji „Ocena” z researchu: rozszerzenie `create<Encja>KeysetQuery` o `searchInFilter("id", ownedIds)`, korzystając z już istniejącego, generycznego mechanizmu `SearchQueryBuilder` — bez zmian w `searchEntity.ts`.
- **Zaklęcia per-Moc** — patrz 4.1, wymaga jednozdaniowego potwierdzenia zakresu przed startem prac nad tą sekcją.
- **Ekwipunek i dług techniczny** — patrz 4.2, decyzja: refaktor najpierw czy import na istniejącym uboższym mechanizmie.
- **Postać źródłowa usunięta/niedostępna w trakcie sesji edycji** — `useCharacterItemsSource` powinien obsłużyć `error`/pustą odpowiedź komunikatem w kroku 2 (np. „Nie udało się pobrać danych wybranej postaci”), analogicznie do istniejącej obsługi błędów w `useBaseCharacter`.
- **Duplikaty wykrywane po ID** — zakłada, że ID elementu w bibliotece jest identyczne niezależnie od tego, na której postaci go widzimy (prawda przy obecnym modelu danych — patrz sekcja 1). Gdyby to się kiedyś zmieniło (np. warianty per-postać), cała ta koncepcja wymagałaby ponownej analizy.

---

## 9. Kryteria akceptacji → pokrycie planem

| Kryterium | Pokrycie |
|---|---|
| Import dla każdej z 6 kategorii | Sekcja 4 |
| Wybór postaci źródłowej | `CharacterPickerGrid` (3.2) |
| Lista elementów wybranej postaci | `useCharacterItemsSource` + `itemsSelector` (3.1, 3.3) |
| Zaznaczenie dowolnej liczby elementów | `SelectableItemWrapper` + lokalny `Set` w `ImportFromCharacterSheet` (istniejący wzorzec) |
| Importowane tylko zaznaczone | `onImport(selected)` (istniejący wzorzec) |
| Auto-odświeżenie listy docelowej | `registerImportedItems` → `append` do `watchedArray` (istniejące) |
| Obsługa duplikatów | Sekcja 5 |
| Podsumowanie liczby zaimportowanych/pominiętych | Sekcja 5, toast w `ImportFromCharacterSheet` |

---

## 10. Poza zakresem tego planu

Zgodnie z dokumentem źródłowym, „Możliwe rozszerzenia” (import wielu kategorii naraz, filtrowanie postaci źródłowych wg systemu/klasy, podgląd szczegółów przed importem, nadpisywanie istniejących elementów, zapamiętywanie ostatnio wybranej postaci źródłowej, import z szablonów) — świadomie pominięte w tym planie, do rozważenia jako osobne zadania po wdrożeniu podstawowej funkcji.
