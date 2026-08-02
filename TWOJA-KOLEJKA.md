# Twoja kolejka — co wymaga Ciebie

Stan na 2026-08-02. Wszystko, czego nie mogę zrobić sam: bo wymaga dostępu do produkcyjnej bazy, kliknięcia w UI, decyzji projektowej albo commita.

Skreślaj pozycje w miarę robienia. Rzeczy, które mogę zrobić ja, są na końcu.

---

## 1. Zamknięcie dzisiejszej pracy

- [ ] **Commit — dwa osobne.** 37 pozycji w `git status`; wrzucone razem będą nieczytelne.
  - **(a) higiena repo:** `.gitattributes`, `.gitignore`, usunięte 62 śmieci (`.vitest-*.json`, `.fuse_hidden*`, puste `tsconfig.repro/scratch`, `__repro.ts`), `README.md`, `scripts/README.md`, usunięty `TODO.md`, przeniesione 9 planów do `features-to-implement/done/`, `tsconfig.scoped.json` + skrypty `typecheck`.
  - **(b) silnik postaw (ROADMAP §8.10):** zmiana postawy w turze, `forbidTag`, Postawy/Stany w Synergy i Meta, edytor efektów Stanów, `scripts/fix-mismapped-strength.ts`.
- [ ] **Zdecyduj, czy commitować CSV-ki klasyfikacji.** `maneuver-classification.csv` przegenerowałem na świeższym backupie, doszły `postawy-classification.csv` i `stany-classification.csv`. Są wejściem do autorowania, więc raczej tak — ale to Twoja decyzja, bo ważą ~300 KB.

## 2. Baza — do odpalenia u Ciebie

Sandbox nie ma dostępu do Mongo, więc każdy skrypt piszący jest po Twojej stronie. **Zawsze najpierw `npm run backup-mongodb`.**

- [ ] **`npm run fix-mismapped-strength`** (dry run) → **`:apply`**. Usuwa nadmiarowe `siła ≥ N` z `Pogromienie` r1–3 i `Napór Włóczniarza` r1–2 (5 rekordów). Zostały po ręcznej poprawce w panelu: dobry wpis doszedł, zły nie zniknął. Skrypt nie ruszy rekordu, w którym siła jest jedynym wymaganiem — wtedy krzyknie, że poprawne wymaganie nigdy nie zostało dodane.

## 3. Klik po UI — czego nie zobaczę

- [ ] **Pole „Zastępuje"** w Kompendium: otwórz manewr → edycja → dodaj zastąpienie → zapisz → sprawdź, czy plakietka linkuje do właściwej listy.
- [ ] **Edytor efektów Stanów**: `/compendium/states` → edycja → sekcja efektów powinna wyglądać jak w Postawach, ze statusem „do zmapowania".
- [ ] **Repertuar postaw w Combat Lab**: picker postaci → „Postawy do zmiany w walce" → dodaj drugą postawę → uruchom symulację → w Replayu powinny pojawić się wpisy „zmienia postawę … (przed atakiem / po ataku)".

## 4. Decyzje projektowe — bez nich nie ruszę dalej

### 4.1 Postawy, grupa A — dwa pytania (trzecie odpadło)

Pełny kontekst: `features-to-implement/postawy-autorowanie.md`.

- [ ] **„Odporność na zaklęcia 2" (Postawa Antymagiczna).** Model zna jedną `resistance`, bez typu obrażeń. Zapisać jako zwykłą odporność (będzie działać też przeciw broni — za mocno), czy oznaczyć niesymulowalną, dopóki odporności nie dostaną typu?
- [ ] **Widmowa kość obrażeń** (Widma, Profesty, Wirtuoza, Zondro, Cienisty Assasyn — 13 rekordów). `stat.diceGrade` podnosi rangę kości **wiodącej**; dla kości widmowej nie ma pola. Dorobić `phantomDice` w `StatBuffEffect`, czy na razie przybliżyć płaskim `damage`?

