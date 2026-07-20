import client from '@/infrastructure/clients/baseClient';
import type {
  SavedSimulation,
  SavedSimulationConfiguration,
  SavedSimulationSummaryRow,
} from '@/domain/combat-lab/persistence/SavedSimulation';
import type { SimulationSummary } from '@/domain/combat-lab/simulation/RawResult';

/** Wire shapes: Date fields travel as ISO strings over JSON (see battlePresetsClient). */
export type SavedSimulationRowDto = Omit<SavedSimulationSummaryRow, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

export type SavedSimulationDto = Omit<SavedSimulation, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

const combatLabClient = {
  async listSimulations(): Promise<SavedSimulationRowDto[]>
  {
    const response = await client.get<SavedSimulationRowDto[]>('/combat-lab/simulations');
    return response.data;
  },

  async getSimulation(id: string): Promise<SavedSimulationDto>
  {
    const response = await client.get<SavedSimulationDto>(`/combat-lab/simulations/${id}`);
    return response.data;
  },

  async saveSimulation(
    name: string,
    configuration: SavedSimulationConfiguration,
    result: SimulationSummary,
  ): Promise<{ id: string }>
  {
    const response = await client.post<{ id: string }>('/combat-lab/simulations', { name, configuration, result });
    return response.data;
  },

  async removeSimulation(id: string): Promise<void>
  {
    await client.delete(`/combat-lab/simulations/${id}`);
  },
};

export default combatLabClient;
