import { NextResponse } from 'next/server';
import { adminApiKeys } from '@/lib/env';
import { API_KEY_HEADER } from '@/proxy';

/**
 * Reads and validates the `x-api-key` header against the configured admin
 * key pool (`NEXT_API_KEYS` / `adminApiKeys`).
 *
 * Used by GET route handlers, which `src/proxy.ts` deliberately does not
 * protect (its matcher skips `GET` entirely) — so any GET endpoint that
 * needs to scope data per API key (personalization, battle presets) has to
 * do this check itself. Non-GET requests already get this same validation
 * for free from the proxy, so route handlers don't need to call this for
 * POST/PUT/DELETE — see src/proxy.ts.
 *
 * Originally duplicated locally in the personalization route; extracted
 * here when Battle Presets needed the same check, to avoid a third
 * hand-rolled copy (see battle-configurations-implementation-plan.md, Etap 3).
 *
 * Returns the validated key as a string, or a ready-to-return `Response`
 * (401/403) when validation fails — callers should check
 * `typeof result !== 'string'` and return it as-is.
 */
export function getValidatedApiKey(request: Request): string | Response
{
  const apiKey = request.headers.get(API_KEY_HEADER)?.trim();

  if (!apiKey)
  {
    return NextResponse.json({ error: 'Missing API key.' }, { status: 401 });
  }

  if (!adminApiKeys.includes(apiKey))
  {
    return NextResponse.json({ error: 'Invalid API key.' }, { status: 403 });
  }

  return apiKey;
}
