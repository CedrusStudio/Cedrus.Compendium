import { z } from 'zod';
import {
  aiCharacterDraftStatusSchema,
  aiCharacterGenerationRequestSchema,
  aiCharacterGenerationUsageSchema,
} from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';
import { aiCharacterProposalSchema } from '@/domain/ai-character-generation/aiCharacterProposalSchema';

export const aiCharacterDraftSchema = z.object({
  id: z.string().trim().min(1),
  status: aiCharacterDraftStatusSchema,
  request: aiCharacterGenerationRequestSchema,
  proposal: aiCharacterProposalSchema.nullable(),
  validationIssues: z.array(z.string()).max(50),
  referenceCharacterIds: z.array(z.string().trim().min(1)).max(3),
  reviewedRevision: z.string().optional(),
  visibility: z.enum(['mine', 'public']).optional(),
  provider: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(200),
  promptVersion: z.string().trim().min(1).max(100),
  generationUsage: aiCharacterGenerationUsageSchema.nullable(),
  costMicroUsd: z.number().int().nonnegative(),
  expiresAt: z.coerce.date(),
  acceptedAt: z.coerce.date().nullable(),
  acceptedCharacterId: z.string().trim().min(1).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).strict();

export type AiCharacterDraft = z.infer<typeof aiCharacterDraftSchema>;
