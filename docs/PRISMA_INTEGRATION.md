# 🗄️ Integracja Migracji z Prisma i MongoDB

## 📋 Przegląd

Ten dokument opisuje strategię integracji migracji danych z Excel do MongoDB z wykorzystaniem schematu Prisma i systemu referencji.

---

## 🎯 Architektura Systemu

### Poziomy Danych

```
Excel (Źródło)
    ↓
JSON Pośredni (characters.json)
    ↓
MongoDB (przez Prisma)
```

### Dwa Podejścia Do Wyboru

#### **Opcja A: Bezpośredni Import do MongoDB** ⭐ ZALECANE
```
Excel → scripts → Prisma Client → MongoDB
```

#### **Opcja B: Import przez JSON**
```
Excel → scripts → characters.json → seed.ts → Prisma Client → MongoDB
```

---

## 🔗 System Referencji w Prisma

### Schemat Relacji Many-to-Many

Prisma używa **relacji many-to-many** z kluczem głównym `@@unique([name, grade])`:

```prisma
model Character {
  stancesIds String[]
  stances    Stance[] @relation(fields: [stancesIds], references: [id])
  
  maneuversIds String[]
  maneuvers    Maneuver[] @relation(fields: [maneuversIds], references: [id])
  
  perksIds String[]
  perks    Perk[] @relation(fields: [perksIds], references: [id])
  // ...
}

model Maneuver {
  id           String @id @default(ulid()) @map("_id")
  name         String
  grade        Int
  // ...
  
  @@unique([name, grade(sort: Asc)])
}
```

### Wyszukiwanie po `name` + `grade`

```typescript
// 1. Znajdź manewr po name + grade
const maneuver = await prisma.maneuver.findUnique({
  where: {
    name_grade: {
      name: "Garda Pięściarza",
      grade: 1
    }
  }
});

// 2. Połącz z postacią
await prisma.character.update({
  where: { id: characterId },
  data: {
    maneuvers: {
      connect: { id: maneuver.id }
    }
  }
});
```

---

## 📊 Strategia Migracji: Opcja A (Zalecane)

### Workflow

```
1. Excel → Parse → Raw Character Data
2. Dla każdej postaci:
   a. Resolve referencje (name+grade → id)
   b. Upsert do MongoDB przez Prisma
3. Walidacja
```

### Implementacja

#### 1. **Parser Referencji z Resolve**

```typescript
// scripts/parsers/referenceResolver.ts

import { PrismaClient } from '@prisma/client';

export class ReferenceResolver {
  constructor(private prisma: PrismaClient) {}

  /**
   * Resolve maneuver reference to ID
   */
  async resolveManeuver(name: string, grade: number): Promise<string | null> {
    const maneuver = await this.prisma.maneuver.findUnique({
      where: { name_grade: { name, grade } }
    });
    return maneuver?.id ?? null;
  }

  /**
   * Resolve perk reference to ID
   */
  async resolvePerk(name: string, grade: number): Promise<string | null> {
    const perk = await this.prisma.perk.findUnique({
      where: { name_grade: { name, grade } }
    });
    return perk?.id ?? null;
  }

  /**
   * Resolve stance reference to ID
   */
  async resolveStance(name: string, grade: number): Promise<string | null> {
    const stance = await this.prisma.stance.findUnique({
      where: { name_grade: { name, grade } }
    });
    return stance?.id ?? null;
  }

  /**
   * Resolve state reference to ID
   */
  async resolveState(name: string, grade: number): Promise<string | null> {
    const state = await this.prisma.state.findUnique({
      where: { name_grade: { name, grade } }
    });
    return state?.id ?? null;
  }

  /**
   * Resolve weapon by name (weapons nie mają grade)
   */
  async resolveWeapon(name: string): Promise<string | null> {
    const weapon = await this.prisma.weapon.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
    return weapon?.id ?? null;
  }

  /**
   * Resolve armor by name
   */
  async resolveArmor(name: string): Promise<string | null> {
    const armor = await this.prisma.armor.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
    return armor?.id ?? null;
  }

  /**
   * Resolve shield by name
   */
  async resolveShield(name: string): Promise<string | null> {
    const shield = await this.prisma.shield.findFirst({
      where: { 
        name: {
          equals: name,
          mode: 'insensitive'
        }
      }
    });
    return shield?.id ?? null;
  }

  /**
   * Batch resolve maneuvers
   */
  async resolveManeuvers(references: Array<{ name: string; grade: number }>): Promise<string[]> {
    const ids: string[] = [];
    
    for (const ref of references) {
      const id = await this.resolveManeuver(ref.name, ref.grade);
      if (id) ids.push(id);
      else console.warn(`⚠️  Maneuver not found: ${ref.name} grade ${ref.grade}`);
    }
    
    return ids;
  }

  /**
   * Batch resolve perks
   */
  async resolvePerks(references: Array<{ name: string; grade: number }>): Promise<string[]> {
    const ids: string[] = [];
    
    for (const ref of references) {
      const id = await this.resolvePerk(ref.name, ref.grade);
      if (id) ids.push(id);
      else console.warn(`⚠️  Perk not found: ${ref.name} grade ${ref.grade}`);
    }
    
    return ids;
  }

  /**
   * Batch resolve weapons
   */
  async resolveWeapons(names: string[]): Promise<string[]> {
    const ids: string[] = [];
    
    for (const name of names) {
      const id = await this.resolveWeapon(name);
      if (id) ids.push(id);
      else console.warn(`⚠️  Weapon not found: ${name}`);
    }
    
    return ids;
  }
}
```

