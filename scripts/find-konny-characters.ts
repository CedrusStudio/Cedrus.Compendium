import * as XLSX from 'xlsx';
import * as path from 'path';

const EXCEL_FILE = path.join(process.cwd(), 'raw-data', 'Bestariusz Brata Zakonnego Zondro.xlsm');

function findKonnyCharacters() {
  console.log('📖 Reading Excel file:', EXCEL_FILE);
  
  const workbook = XLSX.readFile(EXCEL_FILE);
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as Record<string, unknown>;
      
      const name = row.__EMPTY_1;
      if (typeof name === 'string' && name.toLowerCase().includes('konny')) {
        console.log(`\n📊 Sheet: ${sheetName}`);
        console.log(`  Character: ${name}`);
        console.log(`    __EMPTY_7 (Initiative): ${row.__EMPTY_7}`);
        console.log(`    __EMPTY_8 (Combat Skill): ${row.__EMPTY_8}`);
        console.log(`    __EMPTY_9 (Defense): ${row.__EMPTY_9}`);
        
        // Check header (a few rows before)
        if (i > 0) {
          const headerRow = rows[1] as Record<string, unknown>;
          console.log(`  Header __EMPTY_8: ${headerRow.__EMPTY_8}`);
        }
      }
    }
  }
}

findKonnyCharacters();
