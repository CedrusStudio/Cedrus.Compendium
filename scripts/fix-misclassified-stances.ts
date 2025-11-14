import fs from 'fs';
import path from 'path';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const CHARACTERS_PATH = path.join(FORMATTED_DATA_DIR, 'characters.json');

type Reference = {
  name: string;
  grade: number;
};

type Character = {
  name: string;
  perks: Reference[];
  stances: Reference[];
  [key: string]: unknown;
};

// Stances that were incorrectly classified as perks
const MISCLASSIFIED_STANCES = [
  'Postawa Ofensywna',
  'Postawa Defensywna',
  'Postawa Fechmistrza',
  'Postawa Pełna Defensywna',
];

function isStance(name: string): boolean {
  return MISCLASSIFIED_STANCES.some(stanceName => name === stanceName);
}

async function main() {
  console.log('🚀 Moving misclassified stances from perks to stances array...\n');
  
  // Load characters
  console.log('📖 Loading characters...');
  const characters: Character[] = JSON.parse(fs.readFileSync(CHARACTERS_PATH, 'utf-8'));
  console.log(`   ✅ Characters: ${characters.length}\n`);
  
  // Move misclassified items
  console.log('🔄 Processing characters...');
  let totalMoved = 0;
  
  for (const character of characters) {
    const stancesInPerks = character.perks.filter(p => isStance(p.name));
    
    if (stancesInPerks.length > 0) {
      console.log(`   📝 ${character.name}:`);
      
      // Remove from perks
      character.perks = character.perks.filter(p => !isStance(p.name));
      
      // Add to stances
      for (const stance of stancesInPerks) {
        character.stances.push(stance);
        console.log(`      ✅ Moved "${stance.name}" (grade: ${stance.grade}) to stances`);
        totalMoved++;
      }
    }
  }
  
  console.log(`\n   📊 Total items moved: ${totalMoved}\n`);
  
  // Write updated file
  console.log('💾 Writing updated characters.json...');
  fs.writeFileSync(CHARACTERS_PATH, JSON.stringify(characters, null, 2), 'utf-8');
  const fileStats = fs.statSync(CHARACTERS_PATH);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✅ Updated characters.json (${fileSizeMB} MB)\n`);
  
  console.log('🎉 Done! All misclassified stances moved to correct array.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
