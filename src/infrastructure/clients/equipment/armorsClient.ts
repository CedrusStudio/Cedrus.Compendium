import client from '@/infrastructure/clients/baseClient';
import { ArmorDto } from '@/persistence/schemas/characters/equipment/armorSchema';

const armorPathSegment = '/equipment/armors';

const armorsClient = 
{
    //Commands
    add: async (armor: ArmorDto): Promise<string> =>
    {
        const response = await client.post(armorPathSegment, armor);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${armorPathSegment}/${id}`);
    },
    update: async (id: string, armorData: ArmorDto): Promise<void> =>
    {
        await client.put(`${armorPathSegment}/${id}`, armorData);
    }
}

export default armorsClient;
