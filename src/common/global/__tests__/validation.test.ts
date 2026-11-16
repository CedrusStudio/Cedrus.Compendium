import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { typedZodResolver } from '@/common/global/validation';

const schema = z.object({
  amount: z.coerce.number().int().min(1),
  name: z.string().trim().transform(value => value.toUpperCase()),
  enabled: z.boolean().default(true),
});
type FormValues = z.output<typeof schema>;
const options = { fields: {}, shouldUseNativeValidation: false };

describe('typedZodResolver output-typed form contract', () => {
  it('applies coercion, defaults and transforms to raw form input', async () => {
    const resolver = typedZodResolver(schema);
    // Form fields can contain raw strings and omit defaulted values before validation.
    const rawValues = { amount: '3', name: '  Hero  ' };

    const result = await resolver(rawValues as unknown as FormValues, undefined, options);

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ amount: 3, name: 'HERO', enabled: true });
  });

  it('returns field errors and no parsed values when validation fails', async () => {
    const resolver = typedZodResolver(schema);

    const result = await resolver({ amount: 0, name: 'Hero', enabled: true }, undefined, options);

    expect(result.values).toEqual({});
    expect(result.errors).toMatchObject({ amount: { type: 'too_small' } });
  });
});
