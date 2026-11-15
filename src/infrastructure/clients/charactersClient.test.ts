import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('./baseClient', () => ({ default: mocks }));
import charactersClient from './charactersClient';

describe('batched character requests', () => {
  beforeEach(() => { mocks.post.mockReset(); });

  it('deduplicates and splits large selections without discarding later characters', async () => {
    const ids = Array.from({ length: 217 }, (_, index) => `character-${index}`);
    mocks.post.mockImplementation(async (_path, body: { ids: string[] }) => ({ data: body.ids.map(id => ({ id })) }));
    const result = await charactersClient.getByIds([...ids, ids[0]]);
    expect(mocks.post.mock.calls.map(([, body]) => body.ids.length)).toEqual([200, 17]);
    expect(result.map(character => character.id)).toEqual(ids);
  });

  it('does not request an empty selection', async () => {
    expect(await charactersClient.getByIds([])).toEqual([]);
    expect(mocks.post).not.toHaveBeenCalled();
  });

  it('fails instead of exposing a successful partial result if a later batch fails', async () => {
    mocks.post.mockResolvedValueOnce({ data: [{ id: 'visible' }] }).mockRejectedValueOnce(new Error('Forbidden'));
    await expect(charactersClient.getByIds(Array.from({ length: 201 }, (_, i) => `id-${i}`))).rejects.toThrow('Forbidden');
  });
});
