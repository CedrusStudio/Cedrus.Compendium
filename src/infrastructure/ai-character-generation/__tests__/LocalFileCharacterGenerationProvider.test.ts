import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { POWER_SCALES } from '@/domain/ai-character-generation/powerTiers';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  LocalFileCharacterGenerationProvider,
  LocalFileCharacterGenerationProviderError,
} from '@/infrastructure/ai-character-generation/LocalFileCharacterGenerationProvider';

const context = {
  request: {
    description: 'Wojak Arnold służący baronowi Ertranowi.',
    referenceCharacterIds: [],
    constraints: {
      language: 'pl-PL' as const,
      allowCustomEquipment: false,
      allowCustomAbilities: false,
    },
  },
  references: [],
  allowedCatalog: { availability: 'not-configured' as const, entries: [] },
  rulebookContext: { availability: 'not-configured' as const, fragments: [] },
  balanceProfiles: [],
  // The warrior ladder is the default family; the tests do not exercise it.
  powerScale: POWER_SCALES[0],
};

function validProposal() {
  return {
    header: { name: 'Arnold', shortName: 'Arnold', description: 'Wojak barona.', tags: ['wojownik'], raceId: null },
    perks: [],
    statistics: {
      characteristics: Object.fromEntries(
        ['strength', 'dexterity', 'constitution', 'mind', 'charisma', 'spellborn']
          .map(key => [key, { grade: 1, value: 1, bonus: 0, testBonus: 0 }]),
      ),
      attributes: Object.fromEntries(
        ['fencing', 'artifice', 'precision', 'initiative', 'martialArt', 'horsemanship', 'fortitude', 'reflex', 'willpower']
          .map(key => [key, { grade: 1, value: 1, bonus: 0, testBonus: 0 }]),
      ),
    },
    talents: { talents: [] },
    equipment: { weapons: [], armors: [], shields: [], inventory: [], mounts: [] },
    combat: {
      health: { barrier: 0, vitality: 10, toughness: 0, recoveryLevel: 0, lethalHealth: 0, lethalRounds: 0, bonus: 0 },
      defenses: [], defaultDefenseId: null,
      stances: [], states: [], maneuvers: [],
      offenses: [], defaultOffenseId: null,
      powers: [],
    },
    buffs: {
      buffProfiles: [], activeBuffProfileIds: [],
      stanceModifierProfiles: [], activeStanceModifierProfileIds: [],
      stateModifierProfiles: [], activeStateModifierProfileIds: [],
      otherModifierProfiles: [], activeOtherModifierProfileIds: [],
    },
    explanation: 'Prosty wojownik zgodny z opisem.',
    warnings: [],
  };
}

describe('LocalFileCharacterGenerationProvider', () => {
  let workspaceDirectory: string;

  beforeEach(() => {
    workspaceDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'ai-workspace-'));
  });

  afterEach(() => fs.rmSync(workspaceDirectory, { recursive: true, force: true }));

  function createProvider() {
    return new LocalFileCharacterGenerationProvider({ workspaceDirectory, model: 'local-file' });
  }

  function writeDraft(proposal: unknown) {
    fs.mkdirSync(path.join(workspaceDirectory, 'drafts'), { recursive: true });
    fs.writeFileSync(path.join(workspaceDirectory, 'drafts', 'draft.json'), JSON.stringify(proposal));
  }

  it('reports a missing draft instead of waiting for one', async () => {
    await expect(createProvider().generate(context)).rejects.toMatchObject({
      name: 'LocalFileCharacterGenerationProviderError',
      reason: 'missing_draft',
    });
  });

  it('writes the request context so the draft has something to answer', async () => {
    await expect(createProvider().generate(context)).rejects.toBeInstanceOf(LocalFileCharacterGenerationProviderError);

    const written = fs.readdirSync(path.join(workspaceDirectory, 'requests'));
    expect(written).toHaveLength(1);
    expect(JSON.parse(fs.readFileSync(path.join(workspaceDirectory, 'requests', written[0]), 'utf8')))
      .toMatchObject({ request: { description: context.request.description } });
  });

  it('loads a prepared draft and charges nothing for it', async () => {
    writeDraft(validProposal());

    await expect(createProvider().generate(context)).resolves.toMatchObject({
      costMicroUsd: 0,
      usage: { inputTokens: 0, outputTokens: 0 },
      proposal: { header: { shortName: 'Arnold' } },
    });
  });

  it('applies the same identifier rules as the hosted providers', async () => {
    writeDraft({
      ...validProposal(),
      equipment: {
        ...validProposal().equipment,
        weapons: [{ id: 'wymyslony-miecz', name: 'Miecz', description: 'x', tags: [], style: 'a', range: 0 }],
      },
    });

    const result = await createProvider().generate(context);

    // The request did not allow authoring, so gear outside the compendium goes.
    expect(result.proposal.equipment.weapons).toHaveLength(0);
  });

  it('rejects a draft that is not valid JSON', async () => {
    fs.mkdirSync(path.join(workspaceDirectory, 'drafts'), { recursive: true });
    fs.writeFileSync(path.join(workspaceDirectory, 'drafts', 'draft.json'), '{ nope');

    await expect(createProvider().generate(context)).rejects.toMatchObject({ reason: 'unreadable_draft' });
  });

  it('rejects a draft that does not match the character contract', async () => {
    writeDraft({ header: { name: 'Arnold' } });

    await expect(createProvider().generate(context)).rejects.toMatchObject({ reason: 'invalid_draft' });
  });

  it('keeps the prepared draft after loading it', async () => {
    // A file that vanished the moment it was read would be unrecoverable if the
    // review then went badly.
    writeDraft(validProposal());
    const provider = createProvider();

    await provider.generate(context);

    expect(fs.existsSync(provider.preparedDraftFile)).toBe(true);
  });

  it('throws the prepared draft away when asked', async () => {
    writeDraft(validProposal());
    const provider = createProvider();

    expect(provider.discardPreparedDraft()).toBe(true);
    expect(fs.existsSync(provider.preparedDraftFile)).toBe(false);
    // And the next load is back to reporting there is nothing prepared.
    await expect(provider.generate(context)).rejects.toMatchObject({ reason: 'missing_draft' });
  });

  it('says so when there was nothing to throw away', () => {
    expect(createProvider().discardPreparedDraft()).toBe(false);
  });
});
