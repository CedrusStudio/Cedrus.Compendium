# 📋 Plan Migracji Bestiariusza do characters.json

## 🎯 Cel

Migracja danych postaci z pliku Excel `Bestariusz Brata Zakonnego Zondro.xlsm` do pliku JSON `characters.json` zgodnego ze schematem TypeScript `Character`, **wykorzystując system referencji** zamiast duplikacji pełnych obiektów.

## 🔗 System Referencji

**KLUCZOWA ZMIANA:** Zamiast przechowywać pełne obiekty manewrów, perków, postaw, stanów i ekwipunku w każdej postaci, używamy **referencji** `{ name, grade }` do istniejących zasobów.

### Zalety:
- ✅ **Brak duplikacji** - dane są w jednym miejscu
- ✅ **Mniejszy rozmiar** - ~85% oszczędności miejsca
- ✅ **Łatwiejsze updates** - zmiana w źródle = zmiana wszędzie
- ✅ **Spójność** - jedna wersja prawdy

### Klucz Główny: `name` + `grade`

```typescript
// Zamiast pełnego obiektu:
{ id: "...", name: "Garda Pięściarza", grade: 1, description: "...", ... }

// Używamy referencji:
{ name: "Garda Pięściarza", grade: 1 }
```

**Szczegóły:** Zobacz `docs/REFERENCE_SYSTEM.md`

---

## 📊 Analiza Źródła Danych

### Zakładki do Zmigrowania

| Zakładka | Liczba Wierszy | Liczba Kolumn | Typ Postaci |
|----------|----------------|---------------|-------------|
| **Wojacy** | 721 | 22 | Wojownicy (ludzie) |
| **Necro** | 506 | 22 | Nekromancja/Nieumarli |
| **Natura** | 318 | 22 | Bestie/Natura |
| **Monstra** | 276 | 22 | Potwory |
| **Dzicy** | 166 | 18 | Dzicy/Plemiona |
| **Firnamenty** | 189 | 19 | Firmamenty/Magiczne |

**Łącznie:** ~2,176 postaci do zmigrowania

### Struktura Danych w Excel

Każda zakładka ma następującą strukturę:

#### Kolumny Główne (z nagłówków w wierszu 3):
1. **Kolumna A** (`>> Wojownicy <<` / `>> Potwory <<` etc.) - pusta, nagłówek kategorii
2. **Kolumna B** (`__EMPTY`) - Kategoria/Podkategoria (np. "Walczący Wręcz", "Dystansowi")
3. **Kolumna C** (`__EMPTY_1`) - **Nazwa** postaci lub umiejętności
4. **Kolumna D** (`__EMPTY_2`) - **Zdrowie** (format: "24 [2]" lub opis umiejętności)
5. **Kolumna E** (`__EMPTY_3`) - **Odporność** (immunity)
6. **Kolumna F** (`__EMPTY_4`) - **Redukcja** (format: "7 [0]" = protection + [block])
7. **Kolumna G** (`__EMPTY_5`) - **Redukcja kości** (dodge)
8. **Kolumna H** (`__EMPTY_6`) - **Obrażenia** (format: "2x(1k6)+4 / 6,+0 (+1)")
9. **Kolumna I** (`__EMPTY_7`) - **Inicjatywa**
10. **Kolumna J** (`__EMPTY_8`) - **Walka Wręcz/Fechtunek/Fortel**
11. **Kolumna K** (`__EMPTY_9`) - **Parowanie/Uniki** (format: "3 // 4")
12. **Kolumna L** (`__EMPTY_10`) - **Ro** (Wola/Odruch?) (format: "3 // 3 // 0")
13. **Kolumna M** (`__EMPTY_11`) - **S // Zr // Bd** (Siła // Zręczność // Budowa)
14. **Kolumna N** (`__EMPTY_12`) - **Manewry** (lista manewrów)
15. **Kolumna O** (`__EMPTY_13`) - **Sprzęt** (ekwipunek)
16. **Kolumna P** (`__EMPTY_14`) - **Siła Niezależna/Siła oddziału**
17. **Kolumny Q-S** (`__EMPTY_15` - `__EMPTY_17`) - zazwyczaj puste
18. **Kolumna T** (`wiersz`) - numer wiersza
19. **Kolumna U** (`początek`) - wiersz początkowy grupy
20. **Kolumna V** (`Koniec`) - wiersz końcowy grupy