> **Pytanie o odporność vs redukcja — odpowiedziałem sobie sam z podręcznika**, nie musisz go rozstrzygać. `system-walki.json`: odporność odejmowana jest **pierwsza**, od obrażeń każdego rodzaju poza śmiertelnymi i nieuchronnymi, i działa per źródło; redukcja to **suma** uników, parowania, blokowania i redukcji ze zbroi. Silnik robi dokładnie to (`reduceDamage`). Czyli: „odporność" → `resistance`, a „±N redukcji" w opisie postawy → `protection` (pancerz), bo to jedyna warstwa redukcji niezwiązana z konkretną akcją obronną. Powiedz tylko, jeśli się z tym nie zgadzasz.

### 4.2 Prywatne encje Kompendium (ROADMAP 4.1)

- [ ] **Kolizja `@@unique([name, grade])`.** Gdy gracz stworzy prywatny manewr o nazwie istniejącego publicznego, zapis padnie. Czy unikalność ma obejmować właściciela (`[name, grade, apiKey]`), czy prywatne nazwy mają pozostać globalnie unikalne (czytelny komunikat „ta nazwa jest zajęta")? Bez tej decyzji nie zaczynam — reszta planu jest gotowa.

## 5. Autorowanie efektów — praca redakcyjna, tylko Twoja

Po decyzjach z 4.1 mogę przygotować propozycje, ale **zatwierdzenie treści to Ty**. Kolejność z `postawy-autorowanie.md`:

- [ ] Przegląd 31 rodzin grupy A w `postawy-classification.csv` (kolumna `approve`).
- [ ] `node --experimental-strip-types scripts/import-mode-effects.ts stance postawy-classification.csv --apply`
- [ ] `npm run copy-effects-across-grades` → `:apply` (rozlanie na pozostałe rangi; **skalowanie nie jest liniowe**, liczby trzeba przejrzeć).
- [ ] `npm run maneuver-coverage` — kontrola postępu.
- [ ] **Amok ręcznie w edytorze** — proposer nie zna wzorca „uniemożliwia …", więc `forbidTag` z tagiem `defensywne` wpisujesz sam (3 rekordy).

## 6. Higiena, do rozważenia

- [ ] `npm i baseline-browser-mapping@latest -D` — build ostrzega, że dane mają ponad dwa miesiące.
- [ ] Rozważ dodanie `npm run typecheck:scoped` do CI — łapie w ~40 s to, na co pełny `next build` potrzebuje minut.

---

## Co mogę zrobić sam, bez czekania na Ciebie

Rozpisane z detalami implementacyjnymi w **`features-to-implement/samodzielna-roadmapa.md`** (Fala 9: pliki, linie, kształty typów, pułapki, testy). Skrót:

1. **`forbidAction`** — nowy efekt blokujący akcję („nie można atakować"). Odblokowuje Pełną Defensywną, Fortyfikację i Styl Grupowy (3 rodziny / 13 rekordów). Mały, dobrze określony, żadnej decyzji nie wymaga. Kształt gotowy — `forbidTag` napisany dziś jest wzorcem.
2. **Słownik atrybutów w `StatBuffEffect`** — `fencing`, `artifice`, `willpower`, `fortitude`, `martialArt` + charakterystyki. `BuffProfile` ma już te pola, `statEffectToProfile` używa trzech z dziewięciu. Odblokowuje 16 rodzin / 56 rekordów, czyli największą zablokowaną grupę postaw.
3. **Żywe wartości w testach spornych** — dziś `resolveContestedTest` czyta `snapshot.skills` zamrożone przy budowie snapshotu, więc bonus „+1 fechtunek" nie dotarłby do testu. Bez tego punkt 2 byłby udawaniem. Zmiana w jednym miejscu, wzorowana na `effectiveOffense`/`effectiveDefense`.
4. **Propozycje efektów dla grupy A** — wypełnię `postawy-classification.csv` konkretnym JSON-em dla 31 rodzin, żeby Twój przegląd był serią „tak/nie", a nie pisaniem od zera.
5. **Oznaczenie grup D i E jako niesymulowalne** — przygotuję wiersze CSV z `simulatable: false` i powodem („efekt drużynowy — silnik 1v1", „modyfikacja kosztu manewrów — poza modelem"), zostanie Ci sam import.
