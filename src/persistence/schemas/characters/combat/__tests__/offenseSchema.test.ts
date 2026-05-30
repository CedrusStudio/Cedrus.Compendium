import { describe, it, expect } from 'vitest';
import { damageOffenseSchema, weaponOffenseSchema, offenseSchema } from '@/persistence/schemas/characters/combat/offenseSchema';

describe('damageOffenseSchema', () => {
  const validDamage = {
    amount: 2,
    grade: 6,
    bonus: 5,
    isPhantom: false
  };

  it('should validate valid damage', () => {
    const result = damageOffenseSchema.safeParse(validDamage);
    expect(result.success).toBe(true);
  });

  it('should coerce fields from strings', () => {
    const result = damageOffenseSchema.safeParse({
      amount: '3',
      grade: '8',
      bonus: '10',
      isPhantom: false
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(3);
      expect(result.data.grade).toBe(8);
      expect(result.data.bonus).toBe(10);
    }
  });

  describe('amount field', () => {
    it('should accept amount of 0', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, amount: 0 });
      expect(result.success).toBe(true);
    });

    it('should reject negative amount', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, amount: -1 });
      expect(result.success).toBe(false);
    });

    it('should accept amount of 50', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, amount: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject amount greater than 50', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, amount: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('grade field', () => {
    it('should accept grade of 1', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, grade: 1 });
      expect(result.success).toBe(true);
    });

    it('should reject grade of 0', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, grade: 0 });
      expect(result.success).toBe(false);
    });

    it('should accept grade of 50', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, grade: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject grade greater than 50', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, grade: 51 });
      expect(result.success).toBe(false);
    });
  });

  describe('bonus field', () => {
    it('should accept bonus of -10', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, bonus: -10 });
      expect(result.success).toBe(true);
    });

    it('should reject bonus less than -10', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, bonus: -11 });
      expect(result.success).toBe(false);
    });

    it('should accept bonus of 50', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, bonus: 50 });
      expect(result.success).toBe(true);
    });

    it('should reject bonus greater than 50', () => {
      const result = damageOffenseSchema.safeParse({ ...validDamage, bonus: 51 });
      expect(result.success).toBe(false);
    });
  });

  it('should validate isPhantom boolean', () => {
    const resultTrue = damageOffenseSchema.safeParse({ ...validDamage, isPhantom: true });
    expect(resultTrue.success).toBe(true);
    
    const resultFalse = damageOffenseSchema.safeParse({ ...validDamage, isPhantom: false });
    expect(resultFalse.success).toBe(true);
  });
});

describe('weaponOffenseSchema', () => {
  const validWeaponOffense = {
    amount: 2,
    grade: 6,
    bonus: 5,
    isPhantom: false,
    critical: {
      power: 10,
      range: 2
    }
  };

  it('should validate valid weapon offense', () => {
    const result = weaponOffenseSchema.safeParse(validWeaponOffense);
    expect(result.success).toBe(true);
  });

  describe('critical.power field', () => {
    it('should accept power of -5', () => {
      const result = weaponOffenseSchema.safeParse({ 
        ...validWeaponOffense, 
        critical: { power: -5, range: 2 } 
      });
      expect(result.success).toBe(true);
    });

    it('should reject power less than -5', () => {
      const result = weaponOffenseSchema.safeParse({ 
        ...validWeaponOffense, 
        critical: { power: -6, range: 2 } 
      });
      expect(result.success).toBe(false);
    });

    it('should accept power of 50', () => {
      const result = weaponOffenseSchema.safeParse({ 
        ...validWeaponOffense, 
        critical: { power: 50, range: 2 } 
      });
      expect(result.success).toBe(true);
    });

    it('should reject power greater than 50', () => {
      const result = weaponOffenseSchema.safeParse({ 
        ...validWeaponOffense, 
        critical: { power: 51, range: 2 } 
      });
      expect(result.success).toBe(false);
    });
  });

  describe('critical.range field', () => {
    it('should accept range of -5', () => {
      const result = weaponOffenseSchema.safeParse({ 
        ...validWeaponOffense, 
        critical: { power: 10, range: -5 } 
      });
      expect(result.success).toBe(true);
    });

    it('should reject range less than -5', () => {
      const result = weaponOffenseSchema.safeParse({ 
        ...validWeaponOffense, 
        critical: { power: 10, range: -6 } 
      });
      expect(result.success).toBe(false);
    });

    it('should accept range of 50', () => {
      const result = weaponOffenseSchema.safeParse({ 
        ...validWeaponOffense, 
        critical: { power: 10, range: 50 } 
      });
      expect(result.success).toBe(true);
    });

    it('should reject range greater than 50', () => {
      const result = weaponOffenseSchema.safeParse({ 
        ...validWeaponOffense, 
        critical: { power: 10, range: 51 } 
      });
      expect(result.success).toBe(false);
    });
  });
});

describe('offenseSchema', () => {
  const validOffense = {
    id: '01HXYZ12345678901234567890',
    name: 'Sword Strike',
    description: 'A powerful sword attack',
    leadingWeapon: {
      amount: 2,
      grade: 6,
      bonus: 5,
      isPhantom: false,
      critical: { power: 10, range: 2 }
    },
    damageBonus: {
      amount: 1,
      grade: 4,
      bonus: 2,
      isPhantom: false
    }
  };

  it('should validate valid offense', () => {
    const result = offenseSchema.safeParse(validOffense);
    expect(result.success).toBe(true);
  });

  it('should accept offense without description', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { description, ...offenseWithoutDesc } = validOffense;
    const result = offenseSchema.safeParse(offenseWithoutDesc);
    expect(result.success).toBe(true);
  });

  it('should accept offense with secondaryWeapon', () => {
    const result = offenseSchema.safeParse({
      ...validOffense,
      secondaryWeapon: {
        amount: 1,
        grade: 4,
        bonus: 3,
        isPhantom: false,
        critical: { power: 8, range: 1 }
      }
    });
    expect(result.success).toBe(true);
  });

  it('should accept offense with additionalDamageBonus', () => {
    const result = offenseSchema.safeParse({
      ...validOffense,
      additionalDamageBonus: {
        amount: 1,
        grade: 6,
        bonus: 0,
        isPhantom: true
      }
    });
    expect(result.success).toBe(true);
  });

  it('should accept empty description', () => {
    const result = offenseSchema.safeParse({ ...validOffense, description: '' });
    expect(result.success).toBe(true);
  });

  it('should reject description less than 2 characters', () => {
    const result = offenseSchema.safeParse({ ...validOffense, description: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject description greater than 1000 characters', () => {
    const result = offenseSchema.safeParse({ ...validOffense, description: 'A'.repeat(1001) });
    expect(result.success).toBe(false);
  });

  it('should accept exactly 1000 character description', () => {
    const result = offenseSchema.safeParse({ ...validOffense, description: 'A'.repeat(1000) });
    expect(result.success).toBe(true);
  });
});
