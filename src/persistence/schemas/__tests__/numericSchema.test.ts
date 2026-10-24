import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { numberInput } from '../numericSchema';
import { perkSchema } from '../characters/perkSchema';
import { healthSchema } from '../characters/combat/healthSchema';
import { raceSchema } from '../characters/raceSchema';
import { castableSchema } from '../characters/castableSchema';

describe('required numeric input', () => {
  it.each(['', ' ', '\t\n', null, undefined, Number.NaN])('rejects %j before it can become zero', value => {
    for (const schema of [perkSchema.shape.price, healthSchema.shape.bonus, raceSchema.shape.strengthModifier])
    {
      if (value === undefined && schema === raceSchema.shape.strengthModifier) continue;
      const result = schema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) expect(result.error.issues[0].message).toBe('Uzupełnij pole');
    }
  });

  it.each([0, '0', '00', ' 0 '])('accepts an explicitly entered zero %j', value => {
    expect(perkSchema.shape.price.parse(value)).toBe(0);
    expect(healthSchema.shape.bonus.parse(value)).toBe(0);
  });

  it('retains minimum, maximum, integer and strict-number validation', () => {
    const schema = numberInput(z.coerce.number().int().min(-5).max(10));
    expect(schema.parse('-5')).toBe(-5);
    expect(schema.safeParse(-6).success).toBe(false);
    expect(schema.safeParse(11).success).toBe(false);
    expect(schema.safeParse(1.5).success).toBe(false);
    expect(numberInput(z.number()).safeParse('5').success).toBe(false);
  });

  it('retains absent optional values and defaults but rejects explicitly blank API values', () => {
    expect(castableSchema.shape.cooldown.parse(undefined)).toBeUndefined();
    expect(castableSchema.shape.cooldown.parse(null)).toBeUndefined();
    expect(castableSchema.shape.cooldown.safeParse('').success).toBe(false);
    expect(raceSchema.shape.strengthModifier.parse(undefined)).toBe(0);
    expect(raceSchema.shape.strengthModifier.safeParse('').success).toBe(false);
  });
});
