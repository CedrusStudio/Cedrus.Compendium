import { aiCharacterDraftSchema } from '@/domain/ai-character-generation/aiCharacterDraft';
import { CreateEmptyCharacter } from '@/domain/characters/Character';

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
