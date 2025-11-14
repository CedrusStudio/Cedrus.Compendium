import * as fs from 'fs';
import * as path from 'path';
import { parseExcel } from './parsers/excelParser';
import { transformToCharacter } from './parsers/characterTransformer';

const EXCEL_FILE = path.join(process.cwd(), 'raw-data', 'Bestariusz Brata Zakonnego Zondro.xlsm');
const OUTPUT_FILE = path.join(process.cwd(), 'formatted-data', 'characters.json');

async function main() {
  console.log('🚀 Starting migration from Excel to characters.json...\n');

  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ Excel file not found: ${EXCEL_FILE}`);
    process.exit(1);
  }

  // Parse Excel
  console.log('📖 Step 1: Parsing Excel...');
  const parseResult = parseExcel(EXCEL_FILE);
  
  console.log('\n📊 Parse Results:');
  console.log(`   Total characters: ${parseResult.stats.totalCharacters}`);
  console.log(`   Sheets processed: ${parseResult.stats.totalSheets}`);
  console.log('\n   By sheet:');
  Object.entries(parseResult.stats.charactersBySheet).forEach(([sheet, count]) => {
    console.log(`      ${sheet}: ${count}`);
  });

  // Transform to Character objects
  console.log('\n🔄 Step 2: Transforming to Character objects...');
  const characters = parseResult.characters.map((rawData, index) => {
    try {
      const character = transformToCharacter(rawData);
      
      if ((index + 1) % 100 === 0) {
        console.log(`   Processed ${index + 1}/${parseResult.stats.totalCharacters}...`);
      }
      
      return character;
    } catch (error) {
      console.error(`❌ Error transforming character "${rawData.name}":`, error);
      return null;
    }
  }).filter(c => c !== null);

  console.log(`   ✅ Successfully transformed ${characters.length} characters`);

  // Write to JSON
  console.log('\n💾 Step 3: Writing to JSON...');
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(characters, null, 2), 'utf-8');
  
  const fileSize = fs.statSync(OUTPUT_FILE).size;
  console.log(`   ✅ Written to: ${OUTPUT_FILE}`);
  console.log(`   File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

  // Statistics
  console.log('\n📈 Migration Statistics:');
  console.log(`   Total characters: ${characters.length}`);
  console.log(`   Success rate: ${((characters.length / parseResult.stats.totalCharacters) * 100).toFixed(2)}%`);
  
  // Sample character stats
  const withManeuvers = characters.filter(c => c.maneuvers.length > 0).length;
  const withPerks = characters.filter(c => c.perks.length > 0).length;
  const withWeapons = characters.filter(c => c.equipment.weapons.length > 0).length;
  
  console.log(`   Characters with maneuvers: ${withManeuvers} (${((withManeuvers / characters.length) * 100).toFixed(1)}%)`);
  console.log(`   Characters with perks: ${withPerks} (${((withPerks / characters.length) * 100).toFixed(1)}%)`);
  console.log(`   Characters with weapons: ${withWeapons} (${((withWeapons / characters.length) * 100).toFixed(1)}%)`);

  console.log('\n🎉 Migration complete!');
}

main().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