#### Identyfikacja Typów Wierszy

Excel zawiera 3 typy wierszy:

1. **Wiersz Kategorii** - kolumna B wypełniona, C-N puste (np. "Walczący Wręcz")
2. **Wiersz Postaci** - kolumna C zawiera nazwę, D-N zawierają statystyki
3. **Wiersz Umiejętności/Manewru** - kolumna C zawiera nazwę, D zawiera opis

**Rozpoznawanie:**
- Jeśli `początek` > 0 i `Koniec` > `początek` → **Postać główna**
- Jeśli `początek === ""` i poprzedni wiersz to postać → **Umiejętność/Manewr** należący do postaci

---

## 🗺️ Mapowanie Pól Excel → TypeScript Character

### 1. Podstawowe Informacje (Entity)

| Excel | Character Field | Typ | Transformacja |
|-------|-----------------|-----|---------------|
| `__EMPTY_1` (Nazwa) | `name` | string | Bezpośrednie mapowanie |
| `__EMPTY_1` (Nazwa) | `shortName` | string | Skrócona nazwa (pierwsze słowo lub akronim) |
| - | `id` | string | Wygeneruj z `ulid()` |
| `__EMPTY_2` (opis) | `description` | string | Z wierszy umiejętności |
| `__EMPTY` (kategoria) | `tags` | Tag[] | Kategoria jako tag |

### 2. Cechy (Characteristics)

| Excel | Character Field | Typ | Transformacja |
|-------|-----------------|-----|---------------|
| `__EMPTY_11` (S) | `characteristics.strength` | Statistic | Parse "S // Zr // Bd" → value |
| `__EMPTY_11` (Zr) | `characteristics.dexterity` | Statistic | Parse "S // Zr // Bd" → value |
| `__EMPTY_11` (Bd) | `characteristics.constitution` | Statistic | Parse "S // Zr // Bd" → value |
| - | `characteristics.mind` | Statistic | Domyślna wartość (0 lub bazowa) |
| - | `characteristics.charisma` | Statistic | Domyślna wartość (0 lub bazowa) |
| - | `characteristics.spellborn` | Statistic | Domyślna wartość (0 lub bazowa) |

**Statistic Structure:**
```typescript
{
  grade: number,    // Ranga (default: 1)
  value: number,    // Wartość z Excel
  bonus: number,    // Domyślnie 0
  testBonus: number // Domyślnie 0
}
```

### 3. Atrybuty (Attributes)

| Excel | Character Field | Typ | Transformacja |
|-------|-----------------|-----|---------------|
| `__EMPTY_8` | `attributes.fencing` / `martialArt` | Statistic | Walka Wręcz/Fechtunek |
| `__EMPTY_7` | `attributes.initiative` | Statistic | Inicjatywa → value |
| `__EMPTY_10` (pierwszy) | `attributes.willpower` | Statistic | Parse "Ro // X // Y" → pierwszy |
| `__EMPTY_10` (drugi) | `attributes.reflex` | Statistic | Parse "Ro // X // Y" → drugi |
| `__EMPTY_10` (trzeci) | `attributes.fortitude` | Statistic | Parse "Ro // X // Y" → trzeci |
| - | `attributes.artifice` | Statistic | Domyślna wartość |
| - | `attributes.precision` | Statistic | Domyślna wartość |
| - | `attributes.horsemanship` | Statistic | Domyślna wartość |

### 4. Zdrowie (Health)

| Excel | Character Field | Typ | Transformacja |
|-------|-----------------|-----|---------------|
| `__EMPTY_2` | `health.vitality` | number | Parse "24 [2]" → 24 |
| `__EMPTY_2` | `health.toughness` | number | Parse "24 [2]" → [2] |
| - | `health.barrier` | number | Domyślnie 0 |
| - | `health.recoveryLevel` | number | Domyślnie 0 |
| - | `health.lethalHealth` | number | Domyślnie 0 |
| - | `health.lethalRounds` | number | Domyślnie 0 |
| - | `health.bonus` | number | Domyślnie 0 |

**Parsing Zdrowia:**
```regex
Pattern: (\d+)\s*\[(\d+)\]
Group 1: vitality
Group 2: toughness
```

### 5. Obrona (Defenses)

Każda postać powinna mieć co najmniej jedną obronę "Podstawowa Obrona".

