import client from '@/infrastructure/clients/baseClient';
import { ShieldDto } from '@/persistence/schemas/characters/equipment/shieldSchema';

const shieldPathSegment = '/equipment/shields';

const shieldsClient = 
{
    //Commands
    add: async (shield: ShieldDto): Promise<string> =>
    {
        const response = await client.post(shieldPathSegment, shield);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${shieldPathSegment}/${id}`);
    },
    update: async (id: string, shieldData: ShieldDto): Promise<void> =>
    {
        await client.put(`${shieldPathSegment}/${id}`, shieldData);
    }
}

export default shieldsClient;
