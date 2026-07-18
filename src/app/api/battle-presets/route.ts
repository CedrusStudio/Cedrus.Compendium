import { NextResponse } from 'next/server';
import { hashApiKey } from '@/lib/apiKeyHash';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { addBattlePreset, getBattlePresetSummariesForApiKey } from '@/persistence/battlePresets/battlePresetsRepository';
import { BattlePresetValidationError } from '@/persistence/battlePresets/battlePresetErrors';
import { BattleConfiguration } from '@/domain/battlePresets/BattleConfiguration';

/**
 * GET is not protected by src/proxy.ts (its matcher skips GET entirely), so
 * this handler validates `x-api-key` itself — same reasoning as
 * /api/personalization (see src/lib/apiKeyValidation.ts).
 */
export async function GET(request: Request)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string')
  {
    return apiKeyOrResponse;
  }

  try
  {
    const presets = await getBattlePresetSummariesForApiKey(hashApiKey(apiKeyOrResponse));
    return NextResponse.json(presets, { status: 200 });
  }
  catch
  {
    return NextResponse.json({ error: 'Failed to load battle presets.' }, { status: 500 });
  }
}

/**
 * POST already gets its API-key check for free from src/proxy.ts (matcher
 * `'/api/((?!search).*)'` covers non-GET requests on this path) — but the
 * handler still needs the raw header value itself to know which API key the
 * new preset belongs to, since the proxy only validates it, it doesn't pass
 * it along.
 */
export async function POST(request: Request)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string')
  {
    return apiKeyOrResponse;
  }

  let payload: { name?: unknown; configuration?: unknown };

  try
  {
    payload = await request.json();
  }
  catch
  {
    return NextResponse.json({ error: 'Invalid battle preset payload.' }, { status: 400 });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';

  if (!name)
  {
    return NextResponse.json({ error: 'Battle preset name is required.' }, { status: 400 });
  }

  if (!payload.configuration || typeof payload.configuration !== 'object')
  {
    return NextResponse.json({ error: 'Battle preset configuration is required.' }, { status: 400 });
  }

  try
  {
    const id = await addBattlePreset(hashApiKey(apiKeyOrResponse), name, payload.configuration as BattleConfiguration);
    return NextResponse.json({ id }, { status: 201 });
  }
  catch (error)
  {
    if (error instanceof BattlePresetValidationError)
    {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to save battle preset.' }, { status: 500 });
  }
}
