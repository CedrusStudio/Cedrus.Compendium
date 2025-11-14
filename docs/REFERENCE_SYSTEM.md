# 🔗 System Referencji - Dokumentacja

## 📋 Przegląd

Zamiast duplikować pełne obiekty manewrów, perków, postaw, stanów i ekwipunku w każdej postaci, **używamy referencji** do istniejących zasobów w `formatted-data/`.

---

## 🎯 Klucz Główny: `name` + `grade`

### Struktura Referencji

```typescript
type Reference = {
  name: string;   // Nazwa (case-insensitive, normalized)
  grade: number;  // Ranga/poziom (domyślnie 1)
};
```

### Przykłady

#### Z numerem końcowym
```typescript
// Excel: "GardaPiesciarza1"
parseNameAndGrade("GardaPiesciarza1")
// → { name: "Garda Pięściarza", grade: 1 }

// Excel: "CiosZawodowca2"
parseNameAndGrade("CiosZawodowca2")
// → { name: "Cios Zawodowca", grade: 2 }

// Excel: "PostawaObronnyKwadrat3"
parseNameAndGrade("PostawaObronnyKwadrat3")
// → { name: "Postawa Obronny Kwadrat", grade: 3 }
```

#### Bez numeru (domyślnie grade = 1)
```typescript
// Excel: "Defensywna walka wręcz"
parseNameAndGrade("Defensywna walka wręcz")
// → { name: "Defensywna walka wręcz", grade: 1 }

// Excel: "Napiętnowane Mięśnie"
parseNameAndGrade("Napiętnowane Mięśnie")
// → { name: "Napiętnowane Mięśnie", grade: 1 }
```

---

## 🔧 Parser: `referenceParser.ts`

### Implementacja

```typescript
/**
 * Parsuje string z Excel na nazwę i rangę.
 * 
 * Obsługuje formaty:
 * - "NazwaZLiteramiWielkimi1" → { name: "Nazwa Z Literami Wielkimi", grade: 1 }
 * - "Normalna nazwa z spacjami" → { name: "Normalna nazwa z spacjami", grade: 1 }
 * - "Nazwa2" → { name: "Nazwa", grade: 2 }
 * 
 * @param rawName - String z Excel (może być camelCase, PascalCase, lub z spacjami)
 * @returns { name: string, grade: number }
 */
export function parseNameAndGrade(rawName: string): { name: string; grade: number } {
  if (!rawName || rawName.trim().length === 0) {
    return { name: "", grade: 1 };
  }

  const trimmed = rawName.trim();
  
  // Pattern: nazwa z opcjonalnym numerem na końcu
  const match = trimmed.match(/^(.+?)(\d+)?$/);
  
  if (!match) {
    return { name: trimmed, grade: 1 };
  }
  
  let name = match[1].trim();
  const grade = match[2] ? parseInt(match[2], 10) : 1;
  
  // Normalizacja nazwy: jeśli brak spacji, dodaj spacje przed wielkimi literami
  if (!name.includes(' ') && /[a-z][A-Z]/.test(name)) {
    name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
  }
  
  return { name, grade };
}

/**
 * Parsuje listę nazw z Excel (rozdzielone przecinkami lub średnikami)
 * 
 * @param raw - String z Excel np. "GardaPiesciarza1, CiosZawodowca2, Defensywna walka wręcz"
 * @returns Array of { name, grade }
 */
export function parseNameAndGradeList(raw: string): Array<{ name: string; grade: number }> {
  if (!raw || raw.trim().length === 0 || raw.toLowerCase() === "brak" || raw.toLowerCase().includes("brak manewrów")) {
    return [];
  }
  
  // Split po przecinkach lub średnikach
  const items = raw.split(/[,;]/).map(s => s.trim()).filter(s => s.length > 0);
  
  return items.map(item => parseNameAndGrade(item));
}

/**
 * Znajduje obiekt w tablicy zasobów po nazwie i randze.
 * Dopasowanie case-insensitive dla nazwy.
 * 
 * @param resources - Tablica zasobów (maneuvers, perks, stances, states)
 * @param name - Nazwa do znalezienia
 * @param grade - Ranga do znalezienia
 * @returns Znaleziony obiekt lub undefined
 */
export function findByNameAndGrade<T extends { name: string; grade: number }>(
  resources: T[],
  name: string,
  grade: number
): T | undefined {
  const normalizedName = name.toLowerCase().trim();
  
  return resources.find(
    r => r.name.toLowerCase().trim() === normalizedName && r.grade === grade
  );
}
```

