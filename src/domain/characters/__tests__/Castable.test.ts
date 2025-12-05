import { describe, it, expect } from 'vitest';
import { canUseCastable, type Castable, type EndTurn } from '@/domain/characters/Castable';

describe('Castable - Action Economy System', () => {
  // Test helpers
  const createCastable = (
    name: string,
    castTime: Castable['castTime'],
    cooldown?: number
  ): Castable => ({
    id: name,
    name,
    castTime,
    cooldown,
  });

  const full = createCastable('Full Action', 'Pełnorundowa');
  const standard = createCastable('Standard Action', 'Standardowa');
  const immediate = createCastable('Immediate Action', 'Natychmiastowa');
  const overimmediate = createCastable('Overimmediate Action', 'Nadnatychmiastowa');
  const cooldownSpell = createCastable('Cooldown Spell', 'Standardowa', 2);

  describe('Empty history (first action)', () => {
    it('should allow any action when history is empty', () => {
      expect(canUseCastable(full, [])).toBe(true);
      expect(canUseCastable(standard, [])).toBe(true);
      expect(canUseCastable(immediate, [])).toBe(true);
      expect(canUseCastable(overimmediate, [])).toBe(true);
    });
  });

  describe('Duplicate casting prevention', () => {
    it('should prevent casting same spell twice in one turn', () => {
      expect(canUseCastable(standard, [standard])).toBe(false);
      expect(canUseCastable(immediate, [immediate])).toBe(false);
    });

    it('should block spell with undefined cooldown even after turn ends', () => {
      // Spells without explicit cooldown are blocked after first use
      expect(canUseCastable(standard, [standard, 'end'])).toBe(false);
      expect(canUseCastable(immediate, [immediate, 'end'])).toBe(false);
    });

    it('should prevent duplicate even with other spells in between', () => {
      expect(canUseCastable(standard, [standard, immediate])).toBe(false);
      expect(canUseCastable(immediate, [immediate, overimmediate])).toBe(false);
    });

    it('should block spell with cooldown=0 after first use (cooldown=0 treated as falsy)', () => {
      // Note: This is a quirk where cooldown=0 is treated the same as undefined
      const reusableSpell = createCastable('Reusable', 'Standardowa', 0);
      expect(canUseCastable(reusableSpell, [reusableSpell, 'end'])).toBe(false);
    });
  });

  describe('Cooldown mechanics', () => {
    it('should block spell with undefined cooldown after first use', () => {
      const noCooldownSpell = createCastable('No Cooldown', 'Standardowa');
      expect(canUseCastable(noCooldownSpell, [noCooldownSpell, 'end'])).toBe(false);
    });

    it('should allow spell with cooldown=2 after 2 end markers', () => {
      // cooldown=2 means available when turnCountSinceLastUse >= 2
      expect(canUseCastable(cooldownSpell, [cooldownSpell, 'end'])).toBe(false); // 1 turn
      expect(canUseCastable(cooldownSpell, [cooldownSpell, 'end', 'end'])).toBe(true); // 2 turns
    });

    it('should block spell with cooldown=0 (treated as falsy)', () => {
      // Note: cooldown=0 is treated the same as undefined due to !cooldown check
      const instantCooldown = createCastable('Instant Cooldown', 'Standardowa', 0);
      expect(canUseCastable(instantCooldown, [instantCooldown, 'end'])).toBe(false);
    });

    it('should allow spell with cooldown=1 after one turn', () => {
      const quickCooldown = createCastable('Quick Cooldown', 'Standardowa', 1);
      expect(canUseCastable(quickCooldown, [quickCooldown, 'end'])).toBe(true);
    });

    it('should track cooldown across multiple turns with other actions', () => {
      const history: (Castable | EndTurn)[] = [
        cooldownSpell,
        immediate,
        'end', // 1 turn
        standard,
        'end', // 2 turns - should be available now
      ];
      expect(canUseCastable(cooldownSpell, history)).toBe(true);
    });
  });

  describe('Full Action (Pełnorundowa) combinations', () => {
    it('should allow 1 Full + 1 Overimmediate', () => {
      expect(canUseCastable(overimmediate, [full])).toBe(true);
    });

    it('should block 2 Full actions', () => {
      const full2 = createCastable('Full Action 2', 'Pełnorundowa');
      expect(canUseCastable(full2, [full])).toBe(false);
    });

    it('should block Full + Standard', () => {
      expect(canUseCastable(standard, [full])).toBe(false);
      expect(canUseCastable(full, [standard])).toBe(false);
    });

    it('should block Full + Immediate', () => {
      expect(canUseCastable(immediate, [full])).toBe(false);
    });

    it('should block Full + 2 Overimmediate', () => {
      const over2 = createCastable('Over 2', 'Nadnatychmiastowa');
      expect(canUseCastable(over2, [full, overimmediate])).toBe(false);
    });
  });

  describe('Standard Action (Standardowa) combinations', () => {
    it('should allow Standard + Immediate + Overimmediate', () => {
      expect(canUseCastable(immediate, [standard])).toBe(true);
      expect(canUseCastable(overimmediate, [standard, immediate])).toBe(true);
    });

    it('should allow Standard + 2 Overimmediate', () => {
      const over2 = createCastable('Over 2', 'Nadnatychmiastowa');
      expect(canUseCastable(overimmediate, [standard])).toBe(true);
      expect(canUseCastable(over2, [standard, overimmediate])).toBe(true);
    });

    it('should block 2 Standard actions', () => {
      const standard2 = createCastable('Standard 2', 'Standardowa');
      expect(canUseCastable(standard2, [standard])).toBe(false);
    });

    it('should block Standard + 2 Immediate', () => {
      const imm2 = createCastable('Immediate 2', 'Natychmiastowa');
      expect(canUseCastable(imm2, [standard, immediate])).toBe(false);
    });

    it('should block Standard + Immediate + 2 Overimmediate', () => {
      const over2 = createCastable('Over 2', 'Nadnatychmiastowa');
      expect(canUseCastable(over2, [standard, immediate, overimmediate])).toBe(false);
    });
  });

  describe('Immediate Action (Natychmiastowa) combinations', () => {
    it('should allow 2 Immediate + 1 Overimmediate', () => {
      const imm2 = createCastable('Immediate 2', 'Natychmiastowa');
      expect(canUseCastable(imm2, [immediate])).toBe(true);
      expect(canUseCastable(overimmediate, [immediate, imm2])).toBe(true);
    });

    it('should block 3 Immediate actions', () => {
      const imm2 = createCastable('Immediate 2', 'Natychmiastowa');
      const imm3 = createCastable('Immediate 3', 'Natychmiastowa');
      expect(canUseCastable(imm3, [immediate, imm2])).toBe(false);
    });

    it('should block 2 Immediate + 2 Overimmediate', () => {
      const imm2 = createCastable('Immediate 2', 'Natychmiastowa');
      const over2 = createCastable('Over 2', 'Nadnatychmiastowa');
      expect(canUseCastable(over2, [immediate, imm2, overimmediate])).toBe(false);
    });
  });

  describe('Overimmediate Action (Nadnatychmiastowa) combinations', () => {
    it('should allow 3 Overimmediate actions', () => {
      const over2 = createCastable('Over 2', 'Nadnatychmiastowa');
      const over3 = createCastable('Over 3', 'Nadnatychmiastowa');
      expect(canUseCastable(over2, [overimmediate])).toBe(true);
      expect(canUseCastable(over3, [overimmediate, over2])).toBe(true);
    });

    it('should block 4 Overimmediate actions', () => {
      const over2 = createCastable('Over 2', 'Nadnatychmiastowa');
      const over3 = createCastable('Over 3', 'Nadnatychmiastowa');
      const over4 = createCastable('Over 4', 'Nadnatychmiastowa');
      expect(canUseCastable(over4, [overimmediate, over2, over3])).toBe(false);
    });
  });

  describe('Turn transitions', () => {
    it('should not reset action economy for spells without cooldown after "end"', () => {
      // Spells with undefined cooldown stay blocked after first use
      expect(canUseCastable(full, [full, overimmediate, 'end'])).toBe(false);
      expect(canUseCastable(standard, [standard, immediate, 'end'])).toBe(false);
    });

    it('should allow different spells after turn transition', () => {
      const history: (Castable | EndTurn)[] = [
        standard,
        immediate,
        'end',
        full,
        'end',
      ];
      const standard2 = createCastable('Standard 2', 'Standardowa', 0);
      expect(canUseCastable(standard2, history)).toBe(true);
    });

    it('should not allow same spell after turn if cooldown undefined', () => {
      expect(canUseCastable(standard, [standard, 'end', immediate])).toBe(false);
    });

    it('should allow reusable spell with cooldown=1 after one turn', () => {
      const reusable = createCastable('Reusable', 'Standardowa', 1);
      expect(canUseCastable(reusable, [reusable, 'end'])).toBe(true);
    });
  });

  describe('Complex scenarios', () => {
    it('should handle mixed turn history with cooldowns', () => {
      const history: (Castable | EndTurn)[] = [
        cooldownSpell,
        immediate,
        'end', // 1 turn
        standard,
        immediate,
        'end', // 2 turns - cooldownSpell available
        full,
        'end', // 3 turns
      ];
      expect(canUseCastable(cooldownSpell, history)).toBe(true);
      // standard has no cooldown, so blocked after first use
      const standard2 = createCastable('Standard 2', 'Standardowa', 1);
      expect(canUseCastable(standard2, history)).toBe(true);
    });

    it('should validate complex action sequences', () => {
      const over2 = createCastable('Over 2', 'Nadnatychmiastowa', 1);
      const history: (Castable | EndTurn)[] = [
        overimmediate,
        over2,
      ];
      // After 2 overimmediate, can only add 1 more overimmediate (max 3 total)
      const imm = createCastable('Imm', 'Natychmiastowa', 1);
      expect(canUseCastable(imm, history)).toBe(false); // 2 over + 1 imm doesn't fit any profile
      
      const over3 = createCastable('Over 3', 'Nadnatychmiastowa', 1);
      expect(canUseCastable(over3, history)).toBe(true); // 3 overimmediate is allowed
      
      const std = createCastable('Std', 'Standardowa', 1);
      expect(canUseCastable(std, history)).toBe(true); // standard + 2 overimmediate is allowed
    });

    it('should handle edge case: new spell at turn boundary', () => {
      const history: (Castable | EndTurn)[] = [standard, 'end'];
      const standard2 = createCastable('Standard 2', 'Standardowa', 1);
      expect(canUseCastable(standard2, history)).toBe(true);
      const full2 = createCastable('Full 2', 'Pełnorundowa', 1);
      expect(canUseCastable(full2, history)).toBe(true);
    });
  });
});
