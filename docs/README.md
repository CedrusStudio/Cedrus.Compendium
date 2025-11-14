# 📚 Dokumentacja Migracji Bestiariusza

## 🎯 Przegląd

Ten folder zawiera kompletną dokumentację planu migracji danych z pliku Excel **"Bestariusz Brata Zakonnego Zondro.xlsm"** do formatu JSON zgodnego ze schematem TypeScript `Character`.

---

## 📄 Dokumenty

### 1. **MIGRATION_SUMMARY.md** ⭐ START HERE
**Szybkie podsumowanie całego projektu migracji.**

- ✅ Co zostało zrobione
- ⏳ Co należy zrobić dalej
- 🎯 Najważniejsze informacje
- 🔗 Linki do pozostałych dokumentów

**Zacznij od tego dokumentu**, aby uzyskać szybki przegląd.

---

### 2. **BESTIARY_MIGRATION_PLAN.md** 📋 PLAN GŁÓWNY
**Kompletny, szczegółowy plan migracji z systemem referencji.**

**Zawiera:**
- 📊 Analiza źródła danych (struktura Excel)
- 🔗 **System referencji** - klucz główny `name` + `grade`
- 🗺️ Mapowanie pól Excel → Character TypeScript
- 🔧 Architektura rozwiązania (3 główne skrypty + parsery)
- 📝 Przykłady parsowania dla każdego typu danych
- ⚠️ Wyzwania i przypadki brzegowe
- 🧪 Plan walidacji
- ✅ Checklist implementacji (10 kroków)

**Użyj tego dokumentu** jako głównego przewodnika podczas implementacji.

---

### 3. **REFERENCE_SYSTEM.md** 🔗 SYSTEM REFERENCJI **[NOWY]**
**Szczegółowy przewodnik po systemie referencji zamiast duplikacji obiektów.**

**Zawiera:**
- 🎯 Koncepcja: referencje `{ name, grade }` zamiast pełnych obiektów
- 🔑 Klucz główny i jego parsowanie
- 📊 Typy TypeScript dla wszystkich referencji
- 🔧 Implementacja `referenceParser.ts`
- 🗺️ Mapowanie z Excel (manewry, perki, ekwipunek)
- ✅ Walidacja referencji (`validate-references.ts`)
- 🎨 Zalety: 85% oszczędności miejsca!
- 🚀 Workflow frontend (hydratacja)

**Użyj tego dokumentu** przed implementacją parserów dla manewrów/perków/ekwipunku.

---

### 4. **FIELD_MAPPING_REFERENCE.md** 🗺️ SZCZEGÓŁOWE MAPOWANIE
**Referencja techniczna - szczegółowe mapowanie każdego pola.**

**Zawiera:**
- 📋 Tabele odniesienia dla każdej sekcji Character
- 💻 Kompletny kod TypeScript dla wszystkich parserów
- 🔍 Wzorce regex z wyjaśnieniami
- 📝 Przykłady parsowania krok po kroku
- ✅ Funkcje walidacyjne
- ⚠️ Obsługa przypadków brzegowych

**Użyj tego dokumentu** jako referencji technicznej podczas pisania kodu parserów.

---

### 5. **PRISMA_INTEGRATION.md** 🗄️ INTEGRACJA Z BAZĄ DANYCH **[NOWY]**
**Strategia integracji migracji z Prisma i MongoDB.**

**Zawiera:**
- 🎯 Dwa podejścia: Direct import vs JSON seed
- 🔗 System referencji w Prisma (`@@unique([name, grade])`)
- 🔧 `ReferenceResolver` - klasa do resolve name+grade → ID
- 📊 Kompletne przykłady kodu dla obu strategii
- ⚠️ Przypadki brzegowe (brakujące referencje, duplikaty)
- 📈 Porównanie opcji i rekomendacje
- ✅ Workflow krok po kroku

**Użyj tego dokumentu** do zrozumienia jak zmigrować dane do MongoDB przez Prisma.

---

## 🗂️ Struktura Projektu Migracji

