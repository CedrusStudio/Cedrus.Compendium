# Warsztat lokalnego generowania postaci

Wszystko poza tym plikiem jest ignorowane przez gita. Folder służy do przygotowania
wersji roboczej postaci poza aplikacją i wczytania jej z powrotem.

Po co: hostowana ścieżka musi zmieścić kompendium w 120 000 znaków promptu, więc
`selectCatalogEntries` wycina wpisy po trafności — z 2528 wpisów kompendium do
kontekstu trafia około 310. Zrzut z tego folderu jest pełny.

## Włączenie

**W interfejsie nie ma przełącznika i nie będzie.** Provider jest ustawieniem
serwera, bo decyduje o tym, czy aplikacja w ogóle woła płatny model — to nie jest
wybór, który powinien należeć do osoby klikającej „Wygeneruj". Strona
`/characters/add` czyta `aiCharacterGenerationSettings.provider` po stronie
serwera i przekazuje go do widoku, który wtedy zmienia treść przycisku i opis.

W `.env`:

```
AI_CHARACTER_GENERATION_ENABLED=true
AI_CHARACTER_PROVIDER=local
AI_LOCAL_WORKSPACE_DIR=ai-workspace      # opcjonalne, to jest domyślna wartość
AI_LOCAL_MODEL_LABEL=claude-opus-5       # opcjonalne, tylko etykieta w drafcie
```

Po zmianie trzeba zrestartować serwer deweloperski — `.env` czytany jest przy
starcie procesu. Jeżeli `AI_CHARACTER_PROVIDER` nie jest ustawione, obowiązuje
`openai` i dlatego ekran wygląda dokładnie tak jak wcześniej.

W produkcji `AI_LOCAL_WORKSPACE_DIR` wskazuje katalog dostępny i zapisywalny dla
procesu serwera. Next.js celowo nie dołącza jego zawartości do builda ani nie śledzi
całego projektu z powodu runtime'owej ścieżki dostępu do plików. Przy providerze
`local` przygotuj więc `drafts/draft.json` w katalogu dostępnym dla uruchomionej
aplikacji; format i sposób ustawienia zmiennej pozostają bez zmian.

## Układ

```
ai-workspace/
  context/
    instructions.md        zasady, które dostaje model hostowany — te same, nie skrót
    catalog.json           pełne kompendium (2528 wpisów) w formie, którą widzi model
    proposal.schema.json   schemat, w który draft musi trafić; opisy pól są częścią zasad
    balance-profiles.json  mediany i p90 dla postaci o danym tagu, liczone z kompendium
    power-scales.json      drabiny mocy: wojownik, mag, nieumarły, bestia
    rulebook.md            podręcznik sklejony w jeden plik
  requests/
    <znacznik-czasu>.json  kontekst żądania — jeden plik na kliknięcie, stare zostają
  drafts/
    draft.json             TU kładziesz gotową propozycję
```

`context/` odświeżasz zrzutem, `requests/` zapisuje aplikacja, `drafts/` wypełniasz Ty.

## Przepływ

1. Zrzuć kontekst:

   ```
   node --import ./scripts/ts-alias-hooks.mjs scripts/dump-ai-character-context.ts
   ```

   Bez działającej bazy: `--from-backup=backup/<znacznik-czasu>`.

2. Wejdź na `/characters/add`, wybierz „Generuj z AI" i kliknij. Przy providerze `local`
   przycisk nazywa się **„Wczytaj przygotowaną wersję roboczą"**, a nad nim jest opis
   tego przepływu — jeżeli widzisz „Wygeneruj wersję roboczą" i ostrzeżenie o budżecie
   API, to znaczy, że provider jest wciąż ustawiony na `openai`.

   Kolejność jest istotna: provider **najpierw** zapisuje kontekst żądania do `requests/`,
   a dopiero **potem** szuka pliku draftu. Dlatego ten błąd jest przekazaniem pałeczki,
   a nie awarią — zapis kontekstu to pożyteczna połowa nieudanego wywołania.

