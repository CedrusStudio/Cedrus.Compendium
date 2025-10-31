import { ManeuverDto } from '@/persistence/schemas/characters/combat/maneuverSchema';
import client from '@/infrastructure/clients/baseClient';

const maneuverPathSegment = '/maneuvers';

const maneuversClient = 
{
    //Commands
    add: async (maneuver: ManeuverDto): Promise<string> =>
    {
        const response = await client.post(maneuverPathSegment, maneuver);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${maneuverPathSegment}/${id}`);
    },
    update: async (id: string, maneuverData: ManeuverDto): Promise<void> =>
    {
        await client.put(`${maneuverPathSegment}/${id}`, maneuverData);
    }
}

export default maneuversClient;