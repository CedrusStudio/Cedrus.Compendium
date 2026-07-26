# Plan Poprawek Priorytetowych — notatki z 24.07.2026

> **Status: WYKONANE (24.07.2026).** Wszystkie punkty P0.1–P0.10 zaimplementowane. `npx tsc --noEmit` przechodzi bez błędów na całym projekcie po zmianach (test suite — `vitest` — nie dało się uruchomić w tym środowisku sandboksowym z powodu brakującego natywnego binarki Rollupa dla Linuksa i braku dostępu do rejestru npm; zweryfikuj lokalnie przed mergem: `npm test`).
>
> Poniższe zadania powstały z bezpośrednich notatek Marka po testach aplikacji i miały **pierwszeństwo** przed kolejnością fal w `ROADMAP.md` (Fala P0, przed Falą 1). Tam gdzie punkt pokrywał się z istniejącym zadaniem w `ROADMAP.md`, jest to odnotowane (`↔ ROADMAP X.Y`).

**Legenda wysiłku:** `S` = < 0,5 dnia · `M` = 0,5–2 dni · `L` = > 2 dni

---

## Kolejność realizacji (P0.1 → P0.10)

| # | Zadanie | Wysiłek | Pliki główne |
|---|---------|---------|---------------|
| P0.1 | Usunięcie sticky HUD w zakładce Walka | S | `CombatView.tsx` |
| P0.2 | Usunięcie badge „+Profil Wzmocnień” z pickera Postaw/Stanów | S | `ModesCard.tsx` |
| P0.3 | Usunięcie wskaźnika Vercel spod „Uniwersum Cedrus” | S | `VercelStatusBadge.tsx`, `app/page.tsx` |
| P0.4 | „Zaznacz/Odznacz wszystkie” w Szybkich tagach wykluczających | S | `PersonalizedQuickTags.tsx` |
| P0.5 | Poprawa zawijania i formatowania tagów (ogólnie + widok manewru) | S/M | `TagsView.tsx`, `SummaryView.tsx` |
| P0.6 | „Posiadane przez postacie” — pełne nazwy + dolny panel (Drawer) | M | `OwnedByCharacters.tsx` (przepisany na `@/ui/drawer`) |
| P0.7 | Sugerowana ranga (nie tylko nazwa) dla Postawy/Stanu w symulacji przy „tylko z karty postaci” | S/M | `ModeSelector.tsx`, `CombatantPicker.tsx` |
| P0.8 | Zmiana nazwy „Combat Lab” → „Laboratorium Systemu” (bez WERSALIKÓW) | S | `app/page.tsx`, `combat-lab/page.tsx` |
| P0.9 | Wyszukiwanie w zakładce Atuty (jak w Ekwipunku) | S | `PerksList.tsx` (characters/details) |
| P0.10 | Dedykowany edytor efektu „Skalowanie (za każde X)” — obrażenia na kość broni | M/L | `effectFieldsMeta.ts`, `EffectListField.tsx` |

Zadania P0.1–P0.9 są niezależne od siebie i można je realizować równolegle / w dowolnej kolejności w ramach jednego sprintu (wszystkie to izolowane zmiany UI). P0.10 jest większe i najlepiej zrobić je na końcu tej fali.

---

### P0.1 — Sticky HUD (Zdrowie/Bariera/Defensywa) w zakładce Walka — `S`

**Zgłoszenie:** „w zakładce walka -> zdrowie i bariera wraz z defensywą są sticky, nie powinno tak być”.

**Źródło problemu:** `src/application/characters/combat/CombatView.tsx`, linia 71 — kontener z `HealthCard`, `BarrierCard` i `DefenseCard` ma celowo dodane klasy `lg:sticky lg:top-0 lg:z-20 ...` (zamierzony „combat HUD” przypięty przy przewijaniu na desktopie, wg komentarza w kodzie).

**Zakres:** usunąć klasy `lg:sticky lg:top-0 lg:z-20` (i towarzyszące `lg:bg-background/95 lg:shadow-sm lg:backdrop-blur`, jeśli mają sens tylko w kontekście sticky) z diva na linii 71. Zostawić układ grid/flex bez przypinania.

**AC:** karty Zdrowie/Bariera/Defensywa przewijają się razem z resztą zakładki Walka na każdej szerokości ekranu; brak zasłaniania treści poniżej.

---

### P0.2 — Usunięcie „+Profil Wzmocnień” z listy wyboru Postawy/Stanu — `S`

