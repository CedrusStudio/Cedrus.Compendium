import { describe, it, expect } from 'vitest';
import { headerSchema, detailsSchema } from '@/persistence/schemas/characters/headerSchema';

describe('headerSchema', () => {
  const validHeader = {
    name: 'Test Character',
    shortName: 'TestChar',
    description: 'A test character description',
    tags: ['warrior', 'human'],
    raceId: '01HXYZ12345678901234567890'
  };

  it('should validate valid header', () => {
    const result = headerSchema.safeParse(validHeader);
    expect(result.success).toBe(true);
  });

  it('should accept header without raceId', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { raceId, ...headerWithoutRace } = validHeader;
    const result = headerSchema.safeParse(headerWithoutRace);
    expect(result.success).toBe(true);
  });

  it('should accept header with null raceId', () => {
    const result = headerSchema.safeParse({ ...validHeader, raceId: null });
    expect(result.success).toBe(true);
  });

  it('should reject name with less than 2 characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, name: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nazwa musi mieć co najmniej 2 znaki.');
    }
  });

  it('should accept name with exactly 2 characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, name: 'AB' });
    expect(result.success).toBe(true);
  });

  it('should reject shortName with spaces', () => {
    const result = headerSchema.safeParse({ ...validHeader, shortName: 'Test Char' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Pole może zawierać tylko litery, cyfry i polskie znaki.');
    }
  });

  it('should reject shortName with special characters except Polish', () => {
    const result = headerSchema.safeParse({ ...validHeader, shortName: 'Test@Char' });
    expect(result.success).toBe(false);
  });

  it('should accept shortName with Polish characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, shortName: 'Śmiały' });
    expect(result.success).toBe(true);
  });

  it('should reject shortName with less than 2 characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, shortName: 'A' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nazwa musi mieć co najmniej 2 znaki.');
    }
  });

  it('should reject shortName with more than 15 characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, shortName: 'A'.repeat(16) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nazwa musi mieć co najwyżej 15 znaków.');
    }
  });

  it('should accept shortName with exactly 15 characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, shortName: 'A'.repeat(15) });
    expect(result.success).toBe(true);
  });

  it('should accept shortName with numbers', () => {
    const result = headerSchema.safeParse({ ...validHeader, shortName: 'Char123' });
    expect(result.success).toBe(true);
  });

  it('should reject description with less than 2 characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, description: 'A' });
    expect(result.success).toBe(false);
  });

  it('should reject description with more than 10000 characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, description: 'A'.repeat(10001) });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Opis nie może być dłuższy niż 10 000 znaków.');
    }
  });

  it('should accept description with exactly 10000 characters', () => {
    const result = headerSchema.safeParse({ ...validHeader, description: 'A'.repeat(10000) });
    expect(result.success).toBe(true);
  });

  it('should reject invalid tags', () => {
    const result = headerSchema.safeParse({ ...validHeader, tags: ['Invalid Tag'] });
    expect(result.success).toBe(false);
  });

  it('should accept empty tags array', () => {
    const result = headerSchema.safeParse({ ...validHeader, tags: [] });
    expect(result.success).toBe(true);
  });
});

describe('detailsSchema', () => {
  const validDetails = {
    name: 'Test Character',
    shortName: 'TestChar',
    description: 'A test character description',
    tags: ['warrior'],
    raceId: '01HXYZ12345678901234567890',
    perks: [
      {
        id: '01HXYZ12345678901234567890',
        name: 'Test Perk',
        grade: 1,
        description: 'Test perk description',
        requirements: ['None'],
        price: 10,
        tags: ['combat']
      }
    ]
  };

  it('should validate valid details', () => {
    const result = detailsSchema.safeParse(validDetails);
    expect(result.success).toBe(true);
  });

  it('should accept details with empty perks array', () => {
    const result = detailsSchema.safeParse({ ...validDetails, perks: [] });
    expect(result.success).toBe(true);
  });

  it('should reject when perks exceed maximum', () => {
    const manyPerks = Array.from({ length: 501 }, (_, i) => ({
      id: `01HXYZ1234567890123456${String(i).padStart(4, '0')}`,
      name: `Perk ${i}`,
      grade: 1,
      description: 'Description',
      requirements: [],
      price: 0,
      tags: []
    }));
    const result = detailsSchema.safeParse({ ...validDetails, perks: manyPerks });
    expect(result.success).toBe(false);
  });
});
