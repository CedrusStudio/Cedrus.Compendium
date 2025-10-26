import { Maneuver } from '@/domain/characters/combat/Maneuver';
import { ManeuverDto } from '@/persistence/schemas/characters/combat/maneuverSchema';
import client from '@/infrastructure/clients/baseClient';

const maneuverPathSegment = '/maneuvers';

const maneuversClient = 
{
    //Queries
    getById: async (id: string): Promise<Maneuver> =>
    {
        const response = await client.get<Maneuver>(`${maneuverPathSegment}/${id}`);
        return response.data;
    },

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