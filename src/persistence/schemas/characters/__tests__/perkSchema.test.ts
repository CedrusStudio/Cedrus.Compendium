import { describe, it, expect } from 'vitest';
import { perkSchema, addPerkSchema, perksSchema } from '@/persistence/schemas/characters/perkSchema';

describe('perkSchema', () => {
  const validPerk = {
    id: '01HXYZ12345678901234567890',
    name: 'Strong Strike',
    grade: 5,
    description: 'A powerful strike',
    price: 50,
    tags: ['combat', 'physical']
  };

  it('should validate valid perk', () => {
    const result = perkSchema.safeParse(validPerk);
    expect(result.success).toBe(true);
  });

  it('should coerce grade from string to number', () => {
    const result = perkSchema.safeParse({ ...validPerk, grade: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grade).toBe(10);
    }
  });

  it('should reject negative grade', () => {
    const result = perkSchema.safeParse({ ...validPerk, grade: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ranga musi mieć co najmniej 0.');
    }
  });

  it('should accept grade of 0', () => {
    const result = perkSchema.safeParse({ ...validPerk, grade: 0 });
    expect(result.success).toBe(true);
  });

  it('should accept grade of 20', () => {
    const result = perkSchema.safeParse({ ...validPerk, grade: 20 });
    expect(result.success).toBe(true);
  });

  it('should reject grade greater than 20', () => {
    const result = perkSchema.safeParse({ ...validPerk, grade: 21 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ranga musi być najwyżej 20.');
    }
  });

  it('should reject non-integer grade', () => {
    const result = perkSchema.safeParse({ ...validPerk, grade: 5.5 });
    expect(result.success).toBe(false);
  });

  it('should accept description with 0 characters', () => {
    const result = perkSchema.safeParse({ ...validPerk, description: '' });
    expect(result.success).toBe(true);
  });

  it('should accept description with exactly 1000 characters', () => {
    const result = perkSchema.safeParse({ ...validPerk, description: 'A'.repeat(1000) });
    expect(result.success).toBe(true);
  });

  it('should reject description with more than 1000 characters', () => {
    const result = perkSchema.safeParse({ ...validPerk, description: 'A'.repeat(1001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Opis musi mieć najwyżej 1000 znaków.');
    }
  });

  it('should coerce price from string to number', () => {
    const result = perkSchema.safeParse({ ...validPerk, price: '100' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.price).toBe(100);
    }
  });

  it('should reject negative price', () => {
    const result = perkSchema.safeParse({ ...validPerk, price: -1 });
    expect(result.success).toBe(false);
  });

  it('should accept price of 0', () => {
    const result = perkSchema.safeParse({ ...validPerk, price: 0 });
    expect(result.success).toBe(true);
  });

  it('should accept price of 180', () => {
    const result = perkSchema.safeParse({ ...validPerk, price: 180 });
    expect(result.success).toBe(true);
  });

  it('should reject price greater than 180', () => {
    const result = perkSchema.safeParse({ ...validPerk, price: 181 });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Cena musi być najwyżej 180.');
    }
  });

  it('should accept valid tags', () => {
    const result = perkSchema.safeParse({ ...validPerk, tags: ['combat', 'magic'] });
    expect(result.success).toBe(true);
  });

  it('should reject invalid tags', () => {
    const result = perkSchema.safeParse({ ...validPerk, tags: ['Invalid Tag'] });
    expect(result.success).toBe(false);
  });
});

describe('addPerkSchema', () => {
  it('should omit id field', () => {
    const perkWithoutId = {
      name: 'New Perk',
      grade: 1,
      description: 'New description',
      price: 10,
      tags: []
    };
    const result = addPerkSchema.safeParse(perkWithoutId);
    expect(result.success).toBe(true);
  });

  it('should ignore provided id field', () => {
    const result = addPerkSchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: 'New Perk',
      grade: 1,
      description: 'Description',
      price: 10,
      tags: []
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('id');
    }
  });
});

describe('perksSchema', () => {
  it('should validate empty array', () => {
    const result = perksSchema.safeParse([]);
    expect(result.success).toBe(true);
  });

  it('should validate array with valid perks', () => {
    const perks = [
      {
        id: '01HXYZ12345678901234567890',
        name: 'Perk 1',
        grade: 1,
        description: 'Desc 1',
        price: 10,
        tags: []
      },
      {
        id: '01HXYZ12345678901234567891',
        name: 'Perk 2',
        grade: 2,
        description: 'Desc 2',
        price: 20,
        tags: []
      }
    ];
    const result = perksSchema.safeParse(perks);
    expect(result.success).toBe(true);
  });

  it('should reject array with more than 500 perks', () => {
    const manyPerks = Array.from({ length: 501 }, (_, i) => ({
      id: `01HXYZ1234567890123456${String(i).padStart(4, '0')}`,
      name: `Perk ${i}`,
      grade: 1,
      description: 'Description',
      price: 0,
      tags: []
    }));
    const result = perksSchema.safeParse(manyPerks);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Możesz mieć najwyżej 500 manewrów.');
    }
  });

  it('should accept exactly 500 perks', () => {
    const perks = Array.from({ length: 500 }, (_, i) => ({
      id: `01HXYZ1234567890123456${String(i).padStart(4, '0')}`,
      name: `Perk ${i}`,
      grade: 1,
      description: 'Description',
      price: 0,
      tags: []
    }));
    const result = perksSchema.safeParse(perks);
    expect(result.success).toBe(true);
  });
});
