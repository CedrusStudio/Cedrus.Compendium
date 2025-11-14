import * as XLSX from 'xlsx';
import * as path from 'path';

const EXCEL_FILE = path.join(process.cwd(), 'raw-data', 'Bestariusz Brata Zakonnego Zondro.xlsm');

/**
 * Analizuje nagłówki w Excel, aby sprawdzić, czy kolumna __EMPTY_8 to:
 * - "Fechtunek/Fortel"
 * - "Fechtunek/Jeździectwo"
 * - "Walka Wręcz/Fortel"
 */
function analyzeExcelHeaders() {
  console.log('📖 Reading Excel file:', EXCEL_FILE);
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  
  console.log('\n📋 All sheets:', workbook.SheetNames.join(', '));
  console.log('\n');
  
  for (const sheetName of workbook.SheetNames) {
    console.log(`\n📊 Sheet: ${sheetName}`);
    
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(`⚠️  Sheet "${sheetName}" not found`);
      continue;
    }

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
    
    // Check first 3 rows for headers
    for (let i = 0; i < Math.min(3, rows.length); i++) {
      const row = rows[i];
      console.log(`\n  Row ${i + 1}:`);
      
      // Check relevant columns
      if (row.__EMPTY_7) console.log(`    __EMPTY_7: ${row.__EMPTY_7}`);
      if (row.__EMPTY_8) console.log(`    __EMPTY_8: ${row.__EMPTY_8}`);
      if (row.__EMPTY_9) console.log(`    __EMPTY_9: ${row.__EMPTY_9}`);
    }
    
    // Sample some character rows
    console.log('\n  Sample character rows:');
    let sampleCount = 0;
    for (let i = 3; i < rows.length && sampleCount < 5; i++) {
      const row = rows[i];
      
      if (row.początek && row.początek > 0 && row.__EMPTY_1) {
        console.log(`\n    Character: ${row.__EMPTY_1}`);
        console.log(`      __EMPTY_7 (Initiative): ${row.__EMPTY_7}`);
        console.log(`      __EMPTY_8 (Combat Skill): ${row.__EMPTY_8}`);
        console.log(`      __EMPTY_9 (Defense): ${row.__EMPTY_9}`);
        sampleCount++;
      }
    }
  }
}

analyzeExcelHeaders();
