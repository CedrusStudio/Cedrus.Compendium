import fs from 'fs';
import path from 'path';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const PERKS_PATH = path.join(FORMATTED_DATA_DIR, 'perks.json');

type Perk = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

// Invalid perk IDs to remove (perks with numeric-only names like "1", "2", "3", etc.)
const INVALID_PERK_IDS = [
  '01K9Z6YJVT0YB6W0W4B8BBC79Q', // name: "1", grade: 0
  '01K9Z6YJVTTDYDV09JP1NS8QDB', // name: "1", grade: 1
  '01K9Z6YJVTXQN98NKXN2YBQ8T8', // name: "1", grade: 1
  '01K9Z6YJVTAA78MXYPCBHYJSRE', // name: "1", grade: 2
  '01K9Z6YJVTNWR5RCGFG75FDKQJ', // name: "2", grade: 1
  '01K9Z6YJVT0W4A9QGEND5QDSZ4', // name: "3", grade: 1
  '01K9Z6YJVTV5PANTNNC5D1N116', // name: "4", grade: 1
  '01K9Z6YJVTE2ZFSW8SKENVJCMM', // name: "5", grade: 1
  '01K9Z6YJVT661AMEYG8HE1KKZ0', // name: "6", grade: 1
  '01K9Z6YJVTJR00M6GV92VBJ5TR', // name: "7", grade: 1
  '01K9Z6YJVT37ZNW5GHNFR5XQW6', // name: "8", grade: 1
  '01K9Z6YJVTPM75Z6TDQBXNM4AV', // name: "9", grade: 1
];

async function main() {
  console.log('🚀 Removing invalid perks with numeric-only names...\n');
  
  // Load existing data
  console.log('📖 Loading perks...');
  const perks: Perk[] = JSON.parse(fs.readFileSync(PERKS_PATH, 'utf-8'));
  console.log(`   ✅ Total perks: ${perks.length}\n`);
  
  // Find invalid perks
  const invalidPerks = perks.filter(p => INVALID_PERK_IDS.includes(p.id));
  console.log(`🗑️  Found ${invalidPerks.length} invalid perks to remove:`);
  for (const perk of invalidPerks) {
    console.log(`   - Name: "${perk.name}", Grade: ${perk.grade}, ID: ${perk.id}`);
  }
  console.log();
  
  // Remove invalid perks
  const validPerks = perks.filter(p => !INVALID_PERK_IDS.includes(p.id));
  console.log(`✅ Keeping ${validPerks.length} valid perks\n`);
  
  // Write updated file
  console.log('💾 Writing updated perks.json...');
  fs.writeFileSync(PERKS_PATH, JSON.stringify(validPerks, null, 2), 'utf-8');
  console.log(`   ✅ Updated perks.json (${perks.length} → ${validPerks.length} perks)\n`);
  
  console.log('🎉 Done! Invalid perks removed.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
