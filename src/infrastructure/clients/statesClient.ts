import { ModeDto } from '@/persistence/schemas/characters/combat/modeSchema';
import client from '@/infrastructure/clients/baseClient';

const statePathSegment = '/states';

const statesClient = 
{
    //Commands
    add: async (state: ModeDto): Promise<string> =>
    {
        const response = await client.post(statePathSegment, state);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${statePathSegment}/${id}`);
    },
    update: async (id: string, stateData: ModeDto): Promise<void> =>
    {
        await client.put(`${statePathSegment}/${id}`, stateData);
    }
}

export default statesClient;