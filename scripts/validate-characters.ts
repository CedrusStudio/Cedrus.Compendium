import * as fs from 'fs';
import * as path from 'path';
import { Character } from './parsers/characterTransformer';

const CHARACTERS_FILE = path.join(process.cwd(), 'formatted-data', 'characters.json');

interface ValidationError {
  characterId: string;
  characterName: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationReport {
  valid: boolean;
  totalCharacters: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  stats: {
    averageHealth: number;
    averageDamage: number;
    averageDefense: number;
    charactersByTag: Record<string, number>;
  };
}

function validateCharacter(character: Character): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!character.id || character.id.trim().length === 0) {
    errors.push({
      characterId: character.id,
      characterName: character.name,
      field: 'id',
      message: 'ID is required',
      severity: 'error'
    });
  }

  if (!character.name || character.name.trim().length === 0) {
    errors.push({
      characterId: character.id,
      characterName: character.name,
      field: 'name',
      message: 'Name is required',
      severity: 'error'
    });
  }

  // Health validation
  if (character.health.vitality <= 0) {
    errors.push({
      characterId: character.id,
      characterName: character.name,
      field: 'health.vitality',
      message: `Vitality is ${character.health.vitality}, should be > 0`,
      severity: 'warning'
    });
  }

  if (character.health.toughness < 0) {
    errors.push({
      characterId: character.id,
      characterName: character.name,
      field: 'health.toughness',
      message: `Toughness is ${character.health.toughness}, should be >= 0`,
      severity: 'warning'
    });
  }

  // Characteristics validation
  const characteristics = character.characteristics;
  if (characteristics.strength.base === 0 && characteristics.dexterity.base === 0 && characteristics.constitution.base === 0) {
    errors.push({
      characterId: character.id,
      characterName: character.name,
      field: 'characteristics',
      message: 'All characteristics are 0',
      severity: 'warning'
    });
  }

  // Offense validation
  if (character.offenses.leading.dice.amount === 0 && character.offenses.leading.dice.bonus === 0) {
    errors.push({
      characterId: character.id,
      characterName: character.name,
      field: 'offenses',
      message: 'No damage dice configured',
      severity: 'warning'
    });
  }

  // Defense validation
  const defenses = character.defenses;
  if (defenses.parry === 0 && defenses.dodge === 0 && defenses.protection === 0) {
    errors.push({
      characterId: character.id,
      characterName: character.name,
      field: 'defenses',
      message: 'No defenses configured',
      severity: 'warning'
    });
  }

  return errors;
}

function calculateStats(characters: Character[]) {
  const totalHealth = characters.reduce((sum, c) => sum + c.health.vitality, 0);
  const totalDamage = characters.reduce((sum, c) => {
    const dice = c.offenses.leading.dice;
    return sum + (dice.amount * dice.grade + dice.bonus);
  }, 0);
  const totalDefense = characters.reduce((sum, c) => {
    return sum + (c.defenses.parry + c.defenses.dodge + c.defenses.protection);
  }, 0);

  const charactersByTag: Record<string, number> = {};
  characters.forEach(c => {
    c.tags.forEach(tag => {
      charactersByTag[tag.name] = (charactersByTag[tag.name] || 0) + 1;
    });
  });

  return {
    averageHealth: totalHealth / characters.length,
    averageDamage: totalDamage / characters.length,
    averageDefense: totalDefense / characters.length,
    charactersByTag
  };
}

async function main() {
  console.log('🔍 Starting validation of characters.json...\n');

  if (!fs.existsSync(CHARACTERS_FILE)) {
    console.error(`❌ Characters file not found: ${CHARACTERS_FILE}`);
    process.exit(1);
  }

  // Read characters
  console.log('📖 Reading characters.json...');
  const charactersData = fs.readFileSync(CHARACTERS_FILE, 'utf-8');
  const characters: Character[] = JSON.parse(charactersData);
  
  console.log(`   ✅ Loaded ${characters.length} characters\n`);

  // Validate each character
  console.log('🔍 Validating characters...');
  const allErrors: ValidationError[] = [];
  
  characters.forEach((character, index) => {
    const errors = validateCharacter(character);
    allErrors.push(...errors);
    
    if ((index + 1) % 50 === 0) {
      console.log(`   Validated ${index + 1}/${characters.length}...`);
    }
  });

  const errors = allErrors.filter(e => e.severity === 'error');
  const warnings = allErrors.filter(e => e.severity === 'warning');

  console.log(`   ✅ Validation complete\n`);

  // Generate report
  const stats = calculateStats(characters);
  
  const report: ValidationReport = {
    valid: errors.length === 0,
    totalCharacters: characters.length,
    errors,
    warnings,
    stats
  };

  // Print report
  console.log('📊 Validation Report:');
  console.log('='.repeat(60));
  
  if (report.valid) {
    console.log('✅ All characters are valid!\n');
  } else {
    console.log(`❌ Found ${errors.length} errors\n`);
  }

  if (warnings.length > 0) {
    console.log(`⚠️  Found ${warnings.length} warnings\n`);
  }

  // Print errors
  if (errors.length > 0) {
    console.log('❌ Errors:');
    errors.slice(0, 10).forEach(error => {
      console.log(`   - ${error.characterName} (${error.field}): ${error.message}`);
    });
    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
    console.log('');
  }

  // Print warnings
  if (warnings.length > 0) {
    console.log('⚠️  Warnings:');
    warnings.slice(0, 10).forEach(warning => {
      console.log(`   - ${warning.characterName} (${warning.field}): ${warning.message}`);
    });
    if (warnings.length > 10) {
      console.log(`   ... and ${warnings.length - 10} more warnings`);
    }
    console.log('');
  }

  // Print statistics
  console.log('📈 Statistics:');
  console.log(`   Average Health: ${stats.averageHealth.toFixed(1)}`);
  console.log(`   Average Damage: ${stats.averageDamage.toFixed(1)}`);
  console.log(`   Average Defense: ${stats.averageDefense.toFixed(1)}`);
  console.log('\n   Characters by tag:');
  Object.entries(stats.charactersByTag)
    .sort((a, b) => b[1] - a[1])
    .forEach(([tag, count]) => {
      console.log(`      ${tag}: ${count}`);
    });

  console.log('\n' + '='.repeat(60));
  
  if (report.valid) {
    console.log('✅ Validation passed!');
  } else {
    console.log('❌ Validation failed!');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