---

## 📊 Typy TypeScript

### Reference Types

```typescript
// Podstawowe typy referencji
export type ManeuverReference = {
  name: string;
  grade: number;
};

export type PerkReference = {
  name: string;
  grade: number;
};

export type StanceReference = {
  name: string;
  grade: number;
};

export type StateReference = {
  name: string;
  grade: number;
};

export type WeaponReference = {
  name: string;
  grade?: number;  // opcjonalne dla broni (nie wszystkie mają grady)
};

export type ArmorReference = {
  name: string;
  grade?: number;  // opcjonalne dla zbroi
};

export type ShieldReference = {
  name: string;
  grade?: number;  // opcjonalne dla tarcz
};
```

### Equipment References

```typescript
export type EquipmentReferences = {
  weapons: WeaponReference[];
  armors: ArmorReference[];
  shields: ShieldReference[];
  // Inventory i mounts nie używają referencji (to custom items)
  inventory?: Item[];
  mounts?: Mount[];
};
```

### Updated Character Type

```typescript
// ❌ STARA wersja (duplikacja pełnych obiektów):
export type CharacterOLD = {
  // ...
  maneuvers: Maneuver[];  // Pełne obiekty z id, name, grade, description, etc.
  perks: Perk[];
  stances: Mode[];
  states: Mode[];
  equipment: {
    weapons: Weapon[];
    armors: Armor[];
    shields: Shield[];
    // ...
  };
};

// ✅ NOWA wersja (referencje):
export type Character = {
  // ...
  maneuvers: ManeuverReference[];  // Tylko { name, grade }
  perks: PerkReference[];
  stances: StanceReference[];
  states: StateReference[];
  equipment: {
    weapons: WeaponReference[];
    armors: ArmorReference[];
    shields: ShieldReference[];
    inventory: Item[];  // Bez zmian
    mounts: Mount[];    // Bez zmian
  };
};
```

---

## 🗺️ Mapowanie z Excel

### Manewry

**Źródła danych:**
1. **Kolumna `__EMPTY_12`**: Lista manewrów oddzielona przecinkami
   - Przykład: `"Brak Manewrów"`, `"GardaPiesciarza1, CiosZawodowca2"`
2. **Wiersze umiejętności**: Dodatkowe manewry z `actionType`

**Parser:**

```typescript
import { parseNameAndGradeList } from './referenceParser';

export type Ability = {
  name: string;
  description: string;
  actionType?: string;  // np. "1//D", "Standardowa", etc.
};

export function parseManeuverReferences(
  maneuversRaw: string,
  abilities: Ability[]
): ManeuverReference[] {
  const refs: ManeuverReference[] = [];
  
  // 1. Parsuj z kolumny __EMPTY_12
  const fromColumn = parseNameAndGradeList(maneuversRaw);
  refs.push(...fromColumn);
  
  // 2. Dodaj z ability rows (jeśli mają actionType = są manewrami)
  for (const ability of abilities) {
    if (ability.actionType) {
      const { name, grade } = parseNameAndGrade(ability.name);
      
      // Dodaj tylko jeśli nie ma już takiego manewru
      if (!refs.some(r => r.name === name && r.grade === grade)) {
        refs.push({ name, grade });
      }
    }
  }
  
  return refs;
}
```