3. Weź **najświeższy** plik z `requests/` — każde kliknięcie dokłada nowy, nazwany
   znacznikiem czasu, i stare nie znikają.

   Ten plik zawiera wszystko, co dostałby model hostowany:

   | klucz | co to jest |
   |---|---|
   | `request` | Twój opis z formularza dosłownie, „dodatkowe ograniczenia" i identyfikatory referencji |
   | `references` | wybrane postaci w całości: cechy, atuty, manewry, postawy, zestawy walki |
   | `allowedCatalog` | wpisy kompendium wybrane pod ten opis (z 2528 zwykle ~310), z wymaganiami |
   | `rulebookContext` | fragmenty podręcznika dobrane do opisu |
   | `balanceProfiles` | mediany, p90 i maksima dla postaci o tych samych tagach |
   | `powerScale` | drabina rodziny: wojownik, mag, nieumarły albo bestia |
   | `powerTier` | **wyliczony z Twojego opisu** — „wyróżniający się" daje specjalność 8, 15 manewrów, 4 atuty |

   `powerTier` bywa zaskoczeniem: nie podajesz go w formularzu, `selectPowerTier` czyta go
   ze słów w opisie. Jak go nie ma, znaczy że opis nie nazwał poziomu i zostają same profile.

4. Przygotuj propozycję z modelem. Podaj mu `context/instructions.md`, `context/catalog.json`,
   `context/proposal.schema.json`, `context/balance-profiles.json`, `context/power-scales.json`
   i ten plik z `requests/`. Zapisz wynik jako `drafts/draft.json`.

   `instructions.md` nie jest opcjonalne — to dokładnie ten sam zestaw reguł, który idzie
   do OpenAI, i prawie każda pozycja jest naprawą błędu, który realny draft popełnił.
   Draft przygotowany bez nich odpowiada na inny brief.

   **Kto przenosi pliki, zależy od tego, jakiego modelu używasz.** Agent z dostępem do tego
   repozytorium czyta `requests/` i zapisuje `drafts/draft.json` sam — wystarczy mu
   powiedzieć, że kliknąłeś, bo **nikt nie obserwuje folderu** i samo kliknięcie nie jest
   dla niego żadnym sygnałem. Model w oknie czatu albo w LM Studio niczego nie widzi:
   wtedy kurierem jesteś Ty.

5. **Sprawdź draft, zanim go wczytasz:**

   ```
   npm run verify-ai-draft
   ```

   Bierze najświeższe żądanie i `drafts/draft.json`, przepuszcza je przez te same
   walidatory, których użyje serwer — normalizację identyfikatorów, kontrakt Zod,
   walidację akceptacji, wymagania, mechanikę walki i porównanie z profilem balansu —
   i wypisuje dokładnie to, co zobaczysz potem w podglądzie. Wymagania czyta z
   najnowszego katalogu w `backup/`, więc warto mieć świeżą kopię.

   To jest jedyna realna przewaga tego trybu nad hostowanym: model płatny odpowiada
   raz i na ślepo, a draft leżący w pliku można poprawiać, aż walidatory zamilkną.

6. Kliknij **„Wczytaj przygotowaną wersję roboczą"** ponownie. Draft przechodzi tę samą
   normalizację identyfikatorów i tę samą walidację Zod co odpowiedź z OpenAI, więc nie da
   się nim wprowadzić niczego, czego nie wprowadziłaby ścieżka hostowana. Niespełnione
   wymagania i nietypowa mechanika nie blokują wczytania — lądują w „Do poprawienia po zapisie".

7. Zanim zaczniesz następną postać, kliknij **„Usuń przygotowaną wersję roboczą"**.

   Wczytanie **nie kasuje** `draft.json` — celowo, żeby nieudany przegląd dało się powtórzyć.
   Cena jest taka, że kolejne kliknięcie po cichu wczyta tę samą postać, co wygląda jak
   ignorowanie żądania. Przycisk stoi w kaflu trybu lokalnego i mówi, czy było co usuwać.

## Uwagi

- Identyfikatory z `catalog.json` kopiuj dosłownie. Wpis spoza katalogu zostanie odrzucony,
  chyba że żądanie miało włączone `allowCustomEquipment` lub `allowCustomAbilities`.
- Identyfikatory, które draft wymyśla sam — zestawy obrony i ataku, profile wzmocnień —
  mogą być dowolnymi etykietami (`"def-1"`, `"off-1"`). Serwer mint uje prawdziwe ULID-y
  i przepisuje `defaultDefenseId` oraz `defaultOffenseId`.
- `costMicroUsd` wynosi 0, więc rezerwacja budżetu przechodzi bez zużycia. Tryb lokalny nie
  ma też pętli poprawki, którą ma ścieżka hostowana — nie ma czego zapytać drugi raz.
- Po wczytaniu draft ląduje w zwykłej ścieżce przeglądu — zatwierdzenie dalej sprawdza
  wszystkie referencje w transakcji.
- `context/` starzeje się razem z kompendium i z regułami promptu. Po każdej zmianie
  w `characterGenerationInstructions.ts` albo w kompendium odpal zrzut ponownie, inaczej
  draft odpowiada na nieaktualny brief.
