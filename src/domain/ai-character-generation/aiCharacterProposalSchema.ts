import { z } from 'zod';
import { headerSchema } from '@/persistence/schemas/characters/headerSchema';
import { perksSchema } from '@/persistence/schemas/characters/perkSchema';
import { statisticsSchema } from '@/persistence/schemas/characters/statistics/statisticsSchema';
import { talentsSchema } from '@/persistence/schemas/characters/talentSchema';
import { equipmentSchema } from '@/persistence/schemas/characters/equipment/equipmentSchema';
import { combatSchema } from '@/persistence/schemas/characters/combat/combatSchema';
import { buffsSchema } from '@/persistence/schemas/characters/buffs/buffsSchema';

/**
 * The proposal composes existing character DTO schemas, so a provider cannot
 * invent a second representation that diverges from the editor and API.
 * It remains a draft until the future acceptance transaction re-validates it.
 */
export const aiCharacterProposalSchema = z.object({
  header: headerSchema,
  // Perks are the character's atuty. They sit beside the header rather than
  // inside it because `headerSchema` is shared with the character list, where
  // carrying every perk would be dead weight.
  perks: perksSchema,
  statistics: statisticsSchema,
  talents: talentsSchema,
  equipment: equipmentSchema,
  combat: combatSchema,
  buffs: buffsSchema,
  explanation: z.string().trim().min(1).max(2_000),
  warnings: z.array(z.string().trim().min(1).max(500)).max(20),
}).strict();

export type AiCharacterProposal = z.infer<typeof aiCharacterProposalSchema>;
