import { describe, expect, it } from 'vitest';
import { toBattlePreset } from '@/persistence/battlePresets/battlePresetMapping';

describe('toBattlePreset', () => {
  it('maps a well-formed record and drops apiKeyHash', () => {
    const record = {
      id: 'preset-1',
      name: 'Raid Test Setup',
      apiKeyHash: 'some-hash',
      configuration: {
        characterIds: ['char-1', 'char-2'],
        initiatives: { 'char-1': { initiative: 12 } },
        externalParticipants: [],
        duplicatedCharacterRefs: [],
      },
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    };

    const result = toBattlePreset(record as never);

    expect(result).toEqual({
      id: 'preset-1',
      name: 'Raid Test Setup',
      configuration: record.configuration,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
    expect(result).not.toHaveProperty('apiKeyHash');
  });

  it('falls back to an empty configuration for a malformed/legacy configuration value', () => {
    const record = {
      id: 'preset-2',
      name: 'Legacy Preset',
      apiKeyHash: 'some-hash',
      configuration: 'not-an-object',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toBattlePreset(record as never);

    expect(result.configuration).toEqual({
      characterIds: [],
      initiatives: {},
      externalParticipants: [],
      duplicatedCharacterRefs: [],
    });
  });

  it('fills in individually missing configuration fields instead of discarding the whole record', () => {
    const record = {
      id: 'preset-3',
      name: 'Partial Preset',
      apiKeyHash: 'some-hash',
      configuration: { characterIds: ['char-1'] },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = toBattlePreset(record as never);

    expect(result.configuration).toEqual({
      characterIds: ['char-1'],
      initiatives: {},
      externalParticipants: [],
      duplicatedCharacterRefs: [],
    });
  });
});
