import type { Character } from '@/domain/characters/Character';
import type { Requirement } from '@/domain/requirements/Requirement';
import { checkRequirement } from '@/domain/requirements/checkRequirement';
import { formatRequirement } from '@/domain/requirements/formatRequirement';
import type { AiCharacterProposal } from '@/domain/ai-character-generation/aiCharacterProposalSchema';

/** Structured requirements of every compendium entry, keyed by its identifier. */
export type AiCharacterRequirementIndex = ReadonlyMap<string, readonly Requirement[]>;

type OwnedEntry = { id: string; name: string; grade?: number };

/**
 * The proposal already carries everything the comparison engine reads —
 * statistics, perks, maneuvers, stances, states, talents, powers, equipment —
 * in the same shapes a Character uses. It is presented as one rather than
 * copied field by field, so a new requirement variant that reaches for a part
 * of the character we did not anticipate still finds it.
 */
function asCharacter(proposal: AiCharacterProposal): Character
{
  return {
    ...proposal.header,
    ...proposal.statistics,
    ...proposal.combat,
    perks: proposal.perks,
    talents: proposal.talents.talents,
    equipment: proposal.equipment,
  } as unknown as Character;
}

function collectOwned(proposal: AiCharacterProposal): { label: string; entries: readonly OwnedEntry[] }[]
{
  return [
    { label: 'Atut', entries: proposal.perks },
    { label: 'Manewr', entries: proposal.combat.maneuvers },
    { label: 'Postawa', entries: proposal.combat.stances },
    { label: 'Stan', entries: proposal.combat.states },
    { label: 'Zaklęcie', entries: proposal.combat.powers.flatMap(power => power.spells) },
  ];
}

const describe = (entry: OwnedEntry) =>
  entry.grade === undefined ? entry.name : `${entry.name} (${entry.grade})`;

/**
 * Reports entries the character holds without meeting their requirements.
 *
 * Reporting is the whole contract. `checkRequirement` is explicitly documented
 * as a layer that must never block — a game master may take an entry as a
 * deliberate narrative call — so an unmet requirement belongs in the review
 * notes beside the draft and must not stop it being accepted.
 */
export function validateAiCharacterProposalRequirements(
  proposal: AiCharacterProposal,
  requirementsById: AiCharacterRequirementIndex,
): string[]
{
  const character = asCharacter(proposal);
  const issues: string[] = [];

  for (const { label, entries } of collectOwned(proposal)) {
    for (const entry of entries) {
      const requirements = requirementsById.get(entry.id);
      if (!requirements || requirements.length === 0) continue;

      const unmet = requirements.filter(requirement => !checkRequirement(requirement, character));
      if (unmet.length === 0) continue;

      issues.push(`${label} „${describe(entry)}" ma niespełnione wymagania: ${unmet.map(formatRequirement).join('; ')}.`);
    }
  }

  return issues;
}