| Excel | Defense Field | Typ | Transformacja |
|-------|---------------|-----|---------------|
| `__EMPTY_3` | `immunity` | number | Odporność (bezpośrednio) |
| `__EMPTY_4` | `resistance` | number | Parse "7 [0]" → pierwszy |
| `__EMPTY_4` | `protection` | number | Parse "7 [0]" → pierwszy |
| `__EMPTY_4` | `block` | number | Parse "7 [0]" → [drugi] |
| `__EMPTY_9` (pierwszy) | `parry` | number | Parse "3 // 4" → pierwszy |
| `__EMPTY_9` (drugi) | `dodge` | number | Parse "3 // 4" → drugi |
| `__EMPTY_5` | `dodge` (alt) | number | Redukcja kości |
| - | `bonus` | number | Domyślnie 0 |

**Parsing Redukcji:**
```regex
Pattern: (\d+)\s*\[(\d+)\]
Group 1: protection
Group 2: block
```

**Parsing Parowanie/Uniki:**
```regex
Pattern: (\d+)\s*//\s*(\d+)
Group 1: parry
Group 2: dodge
```

### 6. Atak (Offenses)

Każda postać z obrażeniami powinna mieć co najmniej jeden atak.

| Excel | Offense Field | Typ | Transformacja |
|-------|---------------|-----|---------------|
| `__EMPTY_6` | `leadingWeapon` | WeaponOffense | Parse obrażeń (część przed "/") |
| `__EMPTY_6` | `leadingWeapon.critical` | Critical | Parse obrażeń (część po "/") |
| - | `secondaryWeapon` | WeaponOffense | undefined (opcjonalnie) |
| - | `damageBonus` | DamageOffense | { amount: 0, grade: 1, bonus: 0 } |

**Parsing Obrażeń:**
```regex
Full Pattern: (.+?)\s*/\s*(.+)
Part 1 (Kości): 2x(1k6+1)+1k4+5
Part 2 (Krytyk): 5-6,+3

Dice Pattern: (\d+)x\((\d+)k(\d+)([+-]\d+)?\)(?:\+(\d+)k(\d+))?(?:\+(\d+))?
Groups:
1: amount (ilość kości głównych)
2: multiplier (nieużywany w WeaponOffense, ale pokazuje ilość)
3: dice value (k6, k8, etc.)
4: bonus per dice
5-6: dodatkowe kości (optional)
7: flat bonus

Critical Pattern: (\d+)(?:-(\d+))?,\s*([+-]\d+)
Groups:
1: min range (critical begins)
2: max range (optional, domyślnie max kości)
3: critical power
```

**Konwersja wartości kości na grade:**
- k4 → grade 2
- k6 → grade 3
- k8 → grade 4
- k10 → grade 5
- k12 → grade 6
- k14 → grade 7
- k20 → grade 10

**Przykład:**
```
Excel: "2x(1k6+1)+1k4+5 / 5-6,+3"

leadingWeapon: {
  amount: 1,        // z 2x(1k6...)
  grade: 3,         // k6 = grade 3
  bonus: 1,         // +1 per dice
  critical: {
    range: 1,       // 6 - 5 = 1 (rozszerza o 1)
    power: 3        // +3
  }
}

damageBonus: {
  amount: 1,        // 1k4
  grade: 2,         // k4 = grade 2
  bonus: 5          // +5 flat
}
```

### 7. Talenty (Talents)

Obecnie Excel nie zawiera bezpośrednich danych o talentach. Zostaw pustą tablicę `[]` lub wygeneruj podstawowe talenty na podstawie cech.

**Opcjonalnie:** Można wygenerować talenty bazowe:
- "Siła" → characteristic = "siła", grade = cechy.strength.value
- "Zręczność" → characteristic = "zręczność", grade = cechy.dexterity.value
- etc.

### 8. Manewry (Maneuvers)

| Excel | Maneuver Field | Typ | Transformacja |
|-------|----------------|-----|---------------|
| `__EMPTY_12` | Tablica manewrów | Maneuver[] | Split po przecinku/średniku |

Z wierszy umiejętności należących do postaci (wiersz z `początek === ""`):
- `__EMPTY_1` → `name`
- `__EMPTY_2` → `description`
- `__EMPTY_14` → `castTime` (parse "1//D" → "Standardowa")

**Parsing CastTime:**
```
Pattern: (\d+)//(\w+)
"1//D" → "Standardowa"
"2//D" → "Pełnorundowa"
```

