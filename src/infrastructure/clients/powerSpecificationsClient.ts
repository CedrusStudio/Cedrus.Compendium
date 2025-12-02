import client from '@/infrastructure/clients/baseClient';
import { PowerSpecificationDto } from '@/persistence/schemas/characters/combat/powerSchema';

const powerSpecificationPathSegment = '/powers/specifications';

const powerSpecificationsClient = 
{
    //Queries
    get: async (id: string): Promise<PowerSpecificationDto> =>
    {
        const response = await client.get(`${powerSpecificationPathSegment}/${id}`);
        return response.data;
    },
    //Commands
    add: async (powerSpecification: PowerSpecificationDto): Promise<string> =>
    {
        const response = await client.post(powerSpecificationPathSegment, powerSpecification);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${powerSpecificationPathSegment}/${id}`);
    },
    update: async (id: string, powerSpecificationData: PowerSpecificationDto): Promise<void> =>
    {
        await client.put(`${powerSpecificationPathSegment}/${id}`, powerSpecificationData);
    }
}

export default powerSpecificationsClient;