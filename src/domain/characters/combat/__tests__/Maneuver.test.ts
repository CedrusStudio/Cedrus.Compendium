import { describe, it, expect } from 'vitest';
import {
  CreateDefaultManeuver,
  pathToManeuverField,
  pathToManeuvers
} from '@/domain/characters/combat/Maneuver';

describe('Maneuver', () => {
  describe('CreateDefaultManeuver', () => {
    it('should create maneuver with default values', () => {
      const maneuver = CreateDefaultManeuver();

      expect(maneuver.id).toBeTruthy();
      expect(maneuver.id).toMatch(/^[0-9A-Z]{26}$/); // ULID format
      expect(maneuver.name).toBe('Manewr');
      expect(maneuver.grade).toBe(1);
      expect(maneuver.description).toBe('Opis manewru');
      expect(maneuver.castTime).toBe('Standardowa');
      expect(maneuver.cooldown).toBe(1);
      expect(maneuver.price).toBe(1);
      expect(maneuver.tags).toEqual([]);
    });
  });

  describe('pathToManeuverField', () => {
    it('should generate correct path for maneuver field', () => {
      const path = pathToManeuverField(0, 'name');
      expect(path).toBe('maneuvers.0.name');
    });

    it('should generate correct path for different index and field', () => {
      const path = pathToManeuverField(3, 'grade');
      expect(path).toBe('maneuvers.3.grade');
    });

    it('should generate correct path for description field', () => {
      const path = pathToManeuverField(1, 'description');
      expect(path).toBe('maneuvers.1.description');
    });

    it('should generate correct path for castTime field', () => {
      const path = pathToManeuverField(2, 'castTime');
      expect(path).toBe('maneuvers.2.castTime');
    });
  });

  describe('pathToManeuvers', () => {
    it('should generate correct path for maneuver', () => {
      const path = pathToManeuvers(0);
      expect(path).toBe('maneuvers.0');
    });

    it('should generate correct path for different index', () => {
      const path = pathToManeuvers(5);
      expect(path).toBe('maneuvers.5');
    });

    it('should generate correct path for large index', () => {
      const path = pathToManeuvers(99);
      expect(path).toBe('maneuvers.99');
    });
  });
});
