import { describe, it, expect } from 'vitest';
import { toEntity } from '@/persistence/mappings/entityMapping';

describe('entityMapping', () => {
  describe('toEntity', () => {
    it('should map persistence model to entity', () => {
      const persistenceModel = {
        id: '01HXYZ12345678901234567890',
        name: 'Test Entity'
      };

      const result = toEntity(persistenceModel);

      expect(result).toEqual({
        id: '01HXYZ12345678901234567890',
        name: 'Test Entity'
      });
    });

    it('should preserve id and name only', () => {
      const persistenceModel = {
        id: '01HXYZ12345678901234567890',
        name: 'Test Entity',
        // @ts-expect-error - Testing with extra fields
        extraField: 'should be ignored',
        // @ts-expect-error
        anotherField: 123
      };

      const result = toEntity(persistenceModel);

      expect(result).toEqual({
        id: '01HXYZ12345678901234567890',
        name: 'Test Entity'
      });
      expect(result).not.toHaveProperty('extraField');
      expect(result).not.toHaveProperty('anotherField');
    });

    it('should handle different entity names', () => {
      const characterModel = {
        id: '01CHAR12345678901234567890',
        name: 'Hero'
      };

      const weaponModel = {
        id: '01WEAP12345678901234567890',
        name: 'Sword'
      };

      const character = toEntity(characterModel);
      const weapon = toEntity(weaponModel);

      expect(character.id).toBe('01CHAR12345678901234567890');
      expect(character.name).toBe('Hero');
      expect(weapon.id).toBe('01WEAP12345678901234567890');
      expect(weapon.name).toBe('Sword');
    });

    it('should handle Unicode characters in name', () => {
      const persistenceModel = {
        id: '01HXYZ12345678901234567890',
        name: 'Ząbkowata Włócznia ćęłńóśźż'
      };

      const result = toEntity(persistenceModel);

      expect(result.name).toBe('Ząbkowata Włócznia ćęłńóśźż');
    });
  });
});
