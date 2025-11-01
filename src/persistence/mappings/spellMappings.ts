import { Spell } from '@/domain/characters/combat/Power';
import { toCastablePerk } from '@/persistence/mappings/perkMapping';
import { Prisma } from '@prisma/client';

export type SpellModel = Prisma.CharacterGetPayload<{select: { spells: true }}>['spells'][number];

export function toSpell(spellPersistenceModel: SpellModel): Spell
{
  return {
    ...toCastablePerk<Spell>(spellPersistenceModel),
    cost: spellPersistenceModel.cost
  };
}