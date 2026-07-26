import type { Simulation as PrismaSimulation } from '@prisma/client';
import type {
  SavedSimulation,
  SavedSimulationConfiguration,
} from '@/domain/combat-lab/persistence/SavedSimulation';
import type { SimulationSummary } from '@/domain/combat-lab/simulation/RawResult';

/**
 * `configuration` and `result` are stored as native Prisma `Json` fields (Mongo
 * BSON documents — no manual stringify/parse). They round-trip as opaque JSON;
 * we cast back to the domain shapes here. Records are always written by our own
 * code (never user-authored JSON), so we trust the shape but keep the cast
 * localized to this mapping layer.
 */
export function toSavedSimulation(record: PrismaSimulation): SavedSimulation
{
  return {
    id: record.id,
    name: record.name,
    configuration: record.configuration as unknown as SavedSimulationConfiguration,
    result: record.result as unknown as SimulationSummary,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