**Przykład:**

```typescript
// Excel input:
const maneuversRaw = "GardaPiesciarza1, Cios Zawodowca";
const abilities = [
  { name: "CiosPelny2", description: "...", actionType: "Standardowa" },
  { name: "NapietowaneMiesnie", description: "...", actionType: undefined }
];

// Output:
parseManeuverReferences(maneuversRaw, abilities)
// [
//   { name: "Garda Piesciarza", grade: 1 },
//   { name: "Cios Zawodowca", grade: 1 },
//   { name: "Cios Pelny", grade: 2 }
// ]
```

---

### Perki

**Źródło danych:** Wiersze umiejętności **BEZ** `actionType`

**Parser:**

```typescript
export function parsePerkReferences(abilities: Ability[]): PerkReference[] {
  const refs: PerkReference[] = [];
  
  for (const ability of abilities) {
    // Pominąć jeśli to manewr (ma actionType)
    if (ability.actionType) continue;
    
    const { name, grade } = parseNameAndGrade(ability.name);
    refs.push({ name, grade });
  }
  
  return refs;
}
```

**Przykład:**

```typescript
// Excel input:
const abilities = [
  { name: "CiosPelny2", description: "...", actionType: "Standardowa" },  // Manewr
  { name: "NapietowaneMiesnie", description: "...", actionType: undefined },  // Perk
  { name: "DefensywnaWalkaWrecz", description: "...", actionType: undefined }  // Perk
];

// Output:
parsePerkReferences(abilities)
// [
//   { name: "Napietowane Miesnie", grade: 1 },
//   { name: "Defensywna Walka Wrecz", grade: 1 }
// ]
```

---

### Ekwipunek (Weapons, Armors, Shields)

**Źródło danych:** Kolumna `__EMPTY_13`  
**Format:** Lista oddzielona przecinkami, np. `"Walka Wręcz, Bez zbroi, Mała Tarcza"`

**Parser:**

```typescript
export function parseEquipmentReferences(raw: string): EquipmentReferences {
  const items = raw.split(',').map(i => i.trim()).filter(i => i.length > 0);
  
  const refs: EquipmentReferences = {
    weapons: [],
    armors: [],
    shields: []
  };
  
  for (const item of items) {
    const lowerItem = item.toLowerCase();
    
    // Identyfikacja typu
    if (isWeapon(lowerItem)) {
      const { name, grade } = parseNameAndGrade(item);
      refs.weapons.push({ name, grade });
    } else if (isArmor(lowerItem)) {
      const { name, grade } = parseNameAndGrade(item);
      refs.armors.push({ name, grade });
    } else if (isShield(lowerItem)) {
      const { name, grade } = parseNameAndGrade(item);
      refs.shields.push({ name, grade });
    }
  }
  
  return refs;
}

function isWeapon(name: string): boolean {
  const weaponKeywords = [
    'walka wręcz', 'walka wrêcz',
    'miecz', 'topór', 'topor', 'włócznia', 'wlocznia',
    'młot', 'mlot', 'buzdygan', 'maczuga',
    'łuk', 'luk', 'kusza', 'proca',
    'sztylet', 'rapier', 'szabla', 'katana'
  ];
  
  return weaponKeywords.some(keyword => name.includes(keyword));
}

function isArmor(name: string): boolean {
  const armorKeywords = [
    'zbroja', 'kirys', 'bez zbroi',
    'lekka', 'średnia', 'srednia', 'ciężka', 'ciezka',
    'skórzana', 'skorzana', 'kolcza', 'płytowa', 'plytowa'
  ];
  
  return armorKeywords.some(keyword => name.includes(keyword));
}

function isShield(name: string): boolean {
  const shieldKeywords = [
    'tarcza', 'puklerz', 'pawęż', 'pawez'
  ];
  
  return shieldKeywords.some(keyword => name.includes(keyword));
}
```

**Przykład:**

