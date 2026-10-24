import { Spell } from '@/domain/characters/combat/Power';
import { fromSpellCostPersistence, toSpellCostPersistence } from '@/domain/characters/combat/SpellCost';
import { toCastablePerk } from '@/persistence/mappings/perkMapping';
import { Prisma } from '@prisma/client';
import { toCastablePersistenceModel } from './castableMapping';

export type SpellModel = Prisma.CharacterGetPayload<{select: { spells: true }}>['spells'][number];

export function toSpell(spellPersistenceModel: SpellModel): Spell
{
  return {
    ...toCastablePerk<Spell>(spellPersistenceModel),
    cost: fromSpellCostPersistence(spellPersistenceModel)
  };
}

export function toSpellPersistenceModel<TSpell extends { cost: Spell['cost']; cooldown?: number | null }>(spell: TSpell)
{
  const { cost, ...spellWithoutCost } = spell;

  return {
    ...toCastablePersistenceModel(spellWithoutCost),
    ...toSpellCostPersistence(cost),
  };
}
