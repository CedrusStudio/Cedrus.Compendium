import fs from 'fs';
import path from 'path';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const CHARACTERS_PATH = path.join(FORMATTED_DATA_DIR, 'characters.json');
const WEAPONS_PATH = path.join(FORMATTED_DATA_DIR, 'weapons.json');
const ARMORS_PATH = path.join(FORMATTED_DATA_DIR, 'armors.json');
const SHIELDS_PATH = path.join(FORMATTED_DATA_DIR, 'shields.json');

type EquipmentRef = {
  name: string;
};

type Weapon = {
  id: string;
  name: string;
  [key: string]: unknown;
};

type Armor = {
  id: string;
  name: string;
  [key: string]: unknown;
};

type Shield = {
  id: string;
  name: string;
  [key: string]: unknown;
};

type Character = {
  id: string;
  name: string;
  equipment?: {
    weapons?: EquipmentRef[];
    armors?: EquipmentRef[];
    shields?: EquipmentRef[];
  };
  weaponsIds?: string[];
  armorsIds?: string[];
  shieldsIds?: string[];
  inventoryIds?: string[];
  mountsIds?: string[];
  [key: string]: unknown;
};

function createLookupMap<T extends { id: string; name: string }>(items: T[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const item of items) {
    const normalizedName = item.name.toLowerCase().trim();
    map.set(normalizedName, item.id);
  }
  return map;
}

async function main() {
  console.log('🚀 Adding equipment IDs to characters...\n');

  // Step 1: Load equipment data
  console.log('📖 Loading equipment data...');
  const weapons: Weapon[] = JSON.parse(fs.readFileSync(WEAPONS_PATH, 'utf-8'));
  const armors: Armor[] = JSON.parse(fs.readFileSync(ARMORS_PATH, 'utf-8'));
  const shields: Shield[] = JSON.parse(fs.readFileSync(SHIELDS_PATH, 'utf-8'));
  
  console.log(`   ✅ Weapons: ${weapons.length}`);
  console.log(`   ✅ Armors: ${armors.length}`);
  console.log(`   ✅ Shields: ${shields.length}\n`);

  // Step 2: Create lookup maps
  console.log('🗺️  Creating lookup maps...');
  const weaponsMap = createLookupMap(weapons);
  const armorsMap = createLookupMap(armors);
  const shieldsMap = createLookupMap(shields);
  console.log('   ✅ All lookup maps created\n');

  // Step 3: Load characters
  console.log('📖 Loading characters...');
  const characters: Character[] = JSON.parse(fs.readFileSync(CHARACTERS_PATH, 'utf-8'));
  console.log(`   ✅ Characters: ${characters.length}\n`);

  // Step 4: Process characters
  console.log('🔄 Adding equipment IDs...');
  let totalWeapons = 0;
  let totalArmors = 0;
  let totalShields = 0;
  const missingWeapons = new Set<string>();
  const missingArmors = new Set<string>();
  const missingShields = new Set<string>();

  for (const character of characters) {
    // Initialize empty arrays
    character.weaponsIds = [];
    character.armorsIds = [];
    character.shieldsIds = [];
    character.inventoryIds = [];
    character.mountsIds = [];

    if (!character.equipment) continue;

    // Resolve weapons
    if (character.equipment.weapons) {
      for (const weaponRef of character.equipment.weapons) {
        const normalizedName = weaponRef.name.toLowerCase().trim();
        const id = weaponsMap.get(normalizedName);
        
        if (id) {
          character.weaponsIds.push(id);
          totalWeapons++;
        } else {
          missingWeapons.add(weaponRef.name);
        }
      }
    }

    // Resolve armors
    if (character.equipment.armors) {
      for (const armorRef of character.equipment.armors) {
        const normalizedName = armorRef.name.toLowerCase().trim();
        const id = armorsMap.get(normalizedName);
        
        if (id) {
          character.armorsIds.push(id);
          totalArmors++;
        } else {
          missingArmors.add(armorRef.name);
        }
      }
    }

    // Resolve shields
    if (character.equipment.shields) {
      for (const shieldRef of character.equipment.shields) {
        const normalizedName = shieldRef.name.toLowerCase().trim();
        const id = shieldsMap.get(normalizedName);
        
        if (id) {
          character.shieldsIds.push(id);
          totalShields++;
        } else {
          missingShields.add(shieldRef.name);
        }
      }
    }
    
    // Remove equipment object after processing
    delete character.equipment;
  }

  console.log('   ✅ All characters processed\n');

  // Step 5: Report missing equipment
  if (missingWeapons.size > 0) {
    console.log(`⚠️  Missing weapons (${missingWeapons.size}):`);
    Array.from(missingWeapons).forEach(name => console.log(`   - "${name}"`));
    console.log();
  }

  if (missingArmors.size > 0) {
    console.log(`⚠️  Missing armors (${missingArmors.size}):`);
    Array.from(missingArmors).forEach(name => console.log(`   - "${name}"`));
    console.log();
  }

  if (missingShields.size > 0) {
    console.log(`⚠️  Missing shields (${missingShields.size}):`);
    Array.from(missingShields).forEach(name => console.log(`   - "${name}"`));
    console.log();
  }

  if (missingWeapons.size === 0 && missingArmors.size === 0 && missingShields.size === 0) {
    console.log('✅ All equipment references resolved successfully!\n');
  }

  // Step 6: Write updated characters
  console.log('💾 Writing updated characters.json...');
  fs.writeFileSync(
    CHARACTERS_PATH,
    JSON.stringify(characters, null, 2),
    'utf-8'
  );
  
  const fileStats = fs.statSync(CHARACTERS_PATH);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✅ Written to: ${CHARACTERS_PATH}`);
  console.log(`   File size: ${fileSizeMB} MB\n`);

  // Step 7: Statistics
  console.log('📈 Resolution Statistics:');
  console.log(`   Total characters: ${characters.length}`);
  console.log(`   Weapon IDs resolved: ${totalWeapons}`);
  console.log(`   Armor IDs resolved: ${totalArmors}`);
  console.log(`   Shield IDs resolved: ${totalShields}`);
  console.log(`   Total equipment IDs: ${totalWeapons + totalArmors + totalShields}`);
  console.log(`   Missing weapons: ${missingWeapons.size}`);
  console.log(`   Missing armors: ${missingArmors.size}`);
  console.log(`   Missing shields: ${missingShields.size}\n`);

  console.log('🎉 Done!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