**Zgłoszenie:** „przy wybieraniu postawy nie chce widzieć (+Profil Wzmocnień) bo to tylko przeszkadza”.

**Źródło problemu:** `src/application/characters/combat/ModesCard.tsx`, linie 82–91 — każdy `SelectItem` w dropdownzie Postaw/Stanów renderuje dodatkowy badge z ikoną `Plus` i tekstem „Profil Wzmocnień”, gdy dana postawa/stan ma powiązany profil wzmocnień (`linkedModeIdSet`).

**Zakres:** usunąć badge z wnętrza listy wyboru (linie 82–91). **Nie ruszać** sekcji „Profil Wzmocnień” wyświetlanej **po** wybraniu postawy (linie 110–138) — tam przyciski Zastosuj/Odwołaj są użyteczne i nie przeszkadzają w wyborze.

**AC:** lista rozwijana Postaw/Stanów pokazuje tylko nazwę i rangę, bez dodatkowego badge; panel powiązanych wzmocnień nadal widoczny po wyborze.

---

### P0.3 — Usunięcie wskaźnika „Vercel Local” — `S`
*(↔ ROADMAP 1.8, zrealizowane wcześniej jako `VercelStatusBadge` — Marek chce to jednak usunąć, nie poprawiać)*

**Zgłoszenie:** „Widzę pod »Uniwersum Cedrus« jakieś »Vercel Local«. Weź to usuń”.

**Źródło problemu:** `src/common/components/VercelStatusBadge.tsx`, montowany w `src/app/page.tsx` (import linia 8, użycie linia 48).

**Zakres:** usunąć `<VercelStatusBadge />` z `app/page.tsx` oraz sam plik komponentu (jeśli nieużywany nigdzie indziej — do sprawdzenia przed usunięciem pliku).

**AC:** pod nagłówkiem „Uniwersum Cedrus” nie ma żadnego wskaźnika Vercel/Local.

---

### P0.4 — Masowe zaznaczanie w Szybkich tagach wykluczających — `S`
*(↔ ROADMAP 1.5 — w `TagFilter.tsx` to już istnieje; brakuje w innym komponencie: „Szybkie tagi”)*

**Zgłoszenie:** „gdzie jest opcja do wybrania wszystkich tagów wykluczających (szybkie tagi)”.

**Ustalenie:** funkcja „Zaznacz wszystkie” / „Odznacz wszystkie” **już istnieje** w `src/common/components/filters/TagFilter.tsx` (linie 141–160), ale tylko dla głównego filtra tagów. Osobny komponent **„Szybkie tagi” (Quick Tags)** — `src/application/personalization/PersonalizedQuickTags.tsx`, używany m.in. na `app/personalization/page.tsx` — renderuje tylko pojedyncze przyciski-toggle (linie 42–54), bez zbiorczej akcji.

**Zakres:** dodać do `PersonalizedQuickTags.tsx` przyciski „Zaznacz wszystkie” / „Odznacz wszystkie” obok etykiety trybu (analogicznie do wzorca z `TagFilter.tsx`), działające na `quickTags` bieżącego trybu (`include`/`exclude`).

**AC:** w widoku Szybkich tagów (zarówno dołączających, jak i wykluczających) dostępny przycisk zaznaczający/odznaczający wszystkie tagi naraz.

---

### P0.5 — Formatowanie i zawijanie tagów — `S/M`
*(łączy dwa zgłoszenia: ogólne formatowanie tagów oraz konkretnie widok manewru z ~5 tagami)*

**Zgłoszenie 1:** „formatowanie tagów jest złe, bo zajmują dużo miejsca. Powinny jakoś lepiej się układać”.
**Zgłoszenie 2:** „podobnie dla konkretnego manewru, jeśli widzę 5 tagów, to dość słabo się wyświetlają”.

**Źródło problemu:**
- `src/common/components/tags/TagsView.tsx` (linia 18) — kontener ma `gap-x-2`, ale **brak `gap-y`** — gdy tagi zawijają się do kolejnej linii, rzędy się stykają bez odstępu, co wygląda na „stłoczone”.
- `src/application/common/SummaryView.tsx` (linia 19–22) — nazwa encji i `TagsView` są w **jednym** `flex-row flex-wrap` obok siebie, więc przy większej liczbie tagów (np. 5 na manewrze) tagi zaczynają zawijać się razem z nazwą w tej samej linii, zamiast mieć własny, przewidywalny wiersz.

