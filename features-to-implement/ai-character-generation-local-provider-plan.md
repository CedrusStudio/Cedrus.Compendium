# Plan: lokalne generowanie postaci przez AI (provider plikowy)

Stan repo: 2026-08-03. Plan wykonawczy dla wariantu „robię to sam, w ramach subskrypcji, a apka tylko odbiera wynik”.

## Po co

Trzy rzeczy, których hostowana ścieżka nie rozwiązuje same z siebie:

1. **Kontekst.** `MAX_CHARACTER_GENERATION_CONTEXT_CHARS` to 60 000 znaków. Po odjęciu do trzech pełnych postaci referencyjnych i fragmentów podręcznika katalog dostaje resztę, więc `selectCatalogEntries` musi wycinać. Model z długim oknem może dostać całe kompendium naraz i sam zdecydować, co jest trafne.
2. **Koszt iteracji.** Dopóki jakość promptu nie jest ustalona, każde podejście kosztuje. Subskrypcja zdejmuje presję z eksperymentów.
3. **Praca wsadowa.** „Przeanalizuj backup i powiedz, czego brakuje w kompendium” to inne zadanie niż „zbuduj jedną postać” — nie ma sensu wtłaczać go w endpoint HTTP z rezerwacją budżetu i TTL draftu.

## Czego **nie** robimy

Nie omijamy `aiCharacterProposalSchema`, `normalizeAiProposalIdentifiers` ani `acceptAiCharacterDraftInTransaction`. To jest cała siatka, która pilnuje, żeby draft nie wpisał do kompendium wymyślonego miecza. Wariant „apka czyta plik z wynikiem i sama coś dodaje” tę siatkę wyrzuca — dlatego plan wchodzi **przez istniejący interfejs providera**, a nie obok niego.

## Punkt wejścia

`createCharacterGenerationProvider()` (`src/infrastructure/ai-character-generation/createCharacterGenerationProvider.ts`) rozgałęzia się dziś po `aiCharacterGenerationSettings.provider` na `openai` i `ollama`. Trzecia gałąź `local` dostaje implementację `CharacterGenerationProvider`, która nie dzwoni nigdzie — czyta plik.

Kontrakt jest już spełniony przez resztę systemu: provider dostaje `CharacterGenerationContext`, oddaje `{ proposal, usage, costMicroUsd }`. Draft, akceptacja, walidacja referencji i podgląd działają bez żadnej zmiany.

## Etap 1 — Katalog wyjściowy dla mnie

Skrypt `scripts/dump-ai-character-context.ts`, wzorem istniejących skryptów z `package.json` (uruchamiane przez `node --experimental-strip-types`, nie `tsx`).

Wypisuje do `ai-workspace/context/` (folder w `.gitignore`):

- `catalog.json` — pełny wynik `loadAiCharacterCatalog()`, bez filtrowania trafnością. To jest ta przewaga nad ścieżką hostowaną.
- `rulebook.md` — sekcje z `loadAllSections()` sklejone w jeden plik.
- `proposal.schema.json` — `aiCharacterProposalStrictJsonSchema`, żeby model wiedział, w co ma trafić.
- `references/{shortName}.json` — postacie referencyjne, jeśli akurat są potrzebne.

Ten sam skrypt obsługuje pytanie o backup: dostaje flagę `--from-backup <ścieżka>` i zamiast Prismy czyta zrzut z `scripts/backup-mongodb.ts`. Wtedy nie potrzebuje działającej bazy.

## Etap 2 — Provider plikowy

`src/infrastructure/ai-character-generation/LocalFileCharacterGenerationProvider.ts`:

```
name = 'local'
generate(context):
  1. zapisz context do ai-workspace/requests/<timestamp>.json  (żebym wiedział, o co pytać)
  2. przeczytaj ai-workspace/drafts/<nazwa>.json
  3. zwróć { proposal: JSON.parse(...), usage: { inputTokens: 0, outputTokens: 0 }, costMicroUsd: 0 }
```

Parsowanie i normalizacja zostają tam, gdzie są — w `generate` wołamy `normalizeAiProposalIdentifiers` z tymi samymi opcjami co pozostałe providery, a `aiCharacterProposalSchema.parse` dalej jest ostatnią bramką. Brak pliku → `LocalCharacterGenerationProviderError` z komunikatem mówiącym, gdzie go położyć.

Ustawienia: `AI_CHARACTER_PROVIDER=local` + `AI_LOCAL_DRAFT_DIR` w `aiCharacterGenerationServerSettings.ts`, obok istniejących `getOpenAi…` / `getOllama…`.

**Rozstrzygnięte:** provider **nie czeka** na plik. Brak pliku to natychmiastowy błąd z instrukcją, gdzie go położyć — żadnego pollingu, żadnego trzymania otwartego żądania HTTP. Przepływ jest dwutaktowy: kliknięcie zrzuca kontekst i kończy się komunikatem, ja przygotowuję draft, drugie kliknięcie go wczytuje. W UI przycisk w trybie `local` czyta „Wczytaj przygotowany draft”.

Konsekwencja dla budżetu: skoro `costMicroUsd` wynosi 0, rezerwacja w `reserveAiGenerationBudget` przechodzi bez zużycia, a nieudane wczytanie zwalnia ją tą samą ścieżką co każdy inny błąd providera (`releaseAiGenerationBudget` w `catch`). Nic tu nie trzeba zmieniać.

## Etap 3 — Tryb wsadowy: czego brakuje w kompendium

To osobne narzędzie, nie provider. `scripts/audit-compendium-gaps.ts` przyjmuje katalog plików `ai-workspace/proposals/*.json` (wynik mojej pracy z modelem) i raportuje:

- wpisy, które model nazwał, a których nie ma w kompendium (po nazwie i randze),
- wpisy istniejące, ale bez `structuredRequirements`,
- kolizje `@@unique([name, grade])` przed importem.

Report destination: `ai-workspace/reports/gaps.md`. Import remains an explicit reviewed operation. Current bulk content writes use [ID/hash guarded review bundles](../scripts/README.md#guarded-content-change-sets); legacy CSV scripts are previews and refuse `--apply`.

## Etap 4 — Higiena

- `.gitignore`: cały `ai-workspace/`.
- `ai-workspace/README.md` (już nie ignorowany) opisujący przepływ, żeby po trzech miesiącach było wiadomo, co gdzie leży.
- Provider `local` **nie może** być domyślny w `aiCharacterGenerationSettings` — brak konfiguracji ma dalej rzucać `AiCharacterGenerationProviderUnavailableError`.

## Kolejność i koszt

Etap 1 jest samodzielnie użyteczny — daje mi zrzut katalogu do wklejenia w rozmowę z modelem, nawet zanim powstanie provider. Etap 2 to około 80 linii plus ustawienia. Etap 3 jest największy i najmniej pilny; ma sens dopiero, gdy z etapu 1–2 wyjdzie, że kompendium faktycznie ma dziury warte hurtowego uzupełnienia.

## Czego ten plan nie rozstrzyga

- **Prywatne encje.** Wpisy tworzone pod zgodą `allowCustomEquipment` / `allowCustomAbilities` powstają jako **publiczne** i tak zostaje. Możliwość zrobienia ich prywatnymi zapisana jest jako ROADMAP §4.2, zależna od §4.1 — do rozważenia, nie do zrobienia.
- **Statystyki.** Ani lokalny provider, ani katalog nie mówią modelowi, ile punktów ma postać na starcie. Dopóki podręcznik nie niesie budżetu punktowego w formie, którą da się zacytować, „za dobre statystyki” zostaje kwestią oceny przy przeglądzie draftu.