```typescript
// Excel input:
const raw = "Gladius, Lekka Zbroja, Mała Tarcza";

// Output:
parseEquipmentReferences(raw)
// {
//   weapons: [{ name: "Gladius", grade: 1 }],
//   armors: [{ name: "Lekka Zbroja", grade: 1 }],
//   shields: [{ name: "Mała Tarcza", grade: 1 }]
// }
```

---

## ✅ Walidacja Referencji

### Skrypt: `scripts/validate-references.ts`

```typescript
import { loadManeuvers, loadPerks, loadStances, loadStates, loadWeapons, loadArmors, loadShields } from './loaders';
import { findByNameAndGrade } from './parsers/referenceParser';

export type ValidationError = {
  characterName: string;
  errorType: 'maneuver' | 'perk' | 'stance' | 'state' | 'weapon' | 'armor' | 'shield';
  referenceName: string;
  referenceGrade: number;
  message: string;
};

export type ValidationReport = {
  valid: boolean;
  totalCharacters: number;
  totalReferences: number;
  invalidReferences: number;
  errors: ValidationError[];
};

export function validateReferences(characters: Character[]): ValidationReport {
  // Wczytaj wszystkie zasoby
  const maneuvers = loadManeuvers();
  const perks = loadPerks();
  const stances = loadStances();
  const states = loadStates();
  const weapons = loadWeapons();
  const armors = loadArmors();
  const shields = loadShields();
  
  const errors: ValidationError[] = [];
  let totalReferences = 0;
  
  for (const char of characters) {
    // Waliduj manewry
    for (const ref of char.maneuvers) {
      totalReferences++;
      if (!findByNameAndGrade(maneuvers, ref.name, ref.grade)) {
        errors.push({
          characterName: char.name,
          errorType: 'maneuver',
          referenceName: ref.name,
          referenceGrade: ref.grade,
          message: `Maneuver "${ref.name}" grade ${ref.grade} not found in maneuvers.json`
        });
      }
    }
    
    // Waliduj perki
    for (const ref of char.perks) {
      totalReferences++;
      if (!findByNameAndGrade(perks, ref.name, ref.grade)) {
        errors.push({
          characterName: char.name,
          errorType: 'perk',
          referenceName: ref.name,
          referenceGrade: ref.grade,
          message: `Perk "${ref.name}" grade ${ref.grade} not found in perks.json`
        });
      }
    }
    
    // Waliduj postawy
    for (const ref of char.stances) {
      totalReferences++;
      if (!findByNameAndGrade(stances, ref.name, ref.grade)) {
        errors.push({
          characterName: char.name,
          errorType: 'stance',
          referenceName: ref.name,
          referenceGrade: ref.grade,
          message: `Stance "${ref.name}" grade ${ref.grade} not found in stances.json`
        });
      }
    }
    
    // Waliduj stany
    for (const ref of char.states) {
      totalReferences++;
      if (!findByNameAndGrade(states, ref.name, ref.grade)) {
        errors.push({
          characterName: char.name,
          errorType: 'state',
          referenceName: ref.name,
          referenceGrade: ref.grade,
          message: `State "${ref.name}" grade ${ref.grade} not found in states.json`
        });
      }
    }
    
    // Waliduj broń
    for (const ref of char.equipment.weapons) {
      totalReferences++;
      const found = weapons.find(w => w.name.toLowerCase() === ref.name.toLowerCase());
      if (!found) {
        errors.push({
          characterName: char.name,
          errorType: 'weapon',
          referenceName: ref.name,
          referenceGrade: ref.grade || 1,
          message: `Weapon "${ref.name}" not found in weapons.json`
        });
      }
    }
    
    // Waliduj zbroje
    for (const ref of char.equipment.armors) {
      totalReferences++;
      const found = armors.find(a => a.name.toLowerCase() === ref.name.toLowerCase());
      if (!found) {
        errors.push({
          characterName: char.name,
          errorType: 'armor',
          referenceName: ref.name,
          referenceGrade: ref.grade || 1,
          message: `Armor "${ref.name}" not found in armors.json`
        });
      }
    }
    
    // Waliduj tarcze
    for (const ref of char.equipment.shields) {
      totalReferences++;
      const found = shields.find(s => s.name.toLowerCase() === ref.name.toLowerCase());
      if (!found) {
        errors.push({
          characterName: char.name,
          errorType: 'shield',
          referenceName: ref.name,
          referenceGrade: ref.grade || 1,
          message: `Shield "${ref.name}" not found in shields.json`
        });
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    totalCharacters: characters.length,
    totalReferences,
    invalidReferences: errors.length,
    errors
  };
}

// Funkcja do wypisania raportu
export function printValidationReport(report: ValidationReport): void {
  console.log('\n=== VALIDATION REPORT ===\n');
  console.log(`Total Characters: ${report.totalCharacters}`);
  console.log(`Total References: ${report.totalReferences}`);
  console.log(`Invalid References: ${report.invalidReferences}`);
  console.log(`Valid: ${report.valid ? '✅ YES' : '❌ NO'}\n`);
  
  if (!report.valid) {
    console.log('ERRORS:\n');
    
    // Grupuj błędy po typie
    const byType = report.errors.reduce((acc, err) => {
      if (!acc[err.errorType]) acc[err.errorType] = [];
      acc[err.errorType].push(err);
      return acc;
    }, {} as Record<string, ValidationError[]>);
    
    for (const [type, errors] of Object.entries(byType)) {
      console.log(`\n${type.toUpperCase()} (${errors.length} errors):`);
      for (const err of errors.slice(0, 10)) {  // Pokaż max 10 dla każdego typu
        console.log(`  - [${err.characterName}] ${err.message}`);
      }
      if (errors.length > 10) {
        console.log(`  ... and ${errors.length - 10} more`);
      }
    }
  } else {
    console.log('✅ All references are valid!');
  }
}
```