**Zakres:**
1. W `TagsView.tsx` dodać pionowy odstęp przy zawijaniu: `gap-x-2 gap-y-1.5` (lub `gap-2` ogółem) zamiast samego `gap-x-2`.
2. W `SummaryView.tsx` rozdzielić nazwę/rangę i tagi na osobne linie/wiersze (nazwa w jednym `div`, `TagsView` w kolejnym, pełna szerokość) — dzięki temu tagi mają własną przestrzeń do zawijania niezależnie od długości nazwy.
3. Rozważyć (opcjonalnie, jeśli nadal ciasno przy 5+ tagach w widokach listowych/kartowych) ograniczenie widocznych tagów w kompaktowych kontekstach (np. karty w gridzie) do 3 + licznik „+N”, z pełną listą w widoku szczegółowym.

**AC:** tagi na widoku manewru (i wszędzie, gdzie używany jest `TagsView`/`SummaryView`) układają się czytelnie w wielu liniach bez stłoczenia; nazwa encji nie miesza się wizualnie z tagami.

---

### P0.6 — „Posiadane przez postacie”: pełne nazwy + dolny panel (Drawer) — `M`
*(↔ ROADMAP 3.2, już częściowo zaimplementowane jako `OwnedByCharacters` — Marek prosi o zmianę formy prezentacji)*

**Zgłoszenie:** „element »Posiadane przez postacie« na kliknięcie powinien wyświetlać tylko pełne nazwy (bez skrótowych) oraz powinien się otwierać taki panel dolny jak w bestiariuszu przy podglądzie manewrów”.

**Źródło problemu:**
- `src/application/common/OwnedByCharacters.tsx` — obecnie po kliknięciu rozwija się `Collapsible` **w miejscu**, a każda postać pokazana jest jako `Link` z pełną nazwą **i dodatkowo** badge ze skrótem (`character.shortName`, linia 51) — to ten skrót trzeba usunąć.
- Wzorzec docelowy: `src/application/bestiary/drawers/CharacterManeuversViewDrawer.tsx` — używa `Drawer`/`DrawerContent`/`DrawerHeader`/`DrawerTitle` z `@/ui/drawer` (panel wysuwany z dołu ekranu), a nie inline-collapsible.

**Zakres:**
1. Usunąć `<Badge>{character.shortName}</Badge>` z listy wyników w `OwnedByCharacters.tsx` (linia 51) — zostaje tylko pełna nazwa.
2. Zamienić `Collapsible`/`CollapsibleContent` na `Drawer` z `@/ui/drawer`, otwierany przyciskiem „Posiadane przez postacie” (ten sam trigger, ale `onClick={() => setOpen(true)}` zamiast rozwijania inline). Zachować leniwe pobieranie danych (`useOwningCharacters(entity, id, open)`) — to już działa poprawnie i nie wymaga zmian.
3. Nazwa nowego pliku: `src/application/common/OwnedByCharactersDrawer.tsx` (lub rozszerzyć istniejący plik) — dla spójności z konwencją nazewnictwa w `bestiary/drawers`.

**AC:** kliknięcie „Posiadane przez postacie” otwiera panel wysuwany z dołu ekranu (jak podgląd manewrów w bestiariuszu); lista pokazuje wyłącznie pełne nazwy postaci, bez skrótów.

---

### P0.7 — Sugerowana ranga Postawy/Stanu w symulacji przy „tylko z karty postaci” — `S/M`
*(dotyczy dwóch zgłoszeń — Postawa i Stan — ta sama zmiana w jednym współdzielonym komponencie)*

**Zgłoszenie 1:** „Jak widzę wybieranie postawy pod symulacje, to nie tylko nazwa ale i ranga powinna być zasugerowana, jeśli mam »tylko z karty postaci«”.
**Zgłoszenie 2:** „Poza tym Stan też powinien tak działać”.

**Źródło problemu:** `src/application/combat-lab/builder/ModeSelector.tsx` (współdzielony dla `kind="stance"` i `kind="state"`) i jego wywołanie w `src/application/combat-lab/builder/CombatantPicker.tsx` (linie 186–187):

```ts
<ModeSelector kind="stance" ... ownNames={character?.stances.map(s => s.name)} />
<ModeSelector kind="state" ... ownNames={character?.states.map(s => s.name)} />
```

`ownNames` przekazuje **tylko nazwy**. Po kliknięciu pozycji z listy „tylko z karty postaci”, `ModeSelector` woła `toMode(f, f.grades[0] ?? 1)` (linia 80) — czyli zawsze bierze **pierwszą dostępną rangę z biblioteki**, a nie rangę, którą postać faktycznie ma na karcie.

