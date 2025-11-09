import client from '@/infrastructure/clients/baseClient';
import { WeaponDto } from '@/persistence/schemas/characters/equipment/weaponSchema';

const weaponPathSegment = '/equipment/weapons';

const weaponsClient = 
{
    //Commands
    add: async (weapon: WeaponDto): Promise<string> =>
    {
        const response = await client.post(weaponPathSegment, weapon);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${weaponPathSegment}/${id}`);
    },
    update: async (id: string, weaponData: WeaponDto): Promise<void> =>
    {
        await client.put(`${weaponPathSegment}/${id}`, weaponData);
    }
}

export default weaponsClient;
