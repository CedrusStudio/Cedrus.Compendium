import fs from 'fs';
import path from 'path';
import { ulid } from 'ulid';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const WEAPONS_PATH = path.join(FORMATTED_DATA_DIR, 'weapons.json');
const ARMORS_PATH = path.join(FORMATTED_DATA_DIR, 'armors.json');
const SHIELDS_PATH = path.join(FORMATTED_DATA_DIR, 'shields.json');

type ItemWithoutId = {
  name: string;
  [key: string]: unknown;
};

type ItemWithId = {
  id: string;
  name: string;
  [key: string]: unknown;
};

function addIdsToItems(items: ItemWithoutId[]): ItemWithId[] {
  return items.map(item => ({
    id: ulid(),
    ...item
  }));
}

async function main() {
  console.log('🚀 Adding IDs to equipment files...\n');

  // Process weapons
  console.log('📖 Processing weapons.json...');
  const weapons: ItemWithoutId[] = JSON.parse(fs.readFileSync(WEAPONS_PATH, 'utf-8'));
  const weaponsWithIds = addIdsToItems(weapons);
  fs.writeFileSync(WEAPONS_PATH, JSON.stringify(weaponsWithIds, null, 2), 'utf-8');
  console.log(`   ✅ Added IDs to ${weaponsWithIds.length} weapons\n`);

  // Process armors
  console.log('📖 Processing armors.json...');
  const armors: ItemWithoutId[] = JSON.parse(fs.readFileSync(ARMORS_PATH, 'utf-8'));
  const armorsWithIds = addIdsToItems(armors);
  fs.writeFileSync(ARMORS_PATH, JSON.stringify(armorsWithIds, null, 2), 'utf-8');
  console.log(`   ✅ Added IDs to ${armorsWithIds.length} armors\n`);

  // Process shields
  console.log('📖 Processing shields.json...');
  const shields: ItemWithoutId[] = JSON.parse(fs.readFileSync(SHIELDS_PATH, 'utf-8'));
  const shieldsWithIds = addIdsToItems(shields);
  fs.writeFileSync(SHIELDS_PATH, JSON.stringify(shieldsWithIds, null, 2), 'utf-8');
  console.log(`   ✅ Added IDs to ${shieldsWithIds.length} shields\n`);

  console.log('📊 Summary:');
  console.log(`   Weapons: ${weaponsWithIds.length}`);
  console.log(`   Armors: ${armorsWithIds.length}`);
  console.log(`   Shields: ${shieldsWithIds.length}`);
  console.log(`   Total items with IDs: ${weaponsWithIds.length + armorsWithIds.length + shieldsWithIds.length}\n`);

  console.log('🎉 Done! All equipment now has IDs.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