#### 2. **Główny Skrypt Migracji**

```typescript
// scripts/migrate-bestiary-to-db.ts

import { PrismaClient } from '@prisma/client';
import { parseExcel } from './parsers/excelParser';
import { transformToCharacter } from './parsers/characterTransformer';
import { ReferenceResolver } from './parsers/referenceResolver';
import { ulid } from 'ulid';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting migration from Excel to MongoDB...\n');

  // 1. Parse Excel
  console.log('📖 Step 1: Parsing Excel...');
  const rawCharacters = await parseExcel('raw-data/Bestariusz Brata Zakonnego Zondro.xlsm');
  console.log(`   Found ${rawCharacters.length} characters\n`);

  // 2. Initialize resolver
  const resolver = new ReferenceResolver(prisma);

  // 3. Transform and insert
  console.log('🔄 Step 2: Transforming and inserting...');
  let successCount = 0;
  let errorCount = 0;

  for (const rawChar of rawCharacters) {
    try {
      // Transform to Character format
      const character = transformToCharacter(rawChar);

      // Resolve all references to IDs
      const maneuversIds = await resolver.resolveManeuvers(character.maneuvers);
      const perksIds = await resolver.resolvePerks(character.perks);
      const stancesIds = await resolver.resolveStances(character.stances);
      const statesIds = await resolver.resolveStates(character.states);
      const weaponsIds = await resolver.resolveWeapons(character.equipment.weapons.map(w => w.name));
      const armorsIds = await resolver.resolveArmors(character.equipment.armors.map(a => a.name));
      const shieldsIds = await resolver.resolveShields(character.equipment.shields.map(s => s.name));

      // Insert character
      await prisma.character.create({
        data: {
          id: ulid(),
          name: character.name,
          shortName: character.shortName,
          description: character.description,
          tags: character.tags,
          
          characteristics: character.characteristics,
          attributes: character.attributes,
          talents: character.talents,
          health: character.health,
          defenses: character.defenses,
          offenses: character.offenses,
          powers: character.powers,

          // Connect przez resolved IDs
          maneuversIds,
          stancesIds,
          statesIds,
          perksIds,
          weaponsIds,
          armorsIds,
          shieldsIds,
          spellsIds: [],  // Brak w Excel
          inventoryIds: [],
          mountsIds: []
        }
      });

      successCount++;
      if (successCount % 100 === 0) {
        console.log(`   Processed ${successCount}/${rawCharacters.length}...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`   ❌ Error processing ${rawChar.name}:`, error);
    }
  }

  console.log(`\n✅ Migration complete!`);
  console.log(`   Success: ${successCount}`);
  console.log(`   Errors: ${errorCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

#### 3. **Character Transformer z Referencjami**

```typescript
// scripts/parsers/characterTransformer.ts

import { parseManeuverReferences } from './maneuverParser';
import { parsePerkReferences } from './perkParser';
import { parseEquipmentReferences } from './equipmentParser';
// ... inne parsery

export type CharacterWithReferences = {
  name: string;
  shortName: string;
  description: string;
  tags: string[];
  
  characteristics: Characteristics;
  attributes: Attributes;
  talents: Talent[];
  health: Health;
  defenses: Defense[];
  offenses: Offense[];
  powers: Power[];
  
  // Referencje (name + grade)
  maneuvers: Array<{ name: string; grade: number }>;
  perks: Array<{ name: string; grade: number }>;
  stances: Array<{ name: string; grade: number }>;
  states: Array<{ name: string; grade: number }>;
  equipment: {
    weapons: Array<{ name: string }>;
    armors: Array<{ name: string }>;
    shields: Array<{ name: string }>;
  };
};

export function transformToCharacter(rawData: RawExcelData): CharacterWithReferences {
  return {
    name: rawData.name,
    shortName: extractShortName(rawData.name),
    description: rawData.description || '',
    tags: [rawData.category],
    
    characteristics: parseCharacteristics(rawData),
    attributes: parseAttributes(rawData),
    talents: [],  // Brak w Excel
    health: parseHealth(rawData.health),
    defenses: [parseDefense(rawData)],
    offenses: [parseOffense(rawData)],
    powers: [],  // Brak w Excel
    
    // Parse do referencji
    maneuvers: parseManeuverReferences(rawData.maneuvers, rawData.abilities),
    perks: parsePerkReferences(rawData.abilities),
    stances: [],  // Brak w Excel
    states: [],   // Brak w Excel
    equipment: parseEquipmentReferences(rawData.equipment)
  };
}
```

---

## 📊 Strategia Migracji: Opcja B (przez JSON)

### Workflow

```
1. Excel → Parse → characters.json (z referencjami name+grade)
2. Seed script resolve referencje → MongoDB
```

### Implementacja

#### 1. **Generuj characters.json z Referencjami**

```typescript
// scripts/generate-characters-json.ts

import { transformToCharacter } from './parsers/characterTransformer';
import * as fs from 'fs';

async function main() {
  const rawCharacters = await parseExcel(/* ... */);
  
  const characters = rawCharacters.map(transformToCharacter);
  
  // Zapisz z referencjami (nie IDs!)
  fs.writeFileSync(
    'formatted-data/characters.json',
    JSON.stringify(characters, null, 2)
  );
}
```

**Output `characters.json`:**
```json
[
  {
    "name": "Gladiator",
    "shortName": "Gladiator",
    "maneuvers": [
      { "name": "Garda Pięściarza", "grade": 1 },
      { "name": "Cios Zawodowca", "grade": 2 }
    ],
    "perks": [
      { "name": "Napiętnowane Mięśnie", "grade": 1 }
    ],
    "equipment": {
      "weapons": [{ "name": "Gladius" }],
      "armors": [{ "name": "Lekka Zbroja" }]
    }
  }
]
```

#### 2. **Seed Script z Resolution**

```typescript
// prisma/seeds/characterSeed.ts

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import { ReferenceResolver } from '../../scripts/parsers/referenceResolver';

const prisma = new PrismaClient();

export async function seedCharacters() {
  console.log('🌱 Seeding characters from JSON...');

  const characters = JSON.parse(
    fs.readFileSync('formatted-data/characters.json', 'utf-8')
  );

  const resolver = new ReferenceResolver(prisma);

  for (const char of characters) {
    // Resolve referencje
    const maneuversIds = await resolver.resolveManeuvers(char.maneuvers);
    const perksIds = await resolver.resolvePerks(char.perks);
    const weaponsIds = await resolver.resolveWeapons(char.equipment.weapons.map(w => w.name));
    // ...

    // Upsert
    await prisma.character.upsert({
      where: { name: char.name },
      update: {
        maneuversIds,
        perksIds,
        weaponsIds,
        // ...
      },
      create: {
        id: ulid(),
        name: char.name,
        shortName: char.shortName,
        // ... wszystkie pola
        maneuversIds,
        perksIds,
        weaponsIds
      }
    });
  }

  console.log('✅ Characters seeded!');
}
```

---

## ⚠️ Przypadki Brzegowe

### 1. Brakujące Referencje

```typescript
// Strategia: Log warning i pomiń
async resolveManeuver(name: string, grade: number): Promise<string | null> {
  const maneuver = await this.prisma.maneuver.findUnique({
    where: { name_grade: { name, grade } }
  });
  
  if (!maneuver) {
    console.warn(`⚠️  Maneuver not found: "${name}" grade ${grade}`);
    // Opcje:
    // 1. return null - pomiń
    // 2. throw error - przerwij
    // 3. create fallback - stwórz placeholder
  }
  
  return maneuver?.id ?? null;
}
```

### 2. Duplikaty Nazw

```typescript
// Problem: "Garda Pięściarza" w Excel vs "GardaPiesciarza" w DB
// Rozwiązanie: Normalizacja przed wyszukiwaniem

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // usuń akcenty
    .trim();
}

