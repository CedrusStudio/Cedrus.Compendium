import fs from 'fs';
import path from 'path';
import { ulid } from 'ulid';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const CHARACTERS_PATH = path.join(FORMATTED_DATA_DIR, 'characters.json');
const PERKS_PATH = path.join(FORMATTED_DATA_DIR, 'perks.json');
const STANCES_PATH = path.join(FORMATTED_DATA_DIR, 'stances.json');
const REPORT_PATH = path.join(FORMATTED_DATA_DIR, 'missing-references-report.txt');

type Reference = {
  name: string;
  grade: number;
};

type Perk = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

type Stance = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

type Character = {
  name: string;
  perks: Reference[];
  stances: Reference[];
  [key: string]: unknown;
};

type ParsedAction = {
  characterName: string;
  type: 'Perks' | 'Stances';
  reference: Reference;
  action: 'REMOVE' | 'CREATE_PERK' | 'FIX_NAME';
  newName?: string;
  perkSpec?: {
    price: number;
    tags: string[];
  };
};

function parseReport(reportPath: string): ParsedAction[] {
  const content = fs.readFileSync(reportPath, 'utf-8');
  const actions: ParsedAction[] = [];
  
  const lines = content.split('\n');
  let currentCharacter = '';
  let currentType: 'Maneuvers' | 'Perks' | 'Stances' | 'States' | null = null;
  
  for (const line of lines) {
    const headerMatch = line.match(/^⚠️\s+(.+?)\s+-\s+(Maneuvers|Perks|Stances|States):\s+\d+\s+not found:/);
    if (headerMatch) {
      currentCharacter = headerMatch[1];
      currentType = headerMatch[2] as 'Maneuvers' | 'Perks' | 'Stances' | 'States';
      continue;
    }
    
    const refMatch = line.match(/^\s+-\s+"(.+?)"\s+\(grade:\s+(\d+)\)(?:\s+-\s+(.+))?$/);
    if (refMatch && currentCharacter && (currentType === 'Perks' || currentType === 'Stances')) {
      const name = refMatch[1];
      const grade = parseInt(refMatch[2], 10);
      const comment = refMatch[3]?.trim() || '';
      
      if (comment === 'NIEPOPRAWNE' || comment === 'NIEPOPRAWNY') {
        actions.push({
          characterName: currentCharacter,
          type: currentType,
          reference: { name, grade },
          action: 'REMOVE'
        });
      } else if (comment.startsWith('STWÓRZ NOWY PERK')) {
        // Parse tags from comment: tags = [dystans, kusze]
        const tagsMatch = comment.match(/tags\s*=\s*\[([^\]]*)\]/);
        const tags = tagsMatch ? tagsMatch[1].split(',').map(t => t.trim()).filter(t => t.length > 0) : [];
        
        actions.push({
          characterName: currentCharacter,
          type: currentType,
          reference: { name, grade },
          action: 'CREATE_PERK',
          perkSpec: {
            price: 0,
            tags
          }
        });
      } else if (comment.startsWith('POWINNO BYĆ')) {
        // Parse new name: POWINNO BYĆ "Postawa Ofensywna"
        const nameMatch = comment.match(/POWINNO BYĆ\s+"(.+?)"/);
        if (nameMatch) {
          actions.push({
            characterName: currentCharacter,
            type: currentType,
            reference: { name, grade },
            action: 'FIX_NAME',
            newName: nameMatch[1]
          });
        }
      }
    }
  }
  
  return actions;
}

function normalizeRefKey(ref: Reference): string {
  return `${ref.name.toLowerCase().replace(/\s+/g, ' ').trim()}|${ref.grade}`;
}

function createNewPerk(name: string, grade: number, spec: { price: number; tags: string[] }): Perk {
  return {
    id: ulid(),
    name,
    grade,
    description: '',
    requirements: [],
    price: spec.price,
    tags: spec.tags
  };
}