---

## 🎨 Zalety Systemu Referencji

### 1. **Brak Duplikacji** ✅
- Dane manewrów/perków są **tylko w jednym miejscu**: `formatted-data/maneuvers.json`, `perks.json`, etc.
- `characters.json` zawiera **tylko referencje** `{ name, grade }`

### 2. **Łatwiejsze Updates** ✅
- Zmiana opisu manewru? Wystarczy edytować `maneuvers.json`
- Automatycznie zmienia się dla **wszystkich postaci**

### 3. **Mniejszy Rozmiar** ✅
```typescript
// ❌ STARA wersja (~200 KB na 10 postaci):
{
  "maneuvers": [
    {
      "id": "01HZXY...",
      "name": "Garda Pięściarza",
      "grade": 1,
      "description": "Długi opis...",
      "castTime": "Standardowa",
      "cooldown": 1,
      "requirements": [...],
      "tags": [...]
    }
  ]
}

// ✅ NOWA wersja (~10 KB na 10 postaci):
{
  "maneuvers": [
    { "name": "Garda Pięściarza", "grade": 1 }
  ]
}
```

### 4. **Spójność** ✅
- Jedna wersja prawdy dla każdego manewru/perku
- Brak problemu z desynchronizacją danych

### 5. **Łączenie w Frontend** ✅
```typescript
// Frontend może łatwo połączyć referencje z pełnymi danymi:
function hydrateCharacter(char: Character): HydratedCharacter {
  const allManeuvers = loadManeuvers();
  
  return {
    ...char,
    maneuvers: char.maneuvers.map(ref => 
      findByNameAndGrade(allManeuvers, ref.name, ref.grade)
    )
  };
}
```

---

## 📈 Porównanie Rozmiaru Plików

### Szacunkowe rozmiary dla ~2,176 postaci:

