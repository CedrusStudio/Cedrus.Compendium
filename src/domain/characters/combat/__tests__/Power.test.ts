import { describe, it, expect } from 'vitest';
import {
  pathToPowerField,
  pathToSpell,
  pathToSpellField,
  CreateDefaultSpell,
  CreateDefaultPowerOffense,
  CreateDefaultPowerSpecification,
  CreateDefaultPower,
  powerFieldOrder,
  type Power
} from '@/domain/characters/combat/Power';

describe('Power', () => {
  describe('pathToPowerField', () => {
    it('should generate correct path for power field', () => {
      const path = pathToPowerField(0, 'name');
      expect(path).toBe('powers.0.name');
    });

    it('should generate correct path for different index and field', () => {
      const path = pathToPowerField(3, 'level');
      expect(path).toBe('powers.3.level');
    });

    it('should generate correct path for essence field', () => {
      const path = pathToPowerField(1, 'essence');
      expect(path).toBe('powers.1.essence');
    });
  });

  describe('pathToSpell', () => {
    it('should generate correct path for spell', () => {
      const path = pathToSpell(0, 0);
      expect(path).toBe('powers.0.spells.0');
    });

    it('should generate correct path for different indices', () => {
      const path = pathToSpell(2, 5);
      expect(path).toBe('powers.2.spells.5');
    });
  });

  describe('pathToSpellField', () => {
    it('should generate correct path for spell field', () => {
      const path = pathToSpellField(0, 0, 'name');
      expect(path).toBe('powers.0.spells.0.name');
    });

    it('should generate correct path for different indices and field', () => {
      const path = pathToSpellField(1, 3, 'cost');
      expect(path).toBe('powers.1.spells.3.cost');
    });

    it('should generate correct path for grade field', () => {
      const path = pathToSpellField(2, 1, 'grade');
      expect(path).toBe('powers.2.spells.1.grade');
    });
  });

  describe('CreateDefaultSpell', () => {
    it('should create spell with default values', () => {
      const spell = CreateDefaultSpell();

      expect(spell.id).toBeTruthy();
      expect(spell.id).toMatch(/^[0-9A-Z]{26}$/); // ULID format
      expect(spell.name).toBe('Nowe Zaklęcie');
      expect(spell.description).toBe('Nowy opis zaklęcia.');
      expect(spell.grade).toBe(1);
      expect(spell.castTime).toBe('Standardowa');
      expect(spell.cost).toBe(20);
      expect(spell.price).toBe(9);
      expect(spell.cooldown).toBe(1);
      expect(spell.requirements).toEqual([]);
      expect(spell.tags).toEqual([]);
    });
  });

  describe('CreateDefaultPowerOffense', () => {
    it('should create power offense with default values', () => {
      const powerOffense = CreateDefaultPowerOffense();

      expect(powerOffense.spellOffense).toBeDefined();
      expect(powerOffense.spellOffense.amount).toBeDefined();
      expect(powerOffense.spellOffense.grade).toBeDefined();
      expect(powerOffense.spellOffense.bonus).toBeDefined();
      expect(powerOffense.spellDamage).toBeDefined();
      expect(powerOffense.spellDamage.amount).toBe(0);
      expect(powerOffense.spellDamage.grade).toBe(1);
      expect(powerOffense.spellDamage.bonus).toBe(1);
      expect(powerOffense.description).toBe('Nowy opis ofensywy mocy.');
      expect(powerOffense.cost).toBe(20);
    });
  });

  describe('CreateDefaultPowerSpecification', () => {
    it('should create power specification with default values', () => {
      const spec = CreateDefaultPowerSpecification();

      expect(spec.id).toBeTruthy();
      expect(spec.id).toMatch(/^[0-9A-Z]{26}$/); // ULID format
      expect(spec.name).toBe('Specyfikacja Mocy');
      expect(spec.description).toBe('');
      expect(spec.tags).toEqual([]);
      expect(spec.offenses).toEqual([]);
    });
  });

  describe('CreateDefaultPower', () => {
    it('should create power with default values', () => {
      const power = CreateDefaultPower();

      expect(power.id).toBeTruthy();
      expect(power.id).toMatch(/^[0-9A-Z]{26}$/); // ULID format
      expect(power.name).toBe('Kinetyka');
      expect(power.essence).toBe(1);
      expect(power.type).toBe('moc');
      expect(power.level).toBe(1);
      expect(power.bonus).toBe(0);
      expect(power.powerSpecificationId).toBe('');
      expect(power.spells).toEqual([]);
    });
  });

  describe('powerFieldOrder', () => {
    it('should order fields according to powerFieldOrderArray', () => {
      const fields: (keyof Power)[] = ['name', 'level', 'type'];
      const sorted = fields.sort(powerFieldOrder);

      // 'name' should come before 'type', which should come before 'level'
      expect(sorted[0]).toBe('name');
      expect(sorted[1]).toBe('type');
      expect(sorted[2]).toBe('level');
    });

    it('should place known fields before unknown fields', () => {
      const result = powerFieldOrder('name', 'unknownField' as keyof Power);
      expect(result).toBeLessThan(0); // 'name' should come before unknown field
    });

    it('should place unknown field after known field', () => {
      const result = powerFieldOrder('unknownField' as keyof Power, 'name');
      expect(result).toBeGreaterThan(0); // unknown field should come after 'name'
    });

    it('should sort unknown fields alphabetically', () => {
      const result = powerFieldOrder('zField' as keyof Power, 'aField' as keyof Power);
      expect(result).toBeGreaterThan(0); // 'zField' should come after 'aField'
    });

    it('should maintain order of fields in array', () => {
      const result1 = powerFieldOrder('name', 'type');
      const result2 = powerFieldOrder('type', 'level');
      
      expect(result1).toBeLessThan(0); // name before type
      expect(result2).toBeLessThan(0); // type before level
    });
  });
});
