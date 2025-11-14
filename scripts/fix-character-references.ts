import fs from 'fs';
import path from 'path';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const CHARACTERS_PATH = path.join(FORMATTED_DATA_DIR, 'characters.json');
const REPORT_PATH = path.join(FORMATTED_DATA_DIR, 'missing-references-report.txt');

type Reference = {
  name: string;
  grade: number;
};

type Character = {
  id: string;
  name: string;
  maneuvers: Reference[];
  maneuversIds: string[];
  perks: Reference[];
  perksIds: string[];
  stances: Reference[];
  stancesIds: string[];
  states: Reference[];
  statesIds: string[];
  [key: string]: unknown;
};

type FixAction = {
  characterName: string;
  type: 'Maneuvers' | 'Perks';
  reference: Reference;
  action: 'REMOVE' | 'MOVE_TO_PERK' | 'MOVE_TO_STANCE' | 'MOVE_TO_STATE' | 'MOVE_TO_MOUNT' | 'IGNORE';
};

function parseReport(reportPath: string): FixAction[] {
  const content = fs.readFileSync(reportPath, 'utf-8');
  const actions: FixAction[] = [];
  
  const lines = content.split('\n');
  let currentCharacter = '';
  let currentType: 'Maneuvers' | 'Perks' | null = null;
  
  for (const line of lines) {
    // Match character and type line: "⚠️  Kusznik - Maneuvers: 1 not found:"
    const headerMatch = line.match(/^⚠️\s+(.+?)\s+-\s+(Maneuvers|Perks):\s+\d+\s+not found:/);
    if (headerMatch) {
      currentCharacter = headerMatch[1];
      currentType = headerMatch[2] as 'Maneuvers' | 'Perks';
      continue;
    }
    
    // Match reference line: '  - "Kusznik" (grade: 1) - PERK'
    const refMatch = line.match(/^\s+-\s+"(.+?)"\s+\(grade:\s+(\d+)\)(?:\s+-\s+(.+))?$/);
    if (refMatch && currentCharacter && currentType) {
      const name = refMatch[1];
      const grade = parseInt(refMatch[2], 10);
      const comment = refMatch[3]?.trim() || '';
      
      let action: FixAction['action'] = 'IGNORE';
      
      if (comment === 'NIEPOPRAWNE') {
        action = 'REMOVE';
      } else if (comment === 'PERK') {
        action = 'MOVE_TO_PERK';
      } else if (comment === 'STANCE') {
        action = 'MOVE_TO_STANCE';
      } else if (comment === 'STATE') {
        action = 'MOVE_TO_STATE';
      } else if (comment === 'MOUNT') {
        action = 'MOVE_TO_MOUNT';
      } else if (comment.startsWith('TO JEST')) {
        action = 'IGNORE';
      }
      
      if (action !== 'IGNORE') {
        actions.push({
          characterName: currentCharacter,
          type: currentType,
          reference: { name, grade },
          action
        });
      }
    }
  }
  
  return actions;
}

function normalizeRefKey(ref: Reference): string {
  return `${ref.name.toLowerCase().replace(/\s+/g, ' ').trim()}|${ref.grade}`;
}

function applyFixes(characters: Character[], actions: FixAction[]): Character[] {
  const updatedCharacters = characters.map(char => ({ ...char }));
  
  let removedCount = 0;
  let movedToPerkCount = 0;
  let movedToStanceCount = 0;
  let movedToStateCount = 0;
  let movedToMountCount = 0;
  
  for (const action of actions) {
    const character = updatedCharacters.find(c => c.name === action.characterName);
    if (!character) {
      console.warn(`⚠️  Character not found: ${action.characterName}`);
      continue;
    }
    
    const sourceArray = action.type === 'Maneuvers' ? character.maneuvers : character.perks;
    const refKey = normalizeRefKey(action.reference);
    const refIndex = sourceArray.findIndex(r => normalizeRefKey(r) === refKey);
    
    if (refIndex === -1) {
      console.warn(`⚠️  Reference not found in ${action.characterName}.${action.type}: ${action.reference.name} (${action.reference.grade})`);
      continue;
    }
    
    const ref = sourceArray[refIndex];
    
    switch (action.action) {
      case 'REMOVE':
        sourceArray.splice(refIndex, 1);
        removedCount++;
        break;
        
      case 'MOVE_TO_PERK':
        if (action.type === 'Maneuvers') {
          sourceArray.splice(refIndex, 1);
          if (!character.perks.some(p => normalizeRefKey(p) === refKey)) {
            character.perks.push(ref);
          }
          movedToPerkCount++;
        }
        break;
        
      case 'MOVE_TO_STANCE':
        sourceArray.splice(refIndex, 1);
        if (!character.stances.some(s => normalizeRefKey(s) === refKey)) {
          character.stances.push(ref);
        }
        movedToStanceCount++;
        break;
        
      case 'MOVE_TO_STATE':
        if (action.type === 'Maneuvers') {
          sourceArray.splice(refIndex, 1);
          if (!character.states.some(s => normalizeRefKey(s) === refKey)) {
            character.states.push(ref);
          }
          movedToStateCount++;
        }
        break;
        
      case 'MOVE_TO_MOUNT':
        // Mount is not a standard field, just remove it
        sourceArray.splice(refIndex, 1);
        movedToMountCount++;
        break;
    }
  }
  
  console.log('\n📊 Fix Statistics:');
  console.log(`   ✅ Removed: ${removedCount}`);
  console.log(`   ✅ Moved to Perks: ${movedToPerkCount}`);
  console.log(`   ✅ Moved to Stances: ${movedToStanceCount}`);
  console.log(`   ✅ Moved to States: ${movedToStateCount}`);
  console.log(`   ✅ Moved to Mounts (removed): ${movedToMountCount}`);
  
  return updatedCharacters;
}

async function main() {
  console.log('🚀 Starting character reference fixes...\n');
  
  // Step 1: Parse report
  console.log('📖 Parsing missing references report...');
  const actions = parseReport(REPORT_PATH);
  console.log(`   ✅ Found ${actions.length} actions to apply\n`);
  
  // Step 2: Load characters
  console.log('📖 Loading characters...');
  const characters: Character[] = JSON.parse(fs.readFileSync(CHARACTERS_PATH, 'utf-8'));
  console.log(`   ✅ Loaded ${characters.length} characters\n`);
  
  // Step 3: Apply fixes
  console.log('🔧 Applying fixes...');
  const updatedCharacters = applyFixes(characters, actions);
  
  // Step 4: Write updated data
  console.log('\n💾 Writing updated characters.json...');
  fs.writeFileSync(
    CHARACTERS_PATH,
    JSON.stringify(updatedCharacters, null, 2),
    'utf-8'
  );
  
  const fileStats = fs.statSync(CHARACTERS_PATH);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✅ Written to: ${CHARACTERS_PATH}`);
  console.log(`   File size: ${fileSizeMB} MB\n`);
  
  console.log('🎉 Fixes applied successfully!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
