import 'server-only';
import prisma from '@/lib/prisma';
import {
  aiCharacterProposalSchema,
  type AiCharacterProposal,
} from '@/domain/ai-character-generation/aiCharacterProposalSchema';
import { aiCharacterGenerationRequestSchema } from '@/domain/ai-character-generation/aiCharacterGenerationSchemas';
import type { AiCharacterGenerationAllowedReferences } from '@/domain/ai-character-generation/validateAiCharacterProposalForAcceptance';
import { createUpsertPayload } from '@/persistence/mappings/createUpsertPayload';
import { AiCharacterDraftNotFoundError, AiCharacterDraftStateError } from '@/persistence/ai-character-generation/aiCharacterDraftErrors';
import { AiCharacterDraftAcceptanceConflictError } from '@/persistence/ai-character-generation/aiCharacterDraftAcceptanceErrors';
import {
  toCharacterBuffsPersistenceModel,
  toCharacterCombatPersistenceModel,
  toCharacterEquipmentPersistenceModel,
  toCharacterHeaderPersistenceModel,
} from '@/persistence/mappings/characterMapping';

const uniqueIds = (ids: string[]) => [...new Set(ids)];

function getGlobalReferenceIds(proposal: AiCharacterProposal)
{
  return {
    raceIds: proposal.header.raceId ? [proposal.header.raceId] : [],
    stanceIds: uniqueIds(proposal.combat.stances.map(stance => stance.id)),
    stateIds: uniqueIds(proposal.combat.states.map(state => state.id)),
    maneuverIds: uniqueIds(proposal.combat.maneuvers.map(maneuver => maneuver.id)),
    spellIds: uniqueIds(proposal.combat.powers.flatMap(power => power.spells.map(spell => spell.id))),
    powerSpecificationIds: uniqueIds(proposal.combat.powers.map(power => power.powerSpecificationId)),
    weaponIds: uniqueIds(proposal.equipment.weapons.map(weapon => weapon.id)),
    armorIds: uniqueIds(proposal.equipment.armors.map(armor => armor.id)),
    shieldIds: uniqueIds(proposal.equipment.shields.map(shield => shield.id)),
    inventoryIds: uniqueIds(proposal.equipment.inventory.map(item => item.id)),
    mountIds: uniqueIds(proposal.equipment.mounts.map(mount => mount.id)),
    perkIds: uniqueIds(proposal.perks.map(perk => perk.id)),
  };
}

/**
 * A draft carries the permissions it was generated under, so accepting it
 * cannot quietly apply looser rules than the request asked for. Unreadable
 * constraints fall back to the strict reading.
 */
function getAuthoringPermissions(request: unknown): { equipment: boolean; abilities: boolean }
{
  const parsed = aiCharacterGenerationRequestSchema.safeParse(request);
  if (!parsed.success) return { equipment: false, abilities: false };

  return {
    equipment: parsed.data.constraints.allowCustomEquipment,
    abilities: parsed.data.constraints.allowCustomAbilities,
  };
}

function assertExistingIds(label: string, expectedIds: string[], foundIds: string[]): void
{
  if (expectedIds.some(id => !foundIds.includes(id))) {
    throw new AiCharacterDraftAcceptanceConflictError([
      `${label} użyty w wersji roboczej nie istnieje już w bazie danych. Wygeneruj nową wersję lub popraw propozycję.`,
    ]);
  }
}

/**
 * Creates the Character and marks its draft accepted in the same MongoDB
 * transaction. It deliberately does not call the public character endpoints:
 * a failure in one nested relation rolls back the complete operation.
 */
