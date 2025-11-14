import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const EXCEL_FILE = path.join(process.cwd(), 'raw-data', 'Bestariusz Brata Zakonnego Zondro.xlsm');
const OUTPUT_FILE = path.join(process.cwd(), 'raw-data', 'bestiary-sheets-analysis.json');

const TARGET_SHEETS = ['Wojacy', 'Necro', 'Natura', 'Monstra', 'Dzicy', 'Firnamenty'];

interface SheetAnalysis {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  sampleRows: Record<string, unknown>[];
  columnTypes: Record<string, string>;
  uniqueValues: Record<string, unknown[]>;
}

function analyzeSheet(workbook: XLSX.WorkBook, sheetName: string): SheetAnalysis | null {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.warn(`⚠️  Sheet "${sheetName}" not found`);
    return null;
  }

  console.log(`📊 Analyzing sheet: ${sheetName}`);

  // Convert sheet to JSON
  const jsonData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
  
  if (jsonData.length === 0) {
    console.warn(`⚠️  Sheet "${sheetName}" is empty`);
    return null;
  }

  // Extract headers from first row
  const headers = Object.keys(jsonData[0]);
  
  // Analyze column types and collect unique values
  const columnTypes: Record<string, string> = {};
  const uniqueValues: Record<string, Set<unknown>> = {};
  
  headers.forEach(header => {
    uniqueValues[header] = new Set();
    const values = jsonData.map(row => row[header]).filter(v => v !== null && v !== undefined && v !== '');
    
    if (values.length === 0) {
      columnTypes[header] = 'empty';
      return;
    }

    // Determine type
    const types = new Set(values.map(v => typeof v));
    if (types.size === 1) {
      columnTypes[header] = Array.from(types)[0];
    } else {
      columnTypes[header] = 'mixed';
    }

    // Collect unique values (limited to 50 for performance)
    values.slice(0, 100).forEach(v => uniqueValues[header].add(v));
  });

  // Get sample rows (first 5)
  const sampleRows = jsonData.slice(0, 5);

  const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
  const rowCount = range.e.r - range.s.r + 1;
  const columnCount = range.e.c - range.s.c + 1;

  return {
    sheetName,
    rowCount,
    columnCount,
    headers,
    sampleRows,
    columnTypes,
    uniqueValues: Object.fromEntries(
      Object.entries(uniqueValues).map(([key, set]) => [key, Array.from(set)])
    )
  };
}

function main() {
  console.log('🔍 Starting Excel bestiary analysis...\n');

  if (!fs.existsSync(EXCEL_FILE)) {
    console.error(`❌ Excel file not found: ${EXCEL_FILE}`);
    process.exit(1);
  }

  console.log(`📖 Reading Excel file: ${EXCEL_FILE}\n`);
  
  // Read workbook
  const workbook = XLSX.readFile(EXCEL_FILE);
  
  console.log(`📋 Available sheets: ${workbook.SheetNames.join(', ')}\n`);
  console.log(`🎯 Target sheets: ${TARGET_SHEETS.join(', ')}\n`);

  // Analyze each target sheet
  const analyses: Record<string, SheetAnalysis> = {};
  
  for (const sheetName of TARGET_SHEETS) {
    const analysis = analyzeSheet(workbook, sheetName);
    if (analysis) {
      analyses[sheetName] = analysis;
      console.log(`   ✅ ${sheetName}: ${analysis.rowCount} rows, ${analysis.headers.length} columns\n`);
    }
  }

  // Write analysis to file
  console.log(`💾 Writing analysis to: ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(analyses, null, 2), 'utf-8');
  
  const fileSize = fs.statSync(OUTPUT_FILE).size;
  console.log(`✅ Analysis complete!`);
  console.log(`   - File size: ${(fileSize / 1024).toFixed(2)} KB`);
  console.log(`   - Sheets analyzed: ${Object.keys(analyses).length}`);
  
  console.log('\n📊 Summary by sheet:');
  Object.entries(analyses).forEach(([name, data]) => {
    console.log(`   ${name}: ${data.rowCount - 1} data rows, ${data.headers.length} columns`);
  });
}

main();
