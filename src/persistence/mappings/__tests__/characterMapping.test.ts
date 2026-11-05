import { describe, expect, it } from 'vitest';
import { createDraftCatalog, createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { CreateDefaultPower } from '@/domain/characters/combat/Power';
import { copyCreateCharacterSchema } from '@/persistence/schemas/characters/copyCharacterSchema';
import { toCharacterDetailsPersistenceModel, toCharacterFromCopyPersistenceModel } from '../characterMapping';

describe('character mapping', () => {
  it('copies embedded data and connects the existing relations without duplicating catalog records', () => {
    const proposal = createPendingDraft().proposal!;
    const c = createDraftCatalog();
    const power = { ...CreateDefaultPower(), powerSpecificationId: c.powerSpecificationId, spells: [c.spell] };
    const input = copyCreateCharacterSchema.parse({
      ...proposal.header,
      name: 'Aldara po awansie',
      shortName: 'Aldara2',
      raceId: 'original-race',
      ...proposal.statistics,
      ...proposal.talents,
      ...proposal.combat,
      ...proposal.buffs,
      powers: [power],
      weaponsIds: [c.weapon.id],
      armorsIds: [c.armor.id],
      shieldsIds: [c.shield.id],
      inventoryIds: [c.inventoryItem.id],
      mountsIds: [c.mount.id],
      stancesIds: [c.stance.id],
      statesIds: [c.state.id],
      maneuversIds: [c.maneuver.id],
      spellsIds: [c.spell.id],
      perksIds: [c.perk.id],
      powerSpecificationsIds: [c.powerSpecificationId],
    });
    const connect = (id: string) => ({ connect: [{ id }] });
    expect(toCharacterFromCopyPersistenceModel(input)).toMatchObject({
      name: input.name, shortName: input.shortName,
      race: { connect: { id: 'original-race' } },
      characteristics: input.characteristics, talents: input.talents,
      defenses: input.defenses, defaultDefenseId: input.defaultDefenseId,
      offenses: input.offenses, defaultOffenseId: input.defaultOffenseId,
      powers: [{ ...power, spells: undefined, spellsIds: [c.spell.id] }],
      weapons: connect(c.weapon.id), armors: connect(c.armor.id), shields: connect(c.shield.id),
      inventory: connect(c.inventoryItem.id), mounts: connect(c.mount.id), perks: connect(c.perk.id),
      stances: connect(c.stance.id), states: connect(c.state.id), maneuvers: connect(c.maneuver.id),
      spells: connect(c.spell.id), powerSpecifications: connect(c.powerSpecificationId),
    });
    expect(toCharacterFromCopyPersistenceModel({ ...input, raceId: null })).not.toHaveProperty('race');
  });

  it('distinguishes keeping, replacing and clearing the race in a details edit', () => {
    const proposal = createPendingDraft().proposal!;
    const details = { ...proposal.header, perks: [] };
    expect(toCharacterDetailsPersistenceModel({ ...details, raceId: undefined }, [])).not.toHaveProperty('race');
    expect(toCharacterDetailsPersistenceModel({ ...details, raceId: 'new-race' }, []).race).toEqual({ connect: { id: 'new-race' } });
    expect(toCharacterDetailsPersistenceModel({ ...details, raceId: null, apiKeys: [] }, [])).toMatchObject({
      race: { disconnect: true }, apiKeys: [],
    });
  });
});
