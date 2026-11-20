import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hashApiKey } from '@/lib/apiKeyHash';
import { editInput } from '@/domain/mcp/writeContracts';
import { CreateEmptyCharacter } from '@/domain/characters/Character';
import { previewEdit, applyEdit } from './edit';

const db = vi.hoisted(() => ({
  character: { findUnique: vi.fn(), update: vi.fn() },
  maneuver: { findUnique: vi.fn() },
  mcpCharacterEdit: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
}));
vi.mock('@/lib/prisma', () => ({ default: { ...db, $transaction: (work: (tx: typeof db) => unknown) => work(db) } }));

describe('targeted character edits', () => {
  const key = 'local-fixture-key';
  const card = () => ({
    ...CreateEmptyCharacter({ name: 'Guard', shortName: 'Guard', description: 'Old description', tags: ['guard'] }),
    id: 'guard', apiKeys: [key], perksIds: [], maneuversIds: [], statesIds: [], stancesIds: [],
  });
  const input = editInput.parse({ requestId: 'stable', characterId: 'guard', operations: [
    { op: 'description', value: 'New description' }, { op: 'statistic', statistic: 'dexterity', component: 'value', value: 4 },
  ] });
  beforeEach(() => {
    vi.resetAllMocks();
    db.character.findUnique.mockImplementation(async () => card());
    db.mcpCharacterEdit.create.mockImplementation(async ({ data }) => ({ ...data, acceptedAt: null }));
    db.mcpCharacterEdit.update.mockImplementation(async ({ data }) => ({ ...data, acceptedAt: new Date() }));
  });
  async function prepare() {
    const preview = await previewEdit(input, key);
    const stored = db.mcpCharacterEdit.create.mock.calls[0][0].data;
    db.mcpCharacterEdit.findFirst.mockResolvedValue(stored);
    return preview;
  }
  it('shows the changed cells and keeps an unrelated UI statistic', async () => {
    const preview = await prepare();
    expect(preview.differences).toContainEqual({ field: 'dexterity.value', label: 'dexterity.value', before: 0, after: 4 });
    db.character.findUnique.mockImplementationOnce(async () => {
      const latest = card(); latest.characteristics.strength.bonus = 3; return latest;
    });
    await applyEdit(preview.changeId, preview.revision, key);
    const update = db.character.update.mock.calls[0][0].data;
    expect(update).toMatchObject({ description: 'New description', characteristics: { strength: { bonus: 3 }, dexterity: { value: 4 } } });
    expect(update).not.toHaveProperty('apiKeys');
    expect(update).not.toHaveProperty('tags');
  });
  it('rejects overlapping UI changes before writing anything', async () => {
    const preview = await prepare();
    db.character.findUnique.mockResolvedValueOnce({ ...card(), description: 'Modified in UI' });
    await expect(applyEdit(preview.changeId, preview.revision, key)).rejects.toMatchObject({ status: 409 });
    expect(db.character.update).not.toHaveBeenCalled();
  });
  it('scopes the change to the caller and rejects expired previews', async () => {
    const preview = await prepare();
    const stored = db.mcpCharacterEdit.create.mock.calls[0][0].data;
    db.mcpCharacterEdit.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({ ...stored, expiresAt: new Date(0) });
    await expect(applyEdit(preview.changeId, preview.revision, 'other')).rejects.toMatchObject({ status: 404 });
    expect(db.mcpCharacterEdit.findFirst).toHaveBeenCalledWith({ where: { id: preview.changeId, apiKeyHash: hashApiKey('other') } });
    await expect(applyEdit(preview.changeId, preview.revision, key)).rejects.toMatchObject({ status: 409 });
    expect(db.character.update).not.toHaveBeenCalled();
  });
  it('validates later operations before committing earlier ones and refuses unknown catalog IDs', async () => {
    await expect(previewEdit({ ...input, operations: [...input.operations,
      { op: 'membership', entityId: 'vanished', kind: 'maneuvers', present: true }] }, key)).rejects.toMatchObject({ status: 404 });
    expect(db.character.update).not.toHaveBeenCalled();
    expect(db.mcpCharacterEdit.create).not.toHaveBeenCalled();
  });
});