**Domyślne wartości dla Maneuver:**
```typescript
{
  id: ulid(),
  name: "Nazwa z Excel",
  description: "Opis z Excel",
  grade: 1,
  castTime: "Standardowa",
  cooldown: 1,
  price: 1,
  requirements: [],
  tags: []
}
```

### 9. Perki (Perks)

Z wierszy "Pasywy" lub specjalnych umiejętności:
- `__EMPTY_1` → `name`
- `__EMPTY_2` → `description`

**Domyślne wartości dla Perk:**
```typescript
{
  id: ulid(),
  name: "Nazwa z Excel",
  description: "Opis z Excel",
  grade: 1,
  requirements: [],
  price: 0,
  tags: []
}
```

### 10. Postawy i Stany (Stances & States)

Obecnie brak bezpośrednich danych. Zostaw puste tablice `[]`.

### 11. Moce/Zaklęcia (Powers)

Obecnie brak bezpośrednich danych. Zostaw pustą tablicę `[]`.

### 12. Ekwipunek (Equipment)

| Excel | Equipment Field | Typ | Transformacja |
|-------|-----------------|-----|---------------|
| `__EMPTY_13` | Parsuj tekst | Equipment | Split po przecinkach, identyfikuj typ |

**Identyfikacja typu przedmiotu:**
- "Walka Wręcz", "Miecz", "Topór" → `weapons`
- "Zbroja", "Kirys" → `armors`
- "Tarcza" → `shields`
- Reszta → `inventory`

**Domyślne wartości:**
```typescript
weapons: []       // opcjonalnie mapuj z "Walka Wręcz"
armors: []        // opcjonalnie mapuj z "Bez zbroi" / "Zbroja"
shields: []       // opcjonalnie mapuj z "Tarcza"
inventory: []     // pozostałe przedmioty jako Item
mounts: []        // puste
```

---

## 🔧 Implementacja - Plan Skryptów

### 1. **Skrypt Parsujący Excel** (`scripts/parse-bestiary-excel.ts`)

**Zadania:**
- Wczytaj plik Excel
- Dla każdej zakładki (Wojacy, Necro, Natura, Monstra, Dzicy, Firnamenty):
  - Zidentyfikuj wiersze postaci (początek > 0)
  - Dla każdej postaci:
    - Zbierz wiersz główny
    - Zbierz wszystkie wiersze umiejętności (między `początek` a `Koniec`)
  - Stwórz surowy obiekt postaci z danymi z Excel
- Zapisz do `raw-data/bestiary-parsed-raw.json`

**Output:**
```typescript
interface RawCharacterData {
  sheet: string;              // Nazwa zakładki
  category: string;           // Z kolumny B
  name: string;               // Z kolumny C
  healthRaw: string;          // "24 [2]"
  immunity: number;
  reductionRaw: string;       // "7 [0]"
  dodgeRaw: number;
  damageRaw: string;          // "2x(1k6)+4 / 6,+0 (+1)"
  initiative: number;
  combatSkillRaw: string;     // "3 // 0"
  defenseRaw: string;         // "3 // 4"
  savesRaw: string;           // "3 // 3 // 0"
  statsRaw: string;           // "1 // 1 // 1"
  maneuvers: string;
  equipment: string;
  abilities: Array<{         // Wiersze umiejętności
    name: string;
    description: string;
    actionType?: string;      // "1//D"
  }>;
}
```

### 2. **Skrypt Transformujący** (`scripts/transform-bestiary-to-characters.ts`)

**Zadania:**
- Wczytaj `bestiary-parsed-raw.json`
- Dla każdego `RawCharacterData`:
  - Stwórz obiekt `Character` zgodny ze schematem TypeScript
  - Parsuj wszystkie pola według mapowania powyżej
  - Użyj funkcji pomocniczych:
    - `parseHealth(healthRaw)`
    - `parseReduction(reductionRaw)`
    - `parseDamage(damageRaw)`
    - `parseCombatSkills(combatSkillRaw)`
    - `parseDefense(defenseRaw)`
    - `parseSaves(savesRaw)`
    - `parseStats(statsRaw)`
    - `parseManeuvers(maneuvers, abilities)`
    - `parsePerks(abilities)`
    - `parseEquipment(equipment)`
  - Wygeneruj `id` z `ulid()`
- Zapisz do `formatted-data/characters.json`

**Output:** Tablica obiektów `Character[]`

