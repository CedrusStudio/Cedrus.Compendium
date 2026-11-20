import { z } from 'zod';
import { sheetOperations } from './sheetContracts';
import { aiCharacterGenerationRequestSchema } from '../ai-character-generation/aiCharacterGenerationSchemas';
import { membershipKinds } from '../characters/characterMembership';

const id = z.string().min(1).max(100);
const revision = z.string().regex(/^[a-f0-9]{64}$/);
const preview = {
  requestId: z.string().min(1).max(100).describe('Stable identifier for this draft, also used for retries and revisions.'),
  expectedRevision: revision.optional().describe('Required when revising a previous preview.'),
};
export const contextInput = z.strictObject({
  brief: aiCharacterGenerationRequestSchema,
  part: z.enum(['overview', 'instructions', 'schema', 'references', 'catalog', 'rulebook', 'balance']).default('overview'),
  section: z.string().max(100).optional().describe('Top-level proposal property for a focused schema lookup.'),
  offset: z.number().int().min(0).max(10000).default(0),
  limit: z.number().int().min(1).max(40).default(12),
});
export const createInput = z.strictObject({
  ...preview, brief: aiCharacterGenerationRequestSchema,
  proposal: z.record(z.string(), z.unknown()).describe('Character proposal following the schema from get_creation_context.'),
  visibility: z.enum(['mine', 'public']).default('mine'),
});
export const editOperation = z.discriminatedUnion('op', [
  ...sheetOperations,
  z.strictObject({ op: z.literal('description'), value: z.string().min(2).max(10000) }),
  z.strictObject({ op: z.literal('tags'), value: z.array(z.string().min(1).max(100)).max(100) }),
  z.strictObject({ op: z.literal('statistic'), statistic: z.string().min(1).max(40),
    component: z.enum(['grade', 'value', 'bonus', 'testBonus']), value: z.number().int() }),
  z.strictObject({ op: z.literal('membership'), kind: z.enum(membershipKinds), entityId: id, present: z.boolean() }),
]);
export const editInput = z.strictObject({ ...preview, characterId: id, operations: z.array(editOperation).min(1).max(30) });
export const changeInput = z.strictObject({ changeId: id });
export const applyInput = z.strictObject({ changeId: id, revision });
export type EditOperation = z.infer<typeof editOperation>;
