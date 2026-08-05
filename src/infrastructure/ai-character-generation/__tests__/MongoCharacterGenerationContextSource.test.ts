import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEmptyCharacter } from '@/domain/characters/Character';

const { getCharactersVisibleToApiKeyByIds } = vi.hoisted(() => ({
  getCharactersVisibleToApiKeyByIds: vi.fn(),
}));

vi.mock('@/persistence/characters/charactersRepository', () => ({
  getCharactersVisibleToApiKeyByIds,
}));

import {
  AiCharacterReferenceUnavailableError,
  MongoCharacterGenerationContextSource,
} from '@/infrastructure/ai-character-generation/MongoCharacterGenerationContextSource';

describe('MongoCharacterGenerationContextSource', () => {
  beforeEach(() => {
    getCharactersVisibleToApiKeyByIds.mockReset();
  });

  it('keeps the requested reference order and removes API-key metadata', async () => {
    const first = { ...CreateEmptyCharacter({
      name: 'Pierwsza',
      shortName: 'P',
      tags: [],
      description: 'Pierwsza referencja',
    }), id: 'first-reference' };
    const second = { ...CreateEmptyCharacter({
      name: 'Druga',
      shortName: 'D',
      tags: [],
      description: 'Druga referencja',
    }), id: 'second-reference' };
    first.apiKeys = ['PRIVATE-KEY'];
    second.apiKeys = ['PRIVATE-KEY'];

    getCharactersVisibleToApiKeyByIds.mockResolvedValue([second, first]);

    const source = new MongoCharacterGenerationContextSource();
    const references = await source.loadReferences({
      apiKey: 'PRIVATE-KEY',
      referenceCharacterIds: [first.id, second.id],
    });

    expect(getCharactersVisibleToApiKeyByIds).toHaveBeenCalledWith(
      [first.id, second.id],
      'PRIVATE-KEY',
    );
    expect(references.map(reference => reference.id)).toEqual([first.id, second.id]);
    expect(references).not.toHaveProperty('0.apiKeys');
    expect(references).not.toHaveProperty('1.apiKeys');
  });

  it('does not reveal whether an unavailable reference is missing or private', async () => {
    getCharactersVisibleToApiKeyByIds.mockResolvedValue([]);

    const source = new MongoCharacterGenerationContextSource();

    await expect(source.loadReferences({
      apiKey: 'PRIVATE-KEY',
      referenceCharacterIds: ['unavailable-reference'],
    })).rejects.toEqual(expect.objectContaining({
      name: AiCharacterReferenceUnavailableError.name,
      message: 'Co najmniej jedna postać referencyjna nie jest dostępna.',
    }));
  });
});
