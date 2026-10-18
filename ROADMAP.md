# Roadmapa Poprawek i Usprawnień — Cedrus Compendium

> Zunifikowana roadmapa. Wchłonęła oba plany z dawnego `TODO.md` (Rozbudowa Aplikacji + Combat Lab & Kompendium; plik usunięty 2026-08-02, treść w historii gita) oraz Falę P0 (`features-to-implement/done/priority-fixes-2026-07-24.md`, wykonaną 2026-07-24).
> **Priorytetyzacja: wartość vs wysiłek** — najpierw redukcja ryzyka i quick wins, na końcu duże refaktory architektoniczne.

## Co realnie zostało (stan 2026-08-02)

Przegląd kodu i danych z `backup/2026-08-02T06-30-41-035Z`. Fale 0–3 i 5–8 są zamknięte; poniżej wszystko, co nie jest.

| Pozycja | Gdzie | Skala |
|---|---|---|
| **Mapowanie efektów Combat Lab** — największa otwarta pozycja | `combat-lab-maneuver-analysis-plan.md` | 84 z 992 manewrów ma efekty; **0** z 214 Postaw, 30 Stanów i 421 Zaklęć. Nic nie jest oznaczone jako niesymulowalne, więc triaż praktycznie nie ruszył. |
| **Autorowanie efektów Postaw/Stanów** | `combat-lab-engine-model-gaps-plan.md` §1 | Silnik jest gotowy w całości (patrz §8.10). Brakuje wyłącznie **treści**: 0 z 214 Postaw i 0 z 30 Stanów ma efekty. |
| **Rozbudowa wzmocnień w symulacji** | `combat-lab-buff-expansion-plan.md` | Plan bez implementacji. |
| **Kontekst postaci — rozszerzenia akcji** | [Plan i analiza kodu](features-to-implement/compendium-character-scope-plan.md) | Pierwsze wydanie gotowe 2026-10-18: zapis manewrów, atutów, postaw i stanów oraz filtr w 12 kategoriach. Pozostają akcje ekwipunku, zaklęć, mocy i ras (rozszerzenia A/B). |
| **4.1 Prywatne encje Kompendium** | Fala 4 poniżej | `apiKeys` istnieje wyłącznie na `Character`. |
| **2.6 Reszta redesignu zakładki Walka** | Fala 2 poniżej | Świadomie odłożone — wymaga makiety. |
| **Dwa błędne mapowania wymagań** | dane | `Pogromienie` (rangi 1–3) i `Napór Włóczniarza` (rangi 1–2) mają nadmiarowe `siła ≥ N` obok poprawnego wpisu — 5 rekordów do wyczyszczenia w `/admin/requirements`. |

Domknięte na danych 2026-08-02: legacy `requirements` usunięte ze wszystkich 5 kolekcji (0 rekordów), legacy `cost` zaklęć wyczyszczony (0 z 421), sześć wpisów `replaces` sprowadzonych do kanonicznych nazw Manewrów.

Domknięte w kodzie 2026-08-02: **§8.10** — zmiana postawy w turze, blokady po tagu (Amok), Postawy/Stany w Synergy i Meta, edytor efektów Stanów w Kompendium. Oraz higiena repo: `.gitattributes` (koniec szumu CRLF w diffach), 62 śledzone śmieci usunięte, `TODO.md` wchłonięty tutaj.

**Legenda wysiłku:** `S` = < 0,5 dnia · `M` = 0,5–2 dni · `L` = > 2 dni / zmiana architektoniczna
**Wartość:** ⭐ niska · ⭐⭐ średnia · ⭐⭐⭐ wysoka

---

## Przegląd fal (kolejność realizacji)

| Fala | Nazwa | Cel | Ryzyko |
|------|-------|-----|--------|
| **0** | Diagnostyka i QA | Naprawa zaszłości i weryfikacja mechaniki przed dalszą pracą | Wysokie (fundament) |
| **1** | Quick Wins UI/UX | Szybkie, tanie poprawki widoczne dla użytkownika | Niskie |
| **2** | Mechaniki postaci i UI walki | Rozbudowa karty postaci i ergonomia Combat Lab | Średnie |
| **3** | Zaawansowane mechaniki i cross-ref | Nowe funkcje symulatora i wyszukiwanie powiązań | Średnie |
| **4** | System prywatnych elementów | Custom content dla graczy/MG | Średnie |
| **5** | Refaktor systemu Wymagań | Kluczowa zmiana modelu danych (kompatybilność wsteczna) | Wysokie |
| **6** | Domknięcie Fali 5 (dane + UI) | Dokończenie migracji danych, multi-filtr wymagań, porządki w widoku tagów | Niskie/Średnie |
| **7** | Rozszerzenie modelu Wymagań | Umiejętności, Moce/Więzi, operator LUB, sumy cech, mądrzejszy matcher, filtr rodzaju w adminie | Średnie |
| **8** | Wymagania licznikowe i sprzętowe | Domknięcie mapowania: „ilość czegoś" + sprzęt jako kategoria | Średnie |
| **10** | Kategorie tagów | Warstwa opisowa nad tagami: filtrowanie po kategoriach zamiast ręcznego wykluczania | Niskie (dane nietknięte) |

Zasada: **Fala 0 zawsze pierwsza.** Fale 1–4 są w dużej mierze niezależne i można je zrównoleglać. Fala 5 na końcu, bo dotyka rdzenia i wymaga migracji. Fala 6 to sprzątanie po Fali 5 — zaczyna od danych (6.1), bo bez nich reszta jest nieweryfikowalna.

---

## Fala 0 — Diagnostyka i Zapewnienie Jakości `[FUNDAMENT]`

Redukcja ryzyka: naprawiamy błędy mechaniki, zanim zbudujemy na nich nowe UI.

### 0.1 Usunięcie zaszłości po "Manie" — `S` · ⭐⭐ — **ZROBIONE**

- **Stan (zweryfikowano 2026-08-02):** brak jakichkolwiek odwołań do `mana`/`Mana` w `src/`; skrypt migracyjny `scripts/backfill-mana-to-essence.ts` został wykonany. Logika operuje wyłącznie na Esencji.
- **Źródło:** Plan B / Task 1.1
- **Zakres:** przeszukać kod pod `mana`/`Mana`, ustalić pochodzenie pola w *Startowej puli zasobów*, bezpiecznie usunąć/zrefaktoryzować tak, by logika operowała wyłącznie na **Esencji**.
- **AC:** brak odwołań do Many; symulacja i UI używają tylko Esencji; testy przechodzą.

### 0.2 Weryfikacja przeliczania statystyk pochodnych (Rulebook Check) — `M` · ⭐⭐⭐ — ✅ ZAMKNIĘTE (2026-07-24)
- **Źródło:** Plan B / Task 1.2
- **Zakres:** przeanalizować silnik kalkulacji w Combat Lab; upewnić się, że modyfikator cechy podstawowej (np. *+Siła* z *Wiru Walki*) aktualizuje statystyki pochodne (Obrażenia itd.) **przed** symulacją, w kolejności zgodnej z podręcznikiem.
- **Wynik diagnozy:** to nie błąd kolejności — kolejność kalkulacji jest poprawna (bufy nakładają się przed zamrożeniem snapshotu). Problem był głębszy: zależność „Siła → Obrażenia” **w ogóle nie istnieje** w silniku — to dwie rozłączne, addytywne wartości. Pełna diagnoza: `features-to-implement/done/combat-lab-strength-derived-stats-findings.md`.
- **Decyzja (podjęta z Markiem 2026-07-24):** **nie** implementować automatycznej derywacji. Zbyt duże ryzyko podwójnego naliczenia — większość istniejącej zawartości Kompendium prawdopodobnie już ręcznie „wliczyła” Siłę w autorskie Obrażenia; auto-derywacja cicho zmieniłaby balans wszystkich postaci/broni. Obowiązująca zasada: **Postawy/Stany/Bufy podnoszące obrażenia z Siły autoruje się wprost na Obrażeniach**, nie na cesze Siła.
- **AC:** ✅ decyzja projektowa udokumentowana w kodzie (`applyBuffProfile.ts`, komentarz nad `applyBuffProfile`); ✅ test regresyjny blokujący przypadkowe wprowadzenie auto-derywacji bez świadomej decyzji (`applyBuffProfile.test.ts`).
- **Uwaga:** Fala 3 (złożone modyfikatory obrażeń, w tym „za każdą kość broni”) **nie jest już blokowana** — to osobna, niezależna mechanika (`ScaleEffect`/`selfDice`), już działająca (patrz `features-to-implement/done/priority-fixes-2026-07-24.md`, P0.10).

---

## Fala 1 — Quick Wins UI/UX `[NAJLEPSZY STOSUNEK WARTOŚĆ/WYSIŁEK]`

Drobne, izolowane zmiany front-endowe. Można realizować równolegle, każda to osobny mały PR.

### 1.1 Przywrócenie paska nawigacji w Combat Lab — `S` · ⭐⭐⭐ — **ZROBIONE** (`src/app/(combat-lab)/layout.tsx` → `CombatLabNavbar`)
- **Źródło:** Plan B / Task 2.1
- **AC:** górny Navbar/Header obecny i spójny w widoku Combat Lab.

### 1.2 Reorganizacja kafelków strony głównej (4+1 → estetyczny grid) — `S` · ⭐⭐ — **ZROBIONE** (wyśrodkowany flex-wrap zamiast sztywnego gridu, `src/app/page.tsx`)
- **Źródło:** Plan B / Task 2.2
- **AC:** responsywny grid bez osamotnionego kafelka (np. 3+2), z wyróżnieniem Combat Lab/Podręcznika.

### 1.3 Czyszczenie etykiet i micro-UI w selektorach — `S` · ⭐⭐ — **ZROBIONE**
- **Źródło:** Plan B / Task 3.2
- **AC:** usunięty tekst `"g3"`; przycisk usuwania `"x"` → ikona (`TrashIcon`/`XIcon`); skróty: `"Obrażenia (płaskie)"` → `"Obrażenia"`, `"Niewrażliwość (usuwa kości)"` → `"Niewrażliwość"`.

### 1.4 Skrócenie etykiety Mapowania Efektów — `S` · ⭐ — **ZROBIONE**
- **Źródło:** Plan B / Task 4.4
- **AC:** `"Efekty (Combat Lab): do zmapowania"` → `"Efekty: do zmapowania"`.

### 1.5 Masowe zaznaczanie tagów wykluczających — `S` · ⭐⭐ — **ZROBIONE** (`TagFilter.tsx`; Szybkie tagi domknięte przez P0.4 w `PersonalizedQuickTags.tsx`)
- **Źródło:** Plan B / Task 4.3
- **AC:** przycisk „Zaznacz wszystkie” / „Odznacz wszystkie” przy filtrach wykluczających.

### 1.6 Sticky Header + zwijane tagi w Kompendium — `S/M` · ⭐⭐ — **ZROBIONE**

