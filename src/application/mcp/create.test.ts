import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { createInput, contextInput } from '@/domain/mcp/writeContracts';
import { creationContext, previewCreation } from './create';
import { characterVisibilityWhere } from '@/persistence/characterVisibility';

const db = vi.hoisted(() => ({
  character: { findFirst: vi.fn(), findMany: vi.fn() },
  aiCharacterDraft: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ default: db }));
vi.mock('@/persistence/ai-character-generation/aiCharacterCatalogRepository', () => ({
  loadAiCharacterCatalog: async () => [], loadAiCharacterRequirements: async () => new Map(),
}));
vi.mock('@/infrastructure/ai-character-generation/createCharacterGenerationProvider', () => ({
  createCharacterGenerationProvider() { throw Error('An application provider was called'); },
}));

describe('chat-authored creation', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    db.character.findMany.mockResolvedValue([]);
    db.aiCharacterDraft.create.mockImplementation(async ({ data }) => {
      const pending = { ...data, status: 'pending', acceptedCharacterId: null };
      db.aiCharacterDraft.findFirst.mockResolvedValue(pending);
      db.aiCharacterDraft.findUnique.mockResolvedValue(pending);
      return pending;
    });
  });
  it('stores a private draft with no provider usage and replays its preview', async () => {
    const fixture = createPendingDraft();
    const input = createInput.parse({ brief: fixture.request, proposal: fixture.proposal, requestId: 'guard' });
    const first = await previewCreation(input, 'test-key');
    const retry = await previewCreation(input, 'test-key');
    expect(retry.revision).toBe(first.revision);
    expect(db.aiCharacterDraft.create).toHaveBeenCalledTimes(1);
    expect(db.aiCharacterDraft.create.mock.calls[0][0].data).toMatchObject({ provider: 'mcp', costMicroUsd: 0, mcpVisibility: 'mine' });
    expect(db.character.findMany.mock.calls[0][0].where).toEqual(characterVisibilityWhere('test-key'));
    expect(first).not.toHaveProperty('apiKeyHash');
  });
  it('serves canonical instructions and a focused proposal schema', async () => {
    const brief = createPendingDraft().request;
    expect(await creationContext(contextInput.parse({ brief, part: 'instructions' }), 'test')).toHaveProperty('instructions');
    expect(await creationContext(contextInput.parse({ brief, part: 'schema', section: 'header' }), 'test')).toHaveProperty('schema');
    expect(db.character.findMany).not.toHaveBeenCalled();
  });
  it('refuses authoring shared catalog records or claiming a stale preview', async () => {
    const draft = createPendingDraft();
    const input = createInput.parse({ requestId: 'guard', brief: draft.request, proposal: draft.proposal });
    await expect(previewCreation({ ...input, brief: { ...input.brief, constraints: { ...input.brief.constraints, allowCustomEquipment: true } } }, 'test')).rejects.toMatchObject({ status: 400 });
    await expect(previewCreation({ ...input, expectedRevision: 'a'.repeat(64) }, 'test')).rejects.toMatchObject({ status: 404 });
    expect(db.aiCharacterDraft.create).not.toHaveBeenCalled();
  });
});