export async function acceptAiCharacterDraftInTransaction(input: {
  draftId: string;
  apiKeyHash: string;
  allowedReferences: AiCharacterGenerationAllowedReferences;
}): Promise<string>
{
  return prisma.$transaction(async transaction => {
    const draft = await transaction.aiCharacterDraft.findUnique({ where: { id: input.draftId } });
    if (!draft || draft.apiKeyHash !== input.apiKeyHash) {
      throw new AiCharacterDraftNotFoundError();
    }

    if (draft.status === 'accepted' && draft.acceptedCharacterId) {
      return draft.acceptedCharacterId;
    }
    if (draft.status !== 'pending') {
      throw new AiCharacterDraftStateError('Only a pending AI character draft can be accepted.');
    }
    if (draft.expiresAt <= new Date()) {
      throw new AiCharacterDraftStateError('This AI character draft has expired. Generate a new one.');
    }

    const parsedProposal = aiCharacterProposalSchema.safeParse(draft.proposal);
    if (!parsedProposal.success) {
      throw new AiCharacterDraftAcceptanceConflictError(['Wersja robocza nie przechodzi już walidacji danych postaci.']);
    }

    const proposal = parsedProposal.data;
    const permissions = getAuthoringPermissions(draft.request);

    // Review issues no longer block the save. A draft that is 90% right is
    // worth more as a character the user can finish in the ordinary editor than
    // as something they can only throw away, and the checks that follow still
    // refuse anything that cannot physically be linked.

    const references = getGlobalReferenceIds(proposal);
    const [races, stances, states, maneuvers, spells, powerSpecifications,
      weapons, armors, shields, inventory, mounts, perks, conflictingCharacter] = await Promise.all([
      transaction.race.findMany({ where: { id: { in: references.raceIds } }, select: { id: true } }),
      transaction.stance.findMany({ where: { id: { in: references.stanceIds } }, select: { id: true } }),
      transaction.state.findMany({ where: { id: { in: references.stateIds } }, select: { id: true } }),
      transaction.maneuver.findMany({ where: { id: { in: references.maneuverIds } }, select: { id: true } }),
      transaction.spell.findMany({ where: { id: { in: references.spellIds } }, select: { id: true } }),
      transaction.powerSpecification.findMany({ where: { id: { in: references.powerSpecificationIds } }, select: { id: true } }),
      transaction.weapon.findMany({ where: { id: { in: references.weaponIds } }, select: { id: true } }),
      transaction.armor.findMany({ where: { id: { in: references.armorIds } }, select: { id: true } }),
      transaction.shield.findMany({ where: { id: { in: references.shieldIds } }, select: { id: true } }),
      transaction.inventoryItem.findMany({ where: { id: { in: references.inventoryIds } }, select: { id: true } }),
      transaction.mount.findMany({ where: { id: { in: references.mountIds } }, select: { id: true } }),
      transaction.perk.findMany({ where: { id: { in: references.perkIds } }, select: { id: true } }),
      transaction.character.findFirst({
        where: { OR: [{ name: proposal.header.name }, { shortName: proposal.header.shortName }] },
        select: { id: true },
      }),
    ]);

    if (conflictingCharacter) {
      throw new AiCharacterDraftAcceptanceConflictError(['Nazwa lub krótka nazwa postaci jest już zajęta.']);
    }

    // A race that vanished from the compendium is dropped rather than blocking
    // the save; the user picks a new one in the editor.
    const raceStillExists = proposal.header.raceId
      ? races.some(race => race.id === proposal.header.raceId)
      : true;
    const header = raceStillExists ? proposal.header : { ...proposal.header, raceId: null };

    const foundStanceIds = stances.map(stance => stance.id);
    const foundStateIds = states.map(state => state.id);
    const foundManeuverIds = maneuvers.map(maneuver => maneuver.id);
    assertExistingIds('Zaklęcie', references.spellIds, spells.map(spell => spell.id));
    assertExistingIds('Specyfikacja mocy', references.powerSpecificationIds, powerSpecifications.map(specification => specification.id));
    // Anything already in the compendium is linked; anything else is only
    // allowed through when the request explicitly permitted authoring, and is
    // then created as a new record.
    const foundWeaponIds = weapons.map(weapon => weapon.id);
    const foundArmorIds = armors.map(armor => armor.id);
    const foundShieldIds = shields.map(shield => shield.id);
    const foundInventoryIds = inventory.map(item => item.id);
    const foundMountIds = mounts.map(mount => mount.id);
    const foundPerkIds = perks.map(perk => perk.id);

    if (!permissions.equipment) {
      assertExistingIds('Broń', references.weaponIds, foundWeaponIds);
      assertExistingIds('Zbroja', references.armorIds, foundArmorIds);
      assertExistingIds('Tarcza', references.shieldIds, foundShieldIds);
      assertExistingIds('Przedmiot', references.inventoryIds, foundInventoryIds);
      assertExistingIds('Wierzchowiec', references.mountIds, foundMountIds);
    }
    if (!permissions.abilities) {
      assertExistingIds('Atut', references.perkIds, foundPerkIds);
      assertExistingIds('Postawa', references.stanceIds, foundStanceIds);
      assertExistingIds('Stan', references.stateIds, foundStateIds);
      assertExistingIds('Manewr', references.maneuverIds, foundManeuverIds);
    }

    const character = await transaction.character.create({
      data: toCharacterHeaderPersistenceModel(header),
      select: { id: true },
    });

    // Equipment is shared compendium data, not per-character rows. Passing the
    // ids as "connect" is what stops an accepted draft from minting a second
    // „Miecz jednoręczny" next to the one the compendium already has.
    const equipmentUpdate = toCharacterEquipmentPersistenceModel(
      proposal.equipment,
      [], foundWeaponIds,
      [], foundArmorIds,
      [], foundShieldIds,
      [], foundInventoryIds,
      [], foundMountIds,
    );
    const combatUpdate = toCharacterCombatPersistenceModel(
      proposal.combat,
      [], foundStanceIds,
      [], foundStateIds,
      [], foundManeuverIds,
      [], references.spellIds,
      references.powerSpecificationIds,
      references.powerSpecificationIds,
    );

    await transaction.character.update({
      where: { id: character.id },
      data: {
        characteristics: proposal.statistics.characteristics,
        attributes: proposal.statistics.attributes,
        talents: proposal.talents.talents,
        perks: createUpsertPayload([], proposal.perks, foundPerkIds),
        ...equipmentUpdate,
        ...combatUpdate,
        ...toCharacterBuffsPersistenceModel(proposal.buffs),
      },
    });

    // This conditional update prevents a concurrent second click from creating
    // a second Character. If it loses the race, throwing rolls its character
    // insert back with the transaction.
    const acceptedDraft = await transaction.aiCharacterDraft.updateMany({
      where: { id: draft.id, apiKeyHash: input.apiKeyHash, status: 'pending' },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
        acceptedCharacterId: character.id,
      },
    });
    if (acceptedDraft.count !== 1) {
      throw new AiCharacterDraftStateError('This AI character draft was already processed.');
    }

    return character.id;
  });
}