### 3. **Funkcje Pomocnicze** (`scripts/parsers/`)

Stwórz moduły pomocnicze dla parsowania:

#### `healthParser.ts`
```typescript
export function parseHealth(raw: string): Pick<Health, 'vitality' | 'toughness'> {
  const match = raw.match(/(\d+)\s*\[(\d+)\]/);
  if (!match) return { vitality: 0, toughness: 0 };
  return {
    vitality: parseInt(match[1]),
    toughness: parseInt(match[2])
  };
}
```

#### `reductionParser.ts`
```typescript
export function parseReduction(raw: string): Pick<Defense, 'protection' | 'block'> {
  const match = raw.match(/(\d+)\s*\[(\d+)\]/);
  if (!match) return { protection: 0, block: 0 };
  return {
    protection: parseInt(match[1]),
    block: parseInt(match[2])
  };
}
```

#### `damageParser.ts`
```typescript
export function parseDamage(raw: string): {
  leading: WeaponOffense;
  bonus: DamageOffense;
} {
  // Complex parsing logic
  // See section "Parsing Obrażeń" above
}
```

#### `defenseParser.ts`
```typescript
export function parseDefense(raw: string): Pick<Defense, 'parry' | 'dodge'> {
  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)/);
  if (!match) return { parry: 0, dodge: 0 };
  return {
    parry: parseInt(match[1]),
    dodge: parseInt(match[2])
  };
}
```

#### `statsParser.ts`
```typescript
export function parseStats(raw: string): Pick<Characteristics, 'strength' | 'dexterity' | 'constitution'> {
  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)\s*\/\/\s*(\d+)/);
  if (!match) {
    return {
      strength: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
      dexterity: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
      constitution: { grade: 1, value: 0, bonus: 0, testBonus: 0 }
    };
  }
  
  return {
    strength: { grade: 1, value: parseInt(match[1]), bonus: 0, testBonus: 0 },
    dexterity: { grade: 1, value: parseInt(match[2]), bonus: 0, testBonus: 0 },
    constitution: { grade: 1, value: parseInt(match[3]), bonus: 0, testBonus: 0 }
  };
}
```

#### `savesParser.ts`
```typescript
export function parseSaves(raw: string): Pick<Attributes, 'willpower' | 'reflex' | 'fortitude'> {
  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)\s*\/\/\s*(\d+)/);
  if (!match) {
    return {
      willpower: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
      reflex: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
      fortitude: { grade: 1, value: 0, bonus: 0, testBonus: 0 }
    };
  }
  
  return {
    willpower: { grade: 1, value: parseInt(match[1]), bonus: 0, testBonus: 0 },
    reflex: { grade: 1, value: parseInt(match[2]), bonus: 0, testBonus: 0 },
    fortitude: { grade: 1, value: parseInt(match[3]), bonus: 0, testBonus: 0 }
  };
}
```

#### `maneuverParser.ts`
```typescript
export function parseManeuvers(
  maneuversRaw: string, 
  abilities: Array<{ name: string; description: string; actionType?: string }>
): Maneuver[] {
  // Split maneuversRaw po przecinkach
  // Dopasuj z abilities po nazwie
  // Stwórz obiekty Maneuver
}
```

#### `equipmentParser.ts`
```typescript
export function parseEquipment(raw: string): Equipment {
  // Split po przecinkach
  // Identyfikuj typ (weapon, armor, shield, item)
  // Stwórz odpowiednie obiekty
  return {
    weapons: [],
    armors: [],
    shields: [],
    inventory: [],
    mounts: []
  };
}
```

---

## 📝 Plik Konfiguracyjny (opcjonalny)

Stwórz `scripts/config/bestiary-mapping.json` dla łatwej konfiguracji:

```json
{
  "diceGradeMapping": {
    "k4": 2,
    "k6": 3,
    "k8": 4,
    "k10": 5,
    "k12": 6,
    "k14": 7,
    "k20": 10
  },
  "castTimeMapping": {
    "1//D": "Standardowa",
    "2//D": "Pełnorundowa",
    "1//N": "Natychmiastowa",
    "1//NN": "Nadnatychmiastowa"
  },
  "categoryTags": {
    "Walczący Wręcz": "Wojownik",
    "Dystansowi": "Łucznik",
    "Jeźdzcy": "Kawaleria"
  }
}
```

---

## 🗂️ Struktura Plików Wynikowych

