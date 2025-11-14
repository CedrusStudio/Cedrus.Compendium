import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const STANCES_PATH = path.join(FORMATTED_DATA_DIR, 'stances.json');
const STATES_PATH = path.join(FORMATTED_DATA_DIR, 'states.json');

type Item = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

async function verifyFile(fileName: string, filePath: string) {
  console.log(`\n🔍 Verifying ${fileName}...\n`);
  
  try {
    // Get original from main branch
    console.log(`📖 Loading original ${fileName} from main branch...`);
    const originalJson = execSync(`git show main:formatted-data/${fileName}`).toString();
    const originalItems: Item[] = JSON.parse(originalJson);
    console.log(`   ✅ Original items: ${originalItems.length}\n`);
    
    // Load current
    console.log(`📖 Loading current ${fileName}...`);
    const currentItems: Item[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`   ✅ Current items: ${currentItems.length}\n`);
    
    // Check for missing original items
    console.log('🔍 Checking for missing original items...');
    const currentIds = new Set(currentItems.map(i => i.id));
    
    const missingItems: Item[] = [];
    for (const orig of originalItems) {
      if (!currentIds.has(orig.id)) {
        missingItems.push(orig);
      }
    }
    
    if (missingItems.length === 0) {
      console.log(`   ✅ All ${originalItems.length} original items are present!\n`);
    } else {
      console.log(`   ❌ Missing ${missingItems.length} original items:`);
      for (const item of missingItems) {
        console.log(`      - "${item.name}" (grade: ${item.grade}, id: ${item.id})`);
      }
      console.log();
    }
    
    // Check for modified items
    console.log('🔍 Checking for modified original items...');
    const modifiedItems: Array<{original: Item, current: Item}> = [];
    for (const orig of originalItems) {
      const current = currentItems.find(i => i.id === orig.id);
      if (current) {
        // Check if modified (comparing name, grade, description, price)
        if (
          orig.name !== current.name ||
          orig.grade !== current.grade ||
          orig.description !== current.description ||
          orig.price !== current.price ||
          JSON.stringify(orig.tags) !== JSON.stringify(current.tags) ||
          JSON.stringify(orig.requirements) !== JSON.stringify(current.requirements)
        ) {
          modifiedItems.push({ original: orig, current });
        }
      }
    }
    
    if (modifiedItems.length === 0) {
      console.log('   ✅ No original items were modified!\n');
    } else {
      console.log(`   ⚠️  Found ${modifiedItems.length} modified items:`);
      for (const { original, current } of modifiedItems) {
        console.log(`      - "${original.name}" (grade: ${original.grade})`);
        if (original.name !== current.name) console.log(`        Name: "${original.name}" → "${current.name}"`);
        if (original.grade !== current.grade) console.log(`        Grade: ${original.grade} → ${current.grade}`);
        if (original.description !== current.description) console.log(`        Description changed`);
        if (original.price !== current.price) console.log(`        Price: ${original.price} → ${current.price}`);
      }
      console.log();
    }
    
    // Summary
    console.log('📊 Summary:');
    console.log(`   Original items: ${originalItems.length}`);
    console.log(`   Current items: ${currentItems.length}`);
    console.log(`   New items added: ${currentItems.length - originalItems.length}`);
    console.log(`   Missing original items: ${missingItems.length}`);
    console.log(`   Modified original items: ${modifiedItems.length}`);
    
    const isValid = missingItems.length === 0 && modifiedItems.length === 0;
    if (isValid) {
      console.log(`\n✅ ${fileName} is valid! All original items preserved, only new items added.`);
    } else {
      console.log(`\n⚠️  ${fileName} has issues.`);
    }
    
    return isValid;
  } catch (error) {
    console.error(`❌ Error verifying ${fileName}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Verifying stances.json and states.json integrity...\n');
  console.log('='.repeat(80));
  
  const stancesValid = await verifyFile('stances.json', STANCES_PATH);
  
  console.log('\n' + '='.repeat(80));
  
  const statesValid = await verifyFile('states.json', STATES_PATH);
  
  console.log('\n' + '='.repeat(80));
  console.log('\n🎯 Final Result:');
  console.log(`   stances.json: ${stancesValid ? '✅ VALID' : '❌ HAS ISSUES'}`);
  console.log(`   states.json: ${statesValid ? '✅ VALID' : '❌ HAS ISSUES'}`);
  
  if (stancesValid && statesValid) {
    console.log('\n🎉 All files are valid!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some files have issues.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
