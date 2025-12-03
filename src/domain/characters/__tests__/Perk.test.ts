import { describe, it, expect } from 'vitest';
import { pathToPerkField, pathToPerk, CreateDefaultPerk } from '../Perk';

describe('Perk', () => {
  describe('pathToPerkField', () => {
    it('should generate correct path for perk field', () => {
      const path = pathToPerkField(0, 'name');
      expect(path).toBe('perks.0.name');
    });

    it('should generate correct path for different index and field', () => {
      const path = pathToPerkField(3, 'grade');
      expect(path).toBe('perks.3.grade');
    });
  });

  describe('pathToPerk', () => {
    it('should generate correct path for perk', () => {
      const path = pathToPerk(0);
      expect(path).toBe('perks.0');
    });

    it('should generate correct path for different index', () => {
      const path = pathToPerk(5);
      expect(path).toBe('perks.5');
    });
  });

  describe('CreateDefaultPerk', () => {
    it('should create perk with default values', () => {
      const perk = CreateDefaultPerk();
      
      expect(perk.id).toBeTruthy();
      expect(perk.id).toMatch(/^[0-9A-Z]{26}$/); // ULID format
      expect(perk.name).toBe('Perk');
      expect(perk.description).toBe('Opis perku');
      expect(perk.grade).toBe(1);
      expect(perk.price).toBe(1);
      expect(perk.requirements).toEqual([]);
      expect(perk.tags).toEqual([]);
    });
  });
});
