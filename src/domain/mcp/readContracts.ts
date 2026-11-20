import { z } from 'zod';
import { AI_CATALOG_KINDS } from '../ai-character-generation/catalogKinds';

export const entryKind = z.enum(['character', 'rulebook', ...AI_CATALOG_KINDS]);
export const cardSection = z.enum(['overview', 'statistics', 'talents', 'combat', 'equipment', 'buffs']);
export const searchInput = z.strictObject({
  kind: entryKind,
  query: z.string().trim().max(200).default(''),
  tag: z.string().trim().min(1).max(100).optional(),
  limit: z.number().int().min(1).max(40).default(12),
  offset: z.number().int().min(0).max(10000).default(0),
});
export const entryInput = z.strictObject({
  kind: entryKind,
  id: z.string().min(1).max(250).describe('ID returned by search. Rulebook IDs are category/slug.'),
  forCharacterId: z.string().min(1).max(64).optional().describe('For a catalog entry, evaluate its requirements against this visible character.'),
  sections: z.array(cardSection).max(6).optional(),
});
