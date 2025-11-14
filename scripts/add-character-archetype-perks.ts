import fs from 'fs';
import path from 'path';
import { ulid } from 'ulid';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const PERKS_PATH = path.join(FORMATTED_DATA_DIR, 'perks.json');
const STANCES_PATH = path.join(FORMATTED_DATA_DIR, 'stances.json');
const STATES_PATH = path.join(FORMATTED_DATA_DIR, 'states.json');

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

type State = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

// Character archetype perks from missing report
const MISSING_CHARACTER_PERKS: Array<{ name: string; grade: number; tags: string[] }> = [
  // Kusznik
  { name: 'Kusznik', grade: 1, tags: ['dystans', 'kusze'] },
  { name: 'Kusznik', grade: 2, tags: ['dystans', 'kusze'] },
  { name: 'Kusznik', grade: 3, tags: ['dystans', 'kusze'] },
  
  // Dzikus
  { name: 'Dzikus', grade: 2, tags: ['dzicy'] },
  
  // Barbarzyńca
  { name: 'Barbarzyńca', grade: 3, tags: ['barbarzyńcy', 'wojacy'] },
  
  // Zbój
  { name: 'Zbój', grade: 1, tags: ['bandyci'] },
  { name: 'Zbój', grade: 2, tags: ['bandyci'] },
  { name: 'Zbój', grade: 3, tags: ['bandyci'] },
  { name: 'Zbój', grade: 4, tags: ['bandyci'] },
  
  // Chłop
  { name: 'Chłop', grade: 1, tags: ['cywile', 'chłopi'] },
  
  // Wojownik
  { name: 'Wojownik', grade: 0, tags: ['wojacy'] },
  { name: 'Wojownik', grade: 1, tags: ['wojacy'] },
  { name: 'Wojownik Tarczownik', grade: 1, tags: ['wojacy', 'tarcze'] },
  { name: 'Wojownik Miecznik', grade: 1, tags: ['wojacy', 'miecze'] },
  
  // Dualista
  { name: 'Dualista', grade: 1, tags: ['wojacy', 'dwuręczny'] },
  
  // Rycerz
  { name: 'Rycerz  Tarczownik', grade: 1, tags: ['rycerze', 'tarcze'] },
  { name: 'Rycerz  Tarczownik', grade: 2, tags: ['rycerze', 'tarcze'] },
  { name: 'Rycerz  Tarczownik', grade: 3, tags: ['rycerze', 'tarcze'] },
  { name: 'Rycerz  Tarczownik', grade: 4, tags: ['rycerze', 'tarcze'] },
  { name: 'Rycerz  Miecznik', grade: 1, tags: ['rycerze', 'miecze'] },
  { name: 'Rycerz  Miecznik', grade: 2, tags: ['rycerze', 'miecze'] },
  { name: 'Rycerz  Miecznik', grade: 3, tags: ['rycerze', 'miecze'] },
  { name: 'Rycerz  Miecznik', grade: 4, tags: ['rycerze', 'miecze'] },
  
  // Zabójca
  { name: 'Zabójca', grade: 1, tags: ['zabójcy'] },
  { name: 'Zabójca', grade: 2, tags: ['zabójcy'] },
  { name: 'Zabójca', grade: 3, tags: ['zabójcy'] },
  { name: 'Zabójca', grade: 4, tags: ['zabójcy'] },
  
  // Undead female spirits
  { name: 'Banshee', grade: 1, tags: ['nieumarli', 'duchy'] },
  { name: 'Chabernica', grade: 1, tags: ['nieumarli', 'duchy'] },
  { name: 'Południca', grade: 1, tags: ['nieumarli', 'duchy'] },
  { name: 'Północnica', grade: 1, tags: ['nieumarli', 'duchy'] },
  { name: 'Horror', grade: 1, tags: ['nieumarli', 'duchy'] },
  
  // Widminy
  { name: 'Widminy', grade: 1, tags: ['nieumarli', 'widma'] },
  
  // Undead types
  { name: 'Śniący', grade: 1, tags: ['nieumarli'] },
  { name: 'Wypaleniec', grade: 1, tags: ['nieumarli', 'ogień'] },
  { name: 'Spopieleniec', grade: 1, tags: ['nieumarli', 'ogień'] },
  { name: 'Płomienny Trup', grade: 1, tags: ['nieumarli', 'ogień'] },
  { name: 'Zimny Trup', grade: 1, tags: ['nieumarli', 'lód'] },
  { name: 'Grobownik', grade: 1, tags: ['nieumarli'] },
  { name: 'Choroba', grade: 3, tags: ['nieumarli', 'choroby'] },
  { name: 'Mumia', grade: 1, tags: ['nieumarli'] },
  { name: 'Garbiec', grade: 1, tags: ['nieumarli'] },
  { name: 'Martwiec', grade: 1, tags: ['nieumarli'] },
  { name: 'Czyrakownik', grade: 1, tags: ['nieumarli', 'choroby'] },
  { name: 'Inteligentny  Nieumarły', grade: 1, tags: ['nieumarli', 'inteligentni'] },
];

