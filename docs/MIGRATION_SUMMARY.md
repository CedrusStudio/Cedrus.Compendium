# 📌 Podsumowanie - Plan Migracji Bestiariusza

## ✅ Co Zostało Zrobione

### 1. Analiza Struktury Excel ✅
- **Plik:** `scripts/analyze-bestiary-excel.ts`
- **Output:** `raw-data/bestiary-sheets-analysis.json`
- Przeanalizowano 6 zakładek:
  - **Wojacy**: 721 postaci
  - **Necro**: 506 postaci
  - **Natura**: 318 postaci
  - **Monstra**: 276 postaci
  - **Dzicy**: 166 postaci
  - **Firnamenty**: 189 postaci
- **Łącznie: ~2,176 postaci do zmigrowania**

### 2. Dokumentacja Planu Migracji ✅
- **Plik:** `docs/BESTIARY_MIGRATION_PLAN.md`
- Zawiera:
  - Pełny przegląd struktury danych w Excel
  - Mapowanie każdego pola Excel → TypeScript Character
  - Plan implementacji (3 główne skrypty + funkcje pomocnicze)
  - Przykłady parsowania dla każdego typu danych
  - Wartości domyślne i przypadki brzegowe
  - Checklist implementacji

### 3. Szczegółowe Mapowanie Pól ✅
- **Plik:** `docs/FIELD_MAPPING_REFERENCE.md`
- Zawiera:
  - Tabele referencyjne dla każdej sekcji Character
  - Kompletne parsery z kodem TypeScript
  - Wzorce regex dla parsowania
  - Przykłady parsowania krok po kroku
  - Funkcje walidacyjne

### 4. System Referencji ✅
- **Koncepcja:** Zamiast duplikować pełne obiekty manewrów/perków/postaw/stanów, używamy referencji `{ name, grade }`
- **Klucz główny:** `name` (case-insensitive) + `grade` (domyślnie 1)
- **Zalety:** Brak duplikacji, łatwiejsze updates, mniejszy rozmiar pliku
- **Istniejące zasoby:**
  - `formatted-data/maneuvers.json` (~700 manewrów)
  - `formatted-data/perks.json` (~500 perków)
  - `formatted-data/stances.json` (~200 postaw)
  - `formatted-data/states.json` (~30 stanów)
  - `formatted-data/weapons.json` (~100 broni)
  - `formatted-data/armors.json` (zbroje)
  - `formatted-data/shields.json` (~10 tarcz)

### 5. Integracja z Prisma/MongoDB ✅
- **Schemat:** `prisma/schema.prisma` z `@@unique([name, grade])` dla Maneuver/Perk/Stance/State/Spell
- **Relacje:** Many-to-many przez `stancesIds String[]` + `stances Stance[] @relation(...)`
- **Strategie:**
  - **Opcja A (Direct):** Excel → ReferenceResolver → Prisma → MongoDB
  - **Opcja B (JSON):** Excel → characters.json → Seed → Prisma → MongoDB
- **ReferenceResolver:** Klasa do resolve name+grade → ID w bazie
- **Szczegóły:** Zobacz `docs/PRISMA_INTEGRATION.md`

---

## 📁 Struktura Dokumentów

```
character-sheet/
├── docs/
│   ├── BESTIARY_MIGRATION_PLAN.md          # Główny plan migracji
│   ├── FIELD_MAPPING_REFERENCE.md           # Szczegółowe mapowanie pól
│   ├── REFERENCE_SYSTEM.md                  # System referencji [NOWY]
│   ├── PRISMA_INTEGRATION.md                # Integracja z Prisma/MongoDB [NOWY]
│   └── MIGRATION_SUMMARY.md                 # To właśnie czytasz
├── scripts/
│   └── analyze-bestiary-excel.ts            # Skrypt analizy (wykonany)
│   └── parsers/                             # Do stworzenia
│       ├── referenceParser.ts               # Parser name+grade
│       ├── referenceResolver.ts             # Resolve name+grade → ID [NOWY dla Prisma]
│       └── ...
├── prisma/
│   ├── schema.prisma                        # Schemat bazy z @@unique([name, grade])
│   └── seeds/
│       └── characterSeed.ts                 # Opcjonalny seed z JSON
└── raw-data/
    ├── Bestariusz Brata Zakonnego Zondro.xlsm  # Źródło danych
    └── bestiary-sheets-analysis.json           # Analiza struktury
```

