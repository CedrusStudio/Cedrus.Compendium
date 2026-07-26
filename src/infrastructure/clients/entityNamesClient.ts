import client from '@/infrastructure/clients/baseClient';
import type { EntityRequirementGroup } from '@/domain/requirements/Requirement';

const entityNamesClient =
{
  getEntityNames: async (group: EntityRequirementGroup): Promise<string[]> =>
  {
    const response = await client.get<string[]>(`/entity-names/${group}`);
    return response.data;
  },
};

export default entityNamesClient;
