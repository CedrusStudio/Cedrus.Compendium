import * as XLSX from 'xlsx';

export interface ExcelRow {
  '>> Wojownicy <<'?: string | null; // Pierwsza kolumna (nazwa sekcji lub null)
  początek?: number;
  Koniec?: number;
  __EMPTY?: string | null;
  __EMPTY_1?: string | null;
  __EMPTY_2?: string | number | null;
  __EMPTY_3?: number | null;
  __EMPTY_4?: string | number | null;
  __EMPTY_5?: number | null;
  __EMPTY_6?: number | null;
  __EMPTY_7?: number | null;
  __EMPTY_8?: string | number | null;
  __EMPTY_9?: string | number | null;
  __EMPTY_10?: string | number | null;
  __EMPTY_11?: string | number | null;
  __EMPTY_12?: string | null;
  __EMPTY_13?: string | null;
  __EMPTY_14?: string | null;
  __EMPTY_15?: string | null;
  __EMPTY_16?: string | null;
  __EMPTY_17?: string | null;
  __EMPTY_18?: string | null;
  __EMPTY_19?: string | null;
  __EMPTY_20?: string | null;
  [key: string]: unknown; // Allow dynamic sheet names
}

export interface RawCharacterData {
  sheetName: string;
  category: string;
  name: string;
  healthRaw: string | number;
  resistanceRaw: number;
  reductionRaw: string | number;
  immunityRaw: number;
  dodgeReductionRaw: number;
  sizeRaw: number;
  initiativeRaw: number;
  combatSkillRaw: string | number;
  defenseRaw: string | number;
  savesRaw: string | number;
  statsRaw: string | number;
  maneuversRaw: string;
  equipmentRaw: string;
  damageRaw: string;
  abilities: Array<{
    name: string;
    description: string;
    actionType?: string;
  }>;
}

export interface ParseResult {
  characters: RawCharacterData[];
  stats: {
    totalSheets: number;
    totalCharacters: number;
    charactersBySheet: Record<string, number>;
  };
}

const TARGET_SHEETS = ['Wojacy', 'Necro', 'Natura', 'Monstra', 'Dzicy', 'Firnamenty'];

/**
 * Parsuje Excel i wyodrębnia surowe dane postaci
 */
export function parseExcel(excelPath: string): ParseResult {
  console.log(`📖 Reading Excel file: ${excelPath}`);
  
  const workbook = XLSX.readFile(excelPath);
  const characters: RawCharacterData[] = [];
  const charactersBySheet: Record<string, number> = {};

  for (const sheetName of TARGET_SHEETS) {
    console.log(`\n📊 Processing sheet: ${sheetName}`);
    
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.warn(`⚠️  Sheet "${sheetName}" not found`);
      continue;
    }

    const rows: ExcelRow[] = XLSX.utils.sheet_to_json(sheet, { defval: null });
    let currentCategory = '';
    let currentCharacter: RawCharacterData | null = null;
    let sheetCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      // Skip header rows
      if (i < 3) continue;

      // Detect category row (podkategoria) - __EMPTY ma wartość, reszta null lub puste
      if (row.__EMPTY && !row.__EMPTY_1 && !row.początek) {
        currentCategory = String(row.__EMPTY);
        continue;
      }

      // Detect main character row (początek > 0)
      if (row.początek && row.początek > 0 && row.Koniec && row.Koniec > row.początek) {
        // Skip if name is empty (invalid character row)
        if (!row.__EMPTY_1 || String(row.__EMPTY_1).trim().length === 0) {
          continue;
        }

        // Save previous character if exists
        if (currentCharacter) {
          characters.push(currentCharacter);
          sheetCount++;
        }

        // Create new character
        currentCharacter = {
          sheetName,
          category: currentCategory,
          name: String(row.__EMPTY_1 || '').trim(),
          healthRaw: row.__EMPTY_2 ?? 0,
          resistanceRaw: row.__EMPTY_3 ?? 0,
          reductionRaw: row.__EMPTY_4 ?? 0,
          immunityRaw: row.__EMPTY_5 ?? 0,
          dodgeReductionRaw: 0,
          damageRaw: String(row.__EMPTY_6 || ''),
          initiativeRaw: row.__EMPTY_7 ?? 0,
          combatSkillRaw: row.__EMPTY_8 ?? 0,
          defenseRaw: row.__EMPTY_9 ?? 0,
          savesRaw: row.__EMPTY_10 ?? 0,
          statsRaw: row.__EMPTY_11 ?? 0,
          maneuversRaw: String(row.__EMPTY_12 || ''),
          equipmentRaw: String(row.__EMPTY_13 || ''),
          sizeRaw: 0, // nie ma w Excel
          abilities: []
        };
        continue;
      }

      // Detect ability row (należy do poprzedniej postaci)
      if (currentCharacter && !row.początek && row.__EMPTY_1) {
        const abilityName = String(row.__EMPTY_1).trim();
        const abilityDescription = String(row.__EMPTY_2 || '').trim();
        const actionType = row.__EMPTY_14 ? String(row.__EMPTY_14).trim() : undefined;

        if (abilityName) {
          currentCharacter.abilities.push({
            name: abilityName,
            description: abilityDescription,
            actionType
          });
        }
      }
    }

    // Save last character
    if (currentCharacter) {
      characters.push(currentCharacter);
      sheetCount++;
    }

    charactersBySheet[sheetName] = sheetCount;
    console.log(`   ✅ ${sheetName}: ${sheetCount} characters`);
  }

  return {
    characters,
    stats: {
      totalSheets: TARGET_SHEETS.length,
      totalCharacters: characters.length,
      charactersBySheet
    }
  };
}
