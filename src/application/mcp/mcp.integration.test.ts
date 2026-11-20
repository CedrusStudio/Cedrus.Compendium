import { readCreation } from '@/application/mcp/readCreation';
import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
const testUrl = vi.hoisted(() => {
  const url = process.env.MCP_TEST_DATABASE_URL;
  if (url) {
    const location = new URL(url);
    if (location.protocol !== 'mongodb:' || location.hostname !== '127.0.0.1' || !/^\/cedrus_data_change_test_[a-f0-9]{32}$/.test(location.pathname))
      throw new Error('MCP integration requires an isolated local replica set.');
    process.env.DATABASE_CONNECTION_STRING = url;
  }
  return url;
});
import prisma from '@/lib/prisma';
import { createPendingDraft } from '@/__tests__/fixtures/aiCharacterDraft';
import { createInput, editInput } from '@/domain/mcp/writeContracts';
import { previewCreation } from './create';
import { applyEdit, previewEdit, readEdit } from './edit';
import { acceptAiCharacterDraft } from '@/application/ai-character-generation/acceptAiCharacterDraft';
import { readEntry } from './read';

vi.mock('@/infrastructure/ai-character-generation/createCharacterGenerationProvider', () => ({
  createCharacterGenerationProvider() { throw new Error('MCP invoked an application provider'); },
}));

describe.skipIf(!testUrl)('MCP character lifecycle on MongoDB', () => {
  async function fixture() {
    const key = 'mcp-fixture-' + randomUUID();
    const draft = createPendingDraft();
    const preview = await previewCreation(createInput.parse({ brief: draft.request, requestId: 'create',
      proposal: { ...draft.proposal, header: { ...draft.proposal!.header, name: key, shortName: key.slice(-12) } } }), key);
    const save = () => acceptAiCharacterDraft({ draftId: preview.changeId, apiKey: key, reviewedRevision: preview.revision });
    const characterId = await save();
    return { key, preview, characterId, save };
  }
  it('creates once, applies requested visibility and scopes lookup by key', async () => {
    const { key, preview, characterId, save } = await fixture();
    expect(await save()).toBe(characterId);
    expect(await prisma.character.findUniqueOrThrow({ where: { id: characterId }, select: { apiKeys: true } })).toEqual({ apiKeys: [key] });
    await expect(readCreation(preview.changeId, 'other')).rejects.toMatchObject({ status: 404 });
    await expect(readEntry({ kind: 'character', id: characterId }, 'other')).rejects.toMatchObject({ status: 404 });
  });
  it('preserves unrelated changes, rejects a stale edit and supports retry', async () => {
    const { key, characterId } = await fixture();
    const input = editInput.parse({ requestId: 'edit', characterId, operations: [
      { op: 'description', value: 'Updated description.' }, { op: 'statistic', statistic: 'dexterity', component: 'value', value: 4 },
    ] });
    const edit = await previewEdit(input, key);
    await prisma.character.update({ where: { id: characterId }, data: { description: 'Edited in UI.', tags: ['test-ui'] } });
    await expect(applyEdit(edit.changeId, edit.revision, key)).rejects.toMatchObject({ status: 409 });
    const refreshed = await previewEdit({ ...input, expectedRevision: edit.revision }, key);
    await applyEdit(refreshed.changeId, refreshed.revision, key);
    expect((await applyEdit(refreshed.changeId, refreshed.revision, key)).status).toBe('accepted');
    expect(await prisma.character.findUniqueOrThrow({ where: { id: characterId } })).toMatchObject({
      description: 'Updated description.', tags: ['test-ui'], characteristics: { dexterity: { value: 4 } },
    });
    await expect(readEdit(edit.changeId, 'other')).rejects.toMatchObject({ status: 404 });
  });
  it('commits compound membership edits and rejects removed catalog entries atomically', async () => {
    const { key, characterId } = await fixture();
    const addManeuver = () => prisma.maneuver.create({ data: {
      name: 'MCP fixture ' + randomUUID(), description: 'Fixture maneuver.', grade: 1,
      price: 1, tags: [], characterIds: [], castTime: 'Standardowa', cooldown: 0,
    } });
    const maneuver = await addManeuver();
    const other = await addManeuver();
    const preview = (entityId: string, description: string) => previewEdit(editInput.parse({
      requestId: randomUUID(), characterId, operations: [
        { op: 'description', value: description }, { op: 'membership', kind: 'maneuvers', entityId, present: true },
      ],
    }), key);
    const edit = await preview(maneuver.id, 'First reviewed description.');
    await applyEdit(edit.changeId, edit.revision, key);
    expect(await prisma.character.findUniqueOrThrow({ where: { id: characterId } })).toMatchObject({
      description: 'First reviewed description.', maneuversIds: [maneuver.id],
    });
    const stale = await preview(other.id, 'Uncommitted description.');
    await prisma.maneuver.delete({ where: { id: other.id } });
    await expect(applyEdit(stale.changeId, stale.revision, key)).rejects.toMatchObject({ status: 404 });
    expect(await prisma.character.findUniqueOrThrow({ where: { id: characterId } })).toMatchObject({
      description: 'First reviewed description.', maneuversIds: [maneuver.id],
    });
  });

});
