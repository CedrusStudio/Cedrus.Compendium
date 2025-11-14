import fs from 'fs';
import { execSync } from 'child_process';

type State = {
  id: string;
  name: string;
  grade: number;
  description: string;
  requirements: string[];
  price: number;
  tags: string[];
};

// Get original states from main branch
const mainStates: State[] = JSON.parse(
  execSync('git show main:formatted-data/states.json', { encoding: 'utf-8' })
);

// Get current states
const currentStates: State[] = JSON.parse(
  fs.readFileSync('formatted-data/states.json', 'utf-8')
);

console.log(`Main branch: ${mainStates.length} states`);
console.log(`Current: ${currentStates.length} states`);
console.log(`New states added: ${currentStates.length - mainStates.length}`);

// Check if any original states are missing
const mainIds = new Set(mainStates.map(s => s.id));
const currentIds = new Set(currentStates.map(s => s.id));

const missingIds = Array.from(mainIds).filter(id => !currentIds.has(id));
console.log(`\nMissing from current: ${missingIds.length}`);

// Check if any original states were modified (content-wise)
let modifiedCount = 0;
const modifications: string[] = [];

for (const mainState of mainStates) {
  const currState = currentStates.find(s => s.id === mainState.id);
  if (currState) {
    // Compare key fields
    const nameChanged = mainState.name !== currState.name;
    const gradeChanged = mainState.grade !== currState.grade;
    const descChanged = mainState.description !== currState.description;
    const priceChanged = mainState.price !== currState.price;
    
    // Compare tags arrays
    const mainTags = JSON.stringify(mainState.tags || []);
    const currTags = JSON.stringify(currState.tags || []);
    const tagsChanged = mainTags !== currTags;
    
    if (nameChanged || gradeChanged || descChanged || priceChanged || tagsChanged) {
      modifiedCount++;
      modifications.push(
        `${mainState.name} (grade ${mainState.grade}): ` +
        `${nameChanged ? 'name, ' : ''}` +
        `${gradeChanged ? 'grade, ' : ''}` +
        `${descChanged ? 'description, ' : ''}` +
        `${priceChanged ? 'price, ' : ''}` +
        `${tagsChanged ? 'tags' : ''}`
      );
    }
  }
}

console.log(`\nContent modifications: ${modifiedCount}`);
if (modifiedCount > 0) {
  console.log('\nModified items:');
  modifications.forEach(m => console.log(`  - ${m}`));
}

// List new states
const newIds = Array.from(currentIds).filter(id => !mainIds.has(id));
if (newIds.length > 0) {
  console.log(`\nNew states added (${newIds.length}):`);
  newIds.forEach(id => {
    const state = currentStates.find(s => s.id === id);
    if (state) {
      console.log(`  - ${state.name} (grade ${state.grade})`);
    }
  });
}

console.log('\n=== SUMMARY ===');
console.log(`Original states: ${mainStates.length}`);
console.log(`Current states: ${currentStates.length}`);
console.log(`Missing: ${missingIds.length}`);
console.log(`Modified (content): ${modifiedCount}`);
console.log(`New: ${newIds.length}`);

if (missingIds.length === 0 && modifiedCount === 0) {
  console.log('\n[OK] Tylko formatowanie i kolejnosc - zadne istniejace elementy nie zostaly zmodyfikowane!');
} else {
  console.log('\n[UWAGA] Istniejace stany zostaly zmodyfikowane!');
}