// Missing stances
const MISSING_STANCES: Array<{ name: string; grade: number; tags: string[] }> = [
  { name: 'Postawa Miecznika', grade: 1, tags: ['postawa', 'miecze'] },
  { name: 'Postawa Ofensywna', grade: 3, tags: ['postawa', 'atak'] },
  { name: 'Postawa Defensywna', grade: 1, tags: ['postawa', 'obrona'] },
  { name: 'Postawa Defensywna', grade: 2, tags: ['postawa', 'obrona'] },
  { name: 'Postawa Defensywna', grade: 3, tags: ['postawa', 'obrona'] },
  { name: 'Postawa Fechmistrza', grade: 2, tags: ['postawa', 'szermierka'] },
  { name: 'Postawa Pełna Defensywna', grade: 3, tags: ['postawa', 'obrona'] },
];

// Missing states
const MISSING_STATES: Array<{ name: string; grade: number; tags: string[] }> = [
  { name: 'Szarża', grade: 0, tags: ['stan', 'ruch'] },
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

function createStance(name: string, grade: number, tags: string[]): Stance {
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

function createState(name: string, grade: number, tags: string[]): State {
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
  console.log('🚀 Adding missing character archetype perks, stances, and states...\n');
  
  // Load existing data
  console.log('📖 Loading existing data...');
  const existingPerks: Perk[] = JSON.parse(fs.readFileSync(PERKS_PATH, 'utf-8'));
  const existingStances: Stance[] = JSON.parse(fs.readFileSync(STANCES_PATH, 'utf-8'));
  const existingStates: State[] = JSON.parse(fs.readFileSync(STATES_PATH, 'utf-8'));
  console.log(`   ✅ Existing perks: ${existingPerks.length}, stances: ${existingStances.length}, states: ${existingStates.length}\n`);
  
  // Create lookup sets
  const existingPerkKeys = new Set(existingPerks.map(p => normalizeRefKey(p.name, p.grade)));
  const existingStanceKeys = new Set(existingStances.map(s => normalizeRefKey(s.name, s.grade)));
  const existingStateKeys = new Set(existingStates.map(s => normalizeRefKey(s.name, s.grade)));
  
  // Add character archetype perks
  console.log('🆕 Creating character archetype perks...');
  const newPerks: Perk[] = [];
  
  for (const perkSpec of MISSING_CHARACTER_PERKS) {
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
  
  // Add missing stances
  console.log('🆕 Creating missing stances...');
  const newStances: Stance[] = [];
  
  for (const stanceSpec of MISSING_STANCES) {
    const key = normalizeRefKey(stanceSpec.name, stanceSpec.grade);
    if (!existingStanceKeys.has(key)) {
      const newStance = createStance(stanceSpec.name, stanceSpec.grade, stanceSpec.tags);
      newStances.push(newStance);
      existingStanceKeys.add(key);
      console.log(`   ✅ Created: "${stanceSpec.name}" (grade: ${stanceSpec.grade})`);
    } else {
      console.log(`   ⏭️  Skipped (exists): "${stanceSpec.name}" (grade: ${stanceSpec.grade})`);
    }
  }
  
  console.log(`\n   📊 Total new stances to add: ${newStances.length}\n`);
  
  // Add missing states
  console.log('🆕 Creating missing states...');
  const newStates: State[] = [];
  
  for (const stateSpec of MISSING_STATES) {
    const key = normalizeRefKey(stateSpec.name, stateSpec.grade);
    if (!existingStateKeys.has(key)) {
      const newState = createState(stateSpec.name, stateSpec.grade, stateSpec.tags);
      newStates.push(newState);
      existingStateKeys.add(key);
      console.log(`   ✅ Created: "${stateSpec.name}" (grade: ${stateSpec.grade})`);
    } else {
      console.log(`   ⏭️  Skipped (exists): "${stateSpec.name}" (grade: ${stateSpec.grade})`);
    }
  }
  
  console.log(`\n   📊 Total new states to add: ${newStates.length}\n`);
  
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
  
  if (newStances.length > 0) {
    console.log('💾 Writing updated stances.json...');
    const updatedStances = [...existingStances, ...newStances].sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      return nameCompare !== 0 ? nameCompare : a.grade - b.grade;
    });
    fs.writeFileSync(STANCES_PATH, JSON.stringify(updatedStances, null, 2), 'utf-8');
    console.log(`   ✅ Updated stances.json (${existingStances.length} → ${updatedStances.length} stances)\n`);
  } else {
    console.log('⏭️  No new stances to add\n');
  }
  
  if (newStates.length > 0) {
    console.log('💾 Writing updated states.json...');
    const updatedStates = [...existingStates, ...newStates].sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      return nameCompare !== 0 ? nameCompare : a.grade - b.grade;
    });
    fs.writeFileSync(STATES_PATH, JSON.stringify(updatedStates, null, 2), 'utf-8');
    console.log(`   ✅ Updated states.json (${existingStates.length} → ${updatedStates.length} states)\n`);
  } else {
    console.log('⏭️  No new states to add\n');
  }
  
  console.log('🎉 Done! All missing character archetypes, stances, and states added.');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