| Wariant | Rozmiar `characters.json` | Uwagi |
|---------|---------------------------|-------|
| **Pełne obiekty** | ~15-20 MB | Duplikacja wszystkich danych |
| **Referencje** | ~2-3 MB | Tylko `{ name, grade }` |
| **Oszczędność** | **~85%** | Znacznie mniejszy plik! |

---

## 🚀 Workflow Frontend

### 1. Ładowanie Zasobów

```typescript
// Wczytaj raz przy starcie aplikacji
const maneuvers = await fetch('/data/maneuvers.json').then(r => r.json());
const perks = await fetch('/data/perks.json').then(r => r.json());
const stances = await fetch('/data/stances.json').then(r => r.json());
const states = await fetch('/data/states.json').then(r => r.json());
```

### 2. Wczytanie Postaci

```typescript
const characters = await fetch('/data/characters.json').then(r => r.json());
```

### 3. Hydratacja (Łączenie Referencji)

```typescript
function hydrateManeuvers(refs: ManeuverReference[]): Maneuver[] {
  return refs
    .map(ref => findByNameAndGrade(maneuvers, ref.name, ref.grade))
    .filter(m => m !== undefined) as Maneuver[];
}

function hydrateCharacter(char: Character): HydratedCharacter {
  return {
    ...char,
    maneuvers: hydrateManeuvers(char.maneuvers),
    perks: hydratePerks(char.perks),
    stances: hydrateStances(char.stances),
    states: hydrateStates(char.states),
    equipment: {
      weapons: hydrateWeapons(char.equipment.weapons),
      armors: hydrateArmors(char.equipment.armors),
      shields: hydrateShields(char.equipment.shields),
      inventory: char.equipment.inventory,
      mounts: char.equipment.mounts
    }
  };
}
```

---

## 📝 Przykład Output

### `characters.json` (z referencjami)

```json
[
  {
    "id": "01K9Z6YJVY...",
    "name": "Gladiator",
    "shortName": "Gladiator",
    "description": "Doświadczony wojownik areny",
    "tags": ["wojownik", "gladiator"],
    "characteristics": { /* ... */ },
    "attributes": { /* ... */ },
    "health": { /* ... */ },
    "defenses": [ /* ... */ ],
    "offenses": [ /* ... */ ],
    "equipment": {
      "weapons": [
        { "name": "Gladius", "grade": 1 }
      ],
      "armors": [
        { "name": "Lekka Zbroja", "grade": 1 }
      ],
      "shields": [
        { "name": "Mała Tarcza", "grade": 1 }
      ],
      "inventory": [],
      "mounts": []
    },
    "maneuvers": [
      { "name": "Garda Pięściarza", "grade": 1 },
      { "name": "Cios Zawodowca", "grade": 2 }
    ],
    "perks": [
      { "name": "Napiętnowane Mięśnie", "grade": 1 },
      { "name": "Defensywna walka wręcz", "grade": 1 }
    ],
    "stances": [],
    "states": [],
    "powers": [],
    "talents": []
  }
]
```

---

## ✅ Checklist Implementacji

- [ ] Stwórz `scripts/parsers/referenceParser.ts`
- [ ] Update `scripts/parsers/maneuverParser.ts` (zwraca referencje)
- [ ] Stwórz `scripts/parsers/perkParser.ts` (zwraca referencje)
- [ ] Update `scripts/parsers/equipmentParser.ts` (zwraca referencje)
- [ ] Stwórz `scripts/validate-references.ts`
- [ ] Update `scripts/transform-bestiary-to-characters.ts` (używa nowych parserów)
- [ ] Testuj na małym zbiorze (10 postaci)
- [ ] Uruchom walidację referencji
- [ ] Popraw błędy walidacji
- [ ] Uruchom pełną migrację (~2,176 postaci)
- [ ] Commit `formatted-data/characters.json`

---

**Dokument stworzony:** 2025-11-14  
**Status:** ✅ System Referencji - Gotowy do Implementacji
