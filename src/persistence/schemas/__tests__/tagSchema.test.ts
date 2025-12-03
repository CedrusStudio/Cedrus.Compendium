import { describe, it, expect } from 'vitest';
import { tagsSchema } from '@/persistence/schemas/tagSchema';

describe('tagsSchema', () => {
  it('should validate empty array of tags', () => {
    const result = tagsSchema.safeParse([]);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('should validate array with valid lowercase single-word tags', () => {
    const tags = ['warrior', 'magic', 'human'];
    const result = tagsSchema.safeParse(tags);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(tags);
    }
  });

  it('should validate tag with hyphens', () => {
    const tags = ['sesja-01', 'fire-mage'];
    const result = tagsSchema.safeParse(tags);
    expect(result.success).toBe(true);
  });

  it('should reject tag with uppercase letters', () => {
    const result = tagsSchema.safeParse(['Warrior']);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nieprawidłowa kategoria.');
    }
  });

  it('should reject tag with spaces', () => {
    const result = tagsSchema.safeParse(['dark warrior']);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Nieprawidłowa kategoria.');
    }
  });

  it('should reject tag with mixed case', () => {
    const result = tagsSchema.safeParse(['mixedCase']);
    expect(result.success).toBe(false);
  });

  it('should validate array with multiple valid tags', () => {
    const tags = ['postać', 'sesja-01', 'warrior', 'magic-user'];
    const result = tagsSchema.safeParse(tags);
    expect(result.success).toBe(true);
  });

  it('should reject when one tag is invalid in array', () => {
    const result = tagsSchema.safeParse(['valid', 'Invalid', 'another']);
    expect(result.success).toBe(false);
  });

  it('should accept numeric tags', () => {
    const result = tagsSchema.safeParse(['123', '456']);
    expect(result.success).toBe(true);
  });

  it('should accept tags with underscores', () => {
    const result = tagsSchema.safeParse(['fire_mage', 'dark_warrior']);
    expect(result.success).toBe(true);
  });

  it('should accept single character tag', () => {
    const result = tagsSchema.safeParse(['a']);
    expect(result.success).toBe(true);
  });

  it('should reject empty string tag', () => {
    const result = tagsSchema.safeParse(['']);
    expect(result.success).toBe(false);
  });
});