```
character-sheet/
├── docs/                                      # 📚 TEN FOLDER
│   ├── README.md                               # Ten plik
│   ├── MIGRATION_SUMMARY.md                    # ⭐ START HERE
│   ├── BESTIARY_MIGRATION_PLAN.md              # 📋 Plan główny
│   └── FIELD_MAPPING_REFERENCE.md              # 🗺️ Mapowanie pól
│
├── scripts/                                   # 🔧 Skrypty
│   ├── analyze-bestiary-excel.ts               # ✅ Gotowe: Analiza Excel
│   ├── parse-bestiary-excel.ts                 # ⏳ TODO: Parse do Raw JSON
│   ├── transform-bestiary-to-characters.ts     # ⏳ TODO: Transform do Character
│   ├── validate-characters.ts                  # ⏳ TODO: Walidacja
│   └── parsers/                                # ⏳ TODO: Funkcje pomocnicze
│       ├── healthParser.ts
│       ├── reductionParser.ts
│       ├── damageParser.ts
│       ├── defenseParser.ts
│       ├── statsParser.ts
│       ├── savesParser.ts
│       ├── maneuverParser.ts
│       └── equipmentParser.ts
│
├── raw-data/                                  # 📁 Dane surowe
│   ├── Bestariusz Brata Zakonnego Zondro.xlsm  # Źródło danych
│   ├── bestiary-sheets-analysis.json           # ✅ Analiza struktury
│   └── bestiary-parsed-raw.json                # ⏳ TODO: Surowe dane po parsowaniu
│
└── formatted-data/                            # 📤 Output
    └── characters.json                         # ⏳ TODO: Finalne dane

```

---

## 🚀 Workflow Migracji

### Etap 1: Analiza ✅ ZROBIONE
```bash
npm run analyze-bestiary  # lub: npx tsx scripts/analyze-bestiary-excel.ts
```
**Output:** `raw-data/bestiary-sheets-analysis.json`

---

### Etap 2: Implementacja Parserów ⏳ TODO

**Folder:** `scripts/parsers/`

1. Stwórz 8 plików parserów (healthParser.ts, damageParser.ts, etc.)
2. Użyj kodu z `FIELD_MAPPING_REFERENCE.md`
3. Testuj każdy parser osobno

---

### Etap 3: Parse Excel → Raw JSON ⏳ TODO

**Plik:** `scripts/parse-bestiary-excel.ts`

```bash
npm run parse-bestiary  # lub: npx tsx scripts/parse-bestiary-excel.ts
```

**Output:** `raw-data/bestiary-parsed-raw.json`

---

### Etap 4: Transform Raw → Character ⏳ TODO

**Plik:** `scripts/transform-bestiary-to-characters.ts`

```bash
npm run transform-bestiary  # lub: npx tsx scripts/transform-bestiary-to-characters.ts
```

**Output:** `formatted-data/characters.json`

---

### Etap 5: Walidacja ⏳ TODO

**Plik:** `scripts/validate-characters.ts`

```bash
npm run validate-characters  # lub: npx tsx scripts/validate-characters.ts
```

**Output:** Raport walidacyjny w konsoli

---

## 📊 Dane

### Źródło: Excel
- **Plik:** `raw-data/Bestariusz Brata Zakonnego Zondro.xlsm`
- **Zakładki:** Wojacy, Necro, Natura, Monstra, Dzicy, Firnamenty
- **Liczba postaci:** ~2,176

### Target: JSON
- **Plik:** `formatted-data/characters.json`
- **Schemat:** TypeScript `Character` (z `src/domain/characters/Character.ts`)
- **Format:** Array of Character objects

---

## 🎓 Jak Używać Tej Dokumentacji

### Scenariusz 1: Zaczynasz od zera
1. Przeczytaj `MIGRATION_SUMMARY.md` dla szybkiego overview
2. Przeczytaj `BESTIARY_MIGRATION_PLAN.md` sekcje "Analiza Źródła" i "Mapowanie Pól"
3. Zobacz `FIELD_MAPPING_REFERENCE.md` sekcje dla pól, które chcesz parsować
4. Zacznij implementować parsery zgodnie z planem

