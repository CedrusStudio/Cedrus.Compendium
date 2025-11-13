# 📊 Konwersja Excel → JSON - Dokumentacja

## ✅ Status: UKOŃCZONE

Konwersja zakończona sukcesem! Wygenerowano **1223 encje** z **1242 wierszy** (99% sukcesu).

## 📁 Wygenerowane Pliki

```
formatted-data/
├── maneuvers.json    571 manewrów
├── perks.json        405 atutów/perków
├── stances.json      244 postawy
└── states.json       3 stany
```

## 🎯 Zaimplementowane Reguły

### 1. **Parsowanie Kosztów (Price)**
Zgodnie z mapowaniem: `B=1, S=3, Z=9, P=27, D=81`

**Przykłady**:
- `B` → 1
- `S` → 3
- `BB` → 2 (1+1)
- `SSB` → 7 (3+3+1)
- `ZS` → 12 (9+3)

**Priorytet**: `War` (jeśli istnieje) > `Koszt`

**Implementacja**: `parsers/cost-parser.ts`

### 2. **Parsowanie Wymagań (Requirements)**
Rozdziela tekst po przecinku na tablicę stringów.

**Przykłady**:
- `"Zr 3, Int 2"` → `["Zr 3", "Int 2"]`
- `"Większa Wytrwałość5"` → `["Większa Wytrwałość5"]`

**Implementacja**: `parsers/requirements-parser.ts`

### 3. **Parsowanie Cooldown (Częstotliwość)**
Format: `1//X` gdzie X to liczba rund lub `D` dla "raz na walkę".

**Przykłady**:
- `1//3` → `cooldown: 3`
- `1//6` → `cooldown: 6`
- `1//D` → `cooldown: undefined` (raz na walkę, brak cooldownu w JSONie)

**Implementacja**: `parsers/cooldown-parser.ts`

### 4. **Parsowanie Nazwy i Rangi (Name & Grade)**
Wyciąga liczbę z końca nazwy jako `grade`, reszta to `name`.

**Przykłady**:
- `"Finta1"` → `{ name: "Finta", grade: 1 }`
- `"Większy Fechtunek5"` → `{ name: "Większy Fechtunek", grade: 5 }`
- `"Akrobatyka"` → `{ name: "Akrobatyka", grade: 1 }` (domyślnie 1)

**Implementacja**: `parsers/name-grade-parser.ts`

### 5. **Ignorowanie ST**
Kolumna `ST` jest ignorowana. `castTime` dla wszystkich manewrów ustawiony na `"Standardowa"`.

### 6. **Parsowanie Tagów (Typ_1)**
Konwertuje tekst na valid tags:
- Małe litery
- Spacje → myślniki
- Polskie znaki → ASCII
- Ignoruje główne kategorie ("manewry", "atuty", "stany" itp.)

**Przykłady**:
- `"Manewry Obronne"` → `["obronne"]` (ignoruje "manewry")
- `"Kuszę/Łuki"` → `["kusze-luki"]`
- `"Stany"` → `[]` (ignorowane)

**Implementacja**: `parsers/tags-parser.ts`

## 🏗️ Architektura Kodu

```
scripts/excel-to-json/
├── index.ts                      # Główny skrypt konwersji
├── parsers/
│   ├── cost-parser.ts           # B=1, S=3, Z=9, P=27, D=81
│   ├── requirements-parser.ts   # Split po przecinku
│   ├── cooldown-parser.ts       # 1//X → X
│   ├── name-grade-parser.ts     # "Finta1" → name + grade
│   └── tags-parser.ts           # Typ_1 → valid tags
└── mappers/
    ├── maneuver-mapper.ts       # Excel → Maneuver
    ├── perk-mapper.ts           # Excel → Perk
    └── mode-mapper.ts           # Excel → Mode (Stance/State)
```

## 📊 Statystyki Konwersji

| Arkusz Excel          | Wiersze | Wynik | Sukces | Pominięte |
|-----------------------|---------|-------|--------|-----------|
| M Total               | 574     | 571   | 99%    | 3         |
| Atuty Bojowe          | 125     | 124   | 99%    | 1         |
| Atuty Defensywne      | 174     | 173   | 99%    | 1         |
| Walka Wrecz           | 65      | 54    | 83%    | 11        |
| Harmonia              | 57      | 54    | 95%    | 3         |
| Postawy i Stany       | 247     | 247   | 100%   | 0         |
| **TOTAL**             | **1242**| **1223**| **99%**| **19**   |

### Przyczyny Pominięcia (19 wierszy)

1. **Puste wiersze** - nagłówki sekcji bez danych
2. **Wiersze bez nazwy** - `Nazwa` i `Nazwa_1` puste
3. **Wiersze z opisami** - teksty wprowadzające, nie dane

## 🔍 Przykładowe Dane

