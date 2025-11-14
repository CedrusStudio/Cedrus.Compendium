import fs from 'fs';
import path from 'path';
import { ulid } from 'ulid';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const PERKS_PATH = path.join(FORMATTED_DATA_DIR, 'perks.json');
const MANEUVERS_PATH = path.join(FORMATTED_DATA_DIR, 'maneuvers.json');

type Perk = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

type Maneuver = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

// Creature-specific perks that need to be created
const MISSING_CREATURE_PERKS: Array<{ name: string; grade: number; tags: string[] }> = [
  // Animals
  { name: 'Zwierzę', grade: 0, tags: ['zwierzę'] },
  { name: 'Zwierzę  Wodne', grade: 1, tags: ['zwierzę', 'wodne'] },
  
  // Monsters
  { name: 'Skorpena', grade: 1, tags: ['potwory', 'skorpena'] },
  { name: 'Czerw', grade: 1, tags: ['potwory', 'czerw'] },
  { name: 'Wurm', grade: 1, tags: ['potwory', 'wurm'] },
  { name: 'Pełzacz', grade: 1, tags: ['potwory', 'pełzacz'] },
  { name: 'Utopiec', grade: 1, tags: ['potwory', 'utopiec', 'nieumarli'] },
  { name: 'Wilkołak', grade: 1, tags: ['potwory', 'wilkołak', 'lykantropy'] },
  { name: 'Kuroliszek', grade: 1, tags: ['potwory', 'kuroliszek'] },
  { name: 'Bazyliszek', grade: 1, tags: ['potwory', 'bazyliszek'] },
  { name: 'Harpia', grade: 1, tags: ['potwory', 'harpia'] },
  { name: 'Wyrm', grade: 1, tags: ['potwory', 'wyrm', 'smoki'] },
  { name: 'Wywerna', grade: 1, tags: ['potwory', 'wywerna', 'smoki'] },
  { name: 'Mantikora', grade: 1, tags: ['potwory', 'mantikora'] },
  { name: 'Eteryczny', grade: 1, tags: ['potwory', 'eteryczny'] },
  { name: 'Plugawiciel', grade: 1, tags: ['potwory', 'plugawiciel', 'demony'] },
  { name: 'Noworodnik', grade: 1, tags: ['potwory', 'noworodnik'] },
  { name: 'Przebrzydły', grade: 1, tags: ['potwory', 'przebrzydły'] },
  { name: 'trujące żądło', grade: 1, tags: ['potwory', 'trucizna'] },
  { name: 'Żądliszcze', grade: 1, tags: ['potwory', 'żądliszcze'] },
  { name: 'Merromonstrum', grade: 1, tags: ['potwory', 'merromonstrum', 'wodne'] },
];

// Animal maneuvers that need to be created
const MISSING_ANIMAL_MANEUVERS: Array<{ name: string; grade: number; tags: string[] }> = [
  { name: 'Skok na ofiare', grade: 1, tags: ['zwierzę', 'atak'] },
  { name: 'Skok na ofiare', grade: 2, tags: ['zwierzę', 'atak'] },
  { name: 'Skok na ofiare', grade: 3, tags: ['zwierzę', 'atak'] },
  { name: 'Szczęki i  Szpony', grade: 1, tags: ['zwierzę', 'atak'] },
  { name: 'Szczęki i  Szpony', grade: 2, tags: ['zwierzę', 'atak'] },
  { name: 'Szczęki i  Szpony', grade: 3, tags: ['zwierzę', 'atak'] },
  { name: 'Dzicza  Szarża +', grade: 3, tags: ['zwierzę', 'szarża'] },
  { name: 'Zatrucie 1/2k', grade: 6, tags: ['zwierzę', 'trucizna'] },
  { name: 'Paraliż', grade: 1, tags: ['potwory', 'kontrola'] },
  { name: 'Moc  Ognia', grade: 2, tags: ['potwory', 'ogień'] },
  { name: 'Wejrzenie w  Duszę', grade: 1, tags: ['potwory', 'demony'] },
];

// Note: Stances are not created by this script - they need to be added manually to stances.json
// Missing stances identified in report:
// - Postawa Miecznika (grade: 1)
// - Postawa Ofensywna (grade: 3)
// - Postawa Defensywna (grades: 1, 2, 3)
// - Postawa Fechmistrza (grade: 2)
// - Postawa Pełna Defensywna (grade: 3)

