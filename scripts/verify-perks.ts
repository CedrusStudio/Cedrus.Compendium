import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

async function main() {
  console.log('🔍 Verifying perks.json integrity...\n');
  
  // Get original perks from main branch
  console.log('📖 Loading original perks from main branch...');
  const originalJson = execSync('git show main:formatted-data/perks.json').toString();
  const originalPerks: Perk[] = JSON.parse(originalJson);
  const originalValidPerks = originalPerks.filter(p => !/^\d+$/.test(p.name));
  console.log(`   ✅ Original perks: ${originalPerks.length}`);
  console.log(`   ✅ Original valid perks (non-numeric): ${originalValidPerks.length}\n`);
  
  // Load current perks
  console.log('📖 Loading current perks...');
  const currentPerks: Perk[] = JSON.parse(fs.readFileSync(PERKS_PATH, 'utf-8'));
  const currentValidPerks = currentPerks.filter(p => !/^\d+$/.test(p.name));
  console.log(`   ✅ Current perks: ${currentPerks.length}`);
  console.log(`   ✅ Current valid perks (non-numeric): ${currentValidPerks.length}\n`);
  
  // Check for missing original perks
  console.log('🔍 Checking for missing original perks...');
  const currentIds = new Set(currentValidPerks.map(p => p.id));
  
  const missingPerks: Perk[] = [];
  for (const orig of originalValidPerks) {
    if (!currentIds.has(orig.id)) {
      missingPerks.push(orig);
    }
  }
  
  if (missingPerks.length === 0) {
    console.log(`   ✅ All ${originalValidPerks.length} valid original perks are present!\n`);
  } else {
    console.log(`   ❌ Missing ${missingPerks.length} original perks:`);
    for (const perk of missingPerks) {
      console.log(`      - "${perk.name}" (grade: ${perk.grade}, id: ${perk.id})`);
    }
    console.log();
  }
  
  // Check for invalid perks
  console.log('🔍 Checking for invalid perks (numeric-only names)...');
  const invalidPerks = currentPerks.filter(p => /^\d+$/.test(p.name));
  if (invalidPerks.length === 0) {
    console.log('   ✅ No invalid perks found!\n');
  } else {
    console.log(`   ❌ Found ${invalidPerks.length} invalid perks:`);
    for (const perk of invalidPerks) {
      console.log(`      - Name: "${perk.name}", Grade: ${perk.grade}`);
    }
    console.log();
  }
  
  // Summary
  console.log('📊 Summary:');
  console.log(`   Original valid perks: ${originalValidPerks.length}`);
  console.log(`   Current valid perks: ${currentValidPerks.length}`);
  console.log(`   New valid perks added: ${currentValidPerks.length - originalValidPerks.length}`);
  console.log(`   Missing original perks: ${missingPerks.length}`);
  console.log(`   Invalid perks: ${invalidPerks.length}\n`);
  
  if (missingPerks.length === 0 && invalidPerks.length === 0) {
    console.log('🎉 Perks.json is valid!');
  } else {
    console.log('⚠️  Perks.json has issues that need to be resolved.');
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
