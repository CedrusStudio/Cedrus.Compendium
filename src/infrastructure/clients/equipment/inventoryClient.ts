import client from '@/infrastructure/clients/baseClient';
import { InventoryItemDto } from '@/persistence/schemas/characters/equipment/itemSchema';

const inventoryPathSegment = '/equipment/inventory';

const inventoryClient = 
{
    //Commands
    add: async (item: InventoryItemDto): Promise<string> =>
    {
        const response = await client.post(inventoryPathSegment, item);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${inventoryPathSegment}/${id}`);
    },
    update: async (id: string, itemData: InventoryItemDto): Promise<void> =>
    {
        await client.put(`${inventoryPathSegment}/${id}`, itemData);
    }
}

export default inventoryClient;