### Maneuver (maneuvers.json)
```json
{
  "id": "01K9Z30WX07E9X09RRS5P9HHCW",
  "name": "Akrobatyka",
  "grade": 1,
  "description": "Test sporny Refleksu z Refleksem/Fechtuniem/Fortel...",
  "castTime": "Standardowa",
  "price": 7,
  "requirements": ["Nieuchwytność", "Lekka Zbroja"],
  "tags": ["manewry-obronne"],
  "cooldown": undefined
}
```

### Perk (perks.json)
```json
{
  "id": "01K9Z30XRTJ0G57C9VQVMWEK9S",
  "name": "Finezja w walce",
  "grade": 1,
  "description": "+ (Zręczność) dmg, zamiast siły...",
  "requirements": ["Zr 3"],
  "price": 9,
  "tags": []
}
```

### Stance (stances.json)
```json
{
  "id": "01K9Z30YPY5HPA1VH8PFZNVYRW",
  "name": "Defensywny Rytm",
  "grade": 1,
  "description": "Testy fechtunku-1, parownie+1",
  "requirements": [
    "brak tarczy",
    "Postawa Defensywna3",
    "Garda2",
    "Większy Fechtunek5",
    "PostawaSzermierska1"
  ],
  "price": 6,
  "tags": []
}
```

### State (states.json)
```json
{
  "id": "01K9Z30YPYEAN0VDBDMP5X5TQ0",
  "name": "Amok",
  "grade": 1,
  "description": "Za każde 10 brakującego hp dodajesz 1dmg...",
  "requirements": ["PostawaSokoła3"],
  "price": 4,
  "tags": []
}
```

## 🚀 Użycie

### Uruchomienie Konwersji
```bash
npm run excel-to-json
```

### Modyfikacja Parserów

Jeśli potrzebujesz zmienić reguły parsowania:

1. **Koszt**: Edytuj `COST_MAP` w `parsers/cost-parser.ts`
2. **Cooldown**: Modyfikuj regex w `parsers/cooldown-parser.ts`
3. **Tagi**: Dodaj do `IGNORED_TAGS` w `parsers/tags-parser.ts`
4. **Grade**: Zmień regex w `parsers/name-grade-parser.ts`

### Dodanie Nowego Arkusza

1. Dodaj nazwę arkusza do odpowiedniej sekcji w `index.ts`
2. Użyj odpowiedniego mappera (`mapManeuvers`, `mapPerks`, `mapModes`)
3. Opcjonalnie stwórz nowy mapper w `mappers/`

## 📝 Walidacja Danych

Wszystkie wygenerowane dane są zgodne z modelami TypeScript:

- ✅ `Maneuver` - `src/domain/characters/combat/Maneuver.ts`
- ✅ `Perk` - `src/domain/characters/Perk.ts`
- ✅ `Mode` - `src/domain/characters/combat/Mode.ts`

### Generowane ID
Każda encja ma unikalne ID generowane przez `ulid()`.

### Domyślne Wartości
- `grade`: 1 (jeśli brak w nazwie)
- `castTime`: "Standardowa" (dla manewrów)
- `cooldown`: undefined (jeśli `1//D` lub brak)
- `requirements`: [] (jeśli puste)
- `tags`: [] (jeśli ignorowane lub puste)
- `price`: 0 (jeśli brak War i Koszt)

## ⚠️ Znane Ograniczenia

1. **CastTime**: Zawsze ustawiony na "Standardowa" (ST ignorowany)
2. **Tagi**: Większość encji ma puste tagi (kolumna Typ_1 to główna kategoria)
3. **PostawaSokoła2**: Dodawane do requirements, może wymagać osobnego pola
4. **Nazwa_1 vs Nazwa**: Priorytet dla Nazwa_1 (bardziej czytelne)

## 🔄 Następne Kroki

### Import do MongoDB

Pliki JSON są gotowe do importu:

```bash
mongoimport --db character-sheet --collection maneuvers --file formatted-data/maneuvers.json --jsonArray
mongoimport --db character-sheet --collection perks --file formatted-data/perks.json --jsonArray
mongoimport --db character-sheet --collection stances --file formatted-data/stances.json --jsonArray
mongoimport --db character-sheet --collection states --file formatted-data/states.json --jsonArray
```

### Walidacja Prisma

Sprawdź czy struktury są zgodne z `prisma/schema.prisma`:

```bash
npm run prisma:validate
```

## 📚 Dodatkowe Zasoby

- **Analiza struktury Excel**: `excel-structure-clean.json`
- **Dokumentacja porównawcza**: `EXCEL_ANALYSIS.md`
- **Modele TypeScript**: `src/domain/`

---

**Data konwersji**: 2025-11-13  
**Wersja**: 1.0.0  
**Status**: ✅ Produkcyjny