**Zakres:**
1. Zmienić `ownNames?: string[]` na coś w rodzaju `ownModes?: { name: string; grade: number }[]` (albo osobna mapa `name → grade`) — zarówno w `ModeSelector.tsx`, jak i w wywołaniach z `CombatantPicker.tsx`: `character?.stances.map(s => ({ name: s.name, grade: s.grade }))` / analogicznie dla `states`.
2. W `ModeSelector.tsx`, przy kliknięciu pozycji z listy „tylko z karty postaci” (`onlyOwn && hasOwn`), użyć rangi z karty postaci zamiast `f.grades[0]`: `toMode(f, ownGrade ?? f.grades[0] ?? 1)`.
3. Upewnić się, że nadal można ręcznie zmienić rangę selectem obok (linie 53–57) — sugestia to tylko domyślna wartość, nie blokada.

**AC:** przy zaznaczonym „Tylko z karty postaci” i wyborze Postawy/Stanu z listy, domyślnie ustawiana jest ranga zgodna z kartą postaci (nie pierwsza dostępna w bibliotece); działa identycznie dla Postaw i Stanów.

---

### P0.8 — Zmiana nazwy „Combat Lab” → „Laboratorium Systemu” — `S`

**Zgłoszenie:** „»Combat Lab« to nazwa po angielsku i jeszcze na głównym widoku z dużych liter. Zmień to na »laboratorium systemu«”.

**Źródło problemu:** trzy literalne wystąpienia:
- `src/app/page.tsx`, linia 98 — `title: 'Combat Lab'` (kafelek na stronie głównej; renderowany prawdopodobnie z klasą `uppercase`/`tracking-wide` w komponencie kafelka — do zweryfikowania i usunięcia wymuszonych wersalików, jeśli tekst ma zostać w normalnej kapitalizacji).
- `src/app/(combat-lab)/combat-lab/page.tsx`, linia 4 — `title: "Combat Lab"` (metadata strony/zakładki przeglądarki).
- `src/app/(combat-lab)/combat-lab/page.tsx`, linia 12 — `<h1 className="text-2xl font-bold">Combat Lab</h1>` (nagłówek widoku).

**Zakres:** zamienić wszystkie trzy na „Laboratorium Systemu”; jeśli kafelek na stronie głównej wymusza wersaliki przez CSS (`uppercase`), usunąć tę klasę dla tego tekstu albo zaakceptować, że backend renderuje „LABORATORIUM SYSTEMU” — do potwierdzenia z Markiem, czy ma zostać bez wersalików nawet stylistycznie (zgłoszenie sugeruje, że tak). Ścieżka URL `/combat-lab` i nazwy wewnętrzne (`combat-lab-*`) **zostają bez zmian** — to tylko tekst widoczny dla użytkownika.

**AC:** żadne miejsce w UI nie pokazuje „Combat Lab” po angielsku ani w wersalikach; wszędzie „Laboratorium Systemu” w normalnej kapitalizacji.

---

### P0.9 — Wyszukiwanie w zakładce Atuty — `S`
*(analogiczne do ROADMAP 1.7, które już zaimplementowano dla Ekwipunku)*

**Zgłoszenie:** „Tak jak dodano szukanie przy ekwipunku, tak dodać szukanie przy atutach”.

**Wzorzec:** `src/application/characters/equipment/EquipmentView.tsx` — lokalny `useState` na `query`, filtrowanie po stronie klienta po nazwie/opisie/tagach (`useMemo`, linie 17–34), `Input` z `placeholder={displayedText.searchByName}`.

**Cel:** `src/application/characters/details/PerksList.tsx` (zakładka Atuty w karcie postaci) — obecnie **brak jakiegokolwiek wyszukiwania**, po prostu renderuje listę `perks` w gridzie 2 kolumn.

**Zakres:** dodać identyczny mechanizm co w `EquipmentView.tsx`: pole `Input` + filtrowanie client-side po `perk.name` / `perk.description` / `perk.tags`, bez refetchu z serwera.

**AC:** w zakładce Atuty dostępne pole wyszukiwania działające natychmiastowo (bez ponownego pobierania danych), filtrujące po nazwie/opisie/tagach atutu.

---

### P0.10 — Dedykowany edytor efektu „Skalowanie (za każde X)” dla obrażeń na kość broni — `M/L`
*(↔ ROADMAP 3.1 — mechanika w silniku **już istnieje i działa**; brakuje wygodnego UI w edytorze manewru)*

