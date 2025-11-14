# 🗺️ Szczegółowe Mapowanie Pól - Bestiary → Character

## 📋 Spis Treści
1. [Przegląd Struktury Excel](#przegląd-struktury-excel)
2. [Mapowanie Pól - Tabela Odniesienia](#mapowanie-pól---tabela-odniesienia)
3. [Przykłady Parsowania](#przykłady-parsowania)
4. [Wzorce Regex](#wzorce-regex)
5. [Wartości Domyślne](#wartości-domyślne)
6. [Przypadki Brzegowe](#przypadki-brzegowe)

---

## Przegląd Struktury Excel

### Identyfikacja Kolumn

Excel nie ma nazwanych kolumn, więc identyfikacja odbywa się przez:
- **Wiersz 3** zawiera nagłówki (np. "Nazwa", "Zdrowie", "Odporność", etc.)
- **Kolumny A-V** (0-21 w indeksowaniu)

### Typy Wierszy

```
Wiersz 1: Pusta kategoria (np. ">> Wojownicy <<")
Wiersz 2: Podkategoria (np. "Walczący Wręcz")
Wiersz 3: Nagłówki kolumn
Wiersz 4+: Dane postaci i umiejętności
```

**Rozpoznawanie typu wiersza:**
```typescript
if (row.początek > 0 && row.Koniec > row.początek) {
  // To jest wiersz postaci głównej
} else if (row.początek === "" && previousRow.type === "character") {
  // To jest umiejętność/manewr należący do poprzedniej postaci
} else if (row.__EMPTY !== null && row.__EMPTY_1 === null) {
  // To jest wiersz podkategorii
}
```

---

## Mapowanie Pól - Tabela Odniesienia

### 🏷️ Podstawowe Informacje (Entity)

| Excel Kolumna | Indeks | Nazwa w JSON | Character Path | Typ | Parser | Priorytet |
|---------------|--------|--------------|----------------|-----|--------|-----------|
| `__EMPTY_1` | C | Nazwa | `name` | string | Direct | ✅ Krytyczny |
| `__EMPTY_1` | C | Nazwa (skrócona) | `shortName` | string | `generateShortName()` | ✅ Krytyczny |
| - | - | ID | `id` | string | `ulid()` | ✅ Krytyczny |
| `__EMPTY_2` (umiejętności) | D | Opis | `description` | string | `combineAbilityDescriptions()` | ⚠️ Ważny |
| `__EMPTY` | B | Kategoria | `tags[0]` | Tag | `{ name, color: "green" }` | ⚠️ Ważny |
| Sheet name | - | Zakładka | `tags[1]` | Tag | `{ name, color: "blue" }` | ⚠️ Ważny |

**Funkcje parsujące:**
```typescript
function generateShortName(name: string): string {
  // Weź pierwsze słowo lub pierwsze 15 znaków
  const words = name.split(' ');
  return words[0].length > 15 ? name.substring(0, 15) : words[0];
}

function combineAbilityDescriptions(abilities: Ability[]): string {
  return abilities
    .filter(a => a.description && a.description.length > 0)
    .map(a => `${a.name}: ${a.description}`)
    .join('\n');
}
```

---

### 💪 Cechy (Characteristics)

| Excel Kolumna | Indeks | Wartość Excel | Character Path | Parser | Priorytet |
|---------------|--------|---------------|----------------|--------|-----------|
| `__EMPTY_11` | M | "1 // 1 // 1" | `characteristics.strength` | `parseStats()` [0] | ✅ Krytyczny |
| `__EMPTY_11` | M | "1 // 1 // 1" | `characteristics.dexterity` | `parseStats()` [1] | ✅ Krytyczny |
| `__EMPTY_11` | M | "1 // 1 // 1" | `characteristics.constitution` | `parseStats()` [2] | ✅ Krytyczny |
| - | - | - | `characteristics.mind` | Default: 0 | 💡 Opcjonalny |
| - | - | - | `characteristics.charisma` | Default: 0 | 💡 Opcjonalny |
| - | - | - | `characteristics.spellborn` | Default: 0 | 💡 Opcjonalny |

**Format Excel:** `"S // Zr // Bd"` lub `"1 // 1 // 1"`

**Parser:**
```typescript
function parseStats(raw: string): {
  strength: Statistic;
  dexterity: Statistic;
  constitution: Statistic;
} {
  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)\s*\/\/\s*(\d+)/);
  
  const createStat = (value: number): Statistic => ({
    grade: 1,
    value,
    bonus: 0,
    testBonus: 0
  });

  if (!match) {
    return {
      strength: createStat(0),
      dexterity: createStat(0),
      constitution: createStat(0)
    };
  }

  return {
    strength: createStat(parseInt(match[1])),
    dexterity: createStat(parseInt(match[2])),
    constitution: createStat(parseInt(match[3]))
  };
}
```

**Przykłady:**
- `"1 // 1 // 1"` → S:1, Zr:1, Bd:1
- `"2 // 1"` → S:2, Zr:1, Bd:0 (niepełne)
- `""` → S:0, Zr:0, Bd:0 (domyślne)

---

### 🎯 Atrybuty (Attributes)

| Excel Kolumna | Indeks | Wartość Excel | Character Path | Parser | Priorytet |
|---------------|--------|---------------|----------------|--------|-----------|
| `__EMPTY_8` | J | "3 // 0" | `attributes.martialArt` lub `fencing` | `parseCombatSkill()` [0] | ✅ Krytyczny |
| `__EMPTY_8` | J | "3 // 0" | `attributes.artifice` | `parseCombatSkill()` [1] | ⚠️ Ważny |
| `__EMPTY_7` | I | 1 | `attributes.initiative` | Direct | ✅ Krytyczny |
| `__EMPTY_10` | L | "3 // 3 // 0" | `attributes.willpower` | `parseSaves()` [0] | ⚠️ Ważny |
| `__EMPTY_10` | L | "3 // 3 // 0" | `attributes.reflex` | `parseSaves()` [1] | ⚠️ Ważny |
| `__EMPTY_10` | L | "3 // 3 // 0" | `attributes.fortitude` | `parseSaves()` [2] | ⚠️ Ważny |
| - | - | - | `attributes.precision` | Default: 0 | 💡 Opcjonalny |
| - | - | - | `attributes.horsemanship` | Default: 0 | 💡 Opcjonalny |

**Format Excel:**
- Walka: `"3 // 0"` (Walka Wręcz / Fortel)
- Rzuty obronne: `"3 // 3 // 0"` (Wola / Odruch / Kondycja)

**Parsery:**
```typescript
function parseCombatSkill(raw: string): {
  primary: number;
  secondary: number;
} {
  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)/);
  if (!match) return { primary: 0, secondary: 0 };
  return {
    primary: parseInt(match[1]),
    secondary: parseInt(match[2])
  };
}

function parseSaves(raw: string): {
  willpower: Statistic;
  reflex: Statistic;
  fortitude: Statistic;
} {
  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)\s*\/\/\s*(\d+)/);
  
  const createStat = (value: number): Statistic => ({
    grade: 1,
    value,
    bonus: 0,
    testBonus: 0
  });

  if (!match) {
    return {
      willpower: createStat(0),
      reflex: createStat(0),
      fortitude: createStat(0)
    };
  }

  return {
    willpower: createStat(parseInt(match[1])),
    reflex: createStat(parseInt(match[2])),
    fortitude: createStat(parseInt(match[3]))
  };
}
```

---

### ❤️ Zdrowie (Health)

| Excel Kolumna | Indeks | Wartość Excel | Character Path | Parser | Priorytet |
|---------------|--------|---------------|----------------|--------|-----------|
| `__EMPTY_2` | D | "24 [2]" | `health.vitality` | `parseHealth()` .vitality | ✅ Krytyczny |
| `__EMPTY_2` | D | "24 [2]" | `health.toughness` | `parseHealth()` .toughness | ✅ Krytyczny |
| - | - | - | `health.barrier` | Default: 0 | 💡 Opcjonalny |
| - | - | - | `health.recoveryLevel` | Default: 0 | 💡 Opcjonalny |
| - | - | - | `health.lethalHealth` | Default: 0 | 💡 Opcjonalny |
| - | - | - | `health.lethalRounds` | Default: 0 | 💡 Opcjonalny |
| - | - | - | `health.bonus` | Default: 0 | 💡 Opcjonalny |

**Format Excel:** `"24 [2]"` gdzie:
- `24` = vitality (punkty życia bazowe)
- `[2]` = toughness (mnożnik z budowy)

**Parser:**
```typescript
interface HealthParseResult {
  vitality: number;
  toughness: number;
}

function parseHealth(raw: string): HealthParseResult {
  // Pattern: liczba [liczba]
  const match = raw.match(/(\d+)\s*\[(\d+)\]/);
  
  if (!match) {
    console.warn(`Unable to parse health: "${raw}"`);
    return { vitality: 0, toughness: 0 };
  }
  
  return {
    vitality: parseInt(match[1]),
    toughness: parseInt(match[2])
  };
}
```

**Przykłady:**
- `"24 [2]"` → vitality: 24, toughness: 2
- `"36 (-5) [2]"` → vitality: 36, toughness: 2 (ignoruj modyfikatory w nawiasach)
- `"51 (-6) [3]"` → vitality: 51, toughness: 3

**Obliczanie Total Health:**
```typescript
function calculateTotalHealth(character: Character): number {
  return character.health.vitality 
    + (character.health.toughness * character.characteristics.constitution.value)
    + character.characteristics.constitution.bonus 
    + character.attributes.fortitude.value
    + character.health.bonus;
}
```

---

### 🛡️ Obrona (Defenses)

| Excel Kolumna | Indeks | Wartość Excel | Defense Path | Parser | Priorytet |
|---------------|--------|---------------|--------------|--------|-----------|
| `__EMPTY_3` | E | 0 | `immunity` | Direct | ✅ Krytyczny |
| `__EMPTY_4` | F | "7 [0]" | `resistance` | `parseReduction()` .value | ⚠️ Ważny |
| `__EMPTY_4` | F | "7 [0]" | `protection` | `parseReduction()` .value | ✅ Krytyczny |
| `__EMPTY_4` | F | "7 [0]" | `block` | `parseReduction()` .blockValue | ✅ Krytyczny |
| `__EMPTY_9` | K | "3 // 4" | `parry` | `parseDefense()` .parry | ✅ Krytyczny |
| `__EMPTY_9` | K | "3 // 4" | `dodge` | `parseDefense()` .dodge | ✅ Krytyczny |
| `__EMPTY_5` | G | 0 | `dodge` (alt) | Direct (dodaj do dodge) | ⚠️ Ważny |
| - | - | - | `bonus` | Default: 0 | 💡 Opcjonalny |

**Formaty Excel:**
- Redukcja: `"7 [0]"` gdzie 7 = protection, [0] = block
- Parowanie/Uniki: `"3 // 4"` gdzie 3 = parry, 4 = dodge
- Redukcja kości: liczba całkowita dodawana do dodge

**Parsery:**
```typescript
interface ReductionParseResult {
  value: number;        // protection/resistance
  blockValue: number;   // block
}

function parseReduction(raw: string | number): ReductionParseResult {
  if (typeof raw === 'number') {
    return { value: raw, blockValue: 0 };
  }
  
  const match = raw.match(/(\d+)\s*\[(\d+)\]/);
  
  if (!match) {
    // Fallback: tylko liczba bez nawiasów
    const num = parseInt(raw);
    if (!isNaN(num)) {
      return { value: num, blockValue: 0 };
    }
    return { value: 0, blockValue: 0 };
  }
  
  return {
    value: parseInt(match[1]),
    blockValue: parseInt(match[2])
  };
}

interface DefenseParseResult {
  parry: number;
  dodge: number;
}

function parseDefense(raw: string | number): DefenseParseResult {
  if (typeof raw === 'number') {
    return { parry: 0, dodge: raw };
  }
  
  const match = raw.match(/(\d+)\s*\/\/\s*(\d+)/);
  
  if (!match) {
    return { parry: 0, dodge: 0 };
  }
  
  return {
    parry: parseInt(match[1]),
    dodge: parseInt(match[2])
  };
}
```

**Tworzenie Defense obiektu:**
```typescript
function createDefense(row: ExcelRow): Defense {
  const reduction = parseReduction(row.__EMPTY_4);
  const defense = parseDefense(row.__EMPTY_9);
  const dodgeBonus = typeof row.__EMPTY_5 === 'number' ? row.__EMPTY_5 : 0;
  
  return {
    id: ulid(),
    name: "Podstawowa Obrona",
    description: "",
    immunity: row.__EMPTY_3 || 0,
    resistance: reduction.value,
    protection: reduction.value,
    block: reduction.blockValue,
    parry: defense.parry,
    dodge: defense.dodge + dodgeBonus,
    bonus: 0
  };
}
```

**Przykłady:**
- `"7 [0]"`, `"3 // 4"`, `0` → protection:7, block:0, parry:3, dodge:4
- `"12 [0]"`, `"0 // 5"`, `0` → protection:12, block:0, parry:0, dodge:5
- `"16 [0]"`, `"0 // 11"`, `0` → protection:16, block:0, parry:0, dodge:11

---

### ⚔️ Atak (Offenses)

| Excel Kolumna | Indeks | Wartość Excel | Offense Path | Parser | Priorytet |
|---------------|--------|---------------|--------------|--------|-----------|
| `__EMPTY_6` | H | "2x(1k6)+4 / 6,+0 (+1)" | `leadingWeapon` | `parseDamage()` .leading | ✅ Krytyczny |
| `__EMPTY_6` | H | "2x(1k6)+4 / 6,+0 (+1)" | `damageBonus` | `parseDamage()` .bonus | ⚠️ Ważny |
| - | - | - | `secondaryWeapon` | undefined | 💡 Opcjonalny |

**Format Excel:** `"Kości broni / Krytyk"`

**Przykłady formatów:**
- `"2x(1k6)+4 / 6,+0 (+1)"`
- `"2x(1k6+1)+1k4+5 / 5-6,+3"`
- `"2x(1k14+1)+2k10+15 / 13-14,+5"`
- `"2x(1k6)+2 / 6,+2"`

**Struktura:**
```
[Część Kości] / [Część Krytyczna]

Część Kości:
- Główne kości: 2x(1k6+1)
- Dodatkowe kości: +1k4
- Flat bonus: +5

Część Krytyczna:
- Zakres: 5-6 lub 6
- Siła: +3
```

**Parser (BARDZO WAŻNY):**
```typescript
interface DamageParseResult {
  leading: WeaponOffense;
  bonus: DamageOffense;
}

interface DiceInfo {
  amount: number;
  grade: number;
  bonus: number;
}

function parseDamage(raw: string): DamageParseResult {
  // Split na część kości i krytyk
  const parts = raw.split('/').map(p => p.trim());
  
  if (parts.length !== 2) {
    console.warn(`Invalid damage format: "${raw}"`);
    return {
      leading: createDefaultWeaponOffense(),
      bonus: createDefaultDamageOffense()
    };
  }
  
  const [dicePart, criticalPart] = parts;
  
  // Parse kości
  const { mainDice, extraDice, flatBonus } = parseDicePart(dicePart);
  
  // Parse krytyk
  const critical = parseCritical(criticalPart);
  
  return {
    leading: {
      ...mainDice,
      critical
    },
    bonus: {
      amount: extraDice?.amount || 0,
      grade: extraDice?.grade || 1,
      bonus: flatBonus
    }
  };
}

function parseDicePart(part: string): {
  mainDice: DiceInfo;
  extraDice: DiceInfo | null;
  flatBonus: number;
} {
  // Pattern dla głównych kości: 2x(1k6+1) lub 2x(1k6)
  const mainPattern = /(\d+)x\((\d+)k(\d+)([+-]\d+)?\)/;
  const mainMatch = part.match(mainPattern);
  
  if (!mainMatch) {
    console.warn(`Unable to parse main dice: "${part}"`);
    return {
      mainDice: { amount: 1, grade: 1, bonus: 0 },
      extraDice: null,
      flatBonus: 0
    };
  }
  
  const multiplier = parseInt(mainMatch[1]);  // 2x
  const diceAmount = parseInt(mainMatch[2]);  // 1 (przed k6)
  const diceValue = parseInt(mainMatch[3]);   // 6 (k6)
  const perDiceBonus = mainMatch[4] ? parseInt(mainMatch[4]) : 0;  // +1
  
  const mainDice: DiceInfo = {
    amount: diceAmount,
    grade: diceValueToGrade(diceValue),
    bonus: perDiceBonus
  };
  
  // Usuń główne kości z części
  const remaining = part.replace(mainPattern, '').trim();
  
  // Pattern dla dodatkowych kości: +1k4 lub +2k10
  const extraPattern = /\+(\d+)k(\d+)/;
  const extraMatch = remaining.match(extraPattern);
  
  let extraDice: DiceInfo | null = null;
  let flatBonus = 0;
  
  if (extraMatch) {
    extraDice = {
      amount: parseInt(extraMatch[1]),
      grade: diceValueToGrade(parseInt(extraMatch[2])),
      bonus: 0
    };
    
    // Pozostały flat bonus
    const afterExtra = remaining.replace(extraPattern, '').trim();
    const flatMatch = afterExtra.match(/\+(\d+)/);
    if (flatMatch) {
      flatBonus = parseInt(flatMatch[1]);
    }
  } else {
    // Brak dodatkowych kości, tylko flat bonus
    const flatMatch = remaining.match(/\+(\d+)/);
    if (flatMatch) {
      flatBonus = parseInt(flatMatch[1]);
    }
  }
  
  return { mainDice, extraDice, flatBonus };
}

function parseCritical(part: string): Critical {
  // Pattern: 5-6,+3 lub 6,+2 lub 19-20,+5
  const pattern = /(\d+)(?:-(\d+))?,\s*([+-]\d+)/;
  const match = part.match(pattern);
  
  if (!match) {
    console.warn(`Unable to parse critical: "${part}"`);
    return { range: 0, power: 0 };
  }
  
  const minRange = parseInt(match[1]);
  const maxRange = match[2] ? parseInt(match[2]) : minRange;
  const power = parseInt(match[3]);
  
  // Range to rozszerzenie zakresu krytyka
  // Jeśli mamy k6 (max 6), a critical to "5-6", to range = 1 (bo normalnie tylko 6 byłoby krytykiem)
  // W praktyce: range = maxRange - minRange
  const range = maxRange - minRange;
  
  return {
    range,
    power
  };
}

function diceValueToGrade(value: number): number {
  const mapping: Record<number, number> = {
    4: 2,
    6: 3,
    8: 4,
    10: 5,
    12: 6,
    14: 7,
    16: 8,
    18: 9,
    20: 10
  };
  
  return mapping[value] || 1;
}

function createDefaultWeaponOffense(): WeaponOffense {
  return {
    amount: 1,
    grade: 1,
    bonus: 0,
    critical: { range: 0, power: 0 }
  };
}

function createDefaultDamageOffense(): DamageOffense {
  return {
    amount: 0,
    grade: 1,
    bonus: 0
  };
}
```

**Przykłady parsowania:**

#### Przykład 1: `"2x(1k6)+4 / 6,+0 (+1)"`
```typescript
leadingWeapon: {
  amount: 1,
  grade: 3,        // k6 = 3
  bonus: 0,
  critical: {
    range: 0,      // tylko 6
    power: 0
  }
}

damageBonus: {
  amount: 0,
  grade: 1,
  bonus: 4         // flat +4
}
```

#### Przykład 2: `"2x(1k6+1)+1k4+5 / 5-6,+3"`
```typescript
leadingWeapon: {
  amount: 1,
  grade: 3,        // k6 = 3
  bonus: 1,        // +1 per die
  critical: {
    range: 1,      // 5-6 = range 1
    power: 3       // +3
  }
}

damageBonus: {
  amount: 1,       // 1k4
  grade: 2,        // k4 = 2
  bonus: 5         // +5 flat
}
```

#### Przykład 3: `"2x(1k14+1)+2k10+15 / 13-14,+5"`
```typescript
leadingWeapon: {
  amount: 1,
  grade: 7,        // k14 = 7
  bonus: 1,
  critical: {
    range: 1,      // 13-14 = range 1
    power: 5
  }
}

damageBonus: {
  amount: 2,       // 2k10
  grade: 5,        // k10 = 5
  bonus: 15        // +15 flat
}
```

---

### 🎭 Manewry (Maneuvers)

Manewry pochodzą z dwóch źródeł:
1. **Kolumna `__EMPTY_12`** - lista nazw manewrów (np. "Brak Manewrów", "Zwierzę 0")
2. **Wiersze umiejętności** - szczegółowe manewry z akcjami

| Źródło | Character Path | Parser | Priorytet |
|--------|----------------|--------|-----------|
| `__EMPTY_12` + wiersze umiejętności | `maneuvers[]` | `parseManeuvers()` | ⚠️ Ważny |

**Format wierszy umiejętności:**
- `__EMPTY_1` = Nazwa manewru (np. "Prawy Prosty")
- `__EMPTY_2` = Opis manewru (np. "Dodaje 1 obrażenie")
- `__EMPTY_14` = Typ akcji (np. "1//D")

**Parser:**
```typescript
interface Ability {
  name: string;
  description: string;
  actionType?: string;
}

function parseManeuvers(
  maneuversRaw: string,
  abilities: Ability[]
): Maneuver[] {
  const maneuvers: Maneuver[] = [];
  
  // Split maneuversRaw
  const maneuverNames = maneuversRaw
    .split(/[,;]/)
    .map(n => n.trim())
    .filter(n => n.length > 0 && n !== "Brak Manewrów");
  
  // Dla każdego ability, sprawdź czy to manewr
  abilities.forEach(ability => {
    // Sprawdź czy nazwa pasuje lub czy ma actionType
    const isManeuver = ability.actionType || 
                       maneuverNames.some(n => ability.name.includes(n));
    
    if (isManeuver) {
      maneuvers.push({
        id: ulid(),
        name: ability.name,
        description: ability.description || "",
        grade: 1,
        castTime: parseCastTime(ability.actionType),
        cooldown: 1,
        price: 1,
        requirements: [],
        tags: []
      });
    }
  });
  
  // Dodaj manewry z __EMPTY_12, które nie mają ability
  maneuverNames.forEach(name => {
    if (!maneuvers.some(m => m.name.includes(name))) {
      maneuvers.push({
        id: ulid(),
        name,
        description: `Manewr: ${name}`,
        grade: 1,
        castTime: "Standardowa",
        cooldown: 1,
        price: 1,
        requirements: [],
        tags: []
      });
    }
  });
  
  return maneuvers;
}

function parseCastTime(actionType?: string): CastTime {
  if (!actionType) return "Standardowa";
  
  const mapping: Record<string, CastTime> = {
    "1//D": "Standardowa",
    "2//D": "Pełnorundowa",
    "1//N": "Natychmiastowa",
    "1//NN": "Nadnatychmiastowa"
  };
  
  return mapping[actionType] || "Standardowa";
}
```

---

### 🎁 Perki (Perks)

Perki to wiersze umiejętności oznaczone jako "Pasywy" lub nie będące manewrami.

| Źródło | Character Path | Parser | Priorytet |
|--------|----------------|--------|-----------|
| Wiersze umiejętności (nie-manewry) | `perks[]` | `parsePerks()` | 💡 Opcjonalny |

**Parser:**
```typescript
function parsePerks(abilities: Ability[], maneuvers: Maneuver[]): Perk[] {
  const perks: Perk[] = [];
  
  abilities.forEach(ability => {
    // Sprawdź czy to nie manewr
    const isManeuver = maneuvers.some(m => m.name === ability.name);
    
    if (!isManeuver && ability.description) {
      perks.push({
        id: ulid(),
        name: ability.name,
        description: ability.description,
        grade: 1,
        requirements: [],
        price: 0,
        tags: []
      });
    }
  });
  
  return perks;
}
```

---

### 🎒 Ekwipunek (Equipment)

| Excel Kolumna | Indeks | Character Path | Parser | Priorytet |
|---------------|--------|----------------|--------|-----------|
| `__EMPTY_13` | O | `equipment.*` | `parseEquipment()` | 💡 Opcjonalny |

**Format Excel:** Tekst rozdzielony przecinkami (np. "Walka Wręcz, Bez zbroi")

**Parser:**
```typescript
function parseEquipment(raw: string): Equipment {
  const items = raw.split(',').map(i => i.trim()).filter(i => i.length > 0);
  
  const equipment: Equipment = {
    weapons: [],
    armors: [],
    shields: [],
    inventory: [],
    mounts: []
  };
  
  items.forEach(item => {
    const lowerItem = item.toLowerCase();
    
    if (lowerItem.includes('walka wręcz') || 
        lowerItem.includes('miecz') || 
        lowerItem.includes('topór') ||
        lowerItem.includes('włócznia')) {
      // To broń, ale nie mamy szczegółów, więc dodajemy do inventory
      equipment.inventory.push({
        id: ulid(),
        name: item,
        description: "",
        tags: [{ name: "Broń", color: "red" }]
      });
    } else if (lowerItem.includes('zbroja') || 
               lowerItem.includes('kirys')) {
      equipment.inventory.push({
        id: ulid(),
        name: item,
        description: "",
        tags: [{ name: "Zbroja", color: "blue" }]
      });
    } else if (lowerItem.includes('tarcza')) {
      equipment.inventory.push({
        id: ulid(),
        name: item,
        description: "",
        tags: [{ name: "Tarcza", color: "green" }]
      });
    } else {
      equipment.inventory.push({
        id: ulid(),
        name: item,
        description: "",
        tags: []
      });
    }
  });
  
  return equipment;
}
```

---

## Wartości Domyślne

### Dla wszystkich postaci:

```typescript
const defaultCharacterPartials = {
  talents: [],
  stances: [],
  states: [],
  powers: [],
  
  characteristics: {
    mind: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
    charisma: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
    spellborn: { grade: 1, value: 0, bonus: 0, testBonus: 0 }
  },
  
  attributes: {
    artifice: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
    precision: { grade: 1, value: 0, bonus: 0, testBonus: 0 },
    horsemanship: { grade: 1, value: 0, bonus: 0, testBonus: 0 }
  },
  
  health: {
    barrier: 0,
    recoveryLevel: 0,
    lethalHealth: 0,
    lethalRounds: 0,
    bonus: 0
  }
};
```

---

## Przypadki Brzegowe

### 1. Brakujące dane

**Problem:** Niektóre wiersze mogą mieć puste wartości.

**Rozwiązanie:**
```typescript
function safeParseNumber(value: unknown, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}
```

### 2. Niestandardowe formaty obrażeń

**Problem:** Mogą wystąpić formaty jak `"2x(1k6+1)+1k4+5 / 5-6,+3 (specjalny bonus)"`.

**Rozwiązanie:**
- Parsuj tylko znaną część
- Resztę dodaj do `description`
- Loguj ostrzeżenie

### 3. Wiersze umiejętności bez postaci głównej

**Problem:** Orphaned abilities (nie przypisane do żadnej postaci).

**Rozwiązanie:**
- Pomiń te wiersze
- Loguj ostrzeżenie

### 4. Puste kategorie

**Problem:** Postać bez kategorii (`__EMPTY` === null).

**Rozwiązanie:**
- Użyj nazwy zakładki jako kategorii domyślnej
- Tag: `{ name: sheetName, color: "blue" }`

---

## 🔍 Walidacja Output

Po parsowaniu, każda postać powinna przejść walidację:

```typescript
function validateCharacter(char: Character): string[] {
  const errors: string[] = [];
  
  if (!char.id || char.id.length === 0) {
    errors.push("Missing ID");
  }
  
  if (!char.name || char.name.length === 0) {
    errors.push("Missing name");
  }
  
  if (char.health.vitality <= 0) {
    errors.push("Invalid health vitality");
  }
  
  if (char.defenses.length === 0) {
    errors.push("No defenses defined");
  }
  
  if (char.offenses.length === 0) {
    errors.push("No offenses defined");
  }
  
  return errors;
}
```

---

**Dokument stworzony:** 2025-11-14
**Wersja:** 1.0
**Autor:** GitHub Copilot (Asystent Migracji)
