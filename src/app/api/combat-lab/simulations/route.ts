import { NextResponse } from 'next/server';
import { hashApiKey } from '@/lib/apiKeyHash';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { addSimulation, getSimulationSummariesForApiKey } from '@/persistence/combat-lab/simulationsRepository';
import { SimulationValidationError } from '@/persistence/combat-lab/simulationErrors';
import type { SavedSimulationConfiguration } from '@/domain/combat-lab/persistence/SavedSimulation';
import type { SimulationSummary } from '@/domain/combat-lab/simulation/RawResult';

/**
 * GET is not protected by src/proxy.ts (its matcher skips GET), so validate
 * `x-api-key` here — same as /api/battle-presets and /api/personalization.
 */
export async function GET(request: Request)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  try
  {
    const rows = await getSimulationSummariesForApiKey(hashApiKey(apiKeyOrResponse));
    return NextResponse.json(rows, { status: 200 });
  }
  catch
  {
    return NextResponse.json({ error: 'Failed to load simulations.' }, { status: 500 });
  }
}

export async function POST(request: Request)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  let payload: { name?: unknown; configuration?: unknown; result?: unknown };

  try
  {
    payload = await request.json();
  }
  catch
  {
    return NextResponse.json({ error: 'Invalid simulation payload.' }, { status: 400 });
  }

  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (!name)
  {
    return NextResponse.json({ error: 'Simulation name is required.' }, { status: 400 });
  }

  if (!payload.configuration || typeof payload.configuration !== 'object')
  {
    return NextResponse.json({ error: 'Simulation configuration is required.' }, { status: 400 });
  }

  if (!payload.result || typeof payload.result !== 'object')
  {
    return NextResponse.json({ error: 'Simulation result is required.' }, { status: 400 });
  }

  try
  {
    const id = await addSimulation(
      hashApiKey(apiKeyOrResponse),
      name,
      payload.configuration as SavedSimulationConfiguration,
      payload.result as SimulationSummary,
    );
    return NextResponse.json({ id }, { status: 201 });
  }
  catch (error)
  {
    if (error instanceof SimulationValidationError)
    {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save simulation.' }, { status: 500 });
  }
}