**Zgłoszenie:** „Czy efekt do dodania wciąż może być taki, że wybieram obecne kości broni i dodaje do nich 1 obrażenie na kość, albo że dodaje obrażenia równe ilości kości?”

**Ustalenie po analizie kodu:** ta mechanika **jest już zaimplementowana w silniku symulacji**:
- `src/domain/combat-lab/effects/Effect.ts` (linie 339–366) definiuje `ScaleEffect` z `source.kind: "selfDice"` — dosłownie opisane w komentarzu jako „weapon dice the caster rolls (»za każdą kość broni«, »+X na kość broni«)”.
- Silnik (`src/domain/combat-lab/engine/scaleSource.ts`, `applyEffect.ts`, testy w `scaleStat.test.ts`) poprawnie liczy tę mechanikę: `{ type: "scale", source: { kind: "selfDice" }, per: 1, effect: { type: "damage", ... } }` daje „+1 obrażenie na każdą kość broni”; inny dobór `per`/`cap` pozwala uzyskać „obrażenia równe liczbie kości”.

**Korekta po dokładniejszym sprawdzeniu (ważne):** pierwotne ustalenie w tym dokumencie było błędne. `EffectListField.tsx` **już ma dedykowany, polowy edytor dla `scale`** — komponent `ScaleFields` (linie 179–251 w oryginalnym pliku): select `source.kind` z etykietami `SCALE_SOURCE_LABELS` (w tym „twoja kość broni” = `selfDice`), pole `per`, pole `cap`, oraz zagnieżdżony `SingleEffectField` na efekt (np. `damage`). Grep po „JSON/textarea” w tym pliku trafiał na kod należący do zupełnie innej gałęzi (`custom` — świadomie surowy JSON, bo to furtka dla pluginów) i mylnie połączyłem to z `scale`. **Mechanika działa i ma UI od dawna — nic tu nie było zepsute.**

**Co faktycznie zrobiono (24.07.2026):**
1. Dodano preset `weaponDiceDamageScalePreset()` w `effectFieldsMeta.ts` — gotowy efekt `{ type: "scale", source: { kind: "selfDice" }, per: 1, effect: damage bonus:1 }`, czyli dokładnie „+1 obrażenie na każdą kość broni” jednym kliknięciem, zamiast: dodaj efekt → zmień typ na Skalowanie → zmień źródło na „twoja kość broni” → ustaw `per`.
2. Dodano przycisk „+ Obrażenie za kość broni (+1/kość)” obok „+ Dodaj efekt” w `EffectListField.tsx`, wołający ten preset.
3. Poprawiono nieaktualny komentarz dokumentacyjny na górze `EffectListField.tsx` (sugerował, że `scale`/`contested`/`save` to JSON — od dawna nieprawda).
4. Dodano testy regresyjne w `effectFieldsMeta.test.ts`: preset jest zgodny ze schematem (`effectSchema`), źródło to `selfDice`/`per: 1`, i generuje sensowny opis przez `describeManeuver`.

**AC:** ✅ w edytorze manewru można dodać efekt „za każdą kość broni +1 obrażenie” jednym kliknięciem (istniejący builder pozwalał to zrobić bez JSON już wcześniej — teraz jest to też szybsze); podgląd opisu poprawnie opisuje efekt.

---

## Relacja do `ROADMAP.md`

- **P0.3** cofa efekt ROADMAP 1.8 (badge Vercel) — do usunięcia z `ROADMAP.md` po wdrożeniu P0.3, żeby nie odtworzyć go przypadkiem przy kolejnym porządkowaniu.
- **P0.4** doprecyzowuje ROADMAP 1.5 — funkcja istnieje w `TagFilter.tsx`, ale nie w `PersonalizedQuickTags.tsx`.
- **P0.6** doprecyzowuje ROADMAP 3.2 — zmienia formę prezentacji (Drawer zamiast inline) i usuwa skrót nazwy.
- **P0.10** zamyka ROADMAP 3.1 — po weryfikacji: silnik **i** UI edytora już istniały (`ScaleFields`), dodano tylko preset przyspieszający najczęstszy przypadek.
- Pozostałe punkty (P0.1, P0.2, P0.5, P0.7, P0.8, P0.9) to nowe zgłoszenia, nieobecne wcześniej w `ROADMAP.md`.

**Rekomendacja:** po ukończeniu Fali P0, wrócić do `ROADMAP.md` i zacząć od Fali 0 (Diagnostyka), a następnie Fali 1 w niezmienionej kolejności — z wyjątkiem 1.5, 1.8 i 3.2, które zostaną już zamknięte/skorygowane przez tę falę.
