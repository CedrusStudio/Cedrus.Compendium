import client from '@/infrastructure/clients/baseClient';

export type RequirementEntityType =
  | 'spells'
  | 'perks'
  | 'maneuvers'
  | 'stances'
  | 'states';

const requirementsClient =
{
  getEntityRequirements: async (entity: RequirementEntityType): Promise<string[]> =>
  {
    const response = await client.get<string[]>(`/requirements/${entity}`);
    return response.data;
  }
};

export default requirementsClient;