async function main() {
  console.log('🚀 Starting advanced fixes...\n');
  
  // Step 1: Parse report
  console.log('📖 Parsing report...');
  const actions = parseReport(REPORT_PATH);
  console.log(`   ✅ Found ${actions.length} actions\n`);
  
  // Group actions by type
  const removeActions = actions.filter(a => a.action === 'REMOVE');
  const createPerkActions = actions.filter(a => a.action === 'CREATE_PERK');
  const fixNameActions = actions.filter(a => a.action === 'FIX_NAME');
  
  console.log(`   - Remove: ${removeActions.length}`);
  console.log(`   - Create perks: ${createPerkActions.length}`);
  console.log(`   - Fix names: ${fixNameActions.length}\n`);
  
  // Step 2: Load data
  console.log('📖 Loading data...');
  const characters: Character[] = JSON.parse(fs.readFileSync(CHARACTERS_PATH, 'utf-8'));
  const perks: Perk[] = JSON.parse(fs.readFileSync(PERKS_PATH, 'utf-8'));
  const stances: Stance[] = JSON.parse(fs.readFileSync(STANCES_PATH, 'utf-8'));
  console.log(`   ✅ Characters: ${characters.length}, Perks: ${perks.length}, Stances: ${stances.length}\n`);
  
  // Step 3: Create new perks
  console.log('🆕 Creating new perks...');
  const newPerks: Perk[] = [];
  const createdPerkKeys = new Set<string>();
  
  for (const action of createPerkActions) {
    const key = normalizeRefKey(action.reference);
    if (createdPerkKeys.has(key)) {
      continue; // Already created
    }
    
    const newPerk = createNewPerk(action.reference.name, action.reference.grade, action.perkSpec!);
    newPerks.push(newPerk);
    createdPerkKeys.add(key);
  }
  
  console.log(`   ✅ Created ${newPerks.length} new perks\n`);
  
  // Step 4: Apply removals
  console.log('🗑️  Removing invalid references...');
  let removedCount = 0;
  
  for (const action of removeActions) {
    const character = characters.find(c => c.name === action.characterName);
    if (!character) continue;
    
    const sourceArray = action.type === 'Perks' ? character.perks : character.stances;
    const refKey = normalizeRefKey(action.reference);
    const refIndex = sourceArray.findIndex(r => normalizeRefKey(r) === refKey);
    
    if (refIndex !== -1) {
      sourceArray.splice(refIndex, 1);
      removedCount++;
    }
  }
  
  console.log(`   ✅ Removed ${removedCount} invalid references\n`);
  
  // Step 5: Fix names (replace double spaces with single)
  console.log('✏️  Fixing names...');
  let fixedCount = 0;
  
  for (const action of fixNameActions) {
    const character = characters.find(c => c.name === action.characterName);
    if (!character) continue;
    
    const sourceArray = action.type === 'Perks' ? character.perks : character.stances;
    const ref = sourceArray.find(r => r.name === action.reference.name && r.grade === action.reference.grade);
    
    if (ref && action.newName) {
      ref.name = action.newName;
      fixedCount++;
    }
  }
  
  console.log(`   ✅ Fixed ${fixedCount} names\n`);
  
  // Step 6: Write updated data
  console.log('💾 Writing updated files...');
  
  // Write perks
  const updatedPerks = [...perks, ...newPerks].sort((a, b) => {
    const nameCompare = a.name.localeCompare(b.name);
    return nameCompare !== 0 ? nameCompare : a.grade - b.grade;
  });
  fs.writeFileSync(PERKS_PATH, JSON.stringify(updatedPerks, null, 2), 'utf-8');
  console.log(`   ✅ Updated perks.json (${updatedPerks.length} perks)`);
  
  // Write characters
  fs.writeFileSync(CHARACTERS_PATH, JSON.stringify(characters, null, 2), 'utf-8');
  const fileStats = fs.statSync(CHARACTERS_PATH);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✅ Updated characters.json (${fileSizeMB} MB)\n`);
  
  console.log('🎉 Advanced fixes complete!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
