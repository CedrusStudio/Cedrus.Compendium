import { describe, it, expect } from 'vitest';
import { idSchema, entitySchema } from '@/persistence/schemas/entitySchema';

describe('idSchema', () => {
  it('should validate valid ULID', () => {
    const validUlid = '01HXYZ12345678901234567890';
    const result = idSchema.safeParse({ id: validUlid });
    expect(result.success).toBe(true);
  });

  it('should reject invalid ULID format', () => {
    const result = idSchema.safeParse({ id: 'invalid-id' });
    expect(result.success).toBe(false);
  });

  it('should reject missing id', () => {
    const result = idSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('entitySchema', () => {
  it('should validate valid entity', () => {
    const validEntity = {
      id: '01HXYZ12345678901234567890',
      name: 'Valid Name'
    };
    const result = entitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validEntity);
    }
  });

  it('should reject name with less than 2 characters', () => {
    const result = entitySchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: 'A'
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nazwa musi mieć co najmniej 2 znaki.');
    }
  });

  it('should reject name with more than 100 characters', () => {
    const longName = 'A'.repeat(101);
    const result = entitySchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: longName
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nazwa nie może być dłuższa niż 100 znaków.');
    }
  });

  it('should accept name with exactly 2 characters', () => {
    const result = entitySchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: 'AB'
    });
    expect(result.success).toBe(true);
  });

  it('should accept name with exactly 100 characters', () => {
    const maxName = 'A'.repeat(100);
    const result = entitySchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: maxName
    });
    expect(result.success).toBe(true);
  });

  it('should reject missing name', () => {
    const result = entitySchema.safeParse({
      id: '01HXYZ12345678901234567890'
    });
    expect(result.success).toBe(false);
  });

  it('should reject empty string name', () => {
    const result = entitySchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: ''
    });
    expect(result.success).toBe(false);
  });

  it('should accept name with special characters and spaces', () => {
    const result = entitySchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: 'Name with spaces & special-chars!'
    });
    expect(result.success).toBe(true);
  });

  it('should accept name with Polish characters', () => {
    const result = entitySchema.safeParse({
      id: '01HXYZ12345678901234567890',
      name: 'Postać ąćęłńóśźż'
    });
    expect(result.success).toBe(true);
  });
});