// W resolver:
async resolveManeuver(name: string, grade: number): Promise<string | null> {
  const normalized = normalizeName(name);
  
  const maneuver = await this.prisma.maneuver.findFirst({
    where: {
      name: { contains: normalized, mode: 'insensitive' },
      grade
    }
  });
  
  return maneuver?.id ?? null;
}
```

### 3. Batch Operations dla Wydajności

```typescript
// Zamiast N queries, użyj batch:
async resolveManeuversBatch(
  references: Array<{ name: string; grade: number }>
): Promise<Map<string, string>> {
  // Znajdź wszystkie za jednym razem
  const maneuvers = await this.prisma.maneuver.findMany({
    where: {
      OR: references.map(ref => ({
        name: ref.name,
        grade: ref.grade
      }))
    }
  });
  
  // Stwórz mapę (name+grade) → id
  const map = new Map<string, string>();
  for (const m of maneuvers) {
    const key = `${m.name}_${m.grade}`;
    map.set(key, m.id);
  }
  
  return map;
}
```

---

## 📈 Porównanie Opcji

| Aspekt | Opcja A (Direct) | Opcja B (JSON) |
|--------|------------------|----------------|
| **Wydajność** | ✅ Szybsza (bez IO) | ⚠️ Wolniejsza (2x IO) |
| **Debugowanie** | ⚠️ Trudniejsze | ✅ Łatwiejsze (można sprawdzić JSON) |
| **Rollback** | ⚠️ Trudniejszy | ✅ Łatwiejszy (usuń z DB, uruchom ponownie) |
| **Walidacja** | ⚠️ W locie | ✅ Przed i po |
| **Use Case** | Production import | Development/Testing |

### Zalecenie

- **Development:** Opcja B (JSON) - łatwiej debugować
- **Production:** Opcja A (Direct) - szybsza, mniej błędów

---

## ✅ Workflow Rekomendowany

### Faza 1: Development (Opcja B)

```bash
# 1. Generuj JSON z referencjami
npm run generate-characters-json