---

## 🎯 Następne Kroki (Do Wykonania)

### Faza 1: Przygotowanie Funkcji Pomocniczych
**Folder:** `scripts/parsers/`

Stwórz następujące parsery:

1. ✅ **healthParser.ts**
   - `parseHealth(raw: string): { vitality: number; toughness: number }`
   - Pattern: `"24 [2]"` → vitality: 24, toughness: 2

2. ✅ **reductionParser.ts**
   - `parseReduction(raw: string): { protection: number; block: number }`
   - Pattern: `"7 [0]"` → protection: 7, block: 0

3. ⚠️ **damageParser.ts** (NAJBARDZIEJ SKOMPLIKOWANY)
   - `parseDamage(raw: string): { leading: WeaponOffense; bonus: DamageOffense }`
   - Pattern: `"2x(1k6+1)+1k4+5 / 5-6,+3"`
   - Zobacz szczegóły w `FIELD_MAPPING_REFERENCE.md` sekcja "Atak"

4. ✅ **defenseParser.ts**
   - `parseDefense(raw: string): { parry: number; dodge: number }`
   - Pattern: `"3 // 4"` → parry: 3, dodge: 4

5. ✅ **statsParser.ts**
   - `parseStats(raw: string): { strength, dexterity, constitution }`
   - Pattern: `"1 // 1 // 1"` → S:1, Zr:1, Bd:1

6. ✅ **savesParser.ts**
   - `parseSaves(raw: string): { willpower, reflex, fortitude }`
   - Pattern: `"3 // 3 // 0"` → W:3, R:3, F:0

7. ⚠️ **referenceParser.ts** (NOWY - dla referencji)
   - `parseNameAndGrade(raw: string): { name: string; grade: number }`
   - Pattern: `"GardaPięściarza1"` → `{ name: "Garda Pięściarza", grade: 1 }`
   - Pattern: `"Defensywna walka wręcz"` → `{ name: "Defensywna walka wręcz", grade: 1 }`
   - Normalizuje nazwy (dodaje spacje, case-insensitive matching)

8. ⚠️ **maneuverParser.ts** (ZMIENIONY - zwraca referencje)
   - `parseManeuverReferences(maneuversRaw: string, abilities: Ability[]): ManeuverReference[]`
   - Zwraca `{ name, grade }[]` zamiast pełnych obiektów `Maneuver[]`

9. ⚠️ **perkParser.ts** (NOWY - zwraca referencje)
   - `parsePerkReferences(abilities: Ability[]): PerkReference[]`
   - Parsuje perki z wierszy umiejętności (bez actionType)

10. ⚠️ **equipmentParser.ts** (ZMIENIONY - zwraca referencje)
    - `parseEquipmentReferences(raw: string): EquipmentReferences`
    - Zwraca referencje dla weapons/armors/shields zamiast pełnych obiektów

**Status:** ❌ Nie rozpoczęte

---

### Faza 2: Główne Skrypty Migracji

#### Skrypt 1: Parse Excel → Raw JSON
**Plik:** `scripts/parse-bestiary-excel.ts`

**Zadania:**
- Wczytaj Excel (6 zakładek)
- Dla każdej zakładki:
  - Zidentyfikuj wiersze postaci (początek > 0)
  - Zbierz wiersze umiejętności (między początek a Koniec)
  - Stwórz surowy obiekt `RawCharacterData`
