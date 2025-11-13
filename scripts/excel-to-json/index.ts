import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { mapManeuvers } from './mappers/maneuver-mapper';
import { mapPerks } from './mappers/perk-mapper';
import { mapModes, splitModesIntoStancesAndStates } from './mappers/mode-mapper';

const EXCEL_PATH = path.join(process.cwd(), 'raw-data', 'Wielka Księga Wojowników.xlsm');
const OUTPUT_DIR = path.join(process.cwd(), 'formatted-data');

// Upewnij się, że folder wyjściowy istnieje
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

interface ConversionStats {
  sheetName: string;
  inputRows: number;
  outputItems: number;
  skippedRows: number;
}

function convertExcelToJSON() {
  console.log('🚀 Starting Excel to JSON conversion...\n');
  console.log(`📂 Input: ${EXCEL_PATH}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  const workbook = XLSX.readFile(EXCEL_PATH);
  const stats: ConversionStats[] = [];

  // MANEUVERS - Z arkusza M Total (zawiera wszystkie manewry)
  console.log('=' .repeat(70));
  console.log('🔧 Converting MANEUVERS from "M Total" sheet...');
  console.log('='.repeat(70));
  
  const maneuversSheet = workbook.Sheets['M Total'];
  if (maneuversSheet) {
    const maneuversData = XLSX.utils.sheet_to_json(maneuversSheet, { defval: null }) as Record<string, unknown>[];
    const maneuvers = mapManeuvers(maneuversData as Parameters<typeof mapManeuvers>[0]);
    
    const outputPath = path.join(OUTPUT_DIR, 'maneuvers.json');
    fs.writeFileSync(outputPath, JSON.stringify(maneuvers, null, 2), 'utf-8');
    
    stats.push({
      sheetName: 'M Total',
      inputRows: maneuversData.length,
      outputItems: maneuvers.length,
      skippedRows: maneuversData.length - maneuvers.length
    });
    
    console.log(`✅ Created: maneuvers.json`);
    console.log(`   Input rows: ${maneuversData.length}`);
    console.log(`   Output items: ${maneuvers.length}`);
    console.log(`   Skipped rows: ${maneuversData.length - maneuvers.length}`);
  } else {
    console.log('⚠️  Sheet "M Total" not found!');
  }

  // PERKS - Z różnych arkuszy atutów
  console.log('\n' + '='.repeat(70));
  console.log('🔧 Converting PERKS from multiple sheets...');
  console.log('='.repeat(70));
  
  const perkSheets = ['Atuty Bojowe', 'Atuty Defensywne', 'Walka Wrecz', 'Harmonia'];
  const allPerks: ReturnType<typeof mapPerks> = [];
  
  for (const sheetName of perkSheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.log(`⚠️  Sheet "${sheetName}" not found, skipping...`);
      continue;
    }
    
    const data = XLSX.utils.sheet_to_json(sheet, { defval: null }) as Record<string, unknown>[];
    const perks = mapPerks(data as Parameters<typeof mapPerks>[0]);
    allPerks.push(...perks);
    
    stats.push({
      sheetName,
      inputRows: data.length,
      outputItems: perks.length,
      skippedRows: data.length - perks.length
    });
    
    console.log(`✅ Processed: ${sheetName}`);
    console.log(`   Input rows: ${data.length}`);
    console.log(`   Output items: ${perks.length}`);
    console.log(`   Skipped rows: ${data.length - perks.length}`);
  }
  
  const perksOutputPath = path.join(OUTPUT_DIR, 'perks.json');
  fs.writeFileSync(perksOutputPath, JSON.stringify(allPerks, null, 2), 'utf-8');
  console.log(`\n✅ Created: perks.json (${allPerks.length} total perks)`);

  // MODES - Postawy i Stany
  console.log('\n' + '='.repeat(70));
  console.log('🔧 Converting MODES (Stances & States) from "Postawy i Stany"...');
  console.log('='.repeat(70));
  
  const modesSheet = workbook.Sheets['Postawy i Stany'];
  if (modesSheet) {
    const modesData = XLSX.utils.sheet_to_json(modesSheet, { defval: null }) as Record<string, unknown>[];
    const allModes = mapModes(modesData as Parameters<typeof mapModes>[0]);
    const { stances, states } = splitModesIntoStancesAndStates(allModes);
    
    const stancesPath = path.join(OUTPUT_DIR, 'stances.json');
    const statesPath = path.join(OUTPUT_DIR, 'states.json');
    
    fs.writeFileSync(stancesPath, JSON.stringify(stances, null, 2), 'utf-8');
    fs.writeFileSync(statesPath, JSON.stringify(states, null, 2), 'utf-8');
    
    stats.push({
      sheetName: 'Postawy i Stany',
      inputRows: modesData.length,
      outputItems: allModes.length,
      skippedRows: modesData.length - allModes.length
    });
    
    console.log(`✅ Created: stances.json (${stances.length} stances)`);
    console.log(`✅ Created: states.json (${states.length} states)`);
    console.log(`   Input rows: ${modesData.length}`);
    console.log(`   Total modes: ${allModes.length}`);
    console.log(`   Skipped rows: ${modesData.length - allModes.length}`);
  } else {
    console.log('⚠️  Sheet "Postawy i Stany" not found!');
  }

  // SUMMARY
  console.log('\n' + '='.repeat(70));
  console.log('📊 CONVERSION SUMMARY');
  console.log('='.repeat(70));
  
  const totalInput = stats.reduce((sum, s) => sum + s.inputRows, 0);
  const totalOutput = stats.reduce((sum, s) => sum + s.outputItems, 0);
  const totalSkipped = stats.reduce((sum, s) => sum + s.skippedRows, 0);
  
  console.log('\nPer-sheet statistics:');
  console.log('-'.repeat(70));
  stats.forEach(stat => {
    const successRate = stat.inputRows > 0 
      ? Math.round((stat.outputItems / stat.inputRows) * 100)
      : 0;
    console.log(`${stat.sheetName.padEnd(25)} | In: ${String(stat.inputRows).padStart(4)} | Out: ${String(stat.outputItems).padStart(4)} | Success: ${successRate}%`);
  });
  
  console.log('-'.repeat(70));
  console.log(`${'TOTAL'.padEnd(25)} | In: ${String(totalInput).padStart(4)} | Out: ${String(totalOutput).padStart(4)} | Skipped: ${totalSkipped}`);
  
  console.log('\n✅ Conversion complete!');
  console.log(`📁 Output directory: ${OUTPUT_DIR}`);
  
  // Lista plików
  console.log('\n📄 Generated files:');
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
  files.forEach(file => {
    const filePath = path.join(OUTPUT_DIR, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`   - ${file} (${content.length} items)`);
  });
}

// Run conversion
try {
  convertExcelToJSON();
} catch (error) {
  console.error('❌ Error during conversion:', error);
  process.exit(1);
}
