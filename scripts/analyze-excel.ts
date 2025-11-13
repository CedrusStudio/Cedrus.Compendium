import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const EXCEL_PATH = path.join(process.cwd(), 'raw-data', 'Wielka Księga Wojowników.xlsm');
const OUTPUT_PATH = path.join(process.cwd(), 'excel-structure-analysis.json');

interface SheetAnalysis {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  sampleData: Record<string, unknown>[];
  dataTypes: Record<string, string[]>;
}

function analyzeExcel() {
  console.log('📊 Analyzing Excel file...');
  console.log('File path:', EXCEL_PATH);

  // Read the Excel file
  const workbook = XLSX.readFile(EXCEL_PATH);
  
  console.log('\n📋 Found sheets:', workbook.SheetNames.length);
  console.log('Sheet names:', workbook.SheetNames.join(', '));

  const analysis: SheetAnalysis[] = [];

  // Analyze each sheet
  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n\n🔍 Analyzing sheet: "${sheetName}"`);
    console.log('='.repeat(60));

    const worksheet = workbook.Sheets[sheetName];
    const jsonData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    if (jsonData.length === 0) {
      console.log('⚠️  Empty sheet, skipping...');
      return;
    }

    // Get headers (column names)
    const headers = Object.keys(jsonData[0]);
    
    // Analyze data types for each column
    const dataTypes: Record<string, Set<string>> = {};
    headers.forEach(header => {
      dataTypes[header] = new Set();
    });

    jsonData.forEach(row => {
      headers.forEach(header => {
        const value = row[header];
        const type = value === null ? 'null' : typeof value;
        dataTypes[header].add(type);
      });
    });

    // Convert Sets to Arrays for JSON serialization
    const dataTypesArray: Record<string, string[]> = {};
    Object.keys(dataTypes).forEach(key => {
      dataTypesArray[key] = Array.from(dataTypes[key]);
    });

    // Get sample data (first 3 rows)
    const sampleData = jsonData.slice(0, 3);

    const sheetAnalysis: SheetAnalysis = {
      sheetName,
      rowCount: jsonData.length,
      columnCount: headers.length,
      headers,
      sampleData,
      dataTypes: dataTypesArray
    };

    analysis.push(sheetAnalysis);

    // Console output
    console.log(`📊 Rows: ${jsonData.length}`);
    console.log(`📊 Columns: ${headers.length}`);
    console.log('\n📝 Headers:');
    headers.forEach((header, index) => {
      const types = Array.from(dataTypes[header]).join(', ');
      console.log(`  ${index + 1}. ${header} (${types})`);
    });

    console.log('\n📄 Sample Data (first row):');
    console.log(JSON.stringify(jsonData[0], null, 2));
  });

  // Save analysis to JSON file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`\n\n✅ Analysis saved to: ${OUTPUT_PATH}`);
  
  // Generate mapping suggestions
  console.log('\n\n💡 Mapping Suggestions:');
  console.log('='.repeat(60));
  generateMappingSuggestions(analysis);
}

function generateMappingSuggestions(analysis: SheetAnalysis[]) {
  const modelMapping: Record<string, string[]> = {
    'Character': ['name', 'shortName', 'description', 'tags', 'health', 'characteristics', 'attributes'],
    'Weapon': ['name', 'description', 'style', 'offense', 'damageBonus', 'range', 'tags'],
    'Armor': ['name', 'description', 'protection', 'immunity', 'resistance', 'dexterityRestriction', 'reflexRestriction'],
    'Shield': ['name', 'description', 'block', 'resistance', 'dexterityRestriction'],
    'Mount': ['name', 'description', 'paceSpeed', 'gallopSpeed', 'canterSpeed', 'horsemanshipBonus'],
    'Perk': ['name', 'description', 'grade', 'requirements', 'price', 'tags'],
    'Talent': ['name', 'category', 'characteristics', 'grade', 'bonus', 'penalty'],
    'Maneuver': ['name', 'description', 'grade', 'castTime', 'cooldown', 'price'],
    'Power': ['name', 'type', 'level', 'bonus', 'essence', 'spells'],
    'Spell': ['name', 'description', 'grade', 'castTime', 'cost', 'price', 'cooldown'],
    'Defense': ['name', 'description', 'immunity', 'resistance', 'protection', 'block', 'parry', 'dodge'],
    'Offense': ['name', 'description', 'leadingWeapon', 'secondaryWeapon', 'damageBonus']
  };

  analysis.forEach(sheet => {
    console.log(`\n📋 Sheet: "${sheet.sheetName}"`);
    
    // Try to match sheet to model
    let bestMatch = '';
    let bestMatchScore = 0;

    Object.keys(modelMapping).forEach(modelName => {
      const modelFields = modelMapping[modelName];
      const matchingFields = sheet.headers.filter(header => 
        modelFields.some(field => 
          header.toLowerCase().includes(field.toLowerCase()) ||
          field.toLowerCase().includes(header.toLowerCase())
        )
      );
      
      const score = matchingFields.length / modelFields.length;
      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = modelName;
      }
    });

    if (bestMatchScore > 0.2) {
      console.log(`   Suggested model: ${bestMatch} (${Math.round(bestMatchScore * 100)}% match)`);
    } else {
      console.log(`   ⚠️  No clear model match - manual mapping required`);
    }

    console.log(`   Available fields: ${sheet.headers.join(', ')}`);
  });
}

// Run the analysis
try {
  analyzeExcel();
} catch (error) {
  console.error('❌ Error analyzing Excel file:', error);
  process.exit(1);
}
