import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const EXCEL_PATH = path.join(process.cwd(), 'raw-data', 'Wielka Księga Wojowników.xlsm');
const OUTPUT_PATH = path.join(process.cwd(), 'excel-structure-clean.json');

interface SheetAnalysis {
  sheetName: string;
  rowCount: number;
  columnCount: number;
  headers: string[];
  sampleRows: Record<string, unknown>[];
  dataTypes: Record<string, string[]>;
}

function analyzeExcel() {
  console.log('📊 Analyzing Excel file...\n');

  const workbook = XLSX.readFile(EXCEL_PATH);
  console.log(`📋 Found ${workbook.SheetNames.length} sheets\n`);

  const analysis: SheetAnalysis[] = [];

  workbook.SheetNames.forEach((sheetName) => {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔍 Sheet: "${sheetName}"`);
    console.log('='.repeat(70));

    const worksheet = workbook.Sheets[sheetName];
    const rawData: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    if (rawData.length === 0) {
      console.log('⚠️  Empty sheet, skipping...\n');
      return;
    }

    // Filter out __EMPTY columns and columns with all null values
    const firstRow = rawData[0];
    const meaningfulHeaders = Object.keys(firstRow).filter(header => {
      if (header.startsWith('__EMPTY')) return false;
      
      // Check if column has at least one non-null value
      const hasValue = rawData.some(row => {
        const value = row[header];
        return value !== null && value !== undefined && value !== '';
      });
      
      return hasValue;
    });

    if (meaningfulHeaders.length === 0) {
      console.log('⚠️  No meaningful data found, skipping...\n');
      return;
    }

    // Create clean data with only meaningful columns
    const cleanData = rawData.map(row => {
      const cleanRow: Record<string, unknown> = {};
      meaningfulHeaders.forEach(header => {
        cleanRow[header] = row[header];
      });
      return cleanRow;
    });

    // Analyze data types
    const dataTypes: Record<string, Set<string>> = {};
    meaningfulHeaders.forEach(header => {
      dataTypes[header] = new Set();
    });

    cleanData.forEach(row => {
      meaningfulHeaders.forEach(header => {
        const value = row[header];
        if (value === null || value === undefined || value === '') {
          dataTypes[header].add('empty');
        } else {
          dataTypes[header].add(typeof value);
        }
      });
    });

    const dataTypesArray: Record<string, string[]> = {};
    Object.keys(dataTypes).forEach(key => {
      dataTypesArray[key] = Array.from(dataTypes[key]).filter(t => t !== 'empty');
    });

    const sheetAnalysis: SheetAnalysis = {
      sheetName,
      rowCount: cleanData.length,
      columnCount: meaningfulHeaders.length,
      headers: meaningfulHeaders,
      sampleRows: cleanData.slice(0, 5),
      dataTypes: dataTypesArray
    };

    analysis.push(sheetAnalysis);

    // Console output
    console.log(`📊 Total Rows: ${cleanData.length}`);
    console.log(`📊 Meaningful Columns: ${meaningfulHeaders.length}\n`);
    
    console.log('📝 Column Details:');
    meaningfulHeaders.forEach((header, index) => {
      const types = Array.from(dataTypes[header]).join(', ');
      const nonEmptyCount = cleanData.filter(row => {
        const val = row[header];
        return val !== null && val !== undefined && val !== '';
      }).length;
      const fillRate = Math.round((nonEmptyCount / cleanData.length) * 100);
      console.log(`  ${index + 1}. ${header}`);
      console.log(`     Types: ${types} | Fill rate: ${fillRate}%`);
    });

    console.log('\n📄 Sample Data (first 3 rows):');
    cleanData.slice(0, 3).forEach((row, idx) => {
      console.log(`\n  Row ${idx + 1}:`);
      meaningfulHeaders.forEach(header => {
        const value = row[header];
        if (value !== null && value !== undefined && value !== '') {
          const displayValue = String(value).length > 50 
            ? String(value).substring(0, 50) + '...' 
            : value;
          console.log(`    ${header}: ${displayValue}`);
        }
      });
    });

    console.log('\n');
  });

  // Save analysis
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(analysis, null, 2), 'utf-8');
  console.log(`\n\n✅ Clean analysis saved to: ${OUTPUT_PATH}\n`);

  // Generate comparison with TypeScript models
  console.log('\n' + '='.repeat(70));
  console.log('💡 MAPPING TO TYPESCRIPT MODELS');
  console.log('='.repeat(70));
  generateModelComparison(analysis);
}

function generateModelComparison(analysis: SheetAnalysis[]) {
  const modelDefinitions: Record<string, {fields: string[], description: string}> = {
    'Perk': {
      fields: ['name', 'description', 'grade', 'requirements', 'price', 'tags'],
      description: 'Atuty/Perki - dodatkowe umiejętności postaci'
    },
    'Maneuver': {
      fields: ['name', 'description', 'grade', 'castTime', 'cooldown', 'price', 'requirements', 'tags'],
      description: 'Manewry bojowe - techniki walki'
    },
    'Mode (Stance)': {
      fields: ['name', 'description', 'grade', 'requirements', 'price', 'tags'],
      description: 'Postawy - style walki'
    },
    'Mode (State)': {
      fields: ['name', 'description', 'grade', 'requirements', 'price', 'tags'],
      description: 'Stany - warunki postaci'
    },
    'Spell': {
      fields: ['name', 'description', 'grade', 'castTime', 'cost', 'price', 'cooldown', 'requirements', 'tags'],
      description: 'Zaklęcia - czary'
    },
    'Weapon': {
      fields: ['name', 'description', 'style', 'offense', 'damageBonus', 'range', 'tags'],
      description: 'Broń - bronie'
    },
    'Armor': {
      fields: ['name', 'description', 'protection', 'immunity', 'resistance', 'dexterityRestriction', 'reflexRestriction', 'initiativeRestriction', 'attributePenalty', 'strengthRequirement', 'tags'],
      description: 'Zbroja'
    },
    'Shield': {
      fields: ['name', 'description', 'block', 'resistance', 'dexterityRestriction', 'reflexRestriction', 'initiativeRestriction', 'attributePenalty', 'strengthRequirement', 'tags'],
      description: 'Tarcza'
    },
    'Mount': {
      fields: ['name', 'description', 'paceSpeed', 'gallopSpeed', 'canterSpeed', 'horsemanshipBonus', 'tags'],
      description: 'Wierzchowiec'
    },
    'Talent': {
      fields: ['name', 'category', 'characteristics', 'grade', 'bonus', 'penalty'],
      description: 'Talent - umiejętność specjalna'
    }
  };

  analysis.forEach(sheet => {
    console.log(`\n📋 Sheet: "${sheet.sheetName}"`);
    console.log(`   Rows: ${sheet.rowCount}, Columns: ${sheet.columnCount}`);
    console.log(`   Headers: ${sheet.headers.join(', ')}`);
    
    // Try to match with models
    let bestMatch = '';
    let bestScore = 0;
    let matchedFields: string[] = [];

    Object.entries(modelDefinitions).forEach(([modelName, modelDef]) => {
      const polishToEnglishMap: Record<string, string> = {
        'Nazwa': 'name',
        'Działanie': 'description',
        'Koszt': 'price',
        'Wymagania': 'requirements',
        'Częstotliwość': 'cooldown',
        'War': 'grade',
        'ST': 'castTime',
        'Typ': 'tags',
      };

      const matches = sheet.headers.filter(polishHeader => {
        const englishField = polishToEnglishMap[polishHeader];
        return englishField && modelDef.fields.includes(englishField);
      });

      const score = matches.length / modelDef.fields.length;
      if (score > bestScore) {
        bestScore = score;
        bestMatch = modelName;
        matchedFields = matches;
      }
    });

    if (bestScore > 0.3) {
      console.log(`   ✅ Suggested Model: ${bestMatch} (${Math.round(bestScore * 100)}% match)`);
      console.log(`   Matched fields: ${matchedFields.join(', ')}`);
      console.log(`   ${modelDefinitions[bestMatch].description}`);
    } else {
      console.log(`   ⚠️  No clear model match - requires manual mapping`);
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('📊 POLISH TO ENGLISH FIELD MAPPING SUGGESTIONS:');
  console.log('='.repeat(70));
  console.log(`
Common Polish → English mappings:
  Nazwa          → name
  Działanie      → description
  Koszt          → price (or cost for spells)
  Wymagania      → requirements
  Częstotliwość  → cooldown
  War            → grade (wartość/warstwa)
  ST             → castTime (standardowa/tura)
  Typ            → tags (or category/type)
  `);
}

try {
  analyzeExcel();
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