### Scenariusz 2: Piszesz konkretny parser
1. Otwórz `FIELD_MAPPING_REFERENCE.md`
2. Znajdź sekcję dla swojego pola (np. "Zdrowie", "Obrona", "Atak")
3. Skopiuj kod parsera
4. Dostosuj i przetestuj

### Scenariusz 3: Masz problem z edge case
1. Sprawdź `FIELD_MAPPING_REFERENCE.md` sekcję "Przypadki Brzegowe"
2. Sprawdź `BESTIARY_MIGRATION_PLAN.md` sekcję "Wyzwania i Uwagi"
3. Zobacz `raw-data/bestiary-sheets-analysis.json` dla rzeczywistych danych

### Scenariusz 4: Nie wiesz co robić dalej
1. Otwórz `MIGRATION_SUMMARY.md` sekcję "Następne Kroki"
2. Sprawdź checklist w `BESTIARY_MIGRATION_PLAN.md` sekcja "Podsumowanie Kroków"
3. Wykonuj krok po kroku

---

## 🔑 Kluczowe Koncepcje

### Typy Wierszy w Excel
1. **Wiersz Postaci** - główny wiersz z pełnymi statystykami (`początek > 0`)
2. **Wiersz Umiejętności** - należy do poprzedniej postaci (`początek === ""`)
3. **Wiersz Kategorii** - nagłówek podkategorii (np. "Walczący Wręcz")

### Priorytety Pól
- **✅ Krytyczne:** name, health, characteristics, offenses, defenses
- **⚠️ Ważne:** attributes, maneuvers, perks
- **💡 Opcjonalne:** talents, equipment, stances, states, powers

### Najtrudniejsze Parsery
1. **damageParser.ts** ⚠️⚠️⚠️ - Najbardziej skomplikowany (obrażenia, krytyki, kości)
2. **maneuverParser.ts** ⚠️⚠️ - Łączy dane z dwóch źródeł
3. Reszta parserów jest stosunkowo prosta (regex + split)

---

## 📝 Konwencje

### Nazewnictwo Plików
- Parsery: `camelCase` + `Parser.ts` (np. `healthParser.ts`)
- Główne skrypty: `kebab-case.ts` (np. `parse-bestiary-excel.ts`)
- Dokumenty: `UPPER_SNAKE_CASE.md` (np. `MIGRATION_PLAN.md`)

### Nazewnictwo Funkcji
- Parsery: `parse{Thing}` (np. `parseHealth`, `parseDamage`)
- Tworzenie: `create{Thing}` (np. `createDefense`, `createManeuver`)
- Walidacja: `validate{Thing}` (np. `validateCharacter`)

### Nazewnictwo Zmiennych
- Raw Excel data: `{field}Raw` (np. `healthRaw`, `damageRaw`)
- Parsed data: `{field}` (np. `health`, `damage`)

---

## 🆘 Problemy?

### Nie możesz znaleźć informacji?
1. Użyj CTRL+F w dokumentach
2. Sprawdź spis treści w każdym dokumencie
3. Sprawdź sekcję "Przypadki Brzegowe"

### Nie rozumiesz formatu Excel?
1. Zobacz `raw-data/bestiary-sheets-analysis.json` dla przykładów
2. Otwórz Excel i porównaj z analizą
3. Zobacz sekcję "Struktura Danych w Excel" w `BESTIARY_MIGRATION_PLAN.md`

### Parser nie działa poprawnie?
1. Zobacz przykłady parsowania w `FIELD_MAPPING_REFERENCE.md`
2. Sprawdź `bestiary-sheets-analysis.json` → `uniqueValues` dla rzeczywistych formatów
3. Dodaj logging do parsera dla debugowania

---

## 📅 Status Projektu

**Data utworzenia:** 2025-11-14  
**Status:** ✅ Plan Kompletny, Gotowy do Implementacji  
**Analiza Excel:** ✅ Zrobiona  
**Dokumentacja:** ✅ Kompletna  
**Implementacja:** ⏳ Oczekuje na start

---

## 🎯 Następny Krok

**Zacznij od:** `MIGRATION_SUMMARY.md` → sekcja "Następne Kroki"

**Powodzenia!** 🚀
