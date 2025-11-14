import fs from 'fs';
import path from 'path';
import { ulid } from 'ulid';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const PERKS_PATH = path.join(FORMATTED_DATA_DIR, 'perks.json');

type Perk = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

// Additional missing perks from report
const ADDITIONAL_MISSING_PERKS: Array<{ name: string; grade: number; tags: string[] }> = [
  // Combat perks - walka wręcz
  { name: 'Odpowiednia  Dźwignia', grade: 1, tags: ['walka-wręcz', 'siła'] },
  { name: 'Odpowiednia  Dźwignia', grade: 2, tags: ['walka-wręcz', 'siła'] },
  { name: 'Defensywna walka wręcz', grade: 1, tags: ['walka-wręcz', 'obrona'] },
  { name: 'Defensywna walka wręcz', grade: 2, tags: ['walka-wręcz', 'obrona'] },
  { name: 'Defensywna walka wręcz', grade: 3, tags: ['walka-wręcz', 'obrona'] },
  { name: 'Napiętnowane  Mięśnie', grade: 1, tags: ['walka-wręcz', 'siła'] },
  { name: 'Napiętnowane  Mięśnie', grade: 2, tags: ['walka-wręcz', 'siła'] },
  { name: 'Potężne  Uderzenie', grade: 1, tags: ['walka-wręcz', 'atak'] },
  { name: 'Potężne  Uderzenie', grade: 2, tags: ['walka-wręcz', 'atak'] },
  { name: 'Potężne  Uderzenie', grade: 3, tags: ['walka-wręcz', 'atak'] },
  { name: 'Doświadczony Walczak', grade: 1, tags: ['walka-wręcz'] },
  
  // Undead perks
  { name: 'Eteryczny  Nieumarły', grade: 0, tags: ['nieumarli', 'eteryczny'] },
  { name: 'Eteryczny  Nieumarły', grade: 1, tags: ['nieumarli', 'eteryczny'] },
  { name: 'Eteryczny  Nieumarły', grade: 2, tags: ['nieumarli', 'eteryczny'] },
  { name: 'Eteryczny  Nieumarły', grade: 3, tags: ['nieumarli', 'eteryczny'] },
  { name: 'Nieumarły', grade: 0, tags: ['nieumarli'] },
  { name: 'Nieumarły', grade: 1, tags: ['nieumarli'] },
  { name: 'Nieumarły', grade: 2, tags: ['nieumarli'] },
  { name: 'Nieumarły', grade: 3, tags: ['nieumarli'] },
  { name: 'Choroba', grade: 1, tags: ['nieumarli', 'choroby'] },
  { name: 'Choroba', grade: 2, tags: ['nieumarli', 'choroby'] },
  
  // Animal perks with grades
  { name: 'Zwierzę', grade: 1, tags: ['zwierzę'] },
  { name: 'Zwierzę', grade: 2, tags: ['zwierzę'] },
  
  // Special perks
  { name: 'Zemsta', grade: 1, tags: ['specjalne'] },
  { name: 'Zemsta', grade: 2, tags: ['specjalne'] },
];

function normalizeRefKey(name: string, grade: number): string {
  return `${name.toLowerCase().replace(/\s+/g, ' ').trim()}|${grade}`;
}

function createPerk(name: string, grade: number, tags: string[]): Perk {
  return {
    id: ulid(),
    name,
    grade,
    description: '',
    requirements: [],
    price: 0,
    tags
  };
}

async function main() {
  console.log('🚀 Adding additional missing perks...\n');
  
  // Load existing data
  console.log('📖 Loading existing perks...');
  const existingPerks: Perk[] = JSON.parse(fs.readFileSync(PERKS_PATH, 'utf-8'));
  console.log(`   ✅ Existing perks: ${existingPerks.length}\n`);
  
  // Create lookup set
  const existingPerkKeys = new Set(existingPerks.map(p => normalizeRefKey(p.name, p.grade)));
  
  // Add missing perks
  console.log('🆕 Creating additional perks...');
  const newPerks: Perk[] = [];
  
  for (const perkSpec of ADDITIONAL_MISSING_PERKS) {
    const key = normalizeRefKey(perkSpec.name, perkSpec.grade);
    if (!existingPerkKeys.has(key)) {
      const newPerk = createPerk(perkSpec.name, perkSpec.grade, perkSpec.tags);
      newPerks.push(newPerk);
      existingPerkKeys.add(key);
      console.log(`   ✅ Created: "${perkSpec.name}" (grade: ${perkSpec.grade})`);
    } else {
      console.log(`   ⏭️  Skipped (exists): "${perkSpec.name}" (grade: ${perkSpec.grade})`);
    }
  }
  
  console.log(`\n   📊 Total new perks to add: ${newPerks.length}\n`);
  
  // Write updated file
  if (newPerks.length > 0) {
    console.log('💾 Writing updated perks.json...');
    const updatedPerks = [...existingPerks, ...newPerks].sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      return nameCompare !== 0 ? nameCompare : a.grade - b.grade;
    });
    fs.writeFileSync(PERKS_PATH, JSON.stringify(updatedPerks, null, 2), 'utf-8');
    console.log(`   ✅ Updated perks.json (${existingPerks.length} → ${updatedPerks.length} perks)\n`);
  } else {
    console.log('⏭️  No new perks to add\n');
  }
  
  console.log('🎉 Done! All additional perks added.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
