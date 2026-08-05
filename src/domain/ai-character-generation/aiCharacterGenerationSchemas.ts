import { z } from 'zod';

export const MAX_AI_CHARACTER_REFERENCES = 3;
export const MAX_AI_CHARACTER_DESCRIPTION_LENGTH = 4_000;

const characterIdSchema = z.string().trim().min(1).max(64);

/**
 * Authoring permissions, off by default. Left open, a model fills a draft with
 * invented gear and made-up maneuvers, and accepting it writes them into the
 * shared compendium. They are two flags rather than one because the stakes
 * differ: a bespoke „Odznaka służby barona" is set dressing, while a bespoke
 * maneuver is a rules change every other character can then take.
 */
export const aiCharacterGenerationConstraintsSchema = z.object({
  language: z.enum(['pl-PL', 'en-US', 'de-DE', 'fr-FR']).default('pl-PL'),
  notes: z.string().trim().max(2_000).optional(),
  allowCustomEquipment: z.boolean().default(false),
  allowCustomAbilities: z.boolean().default(false),
}).strict();

export const aiCharacterGenerationRequestSchema = z.object({
  description: z.string()
    .trim()
    .min(10, { message: 'Opis postaci musi mieć co najmniej 10 znaków.' })
    .max(MAX_AI_CHARACTER_DESCRIPTION_LENGTH, { message: 'Opis postaci nie może przekraczać ' + MAX_AI_CHARACTER_DESCRIPTION_LENGTH + ' znaków.' }),
  referenceCharacterIds: z.array(characterIdSchema)
    .max(MAX_AI_CHARACTER_REFERENCES, { message: 'Możesz wybrać najwyżej ' + MAX_AI_CHARACTER_REFERENCES + ' postaci referencyjne.' })
    .superRefine((ids, context) => {
      if (new Set(ids).size !== ids.length) {
        context.addIssue({ code: 'custom', message: 'Postacie referencyjne nie mogą się powtarzać.' });
      }
    })
    .default([]),
  constraints: aiCharacterGenerationConstraintsSchema.default({
    language: 'pl-PL',
    allowCustomEquipment: false,
    allowCustomAbilities: false,
  }),
}).strict();

export const aiCharacterGenerationUsageSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  providerRequestId: z.string().trim().min(1).max(200).optional(),
}).strict();

export const aiCharacterDraftStatusSchema = z.enum(['pending', 'accepted', 'rejected', 'invalid', 'expired']);

export type AiCharacterGenerationRequest = z.infer<typeof aiCharacterGenerationRequestSchema>;
export type AiCharacterGenerationUsage = z.infer<typeof aiCharacterGenerationUsageSchema>;