- **Output:** `raw-data/bestiary-parsed-raw.json`

**Status:** ❌ Nie rozpoczęte

---

#### Skrypt 2: Transform Raw → Character
**Plik:** `scripts/transform-bestiary-to-characters.ts`

**Zadania:**
- Wczytaj `bestiary-parsed-raw.json`
- Dla każdego `RawCharacterData`:
  - Użyj wszystkich parserów z Fazy 1
  - Stwórz pełny obiekt `Character`
  - Wygeneruj `id` z `ulid()`
- **Output:** `formatted-data/characters.json`

**Status:** ❌ Nie rozpoczęte

---

#### Skrypt 3: Walidacja
**Plik:** `scripts/validate-characters.ts`

**Zadania:**
- Wczytaj `characters.json`
- Sprawdź każdą postać (required fields, typy, zakresy)
- Wygeneruj raport walidacyjny
- Wypisz statystyki (średnie HP, obrażenia, etc.)

**Status:** ❌ Nie rozpoczęte

---

### Faza 3: Testowanie i Uruchomienie

1. **Testy jednostkowe** dla każdej funkcji parsującej
   - Przykładowe dane z `bestiary-sheets-analysis.json`
   - Edge cases (puste wartości, niestandardowe formaty)

2. **Test na małym zbiorze** (10-20 postaci)
   - Ręczna weryfikacja poprawności
   - Poprawki parserów

3. **Pełna migracja** (wszystkie ~2176 postaci)
   - Uruchom cały pipeline
   - Waliduj wyniki
   - Popraw błędy

4. **Commit wyników**
   - `formatted-data/characters.json`
   - Opcjonalnie: podział na kategorie

---

## 🔑 Kluczowe Informacje

### Priorytety Pól

#### ✅ Krytyczne (bez nich postać nie działa):
- `name`, `id`, `shortName`
- `health` (vitality, toughness)
- `characteristics` (strength, dexterity, constitution)
- `offenses` (co najmniej jeden atak)
- `defenses` (co najmniej jedna obrona)

#### ⚠️ Ważne (wpływają na gameplay):
- `attributes` (initiative, saves)
- `maneuvers`
- `perks`

#### 💡 Opcjonalne (można uzupełnić później):
- `talents` (wygeneruj domyślne lub pozostaw puste)
- `equipment` (mapuj podstawowo)
- `stances`, `states`, `powers` (brak danych w Excel)

---

### Najtrudniejsze Parsery

#### 1. **Obrażenia (damageParser.ts)** ⚠️⚠️⚠️
**Format:** `"2x(1k6+1)+1k4+5 / 5-6,+3"`

**Wymagane kroki:**
1. Split na kości i krytyk (`/`)
2. Parse główne kości: `2x(1k6+1)` → amount, grade, bonus
3. Parse dodatkowe kości: `+1k4` → bonus dice
4. Parse flat bonus: `+5`
5. Parse krytyk: `5-6,+3` → range, power
6. Konwersja k6 → grade 3, k4 → grade 2, etc.

**Zobacz pełny kod w:** `FIELD_MAPPING_REFERENCE.md` sekcja "Atak"

---

#### 2. **Manewry (maneuverParser.ts)** ⚠️⚠️
**Źródła:**
- Kolumna `__EMPTY_12`: "Brak Manewrów", "Zwierzę 0", etc.
- Wiersze umiejętności: nazwa, opis, typ akcji

**Wymagane kroki:**
1. Split `__EMPTY_12` po przecinkach
2. Dopasuj z abilities po nazwie
3. Parse `castTime` z typu akcji ("1//D" → "Standardowa")
4. Stwórz obiekty `Maneuver` z `ulid()` ID

---

### Wartości Domyślne

