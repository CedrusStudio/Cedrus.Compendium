'use server';

import 'server-only';
import prisma from '@/lib/prisma';
import type { Prisma } from '@prisma/client';
import type {
  SavedSimulation,
  SavedSimulationConfiguration,
  SavedSimulationSummaryRow,
} from '@/domain/combat-lab/persistence/SavedSimulation';
import type { SimulationSummary } from '@/domain/combat-lab/simulation/RawResult';
import { toSavedSimulation } from '@/persistence/combat-lab/simulationMapping';
import { SimulationNotFoundError, SimulationValidationError } from '@/persistence/combat-lab/simulationErrors';

const MAX_SIMULATIONS_PER_API_KEY = 200;

// Queries

export async function getSimulationSummariesForApiKey(apiKeyHash: string): Promise<SavedSimulationSummaryRow[]>
{
  return prisma.simulation.findMany({
    where: { apiKeyHash },
    select: { id: true, name: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Single-record lookup scoped to the API key. Ownership is checked in-memory
 * after the fetch (Prisma/Mongo `findUnique` can't combine the unique lookup
 * with an extra `where`). Returns `null` both when missing and when owned by
 * another key — same non-enumerable behaviour as battlePresetsRepository.
 */
export async function getSimulationById(id: string, apiKeyHash: string): Promise<SavedSimulation | null>
{
  const record = await prisma.simulation.findUnique({ where: { id } });
  if (!record || record.apiKeyHash !== apiKeyHash) return null;
  return toSavedSimulation(record);
}

// Commands

export async function addSimulation(
  apiKeyHash: string,
  name: string,
  configuration: SavedSimulationConfiguration,
  result: SimulationSummary,
): Promise<string>
{
  const existingCount = await prisma.simulation.count({ where: { apiKeyHash } });

  if (existingCount >= MAX_SIMULATIONS_PER_API_KEY)
  {
    throw new SimulationValidationError(`Simulation limit reached (${MAX_SIMULATIONS_PER_API_KEY} per API key).`);
  }

  const created = await prisma.simulation.create({
    data: {
      name,
      apiKeyHash,
      configuration: configuration as unknown as Prisma.InputJsonValue,
      result: result as unknown as Prisma.InputJsonValue,
    },
  });

  return created.id;
}

/**
 * Deletes only a record owned by the requesting API key — a guessed/observed id
 * must not let another key delete it.
 */
export async function deleteSimulation(id: string, apiKeyHash: string): Promise<void>
{
  const existing = await prisma.simulation.findUnique({ where: { id } });

  if (!existing || existing.apiKeyHash !== apiKeyHash)
  {
    throw new SimulationNotFoundError(id);
  }

  await prisma.simulation.delete({ where: { id } });
}
