import 'server-only';
import { characterVisibilityWhere } from '@/persistence/characterVisibility';
import prisma from '@/lib/prisma';
import {
  buildBalanceProfiles,
  type BalanceProfile,
  type BalanceSourceCharacter,
} from '@/domain/ai-character-generation/buildBalanceProfiles';

/**
 * Measures the compendium's own characters so the model can be told where a
 * value sits on the scale rather than guessing. Only the fields the profile
 * reads are selected: this touches every character, and their maneuvers and
 * perks are needed as counts, not as records.
 */
export async function loadAiCharacterBalanceProfiles(apiKey?: string): Promise<BalanceProfile[]>
{
  const characters = await prisma.character.findMany({
    ...(apiKey && { where: characterVisibilityWhere(apiKey) }),
    select: {
      tags: true,
      characteristics: true,
      attributes: true,
      maneuversIds: true,
      perksIds: true,
    },
  });

  return buildBalanceProfiles(characters as unknown as BalanceSourceCharacter[]);
}
