import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const constructed = vi.hoisted(() => vi.fn());
vi.mock('@prisma/client', () => ({ PrismaClient: class { constructor() { constructed(); } } }));

describe('development database client reuse', () => {
  beforeEach(() => { vi.resetModules(); constructed.mockClear(); vi.stubGlobal('prisma', undefined); vi.stubEnv('NODE_ENV', 'development'); });
  afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
  it('retains one connection pool across hot module reloads', async () => {
    const first = (await import('../prisma')).default;
    vi.resetModules();
    const second = (await import('../prisma')).default;
    expect(first).toBe(second);
    expect(constructed).toHaveBeenCalledTimes(1);
  });
});