```
formatted-data/
  characters.json              # Główny plik - wszystkie postacie
  characters-wojacy.json       # Opcjonalnie: podział na kategorie
  characters-necro.json
  characters-natura.json
  characters-monstra.json
  characters-dzicy.json
  characters-firnamenty.json

raw-data/
  bestiary-parsed-raw.json     # Surowe dane po pierwszym parsowaniu
  bestiary-sheets-analysis.json # Analiza struktury (już istnieje)
```

---

## ⚠️ Wyzwania i Uwagi

### 1. **Parsing Obrażeń jest Skomplikowany**

Przykłady z Excel:
- `"2x(1k6)+4 / 6,+0 (+1)"`
- `"2x(1k6+1)+1k4+5 / 5-6,+3"`
- `"2x(1k14+1)+2k10+15 / 13-14,+5"`

**Rozwiązanie:** 
- Stwórz dedykowany, solidny parser regex
- Testuj na wszystkich unikalnych formatach
- Przygotuj fallback dla niestandardowych formatów

### 2. **Wiersze Umiejętności są Powiązane z Postaciami**

Excel używa `początek` i `Koniec` do grupowania.

**Rozwiązanie:**
- Podczas parsowania, buforuj wiersze między `początek` a `Koniec`
- Przypisz wszystkie umiejętności do głównego obiektu postaci

### 3. **Niektóre Pola Mogą Być Puste lub Mieć Niestandardowy Format**

**Rozwiązanie:**
- Użyj wartości domyślnych
- Loguj ostrzeżenia dla niestandardowych formatów
- Stwórz raport walidacyjny po migracji

### 4. **Różne Zakładki Mogą Mieć Różne Struktury**

Dzicy (18 kolumn) i Firnamenty (19 kolumn) vs reszta (22 kolumny).

**Rozwiązanie:**
- Stwórz elastyczny parser sprawdzający nazwy kolumn zamiast indeksów
- Użyj nagłówków z wiersza 3 do identyfikacji kolumn

### 5. **Tags i Kategorie**

Excel nie ma bezpośredniego pola tags, ale można je wywnioskować z:
- Nazwy zakładki (Wojacy, Necro, etc.)
- Kolumny B (Walczący Wręcz, Dystansowi, etc.)

**Rozwiązanie:**
```typescript
tags: [
  { name: sheet, color: "blue" },           // np. "Wojacy"
  { name: category, color: "green" }        // np. "Walczący Wręcz"
]
```

---

## 🧪 Walidacja

### 1. **Skrypt Walidacyjny** (`scripts/validate-characters.ts`)

**Zadania:**
- Wczytaj `characters.json`
- Sprawdź każdą postać:
  - Wszystkie wymagane pola są wypełnione
  - Typy są poprawne
  - Wartości są w dozwolonych zakresach
- Wygeneruj raport:
  - Liczba poprawnych postaci
  - Lista błędów walidacji
  - Statystyki (średnie HP, obrażenia, etc.)

### 2. **Testy Jednostkowe**

Stwórz testy dla każdej funkcji parsującej:
```typescript
describe('parseHealth', () => {
  it('should parse "24 [2]" correctly', () => {
    const result = parseHealth("24 [2]");
    expect(result.vitality).toBe(24);
    expect(result.toughness).toBe(2);
  });
});
```

---

## 📦 Podsumowanie Kroków Implementacji

1. ✅ **Analiza Excel** (ZROBIONE - `bestiary-sheets-analysis.json`)
2. ⏳ **Stwórz funkcje pomocnicze parsujące** (`scripts/parsers/`)
3. ⏳ **Stwórz skrypt parsujący Excel** (`scripts/parse-bestiary-excel.ts`)
4. ⏳ **Stwórz skrypt transformujący** (`scripts/transform-bestiary-to-characters.ts`)
5. ⏳ **Stwórz skrypt walidacyjny** (`scripts/validate-characters.ts`)
6. ⏳ **Przetestuj na małym zbiorze danych** (np. 10 postaci)
7. ⏳ **Uruchom pełną migrację** (wszystkie ~2176 postaci)
8. ⏳ **Waliduj wyniki**
9. ⏳ **Popraw błędy i re-run**
10. ✅ **Commit `characters.json`**

---

## 🎯 Priorytet Pól

