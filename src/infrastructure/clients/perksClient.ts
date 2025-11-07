import { PerkDto } from '@/persistence/schemas/characters/perkSchema';
import client from '@/infrastructure/clients/baseClient';

const perkPathSegment = '/perks';

const perksClient = 
{
    //Commands
    add: async (perk: PerkDto): Promise<string> =>
    {
        const response = await client.post(perkPathSegment, perk);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${perkPathSegment}/${id}`);
    },
    update: async (id: string, perkData: PerkDto): Promise<void> =>
    {
        await client.put(`${perkPathSegment}/${id}`, perkData);
    }
}

export default perksClient;