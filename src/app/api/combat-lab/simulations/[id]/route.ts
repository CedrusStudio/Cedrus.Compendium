import { NextResponse } from 'next/server';
import { hashApiKey } from '@/lib/apiKeyHash';
import { getValidatedApiKey } from '@/lib/apiKeyValidation';
import { deleteSimulation, getSimulationById } from '@/persistence/combat-lab/simulationsRepository';
import { SimulationNotFoundError } from '@/persistence/combat-lab/simulationErrors';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RouteParams)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  const { id } = await params;

  try
  {
    const simulation = await getSimulationById(id, hashApiKey(apiKeyOrResponse));

    // Same 404 whether missing or owned by another key — see SimulationNotFoundError.
    if (!simulation)
    {
      return NextResponse.json({ error: 'Simulation not found.' }, { status: 404 });
    }

    return NextResponse.json(simulation, { status: 200 });
  }
  catch
  {
    return NextResponse.json({ error: 'Failed to load simulation.' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams)
{
  const apiKeyOrResponse = getValidatedApiKey(request);
  if (typeof apiKeyOrResponse !== 'string') return apiKeyOrResponse;

  const { id } = await params;

  try
  {
    await deleteSimulation(id, hashApiKey(apiKeyOrResponse));
    return NextResponse.json({ ok: true }, { status: 200 });
  }
  catch (error)
  {
    if (error instanceof SimulationNotFoundError)
    {
      return NextResponse.json({ error: 'Simulation not found.' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete simulation.' }, { status: 500 });
  }
}
