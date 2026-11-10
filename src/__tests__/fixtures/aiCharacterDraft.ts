import { aiCharacterDraftSchema } from '@/domain/ai-character-generation/aiCharacterDraft';
import { CreateEmptyCharacter } from '@/domain/characters/Character';

import { CreateDefaultPerk } from '@/domain/characters/Perk';
import { CreateDefaultManeuver } from '@/domain/characters/combat/Maneuver';
import { CreateDefaultStance, CreateDefaultState } from '@/domain/characters/combat/Mode';
import { CreateDefaultSpell } from '@/domain/characters/combat/Power';
import { CreateDefaultArmor } from '@/domain/characters/equipment/Armor';
import { CreateDefaultInventoryItem } from '@/domain/characters/equipment/Item';
import { CreateDefaultMount } from '@/domain/characters/equipment/Mount';
import { CreateDefaultShield } from '@/domain/characters/equipment/Shield';
import { CreateDefaultWeapon } from '@/domain/characters/equipment/Weapon';

export function createPendingDraft()
{
  const name = 'Aldara zwiadowczyni';
  const shortName = 'Aldara';
  const description = 'Zwiadowczyni z lodową magią.';
  const tags = ['walka'];
  const character = CreateEmptyCharacter({ name, shortName, description, tags });
  const now = new Date('2026-11-05T08:00:00Z');

  return aiCharacterDraftSchema.parse({
    id: 'draft-review',
    status: 'pending',
    request: { description },
    proposal: {
      header: { name, shortName, description, tags, raceId: null },
      perks: [],
      statistics: { characteristics: character.characteristics, attributes: character.attributes },
      talents: { talents: character.talents },
      equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
      combat: {
        health: character.health,
        offenses: character.offenses,
        defenses: character.defenses,
        defaultOffenseId: character.defaultOffenseId,
        defaultDefenseId: character.defaultDefenseId,
        maneuvers: [],
        stances: [],
        states: [],
        powers: [],
      },
      buffs: {
        buffProfiles: [],
        activeBuffProfileIds: [],
        stanceModifierProfiles: [],
        activeStanceModifierProfileIds: [],
        stateModifierProfiles: [],
        activeStateModifierProfileIds: [],
        otherModifierProfiles: [],
        activeOtherModifierProfileIds: [],
      },
      explanation: 'Zwiad i obrona w walce na dystans.',
      warnings: ['Sprawdź wyposażenie przed sesją.'],
    },
    validationIssues: [],
    referenceCharacterIds: [],
    provider: 'fixture',
    model: 'fixture',
    promptVersion: 'character-draft-v1',
    generationUsage: null,
    costMicroUsd: 0,
    expiresAt: new Date('2026-11-06T08:00:00Z'),
    acceptedAt: null,
    acceptedCharacterId: null,
    createdAt: now,
    updatedAt: now,
  });
}

export function createDraftCatalog()
{
  return {
    perk: { ...CreateDefaultPerk(), id: '01K7QBNAVF1VY58R2G1ASKYMZ0', name: 'Odporność na mróz' },
    maneuver: { ...CreateDefaultManeuver(), id: '01K7QBNAVF1VY58R2G1ASKYMZ1', name: 'Pchnięcie lodu' },
    stance: { ...CreateDefaultStance(), id: '01K7QBNAVF1VY58R2G1ASKYMZ2', name: 'Garda zwiadowcy' },
    state: { ...CreateDefaultState(), id: '01K7QBNAVF1VY58R2G1ASKYMZ3', name: 'Skupienie' },
    weapon: { ...CreateDefaultWeapon(), id: '01K7QBNAVF1VY58R2G1ASKYMZ4', name: 'Włócznia zwiadowcy' },
    armor: { ...CreateDefaultArmor(), id: '01K7QBNAVF1VY58R2G1ASKYMZ5', name: 'Pancerz zwiadowcy' },
    shield: { ...CreateDefaultShield(), id: '01K7QBNAVF1VY58R2G1ASKYMZ6', name: 'Tarcza zwiadowcy' },
    inventoryItem: { ...CreateDefaultInventoryItem(), id: '01K7QBNAVF1VY58R2G1ASKYMZ7', name: 'Kompas zwiadowcy' },
    mount: { ...CreateDefaultMount(), id: '01K7QBNAVF1VY58R2G1ASKYMZ8', name: 'Koń północy' },
    spell: { ...CreateDefaultSpell(), id: '01K7QBNAVF1VY58R2G1ASKYMZ9', name: 'Powiew lodu' },
    powerSpecificationId: '01K7QBNAVF1VY58R2G1ASKYMZA',
  };
}
