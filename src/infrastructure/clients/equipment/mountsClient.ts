import client from '@/infrastructure/clients/baseClient';
import { MountDto } from '@/persistence/schemas/characters/equipment/mountSchema';

const mountPathSegment = '/equipment/mounts';

const mountsClient = 
{
    //Commands
    add: async (mount: MountDto): Promise<string> =>
    {
        const response = await client.post(mountPathSegment, mount);
        return response.data;
    },
    delete: async (id: string) : Promise<void> =>
    {
        await client.delete(`${mountPathSegment}/${id}`);
    },
    update: async (id: string, mountData: MountDto): Promise<void> =>
    {
        await client.put(`${mountPathSegment}/${id}`, mountData);
    }
}

export default mountsClient;