### Krytyczne (Bez nich postać nie działa):
- ✅ name, id, shortName
- ✅ health (vitality, toughness)
- ✅ characteristics (strength, dexterity, constitution)
- ✅ offenses (co najmniej jeden atak)
- ✅ defenses (co najmniej jedna obrona)

### Ważne (Wpływają na gameplay):
- ✅ attributes (initiative, saves)
- ✅ maneuvers
- ✅ perks

### Opcjonalne (Można uzupełnić później):
- talents (można wygenerować domyślne)
- equipment (można mapować podstawowo)
- stances, states (obecnie brak danych)
- powers (obecnie brak danych)

---

## 📄 Przykładowy Output

```json
{
  "id": "01HZXY9...",
  "name": "Amator",
  "shortName": "Amator",
  "description": "Walczący wręcz wojownik bez doświadczenia",
  "tags": [
    { "name": "Wojacy", "color": "blue" },
    { "name": "Walczący Wręcz", "color": "green" }
  ],
  "characteristics": {
    "strength": { "grade": 1, "value": 1, "bonus": 0, "testBonus": 0 },
    "dexterity": { "grade": 1, "value": 1, "bonus": 0, "testBonus": 0 },
    "constitution": { "grade": 1, "value": 1, "bonus": 0, "testBonus": 0 },
    "mind": { "grade": 1, "value": 0, "bonus": 0, "testBonus": 0 },
    "charisma": { "grade": 1, "value": 0, "bonus": 0, "testBonus": 0 },
    "spellborn": { "grade": 1, "value": 0, "bonus": 0, "testBonus": 0 }
  },
  "attributes": {
    "fencing": { "grade": 1, "value": 0, "bonus": 0, "testBonus": 0 },
    "artifice": { "grade": 1, "value": 0, "bonus": 0, "testBonus": 0 },
    "precision": { "grade": 1, "value": 0, "bonus": 0, "testBonus": 0 },
    "initiative": { "grade": 1, "value": 1, "bonus": 0, "testBonus": 0 },
    "martialArt": { "grade": 1, "value": 3, "bonus": 0, "testBonus": 0 },
    "horsemanship": { "grade": 1, "value": 0, "bonus": 0, "testBonus": 0 },
    "fortitude": { "grade": 1, "value": 3, "bonus": 0, "testBonus": 0 },
    "reflex": { "grade": 1, "value": 3, "bonus": 0, "testBonus": 0 },
    "willpower": { "grade": 1, "value": 0, "bonus": 0, "testBonus": 0 }
  },
  "talents": [],
  "health": {
    "barrier": 0,
    "vitality": 24,
    "toughness": 2,
    "recoveryLevel": 0,
    "lethalHealth": 0,
    "lethalRounds": 0,
    "bonus": 0
  },
  "defenses": [
    {
      "id": "01HZXY9...",
      "name": "Podstawowa Obrona",
      "description": "",
      "immunity": 0,
      "resistance": 0,
      "protection": 7,
      "block": 0,
      "parry": 3,
      "dodge": 4,
      "bonus": 0
    }
  ],
  "offenses": [
    {
      "id": "01HZXY9...",
      "name": "Atak Podstawowy",
      "description": "",
      "leadingWeapon": {
        "amount": 2,
        "grade": 3,
        "bonus": 0,
        "critical": {
          "power": 1,
          "range": 0
        }
      },
      "damageBonus": {
        "amount": 0,
        "grade": 1,
        "bonus": 4
      }
    }
  ],
  "equipment": {
    "weapons": [],
    "armors": [],
    "shields": [],
    "inventory": [],
    "mounts": []
  },
  "stances": [],
  "states": [],
  "maneuvers": [
    {
      "id": "01HZXY9...",
      "name": "Prawy Prosty",
      "description": "Dodaje 1 obrażenie",
      "grade": 1,
      "castTime": "Standardowa",
      "cooldown": 1,
      "price": 1,
      "requirements": [],
      "tags": []
    }
  ],
  "powers": [],
  "perks": []
}
```

---

## 🚀 Następne Kroki

Po stworzeniu tego planu, następnym krokiem jest:

1. Przeczytać i zrozumieć cały dokument
2. Zadać pytania o niejasności
3. Stworzyć funkcje pomocnicze parsujące
4. Stworzyć skrypt parsujący Excel
5. Stworzyć skrypt transformujący
6. Uruchomić na małym zbiorze testowym
7. Walidować i poprawiać
8. Uruchomić pełną migrację

**Powodzenia! 🎯**
