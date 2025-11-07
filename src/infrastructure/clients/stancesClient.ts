import { ModeDto } from '@/persistence/schemas/characters/combat/modeSchema';
import client from '@/infrastructure/clients/baseClient';

const stancePathSegment = '/stances';

const stancesClient = 
{
    //Commands
    add: async (stance: ModeDto): Promise<string> =>
    {
        const response = await client.post(stancePathSegment, stance);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${stancePathSegment}/${id}`);
    },
    update: async (id: string, stanceData: ModeDto): Promise<void> =>
    {
        await client.put(`${stancePathSegment}/${id}`, stanceData);
    }
}

export default stancesClient;