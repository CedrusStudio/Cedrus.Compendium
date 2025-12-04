import { describe, it, expect } from 'vitest';
import {
  CreateDefaultStance,
  CreateDefaultState,
  pathToModeField,
  pathToMode
} from '../Mode';

describe('Mode', () => {
  describe('CreateDefaultStance', () => {
    it('should create stance with default values', () => {
      const stance = CreateDefaultStance();

      expect(stance.id).toBeTruthy();
      expect(stance.id).toMatch(/^[0-9A-Z]{26}$/); // ULID format
      expect(stance.name).toBe('Postawa');
      expect(stance.description).toBe('Opis postawy');
      expect(stance.grade).toBe(1);
      expect(stance.requirements).toEqual([]);
      expect(stance.price).toBe(0);
      expect(stance.tags).toEqual([]);
    });
  });

  describe('CreateDefaultState', () => {
    it('should create state with default values', () => {
      const state = CreateDefaultState();

      expect(state.id).toBeTruthy();
      expect(state.id).toMatch(/^[0-9A-Z]{26}$/); // ULID format
      expect(state.name).toBe('Stan');
      expect(state.description).toBe('Opis stanu');
      expect(state.grade).toBe(1);
      expect(state.requirements).toEqual([]);
      expect(state.price).toBe(0);
      expect(state.tags).toEqual([]);
    });
  });

  describe('pathToModeField', () => {
    it('should generate correct path for stance field', () => {
      const path = pathToModeField(0, 'stances', 'name');
      expect(path).toBe('stances.0.name');
    });

    it('should generate correct path for state field', () => {
      const path = pathToModeField(2, 'states', 'description');
      expect(path).toBe('states.2.description');
    });

    it('should generate correct path for different stance index and field', () => {
      const path = pathToModeField(5, 'stances', 'grade');
      expect(path).toBe('stances.5.grade');
    });

    it('should generate correct path for different state index and field', () => {
      const path = pathToModeField(3, 'states', 'price');
      expect(path).toBe('states.3.price');
    });

    it('should generate correct path for requirements field', () => {
      const path = pathToModeField(1, 'stances', 'requirements');
      expect(path).toBe('stances.1.requirements');
    });
  });

  describe('pathToMode', () => {
    it('should generate correct path for stance', () => {
      const path = pathToMode(0, 'stances');
      expect(path).toBe('stances.0');
    });

    it('should generate correct path for state', () => {
      const path = pathToMode(1, 'states');
      expect(path).toBe('states.1');
    });

    it('should generate correct path for different stance index', () => {
      const path = pathToMode(10, 'stances');
      expect(path).toBe('stances.10');
    });

    it('should generate correct path for different state index', () => {
      const path = pathToMode(7, 'states');
      expect(path).toBe('states.7');
    });
  });
});