# 2. Waliduj JSON
npm run validate-characters-json

# 3. Seed do MongoDB
npm run seed:characters

# 4. Sprawdź w MongoDB
mongosh "mongodb://..." --eval "db.characters.countDocuments()"
```

### Faza 2: Production (Opcja A)

```bash
# Bezpośredni import
npm run migrate-bestiary-to-db
```

---

## 🔧 Konfiguracja package.json

```json
{
  "scripts": {
    "generate-characters-json": "tsx scripts/generate-characters-json.ts",
    "validate-characters-json": "tsx scripts/validate-characters-json.ts",
    "migrate-bestiary-to-db": "tsx scripts/migrate-bestiary-to-db.ts",
    "seed:characters": "tsx prisma/seeds/characterSeed.ts"
  }
}
```

---

## 📊 Przykład Kompletnej Migracji

```typescript
// scripts/migrate-bestiary-complete.ts

import { PrismaClient } from '@prisma/client';
import { ReferenceResolver } from './parsers/referenceResolver';
import * as XLSX from 'xlsx';

const prisma = new PrismaClient();

async function migrate() {
  console.log('🚀 Starting complete migration...\n');

  // 1. Load Excel
  const workbook = XLSX.readFile('raw-data/Bestariusz Brata Zakonnego Zondro.xlsm');
  const sheets = ['Wojacy', 'Necro', 'Natura', 'Monstra', 'Dzicy', 'Firnamenty'];

  const resolver = new ReferenceResolver(prisma);
  let total = 0;

  for (const sheetName of sheets) {
    console.log(`📄 Processing sheet: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    for (const row of data) {
      // Skip headers and empty rows
      if (!row['__EMPTY_1'] || row['początek'] === '') continue;

      try {
        // Parse character
        const character = parseRow(row);

        // Resolve references
        const maneuversIds = await resolver.resolveManeuvers(character.maneuvers);
        const perksIds = await resolver.resolvePerks(character.perks);
        const weaponsIds = await resolver.resolveWeapons(character.equipment.weapons);

        // Insert
        await prisma.character.create({
          data: {
            id: ulid(),
            name: character.name,
            shortName: character.shortName,
            description: character.description,
            tags: [sheetName, ...character.tags],
            
            characteristics: character.characteristics,
            attributes: character.attributes,
            health: character.health,
            defenses: character.defenses,
            offenses: character.offenses,
            talents: [],
            powers: [],

            maneuversIds,
            perksIds,
            weaponsIds,
            stancesIds: [],
            statesIds: [],
            armorsIds: [],
            shieldsIds: [],
            spellsIds: [],
            inventoryIds: [],
            mountsIds: []
          }
        });

        total++;
      } catch (error) {
        console.error(`❌ Error: ${row['__EMPTY_1']}`, error.message);
      }
    }

    console.log(`   ✅ Completed ${sheetName}\n`);
  }

  console.log(`🎉 Migration complete! Total characters: ${total}`);
}

migrate()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

---

## 🎯 Następne Kroki

1. **Wybierz strategię:** Opcja A (direct) lub B (JSON)
2. **Implementuj `ReferenceResolver`** w `scripts/parsers/`
3. **Testuj na małym zbiorze** (10-20 postaci)
4. **Waliduj w MongoDB** czy referencje działają
5. **Uruchom pełną migrację** (~2,176 postaci)

---

**Status:** ✅ Strategia Integracji z Prisma - Gotowa do Implementacji  
**Data:** 2025-11-14
