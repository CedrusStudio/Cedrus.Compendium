import client from '@/infrastructure/clients/baseClient';

export type EntityType = 
  | 'characters'
  | 'weapons' 
  | 'armors'
  | 'shields'
  | 'spells'
  | 'perks'
  | 'races'
  | 'maneuvers'
  | 'stances'
  | 'states'
  | 'inventory'
  | 'mounts'
  | 'powerSpecifications';

const tagsClient = 
{
  getEntityTags: async (entity: EntityType): Promise<string[]> =>
  {
    const response = await client.get<string[]>(`/tags/${entity}`);
    return response.data;
  }
};

export default tagsClient;
