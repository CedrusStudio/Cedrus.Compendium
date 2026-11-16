import { afterEach, describe, expect, it, vi } from 'vitest';

const originalEnv = { ...process.env };

const loadEnvModule = async (overrides?: Partial<NodeJS.ProcessEnv>) => {
  vi.resetModules();
  process.env = {
    ...originalEnv,
    NEXT_LANGUAGE: 'pl-PL',
    NEXT_LANGUAGE_FALLBACK: 'en-US',
    NEXT_API_KEYS: '',
    ...overrides,
  };

  return import('@/lib/env');
};

describe('env', () => {
  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it('parses configured API keys and language settings', async () => {
    const envModule = await loadEnvModule({
      NEXT_LANGUAGE: 'de-DE',
      NEXT_LANGUAGE_FALLBACK: 'fr-FR',
      NEXT_API_KEYS: ' alpha, beta , ,gamma ',
    });

    expect(envModule.languageSettings).toEqual({
      NEXT_LANGUAGE: 'de-DE',
      NEXT_LANGUAGE_FALLBACK: 'fr-FR',
    });
    expect(envModule.adminApiKeys).toEqual(['alpha', 'beta', 'gamma']);
  });

  it('returns an empty API key list when NEXT_API_KEYS is missing', async () => {
    const envModule = await loadEnvModule({ NEXT_API_KEYS: undefined });

    expect(envModule.adminApiKeys).toEqual([]);
  });

  it('throws when language environment variables are invalid', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(loadEnvModule({ NEXT_LANGUAGE: 'invalid-language' as never })).rejects.toThrow(
      'Invalid environment variables',
    );
    expect(errorSpy).toHaveBeenCalled();
  });
});
