import { NextResponse } from 'next/server';
import { hashApiKey } from '@/lib/apiKeyHash';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { deleteBattlePreset, getBattlePresetById, updateBattlePreset } from '@/persistence/battlePresets/battlePresetsRepository';
import { BattlePresetNotFoundError } from '@/persistence/battlePresets/battlePresetErrors';
import { BattleConfiguration } from '@/domain/battlePresets/BattleConfiguration';

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET is not protected by src/proxy.ts, so validated here — same as
 * /api/battle-presets (list) and /api/personalization.
 */
export async function GET(request: Request, { params }: RouteParams)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string')
  {
    return apiKeyOrResponse;
  }

  const { id } = await params;

  try
  {
    const preset = await getBattlePresetById(id, hashApiKey(apiKeyOrResponse));

    // Deliberately the same 404 whether the id doesn't exist or belongs to
    // a different API key — see BattlePresetNotFoundError and "Otwarte
    // pytania" (question 2) in battle-configurations-implementation-plan.md.
    if (!preset)
    {
      return NextResponse.json({ error: 'Battle preset not found.' }, { status: 404 });
    }

    return NextResponse.json(preset, { status: 200 });
  }
  catch
  {
    return NextResponse.json({ error: 'Failed to load battle preset.' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: RouteParams)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string')
  {
    return apiKeyOrResponse;
  }

  const { id } = await params;

  let payload: { name?: unknown; configuration?: unknown };

  try
  {
    payload = await request.json();
  }
  catch
  {
    return NextResponse.json({ error: 'Invalid battle preset payload.' }, { status: 400 });
  }

  const data: { name?: string; configuration?: BattleConfiguration } = {};

  if (payload.name !== undefined)
  {
    const name = typeof payload.name === 'string' ? payload.name.trim() : '';
    if (!name)
    {
      return NextResponse.json({ error: 'Battle preset name cannot be empty.' }, { status: 400 });
    }
    data.name = name;
  }

  if (payload.configuration !== undefined)
  {
    if (!payload.configuration || typeof payload.configuration !== 'object')
    {
      return NextResponse.json({ error: 'Battle preset configuration is invalid.' }, { status: 400 });
    }
    data.configuration = payload.configuration as BattleConfiguration;
  }

  try
  {
    const updated = await updateBattlePreset(id, hashApiKey(apiKeyOrResponse), data);
    return NextResponse.json(updated, { status: 200 });
  }
  catch (error)
  {
    if (error instanceof BattlePresetNotFoundError)
    {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update battle preset.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string')
  {
    return apiKeyOrResponse;
  }

  const { id } = await params;

  try
  {
    await deleteBattlePreset(id, hashApiKey(apiKeyOrResponse));
    return new NextResponse(null, { status: 204 });
  }
  catch (error)
  {
    if (error instanceof BattlePresetNotFoundError)
    {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete battle preset.' }, { status: 500 });
  }
}