```typescript
const defaults = {
  // Statistic
  statistic: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
  
  // Health
  health: { barrier: 0, recoveryLevel: 0, lethalHealth: 0, lethalRounds: 0, bonus: 0 },
  
  // Arrays
  talents: [],
  stances: [],
  states: [],
  powers: [],
  
  // Defense
  defenseBonus: 0,
  
  // Damage
  damageBonus: { amount: 0, grade: 1, bonus: 0 }
};
```

---

## 📊 Oczekiwane Wyniki

### Output: `formatted-data/characters.json`

**Format:**
```json
[
  {
    "id": "01HZXY9...",
    "name": "Amator",
    "shortName": "Amator",
    "description": "...",
    "tags": [...],
    "characteristics": {...},
    "attributes": {...},
    "talents": [],
    "health": {...},
    "defenses": [{...}],
    "offenses": [{...}],
    "equipment": {...},
    "stances": [],
    "states": [],
    "maneuvers": [{...}],
    "powers": [],
    "perks": []
  },
  // ... ~2176 postaci więcej
]
```

**Rozmiar:** Szacowany ~5-10 MB (zależnie od szczegółowości opisów)

---

## 🎓 Użycie Dokumentacji

### Podczas Implementacji:

1. **Tworzysz parser?**
   - Sprawdź `FIELD_MAPPING_REFERENCE.md` sekcję dla tego pola
   - Znajdź przykładowy kod parsera
   - Zobacz przykłady parsowania

2. **Nie wiesz jak zmapować pole?**
   - Sprawdź tabelę mapowania w `FIELD_MAPPING_REFERENCE.md`
   - Zobacz kolumnę "Character Path" dla docelowej ścieżki
   - Zobacz kolumnę "Parser" dla funkcji do użycia

3. **Zastanawiasz się nad kolejnością kroków?**
   - Sprawdź `BESTIARY_MIGRATION_PLAN.md` sekcję "Podsumowanie Kroków Implementacji"
   - Idź krok po kroku zgodnie z planem

4. **Masz problem z edge case?**
   - Sprawdź `FIELD_MAPPING_REFERENCE.md` sekcję "Przypadki Brzegowe"
   - Znajdź rozwiązanie dla podobnego problemu

---

## ⏱️ Szacowany Czas Implementacji

### Faza 1: Parsery (4-6 godzin)
- Proste parsery (health, defense, stats): 1-2h
- Trudny parser (damage): 2-3h
- Złożone parsery (maneuvers): 1h

### Faza 2: Główne Skrypty (4-6 godzin)
- Parse Excel → Raw: 2-3h
- Transform Raw → Character: 1-2h
- Walidacja: 1h

### Faza 3: Testowanie (2-4 godziny)
- Testy jednostkowe: 1h
- Test na małym zbiorze: 1h
- Debugowanie i poprawki: 1-2h

**Łączny czas:** 10-16 godzin pracy

---

## 🔗 Linki do Dokumentów

1. **Plan Główny:** `docs/BESTIARY_MIGRATION_PLAN.md`
   - Kompletny przewodnik migracji
   - Architektura rozwiązania
   - Plan implementacji

2. **Mapowanie Pól:** `docs/FIELD_MAPPING_REFERENCE.md`
   - Szczegółowe tabele mapowania
   - Kod parserów TypeScript
   - Przykłady parsowania

3. **Analiza Excel:** `raw-data/bestiary-sheets-analysis.json`
   - Struktura arkuszy
   - Przykładowe wiersze
   - Typy kolumn

4. **Skrypt Analizy:** `scripts/analyze-bestiary-excel.ts`
   - Gotowy skrypt do ponownej analizy
   - Można modyfikować dla innych zakładek

---

## 🚀 Gotowe do Startu!

Wszystkie plany i dokumentacja są gotowe. Teraz możesz przystąpić do implementacji zgodnie z planem w Fazie 1, 2, 3.

**Powodzenia!** 🎯

---

**Dokument stworzony:** 2025-11-14  
**Wersja:** 1.0  
**Status:** ✅ Plan Kompletny, Gotowy do Implementacji
