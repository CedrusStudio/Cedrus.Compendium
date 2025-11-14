import fs from 'fs';
import path from 'path';
import { createLookupMap, resolveReferences, createMissingReport, type ItemWithId, type Reference } from './utils/referenceResolver';

// Paths
const FORMATTED_DATA_DIR = path.join(__dirname, '..', 'formatted-data');
const CHARACTERS_PATH = path.join(FORMATTED_DATA_DIR, 'characters.json');
const MANEUVERS_PATH = path.join(FORMATTED_DATA_DIR, 'maneuvers.json');
const PERKS_PATH = path.join(FORMATTED_DATA_DIR, 'perks.json');
const STANCES_PATH = path.join(FORMATTED_DATA_DIR, 'stances.json');
const STATES_PATH = path.join(FORMATTED_DATA_DIR, 'states.json');

type Character = {
  id: string;
  name: string;
  maneuvers: Reference[];
  perks: Reference[];
  stances: Reference[];
  states: Reference[];
  [key: string]: unknown; // Other properties
};

type CharacterWithIds = Character & {
  maneuversIds: string[];
  perksIds: string[];
  stancesIds: string[];
  statesIds: string[];
};

async function main() {
  console.log('🚀 Starting ID resolution for character references...\n');

  // Step 1: Load all data
  console.log('📖 Loading data files...');
  const characters: Character[] = JSON.parse(fs.readFileSync(CHARACTERS_PATH, 'utf-8'));
  const maneuvers: ItemWithId[] = JSON.parse(fs.readFileSync(MANEUVERS_PATH, 'utf-8'));
  const perks: ItemWithId[] = JSON.parse(fs.readFileSync(PERKS_PATH, 'utf-8'));
  const stances: ItemWithId[] = JSON.parse(fs.readFileSync(STANCES_PATH, 'utf-8'));
  const states: ItemWithId[] = JSON.parse(fs.readFileSync(STATES_PATH, 'utf-8'));

  console.log(`   ✅ Characters: ${characters.length}`);
  console.log(`   ✅ Maneuvers: ${maneuvers.length}`);
  console.log(`   ✅ Perks: ${perks.length}`);
  console.log(`   ✅ Stances: ${stances.length}`);
  console.log(`   ✅ States: ${states.length}\n`);

  // Step 2: Create lookup maps
  console.log('🗺️  Creating lookup maps...');
  const maneuversMap = createLookupMap(maneuvers);
  const perksMap = createLookupMap(perks);
  const stancesMap = createLookupMap(stances);
  const statesMap = createLookupMap(states);
  console.log('   ✅ All lookup maps created\n');

  // Step 3: Process characters
  console.log('🔄 Resolving references to IDs...');
  const updatedCharacters: CharacterWithIds[] = [];
  const missingReports: string[] = [];
  
  const totalMissing = {
    maneuvers: 0,
    perks: 0,
    stances: 0,
    states: 0
  };

  for (const character of characters) {
    // Resolve maneuvers
    const maneuversResult = resolveReferences(character.maneuvers || [], maneuversMap);
    if (maneuversResult.missing.length > 0) {
      totalMissing.maneuvers += maneuversResult.missing.length;
      missingReports.push(createMissingReport(character.name, 'Maneuvers', maneuversResult.missing));
    }

    // Resolve perks
    const perksResult = resolveReferences(character.perks || [], perksMap);
    if (perksResult.missing.length > 0) {
      totalMissing.perks += perksResult.missing.length;
      missingReports.push(createMissingReport(character.name, 'Perks', perksResult.missing));
    }

    // Resolve stances
    const stancesResult = resolveReferences(character.stances || [], stancesMap);
    if (stancesResult.missing.length > 0) {
      totalMissing.stances += stancesResult.missing.length;
      missingReports.push(createMissingReport(character.name, 'Stances', stancesResult.missing));
    }

    // Resolve states
    const statesResult = resolveReferences(character.states || [], statesMap);
    if (statesResult.missing.length > 0) {
      totalMissing.states += statesResult.missing.length;
      missingReports.push(createMissingReport(character.name, 'States', statesResult.missing));
    }

    // Create updated character with IDs
    updatedCharacters.push({
      ...character,
      maneuversIds: maneuversResult.ids,
      perksIds: perksResult.ids,
      stancesIds: stancesResult.ids,
      statesIds: statesResult.ids
    });
  }

  console.log('   ✅ All characters processed\n');

  // Step 4: Report missing references
  if (missingReports.length > 0) {
    console.log('⚠️  MISSING REFERENCES REPORT:\n');
    console.log(missingReports.join('\n\n'));
    console.log('\n📊 Summary of missing references:');
    console.log(`   - Maneuvers: ${totalMissing.maneuvers}`);
    console.log(`   - Perks: ${totalMissing.perks}`);
    console.log(`   - Stances: ${totalMissing.stances}`);
    console.log(`   - States: ${totalMissing.states}\n`);
  } else {
    console.log('✅ All references resolved successfully!\n');
  }

  // Step 5: Write updated data
  console.log('💾 Writing updated characters.json...');
  fs.writeFileSync(
    CHARACTERS_PATH,
    JSON.stringify(updatedCharacters, null, 2),
    'utf-8'
  );
  
  const fileStats = fs.statSync(CHARACTERS_PATH);
  const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
  console.log(`   ✅ Written to: ${CHARACTERS_PATH}`);
  console.log(`   File size: ${fileSizeMB} MB\n`);

  // Step 6: Statistics
  const totalRefsResolved = updatedCharacters.reduce((sum, char) => 
    sum + char.maneuversIds.length + char.perksIds.length + char.stancesIds.length + char.statesIds.length
  , 0);

  console.log('📈 Resolution Statistics:');
  console.log(`   Total characters: ${updatedCharacters.length}`);
  console.log(`   Total IDs resolved: ${totalRefsResolved}`);
  console.log(`   Success rate: ${((totalRefsResolved / (totalRefsResolved + totalMissing.maneuvers + totalMissing.perks + totalMissing.stances + totalMissing.states)) * 100).toFixed(2)}%\n`);

  console.log('🎉 ID resolution complete!');
}

main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
