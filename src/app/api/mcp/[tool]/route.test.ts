import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

vi.mock('@/lib/env', async importOriginal => ({ ...await importOriginal<typeof import('@/lib/env')>(), adminApiKeys: ['test-key'] }));
const { findMany } = vi.hoisted(() => ({ findMany: vi.fn().mockResolvedValue([]) }));
vi.mock('@/lib/prisma', () => ({ default: { character: { findMany } } }));
const call = (tool: string, body: unknown, key = 'test-key') => POST(new Request('http://localhost/api/mcp/' + tool, {
  method: 'POST', headers: { 'x-api-key': key }, body: JSON.stringify(body),
}), { params: Promise.resolve({ tool }) });

describe('local chat API', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('requires opt-in and validates keys for reads', async () => {
    vi.stubEnv('COMPENDIUM_MCP_ENABLED', 'false');
    expect((await call('get_status', {})).status).toBe(404);
    vi.stubEnv('COMPENDIUM_MCP_ENABLED', 'true');
    expect((await call('get_status', {}, '')).status).toBe(401);
    expect((await call('search', {}, 'wrong')).status).toBe(403);
    expect((await (await call('get_status', {})).json()).tools).toHaveLength(8);
  });
  it('scopes character searches and rejects unsupported requests', async () => {
    vi.stubEnv('COMPENDIUM_MCP_ENABLED', 'true');
    expect((await call('search', { kind: 'character', tag: 'walka' })).status).toBe(200);
    expect(findMany.mock.lastCall?.[0].where.AND).toEqual([{ OR: [{ apiKeys: { isEmpty: true } }, { apiKeys: { has: 'test-key' } }] }, { tags: { has: 'walka' } }]);
    expect((await call('search', { kind: 'character', limit: 999 })).status).toBe(400);
    expect((await call('something_else', {})).status).toBe(404);
  });
  it('finds and opens an actual synchronized rulebook section', async () => {
    vi.stubEnv('COMPENDIUM_MCP_ENABLED', 'true');
    const [hit] = await (await call('search', { kind: 'rulebook', limit: 1 })).json();
    const detail = await (await call('get_entry', { kind: 'rulebook', id: hit.id })).json();
    expect(detail.title).toBe(hit.name);
    expect(detail.href).toBe('/rulebook/' + hit.id);
    expect(detail.content.length + detail.subsections.length).toBeGreaterThan(0);
    expect((await call('get_entry', { kind: 'rulebook', id: '../../other' })).status).toBe(404);
  });
});