// Other missing references that need special handling
const MISSING_SPECIAL: Array<{ name: string; grade: number; type: 'maneuver' | 'perk' | 'state' }> = [
  { name: 'Zemsta', grade: 1, type: 'maneuver' },
  { name: 'Zemsta', grade: 2, type: 'maneuver' },
  { name: 'Jeździectwo', grade: 4, type: 'maneuver' },
  { name: 'Jeździectwo', grade: 6, type: 'maneuver' },
  { name: 'Nekromantyczny  Promień', grade: 1, type: 'maneuver' },
  { name: 'Szarża', grade: 0, type: 'state' },
  { name: 'Nekromanci', grade: 1, type: 'perk' },
  { name: 'Nekromanta Nowicjusz', grade: 1, type: 'perk' },
  { name: 'Nekromanta Adept', grade: 1, type: 'perk' },
  { name: 'Nekromanta Ekspert', grade: 1, type: 'perk' },
  { name: 'Nekromanta Mistrz', grade: 1, type: 'perk' },
  { name: 'Arcymag Nekromancji', grade: 1, type: 'perk' },
  { name: 'Manerwy', grade: 3, type: 'perk' },
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

function createManeuver(name: string, grade: number, tags: string[]): Maneuver {
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
  console.log('🚀 Adding missing creature perks and maneuvers...\n');
  
  // Load existing data
  console.log('📖 Loading existing data...');
  const existingPerks: Perk[] = JSON.parse(fs.readFileSync(PERKS_PATH, 'utf-8'));
  const existingManeuvers: Maneuver[] = JSON.parse(fs.readFileSync(MANEUVERS_PATH, 'utf-8'));
  console.log(`   ✅ Existing perks: ${existingPerks.length}, maneuvers: ${existingManeuvers.length}\n`);
  
  // Create lookup sets
  const existingPerkKeys = new Set(existingPerks.map(p => normalizeRefKey(p.name, p.grade)));
  const existingManeuverKeys = new Set(existingManeuvers.map(m => normalizeRefKey(m.name, m.grade)));
  
  // Add creature perks
  console.log('🆕 Creating creature perks...');
  const newPerks: Perk[] = [];
  
  for (const perkSpec of MISSING_CREATURE_PERKS) {
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
  
  // Add nekromancer perks from MISSING_SPECIAL
  console.log('\n🆕 Creating special perks (nekromancers, etc.)...');
  for (const spec of MISSING_SPECIAL) {
    if (spec.type !== 'perk') continue;
    
    const key = normalizeRefKey(spec.name, spec.grade);
    if (!existingPerkKeys.has(key)) {
      const newPerk = createPerk(spec.name, spec.grade, ['nekromancja']);
      newPerks.push(newPerk);
      existingPerkKeys.add(key);
      console.log(`   ✅ Created: "${spec.name}" (grade: ${spec.grade})`);
    } else {
      console.log(`   ⏭️  Skipped (exists): "${spec.name}" (grade: ${spec.grade})`);
    }
  }
  
  console.log(`\n   📊 Total new perks to add: ${newPerks.length}\n`);
  
  // Add animal maneuvers
  console.log('🆕 Creating animal maneuvers...');
  const newManeuvers: Maneuver[] = [];
  
  for (const maneuverSpec of MISSING_ANIMAL_MANEUVERS) {
    const key = normalizeRefKey(maneuverSpec.name, maneuverSpec.grade);
    if (!existingManeuverKeys.has(key)) {
      const newManeuver = createManeuver(maneuverSpec.name, maneuverSpec.grade, maneuverSpec.tags);
      newManeuvers.push(newManeuver);
      existingManeuverKeys.add(key);
      console.log(`   ✅ Created: "${maneuverSpec.name}" (grade: ${maneuverSpec.grade})`);
    } else {
      console.log(`   ⏭️  Skipped (exists): "${maneuverSpec.name}" (grade: ${maneuverSpec.grade})`);
    }
  }
  
  // Add special maneuvers from MISSING_SPECIAL
  console.log('\n🆕 Creating special maneuvers (Zemsta, Jeździectwo, etc.)...');
  for (const spec of MISSING_SPECIAL) {
    if (spec.type !== 'maneuver') continue;
    
    const key = normalizeRefKey(spec.name, spec.grade);
    if (!existingManeuverKeys.has(key)) {
      let tags: string[] = [];
      if (spec.name.includes('Zemsta')) tags = ['specjalne'];
      if (spec.name.includes('Jeździectwo')) tags = ['jeździectwo'];
      if (spec.name.includes('Nekromantyczny')) tags = ['nekromancja'];
      
      const newManeuver = createManeuver(spec.name, spec.grade, tags);
      newManeuvers.push(newManeuver);
      existingManeuverKeys.add(key);
      console.log(`   ✅ Created: "${spec.name}" (grade: ${spec.grade})`);
    } else {
      console.log(`   ⏭️  Skipped (exists): "${spec.name}" (grade: ${spec.grade})`);
    }
  }
  
  console.log(`\n   📊 Total new maneuvers to add: ${newManeuvers.length}\n`);
  
  // Write updated files
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
  
  if (newManeuvers.length > 0) {
    console.log('💾 Writing updated maneuvers.json...');
    const updatedManeuvers = [...existingManeuvers, ...newManeuvers].sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      return nameCompare !== 0 ? nameCompare : a.grade - b.grade;
    });
    fs.writeFileSync(MANEUVERS_PATH, JSON.stringify(updatedManeuvers, null, 2), 'utf-8');
    console.log(`   ✅ Updated maneuvers.json (${existingManeuvers.length} → ${updatedManeuvers.length} maneuvers)\n`);
  } else {
    console.log('⏭️  No new maneuvers to add\n');
  }
  
  console.log('🎉 Done! New items added without modifying existing ones.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
