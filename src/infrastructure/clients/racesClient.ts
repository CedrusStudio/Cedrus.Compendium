import { RaceDto } from '@/persistence/schemas/characters/raceSchema';
import client from '@/infrastructure/clients/baseClient';

const racePathSegment = '/races';

const racesClient = 
{
    //Commands
    add: async (race: RaceDto): Promise<string> =>
    {
        const response = await client.post(racePathSegment, race);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${racePathSegment}/${id}`);
    },
    update: async (id: string, raceData: RaceDto): Promise<void> =>
    {
        await client.put(`${racePathSegment}/${id}`, raceData);
    }
}

export default racesClient;