- **Stan (zweryfikowano 2026-08-02):** `common/components/lists/ListHeader.tsx` jest `sticky top-0 z-10` i owija oba pasy Szybkich tagów (włączające + wykluczające) w `Collapsible` z przyciskiem-strzałką „Tagi". Zawijanie i formatowanie samych plakietek poprawił P0.5.
- **Świadomie niezrobione (drobiazgi, nie blokery):** stan zwinięcia startuje zawsze jako **otwarty** (`useState(true)`) i nie przeżywa przeładowania — nie jest zapamiętywany w profilu personalizacji; nie ma też automatycznego kompaktowania paska przy przewijaniu (AC dopuszczało „albo—albo", zrobiono wariant ze zwijaniem ręcznym).
- **Źródło:** Plan B / Task 4.2
- **AC:** zwijana sekcja tagów (Collapsible) lub kompaktowy tryb paska przy przewijaniu.

### 1.7 Lokalne filtrowanie w Ekwipunku — `S/M` · ⭐⭐⭐ — **ZROBIONE** (`application/characters/equipment/EquipmentView.tsx`)
- **Źródło:** Plan A / Task 2.2
- **AC:** instant search po nazwie/typie/kategorii, w całości po stronie klienta (bez re-fetchu).

### 1.8 Ikonka statusu Vercel „Uniwersum Cedrus” — ❌ **WYCOFANE**

Zadanie zostało zrealizowane, a następnie **cofnięte na życzenie Marka** (P0.3 — wskaźnik usunięty ze strony głównej). Zostaje w dokumencie wyłącznie jako ślad, żeby nie odtworzyć go przy kolejnym porządkowaniu.

---

## Fala 2 — Mechaniki Postaci i UI Walki

Rozbudowa karty postaci oraz ergonomii Combat Lab. Zależna od Fali 0 (poprawna mechanika).

### 2.1 Redesign panelu „Podgląd Statystyk” w Combat Lab — `M` · ⭐⭐⭐ — **ZROBIONE** (`CombatantStatsCard.tsx`: Fechtunek/Fortel, suma redukcji, zwijany podgląd)
- **Źródło:** Plan B / Task 3.3
- **AC:** formatowanie trybów (`"Postawa Defensywna g2"` → `"Postawa Defensywna 2"`); wyświetlanie brakujących atrybutów (*Fechtunek*, *Fortel*, …); **suma całkowitej redukcji** w Obronie (Blok + Parowanie + Unik + Pancerz); zwarty zapis Ataku (usunięty słowny `+bonus`).

### 2.2 Filtrowanie Postaw i Stanów wg wybranej postaci — `M` · ⭐⭐ — **ZROBIONE** (przełącznik „Tylko z karty postaci” w `ModeSelector.tsx`; sugerowana ranga dołożona przez P0.7)
- **Źródło:** Plan B / Task 3.1
- **AC:** przełącznik pokazujący tylko Postawy/Stany, które postać faktycznie posiada na karcie.

### 2.3 Tymczasowe bonusy do rzutów w Umiejętnościach — `M` · ⭐⭐⭐ — ✅ JUŻ ZAIMPLEMENTOWANE
- **Źródło:** Plan A / Task 2.1
- **AC:** input tymczasowego modyfikatora przy umiejętności (spójny z mechaniką Cech/Atrybutów); modyfikator wliczany w wynik testu; łatwy reset/usuwanie.
- **Stan (zweryfikowano 2026-07-24):** kolumna „Rzut” w `src/application/characters/talents/talentsColumns.tsx` (`RollCell`) ma dokładnie ten mechanizm — lokalny stan bonusu inicjalizowany z `talent.bonus`, `VerticalChangeButtons` do regulacji, `ResetButton` do przywrócenia, `RollButton` liczący `1k(grade×2) + bonus`. Komentarz w kodzie wprost odwołuje się do wzorca ze `StatisticView` (Cechy/Atrybuty). Nic do zrobienia.

### 2.4 Ulepszenie UI Wzmocnień (Buffów/Debuffów) — `M` · ⭐⭐ — ✅ ZAMKNIĘTE (2026-07-24)
- **Źródło:** Plan A / Task 2.3
- **AC:** wyraźne oznaczenie modyfikowanych wartości/statystyk; czytelniejsza lista (kontrast, ikony, etykiety).
- **Stan:** `CharacterBuffsView.tsx` już miał solidną realizację (chipy z dokładnymi modyfikatorami per aktywny profil, kolorowe wyróżnienie aktywnych vs nieaktywnych, zwijana sekcja szczegółów pogrupowana wg kategorii). Brakowało tylko ikon przy kategoriach modyfikatorów (Cechy/Atrybuty/Zdrowie/Obrona/Atak) — dodane (`Sparkles`/`Zap`/`Heart`/`Shield`/`Swords`).

### 2.5 Optymalizacja UI karty postaci — długie opisy — `M` · ⭐⭐ — ✅ ZAMKNIĘTE (2026-07-24)
- **Źródło:** Plan A / Task 2.4
- **AC:** długie opisy nie psują layoutu (Show more / zwijanie / zakładki / modale); podział na logiczne sekcje.
- **Stan:** główny opis postaci (`DetailsView.tsx`) już używał `ExpandableText` (clamp + „Pokaż więcej/mniej”). Brakowało tego w dwóch innych miejscach z autorskim, potencjalnie długim tekstem: `SummaryView.tsx` (opisy Atutów/Manewrów w gridach — używany szeroko: lista Atutów, karty w bestiariuszu itd.) i `ModesCard.tsx` (opis wybranej Postawy/Stanu w zakładce Walka). Oba podpięte pod `ExpandableText` z dopasowanym progiem/przycięciem; dodano prop `align` do `ExpandableText`, żeby dało się wyrównać tekst do lewej w gęstych listach zamiast zawsze centrować.

### 2.6 Przebudowa UI Walki w widoku postaci — `L` · ⭐⭐⭐ — 🟡 CZĘŚCIOWO (2026-07-24)
- **Źródło:** Plan A / Task 4.1
- **AC:** kluczowe akcje bojowe (HP, zasoby, rzuty, szybkie akcje) łatwo dostępne; redukcja przeładowania informacyjnego.
- **Zrobione:**
  - HUD (Zdrowie/Bariera/Defensywa) odklejony od sticky (P0.1, na życzenie Marka — sticky **nie** jest już uznawane za "łatwy dostęp", bo przeszkadzało).
  - `ManeuversCard.tsx` i `PowerCard.tsx`: siatka Manewrów/Zaklęć jest teraz zwijalna (`Collapsible`, domyślnie **otwarta** — nic nie znika bez akcji gracza). Nagłówek z esencją/poziomem/selektorem ofensywy w `PowerCard` zostaje zawsze widoczny nawet po zwinięciu reszty — to jest "szybki dostęp do zasobów" z AC.
- **Świadomie NIE zrobione w tym przebiegu (zbyt ryzykowne bez dalszej decyzji produktowej):** pełny redesign hierarchii informacji na całej zakładce (np. wydzielenie osobnych zakładek/sekcji dla Ofensywy vs Manewrów vs Mocy, dashboard z priorytetyzacją). `PowerCard`/`ManeuversCard` mają rozbudowane, dobrze pokryte testami UI (essencja, spelle, offense selector) — głębsza przebudowa DOM-u groziła regresją bez wyraźnej specyfikacji, czego dokładnie ma dotyczyć redesign. Rekomendacja: potraktować jako osobne zadanie z makietą/wireframe zaakceptowanym z wyprzedzeniem.

### 2.7 Powiązanie Stanów/Postaw ze Wzmocnieniami + szybki przycisk — `M` · ⭐⭐ — **ZROBIONE** (przyciski nałóż/zdejmij profil w `ModesCard.tsx`)
- **Źródło:** Plan A / Task 4.2
- **Zależy od:** 2.4, 2.6
- **AC:** Stany/Postawy wykazują relację ze wzmocnieniami; nieagresywna ikonka „+” tworzy/nakłada wzmocnienie z poziomu walki.

### 2.8 Sekcja Efektów przy tworzeniu Manewru — `M` · ⭐⭐ — **ZROBIONE** (`ManeuverEffectsEditableFields` w arkuszu dodawania i edycji)
- **Źródło:** Plan B / Task 4.1
- **AC:** formularz tworzenia/edycji manewru rozbudowany o zarządzanie efektami.

---

## Fala 3 — Zaawansowane Mechaniki i Cross-Reference

### 3.1 Złożone modyfikatory obrażeń (per kość broni) — `L` · ⭐⭐⭐ — **ZROBIONE** (silnik `ScaleEffect`/`selfDice` istniał; P0.10 dołożył preset w edytorze)
- **Źródło:** Plan B / Task 5.1
- **Zależy od:** 0.2 (poprawna kolejność kalkulacji)
- **Przykład:** *Zapał Wojownika 1* → +1 obrażenie na każdą kość broni + dodatkowe obrażenia zależne od liczby kości.
- **AC:** obsługa reguły `damage_per_weapon_dice`; kalkulator uwzględnia niestandardowe warunki modyfikacji kości.

### 3.2 Reverse Lookup — „Posiadane przez postacie” — `M` · ⭐⭐⭐ — **ZROBIONE** (`OwnedByCharacters.tsx`, przepisany na Drawer w P0.6)
- **Źródło:** Plan B / Task 5.2
- **AC:** w widoku szczegółów elementu Kompendium (Manewr, Postawa, Stan, Atut, Zaklęcie, Moc, Przedmiot) sekcja/przycisk „Posiadane przez postacie” z listą postaci i szybkim przejściem do karty.

---

## Fala 4 — System Prywatnych Elementów (Custom Content)

### 4.1 Prywatne atuty, manewry, stany, postawy i zaklęcia — `L` · ⭐⭐⭐
- **Źródło:** Plan A / Task 3.1
- **Zakres:** pole `apiKeys String[]` na obiektach: Atut, Manewr, Stan, Postawa, Zaklęcie — **dokładnie wzorzec istniejących prywatnych postaci** (`Character.apiKeys`), a nie `isPrivate`/`ownerId`; widoczność po nagłówku `x-api-key` (twórca = posiadacz klucza w `apiKeys`); UI CRUD z przypisaniem klucza. Widoczność sesyjna/kampanijna poza zakresem (nie istnieje dla postaci).
- **AC:** elementy prywatne widoczne tylko dla właściciela klucza; `empty apiKeys = publiczne`; tworzenie/edycja/usuwanie własnych elementów działa; brak wycieku przez listę, dostęp po ID ani filtr wymagań (aggregateRaw).
- **Plan wykonawczy:** `features-to-implement/private-compendium-entities-implementation-plan.md` (adaptacja `visible-only-to-api-keys` + `character-visibility-filter` z `features-to-implement/done`).
- **Blokada do rozstrzygnięcia:** `@@unique([name, grade])` na tych encjach powoduje kolizję prywatny↔publiczny duplikat nazwy — patrz Etap 0 planu.

### 4.2 Encje tworzone przez AI jako prywatne — `S` · ⭐ `[ZALEŻNE OD 4.1]`
- **Stan obecny:** `aiCharacterGenerationConstraintsSchema` ma `allowCustomEquipment` i `allowCustomAbilities` (oba domyślnie `false`). Gdy któraś zgoda jest włączona, `acceptAiCharacterDraftInTransaction` tworzy nowe rekordy kompendium jako **publiczne** — świadoma decyzja, żeby nie blokować funkcji o niewdrożone 4.1.
- **Zakres:** po wdrożeniu 4.1 przemyśleć, czy wpis dorobiony pod jedną postać nie powinien powstawać z `apiKeys` wywołującego zamiast lądować od razu we wspólnej bazie. Ewentualnie jako trzecia zgoda w `constraints` albo wybór w formularzu generowania.
- **Uwaga:** to jest opcja do rozważenia, nie ustalony wymóg — dopóki kompendium jest jednoosobowe, publiczne wpisy nikomu nie przeszkadzają.

---

## Fala 5 — Refaktor Systemu Wymagań `[CORE / OSTATNI]`

> ⚠️ Kluczowa zmiana architektoniczna. Realizować **na końcu**, sekwencyjnie, z naciskiem na kompatybilność wsteczną i zero regresji.
>
> **Rozszerzony plan implementacji (2026-07-24).** Poniżej — zamiast czterech ogólnych
> punktów — konkretny plan oparty o obecny stan kodu: `requirements: string[]`
> (wolny tekst) leży dziś na 5 modelach Prisma (`prisma/schema.prisma`, linie
> 92/116/138/166/183 — Atuty, Zaklęcia, Manewry, Postawy, Stany), renderowany przez
> `RequirementsView.tsx` i edytowany jako zwykła lista stringów. Istnieje już
> działający, wzorcowy mechanizm masowych zmian — `app/admin/requirements/page.tsx`
> + `requirementsManagementClient.ts` (rename/delete wymagania we wszystkich
> rekordach danego typu encji) — z niego trzeba korzystać, nie zastępować go.

### 5.1 Model danych nowego systemu Wymagań — `L` · ⭐⭐⭐
- **Źródło:** Plan A / Task 5.1
- **Zakres:** dwa warianty — `RanklessRequirement` (znormalizowany string) oraz `RankedRequirement` (`targetKey: string` + `value: number`). `targetKey` wskazuje na: Manewr, Postawę, Stan, Zaklęcie, Atut, Cechę, Atrybut.

**Szkic typów** (nowy plik `src/domain/requirements/Requirement.ts`):

```ts
export type RequirementTargetGroup = 'maneuvers' | 'stances' | 'states' | 'spells' | 'perks' | 'characteristics' | 'attributes';

export type RanklessRequirement = { kind: 'rankless'; text: string };            // znormalizowany wolny tekst — dzisiejsze zachowanie
export type RankedRequirement   = { kind: 'ranked'; group: RequirementTargetGroup; targetKey: string; value: number };
export type Requirement = RanklessRequirement | RankedRequirement;
```

- `targetKey` dla `characteristics`/`attributes` to istniejące klucze z `Characteristics.ts`/`Attributes.ts` (np. `"strength"`, `"fencing"`) — **ta sama lista już istnieje** jako `SKILLS` w `src/application/combat-lab/effects-editor/effectFieldsMeta.ts` (linie 39–45) i da się ją współdzielić (przenieść do `src/domain` żeby uniknąć zależności `application → domain` w złą stronę).
- Dla `maneuvers`/`stances`/`states`/`spells`/`perks` `targetKey` to `name` encji (biblioteka jest identyfikowana po nazwie już dziś — patrz `ModeSelector.tsx`/`useModeFamilies` — więc to spójne z istniejącym wzorcem, nie nowy koncept).

**Zmiany w schemacie (Zod + Prisma):**
1. Nowy `requirementSchema` (dyskryminowana unia po `kind`) w `src/persistence/schemas/requirementSchema.ts`.
2. **Dodać** (nie zastępować) pole `structuredRequirements: Requirement[]` obok istniejącego `requirements: String[]` na wszystkich 5 modeli Prisma (`Perk`, `Spell`, `Maneuver`, `Stance`, `State` — dokładne nazwy do zweryfikowania w `schema.prisma`). Wzorzec 1:1 z tym, jak dodano `effects`/`simulatable` do Manewrów/Postaw/Stanów obok starych pól (patrz `persistence/mappings/perkMapping.ts`, komentarz "Combat Lab fields are read defensively") — **stary zespół już raz przeszedł przez ten dokładny manewr migracyjny**, więc to sprawdzony wzorzec w tym repo.
3. `npx prisma db push` (Mongo — bez klasycznych migracji SQL) po zmianie schematu.

**AC:** typy + schema Zod skompilowane i przetestowane (parsowanie obu wariantów, w tym błędnych payloadów); Prisma ma nowe pole; brak zmian w istniejącym `requirements: string[]` (żeby nic się nie wysypało, dopóki 5.4 nie zmigruje danych).

### 5.2 Silnik walidacji i sprawdzania wymagań — `M` · ⭐⭐⭐
- **Źródło:** Plan A / Task 5.2
- **Zależy od:** 5.1
- **AC:** porównywarka (np. `Siła: 3` vs postać `Siła: 5` → `true`, bo `5 >= 3`); walidator + normalizator stringów dla wymagań bez rangi.

**Zakres:**
1. `src/domain/requirements/checkRequirement.ts` — `checkRequirement(req: Requirement, character: Character): boolean`.
   - `ranked` + `characteristics`/`attributes`: odczyt `character.characteristics[targetKey]`/`character.attributes[targetKey]` (już istnieje `getStatisticTotalTestValue`, `src/domain/characters/statistics/Statistic.ts` — użyć tej samej funkcji, żeby "ranga postaci" liczyła się identycznie jak wszędzie indziej, w tym w rzutach).
   - `ranked` + `maneuvers`/`stances`/`states`/`spells`/`perks`: znaleźć encję po `targetKey` (nazwa) w odpowiedniej kolekcji postaci (`character.maneuvers`, `character.stances`, …) i porównać `grade`/rangę.
   - `rankless`: normalizacja (trim, lowercase, collapse whitespace) + prosty string-match — **nie** próbować parsować semantyki wolnego tekstu, to i tak zostaje "bez rangi" z założenia.
2. `src/domain/requirements/normalizeRequirementText.ts` — normalizator używany zarówno przy zapisie (walidacja formularza), jak i w silniku porównania, żeby "Siła 3" i "siła  3" nie rozjeżdżały się.
3. Testy (`src/domain/requirements/__tests__/checkRequirement.test.ts`): pokrycie obu wariantów, edge case ujemnej wartości wymaganej, brakującego targetKey (encja nieznana postaci → `false`, nie wyjątek).

**Uwaga projektowa:** ta warstwa **tylko sprawdza/wyświetla** spełnienie wymagań (np. wyszarzenie elementu, którego postać nie spełnia) — **nie** blokuje istniejącego zapisu/edycji encji na postaci. To zgodne z tym, jak wymagania działają dziś (opisowe, nieegzekwowane twardo przez UI) i unika kolejnej dużej decyzji projektowej (czy system ma *wymuszać* wymagania). Jeśli Marek chce twardą walidację przy dodawaniu elementu do postaci, to osobna decyzja/zadanie — nie zakładać jej milcząco w 5.2.

### 5.3 UI Picker Wymagań — `M` · ⭐⭐
- **Źródło:** Plan A / Task 5.3
- **Zależy od:** 5.1, 5.2
- **AC:** komponowalny picker; wybór z listy istniejących Cech/Atrybutów/Manewrów/Postaw/Stanów/Zaklęć/Atutów; automatyczne przełączanie trybu z rangą ↔ bez rangi.

**Zakres:**
1. Nowy komponent `src/application/common/requirements/RequirementPicker.tsx`:
   - Select "typ" (`RequirementTargetGroup` + osobna opcja "dowolny tekst" dla `rankless`).
   - Gdy typ = `characteristics`/`attributes`: dropdown z istniejącej listy `SKILLS` (po przeniesieniu do domain — patrz 5.1) + number input na `value`.
   - Gdy typ = `maneuvers`/`stances`/`states`/`spells`/`perks`: search-and-pick po nazwie z biblioteki Kompendium — **dokładnie ten sam wzorzec co `ModeSelector.tsx`/`CharacterModeFilter.tsx`** (search input + `useModeFamilies`/analogiczne hooki dla Zaklęć/Atutów/Manewrów, które już istnieją dla Combat Lab i list Kompendium) + number input na rangę.
   - Gdy typ = "dowolny tekst": zwykły `Input` (to jest dzisiejsze zachowanie, 1:1).
2. `RequirementListField.tsx` — lista + dodawanie/usuwanie, wzorowana na `EffectListField.tsx` (ten sam `useFieldArray` z react-hook-form).
3. Podłączyć w formularzach edycji Atutu/Manewru/Postawy/Stanu/Zaklęcia **obok** (nie zamiast) istniejącego prostego pola `requirements: string[]`, dopóki 5.4 nie zamknie migracji.

**AC:** picker działa niezależnie dla każdego z 5 typów encji z wymaganiami; przełączanie trybu ranked/rankless nie gubi już wprowadzonych danych innego trybu (osobne pola w stanie formularza, nie nadpisywanie).

### 5.4 Migracja i sugestie mapowania starych wymagań — `L` · ⭐⭐⭐
- **Źródło:** Plan A / Task 5.4
- **Zależy od:** 5.1, 5.2, 5.3
- **AC:** wszystkie istniejące wymagania zachowane jako wariant *bez rangi* (zero regresji); panel admina/twórcy sugerujący mapowanie starych tekstów na struktury (autouzupełnianie).

**Zakres:**
1. **Backfill 1:1 (bezpieczny, w pełni automatyczny):** `scripts/backfill-requirements-to-structured.ts`, wzorowany na `scripts/backfill-power-types.ts` (ten sam dry-run domyślnie / `--apply` na końcu). Dla każdego rekordu z 5 kolekcji: `structuredRequirements = requirements.map(text => ({ kind: 'rankless', text: normalizeRequirementText(text) }))`. Zero utraty danych, zero ręcznej pracy — to jest krok, który realnie "zamyka" zgodność wsteczną z AC.
   - Uwaga ze wspomnień repo: uruchamiać przez `node --experimental-strip-types scripts/backfill-requirements-to-structured.ts` — `tsx` jest zablokowane w tym środowisku, mimo że nagłówek istniejących skryptów sugeruje `npx tsx`.
2. **Panel sugestii (opcjonalny, half-automatyczny):** rozszerzyć `app/admin/requirements/page.tsx` o tryb "Sugestie mapowania" — dla każdego unikalnego `rankless.text` z 5.4.1 spróbować dopasować go do znanej encji/cechy/atrybutu (fuzzy match po nazwie + wyłuskanie liczby z tekstu, np. regex na `/(cecha|atrybut|nazwa)\D*(\d+)/i`), pokazać jako "sugerowane: Siła ≥ 3" z przyciskiem "zatwierdź" (nadpisuje ten jeden wpis na `ranked`) albo "odrzuć" (zostaje `rankless`). To praca redakcyjna człowieka na istniejących ~kilkuset wymaganiach — narzędzie tylko przyspiesza, nie zgaduje automatycznie do produkcji.
3. Dopiero **po** ręcznym przejściu przez panel sugestii dla całej biblioteki: rozważyć wygaszenie starego pola `requirements: string[]` (osobna, świadoma decyzja — nie robić automatycznie w tym samym PR co backfill).

**Rekomendowana kolejność w ramach Fali 5:** 5.1 → 5.2 → (5.3 równolegle z 5.2, niezależne od siebie po ustaleniu typów w 5.1) → 5.4.1 (backfill, można zrobić od razu po 5.1, nie czeka na UI) → 5.4.2 (panel sugestii, wymaga 5.3).

---

## Fala 6 — Domknięcie Fali 5: dane, multi-filtr, tagi `[SPRZĄTANIE]`

> **Źródło:** obserwacje Marka z produkcji (2026-07-25) po cutoverze Fali 5.
> **Zależy od:** Fala 5 (całość, wdrożona w kodzie).
> **Kolejność jest obowiązkowa:** 6.1 → 6.2 → 6.3. 6.1 jest blokerem, bo dopóki dane są niekompletne, nie da się zweryfikować ani filtra, ani widoku.

### 6.1 Audyt i dokończenie migracji wymagań legacy — `M` · ⭐⭐⭐ — **ZROBIONE** (migracja 2026-07-25, `clear-legacy-requirements:apply` 2026-08-02)

- **Objaw:** encje z samym starym `requirements` nie pokazują wymagań w UI. Przykład z bazy: `Akrobatyka` ma `requirements: ["Nieuchwytność", "Lekka zbroja"]` i **brak** `structuredRequirements` → w Kompendium nie widać nic. `Pogromienie` ma oba pola → widać.
- **Przyczyna (nie bug w UI):** Faza 4c uczyniła `RequirementsView` **structured-only** (fallback do legacy usunięty), a Faza 4c-full usunęła `requirements` ze `schema.prisma`. Natomiast `backfill-requirements-to-structured --apply` **nigdy nie poszedł na produkcję**. Rekordy sprzed migracji są więc niewidoczne — dane nadal są w Mongo, tylko nikt ich nie czyta.
- **Konsekwencja techniczna:** stare skrypty (`backfill-requirements-to-structured.ts`, `clear-legacy-requirements.ts`) używają typowanego `findMany({ select: { requirements: true } })` — po usunięciu pola ze schematu **nie skompilują się i nie odczytają danych**. Muszą zostać przepisane na surowy odczyt.

**Zakres:**

1. **Backup przed czymkolwiek:** `npm run backup-mongodb`. Bez tego nie ruszamy — to jedyna kopia legacy tekstów.
2. **`scripts/audit-legacy-requirements.ts`** (nowy, tylko odczyt) — dla 5 kolekcji (`perk`, `spell`, `maneuver`, `stance`, `state`) czyta przez `prisma.<model>.findRaw({ filter: { requirements: { $exists: true, $ne: [] } } })` (Prisma nie zna już tego pola → jedyna droga). Kubełki liczone **per tekst legacy, nie per rekord**:
   - **osierocone** — legacy niepuste, `structuredRequirements` puste/brak → przypadek `Akrobatyki`;
   - **częściowe** — `structuredRequirements` niepuste, ale nie pokrywa każdego tekstu legacy → przypadek `Pogromienia` (patrz niżej);
   - **zduplikowane** — każdy tekst legacy ma odpowiednik → legacy jest śmieciem do sprzątnięcia;
   - **czyste** — brak legacy.
   Wyjście: podsumowanie per kolekcja + lista nazw/ID (do CSV, wzorem `maneuver-classification.csv`).
3. **Przepisanie backfillu** (`scripts/backfill-requirements-to-structured.ts`): **surowy odczyt (`findRaw`) + typowany zapis** (`update({ where: { id }, data: { structuredRequirements } })` — `structuredRequirements` jest w schemacie, więc zapis zostaje bezpieczny i typowany). Backfill **dopisuje** `rankless` dla każdego niepokrytego tekstu, zachowując istniejące wpisy; idempotentny. Dry-run domyślnie, `--apply` świadomie.
   - **Dlaczego dopisuje, a nie „wypełnia gdy puste" (poprawka po zgłoszeniu Marka 2026-07-25):** `Pogromienie` ma legacy `["Większy Fechtunek 2"]` **i** `structuredRequirements: [{ranked, characteristics/strength, 2}]`. Warunek „uzupełnij tylko gdy structured puste" uznaje ten rekord za zmigrowany i pomija go na zawsze — a tekst, który miał być zachowany, nie jest reprezentowany nigdzie i nigdy nie trafia do UI. Test pokrycia jest więc **per tekst**: tekst jest pokryty, gdy istnieje jego dosłowny mirror `rankless` **albo** gdy nazwa celu jakiegoś `ranked` występuje w tym tekście (`isLegacyTextCovered`). Zła *wartość* nadal liczy się jako pokrycie (wymaganie się wyświetla), zły *cel* nie.
4. **Przepisanie czyszczenia** (`scripts/clear-legacy-requirements.ts`): usuwanie legacy przez `$runCommandRaw` (`$unset: { requirements: "" }`) **tylko** dla rekordów, w których każdy tekst legacy jest pokryty. Rekordy `osierocone` **i `częściowe`** są pomijane i raportowane — wyczyszczenie ich skasowałoby treść wymagania. Uruchamiać dopiero gdy audyt pokazuje zero osieroconych i zero częściowych.
5. **Audyt jakości istniejących mapowań** (nowy podpunkt, wynikły z danych): w bazie są już błędne `ranked`. Konkret: `Pogromienie` ma legacy `"Większy Fechtunek 2"`, ale strukturę `{ group: "characteristics", targetKey: "strength", value: 2 }` — a `fechtunek` to `attributes/fencing` (patrz `src/domain/characters/statistics/skills.ts`), nie `characteristics/strength`. To nie jest literówka w jednym rekordzie, tylko sygnał, że wcześniejsze auto-mapowanie mogło zgadywać. Zakres: rozszerzyć audyt o porównanie `ranked` wpisów z ich legacy tekstem (`suggestRequirementMapping(text)` vs. zapisana struktura) i wypisać rozjazdy do ręcznego przeglądu w `/admin/requirements`.
   - **Audyt idzie od strony zapisanych wpisów, nie tekstów.** Pytanie brzmi „czy jakikolwiek tekst legacy nazywa cel tego `ranked`?", a nie „czy ten tekst jest wyjaśniony?". Wersja tekstowa cichnie w momencie, gdy backfill dopisze dosłowny mirror `rankless` — czyli dokładnie na rekordach, które właśnie naprawiliśmy i które nadal trzymają złe mapowanie. **Backfill nie poprawia błędnych `ranked` i nigdy nie powinien** — to praca redakcyjna dla człowieka.
6. Zaktualizować `package.json` (`audit-legacy-requirements`) i pamiętać o `node --experimental-strip-types` zamiast `tsx`.

**AC:** raport audytu po `--apply` pokazuje **0 osieroconych i 0 częściowych** we wszystkich 5 kolekcjach; `Akrobatyka` pokazuje „Nieuchwytność" i „Lekka zbroja"; `Pogromienie 1` pokazuje „Większy Fechtunek 2" obok (błędnego jeszcze) „siła ≥ 2"; żaden rekord nie stracił treści wymagania; lista rozjazdów `ranked` vs. tekst jest wygenerowana i przejrzana.

### 6.2 Wiele filtrów wymagań naraz (AND) — `M` · ⭐⭐ — **ZROBIONE**

- **Stan dziś:** `SearchPayload.requirementFilter` to **jeden** obiekt; `RequirementFilter.tsx` to popover trzymający jeden filtr; `buildRequirementSearchPipeline` dokłada jeden `$elemMatch`. Każda z 5 list Kompendium trzyma `useState<RequirementSearchFilter | undefined>`.
- **Decyzja (Marek, 2026-07-25):** semantyka **AND** — encja musi spełniać *każdy* dodany filtr. Bez trybu OR i bez negacji w tej iteracji (dołożenie ich później to jedno pole w typie, nie przebudowa).

**Zakres:**

1. **Typ:** `SearchPayload.requirementFilters?: RequirementSearchFilter[]` obok istniejącego `requirementFilter`. Nie usuwać starego pola od razu — `searchEntity` normalizuje oba do jednej tablicy (`[...(filters ?? []), ...(filter ? [filter] : [])]`). Usunięcie pojedynczego pola dopiero po przepięciu wszystkich 5 list.
2. **Pipeline:** `RequirementPipelineInput.requirementFilter` → `requirementFilters: RequirementSearchFilter[]`; każdy filtr produkuje własny warunek `$elemMatch` dopisany do istniejącej listy `conditions` (już łączonej przez `$and`) — czyli **żadnej nowej logiki łączenia**, tylko pętla zamiast jednego `push`. Ważne: dwa filtry ranked na ten sam `targetKey` muszą trafić w **osobne** `$elemMatch` (nie jeden obiekt), inaczej Mongo zgubi semantykę „różne elementy tablicy".
3. **`SearchQueryBuilder.requirementFilter()`** → akceptuje tablicę lub kumuluje wywołania; ta sama walidacja odrzucająca puste `text`/`targetKey` stosowana per element.
4. **UI — `RequirementFilter.tsx`:** przepisać z „popover z jednym filtrem" na „przycisk + lista chipów". Trigger pokazuje licznik (`Wymagania · 2`), popover ma listę już dodanych (każdy z `X` do usunięcia) i formularz „dodaj kolejne" (istniejący Select typu + `EntityNameCombobox`/`SKILLS` + wartość — bez zmian). `summarize()` zostaje, ale per chip.
5. **5 list Kompendium** (`ManeuversList`, `PerksList`, `SpellsList`, `StancesList`, `StatesList`): `useState<RequirementSearchFilter[]>([])`, `queryKey` dostaje całą tablicę (stabilna referencja — `EMPTY_ARRAY`, jak przy tagach), `clearResults()` przy każdej zmianie. Zmiana jest mechaniczna i identyczna w 5 plikach.
6. **Testy:** rozszerzyć `requirementSearchPipeline` o przypadki: 0 filtrów (ścieżka nie powinna w ogóle wchodzić w aggregateRaw), 2 filtry ranked różne cele, 2 filtry ranked ten sam cel, mix ranked + text.

**AC:** można dodać ≥2 filtry na każdej z 5 list; wyniki to część wspólna (AND); usunięcie jednego chipa przeładowuje listę; pojedynczy filtr działa dokładnie jak dziś (brak regresji); paginacja offsetowa nadal poprawna po dołożeniu filtra.

### 6.3 Wyrównanie tagów w widoku Kompendium — `S` · ⭐⭐ — **ZROBIONE**

- **Objaw:** na karcie encji w Kompendium nazwa i opis są wyrównane do lewej (od `sm`), a tagi wiszą wyśrodkowane — wygląda to na rozjechane.
- **Przyczyna:** `src/common/components/tags/TagsView.tsx` ma **na sztywno** `justify-center` w swoim kontenerze, podczas gdy `SummaryView.tsx` renderuje resztę jako `text-center sm:text-left`. Tagi nie uczestniczą w responsywnej zmianie wyrównania.

**Zakres:**

1. `TagsView` dostaje prop `align?: "start" | "center"` (domyślnie `"center"` — zero zmian dla obecnych 12 miejsc użycia) mapowany na `justify-start` / `justify-center`. Alternatywnie: usunąć `justify-*` z komponentu i przekazywać przez `className` — ale prop jest czytelniejszy i nie wymaga audytu wszystkich wywołań.
2. `SummaryView` przekazuje wyrównanie zgodne z resztą karty: `justify-center sm:justify-start`, żeby tagi łamały się tak samo jak nagłówek na mobile → desktop.
3. Sprawdzić pozostałe miejsca użycia, które celowo centrują (`InfoContentWithTags`, `CharacterPickerGrid`, kolumny bestiariusza) — mają zostać bez zmian; `PowerSpecificationViewFields` renderuje tagi inline obok nazwy, więc też bez zmian.
4. Wizualna weryfikacja na 5 listach Kompendium + karcie postaci (mobile i desktop), bo `SummaryView` jest współdzielony.

**AC:** w Kompendium na desktopie tagi zaczynają się w tej samej linii pionowej co nazwa i opis; na mobile nadal wyśrodkowane razem z resztą; żaden inny widok używający `TagsView` się nie zmienił.

### 6.4 Umiejętności jako cel wymagania — **PRZENIESIONE do 7.1**

Rozrosło się do własnej fali: umiejętności okazały się jednym z pięciu rozszerzeń modelu Wymagań (obok Mocy/Więzi, operatora LUB, wymagań sumarycznych i wartości pochodnych). Pełny zakres — patrz **Fala 7**.


**Rekomendowana kolejność w ramach Fali 6:** 6.1 (backup → audyt → backfill → weryfikacja) → 6.3 (tanie, natychmiast widoczne) → 6.2 (największe, najlepiej testować na kompletnych danych z 6.1). Nowe funkcje wymagań idą Falą 7.

### Stan wykonania (2026-07-25)

Kod całej Fali 6 jest napisany i przechodzi `tsc` (zawężony projekt obejmujący wszystkie zmienione pliki + skrypty + testy). Czysta logika (audyt, pipeline, normalizacja payloadu) zweryfikowana asercjami uruchomionymi w sandboxie; `vitest` i Prisma nie działają w sandboxie, więc **testy i skrypty musisz odpalić u siebie**.

Kolejność komend do wykonania na Windows:

> ⚠️ **`npm run <skrypt> -- --apply` NIE działa w PowerShellu.** PowerShell zjada separator `--`, zanim npm go zobaczy, więc flaga nie dociera do skryptu i przebieg po cichu zostaje dry runem — dokładnie to zdarzyło się przy pierwszej próbie migracji (`process.argv: []`, potwierdzone przez `diag-requirements`). Dlatego każdy skrypt zapisujący ma dedykowany wariant `:apply` z flagą wpisaną na stałe. Nie używaj formy z `--`.

```
npm run backup-mongodb                      # najpierw kopia — legacy text to jedyny egzemplarz
npm run diag-requirements                   # argv, docelowa baza, liczniki, jeden rekord
npm run audit-legacy-requirements           # ile jest osieroconych/częściowych + co do przeglądu
npm run backfill-requirements               # dry run
npm run backfill-requirements:apply         # zapis rankless
npm run audit-legacy-requirements           # ma pokazać 0 osieroconych i 0 częściowych
npm test                                    # vitest
npm run build
```

`npm run clear-legacy-requirements:apply` dopiero **po** potwierdzeniu 0 osieroconych i 0 częściowych — usuwa pole `requirements` z Mongo nieodwracalnie.
`npm run auto-map-requirements` jest opcjonalne i po zmianie czyta wyłącznie `structuredRequirements` (wcześniej sięgało po usunięte pole i wywaliłoby się w runtime).

**Stan bazy przed migracją (`diag-requirements`, 2026-07-25):** 1167 rekordów z tekstem niewidocznym w UI — perks 371, spells 305, maneuvers 476, stances 10, states 5. `structuredRequirements` ma tylko 5 manewrów, więc żaden skrypt migracyjny nigdy nie zapisał na produkcji. Te 5 to ręczne wpisy z UI — w tym błędne `siła ≥ 2` na `Pogromieniu 1`, co obala wcześniejszą hipotezę, że winne było auto-mapowanie (nigdy nie zostało uruchomione).

**Po migracji (2026-07-25, potwierdzone przez Marka):** 0 osieroconych, 0 częściowych, 1167 zduplikowanych. Zostały 2 wpisy do ręcznej poprawki w `/admin/requirements` — `Pogromienie` (`siła ≥ 2` → `fechtunek ≥ 2`) i `Napór Włóczniarza` (`siła ≥ 2` przy tekście „Zr 2" → zręczność).

**Domknięcie (2026-08-02):** `clear-legacy-requirements:apply` wykonany — pole `requirements` nie występuje już w żadnej z pięciu kolekcji (potwierdzone na `backup/2026-08-02T06-30-41-035Z`). **Obie ręczne poprawki są nadal do zrobienia i rozrosły się do 5 rekordów:** poprawny wpis został dołożony, ale błędny `siła ≥ N` **nie zniknął**, więc `Pogromienie` (rangi 1–3) i `Napór Włóczniarza` (rangi 1–2) mają dziś oba naraz. Do usunięcia akcją kasowania w `/admin/requirements`, nie edycją.

---

## Fala 7 — Rozszerzenie modelu Wymagań `[FEATURE]`

> **Źródło:** Marek, 2026-07-25, po zamknięciu 6.1.
> **Zależy od:** 6.1 (dane zmigrowane — ZROBIONE) oraz 6.2 (multi-filtr — ten sam kod pipeline'u).
>
> Fala 5 dała dwa warianty wymagania (`rankless` / `ranked`) na siedmiu grupach celów. Fala 7 dokłada **trzy nowe cele** (umiejętności, Moce/Więzi, wartości pochodne) i **dwa nowe kształty wymagania** (alternatywa, suma), plus matcher, który rozumie skróty i nie zgaduje przy kolizjach.

### 7.0 Model — cztery warianty zamiast dwóch `[FUNDAMENT]` — `M` · ⭐⭐⭐

Docelowy typ w `src/domain/requirements/Requirement.ts`:

```ts
type Requirement =
  | { kind: "rankless"; text: string }                                  // bez zmian
  | { kind: "ranked";   group: RequirementTargetGroup; targetKey: string; value: number }
  | { kind: "anyOf";    options: RankedRequirement[] }                  // 7.3 — „A lub B"
  | { kind: "sum";      targets: StatisticTarget[]; value: number };    // 7.4 — „A + B ≥ N"
```

- `anyOf.options` trzyma **wyłącznie** `RankedRequirement` — brak rekurencji. Decyzja Marka: płaska lista, nie drzewo AND/OR. Zysk: zod bez rekurencji, jeden dodatkowy poziom `$elemMatch` w Mongo, picker to zwykła lista.
- `sum.targets` = `{ group: StatisticRequirementGroup; targetKey: string }[]` — tylko cechy i atrybuty (sumowanie rang manewrów nie ma sensu mechanicznego). Dowolna liczba celów, minimum 2.
- **Migracja: żadna.** Oba warianty są addytywne, istniejące dokumenty zostają nietknięte.

**⚠️ Miejsca, które MUSZĄ objąć nowe warianty** — pominięcie któregokolwiek daje cichy błąd, nie wyjątek:

`checkRequirement` (+ `areRequirementsMet`) · `formatRequirement` / `requirementTargetLabel` · `RequirementsView` (kolorowanie chipów) · `requirementPickerModel` + `RequirementPicker` · `RequirementFilter` · `buildRequirementSearchPipeline` · `isLegacyTextCovered` i `auditRankedMappings` · `structuredRequirementOps` · panel `/admin/requirements`.

Dlatego **pierwszym krokiem 7.0** jest zamiana `if (kind === "rankless") … else …` w `checkRequirement` i `formatRequirement` na wyczerpujący `switch` z `never`-guardem w `default`. Wtedy kompilator wskaże każde nieobsłużone miejsce sam, zamiast pozwalać wariantowi przelecieć gałęzią `else`.

### 7.1 Umiejętności (Talenty) jako cel wymagania — `M` · ⭐⭐⭐

*(przeniesione z 6.4; ustalenia Marka z 2026-07-25)*

**Stan dzisiaj:**

- „Umiejętność" w kodzie nazywa się **`Talent`** (`src/domain/characters/Talent.ts`; `translations.pl-PL.ts` → `talents: "umiejętności"`). To typ **osadzony na postaci** (Prisma `type Talent` + `talents Talent[]` na `Character`), **nie** osobna kolekcja. Pola: `name`, `grade`, `category`, `characteristics`, `bonus`, `penalty`.
- Kanoniczna lista istnieje: `basicTalents` (~50 pozycji) + `uniqueTalents` („kontrola mocy"). Używa jej już `EditTalentsTable` do zasiewania postaci.
- „Ciche poruszanie" **nie występuje** w `basicTalents`. Marek potwierdził: to synonim **„skradania"** (sprawność / zręczność).

**Zakres:**

1. **Domena:** dopisać `"talents"` do `RequirementTargetGroup` i `ENTITY_REQUIREMENT_GROUPS` (`targetKey` = nazwa, jak encje Kompendium) — wtedy `requirementTargetLabel`, `formatRequirement` i `targetGroupSchema` rozszerzają się same. W `checkRequirement.ownedEntities` dochodzi `case "talents": return character.talents;` — `Talent` już spełnia kształt `NamedGraded` (`{name, grade}`), więc porównanie po `grade` działa 1:1. Dodać `character.talents` również do `allOwnedEntities` (żeby `rankless` też trafiał w umiejętności).
2. **Źródło nazw** (decyzja: lista bazowa **+** własne z postaci): `requirementEntityModelMap` nie obsłuży umiejętności, bo nie są modelem — w `GET /api/entity-names/[entity]` rozgałęzić **przed** sięgnięciem do mapy. Dla `talents` zwrócić posortowaną unię `basicTalents` + `uniqueTalents` + distinct z postaci: `prisma.character.aggregateRaw({ pipeline: [{ $unwind: "$talents" }, { $group: { _id: "$talents.name" } }, { $sort: { _id: 1 } }] })`. `useEntityNames` i `EntityNameCombobox` bez zmian.
   - **Ryzyko:** miesza źródło kanoniczne (kod) z faktycznym (postacie) — literówka wpisana na postaci wypłynie w podpowiedziach. Akceptowalne; czyszczenie to osobne zadanie.
3. **UI:** `MODE_LABELS` w `RequirementPicker` i `RequirementFilter` dostaje `talents: "Umiejętność"`. Obie mapy są typu `Record<…, string>`, więc TypeScript wymusi uzupełnienie.

### 7.2 Moce i Więzi jako cel wymagania — `M` · ⭐⭐⭐

**Kontekst mechaniczny (od Marka):** magiczne zdolności postaci mają dwa źródła — **wrodzone** (czarokrwistość) dają **Moc**, a **więź z bóstwem** daje **Więź**. W kodzie to jeden typ `Power` z polem `type: "moc" | "wiez"` (`allowedPowerTypes`), plus `level`, `bonus`, `essence`. `normalizePowerType` zna już aliasy: `arkana` / `wiara` / `natura` → `wiez`.

**Zakres:**

1. Nowa grupa `powers` w `RequirementTargetGroup`, `targetKey ∈ {"moc", "wiez"}`. To **trzeci rodzaj** grupy: nie statystyczna (nie ma `Statistic`) i nie encyjna (`targetKey` nie jest nazwą encji) — dodać `isPowerGroup(group)` obok istniejącego `isStatisticGroup`, żeby branchowanie było jawne, a nie oparte na „co zostało".
2. `checkRequirement` — decyzje Marka:
   - porównujemy **samo `level`**, bez `bonus`;
   - przy kilku Mocach tego samego typu liczy się **najwyższa**: `Math.max(...powers.filter(p => p.type === targetKey).map(p => p.level))`.
   - ⚠️ **Udokumentować w kodzie, że to celowa niespójność:** cechy porównujemy przez `getStatisticTotalTestValue` (`value + bonus + testBonus`), a `PowerCard` wyświetla efektywny poziom jako `level + bonus`. Wymaganie opisuje twardy rozwój postaci, nie jej chwilowy stan — bez komentarza ktoś „naprawi" to za pół roku.
3. `requirementTargetLabel`: dla `powers` zwracać etykietę PL — „Moc" / „Więź", nie surowy klucz `wiez`.
4. Picker/filtr: `MODE_LABELS.powers = "Moc / Więź"`, a cel to zwykły select z dwóch opcji (nie `EntityNameCombobox`).
5. **Bez nazw konkretnych mocy ani specyfikacji** (decyzja Marka) — sam typ wystarcza.

### 7.3 Operator LUB (`anyOf`) — `M` · ⭐⭐⭐

1. `{ kind: "anyOf", options: RankedRequirement[] }`, zod `.min(2)` — jednoelementowa alternatywa to zwykły `ranked` i nie powinna dać się zapisać.
2. `checkRequirement`: `options.some(checkRankedRequirement)`.
3. `formatRequirement`: `"moc ≥ 2 lub więź ≥ 2"` — jeden chip, nie kilka.
4. `RequirementsView`: chip zielony, gdy **którakolwiek** opcja spełniona; czerwony, gdy żadna.
5. **Picker:** nowy tryb „Lub" — ten sam formularz co `ranked`, tylko zbiera cele do listy (dokładnie wzorzec chipów z 6.2).

### 7.4 Wymagania sumaryczne (`sum`) — `M` · ⭐⭐

1. `{ kind: "sum", targets: StatisticTarget[], value: number }` — min. 2 cele, tylko `characteristics` / `attributes`.
2. `checkRequirement`: suma `getStatisticTotalTestValue` po celach `>= value` (decyzja Marka: wartości testowe, dowolna liczba celów).
3. `formatRequirement`: `"umysł + zręczność ≥ 9"`.
4. **Tylko `≥`, bez drugiego operatora** (potwierdzone): „suma większa niż 9" zapisujemy jako `≥ 10`. Dodanie `>` obok `≥` rozsadziłoby wszystkie miejsca z 7.0 i podwoiło liczbę przypadków w filtrze.
5. **Nieznany `targetKey` → `false`** (potwierdzone), nie 0. Cicha zamiana na 0 zaniża sumę i daje „niespełnione" bez sygnału, że klucz jest zepsuty.

### 7.5 „Siła Krytyka" — to Atut, nie wartość pochodna — `S` · ⭐⭐⭐

> **Zwrot akcji.** Pierwotnie zaplanowana tu była nowa grupa `derived` z `criticalPower` liczonym z ofensyw. **Dane z backupu obalają ten pomysł** i potwierdzają odczyt Marka („chodzi o tę bazową siłę krytyka, czyli z atutu Siła Krytyka").

**Ustalenia z `backup/2026-07-19…/` (backup sprzed usunięcia pola `requirements`):**

- W Kompendium **istnieje Atut `Siła Krytyka` w rangach 1–4** oraz bliźniaczy `Szansa Krytyka` 1–4.
- Wymagania odwołują się do nich **po nazwie i randze**: `Za Ciosem` 1/2/3 → „Siła Krytyka 2/3/4", `Wężowy Ruch` → „Siła Krytyka 2" + „Szansa Krytyka 2", `Krytyczne Przeznaczenie` → „Większy Fortel 6" + „Szansa Krytyka 2", `Bez Ryzyka` → „Szansa Krytyka 1". Łącznie 7 manewrów + 2 atuty.
- Osobno istnieje `Critical.power` (`Offense.ts`) — mechaniczna wartość modyfikowana przez broń, `Ryzyko` („+1 siła krytyka") i `BuffProfile.criticalPower`. **To nie jest to, na co wskazują wymagania.**

**Wniosek: nowa grupa `derived` jest niepotrzebna.** „Siła Krytyka 2" to zwykłe wymaganie encyjne — **`perks/Siła Krytyka ≥ 2`** — obsługiwane przez istniejący silnik bez żadnej zmiany modelu. Zakres 7.5 kurczy się do jednej rzeczy: **dopilnowania, żeby matcher nie zamienił tego na cechę** (patrz 7.6 pkt 5).

**To trzeba pilnować (wprost od Marka):** wymaganie sprawdza **posiadanie Atutu**, a nie efektywną siłę krytyka postaci. Postać, która ma wysoki `critical.power` z broni albo z Atutu `Ryzyko`, **nie** spełnia `perks/Siła Krytyka ≥ 2`. Wychodzi to samo z siebie, bo `checkRequirement` dla grupy `perks` patrzy na `grade` posiadanego Atutu i nigdy nie dotyka `offenses[].critical`. Ale ta niezależność jest łatwa do zepsucia przy dobrych chęciach („przecież ma siłę krytyka 3, czemu nie spełnia?") — **udokumentować w kodzie i pokryć testem**.

Grupa `derived` / `criticalPower` wraca do rozważenia dopiero, gdyby pojawiło się wymaganie odnoszące się do faktycznej wartości bojowej. Dziś takiego nie ma — w całej bazie **żaden** tekst wymagania nie odwołuje się do wyliczonego krytyka.

### 7.6 Matcher: skróty, synonimy, kolizje — `M` · ⭐⭐⭐

1. **Kolizje bez zgadywania** (decyzja Marka): dziś `matchEntity` zwraca **pierwsze** trafienie. Zmienić na zebranie **wszystkich**; przy trafieniu w więcej niż jednej grupie → **żadnej sugestii**, tylko lista kandydatów do ręcznego wyboru. Nowa funkcja `suggestRequirementMappings(text, entityNames): { suggestion, candidates, ambiguous }`; dotychczasowe `suggestRequirementMapping` zostaje cienką nakładką zwracającą `suggestion`, więc `auditRankedMappings`, panel admina i `auto-map-requirements` nie wymagają zmian.
   - Konkret z danych: **„akrobatyka"** jest jednocześnie umiejętnością (sprawność) **i** manewrem w Kompendium.
2. **Skróty cech** (mapa Marka): `S`=siła, `Zr`=zręczność, `Bd`=budowa, `Um`=umysł, `Ch`=charyzma, `Cz`=czarokrwistość. Tablica `STATISTIC_ABBREVIATIONS` obok `SKILLS`, sprawdzana **po** dopasowaniu pełnej nazwy. **Dopasowywać tylko gdy cały znormalizowany tekst to `skrót + liczba`** (`/^(s|zr|bd|um|ch|cz)\s*-?\d+$/`) — „s" jest zbyt krótkie, żeby szukać go w środku zdania. Potwierdzone wprost: **„s 2" → `characteristics/strength ≥ 2`**. Realne dane: `Pogromienie 2/3` mają „S 3"/„S 4", `Napór Włóczniarza` ma „Zr 2".
3. **Synonimy:** mapa `REQUIREMENT_SYNONYMS` (tekst znormalizowany → nazwa kanoniczna), zasiana wpisem `ciche poruszanie → skradanie`. Miejsce na kolejne, gdy wypłyną z audytu.
4. **Moc/Więź jako alternatywa:** tekst „moc 2" bez wskazania źródła → sugestia `anyOf[powers/moc ≥ 2, powers/wiez ≥ 2]`. Tekst jednoznaczny („więź 2", „arkana 2", „wiara 2") → pojedynczy `powers/wiez ≥ 2` przez `normalizePowerType`.
5. **⚠️ Kolejność dopasowań jest krytyczna — i mamy na to twardy dowód.** `suggestRequirementMapping` woła dziś `matchSkill` **przed** `matchEntity`, a `matchSkill` dopasowuje po pojedynczym słowie. Dla tekstu „Siła Krytyka 2" kandydat to „siła krytyka", `words = ["siła", "krytyka"]`, `words.includes("siła")` → **zwróci `characteristics/strength ≥ 2`**, choć w Kompendium istnieje Atut o dokładnie tej nazwie. To nie jest hipoteza: dotyczy 7 manewrów i 2 atutów (`Za Ciosem` 1/2/3, `Wężowy Ruch`, `Krytyczne Przeznaczenie`, `Bez Ryzyka`, `Bezryzyka`).
   - **Poprawna kolejność:** (1) dokładne dopasowanie nazwy encji / umiejętności do całego kandydata, (2) frazy wielowyrazowe i synonimy, (3) pojedyncze słowa cech i atrybutów, (4) skróty. Innymi słowy: **im bardziej szczegółowe dopasowanie, tym wcześniej** — dopasowanie po pojedynczym słowie jest ostatecznością, nie pierwszym strzałem.
   - Ten sam mechanizm dotknąłby „Szansa Krytyka 2", gdyby „szansa" była kiedyś nazwą cechy — dlatego reguła, nie łatka na „siłę".

### 7.7 Filtry — objąć nowe warianty — `M` · ⭐⭐⭐

**To jest miejsce, w którym najłatwiej o cichy regres.** `requirementCondition` w `requirementSearchPipeline.ts` generuje dziś **wyłącznie** warunek na `kind: "ranked"`. Po dodaniu `anyOf` encje, które trzymają wymaganie jako alternatywę, po prostu **wypadną z wyników filtra** — bez błędu, bez śladu.

1. Warunek dla celu `ranked` staje się `$or` dwóch dopasowań — bezpośrednie **albo** wewnątrz alternatywy:
   ```js
   { $or: [
     { structuredRequirements: { $elemMatch: { kind: "ranked", group, targetKey, value: { $lte: X } } } },
     { structuredRequirements: { $elemMatch: { kind: "anyOf", options: { $elemMatch: { group, targetKey, value: { $lte: X } } } } } },
   ] }
   ```
2. Warunek tekstowy (`kind: "text"`) bez zmian — `rankless` nie występuje wewnątrz `anyOf`.
3. **Sumy — decyzja otwarta.** „Co spełnia postać na randze X" nie przekłada się wprost na wymaganie sumaryczne. Propozycja MVP: filtr dopasowuje wymaganie `sum`, gdy dotyka wskazanej cechy, **bez** porównania wartości (i tak zaznaczone w UI jako przybliżenie). Alternatywa: pomijać sumy w filtrze. Do rozstrzygnięcia przed implementacją.
4. Rozszerzyć testy `requirementSearchPipeline` o: encja z `anyOf` łapie się na filtr którejkolwiek opcji; encja z `anyOf` **nie** łapie się na filtr celu spoza opcji; mieszanka `ranked` + `anyOf` + wiele filtrów AND z 6.2.

### 7.8 Dług nazewniczy — `S` · ⭐

`src/domain/characters/statistics/skills.ts` eksportuje `SKILLS`, ale to są **cechy i atrybuty**, nie umiejętności. Po 7.1 ta nazwa będzie myliła przy każdej lekturze. Rename `SKILLS` → `STATISTICS` (+ re-eksport w `effectFieldsMeta.ts`), ~10 plików, mechaniczne, **osobny commit** — nie mieszać z żadnym z powyższych.

### 7.9 Panel admina: filtrowanie po rodzaju wymagania — `S` · ⭐⭐

**Stan dzisiaj:** `src/app/admin/requirements/StructuredRequirementsManager.tsx` ma **jeden** filtr — tekstowy po etykiecie (`filterText`, czysto klientowy `useMemo` nad odpowiedzią `/api/requirements-management/structured/[entity]`). Rodzaj wymagania widać wyłącznie po kolorze wiersza (`ranked` dostaje `text-primary`), ale nie da się po nim zawęzić listy. Po migracji 6.1 to boli: 1167 wpisów to prawie same `rankless`, a te cztery ustrukturyzowane trzeba przewijać ręcznie.

**Zakres:**

1. Nad listą segmentowany przełącznik: **Wszystkie / Bez rangi / Ustrukturyzowane**. Filtr klientowy — dołożyć do istniejącego `useMemo` obok `filterText` (koniunkcja obu). **Endpoint bez zmian** — agregacja `$group` już zwraca `kind` w każdym wierszu.
2. **Liczniki przy opcjach** („Bez rangi (1163)", „Ustrukturyzowane (4)"). Liczone z pełnego zbioru, nie z przefiltrowanego — wtedy panel od razu pokazuje, ile pracy redakcyjnej zostało, i pozwala śledzić postęp między sesjami.
3. Po 7.0 rozbić „Ustrukturyzowane" na `z rangą` / `lub` / `suma` (te same liczniki). Do tego czasu podział binarny w zupełności wystarcza — o to prosił Marek.
4. Wybór zapamiętać w `localStorage` (wzorzec `maneuvers-grouped-view` z `ManeuversList`). Panel służy do dłuższej pracy redakcyjnej; reset filtru przy każdym wejściu irytuje.
5. **Zsynchronizować z trybem „Sugestie mapowania"** — dziś patrzy on wyłącznie na wpisy `rankless`. Przy wybranym „Ustrukturyzowane" lista sugestii byłaby zawsze pusta, więc przełącznik trzeba wtedy ukryć albo wyszarzyć, zamiast pokazywać pusty panel bez wyjaśnienia.

**AC:** jednym kliknięciem zawężam listę do samych `rankless` albo samych ustrukturyzowanych; licznik przy opcji zgadza się z liczbą wierszy po jej wybraniu; filtr tekstowy działa łącznie z filtrem rodzaju; wybór przeżywa odświeżenie strony.

### Testy Fali 7

- `checkRequirement`: talent „skradanie" `grade` 3 spełnia `talents/skradanie ≥ 3`, nie spełnia `≥ 4` · Moc typu `moc` na poziomie 2 spełnia `powers/moc ≥ 2`, nie spełnia `powers/wiez ≥ 2` · dwie Moce typu `moc` (poziom 1 i 3) → liczy 3 · `anyOf` spełniony, gdy tylko druga opcja pasuje · `sum` [umysł, zręczność] `≥ 9` przy wartościach 5 i 4 → true, przy 5 i 3 → false · `sum` z nieznanym kluczem → false, nie „suma bez tego składnika".
- **Regresja 7.5 (najważniejszy test fali):** postać z wysokim `offenses[].critical.power` (z broni albo z Atutu `Ryzyko`), ale **bez** Atutu `Siła Krytyka`, **nie** spełnia `perks/Siła Krytyka ≥ 2`. Postać z tym Atutem w randze 2 — spełnia, niezależnie od uzbrojenia.
- `suggestRequirementMapping`: „s 2" → `strength ≥ 2` · „Zr 2" → `dexterity ≥ 2` · **„Siła Krytyka 2" → `perks/Siła Krytyka ≥ 2`, nie `strength ≥ 2`** · „Szansa Krytyka 1" → `perks/Szansa Krytyka ≥ 1` · „ciche poruszanie 2" → `talents/skradanie ≥ 2` · „akrobatyka 1" → `ambiguous`, 0 sugestii, 2 kandydatów · „moc 2" → `anyOf` · „arkana 2" → `powers/wiez ≥ 2` · „sekret 5" → **nie** mapuje się na siłę.
- `buildRequirementSearchPipeline`: patrz 7.7 pkt 4.
- `requirementSchema`: nowe grupy i oba nowe warianty przechodzą walidację; `anyOf` z jedną opcją jest odrzucany.
- `StructuredRequirementsManager` (rozszerzyć `page.test.tsx`): wybranie „Bez rangi" zostawia wyłącznie wiersze `rankless`; filtr rodzaju i filtr tekstowy działają łącznie; liczniki liczą się z pełnego zbioru, nie z przefiltrowanego.

**AC Fali 7:** w pickerze i filtrze są typy „Umiejętność" oraz „Moc / Więź"; da się zapisać wymaganie „Moc ≥ 2 lub Więź ≥ 2" i „umysł + zręczność ≥ 10"; „Siła Krytyka 2" mapuje się na Atut, a nie na cechę siła, i nie da się go spełnić samą bronią; encje z alternatywą pojawiają się w wynikach filtra wymagań; żadna kolizja nazw nie zostaje zmapowana automatycznie; panel admina filtruje po rodzaju wymagania.

**Rekomendowana kolejność:** 7.9 (tanie, a od razu ułatwia pracę redakcyjną nad 1167 wpisami) → 7.6 pkt 5 + 7.5 (kolejność dopasowań w matcherze — najtańsza i najbardziej ryzykowna rzecz w całej fali, do zrobienia zanim ktokolwiek kliknie „zatwierdź sugestię") → 7.0 (fundament + `never`-guardy) → 7.1 → 7.2 → 7.3 → 7.7 (filtry razem z LUB, żeby regres nie zdążył wejść) → 7.4 → reszta 7.6 → 7.8.

### Stan wykonania Fali 7 (2026-07-25)

**Zrobione w kodzie, `tsc` czysty:** 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.9. **Zostało: 7.8** (rename `SKILLS` → `STATISTICS`) — celowo osobny commit.

Zasada od Marka, wpisana na stałe: **wymagania nigdy nie blokują nadania postaci czegokolwiek** — to może być decyzja fabularna MG. Udokumentowane w docstringu `checkRequirement` i `EntityRequirementsWarning`; jedyni konsumenci silnika to kolorowanie chipów i nieblokujące ostrzeżenie, żadnego `disabled` ani walidacji formularza.

Rzeczy, które `never`-guard z 7.0 wyciągnął na wierzch (każda byłaby cichym błędem, nie wyjątkiem):

- `readStructuredRequirements` odrzucałoby `anyOf`/`sum` jako śmieci — backfill uznałby taki rekord za „nic strukturalnego".
- `toElemMatch` w `/api/requirements-management/structured/{edit,delete}` dopasowywałby alternatywę po polach, których ona nie ma → zero zmienionych rekordów i komunikat o sukcesie.
- Agregacja w `/structured/[entity]` nie projektowała `options`/`targets` → warianty złożone nigdy nie pojawiłyby się w panelu admina.
- `requirementsEqual` nie znało wariantów złożonych → nie dałoby się ich edytować ani usunąć.
- `EntityRequirementsWarning` filtrowało `kind === "ranked"` → przestałoby ostrzegać o alternatywach i sumach.

**Do uruchomienia u Marka:** `npm test`, `npm run build`. Prisma nie wymaga zmian (`structuredRequirements` to `Json?`, nowe warianty są addytywne — bez `db push`).

**Domknięcie 7.x po pierwszym przeglądzie panelu (2026-07-25):** alternatywa przyjmuje teraz także **dowolny tekst** i sumę jako opcję (bo „Lekka lub średnia zbroja" nie ma celu strukturalnego po żadnej stronie); filtr tekstowy sięga do wnętrza alternatywy; `useAllEntityNames` dostał **umiejętności** — bez nich matcher nie rozpoznawał „spostrzegawczość 5" ani „zastraszanie 4", choć oba to Talenty; wartości pochodne rozrosły się o **unikanie, parowanie, poziom leczenia i twardość**.

---

## Fala 8 — Wymagania licznikowe i sprzętowe `[DOMKNIĘCIE MAPOWANIA]`

> **Źródło:** przegląd niezmapowanych wymagań w `/admin/requirements`, Marek 2026-07-25.
> **Zależy od:** Fala 7 (model wielowariantowy + matcher).
>
> Po Fali 7 pewną sugestię dostaje ~85% wystąpień. Reszta rozkłada się na dwie **spójne rodziny**, które da się zamodelować, i ogon rzeczy, które mają zostać tekstem.

### Podział reszty (dane z `backup/2026-07-19`)

| Rodzina | Teksty | Wystąpienia | Decyzja |
|---|---|---|---|
| Licznikowe („ilość postaw 4", „dwa widmowe manewry") | 27 | 65 | **8.1 — wariant `count`** |
| Sprzętowe („lekka zbroja" 20×, tarcze 12×) | 27 | 72 | **8.2 — grupa `equipment`** |
| Klasa / rasa / status („półepickość", „klasa wojmistrz", „samiec alfa") | 5 | 12 | zostaje tekstem (decyzja Marka) |
| „zastępuje X" | 6 | 6 | **do zastanowienia** — to nie wymaganie, tylko notatka, że encja zastępuje inny manewr |
| Negacje i warunki narracyjne („brak tajnej gardy", „tylko w szarży") | 8 | 8 | zostaje tekstem — wymagałyby operatora NIE i kontekstu walki |

### 8.1 Wariant `count` — „ilość czegoś" — `M` · ⭐⭐⭐

Decyzja Marka: **grupy + tag + minimalna ranga**, bo same grupy pokryłyby tylko trzecią część przypadków.

```ts
{ kind: "count"; groups: EntityRequirementGroup[]; tag?: string; minGrade?: number; value: number }
```

**Tagi w danych potwierdzają wykonalność** (sprawdzone na backupie): `widmowy` (93 manewry), `okrzyki-bojowe` (44), `fechtunek` (93), `tarcze` (19), `girgeński` (10), `ofensywa` (120 atutów). Czyli:

- „ilość postaw 4" → `count(stances) ≥ 4`
- „dwa widmowe manewry" → `count(maneuvers, tag: widmowy) ≥ 2`
- „ilość okrzyków 2" → `count(maneuvers, tag: okrzyki-bojowe) ≥ 2`
- „pięć atutów ofensywnych na poziomie co najmniej 2" → `count(perks, tag: ofensywa, minGrade: 2) ≥ 5`

**Dwa przypadki bez pokrycia w tagach** — do rozstrzygnięcia przed implementacją:
- „ilość postaw i manewrów fizycznych N" (16 wystąpień) — **nie ma tagu `fizyczne`**. Czy chodzi o „niemagiczne", czy trzeba dodać tag?
- „3 manewry wojmistrzowskie" — tag `wojmistrz` istnieje na Atutach, ale nie na Manewrach.

**Filtr:** wymaganie licznikowe nie przekłada się na pytanie „co spełnia postać na randze X". Propozycja: `count` pomijany w filtrze wartościowym, ale wyszukiwalny po grupie i tagu. Do decyzji, tak jak przy sumach.

### 8.2 Grupa `equipment` — sprzęt jako kategoria — `M` · ⭐⭐⭐

Decyzja Marka: **kategoria, nie nazwa przedmiotu** — „co najmniej średnia tarcza" to próg, a nie konkretny egzemplarz.

**Zbroje działają od ręki** — tagi `lekkie` (14), `średnie` (14), `ciężkie` (11) dają naturalny porządek, więc „lekka zbroja" i „co najmniej średnia zbroja" mapują się wprost.

**Broń działa od ręki** — bogata taksonomia tagów: `miecze` (50), `obuchowe` (32), `kłute` (27), `drzewcowe` (19), `topory` (10), `krótkie` (7), `dystansowe` (11), `łuki`, `kusze`, `miotane`.

**⚠️ Tarcze są zablokowane danymi.** Wszystkie 11 tarcz ma **puste tagi** (poza `magiczne`/`legendarne`); rozmiar siedzi wyłącznie w nazwie: Puklerz, Mała Tarcza, Średnia Tarcza, Duża Tarcza, Pawęż. A „co najmniej średnia tarcza" to 12 wystąpień, czyli najliczniejszy pojedynczy wzorzec sprzętowy. Trzy wyjścia:
1. **dotagować tarcze** (`małe`/`średnie`/`duże`) — skrypt + decyzja, gdzie w tej skali są Puklerz i Pawęż oraz 6 tarcz magicznych;
2. porządkować po polu `block` (Puklerz 5 → Mała 7 → Średnia 9 → Duża 11 → Pawęż 13) — działa też dla magicznych, bez ruszania danych;
3. zostawić tarcze tekstem, zamapować tylko zbroje i broń.

Rekomendacja: **(2)** — `block` już koduje rozmiar, jest ciągły i obejmuje tarcze magiczne, których nazwy nic nie mówią.

### Stan wykonania Fali 8 (2026-07-25) — **ZROBIONE**

Wybrano wariant (2): tarcze skalowane po `block` (progi 5 / 7 / 9 / 11 → Puklerz, Mała, Średnia, Duża, Pawęż). `tsc` czysty, asercje przechodzą.

**Skuteczność matchera na backupie 2026-07-19:** 366 tekstów / **1353 z 1413 wystąpień (96%)** — z 1202 przed Falą 8. Zero kolizji do ręcznego rozstrzygania.

Poza `count` i `equipment` doszły dwie rzeczy, które wyszły dopiero z danych:
- **suma zapisana plusem** — „Umysł+Zręczność 3" (10 wystąpień) to dokładnie wariant `sum` z 7.4, tylko matcher go nie czytał;
- **grupa domyślna z tagu** — „ilość okrzyków 2" (16 wystąpień) nie nazywa żadnej grupy, ale `okrzyki-bojowe` występuje wyłącznie na Manewrach, więc tag ją implikuje.

**Trzy pułapki złapane w trakcie:**
- skale zbroi i tarcz są RÓŻNE (`średnia` to tier 2 dla zbroi, ale 3 dla tarcz) — jedna wspólna lista słów dawała cichy błąd o jeden poziom;
- `suggestCount` uruchamiany przed dopasowaniami szczegółowymi przechwytywał „siła zaklęcia 6" jako „sześć zaklęć", bo tekst zawiera stem `zaklę`. Licznik i suma idą teraz **na końcu**, dopiero gdy nic bardziej szczegółowego nie pasuje;
- „Większy Fechtunek 4 lub co najmniej średnia tarcza" **przestało** być nierozwiązywalne — po 8.2 obie strony mają cel, więc jest teraz prawdziwą alternatywą.

**Zostaje tekstem (60 wystąpień):** „Specjalne" (7), „Półepickość" (4), „Miecz lub podobna broń" (4), „Klasa Wojmistrz" (3), „Rękawica na drugiej ręce" (3), „Samiec Alfa" (3) i pojedyncze warunki narracyjne — zgodnie z decyzją.

**Nie zrobione:** „ilość postaw i manewrów **fizycznych**" (16 wyst.) mapuje się na grupy, ale bez tagu — `fizyczne` nie istnieje w danych. Podobnie „manewry wojmistrzowskie" (tag `wojmistrz` jest tylko na Atutach). Obie sprawy wymagają decyzji o tagach, nie o kodzie.

### 8.3 Koniunkcja przez rozbicie wpisu — `S` · ⭐⭐ — **ZROBIONE**

Decyzja Marka: **żadnego wariantu `allOf`** — tablica `structuredRequirements` już jest koniunkcją, więc drugi zapis tego samego znaczenia tylko mnożyłby przypadki w filtrze, audycie i deduplikacji.

Zamiast tego edycja w `/admin/requirements` zwraca **listę**: `replaceStructuredRequirement` przyjmuje jedno wymaganie albo tablicę i wstawia je w miejsce oryginału (z deduplikacją wobec wpisów już obecnych). Endpoint `/structured/edit` przyjmuje `replacements: Requirement[]`, zachowując stare `replacement` dla zgodności. W panelu doszedł przycisk „Dodaj kolejne wymaganie (i)"; ostatniej pozycji nie da się usunąć — od kasowania jest osobna akcja.

**Poprawka matchera przy okazji (test Marka):** „Cios Tarczą 2" — nazwa manewru z rangą — była czytana jako `count(maneuvers, tag: tarcze) ≥ 2`, bo grupa wywnioskowana z tagu nie wymagała żadnego sygnału, że to w ogóle licznik. Wnioskowanie grupy z tagu wymaga teraz jawnego słowa „ilość"/„liczba"; „ilość okrzyków 2" nadal działa, „Cios Tarczą 2" wraca do dopasowania po nazwie.

### 8.4 Poprawki po przeglądzie sugestii w panelu — **ZROBIONE**

Marek przejrzał realne propozycje matchera i wyszły cztery błędy, wszystkie w kategorii „cicha nieprawda":

1. **Negacje mapowane pozytywnie.** „cecha inna niż czarokrwistość" → `czarokrwistość ≥ 1`, czyli dokładne przeciwieństwo treści. Podobnie „brak tajnej gardy" i „brak tarczy". Doszedł zestaw wzorców negujących (`inna niż`, `niż`, `brak`, `bez`, `nie`) — przy trafieniu matcher milczy.
2. **Liczebnik mylony z rangą.** „pięć atutów ofensywnych na poziomie co najmniej 2" → „atuty (ofensywa) — co najmniej **2**", bo `extractRequirementValue` brał pierwszą cyfrę, a „pięć" jest słowem. Kwalifikator „na randze/poziomie N" jest teraz wycinany **przed** szukaniem liczby i trafia do `minGrade`.
3. **„postawa na randze 3" liczone jako trzy postawy.** Marek: „to że ranga musi być odpowiednia". Bez liczebnika ilość wynosi 1, a cyfra jest rangą → `count(stances, minGrade: 3) ≥ 1`.
4. **Sprzęt nieczytelny.** „lekka zbroja" wyświetlało się jako „zbroja ≥ 1", co nic nie mówi recenzentowi. `EquipmentTarget` dostał `tierLabels`, więc czyta się „co najmniej lekka zbroja" / „co najmniej średnia tarcza" — zgodnie z potwierdzeniem Marka, że skala jest progiem (lekka < średnia < ciężka).

Dodatkowo **„dwa miecze" to styl walki, nie dwa miecze** (Marek): nowa wartość pochodna `dualWield` — spełniona, gdy któraś ofensywa ma `secondaryWeapon`. To samo dla „wymagana broń w obu rękach". Kategorie broni rozpoznają też `style` (`Dwuręczny`/`Jednoręczny`), nie tylko tagi.

**Skuteczność: 1342/1413 wystąpień (95%).** Spadek z 1353 jest zamierzony — to sugestie, które wcześniej były po prostu błędne.

### 8.5 Druga runda przeglądu — semantyka sprzętu — **ZROBIONE**

Marek doprecyzował mechanikę po obejrzeniu poprawionych propozycji:

1. **Zbroje to DOKŁADNE kategorie, nie próg.** „lekka zbroja" znaczy lekka — ciężka jej nie spełnia. Trzy osobne cele (`armor.lekka`, `armor.średnia`, `armor.ciężka`) zamiast jednej skali; „lekka lub średnia zbroja" zapisuje się jako alternatywa tych dwóch. **Tarcze zostają progiem** — każdy ich tekst mówi wprost „co najmniej", a Marek potwierdził, że „co najmniej średnia" to średnia albo duża albo pawęż.
2. **„walka dwiema broniami ≥ 1" to bezsens** — to własność zero-jedynkowa. `DERIVED_TARGETS` dostały flagę `boolean`, więc etykieta brzmi po prostu „walka dwiema broniami".
3. **„broń krótkodystansowa" ≠ „broń krótka".** Błędne mapowanie usunięte. Decyzja Marka: to osobny rodzaj broni → nowa kategoria `weapon.krótkodystansowe` z tagiem `krótkodystansowe`. **Żadna broń nie ma jeszcze tego tagu** — otagowanie biblioteki to zadanie na danych; do tego czasu wymaganie po prostu nikogo nie spełnia, zamiast dopasowywać się do czegoś niewłaściwego.

### 8.6 „Zastępuje X" jako relacja, nie wymaganie — **ZROBIONE**

Sprawdzenie danych rozstrzygnęło sprawę: **wszystkie sześć tekstów wskazuje na realne Manewry** — Antyzapał, Młyniec, Zbicie Ciosu, Zapał Wojownika, Zakuty W Stal, Finta. To nigdy nie było wymaganie: nie mówi nic o postaci, tylko że dana encja zastępuje inną.

- **Prisma:** `replaces String[]` na 5 modelach (Perk/Spell/Maneuver/Stance/State). **Wymaga `npx prisma db push` + `npx prisma generate`.**
- **Domena:** `Perk.replaces?: string[]` (spływa do Manewru, Postawy, Stanu, Zaklęcia); `perkMapping.toPerk` czyta defensywnie, tak jak `structuredRequirements`; `perkSchema` dostał opcjonalne pole.
- **Parsowanie:** czysty `replacedEntityName` w `src/domain/characters/replaces.ts` (z testami), żeby skrypt nie był jedynym miejscem z tą regułą.
- **Skrypt:** `npm run extract-replaces` / `:apply` — przenosi wpisy z `structuredRequirements` do `replaces` przez `findRaw` + `$runCommandRaw`, więc **nie zależy od zregenerowanego klienta Prismy**.
- **UI:** `ReplacesView` na karcie encji w Kompendium, wizualnie oddzielony od wymagań — zastąpienie to informacja, nie warunek, którego można nie spełnić.

**Kolejność u Marka:** `npx prisma db push` → `npx prisma generate` → `npm run backup-mongodb` → `npm run extract-replaces` (dry run) → `npm run extract-replaces:apply`.

### 8.7 Naprawa arkusza edycji w adminie — **ZROBIONE**

Zgłoszenie: przy edycji „lekka lub średnia zbroja" na alternatywę dwóch zbroi przycisk „Zapisz" nie reagował.

- **Przyczyna główna:** stopka z przyciskami była **wewnątrz** obszaru przewijanego. Formularz z dwiema opcjami alternatywy rósł poza wysokość okna i „Zapisz" lądował poniżej widocznego obszaru. Stopka jest teraz przypięta poza scrollem.
- **Sheet był za wąski** (`sm:max-w-md`) na wiersz alternatywy — dwa selecty, liczba i przycisk usuwania. Poszerzony do `sm:max-w-2xl`.
- **Żaden błąd zapisu nie był widoczny.** Mutacja nie miała `onError`, więc odrzucony payload albo błąd sieci wyglądały identycznie jak „nic się nie dzieje". Doszedł komunikat i stan „Zapisywanie…".
- Walidacja payloadu sprawdzona osobno: alternatywa dwóch kategorii zbroi przechodzi `requirementSchema` — problem był wyłącznie w UI.

Przy okazji zniknęło pytanie „po co tu 1": pole rangi pokazuje się **tylko tam, gdzie istnieje skala**. Dokładne kategorie sprzętu („lekka zbroja") i wartości zero-jedynkowe („walka dwiema broniami") nie mają już bezsensownego licznika, a przy tarczach etykieta brzmi „Rozmiar (min.)".

**Druga runda — po odsłonięciu komunikatu okazało się, że to `400`.** Payload sprawdzony sondą przez `requirementSchema`: alternatywa dwóch kategorii zbroi przechodzi, więc winne były dwie inne rzeczy:

1. **Pusty wiersz z „Dodaj kolejne wymaganie (i)".** Przycisk zasiewa pusty wpis tekstowy, a `ranklessRequirementSchema` wymaga niepustego tekstu — wystarczyło raz kliknąć i zapis przestawał działać. Wiersze, których edytor nie wypełnił, są teraz odrzucane przed wysyłką; gdy nie zostanie żadne wymaganie, pojawia się komunikat kierujący do akcji usuwania.
2. **„Ilość (licznik)" w liście typów opcji alternatywy.** Odfiltrowałem `anyOf` i `sum`, ale nie `count` — wybranie go dawało `group: "count"`, co nie jest żadną grupą celu i leciało `400`. Warianty złożone nie mogą się zagnieżdżać (patrz `AnyOfOption`), więc `count` też zniknął z tej listy.

Endpoint zwraca teraz **którą stronę** odrzucił (`original` czy `replacement`) i konkretne błędy zod ze ścieżkami, zamiast jednego „Invalid original or replacement requirement".

**Ranga zapisana przed rzeczownikiem.** „Okrzyk 3 poziomu" nie mapował się, bo zabezpieczenie przed „Cios Tarczą 2" wymaga jawnego „ilość"/„liczba", a tu sygnałem jest ranga. `GRADE_QUALIFIER` rozpoznaje teraz obie kolejności — „na randze 3" i „3 poziomu" — a sam kwalifikator rangi wystarcza za sygnał licznika. „Cios Tarczą 2" nie ma takiego słowa, więc pozostaje wykluczone.

### 8.8 Przegląd resztek — co da się zmapować, a co ma zostać tekstem — **ZROBIONE**

Przejrzenie wszystkich pozostałych tekstów pod kątem istnienia odpowiadających encji dało cztery trafienia i jasne uzasadnienie dla reszty.

**Zmapowane (decyzje Marka):**

- **„okazyjny cios 1"** (2) — nie istnieje encja o tej nazwie, ale są `Okazyjny Atak` (Atut) i `Okazyjny Unik` (Manewr). Marek: chodzi o Atut → synonim.
- **„możliwość krytycznego pudła"** (1) — Atut `Krytyczne Pudło` istnieje → synonim.
- **„tylko w szarży"** (1) — Stan `Szarża` istnieje → synonim.
- **„minimalna ranga kości broni to 5"** i **„co najmniej jedna widmowa kość obrażeń"** (po 1) — nowe wartości pochodne `weaponDiceGrade` i `phantomDamage`, liczone ze **wszystkich** kości w ofensywach (obie bronie i oba bonusy do obrażeń), bo widmowa kość albo wysoka ranga może siedzieć na każdej z nich.

**Zostaje tekstem — świadomie:**

- **Negacje** (3): „brak gardy fechmistrza", „brak tajnej gardy", „walka bronią inną niż kopia". Wszystkie wskazują na realne encje, więc operator NIE byłby wykonalny — Marek zdecydował, że trzy wystąpienia nie uzasadniają piątego wariantu w modelu. Źle zrobiona negacja cicho odwraca sens wymagania, a w filtrze Mongo wymagałaby osobnej gałęzi.
- **Warunki o przeciwniku lub sytuacji**: „przeciwnicy muszą mieć możliwość otrzymania krytycznego pudła", „broń z możliwością pchnięć i z głownią". Wymagania opisują postać, nie scenę ani przeciwnika.
- **Porównanie dwóch wartości**: „większa ranga kości obrażeń od kości broni" — model porównuje wartość z liczbą, nie wartość z wartością.
- **Klasa i status**: „klasa rycerz", „klasa wojmistrz", „półepickość", „samiec alfa" — brak odpowiadających encji w bazie i brak pojęcia klasy w modelu postaci.
- **Koniunkcja dwóch klauzul**: „dwa manewry na inicjatywę i dwa manewry na fechtunek" — rozbijane ręcznie w adminie na dwa liczniki (8.3).
- **„rękawica na drugiej ręce"** — model zna listę posiadanych broni, ale nie to, która jest w której ręce.

**Skuteczność końcowa: 1360/1413 wystąpień (96%), 0 kolizji.** Pozostałe 53 wystąpienia to rzeczy, których zamapowanie wymagałoby albo zmiany modelu postaci, albo zgadywania.

**Trzecia runda — i dopiero szczegółowy komunikat (`0.options.0.targetKey: Wybierz cel wymagania`) pokazał sedno.** Selecty celu miały wartość z fallbackiem na pierwszą pozycję listy:

```tsx
value={option.targetKey || EQUIPMENT_TARGETS[0]?.key}   // ŹLE
```

Czyli **select wyświetlał wartość, której nie miał w stanie**. A Radix nie wywołuje `onValueChange`, gdy klikniesz pozycję już zaznaczoną — więc kliknięcie „lekka zbroja" było ignorowane, `targetKey` zostawał pusty, a zapis leciał `400`. Fallback usunięty ze wszystkich selectów celu (sprzęt, wartości pochodne, Moc/Więź) na rzecz `placeholder="wybierz"`, więc pusty cel wygląda jak pusty i klikniecie realnie go ustawia.

### 8.9 Edycja pola `replaces` — picker nazw zamiast martwego pola — `M` · ⭐⭐ — **ZROBIONE**

Zgłoszenie Marka: `replaces` jest w bazie (8.6 przeniosło tam sześć wpisów typu „Zastępuje antyzapał"), jest w domenie, w schemacie i w `ReplacesView` — ale **w arkuszu edycji nie ma czym tego ustawić**. Pole da się dziś zmienić wyłącznie skryptem albo ręcznie w Mongo. Do tego zastąpienie to relacja **encja → encja**, więc wpisywanie nazwy z palca jest zaproszeniem do literówki; ma być picker.

**Decyzje Marka (2026-07-26):**

1. **Picker podpowiada tylko ten sam typ encji** — manewr manewry, postawa postawy, zaklęcie zaklęcia. Wszystkie sześć wpisów w bazie to manewry zastępujące manewry, a wariant „atut zastępuje manewr" nie występuje; gdy się pojawi, dołoży się przełącznik grupy.
2. **Nazwa spoza listy jest dozwolona, ale oznaczona ostrzeżeniem** — trzeba móc wpisać zastąpienie encji, której jeszcze nie ma. Niedopasowana nazwa dostaje wizualny sygnał w edytorze, nie blokadę zapisu.
3. **Pole tylko w edytorach Kompendium** — nie w `PerkEditableFields`, bo ten komponent jest współdzielony z arkuszami postaci, a prywatny manewr na karcie nie ma po co deklarować zastąpień.
4. **Nazwa w `ReplacesView` staje się linkiem** do encji w Kompendium. Relacja odwrotna („Zastępowane przez") — poza zakresem.

**Bez rangi.** Zastąpienie wskazuje na **nazwę**, nie na konkretny stopień — `Młyniec 1` i `Młyniec 3` to ta sama encja z punktu widzenia zastąpienia. Endpoint `/api/entity-names/[entity]` już grupuje po `name`, więc lista jest z natury grade-agnostyczna i nic tu nie trzeba dokładać.

#### Co powstało

- **`EntityNameCombobox` — dwa nowe, opcjonalne propy.** `unknownWarning` zapala bursztynowe obramowanie i ikonę ostrzeżenia, gdy wartość nie odpowiada żadnej nazwie z listy (z etykietą „Brak encji o tej nazwie w Kompendium"); ostrzeżenie **nie pojawia się w trakcie ładowania listy**, bo wtedy każda wartość wygląda na nieznaną. `excludeNames` usuwa nazwy z podpowiedzi — tędy wchodzi zakaz samoodniesienia. Wymagania nie włączają żadnego z nich; tam wolny tekst jest normą.
- **`ReplacesListField`** (`src/application/common/replaces/ReplacesListField.tsx`) — wiersz = `EntityNameCombobox` + „✕", pod spodem „+ Dodaj zastąpienie", grupa **narzucona z góry** zamiast wybieranej w wierszu.
  - **Bez `useFieldArray`.** Wartością jest tablica **stringów**, a field array RHF jest zaprojektowany pod obiekty (jego `fields` nie niosą wartości prymitywu). `useWatch` + `setValue` jest krótsze i przewidywalne.
  - **Samoodniesienie** odcięte przez `excludeNames` z aktualnej wartości pola `name` w formularzu (`useWatch`), więc działa też w arkuszu dodawania, w trakcie pisania nazwy.
- **Puste wiersze odsiewa `perkSchema`, nie edytor.** `replaces` dostało `.transform(trim + filter)`, więc pusty wpis zasiany przyciskiem „dodaj" znika przy zapisie — w **każdym** formularzu opartym o ten schemat (edycja, dodawanie, karta postaci). To dokładnie ta pułapka, która wysypała panel admina w 8.7, tylko rozwiązana raz zamiast w pięciu miejscach. Działa, bo `zodResolver` oddaje RHF-owi **wynik parsowania**, nie surowe wartości — na tym samym mechanizmie stoi dziś `z.coerce.number` przy randze i cenie.
  - **Kolejność ma znaczenie (naprawione 2026-08-02):** `.optional()` musi **owijać** transform, nie go poprzedzać. `z.array(...).optional().transform(...)` daje `replaces: string[] | undefined` jako klucz **wymagany**, co wywala build wszędzie, gdzie obiekt domenowy jest przepisywany do DTO (`Power[]` → `powers` w `useCreateCharacterFromCopy`). Poprawna forma to `z.array(...).transform(...).optional()`.
- **Osadzenie w pięciu edytorach Kompendium** — `ManeuverView`, `StanceView`, `StateView`, `SpellView`, `PerkView` oraz `PerkableAddSheet` (pole renderuje się tam tylko, gdy podano `entityType` — bez niego nie ma z czego podpowiadać).
- **`ReplacesView` dostał prop `group`** i zamienił `<span>` na `<Link href={/compendium/${group}?search=${encodeURIComponent(name)}}>`. To ten sam wzorzec deep-linku, którego używa `DetailsView` dla rasy — osobnych stron encji w Kompendium nie ma i ten etap ich nie wprowadza.

#### Pułapki

- **`defaultValues` gubiło pole.** Wszystkie pięć widoków robiło `defaultValues={{ ...entity, structuredRequirements: … ?? [] }}`. `replaces` dostało tę samą asekurację (`replaces: entity.replaces ?? []`) — bez niej lista startuje na `undefined`.
- **Ścieżka zapisu jest już drożna — sprawdzone.** `perkSchema` ma `replaces: z.array(z.string()).optional()`, więc pole dziedziczą wszystkie DTO (manewr, zaklęcie, postawa, stan, atut); `createCommonRepository.update` przepuszcza całą encję, a wygenerowany klient Prismy zna już `replaces` (`prisma generate` po 8.6 poszło). **Nic w API i w warstwie zapisu nie wymaga zmiany — to zadanie czysto UI-owe.**
- **Cache nazw.** `useEntityNames` trzyma `staleTime: 5 min`. Encja utworzona przed chwilą nie pojawi się od razu w podpowiedziach — dopuszczalne, bo wolny tekst zostaje jako furtka.
- **Wielkość liter — kosmetyka, nie bloker.** Dane z 8.6 są zapisane małą literą („antyzapał"), bo tak brzmiał tekst wymagania, a nazwy encji mają wielkie („Antyzapał"). Link zadziała: `SearchQueryBuilder` buduje `{ contains, mode: "insensitive" }`. Zgrzyta tylko **wyświetlana** nazwa i to, że picker nie uzna „antyzapał" za wpis z listy i zapali ostrzeżenie. Stąd opcjonalny, jednorazowy skrypt normalizujący sześć rekordów do kanonicznych nazw (dry run + `:apply`, wzorem `extract-replaces`) — albo poprawka ręczna w nowym edytorze, skoro właśnie po to powstaje.

#### Testy

- `ReplacesListField.test.tsx` — wiersz na nazwę, komunikat przy pustej liście, dodanie pustego wiersza, zapis wybranej nazwy do tablicy, usunięcie właściwego wiersza, oraz to, co komponent podaje pickerowi (grupa, `unknownWarning`, `excludeNames` z własną nazwą).
- `EntityNameCombobox.test.tsx` — ostrzeżenie domyślnie milczy, zapala się przy nazwie spoza biblioteki, ignoruje wielkość liter, milczy przy pustej wartości i w trakcie ładowania.
- `ReplacesView.test.tsx` — brak `replaces` → `null`; nazwa jako link do `/compendium/<group>?search=<nazwa>`, z poprawnym kodowaniem spacji i polskich znaków.
- `PerkRequirementInputs.test.tsx` — arkusz dodawania pokazuje edytor zastąpień z właściwą grupą i pomija go bez `entityType`.

**Nie uruchomione w tej sesji:** `npm test` i `npx tsc --noEmit` — sandbox nie ma linuksowej binarki `@rollup/rollup-linux-x64-gnu` (`node_modules` z Windowsa), a instalacja jest zablokowana polityką rejestru. Do odpalenia u Marka.

### 8.10 Dogrywki przy Postawach — `M` · ⭐⭐ — **ZROBIONE (2026-08-02)**

Cztery pozycje z etapu 7 planu `combat-lab-engine-model-gaps-plan.md` §1. Każda mała z osobna; razem domykają model postaw po stronie silnika, więc jedyne, czego brakuje Postawom, to autorowane efekty.

**Zmiana postawy w turze.** Akcja typu **ruch**: nie zajmuje ataku ani budżetu manewrów, więc omija `canUseCastable`. Reguła kolejności z podręcznika — zmiana **przed atakiem ALBO po nim, nigdy oba** — siedzi w `runCombat` (fazy 0 i 3), bo tylko tura wie, w którym oknie jesteśmy. Zmiana po ataku zabiera okno przed atakiem w **następnej** turze; flaga jest odczytywana i kasowana na starcie tury, żeby kara nie ciągnęła się przez tury ogłuszone czy spędzone na ziemi.

- **Skąd wybór:** nowy `stanceOptions` w snapshocie, wypełniany z pickera (`StanceRepertoireSelector`). Bez repertuaru silnik nie proponuje zmiany — zachowanie sprzed zmiany zostaje nietknięte.
- **Efekty nowej postawy odpalają się natychmiast**, nie od następnego auto-castu. Inaczej zmiana przed atakiem nie wpływałaby na ten atak, czyli na to, po co to okno istnieje. **Świadome uproszczenie:** bonusy poprzedniej postawy dotrwają do końca tury (są duration-based i wygasają normalnie) — rozplątanie ich wymagałoby znakowania każdego buffa źródłem, czego silnik celowo nie robi.
- **Wycena:** obie polityki liczą różnicę wartości „kandydat − obecna postawa"; `pass` ma 0, więc nikt nie przebiera się między równorzędnymi postawami.

**Wykluczenia (Amok).** Stan `Amok` mówi wprost: „uniemożliwia defensywne postawy i manewry". Nowy efekt `forbidTag` blokuje wszystko, co niesie dany **tag z biblioteki** — celowo tag, a nie zaszyta kategoria, bo „defensywne" to realny tag, a każde kolejne „uniemożliwia X" nie będzie już wymagać zmian w silniku. `duration: 0` znaczy „póki trwa tryb": blokada jest kasowana na starcie tury i natychmiast odnawiana przez auto-cast, więc znika w chwili wyjścia z Amoku. Porównanie tagów ignoruje wielkość liter i spacje — opis pisze człowiek, tagi też.

**Postawy w analizatorach.** Synergy ablatuje teraz także Postawę i Stan (obok manewrów i zaklęć) — postawa, która nic nie wnosi, wychodzi na wierzch. Meta dorobiło ranking Postaw i Stanów: średni win rate buildów, które je noszą, **bez ani jednej dodatkowej walki** (przekrój po rankingu liczonym i tak).

**Edytor efektów Stanów.** `StateView` dostał to samo co `StanceView`: `modeWithEffectsSchema`, `ManeuverEffectsEditableFields` i status mapowania. Wspólny `ModeEffectsInfo` wyciągnięty ze `StanceView`, żeby triage brzmiał identycznie w obu widokach. `statesClient.update` przyjmuje DTO z efektami.

**Testy:** `stanceChange.test.ts` (7 przypadków — brak repertuaru, jedno okno na turę, kara po zmianie po ataku, natychmiastowe efekty, wycena), `forbidTag.test.ts` (7 — z kontrolą, że bez Amoku ten sam manewr jest używany), test tagów rodziny w `modeDefinition.test.ts`, ablacja postawy w `synergy.test.ts`.

**Niezrobione świadomie:** proposer w `classify-maneuvers.ts` nie zna jeszcze wzorca „uniemożliwia … " — `forbidTag` autoruje się ręcznie w edytorze (dotyczy 3 rekordów Amoku).

---

## Fala 10 — Kategorie tagów `[WARSTWA OPISOWA]` — **ZROBIONE (2026-08-07)**

Pełny plan, decyzje i przebieg: **`features-to-implement/tag-facets-plan.md`**. Tutaj skrót.

**Problem.** Żeby znaleźć „manewry ofensywne dla wojaka", trzeba było wybrać `ofensywne` i ręcznie
wykluczyć osiem tagów bestiarnych — i pamiętać o dziewiątym, gdy ktoś go doda.

**Rozwiązanie.** Kolekcje `TagFacet` i `TagDefinition` jako **warstwa opisowa** nad `tags: String[]`,
które nie zmieniają się ani o bajt. Puste kolekcje = zachowanie sprzed Fali 9, usunięcie kategorii
nigdy nie dotyka rekordu encji, a tag bez definicji zawsze widać w kubełku „Pozostałe”.

**Semantyka:** OR wewnątrz kategorii, AND między kategoriami, plus syntetyczne **„— brak —"**
rozwijane serwerowo do `$nin` po pełnej liście tagów kategorii. `rola: ofensywa` + `rodzaj istoty:
— brak —` daje **339** manewrów; `zwierzęta ∪ potwory` daje **147** (nie 117, nie 0).

**Aliasy per encja.** Biblioteka nazywa tę samą oś inaczej po obu stronach: Manewr mówi `nieumarli`,
Postać `nieumarły`, a zwierzęca Postać `natura`. Jedna kategoria, wiele pisowni — bez renamów.
Zawężenie do encji jest konieczne: `natura` znaczy zwierzę na Postaci, ale szkołę magii na Zaklęciu
i Atucie (107 rekordów) oraz materiał na Przedmiocie.

| Etap | Zakres |
|---|---|
| 10.0 | Ujednolicenie słownika (6 renamów) + utwardzenie `rename`/`delete`: sweep personalizacji i wymagań, dwie komendy Mongo zamiast N update'ów, dry-run |
| 10.1 | `TagFacet`, `TagDefinition`, `type TagAlias` + seed (10 kategorii, 85 definicji) |
| 10.2 | `GET /api/tag-facets/[entity]`, CRUD admina z walidacją aliasów, synchronizacja rename/delete z definicjami |
| 10.3 | `tagFacetFilters` w ładunku; warunki liczone RAZ, renderowane na Prismę i na Mongo |
| 10.4 | `FacetedTagFilter` + przełącznik `Kategorie ⇄ Tagi`; **14 list podpiętych** (całe kompendium, sprzęt, Bestiariusz, lista postaci) |
| 10.5 | Zakładka „Kategorie tagów" w `/admin/tags`: kategorie, przypisania, edytor aliasów |
| 10.6 | Raport rozjazdu (`/api/tag-facets/drift`) + test kontraktowy z progiem 10 wystąpień |

**Trzy rzeczy złapane po drodze, każda cicha:**
1. `rename` nie ruszał `quickTagsByContext` — szybkie tagi przestałyby działać bez błędu (3 profile).
2. `searchEntity` dostaje nazwę encji w słowniku **wyszukiwania** (`maneuver`), a kategorie są
   kluczowane słownikiem **zarządzania tagami** (`maneuvers`) — bez `searchEntityToTagEntity` filtr
   przestawał zawężać, bez żadnego objawu.
3. `ofensywa` straciła prawo do domyślnej grupy w matcherze wymagań: po ujednoliceniu siedzi na
   pięciu kolekcjach, więc „ilość ofensywnych 5" przestało cokolwiek znaczyć.

**Migracja wykonana na produkcji 2026-08-07:** `unify-tag-vocabulary:apply` (575 + 240 + 13 + 6 + 3 + 1
rekordów, 3 profile) → `seed-tag-facets:apply` (10 kategorii, 85 definicji).

**Stan końcowy:** `npm test` 201/201 plików, 1882 testy. `tsc --noEmit` czysty.

**Trzy rundy poprawek po podpięciu list** — warto, bo każda była z innej warstwy i tylko jedna była
błędem projektu:
1. `useTagFacets` łamał własną gwarancję („awaria warstwy opisowej nie zatrzymuje filtra"): `data ??
   EMPTY_INDEX` broni tylko przed `undefined`, a odpowiedź **osiągalna, ale o innym kształcie**
   wywalała render i kładła całą listę. Naprawione w kodzie — kształt jest sprawdzany, nie zakładany.
2. Testy czytały klucz zapytania przez `.at(-1)`, zakładając jedno `useQuery` w drzewie. Naprawione
   w teście — produkcja była poprawna, to test opisywał ją zbyt ciasno.
3. Skrypt masowego podpinania **zagnieżdżał** klucz zamiast go rozszerzać, zmieniając kształt klucza
   cache'a na dziewięciu listach. Naprawione w kodzie.

### Fala 10.7 — kategorie magii — **ZROBIONE (2026-08-08)**

**Lista Mocy w kompendium JEST słownikiem tej osi.** Nazwy Mocy to Ogień, Zimno, Altoria,
Błyskawice, Kinetyka, Aramantia, Czarna Magia, Nekromancja, Rdzeń, Vortex, Drążenie, Rozkład —
czyli `ogień` nie jest żywiołem, tylko **źródłem mocy dokładnie tak samo jak `nekromancja`**
(decyzja Marka). Dane to potwierdzają: żaden „żywioł" nie występuje z innym (0 przypadków), a ze
„szkołą" tylko 6 razy na 421 zaklęć. Dlatego **jedna oś, nie dwie.**

Doszły cztery kategorie: **Źródło mocy** (Zaklęcia, Atuty, Moce), **Sposób działania** (obszar,
wielorundowe, ochronne, rozpraszanie, precyzja), **Miejsce noszenia** (Przedmioty) i **Pochodzenie**
(Wierzchowce). Łącznie 13 kategorii i 119 definicji; nieprzypisanych tagów **z 68 na 14**, z czego
istotny jest tylko `specjalne` (17×) — świadomy worek na wyjątki.

**`natura` znaczy trzy różne rzeczy i wszystkie trzy są w bibliotece naraz:** magia natury na
Zaklęciach (55) i Atutach (52), zwierzę na Postaciach (25), naturalny materiał na Przedmiotach (14).
Rozwiązane **zakresem kategorii, bez zmiany danych**: `źródło-mocy` celowo NIE obejmuje Postaci, więc
25 zwierząt nie może wpaść pod magię natury; na Przedmiotach `natura` zostaje nieprzypisana. Kosztem
jest to, że magiczne tagi Postaci (nekromancja, ogień, zimno, błyskawice, altoria, kinetyka — po 6)
zostają w „Pozostałych".

**`natura` jest rodzicem, nie rodzeństwem** — `vortex` 14/14, `grzybowe` 4/4, `drążenie` 4/4,
`liściaste` 1/1 niosą też `natura`. Przy semantyce OR hierarchii nie trzeba modelować: wybór
`natura` obejmuje je wszystkie, wybór podgatunku zawęża.

**`rdzeń` zostaje przy Stylu (decyzja Marka).** To ten sam napis w dwóch znaczeniach — styl walki
(Manewry 33, Atuty 5) i Moc „Rdzeń" (Zaklęcia 20, Postacie 5). Aliasy tu nie pomagają, bo obie nazwy
są kanoniczne. Zamiast renamu: na Zaklęciach ląduje w „Pozostałych", dalej wyszukiwalny w trybie
Tagi. Zero zmian w danych; rename można zrobić kiedykolwiek później.

**Nowy test kontraktowy `defaultTagFacets.test.ts` — „jeden napis, jedna kategoria na encji".**
Zarobił na siebie od razu: złapał, że `zdrowie` trafiłoby naraz do „Cecha" i „Sposób działania" na
Atutach. To jedyna klasa błędu w tej warstwie, która daje **cicho zły wynik** zamiast brzydszego
dropdowna, więc jest teraz pilnowana testem, a nie uwagą.

**Dwie kolizje wyszły dopiero z testu unikalności** (`TagDefinition.tag` jest `@unique`, więc dwie
definicje o tej samej nazwie są niemożliwe do wsiania — nawet dla rozłącznych encji):
- `kusze` i `łuki` były naraz w „Oręż" (Manewry) i „Rodzaj broni" (Bronie). To **jedna oś** — czym
  się walczy — więc kategorie zostały **scalone** w „Oręż" obejmujący Manewry, Atuty i Bronie. Każda
  encja i tak widzi tylko wartości, które naprawdę ma.
- `durski` to styl walki (Manewry 8), więc nie może być też pochodzeniem wierzchowca (1 rekord).

To ważne rozróżnienie: reguła „jeden napis, jedna kategoria **na encji**" i reguła „każdy tag
zdefiniowany **dokładnie raz**" łapią różne rzeczy. Pierwsza złapała `zdrowie`, druga `kusze` —
i żadna nie złapałaby tego, co znalazła druga.

**`rozproszenie` vs `rozpraszanie`** — Moc nazywa się „Rozproszenie", Zaklęcia mówią `rozpraszanie`.
Rozwiązane **aliasem** zakresowanym na Moce, czyli dokładnie tym mechanizmem, dla którego powstał.

Bez kategorii zostają: `specjalne` (17, celowo), `epickie`, `konny`, `konstrukt`, `testy`,
`wojmistrz`, `krasnoludy`, `durski` na Wierzchowcach, `anioł`/`mord` na Mocach (należą do innych
osi), `rdzeń` i `zdrowie` na Zaklęciach.

⚠️ **Kosmetyczna pozostałość po scaleniu:** kategoria `rodzaj-broni` **została w bazie** — seed robi
wyłącznie `upsert`, nigdy nie kasuje. Żadna definicja już na nią nie wskazuje, więc w filtrze jest
niewidoczna (`buildTagFacetIndex` odrzuca kategorie bez wartości), ale widać ją w panelu admina
i w raporcie rozjazdu jako „kategoria bez treści". Do skasowania jednym kliknięciem — nie dotknie
żadnego rekordu encji.

### Fala 10.8 — panel edytowalny w obie strony — **ZROBIONE (2026-08-09)**

Wyszło z realnej pomyłki: `krasnoludy` (Przedmioty) trafiły do kategorii „Pochodzenie" — tej od
Wierzchowców — i **nie było jak tego cofnąć**. Trzy braki naraz, każdy innej wagi.

**Przypisanie było jednokierunkowe.** Lista wyboru kategorii renderowała się wyłącznie dla tagów
bez kategorii; z chwilą przypisania znikała, a rozwinięta karta obsługiwała tylko aliasy. Teraz
`DefinitionRow` ma tę samą listę wyboru (z „— brak —") plus „Usuń definicję" — API miało to od 10.2,
UI nigdy nie wołało. Kasowanie definicji nie rusza wpisów: tag zostaje na rekordach, wraca do
„Pozostałych".

**Kategorii nie dało się edytować** — trzeba było usunąć i utworzyć od nowa, co odpina wszystkie
jej tagi. Doszedł tryb edycji na karcie, na tych samych polach co formularz tworzenia (bez `key`,
bo to on wiąże definicje). Zwężenie zakresu liczy się przed zapisem: „zabierasz Wierzchowce,
N tagów przestanie się tam filtrować".

**Etykieta nie mówiła, czego dotyczy — to była przyczyna pomyłki.** `pochodzenie-wierzchowca`
wyświetlało się jako samo „Pochodzenie", a dla Przedmiotu „pochodzenie krasnoludzkie" ma pełny sens.
Listy wyboru pokazują teraz zakres: „Pochodzenie (Wierzchowce)".

**Najpoważniejsze było jednak to, że przypisanie poza zakres jest ciche.** `krasnoludy` żyją na
Przedmiotach, kategoria obejmowała tylko Wierzchowce — definicja **nie robiła nic**, a tag zniknął
z „Nieprzypisanych", więc raport twierdził, że problem rozwiązany. Dokładnie ta klasa błędu, przed
którą broni się cała ta fala: cichy zły wynik zamiast widocznego. Dwie warstwy obrony — picker
oferuje tylko kategorie sięgające list, na których tag naprawdę występuje, a raport dostał czerwoną
sekcję **„Przypisania bez efektu"** nad nieprzypisanymi.

Przy okazji doszedł czwarty, stonowany kierunek raportu: **„Kategoria nie obejmuje wszystkich list"**
— kategoria sięga części list niosących tag. To pytanie, nie błąd (gdzie nie sięga, tag ląduje
w „Pozostałych" i tryb „Tagi" dalej go znajduje). Grupowane po **(kategoria, lista)**, bo per-tag
dawało 20 wierszy, z czego sześć powtarzało jedno „Źródło mocy nie obejmuje Postaci"; po zgrupowaniu
12 wierszy, każdy = jedna decyzja. Wymusiło też rozstrzyganie spornej pisowni: właścicielem słowa na
danej liście jest definicja, której kategoria tam sięga — inaczej magiczna `natura` „występowała" na
25 Postaciach, choć te należą do `zwierzęta` przez alias.

Przedmioty dostały własną oś **„Pochodzenie"** (`pochodzenie-przedmiotu`) z `krasnoludami` — osobną
od wierzchowcowej mimo tej samej etykiety, bo `durski` to hodowla, a `krasnoludy` wyrób kulturowy
(Królewska Księga Kowalska i Korona Valhangar); zlanie w jedno wstawiłoby `durski` do filtra
Przedmiotów. **Wpis w seedzie sprząta przy okazji bazę** — upsert po `tag` przestawi `krasnoludy`
z błędnej kategorii. Raport wskazał też `natura` na dwóch Rasach (Szaszynszyn, Szczuroszczerk) —
to zwierzę jak na Postaci, więc alias objął też Rasy.

Otwarte pytania, które raport teraz zadaje zamiast milczeć: `natura` na 14 Przedmiotach (naturalny
materiał — osobna oś?), `durski` na jednym Wierzchowcu, oraz czy „Źródło mocy" ma objąć Postaci,
„Cecha" Postawy, a „Styl" Stany. Żadne nie psuje dziś wyników.

### Fala 10.9 — „Pozostałe" da się kliknąć — **ZROBIONE (2026-08-09)**

Raport obiecywał, że nieprzypisany tag nie znika, tylko trafia do „Pozostałych" — a w filtrze
„Pozostałe" było **tekstem do przeczytania** z poradą „szukaj po nich w trybie «Tagi»". Zawężenie po
jednym takim tagu wymagało więc wyjścia z trybu kategorii i **utraty wszystkich dotychczasowych
wyborów**. Teraz to sekcja jak każda inna: suma w środku, iloczyn z kategoriami.

Zrobione jako pseudo-kategoria o zarezerwowanym kluczu `__pozostale__`. Bez „— brak —" — to nie oś.
**Klucz jest obsłużony zanim warunek sięgnie do indeksu**, bo indeks wyszukiwania powstaje bez
`availableTags` (świadomie — inaczej każde zapytanie zaczynałoby się od skanu distinct tagów) i kubeł
jest tam pusty; zwykłe wyszukanie facetu porzuciłoby filtr po cichu i **poszerzyło** wynik.
`hasFacets` liczy tylko prawdziwe kategorie, więc lista mająca sam kubeł nie dostaje przełącznika.

---

## Fala 11 — silnik postaw: zakazy i cechy testowe — **ZROBIONE (2026-08-09)**

Trzy zadania z `features-to-implement/samodzielna-roadmapa.md` (9.1–9.3), wykonane bez decyzji
projektowych i bez dostępu do bazy. Razem odblokowują **19 rodzin postaw / 69 rekordów**.

**`forbidAction` — zakaz rodzaju akcji** (Pełna Defensywna r1–5, Fortyfikacja r1–4, Styl Grupowy
r1–4). `forbidTag` nie wystarczał: ban po tagu działa na wpisy z biblioteki, a atak podstawowy nie
jest wpisem i nie ma tagów — `{ kind: "attack" }` powstaje w `takeTurn` z powietrza. Cztery rodzaje:
atak, manewry, zmiana postawy, zaklęcia. `duration: 0` znaczy „póki tryb jest noszony", tak jak przy
`forbidTag`. Zakaz manewrów obejmuje też **reakcje** — natychmiastowe są zwykle najcenniejsze, więc
wyjątek dla nich byłby dziurą. Faza ataku w `takeTurn` wymagała przebudowy, nie dopisania warunku:
zaklęcie zajmuje akcję ataku, ale to osobny zakaz, a stary fallback wracałby do zakazanego ataku.
Combatant z zakazem i bez alternatywy loguje teraz `pass` z powodem — wcześniej `pass` logował się
tylko przy `!canAct`, więc tura znikałaby bez śladu.

**Żywe atrybuty w testach spornych.** `toCombatantSnapshot` zamraża `skills` przy budowie snapshotu,
a `resolveContestedTest` czytał właśnie tę zamrożoną kopię — więc **każdy** bonus nadany w trakcie
walki był w testach spornych martwy. Doszedł `effectiveSkills`, tą samą drogą, którą ataki od dawna
idą przez `effectiveOffense`. Podmiana dotyczy OBU stron testu, bo `mode: "target"` nakłada profil
o ujemnych wartościach na przeciwnika. Snapshot pozostaje nietknięty — jest współdzielony między
biegami symulacji, więc mutacja zatrułaby kolejne walki tym samym obiektem.

**Komplet cech testowych w `StatBuffEffect`.** Efekt znał trzy atrybuty z dziewięciu i zero
charakterystyk; doszło 6 + 6. Pułapka „pole w aplikatorze, brak w deltach → dwa buffy z tym samym
`id` i ciche nadpisywanie" jest teraz **niemożliwa z konstrukcji**: aplikator, delty i lista pól
edytora czytają jedną mapę z `satisfies Record<keyof Attributes, string>`, więc nowa cecha w modelu
postaci nie kompiluje się, dopóki nie zostanie nazwana.

Dwie rzeczy świadomie zostawione, obie opisane w kodzie: **Harmonia** nie jest cechą w modelu
(w bibliotece to tag stylu walki), więc rodziny Medytacji i Góry zostają niesymulowalne; **wycena AI**
nie widzi atrybutów, bo idzie przez obrażenia i warstwy obrony — symulacja jest poprawna, zachowawczy
jest tylko wybór manewru przez AI.

⚠️ Zod **strzepuje nieznane klucze i zwraca sukces**, więc literówka `fencingg: 2` zapisze się i nic
nie zrobi. Zaostrzenie schematu wywaliłoby wpisy niosące pola z dawnych refaktorów, więc obrona stoi
tam, gdzie wchodzi ręcznie pisany JSON: `import-mode-effects.ts` porównuje klucze przed i po
parsowaniu i odrzuca wiersz z nieznanym polem, nazywając je.

---

## Fala 12 — „tylko to, co ma ta postać" w całym kompendium — **ZROBIONE (2026-08-09)**

Rozszerzenie ROADMAP 2.2 z dwóch list na dwanaście, plus naprawa trzech błędów, przez które
pierwotna wersja w praktyce nie działała.

**Filtr był liczony po stronie klienta, na już wczytanej stronie.** Przy sześciu postawach na ~300
rekordów żadna nie trafiała na stronę 1, więc lista pustoszała i wyglądała na zepsutą. Zawężenie
przeniesione do **zapytania** (`search.name: { in: [...] }` — warstwa payloadu znała to od dawna
przez `anyOfValues`). Tekst z pola „Szukaj" jest **przecinany** z listą posiadanych nazw w JS, bo
Prisma nie przyjmie `contains` i `in` na tym samym polu, a ciche zignorowanie wpisanego tekstu
byłoby gorsze niż brak filtra. Pusta lista posiada­nych wysyła wartość niedopasowywalną — puste
`in` jest **odrzucane** przez `hasSearchValue`, czyli filtr by zniknął i pokazało się całe
kompendium.

**Ranga była ignorowana.** Postać z „Postawą Defensywną 4" dostawała wszystkie pięć rang. Pary
`(nazwa, ranga)` nie da się wyrazić w payloadzie (jedna wartość na pole), więc zapytanie zawęża do
**rodzin** i do **zbioru posiadanych rang**, a dokładna para jest dobierana po stronie klienta.

⚠️ Pierwsze podejście dobierało parę na zwykłej stronie wyników i **strona 1 wychodziła dziwnie
mała**: zapytanie oddawało 10 wierszy wszystkich rang posiadanych rodzin, z czego pasujące bywały
dwa, a reszta doklejała się dopiero przy przewijaniu. Przycięcie po stronie klienta musi więc
dostać **komplet**, nie stronę. Iloczyn (rodziny × rangi) jest ścisłą górną granicą tego, co
zapytanie może zwrócić, więc jest ustawiany jako rozmiar strony — cały repertuar postaci mieści się
w jednym żądaniu (limit 400 wierszy), a `hasMore` przy aktywnym filtrze jest wprost `false`.

**Pętla renderów.** `useCharacterById` wołało `toCharacter(data)` w ciele hooka, więc każdy render
zwracał nowy obiekt; efekt zależny od `character` podnosił stan rodzica i sam się nakręcał
(„Maximum update depth exceeded"). Mapowanie jest zmemoizowane na `data` — to naprawia też picker
w Combat Labie, który miał tę samą wadę, tylko bez efektu, który by ją ujawnił.

**Pusta lista po zdjęciu filtra.** Efekt spinający wyniki ze stanem miał zależności
`[pageNumber, searchResults]`; po powrocie do poprzedniego klucza react-query oddawał **tę samą**
tablicę z cache'a, więc efekt się nie odpalał i lista zostawała pusta do pierwszego przewinięcia.
W zależnościach jest teraz też klucz filtra postaci.

Moce są jedynym wyjątkiem od dopasowania po nazwie: Moc postaci nazywa się po swojemu („Moc
Życiowa") i tylko **wskazuje** na specyfikację („Światło"), więc tam dopasowanie idzie po `id`.
Kontrolka to teraz sam ludek w rozmiarze reszty paska, tuż za filtrem wymagań na wszystkich listach.

---

## Kontekst postaci w kompendium — pierwsze wydanie — **ZROBIONE (2026-10-18)**

Wspólny wybór postaci w bocznym panelu, status posiadania po dokładnym ID i osobny filtr „Tylko posiadane” na wszystkich 12 listach. Kontekst i filtr zachowują się między kategoriami oraz po odświeżeniu w tej samej sesji. Dla manewrów, atutów, postaw i stanów można natychmiast przypinać/odpinać istniejący wpis bez edytowania biblioteki. Wymagania są oceniane dla wybranej postaci i nie blokują dodawania.

Zapis respektuje dostęp i limity kategorii; transakcje chronią przed utratą równoległych zmian. Otwarty wcześniej formularz postaci otrzymuje konflikt 409 zamiast nadpisania nowego repertuaru. Testy obejmują rzeczywistą integrację MongoDB, interfejs, API i sesję. [Analiza, szczegóły wdrożenia i dalszy zakres](features-to-implement/compendium-character-scope-plan.md).

---

## Zależności krytyczne (skrót)

```
0.2  ──►  3.1        (kolejność kalkulacji → modyfikatory obrażeń)
2.4 ─┐
2.6 ─┴►  2.7         (buffy + UI walki → szybki przycisk stanów)
5.1 ──►  5.2 ──► 5.3 ──► 5.4   (refaktor Wymagań: ściśle sekwencyjnie)
5.4 ──►  6.1 ──► 6.2           (bez kompletnych danych multi-filtr jest nieweryfikowalny)
6.1 ──►  7.x                   (sugestie mapowań potrzebują zmigrowanych danych)
7.0 ──►  7.1…7.6               (never-guardy najpierw — inaczej nowe warianty cicho wypadną)
7.3 ──►  7.7                   (operator LUB i filtr w jednym kroku, żeby nie wpuścić regresu)
6.3  ⟂                         (niezależne — czysty UI, można zrobić kiedykolwiek)
4.x  ⟵ wzorzec: mechanizm widoczności z features-to-implement/done
```

## Rekomendowana kolejność sprintów

1. **Sprint 1 (fundament):** 0.1, 0.2 + Fala 1 quick wins (1.1–1.5).
2. **Sprint 2 (widoczne UI):** 1.6, 1.7, 1.8, 2.1, 2.2.
3. **Sprint 3 (mechaniki postaci):** 2.3, 2.4, 2.5, 2.8.
4. **Sprint 4 (walka + zaawansowane):** 2.6, 2.7, 3.1, 3.2.
5. **Sprint 5 (custom content):** 4.1.
6. **Sprint 6 (core refactor):** 5.1 → 5.2 → 5.3 → 5.4.
7. **Sprint 7 (domknięcie):** 6.1 → 6.3 → 6.2.
8. **Sprint 8 (rozszerzenie Wymagań):** 7.9 → 7.5 (+ 7.6 pkt 5) → 7.0 → 7.1 → 7.2 → 7.3 → 7.7 → 7.4 → 7.6 → 7.8.

## Definition of Done (globalne)

- Kod typowany (TypeScript), spójny z istniejącą architekturą (`src/domain`, `src/application`, `src/infrastructure`).
- Testy (Vitest) dla nowej logiki mechaniki; istniejący zestaw zielony.
- `next build` bez błędów; brak regresji w kluczowych widokach (Postacie, Kompendium, Combat Lab).
- Zmiany schematu (Prisma) z migracją i — gdy dotyczy — skryptem backfill w `scripts/`.
